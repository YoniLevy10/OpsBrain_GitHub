import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Brain } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';

export default function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', businessName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const slugify = (str) =>
    str.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) {
      setError('הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }
    setLoading(true);
    try {
      const { data, error: signUpErr } = await signUp(form.email, form.password, {
        data: { full_name: form.fullName }
      });

      if (signUpErr) throw signUpErr;

      const userId = data.user?.id;
      if (!userId) throw new Error('לא ניתן ליצור משתמש');

      // Create workspace
      const { data: workspace, error: wsErr } = await supabase
        .from('workspaces')
        .insert({ name: form.businessName, slug: slugify(form.businessName), owner_id: userId })
        .select()
        .single();

      if (wsErr) throw wsErr;

      // Create workspace member
      await supabase.from('workspace_members').insert({
        workspace_id: workspace.id,
        user_id: userId,
        role: 'owner'
      });

      await supabase.from('profiles').upsert({
        id: userId,
        full_name: form.fullName,
      });

      navigate('/Dashboard');
    } catch (err) {
      setError(err.message || 'שגיאה ביצירת החשבון. נסה שנית.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md bg-[#1A1A2E] rounded-2xl shadow-2xl p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-[#6C63FF] rounded-2xl flex items-center justify-center mb-3 shadow-lg">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[#6C63FF]">OpsBrain</h1>
          <p className="text-gray-400 text-sm mt-1">יצירת חשבון חדש</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: 'שם מלא', field: 'fullName', type: 'text', placeholder: 'ישראל ישראלי' },
            { label: 'אימייל', field: 'email', type: 'email', placeholder: 'your@email.com' },
            { label: 'סיסמה', field: 'password', type: 'password', placeholder: '••••••••' },
            { label: 'שם העסק', field: 'businessName', type: 'text', placeholder: 'העסק שלי בע"מ' },
          ].map(({ label, field, type, placeholder }) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
              <input
                type={type}
                value={form[field]}
                onChange={set(field)}
                required
                placeholder={placeholder}
                className="w-full bg-[#0F0F1E] border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#6C63FF] transition-colors placeholder-gray-600"
              />
            </div>
          ))}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#6C63FF] hover:bg-[#5a52e0] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {loading ? 'יוצר חשבון...' : 'יצירת חשבון'}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          יש לך חשבון?{' '}
          <Link to="/Login" className="text-[#6C63FF] hover:text-[#5a52e0] font-medium transition-colors">
            התחבר
          </Link>
        </p>
      </div>
    </div>
  );
}
