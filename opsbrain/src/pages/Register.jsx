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
    <div className="min-h-screen flex bg-gradient-to-br from-[#0B0B14] via-[#0F0F1A] to-[#141437]" dir="rtl">
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

        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#6B46C1]/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-[#4C1D95]/30 rounded-full blur-[100px]" />
        <div className="absolute top-2/3 right-1/3 w-64 h-64 bg-[#7C3AED]/15 rounded-full blur-[80px]" />

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 py-16">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-14 h-14 bg-gradient-to-br from-[#1E1E35] to-[#0F0F1A] rounded-2xl flex items-center justify-center ring-1 ring-white/10 shadow-xl">
              <Brain className="text-[#A78BFA] w-7 h-7" aria-hidden />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">OpsBrain</span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6 text-balance">
            בונים SaaS אמיתי
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-[#A78BFA] to-[#6B46C1]">
              לעסק שלך
            </span>
          </h1>
          <p className="text-lg text-[#A0A0C0] mb-10 max-w-lg leading-relaxed">
            הרשמה מהירה, בחירת חברה, וניהול משימות/מסמכים/כספים במקום אחד.
          </p>

          <div className="space-y-4">
            {features.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm transition-all duration-300 hover:bg-white/[0.05] hover:border-[#6B46C1]/30 group"
              >
                <div className="w-12 h-12 rounded-xl bg-[#6B46C1]/10 flex items-center justify-center ring-1 ring-[#6B46C1]/20 group-hover:ring-[#6B46C1]/40 transition-all">
                  <f.icon className="w-5 h-5 text-[#A78BFA]" aria-hidden />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">{f.title}</h3>
                  <p className="text-[#6B6B8A] text-sm">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute left-0 inset-y-0 w-32 bg-gradient-to-r from-transparent to-[#0B0B14]/80" />
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-8 lg:hidden">
            <div className="w-16 h-16 bg-gradient-to-br from-[#1E1E35] to-[#0F0F1A] rounded-2xl flex items-center justify-center mb-4 ring-1 ring-white/10 shadow-xl">
              <Brain className="text-[#A78BFA] w-8 h-8" aria-hidden />
            </div>
            <h1 className="text-2xl font-bold text-white text-center">יצירת חשבון OpsBrain</h1>
            <p className="text-[#A0A0C0] text-sm mt-2 text-center">דקה ואתה בפנים</p>
          </div>

          <div className="rounded-3xl border border-[#2A2A45]/80 bg-[#1E1E35]/90 shadow-2xl backdrop-blur-xl p-8 sm:p-10">
            <div className="hidden lg:block mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">הרשמה</h2>
              <p className="text-[#A0A0C0] text-sm">פתח חשבון וצור חברה ראשונה</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {[
                { label: 'שם מלא', field: 'fullName', type: 'text', placeholder: 'ישראל ישראלי', ac: 'name' },
                { label: 'אימייל', field: 'email', type: 'email', placeholder: 'you@company.com', ac: 'email' },
                { label: 'סיסמה', field: 'password', type: 'password', placeholder: '••••••••', ac: 'new-password' },
                { label: 'שם העסק', field: 'businessName', type: 'text', placeholder: 'העסק שלי בע\"מ', ac: 'organization' },
              ].map(({ label, field, type, placeholder, ac }) => (
                <div key={field}>
                  <label className="mb-2 block text-sm font-medium text-[#C4C4E0]">{label}</label>
                  <input
                    type={type}
                    value={form[field]}
                    onChange={set(field)}
                    required
                    autoComplete={ac}
                    placeholder={placeholder}
                    className="w-full rounded-xl border border-[#2A2A45] bg-[#0F0F1A] px-4 py-3.5 text-sm text-white placeholder:text-[#6B6B8A] transition-all duration-200 focus:border-[#6B46C1] focus:outline-none focus:ring-2 focus:ring-[#6B46C1]/30 hover:border-[#3A3A55]"
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
                className="w-full rounded-xl bg-gradient-to-l from-[#6B46C1] to-[#7C3AED] py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#6B46C1]/25 transition-all duration-200 hover:from-[#5a3aad] hover:to-[#6B46C1] hover:shadow-[#6B46C1]/40 focus:outline-none focus:ring-2 focus:ring-[#6B46C1] focus:ring-offset-2 focus:ring-offset-[#1E1E35] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'יוצר חשבון...' : 'יצירת חשבון'}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-[#6B6B8A]">
              יש לך חשבון?{' '}
              <Link to="/Login" className="font-semibold text-[#A78BFA] transition-colors duration-200 hover:text-white">
                התחבר
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
