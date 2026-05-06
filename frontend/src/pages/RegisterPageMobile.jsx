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

const RegisterPageMobile = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
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
    
    if (!formData.name || !formData.email || !formData.password || !formData.phone) {
      setError('All fields are required');
      return;
    }
    if (!/^[0-9]{10}$/.test(formData.phone)) {
      setError('Enter valid 10-digit phone number');
      return;
    }
    
    const password = formData.password;
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError('Password needs one uppercase letter');
      return;
    }
    if ((password.match(/[0-9]/g) || []).length < 2) {
      setError('Password needs two numbers');
      return;
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      setError('Password needs one symbol (!@#$...)');
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
    <div className="min-h-screen" style={{ background: '#07071a' }}>
      {/* Mobile-optimized container */}
      <div className="max-w-md mx-auto px-4 py-6">
        
        {/* Logo Section */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <MatchifyLogo size={48} variant="full" />
          </div>
          <p className="text-xs text-gray-400">India's Premier Badminton Platform</p>
        </div>

        {/* Main Card */}
        <div 
          className="rounded-2xl p-5 mb-4"
          style={{
            background: 'rgba(13,26,42,0.8)',
            border: '1px solid rgba(0,200,83,0.2)',
            backdropFilter: 'blur(10px)',
          }}
        >
          {/* Header */}
          <div className="text-center mb-5">
            <div 
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-3"
              style={{ 
                background: 'rgba(0,200,83,0.1)', 
                border: '1px solid rgba(0,200,83,0.3)', 
                color: '#00c853' 
              }}
            >
              ✨ Join the Champions!
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Create Account</h1>
            <p className="text-sm text-gray-400">Start your badminton journey</p>
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
            
            {/* Roles Info */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                You Get All 3 Roles ✓
              </label>
              <div className="grid grid-cols-3 gap-2">
                {roles.map((role) => (
                  <div
                    key={role.title}
                    className="p-3 rounded-xl text-center"
                    style={{ 
                      background: 'rgba(0,200,83,0.08)', 
                      border: '1px solid rgba(0,200,83,0.2)' 
                    }}
                  >
                    <CheckCircleIcon className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                    <div className="text-xl mb-1">{role.icon}</div>
                    <p className="text-xs font-semibold text-white">{role.title}</p>
                    <p className="text-xs text-gray-500">{role.desc}</p>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-emerald-400 text-center">
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

            {/* Phone */}
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
                <p className={`text-xs ${/[A-Z]/.test(formData.password) ? 'text-emerald-400' : 'text-gray-500'}`}>
                  {/[A-Z]/.test(formData.password) ? '✓' : '○'} One uppercase letter
                </p>
                <p className={`text-xs ${(formData.password.match(/[0-9]/g) || []).length >= 2 ? 'text-emerald-400' : 'text-gray-500'}`}>
                  {(formData.password.match(/[0-9]/g) || []).length >= 2 ? '✓' : '○'} Two numbers
                </p>
                <p className={`text-xs ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) ? 'text-emerald-400' : 'text-gray-500'}`}>
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
                style={{ accentColor: '#00c853' }}
              />
              <span className="text-xs text-gray-400">
                I agree to the{' '}
                <a href="/terms" className="text-emerald-400 underline">Terms</a>
                {' '}and{' '}
                <a href="/privacy" className="text-emerald-400 underline">Privacy Policy</a>
              </span>
            </label>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-base transition-all disabled:opacity-50"
              style={{ 
                background: 'linear-gradient(135deg, #00c853, #00ff88)', 
                color: '#003320',
                boxShadow: '0 4px 15px rgba(0,200,83,0.3)'
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="mt-5 text-center">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px bg-gray-700"/>
              <span className="text-xs text-gray-500">or</span>
              <div className="flex-1 h-px bg-gray-700"/>
            </div>
            <p className="text-sm text-gray-400">
              Already have an account?{' '}
              <Link 
                to={redirectUrl ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : '/login'}
                className="font-bold text-emerald-400"
              >
                Sign in →
              </Link>
            </p>
          </div>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div 
            className="p-3 rounded-xl text-center"
            style={{ background: 'rgba(0,200,83,0.05)', border: '1px solid rgba(0,200,83,0.1)' }}
          >
            <div className="text-2xl mb-1">🎁</div>
            <p className="text-xs font-semibold text-white">Free to Join</p>
            <p className="text-xs text-gray-500">No hidden fees</p>
          </div>
          <div 
            className="p-3 rounded-xl text-center"
            style={{ background: 'rgba(0,200,83,0.05)', border: '1px solid rgba(0,200,83,0.1)' }}
          >
            <div className="text-2xl mb-1">🏆</div>
            <p className="text-xs font-semibold text-white">Track Progress</p>
            <p className="text-xs text-gray-500">Live stats</p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500">
          By signing up, you join India's fastest growing badminton community
        </p>
      </div>
    </div>
  );
};

export default RegisterPageMobile;
