/**
 * MatchifyLogo — Official matchify.pro logo with shuttlecock
 * 
 * Features:
 * - Shuttlecock graphic with green swoosh
 * - "matchify.pro" text in one straight line
 * - Softer, less bright green colors
 * - Fully coded in SVG
 *
 * Props:
 *   size       {number}  — logo height in px (default 40)
 *   variant    {'full'|'icon'|'text'}
 *               full  — shuttlecock + text (default)
 *               icon  — shuttlecock only
 *               text  — text only
 *   className  {string}
 */
export default function MatchifyLogo({
  size = 40,
  variant = 'full',
  className = '',
}) {
  // Softer green colors (less neon, more professional)
  const softGreen = '#00c853';      // Softer green for "matchify"
  const softGreenGlow = 'rgba(0,200,83,0.3)';  // Subtle glow
  
  // Calculate proportions
  const shuttlecockSize = size;
  const textHeight = size * 0.5;
  const totalWidth = variant === 'full' ? size * 4.5 : size;

  // Shuttlecock SVG
  const ShuttlecockIcon = (
    <svg
      width={shuttlecockSize}
      height={shuttlecockSize}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id="shuttleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={softGreen} />
          <stop offset="100%" stopColor="#00a844" />
        </linearGradient>
        <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feFlood floodColor={softGreen} floodOpacity="0.3" />
          <feComposite in2="blur" operator="in" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Swoosh/arc behind shuttlecock */}
      <path
        d="M 20 50 Q 35 25, 50 20 Q 65 25, 80 50"
        fill="none"
        stroke="url(#shuttleGrad)"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.6"
      />

      {/* Shuttlecock feathers (cone shape) */}
      <g filter="url(#softGlow)">
        {/* Feather lines */}
        <line x1="50" y1="65" x2="35" y2="30" stroke={softGreen} strokeWidth="2" strokeLinecap="round" />
        <line x1="50" y1="65" x2="42" y2="25" stroke={softGreen} strokeWidth="2" strokeLinecap="round" />
        <line x1="50" y1="65" x2="50" y2="22" stroke={softGreen} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="50" y1="65" x2="58" y2="25" stroke={softGreen} strokeWidth="2" strokeLinecap="round" />
        <line x1="50" y1="65" x2="65" y2="30" stroke={softGreen} strokeWidth="2" strokeLinecap="round" />
        
        {/* Feather tips arc */}
        <path
          d="M 35 30 Q 50 18, 65 30"
          fill="none"
          stroke={softGreen}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        
        {/* Feather tip dots */}
        <circle cx="35" cy="30" r="2" fill={softGreen} />
        <circle cx="42" cy="25" r="2" fill={softGreen} />
        <circle cx="50" cy="22" r="2.5" fill={softGreen} />
        <circle cx="58" cy="25" r="2" fill={softGreen} />
        <circle cx="65" cy="30" r="2" fill={softGreen} />
      </g>

      {/* Cork (base of shuttlecock) */}
      <ellipse
        cx="50"
        cy="68"
        rx="12"
        ry="9"
        fill="url(#shuttleGrad)"
        filter="url(#softGlow)"
      />
      <ellipse cx="50" cy="68" rx="7" ry="5" fill="#007c35" />
      <ellipse cx="47" cy="66" rx="3" ry="2" fill="rgba(255,255,255,0.4)" />
    </svg>
  );

  // Text in one straight line
  const LogoText = (
    <span
      style={{
        fontFamily: "'Inter', 'Segoe UI', 'Arial', sans-serif",
        fontWeight: 700,
        fontSize: `${textHeight}px`,
        lineHeight: 1,
        letterSpacing: '-0.02em',
        display: 'inline-block',
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          color: softGreen,
          textShadow: `0 0 10px ${softGreenGlow}`,
        }}
      >
        matchify
      </span>
      <span
        style={{
          color: softGreen,
          textShadow: `0 0 10px ${softGreenGlow}`,
        }}
      >
        .pro
      </span>
    </span>
  );

  // Render based on variant
  if (variant === 'icon') {
    return (
      <span className={className} style={{ display: 'inline-flex', alignItems: 'center' }}>
        {ShuttlecockIcon}
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

  // Full logo (icon + text in one line)
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: `${size * 0.3}px`,
      }}
    >
      {ShuttlecockIcon}
      {LogoText}
    </span>
  );
}
