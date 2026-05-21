/**
 * MatchifyLogo — Matchify.pro PNG logo (transparent background)
 *
 * logo.png is 960×400px — cropped to content area, gray background removed.
 * Aspect ratio 2.4:1. No empty space.
 *
 * Props:
 *   size      {number}  — height in px (default 40)
 *   className {string}
 *   onPurple  {boolean} — unused now (kept for compat); logo is transparent
 */
export default function MatchifyLogo({ size = 40, className = '', onPurple = false }) {
  const RATIO = 2.4; // 960 / 400

  const h = size;
  const w = Math.round(h * RATIO);

  return (
    <span
      className={className}
      style={{
        display:    'block',
        height:     `${h}px`,
        width:      `${w}px`,
        flexShrink: 0,
        margin:     '0 auto',
      }}
    >
      <img
        src="/logo.png"
        alt="Matchify.pro"
        draggable={false}
        style={{
          height:  `${h}px`,
          width:   `${w}px`,
          display: 'block',
        }}
      />
    </span>
  );
}
