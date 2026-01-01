import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '../context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Edit, Trash2, Building2 } from 'lucide-react';
import api from '../lib/api';
import CompanyFormModal from '../components/CompanyFormModal';
import CompanyProfileCard from '../components/CompanyProfileCard';

export default function CompaniesManagementPage() {
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
            setCompanies(res.data);
        } catch (error) {
            console.error('Failed to fetch companies', error);
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
        if (!confirm(`Are you sure you want to delete "${companyName}"? This will soft-delete the company.`)) {
            return;
        }

        try {
            await api.delete(`/companies/${companyId}`);
            toast({
                title: "Success",
                description: "Company deleted successfully",
            });
            fetchCompanies();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.response?.data?.detail || "Failed to delete company",
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

    const filteredCompanies = companies.filter(company =>
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (company.industry && company.industry.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (user?.role !== 'superadmin') {
        return (
            <div className="p-8 text-center">
                <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
                <p className="mt-2 text-gray-600">Only superadmins can access company management.</p>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Building2 className="h-8 w-8" />
                        Company Management
                    </h1>
                    <p className="text-gray-600 mt-1">Manage all companies in the system</p>
                </div>
                <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Company
                </Button>
            </div>

            {/* Search and Filter */}
            <div className="mb-6 flex items-center gap-4">
                <Input
                    type="text"
                    placeholder="Search companies by name or industry..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-md"
                />
                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        id="showInactive"
                        checked={showInactive}
                        onChange={(e) => setShowInactive(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label
                        htmlFor="showInactive"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                        Show Inactive
                    </label>
                </div>
            </div>

            {/* Companies Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4 text-left">Company Name</th>
                            <th className="p-4 text-left">Industry</th>
                            <th className="p-4 text-left">Website</th>
                            <th className="p-4 text-left">Employees</th>
                            <th className="p-4 text-left">Status</th>
                            <th className="p-4 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCompanies.map((company) => (
                            <tr key={company.id} className="border-b hover:bg-gray-50">
                                <td className="p-4">
                                    <button
                                        onClick={() => handleViewProfile(company)}
                                        className="font-medium text-blue-600 hover:underline"
                                    >
                                        {company.name}
                                    </button>
                                </td>
                                <td className="p-4">{company.industry || '-'}</td>
                                <td className="p-4">
                                    {company.website ? (
                                        <a
                                            href={company.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline"
                                        >
                                            {company.website}
                                        </a>
                                    ) : '-'}
                                </td>
                                <td className="p-4">{company.employee_count || '-'}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs ${company.is_active
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                        }`}>
                                        {company.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleEdit(company)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => handleDelete(company.id, company.name)}
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
                    <div className="text-center py-8 text-gray-500">
                        No companies found
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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
