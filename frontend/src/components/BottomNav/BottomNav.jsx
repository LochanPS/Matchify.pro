import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { NAV_ITEMS, isBottomNavVisible, BOTTOM_NAV_HEIGHT } from './navConfig';

export default function BottomNav() {
  const { user } = useAuth();
  const location = useLocation();

  if (!isBottomNavVisible(location.pathname, user)) return null;

  return (
    <nav
      aria-label="Main navigation"
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '480px',
        zIndex: 200,
        // Frosted dark glass
        background: 'rgba(4, 8, 16, 0.97)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        // Separation from content
        borderTop: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.65), 0 -1px 0 rgba(245,158,11,0.06)',
        // Respect device safe area (gesture bar on Android/iOS)
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div
        style={{
          display: 'flex',
          height: `${BOTTOM_NAV_HEIGHT}px`,
        }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = item.matchPaths.some(
            (p) => location.pathname === p || location.pathname.startsWith(p)
          );
          const Icon = item.icon;

          return (
            <Link
              key={item.id}
              to={item.path}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                textDecoration: 'none',
                color: isActive ? '#F59E0B' : 'rgba(255,255,255,0.38)',
                position: 'relative',
                padding: '6px 4px 4px',
                transition: 'color 0.16s ease',
                // Disable the blue flash on mobile tap
                WebkitTapHighlightColor: 'transparent',
                outline: 'none',
                userSelect: 'none',
              }}
            >
              {/* ── Active indicator line at top ── */}
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: isActive ? '32px' : '0px',
                  height: '2.5px',
                  background: 'linear-gradient(90deg, #D97706, #F59E0B, #FCD34D)',
                  borderRadius: '0 0 4px 4px',
                  transition: 'width 0.2s cubic-bezier(0.34,1.56,0.64,1)',
                  boxShadow: isActive ? '0 1px 8px rgba(245,158,11,0.55)' : 'none',
                }}
              />

              {/* ── Icon with active pill ── */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '48px',
                  height: '28px',
                  borderRadius: '14px',
                  background: isActive ? 'rgba(245,158,11,0.13)' : 'transparent',
                  transition: 'background 0.16s ease',
                  flexShrink: 0,
                }}
              >
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.4 : 1.75}
                  style={{
                    transition: 'stroke-width 0.16s ease',
                    // Subtle glow on active icon
                    filter: isActive ? 'drop-shadow(0 0 6px rgba(245,158,11,0.5))' : 'none',
                  }}
                />
              </div>

              {/* ── Label ── */}
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: isActive ? 700 : 500,
                  letterSpacing: '0.015em',
                  lineHeight: 1,
                  maxWidth: '60px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontFamily: 'inherit',
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
