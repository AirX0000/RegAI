import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { read, utils } from 'xlsx';
import { Matrix, CellBase } from 'react-spreadsheet';
import { FileUpload } from '@/components/FileUpload';
import { SpreadsheetViewer } from '@/components/SpreadsheetViewer';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowLeft, Save, Upload as UploadIcon } from 'lucide-react';
import { Topbar } from '@/components/Topbar';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

export default function UploadResults() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [data, setData] = useState<Matrix<CellBase>>([]);
    const [columns, setColumns] = useState<string[]>([]);
    const [fileName, setFileName] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFileSelect = useCallback(async (file: File) => {
        setFileName(file.name);
        setIsProcessing(true);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const bstr = e.target?.result;
                const wb = read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const jsonData = utils.sheet_to_json(ws, { header: 1 }) as any[][];

                if (jsonData.length > 0) {
                    // Extract headers if present (assuming first row is header)
                    // For now, let's treat first row as data or maybe extract it?
                    // Let's assume first row is header for column labels
                    const headerRow = jsonData[0];
                    const bodyRows = jsonData.slice(1);

                    const cols = headerRow.map((h: any) => String(h || ''));
                    setColumns(cols);

                    const matrix: Matrix<CellBase> = bodyRows.map((row) => {
                        // Ensure row has same length as header
                        const paddedRow = new Array(cols.length).fill(null).map((_, i) => {
                            return { value: row[i] !== undefined ? String(row[i]) : '' };
                        });
                        return paddedRow;
                    });

                    setData(matrix);
                }
            } catch (error) {
                console.error('Error parsing file:', error);
                // Handle error (show toast)
            } finally {
                setIsProcessing(false);
            }
        };
        reader.readAsBinaryString(file);
    }, []);

    const handleSave = async () => {
        if (data.length === 0) return;

        setIsProcessing(true);
        try {
            // Smart column mapping
            const lowerCols = columns.map(c => c.toLowerCase());

            const getColIndex = (keywords: string[]) => {
                return lowerCols.findIndex(c => keywords.some(k => c.includes(k)));
            };

            const codeIdx = getColIndex(['code', 'id', 'account number']);
            const nameIdx = getColIndex(['name', 'description', 'account']);
            const amountIdx = getColIndex(['amount', 'value', 'balance', 'total']);
            const catIdx = getColIndex(['category', 'type', 'class']);

            // Fallback to default indices if not found
            const finalCodeIdx = codeIdx !== -1 ? codeIdx : 0;
            const finalNameIdx = nameIdx !== -1 ? nameIdx : 1;
            const finalAmountIdx = amountIdx !== -1 ? amountIdx : 2;
            // Category is optional in mapping, but required in backend. We'll default to 'assets' if not found.
            const finalCatIdx = catIdx;

            const items = data.map(row => {
                const amountStr = row[finalAmountIdx]?.value || '0';
                // Remove currency symbols and commas
                const amount = parseFloat(amountStr.replace(/[^0-9.-]+/g, '')) || 0;

                let category = 'assets'; // Default
                if (finalCatIdx !== -1) {
                    const catVal = (row[finalCatIdx]?.value || '').toLowerCase();
                    if (catVal.includes('liab')) category = 'liabilities';
                    else if (catVal.includes('equit')) category = 'equity';
                }

                return {
                    account_code: row[finalCodeIdx]?.value || 'UNKNOWN',
                    account_name: row[finalNameIdx]?.value || 'Unknown Account',
                    amount: amount,
                    category: category
                };
            }).filter(item => item.account_code && item.account_name); // Basic validation

            const payload = {
                period: new Date().toISOString(), // Default to now, maybe add a date picker later
                items: items,
                notes: `Uploaded from ${fileName}`
            };

            await api.post('/balance-sheets/', payload);

            toast({
                title: t('success'),
                description: t('balance_sheet_saved'),
            });

            navigate('/transformation');
        } catch (error) {
            console.error('Failed to save balance sheet', error);
            toast({
                variant: "destructive",
                title: t('error'),
                description: t('error_saving_sheet'),
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReset = () => {
        setData([]);
        setFileName('');
        setColumns([]);
    };

    return (
        <div className="min-h-screen bg-background">
            <Topbar />
            <main className="container mx-auto py-8 px-4">
                <div className="mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">{t('upload_balance_sheet')}</h1>
                            <p className="text-muted-foreground">
                                {t('upload_balance_sheet')}
                            </p>
                        </div>
                    </div>
                    {data.length > 0 && (
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={handleReset}>
                                <UploadIcon className="w-4 h-4 mr-2" />
                                {t('upload_new')}
                            </Button>
                            <Button onClick={handleSave}>
                                <Save className="w-4 h-4 mr-2" />
                                {t('process_data')}
                            </Button>
                        </div>
                    )}
                </div>

                {data.length === 0 ? (
                    <div className="mt-12">
                        {isProcessing ? (
                            <div className="text-center py-12">
                                <p className="text-lg text-muted-foreground animate-pulse">Processing file...</p>
                            </div>
                        ) : (
                            <FileUpload onFileSelect={handleFileSelect} />
                        )}
                    </div>
                ) : (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg font-medium flex items-center justify-between">
                                    <span>Preview: {fileName}</span>
                                    <span className="text-sm font-normal text-muted-foreground">
                                        {data.length} rows
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <SpreadsheetViewer
                                    data={data}
                                    onChange={setData}
                                    columns={columns}
                                />
                            </CardContent>
                        </Card>
                    </div>
                )}
            </main>
        </div>
    );
}
