import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Button, Input, Card } from '../components/ui';
import { AppRole, Branch } from '../types';
import { Spinner } from '../components/ui';

const ALLOW_PUBLIC_SIGNUP = false; // Set to true to enable self-registration

export const Auth: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(!searchParams.get('mode'));
  const [isForgotMode, setIsForgotMode] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<AppRole>(AppRole.MEMBER);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [fetchingBranches, setFetchingBranches] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (!isLogin && !isForgotMode && branches.length === 0) {
      loadBranches();
    }
  }, [isLogin, isForgotMode]);

  const loadBranches = async () => {
    setFetchingBranches(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('church_branches')
        .select('*')
        .order('name');

      if (fetchError) {
        // Check for missing table error
        if (fetchError.code === '42P01') {
          console.warn('[Auth] church_branches table missing. Using demo branch.');
          setBranches([{ id: '00000000-0000-0000-0000-000000000000', name: 'Demo Branch' } as Branch]);
          setSelectedBranchId('00000000-0000-0000-0000-000000000000');
        } else {
          throw fetchError;
        }
      } else {
        setBranches(data || []);
        if (data && data.length > 0) setSelectedBranchId(data[0].id);
      }
    } catch (err: any) {
      console.error('Error fetching branches:', err);
      setError('Could not load church branches. Please check your connection or database setup.');
    } finally {
      setFetchingBranches(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isForgotMode) {
      handleForgotPassword();
      return;
    }
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        // --- LOGIN LOGIC ---
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (authError) throw authError;

        // Fetch profile to determine redirect
        if (authData.session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('primary_role')
            .eq('id', authData.session.user.id)
            .single();

          const role = profile?.primary_role;

          // Intelligent Redirect based on Role
          if (role === AppRole.SUPER_ADMIN) {
            navigate('/superadmin');
          } else if (role === AppRole.ADMIN || role === AppRole.DISTRICT_ADMIN) {
            navigate('/admin');
          } else {
            navigate('/portal');
          }
        }
      } else {
        // --- SIGNUP LOGIC ---
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              primary_role: selectedRole,
              branch_id: selectedBranchId,
            }
          }
        });

        if (error) throw error;

        if (data.session) {
          // Auto login after signup
          // We use the selectedRole directly for the initial redirect since the profile 
          // might still be being created by the database trigger
          const role = selectedRole;
          console.log('[Auth] Signup successful, redirecting based on selected role:', role);

          if (role === AppRole.SUPER_ADMIN) {
            navigate('/superadmin');
          } else if (role === AppRole.ADMIN || role === AppRole.DISTRICT_ADMIN) {
            navigate('/admin');
          } else {
            navigate('/portal');
          }
        } else {
          alert('Account created! Please check your email for the confirmation link to activate your account.');
          setIsLogin(true);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/auth?mode=reset',
      });
      if (error) throw error;
      alert('Password reset link sent! Please check your email.');
      setIsForgotMode(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-white to-blue-50 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-400/20 rounded-full blur-[100px]" />
      </div>
      <Card className="w-full max-w-md relative z-10 backdrop-blur-sm bg-white/90 border-white/20 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {isForgotMode ? 'Reset your password' : (isLogin ? 'Welcome back' : 'Create an account')}
          </h1>
          <p className="text-gray-500 mt-2">
            {isForgotMode
              ? 'Enter your email to receive a password reset link'
              : 'Enter your credentials to access FaithConnect'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && !isForgotMode && (
            <Input
              label="Full Name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="John Doe"
            />
          )}

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
          />

          {!isForgotMode && (
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          )}

          {isLogin && !isForgotMode && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setIsForgotMode(true)}
                className="text-xs text-primary hover:underline"
              >
                Forgot password?
              </button>
            </div>
          )}

          {/* Role Selection - Only for Signup Demo Purposes */}
          {!isLogin && !isForgotMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Role (Demo Only)
              </label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as AppRole)}
              >
                <option value={AppRole.MEMBER}>Member</option>
                <option value={AppRole.WORKER}>Volunteer / Worker</option>
                <option value={AppRole.ADMIN}>Branch Admin</option>
                <option value={AppRole.SUPER_ADMIN}>Super Admin</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                * In production, roles are assigned by administrators.
              </p>
            </div>
          )}

          {!isLogin && !isForgotMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Branch
              </label>
              {fetchingBranches ? (
                <div className="flex justify-center p-2"><Spinner size="sm" /></div>
              ) : (
                <select
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  required
                >
                  <option value="">Select a branch...</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-100">
              {error}
            </div>
          )}

          <Button
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Processing...' : (isForgotMode ? 'Send Reset Link' : (isLogin ? 'Sign In' : 'Create Account'))}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          {isForgotMode ? (
            <button
              onClick={() => setIsForgotMode(false)}
              className="text-primary hover:underline font-medium"
            >
              Back to Sign In
            </button>
          ) : (
            <>
              {isLogin ? (
                ALLOW_PUBLIC_SIGNUP ? (
                  <button
                    onClick={() => setIsLogin(false)}
                    className="text-primary hover:underline font-medium"
                  >
                    Don't have an account? Sign up
                  </button>
                ) : (
                  <p className="text-gray-500 italic">
                    New accounts are created by Branch Administrators.
                  </p>
                )
              ) : (
                <button
                  onClick={() => setIsLogin(true)}
                  className="text-primary hover:underline font-medium"
                >
                  Already have an account? Sign in
                </button>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
};