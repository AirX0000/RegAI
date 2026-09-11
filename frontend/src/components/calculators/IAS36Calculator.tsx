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

interface IAS36CalculatorProps {
    onCalculate: (impairmentLoss: number) => void;
}

export default function IAS36Calculator({ onCalculate }: IAS36CalculatorProps) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    
    const [carryingAmount, setCarryingAmount] = useState<string>('100000');
    const [fairValue, setFairValue] = useState<string>('80000');
    const [valueInUse, setValueInUse] = useState<string>('85000');
    
    const [result, setResult] = useState<{ impairment: number, recoverable: number, isImpaired: boolean } | null>(null);

    const handleCalculate = async () => {
        setLoading(true);
        try {
            const res = await api.post('/calculators/ias36', {
                carrying_amount: parseFloat(carryingAmount),
                fair_value_less_costs: parseFloat(fairValue),
                value_in_use: parseFloat(valueInUse)
            });
            setResult({
                impairment: res.data.impairment_loss,
                recoverable: res.data.recoverable_amount,
                isImpaired: res.data.is_impaired
            });
        } catch (error) {
            toast({
                title: "Calculation Error",
                description: "Failed to calculate IAS 36 values.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleApply = () => {
        if (result && result.isImpaired) {
            onCalculate(result.impairment);
            setOpen(false);
            setResult(null);
        } else if (result && !result.isImpaired) {
            toast({
                title: "No Impairment",
                description: "Recoverable amount exceeds carrying amount. No adjustment needed."
            });
            setOpen(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="border-orange-200 text-orange-700 bg-orange-50 hover:bg-orange-100">
                    IAS 36 (Impairment) Calculator
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>IAS 36 Impairment Calculator</DialogTitle>
                    <DialogDescription>
                        Determine if an asset is impaired and calculate the loss.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="carrying_amount" className="text-right text-xs">Carrying Amt</Label>
                        <Input 
                            id="carrying_amount" 
                            type="number"
                            value={carryingAmount}
                            onChange={(e) => setCarryingAmount(e.target.value)}
                            className="col-span-3" 
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="fair_value" className="text-right text-xs">Fair Value Less Costs</Label>
                        <Input 
                            id="fair_value" 
                            type="number"
                            value={fairValue}
                            onChange={(e) => setFairValue(e.target.value)}
                            className="col-span-3" 
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="value_in_use" className="text-right text-xs">Value in Use</Label>
                        <Input 
                            id="value_in_use" 
                            type="number"
                            value={valueInUse}
                            onChange={(e) => setValueInUse(e.target.value)}
                            className="col-span-3" 
                        />
                    </div>
                </div>
                
                {result && (
                    <div className={`p-4 rounded-md space-y-2 mb-4 ${result.isImpaired ? 'bg-red-50 text-red-900' : 'bg-green-50 text-green-900'}`}>
                        <div className="flex justify-between text-sm">
                            <span>Recoverable Amount:</span>
                            <span>{result.recoverable.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-semibold">
                            <span>Impairment Loss:</span>
                            <span>{result.impairment.toLocaleString()}</span>
                        </div>
                        <div className="text-xs pt-2">
                            {result.isImpaired 
                                ? "Asset is impaired. Adjustment recommended." 
                                : "Asset is not impaired. No adjustment needed."}
                        </div>
                    </div>
                )}
                
                <DialogFooter>
                    {!result ? (
                        <Button onClick={handleCalculate} disabled={loading}>
                            {loading ? "Calculating..." : "Calculate"}
                        </Button>
                    ) : (
                        <Button onClick={handleApply} disabled={!result.isImpaired}>
                            {result.isImpaired ? "Apply Adjustment" : "Close"}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
