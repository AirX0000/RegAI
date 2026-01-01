import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowRight, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

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
    items: BalanceSheetItem[];
    adjustments: Adjustment[];
}

export default function TransformationAdjustmentsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [balanceSheet, setBalanceSheet] = useState<BalanceSheet | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<BalanceSheetItem | null>(null);
    const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);

    // New Adjustment State
    const [newAdjustment, setNewAdjustment] = useState<Partial<Adjustment>>({
        adjustment_type: 'debit',
        adjustment_amount: 0,
        description: ''
    });

    useEffect(() => {
        fetchBalanceSheet();
    }, [id]);

    const fetchBalanceSheet = async () => {
        try {
            const res = await api.get(`/balance-sheets/${id}`);
            setBalanceSheet(res.data);
        } catch (error) {
            console.error("Failed to fetch balance sheet", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to load balance sheet data"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenAdjustment = (item: BalanceSheetItem) => {
        setSelectedItem(item);
        setNewAdjustment({
            adjustment_type: 'debit',
            adjustment_amount: 0,
            description: '',
            balance_sheet_item_id: item.id,
            ifrs_category: item.category // Default to same category
        });
        setIsAdjustmentModalOpen(true);
    };

    const handleSaveAdjustment = async () => {
        if (!balanceSheet || !newAdjustment.adjustment_amount || !newAdjustment.description) {
            toast({
                variant: "destructive",
                title: "Validation Error",
                description: "Please fill in all required fields"
            });
            return;
        }

        try {
            await api.post(`/balance-sheets/${balanceSheet.id}/adjustments`, {
                ...newAdjustment,
                balance_sheet_id: balanceSheet.id
            });

            toast({
                title: "Success",
                description: "Adjustment added successfully"
            });
            setIsAdjustmentModalOpen(false);
            fetchBalanceSheet(); // Refresh data
        } catch (error) {
            console.error("Failed to save adjustment", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to save adjustment"
            });
        }
    };

    const handleDeleteAdjustment = async (adjId: string) => {
        try {
            await api.delete(`/balance-sheets/adjustments/${adjId}`);
            toast({
                title: "Deleted",
                description: "Adjustment removed"
            });
            fetchBalanceSheet();
        } catch (error) {
            console.error("Failed to delete adjustment", error);
        }
    };

    const calculateIFRSValue = (item: BalanceSheetItem) => {
        if (!balanceSheet) return item.amount;

        const itemAdjustments = balanceSheet.adjustments.filter(adj => adj.balance_sheet_item_id === item.id);
        let total = Number(item.amount);

        itemAdjustments.forEach(adj => {
            if (item.category === 'assets') {
                // For assets: Debit increases, Credit decreases
                total += adj.adjustment_type === 'debit' ? Number(adj.adjustment_amount) : -Number(adj.adjustment_amount);
            } else {
                // For liabilities/equity: Credit increases, Debit decreases
                total += adj.adjustment_type === 'credit' ? Number(adj.adjustment_amount) : -Number(adj.adjustment_amount);
            }
        });

        return total;
    };

    if (isLoading) return <div className="p-8">Loading...</div>;
    if (!balanceSheet) return <div className="p-8">Balance Sheet not found</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Button variant="ghost" onClick={() => navigate('/transformation')} className="mb-2">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Button>
                    <h1 className="text-3xl font-bold tracking-tight">Transformation Adjustments</h1>
                    <p className="text-gray-500 mt-1">
                        Period: {new Date(balanceSheet.period).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => fetchBalanceSheet()}>
                        Refresh
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => navigate(`/transformation/results/${id}`)}>
                        Finalize Transformation
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>MCFO to IFRS Worksheet</CardTitle>
                    <CardDescription>Click on any row to add reclassification or valuation adjustments.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b font-medium text-sm text-gray-500">
                            <div className="col-span-1">Code</div>
                            <div className="col-span-3">Account (MCFO)</div>
                            <div className="col-span-2 text-right">MCFO Amount</div>
                            <div className="col-span-2 text-center">Adjustments</div>
                            <div className="col-span-2 text-right">IFRS Amount</div>
                            <div className="col-span-2">IFRS Category</div>
                        </div>

                        <div className="divide-y">
                            {balanceSheet.items.map((item) => {
                                const itemAdjustments = balanceSheet.adjustments.filter(adj => adj.balance_sheet_item_id === item.id);
                                const ifrsValue = calculateIFRSValue(item);
                                const hasAdjustments = itemAdjustments.length > 0;

                                return (
                                    <div
                                        key={item.id}
                                        className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-blue-50 cursor-pointer transition-colors text-sm"
                                        onClick={() => handleOpenAdjustment(item)}
                                    >
                                        <div className="col-span-1 font-mono text-gray-500">{item.account_code}</div>
                                        <div className="col-span-3 font-medium">{item.account_name}</div>
                                        <div className="col-span-2 text-right font-mono">
                                            {Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </div>
                                        <div className="col-span-2 text-center">
                                            {hasAdjustments ? (
                                                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
                                                    {itemAdjustments.length} adj
                                                </span>
                                            ) : (
                                                <span className="text-gray-300">-</span>
                                            )}
                                        </div>
                                        <div className={`col-span-2 text-right font-mono font-bold ${ifrsValue < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                            {ifrsValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </div>
                                        <div className="col-span-2 text-gray-600 truncate">
                                            {item.category}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Adjustment Dialog */}
            <Dialog open={isAdjustmentModalOpen} onOpenChange={setIsAdjustmentModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Add Adjustment</DialogTitle>
                        <DialogDescription>
                            Adjusting: <span className="font-medium text-black">{selectedItem?.account_name}</span>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="type" className="text-right">Type</Label>
                            <select
                                id="type"
                                value={newAdjustment.adjustment_type}
                                onChange={(e) => setNewAdjustment({ ...newAdjustment, adjustment_type: e.target.value as 'debit' | 'credit' })}
                                className="col-span-3 flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="debit">Debit (Increase Asset / Decrease Liab)</option>
                                <option value="credit">Credit (Decrease Asset / Increase Liab)</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="amount" className="text-right">Amount</Label>
                            <Input
                                id="amount"
                                type="number"
                                value={newAdjustment.adjustment_amount}
                                onChange={(e) => setNewAdjustment({ ...newAdjustment, adjustment_amount: Number(e.target.value) })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="desc" className="text-right">Description</Label>
                            <Input
                                id="desc"
                                value={newAdjustment.description}
                                onChange={(e) => setNewAdjustment({ ...newAdjustment, description: e.target.value })}
                                placeholder="Reason for adjustment..."
                                className="col-span-3"
                            />
                        </div>
                    </div>

                    {/* Existing Adjustments List */}
                    {selectedItem && balanceSheet.adjustments.filter(a => a.balance_sheet_item_id === selectedItem.id).length > 0 && (
                        <div className="border-t pt-4 mt-2">
                            <h4 className="text-sm font-medium mb-2">Existing Adjustments</h4>
                            <div className="space-y-2">
                                {balanceSheet.adjustments
                                    .filter(a => a.balance_sheet_item_id === selectedItem.id)
                                    .map(adj => (
                                        <div key={adj.id} className="flex justify-between items-center text-xs bg-gray-50 p-2 rounded">
                                            <div>
                                                <span className={`font-bold uppercase mr-2 ${adj.adjustment_type === 'debit' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {adj.adjustment_type}
                                                </span>
                                                {adj.description}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono">{Number(adj.adjustment_amount).toLocaleString()}</span>
                                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500" onClick={() => handleDeleteAdjustment(adj.id!)}>
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAdjustmentModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveAdjustment}>Save Adjustment</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
