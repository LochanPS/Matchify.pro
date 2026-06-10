import MatchifyLogo from './MatchifyLogo';
import Spinner from './Spinner';

/**
 * Full-page loading screen with galaxy background.
 * Drop-in replacement for all per-page loading states.
 *
 * Usage:
 *   if (loading) return <LoadingScreen message="Loading tournament..." />;
 */
// Detect PWA standalone — avoids adding safe-area padding in browser mode
// where the browser chrome already handles the notch/status-bar area.
const _isPWA = () => {
  try {
    return (
      window.navigator.standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches
    );
  } catch { return false; }
};

const LoadingScreen = ({ message = 'Loading...' }) => {
  // Only apply safe-area insets in standalone PWA mode. In browser mode the
  // browser chrome handles the notch, so extra padding makes content too low.
  const inPWA = _isPWA();

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center z-50"
      style={{
        /* inset-0 = top/right/bottom/left: 0 → always fills exact visible viewport
           regardless of phone size, orientation, or toolbar state */
        background: '#050810',
        backgroundImage: 'url(/bg-galaxy.png)',
        backgroundSize: 'cover',           /* fills whole viewport, crops if needed */
        backgroundPosition: 'center center', /* always centred on any aspect ratio */
        backgroundRepeat: 'no-repeat',
        /* Only in PWA: no browser chrome to handle notch, so we pad manually */
        paddingTop: inPWA ? 'env(safe-area-inset-top, 0px)' : undefined,
        paddingBottom: inPWA ? 'env(safe-area-inset-bottom, 0px)' : undefined,
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0" style={{ background: 'rgba(5,8,16,0.72)' }} />

      {/* Ambient glows — use vw/vh so they scale on any screen */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div style={{
          position: 'absolute', width: '70vw', height: '70vw', maxWidth: '480px', maxHeight: '480px',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 65%)',
          filter: 'blur(60px)',
        }} />
        <div style={{
          position: 'absolute', width: '50vw', height: '50vw', maxWidth: '320px', maxHeight: '320px',
          top: '60%', left: '55%',
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 65%)',
          filter: 'blur(50px)',
        }} />
      </div>

      <style>{`
        @keyframes lsPulse {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50%       { opacity: 1;    transform: scale(1.06); }
        }
        @keyframes lsFadeUp {
          0%   { opacity: 0; transform: translateY(12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes lsDot {
          0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
          40%           { transform: scale(1);   opacity: 1;   }
        }
      `}</style>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8" style={{ animation: 'lsFadeUp 0.4s ease-out both' }}>

        {/* Logo */}
        <div style={{ animation: 'lsPulse 2.4s ease-in-out infinite' }}>
          <MatchifyLogo size={52} variant="icon" />
        </div>

        {/* Spinner */}
        <Spinner size="xl" />

        {/* Message + dots */}
        <div className="flex flex-col items-center gap-3">
          <p style={{
            fontSize: '14px', fontWeight: 700, letterSpacing: '0.04em',
            color: 'rgba(255,255,255,0.70)',
          }}>
            {message}
          </p>
          {/* Bouncing dots */}
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: i === 1 ? '#a855f7' : '#F59E0B',
                  animation: `lsDot 1.4s ease-in-out ${i * 0.16}s infinite`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;

