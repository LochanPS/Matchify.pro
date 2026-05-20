/**
 * MatchifyLogo — Teal shield icon + "matchify.pro" wordmark
 * Blends into any dark background — no image box.
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
  const iconH = size;
  const iconW = Math.round(size * 0.88);   // shield is slightly narrower than tall
  const textH = size * 0.50;               // wordmark font-size
  const uid   = `ml${size}`;

  const ShieldIcon = (
    <svg
      width={iconW}
      height={iconH}
      viewBox="0 0 88 100"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', flexShrink: 0, overflow: 'visible' }}
    >
      <defs>
        {/* Teal gradient — matches reference logo */}
        <linearGradient id={`${uid}sg`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#4dd9c0" />
          <stop offset="45%"  stopColor="#1db8a0" />
          <stop offset="100%" stopColor="#0a8a72" />
        </linearGradient>

        {/* Inner highlight */}
        <linearGradient id={`${uid}hi`} x1="10%" y1="0%" x2="90%" y2="80%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.30)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.00)" />
        </linearGradient>

        {/* Glow filter */}
        <filter id={`${uid}glow`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
          <feFlood floodColor="#00e5c8" floodOpacity="0.55" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Shield body ── */}
      {/* Classic pointed shield: top rounded, bottom V-point */}
      <path
        d="M44 2 L82 14 L82 52 Q82 78 44 96 Q6 78 6 52 L6 14 Z"
        fill={`url(#${uid}sg)`}
        filter={`url(#${uid}glow)`}
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="1.5"
      />

      {/* Highlight overlay */}
      <path
        d="M44 2 L82 14 L82 52 Q82 78 44 96 Q6 78 6 52 L6 14 Z"
        fill={`url(#${uid}hi)`}
        style={{ mixBlendMode: 'overlay' }}
      />

      {/* Inner shield border */}
      <path
        d="M44 11 L74 21 L74 51 Q74 72 44 87 Q14 72 14 51 L14 21 Z"
        fill="none"
        stroke="rgba(255,255,255,0.20)"
        strokeWidth="1"
      />

      {/* ── Wings — two curved sweeps left and right ── */}
      {/* Left wing */}
      <path
        d="M14 38 Q2 30 2 18 Q10 28 14 38 Z"
        fill="#4dd9c0"
        opacity="0.85"
        filter={`url(#${uid}glow)`}
      />
      <path
        d="M14 44 Q-2 36 0 22 Q8 34 14 44 Z"
        fill="#1db8a0"
        opacity="0.70"
      />
      {/* Right wing */}
      <path
        d="M74 38 Q86 30 86 18 Q78 28 74 38 Z"
        fill="#4dd9c0"
        opacity="0.85"
        filter={`url(#${uid}glow)`}
      />
      <path
        d="M74 44 Q90 36 88 22 Q80 34 74 44 Z"
        fill="#1db8a0"
        opacity="0.70"
      />

      {/* ── M letter ── */}
      <text
        x="44"
        y="64"
        textAnchor="middle"
        fontFamily="'Arial Black','Impact',sans-serif"
        fontWeight="900"
        fontSize="38"
        fill="white"
        style={{ textShadow: 'none' }}
        filter={`url(#${uid}glow)`}
      >
        M
      </text>
    </svg>
  );

  const WordMark = (
    <span
      style={{
        fontFamily: "'Inter','Segoe UI','Arial',sans-serif",
        fontWeight: 800,
        fontSize: `${textH}px`,
        lineHeight: 1,
        letterSpacing: '-0.02em',
        whiteSpace: 'nowrap',
        display: 'inline-block',
      }}
    >
      <span style={{ color: '#ffffff' }}>matchify</span>
      <span style={{
        color: '#00e5c8',
        textShadow: '0 0 12px rgba(0,229,200,0.6)',
      }}>.pro</span>
    </span>
  );

  if (variant === 'icon') {
    return (
      <span className={className} style={{ display: 'inline-flex', alignItems: 'center' }}>
        {ShieldIcon}
      </span>
    );
  }

  if (variant === 'text') {
    return (
      <span className={className} style={{ display: 'inline-flex', alignItems: 'center' }}>
        {WordMark}
      </span>
    );
  }

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: `${Math.round(size * 0.20)}px`,
      }}
    >
      {ShieldIcon}
      {WordMark}
    </span>
  );
}
