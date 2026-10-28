import { useState, useEffect } from 'react';
import { tr } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '../context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Edit, Trash2, Building2 } from 'lucide-react';
import api from '../lib/api';
import CompanyFormModal from '../components/CompanyFormModal';
import CompanyProfileCard from '../components/CompanyProfileCard';
import { useTranslation } from 'react-i18next';

export default function CompaniesManagementPage() {
    const { i18n } = useTranslation();
    void i18n.language;
    const [companies, setCompanies] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState<any>(null);
    const [viewProfile, setViewProfile] = useState<any>(null);
    const { user } = useAuth();
    const { toast } = useToast();

    const [showInactive, setShowInactive] = useState(false);

    useEffect(() => {
        fetchCompanies();
    }, [showInactive]);

    const fetchCompanies = async () => {
        try {
            const params: any = {};
            if (!showInactive) {
                params.is_active = true;
            }
            const res = await api.get('/companies/', { params });
            const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.items) ? res.data.items : []);
            setCompanies(data);
        } catch (error) {
            console.error('Failed to fetch companies', error);
            setCompanies([]);
        }
    };

    const handlePlanChange = async (companyId: string, companyName: string, newPlan: string) => {
        try {
            await api.put(`/companies/${companyId}`, { plan: newPlan });
            toast({
                title: tr("Успешно", "Success"),
                description: tr(`Тариф компании "${companyName}" изменен на ${getPlanLabel(newPlan)}`, `Company plan updated to ${newPlan}`),
            });
            fetchCompanies();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: tr("Ошибка", "Error"),
                description: error.response?.data?.detail || tr("Не удалось изменить тариф компании", "Failed to change company plan"),
            });
        }
    };

    const getPlanBadgeColor = (plan?: string) => {
        switch (plan?.toLowerCase()) {
            case 'enterprise':
                return 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700';
            case 'premium':
                return 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700';
            case 'free':
            case 'basic':
            default:
                return 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700';
        }
    };

    const getPlanLabel = (plan?: string) => {
        switch (plan?.toLowerCase()) {
            case 'enterprise':
                return tr('Корпоративный (Enterprise)', 'Enterprise');
            case 'premium':
                return tr('Премиум (Premium)', 'Premium');
            case 'free':
            case 'basic':
            default:
                return tr('Базовый (Free)', 'Basic (Free)');
        }
    };

    const handleCreate = () => {
        setSelectedCompany(null);
        setIsFormOpen(true);
    };

    const handleEdit = (company: any) => {
        setSelectedCompany(company);
        setIsFormOpen(true);
    };

    const handleDelete = async (companyId: string, companyName: string) => {
        const confirmMsg = tr(`Вы уверены, что хотите удалить компанию "${companyName}"? Это действие деактивирует организацию.`, `Are you sure you want to delete "${companyName}"? This will soft-delete the company.`);

        if (!confirm(confirmMsg)) {
            return;
        }

        try {
            await api.delete(`/companies/${companyId}`);
            toast({
                title: tr("Успешно", "Success"),
                description: tr("Компания успешно удалена", "Company deleted successfully"),
            });
            fetchCompanies();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: tr("Ошибка", "Error"),
                description: error.response?.data?.detail || (tr("Не удалось удалить компанию", "Failed to delete company")),
            });
        }
    };

    const handleFormSuccess = () => {
        setIsFormOpen(false);
        fetchCompanies();
    };

    const handleViewProfile = (company: any) => {
        setViewProfile(company);
    };

    const filteredCompanies = Array.isArray(companies) ? companies.filter(company =>
        company.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (company.industry && company.industry.toLowerCase().includes(searchTerm.toLowerCase()))
    ) : [];

    if (user?.role !== 'superadmin') {
        return (
            <div className="p-8 text-center">
                <h1 className="text-2xl font-bold text-red-600">{tr('Доступ ограничен', 'Access Denied')}</h1>
                <p className="mt-2 text-gray-600">
                    {tr('Только суперадминистраторы имеют доступ к управлению компаниями.', 'Only superadmins can access company management.')}
                </p>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                        <Building2 className="h-8 w-8 text-blue-600" />
                        {tr('Управление организациями', 'Company Management')}
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        {tr('Управление всеми зарегистрированными организациями и холдингами', 'Manage all companies in the system')}
                    </p>
                </div>
                <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                    <Plus className="mr-2 h-4 w-4" />
                    {tr('Добавить компанию', 'Create Company')}
                </Button>
            </div>

            {/* Search and Filter */}
            <div className="mb-6 flex items-center gap-4">
                <Input
                    type="text"
                    placeholder={tr('Поиск организаций по названию или отрасли...', 'Search companies by name or industry...')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-md bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        id="showInactive"
                        checked={showInactive}
                        onChange={(e) => setShowInactive(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <label
                        htmlFor="showInactive"
                        className="text-sm font-medium leading-none cursor-pointer text-slate-700 dark:text-slate-300"
                    >
                        {tr('Показывать неактивные', 'Show Inactive')}
                    </label>
                </div>
            </div>

            {/* Companies Table */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        <tr>
                            <th className="p-4 text-left">{tr('Компания', 'Company Name')}</th>
                            <th className="p-4 text-left">{tr('Отрасль', 'Industry')}</th>
                            <th className="p-4 text-left">{tr('Веб-сайт', 'Website')}</th>
                            <th className="p-4 text-left">{tr('Сотрудники', 'Employees')}</th>
                            <th className="p-4 text-left">{tr('Тарифный план', 'Plan')}</th>
                            <th className="p-4 text-left">{tr('Статус', 'Status')}</th>
                            <th className="p-4 text-left">{tr('Действия', 'Actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
                        {filteredCompanies.map((company) => (
                            <tr key={company.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        {company.logo_url ? (
                                            <img
                                                src={company.logo_url}
                                                alt={company.name}
                                                className="w-8 h-8 rounded-lg object-contain border border-slate-200 dark:border-slate-700 bg-white p-0.5 shrink-0"
                                                onError={(e) => {
                                                    (e.target as HTMLElement).style.display = 'none';
                                                }}
                                            />
                                        ) : (
                                            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs border border-blue-100 dark:border-blue-800 shrink-0">
                                                {company.name ? company.name.charAt(0).toUpperCase() : 'C'}
                                            </div>
                                        )}
                                        <button
                                            onClick={() => handleViewProfile(company)}
                                            className="font-medium text-blue-600 dark:text-blue-400 hover:underline text-left truncate max-w-xs"
                                        >
                                            {company.name}
                                        </button>
                                    </div>
                                </td>
                                <td className="p-4 text-slate-600 dark:text-slate-400">{company.industry || '-'}</td>
                                <td className="p-4">
                                    {company.website ? (
                                        <a
                                            href={company.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 dark:text-blue-400 hover:underline"
                                        >
                                            {company.website}
                                        </a>
                                    ) : '-'}
                                </td>
                                <td className="p-4 text-slate-600 dark:text-slate-400">{company.employee_count || '-'}</td>
                                <td className="p-4">
                                    <select
                                        value={company.plan || 'free'}
                                        onChange={(e) => handlePlanChange(company.id, company.name, e.target.value)}
                                        className={`text-xs font-semibold rounded-lg border px-2.5 py-1 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${getPlanBadgeColor(company.plan)}`}
                                        title={tr('Нажмите для изменения тарифа организации', 'Click to change company plan')}
                                    >
                                        <option value="free" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">{tr('Базовый (Free)', 'Free')}</option>
                                        <option value="premium" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">{tr('Премиум (Premium)', 'Premium')}</option>
                                        <option value="enterprise" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">{tr('Корпоративный (Enterprise)', 'Enterprise')}</option>
                                    </select>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${company.is_active
                                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60'
                                        : 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/60'
                                        }`}>
                                        {company.is_active ? (tr('Активна', 'Active')) : (tr('Неактивна', 'Inactive'))}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleEdit(company)}
                                            title={tr('Редактировать', 'Edit')}
                                            className="dark:border-slate-700 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => handleDelete(company.id, company.name)}
                                            title={tr('Удалить', 'Delete')}
                                            className="bg-red-600 hover:bg-red-700 text-white"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredCompanies.length === 0 && (
                    <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                        {tr('Организации не найдены', 'No companies found')}
                    </div>
                )}
            </div>

            {/* Form Modal */}
            {isFormOpen && (
                <CompanyFormModal
                    company={selectedCompany}
                    onClose={() => setIsFormOpen(false)}
                    onSuccess={handleFormSuccess}
                />
            )}

            {/* Profile Modal */}
            {viewProfile && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl text-slate-900 dark:text-slate-100 animate-scale-in">
                        <CompanyProfileCard
                            company={viewProfile}
                            onClose={() => setViewProfile(null)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
