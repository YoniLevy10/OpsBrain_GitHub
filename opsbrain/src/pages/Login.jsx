import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';

function BrainIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M9 21c-2.2 0-4-1.8-4-4v-1.2c-1.2-.7-2-2-2-3.4 0-1.2.5-2.3 1.3-3C4.1 8.1 4.6 7 5.6 6.3 6.2 4.4 7.9 3 10 3c1.3 0 2.5.6 3.3 1.5C14.1 3.6 15.3 3 16.6 3c2.1 0 3.8 1.4 4.4 3.3 1 .7 1.5 1.8 1.3 3.1.8.7 1.3 1.8 1.3 3 0 1.4-.8 2.7-2 3.4V17c0 2.2-1.8 4-4 4H9Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M12 5.2V19.2M8.2 9.2h1.3M8.2 13h1.3M14.5 9.2h1.3M14.5 13h1.3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Login() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (user) navigate('/Dashboard', { replace: true });
  }, [user, loading, navigate]);

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0B0B14] via-[#0F0F1A] to-[#141437] p-4"
      dir="rtl"
    >
      <div className="w-full max-w-md rounded-2xl border border-[#2A2A45] bg-[#1E1E35] shadow-2xl p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mb-4 ring-1 ring-white/10">
            <BrainIcon className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white text-center">ברוכים הבאים ל-OpsBrain</h1>
          <p className="text-[#A0A0C0] mt-1 text-sm">התחבר כדי להמשיך</p>
        </div>

        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          theme="dark"
          view="sign_in"
          providers={['google']}
          redirectTo={`${window.location.origin}/Dashboard`}
          localization={{
            variables: {
              sign_in: {
                email_label: 'אימייל',
                password_label: 'סיסמה',
                button_label: 'כניסה',
                link_text: 'יש לי חשבון, כניסה',
              },
              sign_up: {
                email_label: 'אימייל',
                password_label: 'סיסמה',
                button_label: 'הרשמה',
                link_text: 'אין לי חשבון? הרשמה',
              },
              forgotten_password: { link_text: 'שכחתי סיסמה' },
            },
          }}
        />

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
