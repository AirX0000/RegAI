import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import api from '../../lib/api';
import {
    Check,
    ChevronRight,
    ChevronLeft,
    FileSpreadsheet,
    Server,
    Brain,
    Workflow,
    ShieldCheck,
    Scale,
    Sparkles,
    X,
    Layers,
    FileText
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { tr } from '../../lib/i18n';

interface TemplateWizardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (savedTemplate?: any) => void;
    initialTemplate?: any;
}

const getSteps = () => [
    { id: 1, title: tr('Область и стандарт', 'Scope & Standard', 'Soha va standart'), desc: tr('Область и регламенты', 'Scope & regulations', 'Qo\'llash sohasi va me\'yorlar'), icon: Scale },
    { id: 2, title: tr('Источник данных', 'Data Source', 'Ma\'lumot manbasi'), desc: tr('Источник данных (1С/Excel)', 'Data source (1C/Excel)', '1C yoki Excel fayl'), icon: Server },
    { id: 3, title: tr('Правила учета', 'Accounting Rules', 'Hisob qoidalari'), desc: tr('Правила МСФО и баланс', 'IFRS rules & balance', 'MHXS qoidalari va balans'), icon: Layers },
    { id: 4, title: tr('ИИ-директивы', 'AI Directives', 'AI ko\'rsatmalari'), desc: tr('Инструкции для ИИ-аудита', 'AI audit instructions', 'AI-audit yo\'riqnomasi'), icon: Brain },
    { id: 5, title: tr('Маршрут и сводка', 'Workflow & Review', 'Jarayon va yakun'), desc: tr('Маршрут и предпросмотр', 'Workflow & preview', 'Tasdiqlash zanjiri'), icon: Workflow },
];

const getAccountOptions = () => [
    { code: '01', name: tr('Основные средства (PPE)', 'Property, Plant & Equipment (PPE)', 'Asosiy vositalar (PPE)') },
    { code: '02', name: tr('Амортизация (Accum. Depr.)', 'Accumulated Depreciation', 'Jamg\'arilgan amortizatsiya') },
    { code: '10', name: tr('Сырье и материалы (Inventories)', 'Raw Materials & Inventories', 'Xomashyo va materiallar') },
    { code: '41', name: tr('Товары (Goods)', 'Merchandise / Goods', 'Tovarlar (Goods)') },
    { code: '51', name: tr('Расчетные счета (Cash & Bank)', 'Cash & Bank Accounts', 'Hisob-kitob schyotlari (Pul mablag\'lari)') },
    { code: '60', name: tr('Расчеты с поставщиками (Payables)', 'Trade Payables', 'Yetkazib beruvchilar bilan hisob-kitoblar') },
    { code: '62', name: tr('Расчеты с покупателями (Receivables)', 'Trade Receivables', 'Xaridorlar bilan hisob-kitoblar') },
    { code: '67', name: tr('Долгосрочные обязательства / Аренда', 'Long-Term Liabilities / Leases', 'Uzoq muddatli majburiyatlar / Ijara') },
    { code: '80', name: tr('Уставный капитал (Share Capital)', 'Share Capital', 'Ustav kapitali (Share Capital)') },
    { code: '84', name: tr('Нераспределенная прибыль (Retained Earnings)', 'Retained Earnings', 'Taqsimlanmagan foyda') },
];

const getStandardsList = () => [
    { id: 'IFRS 16', label: tr('IFRS 16 (Аренда)', 'IFRS 16 (Leases)', 'IFRS 16 (Ijara)'), desc: tr('Дисконтирование, капитализация ROU-актива и арендных обязательств (01/67)', 'Discounting, ROU asset capitalization & lease liabilities (01/67)', 'Diskontlash, ROU aktivini kapitallashtirish va ijara majburiyatlari (01/67)') },
    { id: 'IAS 36', label: tr('IAS 36 (Обесценение)', 'IAS 36 (Impairment)', 'IAS 36 (Qadrsizlanish)'), desc: tr('Тест на обесценение ОС/ИТ-оборудования и проводка убытка в Дт 84', 'Impairment test for PPE/IT assets and loss recognition in Dr 84', 'Asosiy vositalar qadrsizlanish testi va zararni Dt 84 da tan olish') },
    { id: 'IFRS 9', label: tr('IFRS 9 (ECL Резерв)', 'IFRS 9 (ECL Provision)', 'IFRS 9 (ECL Zaxira)'), desc: tr('Расчет матрицы кредитных убытков по сомнительной дебиторке (63/84)', 'Expected Credit Loss matrix calculation for receivables (63/84)', 'Shubhali debitorlik qarzlari bo\'yicha ECL matritsasini hisoblash (63/84)') },
    { id: 'IAS 12', label: tr('IAS 12 (Налоги)', 'IAS 12 (Income Taxes)', 'IAS 12 (Foyda solig\'i)'), desc: tr('Расчет временных разниц и отложенных налоговых обязательств', 'Temporary differences and deferred tax assets/liabilities calculation', 'Vaqtinchalik farqlar va kechiktirilgan soliq majburiyatlarini hisoblash') },
];

