import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WidgetProps } from '../types';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const ComplianceWidget: React.FC<WidgetProps> = ({ data }) => {
    const { i18n } = useTranslation();
    const isEn = (i18n.language || 'ru').toLowerCase().startsWith('en');
    const compliance = data?.compliance;

    if (!compliance) {
        return (
            <Card className="h-full">
                <CardHeader>
                    <CardTitle>{isEn ? "Compliance Score" : "Индекс соответствия"}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-20 text-muted-foreground">
                        {isEn ? "No data available" : "Данные отсутствуют"}
                    </div>
                </CardContent>
            </Card>
        );
    }

    const isGood = compliance.score >= 80;

    const getStatusText = (status: string) => {
        if (isEn) return `${status} status`;
        if (status.toLowerCase().includes('good')) return 'В норме';
        if (status.toLowerCase().includes('warning') || status.toLowerCase().includes('need')) return 'Требует внимания';
        return 'Активный статус';
    };

    return (
        <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {isEn ? "Compliance Health" : "Индекс комплаенса"}
                </CardTitle>
                {isGood ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                )}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{compliance.score}%</div>
                <p className="text-xs text-muted-foreground">
                    {getStatusText(compliance.status)}
                </p>
                <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                            {isEn ? "Pending Tasks:" : "Ожидающие задачи:"}
                        </span>
                        <span className="font-medium">{compliance.pending_tasks}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
