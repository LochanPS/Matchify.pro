import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCheck, ChevronRight, ArrowLeft } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { formatDistanceToNow, format } from 'date-fns';
import MatchifyLogo from '../components/MatchifyLogo';

// Pre-generated particle data — deterministic, no Math.random in render
const NOTIF_PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  w: (i * 7 + 1) % 3 + 1,
  h: (i * 11 + 1) % 3 + 1,
  x: (i * 37 + 11) % 97,
  y: (i * 53 + 7) % 91,
  c: ["#00ff88", "#00d4ff", "#a855f7"][i % 3],
  o: ((i * 13) % 50) / 100 + 0.2,
  dur: (i * 7) % 6 + 4,
  delay: (i * 3) % 4,
  glow: (i * 11) % 15 + 5,
}));


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
      REGISTRATION_CONFIRMED: { bg: 'linear-gradient(135deg, rgba(0,255,136,0.15), rgba(0,255,136,0.1))', border: 'rgba(0,255,136,0.35)', shadow: 'rgba(0,255,136,0.2)' },
      REGISTRATION_REJECTED: { bg: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(220,38,38,0.15))', border: 'rgba(239,68,68,0.4)', shadow: 'rgba(239,68,68,0.3)' },
      REGISTRATION_PENDING: { bg: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(251,146,60,0.15))', border: 'rgba(245,158,11,0.4)', shadow: 'rgba(245,158,11,0.3)' },
      PAYMENT_VERIFICATION_REQUIRED: { bg: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(37,99,235,0.15))', border: 'rgba(59,130,246,0.4)', shadow: 'rgba(59,130,246,0.3)' },
      PARTNER_INVITATION: { bg: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(139,92,246,0.15))', border: 'rgba(168,85,247,0.4)', shadow: 'rgba(168,85,247,0.3)' },
      PARTNER_ACCEPTED: { bg: 'linear-gradient(135deg, rgba(0,255,136,0.15), rgba(0,255,136,0.1))', border: 'rgba(0,255,136,0.35)', shadow: 'rgba(0,255,136,0.2)' },
      DRAW_PUBLISHED: { bg: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(14,165,233,0.15))', border: 'rgba(6,182,212,0.4)', shadow: 'rgba(6,182,212,0.3)' },
      MATCH_ASSIGNED: { bg: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(37,99,235,0.15))', border: 'rgba(59,130,246,0.4)', shadow: 'rgba(59,130,246,0.3)' },
      POINTS_AWARDED: { bg: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(251,146,60,0.15))', border: 'rgba(245,158,11,0.4)', shadow: 'rgba(245,158,11,0.3)' },
      TOURNAMENT_REMINDER: { bg: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(139,92,246,0.15))', border: 'rgba(168,85,247,0.4)', shadow: 'rgba(168,85,247,0.3)' },
    };
    return colors[type] || { bg: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(79,70,229,0.15))', border: 'rgba(99,102,241,0.4)', shadow: 'rgba(99,102,241,0.3)' };
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
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#07071a' }}>
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Large Gradient Orbs */}
        <div 
          className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-30 animate-pulse"
          style={{ 
            background: 'radial-gradient(circle, rgba(0,255,136,0.4) 0%, rgba(0,255,136,0.2) 40%, transparent 70%)',
            animation: 'float 8s ease-in-out infinite'
          }}
        />
        <div 
          className="absolute top-1/4 left-0 w-80 h-80 rounded-full blur-3xl opacity-25 animate-pulse"
          style={{ 
            background: 'radial-gradient(circle, rgba(168,85,247,0.4) 0%, rgba(139,92,246,0.2) 40%, transparent 70%)',
            animation: 'float 10s ease-in-out infinite reverse',
            animationDelay: '2s'
          }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full blur-3xl opacity-20 animate-pulse"
          style={{ 
            background: 'radial-gradient(circle, rgba(6,182,212,0.4) 0%, rgba(14,165,233,0.2) 40%, transparent 70%)',
            animation: 'float 12s ease-in-out infinite',
            animationDelay: '4s'
          }}
        />
        
        {/* Floating Particles */}
        {NOTIF_PARTICLES.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${p.w}px`,
              height: `${p.h}px`,
              left: `${p.x}%`,
              top: `${p.y}%`,
              background: p.c,
              opacity: p.o,
              animation: `float ${p.dur}s ease-in-out infinite`,
              animationDelay: `${p.delay}s`,
              boxShadow: `0 0 ${p.glow}px ${p.c}`,
            }}
          />
        ))}
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
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 transition-all relative overflow-hidden group"
          >
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            />
            <ArrowLeft className="w-5 h-5 relative z-10" style={{ color: '#00ff88' }} />
            <div className="relative">
              <div 
                className="absolute inset-0 blur-lg opacity-60"
                style={{ 
                  background: 'radial-gradient(circle, rgba(0,255,136,0.6) 0%, transparent 70%)',
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
              background: 'linear-gradient(135deg, #ffffff, #00ff88)',
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
                background: 'linear-gradient(135deg, #00ff88, #00d4ff)',
                color: '#07071a',
                boxShadow: '0 2px 8px rgba(0,255,136,0.4)'
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
                background: 'linear-gradient(135deg, rgba(0,255,136,0.2), rgba(0,255,136,0.15))',
                border: '2px solid rgba(0,255,136,0.4)',
                color: '#00ff88',
                boxShadow: '0 4px 15px rgba(0,255,136,0.2)'
              }}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style={{ background: 'rgba(0,255,136,0.1)' }}
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
              background: 'linear-gradient(135deg, rgba(0,255,136,0.15) 0%, rgba(99,102,241,0.15) 100%)',
              border: '2px solid rgba(0,255,136,0.3)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(0,255,136,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
              animation: 'scaleIn 0.8s ease-out'
            }}
          >
            <div 
              className="w-12 h-12 border-4 rounded-full animate-spin mx-auto"
              style={{ 
                borderColor: 'rgba(0,255,136,0.3)',
                borderTopColor: '#00ff88'
              }}
            ></div>
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
                        background: 'radial-gradient(circle, rgba(0,255,136,0.8), transparent)',
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
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-base font-bold text-white leading-tight">
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <div 
                            className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
                            style={{ 
                              background: '#00ff88',
                              boxShadow: '0 0 10px rgba(0,255,136,0.8)'
                            }}
                          ></div>
                        )}
                      </div>
                      
                      <p className="text-sm mb-3 leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs">
                          <span 
                            className="font-semibold"
                            style={{ color: '#00ff88' }}
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
