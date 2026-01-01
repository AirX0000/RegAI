import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { X } from 'lucide-react';
import api from '../lib/api';

interface CompanyFormModalProps {
    company: any | null;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CompanyFormModal({ company, onClose, onSuccess }: CompanyFormModalProps) {
    const { toast } = useToast();
    const [formData, setFormData] = useState({
        name: '',
        domain: '',
        description: '',
        website: '',
        industry: '',
        employee_count: '',
        logo_url: '',
    });

    useEffect(() => {
        if (company) {
            setFormData({
                name: company.name || '',
                domain: company.domain || '',
                description: company.description || '',
                website: company.website || '',
                industry: company.industry || '',
                employee_count: company.employee_count?.toString() || '',
                logo_url: company.logo_url || '',
            });
        }
    }, [company]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            ...formData,
            employee_count: formData.employee_count ? parseInt(formData.employee_count) : null,
            description: formData.description || null,
            website: formData.website || null,
            industry: formData.industry || null,
            logo_url: formData.logo_url || null,
            domain: formData.domain || null,
        };

        try {
            if (company) {
                // Update
                await api.put(`/companies/${company.id}`, payload);
                toast({
                    title: "Success",
                    description: "Company updated successfully",
                });
            } else {
                // Create
                await api.post('/companies/', payload);
                toast({
                    title: "Success",
                    description: "Company created successfully",
                });
            }
            onSuccess();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.response?.data?.detail || `Failed to ${company ? 'update' : 'create'} company`,
            });
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">
                        {company ? 'Edit Company' : 'Create Company'}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Company Name <span className="text-red-500">*</span>
                        </label>
                        <Input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            placeholder="Enter company name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Domain</label>
                        <Input
                            type="text"
                            value={formData.domain}
                            onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                            placeholder="company.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full border rounded-md p-2 min-h-[100px]"
                            placeholder="Brief description about the company..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Website</label>
                            <Input
                                type="url"
                                value={formData.website}
                                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                placeholder="https://company.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Industry</label>
                            <select
                                className="w-full rounded-md border p-2"
                                value={formData.industry}
                                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                            >
                                <option value="">Select Industry</option>
                                <option value="Banking">Banking</option>
                                <option value="Technology">Technology</option>
                                <option value="Retail">Retail</option>
                                <option value="Manufacturing">Manufacturing</option>
                                <option value="Healthcare">Healthcare</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Employee Count</label>
                            <Input
                                type="number"
                                value={formData.employee_count}
                                onChange={(e) => setFormData({ ...formData, employee_count: e.target.value })}
                                placeholder="e.g., 100"
                                min="1"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Logo URL</label>
                            <Input
                                type="url"
                                value={formData.logo_url}
                                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                                placeholder="https://..."
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                        <Button type="submit" className="flex-1">
                            {company ? 'Update Company' : 'Create Company'}
                        </Button>
                        <Button type="button" onClick={onClose} variant="outline" className="flex-1">
                            Cancel
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
