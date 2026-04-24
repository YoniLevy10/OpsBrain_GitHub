import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Brain, Zap, Shield, BarChart3 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', businessName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) {
      setError('הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }
    setLoading(true);
    try {
      const { error: err } = await signUp(
        form.email,
        form.password,
        form.fullName,
        form.businessName
      );
      if (err) throw err;
      navigate('/app/Dashboard');
    } catch (err) {
      setError(err.message || 'שגיאה ביצירת החשבון. נסה שנית.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Zap, title: 'אוטומציה חכמה', desc: 'תהליכים עסקיים בלי כאב ראש' },
    { icon: Shield, title: 'נתונים מאובטחים', desc: 'גישה לפי חברה (Workspace)' },
    { icon: BarChart3, title: 'תמונה ברורה', desc: 'KPI ופעילות בזמן אמת' },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50" dir="rtl">
      {/* Hero - desktop */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden">
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

        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-indigo-200/50 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-purple-200/50 rounded-full blur-[100px]" />
        <div className="absolute top-2/3 right-1/3 w-64 h-64 bg-sky-200/40 rounded-full blur-[80px]" />

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 py-16">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
              <Brain className="text-white w-7 h-7" aria-hidden />
            </div>
            <span className="text-2xl font-bold text-slate-900 tracking-tight">OpsBrain</span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-bold text-slate-900 leading-tight mb-6 text-balance">
            בונים SaaS אמיתי
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-indigo-500 to-purple-600">
              לעסק שלך
            </span>
          </h1>
          <p className="text-lg text-slate-600 mb-10 max-w-lg leading-relaxed">
            הרשמה מהירה, בחירת חברה, וניהול משימות/מסמכים/כספים במקום אחד.
          </p>

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
        </div>

        <div className="absolute left-0 inset-y-0 w-32 bg-gradient-to-r from-transparent to-slate-50" />
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-8 lg:hidden">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
              <Brain className="text-white w-8 h-8" aria-hidden />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 text-center">יצירת חשבון OpsBrain</h1>
            <p className="text-slate-600 text-sm mt-2 text-center">דקה ואתה בפנים</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-8 sm:p-10">
            <div className="hidden lg:block mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">הרשמה</h2>
              <p className="text-slate-600 text-sm">פתח חשבון וצור חברה ראשונה</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {[
                { label: 'שם מלא', field: 'fullName', type: 'text', placeholder: 'ישראל ישראלי', ac: 'name' },
                { label: 'אימייל', field: 'email', type: 'email', placeholder: 'you@company.com', ac: 'email' },
                { label: 'סיסמה', field: 'password', type: 'password', placeholder: '••••••••', ac: 'new-password' },
                { label: 'שם העסק', field: 'businessName', type: 'text', placeholder: 'העסק שלי בע\"מ', ac: 'organization' },
              ].map(({ label, field, type, placeholder, ac }) => (
                <div key={field}>
                  <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
                  <input
                    type={type}
                    value={form[field]}
                    onChange={set(field)}
                    required
                    autoComplete={ac}
                    placeholder={placeholder}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 hover:border-slate-300"
                  />
                </div>
              ))}

              {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'יוצר חשבון...' : 'יצירת חשבון'}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-600">
              יש לך חשבון?{' '}
              <Link to="/Login" className="font-semibold text-indigo-700 transition-colors duration-200 hover:text-indigo-800">
                התחבר
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
