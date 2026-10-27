import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { X } from 'lucide-react';
import api from '../lib/api';
import { useTranslation } from 'react-i18next';

interface TenantFormModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export default function TenantFormModal({ onClose, onSuccess }: TenantFormModalProps) {
    const { toast } = useToast();
    const { i18n } = useTranslation();
    const isRu = (i18n.language || 'ru').toLowerCase().startsWith('ru');

    const [formData, setFormData] = useState({
        name: '',
        plan: 'free',
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            await api.post('/tenants/', formData);
            toast({
                title: isRu ? "Успешно" : "Success",
                description: isRu ? "Тенант успешно создан" : "Tenant created successfully",
            });
            onSuccess();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: isRu ? "Ошибка" : "Error",
                description: error.response?.data?.detail || (isRu ? "Не удалось создать тенанта" : "Failed to create tenant"),
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        {isRu ? 'Создание тенанта' : 'Create Tenant'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            {isRu ? 'Название тенанта / организации' : 'Tenant Name'} <span className="text-red-500">*</span>
                        </label>
                        <Input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            placeholder={isRu ? 'Введите наименование' : 'Enter tenant name'}
                            className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            {isRu ? 'Тарифный план' : 'Plan'}
                        </label>
                        <select
                            className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            value={formData.plan}
                            onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                        >
                            <option value="free">{isRu ? 'Базовый (Free)' : 'Free'}</option>
                            <option value="premium">{isRu ? 'Премиум (Premium)' : 'Premium'}</option>
                            <option value="enterprise">{isRu ? 'Корпоративный (Enterprise)' : 'Enterprise'}</option>
                        </select>
                    </div>

                    <div className="flex gap-2 pt-4">
                        <Button type="button" onClick={onClose} variant="outline" className="flex-1 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                            {isRu ? 'Отмена' : 'Cancel'}
                        </Button>
                        <Button type="submit" disabled={submitting} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                            {submitting ? (isRu ? 'Создание...' : 'Creating...') : (isRu ? 'Создать тенанта' : 'Create Tenant')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
