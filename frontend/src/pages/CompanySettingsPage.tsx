import { useState, useEffect } from 'react';
import { tr } from '@/lib/i18n';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Building2, Save, Loader2, Crown, Check, X as XIcon, Zap, Sparkles, Sliders } from 'lucide-react';
import { OneCConfigModal } from '../components/onec/OneCConfigModal';
import { OneCSyncDrawer } from '../components/onec/OneCSyncDrawer';
import { OneCSyncLogsTable } from '../components/onec/OneCSyncLogsTable';
import { CompanyLogoUploader } from '../components/CompanyLogoUploader';
import { CompanyCustomFeaturesModal } from '../components/CompanyCustomFeaturesModal';
import { AVAILABLE_CUSTOM_FEATURES, getFeatureTitle, getFeatureCategoryLabel } from '../lib/customFeatures';
import { useTranslation } from 'react-i18next';

export default function CompanySettingsPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const { i18n } = useTranslation();
    const currentLang = i18n.language || 'ru';
    void i18n.language;
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [company, setCompany] = useState<any>(null);
    const [oneCConfigOpen, setOneCConfigOpen] = useState(false);
    const [oneCSyncOpen, setOneCSyncOpen] = useState(false);
    const [featuresModalOpen, setFeaturesModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        description: '',
        website: '',
        industry: '',
        employee_count: '',
        logo_url: '',
        plan: 'free',
        custom_features: [] as string[]
    });

    const companyId = (user as any)?.company_id;

    useEffect(() => {
        const fetchCompany = async () => {
            try {
                let companyData = null;
                if (companyId) {
                    try {
                        const response = await api.get(`/companies/${companyId}`);
                        companyData = response.data;
                    } catch (err: any) {
                        console.warn('Company by ID not found, trying list', err);
                    }
                }
                if (!companyData) {
                    const fallbackRes = await api.get('/companies/');
                    const list = Array.isArray(fallbackRes.data) ? fallbackRes.data : (Array.isArray(fallbackRes.data?.items) ? fallbackRes.data.items : []);
                    if (list.length > 0) {
                        companyData = list[0];
                    }
                }

                if (companyData) {
                    setCompany(companyData);
                    setFormData({
                        description: companyData.description || '',
                        website: companyData.website || '',
                        industry: companyData.industry || '',
                        employee_count: companyData.employee_count?.toString() || '',
                        logo_url: companyData.logo_url || '',
                        plan: companyData.plan || 'free',
                        custom_features: Array.isArray(companyData.custom_features) ? companyData.custom_features : []
                    });
                }
            } catch (error) {
                console.error('Failed to fetch company', error);
                toast({
                    title: tr("Ошибка", "Error"),
                    description: tr("Не удалось загрузить данные организации", "Failed to load company information"),
                    variant: "destructive"
                });
            } finally {
                setLoading(false);
            }
        };

        fetchCompany();
    }, [user?.company_id, toast]);

    const handleToggleAddon = async (featureKey: string) => {
        try {
            const currentFeatures: string[] = Array.isArray(company?.custom_features)
                ? [...company.custom_features]
                : [];
            
            let updatedFeatures: string[];
            if (currentFeatures.includes(featureKey)) {
                updatedFeatures = currentFeatures.filter(k => k !== featureKey);
            } else {
                updatedFeatures = [...currentFeatures, featureKey];
            }

            const targetId = (user as any)?.company_id || company?.id;
            await api.put(`/companies/${targetId}/profile`, {
                ...formData,
                custom_features: updatedFeatures
            });

            // Also synchronize mock store
            try {
                const storedRaw = localStorage.getItem('regai_mock_companies');
                if (storedRaw) {
                    const comps = JSON.parse(storedRaw);
                    const idx = comps.findIndex((c: any) => c.id === targetId);
                    if (idx !== -1) {
                        comps[idx] = { ...comps[idx], custom_features: updatedFeatures };
                        localStorage.setItem('regai_mock_companies', JSON.stringify(comps));
                    }
                }
            } catch {}

            setCompany((prev: any) => ({ ...prev, custom_features: updatedFeatures }));
            setFormData((prev: any) => ({ ...prev, custom_features: updatedFeatures }));
            toast({
                title: tr("Модули обновлены", "Modules Updated"),
                description: tr(
                    `Функция "${getFeatureTitle(featureKey, currentLang)}" ${updatedFeatures.includes(featureKey) ? 'активирована вне тарифа' : 'отключена'}`,
                    `Feature "${featureKey}" status updated`
                ),
            });
        } catch (error: any) {
            toast({
                title: tr("Ошибка", "Error"),
                description: error.response?.data?.detail || tr("Не удалось обновить функцию", "Failed to update feature"),
                variant: "destructive"
            });
        }
    };

    const handleSwitchPlan = async (newPlan: string) => {
        try {
            setSaving(true);
            const targetId = companyId || company?.id;
            await api.put(`/companies/${targetId}/profile`, {
                ...formData,
                plan: newPlan
            });
            setCompany((prev: any) => ({ ...prev, plan: newPlan }));
            setFormData((prev: any) => ({ ...prev, plan: newPlan }));
            toast({
                title: tr("Тариф успешно изменен", "Plan Updated"),
                description: tr(`Организации присвоен тариф "${getPlanLabel(newPlan)}"`, `Company plan upgraded to ${newPlan}`),
            });
        } catch (error: any) {
            toast({
                title: tr("Ошибка", "Error"),
                description: error.response?.data?.detail || tr("Не удалось изменить тариф", "Failed to change plan"),
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    const getPlanLabel = (plan?: string) => {
        switch (plan?.toLowerCase()) {
            case 'enterprise':
                return tr('Корпоративный (Enterprise)', 'Enterprise');
            case 'premium':
                return tr('Премиум (Premium)', 'Premium');
            case 'free':
            case 'basic':
            default:
                return tr('Базовый (Free)', 'Basic (Free)');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const updateData = {
                description: formData.description || null,
                website: formData.website || null,
                industry: formData.industry || null,
                employee_count: formData.employee_count ? parseInt(formData.employee_count) : null,
                logo_url: formData.logo_url || null,
                plan: formData.plan || 'free'
            };

            await api.put(`/companies/${companyId || company?.id}/profile`, updateData);

            toast({
                title: tr("Успешно", "Success"),
                description: tr("Информация об организации успешно обновлена", "Company information updated successfully"),
            });

            const response = await api.get(`/companies/${companyId || company?.id}`);
            setCompany(response.data);
        } catch (error: any) {
            console.error('Failed to update company', error);
            toast({
                title: tr("Ошибка", "Error"),
                description: error.response?.data?.detail || (tr("Не удалось обновить профиль компании", "Failed to update company information")),
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    if (loading) {
        return (
            <div className="p-8 flex justify-center items-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!company) {
        return (
            <div className="p-8">
                <Card>
                    <CardContent className="p-6">
                        <p className="text-gray-500">
                            {tr('Информация об организации не найдена.', 'No company information found.')}
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    {tr('Настройки организации', 'Company Settings')}
                </h1>
                <p className="text-gray-500 mt-1">
                    {tr('Управление профилем компании, реквизитами и параметрами интеграций', "Manage your company's information and profile")}
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-blue-600" />
                        {tr('Профиль организации', 'Company Profile')}
                    </CardTitle>
                    <CardDescription>
                        {tr('Публичная информация и отраслевые параметры', "Update your company's public information")}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Company Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name">{tr('Наименование компании', 'Company Name')}</Label>
                            <Input
                                id="name"
                                value={company.name}
                                disabled
                                className="bg-gray-50"
                            />
                            <p className="text-xs text-gray-500">
                                {tr('Наименование закреплено в системе. Для смены обратитесь к суперадминистратору.', 'Company name cannot be changed. Contact support if needed.')}
                            </p>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">{tr('Описание деятельности', 'Description')}</Label>
                            <textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                className="w-full min-h-[100px] px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder={tr('Краткое описание деятельности организации...', 'Brief description of your company...')}
                            />
                        </div>

                        {/* Website */}
                        <div className="space-y-2">
                            <Label htmlFor="website">{tr('Корпоративный веб-сайт', 'Website')}</Label>
                            <Input
                                id="website"
                                type="url"
                                value={formData.website}
                                onChange={(e) => handleChange('website', e.target.value)}
                                placeholder="https://example.com"
                            />
                        </div>

                        {/* Industry */}
                        <div className="space-y-2">
                            <Label htmlFor="industry">{tr('Отрасль экономики', 'Industry')}</Label>
                            <select
                                id="industry"
                                value={formData.industry}
                                onChange={(e) => handleChange('industry', e.target.value)}
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                                <option value="">{tr('Выберите отрасль', 'Select an industry')}</option>
                                <option value="Technology">{tr('Информационные технологии (IT)', 'Technology')}</option>
                                <option value="Finance">{tr('Финансы и банкинг', 'Finance')}</option>
                                <option value="Healthcare">{tr('Здравоохранение и фармация', 'Healthcare')}</option>
                                <option value="Manufacturing">{tr('Производство и промышленность', 'Manufacturing')}</option>
                                <option value="Retail">{tr('Розничная торговля и e-commerce', 'Retail')}</option>
                                <option value="Education">{tr('Образование', 'Education')}</option>
                                <option value="Consulting">{tr('Консалтинг и аудит', 'Consulting')}</option>
                                <option value="Real Estate">{tr('Недвижимость и строительство', 'Real Estate')}</option>
                                <option value="Other">{tr('Другое', 'Other')}</option>
                            </select>
                        </div>

                        {/* Employee Count */}
                        <div className="space-y-2">
                            <Label htmlFor="employee_count">{tr('Штатная численность сотрудников', 'Employee Count')}</Label>
                            <Input
                                id="employee_count"
                                type="number"
                                min="1"
                                value={formData.employee_count}
                                onChange={(e) => handleChange('employee_count', e.target.value)}
                                placeholder="50"
                            />
                        </div>

                        {/* Subscription Plan */}
                        <div className="space-y-2">
                            <Label htmlFor="plan">{tr('Тарифный план организации', 'Company Subscription Plan')}</Label>
                            <select
                                id="plan"
                                value={formData.plan}
                                onChange={(e) => handleChange('plan', e.target.value)}
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                            >
                                <option value="free">{tr('Базовый (Free) — 1 юрлицо, до 3 польз.', 'Basic (Free) — 1 entity, up to 3 users')}</option>
                                <option value="premium">{tr('Премиум (Premium) — 1С, AI аудит, до 15 польз.', 'Premium — 1C, AI Audit, up to 15 users')}</option>
                                <option value="enterprise">{tr('Корпоративный (Enterprise) — White-Label, RAG AI, безлимит', 'Enterprise — White-Label, Unlimited')}</option>
                            </select>
                            <p className="text-xs text-gray-500">
                                {tr('Вы можете выбрать тариф здесь или воспользоваться карточками тарифов ниже с подробным списком модулей.', 'You can select a plan here or use the subscription cards below.')}
                            </p>
                        </div>

                        {/* Company Corporate Logo (Upload / URL & White-Label Letterhead Preview) */}
                        <div className="pt-2">
                            <CompanyLogoUploader
                                value={formData.logo_url}
                                onChange={(val) => handleChange('logo_url', val)}
                                companyName={company.name}
                                showLetterheadMockup={true}
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setFormData({
                                        description: company.description || '',
                                        website: company.website || '',
                                        industry: company.industry || '',
                                        employee_count: company.employee_count?.toString() || '',
                                        logo_url: company.logo_url || '',
                                        plan: company.plan || 'free',
                                        custom_features: Array.isArray(company.custom_features) ? company.custom_features : []
                                    });
                                }}
                                disabled={saving}
                            >
                                {tr('Сбросить', 'Reset')}
                            </Button>
                            <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                                {saving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {tr('Сохранение...', 'Saving...')}
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        {tr('Сохранить изменения', 'Save Changes')}
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Subscription & Tariffs Card */}
            <Card className="border-blue-200 dark:border-blue-900 bg-gradient-to-br from-white via-blue-50/10 to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 shadow-sm overflow-hidden">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg">
                                <Crown className="h-6 w-6" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                                    {tr('Тарифный план организации', 'Company Subscription Plan')}
                                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                                        (company.plan || 'free') === 'enterprise'
                                            ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700'
                                            : (company.plan || 'free') === 'premium'
                                            ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                                    }`}>
                                        {getPlanLabel(company.plan || 'free')}
                                    </span>
                                </CardTitle>
                                <CardDescription className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                                    {tr('Управление уровнем доступа, функционалом трансформации и лимитами компании', 'Manage subscription tier, quotas, and transformation modules')}
                                </CardDescription>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {/* 1. Free Plan Card */}
                        <div className={`rounded-xl border p-5 flex flex-col justify-between transition-all ${
                            (company.plan || 'free') === 'free'
                                ? 'border-slate-400 bg-white dark:bg-slate-800/90 shadow-md ring-2 ring-slate-400/30'
                                : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 hover:border-slate-300'
                        }`}>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        {tr('Базовый', 'Basic')}
                                    </span>
                                    {(company.plan || 'free') === 'free' && (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                                            {tr('Текущий', 'Current')}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <div className="text-2xl font-black text-slate-900 dark:text-white">$0 <span className="text-xs font-normal text-slate-500">/ {tr('мес', 'mo')}</span></div>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {tr('Для ознакомления с платформой и базовой трансформации 1 организации', 'For testing and basic single-entity transformation')}
                                    </p>
                                </div>
                                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                                    <div className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                                        <span>{tr('1 юридическое лицо', '1 legal entity')}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                                        <span>{tr('До 3 пользователей', 'Up to 3 users')}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                                        <span>{tr('Баланс по МСФО (IAS 1)', 'IFRS Balance Sheet (IAS 1)')}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                                        <span>{tr('Контроль Zero-Delta', 'Zero-Delta Equity Guard')}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <XIcon className="h-4 w-4 text-slate-300 shrink-0" />
                                        <span>{tr('Интеграция с 1С по API', '1C OData API integration')}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <XIcon className="h-4 w-4 text-slate-300 shrink-0" />
                                        <span>{tr('AI Аудитор (KAM МСА 701)', 'AI Auditor (KAM ISA 701)')}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <XIcon className="h-4 w-4 text-slate-300 shrink-0" />
                                        <span>{tr('White-Label брендирование', 'White-Label Branding')}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-5 mt-4 border-t border-slate-100 dark:border-slate-800">
                                {(company.plan || 'free') === 'free' ? (
                                    <Button disabled variant="outline" className="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-800 text-slate-500">
                                        ✓ {tr('Активный тариф', 'Active Plan')}
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => handleSwitchPlan('free')}
                                        disabled={saving}
                                        className="w-full text-xs font-semibold border-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                    >
                                        {tr('Перейти на Базовый', 'Switch to Free')}
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* 2. Premium Plan Card */}
                        <div className={`relative rounded-xl border p-5 flex flex-col justify-between transition-all ${
                            company.plan === 'premium'
                                ? 'border-blue-500 bg-white dark:bg-slate-800/90 shadow-lg ring-2 ring-blue-500/30'
                                : 'border-blue-200 dark:border-blue-900/60 bg-blue-50/20 dark:bg-blue-950/20 hover:border-blue-400'
                        }`}>
                            <div className="absolute -top-2.5 right-4">
                                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs flex items-center gap-1">
                                    <Sparkles className="h-3 w-3" />
                                    {tr('Популярный', 'Popular')}
                                </span>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                                        {tr('Премиум (Premium)', 'Premium')}
                                    </span>
                                    {company.plan === 'premium' && (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold">
                                            {tr('Текущий', 'Current')}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <div className="text-2xl font-black text-slate-900 dark:text-white">$99 <span className="text-xs font-normal text-slate-500">/ {tr('мес', 'mo')}</span></div>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {tr('Для бухгалтеров, аудиторских отделов и растущих компаний', 'For accounting teams, audit departments, and growing entities')}
                                    </p>
                                </div>
                                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                                    <div className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-blue-600 shrink-0" />
                                        <span><strong>{tr('До 5 организаций', 'Up to 5 entities')}</strong> {tr('и филиалов', 'and branches')}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-blue-600 shrink-0" />
                                        <span><strong>{tr('До 15 сотрудников', 'Up to 15 users')}</strong> {tr('(RBAC роли)', '(RBAC roles)')}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-blue-600 shrink-0" />
                                        <span>{tr('Полный МСФО (IFRS 16, IAS 36, IFRS 9)', 'Full IFRS (IFRS 16, IAS 36, IFRS 9)')}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-blue-600 shrink-0" />
                                        <span><strong>{tr('Прямая синхронизация с 1С', 'Direct 1C OData Sync')}</strong> (OData)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-blue-600 shrink-0" />
                                        <span>{tr('AI Аудитор (Меморандум МСА 700/701)', 'AI Auditor (ISA 700/701 Memos)')}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-blue-600 shrink-0" />
                                        <span>{tr('Налоговый комплаенс и IAS 12', 'Tax Compliance & IAS 12')}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <XIcon className="h-4 w-4 text-slate-300 shrink-0" />
                                        <span>{tr('White-Label брендирование', 'White-Label Branding')}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-5 mt-4 border-t border-slate-100 dark:border-slate-800">
                                {company.plan === 'premium' ? (
                                    <Button disabled className="w-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                        ✓ {tr('Активный тариф', 'Active Plan')}
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        onClick={() => handleSwitchPlan('premium')}
                                        disabled={saving}
                                        className="w-full text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                                    >
                                        <Zap className="h-3.5 w-3.5 mr-1" />
                                        {tr('Подключить Премиум', 'Switch to Premium')}
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* 3. Enterprise Plan Card */}
                        <div className={`relative rounded-xl border p-5 flex flex-col justify-between transition-all ${
                            company.plan === 'enterprise'
                                ? 'border-purple-500 bg-white dark:bg-slate-800/90 shadow-lg ring-2 ring-purple-500/30'
                                : 'border-purple-200 dark:border-purple-900/60 bg-purple-50/20 dark:bg-purple-950/20 hover:border-purple-400'
                        }`}>
                            <div className="absolute -top-2.5 right-4">
                                <span className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs flex items-center gap-1">
                                    <Crown className="h-3 w-3" />
                                    VIP
                                </span>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                                        {tr('Корпоративный (Enterprise)', 'Enterprise')}
                                    </span>
                                    {company.plan === 'enterprise' && (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-bold">
                                            {tr('Текущий', 'Current')}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <div className="text-2xl font-black text-slate-900 dark:text-white">$299 <span className="text-xs font-normal text-slate-500">/ {tr('мес', 'mo')}</span></div>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {tr('Для холдингов, финансовых групп, банков и аудиторских фирм', 'For holdings, banking groups, and international audit practices')}
                                    </p>
                                </div>
                                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                                    <div className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-purple-600 shrink-0" />
                                        <span><strong>{tr('Безлимит юрлиц', 'Unlimited entities')}</strong> {tr('(Холдинги)', '(Holdings)')}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-purple-600 shrink-0" />
                                        <span><strong>{tr('Безлимит пользователей', 'Unlimited users')}</strong> + SSO / SAML</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-purple-600 shrink-0" />
                                        <span><strong>{tr('White-Label брендирование', 'White-Label Branding')}</strong> ({tr('свой логотип', 'custom logo')})</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-purple-600 shrink-0" />
                                        <span>{tr('Полный пакет раскрытий МСФО (4 стр.)', 'Full 4-page IFRS Disclosure Package')}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-purple-600 shrink-0" />
                                        <span>{tr('Глобальный RAG AI по нормативам (IFRS/ISA)', 'Global RAG AI Regulations (IFRS/ISA)')}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-purple-600 shrink-0" />
                                        <span>{tr('Мультивалютная трансформация', 'Multi-currency transformation')} (UZS/USD/EUR)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-purple-600 shrink-0" />
                                        <span>{tr('Неизменяемый след AuditLog & SLA 99.9%', 'Immutable AuditLog trail & 99.9% SLA')}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-5 mt-4 border-t border-slate-100 dark:border-slate-800">
                                {company.plan === 'enterprise' ? (
                                    <Button disabled className="w-full text-xs font-semibold bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                        ✓ {tr('Активный тариф', 'Active Plan')}
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        onClick={() => handleSwitchPlan('enterprise')}
                                        disabled={saving}
                                        className="w-full text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-xs"
                                    >
                                        <Crown className="h-3.5 w-3.5 mr-1" />
                                        {tr('Подключить Enterprise', 'Switch to Enterprise')}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Standalone Feature Add-ons Outside Plan */}
            <Card className="border-purple-200 dark:border-purple-900/50 bg-gradient-to-br from-white via-purple-50/15 to-slate-50/50 dark:from-slate-900 dark:via-purple-950/20 dark:to-slate-900 shadow-sm">
                <CardHeader className="border-b border-purple-100 dark:border-purple-900/40 pb-4">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-purple-100 dark:bg-purple-950/80 text-purple-900 dark:text-purple-300 rounded-xl border border-purple-200 dark:border-purple-800">
                                <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                                    {tr('Функции и модули вне тарифа (Add-on Modules)', 'Standalone Modules Outside Plan')}
                                    <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-700">
                                        {Array.isArray(company.custom_features) ? company.custom_features.length : 0} {tr('активных доп. опций', 'active add-ons')}
                                    </span>
                                </CardTitle>
                                <CardDescription className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                                    {tr(
                                        'Подключайте индивидуальные возможности и расширения платформы без обязательного перехода на старший тарифный план',
                                        'Activate bespoke capabilities and individual features independently of your base subscription'
                                    )}
                                </CardDescription>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setFeaturesModalOpen(true)}
                                className="border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-xs font-semibold shadow-2xs"
                            >
                                <Sliders className="h-4 w-4 mr-1.5" />
                                {tr('Каталог и кастомные ключи', 'Open Feature Hub')}
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="pt-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {AVAILABLE_CUSTOM_FEATURES.map((feat) => {
                            const isIncludedByTariff = (company.plan === 'enterprise') || 
                                (company.plan === 'premium' && ['ai_auditor', 'onec_sync', 'ias12_tax', 'custom_reports'].includes(feat.key));
                            const isAddonActive = Array.isArray(company.custom_features) && company.custom_features.includes(feat.key);

                            return (
                                <div
                                    key={feat.key}
                                    className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                                        isAddonActive
                                            ? 'bg-purple-50/80 dark:bg-purple-950/30 border-purple-300 dark:border-purple-800 shadow-2xs'
                                            : isIncludedByTariff
                                            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
                                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                                    }`}
                                >
                                    <div>
                                        <div className="flex items-start justify-between gap-1.5 mb-1.5">
                                            <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                                                {currentLang === 'en' ? feat.nameEn : feat.nameRu}
                                            </h4>
                                            <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${feat.badgeColor}`}>
                                                {getFeatureCategoryLabel(feat.category, currentLang)}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                            {currentLang === 'en' ? feat.descriptionEn : feat.descriptionRu}
                                        </p>
                                    </div>

                                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                                        <div className="text-[10px]">
                                            {isIncludedByTariff ? (
                                                <span className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                                                    ✓ {tr('Входит в тариф', 'In plan')}
                                                </span>
                                            ) : isAddonActive ? (
                                                <span className="text-purple-700 dark:text-purple-300 font-semibold flex items-center gap-1">
                                                    ★ {tr('Подключено вне тарифа', 'Active add-on')}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">
                                                    {tr('Не активно', 'Disabled')}
                                                </span>
                                            )}
                                        </div>

                                        {!isIncludedByTariff && (
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant={isAddonActive ? "outline" : "default"}
                                                onClick={() => handleToggleAddon(feat.key)}
                                                className={`h-7 px-2.5 text-[11px] font-semibold ${
                                                    isAddonActive
                                                        ? 'border-purple-300 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50'
                                                        : 'bg-purple-600 hover:bg-purple-700 text-white shadow-2xs'
                                                }`}
                                            >
                                                {isAddonActive ? tr('Отключить', 'Disable') : tr('Включить', 'Enable')}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Modal for Custom Features Outside Plan */}
            {featuresModalOpen && company && (
                <CompanyCustomFeaturesModal
                    company={company}
                    onClose={() => setFeaturesModalOpen(false)}
                    onSuccess={() => {
                        setFeaturesModalOpen(false);
                        // refresh
                        try {
                            const raw = localStorage.getItem('regai_mock_companies');
                            if (raw) {
                                const list = JSON.parse(raw);
                                const found = list.find((c: any) => c.id === company.id);
                                if (found) {
                                    setCompany(found);
                                    setFormData((prev: any) => ({
                                        ...prev,
                                        custom_features: found.custom_features || []
                                    }));
                                }
                            }
                        } catch {}
                    }}
                />
            )}

            {/* 1C:Enterprise 8.3 Integration Hub */}
            <Card className="border-amber-200 bg-gradient-to-br from-white to-amber-50/20 shadow-sm">
                <CardHeader className="border-b border-amber-100 pb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-amber-100 text-amber-900 rounded-lg">
                                <Building2 className="h-6 w-6 text-amber-700" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    {tr('Интеграция 1С:Предприятие 8.3 (OData REST API)', '1C:Enterprise 8.3 OData Integration')}
                                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold border border-amber-300">
                                        {tr('Двусторонняя', 'Two-Way Sync')}
                                    </span>
                                </CardTitle>
                                <CardDescription className="text-xs text-gray-600">
                                    {tr('Прямой обмен с планом счетов 1С:Бухгалтерия (Хозрасчетный) через протокол OData v4.', 'Direct integration with 1C:Accounting via standard OData v4 & REST protocols.')}
                                </CardDescription>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setOneCConfigOpen(true)}
                                className="border-amber-300 text-amber-900 hover:bg-amber-100/50 text-xs font-semibold"
                            >
                                ⚙️ {tr('Настройки подключения', 'Connection Settings')}
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => setOneCSyncOpen(true)}
                                className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold"
                            >
                                ⚡ {tr('Центр синхронизации', 'Open Sync Hub')}
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-5 space-y-6">
                    <OneCSyncLogsTable />
                </CardContent>
            </Card>

            {/* Modals */}
            <OneCConfigModal
                isOpen={oneCConfigOpen}
                onClose={() => setOneCConfigOpen(false)}
            />
            <OneCSyncDrawer
                isOpen={oneCSyncOpen}
                onClose={() => setOneCSyncOpen(false)}
            />

            {/* Additional Info Card */}
            <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                    <CardTitle className="text-blue-900 text-sm">ℹ️ {tr('Справочная информация', 'Information')}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-blue-900">
                    <ul className="list-disc ml-5 space-y-1">
                        <li>
                            {tr('Изменения в информации о компании видны всем авторизованным пользователям организации', 'Changes to company information are visible to all users in your organization')}
                        </li>
                        <li>
                            {tr('Данные доступа к 1С шифруются симметричным шифром AES-256 (Fernet) в базе данных', '1C connection credentials are securely stored encrypted with AES-256 at rest')}
                        </li>
                        <li>
                            {tr('Для корректного отображения логотипа указывайте защищенную ссылку (HTTPS)', 'Logo images should be publicly accessible URLs (HTTPS recommended)')}
                        </li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
