import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { WidgetConfig, DashboardLayout, DashboardData } from './types';
import { WIDGET_REGISTRY } from './WidgetRegistry';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, Save, Edit2, X, EyeOff } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export const SmartGrid: React.FC = () => {
    const [layout, setLayout] = useState<WidgetConfig[]>([]);
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            const [configRes, dataRes] = await Promise.all([
                api.get<DashboardLayout>('/dashboard/config'),
                api.get<DashboardData>('/dashboard/data')
            ]);

            // Sort widgets by order
            const sortedWidgets = configRes.data.widgets.sort((a, b) => a.order - b.order);
            setLayout(sortedWidgets);
            setData(dataRes.data);
        } catch (error) {
            console.error("Failed to fetch dashboard", error);
            toast({
                title: "Error",
                description: "Failed to load dashboard data",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const saveLayout = async () => {
        setSaving(true);
        try {
            // Re-assign order based on current array index
            const updatedLayout = layout.map((w, index) => ({ ...w, order: index }));

            await api.post('/dashboard/config', { widgets: updatedLayout });
            toast({
                title: "Success",
                description: "Dashboard layout saved",
            });
            setIsEditing(false);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to save layout",
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
            const temp = newLayout[index];
            newLayout[index] = newLayout[targetIndex];
            newLayout[targetIndex] = temp;
            setLayout(newLayout);
        }
    };

    const toggleVisibility = (id: string) => {
        setLayout(layout.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w));
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64">Loading dashboard...</div>;
    }

    // Filter for display: show only enabled, unless editing (then show all with opacity/toggle)
    const visibleWidgets = isEditing ? layout : layout.filter(w => w.enabled);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold tracking-tight">Smart Dashboard</h2>
                <div className="flex space-x-2">
                    {isEditing ? (
                        <>
                            <Button variant="outline" onClick={() => setIsEditing(false)} disabled={saving}>
                                <X className="h-4 w-4 mr-2" /> Cancel
                            </Button>
                            <Button onClick={saveLayout} disabled={saving}>
                                <Save className="h-4 w-4 mr-2" /> Save Layout
                            </Button>
                        </>
                    ) : (
                        <Button variant="outline" onClick={() => setIsEditing(true)}>
                            <Edit2 className="h-4 w-4 mr-2" /> Personalize
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {visibleWidgets.map((widget, index) => {
                    const Component = WIDGET_REGISTRY[widget.id];
                    if (!Component) return null;

                    return (
                        <div
                            key={widget.id}
                            className={`
                    relative group transition-all duration-200
                    ${widget.id === 'recent-activity' ? 'col-span-1 md:col-span-2' : 'col-span-1'}
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
                    <p className="text-muted-foreground">No widgets visible. Click "Personalize" to add them.</p>
                </div>
            )}
        </div>
    );
};
