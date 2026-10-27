import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { createMockToken } from '../lib/authUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';
import { 
    ShieldCheck, 
    Building2, 
    UserCheck, 
    FileSpreadsheet, 
    Eye, 
    EyeOff, 
    Lock, 
    Mail, 
    ArrowRight, 
    Cpu,
    KeyRound,
    CheckCircle2,
    X
} from 'lucide-react';
import LanguageSwitcher from '../components/LanguageSwitcher';
import ThemeToggle from '../components/ThemeToggle';

const DEMO_ORGANIZATIONS = [
    {
        id: 'techcorp',
        name: 'TechCorp Ltd',
        label: 'TechCorp (Орг. 1)',
        company_id: '2727830ea39d470c917f1a1544ed5d0f',
        accounts: [
            { role: 'company_owner', label: 'Владелец (Owner)', name: 'Сардор Рахимов', email: 'owner@axiaris.ai', badge: 'Executive' },
            { role: 'accountant', label: 'Главбух (МСФО)', name: 'Елена Васильева', email: 'accountant@axiaris.ai', badge: 'Ledger' },
            { role: 'admin', label: 'Администратор', name: 'Камилла Каримова', email: 'admin@axiaris.ai', badge: 'Admin' },
            { role: 'auditor', label: 'Аудитор', name: 'Дмитрий Ким', email: 'auditor@axiaris.ai', badge: 'Audit' },
        ]
    },
    {
        id: 'finserve',
        name: 'FinServe Holdings',
        label: 'FinServe (Орг. 2)',
        company_id: 'b968f7d7ffe04630a90aadde4d0d8e95',
        accounts: [
            { role: 'admin', label: 'Администратор FinServe', name: 'Бахром Алиев', email: 'admin@finserve.com', badge: 'Admin' },
            { role: 'accountant', label: 'Главбух FinServe', name: 'Наргиза Саидова', email: 'accountant@finserve.com', badge: 'Ledger' },
            { role: 'auditor', label: 'Аудитор FinServe', name: 'Олег Новиков', email: 'auditor@finserve.com', badge: 'Audit' },
        ]
    }
];

