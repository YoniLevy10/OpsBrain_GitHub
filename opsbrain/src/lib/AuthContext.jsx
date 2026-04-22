import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [workspaceId, setWorkspaceId] = useState(null);
  const [workspaceName, setWorkspaceName] = useState(null);

  const loadWorkspace = useCallback(async (userId) => {
    if (!userId) {
      setWorkspaceId(null);
      setWorkspaceName(null);
      return;
    }
    const { data, error } = await supabase
      .from('workspace_members')
      .select('workspace_id, workspaces(name)')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    if (error || !data?.workspace_id) {
      setWorkspaceId(null);
      setWorkspaceName(null);
      return;
    }
    setWorkspaceId(data.workspace_id);
    const name = data.workspaces?.name;
    setWorkspaceName(typeof name === 'string' ? name : null);
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

    setWorkspaceId(workspace.id);
    setWorkspaceName(workspace.name);
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      if (session?.user) {
        await loadWorkspace(session.user.id);
        const { data: membership } = await supabase
          .from('workspace_members')
          .select('workspace_id')
          .eq('user_id', session.user.id)
          .limit(1)
          .maybeSingle();
        if (!membership?.workspace_id) await ensurePersonalWorkspace(session.user);
      } else {
        setWorkspaceId(null);
        setWorkspaceName(null);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadWorkspace(session.user.id);
          const { data: membership } = await supabase
            .from('workspace_members')
            .select('workspace_id')
            .eq('user_id', session.user.id)
            .limit(1)
            .maybeSingle();
          if (!membership?.workspace_id) await ensurePersonalWorkspace(session.user);
        } else {
          setWorkspaceId(null);
          setWorkspaceName(null);
        }
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [ensurePersonalWorkspace, loadWorkspace]);

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

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        workspaceId,
        workspaceName,
        signIn,
        signUp,
        signOut,
        loadWorkspace,
        isLoadingAuth: loading,
        isLoadingPublicSettings: false,
        isAuthenticated: !!user,
        authError: null,
        appPublicSettings: null,
        navigateToLogin: () => {
          window.location.href = '/Login';
        },
        logout: signOut,
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
