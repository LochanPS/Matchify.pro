import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import MatchifyLogo from '../components/MatchifyLogo';
import Spinner from '../components/Spinner';

const ForgotPasswordPage = () => {
  const [loginType, setLoginType]   = useState('phone');
  const [credential, setCredential] = useState('');
  const [loading, setLoading]       = useState(false);
  const [sent, setSent]             = useState(false);
  const [error, setError]           = useState('');

  const handleChange = (e) => {
    let val = e.target.value;
    if (loginType === 'phone') val = val.replace(/\D/g, '').slice(0, 10);
    setCredential(val);
    setError('');
  };

  const handleTypeChange = (type) => {
    setLoginType(type);
    setCredential('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!credential.trim()) {
      setError(loginType === 'phone' ? 'Enter your phone number.' : 'Enter your email address.');
      return;
    }
    if (loginType === 'phone' && !/^[0-9]{10}$/.test(credential)) {
      setError('Enter a valid 10-digit phone number.');
      return;
    }
    if (loginType === 'email' && !credential.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { credential });
      setSent(true);
    } catch (err) {
      setError(err?.response?.data?.error || 'Something went wrong. Please try again.');
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
    transition: 'border-color 0.2s',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#040810', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        .fp-input:focus { border-color: rgba(245,158,11,0.45) !important; box-shadow: 0 0 0 3px rgba(245,158,11,0.08); }
        .fp-input::placeholder { color: rgba(255,255,255,0.2); }
        @keyframes fadeUp { 0%{opacity:0;transform:translateY(20px)} 100%{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* Ambient orbs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: 400, height: 400, top: -150, right: -100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', width: 350, height: 350, bottom: '5%', left: -100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)', filter: 'blur(80px)' }} />
      </div>

      {/* Header */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(4,8,16,0.96)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
            <MatchifyLogo size={42} />
          </Link>
          <Link to="/login" style={{ height: 36, padding: '0 18px', background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#0C0900', borderRadius: 10, fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            Back to Login
          </Link>
        </div>
      </div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 480, margin: '0 auto', width: '100%', padding: '88px 16px 32px', animation: 'fadeUp 0.5s ease-out' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
            <MatchifyLogo size={72} />
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>India's Premier Badminton Platform</p>
        </div>

        {/* Card */}
        <div style={{ background: 'linear-gradient(145deg, rgba(12,18,32,0.95), rgba(10,15,26,0.95))', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 20, padding: 24, backdropFilter: 'blur(20px)', boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }}>

          {sent ? (
            /* ── Success state ── */
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 12px' }}>Check your email</h2>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, margin: '0 0 24px' }}>
                If an account is registered with that {loginType === 'phone' ? 'phone number' : 'email'}, we've sent a password reset link. Check your inbox and spam folder.
              </p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: '0 0 20px' }}>Link expires in 1 hour.</p>
              <Link
                to="/login"
                style={{ display: 'block', padding: '13px 16px', background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#0C0900', borderRadius: 12, fontWeight: 800, fontSize: 14, textDecoration: 'none', textAlign: 'center' }}
              >
                Back to Login
              </Link>
              <button
                onClick={() => { setSent(false); setCredential(''); }}
                style={{ marginTop: 12, background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}
              >
                Try a different account
              </button>
            </div>
          ) : (
            /* ── Form state ── */
            <>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 700, color: '#FCD34D', marginBottom: 12 }}>
                  🔑 Reset Password
                </div>
                <h1 style={{ fontSize: 28, fontWeight: 900, lineHeight: 1.1, marginBottom: 6, background: 'linear-gradient(135deg, #ffffff 0%, #FCD34D 50%, #F59E0B 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  Forgot Password?
                </h1>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>We'll send a reset link to your email</p>
              </div>

              {error && (
                <div style={{ marginBottom: 18, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, fontSize: 13, color: '#F87171' }}>
                  ⚠️ {error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {/* Type toggle */}
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Identify with</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {['phone', 'email'].map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleTypeChange(type)}
                        style={{ padding: '11px 12px', borderRadius: 12, fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: loginType === type ? 'linear-gradient(135deg, #F59E0B, #D97706)' : 'rgba(255,255,255,0.05)', color: loginType === type ? '#0C0900' : 'rgba(255,255,255,0.45)', boxShadow: loginType === type ? '0 4px 12px rgba(245,158,11,0.3)' : 'none' }}
                      >
                        {type === 'phone' ? '📱 Phone' : '✉️ Email'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input */}
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
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel"
                        className="fp-input"
                        style={{ flex: 1, padding: '13px 12px', background: 'transparent', border: 'none', color: '#fff', fontSize: 15, outline: 'none' }}
                        placeholder="9876543210"
                        value={credential}
                        onChange={handleChange}
                        maxLength={10}
                      />
                    </div>
                  ) : (
                    <input
                      type="email"
                      autoComplete="email"
                      className="fp-input"
                      style={{ ...inputBase, padding: '13px 14px' }}
                      placeholder="you@example.com"
                      value={credential}
                      onChange={handleChange}
                    />
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{ width: '100%', padding: '14px 16px', background: loading ? 'rgba(245,158,11,0.4)' : 'linear-gradient(135deg, #F59E0B, #D97706)', border: 'none', borderRadius: 14, color: '#0C0900', fontSize: 16, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 8px 24px rgba(245,158,11,0.35)', transition: 'all 0.2s' }}
                >
                  {loading ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <Spinner size="md" /> Sending…
                    </span>
                  ) : 'Send Reset Link →'}
                </button>
              </form>

              <div style={{ marginTop: 20, textAlign: 'center' }}>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)' }}>
                  Remember your password?{' '}
                  <Link to="/login" style={{ fontWeight: 700, color: '#FCD34D', textDecoration: 'none' }}>
                    Back to Login
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
