import React from 'react';
import { tr } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { WidgetProps } from '../types';
import { Activity, RefreshCw, ArrowRightLeft, ShieldCheck, Building2, CheckCircle2, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export const RecentActivityWidget: React.FC<WidgetProps> = ({ data }) => {
    const { i18n } = useTranslation();
    const navigate = useNavigate();
    const isEn = (i18n.language || 'ru').toLowerCase().startsWith('en');

    const activities = Array.isArray(data?.recent_activity) ? data.recent_activity : [];

    const getActionBadge = (action: string) => {
        switch (action.toLowerCase()) {
            case 'sync':
                return {
                    label: tr('Синхронизация 1С', '1C Sync'),
                    color: 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
                    icon: <RefreshCw className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                };
            case 'transform':
                return {
                    label: tr('Трансформация МСФО', 'IFRS Transform'),
                    color: 'bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800',
                    icon: <ArrowRightLeft className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                };
            case 'review':
                return {
                    label: tr('Аудит и резерв', 'Audit Review'),
                    color: 'bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
                    icon: <CheckCircle2 className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                };
            case 'consolidation':
                return {
                    label: tr('Консолидация IFRS 10', 'IFRS 10 Consolidation'),
                    color: 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
                    icon: <Building2 className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                };
            case 'compliance':
                return {
                    label: tr('Комплаенс', 'Compliance'),
                    color: 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
                    icon: <ShieldCheck className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                };
            default:
                return {
                    label: action,
                    color: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
                    icon: <FileText className="h-3 w-3 text-slate-500" />
                };
        }
    };

    const formatRelativeTime = (timestamp: string) => {
        try {
            const date = new Date(timestamp);
            const diffMs = Date.now() - date.getTime();
            const diffMins = Math.floor(diffMs / (1000 * 60));
            if (diffMins < 1) return tr('только что', 'just now');
            if (diffMins < 60) return tr(`${diffMins} мин назад`, `${diffMins} min ago`);
            const diffHours = Math.floor(diffMins / 60);
            if (diffHours < 24) return tr(`${diffHours} ч назад`, `${diffHours} hr ago`);
            return date.toLocaleDateString(isEn ? 'en-US' : 'ru-RU', { day: 'numeric', month: 'short' });
        } catch {
            return timestamp;
        }
    };

    return (
        <Card className="h-full flex flex-col justify-between">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Activity className="h-4 w-4 text-blue-500" />
                        {tr("Лента аудита и операций", "Audit & Activity Feed")}
                    </CardTitle>
                    <CardDescription className="text-xs">
                        {tr("Поток операций 1С, МСФО-корректировок и холдинга", "Live events stream across 1C, IFRS and holding entities")}
                    </CardDescription>
                </div>
                <button
                    onClick={() => navigate('/audit-log')}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                    {tr("Весь журнал →", "Full Log →")}
                </button>
            </CardHeader>
            <CardContent className="pt-2 flex-1">
                <div className="space-y-3">
                    {activities.length === 0 ? (
                        <div className="text-sm text-muted-foreground text-center py-6">
                            {tr("Нет недавних действий", "No recent activity")}
                        </div>
                    ) : (
                        activities.slice(0, 5).map((activity) => {
                            const badge = getActionBadge(activity.action);
                            // Replace any legacy ruble symbol with UZS
                            const cleanedDetails = activity.details.replace(/₽/g, 'UZS');

                            return (
                                <div 
                                    key={activity.id} 
                                    className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/50 transition-colors flex items-start justify-between gap-3"
                                >
                                    <div className="space-y-1 min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.color}`}>
                                                {badge.icon}
                                                <span>{badge.label}</span>
                                            </span>
                                            <span className="text-[11px] text-muted-foreground">
                                                {formatRelativeTime(activity.timestamp)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-800 dark:text-slate-200 leading-snug break-words">
                                            {cleanedDetails}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default RecentActivityWidget;
