/**
 * Central Role-Based Access Control (RBAC) Permissions Configuration
 *
 * Roles hierarchy and scope:
 * - superadmin: Platform Superadmin (all tenants, all features)
 * - admin: Company Administrator (users, hierarchy, company settings, reports, audit logs)
 * - company_owner: Executive / Owner (company settings, users, audit logs, reports)
 * - accountant: Financial Ledger / Senior Accountant (balance sheets, 1C sync, transformation, tax config, reports)
 * - auditor: Compliance & Audit Reviewer (audit logs, compliance checks, reports, transformation review)
 * - user: Financial Analyst / Viewer (compliance, regulations, reports, guides)
 */

export type UserRole = 'superadmin' | 'admin' | 'company_owner' | 'accountant' | 'auditor' | 'user';

export function hasRole(userRole: string | undefined, allowedRoles: string[]): boolean {
    if (!userRole) return false;
    // Superadmin has universal access across all modules
    if (userRole === 'superadmin') return true;
    return allowedRoles.includes(userRole);
}

export const PERMISSIONS = {
    // 1. Core General Access (all authenticated users)
    canViewDashboard: (_role?: string) => true,
    canViewRegulations: (_role?: string) => true,
    canViewCompliance: (_role?: string) => true,
    canViewTaxAnalysis: (_role?: string) => true,
    canViewReports: (_role?: string) => true,
    canViewHelpAndGuides: (_role?: string) => true,

    // 2. Report Creation
    canCreateReports: (role?: string) => role !== 'auditor',

    // 3. Multi-Company Management
    canManageCompanies: (role?: string) => hasRole(role, ['superadmin', 'admin', 'company_owner']),

    // 4. Tax Configuration & Rates
    canConfigureTax: (role?: string) => hasRole(role, ['superadmin', 'admin', 'company_owner', 'accountant']),

    // 5. Transformation Department
    canViewTransformation: (role?: string) => hasRole(role, ['superadmin', 'admin', 'company_owner', 'accountant', 'auditor']),
    canEditTransformation: (role?: string) => hasRole(role, ['superadmin', 'admin', 'company_owner', 'accountant']),
    canUploadBalanceSheet: (role?: string) => hasRole(role, ['superadmin', 'admin', 'company_owner', 'accountant']),

    // 6. Administration & Governance
    canAccessAdminMenu: (role?: string) => hasRole(role, ['superadmin', 'admin', 'company_owner']),
    canManageUsers: (role?: string) => hasRole(role, ['superadmin', 'admin', 'company_owner']),
    canViewHierarchy: (role?: string) => hasRole(role, ['superadmin', 'admin', 'company_owner']),
    canManageCompanySettings: (role?: string) => hasRole(role, ['superadmin', 'admin', 'company_owner']),
    canViewAuditLogs: (role?: string) => hasRole(role, ['superadmin', 'admin', 'company_owner', 'auditor']),
    canManageTenants: (role?: string) => role === 'superadmin',
};
