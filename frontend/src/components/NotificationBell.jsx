import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';

const NotificationBell = () => {
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();

  return (
    <button
      onClick={() => navigate('/notifications')}
      style={{
        position: 'relative',
        width: 38, height: 38,
        borderRadius: 10,
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245,158,11,0.1)'; e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
      aria-label="Notifications"
    >
      <Bell style={{ width: 18, height: 18, color: 'rgba(255,255,255,0.65)' }} />
      {unreadCount > 0 && (
        <span style={{
          position: 'absolute', top: -4, right: -4,
          minWidth: 18, height: 18, padding: '0 4px',
          background: 'linear-gradient(135deg, #EF4444, #DC2626)',
          borderRadius: 10,
          fontSize: 10, fontWeight: 800, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(239,68,68,0.5)',
          lineHeight: 1
        }}>
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
};

export default NotificationBell;
