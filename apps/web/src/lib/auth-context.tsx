'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { api, User, Company } from '@/lib/api';
import { useRouter, usePathname } from 'next/navigation';
import { createSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase/client';

interface AuthContextType {
  user: User | null;
  company: Company | null;
  loading: boolean;
  apiReachable: boolean;
  supabaseEnabled: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithSupabase: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchCompany: (company: Company) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiReachable, setApiReachable] = useState(true);
  const [supabaseEnabled, setSupabaseEnabled] = useState(isSupabaseConfigured());
  const router = useRouter();
  const pathname = usePathname();

  const applySession = useCallback((token: string, u: User) => {
    api.setToken(token);
    setUser(u);
    const storedId = api.getCompanyId();
    const selected = u.companies.find((c) => c.id === storedId) ?? u.companies[0] ?? null;
    if (selected) {
      setCompany(selected);
      api.setCompanyId(selected.id);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const u = await api.me();
      setUser(u);
      setApiReachable(true);
      const storedId = api.getCompanyId();
      const selected = u.companies.find((c) => c.id === storedId) ?? u.companies[0] ?? null;
      if (selected) {
        setCompany(selected);
        api.setCompanyId(selected.id);
      }
    } catch {
      setUser(null);
      setCompany(null);
      api.setToken(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const config = await api.authConfig();
        if (!cancelled) {
          setSupabaseEnabled(config.supabaseEnabled || isSupabaseConfigured());
          setApiReachable(true);
        }
      } catch {
        if (!cancelled) {
          setApiReachable(false);
          setSupabaseEnabled(isSupabaseConfigured());
        }
      }

      const token = api.getToken();
      if (token) {
        await refreshUser();
      }
      if (!cancelled) setLoading(false);
    }

    const timeout = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 5000);

    init().finally(() => clearTimeout(timeout));
    return () => { cancelled = true; };
  }, [refreshUser]);

  useEffect(() => {
    if (!loading && !user && pathname !== '/login') {
      router.push('/login');
    }
  }, [loading, user, pathname, router]);

  const login = async (email: string, password: string) => {
    const { token, user: u } = await api.login(email, password);
    applySession(token, u);
    router.push('/today');
  };

  const loginWithSupabase = async (email: string, password: string) => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) throw new Error('Supabase is not configured');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) throw new Error(error?.message ?? 'Supabase login failed');
    const { token, user: u } = await api.supabaseLogin(data.session.access_token);
    applySession(token, u);
    router.push('/today');
  };

  const logout = async () => {
    const supabase = createSupabaseBrowserClient();
    if (supabase) await supabase.auth.signOut();
    api.setToken(null);
    api.setCompanyId(null);
    setUser(null);
    setCompany(null);
    router.push('/login');
  };

  const switchCompany = (c: Company) => {
    setCompany(c);
    api.setCompanyId(c.id);
    router.push('/today');
  };

  if (loading && pathname !== '/login') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
          <p className="mt-4 text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        company,
        loading,
        apiReachable,
        supabaseEnabled,
        login,
        loginWithSupabase,
        logout,
        switchCompany,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
