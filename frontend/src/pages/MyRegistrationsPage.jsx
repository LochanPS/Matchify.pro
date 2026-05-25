import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registrationAPI } from '../api/registration';
import { Loader, Calendar, MapPin, Users, CreditCard, XCircle, Trophy, ArrowRight, ArrowLeft, X, CheckCircle, AlertTriangle, Upload, QrCode, Clock } from 'lucide-react';
import { formatDateIndian } from '../utils/dateFormat';
import { getGenderLabel } from '../utils/genderLabel';
import { TrophyIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import RefundDetailsModal from '../components/RefundDetailsModal';
import LoadingScreen from '../components/LoadingScreen';
import Spinner from '../components/Spinner';

export default function MyRegistrationsPage() {
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [cancelling, setCancelling] = useState(null);
  const [cancelModal, setCancelModal] = useState(null); // { id, tournamentName, amount }
  const [cancelForm, setCancelForm] = useState({ reason: '', upiId: '', qrCode: null });
  const [cancelFormErrors, setCancelFormErrors] = useState({});
  const [resultModal, setResultModal] = useState(null); // { type: 'success' | 'error', message, refundAmount }
  const [showRefundDetailsModal, setShowRefundDetailsModal] = useState(null); // registration object
  const qrCodeInputRef = useRef(null);

  useEffect(() => {
    fetchRegistrations();
  }, [filter]);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const statusFilter = filter === 'all' ? null : filter;
      const response = await registrationAPI.getMyRegistrations(statusFilter);
      setRegistrations(response.registrations || []);
    } catch (err) {
      console.error('Error fetching registrations:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCancelModal = (registration) => {
    setCancelModal({
      id: registration.id,
      tournamentName: registration.tournament.name,
      amount: registration.amountTotal
    });
    setCancelForm({ reason: '', upiId: '', qrCode: null });
    setCancelFormErrors({});
  };

  const validateCancelForm = () => {
    const errors = {};
    if (!cancelForm.reason || cancelForm.reason.trim().length < 10) {
      errors.reason = 'Please provide a detailed reason (at least 10 characters)';
    }
    if (!cancelForm.upiId || cancelForm.upiId.trim().length < 5) {
      errors.upiId = 'Please provide a valid UPI ID';
    }
    setCancelFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleQrCodeChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setCancelFormErrors(prev => ({ ...prev, qrCode: 'Please upload an image file' }));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setCancelFormErrors(prev => ({ ...prev, qrCode: 'File size must be less than 5MB' }));
        return;
      }
      setCancelForm(prev => ({ ...prev, qrCode: file }));
      setCancelFormErrors(prev => ({ ...prev, qrCode: null }));
    }
  };

  const handleCancelRegistration = async () => {
    if (!cancelModal) return;
    if (!validateCancelForm()) return;

    try {
      setCancelling(cancelModal.id);
      
      const formData = new FormData();
      formData.append('reason', cancelForm.reason.trim());
      formData.append('upiId', cancelForm.upiId.trim());
      if (cancelForm.qrCode) {
        formData.append('refundQrCode', cancelForm.qrCode);
      }

      console.log('Submitting cancellation request:', {
        id: cancelModal.id,
        reason: cancelForm.reason.trim(),
        upiId: cancelForm.upiId.trim(),
        hasQrCode: !!cancelForm.qrCode
      });

      const response = await registrationAPI.cancelRegistrationWithDetails(cancelModal.id, formData);
      
      console.log('Cancellation response:', response);
      
      setCancelModal(null);
      setResultModal({
        type: 'success',
        message: 'Cancellation request submitted! The organizer will review your request and process the refund.',
        refundAmount: response.refundAmount
      });
      fetchRegistrations();
    } catch (err) {
      console.error('Error cancelling registration:', err);
      setCancelModal(null);
      setResultModal({
        type: 'error',
        message: err.response?.data?.error || err.response?.data?.details || 'Failed to submit cancellation request'
      });
    } finally {
      setCancelling(null);
    }
  };

  const getStatusStyle = (status) => {
    const styles = {
      confirmed: { bg: 'bg-green-500/20', text: 'text-green-300', label: 'Confirmed' },
      pending: { bg: 'bg-amber-500/20', text: 'text-amber-300', label: 'Pending' },
      rejected: { bg: 'bg-red-500/20', text: 'text-red-300', label: 'Rejected - Refund Pending' },
      cancelled: { bg: 'bg-red-500/20', text: 'text-red-300', label: 'Cancelled' },
      cancellation_requested: { bg: 'bg-orange-500/20', text: 'text-orange-300', label: 'Cancellation Requested' },
    };
    return styles[status] || { bg: 'bg-gray-500/20', text: 'text-gray-300', label: status };
  };

  const getPaymentStyle = (status) => {
    const styles = {
      completed: { bg: 'bg-green-500/20', text: 'text-green-300' },
      pending: { bg: 'bg-amber-500/20', text: 'text-amber-300' },
      submitted: { bg: 'bg-blue-500/20', text: 'text-blue-300' },
      failed: { bg: 'bg-red-500/20', text: 'text-red-300' },
      refunded: { bg: 'bg-blue-500/20', text: 'text-blue-300' },
    };
    return styles[status] || { bg: 'bg-gray-500/20', text: 'text-gray-300' };
  };

  if (loading) {
    return <LoadingScreen message="Loading registrations..." />;
  }

  const filterTabs = [
    { key: 'all', label: 'All' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'pending', label: 'Pending' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#050810' }}>
      {/* Background orbs */}
      <div className="fixed top-0 bottom-0 pointer-events-none overflow-hidden" style={{ left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "480px" }}>
        <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full blur-3xl opacity-[0.06]" style={{ background: '#F59E0B' }} />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full blur-3xl opacity-[0.05]" style={{ background: '#a855f7' }} />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-20 border-b backdrop-blur-xl px-4 py-4" style={{ background: 'rgba(7,7,26,0.95)', borderColor: 'rgba(245,158,11,0.12)' }}>
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5">
            <ArrowLeft className="w-5 h-5" style={{ color: '#F59E0B' }} />
            <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>Back</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#F59E0B,#FCD34D)', boxShadow: '0 0 16px rgba(245,158,11,0.25)' }}>
              <Trophy className="w-5 h-5" style={{ color: '#050810' }} />
            </div>
            <div>
              <h1 className="text-base font-black text-white">My Registrations</h1>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>View and manage your tournament registrations</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-2xl mx-auto px-4 py-6">
        {/* Filter Tabs */}
        <div className="rounded-2xl p-2 mb-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex gap-2">
            {filterTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className="flex-1 px-4 py-2.5 text-sm font-bold rounded-xl transition-all"
                style={
                  filter === tab.key
                    ? { background: 'linear-gradient(135deg,#F59E0B,#FCD34D)', color: '#050810', boxShadow: '0 4px 15px rgba(245,158,11,0.25)' }
                    : { color: 'rgba(255,255,255,0.5)', background: 'transparent' }
                }
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Registrations List */}
        {registrations.length === 0 ? (
          <div className="rounded-2xl p-12 text-center border" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <Trophy className="w-8 h-8" style={{ color: '#F59E0B' }} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No registrations found</h3>
            <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.6)' }}>You haven't registered for any tournaments yet</p>
            <button
              onClick={() => navigate('/tournaments')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm"
              style={{ background: 'linear-gradient(135deg,#F59E0B,#FCD34D)', color: '#050810' }}
            >
              Browse Tournaments
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {registrations.map((registration) => {
              const statusStyle = getStatusStyle(registration.status);
              const paymentStyle = getPaymentStyle(registration.paymentStatus);
              
              return (
                <div
                  key={registration.id}
                  className="rounded-2xl p-5 transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(245,158,11,0.25)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(245,158,11,0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Tournament Name */}
                      <Link
                        to={`/tournaments/${registration.tournament.id}`}
                        className="text-base font-bold text-white mb-3 block truncate transition-colors"
                        onMouseEnter={(e) => e.currentTarget.style.color = '#F59E0B'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#ffffff'}
                      >
                        {registration.tournament.name}
                      </Link>

                      {/* Tournament Details */}
                      <div className="flex flex-wrap gap-3 text-sm mb-3" style={{ color: 'rgba(255,255,255,0.6)' }}>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)' }}>
                            <MapPin className="h-4 w-4 text-purple-400" />
                          </div>
                          <span className="text-xs truncate">{registration.tournament.city}, {registration.tournament.state}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}>
                            <Calendar className="h-4 w-4 text-blue-400" />
                          </div>
                          <span className="text-xs">{formatDateIndian(registration.tournament.startDate)}</span>
                        </div>
                      </div>

                      {/* Category */}
                      <div className="mb-3">
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                          <span className="font-bold text-white text-sm">{registration.category.name}</span>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.12)', color: '#FCD34D', border: '1px solid rgba(245,158,11,0.25)' }}>
                            {registration.category.format} • {getGenderLabel(registration.category.gender)}
                          </span>
                        </span>
                      </div>

                      {/* Partner Info */}
                      {registration.category.format === 'doubles' && (
                        <div className="mb-3 p-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <p className="text-xs font-bold mb-1.5" style={{ color: 'rgba(255,255,255,0.75)' }}>Doubles Partner</p>
                          {registration.guestPartnerName && (
                            <div className="flex items-center gap-1.5" style={{ color: '#a855f7' }}>
                              <Users className="h-4 w-4" />
                              <span className="text-xs font-semibold">{registration.guestPartnerName}</span>
                              <span className="ml-1 text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(168,85,247,0.12)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.25)' }}>Name Only</span>
                            </div>
                          )}
                          {!registration.guestPartnerName && !registration.partnerConfirmed && registration.partnerEmail && (
                            <div className="flex items-center gap-1.5" style={{ color: '#fbbf24' }}>
                              <span>⏳</span>
                              <span className="text-xs">Waiting for {registration.partnerEmail} to accept</span>
                            </div>
                          )}
                          {!registration.guestPartnerName && registration.partnerConfirmed && registration.partner && (
                            <div className="flex items-center gap-1.5" style={{ color: '#F59E0B' }}>
                              <Users className="h-4 w-4" />
                              <span className="text-xs font-semibold">{registration.partner.name}</span>
                              <span className="ml-1 text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.12)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.25)' }}>Confirmed</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Payment Details */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
                          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>Amount:</span>
                          <span className="font-bold text-white text-sm">₹{registration.amountTotal}</span>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${paymentStyle.bg} ${paymentStyle.text}`}>
                          {registration.paymentStatus}
                        </span>
                      </div>
                    </div>

                    {/* Status and Actions */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${statusStyle.bg} ${statusStyle.text}`}>
                        {statusStyle.label}
                      </span>

                      {(registration.status === 'confirmed' || registration.status === 'pending') && (
                        <button
                          onClick={() => openCancelModal(registration)}
                          disabled={cancelling === registration.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl transition-colors disabled:opacity-50"
                          style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}
                        >
                          {cancelling === registration.id ? (
                            <Spinner size="xs" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5" />
                          )}
                          {cancelling === registration.id ? 'Cancelling...' : 'Cancel'}
                        </button>
                      )}

                      {/* Show "Submit Refund Details" button for rejected registrations without refund details */}
                      {registration.status === 'rejected' && !registration.refundUpiId && (
                        <button
                          onClick={() => setShowRefundDetailsModal(registration)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl font-bold"
                          style={{ color: '#F59E0B', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}
                        >
                          <Upload className="h-3.5 w-3.5" />
                          Submit Refund Details
                        </button>
                      )}

                      {/* Show status for rejected registrations with refund details submitted */}
                      {registration.status === 'rejected' && registration.refundUpiId && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl" style={{ color: '#F59E0B', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
                          <CheckCircle className="h-3.5 w-3.5" />
                          Refund Details Submitted
                        </div>
                      )}

                      <button
                        onClick={() => navigate(`/tournaments/${registration.tournament.id}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl font-bold"
                        style={{ color: '#F59E0B', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}
                      >
                        View Tournament
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Refund Info */}
                  {registration.status === 'cancelled' && registration.refundAmount > 0 && (
                    <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
                        Refund: <span className="font-bold" style={{ color: '#F59E0B' }}>₹{registration.refundAmount}</span>
                        {' • '}
                        Status: <span className="font-bold text-white">{registration.refundStatus}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancel Registration Modal */}
      {cancelModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="rounded-2xl shadow-2xl max-w-lg w-full my-8 overflow-hidden" style={{ background: '#0d1025', border: '1px solid rgba(255,255,255,0.1)' }}>
            {/* Header */}
            <div className="p-5 flex items-center justify-between gap-3" style={{ background: 'rgba(239,68,68,0.12)', borderBottom: '1px solid rgba(239,68,68,0.2)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.2)' }}>
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Request Cancellation & Refund</h2>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>Refund Amount: ₹{cancelModal.amount}</p>
                </div>
              </div>
              <button
                onClick={() => setCancelModal(null)}
                disabled={cancelling}
                className="w-9 h-9 rounded-xl flex items-center justify-center disabled:opacity-50"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5">
              <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.7)' }}>
                You are requesting to cancel your registration for <span className="font-semibold text-white">"{cancelModal.tournamentName}"</span>.
              </p>

              <div className="rounded-xl p-3.5 mb-5" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)' }}>
                <p className="text-sm" style={{ color: '#fbbf24' }}>
                  <strong>Note:</strong> The organizer will review your request and verify your payment before processing the refund.
                </p>
              </div>

              {/* Reason */}
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.75)' }}>
                  Reason for Cancellation <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={cancelForm.reason}
                  onChange={(e) => setCancelForm(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Please explain why you want to cancel..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all"
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: `1px solid ${cancelFormErrors.reason ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
                    color: '#fff',
                  }}
                />
                {cancelFormErrors.reason && <p className="text-red-400 text-xs mt-1">{cancelFormErrors.reason}</p>}
              </div>

              {/* UPI ID */}
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.75)' }}>
                  Your UPI ID for Refund <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={cancelForm.upiId}
                  onChange={(e) => setCancelForm(prev => ({ ...prev, upiId: e.target.value }))}
                  placeholder="e.g., yourname@upi, 9876543210@paytm"
                  className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: `1px solid ${cancelFormErrors.upiId ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
                  }}
                />
                {cancelFormErrors.upiId && <p className="text-red-400 text-xs mt-1">{cancelFormErrors.upiId}</p>}
              </div>

              {/* QR Code Upload */}
              <div className="mb-5">
                <label className="block text-sm font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.75)' }}>
                  Payment QR Code (Optional)
                </label>
                <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Upload your UPI QR code to help the organizer send the refund faster
                </p>
                <input type="file" ref={qrCodeInputRef} onChange={handleQrCodeChange} accept="image/*" className="hidden" />
                <button
                  type="button"
                  onClick={() => qrCodeInputRef.current?.click()}
                  className="w-full px-4 py-4 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-all"
                  style={cancelForm.qrCode
                    ? { borderColor: 'rgba(245,158,11,0.4)', background: 'rgba(245,158,11,0.06)' }
                    : { borderColor: 'rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.15)' }}
                >
                  {cancelForm.qrCode ? (
                    <>
                      <CheckCircle className="h-7 w-7" style={{ color: '#F59E0B' }} />
                      <span className="text-sm font-medium" style={{ color: '#F59E0B' }}>{cancelForm.qrCode.name}</span>
                      <span className="text-xs" style={{ color: 'rgba(245,158,11,0.7)' }}>Click to change</span>
                    </>
                  ) : (
                    <>
                      <QrCode className="h-7 w-7" style={{ color: 'rgba(255,255,255,0.3)' }} />
                      <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>Upload QR Code</span>
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>PNG, JPG up to 5MB</span>
                    </>
                  )}
                </button>
                {cancelFormErrors.qrCode && <p className="text-red-400 text-xs mt-1">{cancelFormErrors.qrCode}</p>}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setCancelModal(null)}
                  disabled={cancelling}
                  className="flex-1 px-4 py-3 rounded-xl font-semibold text-sm disabled:opacity-50"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.75)' }}
                >
                  Keep Registration
                </button>
                <button
                  onClick={handleCancelRegistration}
                  disabled={cancelling}
                  className="flex-1 px-4 py-3 rounded-xl font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff' }}
                >
                  {cancelling ? <><Spinner size="sm" />Submitting...</> : 'Submit Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Result Modal */}
      {resultModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl shadow-2xl max-w-md w-full overflow-hidden" style={{ background: '#0d1025', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="p-5 flex items-center gap-3" style={{
              background: resultModal.type === 'success' ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.1)',
              borderBottom: `1px solid ${resultModal.type === 'success' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)'}`,
            }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: resultModal.type === 'success' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)' }}>
                {resultModal.type === 'success'
                  ? <Clock className="h-5 w-5" style={{ color: '#F59E0B' }} />
                  : <X className="h-5 w-5 text-red-400" />}
              </div>
              <h2 className="text-base font-bold text-white">
                {resultModal.type === 'success' ? 'Request Submitted' : 'Error'}
              </h2>
            </div>

            <div className="p-5">
              <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.7)' }}>{resultModal.message}</p>

              {resultModal.type === 'success' && resultModal.refundAmount > 0 && (
                <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)' }}>
                  <p className="font-medium" style={{ color: '#fbbf24' }}>
                    Refund Amount: <span className="text-lg font-bold">₹{resultModal.refundAmount}</span>
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'rgba(251,191,36,0.7)' }}>
                    The organizer will review your request and process the refund to your UPI ID.
                  </p>
                </div>
              )}

              <button
                onClick={() => setResultModal(null)}
                className="w-full px-4 py-3 rounded-xl font-semibold text-sm"
                style={resultModal.type === 'success'
                  ? { background: 'linear-gradient(135deg,#F59E0B,#FCD34D)', color: '#050810' }
                  : { background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Details Modal */}
      {showRefundDetailsModal && (
        <RefundDetailsModal
          registration={showRefundDetailsModal}
          onClose={() => setShowRefundDetailsModal(null)}
          onSuccess={fetchRegistrations}
        />
      )}
    </div>
  );
}

