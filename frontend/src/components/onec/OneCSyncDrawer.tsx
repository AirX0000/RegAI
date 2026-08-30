import React, { useState } from 'react';
import api from '../../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { 
    Download, 
    ArrowRightLeft, 
    Loader2, 
    CheckCircle2, 
    Calendar, 
    Send,
    Database
} from 'lucide-react';

interface OneCSyncDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSyncCompleted?: (balanceSheetId?: string) => void;
    defaultBalanceSheetId?: string;
}

export const OneCSyncDrawer: React.FC<OneCSyncDrawerProps> = ({
    isOpen,
    onClose,
    onSyncCompleted,
    defaultBalanceSheetId
}) => {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<'ingest' | 'export'>('ingest');
    const [syncing, setSyncing] = useState(false);
    const [progress, setProgress] = useState(0);

    // Ingestion Form State
    const [periodPreset, setPeriodPreset] = useState<'2024_FY' | '2024_Q4' | '2024_M12' | 'custom'>('2024_FY');
    const [startDate, setStartDate] = useState('2024-01-01');
    const [endDate, setEndDate] = useState('2024-12-31');
    const [companyCode, setCompanyCode] = useState('');
    const [autoPopulate, setAutoPopulate] = useState(true);

    // Ingestion Results Preview
    const [ingestResult, setIngestResult] = useState<any>(null);

    // Export Adjustments State
    const [exportBalanceSheetId, setExportBalanceSheetId] = useState(defaultBalanceSheetId || '');
    const [exportComment, setExportComment] = useState('IFRS 16 / IAS Adjustments exported from RegAI');
    const [exportResult, setExportResult] = useState<any>(null);

    const handlePresetChange = (preset: '2024_FY' | '2024_Q4' | '2024_M12' | 'custom') => {
        setPeriodPreset(preset);
        if (preset === '2024_FY') {
            setStartDate('2024-01-01');
            setEndDate('2024-12-31');
        } else if (preset === '2024_Q4') {
            setStartDate('2024-10-01');
            setEndDate('2024-12-31');
        } else if (preset === '2024_M12') {
            setStartDate('2024-12-01');
            setEndDate('2024-12-31');
        }
    };

    const handleRunIngest = async () => {
        setSyncing(true);
        setProgress(15);
        setIngestResult(null);

        const progressTimer = setInterval(() => {
            setProgress((prev) => (prev < 85 ? prev + 15 : prev));
        }, 150);

        try {
            const payload: any = {
                period_start: new Date(startDate).toISOString(),
                period_end: new Date(endDate).toISOString(),
                auto_populate_balance_sheet: autoPopulate,
                notes: `Synchronized from 1C:Enterprise (Period: ${startDate} to ${endDate})`
            };
            if (companyCode) payload.company_code = companyCode;

            const res = await api.post('/integrations/1c/sync-trial-balance', payload);
            
            clearInterval(progressTimer);
            setProgress(100);
            setIngestResult(res.data);

            toast({
                title: "1C Trial Balance Synchronized",
                description: `Successfully extracted ${res.data.total_accounts} accounts from 1C. Balance Sheet ${res.data.balance_sheet_id ? 'created & linked' : 'analyzed'}.`,
            });

            if (onSyncCompleted) {
                onSyncCompleted(res.data.balance_sheet_id);
            }
        } catch (err: any) {
            clearInterval(progressTimer);
            toast({
                title: "1C Synchronization Error",
                description: err.response?.data?.detail || "Failed to extract trial balance from 1C",
                variant: "destructive"
            });
        } finally {
            setSyncing(false);
        }
    };

    const handleRunExport = async () => {
        if (!exportBalanceSheetId) {
            toast({
                title: "Validation Error",
                description: "Please provide a valid Balance Sheet ID for adjustment export",
                variant: "destructive"
            });
            return;
        }

        setSyncing(true);
        setExportResult(null);
        try {
            const res = await api.post('/integrations/1c/export-adjustments', {
                balance_sheet_id: exportBalanceSheetId,
                document_comment: exportComment
            });

            setExportResult(res.data);
            toast({
                title: "Adjustments Exported to 1C",
                description: res.data.message,
            });

            if (onSyncCompleted) {
                onSyncCompleted(exportBalanceSheetId);
            }
        } catch (err: any) {
            toast({
                title: "1C Export Error",
                description: err.response?.data?.detail || "Failed to push adjustments to 1C",
                variant: "destructive"
            });
        } finally {
            setSyncing(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
                        <ArrowRightLeft className="h-6 w-6 text-amber-600" />
                        1C:Enterprise Data Synchronization Hub
                    </DialogTitle>
                    <DialogDescription className="text-gray-600">
                        Two-way data pipeline: Extract Trial Balance & General Ledger from 1C or push approved IFRS Adjustments back into 1C (Document_ОперацияБух).
                    </DialogDescription>
                </DialogHeader>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 mt-2">
                    <button
                        onClick={() => setActiveTab('ingest')}
                        className={`py-2.5 px-4 font-semibold text-sm flex items-center gap-2 border-b-2 transition-colors ${
                            activeTab === 'ingest'
                                ? 'border-amber-600 text-amber-900 bg-amber-50/50'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <Download className="h-4 w-4 text-amber-600" />
                        1C ➔ RegAI: Import Trial Balance
                    </button>
                    <button
                        onClick={() => setActiveTab('export')}
                        className={`py-2.5 px-4 font-semibold text-sm flex items-center gap-2 border-b-2 transition-colors ${
                            activeTab === 'export'
                                ? 'border-amber-600 text-amber-900 bg-amber-50/50'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <Send className="h-4 w-4 text-blue-600" />
                        RegAI ➔ 1C: Export IFRS Adjustments
                    </button>
                </div>

                {/* --- TAB 1: INGESTION --- */}
                {activeTab === 'ingest' && (
                    <div className="space-y-5 pt-3">
                        {/* Period Selection */}
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-700 uppercase flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5 text-gray-500" />
                                Reporting Period
                            </Label>
                            <div className="grid grid-cols-4 gap-2">
                                <button
                                    type="button"
                                    onClick={() => handlePresetChange('2024_FY')}
                                    className={`py-2 px-3 text-xs font-medium rounded border text-center transition-all ${
                                        periodPreset === '2024_FY'
                                            ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    2024 Full Year
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handlePresetChange('2024_Q4')}
                                    className={`py-2 px-3 text-xs font-medium rounded border text-center transition-all ${
                                        periodPreset === '2024_Q4'
                                            ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    Q4 2024 (Oct-Dec)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handlePresetChange('2024_M12')}
                                    className={`py-2 px-3 text-xs font-medium rounded border text-center transition-all ${
                                        periodPreset === '2024_M12'
                                            ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    December 2024
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPeriodPreset('custom')}
                                    className={`py-2 px-3 text-xs font-medium rounded border text-center transition-all ${
                                        periodPreset === 'custom'
                                            ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    Custom Dates
                                </button>
                            </div>

                            {periodPreset === 'custom' && (
                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <div>
                                        <Label htmlFor="start_date" className="text-[11px] text-gray-600">Start Date</Label>
                                        <Input
                                            id="start_date"
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="text-xs"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="end_date" className="text-[11px] text-gray-600">End Date</Label>
                                        <Input
                                            id="end_date"
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="text-xs"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Options */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="comp_code" className="text-xs font-semibold text-gray-700 uppercase">
                                    Organization Code / Filter (Optional)
                                </Label>
                                <Input
                                    id="comp_code"
                                    value={companyCode}
                                    onChange={(e) => setCompanyCode(e.target.value)}
                                    placeholder="Leave empty to use connection default"
                                    className="text-xs"
                                />
                            </div>

                            <div className="flex items-center pt-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={autoPopulate}
                                        onChange={(e) => setAutoPopulate(e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                                    />
                                    <span className="text-xs font-medium text-gray-800">
                                        Auto-create & populate RegAI Balance Sheet
                                    </span>
                                </label>
                            </div>
                        </div>

                        {/* Sync Progress Bar */}
                        {syncing && (
                            <div className="space-y-1.5 p-4 bg-amber-50/70 border border-amber-200 rounded-lg">
                                <div className="flex justify-between text-xs text-amber-900 font-medium">
                                    <span className="flex items-center gap-1.5">
                                        <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                                        Querying 1C AccountingRegister_Хозрасчетный...
                                    </span>
                                    <span>{progress}%</span>
                                </div>
                                <div className="w-full bg-amber-200 rounded-full h-2 overflow-hidden">
                                    <div 
                                        className="bg-amber-600 h-2 transition-all duration-200 rounded-full" 
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Ingestion Results Table Preview */}
                        {ingestResult && (
                            <div className="space-y-3 pt-2">
                                <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                                    <div>
                                        <h4 className="text-sm font-semibold text-emerald-900 flex items-center gap-1.5">
                                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                            {ingestResult.message}
                                        </h4>
                                        <p className="text-xs text-emerald-700 mt-0.5">
                                            Total Accounts: {ingestResult.total_accounts} | Assets: {ingestResult.total_assets.toLocaleString()} RUB | Liabilities: {ingestResult.total_liabilities.toLocaleString()} RUB | Equity: {ingestResult.total_equity.toLocaleString()} RUB
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                                            ingestResult.is_balanced 
                                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                                                : 'bg-rose-100 text-rose-800 border border-rose-300'
                                        }`}>
                                            {ingestResult.is_balanced ? '⚖️ Balanced (A = L + E)' : '⚠️ Balance Discrepancy'}
                                        </span>
                                    </div>
                                </div>

                                <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto shadow-sm">
                                    <table className="min-w-full divide-y divide-gray-200 text-xs">
                                        <thead className="bg-gray-50 sticky top-0 font-medium text-gray-700">
                                            <tr>
                                                <th className="px-3 py-2 text-left">1C Account</th>
                                                <th className="px-3 py-2 text-left">Description</th>
                                                <th className="px-3 py-2 text-left">RegAI Category</th>
                                                <th className="px-3 py-2 text-right">Debit Close</th>
                                                <th className="px-3 py-2 text-right">Credit Close</th>
                                                <th className="px-3 py-2 text-right">Net Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-100 font-mono">
                                            {ingestResult.lines.map((line: any, idx: number) => (
                                                <tr key={idx} className="hover:bg-gray-50/70">
                                                    <td className="px-3 py-1.5 font-bold text-gray-900">{line.account_code}</td>
                                                    <td className="px-3 py-1.5 font-sans text-gray-700">{line.account_name}</td>
                                                    <td className="px-3 py-1.5 font-sans">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                                            line.category === 'assets'
                                                                ? 'bg-blue-100 text-blue-800'
                                                                : line.category === 'liabilities'
                                                                ? 'bg-amber-100 text-amber-800'
                                                                : 'bg-purple-100 text-purple-800'
                                                        }`}>
                                                            {line.category?.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-1.5 text-right">{line.debit_closing ? line.debit_closing.toLocaleString() : '-'}</td>
                                                    <td className="px-3 py-1.5 text-right">{line.credit_closing ? line.credit_closing.toLocaleString() : '-'}</td>
                                                    <td className="px-3 py-1.5 text-right font-bold text-gray-900">{line.net_closing_balance.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Ingestion Footer Button */}
                        <div className="pt-3 border-t flex justify-end gap-2">
                            <Button variant="ghost" onClick={onClose}>
                                Close
                            </Button>
                            <Button
                                onClick={handleRunIngest}
                                disabled={syncing}
                                className="bg-amber-600 hover:bg-amber-700 text-white font-medium"
                            >
                                {syncing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Synchronizing...
                                    </>
                                ) : (
                                    <>
                                        <Download className="mr-2 h-4 w-4" />
                                        Extract & Sync from 1C
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}

                {/* --- TAB 2: EXPORT ADJUSTMENTS --- */}
                {activeTab === 'export' && (
                    <div className="space-y-4 pt-3">
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 space-y-1">
                            <p className="font-semibold flex items-center gap-1.5">
                                <Database className="h-4 w-4 text-blue-700" />
                                Two-Way Accounting Pushback (RegAI ➔ 1C:Enterprise)
                            </p>
                            <p className="text-blue-800">
                                This will push approved IFRS reclassification adjustments directly into 1C as a standard <code>Document_ОперацияБух</code> (Manual Accounting Journal Entry) with Debit/Credit account lines and analytical dimensions.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bs_id" className="text-xs font-semibold text-gray-700 uppercase">
                                Source Balance Sheet ID
                            </Label>
                            <Input
                                id="bs_id"
                                value={exportBalanceSheetId}
                                onChange={(e) => setExportBalanceSheetId(e.target.value)}
                                placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                                className="font-mono text-xs"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="exp_comment" className="text-xs font-semibold text-gray-700 uppercase">
                                Document Comment / Description for 1C
                            </Label>
                            <Input
                                id="exp_comment"
                                value={exportComment}
                                onChange={(e) => setExportComment(e.target.value)}
                                placeholder="Reason for adjustment"
                                className="text-xs"
                            />
                        </div>

                        {exportResult && (
                            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg space-y-2">
                                <h4 className="text-sm font-bold text-emerald-900 flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                    {exportResult.message}
                                </h4>
                                <div className="grid grid-cols-3 gap-2 text-xs text-emerald-800 font-mono pt-1">
                                    <div className="p-2 bg-white/70 rounded border">
                                        <span className="text-[10px] text-gray-500 block">1C Document No</span>
                                        <span className="font-bold">{exportResult.document_number_1c || 'REGAI-0042'}</span>
                                    </div>
                                    <div className="p-2 bg-white/70 rounded border">
                                        <span className="text-[10px] text-gray-500 block">Adjustments Exported</span>
                                        <span className="font-bold">{exportResult.exported_adjustments_count}</span>
                                    </div>
                                    <div className="p-2 bg-white/70 rounded border">
                                        <span className="text-[10px] text-gray-500 block">Total Amount</span>
                                        <span className="font-bold">{exportResult.total_amount?.toLocaleString()} RUB</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="pt-3 border-t flex justify-end gap-2">
                            <Button variant="ghost" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleRunExport}
                                disabled={syncing || !exportBalanceSheetId}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                            >
                                {syncing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Pushing to 1C...
                                    </>
                                ) : (
                                    <>
                                        <Send className="mr-2 h-4 w-4" />
                                        Push Adjustments to 1C
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};
