import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import api from '../utils/api';
import { getErrorMessage } from '../utils/errorMessage';
import MatchifyLogo from '../components/MatchifyLogo';
import Spinner from '../components/Spinner';

const STEP = { CREDENTIAL: 0, OTP: 1, PASSWORD: 2 };

const ForgotPasswordPage = () => {
  const navigate = useNavigate();

  const [step, setStep]                       = useState(STEP.CREDENTIAL);
  const [loginType, setLoginType]             = useState('phone');
  const [credential, setCredential]           = useState('');
  const [otp, setOtp]                         = useState(['', '', '', '', '', '']);
  const [resetToken, setResetToken]           = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew]                 = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState('');
  const [resendCooldown, setResendCooldown]   = useState(0);
  const [resetSuccess, setResetSuccess]       = useState(false);

  const otpRefs      = useRef([]);
  const isVerifying  = useRef(false); // prevent concurrent OTP verify calls

  // Countdown for resend button
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // Auto-focus first OTP box on step change
  useEffect(() => {
    if (step === STEP.OTP) {
      setTimeout(() => otpRefs.current[0]?.focus(), 150);
    }
  }, [step]);

  /* ── Step 0: Credential ── */
  const handleCredentialChange = (e) => {
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

  const sendOtp = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { credential: credential.trim().toLowerCase() });
      setStep(STEP.OTP);
      setOtp(['', '', '', '', '', '']);
      setResendCooldown(60);
    } catch (err) {
      setError(getErrorMessage(err, 'Something went wrong. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleCredentialSubmit = async (e) => {
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
    await sendOtp();
  };

  /* ── Step 1: OTP ── */
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    setError('');
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
    if (next.every(d => d) && value) verifyOtp(next.join(''));
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (digits.length === 6) {
      setOtp(digits.split(''));
      otpRefs.current[5]?.focus();
      verifyOtp(digits);
    }
  };

  const verifyOtp = async (otpVal) => {
    if (isVerifying.current) return; // block concurrent calls
    isVerifying.current = true;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/verify-reset-otp', { credential: credential.trim().toLowerCase(), otp: otpVal });
      setResetToken(data.resetToken);
      setStep(STEP.PASSWORD);
    } catch (err) {
      setError(getErrorMessage(err, 'Incorrect OTP. Please try again.'));
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } finally {
      setLoading(false);
      isVerifying.current = false;
    }
  };

  const handleOtpSubmit = (e) => {
    e.preventDefault();
    const val = otp.join('');
    if (val.length < 6) { setError('Enter the full 6-digit OTP.'); return; }
    verifyOtp(val);
  };

  /* ── Step 2: New password ── */
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token: resetToken, newPassword });
      setResetSuccess(true);
      setTimeout(() => navigate('/login', { replace: true, state: { successMessage: 'Password reset successfully! Please log in with your new password.' } }), 2500);
    } catch (err) {
      const msg = getErrorMessage(err, 'Reset failed. Please try again.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ── Shared styles ── */
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

  const stepLabels = ['Account', 'Verify OTP', 'New Password'];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#040810', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        .fp-input:focus { border-color: rgba(245,158,11,0.5) !important; box-shadow: 0 0 0 3px rgba(245,158,11,0.08); }
        .fp-input::placeholder { color: rgba(255,255,255,0.2); }
        .otp-box { text-align: center; caret-color: #F59E0B; }
        .otp-box:focus { border-color: #F59E0B !important; box-shadow: 0 0 0 3px rgba(245,158,11,0.15) !important; outline: none; }
        @keyframes fadeUp    { 0%{opacity:0;transform:translateY(18px)} 100%{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn    { 0%{opacity:0;transform:translateY(10px)} 100%{opacity:1;transform:translateY(0)} }
        @keyframes shake     { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-5px)} 40%,80%{transform:translateX(5px)} }
        @keyframes scaleIn   { 0%{opacity:0;transform:scale(0.85)} 100%{opacity:1;transform:scale(1)} }
        .shake    { animation: shake 0.35s ease; }
        .step-anim { animation: fadeIn 0.3s cubic-bezier(0.16,1,0.3,1); }
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
      <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 480, margin: '0 auto', width: '100%', padding: '88px 16px 32px', animation: 'fadeUp 0.45s ease-out' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
            <MatchifyLogo size={68} />
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>India's Premier Sports Platform</p>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          {stepLabels.map((label, i) => {
            const done   = step > i;
            const active = step === i;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 800, transition: 'all 0.3s',
                    background: active ? 'linear-gradient(135deg, #F59E0B, #D97706)' : done ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)',
                    color:      active ? '#0C0900' : done ? '#F59E0B' : 'rgba(255,255,255,0.25)',
                    border:     active ? 'none' : done ? '1px solid rgba(245,158,11,0.4)' : '1px solid rgba(255,255,255,0.1)',
                    boxShadow:  active ? '0 0 12px rgba(245,158,11,0.4)' : 'none',
                  }}>
                    {done ? '✓' : i + 1}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, color: active ? '#FCD34D' : done ? 'rgba(245,158,11,0.6)' : 'rgba(255,255,255,0.2)', whiteSpace: 'nowrap', transition: 'all 0.3s' }}>
                    {label}
                  </span>
                </div>
                {i < 2 && (
                  <div style={{ width: 36, height: 1, background: done ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.08)', marginBottom: 16, margin: '0 6px 16px', transition: 'all 0.3s' }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <div style={{ background: 'linear-gradient(145deg, rgba(12,18,32,0.95), rgba(10,15,26,0.95))', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 20, padding: 24, backdropFilter: 'blur(20px)', boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }}>

          {/* ── STEP 0: Enter credential ── */}
          {step === STEP.CREDENTIAL && (
            <div key="step-0" className="step-anim">
              <div style={{ textAlign: 'center', marginBottom: 22 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 700, color: '#FCD34D', marginBottom: 12 }}>
                  🔑 Reset Password
                </div>
                <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', margin: '0 0 6px', lineHeight: 1.1 }}>
                  Forgot Password?
                </h1>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: 0 }}>
                  We'll send a 6-digit OTP to your registered email
                </p>
              </div>

              {error && (
                <div style={{ marginBottom: 18, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, fontSize: 13, color: '#F87171' }}>
                  ⚠️ {error}
                </div>
              )}

              <form onSubmit={handleCredentialSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 10px' }}>Identify with</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {['phone', 'email'].map(type => (
                      <button key={type} type="button" onClick={() => handleTypeChange(type)}
                        style={{ padding: '11px 12px', borderRadius: 12, fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: loginType === type ? 'linear-gradient(135deg, #F59E0B, #D97706)' : 'rgba(255,255,255,0.05)', color: loginType === type ? '#0C0900' : 'rgba(255,255,255,0.45)', boxShadow: loginType === type ? '0 4px 12px rgba(245,158,11,0.3)' : 'none' }}>
                        {type === 'phone' ? '📱 Phone' : '✉️ Email'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                    {loginType === 'phone' ? 'Phone Number' : 'Email Address'}
                  </label>
                  {loginType === 'phone' ? (
                    <div style={{ display: 'flex', ...inputBase, padding: 0, overflow: 'hidden' }}>
                      <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: 13, fontWeight: 700, color: '#FCD34D', borderRight: '1px solid rgba(255,255,255,0.08)', background: 'rgba(245,158,11,0.07)', flexShrink: 0 }}>
                        +91
                      </span>
                      <input type="tel" inputMode="numeric" autoComplete="tel" className="fp-input"
                        style={{ flex: 1, padding: '13px 12px', background: 'transparent', border: 'none', color: '#fff', fontSize: 15, outline: 'none' }}
                        placeholder="9876543210" value={credential} onChange={handleCredentialChange} maxLength={10} />
                    </div>
                  ) : (
                    <input type="email" autoComplete="email" className="fp-input"
                      style={{ ...inputBase, padding: '13px 14px' }}
                      placeholder="you@example.com" value={credential} onChange={handleCredentialChange} />
                  )}
                </div>

                <button type="submit" disabled={loading}
                  style={{ width: '100%', padding: '14px 16px', background: loading ? 'rgba(245,158,11,0.4)' : 'linear-gradient(135deg, #F59E0B, #D97706)', border: 'none', borderRadius: 14, color: '#0C0900', fontSize: 16, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 8px 24px rgba(245,158,11,0.35)', transition: 'all 0.2s' }}>
                  {loading
                    ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Spinner size="md" /> Sending OTP…</span>
                    : 'Send OTP →'}
                </button>
              </form>

              <div style={{ marginTop: 20, textAlign: 'center' }}>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', margin: 0 }}>
                  Remember your password?{' '}
                  <Link to="/login" style={{ fontWeight: 700, color: '#FCD34D', textDecoration: 'none' }}>Back to Login</Link>
                </p>
              </div>
            </div>
          )}

          {/* ── STEP 1: Enter OTP ── */}
          {step === STEP.OTP && (
            <div key="step-1" className="step-anim">
              <div style={{ textAlign: 'center', marginBottom: 22 }}>
                <div style={{ fontSize: 46, marginBottom: 12, lineHeight: 1 }}>📧</div>
                <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '0 0 10px' }}>Check your email</h1>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: 0 }}>
                  6-digit OTP sent to your registered email
                </p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', margin: '6px 0 0' }}>
                  Expires in 10 minutes · Check spam folder too
                </p>
              </div>

              {error && (
                <div className="shake" key={error} style={{ marginBottom: 18, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, fontSize: 13, color: '#F87171' }}>
                  ⚠️ {error}
                </div>
              )}

              <form onSubmit={handleOtpSubmit}>
                {/* 6 OTP input boxes */}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24 }} onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => otpRefs.current[i] = el}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      className="otp-box"
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      style={{
                        width: 46, height: 54, fontSize: 22, fontWeight: 800,
                        background: digit ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.05)',
                        border: `1.5px solid ${digit ? 'rgba(245,158,11,0.55)' : 'rgba(255,255,255,0.12)'}`,
                        borderRadius: 12, color: '#fff', outline: 'none', transition: 'all 0.15s',
                      }}
                    />
                  ))}
                </div>

                <button type="submit" disabled={loading || otp.join('').length < 6}
                  style={{ width: '100%', padding: '14px 16px', background: (loading || otp.join('').length < 6) ? 'rgba(245,158,11,0.35)' : 'linear-gradient(135deg, #F59E0B, #D97706)', border: 'none', borderRadius: 14, color: '#0C0900', fontSize: 16, fontWeight: 800, cursor: (loading || otp.join('').length < 6) ? 'not-allowed' : 'pointer', boxShadow: '0 8px 24px rgba(245,158,11,0.2)', transition: 'all 0.2s', marginBottom: 16 }}>
                  {loading
                    ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Spinner size="md" /> Verifying…</span>
                    : 'Verify OTP →'}
                </button>
              </form>

              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>Didn't receive it?</p>
                {resendCooldown > 0 ? (
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', margin: 0 }}>Resend in {resendCooldown}s</p>
                ) : (
                  <button onClick={sendOtp} disabled={loading}
                    style={{ background: 'none', border: 'none', color: '#FCD34D', fontSize: 13, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
                    Resend OTP
                  </button>
                )}
                <button
                  onClick={() => { setStep(STEP.CREDENTIAL); setOtp(['', '', '', '', '', '']); setError(''); }}
                  style={{ display: 'block', margin: '14px auto 0', background: 'none', border: 'none', color: 'rgba(255,255,255,0.28)', fontSize: 12, cursor: 'pointer', padding: 0 }}>
                  ← Change email / phone
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: Set new password ── */}
          {step === STEP.PASSWORD && (
            <div key="step-2" className="step-anim">
              <div style={{ textAlign: 'center', marginBottom: 22 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 700, color: '#4ade80', marginBottom: 12 }}>
                  ✓ OTP Verified
                </div>
                <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', margin: '0 0 6px', lineHeight: 1.1 }}>
                  Set New Password
                </h1>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: 0 }}>
                  Choose a strong password for your account
                </p>
              </div>

              {/* Success state */}
              {resetSuccess && (
                <div style={{ textAlign: 'center', padding: '12px 0', animation: 'scaleIn 0.35s cubic-bezier(0.16,1,0.3,1)' }}>
                  <div style={{ fontSize: 52, marginBottom: 16, lineHeight: 1 }}>✅</div>
                  <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 10px' }}>Password Reset!</h2>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, margin: '0 0 6px' }}>
                    Your password has been updated.
                  </p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: '0 0 20px' }}>Redirecting to login…</p>
                  <Link to="/login" replace style={{ display: 'block', padding: '13px 16px', background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#0C0900', borderRadius: 12, fontWeight: 800, fontSize: 14, textDecoration: 'none', textAlign: 'center' }}>
                    Go to Login →
                  </Link>
                </div>
              )}

              {!resetSuccess && error && (
                <div style={{ marginBottom: 18, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, fontSize: 13, color: '#F87171' }}>
                  ⚠️ {error}
                  {(error.toLowerCase().includes('expired') || error.toLowerCase().includes('invalid') || error.toLowerCase().includes('failed')) && (
                    <span style={{ display: 'block', marginTop: 8 }}>
                      <button
                        type="button"
                        onClick={() => { setStep(STEP.CREDENTIAL); setOtp(['','','','','','']); setError(''); setResetToken(''); setNewPassword(''); setConfirmPassword(''); }}
                        style={{ background: 'none', border: 'none', color: '#FCD34D', fontWeight: 700, fontSize: 13, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
                        Request a new OTP →
                      </button>
                    </span>
                  )}
                </div>
              )}

              {!resetSuccess && <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                    New Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input type={showNew ? 'text' : 'password'} autoComplete="new-password" className="fp-input"
                      style={{ ...inputBase, padding: '13px 44px 13px 14px' }}
                      placeholder="Min 6 characters" value={newPassword}
                      onChange={e => { setNewPassword(e.target.value); setError(''); }} />
                    <button type="button" onClick={() => setShowNew(v => !v)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      {showNew ? <EyeSlashIcon style={{ width: 18, height: 18 }} /> : <EyeIcon style={{ width: 18, height: 18 }} />}
                    </button>
                  </div>
                  {newPassword.length > 0 && newPassword.length < 6 && (
                    <p style={{ fontSize: 11, color: '#FCD34D', marginTop: 5 }}>At least 6 characters required ({newPassword.length}/6)</p>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                    Confirm Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input type={showConfirm ? 'text' : 'password'} autoComplete="new-password" className="fp-input"
                      style={{
                        ...inputBase,
                        padding: '13px 44px 13px 14px',
                        borderColor: confirmPassword && confirmPassword !== newPassword
                          ? 'rgba(239,68,68,0.5)'
                          : confirmPassword && confirmPassword === newPassword
                          ? 'rgba(74,222,128,0.4)'
                          : 'rgba(255,255,255,0.1)',
                      }}
                      placeholder="Repeat password" value={confirmPassword}
                      onChange={e => { setConfirmPassword(e.target.value); setError(''); }} />
                    <button type="button" onClick={() => setShowConfirm(v => !v)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      {showConfirm ? <EyeSlashIcon style={{ width: 18, height: 18 }} /> : <EyeIcon style={{ width: 18, height: 18 }} />}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== newPassword && (
                    <p style={{ fontSize: 11, color: '#F87171', marginTop: 5 }}>Passwords do not match</p>
                  )}
                  {confirmPassword && confirmPassword === newPassword && (
                    <p style={{ fontSize: 11, color: '#4ade80', marginTop: 5 }}>✓ Passwords match</p>
                  )}
                </div>

                <button type="submit" disabled={loading || newPassword.length < 6 || newPassword !== confirmPassword}
                  style={{ width: '100%', padding: '14px 16px', background: (loading || newPassword.length < 6 || newPassword !== confirmPassword) ? 'rgba(245,158,11,0.4)' : 'linear-gradient(135deg, #F59E0B, #D97706)', border: 'none', borderRadius: 14, color: '#0C0900', fontSize: 16, fontWeight: 800, cursor: (loading || newPassword.length < 6 || newPassword !== confirmPassword) ? 'not-allowed' : 'pointer', boxShadow: '0 8px 24px rgba(245,158,11,0.25)', transition: 'all 0.2s' }}>
                  {loading
                    ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Spinner size="md" /> Saving…</span>
                    : 'Save New Password →'}
                </button>
              </form>}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