const PRESET_AI_PROMPTS: Record<string, string> = {
    ifrs_full: 'Проверь корректность классификации договоров аренды по МСФО 16, ставку дисконтирования и авто-балансировку нераспределенной прибыли.',
    tax_audit: 'Проанализируй налогооблагаемую базу по налогу на прибыль и зачетный НДС в соответствии с Налоговым кодексом РУз, выяви налоговые риски.',
    general_ledger: 'Сверь оборотно-сальдовую ведомость 1С с трансформационным балансом, найди нетипичные сальдо и крупные проводки с аффилированными лицами.',
    esg_summary: 'Оцени полноту раскрытия прямых и косвенных выбросов Scope 1, 2, 3 и климатических рисков в соответствии с МСФО S1 и S2.',
};

export const TemplateWizardModal: React.FC<TemplateWizardModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    initialTemplate
}) => {
    useTranslation();
    const STEPS = getSteps();
    const ACCOUNT_OPTIONS = getAccountOptions();
    const STANDARDS_LIST = getStandardsList();
    const { toast } = useToast();
    const [currentStep, setCurrentStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [reportType, setReportType] = useState('financial');
    const [countryCode, setCountryCode] = useState('UZ');
    const [sourceStandard, setSourceStandard] = useState('NAS');
    const [targetStandard, setTargetStandard] = useState('IFRS');

    // Data Source
    const [dataSourceType, setDataSourceType] = useState<'onec_sync' | 'excel_upload' | 'manual_entry'>('onec_sync');
    const [requiredAccounts, setRequiredAccounts] = useState<string[]>(['01', '02', '60', '67', '84']);
    const [strictValidation, setStrictValidation] = useState(true);

    // Accounting Rules
    const [activeStandards, setActiveStandards] = useState<string[]>(['IFRS 16', 'IAS 36', 'IFRS 9']);
    const [enforceZeroDelta, setEnforceZeroDelta] = useState(true);

    // AI Directives
    const [aiEnabled, setAiEnabled] = useState(true);
    const [aiRole, setAiRole] = useState('Senior IFRS Big 4 Auditor');
    const [aiPrompt, setAiPrompt] = useState(PRESET_AI_PROMPTS.ifrs_full);
    const [riskTriggers, setRiskTriggers] = useState<string[]>([
        'unbalanced_equity',
        'undisclosed_lease_terms',
        'stale_receivables'
    ]);
    const [outputLanguage, setOutputLanguage] = useState('ru');

    // Workflow
    const [isRecurring, setIsRecurring] = useState(true);
    const [recurrencePattern, setRecurrencePattern] = useState('quarterly');
    const [approvalChain, setApprovalChain] = useState<string[]>(['accountant', 'auditor', 'admin']);

    useEffect(() => {
        if (initialTemplate) {
            setName(initialTemplate.name || '');
            setDescription(initialTemplate.description || '');
            setReportType(initialTemplate.report_type || 'financial');
            setCountryCode(initialTemplate.country_code || 'UZ');
            setIsRecurring(initialTemplate.is_recurring ?? true);
            setRecurrencePattern(initialTemplate.recurrence_pattern || 'quarterly');

            const cfg = initialTemplate.configuration || {};
            setSourceStandard(cfg.source_standard || 'NAS');
            setTargetStandard(cfg.target_standard || 'IFRS');
            setDataSourceType(cfg.data_source_type || 'onec_sync');
            setRequiredAccounts(cfg.required_accounts || ['01', '02', '60', '67', '84']);
            setActiveStandards(cfg.active_standards || ['IFRS 16', 'IAS 36']);
            setEnforceZeroDelta(cfg.enforce_zero_delta ?? true);
            setAiEnabled(cfg.ai_audit_enabled ?? true);
            setAiRole(cfg.ai_expert_role || 'Senior IFRS Big 4 Auditor');
            setAiPrompt(cfg.ai_prompt || PRESET_AI_PROMPTS.ifrs_full);
            setRiskTriggers(cfg.risk_triggers || ['unbalanced_equity']);
            setApprovalChain(cfg.approval_chain || ['accountant', 'auditor', 'admin']);
        } else {
            resetToDefaults();
        }
    }, [initialTemplate, isOpen]);

    const resetToDefaults = () => {
        setCurrentStep(1);
        setName('');
        setDescription('');
        setReportType('financial');
        setCountryCode('UZ');
        setSourceStandard('NAS');
        setTargetStandard('IFRS');
        setDataSourceType('onec_sync');
        setRequiredAccounts(['01', '02', '60', '67', '84']);
        setActiveStandards(['IFRS 16', 'IAS 36', 'IFRS 9']);
        setEnforceZeroDelta(true);
        setAiEnabled(true);
        setAiRole('Senior IFRS Big 4 Auditor');
        setAiPrompt(PRESET_AI_PROMPTS.ifrs_full);
        setRiskTriggers(['unbalanced_equity', 'undisclosed_lease_terms', 'stale_receivables']);
        setOutputLanguage('ru');
        setIsRecurring(true);
        setRecurrencePattern('quarterly');
        setApprovalChain(['accountant', 'auditor', 'admin']);
    };

    if (!isOpen) return null;

    const toggleAccount = (acc: string) => {
        setRequiredAccounts(prev =>
            prev.includes(acc) ? prev.filter(a => a !== acc) : [...prev, acc]
        );
    };

    const toggleStandard = (std: string) => {
        setActiveStandards(prev =>
            prev.includes(std) ? prev.filter(s => s !== std) : [...prev, std]
        );
    };

    const toggleRiskTrigger = (trigger: string) => {
        setRiskTriggers(prev =>
            prev.includes(trigger) ? prev.filter(t => t !== trigger) : [...prev, trigger]
        );
    };

    const handleSave = async () => {
        if (!name.trim()) {
            toast({
                variant: 'destructive',
                title: tr('Ошибка', 'Error', 'Xatolik'),
                description: tr('Укажите название шаблона на шаге 1', 'Please enter a template name in Step 1', '1-qadamda shablon nomini kiriting'),
            });
            setCurrentStep(1);
            return;
        }

        const configurationPayload = {
            source_standard: sourceStandard,
            target_standard: targetStandard,
            data_source_type: dataSourceType,
            required_accounts: requiredAccounts,
            strict_validation: strictValidation,
            active_standards: activeStandards,
            enforce_zero_delta: enforceZeroDelta,
            ai_audit_enabled: aiEnabled,
            ai_expert_role: aiRole,
            ai_prompt: aiPrompt,
            risk_triggers: riskTriggers,
            output_language: outputLanguage,
            approval_chain: approvalChain
        };

        const payload = {
            name: name.trim(),
            description: description.trim(),
            report_type: reportType,
            country_code: countryCode,
            tax_types: ['vat', 'corporate'],
            is_recurring: isRecurring,
            recurrence_pattern: recurrencePattern,
            configuration: configurationPayload
        };

        try {
            setSubmitting(true);
            let savedResult: any = null;
            if (initialTemplate?.id) {
                const res = await api.put(`/templates/${initialTemplate.id}`, payload);
                savedResult = res?.data || { ...initialTemplate, ...payload };
                toast({
                    title: tr('Успешно', 'Success', 'Muvaffaqiyatli'),
                    description: tr('Шаблон обновлен с полной конфигурацией', 'Template updated with full configuration', 'Shablon to\'liq konfiguratsiya bilan yangilandi'),
                });
            } else {
                const res = await api.post('/templates/', payload);
                savedResult = res?.data || { id: 'tmpl-' + Date.now(), ...payload };
                toast({
                    title: tr('Шаблон создан', 'Template Created', 'Shablon yaratildi'),
                    description: tr('Интеллектуальный шаблон готов к использованию', 'Smart template is ready to use', 'Intellektual shablon foydalanishga tayyor'),
                });
            }
            onSuccess(savedResult);
            onClose();
        } catch (error: any) {
            console.error('Failed to save template', error);
            toast({
                variant: 'destructive',
                title: tr('Ошибка сохранения', 'Save Error', 'Saqlashda xatolik'),
                description: error.response?.data?.detail || tr('Не удалось сохранить шаблон', 'Failed to save template', 'Shablonni saqlab bo\'lmadi'),
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-slate-100">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-blue-50/40 dark:from-slate-900 dark:to-slate-800/80">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-500/20">
                            <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                {initialTemplate
                                    ? tr('Редактирование Smart-Шаблона', 'Edit Smart Template', 'Smart-Shablonni tahrirlash')
                                    : tr('Конструктор Smart-Шаблона Axiaris', 'Axiaris Smart Template Builder', 'Axiaris Smart-Shablon konstruktori')}
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {tr(
                                    'Интеллектуальный регламентный пайплайн финансовой трансформации и комплаенса',
                                    'Intelligent regulatory pipeline for financial transformation and compliance',
                                    'Moliyaviy transformatsiya va komplayensning intellektual konveyeri'
                                )}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label={tr('Закрыть окно конструктора', 'Close builder modal', 'Konstruktor oynasini yopish')}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Stepper Progress Bar */}
                <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="grid grid-cols-5 gap-2">
                        {STEPS.map((step) => {
                            const Icon = step.icon;
                            const isCurrent = currentStep === step.id;
                            const isCompleted = currentStep > step.id;

                            return (
                                <button
                                    key={step.id}
                                    type="button"
                                    onClick={() => setCurrentStep(step.id)}
                                    className={`flex items-center gap-2 p-2 rounded-xl text-left transition-all ${
                                        isCurrent
                                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                            : isCompleted
                                            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-900/50'
                                            : 'bg-white dark:bg-slate-800/70 text-slate-400 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                    }`}
                                >
                                    <div
                                        className={`flex items-center justify-center w-7 h-7 rounded-lg text-xs font-semibold ${
                                            isCurrent
                                                ? 'bg-white/20 text-white'
                                                : isCompleted
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                        }`}
                                    >
                                        {isCompleted ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                                    </div>
                                    <div className="min-w-0 hidden sm:block">
                                        <div className="text-xs font-bold truncate leading-tight text-slate-800 dark:text-slate-100">{step.title}</div>
                                        <div className={`text-[10px] truncate ${isCurrent ? 'text-blue-100' : 'text-slate-400 dark:text-slate-500'}`}>
                                            {step.desc}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Step Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* STEP 1: Scope & Basics */}
                    {currentStep === 1 && (
                        <div className="space-y-5 animate-in fade-in-50 duration-150">
                            <div>
                                <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Scale className="h-5 w-5 text-blue-600 dark:text-blue-400" /> {tr('Шаг 1: Название, назначение и юрисдикция', 'Step 1: Name, Purpose & Jurisdiction', '1-qadam: Nomi, maqsadi va yurisdiksiya')}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    {tr('Определите регуляторную сферу применения шаблона и стандарты финансового учета', 'Define the regulatory scope of the template and financial accounting standards', 'Shablonning regulyator qo\'llash sohasini va moliyaviy hisob standartlarini belgilang')}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{tr('Название шаблона *', 'Template Name *', 'Shablon nomi *')}</label>
                                    <Input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder={tr('Например: Трансформация МСФО 16: Аренда и сверка капитала', 'e.g. IFRS 16 Transformation: Leases & Equity Reconciliation', 'Masalan: MHXS 16 Transformatsiyasi: Ijara va kapital solishtirmasi')}
                                        className="h-10 text-sm font-medium bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                    />
                                </div>

                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{tr('Описание и назначение', 'Description & Purpose', 'Tavsifi va maqsadi')}</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder={tr('Опишите цель формирования отчета, обязательные раскрытия и контролируемые риски...', 'Describe the report objective, required disclosures, and monitored risks...', 'Hisobot maqsadini, majburiy ochiqlashlarni va nazorat qilinadigan xavflarni tavsiflang...')}
                                        rows={2}
                                        className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{tr('Категория отчета *', 'Report Category *', 'Hisobot toifasi *')}</label>
                                    <select
                                        value={reportType}
                                        onChange={(e) => setReportType(e.target.value)}
                                        className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700 px-3 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="financial">{tr('МСФО Трансформация (Financial)', 'IFRS Transformation (Financial)', 'MHXS Transformatsiyasi (Financial)')}</option>
                                        <option value="compliance">{tr('Налоговый комплаенс (Compliance)', 'Tax Compliance (Compliance)', 'Soliq komplayensi (Compliance)')}</option>
                                        <option value="audit">{tr('Аудит и сверка ОСВ (Audit Reconciliation)', 'Audit & Trial Balance Reconciliation', 'Audit va OSV solishtirmasi')}</option>
                                        <option value="risk_assessment">{tr('Оценка рисков и ESG (Risk Analysis)', 'Risk Assessment & ESG', 'Xavflarni baholash va ESG')}</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{tr('Юрисдикция / Страна *', 'Jurisdiction / Country *', 'Yurisdiksiya / Davlat *')}</label>
                                    <select
                                        value={countryCode}
                                        onChange={(e) => setCountryCode(e.target.value)}
                                        className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700 px-3 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="UZ">🇺🇿 {tr('Узбекистан (Uzbekistan)', 'Uzbekistan', 'O\'zbekiston')}</option>
                                        <option value="KZ">🇰🇿 {tr('Казахстан (Kazakhstan)', 'Kazakhstan', 'Qozog\'iston')}</option>
                                        <option value="GB">🇬🇧 {tr('Великобритания (United Kingdom)', 'United Kingdom', 'Buyuk Britaniya')}</option>
                                        <option value="US">🇺🇸 {tr('США (United States)', 'United States', 'AQSH')}</option>
                                        <option value="DE">🇩🇪 {tr('Германия / ЕС (Germany / EU)', 'Germany / EU', 'Germaniya / YI')}</option>
                                        <option value="GLOBAL">🌐 {tr('Глобальный международный (Global)', 'Global International', 'Global xalqaro')}</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{tr('Исходный стандарт учета', 'Source Accounting Standard', 'Manba buxgalteriya standarti')}</label>
                                    <select
                                        value={sourceStandard}
                                        onChange={(e) => setSourceStandard(e.target.value)}
                                        className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700 px-3 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="NAS">{tr('НСБУ Республики Узбекистан (NAS)', 'NAS of Uzbekistan (NSBU)', 'O\'zbekiston Respublikasi BHMS (NSBU)')}</option>
                                        <option value="1C_COA">{tr('1С:Типовой план счетов (План счетов 1С)', '1C Standard Chart of Accounts', '1C Standart schyotlar rejasi')}</option>
                                        <option value="RSBU">{tr('РСБУ (Российские стандарты учета)', 'RAS (Russian Accounting Standards)', 'RSBU (Rossiya hisob standartlari)')}</option>
                                        <option value="GRI">{tr('GRI / Локальный управленческий учет', 'GRI / Local Management Accounting', 'GRI / Mahalliy boshqaruv hisobi')}</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{tr('Целевой стандарт комплаенса', 'Target Compliance Standard', 'Maqsadli komplayens standarti')}</label>
                                    <select
                                        value={targetStandard}
                                        onChange={(e) => setTargetStandard(e.target.value)}
                                        className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700 px-3 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="IFRS">{tr('МСФО (IFRS — International Standards)', 'IFRS (International Financial Reporting Standards)', 'MHXS (IFRS — Xalqaro standartlar)')}</option>
                                        <option value="TAX_CODE">{tr('Налоговый кодекс (ГНК РУз / Налоговые декларации)', 'Tax Code of Uzbekistan (Tax Returns)', 'O\'zR Soliq kodeksi (Soliq deklaratsiyalari)')}</option>
                                        <option value="US_GAAP">{tr('US GAAP (Американские стандарты)', 'US GAAP (American Standards)', 'US GAAP (AQSH standartlari)')}</option>
                                        <option value="IFRS_S1_S2">{tr('IFRS S1 / S2 (Климатический комплаенс)', 'IFRS S1 / S2 (Sustainability Disclosures)', 'IFRS S1 / S2 (ESG va iqlim komplayensi)')}</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Data Source */}
                    {currentStep === 2 && (
                        <div className="space-y-5 animate-in fade-in-50 duration-150">
                            <div>
                                <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Server className="h-5 w-5 text-blue-600 dark:text-blue-400" /> {tr('Шаг 2: Источник данных и счета учета', 'Step 2: Data Source & Chart of Accounts', '2-qadam: Ma\'lumotlar manbasi va hisob schyotlari')}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    {tr('Укажите, откуда шаблон будет получать исходную оборотно-сальдовую ведомость (ОСВ)', 'Specify where the template will pull the source Trial Balance from', 'Shablon boshlang\'ich aylanma-qoldiq qaydnomasini (OSV) qayerdan olishini belgilang')}
                                </p>
                            </div>

                            {/* Data Source Type Selector Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {[
                                    {
                                        id: 'onec_sync',
                                        title: tr('1С:Предприятие', '1C:Enterprise', '1C:Korxona'),
                                        subtitle: tr('Прямая синхронизация по OData/REST', 'Direct sync via OData/REST', 'OData/REST orqali bevosita sinxronizatsiya'),
                                        icon: Server,
                                        color: 'amber'
                                    },
                                    {
                                        id: 'excel_upload',
                                        title: tr('Excel / CSV файл', 'Excel / CSV File', 'Excel / CSV fayl'),
                                        subtitle: tr('Импорт файла ОСВ по макету', 'Import Trial Balance file by layout', 'OSV faylini shablon bo\'yicha import qilish'),
                                        icon: FileSpreadsheet,
                                        color: 'emerald'
                                    },
                                    {
                                        id: 'manual_entry',
                                        title: tr('Выбор баланса', 'Select Balance Sheet', 'Balansni tanlash'),
                                        subtitle: tr('Использование ранее созданного баланса', 'Use an existing balance sheet', 'Avval yaratilgan balansdan foydalanish'),
                                        icon: FileText,
                                        color: 'blue'
                                    }
                                ].map(src => {
                                    const Icon = src.icon;
                                    const isSelected = dataSourceType === src.id;
                                    return (
                                        <button
                                            key={src.id}
                                            type="button"
                                            onClick={() => setDataSourceType(src.id as any)}
                                            className={`p-3.5 rounded-xl border-2 text-left transition-all ${
                                                isSelected
                                                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 shadow-sm'
                                                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/80'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                                                    <Icon className="h-4 w-4" />
                                                </div>
                                                <span className="text-xs font-bold text-slate-900 dark:text-white">{src.title}</span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">{src.subtitle}</p>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Required Accounts Picker */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        {tr(`Обязательные классы счетов ОСВ (${requiredAccounts.length} выбрано):`, `Required Trial Balance Account Classes (${requiredAccounts.length} selected):`, `Majburiy OSV hisob sinflari (${requiredAccounts.length} ta tanlandi):`)}
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setRequiredAccounts(ACCOUNT_OPTIONS.map(a => a.code))}
                                        className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium"
                                    >
                                        {tr('Выбрать все счета', 'Select all accounts', 'Barcha schyotlarni tanlash')}
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {ACCOUNT_OPTIONS.map(acc => {
                                        const isChecked = requiredAccounts.includes(acc.code);
                                        return (
                                            <button
                                                key={acc.code}
                                                type="button"
                                                onClick={() => toggleAccount(acc.code)}
                                                className={`flex items-center gap-2 p-2 rounded-lg border text-left text-xs transition-colors ${
                                                    isChecked
                                                        ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-400 dark:border-blue-600 text-blue-900 dark:text-blue-200 font-medium'
                                                        : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                                                }`}
                                            >
                                                <span className="font-mono font-bold px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded border border-slate-200 dark:border-slate-600 text-[10px]">
                                                    {acc.code}
                                                </span>
                                                <span className="truncate">{acc.name}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <div className="text-xs font-semibold text-slate-900 dark:text-white">{tr('Строгая верификация структуры колонок', 'Strict Column Structure Verification', 'Ustunlar tuzilmasini qat\'iy tekshirish')}</div>
                                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                        {tr('Требовать обязательное наличие сальдо на начало, оборотов Дт/Кт и конечного сальдо', 'Require opening balance, Debit/Credit turnover, and closing balance columns', 'Boshlang\'ich qoldiq, Dt/Kt aylanmalar va yakuniy qoldiq bo\'lishini talab qilish')}
                                    </div>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={strictValidation}
                                    onChange={(e) => setStrictValidation(e.target.checked)}
                                    className="h-4 w-4 rounded text-blue-600"
                                />
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Accounting & IFRS Rules */}
                    {currentStep === 3 && (
                        <div className="space-y-5 animate-in fade-in-50 duration-150">
                            <div>
                                <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Layers className="h-5 w-5 text-blue-600 dark:text-blue-400" /> {tr('Шаг 3: Бухгалтерская логика и пакеты МСФО', 'Step 3: Accounting Logic & IFRS Packages', '3-qadam: Buxgalteriya mantiqi va MHXS paketlari')}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    {tr('Настройте автоматические корректировки и правила защиты двойной записи', 'Configure automatic adjustments and double-entry balance protection rules', 'Avtomatik tuzatishlar va ikki yoqlama yozuv himoya qoidalarini sozlang')}
                                </p>
                            </div>

                            <div className="space-y-2.5">
                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    {tr('Активные пакеты трансформационных проводок:', 'Active Transformation Adjustment Packages:', 'Faol transformatsiya provodkalari paketlari:')}
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {STANDARDS_LIST.map(std => {
                                        const isChecked = activeStandards.includes(std.id);
                                        return (
                                            <div
                                                key={std.id}
                                                onClick={() => toggleStandard(std.id)}
                                                className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                                    isChecked
                                                        ? 'border-indigo-500 dark:border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/40 shadow-xs'
                                                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-600'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs font-bold text-slate-900 dark:text-white">{std.label}</span>
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={() => {}}
                                                        className="h-4 w-4 rounded text-indigo-600"
                                                    />
                                                </div>
                                                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">{std.desc}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Double-Entry Guard Callout */}
                            <div className="p-4 rounded-xl border-2 border-emerald-300 dark:border-emerald-700/60 bg-emerald-50/60 dark:bg-emerald-950/30 space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                        <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                                            {tr('Double-Entry Balance Guard (Контроль сходимости капитала)', 'Double-Entry Balance Guard (Equity Convergence Control)', 'Double-Entry Balance Guard (Kapital tengligini nazorat qilish)')}
                                        </span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={enforceZeroDelta}
                                        onChange={(e) => setEnforceZeroDelta(e.target.checked)}
                                        className="h-4 w-4 rounded text-emerald-600"
                                    />
                                </div>
                                <p className="text-[11px] text-emerald-800 dark:text-emerald-300/90">
                                    {tr(
                                        'При расчете обесценения (IAS 36) и резерва (IFRS 9) движок автоматически проводит парные записи в Нераспределенную прибыль (счет 84), гарантируя нулевое расхождение между активами и пассивами.',
                                        'When calculating impairment (IAS 36) and ECL provisions (IFRS 9), the engine automatically posts offsetting entries to Retained Earnings (Account 84), guaranteeing zero discrepancy between assets and liabilities & equity.',
                                        'Qadrsizlanish (IAS 36) va ECL zaxirasini (IFRS 9) hisoblashda tizim avtomatik ravishda Taqsimlanmagan foydaga (84-schyot) juft yozuvlarni o\'tkazib, aktivlar va passivlar o\'rtasida nol tafovutni kafolatlaydi.'
                                    )}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: AI Directives */}
                    {currentStep === 4 && (
                        <div className="space-y-5 animate-in fade-in-50 duration-150">
                            <div>
                                <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" /> {tr('Шаг 4: Директивы для нейросети Axiaris', 'Step 4: Axiaris Neural Network Directives', '4-qadam: Axiaris neyrotarmog\'i uchun ko\'rsatmalar')}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    {tr('Задайте специализированные инструкции и пороговые триггеры рисков для ИИ-аудита', 'Configure specialized instructions and risk threshold triggers for AI auditing', 'AI-audit uchun maxsus yo\'riqnomalar va xavf chegaralarini belgilang')}
                                </p>
                            </div>

                            <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-800/60 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                    <div>
                                        <div className="text-xs font-semibold text-purple-900 dark:text-purple-200">{tr('Включить автоматический ИИ-аудит', 'Enable Automated AI Audit', 'Avtomatik AI-auditni yoqish')}</div>
                                        <div className="text-[11px] text-purple-700 dark:text-purple-300/80">{tr('Генерировать аудиторское заключение и выявлять риски', 'Generate audit opinion and detect compliance risks', 'Auditorlik xulosasini shakllantirish va xavflarni aniqlash')}</div>
                                    </div>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={aiEnabled}
                                    onChange={(e) => setAiEnabled(e.target.checked)}
                                    className="h-4 w-4 rounded text-purple-600"
                                />
                            </div>

                            {aiEnabled && (
                                <div className="space-y-4 pt-1">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{tr('Роль ИИ-эксперта', 'AI Expert Role', 'AI-ekspert roli')}</label>
                                            <select
                                                value={aiRole}
                                                onChange={(e) => setAiRole(e.target.value)}
                                                className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-700 px-3 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-purple-500"
                                            >
                                                <option value="Senior IFRS Big 4 Auditor">{tr('Старший аудитор Big 4 по МСФО', 'Senior IFRS Big 4 Auditor', 'MHXS bo\'yicha Big 4 katta auditori')}</option>
                                                <option value="Tax Compliance Advisor (UZ/CIS)">{tr('Налоговый консультант (Узбекистан / СНГ)', 'Tax Compliance Advisor (UZ / CIS)', 'Soliq maslahatchisi (O\'zbekiston / MDH)')}</option>
                                                <option value="Forensic & Fraud Investigator">{tr('Специалист по форензик и выявлению искажений', 'Forensic & Misstatement Investigator', 'Forenzik va buzilishlarni aniqlash mutaxassisi')}</option>
                                                <option value="ESG & Sustainability Lead">{tr('ESG и комплаенс-аналитик', 'ESG & Sustainability Lead', 'ESG va komplayens tahlilchisi')}</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{tr('Язык аудиторских замечаний', 'Audit Findings Language', 'Auditorlik izohlari tili')}</label>
                                            <select
                                                value={outputLanguage}
                                                onChange={(e) => setOutputLanguage(e.target.value)}
                                                className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-700 px-3 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-purple-500"
                                            >
                                                <option value="ru">{tr('Русский язык (RU)', 'Russian (RU)', 'Rus tili (RU)')}</option>
                                                <option value="uz">{tr('Узбекский язык (O\'zbek tili)', 'Uzbek (O\'zbek tili)', 'O\'zbek tili (UZ)')}</option>
                                                <option value="en">{tr('Английский язык (English)', 'English (EN)', 'Ingliz tili (EN)')}</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Presets */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{tr('Промпт-инструкция для ИИ', 'AI System Prompt Directive', 'AI uchun tizimli yo\'riqnoma')}</label>
                                            <div className="flex gap-1">
                                                {[
                                                    { label: tr('МСФО 16', 'IFRS 16', 'MHXS 16'), key: 'ifrs_full' },
                                                    { label: tr('Налоги', 'Taxes', 'Soliqlar'), key: 'tax_audit' },
                                                    { label: tr('ОСВ 1С', '1C TB', '1C OSV'), key: 'general_ledger' }
                                                ].map(({ label, key }) => (
                                                    <button
                                                        key={key}
                                                        type="button"
                                                        onClick={() => setAiPrompt(PRESET_AI_PROMPTS[key])}
                                                        className="px-2 py-0.5 text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700"
                                                    >
                                                        {label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <textarea
                                            value={aiPrompt}
                                            onChange={(e) => setAiPrompt(e.target.value)}
                                            rows={3}
                                            className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                            placeholder={tr('Введите системную директиву для нейросети...', 'Enter system directive for the neural engine...', 'Neyrotarmoq uchun tizimli ko\'rsatmani kiriting...')}
                                        />
                                    </div>

                                    {/* Risk Triggers */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{tr('Триггеры автоматических предупреждений:', 'Automatic Alert Triggers:', 'Avtomatik ogohlantirish триггерлари:')}</label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {[
                                                { id: 'unbalanced_equity', label: tr('🔴 Расхождение баланса > 0', '🔴 Balance Discrepancy > 0', '🔴 Balans tafovuti > 0') },
                                                { id: 'undisclosed_lease_terms', label: tr('🟡 Нераскрытые условия аренды', '🟡 Undisclosed Lease Terms', '🟡 Ochiqlanmagan ijara shartlari') },
                                                { id: 'stale_receivables', label: tr('🟠 Дебиторка > 90 дней без резерва', '🟠 Receivables > 90d without ECL', '🟠 90 kundan oshgan zaxirasiz debitorlik') },
                                                { id: 'vat_gap', label: tr('🔴 Разрыв по НДС и выручке', '🔴 VAT vs Revenue Gap', '🔴 QQS va tushum o\'rtasidagi farq') },
                                                { id: 'abnormal_turnover', label: tr('🟡 Нетипичные обороты по счету 84', '🟡 Unusual Account 84 Turnover', '🟡 84-schyot bo\'yicha noodatiy aylanmalar') }
                                            ].map(t => {
                                                const isSelected = riskTriggers.includes(t.id);
                                                return (
                                                    <button
                                                        key={t.id}
                                                        type="button"
                                                        onClick={() => toggleRiskTrigger(t.id)}
                                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                                                            isSelected
                                                                ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200 border border-purple-300 dark:border-purple-700'
                                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                                                        }`}
                                                    >
                                                        {t.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 5: Workflow, Scheduling & Review */}
                    {currentStep === 5 && (
                        <div className="space-y-5 animate-in fade-in-50 duration-150">
                            <div>
                                <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Workflow className="h-5 w-5 text-blue-600 dark:text-blue-400" /> {tr('Шаг 5: Маршрут согласования и финальная сводка', 'Step 5: Approval Workflow & Final Summary', '5-qadam: Tasdiqlash yo\'nalishi va yakuniy xulosa')}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    {tr('Установите периодичность формирования и проверьте готовность шаблона', 'Set recurrence schedule and verify template readiness', 'Hisobot davriyligini o\'rnating va shablon tayyorligini tekshiring')}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-slate-900 dark:text-white">{tr('Регулярное авто-создание драфта', 'Recurring Auto-Draft Generation', 'Muntazam avto-qoralama yaratish')}</span>
                                        <input
                                            type="checkbox"
                                            checked={isRecurring}
                                            onChange={(e) => setIsRecurring(e.target.checked)}
                                            className="h-4 w-4 rounded text-blue-600"
                                        />
                                    </div>
                                    {isRecurring && (
                                        <div className="space-y-1">
                                            <label className="text-xs text-slate-600 dark:text-slate-400">{tr('Периодичность формирования:', 'Recurrence Schedule:', 'Shakllantirish davriyligi:')}</label>
                                            <select
                                                value={recurrencePattern}
                                                onChange={(e) => setRecurrencePattern(e.target.value)}
                                                className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-700 px-3 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
                                            >
                                                <option value="monthly">{tr('Ежемесячно (к 5-му числу месяца)', 'Monthly (by the 5th of each month)', 'Har oyda (oyning 5-sanasigacha)')}</option>
                                                <option value="quarterly">{tr('Ежеквартально (по итогам квартала)', 'Quarterly (at quarter end)', 'Har chorakda (chorak yakuni bo\'yicha)')}</option>
                                                <option value="yearly">{tr('Ежегодно (годовая отчетность)', 'Annually (annual reporting)', 'Har yili (yillik hisobot)')}</option>
                                            </select>
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                                    <span className="text-xs font-semibold text-slate-900 dark:text-white block">{tr('Цепочка согласования (Workflow):', 'Approval Chain (Workflow):', 'Tasdiqlash zanjiri (Workflow):')}</span>
                                    <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                                        <div className="flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 flex items-center justify-center font-bold text-[10px]">1</span>
                                            <span><strong>{tr('Бухгалтер:', 'Accountant:', 'Buxgalter:')}</strong> {tr('Загрузка ОСВ / запуск трансформации', 'Trial Balance upload / transformation run', 'OSV yuklash / transformatsiyani ishga tushirish')}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 flex items-center justify-center font-bold text-[10px]">2</span>
                                            <span><strong>{tr('Аудитор:', 'Auditor:', 'Auditor:')}</strong> {tr('Проверка сходимости и ИИ-заключения', 'Convergence check & AI opinion review', 'Balans tengligi va AI xulosasini tekshirish')}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-[10px]">3</span>
                                            <span><strong>{tr('Директор:', 'Executive:', 'Direktor:')}</strong> {tr('Финальное утверждение и экспорт', 'Final sign-off & export', 'Yakuniy tasdiqlash va eksport')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Live Blueprint Summary Card */}
                            <div className="p-4 rounded-2xl border-2 border-blue-200 dark:border-blue-900/60 bg-gradient-to-br from-blue-50/60 to-indigo-50/40 dark:from-slate-800/80 dark:to-blue-950/40 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        <span className="text-xs font-bold text-blue-950 dark:text-blue-200 uppercase tracking-wider">
                                            {tr('Итоговый паспорт шаблона (Smart Blueprint)', 'Smart Blueprint Summary', 'Shablonning yakuniy pasporti (Smart Blueprint)')}
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                                        {tr('Готов к запуску', 'Ready to Launch', 'Ishga tushirishga tayyor')}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                    <div className="bg-white/90 dark:bg-slate-800/90 p-2 rounded-lg border border-blue-100 dark:border-slate-700">
                                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{tr('Название:', 'Name:', 'Nomi:')}</span>
                                        <span className="font-semibold text-slate-900 dark:text-white truncate block">{name || tr('Не указано', 'Not specified', 'Kiritilmagan')}</span>
                                    </div>
                                    <div className="bg-white/90 dark:bg-slate-800/90 p-2 rounded-lg border border-blue-100 dark:border-slate-700">
                                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{tr('Переход:', 'Transition:', 'O\'tish:')}</span>
                                        <span className="font-semibold text-blue-700 dark:text-blue-300">{sourceStandard} ➔ {targetStandard}</span>
                                    </div>
                                    <div className="bg-white/90 dark:bg-slate-800/90 p-2 rounded-lg border border-blue-100 dark:border-slate-700">
                                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{tr('Источник:', 'Source:', 'Manba:')}</span>
                                        <span className="font-semibold capitalize text-slate-900 dark:text-white">{dataSourceType.replace('_', ' ')}</span>
                                    </div>
                                    <div className="bg-white/90 dark:bg-slate-800/90 p-2 rounded-lg border border-blue-100 dark:border-slate-700">
                                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{tr('Стандарты:', 'Standards:', 'Standartlar:')}</span>
                                        <span className="font-semibold text-indigo-700 dark:text-indigo-300">{activeStandards.join(', ') || tr('Базовый', 'Basic', 'Bazaviy')}</span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-1.5 pt-1">
                                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                                        ✓ Double-Entry Guard: Zero Delta
                                    </span>
                                    {aiEnabled && (
                                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50">
                                            ✓ {tr('ИИ-экспертиза', 'AI Audit', 'AI-ekspertiza')}: {aiRole}
                                        </span>
                                    )}
                                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50">
                                        ✓ {tr('Счетов в ОСВ', 'Accounts in TB', 'OSV dagi hisoblar')}: {requiredAccounts.length}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal Footer Controls */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <div>
                        {currentStep > 1 && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentStep(prev => prev - 1)}
                                className="border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                            >
                                <ChevronLeft className="mr-1 h-4 w-4" /> {tr('Назад', 'Back', 'Orqaga')}
                            </Button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onClose}
                            className="border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                        >
                            {tr('Отмена', 'Cancel', 'Bekor qilish')}
                        </Button>

                        {currentStep < 5 ? (
                            <Button
                                type="button"
                                size="sm"
                                onClick={() => {
                                    if (currentStep === 1 && !name.trim()) {
                                        toast({
                                            variant: 'destructive',
                                            title: tr('Ошибка', 'Error', 'Xatolik'),
                                            description: tr('Укажите название шаблона перед переходом дальше', 'Please enter a template name before proceeding', 'Keyingi qadamga o\'tishdan oldin shablon nomini kiriting')
                                        });
                                        return;
                                    }
                                    setCurrentStep(prev => prev + 1);
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                            >
                                {tr('Далее', 'Next', 'Keyingi')} <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                size="sm"
                                onClick={handleSave}
                                disabled={submitting}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-500/20"
                            >
                                <Sparkles className="mr-1.5 h-4 w-4" />
                                {initialTemplate
                                    ? tr('Сохранить изменения', 'Save Changes', 'O\'zgarishlarni saqlash')
                                    : tr('Создать Smart-Шаблон', 'Create Smart Template', 'Smart-Shablon yaratish')}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
