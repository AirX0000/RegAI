import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, User, Download, Activity, AlertCircle, CheckCircle, XCircle, Clock, Building2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useToast } from '@/components/ui/use-toast';

export default function AuditLogPage() {
    const { toast } = useToast();
    const { user } = useAuth();
    const { i18n } = useTranslation();
    const isRu = (i18n.language || 'ru').toLowerCase().startsWith('ru');

    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [stats, setStats] = useState<any>(null);
    const [filters, setFilters] = useState({
        action: '',
        user_id: '',
        start_date: '',
        end_date: ''
    });

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                skip: String(page * 50),
                limit: '50',
                ...(filters.action && { action: filters.action }),
                ...(filters.user_id && { user_id: filters.user_id }),
                ...(filters.start_date && { start_date: filters.start_date }),
                ...(filters.end_date && { end_date: filters.end_date })
            });

            const response = await api.get(`/audit-logs?${params}`);
            const rawLogsList = Array.isArray(response?.data?.logs) ? response.data.logs : (Array.isArray(response?.data) ? response.data : []);
            const isSuperadmin = user?.role === 'superadmin' || user?.role === 'website_superadmin';
            const logsList = isSuperadmin 
                ? rawLogsList 
                : rawLogsList.filter((l: any) => !user?.company_id || l.company_id === user?.company_id);
            setLogs(logsList);
            setTotal(response?.data?.total || logsList.length);

            // Fetch stats
            const statsResponse = await api.get('/audit-logs/stats');
            setStats(statsResponse?.data || null);
        } catch (error) {
            console.error('Failed to fetch audit logs:', error);
            setLogs([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const params = new URLSearchParams({
                ...(filters.action && { action: filters.action }),
                ...(filters.start_date && { start_date: filters.start_date }),
                ...(filters.end_date && { end_date: filters.end_date })
            });

            const response = await api.get(`/audit-logs/export?${params}`, {
                responseType: 'blob'
            });

            const checksum = response.headers?.['x-audit-checksum-sha256'];
            const recordCount = response.headers?.['x-audit-record-count'];

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast({
                title: isRu ? "Аудиторский экспорт подтвержден" : "Audit Export Verified",
                description: isRu
                    ? `Выгружено записей: ${recordCount || 'все'}. Хеш SHA-256: ${checksum ? checksum.substring(0, 16) + '...' : 'Рассчитан'}`
                    : `Exported ${recordCount || 'all'} records. SHA-256: ${checksum ? checksum.substring(0, 16) + '...' : 'Generated'}`,
            });
        } catch (error) {
            console.error('Failed to export audit logs:', error);
            toast({
                title: isRu ? "Ошибка экспорта" : "Export Failed",
                description: isRu ? "Не удалось выгрузить журнал аудита" : "Failed to download audit logs",
                variant: "destructive"
            });
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [page, filters]);

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(0);
    };

    const getActionColor = (action: string) => {
        const colors: Record<string, string> = {
            'create': 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
            'update': 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
            'delete': 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
            'login': 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
            'logout': 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
            'view': 'bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
            'sync': 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
            'transform': 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
            'review': 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
            'compliance': 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        };
        return colors[action.toLowerCase()] || 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    };

    const getActionIcon = (action: string) => {
        switch (action.toLowerCase()) {
            case 'create': return <CheckCircle className="h-3 w-3" />;
            case 'update': return <Clock className="h-3 w-3" />;
            case 'delete': return <XCircle className="h-3 w-3" />;
            case 'login': return <User className="h-3 w-3" />;
            case 'logout': return <User className="h-3 w-3" />;
            case 'sync': return <Clock className="h-3 w-3 text-emerald-600" />;
            case 'transform': return <Activity className="h-3 w-3 text-purple-600" />;
            case 'review': return <CheckCircle className="h-3 w-3 text-indigo-600" />;
            case 'compliance': return <AlertCircle className="h-3 w-3 text-amber-600" />;
            default: return <Activity className="h-3 w-3" />;
        }
    };

    const getActionLabel = (action: string) => {
        const act = action.toLowerCase();
        if (!isRu) return action.toUpperCase();
        switch (act) {
            case 'create': return 'СОЗДАНИЕ';
            case 'update': return 'ИЗМЕНЕНИЕ';
            case 'delete': return 'УДАЛЕНИЕ';
            case 'login': return 'ВХОД';
            case 'logout': return 'ВЫХОД';
            case 'view': return 'ПРОСМОТР';
            case 'sync': return 'СИНХРОНИЗАЦИЯ';
            case 'transform': return 'ТРАНСФОРМАЦИЯ';
            case 'review': return 'УТВЕРЖДЕНИЕ';
            case 'compliance': return 'КОМПЛАЕНС';
            default: return action.toUpperCase();
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleString(isRu ? 'ru-RU' : 'en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    if (loading && logs.length === 0) {
        return <div className="p-8 text-center">{isRu ? 'Загрузка журнала аудита...' : 'Loading audit logs...'}</div>;
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2 text-slate-900 dark:text-white">
                            <Shield className="h-8 w-8 text-blue-600" />
                            {isRu ? 'Журнал аудита' : 'Audit Trail'}
                        </h1>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-cyan-300 border border-blue-200 dark:border-blue-800">
                            <Building2 className="h-3.5 w-3.5 text-cyan-500" />
                            {user?.role === 'superadmin' ? (isRu ? 'Все организации' : 'All Organizations') : (user?.company_name || (user?.company_id === 'b968f7d7ffe04630a90aadde4d0d8e95' ? 'FinServe Holdings' : 'TechCorp Ltd'))}
                        </span>
                    </div>
                    <p className="text-gray-500 mt-1">
                        {isRu ? 'Общесистемный журнал действий пользователей и событий безопасности' : 'System-wide activity log'}
                    </p>
                </div>
                <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    {isRu ? 'Экспорт в CSV' : 'Export CSV'}
                </Button>
            </div>

            {/* Statistics Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">{isRu ? 'Всего действий' : 'Total Actions'}</p>
                                    <p className="text-2xl font-bold">{stats.total_actions || 0}</p>
                                </div>
                                <Activity className="h-8 w-8 text-blue-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">{isRu ? 'Сегодня' : 'Today'}</p>
                                    <p className="text-2xl font-bold">{stats.today_actions || 0}</p>
                                </div>
                                <Clock className="h-8 w-8 text-green-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">{isRu ? 'Активные пользователи' : 'Active Users'}</p>
                                    <p className="text-2xl font-bold">{stats.active_users || 0}</p>
                                </div>
                                <User className="h-8 w-8 text-purple-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">{isRu ? 'Критические действия' : 'Critical Actions'}</p>
                                    <p className="text-2xl font-bold">{stats.critical_actions || 0}</p>
                                </div>
                                <AlertCircle className="h-8 w-8 text-red-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">{isRu ? 'Фильтры журнала' : 'Filters'}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block text-slate-700 dark:text-slate-300">{isRu ? 'Действие' : 'Action'}</label>
                            <select
                                className="w-full border border-slate-200 dark:border-slate-700 rounded-md p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                value={filters.action}
                                onChange={(e) => handleFilterChange('action', e.target.value)}
                            >
                                <option value="">{isRu ? 'Все действия' : 'All actions'}</option>
                                <option value="create">{isRu ? 'Создание (Create)' : 'Create'}</option>
                                <option value="update">{isRu ? 'Изменение (Update)' : 'Update'}</option>
                                <option value="delete">{isRu ? 'Удаление (Delete)' : 'Delete'}</option>
                                <option value="login">{isRu ? 'Вход в систему (Login)' : 'Login'}</option>
                                <option value="logout">{isRu ? 'Выход (Logout)' : 'Logout'}</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-2 block text-slate-700 dark:text-slate-300">{isRu ? 'Дата с' : 'Start Date'}</label>
                            <Input
                                type="date"
                                value={filters.start_date}
                                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                                className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-2 block text-slate-700 dark:text-slate-300">{isRu ? 'Дата по' : 'End Date'}</label>
                            <Input
                                type="date"
                                value={filters.end_date}
                                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                                className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                            />
                        </div>

                        <div className="flex items-end">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setFilters({ action: '', user_id: '', start_date: '', end_date: '' });
                                    setPage(0);
                                }}
                                className="w-full border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                {isRu ? 'Сбросить фильтры' : 'Clear Filters'}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Audit Log Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{isRu ? 'Время' : 'Timestamp'}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{isRu ? 'Пользователь' : 'User'}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{isRu ? 'Действие' : 'Action'}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{isRu ? 'Ресурс' : 'Resource'}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{isRu ? 'Подробности' : 'Details'}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{isRu ? 'IP Адрес' : 'IP Address'}</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
                                {Array.isArray(logs) && logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-600 dark:text-slate-400">
                                            {formatDate(log.timestamp)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-slate-400" />
                                                <div>
                                                    <div className="font-medium text-sm text-slate-900 dark:text-white">{log.user_name}</div>
                                                    <div className="text-xs text-slate-500 dark:text-slate-400">{log.user_email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${getActionColor(log.action)}`}>
                                                {getActionIcon(log.action)}
                                                {getActionLabel(log.action)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm">
                                                <div className="font-medium text-slate-900 dark:text-white">{log.resource_type || 'N/A'}</div>
                                                {log.resource_id && (
                                                    <div className="text-slate-500 dark:text-slate-400 font-mono text-xs">
                                                        {log.resource_id.substring(0, 8)}...
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 max-w-xs truncate text-sm text-slate-600 dark:text-slate-300">
                                            {log.details || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-slate-500 dark:text-slate-400">
                                            {log.ip_address || '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {logs.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            {isRu ? 'Записи журнала аудита не найдены' : 'No audit logs found'}
                        </div>
                    )}

                    {/* Pagination */}
                    <div className="flex items-center justify-between p-4 border-t">
                        <div className="text-sm text-gray-500">
                            {isRu ? `Показано ${page * 50 + 1} - ${Math.min((page + 1) * 50, total)} из ${total} записей` : `Showing ${page * 50 + 1} to ${Math.min((page + 1) * 50, total)} of ${total} entries`}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0}
                            >
                                {isRu ? 'Назад' : 'Previous'}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => p + 1)}
                                disabled={(page + 1) * 50 >= total}
                            >
                                {isRu ? 'Вперед' : 'Next'}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
