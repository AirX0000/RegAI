import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PERMISSIONS } from '../lib/permissions';

import LanguageSwitcher from './LanguageSwitcher';
import ProfileModal from './ProfileModal';

export function Topbar() {
    const { user, logout } = useAuth();
    const { t } = useTranslation();
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const toggleDropdown = (menu: string) => {
        setOpenDropdown(openDropdown === menu ? null : menu);
    };

    return (
        <header className="border-b bg-white shadow-sm">
            <div className="container flex h-16 items-center justify-between px-4">
                <div className="flex items-center gap-6">
                    <Link to="/" className="text-xl font-bold text-blue-600">RegAI</Link>
                    <nav className="flex items-center gap-1 text-sm font-medium">
                        {/* Dashboard - Always visible */}
                        <Link
                            to="/"
                            className="px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
                        >
                            {t('nav_dashboard')}
                        </Link>

                        {/* Compliance Group */}
                        <div className="relative">
                            <button
                                onClick={() => toggleDropdown('compliance')}
                                className="flex items-center gap-1 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
                            >
                                {t('nav_compliance')}
                                <ChevronDown className="h-4 w-4" />
                            </button>
                            {openDropdown === 'compliance' && (
                                <div className="absolute top-full left-0 mt-1 w-48 bg-white border rounded-md shadow-lg z-50">
                                    <Link
                                        to="/regulations"
                                        className="block px-4 py-2 hover:bg-gray-100"
                                        onClick={() => setOpenDropdown(null)}
                                    >
                                        {t('nav_regulations')}
                                    </Link>
                                    <Link
                                        to="/compliance"
                                        className="block px-4 py-2 hover:bg-gray-100"
                                        onClick={() => setOpenDropdown(null)}
                                    >
                                        {t('nav_compliance_checks')}
                                    </Link>
                                    <Link
                                        to="/tax-analysis"
                                        className="block px-4 py-2 hover:bg-gray-100"
                                        onClick={() => setOpenDropdown(null)}
                                    >
                                        {t('nav_tax_analysis')}
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Reports & Data Group - Dropdown if canManageCompanies, else direct link */}
                        {PERMISSIONS.canManageCompanies(user?.role) ? (
                            <div className="relative">
                                <button
                                    onClick={() => toggleDropdown('reports')}
                                    className="flex items-center gap-1 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
                                >
                                    {t('nav_reports_data')}
                                    <ChevronDown className="h-4 w-4" />
                                </button>
                                {openDropdown === 'reports' && (
                                    <div className="absolute top-full left-0 mt-1 w-48 bg-white border rounded-md shadow-lg z-50">
                                        <Link
                                            to="/reports"
                                            className="block px-4 py-2 hover:bg-gray-100"
                                            onClick={() => setOpenDropdown(null)}
                                        >
                                            {t('nav_reports')}
                                        </Link>
                                        <Link
                                            to="/companies"
                                            className="block px-4 py-2 hover:bg-gray-100"
                                            onClick={() => setOpenDropdown(null)}
                                        >
                                            {t('nav_companies')}
                                        </Link>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link
                                to="/reports"
                                className="px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
                            >
                                {t('nav_reports')}
                            </Link>
                        )}

                        {/* Tax Configuration - Restricted */}
                        {PERMISSIONS.canConfigureTax(user?.role) && (
                            <Link
                                to="/tax-config"
                                className="px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
                            >
                                {t('nav_tax_rates')}
                            </Link>
                        )}

                        {/* Transformation Department - Restricted */}
                        {PERMISSIONS.canViewTransformation(user?.role) && (
                            <Link
                                to="/transformation"
                                className="px-3 py-2 rounded-md hover:bg-gray-100 transition-colors text-blue-600 font-medium"
                            >
                                {t('nav_transformation')}
                            </Link>
                        )}

                        {/* Direct Audit Log link for Auditor */}
                        {user?.role === 'auditor' && (
                            <Link
                                to="/audit-log"
                                className="px-3 py-2 rounded-md hover:bg-gray-100 transition-colors text-purple-600 font-medium"
                            >
                                {t('nav_audit_log')}
                            </Link>
                        )}

                        {/* Admin Group - Only for users who can access admin menu */}
                        {PERMISSIONS.canAccessAdminMenu(user?.role) && (
                            <div className="relative">
                                <button
                                    onClick={() => toggleDropdown('admin')}
                                    className="flex items-center gap-1 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors text-purple-600"
                                >
                                    {t('nav_administration')}
                                    <ChevronDown className="h-4 w-4" />
                                </button>
                                {openDropdown === 'admin' && (
                                    <div className="absolute top-full left-0 mt-1 w-48 bg-white border rounded-md shadow-lg z-50">
                                        {PERMISSIONS.canManageUsers(user?.role) && (
                                            <Link
                                                to="/users"
                                                className="block px-4 py-2 hover:bg-gray-100"
                                                onClick={() => setOpenDropdown(null)}
                                            >
                                                {t('nav_users')}
                                            </Link>
                                        )}
                                        {PERMISSIONS.canViewHierarchy(user?.role) && (
                                            <Link
                                                to="/hierarchy"
                                                className="block px-4 py-2 hover:bg-gray-100"
                                                onClick={() => setOpenDropdown(null)}
                                            >
                                                {t('nav_hierarchy')}
                                            </Link>
                                        )}
                                        {PERMISSIONS.canManageCompanySettings(user?.role) && (
                                            <Link
                                                to="/company-settings"
                                                className="block px-4 py-2 hover:bg-gray-100"
                                                onClick={() => setOpenDropdown(null)}
                                            >
                                                {t('nav_company_settings')}
                                            </Link>
                                        )}
                                        {PERMISSIONS.canViewAuditLogs(user?.role) && (
                                            <Link
                                                to="/audit-log"
                                                className="block px-4 py-2 hover:bg-gray-100"
                                                onClick={() => setOpenDropdown(null)}
                                            >
                                                {t('nav_audit_log')}
                                            </Link>
                                        )}
                                        {PERMISSIONS.canManageTenants(user?.role) && (
                                            <>
                                                <div className="border-t my-1"></div>
                                                <Link
                                                    to="/tenants"
                                                    className="block px-4 py-2 hover:bg-gray-100 text-purple-600 font-medium"
                                                    onClick={() => setOpenDropdown(null)}
                                                >
                                                    {t('nav_tenants')}
                                                </Link>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Help & Examples Group */}
                        <div className="relative">
                            <button
                                onClick={() => toggleDropdown('help')}
                                className="flex items-center gap-1 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
                            >
                                {t('nav_help_examples')}
                                <ChevronDown className="h-4 w-4" />
                            </button>
                            {openDropdown === 'help' && (
                                <div className="absolute top-full left-0 mt-1 w-48 bg-white border rounded-md shadow-lg z-50">
                                    <Link
                                        to="/guide"
                                        className="block px-4 py-2 hover:bg-gray-100 text-blue-600 font-medium"
                                        onClick={() => setOpenDropdown(null)}
                                    >
                                        📖 {t('nav_documentation')}
                                    </Link>
                                    <Link
                                        to="/examples"
                                        className="block px-4 py-2 hover:bg-gray-100"
                                        onClick={() => setOpenDropdown(null)}
                                    >
                                        {t('nav_examples')}
                                    </Link>
                                    <Link
                                        to="/help"
                                        className="block px-4 py-2 hover:bg-gray-100"
                                        onClick={() => setOpenDropdown(null)}
                                    >
                                        {t('nav_help')}
                                    </Link>
                                </div>
                            )}
                        </div>
                    </nav>
                </div>
                <div className="flex items-center gap-3">
                    <LanguageSwitcher />
                    <button
                        type="button"
                        onClick={() => setIsProfileOpen(true)}
                        className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-slate-100/80 active:bg-slate-200/70 cursor-pointer transition-all text-left group border border-transparent hover:border-slate-200"
                        title={t('profile_tooltip', 'Управление профилем и смена пароля')}
                    >
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs uppercase group-hover:scale-105 transition-transform shadow-inner">
                            {user?.full_name ? user.full_name.charAt(0) : user?.email?.charAt(0) || 'U'}
                        </div>
                        <div className="text-sm hidden sm:block">
                            <div className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors leading-tight">
                                {user?.full_name || user?.email}
                            </div>
                            <div className="text-[11px] text-slate-500 capitalize leading-tight">
                                {t(`role_${user?.role}` as any, { defaultValue: user?.role || '' })}
                            </div>
                        </div>
                    </button>
                    <button
                        onClick={logout}
                        className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                    >
                        {t('logout')}
                    </button>
                </div>
            </div>
            <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
        </header>
    );
}
