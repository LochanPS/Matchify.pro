import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PlayerDashboard from './PlayerDashboard';
import OrganizerDashboard from './OrganizerDashboard';
import UmpireDashboard from './UmpireDashboard';

const UnifiedDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get user roles from the comma-separated string
  // Handle both string format "PLAYER,ORGANIZER,UMPIRE" and array format
  let userRoles = [];
  if (typeof user?.roles === 'string') {
    userRoles = user.roles.split(',').map(r => r.trim());
  } else if (Array.isArray(user?.roles)) {
    userRoles = user.roles;
  } else if (user?.role) {
    // Fallback to single role if roles field doesn't exist
    userRoles = [user.role];
  }
  
  // CRITICAL: Admin users should NEVER see this dashboard
  // Redirect them to admin dashboard immediately
  const isAdmin = userRoles.includes('ADMIN') || user?.isAdmin;
  if (isAdmin) {
    console.log('🚫 Admin user redirected from unified dashboard to admin dashboard');
    navigate('/admin-dashboard', { replace: true });
    return null;
  }
  
  // Default to PLAYER if no roles found
  if (userRoles.length === 0) {
    userRoles = ['PLAYER'];
  }
  
  // Get active role from URL or default to first role
  const roleFromUrl = searchParams.get('role');
  const [activeRole, setActiveRole] = useState(
    roleFromUrl && userRoles.includes(roleFromUrl) ? roleFromUrl : userRoles[0] || 'PLAYER'
  );

  // Update URL when role changes
  useEffect(() => {
    if (activeRole && userRoles.includes(activeRole)) {
      setSearchParams({ role: activeRole });
    }
  }, [activeRole]);

  // Sync with URL changes
  useEffect(() => {
    if (roleFromUrl && userRoles.includes(roleFromUrl) && roleFromUrl !== activeRole) {
      setActiveRole(roleFromUrl);
    }
  }, [roleFromUrl]);

  const handleRoleSwitch = (role) => {
    setActiveRole(role);
  };

  // Role configuration
  const roleConfig = {
    PLAYER: {
      name: 'Player',
      icon: '🏸',
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-500/30',
      textColor: 'text-green-400',
      component: PlayerDashboard
    },
    ORGANIZER: {
      name: 'Organizer',
      icon: '🏆',
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-500/20',
      borderColor: 'border-emerald-500/30',
      textColor: 'text-emerald-400',
      component: OrganizerDashboard
    },
    UMPIRE: {
      name: 'Umpire',
      icon: '⚖️',
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-500/20',
      borderColor: 'border-emerald-500/30',
      textColor: 'text-emerald-400',
      component: UmpireDashboard
    }
  };

  const ActiveComponent = roleConfig[activeRole]?.component || PlayerDashboard;

  return (
    <div className="min-h-screen" style={{ background:'#07071a' }}>
      {/* Role Switcher - Fixed at top */}
      {userRoles.length > 1 && (
        <div className="sticky top-0 z-40 backdrop-blur-sm border-b" style={{ background:'rgba(7,7,26,0.95)', borderColor:'rgba(0,255,136,0.1)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-gray-400 text-sm font-medium">YOUR ROLES:</span>
                <div className="flex flex-wrap gap-2">
                  {userRoles.map((role) => {
                    const config = roleConfig[role];
                    if (!config) return null;
                    
                    const isActive = role === activeRole;
                    
                    return (
                      <button
                        key={role}
                        onClick={() => handleRoleSwitch(role)}
                        className={`
                          flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all
                          ${isActive 
                            ? `bg-gradient-to-r ${config.color} text-white shadow-lg scale-105` 
                            : `${config.bgColor} ${config.textColor} border ${config.borderColor} hover:scale-105`
                          }
                        `}
                      >
                        <span className="text-lg">{config.icon}</span>
                        <span className="text-sm">{config.name}</span>
                        {isActive && (
                          <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Active Role Indicator */}
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-xl border border-white/10">
                <span className="text-gray-400 text-xs">Active:</span>
                <span className={`text-sm font-bold ${roleConfig[activeRole]?.textColor}`}>
                  {roleConfig[activeRole]?.name}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Single Role Display */}
      {userRoles.length === 1 && (
        <div className="backdrop-blur-sm border-b" style={{ background:'rgba(7,7,26,0.95)', borderColor:'rgba(0,255,136,0.1)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm font-medium">YOUR ROLE:</span>
              <div className={`
                flex items-center gap-2 px-4 py-2 rounded-xl font-medium
                bg-gradient-to-r ${roleConfig[activeRole]?.color} text-white
              `}>
                <span className="text-lg">{roleConfig[activeRole]?.icon}</span>
                <span className="text-sm">{roleConfig[activeRole]?.name}</span>
                <span className="w-2 h-2 bg-white rounded-full"></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Content */}
      <div className="dashboard-content">
        <ActiveComponent />
      </div>
    </div>
  );
};

export default UnifiedDashboard;
