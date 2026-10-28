import React from 'react';
import { tr } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { WidgetProps } from '../types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const TransformationChartWidget: React.FC<WidgetProps> = ({ data }) => {
    const { i18n } = useTranslation();
    void i18n.language;
    const chartData = data?.chart_data && data.chart_data.length > 0 ? data.chart_data : [
        { month: tr("Май", "May"), statements: 4, volume_uzs: 48000000, ifrs16: 12000000, ifrs9: 3500000 },
        { month: tr("Июн", "Jun"), statements: 7, volume_uzs: 82000000, ifrs16: 18500000, ifrs9: 6200000 },
        { month: tr("Июл", "Jul"), statements: 9, volume_uzs: 115000000, ifrs16: 24000000, ifrs9: 8100000 },
        { month: tr("Авг", "Aug"), statements: 11, volume_uzs: 152000000, ifrs16: 31000000, ifrs9: 10400000 },
        { month: tr("Сен", "Sep"), statements: 13, volume_uzs: 198000000, ifrs16: 38000000, ifrs9: 12800000 },
        { month: tr("Окт", "Oct"), statements: 14, volume_uzs: 248200000, ifrs16: 45000000, ifrs9: 15600000 },
    ];

    const formattedData = chartData.map(d => ({
        ...d,
        volume_mln: Math.round(d.volume_uzs / 1000000),
        ifrs16_mln: Math.round(d.ifrs16 / 1000000),
        ifrs9_mln: Math.round(d.ifrs9 / 1000000),
    }));

    return (
        <Card className="h-full flex flex-col justify-between">
            <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-indigo-500" />
                            {tr("Динамика трансформации в МСФО", "IFRS Transformation Dynamics")}
                        </CardTitle>
                        <CardDescription className="text-xs">
                            {tr("Совокупный объем трансформаций и корректировок (млн сум)", "Aggregated monthly volume and standard adjustments (M UZS)")}
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                            <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 inline-block" />
                            {tr("Общий объем", "Total Volume")}
                        </span>
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                            <span className="h-2.5 w-2.5 rounded-full bg-purple-500 inline-block" />
                            IFRS 16
                        </span>
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block" />
                            IFRS 9
                        </span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-2 flex-1 min-w-0">
                <div className="h-[210px] w-full min-w-0" style={{ minHeight: 210 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                                </linearGradient>
                                <linearGradient id="colorIfrs16" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                            <XAxis 
                                dataKey="month" 
                                tickLine={false} 
                                axisLine={false} 
                                tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.7 }}
                            />
                            <YAxis 
                                tickLine={false} 
                                axisLine={false} 
                                tickFormatter={(v) => `${v}M`} 
                                tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.7 }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    color: '#fff',
                                    fontSize: '12px',
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
                                }}
                                formatter={(value: any, name: any) => {
                                    const label = name === 'volume_mln' 
                                        ? (tr('Общий объем', 'Total Volume'))
                                        : name === 'ifrs16_mln'
                                        ? 'IFRS 16'
                                        : 'IFRS 9';
                                    return [`${value}M UZS`, label];
                                }}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="volume_mln" 
                                stroke="#6366f1" 
                                strokeWidth={2.5} 
                                fillOpacity={1} 
                                fill="url(#colorVolume)" 
                            />
                            <Area 
                                type="monotone" 
                                dataKey="ifrs16_mln" 
                                stroke="#a855f7" 
                                strokeWidth={1.8} 
                                fillOpacity={1} 
                                fill="url(#colorIfrs16)" 
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border/50 text-center">
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800">
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold block">IFRS 16 (Аренда)</span>
                        <span className="text-sm font-bold text-purple-600 dark:text-purple-400">45.0M UZS</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800">
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold block">IFRS 9 (ECL)</span>
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">15.6M UZS</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800">
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold block">IAS 36 (Тест)</span>
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">8.2M UZS</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default TransformationChartWidget;
