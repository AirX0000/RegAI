import { Button } from '@/components/ui/button';
import { X, Building2, Globe, Users, Briefcase, Calendar } from 'lucide-react';

interface CompanyProfileCardProps {
    company: any;
    onClose: () => void;
}

export default function CompanyProfileCard({ company, onClose }: CompanyProfileCardProps) {
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Building2 className="h-6 w-6" />
                    {company.name}
                </h2>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                    <X className="h-6 w-6" />
                </button>
            </div>

            {/* Logo */}
            {company.logo_url && (
                <div className="mb-6">
                    <img
                        src={company.logo_url}
                        alt={`${company.name} logo`}
                        className="h-20 w-auto object-contain"
                    />
                </div>
            )}

            {/* Description */}
            {company.description && (
                <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">About</h3>
                    <p className="text-gray-600">{company.description}</p>
                </div>
            )}

            {/* Company Details */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                {company.website && (
                    <div className="flex items-start gap-2">
                        <Globe className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                            <p className="text-sm text-gray-500">Website</p>
                            <a
                                href={company.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                            >
                                {company.website}
                            </a>
                        </div>
                    </div>
                )}

                {company.industry && (
                    <div className="flex items-start gap-2">
                        <Briefcase className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                            <p className="text-sm text-gray-500">Industry</p>
                            <p className="font-medium">{company.industry}</p>
                        </div>
                    </div>
                )}

                {company.employee_count && (
                    <div className="flex items-start gap-2">
                        <Users className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                            <p className="text-sm text-gray-500">Employees</p>
                            <p className="font-medium">{company.employee_count.toLocaleString()}</p>
                        </div>
                    </div>
                )}

                {company.created_at && (
                    <div className="flex items-start gap-2">
                        <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                            <p className="text-sm text-gray-500">Created</p>
                            <p className="font-medium">
                                {new Date(company.created_at).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Status */}
            <div className="mb-6">
                <span className={`px-3 py-1 rounded-full text-sm ${company.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                    }`}>
                    {company.is_active ? 'Active' : 'Inactive'}
                </span>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
                <Button onClick={onClose} className="flex-1">
                    Close
                </Button>
            </div>
        </div>
    );
}
