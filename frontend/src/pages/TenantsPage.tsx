import { useState, useEffect } from 'react';
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

interface Tenant {
    id: string;
    name: string;
    plan: string;
    created_at: string;
    is_active: boolean;
}

export default function TenantsPage() {
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
            setTenants(res.data);

            // Calculate stats
            const active = res.data.filter((t: Tenant) => t.is_active).length;
            const premium = res.data.filter((t: Tenant) => t.plan === 'premium').length;
            const enterprise = res.data.filter((t: Tenant) => t.plan === 'enterprise').length;

            setStats({
                total: res.data.length,
                active,
                premium,
                enterprise
            });
        } catch (error) {
            console.error('Failed to fetch tenants', error);
            toast({
                title: 'Error',
                description: 'Failed to load tenants',
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
            title: 'Success',
            description: 'Tenant created successfully'
        });
    };

    const handleUpgrade = async (tenantId: string, newPlan: string) => {
        try {
            await api.put(`/tenants/${tenantId}`, { plan: newPlan });
            fetchTenants();
            toast({
                title: 'Success',
                description: `Tenant upgraded to ${newPlan}`
            });
        } catch (error) {
            console.error('Failed to upgrade tenant', error);
            toast({
                title: 'Error',
                description: 'Failed to upgrade tenant',
                variant: 'destructive'
            });
        }
    };

    const handleToggleActive = async (tenantId: string, currentStatus: boolean) => {
        try {
            await api.put(`/tenants/${tenantId}`, { is_active: !currentStatus });
            fetchTenants();
            toast({
                title: 'Success',
                description: `Tenant ${!currentStatus ? 'activated' : 'deactivated'}`
            });
        } catch (error) {
            console.error('Failed to toggle tenant status', error);
            toast({
                title: 'Error',
                description: 'Failed to update tenant status',
                variant: 'destructive'
            });
        }
    };

    const handleDelete = async (tenantId: string, tenantName: string) => {
        const confirmed = window.confirm(`Are you sure you want to delete tenant "${tenantName}"? This action cannot be undone.`);
        if (!confirmed) {
            return;
        }

        try {
            await api.delete(`/tenants/${tenantId}`);
            fetchTenants();
            toast({
                title: 'Success',
                description: 'Tenant deleted successfully'
            });
        } catch (error) {
            console.error('Failed to delete tenant', error);
            toast({
                title: 'Error',
                description: 'Failed to delete tenant',
                variant: 'destructive'
            });
        }
    };

    const getPlanBadgeColor = (plan: string) => {
        switch (plan) {
            case 'enterprise':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'premium':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
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
        return <div className="p-8 flex justify-center">Loading tenants...</div>;
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Building2 className="h-8 w-8" />
                        Tenants Management
                    </h1>
                    <p className="text-gray-500 mt-1">Manage all tenants and their subscriptions</p>
                </div>
                <Button onClick={handleCreate} size="lg">
                    <Building2 className="mr-2 h-4 w-4" />
                    Create Tenant
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.active} active
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
                        <Users className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                        <p className="text-xs text-muted-foreground">
                            {Math.round((stats.active / stats.total) * 100)}% of total
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Premium Plans</CardTitle>
                        <Shield className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{stats.premium}</div>
                        <p className="text-xs text-muted-foreground">
                            Premium subscriptions
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Enterprise Plans</CardTitle>
                        <Crown className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">{stats.enterprise}</div>
                        <p className="text-xs text-muted-foreground">
                            Enterprise subscriptions
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Tenants Table */}
            <Card>
                <CardHeader>
                    <CardTitle>All Tenants</CardTitle>
                    <CardDescription>Manage tenant subscriptions and access</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tenant
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Plan
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Created
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        ID
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {tenants.map((tenant) => (
                                    <tr key={tenant.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                                    <Building2 className="h-5 w-5 text-white" />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {tenant.name}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${getPlanBadgeColor(tenant.plan)}`}>
                                                {getPlanIcon(tenant.plan)}
                                                {tenant.plan}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {tenant.is_active ? (
                                                <span className="inline-flex items-center gap-1 text-green-700 text-sm">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-gray-500 text-sm">
                                                    <XCircle className="h-4 w-4" />
                                                    Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(tenant.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <code className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                {tenant.id.substring(0, 8)}...
                                            </code>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* Upgrade Options */}
                                                {tenant.plan === 'basic' && (
                                                    <>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleUpgrade(tenant.id, 'premium')}
                                                        >
                                                            <TrendingUp className="mr-1 h-3 w-3" />
                                                            Premium
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
                                                    {tenant.is_active ? 'Deactivate' : 'Activate'}
                                                </Button>

                                                {/* Delete */}
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDelete(tenant.id, tenant.name)}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
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

                    {tenants.length === 0 && (
                        <div className="text-center py-12">
                            <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No tenants</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Get started by creating a new tenant.
                            </p>
                            <div className="mt-6">
                                <Button onClick={handleCreate}>
                                    <Building2 className="mr-2 h-4 w-4" />
                                    Create Tenant
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
