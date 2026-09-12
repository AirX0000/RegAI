import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WidgetProps } from '../types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { FileText, UploadCloud, ShieldCheck, Users, Activity } from 'lucide-react';
import { PERMISSIONS } from '@/lib/permissions';

export const QuickActionsWidget: React.FC<WidgetProps> = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const actions = [
        {
            label: 'New Report',
            icon: <FileText className="h-4 w-4 text-blue-500" />,
            onClick: () => navigate('/reports'),
            description: 'Generate compliance report',
            show: PERMISSIONS.canCreateReports(user?.role)
        },
        {
            label: 'Upload Balance Sheet',
            icon: <UploadCloud className="h-4 w-4 text-purple-500" />,
            onClick: () => navigate('/transformation/new'),
            description: 'Import new statement',
            show: PERMISSIONS.canUploadBalanceSheet(user?.role)
        },
        {
            label: 'Verify System',
            icon: <ShieldCheck className="h-4 w-4 text-green-500" />,
            onClick: () => navigate('/compliance'),
            description: 'Check active regulations',
            show: PERMISSIONS.canViewCompliance(user?.role)
        },
        {
            label: 'Audit Log',
            icon: <Activity className="h-4 w-4 text-orange-500" />,
            onClick: () => navigate('/audit-log'),
            description: 'View operation history',
            show: PERMISSIONS.canViewAuditLogs(user?.role)
        },
        {
            label: 'Manage Users',
            icon: <Users className="h-4 w-4 text-rose-500" />,
            onClick: () => navigate('/users'),
            description: 'Configure roles & access',
            show: PERMISSIONS.canManageUsers(user?.role)
        }
    ];

    return (
        <Card className="h-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-2">
                {actions.filter(a => a.show).map((action, idx) => (
                    <button
                        key={idx}
                        onClick={action.onClick}
                        className="flex items-center text-left space-x-3 p-2 rounded-lg border bg-card hover:bg-accent hover:text-accent-foreground transition-all duration-200 w-full"
                    >
                        <div className="p-2 bg-muted rounded-md">
                            {action.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate">{action.label}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{action.description}</p>
                        </div>
                    </button>
                ))}
            </CardContent>
        </Card>
    );
};
