import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Download, Eye, Calculator, CheckCircle, BookOpen, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { useState } from 'react';

export default function ExamplesPage() {
    const { t } = useTranslation();
    const [showFormulas, setShowFormulas] = useState(false);

    const generateExcelFile = (filename: string): Blob | null => {
        let data: any[] = [];
        let sheetName = "Sheet1";

        if (filename === 'balance_sheet_nas.xlsx') {
            sheetName = "Balance Sheet (NAS)";
            data = [
                [t('item_name'), t('line_code'), t('at_date') + " 31.12.2024", t('at_date') + " 31.12.2023"],
                [t('assets'), "", "", ""],
                [t('non_current_assets'), "", "", ""],
                [t('fixed_assets'), "010", 35000000, 30000000],
                [t('intangible_assets'), "020", 4000000, 3500000],
                [t('long_term_investments'), "060", 10000000, 8000000],
                [t('total_section_i'), "100", 49000000, 41500000],
                [t('current_assets'), "", "", ""],
                [t('inventories'), "140", 24500000, 20000000],
                [t('vat_acquired'), "150", 1500000, 1200000],
                [t('receivables'), "210", 16000000, 14000000],
                [t('cash_funds'), "320", 11500000, 9000000],
                [t('total_section_ii'), "390", 53500000, 44200000],
                [t('balance_asset'), "400", 102500000, 85700000],
                ["", "", "", ""],
                [t('liabilities'), "", "", ""],
                [t('equity_reserves'), "", "", ""],
                [t('authorized_capital'), "410", 20000000, 20000000],
                [t('reserve_capital'), "420", 2000000, 1500000],
                [t('retained_earnings'), "450", 23500000, 18200000],
                [t('total_section_iii'), "480", 45500000, 39700000],
                [t('long_term_liabilities'), "", "", ""],
                [t('long_term_loans'), "490", 20000000, 15000000],
                [t('short_term_loans'), "610", 10000000, 8000000],
                [t('payables'), "600", 27000000, 23000000],
                [t('total_section_ii'), "770", 57000000, 46000000],
                [t('balance_liability'), "780", 102500000, 85700000]
            ];
        } else if (filename === 'balance_sheet_ifrs.xlsx') {
            sheetName = "Statement of Financial Position";
            data = [
                ["Item / Показатель", "Note", "2024 (UZS)", "2023 (UZS)"],
                ["ASSETS", "", "", ""],
                ["Non-current assets", "", "", ""],
                ["Property, plant and equipment", "5", 35000000, 30000000],
                ["Intangible assets", "6", 4000000, 3500000],
                ["Right-of-use assets", "7", 5000000, 4500000],
                ["Financial assets at FVOCI", "8", 10000000, 8000000],
                ["Total non-current assets", "", 54000000, 46000000],
                ["Current assets", "", "", ""],
                ["Inventories", "9", 24500000, 20000000],
                ["Trade and other receivables", "10", 15000000, 13000000],
                ["Less: ECL provision", "", -500000, -300000],
                ["Cash and cash equivalents", "11", 11500000, 9000000],
                ["Total current assets", "", 50500000, 41700000],
                ["TOTAL ASSETS", "", 104500000, 87700000],
                ["", "", "", ""],
                ["EQUITY AND LIABILITIES", "", "", ""],
                ["Equity", "", "", ""],
                ["Share capital", "12", 20000000, 20000000],
                ["Retained earnings", "", 25500000, 19700000],
                ["Total equity", "", 45500000, 39700000],
                ["Liabilities", "", "", ""],
                ["Non-current liabilities", "", "", ""],
                ["Loans and borrowings", "13", 20000000, 15000000],
                ["Lease liabilities", "7", 4000000, 3500000],
                ["Current liabilities", "", "", ""],
                ["Trade and other payables", "14", 27000000, 23000000],
                ["Current tax liabilities", "", 2000000, 1500000],
                ["Total liabilities", "", 59000000, 48000000],
                ["TOTAL EQUITY AND LIABILITIES", "", 104500000, 87700000]
            ];
        } else if (filename === 'profit_loss.xlsx') {
            sheetName = "Profit and Loss";
            data = [
                [t('item_name'), "2024", "2023"],
                [t('revenue_sales'), 150000000, 120000000],
                [t('cost_sales'), -90000000, -72000000],
                [t('gross_profit'), 60000000, 48000000],
                [t('selling_expenses'), -15000000, -12000000],
                [t('admin_expenses'), -20000000, -16000000],
                [t('profit_sales'), 25000000, 20000000],
                [t('other_income'), 3000000, 2000000],
                [t('other_expenses'), -2000000, -1500000],
                [t('profit_before_tax'), 26000000, 20500000],
                [t('income_tax') + " (15%)", -3900000, -3075000],
                [t('net_profit'), 22100000, 17425000]
            ];
        } else if (filename === 'cash_flow.xlsx') {
            sheetName = "Cash Flow";
            data = [
                [t('item_name'), "2024"],
                [t('cash_flow_operating'), ""],
                [t('receipts_customers'), 145000000],
                [t('payments_suppliers'), -85000000],
                [t('payments_wages'), -25000000],
                [t('tax_payments'), -15000000],
                [t('net_cash_operating'), 20000000],
                [t('cash_flow_investing'), ""],
                [t('purchase_fixed_assets'), -8000000],
                [t('sale_fixed_assets'), 1000000],
                [t('net_cash_investing'), -7000000],
                [t('cash_flow_financing'), ""],
                [t('loans_received'), 10000000],
                [t('loans_repaid'), -5000000],
                [t('dividends_paid'), -15500000],
                [t('net_cash_financing'), -10500000],
                [t('net_change_cash'), 2500000],
                [t('cash_start_year'), 9000000],
                [t('cash_end_year'), 11500000]
            ];
        } else if (filename === 'audit_program.xlsx') {
            sheetName = "Audit Program";
            data = [
                ["Раздел аудита", "Процедура", "Исполнитель", "Статус", "Ссылка на РД"],
                ["Основные средства", "Инвентаризация ОС", "Аудитор 1", "Выполнено", "РД-ОС-01"],
                ["Основные средства", "Пересчет амортизации", "Аудитор 1", "Выполнено", "РД-ОС-02"],
                ["Основные средства", "Проверка права собственности", "Аудитор 1", "В процессе", "РД-ОС-03"],
                ["Запасы", "Наблюдение за инвентаризацией", "Аудитор 2", "Выполнено", "РД-ТМЗ-01"],
                ["Запасы", "Тест оценки (NRV)", "Аудитор 2", "Не начато", "РД-ТМЗ-02"],
                ["Дебиторская задолженность", "Рассылка подтверждений", "Аудитор 1", "Отправлено", "РД-ДЗ-01"],
                ["Дебиторская задолженность", "Анализ резервов (ECL)", "Аудитор 1", "Не начато", "РД-ДЗ-02"],
                ["Выручка", "Тест отсечения (Cut-off)", "Аудитор 2", "Выполнено", "РД-ВЫР-01"],
                ["Выручка", "Аналитические процедуры", "Аудитор 2", "Выполнено", "РД-ВЫР-02"]
            ];
        } else if (filename === 'materiality_calc.xlsx') {
            sheetName = "Materiality";
            data = [
                [t('item_name'), t('value') + " (UZS)", t('percent'), t('materiality')],
                [t('revenue'), 500000000, "1%", 5000000],
                ["Активы", 200000000, "2%", 4000000],
                [t('profit_before_tax'), 30000000, "5%", 1500000],
                ["", "", "", ""],
                ["ВЫБРАННЫЙ УРОВЕНЬ", "", "", 1500000],
                ["Рабочая существенность (75%)", "", "", 1125000],
                ["Порог явной незначительности (5%)", "", "", 75000]
            ];
        } else if (filename === 'working_paper_template.xlsx') {
            sheetName = "Working Paper";
            data = [
                [t('client') + ":", "ООО Пример", t('date') + ":", "26.11.2024"],
                ["Раздел:", t('revenue'), t('auditor_name') + ":", "Аудитор"],
                ["", "", "", ""],
                ["Цель:", "Проверка полноты отражения выручки", "", ""],
                ["", "", "", ""],
                ["№ п/п", t('date'), "Документ", "Сумма", "Контрагент", "Проверка"],
                ["1", "01.12.2024", "Счет-фактура 101", 10000000, "Клиент А", "Соответствует"],
                ["2", "05.12.2024", "Счет-фактура 102", 5000000, "Клиент Б", "Соответствует"],
                ["3", "10.12.2024", "Счет-фактура 103", 12000000, "Клиент В", "Нет подписи"],
                ["", "", "", ""],
                ["Вывод:", "В целом выручка отражена верно, за исключением...", "", ""]
            ];
        } else {
            return null;
        }

        // Generate Excel file as blob
        const ws = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName);

        // Write to array buffer
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    };

    const downloadExample = (filename: string) => {
        if (filename === 'notes_template.docx') {
            // Fallback for DOCX - create a text file instead
            const element = document.createElement("a");
            const file = new Blob([`
${t('notes_financial_statements')}

1. ${t('note_1_policy').toUpperCase()}
${t('note_1_desc')}

2. ${t('note_2_fixed_assets').toUpperCase()}
(${t('group_fa')} | ${t('initial_cost')} | ${t('depreciation')} | ${t('residual_value')})

3. ...
            `], { type: 'text/plain' });
            element.href = URL.createObjectURL(file);
            element.download = "notes_template.txt";
            document.body.appendChild(element);
            element.click();
            return;
        }

        const blob = generateExcelFile(filename);
        if (blob) {
            const element = document.createElement("a");
            element.href = URL.createObjectURL(blob);
            element.download = filename;
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
        }
    };

    const downloadAllWPTemplates = async () => {
        const zip = new JSZip();
        const folder = zip.folder("Working_Paper_Templates");

        if (!folder) return;

        // Add working paper template
        const wpTemplate = generateExcelFile('working_paper_template.xlsx');
        if (wpTemplate) {
            folder.file("working_paper_template.xlsx", wpTemplate);
        }

        // Add audit program
        const auditProgram = generateExcelFile('audit_program.xlsx');
        if (auditProgram) {
            folder.file("audit_program.xlsx", auditProgram);
        }

        // Add materiality calculation
        const materialityCalc = generateExcelFile('materiality_calc.xlsx');
        if (materialityCalc) {
            folder.file("materiality_calculation.xlsx", materialityCalc);
        }

        // Generate and download ZIP
        const content = await zip.generateAsync({ type: 'blob' });
        const element = document.createElement("a");
        element.href = URL.createObjectURL(content);
        element.download = "working_paper_templates.zip";
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const downloadAllExamples = async () => {
        const zip = new JSZip();

        // Create folders
        const accountantsFolder = zip.folder("For_Accountants");
        const auditorsFolder = zip.folder("For_Auditors");

        if (!accountantsFolder || !auditorsFolder) return;

        // Add accountant examples
        const balanceNAS = generateExcelFile('balance_sheet_nas.xlsx');
        if (balanceNAS) accountantsFolder.file("balance_sheet_nas.xlsx", balanceNAS);

        const balanceIFRS = generateExcelFile('balance_sheet_ifrs.xlsx');
        if (balanceIFRS) accountantsFolder.file("balance_sheet_ifrs.xlsx", balanceIFRS);

        const profitLoss = generateExcelFile('profit_loss.xlsx');
        if (profitLoss) accountantsFolder.file("profit_loss.xlsx", profitLoss);

        const cashFlow = generateExcelFile('cash_flow.xlsx');
        if (cashFlow) accountantsFolder.file("cash_flow.xlsx", cashFlow);

        // Add notes template as text
        const notesContent = `
${t('notes_financial_statements')}

1. ${t('note_1_policy').toUpperCase()}
${t('note_1_desc')}

2. ${t('note_2_fixed_assets').toUpperCase()}
(${t('group_fa')} | ${t('initial_cost')} | ${t('depreciation')} | ${t('residual_value')})

3. ...
        `;
        accountantsFolder.file("notes_template.txt", notesContent);

        // Add auditor examples
        const auditProgram = generateExcelFile('audit_program.xlsx');
        if (auditProgram) auditorsFolder.file("audit_program.xlsx", auditProgram);

        const materialityCalc = generateExcelFile('materiality_calc.xlsx');
        if (materialityCalc) auditorsFolder.file("materiality_calculation.xlsx", materialityCalc);

        const wpTemplate = generateExcelFile('working_paper_template.xlsx');
        if (wpTemplate) auditorsFolder.file("working_paper_template.xlsx", wpTemplate);

        // Generate and download ZIP
        const content = await zip.generateAsync({ type: 'blob' });
        const element = document.createElement("a");
        element.href = URL.createObjectURL(content);
        element.download = "all_examples.zip";
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-bold tracking-tight">
                    📊 {t('examples_title')}
                </h1>
                <p className="text-gray-500 mt-2">
                    {t('examples_subtitle')}
                </p>
            </div>

            {/* Quick Navigation */}
            <Card className="bg-gradient-to-r from-blue-50 to-emerald-50 border-blue-200">
                <CardHeader>
                    <CardTitle>🎯 {t('quick_navigation')}</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <a href="#accountants" className="p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2">
                            <Calculator className="h-5 w-5 text-blue-600" />
                            <span className="font-medium">{t('for_accountants')}</span>
                        </div>
                    </a>
                    <a href="#auditors" className="p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-emerald-600" />
                            <span className="font-medium">{t('for_auditors')}</span>
                        </div>
                    </a>
                    <a href="#ifrs" className="p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-purple-600" />
                            <span className="font-medium">{t('ifrs_examples')}</span>
                        </div>
                    </a>
                    <a href="#mcfo" className="p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2">
                            <FileSpreadsheet className="h-5 w-5 text-amber-600" />
                            <span className="font-medium">{t('msfo_examples')}</span>
                        </div>
                    </a>
                </CardContent>
            </Card>

            {/* For Accountants Section */}
            <div id="accountants">
                <h2 className="text-3xl font-bold mb-6">📊 {t('for_accountants')}</h2>

                <Tabs defaultValue="balance-sheet" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="balance-sheet">{t('balance_sheet')}</TabsTrigger>
                        <TabsTrigger value="profit-loss">{t('profit_loss')}</TabsTrigger>
                        <TabsTrigger value="cash-flow">{t('cash_flow')}</TabsTrigger>
                        <TabsTrigger value="notes">{t('notes_financial')}</TabsTrigger>
                    </TabsList>

                    {/* Balance Sheet Examples */}
                    <TabsContent value="balance-sheet" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-blue-600" />
                                    {t('balance_sheet_example')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* NAS Example */}
                                <div className="border-l-4 border-blue-500 pl-4">
                                    <h3 className="text-lg font-semibold mb-3">📘 {t('nas_standard')}</h3>
                                    <div className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b-2 border-gray-300">
                                                    <th className="text-left p-2">{t('item_name')}</th>
                                                    <th className="text-center p-2">{t('line_code')}</th>
                                                    <th className="text-right p-2">{t('at_date')} 31.12.2024</th>
                                                    <th className="text-right p-2">{t('at_date')} 31.12.2023</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr className="bg-blue-100 font-semibold">
                                                    <td colSpan={4} className="p-2">{t('assets')}</td>
                                                </tr>
                                                <tr className="bg-blue-50">
                                                    <td colSpan={4} className="p-2 font-medium">{t('non_current_assets')}</td>
                                                </tr>
                                                <tr className="border-b">
                                                    <td className="p-2">{t('fixed_assets')}</td>
                                                    <td className="text-center p-2">010</td>
                                                    <td className="text-right p-2 font-mono">35,000,000</td>
                                                    <td className="text-right p-2 font-mono">30,000,000</td>
                                                </tr>
                                                <tr className="border-b">
                                                    <td className="p-2">{t('intangible_assets')}</td>
                                                    <td className="text-center p-2">020</td>
                                                    <td className="text-right p-2 font-mono">4,000,000</td>
                                                    <td className="text-right p-2 font-mono">3,500,000</td>
                                                </tr>
                                                <tr className="border-b">
                                                    <td className="p-2">{t('long_term_investments')}</td>
                                                    <td className="text-center p-2">030</td>
                                                    <td className="text-right p-2 font-mono">10,000,000</td>
                                                    <td className="text-right p-2 font-mono">8,000,000</td>
                                                </tr>
                                                <tr className="bg-blue-50 font-semibold border-b-2">
                                                    <td className="p-2">{t('total_section_i')}</td>
                                                    <td className="text-center p-2">100</td>
                                                    <td className="text-right p-2 font-mono">49,000,000</td>
                                                    <td className="text-right p-2 font-mono">41,500,000</td>
                                                </tr>

                                                <tr className="bg-blue-50">
                                                    <td colSpan={4} className="p-2 font-medium">{t('current_assets')}</td>
                                                </tr>
                                                <tr className="border-b">
                                                    <td className="p-2">{t('inventories')}</td>
                                                    <td className="text-center p-2">110</td>
                                                    <td className="text-right p-2 font-mono">24,500,000</td>
                                                    <td className="text-right p-2 font-mono">20,000,000</td>
                                                </tr>
                                                <tr className="border-b">
                                                    <td className="p-2">{t('vat_acquired')}</td>
                                                    <td className="text-center p-2">120</td>
                                                    <td className="text-right p-2 font-mono">1,500,000</td>
                                                    <td className="text-right p-2 font-mono">1,200,000</td>
                                                </tr>
                                                <tr className="border-b">
                                                    <td className="p-2">{t('receivables')}</td>
                                                    <td className="text-center p-2">130</td>
                                                    <td className="text-right p-2 font-mono">16,000,000</td>
                                                    <td className="text-right p-2 font-mono">14,000,000</td>
                                                </tr>
                                                <tr className="border-b">
                                                    <td className="p-2">{t('cash_funds')}</td>
                                                    <td className="text-center p-2">140</td>
                                                    <td className="text-right p-2 font-mono">11,500,000</td>
                                                    <td className="text-right p-2 font-mono">9,000,000</td>
                                                </tr>
                                                <tr className="bg-blue-50 font-semibold border-b-2">
                                                    <td className="p-2">{t('total_section_ii')}</td>
                                                    <td className="text-center p-2">200</td>
                                                    <td className="text-right p-2 font-mono">53,500,000</td>
                                                    <td className="text-right p-2 font-mono">44,200,000</td>
                                                </tr>

                                                <tr className="bg-blue-100 font-bold border-b-2">
                                                    <td className="p-2">{t('balance_asset')}</td>
                                                    <td className="text-center p-2">300</td>
                                                    <td className="text-right p-2 font-mono">102,500,000</td>
                                                    <td className="text-right p-2 font-mono">85,700,000</td>
                                                </tr>

                                                <tr className="bg-emerald-100 font-semibold">
                                                    <td colSpan={4} className="p-2">{t('liabilities')}</td>
                                                </tr>
                                                <tr className="bg-emerald-50">
                                                    <td colSpan={4} className="p-2 font-medium">{t('equity_reserves')}</td>
                                                </tr>
                                                <tr className="border-b">
                                                    <td className="p-2">{t('authorized_capital')}</td>
                                                    <td className="text-center p-2">310</td>
                                                    <td className="text-right p-2 font-mono">20,000,000</td>
                                                    <td className="text-right p-2 font-mono">20,000,000</td>
                                                </tr>
                                                <tr className="border-b">
                                                    <td className="p-2">{t('reserve_capital')}</td>
                                                    <td className="text-center p-2">320</td>
                                                    <td className="text-right p-2 font-mono">2,000,000</td>
                                                    <td className="text-right p-2 font-mono">1,500,000</td>
                                                </tr>
                                                <tr className="border-b">
                                                    <td className="p-2">{t('retained_earnings')}</td>
                                                    <td className="text-center p-2">330</td>
                                                    <td className="text-right p-2 font-mono">23,500,000</td>
                                                    <td className="text-right p-2 font-mono">18,200,000</td>
                                                </tr>
                                                <tr className="bg-emerald-50 font-semibold border-b-2">
                                                    <td className="p-2">{t('total_section_iii')}</td>
                                                    <td className="text-center p-2">400</td>
                                                    <td className="text-right p-2 font-mono">45,500,000</td>
                                                    <td className="text-right p-2 font-mono">39,700,000</td>
                                                </tr>

                                                <tr className="bg-emerald-50">
                                                    <td colSpan={4} className="p-2 font-medium">{t('long_term_liabilities')}</td>
                                                </tr>
                                                <tr className="border-b">
                                                    <td className="p-2">{t('long_term_loans')}</td>
                                                    <td className="text-center p-2">410</td>
                                                    <td className="text-right p-2 font-mono">20,000,000</td>
                                                    <td className="text-right p-2 font-mono">15,000,000</td>
                                                </tr>
                                                <tr className="bg-emerald-50 font-semibold border-b-2">
                                                    <td className="p-2">{t('total_section_iv')}</td>
                                                    <td className="text-center p-2">500</td>
                                                    <td className="text-right p-2 font-mono">20,000,000</td>
                                                    <td className="text-right p-2 font-mono">15,000,000</td>
                                                </tr>

                                                <tr className="bg-emerald-50">
                                                    <td colSpan={4} className="p-2 font-medium">{t('short_term_liabilities')}</td>
                                                </tr>
                                                <tr className="border-b">
                                                    <td className="p-2">{t('short_term_loans')}</td>
                                                    <td className="text-center p-2">510</td>
                                                    <td className="text-right p-2 font-mono">10,000,000</td>
                                                    <td className="text-right p-2 font-mono">8,000,000</td>
                                                </tr>
                                                <tr className="border-b">
                                                    <td className="p-2">{t('payables')}</td>
                                                    <td className="text-center p-2">520</td>
                                                    <td className="text-right p-2 font-mono">27,000,000</td>
                                                    <td className="text-right p-2 font-mono">23,000,000</td>
                                                </tr>
                                                <tr className="bg-emerald-50 font-semibold border-b-2">
                                                    <td className="p-2">{t('total_section_v')}</td>
                                                    <td className="text-center p-2">600</td>
                                                    <td className="text-right p-2 font-mono">37,000,000</td>
                                                    <td className="text-right p-2 font-mono">31,000,000</td>
                                                </tr>

                                                <tr className="bg-emerald-100 font-bold border-b-2">
                                                    <td className="p-2">{t('balance_liability')}</td>
                                                    <td className="text-center p-2">700</td>
                                                    <td className="text-right p-2 font-mono">102,500,000</td>
                                                    <td className="text-right p-2 font-mono">85,700,000</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                                        <p className="text-sm font-medium text-blue-900 mb-2">✓ {t('check_balance')}</p>
                                        <p className="text-sm text-blue-800">{t('balance_asset')} (102,500,000) = {t('balance_liability')} (102,500,000) ✓</p>
                                        <p className="text-sm text-blue-800 mt-1">{t('formula_check')}</p>
                                    </div>

                                    <div className="mt-4 flex gap-2">
                                        <Button onClick={() => downloadExample('balance_sheet_nas.xlsx')} className="gap-2">
                                            <Download className="h-4 w-4" />
                                            {t('download_example_nas')}
                                        </Button>
                                        <Button variant="outline" className="gap-2" onClick={() => downloadExample('notes_template.docx')}>
                                            <FileText className="h-4 w-4" />
                                            {t('notes_to_report')}
                                        </Button>
                                    </div>
                                </div>

                                {/* IFRS Example */}
                                <div id="ifrs" className="border-l-4 border-purple-500 pl-4 mt-6">
                                    <div id="mcfo">
                                        <h3 className="text-lg font-semibold mb-3">📗 {t('ifrs_standard')}</h3>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-700 mb-3">
                                            <strong>{t('statement_financial_position')}</strong>
                                        </p>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b-2 border-gray-300">
                                                        <th className="text-left p-2">Item / Показатель</th>
                                                        <th className="text-right p-2">2024 (UZS)</th>
                                                        <th className="text-right p-2">2023 (UZS)</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr className="bg-purple-100 font-semibold">
                                                        <td colSpan={3} className="p-2">ASSETS / АКТИВЫ</td>
                                                    </tr>
                                                    <tr className="bg-purple-50">
                                                        <td colSpan={3} className="p-2 font-medium">Non-current assets / Внеоборотные активы</td>
                                                    </tr>
                                                    <tr className="border-b">
                                                        <td className="p-2">Property, plant and equipment</td>
                                                        <td className="text-right p-2 font-mono">35,000,000</td>
                                                        <td className="text-right p-2 font-mono">30,000,000</td>
                                                    </tr>
                                                    <tr className="border-b">
                                                        <td className="p-2">Intangible assets</td>
                                                        <td className="text-right p-2 font-mono">4,000,000</td>
                                                        <td className="text-right p-2 font-mono">3,500,000</td>
                                                    </tr>
                                                    <tr className="border-b">
                                                        <td className="p-2">Right-of-use assets (IFRS 16)</td>
                                                        <td className="text-right p-2 font-mono">5,000,000</td>
                                                        <td className="text-right p-2 font-mono">4,500,000</td>
                                                    </tr>
                                                    <tr className="border-b">
                                                        <td className="p-2">Financial assets at FVOCI</td>
                                                        <td className="text-right p-2 font-mono">10,000,000</td>
                                                        <td className="text-right p-2 font-mono">8,000,000</td>
                                                    </tr>
                                                    <tr className="bg-purple-50 font-semibold border-b-2">
                                                        <td className="p-2">Total non-current assets</td>
                                                        <td className="text-right p-2 font-mono">54,000,000</td>
                                                        <td className="text-right p-2 font-mono">46,000,000</td>
                                                    </tr>

                                                    <tr className="bg-purple-50">
                                                        <td colSpan={3} className="p-2 font-medium">Current assets / Оборотные активы</td>
                                                    </tr>
                                                    <tr className="border-b">
                                                        <td className="p-2">Inventories</td>
                                                        <td className="text-right p-2 font-mono">24,500,000</td>
                                                        <td className="text-right p-2 font-mono">20,000,000</td>
                                                    </tr>
                                                    <tr className="border-b">
                                                        <td className="p-2">Trade and other receivables</td>
                                                        <td className="text-right p-2 font-mono">15,000,000</td>
                                                        <td className="text-right p-2 font-mono">13,000,000</td>
                                                    </tr>
                                                    <tr className="border-b">
                                                        <td className="p-2 pl-6 text-xs">Less: ECL provision (IFRS 9)</td>
                                                        <td className="text-right p-2 font-mono text-red-600">(500,000)</td>
                                                        <td className="text-right p-2 font-mono text-red-600">(300,000)</td>
                                                    </tr>
                                                    <tr className="border-b">
                                                        <td className="p-2">Cash and cash equivalents</td>
                                                        <td className="text-right p-2 font-mono">11,500,000</td>
                                                        <td className="text-right p-2 font-mono">9,000,000</td>
                                                    </tr>
                                                    <tr className="bg-purple-50 font-semibold border-b-2">
                                                        <td className="p-2">Total current assets</td>
                                                        <td className="text-right p-2 font-mono">50,500,000</td>
                                                        <td className="text-right p-2 font-mono">41,700,000</td>
                                                    </tr>

                                                    <tr className="bg-purple-100 font-bold border-b-2">
                                                        <td className="p-2">TOTAL ASSETS</td>
                                                        <td className="text-right p-2 font-mono">104,500,000</td>
                                                        <td className="text-right p-2 font-mono">87,700,000</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <div className="mt-4 p-3 bg-purple-50 rounded border border-purple-200">
                                        <p className="text-sm font-medium text-purple-900 mb-2">📌 {t('key_differences_ifrs')}</p>
                                        <ul className="text-sm text-purple-800 space-y-1 list-disc ml-5">
                                            <li>Учет аренды по IFRS 16 (Right-of-use assets)</li>
                                            <li>Резерв по ожидаемым кредитным убыткам (ECL) по IFRS 9</li>
                                            <li>Классификация финансовых активов (FVOCI, FVTPL, AC)</li>
                                            <li>Более детальное раскрытие информации</li>
                                        </ul>
                                    </div>

                                    <div className="mt-4 flex gap-2">
                                        <Button onClick={() => downloadExample('balance_sheet_ifrs.xlsx')} className="gap-2 bg-purple-600 hover:bg-purple-700">
                                            <Download className="h-4 w-4" />
                                            {t('download_example_ifrs')}
                                        </Button>
                                        <Button variant="outline" className="gap-2" onClick={() => downloadExample('notes_template.docx')}>
                                            <FileText className="h-4 w-4" />
                                            {t('notes_to_report')}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Profit & Loss Examples */}
                    <TabsContent value="profit-loss" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('profit_loss_examples')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b-2 border-gray-300">
                                                <th className="text-left p-2">{t('item_name')}</th>
                                                <th className="text-right p-2">2024</th>
                                                <th className="text-right p-2">2023</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="border-b">
                                                <td className="p-2 font-semibold">{t('revenue_sales')}</td>
                                                <td className="text-right p-2 font-mono">150,000,000</td>
                                                <td className="text-right p-2 font-mono">120,000,000</td>
                                            </tr>
                                            <tr className="border-b">
                                                <td className="p-2">{t('cost_sales')}</td>
                                                <td className="text-right p-2 font-mono text-red-600">(90,000,000)</td>
                                                <td className="text-right p-2 font-mono text-red-600">(72,000,000)</td>
                                            </tr>
                                            <tr className="bg-blue-50 border-b font-semibold">
                                                <td className="p-2">{t('gross_profit')}</td>
                                                <td className="text-right p-2 font-mono">60,000,000</td>
                                                <td className="text-right p-2 font-mono">48,000,000</td>
                                            </tr>
                                            <tr className="border-b">
                                                <td className="p-2">{t('selling_expenses')}</td>
                                                <td className="text-right p-2 font-mono text-red-600">(15,000,000)</td>
                                                <td className="text-right p-2 font-mono text-red-600">(12,000,000)</td>
                                            </tr>
                                            <tr className="border-b">
                                                <td className="p-2">{t('admin_expenses')}</td>
                                                <td className="text-right p-2 font-mono text-red-600">(20,000,000)</td>
                                                <td className="text-right p-2 font-mono text-red-600">(16,000,000)</td>
                                            </tr>
                                            <tr className="bg-emerald-50 border-b font-semibold">
                                                <td className="p-2">{t('profit_sales')}</td>
                                                <td className="text-right p-2 font-mono">25,000,000</td>
                                                <td className="text-right p-2 font-mono">20,000,000</td>
                                            </tr>
                                            <tr className="border-b">
                                                <td className="p-2">{t('other_income')}</td>
                                                <td className="text-right p-2 font-mono">3,000,000</td>
                                                <td className="text-right p-2 font-mono">2,000,000</td>
                                            </tr>
                                            <tr className="border-b">
                                                <td className="p-2">{t('other_expenses')}</td>
                                                <td className="text-right p-2 font-mono text-red-600">(2,000,000)</td>
                                                <td className="text-right p-2 font-mono text-red-600">(1,500,000)</td>
                                            </tr>
                                            <tr className="bg-blue-100 border-b font-bold">
                                                <td className="p-2">{t('profit_before_tax')}</td>
                                                <td className="text-right p-2 font-mono">26,000,000</td>
                                                <td className="text-right p-2 font-mono">20,500,000</td>
                                            </tr>
                                            <tr className="border-b">
                                                <td className="p-2">{t('income_tax')} (15%)</td>
                                                <td className="text-right p-2 font-mono text-red-600">(3,900,000)</td>
                                                <td className="text-right p-2 font-mono text-red-600">(3,075,000)</td>
                                            </tr>
                                            <tr className="bg-emerald-100 border-b-2 font-bold">
                                                <td className="p-2">{t('net_profit')}</td>
                                                <td className="text-right p-2 font-mono">22,100,000</td>
                                                <td className="text-right p-2 font-mono">17,425,000</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-4 p-3 bg-emerald-50 rounded border border-emerald-200">
                                    <p className="text-sm font-medium text-emerald-900 mb-2">📊 {t('key_indicators')}</p>
                                    <div className="grid grid-cols-2 gap-2 text-sm text-emerald-800">
                                        <div>• {t('return_sales')}: 16.7%</div>
                                        <div>• {t('gross_margin')}: 40%</div>
                                        <div>• {t('net_margin')}: 14.7%</div>
                                        <div>• {t('revenue_growth')}: 25%</div>
                                    </div>
                                </div>

                                <div className="mt-4 flex gap-2">
                                    <Button onClick={() => downloadExample('profit_loss.xlsx')} className="gap-2">
                                        <Download className="h-4 w-4" />
                                        {t('download_example_pl')}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Cash Flow Examples */}
                    <TabsContent value="cash-flow" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('cash_flow_statement')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b-2 border-gray-300">
                                                <th className="text-left p-2">{t('item_name')}</th>
                                                <th className="text-right p-2">2024</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="bg-blue-100 font-semibold">
                                                <td colSpan={2} className="p-2">{t('cash_flow_operating')}</td>
                                            </tr>
                                            <tr className="border-b">
                                                <td className="p-2">{t('receipts_customers')}</td>
                                                <td className="text-right p-2 font-mono">145,000,000</td>
                                            </tr>
                                            <tr className="border-b">
                                                <td className="p-2">{t('payments_suppliers')}</td>
                                                <td className="text-right p-2 font-mono text-red-600">(85,000,000)</td>
                                            </tr>
                                            <tr className="border-b">
                                                <td className="p-2">{t('payments_wages')}</td>
                                                <td className="text-right p-2 font-mono text-red-600">(25,000,000)</td>
                                            </tr>
                                            <tr className="border-b">
                                                <td className="p-2">{t('tax_payments')}</td>
                                                <td className="text-right p-2 font-mono text-red-600">(15,000,000)</td>
                                            </tr>
                                            <tr className="bg-blue-50 border-b-2 font-semibold">
                                                <td className="p-2">{t('net_cash_operating')}</td>
                                                <td className="text-right p-2 font-mono">20,000,000</td>
                                            </tr>

                                            <tr className="bg-purple-100 font-semibold">
                                                <td colSpan={2} className="p-2">{t('cash_flow_investing')}</td>
                                            </tr>
                                            <tr className="border-b">
                                                <td className="p-2">{t('purchase_fixed_assets')}</td>
                                                <td className="text-right p-2 font-mono text-red-600">(8,000,000)</td>
                                            </tr>
                                            <tr className="border-b">
                                                <td className="p-2">{t('sale_fixed_assets')}</td>
                                                <td className="text-right p-2 font-mono">1,000,000</td>
                                            </tr>
                                            <tr className="bg-purple-50 border-b-2 font-semibold">
                                                <td className="p-2">{t('net_cash_investing')}</td>
                                                <td className="text-right p-2 font-mono text-red-600">(7,000,000)</td>
                                            </tr>

                                            <tr className="bg-emerald-100 font-semibold">
                                                <td colSpan={2} className="p-2">{t('cash_flow_financing')}</td>
                                            </tr>
                                            <tr className="border-b">
                                                <td className="p-2">{t('loans_received')}</td>
                                                <td className="text-right p-2 font-mono">10,000,000</td>
                                            </tr>
                                            <tr className="border-b">
                                                <td className="p-2">{t('loans_repaid')}</td>
                                                <td className="text-right p-2 font-mono text-red-600">(5,000,000)</td>
                                            </tr>
                                            <tr className="border-b">
                                                <td className="p-2">{t('dividends_paid')}</td>
                                                <td className="text-right p-2 font-mono text-red-600">(15,500,000)</td>
                                            </tr>
                                            <tr className="bg-emerald-50 border-b-2 font-semibold">
                                                <td className="p-2">{t('net_cash_financing')}</td>
                                                <td className="text-right p-2 font-mono text-red-600">(10,500,000)</td>
                                            </tr>

                                            <tr className="bg-gray-100 border-b-2 font-bold">
                                                <td className="p-2">{t('net_change_cash')}</td>
                                                <td className="text-right p-2 font-mono">2,500,000</td>
                                            </tr>
                                            <tr className="border-b">
                                                <td className="p-2">{t('cash_start_year')}</td>
                                                <td className="text-right p-2 font-mono">9,000,000</td>
                                            </tr>
                                            <tr className="bg-blue-100 border-b-2 font-bold">
                                                <td className="p-2">{t('cash_end_year')}</td>
                                                <td className="text-right p-2 font-mono">11,500,000</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-4 flex gap-2">
                                    <Button onClick={() => downloadExample('cash_flow.xlsx')} className="gap-2">
                                        <Download className="h-4 w-4" />
                                        {t('download_example_cash')}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Notes Examples */}
                    <TabsContent value="notes" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('notes_financial_statements')}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-4 bg-amber-50 rounded border border-amber-200">
                                    <h4 className="font-semibold text-amber-900 mb-2">{t('note_1_policy')}</h4>
                                    <p className="text-sm text-amber-800">
                                        {t('note_1_desc')}
                                    </p>
                                </div>

                                <div className="p-4 bg-blue-50 rounded border border-blue-200">
                                    <h4 className="font-semibold text-blue-900 mb-2">{t('note_2_fixed_assets')}</h4>
                                    <div className="overflow-x-auto mt-2">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b">
                                                    <th className="text-left p-2">{t('group_fa')}</th>
                                                    <th className="text-right p-2">{t('initial_cost')}</th>
                                                    <th className="text-right p-2">{t('depreciation')}</th>
                                                    <th className="text-right p-2">{t('residual_value')}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr className="border-b">
                                                    <td className="p-2">{t('buildings')}</td>
                                                    <td className="text-right p-2 font-mono">30,000,000</td>
                                                    <td className="text-right p-2 font-mono">(5,000,000)</td>
                                                    <td className="text-right p-2 font-mono">25,000,000</td>
                                                </tr>
                                                <tr className="border-b">
                                                    <td className="p-2">{t('equipment')}</td>
                                                    <td className="text-right p-2 font-mono">15,000,000</td>
                                                    <td className="text-right p-2 font-mono">(5,000,000)</td>
                                                    <td className="text-right p-2 font-mono">10,000,000</td>
                                                </tr>
                                                <tr className="bg-blue-50 font-semibold">
                                                    <td className="p-2">Итого</td>
                                                    <td className="text-right p-2 font-mono">45,000,000</td>
                                                    <td className="text-right p-2 font-mono">(10,000,000)</td>
                                                    <td className="text-right p-2 font-mono">35,000,000</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <Button onClick={() => downloadExample('notes_template.docx')} className="gap-2">
                                    <Download className="h-4 w-4" />
                                    {t('download_notes_template')}
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* For Auditors Section */}
            <div id="auditors" className="mt-12">
                <h2 className="text-3xl font-bold mb-6">🔍 {t('for_auditors')}</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Audit Program Example */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-emerald-600" />
                                {t('audit_program')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="p-3 bg-gray-50 rounded border">
                                    <h4 className="font-semibold text-sm mb-2">{t('audit_fa')}</h4>
                                    <ul className="text-xs space-y-1 text-gray-700">
                                        <li>☑ {t('check_inventory')}</li>
                                        <li>☑ {t('check_depreciation')}</li>
                                        <li>☑ {t('check_docs')}</li>
                                        <li>☐ {t('check_valuation')}</li>
                                    </ul>
                                </div>

                                <div className="p-3 bg-gray-50 rounded border">
                                    <h4 className="font-semibold text-sm mb-2">{t('audit_inventory')}</h4>
                                    <ul className="text-xs space-y-1 text-gray-700">
                                        <li>☑ {t('inventory_presence')}</li>
                                        <li>☑ {t('check_valuation')}</li>
                                        <li>☐ {t('check_reserve')}</li>
                                    </ul>
                                </div>

                                <div className="p-3 bg-gray-50 rounded border">
                                    <h4 className="font-semibold text-sm mb-2">{t('audit_receivables')}</h4>
                                    <ul className="text-xs space-y-1 text-gray-700">
                                        <li>☑ {t('confirmations_received')}</li>
                                        <li>☐ {t('reserve_checked')}</li>
                                        <li>☐ Реальность взыскания оценена</li>
                                    </ul>
                                </div>
                            </div>

                            <Button onClick={() => downloadExample('audit_program.xlsx')} className="gap-2 mt-4 w-full">
                                <Download className="h-4 w-4" />
                                {t('download_audit_program')}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Materiality Calculation */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calculator className="h-5 w-5 text-blue-600" />
                                {t('materiality_calc')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-gray-50 p-4 rounded">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left p-2">{t('item_name')}</th>
                                            <th className="text-right p-2">{t('value')}</th>
                                            <th className="text-center p-2">{t('percent')}</th>
                                            <th className="text-right p-2">{t('materiality')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-b">
                                            <td className="p-2">{t('revenue')}</td>
                                            <td className="text-right p-2 font-mono">500,000,000</td>
                                            <td className="text-center p-2">1%</td>
                                            <td className="text-right p-2 font-mono">5,000,000</td>
                                        </tr>
                                        <tr className="border-b">
                                            <td className="p-2">Активы</td>
                                            <td className="text-right p-2 font-mono">200,000,000</td>
                                            <td className="text-center p-2">2%</td>
                                            <td className="text-right p-2 font-mono">4,000,000</td>
                                        </tr>
                                        <tr className="border-b">
                                            <td className="p-2">{t('profit')}</td>
                                            <td className="text-right p-2 font-mono">30,000,000</td>
                                            <td className="text-center p-2">5%</td>
                                            <td className="text-right p-2 font-mono bg-yellow-100">1,500,000</td>
                                        </tr>
                                    </tbody>
                                </table>

                                <div className="mt-4 p-3 bg-emerald-50 rounded border border-emerald-200">
                                    <p className="text-sm font-semibold text-emerald-900">{t('selected_materiality')}</p>
                                    <p className="text-2xl font-bold text-emerald-700 mt-1">1,500,000 сум</p>
                                    <p className="text-xs text-emerald-600 mt-1">{t('lowest_value')}</p>
                                </div>

                                <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                                    <p className="text-sm font-semibold text-blue-900">{t('technical_level')}</p>
                                    <p className="text-xl font-bold text-blue-700">1,050,000 сум</p>
                                </div>
                            </div>

                            <Button onClick={() => downloadExample('materiality_calc.xlsx')} className="gap-2 mt-4 w-full">
                                <Download className="h-4 w-4" />
                                {t('download_calculator')}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Working Papers Example */}
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle>{t('working_paper_sample')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-gray-50 p-4 rounded border">
                                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                                    <div>
                                        <p><strong>{t('client')}:</strong> ООО "Торговая компания"</p>
                                        <p><strong>Период:</strong> 2024 год</p>
                                    </div>
                                    <div>
                                        <p><strong>{t('auditor_name')}:</strong> Иванов И.И.</p>
                                        <p><strong>{t('date')}:</strong> 15.03.2025</p>
                                    </div>
                                </div>

                                <h4 className="font-semibold mb-2">{t('test_control_revenue')}</h4>
                                <div className="bg-white p-3 rounded">
                                    <p className="text-sm mb-2"><strong>{t('objective')}</strong></p>
                                    <p className="text-sm mb-2"><strong>{t('sample_size')}</strong></p>
                                    <p className="text-sm mb-2"><strong>{t('result')}</strong></p>
                                    <ul className="text-sm space-y-1 ml-5 list-disc">
                                        <li>28 операций соответствуют требованиям (93%)</li>
                                        <li>2 исключения - отсутствие подписи на накладной</li>
                                    </ul>
                                    <p className="text-sm mt-2"><strong>{t('conclusion')}</strong></p>
                                </div>
                            </div>

                            <div className="mt-4 flex gap-2">
                                <Button onClick={() => downloadExample('working_paper_template.xlsx')} className="gap-2">
                                    <Download className="h-4 w-4" />
                                    {t('download_wp_template')}
                                </Button>
                                <Button variant="outline" className="gap-2" onClick={downloadAllWPTemplates}>
                                    <FileText className="h-4 w-4" />
                                    {t('all_wp_templates')}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* View Formulas Section */}
            <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl font-bold mb-2">📐 {t('view_formulas')}</h3>
                            <p className="text-purple-100">Learn the calculations behind financial statements</p>
                        </div>
                        <Button
                            onClick={() => setShowFormulas(!showFormulas)}
                            className="bg-white text-purple-600 hover:bg-purple-50 gap-2"
                        >
                            <Eye className="h-4 w-4" />
                            {showFormulas ? 'Hide Formulas' : t('view_formulas')}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Formulas Modal/Panel */}
            {showFormulas && (
                <Card className="border-2 border-purple-200">
                    <CardHeader className="bg-purple-50">
                        <CardTitle className="flex items-center gap-2">
                            <Calculator className="h-5 w-5 text-purple-600" />
                            Financial Statement Formulas & Calculations
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        {/* Balance Sheet Formulas */}
                        <div>
                            <h3 className="text-lg font-semibold mb-3 text-purple-900">📊 Balance Sheet (Бухгалтерский баланс)</h3>
                            <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                                <div className="border-l-4 border-blue-500 pl-4">
                                    <p className="font-mono text-sm font-semibold text-blue-900">Assets = Liabilities + Equity</p>
                                    <p className="text-sm text-gray-600 mt-1">Активы = Обязательства + Капитал</p>
                                </div>
                                <div className="border-l-4 border-emerald-500 pl-4">
                                    <p className="font-mono text-sm font-semibold text-emerald-900">Total Assets = Non-Current Assets + Current Assets</p>
                                    <p className="text-sm text-gray-600 mt-1">Line 300 = Line 100 + Line 200</p>
                                </div>
                                <div className="border-l-4 border-amber-500 pl-4">
                                    <p className="font-mono text-sm font-semibold text-amber-900">Total Liabilities = Equity + Long-term + Short-term</p>
                                    <p className="text-sm text-gray-600 mt-1">Line 700 = Line 400 + Line 500 + Line 600</p>
                                </div>
                            </div>
                        </div>

                        {/* P&L Formulas */}
                        <div>
                            <h3 className="text-lg font-semibold mb-3 text-purple-900">💰 Profit & Loss (Отчет о прибылях и убытках)</h3>
                            <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                                <div className="border-l-4 border-blue-500 pl-4">
                                    <p className="font-mono text-sm font-semibold text-blue-900">Gross Profit = Revenue - Cost of Sales</p>
                                    <p className="text-sm text-gray-600 mt-1">Валовая прибыль = Выручка - Себестоимость</p>
                                </div>
                                <div className="border-l-4 border-emerald-500 pl-4">
                                    <p className="font-mono text-sm font-semibold text-emerald-900">Operating Profit = Gross Profit - Operating Expenses</p>
                                    <p className="text-sm text-gray-600 mt-1">Операционная прибыль = Валовая прибыль - Операционные расходы</p>
                                </div>
                                <div className="border-l-4 border-amber-500 pl-4">
                                    <p className="font-mono text-sm font-semibold text-amber-900">Net Profit = Profit Before Tax - Income Tax</p>
                                    <p className="text-sm text-gray-600 mt-1">Чистая прибыль = Прибыль до налога - Налог на прибыль</p>
                                </div>
                                <div className="border-l-4 border-purple-500 pl-4">
                                    <p className="font-mono text-sm font-semibold text-purple-900">Income Tax = Profit Before Tax × Tax Rate (15%)</p>
                                    <p className="text-sm text-gray-600 mt-1">Налог на прибыль = Прибыль до налога × 15%</p>
                                </div>
                            </div>
                        </div>

                        {/* Cash Flow Formulas */}
                        <div>
                            <h3 className="text-lg font-semibold mb-3 text-purple-900">💵 Cash Flow (Отчет о движении денежных средств)</h3>
                            <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                                <div className="border-l-4 border-blue-500 pl-4">
                                    <p className="font-mono text-sm font-semibold text-blue-900">Net Cash from Operating = Receipts - Payments</p>
                                    <p className="text-sm text-gray-600 mt-1">Денежный поток от операций = Поступления - Платежи</p>
                                </div>
                                <div className="border-l-4 border-emerald-500 pl-4">
                                    <p className="font-mono text-sm font-semibold text-emerald-900">Net Change in Cash = Operating + Investing + Financing</p>
                                    <p className="text-sm text-gray-600 mt-1">Изменение денежных средств = Операционная + Инвестиционная + Финансовая</p>
                                </div>
                                <div className="border-l-4 border-amber-500 pl-4">
                                    <p className="font-mono text-sm font-semibold text-amber-900">Cash End of Year = Cash Start + Net Change</p>
                                    <p className="text-sm text-gray-600 mt-1">Денежные средства на конец = Начало + Изменение</p>
                                </div>
                            </div>
                        </div>

                        {/* Financial Ratios */}
                        <div>
                            <h3 className="text-lg font-semibold mb-3 text-purple-900">📈 Key Financial Ratios (Ключевые показатели)</h3>
                            <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                                <div className="border-l-4 border-blue-500 pl-4">
                                    <p className="font-mono text-sm font-semibold text-blue-900">ROA (Return on Assets) = Net Profit / Total Assets × 100%</p>
                                    <p className="text-sm text-gray-600 mt-1">Рентабельность активов</p>
                                </div>
                                <div className="border-l-4 border-emerald-500 pl-4">
                                    <p className="font-mono text-sm font-semibold text-emerald-900">ROE (Return on Equity) = Net Profit / Equity × 100%</p>
                                    <p className="text-sm text-gray-600 mt-1">Рентабельность капитала</p>
                                </div>
                                <div className="border-l-4 border-amber-500 pl-4">
                                    <p className="font-mono text-sm font-semibold text-amber-900">Current Ratio = Current Assets / Current Liabilities</p>
                                    <p className="text-sm text-gray-600 mt-1">Коэффициент текущей ликвидности</p>
                                </div>
                                <div className="border-l-4 border-purple-500 pl-4">
                                    <p className="font-mono text-sm font-semibold text-purple-900">Gross Margin = Gross Profit / Revenue × 100%</p>
                                    <p className="text-sm text-gray-600 mt-1">Валовая маржа</p>
                                </div>
                                <div className="border-l-4 border-pink-500 pl-4">
                                    <p className="font-mono text-sm font-semibold text-pink-900">Net Margin = Net Profit / Revenue × 100%</p>
                                    <p className="text-sm text-gray-600 mt-1">Чистая маржа</p>
                                </div>
                            </div>
                        </div>

                        {/* Audit Materiality */}
                        <div>
                            <h3 className="text-lg font-semibold mb-3 text-purple-900">🔍 Audit Materiality (Существенность в аудите)</h3>
                            <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                                <div className="border-l-4 border-blue-500 pl-4">
                                    <p className="font-mono text-sm font-semibold text-blue-900">Overall Materiality = 0.5-1% of Revenue or 5% of Profit Before Tax</p>
                                    <p className="text-sm text-gray-600 mt-1">Общая существенность = 0.5-1% от выручки или 5% от прибыли до налога</p>
                                </div>
                                <div className="border-l-4 border-emerald-500 pl-4">
                                    <p className="font-mono text-sm font-semibold text-emerald-900">Performance Materiality = Overall Materiality × 75%</p>
                                    <p className="text-sm text-gray-600 mt-1">Рабочая существенность = Общая существенность × 75%</p>
                                </div>
                                <div className="border-l-4 border-amber-500 pl-4">
                                    <p className="font-mono text-sm font-semibold text-amber-900">Trivial Threshold = Overall Materiality × 5%</p>
                                    <p className="text-sm text-gray-600 mt-1">Порог явной незначительности = Общая существенность × 5%</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Download All Section */}
            <Card className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl font-bold mb-2">{t('download_all_examples')}</h3>
                            <p className="text-blue-100">{t('full_package_desc')}</p>
                        </div>
                        <Button
                            onClick={downloadAllExamples}
                            className="bg-white text-blue-600 hover:bg-blue-50 gap-2"
                        >
                            <Download className="h-4 w-4" />
                            {t('download_zip')}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
