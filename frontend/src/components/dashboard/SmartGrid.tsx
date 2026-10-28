import React, { useState, useEffect, useCallback } from 'react';
import { tr } from '@/lib/i18n';
import api from '@/lib/api';
import { WidgetConfig, DashboardLayout, DashboardData } from './types';
import { WIDGET_REGISTRY } from './WidgetRegistry';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, Save, Edit2, X, EyeOff, WifiOff, RefreshCw, RotateCcw } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';

// Stable module-level constant — never changes between renders
const DEFAULT_WIDGETS: WidgetConfig[] = [
    { id: "compliance-score", enabled: true, order: 0, settings: {} },
    { id: "one-c-sync", enabled: true, order: 1, settings: {} },
    { id: "transformation-stats", enabled: true, order: 2, settings: {} },
    { id: "group-consolidation", enabled: true, order: 3, settings: {} },
    { id: "transformation-chart", enabled: true, order: 4, settings: {} },
    { id: "quick-actions", enabled: true, order: 5, settings: {} },
    { id: "recent-activity", enabled: true, order: 6, settings: {} },
    { id: "tax-compliance-card", enabled: true, order: 7, settings: {} },
];

const DEMO_DATA_FALLBACK: DashboardData = {
    compliance: { score: 96, status: "Good", pending_tasks: 2 },
    one_c_status: { connected: true, last_sync: "12 minutes ago", errors: 0 },
    transformation: { total_processed: 14, saved_hours: 42.5 },
    consolidation: {
        total_entities: 4,
        consolidated_assets: 248200000,
        consolidated_liabilities: 96300000,
        consolidated_equity: 151900000,
        eliminations_count: 5,
        eliminations_amount: 99800000,
        is_balanced: true,
        delta: 0,
    },
    tax_compliance: {
        cit_rate: "15%",
        vat_rate: "12%",
        deferred_tax_asset: 1450000,
        status: "Soliq.uz Verified",
        last_verification: "Today, 18:30",
    },
    chart_data: [
        { month: "Май", statements: 4, volume_uzs: 48000000, ifrs16: 12000000, ifrs9: 3500000 },
        { month: "Июн", statements: 7, volume_uzs: 82000000, ifrs16: 18500000, ifrs9: 6200000 },
        { month: "Июл", statements: 9, volume_uzs: 115000000, ifrs16: 24000000, ifrs9: 8100000 },
        { month: "Авг", statements: 11, volume_uzs: 152000000, ifrs16: 31000000, ifrs9: 10400000 },
        { month: "Сен", statements: 13, volume_uzs: 198000000, ifrs16: 38000000, ifrs9: 12800000 },
        { month: "Окт", statements: 14, volume_uzs: 248200000, ifrs16: 45000000, ifrs9: 15600000 },
    ],
    recent_activity: [
        { id: "demo-act-1", action: "sync", timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(), details: "1C:Enterprise Trial Balance синхронизирован (24 счёта, 120 млн UZS)" },
        { id: "demo-act-2", action: "transform", timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), details: "IFRS 16 Капитализация прав аренды проведена успешно (41.2 млн UZS)" },
        { id: "demo-act-3", action: "review", timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), details: "IFRS 9 Резерв под обесценение ECL Stage 2 утвержден аудитором (15.6 млн UZS)" },
        { id: "demo-act-4", action: "consolidation", timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(), details: "Трансформация ОСВ по МСФО сведена (дельта 0.00 UZS)" },
        { id: "demo-act-5", action: "compliance", timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(), details: "Налоговый протокол проверен: ставка CIT 15%, VAT 12%, ОНА 1.45 млн UZS" },
    ]
};

// Skeleton card for loading state
const SkeletonCard: React.FC<{ wide?: boolean }> = ({ wide }) => (
    <div className={`rounded-xl border bg-card p-5 space-y-3 animate-pulse ${wide ? 'col-span-1 md:col-span-2' : 'col-span-1'}`}>
        <div className="h-4 bg-muted rounded w-1/2" />
        <div className="h-8 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-full" />
        <div className="h-3 bg-muted rounded w-2/3" />
    </div>
);

