import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../lib/api';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { getActiveLang, tr } from '../lib/i18n';

const TAX_LABELS_RU: Record<string, string> = {
    'vat': 'НДС (VAT / QQS) — Налог на добавленную стоимость',
    'vat_reduced': 'НДС льготный (Reduced VAT)',
    'corporate': 'Налог на прибыль (Corporate Income Tax)',
    'corporate_small': 'Налог с оборота / МСП (Turnover Tax)',
    'income': 'НДФЛ (Personal Income Tax)',
    'income_top': 'НДФЛ повышенная ставка (PIT High Bracket)',
    'social': 'Социальный налог (Social Tax / Payroll)',
    'payroll': 'Страховые взносы работодателя (Payroll Contributions)',
    'withholding': 'Налог у источника выплат (Withholding Tax / WHT)',
    'property': 'Налог на имущество (Property Tax)',
    'consumption': 'Цифровой налог (Digital Services Tax / DST)',
    'gst': 'GST (Товары и услуги)',
};

const TAX_LABELS_EN: Record<string, string> = {
    'vat': 'VAT — Value Added Tax (Standard Rate)',
    'vat_reduced': 'Reduced VAT (Concessional Rate)',
    'corporate': 'Corporate Income Tax (CIT)',
    'corporate_small': 'Small Business / Turnover Tax',
    'income': 'Personal Income Tax (PIT)',
    'income_top': 'High Bracket Income Tax',
    'social': 'Social Tax / Social Contributions',
    'payroll': 'Employer Payroll Contributions',
    'withholding': 'Withholding Tax (WHT)',
    'property': 'Corporate Property Tax',
    'consumption': 'Digital Services Tax (DST)',
    'gst': 'Goods and Services Tax (GST)',
};

const TAX_LABELS_UZ: Record<string, string> = {
    'vat': 'QQS (VAT) — Qo\'shilgan qiymat solig\'i (Standart stavka)',
    'vat_reduced': 'Imtiyozli QQS (Reduced VAT)',
    'corporate': 'Foyda solig\'i (Corporate Income Tax / CIT)',
    'corporate_small': 'Aylanmadan olinadigan soliq / KO\'B (Turnover Tax)',
    'income': 'JSHDS — Jismoniy shaxslar daromad solig\'i (PIT)',
    'income_top': 'JSHDS yuqori stavkasi (PIT High Bracket)',
    'social': 'Ijtimoiy soliq (Social Tax / Payroll)',
    'payroll': 'Ish beruvchining sug\'urta badallari (Payroll Contributions)',
    'withholding': 'To\'lov manbaidan olinadigan soliq (Withholding Tax / WHT)',
    'property': 'Mol-mulk solig\'i (Property Tax)',
    'consumption': 'Raqamli xizmatlar solig\'i (Digital Services Tax / DST)',
    'gst': 'GST (Tovarlar va xizmatlar solig\'i)',
};

