import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { EyeIcon, EyeSlashIcon, EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { getErrorMessage } from '../utils/errorMessage';
import MatchifyLogo from '../components/MatchifyLogo';

const LoginPageMobile = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError('All fields are required');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const user = await login(formData.email, formData.password);
      
      if (redirectUrl) {
        navigate(redirectUrl);
        return;
      }
      
      const isAdmin = user.isAdmin || 
                     (Array.isArray(user.roles) && user.roles.includes('ADMIN')) ||
                     (typeof user.roles === 'string' && user.roles.includes('ADMIN')) ||
                     user.currentRole === 'ADMIN';
      
      if (isAdmin) {
        navigate('/admin-dashboard');
      } else {
        const primary = Array.isArray(user.roles) ? user.roles[0] : (user.currentRole || user.role || 'PLAYER');
        navigate(`/dashboard?role=${primary}`);
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Login failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ 
      background: 'linear-gradient(180deg, #0a0a1f 0%, #07071a 30%, #0d1a2a 60%, #07071a 100%)' 
    }}>
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Large Gradient Orbs */}
        <div 
          className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl opacity-30 animate-pulse"
          style={{ 
            background: 'radial-gradient(circle, rgba(0,200,83,0.4) 0%, rgba(0,255,136,0.2) 40%, transparent 70%)',
            animation: 'float 8s ease-in-out infinite'
          }}
        />
        <div 
          className="absolute bottom-1/4 left-0 w-72 h-72 rounded-full blur-3xl opacity-25 animate-pulse"
          style={{ 
            background: 'radial-gradient(circle, rgba(99,102,241,0.4) 0%, rgba(139,92,246,0.2) 40%, transparent 70%)',
            animation: 'float 10s ease-in-out infinite reverse',
            animationDelay: '2s'
          }}
        />
        <div 
          className="absolute top-1/2 right-1/4 w-64 h-64 rounded-full blur-3xl opacity-20 animate-pulse"
          style={{ 
            background: 'radial-gradient(circle, rgba(6,182,212,0.4) 0%, rgba(14,165,233,0.2) 40%, transparent 70%)',
            animation: 'float 12s ease-in-out infinite',
            animationDelay: '4s'
          }}
        />
        
        {/* Floating Particles */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${Math.random() * 6 + 2}px`,
              height: `${Math.random() * 6 + 2}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: ['#00c853', '#a855f7', '#06b6d4'][Math.floor(Math.random() * 3)],
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
      <div className="relative z-10 flex-1 flex flex-col max-w-md mx-auto w-full px-4 py-6">
        
        {/* Logo Section with Glow */}
        <div className="text-center mb-8 mt-4">
          <div className="flex justify-center mb-3 relative">
            <div 
              className="absolute inset-0 blur-2xl opacity-60"
              style={{ 
                background: 'radial-gradient(circle, rgba(0,200,83,0.6) 0%, transparent 70%)',
                animation: 'glow 3s ease-in-out infinite'
              }}
            />
            <div className="relative">
              <MatchifyLogo size={56} variant="full" />
            </div>
          </div>
          <p className="text-xs text-gray-300 font-medium">India's Premier Badminton Platform</p>
        </div>

        {/* Main Card with Enhanced Depth */}
        <div 
          className="rounded-2xl p-6 mb-6 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(0,200,83,0.12) 0%, rgba(99,102,241,0.12) 100%)',
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
            {/* Header */}
            <div className="text-center mb-6">
              <div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold mb-3 relative overflow-hidden"
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
                <span className="relative z-10">⚡ Ready to Play?</span>
              </div>
              <h1 
                className="text-4xl font-black mb-2"
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
                Welcome Back
              </h1>
              <p className="text-sm text-gray-300 font-medium">Sign in to continue your journey</p>
            </div>

          {/* Error Message */}
          {error && (
            <div 
              className="mb-5 p-3 rounded-lg text-sm"
              style={{ 
                background: 'rgba(239,68,68,0.1)', 
                border: '1px solid rgba(239,68,68,0.3)', 
                color: '#f87171' 
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Email Address
              </label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl text-white text-sm placeholder-gray-500 outline-none"
                  style={{ 
                    background: 'rgba(255,255,255,0.05)', 
                    border: '1px solid rgba(255,255,255,0.1)' 
                  }}
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Password
              </label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-12 py-3.5 rounded-xl text-white text-sm placeholder-gray-500 outline-none"
                  style={{ 
                    background: 'rgba(255,255,255,0.05)', 
                    border: '1px solid rgba(255,255,255,0.1)' 
                  }}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded" 
                  style={{ accentColor: '#00c853' }}
                />
                <span className="text-xs text-gray-400">Remember me</span>
              </label>
              <a href="#" className="text-xs font-semibold text-emerald-400">
                Forgot password?
              </a>
            </div>

            {/* Submit Button with Enhanced Glow */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-base transition-all disabled:opacity-50 relative overflow-hidden group"
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
              {loading ? (
                <span className="flex items-center justify-center gap-2 relative z-10">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2 relative z-10" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
                  ⚡ Let's Go!
                </span>
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)' }}/>
              <span className="text-xs text-gray-400 font-medium">or</span>
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)' }}/>
            </div>
            <p className="text-sm text-gray-300">
              Don't have an account?{' '}
              <Link 
                to={redirectUrl ? `/register?redirect=${encodeURIComponent(redirectUrl)}` : '/register'}
                className="font-bold"
                style={{ 
                  background: 'linear-gradient(135deg, #00c853, #00ff88)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                Create one free →
              </Link>
            </p>
          </div>
          </div>
        </div>

        {/* Stats with Vibrant Colors */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div 
            className="p-4 rounded-xl text-center relative overflow-hidden"
            style={{ 
              background: 'linear-gradient(135deg, rgba(0,200,83,0.2), rgba(0,255,136,0.15))',
              border: '2px solid rgba(0,200,83,0.4)',
              boxShadow: '0 4px 15px rgba(0,200,83,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
            }}
          >
            <p className="text-2xl font-black mb-1" style={{ color: '#00ff88', textShadow: '0 0 20px rgba(0,200,83,0.5)' }}>1000+</p>
            <p className="text-xs font-semibold text-white/80">Players</p>
          </div>
          <div 
            className="p-4 rounded-xl text-center relative overflow-hidden"
            style={{ 
              background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(251,146,60,0.15))',
              border: '2px solid rgba(245,158,11,0.4)',
              boxShadow: '0 4px 15px rgba(245,158,11,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
            }}
          >
            <p className="text-2xl font-black mb-1" style={{ color: '#fbbf24', textShadow: '0 0 20px rgba(245,158,11,0.5)' }}>50+</p>
            <p className="text-xs font-semibold text-white/80">Tournaments</p>
          </div>
          <div 
            className="p-4 rounded-xl text-center relative overflow-hidden"
            style={{ 
              background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(14,165,233,0.15))',
              border: '2px solid rgba(6,182,212,0.4)',
              boxShadow: '0 4px 15px rgba(6,182,212,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
            }}
          >
            <p className="text-2xl font-black mb-1" style={{ color: '#22d3ee', textShadow: '0 0 20px rgba(6,182,212,0.5)' }}>25+</p>
            <p className="text-xs font-semibold text-white/80">Cities</p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs font-medium mt-auto" style={{ 
          background: 'linear-gradient(135deg, #ffffff, #00ff88, #ffffff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          🏆 Where Champions Are Made
        </p>
      </div>
    </div>
  );
};

export default LoginPageMobile;
