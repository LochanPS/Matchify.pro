import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Calendar, Clock, Upload, CheckCircle, Loader } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { format } from 'date-fns';
import api from '../utils/api';
import { fetchUpload } from '../utils/fetchUpload';
import { toast } from 'react-hot-toast';
import Spinner from '../components/Spinner';

// Deterministic particles — no Math.random in render
const DETAIL_PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  x: (i * 37 + 11) % 97,
  y: (i * 53 + 7) % 93,
  r: ((i * 7) % 3) + 1,
  o: ((i * 13) % 40) / 100 + 0.1,
  dur: (i * 7) % 7 + 4,
  delay: (i * 3) % 5,
  c: ['#F59E0B','#FCD34D','#a855f7','rgba(255,255,255,0.6)'][i % 4],
}));

// Embedded Refund Details Form Component
const RefundDetailsForm = ({ registrationId, refundAmount, tournamentName, rejectionReason, onSuccess }) => {
  const [formData, setFormData] = useState({ upiId: '', accountName: '', qrCode: null });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const qrCodeInputRef = useRef(null);

  const handleQrCodeChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) { setErrors(prev => ({ ...prev, qrCode: 'Please upload an image file' })); return; }
      if (file.size > 5 * 1024 * 1024) { setErrors(prev => ({ ...prev, qrCode: 'File size must be less than 5MB' })); return; }
      setFormData(prev => ({ ...prev, qrCode: file }));
      setErrors(prev => ({ ...prev, qrCode: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.upiId || formData.upiId.trim().length < 5) newErrors.upiId = 'Please provide a valid UPI ID';
    if (!formData.accountName || formData.accountName.trim().length < 2) newErrors.accountName = 'Please provide your account name';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setSubmitting(true);
      const submitData = new FormData();
      submitData.append('upiId', formData.upiId.trim());
      submitData.append('accountName', formData.accountName.trim());
      if (formData.qrCode) submitData.append('refundQrCode', formData.qrCode);
      await fetchUpload(`/registrations/${registrationId}/submit-refund-details`, submitData);
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
          <input type="text" value={formData.upiId} onChange={(e) => setFormData(prev => ({ ...prev, upiId: e.target.value }))}
            placeholder="yourname@upi or 9876543210@paytm"
            className="w-full px-4 py-3 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', border: errors.upiId ? '1px solid rgba(239,68,68,0.6)' : '1px solid rgba(255,255,255,0.12)' }} />
          {errors.upiId && <p className="text-red-400 text-xs mt-1">{errors.upiId}</p>}
        </div>
        <div>
          <label className="block text-xs font-bold mb-1.5" style={{ color: 'rgba(255,255,255,0.7)' }}>Account Holder Name <span className="text-red-400">*</span></label>
          <input type="text" value={formData.accountName} onChange={(e) => setFormData(prev => ({ ...prev, accountName: e.target.value }))}
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
            {formData.qrCode ? (
              <><CheckCircle className="h-7 w-7" style={{ color: '#F59E0B' }} /><span className="text-sm font-semibold" style={{ color: '#F59E0B' }}>{formData.qrCode.name}</span><span className="text-xs" style={{ color: 'rgba(245,158,11,0.6)' }}>Tap to change</span></>
            ) : (
              <><Upload className="h-7 w-7" style={{ color: 'rgba(255,255,255,0.3)' }} /><span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Upload QR Code</span><span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>PNG, JPG up to 5MB</span></>
            )}
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

const BG = 'linear-gradient(180deg,#0a0a1f 0%,#050810 50%,#0a0a1f 100%)';

const NotificationDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { notifications, markAsRead } = useNotifications();
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const found = notifications.find(n => n.id === id);
    if (found) {
      setNotification(found);
      if (!found.read) markAsRead(id);
    }
  }, [id, notifications]);

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

  const getTypeColor = (type) => {
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

  const getNotificationPath = (notification) => {
    const data = notification.data ? JSON.parse(notification.data) : {};
    switch (notification.type) {
      case 'CANCELLATION_REQUEST':
        if (data.registrationId) return `/organizer/cancellation/${data.registrationId}`;
        if (data.tournamentId) return `/organizer/tournaments/${data.tournamentId}?tab=refunds`;
        return '/organizer/dashboard';
      case 'PAYMENT_VERIFICATION_REQUIRED': case 'REGISTRATION_PENDING':
        if (data.tournamentId) return `/organizer/tournaments/${data.tournamentId}`;
        return '/organizer/dashboard';
      case 'REGISTRATION_CONFIRMED': case 'REGISTRATION_REJECTED': case 'PAYMENT_REJECTED':
      case 'REGISTRATION_REMOVED': case 'REFUND_APPROVED': case 'REFUND_REJECTED':
        return '/registrations';
      case 'PARTNER_INVITATION':
        if (data.tournamentId) return `/tournaments/${data.tournamentId}`;
        return '/tournaments';
      case 'PARTNER_ACCEPTED': case 'PARTNER_DECLINED': return '/registrations';
      case 'DRAW_PUBLISHED':
        if (data.tournamentId) return `/tournaments/${data.tournamentId}/draws`;
        return '/tournaments';
      case 'MATCH_ASSIGNED': case 'MATCH_STARTING_SOON':
        if (data.matchId) {
          // Go directly to scoring page — umpire can start match in one tap
          return `/match/${data.matchId}/score`;
        }
        if (data.tournamentId) return `/tournaments/${data.tournamentId}`;
        return '/tournaments';
      case 'TOURNAMENT_CANCELLED': case 'TOURNAMENT_REMINDER':
        if (data.tournamentId) return `/tournaments/${data.tournamentId}`;
        return '/tournaments';
      case 'REFUND_PROCESSED': return '/registrations';
      case 'POINTS_AWARDED': return '/leaderboard';
      default: return null;
    }
  };

  const getActionButtonText = (type) => {
    switch (type) {
      case 'PARTNER_INVITATION': return 'View Tournament';
      case 'REGISTRATION_CONFIRMED': case 'REGISTRATION_REJECTED': case 'PAYMENT_REJECTED':
      case 'REGISTRATION_REMOVED': return 'View My Registrations';
      case 'DRAW_PUBLISHED': return 'View Tournament Draws';
      case 'MATCH_ASSIGNED': case 'MATCH_STARTING_SOON': return 'Go to Match → Start Now';
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

  const actionPath = getNotificationPath(notification);
  const data = notification.data ? JSON.parse(notification.data) : {};
  const typeColor = getTypeColor(notification.type);

  return (
    <div className="min-h-screen relative" style={{ background: BG }}>
      {/* Fixed bg glow + particles */}
      <div className="fixed top-0 bottom-0 pointer-events-none overflow-hidden" style={{ left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "480px" }}>
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
      <style>{`
        @keyframes detailStar {
          0%,100%{transform:scale(1);opacity:inherit}
          50%{transform:scale(2);opacity:0.6}
        }
      `}</style>

      {/* Sticky header */}
      <div className="sticky top-0 z-20" style={{ background: 'rgba(7,7,26,0.95)', borderBottom: `1px solid ${typeColor.border}`, backdropFilter: 'blur(20px)' }}>
        <div className="px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/notifications')}
            className="flex items-center gap-1.5 text-sm font-medium transition-colors"
            style={{ color: 'rgba(255,255,255,0.6)' }}>
            <ArrowLeft className="w-4 h-4" /> Back to Notifications
          </button>
        </div>
      </div>

      <div className="relative px-4 py-5 space-y-4">
        {/* Notification header card */}
        <div className="rounded-2xl overflow-hidden" style={{ background: typeColor.bg, border: `1.5px solid ${typeColor.border}` }}>
          <div className="p-5">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                style={{ background: `${typeColor.bg}`, border: `1px solid ${typeColor.border}` }}>
                {getNotificationIcon(notification.type)}
              </div>
              {/* Title + meta */}
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

        {/* Message */}
        <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-sm leading-relaxed text-white whitespace-pre-wrap">{notification.message}</p>
        </div>

        {/* Additional data cards */}
        {Object.keys(data).length > 0 && notification.type !== 'PARTNER_INVITATION' && (
          <div className="space-y-3">
            {/* Tournament info */}
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

            {/* Match assignment details — players vs players */}
            {['MATCH_ASSIGNED', 'MATCH_STARTING_SOON'].includes(notification.type) && (data.player1Name || data.player2Name) && (
              <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.22)' }}>
                <div className="px-4 py-2.5" style={{ borderBottom: '1px solid rgba(245,158,11,0.15)', background: 'rgba(245,158,11,0.08)' }}>
                  <p className="text-xs font-black" style={{ color: '#FCD34D' }}>⚖️ Match Details</p>
                </div>
                <div className="p-4 space-y-3">
                  {/* Round + match */}
                  {data.matchDetails && (
                    <div className="flex items-center gap-3">
                      <span className="text-xs w-20 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.45)' }}>Match</span>
                      <span className="text-sm font-black text-white">{data.matchDetails}</span>
                    </div>
                  )}
                  {/* Players — big VS display */}
                  <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(245,158,11,0.12)' }}>
                    <p className="text-base font-black text-white leading-snug">
                      {data.player1Name || 'TBD'}
                    </p>
                    <p className="text-xs font-black my-1.5" style={{ color: 'rgba(245,158,11,0.6)', letterSpacing: '0.15em' }}>VS</p>
                    <p className="text-base font-black text-white leading-snug">
                      {data.player2Name || 'TBD'}
                    </p>
                  </div>
                  {/* Court */}
                  {data.courtNumber && (
                    <div className="flex items-center gap-3">
                      <span className="text-xs w-20 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.45)' }}>Court</span>
                      <span className="text-sm font-black" style={{ color: '#FCD34D' }}>Court {data.courtNumber}</span>
                    </div>
                  )}

                  {/* Configure & Start Match — primary CTA inside the card */}
                  {data.matchId && (
                    <button
                      onClick={() => navigate(`/match/${data.matchId}/score`)}
                      className="w-full py-4 rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-2"
                      style={{
                        background: 'linear-gradient(135deg, #F59E0B 0%, #0099bb 100%)',
                        color: '#000',
                        boxShadow: '0 6px 24px rgba(245,158,11,0.45)',
                        letterSpacing: '0.02em',
                      }}>
                      ▶ Configure &amp; Start Match
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Points */}
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

            {/* Reason */}
            {data.reason && (
              <div className="rounded-2xl p-4" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <p className="text-xs font-black mb-2" style={{ color: '#f87171' }}>ℹ️ Reason</p>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>{data.reason}</p>
              </div>
            )}
          </div>
        )}

        {/* Refund details form */}
        {notification.type === 'PAYMENT_REJECTED' && data.action === 'PROVIDE_REFUND_DETAILS' && (
          <RefundDetailsForm
            registrationId={data.registrationId}
            refundAmount={data.refundAmount}
            tournamentName={data.tournamentName || 'Tournament'}
            rejectionReason={data.reason}
            onSuccess={() => navigate('/registrations')}
          />
        )}

        {/* Action button */}
        {notification.type !== 'PAYMENT_REJECTED' && actionPath && (
          <button onClick={() => navigate(actionPath)}
            className="w-full py-3.5 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 group"
            style={{ background: `linear-gradient(135deg,${typeColor.accent}cc,${typeColor.accent})`, color: '#050810', boxShadow: `0 4px 16px ${typeColor.accent}40` }}>
            <span>{getActionButtonText(notification.type)}</span>
            <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        )}
      </div>
    </div>
  );
};

export default NotificationDetailPage;

