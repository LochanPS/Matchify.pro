import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../utils/api';
import MatchifyLogo from '../components/MatchifyLogo';
import PhotoViewer from '../components/PhotoViewer';
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

// Pre-generated particle data — deterministic, no Math.random in render
const DASH_PARTICLES = Array.from({ length: 15 }, (_, i) => ({
  w: (i * 7 + 1) % 3 + 1,
  h: (i * 11 + 1) % 3 + 1,
  x: (i * 37 + 11) % 97,
  y: (i * 53 + 7) % 91,
  c: ['#00ff88', '#00d4ff', '#a855f7'][i % 3],
  o: ((i * 13) % 50) / 100 + 0.2,
  dur: (i * 7) % 8 + 4,
  delay: (i * 3) % 4,
  glow: (i * 11) % 15 + 5,
}));

const UnifiedDashboardMobile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matchifyCode, setMatchifyCode] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);
  const [myTournaments, setMyTournaments] = useState([]);
  const [publishingId, setPublishingId] = useState(null);

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
        setMatchifyCode(profileRes.data.user.matchifyCode);
      }

      setRegistrations(regRes.data.registrations || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyTournaments = async () => {
    try {
      const res = await api.get('/tournaments?myTournaments=true&limit=20');
      setMyTournaments(res.data.tournaments || []);
    } catch (err) {
      console.error('Error fetching my tournaments:', err);
    }
  };

  useEffect(() => {
    if (activeRole === 'ORGANIZER') {
      fetchMyTournaments();
    }
  }, [activeRole]);

  const handlePublishTournament = async (tournamentId) => {
    setPublishingId(tournamentId);
    try {
      await api.put(`/tournaments/${tournamentId}`, { status: 'published' });
      setMyTournaments(prev =>
        prev.map(t => t.id === tournamentId ? { ...t, status: 'published' } : t)
      );
    } catch (err) {
      console.error('Failed to publish:', err);
    } finally {
      setPublishingId(null);
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
    { label: 'Total Points', value: user?.totalPoints || 0, icon: SparklesIcon, gradient: 'linear-gradient(135deg,#f59e0b,#d97706)', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', val: '#fbbf24' },
    { label: 'Tournaments', value: user?.tournamentsPlayed || 0, icon: TrophyIcon, gradient: 'linear-gradient(135deg,#00ff88,#00d4ff)', bg: 'rgba(0,255,136,0.1)', border: 'rgba(0,255,136,0.2)', val: '#00ff88' },
    { label: 'Matches Won', value: user?.matchesWon || 0, icon: FireIcon, gradient: 'linear-gradient(135deg,#00ff88,#00d4ff)', bg: 'rgba(0,255,136,0.1)', border: 'rgba(0,255,136,0.2)', val: '#00ff88' },
    { label: 'Win Rate', value: `${winRate}%`, icon: BoltIcon, gradient: 'linear-gradient(135deg,#00bcd4,#00d4ff)', bg: 'rgba(0,212,255,0.1)', border: 'rgba(0,212,255,0.2)', val: '#00d4ff' },
  ];

  const roleConfig = {
    PLAYER: {
      name: 'Player',
      icon: '🏸',
      color: '#00ff88',
      bg: 'rgba(0,255,136,0.1)',
      border: 'rgba(0,255,136,0.3)'
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
    <div className="min-h-screen relative overflow-hidden pt-16" style={{ background: '#07071a' }}>
      {/* Animated Background Elements */}
      <div className="fixed top-0 bottom-0 pointer-events-none overflow-hidden" style={{ left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "480px" }}>
        {/* Large Gradient Orbs */}
        <div 
          className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-30 animate-pulse"
          style={{ 
            background: 'radial-gradient(circle, rgba(0,255,136,0.4) 0%, rgba(0,255,136,0.2) 40%, transparent 70%)',
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
        {DASH_PARTICLES.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${p.w}px`,
              height: `${p.h}px`,
              left: `${p.x}%`,
              top: `${p.y}%`,
              background: p.c,
              opacity: p.o,
              animation: `float ${p.dur}s ease-in-out infinite`,
              animationDelay: `${p.delay}s`,
              boxShadow: `0 0 ${p.glow}px ${p.c}`,
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
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          0% { opacity: 0; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes slideUp {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>

      {/* Side Menu Overlay */}
      {showMenu && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center"
          style={{ animation: 'fadeIn 0.3s ease-out' }}
          onClick={() => setShowMenu(false)}
        >
          <div 
            className="w-[90vw] max-w-md h-[85vh] relative overflow-hidden rounded-2xl"
            style={{ 
              background: 'linear-gradient(180deg, #07071a 0%, #0d1a2a 50%, #07071a 100%)',
              border: '2px solid rgba(0,255,136,0.3)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(0,255,136,0.2)',
              animation: 'scaleIn 0.3s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Animated Background Elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div 
                className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20"
                style={{ 
                  background: 'radial-gradient(circle, rgba(0,255,136,0.6), transparent)',
                  animation: 'glow 4s ease-in-out infinite'
                }}
              />
              <div 
                className="absolute bottom-0 left-0 w-64 h-64 rounded-full blur-3xl opacity-15"
                style={{ 
                  background: 'radial-gradient(circle, rgba(168,85,247,0.6), transparent)',
                  animation: 'glow 5s ease-in-out infinite reverse'
                }}
              />
            </div>

            <style>{`
              @keyframes slideInRight {
                0% { transform: translateX(100%); }
                100% { transform: translateX(0); }
              }
            `}</style>

            <div className="relative z-10 h-full flex flex-col p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div 
                      className="absolute inset-0 blur-lg opacity-60"
                      style={{ 
                        background: 'radial-gradient(circle, rgba(0,255,136,0.6) 0%, transparent 70%)',
                        animation: 'glow 3s ease-in-out infinite'
                      }}
                    />
                    <MatchifyLogo size={32} variant="icon" />
                  </div>
                  <h3 
                    className="text-xl font-black"
                    style={{ 
                      background: 'linear-gradient(135deg, #ffffff, #00ff88)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    Menu
                  </h3>
                </div>
                <button
                  onClick={() => setShowMenu(false)}
                  className="p-2.5 rounded-xl transition-all relative overflow-hidden group"
                  style={{ 
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.05))',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}
                >
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    style={{ background: 'rgba(255,255,255,0.05)' }}
                  />
                  <XMarkIcon className="w-6 h-6 text-gray-300 relative z-10" />
                </button>
              </div>

              {/* User Profile Section */}
              <div 
                className="rounded-xl p-5 mb-6 relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,255,136,0.15) 0%, rgba(99,102,241,0.15) 100%)',
                  border: '2px solid rgba(0,255,136,0.3)',
                  boxShadow: '0 4px 15px rgba(0,255,136,0.2), inset 0 1px 0 rgba(255,255,255,0.1)'
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
                <div className="flex items-center gap-4 relative z-10">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0"
                    style={{ 
                      background: 'linear-gradient(135deg,#00ff88,#00d4ff)', 
                      color: '#003320',
                      boxShadow: '0 4px 12px rgba(0,255,136,0.4), inset 0 1px 0 rgba(255,255,255,0.3)'
                    }}
                  >
                    {user?.profilePhoto ? (
                      <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      user?.name?.charAt(0)?.toUpperCase() || 'P'
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-black text-white truncate">{user?.name}</p>
                    <p className="text-sm text-gray-300 truncate">{user?.email}</p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                <Link
                  to="/profile"
                  onClick={() => setShowMenu(false)}
                  className="flex items-center gap-4 p-4 rounded-xl text-white transition-all relative overflow-hidden group"
                  style={{ 
                    background: 'linear-gradient(135deg, rgba(0,255,136,0.15), rgba(0,255,136,0.1))',
                    border: '2px solid rgba(0,255,136,0.3)',
                    boxShadow: '0 2px 10px rgba(0,255,136,0.1)'
                  }}
                >
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    style={{ background: 'rgba(0,255,136,0.1)' }}
                  />
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center relative z-10 flex-shrink-0"
                    style={{ 
                      background: 'linear-gradient(135deg, rgba(0,255,136,0.3), rgba(0,255,136,0.2))',
                      border: '1px solid rgba(0,255,136,0.4)',
                      boxShadow: '0 2px 8px rgba(0,255,136,0.3)'
                    }}
                  >
                    <UserIcon className="w-6 h-6 text-green-300" />
                  </div>
                  <span className="font-bold text-base relative z-10 flex-1">Edit Profile</span>
                  <ArrowRightIcon className="w-5 h-5 text-green-300 relative z-10 flex-shrink-0" />
                </Link>
                
                <Link
                  to="/tournaments"
                  onClick={() => setShowMenu(false)}
                  className="flex items-center gap-4 p-4 rounded-xl text-white transition-all relative overflow-hidden group"
                  style={{ 
                    background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(37,99,235,0.1))',
                    border: '2px solid rgba(59,130,246,0.3)',
                    boxShadow: '0 2px 10px rgba(59,130,246,0.1)'
                  }}
                >
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    style={{ background: 'rgba(59,130,246,0.1)' }}
                  />
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center relative z-10 flex-shrink-0"
                    style={{ 
                      background: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(37,99,235,0.2))',
                      border: '1px solid rgba(59,130,246,0.4)',
                      boxShadow: '0 2px 8px rgba(59,130,246,0.3)'
                    }}
                  >
                    <TrophyIcon className="w-6 h-6 text-blue-300" />
                  </div>
                  <span className="font-bold text-base relative z-10 flex-1">Browse Tournaments</span>
                  <ArrowRightIcon className="w-5 h-5 text-blue-300 relative z-10 flex-shrink-0" />
                </Link>
                
                <Link
                  to="/leaderboard"
                  onClick={() => setShowMenu(false)}
                  className="flex items-center gap-4 p-4 rounded-xl text-white transition-all relative overflow-hidden group"
                  style={{ 
                    background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(251,146,60,0.1))',
                    border: '2px solid rgba(245,158,11,0.3)',
                    boxShadow: '0 2px 10px rgba(245,158,11,0.1)'
                  }}
                >
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    style={{ background: 'rgba(245,158,11,0.1)' }}
                  />
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center relative z-10 flex-shrink-0"
                    style={{ 
                      background: 'linear-gradient(135deg, rgba(245,158,11,0.3), rgba(251,146,60,0.2))',
                      border: '1px solid rgba(245,158,11,0.4)',
                      boxShadow: '0 2px 8px rgba(245,158,11,0.3)'
                    }}
                  >
                    <ChartBarIcon className="w-6 h-6 text-amber-300" />
                  </div>
                  <span className="font-bold text-base relative z-10 flex-1">Leaderboard</span>
                  <ArrowRightIcon className="w-5 h-5 text-amber-300 relative z-10 flex-shrink-0" />
                </Link>
                
                <Link
                  to="/registrations"
                  onClick={() => setShowMenu(false)}
                  className="flex items-center gap-4 p-4 rounded-xl text-white transition-all relative overflow-hidden group"
                  style={{ 
                    background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(139,92,246,0.1))',
                    border: '2px solid rgba(168,85,247,0.3)',
                    boxShadow: '0 2px 10px rgba(168,85,247,0.1)'
                  }}
                >
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    style={{ background: 'rgba(168,85,247,0.1)' }}
                  />
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center relative z-10 flex-shrink-0"
                    style={{ 
                      background: 'linear-gradient(135deg, rgba(0,255,136,0.2), rgba(0,255,136,0.12))',
                      border: '1px solid rgba(0,255,136,0.3)',
                      boxShadow: '0 2px 8px rgba(0,255,136,0.2)'
                    }}
                  >
                    <CalendarIcon className="w-6 h-6 text-green-300" />
                  </div>
                  <span className="font-bold text-base relative z-10 flex-1">My Registrations</span>
                  <ArrowRightIcon className="w-5 h-5 text-green-300 relative z-10 flex-shrink-0" />
                </Link>

                <Link
                  to="/academies"
                  onClick={() => setShowMenu(false)}
                  className="flex items-center gap-4 p-4 rounded-xl text-white transition-all relative overflow-hidden group"
                  style={{ 
                    background: 'linear-gradient(135deg, rgba(0,255,136,0.1), rgba(5,150,105,0.1))',
                    border: '2px solid rgba(0,255,136,0.2)',
                    boxShadow: '0 2px 10px rgba(0,255,136,0.08)'
                  }}
                >
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    style={{ background: 'rgba(0,255,136,0.08)' }}
                  />
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center relative z-10 flex-shrink-0"
                    style={{ 
                      background: 'linear-gradient(135deg, rgba(0,255,136,0.2), rgba(0,255,136,0.12))',
                      border: '1px solid rgba(0,255,136,0.3)',
                      boxShadow: '0 2px 8px rgba(0,255,136,0.2)'
                    }}
                  >
                    <UserIcon className="w-6 h-6 text-green-300" />
                  </div>
                  <span className="font-bold text-base relative z-10 flex-1">Academies</span>
                  <ArrowRightIcon className="w-5 h-5 text-green-300 relative z-10 flex-shrink-0" />
                </Link>
              </div>

              {/* Footer - Logout Button */}
              <button
                onClick={() => {
                  setShowMenu(false);
                  // Add logout logic here
                  navigate('/logout');
                }}
                className="w-full flex items-center justify-center gap-2 p-4 rounded-xl font-bold text-base transition-all relative overflow-hidden group mt-6"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(220,38,38,0.15))', 
                  border: '2px solid rgba(239,68,68,0.4)',
                  color: '#f87171',
                  boxShadow: '0 4px 15px rgba(239,68,68,0.2)'
                }}
              >
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{ background: 'rgba(239,68,68,0.1)' }}
                />
                <span className="relative z-10">Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="px-4 py-6 max-w-md mx-auto relative z-10">
        
        {/* Quick Navigation — moved to top so visible immediately */}
        <div
          className="rounded-2xl p-5 mb-6 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(0,255,136,0.15) 0%, rgba(99,102,241,0.15) 100%)',
            border: '2px solid rgba(0,255,136,0.3)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0,255,136,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
            animation: 'fadeIn 0.5s ease-out both'
          }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-30"
            style={{ background: 'radial-gradient(circle, rgba(0,255,136,0.6), transparent)', animation: 'glow 4s ease-in-out infinite' }} />
          <div className="relative z-10">
            <h3 className="text-lg font-black mb-4"
              style={{ background: 'linear-gradient(135deg, #ffffff, #00ff88)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Quick Navigation
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <Link to="/tournaments" className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all relative overflow-hidden group"
                style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(37,99,235,0.15))', border: '2px solid rgba(59,130,246,0.3)', boxShadow: '0 4px 15px rgba(59,130,246,0.2)' }}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ background: 'rgba(59,130,246,0.1)' }} />
                <div className="w-12 h-12 rounded-xl flex items-center justify-center relative z-10"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 4px 12px rgba(59,130,246,0.4)' }}>
                  <TrophyIcon className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-bold text-white text-center relative z-10">Tournaments</span>
              </Link>
              <Link to="/leaderboard" className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all relative overflow-hidden group"
                style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(251,146,60,0.15))', border: '2px solid rgba(245,158,11,0.3)', boxShadow: '0 4px 15px rgba(245,158,11,0.2)' }}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ background: 'rgba(245,158,11,0.1)' }} />
                <div className="w-12 h-12 rounded-xl flex items-center justify-center relative z-10"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)', boxShadow: '0 4px 12px rgba(245,158,11,0.4)' }}>
                  <ChartBarIcon className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-bold text-white text-center relative z-10">Leaderboard</span>
              </Link>
              <Link to="/academies" className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all relative overflow-hidden group"
                style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(139,92,246,0.15))', border: '2px solid rgba(168,85,247,0.3)', boxShadow: '0 4px 15px rgba(168,85,247,0.2)' }}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ background: 'rgba(168,85,247,0.1)' }} />
                <div className="w-12 h-12 rounded-xl flex items-center justify-center relative z-10"
                  style={{ background: 'linear-gradient(135deg, #a855f7, #8b5cf6)', boxShadow: '0 4px 12px rgba(168,85,247,0.4)' }}>
                  <UserIcon className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-bold text-white text-center relative z-10">Academies</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <div 
          className="rounded-2xl p-5 mb-6 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(0,255,136,0.15) 0%, rgba(99,102,241,0.15) 100%)',
            border: '2px solid rgba(0,255,136,0.3)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0,255,136,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
            animation: 'fadeIn 0.8s ease-out 0.2s both'
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
            <button
              onClick={() => user?.profilePhoto && setShowPhotoViewer(true)}
              className="w-24 h-24 rounded-full flex items-center justify-center font-bold text-3xl mb-3 relative transition-all hover:scale-105 cursor-pointer group"
              style={{ 
                background: 'linear-gradient(135deg,#00ff88,#00d4ff)', 
                color: '#003320',
                boxShadow: '0 8px 25px rgba(0,255,136,0.5), 0 0 40px rgba(0,255,136,0.3), inset 0 2px 0 rgba(255,255,255,0.3)'
              }}
            >
              <div 
                className="absolute inset-0 rounded-full blur-xl opacity-60 pointer-events-none"
                style={{ 
                  background: 'radial-gradient(circle, rgba(0,255,136,0.8) 0%, transparent 70%)',
                  animation: 'glow 3s ease-in-out infinite'
                }}
              />
              {user?.profilePhoto ? (
                <>
                  <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover rounded-full relative z-10" />
                  {/* Hover Overlay */}
                  <div 
                    className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    <div className="text-center">
                      <svg className="w-8 h-8 text-white mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                      <span className="text-white text-xs font-bold">View</span>
                    </div>
                  </div>
                </>
              ) : (
                <span className="relative z-10">{user?.name?.charAt(0)?.toUpperCase() || 'P'}</span>
              )}
            </button>
            
            <h2 
              className="text-2xl font-black mb-1"
              style={{ 
                background: 'linear-gradient(135deg, #ffffff, #00ff88)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textShadow: 'none',
                filter: 'drop-shadow(0 2px 10px rgba(0,255,136,0.3))'
              }}
            >
              {user?.name}
            </h2>
            
            <p className="text-sm text-gray-300 mb-1">{user?.email}</p>
            
            {user?.city && (
              <div className="flex items-center gap-1 text-sm text-gray-400 mb-3">
                <MapPinIcon className="w-4 h-4" />
                <span>{user.city}, {user.state}</span>
              </div>
            )}
            
            {/* Matchify Code - Always show, with fallback */}
            <div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg mb-3 relative overflow-hidden"
              style={{ 
                background: 'linear-gradient(135deg, rgba(0,255,136,0.25), rgba(0,255,136,0.2))',
                border: '2px solid rgba(0,255,136,0.5)',
                boxShadow: '0 4px 12px rgba(0,255,136,0.4), inset 0 1px 0 rgba(255,255,255,0.2)'
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
              <div className="relative z-10">
                <p className="text-xs font-bold" style={{ color: '#6ee7b7' }}>Matchify ID</p>
                <p 
                  className="text-lg font-mono font-black tracking-wider"
                  style={{ 
                    color: '#00ff88',
                    textShadow: '0 0 15px rgba(0,255,136,0.6)'
                  }}
                >
                  {matchifyCode || userProfile?.matchifyCode || user?.matchifyCode || 'Loading...'}
                </p>
              </div>
              {(matchifyCode || userProfile?.matchifyCode || user?.matchifyCode) && (
                <button
                  onClick={() => {
                    const code = matchifyCode || userProfile?.matchifyCode || user?.matchifyCode;
                    navigator.clipboard.writeText(code);
                    alert('Matchify ID copied!');
                  }}
                  className="p-2 rounded-lg transition-all relative z-10"
                  style={{ 
                    background: 'rgba(0,255,136,0.3)',
                    border: '1px solid rgba(0,255,136,0.6)'
                  }}
                  title="Copy Matchify ID"
                >
                  <svg className="w-5 h-5 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              )}
            </div>
            
            {/* Compact Role Switcher - Only if multiple roles */}
            {userRoles.length > 1 && (
              <div className="flex items-center justify-center gap-2 mb-3">
                {userRoles.map((role) => {
                  const config = roleConfig[role];
                  if (!config) return null;
                  
                  const isActive = role === activeRole;
                  
                  return (
                    <button
                      key={role}
                      onClick={() => handleRoleSwitch(role)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all relative overflow-hidden"
                      style={{
                        background: isActive 
                          ? `linear-gradient(135deg, ${config.color}, ${config.color}dd)` 
                          : config.bg,
                        border: `1.5px solid ${config.border}`,
                        color: isActive ? '#ffffff' : config.color,
                        boxShadow: isActive 
                          ? `0 2px 10px ${config.border}, inset 0 1px 0 rgba(255,255,255,0.2)` 
                          : 'none',
                        fontSize: '11px'
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
                      <span className="text-sm relative z-10">{config.icon}</span>
                      <span className="relative z-10">{config.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Matchify Code */}
          <div className="mb-5 relative z-10">
            {matchifyCode && (
              <div 
                className="p-4 rounded-xl relative overflow-hidden"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(0,255,136,0.2), rgba(0,255,136,0.15))',
                  border: '2px solid rgba(0,255,136,0.4)',
                  boxShadow: '0 4px 15px rgba(0,255,136,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
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
                    <p className="text-xs font-bold mb-1" style={{ color: '#6ee7b7' }}>Matchify Code:</p>
                    <p 
                      className="text-2xl font-mono font-black tracking-wider"
                      style={{ 
                        color: '#00ff88',
                        textShadow: '0 0 20px rgba(0,255,136,0.5)'
                      }}
                    >
                      {matchifyCode}
                    </p>
                    <p className="text-xs mt-1" style={{ color: '#6ee7b7' }}>
                      Your universal Matchify.pro ID
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(matchifyCode);
                      alert('Matchify code copied!');
                    }}
                    className="p-3 rounded-lg transition-all"
                    style={{ 
                      background: 'rgba(0,255,136,0.3)',
                      border: '1px solid rgba(0,255,136,0.5)'
                    }}
                  >
                    <svg className="w-6 h-6 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              background: 'linear-gradient(135deg, rgba(0,255,136,0.2), rgba(0,255,136,0.15))', 
              border: '2px solid rgba(0,255,136,0.4)',
              color: '#00ff88',
              boxShadow: '0 4px 15px rgba(0,255,136,0.2)'
            }}
          >
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'rgba(0,255,136,0.1)' }}
            />
            <UserIcon className="w-5 h-5 relative z-10" />
            <span className="relative z-10">Edit Profile</span>
          </Link>
        </div>

        {/* Role-Specific Stats */}
        {activeRole === 'PLAYER' && (
          <div 
            className="rounded-2xl p-5 mb-6 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(0,255,136,0.15) 0%, rgba(0,255,136,0.1) 100%)',
              border: '2px solid rgba(0,255,136,0.3)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(0,255,136,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
              animation: 'slideUp 0.8s ease-out 0.4s both'
            }}
          >
            {/* Animated Glow */}
            <div 
              className="absolute bottom-0 left-0 w-48 h-48 rounded-full blur-3xl opacity-20"
              style={{ 
                background: 'radial-gradient(circle, rgba(0,255,136,0.8), transparent)',
                animation: 'glow 4s ease-in-out infinite'
              }}
            />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ 
                    background: 'linear-gradient(135deg, rgba(0,255,136,0.3), rgba(0,255,136,0.2))',
                    border: '1px solid rgba(0,255,136,0.4)',
                    boxShadow: '0 4px 12px rgba(0,255,136,0.3)'
                  }}
                >
                  <span className="text-xl">🏸</span>
                </div>
                <h3 
                  className="text-lg font-black"
                  style={{ 
                    background: 'linear-gradient(135deg, #ffffff, #00ff88)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  Player Stats
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {stats.map((stat, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl relative overflow-hidden"
                    style={{
                      background: stat.bg,
                      border: `1px solid ${stat.border}`,
                      animation: `scaleIn 0.5s ease-out ${0.5 + index * 0.1}s both`
                    }}
                  >
                    <div
                      className="inline-flex items-center justify-center w-11 h-11 rounded-xl mb-3 relative z-10"
                      style={{ background: stat.gradient }}
                    >
                      <stat.icon className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-3xl font-black text-white mb-1 relative z-10">{stat.value}</p>
                    <p className="text-xs relative z-10" style={{ color: 'rgba(255,255,255,0.55)' }}>{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeRole === 'ORGANIZER' && (
          <>
          <div
            className="rounded-2xl p-5 mb-6 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(139,92,246,0.15) 100%)',
              border: '2px solid rgba(168,85,247,0.3)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(168,85,247,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
              animation: 'slideUp 0.8s ease-out 0.4s both'
            }}
          >
            {/* Animated Glow */}
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-3xl opacity-20"
              style={{ 
                background: 'radial-gradient(circle, rgba(168,85,247,0.8), transparent)',
                animation: 'glow 5s ease-in-out infinite'
              }}
            />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ 
                    background: 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(139,92,246,0.2))',
                    border: '1px solid rgba(168,85,247,0.4)',
                    boxShadow: '0 4px 12px rgba(168,85,247,0.3)'
                  }}
                >
                  <span className="text-xl">🏆</span>
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
                  Organizer Stats
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div
                  className="p-4 rounded-xl relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(139,92,246,0.15))',
                    border: '2px solid rgba(168,85,247,0.4)',
                    boxShadow: '0 4px 15px rgba(168,85,247,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
                    animation: 'scaleIn 0.5s ease-out 0.5s both'
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
                  <div
                    className="inline-flex items-center justify-center w-11 h-11 rounded-xl mb-3 relative z-10"
                    style={{ background: 'linear-gradient(135deg,#00ff88,#00d4ff)', boxShadow: '0 4px 12px rgba(0,255,136,0.25)' }}
                  >
                    <TrophyIcon className="w-6 h-6 text-white" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
                  </div>
                  <p className="text-3xl font-black text-white mb-1 relative z-10">{user?.tournamentsOrganized || 0}</p>
                  <p className="text-xs relative z-10" style={{ color: 'rgba(255,255,255,0.55)' }}>Tournaments Organized</p>
                </div>

                <div
                  className="p-4 rounded-xl relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0,255,136,0.1), rgba(0,255,136,0.1))',
                    border: '2px solid rgba(0,255,136,0.3)',
                    boxShadow: '0 4px 15px rgba(0,255,136,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
                    animation: 'scaleIn 0.5s ease-out 0.6s both'
                  }}
                >
                  <div 
                    className="absolute inset-0 opacity-20"
                    style={{
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 4s infinite',
                      animationDelay: '0.5s'
                    }}
                  />
                  <div
                    className="inline-flex items-center justify-center w-11 h-11 rounded-xl mb-3 relative z-10"
                    style={{ background: 'linear-gradient(135deg,#00ff88,#00d4ff)', boxShadow: '0 4px 12px rgba(0,255,136,0.25)' }}
                  >
                    <UserIcon className="w-6 h-6 text-white" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
                  </div>
                  <p className="text-3xl font-black text-white mb-1 relative z-10">{user?.totalParticipants || 0}</p>
                  <p className="text-xs relative z-10" style={{ color: 'rgba(255,255,255,0.55)' }}>Total Participants</p>
                </div>
              </div>

              <Link
                to="/tournaments/create"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-all relative overflow-hidden group mt-4"
                style={{
                  background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(139,92,246,0.15))',
                  border: '2px solid rgba(168,85,247,0.4)',
                  color: '#c4b5fd',
                  boxShadow: '0 4px 15px rgba(168,85,247,0.2)'
                }}
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{ background: 'rgba(168,85,247,0.1)' }}
                />
                <TrophyIcon className="w-5 h-5 relative z-10" />
                <span className="relative z-10">Create New Tournament</span>
              </Link>
            </div>
          </div>

          {/* My Tournaments Section */}
          {myTournaments.length > 0 && (
            <div
              className="rounded-2xl p-5 mb-6"
              style={{
                background: 'linear-gradient(135deg, rgba(168,85,247,0.08) 0%, rgba(88,28,135,0.08) 100%)',
                border: '1px solid rgba(168,85,247,0.25)',
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-black text-white">My Tournaments</h3>
                <Link
                  to="/organizer/history"
                  className="text-xs font-bold"
                  style={{ color: '#a855f7' }}
                >
                  View All →
                </Link>
              </div>

              <div className="space-y-3">
                {myTournaments.slice(0, 5).map(t => {
                  const isDraft = t.status === 'draft';
                  const hasCategories = (t.categories?.length || 0) > 0;
                  return (
                    <div
                      key={t.id}
                      className="rounded-xl p-3"
                      style={{
                        background: isDraft ? 'rgba(251,191,36,0.06)' : 'rgba(0,255,136,0.06)',
                        border: `1px solid ${isDraft ? 'rgba(251,191,36,0.2)' : 'rgba(0,255,136,0.2)'}`,
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-white truncate">{t.name}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                            {t.city}{t.state ? `, ${t.state}` : ''} · {t.categories?.length || 0} categories
                          </p>
                        </div>
                        <span
                          className="flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{
                            background: isDraft ? 'rgba(251,191,36,0.15)' : 'rgba(0,255,136,0.15)',
                            color: isDraft ? '#fbbf24' : '#00ff88',
                            border: `1px solid ${isDraft ? 'rgba(251,191,36,0.3)' : 'rgba(0,255,136,0.3)'}`,
                          }}
                        >
                          {isDraft ? 'Draft' : t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                        </span>
                      </div>

                      <div className="flex gap-2 mt-2.5">
                        <Link
                          to={`/tournaments/${t.id}`}
                          className="flex-1 text-center py-1.5 rounded-lg text-xs font-bold transition-all"
                          style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}
                        >
                          View
                        </Link>
                        <Link
                          to={`/tournaments/${t.id}/edit`}
                          className="flex-1 text-center py-1.5 rounded-lg text-xs font-bold transition-all"
                          style={{ background: 'rgba(168,85,247,0.15)', color: '#c4b5fd', border: '1px solid rgba(168,85,247,0.25)' }}
                        >
                          Edit
                        </Link>
                        {isDraft && (
                          <button
                            onClick={() => handlePublishTournament(t.id)}
                            disabled={publishingId === t.id || !hasCategories}
                            className="flex-1 py-1.5 rounded-lg text-xs font-black transition-all disabled:opacity-50"
                            style={{
                              background: hasCategories ? 'linear-gradient(135deg,#00ff88,#00d4ff)' : 'rgba(255,255,255,0.06)',
                              color: hasCategories ? '#07071a' : 'rgba(255,255,255,0.3)',
                            }}
                            title={!hasCategories ? 'Add categories first' : 'Publish tournament'}
                          >
                            {publishingId === t.id ? '...' : '🚀 Publish'}
                          </button>
                        )}
                      </div>
                      {isDraft && !hasCategories && (
                        <p className="text-xs mt-1.5" style={{ color: 'rgba(251,191,36,0.7)' }}>
                          ⚠️ Add categories before publishing
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          </>
        )}

        {activeRole === 'UMPIRE' && (
          <div 
            className="rounded-2xl p-5 mb-6 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.15) 100%)',
              border: '2px solid rgba(59,130,246,0.3)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(59,130,246,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
              animation: 'slideUp 0.8s ease-out 0.4s both'
            }}
          >
            {/* Animated Glow */}
            <div 
              className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-20"
              style={{ 
                background: 'radial-gradient(circle, rgba(59,130,246,0.8), transparent)',
                animation: 'glow 4s ease-in-out infinite'
              }}
            />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ 
                    background: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(37,99,235,0.2))',
                    border: '1px solid rgba(59,130,246,0.4)',
                    boxShadow: '0 4px 12px rgba(59,130,246,0.3)'
                  }}
                >
                  <span className="text-xl">⚖️</span>
                </div>
                <h3 
                  className="text-lg font-black"
                  style={{ 
                    background: 'linear-gradient(135deg, #ffffff, #93c5fd)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  Umpire Stats
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div
                  className="p-4 rounded-xl relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(37,99,235,0.15))',
                    border: '2px solid rgba(59,130,246,0.4)',
                    boxShadow: '0 4px 15px rgba(59,130,246,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
                    animation: 'scaleIn 0.5s ease-out 0.5s both'
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
                  <div
                    className="inline-flex items-center justify-center w-11 h-11 rounded-xl mb-3 relative z-10"
                    style={{ background: 'linear-gradient(135deg,#00ff88,#00d4ff)', boxShadow: '0 4px 12px rgba(0,255,136,0.25)' }}
                  >
                    <FireIcon className="w-6 h-6 text-white" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
                  </div>
                  <p className="text-3xl font-black text-white mb-1 relative z-10">{user?.matchesUmpired || 0}</p>
                  <p className="text-xs relative z-10" style={{ color: 'rgba(255,255,255,0.55)' }}>Matches Umpired</p>
                </div>

                <div
                  className="p-4 rounded-xl relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0,255,136,0.1), rgba(0,255,136,0.1))',
                    border: '2px solid rgba(0,255,136,0.3)',
                    boxShadow: '0 4px 15px rgba(0,255,136,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
                    animation: 'scaleIn 0.5s ease-out 0.6s both'
                  }}
                >
                  <div 
                    className="absolute inset-0 opacity-20"
                    style={{
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 4s infinite',
                      animationDelay: '0.5s'
                    }}
                  />
                  <div
                    className="inline-flex items-center justify-center w-11 h-11 rounded-xl mb-3 relative z-10"
                    style={{ background: 'linear-gradient(135deg,#00ff88,#00d4ff)', boxShadow: '0 4px 12px rgba(0,255,136,0.25)' }}
                  >
                    <TrophyIcon className="w-6 h-6 text-white" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
                  </div>
                  <p className="text-3xl font-black text-white mb-1 relative z-10">{user?.tournamentsUmpired || 0}</p>
                  <p className="text-xs relative z-10" style={{ color: 'rgba(255,255,255,0.55)' }}>Tournaments</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile Information */}
        <div 
          className="rounded-2xl p-5 mb-6 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(0,255,136,0.1) 0%, rgba(0,255,136,0.1) 100%)',
            border: '2px solid rgba(0,255,136,0.2)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(99,102,241,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
            animation: 'fadeIn 0.8s ease-out 0.7s both'
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
                  background: 'linear-gradient(135deg, rgba(0,255,136,0.2), rgba(0,255,136,0.12))',
                  border: '1px solid rgba(0,255,136,0.3)',
                  boxShadow: '0 4px 12px rgba(0,255,136,0.2)'
                }}
              >
                <UserIcon className="w-5 h-5 text-green-300" />
              </div>
              <h3 
                className="text-lg font-black"
                style={{ 
                  background: 'linear-gradient(135deg, #ffffff, #6ee7b7)',
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
            boxShadow: '0 8px 32px rgba(6,182,212,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
            animation: 'fadeIn 0.8s ease-out 0.8s both'
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
                  background: 'linear-gradient(135deg, rgba(0,255,136,0.2), rgba(0,255,136,0.12))',
                  border: '1px solid rgba(0,255,136,0.3)',
                  boxShadow: '0 4px 12px rgba(0,255,136,0.2)'
                }}
              >
                <CalendarIcon className="w-5 h-5 text-green-300" />
              </div>
              <h3 
                className="text-lg font-black"
                style={{ 
                  background: 'linear-gradient(135deg, #ffffff, #6ee7b7)',
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
              className="text-green-300 text-sm font-bold flex items-center gap-1 hover:text-emerald-200 transition-colors"
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
                    borderColor: 'rgba(0,255,136,0.2)',
                    borderTopColor: '#10b981'
                  }}
                ></div>
              </div>
            ) : registrations.length === 0 ? (
              <div className="text-center py-8">
                <div 
                  className="text-5xl mb-3 inline-block"
                  style={{ 
                    filter: 'drop-shadow(0 0 20px rgba(0,255,136,0.6))',
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
                    background: 'linear-gradient(135deg, #00ff88 0%, #00d4ff 50%, #00ff88 100%)',
                    backgroundSize: '200% auto',
                    color: '#003320',
                    boxShadow: '0 8px 25px rgba(0,255,136,0.4), 0 0 40px rgba(0,255,136,0.2), inset 0 1px 0 rgba(255,255,255,0.3)',
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
                          className="font-bold text-white hover:text-green-300 transition-colors block truncate"
                        >
                          {reg.tournament?.name || 'Tournament'}
                        </Link>
                        <p className="text-xs text-gray-400 mt-1 font-medium">
                          {reg.category?.name || 'Category'} • {new Date(reg.createdAt).toLocaleDateString('en-IN')}
                        </p>
                        <span className={`inline-block mt-2 px-3 py-1 rounded-lg text-xs font-bold ${
                          reg.status === 'confirmed' 
                            ? 'text-green-300'
                            : reg.status === 'pending'
                            ? 'text-amber-300'
                            : reg.status === 'rejected'
                            ? 'text-red-300'
                            : 'text-gray-300'
                        }`}
                        style={{
                          background: reg.status === 'confirmed' 
                            ? 'linear-gradient(135deg, rgba(0,255,136,0.2), rgba(0,255,136,0.12))'
                            : reg.status === 'pending'
                            ? 'linear-gradient(135deg, rgba(245,158,11,0.3), rgba(251,146,60,0.2))'
                            : reg.status === 'rejected'
                            ? 'linear-gradient(135deg, rgba(239,68,68,0.3), rgba(220,38,38,0.2))'
                            : 'linear-gradient(135deg, rgba(107,114,128,0.3), rgba(75,85,99,0.2))',
                          border: `1px solid ${
                            reg.status === 'confirmed' 
                              ? 'rgba(0,255,136,0.3)'
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
            boxShadow: '0 8px 32px rgba(245,158,11,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
            animation: 'fadeIn 0.8s ease-out 0.9s both'
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

      {/* Photo Viewer Modal */}
      <PhotoViewer
        isOpen={showPhotoViewer}
        onClose={() => setShowPhotoViewer(false)}
        photoUrl={user?.profilePhoto}
        userName={user?.name}
      />
    </div>
  );
};

export default UnifiedDashboardMobile;
