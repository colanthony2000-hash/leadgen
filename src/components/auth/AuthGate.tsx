import React, { useEffect, useState } from 'react';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { AppProvider } from '../../context/AppContext';
import { api } from '../../services/api';
import { demoApiEnabled, supabase } from '../../services/supabase';
import { CURRENT_USER, SEED_MEMBERSHIPS, SEED_TENANTS } from '../../data/seedData';
import type { Membership, Tenant, User } from '../../types';

interface AuthorizedWorkspaceResponse {
  user: User;
  tenants: Tenant[];
  memberships: Membership[];
}

const nameFromUser = (user: SupabaseUser): string => {
  const displayName = user.user_metadata?.full_name || user.user_metadata?.name;
  return typeof displayName === 'string' && displayName.trim()
    ? displayName.trim()
    : user.email || 'Workspace user';
};

const LoginScreen: React.FC<{ onSignedIn: (session: Session) => void }> = ({ onSignedIn }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    setSubmitting(true);
    setError('');
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (authError || !data.session) {
      setError(authError?.message || 'Sign-in did not return a session.');
      return;
    }
    onSignedIn(data.session);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-5">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-7 shadow-2xl space-y-5">
        <div className="flex items-center gap-3">
          <img src="/assets/aistudio/logo_bf2c43a3.png" alt="Jeneconk" className="h-11 w-11 rounded-full" />
          <div>
            <h1 className="text-xl font-semibold">Sign in to Jeneconk BII</h1>
            <p className="text-xs text-slate-400">Use your workspace account.</p>
          </div>
        </div>
        <label className="block text-xs text-slate-300 space-y-1.5">
          <span>Email</span>
          <input autoComplete="username" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400" />
        </label>
        <label className="block text-xs text-slate-300 space-y-1.5">
          <span>Password</span>
          <input autoComplete="current-password" type="password" required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400" />
        </label>
        {error && <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">{error}</p>}
        <button disabled={submitting} className="w-full rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-60">
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  );
};

export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [workspace, setWorkspace] = useState<AuthorizedWorkspaceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const authorize = async (nextSession: Session | null) => {
    setSession(nextSession);
    setWorkspace(null);
    setError('');
    api.setAccessToken(nextSession?.access_token || null);

    if (!nextSession) return;

    try {
      const authorizedWorkspace = await api.getMe();
      if (!authorizedWorkspace.tenants.length) {
        throw new Error('Your account does not have an active workspace membership. Contact the workspace owner.');
      }
      setWorkspace(authorizedWorkspace);
      api.setTenantContext(authorizedWorkspace.tenants[0].id, authorizedWorkspace.user.display_name);
    } catch (authError) {
      await supabase?.auth.signOut();
      api.setAccessToken(null);
      setSession(null);
      setError(authError instanceof Error ? authError.message : 'Unable to verify workspace access.');
    }
  };

  useEffect(() => {
    if (demoApiEnabled && !supabase) {
      setLoading(false);
      return;
    }
    if (!supabase) {
      setError('Sign-in is not configured. Set the Supabase URL and publishable key, then restart the app.');
      setLoading(false);
      return;
    }

    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      void authorize(data.session).finally(() => setLoading(false));
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) void authorize(nextSession);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <main className="min-h-screen bg-slate-950 text-slate-300 flex items-center justify-center text-sm">Loading secure workspace…</main>;
  }

  if (demoApiEnabled && !supabase) {
    const tenant = SEED_TENANTS[0];
    const memberships = SEED_MEMBERSHIPS.filter((membership) => membership.tenant_id === tenant.id);
    return <AppProvider user={CURRENT_USER} tenants={[tenant]} memberships={memberships} demoMode>{children}</AppProvider>;
  }

  if (!supabase) {
    return <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6"><p role="alert" className="max-w-lg rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm">{error}</p></main>;
  }

  if (!session) {
    return <>{error && <div role="alert" className="absolute inset-x-0 top-0 z-10 bg-rose-950 p-3 text-center text-xs text-rose-200">{error}</div>}<LoginScreen onSignedIn={(nextSession) => void authorize(nextSession)} /></>;
  }

  if (!workspace) {
    return <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6"><p role="alert" className="max-w-lg rounded-xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm">{error || 'Workspace authorization could not be completed.'}</p></main>;
  }

  const authClient = supabase;
  return <AppProvider user={workspace.user} tenants={workspace.tenants} memberships={workspace.memberships} onSignOut={() => void authClient?.auth.signOut()}>{children}</AppProvider>;
};
