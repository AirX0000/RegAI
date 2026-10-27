import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { X } from 'lucide-react';
import api from '../lib/api';
import { useTranslation } from 'react-i18next';

interface CompanyFormModalProps {
    company: any | null;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CompanyFormModal({ company, onClose, onSuccess }: CompanyFormModalProps) {
    const { toast } = useToast();
    const { i18n } = useTranslation();
    const isRu = (i18n.language || 'ru').toLowerCase().startsWith('ru');

    const [formData, setFormData] = useState({
        name: '',
        domain: '',
        description: '',
        website: '',
        industry: '',
        employee_count: '',
        logo_url: '',
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
            });
        }
    }, [company]);

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
        };

        try {
            if (company) {
                // Update
                await api.put(`/companies/${company.id}`, payload);
                toast({
                    title: isRu ? "Успешно" : "Success",
                    description: isRu ? "Данные компании успешно обновлены" : "Company updated successfully",
                });
            } else {
                // Create
                await api.post('/companies/', payload);
                toast({
                    title: isRu ? "Успешно" : "Success",
                    description: isRu ? "Компания успешно создана" : "Company created successfully",
                });
            }
            onSuccess();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: isRu ? "Ошибка" : "Error",
                description: error.response?.data?.detail || (isRu ? `Не удалось ${company ? 'обновить' : 'создать'} компанию` : `Failed to ${company ? 'update' : 'create'} company`),
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
                            ? (isRu ? 'Редактировать компанию' : 'Edit Company') 
                            : (isRu ? 'Создать новую компанию' : 'Create Company')}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            {isRu ? 'Наименование компании' : 'Company Name'} <span className="text-red-500">*</span>
                        </label>
                        <Input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            placeholder={isRu ? "Введите название организации" : "Enter company name"}
                            className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            {isRu ? 'Домен' : 'Domain'}
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
                            {isRu ? 'Описание деятельности' : 'Description'}
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2.5 min-h-[100px] text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            placeholder={isRu ? "Краткое описание профиля компании..." : "Brief description about the company..."}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                {isRu ? 'Веб-сайт' : 'Website'}
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
                                {isRu ? 'Отрасль' : 'Industry'}
                            </label>
                            <select
                                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                value={formData.industry}
                                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                            >
                                <option value="">{isRu ? 'Выберите отрасль' : 'Select Industry'}</option>
                                <option value="Banking">{isRu ? 'Банки и финансы' : 'Banking'}</option>
                                <option value="Technology">{isRu ? 'Информационные технологии' : 'Technology'}</option>
                                <option value="Retail">{isRu ? 'Розничная торговля' : 'Retail'}</option>
                                <option value="Manufacturing">{isRu ? 'Производство и промышленность' : 'Manufacturing'}</option>
                                <option value="Healthcare">{isRu ? 'Здравоохранение и фарма' : 'Healthcare'}</option>
                                <option value="Other">{isRu ? 'Другое' : 'Other'}</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                {isRu ? 'Количество сотрудников' : 'Employee Count'}
                            </label>
                            <Input
                                type="number"
                                value={formData.employee_count}
                                onChange={(e) => setFormData({ ...formData, employee_count: e.target.value })}
                                placeholder={isRu ? "например, 150" : "e.g., 100"}
                                min="1"
                                className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                {isRu ? 'Ссылка на логотип (URL)' : 'Logo URL'}
                            </label>
                            <Input
                                type="url"
                                value={formData.logo_url}
                                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                                placeholder="https://..."
                                className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <Button type="button" onClick={onClose} variant="outline" className="flex-1 dark:border-slate-700 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200">
                            {isRu ? 'Отмена' : 'Cancel'}
                        </Button>
                        <Button type="submit" disabled={submitting} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                            {submitting 
                                ? (isRu ? 'Сохранение...' : 'Saving...') 
                                : company 
                                    ? (isRu ? 'Обновить данные' : 'Update Company') 
                                    : (isRu ? 'Создать компанию' : 'Create Company')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
