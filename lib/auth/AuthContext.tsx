import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { AuthError, mapSupabaseAuthError } from './authErrors';
import { clearCloudSyncUserBinding, resetCloudSyncSession } from '../supabase/cloudSave';
import { clearLocalGameSave } from '../storage/storage';
import { getSupabase, isSupabaseConfigured } from '../supabase/client';

type AuthContextValue = {
  accessToken: string | null;
  isHydrating: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setIsHydrating(false);
      return;
    }

    const supabase = getSupabase();
    let cancelled = false;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled) {
        setAccessToken(session?.access_token ?? null);
        setIsHydrating(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAccessToken(session?.access_token ?? null);
      setIsHydrating(false);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      throw new AuthError('missing_supabase_env');
    }
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) throw mapSupabaseAuthError(error);
    setAccessToken(data.session?.access_token ?? null);
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      throw new AuthError('missing_supabase_env');
    }
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) throw mapSupabaseAuthError(error);
    if (!data.session?.access_token) {
      throw new AuthError('email_not_confirmed');
    }
    setAccessToken(data.session.access_token);
  }, []);

  const signOut = useCallback(async () => {
    resetCloudSyncSession();
    await clearLocalGameSave();
    await clearCloudSyncUserBinding();
    if (isSupabaseConfigured()) {
      await getSupabase().auth.signOut();
    }
    setAccessToken(null);
  }, []);

  const value = useMemo(
    () => ({ accessToken, isHydrating, signIn, signUp, signOut }),
    [accessToken, isHydrating, signIn, signUp, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
