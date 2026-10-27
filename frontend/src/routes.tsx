import React, { Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Guard } from './components/Guard';
import RouteErrorBoundary from './components/RouteErrorBoundary';

// ── Eagerly loaded (critical path — needed immediately on first render) ────
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';

// ── Helper to auto-retry and reload if bundle hash changed after deploy ────
function lazyRetry<T extends React.ComponentType<any>>(
    factory: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
    return React.lazy(async () => {
        try {
            return await factory();
        } catch (error: any) {
            console.error('Lazy chunk import failed, verifying version...', error);
            const isChunkLoadFailed =
                error?.name === 'ChunkLoadError' ||
                /Failed to fetch dynamically imported module/i.test(error?.message || '') ||
                /dynamically imported module/i.test(String(error || ''));

            if (isChunkLoadFailed) {
                const hasRetried = sessionStorage.getItem('regai_chunk_reloaded');
                if (!hasRetried) {
                    sessionStorage.setItem('regai_chunk_reloaded', 'true');
                    window.location.reload();
                    return new Promise(() => {});
                }
            }
            throw error;
        }
    });
}

// ── Lazy loaded (saves ~700KB on initial bundle, auto-heals on new deploys) ─
const DashboardPage               = lazyRetry(() => import('./pages/DashboardPage'));
const RegulationsPage             = lazyRetry(() => import('./pages/RegulationsPage'));
const CompaniesManagementPage     = lazyRetry(() => import('./pages/CompaniesManagementPage'));
const UsersPage                   = lazyRetry(() => import('./pages/UsersPage'));
const CompliancePage              = lazyRetry(() => import('./pages/CompliancePage'));
const TenantsPage                 = lazyRetry(() => import('./pages/TenantsPage'));
const ReportsPage                 = lazyRetry(() => import('./pages/ReportsPage'));
const TaxConfigPage               = lazyRetry(() => import('./pages/TaxConfigPage'));
const ReportAnalysisPage          = lazyRetry(() => import('./pages/ReportAnalysisPage'));
const HelpPage                    = lazyRetry(() => import('./pages/HelpPage'));
const CompanySettingsPage         = lazyRetry(() => import('./pages/CompanySettingsPage'));
const AuditLogPage                = lazyRetry(() => import('./pages/AuditLogPage'));
const HierarchyTreePage           = lazyRetry(() => import('./pages/HierarchyTreePage'));
const TransformationDashboard     = lazyRetry(() => import('./pages/TransformationDashboard'));
const BalanceSheetForm            = lazyRetry(() => import('./pages/BalanceSheetForm'));
const TransformationResults       = lazyRetry(() => import('./pages/TransformationResults'));
const TransformationAdjustmentsPage = lazyRetry(() => import('./pages/TransformationAdjustmentsPage'));
const UploadResults               = lazyRetry(() => import('./pages/UploadResults'));
const ExamplesPage                = lazyRetry(() => import('./pages/ExamplesPage'));
const DocumentsPage               = lazyRetry(() => import('./pages/DocumentsPage'));
const GuidePage                   = lazyRetry(() => import('./pages/GuidePage'));

// Minimal fallback shown while a lazy page is being fetched
const PageLoader = () => (
    <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <p className="text-sm text-muted-foreground">Загрузка...</p>
        </div>
    </div>
);

// Wrap lazy element with Suspense boundary
const lazy = (element: React.ReactNode) => (
    <Suspense fallback={<PageLoader />}>{element}</Suspense>
);

