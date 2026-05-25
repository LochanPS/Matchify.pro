import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Strip internal placeholder email generated for phone-only users
const displayEmail = (email) =>
  email && !email.endsWith('@noemail.matchify.internal') ? email : null;
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../utils/api';
import MatchifyLogo from '../components/MatchifyLogo';
import PhotoViewer from '../components/PhotoViewer';
import Spinner from '../components/Spinner';
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
  const { user, logout } = useAuth();
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
  const [fetchError, setFetchError] = useState('');
  const [copied, setCopied] = useState(false);

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
      setFetchError('Failed to load dashboard data. Pull down to retry.');
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
    { label: 'Total Points', value: user?.totalPoints || 0, icon: SparklesIcon },
    { label: 'Tournaments', value: user?.tournamentsPlayed || 0, icon: TrophyIcon },
    { label: 'Matches Won', value: user?.matchesWon || 0, icon: FireIcon },
    { label: 'Win Rate', value: `${winRate}%`, icon: BoltIcon },
  ];

  const roleConfig = {
    PLAYER: {
      name: 'Player',
      icon: '🏸',
      color: '#F59E0B',
      bg: 'rgba(245,158,11,0.12)',
      border: 'rgba(245,158,11,0.35)'
    },
    ORGANIZER: {
      name: 'Organizer',
      icon: '🏆',
      color: '#8b5cf6',
      bg: 'rgba(139,92,246,0.12)',
      border: 'rgba(139,92,246,0.35)'
    },
    UMPIRE: {
      name: 'Umpire',
      icon: '⚖️',
      color: '#34D399',
      bg: 'rgba(16,185,129,0.12)',
      border: 'rgba(16,185,129,0.35)'
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden pt-16" style={{
      background: '#050810',
      backgroundImage: 'url(/bg-galaxy.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center top',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
    }}>

      {/* ── Dark overlay ── */}
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'rgba(5,8,16,0.72)', zIndex: 0 }} />

      {/* ── Copied toast ── */}
      {copied && (
        <div className="fixed top-20 left-1/2 z-[9999] px-4 py-2 rounded-xl text-sm font-bold shadow-xl"
          style={{ transform: 'translateX(-50%)', background: 'rgba(245,158,11,0.95)', color: '#001c26', pointerEvents: 'none' }}>
          ✓ Copied to clipboard!
        </div>
      )}

      {/* ── Fetch error banner ── */}
      {fetchError && (
        <div className="fixed top-20 left-1/2 z-[9998] px-4 py-2 rounded-xl text-xs font-semibold shadow-xl flex items-center gap-2"
          style={{ transform: 'translateX(-50%)', background: 'rgba(239,68,68,0.95)', color: 'white', whiteSpace: 'nowrap' }}>
          ⚠️ {fetchError}
          <button onClick={() => { setFetchError(''); fetchDashboardData(); }}
            className="underline ml-1">Retry</button>
        </div>
      )}

      {/* ── Ambient tint blobs ── */}
      <div className="fixed top-0 bottom-0 pointer-events-none overflow-hidden" style={{ left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '480px', zIndex: 1 }}>
        <div style={{ position: 'absolute', width: '440px', height: '440px', top: '-140px', right: '-120px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.13) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', width: '400px', height: '400px', bottom: '5%', left: '-120px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)', filter: 'blur(80px)' }} />
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -20px) scale(1.05); }
          50% { transform: translate(-15px, 15px) scale(0.95); }
          75% { transform: translate(15px, 10px) scale(1.02); }
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
              background: '#0a0f1e',
              border: '1px solid rgba(255,255,255,0.09)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
              animation: 'scaleIn 0.3s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative z-10 h-full flex flex-col p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <MatchifyLogo size={32} variant="icon" />
                  <h3 className="text-xl font-black text-white">Menu</h3>
                </div>
                <button
                  onClick={() => setShowMenu(false)}
                  className="p-2.5 rounded-xl transition-all relative overflow-hidden group"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.09)'
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
                className="rounded-xl p-5 mb-6"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, #0e7490, #0369a1)',
                      color: '#ffffff',
                      boxShadow: '0 0 0 2px #F59E0B, 0 4px 12px rgba(0,0,0,0.4)'
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
                    {displayEmail(user?.email)
                      ? <p className="text-sm truncate" style={{ color: 'rgba(255,255,255,0.45)' }}>{displayEmail(user.email)}</p>
                      : user?.phone
                        ? <p className="text-sm truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{user.phone}</p>
                        : null
                    }
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {[
                  { to: '/profile', label: 'Edit Profile', Icon: UserIcon },
                  { to: '/tournaments', label: 'Browse Tournaments', Icon: TrophyIcon },
                  { to: '/leaderboard', label: 'Leaderboard', Icon: ChartBarIcon },
                  { to: '/registrations', label: 'My Registrations', Icon: CalendarIcon },
                  { to: '/academies', label: 'Academies', Icon: UserIcon },
                ].map(({ to, label, Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setShowMenu(false)}
                    className="flex items-center gap-4 p-4 rounded-xl text-white transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.07)',
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.28)' }}
                    >
                      <Icon className="w-5 h-5" style={{ color: '#FCD34D' }} />
                    </div>
                    <span className="font-bold text-base flex-1">{label}</span>
                    <ArrowRightIcon className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }} />
                  </Link>
                ))}
              </div>

              {/* Footer - Logout Button */}
              <button
                onClick={() => {
                  setShowMenu(false);
                  logout();
                  navigate('/login');
                }}
                className="w-full flex items-center justify-center gap-2 p-4 rounded-xl font-bold text-base transition-all relative overflow-hidden group mt-6"
                style={{
                  background: 'rgba(239,68,68,0.12)',
                  border: '1.5px solid rgba(239,68,68,0.35)',
                  color: '#f87171',
                }}
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{ background: 'rgba(239,68,68,0.08)' }}
                />
                <span className="relative z-10">Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="px-4 py-6 max-w-md mx-auto relative z-10">

        {/* ── Quick Navigation ── */}
        <div className="mb-8" style={{ animation: 'fadeIn 0.5s ease-out both' }}>
          <div className="flex items-center gap-2 mb-4 px-1">
            <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)', letterSpacing: '0.15em' }}>Quick Access</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {/* Tournaments — cyan */}
            <Link to="/tournaments" className="flex flex-col items-center gap-2.5 p-4 rounded-2xl transition-all active:scale-95"
              style={{
                background: 'linear-gradient(145deg, rgba(245,158,11,0.24) 0%, rgba(245,158,11,0.10) 100%)',
                border: '1.5px solid rgba(245,158,11,0.58)',
                boxShadow: '0 4px 22px rgba(245,158,11,0.20), inset 0 1px 0 rgba(255,255,255,0.09)'
              }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #b45309 0%, #d97706 100%)',
                  border: '1px solid rgba(245,158,11,0.65)',
                  boxShadow: '0 4px 16px rgba(245,158,11,0.40)'
                }}>
                <TrophyIcon className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-black text-center" style={{ color: '#fcd34d', textShadow: '0 0 10px rgba(245,158,11,0.65)' }}>Tournaments</span>
            </Link>
            {/* Leaderboard — amber */}
            <Link to="/leaderboard" className="flex flex-col items-center gap-2.5 p-4 rounded-2xl transition-all active:scale-95"
              style={{
                background: 'linear-gradient(145deg, rgba(245,158,11,0.24) 0%, rgba(245,158,11,0.10) 100%)',
                border: '1.5px solid rgba(245,158,11,0.58)',
                boxShadow: '0 4px 22px rgba(245,158,11,0.20), inset 0 1px 0 rgba(255,255,255,0.09)'
              }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #b45309 0%, #d97706 100%)',
                  border: '1px solid rgba(245,158,11,0.65)',
                  boxShadow: '0 4px 16px rgba(245,158,11,0.40)'
                }}>
                <ChartBarIcon className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-black text-center" style={{ color: '#fcd34d', textShadow: '0 0 10px rgba(245,158,11,0.65)' }}>Leaderboard</span>
            </Link>
            {/* Academies — violet */}
            <Link to="/academies" className="flex flex-col items-center gap-2.5 p-4 rounded-2xl transition-all active:scale-95"
              style={{
                background: 'linear-gradient(145deg, rgba(139,92,246,0.24) 0%, rgba(139,92,246,0.10) 100%)',
                border: '1.5px solid rgba(139,92,246,0.58)',
                boxShadow: '0 4px 22px rgba(139,92,246,0.20), inset 0 1px 0 rgba(255,255,255,0.09)'
              }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%)',
                  border: '1px solid rgba(139,92,246,0.65)',
                  boxShadow: '0 4px 16px rgba(139,92,246,0.40)'
                }}>
                <UserIcon className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-black text-center" style={{ color: '#c4b5fd', textShadow: '0 0 10px rgba(139,92,246,0.65)' }}>Academies</span>
            </Link>
          </div>
        </div>

        {/* ── Matchify ID Hero ── */}
        {(matchifyCode || userProfile?.matchifyCode || user?.matchifyCode) && (
          <div className="mb-5 rounded-3xl overflow-hidden relative" style={{
            background: 'linear-gradient(135deg, #060f24 0%, #0b1a42 35%, #11093a 65%, #060f24 100%)',
            border: '1px solid rgba(245,158,11,0.30)',
            boxShadow: '0 0 48px rgba(245,158,11,0.14), 0 16px 48px rgba(0,0,0,0.65)',
            animation: 'fadeIn 0.6s ease-out 0.1s both',
          }}>
            {/* aurora glows */}
            <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 5% 90%, rgba(245,158,11,0.28) 0%, transparent 55%)' }} />
            <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 95% 10%, rgba(139,92,246,0.20) 0%, transparent 50%)' }} />
            {/* dot grid texture */}
            <div style={{ position:'absolute', inset:0, opacity:0.25,
              backgroundImage:'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)',
              backgroundSize:'20px 20px' }} />

            <div className="relative px-5 py-5 flex items-center justify-between">
              <div>
                <p style={{ fontSize:'10px', fontWeight:800, letterSpacing:'0.22em',
                  textTransform:'uppercase', color:'rgba(245,158,11,0.75)', marginBottom:'6px' }}>
                  Your Matchify ID
                </p>
                <p style={{
                  fontSize:'54px', fontWeight:900, fontFamily:'monospace',
                  lineHeight:1, letterSpacing:'-0.02em',
                  background:'linear-gradient(135deg, #ffffff 0%, #a5f3fc 40%, #FCD34D 100%)',
                  WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
                  filter:'drop-shadow(0 0 18px rgba(245,158,11,0.55))',
                }}>
                  {matchifyCode || userProfile?.matchifyCode || user?.matchifyCode}
                </p>
              </div>
              <button
                onClick={() => {
                  const code = matchifyCode || userProfile?.matchifyCode || user?.matchifyCode;
                  navigator.clipboard.writeText(code);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl transition-all flex-shrink-0"
                style={{
                  background: copied ? 'rgba(34,211,238,0.20)' : 'rgba(245,158,11,0.10)',
                  border: `1.5px solid ${copied ? 'rgba(34,211,238,0.55)' : 'rgba(245,158,11,0.32)'}`,
                }}>
                {copied
                  ? <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width:'20px', height:'20px', color:'#FCD34D' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  : <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width:'20px', height:'20px', color:'#FCD34D' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                }
                <span style={{ fontSize:'10px', fontWeight:700, letterSpacing:'0.08em',
                  textTransform:'uppercase', color: copied ? '#FCD34D' : 'rgba(245,158,11,0.65)' }}>
                  {copied ? 'Copied!' : 'Copy'}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* ── Profile Card ── */}
        <div className="rounded-3xl mb-6 overflow-hidden"
          style={{
            background: 'rgba(10,14,28,0.88)',
            border: '1px solid rgba(255,255,255,0.10)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            boxShadow: '0 12px 48px rgba(0,0,0,0.65)',
            animation: 'fadeIn 0.8s ease-out 0.2s both',
          }}>

          {/* ── Banner ── */}
          <div style={{ height: '100px', position: 'relative', overflow: 'hidden',
            background: 'linear-gradient(135deg, #0a1e3d 0%, #0e1b50 40%, #150d42 70%, #0a1a35 100%)' }}>
            {/* left glow */}
            <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 20% 60%, rgba(245,158,11,0.22) 0%, transparent 65%)' }} />
            {/* right glow */}
            <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 85% 40%, rgba(139,92,246,0.20) 0%, transparent 60%)' }} />
            {/* subtle dot grid */}
            <div style={{ position:'absolute', inset:0, opacity:0.4,
              backgroundImage:'radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)',
              backgroundSize:'22px 22px' }} />
            {/* bottom fade */}
            <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'52px',
              background:'linear-gradient(to bottom, transparent, rgba(10,14,28,0.95))' }} />
          </div>

          {/* ── Content ── */}
          <div className="px-5 pb-6">

            {/* Avatar */}
            <div className="flex flex-col items-center text-center">
              <button onClick={() => user?.profilePhoto && setShowPhotoViewer(true)}
                className="-mt-14 mb-4 relative flex-shrink-0" style={{ borderRadius:'50%' }}>
                {/* gradient ring */}
                <div className="w-[96px] h-[96px] rounded-full p-[3px] relative"
                  style={{ background:'linear-gradient(135deg, #FCD34D 0%, #a855f7 50%, #FCD34D 100%)' }}>
                  <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center font-black text-3xl text-white"
                    style={{ background:'linear-gradient(135deg, #0e7490, #0c4a6e)' }}>
                    {user?.profilePhoto
                      ? <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover" />
                      : <span>{user?.name?.charAt(0)?.toUpperCase() || 'P'}</span>}
                  </div>
                </div>
                {/* outer glow */}
                <div style={{ position:'absolute', inset:'-6px', borderRadius:'50%',
                  background:'linear-gradient(135deg, rgba(245,158,11,0.25), rgba(139,92,246,0.20))',
                  filter:'blur(10px)', zIndex:-1 }} />
              </button>

              {/* Name */}
              <h2 style={{ fontSize:'22px', fontWeight:900, color:'#ffffff', letterSpacing:'-0.01em', marginBottom:'4px' }}>
                {user?.name}
              </h2>

              {/* Email */}
              {displayEmail(user?.email) && (
                <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.42)', marginBottom:'4px' }}>
                  {displayEmail(user.email)}
                </p>
              )}

              {/* Location */}
              {user?.city && (
                <div className="flex items-center gap-1 mb-5">
                  <MapPinIcon className="w-3.5 h-3.5" style={{ color:'rgba(255,255,255,0.28)' }} />
                  <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.32)' }}>
                    {user.city}{user.state ? `, ${user.state}` : ''}
                  </span>
                </div>
              )}

              {/* Role switcher */}
              {userRoles.length > 1 && (
                <div className="flex gap-2 w-full mb-4">
                  {userRoles.map(role => {
                    const config = roleConfig[role];
                    if (!config) return null;
                    const isActive = role === activeRole;
                    return (
                      <button key={role} onClick={() => handleRoleSwitch(role)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl font-bold transition-all"
                        style={{
                          background: isActive
                            ? `linear-gradient(135deg, ${config.color}dd, ${config.color}99)`
                            : 'rgba(255,255,255,0.05)',
                          border: isActive ? `1.5px solid ${config.color}55` : '1.5px solid rgba(255,255,255,0.09)',
                          color: isActive ? '#ffffff' : 'rgba(255,255,255,0.38)',
                          fontSize: '12px',
                          boxShadow: isActive ? `0 4px 18px ${config.color}35` : 'none',
                        }}>
                        <span style={{ fontSize:'14px' }}>{config.icon}</span>
                        <span>{config.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Edit Profile — solid CTA */}
            <Link to="/profile"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-bold text-sm"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.85)',
                letterSpacing: '0.02em',
                transition: 'all 0.2s ease',
              }}>
              <UserIcon className="w-4 h-4" />
              Edit Profile
            </Link>
          </div>
        </div>

        {/* ── Role-Specific Stats ── */}
        {activeRole === 'PLAYER' && (
          <div
            className="rounded-2xl p-5 mb-6"
            style={{
              background: 'rgba(12,18,32,0.9)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 4px 28px rgba(0,0,0,0.4)',
              animation: 'slideUp 0.8s ease-out 0.4s both'
            }}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">🏸</span>
                  <h3 className="text-sm font-black text-white tracking-wide">PLAYER STATS</h3>
                </div>
                <Link to="/my-points" className="text-xs font-semibold"
                  style={{ color: 'rgba(255,255,255,0.35)', letterSpacing: '0.02em' }}>
                  View all →
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {stats.map((stat, index) => {
                  const tileAccents = [
                    { left: '#F59E0B', bg: 'rgba(245,158,11,0.08)', iconBg: 'rgba(245,158,11,0.15)', iconColor: '#FCD34D', numColor: '#FCD34D' },
                    { left: '#F59E0B', bg: 'rgba(245,158,11,0.08)',  iconBg: 'rgba(245,158,11,0.15)',  iconColor: '#FCD34D', numColor: '#67E8F9' },
                    { left: '#10B981', bg: 'rgba(16,185,129,0.08)', iconBg: 'rgba(16,185,129,0.15)', iconColor: '#34D399', numColor: '#6EE7B7' },
                    { left: '#8B5CF6', bg: 'rgba(139,92,246,0.08)', iconBg: 'rgba(139,92,246,0.15)', iconColor: '#A78BFA', numColor: '#C4B5FD' },
                  ][index];
                  return (
                    <div key={index} className="p-4 rounded-xl"
                      style={{
                        background: tileAccents.bg,
                        border: '1px solid rgba(255,255,255,0.07)',
                        borderLeft: `3px solid ${tileAccents.left}`,
                      }}>
                      <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg mb-3"
                        style={{ background: tileAccents.iconBg }}>
                        <stat.icon className="w-4 h-4" style={{ color: tileAccents.iconColor }} />
                      </div>
                      <p className="text-2xl font-black mb-0.5" style={{ color: tileAccents.numColor, letterSpacing: '-0.01em' }}>{stat.value}</p>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>{stat.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeRole === 'ORGANIZER' && (
          <>
          <div
            className="rounded-2xl p-5 mb-6"
            style={{
              background: 'rgba(12,18,32,0.9)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
              animation: 'slideUp 0.8s ease-out 0.4s both'
            }}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">🏆</span>
                  <h3 className="text-sm font-black text-white tracking-wide">ORGANIZER STATS</h3>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div
                  className="p-4 rounded-xl"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    borderTop: '1px solid rgba(255,255,255,0.09)',
                    borderRight: '1px solid rgba(255,255,255,0.09)',
                    borderBottom: '1px solid rgba(255,255,255,0.09)',
                    borderLeft: '3px solid #8b5cf6'
                  }}
                >
                  <div
                    className="inline-flex items-center justify-center w-11 h-11 rounded-xl mb-3"
                    style={{ background: 'rgba(139,92,246,0.14)', border: '1px solid rgba(139,92,246,0.32)' }}
                  >
                    <TrophyIcon className="w-6 h-6" style={{ color: '#a78bfa' }} />
                  </div>
                  <p className="text-3xl font-black mb-1 text-white">{user?.tournamentsOrganized || 0}</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.42)' }}>Tournaments Organized</p>
                </div>

                <div
                  className="p-4 rounded-xl"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    borderTop: '1px solid rgba(255,255,255,0.09)',
                    borderRight: '1px solid rgba(255,255,255,0.09)',
                    borderBottom: '1px solid rgba(255,255,255,0.09)',
                    borderLeft: '3px solid #6366f1'
                  }}
                >
                  <div
                    className="inline-flex items-center justify-center w-11 h-11 rounded-xl mb-3"
                    style={{ background: 'rgba(99,102,241,0.14)', border: '1px solid rgba(99,102,241,0.32)' }}
                  >
                    <UserIcon className="w-6 h-6" style={{ color: '#818cf8' }} />
                  </div>
                  <p className="text-3xl font-black mb-1 text-white">{user?.totalParticipants || 0}</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.42)' }}>Total Participants</p>
                </div>
              </div>

              <Link
                to="/tournaments/create"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm transition-all mt-4"
                style={{
                  background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
                  color: '#ffffff',
                  boxShadow: '0 4px 16px rgba(139,92,246,0.3)',
                }}
              >
                <TrophyIcon className="w-4 h-4" />
                <span>Create New Tournament</span>
              </Link>
            </div>
          </div>

          {/* My Tournaments Section */}
          {myTournaments.length > 0 && (
            <div
              className="rounded-2xl p-5 mb-6"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-black text-white">My Tournaments</h3>
                <Link
                  to="/organizer/history"
                  className="text-xs font-bold"
                  style={{ color: '#a78bfa' }}
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
                        background: isDraft ? 'rgba(251,191,36,0.05)' : 'rgba(139,92,246,0.05)',
                        border: `1px solid ${isDraft ? 'rgba(251,191,36,0.18)' : 'rgba(139,92,246,0.18)'}`,
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-white truncate">{t.name}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.42)' }}>
                            {t.city}{t.state ? `, ${t.state}` : ''} · {t.categories?.length || 0} categories
                          </p>
                        </div>
                        <span
                          className="flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{
                            background: isDraft ? 'rgba(251,191,36,0.12)' : 'rgba(139,92,246,0.12)',
                            color: isDraft ? '#fbbf24' : '#c4b5fd',
                            border: `1px solid ${isDraft ? 'rgba(251,191,36,0.28)' : 'rgba(139,92,246,0.28)'}`,
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
                          style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}
                        >
                          Edit
                        </Link>
                        {isDraft && (
                          <button
                            onClick={() => handlePublishTournament(t.id)}
                            disabled={publishingId === t.id || !hasCategories}
                            className="flex-1 py-1.5 rounded-lg text-xs font-black transition-all disabled:opacity-50"
                            style={{
                              background: hasCategories ? 'rgba(139,92,246,0.14)' : 'rgba(255,255,255,0.06)',
                              color: hasCategories ? '#c4b5fd' : 'rgba(255,255,255,0.3)',
                              border: hasCategories ? '1px solid rgba(139,92,246,0.24)' : '1px solid transparent',
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
            className="rounded-2xl p-5 mb-6"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
              animation: 'slideUp 0.8s ease-out 0.4s both'
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.1))',
                  border: '1.5px solid rgba(16,185,129,0.4)',
                  boxShadow: '0 2px 10px rgba(16,185,129,0.15)'
                }}
              >
                <span className="text-xl">⚖️</span>
              </div>
              <h3 className="text-lg font-black text-white">Umpire Stats</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl" style={{
                background: 'rgba(255,255,255,0.04)',
                borderTop: '1px solid rgba(255,255,255,0.09)',
                borderRight: '1px solid rgba(255,255,255,0.09)',
                borderBottom: '1px solid rgba(255,255,255,0.09)',
                borderLeft: '3px solid #34D399'
              }}>
                <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl mb-3"
                  style={{ background: 'rgba(16,185,129,0.14)', border: '1px solid rgba(16,185,129,0.32)' }}>
                  <FireIcon className="w-6 h-6" style={{ color: '#34D399' }} />
                </div>
                <p className="text-3xl font-black mb-1 text-white">{user?.matchesUmpired || 0}</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.42)' }}>Matches Umpired</p>
              </div>
              <div className="p-4 rounded-xl" style={{
                background: 'rgba(255,255,255,0.04)',
                borderTop: '1px solid rgba(255,255,255,0.09)',
                borderRight: '1px solid rgba(255,255,255,0.09)',
                borderBottom: '1px solid rgba(255,255,255,0.09)',
                borderLeft: '3px solid #6366f1'
              }}>
                <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl mb-3"
                  style={{ background: 'rgba(99,102,241,0.14)', border: '1px solid rgba(99,102,241,0.32)' }}>
                  <TrophyIcon className="w-6 h-6" style={{ color: '#818cf8' }} />
                </div>
                <p className="text-3xl font-black mb-1 text-white">{user?.tournamentsUmpired || 0}</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.42)' }}>Tournaments</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Profile Information ── */}
        <div
          className="rounded-2xl p-5 mb-6"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.10)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.32)',
            animation: 'fadeIn 0.8s ease-out 0.7s both'
          }}
        >
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(245,158,11,0.26), rgba(245,158,11,0.12))',
                  border: '1.5px solid rgba(245,158,11,0.50)',
                  boxShadow: '0 2px 10px rgba(245,158,11,0.20)'
                }}
              >
                <UserIcon className="w-5 h-5" style={{ color: '#FCD34D' }} />
              </div>
              <h3 className="text-lg font-black text-white">Profile Information</h3>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs mb-1 font-semibold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.32)' }}>Full Name</p>
                <p className="text-base font-bold text-white">{userProfile?.name || user?.name || 'N/A'}</p>
              </div>

              {(() => {
                const email = displayEmail(userProfile?.email) || displayEmail(user?.email);
                return email ? (
                  <div>
                    <p className="text-xs mb-1 font-semibold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.32)' }}>Email Address</p>
                    <p className="text-sm font-semibold text-white break-all">{email}</p>
                  </div>
                ) : null;
              })()}

              {(userProfile?.phone || user?.phone) && (
                <div>
                  <p className="text-xs mb-1 font-semibold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.32)' }}>Phone Number</p>
                  <p className="text-base font-bold text-white">{userProfile?.phone || user?.phone}</p>
                </div>
              )}

              {((userProfile?.city || user?.city) || (userProfile?.state || user?.state)) && (
                <div>
                  <p className="text-xs mb-1 font-semibold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.32)' }}>Location</p>
                  <p className="text-base font-bold text-white">
                    {[userProfile?.city || user?.city, userProfile?.state || user?.state, 'India'].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}

              {(userProfile?.gender || user?.gender) && (
                <div>
                  <p className="text-xs mb-1 font-semibold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.32)' }}>Gender</p>
                  <p className="text-base font-bold text-white capitalize">{userProfile?.gender || user?.gender}</p>
                </div>
              )}

              {userProfile?.createdAt && (
                <div>
                  <p className="text-xs mb-1 font-semibold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.32)' }}>Member Since</p>
                  <p className="text-base font-bold text-white">
                    {new Date(userProfile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Recent Activity ── */}
        <div
          className="rounded-2xl overflow-hidden mb-6"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.10)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.32)',
            animation: 'fadeIn 0.8s ease-out 0.8s both'
          }}
        >
          <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(249,115,22,0.26), rgba(249,115,22,0.12))',
                  border: '1.5px solid rgba(249,115,22,0.50)',
                  boxShadow: '0 2px 10px rgba(249,115,22,0.20)'
                }}
              >
                <CalendarIcon className="w-5 h-5" style={{ color: '#fb923c' }} />
              </div>
              <h3 className="text-lg font-black text-white">Recent Activity</h3>
            </div>
            <Link
              to="/registrations"
              className="text-sm font-bold flex items-center gap-1 transition-colors"
              style={{ color: '#fb923c' }}
            >
              View All
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>

          <div className="p-5">
            {loading ? (
              <div className="flex justify-center py-8">
                <Spinner size="lg" />
              </div>
            ) : registrations.length === 0 ? (
              <div className="text-center py-8">
                <div
                  className="text-5xl mb-3 inline-block"
                  style={{ opacity: 0.8 }}
                >
                  🏸
                </div>
                <h4 className="text-base font-black text-white mb-2">No activity yet</h4>
                <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.42)' }}>Join your first tournament!</p>
                <Link
                  to="/tournaments"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm"
                  style={{
                    background: 'rgba(245,158,11,0.09)',
                    border: '1px solid rgba(245,158,11,0.24)',
                    color: '#FCD34D',
                  }}
                >
                  <TrophyIcon className="w-5 h-5" />
                  <span>Find Tournaments</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {registrations.slice(0, 3).map((reg) => (
                  <div
                    key={reg.id}
                    className="p-4 rounded-xl"
                    style={{
                      background: 'linear-gradient(135deg, rgba(245,158,11,0.06) 0%, rgba(255,255,255,0.03) 100%)',
                      border: '1px solid rgba(245,158,11,0.22)',
                      borderLeft: '3px solid rgba(245,158,11,0.55)'
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                          background: 'linear-gradient(135deg, rgba(245,158,11,0.20), rgba(245,158,11,0.10))',
                          border: '1px solid rgba(245,158,11,0.38)'
                        }}
                      >
                        <span className="text-xl">🏆</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/tournaments/${reg.tournament?.id}`}
                          className="font-bold text-white transition-colors block truncate" onMouseEnter={e=>e.currentTarget.style.color='#FCD34D'} onMouseLeave={e=>e.currentTarget.style.color='#fff'}
                        >
                          {reg.tournament?.name || 'Tournament'}
                        </Link>
                        <p className="text-xs mt-1 font-medium" style={{ color: 'rgba(255,255,255,0.38)' }}>
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
                            ? 'rgba(245,158,11,0.12)'
                            : reg.status === 'pending'
                            ? 'rgba(245,158,11,0.1)'
                            : reg.status === 'rejected'
                            ? 'rgba(239,68,68,0.1)'
                            : 'rgba(255,255,255,0.06)',
                          border: `1px solid ${
                            reg.status === 'confirmed'
                              ? 'rgba(245,158,11,0.25)'
                              : reg.status === 'pending'
                              ? 'rgba(245,158,11,0.2)'
                              : reg.status === 'rejected'
                              ? 'rgba(239,68,68,0.2)'
                              : 'rgba(255,255,255,0.1)'
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

        {/* ── Quick Actions ── */}
        <div
          className="rounded-2xl p-5 mb-6"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.10)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.30)',
            animation: 'fadeIn 0.8s ease-out 0.9s both'
          }}
        >
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-1.5 h-4 rounded-full" style={{ background: 'linear-gradient(to bottom, #f97316, #a855f7)' }} />
            <h3 className="text-lg font-black text-white">Quick Actions</h3>
          </div>
          <div className="space-y-3">
            <Link
              to="/tournaments"
              className="flex items-center gap-4 p-4 rounded-xl transition-all relative overflow-hidden active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, rgba(245,158,11,0.14) 0%, rgba(245,158,11,0.06) 100%)',
                border: '1.5px solid rgba(245,158,11,0.40)',
                boxShadow: '0 2px 14px rgba(245,158,11,0.12)'
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #0e7490, #0284c7)',
                  boxShadow: '0 4px 16px rgba(245,158,11,0.38)',
                }}
              >
                <TrophyIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-black text-white text-sm">Browse Tournaments</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.48)' }}>Find your next competition</p>
              </div>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(245,158,11,0.18)', border: '1px solid rgba(245,158,11,0.35)' }}>
                <ArrowRightIcon className="w-4 h-4" style={{ color: '#FCD34D' }} />
              </div>
            </Link>

            <Link
              to="/leaderboard"
              className="flex items-center gap-4 p-4 rounded-xl transition-all relative overflow-hidden active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, rgba(245,158,11,0.14) 0%, rgba(245,158,11,0.06) 100%)',
                border: '1.5px solid rgba(245,158,11,0.40)',
                boxShadow: '0 2px 14px rgba(245,158,11,0.12)'
              }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #b45309, #d97706)', boxShadow: '0 4px 16px rgba(245,158,11,0.38)' }}>
                <ChartBarIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-black text-white text-sm">Leaderboard</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.48)' }}>Check your ranking</p>
              </div>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(245,158,11,0.18)', border: '1px solid rgba(245,158,11,0.35)' }}>
                <ArrowRightIcon className="w-4 h-4" style={{ color: '#fbbf24' }} />
              </div>
            </Link>

            <Link
              to="/my-points"
              className="flex items-center gap-4 p-4 rounded-xl transition-all relative overflow-hidden active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, rgba(249,115,22,0.14) 0%, rgba(249,115,22,0.06) 100%)',
                border: '1.5px solid rgba(249,115,22,0.40)',
                boxShadow: '0 2px 14px rgba(249,115,22,0.12)'
              }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #c2410c, #ea580c)', boxShadow: '0 4px 16px rgba(249,115,22,0.38)' }}>
                <SparklesIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-black text-white text-sm">My Points</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.48)' }}>Track your score & progress</p>
              </div>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(249,115,22,0.18)', border: '1px solid rgba(249,115,22,0.35)' }}>
                <ArrowRightIcon className="w-4 h-4" style={{ color: '#fb923c' }} />
              </div>
            </Link>

            <Link
              to="/live-matches"
              className="flex items-center gap-4 p-4 rounded-xl transition-all relative overflow-hidden active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, rgba(139,92,246,0.14) 0%, rgba(139,92,246,0.06) 100%)',
                border: '1.5px solid rgba(139,92,246,0.40)',
                boxShadow: '0 2px 14px rgba(139,92,246,0.12)'
              }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #6d28d9, #7c3aed)', boxShadow: '0 4px 16px rgba(139,92,246,0.38)' }}>
                <FireIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-black text-white text-sm">Live Matches</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.48)' }}>Watch ongoing matches</p>
              </div>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(139,92,246,0.18)', border: '1px solid rgba(139,92,246,0.35)' }}>
                <ArrowRightIcon className="w-4 h-4" style={{ color: '#a78bfa' }} />
              </div>
            </Link>
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

