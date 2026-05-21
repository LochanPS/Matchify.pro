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
  Award,
  HeadphonesIcon,
  Mail,
  ChevronUp,
  Copy,
  Check
} from 'lucide-react';
import {
  ArrowLeftIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

// Deterministic particles — no Math.random in render
const NAV_PARTICLES = Array.from({ length: 10 }, (_, i) => ({
  w: (i * 7 + 1) % 2 + 1,
  h: (i * 11 + 1) % 2 + 1,
  x: (i * 37 + 11) % 97,
  y: (i * 53 + 7) % 91,
  c: ['#a855f7', '#c084fc', '#8b5cf6'][i % 3],
  o: ((i * 13) % 40) / 100 + 0.15,
  dur: (i * 7) % 6 + 4,
  delay: (i * 3) % 3,
  glow: (i * 11) % 12 + 4,
}));

const Navbar = () => {
  const { user, logout, switchRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showCustomerCare, setShowCustomerCare] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);
  const userMenuRef = useRef(null);
  const roleMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) setShowUserMenu(false);
      if (roleMenuRef.current && !roleMenuRef.current.contains(event.target)) setShowRoleMenu(false);
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target) && showMobileMenu) {
        const menuBtn = document.querySelector('[data-mobile-menu-button]');
        if (menuBtn && !menuBtn.contains(event.target)) setShowMobileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMobileMenu]);

  useEffect(() => { setShowMobileMenu(false); }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = showMobileMenu ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [showMobileMenu]);

  const handleLogout = () => { logout(); navigate('/login'); setShowUserMenu(false); };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('matchify.pro@gmail.com').then(() => {
      setEmailCopied(true);
      setTimeout(() => setEmailCopied(false), 2000);
    });
  };

  const getCurrentRole = () => {
    if (!user) return null;
    const isAdmin = user.isAdmin ||
      (user.roles && (Array.isArray(user.roles) ? user.roles.includes('ADMIN') : user.roles === 'ADMIN' || user.roles.includes('ADMIN'))) ||
      user.currentRole === 'ADMIN';
    if (isAdmin) return 'ADMIN';
    return user.currentRole || user.role || (user.roles && user.roles[0]);
  };

  const getAvailableRoles = () => {
    if (!user) return [];
    let roles = [];
    if (Array.isArray(user.roles)) roles = user.roles;
    else if (typeof user.roles === 'string') roles = user.roles.split(',').map(r => r.trim());
    else if (user.role) roles = [user.role];
    roles = roles.map(r => r.toUpperCase());
    if (!roles.includes('PLAYER')) roles.unshift('PLAYER');
    return roles;
  };

  const handleRoleSwitch = (role) => {
    if (switchRole) switchRole(role);
    setShowRoleMenu(false);
    navigate(role === 'ADMIN' ? '/admin-dashboard' : `/dashboard?role=${role}`);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'PLAYER':   return { bg: 'bg-blue-500/20',   text: 'text-blue-400',   hover: 'hover:bg-blue-500/30',   dot: 'bg-blue-500' };
      case 'ORGANIZER':return { bg: 'bg-green-500/20',  text: 'text-green-400',  hover: 'hover:bg-green-500/30',  dot: 'bg-green-500' };
      case 'UMPIRE':   return { bg: 'bg-orange-500/20', text: 'text-orange-400', hover: 'hover:bg-orange-500/30', dot: 'bg-orange-500' };
      case 'ADMIN':    return { bg: 'bg-red-500/20',    text: 'text-red-400',    hover: 'hover:bg-red-500/30',    dot: 'bg-red-500' };
      default:         return { bg: 'bg-gray-500/20',   text: 'text-gray-400',   hover: 'hover:bg-gray-500/30',   dot: 'bg-gray-500' };
    }
  };

  const getDashboardLink = () => {
    const role = getCurrentRole();
    return role === 'ADMIN' ? '/admin-dashboard' : `/dashboard?role=${role || 'PLAYER'}`;
  };

  const isActiveLink = (path) => {
    if (path === '/tournaments') return location.pathname.startsWith('/tournaments');
    if (path === '/academies') return location.pathname.startsWith('/academies');
    if (path === '/leaderboard') return location.pathname === '/leaderboard';
    if (path === '/dashboard') return location.pathname.includes('dashboard');
    return location.pathname === path;
  };

  const isOrganizer = () => getAvailableRoles().includes('ORGANIZER');

  const currentRole = getCurrentRole();
  const roleColors = getRoleColor(currentRole);
  const availableRoles = getAvailableRoles();

  // ── Admin navbar ─────────────────────────────────────────────────────────
  if (user?.isAdmin) {
    return (
      <header className="sticky top-0 z-50 backdrop-blur-lg border-b shadow-lg shadow-black/40"
        style={{ background: 'rgba(7,7,26,0.96)', borderColor: 'rgba(0,255,136,0.1)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link to="/admin-dashboard" className="hover:opacity-90 transition-opacity ml-2">
                <MatchifyLogo size={52} variant="full" />
              </Link>
              <nav className="hidden md:flex items-center gap-1">
                <NavLink to="/admin-dashboard" active={location.pathname === '/admin-dashboard'}><LayoutDashboard className="w-4 h-4" />Dashboard</NavLink>
                <NavLink to="/tournaments" active={isActiveLink('/tournaments')}><Trophy className="w-4 h-4" />Tournaments</NavLink>
                <NavLink to="/leaderboard" active={isActiveLink('/leaderboard')}><Award className="w-4 h-4" />Leaderboard</NavLink>
                <NavLink to="/academies" active={isActiveLink('/academies')}><Search className="w-4 h-4" />Academies</NavLink>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 text-red-400 text-sm font-semibold border border-red-500/30">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                ADMIN
              </div>
              <NotificationBell />
              <button onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-gray-300 rounded-xl border border-white/10 hover:bg-slate-700 transition-all text-sm font-medium">
                <LogOut className="w-4 h-4" />Logout
              </button>
            </div>
          </div>
        </div>
      </header>
    );
  }

  // ── Main navbar ───────────────────────────────────────────────────────────
  return (
    <header className="sticky top-0 z-50 backdrop-blur-lg border-b shadow-lg shadow-purple-900/40"
      style={{ background: 'linear-gradient(135deg, rgba(88,28,135,0.97) 0%, rgba(67,20,100,0.97) 50%, rgba(49,15,75,0.97) 100%)', borderColor: 'rgba(168,85,247,0.3)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo + desktop nav */}
          <div className="flex items-center gap-6 sm:gap-8">
            <Link to="/" className="hover:opacity-90 transition-opacity flex-shrink-0 ml-2">
              <MatchifyLogo size={52} variant="full" />
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              <NavLink to="/tournaments" active={isActiveLink('/tournaments')}><Trophy className="w-4 h-4" />Tournaments</NavLink>
              <NavLink to="/leaderboard" active={isActiveLink('/leaderboard')}><Award className="w-4 h-4" />Leaderboard</NavLink>
              <NavLink to="/academies" active={isActiveLink('/academies')}><Search className="w-4 h-4" />Academies</NavLink>
              {user && <NavLink to={getDashboardLink()} active={isActiveLink('/dashboard')}><LayoutDashboard className="w-4 h-4" />Dashboard</NavLink>}
            </nav>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            {user ? (
              <>
                {/* Role switcher — desktop only */}
                <div className="relative hidden sm:block" ref={roleMenuRef}>
                  <button onClick={() => setShowRoleMenu(!showRoleMenu)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl ${roleColors.bg} ${roleColors.text} text-sm font-semibold ${roleColors.hover} transition-all border border-white/10`}>
                    <span className={`w-2.5 h-2.5 rounded-full ${roleColors.dot} animate-pulse`} />
                    {currentRole}
                    <ChevronDown className={`w-4 h-4 transition-transform ${showRoleMenu ? 'rotate-180' : ''}`} />
                  </button>
                  {showRoleMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-white/10 rounded-2xl shadow-2xl shadow-black/50 py-2 z-50">
                      <div className="px-4 py-2 text-xs text-gray-400 font-semibold uppercase tracking-wider">Your Roles</div>
                      {availableRoles.map(role => {
                        const c = getRoleColor(role);
                        return (
                          <button key={role} onClick={() => handleRoleSwitch(role)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/5 transition-colors ${role === currentRole ? 'bg-white/5' : ''}`}>
                            <span className={`w-3 h-3 rounded-full ${c.dot}`} />
                            <span className={`font-medium ${c.text}`}>{role}</span>
                            {role === currentRole && (
                              <span className="ml-auto text-xs bg-gradient-to-r from-purple-500 to-violet-500 text-white px-2.5 py-1 rounded-full font-semibold">Active</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Create Tournament — organizer desktop */}
                {isOrganizer() && !location.pathname.startsWith('/academies') && (
                  <Link to="/tournaments/create"
                    className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/30 hover:scale-105 transition-all text-sm font-semibold">
                    <Plus className="w-4 h-4" />Create
                  </Link>
                )}

                <NotificationBell />

                {/* User avatar dropdown */}
                <div className="relative" ref={userMenuRef}>
                  <button onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/10 transition-all">
                    {user.profilePhoto
                      ? <img src={user.profilePhoto} alt={user.name} className="w-10 h-10 rounded-xl object-cover border-2 border-white/20" />
                      : <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-purple-500/30">
                          {user.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                    }
                    <ChevronDown className={`w-4 h-4 text-purple-300 hidden sm:block transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                  </button>
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-72 bg-slate-800 border border-white/10 rounded-2xl shadow-2xl shadow-black/50 py-2 z-50 overflow-hidden">
                      <div className="px-4 py-4 bg-white/5 border-b border-white/10">
                        <div className="flex items-center gap-3">
                          {user.profilePhoto
                            ? <img src={user.profilePhoto} alt={user.name} className="w-12 h-12 rounded-xl object-cover" />
                            : <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                                {user.name?.charAt(0)?.toUpperCase()}
                              </div>
                          }
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white truncate">{user.name}</p>
                            <p className="text-sm text-gray-400 truncate">{user.email}</p>
                          </div>
                        </div>
                      </div>
                      <div className="py-2">
                        <MenuLink to="/profile" icon={<User className="w-4 h-4" />} onClick={() => setShowUserMenu(false)}>My Profile</MenuLink>
                        {currentRole === 'PLAYER' && (
                          <MenuLink to="/registrations" icon={<Trophy className="w-4 h-4" />} onClick={() => setShowUserMenu(false)}>My Registrations</MenuLink>
                        )}
                      </div>
                      <div className="border-t border-white/10 pt-2 pb-1 px-2">
                        <button onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/20 rounded-xl transition-colors font-medium">
                          <LogOut className="w-4 h-4" />Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Hamburger */}
                <button data-mobile-menu-button onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="md:hidden p-2 rounded-lg hover:bg-purple-500/20 transition-colors text-purple-200">
                  {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-purple-200 hover:text-white px-4 py-2 text-sm font-medium transition-colors rounded-xl hover:bg-purple-500/20">
                  Sign in
                </Link>
                <Link to="/register"
                  className="px-5 py-2.5 rounded-xl hover:scale-105 transition-all text-sm font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #a855f7, #c084fc)', boxShadow: '0 0 16px rgba(168,85,247,0.4)' }}>
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile Menu ────────────────────────────────────────────────────── */}
      {user && showMobileMenu && (
        <>
          {/* Dim overlay */}
          <div className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40" onClick={() => setShowMobileMenu(false)} />

          {/* Panel — 480px column, slides from top */}
          <div ref={mobileMenuRef}
            className="md:hidden fixed z-50 overflow-y-auto"
            style={{
              top: 0, left: '50%', transform: 'translateX(-50%)',
              width: '100%', maxWidth: '480px', maxHeight: '100vh',
              paddingTop: '64px',
              background: 'linear-gradient(180deg, #1a0a2e 0%, #2d1557 35%, #3d1a6e 65%, #4a1080 100%)',
            }}>

            {/* Background eye-candy */}
            <div className="fixed pointer-events-none overflow-hidden"
              style={{ top: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '480px', height: '100%' }}>
              <div className="absolute -top-10 right-0 w-52 h-52 rounded-full blur-3xl opacity-25"
                style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.9), transparent)', animation: 'navGlow 4s ease-in-out infinite' }} />
              <div className="absolute bottom-1/3 -left-10 w-44 h-44 rounded-full blur-3xl opacity-20"
                style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.9), transparent)', animation: 'navGlow 5s ease-in-out infinite reverse' }} />
              {NAV_PARTICLES.map((p, i) => (
                <div key={i} className="absolute rounded-full"
                  style={{ width: `${p.w}px`, height: `${p.h}px`, left: `${p.x}%`, top: `${p.y}%`, background: p.c, opacity: p.o, animation: `navFloat ${p.dur}s ease-in-out infinite`, animationDelay: `${p.delay}s`, boxShadow: `0 0 ${p.glow}px ${p.c}` }} />
              ))}
            </div>

            <style>{`
              @keyframes navFloat { 0%,100%{transform:translate(0,0)scale(1)} 25%{transform:translate(12px,-12px)scale(1.04)} 50%{transform:translate(-8px,8px)scale(0.96)} 75%{transform:translate(8px,4px)scale(1.02)} }
              @keyframes navGlow  { 0%,100%{opacity:0.25;filter:brightness(1)} 50%{opacity:0.5;filter:brightness(1.3)} }
              @keyframes navShimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
            `}</style>

            <div className="relative px-4 pb-6 pt-2 space-y-2">

              {/* ── User profile card ── */}
              <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
                style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)' }}>
                {user.profilePhoto
                  ? <img src={user.profilePhoto} alt={user.name} className="w-12 h-12 rounded-2xl object-cover border-2 border-purple-400/30" />
                  : <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-purple-500/30 flex-shrink-0">
                      {user.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                }
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white truncate text-sm">{user.name}</p>
                  <p className="text-xs text-purple-300/80 truncate">{user.email}</p>
                </div>
                <Link to="/profile" onClick={() => setShowMobileMenu(false)}
                  className="p-2 rounded-xl transition-colors text-purple-300 hover:bg-purple-500/20">
                  <User className="w-4 h-4" />
                </Link>
              </div>

              {/* ── Role switcher ── */}
              <div className="rounded-2xl p-3 relative overflow-hidden"
                style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.25)' }}>
                <div className="absolute inset-0 opacity-10"
                  style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)', backgroundSize: '200% 100%', animation: 'navShimmer 3s infinite' }} />
                <p className="text-[10px] font-bold mb-2 relative z-10 tracking-widest"
                  style={{ background: 'linear-gradient(135deg,#a855f7,#c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  SWITCH ROLE
                </p>
                <div className="flex flex-wrap gap-1.5 relative z-10">
                  {availableRoles.map(role => {
                    const c = getRoleColor(role);
                    const isActive = role === currentRole;
                    return (
                      <button key={role}
                        onClick={() => { handleRoleSwitch(role); setShowMobileMenu(false); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                        style={{
                          background: isActive ? 'linear-gradient(135deg,#a855f7,#c084fc)' : 'rgba(255,255,255,0.06)',
                          border: `1.5px solid ${isActive ? 'rgba(168,85,247,0.5)' : 'rgba(255,255,255,0.1)'}`,
                          color: isActive ? '#fff' : '#d8b4fe',
                          boxShadow: isActive ? '0 2px 12px rgba(168,85,247,0.5)' : 'none',
                        }}>
                        <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                        {role}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Section label ── */}
              <p className="text-[10px] font-bold text-purple-400/60 tracking-widest px-1 pt-1">NAVIGATION</p>

              {/* ── Nav links ── */}
              <div className="space-y-1">
                <MobileNavItem to="/tournaments" onClick={() => setShowMobileMenu(false)} icon={<Trophy className="w-4 h-4" />} color="blue" active={isActiveLink('/tournaments')}>Tournaments</MobileNavItem>
                <MobileNavItem to="/leaderboard" onClick={() => setShowMobileMenu(false)} icon={<Award className="w-4 h-4" />} color="orange" active={isActiveLink('/leaderboard')}>Leaderboard</MobileNavItem>
                <MobileNavItem to="/academies" onClick={() => setShowMobileMenu(false)} icon={<Search className="w-4 h-4" />} color="cyan" active={isActiveLink('/academies')}>Academies</MobileNavItem>
                <MobileNavItem to={getDashboardLink()} onClick={() => setShowMobileMenu(false)} icon={<LayoutDashboard className="w-4 h-4" />} color="purple" active={isActiveLink('/dashboard')}>Dashboard</MobileNavItem>
                {currentRole === 'PLAYER' && (
                  <MobileNavItem to="/registrations" onClick={() => setShowMobileMenu(false)} icon={<Trophy className="w-4 h-4" />} color="blue" active={isActiveLink('/registrations')}>My Registrations</MobileNavItem>
                )}
              </div>

              {/* ── Divider ── */}
              <div className="h-px" style={{ background: 'rgba(168,85,247,0.15)' }} />

              {/* ── Create Tournament ── */}
              {isOrganizer() && (
                <Link to="/tournaments/create" onClick={() => setShowMobileMenu(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-white transition-all relative overflow-hidden group"
                  style={{ background: 'linear-gradient(135deg,#a855f7,#c084fc)', boxShadow: '0 4px 20px rgba(168,85,247,0.4)' }}>
                  <div className="absolute inset-0 opacity-0 group-active:opacity-20 transition-opacity" style={{ background: 'rgba(255,255,255,0.3)' }} />
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center relative z-10">
                    <Plus className="w-4 h-4" />
                  </div>
                  <span className="relative z-10">Create Tournament</span>
                </Link>
              )}

              {/* ── Find Competition ── */}
              <button onClick={() => { navigate('/tournaments'); setShowMobileMenu(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all"
                style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', color: '#fbbf24' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(251,191,36,0.15)' }}>
                  <SparklesIcon className="w-4 h-4" />
                </div>
                Find Your Next Competition
              </button>

              {/* ── Customer Care ── */}
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(168,85,247,0.2)' }}>
                <button onClick={() => setShowCustomerCare(!showCustomerCare)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold transition-all"
                  style={{ background: showCustomerCare ? 'rgba(168,85,247,0.15)' : 'rgba(168,85,247,0.08)', color: '#c4b5fd' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(168,85,247,0.2)' }}>
                    <HeadphonesIcon className="w-4 h-4" />
                  </div>
                  <span className="flex-1 text-left">Customer Care</span>
                  {showCustomerCare ? <ChevronUp className="w-4 h-4 opacity-60" /> : <ChevronDown className="w-4 h-4 opacity-60" />}
                </button>
                {showCustomerCare && (
                  <div className="px-4 py-3" style={{ background: 'rgba(168,85,247,0.06)' }}>
                    <p className="text-xs text-purple-300/70 mb-3 leading-relaxed">
                      For queries or support, reach us at our email and we'll respond shortly.
                    </p>
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-2"
                      style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)' }}>
                      <Mail className="w-4 h-4 flex-shrink-0 text-purple-400" />
                      <span className="flex-1 text-sm font-semibold text-purple-200 truncate">matchify.pro@gmail.com</span>
                      <button onClick={handleCopyEmail} className="p-1 rounded-lg transition-colors"
                        style={{ color: emailCopied ? '#00ff88' : '#a855f7' }} title="Copy email">
                        {emailCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    <a href="mailto:matchify.pro@gmail.com"
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
                      style={{ background: 'linear-gradient(135deg,#a855f7,#c084fc)', boxShadow: '0 2px 12px rgba(168,85,247,0.4)' }}>
                      <Mail className="w-4 h-4" />
                      Send Email
                    </a>
                  </div>
                )}
              </div>

              {/* ── Logout ── */}
              <button onClick={() => { handleLogout(); setShowMobileMenu(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.15)' }}>
                  <LogOut className="w-4 h-4" />
                </div>
                Logout
              </button>

              {/* ── Back ── */}
              <button onClick={() => { navigate(-1); setShowMobileMenu(false); }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af' }}>
                <ArrowLeftIcon className="w-4 h-4" />
                Go Back
              </button>

            </div>
          </div>
        </>
      )}
    </header>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────

const NavLink = ({ to, children, active }) => (
  <Link to={to}
    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
      active ? 'text-purple-300 bg-purple-500/30 shadow-sm shadow-purple-500/20' : 'text-purple-100 hover:text-white hover:bg-purple-500/20'
    }`}>
    {children}
  </Link>
);

const MenuLink = ({ to, icon, children, onClick }) => (
  <Link to={to} onClick={onClick}
    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/10 transition-colors mx-2 rounded-xl">
    <span className="text-gray-400">{icon}</span>
    {children}
  </Link>
);

const MobileNavItem = ({ to, children, onClick, icon, color, active }) => {
  const palette = {
    blue:   { bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.2)',  activeBg: 'rgba(59,130,246,0.18)',  text: '#60a5fa',  iconBg: 'rgba(59,130,246,0.2)' },
    orange: { bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.2)',  activeBg: 'rgba(245,158,11,0.18)',  text: '#fbbf24',  iconBg: 'rgba(245,158,11,0.2)' },
    cyan:   { bg: 'rgba(6,182,212,0.1)',   border: 'rgba(6,182,212,0.2)',   activeBg: 'rgba(6,182,212,0.18)',   text: '#22d3ee',  iconBg: 'rgba(6,182,212,0.2)' },
    purple: { bg: 'rgba(168,85,247,0.1)',  border: 'rgba(168,85,247,0.2)',  activeBg: 'rgba(168,85,247,0.2)',   text: '#c4b5fd',  iconBg: 'rgba(168,85,247,0.25)' },
    green:  { bg: 'rgba(0,200,83,0.1)',    border: 'rgba(0,200,83,0.2)',    activeBg: 'rgba(0,200,83,0.18)',    text: '#00ff88',  iconBg: 'rgba(0,200,83,0.2)' },
  };
  const s = palette[color] || palette.blue;
  return (
    <Link to={to} onClick={onClick}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
      style={{ background: active ? s.activeBg : s.bg, border: `1px solid ${s.border}` }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: s.iconBg }}>
        <span style={{ color: s.text }}>{icon}</span>
      </div>
      <span className="font-semibold text-white text-sm flex-1">{children}</span>
      {active && <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.text }} />}
    </Link>
  );
};

export default Navbar;