export const router = createBrowserRouter([
    {
        path: '/login',
        element: <LoginPage />,
        errorElement: <RouteErrorBoundary />,
    },
    {
        path: '/',
        element: <Layout />,
        errorElement: <RouteErrorBoundary />,
        children: [
            // 1. General Access: Available to all authenticated users
            {
                element: <Guard />,
                children: [
                    { path: '/', element: lazy(<DashboardPage />) },
                    { path: '/regulations', element: lazy(<RegulationsPage />) },
                    { path: '/compliance', element: lazy(<CompliancePage />) },
                    { path: '/reports', element: lazy(<ReportsPage />) },
                    { path: '/reports/new', element: lazy(<ReportsPage />) },
                    { path: '/ai-analysis', element: lazy(<ReportAnalysisPage />) },
                    { path: '/tax-analysis', element: lazy(<ReportAnalysisPage />) },
                    { path: '/help', element: lazy(<HelpPage />) },
                    { path: '/guide', element: lazy(<GuidePage />) },
                    { path: '/examples', element: lazy(<ExamplesPage />) },
                    { path: '/documents', element: lazy(<DocumentsPage />) },
                ],
            },
            // 2. Tax Configuration (Strictly Chief Accountant & Superadmin)
            {
                element: <Guard roles={['superadmin', 'accountant']} />,
                children: [
                    { path: '/tax-config', element: lazy(<TaxConfigPage />) },
                ],
            },
            // 3. Companies Management (Platform Superadmin only)
            {
                element: <Guard roles={['superadmin']} />,
                children: [
                    { path: '/companies', element: lazy(<CompaniesManagementPage />) },
                    { path: '/companies-management', element: lazy(<CompaniesManagementPage />) },
                ],
            },
            // 4. Transformation Department View (Superadmin, Owner, Accountant, Auditor — IT Admin excluded)
            {
                element: <Guard roles={['superadmin', 'company_owner', 'accountant', 'auditor']} />,
                children: [
                    { path: '/transformation', element: lazy(<TransformationDashboard />) },
                    { path: '/transformation/:id', element: lazy(<TransformationResults />) },
                    { path: '/transformation/adjustments/:id', element: lazy(<TransformationAdjustmentsPage />) },
                    { path: '/transformation/results/:id', element: lazy(<TransformationResults />) },
                ],
            },
            // 5. Transformation Creation & Upload (Strictly Chief Accountant & Superadmin)
            {
                element: <Guard roles={['superadmin', 'accountant']} />,
                children: [
                    { path: '/transformation/new', element: lazy(<BalanceSheetForm />) },
                    { path: '/transformation/edit/:id', element: lazy(<BalanceSheetForm />) },
                    { path: '/transformation/upload', element: lazy(<UploadResults />) },
                    { path: '/upload', element: lazy(<UploadResults />) },
                ],
            },
            // 6. Audit Log (Superadmin, IT Admin, Auditor)
            {
                element: <Guard roles={['superadmin', 'admin', 'auditor']} />,
                children: [
                    { path: '/audit-log', element: lazy(<AuditLogPage />) },
                ],
            },
            // 7. User & Role Management (Strictly IT Admin & Superadmin)
            {
                element: <Guard roles={['superadmin', 'admin']} />,
                children: [
                    { path: '/users', element: lazy(<UsersPage />) },
                ],
            },
            // 8. Holding & Group Hierarchy (Strictly Executive Owner & Superadmin)
            {
                element: <Guard roles={['superadmin', 'company_owner']} />,
                children: [
                    { path: '/hierarchy', element: lazy(<HierarchyTreePage />) },
                ],
            },
            // 9. Company Settings (Superadmin, Owner, IT Admin)
            {
                element: <Guard roles={['superadmin', 'company_owner', 'admin']} />,
                children: [
                    { path: '/company-settings', element: lazy(<CompanySettingsPage />) },
                ],
            },
            // 8. Platform Administration (superadmin only)
            {
                element: <Guard roles={['superadmin']} />,
                children: [
                    { path: '/tenants', element: lazy(<TenantsPage />) },
                ],
            },
            // 9. Catch-all: 404 Not Found
            {
                path: '*',
                element: <NotFoundPage />,
            },
        ],
    },
    // 404 for /login/* and bare unmatched paths
    {
        path: '*',
        element: <NotFoundPage />,
    },
]);
