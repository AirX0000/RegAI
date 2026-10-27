import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { read, utils } from 'xlsx';
import { FileUpload } from '@/components/FileUpload';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Upload as UploadIcon, FileSpreadsheet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import InteractiveColumnMapper, { BalanceSheetImportItem } from '@/components/upload/InteractiveColumnMapper';

export default function UploadResults() {
    const { i18n } = useTranslation();
    const isRu = (i18n.language || 'ru').toLowerCase().startsWith('ru');
    const navigate = useNavigate();
    const { toast } = useToast();

    const [rawRows, setRawRows] = useState<any[][]>([]);
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

                if (jsonData && jsonData.length > 0) {
                    setRawRows(jsonData);
                } else {
                    toast({
                        variant: "destructive",
                        title: isRu ? "Файл пуст" : "Empty file",
                        description: isRu ? "Не удалось обнаружить строки в документе" : "No rows found in sheet",
                    });
                }
            } catch (error) {
                console.error('Error parsing file:', error);
                toast({
                    variant: "destructive",
                    title: isRu ? "Ошибка чтения файла" : "File read error",
                    description: isRu ? "Не удалось распарсить Excel документ" : "Failed to parse Excel document",
                });
            } finally {
                setIsProcessing(false);
            }
        };
        reader.readAsBinaryString(file);
    }, [isRu, toast]);

    const handleConfirmImport = async (items: BalanceSheetImportItem[], period: string, notes: string) => {
        try {
            const payload = {
                period: period || new Date().toISOString(),
                items: items,
                notes: notes || `Uploaded from ${fileName}`
            };

            const res = await api.post('/balance-sheets/', payload);
            const newId = res.data?.id;

            toast({
                title: isRu ? "Баланс успешно импортирован" : "Balance Sheet Imported",
                description: isRu 
                    ? `Загружено ${items.length} статей баланса. Переход к трансформации...`
                    : `Loaded ${items.length} line items. Proceeding to transformation...`,
            });

            if (newId) {
                navigate(`/transformation/adjustments/${newId}`);
            } else {
                navigate('/transformation');
            }
        } catch (error) {
            console.error('Failed to save balance sheet', error);
            toast({
                variant: "destructive",
                title: isRu ? "Ошибка сохранения" : "Save Error",
                description: isRu ? "Не удалось сохранить загруженный баланс" : "Failed to save imported balance sheet",
            });
            throw error;
        }
    };

    const handleReset = () => {
        setRawRows([]);
        setFileName('');
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
            {/* Top Navigation & Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
                <div className="flex items-center gap-3">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => navigate('/transformation')}
                        className="rounded-xl border border-border/60 hover:bg-muted"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                                {isRu ? 'Умный импорт оборотно-сальдовой ведомости' : 'Smart Trial Balance (OSV) Ingestion'}
                            </h1>
                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                1C ➔ МСФО
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {isRu 
                                ? 'Загрузка файлов Excel/CSV из 1С:Бухгалтерии с автоопределением субсчетов и интерактивным сопоставлением колонок.'
                                : 'Upload 1C or Excel balance sheets with automated plan of accounts recognition and visual column mapping.'}
                        </p>
                    </div>
                </div>

                {rawRows.length > 0 && (
                    <Button variant="outline" size="sm" onClick={handleReset} className="text-xs self-start sm:self-auto">
                        <UploadIcon className="w-3.5 h-3.5 mr-1.5" />
                        {isRu ? 'Загрузить другой файл' : 'Upload Another File'}
                    </Button>
                )}
            </div>

            {/* Content State: Dropzone or Interactive Column Mapper */}
            {rawRows.length === 0 ? (
                <div className="space-y-6">
                    {isProcessing ? (
                        <div className="text-center py-20 bg-card rounded-2xl border border-border/80 shadow-xs space-y-3">
                            <FileSpreadsheet className="w-10 h-10 text-blue-600 animate-bounce mx-auto" />
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                {isRu ? 'Анализ структуры документа 1С...' : 'Parsing 1C document structure...'}
                            </p>
                        </div>
                    ) : (
                        <div className="bg-card rounded-2xl border border-border/80 shadow-xs p-6 md:p-8">
                            <FileUpload onFileSelect={handleFileSelect} />
                        </div>
                    )}
                </div>
            ) : (
                <InteractiveColumnMapper
                    rawData={rawRows}
                    fileName={fileName}
                    onConfirm={handleConfirmImport}
                    onCancel={handleReset}
                />
            )}
        </div>
    );
}
