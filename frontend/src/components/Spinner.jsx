/**
 * Spinner — the universal loading indicator used app-wide.
 *
 * Renders the same dual-ring + glowing center animation as LoadingScreen,
 * scaled to any size via the `size` prop.
 *
 * Usage:
 *   <Spinner />                   — default medium (32px)
 *   <Spinner size="xs" />         — 14px  (inside tiny buttons)
 *   <Spinner size="sm" />         — 20px  (inside buttons)
 *   <Spinner size="md" />         — 32px  (default, content areas)
 *   <Spinner size="lg" />         — 48px  (section loaders)
 *   <Spinner size="xl" />         — 64px  (full-page, used by LoadingScreen)
 *   <Spinner className="mx-auto" />   — pass extra layout classes
 */

const SIZES = {
  xs: { outer: 14, inner: 8,  dot: 4,  outerB: 1.5, innerB: 1.5 },
  sm: { outer: 20, inner: 13, dot: 5,  outerB: 2,   innerB: 1.5 },
  md: { outer: 32, inner: 21, dot: 7,  outerB: 2.5, innerB: 2   },
  lg: { outer: 48, inner: 32, dot: 10, outerB: 3,   innerB: 2   },
  xl: { outer: 64, inner: 44, dot: 12, outerB: 3,   innerB: 2   },
};

const Spinner = ({ size = 'md', className = '', style = {} }) => {
  const s = SIZES[size] || SIZES.md;
  const inset   = (s.outer - s.inner) / 2;
  const dotOff  = (s.outer - s.dot)  / 2;

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        width: s.outer,
        height: s.outer,
        position: 'relative',
        ...style,
      }}
    >
      <style>{`
        @keyframes _sp_out { to { transform: rotate(360deg); } }
        @keyframes _sp_in  { to { transform: rotate(-360deg); } }
        @keyframes _sp_dot { 0%,100% { opacity:.6; transform:scale(1); } 50% { opacity:1; transform:scale(1.15); } }
      `}</style>

      {/* Outer ring — cyan clockwise */}
      <span style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        border: `${s.outerB}px solid transparent`,
        borderTopColor: '#06b6d4',
        borderRightColor: 'rgba(6,182,212,0.30)',
        animation: '_sp_out 1.1s linear infinite',
      }} />

      {/* Inner ring — violet counter-clockwise */}
      <span style={{
        position: 'absolute',
        top: inset, left: inset,
        right: inset, bottom: inset,
        borderRadius: '50%',
        border: `${s.innerB}px solid transparent`,
        borderTopColor: '#a855f7',
        borderLeftColor: 'rgba(168,85,247,0.28)',
        animation: '_sp_in 1.6s linear infinite',
      }} />

      {/* Center glowing dot */}
      <span style={{
        position: 'absolute',
        top: dotOff, left: dotOff,
        width: s.dot, height: s.dot,
        borderRadius: '50%',
        background: 'radial-gradient(circle, #22d3ee, #0891b2)',
        boxShadow: `0 0 ${s.dot}px rgba(6,182,212,0.85)`,
        animation: '_sp_dot 1.6s ease-in-out infinite',
      }} />
    </span>
  );
};

export default Spinner;
