import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, XCircle, Clock, IndianRupee,
  Calendar, Phone, User, ChevronDown, ChevronUp,
  ExternalLink, Check, X, AlertCircle
} from 'lucide-react';
import api from '../utils/api';

const B = {
  bg: '#0a0a0f', card: '#12121a', card2: '#1a1a26',
  border: 'rgba(255,255,255,0.07)',
  cyan: '#FCD34D', green: '#F59E0B', amber: '#f59e0b',
  red: '#ef4444',
  text: 'rgba(255,255,255,0.85)', muted: 'rgba(255,255,255,0.45)',
};

const STATUS_META = {
  pending:   { label: 'Pending',   color: B.amber, icon: Clock },
  confirmed: { label: 'Confirmed', color: B.green, icon: CheckCircle },
  rejected:  { label: 'Rejected',  color: B.red,   icon: XCircle },
  cancelled: { label: 'Cancelled', color: B.muted, icon: XCircle },
};

const TABS = ['pending', 'confirmed', 'rejected'];

function Toast({ msg, type, onClose }) {
  if (!msg) return null;
  const color = type === 'error' ? B.red : B.green;
  return (
    <div className="fixed top-4 left-4 right-4 z-50 rounded-2xl px-4 py-3 flex items-center gap-3"
      style={{ background: color + '15', border: `1px solid ${color}40`, backdropFilter: 'blur(12px)' }}>
      {type === 'error' ? <X size={16} color={color} /> : <Check size={16} color={color} />}
      <p className="text-sm font-bold flex-1" style={{ color }}>{msg}</p>
      <button onClick={onClose}><X size={14} color={B.muted} /></button>
    </div>
  );
}

