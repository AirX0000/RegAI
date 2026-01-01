import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import {
    AlertTriangle, CheckCircle, XCircle, Clock, Download,
    Filter, Search, TrendingUp, AlertCircle
} from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Alert {
    id: string;
    message: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    status: 'open' | 'in_progress' | 'resolved' | 'dismissed';
    regulation?: string;
    company_id?: string;
    notes?: string;
    created_at: string;
    resolved_at?: string;
}

interface Stats {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    open: number;
    in_progress: number;
    resolved: number;
    dismissed: number;
    compliance_score: number;
}

const SEVERITY_COLORS = {
    critical: '#DC2626',
    high: '#F97316',
    medium: '#FBBF24',
    low: '#10B981',
};

import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';

export default function CompliancePage() {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [selectedAlerts, setSelectedAlerts] = useState<string[]>([]);
    const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
    const [showAlertModal, setShowAlertModal] = useState(false);

    // Get category from URL and map to regulation filter
    const categoryParam = searchParams.get('category');
    const getCategoryRegulation = (category: string | null) => {
        if (!category) return '';
        const categoryMap: Record<string, string> = {
            'privacy': 'GDPR',
            'healthcare': 'HIPAA',
            'finance': 'IFRS',
            'security': 'ISO',
            'labor': 'Labor',
            'environmental': 'Environmental',
            'tax': 'Tax',
            'consumer': 'CCPA'
        };
        return categoryMap[category.toLowerCase()] || category;
    };

    const [filters, setFilters] = useState({
        severity: '',
        status: 'open,in_progress', // Default: show only active alerts
        regulation: getCategoryRegulation(categoryParam),
        search: '',
    });
    const [isChecking, setIsChecking] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        fetchAlerts();
        fetchStats();
    }, [filters]);

    const fetchAlerts = async () => {
        try {
            const params = new URLSearchParams({
                sort_by: 'created_at',
                sort_order: 'desc',
                ...(filters.severity && { severity: filters.severity }),
                ...(filters.status && { status: filters.status }),
                ...(filters.regulation && { regulation: filters.regulation }),
                ...(filters.search && { search: filters.search }),
            });
            const res = await api.get(`/compliance/alerts?${params}`);
            setAlerts(res.data);
        } catch (error) {
            console.error('Failed to fetch alerts', error);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await api.get('/compliance/stats');
            setStats(res.data);
        } catch (error) {
            console.error('Failed to fetch stats', error);
        }
    };

    const handleUpdateStatus = async (alertId: string, status: string) => {
        try {
            await api.put(`/compliance/alerts/${alertId}`, { status });
            toast({
                title: t('success'),
                description: `${t('alert_marked_as')} ${status.replace('_', ' ')}`,
            });
            fetchAlerts();
            fetchStats();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: t('error'),
                description: error.response?.data?.detail || t('failed_to_update_alert'),
            });
        }
    };

    const handleBulkUpdate = async (status: string) => {
        if (selectedAlerts.length === 0) {
            toast({
                variant: "destructive",
                title: t('error'),
                description: t('please_select_alerts_first'),
            });
            return;
        }

        try {
            await api.post('/compliance/alerts/bulk-update', {
                alert_ids: selectedAlerts,
                status,
            });
            toast({
                title: t('success'),
                description: `${selectedAlerts.length} ${t('alerts_updated')}`,
            });
            setSelectedAlerts([]);
            fetchAlerts();
            fetchStats();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: t('error'),
                description: error.response?.data?.detail || t('failed_to_update_alerts'),
            });
        }
    };

    const handleExport = async () => {
        try {
            const params = new URLSearchParams({
                ...(filters.severity && { severity: filters.severity }),
                ...(filters.status && { status: filters.status }),
                ...(filters.regulation && { regulation: filters.regulation }),
            });
            const res = await api.get(`/compliance/export/excel?${params}`, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'compliance_alerts.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast({
                title: t('success'),
                description: t('alerts_exported_successfully'),
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: t('error'),
                description: t('failed_to_export_alerts'),
            });
        }
    };

    const runCheck = async () => {
        setIsChecking(true);
        try {
            const res = await api.post('/compliance/run-check');
            toast({
                title: t('success'),
                description: `${t('compliance_check_completed')}. ${res.data.new_alerts} ${t('new_alerts_found')}`,
            });
            fetchAlerts();
            fetchStats();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: t('error'),
                description: error.response?.data?.detail || t('failed_to_run_check'),
            });
        } finally {
            setIsChecking(false);
        }
    };

    const toggleSelectAlert = (id: string) => {
        setSelectedAlerts(prev =>
            prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
        );
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'critical': return <AlertTriangle className="h-5 w-5 text-red-600" />;
            case 'high': return <AlertCircle className="h-5 w-5 text-orange-600" />;
            case 'medium': return <AlertCircle className="h-5 w-5 text-yellow-600" />;
            default: return <AlertCircle className="h-5 w-5 text-green-600" />;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'resolved': return <CheckCircle className="h-4 w-4 text-green-600" />;
            case 'in_progress': return <Clock className="h-4 w-4 text-blue-600" />;
            case 'dismissed': return <XCircle className="h-4 w-4 text-gray-600" />;
            default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
        }
    };

    const severityData = stats ? [
        { name: t('critical'), value: stats.critical, color: SEVERITY_COLORS.critical },
        { name: t('high'), value: stats.high, color: SEVERITY_COLORS.high },
        { name: t('medium'), value: stats.medium, color: SEVERITY_COLORS.medium },
        { name: t('low'), value: stats.low, color: SEVERITY_COLORS.low },
    ] : [];

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">{t('compliance_dashboard')}</h1>
                    <p className="text-gray-500">{t('gap_analysis_subtitle')}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" />
                        {t('export_excel')}
                    </Button>
                    <Button onClick={runCheck} disabled={isChecking}>
                        {isChecking ? t('running') : t('run_compliance_check')}
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow border">
                        <div className="text-sm text-gray-600">{t('total_alerts')}</div>
                        <div className="text-3xl font-bold">{stats.total}</div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg shadow border border-red-200">
                        <div className="text-sm text-red-600">{t('critical')}</div>
                        <div className="text-3xl font-bold text-red-600">{stats.critical}</div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg shadow border border-orange-200">
                        <div className="text-sm text-orange-600">{t('high')}</div>
                        <div className="text-3xl font-bold text-orange-600">{stats.high}</div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg shadow border border-blue-200">
                        <div className="text-sm text-blue-600">{t('in_progress')}</div>
                        <div className="text-3xl font-bold text-blue-600">{stats.in_progress}</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg shadow border border-green-200">
                        <div className="text-sm text-green-600">{t('compliance_score')}</div>
                        <div className="text-3xl font-bold text-green-600">{stats.compliance_score}%</div>
                    </div>
                </div>
            )}

            {/* Charts */}
            {stats && stats.total > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="text-lg font-semibold mb-4">{t('alerts_by_severity')}</h3>
                        <p className="text-xs text-gray-500 mb-2">💡 {t('click_severity_filter')}</p>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={severityData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, value }) => `${name}: ${value}`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                    onClick={(data) => setFilters({ ...filters, severity: data.name.toLowerCase() })}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {severityData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="text-lg font-semibold mb-4">{t('status_distribution')}</h3>
                        <p className="text-xs text-gray-500 mb-2">💡 {t('click_status_filter')}</p>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart
                                data={[
                                    { name: t('open'), value: stats.open, status: 'open' },
                                    { name: t('in_progress'), value: stats.in_progress, status: 'in_progress' },
                                    { name: t('resolved'), value: stats.resolved, status: 'resolved' },
                                    { name: t('dismissed'), value: stats.dismissed, status: 'dismissed' },
                                ]}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar
                                    dataKey="value"
                                    fill="#3B82F6"
                                    onClick={(data: any) => setFilters({ ...filters, status: data.status })}
                                    style={{ cursor: 'pointer' }}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="h-5 w-5 text-gray-600" />
                    <h3 className="font-semibold">{t('filters')}</h3>
                    {(filters.severity || filters.status || filters.regulation || filters.search) && (
                        <button
                            onClick={() => setFilters({ severity: '', status: '', regulation: '', search: '' })}
                            className="ml-auto text-sm text-blue-600 hover:underline"
                        >
                            {t('clear_all_filters')}
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('search')}</label>
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                type="text"
                                placeholder={t('search_alerts')}
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                className="pl-8"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('severity')}</label>
                        <select
                            value={filters.severity}
                            onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                            className="w-full border rounded-md p-2"
                        >
                            <option value="">{t('all')}</option>
                            <option value="critical">{t('critical')}</option>
                            <option value="high">{t('high')}</option>
                            <option value="medium">{t('medium')}</option>
                            <option value="low">{t('low')}</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('status')}</label>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            className="w-full border rounded-md p-2"
                        >
                            <option value="">{t('all')}</option>
                            <option value="open">{t('open')}</option>
                            <option value="in_progress">{t('in_progress')}</option>
                            <option value="resolved">{t('resolved')}</option>
                            <option value="dismissed">{t('dismissed')}</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('regulation')}</label>
                        <Input
                            type="text"
                            placeholder="e.g., GDPR, CCPA"
                            value={filters.regulation}
                            onChange={(e) => setFilters({ ...filters, regulation: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedAlerts.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                        <span className="font-medium">{selectedAlerts.length} {t('alerts_selected')}</span>
                        <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleBulkUpdate('in_progress')}>
                                {t('mark_in_progress')}
                            </Button>
                            <Button size="sm" onClick={() => handleBulkUpdate('resolved')}>
                                {t('mark_resolved')}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setSelectedAlerts([])}>
                                {t('clear_selection')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Alerts List */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b">
                    <h3 className="font-semibold">{t('alerts')} ({alerts.length})</h3>
                </div>
                <div className="divide-y">
                    {alerts.map((alert) => (
                        <div
                            key={alert.id}
                            className={`p-4 hover:bg-gray-50 transition-colors ${selectedAlerts.includes(alert.id) ? 'bg-blue-50' : ''
                                }`}
                        >
                            <div className="flex items-start gap-4">
                                <input
                                    type="checkbox"
                                    checked={selectedAlerts.includes(alert.id)}
                                    onChange={() => toggleSelectAlert(alert.id)}
                                    className="mt-1"
                                />
                                <div className="flex-shrink-0 mt-1">
                                    {getSeverityIcon(alert.severity)}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-start justify-between">
                                        <div
                                            className="flex-1 cursor-pointer hover:text-blue-600 transition-colors"
                                            onClick={() => {
                                                setSelectedAlert(alert);
                                                setShowAlertModal(true);
                                            }}
                                            title={t('click_to_view')}
                                        >
                                            <h4 className="font-medium text-gray-900">{alert.message}</h4>
                                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    {getStatusIcon(alert.status)}
                                                    {alert.status.replace('_', ' ')}
                                                </span>
                                                <span className="capitalize">{alert.severity}</span>
                                                {alert.regulation && <span>• {alert.regulation}</span>}
                                                <span>• {new Date(alert.created_at).toLocaleDateString()}</span>
                                            </div>
                                            {alert.notes && (
                                                <p className="text-sm text-gray-600 mt-2 line-clamp-2">{alert.notes}</p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            {alert.status === 'open' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleUpdateStatus(alert.id, 'in_progress')}
                                                >
                                                    {t('start')}
                                                </Button>
                                            )}
                                            {alert.status === 'in_progress' && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleUpdateStatus(alert.id, 'resolved')}
                                                >
                                                    {t('resolve')}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {alerts.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p>{t('no_alerts_found')}</p>
                    </div>
                )}
            </div>

            {/* Alert Details Modal */}
            {showAlertModal && selectedAlert && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowAlertModal(false)}>
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                {getSeverityIcon(selectedAlert.severity)}
                                <div>
                                    <h3 className="text-xl font-bold">{selectedAlert.message}</h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {t('created_at')} {new Date(selectedAlert.created_at).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowAlertModal(false)}
                                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                            >
                                ×
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-600">{t('severity')}</label>
                                    <p className="mt-1 capitalize">
                                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${selectedAlert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                                            selectedAlert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                                                selectedAlert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-green-100 text-green-800'
                                            }`}>
                                            {selectedAlert.severity}
                                        </span>
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600">{t('status')}</label>
                                    <p className="mt-1 capitalize flex items-center gap-1">
                                        {getStatusIcon(selectedAlert.status)}
                                        <span className="font-medium">{selectedAlert.status.replace('_', ' ')}</span>
                                    </p>
                                </div>
                            </div>

                            {selectedAlert.regulation && (
                                <div>
                                    <label className="text-sm font-medium text-gray-600">{t('related_regulation')}</label>
                                    <p className="mt-1 font-mono text-sm bg-gray-100 px-3 py-2 rounded inline-block">
                                        {selectedAlert.regulation}
                                    </p>
                                </div>
                            )}

                            {selectedAlert.notes && (
                                <div>
                                    <label className="text-sm font-medium text-gray-600">{t('notes')}</label>
                                    <p className="mt-1 text-gray-700 bg-gray-50 p-3 rounded border">{selectedAlert.notes}</p>
                                </div>
                            )}

                            {selectedAlert.resolved_at && (
                                <div>
                                    <label className="text-sm font-medium text-gray-600">{t('resolved_at')}</label>
                                    <p className="mt-1 text-gray-700 flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                        {new Date(selectedAlert.resolved_at).toLocaleString()}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex gap-2 justify-end border-t pt-4">
                            {selectedAlert.status === 'open' && (
                                <Button onClick={() => {
                                    handleUpdateStatus(selectedAlert.id, 'in_progress');
                                    setShowAlertModal(false);
                                }}>
                                    {t('start_working')}
                                </Button>
                            )}
                            {selectedAlert.status === 'in_progress' && (
                                <Button onClick={() => {
                                    handleUpdateStatus(selectedAlert.id, 'resolved');
                                    setShowAlertModal(false);
                                }}>
                                    {t('mark_resolved')}
                                </Button>
                            )}
                            <Button variant="outline" onClick={() => setShowAlertModal(false)}>
                                {t('close')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
