import { useState, useEffect } from 'react';

const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

const isInStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true;

// ── Icons ────────────────────────────────────────────────────────────────────
const DownloadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ── iOS instruction modal ─────────────────────────────────────────────────────
const IOSModal = ({ onClose }) => (
  <div
    onClick={onClose}
    style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(0,0,0,0.72)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      padding: '0 0 20px',
    }}
  >
    <div
      onClick={e => e.stopPropagation()}
      style={{
        width: '100%', maxWidth: 440,
        background: '#0d1a2e',
        border: '1px solid rgba(0,180,255,0.25)',
        borderRadius: '24px 24px 16px 16px',
        padding: '24px 24px 32px',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.6)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <p style={{ fontSize: 18, fontWeight: 800, color: '#fff', fontFamily: 'system-ui,-apple-system,sans-serif' }}>
            Install <span style={{ color: '#00b4ff' }}>Matchify.pro</span>
          </p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2, fontFamily: 'system-ui,-apple-system,sans-serif' }}>
            Add to your Home Screen in 3 steps
          </p>
        </div>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.08)', border: 'none',
          borderRadius: 999, padding: 8, cursor: 'pointer',
          color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center',
        }}>
          <CloseIcon />
        </button>
      </div>

      {/* Steps */}
      {[
        {
          num: '1',
          icon: '⬆️',
          title: 'Tap the Share button',
          sub: 'Bottom center of your Safari browser bar',
        },
        {
          num: '2',
          icon: '📋',
          title: 'Scroll & tap "Add to Home Screen"',
          sub: 'Find it in the share sheet list',
        },
        {
          num: '3',
          icon: '✅',
          title: 'Tap "Add" to confirm',
          sub: 'App appears on your home screen instantly',
        },
      ].map(s => (
        <div key={s.num} style={{
          display: 'flex', alignItems: 'flex-start', gap: 14,
          marginBottom: 16,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 999,
            background: 'rgba(0,180,255,0.12)',
            border: '1px solid rgba(0,180,255,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            fontSize: 16,
          }}>
            {s.icon}
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'system-ui,-apple-system,sans-serif' }}>
              {s.title}
            </p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2, fontFamily: 'system-ui,-apple-system,sans-serif' }}>
              {s.sub}
            </p>
          </div>
        </div>
      ))}

      {/* Safari hint */}
      <div style={{
        marginTop: 4, padding: '10px 14px', borderRadius: 12,
        background: 'rgba(245,158,11,0.1)',
        border: '1px solid rgba(245,158,11,0.2)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ fontSize: 14 }}>🌐</span>
        <p style={{ fontSize: 12, color: 'rgba(245,158,11,0.9)', fontFamily: 'system-ui,-apple-system,sans-serif' }}>
          Must be open in <strong>Safari</strong> — not Chrome or other browsers
        </p>
      </div>
    </div>
  </div>
);

// ── Generic "how to install" modal for Android without prompt ─────────────────
const AndroidModal = ({ onClose }) => (
  <div
    onClick={onClose}
    style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(0,0,0,0.72)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      padding: '0 0 20px',
    }}
  >
    <div
      onClick={e => e.stopPropagation()}
      style={{
        width: '100%', maxWidth: 440,
        background: '#0d1a2e',
        border: '1px solid rgba(0,180,255,0.25)',
        borderRadius: '24px 24px 16px 16px',
        padding: '24px 24px 32px',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.6)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <p style={{ fontSize: 18, fontWeight: 800, color: '#fff', fontFamily: 'system-ui,-apple-system,sans-serif' }}>
            Install <span style={{ color: '#00b4ff' }}>Matchify.pro</span>
          </p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2, fontFamily: 'system-ui,-apple-system,sans-serif' }}>
            Add to Home Screen from Chrome
          </p>
        </div>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.08)', border: 'none',
          borderRadius: 999, padding: 8, cursor: 'pointer',
          color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center',
        }}>
          <CloseIcon />
        </button>
      </div>

      {[
        { icon: '⋮', title: 'Tap the 3-dot menu', sub: 'Top right corner of Chrome' },
        { icon: '📲', title: 'Tap "Add to Home screen"', sub: 'Or "Install app" if shown' },
        { icon: '✅', title: 'Tap "Add" to confirm', sub: 'App is added to your home screen' },
      ].map(s => (
        <div key={s.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 999,
            background: 'rgba(0,180,255,0.12)',
            border: '1px solid rgba(0,180,255,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, fontSize: 16, fontWeight: 900, color: '#00b4ff',
            fontFamily: 'system-ui,-apple-system,sans-serif',
          }}>
            {s.icon}
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'system-ui,-apple-system,sans-serif' }}>
              {s.title}
            </p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2, fontFamily: 'system-ui,-apple-system,sans-serif' }}>
              {s.sub}
            </p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
const PWAInstallButton = ({ fullWidth = true }) => {
  const [prompt, setPrompt]       = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (isInStandalone()) { setInstalled(true); return; }

    const onPrompt   = (e) => { e.preventDefault(); setPrompt(e); };
    const onInstalled = () => { setInstalled(true); setPrompt(null); };

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed) return null;

  const handleClick = async () => {
    if (prompt) {
      // Android Chrome — native install dialog
      prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === 'accepted') setInstalled(true);
    } else {
      // iOS or Android without prompt — show instructions
      setShowModal(true);
    }
  };

  return (
    <>
      <div style={{ width: fullWidth ? '100%' : 'auto' }}>
        {/* Divider */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 8, marginBottom: 10,
        }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          <span style={{
            fontSize: 11, color: 'rgba(255,255,255,0.32)',
            fontFamily: 'system-ui,-apple-system,sans-serif',
            letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>
            install the app
          </span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
        </div>

        {/* Button */}
        <button
          onClick={handleClick}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 10,
            width: fullWidth ? '100%' : 'auto',
            padding: '13px 20px',
            borderRadius: 16,
            border: '1px solid rgba(0,180,255,0.3)',
            background: 'rgba(0,180,255,0.08)',
            color: 'rgba(255,255,255,0.9)',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'system-ui,-apple-system,sans-serif',
            letterSpacing: '0.01em',
            outline: 'none',
            WebkitTapHighlightColor: 'transparent',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(0,180,255,0.14)';
            e.currentTarget.style.borderColor = 'rgba(0,180,255,0.5)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(0,180,255,0.08)';
            e.currentTarget.style.borderColor = 'rgba(0,180,255,0.3)';
          }}
        >
          <span style={{ color: '#00b4ff', display: 'flex', alignItems: 'center' }}>
            <DownloadIcon />
          </span>
          <span>
            Install <span style={{ color: '#00b4ff' }}>Matchify.pro</span> App
          </span>
          <span style={{
            fontSize: 10, padding: '2px 8px', borderRadius: 999,
            background: 'rgba(0,180,255,0.15)',
            color: 'rgba(0,180,255,0.9)',
            fontWeight: 700, letterSpacing: '0.04em', flexShrink: 0,
          }}>
            FREE
          </span>
        </button>

        <p style={{
          textAlign: 'center', marginTop: 7,
          fontSize: 11, color: 'rgba(255,255,255,0.25)',
          fontFamily: 'system-ui,-apple-system,sans-serif',
        }}>
          Works on iPhone & Android · No app store needed
        </p>
      </div>

      {showModal && (
        isIOS()
          ? <IOSModal onClose={() => setShowModal(false)} />
          : <AndroidModal onClose={() => setShowModal(false)} />
      )}
    </>
  );
};

export default PWAInstallButton;
