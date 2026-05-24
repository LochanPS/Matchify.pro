/**
 * SupportFooter — global support contact bar shown on every non-admin page.
 * Sits at the bottom of every page; styled to match the dark-neon app theme.
 */

export default function SupportFooter() {
  return (
    <footer
      style={{
        borderTop: '1px solid rgba(6,182,212,0.12)',
        background: 'rgba(6,182,212,0.03)',
        backdropFilter: 'blur(8px)',
        padding: '18px 20px',
        textAlign: 'center',
      }}
    >
      <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.01em' }}>
        Having queries or suggestions?&nbsp;
        <span style={{ color: 'rgba(255,255,255,0.6)' }}>Contact customer care:</span>
      </p>
      <a
        href="mailto:matchify.pro@gmail.com"
        style={{
          display: 'inline-block',
          marginTop: '5px',
          fontSize: '0.82rem',
          fontWeight: 600,
          color: '#22d3ee',
          textDecoration: 'none',
          letterSpacing: '0.02em',
          transition: 'color 0.2s, text-shadow 0.2s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.color = '#00d4ff';
          e.currentTarget.style.textShadow = '0 0 8px rgba(0,212,255,0.6)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.color = '#22d3ee';
          e.currentTarget.style.textShadow = 'none';
        }}
      >
        matchify.pro@gmail.com
      </a>
    </footer>
  );
}
