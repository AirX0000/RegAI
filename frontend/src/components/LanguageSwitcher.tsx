import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher({ className }: { className?: string } = {}) {
    const { i18n } = useTranslation();

    const toggleLanguage = () => {
        const newLang = i18n.language === 'en' ? 'ru' : 'en';
        i18n.changeLanguage(newLang);
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className={`flex items-center gap-2 ${className || ''}`}
            title="Switch Language"
        >
            <Globe className="h-4 w-4" />
            <span className="uppercase font-semibold">{i18n.language === 'ru' ? 'RU' : 'EN'}</span>
        </Button>
    );
}
