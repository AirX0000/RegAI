import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { FileText, Upload } from 'lucide-react';
import { SmartGrid } from '@/components/dashboard/SmartGrid';

export default function DashboardPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('dashboard')}</h1>
                    <p className="text-gray-500 mt-1">{t('welcome_back')}, {user?.full_name}</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => navigate('/reports/new')}>
                        <FileText className="mr-2 h-4 w-4" /> {t('new_report')}
                    </Button>
                    <Button onClick={() => navigate('/upload')}>
                        <Upload className="mr-2 h-4 w-4" /> {t('upload_balance_sheet')}
                    </Button>
                </div>
            </div>

            {/* Smart Personalized Grid */}
            <SmartGrid />

        </div>
    );
}
