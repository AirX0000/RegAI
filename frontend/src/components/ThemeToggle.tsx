import { useTheme } from '../context/ThemeContext';
import { tr } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Laptop, Check } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function ThemeToggle({ className }: { className?: string } = {}) {
    const { theme, resolvedTheme, setTheme } = useTheme();
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    void i18n.language;
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all ${className || ''}`}
                title={tr("Переключить тему оформления", "Switch theme")}
            >
                {resolvedTheme === 'dark' ? (
                    <Moon className="h-4 w-4 text-violet-400 animate-in spin-in-180 duration-200" />
                ) : (
                    <Sun className="h-4 w-4 text-amber-500 animate-in spin-in-180 duration-200" />
                )}
                <span className="font-semibold text-xs text-slate-700 dark:text-slate-200 hidden 2xl:inline-block">
                    {resolvedTheme === 'dark' ? (tr('Тёмная', 'Dark')) : (tr('Светлая', 'Light'))}
                </span>
            </Button>

            {isOpen && (
                <div className="absolute right-0 mt-1 w-36 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    <button
                        type="button"
                        onClick={() => { setTheme('light'); setIsOpen(false); }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                            theme === 'light' ? 'font-bold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/40' : 'text-slate-700 dark:text-slate-200'
                        }`}
                    >
                        <span className="flex items-center gap-2">
                            <Sun className="h-3.5 w-3.5 text-amber-500" />
                            {tr('Светлая', 'Light')}
                        </span>
                        {theme === 'light' && <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />}
                    </button>
                    <button
                        type="button"
                        onClick={() => { setTheme('dark'); setIsOpen(false); }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                            theme === 'dark' ? 'font-bold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/40' : 'text-slate-700 dark:text-slate-200'
                        }`}
                    >
                        <span className="flex items-center gap-2">
                            <Moon className="h-3.5 w-3.5 text-violet-400" />
                            {tr('Тёмная', 'Dark')}
                        </span>
                        {theme === 'dark' && <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />}
                    </button>
                    <button
                        type="button"
                        onClick={() => { setTheme('system'); setIsOpen(false); }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                            theme === 'system' ? 'font-bold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/40' : 'text-slate-700 dark:text-slate-200'
                        }`}
                    >
                        <span className="flex items-center gap-2">
                            <Laptop className="h-3.5 w-3.5 text-slate-400" />
                            {tr('Системная', 'System')}
                        </span>
                        {theme === 'system' && <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />}
                    </button>
                </div>
            )}
        </div>
    );
}
