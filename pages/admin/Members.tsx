import React, { useState } from 'react';
import { Card, Button, Input, Badge, Spinner } from '../../components/ui';
import { Users, Upload, FileText, Check, X, AlertTriangle } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';

interface ImportRow {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

export const AdminMembers: React.FC = () => {
  const { profile } = useAuth();
  const [isImporting, setIsImporting] = useState(false);
  const [isAddingManually, setIsAddingManually] = useState(false);

  // CSV Import State
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<ImportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Manual Creation State
  const [newMember, setNewMember] = useState({
    email: '',
    fullName: '',
    password: 'ChangeMe123!' // Default password
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
      parseCSV(e.target.files[0]);
    }
  };

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split(/\r?\n/);
        const data: ImportRow[] = [];

        // Validation: Header check (optional but good)
        if (lines.length < 2) throw new Error("File is empty or missing data rows.");

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line) {
            const cols = line.split(',').map(c => c.trim().replace(/^["'](.+)["']$/, '$1'));
            if (cols.length >= 3) {
              data.push({
                first_name: cols[0] || '',
                last_name: cols[1] || '',
                email: cols[2] || '',
                phone: cols[3] || ''
              });
            }
          }
        }

        if (data.length === 0) throw new Error("No valid member records found in CSV.");
        setPreviewData(data);
      } catch (err: any) {
        alert("Error parsing CSV: " + err.message);
        setCsvFile(null);
      }
    };
    reader.onerror = () => alert("Failed to read file.");
    reader.readAsText(file);
  };

  const commitImport = async () => {
    if (!previewData.length || !profile?.branch_id) return;
    setLoading(true);

    try {
      const { error } = await supabase.from('members').insert(
        previewData.map(row => ({
          ...row,
          branch_id: profile.branch_id,
          status: 'active'
        }))
      );

      if (error) throw error;

      // Audit Log
      await supabase.from('audit_logs').insert({
        user_id: profile.id,
        action: 'import_members',
        details: { count: previewData.length, file: csvFile?.name }
      });

      setUploadStatus('success');
      setPreviewData([]);
      setCsvFile(null);
      setTimeout(() => {
        setIsImporting(false);
        setUploadStatus('idle');
      }, 2000);

    } catch (err) {
      console.error(err);
      setUploadStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.branch_id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('create_managed_user', {
        _email: newMember.email,
        _password: newMember.password,
        _full_name: newMember.fullName,
        _role: 'member',
        _branch_id: profile.branch_id
      });

      if (error) throw error;

      alert(`Successfully created account for ${newMember.fullName}. They can now login with their email and the password provided.`);
      setIsAddingManually(false);
      setNewMember({ email: '', fullName: '', password: 'ChangeMe123!' });
    } catch (err: any) {
      alert('Failed to create member account: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Members</h1>
          <p className="text-gray-500">Manage directory and provision accounts.</p>
        </div>
        <div className="flex gap-2">
          {!isImporting && !isAddingManually ? (
            <>
              <Button variant="outline" onClick={() => setIsImporting(true)} className="gap-2">
                <Upload size={16} /> Import CSV
              </Button>
              <Button onClick={() => setIsAddingManually(true)}>Add Manually</Button>
            </>
          ) : (
            <Button variant="secondary" onClick={() => { setIsImporting(false); setIsAddingManually(false); }}>Cancel</Button>
          )}
        </div>
      </div>

      {isAddingManually && (
        <Card title="Add New Member Account" className="max-w-xl mx-auto border-primary/20">
          <form onSubmit={handleCreateMember} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <Input
                label="Full Name"
                required
                value={newMember.fullName}
                onChange={e => setNewMember({ ...newMember, fullName: e.target.value })}
                placeholder="e.g. John Smith"
              />
              <Input
                label="Email Address"
                type="email"
                required
                value={newMember.email}
                onChange={e => setNewMember({ ...newMember, email: e.target.value })}
                placeholder="john@example.com"
              />
              <div className="bg-slate-50 p-3 rounded rounded-md border text-sm text-slate-600">
                <p className="font-semibold mb-1 flex items-center gap-2">
                  <Check size={14} className="text-green-500" /> Default Password
                </p>
                <p>The account will be created with the password below. Please ask the member to change it after their first login.</p>
                <Input
                  type="text"
                  className="mt-2 font-mono bg-white"
                  value={newMember.password}
                  onChange={e => setNewMember({ ...newMember, password: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 text-xs text-gray-500">
              * Member will be assigned to <strong>{(profile as any)?.church_branches?.name || 'your current branch'}</strong>.
            </div>
            <Button className="w-full" disabled={loading}>
              {loading ? <Spinner /> : 'Create Member Account'}
            </Button>
          </form>
        </Card>
      )}

      {isImporting && (
        <Card title="Import Members from CSV" className="border-blue-200 shadow-md">
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-md text-sm text-blue-800 flex gap-2 items-start">
              <FileText className="shrink-0 mt-0.5" size={16} />
              <div>
                <p className="font-semibold">CSV Format Required:</p>
                <p>First Name, Last Name, Email, Phone</p>
              </div>
            </div>

            {!previewData.length ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:bg-gray-50 transition-colors relative">
                <Input
                  type="file"
                  accept=".csv"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleFileChange}
                />
                <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                <p className="font-medium text-gray-600">Click to upload or drag and drop</p>
                <p className="text-sm text-gray-500">CSV files only</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Preview ({previewData.length} records)</h3>
                  <Button variant="ghost" size="sm" onClick={() => { setCsvFile(null); setPreviewData([]); }}>Remove File</Button>
                </div>
                <div className="max-h-60 overflow-y-auto border rounded-md">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2">First Name</th>
                        <th className="px-4 py-2">Last Name</th>
                        <th className="px-4 py-2">Email</th>
                        <th className="px-4 py-2">Phone</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, i) => (
                        <tr key={i} className="border-t">
                          <td className="px-4 py-2">{row.first_name}</td>
                          <td className="px-4 py-2">{row.last_name}</td>
                          <td className="px-4 py-2">{row.email}</td>
                          <td className="px-4 py-2">{row.phone}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {uploadStatus === 'error' && (
                  <div className="text-red-600 text-sm flex items-center gap-2">
                    <AlertTriangle size={16} /> Failed to import members. Check console.
                  </div>
                )}
                {uploadStatus === 'success' && (
                  <div className="text-green-600 text-sm flex items-center gap-2">
                    <Check size={16} /> Successfully imported members!
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button onClick={commitImport} disabled={loading || uploadStatus === 'success'}>
                    {loading ? <Spinner /> : 'Commit Import'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {!isAddingManually && !isImporting && (
        <Card>
          <div className="p-12 text-center text-gray-500">
            <Users className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Directory</h3>
            <p>Member list will appear here. Start by adding members manually or importing a CSV.</p>
          </div>
        </Card>
      )}
    </div>
  );
};
