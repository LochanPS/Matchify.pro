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
import { getErrorMessage } from '../utils/errorMessage';
import Spinner from '../components/Spinner';

// Fixed star positions — deterministic, no re-render flicker
const STARS = [
  { x:4,  y:8,  s:2,   c:'#F59E0B', d:0,   dur:2.8 },
  { x:12, y:22, s:1.5, c:'#FCD34D', d:0.4, dur:3.2 },
  { x:22, y:5,  s:1,   c:'#fff',    d:0.8, dur:2.5 },
  { x:33, y:18, s:2.5, c:'#F59E0B', d:1.2, dur:3.5 },
  { x:45, y:30, s:1,   c:'#FCD34D', d:0.3, dur:2.2 },
  { x:55, y:6,  s:1.5, c:'#fff',    d:1.6, dur:3.8 },
  { x:65, y:25, s:2,   c:'#F59E0B', d:0.7, dur:2.9 },
  { x:75, y:12, s:1,   c:'#FCD34D', d:1.1, dur:3.1 },
  { x:85, y:38, s:2.5, c:'#fff',    d:0.5, dur:2.6 },
  { x:92, y:15, s:1.5, c:'#F59E0B', d:1.9, dur:3.4 },
  { x:8,  y:55, s:1,   c:'#FCD34D', d:0.2, dur:3.0 },
  { x:18, y:70, s:2,   c:'#F59E0B', d:1.4, dur:2.7 },
  { x:28, y:85, s:1.5, c:'#fff',    d:0.6, dur:3.6 },
  { x:40, y:60, s:1,   c:'#FCD34D', d:1.8, dur:2.4 },
  { x:50, y:78, s:2,   c:'#F59E0B', d:0.9, dur:3.3 },
  { x:62, y:50, s:1.5, c:'#fff',    d:1.3, dur:2.8 },
  { x:72, y:68, s:1,   c:'#FCD34D', d:0.1, dur:3.7 },
  { x:82, y:82, s:2.5, c:'#F59E0B', d:1.7, dur:2.3 },
  { x:90, y:55, s:1,   c:'#fff',    d:0.4, dur:3.5 },
  { x:96, y:72, s:1.5, c:'#FCD34D', d:2.0, dur:2.9 },
  { x:3,  y:40, s:2,   c:'#F59E0B', d:1.0, dur:3.2 },
  { x:38, y:92, s:1,   c:'#fff',    d:1.5, dur:2.6 },
  { x:58, y:88, s:1.5, c:'#FCD34D', d:0.3, dur:3.9 },
  { x:78, y:45, s:2,   c:'#F59E0B', d:1.6, dur:2.5 },
  { x:95, y:90, s:1,   c:'#fff',    d:0.8, dur:3.1 },
];

