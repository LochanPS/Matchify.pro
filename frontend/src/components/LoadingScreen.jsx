/**
 * Full-page loading screen — galaxy background with Matchify branding.
 * bg-galaxy.png fills the screen (objectFit: cover), ambient glows + stars
 * overlay it for depth. No black bars, no white flash.
 *
 * Visually unified with SplashScreen.jsx (same background family, same
 * shield icon, same gold accent) without repeating its one-time baked-in
 * marketing text/icon row — this shows on every page load, so it stays
 * lightweight: shield icon, indeterminate gold shimmer bar, message, dots.
 */

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
        background: '#050810',
        overflow: 'hidden',
        paddingTop:    inPWA ? 'env(safe-area-inset-top, 0px)'    : undefined,
        paddingBottom: inPWA ? 'env(safe-area-inset-bottom, 0px)' : undefined,
      }}
    >
      {/* ── Galaxy background image — cover fills every screen size ─────────── */}
      <img
        src="/bg-galaxy.png"
        alt=""
        draggable={false}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center center',
          pointerEvents: 'none',
          userSelect: 'none',
          opacity: 0.85,
        }}
      />

      {/* ── Ambient glows ───────────────────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div style={{
          position: 'absolute',
          width: '80vw', height: '80vw', maxWidth: '520px', maxHeight: '520px',
          top: '38%', left: '50%',
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 65%)',
          filter: 'blur(70px)',
        }} />
        <div style={{
          position: 'absolute',
          width: '60vw', height: '60vw', maxWidth: '360px', maxHeight: '360px',
          top: '65%', left: '65%',
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 65%)',
          filter: 'blur(55px)',
        }} />
        <div style={{
          position: 'absolute',
          width: '50vw', height: '50vw', maxWidth: '280px', maxHeight: '280px',
          top: '15%', left: '20%',
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 65%)',
          filter: 'blur(45px)',
        }} />
      </div>

      <style>{`
        @keyframes lsPulse  { 0%,100%{opacity:.6;transform:scale(1)}  50%{opacity:1;transform:scale(1.07)} }
        @keyframes lsFadeUp { 0%{opacity:0;transform:translateY(14px)} 100%{opacity:1;transform:translateY(0)} }
        @keyframes lsDot    { 0%,80%,100%{transform:scale(0);opacity:.3} 40%{transform:scale(1);opacity:1} }
        @keyframes lsShimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
      `}</style>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div
        className="relative z-10 flex flex-col items-center gap-8"
        style={{ animation: 'lsFadeUp 0.45s ease-out both' }}
      >
        {/* Shield icon — same /app-icon.png used as the app's icon everywhere else */}
        <img
          src="/app-icon.png"
          alt=""
          draggable={false}
          style={{
            width: 64, height: 64, objectFit: 'contain',
            animation: 'lsPulse 2.5s ease-in-out infinite',
            filter: 'drop-shadow(0 0 14px rgba(34,211,238,0.45))',
          }}
        />

        {/* Indeterminate gold shimmer — same accent as SplashScreen's progress bar,
            no percentage since this is a short, unbounded loading state */}
        <div style={{ width: 140, height: 5, borderRadius: 999, background: 'rgba(255,255,255,0.12)', overflow: 'hidden', boxShadow: '0 0 0 1px rgba(255,255,255,0.06)' }}>
          <div style={{
            height: '100%', width: '100%', borderRadius: 999,
            background: 'linear-gradient(90deg, #b45309 0%, #f59e0b 45%, #fcd34d 70%, #f59e0b 100%)',
            backgroundSize: '200% 100%',
            animation: 'lsShimmer 1.6s linear infinite',
            boxShadow: '0 0 10px rgba(245,158,11,0.85)',
          }} />
        </div>

        <div className="flex flex-col items-center gap-3">
          <p style={{
            fontSize: '14px', fontWeight: 700, letterSpacing: '0.05em',
            color: 'rgba(255,255,255,0.85)',
            textShadow: '0 1px 8px rgba(0,0,0,0.8)',
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

export default LoadingScreen;
