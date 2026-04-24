import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { opsbrain } from '@/api/client';
import { useAuth } from '@/lib/AuthContext';
import { FullPageLoader } from '@/components/Spinner';
import { toast } from 'sonner';

function decodeState(raw) {
  if (!raw) return null;
  try {
    const json = atob(raw.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function GoogleIntegrationCallback() {
  const location = useLocation();
  const navigate = useNavigate();
  const { workspaceId } = useAuth();
  const [error, setError] = useState(null);

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const code = params.get('code');
  const stateRaw = params.get('state');
  const state = useMemo(() => decodeState(stateRaw), [stateRaw]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!code) {
        setError(new Error('Missing OAuth code'));
        return;
      }
      const resolvedWorkspaceId = state?.workspace_id || workspaceId;
      const product = state?.product;
      try {
        await opsbrain.functions.invoke('googleOAuthExchange', {
          workspace_id: resolvedWorkspaceId,
          product,
          code,
          state: stateRaw,
          redirect_uri: `${window.location.origin}/auth/integrations/google/callback`,
        });
        if (cancelled) return;
        toast.success('החיבור ל-Google הושלם');
        navigate('/app/Integrations', { replace: true });
      } catch (e) {
        console.error('[GoogleIntegrationCallback] exchange', e);
        if (cancelled) return;
        setError(e);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [code, navigate, state?.product, state?.workspace_id, stateRaw, workspaceId]);

  if (!error) return <FullPageLoader />;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6" dir="rtl">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-sm font-semibold text-indigo-600">OPSBRAIN</div>
        <h1 className="mt-2 text-xl font-bold text-slate-900">החיבור נכשל</h1>
        <p className="mt-2 text-sm text-slate-600">
          לא הצלחנו להשלים את החיבור. ודא ש־Supabase Edge Functions הותקנו ושהגדרות Google OAuth תקינות.
        </p>
        <pre className="mt-4 text-xs bg-slate-50 border border-slate-200 rounded-lg p-3 overflow-auto text-slate-900">
          {String(error?.message || error)}
        </pre>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={() => navigate('/app/Integrations')}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
          >
            חזרה לאינטגרציות
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg bg-white text-slate-900 font-semibold border border-slate-200 hover:bg-slate-50"
          >
            נסה שוב
          </button>
        </div>
      </div>
    </div>
  );
}

