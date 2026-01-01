import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

export default function CompaniesPage() {
    const { t } = useTranslation();
    const [companies, setCompanies] = useState<any[]>([]);

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        try {
            const res = await api.get('/companies/');
            setCompanies(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">{t('companies')}</h1>
                <Button>{t('add_company')}</Button>
            </div>

            <div className="rounded-md border">
                <table className="w-full text-sm">
                    <thead className="border-b bg-gray-50">
                        <tr>
                            <th className="p-4 text-left font-medium">{t('name')}</th>
                            <th className="p-4 text-left font-medium">Domain</th>
                            <th className="p-4 text-left font-medium">{t('status')}</th>
                            <th className="p-4 text-left font-medium">Risk Score</th>
                            <th className="p-4 text-left font-medium">{t('created_at')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {companies.map((company) => (
                            <tr key={company.id} className="border-b last:border-0 hover:bg-gray-50">
                                <td className="p-4 font-medium">{company.name}</td>
                                <td className="p-4 text-gray-500">{company.domain}</td>
                                <td className="p-4">
                                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                        {t('active')}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-24 rounded-full bg-gray-200">
                                            <div
                                                className="h-2 rounded-full bg-blue-600"
                                                style={{ width: `${Math.random() * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-gray-500">
                                            {Math.floor(Math.random() * 100)}/100
                                        </span>
                                    </div>
                                </td>
                                <td className="p-4 text-gray-500">{new Date(company.created_at).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
