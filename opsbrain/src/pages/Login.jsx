// v0-generated — OpsBrain visual pass
// Option A: Premium Login with split-layout hero on desktop

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Brain, Zap, Shield, BarChart3 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';

const V0_CACHE_KEY = 'opsbrain_v0_welcome_v1';
const V0_CACHE_MS = 30 * 24 * 60 * 60 * 1000;
const V0_FALLBACK =
  'OpsBrain מרכז את הפעילות העסקית במקום אחד — התחברו ותמשיכו מאיפה שהפסקתם.';

function readV0WelcomeCache() {
  try {
    const raw = localStorage.getItem(V0_CACHE_KEY);
    if (!raw) return null;
    const j = JSON.parse(raw);
    if (!j || typeof j.text !== 'string' || !j.t) return null;
    if (Date.now() - j.t > V0_CACHE_MS) {
      localStorage.removeItem(V0_CACHE_KEY);
      return null;
    }
    return j.text;
  } catch {
    return null;
  }
}

function writeV0WelcomeCache(text) {
  try {
    localStorage.setItem(V0_CACHE_KEY, JSON.stringify({ t: Date.now(), text }));
  } catch {
    /* ignore quota */
  }
}

export default function Login() {
  const { user, loading: authLoading, signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [v0Line, setV0Line] = useState(() => readV0WelcomeCache() || '');
  const [v0Status, setV0Status] = useState(() => (readV0WelcomeCache() ? 'ok' : 'loading'));

  useEffect(() => {
    if (authLoading) return;
    if (user) navigate('/app/Dashboard', { replace: true });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const cached = readV0WelcomeCache();
    if (cached) {
      setV0Line(cached);
      setV0Status('ok');
      return;
    }
    let cancelled = false;
    setV0Status('loading');
    fetch('/api/v0-welcome')
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const t = typeof data?.text === 'string' ? data.text.trim() : '';
        if (data?.ok && t) {
          writeV0WelcomeCache(t);
          setV0Line(t);
          setV0Status('ok');
        } else {
          setV0Line(V0_FALLBACK);
          setV0Status(data?.error === 'missing_key' ? 'no_key' : 'fallback');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setV0Line(V0_FALLBACK);
          setV0Status('fallback');
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
      navigate('/app/Dashboard', { replace: true });
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
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (err) setError(err.message || 'Google נכשל');
    } catch (err) {
      setError(err?.message || 'שגיאה ב-Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  const features = [
    { icon: Zap, title: 'אוטומציה חכמה', desc: 'חסכו זמן עם תהליכים אוטומטיים' },
    { icon: Shield, title: 'אבטחה מלאה', desc: 'הנתונים שלכם מוגנים תמיד' },
    { icon: BarChart3, title: 'תובנות בזמן אמת', desc: 'קבלו החלטות מבוססות נתונים' },
  ];

  return (
    <div
      className="min-h-screen flex bg-slate-50"
      dir="rtl"
    >
      {/* Hero Section - Desktop Only */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden">
        {/* Decorative Grid Background */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(rgba(107, 70, 193, 0.5) 1px, transparent 1px),
                               linear-gradient(90deg, rgba(107, 70, 193, 0.5) 1px, transparent 1px)`,
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        {/* Gradient Orbs */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-indigo-200/50 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-purple-200/50 rounded-full blur-[100px]" />
        <div className="absolute top-2/3 right-1/3 w-64 h-64 bg-sky-200/40 rounded-full blur-[80px]" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 py-16">
          {/* Logo */}
          <div className="flex items-center gap-4 mb-12">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
              <Brain className="text-white w-7 h-7" aria-hidden />
            </div>
            <span className="text-2xl font-bold text-slate-900 tracking-tight">OpsBrain</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl xl:text-5xl font-bold text-slate-900 leading-tight mb-6 text-balance">
            מרכז הפעילות העסקית
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-indigo-500 to-purple-600">
              במקום אחד
            </span>
          </h1>

          <p className="text-lg text-slate-600 mb-12 max-w-lg leading-relaxed">
            נהלו לקוחות, משימות, מסמכים וכספים בפלטפורמה אחת חכמה.
            עם בינה מלאכותית שעובדת בשבילכם.
          </p>

          {/* Feature Pills */}
          <div className="space-y-4">
            {features.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm transition-colors hover:bg-slate-50 group"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100 transition-colors">
                  <f.icon className="w-5 h-5 text-indigo-700" aria-hidden />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">{f.title}</h3>
                  <p className="text-slate-600 text-sm">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="flex gap-8 mt-12 pt-8 border-t border-slate-200">
            <div>
              <p className="text-2xl font-bold text-slate-900">500+</p>
              <p className="text-sm text-slate-600">עסקים פעילים</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">99.9%</p>
              <p className="text-sm text-slate-600">זמינות מערכת</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">24/7</p>
              <p className="text-sm text-slate-600">תמיכה טכנית</p>
            </div>
          </div>
        </div>

        {/* Edge Gradient */}
        <div className="absolute left-0 inset-y-0 w-32 bg-gradient-to-r from-transparent to-slate-50" />
      </div>

      {/* Login Form Section */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex flex-col items-center mb-8 lg:hidden">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
              <Brain className="text-white w-8 h-8" aria-hidden />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 text-center">ברוכים הבאים ל-OpsBrain</h1>
          </div>

          {/* Card */}
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-8 sm:p-10">
            {/* Desktop Heading */}
            <div className="hidden lg:block mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">התחברות לחשבון</h2>
              <p className="text-slate-600 text-sm">הזינו את הפרטים כדי להמשיך</p>
            </div>

            {/* Mobile Subtitle */}
            <p className="text-slate-600 text-sm text-center mb-6 lg:hidden">התחבר כדי להמשיך</p>

            {/* v0 Welcome Strip */}
            <div className="mb-6 text-center text-sm leading-relaxed text-slate-700 border border-slate-200 rounded-2xl bg-slate-50 px-4 py-4">
              {v0Status === 'loading' && !v0Line.trim() ? (
                <span className="text-slate-500">טוען הודעה...</span>
              ) : (
                v0Line.trim() || V0_FALLBACK
              )}
            </div>
            {v0Status === 'no_key' && (
              <p className="mb-4 text-center text-xs text-slate-500">
                להפעלת v0: הוסף <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-900">V0_API_KEY</code> ב-Vercel → Redeploy
              </p>
            )}

            {!isSupabaseConfigured ? (
              <div
                role="alert"
                className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900 text-right"
              >
                <p className="font-semibold mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  חסר חיבור ל-Supabase
                </p>
                <p className="text-amber-800 leading-relaxed">
                  ב-Vercel → Settings → Environment Variables (Production) הוסף{' '}
                  <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono">VITE_SUPABASE_URL</code> ו־
                  <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono">VITE_SUPABASE_ANON_KEY</code>, ואז Redeploy.
                </p>
              </div>
            ) : (
              <>
                {/* Google Button */}
                <button
                  type="button"
                  onClick={() => void onGoogle()}
                  disabled={googleLoading || submitting}
                  className="w-full mb-5 flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white py-3.5 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  {googleLoading ? 'פותח...' : 'המשך עם Google'}
                </button>

                {/* Divider */}
                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-3 text-slate-500 font-medium">או</span>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={onEmailLogin} className="space-y-5">
                  <div>
                    <label htmlFor="login-email" className="mb-2 block text-sm font-medium text-slate-700">
                      אימייל
                    </label>
                    <input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 hover:border-slate-300"
                      placeholder="you@company.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="login-password" className="mb-2 block text-sm font-medium text-slate-700">
                      סיסמה
                    </label>
                    <input
                      id="login-password"
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 hover:border-slate-300"
                      placeholder="........"
                    />
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={submitting || googleLoading}
                    className="w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'מתחבר...' : 'כניסה'}
                  </button>
                </form>
              </>
            )}

            {/* Footer */}
            <p className="mt-8 text-center text-sm text-slate-600">
              אין לך חשבון?{' '}
              <Link
                to="/Register"
                className="font-semibold text-indigo-700 transition-colors duration-200 hover:text-indigo-800"
              >
                הירשם עכשיו
              </Link>
            </p>
          </div>

          {/* Trust Badge */}
          <p className="mt-6 text-center text-xs text-slate-500">
            מאובטח עם הצפנת SSL. הנתונים שלכם בטוחים.
          </p>
        </div>
      </div>
    </div>
  );
}
