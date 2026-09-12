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
            // 1. General Access: Available to all authenticated users
            {
                element: <Guard />,
                children: [
                    { path: '/', element: <DashboardPage /> },
                    { path: '/regulations', element: <RegulationsPage /> },
                    { path: '/compliance', element: <CompliancePage /> },
                    { path: '/reports', element: <ReportsPage /> },
                    { path: '/reports/new', element: <ReportsPage /> },
                    { path: '/ai-analysis', element: <ReportAnalysisPage /> },
                    { path: '/tax-analysis', element: <ReportAnalysisPage /> },
                    { path: '/help', element: <HelpPage /> },
                    { path: '/guide', element: <GuidePage /> },
                    { path: '/examples', element: <ExamplesPage /> },
                    { path: '/documents', element: <DocumentsPage /> },
                ],
            },
            // 2. Tax Configuration (superadmin, admin, owner, accountant)
            {
                element: <Guard roles={['superadmin', 'admin', 'company_owner', 'accountant']} />,
                children: [
                    { path: '/tax-config', element: <TaxConfigPage /> },
                ],
            },
            // 3. Companies Management (superadmin, admin, owner)
            {
                element: <Guard roles={['superadmin', 'admin', 'company_owner']} />,
                children: [
                    { path: '/companies', element: <CompaniesManagementPage /> },
                    { path: '/companies-management', element: <CompaniesManagementPage /> },
                ],
            },
            // 4. Transformation Department (superadmin, admin, owner, accountant, auditor)
            {
                element: <Guard roles={['superadmin', 'admin', 'company_owner', 'accountant', 'auditor']} />,
                children: [
                    { path: '/transformation', element: <TransformationDashboard /> },
                    { path: '/transformation/adjustments/:id', element: <TransformationAdjustmentsPage /> },
                    { path: '/transformation/results/:id', element: <TransformationResults /> },
                ],
            },
            // 5. Transformation Creation & Upload (superadmin, admin, owner, accountant)
            {
                element: <Guard roles={['superadmin', 'admin', 'company_owner', 'accountant']} />,
                children: [
                    { path: '/transformation/new', element: <BalanceSheetForm /> },
                    { path: '/transformation/edit/:id', element: <BalanceSheetForm /> },
                    { path: '/upload', element: <UploadResults /> },
                ],
            },
            // 6. Audit Log (superadmin, admin, owner, auditor)
            {
                element: <Guard roles={['superadmin', 'admin', 'company_owner', 'auditor']} />,
                children: [
                    { path: '/audit-log', element: <AuditLogPage /> },
                ],
            },
            // 7. Company Administration (superadmin, admin, owner)
            {
                element: <Guard roles={['superadmin', 'admin', 'company_owner']} />,
                children: [
                    { path: '/users', element: <UsersPage /> },
                    { path: '/company-settings', element: <CompanySettingsPage /> },
                    { path: '/hierarchy', element: <HierarchyTreePage /> },
                ],
            },
            // 8. Platform Administration (superadmin only)
            {
                element: <Guard roles={['superadmin']} />,
                children: [
                    { path: '/tenants', element: <TenantsPage /> },
                ],
            },
        ],
    },
]);
