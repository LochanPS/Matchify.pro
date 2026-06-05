import { useEffect, useState, useRef } from 'react';

/**
 * SplashScreen — shows once per browser session on first app load.
 * Progress 0→100 over 5-6 seconds tied to real load events + smooth animation.
 * Fades out when complete, then unmounts so it never interferes with the app.
 */
const SplashScreen = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const progressRef = useRef(0);
  const startTimeRef = useRef(Date.now());
  const rafRef = useRef(null);
  const completedRef = useRef(false);

  useEffect(() => {
    const MIN_DURATION = 5200;  // minimum 5.2s
    const MAX_DURATION = 6500;  // cap at 6.5s

    // Progress curve: fast start, slow middle (feels loading-heavy), fast finish
    // Mimics real app loading profile
    const getTargetProgress = (elapsed) => {
      const ratio = Math.min(elapsed / MIN_DURATION, 1);
      // Ease-in-out-quad with slight pause in middle (60-80% zone)
      if (ratio < 0.3)  return ratio * 3 * 35;            // 0→35% in first 30% of time
      if (ratio < 0.55) return 35 + (ratio - 0.3) * 4 * 20; // 35→55% (slow zone)
      if (ratio < 0.75) return 55 + (ratio - 0.55) * 5 * 16; // 55→71% (medium)
      if (ratio < 0.92) return 71 + (ratio - 0.75) * 5.9 * 17; // 71→88%
      return 88 + (ratio - 0.92) * 12.5 * 12; // 88→100%
    };

    // Real load events boost progress instantly (feels responsive)
    const boostOnEvent = (target) => {
      if (progressRef.current < target) {
        progressRef.current = target;
      }
    };

    // Listen for real load milestones
    const onDOMReady = () => boostOnEvent(25);
    const onLoad     = () => boostOnEvent(75);
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', onDOMReady, { once: true });
    } else {
      boostOnEvent(25);
    }
    if (document.readyState !== 'complete') {
      window.addEventListener('load', onLoad, { once: true });
    } else {
      boostOnEvent(75);
    }

    // RAF loop — smooth animation tied to time
    const animate = () => {
      if (completedRef.current) return;
      const elapsed = Date.now() - startTimeRef.current;
      const timeBased = getTargetProgress(elapsed);

      // Take max of time-based and event-boosted progress
      const target = Math.max(timeBased, progressRef.current);
      const clamped = Math.min(target, 100);

      // Smooth interpolation toward target (feels silky)
      const current = progressRef.current;
      const smoothed = current + (clamped - current) * 0.08;
      const rounded = Math.round(smoothed * 10) / 10;

      progressRef.current = smoothed;
      setProgress(rounded);

      if (elapsed >= MIN_DURATION && smoothed >= 99.5) {
        // Complete
        completedRef.current = true;
        setProgress(100);
        setTimeout(() => {
          setFadeOut(true);
          setTimeout(() => onComplete(), 600); // wait for fade-out animation
        }, 300);
        return;
      }

      // Hard cap — never exceed MAX_DURATION
      if (elapsed >= MAX_DURATION) {
        completedRef.current = true;
        setProgress(100);
        setTimeout(() => {
          setFadeOut(true);
          setTimeout(() => onComplete(), 600);
        }, 300);
        return;
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      document.removeEventListener('DOMContentLoaded', onDOMReady);
      window.removeEventListener('load', onLoad);
    };
  }, [onComplete]);

  const displayProgress = Math.min(Math.round(progress), 100);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#050810',
        opacity: fadeOut ? 0 : 1,
        transition: fadeOut ? 'opacity 0.6s ease-out' : 'none',
        pointerEvents: fadeOut ? 'none' : 'all',
        overflow: 'hidden',
      }}
    >
      {/* Background image */}
      <img
        src="/splash.png"
        alt=""
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center top',
          userSelect: 'none',
          pointerEvents: 'none',
        }}
        draggable={false}
      />

      {/* Progress bar — bottom of screen */}
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '72%',
          maxWidth: 320,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
        }}
      >
        {/* Track */}
        <div
          style={{
            width: '100%',
            height: 6,
            borderRadius: 999,
            background: 'rgba(255,255,255,0.12)',
            overflow: 'hidden',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.4)',
          }}
        >
          {/* Fill */}
          <div
            style={{
              height: '100%',
              width: `${displayProgress}%`,
              borderRadius: 999,
              background: 'linear-gradient(90deg, #F59E0B, #FCD34D)',
              boxShadow: '0 0 14px rgba(245,158,11,0.9), 0 0 6px rgba(252,211,77,0.6)',
              transition: 'width 0.08s linear',
            }}
          />
        </div>

        {/* Percentage text */}
        <span
          style={{
            color: 'rgba(255,255,255,0.55)',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.18em',
            fontFamily: 'system-ui, sans-serif',
            userSelect: 'none',
          }}
        >
          LOADING... {displayProgress}%
        </span>
      </div>
    </div>
  );
};

export default SplashScreen;
