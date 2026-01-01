import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';

export default function LoginPage() {
    const { t } = useTranslation();
    const { register, handleSubmit } = useForm();
    const { login } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const ssoEnabled = import.meta.env.VITE_SSO_ENABLED === 'true';

    const onSubmit = async (data: any) => {
        setIsLoading(true);
        try {
            // Create URLSearchParams for proper form encoding
            const params = new URLSearchParams();
            params.append('username', data.email);
            params.append('password', data.password);

            const res = await api.post('/auth/login', params, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            login(res.data.access_token);
            navigate('/');
        } catch (error) {
            console.error('Login error:', error);
            toast({
                variant: "destructive",
                title: t('error'),
                description: "Invalid credentials",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
            <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-6 shadow-md">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight">RegAI</h2>
                    <p className="mt-2 text-sm text-gray-600">{t('sign_in')} to your account</p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">{t('email')}</label>
                        <Input {...register('email')} type="email" required className="mt-1" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">{t('password')}</label>
                        <Input {...register('password')} type="password" required className="mt-1" />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? `${t('sign_in')}...` : t('sign_in')}
                    </Button>
                </form>

                {ssoEnabled && (
                    <div className="mt-4">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-2 text-gray-500">Or continue with</span>
                            </div>
                        </div>
                        <Button variant="outline" className="mt-4 w-full">
                            Login with SSO
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
