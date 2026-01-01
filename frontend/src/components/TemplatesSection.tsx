import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import api from '../lib/api';
import { Plus, Trash2, Edit } from 'lucide-react';

export default function TemplatesSection() {
    const [templates, setTemplates] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<any>(null);
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        report_type: 'compliance',
        country_code: 'GB',
        tax_types: ['vat', 'corporate'],
        is_recurring: false,
        recurrence_pattern: ''
    });

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const res = await api.get('/templates/');
            setTemplates(res.data);
        } catch (error) {
            console.error('Failed to fetch templates', error);
        }
    };

    const handleSubmit = async () => {
        try {
            if (editingTemplate) {
                await api.put(`/templates/${editingTemplate.id}`, formData);
                toast({
                    title: "Success",
                    description: "Template updated successfully",
                });
            } else {
                await api.post('/templates/', formData);
                toast({
                    title: "Success",
                    description: "Template created successfully",
                });
            }
            setIsModalOpen(false);
            resetForm();
            fetchTemplates();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.response?.data?.detail || "Failed to save template",
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this template?')) return;

        try {
            await api.delete(`/templates/${id}`);
            toast({
                title: "Success",
                description: "Template deleted",
            });
            fetchTemplates();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to delete template",
            });
        }
    };

    const handleEdit = (template: any) => {
        setEditingTemplate(template);
        setFormData({
            name: template.name,
            description: template.description || '',
            report_type: template.report_type,
            country_code: template.country_code || 'GB',
            tax_types: template.tax_types || ['vat'],
            is_recurring: template.is_recurring,
            recurrence_pattern: template.recurrence_pattern || ''
        });
        setIsModalOpen(true);
    };

    const handleUseTemplate = async (id: string) => {
        try {
            const res = await api.post(`/templates/${id}/use`);
            // Store template data in localStorage for Reports page to use
            localStorage.setItem('templateData', JSON.stringify(res.data));
            toast({
                title: "Template loaded",
                description: "Go to Reports page to create report from this template",
            });
            // Navigate to reports page
            window.location.href = '/reports';
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to use template",
            });
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            report_type: 'compliance',
            country_code: 'GB',
            tax_types: ['vat', 'corporate'],
            is_recurring: false,
            recurrence_pattern: ''
        });
        setEditingTemplate(null);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Report Templates</h2>
                <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Template
                </Button>
            </div>

            {/* Templates List */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {templates.map((template) => (
                    <div key={template.id} className="rounded-lg border bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                                <h3 className="font-semibold">{template.name}</h3>
                                <p className="text-sm text-gray-600">{template.description}</p>
                            </div>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => handleEdit(template)}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <Edit className="h-4 w-4 text-gray-600" />
                                </button>
                                <button
                                    onClick={() => handleDelete(template.id)}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                </button>
                            </div>
                        </div>
                        <div className="space-y-1 text-sm">
                            <p><span className="font-medium">Type:</span> {template.report_type}</p>
                            {template.country_code && (
                                <p><span className="font-medium">Country:</span> {template.country_code}</p>
                            )}
                            {template.is_recurring && (
                                <p className="text-blue-600">
                                    🔄 Recurring: {template.recurrence_pattern}
                                </p>
                            )}
                        </div>
                        <Button
                            onClick={() => handleUseTemplate(template.id)}
                            className="w-full mt-3"
                            size="sm"
                        >
                            Use Template
                        </Button>
                    </div>
                ))}
            </div>

            {templates.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    No templates yet. Create one to get started!
                </div>
            )}

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">
                            {editingTemplate ? 'Edit Template' : 'Create Template'}
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Name *</label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Monthly VAT Return"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <textarea
                                    className="w-full rounded-md border p-2"
                                    rows={2}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Template description"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Report Type *</label>
                                <select
                                    className="w-full rounded-md border p-2"
                                    value={formData.report_type}
                                    onChange={(e) => setFormData({ ...formData, report_type: e.target.value })}
                                >
                                    <option value="compliance">Compliance Report</option>
                                    <option value="audit">Audit Report</option>
                                    <option value="financial">Financial Report</option>
                                    <option value="risk_assessment">Risk Assessment</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Country</label>
                                <select
                                    className="w-full rounded-md border p-2"
                                    value={formData.country_code}
                                    onChange={(e) => setFormData({ ...formData, country_code: e.target.value })}
                                >
                                    <option value="GB">United Kingdom</option>
                                    <option value="US">United States</option>
                                    <option value="DE">Germany</option>
                                    <option value="FR">France</option>
                                    <option value="UZ">Uzbekistan</option>
                                </select>
                            </div>
                            <div>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_recurring}
                                        onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                                    />
                                    <span className="text-sm font-medium">Recurring Report</span>
                                </label>
                            </div>
                            {formData.is_recurring && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">Recurrence</label>
                                    <select
                                        className="w-full rounded-md border p-2"
                                        value={formData.recurrence_pattern}
                                        onChange={(e) => setFormData({ ...formData, recurrence_pattern: e.target.value })}
                                    >
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                        <option value="quarterly">Quarterly</option>
                                        <option value="yearly">Yearly</option>
                                    </select>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2 mt-6">
                            <Button onClick={handleSubmit} className="flex-1">
                                {editingTemplate ? 'Update' : 'Create'}
                            </Button>
                            <Button onClick={() => { setIsModalOpen(false); resetForm(); }} variant="outline" className="flex-1">
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
