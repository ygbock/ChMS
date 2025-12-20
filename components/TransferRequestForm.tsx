import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Button, Card, Spinner, Input } from './ui';
import { Branch } from '../types';
import { CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TransferRequestForm: React.FC = () => {
  const { profile } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [targetBranchId, setTargetBranchId] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const loadBranches = async () => {
      if (!profile) return;

      try {
        const { data, error } = await supabase
          .from('church_branches')
          .select('*')
          .neq('id', profile.branch_id || '')
          .order('name');
        if (error) throw error;
        setBranches(data || []);
      } catch (err: any) {
        console.error("Error loading branches:", err.message || err);
      } finally {
        setFetching(false);
      }
    };

    if (profile) loadBranches();
    else if (profile === null) setFetching(false);
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !targetBranchId) return;

    setLoading(true);
    setStatus('idle');
    setErrorMessage('');

    try {
      // Simple client-side validation
      if (targetBranchId === profile.branch_id) {
        throw new Error("You are already in this branch.");
      }

      const { error } = await supabase.rpc('submit_transfer_request', {
        target_branch_id: targetBranchId,
        notes: notes
      });

      if (error) throw error;

      setStatus('success');
      setTargetBranchId('');
      setNotes('');

      // Redirect after a short delay for better UX
      // setTimeout(() => navigate('/portal/transfers'), 3000);
    } catch (err: any) {
      console.error("Transfer request error:", err);
      setStatus('error');
      setErrorMessage(err.message || 'Failed to submit transfer request.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="flex justify-center p-8"><Spinner /></div>;

  if (status === 'success') {
    return (
      <Card>
        <div className="text-center py-8">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Request Submitted</h3>
          <p className="mt-2 text-sm text-gray-500">
            Your transfer request has been sent to the target branch for approval.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Button variant="secondary" onClick={() => setStatus('idle')}>Submit Another</Button>
            <Link to="/portal/transfers">
              <Button>View My Requests</Button>
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Request Transfer</h2>
        <Link to="/portal/transfers" className="text-primary text-sm hover:underline flex items-center gap-1">
          View History <ArrowRight size={14} />
        </Link>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-md">
            <p className="text-sm text-blue-800">
              Transferring will move your membership record and ministry assignments to the new branch upon approval by the receiving administrator.
            </p>
          </div>

          {status === 'error' && (
            <div className="bg-red-50 border border-red-100 p-3 rounded-md flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="text-sm text-red-700">{errorMessage}</div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Branch</label>
            <select
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
              value={targetBranchId}
              onChange={(e) => setTargetBranchId(e.target.value)}
              required
            >
              <option value="">Select a branch...</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
            <textarea
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reason for transfer, expected moving date, etc."
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading || !targetBranchId} className="w-full sm:w-auto">
              {loading ? (
                <span className="flex items-center gap-2">
                  <Spinner /> Submitting...
                </span>
              ) : 'Submit Transfer Request'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};