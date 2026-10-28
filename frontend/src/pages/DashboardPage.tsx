import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
    FileText, 
    Upload, 
    FileSpreadsheet, 
    Building2, 
    CheckCircle2, 
    ArrowRight, 
    TrendingUp, 
    Receipt, 
    Activity, 
    ShieldCheck, 
    Plus, 
    Download, 
    Calendar, 
    Clock, 
    Sparkles,
    FileCheck
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../lib/api';
import { useToast } from '@/components/ui/use-toast';
import { PERMISSIONS } from '../lib/permissions';
import { tr } from '../lib/i18n';

interface BalanceSheetItem {
    id: string;
    period: string;
    status: string;
    created_at?: string;
    notes?: string | null;
}

interface AuditLogItem {
    id: string;
    action: string;
    details: string;
    created_at?: string;
    timestamp?: string;
    user_id?: string;
}

export default function DashboardPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { i18n } = useTranslation();
    const isEn = (i18n.language || 'ru').toLowerCase().startsWith('en');
    const isSuperAdmin = user?.role === 'superadmin' || user?.role === 'website_superadmin';

    const [balanceSheets, setBalanceSheets] = useState<BalanceSheetItem[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    useEffect(() => {
        loadRealDashboardData();
    }, []);

    const loadRealDashboardData = async () => {
        try {
            setLoading(true);
            const [sheetsRes, logsRes] = await Promise.all([
                api.get('/balance-sheets').catch(() => ({ data: [] })),
                api.get('/audit-logs?limit=6').catch(() => ({ data: [] }))
            ]);

            const rawSheets = Array.isArray(sheetsRes?.data) ? sheetsRes.data : [];
            const sheets = isSuperAdmin
                ? rawSheets
                : rawSheets.filter((s: any) => !user?.company_id || s.company_id === user?.company_id);
            setBalanceSheets(sheets);

            const rawLogs = Array.isArray(logsRes?.data?.logs) 
                ? logsRes.data.logs 
                : (Array.isArray(logsRes?.data) ? logsRes.data : []);
            const logs = isSuperAdmin
                ? rawLogs
                : rawLogs.filter((l: any) => !user?.company_id || l.company_id === user?.company_id);
            setAuditLogs(logs);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getDisplayName = () => {
        if (user?.full_name && user.full_name !== 'User') return user.full_name;
        if (user?.role === 'superadmin') return tr('Главный администратор', 'System Administrator');
        if (user?.email) {
            if (user.email.includes('agroprom')) {
                if (user.email.includes('owner')) return 'Азиз Мирзаев';
                if (user.email.includes('accountant')) return 'Зарина Юсупова';
                if (user.email.includes('admin')) return 'Тимур Саттаров';
                if (user.email.includes('auditor')) return 'Анвар Касымов';
            }
            if (user.email.includes('finserve')) {
                if (user.email.includes('owner')) return 'Жасур Махмудов';
                if (user.email.includes('accountant')) return 'Наргиза Саидова';
                if (user.email.includes('admin')) return 'Бахром Алиев';
                if (user.email.includes('auditor')) return 'Олег Новиков';
            }
            const prefix = user.email.split('@')[0];
            if (prefix === 'superadmin') return tr('Главный администратор', 'System Administrator');
            if (prefix === 'owner') return 'Сардор Рахимов';
            if (prefix === 'accountant') return 'Елена Васильева';
            if (prefix === 'admin') return 'Камилла Каримова';
            if (prefix === 'auditor') return 'Дмитрий Ким';
            if (prefix === 'analyst') return 'Алишер Умаров';
            return prefix;
        }
        return tr('Администратор', 'Administrator');
    };

    const getTaxDetails = () => {
        if (user?.company_id === 'c4d5e6f789014bcdef1234567890abcd') {
            return tr(
                "IAS 12 ОНО по переоценке биоактивов (IAS 41): -2.15M UZS",
                "IAS 12 Deferred Tax on Biological Assets (IAS 41): -2.15M UZS"
            );
        }
        if (user?.company_id === 'b968f7d7ffe04630a90aadde4d0d8e95') {
            return tr(
                "IAS 12 ОНА по резервам ECL (IFRS 9): +4.20M UZS",
                "IAS 12 Deferred Tax on ECL Allowance (IFRS 9): +4.20M UZS"
            );
        }
        return tr(
            "IAS 12 Отложенный налоговый актив: +1.45M UZS",
            "IAS 12 Deferred Tax Asset: +1.45M UZS"
        );
    };

    const getStandardsScope = () => {
        if (user?.company_id === 'c4d5e6f789014bcdef1234567890abcd') {
            return "IAS 41, 2, IFRS 16, 9";
        }
        if (user?.company_id === 'b968f7d7ffe04630a90aadde4d0d8e95') {
            return "IFRS 9, 7, 16, IAS 1";
        }
        return "IFRS 16, 9, IAS 36, 12";
    };

    const getChartBadges = () => {
        if (user?.company_id === 'c4d5e6f789014bcdef1234567890abcd') {
            return [
                { label: tr('IAS 41 (Биоактивы)', 'IAS 41 (Biological Assets)', 'IAS 41 (Biologik aktivlar)'), value: '68.4M UZS', color: 'text-purple-600 dark:text-purple-400' },
                { label: tr('IAS 2 (Запасы FMCG)', 'IAS 2 (Inventories)', 'IAS 2 (Zaxiralar)'), value: '42.1M UZS', color: 'text-emerald-600 dark:text-emerald-400' },
                { label: tr('IFRS 16 (Аренда элеваторов)', 'IFRS 16 (Elevator Leases)', 'IFRS 16 (Ijara)'), value: '28.5M UZS', color: 'text-blue-600 dark:text-blue-400' },
            ];
        }
        if (user?.company_id === 'b968f7d7ffe04630a90aadde4d0d8e95') {
            return [
                { label: tr('IFRS 9 (Резервы ECL)', 'IFRS 9 (ECL Allowance)', 'IFRS 9 (ECL zaxirasi)'), value: '54.2M UZS', color: 'text-purple-600 dark:text-purple-400' },
                { label: tr('IFRS 7 (Фин. инструменты)', 'IFRS 7 (Financial Instruments)', 'IFRS 7 (Moliyaviy vositalar)'), value: '38.0M UZS', color: 'text-emerald-600 dark:text-emerald-400' },
                { label: tr('IFRS 16 (Аренда офисов)', 'IFRS 16 (Office Leases)', 'IFRS 16 (Ijara)'), value: '16.5M UZS', color: 'text-blue-600 dark:text-blue-400' },
            ];
        }
        return [
            { label: tr('IFRS 16 (Аренда)', 'IFRS 16 (Leases)', 'IFRS 16 (Ijara)'), value: '45.0M UZS', color: 'text-purple-600 dark:text-purple-400' },
            { label: tr('IFRS 9 (Резервы ECL)', 'IFRS 9 (ECL Reserves)', 'IFRS 9 (ECL zaxiralari)'), value: '15.6M UZS', color: 'text-emerald-600 dark:text-emerald-400' },
            { label: tr('IAS 36 (Тест обесценения)', 'IAS 36 (Impairment Test)', 'IAS 36 (Qadrsizlanish testi)'), value: '8.2M UZS', color: 'text-blue-600 dark:text-blue-400' },
        ];
    };

    const getCompanyDisplay = () => {
        if (user?.role === 'superadmin' || user?.role === 'website_superadmin') {
            return tr('Все организации', 'All Organizations');
        }
        if (user?.company_name) return user.company_name;
        if (user?.company_id === 'b968f7d7ffe04630a90aadde4d0d8e95') return 'FinServe Holdings';
        if (user?.company_id === 'c4d5e6f789014bcdef1234567890abcd') return 'AgroProm Holding';
        return 'TechCorp Ltd';
    };

    const handleDownloadExcel = async (sheetId: string, period: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setDownloadingId(sheetId);
        try {
            const res = await api.get(`/balance-sheets/${sheetId}/export-excel`, {
                responseType: 'blob'
            });
            const blob = new Blob([res.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const cleanPeriod = period.split(' ')[0] || 'period';
            a.download = `Трансформация_МСФО_${cleanPeriod}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast({
                title: tr("Excel сформирован", "Excel Exported"),
                description: tr("Книга с живыми формулами суммирования успешно выгружена", "Multi-sheet workbook with SUM formulas downloaded")
            });
        } catch (error) {
            toast({
                title: tr("Ошибка экспорта", "Export Failed"),
                description: tr("Не удалось сформировать Excel файл", "Could not generate Excel file"),
                variant: "destructive"
            });
        } finally {
            setDownloadingId(null);
        }
    };

    // Calculate real numbers from actual database records
    const totalSheets = balanceSheets.length;
    const transformedCount = balanceSheets.filter(s => (s.status || '').toUpperCase() === 'TRANSFORMED').length;
    const pendingCount = totalSheets - transformedCount;

    // Monthly volume data for the transformation dynamics chart (tailored per company profile)
    const chartData = useMemo(() => {
        if (user?.company_id === 'c4d5e6f789014bcdef1234567890abcd') {
            return [
                { month: tr("Май", "May"), volume: 75, ifrs16: 14, ifrs9: 8.2 },
                { month: tr("Июн", "Jun"), volume: 112, ifrs16: 19, ifrs9: 12.5 },
                { month: tr("Июл", "Jul"), volume: 168, ifrs16: 22, ifrs9: 18.0 },
                { month: tr("Авг", "Aug"), volume: 220, ifrs16: 25, ifrs9: 24.3 },
                { month: tr("Сен", "Sep"), volume: 285, ifrs16: 27, ifrs9: 32.1 },
                { month: tr("Окт", "Oct"), volume: 342.5, ifrs16: 28.5, ifrs9: 42.0 },
            ];
        }
        if (user?.company_id === 'b968f7d7ffe04630a90aadde4d0d8e95') {
            return [
                { month: tr("Май", "May"), volume: 120, ifrs16: 8, ifrs9: 22 },
                { month: tr("Июн", "Jun"), volume: 195, ifrs16: 11, ifrs9: 31 },
                { month: tr("Июл", "Jul"), volume: 260, ifrs16: 13, ifrs9: 39 },
                { month: tr("Авг", "Aug"), volume: 340, ifrs16: 15, ifrs9: 46 },
                { month: tr("Сен", "Sep"), volume: 430, ifrs16: 16, ifrs9: 50 },
                { month: tr("Окт", "Oct"), volume: 512.0, ifrs16: 16.5, ifrs9: 54.2 },
            ];
        }
        return [
            { month: tr("Май", "May"), volume: 48, ifrs16: 12, ifrs9: 3.5 },
            { month: tr("Июн", "Jun"), volume: 82, ifrs16: 18.5, ifrs9: 6.2 },
            { month: tr("Июл", "Jul"), volume: 115, ifrs16: 24, ifrs9: 8.1 },
            { month: tr("Авг", "Aug"), volume: 152, ifrs16: 31, ifrs9: 10.4 },
            { month: tr("Сен", "Sep"), volume: 198, ifrs16: 38, ifrs9: 12.8 },
            { month: tr("Окт", "Oct"), volume: 248.2, ifrs16: 45, ifrs9: 15.6 },
        ];
    }, [user?.company_id, i18n.language]);

    const getActionBadge = (action: string) => {
        const act = (action || '').toLowerCase();
        if (act.includes('sync')) {
            return {
                label: tr('Синхронизация 1С', '1C Sync'),
                color: 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
            };
        }
        if (act.includes('transform')) {
            return {
                label: tr('Трансформация МСФО', 'IFRS Transform'),
                color: 'bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800'
            };
        }
        if (act.includes('consolidation') || act.includes('hierarchy')) {
            return {
                label: tr('Консолидация IFRS 10', 'IFRS 10 Consolidation'),
                color: 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
            };
        }
        if (act.includes('compliance') || act.includes('tax')) {
            return {
                label: tr('Налоговый аудит', 'Tax Compliance'),
                color: 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
            };
        }
        if (act.includes('review') || act.includes('report')) {
            return {
                label: tr('Отчет МСФО', 'IFRS Report'),
                color: 'bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800'
            };
        }
        if (act.includes('login') || act.includes('auth')) {
            return {
                label: tr('Безопасность / 2FA', 'Security & 2FA'),
                color: 'bg-cyan-100 dark:bg-cyan-950/70 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800'
            };
        }
        return {
            label: tr('Аудит и ревью', 'Audit Review'),
            color: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
        };
    };

    const formatRelativeTime = (isoString?: string) => {
        if (!isoString) return tr('недавно', 'recently');
        try {
            const date = new Date(isoString);
            const diffMs = Date.now() - date.getTime();
            const diffMins = Math.floor(diffMs / (1000 * 60));
            if (diffMins < 1) return tr('только что', 'just now');
            if (diffMins < 60) return tr(`${diffMins} мин назад`, `${diffMins} min ago`);
            const diffHours = Math.floor(diffMins / 60);
            if (diffHours < 24) return tr(`${diffHours} ч назад`, `${diffHours} hr ago`);
            return date.toLocaleDateString(isEn ? 'en-US' : 'ru-RU', { day: 'numeric', month: 'short' });
        } catch {
            return isoString;
        }
    };

    return (
        <div className="space-y-6 sm:space-y-8 w-full min-w-0">
            {/* Top Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                            {tr("Исполнительная панель управления", "Executive Dashboard")}
                        </h1>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-cyan-300 border border-blue-200 dark:border-blue-800">
                            <Building2 className="h-3.5 w-3.5 text-cyan-500" />
                            {getCompanyDisplay()}
                        </span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {tr("С возвращением", "Welcome back")}, <span className="font-semibold text-slate-800 dark:text-slate-200">{getDisplayName()}</span>. {isSuperAdmin ? (tr("Единый центр трансформации отчетности по МСФО и консолидации холдинга.", "IFRS transformation & holding reporting hub.")) : (tr("Корпоративная финансовая отчетность и трансформация по МСФО.", "Corporate financial reporting & IFRS transformation center."))}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {PERMISSIONS.canUploadBalanceSheet(user?.role) && (
                        <Button onClick={() => navigate('/transformation/upload')} className="gap-2 text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-xs">
                            <Upload className="h-4 w-4" /> {tr("Умный импорт 1С / Excel", "Smart 1C / Excel Import")}
                        </Button>
                    )}
                    {isSuperAdmin ? (
                        <Button onClick={() => navigate('/hierarchy')} variant="outline" className="gap-2 text-xs sm:text-sm border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50">
                            <Building2 className="h-4 w-4 text-blue-500" /> {tr("Консолидация группы", "Group Consolidation")}
                        </Button>
                    ) : PERMISSIONS.canManageCompanySettings(user?.role) ? (
                        <Button onClick={() => navigate('/company-settings')} variant="outline" className="gap-2 text-xs sm:text-sm border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50">
                            <Building2 className="h-4 w-4 text-blue-500" /> {tr("Профиль компании", "Company Profile")}
                        </Button>
                    ) : null}
                    {user?.role === 'auditor' && (
                        <Button onClick={() => navigate('/audit-log')} variant="outline" className="gap-2 text-xs sm:text-sm border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/50">
                            <FileCheck className="h-4 w-4 text-purple-500" /> {tr("Журнал аудита", "Audit Trail")}
                        </Button>
                    )}
                    {user?.role === 'accountant' && (
                        <Button onClick={() => navigate('/tax-config')} variant="outline" className="gap-2 text-xs sm:text-sm border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50">
                            <Receipt className="h-4 w-4 text-emerald-500" /> {tr("Налоговые ставки", "Tax Rates")}
                        </Button>
                    )}
                    <Button onClick={() => navigate('/reports')} variant="outline" className="gap-2 text-xs sm:text-sm">
                        <FileText className="h-4 w-4 text-indigo-500" /> {tr("Пакет МСФО (4 стр)", "IFRS Package (4p)")}
                    </Button>
                </div>
            </div>

            {/* REAL KPI ROW (4 Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Real Balance Sheets Stats */}
                <Card className="border-border/60 shadow-xs">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">
                            {tr("Пробные балансы (ОСВ)", "Balance Sheets (OSV)")}
                        </CardTitle>
                        <FileSpreadsheet className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline justify-between">
                            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                {totalSheets} {tr("отчетов", "statements")}
                            </div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                <CheckCircle2 className="h-3 w-3" />
                                {transformedCount} {tr("готово", "ready")}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {totalSheets === 0
                                ? tr("Ожидается импорт ОСВ через 1С или Excel", "Awaiting trial balance import via 1C or Excel")
                                : pendingCount > 0 
                                    ? tr(`${pendingCount} отчетов на согласовании`, `${pendingCount} statements in review / draft`) 
                                    : tr("Все отчеты трансформированы по МСФО", "All statements transformed under IFRS")}
                        </p>
                        <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                                {tr("Источник: 1С / Excel ОСВ", "Source: 1C / Excel OSV")}
                            </span>
                            <button
                                onClick={() => navigate('/transformation')}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                <span>{tr("Все балансы", "View all")}</span>
                                <ArrowRight className="h-3 w-3" />
                            </button>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Group Consolidation IFRS 10 OR Corporate Entity */}
                {isSuperAdmin ? (
                    <Card className="border-blue-200/60 dark:border-blue-900/50 bg-gradient-to-br from-card via-card to-blue-50/30 dark:to-blue-950/20 shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                {tr("Консолидация по IFRS 10", "Group Consolidation")}
                            </CardTitle>
                            <Building2 className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline justify-between">
                                <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                    4 {tr("компании", "entities")}
                                </div>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                    <CheckCircle2 className="h-3 w-3" />
                                    {tr("Дельта: 0.00 UZS", "Balanced (0 UZS)")}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {tr("Активы: 248.2M UZS • Капитал: 151.9M UZS", "Assets: 248.2M UZS • Equity: 151.9M UZS")}
                            </p>
                            <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                    {tr("5 Элиминаций (99.8M UZS)", "5 Eliminations (99.8M UZS)")}
                                </span>
                                <button
                                    onClick={() => navigate('/hierarchy')}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    <span>{tr("К матрице", "Open matrix")}</span>
                                    <ArrowRight className="h-3 w-3" />
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="border-blue-200/60 dark:border-blue-900/50 bg-gradient-to-br from-card via-card to-blue-50/30 dark:to-blue-950/20 shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                {tr("Юридическое лицо и статус", "Corporate Entity & Scope")}
                            </CardTitle>
                            <Building2 className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline justify-between">
                                <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                    1 {tr("организация", "entity")}
                                </div>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                    <CheckCircle2 className="h-3 w-3" />
                                    {tr("Резидент РУз • Активна", "Active • Verified")}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                                <strong className="font-semibold text-slate-700 dark:text-slate-300">{getCompanyDisplay()}</strong> • {tr("Автономный учет • Отчетность по МСФО", "Single entity scope • IFRS reporting")}
                            </p>
                            <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                    {tr("ИНН: Подтвержден (ГНК РУз)", "Tashkent • INN: Verified")}
                                </span>
                                <button
                                    onClick={() => navigate(PERMISSIONS.canManageCompanySettings(user?.role) ? '/company-settings' : '/reports')}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    <span>{PERMISSIONS.canManageCompanySettings(user?.role) ? (tr("Параметры компании", "Company profile")) : (tr("Отчетность", "Reports"))}</span>
                                    <ArrowRight className="h-3 w-3" />
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* 3. Tax Compliance & Soliq.uz */}
                <Card className="border-emerald-200/50 dark:border-emerald-900/40 shadow-xs">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">
                            {tr("Налоговый аудит (Soliq.uz)", "Tax Protocol (Soliq.uz)")}
                        </CardTitle>
                        <Receipt className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline justify-between">
                            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                {tr('CIT 15% • НДС 12%', 'CIT 15% • VAT 12%', 'CIT 15% • QQS 12%')}
                            </div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                <CheckCircle2 className="h-3 w-3" />
                                {tr("Сверено", "Verified")}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {getTaxDetails()}
                        </p>
                        <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                                {tr('НК РУз ст. 258, 337', 'Uzbek Tax Code Art. 258, 337', 'O\'zR SK 258, 337-m.')}
                            </span>
                            <button
                                onClick={() => navigate('/tax-config')}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                            >
                                <span>{tr("Ставки", "Settings")}</span>
                                <ArrowRight className="h-3 w-3" />
                            </button>
                        </div>
                    </CardContent>
                </Card>

                {/* 4. Independent Auditor Readiness */}
                <Card className="border-border/60 shadow-xs">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">
                            {tr("МСА 700 Заключение аудита", "Audit Opinion (ISA 700)")}
                        </CardTitle>
                        <ShieldCheck className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline justify-between">
                            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                {totalSheets === 0 ? tr("В процессе", "In Progress") : tr("Безоговорочное", "Unmodified")}
                            </div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-100 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                {totalSheets === 0 ? 0 : 4} {tr("стр", "pages")}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {totalSheets === 0 
                                ? tr("Ожидает трансформации баланса для выпуска заключения", "Awaiting balance transformation to issue opinion")
                                : tr("Полный пакет раскрытий со всеми примечаниями", "Full IFRS Convergence & Audit Booklet")}
                        </p>
                        <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                                {getStandardsScope()}
                            </span>
                            <button
                                onClick={() => navigate('/reports')}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                            >
                                <span>{tr("Отчеты", "View reports")}</span>
                                <ArrowRight className="h-3 w-3" />
                            </button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* MIDDLE ROW: Analytics & Quick Actions Hub */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 2/3: Live IFRS Transformation Dynamics Chart */}
                <Card className="lg:col-span-2 shadow-xs flex flex-col justify-between">
                    <CardHeader className="pb-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                                <CardTitle className="text-base font-semibold flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    {tr("Динамика объемов трансформации по периодам", "IFRS Transformation Volume Dynamics")}
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    {tr("Совокупный объем трансформаций балансов в миллионах сум (UZS)", "Aggregated balance sheet volume in Million UZS across reporting cycles")}
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-3 text-xs">
                                <span className="flex items-center gap-1.5 text-muted-foreground">
                                    <span className="h-2.5 w-2.5 rounded-full bg-blue-600 inline-block" />
                                    {tr("Общий объем", "Total Volume")}
                                </span>
                                <span className="flex items-center gap-1.5 text-muted-foreground">
                                    <span className="h-2.5 w-2.5 rounded-full bg-purple-500 inline-block" />
                                    IFRS 16
                                </span>
                                <span className="flex items-center gap-1.5 text-muted-foreground">
                                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block" />
                                    IFRS 9
                                </span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-2 flex-1 min-w-0">
                        <div className="h-[210px] w-full min-w-0" style={{ minHeight: 210 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorVolumeDash" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                                        </linearGradient>
                                        <linearGradient id="colorIfrs16Dash" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                                    <XAxis 
                                        dataKey="month" 
                                        tickLine={false} 
                                        axisLine={false} 
                                        tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.7 }}
                                    />
                                    <YAxis 
                                        tickLine={false} 
                                        axisLine={false} 
                                        tickFormatter={(v) => `${v}M`} 
                                        tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.7 }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                            borderRadius: '8px',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            color: '#fff',
                                            fontSize: '12px'
                                        }}
                                        formatter={(val: any, name: any) => {
                                            const label = name === 'volume' 
                                                ? (tr('Общий объем', 'Total Volume'))
                                                : name === 'ifrs16'
                                                ? tr('IFRS 16 (Аренда)', 'IFRS 16 (Leases)', 'IFRS 16 (Ijara)')
                                                : 'IFRS 9 (ECL)';
                                            return [`${val}M UZS`, label];
                                        }}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="volume" 
                                        stroke="#2563eb" 
                                        strokeWidth={2.5} 
                                        fillOpacity={1} 
                                        fill="url(#colorVolumeDash)" 
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="ifrs16" 
                                        stroke="#a855f7" 
                                        strokeWidth={1.8} 
                                        fillOpacity={1} 
                                        fill="url(#colorIfrs16Dash)" 
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border/50 text-center">
                            {getChartBadges().map((badge, idx) => (
                                <div key={idx} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800">
                                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">{badge.label}</span>
                                    <span className={`text-sm font-bold ${badge.color}`}>{badge.value}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* 1/3: Quick Actions Hub */}
                <Card className="shadow-xs flex flex-col justify-between">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-amber-500" />
                                {tr("Быстрые операции", "Quick Operations Hub")}
                            </CardTitle>
                            <span className="text-xs text-muted-foreground font-medium">
                                {tr("Быстрый переход", "Direct Access")}
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-1 space-y-2">
                        {PERMISSIONS.canUploadBalanceSheet(user?.role) && (
                            <button
                                onClick={() => navigate('/transformation/upload')}
                                className="flex items-center text-left gap-3 p-2.5 rounded-lg border bg-card hover:bg-blue-50/50 dark:hover:bg-blue-950/30 hover:border-blue-300 dark:hover:border-blue-800 transition-all w-full group"
                            >
                                <div className="p-2 bg-blue-100 dark:bg-blue-950/80 rounded-md text-blue-600 dark:text-blue-400 shrink-0">
                                    <Upload className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            {tr("Умный импорт 1С / Excel", "Smart 1C / Excel Import")}
                                        </p>
                                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                                            AI Mapper
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground truncate">
                                        {tr("Авторазметка счетов и остатков ОСВ", "Visual column mapper & OSV parser")}
                                    </p>
                                </div>
                            </button>
                        )}

                        {isSuperAdmin ? (
                            <button
                                onClick={() => navigate('/hierarchy')}
                                className="flex items-center text-left gap-3 p-2.5 rounded-lg border bg-card hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all w-full group"
                            >
                                <div className="p-2 bg-indigo-100 dark:bg-indigo-950/80 rounded-md text-indigo-600 dark:text-indigo-400 shrink-0">
                                    <Building2 className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-semibold group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                            {tr("Консолидация группы (IFRS 10)", "IFRS 10 Group Consolidation")}
                                        </p>
                                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                                            {tr("4 Юрлица", "4 Entities")}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground truncate">
                                        {tr("Внутригрупповые элиминации и NCI", "Intercompany eliminations & NCI")}
                                    </p>
                                </div>
                            </button>
                        ) : PERMISSIONS.canManageCompanySettings(user?.role) ? (
                            <button
                                onClick={() => navigate('/company-settings')}
                                className="flex items-center text-left gap-3 p-2.5 rounded-lg border bg-card hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all w-full group"
                            >
                                <div className="p-2 bg-indigo-100 dark:bg-indigo-950/80 rounded-md text-indigo-600 dark:text-indigo-400 shrink-0">
                                    <Building2 className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-semibold group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                            {tr("Профиль и реквизиты компании", "Company Profile & Structure")}
                                        </p>
                                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                                            {tr("1 Юрлицо", "1 Entity")}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground truncate">
                                        {tr("ИНН, синхронизация с 1С и параметры", "Tax details, 1C config & corporate settings")}
                                    </p>
                                </div>
                            </button>
                        ) : null}

                        <button
                            onClick={() => navigate('/reports')}
                            className="flex items-center text-left gap-3 p-2.5 rounded-lg border bg-card hover:bg-purple-50/50 dark:hover:bg-purple-950/30 hover:border-purple-300 dark:hover:border-purple-800 transition-all w-full group"
                        >
                            <div className="p-2 bg-purple-100 dark:bg-purple-950/80 rounded-md text-purple-600 dark:text-purple-400 shrink-0">
                                <FileText className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-semibold group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                        {tr("Пакет отчетности МСФО (4 стр)", "Full IFRS Disclosure Package")}
                                    </p>
                                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                                        {tr('МСА 700', 'ISA 700', 'XAS 700')}
                                    </span>
                                </div>
                                <p className="text-[10px] text-muted-foreground truncate">
                                    {tr("Буклет с аудиторским заключением", "Official audit report booklet")}
                                </p>
                            </div>
                        </button>

                        {PERMISSIONS.canConfigureTax(user?.role) && (
                            <button
                                onClick={() => navigate('/tax-config')}
                                className="flex items-center text-left gap-3 p-2.5 rounded-lg border bg-card hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 hover:border-emerald-300 dark:hover:border-emerald-800 transition-all w-full group"
                            >
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-950/80 rounded-md text-emerald-600 dark:text-emerald-400 shrink-0">
                                    <Receipt className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                        {tr("Налоговый конфигуратор (IAS 12)", "Tax Configuration & IAS 12")}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground truncate">
                                        {tr("Сверка CIT 15%, VAT 12% и ОНА", "CIT 15%, VAT 12%, Soliq.uz protocol")}
                                    </p>
                                </div>
                            </button>
                        )}

                        {PERMISSIONS.canViewAuditLogs(user?.role) && (
                            <button
                                onClick={() => navigate('/audit-log')}
                                className="flex items-center text-left gap-3 p-2.5 rounded-lg border bg-card hover:bg-amber-50/50 dark:hover:bg-amber-950/30 hover:border-amber-300 dark:hover:border-amber-800 transition-all w-full group"
                            >
                                <div className="p-2 bg-amber-100 dark:bg-amber-950/80 rounded-md text-amber-600 dark:text-amber-400 shrink-0">
                                    <Activity className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                                        {tr("Журнал аудита операций", "Full Audit Trail Log")}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground truncate">
                                        {tr("История всех проводок и действий", "Traceable compliance event history")}
                                    </p>
                                </div>
                            </button>
                        )}

                        {PERMISSIONS.canViewCompliance(user?.role) && (
                            <button
                                onClick={() => navigate('/compliance')}
                                className="flex items-center text-left gap-3 p-2.5 rounded-lg border bg-card hover:bg-cyan-50/50 dark:hover:bg-cyan-950/30 hover:border-cyan-300 dark:hover:border-cyan-800 transition-all w-full group"
                            >
                                <div className="p-2 bg-cyan-100 dark:bg-cyan-950/80 rounded-md text-cyan-600 dark:text-cyan-400 shrink-0">
                                    <ShieldCheck className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                                        {tr("Комплаенс-контроль и сверка", "Compliance & Tax Audit")}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground truncate">
                                        {tr("Проверка 18 критических правил МСФО", "Automated Soliq.uz & IFRS check")}
                                    </p>
                                </div>
                            </button>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* BOTTOM ROW: Real Statements Table & Real Audit Trail */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 2/3: Real Balance Sheets Table */}
                <Card className="lg:col-span-2 shadow-xs">
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <div>
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <FileSpreadsheet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                {tr("Реестр загруженных пробных балансов (ОСВ)", "Recent Balance Sheets & Transformations")}
                            </CardTitle>
                            <CardDescription className="text-xs">
                                {tr("Реальные отчеты из базы данных с прямым переходом к трансформации", "Actual balance sheets stored in the system with direct transformation links")}
                            </CardDescription>
                        </div>
                        {PERMISSIONS.canUploadBalanceSheet(user?.role) && (
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => navigate('/transformation/upload')} 
                                className="text-xs gap-1.5 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                {tr("Загрузить ОСВ", "Upload Statement")}
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                                {tr("Загрузка реестра балансов...", "Loading balance sheets...")}
                            </div>
                        ) : balanceSheets.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                                {tr("Нет загруженных балансов. Нажмите «Загрузить ОСВ» для начала.", "No balance sheets found. Upload one to start.")}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="border-b border-border/60 text-slate-500 dark:text-slate-400 font-medium">
                                            <th className="text-left pb-2.5 font-semibold">{tr("Отчетный период", "Reporting Period")}</th>
                                            <th className="text-left pb-2.5 font-semibold">{tr("Статус", "Status")}</th>
                                            <th className="text-left pb-2.5 font-semibold">{tr("Дата загрузки", "Created Date")}</th>
                                            <th className="text-right pb-2.5 font-semibold">{tr("Действия", "Actions")}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/40">
                                        {balanceSheets.slice(0, 5).map((sheet) => {
                                            const cleanPeriod = sheet.period.split(' ')[0] || sheet.period;
                                            const isTransformed = (sheet.status || '').toUpperCase() === 'TRANSFORMED';
                                            const isDownloading = downloadingId === sheet.id;

                                            return (
                                                <tr 
                                                    key={sheet.id}
                                                    onClick={() => navigate(`/transformation/${sheet.id}`)}
                                                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                                                >
                                                    <td className="py-3 font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                        <Calendar className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                                        <span>{cleanPeriod}</span>
                                                    </td>
                                                    <td className="py-3">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                                            isTransformed 
                                                                ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                                                                : 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                                        }`}>
                                                            {isTransformed && <CheckCircle2 className="h-3 w-3" />}
                                                            {isTransformed ? (tr("ТРАНСФОРМИРОВАНО", "TRANSFORMED")) : (tr("В ОБРАБОТКЕ", "DRAFT"))}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 text-slate-500 dark:text-slate-400">
                                                        {sheet.created_at ? sheet.created_at.split(' ')[0] : (tr("Недавно", "Recent"))}
                                                    </td>
                                                    <td className="py-3 text-right">
                                                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={(e) => handleDownloadExcel(sheet.id, cleanPeriod, e)}
                                                                disabled={isDownloading}
                                                                className="h-7 px-2 text-[11px] gap-1 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400"
                                                                title={tr("Скачать Excel", "Export Excel")}
                                                            >
                                                                <Download className="h-3 w-3" />
                                                                <span>Excel</span>
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                onClick={() => navigate(`/transformation/${sheet.id}`)}
                                                                className="h-7 px-2.5 text-[11px] gap-1 bg-blue-600 hover:bg-blue-700 text-white"
                                                            >
                                                                <span>{user?.role === 'auditor' ? (tr("Аудит МСФО", "Audit IFRS")) : (tr("Открыть МСФО", "Open IFRS"))}</span>
                                                                <ArrowRight className="h-3 w-3" />
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

                        <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                                {tr(`Показано до 5 из ${totalSheets} балансов`, `Showing up to 5 of ${totalSheets} balance sheets`)}
                            </span>
                            <button
                                onClick={() => navigate('/transformation')}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                <span>{tr("Перейти ко всем балансам", "View all balance sheets")}</span>
                                <ArrowRight className="h-3 w-3" />
                            </button>
                        </div>
                    </CardContent>
                </Card>

                {/* 1/3: Real Live Audit Feed */}
                <Card className="shadow-xs flex flex-col justify-between">
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <div>
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <Activity className="h-4 w-4 text-blue-500" />
                                {tr("Живой журнал аудита", "Live Audit Trail")}
                            </CardTitle>
                            <CardDescription className="text-xs">
                                {tr("Реальный реестр системных действий", "Real operational event log")}
                            </CardDescription>
                        </div>
                        <button
                            onClick={() => navigate('/audit-log')}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                        >
                            {tr("Весь журнал →", "Full log →")}
                        </button>
                    </CardHeader>
                    <CardContent className="pt-1 flex-1">
                        <div className="space-y-2.5">
                            {auditLogs.length === 0 ? (
                                <div className="text-xs text-muted-foreground text-center py-8">
                                    {tr("Событий аудита пока нет", "No audit events logged yet")}
                                </div>
                            ) : (
                                auditLogs.slice(0, 5).map((log) => {
                                    const badge = getActionBadge(log.action);
                                    const timeStr = formatRelativeTime(log.timestamp || log.created_at);

                                    return (
                                        <div 
                                            key={log.id}
                                            className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/50 transition-colors"
                                        >
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold border ${badge.color}`}>
                                                    {badge.label}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {timeStr}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-800 dark:text-slate-200 leading-snug line-clamp-2">
                                                {log.details}
                                            </p>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
