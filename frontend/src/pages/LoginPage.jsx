import { getErrorMessage } from '../utils/errorMessage';
import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { EyeIcon, EyeSlashIcon, EnvelopeIcon, LockClosedIcon, ArrowRightIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { Zap, Trophy, Users, MapPin, Ban, AlertTriangle } from 'lucide-react';

const LoginPage = () => {
  const [formData, setFormData]     = useState({ email: '', password: '' });
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [bannedModal, setBannedModal]   = useState(null);

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
    if (!formData.email || !formData.password) { setError('All fields are required'); return; }
    setLoading(true);
    setError('');
    try {
      const user = await login(formData.email, formData.password);
      if (redirectUrl) { navigate(redirectUrl); return; }
      const primary = (Array.isArray(user.roles) ? user.roles : [user.role])[0];
      if (primary === 'ADMIN') navigate('/admin-dashboard');
      else navigate(`/dashboard?role=${primary}`);
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.isSuspended) {
        setBannedModal({ reason: err.response.data.suspensionReason || 'Violation of terms of service', message: err.response.data.message });
      } else {
        setError(getErrorMessage(err, 'Login failed. Please try again.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full pl-11 pr-4 py-3.5 rounded-xl text-white text-sm placeholder-white/25 outline-none transition-all focus:ring-1";
  const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' };
  const inputFocusStyle = { '--tw-ring-color': '#00ff88' };

  return (
    <div className="min-h-screen flex" style={{ background: '#07071a' }}>

      {/* ── LEFT PANEL (desktop only) ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-center items-center p-12"
        style={{ background: 'linear-gradient(135deg, #07071a 0%, #0d1a2a 50%, #07071a 100%)' }}>

        {/* grid bg */}
        <div className="absolute inset-0"
          style={{ backgroundImage: 'linear-gradient(rgba(0,255,136,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.04) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />

        {/* ambient glows */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(0,255,136,0.1) 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%)' }} />

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* shield logo */}
          <div className="mb-6" style={{ filter: 'drop-shadow(0 0 30px rgba(0,255,136,0.6))' }}>
            <svg viewBox="0 0 120 140" className="h-24 w-auto">
              <defs>
                <linearGradient id="ls1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00ff88" />
                  <stop offset="100%" stopColor="#007c35" />
                </linearGradient>
              </defs>
              <path d="M60 8 L110 25 L110 70 Q110 115 60 132 Q10 115 10 70 L10 25 Z" fill="url(#ls1)" stroke="rgba(0,255,136,0.5)" strokeWidth="2.5"/>
              <text x="60" y="88" textAnchor="middle" fill="#003320" fontSize="55" fontWeight="900" fontFamily="Arial Black,sans-serif">M</text>
            </svg>
          </div>

          <h1 className="text-5xl font-black mb-3">
            <span style={{ color: '#00ff88', textShadow: '0 0 30px rgba(0,255,136,0.5)' }}>MATCHIFY</span>
            <span style={{ color: '#00d4ff', textShadow: '0 0 30px rgba(0,212,255,0.5)' }}>.PRO</span>
          </h1>
          <p className="text-base mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>India's Premier Badminton Platform</p>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-10 text-sm font-medium"
            style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)', color: '#00ff88' }}>
            <SparklesIcon className="w-4 h-4" />
            Where Champions Are Made
          </div>

          {/* stats */}
          <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
            {[
              { icon: Users,  val: '1000+', label: 'Players',      c: '#00ff88' },
              { icon: Trophy, val: '50+',   label: 'Tournaments',  c: '#f59e0b' },
              { icon: MapPin, val: '25+',   label: 'Cities',       c: '#00d4ff' },
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
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(0,255,136,0.06) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.05) 0%, transparent 70%)' }} />

        <div className="w-full max-w-md relative z-10">

          {/* mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2">
              <svg viewBox="0 0 120 140" className="h-10 w-auto" style={{ filter: 'drop-shadow(0 0 10px rgba(0,255,136,0.6))' }}>
                <defs><linearGradient id="mlg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#00ff88"/><stop offset="100%" stopColor="#007c35"/></linearGradient></defs>
                <path d="M60 8 L110 25 L110 70 Q110 115 60 132 Q10 115 10 70 L10 25 Z" fill="url(#mlg)" stroke="rgba(0,255,136,0.5)" strokeWidth="2"/>
                <text x="60" y="88" textAnchor="middle" fill="#003320" fontSize="55" fontWeight="900" fontFamily="Arial Black,sans-serif">M</text>
              </svg>
              <span className="text-xl font-black">
                <span style={{ color: '#00ff88' }}>MATCHIFY</span>
                <span style={{ color: '#00d4ff' }}>.PRO</span>
              </span>
            </Link>
          </div>

          {/* heading */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-4"
              style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)', color: '#00ff88' }}>
              <Zap className="w-3.5 h-3.5" />
              Ready to Play?
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-1">Welcome Back</h2>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Sign in to continue your journey</p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl flex items-center gap-2 text-sm"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* email */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.7)' }}>Email</label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 w-[18px] h-[18px]" style={{ color: 'rgba(255,255,255,0.3)' }} />
                <input name="email" type="email" required autoComplete="email"
                  className={inputCls} style={inputStyle}
                  placeholder="you@example.com"
                  value={formData.email} onChange={handleChange} />
              </div>
            </div>

            {/* password */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.7)' }}>Password</label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px]" style={{ color: 'rgba(255,255,255,0.3)' }} />
                <input name="password" type={showPassword ? 'text' : 'password'} required autoComplete="current-password"
                  className={`${inputCls} pr-11`} style={inputStyle}
                  placeholder="••••••••"
                  value={formData.password} onChange={handleChange} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {showPassword ? <EyeSlashIcon className="w-[18px] h-[18px]" /> : <EyeIcon className="w-[18px] h-[18px]" />}
                </button>
              </div>
            </div>

            {/* remember / forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded accent-green-500" style={{ background: 'rgba(255,255,255,0.05)' }} />
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Remember me</span>
              </label>
              <a href="#" className="text-xs font-medium" style={{ color: '#00ff88' }}>Forgot password?</a>
            </div>

            {/* submit */}
            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg,#00c853,#00ff88)', color: '#003320', boxShadow: '0 0 20px rgba(0,255,136,0.35)' }}>
              {loading ? (
                <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Signing in...</>
              ) : (
                <><Zap className="w-4 h-4" /> Let's Go! <ArrowRightIcon className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Don't have an account?{' '}
            <Link to={redirectUrl ? `/register?redirect=${encodeURIComponent(redirectUrl)}` : '/register'}
              className="font-bold" style={{ color: '#00ff88' }}>
              Create one now
            </Link>
          </p>
        </div>
      </div>

      {/* ── BANNED MODAL ── */}
      {bannedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden border" style={{ background: '#0d0d24', borderColor: 'rgba(239,68,68,0.3)' }}>
            <div className="p-5 border-b flex items-center gap-4" style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(239,68,68,0.08)' }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.15)' }}>
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
              <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Contact <span style={{ color: '#00ff88' }}>support@matchify.pro</span> if this is a mistake.
                </p>
              </div>
            </div>
            <div className="p-5 border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
              <button onClick={() => setBannedModal(null)}
                className="w-full py-3 rounded-xl text-sm font-medium transition-all"
                style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)' }}>
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
