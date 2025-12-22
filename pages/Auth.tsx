import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Button, Input, Card } from '../components/ui';
import { Profile, AppRole, Branch } from '../types';
import { Spinner } from '../components/ui';
import { useAuth } from '../context/AuthContext';

const ALLOW_PUBLIC_SIGNUP = false; // Set to true to enable self-registration

export const Auth: React.FC = () => {
  const { session, profile } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Redirect if already logged in
  React.useEffect(() => {
    if (session && profile) {
      if (profile.primary_role === AppRole.SUPER_ADMIN) {
        navigate('/superadmin');
      } else if (profile.primary_role === AppRole.ADMIN || profile.primary_role === AppRole.DISTRICT_ADMIN) {
        navigate('/admin');
      } else {
        navigate('/portal');
      }
    }
  }, [session, profile, navigate]);
  const [isLogin, setIsLogin] = useState(!searchParams.get('mode'));
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<AppRole>(AppRole.MEMBER);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
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
              primary_role: selectedRole, // Pass role to Supabase Auth Metadata
            }
          }
        });
        
        if (error) throw error;
        
        if (data.session) {
          // Auto login after signup
          navigate('/portal');
        } else {
          alert('Check your email for the confirmation link!');
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {isLogin ? 'Welcome back' : 'Create an account'}
          </h1>
          <p className="text-gray-500 mt-2">
            Enter your credentials to access FaithConnect
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
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
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
          />

          {/* Role Selection - Only for Signup Demo Purposes */}
          {!isLogin && (
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

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-100">
              {error}
            </div>
          )}

          <Button 
            className="w-full" 
            disabled={loading}
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary hover:underline font-medium"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </Card>
    </div>
  );
};