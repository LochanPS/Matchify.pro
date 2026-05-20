/**
 * MatchifyLogo — PNG logo image
 *
 * Props:
 *   size       {number}  — logo height in px (default 40)
 *   variant    {'full'|'icon'|'text'}
 *   className  {string}
 */
export default function MatchifyLogo({
  size = 48,
  variant = 'full',
  className = '',
}) {
  // All variants render the same PNG — size/cropping differ
  const style = {
    height: `${size}px`,
    width: 'auto',
    display: 'block',
    objectFit: 'contain',
    flexShrink: 0,
    filter: 'drop-shadow(0 0 6px rgba(0,220,130,0.35))',
  };

  return (
    <span
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center' }}
    >
      <img
        src="/logo.png"
        alt="Matchify.pro"
        style={style}
        draggable={false}
      />
    </span>
  );
}