export default function LoginPage() {
    const { t } = useTranslation();
    const { register, handleSubmit, setValue, getValues } = useForm();
    const { login } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [activeCompanyTab, setActiveCompanyTab] = useState<string>('techcorp');
    const [activeDemo, setActiveDemo] = useState<string | null>(null);
    const ssoEnabled = import.meta.env.VITE_SSO_ENABLED === 'true';

    // Forgot Password 2-Step Recovery State
    const [isForgotOpen, setIsForgotOpen] = useState(false);
    const [forgotStep, setForgotStep] = useState<'request' | 'reset'>('request');
    const [forgotEmail, setForgotEmail] = useState('');
    const [resetCode, setResetCode] = useState('');
    const [generatedDemoCode, setGeneratedDemoCode] = useState<string | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [isForgotLoading, setIsForgotLoading] = useState(false);

    const openForgotModal = () => {
        const currentEmail = (getValues('email') || '').trim();
        setForgotEmail(currentEmail || 'owner@axiaris.ai');
        setForgotStep('request');
        setResetCode('');
        setGeneratedDemoCode(null);
        setNewPassword('');
        setConfirmPassword('');
        setIsForgotOpen(true);
    };

    const handleRequestResetCode = async (e: React.FormEvent) => {
        e.preventDefault();
        const emailClean = forgotEmail.trim().toLowerCase();
        if (!emailClean || !emailClean.includes('@')) {
            toast({
                variant: 'destructive',
                title: 'Ошибка',
                description: 'Введите корректный корпоративный Email',
            });
            return;
        }
        setIsForgotLoading(true);
        try {
            const res = await api.post('/auth/forgot-password', { email: emailClean });
            const codeFromServer = res.data?.demo_reset_code || null;
            setGeneratedDemoCode(codeFromServer);
            if (codeFromServer) {
                setResetCode(codeFromServer);
            }
            setForgotStep('reset');
            toast({
                title: 'Код восстановления отправлен',
                description: `6-значный код безопасности сформирован для ${emailClean} (действителен 15 минут).`,
            });
        } catch (err: any) {
            // Local fallback if backend is unreachable
            const fallbackCode = String(Math.floor(100000 + Math.random() * 900000));
            setGeneratedDemoCode(fallbackCode);
            setResetCode(fallbackCode);
            setForgotStep('reset');
            toast({
                title: 'Код восстановления сформирован',
                description: `Используйте 6-значный код подтверждения для смены пароля ${emailClean}.`,
            });
        } finally {
            setIsForgotLoading(false);
        }
    };

    const handleConfirmPasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        const emailClean = forgotEmail.trim().toLowerCase();
        if (resetCode.trim().length < 6) {
            toast({
                variant: 'destructive',
                title: 'Неверный код',
                description: 'Введите 6-значный код подтверждения',
            });
            return;
        }
        if (newPassword.length < 8) {
            toast({
                variant: 'destructive',
                title: 'Слабый пароль',
                description: 'Новый пароль должен содержать минимум 8 символов',
            });
            return;
        }
        if (newPassword !== confirmPassword) {
            toast({
                variant: 'destructive',
                title: 'Пароли не совпадают',
                description: 'Убедитесь, что новый пароль и подтверждение совпадают',
            });
            return;
        }

        setIsForgotLoading(true);
        try {
            await api.post('/auth/reset-password', {
                email: emailClean,
                reset_code: resetCode.trim(),
                new_password: newPassword,
            });
            setValue('email', emailClean, { shouldValidate: true, shouldDirty: true });
            setValue('password', newPassword, { shouldValidate: true, shouldDirty: true });
            setIsForgotOpen(false);
            toast({
                title: 'Пароль успешно изменен',
                description: 'Новый пароль сохранен и подставлен в форму входа.',
            });
        } catch (err: any) {
            const detail = err?.response?.data?.detail || 'Неверный или просроченный код восстановления';
            toast({
                variant: 'destructive',
                title: 'Ошибка смены пароля',
                description: detail,
            });
        } finally {
            setIsForgotLoading(false);
        }
    };

    const fillCredentials = (email: string) => {
        setValue('email', email, { shouldValidate: true, shouldDirty: true });
        setValue('password', 'FinBridge2026!', { shouldValidate: true, shouldDirty: true });
        setActiveDemo(email);
    };

    const onSubmit = async (data: any) => {
        setIsLoading(true);
        try {
            const emailInput = (data.email || '').toLowerCase().trim();
            const passwordInput = data.password || 'FinBridge2026!';

            // Find matching demo account if applicable
            const allAccounts = DEMO_ORGANIZATIONS.flatMap(org => 
                org.accounts.map(acc => ({
                    ...acc,
                    company_id: org.company_id,
                    company_name: org.name
                }))
            );
            const matchedDemo = allAccounts.find(d => 
                d.email.toLowerCase() === emailInput ||
                d.email.replace('@axiaris.ai', '@regai.ai').toLowerCase() === emailInput ||
                d.email.replace('@regai.ai', '@axiaris.ai').toLowerCase() === emailInput
            );

            let tokenToUse: string | null = null;
            let displayName = emailInput;

            try {
                const params = new URLSearchParams();
                params.append('username', emailInput);
                params.append('password', passwordInput);

                const res = await api.post('/auth/login', params, {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                });

                if (res.data?.access_token) {
                    tokenToUse = res.data.access_token;
                    displayName = res.data.user?.full_name || matchedDemo?.name || emailInput;
                }
            } catch (err: any) {
                const isMockAllowed = import.meta.env.VITE_ENABLE_MOCK_FALLBACK === 'true' || import.meta.env.DEV;
                if (!isMockAllowed) {
                    const errorMsg = err?.response?.data?.detail || "Invalid email or password. Please try again.";
                    toast({
                        title: "Authentication Failed",
                        description: errorMsg,
                        variant: "destructive",
                    });
                    setIsLoading(false);
                    return;
                }
                console.warn('Backend login route offline, using demo fallback token:', err);
            }

            // Fallback token generator (only in dev / demo mode)
            if (!tokenToUse) {
                const isMockAllowed = import.meta.env.VITE_ENABLE_MOCK_FALLBACK === 'true' || import.meta.env.DEV;
                if (!isMockAllowed) {
                    toast({
                        title: "Login Error",
                        description: "Could not authenticate with server.",
                        variant: "destructive",
                    });
                    setIsLoading(false);
                    return;
                }
                if (matchedDemo) {
                    tokenToUse = createMockToken({
                        email: matchedDemo.email,
                        full_name: matchedDemo.name,
                        name: matchedDemo.name,
                        role: matchedDemo.role,
                        tenant_id: 'b4e63cbc5d5348c5bfddf1c35a9886ba',
                        company_id: matchedDemo.company_id,
                        company_name: matchedDemo.company_name,
                    });
                    displayName = `${matchedDemo.label} (${matchedDemo.company_name})`;
                } else {
                    const isSuper = emailInput.includes('superadmin');
                    const role = isSuper ? 'superadmin' :
                                 emailInput.includes('owner') ? 'company_owner' :
                                 emailInput.includes('accountant') ? 'accountant' :
                                 emailInput.includes('admin') ? 'admin' :
                                 emailInput.includes('auditor') ? 'auditor' : 'user';
                    tokenToUse = createMockToken({
                        email: emailInput,
                        full_name: emailInput.split('@')[0],
                        name: emailInput.split('@')[0],
                        role: role,
                        tenant_id: 'b4e63cbc5d5348c5bfddf1c35a9886ba',
                        company_id: isSuper ? undefined : '2727830ea39d470c917f1a1544ed5d0f',
                        company_name: isSuper ? 'Платформа Axiaris' : 'TechCorp Ltd',
                    });
                    displayName = emailInput;
                }
            }

            await login(tokenToUse);
            toast({
                title: "Welcome to Axiaris",
                description: `Вход выполнен: ${displayName}`,
            });
            navigate('/');
        } catch (error: any) {
            console.error('Login error:', error);
            toast({
                variant: "destructive",
                title: t('error') || "Authentication Failed",
                description: error?.message || "Invalid credentials. Please verify your email/password.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050814] text-slate-100 flex flex-col lg:flex-row relative overflow-hidden selection:bg-cyan-500 selection:text-white">
            
            {/* Ambient Gradient Glows (Cyan, Sapphire Blue, Purple Glows matched to Logo) */}
            <div className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] rounded-full bg-gradient-to-br from-cyan-500/20 via-blue-600/15 to-transparent blur-[140px] pointer-events-none" />
            <div className="absolute bottom-[-15%] right-[-10%] w-[55%] h-[55%] rounded-full bg-gradient-to-tl from-indigo-600/15 via-violet-600/20 to-transparent blur-[140px] pointer-events-none" />
            <div className="absolute top-[40%] right-[30%] w-[35%] h-[35%] rounded-full bg-cyan-500/10 blur-[150px] pointer-events-none" />

            {/* LEFT PANEL: Brand Showcase & Financial Intelligence (Visible on lg+) */}
            <div className="hidden lg:flex lg:w-1/2 xl:w-7/12 flex-col justify-between p-12 xl:p-16 border-r border-[#162244] bg-[#050814]/80 backdrop-blur-xl relative z-10">
                {/* Top Branding */}
                <div>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="relative group">
                            <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 opacity-75 blur-md group-hover:opacity-100 transition duration-300"></div>
                            <img
                                src="/axiaris-logo.png"
                                alt="Axiaris Logo"
                                width={56}
                                height={56}
                                fetchPriority="high"
                                decoding="async"
                                className="relative w-14 h-14 rounded-2xl object-cover ring-1 ring-white/30 shadow-2xl shadow-cyan-500/30"
                            />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-black tracking-tight text-white">
                                    Axi<span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">aris</span>
                                </span>
                                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_8px_rgba(6,182,212,0.2)]">
                                    v2.6 Enterprise
                                </span>
                            </div>
                            <p className="text-xs text-slate-400">Autonomous Financial Regulatory Intelligence</p>
                        </div>
                    </div>

                    {/* Hero Title & Value Proposition */}
                    <div className="max-w-xl mt-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium mb-4">
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
                    <div className="p-5 rounded-2xl bg-[#0b1228]/90 border border-[#162244] shadow-2xl shadow-black/60 backdrop-blur-xl relative overflow-hidden">
                        {/* Header with Pulse */}
                        <div className="flex items-center justify-between pb-3.5 border-b border-[#162244]">
                            <div className="flex items-center gap-2">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
                                </span>
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                                    Live Financial Telemetry
                                </span>
                            </div>
                            <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                                99.9% Operational
                            </span>
                        </div>

                        {/* 3 Telemetry Grid Items */}
                        <div className="grid grid-cols-3 gap-3 my-4">
                            <div className="p-3 rounded-xl bg-[#050814]/80 border border-[#162244]">
                                <div className="text-[11px] text-slate-400 font-medium">МСФО 9 (ECL)</div>
                                <div className="text-sm font-bold text-white mt-1">Stage 1 / 2 / 3</div>
                                <div className="text-[10px] text-cyan-400 mt-0.5">EAD×PD×LGD×DF</div>
                            </div>
                            <div className="p-3 rounded-xl bg-[#050814]/80 border border-[#162244]">
                                <div className="text-[11px] text-slate-400 font-medium">МСФО 16 (Аренда)</div>
                                <div className="text-sm font-bold text-white mt-1">ROU & Обязательства</div>
                                <div className="text-[10px] text-blue-400 mt-0.5">PV Аннуитет</div>
                            </div>
                            <div className="p-3 rounded-xl bg-[#050814]/80 border border-[#162244]">
                                <div className="text-[11px] text-slate-400 font-medium">1C:Предприятие</div>
                                <div className="text-sm font-bold text-white mt-1">OData REST API</div>
                                <div className="text-[10px] text-emerald-400 mt-0.5">Двусторонний sync</div>
                            </div>
                        </div>

                        {/* Journal Entry Real-Time Preview */}
                        <div className="pt-3 border-t border-[#162244] flex items-center justify-between text-[11px] font-mono text-slate-400">
                            <span className="text-slate-500">Автопроводки:</span>
                            <span className="text-slate-300 font-semibold bg-[#050814]/90 px-2.5 py-1 rounded border border-[#162244] text-[10px] sm:text-[11px]">
                                Дт 91.02 — Кт 63 | Дт 08.04 — Кт 76.07
                            </span>
                        </div>
                    </div>
                </div>

                {/* Bottom Trust & Compliance Footers */}
                <div className="flex items-center gap-6 text-xs text-slate-400 pt-6 border-t border-[#162244]">
                    <div className="flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>AES-256 / TLS 1.3</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-cyan-400" />
                        <span>Мультитенантная изоляция</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <FileSpreadsheet className="w-4 h-4 text-violet-400" />
                        <span>МСФО (IFRS) & НСБУ</span>
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL: Authentication Form */}
            <div className="w-full lg:w-1/2 xl:w-5/12 flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-14 relative z-10 overflow-y-auto">
                {/* Top Bar (Language + Status) */}
                <div className="flex items-center justify-between w-full mb-6">
                    {/* Mobile Logo (< lg) */}
                    <div className="flex lg:hidden items-center gap-3">
                        <div className="relative flex items-center justify-center">
                            <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 opacity-70 blur-xs"></div>
                            <img
                                src="/axiaris-logo.png"
                                alt="Axiaris Logo"
                                width={32}
                                height={32}
                                fetchPriority="high"
                                decoding="async"
                                className="relative w-8 h-8 rounded-xl object-cover ring-1 ring-white/20"
                            />
                        </div>
                        <span className="text-xl font-bold text-white">
                            Axi<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">aris</span>
                        </span>
                    </div>
                    <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                        <span>{t('system_online') || 'Система онлайн'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <ThemeToggle className="bg-[#0b1228] border border-[#162244] text-slate-200 hover:text-white hover:bg-[#121c3d] px-3 py-1.5 rounded-lg text-xs" />
                        <LanguageSwitcher className="bg-[#0b1228] border border-[#162244] text-slate-200 hover:text-white hover:bg-[#121c3d] px-3 py-1.5 rounded-lg text-xs" />
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
                    <div className="mb-6 p-4 rounded-2xl bg-[#0b1228]/90 border border-[#162244] shadow-xl">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                                <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                                {t('demo_profiles_title') || 'Демо-профили в 1 клик'}
                            </span>
                        </div>

                        {/* Organization Switcher Tabs */}
                        <div className="flex items-center gap-1.5 p-1 mb-3 bg-[#050814] rounded-xl border border-[#162244]">
                            {DEMO_ORGANIZATIONS.map(org => (
                                <button
                                    key={org.id}
                                    type="button"
                                    onClick={() => setActiveCompanyTab(org.id)}
                                    className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-semibold transition-all truncate ${
                                        activeCompanyTab === org.id
                                            ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/30 text-cyan-300 border border-cyan-500/40 shadow-xs'
                                            : 'text-slate-400 hover:text-slate-200 hover:bg-[#0b1228]'
                                    }`}
                                >
                                    {org.label}
                                </button>
                            ))}
                        </div>

                        {/* Organization Scoped Profiles Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {DEMO_ORGANIZATIONS.find(o => o.id === activeCompanyTab)?.accounts.map((acc) => {
                                const isSelected = activeDemo === acc.email;
                                return (
                                    <button
                                        key={acc.email}
                                        type="button"
                                        onClick={() => fillCredentials(acc.email)}
                                        className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                                            isSelected 
                                                ? 'border-cyan-500 bg-cyan-500/10 text-white ring-1 ring-cyan-500/60 shadow-md shadow-cyan-500/20' 
                                                : 'border-[#162244] bg-[#050814]/70 text-slate-300 hover:border-cyan-500/40 hover:bg-[#0e1635]'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between w-full gap-2">
                                            <span className="text-xs font-semibold whitespace-nowrap text-white">{acc.label}</span>
                                            {isSelected ? (
                                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30 whitespace-nowrap">
                                                    ✓ Готово
                                                </span>
                                            ) : (
                                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#101935] text-slate-400 font-mono whitespace-nowrap">{acc.badge}</span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                                            <span className="font-mono text-slate-400 truncate max-w-[125px]">{acc.email}</span>
                                            <span className="text-slate-400 text-[10px] font-medium truncate">{acc.name}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Inline hint when profile selected */}
                        {activeDemo && (
                            <div className="mt-3 flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 animate-in fade-in slide-in-from-top-1 duration-200">
                                <div className="flex items-center gap-2">
                                    <span className="text-cyan-400 text-xs font-bold">✓</span>
                                    <span className="text-xs text-cyan-300 font-medium">
                                        Данные заполнены
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => onSubmit({ email: activeDemo, password: 'FinBridge2026!' })}
                                    className="text-xs px-2.5 py-1 rounded-md bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
                                >
                                    <span>Войти сейчас</span>
                                    <ArrowRight className="w-3 h-3" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Form */}
                    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                        <div>
                            <label htmlFor="login-email" className="block text-xs font-medium text-slate-300 mb-1.5">
                                {t('email') || 'Корпоративный Email'}
                            </label>
                            <div className="relative">
                                <Input
                                    id="login-email"
                                    {...register('email')}
                                    type="email"
                                    autoComplete="username"
                                    spellCheck={false}
                                    placeholder="name@company.com"
                                    required
                                    className="bg-[#050814] border-[#162244] text-white placeholder:text-slate-500 focus-visible:ring-cyan-500 pl-9"
                                />
                                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label htmlFor="login-password" className="block text-xs font-medium text-slate-300">
                                    {t('password') || 'Пароль'}
                                </label>
                                <button
                                    type="button"
                                    onClick={openForgotModal}
                                    className="text-[11px] text-cyan-400 hover:text-cyan-300 underline-offset-4 hover:underline cursor-pointer transition-colors"
                                >
                                    {t('forgot_password') || 'Забыли пароль?'}
                                </button>
                            </div>
                            <div className="relative">
                                <Input
                                    id="login-password"
                                    {...register('password')}
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    required
                                    className="bg-[#050814] border-[#162244] text-white placeholder:text-slate-500 focus-visible:ring-cyan-500 pl-9 pr-10"
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
                            className="w-full bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 hover:from-cyan-400 hover:via-blue-500 hover:to-violet-500 text-white font-semibold py-2.5 rounded-xl transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2"
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

            {/* Forgot Password 2-Step Recovery Modal */}
            {isForgotOpen && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="forgot-password-title"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150"
                >
                    <div className="w-full max-w-md rounded-2xl bg-[#0b1228] border border-[#162244] shadow-2xl p-6 text-slate-100 relative">
                        <button
                            type="button"
                            onClick={() => setIsForgotOpen(false)}
                            aria-label="Закрыть окно восстановления пароля"
                            className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#121c3d] transition-colors cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                                <KeyRound className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 id="forgot-password-title" className="text-lg font-bold text-white">
                                    Восстановление пароля
                                </h3>
                                <p className="text-xs text-slate-400">
                                    {forgotStep === 'request'
                                        ? 'Шаг 1 из 2 • Запрос одноразового кода безопасности'
                                        : 'Шаг 2 из 2 • Подтверждение кода и установка нового пароля'}
                                </p>
                            </div>
                        </div>

                        {forgotStep === 'request' ? (
                            <form onSubmit={handleRequestResetCode} className="space-y-4">
                                <p className="text-xs text-slate-300 leading-relaxed">
                                    Укажите ваш корпоративный Email. Система сформирует 6-значный одноразовый код подтверждения (действителен 15 минут) и зафиксирует событие в журнале аудита.
                                </p>
                                <div>
                                    <label htmlFor="forgot-email-input" className="block text-xs font-medium text-slate-300 mb-1.5">
                                        Корпоративный Email
                                    </label>
                                    <div className="relative">
                                        <Input
                                            id="forgot-email-input"
                                            type="email"
                                            autoComplete="username"
                                            spellCheck={false}
                                            required
                                            value={forgotEmail}
                                            onChange={(e) => setForgotEmail(e.target.value)}
                                            placeholder="name@company.com"
                                            className="bg-[#050814] border-[#162244] text-white placeholder:text-slate-500 focus-visible:ring-cyan-500 pl-9"
                                        />
                                        <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="flex items-center justify-end gap-2 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsForgotOpen(false)}
                                        className="border-[#162244] bg-[#050814] text-slate-300 hover:bg-[#121c3d] hover:text-white"
                                    >
                                        Отмена
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isForgotLoading}
                                        className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold"
                                    >
                                        {isForgotLoading ? 'Отправка...' : 'Получить код'}
                                    </Button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleConfirmPasswordReset} className="space-y-4">
                                {generatedDemoCode && (
                                    <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 text-xs text-cyan-300">
                                            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                                            <span>Код подтверждения для <b>{forgotEmail}</b>:</span>
                                        </div>
                                        <span className="font-mono text-sm font-bold tracking-widest text-white bg-[#050814] px-2.5 py-1 rounded-lg border border-cyan-500/40">
                                            {generatedDemoCode}
                                        </span>
                                    </div>
                                )}

                                <div>
                                    <label htmlFor="reset-code-input" className="block text-xs font-medium text-slate-300 mb-1.5">
                                        6-значный код подтверждения
                                    </label>
                                    <Input
                                        id="reset-code-input"
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        maxLength={6}
                                        required
                                        value={resetCode}
                                        onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                                        placeholder="123456"
                                        className="bg-[#050814] border-[#162244] text-white font-mono tracking-widest text-center text-base focus-visible:ring-cyan-500"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="new-password-input" className="block text-xs font-medium text-slate-300 mb-1.5">
                                        Новый пароль (минимум 8 символов)
                                    </label>
                                    <div className="relative">
                                        <Input
                                            id="new-password-input"
                                            type={showNewPassword ? 'text' : 'password'}
                                            autoComplete="new-password"
                                            minLength={8}
                                            required
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Введите новый пароль"
                                            className="bg-[#050814] border-[#162244] text-white placeholder:text-slate-500 focus-visible:ring-cyan-500 pl-9 pr-10"
                                        />
                                        <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                                        >
                                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="confirm-password-input" className="block text-xs font-medium text-slate-300 mb-1.5">
                                        Подтвердите новый пароль
                                    </label>
                                    <div className="relative">
                                        <Input
                                            id="confirm-password-input"
                                            type={showNewPassword ? 'text' : 'password'}
                                            autoComplete="new-password"
                                            minLength={8}
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Повторите новый пароль"
                                            className="bg-[#050814] border-[#162244] text-white placeholder:text-slate-500 focus-visible:ring-cyan-500 pl-9"
                                        />
                                        <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between gap-2 pt-2">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setForgotStep('request')}
                                        className="text-xs text-slate-400 hover:text-white hover:bg-[#121c3d]"
                                    >
                                        ← Изменить Email
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isForgotLoading}
                                        className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold"
                                    >
                                        {isForgotLoading ? 'Сохранение...' : 'Сохранить новый пароль'}
                                    </Button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
