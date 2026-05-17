import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Calendar, CheckCircle, XCircle, Clock,
  MapPin, Phone, ChevronRight, ChevronDown, ChevronUp,
  X, Check
} from 'lucide-react';
import api from '../utils/api';

const B = {
  bg: '#0a0a0f', card: '#12121a', card2: '#1a1a26',
  border: 'rgba(255,255,255,0.07)',
  cyan: '#00d4ff', green: '#10b981', amber: '#f59e0b',
  red: '#ef4444',
  text: 'rgba(255,255,255,0.85)', muted: 'rgba(255,255,255,0.45)',
};

const STATUS_META = {
  pending:   { label: 'Pending Verification', color: B.amber, icon: Clock, desc: 'Academy is reviewing your payment' },
  confirmed: { label: 'Confirmed',             color: B.green, icon: CheckCircle, desc: 'Your slot is reserved!' },
  rejected:  { label: 'Rejected',              color: B.red,   icon: XCircle, desc: 'Payment could not be verified' },
  cancelled: { label: 'Cancelled',             color: B.muted, icon: XCircle, desc: 'Booking was cancelled' },
};

const TABS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'all', label: 'All' },
];

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

function formatTime12(t) {
  if (!t) return t;
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function formatDate(d) {
  if (!d) return d;
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  });
}

