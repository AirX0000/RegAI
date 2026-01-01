import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import api from '../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Trash2, ArrowLeft, ArrowRight, CheckCircle2, Calculator } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { cn } from "@/lib/utils";

interface BalanceSheetItem {
    account_code: string;
    account_name: string;
    amount: number;
    category: 'assets' | 'liabilities' | 'equity';
    subcategory: string;
}

interface BalanceSheetFormData {
    period: string;
    notes: string;
    items: BalanceSheetItem[];
}

type Step = 'selection' | 'assets' | 'liabilities' | 'equity' | 'review';

export default function BalanceSheetForm() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentStep, setCurrentStep] = useState<Step>('selection');
    const [completedSteps, setCompletedSteps] = useState<Set<Step>>(new Set());

    const { register, control, handleSubmit, watch } = useForm<BalanceSheetFormData>({
        defaultValues: {
            period: new Date().toISOString().slice(0, 7), // YYYY-MM format
            notes: '',
            items: []
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'items'
    });

    const items = watch('items');

    // Calculate totals
    const calculateTotal = (category: string) => {
        return items
            .filter(item => item.category === category)
            .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    };

    const totalAssets = calculateTotal('assets');
    const totalLiabilities = calculateTotal('liabilities');
    const totalEquity = calculateTotal('equity');
    const isBalanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01;

    const onSubmit = async (data: BalanceSheetFormData) => {
        if (!isBalanced) {
            toast({
                title: 'Balance Sheet Not Balanced',
                description: 'Assets must equal Liabilities + Equity',
                variant: 'destructive'
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                period: new Date(data.period + '-01').toISOString(),
                notes: data.notes,
                items: data.items.map(item => ({
                    ...item,
                    amount: Number(item.amount)
                }))
            };

            const response = await api.post('/balance-sheets/', payload);
            toast({
                title: 'Success',
                description: 'Balance sheet created successfully'
            });
            // Navigate to the new transformation adjustments page
            navigate(`/transformation/adjustments/${response.data.id}`);
        } catch (error: any) {
            console.error('Failed to create balance sheet', error);
            toast({
                title: 'Error',
                description: error.response?.data?.detail || 'Failed to create balance sheet',
                variant: 'destructive'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const addItem = (category: 'assets' | 'liabilities' | 'equity') => {
        const subcategories = {
            assets: 'Current Assets',
            liabilities: 'Current Liabilities',
            equity: 'Share Capital'
        };
        append({
            account_code: '',
            account_name: '',
            amount: 0,
            category,
            subcategory: subcategories[category]
        });
    };

    const handleStepComplete = (step: Step, nextStep: Step) => {
        setCompletedSteps(prev => new Set(prev).add(step));
        setCurrentStep(nextStep);
    };

    const renderStepIndicator = () => {
        const steps: { id: Step; label: string }[] = [
            { id: 'selection', label: 'Start' },
            { id: 'assets', label: 'Assets' },
            { id: 'liabilities', label: 'Liabilities' },
            { id: 'equity', label: 'Equity' },
            { id: 'review', label: 'Review' }
        ];

        return (
            <div className="flex items-center justify-center mb-8">
                {steps.map((step, index) => (
                    <div key={step.id} className="flex items-center">
                        <div className={cn(
                            "flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium transition-colors",
                            currentStep === step.id
                                ? "border-blue-600 bg-blue-600 text-white"
                                : completedSteps.has(step.id)
                                    ? "border-green-500 bg-green-500 text-white"
                                    : "border-gray-200 text-gray-400"
                        )}>
                            {completedSteps.has(step.id) ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
                        </div>
                        <span className={cn(
                            "ml-2 text-sm font-medium",
                            currentStep === step.id ? "text-blue-600" : "text-gray-500"
                        )}>
                            {step.label}
                        </span>
                        {index < steps.length - 1 && (
                            <div className={cn(
                                "w-12 h-0.5 mx-4",
                                completedSteps.has(step.id) ? "bg-green-500" : "bg-gray-200"
                            )} />
                        )}
                    </div>
                ))}
            </div>
        );
    };

    const renderDataEntry = (category: 'assets' | 'liabilities' | 'equity', title: string, colorClass: string, nextStep: Step) => {
        const categoryItems = fields.map((field, index) => ({ ...field, index })).filter(f => items[f.index]?.category === category);
        const total = calculateTotal(category);

        return (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className={colorClass}>{title}</CardTitle>
                        <CardDescription>Enter your {title.toLowerCase()} line items</CardDescription>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm text-gray-500">Total {title}</p>
                            <p className="text-xl font-bold">${total.toLocaleString()}</p>
                        </div>
                        <Button type="button" onClick={() => addItem(category)}>
                            <Plus className="mr-1 h-4 w-4" />
                            Add Item
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {categoryItems.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
                                <p className="text-gray-500">No items added yet.</p>
                                <Button type="button" variant="link" onClick={() => addItem(category)}>
                                    Add your first {category.slice(0, -1)}
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="grid grid-cols-12 gap-2 text-sm font-medium text-gray-500 mb-2 px-2">
                                    <div className="col-span-2">Code</div>
                                    <div className="col-span-4">Account Name</div>
                                    <div className="col-span-2">Amount</div>
                                    <div className="col-span-3">Subcategory</div>
                                    <div className="col-span-1"></div>
                                </div>
                                {categoryItems.map(({ id, index }) => (
                                    <div key={id} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-md border hover:border-blue-300 transition-colors">
                                        <Input
                                            {...register(`items.${index}.account_code` as const)}
                                            placeholder="Code"
                                            className="col-span-2"
                                        />
                                        <Input
                                            {...register(`items.${index}.account_name` as const)}
                                            placeholder="Account Name"
                                            className="col-span-4"
                                        />
                                        <Input
                                            {...register(`items.${index}.amount` as const, { valueAsNumber: true })}
                                            type="number"
                                            step="0.01"
                                            placeholder="Amount"
                                            className="col-span-2 font-mono"
                                        />
                                        <select
                                            {...register(`items.${index}.subcategory` as const)}
                                            className="col-span-3 rounded-md border p-2 bg-transparent"
                                        >
                                            {category === 'assets' && (
                                                <>
                                                    <option>Current Assets</option>
                                                    <option>Non-Current Assets</option>
                                                    <option>Fixed Assets</option>
                                                    <option>Intangible Assets</option>
                                                </>
                                            )}
                                            {category === 'liabilities' && (
                                                <>
                                                    <option>Current Liabilities</option>
                                                    <option>Non-Current Liabilities</option>
                                                    <option>Long-term Debt</option>
                                                </>
                                            )}
                                            {category === 'equity' && (
                                                <>
                                                    <option>Share Capital</option>
                                                    <option>Retained Earnings</option>
                                                    <option>Reserves</option>
                                                </>
                                            )}
                                        </select>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => remove(index)}
                                            className="col-span-1 text-gray-400 hover:text-red-600"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="flex justify-between mt-8 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={() => setCurrentStep('selection')}>
                            Back to Selection
                        </Button>
                        <Button type="button" onClick={() => handleStepComplete(category, nextStep)}>
                            Continue
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Button variant="ghost" onClick={() => navigate('/transformation')} className="mb-2">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Button>
                    <h1 className="text-3xl font-bold tracking-tight">New Transformation Project</h1>
                    <p className="text-gray-500 mt-1">Enter MCFO (NSBU) data to begin transformation</p>
                </div>
            </div>

            {renderStepIndicator()}

            <form onSubmit={handleSubmit(onSubmit, (errors) => console.error('Form Errors:', errors))} className="space-y-6">
                {/* Step 1: Selection & Basic Info */}
                {currentStep === 'selection' && (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Project Details</CardTitle>
                                <CardDescription>Set the reporting period and basic information</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Reporting Period</label>
                                        <Input
                                            type="month"
                                            {...register('period', { required: true })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
                                        <Input
                                            {...register('notes')}
                                            placeholder="e.g., Q3 2024 Financials"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="hover:border-blue-500 cursor-pointer transition-all hover:shadow-md" onClick={() => setCurrentStep('assets')}>
                                <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                        <Plus className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">Enter Assets</h3>
                                        <p className="text-sm text-gray-500">Cash, Inventory, Receivables...</p>
                                    </div>
                                    <Button variant="outline" className="w-full">Start</Button>
                                </CardContent>
                            </Card>

                            <Card className="hover:border-blue-500 cursor-pointer transition-all hover:shadow-md" onClick={() => setCurrentStep('liabilities')}>
                                <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                                        <Plus className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">Enter Liabilities</h3>
                                        <p className="text-sm text-gray-500">Payables, Loans, Provisions...</p>
                                    </div>
                                    <Button variant="outline" className="w-full">Start</Button>
                                </CardContent>
                            </Card>

                            <Card className="hover:border-blue-500 cursor-pointer transition-all hover:shadow-md" onClick={() => setCurrentStep('equity')}>
                                <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                        <Plus className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">Enter Equity</h3>
                                        <p className="text-sm text-gray-500">Capital, Reserves, Earnings...</p>
                                    </div>
                                    <Button variant="outline" className="w-full">Start</Button>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="flex justify-end">
                            <Button type="button" onClick={() => setCurrentStep('review')} disabled={items.length === 0}>
                                Skip to Review
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 2: Data Entry */}
                {currentStep === 'assets' && renderDataEntry('assets', 'Assets', 'text-green-700', 'liabilities')}
                {currentStep === 'liabilities' && renderDataEntry('liabilities', 'Liabilities', 'text-red-700', 'equity')}
                {currentStep === 'equity' && renderDataEntry('equity', 'Equity', 'text-blue-700', 'review')}

                {/* Step 3: Review */}
                {currentStep === 'review' && (
                    <div className="space-y-6">
                        <Card className={isBalanced ? 'border-green-500 bg-green-50/30' : 'border-red-500 bg-red-50/30'}>
                            <CardContent className="pt-6">
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div className="p-4 bg-white rounded-lg shadow-sm">
                                        <div className="text-sm text-gray-500">Total Assets</div>
                                        <div className="text-2xl font-bold text-green-700">${totalAssets.toLocaleString()}</div>
                                    </div>
                                    <div className="p-4 bg-white rounded-lg shadow-sm">
                                        <div className="text-sm text-gray-500">Total Liabilities</div>
                                        <div className="text-2xl font-bold text-red-700">${totalLiabilities.toLocaleString()}</div>
                                    </div>
                                    <div className="p-4 bg-white rounded-lg shadow-sm">
                                        <div className="text-sm text-gray-500">Total Equity</div>
                                        <div className="text-2xl font-bold text-blue-700">${totalEquity.toLocaleString()}</div>
                                    </div>
                                </div>
                                <div className="mt-6 text-center">
                                    {isBalanced ? (
                                        <div className="flex items-center justify-center gap-2 text-green-700 font-medium text-lg">
                                            <CheckCircle2 className="w-6 h-6" />
                                            Balance Sheet is balanced! Ready for transformation.
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-red-700 font-medium">
                                            <div className="flex items-center gap-2 text-lg">
                                                <Trash2 className="w-6 h-6" />
                                                Not Balanced
                                            </div>
                                            <p>Difference: ${Math.abs(totalAssets - (totalLiabilities + totalEquity)).toLocaleString()}</p>
                                            <p className="text-sm text-gray-600">Please adjust your entries before proceeding.</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-2 gap-6">
                            <Card>
                                <CardHeader><CardTitle>Assets</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {items.filter(i => i.category === 'assets').map((item, idx) => (
                                            <div key={idx} className="flex justify-between text-sm border-b pb-1">
                                                <span>{item.account_name}</span>
                                                <span className="font-mono">${Number(item.amount).toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader><CardTitle>Liabilities</CardTitle></CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            {items.filter(i => i.category === 'liabilities').map((item, idx) => (
                                                <div key={idx} className="flex justify-between text-sm border-b pb-1">
                                                    <span>{item.account_name}</span>
                                                    <span className="font-mono">${Number(item.amount).toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader><CardTitle>Equity</CardTitle></CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            {items.filter(i => i.category === 'equity').map((item, idx) => (
                                                <div key={idx} className="flex justify-between text-sm border-b pb-1">
                                                    <span>{item.account_name}</span>
                                                    <span className="font-mono">${Number(item.amount).toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        <div className="flex justify-between pt-4 border-t">
                            <Button type="button" variant="outline" onClick={() => setCurrentStep('selection')}>
                                Back to Edit
                            </Button>
                            <Button type="submit" disabled={isSubmitting || !isBalanced} className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6 h-auto">
                                <Calculator className="mr-2 h-5 w-5" />
                                {isSubmitting ? 'Processing...' : 'Start IFRS Transformation'}
                            </Button>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
}
