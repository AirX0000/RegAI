import { Button } from '@/components/ui/button';
import { X, Building2, Globe, Users, Briefcase, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { tr } from '../lib/i18n';

interface CompanyProfileCardProps {
    company: any;
    onClose: () => void;
}

export default function CompanyProfileCard({ company, onClose }: CompanyProfileCardProps) {
    const { t } = useTranslation();
    return (
        <div>
            <div className="flex justify-between items-center mb-6 pb-2 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                    <Building2 className="h-6 w-6 text-blue-600" />
                    {company.name}
                </h2>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md">
                    <X className="h-6 w-6" />
                </button>
            </div>

            {/* Logo */}
            {company.logo_url && (
                <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 inline-block">
                    <img
                        src={company.logo_url}
                        alt={`${company.name} logo`}
                        className="h-16 w-auto object-contain"
                    />
                </div>
            )}

            {/* Description */}
            {company.description && (
                <div className="mb-6">
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{tr('О компании', 'About', 'Kompaniya haqida')}</h3>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">{company.description}</p>
                </div>
            )}

            {/* Company Details */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                {company.website && (
                    <div className="flex items-start gap-2">
                        <Globe className="h-5 w-5 text-slate-400 mt-0.5" />
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{t('website')}</p>
                            <a
                                href={company.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
                            >
                                {company.website}
                            </a>
                        </div>
                    </div>
                )}

                {company.industry && (
                    <div className="flex items-start gap-2">
                        <Briefcase className="h-5 w-5 text-slate-400 mt-0.5" />
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{t('industry')}</p>
                            <p className="font-medium text-slate-900 dark:text-white text-sm">{company.industry}</p>
                        </div>
                    </div>
                )}

                {company.employee_count && (
                    <div className="flex items-start gap-2">
                        <Users className="h-5 w-5 text-slate-400 mt-0.5" />
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{t('employees')}</p>
                            <p className="font-medium text-slate-900 dark:text-white text-sm">{company.employee_count.toLocaleString()}</p>
                        </div>
                    </div>
                )}

                {company.created_at && (
                    <div className="flex items-start gap-2">
                        <Calendar className="h-5 w-5 text-slate-400 mt-0.5" />
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{t('created')}</p>
                            <p className="font-medium text-slate-900 dark:text-white text-sm">
                                {new Date(company.created_at).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Status & Plan */}
            <div className="mb-6 flex items-center gap-3 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${company.is_active
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60'
                    : 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/60'
                    }`}>
                    {company.is_active ? t('active') : t('inactive')}
                </span>

                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                    company.plan === 'enterprise'
                        ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700'
                        : company.plan === 'premium'
                        ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                }`}>
                    {company.plan === 'enterprise' 
                        ? tr('Тариф: Корпоративный (Enterprise)', 'Plan: Enterprise')
                        : company.plan === 'premium'
                        ? tr('Тариф: Премиум (Premium)', 'Plan: Premium')
                        : tr('Тариф: Базовый (Free)', 'Plan: Free')}
                </span>
            </div>

            {/* Actions */}
            <div className="flex gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                <Button onClick={onClose} variant="outline" className="flex-1 dark:border-slate-700 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200">
                    {t('close')}
                </Button>
            </div>
        </div>
    );
}
