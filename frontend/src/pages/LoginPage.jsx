import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { EyeIcon, EyeSlashIcon, EnvelopeIcon, LockClosedIcon, ArrowRightIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { Zap, Trophy, Users, MapPin, Ban, X, AlertTriangle } from 'lucide-react';

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [bannedModal, setBannedModal] = useState(null);
  
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
      
      const userRoles = Array.isArray(user.roles) ? user.roles : [user.role];
      const primaryRole = userRoles[0];
      
      switch (primaryRole) {
        case 'PLAYER': navigate('/dashboard'); break;
        case 'ORGANIZER': navigate('/organizer/dashboard'); break;
        case 'UMPIRE': navigate('/umpire/dashboard'); break;
        case 'ADMIN': navigate('/admin/dashboard'); break;
        default: navigate('/');
      }
    } catch (err) {
      // Check if user is banned
      if (err.response?.status === 403 && err.response?.data?.isSuspended) {
        setBannedModal({
          reason: err.response.data.suspensionReason || 'Violation of terms of service',
          message: err.response.data.message
        });
      } else {
        setError(err.response?.data?.error || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-900">
      {/* Left Side - Branding with exciting effects */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900"></div>
        
        {/* Animated blobs */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-pulse animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse animation-delay-4000"></div>
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
        
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12">
          {/* Logo with glow effect */}
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-3xl blur-2xl opacity-50 animate-pulse"></div>
            <div className="relative w-28 h-28 bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/50 transform hover:scale-105 transition-transform">
              <span className="text-6xl">🏸</span>
            </div>
          </div>
          
          {/* Brand name with gradient */}
          <h1 className="text-6xl font-black mb-4">
            <span className="bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">MATCHIFY</span>
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">.pro</span>
          </h1>
          
          <p className="text-xl text-white/60 text-center max-w-md mb-4">
            India's Premier Badminton Tournament Platform
          </p>

          {/* Exciting tagline */}
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full mb-12">
            <SparklesIcon className="w-5 h-5 text-purple-400 animate-pulse" />
            <span className="text-purple-300 font-medium">Where Champions Are Made</span>
            <SparklesIcon className="w-5 h-5 text-pink-400 animate-pulse" />
          </div>
          
          {/* Stats with glowing cards */}
          <div className="grid grid-cols-3 gap-6 w-full max-w-md">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-4 text-center hover:border-purple-500/50 transition-all">
                <Users className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">1000+</p>
                <p className="text-white/50 text-sm">Players</p>
              </div>
            </div>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-4 text-center hover:border-amber-500/50 transition-all">
                <Trophy className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                <p className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">50+</p>
                <p className="text-white/50 text-sm">Tournaments</p>
              </div>
            </div>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-4 text-center hover:border-cyan-500/50 transition-all">
                <MapPin className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                <p className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">25+</p>
                <p className="text-white/50 text-sm">Cities</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form with dark theme */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        {/* Subtle background effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
        
        <div className="w-full max-w-md relative z-10">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <span className="text-3xl">🏸</span>
              </div>
              <span className="text-2xl font-bold text-white">MATCHIFY<span className="text-emerald-400">.pro</span></span>
            </Link>
          </div>

          {/* Welcome text with gradient */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-full mb-4">
              <Zap className="w-4 h-4 text-purple-400" />
              <span className="text-purple-300 text-sm font-medium">Ready to Play?</span>
            </div>
            <h2 className="text-4xl font-bold text-white mb-2">Welcome Back!</h2>
            <p className="text-gray-400">Sign in to continue your journey</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-purple-400 transition-colors z-10" />
                  <input
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    className="w-full pl-12 pr-4 py-4 bg-slate-800 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all [&:-webkit-autofill]:bg-slate-800 [&:-webkit-autofill]:text-white [&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0_1000px_rgb(30,41,59)_inset] [&:-webkit-autofill]:border-white/10"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                <div className="relative">
                  <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-purple-400 transition-colors z-10" />
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    className="w-full pl-12 pr-12 py-4 bg-slate-800 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all [&:-webkit-autofill]:bg-slate-800 [&:-webkit-autofill]:text-white [&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0_1000px_rgb(30,41,59)_inset] [&:-webkit-autofill]:border-white/10"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-purple-400 transition-colors z-10"
                  >
                    {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-slate-800 text-purple-500 focus:ring-purple-500 focus:ring-offset-0" />
                <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Remember me</span>
              </label>
              <a href="#" className="text-sm text-purple-400 hover:text-purple-300 font-medium transition-colors">Forgot password?</a>
            </div>

            {/* Exciting submit button */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-500 to-cyan-500 rounded-xl blur-lg opacity-70 group-hover:opacity-100 transition-opacity animate-pulse"></div>
              <button
                type="submit"
                disabled={loading}
                className="relative w-full py-4 bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 bg-size-200 bg-pos-0 hover:bg-pos-100 text-white font-bold rounded-xl shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Let's Go!
                    <ArrowRightIcon className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-400">
              Don't have an account?{' '}
              <Link to={redirectUrl ? `/register?redirect=${encodeURIComponent(redirectUrl)}` : '/register'} className="text-transparent bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text font-bold hover:from-purple-300 hover:to-cyan-300 transition-all">
                Create one now
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Banned User Modal */}
      {bannedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-md">
            <div className="absolute -inset-2 bg-gradient-to-r from-red-500 via-rose-500 to-red-500 rounded-3xl blur-xl opacity-60"></div>
            <div className="relative bg-slate-800 rounded-2xl border border-red-500/30 overflow-hidden">
              <div className="p-6 border-b border-white/10 bg-red-500/10">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-red-500/20 rounded-full flex items-center justify-center">
                    <Ban className="w-7 h-7 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-red-400">Account Suspended</h3>
                    <p className="text-sm text-gray-400">Your Matchify.pro account has been suspended</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="p-4 bg-slate-700/50 rounded-xl border border-white/10">
                  <p className="text-sm text-gray-400 mb-2">Reason for suspension:</p>
                  <p className="text-white font-medium">{bannedModal.reason}</p>
                </div>
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-amber-400 font-medium text-sm">What can you do?</p>
                      <p className="text-sm text-gray-400 mt-1">
                        If you believe this suspension is a mistake, please contact our support team at <span className="text-purple-400">support@matchify.pro</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-slate-900/50 border-t border-white/10">
                <button
                  onClick={() => setBannedModal(null)}
                  className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
