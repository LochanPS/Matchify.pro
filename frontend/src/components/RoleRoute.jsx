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
    // This handles legacy sessions
    console.warn('⚠️ User has no roles field, using default roles');
    return ['PLAYER', 'ORGANIZER', 'UMPIRE'];
  };
  
  const userRoles = getUserRoles();
  const isAdmin = userRoles.includes('ADMIN') || user.isAdmin;
  
  // CRITICAL: Admin users should ONLY access admin routes
  // If admin tries to access non-admin routes, redirect to admin dashboard
  if (isAdmin && !allowedRoles.includes('ADMIN')) {
    console.log('🚫 Admin user blocked from accessing non-admin route');
    return <Navigate to="/admin-dashboard" replace />;
  }
  
  // Also check currentRole if set
  const currentRole = user.currentRole ? user.currentRole.toUpperCase() : null;
  
  // Debug logging (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 RoleRoute Debug:', {
      userRoles,
      currentRole,
      allowedRoles,
      isAdmin,
      hasRolesField: !!user.roles,
      hasRoleField: !!user.role
    });
  }

  // Check if user has ANY of the allowed roles
  const hasAllowedRole = allowedRoles.some(role => {
    const roleUpper = role.toUpperCase();
    
    // ADMIN can ONLY access ADMIN routes
    if (roleUpper === 'ADMIN') {
      return isAdmin;
    }
    
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