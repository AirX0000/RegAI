import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Download, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface TransformedData {
    period: string;
    [key: string]: any;
}

export default function TransformationResults() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [transforming, setTransforming] = useState(false);
    const [balanceSheet, setBalanceSheet] = useState<any>(null);
    const [mcfoData, setMcfoData] = useState<TransformedData | null>(null);
    const [ifrsData, setIfrsData] = useState<TransformedData | null>(null);
    const [activeTab, setActiveTab] = useState<'mcfo' | 'ifrs'>('mcfo');

    useEffect(() => {
        fetchBalanceSheet();
    }, [id]);

    const fetchBalanceSheet = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/balance-sheets/${id}`);
            setBalanceSheet(res.data);

            // Check if already transformed
            if (res.data.status === 'transformed') {
                // Fetch transformed statements
                const transformedRes = await api.get(`/balance-sheets/${id}/transform`);
                if (transformedRes.data.mcfo_statement) {
                    setMcfoData(transformedRes.data.mcfo_statement.transformed_data);
                }
                if (transformedRes.data.ifrs_statement) {
                    setIfrsData(transformedRes.data.ifrs_statement.transformed_data);
                }
            }
        } catch (error) {
            console.error('Failed to fetch balance sheet', error);
            toast({
                title: 'Error',
                description: 'Failed to load balance sheet',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleTransform = async () => {
        setTransforming(true);
        try {
            const res = await api.post(`/balance-sheets/${id}/transform`);
            setMcfoData(res.data.mcfo_statement.transformed_data);
            setIfrsData(res.data.ifrs_statement.transformed_data);
            toast({
                title: 'Success',
                description: 'Balance sheet transformed successfully'
            });
            fetchBalanceSheet(); // Refresh to update status
        } catch (error: any) {
            console.error('Failed to transform', error);
            toast({
                title: 'Error',
                description: error.response?.data?.detail || 'Failed to transform balance sheet',
                variant: 'destructive'
            });
        } finally {
            setTransforming(false);
        }
    };

    const exportToJSON = (data: any, filename: string) => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    const renderMCFO = () => {
        if (!mcfoData) return null;

        return (
            <div className="space-y-6">
                {/* Assets */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-green-700">Assets</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-medium mb-2">Current Assets</h4>
                                <div className="space-y-1">
                                    {mcfoData.assets?.current?.map((item: any, idx: number) => (
                                        <div key={idx} className="flex justify-between text-sm">
                                            <span>{item.name}</span>
                                            <span className="font-mono">${item.amount.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h4 className="font-medium mb-2">Non-Current Assets</h4>
                                <div className="space-y-1">
                                    {mcfoData.assets?.non_current?.map((item: any, idx: number) => (
                                        <div key={idx} className="flex justify-between text-sm">
                                            <span>{item.name}</span>
                                            <span className="font-mono">${item.amount.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="border-t pt-2 flex justify-between font-bold">
                                <span>Total Assets</span>
                                <span className="font-mono">${mcfoData.assets?.total?.toLocaleString()}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Liabilities */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-red-700">Liabilities</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-medium mb-2">Current Liabilities</h4>
                                <div className="space-y-1">
                                    {mcfoData.liabilities?.current?.map((item: any, idx: number) => (
                                        <div key={idx} className="flex justify-between text-sm">
                                            <span>{item.name}</span>
                                            <span className="font-mono">${item.amount.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h4 className="font-medium mb-2">Non-Current Liabilities</h4>
                                <div className="space-y-1">
                                    {mcfoData.liabilities?.non_current?.map((item: any, idx: number) => (
                                        <div key={idx} className="flex justify-between text-sm">
                                            <span>{item.name}</span>
                                            <span className="font-mono">${item.amount.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="border-t pt-2 flex justify-between font-bold">
                                <span>Total Liabilities</span>
                                <span className="font-mono">${mcfoData.liabilities?.total?.toLocaleString()}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Equity */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-blue-700">Equity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-1">
                            {mcfoData.equity?.items?.map((item: any, idx: number) => (
                                <div key={idx} className="flex justify-between text-sm">
                                    <span>{item.name}</span>
                                    <span className="font-mono">${item.amount.toLocaleString()}</span>
                                </div>
                            ))}
                            <div className="border-t pt-2 flex justify-between font-bold">
                                <span>Total Equity</span>
                                <span className="font-mono">${mcfoData.equity?.total?.toLocaleString()}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    };

    const renderIFRS = () => {
        if (!ifrsData) return null;

        const statement = ifrsData.statement_of_financial_position;

        return (
            <div className="space-y-6">
                {/* Assets */}
                <Card>
                    <CardHeader>
                        <CardTitle>Assets</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h4 className="font-medium mb-2">Non-Current Assets</h4>
                            <div className="pl-4 space-y-2">
                                {statement?.assets?.non_current_assets?.property_plant_equipment?.length > 0 && (
                                    <div>
                                        <div className="text-sm font-medium text-gray-600">Property, Plant & Equipment</div>
                                        {statement.assets.non_current_assets.property_plant_equipment.map((item: any, idx: number) => (
                                            <div key={idx} className="flex justify-between text-sm pl-4">
                                                <span>{item.name}</span>
                                                <span className="font-mono">${item.amount.toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="flex justify-between font-medium border-t pt-1">
                                    <span>Total Non-Current Assets</span>
                                    <span className="font-mono">${statement?.assets?.non_current_assets?.total?.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-medium mb-2">Current Assets</h4>
                            <div className="pl-4 space-y-2">
                                {statement?.assets?.current_assets?.cash_and_equivalents?.length > 0 && (
                                    <div>
                                        <div className="text-sm font-medium text-gray-600">Cash and Cash Equivalents</div>
                                        {statement.assets.current_assets.cash_and_equivalents.map((item: any, idx: number) => (
                                            <div key={idx} className="flex justify-between text-sm pl-4">
                                                <span>{item.name}</span>
                                                <span className="font-mono">${item.amount.toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="flex justify-between font-medium border-t pt-1">
                                    <span>Total Current Assets</span>
                                    <span className="font-mono">${statement?.assets?.current_assets?.total?.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                        <div className="border-t-2 pt-2 flex justify-between font-bold text-lg">
                            <span>Total Assets</span>
                            <span className="font-mono">${statement?.assets?.total?.toLocaleString()}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Equity and Liabilities */}
                <Card>
                    <CardHeader>
                        <CardTitle>Equity and Liabilities</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h4 className="font-medium mb-2">Equity</h4>
                            <div className="pl-4 space-y-1">
                                {statement?.equity_and_liabilities?.equity?.share_capital?.map((item: any, idx: number) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                        <span>{item.name}</span>
                                        <span className="font-mono">${item.amount.toLocaleString()}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between font-medium border-t pt-1">
                                    <span>Total Equity</span>
                                    <span className="font-mono">${statement?.equity_and_liabilities?.equity?.total?.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-medium mb-2">Liabilities</h4>
                            <div className="pl-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Non-Current Liabilities</span>
                                    <span className="font-mono">${statement?.equity_and_liabilities?.non_current_liabilities?.total?.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Current Liabilities</span>
                                    <span className="font-mono">${statement?.equity_and_liabilities?.current_liabilities?.total?.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                        <div className="border-t-2 pt-2 flex justify-between font-bold text-lg">
                            <span>Total Equity and Liabilities</span>
                            <span className="font-mono">${statement?.equity_and_liabilities?.total?.toLocaleString()}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    };

    if (loading) {
        return <div className="p-8 flex justify-center">Loading...</div>;
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Button variant="ghost" onClick={() => navigate('/transformation')} className="mb-2">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Button>
                    <h1 className="text-3xl font-bold tracking-tight">Transformation Results</h1>
                    <p className="text-gray-500 mt-1">
                        Period: {balanceSheet?.period && new Date(balanceSheet.period).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </p>
                </div>
                <div className="flex gap-2">
                    {!mcfoData && !ifrsData && (
                        <Button onClick={handleTransform} disabled={transforming}>
                            <RefreshCw className={`mr-2 h-4 w-4 ${transforming ? 'animate-spin' : ''}`} />
                            {transforming ? 'Transforming...' : 'Transform Now'}
                        </Button>
                    )}
                    {mcfoData && (
                        <Button variant="outline" onClick={() => exportToJSON(mcfoData, `mcfo-${id}.json`)}>
                            <Download className="mr-2 h-4 w-4" />
                            Export MCFO
                        </Button>
                    )}
                    {ifrsData && (
                        <Button variant="outline" onClick={() => exportToJSON(ifrsData, `ifrs-${id}.json`)}>
                            <Download className="mr-2 h-4 w-4" />
                            Export IFRS
                        </Button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            {(mcfoData || ifrsData) && (
                <>
                    <div className="border-b">
                        <div className="flex gap-4">
                            <button
                                className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'mcfo'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                                onClick={() => setActiveTab('mcfo')}
                            >
                                MCFO Format
                            </button>
                            <button
                                className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'ifrs'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                                onClick={() => setActiveTab('ifrs')}
                            >
                                IFRS Format
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div>
                        {activeTab === 'mcfo' && renderMCFO()}
                        {activeTab === 'ifrs' && renderIFRS()}
                    </div>
                </>
            )}

            {!mcfoData && !ifrsData && !transforming && (
                <Card>
                    <CardContent className="py-12 text-center">
                        <RefreshCw className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Transform</h3>
                        <p className="text-gray-500 mb-6">
                            Click the "Transform Now" button to convert this balance sheet to MCFO and IFRS formats
                        </p>
                        <Button onClick={handleTransform} disabled={transforming}>
                            <RefreshCw className={`mr-2 h-4 w-4 ${transforming ? 'animate-spin' : ''}`} />
                            {transforming ? 'Transforming...' : 'Transform Now'}
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
