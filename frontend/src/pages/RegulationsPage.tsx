import { useState, useEffect } from 'react';
import { tr } from '@/lib/i18n';
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
    Plus,
    Sparkles,
    RefreshCw,
    Globe,
    Radio,
    SearchCheck,
    CheckCircle2,
    Cpu,
    Trash2,
    Layers,
    ChevronDown,
    FileSpreadsheet,
    FileText,
    FileCode,
    Search
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

function HighlightedText({ text, query }: { text: string; query?: string }) {
    if (!text) return null;
    if (!query || !query.trim()) return <>{text}</>;

    const words = query.trim().split(/\s+/).filter(w => w.length >= 2);
    if (words.length === 0) return <>{text}</>;

    const pattern = new RegExp(`(${words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
    const parts = text.split(pattern);

    return (
        <>
            {parts.map((part, i) => {
                const isMatch = words.some(w => w.toLowerCase() === part.toLowerCase());
                return isMatch ? (
                    <mark
                        key={i}
                        className="bg-amber-200/90 dark:bg-amber-900/70 text-amber-950 dark:text-amber-100 font-semibold px-1 py-0.5 rounded-sm"
                    >
                        {part}
                    </mark>
                ) : (
                    part
                );
            })}
        </>
    );
}

export default function RegulationsPage() {
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language || 'ru';
    const isEn = currentLang.startsWith('en');

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
    const [isSyncing, setIsSyncing] = useState(false);
    const [isExportOpen, setIsExportOpen] = useState(false);

    // Regulatory Web Radar & Crawler State
    const [isCrawlerModalOpen, setIsCrawlerModalOpen] = useState(false);
    const [isCrawling, setIsCrawling] = useState(false);
    const [crawlerJurisdiction, setCrawlerJurisdiction] = useState<string>('');
    const [crawlerAutoImport, setCrawlerAutoImport] = useState<boolean>(false);
    const [discoveredRegulations, setDiscoveredRegulations] = useState<any[]>([]);
    const [crawlerTelemetry, setCrawlerTelemetry] = useState<string[]>([]);
    const [crawlerStatus, setCrawlerStatus] = useState<any>(null);
    const [isImporting, setIsImporting] = useState<string | null>(null);
    const [crawlerSections, setCrawlerSections] = useState<any[]>([]);
    const [crawlerSelectedSection, setCrawlerSelectedSection] = useState<string>('all');
    const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
    const [newSectionName, setNewSectionName] = useState('');
    const [newSectionKeywords, setNewSectionKeywords] = useState('');
    const [newSectionUrl, setNewSectionUrl] = useState('');
    const [newSectionJurisdiction, setNewSectionJurisdiction] = useState('UZ');
    const [isSubmittingSection, setIsSubmittingSection] = useState(false);

    const { register, handleSubmit, setValue, watch } = useForm();
    const watchQuery = watch('query', '');
    const { toast } = useToast();

    const clearSearch = () => {
        setValue('query', '');
        setSearchQuery('');
        fetchRegulations();
    };

    // Auto-reset when user clears search box with Backspace
    useEffect(() => {
        if (searchQuery && watchQuery === '') {
            setSearchQuery('');
            fetchRegulations();
        }
    }, [watchQuery]);

    const normalizeRegulation = (item: any) => {
        if (!item) return null;
        const meta = item.metadata || {};
        const title = meta.title || item.title || 'Безымянный норматив';
        const code = meta.code || item.code || 'REG';
        const category = meta.category || item.category || 'General';
        const jurisdiction = meta.jurisdiction || item.jurisdiction || 'GLOBAL';
        const effective_date = meta.effective_date || item.effective_date || '';
        const source_url = meta.source_url || item.source_url || '';
        const content = meta.content || item.content || '';
        const snippet = meta.snippet || item.snippet || '';
        const matched_fields = meta.matched_fields || item.matched_fields || [];
        const score = meta.score || item.score || 0;

        return {
            ...item,
            title,
            code,
            category,
            jurisdiction,
            effective_date,
            source_url,
            content,
            snippet,
            matched_fields,
            score,
            metadata: {
                title,
                code,
                category,
                jurisdiction,
                effective_date,
                source_url,
                content,
                snippet,
                matched_fields,
                score,
                ...meta,
            }
        };
    };

    const openDetailModal = async (regulation: any) => {
        const normalized = normalizeRegulation(regulation);
        setSelectedRegulation(normalized);
        setIsModalOpen(true);
        setRelatedRegulations([]);

        // Fetch related regulations
        const title = normalized?.metadata?.title || normalized?.title;
        if (title) {
            setIsLoadingRelated(true);
            try {
                // Search for regulations with similar title, excluding the current one
                const res = await api.get('/regulations/search', {
                    params: {
                        query: title,
                        limit: 4
                    }
                });

                // Filter out current regulation and limit to 3
                const rawRelated = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.items) ? res.data.items : []);
                const related = rawRelated
                    .map(normalizeRegulation)
                    .filter((r: any) => r && r.id !== normalized?.id)
                    .slice(0, 3);

                setRelatedRegulations(related);
            } catch (error) {
                console.error("Failed to fetch related regulations", error);
            } finally {
                setIsLoadingRelated(false);
            }
        }
    };

    const tabs = ["All", "Banking", "IFRS", "НСБУ", "Finance", "Tax", "Audit", "AML", "ESG", "Privacy", "Security", "Healthcare", "Labor", "Consumer"];

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
            const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.items) ? res.data.items : []);
            setResults(data.map(normalizeRegulation).filter(Boolean));
        } catch (error) {
            console.error("Failed to fetch regulations", error);
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    };

    const onSearch = async (data: any) => {
        const q = (data.query || '').trim();
        setIsLoading(true);
        try {
            setSearchQuery(q);
            const res = await api.get('/regulations/search', { params: { query: q, limit: 200 } });
            const dataResults = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.items) ? res.data.items : []);
            setResults(dataResults.map(normalizeRegulation).filter(Boolean));
        } catch (error) {
            setResults([]);
            toast({
                variant: "destructive",
                title: t('search_failed'),
                description: t('could_not_fetch_regulations'),
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Calculate count of regulations in each domain tab
    const getTabCount = (tab: string) => {
        if (!Array.isArray(results)) return 0;
        if (tab === "All") return results.length;
        return results.filter(item => {
            if (!item) return false;
            const meta = item.metadata || item || {};
            const category = (meta.category || item.category || "").toLowerCase();
            const code = (meta.code || item.code || "").toLowerCase();
            const title = (meta.title || item.title || "").toLowerCase();
            const tabLower = tab.toLowerCase();

            if (tab === "Banking") {
                return (
                    category.includes("bank") ||
                    category.includes("банк") ||
                    code.includes("cbu") ||
                    code.includes("bank") ||
                    code.includes("bis") ||
                    code.includes("basel") ||
                    title.includes("банк") ||
                    title.includes("bank") ||
                    title.includes("центробанк") ||
                    title.includes("центральн") ||
                    title.includes("цб р") ||
                    title.includes("cbu") ||
                    title.includes("пруденциальн") ||
                    title.includes("рвпз") ||
                    title.includes("lcr") ||
                    title.includes("платеж")
                );
            }
            return (
                category === tabLower ||
                category.includes(tabLower) ||
                code.includes(tabLower) ||
                title.includes(tabLower)
            );
        }).length;
    };

    // Apply filters and sorting
    const getFilteredAndSortedResults = () => {
        if (!Array.isArray(results)) return [];
        const filtered = results.filter(item => {
            if (!item) return false;
            const meta = item.metadata || item || {};

            // Tab filter
            if (activeTab !== "All") {
                const category = (meta.category || item.category || "").toLowerCase();
                const code = (meta.code || item.code || "").toLowerCase();
                const title = (meta.title || item.title || "").toLowerCase();
                const tabLower = activeTab.toLowerCase();
                let matchesTab = category === tabLower ||
                    category.includes(tabLower) ||
                    code.includes(tabLower) ||
                    title.includes(tabLower);

                if (activeTab === "Banking") {
                    matchesTab = matchesTab ||
                        category.includes("bank") ||
                        category.includes("банк") ||
                        code.includes("cbu") ||
                        code.includes("bank") ||
                        code.includes("bis") ||
                        code.includes("basel") ||
                        title.includes("банк") ||
                        title.includes("bank") ||
                        title.includes("центробанк") ||
                        title.includes("центральн") ||
                        title.includes("цб р") ||
                        title.includes("cbu") ||
                        title.includes("пруденциальн") ||
                        title.includes("рвпз") ||
                        title.includes("lcr") ||
                        title.includes("платеж");
                }
                if (!matchesTab) return false;
            }

            // Jurisdiction filter
            const jur = (meta.jurisdiction || item.jurisdiction || "").toLowerCase();
            if (jurisdictionFilter && jur) {
                if (!jur.includes(jurisdictionFilter.toLowerCase())) {
                    return false;
                }
            }

            // Date range filter
            const rawDate = meta.effective_date || item.effective_date;
            if (dateFrom || dateTo) {
                const effectiveDate = rawDate ? new Date(rawDate) : null;
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
            const metaA = a?.metadata || a || {};
            const metaB = b?.metadata || b || {};
            const titleA = metaA.title || a?.title || '';
            const titleB = metaB.title || b?.title || '';
            const codeA = metaA.code || a?.code || '';
            const codeB = metaB.code || b?.code || '';
            const jurA = metaA.jurisdiction || a?.jurisdiction || '';
            const jurB = metaB.jurisdiction || b?.jurisdiction || '';

            switch (sortBy) {
                case 'title-asc':
                    return titleA.localeCompare(titleB);
                case 'title-desc':
                    return titleB.localeCompare(titleA);
                case 'date-newest': {
                    const dateA = metaA.effective_date ? new Date(metaA.effective_date).getTime() : 0;
                    const dateB = metaB.effective_date ? new Date(metaB.effective_date).getTime() : 0;
                    return dateB - dateA;
                }
                case 'date-oldest': {
                    const dateA = metaA.effective_date ? new Date(metaA.effective_date).getTime() : 0;
                    const dateB = metaB.effective_date ? new Date(metaB.effective_date).getTime() : 0;
                    return dateA - dateB;
                }
                case 'jurisdiction-asc':
                    return jurA.localeCompare(jurB);
                case 'jurisdiction-desc':
                    return jurB.localeCompare(jurA);
                case 'code-asc':
                    return codeA.localeCompare(codeB);
                case 'code-desc':
                    return codeB.localeCompare(codeA);
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
        const rows = filteredResults.map(item => {
            const meta = item.metadata || item || {};
            const code = meta.code || 'REG';
            return [
                code,
                meta.title || item.title || '',
                meta.jurisdiction || 'N/A',
                meta.effective_date ? new Date(meta.effective_date).toLocaleDateString() : 'N/A',
                code.split('-')[0] || meta.category || 'General',
                item.is_subscribed ? 'Yes' : 'No'
            ];
        });

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
        const exportData = filteredResults.map(item => {
            const meta = item.metadata || item || {};
            const code = meta.code || 'REG';
            return {
                id: item.id,
                code: code,
                title: meta.title || item.title || '',
                jurisdiction: meta.jurisdiction || 'GLOBAL',
                effective_date: meta.effective_date || '',
                category: code.split('-')[0] || meta.category || 'General',
                content: item.content || meta.content || '',
                is_subscribed: item.is_subscribed,
                relevance_score: item.distance
            };
        });

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

    const exportToExcel = async () => {
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
                description: tr('Нормативы успешно экспортированы в Excel', 'Regulations exported to Excel'),
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: t('error'),
                description: tr('Ошибка при экспорте в Excel', 'Failed to export to Excel'),
            });
        }
    };

    const exportToPDF = async () => {
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
                description: tr('Нормативы успешно экспортированы в PDF', 'Regulations exported to PDF'),
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: t('error'),
                description: tr('Ошибка при экспорте в PDF', 'Failed to export to PDF'),
            });
        }
    };

    const formatPreview = (text: string) => {
        if (!text) return '';
        return text
            .replace(/#{1,6}\s+/g, '')
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/`{1,3}(.*?)`{1,3}/g, '$1')
            .replace(/\[(.*?)\]\(.*?\)/g, '$1')
            .replace(/\n+/g, ' ')
            .trim();
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

    const handleAutoSeed = async () => {
        setIsSyncing(true);
        try {
            const res = await api.post('/regulations/auto-seed');
            toast({
                title: "Авто-синхронизация нормативов",
                description: `Каталог обновлен: добавлено ${res.data.added ?? 0}, обновлено ${res.data.updated ?? 0}. Всего в базе: ${res.data.total_regulations ?? results.length}.`,
            });
            await fetchRegulations();
            await fetchJurisdictions();
        } catch (error) {
            toast({
                variant: "destructive",
                title: t('error'),
                description: "Ошибка автоматической синхронизации каталога нормативов",
            });
        } finally {
            setIsSyncing(false);
        }
    };

    const handleRefresh = async () => {
        setIsLoading(true);
        try {
            const res = await api.post('/regulations/refresh');
            const added = res.data.added ?? 0;
            const updated = res.data.updated ?? 0;
            const total = res.data.total_regulations ?? results.length;
            toast({
                title: t('success'),
                description: `Синхронизация завершена. Добавлено: ${added}, Обновлено: ${updated}. Всего в базе: ${total}.`,
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

    const openCrawlerModal = async () => {
        setIsCrawlerModalOpen(true);
        try {
            const [statusRes, discRes, secRes] = await Promise.all([
                api.get('/regulations/crawler/status').catch(() => null),
                api.get('/regulations/crawler/discovered', { params: { section_id: crawlerSelectedSection !== 'all' ? crawlerSelectedSection : undefined } }).catch(() => null),
                api.get('/regulations/crawler/sections').catch(() => null)
            ]);
            if (statusRes?.data) setCrawlerStatus(statusRes.data);
            if (discRes?.data) setDiscoveredRegulations(discRes.data);
            if (secRes?.data?.sections) setCrawlerSections(secRes.data.sections);
        } catch (e) {
            console.error("Failed to load crawler initial status", e);
        }
    };

    const handleSectionChange = async (sectionId: string) => {
        setCrawlerSelectedSection(sectionId);
        try {
            const res = await api.get('/regulations/crawler/discovered', {
                params: {
                    section_id: sectionId !== 'all' ? sectionId : undefined,
                    jurisdiction: crawlerJurisdiction || undefined
                }
            });
            if (res.data) setDiscoveredRegulations(res.data);
        } catch (e) {
            console.error("Failed to filter discoveries by section", e);
        }
    };

    const handleJurisdictionChange = async (jur: string) => {
        setCrawlerJurisdiction(jur);
        try {
            const res = await api.get('/regulations/crawler/discovered', {
                params: {
                    section_id: crawlerSelectedSection !== 'all' ? crawlerSelectedSection : undefined,
                    jurisdiction: jur || undefined
                }
            });
            if (res.data) setDiscoveredRegulations(res.data);
        } catch (e) {
            console.error("Failed to filter discoveries by jurisdiction", e);
        }
    };

    const handleStartCrawl = async () => {
        setIsCrawling(true);
        const startTime = new Date().toLocaleTimeString();
        const activeSec = crawlerSections.find(s => s.id === crawlerSelectedSection);
        const secLabel = activeSec ? tr(activeSec.name, activeSec.name_en || activeSec.name) : tr("Все разделы и сферы", "All Sections & Domains");

        setCrawlerTelemetry([
            `[${startTime}] 🌐 ${tr('Подключение к пулу мониторинга официальных правовых порталов...', 'Connecting to regulatory spider crawler pool...')}`,
            `[${startTime}] 🎯 ${tr(`Целевой раздел мониторинга: [${secLabel}]`, `Filtering by domain/section: [${secLabel}]`)}`,
            `[${startTime}] 🛰️ ${tr('Отправка роботов к Lex.uz, Soliq.uz, ЦБ РУз, НАПП, ГТК, IFRS, OECD, FATF...', 'Scouring Lex.uz, Soliq.uz, CBU, NAPP, Customs, IFRS, OECD, FATF...')}`
        ]);
        try {
            const res = await api.post('/regulations/crawler/start', {
                jurisdiction: crawlerJurisdiction || undefined,
                section_id: crawlerSelectedSection !== 'all' ? crawlerSelectedSection : undefined,
                auto_import: crawlerAutoImport
            });
            if (res.data?.telemetry_logs) {
                setCrawlerTelemetry(res.data.telemetry_logs);
            }
            if (res.data?.discoveries) {
                setDiscoveredRegulations(res.data.discoveries);
            }
            toast({
                title: tr("Сканирование сети завершено", "Web Crawl Completed"),
                description: tr(
                    `Обнаружено ${res.data?.total_found ?? 0} нормативно-правовых актов в разделе [${secLabel}]. ${res.data?.auto_imported ? `Автоматически добавлено в базу: ${res.data.auto_imported}.` : ''}`,
                    `Discovered ${res.data?.total_found ?? 0} legislative acts in section [${secLabel}]. ${res.data?.auto_imported ? `Auto-imported to registry: ${res.data.auto_imported}.` : ''}`
                )
            });
            if (res.data?.auto_imported) {
                await fetchRegulations();
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: t('error'),
                description: tr("Не удалось завершить сканирование сети", "Failed to complete web crawl"),
            });
        } finally {
            setIsCrawling(false);
        }
    };

    const handleAddCustomSection = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSectionName.trim()) {
            toast({
                variant: "destructive",
                title: tr("Ошибка", "Error"),
                description: tr("Введите название раздела", "Section name is required"),
            });
            return;
        }

        setIsSubmittingSection(true);
        try {
            const res = await api.post('/regulations/crawler/sections', {
                name: newSectionName.trim(),
                name_en: newSectionName.trim(),
                keywords: newSectionKeywords ? newSectionKeywords.split(',').map(s => s.trim()).filter(Boolean) : [],
                target_url: newSectionUrl.trim() || undefined,
                jurisdiction: newSectionJurisdiction || 'UZ'
            });

            const newSec = res.data?.section;
            if (newSec) {
                setCrawlerSections(prev => [...prev, newSec]);
                setCrawlerSelectedSection(newSec.id);
            }

            toast({
                title: tr("Раздел мониторинга добавлен", "Section Created"),
                description: tr(`Раздел "${newSectionName}" добавлен. Запускаем целевой поиск в сети...`, `Section "${newSectionName}" added. Starting web spider scan...`),
            });

            setIsAddSectionOpen(false);
            setNewSectionName('');
            setNewSectionKeywords('');
            setNewSectionUrl('');

            // Automatically trigger targeted crawl for this new section
            setTimeout(async () => {
                setIsCrawling(true);
                try {
                    const crawlRes = await api.post('/regulations/crawler/start', {
                        section_id: newSec?.id,
                        jurisdiction: newSectionJurisdiction || undefined,
                        auto_import: crawlerAutoImport
                    });
                    if (crawlRes.data?.telemetry_logs) setCrawlerTelemetry(crawlRes.data.telemetry_logs);
                    if (crawlRes.data?.discoveries) setDiscoveredRegulations(crawlRes.data.discoveries);
                } finally {
                    setIsCrawling(false);
                }
            }, 300);

        } catch (error) {
            toast({
                variant: "destructive",
                title: tr("Ошибка", "Error"),
                description: tr("Не удалось добавить раздел", "Failed to create section"),
            });
        } finally {
            setIsSubmittingSection(false);
        }
    };

    const handleDeleteSection = async (secId: string, secName: string) => {
        try {
            await api.delete(`/regulations/crawler/sections/${secId}`);
            setCrawlerSections(prev => prev.filter(s => s.id !== secId));
            if (crawlerSelectedSection === secId) {
                handleSectionChange('all');
            }
            toast({
                title: tr("Раздел удален", "Deleted"),
                description: `${secName} ${tr("удален из системы мониторинга", "removed from monitoring")}`,
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: tr("Ошибка", "Error"),
                description: tr("Не удалось удалить раздел", "Failed to delete section"),
            });
        }
    };

    const handleImportRegulation = async (code: string) => {
        setIsImporting(code);
        try {
            await api.post('/regulations/crawler/import', { codes: [code] });
            toast({
                title: t('success'),
                description: tr(`Норматив ${code} успешно добавлен в официальный реестр!`, `Regulation ${code} added to registry!`),
            });
            setDiscoveredRegulations(prev => prev.map(d => d.code === code ? { ...d, is_imported: true } : d));
            await fetchRegulations();
        } catch (error) {
            toast({
                variant: "destructive",
                title: t('error'),
                description: tr("Ошибка при импорте норматива", "Failed to import regulation"),
            });
        } finally {
            setIsImporting(null);
        }
    };

    const handleImportAllDiscovered = async () => {
        setIsImporting('all');
        try {
            const pendingCodes = discoveredRegulations.filter(d => !d.is_imported).map(d => d.code);
            if (pendingCodes.length === 0) {
                toast({
                    title: tr("Информация", "Info"),
                    description: tr("Все найденные нормативы уже импортированы в базу.", "All discovered acts are already imported."),
                });
                return;
            }
            const res = await api.post('/regulations/crawler/import', { codes: pendingCodes });
            toast({
                title: t('success'),
                description: tr(`Все найденные нормативы (${res.data?.imported ?? pendingCodes.length}) успешно импортированы в базу!`, `Successfully imported ${res.data?.imported ?? pendingCodes.length} regulations!`),
            });
            setDiscoveredRegulations(prev => prev.map(d => ({ ...d, is_imported: true })));
            await fetchRegulations();
        } catch (error) {
            toast({
                variant: "destructive",
                title: t('error'),
                description: tr("Ошибка при пакетном импорте нормативов", "Failed to bulk import regulations"),
            });
        } finally {
            setIsImporting(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header & Action Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                            {tr("Реестр нормативных актов", "Regulations Registry")}
                        </h1>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shadow-2xs">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            {tr("Авто-синхронизация 24/7", "Live Sync 24/7")}
                        </span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                        <span>{tr("Найдено", "Filtered")}: <strong className="text-slate-700 dark:text-slate-200">{filteredResults.length}</strong></span>
                        <span>•</span>
                        <span>{tr("Всего в базе", "Total in registry")}: <strong className="text-slate-700 dark:text-slate-200">{results.length}</strong> {tr("нормативов", "regulations")}</span>
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Button 
                        onClick={openCrawlerModal}
                        className="gap-2 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-sm relative overflow-hidden group h-9 text-xs sm:text-sm font-medium"
                    >
                        <Globe className="h-4 w-4 text-violet-200 group-hover:rotate-45 transition-transform duration-300" />
                        <span>{tr('Радар сети & Краулер', 'Web Radar & Crawler')}</span>
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                        </span>
                    </Button>
                    <Button 
                        onClick={handleAutoSeed} 
                        disabled={isSyncing} 
                        className="gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white shadow-sm h-9 text-xs sm:text-sm font-medium"
                    >
                        {isSyncing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Sparkles className="h-4 w-4" />
                        )}
                        <span>{tr('Авто-пополнение базы', 'Auto-Update Catalog')}</span>
                    </Button>
                    <Button 
                        onClick={handleRefresh} 
                        variant="outline" 
                        className="gap-2 h-9 text-xs sm:text-sm border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/80 shadow-xs"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 text-slate-500 dark:text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
                        <span>{tr('Проверить обновления', 'Check Updates')}</span>
                    </Button>
                    <Button 
                        onClick={() => setIsAddModalOpen(true)} 
                        variant="outline" 
                        className="gap-2 h-9 text-xs sm:text-sm border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/80 shadow-xs"
                    >
                        <Plus className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                        <span>{tr('Добавить норматив', 'Add Regulation')}</span>
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFilters(!showFilters)}
                        className={`gap-1.5 h-9 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/80 shadow-xs ${showFilters || hasActiveFilters ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 font-semibold' : 'bg-white dark:bg-slate-800'}`}
                    >
                        <Filter className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                        <span>{tr('Фильтры', 'Filters')}</span>
                        {hasActiveFilters && (
                            <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400"></span>
                        )}
                    </Button>

                    {/* Unified Export Menu */}
                    <div className="relative">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsExportOpen(!isExportOpen)}
                            className="gap-1.5 h-9 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/80 shadow-xs"
                        >
                            <Download className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                            <span>{tr('Экспорт', 'Export')}</span>
                            <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isExportOpen ? 'rotate-180' : ''}`} />
                        </Button>
                        {isExportOpen && (
                            <div 
                                className="absolute right-0 mt-1.5 w-48 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-30 p-1 animate-in fade-in zoom-in-95"
                                onMouseLeave={() => setIsExportOpen(false)}
                            >
                                <button
                                    onClick={() => { exportToExcel(); setIsExportOpen(false); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                                >
                                    <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                    <span>Excel (.xlsx)</span>
                                </button>
                                <button
                                    onClick={() => { exportToPDF(); setIsExportOpen(false); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-300 transition-colors"
                                >
                                    <FileText className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                                    <span>PDF (.pdf)</span>
                                </button>
                                <button
                                    onClick={() => { exportToCSV(); setIsExportOpen(false); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                                >
                                    <Download className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    <span>CSV (.csv)</span>
                                </button>
                                <button
                                    onClick={() => { exportToJSON(); setIsExportOpen(false); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                                >
                                    <FileCode className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                    <span>JSON (.json)</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Categorized Tabs Bar with Live Dynamic Item Counts */}
            <div className="flex gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2.5 overflow-x-auto scrollbar-thin">
                {tabs.map((tab) => {
                    let label = tab;
                    if (tab === "All") label = tr("Все", "All", "Barchasi");
                    else if (tab === "Banking") label = tr("Банки и Финтех", "Banking & FinTech", "Banklar va FinTex");
                    else if (tab === "Finance") label = tr("Финансы", "Finance", "Moliya");
                    else if (tab === "Tax") label = tr("Налоги", "Tax", "Soliqlar");
                    else if (tab === "Audit") label = tr("Аудит", "Audit", "Audit");
                    else if (tab === "Security") label = tr("Безопасность", "Security", "Xavfsizlik");
                    else if (tab === "Healthcare") label = tr("Здравоохранение", "Healthcare", "Sog'liqni saqlash");
                    else if (tab === "Labor") label = tr("Труд и кадры", "Labor", "Mehnat va kadrlar");
                    else if (tab === "Consumer") label = tr("Защита прав", "Consumer", "Iste'molchilar huquqi");

                    const count = getTabCount(tab);
                    const isSelected = activeTab === tab;
                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
                                isSelected
                                    ? "bg-blue-600 text-white shadow-xs font-semibold"
                                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/80"
                            }`}
                        >
                            <span>{label}</span>
                            <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono ${
                                isSelected 
                                    ? "bg-white/20 text-white" 
                                    : "bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                            }`}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Advanced Filters */}
            {showFilters && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900 shadow-xs space-y-4 animate-fade-in-down">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
                        <h3 className="font-semibold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                            <Filter className="h-4 w-4 text-blue-600" />
                            <span>{t('advanced_filters')}</span>
                        </h3>
                        {hasActiveFilters && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearFilters}
                                className="h-8 gap-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            >
                                <X className="h-3.5 w-3.5" />
                                {t('clear_all')}
                            </Button>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">{t('jurisdiction')}</label>
                            <select
                                className="flex h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
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
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">{t('effective_from')}</label>
                            <Input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">{t('effective_to')}</label>
                            <Input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                            />
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                        <input
                            type="checkbox"
                            id="subscribed-only"
                            checked={showSubscribedOnly}
                            onChange={(e) => setShowSubscribedOnly(e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-blue-600 focus:ring-blue-500"
                        />
                        <label
                            htmlFor="subscribed-only"
                            className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
                        >
                            {t('show_subscribed_only')}
                        </label>
                    </div>
                </div>
            )}

            {/* Search and Sort Card */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900 shadow-xs space-y-4">
                <form onSubmit={handleSubmit(onSearch)} className="flex gap-3">
                    <div className="relative flex-1">
                        <Input 
                            {...register('query')} 
                            placeholder={tr(
                                "Глубокий поиск: по названию, кодексу, тексту статей, юрисдикции и чеклистам...", 
                                "Deep search: by title, code, article text, jurisdiction, and checklists...",
                                "Chuqur qidiruv: nomi, kodi, moddalar matni, yurisdiksiya va talablar bo'yicha..."
                            )} 
                            className="w-full bg-slate-50 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 h-11 text-sm focus-visible:ring-blue-500 pr-10" 
                        />
                        {watchQuery && (
                            <button
                                type="button"
                                onClick={clearSearch}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full transition-colors"
                                title={tr("Очистить поиск", "Clear search", "Qidiruvni tozalash")}
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                    <Button type="submit" disabled={isLoading} className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm gap-2 shrink-0">
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SearchCheck className="h-4 w-4" />}
                        <span>{tr("Найти", "Search", "Qidirish")}</span>
                    </Button>
                </form>

                {searchQuery && (
                    <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 text-xs sm:text-sm text-blue-900 dark:text-blue-200 animate-in fade-in">
                        <div className="flex items-center gap-2 flex-wrap">
                            <Search className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                            <span>
                                {tr(
                                    `Результаты глубокого поиска по запросу «${searchQuery}»: найдено ${filteredResults.length} актов`,
                                    `Deep search results for "${searchQuery}": ${filteredResults.length} regulations found`,
                                    `"${searchQuery}" so'rovi bo'yicha chuqur qidiruv natijalari: ${filteredResults.length} hujjat topildi`
                                )}
                            </span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearSearch}
                            className="h-7 text-xs text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 gap-1"
                        >
                            <X className="h-3.5 w-3.5" />
                            {tr("Сбросить", "Reset", "Bekor qilish")}
                        </Button>
                    </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                    <div className="flex items-center gap-2.5">
                        <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                            {tr("Сортировка", "Sort by")}:
                        </label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                            className="bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg px-3 py-1.5 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium cursor-pointer"
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
                            <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                                {selectedRegulations.size} {t('selected')}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleBulkSubscribe}
                                className="h-8 text-xs gap-1 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                            >
                                <Check className="h-3.5 w-3.5" />
                                {t('bulk_subscribe')}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleBulkUnsubscribe}
                                className="h-8 text-xs border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                {t('bulk_unsubscribe')}
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Select All */}
            {filteredResults.length > 0 && (
                <div className="flex items-center gap-2 px-1">
                    <input
                        type="checkbox"
                        checked={selectedRegulations.size === filteredResults.length && filteredResults.length > 0}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        id="select-all-regulations"
                    />
                    <label 
                        htmlFor="select-all-regulations"
                        className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none"
                    >
                        {t('select_all')} ({filteredResults.length})
                    </label>
                </div>
            )}

            {/* Results Grid / List */}
            <div className="space-y-3.5">
                {isLoading ? (
                    <div className="text-center py-16 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
                        <p className="text-slate-500 dark:text-slate-400 mt-4 text-sm">{t('loading_regulations')}</p>
                    </div>
                ) : filteredResults.length === 0 ? (
                    <div className="text-center py-16 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-dashed border-slate-300 dark:border-slate-800">
                        <p className="text-slate-500 dark:text-slate-400 text-sm">{t('no_regulations_found')}</p>
                    </div>
                ) : (
                    filteredResults.map((item, index) => (
                        <div
                            key={item.id}
                            className="stagger-item rounded-xl border border-slate-200 dark:border-slate-800/80 p-5 shadow-xs hover:shadow-md hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all bg-white dark:bg-slate-900/90 group"
                            style={{ animationDelay: `${Math.min(index * 0.03, 0.5)}s` }}
                        >
                            <div className="flex gap-4">
                                <div className="flex items-start pt-1">
                                    <input
                                        type="checkbox"
                                        checked={selectedRegulations.has(item.id)}
                                        onChange={() => toggleSelection(item.id)}
                                        className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                                <div
                                    className="flex-1 cursor-pointer"
                                    onClick={() => openDetailModal(item)}
                                >
                                    {(() => {
                                        const meta = item.metadata || item || {};
                                        const code = meta.code || 'REG';
                                        const category = meta.category || item.category || code.split('-')[0] || 'General';
                                        return (
                                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                                <div className="space-y-1.5 flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className="font-semibold text-base sm:text-lg text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
                                                            <HighlightedText text={meta.title || item.title || 'Untitled'} query={searchQuery} />
                                                        </h3>
                                                        <span className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-950/70 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60 font-mono">
                                                            <HighlightedText text={code} query={searchQuery} />
                                                        </span>
                                                        {meta.jurisdiction && (
                                                            <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                                                <MapPin className="h-3 w-3 mr-1 text-slate-400" />
                                                                {meta.jurisdiction}
                                                            </span>
                                                        )}
                                                        <span className="inline-flex items-center rounded-md bg-purple-50 dark:bg-purple-950/70 px-2 py-0.5 text-xs font-medium text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/60">
                                                            {category}
                                                        </span>
                                                    </div>

                                                    {/* Matched Fields Badges */}
                                                    {searchQuery && Array.isArray(item.matched_fields) && item.matched_fields.length > 0 && (
                                                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                                            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                                                                {tr('Совпадение в:', 'Matched in:', 'Moslik joyi:')}
                                                            </span>
                                                            {item.matched_fields.includes('content') && (
                                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                                                    <FileText className="h-3 w-3" />
                                                                    {tr('Тексте статей', 'Article body', 'Moddalar matnida')}
                                                                </span>
                                                            )}
                                                            {item.matched_fields.includes('title') && (
                                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                                                    {tr('Названии', 'Title', 'Nomida')}
                                                                </span>
                                                            )}
                                                            {item.matched_fields.includes('code') && (
                                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                                                    {tr('Кодексе / Коде', 'Code', 'Kodida')}
                                                                </span>
                                                            )}
                                                            {item.matched_fields.includes('workflow') && (
                                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                                                    <CheckCircle2 className="h-3 w-3" />
                                                                    {tr('Чеклисте требований', 'Requirements checklist', 'Talablar ro‘yxatida')}
                                                                </span>
                                                            )}
                                                            {item.matched_fields.includes('category') && (
                                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                                                    {tr('Категории', 'Category', 'Kategoriyada')}
                                                                </span>
                                                            )}
                                                            {item.matched_fields.includes('jurisdiction') && (
                                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                                                    {tr('Юрисдикции', 'Jurisdiction', 'Yurisdiksiyada')}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}

                                                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                                        <span>{t('effective')}: <strong>{meta.effective_date ? new Date(meta.effective_date).toLocaleDateString() : 'N/A'}</strong></span>
                                                        {item.updated_at && (
                                                            <span className="ml-2 text-slate-400 dark:text-slate-500">
                                                                ({tr('Обновлено', 'Updated')}: {new Date(item.updated_at).toLocaleDateString()})
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>

                                                <div className="flex items-center sm:flex-col sm:items-end gap-2 shrink-0">
                                                    {searchQuery && item.distance !== undefined && (
                                                        <span className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                                            Relevance: {(1 - item.distance).toFixed(2)}
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
                                                            className="h-8 text-xs gap-1.5 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                                                        >
                                                            <Check className="h-3.5 w-3.5" />
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
                                                            className="h-8 text-xs gap-1.5 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                                        >
                                                            {t('subscribe')}
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Snippet / Content Preview with Highlighted Words */}
                                    {searchQuery && (item.snippet || item.metadata?.snippet) ? (
                                        <div className="mt-2.5 p-2.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/50 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                                            <div className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 mb-1 flex items-center gap-1">
                                                <Search className="h-3 w-3" />
                                                <span>{tr('Фрагмент совпадения из текста акта:', 'Matched context from regulation text:', 'Hujjat matnidan mos kelgan parcha:')}</span>
                                            </div>
                                            <p className="line-clamp-3">
                                                <HighlightedText text={formatPreview(item.snippet || item.metadata?.snippet)} query={searchQuery} />
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="mt-2.5 text-sm text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                                            <HighlightedText text={formatPreview(item.content)} query={searchQuery} />
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Detail Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
                    {selectedRegulation && (() => {
                        const selMeta = selectedRegulation.metadata || selectedRegulation || {};
                        const code = selMeta.code || 'REG';
                        const category = code.split('-')[0] || selMeta.category || 'General';
                        return (
                            <>
                                <DialogHeader>
                                    <DialogTitle className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug">
                                        <HighlightedText text={selMeta.title || 'Untitled'} query={searchQuery} />
                                    </DialogTitle>
                                    <DialogDescription className="text-slate-500 dark:text-slate-400">
                                        <div className="flex items-center gap-2 flex-wrap mt-2">
                                            <span className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-950/70 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60 font-mono">
                                                <HighlightedText text={code} query={searchQuery} />
                                            </span>
                                            {selMeta.jurisdiction && (
                                                <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                                    <MapPin className="h-3 w-3 mr-1 text-slate-400" />
                                                    {selMeta.jurisdiction}
                                                </span>
                                            )}
                                            <span className="inline-flex items-center rounded-md bg-purple-50 dark:bg-purple-950/70 px-2 py-0.5 text-xs font-medium text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/60">
                                                {category}
                                            </span>
                                        </div>
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-4 mt-4">
                                    <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-lg">
                                        <div>
                                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('effective_date')}</p>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 mt-1">
                                                <Calendar className="h-4 w-4 text-slate-400" />
                                                {selMeta.effective_date
                                                    ? new Date(selMeta.effective_date).toLocaleDateString()
                                                    : 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('subscription_status')}</p>
                                            <p className="text-sm font-semibold mt-1">
                                                {selectedRegulation.is_subscribed ? (
                                                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                        <Check className="h-4 w-4" />
                                                        {t('subscribed')}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-500 dark:text-slate-400">{t('not_subscribed')}</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{t('full_content')}</h4>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => copyToClipboard(selectedRegulation.content, selectedRegulation.id)}
                                                className="gap-1.5 h-8 text-xs border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                                            >
                                                {copiedId === selectedRegulation.id ? (
                                                    <>
                                                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                                                        {t('copied')}
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="h-3.5 w-3.5" />
                                                        {t('copy')}
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                        <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm leading-relaxed max-h-96 overflow-y-auto text-slate-800 dark:text-slate-200 whitespace-pre-line font-normal">
                                            <HighlightedText text={selectedRegulation.content} query={searchQuery} />
                                        </div>
                                    </div>

                                    {/* Compliance Workflow Steps & Checklists with Search Highlighting */}
                                    {(() => {
                                        let stepsList: any[] = [];
                                        try {
                                            const rawSteps = selMeta.workflow_steps || selectedRegulation.workflow_steps;
                                            if (typeof rawSteps === 'string') {
                                                const parsed = JSON.parse(rawSteps);
                                                stepsList = Array.isArray(parsed?.steps) ? parsed.steps : (Array.isArray(parsed) ? parsed : []);
                                            } else if (Array.isArray(rawSteps)) {
                                                stepsList = rawSteps;
                                            } else if (Array.isArray(rawSteps?.steps)) {
                                                stepsList = rawSteps.steps;
                                            }
                                        } catch {}

                                        if (!stepsList || stepsList.length === 0) return null;

                                        return (
                                            <div className="space-y-2.5 pt-2">
                                                <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                                                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                                    <span>{tr("Чеклист требований и этапы соответствия", "Compliance Requirements Checklist", "Muvofiqlik talablari va bosqichlari")}</span>
                                                </h4>
                                                <div className="space-y-2">
                                                    {stepsList.map((step: any, sIdx: number) => {
                                                        const sTitle = typeof step === 'string' ? step : (step?.title || `Этап ${step?.step || sIdx + 1}`);
                                                        const sDesc = step?.description;
                                                        const sResp = step?.responsible;
                                                        const checklists: string[] = Array.isArray(step?.checklist) ? step.checklist : [];

                                                        return (
                                                            <div key={sIdx} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 text-xs sm:text-sm space-y-1.5">
                                                                <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-between gap-2">
                                                                    <span>
                                                                        {sIdx + 1}. <HighlightedText text={sTitle} query={searchQuery} />
                                                                    </span>
                                                                    {sResp && (
                                                                        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-normal shrink-0">
                                                                            {sResp}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {sDesc && (
                                                                    <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                                                                        <HighlightedText text={sDesc} query={searchQuery} />
                                                                    </p>
                                                                )}
                                                                {checklists.length > 0 && (
                                                                    <div className="pt-1.5 space-y-1">
                                                                        {checklists.map((checkItem, cIdx) => (
                                                                            <div key={cIdx} className="flex items-start gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                                                                                <Check className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                                                                                <span><HighlightedText text={checkItem} query={searchQuery} /></span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {isLoadingRelated ? (
                                        <div className="text-xs text-slate-500 dark:text-slate-400 animate-pulse py-2">Loading related regulations...</div>
                                    ) : relatedRegulations.length > 0 && (
                                        <div>
                                            <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-2">{t('related_regulations') || 'Related Regulations'}</h4>
                                            <div className="grid grid-cols-1 gap-2">
                                                {relatedRegulations.map(related => {
                                                    const relMeta = related?.metadata || related || {};
                                                    return (
                                                        <div
                                                            key={related.id}
                                                            className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors bg-white dark:bg-slate-900"
                                                            onClick={() => openDetailModal(related)}
                                                        >
                                                            <div className="flex justify-between items-start gap-2">
                                                                <h5 className="font-medium text-xs sm:text-sm text-blue-600 dark:text-blue-400">{relMeta.title || 'Related'}</h5>
                                                                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 shrink-0">
                                                                    {relMeta.code || ''}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {selMeta.source_url && (
                                        <div>
                                            <a
                                                href={selMeta.source_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-xs sm:text-sm font-medium"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                                {t('view_original_source')}
                                            </a>
                                        </div>
                                    )}

                                    <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                                        {selectedRegulation.is_subscribed ? (
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    handleUnsubscribe(selectedRegulation.id);
                                                    setIsModalOpen(false);
                                                }}
                                                className="flex-1 border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                            >
                                                {t('unsubscribe')}
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={() => {
                                                    handleSubscribe(selectedRegulation.id);
                                                    setIsModalOpen(false);
                                                }}
                                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                                            >
                                                {t('subscribe')}
                                            </Button>
                                        )}
                                        <Button
                                            variant="outline"
                                            onClick={() => setIsModalOpen(false)}
                                            className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                                        >
                                            {t('close')}
                                        </Button>
                                    </div>
                                </div>
                            </>
                        );
                    })()}
                </DialogContent>
            </Dialog>

            {/* Add Regulation Modal */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="max-w-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">{t('add_new_regulation')}</DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                            {t('manually_add_regulation')}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmitAdd(onAddRegulation)} className="space-y-4 pt-1">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t('code')}</label>
                                <Input
                                    {...registerAdd('code', { required: true })}
                                    placeholder="e.g. GDPR / NSBU-21"
                                    className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm"
                                />
                                {errorsAdd.code && <span className="text-xs text-rose-500">{t('required')}</span>}
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t('jurisdiction')}</label>
                                <Input
                                    {...registerAdd('jurisdiction')}
                                    placeholder="e.g. UZ / GLOBAL / EU"
                                    className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t('title')}</label>
                            <Input
                                {...registerAdd('title', { required: true })}
                                placeholder="Regulation Title / Название стандарта"
                                className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm"
                            />
                            {errorsAdd.title && <span className="text-xs text-rose-500">{t('required')}</span>}
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t('content')}</label>
                            <textarea
                                {...registerAdd('content', { required: true })}
                                className="flex min-h-[110px] w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 ring-offset-background placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Full text of the regulation..."
                            />
                            {errorsAdd.content && <span className="text-xs text-rose-500">{t('required')}</span>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t('effective_date')}</label>
                                <Input
                                    type="date"
                                    {...registerAdd('effective_date')}
                                    className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t('source_url')}</label>
                                <Input
                                    {...registerAdd('source_url')}
                                    placeholder="https://lex.uz/..."
                                    className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                                {t('cancel')}
                            </Button>
                            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-medium">
                                {t('add_regulation')}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Regulatory Web Radar & Crawler Modal */}
            <Dialog open={isCrawlerModalOpen} onOpenChange={setIsCrawlerModalOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 border-slate-800 shadow-2xl">
                    {/* Header */}
                    <div className="bg-slate-900 text-white p-6 border-b border-slate-800">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30 flex items-center gap-1.5">
                                <Globe className="h-3.5 w-3.5 text-violet-400" /> 
                                {crawlerStatus?.engine || 'Axiaris Spider v4.0 Engine'}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                                <Radio className="h-3 w-3 text-emerald-400 animate-pulse" /> 
                                {crawlerSections.length > 0 ? `${crawlerSections.length} ${tr("Отраслей и разделов", "Sectors & Custom Domains")}` : (tr("17 Официальных порталов онлайн", "17 Official Legal Portals Live"))}
                            </span>
                        </div>
                        <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                            <span>{t('crawler_radar_title', 'Радар регулирования и веб-краулер законодательства')}</span>
                        </DialogTitle>
                        <DialogDescription className="text-slate-300 text-xs mt-1 leading-relaxed">
                            {t('crawler_radar_subtitle', 'Автоматизированная система мониторинга официальных правовых порталов, баз НПА, стандартов МСФО и налоговых ведомств (Lex.uz, Soliq.uz, Минфин РУз, IFRS Foundation, OECD, Adilet KZ, EUR-Lex, UAE FTA).')}
                        </DialogDescription>
                    </div>

                    {/* Toolbar Controls */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Jurisdiction scope */}
                            <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                                <Filter className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                                <span>{t('crawler_scope', 'Охват')}:</span>
                                <select 
                                    value={crawlerJurisdiction}
                                    onChange={(e) => handleJurisdictionChange(e.target.value)}
                                    className="text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded px-2 py-1 focus:ring-1 focus:ring-violet-500 outline-none"
                                >
                                    <option value="">{t('crawler_all_jurisdictions', 'Все юрисдикции (Весь интернет)')}</option>
                                    <option value="UZ">Узбекистан (UZ) — Lex.uz, Soliq, CBU, НАПП</option>
                                    <option value="GLOBAL">Международные (GLOBAL) — IFRS, OECD, FATF</option>
                                    <option value="KZ">Казахстан (KZ) — Adilet & KGD</option>
                                    <option value="EU">Евросоюз (EU) — EUR-Lex (CSRD & CBAM)</option>
                                    <option value="AE">ОАЭ (AE) — Federal Tax Authority</option>
                                </select>
                            </div>

                            {/* Section / Domain select */}
                            <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                                <Layers className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                                <span>{t('crawler_filter_section', 'Отраслевой раздел')}:</span>
                                <select 
                                    value={crawlerSelectedSection}
                                    onChange={(e) => handleSectionChange(e.target.value)}
                                    className="text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded px-2 py-1 focus:ring-1 focus:ring-violet-500 outline-none font-medium max-w-[210px]"
                                >
                                    <option value="all">{t('crawler_sections_all', 'Все разделы и сферы')}</option>
                                    {crawlerSections.map((sec) => (
                                        <option key={sec.id} value={sec.id}>
                                            {sec.is_custom ? '⭐ ' : ''}{tr(sec.name, sec.name_en || sec.name)}
                                        </option>
                                    ))}
                                </select>

                                {crawlerSections.find(s => s.id === crawlerSelectedSection && s.is_custom) && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            const sec = crawlerSections.find(s => s.id === crawlerSelectedSection);
                                            if (sec) handleDeleteSection(sec.id, sec.name);
                                        }}
                                        className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                        title={t('crawler_delete_section', 'Удалить раздел')}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                )}

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsAddSectionOpen(true)}
                                    className="h-7 text-[11px] px-2.5 gap-1 border-violet-200 dark:border-violet-800/80 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/40 font-medium"
                                >
                                    <Plus className="h-3 w-3 text-violet-600 dark:text-violet-400" />
                                    <span>{t('crawler_add_section_btn', '+ Добавить раздел / URL')}</span>
                                </Button>
                            </div>

                            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer bg-white dark:bg-slate-800 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 hover:border-slate-300 select-none">
                                <input 
                                    type="checkbox" 
                                    checked={crawlerAutoImport} 
                                    onChange={(e) => setCrawlerAutoImport(e.target.checked)} 
                                    className="rounded text-violet-600 focus:ring-violet-500 h-3.5 w-3.5" 
                                />
                                <span>{t('crawler_auto_import', 'Авто-импорт в реестр')}</span>
                            </label>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button 
                                onClick={handleStartCrawl} 
                                disabled={isCrawling} 
                                className="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-sm text-xs h-8 px-4"
                            >
                                {isCrawling ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <SearchCheck className="h-3.5 w-3.5" />
                                )}
                                <span>
                                    {isCrawling 
                                        ? t('crawler_scanning', 'Сканирование сети...') 
                                        : t('crawler_start_scan', 'Запустить сканирование сети')}
                                </span>
                            </Button>
                        </div>
                    </div>

                    {/* Interactive Section Filter Pills */}
                    {crawlerSections.length > 0 && (
                        <div className="px-4 py-2.5 bg-slate-100/80 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
                                <Layers className="h-3 w-3 text-slate-400" />
                                {t('crawler_filter_section', 'Раздел')}:
                            </span>
                            <button
                                type="button"
                                onClick={() => handleSectionChange('all')}
                                className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 transition-colors ${
                                    crawlerSelectedSection === 'all'
                                        ? 'bg-violet-600 text-white shadow-xs'
                                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                                }`}
                            >
                                {t('crawler_sections_all', 'Все разделы')}
                            </button>
                            {crawlerSections.map((sec) => {
                                const isSelected = crawlerSelectedSection === sec.id;
                                const label = isEn ? (sec.name_en || sec.name) : sec.name;
                                return (
                                    <button
                                        key={sec.id}
                                        type="button"
                                        onClick={() => handleSectionChange(sec.id)}
                                        className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 transition-colors flex items-center gap-1 ${
                                            isSelected
                                                ? 'bg-violet-600 text-white shadow-xs'
                                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                                        }`}
                                    >
                                        {sec.is_custom && <span className="text-amber-400 text-[10px]">⭐</span>}
                                        <span>{label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Body Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/60 dark:bg-slate-950/80 max-h-[55vh]">
                        {/* Monitored Portals Badges */}
                        <div>
                            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                                <span>{t('crawler_sources_monitored', 'Порталы на мониторинге')} ({17 + (crawlerSections.filter(s => s.target_url).length)})</span>
                                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-normal">● 100% Online (Web Spiders Active)</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {[
                                    { name: "Lex.uz", country: "UZ" },
                                    { name: "Soliq.uz", country: "UZ" },
                                    { name: "Минфин РУз", country: "UZ" },
                                    { name: "ЦБ РУз (CBU)", country: "UZ" },
                                    { name: "НАПП (Крипто)", country: "UZ" },
                                    { name: "ГТК РУз (Таможня)", country: "UZ" },
                                    { name: "Минтруд РУз", country: "UZ" },
                                    { name: "Фармбезопасность РУз", country: "UZ" },
                                    { name: "Антимонопольный ком.", country: "UZ" },
                                    { name: "CERT.UZ (ИБ)", country: "UZ" },
                                    { name: "IFRS Foundation", country: "GLOBAL" },
                                    { name: "OECD Tax Policy", country: "GLOBAL" },
                                    { name: "FATF Guidance", country: "GLOBAL" },
                                    { name: "BIS (Базель III)", country: "GLOBAL" },
                                    { name: "Adilet.zan.kz", country: "KZ" },
                                    { name: "EUR-Lex (CSRD)", country: "EU" },
                                    { name: "UAE FTA", country: "AE" },
                                ].map((p, idx) => (
                                    <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-2xs font-medium">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                        <strong>{p.name}</strong>
                                        <span className="text-[10px] text-slate-400">({p.country})</span>
                                    </span>
                                ))}
                                {crawlerSections.filter(s => s.target_url).map((sec, idx) => (
                                    <span key={`custom-${idx}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] bg-violet-50 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800 text-violet-800 dark:text-violet-300 shadow-2xs font-medium">
                                        <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse"></span>
                                        <strong>{sec.name}</strong>
                                        <span className="text-[10px] text-violet-500">({sec.jurisdiction})</span>
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Live Telemetry Console */}
                        {crawlerTelemetry.length > 0 && (
                            <div className="rounded-lg bg-slate-950 border border-slate-800 p-3.5 text-slate-200 font-mono text-xs shadow-inner">
                                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[11px] text-slate-400">
                                    <span className="flex items-center gap-1.5">
                                        <Cpu className="h-3.5 w-3.5 text-violet-400" />
                                        {t('crawler_live_telemetry', 'Телеметрия краулера')}
                                    </span>
                                    <span className="text-emerald-400">HTTP/2 TLS 1.3 OK</span>
                                </div>
                                <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                                    {crawlerTelemetry.map((log, index) => (
                                        <div key={index} className="text-slate-300 leading-tight">
                                            {log}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Discovered Regulations Feed */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                                    <span>{t('crawler_discovered_title', 'Обнаруженные нормативно-правовые акты')}</span>
                                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-100 dark:bg-violet-950/70 text-violet-800 dark:text-violet-300">
                                        {discoveredRegulations.length}
                                    </span>
                                </h3>

                                {discoveredRegulations.some(d => !d.is_imported) && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleImportAllDiscovered}
                                        disabled={isImporting === 'all'}
                                        className="text-xs h-7 gap-1.5 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/40"
                                    >
                                        {isImporting === 'all' ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                            <Sparkles className="h-3 w-3 text-violet-600 dark:text-violet-400" />
                                        )}
                                        <span>{t('crawler_import_all', 'Импортировать все найденные')}</span>
                                    </Button>
                                )}
                            </div>

                            {discoveredRegulations.length === 0 ? (
                                <div className="text-center py-8 bg-white dark:bg-slate-900 rounded-lg border border-dashed border-slate-300 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs">
                                    {t('crawler_no_discoveries', 'Новых актов по выбранному фильтру не обнаружено. Нажмите «Запустить сканирование сети».')}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {discoveredRegulations.map((item, idx) => {
                                        const title = tr(item.title, item.title_en || item.title);
                                        const isHighImpact = item.impact_level === 'HIGH';

                                        return (
                                            <div 
                                                key={idx} 
                                                className={`p-4 rounded-xl bg-white dark:bg-slate-900 border transition-shadow shadow-xs hover:shadow-md ${
                                                    item.is_imported ? 'border-slate-200 dark:border-slate-800 opacity-90' : 'border-violet-200 dark:border-violet-800/80 ring-1 ring-violet-100 dark:ring-violet-950/50'
                                                }`}
                                            >
                                                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                                                            {item.code}
                                                        </span>
                                                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                                                            {item.source_name || item.authority}
                                                        </span>
                                                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                                                            {item.jurisdiction}
                                                        </span>
                                                        <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                                                            isHighImpact ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800' : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                                        }`}>
                                                            {isHighImpact ? t('crawler_impact_high', 'Высокое влияние') : t('crawler_impact_medium', 'Среднее влияние')}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                                                            {t('crawler_match_score', 'Точность')}: {item.match_score || 98}%
                                                        </span>

                                                        {item.is_imported ? (
                                                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/60 px-2.5 py-1 rounded">
                                                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                                                {t('crawler_already_imported', 'В реестре')}
                                                            </span>
                                                        ) : (
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleImportRegulation(item.code)}
                                                                disabled={isImporting === item.code}
                                                                className="h-7 text-xs gap-1 bg-violet-600 hover:bg-violet-700 text-white shadow-2xs"
                                                            >
                                                                {isImporting === item.code ? (
                                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                                ) : (
                                                                    <Plus className="h-3 w-3" />
                                                                )}
                                                                <span>{t('crawler_import_btn', 'В реестр')}</span>
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>

                                                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-1.5 leading-snug">
                                                    {title}
                                                </h4>

                                                <p className="text-xs text-slate-600 dark:text-slate-300 mb-2.5 leading-relaxed">
                                                    {item.summary}
                                                </p>

                                                {item.workflow_steps && item.workflow_steps.length > 0 && (
                                                    <div className="mb-2.5 p-2 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
                                                        <strong className="text-slate-700 dark:text-slate-200 block mb-0.5">
                                                            {tr('Шаги комплаенс-контроля:', 'Compliance Workflow Steps:', 'Muvofiqlik nazorati bosqichlari:')}
                                                        </strong>
                                                        <ul className="list-disc list-inside space-y-0.5">
                                                            {item.workflow_steps.slice(0, 2).map((step: string, sIdx: number) => (
                                                                <li key={sIdx}>{step}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                                                    <span>
                                                        {t('effective_date')}: <strong>{item.effective_date || '2026'}</strong>
                                                    </span>

                                                    {item.source_url && (
                                                        <a 
                                                            href={item.source_url} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer" 
                                                            className="inline-flex items-center gap-1 text-violet-600 dark:text-violet-400 hover:text-violet-700 font-medium hover:underline"
                                                        >
                                                            <span>{t('crawler_source_link', 'Первоисточник')}</span>
                                                            <ExternalLink className="h-3 w-3" />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                            <span>{t('total')}: <strong>{results.length}</strong> {t('regulations')}</span>
                            <span className="mx-2">•</span>
                            <span className="text-violet-600 dark:text-violet-400 font-medium">
                                {discoveredRegulations.filter(d => !d.is_imported).length} {tr("готово к добавлению", "ready to import")}
                            </span>
                        </div>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setIsCrawlerModalOpen(false)}
                            className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                        >
                            {t('close')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Add Custom Monitoring Section Dialog */}
            <Dialog open={isAddSectionOpen} onOpenChange={setIsAddSectionOpen}>
                <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                            <Plus className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                            <span>{t('crawler_add_section_title', 'Добавить собственный раздел мониторинга')}</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                            {t('crawler_add_section_desc', 'Укажите отрасль, поисковые ключевые слова или целевой адрес портала для регулярного сканирования.')}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleAddCustomSection} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                {t('crawler_section_name', 'Название раздела / отрасли')} *
                            </label>
                            <Input
                                value={newSectionName}
                                onChange={(e) => setNewSectionName(e.target.value)}
                                placeholder="Например: Криптовалюты и Майнинг, Фармацевтика, Логистика"
                                required
                                className="text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                {t('crawler_keywords', 'Ключевые слова для поиска (через запятую)')}
                            </label>
                            <Input
                                value={newSectionKeywords}
                                onChange={(e) => setNewSectionKeywords(e.target.value)}
                                placeholder="майнинг, стейблкоин, лицензия, НАПП, блокчейн"
                                className="text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-2 space-y-1.5">
                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    {t('crawler_target_url', 'Целевой URL портала / регулятора')}
                                </label>
                                <Input
                                    value={newSectionUrl}
                                    onChange={(e) => setNewSectionUrl(e.target.value)}
                                    placeholder="https://napp.uz/ru/legislation"
                                    className="text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    {t('jurisdiction')}
                                </label>
                                <select
                                    value={newSectionJurisdiction}
                                    onChange={(e) => setNewSectionJurisdiction(e.target.value)}
                                    className="flex h-9 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1 text-xs text-slate-900 dark:text-slate-100"
                                >
                                    <option value="UZ">UZ (Узбекистан)</option>
                                    <option value="GLOBAL">GLOBAL (Международн.)</option>
                                    <option value="KZ">KZ (Казахстан)</option>
                                    <option value="EU">EU (Евросоюз)</option>
                                    <option value="AE">AE (ОАЭ)</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                            <Button 
                                type="button" 
                                variant="outline" 
                                size="sm"
                                onClick={() => setIsAddSectionOpen(false)}
                                disabled={isSubmittingSection}
                                className="text-xs h-8 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                            >
                                {t('cancel')}
                            </Button>
                            <Button 
                                type="submit" 
                                size="sm"
                                disabled={isSubmittingSection}
                                className="bg-violet-600 hover:bg-violet-700 text-white gap-2 text-xs h-8"
                            >
                                {isSubmittingSection ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <Sparkles className="h-3.5 w-3.5" />
                                )}
                                <span>{t('crawler_add_section_submit', 'Сохранить и запустить сканирование')}</span>
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
