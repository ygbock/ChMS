import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { MemberTransfer } from '../../types';
import { Card, Badge, Spinner, Button } from '../../components/ui';
import { Check, X, Search, RefreshCw } from 'lucide-react';

export const AdminTransferQueue: React.FC = () => {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<MemberTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    if (!profile?.branch_id) return;
    setLoading(true);
    try {
      // Fetch requests where the target is the current admin's branch
      const { data, error } = await supabase
        .from('member_transfers')
        .select(`
          *,
          profiles:member_id(full_name, email, avatar_url),
          church_branches_from:from_branch_id(name)
        `)
        .eq('to_branch_id', profile.branch_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data as any || []);
    } catch (err) {
      console.error("Error fetching transfer requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [profile]);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    if (!confirm(`Are you sure you want to ${action} this request?`)) return;
    
    setProcessingId(id);
    try {
      if (action === 'approve') {
        const { error } = await supabase.rpc('approve_member_transfer', { transfer_id: id });
        if (error) throw error;
      } else {
        const notes = prompt("Enter rejection reason (optional):") || "No reason provided";
        const { error } = await supabase.rpc('reject_member_transfer', { 
            transfer_id: id, 
            rejection_notes: notes 
        });
        if (error) throw error;
      }
      // Refresh list
      await fetchRequests();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const historyRequests = requests.filter(r => r.status !== 'pending');

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-gray-900">Transfer Requests</h1>
           <p className="text-gray-500">Manage incoming member transfers to your branch.</p>
        </div>
        <Button variant="secondary" onClick={fetchRequests} className="gap-2">
            <RefreshCw size={16} /> Refresh
        </Button>
      </div>

      <Card title={`Pending Requests (${pendingRequests.length})`}>
        {pendingRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No pending requests.</div>
        ) : (
            <div className="space-y-4">
                {pendingRequests.map(req => (
                    <div key={req.id} className="border rounded-lg p-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-yellow-50/50 border-yellow-100">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
                                {req.profiles?.full_name?.[0] || req.profiles?.email[0]}
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900">{req.profiles?.full_name || req.profiles?.email}</h4>
                                <p className="text-sm text-gray-500">
                                    From: <span className="font-medium">{(req.church_branches_from as any)?.name}</span>
                                </p>
                                {req.notes && <p className="text-sm text-gray-600 mt-1 italic">"{req.notes}"</p>}
                            </div>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <Button 
                                className="flex-1 md:flex-none gap-2" 
                                size="sm" 
                                onClick={() => handleAction(req.id, 'approve')}
                                disabled={!!processingId}
                            >
                                <Check size={16} /> Approve
                            </Button>
                            <Button 
                                variant="danger" 
                                className="flex-1 md:flex-none gap-2" 
                                size="sm" 
                                onClick={() => handleAction(req.id, 'reject')}
                                disabled={!!processingId}
                            >
                                <X size={16} /> Reject
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </Card>

      <Card title="History">
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="text-gray-500 border-b">
                    <tr>
                        <th className="px-4 py-2">Date</th>
                        <th className="px-4 py-2">Member</th>
                        <th className="px-4 py-2">From</th>
                        <th className="px-4 py-2">Status</th>
                        <th className="px-4 py-2">Processed By</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {historyRequests.map(req => (
                        <tr key={req.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">{new Date(req.created_at).toLocaleDateString()}</td>
                            <td className="px-4 py-3 font-medium">{req.profiles?.full_name || req.profiles?.email}</td>
                            <td className="px-4 py-3 text-gray-500">{(req.church_branches_from as any)?.name}</td>
                            <td className="px-4 py-3">
                                {req.status === 'approved' && <Badge variant="success">Approved</Badge>}
                                {req.status === 'rejected' && <Badge variant="error">Rejected</Badge>}
                            </td>
                            <td className="px-4 py-3 text-gray-400 text-xs truncate max-w-[150px]">{req.processed_by || '-'}</td>
                        </tr>
                    ))}
                    {historyRequests.length === 0 && (
                        <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No history available</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </Card>
    </div>
  );
};