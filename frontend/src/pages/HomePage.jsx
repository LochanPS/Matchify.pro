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
  ClipboardDocumentListIcon,
  SignalIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { StarIcon, EyeIcon } from '@heroicons/react/24/solid';

const HOME_PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  w: (i * 7 + 1) % 2 + 1,
  h: (i * 11 + 1) % 2 + 1,
  x: (i * 37 + 11) % 97,
  y: (i * 53 + 7) % 91,
  c: ['#00ff88', '#00d4ff', 'rgba(255,255,255,0.8)'][i % 3],
  o: ((i * 13) % 50) / 100 + 0.2,
  dur: (i * 7) % 10 + 5,
  delay: (i * 3) % 5,
  glow: (i * 11) % 15 + 5,
}));

const injectStyles = () => {
  if (document.head.querySelector('style[data-homepage]')) return;
  const style = document.createElement('style');
  style.setAttribute('data-homepage', 'true');
  style.textContent = `
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(30px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes floatY {
      0%, 100% { transform: translateY(0px); }
      50%       { transform: translateY(-15px); }
    }
    @keyframes pulseGlow {
      0%, 100% { opacity: 0.5; }
      50%       { opacity: 1; }
    }
    @keyframes shimmer {
      0% { background-position: -1000px 0; }
      100% { background-position: 1000px 0; }
    }
    @keyframes rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.8); }
      to { opacity: 1; transform: scale(1); }
    }
    .anim-fade-up  { animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
    .anim-float    { animation: floatY 6s ease-in-out infinite; }
    .anim-glow     { animation: pulseGlow 4s ease-in-out infinite; }
    .anim-rotate   { animation: rotate 20s linear infinite; }
    .anim-scale-in { animation: scaleIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
    .delay-100  { animation-delay: 0.1s; }
    .delay-200  { animation-delay: 0.2s; }
    .delay-300  { animation-delay: 0.3s; }
    .delay-400  { animation-delay: 0.4s; }
    .delay-500  { animation-delay: 0.5s; }
    .delay-600  { animation-delay: 0.6s; }
    .delay-700  { animation-delay: 0.7s; }
    .delay-800  { animation-delay: 0.8s; }
    .neon-text-green {
      text-shadow: 0 0 30px rgba(0,255,136,0.8), 0 0 60px rgba(0,255,136,0.5), 0 0 100px rgba(0,255,136,0.3);
    }
    .neon-text-cyan {
      text-shadow: 0 0 30px rgba(0,212,255,0.8), 0 0 60px rgba(0,212,255,0.5), 0 0 100px rgba(0,212,255,0.3);
    }
    .card-glow:hover {
      box-shadow: 0 0 40px rgba(0,255,136,0.15), 0 10px 40px rgba(0,0,0,0.5);
      transform: translateY(-4px);
    }
    .btn-glow {
      box-shadow: 0 0 30px rgba(0,255,136,0.5), 0 6px 20px rgba(0,0,0,0.4);
    }
    .btn-glow:hover {
      box-shadow: 0 0 50px rgba(0,255,136,0.7), 0 10px 30px rgba(0,0,0,0.5);
      transform: translateY(-2px);
    }
    .grid-bg {
      background-image:
        linear-gradient(rgba(0,255,136,0.05) 1.5px, transparent 1.5px),
        linear-gradient(90deg, rgba(0,255,136,0.05) 1.5px, transparent 1.5px);
      background-size: 50px 50px;
      animation: gridMove 20s linear infinite;
    }
    @keyframes gridMove {
      0% { background-position: 0 0; }
      100% { background-position: 50px 50px; }
    }
    .shimmer-text {
      background: linear-gradient(90deg, #00ff88 0%, #00d4ff 50%, #00ff88 100%);
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: shimmer 3s linear infinite;
    }
    .glass-card {
      background: rgba(255,255,255,0.03);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.1);
    }
    .badge-pulse {
      animation: pulseGlow 2s ease-in-out infinite;
    }
    .format-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
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
    {
      icon: TrophyIcon,
      title: 'Smart Tournament Engine',
      desc: 'Knockout, Round Robin, and Hybrid formats with automated seeding, draws, and bracket progression.',
      detail: 'Handles 8 to 256 players automatically.',
      gradient: 'linear-gradient(135deg,#f59e0b,#f97316)',
      glow: 'rgba(251,146,60,0.15)',
    },
    {
      icon: SignalIcon,
      title: 'Point-by-Point Live Scoring',
      desc: 'Real-time match updates visible to spectators, coaches, and players — no refresh needed.',
      detail: 'WebSocket powered. Zero delay.',
      gradient: 'linear-gradient(135deg,#00c853,#00ff88)',
      glow: 'rgba(0,255,136,0.15)',
    },
    {
      icon: UserGroupIcon,
      title: 'Doubles Partner Network',
      desc: 'Invite partners via app. Paired registrations, shared profiles, and doubles-specific rankings.',
      detail: 'Men's, Women's & Mixed doubles.',
      gradient: 'linear-gradient(135deg,#06b6d4,#3b82f6)',
      glow: 'rgba(6,182,212,0.15)',
    },
    {
      icon: ChartBarIcon,
      title: 'Matchify Points & Rankings',
      desc: 'Earn points every match. Climb city, state, and national leaderboards automatically.',
      detail: 'Your ranking updates after every result.',
      gradient: 'linear-gradient(135deg,#8b5cf6,#9333ea)',
      glow: 'rgba(139,92,246,0.15)',
    },
    {
      icon: ShieldCheckIcon,
      title: 'Secure UPI Payments',
      desc: 'Pay registration fees via UPI QR. Organizer verifies payment screenshots. Wallet refunds in seconds.',
      detail: 'No card details stored. 100% safe.',
      gradient: 'linear-gradient(135deg,#10b981,#059669)',
      glow: 'rgba(16,185,129,0.15)',
    },
    {
      icon: Cog6ToothIcon,
      title: 'Full Organizer Control',
      desc: 'Manage registrations, assign umpires, generate draws, verify payments — all from one dashboard.',
      detail: 'Built for serious tournament organizers.',
      gradient: 'linear-gradient(135deg,#f59e0b,#ef4444)',
      glow: 'rgba(245,158,11,0.15)',
    },
  ];

  const stats = [
    { value: '1000+', label: 'Players',      icon: '🏸' },
    { value: '50+',   label: 'Tournaments',  icon: '🏆' },
    { value: '25+',   label: 'Cities',       icon: '📍' },
    { value: '₹10L+', label: 'Prize Pool',   icon: '💰' },
  ];

  const steps = [
    { step: '01', title: 'Create Account',  desc: 'Sign up free in 30 seconds. No card needed.', icon: '👤', gradient: 'linear-gradient(135deg,#3b82f6,#22d3ee)' },
    { step: '02', title: 'Browse Tournaments', desc: 'Filter by city, level, format & prize.',   icon: '🔍', gradient: 'linear-gradient(135deg,#8b5cf6,#c084fc)' },
    { step: '03', title: 'Register & Pay',  desc: 'Pay via UPI. Get instant confirmation.',       icon: '💳', gradient: 'linear-gradient(135deg,#00c853,#00ff88)' },
    { step: '04', title: 'Play & Win',      desc: 'Compete live. Scores update in real-time.',    icon: '🏆', gradient: 'linear-gradient(135deg,#f59e0b,#fb923c)' },
  ];

  const testimonials = [
    { name: 'Rahul Sharma',  role: 'State Level Player',   city: 'Bangalore', emoji: '👨', text: 'Matchify made tournament registration effortless. The live scoring keeps my parents updated from home!' },
    { name: 'Priya Patel',   role: 'Club Player',          city: 'Mumbai',    emoji: '👩', text: 'Found amazing doubles partners through this platform. The partner invite system is genius!' },
    { name: 'Arjun Kumar',   role: 'Tournament Organizer', city: 'Delhi',     emoji: '👨', text: 'Automated draws and payment verification alone save me 4 hours per event. Game-changer.' },
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
    { icon: '📋', title: 'Draw Generation',       desc: 'Auto-seeded brackets generated in one click for any format.' },
    { icon: '💳', title: 'Payment Verification',  desc: 'Review UPI screenshots. Approve or reject registrations.' },
    { icon: '⚖️', title: 'Umpire Management',    desc: 'Assign umpires to matches. They score live from their phone.' },
    { icon: '📊', title: 'Live Dashboard',        desc: 'Track all matches, scores, and results in real time.' },
    { icon: '🔔', title: 'Auto Notifications',    desc: 'Players notified on registration, draw publish, and results.' },
    { icon: '💰', title: 'Payout Tracking',       desc: 'Transparent prize money and organizer fee management.' },
  ];

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: '#07071a' }}>

      {/* ── BACKGROUND ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="grid-bg absolute inset-0" />
        <div className="anim-glow anim-float absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(0,255,136,0.15) 0%, transparent 70%)' }} />
        <div className="anim-glow anim-float delay-300 absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)' }} />
        <div className="anim-glow anim-float delay-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)' }} />
        <div className="anim-glow anim-float delay-700 absolute top-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)' }} />
        {HOME_PARTICLES.map((p, i) => (
          <div key={i} className="absolute rounded-full"
            style={{ width: `${p.w}px`, height: `${p.h}px`, left: `${p.x}%`, top: `${p.y}%`,
              background: p.c, opacity: p.o,
              animation: `floatY ${p.dur}s ease-in-out infinite`, animationDelay: `${p.delay}s`,
              boxShadow: `0 0 ${p.glow}px ${p.c}` }} />
        ))}
      </div>

      {/* ════════════ HERO ════════════ */}
      <section className="relative z-10 pt-20 pb-16 px-4 flex flex-col items-center text-center">
        <div className="w-full" style={{ maxWidth: '420px' }}>

          {/* Logo */}
          <div className="anim-scale-in mb-5 flex justify-center relative">
            <div className="absolute inset-0 m-auto w-32 h-32 rounded-full blur-3xl anim-glow"
              style={{ background: 'radial-gradient(circle, rgba(0,255,136,0.25) 0%, transparent 70%)' }} />
            <div className="anim-float relative z-10">
              <MatchifyLogo size={80} variant="icon" glow={true} />
            </div>
          </div>

          {/* Badge */}
          <div className="anim-scale-in delay-100 inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold tracking-wider uppercase mb-5 relative overflow-hidden"
            style={{ background: 'rgba(0,255,136,0.1)', borderColor: 'rgba(0,255,136,0.3)', color: '#00ff88' }}>
            <RocketLaunchIcon className="w-4 h-4" />
            <span>India's #1 Badminton Platform</span>
            <FireIcon className="w-4 h-4 text-orange-400 anim-glow" />
          </div>

          {/* Title */}
          <div className="anim-fade-up delay-200 mb-4 w-full">
            <h1 className="font-black leading-[0.85] tracking-tighter" style={{ fontSize: '3.5rem' }}>
              <span className="neon-text-green block shimmer-text" style={{ color: '#00ff88' }}>MATCHIFY</span>
              <span className="neon-text-cyan block mt-1" style={{ color: '#00d4ff' }}>.PRO</span>
            </h1>
          </div>

          {/* Tagline */}
          <div className="anim-fade-up delay-200 mb-3">
            <p className="text-lg font-bold mb-2 flex items-center justify-center gap-2"
              style={{ color: 'rgba(255,255,255,0.95)' }}>
              <TrophyIcon className="w-5 h-5 text-amber-400 anim-float" />
              Where Champions Are Made
              <SparklesIcon className="w-5 h-5 text-cyan-400 anim-glow" />
            </p>
          </div>

          <p className="anim-fade-up delay-300 text-sm mb-8 leading-relaxed px-2"
            style={{ color: 'rgba(255,255,255,0.6)' }}>
            Join <span className="font-bold" style={{ color: '#00ff88' }}>10,000+</span> players across India.
            Register for tournaments, track your progress, and compete with the best — all in one app.
          </p>

          {/* CTAs */}
          <div className="anim-fade-up delay-400 flex flex-col gap-3 w-full">
            {user ? (
              <>
                <Link to={getDashboardLink()}
                  className="btn-glow flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-base transition-all duration-300 active:scale-95"
                  style={{ background: 'linear-gradient(135deg,#00c853,#00ff88)', color: '#003320' }}>
                  <PlayIcon className="w-5 h-5" />
                  Go to Dashboard
                  <ArrowRightIcon className="w-5 h-5" />
                </Link>
                <Link to="/tournaments"
                  className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-base border transition-all duration-300 active:scale-95"
                  style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)' }}>
                  <EyeIcon className="w-5 h-5" />
                  View Tournaments
                </Link>
                <div className="flex items-center justify-center gap-3 px-5 py-3 rounded-xl border"
                  style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
                    style={{ background: 'linear-gradient(135deg,#00c853,#00ff88)', color: '#003320' }}>
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Signed in as</p>
                    <p className="text-sm font-semibold text-white">{user.name}</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link to="/register"
                  className="btn-glow flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-base transition-all duration-300 active:scale-95"
                  style={{ background: 'linear-gradient(135deg,#00c853,#00ff88)', color: '#003320' }}>
                  <PlayIcon className="w-5 h-5" />
                  Get Started Free
                  <ArrowRightIcon className="w-5 h-5" />
                </Link>
                {/* View Tournaments — no login needed */}
                <Link to="/tournaments"
                  className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-base border-2 transition-all duration-300 active:scale-95"
                  style={{ background: 'rgba(0,212,255,0.08)', borderColor: 'rgba(0,212,255,0.4)', color: '#00d4ff' }}>
                  <EyeIcon className="w-5 h-5" />
                  View Tournaments
                </Link>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  👆 Browse freely — sign in only to register
                </p>
                <Link to="/login"
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm border transition-all duration-300 active:scale-95"
                  style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)' }}>
                  Already have an account? Sign In
                </Link>
              </>
            )}
          </div>

          {/* Social proof */}
          <div className="anim-fade-up delay-500 mt-8 flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold"
                    style={{ background: 'linear-gradient(135deg,#00c853,#00ff88)', borderColor: '#07071a', color: '#003320' }}>
                    {['R', 'P', 'A', 'K'][i]}
                  </div>
                ))}
              </div>
              <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>1000+ players joined</span>
            </div>
            <div className="flex items-center gap-1.5">
              {[...Array(5)].map((_, i) => <StarIcon key={i} className="w-5 h-5 text-amber-400" />)}
              <span className="text-sm font-medium ml-1" style={{ color: 'rgba(255,255,255,0.6)' }}>4.9 / 5</span>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════ STATS ════════════ */}
      <section className="relative z-10 py-8 px-4">
        <div className="mx-auto grid grid-cols-2 gap-3" style={{ maxWidth: '420px' }}>
          {stats.map((s, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 py-5 px-3 rounded-2xl border"
              style={{ background: 'rgba(0,255,136,0.04)', borderColor: 'rgba(0,255,136,0.12)' }}>
              <span className="text-2xl">{s.icon}</span>
              <span className="text-2xl font-black" style={{ color: '#00ff88' }}>{s.value}</span>
              <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════ TOURNAMENT FORMATS ════════════ */}
      <section className="relative z-10 py-10 px-4">
        <div className="mx-auto" style={{ maxWidth: '420px' }}>
          <div className="rounded-2xl p-5 border" style={{ background: 'rgba(0,212,255,0.03)', borderColor: 'rgba(0,212,255,0.15)' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(0,212,255,0.15)', border: '1px solid rgba(0,212,255,0.3)' }}>
                <TrophyIcon className="w-4 h-4" style={{ color: '#00d4ff' }} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">Tournament Formats Available</h3>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Browse tournaments near you — no login needed</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {tournamentFormats.map((f, i) => (
                <span key={i} className="format-badge"
                  style={{ background: f.bg, color: f.color, border: `1px solid ${f.color}40` }}>
                  {f.icon} {f.label}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4 text-center">
              {[
                { icon: <MapPinIcon className="w-4 h-4" />, label: 'Filter by City' },
                { icon: <CurrencyRupeeIcon className="w-4 h-4" />, label: 'See Prize Pool' },
                { icon: <CalendarDaysIcon className="w-4 h-4" />, label: 'Check Dates' },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <span style={{ color: '#00d4ff' }}>{item.icon}</span>
                  <span className="text-xs font-semibold text-white leading-tight">{item.label}</span>
                </div>
              ))}
            </div>
            <Link to="/tournaments"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm transition-all duration-300 active:scale-95"
              style={{ background: 'rgba(0,212,255,0.12)', border: '1.5px solid rgba(0,212,255,0.35)', color: '#00d4ff' }}>
              <EyeIcon className="w-4 h-4" />
              View All Tournaments
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
            {!user && (
              <p className="text-center text-xs mt-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Sign in or create account to register for a tournament
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ════════════ FEATURES ════════════ */}
      <section className="relative z-10 py-12 px-4">
        <div className="mx-auto" style={{ maxWidth: '420px' }}>
          <div className="text-center mb-8">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase mb-3"
              style={{ background: 'rgba(0,255,136,0.1)', color: '#00ff88', border: '1px solid rgba(0,255,136,0.2)' }}>
              ✦ Features
            </span>
            <h2 className="text-2xl font-black text-white mb-2 leading-tight">
              Everything to <span style={{ color: '#00ff88' }}>Dominate</span>
            </h2>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Built for competitive badminton players & organizers</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {features.map((f, i) => (
              <div key={i} className="card-glow group relative rounded-2xl p-5 border transition-all duration-300"
                style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 inline-flex items-center justify-center w-12 h-12 rounded-xl"
                    style={{ background: f.gradient }}>
                    <f.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-white mb-1">{f.title}</h3>
                    <p className="text-sm leading-relaxed mb-2" style={{ color: 'rgba(255,255,255,0.55)' }}>{f.desc}</p>
                    <span className="inline-block text-xs font-bold px-2.5 py-1 rounded-lg"
                      style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      {f.detail}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ HOW IT WORKS ════════════ */}
      <section className="relative z-10 py-12 px-4">
        <div className="mx-auto" style={{ maxWidth: '420px' }}>
          <div className="text-center mb-8">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase mb-3"
              style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.25)' }}>
              🎯 Process
            </span>
            <h2 className="text-2xl font-black text-white mb-2 leading-tight">
              How It <span style={{ color: '#a78bfa' }}>Works</span>
            </h2>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>From zero to competing in 4 simple steps</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {steps.map((s, i) => (
              <div key={i} className="card-glow relative rounded-2xl p-4 border transition-all duration-300"
                style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
                <div className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-white text-xs font-black mb-2"
                  style={{ background: s.gradient }}>
                  {s.step}
                </div>
                <div className="text-2xl mb-2">{s.icon}</div>
                <h3 className="text-sm font-bold text-white mb-1">{s.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ FOR ORGANIZERS ════════════ */}
      <section className="relative z-10 py-12 px-4">
        <div className="mx-auto" style={{ maxWidth: '420px' }}>
          <div className="rounded-3xl p-5 border overflow-hidden relative"
            style={{ background: 'rgba(245,158,11,0.03)', borderColor: 'rgba(245,158,11,0.2)' }}>
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)' }} />
            <div className="text-center mb-5 relative">
              <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase mb-3"
                style={{ background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.25)' }}>
                🎪 For Organizers
              </span>
              <h2 className="text-xl font-black text-white mb-2 leading-tight">
                Run Tournaments <span style={{ color: '#fbbf24' }}>Like a Pro</span>
              </h2>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Everything you need to run a flawless badminton tournament — end to end.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 relative">
              {organizerPerks.map((p, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl border"
                  style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
                  <span className="text-xl flex-shrink-0 mt-0.5">{p.icon}</span>
                  <div>
                    <p className="text-sm font-bold text-white mb-0.5">{p.title}</p>
                    <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t" style={{ borderColor: 'rgba(245,158,11,0.15)' }}>
              <Link to={user ? getDashboardLink() : '/register'}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm transition-all duration-300 active:scale-95"
                style={{ background: 'linear-gradient(135deg,#f59e0b,#fb923c)', color: '#1a0a00' }}>
                Start Organizing
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════ TESTIMONIALS ════════════ */}
      <section className="relative z-10 py-12 px-4">
        <div className="mx-auto" style={{ maxWidth: '420px' }}>
          <div className="text-center mb-8">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase mb-3"
              style={{ background: 'rgba(6,182,212,0.1)', color: '#22d3ee', border: '1px solid rgba(6,182,212,0.25)' }}>
              💬 Players Say
            </span>
            <h2 className="text-2xl font-black text-white leading-tight">
              Real <span style={{ color: '#22d3ee' }}>Reviews</span>
            </h2>
          </div>

          <div className="flex flex-col gap-4">
            {testimonials.map((t, i) => (
              <div key={i} className="card-glow rounded-2xl p-5 border transition-all duration-300"
                style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, j) => <StarIcon key={j} className="w-4 h-4 text-amber-400" />)}
                </div>
                <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.7)' }}>"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)' }}>
                    {t.emoji}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{t.role} · {t.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ CTA BANNER ════════════ */}
      <section className="relative z-10 py-12 px-4">
        <div className="mx-auto text-center rounded-3xl p-6 border overflow-hidden relative"
          style={{ maxWidth: '420px', background: 'linear-gradient(135deg, rgba(0,255,136,0.07) 0%, rgba(99,102,241,0.07) 100%)', borderColor: 'rgba(0,255,136,0.2)' }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(0,255,136,0.08) 0%, transparent 70%)' }} />
          <div className="relative">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5 text-2xl"
              style={{ background: 'linear-gradient(135deg,#00c853,#00ff88)' }}>
              🚀
            </div>
            <h2 className="text-2xl font-black text-white mb-2 leading-tight">Ready to Play?</h2>
            <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Join India's fastest-growing badminton community. Tournaments are waiting.
            </p>
            <div className="flex flex-col gap-3">
              <Link to={user ? getDashboardLink() : '/register'}
                className="btn-glow flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-base transition-all duration-300 active:scale-95"
                style={{ background: 'linear-gradient(135deg,#00c853,#00ff88)', color: '#003320' }}>
                {user ? 'Go to Dashboard' : 'Create Free Account'}
                <ArrowRightIcon className="w-5 h-5" />
              </Link>
              <Link to="/tournaments"
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-base border transition-all duration-300 active:scale-95"
                style={{ background: 'rgba(0,212,255,0.08)', borderColor: 'rgba(0,212,255,0.3)', color: '#00d4ff' }}>
                <EyeIcon className="w-5 h-5" />
                View Tournaments
              </Link>
              {!user && (
                <Link to="/login"
                  className="flex items-center justify-center text-sm transition-all duration-300"
                  style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Already registered? Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════ FOOTER ════════════ */}
      <footer className="relative z-10 border-t py-10 px-4" style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.3)' }}>
        <div className="mx-auto flex flex-col items-center gap-5" style={{ maxWidth: '420px' }}>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="matchify.pro" className="h-9 w-auto"
              style={{ filter: 'drop-shadow(0 0 10px rgba(0,255,136,0.5))' }} />
            <span className="font-black text-lg">
              <span style={{ color: '#ffffff' }}>matchify</span>
              <span style={{ color: '#00ff88' }}>.pro</span>
            </span>
          </div>
          <p className="text-xs text-center leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Built with ❤️ for the Indian Badminton Community
          </p>
          <div className="rounded-2xl px-5 py-4 border text-center w-full"
            style={{ background: 'rgba(0,255,136,0.04)', borderColor: 'rgba(0,255,136,0.12)' }}>
            <p className="text-xs tracking-wider uppercase mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Co-Founded By</p>
            <p className="text-lg font-black mb-2" style={{ color: '#00ff88' }}>PS Brothers</p>
            <div className="flex justify-center items-center gap-3 text-sm font-semibold text-white">
              <span>PS Lochan</span>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
              <span>PS Pradyumna</span>
            </div>
          </div>
          <div className="flex gap-5 text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
            <Link to="/tournaments" className="hover:text-white transition-colors">Tournaments</Link>
            <Link to="/leaderboard" className="hover:text-white transition-colors">Rankings</Link>
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>© 2026 Matchify.pro · All rights reserved</p>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
