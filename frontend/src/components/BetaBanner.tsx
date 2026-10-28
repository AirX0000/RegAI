import { useState, useEffect } from 'react';
import { tr } from '@/lib/i18n';
import { useTranslation } from 'react-i18next';
import { Sparkles, X, Info } from 'lucide-react';

export function BetaBanner() {
    const { i18n } = useTranslation();
    void i18n.language;
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const isDismissed = localStorage.getItem('axiaris_beta_banner_dismissed');
        if (!isDismissed) {
            setIsVisible(true);
        }
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem('axiaris_beta_banner_dismissed', 'true');
    };

    if (!isVisible) return null;

    return (
        <aside 
            aria-label={tr('Уведомление о бета-тестировании', 'Beta Testing Notice')}
            className="w-full bg-gradient-to-r from-amber-500/10 via-cyan-500/10 to-blue-500/10 dark:from-amber-950/40 dark:via-cyan-950/30 dark:to-blue-950/40 border-b border-amber-500/20 dark:border-amber-400/20 backdrop-blur-xs transition-all"
        >
            <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-500/20 dark:bg-amber-400/20 text-amber-600 dark:text-amber-400 shrink-0">
                        <Sparkles className="h-3 w-3" />
                    </span>
                    <p className="text-slate-700 dark:text-slate-300 truncate">
                        <strong className="font-semibold text-amber-700 dark:text-amber-300 mr-1.5">
                            {tr('Режим бета-тестирования (v0.9.4):', 'Beta Testing Preview (v0.9.4):')}
                        </strong>
                        <span className="hidden sm:inline">
                            {tr('Платформа работает в режиме публичного бета-тестирования. Модули трансформации НСБУ в МСФО и AI-аудита ISA 700 полностью функциональны.', 'The platform is currently operating in beta mode. All financial convergence ledgers, IFRS mappings and ISA 700 AI audits are fully active.')
                            }
                        </span>
                        <span className="sm:hidden">
                            {tr('Платформа работает в режиме бета-тестирования.', 'Platform is currently in active Beta mode.')}
                        </span>
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        <Info className="h-3 w-3 text-cyan-500" />
                        <span>{tr('Движок нулевого расхождения', 'Deterministic Zero-Delta Engine')}</span>
                    </span>
                    <button
                        type="button"
                        onClick={handleDismiss}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors"
                        aria-label={tr('Закрыть уведомление', 'Dismiss banner')}
                        title={tr('Скрыть', 'Dismiss')}
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>
        </aside>
    );
}
