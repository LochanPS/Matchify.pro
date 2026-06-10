import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

// ── Detect true PWA standalone mode before first paint ───────────────────────
// navigator.standalone (iOS-only) = true when launched from Home Screen.
// display-mode: standalone catches Android Chrome PWA + modern iOS 13+.
// Sets .pwa-standalone on <html> so CSS safe-area rules apply only in PWA —
// never in regular browser tabs where browser chrome already handles safe areas.
;(function detectPWA() {
  try {
    const isStandalone =
      window.navigator.standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) document.documentElement.classList.add('pwa-standalone');
  } catch {}
})();


// Auto-reload when Vite can't load a chunk (happens after new deployment
// changes chunk filenames — old cached index.js references stale hashes).
// Anti-loop: only reload once every 15s so we don't get stuck in an
// infinite reload cycle on devices that aggressively cache the old shell.
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  try {
    const RELOAD_KEY = '_matchify_chunk_reload';
    const last = parseInt(sessionStorage.getItem(RELOAD_KEY) || '0', 10);
    if (Date.now() - last > 15000) {
      sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
      window.location.reload();
    }
    // else: already tried in last 15s — let ErrorBoundary handle it
  } catch {
    window.location.reload();
  }
});

// ── Top-level Error Boundary ──────────────────────────────────────────────────
// Catches any uncaught React render error (including iOS SecurityError from
// localStorage in Private Browsing, or missing polyfills) so the user sees
// a recovery screen instead of a blank white page.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[Matchify] App crashed:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div style={{
        minHeight: '100vh',
        background: '#07071a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px',
        textAlign: 'center',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎾</div>
        <h1 style={{ color: '#F59E0B', fontSize: 22, fontWeight: 900, margin: '0 0 8px' }}>
          Matchify.pro
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, margin: '0 0 24px', lineHeight: 1.5 }}>
          Something went wrong loading the app.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            background: 'linear-gradient(135deg,#F59E0B,#d97706)',
            border: 'none',
            borderRadius: 14,
            color: '#07071a',
            fontWeight: 900,
            fontSize: 15,
            padding: '14px 32px',
            cursor: 'pointer',
          }}
        >
          Reload App
        </button>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 16 }}>
          If this keeps happening, try clearing your browser cache.
        </p>
      </div>
    );
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)
