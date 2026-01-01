import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '../context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { FileUp, Download, Eye, FileSpreadsheet, FileCheck, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import TemplatesSection from '../components/TemplatesSection';
import CommentsSection from '../components/CommentsSection';
import PreSubmissionChecklist from '../components/PreSubmissionChecklist';
import { useTranslation } from 'react-i18next';

export default function ReportsPage() {
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const [reports, setReports] = useState<any[]>([]);
    const [allReports, setAllReports] = useState<any[]>([]);
    const [companies, setCompanies] = useState<any[]>([]);
    const [selectedCompany, setSelectedCompany] = useState<string>('');
    const [selectedReports, setSelectedReports] = useState<string[]>([]);
    const [isSubmitOpen, setIsSubmitOpen] = useState(false);
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [isChecklistOpen, setIsChecklistOpen] = useState(false);
    const [checklistReportId, setChecklistReportId] = useState<string>('');
    const [selectedReport, setSelectedReport] = useState<any>(null);
    const [validationResult, setValidationResult] = useState<any>(null);
    const [isValidationOpen, setIsValidationOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const { user } = useAuth();
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        report_type: 'compliance',
        company_id: (user as any)?.company_id || ''
    });

    const [reviewData, setReviewData] = useState({
        status: 'approved',
        reviewer_comments: ''
    });

    useEffect(() => {
        fetchReports();
        if (user?.role === 'superadmin') {
            fetchCompanies();
        }

        // Auto-open submit modal if navigated from /reports/new
        if (location.pathname === '/reports/new') {
            setIsSubmitOpen(true);
            // Navigate back to /reports to clean up URL
            navigate('/reports', { replace: true });
        }
    }, []);

    const fetchReports = async () => {
        try {
            const res = await api.get('/reports/');
            setAllReports(res.data);
            setReports(res.data);
        } catch (error) {
            console.error('Failed to fetch reports', error);
        }
    };

    const fetchCompanies = async () => {
        try {
            const res = await api.get('/companies/');
            setCompanies(res.data);
        } catch (error) {
            console.error('Failed to fetch companies', error);
        }
    };

    const handleCompanyFilter = (companyId: string) => {
        setSelectedCompany(companyId);
        if (companyId === '') {
            setReports(allReports);
        } else {
            setReports(allReports.filter((r: any) => r.company_id === companyId));
        }
    };

    const handleSubmit = async () => {
        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('description', formData.description);
            data.append('report_type', formData.report_type);
            data.append('company_id', formData.company_id);
            if (file) {
                data.append('file', file);
            }

            await api.post('/reports/', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast({
                title: "Success",
                description: "Report created successfully",
            });

            setIsSubmitOpen(false);
            setFormData({ title: '', description: '', report_type: 'compliance', company_id: (user as any)?.company_id || '' });
            setFile(null);
            fetchReports();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.response?.data?.detail || "Failed to create report",
            });
        }
    };

    const handleReview = async () => {
        try {
            await api.post(`/reports/${selectedReport.id}/review`, reviewData);
            toast({
                title: "Success",
                description: "Review submitted successfully",
            });
            setIsReviewOpen(false);
            setReviewData({ status: 'approved', reviewer_comments: '' });
            fetchReports();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.response?.data?.detail || "Failed to submit review",
            });
        }
    };

    const handleSubmitReport = async (reportId: string) => {
        setChecklistReportId(reportId);
        setIsChecklistOpen(true);
    };

    const handleChecklistSubmit = async () => {
        try {
            await api.post(`/reports/${checklistReportId}/submit`);
            toast({
                title: "Success",
                description: "Report submitted for review",
            });
            setIsChecklistOpen(false);
            fetchReports();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.response?.data?.detail || "Failed to submit report",
            });
        }
    };

    const handleExportExcel = async () => {
        try {
            const response = await api.get('/reports/export/excel', {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'reports_export.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast({
                title: "Success",
                description: "Reports exported to Excel",
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to export reports",
            });
        }
    };

    const handleDownload = async (reportId: string) => {
        try {
            const response = await api.get(`/reports/${reportId}/download`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'report');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to download report",
            });
        }
    };

    const handleValidate = async (reportId: string) => {
        try {
            toast({ title: "Processing", description: "Validating report... This may take a moment." });
            await api.post(`/reports/${reportId}/validate`);

            // Fetch results
            const res = await api.get(`/report-analysis/report/${reportId}`);
            if (res.data && res.data.length > 0) {
                setValidationResult(res.data[0]); // Get latest
                setIsValidationOpen(true);
            } else {
                toast({ title: "Info", description: "Validation completed but no results found." });
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.response?.data?.detail || "Failed to validate report",
            });
        }
    };

    const getStatusBadge = (status: string) => {
        const colors = {
            draft: 'bg-gray-200 text-gray-800',
            submitted: 'bg-blue-200 text-blue-800',
            under_review: 'bg-yellow-200 text-yellow-800',
            approved: 'bg-green-200 text-green-800',
            rejected: 'bg-red-200 text-red-800'
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[status as keyof typeof colors] || 'bg-gray-200'}`}>
                {status.replace('_', ' ').toUpperCase()}
            </span>
        );
    };

    const handleBatchDownload = async () => {
        if (selectedReports.length === 0) return;

        try {
            const res = await api.post('/reports/batch/download', selectedReports);
            toast({
                title: "Success",
                description: `Prepared ${res.data.count} report(s) for download`,
            });

            // Download each
            for (const report of res.data.reports) {
                window.open(`http://localhost:8000${report.download_url}`, '_blank');
                await new Promise(resolve => setTimeout(resolve, 300));
            }
            setSelectedReports([]);
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to download reports",
            });
        }
    };

    const toggleSelectReport = (reportId: string) => {
        setSelectedReports(prev =>
            prev.includes(reportId) ? prev.filter(id => id !== reportId) : [...prev, reportId]
        );
    };

    const toggleSelectAll = () => {
        setSelectedReports(reports.length === selectedReports.length ? [] : reports.map(r => r.id));
    };

    const canReview = user?.role === 'admin' || user?.role === 'superadmin';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h1 className="text-3xl font-bold">Reports</h1>
                    {user?.role === 'superadmin' && companies.length > 0 && (
                        <select
                            className="rounded-md border p-2 text-sm"
                            value={selectedCompany}
                            onChange={(e) => handleCompanyFilter(e.target.value)}
                        >
                            <option value="">All Companies ({allReports.length})</option>
                            {companies.map((company: any) => (
                                <option key={company.id} value={company.id}>
                                    {company.name} ({allReports.filter((r: any) => r.company_id === company.id).length})
                                </option>
                            ))}
                        </select>
                    )}
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleExportExcel} variant="outline" size="sm">
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        {t('export_excel')}
                    </Button>
                    {(user?.role === 'accountant' || user?.role === 'auditor' || user?.role === 'admin') && (
                        <Button onClick={() => setIsSubmitOpen(true)}>
                            <FileUp className="mr-2 h-4 w-4" />
                            {t('submit_report')}
                        </Button>
                    )}
                </div>
            </div>

            {/* Batch Actions */}
            {selectedReports.length > 0 && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg animate-fade-in-down">
                    <span className="text-sm font-medium">{selectedReports.length} {t('selected')}</span>
                    <Button onClick={handleBatchDownload} size="sm" variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        {t('download_all')}
                    </Button>
                    <Button onClick={() => setSelectedReports([])} size="sm" variant="ghost">
                        {t('clear')}
                    </Button>
                </div>
            )}

            {/* Templates Section */}
            <TemplatesSection />

            {/* Reports Table */}
            <div className="rounded-lg border bg-white shadow-sm">
                <table className="w-full">
                    <thead className="border-b bg-gray-50">
                        <tr>
                            <th className="p-3 text-left">
                                <input
                                    type="checkbox"
                                    checked={reports.length > 0 && selectedReports.length === reports.length}
                                    onChange={toggleSelectAll}
                                />
                            </th>
                            <th className="p-4 text-left">{t('title')}</th>
                            <th className="p-4 text-left">{t('type')}</th>
                            <th className="p-4 text-left">{t('status')}</th>
                            <th className="p-4 text-left">{t('submitted')}</th>
                            <th className="p-4 text-left">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reports.map((report, index) => (
                            <tr
                                key={report.id}
                                className="border-t hover:bg-gray-50 stagger-item"
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                <td className="p-3">
                                    <input
                                        type="checkbox"
                                        checked={selectedReports.includes(report.id)}
                                        onChange={() => toggleSelectReport(report.id)}
                                    />
                                </td>
                                <td className="p-3">
                                    {report.title}</td>
                                <td className="p-4 capitalize">{report.report_type.replace('_', ' ')}</td>
                                <td className="p-4">{getStatusBadge(report.status)}</td>
                                <td className="p-4">
                                    {report.submitted_at ? new Date(report.submitted_at).toLocaleDateString() : '-'}
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        {/* Download Button - For Approved Reports */}
                                        {report.status === 'approved' && (
                                            <Button variant="ghost" size="icon" onClick={() => handleDownload(report.id)}>
                                                <Download className="h-4 w-4" />
                                            </Button>
                                        )}

                                        {/* Validate Button - For Drafts/Submitted */}
                                        {report.file_path && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleValidate(report.id)}
                                                title="Validate Report"
                                            >
                                                <FileCheck className="h-4 w-4 text-blue-600" />
                                            </Button>
                                        )}

                                        {/* View Details Button - For Everyone */}
                                        <Button variant="ghost" size="icon" onClick={() => {
                                            setSelectedReport(report);
                                            // Reset review data
                                            setReviewData({ status: 'approved', reviewer_comments: '' });
                                            setIsReviewOpen(true);
                                        }}>
                                            <Eye className="h-4 w-4" />
                                        </Button>

                                        {/* Edit/Delete/Submit - For Owner (Drafts) */}
                                        {report.status === 'draft' && report.submitted_by === user?.id && (
                                            <>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        // Populate form for editing
                                                        setFormData({
                                                            title: report.title,
                                                            description: report.description || '',
                                                            report_type: report.report_type,
                                                            company_id: report.company_id
                                                        });
                                                        toast({ title: "Edit", description: "Edit functionality coming in next update" });
                                                    }}
                                                >
                                                    <span className="sr-only">Edit</span>
                                                    ✏️
                                                </Button>

                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={async () => {
                                                        if (confirm('Are you sure you want to delete this report?')) {
                                                            try {
                                                                await api.delete(`/reports/${report.id}`);
                                                                toast({ title: "Success", description: "Report deleted" });
                                                                fetchReports();
                                                            } catch (e: any) {
                                                                toast({
                                                                    variant: "destructive",
                                                                    title: "Error",
                                                                    description: e.response?.data?.detail || "Failed to delete report"
                                                                });
                                                            }
                                                        }
                                                    }}
                                                >
                                                    <span className="sr-only">Delete</span>
                                                    🗑️
                                                </Button>

                                                <Button
                                                    size="sm"
                                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                                    onClick={() => handleSubmitReport(report.id)}
                                                >
                                                    Submit
                                                </Button>
                                            </>
                                        )}

                                        {/* Approve/Reject - For Admin/Auditor (Submitted/Under Review) */}
                                        {['submitted', 'under_review'].includes(report.status) && canReview && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-green-600 border-green-200 hover:bg-green-50"
                                                    onClick={async () => {
                                                        try {
                                                            await api.post(`/reports/${report.id}/review`, {
                                                                status: 'approved',
                                                                reviewer_comments: 'Approved via quick action'
                                                            });
                                                            toast({ title: "Success", description: "Report approved" });

                                                            // Update local state immediately
                                                            setReports(prev => prev.map(r =>
                                                                r.id === report.id ? { ...r, status: 'approved' } : r
                                                            ));
                                                            setAllReports(prev => prev.map(r =>
                                                                r.id === report.id ? { ...r, status: 'approved' } : r
                                                            ));
                                                        } catch (e) {
                                                            toast({ variant: "destructive", title: "Error", description: "Failed to approve report" });
                                                        }
                                                    }}
                                                >
                                                    Approve
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                                    onClick={async () => {
                                                        const reason = prompt("Please enter rejection reason:");
                                                        if (reason) {
                                                            try {
                                                                await api.post(`/reports/${report.id}/review`, {
                                                                    status: 'rejected',
                                                                    reviewer_comments: reason
                                                                });
                                                                toast({ title: "Success", description: "Report rejected" });

                                                                // Update local state immediately
                                                                setReports(prev => prev.map(r =>
                                                                    r.id === report.id ? { ...r, status: 'rejected' } : r
                                                                ));
                                                                setAllReports(prev => prev.map(r =>
                                                                    r.id === report.id ? { ...r, status: 'rejected' } : r
                                                                ));
                                                            } catch (e) {
                                                                toast({ variant: "destructive", title: "Error", description: "Failed to reject report" });
                                                            }
                                                        }
                                                    }}
                                                >
                                                    Reject
                                                </Button>
                                            </>
                                        )}

                                        {/* Delete Button - For Admins/Superadmins (Any Status except own drafts) */}
                                        {(user?.role === 'admin' || user?.role === 'superadmin') && !(report.status === 'draft' && report.submitted_by === user?.id) && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                onClick={async () => {
                                                    if (confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
                                                        try {
                                                            await api.delete(`/reports/${report.id}`);
                                                            toast({ title: "Success", description: "Report deleted" });
                                                            fetchReports();
                                                        } catch (e: any) {
                                                            toast({
                                                                variant: "destructive",
                                                                title: "Error",
                                                                description: e.response?.data?.detail || "Failed to delete report"
                                                            });
                                                        }
                                                    }
                                                }}
                                            >
                                                <span className="sr-only">Delete</span>
                                                🗑️
                                            </Button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Submit Report Modal */}
            {isSubmitOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md animate-scale-in">
                        <h2 className="text-xl font-bold mb-4">Submit Report</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Title</label>
                                <Input
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Report title"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Type</label>
                                <select
                                    className="w-full rounded-md border p-2"
                                    value={formData.report_type}
                                    onChange={(e) => setFormData({ ...formData, report_type: e.target.value })}
                                >
                                    <option value="compliance">Compliance Report</option>
                                    <option value="audit">Audit Report</option>
                                    <option value="financial">Financial Report</option>
                                    <option value="risk_assessment">Risk Assessment</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <textarea
                                    className="w-full rounded-md border p-2"
                                    rows={3}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Report description"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">File</label>
                                <input
                                    type="file"
                                    accept=".pdf,.docx,.xlsx,.csv,.txt"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    className="w-full"
                                />
                                <p className="text-xs text-gray-500 mt-1">Max 10MB. Allowed: PDF, DOCX, XLSX, CSV, TXT</p>
                            </div>
                        </div>
                        <div className="flex gap-2 mt-6">
                            <Button onClick={handleSubmit} className="flex-1">Submit</Button>
                            <Button onClick={() => setIsSubmitOpen(false)} variant="outline" className="flex-1">Cancel</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Review Modal */}
            {isReviewOpen && selectedReport && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md animate-scale-in">
                        <h2 className="text-xl font-bold mb-4">Review Report</h2>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-600">Title:</p>
                                <p className="font-semibold">{selectedReport.title}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Description:</p>
                                <p>{selectedReport.description || 'No description'}</p>
                            </div>

                            {/* Comments Section */}
                            <div className="border-t pt-4">
                                <CommentsSection reportId={selectedReport.id} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Decision</label>
                                <select
                                    className="w-full rounded-md border p-2"
                                    value={reviewData.status}
                                    onChange={(e) => setReviewData({ ...reviewData, status: e.target.value })}
                                >
                                    <option value="approved">Approve</option>
                                    <option value="rejected">Reject</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Comments</label>
                                <textarea
                                    className="w-full rounded-md border p-2"
                                    rows={3}
                                    value={reviewData.reviewer_comments}
                                    onChange={(e) => setReviewData({ ...reviewData, reviewer_comments: e.target.value })}
                                    placeholder="Review comments"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 mt-6">
                            <Button onClick={handleReview} className="flex-1">Submit Review</Button>
                            <Button onClick={() => setIsReviewOpen(false)} variant="outline" className="flex-1">Cancel</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Checklist Modal */}
            {isChecklistOpen && checklistReportId && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto animate-scale-in">
                        <PreSubmissionChecklist
                            reportId={checklistReportId}
                            onClose={() => setIsChecklistOpen(false)}
                            onSubmit={handleChecklistSubmit}
                        />
                    </div>
                </div>
            )}
            {/* Validation Result Modal */}
            {isValidationOpen && validationResult && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Validation Results</h2>
                            <Button variant="ghost" size="sm" onClick={() => setIsValidationOpen(false)}>Close</Button>
                        </div>

                        <div className="space-y-6">
                            {/* Score Header */}
                            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                                <div className={`text-3xl font-bold ${validationResult.overall_score >= 90 ? 'text-green-600' :
                                    validationResult.overall_score >= 70 ? 'text-yellow-600' : 'text-red-600'
                                    }`}>
                                    {validationResult.overall_score}%
                                </div>
                                <div>
                                    <h3 className="font-semibold">Overall Compliance Score</h3>
                                    <p className="text-sm text-gray-600">{validationResult.summary}</p>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-3 border rounded-lg text-center">
                                    <div className="text-2xl font-bold text-green-600">{validationResult.passed_checks}</div>
                                    <div className="text-xs text-gray-500">Passed Checks</div>
                                </div>
                                <div className="p-3 border rounded-lg text-center">
                                    <div className="text-2xl font-bold text-yellow-600">{validationResult.warnings}</div>
                                    <div className="text-xs text-gray-500">Warnings</div>
                                </div>
                                <div className="p-3 border rounded-lg text-center">
                                    <div className="text-2xl font-bold text-red-600">{validationResult.errors}</div>
                                    <div className="text-xs text-gray-500">Critical Errors</div>
                                </div>
                            </div>

                            {/* Detailed Errors */}
                            <div>
                                <h3 className="font-semibold mb-2">Detailed Findings</h3>
                                {validationResult.error_details && validationResult.error_details.length > 0 ? (
                                    <div className="space-y-2">
                                        {validationResult.error_details.map((error: any, idx: number) => (
                                            <div key={idx} className={`p-3 border rounded-lg flex gap-3 ${error.severity === 'critical' ? 'bg-red-50 border-red-100' : 'bg-yellow-50 border-yellow-100'
                                                }`}>
                                                {error.severity === 'critical' ? (
                                                    <XCircle className="h-5 w-5 text-red-600 shrink-0" />
                                                ) : (
                                                    <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0" />
                                                )}
                                                <div>
                                                    <p className="font-medium text-sm">{error.type.replace('_', ' ').toUpperCase()}</p>
                                                    <p className="text-sm mt-1">{error.recommendation || error.message}</p>
                                                    {error.location && (
                                                        <p className="text-xs text-gray-500 mt-1">Location: {error.location}</p>
                                                    )}
                                                    {error.expected !== undefined && error.found !== undefined && (
                                                        <p className="text-xs font-mono mt-1">
                                                            Expected: {error.expected} | Found: {error.found}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center border rounded-lg bg-green-50">
                                        <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                                        <p className="text-green-800 font-medium">No issues found!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
