import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Strip internal placeholder email generated for phone-only users
const displayEmail = (email) =>
  email && !email.endsWith('@noemail.matchify.internal') ? email : null;
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
  CalendarIcon,
  ArrowRightIcon,
  XMarkIcon,
  StarIcon,
  BellIcon,
} from '@heroicons/react/24/outline';

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  page:    '#08090e',
  s1:      '#0d0f18',   // card surface
  s2:      '#111520',   // elevated surface
  s3:      '#171c2a',   // hover / active surface
  border:  'rgba(255,255,255,0.07)',
  borderS: 'rgba(255,255,255,0.04)',
  txt:     '#f1f5f9',
  txt2:    'rgba(255,255,255,0.50)',
  txt3:    'rgba(255,255,255,0.28)',
  txt4:    'rgba(255,255,255,0.16)',
  cyan:    '#06b6d4',   // PRIMARY accent — used sparingly
  cyanDim: 'rgba(6,182,212,0.12)',
  live:    '#ef4444',
  amber:   '#f59e0b',
  violet:  '#8b5cf6',
};

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

  // ─── Role resolution ─────────────────────────────────────────────────────
  let userRoles = [];
  if (typeof user?.roles === 'string') {
    userRoles = user.roles.split(',').map(r => r.trim());
  } else if (Array.isArray(user?.roles)) {
    userRoles = user.roles;
  } else if (user?.role) {
    userRoles = [user.role];
  }

  const isAdmin = userRoles.includes('ADMIN') || user?.isAdmin;
  if (isAdmin) {
    navigate('/admin-dashboard', { replace: true });
    return null;
  }
  if (userRoles.length === 0) userRoles = ['PLAYER'];

  const roleFromUrl = searchParams.get('role');
  const [activeRole, setActiveRole] = useState(
    roleFromUrl && userRoles.includes(roleFromUrl) ? roleFromUrl : userRoles[0] || 'PLAYER'
  );

  useEffect(() => {
    if (activeRole && userRoles.includes(activeRole)) setSearchParams({ role: activeRole });
  }, [activeRole]);

  useEffect(() => {
    if (roleFromUrl && userRoles.includes(roleFromUrl) && roleFromUrl !== activeRole)
      setActiveRole(roleFromUrl);
  }, [roleFromUrl]);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      const [profileRes, regRes] = await Promise.all([
        api.get('/auth/me'),
        api.get('/registrations/my'),
      ]);
      if (profileRes.data.user) {
        setUserProfile(profileRes.data.user);
        setMatchifyCode(profileRes.data.user.matchifyCode);
      }
      setRegistrations(regRes.data.registrations || []);
    } catch {
      setFetchError('Failed to load. Pull to retry.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyTournaments = async () => {
    try {
      const res = await api.get('/tournaments?myTournaments=true&limit=20');
      setMyTournaments(res.data.tournaments || []);
    } catch {}
  };

  useEffect(() => {
    if (activeRole === 'ORGANIZER') fetchMyTournaments();
  }, [activeRole]);

  const handlePublishTournament = async (tournamentId) => {
    setPublishingId(tournamentId);
    try {
      await api.put(`/tournaments/${tournamentId}`, { status: 'published' });
      setMyTournaments(prev =>
        prev.map(t => t.id === tournamentId ? { ...t, status: 'published' } : t)
      );
    } catch {}
    finally { setPublishingId(null); }
  };

  const handleRoleSwitch = (role) => { setActiveRole(role); setShowMenu(false); };

  const winRate = (user?.matchesWon || 0) + (user?.matchesLost || 0) > 0
    ? Math.round((user?.matchesWon / ((user?.matchesWon || 0) + (user?.matchesLost || 0))) * 100)
    : 0;

  const stats = [
    { label: 'Points',     value: user?.totalPoints || 0,         icon: SparklesIcon },
    { label: 'Tournaments',value: user?.tournamentsPlayed || 0,   icon: TrophyIcon   },
    { label: 'Matches Won',value: user?.matchesWon || 0,          icon: FireIcon     },
    { label: 'Win Rate',   value: `${winRate}%`,                  icon: BoltIcon     },
  ];

  const roleConfig = {
    PLAYER:    { name: 'Player',    icon: '🏸', color: T.cyan,   bg: T.cyanDim },
    ORGANIZER: { name: 'Organizer', icon: '🏆', color: T.violet, bg: 'rgba(139,92,246,0.12)' },
    UMPIRE:    { name: 'Umpire',    icon: '⚖️', color: '#60a5fa', bg: 'rgba(59,130,246,0.12)' },
  };

  // derive live registrations
  const activeRegs   = registrations.filter(r => r.tournament?.status === 'ongoing');
  const upcomingRegs = registrations.filter(r => r.tournament?.status === 'published');
  const code = matchifyCode || userProfile?.matchifyCode || user?.matchifyCode;

  // ─── Quick actions config (role-aware) ───────────────────────────────────
  const quickActions = [
    { to: '/tournaments',   emoji: '🏆', label: 'Tournaments' },
    { to: '/registrations', emoji: '📋', label: 'My Entries'  },
    { to: '/leaderboard',   emoji: '📊', label: 'Rankings'    },
    { to: '/my-points',     emoji: '⭐', label: 'Points'      },
    { to: '/notifications', emoji: '🔔', label: 'Alerts'      },
    { to: '/live-matches',  emoji: '📡', label: 'Live'        },
    { to: '/academies',     emoji: '🏫', label: 'Academies'   },
  ];
  if (activeRole === 'ORGANIZER')
    quickActions.unshift({ to: '/tournaments/create', emoji: '➕', label: 'Create' });
  if (activeRole === 'UMPIRE')
    quickActions.unshift({ to: '/umpire/dashboard', emoji: '⚖️', label: 'Scoring' });

  return (
    <div className="min-h-screen relative pt-16" style={{ background: T.page }}>

      {/* ── CSS ─────────────────────────────────────────────────────────── */}
      <style>{`
        @keyframes dashEnter {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        @keyframes pulse2 {
          0%,100% { opacity:1; } 50% { opacity:0.4; }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        .dash-section { animation: dashEnter 0.45s ease-out both; }
        .dash-row     { animation: fadeSlide 0.35s ease-out both; }
        .live-dot { animation: pulse2 1.6s ease-in-out infinite; }
        .qa-scroll::-webkit-scrollbar { display: none; }
        .qa-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        .card-lift { transition: transform 0.18s ease, box-shadow 0.18s ease; }
        .card-lift:active { transform: scale(0.98); }
      `}</style>

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {copied && (
        <div className="fixed top-20 left-1/2 z-[9999] px-4 py-2 rounded-xl text-xs font-bold shadow-xl"
          style={{ transform: 'translateX(-50%)', background: T.cyan, color: '#030507', pointerEvents: 'none', whiteSpace: 'nowrap' }}>
          ✓ ID copied
        </div>
      )}

      {/* ── Error banner ─────────────────────────────────────────────────── */}
      {fetchError && (
        <div className="fixed top-20 left-1/2 z-[9998] px-4 py-2 rounded-xl text-xs font-semibold shadow-xl flex items-center gap-2"
          style={{ transform: 'translateX(-50%)', background: 'rgba(239,68,68,0.92)', color: 'white', whiteSpace: 'nowrap' }}>
          ⚠️ {fetchError}
          <button onClick={() => { setFetchError(''); fetchDashboardData(); }} className="underline ml-1">Retry</button>
        </div>
      )}

      {/* ── Single barely-visible ambient gradient ────────────────────────── */}
      <div className="fixed pointer-events-none" style={{
        top: '-120px', right: '-160px',
        width: '480px', height: '480px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(6,182,212,0.035) 0%, transparent 70%)',
        filter: 'blur(80px)',
      }} />

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* SIDE MENU                                                         */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {showMenu && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', animation: 'dashEnter 0.25s ease-out' }}
          onClick={() => setShowMenu(false)}
        >
          <div
            className="w-[92vw] max-w-sm h-[82vh] relative overflow-hidden rounded-2xl flex flex-col"
            style={{ background: T.s1, border: `1px solid ${T.border}`, boxShadow: '0 32px 80px rgba(0,0,0,0.7)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Menu header */}
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${T.border}` }}>
              <div className="flex items-center gap-2.5">
                <MatchifyLogo size={28} variant="icon" />
                <span className="font-black text-white text-base">Menu</span>
              </div>
              <button onClick={() => setShowMenu(false)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: T.s2, border: `1px solid ${T.border}` }}>
                <XMarkIcon className="w-4 h-4" style={{ color: T.txt2 }} />
              </button>
            </div>

            {/* User strip */}
            <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: `1px solid ${T.border}` }}>
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0" style={{ background: 'linear-gradient(135deg, #1e3a5f, #1e293b)', border: `1.5px solid ${T.border}` }}>
                {user?.profilePhoto
                  ? <img src={user.profilePhoto} alt="" className="w-full h-full object-cover" />
                  : <div className="flex items-center justify-center h-full font-black text-white text-sm">{user?.name?.charAt(0)?.toUpperCase()}</div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm truncate">{user?.name}</p>
                {code && <p className="text-xs font-mono" style={{ color: T.cyan }}>{code}</p>}
              </div>
            </div>

            {/* Nav items */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
              {[
                { to: '/profile',       label: 'Edit Profile',       Icon: UserIcon    },
                { to: '/tournaments',   label: 'Browse Tournaments',  Icon: TrophyIcon  },
                { to: '/leaderboard',   label: 'Leaderboard',         Icon: ChartBarIcon},
                { to: '/registrations', label: 'My Registrations',    Icon: CalendarIcon},
                { to: '/my-points',     label: 'My Points',           Icon: StarIcon    },
                { to: '/notifications', label: 'Notifications',        Icon: BellIcon    },
                { to: '/academies',     label: 'Academies',            Icon: UserIcon    },
              ].map(({ to, label, Icon }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setShowMenu(false)}
                  className="flex items-center gap-3 px-3.5 py-3 rounded-xl"
                  style={{ color: T.txt2, transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = T.s2}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" style={{ color: T.txt3 }} />
                  <span className="text-sm font-semibold">{label}</span>
                  <ArrowRightIcon className="w-3.5 h-3.5 ml-auto" style={{ color: T.txt4 }} />
                </Link>
              ))}
            </div>

            {/* Logout */}
            <div className="px-4 py-4" style={{ borderTop: `1px solid ${T.border}` }}>
              <button
                onClick={() => { setShowMenu(false); logout(); navigate('/login'); }}
                className="w-full py-3 rounded-xl text-sm font-bold"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* MAIN CONTENT                                                       */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="max-w-md mx-auto relative z-10 pb-10">

        {/* ── §1  HERO ─────────────────────────────────────────────────── */}
        <div className="px-4 pt-6 pb-5 dash-section" style={{ animationDelay: '0ms' }}>

          {/* Greeting row */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', color: T.txt3, textTransform: 'uppercase', marginBottom: '4px' }}>Welcome back</p>
              <h1 style={{ fontSize: '26px', fontWeight: 900, color: T.txt, lineHeight: 1.1 }}>
                {user?.name?.split(' ')[0] || 'Player'}
              </h1>
            </div>

            {/* Avatar + menu trigger */}
            <button
              onClick={() => setShowMenu(true)}
              className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #1a2744, #1e293b)', border: `2px solid ${T.border}`, boxShadow: '0 2px 12px rgba(0,0,0,0.5)' }}
            >
              {user?.profilePhoto
                ? <img src={user.profilePhoto} alt="" className="w-full h-full object-cover" />
                : <div className="flex items-center justify-center h-full font-black text-white" style={{ fontSize: '15px' }}>{user?.name?.charAt(0)?.toUpperCase() || 'P'}</div>}
            </button>
          </div>

          {/* Live status + role tags */}
          <div className="flex items-center gap-2 flex-wrap mb-5">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: 'rgba(239,68,68,0.09)', border: '1px solid rgba(239,68,68,0.18)' }}>
              <div className="w-1.5 h-1.5 rounded-full live-dot" style={{ background: '#ef4444' }} />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#f87171', letterSpacing: '0.06em' }}>LIVE</span>
            </div>

            {/* Role chips */}
            {userRoles.map(role => (
              <div key={role} className="flex items-center gap-1 px-2.5 py-1 rounded-full" style={{ background: T.s1, border: `1px solid ${T.border}` }}>
                <span style={{ fontSize: '12px' }}>{roleConfig[role]?.icon}</span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: T.txt3 }}>{roleConfig[role]?.name}</span>
              </div>
            ))}
          </div>

          {/* Hero stat pills — PLAYER only */}
          {activeRole === 'PLAYER' && (
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Points',   value: user?.totalPoints || 0 },
                { label: 'Won',      value: user?.matchesWon || 0  },
                { label: 'Win Rate', value: `${winRate}%`          },
              ].map((s, i) => (
                <div key={i} className="rounded-2xl p-3.5" style={{ background: T.s1, border: `1px solid ${T.border}` }}>
                  <p style={{ fontSize: '11px', color: T.txt3, fontWeight: 500, marginBottom: '6px' }}>{s.label}</p>
                  <p style={{ fontSize: '20px', fontWeight: 900, color: T.txt, lineHeight: 1 }}>{s.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Active tournament alert — if user is in an ongoing tournament */}
          {activeRegs.length > 0 && (
            <Link to={`/tournaments/${activeRegs[0].tournament?.id}`}
              className="flex items-center gap-3 rounded-2xl px-4 py-3.5 mt-3 card-lift"
              style={{ background: T.s1, border: `1px solid rgba(6,182,212,0.22)`, boxShadow: '0 0 0 1px rgba(6,182,212,0.06)' }}>
              <div className="w-2 h-2 rounded-full live-dot flex-shrink-0" style={{ background: T.cyan }} />
              <div className="flex-1 min-w-0">
                <p style={{ fontSize: '12px', color: T.cyan, fontWeight: 700, marginBottom: '1px' }}>Active Tournament</p>
                <p className="truncate" style={{ fontSize: '13px', fontWeight: 800, color: T.txt }}>{activeRegs[0].tournament?.name}</p>
              </div>
              <ArrowRightIcon className="w-4 h-4 flex-shrink-0" style={{ color: T.txt4 }} />
            </Link>
          )}
        </div>

        {/* ── DIVIDER ──────────────────────────────────────────────────── */}
        <div style={{ height: '1px', background: T.borderS, marginInline: '16px', marginBottom: '16px' }} />

        {/* ── §2  COMPACT IDENTITY ROW ─────────────────────────────────── */}
        <div className="flex items-center gap-3 px-4 mb-5 dash-section" style={{ animationDelay: '60ms' }}>
          {/* Avatar */}
          <button
            onClick={() => user?.profilePhoto && setShowPhotoViewer(true)}
            className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #1a2744, #1e293b)', border: `1.5px solid ${T.border}` }}
          >
            {user?.profilePhoto
              ? <img src={user.profilePhoto} alt="" className="w-full h-full object-cover" />
              : <div className="flex items-center justify-center h-full font-black text-white" style={{ fontSize: '15px' }}>{user?.name?.charAt(0)?.toUpperCase()}</div>}
          </button>

          <div className="flex-1 min-w-0">
            <p style={{ fontSize: '14px', fontWeight: 800, color: T.txt, marginBottom: '1px' }}>{user?.name}</p>
            <div className="flex items-center gap-2">
              <p style={{ fontSize: '12px', fontWeight: 700, color: T.cyan, fontFamily: 'monospace' }}>{code || '—'}</p>
              {code && (
                <button
                  onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
                  style={{ fontSize: '10px', color: T.txt4, padding: '1px 6px', background: T.s1, border: `1px solid ${T.border}`, borderRadius: '6px', fontWeight: 600 }}
                >
                  copy
                </button>
              )}
            </div>
          </div>

          <Link to="/profile" style={{ fontSize: '12px', fontWeight: 700, color: T.txt3, padding: '6px 12px', background: T.s1, border: `1px solid ${T.border}`, borderRadius: '10px' }}>
            Edit
          </Link>
        </div>

        {/* ── §3  ROLE SWITCHER (multi-role only) ──────────────────────── */}
        {userRoles.length > 1 && (
          <div className="mx-4 mb-5 flex gap-1 p-1 rounded-2xl dash-section" style={{ background: T.s1, border: `1px solid ${T.border}`, animationDelay: '80ms' }}>
            {userRoles.map(role => {
              const config = roleConfig[role];
              const isActive = role === activeRole;
              return (
                <button
                  key={role}
                  onClick={() => handleRoleSwitch(role)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all"
                  style={{
                    background: isActive ? T.s3 : 'transparent',
                    color: isActive ? config?.color : T.txt3,
                    border: isActive ? `1px solid ${T.border}` : '1px solid transparent',
                  }}
                >
                  <span>{config?.icon}</span>
                  <span>{config?.name}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* ── §4  QUICK ACTIONS (horizontal scroll) ────────────────────── */}
        <div className="mb-5 dash-section" style={{ animationDelay: '100ms' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: T.txt3, textTransform: 'uppercase', letterSpacing: '0.1em', paddingInline: '16px', marginBottom: '10px' }}>Quick access</p>
          <div className="flex qa-scroll overflow-x-auto gap-2.5 px-4 pb-1">
            {quickActions.map((a, i) => (
              <Link
                key={a.to}
                to={a.to}
                className="flex flex-col items-center gap-1.5 flex-shrink-0 rounded-2xl card-lift"
                style={{
                  background: T.s1,
                  border: `1px solid ${T.border}`,
                  padding: '12px 14px',
                  minWidth: '68px',
                  animation: `dashEnter 0.35s ease-out ${100 + i * 40}ms both`,
                }}
              >
                <span style={{ fontSize: '20px', lineHeight: 1 }}>{a.emoji}</span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: T.txt3, whiteSpace: 'nowrap', textAlign: 'center' }}>{a.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────── */}
        {/* PLAYER VIEW                                                     */}
        {/* ─────────────────────────────────────────────────────────────── */}
        {activeRole === 'PLAYER' && (
          <>
            {/* ── §5  PERFORMANCE STATS ─────────────────────────────── */}
            <section className="px-4 mb-5 dash-section" style={{ animationDelay: '140ms' }}>
              <div className="flex items-center justify-between mb-3">
                <p style={{ fontSize: '11px', fontWeight: 700, color: T.txt3, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Performance</p>
                <Link to="/my-points" style={{ fontSize: '12px', fontWeight: 700, color: T.cyan }}>Details →</Link>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {stats.map((stat, i) => (
                  <div
                    key={i}
                    className="rounded-2xl p-4 card-lift"
                    style={{
                      background: T.s1,
                      border: `1px solid ${T.border}`,
                      animation: `dashEnter 0.4s ease-out ${200 + i * 50}ms both`,
                    }}
                  >
                    <stat.icon className="w-4 h-4 mb-3" style={{ color: T.txt4 }} />
                    <p style={{ fontSize: '26px', fontWeight: 900, color: T.txt, lineHeight: 1, marginBottom: '4px' }}>{stat.value}</p>
                    <p style={{ fontSize: '11px', color: T.txt3, fontWeight: 500 }}>{stat.label}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* ── §6  UPCOMING TOURNAMENTS ──────────────────────────── */}
            {upcomingRegs.length > 0 && (
              <section className="px-4 mb-5 dash-section" style={{ animationDelay: '200ms' }}>
                <div className="flex items-center justify-between mb-3">
                  <p style={{ fontSize: '11px', fontWeight: 700, color: T.txt3, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Upcoming</p>
                  <Link to="/registrations" style={{ fontSize: '12px', fontWeight: 700, color: T.cyan }}>All →</Link>
                </div>
                <div className="space-y-2">
                  {upcomingRegs.slice(0, 2).map((reg, i) => (
                    <Link
                      key={reg.id}
                      to={`/tournaments/${reg.tournament?.id}`}
                      className="flex items-center gap-3 rounded-2xl px-4 py-3.5 card-lift dash-row"
                      style={{ background: T.s1, border: `1px solid ${T.border}`, animationDelay: `${220 + i * 50}ms` }}
                    >
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: T.s2 }}>
                        <span style={{ fontSize: '16px' }}>🏆</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate" style={{ fontSize: '13px', fontWeight: 800, color: T.txt, marginBottom: '2px' }}>{reg.tournament?.name}</p>
                        <p style={{ fontSize: '11px', color: T.txt3 }}>{reg.category?.name} · {reg.tournament?.city}</p>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: T.cyan, background: T.cyanDim, padding: '3px 8px', borderRadius: '8px' }}>Open</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* ── §7  RECENT ACTIVITY ───────────────────────────────── */}
            <section className="px-4 mb-5 dash-section" style={{ animationDelay: '240ms' }}>
              <div className="flex items-center justify-between mb-3">
                <p style={{ fontSize: '11px', fontWeight: 700, color: T.txt3, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Recent activity</p>
                <Link to="/registrations" style={{ fontSize: '12px', fontWeight: 700, color: T.cyan }}>All →</Link>
              </div>

              {loading ? (
                <div className="rounded-2xl flex items-center justify-center py-10" style={{ background: T.s1, border: `1px solid ${T.border}` }}>
                  <div className="w-7 h-7 rounded-full border-2 animate-spin" style={{ borderColor: T.borderS, borderTopColor: T.cyan }} />
                </div>
              ) : registrations.length === 0 ? (
                <div className="rounded-2xl py-10 text-center" style={{ background: T.s1, border: `1px solid ${T.border}` }}>
                  <p style={{ fontSize: '32px', marginBottom: '10px' }}>🏸</p>
                  <p style={{ fontSize: '14px', fontWeight: 800, color: T.txt, marginBottom: '6px' }}>No activity yet</p>
                  <p style={{ fontSize: '12px', color: T.txt3, marginBottom: '20px' }}>Join your first tournament</p>
                  <Link to="/tournaments" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold"
                    style={{ background: T.cyan, color: '#030507' }}>
                    Browse Tournaments
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {registrations.slice(0, 4).map((reg, i) => {
                    const statusColor = reg.status === 'confirmed' ? T.cyan : reg.status === 'pending' ? T.amber : '#f87171';
                    const statusBg   = reg.status === 'confirmed' ? T.cyanDim : reg.status === 'pending' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)';
                    return (
                      <Link
                        key={reg.id}
                        to={`/tournaments/${reg.tournament?.id}`}
                        className="flex items-center gap-3 rounded-2xl px-4 py-3.5 card-lift dash-row"
                        style={{ background: T.s1, border: `1px solid ${T.border}`, animationDelay: `${260 + i * 45}ms` }}
                      >
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: T.s2 }}>
                          <span style={{ fontSize: '16px' }}>🏆</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate" style={{ fontSize: '13px', fontWeight: 800, color: T.txt, marginBottom: '2px' }}>{reg.tournament?.name || 'Tournament'}</p>
                          <p style={{ fontSize: '11px', color: T.txt3 }}>{reg.category?.name} · {new Date(reg.createdAt).toLocaleDateString('en-IN')}</p>
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: statusColor, background: statusBg, padding: '3px 8px', borderRadius: '8px', flexShrink: 0, textTransform: 'capitalize' }}>
                          {reg.status}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>

            {/* ── §8  DISCOVER SECTION ─────────────────────────────── */}
            <section className="px-4 mb-2 dash-section" style={{ animationDelay: '280ms' }}>
              <div className="grid grid-cols-2 gap-2.5">
                <Link to="/tournaments" className="rounded-2xl p-5 card-lift" style={{ background: T.s1, border: `1px solid ${T.border}` }}>
                  <TrophyIcon className="w-5 h-5 mb-3" style={{ color: T.txt4 }} />
                  <p style={{ fontSize: '14px', fontWeight: 800, color: T.txt, marginBottom: '3px' }}>Browse</p>
                  <p style={{ fontSize: '11px', color: T.txt3 }}>Find tournaments near you</p>
                </Link>
                <Link to="/leaderboard" className="rounded-2xl p-5 card-lift" style={{ background: T.s1, border: `1px solid ${T.border}` }}>
                  <ChartBarIcon className="w-5 h-5 mb-3" style={{ color: T.txt4 }} />
                  <p style={{ fontSize: '14px', fontWeight: 800, color: T.txt, marginBottom: '3px' }}>Leaderboard</p>
                  <p style={{ fontSize: '11px', color: T.txt3 }}>Check your global rank</p>
                </Link>
              </div>
            </section>
          </>
        )}

        {/* ─────────────────────────────────────────────────────────────── */}
        {/* ORGANIZER VIEW                                                  */}
        {/* ─────────────────────────────────────────────────────────────── */}
        {activeRole === 'ORGANIZER' && (
          <>
            {/* Overview stats */}
            <section className="px-4 mb-5 dash-section" style={{ animationDelay: '140ms' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: T.txt3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>Overview</p>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { label: 'Tournaments Organized', value: user?.tournamentsOrganized || 0, icon: '🏆' },
                  { label: 'Total Participants',     value: user?.totalParticipants || 0,     icon: '👥' },
                ].map((s, i) => (
                  <div key={i} className="rounded-2xl p-4 card-lift" style={{ background: T.s1, border: `1px solid ${T.border}` }}>
                    <span style={{ fontSize: '20px', display: 'block', marginBottom: '10px' }}>{s.icon}</span>
                    <p style={{ fontSize: '26px', fontWeight: 900, color: T.txt, lineHeight: 1, marginBottom: '4px' }}>{s.value}</p>
                    <p style={{ fontSize: '11px', color: T.txt3 }}>{s.label}</p>
                  </div>
                ))}
              </div>

              <Link
                to="/tournaments/create"
                className="flex items-center justify-center gap-2 w-full mt-2.5 py-3.5 rounded-2xl font-bold text-sm"
                style={{ background: T.cyan, color: '#030507', fontWeight: 800 }}
              >
                + Create Tournament
              </Link>
            </section>

            {/* My Tournaments */}
            {myTournaments.length > 0 && (
              <section className="px-4 mb-5 dash-section" style={{ animationDelay: '200ms' }}>
                <div className="flex items-center justify-between mb-3">
                  <p style={{ fontSize: '11px', fontWeight: 700, color: T.txt3, textTransform: 'uppercase', letterSpacing: '0.1em' }}>My tournaments</p>
                  <Link to="/organizer/history" style={{ fontSize: '12px', fontWeight: 700, color: T.cyan }}>All →</Link>
                </div>
                <div className="space-y-2">
                  {myTournaments.slice(0, 5).map((t, i) => {
                    const isDraft = t.status === 'draft';
                    const hasCategories = (t.categories?.length || 0) > 0;
                    const statusColors = {
                      draft: { c: T.amber, bg: 'rgba(245,158,11,0.1)' },
                      published: { c: T.cyan, bg: T.cyanDim },
                      ongoing: { c: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
                      completed: { c: T.txt3, bg: 'rgba(255,255,255,0.06)' },
                      cancelled: { c: '#f87171', bg: 'rgba(239,68,68,0.1)' },
                    };
                    const sc = statusColors[t.status] || statusColors.draft;
                    return (
                      <div key={t.id} className="rounded-2xl p-4 dash-row" style={{ background: T.s1, border: `1px solid ${T.border}`, animationDelay: `${220 + i * 45}ms` }}>
                        <div className="flex items-start gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <p className="truncate" style={{ fontSize: '13px', fontWeight: 800, color: T.txt, marginBottom: '2px' }}>{t.name}</p>
                            <p style={{ fontSize: '11px', color: T.txt3 }}>{t.city}{t.state ? `, ${t.state}` : ''} · {t.categories?.length || 0} categories</p>
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: sc.c, background: sc.bg, padding: '3px 8px', borderRadius: '8px', flexShrink: 0, textTransform: 'capitalize' }}>
                            {isDraft ? 'Draft' : t.status}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Link to={`/tournaments/${t.id}`} className="flex-1 text-center py-2 rounded-xl text-xs font-bold" style={{ background: T.s2, color: T.txt2, border: `1px solid ${T.border}` }}>View</Link>
                          <Link to={`/tournaments/${t.id}/edit`} className="flex-1 text-center py-2 rounded-xl text-xs font-bold" style={{ background: T.s2, color: T.txt2, border: `1px solid ${T.border}` }}>Edit</Link>
                          {isDraft && (
                            <button
                              onClick={() => handlePublishTournament(t.id)}
                              disabled={publishingId === t.id || !hasCategories}
                              className="flex-1 py-2 rounded-xl text-xs font-bold disabled:opacity-40"
                              style={{ background: hasCategories ? T.cyan : T.s2, color: hasCategories ? '#030507' : T.txt3 }}
                              title={!hasCategories ? 'Add categories first' : ''}
                            >
                              {publishingId === t.id ? '…' : 'Publish'}
                            </button>
                          )}
                        </div>
                        {isDraft && !hasCategories && (
                          <p style={{ fontSize: '11px', color: T.amber, marginTop: '8px' }}>⚠ Add categories before publishing</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}

        {/* ─────────────────────────────────────────────────────────────── */}
        {/* UMPIRE VIEW                                                     */}
        {/* ─────────────────────────────────────────────────────────────── */}
        {activeRole === 'UMPIRE' && (
          <section className="px-4 mb-5 dash-section" style={{ animationDelay: '140ms' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: T.txt3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>Umpire stats</p>
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              {[
                { label: 'Matches Umpired',    value: user?.matchesUmpired || 0,     icon: '⚖️' },
                { label: 'Tournaments',         value: user?.tournamentsUmpired || 0, icon: '🏆' },
              ].map((s, i) => (
                <div key={i} className="rounded-2xl p-4 card-lift" style={{ background: T.s1, border: `1px solid ${T.border}` }}>
                  <span style={{ fontSize: '20px', display: 'block', marginBottom: '10px' }}>{s.icon}</span>
                  <p style={{ fontSize: '26px', fontWeight: 900, color: T.txt, lineHeight: 1, marginBottom: '4px' }}>{s.value}</p>
                  <p style={{ fontSize: '11px', color: T.txt3 }}>{s.label}</p>
                </div>
              ))}
            </div>
            <Link to="/umpire/dashboard"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-bold text-sm"
              style={{ background: T.s1, border: `1px solid ${T.border}`, color: T.txt2 }}>
              Open Scoring Console →
            </Link>
          </section>
        )}

        {/* ── §LAST  PROFILE INFO SECTION ──────────────────────────────── */}
        <section className="px-4 mb-2 dash-section" style={{ animationDelay: '320ms' }}>
          <div className="rounded-2xl overflow-hidden" style={{ background: T.s1, border: `1px solid ${T.border}` }}>
            <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: `1px solid ${T.borderS}` }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: T.txt3, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Profile details</p>
              <Link to="/profile" style={{ fontSize: '12px', fontWeight: 700, color: T.cyan }}>Edit</Link>
            </div>
            {[
              { label: 'Name',     value: userProfile?.name   || user?.name   },
              { label: 'Location', value: [userProfile?.city || user?.city, userProfile?.state || user?.state].filter(Boolean).join(', ') || null },
              { label: 'Phone',    value: userProfile?.phone  || user?.phone  },
              { label: 'Email',    value: displayEmail(userProfile?.email) || displayEmail(user?.email) },
              { label: 'Member since', value: userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : null },
            ].filter(row => row.value).map((row, i, arr) => (
              <div
                key={row.label}
                className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: i < arr.length - 1 ? `1px solid ${T.borderS}` : 'none' }}
              >
                <span style={{ fontSize: '12px', color: T.txt3, fontWeight: 500 }}>{row.label}</span>
                <span className="truncate ml-4" style={{ fontSize: '13px', fontWeight: 700, color: T.txt2, maxWidth: '60%', textAlign: 'right' }}>{row.value}</span>
              </div>
            ))}
          </div>
        </section>

      </div>{/* /max-w-md */}

      {/* Photo viewer */}
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
