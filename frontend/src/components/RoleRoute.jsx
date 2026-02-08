import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const RoleRoute = ({ children, allowedRoles, blockAdmin = false }) => {
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

  // Get user roles - support array, comma-separated string, and single role formats
  const getUserRoles = () => {
    if (Array.isArray(user.roles)) {
      return user.roles.map(r => r.toUpperCase());
    }
    if (typeof user.roles === 'string' && user.roles.includes(',')) {
      return user.roles.split(',').map(r => r.trim().toUpperCase());
    }
    if (typeof user.roles === 'string') {
      return [user.roles.toUpperCase()];
    }
    if (user.role) {
      return [user.role.toUpperCase()];
    }
    // Default: if user exists but has no roles, assume they have all roles
    return ['PLAYER', 'ORGANIZER', 'UMPIRE'];
  };
  
  const userRoles = getUserRoles();
  
  // Also check currentRole if set
  const currentRole = user.currentRole ? user.currentRole.toUpperCase() : null;
  
  console.log('🔍 RoleRoute Debug:', {
    userRoles,
    currentRole,
    allowedRoles,
    userObject: user
  });

  // Check if admin is impersonating
  const isImpersonating = () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return !!payload.isImpersonating;
      }
    } catch (error) {
      return false;
    }
    return false;
  };

  // Block admins from accessing non-admin features (UNLESS they are impersonating)
  if (blockAdmin && userRoles.includes('ADMIN') && !isImpersonating()) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-2xl mx-auto p-8">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-3xl font-bold text-warning-600 mb-4">Admin Access Restricted</h1>
          <p className="text-gray-700 mb-4 text-lg">
            Admins cannot access player, organizer, or umpire features.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 text-left">
            <h2 className="font-semibold text-blue-900 mb-3">Why this restriction?</h2>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• Admins have platform-wide oversight and moderation powers</li>
              <li>• Participating in tournaments could create conflicts of interest</li>
              <li>• Separate accounts ensure fair play and transparency</li>
            </ul>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6 text-left">
            <h2 className="font-semibold text-gray-900 mb-3">What you can do:</h2>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>✓ Create a separate player account to participate in tournaments</li>
              <li>✓ Create a separate organizer account to host tournaments</li>
              <li>✓ Use your admin account only for platform management</li>
            </ul>
          </div>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => window.location.href = '/admin/dashboard'}
              className="btn-primary"
            >
              Go to Admin Dashboard
            </button>
            <button
              onClick={() => window.history.back()}
              className="btn-secondary"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check if user has ANY of the allowed roles
  // PLAYER role now includes ORGANIZER capabilities
  const hasAllowedRole = allowedRoles.some(role => {
    const roleUpper = role.toUpperCase();
    
    // If currentRole is set, check if it matches
    if (currentRole && currentRole === roleUpper) {
      return true;
    }
    
    if (roleUpper === 'ORGANIZER') {
      // PLAYER can access ORGANIZER routes
      return userRoles.includes('PLAYER') || userRoles.includes('ORGANIZER');
    }
    return userRoles.includes(roleUpper);
  });

  if (!hasAllowedRole) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-3xl font-bold text-error-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this page.
          </p>
          <div className="space-y-2 text-sm text-gray-500">
            <p>Required roles: {allowedRoles.join(', ')}</p>
            <p>Your roles: {userRoles.join(', ') || 'None'}</p>
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