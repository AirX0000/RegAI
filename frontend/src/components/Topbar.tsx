import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import LanguageSwitcher from './LanguageSwitcher';

export function Topbar() {
    const { user, logout } = useAuth();
    const { t } = useTranslation();
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

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

                        {/* Reports & Data Group */}
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

                        {/* Tax Configuration */}
                        <Link
                            to="/tax-config"
                            className="px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
                        >
                            {t('nav_tax_rates')}
                        </Link>

                        {/* Transformation Department */}
                        <Link
                            to="/transformation"
                            className="px-3 py-2 rounded-md hover:bg-gray-100 transition-colors text-blue-600 font-medium"
                        >
                            Transformation
                        </Link>

                        {/* Admin Group - Only for admin/superadmin */}
                        {['superadmin', 'admin'].includes(user?.role || '') && (
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
                                        <Link
                                            to="/users"
                                            className="block px-4 py-2 hover:bg-gray-100"
                                            onClick={() => setOpenDropdown(null)}
                                        >
                                            {t('nav_users')}
                                        </Link>
                                        <Link
                                            to="/hierarchy"
                                            className="block px-4 py-2 hover:bg-gray-100"
                                            onClick={() => setOpenDropdown(null)}
                                        >
                                            {t('nav_hierarchy')}
                                        </Link>
                                        <Link
                                            to="/company-settings"
                                            className="block px-4 py-2 hover:bg-gray-100"
                                            onClick={() => setOpenDropdown(null)}
                                        >
                                            {t('nav_company_settings')}
                                        </Link>
                                        {user?.role === 'superadmin' && (
                                            <>
                                                <div className="border-t my-1"></div>
                                                <Link
                                                    to="/tenants"
                                                    className="block px-4 py-2 hover:bg-gray-100 text-purple-600 font-medium"
                                                    onClick={() => setOpenDropdown(null)}
                                                >
                                                    {t('nav_tenants')}
                                                </Link>
                                                <Link
                                                    to="/audit-log"
                                                    className="block px-4 py-2 hover:bg-gray-100"
                                                    onClick={() => setOpenDropdown(null)}
                                                >
                                                    {t('nav_audit_log')}
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
                                        📖 Documentation
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
                <div className="flex items-center gap-4">
                    <LanguageSwitcher />
                    <div className="text-sm">
                        <div className="font-medium">{user?.email}</div>
                        <div className="text-xs text-gray-500 capitalize">{user?.role}</div>
                    </div>
                    <button
                        onClick={logout}
                        className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                    >
                        {t('logout')}
                    </button>
                </div>
            </div>
        </header>
    );
}
