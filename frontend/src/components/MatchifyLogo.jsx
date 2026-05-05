/**
 * MatchifyLogo — Shuttlecock-in-hexagon mark for Matchify.Pro
 *
 * Props:
 *   size       {number}  — icon height in px (default 40)
 *   variant    {'icon'|'horizontal'|'stacked'}
 *               icon       — icon only (square)
 *               horizontal — icon + wordmark side by side (navbar)
 *               stacked    — icon above wordmark (footer / loading)
 *   glow       {boolean}  — neon glow filter (default true)
 *   className  {string}
 */
export default function MatchifyLogo({
  size = 40,
  variant = 'icon',
  glow = true,
  className = '',
}) {
  const uid = `ml-${size}`;

  const Icon = (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', flexShrink: 0 }}
      aria-hidden="true"
    >
      <defs>
        {glow && (
          <filter id={`${uid}-glow`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
        <linearGradient id={`${uid}-grad`} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00ff88" />
          <stop offset="100%" stopColor="#00d4ff" />
        </linearGradient>
        <linearGradient id={`${uid}-cork`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#00ff88" />
          <stop offset="100%" stopColor="#00c853" />
        </linearGradient>
      </defs>

      {/* ── Hexagon frame ───────────────────────────────────────── */}
      {/* Outer glow halo */}
      <polygon
        points="50,4 92,27 92,73 50,96 8,73 8,27"
        fill="none"
        stroke={`url(#${uid}-grad)`}
        strokeWidth="7"
        opacity="0.18"
      />
      {/* Main hex border */}
      <polygon
        points="50,4 92,27 92,73 50,96 8,73 8,27"
        fill="#07071a"
        stroke={`url(#${uid}-grad)`}
        strokeWidth="2.5"
      />
      {/* Subtle inner fill */}
      <polygon
        points="50,10 87,30 87,70 50,90 13,70 13,30"
        fill="rgba(0,255,136,0.04)"
      />

      {/* ── Shuttlecock ──────────────────────────────────────────── */}

      {/* Cork (base) */}
      <ellipse
        cx="50" cy="74" rx="11" ry="8"
        fill={`url(#${uid}-cork)`}
        filter={glow ? `url(#${uid}-glow)` : undefined}
      />
      {/* Cork inner shadow */}
      <ellipse cx="50" cy="74" rx="6.5" ry="4.5" fill="#002a16" />
      {/* Cork highlight */}
      <ellipse cx="47" cy="71.5" rx="2.5" ry="1.5" fill="rgba(255,255,255,0.35)" />

      {/* Feather shafts — 5 lines from base of cork upward */}
      <g
        stroke={`url(#${uid}-grad)`}
        strokeWidth="2"
        strokeLinecap="round"
        filter={glow ? `url(#${uid}-glow)` : undefined}
      >
        <line x1="50" y1="66" x2="21" y2="27" />
        <line x1="50" y1="66" x2="34" y2="19" />
        <line x1="50" y1="66" x2="50" y2="17" />
        <line x1="50" y1="66" x2="66" y2="19" />
        <line x1="50" y1="66" x2="79" y2="27" />
      </g>

      {/* Feather skirt arc connecting tips */}
      <path
        d="M21,27 Q50,7 79,27"
        fill="none"
        stroke="#00ff88"
        strokeWidth="2.2"
        strokeLinecap="round"
        filter={glow ? `url(#${uid}-glow)` : undefined}
      />

      {/* Tip accent dots */}
      <g fill="#00d4ff" filter={glow ? `url(#${uid}-glow)` : undefined}>
        <circle cx="21" cy="27" r="2" />
        <circle cx="34" cy="19" r="2" />
        <circle cx="50" cy="17" r="2" />
        <circle cx="66" cy="19" r="2" />
        <circle cx="79" cy="27" r="2" />
      </g>
    </svg>
  );

  /* ── Wordmark text sizes keyed to icon size ──────────────── */
  const fontSize = Math.round(size * 0.4);
  const dotProSize = Math.round(size * 0.38);

  const Wordmark = (
    <span
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 0,
        lineHeight: 1,
        fontFamily: "'Inter', 'Arial Black', sans-serif",
        fontWeight: 900,
        letterSpacing: '-0.03em',
      }}
    >
      <span
        style={{
          fontSize: `${fontSize}px`,
          color: '#00ff88',
          textShadow: '0 0 16px rgba(0,255,136,0.55)',
        }}
      >
        MATCHIFY
      </span>
      <span
        style={{
          fontSize: `${dotProSize}px`,
          color: '#00d4ff',
          textShadow: '0 0 16px rgba(0,212,255,0.55)',
        }}
      >
        .PRO
      </span>
    </span>
  );

  if (variant === 'horizontal') {
    return (
      <span
        className={className}
        style={{ display: 'inline-flex', alignItems: 'center', gap: `${Math.round(size * 0.28)}px` }}
      >
        {Icon}
        {Wordmark}
      </span>
    );
  }

  if (variant === 'stacked') {
    return (
      <span
        className={className}
        style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: `${Math.round(size * 0.18)}px` }}
      >
        {Icon}
        {Wordmark}
      </span>
    );
  }

  // icon only
  return (
    <span className={className} style={{ display: 'inline-flex' }}>
      {Icon}
    </span>
  );
}
