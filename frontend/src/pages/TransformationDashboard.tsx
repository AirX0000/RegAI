import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileSpreadsheet, Plus, TrendingUp, Calendar, CheckCircle, Trash2, Upload, Download, FileUp } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
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
    items: any[];
}

export default function TransformationDashboard() {
    const { t } = useTranslation();
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

    // File upload states
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadPreview, setUploadPreview] = useState<any>(null);
    const [dragActive, setDragActive] = useState(false);

    useEffect(() => {
        fetchBalanceSheets();
    }, []);

    const fetchBalanceSheets = async () => {
        try {
            setLoading(true);
            const res = await api.get('/balance-sheets/');
            setBalanceSheets(res.data);

            // Calculate stats
            const draft = res.data.filter((bs: BalanceSheet) => bs.status === 'draft').length;
            const transformed = res.data.filter((bs: BalanceSheet) => bs.status === 'transformed').length;
            const submitted = res.data.filter((bs: BalanceSheet) => bs.status === 'submitted').length;

            setStats({
                total: res.data.length,
                draft,
                transformed,
                submitted
            });
        } catch (error) {
            console.error('Failed to fetch balance sheets', error);
            toast({
                title: t('error'),
                description: t('error_loading_sheets'),
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
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
                description: 'Invalid file type. Please upload .xlsx, .xls, or .csv file',
                variant: 'destructive'
            });
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post('/balance-sheets/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setUploadPreview(response.data);

            if (!response.data.success) {
                toast({
                    title: t('error'),
                    description: response.data.error || 'Failed to parse file',
                    variant: 'destructive'
                });
            } else {
                toast({
                    title: t('success'),
                    description: `File parsed successfully. ${response.data.valid_rows} rows found.`,
                });
            }
        } catch (error: any) {
            console.error('Upload failed', error);
            toast({
                title: t('error'),
                description: error.response?.data?.detail || 'Failed to upload file',
                variant: 'destructive'
            });
        } finally {
            setUploading(false);
        }
    };

    const handleConfirmUpload = async () => {
        if (!uploadPreview || !uploadPreview.items) return;

        try {
            setUploading(true);
            const response = await api.post('/balance-sheets/upload/confirm', {
                items: uploadPreview.items,
                period: new Date().toISOString(),
                notes: `Uploaded from ${selectedFile?.name || 'file'}`
            });

            toast({
                title: t('success'),
                description: `Balance sheet created with ${uploadPreview.items.length} items`,
            });

            setUploadDialogOpen(false);
            setSelectedFile(null);
            setUploadPreview(null);
            fetchBalanceSheets(); // Refresh list
        } catch (error: any) {
            console.error('Confirm upload failed', error);
            toast({
                title: t('error'),
                description: error.response?.data?.detail || 'Failed to create balance sheet',
                variant: 'destructive'
            });
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


    const getStatusBadge = (status: string) => {
        const statusConfig = {
            draft: { color: 'bg-gray-100 text-gray-800', label: t('draft') },
            submitted: { color: 'bg-blue-100 text-blue-800', label: t('submitted') },
            transformed: { color: 'bg-green-100 text-green-800', label: t('transformed') }
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <FileSpreadsheet className="h-8 w-8" />
                        {t('transformation_department')}
                    </h1>
                    <p className="text-gray-500 mt-1">{t('transform_balance_sheets')}</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setUploadDialogOpen(true)} variant="outline" size="lg">
                        <Upload className="mr-2 h-4 w-4" />
                        Import from File
                    </Button>
                    <Button onClick={() => navigate('/transformation/new')} size="lg">
                        <Plus className="mr-2 h-4 w-4" />
                        {t('create_balance_sheet')}
                    </Button>
                </div>
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
                        <Calendar className="h-4 w-4 text-gray-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
                        <p className="text-xs text-muted-foreground">{t('in_progress')}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('submitted')}</CardTitle>
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{stats.submitted}</div>
                        <p className="text-xs text-muted-foreground">{t('pending_transformation')}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('transformed')}</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.transformed}</div>
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
                    {balanceSheets.length === 0 ? (
                        <div className="text-center py-12">
                            <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">{t('no_balance_sheets')}</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {t('get_started_creating_sheet')}
                            </p>
                            <div className="mt-6">
                                <Button onClick={() => navigate('/transformation/new')}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    {t('create_balance_sheet')}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {t('period')}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {t('status')}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {t('items')}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {t('created')}
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {t('actions')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {balanceSheets.map((bs) => (
                                        <tr key={bs.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {new Date(bs.period).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(bs.status)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {bs.items?.length || 0} {t('items_count')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(bs.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-2">
                                                    {bs.status === 'draft' && (
                                                        <>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => navigate(`/transformation/edit/${bs.id}`)}
                                                            >
                                                                {t('edit')}
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleDelete(bs.id, new Date(bs.period).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }))}
                                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                    {bs.status === 'transformed' && (
                                                        <>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => navigate(`/transformation/results/${bs.id}`)}
                                                            >
                                                                {t('view_results')}
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleDelete(bs.id, new Date(bs.period).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }))}
                                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                    {bs.status === 'submitted' && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => navigate(`/transformation/results/${bs.id}`)}
                                                        >
                                                            {t('transform')}
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
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

            {/* Upload Dialog */}
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileUp className="h-5 w-5" />
                            Import Balance Sheet from File
                        </DialogTitle>
                        <DialogDescription>
                            Upload an Excel (.xlsx, .xls) or CSV file with your balance sheet data
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Download Template Button */}
                        <div className="flex justify-end">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDownloadTemplate}
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Download Template
                            </Button>
                        </div>

                        {/* Upload Zone */}
                        {!uploadPreview && (
                            <div
                                className={`border-2 border-dashed rounded-lg p-8 text-center ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                                    }`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                            >
                                <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                <p className="text-lg font-medium mb-2">
                                    Drag and drop your file here
                                </p>
                                <p className="text-sm text-gray-500 mb-4">
                                    or click to browse
                                </p>
                                <input
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    id="file-upload"
                                />
                                <label htmlFor="file-upload">
                                    <Button variant="outline" asChild>
                                        <span>
                                            <Upload className="mr-2 h-4 w-4" />
                                            Choose File
                                        </span>
                                    </Button>
                                </label>
                                {uploading && (
                                    <p className="mt-4 text-sm text-blue-600">
                                        Uploading and parsing file...
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Preview */}
                        {uploadPreview && uploadPreview.success && (
                            <div className="space-y-4">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <h3 className="font-medium text-green-900 mb-2">
                                        ✅ File Parsed Successfully
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-600">File:</span>{' '}
                                            <span className="font-medium">{selectedFile?.name}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Valid Rows:</span>{' '}
                                            <span className="font-medium">{uploadPreview.valid_rows}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Balance Validation */}
                                {uploadPreview.balance_check && (
                                    <div className={`border rounded-lg p-4 ${uploadPreview.balance_check.is_balanced
                                            ? 'bg-green-50 border-green-200'
                                            : 'bg-yellow-50 border-yellow-200'
                                        }`}>
                                        <h3 className="font-medium mb-2">
                                            {uploadPreview.balance_check.is_balanced ? '✅' : '⚠️'} Balance Check
                                        </h3>
                                        <div className="grid grid-cols-3 gap-4 text-sm">
                                            <div>
                                                <div className="text-gray-600">Assets</div>
                                                <div className="font-medium">
                                                    ${uploadPreview.balance_check.total_assets?.toLocaleString()}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-gray-600">Liabilities</div>
                                                <div className="font-medium">
                                                    ${uploadPreview.balance_check.total_liabilities?.toLocaleString()}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-gray-600">Equity</div>
                                                <div className="font-medium">
                                                    ${uploadPreview.balance_check.total_equity?.toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                        {!uploadPreview.balance_check.is_balanced && (
                                            <p className="text-sm text-yellow-700 mt-2">
                                                ⚠️ Warning: Assets ≠ Liabilities + Equity (Difference: $
                                                {uploadPreview.balance_check.difference?.toFixed(2)})
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Errors */}
                                {uploadPreview.errors && uploadPreview.errors.length > 0 && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <h3 className="font-medium text-red-900 mb-2">
                                            ⚠️ Parsing Errors ({uploadPreview.errors.length})
                                        </h3>
                                        <ul className="text-sm text-red-700 space-y-1 max-h-32 overflow-y-auto">
                                            {uploadPreview.errors.slice(0, 10).map((error: string, idx: number) => (
                                                <li key={idx}>• {error}</li>
                                            ))}
                                            {uploadPreview.errors.length > 10 && (
                                                <li className="font-medium">
                                                    ... and {uploadPreview.errors.length - 10} more errors
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                )}

                                {/* Data Preview */}
                                <div>
                                    <h3 className="font-medium mb-2">Data Preview (first 10 rows)</h3>
                                    <div className="border rounded-lg overflow-x-auto max-h-64 overflow-y-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50 sticky top-0">
                                                <tr>
                                                    <th className="px-4 py-2 text-left">Code</th>
                                                    <th className="px-4 py-2 text-left">Account Name</th>
                                                    <th className="px-4 py-2 text-right">Amount</th>
                                                    <th className="px-4 py-2 text-left">Category</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {uploadPreview.items?.slice(0, 10).map((item: any, idx: number) => (
                                                    <tr key={idx} className="hover:bg-gray-50">
                                                        <td className="px-4 py-2">{item.account_code}</td>
                                                        <td className="px-4 py-2">{item.account_name}</td>
                                                        <td className="px-4 py-2 text-right">
                                                            ${item.amount.toLocaleString()}
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${item.category === 'assets' ? 'bg-blue-100 text-blue-800' :
                                                                    item.category === 'liabilities' ? 'bg-red-100 text-red-800' :
                                                                        'bg-green-100 text-green-800'
                                                                }`}>
                                                                {item.category}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {uploadPreview.items?.length > 10 && (
                                        <p className="text-sm text-gray-500 mt-2">
                                            ... and {uploadPreview.items.length - 10} more rows
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setUploadDialogOpen(false);
                                setSelectedFile(null);
                                setUploadPreview(null);
                            }}
                        >
                            Cancel
                        </Button>
                        {uploadPreview && uploadPreview.success && (
                            <Button
                                onClick={handleConfirmUpload}
                                disabled={uploading}
                            >
                                {uploading ? 'Creating...' : 'Confirm & Create Balance Sheet'}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
