import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Spinner } from '../../components/ui';
import { Users, DollarSign, Calendar, ArrowUpRight, ArrowDownRight, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../../supabaseClient';
import { Branch } from '../../types';

export const AdminDashboard: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  // Mock data - in a real app, this would be fetched based on selectedBranchId
  const initialStats = [
    { label: 'Total Members', value: 1248, change: 12, trend: 'up', icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Weekly Giving', value: 14200, change: 5, trend: 'up', icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Avg Attendance', value: 850, change: -2, trend: 'down', icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-100' },
  ];

  const [stats, setStats] = useState(initialStats);

  // Fetch available branches
  useEffect(() => {
    const fetchBranches = async () => {
      const { data } = await supabase.from('church_branches').select('*');
      if (data) setBranches(data);
    };
    fetchBranches();
  }, []);

  // Filter logic
  useEffect(() => {
    setLoading(true);
    // Simulate API fetch delay
    setTimeout(() => {
      if (selectedBranchId === 'all') {
        setStats(initialStats);
      } else {
        // Randomize stats to simulate different branch data
        const multiplier = 0.6; 
        setStats(initialStats.map(s => ({
          ...s,
          value: Math.floor(s.value * multiplier),
          change: Math.floor(Math.random() * 20) - 10
        })));
      }
      setLoading(false);
    }, 500);
  }, [selectedBranchId]);

  const data = [
    { name: 'Mon', attendance: Math.floor(40 * (selectedBranchId === 'all' ? 1 : 0.6)) },
    { name: 'Tue', attendance: Math.floor(30 * (selectedBranchId === 'all' ? 1 : 0.6)) },
    { name: 'Wed', attendance: Math.floor(200 * (selectedBranchId === 'all' ? 1 : 0.6)) },
    { name: 'Thu', attendance: Math.floor(27 * (selectedBranchId === 'all' ? 1 : 0.6)) },
    { name: 'Fri', attendance: Math.floor(18 * (selectedBranchId === 'all' ? 1 : 0.6)) },
    { name: 'Sat', attendance: Math.floor(23 * (selectedBranchId === 'all' ? 1 : 0.6)) },
    { name: 'Sun', attendance: Math.floor(340 * (selectedBranchId === 'all' ? 1 : 0.6)) },
  ];

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
            <Button>Add Member</Button>
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
                    {stat.change > 0 ? (
                        <span className="text-green-600 flex items-center font-medium"><ArrowUpRight size={16} /> +{stat.change}%</span>
                    ) : (
                        <span className="text-red-600 flex items-center font-medium"><ArrowDownRight size={16} /> {stat.change}%</span>
                    )}
                    <span className="text-gray-500">vs last month</span>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <Card title="Attendance Trends" className="lg:col-span-2">
                <div className="h-[300px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                            <Tooltip 
                                cursor={{fill: '#f1f5f9'}}
                                contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                            />
                            <Bar dataKey="attendance" fill="#2563eb" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            <Card title="Pending Approvals">
                <div className="space-y-4 mt-2">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                            <div>
                                <p className="font-semibold text-sm">Member Transfer</p>
                                <p className="text-xs text-gray-500">John Smith to North District</p>
                            </div>
                            <Badge variant="warning">Pending</Badge>
                        </div>
                    ))}
                    <Button variant="ghost" className="w-full text-sm text-gray-500">View All</Button>
                </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};