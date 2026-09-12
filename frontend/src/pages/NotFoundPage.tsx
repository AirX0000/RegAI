import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Search, ArrowLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
    const navigate = useNavigate();
    const { i18n, t } = useTranslation();
    const isRu = (i18n.language || 'ru').toLowerCase().startsWith('ru');

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
            {/* Background glow */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[60%] h-[40%] rounded-full bg-blue-600/5 blur-[160px] pointer-events-none" />

            <div className="relative z-10 max-w-md w-full text-center">
                {/* Logo */}
                <div className="flex items-center justify-center gap-2.5 mb-10">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <span className="text-white font-black text-sm">R</span>
                    </div>
                    <span className="text-xl font-black tracking-tight text-white">
                        Reg<span className="text-blue-500">AI</span>
                    </span>
                </div>

                {/* 404 Code */}
                <div className="relative mb-6">
                    <div className="text-[8rem] font-black leading-none text-transparent bg-clip-text bg-gradient-to-b from-slate-700 to-slate-900 select-none">
                        404
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Search className="w-14 h-14 text-slate-700" />
                    </div>
                </div>

                {/* Message */}
                <h1 className="text-2xl font-bold text-white mb-2">
                    {isRu ? 'Страница не найдена' : 'Page Not Found'}
                </h1>
                <p className="text-slate-400 text-sm leading-relaxed mb-8">
                    {isRu 
                        ? 'Страница, которую вы ищете, не существует или была перемещена. Проверьте адрес или воспользуйтесь навигацией.'
                        : 'The page you are looking for does not exist or has been moved. Please verify the URL or use navigation.'
                    }
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                        onClick={() => navigate(-1)}
                        variant="outline"
                        className="border-slate-700 bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        {isRu ? 'Назад' : 'Back'}
                    </Button>
                    <Button
                        onClick={() => navigate('/')}
                        className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/25"
                    >
                        <Home className="w-4 h-4 mr-2" />
                        {isRu ? 'На главную' : 'Home'}
                    </Button>
                    <Button
                        onClick={() => navigate('/guide')}
                        variant="outline"
                        className="border-slate-700 bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white"
                    >
                        <FileText className="w-4 h-4 mr-2" />
                        {t('nav_documentation', isRu ? 'Документация' : 'Documentation')}
                    </Button>
                </div>

                {/* Bottom hint */}
                <p className="mt-8 text-xs text-slate-600">
                    RegAI — Smart Compliance Platform • Если проблема повторяется, обратитесь к администратору
                </p>
            </div>
        </div>
    );
}
