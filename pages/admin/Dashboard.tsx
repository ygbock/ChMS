import React from 'react';
import { Card, Button, Badge } from '../../components/ui';
import { Users, DollarSign, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const AdminDashboard: React.FC = () => {
  const data = [
    { name: 'Mon', attendance: 40 },
    { name: 'Tue', attendance: 30 },
    { name: 'Wed', attendance: 200 },
    { name: 'Thu', attendance: 27 },
    { name: 'Fri', attendance: 18 },
    { name: 'Sat', attendance: 23 },
    { name: 'Sun', attendance: 340 },
  ];

  const stats = [
    { label: 'Total Members', value: '1,248', change: '+12%', trend: 'up', icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Weekly Giving', value: '$14,200', change: '+5%', trend: 'up', icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Avg Attendance', value: '850', change: '-2%', trend: 'down', icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-100' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Branch Overview</h1>
        <div className="flex gap-2">
            <Button variant="secondary">Export Report</Button>
            <Button>Add Member</Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
                <h3 className="text-3xl font-bold mt-2 text-gray-900">{stat.value}</h3>
              </div>
              <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
                <stat.icon size={24} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm">
                {stat.trend === 'up' ? (
                    <span className="text-green-600 flex items-center font-medium"><ArrowUpRight size={16} /> {stat.change}</span>
                ) : (
                    <span className="text-red-600 flex items-center font-medium"><ArrowDownRight size={16} /> {stat.change}</span>
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
    </div>
  );
};