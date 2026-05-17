import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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
  RocketLaunchIcon,
  FireIcon,
  CalendarDaysIcon,
  MapPinIcon,
  CurrencyRupeeIcon,
  SignalIcon,
  Cog6ToothIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import { StarIcon, EyeIcon } from '@heroicons/react/24/solid';

const HOME_PARTICLES = Array.from({ length: 16 }, (_, i) => ({
  w: (i * 7 + 1) % 2 + 1,
  h: (i * 11 + 1) % 2 + 1,
  x: (i * 37 + 11) % 97,
  y: (i * 53 + 7) % 91,
  c: ['#00ff88', '#00d4ff', 'rgba(255,255,255,0.8)'][i % 3],
  o: ((i * 13) % 40) / 100 + 0.15,
  dur: (i * 7) % 10 + 5,
  delay: (i * 3) % 5,
  glow: (i * 11) % 12 + 4,
}));

const injectStyles = () => {
  if (document.head.querySelector('style[data-homepage]')) return;
  const style = document.createElement('style');
  style.setAttribute('data-homepage', 'true');
  style.textContent = `
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(24px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes floatY {
      0%, 100% { transform: translateY(0px); }
      50%       { transform: translateY(-12px); }
    }
    @keyframes pulseGlow {
      0%, 100% { opacity: 0.4; }
      50%       { opacity: 1; }
    }
    @keyframes shimmer {
      0% { background-position: -1000px 0; }
      100% { background-position: 1000px 0; }
    }
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.85); }
      to { opacity: 1; transform: scale(1); }
    }
    @keyframes slideRight {
      from { opacity: 0; transform: translateX(-20px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes borderPulse {
      0%, 100% { border-color: rgba(0,212,255,0.4); box-shadow: 0 0 20px rgba(0,212,255,0.1); }
      50%       { border-color: rgba(0,212,255,0.8); box-shadow: 0 0 35px rgba(0,212,255,0.25); }
    }
    .anim-fade-up  { animation: fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) forwards; opacity: 0; }
    .anim-float    { animation: floatY 6s ease-in-out infinite; }
    .anim-glow     { animation: pulseGlow 4s ease-in-out infinite; }
    .anim-scale-in { animation: scaleIn 0.6s cubic-bezier(0.16,1,0.3,1) forwards; opacity: 0; }
    .anim-slide-r  { animation: slideRight 0.6s cubic-bezier(0.16,1,0.3,1) forwards; opacity: 0; }
    .btn-pulse     { animation: borderPulse 2.5s ease-in-out infinite; }
    .delay-100  { animation-delay: 0.1s; }
    .delay-200  { animation-delay: 0.2s; }
    .delay-300  { animation-delay: 0.3s; }
    .delay-400  { animation-delay: 0.4s; }
    .delay-500  { animation-delay: 0.5s; }
    .delay-600  { animation-delay: 0.6s; }
    .delay-700  { animation-delay: 0.7s; }
    .delay-800  { animation-delay: 0.8s; }
    .neon-green { text-shadow: 0 0 25px rgba(0,255,136,0.7), 0 0 50px rgba(0,255,136,0.4); }
    .neon-cyan  { text-shadow: 0 0 25px rgba(0,212,255,0.7), 0 0 50px rgba(0,212,255,0.4); }
    .card-hover {
      transition: all 0.3s ease;
    }
    .card-hover:hover {
      box-shadow: 0 0 30px rgba(0,255,136,0.12), 0 8px 32px rgba(0,0,0,0.5);
      transform: translateY(-3px);
    }
    .btn-green-glow {
      box-shadow: 0 0 25px rgba(0,255,136,0.45), 0 4px 16px rgba(0,0,0,0.4);
      transition: all 0.25s ease;
    }
    .btn-green-glow:hover {
      box-shadow: 0 0 40px rgba(0,255,136,0.65), 0 8px 24px rgba(0,0,0,0.5);
      transform: translateY(-2px);
    }
    .btn-cyan-glow {
      box-shadow: 0 0 25px rgba(0,212,255,0.35), 0 4px 16px rgba(0,0,0,0.4);
      transition: all 0.25s ease;
    }
    .btn-cyan-glow:hover {
      box-shadow: 0 0 40px rgba(0,212,255,0.55), 0 8px 24px rgba(0,0,0,0.5);
      transform: translateY(-2px);
    }
    .grid-bg {
      background-image:
        linear-gradient(rgba(0,255,136,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,255,136,0.04) 1px, transparent 1px);
      background-size: 50px 50px;
    }
    .shimmer-text {
      background: linear-gradient(90deg, #00ff88 0%, #00d4ff 50%, #00ff88 100%);
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: shimmer 3s linear infinite;
    }
    .format-pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.04em;
    }
    .live-dot {
      width: 7px; height: 7px;
      border-radius: 50%;
      background: #00ff88;
      animation: pulseGlow 1.5s ease-in-out infinite;
      box-shadow: 0 0 8px #00ff88;
    }
    .tournament-preview-card {
      position: relative;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid rgba(0,212,255,0.25);
      background: rgba(255,255,255,0.03);
    }
  `;
  document.head.appendChild(style);
};

