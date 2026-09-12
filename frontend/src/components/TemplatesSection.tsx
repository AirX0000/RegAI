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

interface TemplatesSectionProps {
    onSelectTemplate?: (templateData: any) => void;
}

export default function TemplatesSection({ onSelectTemplate }: TemplatesSectionProps = {}) {
    const navigate = useNavigate();
    const [templates, setTemplates] = useState<any[]>([]);
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<any>(null);
    const [actionChooserOpen, setActionChooserOpen] = useState(false);
    const [selectedTemplateForAction, setSelectedTemplateForAction] = useState<any>(null);
    const [isOneCDrawerOpen, setIsOneCDrawerOpen] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const res = await api.get('/templates/');
            setTemplates(res.data);
        } catch (error) {
            console.error('Failed to fetch templates', error);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Вы уверены, что хотите удалить шаблон "${name}"?`)) return;

        try {
            await api.delete(`/templates/${id}`);
            toast({
                title: "Шаблон удален",
                description: "Шаблон успешно исключен из библиотеки",
            });
            fetchTemplates();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Ошибка",
                description: error.response?.data?.detail || "Не удалось удалить шаблон",
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
                title: "Шаблон применен",
                description: `Параметры "${res.data.template_name || res.data.title}" загружены в форму`,
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
                title: "Ошибка",
                description: error.response?.data?.detail || "Не удалось применить шаблон",
            });
        }
    };

    const getCountryBadge = (code?: string) => {
        switch (code) {
            case 'UZ': return '🇺🇿 Узбекистан';
            case 'KZ': return '🇰🇿 Казахстан';
            case 'GB': return '🇬🇧 Великобритания';
            case 'US': return '🇺🇸 США';
            case 'DE': return '🇩🇪 Германия / ЕС';
            default: return '🌐 Глобальный';
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'financial': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'compliance': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'audit': return 'bg-amber-50 text-amber-800 border-amber-200';
            case 'risk_assessment': return 'bg-purple-50 text-purple-700 border-purple-200';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-blue-600" />
                        Библиотека Smart-Шаблонов
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Пакеты регламентных проверок, правил трансформации МСФО и аудиторских сценариев
                    </p>
                </div>
                <Button
                    onClick={() => { setEditingTemplate(null); setIsWizardOpen(true); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-semibold text-xs"
                >
                    <Plus className="mr-1.5 h-4 w-4" />
                    Новый Smart-Шаблон
                </Button>
            </div>

            {/* Templates Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {templates.map((template) => {
                    const cfg = template.configuration || {};
                    const activeStandards = cfg.active_standards || [];
                    const dataSource = cfg.data_source_type;

                    return (
                        <div
                            key={template.id}
                            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                        >
                            <div className="space-y-3">
                                {/* Card Header */}
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getTypeColor(template.report_type)}`}>
                                                {template.report_type.toUpperCase()}
                                            </span>
                                            <span className="text-[10px] text-gray-500 font-medium">
                                                {getCountryBadge(template.country_code)}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-gray-900 text-sm leading-snug group-hover:text-blue-600 transition-colors">
                                            {template.name}
                                        </h3>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => handleEdit(template)}
                                            className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-blue-600 rounded-lg transition-colors"
                                            title="Редактировать шаблон в визарде"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(template.id, template.name)}
                                            className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                                            title="Удалить шаблон"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                                    {template.description || 'Интеллектуальный шаблон финансовой трансформации и комплаенса.'}
                                </p>

                                {/* Smart Configuration Badges */}
                                <div className="space-y-2 pt-1">
                                    {/* Standards pills */}
                                    {activeStandards.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {activeStandards.map((std: string) => (
                                                <span
                                                    key={std}
                                                    className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200"
                                                >
                                                    <Layers className="mr-1 h-3 w-3" />
                                                    {std}
                                                </span>
                                            ))}
                                            {cfg.enforce_zero_delta && (
                                                <span
                                                    className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                    title="Double-Entry Balance Guard: Zero Delta"
                                                >
                                                    <ShieldCheck className="mr-1 h-3 w-3" />
                                                    Zero Delta
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Data Source & Transition */}
                                    <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-gray-100">
                                        <div className="flex items-center gap-1 font-medium">
                                            {dataSource === 'onec_sync' ? (
                                                <span className="flex items-center gap-1 text-amber-700 font-semibold">
                                                    <Server className="h-3 w-3" /> 1C:Enterprise
                                                </span>
                                            ) : dataSource === 'excel_upload' ? (
                                                <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                                                    <FileSpreadsheet className="h-3 w-3" /> Excel ОСВ
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-blue-700 font-semibold">
                                                    <FileText className="h-3 w-3" /> Выбор баланса
                                                </span>
                                            )}
                                        </div>

                                        {cfg.source_standard && cfg.target_standard && (
                                            <span className="font-mono text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">
                                                {cfg.source_standard} ➔ {cfg.target_standard}
                                            </span>
                                        )}
                                    </div>

                                    {/* AI & Recurring Indicator */}
                                    <div className="flex items-center justify-between text-[11px] pt-1">
                                        {cfg.ai_audit_enabled !== false ? (
                                            <span className="flex items-center gap-1 text-purple-700 font-medium text-[10px]">
                                                <Brain className="h-3 w-3" />
                                                ИИ-аудит активен
                                            </span>
                                        ) : (
                                            <span></span>
                                        )}

                                        {template.is_recurring && (
                                            <span className="flex items-center gap-1 text-blue-600 font-medium text-[10px]">
                                                <RefreshCw className="h-3 w-3" />
                                                {template.recurrence_pattern || 'квартально'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Use Template Action */}
                            <Button
                                onClick={() => handleUseTemplate(template)}
                                className="w-full mt-4 bg-slate-900 hover:bg-blue-600 text-white text-xs font-semibold h-9 rounded-xl shadow-xs transition-colors"
                            >
                                <Sparkles className="mr-1.5 h-3.5 w-3.5 text-blue-400" />
                                Использовать шаблон
                            </Button>
                        </div>
                    );
                })}
            </div>

            {templates.length === 0 && (
                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300 p-8 space-y-3">
                    <Sparkles className="mx-auto h-8 w-8 text-blue-500" />
                    <h3 className="text-sm font-semibold text-gray-900">Шаблоны пока не созданы</h3>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                        Создайте свой первый интеллектуальный регламентный шаблон с помощью 5-шагового конструктора.
                    </p>
                    <Button
                        onClick={() => { setEditingTemplate(null); setIsWizardOpen(true); }}
                        size="sm"
                        className="bg-blue-600 text-white"
                    >
                        <Plus className="mr-1.5 h-4 w-4" /> Создать шаблон
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
                onSuccess={fetchTemplates}
                initialTemplate={editingTemplate}
            />

            {/* Smart Template Action Chooser Modal */}
            <Dialog open={actionChooserOpen} onOpenChange={setActionChooserOpen}>
                <DialogContent className="max-w-2xl bg-white text-slate-900 p-6 rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-blue-600" />
                            Использовать Smart-Шаблон: {selectedTemplateForAction?.name}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Выберите необходимый рабочий сценарий для данного регламентного пакета:
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
                                    title: "Режим трансформации запущен",
                                    description: `Применены стандарты: ${(selectedTemplateForAction?.configuration?.active_standards || []).join(', ') || 'IFRS 16 / IAS 36'}`
                                });
                            }}
                            className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 hover:bg-blue-50 hover:border-blue-400 cursor-pointer transition-all flex items-start gap-4 group"
                        >
                            <div className="p-3 rounded-xl bg-blue-600 text-white shadow-xs group-hover:scale-105 transition-transform">
                                <FileSpreadsheet className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <div className="font-bold text-sm text-slate-900 flex items-center justify-between">
                                    <span>⚡ Запустить трансформацию баланса (NAS ➔ IFRS)</span>
                                    <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
                                </div>
                                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                    Открыть мастер трансформации с предзаполненными стандартами 
                                    <strong> {(selectedTemplateForAction?.configuration?.active_standards || []).join(', ') || 'IFRS 16, IAS 36, IFRS 9'}</strong>, 
                                    контролем Zero Delta Guard и планом счетов 
                                    <strong> {(selectedTemplateForAction?.configuration?.required_accounts || ['01', '02', '60', '67', '84']).join(', ')}</strong>.
                                </p>
                            </div>
                        </div>

                        {/* Option 2: Sync with 1C */}
                        <div 
                            onClick={() => {
                                setActionChooserOpen(false);
                                setIsOneCDrawerOpen(true);
                            }}
                            className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 hover:bg-amber-50 hover:border-amber-400 cursor-pointer transition-all flex items-start gap-4 group"
                        >
                            <div className="p-3 rounded-xl bg-amber-500 text-white shadow-xs group-hover:scale-105 transition-transform">
                                <Server className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <div className="font-bold text-sm text-slate-900 flex items-center justify-between">
                                    <span>🔌 Синхронизировать с 1С:Предприятие (OData Sync)</span>
                                    <ArrowRight className="w-4 h-4 text-amber-600 group-hover:translate-x-1 transition-transform" />
                                </div>
                                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                    Выгрузить оборотно-сальдовую ведомость (ОСВ) из 1С по счетам шаблона 
                                    <strong> {(selectedTemplateForAction?.configuration?.required_accounts || ['01', '02', '60', '67', '84']).join(', ')} </strong>
                                    для последующей автоматической сверки.
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
                            className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100 hover:border-slate-300 cursor-pointer transition-all flex items-start gap-4 group"
                        >
                            <div className="p-3 rounded-xl bg-slate-700 text-white shadow-xs group-hover:scale-105 transition-transform">
                                <FileText className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <div className="font-bold text-sm text-slate-900 flex items-center justify-between">
                                    <span>📄 Сдать регламентированный комплаенс-отчет</span>
                                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:translate-x-1 transition-transform" />
                                </div>
                                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                    Сформировать стандартный отчет в реестре отчетности с автозаполнением регламента и чек-листа.
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
