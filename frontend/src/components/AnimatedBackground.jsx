import { useMemo } from 'react';

// Seeded pseudo-random — stable across renders, no hydration mismatch
function seededRand(seed) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const BRAND = {
  green:  '#00ff88',
  cyan:   '#00d4ff',
  purple: '#a855f7',
  amber:  '#fbbf24',
};

export default function AnimatedBackground({ variant = 'default', className = '', fullWidth = false }) {
  const { stars, orbs, balloons } = useMemo(() => {
    const rand = seededRand(42);

    // Stars — reduced from 80 → 45 (same visual, less DOM nodes)
    const stars = Array.from({ length: 45 }, (_, i) => ({
      id: i,
      x: rand() * 100,
      y: rand() * 100,
      size: rand() * 2.5 + 0.8,
      opacity: rand() * 0.6 + 0.15,
      dur: rand() * 4 + 2,
      delay: rand() * 6,
      color: [BRAND.green, BRAND.cyan, BRAND.purple, BRAND.amber, '#ffffff'][Math.floor(rand() * 5)],
    }));

    // Orbs — large blurred glowing blobs (kept at 5, blur handled via CSS class)
    const orbColors = [
      `radial-gradient(circle, rgba(0,255,136,0.18) 0%, transparent 70%)`,
      `radial-gradient(circle, rgba(0,212,255,0.15) 0%, transparent 70%)`,
      `radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)`,
      `radial-gradient(circle, rgba(251,191,36,0.12) 0%, transparent 70%)`,
      `radial-gradient(circle, rgba(0,255,136,0.1) 0%, transparent 70%)`,
    ];
    const orbs = Array.from({ length: 5 }, (_, i) => ({
      id: i,
      x: rand() * 90,
      y: rand() * 90,
      size: rand() * 300 + 180,
      bg: orbColors[i % orbColors.length],
      dur: rand() * 10 + 8,
      delay: rand() * 8,
    }));

    // Balloons — reduced from 18 → 10
    const balloonColors = [BRAND.green, BRAND.cyan, BRAND.purple, BRAND.amber];
    const balloons = Array.from({ length: 10 }, (_, i) => ({
      id: i,
      x: rand() * 95,
      startY: rand() * 40 + 60,
      size: rand() * 12 + 4,
      color: balloonColors[i % balloonColors.length],
      opacity: rand() * 0.45 + 0.1,
      dur: rand() * 14 + 10,
      delay: rand() * 12,
    }));

    return { stars, orbs, balloons };
  }, []);

  return (
    <div
      className={`fixed pointer-events-none overflow-hidden ${className}`}
      style={fullWidth
        ? { zIndex: 0, top: 0, bottom: 0, left: 0, right: 0, width: '100%' }
        : { zIndex: 0, top: 0, bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '480px' }
      }
      aria-hidden="true"
    >
      {/* CSS keyframes — animations disabled for users who prefer reduced motion */}
      <style>{`
        @keyframes mbg-twinkle {
          0%, 100% { opacity: var(--op); transform: scale(1); }
          50%       { opacity: calc(var(--op) * 2.2); transform: scale(1.6); }
        }
        @keyframes mbg-float-orb {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(30px, -25px) scale(1.05); }
          66%       { transform: translate(-20px, 20px) scale(0.95); }
        }
        @keyframes mbg-balloon {
          0%   { transform: translateY(0px) translateX(0px); opacity: var(--bop); }
          25%  { transform: translateY(-25vh) translateX(10px); }
          50%  { transform: translateY(-50vh) translateX(-8px); opacity: calc(var(--bop) * 0.8); }
          75%  { transform: translateY(-75vh) translateX(6px); }
          100% { transform: translateY(-105vh) translateX(0px); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .mbg-star, .mbg-orb, .mbg-balloon { animation: none !important; }
        }
      `}</style>

      {/* Gradient orbs — will-change promotes to GPU compositor layer */}
      {orbs.map(o => (
        <div
          key={o.id}
          className="mbg-orb absolute rounded-full blur-3xl"
          style={{
            left: `${o.x}%`,
            top: `${o.y}%`,
            width: `${o.size}px`,
            height: `${o.size}px`,
            background: o.bg,
            animation: `mbg-float-orb ${o.dur}s ease-in-out ${o.delay}s infinite`,
            willChange: 'transform',
          }}
        />
      ))}

      {/* Stars */}
      {stars.map(s => (
        <div
          key={s.id}
          className="mbg-star absolute rounded-full"
          style={{
            '--op': s.opacity,
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            background: s.color,
            opacity: s.opacity,
            boxShadow: `0 0 ${s.size * 3}px ${s.color}`,
            animation: `mbg-twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
            willChange: 'transform, opacity',
          }}
        />
      ))}

      {/* Floating balloons / bubbles */}
      {balloons.map(b => (
        <div
          key={b.id}
          className="mbg-balloon absolute rounded-full"
          style={{
            '--bop': b.opacity,
            left: `${b.x}%`,
            top: `${b.startY}%`,
            width: `${b.size}px`,
            height: `${b.size}px`,
            background: b.color,
            opacity: b.opacity,
            boxShadow: `0 0 ${b.size * 2}px ${b.color}, 0 0 ${b.size * 4}px ${b.color}44`,
            animation: `mbg-balloon ${b.dur}s linear ${b.delay}s infinite`,
            willChange: 'transform, opacity',
          }}
        />
      ))}
    </div>
  );
}