function HomePage() {
  const { user } = useAuth();
  injectStyles();

  const getDashboardLink = () => {
    if (!user) return '/login';
    const primary = (Array.isArray(user.roles) ? user.roles : [user.role])[0];
    switch (primary) {
      case 'PLAYER':    return '/dashboard';
      case 'ORGANIZER': return '/organizer/dashboard';
      case 'UMPIRE':    return '/umpire/dashboard';
      case 'ADMIN':     return '/admin/dashboard';
      default:          return '/dashboard';
    }
  };

  const features = [
    { icon: TrophyIcon, title: 'Smart Tournament Engine', desc: 'Knockout, Round Robin, and Hybrid formats. Automated seeding, draws, and bracket progression.', detail: '8 – 256 players, any format', gradient: 'linear-gradient(135deg,#f59e0b,#f97316)' },
    { icon: SignalIcon, title: 'Point-by-Point Live Scoring', desc: 'Real-time updates for spectators, coaches, and players — no refresh needed.', detail: 'WebSocket powered · Zero delay', gradient: 'linear-gradient(135deg,#00c853,#00ff88)' },
    { icon: UserGroupIcon, title: 'Doubles Partner Network', desc: 'Invite partners via app. Paired registrations and doubles-specific rankings.', detail: "Men's · Women's · Mixed Doubles", gradient: 'linear-gradient(135deg,#06b6d4,#3b82f6)' },
    { icon: ChartBarIcon, title: 'Matchify Points & Rankings', desc: 'Earn points every match. Climb city, state, and national leaderboards automatically.', detail: 'Updates after every result', gradient: 'linear-gradient(135deg,#8b5cf6,#9333ea)' },
    { icon: ShieldCheckIcon, title: 'Secure UPI Payments', desc: 'Pay via UPI QR. Organizer verifies screenshots. Wallet refunds in seconds.', detail: 'No card details stored · 100% safe', gradient: 'linear-gradient(135deg,#10b981,#059669)' },
    { icon: Cog6ToothIcon, title: 'Full Organizer Control', desc: 'Manage registrations, umpires, draws, and payments — all from one dashboard.', detail: 'Built for serious organizers', gradient: 'linear-gradient(135deg,#f59e0b,#ef4444)' },
  ];

  const stats = [
    { value: '1000+', label: 'Players',     icon: '🏸' },
    { value: '50+',   label: 'Tournaments', icon: '🏆' },
    { value: '25+',   label: 'Cities',      icon: '📍' },
    { value: '₹10L+', label: 'Prize Pool',  icon: '💰' },
  ];

  const steps = [
    { step: '01', title: 'Browse Tournaments', desc: 'Filter by city, level, format & prize. No login needed.', icon: '🔍', gradient: 'linear-gradient(135deg,#00d4ff,#3b82f6)', highlight: true },
    { step: '02', title: 'Create Account',      desc: 'Sign up free in 30 seconds. No card required.',          icon: '👤', gradient: 'linear-gradient(135deg,#3b82f6,#8b5cf6)' },
    { step: '03', title: 'Register & Pay',      desc: 'Pay via UPI. Get instant confirmation.',                  icon: '💳', gradient: 'linear-gradient(135deg,#00c853,#00ff88)' },
    { step: '04', title: 'Play & Win',          desc: 'Compete live. Scores update in real-time.',               icon: '🏆', gradient: 'linear-gradient(135deg,#f59e0b,#fb923c)' },
  ];

  const testimonials = [
    { name: 'Rahul Sharma',  role: 'State Level Player',   city: 'Bangalore', emoji: '👨', badge: 'State Champion 🥇',    badgeColor: '#f59e0b', text: 'Found tournaments in my city within minutes. Live scoring kept my parents updated from home!' },
    { name: 'Priya Patel',   role: 'Club Player',          city: 'Mumbai',    emoji: '👩', badge: 'Ladies Doubles Winner 🏅', badgeColor: '#ec4899', text: 'Partner invite system is genius. Registered for doubles with my friend in under 2 minutes.' },
    { name: 'Arjun Kumar',   role: 'Tournament Organizer', city: 'Delhi',     emoji: '👨', badge: 'Organizer ⚙️',          badgeColor: '#00d4ff', text: 'Automated draws and payment verification save me 4 hours per event. Total game-changer.' },
  ];

  const tournamentFormats = [
    { label: 'Knockout',    color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  icon: '⚡' },
    { label: 'Round Robin', color: '#00d4ff', bg: 'rgba(0,212,255,0.12)',   icon: '🔄' },
    { label: 'Hybrid',      color: '#a855f7', bg: 'rgba(168,85,247,0.12)', icon: '🎯' },
    { label: 'Singles',     color: '#00ff88', bg: 'rgba(0,255,136,0.12)',   icon: '🏸' },
    { label: 'Doubles',     color: '#f97316', bg: 'rgba(249,115,22,0.12)',  icon: '👥' },
    { label: 'Mixed',       color: '#ec4899', bg: 'rgba(236,72,153,0.12)',  icon: '🤝' },
  ];

  const organizerPerks = [
    { icon: '📋', title: 'Draw Generation',      desc: 'Auto-seeded brackets generated in one click.' },
    { icon: '💳', title: 'Payment Verification', desc: 'Review UPI screenshots. Approve or reject.' },
    { icon: '⚖️', title: 'Umpire Management',   desc: 'Assign umpires. They score live from court.' },
    { icon: '📊', title: 'Live Dashboard',       desc: 'Track all matches and results in real time.' },
    { icon: '🔔', title: 'Auto Notifications',   desc: 'Players notified on draw, results & more.' },
    { icon: '💰', title: 'Payout Tracking',      desc: 'Transparent prize money management.' },
  ];

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: '#07071a' }}>

      {/* ── BACKGROUND ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="grid-bg absolute inset-0" />
        <div className="anim-glow anim-float absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(0,255,136,0.12) 0%, transparent 70%)' }} />
        <div className="anim-glow anim-float delay-300 absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)' }} />
        <div className="anim-glow anim-float delay-500 absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)' }} />
        {HOME_PARTICLES.map((p, i) => (
          <div key={i} className="absolute rounded-full"
            style={{ width: `${p.w}px`, height: `${p.h}px`, left: `${p.x}%`, top: `${p.y}%`,
              background: p.c, opacity: p.o,
              animation: `floatY ${p.dur}s ease-in-out infinite`, animationDelay: `${p.delay}s`,
              boxShadow: `0 0 ${p.glow}px ${p.c}` }} />
        ))}
      </div>

      {/* ════════════ HERO ════════════ */}
      <section className="relative z-10 pt-16 pb-10 px-5 flex flex-col items-center text-center">
        <div className="w-full" style={{ maxWidth: '420px' }}>

          {/* Logo */}
          <div className="anim-scale-in mb-4 flex justify-center relative">
            <div className="absolute inset-0 m-auto w-28 h-28 rounded-full blur-3xl anim-glow"
              style={{ background: 'radial-gradient(circle, rgba(0,255,136,0.2) 0%, transparent 70%)' }} />
            <div className="anim-float relative z-10">
              <MatchifyLogo size={72} variant="icon" glow={true} />
            </div>
          </div>

          {/* Badge */}
          <div className="anim-scale-in delay-100 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold tracking-wider uppercase mb-4"
            style={{ background: 'rgba(0,255,136,0.08)', borderColor: 'rgba(0,255,136,0.25)', color: '#00ff88' }}>
            <RocketLaunchIcon className="w-3.5 h-3.5" />
            India's #1 Badminton Platform
            <FireIcon className="w-3.5 h-3.5 text-orange-400" />
          </div>

          {/* Title */}
          <div className="anim-fade-up delay-200 mb-3">
            <h1 className="font-black leading-none tracking-tighter" style={{ fontSize: '3.2rem' }}>
              <span className="shimmer-text block">MATCHIFY</span>
              <span className="neon-cyan block" style={{ color: '#00d4ff', fontSize: '2.8rem' }}>.PRO</span>
            </h1>
          </div>

          <p className="anim-fade-up delay-200 text-base font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.9)' }}>
            🏸 Compete · Track · Dominate
          </p>

          <p className="anim-fade-up delay-300 text-sm mb-6 leading-relaxed px-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
            India's tournament management platform — discover badminton tournaments near you, register in minutes, and compete for glory.
          </p>

          {/* ── PRIMARY CTAs ── */}
          {user ? (
            <div className="anim-fade-up delay-400 flex flex-col gap-3 w-full">
              <Link to="/tournaments"
                className="btn-cyan-glow flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-black text-base active:scale-95"
                style={{ background: 'linear-gradient(135deg,#0891b2,#00d4ff)', color: '#001a2e' }}>
                <EyeIcon className="w-5 h-5" />
                Browse Tournaments
                <ArrowRightIcon className="w-5 h-5" />
              </Link>
              <Link to={getDashboardLink()}
                className="btn-green-glow flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-base active:scale-95"
                style={{ background: 'linear-gradient(135deg,#00c853,#00ff88)', color: '#003320' }}>
                <PlayIcon className="w-5 h-5" />
                Go to Dashboard
              </Link>
              <div className="flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border"
                style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                  style={{ background: 'linear-gradient(135deg,#00c853,#00ff88)', color: '#003320' }}>
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Signed in as</p>
                  <p className="text-sm font-semibold text-white">{user.name}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="anim-fade-up delay-400 flex flex-col gap-3 w-full">
              {/* PRIMARY: Browse Tournaments — zero friction */}
              <Link to="/tournaments"
                className="btn-pulse btn-cyan-glow flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl font-black text-lg active:scale-95"
                style={{ background: 'linear-gradient(135deg,#0891b2,#00d4ff)', color: '#001a2e', border: '2px solid rgba(0,212,255,0.5)' }}>
                <EyeIcon className="w-6 h-6" />
                Browse Tournaments
                <ArrowRightIcon className="w-5 h-5" />
              </Link>

              {/* Free label */}
              <div className="flex items-center gap-2 justify-center py-1">
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                <span className="text-xs px-3" style={{ color: 'rgba(255,255,255,0.35)' }}>no account needed to browse</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
              </div>

              {/* SECONDARY: Sign up */}
              <Link to="/register"
                className="btn-green-glow flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-base active:scale-95"
                style={{ background: 'linear-gradient(135deg,#00c853,#00ff88)', color: '#003320' }}>
                <SparklesIcon className="w-5 h-5" />
                Sign Up Free — Register & Compete
              </Link>

              {/* Sign in link */}
              <Link to="/login"
                className="flex items-center justify-center gap-1.5 py-2 text-sm font-medium transition-colors"
                style={{ color: 'rgba(255,255,255,0.45)' }}>
                <LockClosedIcon className="w-3.5 h-3.5" />
                Already have an account? <span style={{ color: '#00ff88' }}>Sign In</span>
              </Link>
            </div>
          )}

          {/* Social proof */}
          <div className="anim-fade-up delay-600 mt-6 flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold"
                    style={{ background: 'linear-gradient(135deg,#00c853,#00ff88)', borderColor: '#07071a', color: '#003320' }}>
                    {['R','P','A','K'][i]}
                  </div>
                ))}
              </div>
              <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>1000+ players</span>
            </div>
            <div className="w-px h-5" style={{ background: 'rgba(255,255,255,0.1)' }} />
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => <StarIcon key={i} className="w-4 h-4 text-amber-400" />)}
              <span className="text-xs ml-1" style={{ color: 'rgba(255,255,255,0.5)' }}>4.9</span>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════ TOURNAMENT PREVIEW TEASER ════════════ */}
      {!user && (
        <section className="relative z-10 py-4 px-5">
          <div className="mx-auto" style={{ maxWidth: '420px' }}>
            <p className="text-center text-xs font-semibold mb-3 tracking-wider uppercase" style={{ color: 'rgba(0,212,255,0.7)' }}>
              🏆 Tournaments Open Near You
            </p>

            {/* Mock tournament cards */}
            <div className="flex flex-col gap-3">
              {[
                { name: 'Kerala State Open 2026', city: 'Kochi, Kerala', date: 'Jun 14–16', prize: '₹50,000', format: 'Knockout', color: '#f59e0b', live: true },
                { name: 'Bangalore Badminton League', city: 'Bangalore', date: 'Jun 22–25', prize: '₹30,000', format: 'Round Robin', color: '#00d4ff', live: false },
              ].map((t, i) => (
                <div key={i} className="tournament-preview-card p-4" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {t.live && (
                          <div className="flex items-center gap-1">
                            <div className="live-dot" />
                            <span className="text-xs font-bold" style={{ color: '#00ff88' }}>OPEN</span>
                          </div>
                        )}
                        <span className="format-pill" style={{ background: `${t.color}18`, color: t.color, border: `1px solid ${t.color}35` }}>
                          {t.format}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-white leading-tight">{t.name}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="flex items-center gap-1 text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                          <MapPinIcon className="w-3 h-3" />{t.city}
                        </span>
                        <span className="flex items-center gap-1 text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                          <CalendarDaysIcon className="w-3 h-3" />{t.date}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Prize</p>
                      <p className="text-base font-black" style={{ color: '#00ff88' }}>{t.prize}</p>
                    </div>
                  </div>
                  {/* Locked register button — prompts sign in */}
                  <div className="relative overflow-hidden rounded-xl">
                    <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.35)' }}>
                      <LockClosedIcon className="w-4 h-4" />
                      Sign in to Register
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* View all link */}
            <Link to="/tournaments"
              className="flex items-center justify-center gap-2 mt-4 py-3 rounded-2xl font-bold text-sm active:scale-95 transition-all"
              style={{ background: 'rgba(0,212,255,0.08)', border: '1.5px solid rgba(0,212,255,0.3)', color: '#00d4ff' }}>
              <EyeIcon className="w-4 h-4" />
              View All Tournaments
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>
        </section>
      )}

      {/* ════════════ STATS ════════════ */}
      <section className="relative z-10 py-8 px-5">
        <div className="mx-auto grid grid-cols-4 gap-2" style={{ maxWidth: '420px' }}>
          {stats.map((s, i) => (
            <div key={i} className="flex flex-col items-center gap-1 py-4 px-1 rounded-2xl border"
              style={{ background: 'rgba(0,255,136,0.04)', borderColor: 'rgba(0,255,136,0.1)' }}>
              <span className="text-xl">{s.icon}</span>
              <span className="text-lg font-black" style={{ color: '#00ff88' }}>{s.value}</span>
              <span className="text-xs font-medium text-center leading-tight" style={{ color: 'rgba(255,255,255,0.45)' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════ FORMATS ════════════ */}
      <section className="relative z-10 py-4 px-5">
        <div className="mx-auto" style={{ maxWidth: '420px' }}>
          <div className="rounded-2xl p-5 border" style={{ background: 'rgba(99,102,241,0.04)', borderColor: 'rgba(99,102,241,0.2)' }}>
            <h3 className="text-sm font-black text-white mb-1">Explore All Tournament Formats</h3>
            <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>Browse & filter — no sign-in required</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {tournamentFormats.map((f, i) => (
                <span key={i} className="format-pill"
                  style={{ background: f.bg, color: f.color, border: `1px solid ${f.color}35` }}>
                  {f.icon} {f.label}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { icon: <MapPinIcon className="w-4 h-4" />, label: 'Filter by City' },
                { icon: <CurrencyRupeeIcon className="w-4 h-4" />, label: 'See Prize Pool' },
                { icon: <CalendarDaysIcon className="w-4 h-4" />, label: 'Check Dates' },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl text-center"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <span style={{ color: '#818cf8' }}>{item.icon}</span>
                  <span className="text-xs font-semibold text-white leading-tight">{item.label}</span>
                </div>
              ))}
            </div>
            <Link to="/tournaments"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm active:scale-95 transition-all"
              style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.25),rgba(139,92,246,0.25))', border: '1px solid rgba(99,102,241,0.4)', color: '#a78bfa' }}>
              <EyeIcon className="w-4 h-4" />
              Browse All Tournaments Free
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════ HOW IT WORKS ════════════ */}
      <section className="relative z-10 py-12 px-5">
        <div className="mx-auto" style={{ maxWidth: '420px' }}>
          <div className="text-center mb-7">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase mb-3"
              style={{ background: 'rgba(6,182,212,0.1)', color: '#22d3ee', border: '1px solid rgba(6,182,212,0.2)' }}>
              🎯 How It Works
            </span>
            <h2 className="text-2xl font-black text-white leading-tight">
              Zero to <span style={{ color: '#22d3ee' }}>Competing</span> in 4 Steps
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {steps.map((s, i) => (
              <div key={i} className="card-hover relative rounded-2xl p-4 border"
                style={{
                  background: s.highlight ? 'rgba(0,212,255,0.06)' : 'rgba(255,255,255,0.03)',
                  borderColor: s.highlight ? 'rgba(0,212,255,0.3)' : 'rgba(255,255,255,0.07)',
                  boxShadow: s.highlight ? '0 0 20px rgba(0,212,255,0.08)' : 'none'
                }}>
                {s.highlight && (
                  <span className="absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(0,212,255,0.15)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.3)', fontSize: '9px' }}>
                    START HERE
                  </span>
                )}
                <div className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-white text-xs font-black mb-2"
                  style={{ background: s.gradient }}>
                  {s.step}
                </div>
                <div className="text-2xl mb-2">{s.icon}</div>
                <h3 className="text-sm font-bold text-white mb-1">{s.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{s.desc}</p>
              </div>
            ))}
          </div>

          {!user && (
            <div className="mt-5 flex flex-col gap-2.5">
              <Link to="/tournaments"
                className="btn-cyan-glow flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm active:scale-95"
                style={{ background: 'linear-gradient(135deg,#0891b2,#00d4ff)', color: '#001a2e' }}>
                <EyeIcon className="w-4 h-4" />
                Start Browsing — No Account Needed
              </Link>
              <Link to="/register"
                className="flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm border active:scale-95 transition-all"
                style={{ background: 'rgba(0,255,136,0.06)', borderColor: 'rgba(0,255,136,0.25)', color: '#00ff88' }}>
                Sign Up Free to Compete
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ════════════ FEATURES ════════════ */}
      <section className="relative z-10 py-10 px-5">
        <div className="mx-auto" style={{ maxWidth: '420px' }}>
          <div className="text-center mb-7">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase mb-3"
              style={{ background: 'rgba(0,255,136,0.08)', color: '#00ff88', border: '1px solid rgba(0,255,136,0.18)' }}>
              ✦ Features
            </span>
            <h2 className="text-2xl font-black text-white leading-tight">
              Built to <span style={{ color: '#00ff88' }}>Dominate</span>
            </h2>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>For players and organizers alike</p>
          </div>

          <div className="flex flex-col gap-3">
            {features.map((f, i) => (
              <div key={i} className="card-hover flex items-start gap-4 rounded-2xl p-4 border"
                style={{ background: 'rgba(255,255,255,0.025)', borderColor: 'rgba(255,255,255,0.07)' }}>
                <div className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: f.gradient }}>
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-white mb-0.5">{f.title}</h3>
                  <p className="text-xs leading-relaxed mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>{f.desc}</p>
                  <span className="text-xs px-2.5 py-1 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    {f.detail}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ FOR ORGANIZERS ════════════ */}
      <section className="relative z-10 py-10 px-5">
        <div className="mx-auto" style={{ maxWidth: '420px' }}>
          <div className="rounded-3xl p-5 border relative overflow-hidden"
            style={{ background: 'rgba(245,158,11,0.03)', borderColor: 'rgba(245,158,11,0.2)' }}>
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)' }} />
            <div className="text-center mb-5 relative">
              <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase mb-3"
                style={{ background: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.22)' }}>
                🎪 For Organizers
              </span>
              <h2 className="text-xl font-black text-white leading-tight">
                Run Tournaments <span style={{ color: '#fbbf24' }}>Like a Pro</span>
              </h2>
              <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
                End-to-end tournament management — draws, payments, umpires, live scores.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5 relative mb-5">
              {organizerPerks.map((p, i) => (
                <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl border"
                  style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
                  <span className="text-lg flex-shrink-0">{p.icon}</span>
                  <div>
                    <p className="text-xs font-bold text-white mb-0.5">{p.title}</p>
                    <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link to={user ? getDashboardLink() : '/register'}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm active:scale-95 transition-all"
              style={{ background: 'linear-gradient(135deg,#f59e0b,#fb923c)', color: '#1a0a00' }}>
              Start Organizing
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════ TESTIMONIALS ════════════ */}
      <section className="relative z-10 py-10 px-5">
        <div className="mx-auto" style={{ maxWidth: '420px' }}>
          <div className="text-center mb-7">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase mb-3"
              style={{ background: 'rgba(236,72,153,0.1)', color: '#f472b6', border: '1px solid rgba(236,72,153,0.2)' }}>
              💬 Players Say
            </span>
            <h2 className="text-2xl font-black text-white leading-tight">
              Real <span style={{ color: '#f472b6' }}>Reviews</span>
            </h2>
          </div>
          <div className="flex flex-col gap-3">
            {testimonials.map((t, i) => (
              <div key={i} className="card-hover rounded-2xl p-4 border"
                style={{ background: 'rgba(255,255,255,0.025)', borderColor: 'rgba(255,255,255,0.07)' }}>
                <div className="flex gap-1 mb-2">
                  {[...Array(5)].map((_, j) => <StarIcon key={j} className="w-3.5 h-3.5 text-amber-400" />)}
                </div>
                <p className="text-sm leading-relaxed mb-3" style={{ color: 'rgba(255,255,255,0.7)' }}>"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0"
                    style={{ background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.25)' }}>
                    {t.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-white">{t.name}</p>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: `${t.badgeColor}18`, color: t.badgeColor, border: `1px solid ${t.badgeColor}35`, whiteSpace: 'nowrap' }}>
                        {t.badge}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{t.role} · {t.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ FINAL CTA ════════════ */}
      <section className="relative z-10 py-10 px-5">
        <div className="mx-auto rounded-3xl p-6 border overflow-hidden relative text-center"
          style={{ maxWidth: '420px', background: 'linear-gradient(135deg,rgba(0,212,255,0.06),rgba(0,255,136,0.06))', borderColor: 'rgba(0,212,255,0.2)' }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(0,212,255,0.08) 0%, transparent 65%)' }} />
          <div className="relative">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 text-3xl"
              style={{ background: 'linear-gradient(135deg,#0891b2,#00d4ff)' }}>🏸</div>
            <h2 className="text-2xl font-black text-white mb-2 leading-tight">Ready to Play?</h2>
            <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Discover tournaments near you — free to browse, sign in to compete.
            </p>
            <div className="flex flex-col gap-3">
              <Link to="/tournaments"
                className="btn-cyan-glow flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-black text-base active:scale-95"
                style={{ background: 'linear-gradient(135deg,#0891b2,#00d4ff)', color: '#001a2e' }}>
                <EyeIcon className="w-5 h-5" />
                Browse Tournaments Free
                <ArrowRightIcon className="w-5 h-5" />
              </Link>
              {!user && (
                <>
                  <Link to="/register"
                    className="btn-green-glow flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-base active:scale-95"
                    style={{ background: 'linear-gradient(135deg,#00c853,#00ff88)', color: '#003320' }}>
                    Create Free Account — Start Competing
                  </Link>
                  <Link to="/login"
                    className="flex items-center justify-center text-sm py-2"
                    style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Already registered? <span className="ml-1" style={{ color: '#00ff88' }}>Sign In</span>
                  </Link>
                </>
              )}
              {user && (
                <Link to={getDashboardLink()}
                  className="flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm border active:scale-95 transition-all"
                  style={{ background: 'rgba(0,255,136,0.07)', borderColor: 'rgba(0,255,136,0.25)', color: '#00ff88' }}>
                  Go to Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════ FOOTER ════════════ */}
      <footer className="relative z-10 border-t py-10 px-5" style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.25)' }}>
        <div className="mx-auto flex flex-col items-center gap-5" style={{ maxWidth: '420px' }}>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="matchify.pro" className="h-8 w-auto"
              style={{ filter: 'drop-shadow(0 0 8px rgba(0,255,136,0.45))' }} />
            <span className="font-black text-lg">
              <span className="text-white">matchify</span>
              <span style={{ color: '#00ff88' }}>.pro</span>
            </span>
          </div>
          <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Built with ❤️ for the Indian Badminton Community
          </p>
          <div className="rounded-2xl px-5 py-4 border text-center w-full"
            style={{ background: 'rgba(0,255,136,0.03)', borderColor: 'rgba(0,255,136,0.1)' }}>
            <p className="text-xs tracking-wider uppercase mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Co-Founded By</p>
            <p className="text-lg font-black mb-1.5" style={{ color: '#00ff88' }}>PS Brothers</p>
            <div className="flex justify-center items-center gap-3 text-sm font-semibold text-white">
              <span>PS Lochan</span>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
              <span>PS Pradyumna</span>
            </div>
          </div>
          <div className="flex gap-5 text-sm flex-wrap justify-center" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <Link to="/tournaments" className="hover:text-white transition-colors">Tournaments</Link>
            <Link to="/leaderboard" className="hover:text-white transition-colors">Rankings</Link>
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>© 2026 Matchify.pro · All rights reserved</p>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
