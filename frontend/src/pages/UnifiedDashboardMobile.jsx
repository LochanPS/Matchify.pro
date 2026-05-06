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
    <div className="min-h-screen" style={{ background: '#07071a' }}>
      {/* Mobile Header */}
      <div 
        className="sticky top-0 z-50 backdrop-blur-md border-b"
        style={{ background: 'rgba(7,7,26,0.95)', borderColor: 'rgba(0,200,83,0.2)' }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <MatchifyLogo size={32} variant="icon" />
            <span className="font-bold text-lg" style={{ color: '#00c853' }}>matchify.pro</span>
          </div>

          {/* Right Icons */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/notifications')}
              className="p-2 rounded-lg transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              <BellIcon className="w-6 h-6 text-gray-400" />
            </button>
            
            {/* Profile Photo */}
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
              style={{ 
                background: 'linear-gradient(135deg,#00c853,#00ff88)', 
                color: '#003320' 
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
              className="p-2 rounded-lg transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              <Bars3Icon className="w-6 h-6 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Role Switcher - Only show if multiple roles */}
        {userRoles.length > 1 && (
          <div className="px-4 pb-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-gray-500 font-medium">YOUR ROLES:</span>
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
                    className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all flex-shrink-0"
                    style={{
                      background: isActive ? config.color : config.bg,
                      border: `1px solid ${config.border}`,
                      color: isActive ? '#ffffff' : config.color
                    }}
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
            
            {/* Active Role Indicator */}
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="text-gray-500">Active:</span>
              <span className="font-bold" style={{ color: roleConfig[activeRole]?.color }}>
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
      <div className="px-4 py-6 max-w-md mx-auto">
        
        {/* Profile Card */}
        <div 
          className="rounded-2xl p-5 mb-6"
          style={{
            background: 'rgba(13,26,42,0.8)',
            border: '1px solid rgba(0,200,83,0.2)',
            backdropFilter: 'blur(10px)',
          }}
        >
          {/* Profile Photo & Name */}
          <div className="flex flex-col items-center text-center mb-5">
            <div 
              className="w-24 h-24 rounded-full flex items-center justify-center font-bold text-3xl mb-3"
              style={{ 
                background: 'linear-gradient(135deg,#00c853,#00ff88)', 
                color: '#003320' 
              }}
            >
              {user?.profilePhoto ? (
                <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover rounded-full" />
              ) : (
                user?.name?.charAt(0)?.toUpperCase() || 'P'
              )}
            </div>
            
            <h2 className="text-2xl font-black text-white mb-1">{user?.name}</h2>
            
            {/* Role Badges */}
            <div className="flex flex-wrap gap-2 justify-center mb-3">
              {userRoles.map((role, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 rounded-full text-xs font-bold"
                  style={{ 
                    background: roleConfig[role]?.bg, 
                    border: `1px solid ${roleConfig[role]?.border}`,
                    color: roleConfig[role]?.color
                  }}
                >
                  {role}
                </span>
              ))}
            </div>
            
            <p className="text-sm text-gray-400 mb-1">{user?.email}</p>
            
            {user?.city && (
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <MapPinIcon className="w-4 h-4" />
                <span>{user.city}, {user.state}</span>
              </div>
            )}
          </div>

          {/* Player & Umpire Codes */}
          <div className="space-y-3 mb-5">
            {playerCode && (
              <div 
                className="p-3 rounded-xl"
                style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)' }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-blue-400/80 mb-1">Player Code:</p>
                    <p className="text-lg font-mono font-bold text-blue-400 tracking-wider">{playerCode}</p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(playerCode);
                      alert('Player code copied!');
                    }}
                    className="p-2 rounded-lg"
                    style={{ background: 'rgba(59,130,246,0.2)' }}
                  >
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
            
            {umpireCode && (
              <div 
                className="p-3 rounded-xl"
                style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-amber-400/80 mb-1">Umpire Code:</p>
                    <p className="text-lg font-mono font-bold text-amber-400 tracking-wider">{umpireCode}</p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(umpireCode);
                      alert('Umpire code copied!');
                    }}
                    className="p-2 rounded-lg"
                    style={{ background: 'rgba(245,158,11,0.2)' }}
                  >
                    <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-all"
            style={{ 
              background: 'rgba(255,255,255,0.05)', 
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#ffffff'
            }}
          >
            <UserIcon className="w-5 h-5" />
            Edit Profile
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="p-4 rounded-xl"
              style={{
                background: stat.bg,
                border: `1px solid ${stat.border}`
              }}
            >
              <div 
                className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl mb-3`}
              >
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-3xl font-black text-white mb-1">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Profile Information */}
        <div 
          className="rounded-2xl p-5 mb-6"
          style={{
            background: 'rgba(13,26,42,0.8)',
            border: '1px solid rgba(0,200,83,0.2)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div className="flex items-center gap-3 mb-5">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(168,85,247,0.2)' }}
            >
              <UserIcon className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Profile Information</h3>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Full Name</p>
              <p className="text-base font-semibold text-white">{userProfile?.name || user?.name || 'N/A'}</p>
            </div>

            {(userProfile?.email || user?.email) && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Email Address</p>
                <p className="text-sm font-medium text-white break-all">{userProfile?.email || user?.email}</p>
              </div>
            )}

            {(userProfile?.phone || user?.phone) && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Phone Number</p>
                <p className="text-base font-semibold text-white">{userProfile?.phone || user?.phone}</p>
              </div>
            )}

            {((userProfile?.city || user?.city) || (userProfile?.state || user?.state)) && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Location</p>
                <p className="text-base font-semibold text-white">
                  {[userProfile?.city || user?.city, userProfile?.state || user?.state, 'India'].filter(Boolean).join(', ')}
                </p>
              </div>
            )}

            {(userProfile?.gender || user?.gender) && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Gender</p>
                <p className="text-base font-semibold text-white capitalize">{userProfile?.gender || user?.gender}</p>
              </div>
            )}

            {userProfile?.createdAt && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Member Since</p>
                <p className="text-base font-semibold text-white">
                  {new Date(userProfile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div 
          className="rounded-2xl overflow-hidden mb-6"
          style={{
            background: 'rgba(13,26,42,0.8)',
            border: '1px solid rgba(0,200,83,0.2)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(6,182,212,0.2)' }}
              >
                <CalendarIcon className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Recent Activity</h3>
            </div>
            <Link
              to="/registrations"
              className="text-emerald-400 text-sm font-medium flex items-center gap-1"
            >
              View All
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>

          <div className="p-5">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : registrations.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🏸</div>
                <h4 className="text-base font-bold text-white mb-2">No activity yet</h4>
                <p className="text-sm text-gray-400 mb-5">Join your first tournament!</p>
                <Link
                  to="/tournaments"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm"
                  style={{ 
                    background: 'linear-gradient(135deg, #00c853, #00ff88)', 
                    color: '#003320' 
                  }}
                >
                  <TrophyIcon className="w-5 h-5" />
                  Find Tournaments
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {registrations.slice(0, 3).map((reg) => (
                  <div
                    key={reg.id}
                    className="p-4 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    <div className="flex items-start gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(168,85,247,0.2)' }}
                      >
                        <span className="text-xl">🏆</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link 
                          to={`/tournaments/${reg.tournament?.id}`}
                          className="font-semibold text-white hover:text-emerald-400 transition-colors block truncate"
                        >
                          {reg.tournament?.name || 'Tournament'}
                        </Link>
                        <p className="text-xs text-gray-500 mt-1">
                          {reg.category?.name || 'Category'} • {new Date(reg.createdAt).toLocaleDateString('en-IN')}
                        </p>
                        <span className={`inline-block mt-2 px-3 py-1 rounded-lg text-xs font-bold ${
                          reg.status === 'confirmed' 
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : reg.status === 'pending'
                            ? 'bg-amber-500/20 text-amber-400'
                            : reg.status === 'rejected'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-gray-600/50 text-gray-400'
                        }`}>
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
          className="rounded-2xl p-5 mb-6"
          style={{
            background: 'rgba(13,26,42,0.8)',
            border: '1px solid rgba(0,200,83,0.2)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link
              to="/tournaments"
              className="flex items-center gap-4 p-4 rounded-xl transition-all"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
              >
                <TrophyIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white text-sm">Browse Tournaments</p>
                <p className="text-xs text-gray-500">Find your next competition</p>
              </div>
              <ArrowRightIcon className="w-5 h-5 text-gray-500" />
            </Link>

            <Link
              to="/leaderboard"
              className="flex items-center gap-4 p-4 rounded-xl transition-all"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}
              >
                <ChartBarIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white text-sm">Leaderboard</p>
                <p className="text-xs text-gray-500">Check your ranking</p>
              </div>
              <ArrowRightIcon className="w-5 h-5 text-gray-500" />
            </Link>
          </div>
        </div>

        {/* Footer Spacing */}
        <div className="h-6"></div>
      </div>
    </div>
  );
};

export default UnifiedDashboardMobile;
