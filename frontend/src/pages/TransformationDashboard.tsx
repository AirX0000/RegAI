import { useState, useEffect } from 'react';
import { tr } from '@/lib/i18n';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../lib/api';
import { read, utils } from 'xlsx';
import InteractiveColumnMapper, { BalanceSheetImportItem } from '../components/upload/InteractiveColumnMapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileSpreadsheet, Plus, TrendingUp, Calendar, CheckCircle, Trash2, Upload, Download, FileUp, Server, Building2, Edit3, SlidersHorizontal, Settings2 } from 'lucide-react';
import { OneCSyncDrawer } from '../components/onec/OneCSyncDrawer';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '../context/AuthContext';
import { PERMISSIONS } from '../lib/permissions';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface BalanceSheet {
    id: string;
    period: string;
    status: string;
    created_at: string;
    items?: any[];
    notes?: string;
    company_id?: string;
    company_name?: string;
}

export default function TransformationDashboard() {
    const { user } = useAuth();
    const { t, i18n } = useTranslation();
    const isRu = (i18n.language || 'ru').toLowerCase().startsWith('ru');
    const [balanceSheets, setBalanceSheets] = useState<BalanceSheet[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        draft: 0,
        transformed: 0,
        submitted: 0
    });
    const navigate = useNavigate();
    const { toast } = useToast();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [balanceSheetToDelete, setBalanceSheetToDelete] = useState<{ id: string; period: string } | null>(null);

    // Quick Edit modal state
    const [editSheetOpen, setEditSheetOpen] = useState(false);
    const [editingSheet, setEditingSheet] = useState<{ id: string; period: string; status: string; notes?: string } | null>(null);
    const [editSaving, setEditSaving] = useState(false);

    // File upload states
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [rawRows, setRawRows] = useState<any[][]>([]);
    const [dragActive, setDragActive] = useState(false);
    const [oneCSyncOpen, setOneCSyncOpen] = useState(false);

    useEffect(() => {
        fetchBalanceSheets();
    }, []);

    const fetchBalanceSheets = async () => {
        try {
            setLoading(true);
            const res = await api.get('/balance-sheets/');
            const rawData = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.items) ? res.data.items : []);
            const isSuperadmin = user?.role === 'superadmin' || user?.role === 'website_superadmin';
            const data = isSuperadmin 
                ? rawData 
                : rawData.filter((bs: any) => !user?.company_id || bs.company_id === user?.company_id);
            
            // Normalize status to lowercase
            const normalizedData: BalanceSheet[] = data.map((bs: any) => ({
                ...bs,
                status: (bs.status || 'draft').toLowerCase()
            }));
            setBalanceSheets(normalizedData);

            // Calculate stats with lowercase comparison
            const draft = normalizedData.filter((bs: BalanceSheet) => bs.status === 'draft').length;
            const transformed = normalizedData.filter((bs: BalanceSheet) => bs.status === 'transformed').length;
            const submitted = normalizedData.filter((bs: BalanceSheet) => bs.status === 'submitted').length;

            setStats({
                total: normalizedData.length,
                draft,
                transformed,
                submitted
            });
        } catch (error) {
            console.error('Failed to fetch balance sheets', error);
            setBalanceSheets([]);
            setStats({ total: 0, draft: 0, transformed: 0, submitted: 0 });
            toast({
                title: t('error'),
                description: t('error_loading_sheets'),
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveQuickEdit = async () => {
        if (!editingSheet) return;
        try {
            setEditSaving(true);
            const periodIso = editingSheet.period.includes('T')
                ? editingSheet.period
                : new Date(editingSheet.period + '-01').toISOString();
            const payload = {
                period: periodIso,
                status: (editingSheet.status || 'draft').toLowerCase(),
                notes: editingSheet.notes || ''
            };
            await api.put(`/balance-sheets/${editingSheet.id}`, payload);
            toast({
                title: tr('Сохранено', 'Saved'),
                description: tr('Параметры отчета успешно обновлены', 'Balance sheet updated successfully'),
            });
            setEditSheetOpen(false);
            setEditingSheet(null);
            fetchBalanceSheets();
        } catch (err: any) {
            console.error('Failed to update balance sheet', err);
            toast({
                title: tr('Ошибка', 'Error'),
                description: err?.response?.data?.detail || (tr('Не удалось обновить отчет', 'Failed to update balance sheet')),
                variant: 'destructive',
            });
        } finally {
            setEditSaving(false);
        }
    };

    const handleDelete = async (id: string, period: string) => {
        setBalanceSheetToDelete({ id, period });
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!balanceSheetToDelete) return;

        try {
            await api.delete(`/balance-sheets/${balanceSheetToDelete.id}`);
            toast({
                title: t('success'),
                description: t('balance_sheet_deleted'),
            });
            fetchBalanceSheets(); // Refresh list
        } catch (error) {
            console.error('Failed to delete balance sheet', error);
            toast({
                title: t('error'),
                description: t('error_deleting_sheet'),
                variant: 'destructive'
            });
        } finally {
            setDeleteDialogOpen(false);
            setBalanceSheetToDelete(null);
        }
    };

    // File upload handlers
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            handleFileUpload(file);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const file = e.dataTransfer.files?.[0];
        if (file) {
            setSelectedFile(file);
            handleFileUpload(file);
        }
    };

    const handleFileUpload = async (file: File) => {
        if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
            toast({
                title: t('error'),
                description: tr('Недопустимый формат. Загрузите .xlsx, .xls или .csv', 'Invalid file type. Please upload .xlsx, .xls, or .csv file'),
                variant: 'destructive'
            });
            return;
        }

        setSelectedFile(file);
        setUploading(true);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const bstr = e.target?.result;
                const wb = read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const jsonData = utils.sheet_to_json(ws, { header: 1 }) as any[][];

                if (jsonData && jsonData.length > 0) {
                    setRawRows(jsonData);
                    toast({
                        title: isRu ? "Файл прочитан" : t('success'),
                        description: tr(`Загружено ${jsonData.length} строк. Выберите разметку колонок.`, `Read ${jsonData.length} rows. Please verify column mapping.`),
                    });
                } else {
                    toast({
                        variant: "destructive",
                        title: tr("Файл пуст", "Empty file"),
                        description: tr("Не удалось обнаружить данные в таблице", "No rows found in sheet"),
                    });
                }
            } catch (error) {
                console.error('Error parsing file locally:', error);
                toast({
                    variant: "destructive",
                    title: tr("Ошибка чтения файла", "File read error"),
                    description: tr("Не удалось распарсить Excel документ", "Failed to parse Excel document"),
                });
            } finally {
                setUploading(false);
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleConfirmImportFromMapper = async (items: BalanceSheetImportItem[], period: string, notes: string) => {
        try {
            setUploading(true);
            const res = await api.post('/balance-sheets/', {
                period: period || new Date().toISOString(),
                items: items,
                notes: notes || `Uploaded from ${selectedFile?.name || 'file'}`
            });

            toast({
                title: isRu ? "Баланс успешно создан" : t('success'),
                description: tr(`Загружено ${items.length} статей. Переход к корректировкам...`, `Balance sheet created with ${items.length} items`),
            });

            setUploadDialogOpen(false);
            setSelectedFile(null);
            setRawRows([]);
            fetchBalanceSheets();
            if (res.data?.id) {
                navigate(`/transformation/adjustments/${res.data.id}`);
            }
        } catch (error: any) {
            console.error('Confirm upload failed', error);
            toast({
                title: t('error'),
                description: error.response?.data?.detail || (tr('Не удалось сохранить баланс', 'Failed to create balance sheet')),
                variant: 'destructive'
            });
            throw error;
        } finally {
            setUploading(false);
        }
    };


    const handleDownloadTemplate = async () => {
        try {
            const response = await api.get('/balance-sheets/template', {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'balance_sheet_template.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast({
                title: t('success'),
                description: 'Template downloaded successfully',
            });
        } catch (error) {
            console.error('Template download failed', error);
            toast({
                title: t('error'),
                description: 'Failed to download template',
                variant: 'destructive'
            });
        }
    };


    const getStatusBadge = (statusStr: string) => {
        const status = (statusStr || 'draft').toLowerCase();
        const statusConfig = {
            draft: { color: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700', label: t('draft') || 'Черновик' },
            submitted: { color: 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800', label: t('submitted') || 'Ожидает трансформации' },
            transformed: { color: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800', label: t('transformed') || 'Трансформировано' }
        };
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
        return (
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color}`}>
                {config.label}
            </span>
        );
    };

    if (loading) {
        return <div className="p-8 flex justify-center">{t('loading')}...</div>;
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2 text-slate-900 dark:text-white">
                            <FileSpreadsheet className="h-8 w-8" />
                            {t('transformation_department')}
                        </h1>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-cyan-300 border border-blue-200 dark:border-blue-800">
                            <Building2 className="h-3.5 w-3.5 text-cyan-500" />
                            {user?.role === 'superadmin' ? (tr('Все организации', 'All Organizations')) : (user?.company_name || (user?.company_id === 'b968f7d7ffe04630a90aadde4d0d8e95' ? 'FinServe Holdings' : 'TechCorp Ltd'))}
                        </span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">{t('transform_balance_sheets')}</p>
                </div>
                {PERMISSIONS.canEditTransformation(user?.role) && (
                    <div className="flex flex-wrap gap-2">
                        <Button 
                            onClick={() => setOneCSyncOpen(true)} 
                            variant="outline" 
                            size="lg"
                            className="border-amber-400 text-amber-900 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 font-semibold"
                        >
                            <Server className="mr-2 h-4 w-4 text-amber-600 dark:text-amber-400" />
                            1C:Enterprise Sync
                        </Button>
                        <Button 
                            onClick={() => navigate('/upload')} 
                            variant="outline" 
                            size="lg" 
                            className="border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 font-semibold"
                        >
                            <FileSpreadsheet className="mr-2 h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                            {tr('Умный импорт 1С', 'Smart 1C Mapper')}
                        </Button>
                        <Button onClick={() => setUploadDialogOpen(true)} variant="outline" size="lg" className="border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800">
                            <Upload className="mr-2 h-4 w-4" />
                            {tr('Загрузить файл', 'Import File')}
                        </Button>
                        <Button onClick={() => navigate('/transformation/new')} size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-medium">
                            <Plus className="mr-2 h-4 w-4" />
                            {t('create_balance_sheet')}
                        </Button>
                    </div>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('total_balance_sheets')}</CardTitle>
                        <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground">{t('all_periods')}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('drafts')}</CardTitle>
                        <Calendar className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-600 dark:text-slate-300">{stats.draft}</div>
                        <p className="text-xs text-muted-foreground">{t('in_progress')}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('submitted')}</CardTitle>
                        <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.submitted}</div>
                        <p className="text-xs text-muted-foreground">{t('pending_transformation')}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('transformed')}</CardTitle>
                        <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.transformed}</div>
                        <p className="text-xs text-muted-foreground">{t('mcfo_ifrs_ready')}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Balance Sheets Table */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('balance_sheets')}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {!Array.isArray(balanceSheets) || balanceSheets.length === 0 ? (
                        <div className="text-center py-12">
                            <FileSpreadsheet className="mx-auto h-12 w-12 text-slate-400" />
                            <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-white">{t('no_balance_sheets')}</h3>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                {t('get_started_creating_sheet')}
                            </p>
                            {PERMISSIONS.canEditTransformation(user?.role) && (
                                <div className="mt-6">
                                    <Button onClick={() => navigate('/transformation/new')}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        {t('create_balance_sheet')}
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                            {t('period')}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                            {t('status')}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                            {t('items')}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                            {t('created')}
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                            {t('actions')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
                                    {Array.isArray(balanceSheets) && balanceSheets.map((bs) => {
                                        const normStatus = (bs.status || 'draft').toLowerCase();
                                        return (
                                            <tr 
                                                key={bs.id} 
                                                onClick={() => navigate(`/transformation/edit/${bs.id}`)}
                                                className="hover:bg-blue-50/40 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group"
                                                title={tr('Нажмите для перехода к редактированию статей баланса', 'Click to edit balance sheet')}
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">
                                                    <div className="flex items-center gap-2">
                                                        <span>{new Date(bs.period).toLocaleDateString(isRu ? 'ru-RU' : 'en-US', { month: 'long', year: 'numeric' })}</span>
                                                        <Edit3 className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500" />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getStatusBadge(normStatus)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                                                    {bs.items?.length || 0} {t('items_count')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                                                    {new Date(bs.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                                        {/* 1. Full Edit Button */}
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigate(`/transformation/edit/${bs.id}`);
                                                            }}
                                                            className="border-slate-300 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium flex items-center gap-1.5 shadow-2xs"
                                                            title={tr('Редактировать статьи баланса (Активы, Обязательства, Капитал)', 'Edit balance sheet items')}
                                                        >
                                                            <Edit3 className="h-3.5 w-3.5" />
                                                            {t('edit') || (tr('Редактировать', 'Edit'))}
                                                        </Button>

                                                        {/* 2. Quick Properties Edit Button */}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const dateStr = bs.period ? new Date(bs.period).toISOString().slice(0, 7) : new Date().toISOString().slice(0, 7);
                                                                setEditingSheet({
                                                                    id: bs.id,
                                                                    period: dateStr,
                                                                    status: normStatus,
                                                                    notes: (bs as any).notes || ''
                                                                });
                                                                setEditSheetOpen(true);
                                                            }}
                                                            className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 text-xs px-2"
                                                            title={tr('Быстро изменить период, статус и заметки', 'Quick edit properties')}
                                                        >
                                                            <Settings2 className="h-3.5 w-3.5 text-slate-500" />
                                                            <span className="hidden sm:inline ml-1">{tr('Свойства', 'Props')}</span>
                                                        </Button>

                                                        {/* 3. Adjustments Button */}
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 font-medium flex items-center gap-1"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigate(`/transformation/adjustments/${bs.id}`);
                                                            }}
                                                            title={tr('Корректировки трансформации НСБУ ➔ МСФО', 'Adjustments')}
                                                        >
                                                            <SlidersHorizontal className="h-3.5 w-3.5" />
                                                            <span className="hidden lg:inline">{t('adjustments') || (tr('Корректировки', 'Adjustments'))}</span>
                                                        </Button>

                                                        {/* 4. Results or Transform Button */}
                                                        {normStatus === 'transformed' ? (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    navigate(`/transformation/results/${bs.id}`);
                                                                }}
                                                                className="border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-medium flex items-center gap-1"
                                                                title={tr('Просмотр результатов трансформации в МСФО', 'View Results')}
                                                            >
                                                                <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                                                <span>{t('view_results') || (tr('Результаты', 'Results'))}</span>
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                size="sm"
                                                                className="bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-1 shadow-xs"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    navigate(`/transformation/results/${bs.id}`);
                                                                }}
                                                                title={tr('Выполнить трансформацию в МСФО', 'Transform')}
                                                            >
                                                                <TrendingUp className="h-3.5 w-3.5" />
                                                                <span>{t('transform') || (tr('Трансформировать', 'Transform'))}</span>
                                                            </Button>
                                                        )}

                                                        {/* 5. Delete Button */}
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDelete(bs.id, new Date(bs.period).toLocaleDateString(isRu ? 'ru-RU' : 'en-US', { month: 'long', year: 'numeric' }));
                                                            }}
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 border-slate-200 dark:border-slate-700 px-2"
                                                            title={tr('Удалить отчет', 'Delete')}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('confirm_delete')}</DialogTitle>
                        <DialogDescription>
                            {t('are_you_sure_delete')} {balanceSheetToDelete?.period}?
                            <br />
                            {t('this_action_cannot_be_undone')}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                        >
                            {t('cancel')}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmDelete}
                        >
                            {t('delete')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Quick Edit Dialog */}
            <Dialog open={editSheetOpen} onOpenChange={setEditSheetOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                            <Edit3 className="h-5 w-5 text-blue-600 dark:text-cyan-400" />
                            {tr('Быстрое редактирование отчета', 'Edit Balance Sheet')}
                        </DialogTitle>
                        <DialogDescription>
                            {tr('Измените отчетный период, статус или примечания к балансу.', 'Update the reporting period, status, or notes.')}
                        </DialogDescription>
                    </DialogHeader>

                    {editingSheet && (
                        <div className="space-y-4 py-2">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    {tr('Отчетный период (Месяц / Год)', 'Reporting Period (Month / Year)')}
                                </label>
                                <Input
                                    type="month"
                                    value={editingSheet.period}
                                    onChange={(e) => setEditingSheet({ ...editingSheet, period: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    {tr('Статус отчета', 'Report Status')}
                                </label>
                                <select
                                    value={editingSheet.status}
                                    onChange={(e) => setEditingSheet({ ...editingSheet, status: e.target.value })}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="draft">{tr('Черновик (Draft)', 'Draft')}</option>
                                    <option value="submitted">{tr('Ожидает трансформации (Submitted)', 'Submitted')}</option>
                                    <option value="transformed">{tr('Трансформировано (Transformed)', 'Transformed')}</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    {tr('Заметки / Описание', 'Notes / Description')}
                                </label>
                                <textarea
                                    value={editingSheet.notes || ''}
                                    onChange={(e) => setEditingSheet({ ...editingSheet, notes: e.target.value })}
                                    rows={3}
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder={tr('Дополнительные примечания к балансу...', 'Additional notes...')}
                                />
                            </div>

                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setEditSheetOpen(false);
                                        navigate(`/transformation/edit/${editingSheet.id}`);
                                    }}
                                    className="text-xs text-blue-600 dark:text-cyan-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                                >
                                    <Edit3 className="mr-1.5 h-3.5 w-3.5" />
                                    {tr('Открыть полный редактор статей', 'Open Full Item Editor')}
                                </Button>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => setEditSheetOpen(false)}
                            disabled={editSaving}
                        >
                            {tr('Отмена', 'Cancel')}
                        </Button>
                        <Button
                            onClick={handleSaveQuickEdit}
                            disabled={editSaving}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                        >
                            {editSaving ? (tr('Сохранение...', 'Saving...')) : (tr('Сохранить изменения', 'Save Changes'))}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Upload Dialog with Smart Column Mapper */}
            <Dialog open={uploadDialogOpen} onOpenChange={(open) => {
                setUploadDialogOpen(open);
                if (!open) {
                    setSelectedFile(null);
                    setRawRows([]);
                }
            }}>
                <DialogContent className={rawRows.length > 0 ? "max-w-6xl max-h-[92vh] overflow-y-auto" : "max-w-4xl max-h-[90vh] overflow-y-auto"}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileUp className="h-5 w-5 text-blue-600" />
                            {rawRows.length > 0 
                                ? (tr('Интерактивная разметка колонок ОСВ / 1C', 'Interactive Column Mapper (1C / Excel)'))
                                : (tr('Импорт баланса из файла', 'Import Balance Sheet from File'))}
                        </DialogTitle>
                        <DialogDescription>
                            {rawRows.length > 0
                                ? (tr('Выберите строку заголовка и сопоставьте колонки счетов, дебета и кредита перед импортом.', 'Select header row and verify account codes, debit and credit columns before import.'))
                                : (tr('Загрузите ОСВ или бухгалтерский баланс в формате Excel (.xlsx, .xls) или CSV.', 'Upload an Excel (.xlsx, .xls) or CSV file with your balance sheet data'))}
                        </DialogDescription>
                    </DialogHeader>

                    {rawRows.length > 0 ? (
                        <InteractiveColumnMapper
                            rawData={rawRows}
                            fileName={selectedFile?.name || 'Uploaded File'}
                            onConfirm={handleConfirmImportFromMapper}
                            onCancel={() => {
                                setRawRows([]);
                                setSelectedFile(null);
                            }}
                        />
                    ) : (
                        <div className="space-y-4">
                            {/* Download Template Button */}
                            <div className="flex justify-end">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleDownloadTemplate}
                                    className="border-emerald-600/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-medium"
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    {tr('Скачать шаблон Excel', 'Download Template')}
                                </Button>
                            </div>

                            {/* Upload Zone */}
                            <div
                                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40'
                                    }`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                            >
                                <FileSpreadsheet className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                                <p className="text-lg font-medium mb-2 text-slate-900 dark:text-white">
                                    {tr('Перетащите файл ОСВ сюда', 'Drag and drop your file here')}
                                </p>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                                    {tr('или нажмите кнопку для выбора', 'or click to browse')}
                                </p>
                                <input
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    id="file-upload"
                                />
                                <label htmlFor="file-upload">
                                    <Button variant="outline" asChild className="border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800">
                                        <span>
                                            <Upload className="mr-2 h-4 w-4" />
                                            {tr('Выбрать файл (.xlsx, .csv)', 'Choose File')}
                                        </span>
                                    </Button>
                                </label>
                                {uploading && (
                                    <p className="mt-4 text-sm text-blue-600 dark:text-blue-400 animate-pulse">
                                        {tr('Чтение и анализ структуры таблицы...', 'Uploading and parsing file...')}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {rawRows.length === 0 && (
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setUploadDialogOpen(false);
                                    setSelectedFile(null);
                                    setRawRows([]);
                                }}
                                className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                {tr('Отмена', 'Cancel')}
                            </Button>
                        </DialogFooter>
                    )}
                </DialogContent>
            </Dialog>

            {/* 1C:Enterprise Sync Drawer */}
            <OneCSyncDrawer
                isOpen={oneCSyncOpen}
                onClose={() => setOneCSyncOpen(false)}
                onSyncCompleted={() => {
                    fetchBalanceSheets();
                }}
            />
        </div>
    );
}
