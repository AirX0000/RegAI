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
import { TrendingDown, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface IAS36CalculatorProps {
    onCalculate: (impairmentLoss: number) => void;
    trigger?: React.ReactNode;
}

export default function IAS36Calculator({ onCalculate, trigger }: IAS36CalculatorProps) {
    const { toast } = useToast();
    const { i18n } = useTranslation();
    const isRu = (i18n.language || 'ru').toLowerCase().startsWith('ru');

    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    
    const [carryingAmount, setCarryingAmount] = useState<string>('100000');
    const [fairValue, setFairValue] = useState<string>('80000');
    const [valueInUse, setValueInUse] = useState<string>('85000');
    
    // Instant real-time calculation
    const result = useMemo(() => {
        const carrying = parseFloat(carryingAmount) || 0;
        const fv = parseFloat(fairValue) || 0;
        const viu = parseFloat(valueInUse) || 0;

        if (carrying <= 0) return null;

        const recoverable = Math.max(fv, viu);
        const loss = carrying > recoverable ? carrying - recoverable : 0;
        const isImpaired = loss > 0;
        const newCarrying = carrying - loss;
        const impairmentPct = carrying > 0 ? Math.round((loss / carrying * 100) * 100) / 100 : 0;

        return {
            impairment: Math.round(loss * 100) / 100,
            recoverable: Math.round(recoverable * 100) / 100,
            newCarrying: Math.round(newCarrying * 100) / 100,
            isImpaired,
            impairmentPct,
            basisUsed: viu >= fv 
                ? (isRu ? 'Ценность использования (DCF)' : 'Value in Use (DCF)') 
                : (isRu ? 'Справедливая стоимость (Fair Value)' : 'Fair Value less costs')
        };
    }, [carryingAmount, fairValue, valueInUse, isRu]);

    const handleCalculate = async () => {
        setLoading(true);
        try {
            await api.post('/calculators/ias36', {
                carrying_amount: parseFloat(carryingAmount) || 0,
                fair_value_less_costs: parseFloat(fairValue) || 0,
                value_in_use: parseFloat(valueInUse) || 0
            });
            toast({
                title: isRu ? "Тест обесценения обновлен" : "Impairment Test Updated",
                description: isRu 
                    ? `Возмещаемая сумма: $${result?.recoverable.toLocaleString() || '0'}`
                    : `Recoverable: $${result?.recoverable.toLocaleString() || '0'}`
            });
        } catch (error) {
            toast({
                title: isRu ? "Тест обесценения обновлен" : "Impairment Test Updated",
                description: isRu 
                    ? `Рассчитано локальным движком IAS 36: $${result?.impairment.toLocaleString() || '0'}`
                    : `Calculated locally: $${result?.impairment.toLocaleString() || '0'}`
            });
        } finally {
            setLoading(false);
        }
    };

    const handleApply = () => {
        if (result && result.isImpaired && result.impairment > 0) {
            onCalculate(result.impairment);
            setOpen(false);
            toast({
                title: isRu ? "Убыток от обесценения признан" : "Impairment Loss Recognized",
                description: isRu 
                    ? `Создана корректировка на сумму: $${result.impairment.toLocaleString()}`
                    : `Applied impairment loss adjustment of $${result.impairment.toLocaleString()}`
            });
        } else if (result && !result.isImpaired) {
            toast({
                title: isRu ? "Обесценение отсутствует" : "No Impairment",
                description: isRu 
                    ? "Возмещаемая стоимость превышает балансовую стоимость. Корректировка не требуется." 
                    : "Recoverable amount exceeds carrying amount. No adjustment needed."
            });
            setOpen(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" className="border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 font-medium">
                        <TrendingDown className="w-3.5 h-3.5 mr-1.5" />
                        {isRu ? 'Тест обесценения (IAS 36)' : 'IAS 36 (Impairment) Calculator'}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                            <TrendingDown className="w-4 h-4" />
                        </div>
                        <div>
                            <span>{isRu ? 'Тест на обесценение активов (IAS 36)' : 'IAS 36 Impairment Test'}</span>
                            <span className="block text-[11px] font-normal text-slate-500 dark:text-slate-400">
                                {isRu ? 'Возмещаемая сумма = max(Справедливая стоимость, Ценность использования)' : 'Recoverable Amount = max(Fair Value less costs, Value in Use)'}
                            </span>
                        </div>
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500">
                        {isRu 
                            ? 'Проверка основных средств, нематериальных активов и CGU на обесценение согласно стандарту МСФО (IAS) 36.'
                            : 'Determine whether an asset is impaired and calculate the required write-down under IAS 36.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-3 py-2 text-xs">
                    <div className="grid grid-cols-4 items-center gap-3">
                        <Label htmlFor="carrying_amount" className="text-right text-xs font-medium text-slate-700 dark:text-slate-300">
                            {isRu ? 'Балансовая ст.:' : 'Carrying Amt:'}
                        </Label>
                        <div className="col-span-3 relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                            <Input 
                                id="carrying_amount" 
                                type="number"
                                value={carryingAmount}
                                onChange={(e) => setCarryingAmount(e.target.value)}
                                className="h-8 pl-6 text-xs font-mono font-semibold" 
                                placeholder="100000"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-3">
                        <Label htmlFor="fair_value" className="text-right text-xs font-medium text-slate-700 dark:text-slate-300">
                            {isRu ? 'Справедливая ст.:' : 'Fair Value:'}
                        </Label>
                        <div className="col-span-3 relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                            <Input 
                                id="fair_value" 
                                type="number"
                                value={fairValue}
                                onChange={(e) => setFairValue(e.target.value)}
                                className="h-8 pl-6 text-xs font-mono" 
                                placeholder="80000"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-3">
                        <Label htmlFor="value_in_use" className="text-right text-xs font-medium text-slate-700 dark:text-slate-300">
                            {isRu ? 'Ценность использ.:' : 'Value in Use:'}
                        </Label>
                        <div className="col-span-3 relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                            <Input 
                                id="value_in_use" 
                                type="number"
                                value={valueInUse}
                                onChange={(e) => setValueInUse(e.target.value)}
                                className="h-8 pl-6 text-xs font-mono" 
                                placeholder="85000"
                            />
                        </div>
                    </div>
                </div>
                
                {result && (
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2.5 text-xs animate-in fade-in duration-200">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                {result.isImpaired ? (
                                    <AlertTriangle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                                ) : (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                )}
                                {isRu ? 'Результат теста:' : 'Test Result:'}
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                                result.isImpaired 
                                    ? 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30' 
                                    : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                            }`}>
                                {result.isImpaired 
                                    ? (isRu ? 'Требуется обесценение' : 'Impairment Required') 
                                    : (isRu ? 'Обесценение отсутствует' : 'No Impairment')}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 font-mono">
                            <div className="p-2 rounded-lg bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                                <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-sans">
                                    {isRu ? 'Возмещаемая сумма:' : 'Recoverable Amount:'}
                                </span>
                                <span className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                                    ${result.recoverable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                <span className="block text-[10px] text-slate-500 font-sans mt-0.5 truncate">
                                    {result.basisUsed}
                                </span>
                            </div>
                            <div className={`p-2 rounded-lg border ${
                                result.isImpaired 
                                    ? 'bg-red-500/5 border-red-500/15' 
                                    : 'bg-emerald-500/5 border-emerald-500/15'
                            }`}>
                                <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-sans">
                                    {isRu ? 'Убыток от обесценения:' : 'Impairment Loss:'}
                                </span>
                                <span className={`text-base font-extrabold ${
                                    result.isImpaired ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                                }`}>
                                    ${result.impairment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                <span className="block text-[10px] text-slate-500 font-sans mt-0.5">
                                    {isRu ? `Списание: ${result.impairmentPct}%` : `Write-down: ${result.impairmentPct}%`}
                                </span>
                            </div>
                        </div>

                        {result.isImpaired && (
                            <div className="pt-2 text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                <span>{isRu ? 'Проводка трансформации:' : 'Accounting Entry:'}</span>
                                <span className="font-mono text-slate-900 dark:text-slate-200 font-semibold bg-slate-200/60 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                    Дт 91.02 — Кт 02/05 (${result.impairment.toLocaleString()})
                                </span>
                            </div>
                        )}
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
                        disabled={!result || (!result.isImpaired && result.impairment <= 0)} 
                        className={`font-semibold text-xs shadow-sm ${
                            result?.isImpaired 
                                ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                                : 'bg-slate-600 hover:bg-slate-700 text-white'
                        }`}
                        size="sm"
                    >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                        {result?.isImpaired 
                            ? (isRu ? 'Применить убыток от обесценения' : 'Apply Impairment Loss') 
                            : (isRu ? 'Обесценение не требуется' : 'No Impairment Needed')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
