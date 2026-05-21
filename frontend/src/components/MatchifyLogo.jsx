/**
 * MatchifyLogo — Matchify.pro PNG logo
 *
 * logo.png is 1083×992px. Content (shield + sparkles + text) occupies TOP 60%
 * of image height. Bottom 40% is empty dark space.
 *
 * overflow:hidden clips the empty bottom space.
 * mix-blend-mode:screen makes the dark navy background pixels merge with
 * whatever is behind the logo (purple navbar, dark hero, etc.) so the logo
 * appears to float without a visible box/card.
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
          height:      `${fullH}px`,
          width:       `${fullW}px`,
          display:     'block',
          flexShrink:  0,
          mixBlendMode: 'screen',
          filter:      'brightness(1.4) contrast(1.1)',
        }}
      />
    </span>
  );
}
