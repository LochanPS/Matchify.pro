import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  EyeIcon,
  EyeSlashIcon,
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon,
  PhoneIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { getErrorMessage } from '../utils/errorMessage';
import MatchifyLogo from '../components/MatchifyLogo';

// Pre-generated particle data — deterministic, no Math.random in render
const REG_M_PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  w: (i * 7 + 1) % 2 + 1,
  h: (i * 11 + 1) % 2 + 1,
  x: (i * 37 + 11) % 97,
  y: (i * 53 + 7) % 91,
  c: ["#00ff88", "#00d4ff", "rgba(255,255,255,0.9)"][i % 3],
  o: ((i * 13) % 50) / 100 + 0.2,
  dur: (i * 7) % 4 + 3,
  delay: (i * 3) % 4,
  glow: (i * 11) % 15 + 5,
}));


const RegisterPageMobile = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    birthYear: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone || !formData.birthYear || !formData.password) {
      setError('Name, Phone, Date of Birth and Password are required');
      return;
    }
    if (!/^[0-9]{10}$/.test(formData.phone)) {
      setError('Enter valid 10-digit phone number');
      return;
    }
    // Email is optional, but if provided, validate it
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Enter valid email address');
      return;
    }
    
    // Validate date of birth
    if (!formData.birthYear) {
      setError('Please enter your date of birth');
      return;
    }
    const birthDate = new Date(formData.birthYear);
    const today = new Date();
    if (birthDate > today) {
      setError('Date of birth cannot be in the future');
      return;
    }
    
    const password = formData.password;
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError('Password needs one capital letter');
      return;
    }
    if ((password.match(/[0-9]/g) || []).length < 2) {
      setError('Password needs two numbers');
      return;
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      setError('Password needs one special symbol');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!termsAccepted) {
      setError('Please accept terms and conditions');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const { confirmPassword, ...dataToSend } = formData;
      await register(dataToSend);
      
      if (redirectUrl) {
        navigate(redirectUrl);
        return;
      }
      
      navigate('/dashboard?role=PLAYER');
    } catch (err) {
      setError(getErrorMessage(err, 'Registration failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { icon: '🏸', title: 'Player', desc: 'Compete' },
    { icon: '📋', title: 'Organizer', desc: 'Host' },
    { icon: '⚖️', title: 'Umpire', desc: 'Officiate' },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ 
      background: 'linear-gradient(180deg, #0a0a1f 0%, #07071a 30%, #0d1a2a 60%, #07071a 100%)' 
    }}>
      {/* Sticky Header with Sign In & Sign Up */}
      <div 
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b"
        style={{ 
          background: 'linear-gradient(135deg, rgba(7,7,26,0.95), rgba(13,26,42,0.95))', 
          borderColor: 'rgba(0,255,136,0.2)',
          boxShadow: '0 4px 20px rgba(0,255,136,0.1)',
          animation: 'slideDown 0.5s ease-out'
        }}
      >
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="relative">
              <div 
                className="absolute inset-0 blur-lg opacity-60"
                style={{ 
                  background: 'radial-gradient(circle, rgba(0,255,136,0.6) 0%, transparent 70%)',
                  animation: 'glow 3s ease-in-out infinite'
                }}
              />
              <MatchifyLogo size={28} variant="icon" />
            </div>
            <span 
              className="font-bold text-base"
              style={{ 
                background: 'linear-gradient(135deg, #00ff88, #00ff88)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              matchify.pro
            </span>
          </Link>

          {/* Sign In Button */}
          <Link 
            to={redirectUrl ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : '/login'}
            className="px-4 py-2 rounded-lg font-semibold text-sm transition-all relative overflow-hidden group"
            style={{ 
              background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.05))', 
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#ffffff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            />
            <span className="relative z-10">Sign in</span>
          </Link>
        </div>
      </div>

      {/* Animated Background Elements */}
      <div className="fixed top-0 bottom-0 pointer-events-none overflow-hidden" style={{ left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "480px" }}>
        {/* Large Gradient Orbs */}
        <div 
          className="absolute top-0 left-0 w-80 h-80 rounded-full blur-3xl opacity-30 animate-pulse"
          style={{ 
            background: 'radial-gradient(circle, rgba(0,255,136,0.4) 0%, rgba(0,255,136,0.2) 40%, transparent 70%)',
            animation: 'float 8s ease-in-out infinite'
          }}
        />
        <div 
          className="absolute bottom-1/3 right-0 w-72 h-72 rounded-full blur-3xl opacity-25 animate-pulse"
          style={{ 
            background: 'radial-gradient(circle, rgba(168,85,247,0.4) 0%, rgba(139,92,246,0.2) 40%, transparent 70%)',
            animation: 'float 10s ease-in-out infinite reverse',
            animationDelay: '2s'
          }}
        />
        <div 
          className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full blur-3xl opacity-20 animate-pulse"
          style={{ 
            background: 'radial-gradient(circle, rgba(245,158,11,0.4) 0%, rgba(251,146,60,0.2) 40%, transparent 70%)',
            animation: 'float 12s ease-in-out infinite',
            animationDelay: '4s'
          }}
        />
        
        {/* Floating Particles */}
        {REG_M_PARTICLES.map((p, i) => (
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
      <div className="relative z-10 max-w-md mx-auto px-4" style={{ paddingTop: '80px', paddingBottom: '24px' }}>
        
        {/* Logo Section with Glow */}
        <div className="text-center mb-6" style={{ animation: 'fadeIn 0.6s ease-out 0.3s both' }}>
          <div className="flex justify-center mb-3 relative" style={{ animation: 'scaleIn 0.6s ease-out 0.4s both' }}>
            <div 
              className="absolute inset-0 blur-2xl opacity-60"
              style={{ 
                background: 'radial-gradient(circle, rgba(0,255,136,0.6) 0%, transparent 70%)',
                animation: 'glow 3s ease-in-out infinite'
              }}
            />
            <div className="relative">
              <MatchifyLogo size={48} variant="full" />
            </div>
          </div>
          <p className="text-xs text-gray-300 font-medium">India's Premier Badminton Platform</p>
        </div>

        {/* Main Card with Enhanced Depth */}
        <div 
          className="rounded-2xl p-5 mb-4 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(0,200,83,0.12) 0%, rgba(168,85,247,0.12) 100%)',
            border: '2px solid rgba(0,255,136,0.3)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0,255,136,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
            animation: 'slideUp 0.8s ease-out 0.5s both'
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
              background: 'radial-gradient(circle, rgba(168,85,247,0.6), transparent)',
              animation: 'glow 4s ease-in-out infinite reverse'
            }}
          />
          
          <div className="relative z-10">
            {/* Header */}
            <div className="text-center mb-5">
              <div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold mb-3 relative overflow-hidden"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(0,255,136,0.2), rgba(0,255,136,0.15))', 
                  border: '2px solid rgba(0,255,136,0.5)', 
                  color: '#00ff88',
                  boxShadow: '0 0 20px rgba(0,255,136,0.3), inset 0 0 20px rgba(0,255,136,0.1)'
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
                <span className="relative z-10">✨ Join the Champions!</span>
              </div>
              <h1 
                className="text-3xl font-black mb-1"
                style={{ 
                  background: 'linear-gradient(135deg, #ffffff 0%, #00ff88 50%, #ffffff 100%)',
                  backgroundSize: '200% auto',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  animation: 'shimmer 4s linear infinite',
                  textShadow: 'none',
                  filter: 'drop-shadow(0 2px 10px rgba(0,255,136,0.3))'
                }}
              >
                Create Account
              </h1>
              <p className="text-sm text-gray-300 font-medium">Start your badminton journey</p>
            </div>

          {/* Error Message */}
          {error && (
            <div 
              className="mb-4 p-3 rounded-lg text-sm"
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
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Roles Info with Vibrant Colors */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                You Get All 3 Roles ✓
              </label>
              <div className="grid grid-cols-3 gap-2">
                {roles.map((role, idx) => {
                  const colors = [
                    { bg: 'linear-gradient(135deg, rgba(0,255,136,0.2), rgba(0,255,136,0.15))', border: 'rgba(0,255,136,0.5)', shadow: 'rgba(0,255,136,0.3)' },
                    { bg: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(139,92,246,0.15))', border: 'rgba(168,85,247,0.5)', shadow: 'rgba(168,85,247,0.3)' },
                    { bg: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(14,165,233,0.15))', border: 'rgba(6,182,212,0.5)', shadow: 'rgba(6,182,212,0.3)' }
                  ];
                  const color = colors[idx];
                  
                  return (
                    <div
                      key={role.title}
                      className="p-3 rounded-xl text-center relative overflow-hidden"
                      style={{ 
                        background: color.bg,
                        border: `2px solid ${color.border}`,
                        boxShadow: `0 4px 15px ${color.shadow}, inset 0 1px 0 rgba(255,255,255,0.1)`
                      }}
                    >
                      <CheckCircleIcon className="w-4 h-4 mx-auto mb-1" style={{ color: '#00ff88', filter: 'drop-shadow(0 2px 4px rgba(0,255,136,0.5))' }} />
                      <div className="text-xl mb-1" style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }}>{role.icon}</div>
                      <p className="text-xs font-semibold text-white">{role.title}</p>
                      <p className="text-xs text-gray-300">{role.desc}</p>
                    </div>
                  );
                })}
              </div>
              <p className="mt-2 text-xs font-semibold text-center" style={{ 
                background: 'linear-gradient(135deg, #00ff88, #00ff88)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Switch roles anytime from dashboard
              </p>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  name="name"
                  type="text"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-white text-sm placeholder-gray-500 outline-none"
                  style={{ 
                    background: 'rgba(255,255,255,0.05)', 
                    border: '1px solid rgba(255,255,255,0.1)' 
                  }}
                  placeholder="Your full name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Phone Number
              </label>
              <div className="relative">
                <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  name="phone"
                  type="tel"
                  required
                  maxLength={10}
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-white text-sm placeholder-gray-500 outline-none"
                  style={{ 
                    background: 'rgba(255,255,255,0.05)', 
                    border: '1px solid rgba(255,255,255,0.1)' 
                  }}
                  placeholder="9876543210"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Email - Optional */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Email <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 400, fontSize: '11px' }}>(Optional)</span>
              </label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  name="email"
                  type="email"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-white text-sm placeholder-gray-500 outline-none"
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

            {/* Birth Year - Required */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Date of Birth
              </label>
              <input
                name="birthYear"
                type="date"
                required
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  colorScheme: 'dark',
                }}
                value={formData.birthYear}
                onChange={handleChange}
              />
              <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Please enter your correct date of birth. This information is kept confidential and will not be misused.
              </p>
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
                  className="w-full pl-10 pr-12 py-3 rounded-xl text-white text-sm placeholder-gray-500 outline-none"
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
              {/* Password requirements */}
              <div className="mt-2 space-y-1">
                <p className="text-xs" style={{ color: /[A-Z]/.test(formData.password) ? '#00ff88' : 'rgba(255,255,255,0.35)' }}>
                  {/[A-Z]/.test(formData.password) ? '✓' : '○'} One uppercase letter
                </p>
                <p className="text-xs" style={{ color: (formData.password.match(/[0-9]/g) || []).length >= 2 ? '#00ff88' : 'rgba(255,255,255,0.35)' }}>
                  {(formData.password.match(/[0-9]/g) || []).length >= 2 ? '✓' : '○'} Two numbers
                </p>
                <p className="text-xs" style={{ color: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) ? '#00ff88' : 'rgba(255,255,255,0.35)' }}>
                  {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) ? '✓' : '○'} One symbol
                </p>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  className="w-full pl-10 pr-12 py-3 rounded-xl text-white text-sm placeholder-gray-500 outline-none"
                  style={{ 
                    background: 'rgba(255,255,255,0.05)', 
                    border: '1px solid rgba(255,255,255,0.1)' 
                  }}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showConfirmPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                required 
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="w-5 h-5 rounded mt-0.5" 
                style={{ accentColor: '#00ff88' }}
              />
              <span className="text-xs text-gray-400">
                I agree to the{' '}
                <Link to="/terms" className="underline" style={{ color: '#00ff88' }}>Terms</Link>
                {' '}and{' '}
                <Link to="/privacy" className="underline" style={{ color: '#00ff88' }}>Privacy Policy</Link>
              </span>
            </label>

            {/* Submit Button with Enhanced Glow */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-base transition-all disabled:opacity-50 relative overflow-hidden group"
              style={{ 
                background: 'linear-gradient(135deg, #00ff88 0%, #00ff88 50%, #00ff88 100%)',
                backgroundSize: '200% auto',
                color: '#003320',
                boxShadow: '0 8px 25px rgba(0,255,136,0.4), 0 0 40px rgba(0,255,136,0.2), inset 0 1px 0 rgba(255,255,255,0.3)',
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
                  Creating...
                </span>
              ) : (
                <span className="relative z-10" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>Create Account</span>
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="mt-5 text-center">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)' }}/>
              <span className="text-xs text-gray-400 font-medium">or</span>
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)' }}/>
            </div>
            <p className="text-sm text-gray-300">
              Already have an account?{' '}
              <Link 
                to={redirectUrl ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : '/login'}
                className="font-bold"
                style={{ 
                  background: 'linear-gradient(135deg, #00ff88, #00ff88)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                Sign in →
              </Link>
            </p>
          </div>
          </div>
        </div>

        {/* Benefits with Vibrant Colors */}
        <div className="grid grid-cols-2 gap-3 mb-4" style={{ animation: 'fadeIn 0.8s ease-out 0.8s both' }}>
          <div 
            className="p-4 rounded-xl text-center relative overflow-hidden"
            style={{ 
              background: 'linear-gradient(135deg, rgba(0,255,136,0.2), rgba(0,255,136,0.15))',
              border: '2px solid rgba(0,255,136,0.4)',
              boxShadow: '0 4px 15px rgba(0,255,136,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
              animation: 'scaleIn 0.5s ease-out 0.9s both'
            }}
          >
            <div className="text-3xl mb-2" style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))', animation: 'float 3s ease-in-out infinite' }}>🎁</div>
            <p className="text-sm font-bold text-white mb-1">Free to Join</p>
            <p className="text-xs text-gray-300">No hidden fees</p>
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
            <div className="text-3xl mb-2" style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))', animation: 'float 3s ease-in-out infinite', animationDelay: '0.5s' }}>🏆</div>
            <p className="text-sm font-bold text-white mb-1">Track Progress</p>
            <p className="text-xs text-gray-300">Live stats</p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs font-medium" style={{ 
          background: 'linear-gradient(135deg, #ffffff, #00ff88, #ffffff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          By signing up, you join India's fastest growing badminton community
        </p>
      </div>
    </div>
  );
};

export default RegisterPageMobile;
