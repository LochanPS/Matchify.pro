import MatchifyLogo from './MatchifyLogo';
import Spinner from './Spinner';

/**
 * Full-page loading screen — Matchify dark-gradient theme.
 * No external image dependency: pure CSS gradient always renders instantly
 * on any device, any connection speed, PWA or browser.
 *
 * Usage:
 *   if (loading) return <LoadingScreen message="Loading tournament..." />;
 */

// Detect PWA standalone so safe-area padding only applies when needed.
const _isPWA = () => {
  try {
    return (
      window.navigator.standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches
    );
  } catch { return false; }
};

const LoadingScreen = ({ message = 'Loading...' }) => {
  const inPWA = _isPWA();

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center z-50"
      style={{
        /* Rich gradient — renders immediately, no image load required */
        background: 'radial-gradient(ellipse 120% 100% at 50% 0%, #0d1433 0%, #07071a 45%, #050810 100%)',
        /* Only in PWA: notch area not handled by browser chrome */
        paddingTop:    inPWA ? 'env(safe-area-inset-top, 0px)'    : undefined,
        paddingBottom: inPWA ? 'env(safe-area-inset-bottom, 0px)' : undefined,
      }}
    >
      {/* ── Star field — pure CSS, no images ───────────────────────────────── */}
      <StarField />

      {/* ── Ambient glows ───────────────────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Amber glow — centre */}
        <div style={{
          position: 'absolute',
          width: '80vw', height: '80vw', maxWidth: '520px', maxHeight: '520px',
          top: '38%', left: '50%',
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,158,11,0.18) 0%, transparent 65%)',
          filter: 'blur(70px)',
        }} />
        {/* Purple glow — bottom-right */}
        <div style={{
          position: 'absolute',
          width: '60vw', height: '60vw', maxWidth: '360px', maxHeight: '360px',
          top: '65%', left: '65%',
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 65%)',
          filter: 'blur(55px)',
        }} />
        {/* Cyan glow — top-left */}
        <div style={{
          position: 'absolute',
          width: '50vw', height: '50vw', maxWidth: '280px', maxHeight: '280px',
          top: '15%', left: '20%',
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6,182,212,0.10) 0%, transparent 65%)',
          filter: 'blur(45px)',
        }} />
      </div>

      <style>{`
        @keyframes lsPulse  { 0%,100%{opacity:.6;transform:scale(1)}  50%{opacity:1;transform:scale(1.07)} }
        @keyframes lsFadeUp { 0%{opacity:0;transform:translateY(14px)} 100%{opacity:1;transform:translateY(0)} }
        @keyframes lsDot    { 0%,80%,100%{transform:scale(0);opacity:.3} 40%{transform:scale(1);opacity:1} }
      `}</style>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div
        className="relative z-10 flex flex-col items-center gap-8"
        style={{ animation: 'lsFadeUp 0.45s ease-out both' }}
      >
        {/* Logo */}
        <div style={{ animation: 'lsPulse 2.5s ease-in-out infinite' }}>
          <MatchifyLogo size={56} variant="icon" />
        </div>

        {/* Spinner */}
        <Spinner size="xl" />

        {/* Message + bouncing dots */}
        <div className="flex flex-col items-center gap-3">
          <p style={{
            fontSize: '14px', fontWeight: 700, letterSpacing: '0.05em',
            color: 'rgba(255,255,255,0.72)',
            textShadow: '0 1px 8px rgba(0,0,0,0.6)',
          }}>
            {message}
          </p>
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 6, height: 6, borderRadius: '50%',
                background: i === 1 ? '#a855f7' : '#F59E0B',
                animation: `lsDot 1.4s ease-in-out ${i * 0.16}s infinite`,
              }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Tiny inline star field — 30 CSS-drawn dots, no images ─────────────────── */
const STARS = Array.from({ length: 30 }, (_, i) => ({
  x: ((i * 37 + 11) % 97),
  y: ((i * 53 + 7)  % 99),
  r: [1, 1, 1, 1.5, 2][ i % 5 ],
  o: 0.25 + ((i * 17) % 55) / 100,
  dur: 3 + (i % 5),
  del: (i % 6) * 0.5,
}));

function StarField() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <style>{`
        @keyframes lsStar { 0%,100%{opacity:var(--so)} 50%{opacity:calc(var(--so)*2.2)} }
      `}</style>
      {STARS.map((s, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${s.x}%`, top: `${s.y}%`,
          width: s.r * 2, height: s.r * 2,
          borderRadius: '50%',
          background: i % 7 === 0 ? '#FCD34D' : i % 5 === 0 ? '#a5f3fc' : '#ffffff',
          '--so': s.o,
          opacity: s.o,
          animation: `lsStar ${s.dur}s ease-in-out ${s.del}s infinite`,
        }} />
      ))}
    </div>
  );
}

export default LoadingScreen;
