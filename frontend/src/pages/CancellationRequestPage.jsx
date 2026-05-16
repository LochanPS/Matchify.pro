import { getErrorMessage } from '../utils/errorMessage';
import { getGenderLabel } from '../utils/genderLabel';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { approveRefund, rejectRefund } from '../api/organizer';
import { formatDateIndian } from '../utils/dateFormat';
import { ArrowLeft, User, Mail, Phone, MapPin, Calendar, CreditCard, QrCode, AlertTriangle, Check, X, Loader, Trophy } from 'lucide-react';

const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('/uploads')) {
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://matchify-probackend.vercel.app';
    return `${baseUrl}${url}`;
  }
  return url;
};

const BG = 'linear-gradient(180deg,#0a0a1f 0%,#07071a 50%,#0a0a1f 100%)';
const CARD = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px' };
const ROW = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px 16px' };

export default function CancellationRequestPage() {
  const { registrationId } = useParams();
  const navigate = useNavigate();
  const [registration, setRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [resultModal, setResultModal] = useState(null);

  useEffect(() => { fetchRegistration(); }, [registrationId]);

  const fetchRegistration = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/organizer/registrations/${registrationId}`);
      setRegistration(response.data.registration);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load cancellation request'));
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setActionLoading(true);
      await approveRefund(registrationId);
      setResultModal({ type: 'success', title: 'Refund Approved', message: `Refund of ₹${registration.refundAmount || registration.amountTotal} approved. Player will be notified.` });
    } catch (err) {
      setResultModal({ type: 'error', title: 'Error', message: err.response?.data?.error || 'Failed to approve refund' });
    } finally { setActionLoading(false); }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    try {
      setActionLoading(true);
      setShowRejectModal(false);
      await rejectRefund(registrationId, rejectReason);
      setResultModal({ type: 'success', title: 'Request Rejected', message: 'The refund request has been rejected. The player will be notified and their registration remains active.' });
    } catch (err) {
      setResultModal({ type: 'error', title: 'Error', message: err.response?.data?.error || 'Failed to reject refund' });
    } finally { setActionLoading(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: 'rgba(251,146,60,0.3)', borderTopColor: '#fb923c' }} />
          <p className="mt-4 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>Loading cancellation request...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: BG }}>
        <div className="rounded-2xl p-8 text-center w-full" style={{ maxWidth: '400px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <X className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-black text-white mb-2">Error</h2>
          <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.6)' }}>{error}</p>
          <button onClick={() => navigate('/organizer/dashboard')} className="px-6 py-2.5 rounded-xl font-bold text-sm" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.12)' }}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!registration) return null;

  return (
    <div className="min-h-screen relative" style={{ background: BG }}>
      <div className="fixed top-0 bottom-0 pointer-events-none overflow-hidden" style={{ left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "480px" }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-15" style={{ background: 'radial-gradient(circle,rgba(251,146,60,0.5) 0%,transparent 70%)' }} />
        <div className="absolute bottom-1/3 left-0 w-56 h-56 rounded-full blur-3xl opacity-10" style={{ background: 'radial-gradient(circle,rgba(239,68,68,0.5) 0%,transparent 70%)' }} />
      </div>

      {/* Sticky header */}
      <div className="sticky top-0 z-20" style={{ background: 'rgba(7,7,26,0.95)', borderBottom: '1px solid rgba(251,146,60,0.2)', backdropFilter: 'blur(20px)' }}>
        <div className="px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/organizer/dashboard')} className="flex items-center gap-1.5 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <span className="text-sm font-black text-white">Cancellation Request</span>
        </div>
      </div>

      <div className="relative px-4 py-5 space-y-4">

        {/* Tournament card */}
        <div style={CARD} className="overflow-hidden">
          <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(168,85,247,0.08)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg,#a855f7,#6366f1)' }}>
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-white truncate">{registration.tournament?.name}</p>
              <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {registration.category?.name} · {registration.category?.format} · {getGenderLabel(registration.category?.gender)}
              </p>
            </div>
          </div>

          {/* Player info */}
          <div className="p-4">
            <p className="text-xs font-black uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
              <User className="w-3.5 h-3.5" /> Player Information
            </p>
            <div className="space-y-2">
              {[
                { icon: User, label: 'Name', value: registration.user?.name },
                { icon: Mail, label: 'Email', value: registration.user?.email, mono: true },
                registration.user?.phone && { icon: Phone, label: 'Phone', value: registration.user?.phone },
                registration.user?.city && { icon: MapPin, label: 'Location', value: `${registration.user?.city}, ${registration.user?.state}` },
                { icon: Calendar, label: 'Registered', value: formatDateIndian(registration.createdAt) },
              ].filter(Boolean).map(({ icon: Icon, label, value, mono }) => (
                <div key={label} style={ROW} className="flex items-center gap-3">
                  <Icon className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.35)' }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</p>
                    <p className={`text-sm font-semibold text-white truncate ${mono ? 'font-mono' : ''}`}>{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cancellation reason */}
        <div style={CARD} className="overflow-hidden">
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'rgba(251,146,60,0.8)' }}>
              <AlertTriangle className="w-3.5 h-3.5" /> Cancellation Details
            </p>
          </div>
          <div className="p-4">
            <p className="text-xs font-medium mb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>Reason</p>
            <div className="rounded-xl p-3" style={{ background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.25)' }}>
              <p className="text-sm text-white">{registration.cancellationReason || 'No reason provided'}</p>
            </div>
          </div>
        </div>

        {/* Refund details */}
        <div style={CARD} className="overflow-hidden">
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'rgba(0,255,136,0.8)' }}>
              <CreditCard className="w-3.5 h-3.5" /> Refund Details
            </p>
          </div>
          <div className="p-4 space-y-3">
            {/* Amount + UPI side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl p-3" style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.25)' }}>
                <p className="text-xs mb-1" style={{ color: 'rgba(0,255,136,0.7)' }}>Refund Amount</p>
                <p className="text-xl font-black" style={{ color: '#00ff88' }}>₹{registration.refundAmount || registration.amountTotal}</p>
              </div>
              <div className="rounded-xl p-3" style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.25)' }}>
                <p className="text-xs mb-1" style={{ color: 'rgba(0,212,255,0.7)' }}>UPI ID</p>
                <p className="text-sm font-mono font-bold text-white truncate">{registration.refundUpiId || 'Not provided'}</p>
              </div>
            </div>

            {/* QR Code */}
            {registration.refundQrCode && (
              <div>
                <p className="text-xs font-medium mb-2 flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  <QrCode className="w-3.5 h-3.5" /> Player's QR Code
                </p>
                <div className="p-3 rounded-xl inline-block" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <img src={getImageUrl(registration.refundQrCode)} alt="Refund QR" className="max-w-[180px] rounded-lg" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        {registration.status === 'cancellation_requested' && (
          <div className="space-y-3">
            <button
              onClick={handleApprove}
              disabled={actionLoading}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-sm transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#00ff88,#00d4ff)', color: '#07071a', boxShadow: '0 4px 20px rgba(0,255,136,0.3)' }}
            >
              {actionLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
              Approve Refund
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={actionLoading}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-sm transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,rgba(239,68,68,0.2),rgba(220,38,38,0.15))', color: '#f87171', border: '2px solid rgba(239,68,68,0.4)' }}
            >
              <X className="w-5 h-5" /> Reject Request
            </button>
            <p className="text-center text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Player will be notified of your decision</p>
          </div>
        )}

        {/* Already processed states */}
        {registration.status === 'cancelled' && (
          <div className="rounded-2xl p-5 text-center" style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)' }}>
            <Check className="w-10 h-10 mx-auto mb-2" style={{ color: '#00ff88' }} />
            <p className="font-black text-white">Refund Approved ✓</p>
          </div>
        )}
        {registration.status === 'confirmed' && registration.refundStatus === 'rejected' && (
          <div className="rounded-2xl p-5 text-center" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <X className="w-10 h-10 mx-auto mb-2 text-red-400" />
            <p className="font-black text-white">Request Rejected</p>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full rounded-2xl overflow-hidden" style={{ maxWidth: '420px', background: 'linear-gradient(180deg,#0f0f2e,#0d1117)', border: '2px solid rgba(239,68,68,0.4)' }}>
            <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.1)' }}>
              <X className="w-5 h-5 text-red-400" />
              <div>
                <h2 className="text-base font-black text-white">Reject Refund Request</h2>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Provide a reason for rejection</p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  Reason <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="e.g., Tournament already started, policy not met..."
                  rows={4}
                  className="w-full rounded-xl px-4 py-3 text-sm text-white resize-none outline-none focus:ring-2"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', focusRingColor: '#ef4444' }}
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowRejectModal(false)} className="flex-1 py-3 rounded-xl font-bold text-sm" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectReason.trim() || actionLoading}
                  className="flex-1 py-3 rounded-xl font-black text-sm disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff' }}
                >
                  Confirm Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Result Modal */}
      {resultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full rounded-2xl overflow-hidden" style={{
            maxWidth: '400px',
            background: 'linear-gradient(180deg,#0f0f2e,#0d1117)',
            border: `2px solid ${resultModal.type === 'success' ? 'rgba(0,255,136,0.4)' : 'rgba(239,68,68,0.4)'}`,
          }}>
            <div className="p-5 text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: resultModal.type === 'success' ? 'rgba(0,255,136,0.15)' : 'rgba(239,68,68,0.15)' }}>
                {resultModal.type === 'success'
                  ? <Check className="w-8 h-8" style={{ color: '#00ff88' }} />
                  : <X className="w-8 h-8 text-red-400" />}
              </div>
              <h2 className="text-lg font-black text-white mb-2">{resultModal.title}</h2>
              <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.6)' }}>{resultModal.message}</p>
              <button
                onClick={() => { setResultModal(null); navigate('/organizer/dashboard'); }}
                className="w-full py-3 rounded-xl font-black text-sm"
                style={{
                  background: resultModal.type === 'success' ? 'linear-gradient(135deg,#00ff88,#00d4ff)' : 'linear-gradient(135deg,#ef4444,#dc2626)',
                  color: resultModal.type === 'success' ? '#07071a' : '#fff',
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
