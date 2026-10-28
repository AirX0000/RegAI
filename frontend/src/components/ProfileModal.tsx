import { useState, useEffect } from 'react';
import { tr } from '@/lib/i18n';
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
import { useTranslation } from 'react-i18next';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
    const { user, refreshUser } = useAuth();
    const { toast } = useToast();
    const { i18n } = useTranslation();
    void i18n.language;
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
                title: tr("Профиль обновлен", "Profile Updated"),
                description: tr("Ваши личные данные успешно сохранены.", "Your profile details have been saved."),
            });
        } catch (err: any) {
            toast({
                variant: "destructive",
                title: tr("Ошибка обновления", "Update Error"),
                description: err.response?.data?.detail || (tr("Не удалось сохранить профиль.", "Failed to save profile.")),
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
            setPasswordError(tr("Введите текущий пароль", "Please enter your current password"));
            return;
        }

        if (newPassword.length < 8) {
            setPasswordError(tr("Новый пароль должен содержать не менее 8 символов", "New password must be at least 8 characters long"));
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError(tr("Новый пароль и подтверждение не совпадают", "New password and confirmation do not match"));
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
                title: tr("Пароль изменён", "Password Changed"),
                description: tr("Ваш пароль успешно обновлен. Активная сессия продлена.", "Your password was successfully updated."),
            });
        } catch (err: any) {
            const msg = err.response?.data?.detail || (tr("Не удалось изменить пароль. Проверьте правильность текущего пароля.", "Failed to change password. Please check your current password."));
            setPasswordError(msg);
            toast({
                variant: "destructive",
                title: tr("Ошибка смены пароля", "Password Change Error"),
                description: msg,
            });
        } finally {
            setIsChangingPassword(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div 
                className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-base shadow-sm">
                            {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">
                                {user.full_name || user.email}
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100 dark:border-slate-800 px-6 bg-white dark:bg-slate-900">
                    <button
                        onClick={() => setActiveTab('info')}
                        className={`flex items-center gap-2 py-3 px-3 text-sm font-medium border-b-2 transition-all ${
                            activeTab === 'info'
                                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                    >
                        <UserIcon className="w-4 h-4" />
                        {tr('Данные аккаунта', 'Account Details')}
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`flex items-center gap-2 py-3 px-3 text-sm font-medium border-b-2 transition-all ${
                            activeTab === 'security'
                                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                    >
                        <Lock className="w-4 h-4" />
                        {tr('Безопасность и пароль', 'Security & Password')}
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {activeTab === 'info' && (
                        <form onSubmit={handleSaveProfile} className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="email" className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                    {tr('Email адрес (логин)', 'Email Address (Login)')}
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={user.email}
                                    disabled
                                    className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed"
                                />
                                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                                    {tr('Email используется для входа и не подлежит изменению.', 'Email is used for sign-in and cannot be changed.')}
                                </span>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="fullName" className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                    {tr('Полное имя / Отображаемое имя', 'Full Name / Display Name')}
                                </Label>
                                <Input
                                    id="fullName"
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder={tr("Иван Иванов", "John Doe")}
                                    className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-slate-100 focus-visible:ring-blue-500"
                                />
                            </div>

                            {/* Meta badges */}
                            <div className="pt-2 grid grid-cols-2 gap-3">
                                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
                                    <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                                    <div className="overflow-hidden">
                                        <div className="text-[11px] text-slate-400 dark:text-slate-500">{tr('Роль в системе', 'System Role')}</div>
                                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 capitalize truncate">
                                            {user.role}
                                        </div>
                                    </div>
                                </div>
                                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
                                    <Building className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                                    <div className="overflow-hidden">
                                        <div className="text-[11px] text-slate-400 dark:text-slate-500">{tr('Организация / Тенант', 'Organization / Tenant')}</div>
                                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 font-mono truncate">
                                            {user.tenant_id ? user.tenant_id.slice(0, 12) + '...' : 'Default'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onClose}
                                    className="text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                    {tr('Закрыть', 'Close')}
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSavingProfile}
                                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                                >
                                    {isSavingProfile 
                                        ? (tr("Сохранение...", "Saving...")) 
                                        : (tr("Сохранить изменения", "Save Changes"))}
                                </Button>
                            </div>
                        </form>
                    )}

                    {activeTab === 'security' && (
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            {passwordSuccess && (
                                <div className="p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-700 text-xs font-medium animate-in fade-in">
                                    <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600" />
                                    <span>
                                        {tr('Пароль успешно обновлен! Новая сессия активирована.', 'Password updated successfully! Active session refreshed.')}
                                    </span>
                                </div>
                            )}

                            {passwordError && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs font-medium animate-in fade-in">
                                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                                    <span>{passwordError}</span>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <Label htmlFor="currentPassword" className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                     {tr('Текущий пароль', 'Current Password')}
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="currentPassword"
                                        type={showCurrentPassword ? "text" : "password"}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 pr-10 focus-visible:ring-blue-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                    >
                                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="newPassword" className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                     {tr('Новый пароль (минимум 8 символов)', 'New Password (at least 8 characters)')}
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="newPassword"
                                        type={showNewPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 pr-10 focus-visible:ring-blue-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                    >
                                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="confirmPassword" className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                     {tr('Подтвердите новый пароль', 'Confirm New Password')}
                                </Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus-visible:ring-blue-500"
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onClose}
                                    className="text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                    {tr('Отмена', 'Cancel')}
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isChangingPassword}
                                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                                >
                                    {isChangingPassword 
                                        ? (tr("Обновление...", "Updating...")) 
                                        : (tr("Сменить пароль", "Change Password"))}
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
