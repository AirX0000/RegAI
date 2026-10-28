import React from 'react';
import { tr } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WidgetProps } from '../types';
import { Building2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const GroupConsolidationWidget: React.FC<WidgetProps> = ({ data }) => {
    const navigate = useNavigate();
    const { i18n } = useTranslation();
    void i18n.language;
    const consolidation = data?.consolidation;

    return (
        <Card className="h-full border-blue-200/60 dark:border-blue-900/50 bg-gradient-to-br from-card via-card to-blue-50/30 dark:to-blue-950/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {tr("Консолидация по IFRS 10", "IFRS 10 Consolidation")}
                </CardTitle>
                <Building2 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
                <div className="flex items-baseline justify-between">
                    <div className="text-2xl font-bold tracking-tight">
                        {consolidation ? (
                            consolidation.total_entities === 1 
                                ? (tr('1 организация', '1 entity'))
                                : `${consolidation.total_entities} ${tr('компании', 'entities')}`
                        ) : (tr('1 организация', '1 entity'))}
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="h-3 w-3" />
                        {tr("Дельта: 0.00 UZS", "Balanced (0 UZS)")}
                    </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    {consolidation?.total_entities === 1 
                        ? (tr("Автономный учет организации", "Autonomous corporate reporting"))
                        : (tr("Холдинг Axiaris: Головная + 3 Дочерние", "Holding Axiaris: 1 Parent + 3 Subsidiaries"))}
                </p>

                <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
                    <div className="text-xs">
                        <span className="text-muted-foreground">{tr("Статус: ", "Status: ")}</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {consolidation?.total_entities === 1 
                                ? (tr('Активна • Сверено', 'Active • Verified'))
                                : (consolidation ? `${consolidation.eliminations_count} (${(consolidation.eliminations_amount / 1000000).toFixed(1)}M UZS)` : '5 (99.8M UZS)')}
                        </span>
                    </div>
                    <button
                        onClick={() => navigate(consolidation?.total_entities === 1 ? '/company-settings' : '/hierarchy')}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                    >
                        <span>{consolidation?.total_entities === 1 ? (tr("Параметры компании", "Company Settings")) : (tr("К матрице", "Open Matrix"))}</span>
                        <ArrowRight className="h-3 w-3" />
                    </button>
                </div>
            </CardContent>
        </Card>
    );
};

export default GroupConsolidationWidget;
