import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { 
    ChevronDown, 
    Menu, 
    X, 
    LogOut, 
    User as UserIcon, 
    LayoutDashboard, 
    ShieldCheck, 
    FileText, 
    Building2, 
    Percent, 
    RefreshCw, 
    Settings, 
    BookOpen, 
    HelpCircle, 
    Lightbulb, 
    Users, 
    GitBranch, 
    FileCheck, 
    Building, 
    Sparkles 
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PERMISSIONS } from '../lib/permissions';

import LanguageSwitcher from './LanguageSwitcher';
import ThemeToggle from './ThemeToggle';
import ProfileModal from './ProfileModal';
import { tr } from '../lib/i18n';

export function Topbar() {
    const { user, logout } = useAuth();
    const { t, i18n } = useTranslation();
    const location = useLocation();
    
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navRef = useRef<HTMLDivElement>(null);

    void i18n.language;
    const getRoleLabel = (role?: string) => {
        if (!role) return tr('Пользователь', 'User', 'Foydalanuvchi');
        switch (role) {
            case 'superadmin':
                return tr('Администратор', 'SuperAdmin', 'SuperAdmin');
            case 'company_owner':
                return tr('Владелец компании', 'Company Owner', 'Biznes egasi');
            case 'accountant':
                return tr('Главбух (МСФО)', 'Chief Accountant', 'Bosh buxgalter (MHXS)');
            case 'admin':
                return tr('Администратор', 'Admin', 'Administrator');
            case 'auditor':
                return tr('Аудитор', 'Auditor', 'Auditor');
            case 'user':
                return tr('Финансовый аналитик', 'Financial Analyst', 'Moliyaviy tahlilchi');
            default:
                return role;
        }
    };

    const getDisplayName = () => {
        if (user?.full_name && user.full_name !== 'User') {
            if (user.full_name === 'Сардор Рахимов') return tr('Сардор Рахимов', 'Sardor Raximov', 'Sardor Raximov');
            if (user.full_name === 'Елена Васильева') return tr('Елена Васильева', 'Elena Vasilyeva', 'Elena Vasilyeva');
            if (user.full_name === 'Камилла Каримова') return tr('Камилла Каримова', 'Kamilla Karimova', 'Kamilla Karimova');
            if (user.full_name === 'Дмитрий Ким') return tr('Дмитрий Ким', 'Dmitriy Kim', 'Dmitriy Kim');
            return user.full_name;
        }
        if (user?.role === 'superadmin') return tr('Главный администратор', 'System Administrator', 'Tizim administratori');
        if (user?.email) {
            const prefix = user.email.split('@')[0];
            if (prefix === 'superadmin') return tr('Главный администратор', 'System Administrator', 'Tizim administratori');
            if (prefix === 'owner') return tr('Сардор Рахимов', 'Sardor Raximov', 'Sardor Raximov');
            if (prefix === 'accountant') return tr('Елена Васильева', 'Elena Vasilyeva', 'Elena Vasilyeva');
            if (prefix === 'admin') return tr('Камилла Каримова', 'Kamilla Karimova', 'Kamilla Karimova');
            if (prefix === 'auditor') return tr('Дмитрий Ким', 'Dmitriy Kim', 'Dmitriy Kim');
            if (prefix === 'analyst') return tr('Алишер Умаров', 'Alisher Umarov', 'Alisher Umarov');
            return prefix;
        }
        return tr('Администратор', 'Administrator', 'Administrator');
    };

    const getCompanyDisplay = () => {
        if (user?.role === 'superadmin' || user?.role === 'website_superadmin') {
            return tr('Все организации', 'All Organizations', 'Barcha tashkilotlar');
        }
        if (user?.company_name) return user.company_name;
        if (user?.company_id === 'b968f7d7ffe04630a90aadde4d0d8e95') return 'FinServe Holdings';
        if (user?.company_id === 'c4d5e6f789014bcdef1234567890abcd') return 'AgroProm Holding';
        return 'TechCorp Ltd';
    };

    // Close any open dropdown on click outside
    useEffect(() => {
        const handleOutsideClick = (e: MouseEvent) => {
            if (navRef.current && !navRef.current.contains(e.target as Node)) {
                setOpenDropdown(null);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    // Close mobile menu & dropdowns on route changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
        setOpenDropdown(null);
    }, [location.pathname]);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isMobileMenuOpen]);

    const toggleDropdown = (menu: string) => {
        setOpenDropdown(openDropdown === menu ? null : menu);
    };

    const isActive = (path: string) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    const isComplianceActive = ['/regulations', '/compliance', '/tax-analysis'].some(p => location.pathname.startsWith(p));
    const isOwnerActive = ['/hierarchy', '/company-settings'].some(p => location.pathname.startsWith(p));
    const isAdminActive = ['/companies', '/tax-config', '/users', '/hierarchy', '/company-settings', '/audit-log', '/tenants'].some(p => location.pathname.startsWith(p));
    const isHelpActive = ['/guide', '/examples', '/help'].some(p => location.pathname.startsWith(p));

    return (
        <header className="sticky top-0 z-40 w-full border-b bg-white/95 dark:bg-[#070c1e]/90 border-slate-200 dark:border-[#162244] shadow-xs backdrop-blur-md transition-colors">
            <div className="w-full max-w-[1600px] mx-auto flex h-16 items-center justify-between px-3 sm:px-6 lg:px-8 gap-2">
                {/* Brand & Desktop Navigation (No min-w-0 to avoid overflow bleed) */}
                <div ref={navRef} className="flex items-center gap-3 xl:gap-5 shrink-0">
                    <div className="flex items-center gap-2">
                        <Link to="/" className="flex items-center gap-2 sm:gap-2.5 group transition-transform hover:scale-[1.02] shrink-0">
                            <div className="relative flex items-center justify-center">
                                {/* Ambient Neon Glow */}
                                <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 opacity-70 blur-xs group-hover:opacity-100 transition duration-300"></div>
                                <img
                                    src="/axiaris-logo.png"
                                    alt="Axiaris Logo"
                                    width={36}
                                    height={36}
                                    fetchPriority="high"
                                    decoding="async"
                                    className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-cover ring-1 ring-white/30 shadow-lg shadow-cyan-500/20"
                                />
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-lg sm:text-xl font-black tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-950 dark:from-white dark:via-sky-200 dark:to-cyan-200 bg-clip-text text-transparent">
                                    Axiaris
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/10 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.15)] hidden sm:inline-block">
                                    AI
                                </span>
                            </div>
                        </Link>
                        
                        {/* Beta Testing Badge */}
                        <div 
                            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 dark:border-amber-400/30 shadow-[0_0_12px_rgba(245,158,11,0.15)] select-none shrink-0"
                            title={tr("Платформа в режиме активного бета-тестирования", "Platform is in active Beta Testing mode")}
                        >
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                            </span>
                            <span className="font-semibold">{tr('Бета-тест', 'Beta Testing')}</span>
                        </div>
                    </div>

                    {/* Desktop Navigation Links (Visible on screens >= 1280px XL to ensure ample breathing room) */}
                    <nav className="hidden xl:flex items-center gap-1 text-xs xl:text-sm font-medium shrink-0">
                        {/* Dashboard */}
                        <Link
                            to="/"
                            className={`px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                                isActive('/')
                                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-cyan-400 font-semibold'
                                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#0f1838]'
                            }`}
                        >
                            {t('nav_dashboard')}
                        </Link>

                        {/* Compliance Dropdown */}
                        {PERMISSIONS.canViewCompliance(user?.role) && (
                            <div className="relative">
                                <button
                                    type="button"
                                    aria-expanded={openDropdown === 'compliance'}
                                    aria-haspopup="menu"
                                    onClick={() => toggleDropdown('compliance')}
                                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                                        isComplianceActive
                                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-cyan-400 font-semibold'
                                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#0f1838]'
                                    }`}
                                >
                                    {t('nav_compliance')}
                                    <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${openDropdown === 'compliance' ? 'rotate-180' : ''}`} />
                                </button>
                                {openDropdown === 'compliance' && (
                                    <div role="menu" className="absolute top-full left-0 mt-1.5 w-52 bg-white dark:bg-[#0b1228] border border-slate-200 dark:border-[#162244] rounded-xl shadow-xl z-50 p-1 backdrop-blur-md animate-in fade-in zoom-in-95">
                                        <Link
                                            to="/regulations"
                                            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#121c3d] text-slate-700 dark:text-slate-200 text-xs font-medium"
                                            onClick={() => setOpenDropdown(null)}
                                        >
                                            <BookOpen className="h-3.5 w-3.5 text-cyan-500" />
                                            <span>{t('nav_regulations')}</span>
                                        </Link>
                                        <Link
                                            to="/compliance"
                                            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#121c3d] text-slate-700 dark:text-slate-200 text-xs font-medium"
                                            onClick={() => setOpenDropdown(null)}
                                        >
                                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                                            <span>{t('nav_compliance_checks')}</span>
                                        </Link>
                                        <Link
                                            to="/tax-analysis"
                                            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#121c3d] text-slate-700 dark:text-slate-200 text-xs font-medium"
                                            onClick={() => setOpenDropdown(null)}
                                        >
                                            <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                                            <span>{t('nav_tax_analysis')}</span>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Reports */}
                        <Link
                            to="/reports"
                            className={`px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                                isActive('/reports')
                                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-cyan-400 font-semibold'
                                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#0f1838]'
                            }`}
                        >
                            {t('nav_reports')}
                        </Link>

                        {/* Transformation */}
                        {PERMISSIONS.canViewTransformation(user?.role) && (
                            <Link
                                to="/transformation"
                                className={`px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                                    isActive('/transformation')
                                        ? 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 font-bold border border-cyan-500/20'
                                        : 'text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/30 font-medium'
                                }`}
                            >
                                {t('nav_transformation')}
                            </Link>
                        )}

                        {/* Tax Rates (Direct shortcut for Accountant) */}
                        {user?.role === 'accountant' && (
                            <Link
                                to="/tax-config"
                                className={`px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                                    isActive('/tax-config')
                                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-semibold'
                                        : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-medium'
                                }`}
                            >
                                {t('nav_tax_rates')}
                            </Link>
                        )}

                        {/* Audit Log (Direct shortcut for Auditor) */}
                        {user?.role === 'auditor' && (
                            <Link
                                to="/audit-log"
                                className={`px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                                    isActive('/audit-log')
                                        ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-semibold'
                                        : 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40'
                                }`}
                            >
                                {t('nav_audit_log')}
                            </Link>
                        )}

                        {/* Executive Owner Dropdown (Holding & Company Governance) */}
                        {PERMISSIONS.canAccessOwnerMenu(user?.role) && (
                            <div className="relative">
                                <button
                                    type="button"
                                    aria-expanded={openDropdown === 'owner'}
                                    aria-haspopup="menu"
                                    onClick={() => toggleDropdown('owner')}
                                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                                        isOwnerActive
                                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 font-semibold'
                                            : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 font-medium'
                                    }`}
                                >
                                    {tr('Холдинг и компания', 'Holding & Company')}
                                    <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${openDropdown === 'owner' ? 'rotate-180' : ''}`} />
                                </button>
                                {openDropdown === 'owner' && (
                                    <div role="menu" className="absolute top-full left-0 mt-1.5 w-56 bg-white dark:bg-[#0b1228] border border-slate-200 dark:border-[#162244] rounded-xl shadow-xl z-50 p-1 backdrop-blur-md animate-in fade-in zoom-in-95">
                                        <Link
                                            to="/hierarchy"
                                            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#121c3d] text-slate-700 dark:text-slate-200 text-xs font-medium"
                                            onClick={() => setOpenDropdown(null)}
                                        >
                                            <GitBranch className="h-3.5 w-3.5 text-amber-500" />
                                            <span>{tr('Организационная структура', 'Organizational Structure')}</span>
                                        </Link>
                                        <Link
                                            to="/company-settings"
                                            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#121c3d] text-slate-700 dark:text-slate-200 text-xs font-medium"
                                            onClick={() => setOpenDropdown(null)}
                                        >
                                            <Settings className="h-3.5 w-3.5 text-cyan-500" />
                                            <span>{t('nav_company_settings')}</span>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Administration Dropdown (Consolidated) */}
                        {PERMISSIONS.canAccessAdminMenu(user?.role) && (
                            <div className="relative">
                                <button
                                    type="button"
                                    aria-expanded={openDropdown === 'admin'}
                                    aria-haspopup="menu"
                                    onClick={() => toggleDropdown('admin')}
                                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                                        isAdminActive
                                            ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-semibold'
                                            : 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30'
                                    }`}
                                >
                                    {t('nav_administration')}
                                    <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${openDropdown === 'admin' ? 'rotate-180' : ''}`} />
                                </button>
                                {openDropdown === 'admin' && (
                                    <div role="menu" className="absolute top-full left-0 mt-1.5 w-56 bg-white dark:bg-[#0b1228] border border-slate-200 dark:border-[#162244] rounded-xl shadow-xl z-50 p-1 backdrop-blur-md animate-in fade-in zoom-in-95">
                                        {PERMISSIONS.canManageCompanies(user?.role) && (
                                            <Link
                                                to="/companies"
                                                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#121c3d] text-slate-700 dark:text-slate-200 text-xs font-medium"
                                                onClick={() => setOpenDropdown(null)}
                                            >
                                                <Building2 className="h-3.5 w-3.5 text-blue-500" />
                                                <span>{t('nav_companies')}</span>
                                            </Link>
                                        )}
                                        {PERMISSIONS.canConfigureTax(user?.role) && (
                                            <Link
                                                to="/tax-config"
                                                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#121c3d] text-slate-700 dark:text-slate-200 text-xs font-medium"
                                                onClick={() => setOpenDropdown(null)}
                                            >
                                                <Percent className="h-3.5 w-3.5 text-emerald-500" />
                                                <span>{t('nav_tax_rates')}</span>
                                            </Link>
                                        )}
                                        {PERMISSIONS.canManageUsers(user?.role) && (
                                            <Link
                                                to="/users"
                                                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#121c3d] text-slate-700 dark:text-slate-200 text-xs font-medium"
                                                onClick={() => setOpenDropdown(null)}
                                            >
                                                <Users className="h-3.5 w-3.5 text-cyan-500" />
                                                <span>{t('nav_users')}</span>
                                            </Link>
                                        )}
                                        {PERMISSIONS.canViewHierarchy(user?.role) && (
                                            <Link
                                                to="/hierarchy"
                                                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#121c3d] text-slate-700 dark:text-slate-200 text-xs font-medium"
                                                onClick={() => setOpenDropdown(null)}
                                            >
                                                <GitBranch className="h-3.5 w-3.5 text-indigo-500" />
                                                <span>{user?.role === 'superadmin' ? t('nav_hierarchy') : (tr('Организационная структура', 'Organizational Structure'))}</span>
                                            </Link>
                                        )}
                                        {PERMISSIONS.canManageCompanySettings(user?.role) && (
                                            <Link
                                                to="/company-settings"
                                                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#121c3d] text-slate-700 dark:text-slate-200 text-xs font-medium"
                                                onClick={() => setOpenDropdown(null)}
                                            >
                                                <Settings className="h-3.5 w-3.5 text-amber-500" />
                                                <span>{t('nav_company_settings')}</span>
                                            </Link>
                                        )}
                                        {PERMISSIONS.canViewAuditLogs(user?.role) && (
                                            <Link
                                                to="/audit-log"
                                                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#121c3d] text-slate-700 dark:text-slate-200 text-xs font-medium"
                                                onClick={() => setOpenDropdown(null)}
                                            >
                                                <FileCheck className="h-3.5 w-3.5 text-purple-500" />
                                                <span>{t('nav_audit_log')}</span>
                                            </Link>
                                        )}
                                        {PERMISSIONS.canManageTenants(user?.role) && (
                                            <>
                                                <div className="border-t border-slate-200 dark:border-[#162244] my-1"></div>
                                                <Link
                                                    to="/tenants"
                                                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#121c3d] text-purple-600 dark:text-purple-400 text-xs font-semibold"
                                                    onClick={() => setOpenDropdown(null)}
                                                >
                                                    <Building className="h-3.5 w-3.5 text-purple-500" />
                                                    <span>{t('nav_tenants')}</span>
                                                </Link>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Help Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => toggleDropdown('help')}
                                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                                    isHelpActive
                                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-cyan-400 font-semibold'
                                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#0f1838]'
                                }`}
                            >
                                {t('nav_help_examples', 'Справка')}
                                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${openDropdown === 'help' ? 'rotate-180' : ''}`} />
                            </button>
                            {openDropdown === 'help' && (
                                <div className="absolute top-full left-0 mt-1.5 w-52 bg-white dark:bg-[#0b1228] border border-slate-200 dark:border-[#162244] rounded-xl shadow-xl z-50 p-1 backdrop-blur-md animate-in fade-in zoom-in-95">
                                    <Link
                                        to="/guide"
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#121c3d] text-cyan-600 dark:text-cyan-400 text-xs font-semibold"
                                        onClick={() => setOpenDropdown(null)}
                                    >
                                        <BookOpen className="h-3.5 w-3.5" />
                                        <span>{t('nav_documentation')}</span>
                                    </Link>
                                    <Link
                                        to="/examples"
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#121c3d] text-slate-700 dark:text-slate-200 text-xs font-medium"
                                        onClick={() => setOpenDropdown(null)}
                                    >
                                        <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                                        <span>{t('nav_examples')}</span>
                                    </Link>
                                    <Link
                                        to="/help"
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#121c3d] text-slate-700 dark:text-slate-200 text-xs font-medium"
                                        onClick={() => setOpenDropdown(null)}
                                    >
                                        <HelpCircle className="h-3.5 w-3.5 text-blue-500" />
                                        <span>{t('nav_help')}</span>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </nav>
                </div>

                {/* Right Action Items Cluster (Company Badge, Theme, Language, User, Logout, Mobile Hamburger) */}
                <div className="flex items-center gap-1.5 sm:gap-2 xl:gap-2.5 shrink-0">
                    {/* Active Organization Badge */}
                    <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100/90 dark:bg-[#0b1228] border border-slate-200/80 dark:border-[#162244] text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs">
                        <Building2 className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                        <span className="truncate max-w-[130px] 2xl:max-w-[180px]" title={getCompanyDisplay()}>
                            {getCompanyDisplay()}
                        </span>
                    </div>

                    <ThemeToggle />
                    <LanguageSwitcher />

                    {/* User Profile Pill */}
                    <button
                        type="button"
                        onClick={() => setIsProfileOpen(true)}
                        className="flex items-center gap-2 px-1.5 sm:px-2 py-1 rounded-xl hover:bg-slate-100/80 dark:hover:bg-[#0b1228]/90 active:bg-slate-200/70 dark:active:bg-[#121c3d] cursor-pointer transition-all text-left group border border-transparent hover:border-slate-200 dark:hover:border-[#162244] whitespace-nowrap shrink-0"
                        title={t('profile_tooltip', 'Управление профилем')}
                    >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 via-blue-600 to-violet-600 text-white flex items-center justify-center font-bold text-xs uppercase group-hover:scale-105 transition-transform shadow-md shadow-cyan-500/20 ring-1 ring-white/20 shrink-0">
                            {getDisplayName().charAt(0).toUpperCase()}
                        </div>
                        <div className="text-left hidden 2xl:block leading-tight">
                            <div className="font-semibold text-xs text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors max-w-[120px] truncate">
                                {getDisplayName()}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 capitalize truncate">
                                {getRoleLabel(user?.role)}
                            </div>
                        </div>
                    </button>

                    {/* Dedicated Logout Button - GUARANTEED VISIBLE ALWAYS */}
                    <button
                        onClick={logout}
                        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 active:scale-95 rounded-lg shadow-sm shadow-red-500/25 transition-all shrink-0 cursor-pointer"
                        title={t('logout', 'Выйти из системы')}
                    >
                        <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                        <span className="inline">{t('logout', 'Выйти')}</span>
                    </button>

                    {/* Hamburger Button for Mobile & Tablets (hidden on screens >= 1280px XL) */}
                    <button
                        type="button"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="xl:hidden p-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#0f1838] border border-slate-200 dark:border-[#162244] active:scale-95 transition-all shrink-0"
                        aria-label="Toggle navigation menu"
                    >
                        {isMobileMenuOpen ? (
                            <X className="h-5 w-5 text-cyan-500 dark:text-cyan-400" />
                        ) : (
                            <Menu className="h-5 w-5" />
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile & Tablet Slide-Over Navigation Drawer */}
            {isMobileMenuOpen && (
                <div className="xl:hidden fixed inset-0 z-50 flex">
                    {/* Dark Backdrop */}
                    <div 
                        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />

                    {/* Slide-over panel */}
                    <div className="relative ml-auto w-full max-w-[340px] sm:max-w-[380px] bg-white dark:bg-[#070c1e] border-l border-slate-200 dark:border-[#162244] shadow-2xl flex flex-col justify-between h-full z-10 animate-in slide-in-from-right duration-200">
                        {/* Drawer Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-[#162244]">
                            <div className="flex items-center gap-2">
                                <img
                                    src="/axiaris-logo.png"
                                    alt="Axiaris Logo"
                                    className="w-7 h-7 rounded-lg object-cover ring-1 ring-white/30"
                                />
                                <span className="font-black text-lg tracking-tight bg-gradient-to-r from-slate-900 to-indigo-900 dark:from-white dark:to-cyan-200 bg-clip-text text-transparent">
                                    Axiaris AI
                                </span>
                                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                    {tr('Бета', 'Beta')}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#0f1838] transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* User Card inside Drawer */}
                        <div className="p-4 bg-slate-50/70 dark:bg-[#0b1228] border-b border-slate-200 dark:border-[#162244]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 via-blue-600 to-violet-600 text-white flex items-center justify-center font-bold text-sm uppercase shadow-md shadow-cyan-500/20">
                                    {getDisplayName().charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                        {getDisplayName()}
                                    </div>
                                    <div className="text-xs text-cyan-600 dark:text-cyan-400 font-medium">
                                        {getRoleLabel(user?.role)}
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                                        <Building2 className="w-3 h-3 text-cyan-500 shrink-0" />
                                        <span className="truncate">
                                            {getCompanyDisplay()}
                                        </span>
                                    </div>
                                    {user?.email && (
                                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                            {user.email}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setIsMobileMenuOpen(false);
                                    setIsProfileOpen(true);
                                }}
                                className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-[#121c3d] border border-slate-200 dark:border-[#1b2b54] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#18264e] transition-colors shadow-2xs"
                            >
                                <UserIcon className="h-3.5 w-3.5 text-cyan-500" />
                                <span>{t('profile_tooltip', 'Управление профилем')}</span>
                            </button>
                        </div>

                        {/* Scrollable Navigation Items */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-5">
                            {/* Section: Main */}
                            <div>
                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 mb-1.5">
                                    {tr('Основное', 'Main')}
                                </div>
                                <div className="space-y-0.5">
                                    <Link
                                        to="/"
                                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                            isActive('/') 
                                                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-cyan-400 font-semibold' 
                                                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#0f1838]'
                                        }`}
                                    >
                                        <LayoutDashboard className="h-4 w-4 text-cyan-500" />
                                        <span>{t('nav_dashboard')}</span>
                                    </Link>
                                    <Link
                                        to="/reports"
                                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                            isActive('/reports') 
                                                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-cyan-400 font-semibold' 
                                                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#0f1838]'
                                        }`}
                                    >
                                        <FileText className="h-4 w-4 text-blue-500" />
                                        <span>{t('nav_reports')}</span>
                                    </Link>
                                    {user?.role === 'accountant' && (
                                        <Link
                                            to="/tax-config"
                                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                isActive('/tax-config') 
                                                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-semibold' 
                                                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#0f1838]'
                                            }`}
                                        >
                                            <Percent className="h-4 w-4 text-emerald-500" />
                                            <span>{t('nav_tax_rates')}</span>
                                        </Link>
                                    )}
                                    {user?.role === 'auditor' && (
                                        <Link
                                            to="/audit-log"
                                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                isActive('/audit-log') 
                                                    ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-semibold' 
                                                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#0f1838]'
                                            }`}
                                        >
                                            <FileCheck className="h-4 w-4 text-purple-500" />
                                            <span>{t('nav_audit_log')}</span>
                                        </Link>
                                    )}
                                </div>
                            </div>

                            {/* Section: Compliance */}
                            {PERMISSIONS.canViewCompliance(user?.role) && (
                                <div>
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 mb-1.5">
                                        {t('nav_compliance')}
                                    </div>
                                    <div className="space-y-0.5">
                                        <Link
                                            to="/regulations"
                                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                isActive('/regulations') 
                                                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-cyan-400 font-semibold' 
                                                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#0f1838]'
                                            }`}
                                        >
                                            <BookOpen className="h-4 w-4 text-cyan-500" />
                                            <span>{t('nav_regulations')}</span>
                                        </Link>
                                        <Link
                                            to="/compliance"
                                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                isActive('/compliance') 
                                                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-cyan-400 font-semibold' 
                                                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#0f1838]'
                                            }`}
                                        >
                                            <ShieldCheck className="h-4 w-4 text-emerald-500" />
                                            <span>{t('nav_compliance_checks')}</span>
                                        </Link>
                                        <Link
                                            to="/tax-analysis"
                                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                isActive('/tax-analysis') 
                                                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-cyan-400 font-semibold' 
                                                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#0f1838]'
                                            }`}
                                        >
                                            <Sparkles className="h-4 w-4 text-purple-500" />
                                            <span>{t('nav_tax_analysis')}</span>
                                        </Link>
                                    </div>
                                </div>
                            )}

                            {/* Section: Transformation */}
                            {PERMISSIONS.canViewTransformation(user?.role) && (
                                <div>
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 mb-1.5">
                                        {t('nav_transformation')}
                                    </div>
                                    <div className="space-y-0.5">
                                        <Link
                                            to="/transformation"
                                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                isActive('/transformation') 
                                                    ? 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 font-semibold' 
                                                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#0f1838]'
                                            }`}
                                        >
                                            <RefreshCw className="h-4 w-4 text-cyan-500" />
                                            <span>{tr('Панель трансформации', 'Transformation Dashboard')}</span>
                                        </Link>
                                        {PERMISSIONS.canUploadBalanceSheet(user?.role) && (
                                            <Link
                                                to="/transformation/new"
                                                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#0f1838] transition-colors"
                                            >
                                                <span className="text-emerald-500 font-bold ml-0.5">+</span>
                                                <span>{tr('Создать баланс', 'New Balance Sheet')}</span>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Section: Holding & Company (Owner) */}
                            {PERMISSIONS.canAccessOwnerMenu(user?.role) && (
                                <div>
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 px-2 mb-1.5">
                                        {tr('Холдинг и компания', 'Holding & Company')}
                                    </div>
                                    <div className="space-y-0.5">
                                        <Link
                                            to="/hierarchy"
                                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                isActive('/hierarchy') 
                                                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 font-semibold' 
                                                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#0f1838]'
                                            }`}
                                        >
                                            <GitBranch className="h-4 w-4 text-amber-500" />
                                            <span>{tr('Организационная структура', 'Organizational Structure')}</span>
                                        </Link>
                                        <Link
                                            to="/company-settings"
                                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                isActive('/company-settings') 
                                                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 font-semibold' 
                                                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#0f1838]'
                                            }`}
                                        >
                                            <Settings className="h-4 w-4 text-cyan-500" />
                                            <span>{t('nav_company_settings')}</span>
                                        </Link>
                                    </div>
                                </div>
                            )}

                            {/* Section: Administration */}
                            {PERMISSIONS.canAccessAdminMenu(user?.role) && (
                                <div>
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 px-2 mb-1.5">
                                        {t('nav_administration')}
                                    </div>
                                    <div className="space-y-0.5">
                                        {PERMISSIONS.canManageCompanies(user?.role) && (
                                            <Link
                                                to="/companies"
                                                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                    isActive('/companies') 
                                                        ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-semibold' 
                                                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#0f1838]'
                                                }`}
                                            >
                                                <Building2 className="h-4 w-4 text-blue-500" />
                                                <span>{t('nav_companies')}</span>
                                            </Link>
                                        )}
                                        {PERMISSIONS.canConfigureTax(user?.role) && (
                                            <Link
                                                to="/tax-config"
                                                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                    isActive('/tax-config') 
                                                        ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-semibold' 
                                                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#0f1838]'
                                                }`}
                                            >
                                                <Percent className="h-4 w-4 text-emerald-500" />
                                                <span>{t('nav_tax_rates')}</span>
                                            </Link>
                                        )}
                                        {PERMISSIONS.canManageUsers(user?.role) && (
                                            <Link
                                                to="/users"
                                                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                    isActive('/users') 
                                                        ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-semibold' 
                                                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#0f1838]'
                                                }`}
                                            >
                                                <Users className="h-4 w-4 text-cyan-500" />
                                                <span>{t('nav_users')}</span>
                                            </Link>
                                        )}
                                        {PERMISSIONS.canViewHierarchy(user?.role) && (
                                            <Link
                                                to="/hierarchy"
                                                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                    isActive('/hierarchy') 
                                                        ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-semibold' 
                                                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#0f1838]'
                                                }`}
                                            >
                                                <GitBranch className="h-4 w-4 text-indigo-500" />
                                                <span>{user?.role === 'superadmin' ? t('nav_hierarchy') : (tr('Организационная структура', 'Organizational Structure'))}</span>
                                            </Link>
                                        )}
                                        {PERMISSIONS.canManageCompanySettings(user?.role) && (
                                            <Link
                                                to="/company-settings"
                                                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                    isActive('/company-settings') 
                                                        ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-semibold' 
                                                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#0f1838]'
                                                }`}
                                            >
                                                <Settings className="h-4 w-4 text-amber-500" />
                                                <span>{t('nav_company_settings')}</span>
                                            </Link>
                                        )}
                                        {PERMISSIONS.canViewAuditLogs(user?.role) && (
                                            <Link
                                                to="/audit-log"
                                                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                    isActive('/audit-log') 
                                                        ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-semibold' 
                                                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#0f1838]'
                                                }`}
                                            >
                                                <FileCheck className="h-4 w-4 text-purple-500" />
                                                <span>{t('nav_audit_log')}</span>
                                            </Link>
                                        )}
                                        {PERMISSIONS.canManageTenants(user?.role) && (
                                            <Link
                                                to="/tenants"
                                                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                    isActive('/tenants') 
                                                        ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-semibold' 
                                                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#0f1838]'
                                                }`}
                                            >
                                                <Building className="h-4 w-4 text-purple-500" />
                                                <span>{t('nav_tenants')}</span>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Section: Help & Docs */}
                            <div>
                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 mb-1.5">
                                    {tr('Справка и ресурсы', 'Help & Resources')}
                                </div>
                                <div className="space-y-0.5">
                                    <Link
                                        to="/guide"
                                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                            isActive('/guide') 
                                                ? 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 font-semibold' 
                                                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#0f1838]'
                                        }`}
                                    >
                                        <BookOpen className="h-4 w-4 text-cyan-500" />
                                        <span>{t('nav_documentation')}</span>
                                    </Link>
                                    <Link
                                        to="/examples"
                                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                            isActive('/examples') 
                                                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-cyan-400 font-semibold' 
                                                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#0f1838]'
                                        }`}
                                    >
                                        <Lightbulb className="h-4 w-4 text-amber-500" />
                                        <span>{t('nav_examples')}</span>
                                    </Link>
                                    <Link
                                        to="/help"
                                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                            isActive('/help') 
                                                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-cyan-400 font-semibold' 
                                                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#0f1838]'
                                        }`}
                                    >
                                        <HelpCircle className="h-4 w-4 text-blue-500" />
                                        <span>{t('nav_help')}</span>
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Drawer Footer with Prominent Logout Button */}
                        <div className="p-4 border-t border-slate-200 dark:border-[#162244] bg-slate-50/50 dark:bg-[#050814]/70 space-y-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsMobileMenuOpen(false);
                                    logout();
                                }}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-lg shadow-red-500/25 transition-all cursor-pointer"
                            >
                                <LogOut className="h-4 w-4 shrink-0" />
                                <span>{t('logout', 'Выйти из системы')}</span>
                            </button>
                            <div className="text-center text-[10px] text-slate-400 dark:text-slate-500 tracking-wider uppercase font-medium">
                                Axiaris AI Enterprise • v2.4
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
        </header>
    );
}
