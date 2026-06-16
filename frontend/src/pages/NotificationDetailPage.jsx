import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Calendar, Clock, Upload, CheckCircle, Loader, Play, Trophy } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { format } from 'date-fns';
import api from '../utils/api';
import { fetchUpload } from '../utils/fetchUpload';
import { toast } from 'react-hot-toast';
import Spinner from '../components/Spinner';

const DETAIL_PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  x: (i * 37 + 11) % 97,
  y: (i * 53 + 7) % 93,
  r: ((i * 7) % 3) + 1,
  o: ((i * 13) % 45) / 100 + 0.40,
  dur: (i * 7) % 7 + 4,
  delay: (i * 3) % 5,
  c: ['#F59E0B','#FCD34D','#a855f7','rgba(255,255,255,0.6)'][i % 4],
}));

// ── Refund form ───────────────────────────────────────────────────────────────
const RefundDetailsForm = ({ registrationId, refundAmount, tournamentName, rejectionReason, onSuccess }) => {
  const [formData, setFormData] = useState({ upiId: '', accountName: '', qrCode: null });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const qrCodeInputRef = useRef(null);

  const handleQrCodeChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setErrors(p => ({ ...p, qrCode: 'Please upload an image file' })); return; }
    if (file.size > 5 * 1024 * 1024) { setErrors(p => ({ ...p, qrCode: 'File size must be less than 5MB' })); return; }
    setFormData(p => ({ ...p, qrCode: file }));
    setErrors(p => ({ ...p, qrCode: null }));
  };

  const validate = () => {
    const e = {};
    if (!formData.upiId || formData.upiId.trim().length < 5) e.upiId = 'Please provide a valid UPI ID';
    if (!formData.accountName || formData.accountName.trim().length < 2) e.accountName = 'Please provide your account name';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    try {
      setSubmitting(true);
      const fd = new FormData();
      fd.append('upiId', formData.upiId.trim());
      fd.append('accountName', formData.accountName.trim());
      if (formData.qrCode) fd.append('refundQrCode', formData.qrCode);
      await fetchUpload(`/registrations/${registrationId}/submit-refund-details`, fd);
      toast.success('Refund details submitted successfully!');
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit refund details');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl p-5" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}>
          <Upload className="w-5 h-5" style={{ color: '#F59E0B' }} />
        </div>
        <div>
          <h3 className="text-base font-black text-white">Submit Refund Details</h3>
          <p className="text-xs font-medium" style={{ color: '#F59E0B' }}>Refund Amount: ₹{refundAmount}</p>
        </div>
      </div>
      {rejectionReason && (
        <div className="rounded-xl p-3 mb-4" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <p className="text-xs" style={{ color: '#f87171' }}><strong>Rejection Reason:</strong> {rejectionReason}</p>
        </div>
      )}
      <div className="rounded-xl p-3 mb-4" style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)' }}>
        <p className="text-xs" style={{ color: '#fbbf24' }}><strong>Note:</strong> Provide your UPI ID below. Admin will process refund to it.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold mb-1.5" style={{ color: 'rgba(255,255,255,0.7)' }}>Your UPI ID <span className="text-red-400">*</span></label>
          <input type="text" value={formData.upiId} onChange={e => setFormData(p => ({ ...p, upiId: e.target.value }))}
            placeholder="yourname@upi or 9876543210@paytm"
            className="w-full px-4 py-3 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', border: errors.upiId ? '1px solid rgba(239,68,68,0.6)' : '1px solid rgba(255,255,255,0.12)' }} />
          {errors.upiId && <p className="text-red-400 text-xs mt-1">{errors.upiId}</p>}
        </div>
        <div>
          <label className="block text-xs font-bold mb-1.5" style={{ color: 'rgba(255,255,255,0.7)' }}>Account Holder Name <span className="text-red-400">*</span></label>
          <input type="text" value={formData.accountName} onChange={e => setFormData(p => ({ ...p, accountName: e.target.value }))}
            placeholder="Your full name as per bank"
            className="w-full px-4 py-3 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', border: errors.accountName ? '1px solid rgba(239,68,68,0.6)' : '1px solid rgba(255,255,255,0.12)' }} />
          {errors.accountName && <p className="text-red-400 text-xs mt-1">{errors.accountName}</p>}
        </div>
        <div>
          <label className="block text-xs font-bold mb-1.5" style={{ color: 'rgba(255,255,255,0.7)' }}>Payment QR Code <span style={{ color: 'rgba(255,255,255,0.4)' }}>(Optional)</span></label>
          <input type="file" ref={qrCodeInputRef} onChange={handleQrCodeChange} accept="image/*" className="hidden" />
          <button type="button" onClick={() => qrCodeInputRef.current?.click()}
            className="w-full px-4 py-4 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-all"
            style={{ borderColor: formData.qrCode ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.15)', background: formData.qrCode ? 'rgba(245,158,11,0.06)' : 'transparent' }}>
            {formData.qrCode
              ? <><CheckCircle className="h-7 w-7" style={{ color: '#F59E0B' }} /><span className="text-sm font-semibold" style={{ color: '#F59E0B' }}>{formData.qrCode.name}</span><span className="text-xs" style={{ color: 'rgba(245,158,11,0.6)' }}>Tap to change</span></>
              : <><Upload className="h-7 w-7" style={{ color: 'rgba(255,255,255,0.3)' }} /><span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Upload QR Code</span><span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>PNG, JPG up to 5MB</span></>}
          </button>
        </div>
        <button type="submit" disabled={submitting}
          className="w-full py-3.5 rounded-xl font-black text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg,#F59E0B,#FCD34D)', color: '#050810', boxShadow: '0 4px 15px rgba(245,158,11,0.35)' }}>
          {submitting ? <><Spinner size="sm" /><span>Submitting...</span></> : <><CheckCircle className="h-4 w-4" /><span>Submit Refund Details</span></>}
        </button>
      </form>
    </div>
  );
};

