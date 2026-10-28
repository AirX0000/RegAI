import { useState, useEffect } from 'react';
import { tr } from '@/lib/i18n';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import api from '../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Trash2, ArrowLeft, ArrowRight, CheckCircle2, Calculator, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { cn } from "@/lib/utils";
import { useTranslation } from 'react-i18next';

interface BalanceSheetItem {
    account_code: string;
    account_name: string;
    amount: number;
    category: 'assets' | 'liabilities' | 'equity';
    subcategory: string;
}

interface BalanceSheetFormData {
    period: string;
    notes: string;
    items: BalanceSheetItem[];
}

type Step = 'selection' | 'assets' | 'liabilities' | 'equity' | 'review';

export default function BalanceSheetForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { toast } = useToast();
    const { i18n } = useTranslation();
    const isRu = (i18n.language || 'ru').toLowerCase().startsWith('ru');
    const isUz = (i18n.language || 'ru').toLowerCase().startsWith('uz');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentStep, setCurrentStep] = useState<Step>('selection');
    const [completedSteps, setCompletedSteps] = useState<Set<Step>>(new Set());
    const [activeTemplate, setActiveTemplate] = useState<{ id: string; title: string; category?: string; standard?: string; tags?: string[] } | null>(() => {
        try {
            const stored = localStorage.getItem('selected_transformation_template');
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });

    const { register, control, handleSubmit, watch, setValue } = useForm<BalanceSheetFormData>({
        defaultValues: {
            period: new Date().toISOString().slice(0, 7), // YYYY-MM format
            notes: '',
            items: []
        }
    });

    const { fields, append, remove, replace } = useFieldArray({
        control,
        name: 'items'
    });

    useEffect(() => {
        if (!id) return;
        const loadExistingSheet = async () => {
            try {
                const res = await api.get(`/balance-sheets/${id}`);
                const data = res.data;
                if (data) {
                    if (data.period) {
                        setValue('period', String(data.period).slice(0, 7));
                    }
                    if (data.notes) {
                        setValue('notes', data.notes);
                    }
                    if (Array.isArray(data.items) && data.items.length > 0) {
                        replace(data.items.map((i: any) => ({
                            account_code: i.account_code || '',
                            account_name: i.account_name || '',
                            amount: Number(i.amount) || 0,
                            category: i.category || 'assets',
                            subcategory: i.subcategory || ''
                        })));
                        setCurrentStep('review');
                    } else {
                        setCurrentStep('assets');
                    }
                }
            } catch (err) {
                console.error('Failed to load balance sheet', err);
            }
        };
        loadExistingSheet();
    }, [id, setValue, replace]);

    const items = watch('items');

    // Calculate totals
    const calculateTotal = (category: string) => {
        return items
            .filter(item => item.category === category)
            .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    };

    const totalAssets = calculateTotal('assets');
    const totalLiabilities = calculateTotal('liabilities');
    const totalEquity = calculateTotal('equity');
    const isBalanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01;

    const onSubmit = async (data: BalanceSheetFormData) => {
        if (!data.items || data.items.length === 0) {
            toast({
                title: isUz ? "Balans bo'sh" : tr('Баланс пуст', 'Balance Sheet Empty'),
                description: isUz ? "Kamida bitta aktiv yoki majburiyat qatorini qo'shing" : tr('Добавьте хотя бы одну строку активов или пассивов', 'Please add at least one line item'),
                variant: 'destructive'
            });
            return;
        }

        if (!isBalanced) {
            toast({
                title: isUz ? "Balans teng kelmadi" : tr('Баланс не сходится', 'Balance Sheet Not Balanced'),
                description: isUz ? "Aktivlar summasi Majburiyatlar va Kapital yig'indisiga qat'iy teng bo'lishi kerak" : tr('Сумма Активов должна быть строго равна сумме Обязательств и Капитала', 'Assets must equal Liabilities + Equity'),
                variant: 'destructive'
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                period: new Date(data.period + '-01').toISOString(),
                notes: data.notes,
                items: data.items.map(item => ({
                    ...item,
                    amount: Number(item.amount)
                }))
            };

            let response;
            if (id) {
                response = await api.put(`/balance-sheets/${id}`, payload);
            } else {
                response = await api.post('/balance-sheets/', payload);
            }

            localStorage.removeItem('selected_transformation_template');
            toast({
                title: tr('Успешно', 'Success'),
                description: isRu ? (id ? 'Бухгалтерский баланс успешно сохранён' : 'Бухгалтерский баланс успешно создан') : 'Balance sheet saved successfully'
            });
            if (id) {
                navigate('/transformation');
            } else {
                const targetId = response.data?.id;
                navigate(`/transformation/adjustments/${targetId}`);
            }
        } catch (error: any) {
            console.error('Failed to save balance sheet', error);
            toast({
                title: tr('Ошибка', 'Error'),
                description: error.response?.data?.detail || (tr('Не удалось сохранить баланс', 'Failed to save balance sheet')),
                variant: 'destructive'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const addItem = (category: 'assets' | 'liabilities' | 'equity') => {
        const subcategories = {
            assets: tr('Оборотные активы', 'Current Assets'),
            liabilities: tr('Краткосрочные обязательства', 'Current Liabilities'),
            equity: tr('Уставный капитал', 'Share Capital')
        };
        append({
            account_code: '',
            account_name: '',
            amount: 0,
            category,
            subcategory: subcategories[category]
        });
    };

    const handleStepComplete = (step: Step, nextStep: Step) => {
        setCompletedSteps(prev => new Set(prev).add(step));
        setCurrentStep(nextStep);
    };

    const renderStepIndicator = () => {
        const steps: { id: Step; label: string }[] = [
            { id: 'selection', label: tr('Старт', 'Start') },
            { id: 'assets', label: tr('Активы', 'Assets') },
            { id: 'liabilities', label: tr('Обязательства', 'Liabilities') },
            { id: 'equity', label: tr('Капитал', 'Equity') },
            { id: 'review', label: tr('Проверка', 'Review') }
        ];

        return (
            <div className="flex items-center justify-center mb-8 flex-wrap gap-y-2">
                {steps.map((step, index) => (
                    <div 
                        key={step.id} 
                        onClick={() => setCurrentStep(step.id)}
                        className="flex items-center cursor-pointer select-none group"
                        title={tr(`Перейти: ${step.label}`, `Go to ${step.label}`)}
                    >
                        <div className={cn(
                            "flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium transition-all group-hover:scale-110",
                            currentStep === step.id
                                ? "border-cyan-500 bg-cyan-500 text-white shadow-md shadow-cyan-500/20"
                                : completedSteps.has(step.id) || (items.length > 0 && step.id === 'review')
                                    ? "border-emerald-500 bg-emerald-500 text-white"
                                    : "border-gray-200 dark:border-[#162244] text-gray-400 dark:text-slate-500 bg-white dark:bg-[#070c1e]"
                        )}>
                            {completedSteps.has(step.id) || (items.length > 0 && step.id === 'review') ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
                        </div>
                        <span className={cn(
                            "ml-2 text-sm font-medium transition-colors group-hover:text-cyan-500",
                            currentStep === step.id 
                                ? "text-cyan-600 dark:text-cyan-400 font-bold" 
                                : "text-gray-500 dark:text-slate-400"
                        )}>
                            {step.label}
                        </span>
                        {index < steps.length - 1 && (
                            <div className={cn(
                                "w-12 h-0.5 mx-4 hidden sm:block",
                                completedSteps.has(step.id) || items.length > 0 ? "bg-emerald-500" : "bg-gray-200 dark:bg-[#162244]"
                            )} />
                        )}
                    </div>
                ))}
            </div>
        );
    };

    const renderDataEntry = (category: 'assets' | 'liabilities' | 'equity', title: string, colorClass: string, nextStep: Step) => {
        const categoryItems = fields.map((field, index) => ({ ...field, index })).filter(f => items[f.index]?.category === category);
        const total = calculateTotal(category);

        return (
            <Card className="border-slate-200 dark:border-[#162244] bg-white dark:bg-[#0b1228] shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-[#162244] pb-4">
                    <div>
                        <CardTitle className={cn("text-2xl font-bold", colorClass)}>{title}</CardTitle>
                        <CardDescription className="text-slate-500 dark:text-slate-400">
                            {tr(`Введите статьи раздела «${title}»`, `Enter your ${title.toLowerCase()} line items`)}
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">{tr(`Всего (${title})`, `Total ${title}`)}</p>
                            <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white">${total.toLocaleString()}</p>
                        </div>
                        <Button
                            type="button"
                            onClick={() => addItem(category)}
                            className="bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 hover:from-cyan-400 hover:via-blue-500 hover:to-violet-500 text-white font-medium shadow-md shadow-cyan-500/20"
                        >
                            <Plus className="mr-1 h-4 w-4" />
                            {tr('Добавить статью', 'Add Item')}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="space-y-4">
                        {categoryItems.length === 0 ? (
                            <div className="text-center py-12 bg-slate-50/60 dark:bg-[#070c1e] rounded-xl border-2 border-dashed border-slate-200 dark:border-[#162244]">
                                <p className="text-slate-500 dark:text-slate-400 font-medium">
                                    {tr('Статьи еще не добавлены.', 'No items added yet.')}
                                </p>
                                <Button
                                    type="button"
                                    variant="link"
                                    onClick={() => addItem(category)}
                                    className="text-cyan-600 dark:text-cyan-400 font-semibold hover:underline mt-1"
                                >
                                    {tr('Добавить первую запись', `Add your first ${category === 'equity' ? 'equity item' : category === 'liabilities' ? 'liability' : 'asset'}`)}
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-2">
                                    <div className="col-span-2">{tr('Код', 'Code')}</div>
                                    <div className="col-span-4">{tr('Наименование статьи', 'Account Name')}</div>
                                    <div className="col-span-2">{tr('Сумма', 'Amount')}</div>
                                    <div className="col-span-3">{tr('Подкатегория', 'Subcategory')}</div>
                                    <div className="col-span-1"></div>
                                </div>
                                {categoryItems.map(({ id, index }) => (
                                    <div key={id} className="grid grid-cols-12 gap-2 items-center bg-white dark:bg-[#070c1e] p-2.5 rounded-lg border border-slate-200 dark:border-[#162244] hover:border-cyan-400 dark:hover:border-cyan-500/50 transition-colors shadow-xs">
                                        <Input
                                            {...register(`items.${index}.account_code` as const)}
                                            placeholder={tr('Код', 'Code')}
                                            className="col-span-2 bg-white dark:bg-[#050814] border-slate-200 dark:border-[#162244] text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                                        />
                                        <Input
                                            {...register(`items.${index}.account_name` as const)}
                                            placeholder={tr('Наименование', 'Account Name')}
                                            className="col-span-4 bg-white dark:bg-[#050814] border-slate-200 dark:border-[#162244] text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                                        />
                                        <Input
                                            {...register(`items.${index}.amount` as const, { valueAsNumber: true })}
                                            type="number"
                                            step="0.01"
                                            placeholder={tr('Сумма', 'Amount')}
                                            className="col-span-2 font-mono bg-white dark:bg-[#050814] border-slate-200 dark:border-[#162244] text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                                        />
                                        <select
                                            {...register(`items.${index}.subcategory` as const)}
                                            className="col-span-3 rounded-md border border-slate-200 dark:border-[#162244] p-2 bg-white dark:bg-[#050814] text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                        >
                                            {category === 'assets' && (
                                                <>
                                                    <option>{tr('Оборотные активы', 'Current Assets')}</option>
                                                    <option>{tr('Внеоборотные активы', 'Non-Current Assets')}</option>
                                                    <option>{tr('Основные средства', 'Fixed Assets')}</option>
                                                    <option>{tr('Нематериальные активы', 'Intangible Assets')}</option>
                                                </>
                                            )}
                                            {category === 'liabilities' && (
                                                <>
                                                    <option>{tr('Краткосрочные обязательства', 'Current Liabilities')}</option>
                                                    <option>{tr('Долгосрочные обязательства', 'Non-Current Liabilities')}</option>
                                                    <option>{tr('Долгосрочные кредиты и займы', 'Long-term Debt')}</option>
                                                </>
                                            )}
                                            {category === 'equity' && (
                                                <>
                                                    <option>{tr('Уставный капитал', 'Share Capital')}</option>
                                                    <option>{tr('Нераспределенная прибыль', 'Retained Earnings')}</option>
                                                    <option>{tr('Резервный капитал', 'Reserves')}</option>
                                                </>
                                            )}
                                        </select>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => remove(index)}
                                            className="col-span-1 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="flex justify-between mt-8 pt-4 border-t border-slate-100 dark:border-[#162244]">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setCurrentStep('selection')}
                            className="border-slate-300 dark:border-[#162244] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#121c3d]"
                        >
                            {tr('Назад к разделам', 'Back to Selection')}
                        </Button>
                        <Button
                            type="button"
                            onClick={() => handleStepComplete(category, nextStep)}
                            className="bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 hover:from-cyan-400 hover:via-blue-500 hover:to-violet-500 text-white font-medium shadow-md shadow-cyan-500/20"
                        >
                            {tr('Далее', 'Continue')}
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Button variant="ghost" onClick={() => navigate('/transformation')} className="mb-2">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        {tr('Назад к панели проектов', 'Back to Dashboard')}
                    </Button>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {id
                            ? (tr('Редактирование бухгалтерского баланса', 'Edit Balance Sheet'))
                            : (tr('Новый проект трансформации', 'New Transformation Project'))}
                    </h1>
                    <p className="text-gray-500 mt-1">
                        {id
                            ? (tr('Редактирование исходных данных НСБУ и статей баланса', 'Edit baseline NAS data and balance sheet line items'))
                            : (tr('Введите исходные данные НСБУ для начала перехода к МСФО', 'Enter NAS (НСБУ) data to begin transformation to IFRS'))}
                    </p>
                </div>
            </div>

            {activeTemplate && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-[#162244] rounded-xl p-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg shadow-sm">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold uppercase tracking-wider text-cyan-700 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-200 dark:border-cyan-800/40">
                                    {activeTemplate.standard || 'NAS ➔ IFRS'}
                                </span>
                                <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100">
                                    {activeTemplate.title}
                                </h3>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                                {tr('Шаблон применен: правила трансформации и корректировки IFRS 16, IAS 36, IFRS 9 преднастроены для данного проекта.', 'Template applied: transformation rules and adjustments for IFRS 16, IAS 36, IFRS 9 are preconfigured.')}
                            </p>
                        </div>
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            localStorage.removeItem('selected_transformation_template');
                            setActiveTemplate(null);
                        }}
                        className="text-xs text-gray-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400"
                    >
                        {tr('Сбросить шаблон', 'Reset template')}
                    </Button>
                </div>
            )}

            {renderStepIndicator()}

            <form onSubmit={handleSubmit(onSubmit, (errors) => console.error('Form Errors:', errors))} className="space-y-6">
                {/* Step 1: Selection & Basic Info */}
                {currentStep === 'selection' && (
                    <div className="space-y-6">
                        <Card className="border-slate-200 dark:border-[#162244] bg-white dark:bg-[#0b1228] shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-slate-900 dark:text-slate-100">{tr('Параметры проекта', 'Project Details')}</CardTitle>
                                <CardDescription className="text-slate-500 dark:text-slate-400">
                                    {tr('Укажите отчетный период и сопроводительную информацию', 'Set the reporting period and basic information')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                                            {tr('Отчетный период', 'Reporting Period')}
                                        </label>
                                        <Input
                                            type="month"
                                            {...register('period', { required: true })}
                                            className="bg-white dark:bg-[#050814] border-slate-200 dark:border-[#162244] text-slate-900 dark:text-slate-100"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                                            {tr('Примечания (опционально)', 'Notes (Optional)')}
                                        </label>
                                        <Input
                                            {...register('notes')}
                                            placeholder={tr('например, Фин. отчетность за 3 кв. 2024', 'e.g., Q3 2024 Financials')}
                                            className="bg-white dark:bg-[#050814] border-slate-200 dark:border-[#162244] text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {items.length > 0 && (
                            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-emerald-500 text-white rounded-lg shadow-sm">
                                        <CheckCircle2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                            {tr(`Загружено ${items.length} статей из файла`, `${items.length} line items loaded from file`)}
                                        </h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                            {isBalanced 
                                                ? (tr(`✓ Баланс сходится: Активы (${totalAssets.toLocaleString()} UZS) = Пассивы (${(totalLiabilities + totalEquity).toLocaleString()} UZS)`, '✓ Balance Sheet equilibrium verified'))
                                                : (tr(`Внимание: расхождение ${Math.abs(totalAssets - (totalLiabilities + totalEquity)).toLocaleString()} UZS`, 'Notice: Check balance equilibrium'))}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    onClick={() => setCurrentStep('review')}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 shrink-0"
                                >
                                    {tr('Открыть сводную таблицу (Шаг 5)', 'Summary Review (Step 5)')}
                                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                                </Button>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="border-slate-200 dark:border-[#162244] bg-white dark:bg-[#0b1228] hover:border-emerald-500 dark:hover:border-emerald-500 cursor-pointer transition-all hover:shadow-md" onClick={() => setCurrentStep('assets')}>
                                <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                                    <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                        {items.filter(i => i.category === 'assets').length > 0 ? <CheckCircle2 className="w-8 h-8" /> : <Plus className="w-8 h-8" />}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">{tr('Активы', 'Enter Assets')}</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            {items.filter(i => i.category === 'assets').length > 0
                                                ? (tr(`${items.filter(i => i.category === 'assets').length} статей • ${totalAssets.toLocaleString()} UZS`, `${items.filter(i => i.category === 'assets').length} items`))
                                                : (tr('Денежные средства, запасы, дебиторка...', 'Cash, Inventory, Receivables...'))}
                                        </p>
                                    </div>
                                    <Button variant={items.filter(i => i.category === 'assets').length > 0 ? "secondary" : "outline"} className="w-full border-slate-200 dark:border-[#162244] dark:hover:bg-[#121c3d]">
                                        {items.filter(i => i.category === 'assets').length > 0 ? (tr(`Просмотреть статьи (${items.filter(i => i.category === 'assets').length})`, `View items`)) : (tr('Заполнить', 'Start'))}
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card className="border-slate-200 dark:border-[#162244] bg-white dark:bg-[#0b1228] hover:border-rose-500 dark:hover:border-rose-500 cursor-pointer transition-all hover:shadow-md" onClick={() => setCurrentStep('liabilities')}>
                                <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                                    <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
                                        {items.filter(i => i.category === 'liabilities').length > 0 ? <CheckCircle2 className="w-8 h-8" /> : <Plus className="w-8 h-8" />}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">{tr('Обязательства', 'Enter Liabilities')}</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            {items.filter(i => i.category === 'liabilities').length > 0
                                                ? (tr(`${items.filter(i => i.category === 'liabilities').length} статей • ${totalLiabilities.toLocaleString()} UZS`, `${items.filter(i => i.category === 'liabilities').length} items`))
                                                : (tr('Кредиторка, кредиты, резервы...', 'Payables, Loans, Provisions...'))}
                                        </p>
                                    </div>
                                    <Button variant={items.filter(i => i.category === 'liabilities').length > 0 ? "secondary" : "outline"} className="w-full border-slate-200 dark:border-[#162244] dark:hover:bg-[#121c3d]">
                                        {items.filter(i => i.category === 'liabilities').length > 0 ? (tr(`Просмотреть статьи (${items.filter(i => i.category === 'liabilities').length})`, `View items`)) : (tr('Заполнить', 'Start'))}
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card className="border-slate-200 dark:border-[#162244] bg-white dark:bg-[#0b1228] hover:border-cyan-500 dark:hover:border-cyan-500 cursor-pointer transition-all hover:shadow-md" onClick={() => setCurrentStep('equity')}>
                                <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                                    <div className="w-16 h-16 rounded-full bg-cyan-100 dark:bg-cyan-950/60 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                                        {items.filter(i => i.category === 'equity').length > 0 ? <CheckCircle2 className="w-8 h-8" /> : <Plus className="w-8 h-8" />}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">{tr('Собственный капитал', 'Enter Equity')}</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            {items.filter(i => i.category === 'equity').length > 0
                                                ? (tr(`${items.filter(i => i.category === 'equity').length} статей • ${totalEquity.toLocaleString()} UZS`, `${items.filter(i => i.category === 'equity').length} items`))
                                                : (tr('Уставный капитал, резервы, прибыль...', 'Capital, Reserves, Earnings...'))}
                                        </p>
                                    </div>
                                    <Button variant={items.filter(i => i.category === 'equity').length > 0 ? "secondary" : "outline"} className="w-full border-slate-200 dark:border-[#162244] dark:hover:bg-[#121c3d]">
                                        {items.filter(i => i.category === 'equity').length > 0 ? (tr(`Просмотреть статьи (${items.filter(i => i.category === 'equity').length})`, `View items`)) : (tr('Заполнить', 'Start'))}
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="flex justify-end">
                            <Button
                                type="button"
                                onClick={() => setCurrentStep('review')}
                                disabled={items.length === 0}
                                className="bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 hover:from-cyan-400 hover:via-blue-500 hover:to-violet-500 text-white font-medium shadow-md shadow-cyan-500/20 disabled:opacity-50"
                            >
                                {tr(`Перейти к проверке статей (${items.length})`, `Review Line Items (${items.length})`)}
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 2: Data Entry */}
                {currentStep === 'assets' && renderDataEntry('assets', tr('Активы', 'Assets'), 'text-emerald-600 dark:text-emerald-400', 'liabilities')}
                {currentStep === 'liabilities' && renderDataEntry('liabilities', tr('Обязательства', 'Liabilities'), 'text-rose-600 dark:text-rose-400', 'equity')}
                {currentStep === 'equity' && renderDataEntry('equity', tr('Капитал', 'Equity'), 'text-cyan-600 dark:text-cyan-400', 'review')}

                {/* Step 3: Review */}
                {currentStep === 'review' && (
                    <div className="space-y-6">
                        <Card className={cn(
                            "shadow-sm transition-all border",
                            isBalanced 
                                ? 'border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/20' 
                                : 'border-rose-500/30 bg-rose-50/20 dark:bg-rose-950/20'
                        )}>
                            <CardContent className="pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                                    <div className="p-4 bg-white dark:bg-[#070c1e] rounded-xl border border-slate-200 dark:border-[#162244] shadow-xs">
                                        <div className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">{tr('Итого активы', 'Total Assets')}</div>
                                        <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">${totalAssets.toLocaleString()}</div>
                                    </div>
                                    <div className="p-4 bg-white dark:bg-[#070c1e] rounded-xl border border-slate-200 dark:border-[#162244] shadow-xs">
                                        <div className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">{tr('Итого обязательства', 'Total Liabilities')}</div>
                                        <div className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">${totalLiabilities.toLocaleString()}</div>
                                    </div>
                                    <div className="p-4 bg-white dark:bg-[#070c1e] rounded-xl border border-slate-200 dark:border-[#162244] shadow-xs">
                                        <div className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">{tr('Итого собственный капитал', 'Total Equity')}</div>
                                        <div className="text-2xl font-bold font-mono text-cyan-600 dark:text-cyan-400 mt-1">${totalEquity.toLocaleString()}</div>
                                    </div>
                                </div>
                                <div className="mt-6 text-center">
                                    {isBalanced ? (
                                        <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-base sm:text-lg">
                                            <CheckCircle2 className="w-6 h-6 shrink-0" />
                                            {tr('Баланс сведён без расхождений! Готово к трансформации в МСФО.', 'Balance Sheet is balanced! Ready for transformation.')}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-rose-600 dark:text-rose-400 font-medium">
                                            <div className="flex items-center gap-2 text-base sm:text-lg font-bold">
                                                <Trash2 className="w-5 h-5" />
                                                {tr('Баланс не сходится', 'Not Balanced')}
                                            </div>
                                            <p className="font-mono text-sm">${tr('Разница:', 'Difference:')} ${Math.abs(totalAssets - (totalLiabilities + totalEquity)).toLocaleString()}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{tr('Пожалуйста, скорректируйте статьи перед переходом.', 'Please adjust your entries before proceeding.')}</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="border-slate-200 dark:border-[#162244] bg-white dark:bg-[#0b1228]">
                                <CardHeader className="border-b border-slate-100 dark:border-[#162244] pb-3">
                                    <CardTitle className="text-emerald-600 dark:text-emerald-400">{tr('Активы', 'Assets')}</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <div className="space-y-2">
                                        {items.filter(i => i.category === 'assets').length === 0 ? (
                                            <p className="text-xs text-slate-400 italic py-2">{tr('Нет добавленных статей', 'No items added')}</p>
                                        ) : (
                                            items.filter(i => i.category === 'assets').map((item, idx) => (
                                                <div key={idx} className="flex justify-between text-sm border-b border-slate-100 dark:border-[#162244] pb-2 text-slate-800 dark:text-slate-200">
                                                    <span>{item.account_name || (tr('Без названия', 'Untitled'))}</span>
                                                    <span className="font-mono font-semibold">${Number(item.amount).toLocaleString()}</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                            <div className="space-y-6">
                                <Card className="border-slate-200 dark:border-[#162244] bg-white dark:bg-[#0b1228]">
                                    <CardHeader className="border-b border-slate-100 dark:border-[#162244] pb-3">
                                        <CardTitle className="text-rose-600 dark:text-rose-400">{tr('Обязательства', 'Liabilities')}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-4">
                                        <div className="space-y-2">
                                            {items.filter(i => i.category === 'liabilities').length === 0 ? (
                                                <p className="text-xs text-slate-400 italic py-2">{tr('Нет добавленных статей', 'No items added')}</p>
                                            ) : (
                                                items.filter(i => i.category === 'liabilities').map((item, idx) => (
                                                    <div key={idx} className="flex justify-between text-sm border-b border-slate-100 dark:border-[#162244] pb-2 text-slate-800 dark:text-slate-200">
                                                        <span>{item.account_name || (tr('Без названия', 'Untitled'))}</span>
                                                        <span className="font-mono font-semibold">${Number(item.amount).toLocaleString()}</span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="border-slate-200 dark:border-[#162244] bg-white dark:bg-[#0b1228]">
                                    <CardHeader className="border-b border-slate-100 dark:border-[#162244] pb-3">
                                        <CardTitle className="text-cyan-600 dark:text-cyan-400">{tr('Собственный капитал', 'Equity')}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-4">
                                        <div className="space-y-2">
                                            {items.filter(i => i.category === 'equity').length === 0 ? (
                                                <p className="text-xs text-slate-400 italic py-2">{tr('Нет добавленных статей', 'No items added')}</p>
                                            ) : (
                                                items.filter(i => i.category === 'equity').map((item, idx) => (
                                                    <div key={idx} className="flex justify-between text-sm border-b border-slate-100 dark:border-[#162244] pb-2 text-slate-800 dark:text-slate-200">
                                                        <span>{item.account_name || (tr('Без названия', 'Untitled'))}</span>
                                                        <span className="font-mono font-semibold">${Number(item.amount).toLocaleString()}</span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        <div className="flex justify-between pt-4 border-t border-slate-200 dark:border-[#162244]">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setCurrentStep('selection')}
                                className="border-slate-300 dark:border-[#162244] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#121c3d]"
                            >
                                {tr('Вернуться к редактированию', 'Back to Edit')}
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting || !isBalanced}
                                className="bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 hover:from-cyan-400 hover:via-blue-500 hover:to-violet-500 text-white text-base px-8 py-5 h-auto font-bold shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                            >
                                <Calculator className="mr-2 h-5 w-5" />
                                {isSubmitting ? (tr('Обработка...', 'Processing...')) : (tr('Начать трансформацию в МСФО', 'Start IFRS Transformation'))}
                            </Button>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
}
