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
  ArrowRightIcon,
  CheckCircleIcon,
  SparklesIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Zap, Trophy, Users, Rocket, Star, Gift } from 'lucide-react';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    alternateEmail: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
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
      setError('Name, email, phone, and password are required');
      return;
    }
    if (!/^[0-9]{10}$/.test(formData.phone)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    if (formData.alternateEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.alternateEmail)) {
      setError('Please enter a valid alternate email address');
      return;
    }
    // Password validation
    const password = formData.password;
    const hasUppercase = /[A-Z]/.test(password);
    const numberCount = (password.match(/[0-9]/g) || []).length;
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (!hasUppercase) {
      setError('Password must contain at least one uppercase letter (A-Z)');
      return;
    }
    if (numberCount < 2) {
      setError('Password must contain at least two numbers (0-9)');
      return;
    }
    if (!hasSymbol) {
      setError('Password must contain at least one symbol (!@#$%^&*...)');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
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
      
      // Default to player dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // All three roles that every user gets
  const roles = [
    { id: 'PLAYER', icon: '🏸', title: 'Player', desc: 'Compete in tournaments', color: 'blue' },
    { id: 'ORGANIZER', icon: '📋', title: 'Organizer', desc: 'Host tournaments', color: 'green' },
    { id: 'UMPIRE', icon: '⚖️', title: 'Umpire', desc: 'Officiate matches', color: 'orange' },
  ];

  return (
    <div className="min-h-screen flex bg-slate-900">
      {/* Left Side - Branding with exciting effects */}
      <div className="hidden lg:flex lg:w-2/5 relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900"></div>
        
        {/* Animated blobs */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-pulse animation-delay-2000"></div>
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
          <h1 className="text-5xl font-black mb-4">
            <span className="bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">MATCHIFY</span>
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">.pro</span>
          </h1>
          
          <p className="text-xl text-white/60 text-center max-w-md mb-4">
            Join India's fastest growing badminton community
          </p>

          {/* Exciting tagline */}
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 rounded-full mb-10">
            <Rocket className="w-5 h-5 text-emerald-400 animate-bounce" />
            <span className="text-emerald-300 font-medium">Start Your Journey Today!</span>
          </div>
          
          {/* Benefits with glowing effects */}
          <div className="space-y-4 w-full max-w-xs">
            {[
              { icon: <Gift className="w-5 h-5" />, text: '₹10 welcome bonus', color: 'text-amber-400' },
              { icon: <Star className="w-5 h-5" />, text: 'Free to join', color: 'text-purple-400' },
              { icon: <Users className="w-5 h-5" />, text: 'Multiple roles supported', color: 'text-cyan-400' },
              { icon: <Trophy className="w-5 h-5" />, text: 'Track your progress', color: 'text-pink-400' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-xl hover:border-white/20 transition-all group">
                <span className={`${item.color} group-hover:scale-110 transition-transform`}>{item.icon}</span>
                <span className="text-white/70 group-hover:text-white transition-colors">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Register Form with dark theme */}
      <div className="w-full lg:w-3/5 flex items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-y-auto relative">
        {/* Subtle background effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
        
        <div className="w-full max-w-xl py-8 relative z-10">
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
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full mb-4">
              <SparklesIcon className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="text-emerald-300 text-sm font-medium">Join the Champions!</span>
            </div>
            <h2 className="text-4xl font-bold text-white mb-2">Create Account</h2>
            <p className="text-gray-400">Start your badminton journey today</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* All Roles Included - Informational */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                You'll Get All 3 Roles <span className="text-emerald-400">✓</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {roles.map((role) => (
                  <div
                    key={role.id}
                    className="relative p-4 rounded-xl border-2 border-emerald-500/50 bg-emerald-500/10 shadow-lg shadow-emerald-500/10"
                  >
                    <CheckCircleIcon className="absolute top-2 right-2 w-5 h-5 text-emerald-400" />
                    <div className="text-2xl mb-2">{role.icon}</div>
                    <p className="font-semibold text-white text-sm">{role.title}</p>
                    <p className="text-xs text-gray-500">{role.desc}</p>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
                <CheckCircleIcon className="w-4 h-4" />
                Switch between roles anytime from your dashboard
              </p>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                  <input
                    name="name"
                    type="text"
                    required
                    className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Your full name"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                  <div className="relative">
                    <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                    <input
                      name="email"
                      type="email"
                      required
                      className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Phone Number <span className="text-red-400">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                  <div className="relative">
                    <PhoneIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                    <input
                      name="phone"
                      type="tel"
                      required
                      maxLength={10}
                      className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="9876543210"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Alternate Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Alternate Email <span className="text-gray-500 text-xs font-normal">(Optional)</span>
              </label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                  <input
                    name="alternateEmail"
                    type="email"
                    className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Optional alternate email"
                    value={formData.alternateEmail}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                  <div className="relative">
                    <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="w-full pl-12 pr-12 py-4 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-purple-400 transition-colors"
                    >
                      {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                {/* Password requirements */}
                <div className="mt-2 space-y-1">
                  <p className={`text-xs flex items-center gap-1 ${/[A-Z]/.test(formData.password) ? 'text-emerald-400' : 'text-gray-500'}`}>
                    <span>{/[A-Z]/.test(formData.password) ? '✓' : '○'}</span> One uppercase letter
                  </p>
                  <p className={`text-xs flex items-center gap-1 ${(formData.password.match(/[0-9]/g) || []).length >= 2 ? 'text-emerald-400' : 'text-gray-500'}`}>
                    <span>{(formData.password.match(/[0-9]/g) || []).length >= 2 ? '✓' : '○'}</span> Two numbers
                  </p>
                  <p className={`text-xs flex items-center gap-1 ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) ? 'text-emerald-400' : 'text-gray-500'}`}>
                    <span>{/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) ? '✓' : '○'}</span> One symbol (!@#$...)
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                  <div className="relative">
                    <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                    <input
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      className="w-full pl-12 pr-12 py-4 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-purple-400 transition-colors"
                    >
                      {showConfirmPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                required 
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="w-5 h-5 rounded border-white/20 bg-slate-800 text-purple-500 focus:ring-purple-500 focus:ring-offset-0 mt-0.5" 
              />
              <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                I agree to the{' '}
                <button 
                  type="button"
                  onClick={() => setShowTermsModal(true)}
                  className="text-purple-400 hover:text-purple-300 underline"
                >
                  Terms of Service
                </button>
                {' '}and{' '}
                <button 
                  type="button"
                  onClick={() => setShowPrivacyModal(true)}
                  className="text-purple-400 hover:text-purple-300 underline"
                >
                  Privacy Policy
                </button>
              </span>
            </label>

            {/* Exciting submit button */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-500 rounded-xl blur-lg opacity-70 group-hover:opacity-100 transition-opacity animate-pulse"></div>
              <button
                type="submit"
                disabled={loading}
                className="relative w-full py-4 bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-500 bg-size-200 bg-pos-0 hover:bg-pos-100 text-white font-bold rounded-xl shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating account...
                  </>
                ) : (
                  <>
                    <Rocket className="w-5 h-5" />
                    Let's Get Started!
                    <ArrowRightIcon className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-400">
              Already have an account?{' '}
              <Link to={redirectUrl ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : '/login'} className="text-transparent bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text font-bold hover:from-purple-300 hover:to-cyan-300 transition-all">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Terms of Service Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-purple-500/30">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <h2 className="text-2xl font-bold text-white">Terms and Conditions</h2>
              <button
                onClick={() => setShowTermsModal(false)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            
            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 prose prose-invert prose-sm max-w-none">
              <TermsContent />
            </div>
            
            {/* Footer */}
            <div className="p-6 border-t border-slate-700 flex justify-end gap-4">
              <button
                onClick={() => setShowTermsModal(false)}
                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setTermsAccepted(true);
                  setShowTermsModal(false);
                }}
                className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg hover:shadow-lg transition-all"
              >
                I Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-purple-500/30">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <h2 className="text-2xl font-bold text-white">Privacy Policy</h2>
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            
            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 prose prose-invert prose-sm max-w-none">
              <PrivacyContent />
            </div>
            
            {/* Footer */}
            <div className="p-6 border-t border-slate-700 flex justify-end gap-4">
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setTermsAccepted(true);
                  setShowPrivacyModal(false);
                }}
                className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg hover:shadow-lg transition-all"
              >
                I Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Terms of Service Content Component
const TermsContent = () => (
  <div className="text-gray-300 space-y-6">
    <div className="text-sm text-gray-400">
      <p><strong>Last Updated:</strong> January 20, 2026</p>
      <p><strong>Effective Date:</strong> January 20, 2026</p>
      <p><strong>Version:</strong> 1.0</p>
    </div>

    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
      <p className="text-yellow-300 font-semibold">⚠️ IMPORTANT</p>
      <p className="text-sm mt-2">By using Matchify.pro, you agree to these Terms and Conditions. If you do not agree, do not use this platform.</p>
    </div>

    <section>
      <h3 className="text-xl font-bold text-white mb-3">1. ELIGIBILITY</h3>
      <ul className="list-disc pl-6 space-y-2">
        <li>You must be <strong>18 years or older</strong> to use this platform</li>
        <li>Users 13-17 may use with verifiable parental consent</li>
        <li>Users under 13 are strictly prohibited</li>
        <li>You must have legal capacity to enter binding contracts</li>
      </ul>
    </section>

    <section>
      <h3 className="text-xl font-bold text-white mb-3">2. PLATFORM SERVICES</h3>
      <p>Matchify.pro is a <strong>booking and management platform</strong> that:</p>
      <ul className="list-disc pl-6 space-y-2 mt-2">
        <li>Connects Players with Tournament Organizers</li>
        <li>Facilitates tournament registration and payment processing</li>
        <li>Charges a <strong>5% platform fee</strong> on all entry fees</li>
        <li>Acts as an intermediary, NOT a tournament organizer</li>
        <li>Handles all payments to prevent scams</li>
        <li>Pays organizers in 2 installments: <strong>30% before + 65% after tournament</strong></li>
      </ul>

      <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 mt-3">
        <p className="text-purple-300 text-sm font-semibold">💡 How it works:</p>
        <ol className="list-decimal pl-6 space-y-1 text-xs mt-2">
          <li>Players pay 100% entry fee to Matchify.pro admin</li>
          <li>Admin verifies payment and confirms registration</li>
          <li>Admin keeps 5% as platform fee</li>
          <li>Admin pays organizer 30% before tournament starts</li>
          <li>Tournament happens</li>
          <li>Admin pays organizer remaining 65% after tournament ends</li>
        </ol>
      </div>
    </section>

    <section>
      <h3 className="text-xl font-bold text-white mb-3">3. PAYMENT TERMS</h3>
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 mb-4">
        <p className="text-emerald-300 font-semibold mb-2">💰 PAYMENT BREAKDOWN</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Players pay to:</span>
            <span className="font-semibold text-white">Matchify.pro Admin (100%)</span>
          </div>
          <div className="border-t border-emerald-500/20 my-2"></div>
          <div className="flex justify-between">
            <span>Platform keeps:</span>
            <span className="font-semibold text-purple-300">5% (Platform Fee)</span>
          </div>
          <div className="flex justify-between">
            <span>Organizer gets (Total):</span>
            <span className="font-semibold text-cyan-300">95%</span>
          </div>
          <div className="border-t border-emerald-500/20 my-2"></div>
          <div className="pl-4 space-y-1">
            <div className="flex justify-between text-xs">
              <span>→ First Payment (BEFORE tournament):</span>
              <span className="font-semibold text-white">30%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>→ Second Payment (AFTER tournament):</span>
              <span className="font-semibold text-white">65%</span>
            </div>
          </div>
        </div>
      </div>
      
      <p className="text-sm mb-3"><strong>Example:</strong> If entry fee is ₹1,000</p>
      <ul className="list-none pl-6 space-y-1 text-sm bg-slate-700/50 rounded-lg p-3">
        <li>• Player pays: <strong className="text-white">₹1,000</strong> to Matchify.pro admin</li>
        <li>• Platform keeps: <strong className="text-purple-300">₹50</strong> (5%)</li>
        <li>• Organizer gets: <strong className="text-cyan-300">₹950</strong> (95%)</li>
        <li className="pl-4 text-xs">→ Before tournament: <strong className="text-white">₹300</strong> (30%)</li>
        <li className="pl-4 text-xs">→ After tournament: <strong className="text-white">₹650</strong> (65%)</li>
      </ul>

      <h4 className="font-semibold text-white mt-4 mb-2">Payment Process:</h4>
      <ul className="list-disc pl-6 space-y-2">
        <li><strong>Payment Method:</strong> UPI transfer to Matchify.pro admin account</li>
        <li><strong>Payment Proof:</strong> Upload screenshot of UPI payment</li>
        <li><strong>Verification:</strong> Admin verifies payment within 24-48 hours</li>
        <li><strong>Confirmation:</strong> Registration confirmed after payment approval</li>
        <li><strong>To Organizer:</strong> Admin pays organizer in 2 installments (30% + 65%)</li>
      </ul>

      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mt-3">
        <p className="text-blue-300 text-sm font-semibold">🔒 Why payments go to admin:</p>
        <ul className="list-disc pl-6 space-y-1 text-xs mt-2">
          <li>Prevents organizer scams</li>
          <li>Ensures fair payment distribution</li>
          <li>Platform can issue refunds if needed</li>
          <li>Transparent and secure process</li>
        </ul>
      </div>
    </section>

    <section>
      <h3 className="text-xl font-bold text-white mb-3">4. REFUND POLICY</h3>
      <ul className="list-disc pl-6 space-y-2">
        <li><strong>Tournament cancelled by Organizer:</strong> 100% refund</li>
        <li><strong>Player cancels 7+ days before:</strong> 80% refund</li>
        <li><strong>Player cancels 3-6 days before:</strong> 50% refund</li>
        <li><strong>Player cancels less than 3 days:</strong> NO REFUND</li>
        <li><strong>Payment rejected:</strong> 100% refund within 7 days</li>
      </ul>
    </section>

    <section>
      <h3 className="text-xl font-bold text-white mb-3">5. LIABILITY WAIVER</h3>
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
        <p className="text-red-300 font-semibold mb-2">⚠️ BY PARTICIPATING, YOU ACKNOWLEDGE:</p>
        <ul className="list-disc pl-6 space-y-2 text-sm">
          <li>Badminton involves physical activity and risk of injury</li>
          <li>You participate entirely at your own risk</li>
          <li>Matchify.pro is NOT liable for injuries, accidents, or health issues</li>
          <li>You release Matchify.pro from all claims related to injuries</li>
          <li>You are responsible for your own medical insurance</li>
        </ul>
      </div>
    </section>

    <section>
      <h3 className="text-xl font-bold text-white mb-3">6. GAMBLING DISCLAIMER</h3>
      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
        <p className="text-green-300 font-semibold mb-2">✓ GAME OF SKILL</p>
        <ul className="list-disc pl-6 space-y-2 text-sm">
          <li>Badminton is a <strong>game of SKILL</strong>, not chance</li>
          <li>This platform does NOT involve gambling</li>
          <li>Prize money (if any) is provided by Organizers from their own funds</li>
          <li>Entry fees are for tournament costs, NOT pooled for prizes</li>
        </ul>
      </div>
    </section>

    <section>
      <h3 className="text-xl font-bold text-white mb-3">7. PROHIBITED CONDUCT</h3>
      <p>You agree NOT to:</p>
      <ul className="list-disc pl-6 space-y-2 mt-2">
        <li>Violate any laws or regulations</li>
        <li>Use the platform for fraudulent purposes</li>
        <li>Harass or abuse other users</li>
        <li>Upload offensive or illegal content</li>
        <li>Create fake accounts or manipulate rankings</li>
        <li>Interfere with platform operations</li>
      </ul>
    </section>

    <section>
      <h3 className="text-xl font-bold text-white mb-3">8. LIMITATION OF LIABILITY</h3>
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <p className="text-blue-300 font-semibold mb-2">MAXIMUM LIABILITY</p>
        <ul className="list-disc pl-6 space-y-2 text-sm">
          <li>Platform provided "AS IS" with no warranties</li>
          <li>We are NOT liable for tournament quality, safety, or organization</li>
          <li>We are NOT liable for injuries, accidents, or health issues</li>
          <li>Our total liability is limited to amount you paid in last 12 months</li>
          <li>Maximum liability: ₹10,000</li>
        </ul>
      </div>
    </section>

    <section>
      <h3 className="text-xl font-bold text-white mb-3">9. DISPUTE RESOLUTION</h3>
      <ul className="list-disc pl-6 space-y-2">
        <li><strong>Governing Law:</strong> Laws of India</li>
        <li><strong>Jurisdiction:</strong> Courts in Bangalore, Karnataka</li>
        <li><strong>Arbitration:</strong> All disputes resolved through binding arbitration</li>
        <li><strong>No Class Action:</strong> Disputes resolved individually only</li>
      </ul>
    </section>

    <section>
      <h3 className="text-xl font-bold text-white mb-3">10. GRIEVANCE OFFICER</h3>
      <div className="bg-slate-700 rounded-lg p-4">
        <p className="text-sm">For complaints or concerns:</p>
        <ul className="list-none space-y-1 mt-2 text-sm">
          <li><strong>Email:</strong> grievance@matchify.pro</li>
          <li><strong>Response Time:</strong> Within 24 hours</li>
          <li><strong>Resolution Time:</strong> Within 15 days</li>
        </ul>
      </div>
    </section>

    <section>
      <h3 className="text-xl font-bold text-white mb-3">11. ACCOUNT TERMINATION</h3>
      <p>We may suspend or terminate your account if you:</p>
      <ul className="list-disc pl-6 space-y-2 mt-2">
        <li>Violate these Terms</li>
        <li>Engage in fraudulent activity</li>
        <li>Abuse or harass other users</li>
        <li>Upload illegal content</li>
        <li>Fail to pay fees</li>
      </ul>
      <p className="mt-2"><strong>Effect:</strong> No refunds for terminated accounts</p>
    </section>

    <section>
      <h3 className="text-xl font-bold text-white mb-3">12. MODIFICATIONS</h3>
      <ul className="list-disc pl-6 space-y-2">
        <li>We may modify these Terms at any time</li>
        <li>Changes effective immediately upon posting</li>
        <li>Continued use constitutes acceptance</li>
        <li>Material changes notified via email (30 days notice)</li>
      </ul>
    </section>

    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 mt-8">
      <p className="text-purple-300 font-semibold mb-2">✓ BY USING MATCHIFY.PRO, YOU ACKNOWLEDGE:</p>
      <ul className="list-disc pl-6 space-y-1 text-sm">
        <li>You have read and understood these Terms</li>
        <li>You agree to be bound by these Terms</li>
        <li>You meet the age requirements</li>
        <li>You understand the risks of sports participation</li>
        <li>You release Matchify.pro from all liability</li>
        <li>You agree to arbitration for dispute resolution</li>
      </ul>
    </div>

    <div className="text-center text-sm text-gray-500 mt-8">
      <p>© 2026 Matchify.pro. All Rights Reserved.</p>
      <p>Contact: legal@matchify.pro</p>
    </div>
  </div>
);

// Privacy Policy Content Component
const PrivacyContent = () => (
  <div className="text-gray-300 space-y-6">
    <div className="text-sm text-gray-400">
      <p><strong>Last Updated:</strong> January 20, 2026</p>
      <p><strong>Effective Date:</strong> January 20, 2026</p>
      <p><strong>Version:</strong> 1.0</p>
    </div>

    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
      <p className="text-blue-300 font-semibold">🔒 YOUR PRIVACY MATTERS</p>
      <p className="text-sm mt-2">This Privacy Policy explains how we collect, use, store, and protect your personal data in compliance with the Digital Personal Data Protection Act, 2023.</p>
    </div>

    <section>
      <h3 className="text-xl font-bold text-white mb-3">1. DATA WE COLLECT</h3>
      
      <h4 className="font-semibold text-white mt-4 mb-2">Personal Information:</h4>
      <ul className="list-disc pl-6 space-y-1">
        <li>Name, email, phone number</li>
        <li>Date of birth, gender</li>
        <li>City, state, country</li>
        <li>Profile photo</li>
        <li>Password (encrypted)</li>
      </ul>

      <h4 className="font-semibold text-white mt-4 mb-2">Payment Information:</h4>
      <ul className="list-disc pl-6 space-y-1">
        <li>UPI ID</li>
        <li>Payment screenshots</li>
        <li>Transaction history</li>
      </ul>

      <h4 className="font-semibold text-white mt-4 mb-2">Tournament Information:</h4>
      <ul className="list-disc pl-6 space-y-1">
        <li>Registration history</li>
        <li>Match results and scores</li>
        <li>Matchify Points and rankings</li>
      </ul>

      <h4 className="font-semibold text-white mt-4 mb-2">Technical Information:</h4>
      <ul className="list-disc pl-6 space-y-1">
        <li>IP address</li>
        <li>Device type and browser</li>
        <li>Usage data and analytics</li>
      </ul>
    </section>

    <section>
      <h3 className="text-xl font-bold text-white mb-3">2. HOW WE USE YOUR DATA</h3>
      <ul className="list-disc pl-6 space-y-2">
        <li><strong>Account Management:</strong> Create and maintain your account</li>
        <li><strong>Tournament Services:</strong> Register you for tournaments, match partners</li>
        <li><strong>Payment Processing:</strong> Verify payments, process refunds</li>
        <li><strong>Communication:</strong> Send confirmations, updates, notifications</li>
        <li><strong>Platform Improvement:</strong> Analyze usage, fix bugs, develop features</li>
        <li><strong>Security:</strong> Detect fraud, prevent unauthorized access</li>
        <li><strong>Legal Compliance:</strong> Comply with tax laws, respond to legal requests</li>
      </ul>
    </section>

    <section>
      <h3 className="text-xl font-bold text-white mb-3">3. DATA SHARING</h3>
      
      <h4 className="font-semibold text-white mt-4 mb-2">With Tournament Organizers:</h4>
      <ul className="list-disc pl-6 space-y-1">
        <li>Your name, email, phone</li>
        <li>Selected categories</li>
        <li>Partner information (if doubles)</li>
        <li><strong>NOT shared:</strong> Password, payment screenshots, full transaction history</li>
      </ul>

      <h4 className="font-semibold text-white mt-4 mb-2">With Service Providers:</h4>
      <ul className="list-disc pl-6 space-y-1">
        <li><strong>Cloudinary:</strong> Image storage (Asia region)</li>
        <li><strong>SendGrid:</strong> Email delivery</li>
        <li><strong>Render:</strong> Platform hosting (India region)</li>
      </ul>

      <h4 className="font-semibold text-white mt-4 mb-2">With Law Enforcement:</h4>
      <ul className="list-disc pl-6 space-y-1">
        <li>If required by court order</li>
        <li>To prevent crime or fraud</li>
        <li>Required by tax authorities</li>
      </ul>

      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mt-4">
        <p className="text-green-300 font-semibold text-sm">✓ WE DO NOT:</p>
        <ul className="list-disc pl-6 space-y-1 text-sm mt-2">
          <li>Sell your data to third parties</li>
          <li>Use your data for unrelated purposes</li>
          <li>Share your data without consent (except as required by law)</li>
        </ul>
      </div>
    </section>

    <section>
      <h3 className="text-xl font-bold text-white mb-3">4. DATA STORAGE & SECURITY</h3>
      
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <p className="text-blue-300 font-semibold mb-2">🇮🇳 DATA LOCALIZATION</p>
        <p className="text-sm">All data is stored in India:</p>
        <ul className="list-disc pl-6 space-y-1 text-sm mt-2">
          <li>Database: PostgreSQL on Render (India region)</li>
          <li>Images: Cloudinary (Asia region)</li>
          <li>Compliant with DPDP Act 2023</li>
        </ul>
      </div>

      <h4 className="font-semibold text-white mt-4 mb-2">Security Measures:</h4>
      <ul className="list-disc pl-6 space-y-1">
        <li>HTTPS encryption for all data transmission</li>
        <li>Bcrypt password hashing (irreversible)</li>
        <li>Database encryption at rest</li>
        <li>Regular security updates</li>
        <li>Rate limiting to prevent attacks</li>
        <li>Admin actions logged in audit trail</li>
      </ul>
    </section>

    <section>
      <h3 className="text-xl font-bold text-white mb-3">5. YOUR RIGHTS (DPDP ACT 2023)</h3>
      
      <div className="space-y-3">
        <div className="bg-slate-700 rounded-lg p-3">
          <p className="font-semibold text-white">✓ Right to Access</p>
          <p className="text-sm mt-1">Request a copy of your personal data</p>
        </div>
        
        <div className="bg-slate-700 rounded-lg p-3">
          <p className="font-semibold text-white">✓ Right to Correction</p>
          <p className="text-sm mt-1">Correct inaccurate or incomplete data</p>
        </div>
        
        <div className="bg-slate-700 rounded-lg p-3">
          <p className="font-semibold text-white">✓ Right to Erasure</p>
          <p className="text-sm mt-1">Request deletion of your personal data</p>
        </div>
        
        <div className="bg-slate-700 rounded-lg p-3">
          <p className="font-semibold text-white">✓ Right to Data Portability</p>
          <p className="text-sm mt-1">Receive your data in machine-readable format</p>
        </div>
        
        <div className="bg-slate-700 rounded-lg p-3">
          <p className="font-semibold text-white">✓ Right to Withdraw Consent</p>
          <p className="text-sm mt-1">Withdraw consent for data processing anytime</p>
        </div>
      </div>

      <p className="mt-4 text-sm">To exercise your rights, email: <strong>dpo@matchify.pro</strong></p>
    </section>

    <section>
      <h3 className="text-xl font-bold text-white mb-3">6. DATA RETENTION</h3>
      <ul className="list-disc pl-6 space-y-2">
        <li><strong>Active accounts:</strong> Data retained while account is active</li>
        <li><strong>Deleted accounts:</strong> Personal data deleted within 30 days</li>
        <li><strong>Transaction records:</strong> Retained for 5 years (tax compliance)</li>
        <li><strong>Aadhaar images:</strong> Deleted within 24 hours after verification</li>
        <li><strong>Payment screenshots:</strong> Retained for 5 years</li>
      </ul>
    </section>

    <section>
      <h3 className="text-xl font-bold text-white mb-3">7. COOKIES</h3>
      <p>We use cookies for:</p>
      <ul className="list-disc pl-6 space-y-1 mt-2">
        <li><strong>Essential:</strong> Authentication, security (required)</li>
        <li><strong>Analytics:</strong> Track usage, improve platform (optional)</li>
        <li><strong>Preferences:</strong> Remember your settings (optional)</li>
      </ul>
      <p className="mt-2 text-sm">You can control cookies through browser settings.</p>
    </section>

    <section>
      <h3 className="text-xl font-bold text-white mb-3">8. CHILDREN'S PRIVACY</h3>
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
        <p className="text-yellow-300 font-semibold mb-2">⚠️ AGE RESTRICTIONS</p>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          <li>Platform is for users 18 years and older</li>
          <li>Users 13-17 may use with parental consent</li>
          <li>Users under 13 are strictly prohibited</li>
          <li>Parents can access and delete child's data</li>
        </ul>
      </div>
    </section>

    <section>
      <h3 className="text-xl font-bold text-white mb-3">9. DATA BREACH NOTIFICATION</h3>
      <p>If a data breach occurs, we will:</p>
      <ul className="list-disc pl-6 space-y-1 mt-2">
        <li>Investigate immediately</li>
        <li>Notify affected users within 72 hours</li>
        <li>Notify Data Protection Board (if required)</li>
        <li>Provide details and steps to protect yourself</li>
      </ul>
    </section>

    <section>
      <h3 className="text-xl font-bold text-white mb-3">10. CONTACT INFORMATION</h3>
      <div className="bg-slate-700 rounded-lg p-4 space-y-2">
        <div>
          <p className="font-semibold text-white">General Inquiries:</p>
          <p className="text-sm">privacy@matchify.pro</p>
        </div>
        <div>
          <p className="font-semibold text-white">Data Protection Officer:</p>
          <p className="text-sm">dpo@matchify.pro</p>
        </div>
        <div>
          <p className="font-semibold text-white">Grievance Officer:</p>
          <p className="text-sm">grievance@matchify.pro</p>
          <p className="text-xs text-gray-400">Response within 24 hours</p>
        </div>
      </div>
    </section>

    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 mt-8">
      <p className="text-purple-300 font-semibold mb-2">✓ BY USING MATCHIFY.PRO, YOU CONSENT TO:</p>
      <ul className="list-disc pl-6 space-y-1 text-sm">
        <li>Collection and use of your data as described</li>
        <li>Data storage in India</li>
        <li>Sharing with service providers</li>
        <li>Disclosure if required by law</li>
      </ul>
      <p className="text-sm mt-3">You can withdraw consent anytime (with service limitations)</p>
    </div>

    <div className="text-center text-sm text-gray-500 mt-8">
      <p><strong>Compliant with:</strong></p>
      <p>Digital Personal Data Protection Act, 2023 | Information Technology Act, 2000</p>
      <p className="mt-2">© 2026 Matchify.pro. All Rights Reserved.</p>
    </div>
  </div>
);

export default RegisterPage;
