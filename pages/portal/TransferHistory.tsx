import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { MemberTransfer } from '../../types';
import { Card, Badge, Spinner, Button } from '../../components/ui';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TransferHistory: React.FC = () => {
  const { profile } = useAuth();
  const [transfers, setTransfers] = useState<MemberTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const fetchTransfers = async () => {
      if (!profile) return;
      try {
        const { data, error } = await supabase
          .from('member_transfers')
          .select(`
            *,
            church_branches_to:to_branch_id(name),
            church_branches_from:from_branch_id(name)
          `)
          .eq('member_id', profile.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setTransfers(data as any || []);
      } catch (err) {
        console.error("Error fetching transfers:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransfers();
  }, [profile]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge variant="success">Approved</Badge>;
      case 'rejected': return <Badge variant="error">Rejected</Badge>;
      default: return <Badge variant="warning">Pending</Badge>;
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Spinner /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/portal/transfer-request">
            <Button variant="secondary" size="sm" className="gap-1">
              <ArrowLeft size={16} /> Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">My Transfer History</h1>
        </div>

        <div className="flex items-center gap-2">
          <select
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm bg-white"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm bg-white"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
      </div>

      <Card className="overflow-hidden">
        {transfers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>You haven't submitted any transfer requests yet.</p>
            <Link to="/portal/transfer-request" className="text-primary hover:underline mt-2 inline-block">
              Submit your first request
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 font-medium">
                <tr>
                  <th className="px-6 py-3">Requested Date</th>
                  <th className="px-6 py-3">From Branch</th>
                  <th className="px-6 py-3 flex items-center gap-2">Target Branch <ArrowRight size={14} className="text-gray-300" /></th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transfers
                  .filter(t => filterStatus === 'all' || t.status === filterStatus)
                  .sort((a, b) => {
                    const dateA = new Date(a.created_at).getTime();
                    const dateB = new Date(b.created_at).getTime();
                    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
                  })
                  .map((transfer) => (
                    <tr key={transfer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        {new Date(transfer.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {(transfer.church_branches_from as any)?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {(transfer.church_branches_to as any)?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(transfer.status)}
                      </td>
                      <td className="px-6 py-4 text-gray-500 max-w-xs transition-all">
                        {transfer.status === 'rejected' && transfer.rejection_notes ? (
                          <div className="text-red-600 text-xs font-medium">Reason: {transfer.rejection_notes}</div>
                        ) : (
                          <span className="truncate block" title={transfer.notes}>{transfer.notes || '-'}</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};