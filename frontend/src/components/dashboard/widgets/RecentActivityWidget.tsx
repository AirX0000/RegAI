import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WidgetProps } from '../types';
import { Activity } from 'lucide-react';

export const RecentActivityWidget: React.FC<WidgetProps> = ({ data }) => {
    const activities = data?.recent_activity || [];

    return (
        <Card className="h-full col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    Recent Activity
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="space-y-4 max-h-[200px] overflow-y-auto pr-2">
                    {activities.length === 0 ? (
                        <div className="text-sm text-muted-foreground text-center py-4">No recent activity</div>
                    ) : (
                        activities.map((activity) => (
                            <div key={activity.id} className="flex items-start pb-4 last:mb-0 last:pb-0 border-b last:border-0">
                                <div className="ml-1 space-y-1">
                                    <p className="text-sm font-medium leading-none">
                                        {activity.action}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {activity.details}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground pt-1">
                                        {new Date(activity.timestamp).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
