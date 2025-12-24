import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const RoleRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

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
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-3xl font-bold text-error-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this page. Your role ({user.role}) is not authorized for this content.
          </p>
          <div className="space-y-2 text-sm text-gray-500">
            <p>Required roles: {allowedRoles.join(', ')}</p>
            <p>Your role: {user.role}</p>
          </div>
          <button
            onClick={() => window.history.back()}
            className="mt-6 btn-secondary"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default RoleRoute;