import { useState, useCallback } from 'react';
import { useNavigate, Link, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { EyeIcon, EyeSlashIcon, LockClosedIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { getErrorMessage } from '../utils/errorMessage';
import MatchifyLogo from '../components/MatchifyLogo';
import Spinner from '../components/Spinner';
import SplashScreen from '../components/SplashScreen';

const LoginPageMobile = () => {
  const [loginType, setLoginType] = useState('phone');
  const [formData, setFormData] = useState({ credential: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [pendingNav, setPendingNav] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect');
  const successMessage = location.state?.successMessage || null;

  const handleChange = (e) => {
    let value = e.target.value;
    if (e.target.name === 'credential' && loginType === 'phone') {
      value = value.replace(/\D/g, '').slice(0, 10);
    }
    setFormData({ ...formData, [e.target.name]: value });
    setError('');
  };

  const handleLoginTypeChange = (type) => {
    setLoginType(type);
    setFormData({ credential: '', password: formData.password });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.credential || !formData.password) {
      setError(`${loginType === 'phone' ? 'Phone number' : 'Email'} and password are required`);
      return;
    }
    if (loginType === 'phone') {
      if (!/^[0-9]{10}$/.test(formData.credential)) {
        setError('Please enter a valid 10-digit phone number');
        return;
      }
    } else {
      if (!formData.credential.includes('@')) {
        setError('Please enter a valid email address');
        return;
      }
    }

    setLoading(true);
    setError('');
    try {
      const user = await login(formData.credential, formData.password);
      // Determine destination
      let dest = redirectUrl;
      if (!dest) {
        const isAdmin = user.isAdmin ||
          (Array.isArray(user.roles) && user.roles.includes('ADMIN')) ||
          (typeof user.roles === 'string' && user.roles.includes('ADMIN')) ||
          user.currentRole === 'ADMIN';
        dest = isAdmin
          ? '/admin-dashboard'
          : `/dashboard?role=${Array.isArray(user.roles) ? user.roles[0] : (user.currentRole || user.role || 'PLAYER')}`;
      }
      // Show transition splash before navigating
      setPendingNav(dest);
      setShowTransition(true);
    } catch (err) {
      setError(getErrorMessage(err, 'Login failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const inputBase = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12,
    color: '#fff',
    fontSize: 15,
    outline: 'none',
    width: '100%',
    transition: 'border-color 0.2s'
  };

  return (
    <>
    {showTransition && (
      <SplashScreen
        duration={2000}
        onComplete={() => { setShowTransition(false); navigate(pendingNav); }}
      />
    )}
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#040810', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @keyframes float { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(18px,-18px) scale(1.04)} 66%{transform:translate(-12px,12px) scale(0.97)} }
        @keyframes fadeIn { 0%{opacity:0;transform:translateY(16px)} 100%{opacity:1;transform:translateY(0)} }
        @keyframes slideDown { 0%{transform:translateY(-100%);opacity:0} 100%{transform:translateY(0);opacity:1} }
        @keyframes slideUp { 0%{opacity:0;transform:translateY(24px)} 100%{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes scaleIn { 0%{opacity:0;transform:scale(0.88)} 100%{opacity:1;transform:scale(1)} }
        .login-input:focus { border-color: rgba(245,158,11,0.45) !important; box-shadow: 0 0 0 3px rgba(245,158,11,0.08); }
        .login-input::placeholder { color: rgba(255,255,255,0.2); }
      `}</style>

      {/* Ambient orbs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: 440, height: 440, top: -160, right: -120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)', filter: 'blur(80px)', animation: 'float 12s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', width: 400, height: 400, bottom: '5%', left: -120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)', filter: 'blur(80px)', animation: 'float 15s ease-in-out infinite reverse' }} />
      </div>

      {/* Header */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(4,8,16,0.96)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        animation: 'slideDown 0.4s ease-out'
      }}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
            <MatchifyLogo size={42} />
          </Link>
          <Link
            to={redirectUrl ? `/register?redirect=${encodeURIComponent(redirectUrl)}` : '/register'}
            style={{
              height: 36, padding: '0 18px',
              background: 'linear-gradient(135deg, #F59E0B, #D97706)',
              color: '#0C0900',
              borderRadius: 10, fontWeight: 700, fontSize: 13,
              display: 'flex', alignItems: 'center',
              boxShadow: '0 4px 12px rgba(245,158,11,0.3)',
              textDecoration: 'none'
            }}
          >
            Sign Up
          </Link>
        </div>
      </div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto', width: '100%', padding: '88px 16px 32px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28, animation: 'fadeIn 0.2s ease-out both' }}>
          <div style={{ display: 'flex', justifyContent: 'center', position: 'relative', marginBottom: 10 }}>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 180, height: 80, background: 'radial-gradient(ellipse, rgba(245,158,11,0.3) 0%, transparent 70%)', filter: 'blur(20px)', animation: 'float 4s ease-in-out infinite', pointerEvents: 'none' }} />
            <div style={{ position: 'relative' }}>
              <MatchifyLogo size={84} />
            </div>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>India's Premier Badminton Platform</p>
        </div>

        {/* Main Card */}
        <div style={{
          background: 'linear-gradient(145deg, rgba(12,18,32,0.95), rgba(10,15,26,0.95))',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: 20,
          padding: 24,
          marginBottom: 20,
          backdropFilter: 'blur(20px)',
          animation: 'fadeIn 0.2s ease-out both',
          boxShadow: '0 16px 48px rgba(0,0,0,0.4)'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: 20, padding: '5px 14px',
              fontSize: 12, fontWeight: 700, color: '#FCD34D',
              marginBottom: 12
            }}>
              ⚡ Ready to Play?
            </div>
            <h1 style={{
              fontSize: 34, fontWeight: 900, lineHeight: 1.1, marginBottom: 6,
              background: 'linear-gradient(135deg, #ffffff 0%, #FCD34D 50%, #F59E0B 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
            }}>
              Welcome Back
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>Sign in to continue your journey</p>
          </div>

          {/* Success message (e.g. after password reset) */}
          {successMessage && (
            <div style={{ marginBottom: 18, padding: '10px 14px', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: 10, fontSize: 13, color: '#4ade80' }}>
              ✓ {successMessage}
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ marginBottom: 18, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, fontSize: 13, color: '#F87171' }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Login type toggle */}
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Login with</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {['phone', 'email'].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleLoginTypeChange(type)}
                    style={{
                      padding: '11px 12px',
                      borderRadius: 12,
                      fontWeight: 700, fontSize: 13,
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      background: loginType === type
                        ? 'linear-gradient(135deg, #F59E0B, #D97706)'
                        : 'rgba(255,255,255,0.05)',
                      color: loginType === type ? '#0C0900' : 'rgba(255,255,255,0.45)',
                      boxShadow: loginType === type ? '0 4px 12px rgba(245,158,11,0.3)' : 'none'
                    }}
                  >
                    {type === 'phone' ? '📱 Phone' : '✉️ Email'}
                  </button>
                ))}
              </div>
            </div>

            {/* Credential input */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                {loginType === 'phone' ? 'Phone Number' : 'Email Address'}
              </label>
              {loginType === 'phone' ? (
                <div style={{ display: 'flex', ...inputBase, padding: 0, overflow: 'hidden' }}>
                  <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: 13, fontWeight: 700, color: '#FCD34D', borderRight: '1px solid rgba(255,255,255,0.08)', background: 'rgba(245,158,11,0.07)', flexShrink: 0 }}>
                    +91
                  </span>
                  <input
                    name="credential"
                    type="tel"
                    inputMode="numeric"
                    required
                    autoComplete="tel"
                    className="login-input"
                    style={{ flex: 1, padding: '13px 12px', background: 'transparent', border: 'none', color: '#fff', fontSize: 15, outline: 'none' }}
                    placeholder="9876543210"
                    value={formData.credential}
                    onChange={handleChange}
                    maxLength={10}
                  />
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <EnvelopeIcon style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: 'rgba(255,255,255,0.3)' }} />
                  <input
                    name="credential"
                    type="email"
                    required
                    autoComplete="email"
                    className="login-input"
                    style={{ ...inputBase, padding: '13px 14px 13px 40px' }}
                    placeholder="you@example.com"
                    value={formData.credential}
                    onChange={handleChange}
                  />
                </div>
              )}
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <LockClosedIcon style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: 'rgba(255,255,255,0.3)' }} />
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  className="login-input"
                  style={{ ...inputBase, padding: '13px 44px 13px 40px' }}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  {showPassword ? <EyeSlashIcon style={{ width: 18, height: 18 }} /> : <EyeIcon style={{ width: 18, height: 18 }} />}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div style={{ textAlign: 'right', marginTop: -8 }}>
              <Link
                to="/forgot-password"
                style={{ fontSize: 13, color: 'rgba(252,211,77,0.8)', fontWeight: 600, textDecoration: 'none' }}
              >
                Forgot Password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '14px 16px',
                background: loading ? 'rgba(245,158,11,0.4)' : 'linear-gradient(135deg, #F59E0B, #D97706)',
                border: 'none', borderRadius: 14,
                color: '#0C0900', fontSize: 16, fontWeight: 800,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 8px 24px rgba(245,158,11,0.35)',
                transition: 'all 0.2s',
                letterSpacing: '0.02em'
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Spinner size="md" /> Signing in…
                </span>
              ) : '⚡ Let\'s Go!'}
            </button>
          </form>

          {/* Divider + sign up link */}
          <div style={{ marginTop: 22, textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>or</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
            </div>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)' }}>
              Don't have an account?{' '}
              <Link
                to={redirectUrl ? `/register?redirect=${encodeURIComponent(redirectUrl)}` : '/register'}
                style={{ fontWeight: 700, color: '#FCD34D', textDecoration: 'none' }}
              >
                Create one free →
              </Link>
            </p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 24, animation: 'fadeIn 0.2s ease-out both' }}>
          {[
            { value: '1000+', label: 'Players', color: '#FCD34D', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' },
            { value: '50+', label: 'Tournaments', color: '#C4B5FD', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.25)' },
            { value: '25+', label: 'Cities', color: '#67E8F9', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' },
          ].map(({ value, label, color, bg, border }) => (
            <div key={label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 14, padding: '14px 8px', textAlign: 'center' }}>
              <p style={{ fontSize: 22, fontWeight: 900, color, margin: 0, lineHeight: 1.1 }}>{value}</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4, fontWeight: 500 }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.25)', marginTop: 'auto' }}>
          🏆 Where Champions Are Made
        </p>
      </div>
    </div>
    </>
  );
};

export default LoginPageMobile;

