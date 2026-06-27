import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type UserRole = 'user' | 'admin';

export interface SessionUser {
  id: string;
  role: UserRole;
  email: string;
}

interface SessionState {
  user: SessionUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
}

export const useSession = create<SessionState>(() => ({
  user: null,
  loading: true,

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  },

  signUp: async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null };
  },

  logout: async () => {
    await supabase.auth.signOut();
  },
}));

async function syncUser(session: Session | null) {
  if (!session) {
    useSession.setState({ user: null, loading: false });
    return;
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, role')
    .eq('id', session.user.id)
    .single();
  useSession.setState({
    user: profile
      ? { id: profile.id, email: profile.email, role: profile.role as UserRole }
      : null,
    loading: false,
  });
}

// Hydrate at module load (before React mounts) and react to auth changes.
void supabase.auth.getSession().then(({ data }) => syncUser(data.session));
supabase.auth.onAuthStateChange((_event, session) => {
  void syncUser(session);
});
