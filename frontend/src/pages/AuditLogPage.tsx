import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, User, Download, Activity, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function AuditLogPage() {
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
            setLogs(response.data.logs || []);
            setTotal(response.data.total || 0);

            // Fetch stats
            const statsResponse = await api.get('/audit-logs/stats');
            setStats(statsResponse.data);
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

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Failed to export audit logs:', error);
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
            'create': 'bg-green-100 text-green-800 border-green-300',
            'update': 'bg-blue-100 text-blue-800 border-blue-300',
            'delete': 'bg-red-100 text-red-800 border-red-300',
            'login': 'bg-purple-100 text-purple-800 border-purple-300',
            'logout': 'bg-gray-100 text-gray-800 border-gray-300',
            'view': 'bg-cyan-100 text-cyan-800 border-cyan-300'
        };
        return colors[action.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-300';
    };

    const getActionIcon = (action: string) => {
        switch (action.toLowerCase()) {
            case 'create': return <CheckCircle className="h-3 w-3" />;
            case 'update': return <Clock className="h-3 w-3" />;
            case 'delete': return <XCircle className="h-3 w-3" />;
            case 'login': return <User className="h-3 w-3" />;
            default: return <Activity className="h-3 w-3" />;
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    if (loading && logs.length === 0) {
        return <div className="p-8 flex justify-center">Loading audit logs...</div>;
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Shield className="h-8 w-8 text-blue-600" />
                        Audit Trail
                    </h1>
                    <p className="text-gray-500 mt-1">System-wide activity log</p>
                </div>
                <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Export CSV
                </Button>
            </div>

            {/* Statistics Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Total Actions</p>
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
                                    <p className="text-sm text-gray-500">Today</p>
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
                                    <p className="text-sm text-gray-500">Active Users</p>
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
                                    <p className="text-sm text-gray-500">Critical Actions</p>
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
                    <CardTitle className="text-lg">Filters</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">Action</label>
                            <select
                                className="w-full border rounded-md p-2"
                                value={filters.action}
                                onChange={(e) => handleFilterChange('action', e.target.value)}
                            >
                                <option value="">All actions</option>
                                <option value="create">Create</option>
                                <option value="update">Update</option>
                                <option value="delete">Delete</option>
                                <option value="login">Login</option>
                                <option value="logout">Logout</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-2 block">Start Date</label>
                            <Input
                                type="date"
                                value={filters.start_date}
                                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-2 block">End Date</label>
                            <Input
                                type="date"
                                value={filters.end_date}
                                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                            />
                        </div>

                        <div className="flex items-end">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setFilters({ action: '', user_id: '', start_date: '', end_date: '' });
                                    setPage(0);
                                }}
                                className="w-full"
                            >
                                Clear Filters
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
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                                            {formatDate(log.timestamp)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-gray-400" />
                                                <div>
                                                    <div className="font-medium text-sm">{log.user_name}</div>
                                                    <div className="text-xs text-gray-500">{log.user_email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getActionColor(log.action)}`}>
                                                {getActionIcon(log.action)}
                                                {log.action.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm">
                                                <div className="font-medium">{log.resource_type || 'N/A'}</div>
                                                {log.resource_id && (
                                                    <div className="text-gray-500 font-mono text-xs">
                                                        {log.resource_id.substring(0, 8)}...
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 max-w-xs truncate text-sm text-gray-600">
                                            {log.details || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-500">
                                            {log.ip_address || '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {logs.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            No audit logs found
                        </div>
                    )}

                    {/* Pagination */}
                    <div className="flex items-center justify-between p-4 border-t">
                        <div className="text-sm text-gray-500">
                            Showing {page * 50 + 1} to {Math.min((page + 1) * 50, total)} of {total} entries
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => p + 1)}
                                disabled={(page + 1) * 50 >= total}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
