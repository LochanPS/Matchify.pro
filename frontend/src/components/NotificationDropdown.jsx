import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, CheckCheck, Trash2, Bell, ChevronRight } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { formatDistanceToNow, format } from 'date-fns';

const NotificationDropdown = ({ onClose }) => {
  const navigate = useNavigate();
  const {
    notifications,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const getNotificationIcon = (type) => {
    const icons = {
      REGISTRATION_CONFIRMED: '✅',
      REGISTRATION_REJECTED: '❌',
      REGISTRATION_REMOVED: '🚫',
      REGISTRATION_PENDING: '⏳',
      PAYMENT_VERIFICATION_REQUIRED: '💳',
      PARTNER_INVITATION: '🤝',
      PARTNER_ACCEPTED: '👍',
      PARTNER_DECLINED: '👎',
      DRAW_PUBLISHED: '📊',
      MATCH_ASSIGNED: '⚖️',
      MATCH_STARTING_SOON: '⏰',
      TOURNAMENT_CANCELLED: '❌',
      REFUND_PROCESSED: '💰',
      REFUND_APPROVED: '💰',
      REFUND_REJECTED: '❌',
      TOURNAMENT_REMINDER: '📅',
      POINTS_AWARDED: '🏆',
      ACCOUNT_SUSPENDED: '⚠️',
      CANCELLATION_REQUEST: '🔴',
    };
    return icons[type] || '🔔';
  };

  // Get navigation path based on notification type and data
  const getNotificationPath = (notification) => {
    const data = notification.data ? JSON.parse(notification.data) : {};
    const type = notification.type;

    switch (type) {
      case 'CANCELLATION_REQUEST':
        // Navigate to dedicated cancellation request page
        if (data.registrationId) {
          return `/organizer/cancellation/${data.registrationId}`;
        }
        if (data.tournamentId) {
          return `/organizer/tournaments/${data.tournamentId}?tab=refunds`;
        }
        return '/organizer/dashboard';

      case 'PAYMENT_VERIFICATION_REQUIRED':
      case 'REGISTRATION_PENDING':
        // Navigate to tournament management page for organizer
        if (data.tournamentId) {
          return `/organizer/tournaments/${data.tournamentId}`;
        }
        return '/organizer/dashboard';
      
      case 'REGISTRATION_CONFIRMED':
      case 'REGISTRATION_REJECTED':
      case 'REGISTRATION_REMOVED':
      case 'REFUND_APPROVED':
      case 'REFUND_REJECTED':
        // Navigate to player's registrations
        return '/registrations';
      
      case 'PARTNER_INVITATION':
        // Navigate to partner confirmation page
        if (data.token) {
          return `/partner/confirm/${data.token}`;
        }
        return '/registrations';
      
      case 'PARTNER_ACCEPTED':
      case 'PARTNER_DECLINED':
        return '/registrations';
      
      case 'DRAW_PUBLISHED':
        if (data.tournamentId) {
          return `/tournaments/${data.tournamentId}/draws`;
        }
        return '/tournaments';
      
      case 'MATCH_ASSIGNED':
      case 'MATCH_STARTING_SOON':
        if (data.matchId) {
          // Navigate to match configuration page first
          return `/match/${data.matchId}/conduct`;
        }
        if (data.tournamentId) {
          return `/tournaments/${data.tournamentId}`;
        }
        return '/tournaments';
      
      case 'TOURNAMENT_CANCELLED':
      case 'TOURNAMENT_REMINDER':
        if (data.tournamentId) {
          return `/tournaments/${data.tournamentId}`;
        }
        return '/tournaments';
      
      case 'REFUND_PROCESSED':
        return '/wallet';
      
      case 'POINTS_AWARDED':
        return '/points';
      
      default:
        return null;
    }
  };

  const handleNotificationClick = (notification) => {
    // Mark as read
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Get the correct navigation path based on notification type
    const path = getNotificationPath(notification);
    
    onClose();
    
    // Navigate to the specific page if path exists, otherwise to notification detail
    if (path) {
      navigate(path);
    } else {
      navigate(`/notifications/${notification.id}`);
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-96 bg-slate-800 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 z-50 max-h-[600px] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h3 className="text-lg font-semibold text-white">Notifications</h3>
        <div className="flex items-center space-x-2">
          {notifications.some(n => !n.read) && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-purple-400 hover:text-purple-300 flex items-center transition-colors"
            >
              <CheckCheck className="w-4 h-4 mr-1" />
              Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="overflow-y-auto flex-1">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-400 mt-3">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="w-12 h-12 mx-auto mb-2 text-gray-600" />
            <p className="text-gray-400">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {notifications.map((notification) => {
              const hasAction = getNotificationPath(notification) !== null;
              return (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-white/5 transition cursor-pointer ${
                    !notification.read ? 'bg-purple-500/10 border-l-2 border-purple-500' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-2 flex items-center gap-2">
                        <span>
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                        <span className="text-gray-600">•</span>
                        <span>
                          {format(new Date(notification.createdAt), 'dd/MM/yyyy, h:mm a')}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {hasAction && (
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        className="p-1 hover:bg-red-500/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-white/10 text-center">
          <button
            onClick={() => {
              onClose();
              navigate('/notifications');
            }}
            className="text-sm text-purple-400 hover:text-purple-300 font-medium transition-colors"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
