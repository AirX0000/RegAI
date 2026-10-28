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
import { useTranslation } from 'react-i18next';
import { tr } from '../../lib/i18n';

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
    useTranslation();
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
    const [exportComment, setExportComment] = useState('IFRS 16 / IAS Adjustments exported from Axiaris');
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
                title: tr("Оборотно-сальдовая ведомость 1С синхронизирована", "1C Trial Balance Synchronized", "1C aylanma-qoldiq qaydnomasi sinxronizatsiya qilindi"),
                description: tr(
                    `Успешно извлечено счетов из 1С: ${res.data.total_accounts}. Баланс ${res.data.balance_sheet_id ? 'создан и привязан' : 'проанализирован'}.`,
                    `Successfully extracted ${res.data.total_accounts} accounts from 1C. Balance Sheet ${res.data.balance_sheet_id ? 'created & linked' : 'analyzed'}.`,
                    `1C dan ${res.data.total_accounts} ta hisob muvaffaqiyatli olindi. Balans ${res.data.balance_sheet_id ? 'yaratildi va biriktirildi' : 'tahlil qilindi'}.`
                ),
            });

            if (onSyncCompleted) {
                onSyncCompleted(res.data.balance_sheet_id);
            }
        } catch (err: any) {
            clearInterval(progressTimer);
            toast({
                title: tr("Ошибка синхронизации с 1С", "1C Synchronization Error", "1C sinxronizatsiya xatosi"),
                description: err.response?.data?.detail || tr("Не удалось извлечь ОСВ из 1С", "Failed to extract trial balance from 1C", "1C dan aylanma-qoldiq qaydnomasini olib bo'lmadi"),
                variant: "destructive"
            });
        } finally {
            setSyncing(false);
        }
    };

    const handleRunExport = async () => {
        if (!exportBalanceSheetId) {
            toast({
                title: tr("Ошибка валидации", "Validation Error", "Tekshiruv xatosi"),
                description: tr("Укажите корректный ID баланса для выгрузки корректировок", "Please provide a valid Balance Sheet ID for adjustment export", "Tuzatishlarni eksport qilish uchun to'g'ri Balans ID kiriting"),
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
                title: tr("Корректировки выгружены в 1С", "Adjustments Exported to 1C", "Tuzatishlar 1C ga eksport qilindi"),
                description: res.data.message,
            });

            if (onSyncCompleted) {
                onSyncCompleted(exportBalanceSheetId);
            }
        } catch (err: any) {
            toast({
                title: tr("Ошибка выгрузки в 1С", "1C Export Error", "1C eksport xatosi"),
                description: err.response?.data?.detail || tr("Не удалось отправить корректировки в 1С", "Failed to push adjustments to 1C", "Tuzatishlarni 1C ga yuborib bo'lmadi"),
                variant: "destructive"
            });
        } finally {
            setSyncing(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
                        <ArrowRightLeft className="h-6 w-6 text-amber-600" />
                        {tr('Центр синхронизации данных 1С:Предприятие', '1C:Enterprise Data Synchronization Hub', '1C:Enterprise ma\'lumotlarni sinxronizatsiya qilish markazi')}
                    </DialogTitle>
                    <DialogDescription className="text-slate-500 dark:text-slate-400">
                        {tr(
                            'Двусторонний обмен данными: импорт ОСВ и главной книги из 1С или выгрузка утвержденных корректировок МСФО обратно в 1С (Document_ОперацияБух).',
                            'Two-way data pipeline: Extract Trial Balance & General Ledger from 1C or push approved IFRS Adjustments back into 1C (Document_ОперацияБух).',
                            'Ikki tomonlama ma\'lumotlar almashinuvi: 1C dan aylanma-qoldiq qaydnomasini (OSV) import qilish yoki tasdiqlangan MHXS tuzatishlarini 1C ga qayta yuborish (Document_ОперацияБух).'
                        )}
                    </DialogDescription>
                </DialogHeader>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 dark:border-slate-800 mt-2">
                    <button
                        onClick={() => setActiveTab('ingest')}
                        className={`py-2.5 px-4 font-semibold text-sm flex items-center gap-2 border-b-2 transition-colors ${
                            activeTab === 'ingest'
                                ? 'border-amber-600 text-amber-700 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-950/30'
                                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <Download className="h-4 w-4 text-amber-600" />
                        {tr('1С ➔ Axiaris: Импорт ОСВ / Баланса', '1C ➔ Axiaris: Import Trial Balance', '1C ➔ Axiaris: OSV / Balansni import qilish')}
                    </button>
                    <button
                        onClick={() => setActiveTab('export')}
                        className={`py-2.5 px-4 font-semibold text-sm flex items-center gap-2 border-b-2 transition-colors ${
                            activeTab === 'export'
                                ? 'border-amber-600 text-amber-700 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-950/30'
                                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <Send className="h-4 w-4 text-blue-600" />
                        {tr('Axiaris ➔ 1С: Выгрузка корректировок МСФО', 'Axiaris ➔ 1C: Export IFRS Adjustments', 'Axiaris ➔ 1C: MHXS tuzatishlarini eksport qilish')}
                    </button>
                </div>

                {/* --- TAB 1: INGESTION --- */}
                {activeTab === 'ingest' && (
                    <div className="space-y-5 pt-3">
                        {/* Period Selection */}
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                {tr('Отчетный период', 'Reporting Period', 'Hisobot davri')}
                            </Label>
                            <div className="grid grid-cols-4 gap-2">
                                <button
                                    type="button"
                                    onClick={() => handlePresetChange('2024_FY')}
                                    className={`py-2 px-3 text-xs font-medium rounded border text-center transition-all ${
                                        periodPreset === '2024_FY'
                                            ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                                            : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    {tr('2024 год (Полный)', '2024 Full Year', '2024-yil (To\'liq)')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handlePresetChange('2024_Q4')}
                                    className={`py-2 px-3 text-xs font-medium rounded border text-center transition-all ${
                                        periodPreset === '2024_Q4'
                                            ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                                            : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    {tr('4 кв. 2024 (Окт-Дек)', 'Q4 2024 (Oct-Dec)', '2024 4-chorak (Okt-Dek)')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handlePresetChange('2024_M12')}
                                    className={`py-2 px-3 text-xs font-medium rounded border text-center transition-all ${
                                        periodPreset === '2024_M12'
                                            ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                                            : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    {tr('Декабрь 2024', 'December 2024', 'Dekabr 2024')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPeriodPreset('custom')}
                                    className={`py-2 px-3 text-xs font-medium rounded border text-center transition-all ${
                                        periodPreset === 'custom'
                                            ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                                            : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    {tr('Произвольные даты', 'Custom Dates', 'Maxsus sanalar')}
                                </button>
                            </div>

                            {periodPreset === 'custom' && (
                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <div>
                                        <Label htmlFor="start_date" className="text-[11px] text-slate-600 dark:text-slate-400">{tr('Дата начала', 'Start Date', 'Boshlanish sanasi')}</Label>
                                        <Input
                                            id="start_date"
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="text-xs bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="end_date" className="text-[11px] text-slate-600 dark:text-slate-400">{tr('Дата окончания', 'End Date', 'Tugash sanasi')}</Label>
                                        <Input
                                            id="end_date"
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="text-xs bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Options */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="comp_code" className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">
                                    {tr('Код организации / Фильтр (Необязательно)', 'Organization Code / Filter (Optional)', 'Tashkilot kodi / Filtr (Ixtiyoriy)')}
                                </Label>
                                <Input
                                    id="comp_code"
                                    value={companyCode}
                                    onChange={(e) => setCompanyCode(e.target.value)}
                                    placeholder={tr('Оставьте пустым для значения по умолчанию', 'Leave empty to use connection default', 'Standart qiymat uchun bo\'sh qoldiring')}
                                    className="text-xs bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                                />
                            </div>

                            <div className="flex items-center pt-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={autoPopulate}
                                        onChange={(e) => setAutoPopulate(e.target.checked)}
                                        className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-amber-600 focus:ring-amber-500"
                                    />
                                    <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                                        {tr('Автоматически создать и заполнить баланс в Axiaris', 'Auto-create & populate Axiaris Balance Sheet', 'Axiaris balansini avtomatik yaratish va to\'ldirish')}
                                    </span>
                                </label>
                            </div>
                        </div>

                        {/* Sync Progress Bar */}
                        {syncing && (
                            <div className="space-y-1.5 p-4 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg">
                                <div className="flex justify-between text-xs text-amber-900 dark:text-amber-200 font-medium">
                                    <span className="flex items-center gap-1.5">
                                        <Loader2 className="h-4 w-4 animate-spin text-amber-600 dark:text-amber-400" />
                                        {tr('Запрос к регистру 1С AccountingRegister_Хозрасчетный...', 'Querying 1C AccountingRegister_Хозрасчетный...', '1C AccountingRegister_Хозрасчетный registriga so\'rov yuborilmoqda...')}
                                    </span>
                                    <span>{progress}%</span>
                                </div>
                                <div className="w-full bg-amber-200 dark:bg-amber-900/60 rounded-full h-2 overflow-hidden">
                                    <div 
                                        className="bg-amber-600 dark:bg-amber-500 h-2 transition-all duration-200 rounded-full" 
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Ingestion Results Table Preview */}
                        {ingestResult && (
                            <div className="space-y-3 pt-2">
                                <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                                    <div>
                                        <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                                            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                            {ingestResult.message}
                                        </h4>
                                        <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                                            {tr('Всего счетов', 'Total Accounts', 'Jami hisoblar')}: {ingestResult.total_accounts} | {tr('Активы', 'Assets', 'Aktivlar')}: {ingestResult.total_assets.toLocaleString()} | {tr('Обязательства', 'Liabilities', 'Majburiyatlar')}: {ingestResult.total_liabilities.toLocaleString()} | {tr('Капитал', 'Equity', 'Kapital')}: {ingestResult.total_equity.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                                            ingestResult.is_balanced 
                                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700' 
                                                : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700'
                                        }`}>
                                            {ingestResult.is_balanced
                                                ? tr('⚖️ Баланс сошелся (А = О + К)', '⚖️ Balanced (A = L + E)', '⚖️ Balans teng (A = M + K)')
                                                : tr('⚠️ Расхождение баланса', '⚠️ Balance Discrepancy', '⚠️ Balansda tafovut')}
                                        </span>
                                    </div>
                                </div>

                                <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden max-h-64 overflow-y-auto shadow-sm">
                                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                                        <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 font-medium text-slate-700 dark:text-slate-300">
                                            <tr>
                                                <th className="px-3 py-2 text-left">{tr('Счет 1С', '1C Account', '1C Hisobi')}</th>
                                                <th className="px-3 py-2 text-left">{tr('Наименование', 'Description', 'Tavsif')}</th>
                                                <th className="px-3 py-2 text-left">{tr('Категория Axiaris', 'Axiaris Category', 'Axiaris toifasi')}</th>
                                                <th className="px-3 py-2 text-right">{tr('Сальдо Дт', 'Debit Close', 'Debet qoldiq')}</th>
                                                <th className="px-3 py-2 text-right">{tr('Сальдо Кт', 'Credit Close', 'Kredit qoldiq')}</th>
                                                <th className="px-3 py-2 text-right">{tr('Чистое сальдо', 'Net Amount', 'Sof qoldiq')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                                            {ingestResult.lines.map((line: any, idx: number) => (
                                                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                    <td className="px-3 py-1.5 font-bold text-slate-900 dark:text-white">{line.account_code}</td>
                                                    <td className="px-3 py-1.5 font-sans text-slate-700 dark:text-slate-300">{line.account_name}</td>
                                                    <td className="px-3 py-1.5 font-sans">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                                            line.category === 'assets'
                                                                ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                                                                : line.category === 'liabilities'
                                                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                                                                : 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300'
                                                        }`}>
                                                            {line.category?.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-1.5 text-right text-slate-700 dark:text-slate-300">{line.debit_closing ? line.debit_closing.toLocaleString() : '-'}</td>
                                                    <td className="px-3 py-1.5 text-right text-slate-700 dark:text-slate-300">{line.credit_closing ? line.credit_closing.toLocaleString() : '-'}</td>
                                                    <td className="px-3 py-1.5 text-right font-bold text-slate-900 dark:text-white">{line.net_closing_balance.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Ingestion Footer Button */}
                        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                            <Button 
                                variant="outline" 
                                onClick={onClose}
                                className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                {tr('Закрыть', 'Close', 'Yopish')}
                            </Button>
                            <Button
                                onClick={handleRunIngest}
                                disabled={syncing}
                                className="bg-amber-600 hover:bg-amber-700 text-white font-medium"
                            >
                                {syncing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {tr('Синхронизация...', 'Synchronizing...', 'Sinxronizatsiya...')}
                                    </>
                                ) : (
                                    <>
                                        <Download className="mr-2 h-4 w-4" />
                                        {tr('Извлечь и синхронизировать из 1С', 'Extract & Sync from 1C', '1C dan olish va sinxronizatsiya qilish')}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}

                {/* --- TAB 2: EXPORT ADJUSTMENTS --- */}
                {activeTab === 'export' && (
                    <div className="space-y-4 pt-3">
                        <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg text-xs text-blue-900 dark:text-blue-200 space-y-1">
                            <p className="font-semibold flex items-center gap-1.5">
                                <Database className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                {tr('Двусторонняя выгрузка проводок (Axiaris ➔ 1С:Предприятие)', 'Two-Way Accounting Pushback (Axiaris ➔ 1C:Enterprise)', 'Ikki tomonlama buxgalteriya provodkalarini yuborish (Axiaris ➔ 1C:Enterprise)')}
                            </p>
                            <p className="text-blue-800 dark:text-blue-300">
                                {tr(
                                    'Утвержденные корректировки реклассификации МСФО будут переданы напрямую в 1С как стандартный документ Document_ОперацияБух (Бухгалтерская справка) с проводками Дт/Кт и аналитическими субконто.',
                                    'This will push approved IFRS reclassification adjustments directly into 1C as a standard Document_ОперацияБух (Manual Accounting Journal Entry) with Debit/Credit account lines and analytical dimensions.',
                                    'Tasdiqlangan MHXS qayta tasniflash tuzatishlari to\'g\'ridan-to\'g\'ri 1C tizimiga standart Document_ОперацияБух (Buxgalteriya ma\'lumotnomasi) sifatida Debet/Kredit satrlari bilan yuboriladi.'
                                )}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bs_id" className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">
                                {tr('ID исходного баланса', 'Source Balance Sheet ID', 'Manba balans ID raqami')}
                            </Label>
                            <Input
                                id="bs_id"
                                value={exportBalanceSheetId}
                                onChange={(e) => setExportBalanceSheetId(e.target.value)}
                                placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                                className="font-mono text-xs bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="exp_comment" className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">
                                {tr('Комментарий к документу / Описание для 1С', 'Document Comment / Description for 1C', '1C hujjati uchun izoh / tavsif')}
                            </Label>
                            <Input
                                id="exp_comment"
                                value={exportComment}
                                onChange={(e) => setExportComment(e.target.value)}
                                placeholder={tr('Основание корректировки', 'Reason for adjustment', 'Tuzatish asosi')}
                                className="text-xs bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                            />
                        </div>

                        {exportResult && (
                            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg space-y-2">
                                <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                    {exportResult.message}
                                </h4>
                                <div className="grid grid-cols-3 gap-2 text-xs text-emerald-800 dark:text-emerald-300 font-mono pt-1">
                                    <div className="p-2 bg-white/70 dark:bg-slate-800/80 rounded border border-emerald-200 dark:border-emerald-800">
                                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{tr('№ документа 1С', '1C Document No', '1C Hujjat raqami')}</span>
                                        <span className="font-bold text-slate-900 dark:text-white">{exportResult.document_number_1c || 'REGAI-0042'}</span>
                                    </div>
                                    <div className="p-2 bg-white/70 dark:bg-slate-800/80 rounded border border-emerald-200 dark:border-emerald-800">
                                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{tr('Выгружено проводок', 'Adjustments Exported', 'Eksport qilingan tuzatishlar')}</span>
                                        <span className="font-bold text-slate-900 dark:text-white">{exportResult.exported_adjustments_count}</span>
                                    </div>
                                    <div className="p-2 bg-white/70 dark:bg-slate-800/80 rounded border border-emerald-200 dark:border-emerald-800">
                                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{tr('Общая сумма', 'Total Amount', 'Umumiy summa')}</span>
                                        <span className="font-bold text-slate-900 dark:text-white">{exportResult.total_amount?.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                            <Button 
                                variant="outline" 
                                onClick={onClose}
                                className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                {tr('Отмена', 'Cancel', 'Bekor qilish')}
                            </Button>
                            <Button
                                onClick={handleRunExport}
                                disabled={syncing || !exportBalanceSheetId}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                            >
                                {syncing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {tr('Выгрузка в 1С...', 'Pushing to 1C...', '1C ga yuborilmoqda...')}
                                    </>
                                ) : (
                                    <>
                                        <Send className="mr-2 h-4 w-4" />
                                        {tr('Отправить корректировки в 1С', 'Push Adjustments to 1C', 'Tuzatishlarni 1C ga yuborish')}
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
