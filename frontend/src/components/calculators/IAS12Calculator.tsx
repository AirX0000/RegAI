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
import { Percent, ArrowRightLeft, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface IAS12CalculatorProps {
    onCalculate: (type: 'DTA' | 'DTL' | 'NONE', amount: number, description: string) => void;
    trigger?: React.ReactNode;
}

export default function IAS12Calculator({ onCalculate, trigger }: IAS12CalculatorProps) {
    const { toast } = useToast();
    const { i18n } = useTranslation();
    const isRu = (i18n.language || 'ru').toLowerCase().startsWith('ru');

    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [category, setCategory] = useState<'asset' | 'liability'>('asset');
    const [carryingAmount, setCarryingAmount] = useState<string>('12500000');
    const [taxBase, setTaxBase] = useState<string>('10000000');
    const [taxRate, setTaxRate] = useState<string>('15');
    const [itemDescription, setItemDescription] = useState<string>(
        isRu ? 'Основные средства (переоценка / капитализация IFRS 16)' : 'Fixed Assets / IFRS 16 lease capitalization'
    );

    // Instant real-time calculation
    const result = useMemo(() => {
        const carrying = parseFloat(carryingAmount) || 0;
        const tb = parseFloat(taxBase) || 0;
        const rate = (parseFloat(taxRate) || 0) / 100.0;

        let diff = 0;
        let diffType: 'taxable' | 'deductible' | 'none' = 'none';
        let dtType: 'DTA' | 'DTL' | 'NONE' = 'NONE';
        let dtAmount = 0;

        if (category === 'asset') {
            const rawDiff = carrying - tb;
            if (rawDiff > 0.001) {
                diff = Math.round(rawDiff * 100) / 100;
                diffType = 'taxable';
                dtType = 'DTL';
                dtAmount = Math.round(diff * rate * 100) / 100;
            } else if (rawDiff < -0.001) {
                diff = Math.round(Math.abs(rawDiff) * 100) / 100;
                diffType = 'deductible';
                dtType = 'DTA';
                dtAmount = Math.round(diff * rate * 100) / 100;
            }
        } else {
            // Liability
            const rawDiff = tb - carrying;
            if (rawDiff > 0.001) {
                diff = Math.round(rawDiff * 100) / 100;
                diffType = 'taxable';
                dtType = 'DTL';
                dtAmount = Math.round(diff * rate * 100) / 100;
            } else if (rawDiff < -0.001) {
                diff = Math.round(Math.abs(rawDiff) * 100) / 100;
                diffType = 'deductible';
                dtType = 'DTA';
                dtAmount = Math.round(diff * rate * 100) / 100;
            }
        }

        const journalDebit = dtType === 'DTL'
            ? (isRu ? 'Дт 99/91 Расход по налогу на прибыль (P&L Income Tax Expense)' : 'Dr Profit & Loss (Income Tax Expense)')
            : dtType === 'DTA'
                ? (isRu ? 'Дт 09 Отложенный налоговый актив (DTA)' : 'Dr Deferred Tax Asset (Account 09)')
                : '—';

        const journalCredit = dtType === 'DTL'
            ? (isRu ? 'Кт 77 Отложенное налоговое обязательство (DTL)' : 'Cr Deferred Tax Liability (Account 77)')
            : dtType === 'DTA'
                ? (isRu ? 'Кт 99/91 Доход по налогу на прибыль (P&L Income Tax Benefit)' : 'Cr Profit & Loss (Income Tax Benefit)')
                : '—';

        return {
            diff,
            diffType,
            dtType,
            dtAmount,
            journalDebit,
            journalCredit
        };
    }, [category, carryingAmount, taxBase, taxRate, isRu]);

    const handleApply = async () => {
        if (!result || result.dtType === 'NONE' || result.dtAmount <= 0) {
            toast({
                title: isRu ? 'Временные разницы отсутствуют' : 'No Temporary Differences',
                description: isRu ? 'Балансовая стоимость равна налоговой базе.' : 'Carrying amount equals tax base.'
            });
            return;
        }

        setLoading(true);
        try {
            await api.post('/calculators/ias12', {
                carrying_amount: parseFloat(carryingAmount) || 0,
                tax_base: parseFloat(taxBase) || 0,
                tax_rate_percentage: parseFloat(taxRate) || 15.0,
                category: category,
                item_description: itemDescription
            });
        } catch (e) {
            // Local fallback already computed accurately
        } finally {
            setLoading(false);
        }

        const desc = result.dtType === 'DTL'
            ? `IAS 12: ОНО (DTL) — ${itemDescription} (ставка ${taxRate}%)`
            : `IAS 12: ОНА (DTA) — ${itemDescription} (ставка ${taxRate}%)`;

        onCalculate(result.dtType, result.dtAmount, desc);
        setOpen(false);

        toast({
            title: isRu ? 'Проводка по МСФО (IAS) 12 создана' : 'IAS 12 Adjustment Created',
            description: isRu
                ? `Признано ${result.dtType === 'DTL' ? 'ОНО' : 'ОНА'}: ${result.dtAmount.toLocaleString()} (разница: ${result.diff.toLocaleString()})`
                : `Recognized ${result.dtType}: ${result.dtAmount.toLocaleString()}`
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" className="text-xs flex items-center gap-1.5 border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300">
                        <Percent className="w-3.5 h-3.5 text-indigo-500" />
                        {isRu ? 'Калькулятор IAS 12' : 'IAS 12 Calculator'}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-2xl">
                <DialogHeader className="border-b border-slate-200 dark:border-slate-800 pb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                            <Percent className="w-5 h-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                {isRu ? 'МСФО (IAS) 12: Отложенные налоги на прибыль' : 'IAS 12: Income Taxes & Deferred Taxes'}
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                                    DTA / DTL
                                </span>
                            </DialogTitle>
                            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {isRu 
                                    ? 'Автоматический расчёт временных разниц между бухгалтерской оценкой МСФО и налоговой базой.' 
                                    : 'Compute taxable and deductible temporary differences and generate balance sheet tax entries.'}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                    {/* Input Controls */}
                    <div className="space-y-3.5">
                        <div>
                            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                                {isRu ? 'Тип балансовой статьи' : 'Balance Sheet Category'}
                            </Label>
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    type="button"
                                    variant={category === 'asset' ? 'default' : 'outline'}
                                    className={`text-xs h-8 ${category === 'asset' ? 'bg-indigo-600 text-white' : ''}`}
                                    onClick={() => setCategory('asset')}
                                >
                                    {isRu ? 'Актив (Asset)' : 'Asset'}
                                </Button>
                                <Button
                                    type="button"
                                    variant={category === 'liability' ? 'default' : 'outline'}
                                    className={`text-xs h-8 ${category === 'liability' ? 'bg-indigo-600 text-white' : ''}`}
                                    onClick={() => setCategory('liability')}
                                >
                                    {isRu ? 'Обязательство (Liability)' : 'Liability'}
                                </Button>
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                                {isRu ? 'Бухгалтерская стоимость по МСФО' : 'IFRS Carrying Amount'}
                            </Label>
                            <Input
                                type="number"
                                value={carryingAmount}
                                onChange={(e) => setCarryingAmount(e.target.value)}
                                className="h-8 text-xs font-mono"
                                placeholder="12500000"
                            />
                        </div>

                        <div>
                            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                                {isRu ? 'Налоговая база по НК' : 'Tax Base'}
                            </Label>
                            <Input
                                type="number"
                                value={taxBase}
                                onChange={(e) => setTaxBase(e.target.value)}
                                className="h-8 text-xs font-mono"
                                placeholder="10000000"
                            />
                        </div>

                        <div>
                            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                                {isRu ? 'Ставка налога на прибыль (%)' : 'Corporate Tax Rate (%)'}
                            </Label>
                            <div className="flex gap-1.5 items-center">
                                <Input
                                    type="number"
                                    value={taxRate}
                                    onChange={(e) => setTaxRate(e.target.value)}
                                    className="h-8 text-xs font-mono w-24"
                                    placeholder="15"
                                />
                                <div className="flex gap-1">
                                    {['12', '15', '20'].map((rate) => (
                                        <button
                                            key={rate}
                                            type="button"
                                            onClick={() => setTaxRate(rate)}
                                            className={`px-2 py-1 text-[11px] rounded border transition-colors ${
                                                taxRate === rate
                                                    ? 'bg-indigo-50 border-indigo-400 text-indigo-700 dark:bg-indigo-950 dark:border-indigo-600 dark:text-indigo-300 font-bold'
                                                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                                            }`}
                                        >
                                            {rate}%
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                                {isRu ? 'Описание статьи' : 'Description'}
                            </Label>
                            <Input
                                type="text"
                                value={itemDescription}
                                onChange={(e) => setItemDescription(e.target.value)}
                                className="h-8 text-xs"
                                placeholder="e.g. Реклассификация аренды IFRS 16"
                            />
                        </div>
                    </div>

                    {/* Live Calculation Results */}
                    <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                                    {isRu ? 'Результат расчёта' : 'Calculation Result'}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                                    result.dtType === 'DTL'
                                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                                        : result.dtType === 'DTA'
                                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                            : 'bg-slate-200 text-slate-600'
                                }`}>
                                    {result.dtType === 'DTL' ? (isRu ? 'ОНО (Пассив)' : 'DTL (Liability)') : result.dtType === 'DTA' ? (isRu ? 'ОНА (Актив)' : 'DTA (Asset)') : '0.00'}
                                </span>
                            </div>

                            <div className="space-y-2.5">
                                <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                        {isRu ? 'Временная разница:' : 'Temporary Difference:'}
                                    </div>
                                    <div className="text-base font-bold font-mono text-slate-900 dark:text-white">
                                        {result.diff.toLocaleString()} {isRu ? 'сум / $' : 'USD'}
                                        <span className="text-[11px] font-normal text-slate-500 ml-1.5">
                                            ({result.diffType === 'taxable' ? (isRu ? 'налогооблагаемая' : 'taxable') : (isRu ? 'вычитаемая' : 'deductible')})
                                        </span>
                                    </div>
                                </div>

                                <div className={`p-3 rounded-lg border ${
                                    result.dtType === 'DTL'
                                        ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-500/30 text-amber-900 dark:text-amber-200'
                                        : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
                                }`}>
                                    <div className="text-[11px] font-semibold opacity-80">
                                        {result.dtType === 'DTL' 
                                            ? (isRu ? 'Отложенное налоговое обязательство (ОНО):' : 'Deferred Tax Liability (DTL):')
                                            : (isRu ? 'Отложенный налоговый актив (ОНА):' : 'Deferred Tax Asset (DTA):')}
                                    </div>
                                    <div className="text-xl font-black font-mono mt-0.5">
                                        {result.dtAmount.toLocaleString()} {isRu ? 'сум / $' : 'USD'}
                                    </div>
                                </div>

                                {/* Double Entry Recommendation */}
                                <div className="p-2.5 rounded-lg bg-indigo-50/40 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50">
                                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 mb-1">
                                        <ArrowRightLeft className="w-3.5 h-3.5" />
                                        {isRu ? 'Бухгалтерская проводка МСФО:' : 'Journal Entry:'}
                                    </div>
                                    <div className="text-[10px] font-mono space-y-0.5 text-slate-700 dark:text-slate-300">
                                        <div><span className="font-bold text-indigo-600">Дт:</span> {result.journalDebit}</div>
                                        <div><span className="font-bold text-indigo-600">Кт:</span> {result.journalCredit}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-3 text-[11px] text-slate-500 dark:text-slate-400 italic">
                            💡 {isRu 
                                ? 'Временные разницы от IFRS 16 и IAS 36 автоматически устраняются по мере начисления амортизации.' 
                                : 'Temporary differences from IFRS 16 / IAS 36 reverse through ongoing amortization.'}
                        </div>
                    </div>
                </div>

                <DialogFooter className="border-t border-slate-200 dark:border-slate-800 pt-3 flex items-center justify-between sm:justify-between">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setOpen(false)}
                        className="text-xs"
                    >
                        {isRu ? 'Отмена' : 'Cancel'}
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        disabled={loading || result.dtAmount <= 0}
                        onClick={handleApply}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4"
                    >
                        <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                        {isRu ? 'Применить проводку в баланс' : 'Apply Tax Adjustment'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
