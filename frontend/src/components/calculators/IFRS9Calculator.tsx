import { useState } from 'react';
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
import { Calculator, ShieldAlert } from 'lucide-react';

interface IFRS9CalculatorProps {
    onCalculate: (eclAmount: number, stage: string) => void;
}

export default function IFRS9Calculator({ onCalculate }: IFRS9CalculatorProps) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    
    const [ead, setEad] = useState<string>('500000');
    const [pd, setPd] = useState<string>('3.5');
    const [lgd, setLgd] = useState<string>('45.0');
    const [daysPastDue, setDaysPastDue] = useState<string>('45');
    const [discountRate, setDiscountRate] = useState<string>('6.5');
    
    const [result, setResult] = useState<{
        eclAmount: number;
        stage: string;
        stageDesc: string;
        discountFactor: number;
        netAmount: number;
        lossRate: number;
    } | null>(null);

    const handleCalculate = async () => {
        setLoading(true);
        try {
            const res = await api.post('/calculators/ifrs9', {
                ead: parseFloat(ead) || 0,
                pd_percentage: parseFloat(pd) || 0,
                lgd_percentage: parseFloat(lgd) || 45.0,
                days_past_due: parseInt(daysPastDue, 10) || 0,
                discount_rate_annual: parseFloat(discountRate) || 0.0,
                horizon_years: 1.0
            });
            setResult({
                eclAmount: res.data.ecl_amount,
                stage: res.data.stage,
                stageDesc: res.data.stage_description,
                discountFactor: res.data.discount_factor,
                netAmount: res.data.net_carrying_amount,
                lossRate: res.data.effective_loss_rate_pct
            });
        } catch (error) {
            toast({
                title: "Calculation Error",
                description: "Failed to compute IFRS 9 ECL provision.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleApply = () => {
        if (result && result.eclAmount > 0) {
            onCalculate(result.eclAmount, result.stage);
            setOpen(false);
            setResult(null);
            toast({
                title: "IFRS 9 Provision Applied",
                description: `Created ECL reserve adjustment of $${result.eclAmount.toLocaleString()} (${result.stage})`
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5" />
                    IFRS 9 (ECL) Calculator
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-emerald-600" />
                        IFRS 9 Expected Credit Loss (ECL)
                    </DialogTitle>
                    <DialogDescription>
                        Automated 3-stage impairment model: ECL = EAD × PD × LGD × DF
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-3.5 py-3 text-xs">
                    <div className="grid grid-cols-4 items-center gap-3">
                        <Label htmlFor="ead" className="text-right text-xs">Exposure (EAD)</Label>
                        <Input 
                            id="ead" 
                            type="number"
                            value={ead}
                            onChange={(e) => setEad(e.target.value)}
                            className="col-span-3 h-8 text-xs font-mono" 
                            placeholder="500000"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-3">
                        <Label htmlFor="days_past_due" className="text-right text-xs">Arrears (Days)</Label>
                        <Input 
                            id="days_past_due" 
                            type="number"
                            value={daysPastDue}
                            onChange={(e) => setDaysPastDue(e.target.value)}
                            className="col-span-3 h-8 text-xs font-mono" 
                            placeholder="0-90+ days"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-3">
                        <Label htmlFor="pd" className="text-right text-xs">PD (%)</Label>
                        <Input 
                            id="pd" 
                            type="number"
                            step="0.1"
                            value={pd}
                            onChange={(e) => setPd(e.target.value)}
                            className="col-span-3 h-8 text-xs font-mono" 
                            placeholder="Probability of Default %"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-3">
                        <Label htmlFor="lgd" className="text-right text-xs">LGD (%)</Label>
                        <Input 
                            id="lgd" 
                            type="number"
                            step="0.5"
                            value={lgd}
                            onChange={(e) => setLgd(e.target.value)}
                            className="col-span-3 h-8 text-xs font-mono" 
                            placeholder="Loss Given Default (std 45%)"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-3">
                        <Label htmlFor="discount_rate" className="text-right text-xs">Discount EIR (%)</Label>
                        <Input 
                            id="discount_rate" 
                            type="number"
                            step="0.1"
                            value={discountRate}
                            onChange={(e) => setDiscountRate(e.target.value)}
                            className="col-span-3 h-8 text-xs font-mono" 
                            placeholder="Effective Interest Rate %"
                        />
                    </div>
                </div>

                {result && (
                    <div className="p-3.5 bg-slate-50 border rounded-lg space-y-2 text-xs">
                        <div className="flex justify-between items-center pb-2 border-b">
                            <span className="font-semibold text-slate-700">Classification:</span>
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                result.stage.includes('Stage 1') ? 'bg-emerald-100 text-emerald-800' :
                                result.stage.includes('Stage 2') ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                            }`}>
                                {result.stage}
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug">{result.stageDesc}</p>
                        <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
                            <div>
                                <span className="text-slate-400 block text-[10px]">ECL Provision:</span>
                                <span className="text-sm font-bold text-red-600">${result.eclAmount.toLocaleString()}</span>
                            </div>
                            <div>
                                <span className="text-slate-400 block text-[10px]">Net Carrying:</span>
                                <span className="text-sm font-bold text-slate-800">${result.netAmount.toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="pt-2 text-[10px] text-slate-400 border-t">
                            Accounting Entry: <span className="font-mono text-slate-700 font-semibold">Дт 91.02 — Кт 63 (${result.eclAmount.toLocaleString()})</span>
                        </div>
                    </div>
                )}

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={handleCalculate} disabled={loading} size="sm">
                        {loading ? 'Computing...' : 'Calculate ECL'}
                    </Button>
                    <Button onClick={handleApply} disabled={!result || result.eclAmount <= 0} className="bg-emerald-600 hover:bg-emerald-700 text-white" size="sm">
                        Apply ECL Adjustment
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
