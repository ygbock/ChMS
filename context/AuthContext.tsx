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

  const fetchProfile = async (userId: string, userEmail?: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        // Log error only if it's not a common expected error (like table missing or row missing)
        // 42P01: Table doesn't exist, PGRST116: Row not found
        if (error.code !== 'PGRST116' && error.code !== '42P01') {
          console.warn('Profile fetch handled:', error.message);
        }
        
        // Fallback for demo/new users without profile trigger or table setup
        setProfile({
          id: userId,
          email: userEmail || '',
          primary_role: AppRole.MEMBER,
        });
      } else if (data) {
        setProfile(data as Profile);
      } else {
        setProfile({
          id: userId,
          email: userEmail || '',
          primary_role: AppRole.MEMBER,
        });
      }
    } catch (e: any) {
      // Catch network errors like "TypeError: Failed to fetch"
      console.error('Network or unexpected error fetching profile:', e.message || e);
      setProfile({
        id: userId,
        email: userEmail || '',
        primary_role: AppRole.MEMBER,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id, session.user.email);
      } else {
        setLoading(false);
      }
    }).catch(err => {
      console.error("Auth session error:", err);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setLoading(true);
        fetchProfile(session.user.id, session.user.email);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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