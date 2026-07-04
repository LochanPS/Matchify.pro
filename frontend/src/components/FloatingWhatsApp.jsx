import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isBottomNavVisible, BOTTOM_NAV_HEIGHT } from './BottomNav/navConfig';

// Floating "Join our WhatsApp group" button — bottom-right on every page.
// Tapping opens the group in WhatsApp (hands off to the app on mobile).
const WHATSAPP_GROUP_URL = 'https://chat.whatsapp.com/Bg6PsCwiHtZJjYQqykRgot';

export default function FloatingWhatsApp() {
  const location = useLocation();
  const { user } = useAuth();
  const [showLabel, setShowLabel] = useState(true);

  // Show the text label briefly on first load, then leave just the icon.
  useEffect(() => {
    const t = setTimeout(() => setShowLabel(false), 5000);
    return () => clearTimeout(t);
  }, []);

  // Sit above the bottom nav when it's on screen, else near the bottom edge.
  const navVisible = isBottomNavVisible(location.pathname, user);
  const bottomOffset = navVisible ? BOTTOM_NAV_HEIGHT + 16 : 16;

  return (
    <a
      href={WHATSAPP_GROUP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Join our WhatsApp group"
      style={{
        position: 'fixed',
        // Hug the 480px app column's right edge on wide screens; 16px in from
        // the edge on phones.
        right: 'max(16px, calc(50vw - 240px + 16px))',
        bottom: `calc(${bottomOffset}px + env(safe-area-inset-bottom, 0px))`,
        zIndex: 40, // below modals/navbar (z-50) so overlays still cover it
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        textDecoration: 'none',
      }}
    >
      {showLabel && (
        <span
          style={{
            background: '#ffffff',
            color: '#075E54',
            fontSize: '12px',
            fontWeight: 600,
            padding: '7px 11px',
            borderRadius: '10px',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
          }}
        >
          Join our WhatsApp group
        </span>
      )}
      <span
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: '#25D366',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(37,211,102,0.5)',
        }}
      >
        <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">
          <path
            fill="#ffffff"
            d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.359.101 11.945c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652a11.96 11.96 0 005.71 1.454h.006c6.585 0 11.946-5.359 11.949-11.945a11.9 11.9 0 00-3.481-8.418"
          />
        </svg>
      </span>
    </a>
  );
}
