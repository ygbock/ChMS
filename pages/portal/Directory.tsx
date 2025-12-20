import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { Profile } from '../../types';
import { Card, Input, Spinner } from '../../components/ui';
import { Search, Mail, Phone, MapPin } from 'lucide-react';

export const PortalDirectory: React.FC = () => {
    const { profile } = useAuth();
    const [members, setMembers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchDirectory = async () => {
            if (!profile?.branch_id) return;

            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('branch_id', profile.branch_id)
                    .order('full_name');

                if (error) throw error;
                setMembers(data || []);
            } catch (err) {
                console.error("Error fetching directory:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDirectory();
    }, [profile]);

    const filteredMembers = members.filter(m =>
        m.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Member Directory</h1>
                    <p className="text-gray-500">Connect with others in the FaithConnect community.</p>
                </div>
                <div className="relative w-full md:w-64">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input
                        className="pl-10"
                        placeholder="Search directory..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-20"><Spinner /></div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMembers.map((member) => (
                        <Card key={member.id} className="group hover:border-primary/30 transition-colors">
                            <div className="flex items-start gap-4">
                                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-400 shrink-0 overflow-hidden">
                                    {member.avatar_url ? (
                                        <img src={member.avatar_url} alt={member.full_name} className="w-full h-full object-cover" />
                                    ) : (member.full_name?.[0]?.toUpperCase() || <MapPin size={24} />)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-gray-900 truncate">{member.full_name || 'Anonymous Member'}</h3>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
                                        {member.primary_role.replace('_', ' ')}
                                    </p>

                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Mail size={14} className="text-gray-400" />
                                            <span className="truncate">{member.email}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                    {filteredMembers.length === 0 && (
                        <div className="col-span-full py-20 text-center text-gray-500">
                            No members found matching your search.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
