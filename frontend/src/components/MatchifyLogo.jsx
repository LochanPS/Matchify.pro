/**
 * MatchifyLogo — Matchify.pro PNG logo (transparent background)
 * Aspect ratio: ~2.32:1 (landscape)
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
  const RATIO = 2.318; // width / height of cropped logo.png

  const imgStyle = {
    height: `${size}px`,
    width: `${Math.round(size * RATIO)}px`,
    display: 'block',
    objectFit: 'contain',
    flexShrink: 0,
    filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.9)) drop-shadow(0 0 16px rgba(255,255,255,0.15)) brightness(1.25)',
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
