import React, { useEffect, useState } from 'react';
import { Card, Button, Input, Spinner, Badge } from '../../components/ui';
import { supabase } from '../../supabaseClient';
import { Profile, Branch, AppRole } from '../../types';
import { Search, Shield, MapPin, Save, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const SuperAdminUsers: React.FC = () => {
    const { profile: currentAdmin } = useAuth();
    const [users, setUsers] = useState<Profile[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingUser, setEditingUser] = useState<Profile | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [profilesRes, branchesRes] = await Promise.all([
                supabase.from('profiles').select('*').order('full_name'),
                supabase.from('church_branches').select('*').order('name')
            ]);

            if (profilesRes.error) throw profilesRes.error;
            if (branchesRes.error) throw branchesRes.error;

            setUsers(profilesRes.data || []);
            setBranches(branchesRes.data || []);
        } catch (err) {
            console.error("Error fetching admin data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateUser = async () => {
        if (!editingUser) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    primary_role: editingUser.primary_role,
                    branch_id: editingUser.branch_id
                })
                .eq('id', editingUser.id);

            if (error) throw error;

            // Log the change
            await supabase.from('audit_logs').insert({
                user_id: currentAdmin?.id,
                action: 'updated_user_role',
                details: {
                    target_user: editingUser.email,
                    new_role: editingUser.primary_role,
                    new_branch: editingUser.branch_id
                }
            });

            setEditingUser(null);
            fetchData();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };

    const filteredUsers = users.filter(u =>
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const roles = Object.values(AppRole);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                    <p className="text-gray-500">Manage access levels and branch assignments across the system.</p>
                </div>
                <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input
                        className="pl-10 w-full md:w-80"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-20"><Spinner /></div>
            ) : (
                <Card className="p-0 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">User</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Branch</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredUsers.map((user) => {
                                    const isEditing = editingUser?.id === user.id;
                                    const branch = branches.find(b => b.id === user.branch_id);

                                    return (
                                        <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                                                        {user.full_name?.[0] || 'U'}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{user.full_name || 'Anonymous'}</p>
                                                        <p className="text-xs text-gray-500 uppercase">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {isEditing ? (
                                                    <select
                                                        className="text-sm border rounded p-1"
                                                        value={editingUser.primary_role}
                                                        onChange={(e) => setEditingUser({ ...editingUser, primary_role: e.target.value as AppRole })}
                                                    >
                                                        {roles.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                                                    </select>
                                                ) : (
                                                    <Badge variant={user.primary_role.includes('admin') ? 'primary' : 'secondary'} className="capitalize">
                                                        {user.primary_role.replace('_', ' ')}
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {isEditing ? (
                                                    <select
                                                        className="text-sm border rounded p-1 w-full max-w-[150px]"
                                                        value={editingUser.branch_id || ''}
                                                        onChange={(e) => setEditingUser({ ...editingUser, branch_id: e.target.value })}
                                                    >
                                                        <option value="">No Branch</option>
                                                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                                    </select>
                                                ) : (
                                                    <div className="flex items-center gap-1 text-sm text-gray-600">
                                                        <MapPin size={14} className="text-gray-400" />
                                                        {branch?.name || 'Unassigned'}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {isEditing ? (
                                                    <div className="flex justify-end gap-2">
                                                        <Button size="sm" variant="ghost" className="p-1 text-red-500" onClick={() => setEditingUser(null)}>
                                                            <X size={18} />
                                                        </Button>
                                                        <Button size="sm" className="p-1" onClick={handleUpdateUser} disabled={saving}>
                                                            <Save size={18} />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <Button size="sm" variant="ghost" onClick={() => setEditingUser(user)}>
                                                        Manage
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
};
