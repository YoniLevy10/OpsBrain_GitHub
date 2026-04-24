import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { FullPageLoader } from '@/components/Spinner';
import { WorkspaceProvider } from '@/components/workspace/WorkspaceContext';

export default function ProtectedRoute({ children }) {
  const { user, loading, authError, retryAuth } = useAuth();

  if (loading) {
    return <FullPageLoader />;
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-semibold text-indigo-600">OPSBRAIN</div>
          <h1 className="mt-2 text-xl font-bold text-slate-900">בעיה בחיבור</h1>
          <p className="mt-2 text-sm text-slate-600">
            {authError?.message || 'לא הצלחנו לאתחל התחברות. בדוק Supabase (env / migrations / RLS) ונסה שוב.'}
          </p>
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={() => retryAuth?.()}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
            >
              נסה שוב
            </button>
            <a
              href="/Login"
              className="px-4 py-2 rounded-lg bg-white text-slate-900 font-semibold border border-slate-200 hover:bg-slate-50"
            >
              למסך התחברות
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/Login" replace />;
  }

  return <WorkspaceProvider>{children}</WorkspaceProvider>;
}
