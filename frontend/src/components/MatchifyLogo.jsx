/**
 * MatchifyLogo — Matchify.pro PNG logo (transparent background)
 *
 * logo.png is 1083×992px. Background pixels have been made fully transparent.
 * Logo content (shield + sparkles + Matchify.pro text) occupies the TOP 60%
 * of the image (y=0 to y≈595). Bottom 40% is transparent empty space.
 *
 * overflow:hidden on the container clips that empty space so the element
 * height matches the visible logo height — no extra whitespace in layout.
 *
 * Props:
 *   size      {number} — visible height in px (default 40)
 *   className {string}
 */
export default function MatchifyLogo({ size = 40, className = '' }) {
  const RATIO     = 1.092; // full PNG width / height (1083 / 992)
  const SHOW_FRAC = 0.60;  // content occupies top 60% of image

  const fullH = Math.round(size / SHOW_FRAC); // render image at this height
  const fullW = Math.round(fullH * RATIO);     // preserve aspect ratio

  return (
    <span
      className={className}
      style={{
        display:    'inline-flex',
        alignItems: 'flex-start',
        overflow:   'hidden',
        height:     `${size}px`,
        width:      `${fullW}px`,
        flexShrink: 0,
      }}
    >
      <img
        src="/logo.png"
        alt="Matchify.pro"
        draggable={false}
        style={{
          height:   `${fullH}px`,
          width:    `${fullW}px`,
          display:  'block',
          flexShrink: 0,
        }}
      />
    </span>
  );
}
