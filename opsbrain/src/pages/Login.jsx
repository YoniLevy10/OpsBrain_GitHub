import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Brain } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await signIn(email, password);
    setLoading(false);
    if (err) {
      setError('אימייל או סיסמה שגויים. אנא נסה שנית.');
    } else {
      navigate('/Dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md bg-[#1A1A2E] rounded-2xl shadow-2xl p-8">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-[#6C63FF] rounded-2xl flex items-center justify-center mb-3 shadow-lg">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[#6C63FF]">OpsBrain</h1>
          <p className="text-gray-400 text-sm mt-1">מערכת הפעלה עסקית</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">אימייל</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
              className="w-full bg-[#0F0F1E] border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#6C63FF] transition-colors placeholder-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">סיסמה</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full bg-[#0F0F1E] border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#6C63FF] transition-colors placeholder-gray-600"
            />
          </div>

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
            {loading ? 'מתחבר...' : 'כניסה למערכת'}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          אין לך חשבון?{' '}
          <Link to="/Register" className="text-[#6C63FF] hover:text-[#5a52e0] font-medium transition-colors">
            הירשם עכשיו
          </Link>
        </p>
      </div>
    </div>
  );
}
