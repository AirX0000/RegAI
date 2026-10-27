import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WidgetProps } from '../types';
import { ArrowRightLeft, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const TransformationWidget: React.FC<WidgetProps> = ({ data }) => {
    const { i18n } = useTranslation();
    const isEn = (i18n.language || 'ru').toLowerCase().startsWith('en');

    const stats = data?.transformation;

    return (
        <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {isEn ? "NAS / НСБУ ↔ IFRS" : "НСБУ ↔ МСФО"}
                </CardTitle>
                <ArrowRightLeft className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats?.total_processed || 0}</div>
                <p className="text-xs text-muted-foreground">
                    {isEn ? "Statements Processed" : "Отчетов обработано"}
                </p>

                <div className="mt-4 pt-4 border-t flex items-center justify-between">
                    <div className="flex items-center text-sm text-green-600 dark:text-emerald-400">
                        <Clock className="h-4 w-4 mr-1" />
                        <span className="font-bold">{stats?.saved_hours || 0}{isEn ? 'h' : ' ч'}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                        {isEn ? "Saved this month" : "Сэкономлено за месяц"}
                    </span>
                </div>
            </CardContent>
        </Card>
    );
};
