import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Button } from '@/components/ui/button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';
import { Building2, Users as UsersIcon } from 'lucide-react';
import { tr } from '../lib/i18n';

export default function UsersPage() {
    const { t } = useTranslation();
    const [users, setUsers] = useState<any[]>([]);
    const [companies, setCompanies] = useState<any[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [inviteData, setInviteData] = useState({
        email: '',
        password: '',
        full_name: '',
        role: 'user',
        company_id: ''
    });
    const [editData, setEditData] = useState({
        role: '',
        email: '',
        password: ''
    });
    const { user } = useAuth();
    const { toast } = useToast();

    useEffect(() => {
        fetchUsers();
        api.get('/companies/')
            .then(res => setCompanies(Array.isArray(res?.data) ? res.data : []))
            .catch(err => {
                console.warn('Failed to load companies:', err);
                setCompanies([]);
            });
    }, [selectedCompanyId]);

    const fetchUsers = async () => {
        try {
            const params: any = {};
            if (selectedCompanyId) {
                params.company_id = selectedCompanyId;
            }
            const res = await api.get('/users/', { params });
            const list = Array.isArray(res?.data) ? res.data : [];
            const filtered = user?.role === 'superadmin' ? list : list.filter((u: any) => u.role !== 'superadmin');
            setUsers(filtered);
        } catch (err) {
            console.warn('Failed to load users:', err);
            setUsers([]);
        }
    };

    const handleInvite = async () => {
        try {
            const payload = {
                ...inviteData,
                company_id: user?.role === 'superadmin' ? (inviteData.company_id || user?.company_id) : user?.company_id
            };
            await api.post('/users/invite', payload);
            toast({
                title: t('success'),
                description: t('user_invited_successfully'),
            });
            setIsInviteOpen(false);
            // Refresh users list
            fetchUsers();
            // Reset form
            setInviteData({
                email: '',
                password: '',
                full_name: '',
                role: 'user',
                company_id: ''
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: t('error'),
                description: error.response?.data?.detail || t('failed_to_invite_user'),
            });
        }
    };

    const handleEdit = (user: any) => {
        setEditingUser(user);
        setEditData({ role: user.role, email: user.email, password: '' });
        setIsEditOpen(true);
    };

    const handleUpdateUser = async () => {
        if (!editingUser) return;
        try {
            const payload: any = { role: editData.role };
            // Only include email and password if superadmin and fields are filled
            if (user?.role === 'superadmin') {
                if (editData.email && editData.email !== editingUser.email) {
                    payload.email = editData.email;
                }
                if (editData.password) {
                    payload.password = editData.password;
                }
            }
            await api.put(`/users/${editingUser.id}`, payload);
            toast({
                title: t('success'),
                description: tr('Данные пользователя успешно обновлены', 'User updated successfully', 'Foydalanuvchi ma\'lumotlari muvaffaqiyatli yangilandi'),
            });
            setIsEditOpen(false);
            fetchUsers();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: t('error'),
                description: error.response?.data?.detail || tr('Не удалось обновить пользователя', 'Failed to update user', 'Foydalanuvchini yangilab bo\'lmadi'),
            });
        }
    };

    const getRoleLabel = (role: string) => {
        switch ((role || '').toLowerCase()) {
            case 'superadmin':
                return tr('Суперадмин', 'Superadmin', 'Superadmin');
            case 'company_owner':
                return tr('Владелец бизнеса', 'Company Owner', 'Biznes egasi');
            case 'admin':
                return tr('Администратор', 'Admin', 'Administrator');
            case 'accountant':
                return tr('Бухгалтер', 'Accountant', 'Buxgalter');
            case 'auditor':
                return tr('Аудитор', 'Auditor', 'Auditor');
            default:
                return tr('Пользователь', 'User', 'Foydalanuvchi');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">{t('users')}</h1>
                    {user?.role !== 'superadmin' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-cyan-300 border border-blue-200 dark:border-blue-800">
                            <Building2 className="h-3.5 w-3.5 text-cyan-500" />
                            {user?.company_name || (user?.company_id === 'b968f7d7ffe04630a90aadde4d0d8e95' ? 'FinServe Holdings' : 'TechCorp Ltd')}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    {user?.role === 'superadmin' && (
                        <select
                            className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2 text-sm"
                            value={selectedCompanyId}
                            onChange={(e) => setSelectedCompanyId(e.target.value)}
                        >
                            <option value="">{t('all_companies')}</option>
                            {companies.map((company) => (
                                <option key={company.id} value={company.id}>{company.name}</option>
                            ))}
                        </select>
                    )}
                    <Button onClick={() => setIsInviteOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-medium">{t('invite_user')}</Button>
                </div>
            </div>

            {user?.role !== 'superadmin' && (
                <div className="flex items-center gap-2.5 p-3 rounded-lg bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-200">
                    <UsersIcon className="h-4 w-4 text-cyan-500 shrink-0" />
                    <span>
                        {tr('Реестр сотрудников: отображаются только пользователи компании', 'Employee registry: showing only users of company', 'Xodimlar reyestri: faqat ushbu kompaniya foydalanuvchilari ko\'rsatilmoqda')}{' '}
                        <strong className="font-semibold">{user?.company_name || (user?.company_id === 'b968f7d7ffe04630a90aadde4d0d8e95' ? 'FinServe Holdings' : 'TechCorp Ltd')}</strong>.{' '}
                        {tr('Новые сотрудники автоматически закрепляются за данной организацией.', 'New employees are automatically assigned to this organization.', 'Yangi xodimlar avtomatik ravishda ushbu tashkilotga biriktiriladi.')}
                    </span>
                </div>
            )}

            {/* Edit Modal */}
            {isEditOpen && editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
                    <div className="w-full max-w-md rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl text-slate-900 dark:text-slate-100">
                        <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">{tr('Редактировать пользователя', 'Edit User', 'Foydalanuvchini tahrirlash')}</h2>
                        <div className="space-y-4">
                            {user?.role === 'superadmin' && (
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{t('email')}</label>
                                    <input
                                        type="email"
                                        className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2 text-sm"
                                        value={editData.email}
                                        onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                                        placeholder={editingUser.email}
                                    />
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{tr('Оставьте пустым, чтобы сохранить текущий email', 'Leave blank to keep current email', 'Joriy emailni saqlash uchun bo\'sh qoldiring')}</p>
                                </div>
                            )}
                            {user?.role !== 'superadmin' && (
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{t('email')}</label>
                                    <input
                                        type="email"
                                        className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 p-2 text-sm cursor-not-allowed"
                                        value={editingUser.email}
                                        disabled
                                    />
                                </div>
                            )}
                            {user?.role === 'superadmin' && (
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{tr('Новый пароль', 'New Password', 'Yangi parol')}</label>
                                    <input
                                        type="password"
                                        className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2 text-sm"
                                        value={editData.password}
                                        onChange={(e) => setEditData({ ...editData, password: e.target.value })}
                                        placeholder={tr('Оставьте пустым, чтобы сохранить текущий пароль', 'Leave blank to keep current password', 'Joriy parolni saqlash uchun bo\'sh qoldiring')}
                                    />
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{tr('Заполните только для сброса пароля', 'Only fill if you want to reset password', 'Faqat parolni tiklash kerak bo\'lsa to\'ldiring')}</p>
                                </div>
                            )}
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{t('role')}</label>
                                <select
                                    className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2 text-sm"
                                    value={editData.role}
                                    onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                                >
                                    <option value="user">{t('user')}</option>
                                    <option value="accountant">{tr('Бухгалтер', 'Accountant', 'Buxgalter')}</option>
                                    <option value="auditor">{tr('Аудитор', 'Auditor', 'Auditor')}</option>
                                    {user?.role === 'superadmin' && <option value="admin">{tr('Администратор', 'Admin', 'Administrator')}</option>}
                                    {user?.role === 'superadmin' && <option value="superadmin">{tr('Суперадмин', 'Superadmin', 'Superadmin')}</option>}
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <Button variant="outline" className="border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200" onClick={() => setIsEditOpen(false)}>{t('cancel')}</Button>
                                <Button onClick={handleUpdateUser} className="bg-blue-600 hover:bg-blue-700 text-white font-medium">{t('save')}</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Invite Modal (Mock) */}
            {isInviteOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
                    <div className="w-full max-w-md rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl text-slate-900 dark:text-slate-100">
                        <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">{t('invite_new_user')}</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{t('email_address')}</label>
                                <input
                                    type="email"
                                    className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2 text-sm"
                                    placeholder="colleague@example.com"
                                    value={inviteData.email}
                                    onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{t('full_name')}</label>
                                <input
                                    type="text"
                                    className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2 text-sm"
                                    placeholder="John Doe"
                                    value={inviteData.full_name}
                                    onChange={(e) => setInviteData({ ...inviteData, full_name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{t('password')}</label>
                                <input
                                    type="password"
                                    className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2 text-sm"
                                    placeholder={t('temporary_password')}
                                    value={inviteData.password}
                                    onChange={(e) => setInviteData({ ...inviteData, password: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{t('role')}</label>
                                <select
                                    className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2 text-sm"
                                    value={inviteData.role}
                                    onChange={(e) => setInviteData({ ...inviteData, role: e.target.value })}
                                >
                                    <option value="user">{t('user')}</option>
                                    <option value="accountant">{tr('Бухгалтер', 'Accountant', 'Buxgalter')}</option>
                                    <option value="auditor">{tr('Аудитор', 'Auditor', 'Auditor')}</option>
                                    {user?.role === 'superadmin' && <option value="admin">{tr('Администратор', 'Admin', 'Administrator')}</option>}
                                </select>
                            </div>
                            {user?.role === 'superadmin' && (
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{t('company')}</label>
                                    <select
                                        className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2 text-sm"
                                        value={inviteData.company_id}
                                        onChange={(e) => setInviteData({ ...inviteData, company_id: e.target.value })}
                                    >
                                        <option value="">{t('company')}</option>
                                        {companies.map((company) => (
                                            <option key={company.id} value={company.id}>{company.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div className="flex justify-end gap-2 pt-4">
                                <Button variant="outline" className="border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200" onClick={() => setIsInviteOpen(false)}>{t('cancel')}</Button>
                                <Button onClick={handleInvite} className="bg-blue-600 hover:bg-blue-700 text-white font-medium">{t('submit')}</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden text-slate-900 dark:text-slate-100">
                <table className="w-full text-sm">
                    <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
                        <tr>
                            <th className="p-4 text-left font-medium text-slate-600 dark:text-slate-300">{t('email')}</th>
                            <th className="p-4 text-left font-medium text-slate-600 dark:text-slate-300">{t('role')}</th>
                            {user?.role === 'superadmin' && <th className="p-4 text-left font-medium text-slate-600 dark:text-slate-300">{t('company')}</th>}
                            <th className="p-4 text-left font-medium text-slate-600 dark:text-slate-300">{t('status')}</th>
                            <th className="p-4 text-right font-medium text-slate-600 dark:text-slate-300">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {Array.isArray(users) && users.length > 0 ? (
                            users.map((u) => (
                                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="p-4 font-medium text-slate-900 dark:text-slate-100">{u.email}</td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${u.role === 'admin' ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 ring-purple-700/20' :
                                            u.role === 'auditor' ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 ring-blue-700/20' :
                                                u.role === 'accountant' ? 'bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300 ring-green-700/20' :
                                                    u.role === 'superadmin' ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 ring-indigo-700/20' :
                                                        'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 ring-slate-500/20'
                                            }`}>
                                            {getRoleLabel(u.role)}
                                        </span>
                                    </td>
                                    {user?.role === 'superadmin' && (
                                        <td className="p-4 text-slate-600 dark:text-slate-400">
                                            {Array.isArray(companies) ? companies.find(c => c.id === u.company_id)?.name || '-' : '-'}
                                        </td>
                                    )}
                                    <td className="p-4">
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${u.is_active ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' : 'bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800'}`}>
                                            {u.is_active ? t('active') : t('inactive')}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <Button variant="ghost" size="sm" onClick={() => handleEdit(u)} className="hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200">{t('edit')}</Button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={user?.role === 'superadmin' ? 5 : 4} className="p-8 text-center text-slate-500 dark:text-slate-400">
                                    {t('no_users_found') || 'Пользователи не найдены'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
