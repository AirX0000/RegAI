import { useState, useEffect, useMemo } from 'react';
import { tr } from '@/lib/i18n';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
    ArrowLeft, 
    ArrowRight, 
    Trash2, 
    Building2, 
    SlidersHorizontal, 
    TrendingUp, 
    TrendingDown, 
    ShieldAlert, 
    Calculator, 
    RefreshCw, 
    Coins, 
    Search, 
    Plus, 
    Sparkles, 
    CheckCircle2,
    Calendar,
    FileSpreadsheet,
    Scale,
    Percent
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import IFRS16Calculator from '@/components/calculators/IFRS16Calculator';
import IAS36Calculator from '@/components/calculators/IAS36Calculator';
import IFRS9Calculator from '@/components/calculators/IFRS9Calculator';
import IAS12Calculator from '@/components/calculators/IAS12Calculator';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from 'react-i18next';

interface Adjustment {
    id?: string;
    description: string;
    adjustment_amount: number;
    adjustment_type: 'debit' | 'credit';
    ifrs_category?: string;
    balance_sheet_item_id?: string;
}

interface BalanceSheetItem {
    id: string;
    account_code: string;
    account_name: string;
    amount: number;
    category: string;
    subcategory?: string;
}

interface BalanceSheet {
    id: string;
    period: string;
    currency?: string;
    company_name?: string;
    items: BalanceSheetItem[];
    adjustments: Adjustment[];
}