function BookingCard({ booking, onConfirm, onReject, actioning }) {
  const [expanded, setExpanded] = useState(booking.status === 'pending');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const meta = STATUS_META[booking.status] || STATUS_META.pending;
  const StatusIcon = meta.icon;

  const formatTime12 = (t) => {
    if (!t) return t;
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  const formatDate = (d) => {
    if (!d) return d;
    return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: B.card, border: `1px solid ${booking.status === 'pending' ? B.amber + '40' : B.border}` }}>
      {/* Header */}
      <button onClick={() => setExpanded(!expanded)} className="w-full px-4 py-4 flex items-center gap-3 text-left">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${meta.color}15` }}>
          <StatusIcon size={18} color={meta.color} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-black text-white truncate">{booking.court?.name || 'Court'}</p>
            <span className="text-xs font-black px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: `${meta.color}20`, color: meta.color }}>
              {meta.label}
            </span>
          </div>
          <p className="text-xs mt-0.5" style={{ color: B.muted }}>
            {formatDate(booking.bookingDate)} · {formatTime12(booking.startTime)}–{formatTime12(booking.endTime)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <p className="text-sm font-black" style={{ color: B.cyan }}>₹{booking.amount}</p>
          {expanded ? <ChevronUp size={14} color={B.muted} /> : <ChevronDown size={14} color={B.muted} />}
        </div>
      </button>

      {expanded && (
        <div style={{ borderTop: `1px solid ${B.border}` }}>
          <div className="p-4 space-y-4">
            {/* Player info */}
            {booking.user && (
              <div className="rounded-xl p-3 space-y-2" style={{ background: B.card2 }}>
                <p className="text-xs font-black" style={{ color: B.muted }}>PLAYER DETAILS</p>
                <div className="flex items-center gap-2">
                  <User size={14} color={B.cyan} />
                  <p className="text-sm font-black text-white">{booking.user.name}</p>
                </div>
                {booking.user.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={14} color={B.muted} />
                    <a href={`tel:${booking.user.phone}`} className="text-sm font-bold" style={{ color: B.cyan }}>
                      {booking.user.phone}
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Booking details */}
            <div className="rounded-xl p-3 space-y-2" style={{ background: B.card2 }}>
              <p className="text-xs font-black" style={{ color: B.muted }}>BOOKING DETAILS</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs" style={{ color: B.muted }}>Date</p>
                  <p className="text-sm font-black text-white">{formatDate(booking.bookingDate)}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: B.muted }}>Time</p>
                  <p className="text-sm font-black text-white">{formatTime12(booking.startTime)} – {formatTime12(booking.endTime)}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: B.muted }}>Duration</p>
                  <p className="text-sm font-black text-white">{booking.durationMinutes} min</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: B.muted }}>Amount</p>
                  <p className="text-sm font-black" style={{ color: B.cyan }}>₹{booking.amount}</p>
                </div>
              </div>
              {booking.notes && (
                <div>
                  <p className="text-xs" style={{ color: B.muted }}>Notes</p>
                  <p className="text-sm text-white">{booking.notes}</p>
                </div>
              )}
            </div>

            {/* Payment screenshot */}
            {booking.paymentScreenshot && (
              <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${B.amber}30` }}>
                <div className="px-3 py-2 flex items-center justify-between" style={{ background: `${B.amber}10` }}>
                  <p className="text-xs font-black" style={{ color: B.amber }}>PAYMENT SCREENSHOT</p>
                  <a href={booking.paymentScreenshot} target="_blank" rel="noreferrer">
                    <ExternalLink size={14} color={B.amber} />
                  </a>
                </div>
                <a href={booking.paymentScreenshot} target="_blank" rel="noreferrer">
                  <img src={booking.paymentScreenshot} alt="Payment" className="w-full object-cover" style={{ maxHeight: 240 }} />
                </a>
              </div>
            )}

            {!booking.paymentScreenshot && booking.status === 'pending' && (
              <div className="rounded-xl p-3 flex items-center gap-2" style={{ background: `${B.red}10`, border: `1px solid ${B.red}20` }}>
                <AlertCircle size={16} color={B.red} />
                <p className="text-xs font-bold" style={{ color: B.red }}>No payment screenshot uploaded yet</p>
              </div>
            )}

            {/* Actions */}
            {booking.status === 'pending' && (
              <div className="space-y-2">
                {showRejectInput ? (
                  <div className="space-y-2">
                    <textarea
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      placeholder="Reason for rejection (e.g. payment not received)…"
                      rows={3}
                      className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 resize-none"
                      style={{ background: B.card2, border: `1px solid ${B.border}` }}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowRejectInput(false)}
                        className="flex-1 py-3 rounded-xl text-sm font-black"
                        style={{ background: B.card2, color: B.muted }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => onReject(booking.id, rejectReason)}
                        disabled={actioning === booking.id}
                        className="flex-1 py-3 rounded-xl text-sm font-black"
                        style={{ background: `${B.red}20`, color: B.red, border: `1px solid ${B.red}40` }}
                      >
                        {actioning === booking.id ? 'Rejecting…' : 'Confirm Reject'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowRejectInput(true)}
                      className="flex-1 py-3.5 rounded-xl text-sm font-black flex items-center justify-center gap-1.5"
                      style={{ background: `${B.red}15`, color: B.red, border: `1px solid ${B.red}30` }}
                    >
                      <XCircle size={16} />
                      Reject
                    </button>
                    <button
                      onClick={() => onConfirm(booking.id)}
                      disabled={actioning === booking.id}
                      className="flex-1 py-3.5 rounded-xl text-sm font-black flex items-center justify-center gap-1.5"
                      style={{ background: `linear-gradient(135deg, ${B.green}, #D97706)`, color: '#000' }}
                    >
                      <CheckCircle size={16} />
                      {actioning === booking.id ? 'Confirming…' : 'Confirm ₹' + booking.amount + ' Received'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {booking.status === 'rejected' && booking.rejectionReason && (
              <div className="rounded-xl p-3" style={{ background: `${B.red}10`, border: `1px solid ${B.red}20` }}>
                <p className="text-xs font-black mb-1" style={{ color: B.red }}>REJECTION REASON</p>
                <p className="text-sm text-white">{booking.rejectionReason}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function OwnerBookingsPage() {
  const { academyId } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState('pending');
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(null);
  const [toast, setToast] = useState({ msg: '', type: 'success' });

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '' }), 3000);
  }

  useEffect(() => { loadBookings(); }, [academyId, tab]);

  async function loadBookings() {
    try {
      setLoading(true);
      const res = await api.get(`/court-bookings/academy/${academyId}`, { params: { status: tab } });
      setBookings(res.data.data.bookings);
      setStats(res.data.data.stats);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to load bookings', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(bookingId) {
    try {
      setActioning(bookingId);
      await api.post(`/court-bookings/${bookingId}/confirm`);
      showToast('Booking confirmed!');
      loadBookings();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to confirm', 'error');
    } finally {
      setActioning(null);
    }
  }

  async function handleReject(bookingId, reason) {
    try {
      setActioning(bookingId);
      await api.post(`/court-bookings/${bookingId}/reject`, { reason });
      showToast('Booking rejected');
      loadBookings();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to reject', 'error');
    } finally {
      setActioning(null);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: B.bg, paddingBottom: 40 }}>
      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: '' })} />

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: B.card, border: `1px solid ${B.border}` }}>
          <ArrowLeft size={16} color={B.text} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-black text-white">Court Bookings</h1>
          <p className="text-xs" style={{ color: B.muted }}>
            {stats.pending > 0 ? `${stats.pending} pending verification` : 'All caught up'}
          </p>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3 px-4 mb-4">
        {[
          { label: 'Pending', value: stats.pending || 0, color: B.amber },
          { label: 'Confirmed', value: stats.confirmed || 0, color: B.green },
          { label: 'Revenue', value: (stats.revenue || 0) >= 1000 ? `₹${((stats.revenue || 0) / 1000).toFixed(1)}k` : `₹${stats.revenue || 0}`, color: B.cyan },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-3 text-center" style={{ background: B.card, border: `1px solid ${B.border}` }}>
            <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs" style={{ color: B.muted }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 mb-4">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2.5 rounded-xl text-xs font-black capitalize"
            style={{
              background: tab === t ? (STATUS_META[t]?.color + '20') : B.card,
              color: tab === t ? STATUS_META[t]?.color : B.muted,
              border: `1px solid ${tab === t ? STATUS_META[t]?.color + '40' : B.border}`
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="px-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(245,158,11,0.15)', borderTopColor: B.cyan, animation: 'spin 0.7s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <Calendar size={40} color={B.muted} />
            <p className="font-black text-white">No {tab} bookings</p>
            <p className="text-xs" style={{ color: B.muted }}>
              {tab === 'pending' ? 'New booking requests will appear here' : `No ${tab} bookings yet`}
            </p>
          </div>
        ) : (
          bookings.map(b => (
            <BookingCard
              key={b.id}
              booking={b}
              onConfirm={handleConfirm}
              onReject={handleReject}
              actioning={actioning}
            />
          ))
        )}
      </div>
    </div>
  );
}


