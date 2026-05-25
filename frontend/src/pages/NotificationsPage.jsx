import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCheck, ChevronRight, ArrowLeft } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { formatDistanceToNow, format } from 'date-fns';
import MatchifyLogo from '../components/MatchifyLogo';
import Spinner from '../components/Spinner';

// Pre-generated particle data — deterministic, no Math.random in render


const NotificationsPage = () => {
  const navigate = useNavigate();
  const {
    notifications,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
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
      MATCH_COMPLETED: '🏁',
      MATCH_WON: '🏆',
      MATCH_LOST: '📋',
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

  const getNotificationColor = (type) => {
    const colors = {
      REGISTRATION_CONFIRMED: { bg: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.1))', border: 'rgba(245,158,11,0.35)', shadow: 'rgba(245,158,11,0.2)' },
      REGISTRATION_REJECTED: { bg: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(220,38,38,0.15))', border: 'rgba(239,68,68,0.4)', shadow: 'rgba(239,68,68,0.3)' },
      REGISTRATION_PENDING: { bg: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(251,146,60,0.15))', border: 'rgba(245,158,11,0.4)', shadow: 'rgba(245,158,11,0.3)' },
      PAYMENT_VERIFICATION_REQUIRED: { bg: 'linear-gradient(135deg, rgba(245,158,11,0.18), rgba(217,119,6,0.12))', border: 'rgba(245,158,11,0.4)', shadow: 'rgba(245,158,11,0.25)' },
      PARTNER_INVITATION: { bg: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(139,92,246,0.15))', border: 'rgba(168,85,247,0.4)', shadow: 'rgba(168,85,247,0.3)' },
      PARTNER_ACCEPTED: { bg: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.1))', border: 'rgba(245,158,11,0.35)', shadow: 'rgba(245,158,11,0.2)' },
      DRAW_PUBLISHED: { bg: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(14,165,233,0.15))', border: 'rgba(245,158,11,0.4)', shadow: 'rgba(245,158,11,0.3)' },
      MATCH_ASSIGNED: { bg: 'linear-gradient(135deg, rgba(16,185,129,0.18), rgba(5,150,105,0.12))', border: 'rgba(16,185,129,0.4)', shadow: 'rgba(16,185,129,0.25)' },
      MATCH_STARTING_SOON: { bg: 'linear-gradient(135deg, rgba(16,185,129,0.18), rgba(5,150,105,0.12))', border: 'rgba(16,185,129,0.4)', shadow: 'rgba(16,185,129,0.25)' },
      MATCH_COMPLETED: { bg: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.1))', border: 'rgba(245,158,11,0.35)', shadow: 'rgba(245,158,11,0.2)' },
      MATCH_WON: { bg: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(251,146,60,0.15))', border: 'rgba(245,158,11,0.4)', shadow: 'rgba(245,158,11,0.3)' },
      MATCH_LOST: { bg: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(79,70,229,0.1))', border: 'rgba(99,102,241,0.35)', shadow: 'rgba(99,102,241,0.2)' },
      POINTS_AWARDED: { bg: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(251,146,60,0.15))', border: 'rgba(245,158,11,0.4)', shadow: 'rgba(245,158,11,0.3)' },
      TOURNAMENT_REMINDER: { bg: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(139,92,246,0.15))', border: 'rgba(168,85,247,0.4)', shadow: 'rgba(168,85,247,0.3)' },
    };
    return colors[type] || { bg: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))', border: 'rgba(255,255,255,0.1)', shadow: 'rgba(0,0,0,0.2)' };
  };

  // Smart preview: for MATCH_ASSIGNED/STARTING_SOON parse data for player names;
  // for others truncate message cleanly
  const getPreview = (notification) => {
    if (['MATCH_ASSIGNED', 'MATCH_STARTING_SOON'].includes(notification.type)) {
      try {
        const d = notification.data ? JSON.parse(notification.data) : {};
        const players = (d.player1Name && d.player2Name && d.player1Name !== 'TBD' && d.player2Name !== 'TBD')
          ? `${d.player1Name} vs ${d.player2Name}`
          : (d.player1Name || d.player2Name)
            ? `${d.player1Name || d.player2Name} vs TBD`
            : null;
        const matchInfo = d.matchDetails || d.roundName || null;
        if (players) {
          return { players, matchInfo, tournament: d.tournamentName || null };
        }
      } catch {}
    }
    return null;
  };

  const handleNotificationClick = (notification) => {
    // Mark as read
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Navigate to notification detail page
    navigate(`/notifications/${notification.id}`);
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#050810' }}>
      {/* Ambient Blobs */}
      <div className="fixed top-0 bottom-0 pointer-events-none overflow-hidden" style={{ left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "480px" }}>
        <div style={{ position: 'absolute', width: '440px', height: '440px', top: '-140px', right: '-120px', background: 'radial-gradient(circle, rgba(245,158,11,0.09) 0%, transparent 70%)', filter: 'blur(80px)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', width: '400px', height: '400px', bottom: '5%', left: '-120px', background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)', filter: 'blur(80px)', borderRadius: '50%' }} />
      </div>

      {/* Add keyframes for animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -20px) scale(1.05); }
          50% { transform: translate(-15px, 15px) scale(0.95); }
          75% { transform: translate(15px, 10px) scale(1.02); }
        }
        @keyframes glow {
          0%, 100% { opacity: 0.5; filter: brightness(1); }
          50% { opacity: 1; filter: brightness(1.3); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          0% { opacity: 0; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes slideUp {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          0% { transform: translateY(-100%); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      {/* Sticky Header */}
      <div 
        className="sticky top-0 z-50 backdrop-blur-md border-b relative"
        style={{
          background: 'rgba(7,7,26,0.95)',
          borderColor: 'rgba(255,255,255,0.08)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          animation: 'slideDown 0.5s ease-out'
        }}
      >
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          {/* Back Button & Logo */}
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 transition-all relative overflow-hidden group"
          >
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            />
            <ArrowLeft className="w-5 h-5 relative z-10" style={{ color: '#F59E0B' }} />
            <div className="relative">
              <div 
                className="absolute inset-0 blur-lg opacity-60"
                style={{ 
                  background: 'radial-gradient(circle, rgba(245,158,11,0.6) 0%, transparent 70%)',
                  animation: 'glow 3s ease-in-out infinite'
                }}
              />
              <MatchifyLogo size={24} variant="icon" />
            </div>
          </button>

          {/* Title */}
          <h1 
            className="text-lg font-bold"
            style={{ 
              background: 'linear-gradient(135deg, #ffffff, #F59E0B)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            Notifications
          </h1>

          {/* Unread Count Badge */}
          {notifications.filter(n => !n.read).length > 0 && (
            <div 
              className="px-3 py-1 rounded-full text-xs font-bold"
              style={{ 
                background: 'linear-gradient(135deg, #F59E0B, #FCD34D)',
                color: '#050810',
                boxShadow: '0 2px 8px rgba(245,158,11,0.4)'
              }}
            >
              {notifications.filter(n => !n.read).length}
            </div>
          )}
        </div>
      </div>

      <div className="relative max-w-md mx-auto px-4 py-6">
        {/* Action Buttons */}
        {notifications.length > 0 && notifications.some(n => !n.read) && (
          <div
            className="flex items-center gap-2 mb-6"
            style={{ animation: 'fadeIn 0.8s ease-out 0.2s both' }}
          >
            <button
              onClick={markAllAsRead}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all relative overflow-hidden group"
              style={{
                background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.15))',
                border: '2px solid rgba(245,158,11,0.4)',
                color: '#F59E0B',
                boxShadow: '0 4px 15px rgba(245,158,11,0.2)'
              }}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style={{ background: 'rgba(245,158,11,0.1)' }}
              />
              <CheckCheck className="w-4 h-4 relative z-10" />
              <span className="relative z-10">Mark All Read</span>
            </button>
          </div>
        )}

        {/* Notifications List */}
        {loading ? (
          <div 
            className="rounded-2xl p-12 text-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(99,102,241,0.15) 100%)',
              border: '2px solid rgba(245,158,11,0.3)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(245,158,11,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
              animation: 'scaleIn 0.8s ease-out'
            }}
          >
            <Spinner size="lg" className="mx-auto" />
            <p className="mt-4 font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div 
            className="rounded-2xl p-12 text-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.15) 100%)',
              border: '2px solid rgba(99,102,241,0.3)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(99,102,241,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
              animation: 'scaleIn 0.8s ease-out'
            }}
          >
            {/* Animated Glow */}
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-3xl opacity-20"
              style={{ 
                background: 'radial-gradient(circle, rgba(139,92,246,0.8), transparent)',
                animation: 'glow 5s ease-in-out infinite'
              }}
            />
            
            <div className="relative z-10">
              <div 
                className="text-6xl mb-4 inline-block"
                style={{ 
                  filter: 'drop-shadow(0 0 20px rgba(168,85,247,0.6))',
                  animation: 'float 3s ease-in-out infinite'
                }}
              >
                🔔
              </div>
              <h3 className="text-xl font-black text-white mb-2">No notifications yet</h3>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>You'll see notifications here when you have updates</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification, index) => {
              const colorScheme = getNotificationColor(notification.type);
              
              return (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className="rounded-2xl p-4 relative overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                  style={{
                    background: colorScheme.bg,
                    border: `2px solid ${colorScheme.border}`,
                    boxShadow: `0 4px 15px ${colorScheme.shadow}, inset 0 1px 0 rgba(255,255,255,0.1)`,
                    animation: `slideUp 0.5s ease-out ${index * 0.1}s both`
                  }}
                >
                  {/* Shimmer Effect */}
                  <div 
                    className="absolute inset-0 opacity-20"
                    style={{
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 4s infinite',
                      animationDelay: `${index * 0.5}s`
                    }}
                  />

                  {/* Unread Indicator Glow */}
                  {!notification.read && (
                    <div 
                      className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-40"
                      style={{ 
                        background: 'radial-gradient(circle, rgba(245,158,11,0.8), transparent)',
                        animation: 'glow 3s ease-in-out infinite'
                      }}
                    />
                  )}

                  <div className="flex items-start gap-3 relative z-10">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl relative"
                        style={{ 
                          background: `${colorScheme.bg}`,
                          border: `2px solid ${colorScheme.border}`,
                          boxShadow: `0 4px 12px ${colorScheme.shadow}`,
                          filter: 'brightness(1.2)'
                        }}
                      >
                        <span style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
                          {getNotificationIcon(notification.type)}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h3 className="text-base font-bold text-white leading-tight">
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
                            style={{
                              background: '#F59E0B',
                              boxShadow: '0 0 10px rgba(245,158,11,0.8)'
                            }}
                          />
                        )}
                      </div>

                      {/* Smart preview for match notifications; plain text for others */}
                      {(() => {
                        const preview = getPreview(notification);
                        if (preview) {
                          let matchId = null;
                          try { matchId = notification.data ? JSON.parse(notification.data).matchId : null; } catch {}
                          return (
                            <div className="mb-2 space-y-1">
                              {preview.matchInfo && (
                                <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                  {preview.matchInfo}
                                </p>
                              )}
                              <p className="text-sm font-black text-white leading-snug">
                                {preview.players}
                              </p>
                              {preview.tournament && (
                                <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
                                  {preview.tournament}
                                </p>
                              )}
                              {/* Configure & Start Match CTA */}
                              {matchId && (
                                <button
                                  onClick={e => {
                                    e.stopPropagation();
                                    if (!notification.read) markAsRead(notification.id);
                                    navigate(`/match/${matchId}/score`);
                                  }}
                                  className="w-full py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all active:scale-[0.97] mt-1"
                                  style={{
                                    background: 'linear-gradient(135deg, #F59E0B 0%, #0099bb 100%)',
                                    color: '#000',
                                    boxShadow: '0 4px 14px rgba(245,158,11,0.4)',
                                  }}>
                                  ▶ Configure &amp; Start Match
                                </button>
                              )}
                            </div>
                          );
                        }
                        return (
                          <p className="text-sm mb-3 leading-relaxed whitespace-pre-line" style={{ color: 'rgba(255,255,255,0.65)' }}>
                            {notification.message}
                          </p>
                        );
                      })()}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs">
                          <span 
                            className="font-semibold"
                            style={{ color: '#F59E0B' }}
                          >
                            {formatDistanceToNow(new Date(notification.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                          <span style={{ color: 'rgba(255,255,255,0.25)' }}>•</span>
                          <span style={{ color: 'rgba(255,255,255,0.4)' }}>
                            {format(new Date(notification.createdAt), 'MMM dd, h:mm a')}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <ChevronRight className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.4)' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default NotificationsPage;

