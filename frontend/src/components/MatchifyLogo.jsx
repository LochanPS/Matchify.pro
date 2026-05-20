/**
 * MatchifyLogo — Matchify.pro PNG logo
 * Aspect ratio: ~2.32:1 (landscape)
 * mix-blend-mode:screen → dark bg invisible on dark navbars, teal logo pops.
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
    mixBlendMode: 'screen',
    filter: 'brightness(1.35) contrast(1.1) saturate(1.3) drop-shadow(0 0 8px rgba(0,220,180,0.45))',
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
