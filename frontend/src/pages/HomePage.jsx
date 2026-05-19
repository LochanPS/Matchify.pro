import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import MatchifyLogo from '../components/MatchifyLogo';
import {
  TrophyIcon, UserGroupIcon, ChartBarIcon,
  ArrowRightIcon, ShieldCheckIcon,
  CalendarDaysIcon, MapPinIcon, CurrencyRupeeIcon,
  SignalIcon, Cog6ToothIcon, CheckCircleIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';

// ─── All static data outside component — zero re-render cost ────────────────

const DEFAULT_STATS = [
  { value: '…',     label: 'Active Players', icon: '🏸' },
  { value: '…',     label: 'Tournaments',    icon: '🏆' },
  { value: '…',     label: 'Cities',         icon: '📍' },
  { value: '₹10L+', label: 'Prize Money',    icon: '💰' },
];

const PROBLEMS = [
  { icon: '📋', title: 'Manual bracket chaos',    desc: 'Hours drawing brackets by hand, only to redo them after a dropout.' },
  { icon: '💬', title: 'WhatsApp scheduling mess', desc: 'Match times buried in group chats. Players miss slots constantly.' },
  { icon: '📝', title: 'Paper score tracking',    desc: 'Handwritten results, no live updates, spectators left guessing.' },
  { icon: '💸', title: 'Cash payment confusion',  desc: 'No record of who paid, missing registrations, manual verification.' },
];

const STEPS = [
  { num: '01', title: 'Create your tournament',  desc: 'Set format, categories, prize money, and payment in under 5 minutes.', color: '#00ff88' },
  { num: '02', title: 'Players register online', desc: 'Share one link. Players sign up and pay via UPI — fully automated.',   color: '#00d4ff' },
  { num: '03', title: 'Manage everything live',  desc: 'Auto-generated draws, live scoring, real-time bracket updates.',        color: '#a855f7' },
];

const FEATURES = [
  { Icon: TrophyIcon,        title: 'Automated draw generation',    desc: 'Seeded brackets for Knockout, Round Robin, and Hybrid. One click, done.', tag: '8–256 players',   color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  { Icon: SignalIcon,        title: 'Live point-by-point scoring',  desc: 'Umpires score from the court. Spectators watch every point in real time.', tag: 'WebSocket live',  color: '#00ff88', bg: 'rgba(0,255,136,0.1)' },
  { Icon: CurrencyRupeeIcon, title: 'UPI payment collection',       desc: 'Players pay via QR. You verify. Wallet refunds processed instantly.',      tag: '100% secure',     color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  { Icon: UserGroupIcon,     title: 'Doubles partner network',      desc: 'Players invite partners in-app. Doubles pairs registered automatically.',  tag: "Men's·Women's·Mixed", color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
  { Icon: ChartBarIcon,      title: 'Rankings & leaderboards',      desc: 'Matchify Points auto-updated after every result. City and national boards.',tag: 'Auto-updated',    color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  { Icon: Cog6ToothIcon,     title: 'Full organizer control',       desc: 'Registrations, umpires, draws, payments — all in one clean dashboard.',    tag: 'End-to-end',      color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
];

const TESTIMONIALS = [
  { name: 'Arjun Kumar',  role: 'Tournament Organizer', city: 'Delhi',     badge: 'Organizer ⚙️',         badgeColor: '#00d4ff', text: 'Automated draws and payment verification save me 4+ hours per event. What used to take a full day now takes 30 minutes.' },
  { name: 'Priya Patel',  role: 'Club Player',          city: 'Mumbai',    badge: 'Ladies Doubles 🏅',    badgeColor: '#ec4899', text: 'The partner invite system is genius. I registered for doubles with my friend in under 2 minutes, from different cities.' },
  { name: 'Rahul Sharma', role: 'State Level Player',   city: 'Bangalore', badge: 'State Champion 🥇',    badgeColor: '#f59e0b', text: 'Live scoring kept my whole family updated from home. They watched every point live from 400km away.' },
];

const HP_CSS = `
  @keyframes hp-up    { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
  @keyframes hp-float { 0%,100%{transform:translateY(0) translateZ(0)} 50%{transform:translateY(-10px) translateZ(0)} }
  @keyframes hp-glow  { 0%,100%{opacity:.25} 50%{opacity:.7} }
  @keyframes hp-shim  { 0%{background-position:-600px 0} 100%{background-position:600px 0} }
  @keyframes hp-dot   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.35;transform:scale(.65)} }
  @keyframes hp-badge { 0%{opacity:.6} 50%{opacity:1} 100%{opacity:.6} }

  .hp-fade  { animation: hp-up .65s cubic-bezier(.16,1,.3,1) both; opacity:0; }
  .hp-float { animation: hp-float 6s ease-in-out infinite; will-change:transform; }
  .hp-glow  { animation: hp-glow  4s ease-in-out infinite; }

  .hp-shim {
    background: linear-gradient(90deg,#00ff88 0%,#00d4ff 40%,#a855f7 70%,#00ff88 100%);
    background-size: 200% auto;
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: hp-shim 4s linear infinite;
  }

  .hp-card {
    transition: transform .22s ease, box-shadow .22s ease;
    -webkit-transform: translateZ(0);
  }
  .hp-card:hover { transform:translateY(-3px) translateZ(0); box-shadow:0 14px 40px rgba(0,0,0,.45),0 0 0 1px rgba(255,255,255,.07); }

  .hp-btn {
    transition: transform .18s ease, box-shadow .18s ease;
    -webkit-transform: translateZ(0);
    -webkit-tap-highlight-color: transparent;
  }
  .hp-btn:hover  { transform:translateY(-2px) translateZ(0); }
  .hp-btn:active { transform:scale(.96) translateZ(0); }

  .hp-dot { width:8px;height:8px;border-radius:50%;background:#00ff88;box-shadow:0 0 7px #00ff88; animation:hp-dot 1.4s ease-in-out infinite; }

  .hp-grid {
    background-image:
      linear-gradient(rgba(99,102,241,.028) 1px, transparent 1px),
      linear-gradient(90deg, rgba(99,102,241,.028) 1px, transparent 1px);
    background-size: 60px 60px;
  }

  /* delay helpers */
  .d1{animation-delay:.08s} .d2{animation-delay:.16s} .d3{animation-delay:.24s}
  .d4{animation-delay:.32s} .d5{animation-delay:.40s} .d6{animation-delay:.50s}
  .d7{animation-delay:.60s} .d8{animation-delay:.72s}

  /* iOS smooth scroll */
  html { -webkit-overflow-scrolling: touch; scroll-behavior: smooth; }
  /* Prevent text size adjust on iOS rotation */
  html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
  /* Antialiasing */
  body { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
`;

// ─── Scroll-reveal wrapper ───────────────────────────────────────────────────
function Reveal({ children, className = '', delay = 0, style = {} }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.cssText += `opacity:0;transform:translateY(22px);transition:opacity .6s ease ${delay}s,transform .6s cubic-bezier(.16,1,.3,1) ${delay}s;`;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
        obs.disconnect();
      }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);
  return <div ref={ref} className={className} style={style}>{children}</div>;
}

// ─── Dashboard preview mockup ────────────────────────────────────────────────
function DashboardMockup() {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden"
      style={{ background:'#0d1025', border:'1px solid rgba(0,212,255,0.2)', boxShadow:'0 32px 80px rgba(0,0,0,.7), 0 0 0 1px rgba(255,255,255,.04)', maxWidth:440 }}>

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3"
        style={{ background:'rgba(255,255,255,.03)', borderBottom:'1px solid rgba(255,255,255,.06)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full" style={{ background:'#ff5f57' }} />
          <div className="w-3 h-3 rounded-full" style={{ background:'#febc2e' }} />
          <div className="w-3 h-3 rounded-full" style={{ background:'#28c840' }} />
        </div>
        <div className="flex-1 mx-4">
          <div className="mx-auto h-6 rounded-lg flex items-center px-3" style={{ background:'rgba(255,255,255,.05)', maxWidth:180 }}>
            <span className="text-xs" style={{ color:'rgba(255,255,255,.3)', fontSize:10 }}>matchify.pro/tournament/kerala-open</span>
          </div>
        </div>
        <div className="w-14" />
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">

        {/* Tournament header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="hp-dot" />
              <span className="text-xs font-bold" style={{ color:'#00ff88' }}>LIVE</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background:'rgba(245,158,11,.15)', color:'#fbbf24', fontSize:10 }}>Knockout</span>
            </div>
            <p className="text-sm font-black text-white">Kerala State Open 2026</p>
            <p className="text-xs mt-0.5" style={{ color:'rgba(255,255,255,.4)' }}>Quarter Finals · 8 matches remaining</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs" style={{ color:'rgba(255,255,255,.3)' }}>Prize Pool</p>
            <p className="text-base font-black" style={{ color:'#00ff88' }}>₹50,000</p>
          </div>
        </div>

        {/* Live match card */}
        <div className="rounded-xl p-3" style={{ background:'rgba(0,255,136,.05)', border:'1px solid rgba(0,255,136,.18)' }}>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold" style={{ color:'rgba(255,255,255,.4)' }}>QF · Match 3</span>
            <div className="flex items-center gap-1.5">
              <div className="hp-dot" style={{ width:6, height:6 }} />
              <span className="text-xs font-bold" style={{ color:'#00ff88' }}>In Progress</span>
            </div>
          </div>
          <div className="space-y-2">
            {[
              { name:'Rahul Sharma', score:'18', serving:true, winning:true },
              { name:'Arjun Patel',  score:'15', serving:false, winning:false },
            ].map((p, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {p.serving && <div className="w-1.5 h-1.5 rounded-full" style={{ background:'#00d4ff' }} />}
                  {!p.serving && <div className="w-1.5 h-1.5" />}
                  <span className="text-xs font-semibold" style={{ color: p.winning ? 'white' : 'rgba(255,255,255,.55)' }}>{p.name}</span>
                </div>
                <span className="text-base font-black" style={{ color: p.winning ? '#00ff88' : 'rgba(255,255,255,.5)' }}>{p.score}</span>
              </div>
            ))}
          </div>
          <div className="mt-2.5 rounded-full overflow-hidden" style={{ height:3, background:'rgba(255,255,255,.06)' }}>
            <div className="hp-score-bar" style={{ width:'54.5%', height:'100%', background:'linear-gradient(90deg,#00ff88,#00d4ff)' }} />
          </div>
        </div>

        {/* Upcoming match */}
        <div className="rounded-xl p-3" style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold" style={{ color:'rgba(255,255,255,.4)' }}>QF · Match 4</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background:'rgba(99,102,241,.15)', color:'#818cf8', fontSize:10 }}>Upcoming</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white">Priya Nair</span>
            <span className="text-xs font-black" style={{ color:'rgba(255,255,255,.2)' }}>vs</span>
            <span className="text-xs font-semibold text-white">Sneha Reddy</span>
          </div>
        </div>

        {/* Bottom stats row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label:'Registered', val:'24 / 32', color:'#00d4ff' },
            { label:'Completed',  val:'12 matches', color:'#00ff88' },
            { label:'Draw',       val:'Auto-gen ✓', color:'#a855f7' },
          ].map((s, i) => (
            <div key={i} className="rounded-xl p-2.5 text-center" style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.06)' }}>
              <p className="text-xs font-black" style={{ color:s.color, fontSize:11 }}>{s.val}</p>
              <p className="text-xs mt-0.5" style={{ color:'rgba(255,255,255,.3)', fontSize:9 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
function HomePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(DEFAULT_STATS);

  // Fetch real platform stats
  useEffect(() => {
    api.get('/leaderboard/platform-stats')
      .then(res => {
        if (res.data?.success) {
          const { players, tournaments, cities } = res.data.stats;
          setStats([
            { value: players >= 1000 ? `${(players / 1000).toFixed(1)}K+` : `${players}+`, label: 'Active Players', icon: '🏸' },
            { value: `${tournaments}+`, label: 'Tournaments', icon: '🏆' },
            { value: `${cities}+`,      label: 'Cities',      icon: '📍' },
            { value: '₹10L+',           label: 'Prize Money', icon: '💰' },
          ]);
        }
      })
      .catch(() => { /* keep defaults */ });
  }, []);

  // Inject CSS once on mount
  useEffect(() => {
    if (document.head.querySelector('style[data-hp]')) return;
    const s = document.createElement('style');
    s.setAttribute('data-hp', '1');
    s.textContent = HP_CSS;
    document.head.appendChild(s);
    return () => { /* keep style alive across navigations */ };
  }, []);

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

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background:'#07071a', color:'white' }}>

      {/* ── BACKGROUND (static, no fixed — avoids iOS repaint) ── */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="hp-grid absolute inset-0" />
        <div className="hp-glow hp-float absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full"
          style={{ background:'radial-gradient(circle, rgba(0,255,136,.1) 0%, transparent 65%)', filter:'blur(1px)' }} />
        <div className="hp-glow hp-float absolute top-1/2 -left-40 w-[400px] h-[400px] rounded-full"
          style={{ background:'radial-gradient(circle, rgba(99,102,241,.08) 0%, transparent 65%)', animationDelay:'2s' }} />
        <div className="hp-glow absolute bottom-0 right-0 w-[450px] h-[450px] rounded-full"
          style={{ background:'radial-gradient(circle, rgba(0,212,255,.06) 0%, transparent 65%)', animationDelay:'1s' }} />
      </div>

      {/* ════════════════════════════════════════
          1. HERO
      ════════════════════════════════════════ */}
      <section className="relative z-10 pt-12 pb-10 px-5">
        <div className="mx-auto" style={{ maxWidth:460 }}>

          {/* Badge */}
          <div className="hp-fade d1 flex justify-center mb-5">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black tracking-wider uppercase"
              style={{ background:'rgba(0,255,136,.08)', border:'1px solid rgba(0,255,136,.22)', color:'#00ff88' }}>
              🏸 India's #1 Badminton Platform
            </span>
          </div>

          {/* Headline */}
          <div className="hp-fade d2 text-center mb-4">
            <h1 className="font-black leading-[1.05] tracking-tight" style={{ fontSize:'clamp(2rem,7vw,2.9rem)' }}>
              Run professional<br />
              <span className="hp-shim">badminton tournaments</span><br />
              in minutes.
            </h1>
          </div>

          {/* Subheading */}
          <p className="hp-fade d3 text-center text-sm leading-relaxed mb-7 px-2" style={{ color:'rgba(255,255,255,.55)', fontSize:'clamp(.85rem,3vw,.95rem)' }}>
            Registrations, draws, live scoring, payments, and results — everything your tournament needs in one place.
          </p>

          {/* CTAs */}
          {user ? (
            <div className="hp-fade d4 flex flex-col gap-3 mb-8">
              <Link to={getDashboardLink()}
                className="hp-btn flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-base"
                style={{ background:'linear-gradient(135deg,#00c853,#00ff88)', color:'#003320', boxShadow:'0 4px 24px rgba(0,255,136,.4)' }}>
                Go to Dashboard
                <ArrowRightIcon className="w-5 h-5" />
              </Link>
              <Link to="/tournaments"
                className="hp-btn flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm"
                style={{ background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)', color:'rgba(255,255,255,.8)' }}>
                Browse Tournaments
              </Link>
            </div>
          ) : (
            <div className="hp-fade d4 flex flex-col gap-3 mb-8">
              <Link to="/register"
                className="hp-btn flex items-center justify-center gap-2.5 py-4 rounded-2xl font-black text-base"
                style={{ background:'linear-gradient(135deg,#00c853,#00ff88)', color:'#003320', boxShadow:'0 4px 24px rgba(0,255,136,.4)' }}>
                Create Tournament Free
                <ArrowRightIcon className="w-5 h-5" />
              </Link>
              <Link to="/tournaments"
                className="hp-btn flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm"
                style={{ background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)', color:'rgba(255,255,255,.8)' }}>
                Browse Tournaments — No Account Needed
              </Link>
              <p className="text-center text-xs" style={{ color:'rgba(255,255,255,.35)' }}>
                Already organizing?{' '}
                <Link to="/login" style={{ color:'#00ff88' }} className="font-semibold">Sign In</Link>
              </p>
            </div>
          )}

          {/* Social proof */}
          <div className="hp-fade d5 flex items-center justify-center gap-4 mb-10">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {['R','P','A','K'].map((l, i) => (
                  <div key={i} className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-black"
                    style={{ background:'linear-gradient(135deg,#00c853,#00ff88)', borderColor:'#07071a', color:'#003320' }}>{l}</div>
                ))}
              </div>
              <span className="text-xs" style={{ color:'rgba(255,255,255,.45)' }}>1,000+ players</span>
            </div>
            <div className="w-px h-5" style={{ background:'rgba(255,255,255,.1)' }} />
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => <StarIcon key={i} className="w-3.5 h-3.5 text-amber-400" />)}
              <span className="text-xs ml-1" style={{ color:'rgba(255,255,255,.45)' }}>4.9</span>
            </div>
          </div>

          {/* Dashboard preview */}
          <div className="hp-fade d6 hp-float flex justify-center">
            <DashboardMockup />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          2. STATS BAR
      ════════════════════════════════════════ */}
      <section className="relative z-10 py-8 px-5">
        <Reveal>
          <div className="mx-auto" style={{ maxWidth:460 }}>
            <div className="grid grid-cols-4 gap-2">
              {stats.map((s, i) => (
                <div key={i} className="flex flex-col items-center gap-1 py-4 px-2 rounded-2xl"
                  style={{ background:'rgba(0,255,136,.04)', border:'1px solid rgba(0,255,136,.1)' }}>
                  <span className="text-xl">{s.icon}</span>
                  <span className="text-lg font-black" style={{ color:'#00ff88' }}>{s.value}</span>
                  <span className="text-center leading-tight" style={{ color:'rgba(255,255,255,.4)', fontSize:10, fontWeight:500 }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* ════════════════════════════════════════
          3. PROBLEM SECTION
      ════════════════════════════════════════ */}
      <section className="relative z-10 py-12 px-5">
        <div className="mx-auto" style={{ maxWidth:460 }}>
          <Reveal className="text-center mb-8">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-black tracking-wider uppercase mb-3"
              style={{ background:'rgba(239,68,68,.08)', color:'#f87171', border:'1px solid rgba(239,68,68,.2)' }}>
              😩 The Problem
            </span>
            <h2 className="text-2xl font-black leading-tight">
              Tournament organizing<br />
              <span style={{ color:'#f87171' }}>shouldn't be this hard.</span>
            </h2>
            <p className="text-sm mt-2" style={{ color:'rgba(255,255,255,.45)' }}>
              Every organizer faces the same pain points.
            </p>
          </Reveal>

          <div className="grid grid-cols-2 gap-3">
            {PROBLEMS.map((p, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <div className="hp-card h-full rounded-2xl p-4"
                  style={{ background:'rgba(239,68,68,.04)', border:'1px solid rgba(239,68,68,.12)' }}>
                  <span className="text-2xl block mb-2">{p.icon}</span>
                  <h3 className="text-sm font-black text-white mb-1 leading-tight">{p.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color:'rgba(255,255,255,.45)' }}>{p.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.3} className="mt-5">
            <div className="flex items-center gap-3 p-4 rounded-2xl"
              style={{ background:'rgba(0,255,136,.05)', border:'1px solid rgba(0,255,136,.2)' }}>
              <span className="text-2xl flex-shrink-0">✅</span>
              <div>
                <p className="text-sm font-black text-white">Matchify solves all of this.</p>
                <p className="text-xs mt-0.5" style={{ color:'rgba(255,255,255,.5)' }}>
                  One platform. Zero spreadsheets. Professional results.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════════════════════════════════════════
          4. HOW IT WORKS
      ════════════════════════════════════════ */}
      <section className="relative z-10 py-12 px-5">
        <div className="mx-auto" style={{ maxWidth:460 }}>
          <Reveal className="text-center mb-8">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-black tracking-wider uppercase mb-3"
              style={{ background:'rgba(0,212,255,.08)', color:'#22d3ee', border:'1px solid rgba(0,212,255,.2)' }}>
              🎯 How It Works
            </span>
            <h2 className="text-2xl font-black leading-tight">
              From idea to live tournament<br />
              <span style={{ color:'#22d3ee' }}>in 3 simple steps.</span>
            </h2>
          </Reveal>

          <div className="relative flex flex-col gap-0">
            {/* Vertical connecting line */}
            <div className="absolute left-[27px] top-10 bottom-10 w-0.5"
              style={{ background:'linear-gradient(180deg,#00ff88,#00d4ff,#a855f7)', opacity:.35 }} aria-hidden />

            {STEPS.map((s, i) => (
              <Reveal key={i} delay={i * 0.12}>
                <div className="flex items-start gap-4 pb-6 relative">
                  {/* Step number circle */}
                  <div className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center font-black text-sm z-10"
                    style={{ background:`linear-gradient(135deg,${s.color}22,${s.color}14)`, border:`2px solid ${s.color}40`, color:s.color }}>
                    {s.num}
                  </div>
                  {/* Content */}
                  <div className="flex-1 pt-3">
                    <h3 className="text-base font-black text-white mb-1">{s.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color:'rgba(255,255,255,.5)' }}>{s.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          {!user && (
            <Reveal delay={0.4} className="mt-2">
              <Link to="/register"
                className="hp-btn flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-black text-base"
                style={{ background:'linear-gradient(135deg,#00c853,#00ff88)', color:'#003320', boxShadow:'0 4px 20px rgba(0,255,136,.35)' }}>
                Start Organizing Free
                <ArrowRightIcon className="w-5 h-5" />
              </Link>
            </Reveal>
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════
          5. FEATURES
      ════════════════════════════════════════ */}
      <section className="relative z-10 py-12 px-5">
        <div className="mx-auto" style={{ maxWidth:460 }}>
          <Reveal className="text-center mb-8">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-black tracking-wider uppercase mb-3"
              style={{ background:'rgba(0,255,136,.08)', color:'#00ff88', border:'1px solid rgba(0,255,136,.18)' }}>
              ✦ Features
            </span>
            <h2 className="text-2xl font-black leading-tight">
              Everything you need.<br />
              <span style={{ color:'#00ff88' }}>Nothing you don't.</span>
            </h2>
            <p className="text-sm mt-2" style={{ color:'rgba(255,255,255,.45)' }}>For organizers, players, and umpires.</p>
          </Reveal>

          <div className="grid grid-cols-1 gap-3">
            {FEATURES.map((f, i) => (
              <Reveal key={i} delay={i * 0.07}>
                <div className="hp-card flex items-start gap-4 rounded-2xl p-4"
                  style={{ background:'rgba(255,255,255,.025)', border:'1px solid rgba(255,255,255,.07)' }}>
                  <div className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ background:f.bg, border:`1px solid ${f.color}25` }}>
                    <f.Icon className="w-5 h-5" style={{ color:f.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-black text-white mb-0.5">{f.title}</h3>
                    <p className="text-xs leading-relaxed mb-2" style={{ color:'rgba(255,255,255,.5)' }}>{f.desc}</p>
                    <span className="text-xs px-2.5 py-1 rounded-lg"
                      style={{ background:'rgba(255,255,255,.05)', color:'rgba(255,255,255,.38)', border:'1px solid rgba(255,255,255,.07)' }}>
                      {f.tag}
                    </span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          6. MOBILE EXPERIENCE SECTION
      ════════════════════════════════════════ */}
      <section className="relative z-10 py-12 px-5">
        <div className="mx-auto" style={{ maxWidth:460 }}>
          <Reveal>
            <div className="rounded-3xl overflow-hidden"
              style={{ background:'linear-gradient(135deg,rgba(99,102,241,.08),rgba(139,92,246,.08))', border:'1px solid rgba(99,102,241,.22)' }}>

              <div className="p-6 pb-0 text-center">
                <span className="inline-block px-4 py-1.5 rounded-full text-xs font-black tracking-wider uppercase mb-3"
                  style={{ background:'rgba(99,102,241,.1)', color:'#a78bfa', border:'1px solid rgba(99,102,241,.25)' }}>
                  📱 Works on Every Device
                </span>
                <h2 className="text-xl font-black text-white mb-2 leading-tight">
                  Score live from courtside.<br />
                  <span style={{ color:'#a78bfa' }}>Manage from anywhere.</span>
                </h2>
                <p className="text-sm mb-6" style={{ color:'rgba(255,255,255,.5)' }}>
                  Umpires score on their phone. Organizers manage on any screen. Players follow live on theirs.
                </p>
              </div>

              {/* Phone mockup */}
              <div className="flex justify-center px-6 pb-0">
                <div className="relative w-52" style={{ perspective:800 }}>
                  <div className="rounded-[2.2rem] overflow-hidden"
                    style={{ background:'#0d1025', border:'6px solid rgba(255,255,255,.1)', boxShadow:'0 30px 60px rgba(0,0,0,.6)' }}>
                    {/* Phone top notch */}
                    <div className="flex justify-center pt-3 pb-2" style={{ background:'#0a0a1f' }}>
                      <div className="w-20 h-5 rounded-full" style={{ background:'rgba(255,255,255,.06)' }} />
                    </div>
                    {/* Phone screen content */}
                    <div className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-white">Live Scoring</span>
                        <div className="flex items-center gap-1">
                          <div className="hp-dot" style={{ width:6, height:6 }} />
                          <span style={{ color:'#00ff88', fontSize:10, fontWeight:700 }}>LIVE</span>
                        </div>
                      </div>
                      {/* Big score display */}
                      <div className="rounded-xl p-3" style={{ background:'rgba(0,255,136,.07)', border:'1px solid rgba(0,255,136,.2)' }}>
                        <p style={{ color:'rgba(255,255,255,.5)', fontSize:9 }} className="mb-1.5 font-semibold">SET 2 · SEMIFINAL</p>
                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-xs font-black text-white">Rahul S.</p>
                            <p className="font-black" style={{ color:'#00ff88', fontSize:28, lineHeight:1 }}>19</p>
                          </div>
                          <div className="text-center pb-1">
                            <p style={{ color:'rgba(255,255,255,.2)', fontSize:11 }}>vs</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-black text-white">Arjun P.</p>
                            <p className="font-black" style={{ color:'rgba(255,255,255,.45)', fontSize:28, lineHeight:1 }}>16</p>
                          </div>
                        </div>
                      </div>
                      {/* +1 buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="py-2 rounded-xl text-center font-black text-xs"
                          style={{ background:'linear-gradient(135deg,#00c853,#00ff88)', color:'#003320' }}>
                          +1 Rahul
                        </div>
                        <div className="py-2 rounded-xl text-center font-black text-xs"
                          style={{ background:'rgba(255,255,255,.08)', color:'rgba(255,255,255,.7)' }}>
                          +1 Arjun
                        </div>
                      </div>
                      {/* Set history */}
                      <div className="rounded-xl p-2.5" style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.06)' }}>
                        <p style={{ color:'rgba(255,255,255,.35)', fontSize:9 }} className="font-semibold mb-1">SET HISTORY</p>
                        <div className="flex gap-2">
                          <span style={{ background:'rgba(0,255,136,.12)', color:'#00ff88', fontSize:10, fontWeight:700 }} className="px-2 py-0.5 rounded-lg">21–18</span>
                          <span style={{ color:'rgba(255,255,255,.4)', fontSize:10, fontWeight:600 }} className="px-2 py-0.5">ongoing...</span>
                        </div>
                      </div>
                    </div>
                    {/* Home indicator */}
                    <div className="flex justify-center py-2">
                      <div className="w-24 h-1 rounded-full" style={{ background:'rgba(255,255,255,.15)' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature bullets */}
              <div className="p-5 pt-5 grid grid-cols-1 gap-2.5">
                {[
                  { icon:'⚡', text:'Every point saved to DB in real time' },
                  { icon:'📊', text:'Spectators follow live without refreshing' },
                  { icon:'🔔', text:'Players notified instantly on results' },
                ].map((b, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl px-3.5 py-2.5"
                    style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.07)' }}>
                    <span className="text-base flex-shrink-0">{b.icon}</span>
                    <p className="text-xs font-semibold text-white">{b.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════════════════════════════════════════
          7. FOR ORGANIZERS SPOTLIGHT
      ════════════════════════════════════════ */}
      <section className="relative z-10 py-12 px-5">
        <div className="mx-auto" style={{ maxWidth:460 }}>
          <Reveal>
            <div className="rounded-3xl overflow-hidden"
              style={{ background:'rgba(245,158,11,.03)', border:'1px solid rgba(245,158,11,.2)' }}>
              <div className="p-6">
                <span className="inline-block px-4 py-1.5 rounded-full text-xs font-black tracking-wider uppercase mb-3"
                  style={{ background:'rgba(245,158,11,.1)', color:'#fbbf24', border:'1px solid rgba(245,158,11,.22)' }}>
                  🎪 For Tournament Organizers
                </span>
                <h2 className="text-xl font-black text-white leading-tight mb-2">
                  Professional results.<br />
                  <span style={{ color:'#fbbf24' }}>Professional tools.</span>
                </h2>
                <p className="text-sm mb-5" style={{ color:'rgba(255,255,255,.5)' }}>
                  Everything from registration to prize money — managed in one dashboard.
                </p>

                <div className="grid grid-cols-2 gap-2.5 mb-5">
                  {[
                    { icon:'🎲', title:'1-Click Draw',        desc:'Auto-seeded brackets instantly' },
                    { icon:'💳', title:'Payment Verify',      desc:'Review UPI screenshots in-app' },
                    { icon:'⚖️', title:'Umpire Assignment',  desc:'Assign umpires per match' },
                    { icon:'📊', title:'Live Dashboard',      desc:'All matches at a glance' },
                    { icon:'🔔', title:'Auto Notifications',  desc:'Players notified on draws' },
                    { icon:'💰', title:'Payout Tracking',     desc:'Transparent prize management' },
                  ].map((p, i) => (
                    <div key={i} className="hp-card flex items-start gap-2.5 p-3 rounded-xl"
                      style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)' }}>
                      <span className="text-lg flex-shrink-0">{p.icon}</span>
                      <div>
                        <p className="text-xs font-black text-white mb-0.5">{p.title}</p>
                        <p style={{ color:'rgba(255,255,255,.4)', fontSize:10 }}>{p.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Link to={user ? getDashboardLink() : '/register'}
                  className="hp-btn flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-black text-sm"
                  style={{ background:'linear-gradient(135deg,#f59e0b,#fb923c)', color:'#1a0600', boxShadow:'0 4px 20px rgba(245,158,11,.3)' }}>
                  Start Organizing
                  <ArrowRightIcon className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════════════════════════════════════════
          8. TESTIMONIALS
      ════════════════════════════════════════ */}
      <section className="relative z-10 py-12 px-5">
        <div className="mx-auto" style={{ maxWidth:460 }}>
          <Reveal className="text-center mb-8">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-black tracking-wider uppercase mb-3"
              style={{ background:'rgba(236,72,153,.08)', color:'#f472b6', border:'1px solid rgba(236,72,153,.2)' }}>
              💬 What They Say
            </span>
            <h2 className="text-2xl font-black leading-tight">
              Trusted by players<br />
              <span style={{ color:'#f472b6' }}>and organizers.</span>
            </h2>
          </Reveal>

          <div className="flex flex-col gap-3">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div className="hp-card rounded-2xl p-5"
                  style={{ background:'rgba(255,255,255,.025)', border:'1px solid rgba(255,255,255,.07)' }}>
                  <div className="flex gap-0.5 mb-3">
                    {[...Array(5)].map((_, j) => <StarIcon key={j} className="w-3.5 h-3.5 text-amber-400" />)}
                  </div>
                  <p className="text-sm leading-relaxed mb-4" style={{ color:'rgba(255,255,255,.75)' }}>"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm flex-shrink-0"
                      style={{ background:`linear-gradient(135deg,${t.badgeColor}22,${t.badgeColor}12)`, border:`1px solid ${t.badgeColor}30`, color:t.badgeColor }}>
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-black text-white">{t.name}</p>
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                          style={{ background:`${t.badgeColor}18`, color:t.badgeColor, border:`1px solid ${t.badgeColor}30`, whiteSpace:'nowrap', fontSize:10 }}>
                          {t.badge}
                        </span>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color:'rgba(255,255,255,.4)' }}>{t.role} · {t.city}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          9. FINAL CTA
      ════════════════════════════════════════ */}
      <section className="relative z-10 py-12 px-5 pb-16">
        <div className="mx-auto" style={{ maxWidth:460 }}>
          <Reveal>
            <div className="relative rounded-3xl overflow-hidden text-center p-8"
              style={{ background:'linear-gradient(135deg,rgba(0,212,255,.07),rgba(0,255,136,.07))', border:'1px solid rgba(0,212,255,.2)' }}>
              <div className="absolute inset-0 pointer-events-none"
                style={{ background:'radial-gradient(ellipse at 50% 0%,rgba(0,212,255,.1) 0%,transparent 65%)' }} aria-hidden />
              <div className="relative">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 text-3xl"
                  style={{ background:'linear-gradient(135deg,#0891b2,#00d4ff)', boxShadow:'0 8px 24px rgba(0,212,255,.3)' }}>
                  🏸
                </div>
                <h2 className="text-2xl font-black text-white mb-2 leading-tight">
                  Ready to run your<br />next tournament?
                </h2>
                <p className="text-sm mb-6" style={{ color:'rgba(255,255,255,.5)' }}>
                  Join 1,000+ players and organizers already on Matchify.
                </p>
                <div className="flex flex-col gap-3">
                  <Link to={user ? getDashboardLink() : '/register'}
                    className="hp-btn flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-base"
                    style={{ background:'linear-gradient(135deg,#00c853,#00ff88)', color:'#003320', boxShadow:'0 4px 24px rgba(0,255,136,.4)' }}>
                    {user ? 'Go to Dashboard' : 'Create Tournament Free'}
                    <ArrowRightIcon className="w-5 h-5" />
                  </Link>
                  {!user && (
                    <>
                      <Link to="/tournaments"
                        className="hp-btn flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm"
                        style={{ background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)', color:'rgba(255,255,255,.75)' }}>
                        Browse Tournaments — No Account Needed
                      </Link>
                      <p className="text-xs" style={{ color:'rgba(255,255,255,.35)' }}>
                        Already registered?{' '}
                        <Link to="/login" style={{ color:'#00ff88' }} className="font-semibold">Sign In →</Link>
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════ */}
      <footer className="relative z-10 border-t py-10 px-5"
        style={{ borderColor:'rgba(255,255,255,.07)', background:'rgba(0,0,0,.2)' }}>
        <div className="mx-auto flex flex-col items-center gap-5" style={{ maxWidth:460 }}>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="matchify.pro" className="h-8 w-auto"
              style={{ filter:'drop-shadow(0 0 8px rgba(0,255,136,.4))' }} />
            <span className="font-black text-lg">
              <span className="text-white">matchify</span>
              <span style={{ color:'#00ff88' }}>.pro</span>
            </span>
          </div>
          <p className="text-xs text-center" style={{ color:'rgba(255,255,255,.35)' }}>
            Built with ❤️ for the Indian Badminton Community
          </p>
          <div className="rounded-2xl px-5 py-4 border text-center w-full"
            style={{ background:'rgba(0,255,136,.03)', borderColor:'rgba(0,255,136,.1)' }}>
            <p className="text-xs tracking-wider uppercase mb-1.5" style={{ color:'rgba(255,255,255,.35)' }}>Co-Founded By</p>
            <p className="text-lg font-black mb-1.5" style={{ color:'#00ff88' }}>PS Brothers</p>
            <div className="flex justify-center items-center gap-3 text-sm font-semibold text-white">
              <span>PS Lochan</span>
              <span style={{ color:'rgba(255,255,255,.2)' }}>|</span>
              <span>PS Pradyumna</span>
            </div>
          </div>
          <div className="flex gap-5 text-sm flex-wrap justify-center" style={{ color:'rgba(255,255,255,.4)' }}>
            <Link to="/tournaments"  className="hover:text-white transition-colors">Tournaments</Link>
            <Link to="/leaderboard"  className="hover:text-white transition-colors">Rankings</Link>
            <Link to="/privacy"      className="hover:text-white transition-colors">Privacy</Link>
            <Link to="/terms"        className="hover:text-white transition-colors">Terms</Link>
          </div>
          <p className="text-xs" style={{ color:'rgba(255,255,255,.2)' }}>© 2026 Matchify.pro · All rights reserved</p>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
