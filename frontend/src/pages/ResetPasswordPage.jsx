import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import api from '../utils/api';
import MatchifyLogo from '../components/MatchifyLogo';
import Spinner from '../components/Spinner';

const ResetPasswordPage = () => {
  const [searchParams]             = useSearchParams();
  const navigate                   = useNavigate();
  const token                      = searchParams.get('token');

  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew]                 = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [loading, setLoading]                 = useState(false);
  const [success, setSuccess]                 = useState(false);
  const [error, setError]                     = useState('');

  // Redirect if no token in URL
  useEffect(() => {
    if (!token) {
      navigate('/forgot-password', { replace: true });
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword });
      setSuccess(true);
      // Auto-redirect to login after 3 seconds
      setTimeout(() => navigate('/login', { replace: true }), 3000);
    } catch (err) {
      setError(err?.response?.data?.error || 'Reset failed. The link may have expired. Please request a new one.');
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
    padding: '13px 44px 13px 14px',
  };

  if (!token) return null;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#040810', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        .rp-input:focus { border-color: rgba(245,158,11,0.45) !important; box-shadow: 0 0 0 3px rgba(245,158,11,0.08); }
        .rp-input::placeholder { color: rgba(255,255,255,0.2); }
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

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
            <MatchifyLogo size={72} />
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>India's Premier Badminton Platform</p>
        </div>

        <div style={{ background: 'linear-gradient(145deg, rgba(12,18,32,0.95), rgba(10,15,26,0.95))', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 20, padding: 24, backdropFilter: 'blur(20px)', boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }}>

          {success ? (
            /* ── Success ── */
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 12px' }}>Password Reset!</h2>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, margin: '0 0 8px' }}>
                Your password has been updated successfully.
              </p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: '0 0 24px' }}>
                Redirecting to login in 3 seconds…
              </p>
              <Link
                to="/login"
                style={{ display: 'block', padding: '13px 16px', background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#0C0900', borderRadius: 12, fontWeight: 800, fontSize: 14, textDecoration: 'none', textAlign: 'center' }}
              >
                Go to Login →
              </Link>
            </div>
          ) : (
            /* ── Form ── */
            <>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 700, color: '#FCD34D', marginBottom: 12 }}>
                  🔐 New Password
                </div>
                <h1 style={{ fontSize: 28, fontWeight: 900, lineHeight: 1.1, marginBottom: 6, background: 'linear-gradient(135deg, #ffffff 0%, #FCD34D 50%, #F59E0B 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  Set New Password
                </h1>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>Choose a strong password for your account</p>
              </div>

              {error && (
                <div style={{ marginBottom: 18, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, fontSize: 13, color: '#F87171' }}>
                  ⚠️ {error}
                  {error.includes('expired') && (
                    <span> <Link to="/forgot-password" style={{ color: '#FCD34D', fontWeight: 700 }}>Request new link →</Link></span>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {/* New password */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNew ? 'text' : 'password'}
                      autoComplete="new-password"
                      className="rp-input"
                      style={inputBase}
                      placeholder="Min 6 characters"
                      value={newPassword}
                      onChange={e => { setNewPassword(e.target.value); setError(''); }}
                    />
                    <button type="button" onClick={() => setShowNew(!showNew)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      {showNew ? <EyeSlashIcon style={{ width: 18, height: 18 }} /> : <EyeIcon style={{ width: 18, height: 18 }} />}
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Confirm Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      autoComplete="new-password"
                      className="rp-input"
                      style={{
                        ...inputBase,
                        borderColor: confirmPassword && confirmPassword !== newPassword
                          ? 'rgba(239,68,68,0.5)'
                          : confirmPassword && confirmPassword === newPassword
                          ? 'rgba(74,222,128,0.4)'
                          : 'rgba(255,255,255,0.1)',
                      }}
                      placeholder="Repeat password"
                      value={confirmPassword}
                      onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
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

                {/* Password strength hint */}
                {newPassword.length > 0 && newPassword.length < 6 && (
                  <p style={{ fontSize: 11, color: '#FCD34D', marginTop: -10 }}>At least 6 characters required ({newPassword.length}/6)</p>
                )}

                <button
                  type="submit"
                  disabled={loading || newPassword.length < 6 || newPassword !== confirmPassword}
                  style={{ width: '100%', padding: '14px 16px', background: (loading || newPassword.length < 6 || newPassword !== confirmPassword) ? 'rgba(245,158,11,0.4)' : 'linear-gradient(135deg, #F59E0B, #D97706)', border: 'none', borderRadius: 14, color: '#0C0900', fontSize: 16, fontWeight: 800, cursor: (loading || newPassword.length < 6 || newPassword !== confirmPassword) ? 'not-allowed' : 'pointer', boxShadow: '0 8px 24px rgba(245,158,11,0.25)', transition: 'all 0.2s' }}
                >
                  {loading ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <Spinner size="md" /> Resetting…
                    </span>
                  ) : 'Reset Password →'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
