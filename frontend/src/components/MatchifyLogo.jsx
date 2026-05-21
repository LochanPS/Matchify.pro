/**
 * MatchifyLogo — Matchify.pro PNG logo
 * Full image: 1083×992px
 *
 * Key finding from pixel sampling:
 *   - Logo content (shield + sparkles + text) occupies the TOP 56% of the image
 *   - Bottom 44% is pure dark empty space → causes the visible "card/box" look
 *   - Content starts at y=0, ends at y≈558
 *
 * Fix:
 *   1. overflow:hidden container shows only top 62% (content + small padding)
 *      — eliminates the large dark empty bottom that made it look like a box
 *   2. mix-blend-mode:screen — dark pixels between logo elements become
 *      transparent (show background through) on any background color
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
  const RATIO        = 1.092;  // full image width/height (1083/992)
  const SHOW_FRAC    = 0.62;   // show top 62% — content ends at 56%, small padding added

  // Full render dimensions
  const fullH = Math.round(size / SHOW_FRAC);
  const fullW = Math.round(fullH * RATIO);

  // Visible window — same width as full, cropped height
  const visH = size;
  const visW = fullW;

  return (
    <span
      className={className}
      style={{
        display:    'inline-flex',
        alignItems: 'center',
        overflow:   'hidden',
        height:     `${visH}px`,
        width:      `${visW}px`,
        flexShrink: 0,
      }}
    >
      <img
        src="/logo.png"
        alt="Matchify.pro"
        draggable={false}
        style={{
          height:       `${fullH}px`,
          width:        `${fullW}px`,
          display:      'block',
          flexShrink:   0,
          marginTop:    0,
          mixBlendMode: 'screen',
          filter:       'brightness(1.1)',
        }}
      />
    </span>
  );
}