const StarField = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
    {STARS.map((s, i) => (
      <div
        key={i}
        className="absolute rounded-full animate-twinkle"
        style={{
          left: `${s.x}%`,
          top: `${s.y}%`,
          width: `${s.s}px`,
          height: `${s.s}px`,
          background: s.c,
          boxShadow: `0 0 ${s.s * 3}px ${s.c}`,
          animationDuration: `${s.dur}s`,
          animationDelay: `${s.d}s`,
        }}
      />
    ))}
  </div>
);

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [conflictError, setConflictError] = useState(false);
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
    setConflictError(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name) {
      setError('Full name is required');
      return;
    }
    if (!formData.email && !formData.phone) {
      setError('Please enter at least your email or phone number');
      return;
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (formData.phone && !/^[0-9]{10}$/.test(formData.phone)) {
      setError('Please enter a valid 10-digit phone number');
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
      // Only send filled fields
      if (!dataToSend.email) delete dataToSend.email;
      if (!dataToSend.phone) delete dataToSend.phone;
      await register(dataToSend);
      
      if (redirectUrl) {
        navigate(redirectUrl);
        return;
      }
      
      // Redirect to unified dashboard
      navigate('/dashboard?role=PLAYER');
    } catch (err) {
      console.error('Registration error:', err);
      if (err?.response?.status === 409) {
        setConflictError(true);
        setError('');
      } else {
        setError(getErrorMessage(err, 'Registration failed. Please try again.'));
      }
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
    <div className="min-h-screen flex" style={{ background: '#07071a' }}>
      {/* Left Side */}
      <div className="hidden lg:flex lg:w-2/5 relative overflow-hidden flex-col justify-center items-center p-12"
        style={{ background: 'linear-gradient(135deg,#07071a 0%,#0d1a2a 50%,#07071a 100%)' }}>
        <div className="absolute inset-0" style={{ backgroundImage:'linear-gradient(rgba(245,158,11,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(245,158,11,0.04) 1px,transparent 1px)', backgroundSize:'60px 60px' }}/>
        <StarField />
        <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full blur-3xl" style={{ background:'radial-gradient(circle,rgba(245,158,11,0.1) 0%,transparent 70%)' }}/>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl" style={{ background:'radial-gradient(circle,rgba(245,158,11,0.07) 0%,transparent 70%)' }}/>
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="mb-5 animate-float" style={{ filter:'drop-shadow(0 0 30px rgba(245,158,11,0.7))' }}>
            <img src="/logo.png" alt="matchify.pro" className="h-20 w-auto" />
          </div>
          <h1 className="text-4xl font-black mb-2">
            <span style={{ color:'#ffffff', textShadow:'0 0 25px rgba(255,255,255,0.3)' }}>matchify</span>
            <span style={{ color:'#F59E0B', textShadow:'0 0 25px rgba(245,158,11,0.5)' }}>.pro</span>
          </h1>
          <p className="text-sm mb-6" style={{ color:'rgba(255,255,255,0.45)' }}>India's fastest growing sports community</p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-xs font-bold" style={{ background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)', color:'#F59E0B' }}>
            <Rocket className="w-3.5 h-3.5" /> Start Your Journey Today!
          </div>
          <div className="space-y-3 w-full max-w-xs">
            {[
              { icon:<Gift className="w-4 h-4"/>, text:'₹10 welcome bonus',       c:'#f59e0b' },
              { icon:<Star className="w-4 h-4"/>, text:'Free to join',              c:'#a78bfa' },
              { icon:<Users className="w-4 h-4"/>,text:'Multiple roles included',   c:'#FCD34D' },
              { icon:<Trophy className="w-4 h-4"/>,text:'Track your progress',      c:'#F59E0B' },
            ].map((item,i)=>(
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl border" style={{ background:'rgba(255,255,255,0.03)', borderColor:'rgba(255,255,255,0.08)' }}>
                <span style={{ color:item.c }}>{item.icon}</span>
                <span className="text-sm" style={{ color:'rgba(255,255,255,0.65)' }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div className="w-full lg:w-3/5 flex items-center justify-center p-4 sm:p-6 overflow-y-auto relative">

        {/* Mobile star field */}
        <div className="lg:hidden absolute inset-0">
          <StarField />
        </div>

        <div className="absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl pointer-events-none" style={{ background:'radial-gradient(circle,rgba(245,158,11,0.06) 0%,transparent 70%)' }}/>
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full blur-3xl pointer-events-none" style={{ background:'radial-gradient(circle,rgba(245,158,11,0.05) 0%,transparent 70%)' }}/>

        <div className="w-full max-w-xl py-8 relative z-10">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-6">
            <Link to="/" className="inline-flex flex-col items-center gap-1">
              <div style={{ filter:'drop-shadow(0 0 16px rgba(245,158,11,0.8))' }}>
                <img src="/logo.png" alt="matchify.pro" className="h-14 w-auto" />
              </div>
              <span className="text-2xl font-black tracking-tight">
                <span style={{ color:'#ffffff', textShadow:'0 0 20px rgba(255,255,255,0.3)' }}>matchify</span>
                <span style={{ color:'#F59E0B', textShadow:'0 0 20px rgba(245,158,11,0.5)' }}>.pro</span>
              </span>
              <span className="text-xs" style={{ color:'rgba(255,255,255,0.35)' }}>India's Premier Sports Platform</span>
            </Link>
          </div>

          {/* Glass card */}
          <div className="rounded-2xl p-5 sm:p-7" style={{
            background: 'rgba(13,13,36,0.85)',
            border: '1px solid rgba(245,158,11,0.12)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 0 40px rgba(245,158,11,0.05), 0 25px 50px rgba(0,0,0,0.4)',
          }}>

          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-3" style={{ background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)', color:'#F59E0B' }}>
              <SparklesIcon className="w-3.5 h-3.5" /> Join the Champions!
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-1">Create Account</h2>
            <p className="text-sm" style={{ color:'rgba(255,255,255,0.4)' }}>Start your sports journey today</p>
          </div>

          {conflictError && (
            <div className="mb-5 p-4 rounded-xl text-sm" style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.3)' }}>
              <p className="font-bold mb-1" style={{ color:'#f87171' }}>⚠️ Account already exists</p>
              <p className="text-xs mb-3" style={{ color:'rgba(255,255,255,0.5)' }}>This email or phone is already registered on Matchify.pro.</p>
              <Link
                to={redirectUrl ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : '/login'}
                className="inline-block w-full text-center py-2.5 rounded-lg text-sm font-bold"
                style={{ background:'linear-gradient(135deg,#F59E0B,#FCD34D)', color:'#07071a' }}
              >
                Sign in to your account →
              </Link>
            </div>
          )}

          {error && (
            <div className="mb-5 p-4 rounded-xl text-sm flex items-start gap-2"
              style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.3)', color:'#f87171' }}>
              <span className="flex-shrink-0 text-base">⚠️</span>
              <span>{typeof error === 'string' ? error : 'Registration failed. Please try again.'}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* All Roles Included - Informational */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                You'll Get All 3 Roles <span style={{ color: '#F59E0B' }}>✓</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {roles.map((role) => (
                  <div
                    key={role.id}
                    className="relative p-4 rounded-xl border" style={{ background:'rgba(245,158,11,0.06)', borderColor:'rgba(245,158,11,0.25)' }}
                  >
                    <CheckCircleIcon className="absolute top-2 right-2 w-5 h-5" style={{ color: '#F59E0B' }} />
                    <div className="text-2xl mb-2">{role.icon}</div>
                    <p className="font-semibold text-white text-sm">{role.title}</p>
                    <p className="text-xs text-gray-500">{role.desc}</p>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs flex items-center gap-1" style={{ color: '#F59E0B' }}>
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
                    className="w-full pl-12 pr-4 py-4 rounded-xl text-white text-sm placeholder-white/25 outline-none transition-all focus:ring-1 focus:ring-green-500/50" style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)' }}
                    placeholder="Your full name"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Contact — Email OR Phone, at least one */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-300">Sign-in Contact</label>
                {!formData.email && !formData.phone ? (
                  <span className="text-xs font-semibold" style={{ color: 'rgba(251,191,36,0.85)' }}>
                    ⚠ Enter email or phone
                  </span>
                ) : (
                  <span className="text-xs font-semibold" style={{ color: '#F59E0B' }}>
                    ✓ Looks good
                  </span>
                )}
              </div>
              <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Enter email, phone, or both — you can use either to sign in later
              </p>

              {/* Email */}
              <div className="relative group mb-3">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
                <div className="relative">
                  <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                  <input
                    name="email"
                    type="email"
                    className="w-full pl-12 pr-4 py-4 rounded-xl text-white text-sm placeholder-white/25 outline-none transition-all focus:ring-1 focus:ring-green-500/50"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                    placeholder="Email address (optional)"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                <span className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.25)' }}>OR</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
              </div>

              {/* Phone */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
                <div className="relative">
                  <PhoneIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                  <input
                    name="phone"
                    type="tel"
                    maxLength={10}
                    className="w-full pl-12 pr-4 py-4 rounded-xl text-white text-sm placeholder-white/25 outline-none transition-all focus:ring-1 focus:ring-green-500/50"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                    placeholder="10-digit phone number (optional)"
                    value={formData.phone}
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
                      className="w-full pl-12 pr-12 py-4 rounded-xl text-white text-sm placeholder-white/25 outline-none transition-all focus:ring-1 focus:ring-green-500/50" style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)' }}
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
                  <p className="text-xs flex items-center gap-1" style={{ color: /[A-Z]/.test(formData.password) ? '#F59E0B' : 'rgba(255,255,255,0.35)' }}>
                    <span>{/[A-Z]/.test(formData.password) ? '✓' : '○'}</span> One uppercase letter
                  </p>
                  <p className="text-xs flex items-center gap-1" style={{ color: (formData.password.match(/[0-9]/g) || []).length >= 2 ? '#F59E0B' : 'rgba(255,255,255,0.35)' }}>
                    <span>{(formData.password.match(/[0-9]/g) || []).length >= 2 ? '✓' : '○'}</span> Two numbers
                  </p>
                  <p className="text-xs flex items-center gap-1" style={{ color: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) ? '#F59E0B' : 'rgba(255,255,255,0.35)' }}>
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
                      className="w-full pl-12 pr-12 py-4 rounded-xl text-white text-sm placeholder-white/25 outline-none transition-all focus:ring-1 focus:ring-green-500/50" style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)' }}
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

            {/* Submit button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ background:'linear-gradient(135deg,#D97706,#F59E0B)', color:'#050810', boxShadow:'0 0 20px rgba(245,158,11,0.35)' }}
              >
                {loading ? (
                  <>
                    <Spinner size="md" />
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

          <div className="mt-6 text-center">
            {/* Divider */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px" style={{ background:'rgba(255,255,255,0.08)' }}/>
              <span className="text-xs" style={{ color:'rgba(255,255,255,0.3)' }}>or</span>
              <div className="flex-1 h-px" style={{ background:'rgba(255,255,255,0.08)' }}/>
            </div>
            <p className="text-sm" style={{ color:'rgba(255,255,255,0.4)' }}>
              Already have an account?{' '}
              <Link to={redirectUrl ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : '/login'}
                className="font-bold transition-colors hover:underline" style={{ color:'#F59E0B' }}>
                Sign in here →
              </Link>
            </p>
          </div>

          </div>{/* end glass card */}
        </div>
      </div>

      {/* Terms of Service Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col" style={{ background: '#0d1025', border: '1px solid rgba(168,85,247,0.3)' }}>
            {/* Header */}
            <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <h2 className="text-2xl font-bold text-white">Terms and Conditions</h2>
              <button
                onClick={() => setShowTermsModal(false)}
                className="p-2 rounded-lg transition-colors"
                style={{ color: 'rgba(255,255,255,0.5)' }}
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 prose prose-invert prose-sm max-w-none">
              <TermsContent />
            </div>
            
            {/* Footer */}
            <div className="p-6 flex justify-end gap-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <button
                onClick={() => setShowTermsModal(false)}
                className="px-6 py-2 rounded-lg transition-colors text-white" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                Close
              </button>
              <button
                onClick={() => {
                  setTermsAccepted(true);
                  setShowTermsModal(false);
                }}
                className="px-6 py-2 rounded-lg hover:shadow-lg transition-all font-bold" style={{ background: 'linear-gradient(135deg,#D97706,#F59E0B)', color: '#050810' }}
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
          <div className="rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col" style={{ background: '#0d1025', border: '1px solid rgba(168,85,247,0.3)' }}>
            {/* Header */}
            <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <h2 className="text-2xl font-bold text-white">Privacy Policy</h2>
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="p-2 rounded-lg transition-colors"
                style={{ color: 'rgba(255,255,255,0.5)' }}
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 prose prose-invert prose-sm max-w-none">
              <PrivacyContent />
            </div>
            
            {/* Footer */}
            <div className="p-6 flex justify-end gap-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="px-6 py-2 rounded-lg transition-colors text-white" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                Close
              </button>
              <button
                onClick={() => {
                  setTermsAccepted(true);
                  setShowPrivacyModal(false);
                }}
                className="px-6 py-2 rounded-lg hover:shadow-lg transition-all font-bold" style={{ background: 'linear-gradient(135deg,#D97706,#F59E0B)', color: '#050810' }}
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
        <li>Charges a <strong>3% platform fee</strong> on all entry fees</li>
        <li>Acts as an intermediary, NOT a tournament organizer</li>
        <li>Handles all payments to prevent scams</li>
        <li>Pays organizers in 2 installments: <strong>30% before + 67% after tournament</strong></li>
      </ul>

      <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 mt-3">
        <p className="text-purple-300 text-sm font-semibold">💡 How it works:</p>
        <ol className="list-decimal pl-6 space-y-1 text-xs mt-2">
          <li>Players pay 100% entry fee to Matchify.pro admin</li>
          <li>Admin verifies payment and confirms registration</li>
          <li>Admin keeps 3% as platform fee</li>
          <li>Admin pays organizer 30% before tournament starts</li>
          <li>Tournament happens</li>
          <li>Admin pays organizer remaining 67% after tournament ends</li>
        </ol>
      </div>
    </section>

    <section>
      <h3 className="text-xl font-bold text-white mb-3">3. PAYMENT TERMS</h3>
      <div className="rounded-lg p-4 mb-4" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
        <p className="font-semibold mb-2" style={{ color: '#F59E0B' }}>💰 PAYMENT BREAKDOWN</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Players pay to:</span>
            <span className="font-semibold text-white">Matchify.pro Admin (100%)</span>
          </div>
          <div className="my-2" style={{ borderTop: '1px solid rgba(245,158,11,0.2)' }}></div>
          <div className="flex justify-between">
            <span>Platform keeps:</span>
            <span className="font-semibold text-purple-300">3% (Platform Fee)</span>
          </div>
          <div className="flex justify-between">
            <span>Organizer gets (Total):</span>
            <span className="font-semibold text-cyan-300">97%</span>
          </div>
          <div className="my-2" style={{ borderTop: '1px solid rgba(245,158,11,0.2)' }}></div>
          <div className="pl-4 space-y-1">
            <div className="flex justify-between text-xs">
              <span>→ First Payment (BEFORE tournament):</span>
              <span className="font-semibold text-white">30%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>→ Second Payment (AFTER tournament):</span>
              <span className="font-semibold text-white">67%</span>
            </div>
          </div>
        </div>
      </div>
      
      <p className="text-sm mb-3"><strong>Example:</strong> If entry fee is ₹1,000</p>
      <ul className="list-none pl-6 space-y-1 text-sm rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <li>• Player pays: <strong className="text-white">₹1,000</strong> to Matchify.pro admin</li>
        <li>• Platform keeps: <strong className="text-purple-300">₹30</strong> (3%)</li>
        <li>• Organizer gets: <strong className="text-cyan-300">₹970</strong> (97%)</li>
        <li className="pl-4 text-xs">→ Before tournament: <strong className="text-white">₹300</strong> (30%)</li>
        <li className="pl-4 text-xs">→ After tournament: <strong className="text-white">₹670</strong> (67%)</li>
      </ul>

      <h4 className="font-semibold text-white mt-4 mb-2">Payment Process:</h4>
      <ul className="list-disc pl-6 space-y-2">
        <li><strong>Payment Method:</strong> UPI transfer to Matchify.pro admin account</li>
        <li><strong>Payment Proof:</strong> Upload screenshot of UPI payment</li>
        <li><strong>Verification:</strong> Admin verifies payment within 24-48 hours</li>
        <li><strong>Confirmation:</strong> Registration confirmed after payment approval</li>
        <li><strong>To Organizer:</strong> Admin pays organizer in 2 installments (30% + 67%)</li>
      </ul>

      <div className="bg-amber-500/10 border border-amber-500/25 rounded-lg p-3 mt-3">
        <p className="text-amber-300 text-sm font-semibold">🔒 Why payments go to admin:</p>
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
          <li>The sport involves physical activity and risk of injury</li>
          <li>You participate entirely at your own risk</li>
          <li>Matchify.pro is NOT liable for injuries, accidents, or health issues</li>
          <li>You release Matchify.pro from all claims related to injuries</li>
          <li>You are responsible for your own medical insurance</li>
        </ul>
      </div>
    </section>

    <section>
      <h3 className="text-xl font-bold text-white mb-3">6. GAMBLING DISCLAIMER</h3>
      <div className="rounded-lg p-4" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
        <p className="font-semibold mb-2" style={{ color: '#F59E0B' }}>✓ GAME OF SKILL</p>
        <ul className="list-disc pl-6 space-y-2 text-sm">
          <li>The sport is a <strong>game of SKILL</strong>, not chance</li>
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
      <div className="bg-amber-500/10 border border-amber-500/25 rounded-lg p-4">
        <p className="text-amber-300 font-semibold mb-2">MAXIMUM LIABILITY</p>
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
      <div className="rounded-lg p-4" style={{ background: 'rgba(255,255,255,0.06)' }}>
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

    <div className="bg-amber-500/10 border border-amber-500/25 rounded-lg p-4">
      <p className="text-amber-300 font-semibold">🔒 YOUR PRIVACY MATTERS</p>
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

      <div className="rounded-lg p-4 mt-4" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
        <p className="font-semibold text-sm" style={{ color: '#F59E0B' }}>✓ WE DO NOT:</p>
        <ul className="list-disc pl-6 space-y-1 text-sm mt-2">
          <li>Sell your data to third parties</li>
          <li>Use your data for unrelated purposes</li>
          <li>Share your data without consent (except as required by law)</li>
        </ul>
      </div>
    </section>

    <section>
      <h3 className="text-xl font-bold text-white mb-3">4. DATA STORAGE & SECURITY</h3>
      
      <div className="bg-amber-500/10 border border-amber-500/25 rounded-lg p-4">
        <p className="text-amber-300 font-semibold mb-2">🇮🇳 DATA LOCALIZATION</p>
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
        <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <p className="font-semibold text-white">✓ Right to Access</p>
          <p className="text-sm mt-1">Request a copy of your personal data</p>
        </div>
        
        <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <p className="font-semibold text-white">✓ Right to Correction</p>
          <p className="text-sm mt-1">Correct inaccurate or incomplete data</p>
        </div>
        
        <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <p className="font-semibold text-white">✓ Right to Erasure</p>
          <p className="text-sm mt-1">Request deletion of your personal data</p>
        </div>
        
        <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <p className="font-semibold text-white">✓ Right to Data Portability</p>
          <p className="text-sm mt-1">Receive your data in machine-readable format</p>
        </div>
        
        <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
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
      <div className="rounded-lg p-4 space-y-2" style={{ background: 'rgba(255,255,255,0.06)' }}>
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


