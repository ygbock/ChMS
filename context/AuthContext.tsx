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
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  profile: null,
  loading: true,
  isAdmin: false,
  isSuperAdmin: false,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Simulating fetching profile
  const fetchProfile = async (userId: string, userEmail?: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        // Ignore "Row not found" (PGRST116) and "Table not found" (42P01)
        if (error.code !== 'PGRST116' && error.code !== '42P01') {
          console.error('Error fetching profile:', error.message);
        }
      }
      
      if (data) {
        setProfile(data as Profile);
      } else {
        // Fallback for demo/new users without profile trigger setup
        setProfile({
          id: userId,
          email: userEmail || '',
          primary_role: AppRole.MEMBER, // Default
        });
      }
    } catch (e: any) {
      console.error('Unexpected error in fetchProfile:', e.message || e);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id, session.user.email);
      else setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id, session.user.email);
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};