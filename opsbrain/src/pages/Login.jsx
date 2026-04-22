import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Brain } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';

export default function Login() {
  const { user, loading: authLoading, signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (user) navigate('/Dashboard', { replace: true });
  }, [user, authLoading, navigate]);

  const onEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!isSupabaseConfigured) return;
    setSubmitting(true);
    try {
      const { error: err } = await signIn(email.trim(), password);
      if (err) {
        setError(err.message || 'התחברות נכשלה');
        return;
      }
      navigate('/Dashboard', { replace: true });
    } catch (err) {
      setError(err?.message || 'שגיאה לא צפויה');
    } finally {
      setSubmitting(false);
    }
  };

  const onGoogle = async () => {
    setError('');
    if (!isSupabaseConfigured) return;
    setGoogleLoading(true);
    try {
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/Dashboard`,
        },
      });
      if (err) setError(err.message || 'Google נכשל');
    } catch (err) {
      setError(err?.message || 'שגיאה ב-Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0B0B14] via-[#0F0F1A] to-[#141437] p-4"
      dir="rtl"
    >
      <div className="w-full max-w-md rounded-2xl border border-[#2A2A45] bg-[#1E1E35] shadow-2xl p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mb-4 ring-1 ring-white/10">
            <Brain className="text-white w-8 h-8" aria-hidden />
          </div>
          <h1 className="text-2xl font-bold text-white text-center">ברוכים הבאים ל-OpsBrain</h1>
          <p className="text-[#A0A0C0] mt-1 text-sm">התחבר כדי להמשיך</p>
        </div>

        {!isSupabaseConfigured ? (
          <div
            role="alert"
            className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100 text-right"
          >
            <p className="font-semibold mb-1">חסר חיבור ל-Supabase</p>
            <p className="text-amber-100/90 leading-relaxed">
              ב-Vercel → Settings → Environment Variables (Production) הוסף{' '}
              <code className="rounded bg-black/30 px-1">VITE_SUPABASE_URL</code> ו־
              <code className="rounded bg-black/30 px-1">VITE_SUPABASE_ANON_KEY</code>, ואז Redeploy.
            </p>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => void onGoogle()}
              disabled={googleLoading || submitting}
              className="w-full mb-4 flex items-center justify-center gap-2 rounded-xl border border-[#2A2A45] bg-[#0F0F1A] py-3 text-sm font-medium text-white hover:bg-white/5 disabled:opacity-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {googleLoading ? 'פותח…' : 'המשך עם Google'}
            </button>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#2A2A45]" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#1E1E35] px-2 text-[#6B6B8A]">או</span>
              </div>
            </div>

            <form onSubmit={onEmailLogin} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-[#C4C4E0]">
                  אימייל
                </label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-[#2A2A45] bg-[#0F0F1A] px-4 py-3 text-sm text-white placeholder:text-[#6B6B8A] focus:border-[#6B46C1] focus:outline-none focus:ring-1 focus:ring-[#6B46C1]"
                  placeholder="you@company.com"
                />
              </div>
              <div>
                <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium text-[#C4C4E0]">
                  סיסמה
                </label>
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-[#2A2A45] bg-[#0F0F1A] px-4 py-3 text-sm text-white placeholder:text-[#6B6B8A] focus:border-[#6B46C1] focus:outline-none focus:ring-1 focus:ring-[#6B46C1]"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
              )}

              <button
                type="submit"
                disabled={submitting || googleLoading}
                className="w-full rounded-xl bg-[#6B46C1] py-3 text-sm font-semibold text-white hover:bg-[#5a3aad] disabled:opacity-50"
              >
                {submitting ? 'מתחבר…' : 'כניסה'}
              </button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-sm text-[#6B6B8A]">
          אין לך חשבון?{' '}
          <Link to="/Register" className="font-medium text-[#A78BFA] hover:text-white">
            הירשם עכשיו
          </Link>
        </p>
      </div>
    </div>
  );
}
