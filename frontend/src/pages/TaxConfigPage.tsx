import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../lib/api';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { X, Edit2 } from 'lucide-react';

export default function TaxConfigPage() {
    const { t } = useTranslation();
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
            setCountries(res.data);
        } catch (error) {
            console.error('Failed to fetch countries', error);
        }
    };

    const fetchTaxRates = async (countryCode: string) => {
        try {
            const res = await api.get(`/tax-rates/${countryCode}`);
            setTaxRates(res.data);
        } catch (error) {
            console.error('Failed to fetch tax rates', error);
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
        const labels: any = {
            'vat': t('vat_standard'),
            'vat_reduced': t('vat_reduced'),
            'gst': t('gst'),
            'corporate': t('corporate_tax'),
            'corporate_small': t('corporate_tax_small'),
            'income_top': t('income_tax_top'),
            'consumption': t('consumption_tax'),
            'withholding': t('withholding_tax'),
            'payroll': t('payroll_tax')
        };
        return labels[type] || type;
    };

    const formatRate = (rate: any) => {
        return parseFloat(rate).toString();
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">{t('tax_configuration')}</h1>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Country Selection */}
                <div className="rounded-lg border p-6 bg-white shadow-sm">
                    <h2 className="text-xl font-semibold mb-4">{t('select_country')}</h2>
                    <div className="space-y-2">
                        {countries.map((country) => (
                            <button
                                key={country.code}
                                onClick={() => handleCountrySelect(country.code)}
                                className={`w-full text-left p-3 rounded-md border transition-colors ${selectedCountry === country.code
                                    ? 'bg-blue-50 border-blue-500'
                                    : 'hover:bg-gray-50'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">{country.name}</span>
                                    <span className="text-sm text-gray-500">{country.code}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tax Rates Display */}
                <div className="rounded-lg border p-6 bg-white shadow-sm">
                    <h2 className="text-xl font-semibold mb-4">{t('current_tax_rates')}</h2>
                    {!taxRates ? (
                        <p className="text-gray-500">{t('select_country_to_view_rates')}</p>
                    ) : (
                        <div className="space-y-4">
                            <div className="mb-4">
                                <h3 className="text-lg font-semibold">{taxRates.country_name}</h3>
                                <p className="text-sm text-gray-500">{taxRates.rates.length} {t('tax_rates_configured')}</p>
                            </div>
                            <div className="space-y-3">
                                {taxRates.rates.map((rate: any) => (
                                    <div key={rate.id} className="p-3 bg-gray-50 rounded-md group relative">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-medium">{getTaxTypeLabel(rate.tax_type)}</span>
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl font-bold text-blue-600">{formatRate(rate.rate)}%</span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => handleEditClick(rate)}
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        {rate.description && (
                                            <p className="text-sm text-gray-600">{rate.description}</p>
                                        )}
                                        <div className="text-xs text-gray-500 mt-2">
                                            {t('effective_from_date')}: {new Date(rate.effective_from).toLocaleDateString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Info Box */}
            <div className="rounded-lg border p-6 bg-blue-50 border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">ℹ️ {t('about_tax_rates')}</h3>
                <p className="text-sm text-blue-800">
                    {t('tax_rates_info')} {countries.length} {t('countries_with_data')}
                </p>
            </div>

            {/* Edit Dialog */}
            <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
                    <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-6 shadow-lg duration-200 sm:rounded-lg">
                        <div className="flex flex-col space-y-1.5 text-center sm:text-left">
                            <Dialog.Title className="text-lg font-semibold leading-none tracking-tight">
                                {t('edit_tax_rate')}
                            </Dialog.Title>
                            <Dialog.Description className="text-sm text-gray-500">
                                {t('update_tax_rate_for')} {editingRate && getTaxTypeLabel(editingRate.tax_type)}.
                            </Dialog.Description>
                        </div>

                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <label htmlFor="rate" className="text-right text-sm font-medium">
                                    {t('rate_percent')}
                                </label>
                                <Input
                                    id="rate"
                                    value={editForm.rate}
                                    onChange={(e) => setEditForm({ ...editForm, rate: e.target.value })}
                                    className="col-span-3"
                                    type="number"
                                    step="0.01"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <label htmlFor="description" className="text-right text-sm font-medium">
                                    {t('description')}
                                </label>
                                <Input
                                    id="description"
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                    className="col-span-3"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                {t('cancel')}
                            </Button>
                            <Button onClick={handleUpdate}>
                                {t('save_changes')}
                            </Button>
                        </div>

                        <Dialog.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                            <X className="h-4 w-4" />
                            <span className="sr-only">Close</span>
                        </Dialog.Close>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </div>
    );
}
