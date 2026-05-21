/**
 * MatchifyLogo — Matchify.pro PNG logo
 * Aspect ratio: ~1.092:1 (1083×992)
 *
 * The logo PNG has teal sparkle particles at the top corners which create a
 * visible "card border" when displayed small. We clip 12% from top and 3%
 * from bottom (sparkles live there; shield+text are vertically centered),
 * then use mix-blend-mode:screen so the remaining dark background dissolves
 * into whatever background sits behind the logo.
 *
 * Props:
 *   size       {number}  — visible height in px (default 40)
 *   variant    {'full'|'icon'|'text'}
 *   className  {string}
 */
export default function MatchifyLogo({
  size = 40,
  variant = 'full',
  className = '',
}) {
  const RATIO = 1.092; // full-image width / height  (1083 / 992)

  // Clip percentages — removes corner sparkles, keeps shield + text
  const CLIP_TOP    = 0.12;
  const CLIP_BOTTOM = 0.03;

  // Full render height before clipping
  const fullH = Math.round(size / (1 - CLIP_TOP - CLIP_BOTTOM));
  const fullW = Math.round(fullH * RATIO);

  // Visible window
  const visH = size;
  const visW = fullW;

  const offsetTop = Math.round(fullH * CLIP_TOP);

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        overflow: 'hidden',
        height: `${visH}px`,
        width: `${visW}px`,
        flexShrink: 0,
      }}
    >
      <img
        src="/logo.png"
        alt="Matchify.pro"
        draggable={false}
        style={{
          height: `${fullH}px`,
          width: `${fullW}px`,
          display: 'block',
          flexShrink: 0,
          marginTop: `-${offsetTop}px`,
          mixBlendMode: 'screen',
          filter: 'brightness(1.1)',
        }}
      />
    </span>
  );
}
