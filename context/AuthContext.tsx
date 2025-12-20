import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Session } from '@supabase/supabase-js';
import { Profile, AppRole } from '../types';

interface AuthContextType {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  profile: null,
  loading: true,
  isAdmin: false,
  isSuperAdmin: false,
  signOut: async () => { },
  refreshProfile: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Simulating fetching profile
  const fetchProfile = async (userId: string, userEmail?: string, metadata?: any) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
        console.error('Error fetching profile:', error.message);
      }

      if (data) {
        setProfile(data as Profile);
      } else {
        // Fallback for demo/new users: Use metadata if available
        setProfile({
          id: userId,
          email: userEmail || '',
          full_name: metadata?.full_name || '',
          primary_role: (metadata?.primary_role as AppRole) || AppRole.MEMBER,
          branch_id: metadata?.branch_id || '',
        } as Profile);
      }
    } catch (e: any) {
      console.error('Unexpected error in fetchProfile:', e.message || e);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (session?.user) {
      await fetchProfile(session.user.id, session.user.email, session.user.user_metadata);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id, session.user.email, session.user.user_metadata);
      else setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id, session.user.email, session.user.user_metadata);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (profile) setLoading(false);
  }, [profile]);

  const value = {
    session,
    profile,
    loading,
    isAdmin: profile?.primary_role === AppRole.ADMIN || profile?.primary_role === AppRole.SUPER_ADMIN,
    isSuperAdmin: profile?.primary_role === AppRole.SUPER_ADMIN,
    signOut: async () => {
      await supabase.auth.signOut();
      setProfile(null);
      setSession(null);
    },
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};