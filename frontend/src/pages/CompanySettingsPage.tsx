import { useState, useEffect } from 'react';
import { tr } from '@/lib/i18n';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Building2, Save, Loader2 } from 'lucide-react';
import { OneCConfigModal } from '../components/onec/OneCConfigModal';
import { OneCSyncDrawer } from '../components/onec/OneCSyncDrawer';
import { OneCSyncLogsTable } from '../components/onec/OneCSyncLogsTable';
import { useTranslation } from 'react-i18next';

export default function CompanySettingsPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const { i18n } = useTranslation();
    void i18n.language;
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [company, setCompany] = useState<any>(null);
    const [oneCConfigOpen, setOneCConfigOpen] = useState(false);
    const [oneCSyncOpen, setOneCSyncOpen] = useState(false);
    const [formData, setFormData] = useState({
        description: '',
        website: '',
        industry: '',
        employee_count: '',
        logo_url: ''
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
                        logo_url: companyData.logo_url || ''
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const updateData = {
                description: formData.description || null,
                website: formData.website || null,
                industry: formData.industry || null,
                employee_count: formData.employee_count ? parseInt(formData.employee_count) : null,
                logo_url: formData.logo_url || null
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

                        {/* Logo URL */}
                        <div className="space-y-2">
                            <Label htmlFor="logo_url">{tr('URL логотипа', 'Logo URL')}</Label>
                            <Input
                                id="logo_url"
                                type="url"
                                value={formData.logo_url}
                                onChange={(e) => handleChange('logo_url', e.target.value)}
                                placeholder="https://example.com/logo.png"
                            />
                            {formData.logo_url && (
                                <div className="mt-2">
                                    <p className="text-xs text-gray-500 mb-2">{tr('Предпросмотр логотипа:', 'Logo Preview:')}</p>
                                    <img
                                        src={formData.logo_url}
                                        alt="Company logo preview"
                                        className="h-16 w-auto border rounded p-1"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                </div>
                            )}
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
                                        logo_url: company.logo_url || ''
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
