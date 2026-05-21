/**
 * MatchifyLogo — Matchify.pro PNG logo
 * Aspect ratio: ~1.092:1 (1083×992)
 *
 * Logo background color is #070D1B — matches the app's dark background (#07071a).
 * No background removal needed; navbar uses the same dark color so logo blends in naturally.
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

  const imgStyle = {
    height: `${size}px`,
    width: `${Math.round(size * RATIO)}px`,
    display: 'block',
    objectFit: 'contain',
    flexShrink: 0,
  };

  return (
    <span
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center' }}
    >
      <img
        src="/logo.png"
        alt="Matchify.pro"
        style={imgStyle}
        draggable={false}
      />
    </span>
  );
}
