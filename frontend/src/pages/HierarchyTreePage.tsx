import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Users, Shield, UserCog, User, Crown, Network, ShieldCheck, Building2, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GroupConsolidationView from '../components/hierarchy/GroupConsolidationView';
import { tr } from '../lib/i18n';

interface HierarchyLevel {
    level: number;
    role_name: string;
    display_name: string;
    user_count: number;
    users: Array<{
        id: string;
        email: string;
        full_name: string;
        role: string;
        is_company_owner: boolean;
        company_id: string | null;
        company_name?: string;
    }>;
}

export default function HierarchyTreePage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { i18n } = useTranslation();
    void i18n.language;
    const isSuperAdmin = user?.role === 'superadmin' || user?.role === 'website_superadmin';

    const [hierarchy, setHierarchy] = useState<HierarchyLevel[]>([]);
    const [expandedLevels, setExpandedLevels] = useState<Set<number>>(new Set([1, 2, 3, 4, 5]));
    const [loading, setLoading] = useState(true);
    const [mainTab, setMainTab] = useState<'consolidation' | 'roles'>(isSuperAdmin ? 'consolidation' : 'roles');

    useEffect(() => {
        fetchHierarchy();
    }, []);

    const fetchHierarchy = async () => {
        try {
            const res = await api.get('/hierarchy/structure');
            const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.items) ? res.data.items : []);
            setHierarchy(data);
        } catch (error) {
            console.error('Failed to fetch hierarchy', error);
            setHierarchy([]);
        } finally {
            setLoading(false);
        }
    };

    const toggleLevel = (level: number) => {
        const newExpanded = new Set(expandedLevels);
        if (newExpanded.has(level)) {
            newExpanded.delete(level);
        } else {
            newExpanded.add(level);
        }
        setExpandedLevels(newExpanded);
    };

    const getLevelIcon = (level: number) => {
        switch (level) {
            case 1: return <Crown className="h-5 w-5 text-purple-600" />;
            case 2: return <Shield className="h-5 w-5 text-blue-600" />;
            case 3: return <UserCog className="h-5 w-5 text-green-600" />;
            case 4: return <Users className="h-5 w-5 text-yellow-600" />;
            default: return <User className="h-5 w-5 text-gray-600" />;
        }
    };

    const getLevelColor = (level: number) => {
        switch (level) {
            case 1: return 'bg-purple-100 dark:bg-purple-950/60 border-purple-300 dark:border-purple-800 text-purple-900 dark:text-purple-200';
            case 2: return 'bg-blue-100 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-200';
            case 3: return 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200';
            case 4: return 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200';
            default: return 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200';
        }
    };

    const getLocalizedRoleTitle = (levelNum: number, originalName: string) => {
        switch (levelNum) {
            case 1: return tr('Главный администратор платформы', 'Platform SuperAdmin', 'Platforma bosh administratori');
            case 2: return tr('Владелец компании', 'Company Owner', 'Kompaniya egasi');
            case 3: return tr('Суперадминистратор компании', 'Company Super Admin', 'Kompaniya superadministratori');
            case 4: return tr('Администратор компании', 'Company Admin', 'Kompaniya administratori');
            case 5: return tr('Аудитор / Бухгалтер', 'Auditor / Accountant', 'Auditor / Buxgalter');
            default: return originalName;
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                        <Network className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                        {isSuperAdmin
                            ? tr('Структура группы и иерархия', 'Group Structure & Hierarchy', 'Guruh tuzilmasi va iyerarxiyasi')
                            : tr('Организационная структура и доступы', 'Organizational Structure & Roles', 'Tashkiliy tuzilma va ruxsatlar')}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        {isSuperAdmin
                            ? tr(
                                'Консолидация холдинга по МСФО (IFRS 10), внутригрупповые элиминации и ролевые доступы',
                                'IFRS 10 Group Consolidation, Intercompany Eliminations and Organizational Roles',
                                'MHXS (IFRS 10) bo\'yicha xolding konsolidatsiyasi, guruh ichidagi eliminatsiyalar va rollar'
                            )
                            : tr(
                                `Управление ролями, сотрудниками и правами доступа организации ${user?.company_name || 'TechCorp Ltd'}`,
                                `Manage roles, members, and access permissions for ${user?.company_name || 'TechCorp Ltd'}`,
                                `${user?.company_name || 'TechCorp Ltd'} tashkiloti rollari, xodimlari va kirish huquqlarini boshqarish`
                            )}
                    </p>
                </div>
            </div>

            <Tabs value={mainTab} onValueChange={(val) => setMainTab(val as any)} className="space-y-6">
                <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 rounded-lg">
                    {isSuperAdmin ? (
                        <>
                            <TabsTrigger value="consolidation" className="flex items-center gap-2 px-4 py-2 font-medium">
                                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                                {tr('Консолидация группы (IFRS 10)', 'Group Consolidation (IFRS 10)')}
                            </TabsTrigger>
                            <TabsTrigger value="roles" className="flex items-center gap-2 px-4 py-2 font-medium">
                                <Users className="h-4 w-4 text-blue-600" />
                                {tr('Ролевая структура платформы', 'Platform Roles & Access')}
                            </TabsTrigger>
                        </>
                    ) : (
                        <>
                            <TabsTrigger value="roles" className="flex items-center gap-2 px-4 py-2 font-medium">
                                <Users className="h-4 w-4 text-blue-600" />
                                {tr('Сотрудники и роли компании', 'Company Users & Roles')}
                            </TabsTrigger>
                            <TabsTrigger value="consolidation" className="flex items-center gap-2 px-4 py-2 font-medium">
                                <Building2 className="h-4 w-4 text-slate-500" />
                                {tr('Статус контура (Автономный)', 'Entity Scope (Autonomous)')}
                            </TabsTrigger>
                        </>
                    )}
                </TabsList>

                <TabsContent value="consolidation" className="mt-0 focus-visible:outline-hidden">
                    {isSuperAdmin ? (
                        <GroupConsolidationView />
                    ) : (
                        <Card className="border-slate-200 dark:border-slate-800">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-blue-100 dark:bg-blue-950/80 rounded-xl text-blue-600 dark:text-cyan-400">
                                        <Building2 className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">
                                            {tr('Контур учета: Автономная организация', 'Scope: Standalone Autonomous Entity')}
                                        </CardTitle>
                                        <CardDescription>
                                            {tr(`Организация ${user?.company_name || 'TechCorp Ltd'} (1 юридическое лицо)`, `Organization ${user?.company_name || 'TechCorp Ltd'} (1 legal entity)`)}
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-4 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 text-sm text-slate-700 dark:text-slate-300">
                                    <p>
                                        {tr('Модуль консолидации по стандарту МСФО 10 (IFRS 10) с матрицей элиминаций внутригрупповых оборотов и неконтролирующей доли (NCI) применяется при наличии дочерних предприятий в составе холдинга. Ваша организация ведет автономный раздельный учет по международным стандартам финансовой отчетности (МСФО).', 'The IFRS 10 group consolidation module with elimination matrices and non-controlling interest (NCI) calculations is enabled for holding groups with active subsidiaries. Your organization operates in isolated autonomous accounting mode.')}
                                    </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 pt-2">
                                    <Button onClick={() => setMainTab('roles')} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                                        <Users className="h-4 w-4" />
                                        {tr('Сотрудники и роли компании', 'Team Roles & Access')}
                                    </Button>
                                    <Button onClick={() => navigate('/company-settings')} variant="outline" className="gap-2">
                                        <Settings className="h-4 w-4" />
                                        {tr('Параметры компании и 1С', 'Company Settings & 1C')}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="roles" className="mt-0 space-y-6 focus-visible:outline-hidden">
                    {loading ? (
                        <div className="p-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                            {tr('Загрузка структуры уровней доступа...', 'Loading hierarchy...')}
                        </div>
                    ) : (
                        <>
                            <Card>
                                <CardHeader>
                                    <CardTitle>{tr('Структура уровней доступа', 'Hierarchy Structure')}</CardTitle>
                                    <CardDescription>
                                        {tr('Нажмите на уровень, чтобы развернуть или свернуть список пользователей', 'Click on each level to expand/collapse user details')}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {Array.isArray(hierarchy) && hierarchy.map((level, idx) => {
                                            const levelNum = typeof level.level === 'number' ? level.level : (idx + 1);
                                            const displayName = getLocalizedRoleTitle(levelNum, level.display_name || (level as any).name || `Level ${levelNum}`);
                                            const userList = Array.isArray(level.users) ? level.users : [];
                                            const userCount = typeof level.user_count === 'number' ? level.user_count : userList.length;
                                            const isExpanded = expandedLevels.has(levelNum);

                                            return (
                                                <div key={levelNum} className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                                                    {/* Level Header */}
                                                    <div
                                                        className={`p-4 cursor-pointer hover:opacity-90 transition-opacity ${getLevelColor(levelNum)}`}
                                                        onClick={() => toggleLevel(levelNum)}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                {isExpanded ? (
                                                                    <ChevronDown className="h-5 w-5" />
                                                                ) : (
                                                                    <ChevronRight className="h-5 w-5" />
                                                                )}
                                                                {getLevelIcon(levelNum)}
                                                                <div>
                                                                    <h3 className="font-semibold text-lg">{displayName}</h3>
                                                                    <p className="text-sm opacity-75">
                                                                        {tr(`Уровень ${levelNum}`, `Level ${levelNum}`)} • {level.role_name || (tr('Служба', 'Service'))}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <span className="px-3 py-1 bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 rounded-full text-sm font-semibold shadow-xs border border-black/5 dark:border-white/10">
                                                                {userCount} {tr(
                                                                    userCount === 1 ? 'пользователь' : (userCount > 1 && userCount < 5 ? 'пользователя' : 'пользователей'),
                                                                    userCount === 1 ? 'user' : 'users',
                                                                    'foydalanuvchi'
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Users List */}
                                                    {isExpanded && userList.length > 0 && (
                                                        <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                                                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                                                {userList.map((user) => (
                                                                    <div key={user.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                                        <div className="flex items-center justify-between">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-sm">
                                                                                    {(user.full_name || user.email || 'U').slice(0, 2).toUpperCase()}
                                                                                </div>
                                                                                <div>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <p className="font-medium text-slate-900 dark:text-white">{user.full_name || user.email}</p>
                                                                                        {user.is_company_owner && (
                                                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 rounded text-xs font-medium">
                                                                                                <Crown className="h-3 w-3" />
                                                                                                {tr('Владелец', 'Owner')}
                                                                                            </span>
                                                                                        )}
                                                                                        {user.company_name && (
                                                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded text-xs">
                                                                                                {user.company_name}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                    <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
                                                                                </div>
                                                                            </div>
                                                                            <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                                                                {user.role?.replace('_', ' ') || 'user'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Empty State */}
                                                    {isExpanded && userList.length === 0 && (
                                                        <div className="bg-slate-50 dark:bg-slate-800/40 p-8 text-center text-slate-500 dark:text-slate-400">
                                                            {tr('Нет пользователей на данном уровне', 'No users at this level')}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {hierarchy.length === 0 && (
                                        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                                            <Users className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                                            <p>{tr('Данные иерархии отсутствуют', 'No hierarchy data available')}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/60">
                                <CardHeader>
                                    <CardTitle className="text-blue-900 dark:text-blue-300">
                                        {tr('Описание уровней иерархии', 'Hierarchy Levels Explained')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-blue-900 dark:text-blue-200/90 space-y-2">
                                    <div className="flex items-start gap-2">
                                        <Crown className="h-4 w-4 mt-0.5 text-purple-600 dark:text-purple-400 shrink-0" />
                                        <div>
                                            <strong>{tr('Уровень 1 - Главный администратор платформы:', 'Level 1 - Website Super Admin:')}</strong>{' '}
                                            {tr('Полный системный доступ, управление всеми компаниями и тенантами', 'Full system access, manages all companies')}
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <Shield className="h-4 w-4 mt-0.5 text-blue-600 dark:text-blue-400 shrink-0" />
                                        <div>
                                            <strong>{tr('Уровень 2 - Владелец компании:', 'Level 2 - Company Owner:')}</strong>{' '}
                                            {tr('Полный доступ к управлению своей компанией, филиалами и финансами', 'Full access to their company')}
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <UserCog className="h-4 w-4 mt-0.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                        <div>
                                            <strong>{tr('Уровень 3 - Суперадминистратор компании:', 'Level 3 - Company Super Admin:')}</strong>{' '}
                                            {tr('Управление пользователями, ролями и настройками организации', 'Manages users and settings')}
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <Users className="h-4 w-4 mt-0.5 text-amber-600 dark:text-amber-400 shrink-0" />
                                        <div>
                                            <strong>{tr('Уровень 4 - Администратор компании:', 'Level 4 - Company Admin:')}</strong>{' '}
                                            {tr('Проверка и утверждение отчётов, управление финансовыми данными', 'Reviews reports and manages data')}
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <User className="h-4 w-4 mt-0.5 text-slate-600 dark:text-slate-400 shrink-0" />
                                        <div>
                                            <strong>{tr('Уровень 5 - Аудитор / Бухгалтер:', 'Level 5 - Auditor/Accountant:')}</strong>{' '}
                                            {tr('Подготовка, загрузка балансов и просмотр назначенных отчетов', 'Submits and views own reports')}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
