import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from './NotificationBell';
import { 
  ChevronDown, 
  Plus, 
  User, 
  Wallet, 
  Coins,
  Settings, 
  LogOut, 
  Menu, 
  X,
  Trophy,
  LayoutDashboard
} from 'lucide-react';

const Navbar = () => {
  const { user, logout, switchRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const userMenuRef = useRef(null);
  const roleMenuRef = useRef(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (roleMenuRef.current && !roleMenuRef.current.contains(event.target)) {
        setShowRoleMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setShowUserMenu(false);
  };

  const getCurrentRole = () => {
    if (!user) return null;
    return user.currentRole || user.role || (user.roles && user.roles[0]);
  };

  const getAvailableRoles = () => {
    if (!user) return [];
    if (user.roles && Array.isArray(user.roles)) return user.roles;
    if (typeof user.roles === 'string') return user.roles.split(',').map(r => r.trim());
    return user.role ? [user.role] : [];
  };

  const handleRoleSwitch = (role) => {
    if (switchRole) switchRole(role);
    setShowRoleMenu(false);
    // Navigate to appropriate dashboard
    switch (role) {
      case 'PLAYER': navigate('/dashboard'); break;
      case 'ORGANIZER': navigate('/organizer/dashboard'); break;
      case 'UMPIRE': navigate('/umpire/dashboard'); break;
      case 'ADMIN': navigate('/admin/dashboard'); break;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'PLAYER': return { bg: 'bg-blue-50', text: 'text-blue-700', hover: 'hover:bg-blue-100', dot: 'bg-blue-500' };
      case 'ORGANIZER': return { bg: 'bg-emerald-50', text: 'text-emerald-700', hover: 'hover:bg-emerald-100', dot: 'bg-emerald-500' };
      case 'UMPIRE': return { bg: 'bg-orange-50', text: 'text-orange-700', hover: 'hover:bg-orange-100', dot: 'bg-orange-500' };
      case 'ADMIN': return { bg: 'bg-red-50', text: 'text-red-700', hover: 'hover:bg-red-100', dot: 'bg-red-500' };
      default: return { bg: 'bg-gray-50', text: 'text-gray-700', hover: 'hover:bg-gray-100', dot: 'bg-gray-500' };
    }
  };

  const getDashboardLink = () => {
    const role = getCurrentRole();
    switch (role) {
      case 'PLAYER': return '/dashboard';
      case 'ORGANIZER': return '/organizer/dashboard';
      case 'UMPIRE': return '/umpire/dashboard';
      case 'ADMIN': return '/admin/dashboard';
      default: return '/';
    }
  };

  const isActiveLink = (path) => {
    if (path === '/tournaments') return location.pathname.startsWith('/tournaments');
    if (path === '/dashboard') return location.pathname.includes('dashboard');
    return location.pathname === path;
  };

  const isOrganizer = () => {
    const roles = getAvailableRoles();
    return roles.includes('ORGANIZER');
  };

  const currentRole = getCurrentRole();
  const roleColors = getRoleColor(currentRole);
  const availableRoles = getAvailableRoles();

  return (
    <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur-sm shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-8">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <span className="text-2xl">🏸</span>
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Matchify.pro
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              <NavLink to="/tournaments" active={isActiveLink('/tournaments')}>
                <Trophy className="w-4 h-4" />
                Tournaments
              </NavLink>
              {user && (
                <>
                  <NavLink to={getDashboardLink()} active={isActiveLink('/dashboard')}>
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </NavLink>
                </>
              )}
            </nav>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Role Switcher - Only show if multiple roles */}
                {availableRoles.length > 1 && (
                  <div className="relative hidden sm:block" ref={roleMenuRef}>
                    <button
                      onClick={() => setShowRoleMenu(!showRoleMenu)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${roleColors.bg} ${roleColors.text} text-sm font-medium ${roleColors.hover} transition-colors`}
                    >
                      <span className={`w-2 h-2 rounded-full ${roleColors.dot}`}></span>
                      {currentRole}
                      <ChevronDown className="w-4 h-4" />
                    </button>

                    {showRoleMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-1 z-50">
                        <div className="px-3 py-2 text-xs text-gray-500 border-b">Switch Role</div>
                        {availableRoles.map((role) => {
                          const colors = getRoleColor(role);
                          return (
                            <button
                              key={role}
                              onClick={() => handleRoleSwitch(role)}
                              className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 ${
                                role === currentRole ? 'bg-gray-50' : ''
                              }`}
                            >
                              <span className={`w-2 h-2 rounded-full ${colors.dot}`}></span>
                              <span className={colors.text}>{role}</span>
                              {role === currentRole && (
                                <span className="ml-auto text-xs text-gray-400">Active</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Single role badge */}
                {availableRoles.length === 1 && (
                  <span className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full ${roleColors.bg} ${roleColors.text} text-sm font-medium`}>
                    <span className={`w-2 h-2 rounded-full ${roleColors.dot}`}></span>
                    {currentRole}
                  </span>
                )}

                {/* Create Tournament Button - Only for Organizers */}
                {isOrganizer() && (
                  <Link
                    to="/tournaments/create"
                    className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Create
                  </Link>
                )}

                {/* Notifications */}
                <NotificationBell />

                {/* User Menu */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    {user.profilePhoto ? (
                      <img 
                        src={user.profilePhoto} 
                        alt={user.name} 
                        className="w-9 h-9 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold text-sm">
                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <ChevronDown className="w-4 h-4 text-gray-500 hidden sm:block" />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border py-1 z-50">
                      {/* User Info */}
                      <div className="px-4 py-3 border-b">
                        <p className="font-medium text-gray-900 truncate">{user.name}</p>
                        <p className="text-sm text-gray-500 truncate">{user.email}</p>
                      </div>

                      {/* Menu Items */}
                      <div className="py-1">
                        <MenuLink to="/profile" icon={<User className="w-4 h-4" />} onClick={() => setShowUserMenu(false)}>
                          My Profile
                        </MenuLink>
                        <MenuLink to="/wallet" icon={<Wallet className="w-4 h-4" />} onClick={() => setShowUserMenu(false)}>
                          My Wallet
                        </MenuLink>
                        <MenuLink to="/credits" icon={<Coins className="w-4 h-4" />} onClick={() => setShowUserMenu(false)}>
                          Matchify Credits
                        </MenuLink>
                        {currentRole === 'PLAYER' && (
                          <MenuLink to="/registrations" icon={<Trophy className="w-4 h-4" />} onClick={() => setShowUserMenu(false)}>
                            My Registrations
                          </MenuLink>
                        )}
                      </div>

                      {/* Logout */}
                      <div className="border-t py-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </>
            ) : (
              /* Not Logged In */
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {user && showMobileMenu && (
        <div className="md:hidden border-t bg-white">
          <div className="px-4 py-3 space-y-1">
            {/* Role Switcher for Mobile */}
            {availableRoles.length > 1 && (
              <div className="pb-3 mb-3 border-b">
                <p className="text-xs text-gray-500 mb-2">Switch Role</p>
                <div className="flex flex-wrap gap-2">
                  {availableRoles.map((role) => {
                    const colors = getRoleColor(role);
                    return (
                      <button
                        key={role}
                        onClick={() => { handleRoleSwitch(role); setShowMobileMenu(false); }}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          role === currentRole 
                            ? `${colors.bg} ${colors.text}` 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${colors.dot}`}></span>
                        {role}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Navigation Links */}
            <MobileNavLink to="/tournaments" onClick={() => setShowMobileMenu(false)}>
              <Trophy className="w-5 h-5" />
              Tournaments
            </MobileNavLink>
            <MobileNavLink to={getDashboardLink()} onClick={() => setShowMobileMenu(false)}>
              <LayoutDashboard className="w-5 h-5" />
              Dashboard
            </MobileNavLink>
            <MobileNavLink to="/profile" onClick={() => setShowMobileMenu(false)}>
              <User className="w-5 h-5" />
              Profile
            </MobileNavLink>
            <MobileNavLink to="/wallet" onClick={() => setShowMobileMenu(false)}>
              <Wallet className="w-5 h-5" />
              Wallet
            </MobileNavLink>
            <MobileNavLink to="/credits" onClick={() => setShowMobileMenu(false)}>
              <Coins className="w-5 h-5" />
              Matchify Credits
            </MobileNavLink>
            {currentRole === 'PLAYER' && (
              <MobileNavLink to="/registrations" onClick={() => setShowMobileMenu(false)}>
                <Trophy className="w-5 h-5" />
                My Registrations
              </MobileNavLink>
            )}

            {/* Create Tournament for Mobile */}
            {isOrganizer() && (
              <Link
                to="/tournaments/create"
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center gap-3 px-3 py-3 mt-3 bg-emerald-600 text-white rounded-lg font-medium"
              >
                <Plus className="w-5 h-5" />
                Create Tournament
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

// NavLink Component
const NavLink = ({ to, children, active }) => (
  <Link
    to={to}
    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      active 
        ? 'text-emerald-600 bg-emerald-50' 
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
    }`}
  >
    {children}
  </Link>
);

// Menu Link Component
const MenuLink = ({ to, icon, children, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
  >
    {icon}
    {children}
  </Link>
);

// Mobile Nav Link Component
const MobileNavLink = ({ to, children, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className="flex items-center gap-3 px-3 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
  >
    {children}
  </Link>
);

export default Navbar;
