import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    Building2, 
    Network, 
    Calculator, 
    Download, 
    CheckCircle2, 
    ArrowRight, 
    Plus, 
    FileSpreadsheet, 
    ShieldCheck,
    PieChart,
    Scale,
    TrendingDown
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export interface HoldingEntity {
    id: string;
    name: string;
    code: string;
    industry: string;
    role: 'parent' | 'subsidiary';
    ownership_percentage: number;
    nci_percentage: number;
    assets: number;
    liabilities: number;
    equity: number;
    revenue: number;
    net_profit: number;
}

export interface EliminationEntry {
    id: string;
    code: string;
    description: string;
    standard: string;
    category: 'trade' | 'loan' | 'services' | 'inventory_margin' | 'capital_investment';
    entity_debit: string;
    account_debit: string;
    account_debit_name: string;
    entity_credit: string;
    account_credit: string;
    account_credit_name: string;
    amount: number;
    is_active: boolean;
}

export interface ConsolidatedMatrixRow {
    account_code: string;
    account_name: string;
    category: 'assets' | 'liabilities' | 'equity';
    parent_amount: number;
    sub1_amount: number;
    sub2_amount: number;
    sub3_amount: number;
    combined_amount: number;
    elimination_debit: number;
    elimination_credit: number;
    consolidated_amount: number;
    parent_share: number;
    nci_share: number;
}

const DEFAULT_ENTITIES: HoldingEntity[] = [
    {
        id: 'ent-1',
        name: 'Axiaris Holding JSC',
        code: 'HOLDING',
        industry: 'Головная холдинговая компания',
        role: 'parent',
        ownership_percentage: 100,
        nci_percentage: 0,
        assets: 145000000,
        liabilities: 40000000,
        equity: 105000000,
        revenue: 42000000,
        net_profit: 18500000,
    },
    {
        id: 'ent-2',
        name: 'ManufacturePro LLC',
        code: 'MFG',
        industry: 'Промышленное производство',
        role: 'subsidiary',
        ownership_percentage: 80,
        nci_percentage: 20,
        assets: 85000000,
        liabilities: 35000000,
        equity: 50000000,
        revenue: 78000000,
        net_profit: 14200000,
    },
    {
        id: 'ent-3',
        name: 'RetailMax Distribution LLC',
        code: 'RETAIL',
        industry: 'Оптово-розничная дистрибуция',
        role: 'subsidiary',
        ownership_percentage: 100,
        nci_percentage: 0,
        assets: 62000000,
        liabilities: 38000000,
        equity: 24000000,
        revenue: 65000000,
        net_profit: 9100000,
    },
    {
        id: 'ent-4',
        name: 'LogiTrans Logistics LLC',
        code: 'LOGI',
        industry: 'Транспортная и складская логистика',
        role: 'subsidiary',
        ownership_percentage: 75,
        nci_percentage: 25,
        assets: 56000000,
        liabilities: 36000000,
        equity: 20000000,
        revenue: 31000000,
        net_profit: 4800000,
    },
];

const DEFAULT_ELIMINATIONS: EliminationEntry[] = [
    {
        id: 'elim-1',
        code: 'ELIM-01',
        description: 'Элиминация взаимной торговой задолженности за отгруженную продукцию (ManufacturePro ➔ RetailMax)',
        standard: 'IFRS 10.B86(a)',
        category: 'trade',
        entity_debit: 'RetailMax Distribution',
        account_debit: '6010',
        account_debit_name: 'Кредиторская задолженность поставщикам',
        entity_credit: 'ManufacturePro',
        account_credit: '4010',
        account_credit_name: 'Дебиторская задолженность покупателей',
        amount: 18500000,
        is_active: true,
    },
    {
        id: 'elim-2',
        code: 'ELIM-02',
        description: 'Взаимозачет внутригруппового долгосрочного займа и финансовых вложений (Axiaris Holding ➔ LogiTrans)',
        standard: 'IFRS 10.B86(b)',
        category: 'loan',
        entity_debit: 'LogiTrans Logistics',
        account_debit: '7810',
        account_debit_name: 'Обязательства по долгосрочным займам',
        entity_credit: 'Axiaris Holding',
        account_credit: '0610',
        account_credit_name: 'Долгосрочные инвестиции / займы выданные',
        amount: 30000000,
        is_active: true,
    },
    {
        id: 'elim-3',
        code: 'ELIM-03',
        description: 'Элиминация расчетов за оказанные логистические и экспедиторские услуги (LogiTrans ➔ Axiaris Holding)',
        standard: 'IFRS 10.B86(a)',
        category: 'services',
        entity_debit: 'Axiaris Holding',
        account_debit: '6010',
        account_debit_name: 'Кредиторская задолженность по услугам',
        entity_credit: 'LogiTrans Logistics',
        account_credit: '4010',
        account_credit_name: 'Дебиторская задолженность за услуги',
        amount: 4200000,
        is_active: true,
    },
    {
        id: 'elim-4',
        code: 'ELIM-04',
        description: 'Исключение нереализованной внутригрупповой торговой наценки в складских остатках готовой продукции',
        standard: 'IFRS 10.B86(c)',
        category: 'inventory_margin',
        entity_debit: 'Axiaris Holding (Группа)',
        account_debit: '8710',
        account_debit_name: 'Нераспределенная прибыль группы (капитал)',
        entity_credit: 'RetailMax Distribution',
        account_credit: '2810',
        account_credit_name: 'Запасы товаров на складе',
        amount: 2100000,
        is_active: true,
    },
    {
        id: 'elim-5',
        code: 'ELIM-05',
        description: 'Элиминация инвестиций материнской компании против уставного капитала дочерних предприятий',
        standard: 'IFRS 10.B86(a)',
        category: 'capital_investment',
        entity_debit: 'Дочерние предприятия',
        account_debit: '8330',
        account_debit_name: 'Уставный капитал дочерних обществ',
        entity_credit: 'Axiaris Holding',
        account_credit: '0620',
        account_credit_name: 'Инвестиции в дочерние общества',
        amount: 45000000,
        is_active: true,
    },
];

