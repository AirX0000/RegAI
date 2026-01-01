import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import {
    Download,
    Calendar,
    MapPin,
    ExternalLink,
    Copy,
    Check,
    X,
    Filter,
    Loader2,
    Plus
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

type SortOption = 'relevance' | 'title-asc' | 'title-desc' | 'date-newest' | 'date-oldest' | 'jurisdiction-asc' | 'jurisdiction-desc' | 'code-asc' | 'code-desc';

import { useTranslation } from 'react-i18next';

export default function RegulationsPage() {
    const { t } = useTranslation();
    const [results, setResults] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState("All");
    const [sortBy, setSortBy] = useState<SortOption>('relevance');
    const [selectedRegulations, setSelectedRegulations] = useState<Set<string>>(new Set());
    const [selectedRegulation, setSelectedRegulation] = useState<any | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [jurisdictionFilter, setJurisdictionFilter] = useState<string>('');
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');
    const [showFilters, setShowFilters] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [availableJurisdictions, setAvailableJurisdictions] = useState<string[]>([]);
    const [showSubscribedOnly, setShowSubscribedOnly] = useState(false);
    const [relatedRegulations, setRelatedRegulations] = useState<any[]>([]);
    const [isLoadingRelated, setIsLoadingRelated] = useState(false);

    const { register, handleSubmit } = useForm();
    const { toast } = useToast();

    // ... existing code ...

    const openDetailModal = async (regulation: any) => {
        setSelectedRegulation(regulation);
        setIsModalOpen(true);
        setRelatedRegulations([]);

        // Fetch related regulations
        if (regulation.metadata.title) {
            setIsLoadingRelated(true);
            try {
                // Search for regulations with similar title, excluding the current one
                const res = await api.get('/regulations/search', {
                    params: {
                        query: regulation.metadata.title,
                        limit: 4
                    }
                });

                // Filter out current regulation and limit to 3
                const related = res.data
                    .filter((r: any) => r.id !== regulation.id)
                    .slice(0, 3);

                setRelatedRegulations(related);
            } catch (error) {
                console.error("Failed to fetch related regulations", error);
            } finally {
                setIsLoadingRelated(false);
            }
        }
    };

    const tabs = ["All", "Tax", "IFRS", "ESG", "Privacy", "Security", "Finance", "Healthcare", "Labor", "Environmental", "AML", "Consumer"];

    useEffect(() => {
        fetchRegulations();
        fetchJurisdictions();
    }, []);

    const fetchJurisdictions = async () => {
        try {
            const res = await api.get('/regulations/jurisdictions');
            setAvailableJurisdictions(res.data.jurisdictions || []);
        } catch (error) {
            console.error("Failed to fetch jurisdictions", error);
        }
    };

    const fetchRegulations = async () => {
        setIsLoading(true);
        try {
            setSearchQuery("");
            const res = await api.get('/regulations/search', { params: { query: "", limit: 200 } });
            setResults(res.data);
        } catch (error) {
            console.error("Failed to fetch regulations", error);
        } finally {
            setIsLoading(false);
        }
    };

    const onSearch = async (data: any) => {
        setIsLoading(true);
        try {
            setSearchQuery(data.query);
            const res = await api.get('/regulations/search', { params: { query: data.query } });
            setResults(res.data);
        } catch (error) {
            toast({
                variant: "destructive",
                title: t('search_failed'),
                description: t('could_not_fetch_regulations'),
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Apply filters and sorting
    const getFilteredAndSortedResults = () => {
        let filtered = results.filter(item => {
            // Tab filter
            if (activeTab !== "All") {
                const category = item.metadata.category || "";
                const matchesTab = category.toLowerCase() === activeTab.toLowerCase() ||
                    item.metadata.code.includes(activeTab) ||
                    item.metadata.title.includes(activeTab);
                if (!matchesTab) return false;
            }

            // Jurisdiction filter
            if (jurisdictionFilter && item.metadata.jurisdiction) {
                if (!item.metadata.jurisdiction.toLowerCase().includes(jurisdictionFilter.toLowerCase())) {
                    return false;
                }
            }

            // Date range filter
            if (dateFrom || dateTo) {
                const effectiveDate = item.metadata.effective_date ? new Date(item.metadata.effective_date) : null;
                if (effectiveDate) {
                    if (dateFrom && effectiveDate < new Date(dateFrom)) return false;
                    if (dateTo && effectiveDate > new Date(dateTo)) return false;
                } else if (dateFrom || dateTo) {
                    return false;
                }
            }

            // Subscription filter
            if (showSubscribedOnly && !item.is_subscribed) {
                return false;
            }

            return true;
        });

        // Apply sorting
        const sorted = [...filtered].sort((a, b) => {
            switch (sortBy) {
                case 'title-asc':
                    return a.metadata.title.localeCompare(b.metadata.title);
                case 'title-desc':
                    return b.metadata.title.localeCompare(a.metadata.title);
                case 'date-newest':
                    const dateA = a.metadata.effective_date ? new Date(a.metadata.effective_date).getTime() : 0;
                    const dateB = b.metadata.effective_date ? new Date(b.metadata.effective_date).getTime() : 0;
                    return dateB - dateA;
                case 'date-oldest':
                    const dateA2 = a.metadata.effective_date ? new Date(a.metadata.effective_date).getTime() : 0;
                    const dateB2 = b.metadata.effective_date ? new Date(b.metadata.effective_date).getTime() : 0;
                    return dateA2 - dateB2;
                case 'jurisdiction-asc':
                    return (a.metadata.jurisdiction || '').localeCompare(b.metadata.jurisdiction || '');
                case 'jurisdiction-desc':
                    return (b.metadata.jurisdiction || '').localeCompare(a.metadata.jurisdiction || '');
                case 'code-asc':
                    return a.metadata.code.localeCompare(b.metadata.code);
                case 'code-desc':
                    return b.metadata.code.localeCompare(a.metadata.code);
                case 'relevance':
                default:
                    return (a.distance || 0) - (b.distance || 0);
            }
        });

        return sorted;
    };

    const filteredResults = getFilteredAndSortedResults();

    const handleSubscribe = async (regulationId: string) => {
        try {
            await api.post(`/regulations/${regulationId}/subscribe`);
            toast({
                title: t('subscribed'),
                description: t('you_will_be_notified'),
            });
            setResults(results.map(r =>
                r.id === regulationId ? { ...r, is_subscribed: true } : r
            ));
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to subscribe",
            });
        }
    };

    const handleUnsubscribe = async (regulationId: string) => {
        try {
            await api.delete(`/regulations/${regulationId}/subscribe`);
            toast({
                title: t('unsubscribed'),
                description: t('you_have_unsubscribed'),
            });
            setResults(results.map(r =>
                r.id === regulationId ? { ...r, is_subscribed: false } : r
            ));
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to unsubscribe",
            });
        }
    };

    const handleBulkSubscribe = async () => {
        const promises = Array.from(selectedRegulations).map(id =>
            api.post(`/regulations/${id}/subscribe`).catch(() => null)
        );

        await Promise.all(promises);

        setResults(results.map(r =>
            selectedRegulations.has(r.id) ? { ...r, is_subscribed: true } : r
        ));

        toast({
            title: t('bulk_subscribe_complete'),
            description: `${t('subscribed_to')} ${selectedRegulations.size} ${t('regulations')}`,
        });

        setSelectedRegulations(new Set());
    };

    const handleBulkUnsubscribe = async () => {
        const promises = Array.from(selectedRegulations).map(id =>
            api.delete(`/regulations/${id}/subscribe`).catch(() => null)
        );

        await Promise.all(promises);

        setResults(results.map(r =>
            selectedRegulations.has(r.id) ? { ...r, is_subscribed: false } : r
        ));

        toast({
            title: t('bulk_unsubscribe_complete'),
            description: `${t('unsubscribed_from')} ${selectedRegulations.size} ${t('regulations')}`,
        });

        setSelectedRegulations(new Set());
    };

    const toggleSelection = (id: string) => {
        const newSelection = new Set(selectedRegulations);
        if (newSelection.has(id)) {
            newSelection.delete(id);
        } else {
            newSelection.add(id);
        }
        setSelectedRegulations(newSelection);
    };

    const toggleSelectAll = () => {
        if (selectedRegulations.size === filteredResults.length) {
            setSelectedRegulations(new Set());
        } else {
            setSelectedRegulations(new Set(filteredResults.map(r => r.id)));
        }
    };

    const exportToCSV = () => {
        const headers = ['Code', 'Title', 'Jurisdiction', 'Effective Date', 'Category', 'Subscribed'];
        const rows = filteredResults.map(item => [
            item.metadata.code,
            item.metadata.title,
            item.metadata.jurisdiction || 'N/A',
            item.metadata.effective_date ? new Date(item.metadata.effective_date).toLocaleDateString() : 'N/A',
            item.metadata.code.split('-')[0],
            item.is_subscribed ? 'Yes' : 'No'
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `regulations_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        toast({
            title: t('export_successful'),
            description: `${t('exported')} ${filteredResults.length} ${t('regulations_to_csv')}`,
        });
    };

    const exportToJSON = () => {
        const exportData = filteredResults.map(item => ({
            id: item.id,
            code: item.metadata.code,
            title: item.metadata.title,
            jurisdiction: item.metadata.jurisdiction,
            effective_date: item.metadata.effective_date,
            category: item.metadata.code.split('-')[0],
            content: item.content,
            is_subscribed: item.is_subscribed,
            relevance_score: item.distance
        }));

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `regulations_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        window.URL.revokeObjectURL(url);

        toast({
            title: t('export_successful'),
            description: `${t('exported')} ${filteredResults.length} ${t('regulations_to_json')}`,
        });
    };



    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
        toast({
            title: t('copied'),
            description: t('content_copied'),
        });
    };

    const clearFilters = () => {
        setJurisdictionFilter('');
        setDateFrom('');
        setDateTo('');
        setActiveTab('All');
    };

    const hasActiveFilters = jurisdictionFilter || dateFrom || dateTo || activeTab !== 'All';

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const { register: registerAdd, handleSubmit: handleSubmitAdd, reset: resetAdd, formState: { errors: errorsAdd } } = useForm();

    const onAddRegulation = async (data: any) => {
        try {
            await api.post('/regulations/ingest', {
                ...data,
                // Ensure effective_date is in ISO format if provided
                effective_date: data.effective_date ? new Date(data.effective_date).toISOString().split('T')[0] : null
            });
            toast({
                title: t('success'),
                description: t('regulation_added_successfully'),
            });
            setIsAddModalOpen(false);
            resetAdd();
            fetchRegulations();
        } catch (error) {
            toast({
                variant: "destructive",
                title: t('error'),
                description: t('failed_to_add_regulation'),
            });
        }
    };

    const handleRefresh = async () => {
        setIsLoading(true);
        try {
            const res = await api.post('/regulations/refresh');
            toast({
                title: t('success'),
                description: `Update check complete. ${res.data.updated_count} regulations checked. List refreshed.`,
            });
            fetchRegulations();
        } catch (error) {
            toast({
                variant: "destructive",
                title: t('error'),
                description: "Failed to check for updates",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">{t('regulations')}</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {filteredResults.length} {t('regulations_found')}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleRefresh} variant="secondary" className="gap-2">
                        <Loader2 className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        {t('check_updates')}
                    </Button>
                    <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
                        <Plus className="h-4 w-4" />
                        {t('add_regulation')}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFilters(!showFilters)}
                        className="gap-2"
                    >
                        <Filter className="h-4 w-4" />
                        {t('filters')}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={exportToCSV}
                        className="gap-2"
                    >
                        <Download className="h-4 w-4" />
                        {t('csv')}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={exportToJSON}
                        className="gap-2"
                    >
                        <Download className="h-4 w-4" />
                        {t('json')}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                            try {
                                const params = new URLSearchParams();
                                if (jurisdictionFilter) params.append('jurisdiction', jurisdictionFilter);
                                if (searchQuery) params.append('search', searchQuery);

                                const response = await api.get(`/regulations/export/excel?${params.toString()}`, {
                                    responseType: 'blob'
                                });

                                const url = window.URL.createObjectURL(new Blob([response.data]));
                                const link = document.createElement('a');
                                link.href = url;
                                link.setAttribute('download', `regulations_${new Date().toISOString().split('T')[0]}.xlsx`);
                                document.body.appendChild(link);
                                link.click();
                                link.remove();

                                toast({
                                    title: t('export_successful'),
                                    description: 'Regulations exported to Excel',
                                });
                            } catch (error) {
                                toast({
                                    variant: "destructive",
                                    title: "Error",
                                    description: "Failed to export to Excel",
                                });
                            }
                        }}
                        className="gap-2 text-green-600 border-green-200 hover:bg-green-50"
                    >
                        <Download className="h-4 w-4" />
                        Excel
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                            try {
                                const params = new URLSearchParams();
                                if (jurisdictionFilter) params.append('jurisdiction', jurisdictionFilter);
                                if (searchQuery) params.append('search', searchQuery);

                                const response = await api.get(`/regulations/export/pdf?${params.toString()}`, {
                                    responseType: 'blob'
                                });

                                const url = window.URL.createObjectURL(new Blob([response.data]));
                                const link = document.createElement('a');
                                link.href = url;
                                link.setAttribute('download', `regulations_${new Date().toISOString().split('T')[0]}.pdf`);
                                document.body.appendChild(link);
                                link.click();
                                link.remove();

                                toast({
                                    title: t('export_successful'),
                                    description: 'Regulations exported to PDF',
                                });
                            } catch (error) {
                                toast({
                                    variant: "destructive",
                                    title: "Error",
                                    description: "Failed to export to PDF",
                                });
                            }
                        }}
                        className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
                    >
                        <Download className="h-4 w-4" />
                        PDF
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b pb-2 overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${activeTab === tab
                            ? "bg-blue-100 text-blue-700"
                            : "text-gray-600 hover:bg-gray-100"
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Advanced Filters */}
            {showFilters && (
                <div className="rounded-lg border p-4 bg-white shadow-sm space-y-4 animate-fade-in-down">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{t('advanced_filters')}</h3>
                        {hasActiveFilters && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearFilters}
                                className="gap-2"
                            >
                                <X className="h-4 w-4" />
                                {t('clear_all')}
                            </Button>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">{t('jurisdiction')}</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={jurisdictionFilter}
                                onChange={(e) => setJurisdictionFilter(e.target.value)}
                            >
                                <option value="">{t('all_jurisdictions')}</option>
                                {availableJurisdictions.map((j) => (
                                    <option key={j} value={j}>{j}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">{t('effective_from')}</label>
                            <Input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">{t('effective_to')}</label>
                            <Input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 pt-2">
                        <input
                            type="checkbox"
                            id="subscribed-only"
                            checked={showSubscribedOnly}
                            onChange={(e) => setShowSubscribedOnly(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label
                            htmlFor="subscribed-only"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            {t('show_subscribed_only')}
                        </label>
                    </div>
                </div>
            )}

            {/* Search and Sort */}
            <div className="rounded-lg border p-6 bg-white shadow-sm space-y-4">
                <form onSubmit={handleSubmit(onSearch)} className="flex gap-4">
                    <Input {...register('query')} placeholder={t('search_placeholder')} className="flex-1" />
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('search')}
                    </Button>
                </form>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">{t('sort_by')}:</label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                            className="border rounded-md px-3 py-1.5 text-sm"
                        >
                            <option value="relevance">{t('relevance')}</option>
                            <option value="title-asc">{t('title_asc')}</option>
                            <option value="title-desc">{t('title_desc')}</option>
                            <option value="date-newest">{t('date_newest')}</option>
                            <option value="date-oldest">{t('date_oldest')}</option>
                            <option value="jurisdiction-asc">{t('jurisdiction_asc')}</option>
                            <option value="jurisdiction-desc">{t('jurisdiction_desc')}</option>
                            <option value="code-asc">{t('code_asc')}</option>
                            <option value="code-desc">{t('code_desc')}</option>
                        </select>
                    </div>

                    {selectedRegulations.size > 0 && (
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">
                                {selectedRegulations.size} {t('selected')}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleBulkSubscribe}
                            >
                                {t('bulk_subscribe')}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleBulkUnsubscribe}
                            >
                                {t('bulk_unsubscribe')}
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Select All */}
            {filteredResults.length > 0 && (
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={selectedRegulations.size === filteredResults.length && filteredResults.length > 0}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-gray-300"
                    />
                    <label className="text-sm font-medium cursor-pointer" onClick={toggleSelectAll}>
                        {t('select_all')} ({filteredResults.length})
                    </label>
                </div>
            )}

            {/* Results */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
                        <p className="text-gray-500 mt-4">{t('loading_regulations')}</p>
                    </div>
                ) : filteredResults.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
                        <p className="text-gray-500">{t('no_regulations_found')}</p>
                    </div>
                ) : (
                    filteredResults.map((item, index) => (
                        <div
                            key={item.id}
                            className="stagger-item rounded-lg border p-4 shadow-sm hover-lift transition-all bg-white"
                            style={{ animationDelay: `${index * 0.05}s` }}
                        >
                            <div className="flex gap-4">
                                <div className="flex items-start pt-1">
                                    <input
                                        type="checkbox"
                                        checked={selectedRegulations.has(item.id)}
                                        onChange={() => toggleSelection(item.id)}
                                        className="h-4 w-4 rounded border-gray-300"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                                <div
                                    className="flex-1 cursor-pointer"
                                    onClick={() => openDetailModal(item)}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-semibold text-lg hover:text-blue-600 transition-colors">
                                                    {item.metadata.title}
                                                </h3>
                                                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                                    {item.metadata.code}
                                                </span>
                                                {item.metadata.jurisdiction && (
                                                    <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                                                        <MapPin className="h-3 w-3 mr-1" />
                                                        {item.metadata.jurisdiction}
                                                    </span>
                                                )}
                                                <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10">
                                                    {item.metadata.code.split('-')[0]}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {t('effective')}: {item.metadata.effective_date ? new Date(item.metadata.effective_date).toLocaleDateString() : 'N/A'}
                                                {item.updated_at && (
                                                    <span className="ml-2 text-xs text-gray-400">
                                                        (Updated: {new Date(item.updated_at).toLocaleDateString()})
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            {searchQuery && item.distance !== undefined && (
                                                <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                                    Relevance: {(1 - item.distance).toFixed(2)}
                                                </span>
                                            )}
                                            {!searchQuery && item.is_subscribed && (
                                                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded flex items-center gap-1">
                                                    <Check className="h-3 w-3" />
                                                    {t('subscribed')}
                                                </span>
                                            )}
                                            {item.is_subscribed ? (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleUnsubscribe(item.id);
                                                    }}
                                                    className="text-green-600 border-green-200 hover:bg-green-50"
                                                >
                                                    <Check className="h-4 w-4 mr-1" />
                                                    {t('subscribed')}
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSubscribe(item.id);
                                                    }}
                                                >
                                                    {t('subscribe')}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                    <p className="mt-3 text-sm text-gray-700 line-clamp-3 leading-relaxed">{item.content}</p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Detail Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    {selectedRegulation && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="text-2xl">{selectedRegulation.metadata.title}</DialogTitle>
                                <DialogDescription>
                                    <div className="flex items-center gap-2 flex-wrap mt-2">
                                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                            {selectedRegulation.metadata.code}
                                        </span>
                                        {selectedRegulation.metadata.jurisdiction && (
                                            <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                                                <MapPin className="h-3 w-3 mr-1" />
                                                {selectedRegulation.metadata.jurisdiction}
                                            </span>
                                        )}
                                        <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10">
                                            {selectedRegulation.metadata.code.split('-')[0]}
                                        </span>
                                    </div>
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 mt-4">
                                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="text-xs font-medium text-gray-500">{t('effective_date')}</p>
                                        <p className="text-sm font-semibold flex items-center gap-1 mt-1">
                                            <Calendar className="h-4 w-4" />
                                            {selectedRegulation.metadata.effective_date
                                                ? new Date(selectedRegulation.metadata.effective_date).toLocaleDateString()
                                                : 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-500">{t('subscription_status')}</p>
                                        <p className="text-sm font-semibold mt-1">
                                            {selectedRegulation.is_subscribed ? (
                                                <span className="text-green-600 flex items-center gap-1">
                                                    <Check className="h-4 w-4" />
                                                    {t('subscribed')}
                                                </span>
                                            ) : (
                                                <span className="text-gray-600">{t('not_subscribed')}</span>
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-semibold">{t('full_content')}</h4>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => copyToClipboard(selectedRegulation.content, selectedRegulation.id)}
                                            className="gap-2"
                                        >
                                            {copiedId === selectedRegulation.id ? (
                                                <>
                                                    <Check className="h-4 w-4" />
                                                    {t('copied')}
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="h-4 w-4" />
                                                    {t('copy')}
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-lg text-sm leading-relaxed max-h-96 overflow-y-auto">
                                        {selectedRegulation.content}
                                    </div>
                                </div>

                                {relatedRegulations.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold mb-2">{t('related_regulations') || 'Related Regulations'}</h4>
                                        <div className="grid grid-cols-1 gap-2">
                                            {relatedRegulations.map(related => (
                                                <div
                                                    key={related.id}
                                                    className="p-3 border rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
                                                    onClick={() => openDetailModal(related)}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <h5 className="font-medium text-sm text-blue-600">{related.metadata.title}</h5>
                                                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                                            {related.metadata.code}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedRegulation.metadata.source_url && (
                                    <div>
                                        <a
                                            href={selectedRegulation.metadata.source_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                            {t('view_original_source')}
                                        </a>
                                    </div>
                                )}

                                <div className="flex gap-2 pt-4 border-t">
                                    {selectedRegulation.is_subscribed ? (
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                handleUnsubscribe(selectedRegulation.id);
                                                setIsModalOpen(false);
                                            }}
                                            className="flex-1"
                                        >
                                            {t('unsubscribe')}
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={() => {
                                                handleSubscribe(selectedRegulation.id);
                                                setIsModalOpen(false);
                                            }}
                                            className="flex-1"
                                        >
                                            {t('subscribe')}
                                        </Button>
                                    )}
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsModalOpen(false)}
                                    >
                                        {t('close')}
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Add Regulation Modal */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{t('add_new_regulation')}</DialogTitle>
                        <DialogDescription>
                            {t('manually_add_regulation')}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmitAdd(onAddRegulation)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t('code')}</label>
                                <Input
                                    {...registerAdd('code', { required: true })}
                                    placeholder="e.g. GDPR"
                                />
                                {errorsAdd.code && <span className="text-xs text-red-500">{t('required')}</span>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t('jurisdiction')}</label>
                                <Input
                                    {...registerAdd('jurisdiction')}
                                    placeholder="e.g. EU"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t('title')}</label>
                            <Input
                                {...registerAdd('title', { required: true })}
                                placeholder="Regulation Title"
                            />
                            {errorsAdd.title && <span className="text-xs text-red-500">{t('required')}</span>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t('content')}</label>
                            <textarea
                                {...registerAdd('content', { required: true })}
                                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Full text of the regulation..."
                            />
                            {errorsAdd.content && <span className="text-xs text-red-500">{t('required')}</span>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t('effective_date')}</label>
                                <Input
                                    type="date"
                                    {...registerAdd('effective_date')}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t('source_url')}</label>
                                <Input
                                    {...registerAdd('source_url')}
                                    placeholder="https://..."
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                                {t('cancel')}
                            </Button>
                            <Button type="submit">
                                {t('add_regulation')}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
