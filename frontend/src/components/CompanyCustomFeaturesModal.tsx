import React, { useState } from 'react';
import { 
    X, 
    Sparkles, 
    Check, 
    Plus, 
    Search, 
    Sliders, 
    Info, 
    Crown
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useToast } from './ui/use-toast';
import { useTranslation } from 'react-i18next';
import api from '../lib/api';
import { 
    AVAILABLE_CUSTOM_FEATURES, 
    CustomFeatureDef, 
    getFeatureCategoryLabel 
} from '../lib/customFeatures';

interface CompanyCustomFeaturesModalProps {
    company: any;
    onClose: () => void;
    onSuccess: () => void;
}

export const CompanyCustomFeaturesModal: React.FC<CompanyCustomFeaturesModalProps> = ({
    company,
    onClose,
    onSuccess
}) => {
    const { i18n } = useTranslation();
    const currentLang = i18n.language || 'ru';
    const tr = (ruText: string, enText: string) => currentLang === 'en' ? enText : ruText;
    const { toast } = useToast();

    // Initial custom features list from company
    const parseInitialFeatures = (): string[] => {
        if (!company?.custom_features) return [];
        if (Array.isArray(company.custom_features)) return [...company.custom_features];
        try {
            return JSON.parse(company.custom_features);
        } catch {
            return [];
        }
    };

    const [selectedFeatures, setSelectedFeatures] = useState<string[]>(parseInitialFeatures());
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [newCustomKey, setNewCustomKey] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const plan = (company?.plan || 'free').toLowerCase();

    // Features included inherently by the plan
    const isIncludedByPlan = (featureKey: string): boolean => {
        if (plan === 'enterprise') return true;
        if (plan === 'premium') {
            return ['ai_auditor', 'onec_sync', 'ias12_tax', 'custom_reports'].includes(featureKey);
        }
        return false;
    };

    const toggleFeature = (key: string) => {
        if (selectedFeatures.includes(key)) {
            setSelectedFeatures(selectedFeatures.filter(k => k !== key));
        } else {
            setSelectedFeatures([...selectedFeatures, key]);
        }
    };

    const handleAddArbitraryFeature = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = newCustomKey.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
        if (!trimmed) return;

        if (selectedFeatures.includes(trimmed)) {
            toast({
                title: tr("Внимание", "Attention"),
                description: tr(`Функция "${trimmed}" уже добавлена`, `Feature "${trimmed}" is already added`),
            });
            return;
        }

        setSelectedFeatures([...selectedFeatures, trimmed]);
        setNewCustomKey('');
        toast({
            title: tr("Добавлено", "Added"),
            description: tr(`Функция "${trimmed}" включена для организации`, `Feature "${trimmed}" added`),
        });
    };

    const handleRemoveArbitraryFeature = (key: string) => {
        setSelectedFeatures(selectedFeatures.filter(k => k !== key));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Update company via PUT /companies/:id
            await api.put(`/companies/${company.id}`, {
                custom_features: selectedFeatures
            });

            // Also ensure mock company store has it if in mock/hybrid environment
            try {
                const storedRaw = localStorage.getItem('regai_mock_companies');
                if (storedRaw) {
                    const comps = JSON.parse(storedRaw);
                    const idx = comps.findIndex((c: any) => c.id === company.id);
                    if (idx !== -1) {
                        comps[idx] = { ...comps[idx], custom_features: selectedFeatures };
                        localStorage.setItem('regai_mock_companies', JSON.stringify(comps));
                    }
                }
            } catch {}

            toast({
                title: tr("Успешно сохранено", "Successfully Saved"),
                description: tr(
                    `Для организации "${company.name}" активировано ${selectedFeatures.length} доп. функций вне тарифа`,
                    `${selectedFeatures.length} custom add-ons activated for "${company.name}"`
                ),
            });
            onSuccess();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: tr("Ошибка сохранения", "Save Error"),
                description: error.response?.data?.detail || tr("Не удалось сохранить конфигурацию функций", "Failed to save feature configuration"),
            });
        } finally {
            setIsSaving(false);
        }
    };

    // Filter features
    const filteredFeatures = AVAILABLE_CUSTOM_FEATURES.filter(f => {
        const matchesCat = selectedCategory === 'all' || f.category === selectedCategory;
        const matchesSearch = 
            f.nameRu.toLowerCase().includes(searchTerm.toLowerCase()) ||
            f.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
            f.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
            f.descriptionRu.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCat && matchesSearch;
    });

    // Custom features that are not in the predefined list
    const predefinedKeys = AVAILABLE_CUSTOM_FEATURES.map(f => f.key);
    const customArbitraryFeatures = selectedFeatures.filter(k => !predefinedKeys.includes(k));

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl text-slate-900 dark:text-slate-100 overflow-hidden animate-scale-in">
                
                {/* Header */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start bg-slate-50/50 dark:bg-slate-950/40">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                                <Sparkles className="h-6 w-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    {tr('Функции и модули вне тарифа', 'Custom Add-on Features & Modules')}
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                    {tr('Настройка индивидуальных модулей для организации', 'Manage standalone modules for organization')}: <strong className="text-slate-800 dark:text-slate-200">{company.name}</strong>
                                </p>
                            </div>
                        </div>

                        {/* Current Plan context badge */}
                        <div className="flex items-center gap-2 mt-3 text-xs">
                            <span className="text-slate-500">{tr('Текущий базовый тариф:', 'Current base plan:')}</span>
                            <span className={`px-2.5 py-0.5 rounded-full font-semibold border ${
                                plan === 'enterprise'
                                    ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border-purple-300'
                                    : plan === 'premium'
                                    ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-300'
                                    : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-300'
                            }`}>
                                {plan === 'enterprise' ? 'Enterprise' : plan === 'premium' ? 'Premium' : 'Free (Базовый)'}
                            </span>
                            <span className="text-slate-400">•</span>
                            <span className="text-purple-600 dark:text-purple-400 font-medium">
                                {tr(`Активировано ${selectedFeatures.length} опций вне тарифа`, `${selectedFeatures.length} add-ons active`)}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Filter and Search Bar */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder={tr('Поиск модулей...', 'Search modules...')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 h-9 text-xs"
                        />
                    </div>

                    {/* Category tabs */}
                    <div className="flex flex-wrap gap-1 w-full sm:w-auto">
                        {[
                            { id: 'all', label: tr('Все', 'All') },
                            { id: 'branding', label: tr('Брендинг', 'Branding') },
                            { id: 'ai', label: tr('AI', 'AI') },
                            { id: 'integration', label: tr('1C / API', '1C / API') },
                            { id: 'compliance', label: tr('МСФО / Налоги', 'Compliance') },
                            { id: 'scale', label: tr('Масштаб', 'Scale') },
                            { id: 'security', label: tr('Аудит', 'Security') },
                        ].map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`px-2.5 py-1 text-xs rounded-lg transition-colors font-medium ${
                                    selectedCategory === cat.id
                                        ? 'bg-purple-600 text-white shadow-xs'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Modal Body - Scrollable */}
                <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/30 dark:bg-slate-950/20">

                    {/* Notice box */}
                    <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl flex items-start gap-3 text-xs text-blue-900 dark:text-blue-200">
                        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold">{tr('Гибкая кастомизация возможностей организации', 'Flexible Organization Capability Add-ons')}</p>
                            <p className="mt-0.5 text-blue-700 dark:text-blue-300">
                                {tr(
                                    'Подключение функций вне тарифа позволяет предоставить клиенту премиальные или специализированные опции (White-Label брендирование, AI Аудитор, 1C OData, налоги) без обязательного перехода на старший тарифный план.',
                                    'Activating add-on features allows providing enterprise capabilities (White-Label, AI Auditor, 1C OData, tax tools) without forcing a full subscription tier change.'
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Pre-configured Feature Grid */}
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                <Sliders className="h-4 w-4" />
                                {tr('Каталог стандартных модулей платформы', 'Standard Platform Modules')}
                            </h3>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedFeatures(AVAILABLE_CUSTOM_FEATURES.map(f => f.key))}
                                    className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-medium"
                                >
                                    {tr('Включить все', 'Enable all')}
                                </button>
                                <span className="text-slate-300">|</span>
                                <button
                                    type="button"
                                    onClick={() => setSelectedFeatures([])}
                                    className="text-xs text-slate-500 hover:underline"
                                >
                                    {tr('Снять все', 'Clear all')}
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            {filteredFeatures.map((feat: CustomFeatureDef) => {
                                const isChecked = selectedFeatures.includes(feat.key);
                                const isDefaultByPlan = isIncludedByPlan(feat.key);

                                return (
                                    <div
                                        key={feat.key}
                                        onClick={() => toggleFeature(feat.key)}
                                        className={`p-4 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                                            isChecked
                                                ? 'bg-purple-50/60 dark:bg-purple-950/30 border-purple-300 dark:border-purple-800 shadow-xs ring-1 ring-purple-400/30'
                                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                                        }`}
                                    >
                                        <div>
                                            <div className="flex items-start justify-between gap-2 mb-1.5">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                                                        isChecked 
                                                            ? 'bg-purple-600 border-purple-600 text-white' 
                                                            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                                                    }`}>
                                                        {isChecked && <Check className="h-3.5 w-3.5" />}
                                                    </div>
                                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                                                        {currentLang === 'en' ? feat.nameEn : feat.nameRu}
                                                    </h4>
                                                </div>

                                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${feat.badgeColor}`}>
                                                    {getFeatureCategoryLabel(feat.category, currentLang)}
                                                </span>
                                            </div>

                                            <p className="text-xs text-slate-600 dark:text-slate-400 ml-7 leading-relaxed">
                                                {currentLang === 'en' ? feat.descriptionEn : feat.descriptionRu}
                                            </p>
                                        </div>

                                        <div className="mt-3 ml-7 flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px]">
                                            <code className="text-slate-400 dark:text-slate-500 font-mono text-[10px]">
                                                key: {feat.key}
                                            </code>
                                            {isDefaultByPlan && (
                                                <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                                                    <Crown className="h-3 w-3" />
                                                    {tr('Входит в текущий тариф', 'Included in plan')}
                                                </span>
                                            )}
                                            {isChecked && !isDefaultByPlan && (
                                                <span className="text-purple-600 dark:text-purple-400 font-semibold">
                                                    ★ {tr('Активировано вне тарифа', 'Active add-on')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Section: Add Bespoke / Arbitrary Custom Feature */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
                            <Plus className="h-4 w-4 text-purple-600" />
                            {tr('Добавить произвольную функцию или интеграцию', 'Add Custom Feature Key or Bespoke Option')}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                            {tr(
                                'Вы можете ввести любой уникальный ключ функции для специальных договоренностей (например: custom_sap_connector, webhook_export, priority_sla).',
                                'Enter an arbitrary identifier key for bespoke customer agreements.'
                            )}
                        </p>

                        <form onSubmit={handleAddArbitraryFeature} className="flex gap-2">
                            <Input
                                placeholder={tr('Например: custom_sap_connector или api_vip_quota', 'e.g., custom_sap_connector or api_vip_quota')}
                                value={newCustomKey}
                                onChange={(e) => setNewCustomKey(e.target.value)}
                                className="h-9 text-xs font-mono"
                            />
                            <Button type="submit" size="sm" className="bg-purple-600 hover:bg-purple-700 text-white shrink-0">
                                <Plus className="h-4 w-4 mr-1" />
                                {tr('Добавить', 'Add')}
                            </Button>
                        </form>

                        {/* List of custom arbitrary features */}
                        {customArbitraryFeatures.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2 items-center">
                                <span className="text-xs text-slate-500">{tr('Кастомные опции:', 'Bespoke tags:')}</span>
                                {customArbitraryFeatures.map(customKey => (
                                    <span
                                        key={customKey}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-mono text-xs"
                                    >
                                        {customKey}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveArbitraryFeature(customKey)}
                                            className="hover:text-red-600 text-slate-400"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                </div>

                {/* Footer Controls */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center">
                    <div className="text-xs text-slate-500">
                        {tr('Всего выбрано модулей вне тарифа:', 'Total standalone modules selected:')} <strong className="text-purple-600 font-bold">{selectedFeatures.length}</strong>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            disabled={isSaving}
                            className="text-xs dark:border-slate-700"
                        >
                            {tr('Отмена', 'Cancel')}
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-5 shadow-xs"
                        >
                            {isSaving ? tr('Сохранение...', 'Saving...') : tr('Сохранить функции', 'Save Features')}
                        </Button>
                    </div>
                </div>

            </div>
        </div>
    );
};
