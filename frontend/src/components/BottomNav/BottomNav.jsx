import { useTransition, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { NAV_ITEMS, isBottomNavVisible, BOTTOM_NAV_HEIGHT } from './navConfig';

export default function BottomNav() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  const [, startTransition] = useTransition();

  if (!isBottomNavVisible(location.pathname, user)) return null;

  const handleNav = (item) => {
    // Auth-required tab tapped by guest → show prompt
    if (!user && item.requiresAuth) {
      setShowAuthPrompt(true);
      return;
    }
    // Already on this tab — no-op
    if (location.pathname === item.path || location.pathname.startsWith(item.path + '?')) return;
    startTransition(() => {
      navigate(item.path);
    });
  };

  return (
    <>
    {/* Auth prompt modal for guest users */}
    {showAuthPrompt && (
      <div
        onClick={() => setShowAuthPrompt(false)}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.65)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          paddingBottom: `calc(${BOTTOM_NAV_HEIGHT}px + env(safe-area-inset-bottom, 0px) + 12px)`,
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: '480px',
            background: '#0d1117',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '20px 20px 0 0',
            padding: '28px 24px 24px',
            boxShadow: '0 -8px 40px rgba(0,0,0,0.7)',
          }}
        >
          <div style={{ width: 36, height: 4, borderRadius: 999, background: 'rgba(255,255,255,0.2)', margin: '0 auto 20px' }} />
          <p style={{ textAlign: 'center', color: '#fff', fontWeight: 700, fontSize: 18, margin: '0 0 6px' }}>
            Sign in to continue
          </p>
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: '0 0 24px' }}>
            Create an account or log in to access this feature
          </p>
          <button
            onClick={() => { setShowAuthPrompt(false); navigate('/login'); }}
            style={{
              width: '100%', padding: '14px', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg, #D97706, #F59E0B)',
              color: '#000', fontWeight: 700, fontSize: 15, cursor: 'pointer',
              marginBottom: 10,
            }}
          >
            Log In
          </button>
          <button
            onClick={() => { setShowAuthPrompt(false); navigate('/register'); }}
            style={{
              width: '100%', padding: '14px', borderRadius: 12,
              border: '1px solid rgba(245,158,11,0.4)',
              background: 'transparent',
              color: '#F59E0B', fontWeight: 600, fontSize: 15, cursor: 'pointer',
            }}
          >
            Sign Up
          </button>
        </div>
      </div>
    )}

    <nav
      aria-label="Main navigation"
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        width: '100%',
        maxWidth: '480px',
        zIndex: 1000,
        WebkitTransform: 'translateX(-50%) translateZ(0)',
        transform: 'translateX(-50%) translateZ(0)',
        willChange: 'transform',
        background: 'rgba(4, 8, 16, 0.97)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.65), 0 -1px 0 rgba(245,158,11,0.06)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div style={{ display: 'flex', height: `${BOTTOM_NAV_HEIGHT}px` }}>
        {NAV_ITEMS.map((item) => {
          const isActive = item.matchPaths.some(
            (p) => location.pathname === p || location.pathname.startsWith(p)
          );
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => handleNav(item)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: isActive ? '#F59E0B' : 'rgba(255,255,255,0.38)',
                position: 'relative',
                padding: '6px 4px 4px',
                transition: 'color 0.16s ease',
                WebkitTapHighlightColor: 'transparent',
                outline: 'none',
                userSelect: 'none',
              }}
            >
              {/* Active indicator line */}
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

              {/* Icon pill */}
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
                    filter: isActive ? 'drop-shadow(0 0 6px rgba(245,158,11,0.5))' : 'none',
                  }}
                />
              </div>

              {/* Label */}
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: isActive ? 700 : 500,
                  letterSpacing: '0.01em',
                  lineHeight: 1,
                  whiteSpace: 'nowrap',
                  fontFamily: 'inherit',
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
    </>
  );
}
