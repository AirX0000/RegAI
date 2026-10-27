import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WidgetProps } from '../types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { 
    FileText, 
    Building2, 
    Receipt, 
    Activity, 
    Users, 
    Sparkles,
    FileSpreadsheet
} from 'lucide-react';
import { PERMISSIONS } from '@/lib/permissions';
import { useTranslation } from 'react-i18next';

export const QuickActionsWidget: React.FC<WidgetProps> = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { i18n } = useTranslation();
    const isEn = (i18n.language || 'ru').toLowerCase().startsWith('en');

    const actions = [
        {
            label: isEn ? 'Smart 1C Import' : 'Умный импорт 1С',
            icon: <FileSpreadsheet className="h-4 w-4 text-purple-500" />,
            onClick: () => navigate('/transformation/upload'),
            description: isEn ? 'Auto-map trial balance' : 'Автомаппинг ОСВ и счетов',
            show: PERMISSIONS.canUploadBalanceSheet(user?.role),
            badge: isEn ? 'Smart' : 'AI'
        },
        {
            label: isEn ? 'Group Consolidation' : 'Консолидация группы',
            icon: <Building2 className="h-4 w-4 text-blue-500" />,
            onClick: () => navigate('/hierarchy'),
            description: isEn ? 'IFRS 10 holding matrix' : 'Матрица холдинга по МСФО 10',
            show: PERMISSIONS.canViewHierarchy(user?.role),
            badge: 'IFRS 10'
        },
        {
            label: isEn ? 'IFRS Package (4p)' : 'Пакет МСФО (4 стр)',
            icon: <FileText className="h-4 w-4 text-indigo-500" />,
            onClick: () => navigate('/reports'),
            description: isEn ? 'Full disclosure booklet' : 'Буклет с заключением МСА 700',
            show: PERMISSIONS.canCreateReports(user?.role)
        },
        {
            label: isEn ? 'Tax Protocol' : 'Налоговый протокол',
            icon: <Receipt className="h-4 w-4 text-emerald-500" />,
            onClick: () => navigate('/tax-config'),
            description: isEn ? 'Soliq.uz CIT & VAT rates' : 'Сверка CIT 15%, VAT 12%',
            show: PERMISSIONS.canManageCompanySettings(user?.role)
        },
        {
            label: isEn ? 'Audit Log' : 'Журнал аудита',
            icon: <Activity className="h-4 w-4 text-orange-500" />,
            onClick: () => navigate('/audit-log'),
            description: isEn ? 'Operation history' : 'История изменений и проводок',
            show: PERMISSIONS.canViewAuditLogs(user?.role)
        },
        {
            label: isEn ? 'Manage Users' : 'Пользователи',
            icon: <Users className="h-4 w-4 text-rose-500" />,
            onClick: () => navigate('/users'),
            description: isEn ? '5-level access roles' : '5 уровней ролей и прав',
            show: PERMISSIONS.canManageUsers(user?.role)
        }
    ];

    const visibleActions = actions.filter(a => a.show);

    return (
        <Card className="h-full flex flex-col justify-between">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-amber-500" />
                        {isEn ? "Quick Actions Hub" : "Быстрые действия"}
                    </CardTitle>
                    <span className="text-[11px] text-muted-foreground font-medium">
                        {visibleActions.length} {isEn ? "actions" : "действий"}
                    </span>
                </div>
            </CardHeader>
            <CardContent className="pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                    {visibleActions.map((action, idx) => (
                        <button
                            key={idx}
                            onClick={action.onClick}
                            className="flex items-center text-left gap-3 p-2 rounded-lg border bg-card/60 hover:bg-accent/60 hover:border-blue-300 dark:hover:border-blue-800 transition-all duration-150 w-full group"
                        >
                            <div className="p-2 bg-muted/80 rounded-md group-hover:scale-105 transition-transform shrink-0">
                                {action.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                    <p className="text-xs font-semibold truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {action.label}
                                    </p>
                                    {action.badge && (
                                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                                            {action.badge}
                                        </span>
                                    )}
                                </div>
                                <p className="text-[10px] text-muted-foreground truncate">{action.description}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default QuickActionsWidget;
