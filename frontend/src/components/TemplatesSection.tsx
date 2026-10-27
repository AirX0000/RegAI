import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import api from '../lib/api';
import {
    Plus,
    Trash2,
    Edit,
    Sparkles,
    Server,
    FileSpreadsheet,
    Layers,
    Brain,
    ShieldCheck,
    RefreshCw,
    FileText,
    ArrowRight
} from 'lucide-react';
import { TemplateWizardModal } from './templates/TemplateWizardModal';
import { OneCSyncDrawer } from './onec/OneCSyncDrawer';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';

interface TemplatesSectionProps {
    onSelectTemplate?: (templateData: any) => void;
}

export default function TemplatesSection({ onSelectTemplate }: TemplatesSectionProps = {}) {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { i18n } = useTranslation();
    const isRu = (i18n.language || 'ru').toLowerCase().startsWith('ru');

    const [templates, setTemplates] = useState<any[]>([]);
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<any>(null);
    const [actionChooserOpen, setActionChooserOpen] = useState(false);
    const [selectedTemplateForAction, setSelectedTemplateForAction] = useState<any>(null);
    const [isOneCDrawerOpen, setIsOneCDrawerOpen] = useState(false);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const res = await api.get('/templates/');
            const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.items) ? res.data.items : []);
            if (data && data.length > 0) {
                setTemplates(data);
                try {
                    localStorage.setItem('regai_cached_templates', JSON.stringify(data));
                } catch (e) {
                    // ignore
                }
            } else {
                const cached = localStorage.getItem('regai_cached_templates');
                if (cached) {
                    try {
                        const parsed = JSON.parse(cached);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            setTemplates(parsed);
                            return;
                        }
                    } catch (e) {
                        // ignore
                    }
                }
                setTemplates(data);
            }
        } catch (error) {
            console.error('Failed to fetch templates', error);
            const cached = localStorage.getItem('regai_cached_templates');
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setTemplates(parsed);
                        return;
                    }
                } catch (e) {
                    // ignore
                }
            }
            setTemplates([]);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        const confirmed = confirm(
            isRu 
                ? `Вы уверены, что хотите удалить шаблон "${name}"?` 
                : `Are you sure you want to delete template "${name}"?`
        );
        if (!confirmed) return;

        try {
            await api.delete(`/templates/${id}`);
            toast({
                title: isRu ? "Шаблон удален" : "Template Deleted",
                description: isRu ? "Шаблон успешно исключен из библиотеки" : "Template removed from library",
            });
            setTemplates(prev => {
                const next = prev.filter(t => t.id !== id);
                try {
                    localStorage.setItem('regai_cached_templates', JSON.stringify(next));
                } catch (e) {
                    // ignore
                }
                return next;
            });
            fetchTemplates();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: isRu ? "Ошибка" : "Error",
                description: error.response?.data?.detail || (isRu ? "Не удалось удалить шаблон" : "Failed to delete template"),
            });
        }
    };

    const handleEdit = (template: any) => {
        setEditingTemplate(template);
        setIsWizardOpen(true);
    };

    const handleUseTemplate = async (template: any) => {
        const isFinancial = template.report_type === 'financial' || 
                            template.configuration?.target_standard === 'IFRS' || 
                            template.configuration?.source_standard === 'NAS';
        
        if (isFinancial) {
            setSelectedTemplateForAction(template);
            setActionChooserOpen(true);
            return;
        }

        await executeStandardUse(template.id);
    };

    const executeStandardUse = async (id: string) => {
        try {
            const res = await api.post(`/templates/${id}/use`);
            toast({
                title: isRu ? "Шаблон применен" : "Template Applied",
                description: isRu 
                    ? `Параметры "${res.data.template_name || res.data.title}" загружены в форму` 
                    : `Parameters for "${res.data.template_name || res.data.title}" loaded into form`,
            });
            if (onSelectTemplate) {
                onSelectTemplate(res.data);
            } else {
                localStorage.setItem('templateData', JSON.stringify(res.data));
                window.location.href = '/reports';
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: isRu ? "Ошибка" : "Error",
                description: error.response?.data?.detail || (isRu ? "Не удалось применить шаблон" : "Failed to apply template"),
            });
        }
    };

    const getCountryBadge = (code?: string) => {
        switch (code) {
            case 'UZ': return isRu ? '🇺🇿 Узбекистан' : '🇺🇿 Uzbekistan';
            case 'KZ': return isRu ? '🇰🇿 Казахстан' : '🇰🇿 Kazakhstan';
            case 'GB': return isRu ? '🇬🇧 Великобритания' : '🇬🇧 United Kingdom';
            case 'US': return isRu ? '🇺🇸 США' : '🇺🇸 USA';
            case 'DE': return isRu ? '🇩🇪 Германия / ЕС' : '🇩🇪 Germany / EU';
            default: return isRu ? '🌐 Глобальный' : '🌐 Global';
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'financial': return 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/60';
            case 'compliance': return 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60';
            case 'audit': return 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900/60';
            case 'risk_assessment': return 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900/60';
            default: return 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-blue-600" />
                        {isRu ? 'Библиотека Smart-Шаблонов' : 'Smart Templates Library'}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {isRu 
                            ? 'Пакеты регламентных проверок, правил трансформации МСФО и аудиторских сценариев' 
                            : 'Compliance packages, IFRS transformation rules, and audit automation scenarios'}
                    </p>
                </div>
                <Button
                    onClick={() => { setEditingTemplate(null); setIsWizardOpen(true); }}
                    className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-xs hover:shadow-md font-semibold text-xs transition-all duration-200 group cursor-pointer inline-flex items-center gap-1.5"
                >
                    <Plus className="h-4 w-4 transition-transform duration-200 group-hover:rotate-90" />
                    {isRu ? 'Новый Smart-Шаблон' : 'New Smart Template'}
                </Button>
            </div>

            {/* Templates Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.isArray(templates) && templates.map((template) => {
                    const cfg = template.configuration || {};
                    const activeStandards = cfg.active_standards || [];
                    const dataSource = cfg.data_source_type;

                    return (
                        <div
                            key={template.id}
                            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                        >
                            <div className="space-y-3">
                                {/* Card Header */}
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getTypeColor(template.report_type)}`}>
                                                {template.report_type.toUpperCase()}
                                            </span>
                                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                                {getCountryBadge(template.country_code)}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            {template.name}
                                        </h3>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => handleEdit(template)}
                                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors cursor-pointer"
                                            title={isRu ? "Редактировать шаблон" : "Edit template"}
                                            aria-label={isRu ? `Редактировать шаблон ${template.name}` : `Edit template ${template.name}`}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(template.id, template.name)}
                                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                                            title={isRu ? "Удалить шаблон" : "Delete template"}
                                            aria-label={isRu ? `Удалить шаблон ${template.name}` : `Delete template ${template.name}`}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                    {template.description || (isRu ? 'Интеллектуальный шаблон финансовой трансформации и комплаенса.' : 'Intelligent compliance and financial transformation template.')}
                                </p>

                                {/* Smart Configuration Badges */}
                                <div className="space-y-2 pt-1">
                                    {/* Standards pills */}
                                    {activeStandards.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {activeStandards.map((std: string) => (
                                                <span
                                                    key={std}
                                                    className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/60"
                                                >
                                                    <Layers className="mr-1 h-3 w-3" />
                                                    {std}
                                                </span>
                                            ))}
                                            {cfg.enforce_zero_delta && (
                                                <span
                                                    className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60"
                                                    title="Double-Entry Balance Guard: Zero Delta"
                                                >
                                                    <ShieldCheck className="mr-1 h-3 w-3" />
                                                    Zero Delta
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Data Source & Transition */}
                                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-1 font-medium">
                                            {dataSource === 'onec_sync' ? (
                                                <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-semibold">
                                                    <Server className="h-3 w-3" /> 1C:Enterprise
                                                </span>
                                            ) : dataSource === 'excel_upload' ? (
                                                <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                                                    <FileSpreadsheet className="h-3 w-3" /> {isRu ? 'Excel ОСВ' : 'Excel TB'}
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-blue-700 dark:text-blue-400 font-semibold">
                                                    <FileText className="h-3 w-3" /> {isRu ? 'Выбор баланса' : 'Balance Sheet'}
                                                </span>
                                            )}
                                        </div>

                                        {cfg.source_standard && cfg.target_standard && (
                                            <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                                {cfg.source_standard} ➔ {cfg.target_standard}
                                            </span>
                                        )}
                                    </div>

                                    {/* AI & Recurring Indicator */}
                                    <div className="flex items-center justify-between text-[11px] pt-1">
                                        {cfg.ai_audit_enabled !== false ? (
                                            <span className="flex items-center gap-1 text-purple-700 dark:text-purple-400 font-medium text-[10px]">
                                                <Brain className="h-3 w-3" />
                                                {isRu ? 'ИИ-аудит активен' : 'AI Audit Active'}
                                            </span>
                                        ) : (
                                            <span></span>
                                        )}

                                        {template.is_recurring && (
                                            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium text-[10px]">
                                                <RefreshCw className="h-3 w-3" />
                                                {template.recurrence_pattern || (isRu ? 'квартально' : 'quarterly')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Use Template Action */}
                            <Button
                                onClick={() => handleUseTemplate(template)}
                                className="w-full mt-4 bg-slate-900 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-semibold h-9 rounded-xl shadow-xs transition-colors"
                            >
                                <Sparkles className="mr-1.5 h-3.5 w-3.5 text-blue-400 dark:text-blue-200" />
                                {isRu ? 'Использовать шаблон' : 'Use Template'}
                            </Button>
                        </div>
                    );
                })}
            </div>

            {(!Array.isArray(templates) || templates.length === 0) && (
                <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-8 space-y-3">
                    <Sparkles className="mx-auto h-8 w-8 text-blue-500" />
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{isRu ? 'Шаблоны пока не созданы' : 'No templates created yet'}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                        {isRu 
                            ? 'Создайте свой первый интеллектуальный регламентный шаблон с помощью 5-шагового конструктора.' 
                            : 'Create your first smart compliance template using the 5-step wizard.'}
                    </p>
                    <Button
                        onClick={() => { setEditingTemplate(null); setIsWizardOpen(true); }}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-medium shadow-xs hover:shadow-md transition-all duration-200 group cursor-pointer inline-flex items-center gap-1.5"
                    >
                        <Plus className="h-4 w-4 transition-transform duration-200 group-hover:rotate-90" /> {isRu ? 'Создать шаблон' : 'Create Template'}
                    </Button>
                </div>
            )}

            {/* 5-Step Smart Template Wizard */}
            <TemplateWizardModal
                isOpen={isWizardOpen}
                onClose={() => {
                    setIsWizardOpen(false);
                    setEditingTemplate(null);
                }}
                onSuccess={(saved) => {
                    if (saved && saved.id) {
                        setTemplates(prev => {
                            const exists = prev.some(t => t.id === saved.id);
                            const next = exists ? prev.map(t => t.id === saved.id ? saved : t) : [saved, ...prev];
                            try {
                                localStorage.setItem('regai_cached_templates', JSON.stringify(next));
                            } catch (e) {
                                // ignore
                            }
                            return next;
                        });
                    }
                    fetchTemplates();
                }}
                initialTemplate={editingTemplate}
            />

            {/* Smart Template Action Chooser Modal */}
            <Dialog open={actionChooserOpen} onOpenChange={setActionChooserOpen}>
                <DialogContent className="max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 p-6 rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            {isRu 
                                ? `Использовать Smart-Шаблон: ${selectedTemplateForAction?.name}` 
                                : `Use Smart Template: ${selectedTemplateForAction?.name}`}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                            {isRu 
                                ? 'Выберите необходимый рабочий сценарий для данного регламентного пакета:' 
                                : 'Select the required workflow scenario for this compliance package:'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 mt-4">
                        {/* Option 1: Start Transformation */}
                        <div 
                            onClick={() => {
                                localStorage.setItem('selected_transformation_template', JSON.stringify(selectedTemplateForAction));
                                setActionChooserOpen(false);
                                navigate('/transformation/new');
                                toast({
                                    title: isRu ? "Режим трансформации запущен" : "Transformation Mode Activated",
                                    description: isRu 
                                        ? `Применены стандарты: ${(selectedTemplateForAction?.configuration?.active_standards || []).join(', ') || 'IFRS 16 / IAS 36'}`
                                        : `Applied standards: ${(selectedTemplateForAction?.configuration?.active_standards || []).join(', ') || 'IFRS 16 / IAS 36'}`
                                });
                            }}
                            className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-400 dark:hover:border-blue-700 cursor-pointer transition-all flex items-start gap-4 group"
                        >
                            <div className="p-3 rounded-xl bg-blue-600 text-white shadow-xs group-hover:scale-105 transition-transform">
                                <FileSpreadsheet className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between">
                                    <span>{isRu ? '⚡ Запустить трансформацию баланса (NAS ➔ IFRS)' : '⚡ Launch Balance Sheet Transformation (NAS ➔ IFRS)'}</span>
                                    <ArrowRight className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform" />
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                                    {isRu 
                                        ? `Открыть мастер трансформации со стандартами ${(selectedTemplateForAction?.configuration?.active_standards || []).join(', ') || 'IFRS 16, IAS 36, IFRS 9'} и контролем Zero Delta.`
                                        : `Open transformation wizard with standards ${(selectedTemplateForAction?.configuration?.active_standards || []).join(', ') || 'IFRS 16, IAS 36, IFRS 9'} and Zero Delta balance guard.`}
                                </p>
                            </div>
                        </div>

                        {/* Option 2: Sync with 1C */}
                        <div 
                            onClick={() => {
                                setActionChooserOpen(false);
                                setIsOneCDrawerOpen(true);
                            }}
                            className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:border-amber-400 dark:hover:border-amber-700 cursor-pointer transition-all flex items-start gap-4 group"
                        >
                            <div className="p-3 rounded-xl bg-amber-500 text-white shadow-xs group-hover:scale-105 transition-transform">
                                <Server className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between">
                                    <span>{isRu ? '🔌 Синхронизировать с 1С:Предприятие (OData Sync)' : '🔌 Synchronize with 1C:Enterprise (OData Sync)'}</span>
                                    <ArrowRight className="w-4 h-4 text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform" />
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                                    {isRu 
                                        ? 'Выгрузить оборотно-сальдовую ведомость (ОСВ) из 1С по счетам шаблона для последующей автоматической сверки.' 
                                        : 'Export trial balance from 1C via OData according to template accounts for automated reconciliation.'}
                                </p>
                            </div>
                        </div>

                        {/* Option 3: Submit Standard Report */}
                        <div 
                            onClick={() => {
                                setActionChooserOpen(false);
                                if (selectedTemplateForAction) {
                                    executeStandardUse(selectedTemplateForAction.id);
                                }
                            }}
                            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer transition-all flex items-start gap-4 group"
                        >
                            <div className="p-3 rounded-xl bg-slate-700 text-white shadow-xs group-hover:scale-105 transition-transform">
                                <FileText className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between">
                                    <span>{isRu ? '📄 Сдать регламентированный комплаенс-отчет' : '📄 Submit Regulatory Compliance Report'}</span>
                                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                                    {isRu 
                                        ? 'Сформировать стандартный отчет в реестре отчетности с автозаполнением регламента и чек-листа.' 
                                        : 'Generate a standard report in the registry with auto-filled regulation criteria and pre-submission checklist.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* 1C:Enterprise Sync Drawer */}
            <OneCSyncDrawer
                isOpen={isOneCDrawerOpen}
                onClose={() => setIsOneCDrawerOpen(false)}
                onSyncCompleted={(bsId) => {
                    setIsOneCDrawerOpen(false);
                    if (bsId) {
                        navigate(`/transformation/adjustments/${bsId}`);
                    }
                }}
            />
        </div>
    );
}
