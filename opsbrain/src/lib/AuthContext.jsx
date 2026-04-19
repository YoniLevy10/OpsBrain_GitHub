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

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      const u = session?.user ?? null;
      setUser(u);
      setLoading(false);
      if (u) loadWorkspace(u.id);
      else {
        setWorkspaceId(null);
        setWorkspaceName(null);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const u = session?.user ?? null;
      setUser(u);
      if (u) loadWorkspace(u.id);
      else {
        setWorkspaceId(null);
        setWorkspaceName(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadWorkspace]);

  const signIn = (email, password) =>
    supabase.auth.signInWithPassword({ email, password });

  const signUp = (email, password, options) =>
    supabase.auth.signUp({ email, password, options });

  const signOut = () => supabase.auth.signOut();

  const isLoadingAuth = loading;
  const isLoadingPublicSettings = false;
  const isAuthenticated = !!user;
  const authError = null;
  const appPublicSettings = null;
  const navigateToLogin = () => { window.location.href = '/Login'; };
  const logout = signOut;

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      workspaceId,
      workspaceName,
      loadWorkspace,
      signIn,
      signUp,
      signOut,
      isLoadingAuth,
      isLoadingPublicSettings,
      isAuthenticated,
      authError,
      appPublicSettings,
      navigateToLogin,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
