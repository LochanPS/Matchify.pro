import { useEffect, useState, useRef } from 'react';

const SplashScreen = ({ onComplete, duration = 5300 }) => {
  const [progress, setProgress]   = useState(0);
  const [fadeOut, setFadeOut]     = useState(false);
  const progressRef               = useRef(0);
  const startTimeRef              = useRef(Date.now());
  const rafRef                    = useRef(null);
  const completedRef              = useRef(false);
  const onCompleteRef             = useRef(onComplete);
  const durationRef               = useRef(duration);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  useEffect(() => {
    const MIN_DURATION = durationRef.current;
    const MAX_DURATION = durationRef.current + 1200;

    const getTargetProgress = (elapsed) => {
      const ratio = Math.min(elapsed / MIN_DURATION, 1);
      if (ratio < 0.30) return ratio * 3 * 35;
      if (ratio < 0.55) return 35 + (ratio - 0.30) * 4 * 20;
      if (ratio < 0.75) return 55 + (ratio - 0.55) * 5 * 16;
      if (ratio < 0.92) return 71 + (ratio - 0.75) * 5.9 * 17;
      return 88 + (ratio - 0.92) * 12.5 * 12;
    };

    const boostOnEvent = (target) => {
      if (progressRef.current < target) progressRef.current = target;
    };

    const onDOMReady = () => boostOnEvent(25);
    const onLoad     = () => boostOnEvent(75);
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', onDOMReady, { once: true });
    } else { boostOnEvent(25); }
    if (document.readyState !== 'complete') {
      window.addEventListener('load', onLoad, { once: true });
    } else { boostOnEvent(75); }

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
  }, []);

  const pct = Math.min(Math.round(progress), 100);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: '#050d1a', overflow: 'hidden',
      opacity: fadeOut ? 0 : 1,
      transition: fadeOut ? 'opacity 0.65s ease-out' : 'none',
      pointerEvents: fadeOut ? 'none' : 'all',
    }}>
      {/* ── Background image — full screen, anchored top ── */}
      <img
        src="/splash.png"
        alt=""
        draggable={false}
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
          objectPosition: 'center top',
          userSelect: 'none', pointerEvents: 'none',
        }}
      />

      {/* ── Cover ONLY the static loading elements zone (55–68%) ──
          Three-layer system keeps top (logo/title) and bottom (court/icons) visible.
          Layer 1: fade in  — transparent → solid  (52% – 56%)
          Layer 2: solid    — fully opaque          (56% – 68%)
          Layer 3: fade out — solid → transparent  (68% – 72%)
      ── */}
      <div style={{
        position: 'absolute', left: 0, right: 0,
        top: '52%', height: '4%',
        background: 'linear-gradient(to bottom, transparent, #050d1a)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', left: 0, right: 0,
        top: '56%', height: '13%',
        background: '#050d1a',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', left: 0, right: 0,
        top: '69%', height: '4%',
        background: 'linear-gradient(to bottom, #050d1a, transparent)',
        pointerEvents: 'none',
      }} />

      <style>{`
        @keyframes splashShimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes splashSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes splashDot {
          0%,80%,100% { transform: scale(0.6); opacity: 0.3; }
          40%          { transform: scale(1);   opacity: 1;   }
        }
      `}</style>

      {/* ── Dynamic loading UI — inside the solid covered zone ── */}
      <div style={{
        position: 'absolute', left: 0, right: 0,
        top: '57%',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 8,
        padding: '0 28px',
      }}>

        {/* Row 1: spinner + text — matches image style exactly */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 20, height: 20, borderRadius: '50%',
            border: '2.5px solid rgba(0,180,255,0.2)',
            borderTopColor: '#00b4ff',
            animation: 'splashSpin 0.8s linear infinite',
            flexShrink: 0,
          }} />
          <span style={{
            fontSize: 15, fontWeight: 600,
            color: 'rgba(255,255,255,0.9)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            letterSpacing: '0.01em',
          }}>
            Creating Tournament <span style={{ color: '#00b4ff' }}>Draws...</span>
          </span>
        </div>

        {/* Row 2: three dots */}
        <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 7, height: 7, borderRadius: '50%',
              background: i === 1 ? '#00b4ff' : 'rgba(0,180,255,0.35)',
              animation: `splashDot 1.3s ease-in-out ${i * 0.2}s infinite`,
            }} />
          ))}
        </div>

        {/* Row 3: progress bar + shuttlecock + % — exactly like image */}
        <div style={{
          width: '100%', maxWidth: 340,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          {/* Bar track */}
          <div style={{
            flex: 1, height: 8, borderRadius: 999,
            background: 'rgba(255,255,255,0.08)',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${pct}%`,
              borderRadius: 999,
              background: 'linear-gradient(90deg, #0055ee 0%, #00b4ff 55%, #0055ee 100%)',
              backgroundSize: '200% 100%',
              animation: 'splashShimmer 1.4s linear infinite',
              boxShadow: '0 0 12px rgba(0,180,255,0.9)',
              transition: 'width 0.06s linear',
            }} />
          </div>

          {/* Shuttlecock */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="18" r="3" fill="#00b4ff" opacity="0.95"/>
            <path d="M12 15 L7 4 M12 15 L12 4 M12 15 L17 4"
              stroke="#00b4ff" strokeWidth="1.5" strokeLinecap="round" opacity="0.75"/>
            <path d="M7 4 Q12 7 17 4"
              stroke="#00b4ff" strokeWidth="1.2" fill="none" opacity="0.6"/>
          </svg>

          {/* Percentage */}
          <span style={{
            fontSize: 14, fontWeight: 700,
            color: 'rgba(255,255,255,0.9)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            minWidth: 38, textAlign: 'right',
          }}>
            {pct}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
