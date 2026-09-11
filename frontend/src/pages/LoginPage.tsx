import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';
import { 
    ShieldCheck, 
    Sparkles, 
    Building2, 
    UserCheck, 
    FileSpreadsheet, 
    Eye, 
    EyeOff, 
    Lock, 
    Mail, 
    ArrowRight, 
    Cpu, 
    Check 
} from 'lucide-react';
import LanguageSwitcher from '../components/LanguageSwitcher';

const DEMO_ACCOUNTS = [
    { role: 'superadmin', label: '👑 Master SuperAdmin', email: 'superadmin@finbridge.demo', badge: 'Global Access', color: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100' },
    { role: 'admin', label: 'Company Admin', email: 'admin@finbridge.demo', badge: 'Company Only', color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100' },
    { role: 'company_owner', label: 'Owner', email: 'owner@finbridge.demo', badge: 'Executive', color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' },
    { role: 'accountant', label: 'Accountant', email: 'accountant@finbridge.demo', badge: 'Ledger', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' },
    { role: 'auditor', label: 'Auditor', email: 'auditor@finbridge.demo', badge: 'Audit', color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' },
    { role: 'user', label: 'Analyst', email: 'analyst@finbridge.demo', badge: 'User', color: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100' },
];

export default function LoginPage() {
    const { t } = useTranslation();
    const { register, handleSubmit, setValue } = useForm();
    const { login } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [activeDemo, setActiveDemo] = useState<string | null>(null);
    const ssoEnabled = import.meta.env.VITE_SSO_ENABLED === 'true';

    const fillCredentials = (email: string) => {
        setValue('email', email);
        setValue('password', 'FinBridge2026!');
        setActiveDemo(email);
        toast({
            title: "Credentials Loaded",
            description: `Filled: ${email} with demo password`,
        });
    };

    const onSubmit = async (data: any) => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('username', data.email);
            params.append('password', data.password);

            const res = await api.post('/auth/login', params, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            login(res.data.access_token);
            toast({
                title: "Welcome to RegAI",
                description: "Session authenticated successfully",
            });
            navigate('/');
        } catch (error: any) {
            console.error('Login error:', error);
            toast({
                variant: "destructive",
                title: t('error') || "Authentication Failed",
                description: error.response?.data?.detail || "Invalid credentials. Please verify your email/password.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row relative overflow-hidden selection:bg-blue-500 selection:text-white">
            
            {/* Ambient Gradient Glows */}
            <div className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] rounded-full bg-gradient-to-br from-blue-600/15 via-indigo-600/10 to-transparent blur-[140px] pointer-events-none" />
            <div className="absolute bottom-[-15%] right-[-10%] w-[55%] h-[55%] rounded-full bg-gradient-to-tl from-indigo-600/15 via-purple-600/10 to-transparent blur-[140px] pointer-events-none" />
            <div className="absolute top-[40%] right-[30%] w-[35%] h-[35%] rounded-full bg-emerald-600/5 blur-[150px] pointer-events-none" />

            {/* LEFT PANEL: Brand Showcase & Financial Intelligence (Visible on lg+) */}
            <div className="hidden lg:flex lg:w-1/2 xl:w-7/12 flex-col justify-between p-12 xl:p-16 border-r border-slate-800/80 bg-slate-950/60 backdrop-blur-xl relative z-10">
                {/* Top Branding */}
                <div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/25 ring-1 ring-white/20">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-black tracking-tight text-white">Reg<span className="text-blue-500">AI</span></span>
                                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                    v2.6 Enterprise
                                </span>
                            </div>
                            <p className="text-xs text-slate-400">Autonomous Financial Regulatory Intelligence</p>
                        </div>
                    </div>

                    {/* Hero Title & Value Proposition */}
                    <div className="max-w-xl mt-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-4">
                            <Cpu className="w-3.5 h-3.5" />
                            <span>{t('login_badge') || 'Автоматизация МСФО и НСБУ 2026 • Enterprise'}</span>
                        </div>
                        <h1 className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-tight">
                            {t('login_hero_title') || 'Автоматизация МСФО & Финансовый Комплаенс'}
                        </h1>
                        <p className="mt-4 text-sm text-slate-300 leading-relaxed">
                            {t('login_hero_desc') || 'Мгновенная трансформация отчетности по стандартам МСФО 9, 16 и 36. Бесшовная синхронизация с 1С:Предприятие через OData и аудит в реальном времени.'}
                        </p>
                    </div>
                </div>

                {/* Middle Feature Showcase: Live Telemetry Card */}
                <div className="my-8 max-w-xl">
                    <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-2xl shadow-black/60 backdrop-blur-xl relative overflow-hidden">
                        {/* Header with Pulse */}
                        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
                            <div className="flex items-center gap-2">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                </span>
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                                    Live Financial Telemetry
                                </span>
                            </div>
                            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                                99.9% Operational
                            </span>
                        </div>

                        {/* 3 Telemetry Grid Items */}
                        <div className="grid grid-cols-3 gap-3 my-4">
                            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                                <div className="text-[11px] text-slate-400 font-medium">МСФО 9 (ECL)</div>
                                <div className="text-sm font-bold text-white mt-1">Stage 1 / 2 / 3</div>
                                <div className="text-[10px] text-emerald-400 mt-0.5">EAD×PD×LGD×DF</div>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                                <div className="text-[11px] text-slate-400 font-medium">МСФО 16 (Аренда)</div>
                                <div className="text-sm font-bold text-white mt-1">ROU & Обязательства</div>
                                <div className="text-[10px] text-blue-400 mt-0.5">PV Аннуитет</div>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                                <div className="text-[11px] text-slate-400 font-medium">1C:Предприятие</div>
                                <div className="text-sm font-bold text-white mt-1">OData REST API</div>
                                <div className="text-[10px] text-emerald-400 mt-0.5">Двусторонний sync</div>
                            </div>
                        </div>

                        {/* Journal Entry Real-Time Preview */}
                        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                            <span className="text-slate-500">Автопроводки:</span>
                            <span className="text-slate-300 font-semibold bg-slate-950/80 px-2.5 py-1 rounded border border-slate-800 text-[10px] sm:text-[11px]">
                                Дт 91.02 — Кт 63 | Дт 08.04 — Кт 76.07
                            </span>
                        </div>
                    </div>
                </div>

                {/* Bottom Trust & Compliance Footers */}
                <div className="flex items-center gap-6 text-xs text-slate-400 pt-6 border-t border-slate-800/60">
                    <div className="flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>AES-256 / TLS 1.3</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-blue-400" />
                        <span>Мультитенантная изоляция</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <FileSpreadsheet className="w-4 h-4 text-purple-400" />
                        <span>МСФО (IFRS) & НСБУ</span>
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL: Authentication Form */}
            <div className="w-full lg:w-1/2 xl:w-5/12 flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-14 relative z-10 overflow-y-auto">
                {/* Top Bar (Language + Status) */}
                <div className="flex items-center justify-between w-full mb-6">
                    {/* Mobile Logo (< lg) */}
                    <div className="flex lg:hidden items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                            R
                        </div>
                        <span className="text-xl font-bold text-white">Reg<span className="text-blue-500">AI</span></span>
                    </div>
                    <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                        <span>{t('system_online') || 'Система онлайн'}</span>
                    </div>
                    <div>
                        <LanguageSwitcher className="bg-slate-900/90 border border-slate-800 text-slate-200 hover:text-white hover:bg-slate-800 px-3 py-1.5 rounded-lg text-xs" />
                    </div>
                </div>

                {/* Center Auth Card */}
                <div className="my-auto w-full max-w-md mx-auto">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-white tracking-tight">
                            {t('login_welcome') || 'Вход в систему'}
                        </h2>
                        <p className="text-xs text-slate-400 mt-1">
                            {t('login_welcome_sub') || 'Выберите готовый демо-профиль или войдите по корпоративной почте'}
                        </p>
                    </div>

                    {/* 1-Click Demo Profiles Card */}
                    <div className="mb-6 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                                <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                                {t('demo_profiles_title') || 'Демо-профили в 1 клик'}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                                FinBridge2026!
                            </span>
                        </div>

                        {/* Master SuperAdmin Hero Card */}
                        <div className="mb-2.5">
                            {DEMO_ACCOUNTS.filter(a => a.role === 'superadmin').map((acc) => {
                                const isSelected = activeDemo === acc.email;
                                return (
                                    <button
                                        key={acc.email}
                                        type="button"
                                        onClick={() => fillCredentials(acc.email)}
                                        className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                                            isSelected 
                                                ? 'border-indigo-500 bg-indigo-500/20 text-white ring-2 ring-indigo-500/40 shadow-lg shadow-indigo-500/10' 
                                                : 'border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 to-slate-900/60 text-slate-200 hover:border-indigo-500/60 hover:bg-indigo-950/60'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-sm">
                                                👑
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-white">Master SuperAdmin</span>
                                                    <span className="text-[9px] px-1.5 py-0.2 rounded font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                                        Global Access
                                                    </span>
                                                </div>
                                                <span className="text-[10px] text-slate-400">{acc.email}</span>
                                            </div>
                                        </div>
                                        {isSelected && <Check className="w-4 h-4 text-indigo-400" />}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Company Scoped Profiles Grid */}
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1.5 font-semibold">
                            {t('company_scoped_title') || 'Профили компании (Изолированные)'}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {DEMO_ACCOUNTS.filter(a => a.role !== 'superadmin').map((acc) => {
                                const isSelected = activeDemo === acc.email;
                                return (
                                    <button
                                        key={acc.email}
                                        type="button"
                                        onClick={() => fillCredentials(acc.email)}
                                        className={`p-2 rounded-lg border text-left transition-all flex flex-col justify-between ${
                                            isSelected 
                                                ? 'border-blue-500 bg-blue-500/20 text-white ring-1 ring-blue-500' 
                                                : 'border-slate-800 bg-slate-950/50 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between w-full mb-0.5">
                                            <span className="text-xs font-semibold truncate">{acc.label}</span>
                                            <span className="text-[9px] px-1 rounded bg-slate-800 text-slate-400">{acc.badge}</span>
                                        </div>
                                        <span className="text-[9px] text-slate-500 truncate">{acc.email}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Form */}
                    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                        <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1.5">
                                {t('email') || 'Корпоративный Email'}
                            </label>
                            <div className="relative">
                                <Input
                                    {...register('email')}
                                    type="email"
                                    placeholder="name@company.com"
                                    required
                                    className="bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 focus-visible:ring-blue-500 pl-9"
                                />
                                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-xs font-medium text-slate-300">
                                    {t('password') || 'Пароль'}
                                </label>
                                <span className="text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer">
                                    {t('forgot_password') || 'Забыли пароль?'}
                                </span>
                            </div>
                            <div className="relative">
                                <Input
                                    {...register('password')}
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    required
                                    className="bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 focus-visible:ring-blue-500 pl-9 pr-10"
                                />
                                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 focus:outline-none transition-colors"
                                    title={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <span>{t('sign_in') || 'Авторизация'}...</span>
                            ) : (
                                <>
                                    <span>{t('sign_in') || 'Войти в рабочее пространство'}</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </Button>
                    </form>

                    {ssoEnabled && (
                        <div className="mt-4">
                            <Button variant="outline" className="w-full border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white">
                                <Building2 className="w-4 h-4 mr-2 text-slate-400" />
                                Вход через 1С / SSO (OIDC)
                            </Button>
                        </div>
                    )}
                </div>

                {/* Bottom Disclaimer */}
                <div className="mt-8 text-center text-[11px] text-slate-500">
                    {t('security_encryption') || 'Шифрование 256-bit TLS • Мультитенантная изоляция • Стандарты IFRS'}
                </div>
            </div>
        </div>
    );
}
