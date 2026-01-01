import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WidgetProps } from '../types';
import { CheckCircle, AlertTriangle } from 'lucide-react';

export const ComplianceWidget: React.FC<WidgetProps> = ({ data }) => {
    const compliance = data?.compliance;

    if (!compliance) {
        return (
            <Card className="h-full">
                <CardHeader>
                    <CardTitle>Compliance Score</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-20 text-muted-foreground">
                        No data available
                    </div>
                </CardContent>
            </Card>
        );
    }

    const isGood = compliance.score >= 80;

    return (
        <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    Compliance Health
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
                    {compliance.status} status
                </p>
                <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Pending Tasks:</span>
                        <span className="font-medium">{compliance.pending_tasks}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
