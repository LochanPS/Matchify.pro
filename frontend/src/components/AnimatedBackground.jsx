// AnimatedBackground — 2 large ambient blobs only
// Premium esports dark aesthetic: no stars, no balloons, no neon
// Cyan top-right + violet bottom-left, very subtle opacity
export default function AnimatedBackground({ variant = 'default', className = '', fullWidth = false }) {
  return (
    <div
      className={`fixed pointer-events-none overflow-hidden ${className}`}
      style={fullWidth
        ? { zIndex: 0, top: 0, bottom: 0, left: 0, right: 0, width: '100%' }
        : { zIndex: 0, top: 0, bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '480px' }
      }
      aria-hidden="true"
    >
      {/* Blob 1 — Cyan, top-right */}
      <div style={{
        position: 'absolute',
        width: '440px', height: '440px',
        top: '-140px', right: '-120px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245,158,11,0.09) 0%, transparent 70%)',
        filter: 'blur(80px)',
      }} />
      {/* Blob 2 — Violet, bottom-left */}
      <div style={{
        position: 'absolute',
        width: '400px', height: '400px',
        bottom: '5%', left: '-120px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)',
        filter: 'blur(80px)',
      }} />
    </div>
  );
}

