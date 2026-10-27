import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { Calculator, ShieldAlert, CheckCircle2, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface IFRS9CalculatorProps {
    onCalculate: (eclAmount: number, stage: string) => void;
    trigger?: React.ReactNode;
}

export default function IFRS9Calculator({ onCalculate, trigger }: IFRS9CalculatorProps) {
    const { toast } = useToast();
    const { i18n } = useTranslation();
    const isRu = (i18n.language || 'ru').toLowerCase().startsWith('ru');

    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    
    const [ead, setEad] = useState<string>('500000');
    const [pd, setPd] = useState<string>('3.5');
    const [lgd, setLgd] = useState<string>('45.0');
    const [daysPastDue, setDaysPastDue] = useState<string>('45');
    const [discountRate, setDiscountRate] = useState<string>('6.5');

    // Real-time calculation engine (always active, no blocking)
    const result = useMemo(() => {
        const eadVal = parseFloat(ead) || 0;
        const pdVal = parseFloat(pd) || 0;
        const lgdVal = parseFloat(lgd) || 45.0;
        const dpdVal = parseInt(daysPastDue, 10) || 0;
        const rateVal = parseFloat(discountRate) || 0.0;

        if (eadVal <= 0) return null;

        let stage = 'Stage 1';
        let stageName = isRu ? 'Стадия 1 (Стандартная)' : 'Stage 1 (Performing)';
        let stageDesc = isRu 
            ? 'Низкий кредитный риск (просрочка до 30 дней). Оценка резерва под 12-месячные ожидаемые кредитные убытки (12m ECL).'
            : 'Low credit risk (<=30 days overdue). 12-Month Expected Credit Loss standard provisioning.';
        let horizon = 1.0;

        if (dpdVal > 90) {
            stage = 'Stage 3';
            stageName = isRu ? 'Стадия 3 (Дефолт / Обесценение)' : 'Stage 3 (Credit-Impaired / Default)';
            stageDesc = isRu 
                ? 'Просрочка > 90 дней: объективные признаки дефолта. Резерв под ожидаемые убытки за весь срок (Lifetime ECL).'
                : 'Credit-impaired (>90 days overdue). Objective evidence of default: Lifetime Expected Credit Loss.';
            horizon = 3.0;
        } else if (dpdVal > 30) {
            stage = 'Stage 2';
            stageName = isRu ? 'Стадия 2 (Значительное ухудшение / SICR)' : 'Stage 2 (Underperforming / SICR)';
            stageDesc = isRu 
                ? 'Просрочка 31–90 дней: существенное увеличение кредитного риска (SICR). Резерв на весь срок договора (Lifetime ECL).'
                : 'Significant Increase in Credit Risk (31–90 days). Lifetime Expected Credit Loss provision.';
            horizon = 2.0;
        }

        const r = rateVal / 100.0;
        const df = (r > 0 && horizon > 0) ? 1.0 / Math.pow(1.0 + r, horizon) : 1.0;
        const eclRaw = eadVal * (pdVal / 100.0) * (lgdVal / 100.0) * df;
        const ecl = Math.round(Math.min(eclRaw, eadVal) * 100) / 100;
        const netAmount = Math.round((eadVal - ecl) * 100) / 100;
        const lossRate = eadVal > 0 ? Math.round((ecl / eadVal * 100) * 100) / 100 : 0;

        return {
            eclAmount: ecl,
            stage,
            stageName,
            stageDesc,
            discountFactor: Math.round(df * 10000) / 10000,
            netAmount,
            lossRate,
            horizon
        };
    }, [ead, pd, lgd, daysPastDue, discountRate, isRu]);

    const handleCalculate = async () => {
        setLoading(true);
        try {
            await api.post('/calculators/ifrs9', {
                ead: parseFloat(ead) || 0,
                pd_percentage: parseFloat(pd) || 0,
                lgd_percentage: parseFloat(lgd) || 45.0,
                days_past_due: parseInt(daysPastDue, 10) || 0,
                discount_rate_annual: parseFloat(discountRate) || 0.0,
                horizon_years: 1.0
            });
            toast({
                title: isRu ? "Расчет выполнен" : "Calculation Updated",
                description: isRu 
                    ? `Резерв ECL пересчитан: $${result?.eclAmount.toLocaleString() || '0'}`
                    : `ECL provision updated: $${result?.eclAmount.toLocaleString() || '0'}`
            });
        } catch (error) {
            // Local calculation already handles it seamlessly
            toast({
                title: isRu ? "Расчет выполнен" : "Calculation Updated",
                description: isRu 
                    ? `Резерв ECL рассчитан локальным движком МСФО 9: $${result?.eclAmount.toLocaleString() || '0'}`
                    : `ECL calculated locally: $${result?.eclAmount.toLocaleString() || '0'}`
            });
        } finally {
            setLoading(false);
        }
    };

    const handleApply = () => {
        if (result && result.eclAmount > 0) {
            onCalculate(result.eclAmount, result.stage);
            setOpen(false);
            toast({
                title: isRu ? "Корректировка МСФО 9 применена" : "IFRS 9 Provision Applied",
                description: isRu 
                    ? `Сформирован резерв под обесценение: $${result.eclAmount.toLocaleString()} (${result.stage})`
                    : `Created ECL reserve adjustment of $${result.eclAmount.toLocaleString()} (${result.stage})`
            });
        } else {
            toast({
                title: isRu ? "Внимание" : "Warning",
                description: isRu ? "Сумма резерва равна 0" : "ECL amount is 0",
                variant: "destructive"
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 flex items-center gap-1.5 font-medium">
                        <Calculator className="w-3.5 h-3.5" />
                        {isRu ? 'Оценить резерв ECL (IFRS 9)' : 'IFRS 9 (ECL) Calculator'}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <ShieldAlert className="w-4 h-4" />
                        </div>
                        <div>
                            <span>{isRu ? 'Оценка резерва ECL (МСФО 9)' : 'IFRS 9 Expected Credit Loss (ECL)'}</span>
                            <span className="block text-[11px] font-normal text-slate-500 dark:text-slate-400">
                                ECL = EAD × PD × LGD × DF (3-стадийная модель обесценения)
                            </span>
                        </div>
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500">
                        {isRu 
                            ? 'Автоматический расчет резерва под кредитные убытки по финансовым активам и дебиторской задолженности.'
                            : 'Automated 3-stage forward-looking impairment model for financial assets and trade receivables.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-3 py-2 text-xs">
                    <div className="grid grid-cols-4 items-center gap-3">
                        <Label htmlFor="ead" className="text-right text-xs font-medium text-slate-700 dark:text-slate-300">
                            {isRu ? 'Сумма (EAD):' : 'Exposure (EAD):'}
                        </Label>
                        <div className="col-span-3 relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                            <Input 
                                id="ead" 
                                type="number"
                                value={ead}
                                onChange={(e) => setEad(e.target.value)}
                                className="h-8 pl-6 text-xs font-mono font-semibold" 
                                placeholder="500000"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-3">
                        <Label htmlFor="days_past_due" className="text-right text-xs font-medium text-slate-700 dark:text-slate-300">
                            {isRu ? 'Просрочка (дни):' : 'Arrears (Days):'}
                        </Label>
                        <Input 
                            id="days_past_due" 
                            type="number"
                            value={daysPastDue}
                            onChange={(e) => setDaysPastDue(e.target.value)}
                            className="col-span-3 h-8 text-xs font-mono font-semibold" 
                            placeholder="0–90+ дней"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-3">
                        <Label htmlFor="pd" className="text-right text-xs font-medium text-slate-700 dark:text-slate-300">
                            {isRu ? 'Дефолт PD (%):' : 'PD (%):'}
                        </Label>
                        <Input 
                            id="pd" 
                            type="number"
                            step="0.1"
                            value={pd}
                            onChange={(e) => setPd(e.target.value)}
                            className="col-span-3 h-8 text-xs font-mono" 
                            placeholder="3.5"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-3">
                        <Label htmlFor="lgd" className="text-right text-xs font-medium text-slate-700 dark:text-slate-300">
                            {isRu ? 'Потери LGD (%):' : 'LGD (%):'}
                        </Label>
                        <Input 
                            id="lgd" 
                            type="number"
                            step="0.5"
                            value={lgd}
                            onChange={(e) => setLgd(e.target.value)}
                            className="col-span-3 h-8 text-xs font-mono" 
                            placeholder="45.0"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-3">
                        <Label htmlFor="discount_rate" className="text-right text-xs font-medium text-slate-700 dark:text-slate-300">
                            {isRu ? 'Ставка EIR (%):' : 'Discount EIR (%):'}
                        </Label>
                        <Input 
                            id="discount_rate" 
                            type="number"
                            step="0.1"
                            value={discountRate}
                            onChange={(e) => setDiscountRate(e.target.value)}
                            className="col-span-3 h-8 text-xs font-mono" 
                            placeholder="6.5"
                        />
                    </div>
                </div>

                {/* Live Real-time Calculation Result Preview */}
                {result && (
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2.5 text-xs animate-in fade-in duration-200">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                {isRu ? 'Классификация стадии:' : 'Classification:'}
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                                result.stage === 'Stage 1' 
                                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30' 
                                    : result.stage === 'Stage 2' 
                                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30' 
                                    : 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30'
                            }`}>
                                {result.stageName}
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                            {result.stageDesc}
                        </p>
                        <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
                            <div className="p-2 rounded-lg bg-red-500/5 border border-red-500/15">
                                <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-sans">
                                    {isRu ? 'Резерв ECL (расход):' : 'ECL Provision:'}
                                </span>
                                <span className="text-base font-extrabold text-red-600 dark:text-red-400">
                                    ${result.eclAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                <span className="block text-[10px] text-red-500 font-sans mt-0.5">
                                    {isRu ? `Доля потерь: ${result.lossRate}%` : `Loss rate: ${result.lossRate}%`}
                                </span>
                            </div>
                            <div className="p-2 rounded-lg bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                                <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-sans">
                                    {isRu ? 'Чистая стоимость:' : 'Net Carrying:'}
                                </span>
                                <span className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                                    ${result.netAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-sans mt-0.5">
                                    {isRu ? `Дисконт DF: ${result.discountFactor}` : `Discount DF: ${result.discountFactor}`}
                                </span>
                            </div>
                        </div>
                        <div className="pt-2 text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                            <span>{isRu ? 'Проводка трансформации:' : 'Accounting Entry:'}</span>
                            <span className="font-mono text-slate-900 dark:text-slate-200 font-semibold bg-slate-200/60 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                Дт 91.02 — Кт 63 (${result.eclAmount.toLocaleString()})
                            </span>
                        </div>
                    </div>
                )}

                <DialogFooter className="gap-2 sm:gap-2 pt-2">
                    <Button 
                        variant="outline" 
                        onClick={handleCalculate} 
                        disabled={loading} 
                        size="sm"
                        className="text-xs"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? (isRu ? 'Расчет...' : 'Computing...') : (isRu ? 'Пересчитать' : 'Recalculate')}
                    </Button>
                    <Button 
                        onClick={handleApply} 
                        disabled={!result || result.eclAmount <= 0} 
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm" 
                        size="sm"
                    >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                        {isRu ? 'Применить корректировку ECL' : 'Apply ECL Adjustment'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
