import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { Department, DepartmentMember } from '../../types';
import { Card, Button, Spinner } from '../../components/ui';
import { Briefcase, UserCheck, Heart, ArrowRight } from 'lucide-react';

export const PortalDepartments: React.FC = () => {
    const { profile } = useAuth();
    const [departments, setDepartments] = useState<Department[]>([]);
    const [myMemberships, setMyMemberships] = useState<DepartmentMember[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [profile]);

    const fetchData = async () => {
        if (!profile?.branch_id) return;
        try {
            const [deptRes, memberRes] = await Promise.all([
                supabase.from('departments').select('*, leader:leader_id(*)').eq('branch_id', profile.branch_id),
                supabase.from('department_members').select('*').eq('user_id', profile.id)
            ]);

            setDepartments(deptRes.data || []);
            setMyMemberships(memberRes.data || []);
        } catch (err) {
            console.error("Error fetching departments:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Church Departments</h1>
                <p className="text-gray-500">Service is an act of worship. Join a department today.</p>
            </div>

            {loading ? (
                <div className="flex justify-center p-20"><Spinner /></div>
            ) : (
                <div className="grid md:grid-cols-2 gap-6">
                    {departments.map((dept) => {
                        const membership = myMemberships.find(m => m.department_id === dept.id);
                        const isMember = !!membership;

                        return (
                            <Card key={dept.id} className="relative overflow-hidden group">
                                <div className="flex items-start gap-4">
                                    <div className={`p-4 rounded-xl ${isMember ? 'bg-green-100 text-green-600' : 'bg-primary/10 text-primary'}`}>
                                        <Briefcase size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-xl font-bold text-gray-900">{dept.name}</h3>
                                            {isMember && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                                    <UserCheck size={12} /> {membership.role}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-gray-600 mt-2 line-clamp-2">{dept.description || 'Contribute your talents to this department.'}</p>

                                        <div className="mt-4 flex items-center gap-4">
                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                <Heart size={14} className="text-red-400" />
                                                <span>Led by {dept.leader?.full_name || 'Leadership Team'}</span>
                                            </div>
                                        </div>

                                        <div className="mt-6 flex gap-3">
                                            {isMember ? (
                                                <Button variant="ghost" size="sm" className="gap-2 text-primary">
                                                    View Schedule <ArrowRight size={14} />
                                                </Button>
                                            ) : (
                                                <Button size="sm" className="gap-2">
                                                    I'm Interested
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                    {departments.length === 0 && (
                        <div className="col-span-full py-20 text-center text-gray-500">
                            Contact your branch administrator to learn about available departments.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
