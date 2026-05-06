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
          ENHANCED HERO SECTION
      ════════════════════════════════════════ */}
      <section className="relative z-10 pt-24 pb-20 px-5 flex flex-col items-center text-center">

        {/* Brand logo mark — centered, floating */}
        <div className="anim-scale-in mb-6 flex justify-center relative">
          {/* Glow orb behind logo */}
          <div className="absolute inset-0 m-auto w-40 h-40 rounded-full blur-3xl anim-glow"
            style={{ background: 'radial-gradient(circle, rgba(0,255,136,0.25) 0%, transparent 70%)' }} />
          <div className="anim-float relative z-10">
            <MatchifyLogo size={96} variant="icon" glow={true} />
          </div>
        </div>

        {/* Animated badge */}
        <div className="anim-scale-in delay-100 inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border text-xs font-bold tracking-wider uppercase mb-6 relative overflow-hidden"
          style={{ background: 'rgba(0,255,136,0.1)', borderColor: 'rgba(0,255,136,0.3)', color: '#00ff88' }}>
          <div className="absolute inset-0 shimmer-text opacity-20" />
          <RocketLaunchIcon className="w-4 h-4" />
          <span className="relative z-10">India's #1 Badminton Platform</span>
          <FireIcon className="w-4 h-4 text-orange-400 anim-glow" />
        </div>

        {/* Main title */}
        <div className="anim-fade-up delay-200 mb-5 w-full px-2 relative">
          <h1 className="font-black leading-[0.85] tracking-tighter relative"
            style={{ fontSize: 'clamp(2.8rem, 13vw, 7.5rem)' }}>
            <span className="neon-text-green block shimmer-text" style={{ color: '#00ff88' }}>
              MATCHIFY
            </span>
            <span className="neon-text-cyan block mt-1" style={{ color: '#00d4ff' }}>
              .PRO
            </span>
          </h1>
        </div>

        {/* Enhanced tagline with icon */}
        <div className="anim-fade-up delay-200 mb-4">
          <p className="text-xl sm:text-2xl font-bold mb-2 flex items-center justify-center gap-2" 
            style={{ color: 'rgba(255,255,255,0.95)' }}>
            <TrophyIcon className="w-6 h-6 text-amber-400 anim-float" />
            Where Champions Are Made
            <SparklesIcon className="w-6 h-6 text-cyan-400 anim-glow" />
          </p>
        </div>
        
        <p className="anim-fade-up delay-300 text-base sm:text-lg mb-10 max-w-md leading-relaxed px-4" 
          style={{ color: 'rgba(255,255,255,0.6)' }}>
          Join <span className="font-bold text-green-400">10,000+</span> players across India. 
          Register for tournaments, track progress, and compete with the best.
        </p>

        {/* CTAs - MOBILE OPTIMIZED */}
        <div className="anim-fade-up delay-400 flex flex-col gap-3 w-full max-w-sm px-2">
          {user ? (
            <>
              <Link to={getDashboardLink()}
                className="btn-glow flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-base transition-all duration-300 active:scale-95"
                style={{ background: 'linear-gradient(135deg,#00c853,#00ff88)', color: '#003320' }}>
                <PlayIcon className="w-5 h-5" />
                Get Started Free
                <ArrowRightIcon className="w-5 h-5" />
              </Link>
              <div className="flex items-center justify-center gap-3 px-6 py-4 rounded-xl border"
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
                className="btn-glow flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-base transition-all duration-300 active:scale-95"
                style={{ background: 'linear-gradient(135deg,#00c853,#00ff88)', color: '#003320' }}>
                <PlayIcon className="w-5 h-5" />
                Get Started Free
                <ArrowRightIcon className="w-5 h-5" />
              </Link>
              <Link to="/login"
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-base border transition-all duration-300 active:scale-95"
                style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)' }}>
                Sign In
              </Link>
            </>
          )}
        </div>

        {/* social proof - MOBILE OPTIMIZED */}
        <div className="anim-fade-up delay-500 mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
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
      </section>

      {/* ════════════════════════════════════════
          STATS BAR - MOBILE OPTIMIZED
      ════════════════════════════════════════ */}
      <section className="relative z-10 py-10 px-5">
        <div className="max-w-2xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <div key={i} className="flex flex-col items-center gap-2 py-5 px-3 rounded-2xl border"
              style={{ background: 'rgba(0,255,136,0.04)', borderColor: 'rgba(0,255,136,0.12)' }}>
              <span className="text-2xl">{s.icon}</span>
              <span className="text-2xl sm:text-3xl font-black" style={{ color: '#00ff88' }}>{s.value}</span>
              <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════
          FEATURES - MOBILE OPTIMIZED
      ════════════════════════════════════════ */}
      <section className="relative z-10 py-14 px-5">
        <div className="max-w-2xl mx-auto">
          {/* heading */}
          <div className="text-center mb-10">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase mb-4"
              style={{ background: 'rgba(0,255,136,0.1)', color: '#00ff88', border: '1px solid rgba(0,255,136,0.2)' }}>
              ✦ Features
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3 leading-tight">
              Everything to <span style={{ color: '#00ff88' }}>Dominate</span>
            </h2>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Built for competitive badminton players & organizers</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {features.map((f, i) => (
              <div key={i} className="card-glow group relative rounded-2xl p-6 border transition-all duration-300 active:scale-95"
                style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
                {/* icon */}
                <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br ${f.color} rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300`}>
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
          HOW IT WORKS - MOBILE OPTIMIZED
      ════════════════════════════════════════ */}
      <section className="relative z-10 py-14 px-5">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase mb-4"
              style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.25)' }}>
              🎯 Process
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3 leading-tight">
              How It <span style={{ color: '#a78bfa' }}>Works</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {steps.map((s, i) => (
              <div key={i} className="card-glow relative rounded-2xl p-5 border transition-all duration-300 active:scale-95"
                style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
                {/* step number badge */}
                <div className={`inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br ${s.color} rounded-lg text-white text-xs font-black mb-3`}>
                  {s.step}
                </div>
                <div className="text-3xl mb-3">{s.icon}</div>
                <h3 className="text-sm font-bold text-white mb-1.5">{s.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          WHY MATCHIFY - MOBILE OPTIMIZED
      ════════════════════════════════════════ */}
      <section className="relative z-10 py-14 px-5">
        <div className="max-w-2xl mx-auto rounded-3xl p-6 sm:p-8 border"
          style={{ background: 'rgba(0,255,136,0.03)', borderColor: 'rgba(0,255,136,0.1)' }}>
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 leading-tight">
              Why <span style={{ color: '#00ff88' }}>Matchify.pro</span>?
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl p-4 border transition-all duration-300 active:scale-95"
                style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
                <div className={`flex-shrink-0 w-10 h-10 ${b.bg} ${b.color} rounded-lg flex items-center justify-center`}>
                  <b.icon className="w-5 h-5" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-white leading-tight">{b.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          TESTIMONIALS - MOBILE OPTIMIZED
      ════════════════════════════════════════ */}
      <section className="relative z-10 py-14 px-5">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase mb-4"
              style={{ background: 'rgba(6,182,212,0.1)', color: '#22d3ee', border: '1px solid rgba(6,182,212,0.25)' }}>
              💬 Players Say
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
              Real <span style={{ color: '#22d3ee' }}>Reviews</span>
            </h2>
          </div>

          <div className="flex flex-col gap-5">
            {testimonials.map((t, i) => (
              <div key={i} className="card-glow rounded-2xl p-6 border transition-all duration-300"
                style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => <StarIcon key={j} className="w-5 h-5 text-amber-400" />)}
                </div>
                <p className="text-sm leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.7)' }}>"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl flex-shrink-0"
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
          CTA BANNER - MOBILE OPTIMIZED
      ════════════════════════════════════════ */}
      <section className="relative z-10 py-14 px-5">
        <div className="max-w-2xl mx-auto text-center rounded-3xl p-8 sm:p-10 border overflow-hidden relative"
          style={{ background: 'linear-gradient(135deg, rgba(0,255,136,0.07) 0%, rgba(99,102,241,0.07) 100%)', borderColor: 'rgba(0,255,136,0.2)' }}>
          {/* bg glow */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(0,255,136,0.08) 0%, transparent 70%)' }} />

          <div className="relative">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 text-3xl"
              style={{ background: 'linear-gradient(135deg,#00c853,#00ff88)' }}>
              🚀
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 leading-tight">
              Ready to Start?
            </h2>
            <p className="text-sm mb-8 px-4" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Join India's fastest-growing badminton community today.
            </p>
            <div className="flex flex-col gap-3 max-w-sm mx-auto">
              <Link to={user ? getDashboardLink() : '/register'}
                className="btn-glow flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-base transition-all duration-300 active:scale-95"
                style={{ background: 'linear-gradient(135deg,#00c853,#00ff88)', color: '#003320' }}>
                {user ? 'Go to Dashboard' : 'Create Free Account'}
                <ArrowRightIcon className="w-5 h-5" />
              </Link>
              <Link to="/tournaments"
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-base border transition-all duration-300 active:scale-95"
                style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)' }}>
                Browse Tournaments
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FOOTER - MOBILE OPTIMIZED
      ════════════════════════════════════════ */}
      <footer className="relative z-10 border-t py-12 px-5" style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.3)' }}>
        <div className="max-w-2xl mx-auto flex flex-col items-center gap-6">

          {/* brand */}
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="matchify.pro" className="h-10 w-auto" style={{ filter: 'drop-shadow(0 0 10px rgba(0,255,136,0.5))' }} />
            <span className="font-black text-xl">
              <span style={{ color: '#ffffff' }}>matchify</span>
              <span style={{ color: '#00ff88' }}>.pro</span>
            </span>
          </div>

          <p className="text-xs text-center leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Built with ❤️ for the Indian Badminton Community
          </p>

          {/* founders */}
          <div className="rounded-2xl px-6 py-5 border text-center w-full max-w-xs"
            style={{ background: 'rgba(0,255,136,0.04)', borderColor: 'rgba(0,255,136,0.12)' }}>
            <p className="text-xs tracking-wider uppercase mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Co-Founded By</p>
            <p className="text-lg font-black mb-2" style={{ color: '#00ff88' }}>PS Brothers</p>
            <div className="flex justify-center items-center gap-4 text-sm font-semibold text-white">
              <span>PS Lochan</span>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
              <span>PS Pradyumna</span>
            </div>
          </div>

          <div className="flex gap-6 text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
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
