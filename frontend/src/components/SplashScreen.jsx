import { useEffect, useState, useRef } from 'react';

// Phase-based progress: { target: 0-100, duration: ms }
// Bar runs to target over duration, then next phase begins.
// Duplicate target = pause (bar stays still for that duration).
const PHASES = [
  { target: 28,  duration: 1100 }, // run  0 → 28%
  { target: 28,  duration: 1400 }, // pause at 28%
  { target: 61,  duration: 1000 }, // run  28 → 61%
  { target: 61,  duration: 900  }, // pause at 61%
  { target: 85,  duration: 900  }, // run  61 → 85%
  { target: 85,  duration: 1200 }, // pause at 85%
  { target: 100, duration: 700  }, // run  85 → 100%
];
// Total ≈ 7200ms (7.2s) — within 5–7s window

const SplashScreen = ({ onComplete, duration: _duration = 5300 }) => {
  const [pct, setPct]         = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const rafRef                = useRef(null);
  const completedRef          = useRef(false);
  const onCompleteRef         = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  // Lock body scroll for entire splash duration (iOS momentum scroll fix)
  useEffect(() => {
    const prev = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      width:    document.body.style.width,
      top:      document.body.style.top,
    };
    const scrollY = window.scrollY;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width    = '100%';
    document.body.style.top      = `-${scrollY}px`;
    return () => {
      document.body.style.overflow = prev.overflow;
      document.body.style.position = prev.position;
      document.body.style.width    = prev.width;
      document.body.style.top      = prev.top;
      window.scrollTo(0, scrollY);
    };
  }, []);

  useEffect(() => {
    let phaseIndex  = 0;
    let phaseStart  = performance.now();
    let fromPct     = 0;

    const finish = () => {
      if (completedRef.current) return;
      completedRef.current = true;
      setPct(100);
      setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => onCompleteRef.current?.(), 600);
      }, 300);
    };

    const tick = (now) => {
      if (completedRef.current) return;

      if (phaseIndex >= PHASES.length) { finish(); return; }

      const phase    = PHASES[phaseIndex];
      const elapsed  = now - phaseStart;
      const t        = Math.min(elapsed / phase.duration, 1);
      // ease-in-out cubic for smooth motion, linear during pauses
      const eased    = phase.target === fromPct
        ? 0                              // pause — no movement
        : t < 0.5
          ? 4 * t * t * t
          : 1 - Math.pow(-2 * t + 2, 3) / 2;

      const current = fromPct + (phase.target - fromPct) * eased;
      setPct(Math.min(Math.round(current * 10) / 10, 100));

      if (t >= 1) {
        fromPct     = phase.target;
        phaseIndex += 1;
        phaseStart  = now;
      }

      if (phaseIndex >= PHASES.length) { finish(); return; }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: '#050810', overflow: 'hidden',
      opacity: fadeOut ? 0 : 1,
      transition: fadeOut ? 'opacity 0.6s ease-out' : 'none',
      pointerEvents: fadeOut ? 'none' : 'all',
      touchAction: 'none',
    }}>

      {/* Background image — cover so it ALWAYS fills the full screen edge to   */}
      {/* edge on every phone, any width/height ratio. No 480px cap, no         */}
      {/* contain-mode gaps — cover crops slightly on outlier aspect ratios     */}
      {/* instead of ever leaving a visible bar.                               */}
      <img
        src="/splash.jpg"
        alt=""
        draggable={false}
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
          objectPosition: 'center center',
          userSelect: 'none', pointerEvents: 'none',
        }}
      />

      {/* ── Progress bar ──────────────────────────────────────────────────── */}
      {/* 69.25% = measured midpoint of the dark gap between "India's #1       */}
      {/* Badminton Platform" (ends ~y1014) and the icon row (starts ~y1206)  */}
      {/* in the 740x1600 source image. Image aspect ratio (0.4625) is nearly */}
      {/* identical to typical phone viewports, so cover crops minimally and  */}
      {/* this percentage of full-bleed viewport height still lands in that  */}
      {/* same gap on real devices.                                          */}
      <style>{`
        @keyframes goldShimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
      `}</style>

      <div style={{
        position: 'absolute',
        left: '50%', transform: 'translateX(-50%)',
        top: '69.25%',
        width: '60%', maxWidth: 288,
      }}>
        {/* Track */}
        <div style={{
          width: '100%', height: 5, borderRadius: 999,
          background: 'rgba(255,255,255,0.12)',
          overflow: 'hidden',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.06)',
        }}>
          {/* Fill */}
          <div style={{
            height: '100%',
            width: `${pct}%`,
            borderRadius: 999,
            background: 'linear-gradient(90deg, #b45309 0%, #f59e0b 45%, #fcd34d 70%, #f59e0b 100%)',
            backgroundSize: '200% 100%',
            animation: 'goldShimmer 1.6s linear infinite',
            boxShadow: '0 0 10px rgba(245,158,11,0.85)',
            transition: 'width 0.08s linear',
          }} />
        </div>

        {/* Percentage — small, right-aligned, golden */}
        <div style={{
          textAlign: 'right', marginTop: 6,
          fontSize: 11, fontWeight: 700,
          color: 'rgba(251,191,36,0.75)',
          fontFamily: 'system-ui,-apple-system,sans-serif',
          letterSpacing: '0.04em',
        }}>
          {Math.round(pct)}%
        </div>
      </div>

    </div>
  );
};

export default SplashScreen;
