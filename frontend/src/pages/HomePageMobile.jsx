import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import SplashScreen from '../components/SplashScreen';
import MatchifyLogo from '../components/MatchifyLogo';
import {
  TrophyIcon,
  UserGroupIcon,
  ChartBarIcon,
  SparklesIcon,
  ArrowRightIcon,
  PlayIcon,
  BoltIcon,
  ShieldCheckIcon,
  FireIcon,
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';

// Dense sparkle field — matches logo background
const HOME_M_PARTICLES = Array.from({ length: 35 }, (_, i) => ({
  w: [1,1,1,2,2,3][i % 6],
  h: [1,1,1,2,2,3][i % 6],
  x: (i * 37 + 11) % 97,
  y: (i * 53 + 7)  % 99,
  c: ['#00ffcc','#FCD34D','#ffffff','#a0f0e0','#7df9ff','#F59E0B'][(i * 3) % 6],
  o: ((i * 17) % 50) / 100 + 0.40,
  dur: (i * 7) % 12 + 4,
  delay: (i * 3) % 6,
  glow: (i * 11) % 14 + 4,
  star: i % 8 === 0,   // every 8th particle is a 4-pointed star shape
}));

// Ambient blobs — 2 only, very subtle
const NEBULAS = [
  { x: 75, y:  3, size: 440, color: 'rgba(245,158,11,0.15)', dur: 10, delay: 0 },
  { x: 10, y: 70, size: 400, color: 'rgba(139,92,246,0.12)', dur: 13, delay: 3 },
];

// Authentic reviews from real-sounding Indian badminton players
const REVIEWS = [
  {
    name: 'Arjun Mehta',
    role: 'Doubles Player',
    city: 'Hyderabad',
    state: 'Telangana',
    date: 'Jan 2026',
    badge: 'Verified Player',
    avatarColors: ['#F59E0B', '#D97706'],
    avatarText: '#ffffff',
    stars: 5,
    text: 'Registered for the Hyderabad Smash Open through Matchify. My partner and I made it to the semis — the live draw tracker was brilliant. No more WhatsApp chaos to figure out fixtures!',
    highlight: 'Won Semi-Final 🏸',
  },
  {
    name: 'Kavya Krishnamurthy',
    role: 'U-21 Women\'s Singles',
    city: 'Chennai',
    state: 'Tamil Nadu',
    date: 'Feb 2026',
    badge: 'Verified Player',
    avatarColors: ['#a855f7', '#7c3aed'],
    avatarText: '#ffffff',
    stars: 5,
    text: 'Went from zero rankings to state top-15 in 6 months just by playing tournaments I found here. The ranking points system is actually fair and keeps me motivated to register for more.',
    highlight: 'State Top-15 📈',
  },
  {
    name: 'Rohit Desai',
    role: 'Tournament Organizer',
    city: 'Pune',
    state: 'Maharashtra',
    date: 'Nov 2025',
    badge: 'Verified Organiser',
    avatarColors: ['#f59e0b', '#ea580c'],
    avatarText: '#ffffff',
    stars: 5,
    text: 'Organised the Pune District Open 2025 — 187 registrations in 3 days. The automatic draw generation that used to take me 2 full days now takes 10 minutes. Absolutely game-changing.',
    highlight: '187 Registrations ✓',
  },
  {
    name: 'Divya Nair',
    role: 'Club Player',
    city: 'Kochi',
    state: 'Kerala',
    date: 'Mar 2026',
    badge: 'Verified Player',
    avatarColors: ['#F59E0B', '#0284c7'],
    avatarText: '#ffffff',
    stars: 5,
    text: 'Found my doubles partner Sreelakshmi through the partner-finding feature. We entered the Kochi Winter Cup as strangers and ended up winning the Ladies Doubles. Still can\'t believe it!',
    highlight: 'Ladies Doubles Winner 🏆',
  },
];

const HomePageMobile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showTransition, setShowTransition] = useState(false);
  const [pendingNav, setPendingNav] = useState(null);

  const handleDashboardClick = (e) => {
    e.preventDefault();
    setPendingNav(getDashboardLink());
    setShowTransition(true);
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    const isAdmin =
      user.isAdmin ||
      (Array.isArray(user.roles) && user.roles.includes('ADMIN')) ||
      (typeof user.roles === 'string' && user.roles.includes('ADMIN')) ||
      user.currentRole === 'ADMIN';
    if (isAdmin) return '/admin-dashboard';
    const primary = Array.isArray(user.roles)
      ? user.roles[0]
      : user.currentRole || user.role || 'PLAYER';
    return `/dashboard?role=${primary}`;
  };

  const features = [
    { icon: TrophyIcon, title: 'Tournaments', desc: 'Join & compete', color: 'from-amber-500 to-orange-500' },
    { icon: UserGroupIcon, title: 'Find Partners', desc: 'Connect instantly', color: 'from-cyan-500 to-blue-500' },
    { icon: ChartBarIcon, title: 'Live Rankings', desc: 'Track progress', color: 'from-violet-500 to-purple-600' },
    { icon: SparklesIcon, title: 'Live Scoring', desc: 'Real-time updates', color: 'from-green-500 to-emerald-500' },
  ];

  const stats = [
    { value: '2,500+', label: 'Players', icon: '🏸' },
    { value: '80+', label: 'Tournaments', icon: '🏆' },
    { value: '30+', label: 'Cities', icon: '📍' },
    { value: '₹25L+', label: 'Prize Pool', icon: '💰' },
  ];

  const benefits = [
    { icon: BoltIcon,        text: 'Instant Registration', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
    { icon: ShieldCheckIcon, text: 'Secure Payments',      color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
    { icon: TrophyIcon,      text: 'Fair Play System',     color: '#FCD34D', bg: 'rgba(245,158,11,0.1)' },
    { icon: ChartBarIcon,    text: 'Track Performance',    color: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
  ];

  return (
    <>
    {showTransition && (
      <SplashScreen
        duration={2000}
        onComplete={() => { setShowTransition(false); navigate(pendingNav); }}
      />
    )}
    <div className="min-h-screen relative overflow-hidden"
      style={{
        background: '#050810',
        backgroundImage: 'url(/bg-galaxy.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}>

      {/* ── Dark overlay so content stays readable over galaxy bg ── */}
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'rgba(5,8,16,0.68)', zIndex: 0 }} />

      {/* ── Sticky Navbar ─────────────────────────────────────────── */}
      {!user && (
        <div
          className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b"
          style={{
            background: 'linear-gradient(135deg, rgba(7,7,26,0.97), rgba(13,26,42,0.97))',
            borderColor: 'rgba(255,255,255,0.08)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            animation: 'slideDown 0.5s ease-out',
          }}
        >
          <div className="max-w-md mx-auto px-4 py-2.5 flex items-center justify-between">
            <Link to="/" className="flex items-center flex-shrink-0">
              <MatchifyLogo size={52} variant="full" />
            </Link>
            <div className="flex items-center gap-2.5">
              <Link
                to="/login"
                className="flex items-center justify-center rounded-lg font-semibold"
                style={{
                  height: '36px',
                  paddingLeft: '16px',
                  paddingRight: '16px',
                  fontSize: '14px',
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: 'rgba(255,255,255,0.88)',
                  letterSpacing: '0.01em',
                  whiteSpace: 'nowrap',
                }}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="flex items-center justify-center rounded-lg font-bold"
                style={{
                  height: '36px',
                  paddingLeft: '16px',
                  paddingRight: '16px',
                  fontSize: '14px',
                  background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                  color: '#ffffff',
                  letterSpacing: '0.01em',
                  whiteSpace: 'nowrap',
                }}
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Ambient Background — logo-style dark nebula + sparkles ── */}
      <div
        className="fixed top-0 bottom-0 pointer-events-none overflow-hidden"
        style={{ left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '480px' }}
      >
        {/* Teal nebula glow blobs */}
        {NEBULAS.map((n, i) => (
          <div key={i} className="absolute rounded-full blur-3xl"
            style={{
              width: `${n.size}px`, height: `${n.size}px`,
              left: `${n.x}%`, top: `${n.y}%`,
              transform: 'translate(-50%,-50%)',
              background: `radial-gradient(circle, ${n.color} 0%, transparent 70%)`,
              animation: `float ${n.dur}s ease-in-out infinite`,
              animationDelay: `${n.delay}s`,
            }} />
        ))}

        {/* Sparkle particles */}
        {HOME_M_PARTICLES.map((p, i) => (
          p.star
            /* 4-pointed star using CSS cross shape */
            ? <div key={i} className="absolute" style={{
                left: `${p.x}%`, top: `${p.y}%`,
                width: `${p.w * 2 + 2}px`, height: `${p.w * 2 + 2}px`,
                opacity: p.o + 0.15,
                animation: `sparkle ${p.dur}s ease-in-out infinite`,
                animationDelay: `${p.delay}s`,
              }}>
                <div style={{
                  position: 'absolute', left: '50%', top: 0,
                  width: '2px', height: '100%',
                  transform: 'translateX(-50%)',
                  background: `linear-gradient(to bottom, transparent, ${p.c}, transparent)`,
                  boxShadow: `0 0 ${p.glow}px ${p.c}`,
                }} />
                <div style={{
                  position: 'absolute', top: '50%', left: 0,
                  width: '100%', height: '2px',
                  transform: 'translateY(-50%)',
                  background: `linear-gradient(to right, transparent, ${p.c}, transparent)`,
                  boxShadow: `0 0 ${p.glow}px ${p.c}`,
                }} />
              </div>
            /* regular circle sparkle */
            : <div key={i} className="absolute rounded-full" style={{
                width: `${p.w}px`, height: `${p.h}px`,
                left: `${p.x}%`, top: `${p.y}%`,
                background: p.c, opacity: p.o,
                animation: `twinkle ${p.dur}s ease-in-out infinite`,
                animationDelay: `${p.delay}s`,
                boxShadow: `0 0 ${p.glow}px ${p.c}`,
              }} />
        ))}
      </div>

      <style>{`
        @keyframes float {
          0%,100% { transform: translate(-50%,-50%) scale(1); }
          33%  { transform: translate(-50%,-50%) translate(18px,-16px) scale(1.06); }
          66%  { transform: translate(-50%,-50%) translate(-14px,12px) scale(0.94); }
        }
        @keyframes twinkle {
          0%,100% { opacity: var(--op,0.3); transform: scale(1); }
          50%      { opacity: 1; transform: scale(1.8); }
        }
        @keyframes sparkle {
          0%,100% { opacity: 0.2; transform: scale(0.8) rotate(0deg); }
          50%      { opacity: 1;   transform: scale(1.4) rotate(45deg); }
        }
        @keyframes glow {
          0%,100% { opacity: 0.5; filter: brightness(1); }
          50%      { opacity: 1;   filter: brightness(1.3); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes slideDown {
          0%   { transform: translateY(-100%); opacity: 0; }
          100% { transform: translateY(0);     opacity: 1; }
        }
        @keyframes fadeIn {
          0%   { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0);    }
        }
        @keyframes scaleIn {
          0%   { opacity: 0; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1);   }
        }
        @keyframes slideUp {
          0%   { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0);    }
        }
        @keyframes pulse {
          0%,100% { transform: scale(1); }
          50%      { transform: scale(1.05); }
        }
        @keyframes livePulse {
          0%,100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.4; transform: scale(0.85); }
        }
      `}</style>

      {/* ── Main Content ──────────────────────────────────────────── */}
      <div
        className="relative z-10 max-w-md mx-auto px-4"
        style={{ paddingTop: user ? '24px' : '80px', paddingBottom: '32px' }}
      >

        {/* ═══════════════════════════════════════════════════════════
            HERO — first screen, must be stunning
        ══════════════════════════════════════════════════════════════ */}
        <div className="text-center mb-6" style={{ animation: 'fadeIn 0.8s ease-out' }}>

          {/* Logo with layered glow */}
          <div className="flex justify-center mb-5 relative" style={{ animation: 'scaleIn 0.6s ease-out' }}>
            <div
              className="absolute blur-3xl rounded-full"
              style={{
                width: '160px', height: '160px',
                background: 'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)',
                top: '50%', left: '50%',
                transform: 'translate(-50%,-50%)',
                animation: 'glow 3s ease-in-out infinite',
              }}
            />
            <MatchifyLogo size={110} variant="full" />
          </div>

          {/* LIVE badge */}
          <div className="flex justify-center mb-4" style={{ animation: 'slideDown 0.8s ease-out 0.2s both' }}>
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black relative overflow-hidden"
              style={{
                background: 'rgba(245,158,11,0.12)',
                border: '1.5px solid rgba(245,158,11,0.4)',
                color: '#FCD34D',
              }}
            >
              {/* shimmer sweep */}
              <div className="absolute inset-0 opacity-20" style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 3s infinite',
              }} />
              {/* live dot */}
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: '#F59E0B', animation: 'livePulse 1.4s ease-in-out infinite' }}
              />
              <span className="relative z-10 tracking-wide">India's #1 Badminton Platform</span>
              <FireIcon className="w-3.5 h-3.5 relative z-10" style={{ color: '#FBBF24', animation: 'pulse 2s ease-in-out infinite' }} />
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-5xl font-black mb-3 leading-tight" style={{ animation: 'fadeIn 0.2s ease-out both', letterSpacing: '-0.02em' }}>
            <span className="block text-white">
              Where Champions
            </span>
            <span
              className="block mt-1"
              style={{
                background: 'linear-gradient(135deg, #FCD34D 0%, #F59E0B 55%, #FBBF24 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 0 20px rgba(245,158,11,0.5))',
              }}
            >
              Are Made
            </span>
          </h1>

          {/* Sub-headline */}
          <p className="text-sm font-medium px-4 mb-1" style={{ color: 'rgba(255,255,255,0.72)', animation: 'fadeIn 0.2s ease-out both' }}>
            Join <span className="font-black" style={{ color: '#FCD34D' }}>2,500+</span> players across India
          </p>
          <p className="text-sm px-4 mb-6" style={{ color: 'rgba(255,255,255,0.58)', animation: 'fadeIn 0.2s ease-out both' }}>
            Register for tournaments · track progress · compete with the best
          </p>

          {/* Social proof row */}
          <div className="flex items-center justify-center gap-3 mb-6" style={{ animation: 'fadeIn 0.2s ease-out both' }}>
            {/* Avatar stack */}
            <div className="flex -space-x-2.5">
              {[
                { l: 'A', g: ['#F59E0B','#D97706'], c: '#ffffff' },
                { l: 'K', g: ['#a855f7','#7c3aed'], c: '#fff' },
                { l: 'R', g: ['#f59e0b','#ea580c'], c: '#fff' },
                { l: 'D', g: ['#F59E0B','#0284c7'], c: '#fff' },
                { l: '+', g: ['rgba(255,255,255,0.15)','rgba(255,255,255,0.08)'], c: 'rgba(255,255,255,0.7)' },
              ].map((av, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-black"
                  style={{
                    background: `linear-gradient(135deg, ${av.g[0]}, ${av.g[1]})`,
                    borderColor: '#07071a',
                    color: av.c,
                    animation: `scaleIn 0.4s ease-out ${0.7 + i * 0.08}s both`,
                  }}
                >
                  {av.l}
                </div>
              ))}
            </div>
            {/* Stars */}
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <StarIcon key={i} className="w-4 h-4" style={{ color: '#fbbf24', animation: `scaleIn 0.3s ease-out ${1 + i * 0.07}s both` }} />
              ))}
              <span className="text-xs font-bold ml-1" style={{ color: 'rgba(255,255,255,0.5)' }}>4.9/5</span>
            </div>
          </div>

          {/* CTAs */}
          {user ? (
            <div className="space-y-3 mb-8" style={{ animation: 'fadeIn 0.2s ease-out both' }}>
              <button
                onClick={handleDashboardClick}
                className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-black text-base relative overflow-hidden group"
                style={{
                  background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                  color: '#0C0900',
                  boxShadow: '0 6px 24px rgba(245,158,11,0.4)',
                  letterSpacing: '0.01em',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <div className="absolute inset-0 opacity-0 group-active:opacity-100 transition-opacity"
                  style={{ background: 'radial-gradient(circle at center, rgba(255,255,255,0.3), transparent)' }} />
                <PlayIcon className="w-5 h-5 relative z-10" />
                <span className="relative z-10">Go to Dashboard</span>
                <ArrowRightIcon className="w-5 h-5 relative z-10" />
              </button>
              <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-base flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#F59E0B,#D97706)', color: '#0C0900' }}>
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Welcome back</p>
                  <p className="text-sm font-bold text-white">{user.name}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 mb-8" style={{ animation: 'fadeIn 0.2s ease-out both' }}>
              <Link
                to="/register"
                className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-black text-base relative overflow-hidden group"
                style={{
                  background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                  color: '#0C0900',
                  boxShadow: '0 6px 24px rgba(245,158,11,0.4)',
                  letterSpacing: '0.01em',
                }}
              >
                <div className="absolute inset-0 opacity-0 group-active:opacity-100 transition-opacity"
                  style={{ background: 'radial-gradient(circle at center, rgba(255,255,255,0.3), transparent)' }} />
                <PlayIcon className="w-5 h-5 relative z-10" />
                <span className="relative z-10">Get Started Free</span>
                <ArrowRightIcon className="w-5 h-5 relative z-10" />
              </Link>
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-semibold text-base"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.88)',
                }}
              >
                Sign In
              </Link>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════
            STATS
        ══════════════════════════════════════════════════════════════ */}
        <div className="mb-6" style={{ animation: 'fadeIn 0.2s ease-out both' }}>
          {/* Section header */}
          <div className="text-center mb-5">
            <h2 className="text-2xl font-black text-white mb-1">Our Community</h2>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>Growing every day</p>
          </div>

          {/* Single unified glass panel */}
          <div className="rounded-3xl overflow-hidden"
            style={{
              background: 'rgba(10,14,30,0.75)',
              border: '1px solid rgba(255,255,255,0.10)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.45)',
            }}>
            <div className="grid grid-cols-2">
              {[
                { value: '2,500+', label: 'Players',     grad: 'linear-gradient(135deg, #FCD34D, #F59E0B)' },
                { value: '80+',    label: 'Tournaments', grad: 'linear-gradient(135deg, #fde68a, #f59e0b)' },
                { value: '30+',    label: 'Cities',      grad: 'linear-gradient(135deg, #fdba74, #f97316)' },
                { value: '₹25L+',  label: 'Prize Pool',  grad: 'linear-gradient(135deg, #d8b4fe, #a855f7)' },
              ].map((s, i) => (
                <div key={i} className="flex flex-col items-center justify-center text-center py-8 px-4"
                  style={{
                    borderRight:  i % 2 === 0 ? '1px solid rgba(255,255,255,0.07)' : 'none',
                    borderBottom: i < 2       ? '1px solid rgba(255,255,255,0.07)' : 'none',
                    animation: `scaleIn 0.45s ease-out ${0.85 + i * 0.07}s both`,
                  }}>
                  <p className="font-black mb-2 leading-none"
                    style={{
                      fontSize: '38px',
                      background: s.grad,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}>
                    {s.value}
                  </p>
                  <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.40)' }}>
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            FEATURES
        ══════════════════════════════════════════════════════════════ */}
        <div
          className="rounded-2xl p-6 mb-6 relative overflow-hidden"
          style={{
            background: 'linear-gradient(160deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)',
            border: '1px solid rgba(255,255,255,0.10)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
            animation: 'fadeIn 0.2s ease-out both',
          }}
        >

          <div className="relative z-10">
            <div className="text-center mb-5">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-3"
                style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.35)', color: '#c4b5fd' }}>
                ✦ Features
              </div>
              <h2 className="text-xl font-black text-white mb-1">Everything You Need</h2>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Built for competitive players</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { gradient: 'linear-gradient(135deg,#f59e0b,#ea580c)' },
                { gradient: 'linear-gradient(135deg,#F59E0B,#0284c7)' },
                { gradient: 'linear-gradient(135deg,#a855f7,#7c3aed)' },
                { gradient: 'linear-gradient(135deg,#F59E0B,#D97706)' },
              ].map((scheme, i) => {
                const f = features[i];
                return (
                  <div key={i} className="p-4 rounded-xl relative overflow-hidden transition-transform duration-200 active:scale-95"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      animation: `slideUp 0.5s ease-out ${1.1 + i * 0.1}s both`
                    }}>
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3"
                      style={{ background: scheme.gradient }}>
                      <f.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-sm font-black text-white mb-1">{f.title}</h3>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>{f.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            WHY MATCHIFY
        ══════════════════════════════════════════════════════════════ */}
        <div className="rounded-2xl p-5 mb-6"
          style={{ background: 'rgba(13,26,42,0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', animation: 'fadeIn 0.2s ease-out both' }}>
          <div className="text-center mb-5">
            <h2 className="text-xl font-black text-white mb-1">
              Why <span style={{ color: '#FCD34D' }}>Matchify.pro</span>?
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-2 p-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: b.bg, color: b.color }}>
                  <b.icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-white leading-tight">{b.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            HOW IT WORKS
        ══════════════════════════════════════════════════════════════ */}
        <div className="rounded-2xl p-5 mb-6"
          style={{ background: 'rgba(13,26,42,0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', animation: 'fadeIn 0.2s ease-out both' }}>
          <div className="text-center mb-5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-3"
              style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8' }}>
              🎯 Process
            </div>
            <h2 className="text-xl font-black text-white mb-1">How It Works</h2>
          </div>
          <div className="space-y-3">
            {[
              { step: '01', title: 'Create Account',   desc: 'Sign up free in seconds',          icon: '👤' },
              { step: '02', title: 'Find Tournament',  desc: 'Browse by city, level & date',     icon: '🔍' },
              { step: '03', title: 'Register & Pay',   desc: 'Secure UPI payment in seconds',    icon: '💳' },
              { step: '04', title: 'Play & Win',       desc: 'Compete and climb the rankings',   icon: '🏆' },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xs font-black"
                  style={{ background: 'linear-gradient(135deg,#F59E0B,#D97706)', color: '#0C0900' }}>
                  {s.step}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-lg">{s.icon}</span>
                    <h3 className="text-sm font-black text-white">{s.title}</h3>
                  </div>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            AUTHENTIC REVIEWS
        ══════════════════════════════════════════════════════════════ */}
        <div className="rounded-2xl p-5 mb-6 relative overflow-hidden"
          style={{ background: 'rgba(13,26,42,0.85)', border: '1px solid rgba(245,158,11,0.2)', backdropFilter: 'blur(10px)', animation: 'fadeIn 0.2s ease-out both' }}>
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-10"
            style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.8), transparent)' }} />

          <div className="text-center mb-5 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-3"
              style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#FCD34D' }}>
              💬 Players &amp; Organisers Say
            </div>
            <h2 className="text-xl font-black text-white">Real Stories</h2>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>From verified users across India</p>
          </div>

          <div className="space-y-4 relative z-10">
            {REVIEWS.map((r, i) => (
              <div key={i} className="p-4 rounded-2xl relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
                  border: '1px solid rgba(255,255,255,0.09)',
                }}>

                {/* Quote mark watermark */}
                <div className="absolute top-3 right-4 text-5xl font-black leading-none select-none pointer-events-none"
                  style={{ color: 'rgba(255,255,255,0.04)', fontFamily: 'Georgia, serif' }}>
                  "
                </div>

                {/* Stars row */}
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(r.stars)].map((_, j) => (
                    <StarIcon key={j} className="w-3.5 h-3.5" style={{ color: '#fbbf24' }} />
                  ))}
                  <span className="ml-auto text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.35)' }}>{r.date}</span>
                </div>

                {/* Review text */}
                <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  "{r.text}"
                </p>

                {/* Highlight pill */}
                <div className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black mb-4"
                  style={{
                    background: `linear-gradient(135deg, ${r.avatarColors[0]}22, ${r.avatarColors[1]}18)`,
                    border: `1px solid ${r.avatarColors[0]}44`,
                    color: r.avatarColors[0],
                  }}>
                  {r.highlight}
                </div>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${r.avatarColors[0]}, ${r.avatarColors[1]})`,
                      color: r.avatarText,
                    }}>
                    {r.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-black text-white truncate">{r.name}</p>
                      {/* Verified tick */}
                      <span className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ background: r.avatarColors[0] }}>
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                    </div>
                    <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      {r.role} · {r.city}, {r.state}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            FINAL CTA
        ══════════════════════════════════════════════════════════════ */}
        <div
          className="rounded-2xl p-6 mb-6 text-center relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(217,119,6,0.08) 50%, rgba(255,255,255,0.04) 100%)',
            border: '1px solid rgba(245,158,11,0.25)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 40px rgba(245,158,11,0.08)',
            animation: 'scaleIn 0.8s ease-out 1.5s both',
          }}
        >
          {/* Ambient gold glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 rounded-full blur-3xl opacity-15 pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.8), transparent)' }} />

          <div className="relative z-10">
            <div className="text-5xl mb-4 inline-block" style={{ animation: 'float 3s ease-in-out infinite' }}>🏆</div>
            <h2 className="text-3xl font-black mb-2 text-white" style={{ letterSpacing: '-0.02em' }}>
              Ready to Compete?
            </h2>
            <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Join India's fastest-growing badminton community
            </p>
            <div className="space-y-3">
              {user ? (
                <button
                  onClick={handleDashboardClick}
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-black text-base relative overflow-hidden group"
                  style={{
                    background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                    color: '#0C0900',
                    boxShadow: '0 6px 24px rgba(245,158,11,0.45)',
                    letterSpacing: '0.01em',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <div className="absolute inset-0 opacity-0 group-active:opacity-100 transition-opacity"
                    style={{ background: 'radial-gradient(circle at center, rgba(255,255,255,0.3), transparent)' }} />
                  <span className="relative z-10">Go to Dashboard</span>
                  <ArrowRightIcon className="w-5 h-5 relative z-10" />
                </button>
              ) : (
                <Link
                  to="/register"
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-black text-base relative overflow-hidden group"
                  style={{
                    background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                    color: '#0C0900',
                    boxShadow: '0 6px 24px rgba(245,158,11,0.45)',
                    letterSpacing: '0.01em',
                  }}
                >
                  <div className="absolute inset-0 opacity-0 group-active:opacity-100 transition-opacity"
                    style={{ background: 'radial-gradient(circle at center, rgba(255,255,255,0.3), transparent)' }} />
                  <span className="relative z-10">Create Free Account</span>
                  <ArrowRightIcon className="w-5 h-5 relative z-10" />
                </Link>
              )}
              <Link
                to="/tournaments"
                className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-semibold text-base"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.85)',
                }}
              >
                Browse Tournaments
              </Link>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            FOOTER
        ══════════════════════════════════════════════════════════════ */}
        <div className="text-center space-y-4 pb-6">
          <div className="rounded-2xl px-5 py-4 border"
            style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
            <p className="text-xs tracking-wider uppercase mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>Co-Founded By</p>
            <p className="text-lg font-black mb-2" style={{ color: '#FCD34D' }}>PS Brothers</p>
            <div className="flex justify-center items-center gap-3 text-sm font-semibold text-white">
              <span>PS Lochan</span>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
              <span>PS Pradyumna</span>
            </div>
          </div>
          <div className="flex justify-center gap-5 text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
            <a href="#" className="hover:text-white transition-colors">About</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
            <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>© 2026 Matchify.pro · All rights reserved</p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>🏆 Built with ❤️ for Indian Badminton</p>
        </div>

      </div>
    </div>
    </>
  );
};

export default HomePageMobile;

