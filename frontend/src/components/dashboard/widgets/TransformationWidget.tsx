import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WidgetProps } from '../types';
import { ArrowRightLeft, Clock } from 'lucide-react';

export const TransformationWidget: React.FC<WidgetProps> = ({ data }) => {
    const stats = data?.transformation;

    return (
        <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    MCFO ↔ IFRS
                </CardTitle>
                <ArrowRightLeft className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats?.total_processed || 0}</div>
                <p className="text-xs text-muted-foreground">
                    Statements Processed
                </p>

                <div className="mt-4 pt-4 border-t flex items-center justify-between">
                    <div className="flex items-center text-sm text-green-600">
                        <Clock className="h-4 w-4 mr-1" />
                        <span className="font-bold">{stats?.saved_hours || 0}h</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Saved this month</span>
                </div>
            </CardContent>
        </Card>
    );
};
