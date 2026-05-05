import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  TrophyIcon,
  UserGroupIcon,
  ChartBarIcon,
  SparklesIcon,
  ArrowRightIcon,
  PlayIcon,
  BoltIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';

// Inject keyframes once
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
      50%       { opacity: 0.8; }
    }
    @keyframes scanline {
      0%   { transform: translateY(-100%); }
      100% { transform: translateY(100vh); }
    }
    .anim-fade-up  { animation: fadeUp 0.7s ease-out forwards; opacity: 0; }
    .anim-float    { animation: floatY 5s ease-in-out infinite; }
    .anim-glow     { animation: pulseGlow 3s ease-in-out infinite; }
    .delay-100  { animation-delay: 0.1s; }
    .delay-200  { animation-delay: 0.2s; }
    .delay-300  { animation-delay: 0.3s; }
    .delay-400  { animation-delay: 0.4s; }
    .delay-500  { animation-delay: 0.5s; }
    .neon-text-green {
      text-shadow: 0 0 20px rgba(0,255,136,0.6), 0 0 60px rgba(0,255,136,0.3);
    }
    .neon-text-cyan {
      text-shadow: 0 0 20px rgba(0,212,255,0.6), 0 0 60px rgba(0,212,255,0.3);
    }
    .card-glow:hover {
      box-shadow: 0 0 30px rgba(0,255,136,0.12), 0 8px 32px rgba(0,0,0,0.4);
    }
    .btn-glow {
      box-shadow: 0 0 20px rgba(0,255,136,0.4), 0 4px 16px rgba(0,0,0,0.3);
    }
    .btn-glow:hover {
      box-shadow: 0 0 40px rgba(0,255,136,0.6), 0 8px 24px rgba(0,0,0,0.4);
    }
    .grid-bg {
      background-image:
        linear-gradient(rgba(0,255,136,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,255,136,0.04) 1px, transparent 1px);
      background-size: 60px 60px;
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
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: '#07071a' }}>

      {/* ── GLOBAL BACKGROUND ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="grid-bg absolute inset-0" />
        {/* ambient glows */}
        <div className="anim-glow absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(0,255,136,0.12) 0%, transparent 70%)' }} />
        <div className="anim-glow delay-300 absolute bottom-0 left-0 w-80 h-80 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)' }} />
        <div className="anim-glow delay-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)' }} />
      </div>

      {/* ════════════════════════════════════════
          HERO
      ════════════════════════════════════════ */}
      <section className="relative z-10 pt-16 pb-12 px-4 flex flex-col items-center text-center">

        {/* pill badge */}
        <div className="anim-fade-up inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold tracking-widest uppercase mb-8"
          style={{ background: 'rgba(0,255,136,0.08)', borderColor: 'rgba(0,255,136,0.25)', color: '#00ff88' }}>
          <SparklesIcon className="w-3.5 h-3.5" />
          India's #1 Badminton Platform
        </div>

        {/* shield logo */}
        <div className="anim-float anim-fade-up delay-100 mb-6 relative">
          <div className="absolute inset-0 blur-2xl rounded-full" style={{ background: 'rgba(0,255,136,0.3)', transform: 'scale(0.6)' }} />
          <svg viewBox="0 0 120 140" className="relative h-20 w-auto sm:h-28" style={{ filter: 'drop-shadow(0 0 20px rgba(0,255,136,0.7))' }}>
            <defs>
              <linearGradient id="sg1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%"   stopColor="#00ff88" />
                <stop offset="60%"  stopColor="#00c853" />
                <stop offset="100%" stopColor="#007c35" />
              </linearGradient>
            </defs>
            <path d="M60 8 L110 25 L110 70 Q110 115 60 132 Q10 115 10 70 L10 25 Z" fill="url(#sg1)" stroke="rgba(0,255,136,0.6)" strokeWidth="2.5"/>
            <text x="60" y="88" textAnchor="middle" fill="#003320" fontSize="55" fontWeight="900" fontFamily="Arial Black,sans-serif">M</text>
            <ellipse cx="103" cy="20" rx="11" ry="14" fill="#3b82f6" stroke="#60a5fa" strokeWidth="1.5" transform="rotate(45,103,20)"/>
            <line x1="103" y1="29" x2="113" y2="44" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="96" y1="14" x2="110" y2="26" stroke="#93c5fd" strokeWidth="0.8"/>
            <line x1="99" y1="9"  x2="109" y2="29" stroke="#93c5fd" strokeWidth="0.8"/>
            <line x1="94" y1="20" x2="112" y2="20" stroke="#93c5fd" strokeWidth="0.8"/>
            <ellipse cx="116" cy="47" rx="3.5" ry="2.5" fill="#ec4899"/>
            <path d="M116 44 L113 38 M116 44 L116 37 M116 44 L119 38" stroke="#f9a8d4" strokeWidth="1.2" fill="none"/>
          </svg>
        </div>

        {/* main title — SAFE on 375px */}
        <div className="anim-fade-up delay-200 mb-4 w-full">
          <h1 className="font-black leading-none tracking-tighter"
            style={{ fontSize: 'clamp(2.2rem, 12vw, 7rem)' }}>
            <span className="neon-text-green" style={{ color: '#00ff88' }}>MATCHIFY</span>
            <span className="neon-text-cyan"  style={{ color: '#00d4ff' }}>.PRO</span>
          </h1>
        </div>

        {/* tagline */}
        <p className="anim-fade-up delay-300 text-base sm:text-xl font-light mb-3 max-w-xs sm:max-w-md" style={{ color: 'rgba(255,255,255,0.75)' }}>
          Where Champions Are Made
        </p>
        <p className="anim-fade-up delay-400 text-sm sm:text-base mb-10 max-w-xs sm:max-w-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Join thousands of players across India. Register for tournaments, track progress, and compete with the best.
        </p>

        {/* CTAs */}
        <div className="anim-fade-up delay-500 flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-none sm:w-auto">
          {user ? (
            <>
              <Link to={getDashboardLink()}
                className="btn-glow flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 hover:scale-105"
                style={{ background: 'linear-gradient(135deg,#00c853,#00ff88)', color: '#003320' }}>
                <TrophyIcon className="w-5 h-5" />
                Go to Dashboard
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
              <div className="flex items-center justify-center gap-3 px-5 py-3 rounded-xl border"
                style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                  style={{ background: 'linear-gradient(135deg,#00c853,#00ff88)', color: '#003320' }}>
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Welcome back</p>
                  <p className="text-sm font-semibold text-white">{user.name}</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link to="/register"
                className="btn-glow flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 hover:scale-105"
                style={{ background: 'linear-gradient(135deg,#00c853,#00ff88)', color: '#003320' }}>
                <PlayIcon className="w-5 h-5" />
                Get Started Free
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
              <Link to="/login"
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm border transition-all duration-300 hover:scale-105"
                style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.85)' }}>
                Sign In
              </Link>
            </>
          )}
        </div>

        {/* social proof */}
        <div className="anim-fade-up delay-500 mt-8 flex flex-wrap justify-center items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1.5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold"
                  style={{ background: 'linear-gradient(135deg,#00c853,#00ff88)', borderColor: '#07071a', color: '#003320' }}>
                  {['R','P','A','K'][i]}
                </div>
              ))}
            </div>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>1000+ players joined</span>
          </div>
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => <StarIcon key={i} className="w-4 h-4 text-amber-400" />)}
            <span className="text-xs ml-1" style={{ color: 'rgba(255,255,255,0.5)' }}>4.9 / 5</span>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          STATS BAR
      ════════════════════════════════════════ */}
      <section className="relative z-10 py-8 px-4">
        <div className="max-w-2xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((s, i) => (
            <div key={i} className="flex flex-col items-center gap-1 py-4 px-2 rounded-2xl border"
              style={{ background: 'rgba(0,255,136,0.04)', borderColor: 'rgba(0,255,136,0.12)' }}>
              <span className="text-xl">{s.icon}</span>
              <span className="text-xl sm:text-2xl font-black" style={{ color: '#00ff88' }}>{s.value}</span>
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════
          FEATURES
      ════════════════════════════════════════ */}
      <section className="relative z-10 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* heading */}
          <div className="text-center mb-8">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase mb-3"
              style={{ background: 'rgba(0,255,136,0.1)', color: '#00ff88', border: '1px solid rgba(0,255,136,0.2)' }}>
              ✦ Features
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white mb-2">
              Everything to <span style={{ color: '#00ff88' }}>Dominate</span>
            </h2>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>Built for competitive badminton players & organizers</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((f, i) => (
              <div key={i} className="card-glow group relative rounded-2xl p-5 border transition-all duration-300 hover:-translate-y-1"
                style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
                {/* icon */}
                <div className={`inline-flex items-center justify-center w-11 h-11 bg-gradient-to-br ${f.color} rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          HOW IT WORKS
      ════════════════════════════════════════ */}
      <section className="relative z-10 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase mb-3"
              style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.25)' }}>
              🎯 Process
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white mb-2">
              How It <span style={{ color: '#a78bfa' }}>Works</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {steps.map((s, i) => (
              <div key={i} className="card-glow relative rounded-2xl p-4 border transition-all duration-300 hover:-translate-y-1"
                style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
                {/* step number badge */}
                <div className={`inline-flex items-center justify-center w-7 h-7 bg-gradient-to-br ${s.color} rounded-lg text-white text-xs font-black mb-3`}>
                  {s.step}
                </div>
                <div className="text-3xl mb-2">{s.icon}</div>
                <h3 className="text-sm font-bold text-white mb-1">{s.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          WHY MATCHIFY
      ════════════════════════════════════════ */}
      <section className="relative z-10 py-12 px-4">
        <div className="max-w-2xl mx-auto rounded-3xl p-5 sm:p-8 border"
          style={{ background: 'rgba(0,255,136,0.03)', borderColor: 'rgba(0,255,136,0.1)' }}>
          <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-1">
              Why <span style={{ color: '#00ff88' }}>Matchify.pro</span>?
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl p-3.5 border transition-all duration-300 hover:-translate-y-0.5"
                style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
                <div className={`flex-shrink-0 w-9 h-9 ${b.bg} ${b.color} rounded-lg flex items-center justify-center`}>
                  <b.icon className="w-5 h-5" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-white">{b.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          TESTIMONIALS
      ════════════════════════════════════════ */}
      <section className="relative z-10 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase mb-3"
              style={{ background: 'rgba(6,182,212,0.1)', color: '#22d3ee', border: '1px solid rgba(6,182,212,0.25)' }}>
              💬 Players Say
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              Real <span style={{ color: '#22d3ee' }}>Reviews</span>
            </h2>
          </div>

          <div className="flex flex-col gap-4">
            {testimonials.map((t, i) => (
              <div key={i} className="card-glow rounded-2xl p-5 border transition-all duration-300"
                style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, j) => <StarIcon key={j} className="w-4 h-4 text-amber-400" />)}
                </div>
                <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.65)' }}>"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)' }}>
                    {t.emoji}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{t.role} · {t.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          CTA BANNER
      ════════════════════════════════════════ */}
      <section className="relative z-10 py-12 px-4">
        <div className="max-w-2xl mx-auto text-center rounded-3xl p-6 sm:p-10 border overflow-hidden relative"
          style={{ background: 'linear-gradient(135deg, rgba(0,255,136,0.07) 0%, rgba(99,102,241,0.07) 100%)', borderColor: 'rgba(0,255,136,0.2)' }}>
          {/* bg glow */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(0,255,136,0.08) 0%, transparent 70%)' }} />

          <div className="relative">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5 text-2xl"
              style={{ background: 'linear-gradient(135deg,#00c853,#00ff88)' }}>
              🚀
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white mb-3">
              Ready to Start?
            </h2>
            <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Join India's fastest-growing badminton community today.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to={user ? getDashboardLink() : '/register'}
                className="btn-glow flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 hover:scale-105"
                style={{ background: 'linear-gradient(135deg,#00c853,#00ff88)', color: '#003320' }}>
                {user ? 'Go to Dashboard' : 'Create Free Account'}
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
              <Link to="/tournaments"
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm border transition-all duration-300 hover:scale-105"
                style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.85)' }}>
                Browse Tournaments
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════ */}
      <footer className="relative z-10 border-t py-10 px-4" style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.3)' }}>
        <div className="max-w-2xl mx-auto flex flex-col items-center gap-5">

          {/* brand */}
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 120 140" className="h-9 w-auto" style={{ filter: 'drop-shadow(0 0 10px rgba(0,255,136,0.5))' }}>
              <defs>
                <linearGradient id="fg1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00ff88" />
                  <stop offset="100%" stopColor="#007c35" />
                </linearGradient>
              </defs>
              <path d="M60 8 L110 25 L110 70 Q110 115 60 132 Q10 115 10 70 L10 25 Z" fill="url(#fg1)" stroke="rgba(0,255,136,0.5)" strokeWidth="2"/>
              <text x="60" y="88" textAnchor="middle" fill="#003320" fontSize="55" fontWeight="900" fontFamily="Arial Black,sans-serif">M</text>
            </svg>
            <span className="font-black text-lg">
              <span style={{ color: '#00ff88' }}>MATCHIFY</span>
              <span style={{ color: '#00d4ff' }}>.PRO</span>
            </span>
          </div>

          <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Built with ❤️ for the Indian Badminton Community
          </p>

          {/* founders */}
          <div className="rounded-2xl px-6 py-4 border text-center w-full max-w-xs"
            style={{ background: 'rgba(0,255,136,0.04)', borderColor: 'rgba(0,255,136,0.12)' }}>
            <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>Co-Founded By</p>
            <p className="text-base font-black mb-2" style={{ color: '#00ff88' }}>PS Brothers</p>
            <div className="flex justify-center items-center gap-4 text-sm font-semibold text-white">
              <span>PS Lochan</span>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
              <span>PS Pradyumna</span>
            </div>
          </div>

          <div className="flex gap-5 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <a href="#" className="hover:text-white transition-colors">About</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>

          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>© 2026 Matchify.pro · All rights reserved</p>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
