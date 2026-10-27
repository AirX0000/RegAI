import { useRouteError } from 'react-router-dom';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useEffect } from 'react';

export default function RouteErrorBoundary() {
    const error: any = useRouteError();

    const isChunkError =
        error?.name === 'ChunkLoadError' ||
        /Failed to fetch dynamically imported module/i.test(error?.message || '') ||
        /dynamically imported module/i.test(String(error || ''));

    useEffect(() => {
        if (isChunkError) {
            const hasReloaded = sessionStorage.getItem('regai_chunk_reloaded');
            if (!hasReloaded) {
                sessionStorage.setItem('regai_chunk_reloaded', 'true');
                window.location.reload();
            }
        }
    }, [isChunkError]);

    const handleReload = () => {
        sessionStorage.removeItem('regai_chunk_reloaded');
        window.location.reload();
    };

    const handleGoHome = () => {
        window.location.href = '/';
    };

    return (
        <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-4 sm:p-6 font-sans">
            <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl border border-slate-200/80 p-6 sm:p-8 text-center animate-in fade-in zoom-in duration-200">
                <div className="mx-auto w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mb-5 shadow-inner">
                    <AlertTriangle className="w-7 h-7" />
                </div>

                <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
                    {isChunkError ? 'Доступна новая версия приложения' : 'Ошибка загрузки страницы'}
                </h1>
                <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                    {isChunkError
                        ? 'Было выпущено обновление системы. Для применения изменений требуется перезагрузить страницу.'
                        : 'Произошла ошибка при загрузке содержимого страницы. Пожалуйста, обновите страницу.'}
                </p>

                <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={handleReload}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium transition-all shadow-sm hover:shadow"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Обновить страницу
                    </button>
                    <button
                        onClick={handleGoHome}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-sm font-medium transition-all"
                    >
                        <Home className="w-4 h-4" />
                        На главную
                    </button>
                </div>
            </div>
        </div>
    );
}
