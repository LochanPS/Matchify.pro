/**
 * MatchifyLogo — Matchify.pro PNG logo
 * Aspect ratio: ~1.092:1 (1083×992)
 *
 * mix-blend-mode: screen makes dark background pixels invisible regardless of
 * what color sits behind the logo (purple navbar, dark hero, white, anything).
 * Only the bright elements — teal shield, M, sparkles, text — remain visible.
 *
 * Props:
 *   size       {number}  — height in px (default 40)
 *   variant    {'full'|'icon'|'text'}
 *   className  {string}
 */
export default function MatchifyLogo({
  size = 40,
  variant = 'full',
  className = '',
}) {
  const RATIO = 1.092; // 1083 / 992

  return (
    <span
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center' }}
    >
      <img
        src="/logo.png"
        alt="Matchify.pro"
        draggable={false}
        style={{
          height: `${size}px`,
          width: `${Math.round(size * RATIO)}px`,
          display: 'block',
          objectFit: 'contain',
          flexShrink: 0,
          mixBlendMode: 'screen',
          filter: 'brightness(1.15) drop-shadow(0 0 8px rgba(0,212,255,0.4))',
        }}
      />
    </span>
  );
}
