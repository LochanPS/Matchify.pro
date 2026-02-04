import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, ExternalLink, Calendar, Clock } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { format } from 'date-fns';

const NotificationDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { notifications, markAsRead, deleteNotification } = useNotifications();
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const found = notifications.find(n => n.id === id);
    if (found) {
      console.log('📧 Notification found:', found);
      console.log('📦 Notification data:', found.data);
      console.log('📦 Parsed data:', found.data ? JSON.parse(found.data) : {});
      setNotification(found);
      // Mark as read when viewing
      if (!found.read) {
        markAsRead(id);
      }
    }
  }, [id, notifications]);

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

  const getNotificationPath = (notification) => {
    const data = notification.data ? JSON.parse(notification.data) : {};
    const type = notification.type;

    switch (type) {
      case 'CANCELLATION_REQUEST':
        if (data.registrationId) {
          return `/organizer/cancellation/${data.registrationId}`;
        }
        if (data.tournamentId) {
          return `/organizer/tournaments/${data.tournamentId}?tab=refunds`;
        }
        return '/organizer/dashboard';

      case 'PAYMENT_VERIFICATION_REQUIRED':
      case 'REGISTRATION_PENDING':
        if (data.tournamentId) {
          return `/organizer/tournaments/${data.tournamentId}`;
        }
        return '/organizer/dashboard';
      
      case 'REGISTRATION_CONFIRMED':
      case 'REGISTRATION_REJECTED':
      case 'REGISTRATION_REMOVED':
      case 'REFUND_APPROVED':
      case 'REFUND_REJECTED':
        return '/registrations';
      
      case 'PARTNER_INVITATION':
        // Navigate to tournament page (not registration)
        if (data.tournamentId) {
          return `/tournaments/${data.tournamentId}`;
        }
        return '/tournaments';
      
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
          return `/umpire/scoring/${data.matchId}`;
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
        return '/leaderboard';
      
      default:
        return null;
    }
  };

  const getActionButtonText = (type) => {
    switch (type) {
      case 'PARTNER_INVITATION':
        return 'View Tournament';
      case 'REGISTRATION_CONFIRMED':
      case 'REGISTRATION_REJECTED':
      case 'REGISTRATION_REMOVED':
        return 'View My Registrations';
      case 'DRAW_PUBLISHED':
        return 'View Tournament Draws';
      case 'MATCH_ASSIGNED':
      case 'MATCH_STARTING_SOON':
        return 'Go to Match Scoring';
      case 'TOURNAMENT_CANCELLED':
      case 'TOURNAMENT_REMINDER':
        return 'View Tournament Details';
      case 'PAYMENT_VERIFICATION_REQUIRED':
      case 'REGISTRATION_PENDING':
        return 'View Tournament Dashboard';
      case 'CANCELLATION_REQUEST':
        return 'Review Cancellation Request';
      case 'REFUND_PROCESSED':
        return 'View My Wallet';
      case 'POINTS_AWARDED':
        return 'View Leaderboard';
      default:
        return 'Take Action';
    }
  };

  const handleDelete = () => {
    deleteNotification(id);
    navigate('/notifications');
  };

  const handleTakeAction = () => {
    const path = getNotificationPath(notification);
    if (path) {
      navigate(path);
    }
  };

  if (!notification) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading notification...</p>
        </div>
      </div>
    );
  }

  const actionPath = getNotificationPath(notification);
  const data = notification.data ? JSON.parse(notification.data) : {};
  
  console.log('🎯 Action path:', actionPath);
  console.log('📊 Display data:', data);
  console.log('📊 Data keys:', Object.keys(data));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/notifications')}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Notifications</span>
          </button>
        </div>

        {/* Notification Card */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="p-8 border-b border-white/10">
            <div className="flex items-start gap-6">
              {/* Icon */}
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-4xl shadow-lg shadow-purple-500/30">
                  {getNotificationIcon(notification.type)}
                </div>
              </div>

              {/* Title and Meta */}
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-white mb-3">
                  {notification.title}
                </h1>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{format(new Date(notification.createdAt), 'MMMM dd, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{format(new Date(notification.createdAt), 'h:mm a')}</span>
                  </div>
                  {!notification.read && (
                    <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-semibold">
                      New
                    </span>
                  )}
                </div>
              </div>

              {/* Delete Button */}
              <button
                onClick={handleDelete}
                className="p-3 hover:bg-red-500/20 rounded-xl transition-colors"
                title="Delete notification"
              >
                <Trash2 className="w-5 h-5 text-gray-500 hover:text-red-400" />
              </button>
            </div>
          </div>

          {/* Message */}
          <div className="p-8">
            <div className="prose prose-invert max-w-none">
              <p className="text-lg text-gray-300 leading-relaxed whitespace-pre-wrap mb-0">
                {notification.message}
              </p>
            </div>

            {/* Additional Data - Enhanced Display */}
            {Object.keys(data).length > 0 && notification.type !== 'PARTNER_INVITATION' && (
              <div className="mt-8 space-y-4">
                {/* Tournament Details Card */}
                {(data.tournamentName || data.categoryName || data.tournamentDate) && (
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-purple-500/10 blur-xl rounded-2xl"></div>
                    <div className="relative bg-slate-700/40 border border-white/10 rounded-2xl p-6">
                      <h3 className="text-sm font-semibold text-purple-400 mb-4 flex items-center gap-2">
                        <span className="text-lg">🏸</span>
                        Tournament Details
                      </h3>
                      <div className="space-y-3">
                        {data.tournamentName && (
                          <div className="flex items-start gap-3">
                            <span className="text-gray-400 text-sm min-w-[100px]">Tournament:</span>
                            <span className="text-white font-semibold text-base flex-1">{data.tournamentName}</span>
                          </div>
                        )}
                        {data.categoryName && (
                          <div className="flex items-start gap-3">
                            <span className="text-gray-400 text-sm min-w-[100px]">Category:</span>
                            <span className="text-purple-300 font-semibold text-base flex-1">{data.categoryName}</span>
                          </div>
                        )}
                        {data.tournamentDate && (
                          <div className="flex items-start gap-3">
                            <span className="text-gray-400 text-sm min-w-[100px]">Date:</span>
                            <span className="text-blue-300 font-medium text-base flex-1">{data.tournamentDate}</span>
                          </div>
                        )}
                        {data.playerName && (
                          <div className="flex items-start gap-3">
                            <span className="text-gray-400 text-sm min-w-[100px]">Partner:</span>
                            <span className="text-green-300 font-semibold text-base flex-1">{data.playerName}</span>
                          </div>
                        )}
                        {data.partnerName && (
                          <div className="flex items-start gap-3">
                            <span className="text-gray-400 text-sm min-w-[100px]">Partner:</span>
                            <span className="text-green-300 font-semibold text-base flex-1">{data.partnerName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Points & Placement Card */}
                {(data.points || data.placement) && (
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-amber-500/10 to-yellow-500/10 blur-xl rounded-2xl"></div>
                    <div className="relative bg-slate-700/40 border border-yellow-500/20 rounded-2xl p-6">
                      <h3 className="text-sm font-semibold text-yellow-400 mb-4 flex items-center gap-2">
                        <span className="text-lg">🏆</span>
                        Achievement
                      </h3>
                      <div className="space-y-3">
                        {data.placement && (
                          <div className="flex items-start gap-3">
                            <span className="text-gray-400 text-sm min-w-[100px]">Placement:</span>
                            <span className="text-white font-bold text-xl flex-1">{data.placement}</span>
                          </div>
                        )}
                        {data.points && (
                          <div className="flex items-start gap-3">
                            <span className="text-gray-400 text-sm min-w-[100px]">Points Earned:</span>
                            <span className="text-yellow-400 font-bold text-2xl flex-1">+{data.points} pts</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Reason Card (for rejections/cancellations) */}
                {data.reason && (
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-orange-500/10 to-red-500/10 blur-xl rounded-2xl"></div>
                    <div className="relative bg-slate-700/40 border border-red-500/20 rounded-2xl p-6">
                      <h3 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
                        <span className="text-lg">ℹ️</span>
                        Reason
                      </h3>
                      <p className="text-gray-300 text-base leading-relaxed">{data.reason}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Button */}
            {actionPath && (
              <div className="mt-8">
                <button
                  onClick={handleTakeAction}
                  className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center justify-center gap-2 group"
                >
                  <span>{getActionButtonText(notification.type)}</span>
                  <ExternalLink className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationDetailPage;
