import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCheck, ChevronRight, ArrowLeft, CheckCircle, Play } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { formatDistanceToNow, format } from 'date-fns';
import MatchifyLogo from '../components/MatchifyLogo';
import Spinner from '../components/Spinner';
import api from '../utils/api';

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

  const [liveMatchMap, setLiveMatchMap] = useState({});

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Fetch live match data once queue notifications are loaded
  useEffect(() => {
    if (!notifications?.length) return;
    const hasQueue = notifications.some(n => {
      try { const d = JSON.parse(n.data || '{}'); return n.type === 'MATCH_ASSIGNED' && d.isQueue; } catch { return false; }
    });
    if (!hasQueue) return;
    api.get('/matches/umpire-matches').then(res => {
      const map = {};
      for (const m of (res.data?.matches || [])) map[m.id] = m;
      setLiveMatchMap(map);
    }).catch(() => {});
  }, [notifications]);

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

  const getNotificationColor = (type, isUnread) => {
    if (isUnread) {
      return {
        bg: 'rgba(15,20,42,0.78)',
        border: 'rgba(245,158,11,0.45)',
        shadow: '0 2px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)',
        accentLeft: true,
      };
    }
    return {
      bg: 'rgba(10,14,30,0.68)',
      border: 'rgba(255,255,255,0.14)',
      shadow: '0 2px 14px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.06)',
      accentLeft: false,
    };
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
      {/* Galaxy background image */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: 'url(/bg-notifications.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
        opacity: 0.55,
        zIndex: 0,
      }} />
      {/* Dark overlay for readability */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'linear-gradient(180deg, rgba(5,8,16,0.55) 0%, rgba(5,8,16,0.72) 60%, rgba(5,8,16,0.88) 100%)',
        zIndex: 1,
      }} />
      {/* Ambient Blobs */}
      <div className="fixed top-0 bottom-0 pointer-events-none overflow-hidden" style={{ left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "480px", zIndex: 2 }}>
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
          background: 'rgba(5,8,16,0.82)',
          borderColor: 'rgba(255,255,255,0.1)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(24px)',
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

      <div className="relative max-w-md mx-auto px-4 py-6" style={{ zIndex: 10 }}>
        {/* Action Buttons */}
        {notifications.length > 0 && notifications.some(n => !n.read) && (
          <div
            className="flex items-center gap-2 mb-6"
            style={{ animation: 'fadeIn 0.2s ease-out both' }}
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
              const colorScheme = getNotificationColor(notification.type, !notification.read);

              // Detect queue notification — render expanded inline match cards
              let parsedData = {};
              try { parsedData = JSON.parse(notification.data || '{}'); } catch {}
              const isQueueNotif = notification.type === 'MATCH_ASSIGNED' && parsedData.isQueue === true;

              if (isQueueNotif) {
                const storedMatches = Array.isArray(parsedData.matches) ? parsedData.matches : [];
                const resolvedMatches = storedMatches.map(m => {
                  const live = liveMatchMap[m.id];
                  return {
                    ...m,
                    status: live?.status || m.status,
                    player1Name: live?.player1?.name || m.player1Name || 'TBD',
                    player2Name: live?.player2?.name || m.player2Name || 'TBD',
                  };
                });
                const completed = resolvedMatches.filter(m => m.status === 'COMPLETED').length;
                const total = resolvedMatches.length;

                return (
                  <div
                    key={notification.id}
                    className="rounded-2xl overflow-hidden"
                    style={{
                      background: colorScheme.bg,
                      border: `1px solid ${colorScheme.border}`,
                      boxShadow: colorScheme.shadow,
                      backdropFilter: 'blur(18px)',
                      WebkitBackdropFilter: 'blur(18px)',
                      animation: `slideUp 0.4s ease-out ${index * 0.05}s both`,
                      borderLeft: colorScheme.accentLeft ? '3px solid rgba(245,158,11,0.7)' : `1px solid ${colorScheme.border}`,
                    }}
                  >
                    {/* Queue card header */}
                    <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                      onClick={() => { if (!notification.read) markAsRead(notification.id); }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>⚖️</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{notification.title}</span>
                            {!notification.read && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#F59E0B', flexShrink: 0 }} />}
                          </div>
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                            {parsedData.tournamentName || ''} · {completed}/{total} done
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: '#F59E0B' }}>
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </span>
                        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>•</span>
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>
                          {format(new Date(notification.createdAt), 'MMM dd, h:mm a')}
                        </span>
                      </div>
                    </div>

                    {/* Inline match cards */}
                    <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {resolvedMatches.map((m, mi) => {
                        const isCompleted = m.status === 'COMPLETED';
                        const isLive = m.status === 'IN_PROGRESS' || m.status === 'LIVE';
                        const p1parts = (m.player1Name || 'TBD').split(' / ');
                        const p2parts = (m.player2Name || 'TBD').split(' / ');
                        return (
                          <div key={m.id || mi} style={{
                            background: isCompleted ? 'rgba(34,197,94,0.06)' : isLive ? 'rgba(245,158,11,0.07)' : 'rgba(255,255,255,0.04)',
                            border: isCompleted ? '1px solid rgba(34,197,94,0.22)' : isLive ? '1px solid rgba(245,158,11,0.28)' : '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 12, overflow: 'hidden',
                          }}>
                            {/* Match header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
                              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)', fontWeight: 600 }}>
                                Match {mi + 1} of {total} · Rnd {m.round} #{m.matchNumber}
                              </span>
                              {m.categoryName ? <span style={{ fontSize: 10, color: 'rgba(168,85,246,0.85)', fontWeight: 700 }}>{m.categoryName}</span> : null}
                            </div>
                            {/* Players */}
                            <div style={{ padding: '8px 10px' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 34px 1fr', alignItems: 'center', gap: 4, marginBottom: 7 }}>
                                <div>
                                  {p1parts.length === 2
                                    ? <><div style={{ fontSize: 12, fontWeight: 800, color: '#fff', lineHeight: 1.3 }}>{p1parts[0]}</div><div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.5)', lineHeight: 1.3 }}>& {p1parts[1]}</div></>
                                    : <span style={{ fontSize: 12, fontWeight: 700, color: m.player1Name ? '#fff' : 'rgba(255,255,255,0.3)' }}>{m.player1Name || 'TBD'}</span>
                                  }
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                  <span style={{ fontSize: 8, fontWeight: 800, color: 'rgba(245,158,11,0.65)', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 3, padding: '2px 4px', letterSpacing: '0.08em' }}>VS</span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                  {p2parts.length === 2
                                    ? <><div style={{ fontSize: 12, fontWeight: 800, color: '#fff', lineHeight: 1.3 }}>{p2parts[0]}</div><div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.5)', lineHeight: 1.3 }}>& {p2parts[1]}</div></>
                                    : <span style={{ fontSize: 12, fontWeight: 700, color: m.player2Name ? '#fff' : 'rgba(255,255,255,0.3)' }}>{m.player2Name || 'TBD'}</span>
                                  }
                                </div>
                              </div>
                              {/* CTA */}
                              {isCompleted ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px 0', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.22)', borderRadius: 8 }}>
                                  <CheckCircle style={{ width: 13, height: 13, color: '#4ade80' }} />
                                  <span style={{ fontSize: 11, fontWeight: 800, color: '#4ade80' }}>Match Completed</span>
                                </div>
                              ) : (
                                <button
                                  onClick={e => {
                                    e.stopPropagation();
                                    if (!notification.read) markAsRead(notification.id);
                                    navigate(`/match/${m.id}/score`);
                                  }}
                                  style={{ width: '100%', padding: '8px 0', borderRadius: 8, background: isLive ? 'rgba(245,158,11,0.18)' : 'rgba(99,102,241,0.15)', border: isLive ? '1.5px solid rgba(245,158,11,0.4)' : '1.5px solid rgba(99,102,241,0.35)', color: isLive ? '#FCD34D' : '#a5b4fc', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, cursor: 'pointer' }}
                                >
                                  <Play style={{ width: 11, height: 11 }} />
                                  {isLive ? 'Resume Match' : 'Configure & Start Match'}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {resolvedMatches.length === 0 && (
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', textAlign: 'center', padding: '8px 0' }}>Loading matches…</p>
                      )}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className="rounded-2xl p-4 relative overflow-hidden cursor-pointer transition-all duration-150"
                  style={{
                    background: colorScheme.bg,
                    border: `1px solid ${colorScheme.border}`,
                    boxShadow: colorScheme.shadow,
                    backdropFilter: 'blur(18px)',
                    WebkitBackdropFilter: 'blur(18px)',
                    animation: `slideUp 0.4s ease-out ${index * 0.05}s both`,
                    borderLeft: colorScheme.accentLeft ? '3px solid rgba(245,158,11,0.7)' : `1px solid ${colorScheme.border}`,
                  }}
                >

                  <div className="flex items-start gap-3 relative z-10">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.1)',
                        }}
                      >
                        {getNotificationIcon(notification.type)}
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
                            className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                            style={{ background: '#F59E0B', flexShrink: 0 }}
                          />
                        )}
                      </div>

                      {/* Smart preview for match notifications; plain text for others */}
                      {(() => {
                        const preview = getPreview(notification);
                        if (preview) {
                          let matchId = null, p1Name = null, p2Name = null, matchStatus = null;
                          try {
                            const d = notification.data ? JSON.parse(notification.data) : {};
                            matchId = d.matchId || null;
                            p1Name = d.player1Name || null;
                            p2Name = d.player2Name || null;
                            matchStatus = d.matchStatus || null;
                          } catch {}
                          const p1parts = (p1Name || 'TBD').split(' / ');
                          const p2parts = (p2Name || 'TBD').split(' / ');
                          const isMatchLive = matchStatus === 'IN_PROGRESS' || matchStatus === 'LIVE';
                          const isMatchDone = matchStatus === 'COMPLETED';
                          return (
                            <div className="mb-2">
                              {preview.matchInfo && (
                                <p className="text-xs font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                  {preview.matchInfo}
                                </p>
                              )}
                              {/* VS grid layout — same as queue cards */}
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 34px 1fr', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                                <div>
                                  {p1parts.length === 2
                                    ? <><div style={{ fontSize: 12, fontWeight: 800, color: '#fff', lineHeight: 1.3 }}>{p1parts[0]}</div><div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.5)', lineHeight: 1.3 }}>& {p1parts[1]}</div></>
                                    : <span style={{ fontSize: 12, fontWeight: 700, color: p1Name ? '#fff' : 'rgba(255,255,255,0.3)' }}>{p1Name || 'TBD'}</span>
                                  }
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                  <span style={{ fontSize: 8, fontWeight: 800, color: 'rgba(245,158,11,0.65)', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 3, padding: '2px 4px', letterSpacing: '0.08em' }}>VS</span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                  {p2parts.length === 2
                                    ? <><div style={{ fontSize: 12, fontWeight: 800, color: '#fff', lineHeight: 1.3 }}>{p2parts[0]}</div><div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.5)', lineHeight: 1.3 }}>& {p2parts[1]}</div></>
                                    : <span style={{ fontSize: 12, fontWeight: 700, color: p2Name ? '#fff' : 'rgba(255,255,255,0.3)' }}>{p2Name || 'TBD'}</span>
                                  }
                                </div>
                              </div>
                              {preview.tournament && (
                                <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
                                  {preview.tournament}
                                </p>
                              )}
                              {/* CTA — same style as queue cards */}
                              {matchId && (
                                isMatchDone ? (
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px 0', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.22)', borderRadius: 8 }}>
                                    <CheckCircle style={{ width: 13, height: 13, color: '#4ade80' }} />
                                    <span style={{ fontSize: 11, fontWeight: 800, color: '#4ade80' }}>Match Completed</span>
                                  </div>
                                ) : (
                                  <button
                                    onClick={e => {
                                      e.stopPropagation();
                                      if (!notification.read) markAsRead(notification.id);
                                      navigate(`/match/${matchId}/score`);
                                    }}
                                    style={{ width: '100%', padding: '8px 0', borderRadius: 8, background: isMatchLive ? 'rgba(245,158,11,0.18)' : 'rgba(99,102,241,0.15)', border: isMatchLive ? '1.5px solid rgba(245,158,11,0.4)' : '1.5px solid rgba(99,102,241,0.35)', color: isMatchLive ? '#FCD34D' : '#a5b4fc', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, cursor: 'pointer' }}
                                  >
                                    <Play style={{ width: 11, height: 11 }} />
                                    {isMatchLive ? 'Resume Match' : 'Configure & Start Match'}
                                  </button>
                                )
                              )}
                            </div>
                          );
                        }
                        // Strip URLs and truncate for clean list preview
                        const cleanPreview = (notification.message || '')
                          .replace(/https?:\/\/[^\s]+/g, '')
                          .replace(/\n{2,}/g, ' ')
                          .replace(/\n/g, ' ')
                          .trim();
                        const truncated = cleanPreview.length > 90
                          ? cleanPreview.slice(0, 90).trimEnd() + '…'
                          : cleanPreview;

                        // Extract WhatsApp URL if present
                        const waMatch = (notification.message || '').match(/https?:\/\/chat\.whatsapp\.com\/[^\s]+/);

                        return (
                          <div>
                            <p className="text-sm mb-3 leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
                              {truncated}
                            </p>
                            {waMatch && (
                              <a
                                href={waMatch[0]}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-black text-xs mb-2 transition-all active:scale-[0.98]"
                                style={{
                                  background: 'linear-gradient(135deg, #25D366, #128C7E)',
                                  color: '#fff',
                                  boxShadow: '0 3px 12px rgba(37,211,102,0.35)',
                                  textDecoration: 'none',
                                }}
                              >
                                💬 Join WhatsApp Community
                              </a>
                            )}
                          </div>
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

