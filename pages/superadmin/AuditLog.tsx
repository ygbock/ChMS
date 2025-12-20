import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Card, Spinner, Badge, Input, Button } from '../../components/ui';
import { AuditLog } from '../../types';
import { ShieldAlert, Clock, User, Search, Filter, RotateCcw } from 'lucide-react';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
            *,
            profiles:user_id(full_name, email, primary_role)
        `)
        .order('created_at', { ascending: false })
        .limit(200);

      if (data) setLogs(data as any);
    } catch (err) {
      console.error("Error fetching logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = actionFilter === 'all' || log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  const uniqueActions = Array.from(new Set(logs.map(l => l.action)));

  if (loading) return <div className="flex justify-center p-20"><Spinner /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Audit Logs</h1>
          <p className="text-gray-500">Monitor critical actions globally across all branches.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchLogs} className="gap-2">
          <RotateCcw size={16} /> Refresh
        </Button>
      </div>

      <div className="flex flex-wrap gap-4 items-end bg-white p-4 rounded-xl border">
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Search Logs</label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              className="pl-9"
              placeholder="Search user or action..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="w-48">
          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Filter Action</label>
          <div className="relative">
            <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              className="w-full pl-9 pr-4 py-2 border rounded-md text-sm bg-white"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              <option value="all">All Actions</option>
              {uniqueActions.map(a => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-3">Timestamp</th>
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Action</th>
                <th className="px-6 py-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <ShieldAlert className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                    No audit logs found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-gray-500">
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <Clock size={14} />
                        {new Date(log.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-gray-400" />
                        <div>
                          <p className="truncate max-w-[150px]">{log.profiles?.full_name || 'System'}</p>
                          <p className="text-[10px] text-gray-400 font-normal uppercase">{log.profiles?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="neutral" className="text-[10px] uppercase font-bold tracking-tighter">
                        {((log.profiles as any)?.primary_role as string)?.replace(/_/g, ' ') || 'SYSTEM'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-xs text-primary capitalize">
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" className="text-[10px]" onClick={() => console.log(log.details)}>
                        Details
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};