function BookingCard({ booking, onCancel, cancelling }) {
  const [expanded, setExpanded] = useState(false);
  const meta = STATUS_META[booking.status] || STATUS_META.pending;
  const StatusIcon = meta.icon;
  const isPast = booking.bookingDate < new Date().toISOString().split('T')[0];
  const canCancel = ['pending', 'confirmed'].includes(booking.status) && !isPast;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: B.card, border: `1px solid ${B.border}` }}>
      <button onClick={() => setExpanded(!expanded)} className="w-full px-4 py-4 flex items-center gap-3 text-left">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${meta.color}15` }}>
          <StatusIcon size={20} color={meta.color} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-white truncate">{booking.court?.name || 'Court Booking'}</p>
          <p className="text-xs mt-0.5" style={{ color: B.muted }}>
            {booking.court?.academy?.name || ''}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <Calendar size={11} color={B.muted} />
            <span className="text-xs" style={{ color: B.muted }}>
              {formatDate(booking.bookingDate)} · {formatTime12(booking.startTime)}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className="text-xs font-black px-2 py-0.5 rounded-full" style={{ background: `${meta.color}20`, color: meta.color }}>
            {meta.label}
          </span>
          <span className="text-sm font-black" style={{ color: B.cyan }}>₹{booking.amount}</span>
        </div>
      </button>

      {expanded && (
        <div style={{ borderTop: `1px solid ${B.border}` }}>
          <div className="p-4 space-y-3">
            {/* Status desc */}
            <div className="rounded-xl p-3 flex items-center gap-2" style={{ background: `${meta.color}10` }}>
              <StatusIcon size={14} color={meta.color} />
              <p className="text-xs font-bold" style={{ color: meta.color }}>{meta.desc}</p>
            </div>

            {/* Details */}
            <div className="rounded-xl p-3 space-y-2" style={{ background: B.card2 }}>
              {[
                { label: 'Academy', value: booking.court?.academy?.name },
                { label: 'Court', value: booking.court?.name },
                { label: 'Sport', value: booking.court?.sport },
                { label: 'Date', value: formatDate(booking.bookingDate) },
                { label: 'Time', value: `${formatTime12(booking.startTime)} – ${formatTime12(booking.endTime)}` },
                { label: 'Duration', value: `${booking.durationMinutes} min` },
                { label: 'Amount', value: `₹${booking.amount}`, color: B.cyan },
              ].filter(r => r.value).map(r => (
                <div key={r.label} className="flex justify-between">
                  <span className="text-xs" style={{ color: B.muted }}>{r.label}</span>
                  <span className="text-xs font-black" style={{ color: r.color || 'white' }}>{r.value}</span>
                </div>
              ))}
            </div>

            {/* Academy contact */}
            {booking.court?.academy?.phone && (
              <a href={`tel:${booking.court.academy.phone}`}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                style={{ background: `${B.green}10`, border: `1px solid ${B.green}20` }}>
                <Phone size={14} color={B.green} />
                <div className="flex-1">
                  <p className="text-xs font-bold text-white">{booking.court.academy.phone}</p>
                  <p className="text-xs" style={{ color: B.muted }}>Call Academy</p>
                </div>
              </a>
            )}

            {/* Payment screenshot */}
            {booking.paymentScreenshot && (
              <div>
                <p className="text-xs font-black mb-1.5" style={{ color: B.muted }}>PAYMENT SCREENSHOT</p>
                <a href={booking.paymentScreenshot} target="_blank" rel="noreferrer">
                  <img src={booking.paymentScreenshot} alt="Payment" className="w-full rounded-xl object-cover" style={{ maxHeight: 160 }} />
                </a>
              </div>
            )}

            {/* Rejection reason */}
            {booking.status === 'rejected' && booking.rejectionReason && (
              <div className="rounded-xl p-3" style={{ background: `${B.red}10`, border: `1px solid ${B.red}20` }}>
                <p className="text-xs font-black mb-1" style={{ color: B.red }}>REASON</p>
                <p className="text-sm text-white">{booking.rejectionReason}</p>
              </div>
            )}

            {/* Notes */}
            {booking.notes && (
              <div>
                <p className="text-xs font-black mb-1" style={{ color: B.muted }}>YOUR NOTES</p>
                <p className="text-sm text-white">{booking.notes}</p>
              </div>
            )}

            {/* Cancel */}
            {canCancel && (
              <button
                onClick={() => onCancel(booking.id)}
                disabled={cancelling === booking.id}
                className="w-full py-3 rounded-xl text-sm font-black"
                style={{ background: `${B.red}10`, color: B.red, border: `1px solid ${B.red}20` }}
              >
                {cancelling === booking.id ? 'Cancelling…' : 'Cancel Booking'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MyBookingsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('upcoming');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);
  const [toast, setToast] = useState({ msg: '', type: 'success' });

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '' }), 3000);
  }

  useEffect(() => { loadBookings(); }, [tab]);

  async function loadBookings() {
    try {
      setLoading(true);
      const params = tab === 'upcoming' ? { upcoming: 'true' } : {};
      const res = await api.get('/court-bookings/my', { params });
      setBookings(res.data.data.bookings);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to load bookings', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(bookingId) {
    try {
      setCancelling(bookingId);
      await api.post(`/court-bookings/${bookingId}/cancel`);
      showToast('Booking cancelled');
      loadBookings();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to cancel', 'error');
    } finally {
      setCancelling(null);
    }
  }

  const pending = bookings.filter(b => b.status === 'pending').length;
  const confirmed = bookings.filter(b => b.status === 'confirmed').length;

  return (
    <div style={{ minHeight: '100vh', background: B.bg, paddingBottom: 40 }}>
      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: '' })} />

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: B.card, border: `1px solid ${B.border}` }}>
          <ArrowLeft size={16} color={B.text} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-black text-white">My Bookings</h1>
          {!loading && <p className="text-xs" style={{ color: B.muted }}>
            {confirmed > 0 ? `${confirmed} confirmed` : pending > 0 ? `${pending} pending` : 'Court bookings'}
          </p>}
        </div>
        <button onClick={() => navigate('/academies')}
          className="px-3 py-2 rounded-xl text-xs font-black"
          style={{ background: `${B.cyan}15`, color: B.cyan, border: `1px solid ${B.cyan}30` }}>
          + Book
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 mb-4">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex-1 py-2.5 rounded-xl text-xs font-black"
            style={{
              background: tab === t.key ? `${B.cyan}20` : B.card,
              color: tab === t.key ? B.cyan : B.muted,
              border: `1px solid ${tab === t.key ? B.cyan + '40' : B.border}`
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(0,212,255,0.15)', borderTopColor: B.cyan, animation: 'spin 0.7s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center py-20 gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl" style={{ background: B.card }}>🏸</div>
            <p className="text-white font-black">No bookings yet</p>
            <p className="text-xs text-center" style={{ color: B.muted }}>
              {tab === 'upcoming' ? 'No upcoming court bookings' : 'Book a court to get started'}
            </p>
            <button
              onClick={() => navigate('/academies')}
              className="px-6 py-3 rounded-xl font-black text-sm"
              style={{ background: `linear-gradient(135deg, ${B.cyan}, #0099bb)`, color: '#000' }}
            >
              Find an Academy
            </button>
          </div>
        ) : (
          bookings.map(b => (
            <BookingCard
              key={b.id}
              booking={b}
              onCancel={handleCancel}
              cancelling={cancelling}
            />
          ))
        )}
      </div>
    </div>
  );
}