export default function GroupConsolidationView() {
    const { i18n } = useTranslation();
    const isRu = (i18n.language || 'ru').toLowerCase().startsWith('ru');
    const { toast } = useToast();

    const [entities] = useState<HoldingEntity[]>(DEFAULT_ENTITIES);
    const [eliminations, setEliminations] = useState<EliminationEntry[]>(DEFAULT_ELIMINATIONS);
    const [selectedTab, setSelectedTab] = useState<'matrix' | 'eliminations' | 'nci'>('matrix');
    const [isExporting, setIsExporting] = useState(false);
    
    // Dialog state for adding a custom elimination
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [newElim, setNewElim] = useState({
        description: '',
        amount: '',
        account_debit: '6010',
        account_credit: '4010',
        entity_debit: 'RetailMax Distribution',
        entity_credit: 'ManufacturePro',
        standard: 'IFRS 10.B86',
    });

    // Toggle elimination active state
    const toggleElimination = (id: string) => {
        setEliminations(prev => prev.map(e => e.id === id ? { ...e, is_active: !e.is_active } : e));
    };

    // Calculate active elimination totals
    const activeEliminations = useMemo(() => eliminations.filter(e => e.is_active), [eliminations]);
    
    const activeElimStats = useMemo(() => {
        let trade = 0;
        let loan = 0;
        let services = 0;
        let inventory = 0;
        let capital = 0;

        for (const e of activeEliminations) {
            if (e.category === 'trade') trade += e.amount;
            else if (e.category === 'loan') loan += e.amount;
            else if (e.category === 'services') services += e.amount;
            else if (e.category === 'inventory_margin') inventory += e.amount;
            else if (e.category === 'capital_investment') capital += e.amount;
        }

        const totalAssetsElim = trade + loan + services + inventory + capital;
        const totalLiabElim = trade + loan + services;
        const totalEquityElim = capital + inventory;

        return {
            trade,
            loan,
            services,
            inventory,
            capital,
            totalAssetsElim,
            totalLiabElim,
            totalEquityElim,
            totalElimTurnover: trade + loan + services + inventory + capital
        };
    }, [activeEliminations]);

    // Build consolidated matrix rows
    const consolidatedMatrix = useMemo(() => {
        const rows: ConsolidatedMatrixRow[] = [
            // ASSETS
            {
                account_code: '0100-0300',
                account_name: isRu ? 'Основные средства и НМА (Property, Plant & Equipment)' : 'Property, Plant & Equipment',
                category: 'assets',
                parent_amount: 35000000,
                sub1_amount: 42000000,
                sub2_amount: 15000000,
                sub3_amount: 38000000,
                combined_amount: 130000000,
                elimination_debit: 0,
                elimination_credit: 0,
                consolidated_amount: 130000000,
                parent_share: 130000000,
                nci_share: 0,
            },
            {
                account_code: '0610-0620',
                account_name: isRu ? 'Финансовые вложения и инвестиции в группу' : 'Intercompany Investments & Loans Given',
                category: 'assets',
                parent_amount: 75000000, // 45M capital + 30M loan
                sub1_amount: 0,
                sub2_amount: 0,
                sub3_amount: 0,
                combined_amount: 75000000,
                elimination_debit: 0,
                elimination_credit: activeElimStats.loan + activeElimStats.capital,
                consolidated_amount: 75000000 - (activeElimStats.loan + activeElimStats.capital),
                parent_share: 75000000 - (activeElimStats.loan + activeElimStats.capital),
                nci_share: 0,
            },
            {
                account_code: '2810',
                account_name: isRu ? 'Запасы и готовая продукция (Inventories)' : 'Inventories & Finished Goods',
                category: 'assets',
                parent_amount: 0,
                sub1_amount: 16000000,
                sub2_amount: 32000000,
                sub3_amount: 2000000,
                combined_amount: 50000000,
                elimination_debit: 0,
                elimination_credit: activeElimStats.inventory,
                consolidated_amount: 50000000 - activeElimStats.inventory,
                parent_share: 50000000 - activeElimStats.inventory,
                nci_share: 0,
            },
            {
                account_code: '4010',
                account_name: isRu ? 'Дебиторская задолженность (Trade & Other Receivables)' : 'Trade Receivables',
                category: 'assets',
                parent_amount: 15000000,
                sub1_amount: 22000000,
                sub2_amount: 8000000,
                sub3_amount: 9000000,
                combined_amount: 54000000,
                elimination_debit: 0,
                elimination_credit: activeElimStats.trade + activeElimStats.services,
                consolidated_amount: 54000000 - (activeElimStats.trade + activeElimStats.services),
                parent_share: 54000000 - (activeElimStats.trade + activeElimStats.services),
                nci_share: 0,
            },
            {
                account_code: '5110',
                account_name: isRu ? 'Денежные средства и эквиваленты (Cash & Equivalents)' : 'Cash and Cash Equivalents',
                category: 'assets',
                parent_amount: 20000000,
                sub1_amount: 5000000,
                sub2_amount: 7000000,
                sub3_amount: 7000000,
                combined_amount: 39000000,
                elimination_debit: 0,
                elimination_credit: 0,
                consolidated_amount: 39000000,
                parent_share: 39000000,
                nci_share: 0,
            },

            // LIABILITIES
            {
                account_code: '7810',
                account_name: isRu ? 'Долгосрочные займы и кредиты (Long-term Borrowings)' : 'Long-term Borrowings & Loans',
                category: 'liabilities',
                parent_amount: 15000000,
                sub1_amount: 15000000,
                sub2_amount: 10000000,
                sub3_amount: 30000000,
                combined_amount: 70000000,
                elimination_debit: activeElimStats.loan,
                elimination_credit: 0,
                consolidated_amount: 70000000 - activeElimStats.loan,
                parent_share: 70000000 - activeElimStats.loan,
                nci_share: 0,
            },
            {
                account_code: '6010',
                account_name: isRu ? 'Кредиторская задолженность (Trade & Intercompany Payables)' : 'Trade & Other Payables',
                category: 'liabilities',
                parent_amount: 25000000,
                sub1_amount: 20000000,
                sub2_amount: 28000000,
                sub3_amount: 6000000,
                combined_amount: 79000000,
                elimination_debit: activeElimStats.trade + activeElimStats.services,
                elimination_credit: 0,
                consolidated_amount: 79000000 - (activeElimStats.trade + activeElimStats.services),
                parent_share: 79000000 - (activeElimStats.trade + activeElimStats.services),
                nci_share: 0,
            },

            // EQUITY
            {
                account_code: '8330',
                account_name: isRu ? 'Уставный капитал (Share Capital)' : 'Share Capital',
                category: 'equity',
                parent_amount: 60000000,
                sub1_amount: 25000000,
                sub2_amount: 10000000,
                sub3_amount: 10000000,
                combined_amount: 105000000,
                elimination_debit: activeElimStats.capital,
                elimination_credit: 0,
                consolidated_amount: 105000000 - activeElimStats.capital,
                parent_share: 60000000,
                nci_share: 0,
            },
            {
                account_code: '8710',
                account_name: isRu ? 'Нераспределенная прибыль группы (Retained Earnings)' : 'Retained Earnings',
                category: 'equity',
                parent_amount: 45000000,
                sub1_amount: 25000000,
                sub2_amount: 14000000,
                sub3_amount: 10000000,
                combined_amount: 94000000,
                elimination_debit: activeElimStats.inventory,
                elimination_credit: 0,
                consolidated_amount: 94000000 - activeElimStats.inventory - 14580000,
                parent_share: 77320000,
                nci_share: 0,
            },
            {
                account_code: 'NCI-IFRS10',
                account_name: isRu ? 'Доля неконтролирующих акционеров (Non-Controlling Interests / NCI)' : 'Non-Controlling Interests (NCI)',
                category: 'equity',
                parent_amount: 0,
                sub1_amount: 0,
                sub2_amount: 0,
                sub3_amount: 0,
                combined_amount: 0,
                elimination_debit: 0,
                elimination_credit: 14580000,
                consolidated_amount: 14580000,
                parent_share: 0,
                nci_share: 14580000,
            },
        ];

        return rows;
    }, [activeElimStats, isRu]);

    // Totals calculations
    const totals = useMemo(() => {
        let totalAssets = 0;
        let totalLiabilities = 0;
        let totalEquity = 0;

        for (const r of consolidatedMatrix) {
            if (r.category === 'assets') totalAssets += r.consolidated_amount;
            else if (r.category === 'liabilities') totalLiabilities += r.consolidated_amount;
            else if (r.category === 'equity') totalEquity += r.consolidated_amount;
        }

        const delta = Math.abs(totalAssets - (totalLiabilities + totalEquity));
        const isBalanced = delta < 1.0;

        return {
            totalAssets,
            totalLiabilities,
            totalEquity,
            totalLiabAndEquity: totalLiabilities + totalEquity,
            delta,
            isBalanced
        };
    }, [consolidatedMatrix]);

    // Export Excel handler
    const handleExportExcel = async () => {
        setIsExporting(true);
        try {
            const res = await api.get('/hierarchy/consolidation/export-excel', {
                responseType: 'blob'
            });
            const blob = new Blob([res.data], { 
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `group_consolidation_ifrs10_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast({
                title: isRu ? "Экспорт завершен" : "Export Complete",
                description: isRu ? "Консолидированная книга Excel с формулами элиминации успешно скачана." : "Consolidated workbook downloaded successfully.",
            });
        } catch (error) {
            console.error('Failed to export consolidation Excel', error);
            toast({
                title: isRu ? "Ошибка экспорта" : "Export Failed",
                description: isRu ? "Не удалось сгенерировать файл Excel." : "Could not export Excel file.",
                variant: 'destructive'
            });
        } finally {
            setIsExporting(false);
        }
    };

    // Add elimination entry
    const handleAddElimination = () => {
        const amt = parseFloat(newElim.amount.replace(/[^0-9.]/g, ''));
        if (!amt || isNaN(amt)) {
            toast({
                title: isRu ? "Неверная сумма" : "Invalid amount",
                description: isRu ? "Укажите положительную сумму элиминации" : "Enter a valid amount",
                variant: 'destructive'
            });
            return;
        }

        const entry: EliminationEntry = {
            id: `elim-custom-${Date.now()}`,
            code: `ELIM-0${eliminations.length + 1}`,
            description: newElim.description || (isRu ? 'Ручная внутригрупповая корректировка' : 'Manual intercompany elimination'),
            standard: newElim.standard || 'IFRS 10.B86',
            category: 'trade',
            entity_debit: newElim.entity_debit,
            account_debit: newElim.account_debit,
            account_debit_name: isRu ? 'Кредиторская задолженность' : 'Payables',
            entity_credit: newElim.entity_credit,
            account_credit: newElim.account_credit,
            account_credit_name: isRu ? 'Дебиторская задолженность' : 'Receivables',
            amount: amt,
            is_active: true,
        };

        setEliminations(prev => [entry, ...prev]);
        setAddDialogOpen(false);
        setNewElim({
            description: '',
            amount: '',
            account_debit: '6010',
            account_credit: '4010',
            entity_debit: 'RetailMax Distribution',
            entity_credit: 'ManufacturePro',
            standard: 'IFRS 10.B86',
        });
        toast({
            title: isRu ? "Проводка добавлена" : "Elimination added",
            description: isRu ? `Элиминация на сумму ${amt.toLocaleString()} UZS применена.` : `Elimination applied.`,
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-200">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-border/80 shadow-xs bg-card/60 backdrop-blur-xs">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {isRu ? 'Консолидированные активы' : 'Consolidated Assets'}
                        </CardTitle>
                        <Building2 className="w-4 h-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
                            {totals.totalAssets.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">UZS</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                            <span>{isRu ? 'Без ВГО сальдо' : 'Net of eliminations'}</span>
                            <span className="text-emerald-600 font-medium">(-{activeElimStats.totalAssetsElim.toLocaleString()} UZS)</span>
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-border/80 shadow-xs bg-card/60 backdrop-blur-xs">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {isRu ? 'Внутригрупповой оборот (ВГО)' : 'Intercompany Eliminations'}
                        </CardTitle>
                        <TrendingDown className="w-4 h-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tracking-tight text-purple-600 dark:text-purple-400 font-mono">
                            {activeElimStats.totalElimTurnover.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">UZS</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">
                            {isRu ? `Активно проводок: ${activeEliminations.length} из ${eliminations.length}` : `${activeEliminations.length} of ${eliminations.length} entries active`}
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-border/80 shadow-xs bg-card/60 backdrop-blur-xs">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {isRu ? 'Доля неконтролирующих (NCI)' : 'Non-Controlling Interests'}
                        </CardTitle>
                        <PieChart className="w-4 h-4 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400 font-mono">
                            14,580,000 <span className="text-xs font-normal text-muted-foreground">UZS</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">
                            {isRu ? '20% MFG + 25% LOGI по IFRS 10' : '20% MFG + 25% LOGI under IFRS 10'}
                        </p>
                    </CardContent>
                </Card>

                <Card className={`border shadow-xs ${totals.isBalanced ? 'border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20' : 'border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/20'}`}>
                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {isRu ? 'Контроль сходимости баланса' : 'Equilibrium Guard'}
                        </CardTitle>
                        <Scale className={`w-4 h-4 ${totals.isBalanced ? 'text-emerald-600' : 'text-amber-600'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold tracking-tight font-mono text-emerald-600 dark:text-emerald-400">
                                {totals.isBalanced ? '0.00' : totals.delta.toFixed(2)}
                            </span>
                            <Badge variant={totals.isBalanced ? 'default' : 'destructive'} className={totals.isBalanced ? 'bg-emerald-600 hover:bg-emerald-700 text-[10px]' : 'text-[10px]'}>
                                {totals.isBalanced ? 'ZERO-DELTA' : 'DELTA'}
                            </Badge>
                        </div>
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {isRu ? 'Активы = Обязательства + Капитал' : 'Assets = Liabilities + Equity'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Action Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border/80">
                <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)} className="w-full sm:w-auto">
                    <TabsList className="grid grid-cols-3 w-full sm:w-auto h-9">
                        <TabsTrigger value="matrix" className="text-xs gap-1.5">
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            {isRu ? 'Сводный баланс' : 'Consolidated Matrix'}
                        </TabsTrigger>
                        <TabsTrigger value="eliminations" className="text-xs gap-1.5">
                            <Network className="w-3.5 h-3.5" />
                            {isRu ? 'Внутригрупповые элиминации' : 'Eliminations'}
                        </TabsTrigger>
                        <TabsTrigger value="nci" className="text-xs gap-1.5">
                            <PieChart className="w-3.5 h-3.5" />
                            {isRu ? 'Структура и NCI' : 'Ownership & NCI'}
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setAddDialogOpen(true)}
                        className="text-xs gap-1.5 border-dashed border-primary/50 text-primary hover:bg-primary/5"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        {isRu ? 'Добавить проводку ВГО' : 'Add Elimination'}
                    </Button>
                    <Button 
                        onClick={handleExportExcel} 
                        disabled={isExporting} 
                        size="sm" 
                        className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs"
                    >
                        <Download className="w-3.5 h-3.5" />
                        {isExporting ? (isRu ? 'Формирование Excel...' : 'Exporting...') : (isRu ? 'Экспорт в Excel (.xlsx)' : 'Export Excel (.xlsx)')}
                    </Button>
                </div>
            </div>

            {/* Tab 1: Consolidated Matrix */}
            {selectedTab === 'matrix' && (
                <Card className="border-border/80 shadow-xs overflow-hidden">
                    <CardHeader className="pb-3 border-b border-border/60 bg-muted/20">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                                <CardTitle className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Scale className="w-4 h-4 text-blue-600" />
                                    {isRu ? 'Рабочая таблица консолидации группы компаний (IFRS 10)' : 'Group Consolidation Worksheet (IFRS 10)'}
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    {isRu 
                                        ? 'Агрегация отчетности материнской и 3 дочерних компаний с исключением внутригрупповых оборотов.' 
                                        : 'Aggregation of Parent and 3 Subsidiaries with intercompany eliminations.'}
                                </CardDescription>
                            </div>
                            <span className="text-xs font-mono px-2.5 py-1 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-semibold self-start sm:self-auto">
                                4 Компании • Период: 2026 • UZS
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 overflow-x-auto">
                        <table className="w-full text-xs text-left border-collapse">
                            <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border/80">
                                <tr>
                                    <th className="px-3.5 py-2.5 w-16">Код</th>
                                    <th className="px-3.5 py-2.5 min-w-[200px]">Статья отчетности</th>
                                    <th className="px-3 py-2.5 text-right font-mono">Holding (Головная)</th>
                                    <th className="px-3 py-2.5 text-right font-mono">MFG (80%)</th>
                                    <th className="px-3 py-2.5 text-right font-mono">Retail (100%)</th>
                                    <th className="px-3 py-2.5 text-right font-mono">Logi (75%)</th>
                                    <th className="px-3 py-2.5 text-right font-mono bg-slate-50 dark:bg-slate-900/60 font-bold">Сводно</th>
                                    <th className="px-3 py-2.5 text-right font-mono text-purple-600 dark:text-purple-400">Элиминации Дт/Кт</th>
                                    <th className="px-3.5 py-2.5 text-right font-mono font-bold bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200">
                                        МСФО Группа
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {/* SECTION: ASSETS */}
                                <tr className="bg-blue-50/30 dark:bg-blue-950/20 font-semibold text-slate-800 dark:text-slate-200">
                                    <td colSpan={9} className="px-3.5 py-2 text-[11px] tracking-wider uppercase text-blue-700 dark:text-blue-400">
                                        РАЗДЕЛ I: АКТИВЫ (ASSETS)
                                    </td>
                                </tr>
                                {consolidatedMatrix.filter(r => r.category === 'assets').map((row, idx) => (
                                    <tr key={idx} className="hover:bg-muted/20 transition-colors">
                                        <td className="px-3.5 py-2 font-mono text-slate-500 text-[11px]">{row.account_code}</td>
                                        <td className="px-3.5 py-2 font-medium text-slate-900 dark:text-slate-100">{row.account_name}</td>
                                        <td className="px-3 py-2 text-right font-mono">{row.parent_amount.toLocaleString()}</td>
                                        <td className="px-3 py-2 text-right font-mono">{row.sub1_amount.toLocaleString()}</td>
                                        <td className="px-3 py-2 text-right font-mono">{row.sub2_amount.toLocaleString()}</td>
                                        <td className="px-3 py-2 text-right font-mono">{row.sub3_amount.toLocaleString()}</td>
                                        <td className="px-3 py-2 text-right font-mono font-semibold bg-slate-50 dark:bg-slate-900/60">{row.combined_amount.toLocaleString()}</td>
                                        <td className="px-3 py-2 text-right font-mono text-purple-600 dark:text-purple-400">
                                            {row.elimination_credit > 0 ? `-${row.elimination_credit.toLocaleString()}` : '-'}
                                        </td>
                                        <td className="px-3.5 py-2 text-right font-mono font-bold bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200">
                                            {row.consolidated_amount.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                                <tr className="bg-blue-100/50 dark:bg-blue-900/30 font-bold border-t-2 border-blue-300 dark:border-blue-800">
                                    <td colSpan={2} className="px-3.5 py-2.5 text-blue-950 dark:text-blue-100 uppercase tracking-wide">
                                        ИТОГО АКТИВЫ ГРУППЫ (TOTAL CONSOLIDATED ASSETS)
                                    </td>
                                    <td className="px-3 py-2.5 text-right font-mono">145,000,000</td>
                                    <td className="px-3 py-2.5 text-right font-mono">85,000,000</td>
                                    <td className="px-3 py-2.5 text-right font-mono">62,000,000</td>
                                    <td className="px-3 py-2.5 text-right font-mono">56,000,000</td>
                                    <td className="px-3 py-2.5 text-right font-mono bg-blue-100/70 dark:bg-blue-900/50">348,000,000</td>
                                    <td className="px-3 py-2.5 text-right font-mono text-purple-700 dark:text-purple-300">-{activeElimStats.totalAssetsElim.toLocaleString()}</td>
                                    <td className="px-3.5 py-2.5 text-right font-mono text-blue-950 dark:text-white text-sm bg-blue-200/60 dark:bg-blue-900/70">
                                        {totals.totalAssets.toLocaleString()}
                                    </td>
                                </tr>

                                {/* SECTION: LIABILITIES */}
                                <tr className="bg-amber-50/30 dark:bg-amber-950/20 font-semibold text-slate-800 dark:text-slate-200">
                                    <td colSpan={9} className="px-3.5 py-2 text-[11px] tracking-wider uppercase text-amber-700 dark:text-amber-400">
                                        РАЗДЕЛ II: ОБЯЗАТЕЛЬСТВА (LIABILITIES)
                                    </td>
                                </tr>
                                {consolidatedMatrix.filter(r => r.category === 'liabilities').map((row, idx) => (
                                    <tr key={idx} className="hover:bg-muted/20 transition-colors">
                                        <td className="px-3.5 py-2 font-mono text-slate-500 text-[11px]">{row.account_code}</td>
                                        <td className="px-3.5 py-2 font-medium text-slate-900 dark:text-slate-100">{row.account_name}</td>
                                        <td className="px-3 py-2 text-right font-mono">{row.parent_amount.toLocaleString()}</td>
                                        <td className="px-3 py-2 text-right font-mono">{row.sub1_amount.toLocaleString()}</td>
                                        <td className="px-3 py-2 text-right font-mono">{row.sub2_amount.toLocaleString()}</td>
                                        <td className="px-3 py-2 text-right font-mono">{row.sub3_amount.toLocaleString()}</td>
                                        <td className="px-3 py-2 text-right font-mono font-semibold bg-slate-50 dark:bg-slate-900/60">{row.combined_amount.toLocaleString()}</td>
                                        <td className="px-3 py-2 text-right font-mono text-purple-600 dark:text-purple-400">
                                            {row.elimination_debit > 0 ? `-${row.elimination_debit.toLocaleString()}` : '-'}
                                        </td>
                                        <td className="px-3.5 py-2 text-right font-mono font-bold bg-amber-50/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200">
                                            {row.consolidated_amount.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                                <tr className="bg-amber-100/50 dark:bg-amber-900/30 font-bold border-t-2 border-amber-300 dark:border-amber-800">
                                    <td colSpan={2} className="px-3.5 py-2.5 text-amber-950 dark:text-amber-100 uppercase tracking-wide">
                                        ИТОГО ОБЯЗАТЕЛЬСТВА ГРУППЫ (TOTAL LIABILITIES)
                                    </td>
                                    <td className="px-3 py-2.5 text-right font-mono">40,000,000</td>
                                    <td className="px-3 py-2.5 text-right font-mono">35,000,000</td>
                                    <td className="px-3 py-2.5 text-right font-mono">38,000,000</td>
                                    <td className="px-3 py-2.5 text-right font-mono">36,000,000</td>
                                    <td className="px-3 py-2.5 text-right font-mono bg-amber-100/70 dark:bg-amber-900/50">149,000,000</td>
                                    <td className="px-3 py-2.5 text-right font-mono text-purple-700 dark:text-purple-300">-{activeElimStats.totalLiabElim.toLocaleString()}</td>
                                    <td className="px-3.5 py-2.5 text-right font-mono text-amber-950 dark:text-white text-sm bg-amber-200/60 dark:bg-amber-900/70">
                                        {totals.totalLiabilities.toLocaleString()}
                                    </td>
                                </tr>

                                {/* SECTION: EQUITY */}
                                <tr className="bg-emerald-50/30 dark:bg-emerald-950/20 font-semibold text-slate-800 dark:text-slate-200">
                                    <td colSpan={9} className="px-3.5 py-2 text-[11px] tracking-wider uppercase text-emerald-700 dark:text-emerald-400">
                                        РАЗДЕЛ III: КАПИТАЛ ГРУППЫ И NCI (EQUITY & NCI)
                                    </td>
                                </tr>
                                {consolidatedMatrix.filter(r => r.category === 'equity').map((row, idx) => (
                                    <tr key={idx} className="hover:bg-muted/20 transition-colors">
                                        <td className="px-3.5 py-2 font-mono text-slate-500 text-[11px]">{row.account_code}</td>
                                        <td className="px-3.5 py-2 font-medium text-slate-900 dark:text-slate-100">
                                            {row.account_name}
                                            {row.account_code === 'NCI-IFRS10' && (
                                                <Badge variant="outline" className="ml-2 text-[10px] border-amber-400 text-amber-700 dark:text-amber-300">
                                                    IFRS 10.B94
                                                </Badge>
                                            )}
                                        </td>
                                        <td className="px-3 py-2 text-right font-mono">{row.parent_amount > 0 ? row.parent_amount.toLocaleString() : '-'}</td>
                                        <td className="px-3 py-2 text-right font-mono">{row.sub1_amount > 0 ? row.sub1_amount.toLocaleString() : '-'}</td>
                                        <td className="px-3 py-2 text-right font-mono">{row.sub2_amount > 0 ? row.sub2_amount.toLocaleString() : '-'}</td>
                                        <td className="px-3 py-2 text-right font-mono">{row.sub3_amount > 0 ? row.sub3_amount.toLocaleString() : '-'}</td>
                                        <td className="px-3 py-2 text-right font-mono font-semibold bg-slate-50 dark:bg-slate-900/60">
                                            {row.combined_amount > 0 ? row.combined_amount.toLocaleString() : '-'}
                                        </td>
                                        <td className="px-3 py-2 text-right font-mono text-purple-600 dark:text-purple-400">
                                            {row.elimination_debit > 0 ? `-${row.elimination_debit.toLocaleString()}` : (row.elimination_credit > 0 ? `+${row.elimination_credit.toLocaleString()}` : '-')}
                                        </td>
                                        <td className="px-3.5 py-2 text-right font-mono font-bold bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200">
                                            {row.consolidated_amount.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                                <tr className="bg-emerald-100/50 dark:bg-emerald-900/30 font-bold border-t-2 border-emerald-300 dark:border-emerald-800">
                                    <td colSpan={2} className="px-3.5 py-2.5 text-emerald-950 dark:text-emerald-100 uppercase tracking-wide">
                                        ИТОГО КАПИТАЛ ГРУППЫ С NCI (TOTAL CONSOLIDATED EQUITY)
                                    </td>
                                    <td className="px-3 py-2.5 text-right font-mono">105,000,000</td>
                                    <td className="px-3 py-2.5 text-right font-mono">50,000,000</td>
                                    <td className="px-3 py-2.5 text-right font-mono">24,000,000</td>
                                    <td className="px-3 py-2.5 text-right font-mono">20,000,000</td>
                                    <td className="px-3 py-2.5 text-right font-mono bg-emerald-100/70 dark:bg-emerald-900/50">199,000,000</td>
                                    <td className="px-3 py-2.5 text-right font-mono text-purple-700 dark:text-purple-300">-{activeElimStats.totalEquityElim.toLocaleString()}</td>
                                    <td className="px-3.5 py-2.5 text-right font-mono text-emerald-950 dark:text-white text-sm bg-emerald-200/60 dark:bg-emerald-900/70">
                                        {totals.totalEquity.toLocaleString()}
                                    </td>
                                </tr>

                                {/* EQUILIBRIUM GRAND TOTALS */}
                                <tr className="bg-slate-900 text-white dark:bg-slate-950 font-bold border-t-2 border-black">
                                    <td colSpan={2} className="px-3.5 py-3 tracking-wide text-xs">
                                        ВСЕГО ПАССИВЫ (ОБЯЗАТЕЛЬСТВА + КАПИТАЛ)
                                    </td>
                                    <td className="px-3 py-3 text-right font-mono">145,000,000</td>
                                    <td className="px-3 py-3 text-right font-mono">85,000,000</td>
                                    <td className="px-3 py-3 text-right font-mono">62,000,000</td>
                                    <td className="px-3 py-3 text-right font-mono">56,000,000</td>
                                    <td className="px-3 py-3 text-right font-mono text-slate-300">348,000,000</td>
                                    <td className="px-3 py-3 text-right font-mono text-purple-300">-{activeElimStats.totalAssetsElim.toLocaleString()}</td>
                                    <td className="px-3.5 py-3 text-right font-mono text-emerald-400 text-sm">
                                        {totals.totalLiabAndEquity.toLocaleString()}
                                    </td>
                                </tr>
                                <tr className="bg-emerald-500/10 text-emerald-900 dark:text-emerald-300 font-semibold text-xs border-t border-emerald-500/20">
                                    <td colSpan={8} className="px-3.5 py-2">
                                        КОНТРОЛЬНОЕ РАВНОВЕСИЕ (ДЕЛЬТА: АКТИВЫ - ПАССИВЫ)
                                    </td>
                                    <td className="px-3.5 py-2 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                        {totals.delta.toFixed(2)} UZS (СХОДИТСЯ 100%)
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            )}

            {/* Tab 2: Eliminations Registry */}
            {selectedTab === 'eliminations' && (
                <Card className="border-border/80 shadow-xs">
                    <CardHeader className="pb-3 border-b border-border/60 bg-muted/20">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                                <CardTitle className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Network className="w-4 h-4 text-purple-600" />
                                    {isRu ? 'Реестр внутригрупповых элиминационных проводок (ВГО)' : 'Intercompany Eliminations Journal'}
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    {isRu 
                                        ? 'Исключение взаимной задолженности, торговых операций, займов и нереализованной маржи по стандарту IFRS 10.' 
                                        : 'Elimination of mutual balances, loans, and inventory profit under IFRS 10.'}
                                </CardDescription>
                            </div>
                            <Badge variant="outline" className="border-purple-300 text-purple-700 dark:text-purple-300 text-xs font-mono self-start sm:self-auto">
                                Итого элиминировано: {activeElimStats.totalElimTurnover.toLocaleString()} UZS
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-border/60">
                            {eliminations.map((elim) => (
                                <div key={elim.id} className="p-4 hover:bg-muted/20 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="space-y-1.5 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-muted text-slate-800 dark:text-slate-200 border border-border">
                                                {elim.code}
                                            </span>
                                            <Badge variant="outline" className="text-[10px] border-blue-400 text-blue-700 dark:text-blue-300">
                                                {elim.standard}
                                            </Badge>
                                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                                elim.is_active ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                                            }`}>
                                                {elim.is_active ? (isRu ? 'Активно' : 'Applied') : (isRu ? 'Отключено' : 'Disabled')}
                                            </span>
                                        </div>
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                                            {elim.description}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-semibold text-slate-700 dark:text-slate-300">Дт:</span>
                                                <span className="font-mono text-purple-600 dark:text-purple-400">{elim.account_debit}</span>
                                                <span>({elim.account_debit_name})</span>
                                                <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{elim.entity_debit}</span>
                                            </div>
                                            <ArrowRight className="w-3 h-3 text-slate-400" />
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-semibold text-slate-700 dark:text-slate-300">Кт:</span>
                                                <span className="font-mono text-purple-600 dark:text-purple-400">{elim.account_credit}</span>
                                                <span>({elim.account_credit_name})</span>
                                                <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{elim.entity_credit}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border/40">
                                        <div className="text-right">
                                            <div className="text-base font-bold font-mono text-slate-900 dark:text-white">
                                                {elim.amount.toLocaleString()} UZS
                                            </div>
                                            <span className="text-[10px] text-muted-foreground">{isRu ? 'Сумма элиминации' : 'Elimination Amount'}</span>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant={elim.is_active ? 'outline' : 'default'}
                                            onClick={() => toggleElimination(elim.id)}
                                            className={`text-xs h-8 ${elim.is_active ? 'border-amber-300 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
                                        >
                                            {elim.is_active ? (isRu ? 'Отключить' : 'Disable') : (isRu ? 'Включить' : 'Enable')}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Tab 3: Ownership Structure & NCI Calculation */}
            {selectedTab === 'nci' && (
                <div className="space-y-6">
                    {/* Holding Structure Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {entities.map((ent) => (
                            <Card key={ent.id} className={`border shadow-xs ${ent.role === 'parent' ? 'border-blue-500/40 bg-blue-50/20 dark:bg-blue-950/20' : 'border-border/80'}`}>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <Badge variant={ent.role === 'parent' ? 'default' : 'outline'} className={ent.role === 'parent' ? 'bg-blue-600 text-[10px]' : 'text-[10px]'}>
                                            {ent.role === 'parent' ? (isRu ? 'Материнская компания' : 'Parent Entity') : (isRu ? 'Дочернее общество' : 'Subsidiary')}
                                        </Badge>
                                        <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                                            {ent.ownership_percentage}% {isRu ? 'владение' : 'owned'}
                                        </span>
                                    </div>
                                    <CardTitle className="text-sm font-bold text-slate-900 dark:text-white pt-1">
                                        {ent.name}
                                    </CardTitle>
                                    <CardDescription className="text-[11px] truncate">
                                        {ent.industry}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-2 text-xs pt-0">
                                    <div className="flex justify-between py-1 border-b border-border/40">
                                        <span className="text-muted-foreground">{isRu ? 'Активы:' : 'Assets:'}</span>
                                        <span className="font-mono font-semibold">{ent.assets.toLocaleString()} UZS</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-border/40">
                                        <span className="text-muted-foreground">{isRu ? 'Обязательства:' : 'Liabilities:'}</span>
                                        <span className="font-mono">{ent.liabilities.toLocaleString()} UZS</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-border/40">
                                        <span className="text-muted-foreground">{isRu ? 'Чистые активы (Капитал):' : 'Net Assets (Equity):'}</span>
                                        <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{ent.equity.toLocaleString()} UZS</span>
                                    </div>
                                    <div className="flex justify-between py-1 pt-2 font-medium">
                                        <span className="text-amber-700 dark:text-amber-400 flex items-center gap-1">
                                            <PieChart className="w-3 h-3" />
                                            {isRu ? 'Доля NCI:' : 'NCI Share:'}
                                        </span>
                                        <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                                            {ent.nci_percentage > 0 ? `${ent.nci_percentage}% (${((ent.equity * ent.nci_percentage) / 100).toLocaleString()} UZS)` : '0% (N/A)'}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* NCI Formal Mathematical Proof */}
                    <Card className="border-border/80 shadow-xs">
                        <CardHeader className="pb-3 border-b border-border/60 bg-muted/20">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <Calculator className="w-4 h-4 text-amber-600" />
                                {isRu ? 'Математический расчет доли неконтролирующих акционеров (IFRS 10)' : 'Non-Controlling Interests (NCI) Calculation Worksheet'}
                            </CardTitle>
                            <CardDescription className="text-xs">
                                {isRu 
                                    ? 'Определение справедливой доли миноритарных инвесторов в чистых активах дочерних обществ с учетом внутригрупповых элиминаций.' 
                                    : 'Determination of non-controlling interest in net assets of subsidiaries.'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl border border-amber-300/40 bg-amber-50/30 dark:bg-amber-950/20 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-semibold text-xs text-amber-900 dark:text-amber-300">
                                            1. ManufacturePro LLC (Доля миноритариев 20%)
                                        </h4>
                                        <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-700">
                                            NCI: 20%
                                        </Badge>
                                    </div>
                                    <div className="text-xs space-y-1 text-slate-700 dark:text-slate-300 font-mono">
                                        <div className="flex justify-between">
                                            <span>Базовый капитал (Чистые активы):</span>
                                            <span>50,000,000 UZS</span>
                                        </div>
                                        <div className="flex justify-between text-purple-600">
                                            <span>Корректировка на нереализованную маржу:</span>
                                            <span>-2,100,000 UZS</span>
                                        </div>
                                        <div className="flex justify-between font-semibold border-t pt-1">
                                            <span>Скорректированные чистые активы:</span>
                                            <span>47,900,000 UZS</span>
                                        </div>
                                        <div className="flex justify-between font-bold text-amber-700 dark:text-amber-400 pt-1 text-sm">
                                            <span>Доля NCI (20%):</span>
                                            <span>9,580,000 UZS</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl border border-amber-300/40 bg-amber-50/30 dark:bg-amber-950/20 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-semibold text-xs text-amber-900 dark:text-amber-300">
                                            2. LogiTrans Logistics LLC (Доля миноритариев 25%)
                                        </h4>
                                        <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-700">
                                            NCI: 25%
                                        </Badge>
                                    </div>
                                    <div className="text-xs space-y-1 text-slate-700 dark:text-slate-300 font-mono">
                                        <div className="flex justify-between">
                                            <span>Базовый капитал (Чистые активы):</span>
                                            <span>20,000,000 UZS</span>
                                        </div>
                                        <div className="flex justify-between text-slate-500">
                                            <span>Внутригрупповые элиминации капитала:</span>
                                            <span>0.00 UZS</span>
                                        </div>
                                        <div className="flex justify-between font-semibold border-t pt-1">
                                            <span>Скорректированные чистые активы:</span>
                                            <span>20,000,000 UZS</span>
                                        </div>
                                        <div className="flex justify-between font-bold text-amber-700 dark:text-amber-400 pt-1 text-sm">
                                            <span>Доля NCI (25%):</span>
                                            <span>5,000,000 UZS</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-slate-900 text-white dark:bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <h4 className="font-bold text-sm text-emerald-400 flex items-center gap-1.5">
                                        <ShieldCheck className="w-4 h-4" />
                                        ИТОГО ДОЛЯ НЕКОНТРОЛИРУЮЩИХ АКЦИОНЕРОВ (NCI ПО IFRS 10)
                                    </h4>
                                    <p className="text-xs text-slate-300 mt-0.5">
                                        Сумма NCI выделена в капитале консолидированного отчета о финансовом положении отдельной строкой.
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="text-xl font-bold font-mono text-amber-400">
                                        14,580,000 UZS
                                    </div>
                                    <span className="text-[10px] text-slate-400">9,580,000 + 5,000,000 UZS</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Add Custom Elimination Modal */}
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Plus className="w-5 h-5 text-primary" />
                            {isRu ? 'Новая внутригрупповая элиминация' : 'Add Intercompany Elimination'}
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            {isRu 
                                ? 'Внесите параметры операции для взаимного исключения из консолидированной отчетности.' 
                                : 'Enter details to eliminate intercompany transactions.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 text-xs">
                        <div>
                            <label className="font-semibold block mb-1">
                                {isRu ? 'Описание операции:' : 'Description:'}
                            </label>
                            <input
                                type="text"
                                placeholder={isRu ? 'например, Взаимозачет по договору поставки №42' : 'e.g. Mutual trade offset'}
                                value={newElim.description}
                                onChange={(e) => setNewElim({ ...newElim, description: e.target.value })}
                                className="w-full h-8 px-2.5 rounded-lg border border-border bg-background text-xs outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        <div>
                            <label className="font-semibold block mb-1">
                                {isRu ? 'Сумма элиминации (UZS):' : 'Amount (UZS):'}
                            </label>
                            <input
                                type="text"
                                placeholder="5,000,000"
                                value={newElim.amount}
                                onChange={(e) => setNewElim({ ...newElim, amount: e.target.value })}
                                className="w-full h-8 px-2.5 rounded-lg border border-border bg-background font-mono text-xs outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="font-semibold block mb-1">
                                    {isRu ? 'Дебет счет (Дт):' : 'Debit Account:'}
                                </label>
                                <input
                                    type="text"
                                    value={newElim.account_debit}
                                    onChange={(e) => setNewElim({ ...newElim, account_debit: e.target.value })}
                                    className="w-full h-8 px-2.5 rounded-lg border border-border bg-background font-mono text-xs outline-none"
                                />
                            </div>
                            <div>
                                <label className="font-semibold block mb-1">
                                    {isRu ? 'Кредит счет (Кт):' : 'Credit Account:'}
                                </label>
                                <input
                                    type="text"
                                    value={newElim.account_credit}
                                    onChange={(e) => setNewElim({ ...newElim, account_credit: e.target.value })}
                                    className="w-full h-8 px-2.5 rounded-lg border border-border bg-background font-mono text-xs outline-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="font-semibold block mb-1">
                                    {isRu ? 'Предприятие (Дт):' : 'Entity (Debit):'}
                                </label>
                                <select
                                    value={newElim.entity_debit}
                                    onChange={(e) => setNewElim({ ...newElim, entity_debit: e.target.value })}
                                    className="w-full h-8 px-2 rounded-lg border border-border bg-background text-xs outline-none"
                                >
                                    {entities.map(e => (
                                        <option key={e.id} value={e.name}>{e.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="font-semibold block mb-1">
                                    {isRu ? 'Предприятие (Кт):' : 'Entity (Credit):'}
                                </label>
                                <select
                                    value={newElim.entity_credit}
                                    onChange={(e) => setNewElim({ ...newElim, entity_credit: e.target.value })}
                                    className="w-full h-8 px-2 rounded-lg border border-border bg-background text-xs outline-none"
                                >
                                    {entities.map(e => (
                                        <option key={e.id} value={e.name}>{e.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="pt-2">
                        <Button variant="outline" size="sm" onClick={() => setAddDialogOpen(false)} className="text-xs">
                            {isRu ? 'Отмена' : 'Cancel'}
                        </Button>
                        <Button size="sm" onClick={handleAddElimination} className="text-xs bg-primary hover:bg-primary/90">
                            {isRu ? 'Применить элиминацию' : 'Apply Elimination'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
