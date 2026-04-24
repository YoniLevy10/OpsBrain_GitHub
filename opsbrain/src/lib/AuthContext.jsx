import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authInitNonce, setAuthInitNonce] = useState(0);
  const [authAutoRetryCount, setAuthAutoRetryCount] = useState(0);
  const [workspaces, setWorkspaces] = useState([]);
  const [workspaceId, setWorkspaceId] = useState(null); // active workspace id
  const [workspaceName, setWorkspaceName] = useState(null); // active workspace name

  const activeWorkspace = useMemo(() => {
    if (!workspaceId) return null;
    return workspaces.find((w) => w.id === workspaceId) || null;
  }, [workspaces, workspaceId]);

  const loadWorkspaces = useCallback(async (userId) => {
    if (!userId) {
      setWorkspaces([]);
      setWorkspaceId(null);
      setWorkspaceName(null);
      return;
    }

    // memberships → workspace ids
    const { data: memberships, error: mErr } = await supabase
      .from('workspace_members')
      .select('workspace_id, role, status')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (mErr) {
      console.error('[AuthContext] loadWorkspaces memberships', mErr);
      setWorkspaces([]);
      setWorkspaceId(null);
      setWorkspaceName(null);
      return;
    }

    const wsIds = Array.from(new Set((memberships || []).map((m) => m.workspace_id).filter(Boolean)));
    if (wsIds.length === 0) {
      setWorkspaces([]);
      setWorkspaceId(null);
      setWorkspaceName(null);
      return;
    }

    const { data: wsRows, error: wsErr } = await supabase
      .from('workspaces')
      .select('id, name, slug, owner_id, onboarding_completed, plan')
      .in('id', wsIds)
      .order('created_at', { ascending: true });

    if (wsErr) {
      console.error('[AuthContext] loadWorkspaces workspaces', wsErr);
      setWorkspaces([]);
      setWorkspaceId(null);
      setWorkspaceName(null);
      return;
    }

    const wsList = wsRows || [];
    setWorkspaces(wsList);

    // read persisted active workspace from user_workspace_states (if exists)
    let stateRow = null;
    try {
      const { data, error: sErr } = await supabase
        .from('user_workspace_states')
        .select('id, active_workspace_id')
        .eq('user_id', userId)
        .maybeSingle();
      if (sErr) console.warn('[AuthContext] user_workspace_states', sErr);
      stateRow = data ?? null;
    } catch (e) {
      console.warn('[AuthContext] user_workspace_states (exception)', e);
      stateRow = null;
    }

    const requestedActive = stateRow?.active_workspace_id;
    const resolvedActive =
      (requestedActive && wsList.find((w) => w.id === requestedActive)?.id) || wsList[0]?.id || null;

    setWorkspaceId(resolvedActive);
    setWorkspaceName(wsList.find((w) => w.id === resolvedActive)?.name ?? null);

    // ensure state exists and is valid
    if (resolvedActive) {
      try {
        if (stateRow?.id) {
          if (stateRow.active_workspace_id !== resolvedActive) {
            await supabase
              .from('user_workspace_states')
              .update({ active_workspace_id: resolvedActive, updated_at: new Date().toISOString() })
              .eq('id', stateRow.id);
          }
        } else {
          await supabase.from('user_workspace_states').insert({
            user_id: userId,
            active_workspace_id: resolvedActive,
            created_at: new Date().toISOString(),
          });
        }
      } catch (e) {
        console.warn('[AuthContext] user_workspace_states write failed', e);
      }
    }
  }, []);

  const ensurePersonalWorkspace = useCallback(async (authUser) => {
    if (!authUser?.id) return;
    const fullName =
      authUser.user_metadata?.full_name ||
      authUser.email?.split('@')[0] ||
      'Workspace';
    const base = String(fullName)
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    const slug = `${base || 'workspace'}-${Date.now().toString(36)}`;

    const { data: workspace, error: wsErr } = await supabase
      .from('workspaces')
      .insert({
        name: `${fullName}`,
        slug,
        owner_id: authUser.id,
        onboarding_completed: true,
      })
      .select()
      .single();

    if (wsErr || !workspace?.id) return;

    await supabase.from('workspace_members').insert({
      workspace_id: workspace.id,
      user_id: authUser.id,
      role: 'owner',
      status: 'active',
      invited_email: authUser.email,
      accepted_at: new Date().toISOString(),
    });

    // refresh list + make it active
    await loadWorkspaces(authUser.id);
    setWorkspaceId(workspace.id);
    setWorkspaceName(workspace.name);
  }, [loadWorkspaces]);

  const switchWorkspace = useCallback(
    async (nextWorkspaceId) => {
      if (!user?.id) return;
      if (!nextWorkspaceId) return;
      if (nextWorkspaceId === workspaceId) return;
      const ws = workspaces.find((w) => w.id === nextWorkspaceId);
      if (!ws) return;

      setWorkspaceId(ws.id);
      setWorkspaceName(ws.name ?? null);
      try {
        const { data: stateRow } = await supabase
          .from('user_workspace_states')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (stateRow?.id) {
          await supabase
            .from('user_workspace_states')
            .update({ active_workspace_id: ws.id, updated_at: new Date().toISOString() })
            .eq('id', stateRow.id);
        } else {
          await supabase.from('user_workspace_states').insert({
            user_id: user.id,
            active_workspace_id: ws.id,
            created_at: new Date().toISOString(),
          });
        }
      } catch (e) {
        console.warn('[AuthContext] switchWorkspace persist failed', e);
      }
    },
    [user?.id, workspaceId, workspaces]
  );

  const createWorkspace = useCallback(
    async (name) => {
      if (!user?.id) throw new Error('Not authenticated');
      const trimmed = String(name || '').trim();
      if (!trimmed) throw new Error('Workspace name required');

      // soft limit (UI expects 3)
      if (workspaces.length >= 3) {
        throw new Error('Maximum 3 workspaces allowed');
      }

      const base = trimmed
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
      const slug = `${base || 'workspace'}-${Date.now().toString(36)}`;

      const { data: workspace, error: wsErr } = await supabase
        .from('workspaces')
        .insert({
          name: trimmed,
          slug,
          owner_id: user.id,
          onboarding_completed: true,
        })
        .select()
        .single();
      if (wsErr) throw wsErr;

      await supabase.from('workspace_members').insert({
        workspace_id: workspace.id,
        user_id: user.id,
        role: 'owner',
        status: 'active',
        invited_email: user.email,
        accepted_at: new Date().toISOString(),
      });

      // refresh + activate
      await loadWorkspaces(user.id);
      await switchWorkspace(workspace.id);
      return workspace;
    },
    [loadWorkspaces, switchWorkspace, user?.email, user?.id, workspaces.length]
  );

  useEffect(() => {
    // Local dev safety: if Supabase env is missing/unreachable, don't hang the UI on loading.
    if (!isSupabaseConfigured) {
      setUser(null);
      setWorkspaces([]);
      setWorkspaceId(null);
      setWorkspaceName(null);
      setAuthError({
        kind: 'missing_env',
        message:
          'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment.',
      });
      setLoading(false);
      return () => {};
    }

    let mounted = true;
    let subscription = { unsubscribe: () => {} };
    let timeoutId = null;

    const finishLoading = () => {
      if (mounted) setLoading(false);
    };

    const failAuth = (e) => {
      if (!mounted) return;
      setUser(null);
      setWorkspaces([]);
      setWorkspaceId(null);
      setWorkspaceName(null);
      setAuthError({
        kind: 'auth_init_failed',
        message: e?.message || 'Auth initialization failed',
        details: e,
      });
    };

    const withTimeout = (promise, ms, label) =>
      Promise.race([
        promise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(label ? `${label} timed out` : 'Timed out')), ms)
        ),
      ]);

    const applySession = async (session) => {
      setUser(session?.user ?? null);
      setAuthError(null);
      if (session?.user) {
        await loadWorkspaces(session.user.id);
        const { data: membership, error: membershipErr } = await supabase
          .from('workspace_members')
          .select('workspace_id')
          .eq('user_id', session.user.id)
          .limit(1)
          .maybeSingle();
        if (membershipErr) console.warn('[AuthContext] workspace_members', membershipErr);
        if (!membership?.workspace_id) await ensurePersonalWorkspace(session.user);
      } else {
        setWorkspaces([]);
        setWorkspaceId(null);
        setWorkspaceName(null);
      }
    };

    // Hard timeout so the app never spins forever on auth init.
    timeoutId = setTimeout(() => {
      if (!mounted) return;
      failAuth(new Error('Auth initialization timed out. Check Supabase env/migrations/RLS.'));
      finishLoading();
    }, 12000);

    supabase.auth
      .getSession()
      .then(async ({ data: { session } }) => {
        if (!mounted) return;
        try {
          await withTimeout(applySession(session), 10000, 'applySession');
          if (mounted) setAuthAutoRetryCount(0);
        } catch (e) {
          console.error('[AuthContext] getSession handler', e);
          failAuth(e);
        } finally {
          if (timeoutId) clearTimeout(timeoutId);
          finishLoading();
        }
      })
      .catch((e) => {
        console.error('[AuthContext] getSession', e);
        failAuth(e);
        if (timeoutId) clearTimeout(timeoutId);
        finishLoading();
      });

    try {
      const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (!mounted) return;
        try {
          await withTimeout(applySession(session), 10000, 'applySession');
          if (mounted) setAuthAutoRetryCount(0);
        } catch (e) {
          console.error('[AuthContext] onAuthStateChange handler', e);
          failAuth(e);
        } finally {
          if (timeoutId) clearTimeout(timeoutId);
          finishLoading();
        }
      });
      subscription = data?.subscription ?? { unsubscribe: () => {} };
    } catch (e) {
      console.error('[AuthContext] onAuthStateChange subscribe', e);
      failAuth(e);
      if (timeoutId) clearTimeout(timeoutId);
      finishLoading();
    }

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [ensurePersonalWorkspace, loadWorkspaces, authInitNonce]);

  useEffect(() => {
    if (!authError) return;
    const msg = String(authError?.message || '');
    const isTimeout = msg.includes('timed out') || msg.includes('timedout') || msg.includes('timeout');
    if (!isTimeout) return;
    if (authAutoRetryCount >= 2) return;
    const id = setTimeout(() => {
      setAuthAutoRetryCount((c) => c + 1);
      setAuthError(null);
      setLoading(true);
      setAuthInitNonce((n) => n + 1);
    }, 1500);
    return () => clearTimeout(id);
  }, [authAutoRetryCount, authError]);

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email, password, fullName, businessName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error || !data.user) return { error };

    const userId = data.user.id;
    const base = businessName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    const slug = `${base || 'workspace'}-${Date.now().toString(36)}`;

    const { data: workspace, error: wsErr } = await supabase
      .from('workspaces')
      .insert({ name: businessName, slug, owner_id: userId, onboarding_completed: true })
      .select()
      .single();

    if (wsErr) return { error: wsErr };

    await supabase.from('workspace_members').insert({
      workspace_id: workspace.id,
      user_id: userId,
      role: 'owner',
      status: 'active',
      invited_email: email,
      accepted_at: new Date().toISOString(),
    });

    setWorkspaceId(workspace.id);
    setWorkspaceName(workspace.name);
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setWorkspaceId(null);
    setWorkspaceName(null);
  };

  const retryAuth = useCallback(() => {
    setAuthError(null);
    setLoading(true);
    setAuthAutoRetryCount(0);
    setAuthInitNonce((n) => n + 1);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        workspaceId,
        workspaceName,
        workspaces,
        activeWorkspace,
        switchWorkspace,
        createWorkspace,
        signIn,
        signUp,
        signOut,
        loadWorkspace: loadWorkspaces,
        isLoadingAuth: loading,
        isLoadingPublicSettings: false,
        isAuthenticated: !!user,
        authError,
        appPublicSettings: null,
        navigateToLogin: () => {
          window.location.href = '/Login';
        },
        logout: signOut,
        retryAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
