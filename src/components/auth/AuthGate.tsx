import React, { useEffect, useState } from 'react';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { Eye, EyeOff } from 'lucide-react';
import { AppProvider } from '../../context/AppContext';
import { api } from '../../services/api';
import { demoApiEnabled, supabase } from '../../services/supabase';
import { CURRENT_USER, SEED_MEMBERSHIPS, SEED_TENANTS } from '../../data/seedData';
import type { Membership, Tenant, User } from '../../types';

const PASSWORD_RECOVERY_REDIRECT_URL = 'https://leadgen.jeneconk.com/';

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
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

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
    setNotice('');
    onSignedIn(data.session);
  };

  const sendPasswordReset = async () => {
    if (!supabase) return;
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setError('Enter your account email first, then choose “Forgot password?”.');
      setNotice('');
      return;
    }
    setSendingReset(true);
    setError('');
    setNotice('');
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: PASSWORD_RECOVERY_REDIRECT_URL,
    });
    setSendingReset(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setNotice('If an account exists for that email, a password reset link has been sent. Check your inbox and spam folder.');
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
          <span className="relative block">
            <input autoComplete="current-password" type={passwordVisible ? 'text' : 'password'} required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 pr-11 text-sm text-white outline-none focus:border-amber-400" />
            <button type="button" onClick={() => setPasswordVisible((visible) => !visible)} aria-label={passwordVisible ? 'Hide password' : 'Show password'} aria-pressed={passwordVisible} className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-slate-400 hover:text-white">
              {passwordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </span>
        </label>
        {error && <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">{error}</p>}
        {notice && <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200">{notice}</p>}
        <button disabled={submitting} className="w-full rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-60">
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
        <button type="button" onClick={() => void sendPasswordReset()} disabled={sendingReset} className="w-full text-center text-xs font-medium text-amber-300 hover:text-amber-200 disabled:opacity-60">
          {sendingReset ? 'Sending reset link…' : 'Forgot password?'}
        </button>
      </form>
    </main>
  );
};

const PasswordRecoveryScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const updatePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    if (password.length < 8) {
      setError('Use a password with at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }
    setSubmitting(true);
    setError('');
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    onComplete();
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-5">
      <form onSubmit={updatePassword} className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-7 shadow-2xl space-y-5">
        <div>
          <h1 className="text-xl font-semibold">Choose a new password</h1>
          <p className="mt-1 text-xs text-slate-400">Use at least 8 characters. You’ll sign in with it after it is updated.</p>
        </div>
        <label className="block space-y-1.5 text-xs text-slate-300">
          <span>New password</span>
          <span className="relative block">
            <input autoComplete="new-password" type={passwordVisible ? 'text' : 'password'} required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 pr-11 text-sm text-white outline-none focus:border-amber-400" />
            <button type="button" onClick={() => setPasswordVisible((visible) => !visible)} aria-label={passwordVisible ? 'Hide password' : 'Show password'} aria-pressed={passwordVisible} className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-slate-400 hover:text-white">
              {passwordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </span>
        </label>
        <label className="block space-y-1.5 text-xs text-slate-300">
          <span>Confirm new password</span>
          <input autoComplete="new-password" type={passwordVisible ? 'text' : 'password'} required minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400" />
        </label>
        {error && <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">{error}</p>}
        <button disabled={submitting} className="w-full rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-60">
          {submitting ? 'Updating password…' : 'Update password'}
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
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const [authNotice, setAuthNotice] = useState('');

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
    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecovery(true);
        setSession(nextSession);
        setWorkspace(null);
        api.setAccessToken(nextSession?.access_token || null);
        return;
      }
      if (event === 'SIGNED_OUT') setPasswordRecovery(false);
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

  if (passwordRecovery && session) {
    return <PasswordRecoveryScreen onComplete={() => {
      setPasswordRecovery(false);
      setAuthNotice('Your password has been updated. Sign in with your new password.');
      void supabase?.auth.signOut({ scope: 'global' });
    }} />;
  }

  if (!session) {
    return <>{(error || authNotice) && <div role={error ? 'alert' : 'status'} className={`absolute inset-x-0 top-0 z-10 p-3 text-center text-xs ${error ? 'bg-rose-950 text-rose-200' : 'bg-emerald-950 text-emerald-200'}`}>{error || authNotice}</div>}<LoginScreen onSignedIn={(nextSession) => { setAuthNotice(''); void authorize(nextSession); }} /></>;
  }

  if (!workspace) {
    return <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6"><p role="alert" className="max-w-lg rounded-xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm">{error || 'Workspace authorization could not be completed.'}</p></main>;
  }

  const authClient = supabase;
  return <AppProvider user={workspace.user} tenants={workspace.tenants} memberships={workspace.memberships} onSignOut={() => void authClient?.auth.signOut()}>{children}</AppProvider>;
};
