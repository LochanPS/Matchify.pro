import React, { useEffect } from 'react';
import { X, CheckCheck, Trash2, Bell } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

const NotificationDropdown = ({ onClose }) => {
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
      PARTNER_INVITATION: '🤝',
      PARTNER_ACCEPTED: '👍',
      PARTNER_DECLINED: '👎',
      DRAW_PUBLISHED: '📊',
      MATCH_ASSIGNED: '⚖️',
      MATCH_STARTING_SOON: '⏰',
      TOURNAMENT_CANCELLED: '❌',
      REFUND_PROCESSED: '💰',
      TOURNAMENT_REMINDER: '📅',
      POINTS_AWARDED: '🏆',
      ACCOUNT_SUSPENDED: '⚠️',
    };
    return icons[type] || '🔔';
  };

  return (
    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[600px] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
        <div className="flex items-center space-x-2">
          {notifications.some(n => !n.read) && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
            >
              <CheckCheck className="w-4 h-4 mr-1" />
              Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="overflow-y-auto flex-1">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 transition cursor-pointer ${
                  !notification.read ? 'bg-blue-50' : ''
                }`}
                onClick={() => {
                  if (!notification.read) {
                    markAsRead(notification.id);
                  }
                }}
              >
                <div className="flex items-start space-x-3">
                  <span className="text-2xl flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {notification.title}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                    className="flex-shrink-0 p-1 hover:bg-gray-200 rounded"
                  >
                    <Trash2 className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-gray-200 text-center">
          <a
            href="/notifications"
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            View all notifications
          </a>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
