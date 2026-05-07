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
  LightBulbIcon
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';

// Inject enhanced keyframes and styles
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
    .neon-text-purple {
      text-shadow: 0 0 30px rgba(168,85,247,0.8), 0 0 60px rgba(168,85,247,0.5);
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
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .gradient-border {
      position: relative;
      background: rgba(255, 255, 255, 0.03);
    }
    .gradient-border::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      padding: 2px;
      background: linear-gradient(135deg, #00ff88, #00d4ff, #a855f7);
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      opacity: 0.5;
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
    { icon: TrophyIcon,    title: 'Tournament Engine',   desc: 'Automated draws, brackets & live scoring for any format.',       color: 'from-amber-500 to-orange-500',  glow: 'rgba(251,146,60,0.2)'  },
    { icon: UserGroupIcon, title: 'Partner Network',     desc: 'Find doubles partners across your city instantly.',              color: 'from-cyan-500 to-blue-500',     glow: 'rgba(6,182,212,0.2)'   },
    { icon: ChartBarIcon,  title: 'Live Rankings',       desc: 'Matchify Points system — climb city & national leaderboards.',   color: 'from-violet-500 to-purple-600', glow: 'rgba(139,92,246,0.2)'  },
    { icon: SparklesIcon,  title: 'Real-Time Scoring',   desc: 'Point-by-point live updates with instant notifications.',        color: 'from-green-500 to-emerald-500', glow: 'rgba(16,185,129,0.2)'  },
  ];

  const stats = [
    { value: '1000+', label: 'Players',      icon: '🏸' },
    { value: '50+',   label: 'Tournaments',  icon: '🏆' },
    { value: '25+',   label: 'Cities',       icon: '📍' },
    { value: '₹10L+', label: 'Prize Pool',   icon: '💰' },
  ];

  const steps = [
    { step: '01', title: 'Create Account', desc: 'Sign up in seconds',               icon: '👤', color: 'from-blue-500 to-cyan-400'    },
    { step: '02', title: 'Find Tournament', desc: 'Browse by city & level',           icon: '🔍', color: 'from-violet-500 to-purple-400' },
    { step: '03', title: 'Register & Pay',  desc: 'Secure UPI payment',               icon: '💳', color: 'from-green-500 to-emerald-400' },
    { step: '04', title: 'Play & Win',      desc: 'Compete & climb rankings',         icon: '🏆', color: 'from-amber-500 to-orange-400'  },
  ];

  const testimonials = [
    { name: 'Rahul Sharma',  role: 'State Level Player',     city: 'Bangalore', emoji: '👨', text: 'Matchify made tournament registration effortless. The live scoring is incredible!' },
    { name: 'Priya Patel',   role: 'Club Player',            city: 'Mumbai',    emoji: '👩', text: 'Found amazing doubles partners through this platform. The community is top-notch!' },
    { name: 'Arjun Kumar',   role: 'Tournament Organizer',   city: 'Delhi',     emoji: '👨', text: 'Automated draws alone save me 3 hours per event. A game-changer for organisers.' },
  ];

  const benefits = [
    { icon: BoltIcon,         text: 'Instant Registration', color: 'text-amber-400',  bg: 'bg-amber-400/10'  },
    { icon: ShieldCheckIcon,  text: 'Secure Payments',      color: 'text-green-400',  bg: 'bg-green-400/10'  },
    { icon: TrophyIcon,       text: 'Fair Play System',     color: 'text-cyan-400',   bg: 'bg-cyan-400/10'   },
    { icon: ChartBarIcon,     text: 'Performance Tracking', color: 'text-violet-400', bg: 'bg-violet-400/10' },
  ];

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: 'linear-gradient(180deg, #0a0a1f 0%, #07071a 50%, #0a0a1f 100%)' }}>

      {/* ── ENHANCED GLOBAL BACKGROUND ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="grid-bg absolute inset-0" />
        {/* Animated gradient orbs */}
        <div className="anim-glow anim-float absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl" 
          style={{ background: 'radial-gradient(circle, rgba(0,255,136,0.15) 0%, transparent 70%)' }} />
        <div className="anim-glow anim-float delay-300 absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl" 
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)' }} />
        <div className="anim-glow anim-float delay-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-3xl" 
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)' }} />
        <div className="anim-glow anim-float delay-700 absolute top-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl" 
          style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)' }} />
        
        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <div key={i} className="anim-float absolute w-1 h-1 rounded-full bg-green-400/30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 10}s`
            }} />
        ))}
      </div>

      {/* ════════════════════════════════════════
          ENHANCED HERO SECTION - FIXED WIDTH FOR ALL DEVICES
      ════════════════════════════════════════ */}
      <section className="relative z-10 pt-20 pb-16 px-4 flex flex-col items-center text-center">
        {/* FIXED MAX-WIDTH CONTAINER - Ensures consistent sizing on all devices */}
        <div className="w-full" style={{ maxWidth: '420px' }}>

          {/* Brand logo mark — centered, floating - FIXED SIZE */}
          <div className="anim-scale-in mb-5 flex justify-center relative">
            {/* Glow orb behind logo */}
            <div className="absolute inset-0 m-auto w-32 h-32 rounded-full blur-3xl anim-glow"
              style={{ background: 'radial-gradient(circle, rgba(0,255,136,0.25) 0%, transparent 70%)' }} />
            <div className="anim-float relative z-10">
              <MatchifyLogo size={80} variant="icon" glow={true} />
            </div>
          </div>

          {/* Animated badge - FIXED SIZE */}
          <div className="anim-scale-in delay-100 inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold tracking-wider uppercase mb-5 relative overflow-hidden"
            style={{ background: 'rgba(0,255,136,0.1)', borderColor: 'rgba(0,255,136,0.3)', color: '#00ff88' }}>
            <div className="absolute inset-0 shimmer-text opacity-20" />
            <RocketLaunchIcon className="w-4 h-4" />
            <span className="relative z-10">India's #1 Badminton Platform</span>
            <FireIcon className="w-4 h-4 text-orange-400 anim-glow" />
          </div>

          {/* Main title - FIXED SIZE (no clamp, no vw) */}
          <div className="anim-fade-up delay-200 mb-4 w-full relative">
            <h1 className="font-black leading-[0.85] tracking-tighter relative" style={{ fontSize: '3.5rem' }}>
              <span className="neon-text-green block shimmer-text" style={{ color: '#00ff88' }}>
                MATCHIFY
              </span>
              <span className="neon-text-cyan block mt-1" style={{ color: '#00d4ff' }}>
                .PRO
              </span>
            </h1>
          </div>

          {/* Enhanced tagline with icon - FIXED SIZE */}
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
            Join <span className="font-bold text-green-400">10,000+</span> players across India. 
            Register for tournaments, track progress, and compete with the best.
          </p>

          {/* CTAs - FIXED WIDTH */}
          <div className="anim-fade-up delay-400 flex flex-col gap-3 w-full">
            {user ? (
              <>
                <Link to={getDashboardLink()}
                  className="btn-glow flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-base transition-all duration-300 active:scale-95"
                  style={{ background: 'linear-gradient(135deg,#00c853,#00ff88)', color: '#003320' }}>
                  <PlayIcon className="w-5 h-5" />
                  Get Started Free
                  <ArrowRightIcon className="w-5 h-5" />
                </Link>
                <div className="flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl border"
                  style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-base"
                    style={{ background: 'linear-gradient(135deg,#00c853,#00ff88)', color: '#003320' }}>
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Welcome back</p>
                    <p className="text-base font-semibold text-white">{user.name}</p>
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
                <Link to="/login"
                  className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-base border transition-all duration-300 active:scale-95"
                  style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)' }}>
                  Sign In
                </Link>
              </>
            )}
          </div>

          {/* social proof - FIXED SIZE */}
          <div className="anim-fade-up delay-500 mt-8 flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold"
                    style={{ background: 'linear-gradient(135deg,#00c853,#00ff88)', borderColor: '#07071a', color: '#003320' }}>
                    {['R','P','A','K'][i]}
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

      {/* ════════════════════════════════════════
          STATS BAR - FIXED WIDTH FOR ALL DEVICES
      ════════════════════════════════════════ */}
      <section className="relative z-10 py-8 px-4">
        <div className="mx-auto grid grid-cols-2 gap-3" style={{ maxWidth: '420px' }}>
          {stats.map((s, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 py-4 px-3 rounded-2xl border"
              style={{ background: 'rgba(0,255,136,0.04)', borderColor: 'rgba(0,255,136,0.12)' }}>
              <span className="text-2xl">{s.icon}</span>
              <span className="text-2xl font-black" style={{ color: '#00ff88' }}>{s.value}</span>
              <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════
          FEATURES - FIXED WIDTH FOR ALL DEVICES
      ════════════════════════════════════════ */}
      <section className="relative z-10 py-12 px-4">
        <div className="mx-auto" style={{ maxWidth: '420px' }}>
          {/* heading */}
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
              <div key={i} className="card-glow group relative rounded-2xl p-5 border transition-all duration-300 active:scale-95"
                style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
                {/* icon */}
                <div className={`inline-flex items-center justify-center w-11 h-11 bg-gradient-to-br ${f.color} rounded-xl mb-3 group-hover:scale-110 transition-transform duration-300`}>
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          HOW IT WORKS - FIXED WIDTH FOR ALL DEVICES
      ════════════════════════════════════════ */}
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
          </div>

          <div className="grid grid-cols-2 gap-3">
            {steps.map((s, i) => (
              <div key={i} className="card-glow relative rounded-2xl p-4 border transition-all duration-300 active:scale-95"
                style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
                {/* step number badge */}
                <div className={`inline-flex items-center justify-center w-7 h-7 bg-gradient-to-br ${s.color} rounded-lg text-white text-xs font-black mb-2`}>
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

      {/* ════════════════════════════════════════
          WHY MATCHIFY - FIXED WIDTH FOR ALL DEVICES
      ════════════════════════════════════════ */}
      <section className="relative z-10 py-12 px-4">
        <div className="mx-auto rounded-3xl p-5 border" style={{ maxWidth: '420px', background: 'rgba(0,255,136,0.03)', borderColor: 'rgba(0,255,136,0.1)' }}>
          <div className="text-center mb-6">
            <h2 className="text-xl font-black text-white mb-2 leading-tight">
              Why <span style={{ color: '#00ff88' }}>Matchify.pro</span>?
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-2.5 rounded-xl p-3 border transition-all duration-300 active:scale-95"
                style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
                <div className={`flex-shrink-0 w-9 h-9 ${b.bg} ${b.color} rounded-lg flex items-center justify-center`}>
                  <b.icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-white leading-tight">{b.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          TESTIMONIALS - FIXED WIDTH FOR ALL DEVICES
      ════════════════════════════════════════ */}
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

      {/* ════════════════════════════════════════
          CTA BANNER - FIXED WIDTH FOR ALL DEVICES
      ════════════════════════════════════════ */}
      <section className="relative z-10 py-12 px-4">
        <div className="mx-auto text-center rounded-3xl p-6 border overflow-hidden relative" style={{ maxWidth: '420px', background: 'linear-gradient(135deg, rgba(0,255,136,0.07) 0%, rgba(99,102,241,0.07) 100%)', borderColor: 'rgba(0,255,136,0.2)' }}>
          {/* bg glow */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(0,255,136,0.08) 0%, transparent 70%)' }} />

          <div className="relative">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5 text-2xl"
              style={{ background: 'linear-gradient(135deg,#00c853,#00ff88)' }}>
              🚀
            </div>
            <h2 className="text-2xl font-black text-white mb-3 leading-tight">
              Ready to Start?
            </h2>
            <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Join India's fastest-growing badminton community today.
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
                style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)' }}>
                Browse Tournaments
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FOOTER - FIXED WIDTH FOR ALL DEVICES
      ════════════════════════════════════════ */}
      <footer className="relative z-10 border-t py-10 px-4" style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.3)' }}>
        <div className="mx-auto flex flex-col items-center gap-5" style={{ maxWidth: '420px' }}>

          {/* brand */}
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="matchify.pro" className="h-9 w-auto" style={{ filter: 'drop-shadow(0 0 10px rgba(0,255,136,0.5))' }} />
            <span className="font-black text-lg">
              <span style={{ color: '#ffffff' }}>matchify</span>
              <span style={{ color: '#00ff88' }}>.pro</span>
            </span>
          </div>

          <p className="text-xs text-center leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Built with ❤️ for the Indian Badminton Community
          </p>

          {/* founders */}
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
            <a href="#" className="hover:text-white transition-colors">About</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>

          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>© 2026 Matchify.pro · All rights reserved</p>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
