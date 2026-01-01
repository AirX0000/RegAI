import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { X } from 'lucide-react';
import api from '../lib/api';

interface TenantFormModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export default function TenantFormModal({ onClose, onSuccess }: TenantFormModalProps) {
    const { toast } = useToast();
    const [formData, setFormData] = useState({
        name: '',
        plan: 'free',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await api.post('/tenants/', formData);
            toast({
                title: "Success",
                description: "Tenant created successfully",
            });
            onSuccess();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.response?.data?.detail || "Failed to create tenant",
            });
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Create Tenant</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Tenant Name <span className="text-red-500">*</span>
                        </label>
                        <Input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            placeholder="Enter tenant name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Plan</label>
                        <select
                            className="w-full rounded-md border p-2"
                            value={formData.plan}
                            onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                        >
                            <option value="free">Free</option>
                            <option value="premium">Premium</option>
                            <option value="enterprise">Enterprise</option>
                        </select>
                    </div>

                    <div className="flex gap-2 pt-4">
                        <Button type="submit" className="flex-1">
                            Create Tenant
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
