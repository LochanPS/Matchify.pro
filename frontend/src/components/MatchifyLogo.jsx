/**
 * MatchifyLogo — Diamond gem with shuttlecock cutout + bold wordmark
 *
 * Props:
 *   size       {number}  — logo height in px (default 40)
 *   variant    {'full'|'icon'|'text'}
 *   className  {string}
 */
export default function MatchifyLogo({
  size = 40,
  variant = 'full',
  className = '',
}) {
  const green      = '#00ff88';
  const greenMid   = '#00e676';
  const greenDark  = '#00c853';
  const greenGlow  = 'rgba(0,255,136,0.5)';
  const iconSize   = size;
  const textHeight = size * 0.52;

  // Unique IDs so multiple instances don't clash
  const uid = `mlg${size}${variant}`;

  const DiamondIcon = (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <defs>
        {/* Green gem gradient */}
        <linearGradient id={`${uid}grad`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#00ff88" />
          <stop offset="45%"  stopColor="#00e676" />
          <stop offset="100%" stopColor="#00a844" />
        </linearGradient>

        {/* Inner highlight gradient */}
        <linearGradient id={`${uid}hi`} x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.35)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>

        {/* Glow filter */}
        <filter id={`${uid}glow`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feFlood floodColor="#00ff88" floodOpacity="0.6" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Shuttlecock CUTOUT mask
            white = keep green  |  black = cut out (transparent) */}
        <mask id={`${uid}mask`}>
          <rect width="100" height="100" fill="white" />

          {/* ── Feather stem lines fanning upward from cork ── */}
          <line x1="50" y1="63" x2="33" y2="28" stroke="black" strokeWidth="5"  strokeLinecap="round" />
          <line x1="50" y1="63" x2="40" y2="22" stroke="black" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="50" y1="63" x2="50" y2="19" stroke="black" strokeWidth="5"  strokeLinecap="round" />
          <line x1="50" y1="63" x2="60" y2="22" stroke="black" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="50" y1="63" x2="67" y2="28" stroke="black" strokeWidth="5"  strokeLinecap="round" />

          {/* ── Feather tip arc ── */}
          <path
            d="M 33 28 Q 50 13, 67 28"
            fill="none"
            stroke="black"
            strokeWidth="5"
            strokeLinecap="round"
          />

          {/* ── Cork (oval at base) ── */}
          <ellipse cx="50" cy="67" rx="11" ry="7.5" fill="black" />
        </mask>
      </defs>

      {/* ── Shadow/glow ring behind diamond ── */}
      <polygon
        points="50,2 98,50 50,98 2,50"
        fill="none"
        stroke="rgba(0,255,136,0.25)"
        strokeWidth="3"
      />

      {/* ── Main diamond with shuttlecock cutout ── */}
      <polygon
        points="50,5 95,50 50,95 5,50"
        fill={`url(#${uid}grad)`}
        mask={`url(#${uid}mask)`}
        filter={`url(#${uid}glow)`}
      />

      {/* ── Top-left facet highlight (gem depth) ── */}
      <polygon
        points="50,5 5,50 50,50"
        fill={`url(#${uid}hi)`}
        mask={`url(#${uid}mask)`}
        style={{ mixBlendMode: 'overlay' }}
      />

      {/* ── Outer diamond border ── */}
      <polygon
        points="50,5 95,50 50,95 5,50"
        fill="none"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1"
      />
    </svg>
  );

  const LogoText = (
    <span
      style={{
        fontFamily: "'Inter','Segoe UI','Arial',sans-serif",
        fontWeight: 900,
        fontSize: `${textHeight}px`,
        lineHeight: 1,
        letterSpacing: '-0.03em',
        display: 'inline-block',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{
        color: '#ffffff',
        textShadow: '0 0 24px rgba(255,255,255,0.25)',
      }}>
        matchify
      </span>
      <span style={{
        color: green,
        textShadow: `0 0 16px ${greenGlow}`,
      }}>
        .pro
      </span>
    </span>
  );

  if (variant === 'icon') {
    return (
      <span className={className} style={{ display: 'inline-flex', alignItems: 'center' }}>
        {DiamondIcon}
      </span>
    );
  }

  if (variant === 'text') {
    return (
      <span className={className} style={{ display: 'inline-flex', alignItems: 'center' }}>
        {LogoText}
      </span>
    );
  }

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: `${size * 0.22}px`,
      }}
    >
      {DiamondIcon}
      {LogoText}
    </span>
  );
}
