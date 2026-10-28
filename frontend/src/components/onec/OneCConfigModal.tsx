import React, { useState, useEffect } from 'react';
import { tr } from '@/lib/i18n';
import api from '../../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { 
    CheckCircle2, 
    XCircle, 
    Loader2, 
    Activity, 
    ShieldCheck, 
    Lock, 
    Server, 
    Eye, 
    EyeOff,
    Building
} from 'lucide-react';

interface OneCConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfigSaved?: () => void;
}

export const OneCConfigModal: React.FC<OneCConfigModalProps> = ({
    isOpen,
    onClose,
    onConfigSaved
}) => {
    const { toast } = useToast();
    const { i18n } = useTranslation();
    void i18n.language;
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showToken, setShowToken] = useState(false);

    const [testResult, setTestResult] = useState<{
        success: boolean;
        message: string;
        latency_ms?: number;
    } | null>(null);

    const [formData, setFormData] = useState({
        url: 'http://1c-server.local/accounting/odata/standard.odata/',
        auth_type: 'basic',
        username: 'odata_user',
        password: '',
        api_token: '',
        company_code: 'TECH-001',
        verify_ssl: true
    });

    const [hasExistingPassword, setHasExistingPassword] = useState(false);
    const [hasExistingToken, setHasExistingToken] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchCurrentConfig();
        }
    }, [isOpen]);

    const fetchCurrentConfig = async () => {
        setLoading(true);
        setTestResult(null);
        try {
            const res = await api.get('/integrations/1c/config');
            if (res.data) {
                setFormData({
                    url: res.data.url || 'http://1c-server.local/accounting/odata/standard.odata/',
                    auth_type: res.data.auth_type || 'basic',
                    username: res.data.username || '',
                    password: '',
                    api_token: '',
                    company_code: res.data.company_code || '',
                    verify_ssl: res.data.verify_ssl !== undefined ? res.data.verify_ssl : true
                });
                setHasExistingPassword(res.data.has_password || false);
                setHasExistingToken(res.data.has_token || false);
                
                if (res.data.status === 'connected') {
                    setTestResult({
                        success: true,
                        message: 'Connected (Last Sync: ' + (res.data.last_sync ? new Date(res.data.last_sync).toLocaleString() : 'N/A') + ')',
                        latency_ms: res.data.last_latency_ms
                    });
                }
            }
        } catch (err: any) {
            // No config exists yet, keep defaults
            console.log('No 1C config found yet');
        } finally {
            setLoading(false);
        }
    };

    const handleTestConnection = async () => {
        setTesting(true);
        setTestResult(null);
        try {
            const payload: any = {
                url: formData.url,
                auth_type: formData.auth_type,
                username: formData.username,
                company_code: formData.company_code,
                verify_ssl: formData.verify_ssl
            };
            if (formData.password) payload.password = formData.password;
            if (formData.api_token) payload.api_token = formData.api_token;

            const res = await api.post('/integrations/1c/test', payload);
            setTestResult(res.data);
            
            if (res.data.success) {
                toast({
                    title: "1C Connection Successful",
                    description: `${res.data.message} (Latency: ${res.data.latency_ms}ms)`,
                });
            } else {
                toast({
                    title: "1C Connection Failed",
                    description: res.data.message,
                    variant: "destructive"
                });
            }
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || "Could not reach 1C OData server";
            setTestResult({
                success: false,
                message: errorMsg
            });
            toast({
                title: "1C Connection Error",
                description: errorMsg,
                variant: "destructive"
            });
        } finally {
            setTesting(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload: any = {
                url: formData.url,
                auth_type: formData.auth_type,
                username: formData.username,
                company_code: formData.company_code,
                verify_ssl: formData.verify_ssl
            };
            if (formData.password) payload.password = formData.password;
            if (formData.api_token) payload.api_token = formData.api_token;

            await api.post('/integrations/1c/config', payload);
            toast({
                title: "Configuration Saved",
                description: "1C:Enterprise connection parameters securely encrypted and saved.",
            });
            if (onConfigSaved) onConfigSaved();
            onClose();
        } catch (err: any) {
            toast({
                title: "Save Failed",
                description: err.response?.data?.detail || "Failed to save 1C configuration",
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
                        <Server className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                        {tr('Настройки подключения к 1С:Предприятие 8.3', '1C:Enterprise 8.3 Connection Settings')}
                    </DialogTitle>
                    <DialogDescription className="text-slate-500 dark:text-slate-400">
                        {tr('Настройка двусторонней OData v4 интеграции с 1С:Бухгалтерия (Хозрасчетный). Пароли и токены шифруются по стандарту AES-256/Fernet.', 'Configure production-grade two-way OData v4 integration with 1C:Accounting (Хозрасчетный). Credentials are encrypted with AES-256/Fernet.')}
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="py-12 flex justify-center items-center">
                        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
                    </div>
                ) : (
                    <form onSubmit={handleSave} className="space-y-4 pt-2">
                        {/* Status Badge */}
                        {testResult && (
                            <div className={`p-3 rounded-lg border flex items-center justify-between text-sm ${
                                testResult.success 
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200' 
                                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                            }`}>
                                <div className="flex items-center gap-2 font-medium">
                                    {testResult.success ? (
                                        <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                    ) : (
                                        <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />
                                    )}
                                    <span>{testResult.message}</span>
                                </div>
                                {testResult.latency_ms !== undefined && (
                                    <span className="text-xs bg-white/80 dark:bg-slate-800 px-2 py-0.5 rounded font-mono shadow-sm">
                                        ⏱️ {testResult.latency_ms} ms
                                    </span>
                                )}
                            </div>
                        )}

                        {/* OData URL */}
                        <div className="space-y-1.5">
                            <Label htmlFor="url" className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">
                                {tr('URL публикации OData 1C', '1C OData Endpoint URL')}
                            </Label>
                            <div className="relative">
                                <Input
                                    id="url"
                                    value={formData.url}
                                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                    placeholder="http://1c-host/base/odata/standard.odata/"
                                    required
                                    className="font-mono text-sm pr-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                                />
                                <Server className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                {tr('URL стандартного интерфейса OData публикации 1С. Для оффлайн-тестирования укажите mock или localhost.', 'Target standard 1C OData publication URL. Use mock or localhost for offline testing.')}
                            </p>
                        </div>

                        {/* Auth Type & Organization Code */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="auth_type" className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">
                                    {tr('Метод авторизации', 'Authentication Method')}
                                </Label>
                                <select
                                    id="auth_type"
                                    value={formData.auth_type}
                                    onChange={(e) => setFormData({ ...formData, auth_type: e.target.value })}
                                    className="w-full h-10 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                                >
                                    <option value="basic">{tr('Basic Auth (Логин и Пароль)', 'Basic Auth (Login & Password)')}</option>
                                    <option value="token">{tr('Bearer Токен / API Ключ', 'Bearer Token / API Key')}</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="company_code" className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">
                                    {tr('Организация 1С (Код/ИНН/GUID)', '1C Organization (Code/GUID)')}
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="company_code"
                                        value={formData.company_code}
                                        onChange={(e) => setFormData({ ...formData, company_code: e.target.value })}
                                        placeholder="000000001"
                                        className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                                    />
                                    <Building className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                                </div>
                            </div>
                        </div>

                        {/* Basic Auth Credentials */}
                        {formData.auth_type === 'basic' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="username" className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">
                                        {tr('Имя пользователя 1С', '1C Username')}
                                    </Label>
                                    <Input
                                        id="username"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        placeholder="odata_user"
                                        className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="password" className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase flex items-center justify-between">
                                        <span>{tr('Пароль', 'Password')}</span>
                                        {hasExistingPassword && (
                                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">
                                                {tr('(🔒 Пароль сохранён)', '(🔒 Encrypted password saved)')}
                                            </span>
                                        )}
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            placeholder={hasExistingPassword ? (tr("•••••••• (Оставьте пустым)", "•••••••• (Leave blank to keep)")) : (tr("Введите пароль 1С", "Enter 1C password"))}
                                            className="pr-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Token Auth */}
                        {formData.auth_type === 'token' && (
                            <div className="space-y-1.5">
                                <Label htmlFor="api_token" className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase flex items-center justify-between">
                                    <span>{tr('Bearer Токен / API Секрет', 'Bearer Token / API Secret')}</span>
                                    {hasExistingToken && (
                                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">
                                            {tr('(🔒 Токен сохранён)', '(🔒 Token saved)')}
                                        </span>
                                    )}
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="api_token"
                                        type={showToken ? 'text' : 'password'}
                                        value={formData.api_token}
                                        onChange={(e) => setFormData({ ...formData, api_token: e.target.value })}
                                        placeholder={hasExistingToken ? (tr("•••••••••••• (Оставьте пустым)", "•••••••••••• (Leave blank to keep)")) : (tr("Введите токен", "Enter Bearer Token"))}
                                        className="font-mono text-sm pr-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowToken(!showToken)}
                                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                    >
                                        {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* SSL Verify Toggle */}
                        <div className="flex items-center gap-2 pt-1">
                            <input
                                id="verify_ssl"
                                type="checkbox"
                                checked={formData.verify_ssl}
                                onChange={(e) => setFormData({ ...formData, verify_ssl: e.target.checked })}
                                className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-amber-600 focus:ring-amber-500"
                            />
                            <Label htmlFor="verify_ssl" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer flex items-center gap-1">
                                <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                                {tr('Проверять SSL сертификат (отключите для самоподписанных интранет-серверов)', 'Verify SSL Certificate (Disable for self-signed intranet 1C servers)')}
                            </Label>
                        </div>

                        {/* Dialog Actions */}
                        <DialogFooter className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 sm:justify-between">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleTestConnection}
                                disabled={testing || saving}
                                className="border-amber-400/40 text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                            >
                                {testing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin text-amber-600" />
                                        {tr('Проверка связи...', 'Testing Ping...')}
                                    </>
                                ) : (
                                    <>
                                        <Activity className="mr-2 h-4 w-4 text-amber-600" />
                                        {tr('Проверить связь', 'Test Connection')}
                                    </>
                                )}
                            </Button>

                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onClose}
                                    disabled={saving}
                                    className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                    {tr('Отмена', 'Cancel')}
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-amber-600 hover:bg-amber-700 text-white font-medium"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            {tr('Шифрование и сохранение...', 'Encrypting & Saving...')}
                                        </>
                                    ) : (
                                        <>
                                            <Lock className="mr-2 h-4 w-4" />
                                            {tr('Сохранить настройки', 'Save Settings')}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
};
