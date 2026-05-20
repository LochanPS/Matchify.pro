/**
 * MatchifyLogo — PNG logo image
 *
 * Props:
 *   size       {number}  — logo height in px (default 48)
 *   variant    {'full'|'icon'|'text'}
 *   className  {string}
 */
export default function MatchifyLogo({
  size = 48,
  variant = 'full',
  className = '',
}) {
  // Logo image has dark background — mix-blend-mode:screen makes dark areas
  // invisible on dark navbars while keeping bright teal/green logo elements vivid.
  // aspect ratio is 1082:992 ≈ 1.09:1 — nearly square, so width ≈ size * 1.09
  const imgStyle = {
    height: `${size}px`,
    width: `${Math.round(size * 1.09)}px`,
    display: 'block',
    objectFit: 'contain',
    flexShrink: 0,
    mixBlendMode: 'screen',
    filter: `brightness(1.3) contrast(1.1) drop-shadow(0 0 8px rgba(0,230,140,0.5))`,
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
