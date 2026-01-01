import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Guard } from './components/Guard';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import RegulationsPage from './pages/RegulationsPage';
import CompaniesManagementPage from './pages/CompaniesManagementPage';
import UsersPage from './pages/UsersPage';
import CompliancePage from './pages/CompliancePage';
import TenantsPage from './pages/TenantsPage';
import ReportsPage from './pages/ReportsPage';
import TaxConfigPage from './pages/TaxConfigPage';
import ReportAnalysisPage from './pages/ReportAnalysisPage';
import HelpPage from './pages/HelpPage';
import CompanySettingsPage from './pages/CompanySettingsPage';
import AuditLogPage from './pages/AuditLogPage';
import HierarchyTreePage from './pages/HierarchyTreePage';
import TransformationDashboard from './pages/TransformationDashboard';
import BalanceSheetForm from './pages/BalanceSheetForm';
import TransformationResults from './pages/TransformationResults';
import TransformationAdjustmentsPage from './pages/TransformationAdjustmentsPage';
import UploadResults from './pages/UploadResults';
import ExamplesPage from './pages/ExamplesPage';
import DocumentsPage from './pages/DocumentsPage';
import GuidePage from './pages/GuidePage';

export const router = createBrowserRouter([
    {
        path: '/login',
        element: <LoginPage />,
    },
    {
        path: '/',
        element: <Layout />,
        children: [
            {
                element: <Guard />,
                children: [
                    { path: '/', element: <DashboardPage /> },
                    { path: '/regulations', element: <RegulationsPage /> },
                    { path: '/companies', element: <CompaniesManagementPage /> },
                    { path: '/compliance', element: <CompliancePage /> },
                    { path: '/reports', element: <ReportsPage /> },
                    { path: '/reports/new', element: <ReportsPage /> },
                    { path: '/tax-config', element: <TaxConfigPage /> },
                    {
                        path: '/ai-analysis',
                        element: <ReportAnalysisPage />,
                    },
                    {
                        path: '/companies-management',
                        element: <CompaniesManagementPage />,
                    },
                    { path: '/tax-analysis', element: <ReportAnalysisPage /> },
                    { path: '/help', element: <HelpPage /> },
                    { path: '/guide', element: <GuidePage /> },
                    { path: '/examples', element: <ExamplesPage /> },
                    { path: '/transformation', element: <TransformationDashboard /> },
                    { path: '/transformation/new', element: <BalanceSheetForm /> },
                    { path: '/transformation/edit/:id', element: <BalanceSheetForm /> },
                    { path: '/transformation/adjustments/:id', element: <TransformationAdjustmentsPage /> },
                    { path: '/transformation/results/:id', element: <TransformationResults /> },
                    { path: '/upload', element: <UploadResults /> },
                    { path: '/documents', element: <DocumentsPage /> },
                ],
            },
            {
                element: <Guard roles={['superadmin', 'admin']} />,
                children: [
                    { path: '/users', element: <UsersPage /> },
                    { path: '/company-settings', element: <CompanySettingsPage /> },
                    { path: '/audit-log', element: <AuditLogPage /> },
                    { path: '/hierarchy', element: <HierarchyTreePage /> },
                ],
            },
            {
                element: <Guard roles={['superadmin']} />,
                children: [
                    { path: '/tenants', element: <TenantsPage /> },
                ],
            },
        ],
    },
]);
