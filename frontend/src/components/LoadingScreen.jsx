import MatchifyLogo from './MatchifyLogo';
import Spinner from './Spinner';

/**
 * Full-page loading screen with galaxy background.
 * Drop-in replacement for all per-page loading states.
 *
 * Usage:
 *   if (loading) return <LoadingScreen message="Loading tournament..." />;
 */
const LoadingScreen = ({ message = 'Loading...' }) => {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center z-50"
      style={{
        background: '#050810',
        backgroundImage: 'url(/bg-galaxy.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0" style={{ background: 'rgba(5,8,16,0.72)' }} />

      {/* Ambient glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div style={{
          position: 'absolute', width: '480px', height: '480px',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 65%)',
          filter: 'blur(60px)',
        }} />
        <div style={{
          position: 'absolute', width: '320px', height: '320px',
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
                  background: i === 1 ? '#a855f7' : '#06b6d4',
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
