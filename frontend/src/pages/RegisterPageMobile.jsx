import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  EyeIcon, EyeSlashIcon, EnvelopeIcon,
  LockClosedIcon, UserIcon, CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { getErrorMessage } from '../utils/errorMessage';
import MatchifyLogo from '../components/MatchifyLogo';
import Spinner from '../components/Spinner';

const RegisterPageMobile = () => {
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', password: '', confirmPassword: '' });
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
    if (e.target.name === 'phone') value = value.replace(/\D/g, '').slice(0, 10);
    setFormData({ ...formData, [e.target.name]: value });
    setError('');
    setConflictError(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) { setError('Full name is required'); return; }
    if (!formData.email && !formData.phone) { setError('Enter your email or phone number (at least one required)'); return; }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { setError('Enter a valid email address'); return; }
    if (formData.phone && !/^[0-9]{10}$/.test(formData.phone)) { setError('Enter a valid 10-digit phone number'); return; }
    const pw = formData.password;
    if (pw.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (!/[A-Z]/.test(pw)) { setError('Password needs one capital letter'); return; }
    if ((pw.match(/[0-9]/g) || []).length < 2) { setError('Password needs two numbers'); return; }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw)) { setError('Password needs one special symbol'); return; }
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return; }
    if (!termsAccepted) { setError('Please accept terms and conditions'); return; }

    setLoading(true);
    setError('');
    try {
      const { confirmPassword, ...dataToSend } = formData;
      if (!dataToSend.email) delete dataToSend.email;
      if (!dataToSend.phone) delete dataToSend.phone;
      await register(dataToSend);
      if (redirectUrl) { navigate(redirectUrl); return; }
      navigate('/dashboard?role=PLAYER');
    } catch (err) {
      if (err?.response?.status === 409) { setConflictError(true); setError(''); }
      else setError(getErrorMessage(err, 'Registration failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const pw = formData.password;
  const pwChecks = {
    upper: /[A-Z]/.test(pw),
    nums: (pw.match(/[0-9]/g) || []).length >= 2,
    symbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw),
  };

  const inputBase = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12, color: '#fff', fontSize: 14,
    outline: 'none', width: '100%', transition: 'border-color 0.2s', boxSizing: 'border-box'
  };

  return (
    <div style={{ minHeight: '100vh', background: '#040810', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @keyframes float{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(16px,-16px) scale(1.03)}66%{transform:translate(-12px,12px) scale(0.97)}}
        @keyframes fadeIn{0%{opacity:0;transform:translateY(16px)}100%{opacity:1;transform:translateY(0)}}
        @keyframes slideDown{0%{transform:translateY(-100%);opacity:0}100%{transform:translateY(0);opacity:1}}
        @keyframes slideUp{0%{opacity:0;transform:translateY(24px)}100%{opacity:1;transform:translateY(0)}}
        @keyframes scaleIn{0%{opacity:0;transform:scale(0.9)}100%{opacity:1;transform:scale(1)}}
        .reg-input:focus{border-color:rgba(245,158,11,0.45)!important;box-shadow:0 0 0 3px rgba(245,158,11,0.07);}
        .reg-input::placeholder{color:rgba(255,255,255,0.2);}
      `}</style>

      {/* Ambient orbs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: 440, height: 440, top: -160, right: -120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)', filter: 'blur(80px)', animation: 'float 12s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', width: 400, height: 400, bottom: '5%', left: -120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)', filter: 'blur(80px)', animation: 'float 15s ease-in-out infinite reverse' }} />
      </div>

      {/* Header */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(4,8,16,0.96)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.07)', animation: 'slideDown 0.4s ease-out' }}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
            <MatchifyLogo size={42} />
          </Link>
          <Link
            to={redirectUrl ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : '/login'}
            style={{ height: 36, padding: '0 16px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)', borderRadius: 10, fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', textDecoration: 'none' }}
          >
            Login
          </Link>
        </div>
      </div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 10, maxWidth: 480, margin: '0 auto', padding: '84px 16px 32px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 24, animation: 'fadeIn 0.6s ease-out 0.2s both' }}>
          <div style={{ display: 'flex', justifyContent: 'center', position: 'relative', marginBottom: 10 }}>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 180, height: 80, background: 'radial-gradient(ellipse, rgba(245,158,11,0.3) 0%, transparent 70%)', filter: 'blur(20px)', animation: 'float 4s ease-in-out infinite', pointerEvents: 'none' }} />
            <div style={{ position: 'relative' }}><MatchifyLogo size={80} /></div>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>India's Premier Badminton Platform</p>
        </div>

        {/* Main Card */}
        <div style={{ background: 'linear-gradient(145deg, rgba(12,18,32,0.95), rgba(10,15,26,0.95))', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 20, padding: '22px 20px', marginBottom: 18, backdropFilter: 'blur(20px)', animation: 'slideUp 0.7s ease-out 0.3s both', boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 22 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 700, color: '#FCD34D', marginBottom: 12 }}>
              ✨ Join the Champions!
            </div>
            <h1 style={{ fontSize: 30, fontWeight: 900, lineHeight: 1.1, marginBottom: 6, background: 'linear-gradient(135deg, #ffffff 0%, #FCD34D 50%, #F59E0B 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Create Account
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Start your badminton journey</p>
          </div>

          {/* Roles */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
              You get all 3 roles ✓
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { icon: '🏸', title: 'Player', desc: 'Compete', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', color: '#FCD34D' },
                { icon: '📋', title: 'Organizer', desc: 'Host', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.2)', color: '#C4B5FD' },
                { icon: '⚖️', title: 'Umpire', desc: 'Officiate', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', color: '#67E8F9' },
              ].map(r => (
                <div key={r.title} style={{ background: r.bg, border: `1px solid ${r.border}`, borderRadius: 12, padding: '10px 6px', textAlign: 'center' }}>
                  <CheckCircleIcon style={{ width: 14, height: 14, color: r.color, margin: '0 auto 4px' }} />
                  <div style={{ fontSize: 20, marginBottom: 3 }}>{r.icon}</div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#fff', marginBottom: 1 }}>{r.title}</p>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{r.desc}</p>
                </div>
              ))}
            </div>
            <p style={{ textAlign: 'center', fontSize: 11, color: '#FCD34D', marginTop: 8 }}>Switch roles anytime from dashboard</p>
          </div>

          {/* Conflict error */}
          {conflictError && (
            <div style={{ marginBottom: 16, padding: '12px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12 }}>
              <p style={{ fontWeight: 700, color: '#F87171', fontSize: 13, marginBottom: 6 }}>⚠️ Account already exists</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>This email or phone is already registered.</p>
              <Link to={redirectUrl ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : '/login'} style={{ display: 'block', textAlign: 'center', padding: '9px 16px', background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#0C0900', borderRadius: 10, fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
                Sign in instead →
              </Link>
            </div>
          )}

          {/* Generic error */}
          {error && (
            <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, fontSize: 13, color: '#F87171' }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Name */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <UserIcon style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 17, height: 17, color: 'rgba(255,255,255,0.3)' }} />
                <input name="name" type="text" required className="reg-input" style={{ ...inputBase, padding: '12px 14px 12px 38px' }} placeholder="Your full name" value={formData.name} onChange={handleChange} />
              </div>
            </div>

            {/* Contact */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Sign-in Contact</label>
                {!formData.email && !formData.phone
                  ? <span style={{ fontSize: 11, color: '#FCD34D', fontWeight: 600 }}>⚠ At least one required</span>
                  : <span style={{ fontSize: 11, color: '#34D399', fontWeight: 600 }}>✓ Good</span>
                }
              </div>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>Enter email, phone, or both — use either to sign in</p>

              {/* Email */}
              <div style={{ position: 'relative', marginBottom: 10 }}>
                <EnvelopeIcon style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 17, height: 17, color: 'rgba(255,255,255,0.3)' }} />
                <input name="email" type="email" className="reg-input" style={{ ...inputBase, padding: '12px 14px 12px 38px', borderColor: formData.email ? 'rgba(245,158,11,0.35)' : 'rgba(255,255,255,0.1)' }} placeholder="Email address (optional)" value={formData.email} onChange={handleChange} />
              </div>

              {/* OR */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.2)' }}>OR</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
              </div>

              {/* Phone */}
              <div style={{ display: 'flex', ...inputBase, padding: 0, overflow: 'hidden', borderColor: formData.phone ? 'rgba(245,158,11,0.35)' : 'rgba(255,255,255,0.1)' }}>
                <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: 12, fontWeight: 700, color: '#FCD34D', borderRight: '1px solid rgba(255,255,255,0.08)', background: 'rgba(245,158,11,0.07)', flexShrink: 0 }}>+91</span>
                <input name="phone" type="tel" inputMode="numeric" maxLength={10} className="reg-input" style={{ flex: 1, padding: '12px 12px', background: 'transparent', border: 'none', color: '#fff', fontSize: 14, outline: 'none' }} placeholder="10-digit number (optional)" value={formData.phone} onChange={handleChange} />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <LockClosedIcon style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 17, height: 17, color: 'rgba(255,255,255,0.3)' }} />
                <input name="password" type={showPassword ? 'text' : 'password'} required className="reg-input" style={{ ...inputBase, padding: '12px 44px 12px 38px' }} placeholder="••••••••" value={formData.password} onChange={handleChange} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  {showPassword ? <EyeSlashIcon style={{ width: 17, height: 17 }} /> : <EyeIcon style={{ width: 17, height: 17 }} />}
                </button>
              </div>
              {pw.length > 0 && (
                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  {[
                    { ok: pwChecks.upper, label: 'A-Z' },
                    { ok: pwChecks.nums, label: '0-9×2' },
                    { ok: pwChecks.symbol, label: '!@#' },
                  ].map(({ ok, label }) => (
                    <span key={label} style={{ fontSize: 11, fontWeight: 600, color: ok ? '#34D399' : 'rgba(255,255,255,0.25)' }}>
                      {ok ? '✓' : '○'} {label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <LockClosedIcon style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 17, height: 17, color: 'rgba(255,255,255,0.3)' }} />
                <input name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} required className="reg-input" style={{ ...inputBase, padding: '12px 44px 12px 38px', borderColor: formData.confirmPassword && formData.confirmPassword === formData.password ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.1)' }} placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  {showConfirmPassword ? <EyeSlashIcon style={{ width: 17, height: 17 }} /> : <EyeIcon style={{ width: 17, height: 17 }} />}
                </button>
              </div>
            </div>

            {/* Terms */}
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
              <input type="checkbox" required checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)} style={{ width: 18, height: 18, marginTop: 2, accentColor: '#F59E0B', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
                I agree to the{' '}
                <Link to="/terms" style={{ color: '#FCD34D', textDecoration: 'none', fontWeight: 600 }}>Terms</Link>
                {' '}and{' '}
                <Link to="/privacy" style={{ color: '#FCD34D', textDecoration: 'none', fontWeight: 600 }}>Privacy Policy</Link>
              </span>
            </label>

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
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {loading
                ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Spinner size="md" /> Creating…</span>
                : '🏸 Create Account'}
            </button>
          </form>

          {/* Divider + login link */}
          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.22)' }}>or</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
            </div>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)' }}>
              Already have an account?{' '}
              <Link to={redirectUrl ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : '/login'} style={{ fontWeight: 700, color: '#FCD34D', textDecoration: 'none' }}>
                Sign in →
              </Link>
            </p>
          </div>
        </div>

        {/* Benefits */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20, animation: 'fadeIn 0.8s ease-out 0.6s both' }}>
          {[
            { icon: '🎁', title: 'Free to Join', desc: 'No hidden fees', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
            { icon: '🏆', title: 'Track Progress', desc: 'Live stats', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
          ].map(b => (
            <div key={b.title} style={{ background: b.bg, border: `1px solid ${b.border}`, borderRadius: 14, padding: '14px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 26, marginBottom: 6 }}>{b.icon}</div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{b.title}</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{b.desc}</p>
            </div>
          ))}
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.2)', fontWeight: 500 }}>
          By signing up, you join India's fastest growing badminton community
        </p>
      </div>
    </div>
  );
};

export default RegisterPageMobile;

