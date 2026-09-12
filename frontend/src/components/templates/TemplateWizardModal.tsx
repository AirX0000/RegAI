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

interface TemplateWizardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialTemplate?: any;
}

const STEPS = [
    { id: 1, title: 'Scope & Standard', desc: 'Область и регламенты', icon: Scale },
    { id: 2, title: 'Data Source', desc: 'Источник данных (1С/Excel)', icon: Server },
    { id: 3, title: 'Accounting Rules', desc: 'Правила МСФО и баланс', icon: Layers },
    { id: 4, title: 'AI Directives', desc: 'Инструкции для ИИ-аудита', icon: Brain },
    { id: 5, title: 'Workflow & Review', desc: 'Маршрут и предпросмотр', icon: Workflow },
];

const ACCOUNT_OPTIONS = [
    { code: '01', name: 'Основные средства (PPE)' },
    { code: '02', name: 'Амортизация (Accum. Depr.)' },
    { code: '10', name: 'Сырье и материалы (Inventories)' },
    { code: '41', name: 'Товары (Goods)' },
    { code: '51', name: 'Расчетные счета (Cash & Bank)' },
    { code: '60', name: 'Расчеты с поставщиками (Payables)' },
    { code: '62', name: 'Расчеты с покупателями (Receivables)' },
    { code: '67', name: 'Долгосрочные обязательства / Аренда' },
    { code: '80', name: 'Уставный капитал (Share Capital)' },
    { code: '84', name: 'Нераспределенная прибыль (Retained Earnings)' },
];

