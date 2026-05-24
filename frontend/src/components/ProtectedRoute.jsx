import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#07071a' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 mx-auto mb-3"
            style={{ borderColor: '#22d3ee' }} />
          <div className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Loading…</div>
        </div>
      </div>
    );
  }

  if (!user) {
    // Preserve destination so login page redirects back after auth
    const redirectTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirectTo}`} replace />;
  }

  return children;
};

export default ProtectedRoute;
