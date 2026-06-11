import { useState, useEffect } from 'react';

const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
const isInStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true;

// ── Shared icons ──────────────────────────────────────────────────────────────
const DownloadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

// Real iOS share icon (box + arrow up)
const IOSShareIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00b4ff"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </svg>
);

const PlusSquareIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00b4ff"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

const CheckIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00b4ff"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// ── iOS bottom-sheet modal ────────────────────────────────────────────────────
const IOSSheet = ({ onClose }) => (
  <>
    <style>{`
      @keyframes sheetUp {
        from { transform: translateY(100%); opacity: 0; }
        to   { transform: translateY(0);    opacity: 1; }
      }
      @keyframes backdropIn {
        from { opacity: 0; }
        to   { opacity: 1; }
      }
    `}</style>

    {/* Backdrop */}
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 99998,
        background: 'rgba(0,0,0,0.65)',
        animation: 'backdropIn 0.2s ease-out both',
      }}
    />

    {/* Sheet */}
    <div
      style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 99999,
        background: '#0b1628',
        borderTop: '1px solid rgba(0,180,255,0.2)',
        borderRadius: '20px 20px 0 0',
        padding: '0 0 max(24px, env(safe-area-inset-bottom))',
        boxShadow: '0 -12px 60px rgba(0,0,0,0.7)',
        animation: 'sheetUp 0.32s cubic-bezier(0.32,0.72,0,1) both',
        maxWidth: 480, margin: '0 auto',
      }}
    >
      {/* Drag handle */}
      <div style={{
        width: 36, height: 4, borderRadius: 999,
        background: 'rgba(255,255,255,0.18)',
        margin: '12px auto 20px',
      }} />

      {/* Header */}
      <div style={{ padding: '0 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <p style={{
          fontSize: 19, fontWeight: 800, color: '#fff',
          fontFamily: 'system-ui,-apple-system,sans-serif', margin: 0,
        }}>
          Add <span style={{ color: '#00b4ff' }}>Matchify</span> to Home Screen
        </p>
        <p style={{
          fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4,
          fontFamily: 'system-ui,-apple-system,sans-serif',
        }}>
          3 quick steps in Safari
        </p>
      </div>

      {/* Steps */}
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 0 }}>
        {[
          {
            icon: <IOSShareIcon />,
            num: '1',
            title: 'Tap the Share button',
            sub: 'The ⬆ icon at the bottom centre of Safari',
            highlight: true,
          },
          {
            icon: <PlusSquareIcon />,
            num: '2',
            title: 'Tap "Add to Home Screen"',
            sub: 'Scroll down in the share sheet to find it',
            highlight: false,
          },
          {
            icon: <CheckIcon />,
            num: '3',
            title: 'Tap "Add" to confirm',
            sub: 'Matchify appears on your home screen instantly',
            highlight: false,
          },
        ].map((s, i) => (
          <div key={i} style={{ display: 'flex', gap: 14, paddingBottom: i < 2 ? 16 : 0 }}>
            {/* Step number + connector line */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 14,
                background: s.highlight ? 'rgba(0,180,255,0.15)' : 'rgba(255,255,255,0.05)',
                border: `1.5px solid ${s.highlight ? 'rgba(0,180,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {s.icon}
              </div>
              {i < 2 && (
                <div style={{
                  width: 1.5, flex: 1, minHeight: 12,
                  background: 'rgba(0,180,255,0.2)',
                  margin: '4px 0',
                }} />
              )}
            </div>

            {/* Text */}
            <div style={{ paddingTop: 10 }}>
              <p style={{
                fontSize: 15, fontWeight: 700, color: '#fff', margin: 0,
                fontFamily: 'system-ui,-apple-system,sans-serif',
              }}>
                {s.title}
              </p>
              <p style={{
                fontSize: 12, color: 'rgba(255,255,255,0.38)', marginTop: 3,
                fontFamily: 'system-ui,-apple-system,sans-serif', lineHeight: 1.4,
              }}>
                {s.sub}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Safari warning */}
      <div style={{ padding: '0 20px 4px' }}>
        <div style={{
          padding: '11px 14px', borderRadius: 12,
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.22)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>🌐</span>
          <p style={{
            fontSize: 12, color: 'rgba(255,200,80,0.9)', margin: 0,
            fontFamily: 'system-ui,-apple-system,sans-serif', lineHeight: 1.45,
          }}>
            This page must be open in <strong>Safari</strong>. Chrome on iPhone does not support this.
          </p>
        </div>
      </div>

      {/* Close button */}
      <div style={{ padding: '16px 20px 0' }}>
        <button
          onClick={onClose}
          style={{
            width: '100%', padding: '14px', borderRadius: 14,
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.6)', fontSize: 15,
            fontWeight: 600, cursor: 'pointer',
            fontFamily: 'system-ui,-apple-system,sans-serif',
            outline: 'none', WebkitTapHighlightColor: 'transparent',
          }}
        >
          Close
        </button>
      </div>
    </div>
  </>
);

// ── Main component ────────────────────────────────────────────────────────────
const PWAInstallButton = ({ fullWidth = true }) => {
  const [prompt, setPrompt]       = useState(null);
  const [installed, setInstalled] = useState(() => isInStandalone());
  const [showIOSSheet, setShowIOSSheet] = useState(false);

  useEffect(() => {
    if (isInStandalone()) return;
    if (isIOS()) return; // iOS: no prompt event, handled via sheet

    const onPrompt    = (e) => { e.preventDefault(); setPrompt(e); };
    const onInstalled = () => { setInstalled(true); setPrompt(null); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  // Hide if already installed
  if (installed) return null;

  // iOS: show only if NOT standalone (not already installed)
  const iosVisible = isIOS() && !isInStandalone();
  // Android: show only when native prompt is ready
  const androidVisible = !isIOS() && !!prompt;

  if (!iosVisible && !androidVisible) return null;

  const handleClick = async () => {
    if (isIOS()) {
      setShowIOSSheet(true);
      return;
    }
    if (prompt) {
      prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === 'accepted') setInstalled(true);
    }
  };

  return (
    <>
      <div style={{ width: fullWidth ? '100%' : 'auto' }}>
        {/* Divider */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
        }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          <span style={{
            fontSize: 11, color: 'rgba(255,255,255,0.3)',
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
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'system-ui,-apple-system,sans-serif',
            outline: 'none', WebkitTapHighlightColor: 'transparent',
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
            Install <span style={{ color: '#00b4ff' }}>Matchify</span> App
          </span>
          <span style={{
            fontSize: 10, padding: '2px 8px', borderRadius: 999,
            background: 'rgba(0,180,255,0.15)', color: 'rgba(0,180,255,0.9)',
            fontWeight: 700, letterSpacing: '0.04em', flexShrink: 0,
          }}>
            FREE
          </span>
        </button>

        <p style={{
          textAlign: 'center', marginTop: 7,
          fontSize: 11, color: 'rgba(255,255,255,0.22)',
          fontFamily: 'system-ui,-apple-system,sans-serif',
        }}>
          {isIOS() ? 'iPhone · No app store needed' : 'Android · One tap install'}
        </p>
      </div>

      {showIOSSheet && <IOSSheet onClose={() => setShowIOSSheet(false)} />}
    </>
  );
};

export default PWAInstallButton;
