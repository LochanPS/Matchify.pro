import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../utils/api';
import MatchifyLogo from '../components/MatchifyLogo';
import {
  TrophyIcon,
  ChartBarIcon,
  UserIcon,
  SparklesIcon,
  FireIcon,
  BoltIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  ArrowRightIcon,
  Bars3Icon,
  BellIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const UnifiedDashboardMobile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playerCode, setPlayerCode] = useState(null);
  const [umpireCode, setUmpireCode] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [showMenu, setShowMenu] = useState(false);

  // Get user roles
  let userRoles = [];
  if (typeof user?.roles === 'string') {
    userRoles = user.roles.split(',').map(r => r.trim());
  } else if (Array.isArray(user?.roles)) {
    userRoles = user.roles;
  } else if (user?.role) {
    userRoles = [user.role];
  }

  // Redirect admin users
  const isAdmin = userRoles.includes('ADMIN') || user?.isAdmin;
  if (isAdmin) {
    navigate('/admin-dashboard', { replace: true });
    return null;
  }

  if (userRoles.length === 0) {
    userRoles = ['PLAYER'];
  }

  // Get active role from URL or default to first role
  const roleFromUrl = searchParams.get('role');
  const [activeRole, setActiveRole] = useState(
    roleFromUrl && userRoles.includes(roleFromUrl) ? roleFromUrl : userRoles[0] || 'PLAYER'
  );

  useEffect(() => {
    if (activeRole && userRoles.includes(activeRole)) {
      setSearchParams({ role: activeRole });
    }
  }, [activeRole]);

  useEffect(() => {
    if (roleFromUrl && userRoles.includes(roleFromUrl) && roleFromUrl !== activeRole) {
      setActiveRole(roleFromUrl);
    }
  }, [roleFromUrl]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [profileRes, regRes] = await Promise.all([
        api.get('/auth/me'),
        api.get('/registrations/my')
      ]);
      
      if (profileRes.data.user) {
        setUserProfile(profileRes.data.user);
        setPlayerCode(profileRes.data.user.playerCode);
        setUmpireCode(profileRes.data.user.umpireCode);
      }
      
      setRegistrations(regRes.data.registrations || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSwitch = (role) => {
    setActiveRole(role);
    setShowMenu(false);
  };

  const winRate = (user?.matchesWon || 0) + (user?.matchesLost || 0) > 0
    ? Math.round((user?.matchesWon / ((user?.matchesWon || 0) + (user?.matchesLost || 0))) * 100)
    : 0;

  const stats = [
    { 
      label: 'Total Points', 
      value: user?.totalPoints || 0, 
      icon: SparklesIcon,
      color: 'from-amber-500 to-orange-600',
      bg: 'rgba(245,158,11,0.1)',
      border: 'rgba(245,158,11,0.2)'
    },
    { 
      label: 'Tournaments', 
      value: user?.tournamentsPlayed || 0, 
      icon: TrophyIcon,
      color: 'from-purple-500 to-violet-600',
      bg: 'rgba(168,85,247,0.1)',
      border: 'rgba(168,85,247,0.2)'
    },
    { 
      label: 'Matches Won', 
      value: user?.matchesWon || 0, 
      icon: FireIcon,
      color: 'from-green-500 to-emerald-600',
      bg: 'rgba(16,185,129,0.1)',
      border: 'rgba(16,185,129,0.2)'
    },
    { 
      label: 'Win Rate', 
      value: `${winRate}%`, 
      icon: BoltIcon,
      color: 'from-blue-500 to-cyan-600',
      bg: 'rgba(6,182,212,0.1)',
      border: 'rgba(6,182,212,0.2)'
    },
  ];

  const roleConfig = {
    PLAYER: {
      name: 'Player',
      icon: '🏸',
      color: '#00c853',
      bg: 'rgba(0,200,83,0.1)',
      border: 'rgba(0,200,83,0.3)'
    },
    ORGANIZER: {
      name: 'Organizer',
      icon: '🏆',
      color: '#a855f7',
      bg: 'rgba(168,85,247,0.1)',
      border: 'rgba(168,85,247,0.3)'
    },
    UMPIRE: {
      name: 'Umpire',
      icon: '⚖️',
      color: '#3b82f6',
      bg: 'rgba(59,130,246,0.1)',
      border: 'rgba(59,130,246,0.3)'
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ 
      background: 'linear-gradient(180deg, #0a0a1f 0%, #07071a 30%, #0d1a2a 60%, #07071a 100%)' 
    }}>
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Large Gradient Orbs */}
        <div 
          className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-30 animate-pulse"
          style={{ 
            background: 'radial-gradient(circle, rgba(0,200,83,0.4) 0%, rgba(0,255,136,0.2) 40%, transparent 70%)',
            animation: 'float 8s ease-in-out infinite'
          }}
        />
        <div 
          className="absolute top-1/4 left-0 w-80 h-80 rounded-full blur-3xl opacity-25 animate-pulse"
          style={{ 
            background: 'radial-gradient(circle, rgba(168,85,247,0.4) 0%, rgba(139,92,246,0.2) 40%, transparent 70%)',
            animation: 'float 10s ease-in-out infinite reverse',
            animationDelay: '2s'
          }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full blur-3xl opacity-20 animate-pulse"
          style={{ 
            background: 'radial-gradient(circle, rgba(6,182,212,0.4) 0%, rgba(14,165,233,0.2) 40%, transparent 70%)',
            animation: 'float 12s ease-in-out infinite',
            animationDelay: '4s'
          }}
        />
        <div 
          className="absolute top-1/2 right-1/3 w-64 h-64 rounded-full blur-3xl opacity-15 animate-pulse"
          style={{ 
            background: 'radial-gradient(circle, rgba(245,158,11,0.4) 0%, rgba(251,146,60,0.2) 40%, transparent 70%)',
            animation: 'float 9s ease-in-out infinite reverse',
            animationDelay: '1s'
          }}
        />
        
        {/* Floating Particles */}
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${Math.random() * 6 + 2}px`,
              height: `${Math.random() * 6 + 2}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: ['#00c853', '#a855f7', '#06b6d4', '#f59e0b'][Math.floor(Math.random() * 4)],
              opacity: Math.random() * 0.5 + 0.2,
              animation: `float ${Math.random() * 10 + 5}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
              boxShadow: `0 0 ${Math.random() * 20 + 10}px currentColor`
            }}
          />
        ))}
      </div>

      {/* Add keyframes for animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -20px) scale(1.05); }
          50% { transform: translate(-15px, 15px) scale(0.95); }
          75% { transform: translate(15px, 10px) scale(1.02); }
        }
        @keyframes glow {
          0%, 100% { opacity: 0.5; filter: brightness(1); }
          50% { opacity: 1; filter: brightness(1.3); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>

      {/* Mobile Header */}
      <div 
        className="sticky top-0 z-50 backdrop-blur-md border-b relative"
        style={{ 
          background: 'linear-gradient(135deg, rgba(7,7,26,0.95), rgba(13,26,42,0.95))', 
          borderColor: 'rgba(0,200,83,0.3)',
          boxShadow: '0 4px 20px rgba(0,200,83,0.1)'
        }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <div 
                className="absolute inset-0 blur-lg opacity-60"
                style={{ 
                  background: 'radial-gradient(circle, rgba(0,200,83,0.6) 0%, transparent 70%)',
                  animation: 'glow 3s ease-in-out infinite'
                }}
              />
              <MatchifyLogo size={32} variant="icon" />
            </div>
            <span 
              className="font-bold text-lg"
              style={{ 
                background: 'linear-gradient(135deg, #00c853, #00ff88)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textShadow: '0 0 20px rgba(0,200,83,0.3)'
              }}
            >
              matchify.pro
            </span>
          </div>

          {/* Right Icons */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/notifications')}
              className="p-2 rounded-lg transition-all relative overflow-hidden group"
              style={{ 
                background: 'linear-gradient(135deg, rgba(0,200,83,0.1), rgba(0,255,136,0.05))',
                border: '1px solid rgba(0,200,83,0.2)'
              }}
            >
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'rgba(0,200,83,0.1)' }}
              />
              <BellIcon className="w-6 h-6 text-emerald-400 relative z-10" />
            </button>
            
            {/* Profile Photo - Small in header */}
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm relative overflow-hidden"
              style={{ 
                background: 'linear-gradient(135deg,#00c853,#00ff88)', 
                color: '#003320',
                boxShadow: '0 4px 12px rgba(0,200,83,0.4), inset 0 1px 0 rgba(255,255,255,0.3)'
              }}
            >
              {user?.profilePhoto ? (
                <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover rounded-full" />
              ) : (
                user?.name?.charAt(0)?.toUpperCase() || 'P'
              )}
            </button>
            
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-lg transition-all relative overflow-hidden group"
              style={{ 
                background: 'linear-gradient(135deg, rgba(168,85,247,0.1), rgba(139,92,246,0.05))',
                border: '1px solid rgba(168,85,247,0.2)'
              }}
            >
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'rgba(168,85,247,0.1)' }}
              />
              <Bars3Icon className="w-6 h-6 text-purple-400 relative z-10" />
            </button>
          </div>
        </div>

        {/* Role Switcher - Only show if multiple roles */}
        {userRoles.length > 1 && (
          <div className="px-4 pb-3 relative">
            <div className="flex items-center gap-2 mb-2">
              <span 
                className="text-xs font-bold tracking-wider"
                style={{ 
                  background: 'linear-gradient(135deg, #a855f7, #c084fc)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                YOUR ROLES:
              </span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {userRoles.map((role) => {
                const config = roleConfig[role];
                if (!config) return null;
                
                const isActive = role === activeRole;
                
                return (
                  <button
                    key={role}
                    onClick={() => handleRoleSwitch(role)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all flex-shrink-0 relative overflow-hidden"
                    style={{
                      background: isActive 
                        ? `linear-gradient(135deg, ${config.color}, ${config.color}dd)` 
                        : config.bg,
                      border: `2px solid ${config.border}`,
                      color: isActive ? '#ffffff' : config.color,
                      boxShadow: isActive 
                        ? `0 4px 15px ${config.border}, inset 0 1px 0 rgba(255,255,255,0.2)` 
                        : 'none'
                    }}
                  >
                    {isActive && (
                      <div 
                        className="absolute inset-0 opacity-30"
                        style={{
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                          backgroundSize: '200% 100%',
                          animation: 'shimmer 3s infinite'
                        }}
                      />
                    )}
                    <span className="text-lg relative z-10" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>
                      {config.icon}
                    </span>
                    <span className="text-sm relative z-10">{config.name}</span>
                    {isActive && (
                      <span 
                        className="w-2 h-2 bg-white rounded-full animate-pulse relative z-10"
                        style={{ boxShadow: '0 0 8px rgba(255,255,255,0.8)' }}
                      ></span>
                    )}
                  </button>
                );
              })}
            </div>
            
            {/* Active Role Indicator */}
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="text-gray-400">Active:</span>
              <span 
                className="font-bold"
                style={{ 
                  color: roleConfig[activeRole]?.color,
                  textShadow: `0 0 10px ${roleConfig[activeRole]?.border}`
                }}
              >
                {roleConfig[activeRole]?.name}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Side Menu Overlay */}
      {showMenu && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setShowMenu(false)}
        >
          <div 
            className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] p-6"
            style={{ background: '#07071a', borderLeft: '1px solid rgba(0,200,83,0.2)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Menu</h3>
              <button
                onClick={() => setShowMenu(false)}
                className="p-2 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                <XMarkIcon className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="space-y-2">
              <Link
                to="/profile"
                onClick={() => setShowMenu(false)}
                className="flex items-center gap-3 p-3 rounded-xl text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                <UserIcon className="w-5 h-5" />
                <span>Edit Profile</span>
              </Link>
              
              <Link
                to="/tournaments"
                onClick={() => setShowMenu(false)}
                className="flex items-center gap-3 p-3 rounded-xl text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                <TrophyIcon className="w-5 h-5" />
                <span>Browse Tournaments</span>
              </Link>
              
              <Link
                to="/leaderboard"
                onClick={() => setShowMenu(false)}
                className="flex items-center gap-3 p-3 rounded-xl text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                <ChartBarIcon className="w-5 h-5" />
                <span>Leaderboard</span>
              </Link>
              
              <Link
                to="/registrations"
                onClick={() => setShowMenu(false)}
                className="flex items-center gap-3 p-3 rounded-xl text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                <CalendarIcon className="w-5 h-5" />
                <span>My Registrations</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="px-4 py-6 max-w-md mx-auto relative z-10">
        
        {/* Profile Card */}
        <div 
          className="rounded-2xl p-5 mb-6 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(0,200,83,0.15) 0%, rgba(99,102,241,0.15) 100%)',
            border: '2px solid rgba(0,200,83,0.3)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0,200,83,0.2), inset 0 1px 0 rgba(255,255,255,0.1)'
          }}
        >
          {/* Animated Background Glow */}
          <div 
            className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-30"
            style={{ 
              background: 'radial-gradient(circle, rgba(0,255,136,0.6), transparent)',
              animation: 'glow 4s ease-in-out infinite'
            }}
          />
          <div 
            className="absolute bottom-0 left-0 w-32 h-32 rounded-full blur-3xl opacity-30"
            style={{ 
              background: 'radial-gradient(circle, rgba(99,102,241,0.6), transparent)',
              animation: 'glow 4s ease-in-out infinite reverse'
            }}
          />
          
          {/* Profile Photo & Name */}
          <div className="flex flex-col items-center text-center mb-5 relative z-10">
            <div 
              className="w-24 h-24 rounded-full flex items-center justify-center font-bold text-3xl mb-3 relative"
              style={{ 
                background: 'linear-gradient(135deg,#00c853,#00ff88)', 
                color: '#003320',
                boxShadow: '0 8px 25px rgba(0,200,83,0.5), 0 0 40px rgba(0,200,83,0.3), inset 0 2px 0 rgba(255,255,255,0.3)'
              }}
            >
              <div 
                className="absolute inset-0 rounded-full blur-xl opacity-60"
                style={{ 
                  background: 'radial-gradient(circle, rgba(0,200,83,0.8) 0%, transparent 70%)',
                  animation: 'glow 3s ease-in-out infinite'
                }}
              />
              {user?.profilePhoto ? (
                <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover rounded-full relative z-10" />
              ) : (
                <span className="relative z-10">{user?.name?.charAt(0)?.toUpperCase() || 'P'}</span>
              )}
            </div>
            
            <h2 
              className="text-2xl font-black mb-1"
              style={{ 
                background: 'linear-gradient(135deg, #ffffff, #00ff88)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textShadow: 'none',
                filter: 'drop-shadow(0 2px 10px rgba(0,200,83,0.3))'
              }}
            >
              {user?.name}
            </h2>
            
            {/* Role Badges with Shimmer */}
            <div className="flex flex-wrap gap-2 justify-center mb-3">
              {userRoles.map((role, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 rounded-full text-xs font-bold relative overflow-hidden"
                  style={{ 
                    background: roleConfig[role]?.bg, 
                    border: `2px solid ${roleConfig[role]?.border}`,
                    color: roleConfig[role]?.color,
                    boxShadow: `0 2px 10px ${roleConfig[role]?.border}`
                  }}
                >
                  <div 
                    className="absolute inset-0 opacity-20"
                    style={{
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 3s infinite'
                    }}
                  />
                  <span className="relative z-10">{role}</span>
                </span>
              ))}
            </div>
            
            <p className="text-sm text-gray-300 mb-1">{user?.email}</p>
            
            {user?.city && (
              <div className="flex items-center gap-1 text-sm text-gray-400">
                <MapPinIcon className="w-4 h-4" />
                <span>{user.city}, {user.state}</span>
              </div>
            )}
          </div>

          {/* Player & Umpire Codes */}
          <div className="space-y-3 mb-5 relative z-10">
            {playerCode && (
              <div 
                className="p-3 rounded-xl relative overflow-hidden"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(37,99,235,0.15))',
                  border: '2px solid rgba(59,130,246,0.4)',
                  boxShadow: '0 4px 15px rgba(59,130,246,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
                }}
              >
                <div 
                  className="absolute inset-0 opacity-20"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 4s infinite'
                  }}
                />
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <p className="text-xs font-bold mb-1" style={{ color: '#93c5fd' }}>Player Code:</p>
                    <p 
                      className="text-lg font-mono font-black tracking-wider"
                      style={{ 
                        color: '#60a5fa',
                        textShadow: '0 0 20px rgba(59,130,246,0.5)'
                      }}
                    >
                      {playerCode}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(playerCode);
                      alert('Player code copied!');
                    }}
                    className="p-2 rounded-lg transition-all"
                    style={{ 
                      background: 'rgba(59,130,246,0.3)',
                      border: '1px solid rgba(59,130,246,0.5)'
                    }}
                  >
                    <svg className="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
            
            {umpireCode && (
              <div 
                className="p-3 rounded-xl relative overflow-hidden"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(251,146,60,0.15))',
                  border: '2px solid rgba(245,158,11,0.4)',
                  boxShadow: '0 4px 15px rgba(245,158,11,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
                }}
              >
                <div 
                  className="absolute inset-0 opacity-20"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 4s infinite',
                    animationDelay: '1s'
                  }}
                />
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <p className="text-xs font-bold mb-1" style={{ color: '#fcd34d' }}>Umpire Code:</p>
                    <p 
                      className="text-lg font-mono font-black tracking-wider"
                      style={{ 
                        color: '#fbbf24',
                        textShadow: '0 0 20px rgba(245,158,11,0.5)'
                      }}
                    >
                      {umpireCode}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(umpireCode);
                      alert('Umpire code copied!');
                    }}
                    className="p-2 rounded-lg transition-all"
                    style={{ 
                      background: 'rgba(245,158,11,0.3)',
                      border: '1px solid rgba(245,158,11,0.5)'
                    }}
                  >
                    <svg className="w-5 h-5 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Edit Profile Button */}
          <Link
            to="/profile"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-all relative overflow-hidden group z-10"
            style={{ 
              background: 'linear-gradient(135deg, rgba(0,200,83,0.2), rgba(0,255,136,0.15))', 
              border: '2px solid rgba(0,200,83,0.4)',
              color: '#00ff88',
              boxShadow: '0 4px 15px rgba(0,200,83,0.2)'
            }}
          >
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'rgba(0,200,83,0.1)' }}
            />
            <UserIcon className="w-5 h-5 relative z-10" />
            <span className="relative z-10">Edit Profile</span>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {stats.map((stat, index) => {
            const colorSchemes = [
              { gradient: 'from-green-500 to-emerald-600', bg: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.15))', border: 'rgba(16,185,129,0.4)', shadow: 'rgba(16,185,129,0.3)' },
              { gradient: 'from-amber-500 to-orange-600', bg: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(251,146,60,0.15))', border: 'rgba(245,158,11,0.4)', shadow: 'rgba(245,158,11,0.3)' },
              { gradient: 'from-violet-500 to-purple-600', bg: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(168,85,247,0.15))', border: 'rgba(139,92,246,0.4)', shadow: 'rgba(139,92,246,0.3)' },
              { gradient: 'from-cyan-500 to-blue-600', bg: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(37,99,235,0.15))', border: 'rgba(6,182,212,0.4)', shadow: 'rgba(6,182,212,0.3)' }
            ];
            const scheme = colorSchemes[index];
            
            return (
              <div
                key={index}
                className="p-4 rounded-xl relative overflow-hidden"
                style={{
                  background: scheme.bg,
                  border: `2px solid ${scheme.border}`,
                  boxShadow: `0 4px 15px ${scheme.shadow}, inset 0 1px 0 rgba(255,255,255,0.1)`
                }}
              >
                <div 
                  className="absolute inset-0 opacity-20"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 4s infinite',
                    animationDelay: `${index * 0.5}s`
                  }}
                />
                <div 
                  className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br ${scheme.gradient} rounded-xl mb-3 relative z-10`}
                  style={{ 
                    boxShadow: `0 4px 12px ${scheme.shadow}, inset 0 1px 0 rgba(255,255,255,0.3)`
                  }}
                >
                  <stat.icon className="w-6 h-6 text-white" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
                </div>
                <p className="text-3xl font-black text-white mb-1 relative z-10">{stat.value}</p>
                <p className="text-xs text-gray-400 relative z-10">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Profile Information */}
        <div 
          className="rounded-2xl p-5 mb-6 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.15) 100%)',
            border: '2px solid rgba(99,102,241,0.3)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(99,102,241,0.2), inset 0 1px 0 rgba(255,255,255,0.1)'
          }}
        >
          {/* Animated Glow */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-3xl opacity-20"
            style={{ 
              background: 'radial-gradient(circle, rgba(139,92,246,0.8), transparent)',
              animation: 'glow 5s ease-in-out infinite'
            }}
          />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-5">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(139,92,246,0.2))',
                  border: '1px solid rgba(168,85,247,0.4)',
                  boxShadow: '0 4px 12px rgba(168,85,247,0.3)'
                }}
              >
                <UserIcon className="w-5 h-5 text-purple-300" />
              </div>
              <h3 
                className="text-lg font-black"
                style={{ 
                  background: 'linear-gradient(135deg, #ffffff, #c4b5fd)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                Profile Information
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-400 mb-1 font-semibold">Full Name</p>
                <p className="text-base font-bold text-white">{userProfile?.name || user?.name || 'N/A'}</p>
              </div>

              {(userProfile?.email || user?.email) && (
                <div>
                  <p className="text-xs text-gray-400 mb-1 font-semibold">Email Address</p>
                  <p className="text-sm font-semibold text-white break-all">{userProfile?.email || user?.email}</p>
                </div>
              )}

              {(userProfile?.phone || user?.phone) && (
                <div>
                  <p className="text-xs text-gray-400 mb-1 font-semibold">Phone Number</p>
                  <p className="text-base font-bold text-white">{userProfile?.phone || user?.phone}</p>
                </div>
              )}

              {((userProfile?.city || user?.city) || (userProfile?.state || user?.state)) && (
                <div>
                  <p className="text-xs text-gray-400 mb-1 font-semibold">Location</p>
                  <p className="text-base font-bold text-white">
                    {[userProfile?.city || user?.city, userProfile?.state || user?.state, 'India'].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}

              {(userProfile?.gender || user?.gender) && (
                <div>
                  <p className="text-xs text-gray-400 mb-1 font-semibold">Gender</p>
                  <p className="text-base font-bold text-white capitalize">{userProfile?.gender || user?.gender}</p>
                </div>
              )}

              {userProfile?.createdAt && (
                <div>
                  <p className="text-xs text-gray-400 mb-1 font-semibold">Member Since</p>
                  <p className="text-base font-bold text-white">
                    {new Date(userProfile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div 
          className="rounded-2xl overflow-hidden mb-6 relative"
          style={{
            background: 'linear-gradient(135deg, rgba(6,182,212,0.15) 0%, rgba(14,165,233,0.15) 100%)',
            border: '2px solid rgba(6,182,212,0.3)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(6,182,212,0.2), inset 0 1px 0 rgba(255,255,255,0.1)'
          }}
        >
          {/* Animated Glow */}
          <div 
            className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-20"
            style={{ 
              background: 'radial-gradient(circle, rgba(6,182,212,0.8), transparent)',
              animation: 'glow 4s ease-in-out infinite'
            }}
          />
          
          <div className="p-5 border-b flex items-center justify-between relative z-10" style={{ borderColor: 'rgba(6,182,212,0.2)' }}>
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(6,182,212,0.3), rgba(14,165,233,0.2))',
                  border: '1px solid rgba(6,182,212,0.4)',
                  boxShadow: '0 4px 12px rgba(6,182,212,0.3)'
                }}
              >
                <CalendarIcon className="w-5 h-5 text-cyan-300" />
              </div>
              <h3 
                className="text-lg font-black"
                style={{ 
                  background: 'linear-gradient(135deg, #ffffff, #67e8f9)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                Recent Activity
              </h3>
            </div>
            <Link
              to="/registrations"
              className="text-cyan-300 text-sm font-bold flex items-center gap-1 hover:text-cyan-200 transition-colors"
            >
              View All
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>

          <div className="p-5 relative z-10">
            {loading ? (
              <div className="flex justify-center py-8">
                <div 
                  className="w-10 h-10 border-4 rounded-full animate-spin"
                  style={{ 
                    borderColor: 'rgba(6,182,212,0.3)',
                    borderTopColor: '#22d3ee'
                  }}
                ></div>
              </div>
            ) : registrations.length === 0 ? (
              <div className="text-center py-8">
                <div 
                  className="text-5xl mb-3 inline-block"
                  style={{ 
                    filter: 'drop-shadow(0 0 20px rgba(0,200,83,0.6))',
                    animation: 'float 3s ease-in-out infinite'
                  }}
                >
                  🏸
                </div>
                <h4 className="text-base font-black text-white mb-2">No activity yet</h4>
                <p className="text-sm text-gray-300 mb-5">Join your first tournament!</p>
                <Link
                  to="/tournaments"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm relative overflow-hidden group"
                  style={{ 
                    background: 'linear-gradient(135deg, #00c853 0%, #00ff88 50%, #00c853 100%)',
                    backgroundSize: '200% auto',
                    color: '#003320',
                    boxShadow: '0 8px 25px rgba(0,200,83,0.4), 0 0 40px rgba(0,200,83,0.2), inset 0 1px 0 rgba(255,255,255,0.3)',
                    animation: 'shimmer 3s linear infinite'
                  }}
                >
                  <div 
                    className="absolute inset-0 opacity-0 group-active:opacity-100 transition-opacity"
                    style={{ background: 'radial-gradient(circle at center, rgba(255,255,255,0.3), transparent)' }}
                  />
                  <TrophyIcon className="w-5 h-5 relative z-10" />
                  <span className="relative z-10">Find Tournaments</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {registrations.slice(0, 3).map((reg) => (
                  <div
                    key={reg.id}
                    className="p-4 rounded-xl relative overflow-hidden"
                    style={{ 
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ 
                          background: 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(139,92,246,0.2))',
                          border: '1px solid rgba(168,85,247,0.4)',
                          boxShadow: '0 4px 12px rgba(168,85,247,0.3)'
                        }}
                      >
                        <span className="text-xl" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>🏆</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link 
                          to={`/tournaments/${reg.tournament?.id}`}
                          className="font-bold text-white hover:text-emerald-300 transition-colors block truncate"
                        >
                          {reg.tournament?.name || 'Tournament'}
                        </Link>
                        <p className="text-xs text-gray-400 mt-1 font-medium">
                          {reg.category?.name || 'Category'} • {new Date(reg.createdAt).toLocaleDateString('en-IN')}
                        </p>
                        <span className={`inline-block mt-2 px-3 py-1 rounded-lg text-xs font-bold ${
                          reg.status === 'confirmed' 
                            ? 'text-emerald-300'
                            : reg.status === 'pending'
                            ? 'text-amber-300'
                            : reg.status === 'rejected'
                            ? 'text-red-300'
                            : 'text-gray-300'
                        }`}
                        style={{
                          background: reg.status === 'confirmed' 
                            ? 'linear-gradient(135deg, rgba(16,185,129,0.3), rgba(5,150,105,0.2))'
                            : reg.status === 'pending'
                            ? 'linear-gradient(135deg, rgba(245,158,11,0.3), rgba(251,146,60,0.2))'
                            : reg.status === 'rejected'
                            ? 'linear-gradient(135deg, rgba(239,68,68,0.3), rgba(220,38,38,0.2))'
                            : 'linear-gradient(135deg, rgba(107,114,128,0.3), rgba(75,85,99,0.2))',
                          border: `1px solid ${
                            reg.status === 'confirmed' 
                              ? 'rgba(16,185,129,0.4)'
                              : reg.status === 'pending'
                              ? 'rgba(245,158,11,0.4)'
                              : reg.status === 'rejected'
                              ? 'rgba(239,68,68,0.4)'
                              : 'rgba(107,114,128,0.4)'
                          }`
                        }}>
                          {reg.status?.charAt(0).toUpperCase() + reg.status?.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div 
          className="rounded-2xl p-5 mb-6 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(251,146,60,0.15) 100%)',
            border: '2px solid rgba(245,158,11,0.3)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(245,158,11,0.2), inset 0 1px 0 rgba(255,255,255,0.1)'
          }}
        >
          {/* Animated Glow */}
          <div 
            className="absolute bottom-0 left-0 w-48 h-48 rounded-full blur-3xl opacity-20"
            style={{ 
              background: 'radial-gradient(circle, rgba(245,158,11,0.8), transparent)',
              animation: 'glow 4s ease-in-out infinite'
            }}
          />
          
          <div className="relative z-10">
            <h3 
              className="text-lg font-black mb-4"
              style={{ 
                background: 'linear-gradient(135deg, #ffffff, #fbbf24)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              Quick Actions
            </h3>
            <div className="space-y-3">
              <Link
                to="/tournaments"
                className="flex items-center gap-4 p-4 rounded-xl transition-all relative overflow-hidden group"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(37,99,235,0.15))',
                  border: '2px solid rgba(59,130,246,0.3)',
                  boxShadow: '0 4px 15px rgba(59,130,246,0.2)'
                }}
              >
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'rgba(59,130,246,0.1)' }}
                />
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 relative z-10"
                  style={{ 
                    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                    boxShadow: '0 4px 12px rgba(59,130,246,0.4), inset 0 1px 0 rgba(255,255,255,0.3)'
                  }}
                >
                  <TrophyIcon className="w-6 h-6 text-white" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
                </div>
                <div className="flex-1 relative z-10">
                  <p className="font-bold text-white text-sm">Browse Tournaments</p>
                  <p className="text-xs text-gray-300">Find your next competition</p>
                </div>
                <ArrowRightIcon className="w-5 h-5 text-blue-300 relative z-10" />
              </Link>

              <Link
                to="/leaderboard"
                className="flex items-center gap-4 p-4 rounded-xl transition-all relative overflow-hidden group"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(251,146,60,0.15))',
                  border: '2px solid rgba(245,158,11,0.3)',
                  boxShadow: '0 4px 15px rgba(245,158,11,0.2)'
                }}
              >
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'rgba(245,158,11,0.1)' }}
                />
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 relative z-10"
                  style={{ 
                    background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                    boxShadow: '0 4px 12px rgba(245,158,11,0.4), inset 0 1px 0 rgba(255,255,255,0.3)'
                  }}
                >
                  <ChartBarIcon className="w-6 h-6 text-white" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
                </div>
                <div className="flex-1 relative z-10">
                  <p className="font-bold text-white text-sm">Leaderboard</p>
                  <p className="text-xs text-gray-300">Check your ranking</p>
                </div>
                <ArrowRightIcon className="w-5 h-5 text-amber-300 relative z-10" />
              </Link>
            </div>
          </div>
        </div>

        {/* Footer Spacing */}
        <div className="h-6"></div>
      </div>
    </div>
  );
};

export default UnifiedDashboardMobile;
