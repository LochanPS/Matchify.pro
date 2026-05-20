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
    filter: 'drop-shadow(0 0 10px rgba(0,220,180,0.5)) brightness(1.1)',
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
