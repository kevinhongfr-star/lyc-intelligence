import { supabase, getPortalRedirect, type PortalRole, type UserProfile } from './client';

export async function signUp(
  email: string,
  password: string,
  portalRole: PortalRole = 'candidate',
  fullName?: string
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        portal_role: portalRole,
        full_name: fullName || email.split('@')[0],
        name: fullName || email.split('@')[0],
      },
    },
  });

  return { data, error };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (data.session?.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    return {
      session: data.session,
      profile: profile as UserProfile | null,
      error: null,
    };
  }

  return { session: null, profile: null, error };
}

export async function signInWithMagicLink(email: string, redirectTo?: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo || `${window.location.origin}/dashboard`,
    },
  });

  return { error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  return { error };
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  return { error };
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getCurrentProfile(): Promise<UserProfile | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) return null;
  return data as UserProfile;
}

export async function updateProfile(updates: Partial<UserProfile>) {
  const user = await getCurrentUser();
  if (!user) return { error: new Error('Not authenticated') };

  const { error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  return { error };
}

export { getPortalRedirect };
export type { PortalRole, UserProfile };