const STANDARDS_LIST = [
    { id: 'IFRS 16', label: 'IFRS 16 (Аренда)', desc: 'Дисконтирование, капитализация ROU-актива и арендных обязательств (01/67)' },
    { id: 'IAS 36', label: 'IAS 36 (Обесценение)', desc: 'Тест на обесценение ОС/ИТ-оборудования и проводка убытка в Дт 84' },
    { id: 'IFRS 9', label: 'IFRS 9 (ECL Резерв)', desc: 'Расчет матрицы кредитных убытков по сомнительной дебиторке (63/84)' },
    { id: 'IAS 12', label: 'IAS 12 (Налоги)', desc: 'Расчет временных разниц и отложенных налоговых обязательств' },
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
                title: 'Ошибка',
                description: 'Укажите название шаблона на шаге 1',
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
            if (initialTemplate?.id) {
                await api.put(`/templates/${initialTemplate.id}`, payload);
                toast({
                    title: 'Успешно',
                    description: 'Шаблон обновлен с полной конфигурацией',
                });
            } else {
                await api.post('/templates/', payload);
                toast({
                    title: 'Шаблон создан',
                    description: 'Интеллектуальный шаблон готов к использованию',
                });
            }
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Failed to save template', error);
            toast({
                variant: 'destructive',
                title: 'Ошибка сохранения',
                description: error.response?.data?.detail || 'Не удалось сохранить шаблон',
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col border border-gray-100 overflow-hidden">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-slate-50 to-blue-50/40">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-500/20">
                            <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                {initialTemplate ? 'Редактирование Smart-Шаблона' : 'Конструктор Smart-Шаблона RegAI'}
                            </h2>
                            <p className="text-xs text-gray-500">
                                Интеллектуальный регламентный пайплайн финансовой трансформации и комплаенса
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Stepper Progress Bar */}
                <div className="px-6 py-3 border-b bg-gray-50/50">
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
                                            ? 'bg-blue-50 text-blue-800 hover:bg-blue-100'
                                            : 'bg-white text-gray-400 border hover:border-gray-300'
                                    }`}
                                >
                                    <div
                                        className={`flex items-center justify-center w-7 h-7 rounded-lg text-xs font-semibold ${
                                            isCurrent
                                                ? 'bg-white/20 text-white'
                                                : isCompleted
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-600'
                                        }`}
                                    >
                                        {isCompleted ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                                    </div>
                                    <div className="min-w-0 hidden sm:block">
                                        <div className="text-xs font-bold truncate leading-tight">{step.title}</div>
                                        <div className={`text-[10px] truncate ${isCurrent ? 'text-blue-100' : 'text-gray-400'}`}>
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
                                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                    <Scale className="h-5 w-5 text-blue-600" /> Шаг 1: Название, назначение и юрисдикция
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Определите регуляторную сферу применения шаблона и стандарты финансового учета
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-xs font-semibold text-gray-700">Название шаблона *</label>
                                    <Input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Например: Трансформация МСФО 16: Аренда и сверка капитала"
                                        className="h-10 text-sm font-medium"
                                    />
                                </div>

                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-xs font-semibold text-gray-700">Описание и назначение</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Опишите цель формирования отчета, обязательные раскрытия и контролируемые риски..."
                                        rows={2}
                                        className="w-full text-xs rounded-lg border border-input p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-700">Категория отчета *</label>
                                    <select
                                        value={reportType}
                                        onChange={(e) => setReportType(e.target.value)}
                                        className="w-full h-10 rounded-lg border border-input px-3 text-xs bg-white font-medium focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="financial">МСФО Трансформация (Financial)</option>
                                        <option value="compliance">Налоговый комплаенс (Compliance)</option>
                                        <option value="audit">Аудит и сверка ОСВ (Audit Reconciliation)</option>
                                        <option value="risk_assessment">Оценка рисков и ESG (Risk Analysis)</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-700">Юрисдикция / Страна *</label>
                                    <select
                                        value={countryCode}
                                        onChange={(e) => setCountryCode(e.target.value)}
                                        className="w-full h-10 rounded-lg border border-input px-3 text-xs bg-white font-medium focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="UZ">🇺🇿 Узбекистан (Uzbekistan)</option>
                                        <option value="KZ">🇰🇿 Казахстан (Kazakhstan)</option>
                                        <option value="GB">🇬🇧 Великобритания (United Kingdom)</option>
                                        <option value="US">🇺🇸 США (United States)</option>
                                        <option value="DE">🇩🇪 Германия / ЕС (Germany / EU)</option>
                                        <option value="GLOBAL">🌐 Глобальный международный (Global)</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-700">Исходный стандарт учета</label>
                                    <select
                                        value={sourceStandard}
                                        onChange={(e) => setSourceStandard(e.target.value)}
                                        className="w-full h-10 rounded-lg border border-input px-3 text-xs bg-white font-medium focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="NAS">НСБУ Республики Узбекистан (NAS / НАС)</option>
                                        <option value="1C_COA">1С:Типовой план счетов (План счетов 1С)</option>
                                        <option value="RSBU">РСБУ (Российские стандарты учета)</option>
                                        <option value="GRI">GRI / Локальный управленческий учет</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-700">Целевой стандарт комплаенса</label>
                                    <select
                                        value={targetStandard}
                                        onChange={(e) => setTargetStandard(e.target.value)}
                                        className="w-full h-10 rounded-lg border border-input px-3 text-xs bg-white font-medium focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="IFRS">МСФО (IFRS — International Standards)</option>
                                        <option value="TAX_CODE">Налоговый кодекс (ГНК РУз / Налоговые декларации)</option>
                                        <option value="US_GAAP">US GAAP (Американские стандарты)</option>
                                        <option value="IFRS_S1_S2">IFRS S1 / S2 (Климатический комплаенс)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Data Source */}
                    {currentStep === 2 && (
                        <div className="space-y-5 animate-in fade-in-50 duration-150">
                            <div>
                                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                    <Server className="h-5 w-5 text-blue-600" /> Шаг 2: Источник данных и счета учета
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Укажите, откуда шаблон будет получать исходную оборотно-сальдовую ведомость (ОСВ)
                                </p>
                            </div>

                            {/* Data Source Type Selector Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {[
                                    {
                                        id: 'onec_sync',
                                        title: '1С:Предприятие',
                                        subtitle: 'Прямая синхронизация по OData/REST',
                                        icon: Server,
                                        color: 'amber'
                                    },
                                    {
                                        id: 'excel_upload',
                                        title: 'Excel / CSV файл',
                                        subtitle: 'Импорт файла ОСВ по макету',
                                        icon: FileSpreadsheet,
                                        color: 'emerald'
                                    },
                                    {
                                        id: 'manual_entry',
                                        title: 'Выбор баланса',
                                        subtitle: 'Использование ранее созданного баланса',
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
                                                    ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                                    <Icon className="h-4 w-4" />
                                                </div>
                                                <span className="text-xs font-bold text-gray-900">{src.title}</span>
                                            </div>
                                            <p className="text-[11px] text-gray-500 leading-tight">{src.subtitle}</p>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Required Accounts Picker */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-semibold text-gray-700">
                                        Обязательные классы счетов ОСВ ({requiredAccounts.length} выбрано):
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setRequiredAccounts(ACCOUNT_OPTIONS.map(a => a.code))}
                                        className="text-[11px] text-blue-600 hover:underline font-medium"
                                    >
                                        Выбрать все счета
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
                                                        ? 'bg-blue-50 border-blue-400 text-blue-900 font-medium'
                                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                                }`}
                                            >
                                                <span className="font-mono font-bold px-1.5 py-0.5 bg-white rounded border text-[10px]">
                                                    {acc.code}
                                                </span>
                                                <span className="truncate">{acc.name}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="p-3 bg-gray-50 rounded-xl border flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <div className="text-xs font-semibold text-gray-900">Строгая верификация структуры колонок</div>
                                    <div className="text-[11px] text-gray-500">
                                        Требовать обязательное наличие сальдо на начало, оборотов Дт/Кт и конечного сальдо
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
                                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                    <Layers className="h-5 w-5 text-blue-600" /> Шаг 3: Бухгалтерская логика и пакеты МСФО
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Настройте автоматические корректировки и правила защиты двойной записи
                                </p>
                            </div>

                            <div className="space-y-2.5">
                                <label className="text-xs font-semibold text-gray-700">
                                    Активные пакеты трансформационных проводок:
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
                                                        ? 'border-indigo-500 bg-indigo-50/40 shadow-xs'
                                                        : 'border-gray-200 bg-white hover:border-gray-300'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs font-bold text-gray-900">{std.label}</span>
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={() => {}}
                                                        className="h-4 w-4 rounded text-indigo-600"
                                                    />
                                                </div>
                                                <p className="text-[11px] text-gray-600 leading-snug">{std.desc}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Double-Entry Guard Callout */}
                            <div className="p-4 rounded-xl border-2 border-emerald-300 bg-emerald-50/60 space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="h-5 w-5 text-emerald-600" />
                                        <span className="text-xs font-bold text-emerald-900">
                                            Double-Entry Balance Guard (Контроль сходимости капитала)
                                        </span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={enforceZeroDelta}
                                        onChange={(e) => setEnforceZeroDelta(e.target.checked)}
                                        className="h-4 w-4 rounded text-emerald-600"
                                    />
                                </div>
                                <p className="text-[11px] text-emerald-800">
                                    При расчете обесценения (IAS 36) и резерва (IFRS 9) движок автоматически проводит парные записи
                                    в Нераспределенную прибыль (счет 84), гарантируя нулевое расхождение ($\Delta = 0.00$) между активами и пассивами.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: AI Directives */}
                    {currentStep === 4 && (
                        <div className="space-y-5 animate-in fade-in-50 duration-150">
                            <div>
                                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                    <Brain className="h-5 w-5 text-purple-600" /> Шаг 4: Директивы для нейросети RegAI
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Задайте специализированные инструкции и пороговые триггеры рисков для ИИ-аудита
                                </p>
                            </div>

                            <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <Brain className="h-5 w-5 text-purple-600" />
                                    <div>
                                        <div className="text-xs font-semibold text-purple-900">Включить автоматический ИИ-аудит</div>
                                        <div className="text-[11px] text-purple-700">Генерировать аудиторское заключение и выявлять риски</div>
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
                                            <label className="text-xs font-semibold text-gray-700">Роль ИИ-эксперта</label>
                                            <select
                                                value={aiRole}
                                                onChange={(e) => setAiRole(e.target.value)}
                                                className="w-full h-9 rounded-lg border border-input px-3 text-xs bg-white font-medium"
                                            >
                                                <option value="Senior IFRS Big 4 Auditor">Старший аудитор Big 4 по МСФО</option>
                                                <option value="Tax Compliance Advisor (UZ/CIS)">Налоговый консультант (Узбекистан / СНГ)</option>
                                                <option value="Forensic & Fraud Investigator">Специалист по форензик и выявлению искажений</option>
                                                <option value="ESG & Sustainability Lead">ESG и комплаенс-аналитик</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-gray-700">Язык аудиторских замечаний</label>
                                            <select
                                                value={outputLanguage}
                                                onChange={(e) => setOutputLanguage(e.target.value)}
                                                className="w-full h-9 rounded-lg border border-input px-3 text-xs bg-white font-medium"
                                            >
                                                <option value="ru">Русский язык (RU)</option>
                                                <option value="uz">Узбекский язык (O'zbek tili)</option>
                                                <option value="en">Английский язык (English)</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Presets */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-semibold text-gray-700">Промпт-инструкция для ИИ</label>
                                            <div className="flex gap-1">
                                                {Object.entries({
                                                    'МСФО 16': 'ifrs_full',
                                                    'Налоги': 'tax_audit',
                                                    'ОСВ 1С': 'general_ledger'
                                                }).map(([label, key]) => (
                                                    <button
                                                        key={key}
                                                        type="button"
                                                        onClick={() => setAiPrompt(PRESET_AI_PROMPTS[key])}
                                                        className="px-2 py-0.5 text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
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
                                            className="w-full text-xs rounded-lg border border-input p-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                                            placeholder="Введите системную директиву для нейросети..."
                                        />
                                    </div>

                                    {/* Risk Triggers */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-700">Триггеры автоматических предупреждений:</label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {[
                                                { id: 'unbalanced_equity', label: '🔴 Расхождение баланса > 0' },
                                                { id: 'undisclosed_lease_terms', label: '🟡 Нераскрытые условия аренды' },
                                                { id: 'stale_receivables', label: '🟠 Дебиторка > 90 дней без резерва' },
                                                { id: 'vat_gap', label: '🔴 Разрыв по НДС и выручке' },
                                                { id: 'abnormal_turnover', label: '🟡 Нетипичные обороты по счету 84' }
                                            ].map(t => {
                                                const isSelected = riskTriggers.includes(t.id);
                                                return (
                                                    <button
                                                        key={t.id}
                                                        type="button"
                                                        onClick={() => toggleRiskTrigger(t.id)}
                                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                                                            isSelected
                                                                ? 'bg-purple-100 text-purple-900 border border-purple-300'
                                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
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
                                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                    <Workflow className="h-5 w-5 text-blue-600" /> Шаг 5: Маршрут согласования и финальная сводка
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Установите периодичность формирования и проверьте готовность шаблона
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl border bg-gray-50/50 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-gray-900">Регулярное авто-создание драфта</span>
                                        <input
                                            type="checkbox"
                                            checked={isRecurring}
                                            onChange={(e) => setIsRecurring(e.target.checked)}
                                            className="h-4 w-4 rounded text-blue-600"
                                        />
                                    </div>
                                    {isRecurring && (
                                        <div className="space-y-1">
                                            <label className="text-xs text-gray-600">Периодичность формирования:</label>
                                            <select
                                                value={recurrencePattern}
                                                onChange={(e) => setRecurrencePattern(e.target.value)}
                                                className="w-full h-9 rounded-lg border border-input px-3 text-xs bg-white font-medium"
                                            >
                                                <option value="monthly">Ежемесячно (к 5-му числу месяца)</option>
                                                <option value="quarterly">Ежеквартально (по итогам квартала)</option>
                                                <option value="yearly">Ежегодно (годовая отчетность)</option>
                                            </select>
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 rounded-xl border bg-gray-50/50 space-y-2">
                                    <span className="text-xs font-semibold text-gray-900 block">Цепочка согласования (Workflow):</span>
                                    <div className="space-y-1.5 text-xs text-gray-700">
                                        <div className="flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[10px]">1</span>
                                            <span><strong>Бухгалтер:</strong> Загрузка ОСВ / запуск трансформации</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-[10px]">2</span>
                                            <span><strong>Аудитор:</strong> Проверка сходимости и ИИ-заключения</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px]">3</span>
                                            <span><strong>Директор:</strong> Финальное утверждение и экспорт</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Live Blueprint Summary Card */}
                            <div className="p-4 rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50/60 to-indigo-50/40 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="h-4 w-4 text-blue-600" />
                                        <span className="text-xs font-bold text-blue-950 uppercase tracking-wider">
                                            Итоговый паспорт шаблона (Smart Blueprint)
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                                        Готов к запуску
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                    <div className="bg-white/80 p-2 rounded-lg border border-blue-100">
                                        <span className="text-[10px] text-gray-500 block">Название:</span>
                                        <span className="font-semibold text-gray-900 truncate block">{name || 'Не указано'}</span>
                                    </div>
                                    <div className="bg-white/80 p-2 rounded-lg border border-blue-100">
                                        <span className="text-[10px] text-gray-500 block">Переход:</span>
                                        <span className="font-semibold text-blue-700">{sourceStandard} ➔ {targetStandard}</span>
                                    </div>
                                    <div className="bg-white/80 p-2 rounded-lg border border-blue-100">
                                        <span className="text-[10px] text-gray-500 block">Источник:</span>
                                        <span className="font-semibold capitalize text-gray-900">{dataSourceType.replace('_', ' ')}</span>
                                    </div>
                                    <div className="bg-white/80 p-2 rounded-lg border border-blue-100">
                                        <span className="text-[10px] text-gray-500 block">Стандарты:</span>
                                        <span className="font-semibold text-indigo-700">{activeStandards.join(', ') || 'Базовый'}</span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-1.5 pt-1">
                                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                                        ✓ Double-Entry Guard: Zero Delta
                                    </span>
                                    {aiEnabled && (
                                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
                                            ✓ ИИ-экспертиза: {aiRole}
                                        </span>
                                    )}
                                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                                        ✓ Счетов в ОСВ: {requiredAccounts.length}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal Footer Controls */}
                <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50/50">
                    <div>
                        {currentStep > 1 && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentStep(prev => prev - 1)}
                            >
                                <ChevronLeft className="mr-1 h-4 w-4" /> Назад
                            </Button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                        >
                            Отмена
                        </Button>

                        {currentStep < 5 ? (
                            <Button
                                type="button"
                                size="sm"
                                onClick={() => {
                                    if (currentStep === 1 && !name.trim()) {
                                        toast({
                                            variant: 'destructive',
                                            title: 'Ошибка',
                                            description: 'Укажите название шаблона перед переходом дальше'
                                        });
                                        return;
                                    }
                                    setCurrentStep(prev => prev + 1);
                                }}
                            >
                                Далее <ChevronRight className="ml-1 h-4 w-4" />
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
                                {initialTemplate ? 'Сохранить изменения' : 'Создать Smart-Шаблон'}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
