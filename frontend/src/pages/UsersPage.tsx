import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Button } from '@/components/ui/button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';

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
        api.get('/companies/').then(res => setCompanies(res.data));
    }, [selectedCompanyId]);

    const fetchUsers = async () => {
        const params: any = {};
        if (selectedCompanyId) {
            params.company_id = selectedCompanyId;
        }
        const res = await api.get('/users/', { params });
        setUsers(res.data);
    };

    const handleInvite = async () => {
        try {
            await api.post('/users/invite', inviteData);
            toast({
                title: t('success'),
                description: t('user_invited_successfully'),
            });
            setIsInviteOpen(false);
            // Refresh users list
            const res = await api.get('/users/');
            setUsers(res.data);
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
                description: 'User updated successfully',
            });
            setIsEditOpen(false);
            fetchUsers();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: t('error'),
                description: error.response?.data?.detail || 'Failed to update user',
            });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">{t('users')}</h1>
                <div className="flex gap-4">
                    {user?.role === 'superadmin' && (
                        <select
                            className="rounded-md border p-2"
                            value={selectedCompanyId}
                            onChange={(e) => setSelectedCompanyId(e.target.value)}
                        >
                            <option value="">{t('all_companies')}</option>
                            {companies.map((company) => (
                                <option key={company.id} value={company.id}>{company.name}</option>
                            ))}
                        </select>
                    )}
                    <Button onClick={() => setIsInviteOpen(true)}>{t('invite_user')}</Button>
                </div>
            </div>

            {/* Edit Modal */}
            {isEditOpen && editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
                        <h2 className="mb-4 text-xl font-bold">Edit User</h2>
                        <div className="space-y-4">
                            {user?.role === 'superadmin' && (
                                <div>
                                    <label className="mb-1 block text-sm font-medium">Email</label>
                                    <input
                                        type="email"
                                        className="w-full rounded-md border p-2"
                                        value={editData.email}
                                        onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                                        placeholder={editingUser.email}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Leave blank to keep current email</p>
                                </div>
                            )}
                            {user?.role !== 'superadmin' && (
                                <div>
                                    <label className="mb-1 block text-sm font-medium">Email</label>
                                    <input
                                        type="email"
                                        className="w-full rounded-md border p-2 bg-gray-50"
                                        value={editingUser.email}
                                        disabled
                                    />
                                </div>
                            )}
                            {user?.role === 'superadmin' && (
                                <div>
                                    <label className="mb-1 block text-sm font-medium">New Password</label>
                                    <input
                                        type="password"
                                        className="w-full rounded-md border p-2"
                                        value={editData.password}
                                        onChange={(e) => setEditData({ ...editData, password: e.target.value })}
                                        placeholder="Leave blank to keep current password"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Only fill if you want to reset password</p>
                                </div>
                            )}
                            <div>
                                <label className="mb-1 block text-sm font-medium">{t('role')}</label>
                                <select
                                    className="w-full rounded-md border p-2"
                                    value={editData.role}
                                    onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                                >
                                    <option value="user">{t('user')}</option>
                                    <option value="accountant">Accountant</option>
                                    <option value="auditor">Auditor</option>
                                    {user?.role === 'superadmin' && <option value="admin">Admin</option>}
                                    {user?.role === 'superadmin' && <option value="superadmin">Superadmin</option>}
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <Button variant="outline" onClick={() => setIsEditOpen(false)}>{t('cancel')}</Button>
                                <Button onClick={handleUpdateUser}>{t('save')}</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Invite Modal (Mock) */}
            {isInviteOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
                        <h2 className="mb-4 text-xl font-bold">{t('invite_new_user')}</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium">{t('email_address')}</label>
                                <input
                                    type="email"
                                    className="w-full rounded-md border p-2"
                                    placeholder="colleague@example.com"
                                    value={inviteData.email}
                                    onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">{t('full_name')}</label>
                                <input
                                    type="text"
                                    className="w-full rounded-md border p-2"
                                    placeholder="John Doe"
                                    value={inviteData.full_name}
                                    onChange={(e) => setInviteData({ ...inviteData, full_name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">{t('password')}</label>
                                <input
                                    type="password"
                                    className="w-full rounded-md border p-2"
                                    placeholder={t('temporary_password')}
                                    value={inviteData.password}
                                    onChange={(e) => setInviteData({ ...inviteData, password: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">{t('role')}</label>
                                <select
                                    className="w-full rounded-md border p-2"
                                    value={inviteData.role}
                                    onChange={(e) => setInviteData({ ...inviteData, role: e.target.value })}
                                >
                                    <option value="user">{t('user')}</option>
                                    <option value="accountant">Accountant</option>
                                    <option value="auditor">Auditor</option>
                                    {user?.role === 'superadmin' && <option value="admin">Admin</option>}
                                </select>
                            </div>
                            {user?.role === 'superadmin' && (
                                <div>
                                    <label className="mb-1 block text-sm font-medium">{t('company')}</label>
                                    <select
                                        className="w-full rounded-md border p-2"
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
                                <Button variant="outline" onClick={() => setIsInviteOpen(false)}>{t('cancel')}</Button>
                                <Button onClick={handleInvite}>{t('submit')}</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="rounded-md border bg-white shadow-sm">
                <table className="w-full text-sm">
                    <thead className="border-b bg-gray-50">
                        <tr>
                            <th className="p-4 text-left font-medium">{t('email')}</th>
                            <th className="p-4 text-left font-medium">{t('role')}</th>
                            {user?.role === 'superadmin' && <th className="p-4 text-left font-medium">{t('company')}</th>}
                            <th className="p-4 text-left font-medium">{t('status')}</th>
                            <th className="p-4 text-right font-medium">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u) => (
                            <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50">
                                <td className="p-4">{u.email}</td>
                                <td className="p-4">
                                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${u.role === 'admin' ? 'bg-purple-50 text-purple-700 ring-purple-700/10' :
                                        u.role === 'auditor' ? 'bg-blue-50 text-blue-700 ring-blue-700/10' :
                                            u.role === 'accountant' ? 'bg-green-50 text-green-700 ring-green-700/10' :
                                                'bg-gray-50 text-gray-600 ring-gray-500/10'
                                        }`}>
                                        {u.role}
                                    </span>
                                </td>
                                {user?.role === 'superadmin' && (
                                    <td className="p-4">
                                        {companies.find(c => c.id === u.company_id)?.name || '-'}
                                    </td>
                                )}
                                <td className="p-4">
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {u.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    <Button variant="ghost" size="sm" onClick={() => handleEdit(u)}>Edit</Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
