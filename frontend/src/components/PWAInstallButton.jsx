import { useState, useEffect } from 'react';

const DownloadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const SmartphoneIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
    <line x1="12" y1="18" x2="12.01" y2="18" />
  </svg>
);

const PWAInstallButton = ({ fullWidth = true }) => {
  const [prompt, setPrompt]       = useState(null);
  const [installed, setInstalled] = useState(false);
  const [pressed, setPressed]     = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      return;
    }

    const onPrompt = (e) => { e.preventDefault(); setPrompt(e); };
    const onInstalled = () => { setInstalled(true); setPrompt(null); };

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed || !prompt) return null;

  const handleInstall = async () => {
    if (!prompt) return;
    setPressed(true);
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') {
      setInstalled(true);
      setPrompt(null);
    } else {
      setPressed(false);
    }
  };

  return (
    <div style={{ width: fullWidth ? '100%' : 'auto' }}>
      {/* Label row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 6, marginBottom: 8,
      }}>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
        <span style={{
          fontSize: 11, color: 'rgba(255,255,255,0.35)',
          fontFamily: 'system-ui,-apple-system,sans-serif',
          letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>
          or install the app
        </span>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
      </div>

      {/* Install button */}
      <button
        onClick={handleInstall}
        disabled={pressed}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 10,
          width: fullWidth ? '100%' : 'auto',
          padding: '13px 20px',
          borderRadius: 16,
          border: '1px solid rgba(0,180,255,0.3)',
          background: pressed
            ? 'rgba(0,180,255,0.14)'
            : 'rgba(0,180,255,0.08)',
          color: 'rgba(255,255,255,0.9)',
          fontSize: 14,
          fontWeight: 600,
          cursor: pressed ? 'default' : 'pointer',
          fontFamily: 'system-ui,-apple-system,sans-serif',
          letterSpacing: '0.01em',
          transition: 'background 0.15s, border-color 0.15s, box-shadow 0.15s',
          boxShadow: '0 0 0 0 rgba(0,180,255,0)',
          outline: 'none',
          WebkitTapHighlightColor: 'transparent',
        }}
        onMouseEnter={e => {
          if (!pressed) {
            e.currentTarget.style.background = 'rgba(0,180,255,0.13)';
            e.currentTarget.style.borderColor = 'rgba(0,180,255,0.5)';
            e.currentTarget.style.boxShadow = '0 0 18px rgba(0,180,255,0.18)';
          }
        }}
        onMouseLeave={e => {
          if (!pressed) {
            e.currentTarget.style.background = 'rgba(0,180,255,0.08)';
            e.currentTarget.style.borderColor = 'rgba(0,180,255,0.3)';
            e.currentTarget.style.boxShadow = '0 0 0 0 rgba(0,180,255,0)';
          }
        }}
      >
        <span style={{ color: '#00b4ff', display: 'flex', alignItems: 'center' }}>
          <DownloadIcon />
        </span>
        <span>
          Install <span style={{ color: '#00b4ff' }}>Matchify.pro</span> — Free
        </span>
        <span style={{
          display: 'flex', alignItems: 'center', gap: 3,
          fontSize: 11, padding: '2px 7px', borderRadius: 999,
          background: 'rgba(0,180,255,0.15)',
          color: 'rgba(0,180,255,0.9)',
          fontWeight: 700, letterSpacing: '0.03em',
          flexShrink: 0,
        }}>
          <SmartphoneIcon />
          APP
        </span>
      </button>

      {/* Subtext */}
      <p style={{
        textAlign: 'center', marginTop: 7,
        fontSize: 11, color: 'rgba(255,255,255,0.28)',
        fontFamily: 'system-ui,-apple-system,sans-serif',
      }}>
        Works offline · No app store needed
      </p>
    </div>
  );
};

export default PWAInstallButton;
