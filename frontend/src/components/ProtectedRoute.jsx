import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingScreen from './LoadingScreen';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen message="Authenticating..." />;
  }

  if (!user) {
    // Preserve destination so login page redirects back after auth
    const redirectTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirectTo}`} replace />;
  }

  return children;
};

export default ProtectedRoute;
