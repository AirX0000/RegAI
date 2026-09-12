import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Globe, Check } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function LanguageSwitcher({ className }: { className?: string } = {}) {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const activeLang = (i18n.language || 'ru').toLowerCase().startsWith('en') ? 'en' : 'ru';

    const setLanguage = (lang: 'ru' | 'en') => {
        i18n.changeLanguage(lang);
        try {
            localStorage.setItem('i18nextLng', lang);
        } catch {}
        setIsOpen(false);
    };

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
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition-all ${className || ''}`}
                title="Сменить язык / Switch Language"
            >
                <Globe className="h-4 w-4 text-slate-500" />
                <span className="font-bold text-xs tracking-wider uppercase text-slate-700">
                    {activeLang.toUpperCase()}
                </span>
            </Button>

            {isOpen && (
                <div className="absolute right-0 mt-1 w-36 rounded-xl bg-white border border-slate-200 shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    <button
                        type="button"
                        onClick={() => setLanguage('ru')}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-slate-50 transition-colors ${
                            activeLang === 'ru' ? 'font-bold text-blue-600 bg-blue-50/50' : 'text-slate-700'
                        }`}
                    >
                        <span className="flex items-center gap-2">🇷🇺 Русский</span>
                        {activeLang === 'ru' && <Check className="h-3.5 w-3.5 text-blue-600" />}
                    </button>
                    <button
                        type="button"
                        onClick={() => setLanguage('en')}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-slate-50 transition-colors ${
                            activeLang === 'en' ? 'font-bold text-blue-600 bg-blue-50/50' : 'text-slate-700'
                        }`}
                    >
                        <span className="flex items-center gap-2">🇬🇧 English</span>
                        {activeLang === 'en' && <Check className="h-3.5 w-3.5 text-blue-600" />}
                    </button>
                </div>
            )}
        </div>
    );
}
