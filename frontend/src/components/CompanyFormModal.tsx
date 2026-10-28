import { useState, useEffect } from 'react';
import { tr } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { X, Sparkles, Check } from 'lucide-react';
import api from '../lib/api';
import { CompanyLogoUploader } from './CompanyLogoUploader';
import { useTranslation } from 'react-i18next';
import { AVAILABLE_CUSTOM_FEATURES } from '../lib/customFeatures';

interface CompanyFormModalProps {
    company: any | null;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CompanyFormModal({ company, onClose, onSuccess }: CompanyFormModalProps) {
    const { toast } = useToast();
    const { i18n } = useTranslation();
    const currentLang = i18n.language || 'ru';
    void i18n.language;
    const [formData, setFormData] = useState({
        name: '',
        domain: '',
        description: '',
        website: '',
        industry: '',
        employee_count: '',
        logo_url: '',
        plan: 'free',
        custom_features: [] as string[],
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (company) {
            setFormData({
                name: company.name || '',
                domain: company.domain || '',
                description: company.description || '',
                website: company.website || '',
                industry: company.industry || '',
                employee_count: company.employee_count?.toString() || '',
                logo_url: company.logo_url || '',
                plan: company.plan || 'free',
                custom_features: Array.isArray(company.custom_features) ? company.custom_features : [],
            });
        }
    }, [company]);

    const toggleFeature = (featureKey: string) => {
        const cur = formData.custom_features || [];
        if (cur.includes(featureKey)) {
            setFormData({ ...formData, custom_features: cur.filter(k => k !== featureKey) });
        } else {
            setFormData({ ...formData, custom_features: [...cur, featureKey] });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        const payload = {
            ...formData,
            employee_count: formData.employee_count ? parseInt(formData.employee_count) : null,
            description: formData.description || null,
            website: formData.website || null,
            industry: formData.industry || null,
            logo_url: formData.logo_url || null,
            domain: formData.domain || null,
            plan: formData.plan || 'free',
            custom_features: formData.custom_features || [],
        };

        try {
            if (company) {
                // Update
                await api.put(`/companies/${company.id}`, payload);
                toast({
                    title: tr("Успешно", "Success"),
                    description: tr("Данные компании успешно обновлены", "Company updated successfully"),
                });
            } else {
                // Create
                await api.post('/companies/', payload);
                toast({
                    title: tr("Успешно", "Success"),
                    description: tr("Компания успешно создана", "Company created successfully"),
                });
            }
            onSuccess();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: tr("Ошибка", "Error"),
                description: error.response?.data?.detail || (tr(`Не удалось ${company ? 'обновить' : 'создать'} компанию`, `Failed to ${company ? 'update' : 'create'} company`)),
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto text-slate-900 dark:text-slate-100 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        {company 
                            ? (tr('Редактировать компанию', 'Edit Company')) 
                            : (tr('Создать новую компанию', 'Create Company'))}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            {tr('Наименование компании', 'Company Name')} <span className="text-red-500">*</span>
                        </label>
                        <Input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            placeholder={tr("Введите название организации", "Enter company name")}
                            className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                {tr('Домен', 'Domain')}
                            </label>
                            <Input
                                type="text"
                                value={formData.domain}
                                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                                placeholder="company.uz"
                                className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                {tr('Тарифный план', 'Plan')}
                            </label>
                            <select
                                value={formData.plan}
                                onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            >
                                <option value="free">{tr('Базовый (Free)', 'Basic (Free)')}</option>
                                <option value="premium">{tr('Премиум (Premium)', 'Premium')}</option>
                                <option value="enterprise">{tr('Корпоративный (Enterprise)', 'Enterprise')}</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            {tr('Описание деятельности', 'Description')}
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2.5 min-h-[100px] text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            placeholder={tr("Краткое описание профиля компании...", "Brief description about the company...")}
                        />
                    </div>

                    {/* Standalone Features / Add-ons outside Tariff */}
                    <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/30 dark:bg-purple-950/20 space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <Sparkles className="h-4 w-4 text-purple-600" />
                                {tr('Функции и модули вне тарифа (Add-ons)', 'Features Outside Plan (Add-ons)')}
                            </label>
                            <span className="text-xs text-purple-700 dark:text-purple-300 font-semibold">
                                {formData.custom_features?.length || 0} {tr('активно', 'selected')}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {tr('Отметьте модули, которые необходимо предоставить организации независимо от выбранного тарифа:', 'Select standalone modules to activate for this company regardless of base plan:')}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 max-h-48 overflow-y-auto pr-1">
                            {AVAILABLE_CUSTOM_FEATURES.map((feat) => {
                                const isSelected = (formData.custom_features || []).includes(feat.key);
                                return (
                                    <button
                                        type="button"
                                        key={feat.key}
                                        onClick={() => toggleFeature(feat.key)}
                                        className={`p-2.5 rounded-lg border text-left transition-all flex items-start gap-2.5 ${
                                            isSelected
                                                ? 'bg-purple-100/70 dark:bg-purple-900/40 border-purple-400 dark:border-purple-700 shadow-2xs'
                                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 border transition-colors ${
                                            isSelected
                                                ? 'bg-purple-600 border-purple-600 text-white'
                                                : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                                        }`}>
                                            {isSelected && <Check className="h-3 w-3" />}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                                {currentLang === 'en' ? feat.nameEn : feat.nameRu}
                                            </div>
                                            <div className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                                                {feat.key}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                {tr('Веб-сайт', 'Website')}
                            </label>
                            <Input
                                type="url"
                                value={formData.website}
                                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                placeholder="https://company.uz"
                                className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                {tr('Отрасль', 'Industry')}
                            </label>
                            <select
                                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                value={formData.industry}
                                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                            >
                                <option value="">{tr('Выберите отрасль', 'Select Industry')}</option>
                                <option value="Banking">{tr('Банки и финансы', 'Banking')}</option>
                                <option value="Technology">{tr('Информационные технологии', 'Technology')}</option>
                                <option value="Retail">{tr('Розничная торговля', 'Retail')}</option>
                                <option value="Manufacturing">{tr('Производство и промышленность', 'Manufacturing')}</option>
                                <option value="Healthcare">{tr('Здравоохранение и фарма', 'Healthcare')}</option>
                                <option value="Other">{tr('Другое', 'Other')}</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            {tr('Количество сотрудников', 'Employee Count')}
                        </label>
                        <Input
                            type="number"
                            value={formData.employee_count}
                            onChange={(e) => setFormData({ ...formData, employee_count: e.target.value })}
                            placeholder={tr("например, 150", "e.g., 100")}
                            min="1"
                            className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                        />
                    </div>

                    <div className="pt-2">
                        <CompanyLogoUploader
                            value={formData.logo_url}
                            onChange={(val) => setFormData({ ...formData, logo_url: val })}
                            companyName={formData.name || 'Организация'}
                            showLetterheadMockup={false}
                        />
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <Button type="button" onClick={onClose} variant="outline" className="flex-1 dark:border-slate-700 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200">
                            {tr('Отмена', 'Cancel')}
                        </Button>
                        <Button type="submit" disabled={submitting} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                            {submitting 
                                ? (tr('Сохранение...', 'Saving...')) 
                                : company 
                                    ? (tr('Обновить данные', 'Update Company')) 
                                    : (tr('Создать компанию', 'Create Company'))}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
