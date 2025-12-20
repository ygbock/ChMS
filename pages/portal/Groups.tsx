import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { SmallGroup, GroupMember } from '../../types';
import { Card, Button, Spinner } from '../../components/ui';
import { Users, MapPin, Clock, ArrowRight, Check } from 'lucide-react';

export const PortalGroups: React.FC = () => {
    const { profile } = useAuth();
    const [groups, setGroups] = useState<SmallGroup[]>([]);
    const [myGroups, setMyGroups] = useState<GroupMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, [profile]);

    const fetchData = async () => {
        if (!profile?.branch_id) return;
        try {
            const [groupsRes, memberRes] = await Promise.all([
                supabase.from('groups').select('*, leader:leader_id(*)').eq('branch_id', profile.branch_id),
                supabase.from('group_members').select('*').eq('user_id', profile.id)
            ]);

            setGroups(groupsRes.data || []);
            setMyGroups(memberRes.data || []);
        } catch (err) {
            console.error("Error fetching groups:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async (groupId: string) => {
        setProcessingId(groupId);
        try {
            const { error } = await supabase
                .from('group_members')
                .insert({ group_id: groupId, user_id: profile?.id });

            if (error) throw error;
            await fetchData();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setProcessingId(null);
        }
    };

    const handleLeave = async (membershipId: string, groupId: string) => {
        setProcessingId(groupId);
        try {
            const { error } = await supabase
                .from('group_members')
                .delete()
                .eq('id', membershipId);

            if (error) throw error;
            await fetchData();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Small Groups</h1>
                <p className="text-gray-500">Find your community and grow together in faith.</p>
            </div>

            {loading ? (
                <div className="flex justify-center p-20"><Spinner /></div>
            ) : (
                <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-6">
                    {groups.map((group) => {
                        const membership = myGroups.find(m => m.group_id === group.id);
                        const isMember = !!membership;

                        return (
                            <Card key={group.id} className="flex flex-col h-full group hover:shadow-md transition-all">
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-lg font-bold text-gray-900">{group.name}</h3>
                                        {isMember && <Check className="text-green-500" size={20} />}
                                    </div>
                                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{group.description}</p>

                                    <div className="space-y-2 mt-auto">
                                        <div className="flex items-center gap-2 text-xs text-gray-600">
                                            <Users size={14} className="text-primary" />
                                            <span>Leader: {group.leader?.full_name || 'TBD'}</span>
                                        </div>
                                        {group.meeting_time && (
                                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                                <Clock size={14} className="text-primary" />
                                                <span>{group.meeting_time}</span>
                                            </div>
                                        )}
                                        {group.meeting_location && (
                                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                                <MapPin size={14} className="text-primary" />
                                                <span className="truncate">{group.meeting_location}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t">
                                    {isMember ? (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="w-full text-red-600"
                                            onClick={() => handleLeave(membership.id, group.id)}
                                            disabled={processingId === group.id}
                                        >
                                            {processingId === group.id ? 'Processing...' : 'Leave Group'}
                                        </Button>
                                    ) : (
                                        <Button
                                            size="sm"
                                            className="w-full gap-2"
                                            onClick={() => handleJoin(group.id)}
                                            disabled={processingId === group.id}
                                        >
                                            {processingId === group.id ? 'Joining...' : 'Join Group'}
                                            <ArrowRight size={14} />
                                        </Button>
                                    )}
                                </div>
                            </Card>
                        );
                    })}
                    {groups.length === 0 && (
                        <div className="col-span-full py-20 text-center text-gray-500">
                            No groups found in your branch yet.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
