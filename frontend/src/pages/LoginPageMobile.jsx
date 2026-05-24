import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { EyeIcon, EyeSlashIcon, PhoneIcon, LockClosedIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { getErrorMessage } from '../utils/errorMessage';
import MatchifyLogo from '../components/MatchifyLogo';

// Pre-generated particle data — deterministic, no Math.random in render
const LOGIN_M_PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  w: (i * 7 + 1) % 2 + 1,
  h: (i * 11 + 1) % 2 + 1,
  x: (i * 37 + 11) % 97,
  y: (i * 53 + 7) % 91,
  c: ["#06b6d4", "#00d4ff", "rgba(255,255,255,0.9)"][i % 3],
  o: ((i * 13) % 50) / 100 + 0.2,
  dur: (i * 7) % 4 + 3,
  delay: (i * 3) % 4,
  glow: (i * 11) % 15 + 5,
}));


const LoginPageMobile = () => {
  const [loginType, setLoginType] = useState('phone'); // 'phone' or 'email'
  const [formData, setFormData] = useState({ credential: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  const handleChange = (e) => {
    let value = e.target.value;
    // Phone field: digits only, max 10
    if (e.target.name === 'credential' && loginType === 'phone') {
      value = value.replace(/\D/g, '').slice(0, 10);
    }
    setFormData({ ...formData, [e.target.name]: value });
    setError('');
  };

  const handleLoginTypeChange = (type) => {
    setLoginType(type);
    setFormData({ credential: '', password: formData.password }); // Clear credential when switching
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.credential || !formData.password) {
      setError(`${loginType === 'phone' ? 'Phone number' : 'Email'} and password are required`);
      return;
    }
    
    // Validate based on login type
    if (loginType === 'phone') {
      const isValidPhone = /^[0-9]{10}$/.test(formData.credential);
      if (!isValidPhone) {
        setError('Please enter a valid 10-digit phone number');
        return;
      }
    } else {
      const isValidEmail = formData.credential.includes('@');
      if (!isValidEmail) {
        setError('Please enter a valid email address');
        return;
      }
    }
    
    setLoading(true);
    setError('');
    
    try {
      const user = await login(formData.credential, formData.password);
      
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
      background: '#07071a'
    }}>
      {/* Sticky Header with Sign In & Sign Up */}
      <div 
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b"
        style={{ 
          background: 'linear-gradient(135deg, rgba(7,7,26,0.95), rgba(13,26,42,0.95))', 
          borderColor: 'rgba(6,182,212,0.2)',
          boxShadow: '0 4px 20px rgba(6,182,212,0.1)',
          animation: 'slideDown 0.5s ease-out'
        }}
      >
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <MatchifyLogo size={44} />
          </Link>

          {/* Sign Up Button */}
          <Link 
            to={redirectUrl ? `/register?redirect=${encodeURIComponent(redirectUrl)}` : '/register'}
            className="px-4 py-2 rounded-lg font-bold text-sm transition-all relative overflow-hidden group"
            style={{ 
              background: 'linear-gradient(135deg, #06b6d4, #06b6d4)',
              color: '#003320',
              boxShadow: '0 4px 12px rgba(6,182,212,0.4), inset 0 1px 0 rgba(255,255,255,0.3)'
            }}
          >
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'rgba(255,255,255,0.2)' }}
            />
            <span className="relative z-10">Sign up</span>
          </Link>
        </div>
      </div>

      {/* Animated Background Elements */}
      <div className="fixed top-0 bottom-0 pointer-events-none overflow-hidden" style={{ left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "480px" }}>
        {/* Large Gradient Orbs */}
        <div 
          className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl opacity-30 animate-pulse"
          style={{ 
            background: 'radial-gradient(circle, rgba(6,182,212,0.4) 0%, rgba(6,182,212,0.2) 40%, transparent 70%)',
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
        {LOGIN_M_PARTICLES.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${p.w}px`,
              height: `${p.h}px`,
              left: `${p.x}%`,
              top: `${p.y}%`,
              background: p.c,
              opacity: p.o,
              animation: `float ${p.dur}s ease-in-out infinite`,
              animationDelay: `${p.delay}s`,
              boxShadow: `0 0 ${p.glow}px ${p.c}`,
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
        @keyframes slideDown {
          0% { transform: translateY(-100%); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          0% { opacity: 0; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes slideUp {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>

      {/* Mobile-optimized container */}
      <div className="relative z-10 flex-1 flex flex-col max-w-md mx-auto w-full px-4" style={{ paddingTop: '80px', paddingBottom: '24px' }}>
        
        {/* Logo Section with Glow */}
        <div className="text-center mb-8 mt-4" style={{ animation: 'fadeIn 0.6s ease-out 0.3s both' }}>
          <div className="flex justify-center mb-3" style={{ animation: 'scaleIn 0.6s ease-out 0.4s both', position: 'relative' }}>
            {/* Glow behind logo — sized to match logo dimensions */}
            <div style={{
              position: 'absolute',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 220, height: 100,
              background: 'radial-gradient(ellipse, rgba(6,182,212,0.45) 0%, transparent 70%)',
              filter: 'blur(20px)',
              animation: 'glow 3s ease-in-out infinite',
              pointerEvents: 'none',
            }} />
            <div style={{ position: 'relative' }}>
              <MatchifyLogo size={90} />
            </div>
          </div>
          <p className="text-xs text-gray-300 font-medium">India's Premier Badminton Platform</p>
        </div>

        {/* Main Card with Enhanced Depth */}
        <div 
          className="rounded-2xl p-6 mb-6 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(6,182,212,0.12) 0%, rgba(99,102,241,0.12) 100%)',
            border: '2px solid rgba(6,182,212,0.3)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(6,182,212,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
            animation: 'slideUp 0.8s ease-out 0.5s both'
          }}
        >
          {/* Animated Background Glow */}
          <div 
            className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-30"
            style={{ 
              background: 'radial-gradient(circle, rgba(6,182,212,0.6), transparent)',
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
                  background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(6,182,212,0.15))', 
                  border: '2px solid rgba(6,182,212,0.5)', 
                  color: '#06b6d4',
                  boxShadow: '0 0 20px rgba(6,182,212,0.3), inset 0 0 20px rgba(6,182,212,0.1)'
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
                  background: 'linear-gradient(135deg, #ffffff 0%, #06b6d4 50%, #ffffff 100%)',
                  backgroundSize: '200% auto',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  animation: 'shimmer 4s linear infinite',
                  textShadow: 'none',
                  filter: 'drop-shadow(0 2px 10px rgba(6,182,212,0.3))'
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
            
            {/* Login Type Toggle */}
            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Login with
              </label>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => handleLoginTypeChange('phone')}
                  className={`py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                    loginType === 'phone'
                      ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/50'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  📱 Phone Number
                </button>
                <button
                  type="button"
                  onClick={() => handleLoginTypeChange('email')}
                  className={`py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                    loginType === 'email'
                      ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/50'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  ✉️ Email
                </button>
              </div>
            </div>

            {/* Phone Number or Email Input */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                {loginType === 'phone' ? 'Phone Number' : 'Email Address'}
              </label>
              {loginType === 'phone' ? (
                <div className="flex items-stretch rounded-xl overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <span className="flex items-center px-3 text-sm font-bold flex-shrink-0"
                    style={{ color: '#00e5c8', borderRight: '1px solid rgba(255,255,255,0.12)', background: 'rgba(0,229,200,0.07)' }}>
                    +91
                  </span>
                  <input
                    name="credential"
                    type="tel"
                    inputMode="numeric"
                    required
                    autoComplete="tel"
                    className="flex-1 px-3 py-3.5 bg-transparent text-white text-sm placeholder-gray-500 outline-none"
                    placeholder="9876543210"
                    value={formData.credential}
                    onChange={handleChange}
                    maxLength={10}
                  />
                </div>
              ) : (
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    name="credential"
                    type="email"
                    required
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl text-white text-sm placeholder-gray-500 outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                    placeholder="you@example.com"
                    value={formData.credential}
                    onChange={handleChange}
                  />
                </div>
              )}
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

            {/* Submit Button with Enhanced Glow */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-base transition-all disabled:opacity-50 relative overflow-hidden group"
              style={{ 
                background: 'linear-gradient(135deg, #06b6d4 0%, #06b6d4 50%, #06b6d4 100%)',
                backgroundSize: '200% auto',
                color: '#003320',
                boxShadow: '0 8px 25px rgba(6,182,212,0.4), 0 0 40px rgba(6,182,212,0.2), inset 0 1px 0 rgba(255,255,255,0.3)',
                animation: 'shimmer 3s linear infinite, pulse 3s ease-in-out infinite'
              }}
            >
              <div 
                className="absolute inset-0 opacity-0 group-active:opacity-100 transition-opacity duration-200"
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
                  background: 'linear-gradient(135deg, #06b6d4, #06b6d4)',
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
        <div className="grid grid-cols-3 gap-3 mb-6" style={{ animation: 'fadeIn 0.8s ease-out 0.8s both' }}>
          <div 
            className="p-4 rounded-xl text-center relative overflow-hidden"
            style={{ 
              background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(6,182,212,0.15))',
              border: '2px solid rgba(6,182,212,0.4)',
              boxShadow: '0 4px 15px rgba(6,182,212,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
              animation: 'scaleIn 0.5s ease-out 0.9s both'
            }}
          >
            <p className="text-2xl font-black mb-1" style={{ color: '#06b6d4', textShadow: '0 0 20px rgba(6,182,212,0.5)' }}>1000+</p>
            <p className="text-xs font-semibold text-white/80">Players</p>
          </div>
          <div 
            className="p-4 rounded-xl text-center relative overflow-hidden"
            style={{ 
              background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(251,146,60,0.15))',
              border: '2px solid rgba(245,158,11,0.4)',
              boxShadow: '0 4px 15px rgba(245,158,11,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
              animation: 'scaleIn 0.5s ease-out 1.0s both'
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
              boxShadow: '0 4px 15px rgba(6,182,212,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
              animation: 'scaleIn 0.5s ease-out 1.1s both'
            }}
          >
            <p className="text-2xl font-black mb-1" style={{ color: '#22d3ee', textShadow: '0 0 20px rgba(6,182,212,0.5)' }}>25+</p>
            <p className="text-xs font-semibold text-white/80">Cities</p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs font-medium mt-auto" style={{ 
          background: 'linear-gradient(135deg, #ffffff, #06b6d4, #ffffff)',
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
