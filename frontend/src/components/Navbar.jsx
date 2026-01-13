import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from './NotificationBell';
import api from '../utils/api';
import { 
  ChevronDown, 
  Plus, 
  User, 
  Wallet, 
  Coins,
  LogOut, 
  Menu, 
  X,
  Trophy,
  LayoutDashboard,
  UserPlus
} from 'lucide-react';

const Navbar = () => {
  const { user, logout, switchRole, updateUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [addingRole, setAddingRole] = useState(false);
  const [addRoleError, setAddRoleError] = useState('');
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
    let roles = [];
    if (user.roles && Array.isArray(user.roles)) roles = user.roles;
    else if (typeof user.roles === 'string') roles = user.roles.split(',').map(r => r.trim());
    else if (user.role) roles = [user.role];
    
    // Normalize role names to uppercase
    roles = roles.map(r => r.toUpperCase());
    
    // Ensure PLAYER is always there as base role
    if (!roles.includes('PLAYER')) roles.unshift('PLAYER');
    return roles;
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
      default: navigate('/dashboard'); break;
    }
  };

  const handleAddRole = async (role) => {
    setAddingRole(true);
    setAddRoleError('');
    try {
      const response = await api.post('/multi-auth/add-role', { role });
      if (response.data.user) {
        // The backend already sets currentRole to the new role
        // Update user with the complete response including new roles
        updateUser(response.data.user);
        setShowAddRoleModal(false);
        setAddRoleError('');
        setShowRoleMenu(false);
        
        // Navigate to appropriate dashboard for the new role
        switch (role) {
          case 'PLAYER': navigate('/dashboard'); break;
          case 'ORGANIZER': navigate('/organizer/dashboard'); break;
          case 'UMPIRE': navigate('/umpire/dashboard'); break;
          case 'ADMIN': navigate('/admin/dashboard'); break;
        }
      }
    } catch (error) {
      console.error('Error adding role:', error);
      setAddRoleError(error.response?.data?.error || 'Failed to add role. Please try again.');
    } finally {
      setAddingRole(false);
    }
  };

  const getAllRoles = () => ['PLAYER', 'ORGANIZER', 'UMPIRE'];
  
  const getMissingRoles = () => {
    const currentRoles = getAvailableRoles();
    return getAllRoles().filter(role => !currentRoles.includes(role));
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'PLAYER': return { bg: 'bg-blue-500/20', text: 'text-blue-400', hover: 'hover:bg-blue-500/30', dot: 'bg-blue-500' };
      case 'ORGANIZER': return { bg: 'bg-green-500/20', text: 'text-green-400', hover: 'hover:bg-green-500/30', dot: 'bg-green-500' };
      case 'UMPIRE': return { bg: 'bg-orange-500/20', text: 'text-orange-400', hover: 'hover:bg-orange-500/30', dot: 'bg-orange-500' };
      case 'ADMIN': return { bg: 'bg-red-500/20', text: 'text-red-400', hover: 'hover:bg-red-500/30', dot: 'bg-red-500' };
      default: return { bg: 'bg-gray-500/20', text: 'text-gray-400', hover: 'hover:bg-gray-500/30', dot: 'bg-gray-500' };
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
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-lg border-b border-white/10 shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-8">
            {/* Logo */}
            <Link to="/" className="flex items-center justify-center group">
              <div className="relative flex items-center gap-2">
                {/* Glow effect behind logo */}
                <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-14 h-14 bg-green-500/50 blur-xl rounded-full opacity-80 group-hover:opacity-100 transition-all duration-300"></div>
                
                {/* SVG Shield Logo */}
                <div className="relative h-11 w-12 flex-shrink-0 group-hover:scale-110 transition-all duration-300">
                  <svg viewBox="0 0 120 140" className="w-full h-full drop-shadow-[0_0_12px_rgba(34,197,94,0.8)]">
                    {/* Shield */}
                    <defs>
                      <linearGradient id="shieldFill" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#22c55e" />
                        <stop offset="50%" stopColor="#16a34a" />
                        <stop offset="100%" stopColor="#15803d" />
                      </linearGradient>
                    </defs>
                    <path d="M60 8 L110 25 L110 70 Q110 115 60 132 Q10 115 10 70 L10 25 Z" fill="url(#shieldFill)" stroke="#4ade80" strokeWidth="3"/>
                    {/* M Letter */}
                    <text x="60" y="85" textAnchor="middle" fill="#166534" fontSize="55" fontWeight="900" fontFamily="Arial Black, sans-serif">M</text>
                    {/* Badminton Racket */}
                    <ellipse cx="105" cy="18" rx="12" ry="16" fill="#3b82f6" stroke="#60a5fa" strokeWidth="1.5" transform="rotate(45, 105, 18)"/>
                    <line x1="105" y1="28" x2="115" y2="45" stroke="#6366f1" strokeWidth="3" strokeLinecap="round"/>
                    {/* Racket strings */}
                    <line x1="98" y1="12" x2="112" y2="24" stroke="#93c5fd" strokeWidth="0.8"/>
                    <line x1="100" y1="8" x2="110" y2="28" stroke="#93c5fd" strokeWidth="0.8"/>
                    <line x1="96" y1="18" x2="114" y2="18" stroke="#93c5fd" strokeWidth="0.8"/>
                    {/* Shuttlecock */}
                    <ellipse cx="118" cy="48" rx="4" ry="3" fill="#ec4899"/>
                    <path d="M118 45 L115 38 M118 45 L118 36 M118 45 L121 38" stroke="#f9a8d4" strokeWidth="1.5" fill="none"/>
                  </svg>
                </div>
                
                {/* Text */}
                <div className="relative flex items-baseline">
                  <span className="text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-green-300 via-green-400 to-green-500 drop-shadow-[0_0_10px_rgba(34,197,94,0.6)]">
                    MATCHIFY
                  </span>
                  <span className="text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.6)]">
                    .PRO
                  </span>
                </div>
              </div>
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
                {/* Role Switcher - Always show, allow adding roles */}
                <div className="relative hidden sm:block" ref={roleMenuRef}>
                  <button
                    onClick={() => setShowRoleMenu(!showRoleMenu)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl ${roleColors.bg} ${roleColors.text} text-sm font-semibold ${roleColors.hover} transition-all border border-white/10`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${roleColors.dot} animate-pulse`}></span>
                    {currentRole}
                    <ChevronDown className={`w-4 h-4 transition-transform ${showRoleMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {showRoleMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-white/10 rounded-2xl shadow-2xl shadow-black/50 py-2 z-50 overflow-hidden">
                      <div className="px-4 py-2 text-xs text-gray-400 font-semibold uppercase tracking-wider">Your Roles</div>
                      {availableRoles.map((role) => {
                        const colors = getRoleColor(role);
                        return (
                          <button
                            key={role}
                            onClick={() => handleRoleSwitch(role)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/5 transition-colors ${
                              role === currentRole ? 'bg-white/5' : ''
                            }`}
                          >
                            <span className={`w-3 h-3 rounded-full ${colors.dot}`}></span>
                            <span className={`font-medium ${colors.text}`}>{role}</span>
                            {role === currentRole && (
                              <span className="ml-auto text-xs bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2.5 py-1 rounded-full font-semibold">Active</span>
                            )}
                          </button>
                        );
                      })}
                      
                      {/* Add Role Option */}
                      {getMissingRoles().length > 0 && (
                        <>
                          <div className="border-t border-white/10 my-2"></div>
                          <div className="px-4 py-2 text-xs text-gray-400 font-semibold uppercase tracking-wider">Add New Role</div>
                          {getMissingRoles().map((role) => {
                            const colors = getRoleColor(role);
                            return (
                              <button
                                key={role}
                                onClick={() => {
                                  setShowRoleMenu(false);
                                  setShowAddRoleModal(true);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-purple-500/20 text-purple-400 transition-colors"
                              >
                                <UserPlus className="w-4 h-4" />
                                <span className="font-medium">Become {role.charAt(0) + role.slice(1).toLowerCase()}</span>
                                <Plus className="w-4 h-4 ml-auto" />
                              </button>
                            );
                          })}
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Create Tournament Button - Only for Organizers */}
                {isOrganizer() && (
                  <Link
                    to="/tournaments/create"
                    className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 hover:scale-105 transition-all text-sm font-semibold"
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
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/10 transition-all"
                  >
                    {user.profilePhoto ? (
                      <img 
                        src={user.profilePhoto} 
                        alt={user.name} 
                        className="w-10 h-10 rounded-xl object-cover border-2 border-white/20 shadow-sm"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-purple-500/30">
                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <ChevronDown className={`w-4 h-4 text-gray-400 hidden sm:block transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-72 bg-slate-800 border border-white/10 rounded-2xl shadow-2xl shadow-black/50 py-2 z-50 overflow-hidden">
                      {/* User Info */}
                      <div className="px-4 py-4 bg-white/5 border-b border-white/10">
                        <div className="flex items-center gap-3">
                          {user.profilePhoto ? (
                            <img src={user.profilePhoto} alt={user.name} className="w-12 h-12 rounded-xl object-cover" />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                              {user.name?.charAt(0)?.toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white truncate">{user.name}</p>
                            <p className="text-sm text-gray-400 truncate">{user.email}</p>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
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
                      <div className="border-t border-white/10 pt-2 pb-1 px-2">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/20 rounded-xl transition-colors font-medium"
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
                  className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-300"
                >
                  {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </>
            ) : (
              /* Not Logged In */
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-gray-300 hover:text-white px-4 py-2 text-sm font-medium transition-colors rounded-xl hover:bg-white/10"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 hover:scale-105 transition-all text-sm font-semibold"
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
        <div className="md:hidden border-t border-white/10 bg-slate-900">
          <div className="px-4 py-3 space-y-1">
            {/* Role Switcher for Mobile */}
            <div className="pb-3 mb-3 border-b border-white/10">
              <p className="text-xs text-gray-400 mb-2">Your Roles</p>
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
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${colors.dot}`}></span>
                      {role}
                    </button>
                  );
                })}
                {/* Add Role Button for Mobile */}
                {getMissingRoles().length > 0 && (
                  <button
                    onClick={() => { setShowMobileMenu(false); setShowAddRoleModal(true); }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    Add Role
                  </button>
                )}
              </div>
            </div>

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
                className="flex items-center gap-3 px-3 py-3 mt-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-medium"
              >
                <Plus className="w-5 h-5" />
                Create Tournament
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Add Role Modal - Using Portal to render outside header */}
      {showAddRoleModal && createPortal(
        <AddRoleModal
          isOpen={showAddRoleModal}
          onClose={() => { setShowAddRoleModal(false); setAddRoleError(''); }}
          missingRoles={getMissingRoles()}
          onAddRole={handleAddRole}
          addingRole={addingRole}
          getRoleColor={getRoleColor}
          error={addRoleError}
        />,
        document.body
      )}

    </header>
  );
};

// Add Role Modal Component - Rendered outside header for proper z-index
const AddRoleModal = ({ isOpen, onClose, missingRoles, onAddRole, addingRole, getRoleColor, error }) => {
  if (!isOpen) return null;

  const roleInfo = {
    PLAYER: { icon: '🏸', desc: 'Compete in tournaments and track your progress' },
    ORGANIZER: { icon: '📋', desc: 'Create and manage badminton tournaments' },
    UMPIRE: { icon: '⚖️', desc: 'Officiate matches and manage scoring' }
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] overflow-y-auto"
      aria-labelledby="modal-title" 
      role="dialog" 
      aria-modal="true"
    >
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div 
          className="relative bg-slate-800 border border-white/10 rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Add New Role</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          
          <p className="text-gray-400 mb-6">
            Expand your Matchify experience by adding a new role to your account.
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
              <p className="text-sm text-red-400 font-medium">{error}</p>
            </div>
          )}

          {/* Role Options */}
          <div className="space-y-3">
            {missingRoles.map((role) => {
              const colors = getRoleColor(role);
              return (
                <button
                  key={role}
                  onClick={() => onAddRole(role)}
                  disabled={addingRole}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className={`w-14 h-14 ${colors.bg} rounded-xl flex items-center justify-center text-2xl shadow-sm`}>
                    {roleInfo[role]?.icon}
                  </div>
                  <div className="flex-1">
                    <p className={`font-bold ${colors.text}`}>{role}</p>
                    <p className="text-sm text-gray-400">{roleInfo[role]?.desc}</p>
                  </div>
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                    <Plus className="w-5 h-5 text-gray-400" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Loading State */}
          {addingRole && (
            <div className="mt-6 flex items-center justify-center gap-3 py-3 bg-emerald-500/20 rounded-xl">
              <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-emerald-400 font-medium">Adding role...</span>
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <p className="text-xs text-gray-500 text-center">
              You can switch between roles anytime from the role badge in the navbar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Wrapper component that includes the modal
const NavbarWithModal = () => {
  return <Navbar />;
};

// NavLink Component
const NavLink = ({ to, children, active }) => (
  <Link
    to={to}
    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
      active 
        ? 'text-emerald-400 bg-emerald-500/20 shadow-sm' 
        : 'text-gray-300 hover:text-white hover:bg-white/10'
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
    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/10 transition-colors mx-2 rounded-xl"
  >
    <span className="text-gray-400">{icon}</span>
    {children}
  </Link>
);

// Mobile Nav Link Component
const MobileNavLink = ({ to, children, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className="flex items-center gap-3 px-4 py-3.5 text-gray-300 hover:bg-white/10 rounded-xl transition-colors font-medium"
  >
    {children}
  </Link>
);

export default Navbar;
