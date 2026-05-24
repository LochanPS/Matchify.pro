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
import Spinner from '../components/Spinner';



const RegisterPageMobile = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [conflictError, setConflictError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  const handleChange = (e) => {
    let value = e.target.value;
    // Phone field: digits only, max 10
    if (e.target.name === 'phone') {
      value = value.replace(/\D/g, '').slice(0, 10);
    }
    setFormData({ ...formData, [e.target.name]: value });
    setError('');
    setConflictError(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name) {
      setError('Full name is required');
      return;
    }
    if (!formData.email && !formData.phone) {
      setError('Enter your email or phone number (at least one required)');
      return;
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Enter a valid email address');
      return;
    }
    if (formData.phone && !/^[0-9]{10}$/.test(formData.phone)) {
      setError('Enter a valid 10-digit phone number');
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
      if (!dataToSend.email) delete dataToSend.email;
      if (!dataToSend.phone) delete dataToSend.phone;
      await register(dataToSend);
      
      if (redirectUrl) {
        navigate(redirectUrl);
        return;
      }
      
      navigate('/dashboard?role=PLAYER');
    } catch (err) {
      const status = err?.response?.status;
      if (status === 409) {
        setConflictError(true);
        setError('');
      } else {
        setError(getErrorMessage(err, 'Registration failed. Please try again.'));
      }
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
      background: '#050810'
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

      {/* Ambient Background — 2 blobs */}
      <div className="fixed top-0 bottom-0 pointer-events-none overflow-hidden" style={{ left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '480px' }}>
        <div style={{ position: 'absolute', width: '440px', height: '440px', top: '-140px', right: '-120px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.09) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', width: '400px', height: '400px', bottom: '5%', left: '-120px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)', filter: 'blur(80px)' }} />
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
          <div className="flex justify-center mb-3" style={{ animation: 'scaleIn 0.6s ease-out 0.4s both', position: 'relative' }}>
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
          className="rounded-2xl p-5 mb-4 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(6,182,212,0.12) 0%, rgba(168,85,247,0.12) 100%)',
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
                <span className="relative z-10">✨ Join the Champions!</span>
              </div>
              <h1 
                className="text-3xl font-black mb-1"
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
                Create Account
              </h1>
              <p className="text-sm text-gray-300 font-medium">Start your badminton journey</p>
            </div>

          {/* Conflict Error — account already exists */}
          {conflictError && (
            <div
              className="mb-4 p-3 rounded-xl text-sm"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}
            >
              <p className="font-bold mb-1" style={{ color: '#f87171' }}>⚠️ Account already exists</p>
              <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                This email or phone is already registered.
              </p>
              <Link
                to={redirectUrl ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : '/login'}
                className="inline-block w-full text-center py-2 rounded-lg text-xs font-bold transition-all"
                style={{ background: 'linear-gradient(135deg,#06b6d4,#00d4ff)', color: '#07071a' }}
              >
                Sign in instead →
              </Link>
            </div>
          )}

          {/* Generic Error Message */}
          {error && (
            <div
              className="mb-4 p-3 rounded-lg text-sm"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}
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
                    { bg: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(6,182,212,0.15))', border: 'rgba(6,182,212,0.5)', shadow: 'rgba(6,182,212,0.3)' },
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
                      <CheckCircleIcon className="w-4 h-4 mx-auto mb-1" style={{ color: '#06b6d4', filter: 'drop-shadow(0 2px 4px rgba(6,182,212,0.5))' }} />
                      <div className="text-xl mb-1" style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }}>{role.icon}</div>
                      <p className="text-xs font-semibold text-white">{role.title}</p>
                      <p className="text-xs text-gray-300">{role.desc}</p>
                    </div>
                  );
                })}
              </div>
              <p className="mt-2 text-xs font-semibold text-center" style={{ 
                background: 'linear-gradient(135deg, #06b6d4, #06b6d4)',
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

            {/* Contact — Email OR Phone */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-white">Sign-in Contact</label>
                {!formData.email && !formData.phone ? (
                  <span className="text-xs font-semibold" style={{ color: 'rgba(251,191,36,0.9)' }}>⚠ At least one required</span>
                ) : (
                  <span className="text-xs font-semibold" style={{ color: '#06b6d4' }}>✓ Looks good</span>
                )}
              </div>
              <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Enter email, phone, or both — use either to sign in
              </p>

              {/* Email */}
              <div className="relative mb-3">
                <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  name="email"
                  type="email"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-white text-sm placeholder-gray-500 outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: formData.email ? '1px solid rgba(6,182,212,0.4)' : '1px solid rgba(255,255,255,0.1)',
                  }}
                  placeholder="Email address (optional)"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              {/* OR divider */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                <span className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.25)' }}>OR</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
              </div>

              {/* Phone */}
              <div className="flex items-stretch rounded-xl overflow-hidden"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: formData.phone ? '1px solid rgba(0,229,200,0.4)' : '1px solid rgba(255,255,255,0.1)',
                }}>
                <span className="flex items-center px-3 text-sm font-bold flex-shrink-0"
                  style={{ color: '#00e5c8', borderRight: '1px solid rgba(255,255,255,0.12)', background: 'rgba(0,229,200,0.07)' }}>
                  +91
                </span>
                <input
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  className="flex-1 px-3 py-3 bg-transparent text-white text-sm placeholder-gray-500 outline-none"
                  placeholder="10-digit number (optional)"
                  value={formData.phone}
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
                <p className="text-xs" style={{ color: /[A-Z]/.test(formData.password) ? '#06b6d4' : 'rgba(255,255,255,0.35)' }}>
                  {/[A-Z]/.test(formData.password) ? '✓' : '○'} One uppercase letter
                </p>
                <p className="text-xs" style={{ color: (formData.password.match(/[0-9]/g) || []).length >= 2 ? '#06b6d4' : 'rgba(255,255,255,0.35)' }}>
                  {(formData.password.match(/[0-9]/g) || []).length >= 2 ? '✓' : '○'} Two numbers
                </p>
                <p className="text-xs" style={{ color: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) ? '#06b6d4' : 'rgba(255,255,255,0.35)' }}>
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
                style={{ accentColor: '#06b6d4' }}
              />
              <span className="text-xs text-gray-400">
                I agree to the{' '}
                <Link to="/terms" className="underline" style={{ color: '#06b6d4' }}>Terms</Link>
                {' '}and{' '}
                <Link to="/privacy" className="underline" style={{ color: '#06b6d4' }}>Privacy Policy</Link>
              </span>
            </label>

            {/* Submit Button with Enhanced Glow */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-base transition-all disabled:opacity-50 relative overflow-hidden group"
              style={{ 
                background: 'linear-gradient(135deg, #06b6d4 0%, #06b6d4 50%, #06b6d4 100%)',
                backgroundSize: '200% auto',
                color: '#050810',
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
                  <Spinner size="md" />
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
                  background: 'linear-gradient(135deg, #06b6d4, #06b6d4)',
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
              background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(6,182,212,0.15))',
              border: '2px solid rgba(6,182,212,0.4)',
              boxShadow: '0 4px 15px rgba(6,182,212,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
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
          background: 'linear-gradient(135deg, #ffffff, #06b6d4, #ffffff)',
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
