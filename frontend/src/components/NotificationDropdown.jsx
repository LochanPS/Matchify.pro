import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, CheckCheck, Bell, ChevronRight } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { formatDistanceToNow, format } from 'date-fns';
import Spinner from '../components/Spinner';

const NotificationDropdown = ({ onClose }) => {
  const navigate = useNavigate();
  const { notifications, loading, fetchNotifications, markAsRead, markAllAsRead } = useNotifications();

  useEffect(() => { fetchNotifications(); }, []);

  const getNotificationIcon = (type) => {
    const icons = {
      REGISTRATION_CONFIRMED: '✅', REGISTRATION_REJECTED: '❌', PAYMENT_REJECTED: '❌',
      REGISTRATION_REMOVED: '🚫', REGISTRATION_PENDING: '⏳', PAYMENT_VERIFICATION_REQUIRED: '💳',
      PARTNER_INVITATION: '🤝', PARTNER_ACCEPTED: '👍', PARTNER_DECLINED: '👎',
      DRAW_PUBLISHED: '📊', MATCH_ASSIGNED: '⚖️', MATCH_STARTING_SOON: '⏰',
      TOURNAMENT_CANCELLED: '❌', REFUND_PROCESSED: '💰', REFUND_APPROVED: '💰',
      REFUND_REJECTED: '❌', TOURNAMENT_REMINDER: '📅', POINTS_AWARDED: '🏆',
      ACCOUNT_SUSPENDED: '⚠️', CANCELLATION_REQUEST: '🔴',
    };
    return icons[type] || '🔔';
  };

  const getNotificationPath = (notification) => {
    const data = notification.data ? JSON.parse(notification.data) : {};
    const type = notification.type;
    switch (type) {
      case 'CANCELLATION_REQUEST':
        if (data.registrationId) return `/organizer/cancellation/${data.registrationId}`;
        if (data.tournamentId) return `/organizer/tournaments/${data.tournamentId}?tab=refunds`;
        return '/organizer/dashboard';
      case 'PAYMENT_VERIFICATION_REQUIRED': case 'REGISTRATION_PENDING':
        if (data.tournamentId) return `/organizer/tournaments/${data.tournamentId}`;
        return '/organizer/dashboard';
      case 'REGISTRATION_CONFIRMED': case 'REGISTRATION_REJECTED': case 'REGISTRATION_REMOVED':
      case 'REFUND_APPROVED': case 'REFUND_REJECTED': return '/registrations';
      case 'PARTNER_INVITATION':
        if (data.token) return `/partner/confirm/${data.token}`;
        return '/registrations';
      case 'PARTNER_ACCEPTED': case 'PARTNER_DECLINED': return '/registrations';
      case 'DRAW_PUBLISHED':
        if (data.tournamentId) return `/tournaments/${data.tournamentId}/draws`;
        return '/tournaments';
      case 'MATCH_ASSIGNED': case 'MATCH_STARTING_SOON':
        if (data.matchId) { const uid = data.umpireId || ''; return `/match/${data.matchId}/conduct${uid ? `?umpireId=${uid}` : ''}`; }
        if (data.tournamentId) return `/tournaments/${data.tournamentId}`;
        return '/tournaments';
      case 'TOURNAMENT_CANCELLED': case 'TOURNAMENT_REMINDER':
        if (data.tournamentId) return `/tournaments/${data.tournamentId}`;
        return '/tournaments';
      case 'REFUND_PROCESSED': return '/registrations';
      case 'POINTS_AWARDED': return '/points';
      default: return null;
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) markAsRead(notification.id);
    const path = getNotificationPath(notification);
    onClose();
    navigate(path || `/notifications/${notification.id}`);
  };

  return (
    <div style={{
      position: 'absolute', right: 0, marginTop: 8,
      width: 'min(calc(100vw - 2rem), 384px)',
      background: 'linear-gradient(145deg, #0C1220, #0A0F1A)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 18,
      boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(245,158,11,0.08)',
      zIndex: 50,
      maxHeight: 560,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0 }}>Notifications</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {notifications.some(n => !n.read) && (
            <button
              onClick={markAllAsRead}
              style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: '#FCD34D', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '5px 10px', cursor: 'pointer' }}
            >
              <CheckCheck style={{ width: 13, height: 13 }} />
              Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>
      </div>

      {/* List */}
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {loading ? (
          <div style={{ padding: 32, textAlign: 'center' }}>
            <Spinner size="md" />
            <p style={{ color: 'rgba(255,255,255,0.3)', marginTop: 12, fontSize: 13 }}>Loading…</p>
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <Bell style={{ width: 36, height: 36, color: 'rgba(255,255,255,0.15)', margin: '0 auto 12px' }} />
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>No notifications yet</p>
          </div>
        ) : (
          notifications.map((n) => {
            const hasAction = getNotificationPath(n) !== null;
            return (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                style={{
                  padding: '13px 16px',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  cursor: 'pointer',
                  background: !n.read ? 'rgba(245,158,11,0.05)' : 'transparent',
                  borderLeft: !n.read ? '3px solid rgba(245,158,11,0.5)' : '3px solid transparent',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = !n.read ? 'rgba(245,158,11,0.09)' : 'rgba(255,255,255,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = !n.read ? 'rgba(245,158,11,0.05)' : 'transparent'}
              >
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 20, flexShrink: 0, lineHeight: 1.3 }}>{getNotificationIcon(n.type)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: !n.read ? 700 : 500, color: !n.read ? '#fff' : 'rgba(255,255,255,0.65)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {n.title}
                    </p>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {n.message}
                    </p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 5 }}>
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {hasAction && <ChevronRight style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.25)', flexShrink: 0, marginTop: 2 }} />}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.07)', textAlign: 'center' }}>
          <button
            onClick={() => { onClose(); navigate('/notifications'); }}
            style={{ fontSize: 13, fontWeight: 600, color: '#FCD34D', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            View all notifications →
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
