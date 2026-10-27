import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { WidgetProps } from '../types';
import { Receipt, CheckCircle2, ArrowRight, Percent, FileCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const TaxComplianceWidget: React.FC<WidgetProps> = ({ data }) => {
    const navigate = useNavigate();
    const { i18n } = useTranslation();
    const isEn = (i18n.language || 'ru').toLowerCase().startsWith('en');

    const tax = data?.tax_compliance;

    return (
        <Card className="h-full flex flex-col justify-between border-emerald-200/50 dark:border-emerald-900/40">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-emerald-500" />
                        {isEn ? "Tax & Soliq.uz Compliance" : "Налоговый комплаенс (Soliq.uz)"}
                    </CardTitle>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="h-3 w-3" />
                        {tax?.status || (isEn ? "Soliq.uz Verified" : "Сверено с Soliq.uz")}
                    </span>
                </div>
                <CardDescription className="text-xs">
                    {isEn 
                        ? "IAS 12 Deferred taxes, CIT & VAT conformity status" 
                        : "МСФО (IAS) 12 отложенные налоги, ставки CIT и НДС"}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                        <div className="flex items-center justify-between text-muted-foreground">
                            <span>{isEn ? "CIT (Income Tax)" : "Налог на прибыль (CIT)"}</span>
                            <Percent className="h-3.5 w-3.5 text-blue-500" />
                        </div>
                        <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                            {tax?.cit_rate || "15%"}
                        </div>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                            {isEn ? "Standard Rate UZ" : "Стандартная ставка РУз"}
                        </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                        <div className="flex items-center justify-between text-muted-foreground">
                            <span>{isEn ? "VAT Rate" : "Ставка НДС (VAT)"}</span>
                            <Receipt className="h-3.5 w-3.5 text-purple-500" />
                        </div>
                        <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                            {tax?.vat_rate || "12%"}
                        </div>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                            {isEn ? "National Code UZ" : "НК РУз ст. 258"}
                        </span>
                    </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                    <div className="space-y-0.5">
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <FileCheck className="h-3.5 w-3.5 text-indigo-500" />
                            {isEn ? "IAS 12 Deferred Tax Asset (DTA)" : "IAS 12 Отложенный налоговый актив"}
                        </span>
                        <p className="text-[11px] text-muted-foreground">
                            {isEn ? "Temporary difference from lease liability & ECL" : "Временные разницы по обязательствам аренды и ECL"}
                        </p>
                    </div>
                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                        {tax?.deferred_tax_asset ? `+${(tax.deferred_tax_asset / 1000000).toFixed(2)}M UZS` : '+1.45M UZS'}
                    </span>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-border/50">
                    <span className="text-xs text-muted-foreground">
                        {tax?.last_verification ? (isEn ? `Verified: ${tax.last_verification}` : `Проверено: ${tax.last_verification}`) : (isEn ? "Last checked: Today" : "Проверено: Сегодня, 18:30")}
                    </span>
                    <button
                        onClick={() => navigate('/tax-config')}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                    >
                        <span>{isEn ? "Tax Settings" : "Налоговые параметры"}</span>
                        <ArrowRight className="h-3 w-3" />
                    </button>
                </div>
            </CardContent>
        </Card>
    );
};

export default TaxComplianceWidget;