// ── Match card used in queue notification ─────────────────────────────────────
const MatchCard = ({ match, index, total, liveStatus, onStart }) => {
  const status = liveStatus || match.status;
  const isCompleted = status === 'COMPLETED';
  const isLive = status === 'IN_PROGRESS' || status === 'LIVE';

  const roundLabel = match.round != null ? `Round ${match.round}` : '';
  const matchLabel = match.matchNumber != null ? `Match #${match.matchNumber}` : '';
  const headerLabel = [roundLabel, matchLabel].filter(Boolean).join(' · ');

  return (
    <div style={{ marginBottom: index < total - 1 ? 10 : 0 }}>
      {/* Queue position label */}
      <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(245,158,11,0.65)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 5, paddingLeft: 2 }}>
        Match {index + 1} of {total}
      </p>

      <div style={{
        background: isCompleted ? 'rgba(34,197,94,0.06)' : isLive ? 'rgba(245,158,11,0.07)' : 'rgba(255,255,255,0.04)',
        border: isCompleted ? '1px solid rgba(34,197,94,0.25)' : isLive ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(255,255,255,0.09)',
        borderRadius: 14,
        overflow: 'hidden',
      }}>
        {/* Card header: round + category */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '7px 12px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(255,255,255,0.03)',
        }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{headerLabel || 'Match'}</span>
          {match.categoryName ? (
            <span style={{ fontSize: 11, color: 'rgba(168,85,247,0.85)', fontWeight: 700 }}>{match.categoryName}</span>
          ) : null}
        </div>

        {/* Players vs players */}
        <div style={{ padding: '10px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#fff' }}>{match.player1Name}</span>
            <span style={{
              fontSize: 9, fontWeight: 800, color: 'rgba(245,158,11,0.65)',
              background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: 4, padding: '2px 6px', letterSpacing: '0.1em', flexShrink: 0,
            }}>VS</span>
            <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#fff', textAlign: 'right' }}>{match.player2Name}</span>
          </div>

          {/* CTA area */}
          {isCompleted ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '9px 0',
              background: 'rgba(34,197,94,0.1)',
              border: '1px solid rgba(34,197,94,0.25)',
              borderRadius: 10,
            }}>
              <CheckCircle style={{ width: 15, height: 15, color: '#4ade80' }} />
              <span style={{ fontSize: 12, fontWeight: 800, color: '#4ade80' }}>Match Completed</span>
            </div>
          ) : isLive ? (
            <button
              onClick={() => onStart(match.id)}
              style={{
                width: '100%', padding: '10px 0', borderRadius: 10,
                background: 'rgba(245,158,11,0.2)',
                border: '1.5px solid rgba(245,158,11,0.45)',
                color: '#FCD34D', fontSize: 12, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
              }}
            >
              <Play style={{ width: 13, height: 13 }} />
              Resume Match
            </button>
          ) : (
            <button
              onClick={() => onStart(match.id)}
              style={{
                width: '100%', padding: '10px 0', borderRadius: 10,
                background: 'rgba(96,165,250,0.12)',
                border: '1px solid rgba(96,165,250,0.3)',
                color: '#93c5fd', fontSize: 12, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
              }}
            >
              <Play style={{ width: 13, height: 13 }} />
              Configure &amp; Start Match
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const BG = '#050810';

const NotificationDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { notifications, markAsRead } = useNotifications();
  const [notification, setNotification] = useState(null);
  // Resolved match list for queue notifications (may come from embedded data or API fetch)
  const [queueMatches, setQueueMatches] = useState(null); // null = not yet resolved
  const [loadingQueue, setLoadingQueue] = useState(false);

  useEffect(() => {
    const found = notifications.find(n => n.id === id);
    if (found) {
      setNotification(found);
      if (!found.read) markAsRead(id);
    }
  }, [id, notifications]);

  // When a queue notification loads, resolve its match list with live statuses
  useEffect(() => {
    if (!notification) return;
    const d = notification.data ? JSON.parse(notification.data) : {};
    if (notification.type !== 'MATCH_ASSIGNED' || !d.isQueue) return;

    setLoadingQueue(true);
    api.get('/matches/umpire-matches')
      .then(res => {
        const apiMatches = res.data?.matches || [];

        // If backend embedded match summaries, merge with live statuses from API
        if (Array.isArray(d.matches) && d.matches.length > 0) {
          const statusMap = {};
          for (const m of apiMatches) statusMap[m.id] = m.status;
          setQueueMatches(d.matches.map(m => ({ ...m, status: statusMap[m.id] || m.status })));
        } else {
          // Old notification — no embedded matches. Filter API matches by tournamentId + queueOrder.
          const filtered = apiMatches
            .filter(m => m.tournamentId === d.tournamentId && m.queueOrder != null)
            .sort((a, b) => (a.queueOrder || 0) - (b.queueOrder || 0))
            .map(m => ({
              id: m.id,
              queueOrder: m.queueOrder,
              round: m.round,
              matchNumber: m.matchNumber,
              status: m.status,
              categoryName: m.category?.name || '',
              player1Name: m.player1?.name || 'TBD',
              player2Name: m.player2?.name || 'TBD',
            }));
          setQueueMatches(filtered.length > 0 ? filtered : []);
        }
      })
      .catch(() => {
        // If API fails, fall back to embedded matches if available
        const d2 = notification.data ? JSON.parse(notification.data) : {};
        setQueueMatches(Array.isArray(d2.matches) ? d2.matches : []);
      })
      .finally(() => setLoadingQueue(false));
  }, [notification]);

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

  const getTypeColor = (type, data) => {
    if (type === 'MATCH_ASSIGNED' && data?.isOrganizerConfirmation) {
      return { bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)', accent: '#4ade80' };
    }
    if (['REGISTRATION_CONFIRMED','REFUND_PROCESSED','REFUND_APPROVED','PARTNER_ACCEPTED','POINTS_AWARDED'].includes(type))
      return { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.35)', accent: '#F59E0B' };
    if (['REGISTRATION_REJECTED','PAYMENT_REJECTED','REGISTRATION_REMOVED','REFUND_REJECTED','TOURNAMENT_CANCELLED','ACCOUNT_SUSPENDED'].includes(type))
      return { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.35)', accent: '#f87171' };
    if (['PARTNER_INVITATION','DRAW_PUBLISHED','MATCH_ASSIGNED','MATCH_STARTING_SOON'].includes(type))
      return { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', accent: '#FCD34D' };
    if (['CANCELLATION_REQUEST','PAYMENT_VERIFICATION_REQUIRED','REGISTRATION_PENDING'].includes(type))
      return { bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)', accent: '#fbbf24' };
    return { bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.3)', accent: '#a855f7' };
  };

  const getNotificationPath = (notification, data) => {
    switch (notification.type) {
      case 'MATCH_ASSIGNED':
        if (data.isQueue) return null; // each match card has its own CTA
        if (data.isOrganizerConfirmation) return data.tournamentId ? `/tournaments/${data.tournamentId}/draws` : null;
        if (data.matchId) return `/match/${data.matchId}/score`;
        if (data.tournamentId) return `/tournaments/${data.tournamentId}`;
        return null;
      case 'MATCH_STARTING_SOON':
        if (data.matchId) return `/match/${data.matchId}/score`;
        if (data.tournamentId) return `/tournaments/${data.tournamentId}`;
        return null;
      case 'CANCELLATION_REQUEST':
        if (data.registrationId) return `/organizer/cancellation/${data.registrationId}`;
        if (data.tournamentId) return `/organizer/tournaments/${data.tournamentId}?tab=refunds`;
        return '/organizer/dashboard';
      case 'PAYMENT_VERIFICATION_REQUIRED': case 'REGISTRATION_PENDING':
        return data.tournamentId ? `/organizer/tournaments/${data.tournamentId}` : '/organizer/dashboard';
      case 'REGISTRATION_CONFIRMED': case 'REGISTRATION_REJECTED': case 'PAYMENT_REJECTED':
      case 'REGISTRATION_REMOVED': case 'REFUND_APPROVED': case 'REFUND_REJECTED':
        return '/registrations';
      case 'PARTNER_INVITATION':
        return data.tournamentId ? `/tournaments/${data.tournamentId}` : '/tournaments';
      case 'PARTNER_ACCEPTED': case 'PARTNER_DECLINED': return '/registrations';
      case 'DRAW_PUBLISHED':
        return data.tournamentId ? `/tournaments/${data.tournamentId}/draws` : '/tournaments';
      case 'TOURNAMENT_CANCELLED': case 'TOURNAMENT_REMINDER':
        return data.tournamentId ? `/tournaments/${data.tournamentId}` : '/tournaments';
      case 'REFUND_PROCESSED': return '/registrations';
      case 'POINTS_AWARDED': return '/leaderboard';
      default: return null;
    }
  };

  const getActionButtonText = (type, data) => {
    if (type === 'MATCH_ASSIGNED') {
      if (data.isQueue) return null;
      if (data.isOrganizerConfirmation) return 'View Tournament Draws';
      return 'Go to Match → Start Now';
    }
    switch (type) {
      case 'PARTNER_INVITATION': return 'View Tournament';
      case 'REGISTRATION_CONFIRMED': case 'REGISTRATION_REJECTED': case 'PAYMENT_REJECTED':
      case 'REGISTRATION_REMOVED': return 'View My Registrations';
      case 'DRAW_PUBLISHED': return 'View Tournament Draws';
      case 'MATCH_STARTING_SOON': return 'Go to Match → Start Now';
      case 'TOURNAMENT_CANCELLED': case 'TOURNAMENT_REMINDER': return 'View Tournament Details';
      case 'PAYMENT_VERIFICATION_REQUIRED': case 'REGISTRATION_PENDING': return 'View Tournament Dashboard';
      case 'CANCELLATION_REQUEST': return 'Review Cancellation Request';
      case 'REFUND_PROCESSED': return 'View My Registrations';
      case 'POINTS_AWARDED': return 'View Leaderboard';
      default: return 'Take Action';
    }
  };

  if (!notification) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <div className="text-center">
          <Spinner size="lg" className="mx-auto" />
          <p className="mt-4 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  const data = notification.data ? JSON.parse(notification.data) : {};
  const typeColor = getTypeColor(notification.type, data);
  const actionPath = getNotificationPath(notification, data);
  const actionText = getActionButtonText(notification.type, data);

  const isQueueNotif = notification.type === 'MATCH_ASSIGNED' && data.isQueue === true;
  const isOrgConfirm = notification.type === 'MATCH_ASSIGNED' && data.isOrganizerConfirmation === true;
  const resolvedMatches = queueMatches || [];

  return (
    <div className="min-h-screen relative" style={{ background: BG }}>
      {/* Galaxy background */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: 'url(/bg-notifications.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
        opacity: 0.5,
        zIndex: 0,
      }} />
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'linear-gradient(180deg, rgba(5,8,16,0.6) 0%, rgba(5,8,16,0.78) 60%, rgba(5,8,16,0.92) 100%)',
        zIndex: 1,
      }} />
      {/* Particles */}
      <div className="fixed top-0 bottom-0 pointer-events-none overflow-hidden" style={{ left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '480px', zIndex: 2 }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-15"
          style={{ background: `radial-gradient(circle,${typeColor.accent}50 0%,transparent 70%)` }} />
        <div className="absolute bottom-1/3 left-0 w-56 h-56 rounded-full blur-3xl opacity-10"
          style={{ background: 'radial-gradient(circle,rgba(168,85,247,0.5) 0%,transparent 70%)' }} />
        {DETAIL_PARTICLES.map((p, i) => (
          <div key={i} className="absolute rounded-full"
            style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${p.r}px`, height: `${p.r}px`,
              background: p.c, opacity: p.o,
              animation: `detailStar ${p.dur}s ease-in-out ${p.delay}s infinite`,
              boxShadow: `0 0 ${p.r * 3}px ${p.c}` }} />
        ))}
      </div>
      <style>{`@keyframes detailStar{0%,100%{transform:scale(1);opacity:inherit}50%{transform:scale(2);opacity:0.6}}`}</style>

      {/* Sticky header */}
      <div className="sticky top-0 z-20" style={{ background: 'rgba(5,8,16,0.82)', borderBottom: `1px solid ${typeColor.border}`, backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}>
        <div className="px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/notifications')}
            className="flex items-center gap-1.5 text-sm font-medium transition-colors"
            style={{ color: 'rgba(255,255,255,0.6)' }}>
            <ArrowLeft className="w-4 h-4" /> Back to Notifications
          </button>
        </div>
      </div>

      <div className="relative px-4 py-5 space-y-4" style={{ zIndex: 10 }}>

        {/* ── Notification header card (always shown) ── */}
        <div className="rounded-2xl overflow-hidden" style={{ background: typeColor.bg, border: `1.5px solid ${typeColor.border}` }}>
          <div className="p-5">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                style={{ background: typeColor.bg, border: `1px solid ${typeColor.border}` }}>
                {isOrgConfirm ? '✅' : getNotificationIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-black text-white leading-tight mb-2">{notification.title}</h1>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{format(new Date(notification.createdAt), 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    <Clock className="w-3.5 h-3.5" />
                    <span>{format(new Date(notification.createdAt), 'h:mm a')}</span>
                  </div>
                  {!notification.read && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-black"
                      style={{ background: typeColor.bg, border: `1px solid ${typeColor.border}`, color: typeColor.accent }}>
                      New
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════
            QUEUE NOTIFICATION — umpire sees all match cards
            ══════════════════════════════════════════════════ */}
        {isQueueNotif && (() => {
          if (loadingQueue || queueMatches === null) {
            return (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '24px 0' }}>
                <Spinner size="sm" />
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>Loading your matches…</span>
              </div>
            );
          }

          const matches = resolvedMatches;
          const total = matches.length;
          const completedCount = matches.filter(m => m.status === 'COMPLETED').length;
          const remaining = total - completedCount;

          return (
            <>
              {/* Summary banner */}
              <div style={{
                background: 'rgba(245,158,11,0.07)',
                border: '1px solid rgba(245,158,11,0.22)',
                borderRadius: 14, padding: '12px 14px',
              }}>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, margin: 0 }}>
                  {data.tournamentName && (
                    <span style={{ display: 'block', fontWeight: 800, color: '#FCD34D', marginBottom: 4 }}>
                      {data.tournamentName}
                    </span>
                  )}
                  You have been assigned{' '}
                  <strong style={{ color: '#fff' }}>{data.matchCount || total} match{(data.matchCount || total) !== 1 ? 'es' : ''}</strong>.
                  {completedCount > 0
                    ? ` ${completedCount} completed, ${remaining} remaining.`
                    : ' Tap Configure & Start on each match below to begin scoring.'}
                </p>
              </div>

              {/* Progress dots */}
              {total > 1 && (
                <div style={{ display: 'flex', gap: 5, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {matches.map((m, i) => {
                    const done = m.status === 'COMPLETED';
                    const live = m.status === 'IN_PROGRESS' || m.status === 'LIVE';
                    return (
                      <div key={m.id} style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: done ? '#4ade80' : live ? '#F59E0B' : 'rgba(255,255,255,0.18)',
                      }} />
                    );
                  })}
                </div>
              )}

              {/* Match cards */}
              {total === 0 && (
                <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.35)', padding: '16px 0' }}>
                  No matches found for this queue.
                </p>
              )}
              {matches.map((match, i) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  index={i}
                  total={total}
                  liveStatus={null}
                  onStart={(matchId) => navigate(`/match/${matchId}/score`)}
                />
              ))}
            </>
          );
        })()}

        {/* ══════════════════════════════════════════════════
            ORGANIZER CONFIRMATION — simple card
            ══════════════════════════════════════════════════ */}
        {isOrgConfirm && (
          <div style={{
            background: 'rgba(34,197,94,0.07)',
            border: '1px solid rgba(34,197,94,0.22)',
            borderRadius: 16, padding: '18px 16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <CheckCircle style={{ width: 20, height: 20, color: '#4ade80' }} />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 800, color: '#fff', margin: 0 }}>Queue Saved Successfully</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: 0, marginTop: 2 }}>{data.tournamentName}</p>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Assigned to</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#FCD34D' }}>{data.umpireName || 'Umpire'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Matches in queue</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{data.matchCount}</span>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            ALL OTHER NOTIFICATION TYPES — original layout
            ══════════════════════════════════════════════════ */}
        {!isQueueNotif && !isOrgConfirm && (
          <>
            {/* Message body */}
            <div className="rounded-2xl p-5 space-y-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-sm leading-relaxed text-white whitespace-pre-wrap">
                {(notification.message || '').replace(/https?:\/\/[^\s]+/g, '').trimEnd()}
              </p>
              {(notification.message || '').match(/https?:\/\/[^\s]+/g)?.map((url, i) => {
                const isWhatsApp = url.includes('chat.whatsapp.com');
                return (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-black text-sm transition-all active:scale-[0.98]"
                    style={{
                      background: isWhatsApp ? 'linear-gradient(135deg,#25D366,#128C7E)' : 'linear-gradient(135deg,#F59E0B,#FCD34D)',
                      color: '#fff', boxShadow: isWhatsApp ? '0 4px 16px rgba(37,211,102,0.4)' : '0 4px 16px rgba(245,158,11,0.4)',
                      textDecoration: 'none',
                    }}>
                    {isWhatsApp ? '💬 Join WhatsApp Community' : '🔗 Open Link'}
                  </a>
                );
              })}
            </div>

            {/* Additional data cards */}
            {Object.keys(data).length > 0 && notification.type !== 'PARTNER_INVITATION' && (
              <div className="space-y-3">
                {(data.tournamentName || data.categoryName || data.tournamentDate) && (
                  <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="px-4 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(168,85,247,0.08)' }}>
                      <p className="text-xs font-black" style={{ color: '#a855f7' }}>🏸 Tournament Details</p>
                    </div>
                    <div className="p-4 space-y-2.5">
                      {data.tournamentName && (
                        <div className="flex items-start gap-3">
                          <span className="text-xs w-20 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.45)' }}>Tournament</span>
                          <span className="text-sm font-bold text-white flex-1">{data.tournamentName}</span>
                        </div>
                      )}
                      {data.categoryName && (
                        <div className="flex items-start gap-3">
                          <span className="text-xs w-20 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.45)' }}>Category</span>
                          <span className="text-sm font-bold flex-1" style={{ color: '#a855f7' }}>{data.categoryName}</span>
                        </div>
                      )}
                      {data.tournamentDate && (
                        <div className="flex items-start gap-3">
                          <span className="text-xs w-20 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.45)' }}>Date</span>
                          <span className="text-sm font-medium flex-1" style={{ color: '#FCD34D' }}>{data.tournamentDate}</span>
                        </div>
                      )}
                      {(data.playerName || data.partnerName) && (
                        <div className="flex items-start gap-3">
                          <span className="text-xs w-20 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.45)' }}>Partner</span>
                          <span className="text-sm font-bold flex-1" style={{ color: '#F59E0B' }}>{data.playerName || data.partnerName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Single match assignment details */}
                {['MATCH_ASSIGNED','MATCH_STARTING_SOON'].includes(notification.type) && (data.player1Name || data.player2Name) && (
                  <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.22)' }}>
                    <div className="px-4 py-2.5" style={{ borderBottom: '1px solid rgba(245,158,11,0.15)', background: 'rgba(245,158,11,0.08)' }}>
                      <p className="text-xs font-black" style={{ color: '#FCD34D' }}>⚖️ Match Details</p>
                    </div>
                    <div className="p-4 space-y-3">
                      {data.matchDetails && (
                        <div className="flex items-center gap-3">
                          <span className="text-xs w-20 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.45)' }}>Match</span>
                          <span className="text-sm font-black text-white">{data.matchDetails}</span>
                        </div>
                      )}
                      <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(245,158,11,0.12)' }}>
                        <p className="text-base font-black text-white leading-snug">{data.player1Name || 'TBD'}</p>
                        <p className="text-xs font-black my-1.5" style={{ color: 'rgba(245,158,11,0.6)', letterSpacing: '0.15em' }}>VS</p>
                        <p className="text-base font-black text-white leading-snug">{data.player2Name || 'TBD'}</p>
                      </div>
                      {data.courtNumber && (
                        <div className="flex items-center gap-3">
                          <span className="text-xs w-20 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.45)' }}>Court</span>
                          <span className="text-sm font-black" style={{ color: '#FCD34D' }}>Court {data.courtNumber}</span>
                        </div>
                      )}
                      {data.matchId && (
                        <button onClick={() => navigate(`/match/${data.matchId}/score`)}
                          className="w-full py-4 rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-2"
                          style={{ background: 'linear-gradient(135deg,#F59E0B 0%,#0099bb 100%)', color: '#000', boxShadow: '0 6px 24px rgba(245,158,11,0.45)', letterSpacing: '0.02em' }}>
                          ▶ Configure &amp; Start Match
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {(data.points || data.placement) && (
                  <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
                    <div className="px-4 py-2.5" style={{ borderBottom: '1px solid rgba(245,158,11,0.15)', background: 'rgba(245,158,11,0.08)' }}>
                      <p className="text-xs font-black" style={{ color: '#fbbf24' }}>🏆 Achievement</p>
                    </div>
                    <div className="p-4 space-y-2">
                      {data.placement && (
                        <div className="flex items-center gap-3">
                          <span className="text-xs w-20 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.45)' }}>Placement</span>
                          <span className="text-xl font-black text-white">{data.placement}</span>
                        </div>
                      )}
                      {data.points && (
                        <div className="flex items-center gap-3">
                          <span className="text-xs w-20 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.45)' }}>Points</span>
                          <span className="text-2xl font-black" style={{ color: '#fbbf24' }}>+{data.points} pts</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {data.reason && (
                  <div className="rounded-2xl p-4" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <p className="text-xs font-black mb-2" style={{ color: '#f87171' }}>ℹ️ Reason</p>
                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>{data.reason}</p>
                  </div>
                )}
              </div>
            )}

            {/* Refund form */}
            {notification.type === 'PAYMENT_REJECTED' && data.action === 'PROVIDE_REFUND_DETAILS' && (
              <RefundDetailsForm
                registrationId={data.registrationId}
                refundAmount={data.refundAmount}
                tournamentName={data.tournamentName || 'Tournament'}
                rejectionReason={data.reason}
                onSuccess={() => navigate('/registrations')}
              />
            )}
          </>
        )}

        {/* ── Action button (all types except queue, and non-PAYMENT_REJECTED) ── */}
        {actionPath && actionText && notification.type !== 'PAYMENT_REJECTED' && (
          <button onClick={() => navigate(actionPath)}
            className="w-full py-3.5 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 group"
            style={{ background: `linear-gradient(135deg,${typeColor.accent}cc,${typeColor.accent})`, color: '#050810', boxShadow: `0 4px 16px ${typeColor.accent}40` }}>
            <span>{actionText}</span>
            <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        )}
      </div>
    </div>
  );
};

export default NotificationDetailPage;
