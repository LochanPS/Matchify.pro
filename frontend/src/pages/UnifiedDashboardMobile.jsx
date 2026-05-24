import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

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
  CalendarIcon,
  ArrowRightIcon,
  XMarkIcon,
  BellIcon,
  StarIcon,
  MapPinIcon,
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

  let userRoles = [];
  if (typeof user?.roles === 'string') {
    userRoles = user.roles.split(',').map(r => r.trim());
  } else if (Array.isArray(user?.roles)) {
    userRoles = user.roles;
  } else if (user?.role) {
    userRoles = [user.role];
  }

  const isAdmin = userRoles.includes('ADMIN') || user?.isAdmin;
  if (isAdmin) { navigate('/admin-dashboard', { replace: true }); return null; }
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
      setFetchError('Failed to load. Tap Retry.');
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

  const handlePublishTournament = async (id) => {
    setPublishingId(id);
    try {
      await api.put(`/tournaments/${id}`, { status: 'published' });
      setMyTournaments(prev => prev.map(t => t.id === id ? { ...t, status: 'published' } : t));
    } catch {}
    finally { setPublishingId(null); }
  };

  const handleRoleSwitch = (role) => { setActiveRole(role); setShowMenu(false); };

  const winRate = (user?.matchesWon || 0) + (user?.matchesLost || 0) > 0
    ? Math.round((user?.matchesWon / ((user?.matchesWon || 0) + (user?.matchesLost || 0))) * 100)
    : 0;

  const code = matchifyCode || userProfile?.matchifyCode || user?.matchifyCode;

  // ─── stat tiles ──────────────────────────────────────────────────────────
  const playerStats = [
    { label: 'Total Points',  value: user?.totalPoints || 0,       icon: SparklesIcon, accent: '#06b6d4', glow: 'rgba(6,182,212,0.25)'   },
    { label: 'Tournaments',   value: user?.tournamentsPlayed || 0,  icon: TrophyIcon,   accent: '#f59e0b', glow: 'rgba(245,158,11,0.25)'  },
    { label: 'Matches Won',   value: user?.matchesWon || 0,         icon: FireIcon,     accent: '#f97316', glow: 'rgba(249,115,22,0.25)'  },
    { label: 'Win Rate',      value: `${winRate}%`,                 icon: BoltIcon,     accent: '#a855f7', glow: 'rgba(168,85,247,0.25)'  },
  ];

  // ─── nav tiles ───────────────────────────────────────────────────────────
  const navTiles = [
    { to: '/tournaments',   label: 'Tournaments', icon: TrophyIcon,   accent: '#06b6d4', bg: 'rgba(6,182,212,0.12)'   },
    { to: '/leaderboard',   label: 'Leaderboard', icon: ChartBarIcon, accent: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
    { to: '/academies',     label: 'Academies',   icon: UserIcon,     accent: '#a855f7', bg: 'rgba(168,85,247,0.12)'  },
    { to: '/registrations', label: 'My Entries',  icon: CalendarIcon, accent: '#f97316', bg: 'rgba(249,115,22,0.12)'  },
    { to: '/my-points',     label: 'My Points',   icon: StarIcon,     accent: '#fbbf24', bg: 'rgba(251,191,36,0.12)'  },
    { to: '/notifications', label: 'Alerts',      icon: BellIcon,     accent: '#06b6d4', bg: 'rgba(6,182,212,0.10)'   },
  ];

  const roleConfig = {
    PLAYER:    { name: 'Player',    icon: '🏸', color: '#06b6d4', bg: 'rgba(6,182,212,0.15)',   border: 'rgba(6,182,212,0.4)'   },
    ORGANIZER: { name: 'Organizer', icon: '🏆', color: '#a855f7', bg: 'rgba(168,85,247,0.15)',  border: 'rgba(168,85,247,0.4)'  },
    UMPIRE:    { name: 'Umpire',    icon: '⚖️', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.4)'  },
  };

  const card = {
    bg: 'rgba(5,8,16,0.72)',
    border: '1px solid rgba(255,255,255,0.10)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: '20px',
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

      {/* ── global dark overlay ── */}
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'rgba(5,8,16,0.72)', zIndex: 0 }} />

      {/* ── CSS ─────────────────────────────────────────────────────────── */}
      <style>{`
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(18px); }
          to   { opacity:1; transform:translateY(0);    }
        }
        @keyframes shimmer {
          0%   { background-position:-200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes livePulse {
          0%,100% { opacity:1; transform:scale(1);    }
          50%      { opacity:.5; transform:scale(1.3); }
        }
        .du-card { animation: fadeUp .45s ease-out both; }
        .live-dot { animation: livePulse 1.6s ease-in-out infinite; }
        .nav-tile { transition: transform .15s ease, box-shadow .15s ease; }
        .nav-tile:active { transform: scale(.96); }
        .stat-tile { transition: transform .15s ease; }
        .stat-tile:active { transform: scale(.97); }
        .shimmer-btn {
          background-size: 200% auto;
          animation: shimmer 3s linear infinite;
        }
      `}</style>

      {/* ── Toast ── */}
      {copied && (
        <div className="fixed top-20 left-1/2 z-[9999] px-4 py-2 rounded-xl text-sm font-bold shadow-2xl"
          style={{ transform: 'translateX(-50%)', background: 'rgba(6,182,212,0.95)', color: '#030c10', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
          ✓ ID copied!
        </div>
      )}

      {/* ── Error ── */}
      {fetchError && (
        <div className="fixed top-20 left-1/2 z-[9998] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2"
          style={{ transform: 'translateX(-50%)', background: 'rgba(239,68,68,0.95)', color: '#fff', whiteSpace: 'nowrap' }}>
          ⚠️ {fetchError}
          <button onClick={() => { setFetchError(''); fetchDashboardData(); }} className="underline">Retry</button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* SIDE MENU                                                         */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {showMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', animation: 'fadeUp .25s ease-out' }}
          onClick={() => setShowMenu(false)}>
          <div className="w-[92vw] max-w-sm h-[82vh] flex flex-col overflow-hidden"
            style={{ ...card, borderRadius: '24px', boxShadow: '0 32px 80px rgba(0,0,0,0.8)' }}
            onClick={e => e.stopPropagation()}>

            {/* header */}
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-2.5">
                <MatchifyLogo size={28} variant="icon" />
                <span className="font-black text-white text-lg">Menu</span>
              </div>
              <button onClick={() => setShowMenu(false)}
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <XMarkIcon className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* user strip */}
            <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#0e7490,#0369a1)', border: '2px solid #06b6d4', boxShadow: '0 0 12px rgba(6,182,212,0.35)' }}>
                {user?.profilePhoto
                  ? <img src={user.profilePhoto} alt="" className="w-full h-full object-cover" />
                  : <div className="flex items-center justify-center h-full font-black text-white text-lg">{user?.name?.charAt(0)?.toUpperCase()}</div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-white text-base truncate">{user?.name}</p>
                {code && <p className="text-sm font-mono font-bold" style={{ color: '#06b6d4' }}>{code}</p>}
              </div>
            </div>

            {/* links */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
              {[
                { to: '/profile',       label: 'Edit Profile',      Icon: UserIcon,     accent: '#06b6d4' },
                { to: '/tournaments',   label: 'Browse Tournaments', Icon: TrophyIcon,   accent: '#f59e0b' },
                { to: '/leaderboard',   label: 'Leaderboard',        Icon: ChartBarIcon, accent: '#a855f7' },
                { to: '/registrations', label: 'My Registrations',   Icon: CalendarIcon, accent: '#f97316' },
                { to: '/my-points',     label: 'My Points',          Icon: StarIcon,     accent: '#fbbf24' },
                { to: '/notifications', label: 'Notifications',       Icon: BellIcon,     accent: '#06b6d4' },
                { to: '/academies',     label: 'Academies',           Icon: UserIcon,     accent: '#a855f7' },
              ].map(({ to, label, Icon, accent }) => (
                <Link key={to} to={to} onClick={() => setShowMenu(false)}
                  className="flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${accent}1a`, border: `1px solid ${accent}40` }}>
                    <Icon className="w-4.5 h-4.5" style={{ color: accent }} />
                  </div>
                  <span className="font-bold text-white text-sm flex-1">{label}</span>
                  <ArrowRightIcon className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.25)' }} />
                </Link>
              ))}
            </div>

            {/* logout */}
            <div className="px-4 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <button
                onClick={() => { setShowMenu(false); logout(); navigate('/login'); }}
                className="w-full py-3.5 rounded-2xl font-bold text-sm"
                style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.28)', color: '#f87171' }}>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* MAIN                                                              */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="max-w-md mx-auto relative z-10 px-4 pb-12">

        {/* ── §1  HERO GREETING ────────────────────────────────────────── */}
        <div className="pt-6 pb-4 du-card" style={{ animationDelay: '0ms' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>
            Welcome back
          </p>
          <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#ffffff', lineHeight: 1.1, marginBottom: '10px' }}>
            {user?.name?.split(' ')[0] || 'Player'} 👋
          </h1>

          {/* Identity row */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Matchify ID chip */}
            <button
              onClick={() => { if (code) { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1800); } }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.35)' }}>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: '0.08em' }}>ID</span>
              <span style={{ fontSize: '14px', fontWeight: 900, color: '#22d3ee', fontFamily: 'monospace' }}>{code || '...'}</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#22d3ee' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>

            {/* Location */}
            {user?.city && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <MapPinIcon className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.4)' }} />
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.55)' }}>{user.city}{user.state ? `, ${user.state}` : ''}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── §2  ROLE SWITCHER ────────────────────────────────────────── */}
        {userRoles.length > 1 && (
          <div className="flex gap-2 mb-5 du-card" style={{ animationDelay: '50ms' }}>
            {userRoles.map(role => {
              const cfg = roleConfig[role];
              const isActive = role === activeRole;
              return (
                <button key={role} onClick={() => handleRoleSwitch(role)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all"
                  style={{
                    background: isActive ? cfg.bg : 'rgba(255,255,255,0.05)',
                    border: isActive ? `1.5px solid ${cfg.border}` : '1.5px solid rgba(255,255,255,0.1)',
                    color: isActive ? cfg.color : 'rgba(255,255,255,0.45)',
                    boxShadow: isActive ? `0 4px 20px ${cfg.color}30` : 'none',
                  }}>
                  <span>{cfg?.icon}</span>
                  <span>{cfg?.name}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* ── §3  QUICK NAVIGATION ─────────────────────────────────────── */}
        <div className="mb-5 du-card" style={{ animationDelay: '80ms' }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(to bottom, #06b6d4, #a855f7)' }} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Navigation</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {navTiles.map((tile, i) => (
              <Link key={tile.to} to={tile.to}
                className="nav-tile flex flex-col items-center gap-2.5 py-4 px-2 rounded-2xl"
                style={{
                  ...card,
                  background: tile.bg,
                  border: `1px solid ${tile.accent}30`,
                  boxShadow: `0 4px 20px ${tile.accent}15`,
                  animation: `fadeUp .4s ease-out ${100 + i * 35}ms both`,
                }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: `${tile.accent}20`, border: `1px solid ${tile.accent}40` }}>
                  <tile.icon className="w-6 h-6" style={{ color: tile.accent }} />
                </div>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff', textAlign: 'center', lineHeight: 1.2 }}>{tile.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* ── §4a  PLAYER STATS ────────────────────────────────────────── */}
        {activeRole === 'PLAYER' && (
          <div className="mb-5 du-card" style={{ animationDelay: '180ms' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(to bottom, #f59e0b, #f97316)' }} />
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Player Stats</span>
              </div>
              <Link to="/my-points" style={{ fontSize: '12px', fontWeight: 700, color: '#06b6d4' }}>Details →</Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {playerStats.map((s, i) => (
                <div key={i} className="stat-tile p-4 rounded-2xl"
                  style={{
                    ...card,
                    background: `${s.accent}0f`,
                    border: `1px solid ${s.accent}28`,
                    boxShadow: `0 4px 24px ${s.glow}`,
                    animation: `fadeUp .45s ease-out ${200 + i * 55}ms both`,
                  }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                    style={{ background: `${s.accent}20`, border: `1px solid ${s.accent}45` }}>
                    <s.icon className="w-5 h-5" style={{ color: s.accent }} />
                  </div>
                  <p style={{ fontSize: '30px', fontWeight: 900, color: '#ffffff', lineHeight: 1, marginBottom: '4px' }}>{s.value}</p>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── §4b  ORGANIZER VIEW ──────────────────────────────────────── */}
        {activeRole === 'ORGANIZER' && (
          <div className="mb-5 du-card" style={{ animationDelay: '180ms' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(to bottom, #a855f7, #6366f1)' }} />
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Organizer Overview</span>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              {[
                { label: 'Tournaments Organized', value: user?.tournamentsOrganized || 0, accent: '#a855f7', icon: '🏆' },
                { label: 'Total Participants',     value: user?.totalParticipants || 0,     accent: '#f59e0b', icon: '👥' },
              ].map((s, i) => (
                <div key={i} className="stat-tile p-4 rounded-2xl"
                  style={{ ...card, background: `${s.accent}0f`, border: `1px solid ${s.accent}28` }}>
                  <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>{s.icon}</span>
                  <p style={{ fontSize: '30px', fontWeight: 900, color: '#fff', lineHeight: 1, marginBottom: '4px' }}>{s.value}</p>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>{s.label}</p>
                </div>
              ))}
            </div>
            <Link to="/tournaments/create"
              className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-black text-base shimmer-btn"
              style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed, #a855f7)', color: '#fff', boxShadow: '0 8px 28px rgba(168,85,247,0.4)' }}>
              + Create Tournament
            </Link>

            {myTournaments.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <p style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>My Tournaments</p>
                  <Link to="/organizer/history" style={{ fontSize: '12px', fontWeight: 700, color: '#a855f7' }}>View All →</Link>
                </div>
                <div className="space-y-2.5">
                  {myTournaments.slice(0, 5).map(t => {
                    const isDraft = t.status === 'draft';
                    const hasCategories = (t.categories?.length || 0) > 0;
                    const sc = isDraft ? { c: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)' }
                      : t.status === 'published' ? { c: '#06b6d4', bg: 'rgba(6,182,212,0.1)', border: 'rgba(6,182,212,0.3)' }
                      : t.status === 'ongoing' ? { c: '#4ade80', bg: 'rgba(74,222,128,0.1)', border: 'rgba(74,222,128,0.3)' }
                      : { c: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)' };
                    return (
                      <div key={t.id} className="p-4 rounded-2xl" style={{ ...card, background: 'rgba(255,255,255,0.04)' }}>
                        <div className="flex items-start gap-2 mb-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-black text-white text-sm truncate">{t.name}</p>
                            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{t.city}{t.state ? `, ${t.state}` : ''} · {t.categories?.length || 0} categories</p>
                          </div>
                          <span className="text-xs font-bold px-2.5 py-1 rounded-lg flex-shrink-0 capitalize"
                            style={{ background: sc.bg, color: sc.c, border: `1px solid ${sc.border}` }}>
                            {isDraft ? 'Draft' : t.status}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Link to={`/tournaments/${t.id}`} className="flex-1 text-center py-2 rounded-xl text-xs font-bold"
                            style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}>View</Link>
                          <Link to={`/tournaments/${t.id}/edit`} className="flex-1 text-center py-2 rounded-xl text-xs font-bold"
                            style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}>Edit</Link>
                          {isDraft && (
                            <button onClick={() => handlePublishTournament(t.id)}
                              disabled={publishingId === t.id || !hasCategories}
                              className="flex-1 py-2 rounded-xl text-xs font-black disabled:opacity-40"
                              style={{ background: hasCategories ? 'rgba(168,85,247,0.25)' : 'rgba(255,255,255,0.06)', color: hasCategories ? '#c4b5fd' : 'rgba(255,255,255,0.3)', border: hasCategories ? '1px solid rgba(168,85,247,0.4)' : 'none' }}
                              title={!hasCategories ? 'Add categories first' : ''}>
                              {publishingId === t.id ? '…' : '🚀 Publish'}
                            </button>
                          )}
                        </div>
                        {isDraft && !hasCategories && (
                          <p style={{ fontSize: '11px', color: '#fbbf24', marginTop: '8px' }}>⚠️ Add categories before publishing</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── §4c  UMPIRE VIEW ─────────────────────────────────────────── */}
        {activeRole === 'UMPIRE' && (
          <div className="mb-5 du-card" style={{ animationDelay: '180ms' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(to bottom, #f59e0b, #f97316)' }} />
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Umpire Stats</span>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              {[
                { label: 'Matches Umpired', value: user?.matchesUmpired || 0,     accent: '#f59e0b', icon: '⚖️' },
                { label: 'Tournaments',      value: user?.tournamentsUmpired || 0, accent: '#06b6d4', icon: '🏆' },
              ].map((s, i) => (
                <div key={i} className="stat-tile p-4 rounded-2xl"
                  style={{ ...card, background: `${s.accent}0f`, border: `1px solid ${s.accent}28` }}>
                  <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>{s.icon}</span>
                  <p style={{ fontSize: '30px', fontWeight: 900, color: '#fff', lineHeight: 1, marginBottom: '4px' }}>{s.value}</p>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>{s.label}</p>
                </div>
              ))}
            </div>
            <Link to="/umpire/dashboard" className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-black text-base"
              style={{ background: 'rgba(245,158,11,0.15)', border: '1.5px solid rgba(245,158,11,0.4)', color: '#fbbf24' }}>
              ⚖️ Open Scoring Console
            </Link>
          </div>
        )}

        {/* ── §5  RECENT ACTIVITY ──────────────────────────────────────── */}
        <div className="mb-5 du-card" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(to bottom, #f97316, #f59e0b)' }} />
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Recent Activity</span>
            </div>
            <Link to="/registrations" style={{ fontSize: '12px', fontWeight: 700, color: '#06b6d4' }}>View All →</Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-9 h-9 border-4 rounded-full animate-spin"
                style={{ borderColor: 'rgba(6,182,212,0.18)', borderTopColor: '#06b6d4' }} />
            </div>
          ) : registrations.length === 0 ? (
            <div className="py-10 text-center rounded-2xl" style={{ ...card, background: 'rgba(255,255,255,0.03)' }}>
              <p style={{ fontSize: '40px', marginBottom: '12px' }}>🏸</p>
              <p className="font-black text-white text-base mb-2">No activity yet</p>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '20px' }}>Join your first tournament!</p>
              <Link to="/tournaments"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm shimmer-btn"
                style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2, #06b6d4)', color: '#030c10', boxShadow: '0 6px 20px rgba(6,182,212,0.4)' }}>
                🏆 Find Tournaments
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {registrations.slice(0, 4).map((reg, i) => {
                const st = reg.status;
                const sc = st === 'confirmed'
                  ? { c: '#22d3ee', bg: 'rgba(6,182,212,0.12)',  border: 'rgba(6,182,212,0.3)'  }
                  : st === 'pending'
                  ? { c: '#fbbf24', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' }
                  : { c: '#f87171', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)'  };
                return (
                  <Link key={reg.id} to={`/tournaments/${reg.tournament?.id}`}
                    className="flex items-center gap-3 p-4 rounded-2xl transition-all"
                    style={{
                      ...card,
                      background: 'rgba(255,255,255,0.04)',
                      animation: `fadeUp .4s ease-out ${320 + i * 50}ms both`,
                    }}>
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <span style={{ fontSize: '20px' }}>🏆</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-white text-sm truncate mb-0.5">{reg.tournament?.name || 'Tournament'}</p>
                      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                        {reg.category?.name} · {new Date(reg.createdAt).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg flex-shrink-0 capitalize"
                      style={{ background: sc.bg, color: sc.c, border: `1px solid ${sc.border}` }}>
                      {st}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* ── §6  PROFILE CARD (compact) ───────────────────────────────── */}
        <div className="mb-5 du-card" style={{ animationDelay: '380ms' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(to bottom, #06b6d4, #0891b2)' }} />
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Profile</span>
            </div>
            <Link to="/profile" style={{ fontSize: '12px', fontWeight: 700, color: '#06b6d4' }}>Edit →</Link>
          </div>

          <div className="p-4 rounded-2xl" style={{ ...card, background: 'rgba(255,255,255,0.04)' }}>
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => user?.profilePhoto && setShowPhotoViewer(true)}
                className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#0e7490,#0369a1)', border: '3px solid #06b6d4', boxShadow: '0 0 20px rgba(6,182,212,0.4)' }}>
                {user?.profilePhoto
                  ? <img src={user.profilePhoto} alt="" className="w-full h-full object-cover" />
                  : <div className="flex items-center justify-center h-full font-black text-white text-2xl">{user?.name?.charAt(0)?.toUpperCase()}</div>}
              </button>
              <div className="flex-1 min-w-0">
                <p className="font-black text-white text-xl leading-tight">{user?.name}</p>
                {displayEmail(user?.email) && (
                  <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{displayEmail(user.email)}</p>
                )}
                {user?.city && (
                  <div className="flex items-center gap-1 mt-1">
                    <MapPinIcon className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.35)' }} />
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{user.city}{user.state ? `, ${user.state}` : ''}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Profile details rows */}
            <div className="space-y-2.5">
              {[
                { label: 'Full Name',    value: userProfile?.name  || user?.name  },
                { label: 'Phone',        value: userProfile?.phone || user?.phone },
                { label: 'Email',        value: displayEmail(userProfile?.email) || displayEmail(user?.email) },
                { label: 'Location',     value: [userProfile?.city||user?.city, userProfile?.state||user?.state].filter(Boolean).join(', ') || null },
                { label: 'Member Since', value: userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString('en-US',{month:'long',year:'numeric'}) : null },
              ].filter(r => r.value).map((row, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.38)', fontWeight: 600 }}>{row.label}</span>
                  <span className="truncate ml-3 max-w-[55%] text-right" style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>{row.value}</span>
                </div>
              ))}
            </div>

            <Link to="/profile" className="flex items-center justify-center gap-2 w-full mt-4 py-3.5 rounded-2xl font-black text-sm"
              style={{ background: 'rgba(6,182,212,0.12)', border: '1.5px solid rgba(6,182,212,0.35)', color: '#22d3ee' }}>
              <UserIcon className="w-5 h-5" />
              Edit Profile
            </Link>
          </div>
        </div>

        {/* ── §7  QUICK ACTIONS ────────────────────────────────────────── */}
        <div className="du-card" style={{ animationDelay: '430ms' }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(to bottom, #fbbf24, #f97316)' }} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Quick Actions</span>
          </div>
          <div className="space-y-2.5">
            {[
              { to: '/tournaments', label: 'Browse Tournaments', sub: 'Find your next competition', accent: '#06b6d4', icon: TrophyIcon },
              { to: '/leaderboard', label: 'Leaderboard',         sub: 'Check your global ranking',  accent: '#f59e0b', icon: ChartBarIcon },
              { to: '/live-matches',label: 'Live Matches',        sub: 'Watch ongoing matches',       accent: '#f97316', icon: FireIcon },
            ].map((a, i) => (
              <Link key={a.to} to={a.to}
                className="flex items-center gap-4 p-4 rounded-2xl transition-all"
                style={{ ...card, background: `${a.accent}08`, border: `1px solid ${a.accent}22` }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${a.accent}20`, border: `1px solid ${a.accent}45`, boxShadow: `0 4px 12px ${a.accent}30` }}>
                  <a.icon className="w-6 h-6" style={{ color: a.accent }} />
                </div>
                <div className="flex-1">
                  <p className="font-black text-white text-sm mb-0.5">{a.label}</p>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{a.sub}</p>
                </div>
                <ArrowRightIcon className="w-5 h-5 flex-shrink-0" style={{ color: a.accent }} />
              </Link>
            ))}
          </div>
        </div>

      </div>{/* /main */}

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
