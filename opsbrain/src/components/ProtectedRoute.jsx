import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { FullPageLoader } from '@/components/Spinner';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <FullPageLoader />;
  }

  if (!user) {
    return <Navigate to="/Login" replace />;
  }

  return children;
}
