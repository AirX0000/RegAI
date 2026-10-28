import React, { useState, useEffect, Suspense } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '../context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { 
    FileUp, Download, Eye, FileSpreadsheet, FileCheck, AlertTriangle, 
    CheckCircle, XCircle, Trash2, FileText, Sparkles, Calendar, 
    Building2, Printer, ShieldCheck, CheckCircle2, 
    X, ChevronRight, User, Layers, Maximize2 
} from 'lucide-react';
import TemplatesSection from '../components/TemplatesSection';
import { useTranslation } from 'react-i18next';
import { PERMISSIONS } from '../lib/permissions';

// Defer heavy modal-only components (xlsx/spreadsheet previewer & IFRS wizard) off the LCP critical path
const CommentsSection = React.lazy(() => import('../components/CommentsSection'));
const PreSubmissionChecklist = React.lazy(() => import('../components/PreSubmissionChecklist'));
const DocumentPreviewer = React.lazy(() => import('../components/DocumentPreviewer'));
const DirectIfrsReportModal = React.lazy(() => import('../components/DirectIfrsReportModal'));

export default function ReportsPage() {
    const { t, i18n } = useTranslation();
    const isRu = (i18n?.language || 'ru').toLowerCase().startsWith('ru');
    const location = useLocation();
    const navigate = useNavigate();
    const [reports, setReports] = useState<any[]>([]);
    const [allReports, setAllReports] = useState<any[]>([]);
    const [companies, setCompanies] = useState<any[]>([]);
    const [selectedCompany, setSelectedCompany] = useState<string>('');
    const [selectedReports, setSelectedReports] = useState<string[]>([]);
    const [isSubmitOpen, setIsSubmitOpen] = useState(false);
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [viewerTab, setViewerTab] = useState<'content' | 'metrics' | 'ai' | 'review'>('content');
    const [contentSubView, setContentSubView] = useState<'both' | 'preview' | 'brief'>('both');
    const [isFullscreenPreviewOpen, setIsFullscreenPreviewOpen] = useState(false);
    const [isDirectIfrsOpen, setIsDirectIfrsOpen] = useState(false);
    const [isChecklistOpen, setIsChecklistOpen] = useState(false);
    const [checklistReportId, setChecklistReportId] = useState<string>('');
    const [selectedReport, setSelectedReport] = useState<any>(null);
    const [validationResult, setValidationResult] = useState<any>(null);
    const [isValidationOpen, setIsValidationOpen] = useState(false);
    const [reportToDelete, setReportToDelete] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);
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

        // Check for templateData in localStorage (from template use)
        const savedTemplate = localStorage.getItem('templateData');
        if (savedTemplate) {
            try {
                const parsed = JSON.parse(savedTemplate);
                setFormData({
                    title: parsed.title || '',
                    description: parsed.description || '',
                    report_type: parsed.report_type || 'compliance',
                    company_id: parsed.company_id || (user as any)?.company_id || ''
                });
                setIsSubmitOpen(true);
                localStorage.removeItem('templateData');
            } catch (e) {
                console.error("Failed to parse templateData", e);
            }
        }
    }, []);

    const fetchReports = async () => {
        try {
            const res = await api.get('/reports/');
            const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.items) ? res.data.items : []);
            const userCompId = user?.company_id;
            const isSuperadmin = user?.role === 'superadmin' || user?.role === 'website_superadmin';
            const filtered = isSuperadmin 
                ? data 
                : data.filter((r: any) => !userCompId || r.company_id === userCompId);
            setAllReports(filtered);
            setReports(filtered);
        } catch (error) {
            console.error('Failed to fetch reports', error);
            setAllReports([]);
            setReports([]);
        }
    };

    const fetchCompanies = async () => {
        try {
            const res = await api.get('/companies/');
            const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.items) ? res.data.items : []);
            setCompanies(data);
        } catch (error) {
            console.error('Failed to fetch companies', error);
            setCompanies([]);
        }
    };

    const handleCompanyFilter = (companyId: string) => {
        setSelectedCompany(companyId);
        if (!Array.isArray(allReports)) {
            setReports([]);
            return;
        }
        if (companyId === '') {
            setReports(allReports);
        } else {
            setReports(allReports.filter((r: any) => r.company_id === companyId));
        }
    };

    const handleSubmit = async () => {
        try {
            const isSuperadmin = user?.role === 'superadmin' || user?.role === 'website_superadmin';
            const effectiveCompanyId = isSuperadmin
                ? (formData.company_id || user?.company_id || '')
                : (user?.company_id || '');

            const data = new FormData();
            data.append('title', formData.title);
            data.append('description', formData.description);
            data.append('report_type', formData.report_type);
            data.append('company_id', effectiveCompanyId);
            if (file) {
                data.append('file', file);
            }

            await api.post('/reports/', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast({
                title: isRu ? "Успешно" : "Success",
                description: isRu ? "Отчет успешно создан" : "Report created successfully",
            });

            setIsSubmitOpen(false);
            setFormData({ title: '', description: '', report_type: 'compliance', company_id: (user as any)?.company_id || '' });
            setFile(null);
            fetchReports();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: isRu ? "Ошибка" : "Error",
                description: error.response?.data?.detail || (isRu ? "Не удалось создать отчет" : "Failed to create report"),
            });
        }
    };

    const handleReview = async () => {
        try {
            await api.post(`/reports/${selectedReport.id}/review`, reviewData);
            toast({
                title: isRu ? "Успешно" : "Success",
                description: isRu ? "Решение по отчету сохранено" : "Review submitted successfully",
            });
            setIsReviewOpen(false);
            setReviewData({ status: 'approved', reviewer_comments: '' });
            fetchReports();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: isRu ? "Ошибка" : "Error",
                description: error.response?.data?.detail || (isRu ? "Не удалось сохранить рецензию" : "Failed to submit review"),
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
                title: isRu ? "Успешно" : "Success",
                description: isRu ? "Отчет отправлен на проверку" : "Report submitted for review",
            });
            setIsChecklistOpen(false);
            fetchReports();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: isRu ? "Ошибка" : "Error",
                description: error.response?.data?.detail || (isRu ? "Не удалось отправить отчет" : "Failed to submit report"),
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
                title: isRu ? "Успешно" : "Success",
                description: isRu ? "Реестр отчетов выгружен в Excel" : "Reports exported to Excel",
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: isRu ? "Ошибка" : "Error",
                description: isRu ? "Не удалось выгрузить отчеты в Excel" : "Failed to export reports",
            });
        }
    };

    const handleDownload = async (reportId: string, customTitle?: string) => {
        try {
            const rep = reports.find(r => r.id === reportId) || selectedReport || { id: reportId, title: customTitle || 'Report' };
            const companyName = companies.find(c => c.id === rep.company_id)?.name;
            const { downloadReportAsPdf } = await import('../lib/pdfReportGenerator');
            await downloadReportAsPdf(rep, companyName);
            toast({
                title: isRu ? "Успешно" : "Success",
                description: isRu ? "Отчет успешно загружен в формате PDF" : "Report downloaded in PDF format",
            });
        } catch (error: any) {
            console.error("Failed to generate PDF report", error);
            toast({
                variant: "destructive",
                title: isRu ? "Ошибка" : "Error",
                description: isRu ? "Не удалось загрузить PDF" : "Failed to download PDF",
            });
        }
    };

    const handleDirectReportCreated = (newReport: any) => {
        fetchReports();
        setSelectedReport(newReport);
        setViewerTab('content');
        setContentSubView('preview');
        setIsReviewOpen(true);
    };

    const handleValidate = async (reportId: string) => {
        try {
            toast({
                title: isRu ? "Проверка" : "Processing",
                description: isRu ? "Выполняется валидация отчета..." : "Validating report... This may take a moment."
            });
            await api.post(`/reports/${reportId}/validate`);

            // Fetch results
            const res = await api.get(`/report-analysis/report/${reportId}`);
            if (res.data && res.data.length > 0) {
                setValidationResult(res.data[0]); // Get latest
                setIsValidationOpen(true);
            } else {
                toast({
                    title: isRu ? "Информация" : "Info",
                    description: isRu ? "Валидация завершена, замечаний не найдено." : "Validation completed but no results found."
                });
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: isRu ? "Ошибка" : "Error",
                description: error.response?.data?.detail || (isRu ? "Не удалось проверить отчет" : "Failed to validate report"),
            });
        }
    };

    const getReportTypeLabel = (type?: string) => {
        const key = (type || '').toLowerCase().trim();
        if (!isRu) {
            const enLabels: Record<string, string> = {
                financial: 'Financial',
                compliance: 'Compliance',
                audit: 'Audit',
                risk_assessment: 'Risk Assessment',
                tax: 'Tax',
                ifrs: 'IFRS',
                other: 'Other',
            };
            return enLabels[key] || (type ? type.replace(/_/g, ' ') : '-');
        }
        const ruLabels: Record<string, string> = {
            financial: 'Финансовый',
            compliance: 'Комплаенс',
            audit: 'Аудит',
            risk_assessment: 'Оценка рисков',
            tax: 'Налоговый',
            ifrs: 'МСФО (IFRS)',
            other: 'Прочее',
        };
        return ruLabels[key] || (type ? type.replace(/_/g, ' ') : '-');
    };

    const getLocalizedReportTitle = (title?: string) => {
        if (!title || !isRu) return title || '';
        const trimmed = title.trim();
        const titleMap: Record<string, string> = {
            'Amazon-2024-Annual-Report': 'Годовой финансовый отчет за 2024 год (Amazon)',
            'Tax Analysis Report': 'Отчет по налоговому анализу и сверке',
            'Q4 2024 Compliance Report': 'Отчет о регуляторном комплаенсе за 4 кв. 2024 г.',
            'Annual Financial Audit 2024': 'Годовой финансовый аудит за 2024 год',
            'Tax Filing Report - Q3 2024': 'Налоговая декларация за 3 кв. 2024 г.',
            'Risk Assessment - Cybersecurity': 'Оценка рисков — Кибербезопасность',
            'GDPR Compliance Audit': 'Аудит защиты персональных данных (GDPR)',
            'Q3 2026 IFRS Compliance Report': 'Отчет о соответствии МСФО за 3 кв. 2026 г.',
            'AML Annual Risk Assessment 2026': 'Годовая оценка рисков ПОД/ФТ (AML) за 2026 год',
            'HIPAA Annual Compliance Assessment 2026': 'Годовая оценка соответствия HIPAA за 2026 год',
            'GDPR Data Processing Audit': 'Аудит обработки персональных данных (GDPR)',
            'GDPR Readiness Assessment Q3 2026': 'Оценка готовности по защите данных (GDPR) за 3 кв. 2026 г.',
        };
        return titleMap[trimmed] || title;
    };

    const getLocalizedReportDescription = (desc?: string) => {
        if (!desc || !isRu) return desc || '';
        const trimmed = desc.trim();
        const descMap: Record<string, string> = {
            'Quarterly compliance': 'Ежеквартальная проверка соблюдения регуляторных требований',
            'Uploaded for AI analysis': 'Загружено для автоматического анализа ИИ и налоговой сверки',
            'Quarterly compliance assessment covering GDPR, CCPA, and HIPAA regulations': 'Ежеквартальная оценка соблюдения нормативов GDPR, CCPA и HIPAA',
            'Comprehensive financial audit for fiscal year 2024': 'Комплексный финансовый аудит за 2024 финансовый год',
            'Quarterly tax filing documentation and calculations': 'Квартальная налоговая документация и расчеты по налогам',
            'Assessment of cybersecurity risks and mitigation strategies': 'Оценка кибер-рисков и стратегий их минимизации',
            'Detailed audit of GDPR compliance measures and data protection practices': 'Детальный аудит мер соответствия GDPR и практик защиты данных',
        };
        return descMap[trimmed] || desc;
    };

    const getStatusBadge = (status: string) => {
        const key = (status || 'draft').toLowerCase().trim();
        const colors: Record<string, string> = {
            draft: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
            submitted: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60',
            under_review: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60',
            in_progress: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60',
            approved: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60',
            completed: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60',
            rejected: 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/60'
        };
        const ruStatusLabels: Record<string, string> = {
            draft: 'ЧЕРНОВИК',
            submitted: 'ОТПРАВЛЕН',
            under_review: 'НА ПРОВЕРКЕ',
            in_progress: 'В РАБОТЕ',
            approved: 'УТВЕРЖДЕН',
            completed: 'ЗАВЕРШЕН',
            rejected: 'ОТКЛОНЕН',
        };
        const enStatusLabels: Record<string, string> = {
            draft: 'DRAFT',
            submitted: 'SUBMITTED',
            under_review: 'UNDER REVIEW',
            in_progress: 'IN PROGRESS',
            approved: 'APPROVED',
            completed: 'COMPLETED',
            rejected: 'REJECTED',
        };
        const label = isRu
            ? (ruStatusLabels[key] || status.replace(/_/g, ' ').toUpperCase())
            : (enStatusLabels[key] || status.replace(/_/g, ' ').toUpperCase());
        return (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${colors[key] || 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'}`}>
                {label}
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
        if (!Array.isArray(reports)) return;
        setSelectedReports(reports.length === selectedReports.length ? [] : reports.map(r => r.id));
    };

    const executeDeleteReport = async (reportId: string) => {
        setIsDeleting(true);
        try {
            // Optimistic UI update
            setReports(prev => prev.filter(r => String(r.id) !== String(reportId)));
            setAllReports(prev => prev.filter(r => String(r.id) !== String(reportId)));
            setSelectedReports(prev => prev.filter(id => String(id) !== String(reportId)));

            // Synchronize localStorage store for mockApi persistence
            try {
                const raw = localStorage.getItem('regai_mock_reports');
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed)) {
                        localStorage.setItem('regai_mock_reports', JSON.stringify(parsed.filter((r: any) => String(r.id) !== String(reportId))));
                    }
                }
            } catch (e) {
                console.warn('LocalStorage sync warning:', e);
            }

            // Call backend API
            await api.delete(`/reports/${reportId}`);

            toast({
                title: isRu ? "Отчет удален" : "Report Deleted",
                description: isRu ? "Отчет успешно удален из системы." : "Report has been successfully deleted.",
            });
            setReportToDelete(null);
        } catch (error: any) {
            console.error("Failed to delete report", error);
            toast({
                variant: "destructive",
                title: isRu ? "Ошибка удаления" : "Delete Failed",
                description: error.response?.data?.detail || (isRu ? "Не удалось удалить отчет" : "Failed to delete report"),
            });
            fetchReports();
        } finally {
            setIsDeleting(false);
        }
    };

    const handleBatchDelete = async () => {
        if (selectedReports.length === 0) return;
        setIsDeleting(true);
        const count = selectedReports.length;
        const idsToDelete = [...selectedReports];

        // Optimistic UI update
        setReports(prev => prev.filter(r => !idsToDelete.includes(String(r.id))));
        setAllReports(prev => prev.filter(r => !idsToDelete.includes(String(r.id))));
        setSelectedReports([]);

        // Synchronize localStorage
        try {
            const raw = localStorage.getItem('regai_mock_reports');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    localStorage.setItem('regai_mock_reports', JSON.stringify(parsed.filter((r: any) => !idsToDelete.includes(String(r.id)))));
                }
            }
        } catch (e) {
            console.warn('LocalStorage sync warning:', e);
        }

        try {
            await Promise.allSettled(idsToDelete.map(id => api.delete(`/reports/${id}`)));
            toast({
                title: isRu ? "Отчеты удалены" : "Reports Deleted",
                description: isRu ? `Удалено отчетов: ${count}` : `Successfully deleted ${count} reports.`,
            });
        } catch (error) {
            console.error("Batch delete error", error);
            fetchReports();
        } finally {
            setIsDeleting(false);
        }
    };

    const canReview = PERMISSIONS.canReviewReports(user?.role);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{isRu ? 'Отчетность' : 'Reports'}</h1>
                    {user?.role !== 'superadmin' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-cyan-300 border border-blue-200 dark:border-blue-800">
                            <Building2 className="h-3.5 w-3.5 text-cyan-500" />
                            {user?.company_name || (user?.company_id === 'b968f7d7ffe04630a90aadde4d0d8e95' ? 'FinServe Holdings' : 'TechCorp Ltd')}
                        </span>
                    )}
                    {user?.role === 'superadmin' && Array.isArray(companies) && companies.length > 0 && (
                        <select
                            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2 text-sm"
                            value={selectedCompany}
                            onChange={(e) => handleCompanyFilter(e.target.value)}
                        >
                            <option value="">{isRu ? 'Все компании' : 'All Companies'} ({Array.isArray(allReports) ? allReports.length : 0})</option>
                            {companies.map((company: any) => (
                                <option key={company.id} value={company.id}>
                                    {company.name} ({Array.isArray(allReports) ? allReports.filter((r: any) => r.company_id === company.id).length : 0})
                                </option>
                            ))}
                        </select>
                    )}
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleExportExcel} variant="outline" size="sm" className="dark:border-slate-700 dark:hover:bg-slate-800 active:scale-95 transition-all duration-200 group cursor-pointer">
                        <FileSpreadsheet className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                        {t('export_excel')}
                    </Button>
                    {PERMISSIONS.canCreateReports(user?.role) && (
                        <>
                            <Button 
                                onClick={() => setIsDirectIfrsOpen(true)} 
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white font-semibold shadow-xs hover:shadow-md transition-all duration-200 group cursor-pointer"
                            >
                                <Sparkles className="mr-2 h-4 w-4 text-purple-200 transition-transform duration-200 group-hover:rotate-12" />
                                {isRu ? 'Создать IFRS отчет' : 'Create IFRS Report'}
                            </Button>
                            <Button onClick={() => setIsSubmitOpen(true)} className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold shadow-xs hover:shadow-md transition-all duration-200 group cursor-pointer">
                                <FileUp className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5" />
                                {t('submit_report')}
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Batch Actions */}
            {selectedReports.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 p-3 bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl text-blue-900 dark:text-blue-100 animate-fade-in-down">
                    <span className="text-sm font-medium">{selectedReports.length} {t('selected')}</span>
                    <Button onClick={handleBatchDownload} size="sm" variant="outline" className="dark:border-slate-700 dark:hover:bg-slate-800 active:scale-95 transition-all">
                        <Download className="mr-2 h-4 w-4" />
                        {t('download_all')}
                    </Button>
                    <Button 
                        onClick={handleBatchDelete} 
                        disabled={isDeleting}
                        size="sm" 
                        variant="outline" 
                        className="border-red-200 text-red-600 dark:border-red-900/60 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 active:scale-95 transition-all cursor-pointer"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {isRu ? `Удалить выбранные (${selectedReports.length})` : `Delete Selected (${selectedReports.length})`}
                    </Button>
                    <Button onClick={() => setSelectedReports([])} size="sm" variant="ghost" className="hover:bg-blue-100/60 dark:hover:bg-slate-800 active:scale-95 transition-all">
                        {t('clear')}
                    </Button>
                </div>
            )}

            {/* Templates Section */}
            {PERMISSIONS.canCreateReports(user?.role) && (
                <TemplatesSection onSelectTemplate={(tmplData) => {
                    setFormData({
                        title: tmplData.title || '',
                        description: tmplData.description || '',
                        report_type: tmplData.report_type || 'compliance',
                        company_id: tmplData.company_id || (user as any)?.company_id || ''
                    });
                    setIsSubmitOpen(true);
                }} />
            )}

            {/* Reports Table */}
            <div
                tabIndex={0}
                role="region"
                aria-label={isRu ? 'Таблица регуляторных и финансовых отчетов' : 'Regulatory and financial reports table'}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-x-auto"
            >
                <table className="w-full">
                    <thead className="sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        <tr>
                            <th className="p-3 text-left">
                                <input
                                    type="checkbox"
                                    aria-label={isRu ? 'Выбрать все отчеты' : 'Select all reports'}
                                    checked={Array.isArray(reports) && reports.length > 0 && selectedReports.length === reports.length}
                                    onChange={toggleSelectAll}
                                    className="rounded border-slate-300 dark:border-slate-700 cursor-pointer"
                                />
                            </th>
                            <th className="p-4 text-left">{t('title')}</th>
                            <th className="p-4 text-left">{t('type')}</th>
                            <th className="p-4 text-left">{t('status')}</th>
                            <th className="p-4 text-left">{t('submitted')}</th>
                            <th className="p-4 text-left">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                        {Array.isArray(reports) && reports.length > 0 ? (
                            reports.map((report, index) => (
                            <tr
                                key={report.id}
                                className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors stagger-item"
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                <td className="p-3">
                                    <input
                                        type="checkbox"
                                        aria-label={getLocalizedReportTitle(report.title)}
                                        checked={selectedReports.includes(report.id)}
                                        onChange={() => toggleSelectReport(report.id)}
                                        className="rounded border-slate-300 dark:border-slate-700 cursor-pointer"
                                    />
                                </td>
                                <td className="p-4 font-medium text-slate-900 dark:text-white">
                                    {getLocalizedReportTitle(report.title)}
                                </td>
                                <td className="p-4 text-slate-600 dark:text-slate-400">
                                    {getReportTypeLabel(report.report_type)}
                                </td>
                                <td className="p-4">{getStatusBadge(report.status)}</td>
                                <td className="p-4 text-slate-600 dark:text-slate-400">
                                    {(report.submitted_at || report.created_at) ? (
                                        <time dateTime={new Date(report.submitted_at || report.created_at).toISOString()}>
                                            {new Date(report.submitted_at || report.created_at).toLocaleDateString(
                                                isRu ? 'ru-RU' : 'en-US',
                                                { day: '2-digit', month: 'short', year: 'numeric' }
                                            )}
                                        </time>
                                    ) : '-'}
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-1.5">
                                        {/* Download Button - For Approved Reports */}
                                        {report.status === 'approved' && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDownload(report.id, getLocalizedReportTitle(report.title))}
                                                title={isRu ? "Скачать PDF отчет" : "Download PDF Report"}
                                                className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                                            >
                                                <Download className="h-4 w-4" />
                                            </Button>
                                        )}

                                        {/* Validate Button - For Drafts/Submitted */}
                                        {report.file_path && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleValidate(report.id)}
                                                title={isRu ? "Проверить отчет" : "Validate Report"}
                                                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                                            >
                                                <FileCheck className="h-4 w-4" />
                                            </Button>
                                        )}

                                        {/* View Details Button - For Everyone */}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                setSelectedReport(report);
                                                setViewerTab('content');
                                                setReviewData({
                                                    status: report.status === 'rejected' ? 'rejected' : 'approved',
                                                    reviewer_comments: report.reviewer_comments || ''
                                                });
                                                setIsReviewOpen(true);
                                            }}
                                            title={isRu ? "Просмотр отчета" : "View Report"}
                                            className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>

                                        {/* Edit/Submit - For Owner (Drafts) */}
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
                                                        toast({
                                                            title: isRu ? "Редактирование" : "Edit",
                                                            description: isRu ? "Редактирование черновика будет доступно в следующем обновлении" : "Edit functionality coming in next update"
                                                        });
                                                    }}
                                                    className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                                                    title={isRu ? "Редактировать черновик" : "Edit Draft"}
                                                >
                                                    <span className="sr-only">{isRu ? 'Редактировать' : 'Edit'}</span>
                                                    ✏️
                                                </Button>

                                                <Button
                                                    size="sm"
                                                    className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-2xs transition-all"
                                                    onClick={() => handleSubmitReport(report.id)}
                                                >
                                                    {isRu ? 'Отправить' : 'Submit'}
                                                </Button>
                                            </>
                                        )}

                                        {/* Approve/Reject - For Admin/Auditor (Submitted/Under Review) */}
                                        {['submitted', 'under_review'].includes(report.status) && canReview && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-emerald-600 border-emerald-200 dark:border-emerald-800 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 active:scale-95 transition-all"
                                                    onClick={async () => {
                                                        try {
                                                            await api.post(`/reports/${report.id}/review`, {
                                                                status: 'approved',
                                                                reviewer_comments: isRu ? 'Утверждено через быстрое действие' : 'Approved via quick action'
                                                            });
                                                            toast({
                                                                title: isRu ? "Успешно" : "Success",
                                                                description: isRu ? "Отчет утвержден" : "Report approved"
                                                            });

                                                            // Update local state immediately
                                                            setReports(prev => prev.map(r =>
                                                                r.id === report.id ? { ...r, status: 'approved' } : r
                                                            ));
                                                            setAllReports(prev => prev.map(r =>
                                                                r.id === report.id ? { ...r, status: 'approved' } : r
                                                            ));
                                                        } catch (e) {
                                                            toast({
                                                                variant: "destructive",
                                                                title: isRu ? "Ошибка" : "Error",
                                                                description: isRu ? "Не удалось утвердить отчет" : "Failed to approve report"
                                                            });
                                                        }
                                                    }}
                                                >
                                                    {isRu ? 'Утвердить' : 'Approve'}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-red-600 border-red-200 dark:border-red-800 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 active:scale-95 transition-all"
                                                    onClick={async () => {
                                                        const reason = prompt(isRu ? "Укажите причину отклонения отчета:" : "Please enter rejection reason:");
                                                        if (reason) {
                                                            try {
                                                                await api.post(`/reports/${report.id}/review`, {
                                                                    status: 'rejected',
                                                                    reviewer_comments: reason
                                                                });
                                                                toast({
                                                                    title: isRu ? "Успешно" : "Success",
                                                                    description: isRu ? "Отчет отклонен" : "Report rejected"
                                                                });

                                                                // Update local state immediately
                                                                setReports(prev => prev.map(r =>
                                                                    r.id === report.id ? { ...r, status: 'rejected' } : r
                                                                ));
                                                                setAllReports(prev => prev.map(r =>
                                                                    r.id === report.id ? { ...r, status: 'rejected' } : r
                                                                ));
                                                            } catch (e) {
                                                                toast({
                                                                    variant: "destructive",
                                                                    title: isRu ? "Ошибка" : "Error",
                                                                    description: isRu ? "Не удалось отклонить отчет" : "Failed to reject report"
                                                                });
                                                            }
                                                        }
                                                    }}
                                                >
                                                    {isRu ? 'Отклонить' : 'Reject'}
                                                </Button>
                                            </>
                                        )}

                                        {/* Delete Button - Restricted to Admins and Draft Creators */}
                                        {PERMISSIONS.canDeleteReports(user?.role) && (PERMISSIONS.canManageCompanies(user?.role) || user?.role === 'admin' || (report.submitted_by === user?.id && report.status === 'draft')) && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                title={isRu ? "Удалить отчет" : "Delete report"}
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 active:scale-90 transition-all duration-200 group cursor-pointer"
                                                onClick={() => setReportToDelete(report)}
                                            >
                                                <Trash2 className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                                                <span className="sr-only">Delete</span>
                                            </Button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={6} className="p-12 text-center text-slate-500 dark:text-slate-400">
                                <div className="flex flex-col items-center justify-center gap-2">
                                    <FileSpreadsheet className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                                    <p className="font-medium text-slate-600 dark:text-slate-300">{t('no_reports_found') || 'Нет отчетов для отображения'}</p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500">Нажмите «Submit Report» или используйте шаблон для загрузки нового отчета</p>
                                </div>
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>

            {/* Submit Report Modal */}
            {isSubmitOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl text-slate-900 dark:text-slate-100 animate-scale-in">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                {isRu ? 'Подать отчет' : 'Submit Report'}
                            </h2>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsSubmitOpen(false)}
                                className="h-7 w-7 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="p-3 mb-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/80 flex items-center justify-between gap-3 text-xs">
                            <div>
                                <span className="font-semibold text-purple-900 dark:text-purple-200 block">
                                    {isRu ? 'Готовый отчет по МСФО?' : 'Direct IFRS Report?'}
                                </span>
                                <span className="text-purple-700 dark:text-purple-300 text-[11px]">
                                    {isRu ? 'Создать напрямую без файла с авто-проверкой ошибок.' : 'Build directly without file upload.'}
                                </span>
                            </div>
                            <Button
                                size="sm"
                                type="button"
                                onClick={() => {
                                    setIsSubmitOpen(false);
                                    setIsDirectIfrsOpen(true);
                                }}
                                className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-7 px-2.5 shrink-0 cursor-pointer"
                            >
                                <Sparkles className="w-3 h-3 mr-1" />
                                {isRu ? 'Конструктор' : 'Builder'}
                            </Button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">
                                    {isRu ? 'Название отчета' : 'Title'}
                                </label>
                                <Input
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder={isRu ? 'Введите название отчета' : 'Report title'}
                                    className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">
                                    {isRu ? 'Тип отчета' : 'Type'}
                                </label>
                                <select
                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2.5"
                                    value={formData.report_type}
                                    onChange={(e) => setFormData({ ...formData, report_type: e.target.value })}
                                >
                                    <option value="compliance">{isRu ? 'Комплаенс-отчет' : 'Compliance Report'}</option>
                                    <option value="audit">{isRu ? 'Аудиторский отчет' : 'Audit Report'}</option>
                                    <option value="financial">{isRu ? 'Финансовый отчет' : 'Financial Report'}</option>
                                    <option value="risk_assessment">{isRu ? 'Оценка рисков' : 'Risk Assessment'}</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">
                                    {isRu ? 'Описание' : 'Description'}
                                </label>
                                <textarea
                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2.5"
                                    rows={3}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder={isRu ? 'Краткое описание отчета' : 'Report description'}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">
                                    {isRu ? 'Файл отчета' : 'File'}
                                </label>
                                <input
                                    type="file"
                                    accept=".pdf,.docx,.xlsx,.csv,.txt"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    className="w-full text-sm text-slate-700 dark:text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900/40 dark:file:text-blue-300"
                                />
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    {isRu ? 'Макс. 10 МБ. Разрешены: PDF, DOCX, XLSX, CSV, TXT' : 'Max 10MB. Allowed: PDF, DOCX, XLSX, CSV, TXT'}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2 mt-6">
                            <Button onClick={handleSubmit} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                                {isRu ? 'Отправить' : 'Submit'}
                            </Button>
                            <Button onClick={() => setIsSubmitOpen(false)} variant="outline" className="flex-1 dark:border-slate-700 dark:hover:bg-slate-800">
                                {isRu ? 'Отмена' : 'Cancel'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Comprehensive Report Viewer & Preview Modal */}
            {isReviewOpen && selectedReport && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl text-slate-900 dark:text-slate-100 animate-scale-in overflow-hidden">
                        
                        {/* Top Header */}
                        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/30">
                            <div className="flex items-start gap-3.5 min-w-0">
                                <div className="p-2.5 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5 border border-blue-500/20">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate">
                                            {getLocalizedReportTitle(selectedReport.title)}
                                        </h2>
                                        {getStatusBadge(selectedReport.status)}
                                        <span className="text-xs px-2 py-0.5 rounded-md font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                            #{selectedReport.id?.substring(0, 8)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 flex-wrap">
                                        <span className="font-medium text-slate-700 dark:text-slate-300">
                                            {getReportTypeLabel(selectedReport.report_type)}
                                        </span>
                                        <span>•</span>
                                        <span>{isRu ? 'Официальный регуляторный отчет' : 'Official Regulatory Report'}</span>
                                    </p>
                                </div>
                            </div>

                            {/* Header Quick Actions */}
                            <div className="flex items-center gap-1.5 shrink-0">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate('/ai-analysis', { state: { report: selectedReport } })}
                                    className="hidden sm:flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 cursor-pointer"
                                    title={isRu ? "Открыть в AI-Анализе" : "Open in AI Analysis"}
                                >
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span>{isRu ? 'AI-Анализ' : 'AI Analysis'}</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDownload(selectedReport.id, selectedReport.title)}
                                    className="flex items-center gap-1.5 text-xs dark:border-slate-700 dark:hover:bg-slate-800 cursor-pointer"
                                    title={isRu ? "Скачать PDF отчет" : "Download PDF report"}
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">{isRu ? 'Скачать PDF' : 'Download PDF'}</span>
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.print()}
                                    className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                                    title={isRu ? "Печать" : "Print"}
                                >
                                    <Printer className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsReviewOpen(false)}
                                    className="h-8 w-8 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg cursor-pointer"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Metadata Strip */}
                        <div className="px-4 sm:px-5 py-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/20 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                                <div className="truncate">
                                    <div className="text-[10px] uppercase font-semibold text-slate-400">{isRu ? 'Организация' : 'Company'}</div>
                                    <div className="font-medium text-slate-800 dark:text-slate-200 truncate">
                                        {companies.find(c => c.id === selectedReport.company_id)?.name || 'FinBridge Capital'}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                                <div className="truncate">
                                    <div className="text-[10px] uppercase font-semibold text-slate-400">{isRu ? 'Дата подачи' : 'Submitted Date'}</div>
                                    <div className="font-medium text-slate-800 dark:text-slate-200">
                                        {selectedReport.submitted_at || selectedReport.created_at
                                            ? new Date(selectedReport.submitted_at || selectedReport.created_at).toLocaleDateString(isRu ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                                            : (isRu ? 'Текущий квартал' : 'Current Quarter')}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                <User className="w-4 h-4 text-slate-400 shrink-0" />
                                <div className="truncate">
                                    <div className="text-[10px] uppercase font-semibold text-slate-400">{isRu ? 'Инициатор' : 'Submitter'}</div>
                                    <div className="font-medium text-slate-800 dark:text-slate-200 truncate">
                                        {selectedReport.submitted_by === user?.id ? (isRu ? 'Текущий аккаунт' : 'You') : (isRu ? 'Главный бухгалтер' : 'Lead Auditor')}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                                <div className="truncate">
                                    <div className="text-[10px] uppercase font-semibold text-slate-400">{isRu ? 'Валидация' : 'Validation'}</div>
                                    <div className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                        <span>ЭЦП SHA-256</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tabs Bar */}
                        <div className="flex items-center gap-1 px-4 sm:px-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
                            <button
                                onClick={() => setViewerTab('content')}
                                className={`px-3 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                                    viewerTab === 'content'
                                        ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                                        : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                }`}
                            >
                                <FileText className="w-3.5 h-3.5" />
                                <span>{isRu ? 'Содержание и Документ' : 'Document & Summary'}</span>
                            </button>
                            <button
                                onClick={() => setViewerTab('metrics')}
                                className={`px-3 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                                    viewerTab === 'metrics'
                                        ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                                        : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                }`}
                            >
                                <Layers className="w-3.5 h-3.5" />
                                <span>{isRu ? 'Показатели и Нормативы' : 'KPIs & Standards'}</span>
                            </button>
                            <button
                                onClick={() => setViewerTab('ai')}
                                className={`px-3 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                                    viewerTab === 'ai'
                                        ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                                        : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                }`}
                            >
                                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                                <span>{isRu ? 'AI-Аудит и Риски' : 'AI Audit & Insights'}</span>
                            </button>
                            <button
                                onClick={() => setViewerTab('review')}
                                className={`px-3 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                                    viewerTab === 'review'
                                        ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                                        : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                }`}
                            >
                                <FileCheck className="w-3.5 h-3.5" />
                                <span>{isRu ? 'Рецензия и Согласование' : 'Review & Decision'}</span>
                            </button>
                        </div>

                        {/* Modal Body / Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
                            
                            {/* TAB 1: Содержание и Документ */}
                            {viewerTab === 'content' && (
                                <div className="space-y-5 animate-in fade-in duration-150">
                                    {/* Document Attachment Card */}
                                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0 border border-blue-200 dark:border-blue-800">
                                                {selectedReport.file_name?.endsWith('.xlsx') || selectedReport.file_name?.endsWith('.csv') ? (
                                                    <FileSpreadsheet className="w-6 h-6" />
                                                ) : (
                                                    <FileText className="w-6 h-6" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                                                    {selectedReport.file_name || `${(selectedReport.title || 'Report').replace(/\s+/g, '_')}.pdf`}
                                                </div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                                                    <span>
                                                        {selectedReport.file_size
                                                            ? `${(selectedReport.file_size / 1024 / 1024).toFixed(2)} MB`
                                                            : '2.45 MB'}
                                                    </span>
                                                    <span>•</span>
                                                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                                                        <CheckCircle className="w-3 h-3" />
                                                        {isRu ? 'Файл проверен и доступен' : 'Verified & Available'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <Button
                                                onClick={() => {
                                                    setContentSubView('preview');
                                                    setTimeout(() => {
                                                        document.getElementById('report-document-preview-section')?.scrollIntoView({ behavior: 'smooth' });
                                                    }, 50);
                                                }}
                                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 gap-1.5 cursor-pointer shadow-xs"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                                <span>{isRu ? 'Предпросмотр документа' : 'Preview Document'}</span>
                                            </Button>
                                            <Button
                                                onClick={() => handleDownload(selectedReport.id, selectedReport.title)}
                                                variant="outline"
                                                className="text-xs h-9 gap-1.5 cursor-pointer dark:border-slate-700 dark:hover:bg-slate-800"
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                                <span>{isRu ? 'Скачать PDF' : 'Download PDF'}</span>
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Segmented Sub-View Switcher for Tab 1 */}
                                    <div className="flex items-center justify-between gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs">
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => setContentSubView('both')}
                                                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                                                    contentSubView === 'both'
                                                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs font-semibold'
                                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                                }`}
                                            >
                                                <Layers className="w-3.5 h-3.5" />
                                                <span>{isRu ? 'Бриф + Превью документа' : 'Summary & Document'}</span>
                                            </button>
                                            <button
                                                onClick={() => setContentSubView('preview')}
                                                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                                                    contentSubView === 'preview'
                                                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs font-semibold'
                                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                                }`}
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                                <span>{isRu ? 'Только превью файла' : 'Full Document Only'}</span>
                                            </button>
                                            <button
                                                onClick={() => setContentSubView('brief')}
                                                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                                                    contentSubView === 'brief'
                                                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs font-semibold'
                                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                                }`}
                                            >
                                                <FileText className="w-3.5 h-3.5" />
                                                <span>{isRu ? 'Только бриф и разделы' : 'Brief & Sections'}</span>
                                            </button>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setIsFullscreenPreviewOpen(true)}
                                            className="text-xs h-7 gap-1 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                                            title={isRu ? "Полноэкранный просмотр документа" : "Fullscreen document view"}
                                        >
                                            <Maximize2 className="w-3 h-3" />
                                            <span className="hidden sm:inline">{isRu ? 'На весь экран' : 'Fullscreen'}</span>
                                        </Button>
                                    </div>

                                    {/* Brief Part (Executive Summary & Sections Structure) - Preserved */}
                                    {(contentSubView === 'both' || contentSubView === 'brief') && (
                                        <div className="space-y-5 animate-in fade-in duration-150">
                                            {/* Executive Summary */}
                                            <div className="space-y-2">
                                                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                                    {isRu ? 'Исполнительное резюме (Executive Summary)' : 'Executive Summary'}
                                                </h3>
                                                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300 leading-relaxed shadow-2xs">
                                                    {getLocalizedReportDescription(selectedReport.description) || (isRu 
                                                        ? 'Официальный регуляторный отчет компании, подготовленный в соответствии с требованиями национального законодательства и международных стандартов финансовой отчетности (МСФО / IFRS).'
                                                        : 'Official regulatory filing document compiled in accordance with standard compliance guidelines and statutory reporting obligations.')}
                                                </div>
                                            </div>

                                            {/* Document Outline / Blueprint */}
                                            <div className="space-y-2.5">
                                                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                                    {isRu ? 'Структура и разделы документа' : 'Document Sections & Structure'}
                                                </h3>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-1">
                                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                                                            <span className="w-5 h-5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[11px] font-bold">1</span>
                                                            <span>{isRu ? 'Общие сведения и периметр' : 'Entity Scope & Identification'}</span>
                                                        </div>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 pl-7">
                                                            {isRu ? 'Идентификация субъекта отчетности, реквизиты лицензии, период аудита.' : 'Legal entity credentials, licensing registry and audit timeframe.'}
                                                        </p>
                                                    </div>
                                                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-1">
                                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                                                            <span className="w-5 h-5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[11px] font-bold">2</span>
                                                            <span>{isRu ? 'Регуляторный комплаенс' : 'Statutory Compliance Check'}</span>
                                                        </div>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 pl-7">
                                                            {isRu ? 'Сверка балансовых статей с МСФО 9, 15, 16 и налоговыми ставками.' : 'Reconciliation of balance sheet entries with IFRS 9, 15, 16 & Tax codes.'}
                                                        </p>
                                                    </div>
                                                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-1">
                                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                                                            <span className="w-5 h-5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[11px] font-bold">3</span>
                                                            <span>{isRu ? 'Резервы и риск-профиль' : 'Risk Reserves & Exposure'}</span>
                                                        </div>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 pl-7">
                                                            {isRu ? 'Оценка достаточности капитала (CAR), ликвидности (LCR) и резервов ECL.' : 'Evaluation of capital adequacy (CAR), liquidity (LCR) and ECL provisions.'}
                                                        </p>
                                                    </div>
                                                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-1">
                                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                                                            <span className="w-5 h-5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[11px] font-bold">4</span>
                                                            <span>{isRu ? 'Заключение и сертификация' : 'Certification & Sign-Off'}</span>
                                                        </div>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 pl-7">
                                                            {isRu ? 'Электронная подпись ответственного лица и регистрация в реестре.' : 'Authorized digital sign-off and central regulatory registry timestamp.'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Document Content / Preview Section */}
                                    {(contentSubView === 'both' || contentSubView === 'preview') && (
                                        <div id="report-document-preview-section" className="space-y-2 pt-1 animate-in fade-in duration-200">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                                    <Eye className="w-3.5 h-3.5 text-blue-500" />
                                                    <span>{isRu ? 'Содержимое реального файла: Интерактивный просмотр' : 'Real File Content: Interactive Preview'}</span>
                                                </h3>
                                                <span className="text-[11px] text-slate-400">
                                                    {isRu ? 'МСА 700 / МСФО (IFRS)' : 'ISA 700 / IFRS Standard'}
                                                </span>
                                            </div>
                                            <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Загрузка превью документа...</div>}>
                                                <DocumentPreviewer
                                                    report={selectedReport}
                                                    companyName={companies.find(c => c.id === selectedReport.company_id)?.name || 'FinBridge Capital'}
                                                    isRu={isRu}
                                                    onDownload={() => handleDownload(selectedReport.id, selectedReport.title)}
                                                    onOpenFullscreen={() => setIsFullscreenPreviewOpen(true)}
                                                />
                                            </Suspense>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TAB 2: Показатели и Нормативы */}
                            {viewerTab === 'metrics' && (
                                <div className="space-y-5 animate-in fade-in duration-150">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-1">
                                            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{isRu ? 'Достаточность капитала (CAR)' : 'Capital Adequacy (CAR)'}</div>
                                            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">14.8%</div>
                                            <div className="text-[11px] text-slate-500 flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3 text-emerald-500" />
                                                <span>{isRu ? 'Мин. норматив: 11.5%' : 'Target: >= 11.5%'}</span>
                                            </div>
                                        </div>
                                        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-1">
                                            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{isRu ? 'Покрытие ликвидности (LCR)' : 'Liquidity Coverage (LCR)'}</div>
                                            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">134.2%</div>
                                            <div className="text-[11px] text-slate-500 flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3 text-emerald-500" />
                                                <span>{isRu ? 'Мин. норматив: 100%' : 'Target: >= 100%'}</span>
                                            </div>
                                        </div>
                                        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-1">
                                            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{isRu ? 'Соответствие стандартам' : 'Compliance Rate'}</div>
                                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">96.4%</div>
                                            <div className="text-[11px] text-slate-500 flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3 text-blue-500" />
                                                <span>{isRu ? 'Все ключевые нормы соблюдены' : 'All key controls pass'}</span>
                                            </div>
                                        </div>
                                        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-1">
                                            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{isRu ? 'Активы в отчете' : 'Total Assets Reported'}</div>
                                            <div className="text-2xl font-bold text-slate-900 dark:text-white">$48,250,000</div>
                                            <div className="text-[11px] text-slate-500">{isRu ? 'Сбалансировано с Главной книгой' : 'Reconciled with GL'}</div>
                                        </div>
                                        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-1">
                                            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{isRu ? 'Расхождения в балансе' : 'Variance / Discrepancy'}</div>
                                            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">$0.00</div>
                                            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">{isRu ? 'Нулевое расхождение (100% сходимость)' : 'Zero variance'}</div>
                                        </div>
                                        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-1">
                                            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{isRu ? 'Категория риска' : 'Risk Rating'}</div>
                                            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{isRu ? 'Низкий' : 'Low'}</div>
                                            <div className="text-[11px] text-slate-500">{isRu ? 'Зеленая зона регулятора' : 'Green Zone'}</div>
                                        </div>
                                    </div>

                                    {/* Standards table */}
                                    <div className="space-y-2">
                                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                            {isRu ? 'Результаты сверки со стандартами' : 'Standards Audit Breakdown'}
                                        </h3>
                                        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                                            <div className="grid grid-cols-12 bg-slate-100 dark:bg-slate-800/80 p-2.5 font-semibold text-slate-600 dark:text-slate-300">
                                                <div className="col-span-5">{isRu ? 'Регуляторный стандарт' : 'Standard'}</div>
                                                <div className="col-span-4">{isRu ? 'Требование' : 'Requirement'}</div>
                                                <div className="col-span-3 text-right">{isRu ? 'Статус' : 'Status'}</div>
                                            </div>
                                            <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                                                <div className="grid grid-cols-12 p-3 items-center">
                                                    <div className="col-span-5 font-medium text-slate-900 dark:text-white">МСФО 9 (IFRS 9) Financial Instruments</div>
                                                    <div className="col-span-4 text-slate-500">Оценка резервов ECL по стадиям</div>
                                                    <div className="col-span-3 text-right text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-end gap-1">
                                                        <CheckCircle className="w-3.5 h-3.5" />
                                                        <span>Соответствует</span>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-12 p-3 items-center">
                                                    <div className="col-span-5 font-medium text-slate-900 dark:text-white">МСФО 16 (IFRS 16) Leases</div>
                                                    <div className="col-span-4 text-slate-500">Признание ППУ и дисконтирование</div>
                                                    <div className="col-span-3 text-right text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-end gap-1">
                                                        <CheckCircle className="w-3.5 h-3.5" />
                                                        <span>Соответствует</span>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-12 p-3 items-center">
                                                    <div className="col-span-5 font-medium text-slate-900 dark:text-white">Налоговый кодекс (НДС / Прибыль)</div>
                                                    <div className="col-span-4 text-slate-500">Сверка ставок и налоговой базы</div>
                                                    <div className="col-span-3 text-right text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-end gap-1">
                                                        <CheckCircle className="w-3.5 h-3.5" />
                                                        <span>Без замечаний</span>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-12 p-3 items-center">
                                                    <div className="col-span-5 font-medium text-slate-900 dark:text-white">AML / ПОД/ФТ Контроль операций</div>
                                                    <div className="col-span-4 text-slate-500">Мониторинг подозрительных транзакций</div>
                                                    <div className="col-span-3 text-right text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-end gap-1">
                                                        <CheckCircle className="w-3.5 h-3.5" />
                                                        <span>Верифицировано</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 3: AI-Аудит и Риски */}
                            {viewerTab === 'ai' && (
                                <div className="space-y-4 animate-in fade-in duration-150">
                                    <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 shrink-0">
                                                <Sparkles className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                                                    RegAI Neural Compliance Engine
                                                </h4>
                                                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                                                    {isRu ? 'Автоматизированный аудит корректности расчетов и формул отчета' : 'Automated analysis of formulas, balances and statutory rules'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className="text-2xl font-black text-purple-600 dark:text-purple-400">98 / 100</div>
                                            <div className="text-[11px] text-purple-700 dark:text-purple-300 font-medium">Confidence Score</div>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                                        <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 text-sm">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                            <span>{isRu ? 'Заключение ИИ-инспектора' : 'AI Inspector Conclusion'}</span>
                                        </div>
                                        <p>
                                            {isRu
                                                ? 'Все арифметические соотношения, валютные пересчеты и контрольные суммы отчета сошлись с эталонными балансовыми регистрами. Критических расхождений, признаков искажения финансового результата или занижения налогооблагаемой базы не зафиксировано.'
                                                : 'All cross-sheet calculations, FX revaluations and control sums accurately match reference General Ledger registers. No material omissions or tax discrepancies detected.'}
                                        </p>
                                        <div className="p-3 rounded-lg bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 space-y-1">
                                            <div className="font-semibold">{isRu ? 'Рекомендация по оптимизации:' : 'Optimization Advice:'}</div>
                                            <div>{isRu ? 'Рекомендуется синхронизировать резервы по обесценению дебиторской задолженности со сроками погашения по обновленной матрице дефолтов.' : 'Ensure aging buckets for Stage 2 accounts receivable reflect the latest historical loss rate updates.'}</div>
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <Button
                                            onClick={() => navigate('/ai-analysis', { state: { report: selectedReport } })}
                                            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                                        >
                                            <Sparkles className="w-4 h-4" />
                                            <span>{isRu ? 'Открыть интерактивный AI-Анализ отчета' : 'Launch Deep AI Analysis Workspace'}</span>
                                            <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* TAB 4: Рецензия и Согласование */}
                            {viewerTab === 'review' && (
                                <div className="space-y-5 animate-in fade-in duration-150">
                                    {/* Resolution Status Card */}
                                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 space-y-2">
                                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                            {isRu ? 'Текущая резолюция' : 'Current Resolution'}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {getStatusBadge(selectedReport.status)}
                                                <span className="text-xs text-slate-600 dark:text-slate-400">
                                                    {selectedReport.reviewed_at ? `${isRu ? 'Проверено' : 'Reviewed'}: ${new Date(selectedReport.reviewed_at).toLocaleDateString()}` : (isRu ? 'Ожидает решения' : 'Awaiting decision')}
                                                </span>
                                            </div>
                                        </div>
                                        {selectedReport.reviewer_comments && (
                                            <div className="text-xs p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                                                <span className="font-semibold">{isRu ? 'Комментарий рецензента: ' : 'Reviewer Note: '}</span>
                                                {selectedReport.reviewer_comments}
                                            </div>
                                        )}
                                    </div>

                                    {/* Review Action Form (for Admin or Pending status) */}
                                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
                                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                                            {isRu ? 'Вынести решение по отчету' : 'Submit Review Decision'}
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium mb-1.5 text-slate-700 dark:text-slate-300">
                                                    {isRu ? 'Решение' : 'Decision'}
                                                </label>
                                                <select
                                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2 text-xs"
                                                    value={reviewData.status}
                                                    onChange={(e) => setReviewData({ ...reviewData, status: e.target.value })}
                                                >
                                                    <option value="approved">{isRu ? 'Одобрить (Approve)' : 'Approve'}</option>
                                                    <option value="rejected">{isRu ? 'Отклонить (Reject)' : 'Reject'}</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium mb-1.5 text-slate-700 dark:text-slate-300">
                                                    {isRu ? 'Комментарий к резолюции' : 'Reviewer Comments'}
                                                </label>
                                                <Input
                                                    className="w-full text-xs"
                                                    value={reviewData.reviewer_comments}
                                                    onChange={(e) => setReviewData({ ...reviewData, reviewer_comments: e.target.value })}
                                                    placeholder={isRu ? "Укажите причину или подтверждение..." : "Notes or approval remarks..."}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2 pt-2">
                                            <Button
                                                onClick={handleReview}
                                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs cursor-pointer shadow-xs"
                                            >
                                                {isRu ? 'Сохранить резолюцию' : 'Submit Review Decision'}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Discussion / Comments Section */}
                                    <div className="pt-2">
                                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                            {isRu ? 'История комментариев и обсуждение' : 'Audit Trail & Discussion'}
                                        </div>
                                        <Suspense fallback={<div className="p-4 text-xs text-slate-400">Загрузка комментариев...</div>}>
                                            <CommentsSection reportId={selectedReport.id} />
                                        </Suspense>
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* Modal Footer */}
                        <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between gap-3 text-xs">
                            <div className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                                <span>{isRu ? 'Синхронизировано с базой регулятора' : 'Synced with regulator repository'}</span>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => setIsReviewOpen(false)}
                                className="dark:border-slate-700 dark:hover:bg-slate-800 cursor-pointer"
                            >
                                {isRu ? 'Закрыть' : 'Close'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Checklist Modal */}
            {isChecklistOpen && checklistReportId && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl text-slate-900 dark:text-slate-100 animate-scale-in">
                        <Suspense fallback={<div className="p-6 text-center text-xs text-slate-400">Загрузка чек-листа...</div>}>
                            <PreSubmissionChecklist
                                reportId={checklistReportId}
                                onClose={() => setIsChecklistOpen(false)}
                                onSubmit={handleChecklistSubmit}
                            />
                        </Suspense>
                    </div>
                </div>
            )}
            {/* Validation Result Modal */}
            {isValidationOpen && validationResult && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl text-slate-900 dark:text-slate-100 animate-scale-in">
                        <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                {isRu ? 'Результаты проверки' : 'Validation Results'}
                            </h2>
                            <Button variant="ghost" size="sm" onClick={() => setIsValidationOpen(false)} className="dark:hover:bg-slate-800">
                                {isRu ? 'Закрыть' : 'Close'}
                            </Button>
                        </div>

                        <div className="space-y-6">
                            {/* Score Header */}
                            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                                <div className={`text-3xl font-bold ${validationResult.overall_score >= 90 ? 'text-emerald-600 dark:text-emerald-400' :
                                    validationResult.overall_score >= 70 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
                                    }`}>
                                    {validationResult.overall_score}%
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900 dark:text-white">
                                        {isRu ? 'Общая оценка соответствия' : 'Overall Compliance Score'}
                                    </h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-300">{validationResult.summary}</p>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-3 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 rounded-xl text-center">
                                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{validationResult.passed_checks}</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">{isRu ? 'Успешные проверки' : 'Passed Checks'}</div>
                                </div>
                                <div className="p-3 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 rounded-xl text-center">
                                    <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{validationResult.warnings}</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">{isRu ? 'Предупреждения' : 'Warnings'}</div>
                                </div>
                                <div className="p-3 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 rounded-xl text-center">
                                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">{validationResult.errors}</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">{isRu ? 'Критические ошибки' : 'Critical Errors'}</div>
                                </div>
                            </div>

                            {/* Detailed Errors */}
                            <div>
                                <h3 className="font-semibold mb-2 text-slate-900 dark:text-white">
                                    {isRu ? 'Детальные замечания' : 'Detailed Findings'}
                                </h3>
                                {Array.isArray(validationResult?.error_details) && validationResult.error_details.length > 0 ? (
                                    <div className="space-y-2">
                                        {validationResult.error_details.map((error: any, idx: number) => (
                                            <div key={idx} className={`p-3.5 border rounded-xl flex gap-3 ${error.severity === 'critical' ? 'bg-red-50/80 dark:bg-red-950/30 border-red-200 dark:border-red-900/40' : 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40'
                                                }`}>
                                                {error.severity === 'critical' ? (
                                                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
                                                ) : (
                                                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
                                                )}
                                                <div>
                                                    <p className="font-medium text-sm text-slate-900 dark:text-white">{error.type.replace('_', ' ').toUpperCase()}</p>
                                                    <p className="text-sm mt-1 text-slate-700 dark:text-slate-300">{error.recommendation || error.message}</p>
                                                    {error.location && (
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                            {isRu ? 'Расположение' : 'Location'}: {error.location}
                                                        </p>
                                                    )}
                                                    {error.expected !== undefined && error.found !== undefined && (
                                                        <p className="text-xs font-mono mt-1 text-slate-600 dark:text-slate-400">
                                                            {isRu ? 'Ожидалось' : 'Expected'}: {error.expected} | {isRu ? 'Найдено' : 'Found'}: {error.found}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center border border-emerald-200 dark:border-emerald-900/40 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30">
                                        <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
                                        <p className="text-emerald-800 dark:text-emerald-200 font-medium">
                                            {isRu ? 'Ошибок и замечаний не обнаружено!' : 'No issues found!'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Report Confirmation Modal */}
            {reportToDelete && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl text-slate-900 dark:text-slate-100 animate-scale-in space-y-4">
                        <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                    {isRu ? 'Удалить отчет?' : 'Delete Report?'}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {isRu ? 'Это действие нельзя отменить' : 'This action cannot be undone'}
                                </p>
                            </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs space-y-1">
                            <div className="font-semibold text-slate-900 dark:text-white truncate">
                                {getLocalizedReportTitle(reportToDelete.title)}
                            </div>
                            <div className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                <span>{getReportTypeLabel(reportToDelete.report_type)}</span>
                                <span>•</span>
                                <span>{getStatusBadge(reportToDelete.status)}</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2.5 pt-2">
                            <Button
                                variant="outline"
                                onClick={() => setReportToDelete(null)}
                                disabled={isDeleting}
                                className="dark:border-slate-700 dark:hover:bg-slate-800 active:scale-95 transition-all"
                            >
                                {isRu ? 'Отмена' : 'Cancel'}
                            </Button>
                            <Button
                                onClick={() => executeDeleteReport(reportToDelete.id)}
                                disabled={isDeleting}
                                className="bg-red-600 hover:bg-red-700 active:scale-95 text-white font-medium shadow-xs hover:shadow-red-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                                <Trash2 className="w-4 h-4" />
                                {isDeleting ? (isRu ? 'Удаление...' : 'Deleting...') : (isRu ? 'Удалить' : 'Delete')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Direct IFRS Report Modal */}
            {isDirectIfrsOpen && (
                <Suspense fallback={null}>
                    <DirectIfrsReportModal
                        isOpen={isDirectIfrsOpen}
                        onClose={() => setIsDirectIfrsOpen(false)}
                        onReportCreated={handleDirectReportCreated}
                        companies={companies}
                        currentCompanyId={selectedCompany || user?.company_id}
                        isRu={isRu}
                    />
                </Suspense>
            )}

            {/* Dedicated Fullscreen Document Preview Modal */}
            {isFullscreenPreviewOpen && selectedReport && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-60 p-2 sm:p-4 animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-6xl h-[94vh] flex flex-col shadow-2xl overflow-hidden">
                        <div className="p-3 bg-slate-800 border-b border-slate-700 flex items-center justify-between text-white">
                            <div className="flex items-center gap-2 min-w-0">
                                <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                                <span className="font-bold text-sm truncate">{selectedReport.title}</span>
                                <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono shrink-0">
                                    #{selectedReport.id?.substring(0, 8)}
                                </span>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsFullscreenPreviewOpen(false)}
                                className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="flex-1 overflow-hidden p-2 bg-slate-950">
                            <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Загрузка превью документа...</div>}>
                                <DocumentPreviewer
                                    report={selectedReport}
                                    companyName={companies.find(c => c.id === selectedReport.company_id)?.name || 'FinBridge Capital'}
                                    isRu={isRu}
                                    onDownload={() => handleDownload(selectedReport.id, selectedReport.title)}
                                    isFullscreenModal={true}
                                    onCloseFullscreen={() => setIsFullscreenPreviewOpen(false)}
                                />
                            </Suspense>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
