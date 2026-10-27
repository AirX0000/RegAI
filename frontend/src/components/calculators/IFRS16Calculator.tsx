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
import { Building2, CheckCircle2, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface IFRS16CalculatorProps {
    onCalculate: (rouAsset: number, leaseLiability: number) => void;
    trigger?: React.ReactNode;
}

export default function IFRS16Calculator({ onCalculate, trigger }: IFRS16CalculatorProps) {
    const { toast } = useToast();
    const { i18n } = useTranslation();
    const isRu = (i18n.language || 'ru').toLowerCase().startsWith('ru');

    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    
    const [leaseTerm, setLeaseTerm] = useState<string>('60');
    const [discountRate, setDiscountRate] = useState<string>('5.0');
    const [monthlyPayment, setMonthlyPayment] = useState<string>('5000');
    const [initialCosts, setInitialCosts] = useState<string>('0');

    // Instant real-time calculation
    const result = useMemo(() => {
        const term = parseInt(leaseTerm, 10) || 0;
        const rate = parseFloat(discountRate) || 0;
        const pmt = parseFloat(monthlyPayment) || 0;
        const directCosts = parseFloat(initialCosts) || 0;

        if (term <= 0 || pmt <= 0) return null;

        const rMonthly = (rate / 100) / 12;
        let pv = 0;
        if (rMonthly > 0) {
            pv = pmt * ((1 - Math.pow(1 + rMonthly, -term)) / rMonthly);
        } else {
            pv = pmt * term;
        }
        pv = Math.round(pv * 100) / 100;
        const rou = Math.round((pv + directCosts) * 100) / 100;
        const totalPayments = Math.round(pmt * term * 100) / 100;
        const interestComponent = Math.round((totalPayments - pv) * 100) / 100;

        return {
            rou,
            liability: pv,
            totalPayments,
            interestComponent,
            monthlyRatePct: Math.round(rMonthly * 100 * 1000) / 1000
        };
    }, [leaseTerm, discountRate, monthlyPayment, initialCosts]);

    const handleCalculate = async () => {
        setLoading(true);
        try {
            await api.post('/calculators/ifrs16', {
                lease_term_months: parseInt(leaseTerm) || 12,
                discount_rate_annual: parseFloat(discountRate) || 0,
                monthly_payment: parseFloat(monthlyPayment) || 0,
                initial_direct_costs: parseFloat(initialCosts) || 0
            });
            toast({
                title: isRu ? "Расчет обновлен" : "Calculation Updated",
                description: isRu 
                    ? `ROU актив: $${result?.rou.toLocaleString() || '0'}, Обязательство: $${result?.liability.toLocaleString() || '0'}`
                    : `ROU Asset: $${result?.rou.toLocaleString() || '0'}, Liability: $${result?.liability.toLocaleString() || '0'}`
            });
        } catch (error) {
            toast({
                title: isRu ? "Расчет обновлен" : "Calculation Updated",
                description: isRu 
                    ? `Рассчитано локальным движком МСФО 16: ROU $${result?.rou.toLocaleString() || '0'}`
                    : `Calculated locally: ROU $${result?.rou.toLocaleString() || '0'}`
            });
        } finally {
            setLoading(false);
        }
    };

    const handleApply = () => {
        if (result && result.rou > 0) {
            onCalculate(result.rou, result.liability);
            setOpen(false);
            toast({
                title: isRu ? "Аренда МСФО 16 капитализирована" : "IFRS 16 Lease Capitalized",
                description: isRu 
                    ? `Признан актив ROU ($${result.rou.toLocaleString()}) и обязательство ($${result.liability.toLocaleString()})`
                    : `Recognized ROU Asset ($${result.rou.toLocaleString()}) & Liability ($${result.liability.toLocaleString()})`
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" className="border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 font-medium">
                        <Building2 className="w-3.5 h-3.5 mr-1.5" />
                        {isRu ? 'Калькулятор аренды (IFRS 16)' : 'IFRS 16 (Leases) Calculator'}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                            <span>{isRu ? 'Калькулятор аренды (МСФО 16)' : 'IFRS 16 Lease Capitalization'}</span>
                            <span className="block text-[11px] font-normal text-slate-500 dark:text-slate-400">
                                {isRu ? 'Дисконтирование аннуитета (NPV) арендных платежей' : 'Present Value (NPV) capitalization for Right-of-Use assets'}
                            </span>
                        </div>
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500">
                        {isRu 
                            ? 'Капитализация прав пользования активом (ROU) и признание финансового обязательства по дисконтированной ставке.'
                            : 'Calculate Present Value of lease payments and recognize ROU asset and lease liability.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-3 py-2 text-xs">
                    <div className="grid grid-cols-4 items-center gap-3">
                        <Label htmlFor="lease_term" className="text-right text-xs font-medium text-slate-700 dark:text-slate-300">
                            {isRu ? 'Срок (месяцы):' : 'Term (Months):'}
                        </Label>
                        <Input 
                            id="lease_term" 
                            type="number"
                            value={leaseTerm}
                            onChange={(e) => setLeaseTerm(e.target.value)}
                            className="col-span-3 h-8 text-xs font-mono font-semibold" 
                            placeholder="60"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-3">
                        <Label htmlFor="discount_rate" className="text-right text-xs font-medium text-slate-700 dark:text-slate-300">
                            {isRu ? 'Ставка (% год):' : 'Discount Rate (%):'}
                        </Label>
                        <Input 
                            id="discount_rate" 
                            type="number"
                            step="0.1"
                            value={discountRate}
                            onChange={(e) => setDiscountRate(e.target.value)}
                            className="col-span-3 h-8 text-xs font-mono" 
                            placeholder="5.0"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-3">
                        <Label htmlFor="monthly_payment" className="text-right text-xs font-medium text-slate-700 dark:text-slate-300">
                            {isRu ? 'Платеж в месяц:' : 'Monthly Payment:'}
                        </Label>
                        <div className="col-span-3 relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                            <Input 
                                id="monthly_payment" 
                                type="number"
                                value={monthlyPayment}
                                onChange={(e) => setMonthlyPayment(e.target.value)}
                                className="h-8 pl-6 text-xs font-mono font-semibold" 
                                placeholder="5000"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-3">
                        <Label htmlFor="initial_costs" className="text-right text-xs font-medium text-slate-700 dark:text-slate-300">
                            {isRu ? 'Прямые затраты:' : 'Initial Costs:'}
                        </Label>
                        <div className="col-span-3 relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                            <Input 
                                id="initial_costs" 
                                type="number"
                                value={initialCosts}
                                onChange={(e) => setInitialCosts(e.target.value)}
                                className="h-8 pl-6 text-xs font-mono" 
                                placeholder="0"
                            />
                        </div>
                    </div>
                </div>
                
                {result && (
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2.5 text-xs animate-in fade-in duration-200">
                        <div className="grid grid-cols-2 gap-2 font-mono">
                            <div className="p-2 rounded-lg bg-blue-500/5 border border-blue-500/15">
                                <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-sans">
                                    {isRu ? 'Актив ROU (Дебет):' : 'ROU Asset (Debit):'}
                                </span>
                                <span className="text-base font-extrabold text-blue-600 dark:text-blue-400">
                                    ${result.rou.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                <span className="block text-[10px] text-slate-500 font-sans mt-0.5">
                                    {isRu ? 'Капитализация актива' : 'Asset Capitalization'}
                                </span>
                            </div>
                            <div className="p-2 rounded-lg bg-indigo-500/5 border border-indigo-500/15">
                                <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-sans">
                                    {isRu ? 'Обязательство (Кредит):' : 'Lease Liability (Credit):'}
                                </span>
                                <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">
                                    ${result.liability.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                <span className="block text-[10px] text-slate-500 font-sans mt-0.5">
                                    {isRu ? `Проценты: $${result.interestComponent.toLocaleString()}` : `Interest: $${result.interestComponent.toLocaleString()}`}
                                </span>
                            </div>
                        </div>
                        <div className="pt-2 text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                            <span>{isRu ? 'Проводка трансформации:' : 'Accounting Entry:'}</span>
                            <span className="font-mono text-slate-900 dark:text-slate-200 font-semibold bg-slate-200/60 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                Дт 08/01 (ROU) — Кт 76 (${result.liability.toLocaleString()})
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
                        disabled={!result || result.rou <= 0} 
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm"
                        size="sm"
                    >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                        {isRu ? 'Применить корректировку IFRS 16' : 'Apply Adjustment'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
