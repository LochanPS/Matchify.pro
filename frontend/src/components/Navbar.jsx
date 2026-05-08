import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from './NotificationBell';
import MatchifyLogo from './MatchifyLogo';
import { 
  ChevronDown, 
  Plus, 
  User, 
  LogOut, 
  Menu, 
  X,
  Trophy,
  LayoutDashboard,
  Search,
  Award
} from 'lucide-react';
import { 
  ArrowLeftIcon,
  ArrowRightIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const Navbar = () => {
  const { user, logout, switchRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const userMenuRef = useRef(null);
  const roleMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (roleMenuRef.current && !roleMenuRef.current.contains(event.target)) {
        setShowRoleMenu(false);
      }
      // Close mobile menu when clicking outside
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target) && showMobileMenu) {
        // Check if click is not on the menu button itself
        const menuButton = document.querySelector('[data-mobile-menu-button]');
        if (menuButton && !menuButton.contains(event.target)) {
          setShowMobileMenu(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMobileMenu]);

  // Close mobile menu on route change
  useEffect(() => {
    setShowMobileMenu(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (showMobileMenu) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showMobileMenu]);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setShowUserMenu(false);
  };

  const getCurrentRole = () => {
    if (!user) return null;
    
    // Check if user is admin first - multiple detection methods
    const isAdmin = user.isAdmin || 
                   (user.roles && (Array.isArray(user.roles) ? user.roles.includes('ADMIN') : user.roles === 'ADMIN' || user.roles.includes('ADMIN'))) ||
                   user.currentRole === 'ADMIN';
    
    if (isAdmin) {
      return 'ADMIN';
    }
    
    return user.currentRole || user.role || (user.roles && user.roles[0]);
  };

  const getAvailableRoles = () => {
    if (!user) return [];
    
    let roles = [];
    
    // Handle different role formats
    if (Array.isArray(user.roles)) {
      roles = user.roles;
    } else if (typeof user.roles === 'string') {
      roles = user.roles.split(',').map(r => r.trim());
    } else if (user.role) {
      roles = [user.role];
    }
    
    // Normalize role names to uppercase
    roles = roles.map(r => r.toUpperCase());
    
    // Ensure PLAYER is always there as base role
    if (!roles.includes('PLAYER')) {
      roles.unshift('PLAYER');
    }
    
    return roles;
  };

  const handleRoleSwitch = (role) => {
    if (switchRole) switchRole(role);
    setShowRoleMenu(false);
    // Navigate to unified dashboard with role parameter
    if (role === 'ADMIN') {
      navigate('/admin-dashboard');
    } else {
      navigate(`/dashboard?role=${role}`);
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
    if (role === 'ADMIN') {
      return '/admin-dashboard';
    }
    // Return unified dashboard with role parameter
    return `/dashboard?role=${role || 'PLAYER'}`;
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
      <header className="sticky top-0 z-50 backdrop-blur-lg border-b shadow-lg shadow-black/40" style={{ background:'rgba(7,7,26,0.96)', borderColor:'rgba(0,255,136,0.1)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              {/* Logo */}
              <Link to="/admin-dashboard" className="group hover:opacity-90 transition-opacity">
                <MatchifyLogo size={42} variant="full" />
              </Link>

              {/* Admin Navigation */}
              <nav className="hidden md:flex items-center gap-1">
                <NavLink to="/admin-dashboard" active={location.pathname === '/admin-dashboard' || location.pathname === '/admin/dashboard'}>
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
    <header className="sticky top-0 z-50 backdrop-blur-lg border-b shadow-lg shadow-purple-900/40" style={{ background:'linear-gradient(135deg, rgba(88,28,135,0.95) 0%, rgba(67,20,100,0.95) 50%, rgba(49,15,75,0.95) 100%)', borderColor:'rgba(168,85,247,0.3)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-6 sm:gap-8">
            {/* Logo */}
            <Link to="/" className="group hover:opacity-90 transition-opacity flex-shrink-0">
              <MatchifyLogo size={42} variant="full" />
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
          <div className="flex items-center gap-3 sm:gap-4">
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
                    </div>
                  )}
                </div>

                {/* Create Tournament Button - Only for Organizers, hide on academies page */}
                {isOrganizer() && !location.pathname.startsWith('/academies') && (
                  <Link
                    to="/tournaments/create"
                    className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/30 hover:scale-105 transition-all text-sm font-semibold"
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
                  data-mobile-menu-button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="md:hidden p-2 rounded-lg hover:bg-purple-500/20 transition-colors text-purple-200"
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
                  className="px-5 py-2.5 rounded-xl hover:scale-105 transition-all text-sm font-bold"
                  style={{ background:'linear-gradient(135deg,#a855f7,#c084fc)', color:'#ffffff', boxShadow:'0 0 16px rgba(168,85,247,0.4)' }}
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu - Professional Design */}
      {user && showMobileMenu && (
        <>
          {/* Full-screen overlay */}
          <div 
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setShowMobileMenu(false)}
          />
          
          {/* Menu content - slides down from navbar */}
          <div 
            ref={mobileMenuRef}
            className="md:hidden fixed left-0 right-0 top-0 z-50 overflow-y-auto max-h-screen"
            style={{ 
              paddingTop: '64px', // Space for navbar
              background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 30%, #4c1d95 60%, #581c87 100%)'
            }}
          >
          {/* Animated Background Elements */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            <div 
              className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-30"
              style={{ 
                background: 'radial-gradient(circle, rgba(168,85,247,0.8), transparent)',
                animation: 'glow 4s ease-in-out infinite'
              }}
            />
            <div 
              className="absolute bottom-1/3 left-0 w-56 h-56 rounded-full blur-3xl opacity-25"
              style={{ 
                background: 'radial-gradient(circle, rgba(192,132,252,0.8), transparent)',
                animation: 'glow 5s ease-in-out infinite reverse'
              }}
            />
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: `${Math.random() * 4 + 2}px`,
                  height: `${Math.random() * 4 + 2}px`,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  background: ['#a855f7', '#c084fc', '#e879f9'][Math.floor(Math.random() * 3)],
                  opacity: Math.random() * 0.5 + 0.2,
                  animation: `float ${Math.random() * 10 + 5}s ease-in-out infinite`,
                  animationDelay: `${Math.random() * 5}s`,
                  boxShadow: `0 0 ${Math.random() * 15 + 5}px currentColor`
                }}
              />
            ))}
          </div>

          <style>{`
            @keyframes float {
              0%, 100% { transform: translate(0, 0) scale(1); }
              25% { transform: translate(15px, -15px) scale(1.05); }
              50% { transform: translate(-10px, 10px) scale(0.95); }
              75% { transform: translate(10px, 5px) scale(1.02); }
            }
            @keyframes glow {
              0%, 100% { opacity: 0.3; filter: brightness(1); }
              50% { opacity: 0.6; filter: brightness(1.3); }
            }
            @keyframes shimmer {
              0% { background-position: -200% center; }
              100% { background-position: 200% center; }
            }
          `}</style>

          <div className="relative px-4 py-3 space-y-3">
            {/* Role Switcher Card */}
            <div 
              className="rounded-2xl p-4 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(168,85,247,0.2) 0%, rgba(192,132,252,0.2) 100%)',
                border: '2px solid rgba(168,85,247,0.4)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px rgba(168,85,247,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
              }}
            >
              <div 
                className="absolute inset-0 opacity-20"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 3s infinite'
                }}
              />
              <p 
                className="text-xs font-bold mb-2 relative z-10"
                style={{ 
                  background: 'linear-gradient(135deg, #a855f7, #c084fc)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                YOUR ROLES
              </p>
              <div className="flex flex-wrap gap-2 relative z-10">
                {availableRoles.map((role) => {
                  const colors = getRoleColor(role);
                  const isActive = role === currentRole;
                  return (
                    <button
                      key={role}
                      onClick={() => { handleRoleSwitch(role); setShowMobileMenu(false); }}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all relative overflow-hidden"
                      style={{
                        background: isActive 
                          ? 'linear-gradient(135deg, #a855f7, #c084fc)' 
                          : 'rgba(255,255,255,0.05)',
                        border: `1.5px solid ${isActive ? 'rgba(168,85,247,0.6)' : 'rgba(255,255,255,0.1)'}`,
                        color: isActive ? '#ffffff' : '#e9d5ff',
                        boxShadow: isActive ? '0 4px 15px rgba(168,85,247,0.5)' : 'none'
                      }}
                    >
                      {isActive && (
                        <div 
                          className="absolute inset-0 opacity-30"
                          style={{
                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                            backgroundSize: '200% 100%',
                            animation: 'shimmer 2s infinite'
                          }}
                        />
                      )}
                      <span className={`w-2 h-2 rounded-full ${colors.dot} relative z-10`}></span>
                      <span className="relative z-10">{role}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation Links */}
            <div className="space-y-2">
              <MobileNavLinkStyled to="/tournaments" onClick={() => setShowMobileMenu(false)} icon={<Trophy className="w-5 h-5" />} color="blue">
                Tournaments
              </MobileNavLinkStyled>
              <MobileNavLinkStyled to="/leaderboard" onClick={() => setShowMobileMenu(false)} icon={<Award className="w-5 h-5" />} color="orange">
                Leaderboard
              </MobileNavLinkStyled>
              <MobileNavLinkStyled to="/academies" onClick={() => setShowMobileMenu(false)} icon={<Search className="w-5 h-5" />} color="purple">
                Academies
              </MobileNavLinkStyled>
              <MobileNavLinkStyled to={getDashboardLink()} onClick={() => setShowMobileMenu(false)} icon={<LayoutDashboard className="w-5 h-5" />} color="green">
                Dashboard
              </MobileNavLinkStyled>
              <MobileNavLinkStyled to="/profile" onClick={() => setShowMobileMenu(false)} icon={<User className="w-5 h-5" />} color="cyan">
                Profile
              </MobileNavLinkStyled>
              {currentRole === 'PLAYER' && (
                <MobileNavLinkStyled to="/registrations" onClick={() => setShowMobileMenu(false)} icon={<Trophy className="w-5 h-5" />} color="indigo">
                  My Registrations
                </MobileNavLinkStyled>
              )}
            </div>

            {/* Create Tournament Button */}
            {isOrganizer() && (
              <Link
                to="/tournaments/create"
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-bold text-base transition-all relative overflow-hidden group"
                style={{ 
                  background: 'linear-gradient(135deg, #a855f7, #c084fc)',
                  color: '#ffffff',
                  boxShadow: '0 8px 25px rgba(168,85,247,0.5), inset 0 1px 0 rgba(255,255,255,0.3)'
                }}
              >
                <div 
                  className="absolute inset-0 opacity-0 group-active:opacity-100 transition-opacity"
                  style={{ background: 'radial-gradient(circle at center, rgba(255,255,255,0.3), transparent)' }}
                />
                <Plus className="w-5 h-5 relative z-10" />
                <span className="relative z-10">Create Tournament</span>
              </Link>
            )}

            {/* Find Competition Button */}
            <button
              onClick={() => { navigate('/tournaments'); setShowMobileMenu(false); }}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-bold text-base transition-all relative overflow-hidden"
              style={{ 
                background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(251,146,60,0.15))',
                border: '2px solid rgba(245,158,11,0.4)',
                color: '#fbbf24',
                boxShadow: '0 4px 15px rgba(245,158,11,0.3)'
              }}
            >
              <SparklesIcon className="w-5 h-5" />
              Find Your Next Competition
            </button>

            {/* Logout Button */}
            <button
              onClick={() => { handleLogout(); setShowMobileMenu(false); }}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-bold text-base transition-all relative overflow-hidden group"
              style={{ 
                background: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(220,38,38,0.15))',
                border: '2px solid rgba(239,68,68,0.4)',
                color: '#f87171',
                boxShadow: '0 4px 15px rgba(239,68,68,0.3)'
              }}
            >
              <div 
                className="absolute inset-0 opacity-0 group-active:opacity-100 transition-opacity"
                style={{ background: 'rgba(239,68,68,0.1)' }}
              />
              <LogOut className="w-5 h-5 relative z-10" />
              <span className="relative z-10">Logout</span>
            </button>

            {/* Back Button */}
            <button
              onClick={() => { navigate(-1); setShowMobileMenu(false); }}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl font-semibold text-sm transition-all"
              style={{ 
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#9ca3af'
              }}
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Back
            </button>
          </div>
        </div>
        </>
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
        ? 'text-purple-300 bg-purple-500/30 shadow-sm shadow-purple-500/20' 
        : 'text-purple-100 hover:text-white hover:bg-purple-500/20'
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

// Styled Mobile Nav Link Component with Colors
const MobileNavLinkStyled = ({ to, children, onClick, icon, color }) => {
  const colorStyles = {
    blue: { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.3)', text: '#60a5fa', iconBg: 'rgba(59,130,246,0.3)' },
    orange: { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)', text: '#fbbf24', iconBg: 'rgba(245,158,11,0.3)' },
    purple: { bg: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.3)', text: '#c4b5fd', iconBg: 'rgba(168,85,247,0.3)' },
    green: { bg: 'rgba(0,200,83,0.15)', border: 'rgba(0,200,83,0.3)', text: '#00ff88', iconBg: 'rgba(0,200,83,0.3)' },
    cyan: { bg: 'rgba(6,182,212,0.15)', border: 'rgba(6,182,212,0.3)', text: '#22d3ee', iconBg: 'rgba(6,182,212,0.3)' },
    indigo: { bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.3)', text: '#a5b4fc', iconBg: 'rgba(99,102,241,0.3)' },
  };
  
  const style = colorStyles[color] || colorStyles.blue;
  
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-4 px-4 py-4 rounded-xl transition-all relative overflow-hidden group"
      style={{
        background: style.bg,
        border: `2px solid ${style.border}`,
        boxShadow: `0 4px 15px ${style.border}`
      }}
    >
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: 'rgba(255,255,255,0.05)' }}
      />
      <div 
        className="w-10 h-10 rounded-lg flex items-center justify-center relative z-10"
        style={{ background: style.iconBg }}
      >
        <span style={{ color: style.text }}>{icon}</span>
      </div>
      <span className="font-bold text-white relative z-10">{children}</span>
      <ArrowRightIcon className="w-5 h-5 ml-auto relative z-10" style={{ color: style.text }} />
    </Link>
  );
};

export default Navbar;
