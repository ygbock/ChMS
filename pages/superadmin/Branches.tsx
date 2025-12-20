import React, { useEffect, useState } from 'react';
import { Card, Button, Input, Spinner } from '../../components/ui';
import { supabase } from '../../supabaseClient';
import { Branch } from '../../types';
import { Plus, Edit2, MapPin, Search, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const SuperAdminBranches: React.FC = () => {
    const { profile } = useAuth();
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingBranch, setEditingBranch] = useState<Partial<Branch> | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchBranches();
    }, []);

    const fetchBranches = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('church_branches').select('*').order('name');
            if (error) throw error;
            setBranches(data || []);
        } catch (err) {
            console.error("Error fetching branches:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingBranch?.name) return;
        setSaving(true);

        try {
            if (editingBranch.id) {
                // Update
                const { error } = await supabase
                    .from('church_branches')
                    .update({
                        name: editingBranch.name,
                        address: editingBranch.address,
                        district_id: 'default' // Mocking district for now or use real one
                    })
                    .eq('id', editingBranch.id);
                if (error) throw error;
            } else {
                // Insert
                const { error } = await supabase
                    .from('church_branches')
                    .insert({
                        name: editingBranch.name,
                        address: editingBranch.address,
                        district_id: 'default'
                    });
                if (error) throw error;
            }

            // Log action
            await supabase.from('audit_logs').insert({
                user_id: profile?.id,
                action: editingBranch.id ? 'updated_branch' : 'created_branch',
                details: { branch_name: editingBranch.name }
            });

            setShowModal(false);
            setEditingBranch(null);
            fetchBranches();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };

    const filteredBranches = branches.filter(b =>
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.address?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Branch Management</h1>
                    <p className="text-gray-500">Configure and monitor all church locations.</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <Input
                            className="pl-10 w-64"
                            placeholder="Search branches..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button className="gap-2" onClick={() => { setEditingBranch({}); setShowModal(true); }}>
                        <Plus size={18} /> Add Branch
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-20"><Spinner /></div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBranches.map((branch) => (
                        <Card key={branch.id} className="group border-t-4 border-t-primary">
                            <div className="flex justify-between items-start">
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-lg text-gray-900 truncate">{branch.name}</h3>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                        <MapPin size={14} className="shrink-0" />
                                        <span className="truncate">{branch.address || 'No address set'}</span>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => { setEditingBranch(branch); setShowModal(true); }}
                                >
                                    <Edit2 size={16} />
                                </Button>
                            </div>

                            <div className="mt-6 pt-4 border-t flex justify-between items-center text-xs text-gray-400">
                                <span>District: {branch.district_id}</span>
                                <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-mono italic">#{branch.id.slice(0, 8)}</span>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-bold mb-6">{editingBranch?.id ? 'Edit Branch' : 'New Branch'}</h2>
                        <form onSubmit={handleSave} className="space-y-4">
                            <Input
                                label="Branch Name"
                                placeholder="FaithConnect Downtown"
                                value={editingBranch?.name || ''}
                                onChange={(e) => setEditingBranch({ ...editingBranch, name: e.target.value })}
                                required
                            />
                            <Input
                                label="Address"
                                placeholder="123 Faith Lane"
                                value={editingBranch?.address || ''}
                                onChange={(e) => setEditingBranch({ ...editingBranch, address: e.target.value })}
                            />

                            <div className="flex justify-end gap-3 pt-6">
                                <Button variant="ghost" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
                                <Button type="submit" disabled={saving}>
                                    {saving ? 'Saving...' : 'Save Branch'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};
