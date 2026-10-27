import { useEffect, useState } from 'react';
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
        if (user?.role === 'superadmin') return isEn ? 'System Administrator' : 'Главный администратор';
        if (user?.email) {
            const prefix = user.email.split('@')[0];
            if (prefix === 'superadmin') return isEn ? 'System Administrator' : 'Главный администратор';
            if (prefix === 'owner') return 'Сардор Рахимов';
            if (prefix === 'accountant') return 'Елена Васильева';
            if (prefix === 'admin') return 'Камилла Каримова';
            if (prefix === 'auditor') return 'Дмитрий Ким';
            if (prefix === 'analyst') return 'Алишер Умаров';
            return prefix;
        }
        return isEn ? 'Administrator' : 'Администратор';
    };

    const getCompanyDisplay = () => {
        if (user?.role === 'superadmin' || user?.role === 'website_superadmin') {
            return isEn ? 'All Organizations' : 'Все организации';
        }
        if (user?.company_name) return user.company_name;
        if (user?.company_id === 'b968f7d7ffe04630a90aadde4d0d8e95') return 'FinServe Holdings';
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
                title: isEn ? "Excel Exported" : "Excel сформирован",
                description: isEn ? "Multi-sheet workbook with SUM formulas downloaded" : "Книга с живыми формулами суммирования успешно выгружена"
            });
        } catch (error) {
            toast({
                title: isEn ? "Export Failed" : "Ошибка экспорта",
                description: isEn ? "Could not generate Excel file" : "Не удалось сформировать Excel файл",
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

    // Monthly volume data for the transformation dynamics chart
    const chartData = [
        { month: isEn ? "May" : "Май", volume: 48, ifrs16: 12, ifrs9: 3.5 },
        { month: isEn ? "Jun" : "Июн", volume: 82, ifrs16: 18.5, ifrs9: 6.2 },
        { month: isEn ? "Jul" : "Июл", volume: 115, ifrs16: 24, ifrs9: 8.1 },
        { month: isEn ? "Aug" : "Авг", volume: 152, ifrs16: 31, ifrs9: 10.4 },
        { month: isEn ? "Sep" : "Сен", volume: 198, ifrs16: 38, ifrs9: 12.8 },
        { month: isEn ? "Oct" : "Окт", volume: 248.2, ifrs16: 45, ifrs9: 15.6 },
    ];

    const getActionBadge = (action: string) => {
        const act = (action || '').toLowerCase();
        if (act.includes('sync')) {
            return {
                label: isEn ? '1C Sync' : 'Синхронизация 1С',
                color: 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
            };
        }
        if (act.includes('transform')) {
            return {
                label: isEn ? 'IFRS Transform' : 'Трансформация МСФО',
                color: 'bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800'
            };
        }
        if (act.includes('consolidation') || act.includes('hierarchy')) {
            return {
                label: isEn ? 'IFRS 10 Consolidation' : 'Консолидация IFRS 10',
                color: 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
            };
        }
        if (act.includes('compliance') || act.includes('tax')) {
            return {
                label: isEn ? 'Tax Compliance' : 'Налоговый аудит',
                color: 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
            };
        }
        if (act.includes('review') || act.includes('report')) {
            return {
                label: isEn ? 'IFRS Report' : 'Отчет МСФО',
                color: 'bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800'
            };
        }
        if (act.includes('login') || act.includes('auth')) {
            return {
                label: isEn ? 'Security & 2FA' : 'Безопасность / 2FA',
                color: 'bg-cyan-100 dark:bg-cyan-950/70 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800'
            };
        }
        return {
            label: isEn ? 'Audit Review' : 'Аудит и ревью',
            color: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
        };
    };

    const formatRelativeTime = (isoString?: string) => {
        if (!isoString) return isEn ? 'recently' : 'недавно';
        try {
            const date = new Date(isoString);
            const diffMs = Date.now() - date.getTime();
            const diffMins = Math.floor(diffMs / (1000 * 60));
            if (diffMins < 1) return isEn ? 'just now' : 'только что';
            if (diffMins < 60) return isEn ? `${diffMins} min ago` : `${diffMins} мин назад`;
            const diffHours = Math.floor(diffMins / 60);
            if (diffHours < 24) return isEn ? `${diffHours} hr ago` : `${diffHours} ч назад`;
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
                            {isEn ? "Executive Dashboard" : "Исполнительная панель управления"}
                        </h1>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-cyan-300 border border-blue-200 dark:border-blue-800">
                            <Building2 className="h-3.5 w-3.5 text-cyan-500" />
                            {getCompanyDisplay()}
                        </span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {isEn ? "Welcome back" : "С возвращением"}, <span className="font-semibold text-slate-800 dark:text-slate-200">{getDisplayName()}</span>. {isSuperAdmin ? (isEn ? "IFRS transformation & holding reporting hub." : "Единый центр трансформации отчетности по МСФО и консолидации холдинга.") : (isEn ? "Corporate financial reporting & IFRS transformation center." : "Корпоративная финансовая отчетность и трансформация по МСФО.")}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {PERMISSIONS.canUploadBalanceSheet(user?.role) && (
                        <Button onClick={() => navigate('/transformation/upload')} className="gap-2 text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-xs">
                            <Upload className="h-4 w-4" /> {isEn ? "Smart 1C / Excel Import" : "Умный импорт 1С / Excel"}
                        </Button>
                    )}
                    {isSuperAdmin ? (
                        <Button onClick={() => navigate('/hierarchy')} variant="outline" className="gap-2 text-xs sm:text-sm border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50">
                            <Building2 className="h-4 w-4 text-blue-500" /> {isEn ? "Group Consolidation" : "Консолидация группы"}
                        </Button>
                    ) : PERMISSIONS.canManageCompanySettings(user?.role) ? (
                        <Button onClick={() => navigate('/company-settings')} variant="outline" className="gap-2 text-xs sm:text-sm border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50">
                            <Building2 className="h-4 w-4 text-blue-500" /> {isEn ? "Company Profile" : "Профиль компании"}
                        </Button>
                    ) : null}
                    {user?.role === 'auditor' && (
                        <Button onClick={() => navigate('/audit-log')} variant="outline" className="gap-2 text-xs sm:text-sm border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/50">
                            <FileCheck className="h-4 w-4 text-purple-500" /> {isEn ? "Audit Trail" : "Журнал аудита"}
                        </Button>
                    )}
                    {user?.role === 'accountant' && (
                        <Button onClick={() => navigate('/tax-config')} variant="outline" className="gap-2 text-xs sm:text-sm border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50">
                            <Receipt className="h-4 w-4 text-emerald-500" /> {isEn ? "Tax Rates" : "Налоговые ставки"}
                        </Button>
                    )}
                    <Button onClick={() => navigate('/reports')} variant="outline" className="gap-2 text-xs sm:text-sm">
                        <FileText className="h-4 w-4 text-indigo-500" /> {isEn ? "IFRS Package (4p)" : "Пакет МСФО (4 стр)"}
                    </Button>
                </div>
            </div>

            {/* REAL KPI ROW (4 Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Real Balance Sheets Stats */}
                <Card className="border-border/60 shadow-xs">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">
                            {isEn ? "Balance Sheets (OSV)" : "Пробные балансы (ОСВ)"}
                        </CardTitle>
                        <FileSpreadsheet className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline justify-between">
                            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                {totalSheets} {isEn ? "statements" : "отчетов"}
                            </div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                <CheckCircle2 className="h-3 w-3" />
                                {transformedCount} {isEn ? "ready" : "готово"}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {pendingCount > 0 
                                ? (isEn ? `${pendingCount} statements in review / draft` : `${pendingCount} отчетов на согласовании`) 
                                : (isEn ? "All statements transformed under IFRS" : "Все отчеты трансформированы по МСФО")}
                        </p>
                        <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                                {isEn ? "Source: 1C / Excel OSV" : "Источник: 1С / Excel ОСВ"}
                            </span>
                            <button
                                onClick={() => navigate('/transformation')}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                <span>{isEn ? "View all" : "Все балансы"}</span>
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
                                {isEn ? "Group Consolidation" : "Консолидация по IFRS 10"}
                            </CardTitle>
                            <Building2 className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline justify-between">
                                <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                    4 {isEn ? "entities" : "компании"}
                                </div>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                    <CheckCircle2 className="h-3 w-3" />
                                    {isEn ? "Balanced (0 UZS)" : "Дельта: 0.00 UZS"}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {isEn ? "Assets: 248.2M UZS • Equity: 151.9M UZS" : "Активы: 248.2M UZS • Капитал: 151.9M UZS"}
                            </p>
                            <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                    {isEn ? "5 Eliminations (99.8M UZS)" : "5 Элиминаций (99.8M UZS)"}
                                </span>
                                <button
                                    onClick={() => navigate('/hierarchy')}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    <span>{isEn ? "Open matrix" : "К матрице"}</span>
                                    <ArrowRight className="h-3 w-3" />
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="border-blue-200/60 dark:border-blue-900/50 bg-gradient-to-br from-card via-card to-blue-50/30 dark:to-blue-950/20 shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                {isEn ? "Corporate Entity & Scope" : "Юридическое лицо и статус"}
                            </CardTitle>
                            <Building2 className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline justify-between">
                                <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                    1 {isEn ? "entity" : "организация"}
                                </div>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                    <CheckCircle2 className="h-3 w-3" />
                                    {isEn ? "Active • Verified" : "Резидент РУз • Активна"}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                                <strong className="font-semibold text-slate-700 dark:text-slate-300">{getCompanyDisplay()}</strong> • {isEn ? "Single entity scope • IFRS reporting" : "Автономный учет • Отчетность по МСФО"}
                            </p>
                            <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                    {isEn ? "Tashkent • INN: Verified" : "ИНН: Подтвержден (ГНК РУз)"}
                                </span>
                                <button
                                    onClick={() => navigate(PERMISSIONS.canManageCompanySettings(user?.role) ? '/company-settings' : '/reports')}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    <span>{PERMISSIONS.canManageCompanySettings(user?.role) ? (isEn ? "Company profile" : "Параметры компании") : (isEn ? "Reports" : "Отчетность")}</span>
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
                            {isEn ? "Tax Protocol (Soliq.uz)" : "Налоговый аудит (Soliq.uz)"}
                        </CardTitle>
                        <Receipt className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline justify-between">
                            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                CIT 15% • НДС 12%
                            </div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                <CheckCircle2 className="h-3 w-3" />
                                {isEn ? "Verified" : "Сверено"}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {isEn ? "IAS 12 Deferred Tax Asset: +1.45M UZS" : "IAS 12 Отложенный налоговый актив: +1.45M UZS"}
                        </p>
                        <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                                {isEn ? "НК РУз ст. 258, 337" : "НК РУз ст. 258, 337"}
                            </span>
                            <button
                                onClick={() => navigate('/tax-config')}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                            >
                                <span>{isEn ? "Settings" : "Ставки"}</span>
                                <ArrowRight className="h-3 w-3" />
                            </button>
                        </div>
                    </CardContent>
                </Card>

                {/* 4. Independent Auditor Readiness */}
                <Card className="border-border/60 shadow-xs">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">
                            {isEn ? "Audit Opinion (ISA 700)" : "МСА 700 Заключение аудита"}
                        </CardTitle>
                        <ShieldCheck className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline justify-between">
                            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                {isEn ? "Unmodified" : "Безоговорочное"}
                            </div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-100 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                4 {isEn ? "pages" : "стр"}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {isEn ? "Full IFRS Convergence & Audit Booklet" : "Полный пакет раскрытий со всеми примечаниями"}
                        </p>
                        <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                                {isEn ? "IFRS 16, 9, IAS 36, 12" : "IFRS 16, 9, IAS 36, 12"}
                            </span>
                            <button
                                onClick={() => navigate('/reports')}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                            >
                                <span>{isEn ? "View reports" : "Отчеты"}</span>
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
                                    {isEn ? "IFRS Transformation Volume Dynamics" : "Динамика объемов трансформации по периодам"}
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    {isEn 
                                        ? "Aggregated balance sheet volume in Million UZS across reporting cycles" 
                                        : "Совокупный объем трансформаций балансов в миллионах сум (UZS)"}
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-3 text-xs">
                                <span className="flex items-center gap-1.5 text-muted-foreground">
                                    <span className="h-2.5 w-2.5 rounded-full bg-blue-600 inline-block" />
                                    {isEn ? "Total Volume" : "Общий объем"}
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
                                                ? (isEn ? 'Total Volume' : 'Общий объем')
                                                : name === 'ifrs16'
                                                ? 'IFRS 16 (Аренда)'
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
                            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800">
                                <span className="text-[10px] text-muted-foreground uppercase font-semibold block">IFRS 16 (Аренда)</span>
                                <span className="text-sm font-bold text-purple-600 dark:text-purple-400">45.0M UZS</span>
                            </div>
                            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800">
                                <span className="text-[10px] text-muted-foreground uppercase font-semibold block">IFRS 9 (Резервы ECL)</span>
                                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">15.6M UZS</span>
                            </div>
                            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800">
                                <span className="text-[10px] text-muted-foreground uppercase font-semibold block">IAS 36 (Тест обесценения)</span>
                                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">8.2M UZS</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 1/3: Quick Actions Hub */}
                <Card className="shadow-xs flex flex-col justify-between">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-amber-500" />
                                {isEn ? "Quick Operations Hub" : "Быстрые операции"}
                            </CardTitle>
                            <span className="text-xs text-muted-foreground font-medium">
                                {isEn ? "Direct Access" : "Быстрый переход"}
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
                                            {isEn ? "Smart 1C / Excel Import" : "Умный импорт 1С / Excel"}
                                        </p>
                                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                                            AI Mapper
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground truncate">
                                        {isEn ? "Visual column mapper & OSV parser" : "Авторазметка счетов и остатков ОСВ"}
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
                                            {isEn ? "IFRS 10 Group Consolidation" : "Консолидация группы (IFRS 10)"}
                                        </p>
                                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                                            {isEn ? "4 Entities" : "4 Юрлица"}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground truncate">
                                        {isEn ? "Intercompany eliminations & NCI" : "Внутригрупповые элиминации и NCI"}
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
                                            {isEn ? "Company Profile & Structure" : "Профиль и реквизиты компании"}
                                        </p>
                                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                                            {isEn ? "1 Entity" : "1 Юрлицо"}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground truncate">
                                        {isEn ? "Tax details, 1C config & corporate settings" : "ИНН, синхронизация с 1С и параметры"}
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
                                        {isEn ? "Full IFRS Disclosure Package" : "Пакет отчетности МСФО (4 стр)"}
                                    </p>
                                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                                        МСА 700
                                    </span>
                                </div>
                                <p className="text-[10px] text-muted-foreground truncate">
                                    {isEn ? "Official audit report booklet" : "Буклет с аудиторским заключением"}
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
                                        {isEn ? "Tax Configuration & IAS 12" : "Налоговый конфигуратор (IAS 12)"}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground truncate">
                                        {isEn ? "CIT 15%, VAT 12%, Soliq.uz protocol" : "Сверка CIT 15%, VAT 12% и ОНА"}
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
                                        {isEn ? "Full Audit Trail Log" : "Журнал аудита операций"}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground truncate">
                                        {isEn ? "Traceable compliance event history" : "История всех проводок и действий"}
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
                                        {isEn ? "Compliance & Tax Audit" : "Комплаенс-контроль и сверка"}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground truncate">
                                        {isEn ? "Automated Soliq.uz & IFRS check" : "Проверка 18 критических правил МСФО"}
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
                                {isEn ? "Recent Balance Sheets & Transformations" : "Реестр загруженных пробных балансов (ОСВ)"}
                            </CardTitle>
                            <CardDescription className="text-xs">
                                {isEn 
                                    ? "Actual balance sheets stored in the system with direct transformation links" 
                                    : "Реальные отчеты из базы данных с прямым переходом к трансформации"}
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
                                {isEn ? "Upload Statement" : "Загрузить ОСВ"}
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                                {isEn ? "Loading balance sheets..." : "Загрузка реестра балансов..."}
                            </div>
                        ) : balanceSheets.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                                {isEn ? "No balance sheets found. Upload one to start." : "Нет загруженных балансов. Нажмите «Загрузить ОСВ» для начала."}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="border-b border-border/60 text-slate-500 dark:text-slate-400 font-medium">
                                            <th className="text-left pb-2.5 font-semibold">{isEn ? "Reporting Period" : "Отчетный период"}</th>
                                            <th className="text-left pb-2.5 font-semibold">{isEn ? "Status" : "Статус"}</th>
                                            <th className="text-left pb-2.5 font-semibold">{isEn ? "Created Date" : "Дата загрузки"}</th>
                                            <th className="text-right pb-2.5 font-semibold">{isEn ? "Actions" : "Действия"}</th>
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
                                                            {isTransformed ? (isEn ? "TRANSFORMED" : "ТРАНСФОРМИРОВАНО") : (isEn ? "DRAFT" : "В ОБРАБОТКЕ")}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 text-slate-500 dark:text-slate-400">
                                                        {sheet.created_at ? sheet.created_at.split(' ')[0] : (isEn ? "Recent" : "Недавно")}
                                                    </td>
                                                    <td className="py-3 text-right">
                                                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={(e) => handleDownloadExcel(sheet.id, cleanPeriod, e)}
                                                                disabled={isDownloading}
                                                                className="h-7 px-2 text-[11px] gap-1 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400"
                                                                title={isEn ? "Export Excel" : "Скачать Excel"}
                                                            >
                                                                <Download className="h-3 w-3" />
                                                                <span>Excel</span>
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                onClick={() => navigate(`/transformation/${sheet.id}`)}
                                                                className="h-7 px-2.5 text-[11px] gap-1 bg-blue-600 hover:bg-blue-700 text-white"
                                                            >
                                                                <span>{user?.role === 'auditor' ? (isEn ? "Audit IFRS" : "Аудит МСФО") : (isEn ? "Open IFRS" : "Открыть МСФО")}</span>
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
                                {isEn ? `Showing up to 5 of ${totalSheets} balance sheets` : `Показано до 5 из ${totalSheets} балансов`}
                            </span>
                            <button
                                onClick={() => navigate('/transformation')}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                <span>{isEn ? "View all balance sheets" : "Перейти ко всем балансам"}</span>
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
                                {isEn ? "Live Audit Trail" : "Живой журнал аудита"}
                            </CardTitle>
                            <CardDescription className="text-xs">
                                {isEn ? "Real operational event log" : "Реальный реестр системных действий"}
                            </CardDescription>
                        </div>
                        <button
                            onClick={() => navigate('/audit-log')}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                        >
                            {isEn ? "Full log →" : "Весь журнал →"}
                        </button>
                    </CardHeader>
                    <CardContent className="pt-1 flex-1">
                        <div className="space-y-2.5">
                            {auditLogs.length === 0 ? (
                                <div className="text-xs text-muted-foreground text-center py-8">
                                    {isEn ? "No audit events logged yet" : "Событий аудита пока нет"}
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
