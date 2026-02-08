import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from './NotificationBell';
import RoleSwitcher from './RoleSwitcher';
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
  Search,
  Award
} from 'lucide-react';

const Navbar = () => {
  const { user, logout, switchRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const userMenuRef = useRef(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
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
    
    // Check if user is admin first
    if (user.isAdmin || (user.roles && (Array.isArray(user.roles) ? user.roles.includes('ADMIN') : user.roles === 'ADMIN'))) {
      return 'ADMIN';
    }
    
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
    if (path === '/academies') return location.pathname.startsWith('/academies');
    if (path === '/leaderboard') return location.pathname === '/leaderboard';
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

  // If user is admin, use the same navbar style as regular users
  if (user?.isAdmin) {
    return (
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-lg border-b border-white/10 shadow-lg shadow-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              {/* Logo - Same as regular users */}
              <Link to="/admin/dashboard" className="flex items-center justify-center group">
                <div className="relative flex items-center gap-2">
                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-14 h-14 bg-green-500/50 blur-xl rounded-full opacity-80 group-hover:opacity-100 transition-all duration-300"></div>
                  <div className="relative h-11 w-12 flex-shrink-0 group-hover:scale-110 transition-all duration-300">
                    <svg viewBox="0 0 120 140" className="w-full h-full drop-shadow-[0_0_12px_rgba(34,197,94,0.8)]">
                      <defs>
                        <linearGradient id="shieldFillAdmin" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#22c55e" />
                          <stop offset="50%" stopColor="#16a34a" />
                          <stop offset="100%" stopColor="#15803d" />
                        </linearGradient>
                      </defs>
                      <path d="M60 8 L110 25 L110 70 Q110 115 60 132 Q10 115 10 70 L10 25 Z" fill="url(#shieldFillAdmin)" stroke="#4ade80" strokeWidth="3"/>
                      <text x="60" y="85" textAnchor="middle" fill="#166534" fontSize="55" fontWeight="900" fontFamily="Arial Black, sans-serif">M</text>
                      <ellipse cx="105" cy="18" rx="12" ry="16" fill="#3b82f6" stroke="#60a5fa" strokeWidth="1.5" transform="rotate(45, 105, 18)"/>
                      <line x1="105" y1="28" x2="115" y2="45" stroke="#6366f1" strokeWidth="3" strokeLinecap="round"/>
                      <line x1="98" y1="12" x2="112" y2="24" stroke="#93c5fd" strokeWidth="0.8"/>
                      <line x1="100" y1="8" x2="110" y2="28" stroke="#93c5fd" strokeWidth="0.8"/>
                      <line x1="96" y1="18" x2="114" y2="18" stroke="#93c5fd" strokeWidth="0.8"/>
                      <ellipse cx="118" cy="48" rx="4" ry="3" fill="#ec4899"/>
                      <path d="M118 45 L115 38 M118 45 L118 36 M118 45 L121 38" stroke="#f9a8d4" strokeWidth="1.5" fill="none"/>
                    </svg>
                  </div>
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

              {/* Admin Navigation */}
              <nav className="hidden md:flex items-center gap-1">
                <NavLink to="/admin/dashboard" active={location.pathname === '/admin/dashboard'}>
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </NavLink>
                <NavLink to="/tournaments" active={isActiveLink('/tournaments')}>
                  <Trophy className="w-4 h-4" />
                  Tournaments
                </NavLink>
                <NavLink to="/leaderboard" active={isActiveLink('/leaderboard')}>
                  <Award className="w-4 h-4" />
                  Leaderboard
                </NavLink>
                <NavLink to="/academies" active={isActiveLink('/academies')}>
                  <Search className="w-4 h-4" />
                  Academies
                </NavLink>
              </nav>
            </div>

            <div className="flex items-center gap-3">
              {/* Admin Badge */}
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 text-red-400 text-sm font-semibold border border-red-500/30">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                ADMIN
              </div>

              {/* Notifications */}
              <NotificationBell />

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-gray-300 rounded-xl border border-white/10 hover:bg-slate-700 transition-all text-sm font-medium"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>
    );
  }

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
              <NavLink to="/leaderboard" active={isActiveLink('/leaderboard')}>
                <Award className="w-4 h-4" />
                Leaderboard
              </NavLink>
              <NavLink to="/academies" active={isActiveLink('/academies')}>
                <Search className="w-4 h-4" />
                Academies
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
                {/* Create Tournament Button - Only for Organizers, hide on academies page */}
                {isOrganizer() && !location.pathname.startsWith('/academies') && (
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

                {/* Role Switcher */}
                <RoleSwitcher />

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
              </div>
            </div>

            {/* Navigation Links */}
            <MobileNavLink to="/tournaments" onClick={() => setShowMobileMenu(false)}>
              <Trophy className="w-5 h-5" />
              Tournaments
            </MobileNavLink>
            <MobileNavLink to="/leaderboard" onClick={() => setShowMobileMenu(false)}>
              <Award className="w-5 h-5" />
              Leaderboard
            </MobileNavLink>
            <MobileNavLink to="/academies" onClick={() => setShowMobileMenu(false)}>
              <Search className="w-5 h-5" />
              Academies
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

    </header>
  );
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
