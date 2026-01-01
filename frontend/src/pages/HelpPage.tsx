import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, BarChart3, Shield, Users, MessageCircle, CheckCircle, AlertCircle, FileCheck, Upload, Eye, Download, Settings, TrendingUp, Plus, Send, Mail, Phone, HelpCircle, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function HelpPage() {
    const { t } = useTranslation();
    const [showContactModal, setShowContactModal] = useState(false);
    const [showFAQModal, setShowFAQModal] = useState(false);
    const [contactForm, setContactForm] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });

    const handleContactSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Here you would typically send the form data to your backend
        alert(`Message sent!\n\nName: ${contactForm.name}\nEmail: ${contactForm.email}\nSubject: ${contactForm.subject}\n\nWe'll get back to you soon!`);
        setShowContactModal(false);
        setContactForm({ name: '', email: '', subject: '', message: '' });
    };

    const faqItems = [
        {
            question: "How do I upload financial reports?",
            answer: "Navigate to the Upload page from the main menu. You can drag and drop Excel/CSV files or click to browse. The system supports balance sheet data in standard formats."
        },
        {
            question: "Where can I find Uzbekistan regulations?",
            answer: "Go to Regulations page and filter by Jurisdiction: 'Uzbekistan'. You'll find 7 regulations including detailed guides for accountants (UZ-ACCT-GUIDE) and auditors (UZ-AUDIT-GUIDE)."
        },
        {
            question: "How do I access detailed accounting instructions?",
            answer: "Search for 'UZ-ACCT-GUIDE' in the Regulations page. This contains 100+ pages of step-by-step instructions for preparing financial reports according to NAS."
        },
        {
            question: "What is the difference between IFRS and NAS?",
            answer: "IFRS (International Financial Reporting Standards) includes provisions like IFRS 9 ECL and IFRS 16 leases. NAS (National Accounting Standards) follows Uzbekistan's specific requirements. See the Examples page for side-by-side comparisons."
        },
        {
            question: "How do I calculate materiality for audit?",
            answer: "Use the materiality calculator in the Examples page under 'For Auditors'. Typically: Revenue × 1%, Assets × 2%, Profit × 5%. Use the lowest value."
        },
        {
            question: "Can I download example reports?",
            answer: "Yes! Visit the Examples page (/examples) where you can download filled balance sheets, P&L statements, cash flow statements, and audit working papers."
        },
        {
            question: "How do I switch between Russian and English?",
            answer: "Use the language selector in the top navigation bar. The system supports full bilingual content for all regulations and instructions."
        },
        {
            question: "What are workflow steps in regulations?",
            answer: "Many regulations include interactive workflow steps with checklists. Click on a regulation to view its workflow, track your progress, and check off completed items."
        }
    ];

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <div>
                <h1 className="text-4xl font-bold tracking-tight">{t('regai_user_guide')}</h1>
                <p className="text-gray-500 mt-2">{t('complete_documentation')}</p>

                {/* Link to Full Guide */}
                <div className="mt-4">
                    <a
                        href="/guide"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                    >
                        📖 Полное руководство пользователя с визуалами
                        <ChevronRight className="h-5 w-5" />
                    </a>
                </div>
            </div>

            {/* Table of Contents */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardHeader>
                    <CardTitle>📚 {t('table_of_contents')}</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2 text-sm">
                    <a href="#getting-started" className="text-blue-600 hover:underline">1. {t('getting_started')}</a>
                    <a href="#dashboard" className="text-blue-600 hover:underline">2. {t('dashboard_overview')}</a>
                    <a href="#compliance" className="text-blue-600 hover:underline">3. {t('compliance')}</a>
                    <a href="#reports" className="text-blue-600 hover:underline">4. {t('managing_reports')}</a>
                    <a href="#validation" className="text-blue-600 hover:underline">5. {t('report_validation')}</a>
                    <a href="#tax-analysis" className="text-blue-600 hover:underline">6. {t('ai_tax_analysis')}</a>
                    <a href="#regulations" className="text-blue-600 hover:underline">7. {t('regulations_database')}</a>
                    <a href="#ai-assistant" className="text-blue-600 hover:underline">8. {t('ai_assistant')}</a>
                    <a href="#users" className="text-blue-600 hover:underline">9. {t('user_management')}</a>
                    <a href="#tax-config" className="text-blue-600 hover:underline">10. {t('tax_config')}</a>
                </CardContent>
            </Card>

            {/* Getting Started */}
            <div id="getting-started">
                <h2 className="text-2xl font-bold mb-4">1. {t('getting_started')}</h2>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            {t('your_first_steps')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <div className="flex gap-4 mb-3">
                                <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">1</div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-lg mb-2">{t('login_authentication')}</h4>
                                    <p className="text-gray-600 mb-2">{t('help_login_desc')}</p>
                                    <div className="bg-gray-50 p-3 rounded border text-sm">
                                        <strong>{t('help_role_permissions')}</strong>
                                        <ul className="list-disc ml-5 mt-1 space-y-1">
                                            <li><strong>Accountant/Auditor:</strong> {t('help_accountant_auditor_perm')}</li>
                                            <li><strong>Admin:</strong> {t('help_admin_perm')}</li>
                                            <li><strong>Superadmin:</strong> {t('help_superadmin_perm')}</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="flex gap-4 mb-3">
                                <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">2</div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-lg mb-2">{t('explore_dashboard')}</h4>
                                    <p className="text-gray-600 mb-2">{t('help_dashboard_desc')}</p>
                                    <ul className="list-disc ml-5 space-y-1 text-gray-600">
                                        <li>{t('help_current_score')}</li>
                                        <li>{t('help_active_alerts_num')}</li>
                                        <li>{t('help_reports_month')}</li>
                                        <li>{t('help_avg_validation')}</li>
                                        <li>{t('help_trend_chart')}</li>
                                        <li>{t('help_action_items_desc')}</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">3</div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-lg mb-2">{t('navigate_platform')}</h4>
                                    <p className="text-gray-600 mb-2">{t('help_navigate_desc')}</p>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="bg-gray-50 p-2 rounded">{t('help_nav_dashboard')}</div>
                                        <div className="bg-gray-50 p-2 rounded">{t('help_nav_regulations')}</div>
                                        <div className="bg-gray-50 p-2 rounded">{t('help_nav_compliance')}</div>
                                        <div className="bg-gray-50 p-2 rounded">{t('help_nav_companies')}</div>
                                        <div className="bg-gray-50 p-2 rounded">{t('help_nav_reports')}</div>
                                        <div className="bg-gray-50 p-2 rounded">{t('help_nav_tax_rates')}</div>
                                        <div className="bg-gray-50 p-2 rounded">{t('help_nav_ai_analysis')}</div>
                                        <div className="bg-gray-50 p-2 rounded">{t('help_nav_help')}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Dashboard */}
            <div id="dashboard">
                <h2 className="text-2xl font-bold mb-4">2. {t('dashboard_overview')}</h2>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-blue-600" />
                            {t('understanding_dashboard')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" />
                                {t('compliance_score_widget')}
                            </h4>
                            <p className="text-gray-600 text-sm mb-2">Your compliance score is calculated based on:</p>
                            <ul className="list-disc ml-5 text-sm text-gray-600 space-y-1">
                                <li>Number and severity of open alerts (Critical alerts have 10x weight)</li>
                                <li>Total regulations applicable to your organization</li>
                                <li>Formula: 100 - (weighted_alerts / max_possible_weight × 100)</li>
                            </ul>
                            <div className="bg-green-50 border border-green-200 p-3 rounded mt-2 text-sm">
                                <strong>Score Interpretation:</strong> 90-100% = Excellent | 70-89% = Good | 50-69% = Needs Attention | Below 50% = Critical
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-2">Compliance Trend Chart</h4>
                            <p className="text-gray-600 text-sm">The line chart shows your average compliance score over the last 6 months. Use this to:</p>
                            <ul className="list-disc ml-5 text-sm text-gray-600 space-y-1">
                                <li>Identify improvement or decline patterns</li>
                                <li>Correlate with specific events (new regulations, team changes)</li>
                                <li>Set goals for future months</li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-2">Action Items Widget</h4>
                            <p className="text-gray-600 text-sm mb-2">Prioritized list of tasks requiring your attention:</p>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                                    <div><strong>Critical:</strong> Reports with validation errors, rejected reports</div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                                    <div><strong>High:</strong> Reports pending admin review</div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                                    <div><strong>Medium:</strong> Warnings in validated reports</div>
                                </div>
                            </div>
                            <div className="bg-blue-50 p-3 rounded mt-3 text-sm">
                                <strong>💡 Tip:</strong> Click the "View" button on any action item to navigate directly to the related report or task.
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-2">Category Breakdown Widget</h4>
                            <p className="text-gray-600 text-sm mb-2">Shows your compliance score broken down by regulation category:</p>
                            <ul className="list-disc ml-5 text-sm text-gray-600 space-y-1">
                                <li><strong>Consumer:</strong> Consumer protection and rights regulations</li>
                                <li><strong>ESG:</strong> Environmental, Social, and Governance standards</li>
                                <li><strong>Environmental:</strong> Environmental protection and sustainability</li>
                                <li><strong>Finance:</strong> Financial reporting and accounting standards</li>
                                <li><strong>Financial:</strong> Banking and financial services regulations</li>
                                <li><strong>Healthcare:</strong> Healthcare compliance and patient data protection</li>
                                <li><strong>Labor:</strong> Employment law and worker rights</li>
                                <li><strong>Privacy:</strong> Data privacy and protection (GDPR, etc.)</li>
                                <li><strong>Security:</strong> Information security and cybersecurity</li>
                                <li><strong>Tax:</strong> Tax compliance and reporting requirements</li>
                            </ul>
                            <div className="bg-green-50 border border-green-200 p-3 rounded mt-3 text-sm">
                                <strong>✨ Interactive Feature:</strong>
                                <ul className="list-disc ml-5 mt-1 space-y-1">
                                    <li>Click on any category bar to view detailed regulations for that category</li>
                                    <li>Each category shows: compliance score, number of regulations, and open alerts</li>
                                    <li>Color coding: Green (95-100%), Light Green (90-94%), Yellow (70-89%), Red (below 70%)</li>
                                    <li>Hover over categories to see additional details</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Reports */}
            <div id="reports">
                <h2 className="text-2xl font-bold mb-4">3. {t('managing_reports')}</h2>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-green-600" />
                            {t('complete_report_workflow')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <Upload className="h-4 w-4" />
                                Step 1: Creating a Report
                            </h4>
                            <ol className="list-decimal ml-5 space-y-2 text-sm text-gray-600">
                                <li>Click the <strong>"Submit Report"</strong> button on the Reports page</li>
                                <li>Fill in required fields:
                                    <ul className="list-disc ml-5 mt-1">
                                        <li><strong>Title:</strong> Descriptive name (e.g., "Q4 2024 Financial Report")</li>
                                        <li><strong>Description:</strong> Optional details about the report content</li>
                                        <li><strong>Report Type:</strong> Choose from Compliance, Audit, Financial, or Risk Assessment</li>
                                    </ul>
                                </li>
                                <li>Click <strong>"Choose File"</strong> to upload your document
                                    <div className="bg-blue-50 p-2 rounded mt-1">
                                        <strong>Supported formats:</strong> Excel (.xlsx, .xls), PDF (.pdf), Word (.docx), CSV (.csv), Text (.txt)
                                        <br /><strong>Max file size:</strong> 10MB
                                    </div>
                                </li>
                                <li>Click <strong>"Submit"</strong> to save as draft or submit for review</li>
                            </ol>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                Step 2: Viewing Reports
                            </h4>
                            <p className="text-sm text-gray-600 mb-2">The Reports page displays all your reports in a table with:</p>
                            <ul className="list-disc ml-5 text-sm text-gray-600 space-y-1">
                                <li><strong>Status badges:</strong> Draft (gray), Submitted (blue), Under Review (yellow), Approved (green), Rejected (red)</li>
                                <li><strong>Submitted date:</strong> When the report was created</li>
                                <li><strong>Actions:</strong> Download, View Details, Validate (see next section)</li>
                            </ul>
                            <p className="text-sm text-gray-600 mt-2">Click the <Eye className="inline h-3 w-3" /> icon to view full report details including comments and review history.</p>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <Download className="h-4 w-4" />
                                Step 3: Exporting Reports
                            </h4>
                            <p className="text-sm text-gray-600">Click <strong>"Export Excel"</strong> to download all your reports as a spreadsheet for offline analysis or archiving.</p>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <Settings className="h-4 w-4" />
                                Admin: Reviewing Reports
                            </h4>
                            <p className="text-sm text-gray-600 mb-2">Admins can review submitted reports:</p>
                            <ol className="list-decimal ml-5 space-y-1 text-sm text-gray-600">
                                <li>Click the <Eye className="inline h-3 w-3" /> icon on a submitted report</li>
                                <li>Review the report content and validation results</li>
                                <li>Add comments in the "Reviewer Comments" field</li>
                                <li>Select <strong>Approve</strong> or <strong>Reject</strong></li>
                                <li>The submitter will receive a notification of your decision</li>
                            </ol>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Validation */}
            <div id="validation">
                <h2 className="text-2xl font-bold mb-4">4. {t('report_validation')}</h2>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileCheck className="h-5 w-5 text-purple-600" />
                            {t('ai_powered_validation')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <h4 className="font-semibold mb-2">What is Report Validation?</h4>
                            <p className="text-sm text-gray-600 mb-3">
                                RegAI automatically checks your uploaded reports for errors, inconsistencies, and compliance issues using a combination of:
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <div className="bg-blue-50 p-3 rounded border border-blue-200">
                                    <strong className="text-blue-900">📊 Data Convergence Checks</strong>
                                    <p className="text-gray-600 mt-1">For Excel files, verifies that totals match the sum of their components (e.g., Row 10 "Total" = Sum of Rows 5-9)</p>
                                </div>
                                <div className="bg-purple-50 p-3 rounded border border-purple-200">
                                    <strong className="text-purple-900">🤖 AI Analysis</strong>
                                    <p className="text-gray-600 mt-1">Uses AI to check tax rates, identify missing fields, and detect compliance issues based on regulations</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-2">How to Validate a Report</h4>
                            <ol className="list-decimal ml-5 space-y-2 text-sm text-gray-600">
                                <li>On the Reports page, find the report you want to validate</li>
                                <li>Click the <FileCheck className="inline h-4 w-4 text-blue-600" /> <strong>Validate</strong> button</li>
                                <li>Wait for the analysis to complete (usually 5-30 seconds depending on file size)</li>
                                <li>A modal will appear showing the validation results</li>
                            </ol>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-2">Understanding Validation Results</h4>
                            <div className="space-y-3 text-sm">
                                <div className="bg-gray-50 p-3 rounded border">
                                    <strong>Overall Score (0-100%):</strong>
                                    <p className="text-gray-600 mt-1">Higher is better. Score = (Passed Checks / Total Checks) × 100</p>
                                    <div className="mt-2 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-green-500 rounded"></div>
                                            <span>90-100%: Excellent compliance</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                                            <span>70-89%: Good with minor issues</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-red-500 rounded"></div>
                                            <span>Below 70%: Needs attention</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-3 rounded border">
                                    <strong>Error Types:</strong>
                                    <ul className="list-disc ml-5 mt-2 space-y-1 text-gray-600">
                                        <li><strong className="text-red-600">Critical Errors:</strong> Math errors, incorrect tax rates ({'>'}2% off), missing required fields</li>
                                        <li><strong className="text-yellow-600">Warnings:</strong> Minor discrepancies, tax rates slightly off (0.5-2%), formatting issues</li>
                                    </ul>
                                </div>

                                <div className="bg-gray-50 p-3 rounded border">
                                    <strong>Detailed Findings:</strong>
                                    <p className="text-gray-600 mt-1">Each error shows:</p>
                                    <ul className="list-disc ml-5 mt-1 text-gray-600">
                                        <li><strong>Location:</strong> Sheet name, row, and column (for Excel)</li>
                                        <li><strong>Expected vs. Found:</strong> What the value should be vs. what was detected</li>
                                        <li><strong>Recommendation:</strong> How to fix the issue</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
                            <h4 className="font-semibold text-yellow-900 mb-2">💡 Best Practice</h4>
                            <p className="text-sm text-yellow-900">Always validate your reports BEFORE submitting them for admin review. This allows you to fix errors early and speeds up the approval process.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Regulations */}
            <div id="regulations">
                <h2 className="text-2xl font-bold mb-4">5. {t('regulations_database')}</h2>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-purple-600" />
                            {t('searching_regulations')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-gray-600">
                            The Regulations page provides access to a comprehensive database of compliance rules, standards, and requirements.
                        </p>

                        <div>
                            <h4 className="font-semibold mb-2">Search & Filter</h4>
                            <ul className="list-disc ml-5 text-sm text-gray-600 space-y-1">
                                <li><strong>Keyword Search:</strong> Enter regulation codes (e.g., "IFRS 9", "GDPR") or topics</li>
                                <li><strong>Country Filter:</strong> Select specific countries to see region-specific regulations</li>
                                <li><strong>Category Filter:</strong> Filter by Financial, Data Privacy, Environmental, etc.</li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-2">Regulation Details</h4>
                            <p className="text-sm text-gray-600 mb-2">Click on any regulation to view:</p>
                            <ul className="list-disc ml-5 text-sm text-gray-600 space-y-1">
                                <li>Full regulation text and requirements</li>
                                <li>Effective dates and version history</li>
                                <li>Applicable countries and industries</li>
                                <li>Related regulations and cross-references</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>

                <div className="mt-6">
                    <h3 className="text-xl font-bold mb-3">5.1 {t('adding_regulations')}</h3>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Plus className="h-5 w-5 text-blue-600" />
                                {t('manually_adding_regulations')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-gray-600">
                                If a specific regulation is missing from the database, you can manually add it to ensure your compliance checks are comprehensive.
                            </p>
                            <ol className="list-decimal ml-5 text-sm text-gray-600 space-y-2">
                                <li>Navigate to the <strong>Regulations</strong> page.</li>
                                <li>Click the <strong>"Add Regulation"</strong> button located at the top right, next to the Filters button.</li>
                                <li>Fill in the required fields in the popup form:
                                    <ul className="list-disc ml-5 mt-1 space-y-1">
                                        <li><strong>Code:</strong> The official code or identifier (e.g., "GDPR", "ISO-27001").</li>
                                        <li><strong>Title:</strong> The full name of the regulation.</li>
                                        <li><strong>Content:</strong> The full text or a detailed summary of the regulation requirements.</li>
                                    </ul>
                                </li>
                                <li>Optionally, provide:
                                    <ul className="list-disc ml-5 mt-1 space-y-1">
                                        <li><strong>Jurisdiction:</strong> The region or country where it applies (e.g., "EU", "USA").</li>
                                        <li><strong>Effective Date:</strong> When the regulation comes into force.</li>
                                        <li><strong>Source URL:</strong> A link to the official documentation.</li>
                                    </ul>
                                </li>
                                <li>Click <strong>"Add Regulation"</strong> to save.</li>
                            </ol>
                            <div className="bg-blue-50 p-3 rounded border border-blue-200 text-sm">
                                <strong>Note:</strong> Newly added regulations are immediately indexed and available for search and AI analysis.
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* AI Assistant */}
            <div id="ai-assistant">
                <h2 className="text-2xl font-bold mb-4">6. {t('ai_assistant')}</h2>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageCircle className="h-5 w-5 text-indigo-600" />
                            {t('chat_with_expert')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <h4 className="font-semibold mb-2">How to Use the AI Assistant</h4>
                            <ol className="list-decimal ml-5 space-y-2 text-sm text-gray-600">
                                <li>Click the <MessageCircle className="inline h-4 w-4 text-blue-600" /> chat bubble in the bottom-right corner of any page</li>
                                <li>Type your question in natural language (e.g., "What is the VAT rate for UK?")</li>
                                <li>Press Enter or click Send</li>
                                <li>The AI will search the regulations database and provide an answer with source citations</li>
                            </ol>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-2">Example Questions</h4>
                            <div className="grid grid-cols-1 gap-2 text-sm">
                                <div className="bg-blue-50 p-2 rounded border border-blue-200">
                                    "What are the IFRS 16 lease accounting requirements?"
                                </div>
                                <div className="bg-blue-50 p-2 rounded border border-blue-200">
                                    "Explain GDPR data retention policies"
                                </div>
                                <div className="bg-blue-50 p-2 rounded border border-blue-200">
                                    "What is the corporate tax rate in Germany?"
                                </div>
                                <div className="bg-blue-50 p-2 rounded border border-blue-200">
                                    "How do I calculate VAT for SaaS services?"
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-2">Understanding AI Responses</h4>
                            <ul className="list-disc ml-5 text-sm text-gray-600 space-y-1">
                                <li><strong>Markdown Formatting:</strong> Responses use headings, lists, and bold text for readability</li>
                                <li><strong>Source Citations:</strong> Look for regulation codes (e.g., [IFRS 9]) at the bottom of responses</li>
                                <li><strong>Context Awareness:</strong> The AI remembers your conversation for follow-up questions</li>
                                <li><strong>Limitations:</strong> If the answer isn't in the database, the AI will tell you it doesn't know</li>
                            </ul>
                        </div>

                        <div className="bg-purple-50 border border-purple-200 p-4 rounded">
                            <h4 className="font-semibold text-purple-900 mb-2">🤖 AI Technology</h4>
                            <p className="text-sm text-purple-900">
                                If an OpenAI API key is configured, the assistant uses GPT-3.5 for natural language responses. Otherwise, it falls back to a template-based system. Either way, answers are always based on your regulations database.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* User Management */}
            <div id="users">
                <h2 className="text-2xl font-bold mb-4">7. {t('user_management')} ({t('admin_only')})</h2>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-orange-600" />
                            {t('managing_team_members')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-gray-600">
                            Admins and Superadmins can manage users from the Users page.
                        </p>

                        <div>
                            <h4 className="font-semibold mb-2">Adding New Users</h4>
                            <ol className="list-decimal ml-5 text-sm text-gray-600 space-y-1">
                                <li>Click "Create User" button</li>
                                <li>Enter email, full name, and password</li>
                                <li>Select role (Accountant, Auditor, or Admin)</li>
                                <li>Assign to a company (Admins see only their company's users)</li>
                                <li>Click "Create" to send invitation</li>
                            </ol>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-2">Company Filtering (Superadmin)</h4>
                            <p className="text-sm text-gray-600">
                                Superadmins can use the company dropdown to filter users by organization. This is useful for managing multiple companies from one account.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tax Config */}
            <div id="tax-config">
                <h2 className="text-2xl font-bold mb-4">8. {t('tax_config')} ({t('superadmin_only')})</h2>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5 text-red-600" />
                            {t('managing_tax_rates')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-gray-600">
                            The Tax Rates page allows superadmins to view and edit tax rates used in report validation.
                        </p>

                        <div>
                            <h4 className="font-semibold mb-2">Editing Tax Rates</h4>
                            <ol className="list-decimal ml-5 text-sm text-gray-600 space-y-1">
                                <li>Select a country from the dropdown</li>
                                <li>View all tax types for that country (VAT, Corporate Tax, etc.)</li>
                                <li>Click the "Edit" button next to a rate</li>
                                <li>Update the rate value or description</li>
                                <li>Click "Save Changes"</li>
                            </ol>
                            <p className="text-sm text-gray-600 mt-2">
                                <strong>Note:</strong> Changes take effect immediately and will be used in future report validations.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tips & Tricks */}
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <CardHeader>
                    <CardTitle className="text-green-900">💡 {t('pro_tips')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-green-900">
                    <p>• <strong>Validate Early & Often:</strong> Run validation on reports before submitting to catch errors early</p>
                    <p>• <strong>Use Descriptive Titles:</strong> Name reports clearly (e.g., "Q4 2024 VAT Return - UK") for easy searching</p>
                    <p>• <strong>Check Dashboard Daily:</strong> Stay on top of action items and compliance trends</p>
                    <p>• <strong>Leverage AI Assistant:</strong> Ask questions instead of manually searching regulations</p>
                    <p>• <strong>Export Regularly:</strong> Download reports as Excel for backup and offline analysis</p>
                    <p>• <strong>Review Tax Rates:</strong> Periodically check that tax rates are up-to-date for your regions</p>
                    <p>• <strong>Monitor Compliance Score:</strong> Aim to keep your score above 90% for optimal compliance</p>
                    <p>• <strong>Use Templates:</strong> Create standardized report templates to ensure consistency</p>
                </CardContent>
            </Card>

            {/* Troubleshooting */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-orange-600" />
                        {t('troubleshooting')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    <div>
                        <strong>Q: My file upload failed</strong>
                        <p className="text-gray-600">A: Check that your file is under 10MB and in a supported format (Excel, PDF, Word, CSV, TXT)</p>
                    </div>
                    <div>
                        <strong>Q: Validation shows errors but my calculations are correct</strong>
                        <p className="text-gray-600">A: The AI looks for "Total" keywords in the first column. Ensure your total rows are clearly labeled and sum the correct range of cells above them.</p>
                    </div>
                    <div>
                        <strong>Q: I can't see other users' reports</strong>
                        <p className="text-gray-600">A: This is by design. Accountants/Auditors only see their own reports. Admins see all reports in their company.</p>
                    </div>
                    <div>
                        <strong>Q: The AI Assistant says "I don't know"</strong>
                        <p className="text-gray-600">A: The AI only answers based on regulations in your database. Try rephrasing your question or ask your admin to add more regulations.</p>
                    </div>
                </CardContent>
            </Card>

            {/* Uzbekistan Detailed Instructions */}
            <div id="uzbekistan-instructions">
                <h2 className="text-2xl font-bold mb-4">11. 🇺🇿 Uzbekistan Accounting & Audit Instructions</h2>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-blue-600" />
                            Detailed Step-by-Step Guides / Подробные Пошаговые Инструкции
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* For Accountants */}
                        <div className="border-l-4 border-blue-500 pl-4">
                            <h3 className="text-lg font-semibold mb-2">📊 For Accountants / Для Бухгалтеров</h3>
                            <p className="text-gray-600 mb-3">
                                Complete guide on preparing financial reports in Uzbekistan according to NAS (National Accounting Standards).
                            </p>
                            <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                                <p className="font-medium text-blue-900">Regulation Code: <code className="bg-blue-100 px-2 py-1 rounded">UZ-ACCT-GUIDE</code></p>
                                <p className="text-sm text-blue-800">Find this in: <strong>Regulations Page → Filter by "Uzbekistan"</strong></p>
                            </div>

                            <div className="mt-4 space-y-2">
                                <h4 className="font-semibold text-gray-900">📋 What's Included:</h4>
                                <ul className="list-disc ml-5 space-y-1 text-gray-700">
                                    <li><strong>Section 1:</strong> Preparation (Accounting policy, Inventory procedures)</li>
                                    <li><strong>Section 2:</strong> Balance Sheet - Step-by-step for EVERY line with formulas and examples</li>
                                    <li><strong>Section 3:</strong> Profit & Loss Statement - Revenue, expenses, tax calculations</li>
                                    <li><strong>Section 4:</strong> Cash Flow Statement - Operating, investing, financing activities</li>
                                    <li><strong>Section 5:</strong> Control Checks - 20+ point checklist before submission</li>
                                    <li><strong>Section 6:</strong> Submission Deadlines - Quarterly and annual reporting</li>
                                    <li><strong>Section 7:</strong> Common Errors - How to fix typical mistakes</li>
                                    <li><strong>Appendices:</strong> Sample filled balance sheet and all forms</li>
                                </ul>
                            </div>

                            <div className="mt-4 bg-emerald-50 border border-emerald-200 p-3 rounded">
                                <p className="text-sm text-emerald-800">
                                    <strong>Example from guide:</strong> "Line 010 'Fixed Assets': Formula = Account 01 - Account 02.
                                    Example: 50,000,000 sum - 15,000,000 sum = 35,000,000 sum ✓"
                                </p>
                            </div>
                        </div>

                        {/* For Auditors */}
                        <div className="border-l-4 border-emerald-500 pl-4">
                            <h3 className="text-lg font-semibold mb-2">🔍 For Auditors / Для Аудиторов</h3>
                            <p className="text-gray-600 mb-3">
                                Complete audit procedures guide according to ISA (International Standards on Auditing) and Uzbekistan Law on Audit Activity.
                            </p>
                            <div className="bg-emerald-50 p-4 rounded-lg space-y-2">
                                <p className="font-medium text-emerald-900">Regulation Code: <code className="bg-emerald-100 px-2 py-1 rounded">UZ-AUDIT-GUIDE</code></p>
                                <p className="text-sm text-emerald-800">Find this in: <strong>Regulations Page → Filter by "Uzbekistan"</strong></p>
                            </div>

                            <div className="mt-4 space-y-2">
                                <h4 className="font-semibold text-gray-900">📋 What's Included:</h4>
                                <ul className="list-disc ml-5 space-y-1 text-gray-700">
                                    <li><strong>Section 1:</strong> Audit Preparation - Client assessment, independence, contract, planning (ISA 300)</li>
                                    <li><strong>Section 2:</strong> Conducting Audit - Control testing, substantive procedures, confirmations</li>
                                    <li><strong>Section 3:</strong> Audit Completion - Misstatement evaluation, management letters, opinion formation</li>
                                    <li><strong>Section 4:</strong> Audit Report - Complete ISA 700 structure with sample report</li>
                                    <li><strong>Section 5:</strong> Auditor Checklist - Documentation, procedures, report, communication</li>
                                    <li><strong>Appendices:</strong> Balance sheet audit checklist, sample working papers</li>
                                </ul>
                            </div>

                            <div className="mt-4 bg-blue-50 border border-blue-200 p-3 rounded">
                                <p className="text-sm text-blue-800">
                                    <strong>Example from guide:</strong> "Materiality Calculation: Revenue 500M × 1% = 5M, Assets 200M × 2% = 4M,
                                    Profit 30M × 5% = 1.5M → Use lowest: 1.5M sum"
                                </p>
                            </div>
                        </div>

                        {/* Quick Access */}
                        <div className="bg-gradient-to-r from-blue-50 to-emerald-50 p-4 rounded-lg border border-blue-200">
                            <h4 className="font-semibold text-gray-900 mb-3">🚀 Quick Access / Быстрый Доступ</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="bg-white p-3 rounded shadow-sm">
                                    <p className="font-medium text-blue-900 mb-1">📊 Accounting Instructions</p>
                                    <p className="text-xs text-gray-600 mb-2">100+ pages of detailed guidance</p>
                                    <code className="text-xs bg-gray-100 px-2 py-1 rounded block">
                                        Regulations → Search: "UZ-ACCT-GUIDE"
                                    </code>
                                </div>
                                <div className="bg-white p-3 rounded shadow-sm">
                                    <p className="font-medium text-emerald-900 mb-1">🔍 Audit Procedures</p>
                                    <p className="text-xs text-gray-600 mb-2">100+ pages of audit guidance</p>
                                    <code className="text-xs bg-gray-100 px-2 py-1 rounded block">
                                        Regulations → Search: "UZ-AUDIT-GUIDE"
                                    </code>
                                </div>
                            </div>
                        </div>

                        {/* Visual Examples */}
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-3">📸 Visual Examples / Визуальные Примеры</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="border border-gray-200 rounded-lg p-3">
                                    <p className="text-sm font-medium text-gray-700 mb-2">✓ Sample Balance Sheet</p>
                                    <p className="text-xs text-gray-500">Professional format with all sections</p>
                                </div>
                                <div className="border border-gray-200 rounded-lg p-3">
                                    <p className="text-sm font-medium text-gray-700 mb-2">✓ Audit Checklist</p>
                                    <p className="text-xs text-gray-500">Complete verification procedures</p>
                                </div>
                            </div>
                        </div>

                        {/* Additional Resources */}
                        <div className="bg-amber-50 border border-amber-200 p-4 rounded">
                            <h4 className="font-semibold text-amber-900 mb-2">📚 Additional Uzbekistan Regulations</h4>
                            <div className="space-y-1 text-sm text-amber-800">
                                <p>• <strong>UZ-NAS-1:</strong> Accounting Policies and Financial Reporting</p>
                                <p>• <strong>UZ-NAS-21:</strong> Chart of Accounts</p>
                                <p>• <strong>UZ-IFRS-TRANS:</strong> IFRS Transition Requirements</p>
                                <p>• <strong>UZ-AUDIT-LAW:</strong> Law on Audit Activity (No. ЗРУ-677)</p>
                                <p>• <strong>UZ-AUDITOR-QUAL:</strong> Auditor Qualification Requirements</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Support Section - Updated */}
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageCircle className="h-5 w-5 text-purple-600" />
                        Need More Help?
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-600 mb-4">
                        If you have questions or need assistance, our support team is here to help.
                    </p>
                    <div className="flex gap-3">
                        <Button
                            onClick={() => setShowContactModal(true)}
                            className="bg-purple-600 hover:bg-purple-700 gap-2"
                        >
                            <Mail className="h-4 w-4" />
                            Contact Support
                        </Button>
                        <Button
                            onClick={() => setShowFAQModal(true)}
                            variant="outline"
                            className="border-purple-600 text-purple-600 hover:bg-purple-50 gap-2"
                        >
                            <HelpCircle className="h-4 w-4" />
                            View FAQ
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Contact Support Modal */}
            <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-2xl">
                            <Mail className="h-6 w-6 text-purple-600" />
                            Contact Support
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <h4 className="font-semibold text-blue-900 mb-2">📞 Other Ways to Reach Us:</h4>
                            <div className="space-y-2 text-sm text-blue-800">
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    <span>Email: support@regai.uz</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4" />
                                    <span>Phone: +998 93 517-91-46</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MessageCircle className="h-4 w-4" />
                                    <span>Telegram: @regai_support</span>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleContactSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Your Name *</label>
                                <Input
                                    required
                                    value={contactForm.name}
                                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                                    placeholder="Enter your full name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Email Address *</label>
                                <Input
                                    required
                                    type="email"
                                    value={contactForm.email}
                                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                                    placeholder="your.email@company.uz"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Subject *</label>
                                <Input
                                    required
                                    value={contactForm.subject}
                                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                                    placeholder="Brief description of your issue"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Message *</label>
                                <textarea
                                    required
                                    value={contactForm.message}
                                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                                    placeholder="Please describe your question or issue in detail..."
                                    className="w-full min-h-[120px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button type="submit" className="bg-purple-600 hover:bg-purple-700 gap-2">
                                    <Send className="h-4 w-4" />
                                    Send Message
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowContactModal(false)}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </div>
                </DialogContent>
            </Dialog>

            {/* FAQ Modal */}
            <Dialog open={showFAQModal} onOpenChange={setShowFAQModal}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-2xl">
                            <HelpCircle className="h-6 w-6 text-purple-600" />
                            Frequently Asked Questions
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {faqItems.map((faq, index) => (
                            <div key={index} className="border-l-4 border-purple-500 pl-4 py-2">
                                <h4 className="font-semibold text-gray-900 mb-2 flex items-start gap-2">
                                    <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-sm font-bold">
                                        {index + 1}
                                    </span>
                                    {faq.question}
                                </h4>
                                <p className="text-gray-600 text-sm ml-8">{faq.answer}</p>
                            </div>
                        ))}

                        <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                            <p className="text-sm text-gray-700">
                                <strong>Still have questions?</strong> Click "Contact Support" to send us a message,
                                or email us directly at <a href="mailto:support@regai.uz" className="text-purple-600 hover:underline">support@regai.uz</a>
                            </p>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button
                                variant="outline"
                                onClick={() => setShowFAQModal(false)}
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
