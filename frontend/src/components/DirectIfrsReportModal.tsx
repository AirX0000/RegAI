import React, { useState, useMemo } from 'react';
import { 
    Sparkles, AlertTriangle, CheckCircle2, ShieldCheck, 
    X, RefreshCw, Scale, Calendar, Wrench
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import api from '../lib/api';

export interface DirectIfrsReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onReportCreated: (newReport: any) => void;
    companies: any[];
    currentCompanyId?: string;
    isRu?: boolean;
}

export const DirectIfrsReportModal: React.FC<DirectIfrsReportModalProps> = ({
    isOpen,
    onClose,
    onReportCreated,
    companies,
    currentCompanyId = '',
    isRu = true,
}) => {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Meta Fields
    const [title, setTitle] = useState('Годовой финансовый отчет по МСФО 2024');
    const [companyId, setCompanyId] = useState(currentCompanyId || companies[0]?.id || '');
    const reportingPeriod = 'FY 2024';
    const auditorOpinion = 'clean';

    // Balance Sheet Inputs (Direct IFRS Entries in Thousands or Units)
    // Non-Current Assets
    const [ppe, setPpe] = useState<number>(18450000); // Property, plant & equipment (IAS 16)
    const [rouAssets, setRouAssets] = useState<number>(8200000); // Right-of-use assets (IFRS 16)
    const [intangibles, setIntangibles] = useState<number>(4500000); // Intangibles (IAS 38)
    
    // Current Assets
    const [inventories, setInventories] = useState<number>(7150000); // Inventories (IAS 2)
    const [receivables, setReceivables] = useState<number>(10100000); // Trade Receivables gross (IFRS 9)
    const [eclReserve, setEclReserve] = useState<number>(250000); // ECL Provision (IFRS 9)
    const [cash, setCash] = useState<number>(4600000); // Cash and cash equivalents (IAS 7)

    // Liabilities
    const [leaseLiabilities, setLeaseLiabilities] = useState<number>(8200000); // Lease liabilities (IFRS 16)
    const [longTermDebt, setLongTermDebt] = useState<number>(2500000); // Long-term borrowings
    const [shortTermDebt, setShortTermDebt] = useState<number>(1000000); // Short-term debt
    const [payables, setPayables] = useState<number>(750000); // Trade payables
    const [taxLiabilities, setTaxLiabilities] = useState<number>(200000); // Income tax payable (IAS 12)

    // Equity
    const [shareCapital, setShareCapital] = useState<number>(20000000); // Share capital
    const [paidInCapital, setPaidInCapital] = useState<number>(5000000); // Additional capital
    const [retainedEarnings, setRetainedEarnings] = useState<number>(15100000); // Retained earnings (IAS 1)

    // Active sub-tab
    const [activeSection, setActiveSection] = useState<'assets' | 'liabilities' | 'equity'>('assets');

    // Dynamic Calculations
    const totalNonCurrentAssets = useMemo(() => ppe + rouAssets + intangibles, [ppe, rouAssets, intangibles]);
    const totalCurrentAssets = useMemo(() => inventories + (receivables - eclReserve) + cash, [inventories, receivables, eclReserve, cash]);
    const totalAssets = useMemo(() => totalNonCurrentAssets + totalCurrentAssets, [totalNonCurrentAssets, totalCurrentAssets]);

    const totalNonCurrentLiab = useMemo(() => leaseLiabilities + longTermDebt, [leaseLiabilities, longTermDebt]);
    const totalCurrentLiab = useMemo(() => shortTermDebt + payables + taxLiabilities, [shortTermDebt, payables, taxLiabilities]);
    const totalLiabilities = useMemo(() => totalNonCurrentLiab + totalCurrentLiab, [totalNonCurrentLiab, totalCurrentLiab]);

    const totalEquity = useMemo(() => shareCapital + paidInCapital + retainedEarnings, [shareCapital, paidInCapital, retainedEarnings]);
    const totalLiabilitiesAndEquity = useMemo(() => totalLiabilities + totalEquity, [totalLiabilities, totalEquity]);

    // Discrepancy & Ratios
    const balanceDiscrepancy = useMemo(() => totalAssets - totalLiabilitiesAndEquity, [totalAssets, totalLiabilitiesAndEquity]);
    const currentRatio = useMemo(() => totalCurrentLiab > 0 ? (totalCurrentAssets / totalCurrentLiab) : 1, [totalCurrentAssets, totalCurrentLiab]);
    const debtToEquity = useMemo(() => totalEquity > 0 ? (totalLiabilities / totalEquity) : 0, [totalLiabilities, totalEquity]);

    // Validation Issues Detection
    const issues = useMemo(() => {
        const list: Array<{
            id: string;
            severity: 'error' | 'warning' | 'info';
            title: string;
            message: string;
            fixDescription: string;
            applyFix: () => void;
        }> = [];

        // 1. Balance Equation Check: Assets = Liabilities + Equity
        if (Math.abs(balanceDiscrepancy) >= 1) {
            list.push({
                id: 'balance-equilibrium',
                severity: 'error',
                title: isRu ? 'Нарушено балансовое равенство (IAS 1)' : 'Balance Sheet Equilibrium Broken (IAS 1)',
                message: isRu 
                    ? `Активы ($${totalAssets.toLocaleString()}) не равны сумме обязательств и капитала ($${totalLiabilitiesAndEquity.toLocaleString()}). Разрыв: $${balanceDiscrepancy.toLocaleString()}.`
                    : `Assets ($${totalAssets.toLocaleString()}) do not match Liabilities + Equity ($${totalLiabilitiesAndEquity.toLocaleString()}). Variance: $${balanceDiscrepancy.toLocaleString()}.`,
                fixDescription: isRu ? 'Сбалансировать нераспределенную прибыль (Retained Earnings)' : 'Auto-balance Retained Earnings',
                applyFix: () => {
                    setRetainedEarnings(prev => prev + balanceDiscrepancy);
                    toast({
                        title: isRu ? 'Баланс выровнен' : 'Balanced',
                        description: isRu ? 'Нераспределенная прибыль скорректирована. Разрыв равен 0.' : 'Retained Earnings updated to restore equilibrium.'
                    });
                }
            });
        }

        // 2. IFRS 16 Leases: ROU Assets without Lease Liabilities
        if (rouAssets > 0 && leaseLiabilities === 0) {
            list.push({
                id: 'ifrs16-mismatch',
                severity: 'error',
                title: isRu ? 'Несоответствие стандарту IFRS 16 (Аренда)' : 'IFRS 16 Lease Mismatch',
                message: isRu
                    ? `Отражен актив права пользования ROU ($${rouAssets.toLocaleString()}), но обязательство по аренде равно 0.`
                    : `ROU asset ($${rouAssets.toLocaleString()}) recognized without corresponding lease liabilities.`,
                fixDescription: isRu ? 'Начислить обязательство по аренде на сумму актива' : 'Match Lease Liability with ROU Asset',
                applyFix: () => {
                    setLeaseLiabilities(rouAssets);
                    // Adjust retained earnings to keep balance if needed
                    setRetainedEarnings(prev => prev - rouAssets);
                    toast({
                        title: isRu ? 'Аренда сбалансирована' : 'Lease Reconciled',
                        description: isRu ? 'Обязательство IFRS 16 создано.' : 'IFRS 16 liabilities recorded.'
                    });
                }
            });
        }

        // 3. IFRS 9 Financial Instruments: Receivables without ECL Reserve
        if (receivables > 0 && eclReserve === 0) {
            list.push({
                id: 'ifrs9-ecl',
                severity: 'warning',
                title: isRu ? 'Отсутствует резерв ожидаемых кредитных убытков (IFRS 9)' : 'Missing ECL Reserve (IFRS 9)',
                message: isRu
                    ? 'По торговой дебиторской задолженности не начислен нормативный резерв обесценения (ECL).'
                    : 'No expected credit loss (ECL) allowance provisioned for trade receivables.',
                fixDescription: isRu ? 'Начислить стандартный резерв ECL (2.5%)' : 'Provision 2.5% standard ECL allowance',
                applyFix: () => {
                    const normEcl = Math.round(receivables * 0.025);
                    setEclReserve(normEcl);
                    setRetainedEarnings(prev => prev - normEcl);
                    toast({
                        title: isRu ? 'Резерв ECL начислен' : 'ECL Provisioned',
                        description: isRu ? `Начислен резерв $${normEcl.toLocaleString()} (2.5%).` : `ECL reserve of $${normEcl.toLocaleString()} applied.`
                    });
                }
            });
        }

        // 4. Liquidity Health Warning: Current Ratio < 1.0
        if (currentRatio < 1.0) {
            list.push({
                id: 'liquidity-risk',
                severity: 'warning',
                title: isRu ? 'Критический дефицит ликвидности' : 'Liquidity Deficit Warning',
                message: isRu
                    ? `Коэффициент текущей ликвидности (${currentRatio.toFixed(2)}x) ниже 1.00x. Краткосрочные обязательства превышают оборотные активы.`
                    : `Current ratio (${currentRatio.toFixed(2)}x) is below 1.00x. Current liabilities exceed liquid assets.`,
                fixDescription: isRu ? 'Реструктурировать $500,000 краткосрочного долга в долгосрочный' : 'Restructure $500,000 short debt into long-term',
                applyFix: () => {
                    setShortTermDebt(prev => Math.max(0, prev - 500000));
                    setLongTermDebt(prev => prev + 500000);
                    toast({
                        title: isRu ? 'Ликвидность улучшена' : 'Liquidity Adjusted',
                        description: isRu ? 'Краткосрочный долг переведен в долгосрочный.' : 'Debt restructured into long-term.'
                    });
                }
            });
        }

        return list;
    }, [balanceDiscrepancy, rouAssets, leaseLiabilities, receivables, eclReserve, currentRatio, totalAssets, totalLiabilitiesAndEquity, isRu]);

    // Apply Presets
    const handleApplyPreset = (presetName: 'audit' | 'q3' | 'blank') => {
        if (presetName === 'audit') {
            setTitle(isRu ? 'Годовой аудиторский отчет МСФО 2024' : 'Annual Financial Audit IFRS 2024');
            setPpe(18450000);
            setRouAssets(8200000);
            setIntangibles(4500000);
            setInventories(7150000);
            setReceivables(10100000);
            setEclReserve(250000);
            setCash(4600000);
            setLeaseLiabilities(8200000);
            setLongTermDebt(2500000);
            setShortTermDebt(1000000);
            setPayables(750000);
            setTaxLiabilities(200000);
            setShareCapital(20000000);
            setPaidInCapital(5000000);
            setRetainedEarnings(15100000);
        } else if (presetName === 'q3') {
            setTitle(isRu ? 'Квартальный баланс по МСФО — Q3' : 'Q3 Interim IFRS Statement');
            setPpe(12000000);
            setRouAssets(4000000);
            setIntangibles(2000000);
            setInventories(5000000);
            setReceivables(6000000);
            setEclReserve(150000);
            setCash(3500000);
            setLeaseLiabilities(4000000);
            setLongTermDebt(1500000);
            setShortTermDebt(800000);
            setPayables(550000);
            setTaxLiabilities(100000);
            setShareCapital(15000000);
            setPaidInCapital(2000000);
            setRetainedEarnings(8400000);
        } else {
            setTitle(isRu ? 'Новый отчет по МСФО' : 'New Custom IFRS Report');
            setPpe(1000000);
            setRouAssets(0);
            setIntangibles(0);
            setInventories(500000);
            setReceivables(500000);
            setEclReserve(0);
            setCash(500000);
            setLeaseLiabilities(0);
            setLongTermDebt(0);
            setShortTermDebt(200000);
            setPayables(300000);
            setTaxLiabilities(0);
            setShareCapital(1000000);
            setPaidInCapital(0);
            setRetainedEarnings(1000000);
        }
        toast({
            title: isRu ? 'Шаблон применен' : 'Preset Applied',
            description: isRu ? 'Форма заполнена эталонными значениями.' : 'Form populated with preset values.'
        });
    };

    // Auto-fix all issues in one click
    const handleFixAllIssues = () => {
        issues.forEach(issue => issue.applyFix());
        toast({
            title: isRu ? 'Все замечания устранены' : 'All Issues Resolved',
            description: isRu ? 'Отчет приведен в полное соответствие с МСФО.' : 'IFRS compliance rules satisfied.'
        });
    };

    const handleCreateReport = async () => {
        if (!title.trim()) {
            toast({
                variant: 'destructive',
                title: isRu ? 'Ошибка' : 'Error',
                description: isRu ? 'Укажите название отчета' : 'Please provide report title'
            });
            return;
        }

        try {
            setIsSubmitting(true);
            const targetCompany = companies.find(c => c.id === companyId) || companies[0];
            const compName = targetCompany?.name || 'FinBridge Capital';

            const payloadFinancialData = {
                total_assets: totalAssets,
                total_liabilities: totalLiabilities,
                total_equity: totalEquity,
                current_ratio: currentRatio,
                debt_to_equity: debtToEquity,
                working_capital: totalCurrentAssets - totalCurrentLiab,
                risk_score: issues.length === 0 ? 98 : 75,
                opinion: auditorOpinion === 'clean' ? 'Unmodified Clean Opinion (ISA 700)' : 'Qualified Audit Opinion',
                is_balanced: Math.abs(balanceDiscrepancy) < 1,
            };

            const reportPayload = {
                title,
                description: `${isRu ? 'Прямой регуляторный отчет по МСФО' : 'Direct IFRS Regulatory Filing'} (${reportingPeriod}) для ${compName}. Валидация баланса: A=$${(totalAssets/1e6).toFixed(2)}M, L=$${(totalLiabilities/1e6).toFixed(2)}M, E=$${(totalEquity/1e6).toFixed(2)}M.`,
                report_type: 'audit',
                company_id: targetCompany?.id || companyId,
                status: 'under_review',
                file_name: `${title.replace(/\s+/g, '_')}.pdf`,
                file_size: 2450000,
                financial_data: payloadFinancialData
            };

            const res = await api.post('/reports/', reportPayload);
            const created = res.data;

            toast({
                title: isRu ? 'Отчет успешно создан!' : 'Report Created Successfully!',
                description: isRu ? 'Готовый отчет по МСФО сохранен и готов к предпросмотру.' : 'Ready-made IFRS report saved.'
            });

            onReportCreated(created);
            onClose();
        } catch (err: any) {
            console.error('Failed to create direct IFRS report', err);
            toast({
                variant: 'destructive',
                title: isRu ? 'Ошибка сохранения' : 'Creation Failed',
                description: err.response?.data?.detail || (isRu ? 'Не удалось сохранить отчет' : 'Failed to save report')
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl text-slate-900 dark:text-slate-100 overflow-hidden">
                
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shrink-0 shadow-md">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                                    {isRu ? 'Создание отчета напрямую по МСФО (IFRS)' : 'Direct IFRS Report Builder'}
                                </h2>
                                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                    {isRu ? 'Без трансформации' : 'Direct Entry'}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {isRu 
                                    ? 'Ввод готовых финансовых показателей с мгновенной верификацией ошибок и аудиторскими подсказками'
                                    : 'Direct entry of standard IFRS line items with real-time discrepancy detection & auto-fix'}
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        aria-label={isRu ? "Закрыть модальное окно" : "Close modal"}
                        className="h-8 w-8 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                {/* Preset bar */}
                <div className="px-4 sm:px-5 py-2.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-100/50 dark:bg-slate-800/20 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                        {isRu ? 'Готовые шаблоны стандартов:' : 'Standard Presets:'}
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApplyPreset('audit')}
                            className="h-7 text-xs bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 cursor-pointer"
                        >
                            <Scale className="w-3 h-3 mr-1 text-purple-500" />
                            {isRu ? 'Годовой аудит (ISA 700)' : 'Annual Audit (ISA 700)'}
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApplyPreset('q3')}
                            className="h-7 text-xs bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 cursor-pointer"
                        >
                            <Calendar className="w-3 h-3 mr-1 text-blue-500" />
                            {isRu ? 'Квартальный баланс (IAS 34)' : 'Q3 Statement (IAS 34)'}
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleApplyPreset('blank')}
                            className="h-7 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                        >
                            {isRu ? 'Сбросить в чистый бланк' : 'Clear Form'}
                        </Button>
                    </div>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                    
                    {/* Meta Config Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                        <div className="sm:col-span-2 space-y-1">
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                {isRu ? 'Название отчета' : 'Report Title'}
                            </label>
                            <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Report title"
                                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-xs h-9"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                {isRu ? 'Организация' : 'Company'}
                            </label>
                            <select
                                value={companyId}
                                onChange={(e) => setCompanyId(e.target.value)}
                                className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs px-2.5 text-slate-900 dark:text-slate-100"
                            >
                                {companies.map((c: any) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* LIVE AUDIT DIAGNOSTIC & DISCREPANCY GUARDIAN */}
                    <div className={`p-4 rounded-xl border transition-all ${
                        issues.length === 0
                            ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60'
                            : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/60'
                    }`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                {issues.length === 0 ? (
                                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                                        <CheckCircle2 className="w-5 h-5" />
                                    </div>
                                ) : (
                                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                                        <AlertTriangle className="w-5 h-5" />
                                    </div>
                                )}
                                <div>
                                    <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                                        <span>
                                            {issues.length === 0 
                                                ? (isRu ? '✓ Баланс МСФО верифицирован (Ошибок нет)' : '✓ IFRS Balance Verified (Zero Errors)')
                                                : (isRu ? `Обнаружено замечаний: ${issues.length}` : `Validation Issues: ${issues.length}`)}
                                        </span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-bold ${
                                            Math.abs(balanceDiscrepancy) < 1 
                                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                                                : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                                        }`}>
                                            Δ {balanceDiscrepancy === 0 ? '$0.00' : `$${balanceDiscrepancy.toLocaleString()}`}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                                        {issues.length === 0 
                                            ? (isRu ? 'Активы строго равны сумме обязательств и капитала. Все нормативные стандарты соблюдены.' : 'A = L + E verified. All standards pass.')
                                            : (isRu ? 'Ниже приведены рекомендации и кнопки автоматического исправления.' : 'Follow instructions below or use auto-fix.')}
                                    </p>
                                </div>
                            </div>

                            {issues.length > 0 && (
                                <Button
                                    size="sm"
                                    onClick={handleFixAllIssues}
                                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-8 gap-1.5 shadow-sm cursor-pointer self-start sm:self-auto shrink-0"
                                >
                                    <Wrench className="w-3.5 h-3.5" />
                                    <span>{isRu ? 'Исправить все ошибки авто-сверкой' : 'Auto-Fix All Issues'}</span>
                                </Button>
                            )}
                        </div>

                        {/* List of Issues with "How to fix" actions */}
                        {issues.length > 0 && (
                            <div className="mt-3.5 space-y-2.5 pt-3 border-t border-amber-200 dark:border-amber-900/50">
                                {issues.map((iss) => (
                                    <div 
                                        key={iss.id}
                                        className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                                    >
                                        <div className="space-y-1">
                                            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                                                <span className={`w-2 h-2 rounded-full ${iss.severity === 'error' ? 'bg-red-500' : 'bg-amber-500'}`} />
                                                <span>{iss.title}</span>
                                            </div>
                                            <p className="text-slate-600 dark:text-slate-400">
                                                {iss.message}
                                            </p>
                                            <div className="text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
                                                <span>💡 {isRu ? 'Как исправить:' : 'How to fix:'}</span>
                                                <span>{iss.fixDescription}</span>
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={iss.applyFix}
                                            className="text-xs h-7.5 border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 shrink-0 self-end sm:self-center cursor-pointer"
                                        >
                                            <RefreshCw className="w-3 h-3 mr-1" />
                                            <span>{isRu ? 'Применить исправление' : 'Apply Fix'}</span>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Summary KPI Strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30">
                            <div className="text-[10px] text-slate-500 uppercase font-semibold">{isRu ? 'ИТОГО АКТИВЫ (A)' : 'TOTAL ASSETS'}</div>
                            <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                                ${(totalAssets).toLocaleString()}
                            </div>
                        </div>
                        <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30">
                            <div className="text-[10px] text-slate-500 uppercase font-semibold">{isRu ? 'ИТОГО ОБЯЗАТЕЛЬСТВА (L)' : 'TOTAL LIABILITIES'}</div>
                            <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                                ${(totalLiabilities).toLocaleString()}
                            </div>
                        </div>
                        <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30">
                            <div className="text-[10px] text-slate-500 uppercase font-semibold">{isRu ? 'ИТОГО КАПИТАЛ (E)' : 'TOTAL EQUITY'}</div>
                            <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                                ${(totalEquity).toLocaleString()}
                            </div>
                        </div>
                        <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30">
                            <div className="text-[10px] text-slate-500 uppercase font-semibold">{isRu ? 'ЛИКВИДНОСТЬ (CR)' : 'CURRENT RATIO'}</div>
                            <div className={`text-base sm:text-lg font-bold font-mono mt-0.5 ${currentRatio >= 1.15 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600'}`}>
                                {currentRatio.toFixed(2)}x
                            </div>
                        </div>
                    </div>

                    {/* Section Selector Tabs */}
                    <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800">
                        <button
                            onClick={() => setActiveSection('assets')}
                            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                                activeSection === 'assets'
                                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                        >
                            {isRu ? '1. Активы (Assets)' : '1. Assets'} (${totalAssets.toLocaleString()})
                        </button>
                        <button
                            onClick={() => setActiveSection('liabilities')}
                            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                                activeSection === 'liabilities'
                                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                        >
                            {isRu ? '2. Обязательства (Liabilities)' : '2. Liabilities'} (${totalLiabilities.toLocaleString()})
                        </button>
                        <button
                            onClick={() => setActiveSection('equity')}
                            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                                activeSection === 'equity'
                                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                        >
                            {isRu ? '3. Собственный капитал (Equity)' : '3. Equity'} (${totalEquity.toLocaleString()})
                        </button>
                    </div>

                    {/* Inputs by Active Section */}
                    {activeSection === 'assets' && (
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                {isRu ? 'Внеоборотные активы (Non-current assets)' : 'Non-current assets'}
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-500 font-medium">Основные средства / PPE (IAS 16)</label>
                                    <Input
                                        type="number"
                                        value={ppe}
                                        onChange={(e) => setPpe(Number(e.target.value) || 0)}
                                        className="h-8 text-xs font-mono mt-1"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-500 font-medium">Активы права пользования / ROU (IFRS 16)</label>
                                    <Input
                                        type="number"
                                        value={rouAssets}
                                        onChange={(e) => setRouAssets(Number(e.target.value) || 0)}
                                        className="h-8 text-xs font-mono mt-1"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-500 font-medium">Нематериальные активы (IAS 38)</label>
                                    <Input
                                        type="number"
                                        value={intangibles}
                                        onChange={(e) => setIntangibles(Number(e.target.value) || 0)}
                                        className="h-8 text-xs font-mono mt-1"
                                    />
                                </div>
                            </div>

                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 pt-2">
                                {isRu ? 'Оборотные активы (Current assets)' : 'Current assets'}
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-500 font-medium">Запасы / Inventories (IAS 2)</label>
                                    <Input
                                        type="number"
                                        value={inventories}
                                        onChange={(e) => setInventories(Number(e.target.value) || 0)}
                                        className="h-8 text-xs font-mono mt-1"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-500 font-medium">Дебиторская задолженность (IFRS 9)</label>
                                    <Input
                                        type="number"
                                        value={receivables}
                                        onChange={(e) => setReceivables(Number(e.target.value) || 0)}
                                        className="h-8 text-xs font-mono mt-1"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-500 font-medium">Резерв обесценения ECL (IFRS 9)</label>
                                    <Input
                                        type="number"
                                        value={eclReserve}
                                        onChange={(e) => setEclReserve(Number(e.target.value) || 0)}
                                        className="h-8 text-xs font-mono mt-1 text-red-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-500 font-medium">Денежные средства / Cash (IAS 7)</label>
                                    <Input
                                        type="number"
                                        value={cash}
                                        onChange={(e) => setCash(Number(e.target.value) || 0)}
                                        className="h-8 text-xs font-mono mt-1"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'liabilities' && (
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                {isRu ? 'Долгосрочные обязательства' : 'Non-current liabilities'}
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-500 font-medium">Обязательства по аренде (IFRS 16)</label>
                                    <Input
                                        type="number"
                                        value={leaseLiabilities}
                                        onChange={(e) => setLeaseLiabilities(Number(e.target.value) || 0)}
                                        className="h-8 text-xs font-mono mt-1"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-500 font-medium">Долгосрочные кредиты и займы</label>
                                    <Input
                                        type="number"
                                        value={longTermDebt}
                                        onChange={(e) => setLongTermDebt(Number(e.target.value) || 0)}
                                        className="h-8 text-xs font-mono mt-1"
                                    />
                                </div>
                            </div>

                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 pt-2">
                                {isRu ? 'Краткосрочные обязательства' : 'Current liabilities'}
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-500 font-medium">Краткосрочные кредиты</label>
                                    <Input
                                        type="number"
                                        value={shortTermDebt}
                                        onChange={(e) => setShortTermDebt(Number(e.target.value) || 0)}
                                        className="h-8 text-xs font-mono mt-1"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-500 font-medium">Торговая кредиторская задолженность</label>
                                    <Input
                                        type="number"
                                        value={payables}
                                        onChange={(e) => setPayables(Number(e.target.value) || 0)}
                                        className="h-8 text-xs font-mono mt-1"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-500 font-medium">Текущие обязательства по налогам (IAS 12)</label>
                                    <Input
                                        type="number"
                                        value={taxLiabilities}
                                        onChange={(e) => setTaxLiabilities(Number(e.target.value) || 0)}
                                        className="h-8 text-xs font-mono mt-1"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'equity' && (
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                {isRu ? 'Собственный капитал (Equity - IAS 1)' : 'Equity (IAS 1)'}
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="text-[11px] text-slate-500 font-medium">Уставный капитал (Share Capital)</label>
                                    <Input
                                        type="number"
                                        value={shareCapital}
                                        onChange={(e) => setShareCapital(Number(e.target.value) || 0)}
                                        className="h-8 text-xs font-mono mt-1"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-500 font-medium">Добавочный капитал (Paid-in Capital)</label>
                                    <Input
                                        type="number"
                                        value={paidInCapital}
                                        onChange={(e) => setPaidInCapital(Number(e.target.value) || 0)}
                                        className="h-8 text-xs font-mono mt-1"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-500 font-medium">Нераспределенная прибыль (Retained Earnings)</label>
                                    <Input
                                        type="number"
                                        value={retainedEarnings}
                                        onChange={(e) => setRetainedEarnings(Number(e.target.value) || 0)}
                                        className="h-8 text-xs font-mono mt-1 font-bold text-blue-600 dark:text-blue-400"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer Controls */}
                <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>
                            {isRu 
                                ? 'Готовый отчет автоматически сертифицируется цифровой подписью ЭЦП' 
                                : 'Created report is automatically signed with SHA-256 digital signature'}
                        </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="text-xs h-9 dark:border-slate-700 cursor-pointer"
                        >
                            {isRu ? 'Отмена' : 'Cancel'}
                        </Button>
                        <Button
                            onClick={handleCreateReport}
                            disabled={isSubmitting}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 gap-1.5 shadow-sm cursor-pointer"
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>
                                {isSubmitting 
                                    ? (isRu ? 'Создание отчета...' : 'Creating...') 
                                    : (isRu ? 'Сформировать и открыть IFRS отчет' : 'Generate & Open IFRS Report')}
                            </span>
                        </Button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default DirectIfrsReportModal;
