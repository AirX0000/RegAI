import React from 'react';
import { tr } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WidgetProps } from '../types';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const ComplianceWidget: React.FC<WidgetProps> = ({ data }) => {
    const { i18n } = useTranslation();
    void i18n.language;
    const compliance = data?.compliance;

    if (!compliance) {
        return (
            <Card className="h-full">
                <CardHeader>
                    <CardTitle>{tr("Индекс соответствия", "Compliance Score")}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-20 text-muted-foreground">
                        {tr("Данные отсутствуют", "No data available")}
                    </div>
                </CardContent>
            </Card>
        );
    }

    const isGood = compliance.score >= 80;

    const getStatusText = (status: string) => {
        if (status.toLowerCase().includes('good')) return tr('В норме', 'Good status', 'Me\'yorda');
        if (status.toLowerCase().includes('warning') || status.toLowerCase().includes('need')) return tr('Требует внимания', 'Needs attention', 'E\'tibor talab qiladi');
        return tr('Активный статус', `${status} status`, 'Faol holat');
    };

    return (
        <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {tr("Индекс комплаенса", "Compliance Health")}
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
                            {tr("Ожидающие задачи:", "Pending Tasks:")}
                        </span>
                        <span className="font-medium">{compliance.pending_tasks}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
