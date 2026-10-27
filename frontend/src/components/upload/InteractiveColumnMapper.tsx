import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
    TableProperties, 
    CheckCircle2, 
    AlertCircle, 
    ArrowRight, 
    Sparkles, 
    RefreshCw,
    X,
    Calendar,
    FileSpreadsheet
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface BalanceSheetImportItem {
    account_code: string;
    account_name: string;
    amount: number;
    category: 'assets' | 'liabilities' | 'equity';
    raw_debit?: number;
    raw_credit?: number;
}

interface InteractiveColumnMapperProps {
    rawData: any[][];
    fileName: string;
    onConfirm: (items: BalanceSheetImportItem[], period: string, notes: string) => Promise<void>;
    onCancel: () => void;
}

export default function InteractiveColumnMapper({
    rawData,
    fileName,
    onConfirm,
    onCancel
}: InteractiveColumnMapperProps) {
    const { i18n } = useTranslation();
    const isRu = (i18n.language || 'ru').toLowerCase().startsWith('ru');

    // Auto-detect header row index
    const detectedHeaderRowIdx = useMemo(() => {
        if (!rawData || rawData.length === 0) return 0;
        const keywords = ['счет', 'код', 'code', 'наименование', 'name', 'дебет', 'debit', 'сальдо', 'amount'];
        for (let i = 0; i < Math.min(5, rawData.length); i++) {
            const rowStr = (rawData[i] || []).map(c => String(c || '').toLowerCase()).join(' ');
            const matchCount = keywords.filter(k => rowStr.includes(k)).length;
            if (matchCount >= 2) return i;
        }
        return 0;
    }, [rawData]);

    const [headerRowIndex, setHeaderRowIndex] = useState<number>(detectedHeaderRowIdx);
    const [usePlanSchetov, setUsePlanSchetov] = useState(true);
    const [skipZeroBalances, setSkipZeroBalances] = useState(false);
    const [period, setPeriod] = useState(new Date().toISOString().split('T')[0]);
    const [submitting, setSubmitting] = useState(false);

    // Columns extracted from the selected header row
    const columns = useMemo(() => {
        if (!rawData || rawData.length <= headerRowIndex) return [];
        const headerRow = rawData[headerRowIndex] || [];
        return headerRow.map((colVal, idx) => ({
            index: idx,
            name: String(colVal || '').trim() || (isRu ? `Колонка ${idx + 1}` : `Col ${idx + 1}`)
        }));
    }, [rawData, headerRowIndex, isRu]);

    // Initial smart auto-mapping suggestions
    const initialMapping = useMemo(() => {
        let codeIdx = -1;
        let nameIdx = -1;
        let debitIdx = -1;
        let creditIdx = -1;
        let amountIdx = -1;
        let categoryIdx = -1;

        columns.forEach(col => {
            const lower = col.name.toLowerCase();
            if (codeIdx === -1 && (lower.includes('счет') || lower.includes('код') || lower.includes('code') || lower === 'номер' || lower === 'id')) {
                codeIdx = col.index;
            } else if (nameIdx === -1 && (lower.includes('наименование') || lower.includes('название') || lower.includes('статья') || lower.includes('name') || lower.includes('описание') || lower.includes('desc'))) {
                nameIdx = col.index;
            } else if (debitIdx === -1 && (lower.includes('дебет') || lower.includes('дт') || lower === 'debit' || lower === 'dr')) {
                debitIdx = col.index;
            } else if (creditIdx === -1 && (lower.includes('кредит') || lower.includes('кт') || lower === 'credit' || lower === 'cr')) {
                creditIdx = col.index;
            } else if (amountIdx === -1 && (lower.includes('сальдо') || lower.includes('сумма') || lower.includes('остаток') || lower.includes('amount') || lower.includes('balance') || lower.includes('total'))) {
                amountIdx = col.index;
            } else if (categoryIdx === -1 && (lower.includes('категор') || lower.includes('раздел') || lower.includes('класс') || lower.includes('category') || lower.includes('type'))) {
                categoryIdx = col.index;
            }
        });

        // Sensible fallbacks if not explicitly found by name
        if (codeIdx === -1 && columns.length > 0) codeIdx = 0;
        if (nameIdx === -1 && columns.length > 1) nameIdx = 1;
        if (amountIdx === -1 && debitIdx === -1 && columns.length > 2) amountIdx = 2;

        return { codeIdx, nameIdx, debitIdx, creditIdx, amountIdx, categoryIdx };
    }, [columns]);

    const [mappedCode, setMappedCode] = useState<number>(initialMapping.codeIdx);
    const [mappedName, setMappedName] = useState<number>(initialMapping.nameIdx);
    const [mappedDebit, setMappedDebit] = useState<number>(initialMapping.debitIdx);
    const [mappedCredit, setMappedCredit] = useState<number>(initialMapping.creditIdx);
    const [mappedAmount, setMappedAmount] = useState<number>(initialMapping.amountIdx);
    const [mappedCategory, setMappedCategory] = useState<number>(initialMapping.categoryIdx);

    // Parse and classify rows based on current active mapping
    const parsedData = useMemo(() => {
        if (!rawData || rawData.length <= headerRowIndex + 1) return { items: [], totalAssets: 0, totalLiab: 0, totalEquity: 0 };

        const bodyRows = rawData.slice(headerRowIndex + 1);
        const items: BalanceSheetImportItem[] = [];

        let totalAssets = 0;
        let totalLiab = 0;
        let totalEquity = 0;

        for (const row of bodyRows) {
            const rawCode = mappedCode !== -1 ? String(row[mappedCode] || '').trim() : '';
            if (!rawCode) continue;

            const lowerCode = rawCode.toLowerCase();
            // Skip 1C metadata or summary rows
            if (lowerCode.includes('итого') || lowerCode.includes('всего') || lowerCode.includes('баланс') || lowerCode.includes('сальдо')) {
                continue;
            }

            let code = rawCode;
            let name = mappedName !== -1 ? String(row[mappedName] || '').trim() : `Счет ${code}`;

            // Handle combined cell where code and name are in one column (e.g. "01.01 Основные средства")
            if (code && !name && /^\d+(\.\d+)?\s+[A-Za-zА-Яа-я]/.test(code)) {
                const parts = code.split(/\s+/);
                code = parts[0];
                name = parts.slice(1).join(' ');
            }

            // Extract numeric values
            const deb = mappedDebit !== -1 ? parseFloat(String(row[mappedDebit] || '0').replace(/\s/g, '').replace(',', '.')) || 0 : 0;
            const cred = mappedCredit !== -1 ? parseFloat(String(row[mappedCredit] || '0').replace(/\s/g, '').replace(',', '.')) || 0 : 0;
            let amt = 0;

            if (mappedDebit !== -1 || mappedCredit !== -1) {
                if (deb > 0 && cred === 0) amt = deb;
                else if (cred > 0 && deb === 0) amt = cred;
                else if (deb > 0 || cred > 0) amt = Math.abs(deb - cred);
            } else if (mappedAmount !== -1) {
                amt = parseFloat(String(row[mappedAmount] || '0').replace(/[^0-9.-]+/g, '')) || 0;
            }

            if (skipZeroBalances && amt === 0) continue;

            // Classify category (НСБУ 21 / РСБУ Plan of Accounts logic)
            let category: 'assets' | 'liabilities' | 'equity' = 'assets';

            if (mappedCategory !== -1 && row[mappedCategory]) {
                const catVal = String(row[mappedCategory]).toLowerCase();
                if (catVal.includes('liab') || catVal.includes('пасс') || catVal.includes('обяз')) category = 'liabilities';
                else if (catVal.includes('eq') || catVal.includes('капит') || catVal.includes('прибыль')) category = 'equity';
                else category = 'assets';
            } else if (usePlanSchetov) {
                const numPrefix = parseInt(code.replace(/\D/g, '').slice(0, 2), 10);
                if (code.startsWith('02') || code.startsWith('05')) {
                    category = 'liabilities'; // Contra-assets / allowances
                } else if (!isNaN(numPrefix)) {
                    if (numPrefix >= 1 && numPrefix < 60) {
                        category = 'assets';
                    } else if (numPrefix >= 60 && numPrefix < 80) {
                        category = 'liabilities';
                    } else if (numPrefix >= 80 && numPrefix < 90) {
                        category = 'equity';
                    } else {
                        category = deb > 0 ? 'assets' : (cred > 0 ? 'liabilities' : 'assets');
                    }
                } else {
                    category = deb > 0 ? 'assets' : 'liabilities';
                }
            }

            items.push({
                account_code: code,
                account_name: name || `Счет ${code}`,
                amount: Math.abs(amt),
                category,
                raw_debit: deb,
                raw_credit: cred
            });

            if (category === 'assets') totalAssets += Math.abs(amt);
            else if (category === 'liabilities') totalLiab += Math.abs(amt);
            else if (category === 'equity') totalEquity += Math.abs(amt);
        }

        return { items, totalAssets, totalLiab, totalEquity };
    }, [rawData, headerRowIndex, mappedCode, mappedName, mappedDebit, mappedCredit, mappedAmount, mappedCategory, usePlanSchetov, skipZeroBalances]);

    const handleImportSubmit = async () => {
        if (parsedData.items.length === 0) return;
        setSubmitting(true);
        try {
            await onConfirm(
                parsedData.items, 
                period, 
                `Импортировано через интерактивный маппер из ${fileName}`
            );
        } finally {
            setSubmitting(false);
        }
    };

    const delta = Math.abs(parsedData.totalAssets - (parsedData.totalLiab + parsedData.totalEquity));
    const isBalanced = delta < 1.0;

    return (
        <Card className="border border-border/80 shadow-xl rounded-2xl overflow-hidden bg-card text-foreground animate-in fade-in duration-200">
            <CardHeader className="bg-slate-50/80 dark:bg-slate-900/60 border-b border-border p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <TableProperties className="w-5 h-5" />
                        </div>
                        <div>
                            <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                                {isRu ? 'Интерактивный маппинг колонок (1С / Excel)' : 'Interactive Column Mapper (1C / Excel)'}
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                    {fileName}
                                </span>
                            </CardTitle>
                            <CardDescription className="text-xs text-slate-500 mt-0.5">
                                {isRu 
                                    ? 'Сопоставьте столбцы вашей оборотно-сальдовой ведомости (ОСВ) со стандартными полями трансформации.'
                                    : 'Match the columns of your statutory trial balance (OSV) with standardized transformation attributes.'}
                            </CardDescription>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onCancel} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 self-start sm:self-auto">
                        <X className="w-4 h-4 mr-1" />
                        {isRu ? 'Отмена' : 'Cancel'}
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="p-5 sm:p-6 space-y-6">
                {/* 1. Configuration Panel */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-xs">
                    {/* Header Row Selector */}
                    <div>
                        <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
                            <TableProperties className="w-3.5 h-3.5 text-blue-500" />
                            {isRu ? 'Строка заголовков таблицы:' : 'Table Header Row:'}
                        </label>
                        <select 
                            value={headerRowIndex}
                            onChange={(e) => setHeaderRowIndex(Number(e.target.value))}
                            className="w-full h-8 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-background font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            {rawData.slice(0, Math.min(12, rawData.length)).map((row, idx) => (
                                <option key={idx} value={idx}>
                                    {isRu ? `Строка ${idx + 1}` : `Row ${idx + 1}`} ({row.filter(Boolean).slice(0, 3).join(', ').slice(0, 30) || '...'})
                                </option>
                            ))}
                        </select>
                        <span className="text-[10px] text-slate-400 block mt-1 truncate">
                            {isRu ? 'Строка с названиями колонок в 1С' : 'Header row in table'}
                        </span>
                    </div>

                    {/* Account Code */}
                    <div>
                        <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                            {isRu ? 'Код счета (Account Code):' : 'Account Code Column:'}
                        </label>
                        <select 
                            value={mappedCode}
                            onChange={(e) => setMappedCode(Number(e.target.value))}
                            className="w-full h-8 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-background font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value={-1}>{isRu ? '-- Не выбрано --' : '-- None --'}</option>
                            {columns.map(c => (
                                <option key={c.index} value={c.index}>
                                    [{c.index + 1}] {c.name}
                                </option>
                            ))}
                        </select>
                        <span className="text-[10px] text-slate-400 block mt-1 truncate">
                            Пример: {rawData[headerRowIndex + 1]?.[mappedCode] || '01.01'}
                        </span>
                    </div>

                    {/* Account Name */}
                    <div>
                        <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-slate-500" />
                            {isRu ? 'Наименование (Account Name):' : 'Account Name Column:'}
                        </label>
                        <select 
                            value={mappedName}
                            onChange={(e) => setMappedName(Number(e.target.value))}
                            className="w-full h-8 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-background text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value={-1}>{isRu ? '-- Авто-наименование --' : '-- Auto Generate --'}</option>
                            {columns.map(c => (
                                <option key={c.index} value={c.index}>
                                    [{c.index + 1}] {c.name}
                                </option>
                            ))}
                        </select>
                        <span className="text-[10px] text-slate-400 block mt-1 truncate">
                            Пример: {rawData[headerRowIndex + 1]?.[mappedName] || 'Основные средства'}
                        </span>
                    </div>

                    {/* Amount / Debit */}
                    <div>
                        <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            {isRu ? 'Сальдо Дт / Сумма (Debit / Amount):' : 'Debit / Amount Column:'}
                        </label>
                        <select 
                            value={mappedDebit !== -1 ? mappedDebit : mappedAmount}
                            onChange={(e) => {
                                const val = Number(e.target.value);
                                setMappedDebit(val);
                                setMappedAmount(val);
                            }}
                            className="w-full h-8 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-background font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value={-1}>{isRu ? '-- Не выбрано --' : '-- None --'}</option>
                            {columns.map(c => (
                                <option key={c.index} value={c.index}>
                                    [{c.index + 1}] {c.name}
                                </option>
                            ))}
                        </select>
                        <span className="text-[10px] text-slate-400 block mt-1 truncate">
                            Пример: {rawData[headerRowIndex + 1]?.[mappedDebit !== -1 ? mappedDebit : mappedAmount] || '500,000.00'}
                        </span>
                    </div>

                    {/* Credit (Optional) */}
                    <div>
                        <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            {isRu ? 'Сальдо Кт (Credit - опционально):' : 'Credit Column (Optional):'}
                        </label>
                        <select 
                            value={mappedCredit}
                            onChange={(e) => setMappedCredit(Number(e.target.value))}
                            className="w-full h-8 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-background font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value={-1}>{isRu ? '-- Нет (одна колонка) --' : '-- None (single column) --'}</option>
                            {columns.map(c => (
                                <option key={c.index} value={c.index}>
                                    [{c.index + 1}] {c.name}
                                </option>
                            ))}
                        </select>
                        <span className="text-[10px] text-slate-400 block mt-1 truncate">
                            Пример: {mappedCredit !== -1 ? (rawData[headerRowIndex + 1]?.[mappedCredit] || '0.00') : '-'}
                        </span>
                    </div>

                    {/* Category (Optional) */}
                    <div>
                        <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-purple-500" />
                            {isRu ? 'Категория (Category - опционально):' : 'Category Column (Optional):'}
                        </label>
                        <select 
                            value={mappedCategory}
                            onChange={(e) => setMappedCategory(Number(e.target.value))}
                            className="w-full h-8 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-background font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value={-1}>{isRu ? '-- Авто по НСБУ 21 --' : '-- Auto by NAS 21 --'}</option>
                            {columns.map(c => (
                                <option key={c.index} value={c.index}>
                                    [{c.index + 1}] {c.name}
                                </option>
                            ))}
                        </select>
                        <span className="text-[10px] text-slate-400 block mt-1 truncate">
                            Пример: {mappedCategory !== -1 ? (rawData[headerRowIndex + 1]?.[mappedCategory] || 'Assets') : 'Авто'}
                        </span>
                    </div>
                </div>

                {/* Additional Settings & Toggles */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-xl bg-slate-100/60 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 text-xs">
                    <div className="flex flex-wrap items-center gap-5">
                        <label className="flex items-center gap-2 cursor-pointer select-none font-medium text-slate-700 dark:text-slate-300">
                            <input 
                                type="checkbox"
                                checked={usePlanSchetov}
                                onChange={(e) => setUsePlanSchetov(e.target.checked)}
                                className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                            />
                            <span className="flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                {isRu ? 'Авто-классификация по плану счетов (НСБУ 21)' : 'Auto-classify by Plan of Accounts (NAS 21)'}
                            </span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 dark:text-slate-400">
                            <input 
                                type="checkbox"
                                checked={skipZeroBalances}
                                onChange={(e) => setSkipZeroBalances(e.target.checked)}
                                className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                            />
                            <span>{isRu ? 'Пропускать нулевые остатки' : 'Skip zero balance items'}</span>
                        </label>
                    </div>

                    <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-slate-600 dark:text-slate-400 text-[11px]">{isRu ? 'Период:' : 'Period:'}</span>
                        <input 
                            type="date"
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            className="h-7 px-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-background font-mono"
                        />
                    </div>
                </div>

                {/* 2. Live Recognition Preview Table */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <span className="flex items-center gap-1.5">
                            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                            {isRu ? 'Предпросмотр распознанных проводок (первые 8 строк):' : 'Recognized Records Preview (First 8 Rows):'}
                        </span>
                        <span className="text-[11px] font-normal text-slate-500">
                            {isRu 
                                ? `Всего валидных строк: ${parsedData.items.length}` 
                                : `Total valid rows: ${parsedData.items.length}`}
                        </span>
                    </div>

                    <div className="border border-border/80 rounded-xl overflow-hidden shadow-xs">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-[11px] text-slate-600 dark:text-slate-400 uppercase font-semibold border-b border-border">
                                <tr>
                                    <th className="p-2.5 pl-4 w-24">{isRu ? 'Счет' : 'Code'}</th>
                                    <th className="p-2.5">{isRu ? 'Наименование статьи' : 'Account Description'}</th>
                                    <th className="p-2.5 w-32">{isRu ? 'Категория МСФО' : 'Category'}</th>
                                    <th className="p-2.5 pr-4 text-right w-36">{isRu ? 'Сумма (Баланс)' : 'Amount'}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {parsedData.items.slice(0, 8).map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                                        <td className="p-2.5 pl-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                                            {item.account_code}
                                        </td>
                                        <td className="p-2.5 font-medium text-slate-800 dark:text-slate-200">
                                            {item.account_name}
                                        </td>
                                        <td className="p-2.5">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                                item.category === 'assets' 
                                                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30' 
                                                    : item.category === 'liabilities' 
                                                    ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30' 
                                                    : 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30'
                                            }`}>
                                                {item.category === 'assets' ? (isRu ? 'Активы' : 'Assets') :
                                                 item.category === 'liabilities' ? (isRu ? 'Обязательства' : 'Liabilities') :
                                                 (isRu ? 'Капитал' : 'Equity')}
                                            </span>
                                        </td>
                                        <td className="p-2.5 pr-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                                            ${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 3. Balance Equilibrium Summary & Confirmation */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                    <div className="grid grid-cols-3 gap-4 text-xs font-mono">
                        <div>
                            <span className="text-[10px] font-sans text-slate-400 block">{isRu ? 'Активы (Assets):' : 'Total Assets:'}</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                ${parsedData.totalAssets.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </span>
                        </div>
                        <div>
                            <span className="text-[10px] font-sans text-slate-400 block">{isRu ? 'Пассивы (L + E):' : 'Liab + Equity:'}</span>
                            <span className="font-bold text-blue-600 dark:text-blue-400">
                                ${(parsedData.totalLiab + parsedData.totalEquity).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </span>
                        </div>
                        <div>
                            <span className="text-[10px] font-sans text-slate-400 block">{isRu ? 'Сходимость:' : 'Equilibrium:'}</span>
                            <span className={`font-bold flex items-center gap-1 ${isBalanced ? 'text-emerald-600' : 'text-amber-500'}`}>
                                {isBalanced ? (
                                    <>
                                        <CheckCircle2 className="w-3 h-3" />
                                        100% [СВЕРЕНО]
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle className="w-3 h-3" />
                                        Δ ${delta.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </>
                                )}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                        <Button variant="outline" size="sm" onClick={onCancel} disabled={submitting}>
                            {isRu ? 'Отмена' : 'Cancel'}
                        </Button>
                        <Button 
                            onClick={handleImportSubmit} 
                            disabled={submitting || parsedData.items.length === 0}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5"
                            size="sm"
                        >
                            {submitting ? (
                                <>
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    {isRu ? 'Импорт...' : 'Importing...'}
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    {isRu ? `Импортировать (${parsedData.items.length} строк)` : `Import (${parsedData.items.length} items)`}
                                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
