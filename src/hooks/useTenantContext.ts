import { useState, useEffect, useMemo } from 'react';
import { useAuthStore, UserProfile } from '@/stores/authStore';
import { getSupabase } from '@/services/supabaseApi';

export interface ClientAccount {
  id: string;
  email: string;
  name: string;
  organization: string;
  title: string;
  role: 'client_user' | 'client_admin';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CandidateProfile {
  id: string;
  name: string;
  email: string | null;
  current_title: string | null;
  location: string | null;
  headline: string | null;
  avatar_url: string | null;
}

export type UserType = 'client' | 'candidate' | 'member' | 'admin' | 'anonymous';

export interface TenantContext {
  userType: UserType;
  user: any | null;
  profile: UserProfile | null;
  clientAccount: ClientAccount | null;
  candidateProfile: CandidateProfile | null;
  tenantId: string | null;
  isLoading: boolean;
  error: string | null;
}

export function useTenantContext(): TenantContext {
  const { user, profile, isLoading: authLoading } = useAuthStore();
  const [clientAccount, setClientAccount] = useState<ClientAccount | null>(null);
  const [candidateProfile, setCandidateProfile] = useState<CandidateProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const userType: UserType = useMemo(() => {
    if (!user) return 'anonymous';
    if (profile?.role === 'admin') return 'admin';
    if (profile?.role === 'client_user' || profile?.role === 'client_admin') return 'client';
    if (profile?.role === 'candidate') return 'candidate';
    return 'member';
  }, [user, profile]);

  const tenantId = useMemo(() => {
    if (userType === 'client' && clientAccount) return clientAccount.id;
    if (userType === 'candidate' && candidateProfile) return candidateProfile.id;
    if (userType === 'member' && profile) return profile.id;
    return null;
  }, [userType, clientAccount, candidateProfile, profile]);

  useEffect(() => {
    if (!user || authLoading) return;

    const fetchTenantData = async () => {
      try {
        setError(null);
        const sb = getSupabase();

        if (userType === 'client') {
          const { data, error: clientError } = await sb
            .from('client_accounts')
            .select('*')
            .eq('auth_user_id', user.id)
            .single();

          if (clientError && clientError.code !== 'PGRST116') {
            console.warn('[useTenantContext] Client account fetch error:', clientError);
          } else if (data) {
            setClientAccount(data as ClientAccount);
          }
        } else if (userType === 'candidate') {
          const { data, error: candidateError } = await sb
            .from('contacts')
            .select('id, name, email, current_title, location, headline')
            .eq('auth_user_id', user.id)
            .single();

          if (candidateError && candidateError.code !== 'PGRST116') {
            console.warn('[useTenantContext] Candidate profile fetch error:', candidateError);
          } else if (data) {
            setCandidateProfile(data as CandidateProfile);
          }
        }
      } catch (e) {
        console.error('[useTenantContext] Error:', e);
        setError('Failed to load tenant data');
      }
    };

    fetchTenantData();
  }, [user, userType, authLoading]);

  const isLoading = authLoading;

  return {
    userType,
    user,
    profile,
    clientAccount,
    candidateProfile,
    tenantId,
    isLoading,
    error,
  };
}