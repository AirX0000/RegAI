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

interface IFRS16CalculatorProps {
    onCalculate: (rouAsset: number, leaseLiability: number) => void;
}

export default function IFRS16Calculator({ onCalculate }: IFRS16CalculatorProps) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    
    const [leaseTerm, setLeaseTerm] = useState<string>('60');
    const [discountRate, setDiscountRate] = useState<string>('5.0');
    const [monthlyPayment, setMonthlyPayment] = useState<string>('5000');
    const [initialCosts, setInitialCosts] = useState<string>('0');
    const [result, setResult] = useState<{ rou: number, liability: number } | null>(null);

    const handleCalculate = async () => {
        setLoading(true);
        try {
            const res = await api.post('/calculators/ifrs16', {
                lease_term_months: parseInt(leaseTerm),
                discount_rate_annual: parseFloat(discountRate),
                monthly_payment: parseFloat(monthlyPayment),
                initial_direct_costs: parseFloat(initialCosts)
            });
            setResult({
                rou: res.data.right_of_use_asset,
                liability: res.data.lease_liability
            });
        } catch (error) {
            toast({
                title: "Calculation Error",
                description: "Failed to calculate IFRS 16 values.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleApply = () => {
        if (result) {
            onCalculate(result.rou, result.liability);
            setOpen(false);
            setResult(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100">
                    IFRS 16 (Leases) Calculator
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>IFRS 16 Lease Calculator</DialogTitle>
                    <DialogDescription>
                        Calculate the Present Value (NPV) of lease payments for capitalization.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="lease_term" className="text-right">Term (Months)</Label>
                        <Input 
                            id="lease_term" 
                            type="number"
                            value={leaseTerm}
                            onChange={(e) => setLeaseTerm(e.target.value)}
                            className="col-span-3" 
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="discount_rate" className="text-right">Rate (%)</Label>
                        <Input 
                            id="discount_rate" 
                            type="number"
                            step="0.1"
                            value={discountRate}
                            onChange={(e) => setDiscountRate(e.target.value)}
                            className="col-span-3" 
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="monthly_payment" className="text-right">Monthly Pmt</Label>
                        <Input 
                            id="monthly_payment" 
                            type="number"
                            value={monthlyPayment}
                            onChange={(e) => setMonthlyPayment(e.target.value)}
                            className="col-span-3" 
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="initial_costs" className="text-right">Initial Costs</Label>
                        <Input 
                            id="initial_costs" 
                            type="number"
                            value={initialCosts}
                            onChange={(e) => setInitialCosts(e.target.value)}
                            className="col-span-3" 
                        />
                    </div>
                </div>
                
                {result && (
                    <div className="bg-muted p-4 rounded-md space-y-2 mb-4">
                        <div className="flex justify-between font-semibold">
                            <span>ROU Asset (Debit):</span>
                            <span>{result.rou.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-semibold">
                            <span>Lease Liability (Credit):</span>
                            <span>{result.liability.toLocaleString()}</span>
                        </div>
                    </div>
                )}
                
                <DialogFooter>
                    {!result ? (
                        <Button onClick={handleCalculate} disabled={loading}>
                            {loading ? "Calculating..." : "Calculate"}
                        </Button>
                    ) : (
                        <Button onClick={handleApply}>
                            Apply Adjustment
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