export const SmartGrid: React.FC = () => {
    const { i18n } = useTranslation();
    void i18n.language;
    const [layout, setLayout] = useState<WidgetConfig[]>([]);
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isDemoData, setIsDemoData] = useState(false);

    // useCallback: stable reference — addEventListener/removeEventListener will correctly pair
    const fetchDashboard = useCallback(async () => {
        setIsDemoData(false);
        try {
            let apiDataFailed = false;

            const configPromise = api.get<DashboardLayout>('/dashboard/config').catch(err => {
                console.warn("Failed to load dashboard config, using defaults", err);
                return { data: { widgets: DEFAULT_WIDGETS } };
            });

            const dataPromise = api.get<DashboardData>('/dashboard/data').catch(err => {
                console.warn("Failed to load dashboard data from API, will use fallback", err);
                apiDataFailed = true;
                return { data: DEMO_DATA_FALLBACK };
            });

            const [configRes, dataRes] = await Promise.all([configPromise, dataPromise]);

            if (configRes.data && Array.isArray(configRes.data.widgets) && configRes.data.widgets.length > 0) {
                const existingIds = new Set(configRes.data.widgets.map((w: any) => w.id));
                const missing = DEFAULT_WIDGETS.filter(w => !existingIds.has(w.id));
                const combined = [...configRes.data.widgets, ...missing].sort((a, b) => a.order - b.order);
                setLayout(combined);
            } else {
                setLayout(DEFAULT_WIDGETS);
            }

            if (dataRes.data) {
                setData(dataRes.data);
            } else {
                setData(DEMO_DATA_FALLBACK);
            }

            if (apiDataFailed) {
                setIsDemoData(true);
            }
        } catch (error) {
            console.error("Dashboard fetch error:", error);
            setLayout(DEFAULT_WIDGETS);
            setData(DEMO_DATA_FALLBACK);
            setIsDemoData(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboard();

        window.addEventListener('refresh-dashboard', fetchDashboard);

        return () => {
            window.removeEventListener('refresh-dashboard', fetchDashboard);
        };
    }, [fetchDashboard]);

    const saveLayout = async () => {
        setSaving(true);
        try {
            const updatedLayout = layout.map((w, index) => ({ ...w, order: index }));
            await api.post('/dashboard/config', { widgets: updatedLayout });
            toast({ 
                title: tr("Успешно", "Success"), 
                description: tr("Расположение виджетов сохранено", "Dashboard layout saved") 
            });
            setIsEditing(false);
        } catch (error) {
            toast({ 
                title: tr("Ошибка", "Error"), 
                description: tr("Не удалось сохранить конфигурацию", "Failed to save layout"), 
                variant: "destructive" 
            });
        } finally {
            setSaving(false);
        }
    };

    const moveWidget = (index: number, direction: 'up' | 'down') => {
        const newLayout = [...layout];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex >= 0 && targetIndex < newLayout.length) {
            [newLayout[index], newLayout[targetIndex]] = [newLayout[targetIndex], newLayout[index]];
            setLayout(newLayout);
        }
    };

    const toggleVisibility = (id: string) => {
        setLayout(layout.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w));
    };

    const resetToDefaultLayout = () => {
        setLayout(DEFAULT_WIDGETS);
        toast({ 
            title: tr("Сброшено", "Reset"), 
            description: tr("Восстановлена стандартная сетка виджетов", "Default widget layout restored") 
        });
    };

    const getWidgetSpanClass = (id: string) => {
        switch (id) {
            case 'transformation-chart':
                return 'col-span-1 md:col-span-2 lg:col-span-2';
            case 'quick-actions':
                return 'col-span-1 md:col-span-2 lg:col-span-2';
            case 'recent-activity':
                return 'col-span-1 md:col-span-2 lg:col-span-2';
            case 'tax-compliance-card':
                return 'col-span-1 md:col-span-2 lg:col-span-2';
            default:
                return 'col-span-1';
        }
    };

    // Skeleton loading state
    if (loading) {
        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center mb-6">
                    <div className="h-7 bg-muted rounded w-48 animate-pulse" />
                    <div className="h-9 bg-muted rounded w-28 animate-pulse" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard wide />
                    <SkeletonCard wide />
                    <SkeletonCard wide />
                    <SkeletonCard wide />
                </div>
            </div>
        );
    }

    const effectiveLayout = layout.length > 0 ? layout : DEFAULT_WIDGETS;
    const visibleWidgets = isEditing ? effectiveLayout : effectiveLayout.filter(w => w.enabled);

    return (
        <div className="space-y-4">
            {/* Demo data warning banner */}
            {isDemoData && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-200 text-sm">
                    <WifiOff className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span className="font-medium">{tr("Демо-данные", "Demo Data")}</span>
                    <span className="text-amber-700 dark:text-amber-300">
                        {tr("— API недоступен. Отображаются примерные значения, не реальные данные компании.", "— API unavailable. Displaying approximate values, not actual company data.")}
                    </span>
                    <button
                        onClick={() => { setLoading(true); fetchDashboard(); }}
                        className="ml-auto flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 transition-colors"
                    >
                        <RefreshCw className="h-3 w-3" /> {tr("Повторить", "Retry")}
                    </button>
                </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {tr("Аналитическая панель", "Smart Dashboard")}
                </h2>
                <div className="flex space-x-2">
                    {isEditing ? (
                        <>
                            <Button variant="ghost" onClick={resetToDefaultLayout} disabled={saving} size="sm">
                                <RotateCcw className="h-4 w-4 mr-2" /> {tr("Сбросить", "Reset")}
                            </Button>
                            <Button variant="outline" onClick={() => setIsEditing(false)} disabled={saving} size="sm">
                                <X className="h-4 w-4 mr-2" /> {tr("Отмена", "Cancel")}
                            </Button>
                            <Button onClick={saveLayout} disabled={saving} size="sm">
                                <Save className="h-4 w-4 mr-2" /> {tr("Сохранить", "Save Layout")}
                            </Button>
                        </>
                    ) : (
                        <Button variant="outline" onClick={() => setIsEditing(true)} size="sm">
                            <Edit2 className="h-4 w-4 mr-2" /> {tr("Настроить", "Personalize")}
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {visibleWidgets.map((widget, index) => {
                    const Component = WIDGET_REGISTRY[widget.id];
                    if (!Component) return null;

                    return (
                        <div
                            key={widget.id}
                            className={`
                                relative group transition-all duration-200
                                ${getWidgetSpanClass(widget.id)}
                                ${!widget.enabled && isEditing ? 'opacity-50 grayscale border-dashed border-2' : ''}
                            `}
                        >
                            {isEditing && (
                                <div className="absolute top-2 right-2 z-10 flex space-x-1 bg-background/80 backdrop-blur-sm p-1 rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => moveWidget(index, 'up')} disabled={index === 0}>
                                        <ArrowUp className="h-3 w-3" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => moveWidget(index, 'down')} disabled={index === layout.length - 1}>
                                        <ArrowDown className="h-3 w-3" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => toggleVisibility(widget.id)}>
                                        <EyeOff className={`h-3 w-3 ${!widget.enabled ? 'text-red-500' : ''}`} />
                                    </Button>
                                </div>
                            )}

                            <div className={isEditing ? 'pointer-events-none' : ''}>
                                <Component config={widget} data={data || undefined} />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Fallback if no widgets visible */}
            {visibleWidgets.length === 0 && !loading && (
                <div className="text-center py-20 bg-muted/20 rounded-lg border-dashed border-2">
                    <p className="text-muted-foreground">
                        {tr('Виджеты не выбраны. Нажмите «Настроить», чтобы добавить.', 'No widgets visible. Click "Personalize" to add them.')}
                    </p>
                </div>
            )}
        </div>
    );
};
