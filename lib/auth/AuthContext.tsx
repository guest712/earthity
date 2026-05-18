import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { loginWithPassword } from '../api/authLogin';
import { clearStoredAccessToken, readStoredAccessToken, writeStoredAccessToken } from './tokenStorage';

type AuthContextValue = {
  accessToken: string | null;
  isHydrating: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = await readStoredAccessToken();
      if (!cancelled) {
        setAccessToken(token);
        setIsHydrating(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const token = await loginWithPassword(email, password);
    await writeStoredAccessToken(token);
    setAccessToken(token);
  }, []);

  const signOut = useCallback(async () => {
    await clearStoredAccessToken();
    setAccessToken(null);
  }, []);

  const value = useMemo(
    () => ({ accessToken, isHydrating, signIn, signOut }),
    [accessToken, isHydrating, signIn, signOut]
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
