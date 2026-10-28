import { useState, useEffect } from 'react';
import { tr } from '@/lib/i18n';
import api from '../lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import TenantFormModal from '../components/TenantFormModal';
import {
    Building2,
    TrendingUp,
    Users,
    Crown,
    Shield,
    Trash2,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';

interface Tenant {
    id: string;
    name: string;
    plan: string;
    created_at: string;
    is_active: boolean;
}

export default function TenantsPage() {
    const { i18n } = useTranslation();
    const isRu = (i18n.language || 'ru').toLowerCase().startsWith('ru');

    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        premium: 0,
        enterprise: 0
    });
    const { toast } = useToast();

    useEffect(() => {
        fetchTenants();
    }, []);

    const fetchTenants = async () => {
        try {
            setLoading(true);
            const res = await api.get('/tenants/');
            const rawData = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.items) ? res.data.items : []);
            setTenants(rawData);

            // Calculate stats
            const active = rawData.filter((t: Tenant) => t.is_active).length;
            const premium = rawData.filter((t: Tenant) => t.plan === 'premium').length;
            const enterprise = rawData.filter((t: Tenant) => t.plan === 'enterprise').length;

            setStats({
                total: rawData.length,
                active,
                premium,
                enterprise
            });
        } catch (error) {
            console.error('Failed to fetch tenants', error);
            setTenants([]);
            setStats({ total: 0, active: 0, premium: 0, enterprise: 0 });
            toast({
                title: tr('Ошибка', 'Error'),
                description: tr('Не удалось загрузить список тенантов', 'Failed to load tenants'),
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setIsFormOpen(true);
    };

    const handleFormSuccess = () => {
        setIsFormOpen(false);
        fetchTenants();
        toast({
            title: tr('Успешно', 'Success'),
            description: tr('Тенант успешно создан', 'Tenant created successfully')
        });
    };

    const handleUpgrade = async (tenantId: string, newPlan: string) => {
        try {
            await api.put(`/tenants/${tenantId}`, { plan: newPlan });
            fetchTenants();
            toast({
                title: tr('Успешно', 'Success'),
                description: tr(`Тариф тенанта изменен на ${newPlan}`, `Tenant upgraded to ${newPlan}`)
            });
        } catch (error) {
            console.error('Failed to upgrade tenant', error);
            toast({
                title: tr('Ошибка', 'Error'),
                description: tr('Не удалось изменить тариф', 'Failed to upgrade tenant'),
                variant: 'destructive'
            });
        }
    };

    const handleToggleActive = async (tenantId: string, currentStatus: boolean) => {
        try {
            await api.put(`/tenants/${tenantId}`, { is_active: !currentStatus });
            fetchTenants();
            toast({
                title: tr('Успешно', 'Success'),
                description: tr(`Тенант ${!currentStatus ? 'активирован' : 'деактивирован'}`, `Tenant ${!currentStatus ? 'activated' : 'deactivated'}`)
            });
        } catch (error) {
            console.error('Failed to toggle tenant status', error);
            toast({
                title: tr('Ошибка', 'Error'),
                description: tr('Не удалось обновить статус тенанта', 'Failed to update tenant status'),
                variant: 'destructive'
            });
        }
    };

    const handleDelete = async (tenantId: string, tenantName: string) => {
        const confirmed = window.confirm(
            tr(`Вы уверены, что хотите удалить тенанта "${tenantName}"? Это действие необратимо.`, `Are you sure you want to delete tenant "${tenantName}"? This action cannot be undone.`)
        );
        if (!confirmed) {
            return;
        }

        try {
            await api.delete(`/tenants/${tenantId}`);
            fetchTenants();
            toast({
                title: tr('Успешно', 'Success'),
                description: tr('Тенант успешно удален', 'Tenant deleted successfully')
            });
        } catch (error) {
            console.error('Failed to delete tenant', error);
            toast({
                title: tr('Ошибка', 'Error'),
                description: tr('Не удалось удалить тенанта', 'Failed to delete tenant'),
                variant: 'destructive'
            });
        }
    };

    const getPlanBadgeColor = (plan: string) => {
        switch (plan) {
            case 'enterprise':
                return 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800';
            case 'premium':
                return 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800';
            default:
                return 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
        }
    };

    const getPlanLabel = (plan: string) => {
        switch (plan) {
            case 'enterprise':
                return tr('Enterprise', 'Enterprise');
            case 'premium':
                return tr('Premium', 'Premium');
            case 'free':
                return tr('Базовый', 'Free');
            default:
                return plan;
        }
    };

    const getPlanIcon = (plan: string) => {
        switch (plan) {
            case 'enterprise':
                return <Crown className="h-3 w-3" />;
            case 'premium':
                return <Shield className="h-3 w-3" />;
            default:
                return <Building2 className="h-3 w-3" />;
        }
    };

    if (loading) {
        return <div className="p-8 flex justify-center text-slate-500">{tr('Загрузка тенантов...', 'Loading tenants...')}</div>;
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Building2 className="h-8 w-8 text-blue-600" />
                        {tr('Управление тенантами', 'Tenants Management')}
                    </h1>
                    <p className="text-gray-500 mt-1">
                        {tr('Централизованное управление организациями и их тарифными планами', 'Manage all tenants and their subscriptions')}
                    </p>
                </div>
                <Button onClick={handleCreate} size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Building2 className="mr-2 h-4 w-4" />
                    {tr('Создать тенанта', 'Create Tenant')}
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{tr('Всего тенантов', 'Total Tenants')}</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.active} {tr('активных', 'active')}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{tr('Активные тенанты', 'Active Tenants')}</CardTitle>
                        <Users className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% {tr('от общего числа', 'of total')}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{tr('Тариф Premium', 'Premium Plans')}</CardTitle>
                        <Shield className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{stats.premium}</div>
                        <p className="text-xs text-muted-foreground">
                            {tr('Премиум-подписки', 'Premium subscriptions')}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{tr('Тариф Enterprise', 'Enterprise Plans')}</CardTitle>
                        <Crown className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">{stats.enterprise}</div>
                        <p className="text-xs text-muted-foreground">
                            {tr('Корпоративные подписки', 'Enterprise subscriptions')}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Tenants Table */}
            <Card>
                <CardHeader>
                    <CardTitle>{tr('Все зарегистрированные тенанты', 'All Tenants')}</CardTitle>
                    <CardDescription>{tr('Управление подписками, правами и доступом организаций', 'Manage tenant subscriptions and access')}</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        {tr('Тенант / Организация', 'Tenant')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        {tr('Тариф', 'Plan')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        {tr('Статус', 'Status')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        {tr('Дата создания', 'Created')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        ID
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        {tr('Действия', 'Actions')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
                                {Array.isArray(tenants) && tenants.map((tenant) => (
                                    <tr key={tenant.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                                    <Building2 className="h-5 w-5 text-white" />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                                                        {tenant.name}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${getPlanBadgeColor(tenant.plan)}`}>
                                                {getPlanIcon(tenant.plan)}
                                                {getPlanLabel(tenant.plan)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {tenant.is_active ? (
                                                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-sm">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    {tr('Активен', 'Active')}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 text-sm">
                                                    <XCircle className="h-4 w-4" />
                                                    {tr('Неактивен', 'Inactive')}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                                            {new Date(tenant.created_at).toLocaleDateString(isRu ? 'ru-RU' : 'en-US')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <code className="text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                                {tenant.id.substring(0, 8)}...
                                            </code>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* Upgrade Options */}
                                                {(tenant.plan === 'basic' || tenant.plan === 'free') && (
                                                    <>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleUpgrade(tenant.id, 'premium')}
                                                        >
                                                            <TrendingUp className="mr-1 h-3 w-3" />
                                                            {tr('Премиум', 'Premium')}
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleUpgrade(tenant.id, 'enterprise')}
                                                        >
                                                            <Crown className="mr-1 h-3 w-3" />
                                                            Enterprise
                                                        </Button>
                                                    </>
                                                )}
                                                {tenant.plan === 'premium' && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleUpgrade(tenant.id, 'enterprise')}
                                                    >
                                                        <Crown className="mr-1 h-3 w-3" />
                                                        Enterprise
                                                    </Button>
                                                )}

                                                {/* Toggle Active Status */}
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleToggleActive(tenant.id, tenant.is_active)}
                                                >
                                                    {tenant.is_active 
                                                        ? (tr('Деактивировать', 'Deactivate')) 
                                                        : (tr('Активировать', 'Activate'))}
                                                </Button>

                                                {/* Delete */}
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDelete(tenant.id, tenant.name)}
                                                    className="text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-slate-200 dark:border-slate-800"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {(!Array.isArray(tenants) || tenants.length === 0) && (
                        <div className="text-center py-12">
                            <Building2 className="mx-auto h-12 w-12 text-slate-400" />
                            <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-white">{tr('Нет тенантов', 'No tenants')}</h3>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                {tr('Начните с добавления первого тенанта в систему.', 'Get started by creating a new tenant.')}
                            </p>
                            <div className="mt-6">
                                <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 text-white">
                                    <Building2 className="mr-2 h-4 w-4" />
                                    {tr('Создать тенанта', 'Create Tenant')}
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {isFormOpen && (
                <TenantFormModal
                    onClose={() => setIsFormOpen(false)}
                    onSuccess={handleFormSuccess}
                />
            )}
        </div>
    );
}