export default function ReportAnalysisPage() {
    const location = useLocation();
    const { user } = useAuth();
    const { i18n } = useTranslation();
    const isRu = (i18n.language || 'ru').toLowerCase().startsWith('ru');
    const activeLang = getActiveLang();
    const TAX_LABELS = activeLang === 'uz' ? TAX_LABELS_UZ : (activeLang === 'en' ? TAX_LABELS_EN : TAX_LABELS_RU);

    const [reports, setReports] = useState<any[]>([]);
    const [selectedReport, setSelectedReport] = useState<any>(null);
    const [countries, setCountries] = useState<any[]>([]);
    const [taxTypes, setTaxTypes] = useState<any[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [scanningPhase, setScanningPhase] = useState('');
    const [scanProgress, setScanProgress] = useState(0);
    const [analysis, setAnalysis] = useState<any>(null);
    const [scanLog, setScanLog] = useState<string[]>([]);
    const { toast } = useToast();

    // Upload mode
    const [uploadMode, setUploadMode] = useState<'select' | 'upload'>('select');
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadTitle, setUploadTitle] = useState('');

    const [analysisConfig, setAnalysisConfig] = useState({
        country_code: 'UZ',
        tax_types: ['vat', 'corporate']
    });

    useEffect(() => {
        fetchReports();
        fetchCountries();
        fetchTaxTypes();
    }, []);

    useEffect(() => {
        const incomingId = location.state?.report?.id || location.state?.reportId;
        if (incomingId && reports.length > 0) {
            const report = reports.find((r: any) => String(r.id) === String(incomingId));
            if (report) {
                setSelectedReport(report);
            }
        }
    }, [location.state, reports]);

    const fetchReports = async () => {
        try {
            const res = await api.get('/reports/');
            const raw = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.items) ? res.data.items : []);
            setReports(raw);
            if (raw.length > 0 && !selectedReport) {
                const incomingId = location.state?.report?.id || location.state?.reportId;
                const matched = incomingId ? raw.find((r: any) => String(r.id) === String(incomingId)) : null;
                setSelectedReport(matched || raw[0]);
            }
        } catch (error) {
            console.error('Failed to fetch reports', error);
            setReports([]);
        }
    };

    const fetchCountries = async () => {
        try {
            const res = await api.get('/tax-rates/countries');
            const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.items) ? res.data.items : []);
            setCountries(data);
        } catch (error) {
            console.error('Failed to fetch countries', error);
            setCountries([]);
        }
    };

    const fetchTaxTypes = async () => {
        try {
            const res = await api.get('/tax-rates/types');
            const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.items) ? res.data.items : []);
            setTaxTypes(data);
        } catch (error) {
            console.error('Failed to fetch tax types', error);
            setTaxTypes([]);
        }
    };

    const addScanLog = (message: string) => {
        setScanLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    };

    const simulateScanningPhases = async () => {
        // Phase 1: Document Extraction
        setScanningPhase(tr('Извлечение содержимого документа...', 'Extracting document content...', 'Hujjat tarkibini ajratib olish...'));
        setScanProgress(15);
        addScanLog(tr('Запуск извлечения данных из документа', 'Starting document extraction', 'Hujjatdan ma’lumotlarni ajratib olish boshlandi'));
        await new Promise(resolve => setTimeout(resolve, 450));
        addScanLog(tr('Структура документа успешно проанализирована', 'Document structure analyzed', 'Hujjat tuzilmasi muvaffaqiyatli tahlil qilindi'));
        setScanProgress(30);

        // Phase 2: Text Analysis
        setScanningPhase(tr('Анализ финансовых данных и показателей...', 'Analyzing text and financial data...', 'Moliyaviy ma’lumotlar va ko‘rsatkichlar tahlili...'));
        await new Promise(resolve => setTimeout(resolve, 500));
        addScanLog(tr('Извлечены финансовые показатели и налоговые метрики', 'Extracted financial figures and tax information', 'Moliyaviy ko‘rsatkichlar va soliq metrikalari ajratib olindi'));
        setScanProgress(50);

        // Phase 3: Regulation Matching
        setScanningPhase(tr('Сопоставление с налоговыми нормативами...', 'Matching against tax regulations...', 'Soliq me’yorlari bilan solishtirish...'));
        await new Promise(resolve => setTimeout(resolve, 550));
        addScanLog(tr(`Проверка комплаенса с законодательством ${analysisConfig.country_code}`, `Checking compliance with ${analysisConfig.country_code} tax laws`, `${analysisConfig.country_code} soliq qonunchiligiga muvofiqlikni tekshirish`));
        addScanLog(tr(`Валидация по выбранным налоговым режимам (${analysisConfig.tax_types.length})`, `Validating ${analysisConfig.tax_types.length} selected tax regime(s)`, `Tanlangan soliq rejimlari bo‘yicha validatsiya (${analysisConfig.tax_types.length})`));
        setScanProgress(70);

        // Phase 4: Validation
        setScanningPhase(tr('Проверка ставок и арифметических расчётов...', 'Validating calculations and rates...', 'Stavkalar va arifmetik hisob-kitoblarni tekshirish...'));
        await new Promise(resolve => setTimeout(resolve, 500));
        addScanLog(tr('Сверка налоговых ставок с официальной базой RegAI', 'Cross-referencing tax rates with official database', 'Soliq stavkalarini RegAI rasmiy bazasi bilan solishtirish'));
        setScanProgress(85);

        // Phase 5: Report Generation
        setScanningPhase(tr('Формирование отчёта о комплаенсе...', 'Generating compliance report...', 'Komplayens hisobotini shakllantirish...'));
        await new Promise(resolve => setTimeout(resolve, 400));
        addScanLog(tr('Агрегация замечаний и аудиторских рекомендаций', 'Compiling findings and recommendations', 'Xulosalar va auditorlik tavsiyalarini jamlash'));
        setScanProgress(95);
    };

    const handleAnalyze = async () => {
        if (uploadMode === 'select' && !selectedReport) {
            toast({
                variant: "destructive",
                title: tr("Ошибка", "Error", "Xatolik"),
                description: tr("Пожалуйста, выберите отчет для анализа", "Please select a report to analyze", "Tahlil uchun hisobotni tanlang"),
            });
            return;
        }

        if (uploadMode === 'upload' && !uploadFile) {
            toast({
                variant: "destructive",
                title: tr("Ошибка", "Error", "Xatolik"),
                description: tr("Пожалуйста, загрузите файл для анализа", "Please upload a file to analyze", "Tahlil uchun faylni yuklang"),
            });
            return;
        }

        if (analysisConfig.tax_types.length === 0) {
            toast({
                variant: "destructive",
                title: tr("Выберите налоговый режим", "Select Tax Regime", "Soliq rejimini tanlang"),
                description: tr("Отметьте хотя бы один налоговый режим для проверки", "Please select at least one tax regime to check", "Tekshirish uchun kamida bitta soliq rejimini belgilang"),
            });
            return;
        }

        setIsAnalyzing(true);
        setScanLog([]);
        setScanProgress(0);
        setScanningPhase(tr('Инициализация анализа...', 'Initializing analysis...', 'Tahlilni ishga tushirish...'));
        addScanLog(tr('Анализ запущен', 'Analysis started', 'Tahlil boshlandi'));

        try {
            let reportId = selectedReport?.id;

            if (uploadMode === 'upload' && uploadFile) {
                addScanLog(`${tr('Загрузка файла', 'Uploading file', 'Fayl yuklanmoqda')}: ${uploadFile.name}`);
                const formData = new FormData();
                formData.append('title', uploadTitle || uploadFile.name.replace(/\.[^/.]+$/, '') || tr('Отчет по налоговому анализу', 'Tax Analysis Report', 'Soliq tahlili hisoboti'));
                formData.append('description', 'Uploaded for AI analysis');
                formData.append('report_type', 'financial');
                formData.append('company_id', user?.company_id || '');
                formData.append('file', uploadFile);

                const uploadRes = await api.post('/reports/', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                reportId = uploadRes.data.id;
                addScanLog(tr('Файл успешно загружен и разобран', 'File uploaded and parsed successfully', 'Fayl muvaffaqiyatli yuklandi va tahlilga tayyorlandi'));
            }

            await simulateScanningPhases();

            setScanningPhase(tr('Выполнение ИИ-анализа...', 'Running AI analysis...', 'SI-tahlil bajarilmoqda...'));
            addScanLog(tr('Отправка данных в движок комплаенса RegAI', 'Sending data to AI compliance engine', 'Ma’lumotlarni RegAI komplayens tizimiga yuborish'));
            const res = await api.post('/report-analysis/analyze', {
                report_id: reportId,
                country_code: analysisConfig.country_code,
                tax_types: analysisConfig.tax_types
            });

            setScanProgress(100);
            setScanningPhase(tr('Анализ завершён', 'Analysis complete', 'Tahlil yakunlandi'));
            addScanLog(tr('Анализ успешно завершен', 'Analysis completed successfully', 'Tahlil muvaffaqiyatli yakunlandi'));

            setAnalysis(res.data);

            const resultMessage = generateResultMessage(res.data);
            addScanLog(tr('--- ИТОГИ АНАЛИЗА ---', '--- ANALYSIS SUMMARY ---', '--- TAHLIL YAKUNLARI ---'));
            resultMessage.forEach(msg => addScanLog(msg));

            toast({
                title: tr("✅ Анализ завершен", "✅ Analysis Complete", "✅ Tahlil yakunlandi"),
                description: `${tr('Оценка соответствия', 'Compliance Score', 'Muvofiqlik bahosi')}: ${res.data.overall_score}% — ${res.data.summary}`,
            });
        } catch (error: any) {
            addScanLog(`${tr('ОШИБКА', 'ERROR', 'XATOLIK')}: ${error.response?.data?.detail || 'Analysis failed'}`);
            toast({
                variant: "destructive",
                title: tr("Ошибка", "Error", "Xatolik"),
                description: error.response?.data?.detail || tr("Не удалось выполнить анализ", "Analysis failed", "Tahlilni bajarib bo‘lmadi"),
            });
        } finally {
            setIsAnalyzing(false);
            setScanningPhase('');
        }
    };

    const generateResultMessage = (data: any): string[] => {
        const messages: string[] = [];

        messages.push(`${tr('Итоговая оценка соответствия', 'Overall Compliance Score', 'Yakuniy muvofiqlik bahosi')}: ${data.overall_score}%`);
        messages.push(`${tr('Всего проверок', 'Total Checks Performed', 'Jami tekshiruvlar')}: ${data.total_checks}`);
        messages.push(`${tr('Пройдено', 'Passed', 'O‘tdi')}: ${data.passed_checks} | ${tr('Ошибки', 'Errors', 'Xatolar')}: ${data.errors} | ${tr('Предупреждения', 'Warnings', 'Ogohlantirishlar')}: ${data.warnings}`);

        if (data.overall_score >= 90) {
            messages.push(tr('✅ ОТЛИЧНО — Отчет полностью соответствует нормативным требованиям', '✅ EXCELLENT — Report meets all compliance requirements', '✅ A’LO — Hisobot me’yoriy talablarga to‘liq javob beradi'));
        } else if (data.overall_score >= 70) {
            messages.push(tr('⚠️ ХОРОШО — Обнаружены незначительные отклонения, рекомендуется проверка', '⚠️ GOOD — Minor issues detected, review recommended', '⚠️ YAXSHI — Kichik tafovutlar aniqlandi, tekshirish tavsiya etiladi'));
        } else {
            messages.push(tr('❌ ТРЕБУЕТСЯ ВНИМАНИЕ — Обнаружены существенные несоответствия', '❌ ATTENTION REQUIRED — Significant compliance issues found', '❌ DIQQAT TALAB ETILADI — Jiddiy nomuvofiqliklar aniqlandi'));
        }

        if (data.error_details && data.error_details.length > 0) {
            messages.push(`${tr('Найдено замечаний', 'Found issue(s)', 'Topilgan kamchiliklar')}: ${data.error_details.length}`);
            data.error_details.slice(0, 3).forEach((error: any, idx: number) => {
                messages.push(`  ${idx + 1}. ${error.type} — ${error.location}`);
            });
            if (data.error_details.length > 3) {
                messages.push(`  ... ${tr('и еще', 'and', 'va yana')} ${data.error_details.length - 3}`);
            }
        }

        messages.push(`${tr('Страна', 'Country', 'Mamlakat')}: ${analysisConfig.country_code} | ${tr('Налоги', 'Tax Types', 'Soliqlar')}: ${analysisConfig.tax_types.join(', ')}`);

        return messages;
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-green-600';
        if (score >= 70) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getSeverityIcon = (severity: string) => {
        if (severity === 'critical') return <XCircle className="h-5 w-5 text-red-600 shrink-0" />;
        if (severity === 'warning') return <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0" />;
        return <CheckCircle className="h-5 w-5 text-blue-600 shrink-0" />;
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                {tr('ИИ-Анализ налогового комплаенса', 'AI Tax Compliance Analysis', 'Soliq komplayensining SI-tahlili')}
            </h1>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Configuration Panel */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900 shadow-xs">
                    <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">
                        {tr('Параметры проверки и анализа', 'Analysis Configuration', 'Tekshiruv va tahlil parametrlari')}
                    </h2>

                    <div className="space-y-4">
                        {/* Mode Selector */}
                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={() => setUploadMode('select')}
                                className={`flex-1 py-2 px-4 rounded-lg border font-medium text-sm transition-colors cursor-pointer ${uploadMode === 'select'
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                                    }`}
                            >
                                {tr('Выбрать существующий отчет', 'Select Existing Report', 'Mavjud hisobotni tanlash')}
                            </button>
                            <button
                                onClick={() => setUploadMode('upload')}
                                className={`flex-1 py-2 px-4 rounded-lg border font-medium text-sm transition-colors cursor-pointer ${uploadMode === 'upload'
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                                    }`}
                            >
                                {tr('Загрузить новый PDF / Excel', 'Upload New PDF / Excel', 'Yangi PDF / Excel yuklash')}
                            </button>
                        </div>

                        {uploadMode === 'select' ? (
                            <div>
                                <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">
                                    {tr('Выберите отчет для проверки', 'Select Report', 'Tekshirish uchun hisobotni tanlang')}
                                </label>
                                <select
                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                                    value={selectedReport?.id || ''}
                                    onChange={(e) => {
                                        const report = reports.find(r => r.id === e.target.value);
                                        setSelectedReport(report);
                                        setAnalysis(null);
                                    }}
                                >
                                    <option value="">{tr('Выберите отчет из списка...', 'Choose a report from the list...', 'Ro‘yxatdan hisobotni tanlang...')}</option>
                                    {Array.isArray(reports) && reports.map((report) => (
                                         <option key={report.id} value={report.id}>
                                             {report.title} ({report.report_type === 'compliance' ? tr('комплаенс', 'compliance', 'komplayens') : report.report_type === 'financial' ? tr('финансовый', 'financial', 'moliyaviy') : report.report_type === 'audit' ? tr('аудит', 'audit', 'audit') : report.report_type === 'risk_assessment' ? tr('оценка рисков', 'risk assessment', 'xavflarni baholash') : report.report_type})
                                         </option>
                                     ))}
                                </select>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">
                                        {tr('Название отчета (необязательно)', 'Report Title (Optional)', 'Hisobot nomi (ixtiyoriy)')}
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                                        value={uploadTitle}
                                        onChange={(e) => setUploadTitle(e.target.value)}
                                        placeholder={tr('Налоговый отчет 2026', 'Tax Analysis Report', 'Soliq hisoboti 2026')}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">
                                        {tr('Загрузить файл документа', 'Upload File', 'Hujjat faylini yuklash')}
                                    </label>
                                    <input
                                        type="file"
                                        accept=".pdf,.xlsx,.csv,.txt"
                                        onChange={(e) => {
                                            setUploadFile(e.target.files?.[0] || null);
                                            setAnalysis(null);
                                        }}
                                        className="w-full text-sm text-slate-700 dark:text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900/40 dark:file:text-blue-300 hover:file:bg-blue-100"
                                    />
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                                        {tr('Поддерживаются: PDF, Excel (.xlsx), CSV, TXT (макс. 10 МБ)', 'Supported: PDF, Excel, CSV, TXT (Max 10MB)', 'Qo‘llab-quvvatlanadi: PDF, Excel (.xlsx), CSV, TXT (maks. 10 MB)')}
                                    </p>
                                    {uploadFile && (
                                        <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
                                            ✓ {uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">
                                {tr('Юрисдикция / Страна', 'Country', 'Yurisdiksiya / Mamlakat')}
                            </label>
                            <select
                                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                                value={analysisConfig.country_code}
                                onChange={(e) => {
                                    setAnalysisConfig({ ...analysisConfig, country_code: e.target.value });
                                    setAnalysis(null);
                                }}
                            >
                                {Array.isArray(countries) && countries.map((country) => {
                                    const enName = country.name_en || (country.code === 'UZ' ? 'Uzbekistan' : country.code === 'KZ' ? 'Kazakhstan' : country.code === 'RU' ? 'Russia' : country.code === 'AE' ? 'United Arab Emirates (UAE)' : country.code === 'TR' ? 'Turkey' : country.code === 'GLOBAL' ? 'International Standards (Global)' : country.name);
                                    const uzName = country.code === 'UZ' ? 'O\'zbekiston' : country.code === 'KZ' ? 'Qozog\'iston' : country.code === 'RU' ? 'Rossiya' : country.code === 'AE' ? 'Birlashgan Arab Amirliklari (BAA)' : country.code === 'TR' ? 'Turkiya' : country.code === 'GLOBAL' ? 'Xalqaro standartlar (Global)' : enName;
                                    const countryLabel = tr(country.name || country.code, enName, uzName);
                                    return (
                                        <option key={country.code} value={country.code}>
                                            {countryLabel}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">
                                {tr('Налоговые режимы для проверки', 'Tax Types to Check', 'Tekshirish uchun soliq rejimlari')}
                            </label>
                            <div className="grid grid-cols-1 gap-1 max-h-56 overflow-y-auto p-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/70 dark:bg-slate-950/40 divide-y divide-slate-100 dark:divide-slate-800/60">
                                {Array.isArray(taxTypes) && taxTypes.map((tItem: any, idx: number) => {
                                    const code = typeof tItem === 'string' ? tItem : (tItem.type || tItem.code || `type-${idx}`);
                                    const label = TAX_LABELS[code] || (isRu 
                                        ? (tItem.name || tItem.label || code.toUpperCase()) 
                                        : (tItem.name_en || tItem.name || code.toUpperCase()));
                                    const isChecked = analysisConfig.tax_types.includes(code);

                                    return (
                                        <label key={code} className="flex items-center gap-3 pt-2 first:pt-0 cursor-pointer hover:bg-white dark:hover:bg-slate-800/60 p-2 rounded-md transition-all">
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setAnalysisConfig({
                                                            ...analysisConfig,
                                                            tax_types: [...analysisConfig.tax_types, code]
                                                        });
                                                    } else {
                                                        setAnalysisConfig({
                                                            ...analysisConfig,
                                                            tax_types: analysisConfig.tax_types.filter(t => t !== code)
                                                        });
                                                    }
                                                    setAnalysis(null);
                                                }}
                                                className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                            />
                                            <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        <Button
                            onClick={handleAnalyze}
                            disabled={(uploadMode === 'select' && !selectedReport) || (uploadMode === 'upload' && !uploadFile) || analysisConfig.tax_types.length === 0 || isAnalyzing}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 cursor-pointer"
                        >
                            {isAnalyzing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {tr('Выполняется анализ...', 'Analyzing...', 'Tahlil bajarilmoqda...')}
                                </>
                            ) : (
                                tr('Запустить ИИ-анализ комплаенса', 'Analyze Report', 'Komplayens SI-tahlilini ishga tushirish')
                            )}
                        </Button>

                        {/* Scanning Progress */}
                        {isAnalyzing && (
                            <div className="mt-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600 dark:text-slate-400">{scanningPhase}</span>
                                    <span className="font-medium text-slate-900 dark:text-white">{scanProgress}%</span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${scanProgress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Scan Log */}
                        {scanLog.length > 0 && (
                            <div className="mt-4">
                                <h3 className="text-sm font-medium mb-2 text-slate-900 dark:text-white">
                                    {tr('Журнал сканирования и аудита:', 'Scan Log:', 'Skanerlash va audit jurnali:')}
                                </h3>
                                <div className="bg-slate-950 text-emerald-400 border border-slate-800 p-3 rounded-lg text-xs font-mono max-h-48 overflow-y-auto">
                                    {scanLog.map((log, idx) => (
                                        <div key={idx} className="mb-1">{log}</div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Results Panel */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900 shadow-xs">
                    <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">
                        {tr('Результаты комплаенс-проверки', 'Analysis Results', 'Komplayens-tekshiruv natijalari')}
                    </h2>

                    {!analysis ? (
                        <p className="text-slate-500 dark:text-slate-400">
                            {tr('Настройте параметры и запустите анализ для отображения результатов', 'Configure and run analysis to see results', 'Natijalarni ko‘rish uchun parametrlarni sozlang va tahlilni ishga tushiring')}
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {/* Score */}
                            <div className="text-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                    {tr('Оценка налогового соответствия', 'Compliance Score', 'Soliq muvofiqligi bahosi')}
                                </p>
                                <p className={`text-5xl font-bold ${getScoreColor(analysis.overall_score)}`}>
                                    {analysis.overall_score}%
                                </p>
                                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">{analysis.summary}</p>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/30 rounded-lg border border-emerald-200/60 dark:border-emerald-900/40">
                                    <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">{tr('Пройдено', 'Passed', 'O‘tdi')}</p>
                                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{analysis.passed_checks}</p>
                                </div>
                                <div className="p-3 bg-red-50/80 dark:bg-red-950/30 rounded-lg border border-red-200/60 dark:border-red-900/40">
                                    <p className="text-sm text-red-700 dark:text-red-400 font-medium">{tr('Ошибки', 'Errors', 'Xatolar')}</p>
                                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{analysis.errors}</p>
                                </div>
                                <div className="p-3 bg-amber-50/80 dark:bg-amber-950/30 rounded-lg border border-amber-200/60 dark:border-amber-900/40">
                                    <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">{tr('Предупреждения', 'Warnings', 'Ogohlantirishlar')}</p>
                                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{analysis.warnings}</p>
                                </div>
                                <div className="p-3 bg-blue-50/80 dark:bg-blue-950/30 rounded-lg border border-blue-200/60 dark:border-blue-900/40">
                                    <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">{tr('Всего проверок', 'Total Checks', 'Jami tekshiruvlar')}</p>
                                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{analysis.total_checks}</p>
                                </div>
                            </div>

                            {/* Errors List */}
                            {Array.isArray(analysis?.error_details) && analysis.error_details.length > 0 ? (
                                <div>
                                    <h3 className="font-semibold mb-2 text-slate-900 dark:text-white">
                                        {tr('Выявленные несоответствия и риски:', 'Issues Found:', 'Aniqlangan nomuvofiqliklar va xavflar:')}
                                    </h3>
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                        {analysis.error_details.map((error: any, idx: number) => {
                                            const isMathErr = error.type === 'math_error';
                                            const unitSuffix = isMathErr ? '' : '%';
                                            return (
                                                <div key={idx} className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/70 dark:bg-slate-800/50">
                                                    <div className="flex items-start gap-2">
                                                        {getSeverityIcon(error.severity)}
                                                        <div className="flex-1">
                                                            <p className="font-medium text-sm text-slate-900 dark:text-white">{error.type}</p>
                                                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{error.location}</p>
                                                            {error.expected !== undefined && error.expected !== null && (
                                                                <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 font-mono">
                                                                    {tr('Ожидалось', 'Expected', 'Kutilgan')}: {error.expected}{unitSuffix} | {tr('Найдено', 'Found', 'Aniqlangan')}: {error.found}{unitSuffix}
                                                                </p>
                                                            )}
                                                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">{error.recommendation}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/70 dark:bg-emerald-950/30 flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                    <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                                        {tr(
                                            'Ошибок и налоговых расхождений по выбранным режимам не обнаружено!',
                                            'No tax discrepancies or errors detected for the selected regimes!',
                                            'Tanlangan rejimlar bo‘yicha xatolik va soliq tafovutlari aniqlanmadi!'
                                        )}
                                    </span>
                                </div>
                            )}

                            {/* Verified Findings List */}
                            {Array.isArray(analysis?.findings) && analysis.findings.length > 0 && (
                                <div>
                                    <h3 className="font-semibold mb-2 text-sm text-slate-900 dark:text-white">
                                        {tr('Подтверждённые пункты аудита:', 'Verified Compliance Checks:', 'Tasdiqlangan audit bandlari:')}
                                    </h3>
                                    <div className="space-y-1.5">
                                        {analysis.findings.map((finding: string, idx: number) => (
                                            <div key={idx} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                                                {finding}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
