import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('🔒 ProtectedRoute Check:', {
      user: user ? 'exists' : 'null',
      loading,
      hasToken: !!localStorage.getItem('token'),
      hasStoredUser: !!localStorage.getItem('user')
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    console.error('❌ ProtectedRoute: No user found, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;