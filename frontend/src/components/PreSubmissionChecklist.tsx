import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import api from '../lib/api';
import { CheckCircle, Circle, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ChecklistProps {
    reportId: string;
    onClose: () => void;
    onSubmit: () => void;
}

export default function PreSubmissionChecklist({ reportId, onClose, onSubmit }: ChecklistProps) {
    const [checklist, setChecklist] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const { i18n } = useTranslation();
    const isRu = (i18n.language || 'ru').toLowerCase().startsWith('ru');

    useEffect(() => {
        fetchChecklist();
    }, [reportId]);

    const fetchChecklist = async () => {
        try {
            const res = await api.get(`/reports/${reportId}/checklist`);
            setChecklist(res.data);
        } catch (error) {
            console.error('Failed to fetch checklist', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = () => {
        if (!checklist?.can_submit) {
            toast({
                variant: "destructive",
                title: isRu ? "Невозможно отправить" : "Cannot Submit",
                description: isRu ? "Пожалуйста, выполните все обязательные пункты перед отправкой" : "Please complete all required items before submitting",
            });
            return;
        }
        onSubmit();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!checklist) {
        return (
            <div className="text-center p-8 text-gray-500">
                {isRu ? 'Не удалось загрузить чек-лист' : 'Failed to load checklist'}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {isRu ? 'Чек-лист перед отправкой отчета' : 'Pre-Submission Checklist'}
                </h3>
                <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {checklist.completed_items}/{checklist.total_items} {isRu ? 'выполнено' : 'completed'}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2">
                <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${checklist.completion_percentage}%` }}
                ></div>
            </div>

            {/* Checklist Items */}
            <div className="space-y-2">
                {(Array.isArray(checklist?.items) ? checklist.items : []).map((item: any) => (
                    <div
                        key={item.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border ${item.completed
                                ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50'
                                : item.required
                                    ? 'bg-red-50/80 dark:bg-red-950/30 border-red-200 dark:border-red-900/50'
                                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                            }`}
                    >
                        {item.completed ? (
                            <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                        ) : item.required ? (
                            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                        ) : (
                            <Circle className="h-5 w-5 text-slate-400 mt-0.5 shrink-0" />
                        )}
                        <div className="flex-1">
                            <p className="font-medium text-sm text-slate-900 dark:text-slate-100">{item.label}</p>
                            {item.required && !item.completed && (
                                <p className="text-xs text-red-600 dark:text-red-400 mt-1">{isRu ? 'Обязательно' : 'Required'}</p>
                            )}
                            {!item.required && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{isRu ? 'Опционально' : 'Optional'}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Warning if can't submit */}
            {!checklist.can_submit && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-lg">
                    <p className="text-sm text-amber-800 dark:text-amber-300">
                        ⚠️ {isRu 
                            ? `Выполните все обязательные пункты (${checklist.completed_required}/${checklist.required_items}) перед отправкой` 
                            : `Complete all required items (${checklist.completed_required}/${checklist.required_items}) before submitting`}
                    </p>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                    onClick={handleSubmit}
                    disabled={!checklist.can_submit}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                    {checklist.can_submit 
                        ? (isRu ? 'Отправить отчет' : 'Submit Report') 
                        : (isRu ? 'Заполните обязательные поля' : 'Complete Required Items')}
                </Button>
                <Button onClick={onClose} variant="outline" className="flex-1 dark:border-slate-700 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200">
                    {isRu ? 'Отмена' : 'Cancel'}
                </Button>
            </div>
        </div>
    );
}
