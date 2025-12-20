import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Card, Spinner, Badge } from '../../components/ui';
import { AuditLog } from '../../types';
import { ShieldAlert, Clock, User } from 'lucide-react';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      // In a real app, you would have pagination here
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
            *,
            profiles:user_id(full_name, email, primary_role)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (data) setLogs(data as any);
      setLoading(false);
    };

    fetchLogs();
  }, []);

  if (loading) return <div className="flex justify-center p-8"><Spinner /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Audit Logs</h1>
        <p className="text-gray-500">Track critical actions performed by administrators across the platform.</p>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-3">Timestamp</th>
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Action</th>
                <th className="px-6 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <ShieldAlert className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                    No audit logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 flex items-center gap-2 text-gray-500">
                      <Clock size={14} />
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-gray-400" />
                        {log.profiles?.full_name || log.profiles?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="neutral">{log.profiles?.primary_role}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <pre className="text-xs text-gray-500 overflow-x-auto max-w-xs">
                        {JSON.stringify(log.details, null, 1)}
                      </pre>
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