export default function TransformationAdjustmentsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { i18n } = useTranslation();
    const isRu = (i18n.language || 'ru').toLowerCase().startsWith('ru');

    const [balanceSheet, setBalanceSheet] = useState<BalanceSheet | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedItem, setSelectedItem] = useState<BalanceSheetItem | null>(null);
    const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);

    // Filters and search
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<'all' | 'assets' | 'liabilities' | 'equity'>('all');

    // Currency Switcher State
    const [currency, setCurrency] = useState<'USD' | 'UZS' | 'EUR'>('USD');

    // New Adjustment State
    const [newAdjustment, setNewAdjustment] = useState<Partial<Adjustment>>({
        adjustment_type: 'debit',
        adjustment_amount: 0,
        description: '',
        ifrs_category: 'IFRS'
    });

    useEffect(() => {
        fetchBalanceSheet();
    }, [id]);

    const isBaseUZS = () => {
        if ((balanceSheet?.currency || '').toUpperCase() === 'UZS') return true;
        const items = balanceSheet?.items || [];
        if (items.some((i: any) => Number(i.amount) > 50_000_000)) return true;
        return false;
    };

    const formatMoney = (amount: number) => {
        const val = Number(amount) || 0;
        const isUzs = isBaseUZS();

        if (isUzs) {
            if (currency === 'UZS') {
                return `${val.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${tr('сум', 'UZS')}`;
            }
            if (currency === 'EUR') {
                const eur = (val / 12850) * 0.92;
                return `€${eur.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            }
            const usd = val / 12850;
            return `$${usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        } else {
            if (currency === 'UZS') {
                return `${(val * 12850).toLocaleString(undefined, { maximumFractionDigits: 0 })} ${tr('сум', 'UZS')}`;
            }
            if (currency === 'EUR') {
                return `€${(val * 0.92).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            }
            return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
    };

    const fetchBalanceSheet = async () => {
        try {
            setIsRefreshing(true);
            const res = await api.get(`/balance-sheets/${id}`);
            const data = res.data;
            if (data && typeof data === 'object') {
                if (!Array.isArray(data.items)) data.items = [];
                if (!Array.isArray(data.adjustments)) data.adjustments = [];
            }
            setBalanceSheet(data);
            if ((data?.currency || '').toUpperCase() === 'UZS' || (data?.items || []).some((i: any) => Number(i.amount) > 50_000_000)) {
                setCurrency('UZS');
            } else {
                setCurrency('USD');
            }
        } catch (error) {
            console.error("Failed to fetch balance sheet", error);
            toast({
                variant: "destructive",
                title: tr("Ошибка", "Error"),
                description: tr("Не удалось загрузить данные бухгалтерского баланса", "Failed to load balance sheet data")
            });
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const handleGlobalAdjustment = async (adjustments: any[]) => {
        try {
            await api.post(`/balance-sheets/${id}/adjustments`, adjustments.map(adj => ({
                ...adj,
                balance_sheet_id: id
            })));
            toast({
                title: tr("Успешно", "Success"),
                description: tr("Корректировки успешно применены", "Adjustments applied successfully")
            });
            fetchBalanceSheet();
        } catch (error) {
            toast({
                variant: "destructive",
                title: tr("Ошибка", "Error"),
                description: tr("Не удалось применить корректировки", "Failed to apply adjustments")
            });
        }
    };

    const handleOpenAdjustment = (item: BalanceSheetItem) => {
        setSelectedItem(item);
        setNewAdjustment({
            adjustment_type: 'debit',
            adjustment_amount: 0,
            description: '',
            balance_sheet_item_id: item.id,
            ifrs_category: item.category
        });
        setIsAdjustmentModalOpen(true);
    };

    const handleSaveAdjustment = async () => {
        if (!balanceSheet || !newAdjustment.adjustment_amount || !newAdjustment.description) {
            toast({
                variant: "destructive",
                title: tr("Ошибка валидации", "Validation Error"),
                description: tr("Пожалуйста, заполните все обязательные поля", "Please fill in all required fields")
            });
            return;
        }

        try {
            await api.post(`/balance-sheets/${balanceSheet.id}/adjustments`, [{
                ...newAdjustment,
                balance_sheet_id: balanceSheet.id
            }]);

            toast({
                title: tr("Успешно", "Success"),
                description: tr("Корректировка успешно добавлена", "Adjustment added successfully")
            });
            setIsAdjustmentModalOpen(false);
            fetchBalanceSheet();
        } catch (error) {
            console.error("Failed to save adjustment", error);
            toast({
                variant: "destructive",
                title: tr("Ошибка", "Error"),
                description: tr("Не удалось сохранить корректировку", "Failed to save adjustment")
            });
        }
    };

    const handleDeleteAdjustment = async (adjId: string) => {
        try {
            await api.delete(`/balance-sheets/${id}/adjustments/${adjId}`);
            toast({
                title: tr("Удалено", "Deleted"),
                description: tr("Корректировка успешно удалена", "Adjustment removed")
            });
            fetchBalanceSheet();
        } catch (error) {
            console.error("Failed to delete adjustment", error);
        }
    };

    const calculateIFRSValue = (item: BalanceSheetItem) => {
        if (!balanceSheet) return item.amount;

        const adjustmentsList = Array.isArray(balanceSheet.adjustments) ? balanceSheet.adjustments : [];
        const itemAdjustments = adjustmentsList.filter((adj: any) => adj.balance_sheet_item_id === item.id);
        let total = Number(item.amount);

        itemAdjustments.forEach(adj => {
            if (item.category === 'assets') {
                total += adj.adjustment_type === 'debit' ? Number(adj.adjustment_amount) : -Number(adj.adjustment_amount);
            } else {
                total += adj.adjustment_type === 'credit' ? Number(adj.adjustment_amount) : -Number(adj.adjustment_amount);
            }
        });

        return total;
    };

    // Statistical KPI calculations
    const stats = useMemo(() => {
        const items = balanceSheet?.items || [];
        const adjustments = balanceSheet?.adjustments || [];

        const statutoryAssets = items.filter(i => (i.category || '').toLowerCase() === 'assets').reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
        const statutoryLiab = items.filter(i => (i.category || '').toLowerCase() === 'liabilities').reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
        const statutoryEquity = items.filter(i => (i.category || '').toLowerCase() === 'equity').reduce((acc, i) => acc + (Number(i.amount) || 0), 0);

        const totalDebits = adjustments.filter(a => a.adjustment_type === 'debit').reduce((acc, a) => acc + (Number(a.adjustment_amount) || 0), 0);
        const totalCredits = adjustments.filter(a => a.adjustment_type === 'credit').reduce((acc, a) => acc + (Number(a.adjustment_amount) || 0), 0);

        // Projected IFRS assets
        let ifrsAssets = statutoryAssets;
        adjustments.forEach(adj => {
            const desc = (adj.description || '').toLowerCase();
            const amt = Number(adj.adjustment_amount) || 0;
            if (desc.includes('asset') || desc.includes('rou') || desc.includes('прав')) {
                ifrsAssets += amt;
            } else if (desc.includes('impairment') || desc.includes('ecl') || desc.includes('обесцен') || desc.includes('резерв')) {
                if (adj.adjustment_type === 'credit') {
                    ifrsAssets -= amt;
                }
            }
        });

        const diff = Math.abs(statutoryAssets - (statutoryLiab + statutoryEquity));
        const isBalanced = diff < 0.01;

        return {
            statutoryAssets,
            statutoryLiab,
            statutoryEquity,
            totalDebits,
            totalCredits,
            ifrsAssets,
            isBalanced,
            diff,
            totalItems: items.length,
            totalAdjustments: adjustments.length
        };
    }, [balanceSheet]);

    // Filtered items for table
    const filteredItems = useMemo(() => {
        let list = balanceSheet?.items || [];
        if (selectedCategory !== 'all') {
            list = list.filter(i => (i.category || '').toLowerCase() === selectedCategory);
        }
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            list = list.filter(i =>
                (i.account_code || '').toLowerCase().includes(term) ||
                (i.account_name || '').toLowerCase().includes(term)
            );
        }
        return list;
    }, [balanceSheet?.items, selectedCategory, searchTerm]);

    const globalAdjustments = useMemo(() => {
        return (balanceSheet?.adjustments || []).filter(adj => !adj.balance_sheet_item_id);
    }, [balanceSheet?.adjustments]);

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-500">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                <p className="text-sm font-medium">{tr('Загрузка ведомости корректировок...', 'Loading adjustments worksheet...')}</p>
            </div>
        );
    }

    if (!balanceSheet) {
        return (
            <div className="p-8 max-w-xl mx-auto text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 flex items-center justify-center mx-auto">
                    <ShieldAlert className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold">{tr('Бухгалтерский баланс не найден', 'Balance Sheet not found')}</h2>
                <Button onClick={() => navigate('/transformation')} variant="outline">
                    {tr('Вернуться в панель управления', 'Back to Dashboard')}
                </Button>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
            {/* Top Navigation & Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
                <div>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => navigate('/transformation')} 
                        className="mb-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 -ml-2.5"
                    >
                        <ArrowLeft className="mr-1.5 h-4 w-4" />
                        {tr('К проектам трансформации', 'Back to Dashboard')}
                    </Button>
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                            {tr('Корректировки трансформации', 'Transformation Adjustments')}
                        </h1>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            {tr('НСБУ ➔ МСФО', 'NAS ➔ IFRS')}
                        </span>
                    </div>
                    <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{tr('Отчетный период: ', 'Reporting Period: ')}</span>
                        <strong className="text-slate-700 dark:text-slate-300">
                            {new Date(balanceSheet.period).toLocaleDateString(isRu ? 'ru-RU' : 'en-US', { year: 'numeric', month: 'long' })}
                        </strong>
                        {balanceSheet.company_name && (
                            <>
                                <span>•</span>
                                <span>{balanceSheet.company_name}</span>
                            </>
                        )}
                    </p>
                </div>

                {/* Right Top Actions */}
                <div className="flex flex-wrap items-center gap-2.5">
                    {/* Currency Selector */}
                    <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold">
                        <Coins className="w-3.5 h-3.5 text-slate-500 ml-1 mr-0.5" />
                        <button
                            className={`px-2 py-1 rounded-lg transition-all ${currency === 'UZS' ? 'bg-white dark:bg-slate-900 shadow-xs text-blue-600 font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'}`}
                            onClick={() => setCurrency('UZS')}
                        >
                            UZS ({tr('сум', 'UZS')})
                        </button>
                        <button
                            className={`px-2 py-1 rounded-lg transition-all ${currency === 'USD' ? 'bg-white dark:bg-slate-900 shadow-xs text-blue-600 font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'}`}
                            onClick={() => setCurrency('USD')}
                        >
                            USD ($)
                        </button>
                        <button
                            className={`px-2 py-1 rounded-lg transition-all ${currency === 'EUR' ? 'bg-white dark:bg-slate-900 shadow-xs text-blue-600 font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'}`}
                            onClick={() => setCurrency('EUR')}
                        >
                            EUR (€)
                        </button>
                    </div>

                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={fetchBalanceSheet} 
                        disabled={isRefreshing}
                        className="rounded-xl border-slate-200 dark:border-slate-800"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {tr('Обновить', 'Refresh')}
                    </Button>

                    <Button 
                        onClick={() => navigate(`/transformation/results/${id}`)}
                        className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20 font-medium px-4 text-xs md:text-sm"
                    >
                        <span>{tr('Финальный отчет МСФО', 'Finalize IFRS Report')}</span>
                        <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Top 4 KPI Executive Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Statutory Total Assets */}
                <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-card shadow-xs">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                {tr('Активы по НСБУ', 'Statutory Assets')}
                            </p>
                            <h3 className="text-lg md:text-xl font-bold font-mono text-slate-900 dark:text-slate-50 mt-1">
                                {formatMoney(stats.statutoryAssets)}
                            </h3>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                                {stats.totalItems} {tr('статей учета', 'line items')}
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                            <Building2 className="w-5 h-5" />
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Total Adjustments (Dr/Cr) */}
                <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-card shadow-xs">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                {tr('Корректировки МСФО', 'IFRS Adjustments')}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
                                    Дт +{formatMoney(stats.totalDebits)}
                                </span>
                            </div>
                            <div className="text-[11px] font-mono text-rose-600 dark:text-rose-400 mt-0.5">
                                Кт -{formatMoney(stats.totalCredits)}
                            </div>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                            <SlidersHorizontal className="w-5 h-5" />
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Projected IFRS Assets */}
                <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-card shadow-xs">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                {tr('Проект активов МСФО', 'Projected IFRS Assets')}
                            </p>
                            <h3 className="text-lg md:text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                                {formatMoney(stats.ifrsAssets)}
                            </h3>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                                {stats.totalAdjustments} {tr('активных проводок', 'active postings')}
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                    </CardContent>
                </Card>

                {/* 4. Capital Equilibrium Guard */}
                <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-card shadow-xs">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                {tr('Контроль баланса', 'Capital Equilibrium')}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1.5">
                                {stats.isBalanced ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        {tr('Сбалансирован', 'Balanced (Δ 0.00)')}
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                        <ShieldAlert className="w-3.5 h-3.5" />
                                        Δ {formatMoney(stats.diff)}
                                    </span>
                                )}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1">
                                Zero-Delta Guard
                            </p>
                        </div>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stats.isBalanced ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600'}`}>
                            <Scale className="w-5 h-5" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* IFRS Automation Calculators Panel */}
            <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-card shadow-xs overflow-hidden">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-900/40 border-b border-slate-200/80 dark:border-slate-800 p-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                                <Sparkles className="w-4 h-4" />
                            </div>
                            <div>
                                <CardTitle className="text-sm md:text-base font-bold text-slate-900 dark:text-slate-100">
                                    {tr('Инструменты автоматизации стандартов МСФО', 'IFRS Automation Toolset')}
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    {tr('Интерактивные калькуляторы для сложных стандартов (МСФО 16, МСБУ 36, МСФО 9) с формированием двойных проводок.', 'Automated valuation and impairment models generating compliant double-entry journal entries.')}
                                </CardDescription>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {/* IFRS 16 Card */}
                    <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 hover:border-blue-500/40 transition-all flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                    IFRS 16
                                </span>
                                <Building2 className="w-4 h-4 text-blue-500" />
                            </div>
                            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                                {tr('Аренда и права пользования', 'Leases & ROU Assets')}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                {tr('Дисконтирование аннуитета по эффективной ставке и капитализация актива ROU и обязательства.', 'Discount lease cash flows into Right-of-Use Asset and Lease Liability at NPV.')}
                            </p>
                        </div>
                        <div className="mt-4">
                            <IFRS16Calculator 
                                onCalculate={(rou, liab) => handleGlobalAdjustment([
                                    { adjustment_type: 'debit', adjustment_amount: rou, description: 'IFRS 16: Right-of-Use Asset Recognition (Дт Активы ROU)' },
                                    { adjustment_type: 'credit', adjustment_amount: liab, description: 'IFRS 16: Lease Liability Capitalization (Кт Обязательства по аренде)' }
                                ])} 
                                trigger={
                                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 rounded-lg shadow-xs">
                                        <Building2 className="w-3.5 h-3.5 mr-1.5" />
                                        {tr('Рассчитать аренду (IFRS 16)', 'Calculate Lease (IFRS 16)')}
                                    </Button>
                                }
                            />
                        </div>
                    </div>

                    {/* IAS 36 Card */}
                    <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40 transition-all flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                    IAS 36
                                </span>
                                <TrendingDown className="w-4 h-4 text-amber-500" />
                            </div>
                            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                                {tr('Обесценение активов', 'Asset Impairment Test')}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                {tr('Определение возмещаемой суммы = max(Справедливая за вычетом затрат, Ценность использования).', 'Recoverable amount test: Max(Fair Value Less Costs, Value in Use).')}
                            </p>
                        </div>
                        <div className="mt-4">
                            <IAS36Calculator 
                                onCalculate={(loss) => handleGlobalAdjustment([
                                    { adjustment_type: 'debit', adjustment_amount: loss, description: 'IAS 36: Impairment Loss recognized in P&L (Дт Расход на обесценение)' },
                                    { adjustment_type: 'credit', adjustment_amount: loss, description: 'IAS 36: Accumulated Impairment Allowance (Кт Снижение стоимости ОС)' }
                                ])}
                                trigger={
                                    <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold py-2 rounded-lg shadow-xs">
                                        <TrendingDown className="w-3.5 h-3.5 mr-1.5" />
                                        {tr('Проверить обесценение (IAS 36)', 'Impairment Test (IAS 36)')}
                                    </Button>
                                }
                            />
                        </div>
                    </div>

                    {/* IFRS 9 Card */}
                    <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40 transition-all flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                    IFRS 9
                                </span>
                                <ShieldAlert className="w-4 h-4 text-emerald-500" />
                            </div>
                            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                                {tr('Ожидаемые кредитные убытки', 'Expected Credit Loss (ECL)')}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                {tr('3-стадийная матрица дефолта: ECL = EAD × PD × LGD × DF для дебиторской задолженности.', '3-stage forward-looking impairment model: ECL = EAD × PD × LGD × DF.')}
                            </p>
                        </div>
                        <div className="mt-4">
                            <IFRS9Calculator 
                                onCalculate={(ecl, stage) => handleGlobalAdjustment([
                                    { adjustment_type: 'debit', adjustment_amount: ecl, description: `IFRS 9: ECL Provision Expense (${stage}) (Дт Расход по резерву)` },
                                    { adjustment_type: 'credit', adjustment_amount: ecl, description: `IFRS 9: Allowance for Expected Credit Losses (${stage}) (Кт Резерв ECL)` }
                                ])}
                                trigger={
                                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2 rounded-lg shadow-xs">
                                        <Calculator className="w-3.5 h-3.5 mr-1.5" />
                                        {tr('Оценить резерв ECL (IFRS 9)', 'Calculate ECL (IFRS 9)')}
                                    </Button>
                                }
                            />
                        </div>
                    </div>

                    {/* IAS 12 Card */}
                    <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 hover:border-indigo-500/40 transition-all flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                                    IAS 12
                                </span>
                                <Percent className="w-4 h-4 text-indigo-500" />
                            </div>
                            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                                {tr('Отложенные налоги (DTA / DTL)', 'Deferred Taxes (IAS 12)')}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                {tr('Временные разницы между МСФО и налоговой базой: расчёт ОНА (актив) или ОНО (обязательство).', 'Temporary differences between IFRS carrying values and tax base producing DTA or DTL.')}
                            </p>
                        </div>
                        <div className="mt-4">
                            <IAS12Calculator 
                                onCalculate={(type, amount, desc) => {
                                    if (type === 'DTL') {
                                        handleGlobalAdjustment([
                                            { adjustment_type: 'debit', adjustment_amount: amount, description: `IAS 12: Income Tax Expense in P&L (Дт 99/91 Расход по налогу)` },
                                            { adjustment_type: 'credit', adjustment_amount: amount, description: `IAS 12: Deferred Tax Liability (Кт 77 ОНО) — ${desc}` }
                                        ]);
                                    } else if (type === 'DTA') {
                                        handleGlobalAdjustment([
                                            { adjustment_type: 'debit', adjustment_amount: amount, description: `IAS 12: Deferred Tax Asset (Дт 09 ОНА) — ${desc}` },
                                            { adjustment_type: 'credit', adjustment_amount: amount, description: `IAS 12: Income Tax Benefit in P&L (Кт 99/91 Доход по налогу)` }
                                        ]);
                                    }
                                }}
                                trigger={
                                    <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2 rounded-lg shadow-xs">
                                        <Percent className="w-3.5 h-3.5 mr-1.5" />
                                        {tr('Рассчитать налог (IAS 12)', 'Calculate Tax (IAS 12)')}
                                    </Button>
                                }
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Transformation Worksheet Table */}
            <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-card shadow-xs overflow-hidden">
                <CardHeader className="p-4 md:p-5 border-b border-border">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-base md:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                                {tr('Трансформационная ведомость счетов', 'NAS to IFRS Transformation Worksheet')}
                            </CardTitle>
                            <CardDescription className="text-xs mt-0.5">
                                {tr('Нажмите на строку или кнопку «+ Корректировка», чтобы привязать индивидуальную проводку реклассификации.', 'Click any row to attach item-level reclassifications or audit adjustments.')}
                            </CardDescription>
                        </div>

                        {/* Search and Category Filter Toolbar */}
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Category Filter Tabs */}
                            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs font-semibold">
                                <button
                                    onClick={() => setSelectedCategory('all')}
                                    className={`px-2.5 py-1 rounded-lg transition-all ${selectedCategory === 'all' ? 'bg-white dark:bg-slate-900 shadow-xs text-blue-600 font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'}`}
                                >
                                    {tr('Все', 'All')} ({balanceSheet.items.length})
                                </button>
                                <button
                                    onClick={() => setSelectedCategory('assets')}
                                    className={`px-2.5 py-1 rounded-lg transition-all ${selectedCategory === 'assets' ? 'bg-white dark:bg-slate-900 shadow-xs text-emerald-600 font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'}`}
                                >
                                    {tr('Активы', 'Assets')}
                                </button>
                                <button
                                    onClick={() => setSelectedCategory('liabilities')}
                                    className={`px-2.5 py-1 rounded-lg transition-all ${selectedCategory === 'liabilities' ? 'bg-white dark:bg-slate-900 shadow-xs text-amber-600 font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'}`}
                                >
                                    {tr('Обязательства', 'Liabilities')}
                                </button>
                                <button
                                    onClick={() => setSelectedCategory('equity')}
                                    className={`px-2.5 py-1 rounded-lg transition-all ${selectedCategory === 'equity' ? 'bg-white dark:bg-slate-900 shadow-xs text-indigo-600 font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'}`}
                                >
                                    {tr('Капитал', 'Equity')}
                                </button>
                            </div>

                            {/* Search Box */}
                            <div className="relative min-w-[200px]">
                                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <Input
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder={tr('Поиск по счету или названию...', 'Search account or code...')}
                                    className="pl-8 h-8 text-xs rounded-xl"
                                />
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 dark:bg-slate-900/60 border-b border-border text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                <th className="py-3 px-4 w-24">{tr('Счет', 'Account')}</th>
                                <th className="py-3 px-4 min-w-[220px]">{tr('Наименование статьи (НСБУ)', 'Description')}</th>
                                <th className="py-3 px-4 w-32">{tr('Категория', 'Category')}</th>
                                <th className="py-3 px-4 text-right w-40">{tr('Сумма по НСБУ', 'NAS Amount')}</th>
                                <th className="py-3 px-4 text-center w-32">{tr('Корректировки', 'Adjustments')}</th>
                                <th className="py-3 px-4 text-right w-44">{tr('Оценка МСФО', 'IFRS Amount')}</th>
                                <th className="py-3 px-4 text-center w-28">{tr('Действие', 'Action')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border text-xs">
                            {filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-slate-500">
                                        {tr('Статьи баланса по заданным критериям не найдены', 'No items found matching filter criteria')}
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map((item) => {
                                    const adjustmentsList = Array.isArray(balanceSheet?.adjustments) ? balanceSheet.adjustments : [];
                                    const itemAdjustments = adjustmentsList.filter(adj => adj.balance_sheet_item_id === item.id);
                                    const ifrsValue = calculateIFRSValue(item);
                                    const hasAdjustments = itemAdjustments.length > 0;
                                    const cat = (item.category || '').toLowerCase();

                                    return (
                                        <tr 
                                            key={item.id}
                                            onClick={() => handleOpenAdjustment(item)}
                                            className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group"
                                        >
                                            {/* Code */}
                                            <td className="py-3.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                                                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                                    {item.account_code || '—'}
                                                </span>
                                            </td>

                                            {/* Name */}
                                            <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-slate-100">
                                                {item.account_name}
                                                {item.subcategory && (
                                                    <span className="text-[10px] text-slate-400 block font-normal mt-0.5">
                                                        {item.subcategory}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Category Badge */}
                                            <td className="py-3.5 px-4">
                                                {cat === 'assets' && (
                                                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                                        {tr('Активы', 'Assets')}
                                                    </span>
                                                )}
                                                {cat === 'liabilities' && (
                                                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                                        {tr('Обязательства', 'Liabilities')}
                                                    </span>
                                                )}
                                                {cat === 'equity' && (
                                                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                                                        {tr('Капитал', 'Equity')}
                                                    </span>
                                                )}
                                            </td>

                                            {/* NAS Amount */}
                                            <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-700 dark:text-slate-300">
                                                {formatMoney(item.amount)}
                                            </td>

                                            {/* Adjustments count */}
                                            <td className="py-3.5 px-4 text-center">
                                                {hasAdjustments ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                                        {itemAdjustments.length} {tr('корр.', 'adj')}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
                                                )}
                                            </td>

                                            {/* IFRS Projected */}
                                            <td className={`py-3.5 px-4 text-right font-mono font-bold text-sm ${ifrsValue < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                                {formatMoney(ifrsValue)}
                                            </td>

                                            {/* Action Button */}
                                            <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleOpenAdjustment(item)}
                                                    className="h-7 px-2.5 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg font-medium opacity-80 group-hover:opacity-100"
                                                >
                                                    <Plus className="w-3 h-3 mr-1" />
                                                    {tr('Проводка', 'Adjust')}
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            {/* Global / Standard Adjustments Ledger Section */}
            {globalAdjustments.length > 0 && (
                <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-card shadow-xs overflow-hidden">
                    <CardHeader className="p-4 md:p-5 border-b border-border bg-slate-50/50 dark:bg-slate-900/40">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                                    <SlidersHorizontal className="w-4 h-4" />
                                </div>
                                <div>
                                    <CardTitle className="text-sm md:text-base font-bold text-slate-900 dark:text-slate-100">
                                        {tr('Журнал глобальных проводок МСФО', 'Global IFRS Adjustments Journal')}
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        {tr('Корректировки по МСФО 16, МСБУ 36 и МСФО 9, влияющие на структуру баланса и финансовый результат.', 'Dual-ledger adjustment entries generated by calculators and assurance directives.')}
                                    </CardDescription>
                                </div>
                            </div>
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                {globalAdjustments.length} {tr('записей', 'entries')}
                            </span>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0 overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/80 dark:bg-slate-900/60 border-b border-border text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    <th className="py-3 px-4 w-28">{tr('Стандарт', 'Standard')}</th>
                                    <th className="py-3 px-4">{tr('Содержание бухгалтерской записи (Меморандум)', 'Entry Description')}</th>
                                    <th className="py-3 px-4 text-center w-32">{tr('Тип записи', 'Type')}</th>
                                    <th className="py-3 px-4 text-right w-44">{tr('Сумма проводки', 'Amount')}</th>
                                    <th className="py-3 px-4 text-center w-20">{tr('Удалить', 'Action')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border text-xs">
                                {globalAdjustments.map((adj) => {
                                    const desc = adj.description || '';
                                    const isDebit = adj.adjustment_type === 'debit';
                                    let standardBadge = 'IFRS';
                                    if (desc.toLowerCase().includes('ifrs 16') || desc.toLowerCase().includes('lease')) standardBadge = 'IFRS 16';
                                    else if (desc.toLowerCase().includes('ias 36') || desc.toLowerCase().includes('impairment')) standardBadge = 'IAS 36';
                                    else if (desc.toLowerCase().includes('ifrs 9') || desc.toLowerCase().includes('ecl')) standardBadge = 'IFRS 9';

                                    return (
                                        <tr key={adj.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="py-3.5 px-4 font-mono font-bold text-xs">
                                                <span className={`px-2 py-0.5 rounded border text-[11px] ${
                                                    standardBadge === 'IFRS 16' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                                                    standardBadge === 'IAS 36' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                                                    standardBadge === 'IFRS 9' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                                                    'bg-slate-500/10 text-slate-600 border-slate-500/20'
                                                }`}>
                                                    {standardBadge}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                                                {adj.description}
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                {isDebit ? (
                                                    <span className="px-2.5 py-0.5 rounded text-[11px] font-bold font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                                        ДТ (Debit)
                                                    </span>
                                                ) : (
                                                    <span className="px-2.5 py-0.5 rounded text-[11px] font-bold font-mono bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                                        КТ (Credit)
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 text-right font-mono font-bold text-sm">
                                                <span className={isDebit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                                                    {isDebit ? '+' : '-'}{formatMoney(adj.adjustment_amount)}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors" 
                                                    onClick={() => handleDeleteAdjustment(adj.id!)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            )}

            {/* Adjustment Dialog */}
            <Dialog open={isAdjustmentModalOpen} onOpenChange={setIsAdjustmentModalOpen}>
                <DialogContent className="sm:max-w-[500px] rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold">
                            {tr('Добавить трансформационную проводку', 'Add Item Adjustment')}
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            {tr('Корректировка для статьи: ', 'Adjusting balance sheet line: ')}
                            <strong className="text-slate-900 dark:text-slate-100 font-semibold">
                                {selectedItem?.account_name} ({selectedItem?.account_code})
                            </strong>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-3 text-xs">
                        <div className="grid grid-cols-4 items-center gap-3">
                            <Label htmlFor="type" className="text-right font-semibold">{tr('Тип записи', 'Type')}</Label>
                            <select
                                id="type"
                                value={newAdjustment.adjustment_type}
                                onChange={(e) => setNewAdjustment({ ...newAdjustment, adjustment_type: e.target.value as 'debit' | 'credit' })}
                                className="col-span-3 flex h-9 w-full rounded-xl border border-input bg-background px-3 py-1.5 text-xs shadow-xs focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="debit">
                                    {tr('Дебет (Дт) — увеличение актива / уменьшение обязательств', 'Debit (Dr) — increase asset / decrease liability')}
                                </option>
                                <option value="credit">
                                    {tr('Кредит (Кт) — уменьшение актива / увеличение обязательств', 'Credit (Cr) — decrease asset / increase liability')}
                                </option>
                            </select>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-3">
                            <Label htmlFor="amount" className="text-right font-semibold">{tr('Сумма', 'Amount')}</Label>
                            <Input
                                id="amount"
                                type="number"
                                value={newAdjustment.adjustment_amount || ''}
                                onChange={(e) => setNewAdjustment({ ...newAdjustment, adjustment_amount: Number(e.target.value) })}
                                placeholder="0.00"
                                className="col-span-3 h-9 text-xs font-mono rounded-xl"
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-3">
                            <Label htmlFor="desc" className="text-right font-semibold">{tr('Обоснование', 'Description')}</Label>
                            <Input
                                id="desc"
                                value={newAdjustment.description}
                                onChange={(e) => setNewAdjustment({ ...newAdjustment, description: e.target.value })}
                                placeholder={tr('Причина проводки, ссылка на стандарт МСФО...', 'Audit justification, IFRS clause...')}
                                className="col-span-3 h-9 text-xs rounded-xl"
                            />
                        </div>
                    </div>

                    {/* Existing Adjustments for this item */}
                    {selectedItem && Array.isArray(balanceSheet?.adjustments) && balanceSheet.adjustments.filter(a => a.balance_sheet_item_id === selectedItem.id).length > 0 && (
                        <div className="border-t border-border pt-3 mt-1">
                            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                                {tr('Уже привязанные проводки по этой статье:', 'Existing adjustments for this item:')}
                            </h4>
                            <div className="space-y-1.5 max-h-36 overflow-y-auto">
                                {balanceSheet.adjustments
                                    .filter(a => a.balance_sheet_item_id === selectedItem.id)
                                    .map(adj => (
                                        <div key={adj.id} className="flex justify-between items-center text-xs bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg border border-border">
                                            <div className="flex items-center gap-2">
                                                <span className={`font-bold font-mono text-[10px] px-1.5 py-0.5 rounded ${adj.adjustment_type === 'debit' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                                                    {adj.adjustment_type === 'debit' ? 'ДТ' : 'КТ'}
                                                </span>
                                                <span className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-[200px]">{adj.description}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono font-bold">{formatMoney(adj.adjustment_amount)}</span>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="h-6 w-6 p-0 text-slate-400 hover:text-rose-600" 
                                                    onClick={() => handleDeleteAdjustment(adj.id!)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2">
                        <Button variant="outline" size="sm" onClick={() => setIsAdjustmentModalOpen(false)} className="rounded-xl">
                            {tr('Отмена', 'Cancel')}
                        </Button>
                        <Button size="sm" onClick={handleSaveAdjustment} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                            {tr('Сохранить корректировку', 'Save Adjustment')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
