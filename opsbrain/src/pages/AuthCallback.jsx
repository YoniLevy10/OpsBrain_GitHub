// @ts-nocheck
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { FullPageLoader } from '@/components/Spinner';

/**
 * נקודת נחיתה אחרי OAuth (Google וכו').
 * מחוץ ל-ProtectedRoute כדי שלא ירוץ מרוץ בין טעינת ה-hash לבין בדיקת user.
 */
export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const resolve = async () => {
      const trySession = async () => {
        const { data } = await supabase.auth.getSession();
        return data?.session ?? null;
      };

      let session = await trySession();
      if (!session) {
        await new Promise((r) => setTimeout(r, 200));
        if (!cancelled) session = await trySession();
      }
      if (cancelled) return;
      navigate(session?.user ? '/app/Dashboard' : '/Login', { replace: true });
    };

    void resolve();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return <FullPageLoader />;
}
