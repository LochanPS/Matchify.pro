// Renders the official "Sign in with Google" button via Google Identity
// Services. On success it hands the ID token (credential) back to the parent,
// which posts it to /auth/google. Renders nothing until VITE_GOOGLE_CLIENT_ID
// is configured, so it appears the moment the env var is set — never as a
// broken button before setup.
import { useEffect, useRef, useState } from 'react';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GIS_SRC = 'https://accounts.google.com/gsi/client';

// Load the GIS script once for the whole app.
let scriptPromise = null;
const loadGis = () => {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GIS_SRC}"]`);
    if (existing) { existing.addEventListener('load', resolve); existing.addEventListener('error', reject); return; }
    const s = document.createElement('script');
    s.src = GIS_SRC; s.async = true; s.defer = true;
    s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
  return scriptPromise;
};

export default function GoogleSignInButton({ onCredential, onError, text = 'continue_with', disabled = false }) {
  const divRef = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!CLIENT_ID || !divRef.current) return;
    let cancelled = false;
    loadGis().then(() => {
      if (cancelled || !divRef.current) return;
      try {
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (resp) => { if (resp?.credential) onCredential(resp.credential); },
        });
        divRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(divRef.current, {
          type: 'standard', theme: 'filled_black', size: 'large',
          text, shape: 'pill', logo_alignment: 'center',
          width: Math.min(divRef.current.offsetWidth || 320, 400),
        });
      } catch (e) {
        setFailed(true); onError?.(e);
      }
    }).catch((e) => { setFailed(true); onError?.(e); });
    return () => { cancelled = true; };
  }, [text]);

  if (!CLIENT_ID) return null; // not configured yet — nothing to show
  if (failed) {
    return <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>Google sign-in unavailable right now.</p>;
  }
  return (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%', opacity: disabled ? 0.6 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
      <div ref={divRef} style={{ colorScheme: 'light', width: '100%', display: 'flex', justifyContent: 'center' }} />
    </div>
  );
}
