import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WidgetProps } from '../types';
import { RefreshCw, Database, Check } from 'lucide-react';

export const OneCSyncWidget: React.FC<WidgetProps> = ({ data }) => {
    const status = data?.one_c_status;

    return (
        <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    1C Integration
                </CardTitle>
                <Database className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
                <div className="flex items-center space-x-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${status?.connected ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-sm font-medium">{status?.connected ? 'Connected' : 'Disconnected'}</span>
                </div>

                {status?.connected && (
                    <div className="mt-2 text-xs text-muted-foreground">
                        Last sync: {status.last_sync}
                    </div>
                )}

                <div className="mt-4">
                    <button className="w-full flex items-center justify-center space-x-2 text-xs bg-secondary hover:bg-secondary/80 text-secondary-foreground py-2 rounded-md transition-colors">
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Sync Now
                    </button>
                </div>
            </CardContent>
        </Card>
    );
};
