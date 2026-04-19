import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = (email, password) =>
    supabase.auth.signInWithPassword({ email, password });

  const signUp = (email, password, options) =>
    supabase.auth.signUp({ email, password, options });

  const signOut = () => supabase.auth.signOut();

  // Legacy compat for Base44-based components
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
      signIn,
      signUp,
      signOut,
      // Legacy Base44 compat
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
