/**
 * MatchifyLogo — Official Matchify.pro logo with shuttlecock and text
 *
 * Props:
 *   size       {number}  — logo height in px (default 40)
 *   variant    {'full'|'icon'|'text'}
 *               full  — full logo with shuttlecock and text (default)
 *               icon  — shuttlecock icon only
 *               text  — text only
 *   className  {string}
 */
export default function MatchifyLogo({
  size = 40,
  variant = 'full',
  className = '',
}) {
  // Calculate proportional width based on original logo aspect ratio (approx 3:1)
  const width = variant === 'full' ? size * 3 : size;

  if (variant === 'icon') {
    // Show only the shuttlecock part (left portion of logo)
    return (
      <img
        src="/logo.png"
        alt="Matchify.pro"
        className={className}
        style={{
          height: `${size}px`,
          width: `${size}px`,
          objectFit: 'cover',
          objectPosition: 'left center',
          display: 'block',
        }}
      />
    );
  }

  if (variant === 'text') {
    // Show only the text part (right portion of logo)
    return (
      <img
        src="/logo.png"
        alt="matchify.pro"
        className={className}
        style={{
          height: `${size}px`,
          width: `${size * 2}px`,
          objectFit: 'cover',
          objectPosition: 'right center',
          display: 'block',
        }}
      />
    );
  }

  // Full logo (default)
  return (
    <img
      src="/logo.png"
      alt="matchify.pro"
      className={className}
      style={{
        height: `${size}px`,
        width: 'auto',
        display: 'block',
      }}
    />
  );
}
