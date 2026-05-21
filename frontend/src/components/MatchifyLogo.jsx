/**
 * MatchifyLogo — Matchify.pro PNG logo
 *
 * logo.png is 1083×992px. Content (shield + sparkles + text) occupies TOP 60%
 * of image height. Bottom 40% is empty dark space.
 *
 * overflow:hidden clips the empty bottom space.
 *
 * Props:
 *   size      {number}  — visible height in px (default 40)
 *   className {string}
 *   onPurple  {boolean} — true when placed on a purple/colored background
 *                         (enables screen blend so dark bg disappears into purple).
 *                         false (default) = dark bg naturally matches dark page bg.
 */
export default function MatchifyLogo({ size = 40, className = '', onPurple = false }) {
  const RATIO     = 1.092; // full PNG width / height (1083 / 992)
  const SHOW_FRAC = 0.60;  // content occupies top 60% of image

  const fullH = Math.round(size / SHOW_FRAC);
  const fullW = Math.round(fullH * RATIO);

  return (
    <span
      className={className}
      style={{
        display:    'block',
        overflow:   'hidden',
        height:     `${size}px`,
        width:      `${fullW}px`,
        flexShrink: 0,
        margin:     '0 auto',
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
          // On purple navbar: screen blend makes dark bg merge into purple.
          // On dark bg: no blend — dark logo bg == dark page bg, naturally seamless.
          mixBlendMode: onPurple ? 'screen' : 'normal',
          filter:       onPurple ? 'brightness(1.5) contrast(1.1)' : 'brightness(1.1)',
        }}
      />
    </span>
  );
}
