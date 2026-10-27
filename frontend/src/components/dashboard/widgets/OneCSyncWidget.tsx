import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WidgetProps } from '../types';
import { RefreshCw, Database, Settings, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { useTranslation } from 'react-i18next';
import { OneCConfigModal } from '@/components/onec/OneCConfigModal';

export const OneCSyncWidget: React.FC<WidgetProps> = ({ data }) => {
    const { i18n } = useTranslation();
    const isEn = (i18n.language || 'ru').toLowerCase().startsWith('en');

    const status = data?.one_c_status;
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [syncing, setSyncing] = useState(false);

    const handleSync = async () => {
        setSyncing(true);
        try {
            const res = await api.post('/onec/sync');
            const totalAccounts = res.data?.total_accounts;
            const isBalanced = res.data?.is_balanced;
            
            const detailMsg = totalAccounts !== undefined
                ? (isEn 
                    ? `Synchronized ${totalAccounts} accounts. ${isBalanced ? 'Trial balance verified (Δ=0).' : ''}` 
                    : `Синхронизировано ${totalAccounts} счетов. ${isBalanced ? 'ОСВ сбалансирована (Δ=0).' : ''}`)
                : (res.data?.message || (isEn ? "1C data synchronized successfully" : "Данные из 1С успешно получены"));

            toast({
                title: isEn ? "1C:Enterprise Sync Completed" : "Синхронизация 1С:Предприятие завершена",
                description: detailMsg,
            });
            window.dispatchEvent(new Event('refresh-dashboard'));
        } catch (error: any) {
            toast({
                title: isEn ? "Sync Failed" : "Ошибка синхронизации 1С",
                description: error.response?.data?.detail || (isEn ? "Failed to trigger 1C sync" : "Не удалось выполнить синхронизацию с 1С"),
                variant: "destructive"
            });
        } finally {
            setSyncing(false);
        }
    };

    const formatSyncTime = (text?: string | null) => {
        if (!text) return isEn ? 'Never' : 'Никогда';
        if (!isEn) {
            return text
                .replace(/(\d+)\s+minutes?\s+ago/i, '$1 мин. назад')
                .replace(/(\d+)\s+hours?\s+ago/i, '$1 ч. назад')
                .replace(/just now/i, 'только что')
                .replace(/Never/i, 'Никогда');
        }
        return text;
    };

    return (
        <Card className="h-full flex flex-col justify-between">
            <div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                        <Database className="h-4 w-4 text-amber-500" />
                        <span>{isEn ? "1C:Enterprise Sync" : "Интеграция 1С:Предприятие"}</span>
                    </CardTitle>
                    <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => setIsConfigOpen(true)}
                        title={isEn ? "1C Connection Settings" : "Параметры подключения 1С"}
                    >
                        <Settings className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <div className={`h-2.5 w-2.5 rounded-full ${status?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                            <span className="text-sm font-medium">
                                {status?.connected 
                                    ? (isEn ? 'Connected' : 'Подключено к OData') 
                                    : (isEn ? 'Disconnected' : 'Отключено')}
                            </span>
                        </div>
                        {status?.connected && (
                            <span className="text-[11px] font-mono bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                                OData v4
                            </span>
                        )}
                    </div>

                    <div className="text-xs text-muted-foreground flex items-center justify-between pt-1">
                        <span>{isEn ? "Last sync:" : "Последняя синхр.:"}</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                            {formatSyncTime(status?.last_sync)}
                        </span>
                    </div>

                    {status?.errors && (
                        <div className="mt-1 text-xs text-rose-500 font-medium flex items-center gap-1">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                            <span>{isEn ? "Sync warning detected" : "Обнаружено предупреждение синхронизации"}</span>
                        </div>
                    )}
                </CardContent>
            </div>

            <div className="p-6 pt-0">
                <Button 
                    onClick={handleSync}
                    disabled={syncing}
                    className="w-full flex items-center justify-center space-x-2 text-xs py-2 rounded-md transition-colors bg-amber-600 hover:bg-amber-700 text-white"
                >
                    {syncing ? (
                        <>
                            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                            <span>{isEn ? 'Syncing with 1C...' : 'Синхронизация с 1С...'}</span>
                        </>
                    ) : (
                        <>
                            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                            <span>{isEn ? 'Sync Trial Balance Now' : 'Синхронизировать ОСВ'}</span>
                        </>
                    )}
                </Button>
            </div>

            {/* Enterprise 1C Configuration Modal */}
            <OneCConfigModal 
                isOpen={isConfigOpen} 
                onClose={() => setIsConfigOpen(false)} 
                onConfigSaved={() => {
                    window.dispatchEvent(new Event('refresh-dashboard'));
                }}
            />
        </Card>
    );
};
