import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import api from '../lib/api';
import { CheckCircle, Circle, AlertCircle } from 'lucide-react';

interface ChecklistProps {
    reportId: string;
    onClose: () => void;
    onSubmit: () => void;
}

export default function PreSubmissionChecklist({ reportId, onClose, onSubmit }: ChecklistProps) {
    const [checklist, setChecklist] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        fetchChecklist();
    }, [reportId]);

    const fetchChecklist = async () => {
        try {
            const res = await api.get(`/reports/${reportId}/checklist`);
            setChecklist(res.data);
        } catch (error) {
            console.error('Failed to fetch checklist', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = () => {
        if (!checklist?.can_submit) {
            toast({
                variant: "destructive",
                title: "Cannot Submit",
                description: "Please complete all required items before submitting",
            });
            return;
        }
        onSubmit();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!checklist) {
        return <div className="text-center p-8 text-gray-500">Failed to load checklist</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Pre-Submission Checklist</h3>
                <div className="text-sm text-gray-600">
                    {checklist.completed_items}/{checklist.total_items} completed
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${checklist.completion_percentage}%` }}
                ></div>
            </div>

            {/* Checklist Items */}
            <div className="space-y-2">
                {checklist.items.map((item: any) => (
                    <div
                        key={item.id}
                        className={`flex items-start gap-3 p-3 rounded-md border ${item.completed
                                ? 'bg-green-50 border-green-200'
                                : item.required
                                    ? 'bg-red-50 border-red-200'
                                    : 'bg-gray-50 border-gray-200'
                            }`}
                    >
                        {item.completed ? (
                            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        ) : item.required ? (
                            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                        ) : (
                            <Circle className="h-5 w-5 text-gray-400 mt-0.5" />
                        )}
                        <div className="flex-1">
                            <p className="font-medium text-sm">{item.label}</p>
                            {item.required && !item.completed && (
                                <p className="text-xs text-red-600 mt-1">Required</p>
                            )}
                            {!item.required && (
                                <p className="text-xs text-gray-500 mt-1">Optional</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Warning if can't submit */}
            {!checklist.can_submit && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">
                        ⚠️ Complete all required items ({checklist.completed_required}/{checklist.required_items}) before submitting
                    </p>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
                <Button
                    onClick={handleSubmit}
                    disabled={!checklist.can_submit}
                    className="flex-1"
                >
                    {checklist.can_submit ? 'Submit Report' : 'Complete Required Items'}
                </Button>
                <Button onClick={onClose} variant="outline" className="flex-1">
                    Cancel
                </Button>
            </div>
        </div>
    );
}
