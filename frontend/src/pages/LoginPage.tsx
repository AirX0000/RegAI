import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Sparkles, Building2, UserCheck, FileSpreadsheet, Lock } from 'lucide-react';

const DEMO_ACCOUNTS = [
    { role: 'admin', label: 'SuperAdmin', email: 'admin@finbridge.demo', badge: 'Admin', color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100' },
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
        <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background Decorative Gradients */}
            <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />

            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-3">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Statutory-to-IFRS Automation Engine</span>
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
                    Reg<span className="text-blue-500">AI</span>
                </h1>
                <p className="mt-2 text-sm text-slate-400">
                    Enterprise Financial Regulatory Compliance & Transformation
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl relative z-10 px-4">
                <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-xl py-8 px-6 sm:px-10 rounded-2xl shadow-2xl shadow-black/40">
                    
                    {/* Demo Quick-Login Switcher */}
                    <div className="mb-6 p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                        <div className="flex items-center justify-between mb-2.5">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                                <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                                1-Click Demo Profiles (Sandbox)
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">FinBridge2026!</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {DEMO_ACCOUNTS.map((acc) => {
                                const isSelected = activeDemo === acc.email;
                                return (
                                    <button
                                        key={acc.email}
                                        type="button"
                                        onClick={() => fillCredentials(acc.email)}
                                        className={`flex flex-col text-left p-2 rounded-lg border transition-all ${
                                            isSelected 
                                                ? 'border-blue-500 bg-blue-500/15 text-white ring-1 ring-blue-500' 
                                                : 'border-slate-700/70 bg-slate-800/40 text-slate-300 hover:border-slate-600 hover:bg-slate-800'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between w-full">
                                            <span className="text-xs font-bold truncate">{acc.label}</span>
                                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-700/80 text-slate-300">{acc.badge}</span>
                                        </div>
                                        <span className="text-[10px] text-slate-400 truncate mt-0.5">{acc.email}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
                        <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1.5">
                                {t('email') || 'Business Email'}
                            </label>
                            <Input
                                {...register('email')}
                                type="email"
                                placeholder="name@company.com"
                                required
                                className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1.5">
                                {t('password') || 'Password'}
                            </label>
                            <div className="relative">
                                <Input
                                    {...register('password')}
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
                                />
                                <Lock className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-lg transition-all shadow-lg shadow-blue-600/20"
                            disabled={isLoading}
                        >
                            {isLoading ? `${t('sign_in') || 'Authenticating'}...` : (t('sign_in') || 'Sign In to Workspace')}
                        </Button>
                    </form>

                    {ssoEnabled && (
                        <div className="mt-6">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-slate-800" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-slate-900 px-2 text-slate-500">Or continue with</span>
                                </div>
                            </div>
                            <Button variant="outline" className="mt-4 w-full border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-800 hover:text-white">
                                <Building2 className="w-4 h-4 mr-2 text-slate-400" />
                                Single Sign-On (SSO / OIDC)
                            </Button>
                        </div>
                    )}

                    <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            Deterministic IFRS Engine
                        </span>
                        <span className="flex items-center gap-1">
                            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
                            1C OData Sync Ready
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
