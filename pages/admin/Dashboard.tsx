import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Spinner } from '../../components/ui';
import { Users, DollarSign, Calendar, ArrowUpRight, ArrowDownRight, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../../supabaseClient';
import { Branch, MemberTransfer } from '../../types';
import { Link } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [recentTransfers, setRecentTransfers] = useState<MemberTransfer[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);

  const initialStats = [
    { label: 'Total Members', value: 0, change: 0, trend: 'up', icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Pending Approvals', value: 0, change: 0, trend: 'up', icon: Filter, color: 'text-orange-600', bg: 'bg-orange-100' },
    { label: 'Avg Attendance', value: 0, change: 0, trend: 'neutral', icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-100' },
  ];

  const [stats, setStats] = useState(initialStats);

  useEffect(() => {
    const fetchBranches = async () => {
      const { data } = await supabase.from('church_branches').select('*');
      if (data) setBranches(data);
    };
    fetchBranches();
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // 1. Stats Queries
        let memberQuery = supabase.from('members').select('*', { count: 'exact', head: true });
        let transferQuery = supabase.from('member_transfers').select('*', { count: 'exact', head: true }).eq('status', 'pending');
        let attendanceQuery = supabase.from('attendance').select('id', { count: 'exact', head: true });

        if (selectedBranchId !== 'all') {
          memberQuery = memberQuery.eq('branch_id', selectedBranchId);
          transferQuery = transferQuery.eq('to_branch_id', selectedBranchId);
          attendanceQuery = attendanceQuery.eq('branch_id', selectedBranchId);
        }

        const [memberRes, transferRes, attendanceRes] = await Promise.all([
          memberQuery,
          transferQuery,
          attendanceQuery
        ]);

        setStats(prev => prev.map(s => {
          if (s.label === 'Total Members') return { ...s, value: memberRes.count || 0 };
          if (s.label === 'Pending Approvals') return { ...s, value: transferRes.count || 0 };
          if (s.label === 'Avg Attendance') return { ...s, value: attendanceRes.count || 0 };
          return s;
        }));

        // 2. Recent Transfers
        let rtQuery = supabase
          .from('member_transfers')
          .select('*, church_branches_from:from_branch_id(name)')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(5);

        if (selectedBranchId !== 'all') {
          rtQuery = rtQuery.eq('to_branch_id', selectedBranchId);
        }
        const { data: rtData } = await rtQuery;
        setRecentTransfers(rtData || []);

        // 3. Attendance Trends (Simulated aggregation based on real check-ins)
        // In a real high-scale app, you'd use a view or a metric table.
        // For now, we'll fetch last 7 days check-ins and group them.
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        let atTrendQuery = supabase
          .from('attendance')
          .select('check_in_time')
          .gte('check_in_time', sevenDaysAgo.toISOString());

        if (selectedBranchId !== 'all') {
          atTrendQuery = atTrendQuery.eq('branch_id', selectedBranchId);
        }
        const { data: atData } = await atTrendQuery;

        // Group by day
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const grouped = days.map(d => ({ name: d, attendance: 0 }));
        atData?.forEach(row => {
          const dayName = new Date(row.check_in_time).toLocaleDateString(undefined, { weekday: 'short' });
          const dayObj = grouped.find(g => g.name === dayName);
          if (dayObj) dayObj.attendance++;
        });
        setAttendanceData(grouped);

      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [selectedBranchId]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Branch Overview</h1>
          <p className="text-gray-500">
            {selectedBranchId === 'all' ? 'Viewing data for all branches' : `Viewing data for ${branches.find(b => b.id === selectedBranchId)?.name}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative">
            <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <select
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary bg-white min-w-[200px]"
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
            >
              <option value="all">All Branches</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <Button variant="secondary">Export Report</Button>
          <Link to="/admin/members">
            <Button>Manage Members</Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-3 gap-6">
            {stats.map((stat) => (
              <Card key={stat.label}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
                    <h3 className="text-3xl font-bold mt-2 text-gray-900">
                      {stat.icon === DollarSign ? '$' : ''}{stat.value.toLocaleString()}
                    </h3>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
                    <stat.icon size={24} />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm">
                  <span className="text-blue-600 font-medium font-mono text-xs">Live Statistics</span>
                  <span className="text-gray-400">• Just updated</span>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <Card title="Attendance Trends (Last 7 Days)" className="lg:col-span-2">
              <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attendanceData}>
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                    <Tooltip
                      cursor={{ fill: '#f1f5f9' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="attendance" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card title="Approval Requests">
              <div className="space-y-4 mt-2">
                {recentTransfers.map((req) => (
                  <div key={req.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">Transfer Request</p>
                      <p className="text-xs text-gray-500 truncate">From: {(req as any).church_branches_from?.name || 'Unknown'}</p>
                    </div>
                    <Badge variant="warning">Pending</Badge>
                  </div>
                ))}
                {recentTransfers.length === 0 && (
                  <p className="text-center text-gray-400 text-sm py-10">No pending requests.</p>
                )}
                <Link to="/admin/transfers">
                  <Button variant="ghost" size="sm" className="w-full text-blue-600">Go to Queue</Button>
                </Link>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};