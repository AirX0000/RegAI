/**
 * Central Role-Based Access Control (RBAC) Permissions Configuration
 * Strict Principle of Least Privilege & Segregation of Duties (SoD):
 *
 * - superadmin: Platform Superadmin (all tenants, all features)
 * - company_owner: Executive / Owner (holding structure /hierarchy, company settings, read-only IFRS transformation & report approval)
 * - accountant: Chief Accountant / Ledger (balance sheets, 1C sync, IFRS transformation edit, tax rates config, report creation)
 * - admin: IT & Security Administrator (user & role management /users, company settings, security audit logs)
 * - auditor: Independent Auditor (compliance verification, read-only IFRS transformation review, report review, SHA-256 audit logs)
 * - user: Standard Viewer (dashboard, regulations, help)
 */

export type UserRole = 'superadmin' | 'admin' | 'company_owner' | 'accountant' | 'auditor' | 'user';

export function hasRole(userRole: string | undefined, allowedRoles: string[]): boolean {
    if (!userRole) return false;
    const r = userRole.toLowerCase().trim();
    // Superadmin has universal access across all modules
    if (r === 'superadmin' || r === 'website_superadmin') return true;
    return allowedRoles.includes(r);
}

export const PERMISSIONS = {
    // 1. Core General Access
    canViewDashboard: (_role?: string) => true,
    canViewRegulations: (role?: string) => hasRole(role, ['superadmin', 'company_owner', 'accountant', 'auditor', 'user']),
    canViewCompliance: (role?: string) => hasRole(role, ['superadmin', 'company_owner', 'accountant', 'auditor', 'user']),
    canViewTaxAnalysis: (role?: string) => hasRole(role, ['superadmin', 'company_owner', 'accountant', 'auditor']),
    canViewReports: (_role?: string) => true,
    canViewHelpAndGuides: (_role?: string) => true,

    // 2. Reports Segregation of Duties (Accountant creates; Owner/Auditor reviews; Auditor cannot delete)
    canCreateReports: (role?: string) => hasRole(role, ['superadmin', 'accountant']),
    canReviewReports: (role?: string) => hasRole(role, ['superadmin', 'company_owner', 'auditor']),
    canDeleteReports: (role?: string) => hasRole(role, ['superadmin', 'admin', 'accountant']),

    // 3. Multi-Company Management (Platform Superadmin only)
    canManageCompanies: (role?: string) => role === 'superadmin' || role === 'website_superadmin',

    // 4. Tax Configuration & Rates (Strictly Chief Accountant & Superadmin)
    canConfigureTax: (role?: string) => hasRole(role, ['superadmin', 'accountant']),

    // 5. Transformation Department (Accountant edits/uploads; Owner & Auditor have read-only oversight; IT Admin excluded)
    canViewTransformation: (role?: string) => hasRole(role, ['superadmin', 'company_owner', 'accountant', 'auditor']),
    canEditTransformation: (role?: string) => hasRole(role, ['superadmin', 'accountant']),
    canUploadBalanceSheet: (role?: string) => hasRole(role, ['superadmin', 'accountant']),

    // 6. Executive Governance vs IT Administration
    canAccessOwnerMenu: (role?: string) => (role || '').toLowerCase() === 'company_owner',
    canAccessAdminMenu: (role?: string) => hasRole(role, ['superadmin', 'admin']),
    canManageUsers: (role?: string) => hasRole(role, ['superadmin', 'admin']),
    canViewHierarchy: (role?: string) => hasRole(role, ['superadmin', 'company_owner']),
    canManageCompanySettings: (role?: string) => hasRole(role, ['superadmin', 'company_owner', 'admin']),
    canViewAuditLogs: (role?: string) => hasRole(role, ['superadmin', 'admin', 'auditor']),
    canManageTenants: (role?: string) => role === 'superadmin' || role === 'website_superadmin',

    // Direct role-specific shortcuts
    isOwner: (role?: string) => (role || '').toLowerCase() === 'company_owner',
    isAdmin: (role?: string) => (role || '').toLowerCase() === 'admin',
    isAuditor: (role?: string) => (role || '').toLowerCase() === 'auditor',
    isAccountant: (role?: string) => (role || '').toLowerCase() === 'accountant',
    isSuperAdmin: (role?: string) => (role || '').toLowerCase() === 'superadmin',
};
