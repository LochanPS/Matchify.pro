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
  FireIcon,
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';

const HomePageMobile = () => {
  const { user } = useAuth();

  const getDashboardLink = () => {
    if (!user) return '/login';
    const isAdmin = user.isAdmin || 
                   (Array.isArray(user.roles) && user.roles.includes('ADMIN')) ||
                   (typeof user.roles === 'string' && user.roles.includes('ADMIN')) ||
                   user.currentRole === 'ADMIN';
    
    if (isAdmin) return '/admin-dashboard';
    
    const primary = Array.isArray(user.roles) ? user.roles[0] : (user.currentRole || user.role || 'PLAYER');
    return `/dashboard?role=${primary}`;
  };

  const features = [
    { icon: TrophyIcon, title: 'Tournaments', desc: 'Join & compete', color: 'from-amber-500 to-orange-500' },
    { icon: UserGroupIcon, title: 'Find Partners', desc: 'Connect instantly', color: 'from-cyan-500 to-blue-500' },
    { icon: ChartBarIcon, title: 'Live Rankings', desc: 'Track progress', color: 'from-violet-500 to-purple-600' },
    { icon: SparklesIcon, title: 'Live Scoring', desc: 'Real-time updates', color: 'from-green-500 to-emerald-500' },
  ];

  const stats = [
    { value: '1000+', label: 'Players', icon: '🏸' },
    { value: '50+', label: 'Tournaments', icon: '🏆' },
    { value: '25+', label: 'Cities', icon: '📍' },
    { value: '₹10L+', label: 'Prize Pool', icon: '💰' },
  ];

  const benefits = [
    { icon: BoltIcon, text: 'Instant Registration', color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { icon: ShieldCheckIcon, text: 'Secure Payments', color: 'text-green-400', bg: 'bg-green-400/10' },
    { icon: TrophyIcon, text: 'Fair Play System', color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
    { icon: ChartBarIcon, text: 'Track Performance', color: 'text-violet-400', bg: 'bg-violet-400/10' },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#07071a' }}>
      {/* Mobile-optimized container */}
      <div className="max-w-md mx-auto px-4 py-6">
        
        {/* Hero Section */}
        <div className="text-center mb-8">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <MatchifyLogo size={64} variant="full" />
          </div>
          
          {/* Badge */}
          <div 
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-4"
            style={{ 
              background: 'rgba(0,200,83,0.1)', 
              border: '1px solid rgba(0,200,83,0.3)', 
              color: '#00c853' 
            }}
          >
            <FireIcon className="w-4 h-4" />
            India's #1 Badminton Platform
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl font-black text-white mb-3 leading-tight">
            Where Champions
            <br />
            <span style={{ color: '#00c853' }}>Are Made</span>
          </h1>

          {/* Tagline */}
          <p className="text-sm text-gray-400 mb-2 px-4">
            Join <span className="font-bold text-emerald-400">10,000+</span> players across India
          </p>
          <p className="text-sm text-gray-400 mb-6 px-4">
            Register for tournaments, track progress, compete with the best
          </p>

          {/* Social Proof */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="flex -space-x-2">
              {['R','P','A','K'].map((letter, i) => (
                <div 
                  key={i}
                  className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold"
                  style={{ 
                    background: 'linear-gradient(135deg,#00c853,#00ff88)', 
                    borderColor: '#07071a', 
                    color: '#003320' 
                  }}
                >
                  {letter}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => <StarIcon key={i} className="w-4 h-4 text-amber-400" />)}
              <span className="text-xs font-medium text-gray-400 ml-1">4.9/5</span>
            </div>
          </div>

          {/* CTA Buttons */}
          {user ? (
            <div className="space-y-3 mb-8">
              <Link 
                to={getDashboardLink()}
                className="flex items-center justify-center gap-2 w-full py-4 rounded-xl font-bold text-base transition-all"
                style={{ 
                  background: 'linear-gradient(135deg, #00c853, #00ff88)', 
                  color: '#003320',
                  boxShadow: '0 4px 15px rgba(0,200,83,0.3)'
                }}
              >
                <PlayIcon className="w-5 h-5" />
                Go to Dashboard
                <ArrowRightIcon className="w-5 h-5" />
              </Link>
              
              <div 
                className="flex items-center gap-3 px-4 py-4 rounded-xl border"
                style={{ 
                  background: 'rgba(255,255,255,0.04)', 
                  borderColor: 'rgba(255,255,255,0.1)' 
                }}
              >
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-base flex-shrink-0"
                  style={{ 
                    background: 'linear-gradient(135deg,#00c853,#00ff88)', 
                    color: '#003320' 
                  }}
                >
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="text-xs text-gray-500">Welcome back</p>
                  <p className="text-base font-semibold text-white">{user.name}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 mb-8">
              <Link 
                to="/register"
                className="flex items-center justify-center gap-2 w-full py-4 rounded-xl font-bold text-base transition-all"
                style={{ 
                  background: 'linear-gradient(135deg, #00c853, #00ff88)', 
                  color: '#003320',
                  boxShadow: '0 4px 15px rgba(0,200,83,0.3)'
                }}
              >
                <PlayIcon className="w-5 h-5" />
                Get Started Free
                <ArrowRightIcon className="w-5 h-5" />
              </Link>
              
              <Link 
                to="/login"
                className="flex items-center justify-center gap-2 w-full py-4 rounded-xl font-semibold text-base border transition-all"
                style={{ 
                  background: 'rgba(255,255,255,0.04)', 
                  borderColor: 'rgba(255,255,255,0.15)', 
                  color: 'rgba(255,255,255,0.9)' 
                }}
              >
                Sign In
              </Link>
            </div>
          )}
        </div>

        {/* Stats Section */}
        <div 
          className="rounded-2xl p-5 mb-6"
          style={{
            background: 'rgba(13,26,42,0.8)',
            border: '1px solid rgba(0,200,83,0.2)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div className="text-center mb-4">
            <h2 className="text-lg font-bold text-white mb-1">Our Community</h2>
            <p className="text-xs text-gray-400">Growing every day</p>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {stats.map((s, i) => (
              <div 
                key={i}
                className="p-4 rounded-xl text-center"
                style={{ 
                  background: 'rgba(0,200,83,0.05)', 
                  border: '1px solid rgba(0,200,83,0.1)' 
                }}
              >
                <div className="text-2xl mb-1">{s.icon}</div>
                <p className="text-2xl font-black text-emerald-400 mb-1">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Features Section */}
        <div 
          className="rounded-2xl p-5 mb-6"
          style={{
            background: 'rgba(13,26,42,0.8)',
            border: '1px solid rgba(0,200,83,0.2)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div className="text-center mb-5">
            <div 
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-3"
              style={{ 
                background: 'rgba(0,200,83,0.1)', 
                border: '1px solid rgba(0,200,83,0.3)', 
                color: '#00c853' 
              }}
            >
              ✦ Features
            </div>
            <h2 className="text-xl font-bold text-white mb-1">Everything You Need</h2>
            <p className="text-xs text-gray-400">Built for competitive players</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {features.map((f, i) => (
              <div 
                key={i}
                className="p-4 rounded-xl"
                style={{ 
                  background: 'rgba(255,255,255,0.03)', 
                  border: '1px solid rgba(255,255,255,0.08)' 
                }}
              >
                <div 
                  className={`inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br ${f.color} rounded-lg mb-3`}
                >
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">{f.title}</h3>
                <p className="text-xs text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Why Matchify Section */}
        <div 
          className="rounded-2xl p-5 mb-6"
          style={{
            background: 'rgba(13,26,42,0.8)',
            border: '1px solid rgba(0,200,83,0.2)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div className="text-center mb-5">
            <h2 className="text-xl font-bold text-white mb-1">
              Why <span style={{ color: '#00c853' }}>Matchify.pro</span>?
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {benefits.map((b, i) => (
              <div 
                key={i}
                className="flex items-center gap-2 p-3 rounded-xl"
                style={{ 
                  background: 'rgba(255,255,255,0.03)', 
                  border: '1px solid rgba(255,255,255,0.07)' 
                }}
              >
                <div className={`flex-shrink-0 w-8 h-8 ${b.bg} ${b.color} rounded-lg flex items-center justify-center`}>
                  <b.icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-white leading-tight">{b.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div 
          className="rounded-2xl p-5 mb-6"
          style={{
            background: 'rgba(13,26,42,0.8)',
            border: '1px solid rgba(0,200,83,0.2)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div className="text-center mb-5">
            <div 
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-3"
              style={{ 
                background: 'rgba(99,102,241,0.12)', 
                border: '1px solid rgba(99,102,241,0.25)', 
                color: '#818cf8' 
              }}
            >
              🎯 Process
            </div>
            <h2 className="text-xl font-bold text-white mb-1">How It Works</h2>
          </div>

          <div className="space-y-3">
            {[
              { step: '01', title: 'Create Account', desc: 'Sign up in seconds', icon: '👤' },
              { step: '02', title: 'Find Tournament', desc: 'Browse by city & level', icon: '🔍' },
              { step: '03', title: 'Register & Pay', desc: 'Secure UPI payment', icon: '💳' },
              { step: '04', title: 'Play & Win', desc: 'Compete & climb rankings', icon: '🏆' },
            ].map((s, i) => (
              <div 
                key={i}
                className="flex items-center gap-4 p-4 rounded-xl"
                style={{ 
                  background: 'rgba(255,255,255,0.03)', 
                  border: '1px solid rgba(255,255,255,0.08)' 
                }}
              >
                <div 
                  className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center text-white text-xs font-black"
                >
                  {s.step}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{s.icon}</span>
                    <h3 className="text-sm font-bold text-white">{s.title}</h3>
                  </div>
                  <p className="text-xs text-gray-500">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div 
          className="rounded-2xl p-5 mb-6"
          style={{
            background: 'rgba(13,26,42,0.8)',
            border: '1px solid rgba(0,200,83,0.2)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div className="text-center mb-5">
            <div 
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-3"
              style={{ 
                background: 'rgba(6,182,212,0.1)', 
                border: '1px solid rgba(6,182,212,0.25)', 
                color: '#22d3ee' 
              }}
            >
              💬 Players Say
            </div>
            <h2 className="text-xl font-bold text-white">Real Reviews</h2>
          </div>

          <div className="space-y-4">
            {[
              { name: 'Rahul Sharma', role: 'State Level Player', city: 'Bangalore', emoji: '👨', text: 'Matchify made tournament registration effortless!' },
              { name: 'Priya Patel', role: 'Club Player', city: 'Mumbai', emoji: '👩', text: 'Found amazing doubles partners through this platform!' },
            ].map((t, i) => (
              <div 
                key={i}
                className="p-4 rounded-xl"
                style={{ 
                  background: 'rgba(255,255,255,0.03)', 
                  border: '1px solid rgba(255,255,255,0.07)' 
                }}
              >
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, j) => <StarIcon key={j} className="w-4 h-4 text-amber-400" />)}
                </div>
                <p className="text-sm text-gray-300 mb-4">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                    style={{ 
                      background: 'rgba(6,182,212,0.15)', 
                      border: '1px solid rgba(6,182,212,0.3)' 
                    }}
                  >
                    {t.emoji}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role} · {t.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div 
          className="rounded-2xl p-6 mb-6 text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(0,200,83,0.1) 0%, rgba(99,102,241,0.1) 100%)',
            border: '1px solid rgba(0,200,83,0.2)',
          }}
        >
          <div className="text-3xl mb-3">🚀</div>
          <h2 className="text-2xl font-black text-white mb-2">Ready to Start?</h2>
          <p className="text-sm text-gray-400 mb-5">
            Join India's fastest-growing badminton community
          </p>
          
          <div className="space-y-3">
            <Link 
              to={user ? getDashboardLink() : '/register'}
              className="flex items-center justify-center gap-2 w-full py-4 rounded-xl font-bold text-base transition-all"
              style={{ 
                background: 'linear-gradient(135deg, #00c853, #00ff88)', 
                color: '#003320',
                boxShadow: '0 4px 15px rgba(0,200,83,0.3)'
              }}
            >
              {user ? 'Go to Dashboard' : 'Create Free Account'}
              <ArrowRightIcon className="w-5 h-5" />
            </Link>
            
            <Link 
              to="/tournaments"
              className="flex items-center justify-center gap-2 w-full py-4 rounded-xl font-semibold text-base border transition-all"
              style={{ 
                background: 'rgba(255,255,255,0.04)', 
                borderColor: 'rgba(255,255,255,0.15)', 
                color: 'rgba(255,255,255,0.9)' 
              }}
            >
              Browse Tournaments
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center space-y-4 pb-6">
          {/* Founders */}
          <div 
            className="rounded-2xl px-5 py-4 border"
            style={{ 
              background: 'rgba(0,200,83,0.04)', 
              borderColor: 'rgba(0,200,83,0.12)' 
            }}
          >
            <p className="text-xs tracking-wider uppercase mb-2 text-gray-500">Co-Founded By</p>
            <p className="text-lg font-black mb-2 text-emerald-400">PS Brothers</p>
            <div className="flex justify-center items-center gap-3 text-sm font-semibold text-white">
              <span>PS Lochan</span>
              <span className="text-gray-600">|</span>
              <span>PS Pradyumna</span>
            </div>
          </div>

          {/* Links */}
          <div className="flex justify-center gap-5 text-sm text-gray-500">
            <a href="#" className="hover:text-white transition-colors">About</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
            <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>

          {/* Copyright */}
          <p className="text-xs text-gray-600">
            © 2026 Matchify.pro · All rights reserved
          </p>
          
          <p className="text-xs text-gray-500">
            🏆 Built with ❤️ for Indian Badminton
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePageMobile;
