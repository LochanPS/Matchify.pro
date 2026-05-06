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
    <div className="min-h-screen flex flex-col" style={{ background: '#07071a' }}>
      {/* Mobile-optimized container */}
      <div className="flex-1 flex flex-col max-w-md mx-auto w-full px-4 py-6">
        
        {/* Logo Section */}
        <div className="text-center mb-8 mt-4">
          <div className="flex justify-center mb-3">
            <MatchifyLogo size={56} variant="full" />
          </div>
          <p className="text-xs text-gray-400">India's Premier Badminton Platform</p>
        </div>

        {/* Main Card */}
        <div 
          className="rounded-2xl p-6 mb-6"
          style={{
            background: 'rgba(13,26,42,0.8)',
            border: '1px solid rgba(0,200,83,0.2)',
            backdropFilter: 'blur(10px)',
          }}
        >
          {/* Header */}
          <div className="text-center mb-6">
            <div 
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-3"
              style={{ 
                background: 'rgba(0,200,83,0.1)', 
                border: '1px solid rgba(0,200,83,0.3)', 
                color: '#00c853' 
              }}
            >
              ⚡ Ready to Play?
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-sm text-gray-400">Sign in to continue your journey</p>
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
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  ⚡ Let's Go!
                </span>
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px bg-gray-700"/>
              <span className="text-xs text-gray-500">or</span>
              <div className="flex-1 h-px bg-gray-700"/>
            </div>
            <p className="text-sm text-gray-400">
              Don't have an account?{' '}
              <Link 
                to={redirectUrl ? `/register?redirect=${encodeURIComponent(redirectUrl)}` : '/register'}
                className="font-bold text-emerald-400"
              >
                Create one free →
              </Link>
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div 
            className="p-3 rounded-xl text-center"
            style={{ background: 'rgba(0,200,83,0.05)', border: '1px solid rgba(0,200,83,0.1)' }}
          >
            <p className="text-xl font-bold text-emerald-400">1000+</p>
            <p className="text-xs text-gray-500">Players</p>
          </div>
          <div 
            className="p-3 rounded-xl text-center"
            style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.1)' }}
          >
            <p className="text-xl font-bold text-amber-400">50+</p>
            <p className="text-xs text-gray-500">Tournaments</p>
          </div>
          <div 
            className="p-3 rounded-xl text-center"
            style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.1)' }}
          >
            <p className="text-xl font-bold text-cyan-400">25+</p>
            <p className="text-xs text-gray-500">Cities</p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-auto">
          🏆 Where Champions Are Made
        </p>
      </div>
    </div>
  );
};

export default LoginPageMobile;
