import { useEffect, useState, useRef } from 'react';

/**
 * SplashScreen — full-screen loader with progress bar.
 * Used for:
 *  - First app load (duration ~5-6s)
 *  - Login / Register / Home→Dashboard transitions (duration ~2s)
 *
 * Props:
 *  onComplete  — called when animation finishes
 *  duration    — total ms (default 5300 = first load; pass 2000 for transitions)
 */
const SplashScreen = ({ onComplete, duration = 5300 }) => {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const progressRef = useRef(0);
  const startTimeRef = useRef(Date.now());
  const rafRef = useRef(null);
  const completedRef = useRef(false);
  // Ref so onComplete is always current without restarting the effect
  const onCompleteRef = useRef(onComplete);
  const durationRef = useRef(duration);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  useEffect(() => {
    // Run once on mount — use refs so parent re-renders don't restart animation
    const MIN_DURATION = durationRef.current;
    const MAX_DURATION = durationRef.current + 1200;

    // Progress curve — fast start, slow middle, fast finish (professional feel)
    const getTargetProgress = (elapsed) => {
      const ratio = Math.min(elapsed / MIN_DURATION, 1);
      if (ratio < 0.30) return ratio * 3 * 35;                        // 0→35%
      if (ratio < 0.55) return 35 + (ratio - 0.30) * 4 * 20;         // 35→55%
      if (ratio < 0.75) return 55 + (ratio - 0.55) * 5 * 16;         // 55→71%
      if (ratio < 0.92) return 71 + (ratio - 0.75) * 5.9 * 17;       // 71→88%
      return 88 + (ratio - 0.92) * 12.5 * 12;                        // 88→100%
    };

    const boostOnEvent = (target) => {
      if (progressRef.current < target) progressRef.current = target;
    };

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

    const finish = () => {
      completedRef.current = true;
      setProgress(100);
      setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => onCompleteRef.current?.(), 650);
      }, 350);
    };

    const animate = () => {
      if (completedRef.current) return;
      const elapsed = Date.now() - startTimeRef.current;

      if (elapsed >= MAX_DURATION) { finish(); return; }

      const timeBased = getTargetProgress(elapsed);
      const target    = Math.min(Math.max(timeBased, progressRef.current), 100);
      const smoothed  = progressRef.current + (target - progressRef.current) * 0.07;

      progressRef.current = smoothed;
      setProgress(smoothed);

      if (elapsed >= MIN_DURATION && smoothed >= 99.5) { finish(); return; }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      document.removeEventListener('DOMContentLoaded', onDOMReady);
      window.removeEventListener('load', onLoad);
    };
  }, []); // Run once on mount — onComplete + duration accessed via refs

  const displayProgress = Math.min(Math.round(progress), 100);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: '#050810',
        overflow: 'hidden',
        opacity: fadeOut ? 0 : 1,
        transition: fadeOut ? 'opacity 0.65s ease-out' : 'none',
        pointerEvents: fadeOut ? 'none' : 'all',
      }}
    >
      {/* ── Background image — cover fills the full screen on every device.
           Centre anchor keeps the M logo + text always visible. ── */}
      <img
        src="/splash.png"
        alt=""
        draggable={false}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center center',
          userSelect: 'none',
          pointerEvents: 'none',
          filter: 'brightness(1.3) contrast(1.1) saturate(1.2)',
        }}
      />

      {/* ── Ambient glow behind M badge — vw-based so it scales on any phone ── */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -68%)',
          width: 'min(55vw, 240px)',
          height: 'min(55vw, 240px)',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,158,11,0.18) 0%, transparent 70%)',
          animation: 'splashPulse 2s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />

      {/* ── Bottom gradient — hides baked-in static bar ── */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '30%',
          background: 'linear-gradient(to bottom, transparent 0%, #050810 60%)',
          pointerEvents: 'none',
        }}
      />

      <style>{`
        @keyframes splashPulse {
          0%, 100% { transform: translate(-50%, -68%) scale(1); opacity: 0.7; }
          50%       { transform: translate(-50%, -68%) scale(1.3); opacity: 1; }
        }
        @keyframes splashShimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
      `}</style>

      {/* ── Animated progress bar — sits above the gradient ── */}
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(72%, 300px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 9,
        }}
      >
        {/* Bar track */}
        {/* Bar track */}
        <div
          style={{
            width: '100%',
            height: 7,
            borderRadius: 999,
            background: 'rgba(255,255,255,0.15)',
            overflow: 'hidden',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.06)',
          }}
        >
          {/* Bar fill with shimmer */}
          <div
            style={{
              height: '100%',
              width: `${displayProgress}%`,
              borderRadius: 999,
              background: 'linear-gradient(90deg, #F59E0B 0%, #FCD34D 50%, #F59E0B 100%)',
              backgroundSize: '200% 100%',
              animation: 'splashShimmer 1.4s linear infinite',
              boxShadow: '0 0 16px rgba(245,158,11,0.95), 0 0 6px rgba(252,211,77,0.6)',
              transition: 'width 0.06s linear',
            }}
          />
        </div>

        {/* Label — brighter, clearer */}
        <span
          style={{
            color: 'rgba(255,255,255,0.75)',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.18em',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            userSelect: 'none',
            textShadow: '0 1px 4px rgba(0,0,0,0.8)',
          }}
        >
          LOADING... {displayProgress}%
        </span>
      </div>
    </div>
  );
};

export default SplashScreen;
