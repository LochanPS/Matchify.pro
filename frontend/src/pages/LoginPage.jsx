import { getErrorMessage } from '../utils/errorMessage';
import { useState } from 'react';
import { useNavigate, Link, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { EyeIcon, EyeSlashIcon, EnvelopeIcon, LockClosedIcon, ArrowRightIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { Zap, Trophy, Users, MapPin, Ban, AlertTriangle } from 'lucide-react';
import MatchifyLogo from '../components/MatchifyLogo';
import Spinner from '../components/Spinner';

// Fixed star positions — no random on re-render
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

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [bannedModal, setBannedModal]   = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect');
  const successMsg = location.state?.successMessage || '';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) { setError('All fields are required'); return; }
    setLoading(true);
    setError('');
    try {
      const user = await login(formData.email, formData.password);
      
      if (redirectUrl) { 
        navigate(redirectUrl); 
        return; 
      }
      
      // Check if user is admin - multiple ways to detect
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
      if (err.response?.status === 403 && err.response?.data?.isSuspended) {
        setBannedModal({
          reason: err.response.data.suspensionReason || 'Violation of terms of service',
          message: err.response.data.message,
        });
      } else {
        setError(getErrorMessage(err, 'Login failed. Please try again.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const inputBase = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.12)',
  };
  const inputFocus = 'w-full pl-11 pr-4 py-3.5 rounded-xl text-white text-sm placeholder-white/25 outline-none transition-all focus:ring-1 focus:ring-green-400/60';

  return (
    <div className="min-h-screen flex" style={{ background: '#07071a' }}>

      {/* ── LEFT PANEL (desktop only) ── */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-center items-center p-12"
        style={{ background: 'linear-gradient(135deg, #07071a 0%, #0d1a2a 50%, #07071a 100%)' }}
      >
        {/* Grid */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(245,158,11,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(245,158,11,0.04) 1px,transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        <StarField />

        {/* Glows */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)' }} />

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Logo */}
          <div className="mb-6 animate-float">
            <MatchifyLogo size={130} variant="full" />
          </div>

          <h1 className="text-5xl font-black mb-3" style={{ letterSpacing: '-0.02em' }}>
            <span style={{ color: '#D97706', textShadow: '0 0 15px rgba(245,158,11,0.3)' }}>matchify.pro</span>
          </h1>
          <p className="text-base mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>India's Premier Badminton Platform</p>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-10 text-sm font-medium"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', color: '#F59E0B' }}>
            <SparklesIcon className="w-4 h-4" />
            Where Champions Are Made
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
            {[
              { icon: Users,  val: '1000+', label: 'Players',     c: '#F59E0B' },
              { icon: Trophy, val: '50+',   label: 'Tournaments', c: '#f59e0b' },
              { icon: MapPin, val: '25+',   label: 'Cities',      c: '#FCD34D' },
            ].map(({ icon: Icon, val, label, c }, i) => (
              <div key={i} className="rounded-2xl p-4 text-center border"
                style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
                <Icon className="w-5 h-5 mx-auto mb-2" style={{ color: c }} />
                <p className="text-2xl font-black" style={{ color: c }}>{val}</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — form ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 relative overflow-hidden min-h-screen">

        {/* Mobile star field */}
        <div className="lg:hidden absolute inset-0">
          <StarField />
        </div>

        {/* Ambient glows */}
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.03) 0%, transparent 60%)' }} />

        <div className="w-full max-w-md relative z-10">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex flex-col items-center gap-2">
              <MatchifyLogo size={80} variant="full" />
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>India's Premier Badminton Platform</span>
            </Link>
          </div>

          {/* Card */}
          <div className="rounded-2xl p-6 sm:p-8" style={{
            background: 'rgba(13,13,36,0.85)',
            border: '1px solid rgba(245,158,11,0.12)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 0 40px rgba(245,158,11,0.05), 0 25px 50px rgba(0,0,0,0.4)',
          }}>

            {/* Heading */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-4"
                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#F59E0B' }}>
                <Zap className="w-3.5 h-3.5" />
                Ready to Play?
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-1">Welcome Back</h2>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Sign in to continue your journey</p>
            </div>

            {successMsg && (
              <div className="mb-5 p-3.5 rounded-xl flex items-center gap-2 text-sm"
                style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.3)', color: '#4ade80' }}>
                <span className="flex-shrink-0">✅</span>
                <span>{successMsg}</span>
              </div>
            )}

            {error && (
              <div className="mb-5 p-3.5 rounded-xl flex items-center gap-2 text-sm"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                <span className="flex-shrink-0">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  Email
                </label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px]"
                    style={{ color: 'rgba(255,255,255,0.3)' }} />
                  <input
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    className={inputFocus}
                    style={inputBase}
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  Password
                </label>
                <div className="relative">
                  <LockClosedIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px]"
                    style={{ color: 'rgba(255,255,255,0.3)' }} />
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    className={`${inputFocus} pr-11`}
                    style={inputBase}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors hover:text-white"
                    style={{ color: 'rgba(255,255,255,0.3)' }}
                  >
                    {showPassword ? <EyeSlashIcon className="w-[18px] h-[18px]" /> : <EyeIcon className="w-[18px] h-[18px]" />}
                  </button>
                </div>
              </div>

              {/* Remember / Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded accent-green-500" />
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Remember me</span>
                </label>
                <a href="#" className="text-xs font-medium" style={{ color: '#F59E0B' }}>Forgot password?</a>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl font-bold text-sm transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #D97706, #F59E0B)',
                  color: '#050810',
                  boxShadow: '0 0 25px rgba(245,158,11,0.4)',
                }}
              >
                {loading ? (
                  <>
                    <Spinner size="sm" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Let's Go!
                    <ArrowRightIcon className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>or</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
              </div>

              {/* Register link */}
              <p className="text-center text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Don't have an account?{' '}
                <Link
                  to={redirectUrl ? `/register?redirect=${encodeURIComponent(redirectUrl)}` : '/register'}
                  className="font-bold transition-colors hover:underline"
                  style={{ color: '#F59E0B' }}
                >
                  Create one free →
                </Link>
              </p>

            </form>
          </div>

          {/* Mobile stats strip */}
          <div className="lg:hidden mt-6 grid grid-cols-3 gap-3">
            {[
              { val: '1000+', label: 'Players',     c: '#F59E0B' },
              { val: '50+',   label: 'Tournaments', c: '#f59e0b' },
              { val: '25+',   label: 'Cities',      c: '#FCD34D' },
            ].map(({ val, label, c }, i) => (
              <div key={i} className="rounded-xl py-2.5 text-center border"
                style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
                <p className="text-lg font-black" style={{ color: c }}>{val}</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</p>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ── BANNED MODAL ── */}
      {bannedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden border"
            style={{ background: '#0d0d24', borderColor: 'rgba(239,68,68,0.3)' }}>
            <div className="p-5 border-b flex items-center gap-4"
              style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(239,68,68,0.08)' }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(239,68,68,0.15)' }}>
                <Ban className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-red-400">Account Suspended</h3>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Your account has been suspended</p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Reason:</p>
                <p className="text-sm font-medium text-white">{bannedModal.reason}</p>
              </div>
              <div className="p-4 rounded-xl flex items-start gap-3"
                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Contact <span style={{ color: '#F59E0B' }}>support@matchify.pro</span> if this is a mistake.
                </p>
              </div>
            </div>
            <div className="p-5 border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
              <button
                onClick={() => setBannedModal(null)}
                className="w-full py-3 rounded-xl text-sm font-medium transition-all hover:bg-white/10"
                style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;

