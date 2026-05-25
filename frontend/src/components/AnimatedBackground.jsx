// AnimatedBackground — ambient nebula blobs + rich star field
// Stars: deterministic (no random), twinkling via CSS keyframes
// Colors: white (majority), gold accent, purple accent
const STARS = Array.from({ length: 88 }, (_, i) => ({
  x:    (i * 37 + 11) % 97,
  y:    (i * 53 + 7)  % 93,
  o:    ((i * 13) % 55) / 100 + 0.38,          // 0.38 – 0.92
  dur:  (i * 7) % 8 + 4,                        // 4 – 11s twinkle
  del:  (i * 3) % 7,                            // 0 – 6s delay
  sz:   (i * 2) % 3 + 1,                        // 1, 2 or 3 px
  c:    i % 7 === 0
          ? 'rgba(245,158,11,'                   // gold accent
          : i % 11 === 0
            ? 'rgba(168,85,247,'                 // purple accent
            : 'rgba(255,255,255,',               // white (default)
}));

export default function AnimatedBackground({ variant = 'default', className = '', fullWidth = false }) {
  const containerStyle = fullWidth
    ? { zIndex: 0, top: 0, bottom: 0, left: 0, right: 0, width: '100%' }
    : { zIndex: 0, top: 0, bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '480px' };

  return (
    <div
      className={`fixed pointer-events-none overflow-hidden ${className}`}
      style={containerStyle}
      aria-hidden="true"
    >
      {/* ── Nebula Blob 1 — gold, top-right ── */}
      <div style={{
        position: 'absolute',
        width: '500px', height: '500px',
        top: '-160px', right: '-140px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)',
        filter: 'blur(90px)',
      }} />

      {/* ── Nebula Blob 2 — violet, bottom-left ── */}
      <div style={{
        position: 'absolute',
        width: '460px', height: '460px',
        bottom: '4%', left: '-130px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.13) 0%, transparent 70%)',
        filter: 'blur(90px)',
      }} />

      {/* ── Nebula Blob 3 — deep gold, mid-screen ── */}
      <div style={{
        position: 'absolute',
        width: '320px', height: '320px',
        top: '38%', left: '50%',
        transform: 'translateX(-50%)',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 70%)',
        filter: 'blur(70px)',
      }} />

      {/* ── Milky Way band — subtle diagonal streak ── */}
      <div style={{
        position: 'absolute',
        width: '140%', height: '280px',
        top: '28%', left: '-20%',
        transform: 'rotate(-18deg)',
        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.018) 30%, rgba(200,180,255,0.022) 50%, rgba(255,255,255,0.018) 70%, transparent 100%)',
        filter: 'blur(24px)',
        pointerEvents: 'none',
      }} />

      {/* ── Star field ── */}
      {STARS.map((s, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${s.x}%`,
            top:  `${s.y}%`,
            width:  `${s.sz}px`,
            height: `${s.sz}px`,
            borderRadius: '50%',
            background: `${s.c}${s.o})`,
            boxShadow: s.sz >= 2
              ? `0 0 ${s.sz * 2}px ${s.sz}px ${s.c}${s.o * 0.5})`
              : 'none',
            animation: `twinkle ${s.dur}s ease-in-out infinite`,
            animationDelay: `${s.del}s`,
          }}
        />
      ))}
    </div>
  );
}
