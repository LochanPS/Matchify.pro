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
  SparklesIcon
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
      console.error('Registration error:', err);
      // Show specific error message from backend
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
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
              <input type="checkbox" required className="w-5 h-5 rounded border-white/20 bg-slate-800 text-purple-500 focus:ring-purple-500 focus:ring-offset-0 mt-0.5" />
              <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                I agree to the <a href="#" className="text-purple-400 hover:text-purple-300">Terms of Service</a> and <a href="#" className="text-purple-400 hover:text-purple-300">Privacy Policy</a>
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
    </div>
  );
};

export default RegisterPage;
