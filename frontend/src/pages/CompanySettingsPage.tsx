import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Building2, Save, Loader2 } from 'lucide-react';

export default function CompanySettingsPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [company, setCompany] = useState<any>(null);
    const [formData, setFormData] = useState({
        description: '',
        website: '',
        industry: '',
        employee_count: '',
        logo_url: ''
    });

    const companyId = (user as any)?.company_id; // Define companyId at a higher scope

    useEffect(() => {
        const fetchCompany = async () => {
            console.log('CompanySettingsPage - user:', user);
            console.log('CompanySettingsPage - companyId:', companyId);

            if (!companyId) {
                console.log('No company_id found for user');
                setLoading(false);
                return;
            }

            try {
                const response = await api.get(`/companies/${companyId}`);
                setCompany(response.data);
                setFormData({
                    description: response.data.description || '',
                    website: response.data.website || '',
                    industry: response.data.industry || '',
                    employee_count: response.data.employee_count?.toString() || '',
                    logo_url: response.data.logo_url || ''
                });
            } catch (error) {
                console.error('Failed to fetch company', error);
                toast({
                    title: "Error",
                    description: "Failed to load company information",
                    variant: "destructive"
                });
            } finally {
                setLoading(false);
            }
        };

        fetchCompany();
    }, [user?.company_id, toast]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const updateData = {
                description: formData.description || null,
                website: formData.website || null,
                industry: formData.industry || null,
                employee_count: formData.employee_count ? parseInt(formData.employee_count) : null,
                logo_url: formData.logo_url || null
            };

            await api.put(`/companies/${companyId}/profile`, updateData);

            toast({
                title: "Success",
                description: "Company information updated successfully",
            });

            // Refresh company data
            const response = await api.get(`/companies/${companyId}`);
            setCompany(response.data);
        } catch (error: any) {
            console.error('Failed to update company', error);
            toast({
                title: "Error",
                description: error.response?.data?.detail || "Failed to update company information",
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    if (loading) {
        return (
            <div className="p-8 flex justify-center items-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!company) {
        return (
            <div className="p-8">
                <Card>
                    <CardContent className="p-6">
                        <p className="text-gray-500">No company information found.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Company Settings</h1>
                <p className="text-gray-500 mt-1">Manage your company's information and profile</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Company Profile
                    </CardTitle>
                    <CardDescription>
                        Update your company's public information
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Company Name (Read-only) */}
                        <div className="space-y-2">
                            <Label htmlFor="name">Company Name</Label>
                            <Input
                                id="name"
                                value={company.name}
                                disabled
                                className="bg-gray-50"
                            />
                            <p className="text-xs text-gray-500">Company name cannot be changed. Contact support if needed.</p>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                className="w-full min-h-[100px] px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Brief description of your company..."
                            />
                        </div>

                        {/* Website */}
                        <div className="space-y-2">
                            <Label htmlFor="website">Website</Label>
                            <Input
                                id="website"
                                type="url"
                                value={formData.website}
                                onChange={(e) => handleChange('website', e.target.value)}
                                placeholder="https://example.com"
                            />
                        </div>

                        {/* Industry */}
                        <div className="space-y-2">
                            <Label htmlFor="industry">Industry</Label>
                            <select
                                id="industry"
                                value={formData.industry}
                                onChange={(e) => handleChange('industry', e.target.value)}
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select an industry</option>
                                <option value="Technology">Technology</option>
                                <option value="Finance">Finance</option>
                                <option value="Healthcare">Healthcare</option>
                                <option value="Manufacturing">Manufacturing</option>
                                <option value="Retail">Retail</option>
                                <option value="Education">Education</option>
                                <option value="Consulting">Consulting</option>
                                <option value="Real Estate">Real Estate</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        {/* Employee Count */}
                        <div className="space-y-2">
                            <Label htmlFor="employee_count">Employee Count</Label>
                            <Input
                                id="employee_count"
                                type="number"
                                min="1"
                                value={formData.employee_count}
                                onChange={(e) => handleChange('employee_count', e.target.value)}
                                placeholder="e.g., 50"
                            />
                        </div>

                        {/* Logo URL */}
                        <div className="space-y-2">
                            <Label htmlFor="logo_url">Logo URL</Label>
                            <Input
                                id="logo_url"
                                type="url"
                                value={formData.logo_url}
                                onChange={(e) => handleChange('logo_url', e.target.value)}
                                placeholder="https://example.com/logo.png"
                            />
                            {formData.logo_url && (
                                <div className="mt-2">
                                    <p className="text-xs text-gray-500 mb-2">Logo Preview:</p>
                                    <img
                                        src={formData.logo_url}
                                        alt="Company logo preview"
                                        className="h-16 w-auto border rounded"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setFormData({
                                        description: company.description || '',
                                        website: company.website || '',
                                        industry: company.industry || '',
                                        employee_count: company.employee_count?.toString() || '',
                                        logo_url: company.logo_url || ''
                                    });
                                }}
                                disabled={saving}
                            >
                                Reset
                            </Button>
                            <Button type="submit" disabled={saving}>
                                {saving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Additional Info Card */}
            <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                    <CardTitle className="text-blue-900 text-sm">ℹ️ Information</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-blue-900">
                    <ul className="list-disc ml-5 space-y-1">
                        <li>Changes to company information are visible to all users in your organization</li>
                        <li>The company name is locked and cannot be changed via this interface</li>
                        <li>Logo images should be publicly accessible URLs (HTTPS recommended)</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
