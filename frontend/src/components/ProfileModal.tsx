import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
    X, 
    User as UserIcon, 
    Lock, 
    Shield, 
    Building, 
    AlertCircle, 
    Eye, 
    EyeOff,
    CheckCircle2
} from 'lucide-react';
import api from '../lib/api';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
    const { user, refreshUser } = useAuth();
    const { toast } = useToast();

    const [activeTab, setActiveTab] = useState<'info' | 'security'>('info');

    // Profile info state
    const [fullName, setFullName] = useState('');
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    // Password change state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState(false);

    useEffect(() => {
        if (user) {
            setFullName(user.full_name || '');
        }
        if (isOpen) {
            setPasswordError(null);
            setPasswordSuccess(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        }
    }, [user, isOpen]);

    if (!isOpen || !user) return null;

    const handleSaveProfile = async (e: FormEvent) => {
        e.preventDefault();
        setIsSavingProfile(true);
        try {
            await api.put('/users/me/profile', {
                full_name: fullName.trim()
            });
            await refreshUser();
            toast({
                title: "Профиль обновлен",
                description: "Ваши личные данные успешно сохранены.",
            });
        } catch (err: any) {
            toast({
                variant: "destructive",
                title: "Ошибка обновления",
                description: err.response?.data?.detail || "Не удалось сохранить профиль.",
            });
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleChangePassword = async (e: FormEvent) => {
        e.preventDefault();
        setPasswordError(null);
        setPasswordSuccess(false);

        if (!currentPassword) {
            setPasswordError("Введите текущий пароль");
            return;
        }

        if (newPassword.length < 8) {
            setPasswordError("Новый пароль должен содержать не менее 8 символов");
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError("Новый пароль и подтверждение не совпадают");
            return;
        }

        setIsChangingPassword(true);
        try {
            const res = await api.put('/users/me/password', {
                current_password: currentPassword,
                new_password: newPassword
            });

            if (res.data?.access_token) {
                localStorage.setItem('token', res.data.access_token);
            }

            setPasswordSuccess(true);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');

            toast({
                title: "Пароль изменён",
                description: "Ваш пароль успешно обновлен. Активная сессия продлена.",
            });
        } catch (err: any) {
            const msg = err.response?.data?.detail || "Не удалось изменить пароль. Проверьте правильность текущего пароля.";
            setPasswordError(msg);
            toast({
                variant: "destructive",
                title: "Ошибка смены пароля",
                description: msg,
            });
        } finally {
            setIsChangingPassword(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div 
                className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-base shadow-sm">
                            {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 leading-tight">
                                {user.full_name || user.email}
                            </h2>
                            <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100 px-6 bg-white">
                    <button
                        onClick={() => setActiveTab('info')}
                        className={`flex items-center gap-2 py-3 px-3 text-sm font-medium border-b-2 transition-all ${
                            activeTab === 'info'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <UserIcon className="w-4 h-4" />
                        Данные аккаунта
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`flex items-center gap-2 py-3 px-3 text-sm font-medium border-b-2 transition-all ${
                            activeTab === 'security'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <Lock className="w-4 h-4" />
                        Безопасность и пароль
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {activeTab === 'info' && (
                        <form onSubmit={handleSaveProfile} className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="email" className="text-xs font-semibold text-slate-600">
                                    Email адрес (логин)
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={user.email}
                                    disabled
                                    className="bg-slate-50 text-slate-500 border-slate-200 cursor-not-allowed"
                                />
                                <span className="text-[11px] text-slate-400">Email используется для входа и не подлежит изменению.</span>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="fullName" className="text-xs font-semibold text-slate-600">
                                    Полное имя / Отображаемое имя
                                </Label>
                                <Input
                                    id="fullName"
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Иван Иванов"
                                    className="border-slate-200 focus-visible:ring-blue-500"
                                />
                            </div>

                            {/* Meta badges */}
                            <div className="pt-2 grid grid-cols-2 gap-3">
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2.5">
                                    <Shield className="w-4 h-4 text-blue-600 shrink-0" />
                                    <div className="overflow-hidden">
                                        <div className="text-[11px] text-slate-400">Роль в системе</div>
                                        <div className="text-xs font-semibold text-slate-800 capitalize truncate">
                                            {user.role}
                                        </div>
                                    </div>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2.5">
                                    <Building className="w-4 h-4 text-indigo-600 shrink-0" />
                                    <div className="overflow-hidden">
                                        <div className="text-[11px] text-slate-400">Организация / Тенант</div>
                                        <div className="text-xs font-semibold text-slate-800 font-mono truncate">
                                            {user.tenant_id ? user.tenant_id.slice(0, 12) + '...' : 'Default'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onClose}
                                    className="text-slate-600"
                                >
                                    Закрыть
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSavingProfile}
                                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                                >
                                    {isSavingProfile ? "Сохранение..." : "Сохранить изменения"}
                                </Button>
                            </div>
                        </form>
                    )}

                    {activeTab === 'security' && (
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            {passwordSuccess && (
                                <div className="p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-700 text-xs font-medium animate-in fade-in">
                                    <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600" />
                                    <span>Пароль успешно обновлен! Новая сессия активирована.</span>
                                </div>
                            )}

                            {passwordError && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs font-medium animate-in fade-in">
                                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                                    <span>{passwordError}</span>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <Label htmlFor="currentPassword" className="text-xs font-semibold text-slate-600">
                                    Текущий пароль
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="currentPassword"
                                        type={showCurrentPassword ? "text" : "password"}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="border-slate-200 pr-10 focus-visible:ring-blue-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="newPassword" className="text-xs font-semibold text-slate-600">
                                    Новый пароль (минимум 8 символов)
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="newPassword"
                                        type={showNewPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="border-slate-200 pr-10 focus-visible:ring-blue-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="confirmPassword" className="text-xs font-semibold text-slate-600">
                                    Подтвердите новый пароль
                                </Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="border-slate-200 focus-visible:ring-blue-500"
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onClose}
                                    className="text-slate-600"
                                >
                                    Отмена
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isChangingPassword}
                                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                                >
                                    {isChangingPassword ? "Обновление..." : "Сменить пароль"}
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
