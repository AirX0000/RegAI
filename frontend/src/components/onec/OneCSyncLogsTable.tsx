import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Button } from '@/components/ui/button';
import { 
    RefreshCw, 
    CheckCircle2, 
    XCircle, 
    Clock, 
    Activity, 
    FileText, 
    Loader2,
    ArrowUpRight,
    ArrowDownLeft
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface OneCSyncLog {
    id: string;
    company_id: string;
    user_id?: string;
    sync_type: string;
    status: string;
    records_processed: number;
    duration_ms: number;
    period_start?: string;
    period_end?: string;
    error_details?: string;
    created_at: string;
}

export const OneCSyncLogsTable: React.FC = () => {
    const [logs, setLogs] = useState<OneCSyncLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedLog, setSelectedLog] = useState<OneCSyncLog | null>(null);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await api.get('/integrations/1c/logs?limit=50');
            setLogs(res.data);
        } catch (err: any) {
            console.error('Failed to fetch 1C sync logs', err);
        } finally {
            setLoading(false);
        }
    };

    const formatSyncType = (type: string) => {
        switch (type) {
            case 'sync_trial_balance':
                return (
                    <span className="flex items-center gap-1.5 text-blue-700 font-medium">
                        <ArrowDownLeft className="h-3.5 w-3.5 text-blue-600" />
                        Trial Balance Import
                    </span>
                );
            case 'export_adjustments':
                return (
                    <span className="flex items-center gap-1.5 text-purple-700 font-medium">
                        <ArrowUpRight className="h-3.5 w-3.5 text-purple-600" />
                        Adjustment Pushback
                    </span>
                );
            case 'test_connection':
                return (
                    <span className="flex items-center gap-1.5 text-gray-700 font-medium">
                        <Activity className="h-3.5 w-3.5 text-amber-600" />
                        Ping Healthcheck
                    </span>
                );
            default:
                return <span>{type}</span>;
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-amber-600" />
                        1C Integration Audit Trail & Sync History
                    </h3>
                    <p className="text-xs text-gray-500">
                        Complete log of all extraction queries, pushback documents, latency measurements and error traces.
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchLogs}
                    disabled={loading}
                    className="h-8 text-xs gap-1.5"
                >
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                    Refresh Logs
                </Button>
            </div>

            {loading && logs.length === 0 ? (
                <div className="py-8 flex justify-center items-center">
                    <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
                </div>
            ) : logs.length === 0 ? (
                <div className="p-6 border border-dashed rounded-lg text-center text-xs text-gray-500">
                    No 1C synchronization operations recorded yet. Configure connection and trigger sync to view audit trail.
                </div>
            ) : (
                <div className="border rounded-lg overflow-hidden shadow-sm bg-white">
                    <table className="min-w-full divide-y divide-gray-200 text-xs">
                        <thead className="bg-gray-50 font-semibold text-gray-700">
                            <tr>
                                <th className="px-3 py-2.5 text-left">Timestamp</th>
                                <th className="px-3 py-2.5 text-left">Operation</th>
                                <th className="px-3 py-2.5 text-center">Status</th>
                                <th className="px-3 py-2.5 text-right">Records</th>
                                <th className="px-3 py-2.5 text-right">Duration</th>
                                <th className="px-3 py-2.5 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-mono">
                            {logs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50/70 font-sans">
                                    <td className="px-3 py-2 text-gray-600 text-[11px]">
                                        {new Date(log.created_at).toLocaleString()}
                                    </td>
                                    <td className="px-3 py-2">
                                        {formatSyncType(log.sync_type)}
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                            log.status === 'SUCCESS'
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : log.status === 'PARTIAL'
                                                ? 'bg-amber-100 text-amber-800'
                                                : 'bg-rose-100 text-rose-800'
                                        }`}>
                                            {log.status === 'SUCCESS' ? (
                                                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                            ) : (
                                                <XCircle className="h-3 w-3 text-rose-600" />
                                            )}
                                            {log.status}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2 text-right font-mono text-gray-900 font-semibold">
                                        {log.records_processed}
                                    </td>
                                    <td className="px-3 py-2 text-right font-mono text-gray-600">
                                        {log.duration_ms} ms
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSelectedLog(log)}
                                            className="h-6 px-2 text-[10px] text-blue-600 hover:text-blue-800"
                                        >
                                            View Details
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Log Detail Modal */}
            {selectedLog && (
                <Dialog open={Boolean(selectedLog)} onOpenChange={() => setSelectedLog(null)}>
                    <DialogContent className="max-w-xl bg-white">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold flex items-center gap-2">
                                <FileText className="h-5 w-5 text-amber-600" />
                                1C Sync Audit Details ({selectedLog.sync_type})
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Log ID: <span className="font-mono">{selectedLog.id}</span>
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-3 text-xs pt-2">
                            <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded border">
                                <div>
                                    <span className="text-gray-500 block">Timestamp:</span>
                                    <span className="font-semibold">{new Date(selectedLog.created_at).toLocaleString()}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block">Status:</span>
                                    <span className="font-semibold">{selectedLog.status}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block">Records Processed:</span>
                                    <span className="font-semibold">{selectedLog.records_processed}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block">Execution Time:</span>
                                    <span className="font-semibold">{selectedLog.duration_ms} ms</span>
                                </div>
                            </div>

                            {selectedLog.error_details && (
                                <div className="space-y-1">
                                    <span className="font-semibold text-rose-700">Error Details:</span>
                                    <pre className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-900 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap">
                                        {selectedLog.error_details}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};
