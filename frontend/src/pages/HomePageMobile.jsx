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
    <div className="min-h-screen relative overflow-hidden" style={{ 
      background: 'linear-gradient(180deg, #0a0a1f 0%, #07071a 30%, #0d1a2a 60%, #07071a 100%)' 
    }}>
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Large Gradient Orbs */}
        <div 
          className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-30 animate-pulse"
          style={{ 
            background: 'radial-gradient(circle, rgba(0,200,83,0.4) 0%, rgba(0,255,136,0.2) 40%, transparent 70%)',
            animation: 'float 8s ease-in-out infinite'
          }}
        />
        <div 
          className="absolute top-1/4 left-0 w-80 h-80 rounded-full blur-3xl opacity-25 animate-pulse"
          style={{ 
            background: 'radial-gradient(circle, rgba(99,102,241,0.4) 0%, rgba(139,92,246,0.2) 40%, transparent 70%)',
            animation: 'float 10s ease-in-out infinite reverse',
            animationDelay: '2s'
          }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full blur-3xl opacity-20 animate-pulse"
          style={{ 
            background: 'radial-gradient(circle, rgba(6,182,212,0.4) 0%, rgba(14,165,233,0.2) 40%, transparent 70%)',
            animation: 'float 12s ease-in-out infinite',
            animationDelay: '4s'
          }}
        />
        <div 
          className="absolute top-1/2 right-1/3 w-64 h-64 rounded-full blur-3xl opacity-15 animate-pulse"
          style={{ 
            background: 'radial-gradient(circle, rgba(245,158,11,0.4) 0%, rgba(251,146,60,0.2) 40%, transparent 70%)',
            animation: 'float 9s ease-in-out infinite reverse',
            animationDelay: '1s'
          }}
        />
        
        {/* Floating Particles */}
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${Math.random() * 6 + 2}px`,
              height: `${Math.random() * 6 + 2}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: ['#00c853', '#a855f7', '#06b6d4', '#f59e0b'][Math.floor(Math.random() * 4)],
              opacity: Math.random() * 0.5 + 0.2,
              animation: `float ${Math.random() * 10 + 5}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
              boxShadow: `0 0 ${Math.random() * 20 + 10}px currentColor`
            }}
          />
        ))}
      </div>

      {/* Add keyframes for animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -20px) scale(1.05); }
          50% { transform: translate(-15px, 15px) scale(0.95); }
          75% { transform: translate(15px, 10px) scale(1.02); }
        }
        @keyframes glow {
          0%, 100% { opacity: 0.5; filter: brightness(1); }
          50% { opacity: 1; filter: brightness(1.3); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>

      {/* Mobile-optimized container */}
      <div className="relative z-10 max-w-md mx-auto px-4 py-6">
        
        {/* Hero Section */}
        <div className="text-center mb-8">
          {/* Logo with Glow */}
          <div className="flex justify-center mb-4 relative">
            <div 
              className="absolute inset-0 blur-2xl opacity-60"
              style={{ 
                background: 'radial-gradient(circle, rgba(0,200,83,0.6) 0%, transparent 70%)',
                animation: 'glow 3s ease-in-out infinite'
              }}
            />
            <div className="relative">
              <MatchifyLogo size={64} variant="full" />
            </div>
          </div>
          
          {/* Badge with Gradient */}
          <div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold mb-4 relative overflow-hidden"
            style={{ 
              background: 'linear-gradient(135deg, rgba(0,200,83,0.2), rgba(0,255,136,0.15))', 
              border: '2px solid rgba(0,200,83,0.5)', 
              color: '#00ff88',
              boxShadow: '0 0 20px rgba(0,200,83,0.3), inset 0 0 20px rgba(0,200,83,0.1)'
            }}
          >
            <div 
              className="absolute inset-0 opacity-30"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 3s infinite'
              }}
            />
            <FireIcon className="w-4 h-4 relative z-10" style={{ filter: 'drop-shadow(0 0 4px currentColor)' }} />
            <span className="relative z-10">India's #1 Badminton Platform</span>
          </div>

          {/* Main Heading with Gradient Text */}
          <h1 className="text-5xl font-black mb-3 leading-tight relative">
            <span 
              className="block text-white"
              style={{ 
                textShadow: '0 0 30px rgba(255,255,255,0.3), 0 0 60px rgba(0,200,83,0.2)'
              }}
            >
              Where Champions
            </span>
            <span 
              className="block mt-1"
              style={{ 
                background: 'linear-gradient(135deg, #00c853 0%, #00ff88 50%, #00c853 100%)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                animation: 'shimmer 4s linear infinite',
                textShadow: 'none',
                filter: 'drop-shadow(0 0 20px rgba(0,200,83,0.5))'
              }}
            >
              Are Made
            </span>
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

          {/* CTA Buttons with Enhanced Depth */}
          {user ? (
            <div className="space-y-3 mb-8">
              <Link 
                to={getDashboardLink()}
                className="flex items-center justify-center gap-2 w-full py-4 rounded-xl font-bold text-base transition-all relative overflow-hidden group"
                style={{ 
                  background: 'linear-gradient(135deg, #00c853 0%, #00ff88 50%, #00c853 100%)',
                  backgroundSize: '200% auto',
                  color: '#003320',
                  boxShadow: '0 8px 25px rgba(0,200,83,0.4), 0 0 40px rgba(0,200,83,0.2), inset 0 1px 0 rgba(255,255,255,0.3)',
                  animation: 'shimmer 3s linear infinite'
                }}
              >
                <div 
                  className="absolute inset-0 opacity-0 group-active:opacity-100 transition-opacity"
                  style={{ background: 'radial-gradient(circle at center, rgba(255,255,255,0.3), transparent)' }}
                />
                <PlayIcon className="w-5 h-5 relative z-10" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
                <span className="relative z-10">Go to Dashboard</span>
                <ArrowRightIcon className="w-5 h-5 relative z-10" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
              </Link>
              
              <div 
                className="flex items-center gap-3 px-4 py-4 rounded-xl border relative overflow-hidden"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(0,200,83,0.1), rgba(99,102,241,0.1))', 
                  borderColor: 'rgba(0,200,83,0.3)',
                  boxShadow: '0 4px 15px rgba(0,200,83,0.1), inset 0 1px 0 rgba(255,255,255,0.1)'
                }}
              >
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-base flex-shrink-0 relative"
                  style={{ 
                    background: 'linear-gradient(135deg,#00c853,#00ff88)', 
                    color: '#003320',
                    boxShadow: '0 4px 12px rgba(0,200,83,0.4), inset 0 1px 0 rgba(255,255,255,0.3)'
                  }}
                >
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="text-xs text-gray-400">Welcome back</p>
                  <p className="text-base font-semibold text-white">{user.name}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 mb-8">
              <Link 
                to="/register"
                className="flex items-center justify-center gap-2 w-full py-4 rounded-xl font-bold text-base transition-all relative overflow-hidden group"
                style={{ 
                  background: 'linear-gradient(135deg, #00c853 0%, #00ff88 50%, #00c853 100%)',
                  backgroundSize: '200% auto',
                  color: '#003320',
                  boxShadow: '0 8px 25px rgba(0,200,83,0.4), 0 0 40px rgba(0,200,83,0.2), inset 0 1px 0 rgba(255,255,255,0.3)',
                  animation: 'shimmer 3s linear infinite'
                }}
              >
                <div 
                  className="absolute inset-0 opacity-0 group-active:opacity-100 transition-opacity"
                  style={{ background: 'radial-gradient(circle at center, rgba(255,255,255,0.3), transparent)' }}
                />
                <PlayIcon className="w-5 h-5 relative z-10" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
                <span className="relative z-10">Get Started Free</span>
                <ArrowRightIcon className="w-5 h-5 relative z-10" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
              </Link>
              
              <Link 
                to="/login"
                className="flex items-center justify-center gap-2 w-full py-4 rounded-xl font-semibold text-base border transition-all relative overflow-hidden"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))', 
                  borderColor: 'rgba(99,102,241,0.4)', 
                  color: 'rgba(255,255,255,0.95)',
                  boxShadow: '0 4px 15px rgba(99,102,241,0.2), inset 0 1px 0 rgba(255,255,255,0.1)'
                }}
              >
                <span className="relative z-10">Sign In</span>
              </Link>
            </div>
          )}
        </div>

        {/* Stats Section with Colorful Gradients */}
        <div 
          className="rounded-2xl p-6 mb-6 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(0,200,83,0.15) 0%, rgba(99,102,241,0.15) 100%)',
            border: '2px solid rgba(0,200,83,0.3)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0,200,83,0.2), inset 0 1px 0 rgba(255,255,255,0.1)'
          }}
        >
          {/* Animated Background Glow */}
          <div 
            className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-30"
            style={{ 
              background: 'radial-gradient(circle, rgba(0,255,136,0.6), transparent)',
              animation: 'glow 4s ease-in-out infinite'
            }}
          />
          <div 
            className="absolute bottom-0 left-0 w-32 h-32 rounded-full blur-3xl opacity-30"
            style={{ 
              background: 'radial-gradient(circle, rgba(99,102,241,0.6), transparent)',
              animation: 'glow 4s ease-in-out infinite reverse'
            }}
          />
          
          <div className="relative z-10">
            <div className="text-center mb-5">
              <h2 className="text-xl font-black text-white mb-1" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
                Our Community
              </h2>
              <p className="text-xs text-gray-300">Growing every day</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {stats.map((s, i) => {
                const colors = [
                  { bg: 'linear-gradient(135deg, rgba(0,200,83,0.2), rgba(0,255,136,0.15))', border: 'rgba(0,200,83,0.4)', shadow: 'rgba(0,200,83,0.3)', text: '#00ff88' },
                  { bg: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(251,146,60,0.15))', border: 'rgba(245,158,11,0.4)', shadow: 'rgba(245,158,11,0.3)', text: '#fbbf24' },
                  { bg: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))', border: 'rgba(99,102,241,0.4)', shadow: 'rgba(99,102,241,0.3)', text: '#a78bfa' },
                  { bg: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(14,165,233,0.15))', border: 'rgba(6,182,212,0.4)', shadow: 'rgba(6,182,212,0.3)', text: '#22d3ee' }
                ];
                const color = colors[i];
                
                return (
                  <div 
                    key={i}
                    className="p-4 rounded-xl text-center relative overflow-hidden"
                    style={{ 
                      background: color.bg,
                      border: `2px solid ${color.border}`,
                      boxShadow: `0 4px 15px ${color.shadow}, inset 0 1px 0 rgba(255,255,255,0.1)`
                    }}
                  >
                    <div className="text-3xl mb-2" style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }}>{s.icon}</div>
                    <p className="text-3xl font-black mb-1" style={{ color: color.text, textShadow: `0 0 20px ${color.shadow}` }}>
                      {s.value}
                    </p>
                    <p className="text-xs font-semibold text-white/80">{s.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Features Section with Vibrant Colors */}
        <div 
          className="rounded-2xl p-6 mb-6 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.15) 100%)',
            border: '2px solid rgba(99,102,241,0.3)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(99,102,241,0.2), inset 0 1px 0 rgba(255,255,255,0.1)'
          }}
        >
          {/* Animated Glow */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl opacity-20"
            style={{ 
              background: 'radial-gradient(circle, rgba(139,92,246,0.8), transparent)',
              animation: 'glow 5s ease-in-out infinite'
            }}
          />
          
          <div className="relative z-10">
            <div className="text-center mb-5">
              <div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold mb-3 relative overflow-hidden"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(168,85,247,0.2))', 
                  border: '2px solid rgba(139,92,246,0.5)', 
                  color: '#c4b5fd',
                  boxShadow: '0 0 20px rgba(139,92,246,0.3)'
                }}
              >
                <div 
                  className="absolute inset-0 opacity-30"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 3s infinite'
                  }}
                />
                <span className="relative z-10">✦ Features</span>
              </div>
              <h2 className="text-xl font-black text-white mb-1" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
                Everything You Need
              </h2>
              <p className="text-xs text-gray-300">Built for competitive players</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {features.map((f, i) => {
                const colorSchemes = [
                  { gradient: 'from-amber-500 to-orange-600', bg: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(251,146,60,0.15))', border: 'rgba(245,158,11,0.4)', shadow: 'rgba(245,158,11,0.3)' },
                  { gradient: 'from-cyan-500 to-blue-600', bg: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(37,99,235,0.15))', border: 'rgba(6,182,212,0.4)', shadow: 'rgba(6,182,212,0.3)' },
                  { gradient: 'from-violet-500 to-purple-600', bg: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(168,85,247,0.15))', border: 'rgba(139,92,246,0.4)', shadow: 'rgba(139,92,246,0.3)' },
                  { gradient: 'from-green-500 to-emerald-600', bg: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.15))', border: 'rgba(16,185,129,0.4)', shadow: 'rgba(16,185,129,0.3)' }
                ];
                const scheme = colorSchemes[i];
                
                return (
                  <div 
                    key={i}
                    className="p-4 rounded-xl relative overflow-hidden"
                    style={{ 
                      background: scheme.bg,
                      border: `2px solid ${scheme.border}`,
                      boxShadow: `0 4px 15px ${scheme.shadow}, inset 0 1px 0 rgba(255,255,255,0.1)`
                    }}
                  >
                    <div 
                      className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br ${scheme.gradient} rounded-xl mb-3 relative`}
                      style={{ 
                        boxShadow: `0 4px 12px ${scheme.shadow}, inset 0 1px 0 rgba(255,255,255,0.3)`
                      }}
                    >
                      <f.icon className="w-6 h-6 text-white" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
                    </div>
                    <h3 className="text-sm font-bold text-white mb-1">{f.title}</h3>
                    <p className="text-xs text-gray-300">{f.desc}</p>
                  </div>
                );
              })}
            </div>
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

        {/* Final CTA with Rainbow Gradient */}
        <div 
          className="rounded-2xl p-6 mb-6 text-center relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(0,200,83,0.2) 0%, rgba(99,102,241,0.2) 50%, rgba(245,158,11,0.2) 100%)',
            border: '2px solid rgba(0,200,83,0.4)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0,200,83,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
          }}
        >
          {/* Animated Rainbow Glow */}
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              background: 'linear-gradient(45deg, rgba(0,200,83,0.3), rgba(99,102,241,0.3), rgba(245,158,11,0.3), rgba(6,182,212,0.3))',
              backgroundSize: '400% 400%',
              animation: 'shimmer 8s ease infinite'
            }}
          />
          
          <div className="relative z-10">
            <div 
              className="text-5xl mb-4 inline-block"
              style={{ 
                filter: 'drop-shadow(0 0 20px rgba(0,200,83,0.6))',
                animation: 'float 3s ease-in-out infinite'
              }}
            >
              🚀
            </div>
            <h2 
              className="text-3xl font-black mb-3"
              style={{ 
                background: 'linear-gradient(135deg, #ffffff 0%, #00ff88 50%, #ffffff 100%)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                animation: 'shimmer 4s linear infinite',
                textShadow: 'none',
                filter: 'drop-shadow(0 2px 10px rgba(0,200,83,0.3))'
              }}
            >
              Ready to Start?
            </h2>
            <p className="text-sm text-gray-200 mb-6 font-medium">
              Join India's fastest-growing badminton community
            </p>
            
            <div className="space-y-3">
              <Link 
                to={user ? getDashboardLink() : '/register'}
                className="flex items-center justify-center gap-2 w-full py-4 rounded-xl font-bold text-base transition-all relative overflow-hidden group"
                style={{ 
                  background: 'linear-gradient(135deg, #00c853 0%, #00ff88 50%, #00c853 100%)',
                  backgroundSize: '200% auto',
                  color: '#003320',
                  boxShadow: '0 8px 25px rgba(0,200,83,0.5), 0 0 40px rgba(0,200,83,0.3), inset 0 1px 0 rgba(255,255,255,0.3)',
                  animation: 'shimmer 3s linear infinite'
                }}
              >
                <div 
                  className="absolute inset-0 opacity-0 group-active:opacity-100 transition-opacity"
                  style={{ background: 'radial-gradient(circle at center, rgba(255,255,255,0.3), transparent)' }}
                />
                <span className="relative z-10">{user ? 'Go to Dashboard' : 'Create Free Account'}</span>
                <ArrowRightIcon className="w-5 h-5 relative z-10" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
              </Link>
              
              <Link 
                to="/tournaments"
                className="flex items-center justify-center gap-2 w-full py-4 rounded-xl font-semibold text-base border transition-all relative overflow-hidden"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))', 
                  borderColor: 'rgba(99,102,241,0.5)', 
                  color: 'rgba(255,255,255,0.95)',
                  boxShadow: '0 4px 15px rgba(99,102,241,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
                }}
              >
                <span className="relative z-10">Browse Tournaments</span>
              </Link>
            </div>
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
