import React, { useEffect, useState } from 'react';
import { Card, Button, Spinner } from '../../components/ui';
import { supabase } from '../../supabaseClient';
import { Users, Layout, Activity, ShieldAlert, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AuditLog } from '../../types';

export const SuperAdminDashboard: React.FC = () => {
    const [stats, setStats] = useState({
        totalBranches: 0,
        totalMembers: 0,
        totalUsers: 0,
        recentLogs: [] as AuditLog[]
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [branchesRes, membersRes, usersRes, logsRes] = await Promise.all([
                    supabase.from('church_branches').select('id', { count: 'exact', head: true }),
                    supabase.from('members').select('id', { count: 'exact', head: true }),
                    supabase.from('profiles').select('id', { count: 'exact', head: true }),
                    supabase.from('audit_logs').select('*, profiles(full_name)').order('created_at', { ascending: false }).limit(5)
                ]);

                setStats({
                    totalBranches: branchesRes.count || 0,
                    totalMembers: membersRes.count || 0,
                    totalUsers: usersRes.count || 0,
                    recentLogs: (logsRes.data || []) as any
                });
            } catch (err) {
                console.error("Error fetching superadmin stats:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) return <div className="h-full flex items-center justify-center"><Spinner /></div>;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">System Overview</h1>
                <p className="text-gray-500">Global performance and security monitoring.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <Card className="bg-white border-l-4 border-l-purple-600">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                            <Layout size={24} />
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Total Branches</p>
                            <h2 className="text-3xl font-bold text-gray-900">{stats.totalBranches}</h2>
                        </div>
                    </div>
                </Card>

                <Card className="bg-white border-l-4 border-l-blue-600">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Total Global Members</p>
                            <h2 className="text-3xl font-bold text-gray-900">{stats.totalMembers}</h2>
                        </div>
                    </div>
                </Card>

                <Card className="bg-white border-l-4 border-l-green-600">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                            <Activity size={24} />
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">System Users</p>
                            <h2 className="text-3xl font-bold text-gray-900">{stats.totalUsers}</h2>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                <Card title="Quick Actions">
                    <div className="grid grid-cols-2 gap-4 mt-2">
                        <Link to="/superadmin/branches" className="p-4 border rounded-xl hover:bg-slate-50 transition-colors flex flex-col items-center text-center group">
                            <div className="p-3 bg-slate-100 rounded-full mb-3 group-hover:bg-primary/10 group-hover:text-primary">
                                <Layout size={20} />
                            </div>
                            <span className="font-semibold text-sm">Branches</span>
                            <span className="text-xs text-gray-500 mt-1">Manage network</span>
                        </Link>
                        <Link to="/superadmin/users" className="p-4 border rounded-xl hover:bg-slate-50 transition-colors flex flex-col items-center text-center group">
                            <div className="p-3 bg-slate-100 rounded-full mb-3 group-hover:bg-primary/10 group-hover:text-primary">
                                <ShieldAlert size={20} />
                            </div>
                            <span className="font-semibold text-sm">Roles</span>
                            <span className="text-xs text-gray-500 mt-1">Access control</span>
                        </Link>
                    </div>
                </Card>

                <Card title="Recent System Activity">
                    <div className="space-y-4 mt-2">
                        {stats.recentLogs.map((log) => (
                            <div key={log.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <div className="mt-1">
                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {(log as any).profiles?.full_name || 'System'} {log.action}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {new Date(log.created_at).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {stats.recentLogs.length === 0 && (
                            <p className="text-center text-gray-400 text-sm py-10">No recent activity found.</p>
                        )}
                        <Link to="/superadmin/audit-logs">
                            <Button variant="ghost" className="w-full gap-2 text-xs">
                                View Full Audit Trail <ArrowRight size={14} />
                            </Button>
                        </Link>
                    </div>
                </Card>
            </div>
        </div>
    );
};
