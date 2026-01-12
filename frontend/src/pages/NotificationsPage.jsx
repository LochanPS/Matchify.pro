import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { 
  ArrowLeftIcon, 
  CheckCircleIcon,
  BellIcon,
  TrashIcon,
  CheckIcon,
  BellAlertIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const {
    notifications,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchNotifications();
  }, []);

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
        if (data.matchId && data.tournamentId) {
          return `/tournaments/${data.tournamentId}/matches/${data.matchId}`;
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
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Always navigate to the notification detail page
    navigate(`/notifications/${notification.id}`);
  };

  const getNotificationStyle = (type) => {
    const styles = {
      REGISTRATION_CONFIRMED: {
        icon: '✅',
        gradient: 'from-green-500 to-emerald-600',
        bg: 'bg-slate-800/80',
        border: 'border-l-green-500',
        iconBg: 'bg-green-500/20 border border-green-500/30'
      },
      REGISTRATION_REJECTED: {
        icon: '❌',
        gradient: 'from-red-500 to-rose-600',
        bg: 'bg-slate-800/80',
        border: 'border-l-red-500',
        iconBg: 'bg-red-500/20 border border-red-500/30'
      },
      REGISTRATION_REMOVED: {
        icon: '🚫',
        gradient: 'from-red-500 to-orange-600',
        bg: 'bg-slate-800/80',
        border: 'border-l-red-500',
        iconBg: 'bg-red-500/20 border border-red-500/30'
      },
      TOURNAMENT_CANCELLED: {
        icon: '📛',
        gradient: 'from-red-600 to-rose-700',
        bg: 'bg-slate-800/80',
        border: 'border-l-red-600',
        iconBg: 'bg-red-500/20 border border-red-500/30'
      },
      PARTNER_INVITATION: {
        icon: '🤝',
        gradient: 'from-blue-500 to-indigo-600',
        bg: 'bg-slate-800/80',
        border: 'border-l-blue-500',
        iconBg: 'bg-blue-500/20 border border-blue-500/30'
      },
      PARTNER_ACCEPTED: {
        icon: '👍',
        gradient: 'from-green-500 to-teal-600',
        bg: 'bg-slate-800/80',
        border: 'border-l-green-500',
        iconBg: 'bg-green-500/20 border border-green-500/30'
      },
      PARTNER_DECLINED: {
        icon: '👎',
        gradient: 'from-orange-500 to-amber-600',
        bg: 'bg-slate-800/80',
        border: 'border-l-orange-500',
        iconBg: 'bg-orange-500/20 border border-orange-500/30'
      },
      DRAW_PUBLISHED: {
        icon: '📊',
        gradient: 'from-purple-500 to-violet-600',
        bg: 'bg-slate-800/80',
        border: 'border-l-purple-500',
        iconBg: 'bg-purple-500/20 border border-purple-500/30'
      },
      MATCH_ASSIGNED: {
        icon: '🏸',
        gradient: 'from-cyan-500 to-sky-600',
        bg: 'bg-slate-800/80',
        border: 'border-l-cyan-500',
        iconBg: 'bg-cyan-500/20 border border-cyan-500/30'
      },
      MATCH_STARTING_SOON: {
        icon: '⏰',
        gradient: 'from-yellow-500 to-amber-600',
        bg: 'bg-slate-800/80',
        border: 'border-l-yellow-500',
        iconBg: 'bg-yellow-500/20 border border-yellow-500/30'
      },
      REFUND_PROCESSED: {
        icon: '💰',
        gradient: 'from-green-500 to-emerald-600',
        bg: 'bg-slate-800/80',
        border: 'border-l-green-500',
        iconBg: 'bg-green-500/20 border border-green-500/30'
      },
      TOURNAMENT_REMINDER: {
        icon: '📅',
        gradient: 'from-blue-500 to-sky-600',
        bg: 'bg-slate-800/80',
        border: 'border-l-blue-500',
        iconBg: 'bg-blue-500/20 border border-blue-500/30'
      },
      POINTS_AWARDED: {
        icon: '🏆',
        gradient: 'from-yellow-500 to-amber-600',
        bg: 'bg-slate-800/80',
        border: 'border-l-yellow-500',
        iconBg: 'bg-yellow-500/20 border border-yellow-500/30'
      },
      ACCOUNT_SUSPENDED: {
        icon: '⚠️',
        gradient: 'from-red-600 to-rose-700',
        bg: 'bg-slate-800/80',
        border: 'border-l-red-600',
        iconBg: 'bg-red-500/20 border border-red-500/30'
      },
      CANCELLATION_REQUEST: {
        icon: '🔴',
        gradient: 'from-orange-500 to-red-600',
        bg: 'bg-slate-800/80',
        border: 'border-l-orange-500',
        iconBg: 'bg-orange-500/20 border border-orange-500/30'
      },
      REFUND_APPROVED: {
        icon: '💰',
        gradient: 'from-green-500 to-emerald-600',
        bg: 'bg-slate-800/80',
        border: 'border-l-green-500',
        iconBg: 'bg-green-500/20 border border-green-500/30'
      },
      REFUND_REJECTED: {
        icon: '❌',
        gradient: 'from-red-500 to-rose-600',
        bg: 'bg-slate-800/80',
        border: 'border-l-red-500',
        iconBg: 'bg-red-500/20 border border-red-500/30'
      },
      PAYMENT_VERIFICATION_REQUIRED: {
        icon: '🔔',
        gradient: 'from-amber-500 to-orange-600',
        bg: 'bg-slate-800/80',
        border: 'border-l-amber-500',
        iconBg: 'bg-amber-500/20 border border-amber-500/30'
      },
    };
    return styles[type] || {
      icon: '🔔',
      gradient: 'from-gray-500 to-slate-600',
      bg: 'bg-slate-800/80',
      border: 'border-l-gray-400',
      iconBg: 'bg-gray-500/20 border border-gray-500/30'
    };
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.read;
    if (filter === 'read') return notif.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const tabs = [
    { key: 'all', label: 'All', count: notifications.length },
    { key: 'unread', label: 'Unread', count: unreadCount },
    { key: 'read', label: 'Read', count: notifications.length - unreadCount },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/60 hover:text-white mb-6 group transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            <span>Back</span>
          </button>
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 via-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-orange-500/30">
                <BellAlertIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Notifications</h1>
                <p className="text-white/60 mt-1 flex items-center gap-2">
                  {unreadCount > 0 ? (
                    <>
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                        {unreadCount}
                      </span>
                      <span>unread notification{unreadCount > 1 ? 's' : ''}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-5 h-5 text-green-400" />
                      <span className="text-green-400">All caught up!</span>
                    </>
                  )}
                </p>
              </div>
            </div>
            
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-sm text-white rounded-xl border border-white/20 hover:bg-white/20 transition-all"
              >
                <CheckBadgeIcon className="w-5 h-5" />
                Mark all read
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-6">
        {/* Filter Tabs */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-2 mb-8">
          <div className="flex gap-2">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex-1 px-6 py-3.5 text-sm font-semibold rounded-xl transition-all ${
                  filter === tab.key
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                {tab.label}
                <span className={`ml-2 px-2.5 py-1 rounded-full text-xs ${
                  filter === tab.key 
                    ? 'bg-white/20 text-white' 
                    : 'bg-slate-700/50 text-gray-400'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-16 text-center">
            <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-400 mt-6 font-medium">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-16 text-center">
            <div className="w-24 h-24 bg-slate-700/50 border border-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <BellIcon className="w-12 h-12 text-gray-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              {filter === 'all' ? 'No notifications yet' : `No ${filter} notifications`}
            </h3>
            <p className="text-gray-400 max-w-sm mx-auto">
              {filter === 'all' 
                ? "You'll see notifications here when there's activity on your account."
                : filter === 'unread'
                ? "Great job! You've read all your notifications."
                : "No read notifications to display."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notification, index) => {
              const style = getNotificationStyle(notification.type);
              const hasAction = getNotificationPath(notification) !== null;
              return (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`${style.bg} backdrop-blur-sm rounded-2xl border border-white/10 border-l-4 ${style.border} p-5 transition-all hover:bg-slate-700/80 hover:shadow-xl hover:shadow-purple-500/10 cursor-pointer ${
                    !notification.read ? 'ring-2 ring-purple-500/50 ring-offset-2 ring-offset-slate-900 shadow-lg shadow-purple-500/20' : ''
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-14 h-14 ${style.iconBg} rounded-2xl flex items-center justify-center text-2xl`}>
                      {style.icon}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="font-bold text-white text-lg">
                              {notification.title}
                            </h3>
                            {!notification.read && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm">
                                NEW
                              </span>
                            )}
                          </div>
                          <p className="mt-2 text-gray-300 leading-relaxed">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-4 mt-3">
                            <span className="text-sm text-gray-500 flex items-center gap-1">
                              🕐 {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </span>
                            {hasAction && (
                              <span className="text-sm text-purple-400 font-medium flex items-center gap-1">
                                Click to view <ChevronRightIcon className="w-4 h-4" />
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!notification.read && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="p-3 bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 rounded-xl transition-all border border-purple-500/30"
                              title="Mark as read"
                            >
                              <CheckIcon className="w-5 h-5" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="p-3 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-xl transition-all border border-red-500/30"
                            title="Delete notification"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Stats */}
        {notifications.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-400 bg-slate-800/50 backdrop-blur-sm border border-white/10 inline-block px-6 py-2 rounded-full">
              Showing {filteredNotifications.length} of {notifications.length} notifications
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
