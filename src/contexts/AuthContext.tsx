import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { User, ICP } from '@/types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || (import.meta.env.VITE_SUPABASE_ANON_KEY as string);

const sb = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

const ADMIN_EMAILS = ['kevin.hong@lyc-partners.ai', 'alessio@lyc-partners.ai'];

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({ user: null, isLoading: true, login: async () => {}, logout: () => {} });

export function useAuth() { return useContext(AuthContext); }

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = async (email: string) => {
    setIsLoading(true);
    try {
      const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase());
      const profile = sb ? await sb.from('profiles').select('*').eq('email', email).single() : null;
      const icp: ICP = isAdmin ? 'consultant' : (profile?.data?.icp as ICP) || 'leader';
      const name = profile?.data?.full_name || email.split('@')[0];
      setUser({ id: profile?.data?.id || 'anonymous', email, name, icp, role: isAdmin ? 'admin' : 'user' });
    } catch { setUser({ id: 'anonymous', email, name: email.split('@')[0], icp: 'leader', role: 'user' }); }
    setIsLoading(false);
  };

  const logout = () => { setUser(null); };

  useEffect(() => { setIsLoading(false); }, []);

  return <AuthContext.Provider value={{ user, isLoading, login, logout }}>{children}</AuthContext.Provider>;
}
