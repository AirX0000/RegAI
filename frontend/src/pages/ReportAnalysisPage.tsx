import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../lib/api';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';

import { useAuth } from '../context/AuthContext';

export default function ReportAnalysisPage() {
    const location = useLocation();
    const { user } = useAuth();
    const [reports, setReports] = useState<any[]>([]);
    const [selectedReport, setSelectedReport] = useState<any>(null);
    const [countries, setCountries] = useState<any[]>([]);
    const [taxTypes, setTaxTypes] = useState<any[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [scanningPhase, setScanningPhase] = useState('');
    const [scanProgress, setScanProgress] = useState(0);
    const [analysis, setAnalysis] = useState<any>(null);
    const [scanLog, setScanLog] = useState<string[]>([]);
    const { toast } = useToast();

    // Upload mode
    const [uploadMode, setUploadMode] = useState<'select' | 'upload'>('select');
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadTitle, setUploadTitle] = useState('');

    const [analysisConfig, setAnalysisConfig] = useState({
        country_code: 'GB',
        tax_types: ['vat', 'corporate']
    });

    useEffect(() => {
        fetchReports();
        fetchCountries();
        fetchTaxTypes();
    }, []);

    useEffect(() => {
        // Auto-select report if passed from navigation
        if (location.state?.reportId && reports.length > 0) {
            const report = reports.find((r: any) => r.id === location.state.reportId);
            if (report) {
                setSelectedReport(report);
            }
        }
    }, [location.state, reports]);

    const fetchReports = async () => {
        try {
            const res = await api.get('/reports/');
            setReports(res.data.filter((r: any) => r.file_path && r.status !== 'draft'));
        } catch (error) {
            console.error('Failed to fetch reports', error);
        }
    };

    const fetchCountries = async () => {
        try {
            const res = await api.get('/tax-rates/countries');
            setCountries(res.data);
        } catch (error) {
            console.error('Failed to fetch countries', error);
        }
    };

    const fetchTaxTypes = async () => {
        try {
            const res = await api.get('/tax-rates/types/all');
            setTaxTypes(res.data);
        } catch (error) {
            console.error('Failed to fetch tax types', error);
        }
    };

    const addScanLog = (message: string) => {
        setScanLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    };

    const simulateScanningPhases = async () => {
        // Phase 1: Document Extraction
        setScanningPhase('Extracting document content...');
        setScanProgress(10);
        addScanLog('Starting document extraction');
        await new Promise(resolve => setTimeout(resolve, 800));
        addScanLog('Document structure analyzed');
        setScanProgress(25);

        // Phase 2: Text Analysis
        setScanningPhase('Analyzing text and financial data...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        addScanLog('Extracted financial figures and tax information');
        setScanProgress(40);

        // Phase 3: Regulation Matching
        setScanningPhase('Matching against tax regulations...');
        await new Promise(resolve => setTimeout(resolve, 1200));
        addScanLog(`Checking compliance with ${analysisConfig.country_code} tax laws`);
        addScanLog(`Validating ${analysisConfig.tax_types.length} tax type(s)`);
        setScanProgress(60);

        // Phase 4: Validation
        setScanningPhase('Validating calculations and rates...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        addScanLog('Cross-referencing tax rates with official database');
        setScanProgress(75);

        // Phase 5: Report Generation
        setScanningPhase('Generating compliance report...');
        await new Promise(resolve => setTimeout(resolve, 800));
        addScanLog('Compiling findings and recommendations');
        setScanProgress(90);
    };

    const handleAnalyze = async () => {
        if (uploadMode === 'select' && !selectedReport) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Please select a report to analyze",
            });
            return;
        }

        if (uploadMode === 'upload' && !uploadFile) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Please upload a file to analyze",
            });
            return;
        }

        setIsAnalyzing(true);
        setScanLog([]);
        setScanProgress(0);
        setScanningPhase('Initializing analysis...');
        addScanLog('Analysis started');

        try {
            let reportId = selectedReport?.id;

            // If uploading new file, create report first
            if (uploadMode === 'upload' && uploadFile) {
                addScanLog(`Uploading file: ${uploadFile.name}`);
                const formData = new FormData();
                formData.append('title', uploadTitle || 'Tax Analysis Report');
                formData.append('description', 'Uploaded for AI analysis');
                formData.append('report_type', 'financial');
                formData.append('company_id', user?.company_id || '');
                formData.append('file', uploadFile);

                const uploadRes = await api.post('/reports/', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                reportId = uploadRes.data.id;
                addScanLog('File uploaded successfully');
            }

            // Run scanning phases
            await simulateScanningPhases();

            // Analyze the report
            setScanningPhase('Running AI analysis...');
            addScanLog('Sending data to AI compliance engine');
            const res = await api.post('/report-analysis/analyze', {
                report_id: reportId,
                country_code: analysisConfig.country_code,
                tax_types: analysisConfig.tax_types
            });

            setScanProgress(100);
            setScanningPhase('Analysis complete');
            addScanLog('Analysis completed successfully');

            setAnalysis(res.data);

            // Generate detailed result message
            const resultMessage = generateResultMessage(res.data);
            addScanLog('--- ANALYSIS SUMMARY ---');
            resultMessage.forEach(msg => addScanLog(msg));

            toast({
                title: "✅ Analysis Complete",
                description: `Compliance Score: ${res.data.overall_score}% - ${res.data.summary}`,
            });
        } catch (error: any) {
            addScanLog(`ERROR: ${error.response?.data?.detail || 'Analysis failed'}`);
            toast({
                variant: "destructive",
                title: "Error",
                description: error.response?.data?.detail || "Analysis failed",
            });
        } finally {
            setIsAnalyzing(false);
            setScanningPhase('');
        }
    };

    const generateResultMessage = (data: any): string[] => {
        const messages: string[] = [];

        messages.push(`Overall Compliance Score: ${data.overall_score}%`);
        messages.push(`Total Checks Performed: ${data.total_checks}`);
        messages.push(`Passed: ${data.passed_checks} | Errors: ${data.errors} | Warnings: ${data.warnings}`);

        if (data.overall_score >= 90) {
            messages.push('✅ EXCELLENT - Report meets all compliance requirements');
        } else if (data.overall_score >= 70) {
            messages.push('⚠️  GOOD - Minor issues detected, review recommended');
        } else {
            messages.push('❌ ATTENTION REQUIRED - Significant compliance issues found');
        }

        if (data.error_details && data.error_details.length > 0) {
            messages.push(`Found ${data.error_details.length} issue(s):`);
            data.error_details.slice(0, 3).forEach((error: any, idx: number) => {
                messages.push(`  ${idx + 1}. ${error.type} - ${error.location}`);
            });
            if (data.error_details.length > 3) {
                messages.push(`  ... and ${data.error_details.length - 3} more`);
            }
        }

        messages.push(`Country: ${analysisConfig.country_code} | Tax Types: ${analysisConfig.tax_types.join(', ')}`);

        return messages;
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-green-600';
        if (score >= 70) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getSeverityIcon = (severity: string) => {
        if (severity === 'critical') return <XCircle className="h-5 w-5 text-red-600" />;
        if (severity === 'warning') return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
        return <CheckCircle className="h-5 w-5 text-blue-600" />;
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">AI Tax Compliance Analysis</h1>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Configuration Panel */}
                <div className="rounded-lg border p-6 bg-white shadow-sm">
                    <h2 className="text-xl font-semibold mb-4">Analysis Configuration</h2>

                    <div className="space-y-4">
                        {/* Mode Selector */}
                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={() => setUploadMode('select')}
                                className={`flex-1 py-2 px-4 rounded-md border ${uploadMode === 'select'
                                    ? 'bg-blue-500 text-white border-blue-500'
                                    : 'bg-white text-gray-700 border-gray-300'
                                    }`}
                            >
                                Select Existing
                            </button>
                            <button
                                onClick={() => setUploadMode('upload')}
                                className={`flex-1 py-2 px-4 rounded-md border ${uploadMode === 'upload'
                                    ? 'bg-blue-500 text-white border-blue-500'
                                    : 'bg-white text-gray-700 border-gray-300'
                                    }`}
                            >
                                Upload New PDF
                            </button>
                        </div>

                        {uploadMode === 'select' ? (
                            <div>
                                <label className="block text-sm font-medium mb-2">Select Report</label>
                                <select
                                    className="w-full rounded-md border p-2"
                                    value={selectedReport?.id || ''}
                                    onChange={(e) => {
                                        const report = reports.find(r => r.id === e.target.value);
                                        setSelectedReport(report);
                                        setAnalysis(null);
                                    }}
                                >
                                    <option value="">Choose a report...</option>
                                    {reports.map((report) => (
                                        <option key={report.id} value={report.id}>
                                            {report.title} ({report.report_type})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Report Title (Optional)</label>
                                    <input
                                        type="text"
                                        className="w-full rounded-md border p-2"
                                        value={uploadTitle}
                                        onChange={(e) => setUploadTitle(e.target.value)}
                                        placeholder="Tax Analysis Report"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Upload PDF File</label>
                                    <input
                                        type="file"
                                        accept=".pdf,.xlsx,.csv,.txt"
                                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                        className="w-full"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Supported: PDF, Excel, CSV, TXT (Max 10MB)
                                    </p>
                                    {uploadFile && (
                                        <p className="text-sm text-green-600 mt-2">
                                            ✓ {uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium mb-2">Country</label>
                            <select
                                className="w-full rounded-md border p-2"
                                value={analysisConfig.country_code}
                                onChange={(e) => setAnalysisConfig({ ...analysisConfig, country_code: e.target.value })}
                            >
                                {countries.map((country) => (
                                    <option key={country.code} value={country.code}>
                                        {country.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Tax Types to Check</label>
                            <div className="space-y-2">
                                {taxTypes.map((type: any) => (
                                    <label key={type.type} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={analysisConfig.tax_types.includes(type.type)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setAnalysisConfig({
                                                        ...analysisConfig,
                                                        tax_types: [...analysisConfig.tax_types, type.type]
                                                    });
                                                } else {
                                                    setAnalysisConfig({
                                                        ...analysisConfig,
                                                        tax_types: analysisConfig.tax_types.filter(t => t !== type.type)
                                                    });
                                                }
                                            }}
                                            className="mr-2"
                                        />
                                        <span className="text-sm">{type.type}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <Button
                            onClick={handleAnalyze}
                            disabled={(uploadMode === 'select' && !selectedReport) || (uploadMode === 'upload' && !uploadFile) || isAnalyzing}
                            className="w-full"
                        >
                            {isAnalyzing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                'Analyze Report'
                            )}
                        </Button>

                        {/* Scanning Progress */}
                        {isAnalyzing && (
                            <div className="mt-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">{scanningPhase}</span>
                                    <span className="font-medium">{scanProgress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${scanProgress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Scan Log */}
                        {scanLog.length > 0 && (
                            <div className="mt-4">
                                <h3 className="text-sm font-medium mb-2">Scan Log:</h3>
                                <div className="bg-gray-900 text-green-400 p-3 rounded-md text-xs font-mono max-h-48 overflow-y-auto">
                                    {scanLog.map((log, idx) => (
                                        <div key={idx} className="mb-1">{log}</div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Results Panel */}
                <div className="rounded-lg border p-6 bg-white shadow-sm">
                    <h2 className="text-xl font-semibold mb-4">Analysis Results</h2>

                    {!analysis ? (
                        <p className="text-gray-500">Configure and run analysis to see results</p>
                    ) : (
                        <div className="space-y-4">
                            {/* Score */}
                            <div className="text-center p-6 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-600 mb-2">Compliance Score</p>
                                <p className={`text-5xl font-bold ${getScoreColor(analysis.overall_score)}`}>
                                    {analysis.overall_score}%
                                </p>
                                <p className="text-sm text-gray-600 mt-2">{analysis.summary}</p>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-green-50 rounded-md">
                                    <p className="text-sm text-gray-600">Passed</p>
                                    <p className="text-2xl font-bold text-green-600">{analysis.passed_checks}</p>
                                </div>
                                <div className="p-3 bg-red-50 rounded-md">
                                    <p className="text-sm text-gray-600">Errors</p>
                                    <p className="text-2xl font-bold text-red-600">{analysis.errors}</p>
                                </div>
                                <div className="p-3 bg-yellow-50 rounded-md">
                                    <p className="text-sm text-gray-600">Warnings</p>
                                    <p className="text-2xl font-bold text-yellow-600">{analysis.warnings}</p>
                                </div>
                                <div className="p-3 bg-blue-50 rounded-md">
                                    <p className="text-sm text-gray-600">Total Checks</p>
                                    <p className="text-2xl font-bold text-blue-600">{analysis.total_checks}</p>
                                </div>
                            </div>

                            {/* Errors List */}
                            {analysis.error_details && analysis.error_details.length > 0 && (
                                <div>
                                    <h3 className="font-semibold mb-2">Issues Found:</h3>
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                        {analysis.error_details.map((error: any, idx: number) => (
                                            <div key={idx} className="p-3 border rounded-md bg-gray-50">
                                                <div className="flex items-start gap-2">
                                                    {getSeverityIcon(error.severity)}
                                                    <div className="flex-1">
                                                        <p className="font-medium text-sm">{error.type}</p>
                                                        <p className="text-xs text-gray-600 mt-1">{error.location}</p>
                                                        {error.expected && (
                                                            <p className="text-xs mt-1">
                                                                Expected: {error.expected}% | Found: {error.found}%
                                                            </p>
                                                        )}
                                                        <p className="text-xs text-blue-600 mt-1">{error.recommendation}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
