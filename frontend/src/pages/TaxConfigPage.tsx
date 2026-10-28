import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { tr } from '../lib/i18n';
import api from '../lib/api';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { X, Edit2 } from 'lucide-react';

export default function TaxConfigPage() {
    const { t, i18n } = useTranslation();
    const isRu = (i18n.language || 'ru').toLowerCase().startsWith('ru');
    const [countries, setCountries] = useState<any[]>([]);
    const [selectedCountry, setSelectedCountry] = useState('');
    const [taxRates, setTaxRates] = useState<any>(null);

    // Edit State
    const [editingRate, setEditingRate] = useState<any>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editForm, setEditForm] = useState({
        rate: '',
        description: ''
    });

    useEffect(() => {
        fetchCountries();
    }, []);

    const fetchCountries = async () => {
        try {
            const res = await api.get('/tax-rates/countries');
            const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.items) ? res.data.items : []);
            setCountries(data);
            if (data.length > 0 && !selectedCountry) {
                const first = data[0];
                const firstCode = typeof first === 'string' ? first : (first.code || 'UZ');
                setSelectedCountry(firstCode);
                fetchTaxRates(firstCode);
            }
        } catch (error) {
            console.error('Failed to fetch countries', error);
            setCountries([]);
        }
    };

    const fetchTaxRates = async (countryCode: string) => {
        try {
            const res = await api.get(`/tax-rates/${countryCode}`);
            setTaxRates(res?.data || null);
        } catch (error) {
            console.error('Failed to fetch tax rates', error);
            setTaxRates(null);
        }
    };

    const handleCountrySelect = (countryCode: string) => {
        setSelectedCountry(countryCode);
        fetchTaxRates(countryCode);
    };

    const handleEditClick = (rate: any) => {
        setEditingRate(rate);
        setEditForm({
            rate: rate.rate,
            description: rate.description || ''
        });
        setIsDialogOpen(true);
    };

    const handleUpdate = async () => {
        if (!editingRate) return;

        try {
            await api.put(`/tax-rates/${editingRate.id}`, {
                rate: parseFloat(editForm.rate),
                description: editForm.description
            });

            // Refresh rates
            fetchTaxRates(selectedCountry);
            setIsDialogOpen(false);
        } catch (error) {
            console.error('Failed to update tax rate', error);
            // Ideally show a toast here
        }
    };

    const getTaxTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            'vat': tr('НДС (Стандартная ставка)', 'VAT (Standard Rate)', 'QQS (Standart stavka)'),
            'vat_reduced': tr('НДС (Льготная ставка)', 'VAT (Reduced Rate)', 'QQS (Imtiyozli stavka)'),
            'gst': tr('GST (Налог на товары и услуги)', 'GST (Goods and Services Tax)', 'GST (Tovarlar va xizmatlar solig\'i)'),
            'corporate': tr('Корпоративный налог на прибыль (CIT)', 'Corporate Income Tax (CIT)', 'Korporativ foyda solig\'i (CIT)'),
            'corporate_small': tr('Налог для малого бизнеса / СЭЗ', 'Small Business Tax / SEZ', 'Kichik biznes solig\'i / EIZ'),
            'income': tr('Подоходный налог (НДФЛ)', 'Personal Income Tax (PIT)', 'Jismoniy shaxslar daromad solig\'i (JSHDS)'),
            'income_top': tr('НДФЛ (Повышенная ставка)', 'PIT (Higher Bracket)', 'JSHDS (Yuqori stavka)'),
            'consumption': tr('Налог на цифровые услуги / Потребление', 'Digital Services / Consumption Tax', 'Raqamli xizmatlar / Iste\'mol solig\'i'),
            'withholding': tr('Налог у источника выплат (WHT)', 'Withholding Tax (WHT)', 'To\'lov manbaidan olinadigan soliq (WHT)'),
            'payroll': tr('Страховые взносы / ФОТ', 'Payroll / Social Insurance', 'Sug\'urta badallari / Ish haqi fondi'),
            'social': tr('Социальный налог / Взносы', 'Social Tax / Contributions', 'Ijtimoiy soliq / Badallar'),
            'property': tr('Налог на имущество организаций', 'Corporate Property Tax', 'Yuridik shaxslar mol-mulk solig\'i'),
            'turnover': tr('Налог с оборота', 'Turnover Tax', 'Aylanmadan olinadigan soliq'),
        };
        return labels[type] || type.toUpperCase();
    };

    const formatRate = (rate: any) => {
        const num = parseFloat(rate);
        return isNaN(num) ? '0' : num.toString();
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t('tax_configuration')}</h1>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Country Selection */}
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-slate-100">
                    <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">{t('select_country')}</h2>
                    <div className="space-y-2">
                        {Array.isArray(countries) && countries.map((country: any, idx: number) => {
                            const code = typeof country === 'string' ? country : (country.code || `country-${idx}`);
                            const name = typeof country === 'string' ? country : (country.name || country.code || `Страна ${idx + 1}`);
                            return (
                                <button
                                    key={code}
                                    onClick={() => handleCountrySelect(code)}
                                    className={`w-full text-left p-3 rounded-md border transition-colors ${selectedCountry === code
                                        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 shadow-sm'
                                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-slate-900 dark:text-slate-100">{name}</span>
                                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">{code}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Tax Rates Display */}
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-slate-100">
                    <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">{t('current_tax_rates')}</h2>
                    {!taxRates ? (
                        <p className="text-slate-500 dark:text-slate-400">{t('select_country_to_view_rates')}</p>
                    ) : (
                        <div className="space-y-4">
                            <div className="mb-4">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{taxRates.country_name || taxRates.country || selectedCountry}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{(taxRates.rates?.length || 0)} {t('tax_rates_configured')}</p>
                            </div>
                            <div className="space-y-3">
                                {Array.isArray(taxRates.rates) && taxRates.rates.map((rate: any) => (
                                    <div key={rate.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-md group relative">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-medium text-slate-900 dark:text-slate-100">{getTaxTypeLabel(rate.tax_type)}</span>
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatRate(rate.rate)}%</span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                                                    onClick={() => handleEditClick(rate)}
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        {rate.description && (
                                            <p className="text-sm text-slate-600 dark:text-slate-300">{rate.description}</p>
                                        )}
                                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                            {t('effective_from_date')}: {rate.effective_from ? new Date(rate.effective_from).toLocaleDateString(isRu ? 'ru-RU' : 'en-US') : (tr('Бессрочно / Актуально', 'Indefinite / Current'))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Info Box */}
            <div className="rounded-lg border p-6 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/60">
                <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">ℹ️ {t('about_tax_rates')}</h3>
                <p className="text-sm text-blue-800 dark:text-blue-200/90">
                    {t('tax_rates_info')} {countries.length} {t('countries_with_data')}
                </p>
            </div>

            {/* Edit Dialog */}
            <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50" />
                    <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl duration-200 sm:rounded-lg text-slate-900 dark:text-slate-100">
                        <div className="flex flex-col space-y-1.5 text-center sm:text-left">
                            <Dialog.Title className="text-lg font-semibold leading-none tracking-tight text-slate-900 dark:text-white">
                                {t('edit_tax_rate')}
                            </Dialog.Title>
                            <Dialog.Description className="text-sm text-slate-500 dark:text-slate-400">
                                {t('update_tax_rate_for')} {editingRate && getTaxTypeLabel(editingRate.tax_type)}.
                            </Dialog.Description>
                        </div>

                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <label htmlFor="rate" className="text-right text-sm font-medium text-slate-700 dark:text-slate-300">
                                    {t('rate_percent')}
                                </label>
                                <Input
                                    id="rate"
                                    value={editForm.rate}
                                    onChange={(e) => setEditForm({ ...editForm, rate: e.target.value })}
                                    className="col-span-3 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                                    type="number"
                                    step="0.01"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <label htmlFor="description" className="text-right text-sm font-medium text-slate-700 dark:text-slate-300">
                                    {t('description')}
                                </label>
                                <Input
                                    id="description"
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                    className="col-span-3 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                            <Button variant="outline" className="border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200" onClick={() => setIsDialogOpen(false)}>
                                {t('cancel')}
                            </Button>
                            <Button onClick={handleUpdate} className="bg-blue-600 hover:bg-blue-700 text-white">
                                {t('save_changes')}
                            </Button>
                        </div>

                        <Dialog.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">
                            <X className="h-4 w-4" />
                            <span className="sr-only">Close</span>
                        </Dialog.Close>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </div>
    );
}
