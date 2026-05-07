import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registrationAPI } from '../api/registration';
import { Loader, Calendar, MapPin, Users, CreditCard, XCircle, Trophy, ArrowRight, ArrowLeft, X, CheckCircle, AlertTriangle, Upload, QrCode, Clock } from 'lucide-react';
import { formatDateIndian } from '../utils/dateFormat';
import { TrophyIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

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
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #0a0a1f 0%, #07071a 50%, #0a0a1f 100%)' }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 rounded-full animate-spin mx-auto" style={{ borderColor: 'rgba(16,185,129,0.3)', borderTopColor: '#10b981' }}></div>
          <p className="text-gray-400 mt-4 font-medium">Loading registrations...</p>
        </div>
      </div>
    );
  }

  const filterTabs = [
    { key: 'all', label: 'All' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'pending', label: 'Pending' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #0a0a1f 0%, #07071a 50%, #0a0a1f 100%)' }}>
      {/* Hero Header - EMERALD THEME */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(6,182,212,0.1) 100%)' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-10" style={{ background: 'radial-gradient(circle, #10b981, transparent)' }}></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-10" style={{ background: 'radial-gradient(circle, #06b6d4, transparent)' }}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 mb-4 transition-colors group" style={{ color: 'rgba(255,255,255,0.6)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
          >
            <ArrowLeftIcon className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl" style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 8px 25px rgba(16,185,129,0.3)' }}>
              <Trophy className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">My Registrations</h1>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>View and manage your tournament registrations</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filter Tabs - EMERALD THEME */}
        <div className="rounded-2xl shadow-xl p-2 mb-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex gap-2">
            {filterTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className="flex-1 px-4 py-3 text-sm font-bold rounded-xl transition-all"
                style={
                  filter === tab.key
                    ? { background: 'linear-gradient(135deg,#10b981,#059669)', color: '#ffffff', boxShadow: '0 4px 15px rgba(16,185,129,0.3)' }
                    : { color: 'rgba(255,255,255,0.5)', background: 'transparent' }
                }
                onMouseEnter={(e) => {
                  if (filter !== tab.key) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.color = '#ffffff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (filter !== tab.key) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
                  }
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Registrations List */}
        {registrations.length === 0 ? (
          <div className="rounded-2xl shadow-xl p-12 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5" style={{ background: 'rgba(16,185,129,0.1)', border: '2px solid rgba(16,185,129,0.2)' }}>
              <TrophyIcon className="w-10 h-10 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No registrations found</h3>
            <p className="text-gray-400 mb-6 text-sm">You haven't registered for any tournaments yet</p>
            <button
              onClick={() => navigate('/tournaments')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all text-sm"
              style={{ background: 'linear-gradient(135deg,#10b981,#059669)', color: '#ffffff', boxShadow: '0 4px 15px rgba(16,185,129,0.3)' }}
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
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(16,185,129,0.3)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(16,185,129,0.1)';
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
                        className="text-lg font-bold text-white mb-3 hover:text-emerald-400 transition-colors block truncate"
                      >
                        {registration.tournament.name}
                      </Link>

                      {/* Tournament Details */}
                      <div className="flex flex-wrap gap-3 text-sm text-gray-400 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)' }}>
                            <MapPin className="h-4 w-4 text-purple-400" />
                          </div>
                          <span className="text-xs">{registration.tournament.city}, {registration.tournament.state}</span>
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
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                          <span className="font-bold text-white text-sm">{registration.category.name}</span>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(6,182,212,0.2)', color: '#22d3ee', border: '1px solid rgba(6,182,212,0.3)' }}>
                            {registration.category.format} • {registration.category.gender}
                          </span>
                        </span>
                      </div>

                      {/* Partner Info */}
                      {registration.category.format === 'doubles' && (
                        <div className="mb-3 p-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <p className="text-xs font-bold text-gray-300 mb-1.5">Doubles Partner</p>
                          {!registration.partnerConfirmed && registration.partnerEmail && (
                            <div className="flex items-center text-amber-400">
                              <span className="mr-2">⏳</span>
                              <span className="text-xs">Waiting for {registration.partnerEmail} to accept</span>
                            </div>
                          )}
                          {registration.partnerConfirmed && registration.partner && (
                            <div className="flex items-center text-emerald-400">
                              <Users className="h-4 w-4 mr-2" />
                              <span className="text-xs font-semibold">{registration.partner.name}</span>
                              <span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.2)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>Confirmed</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Payment Details */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-400 text-xs">Amount:</span>
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
                            <Loader className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5" />
                          )}
                          {cancelling === registration.id ? 'Cancelling...' : 'Cancel'}
                        </button>
                      )}

                      <button
                        onClick={() => navigate(`/tournaments/${registration.tournament.id}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl transition-colors font-bold"
                        style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}
                      >
                        View Tournament
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Refund Info */}
                  {registration.status === 'cancelled' && registration.refundAmount > 0 && (
                    <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <div className="text-xs text-gray-400">
                        Refund: <span className="font-bold text-emerald-400">₹{registration.refundAmount}</span>
                        {' • '}
                        Status: <span className="font-bold text-gray-300">{registration.refundStatus}</span>
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-800/90 backdrop-blur-sm border border-white/10 rounded-2xl shadow-2xl max-w-lg w-full my-8">
            <div className="bg-gradient-to-r from-red-500 to-rose-600 p-6 text-white">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Request Cancellation & Refund</h2>
                    <p className="text-red-100 text-sm mt-1">Refund Amount: ₹{cancelModal.amount}</p>
                  </div>
                </div>
                <button
                  onClick={() => setCancelModal(null)}
                  disabled={cancelling}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors disabled:opacity-50"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-300 mb-4">
                You are requesting to cancel your registration for <span className="font-semibold text-white">"{cancelModal.tournamentName}"</span>.
              </p>
              
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
                <p className="text-amber-300 text-sm">
                  <strong>Note:</strong> The organizer will review your request and verify your payment before processing the refund.
                </p>
              </div>

              {/* Reason for Cancellation */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Reason for Cancellation <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={cancelForm.reason}
                  onChange={(e) => setCancelForm(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Please explain why you want to cancel (e.g., health issues, schedule conflict, etc.)"
                  rows={3}
                  className={`w-full px-4 py-3 bg-slate-700/50 border rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all ${
                    cancelFormErrors.reason ? 'border-red-500' : 'border-white/10'
                  }`}
                />
                {cancelFormErrors.reason && (
                  <p className="text-red-400 text-sm mt-1">{cancelFormErrors.reason}</p>
                )}
              </div>

              {/* UPI ID */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Your UPI ID for Refund <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={cancelForm.upiId}
                  onChange={(e) => setCancelForm(prev => ({ ...prev, upiId: e.target.value }))}
                  placeholder="e.g., yourname@upi, 9876543210@paytm"
                  className={`w-full px-4 py-3 bg-slate-700/50 border rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all ${
                    cancelFormErrors.upiId ? 'border-red-500' : 'border-white/10'
                  }`}
                />
                {cancelFormErrors.upiId && (
                  <p className="text-red-400 text-sm mt-1">{cancelFormErrors.upiId}</p>
                )}
              </div>

              {/* QR Code Upload */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Your Payment QR Code (Optional)
                </label>
                <p className="text-gray-500 text-sm mb-2">
                  Upload your UPI QR code to help the organizer send the refund faster
                </p>
                <input
                  type="file"
                  ref={qrCodeInputRef}
                  onChange={handleQrCodeChange}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => qrCodeInputRef.current?.click()}
                  className={`w-full px-4 py-4 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-all ${
                    cancelForm.qrCode 
                      ? 'border-green-500/50 bg-green-500/10' 
                      : 'border-white/20 hover:border-white/30 hover:bg-slate-700/30'
                  }`}
                >
                  {cancelForm.qrCode ? (
                    <>
                      <CheckCircle className="h-8 w-8 text-green-400" />
                      <span className="text-green-300 font-medium">{cancelForm.qrCode.name}</span>
                      <span className="text-green-400/80 text-sm">Click to change</span>
                    </>
                  ) : (
                    <>
                      <QrCode className="h-8 w-8 text-gray-500" />
                      <span className="text-gray-400 font-medium">Upload QR Code</span>
                      <span className="text-gray-500 text-sm">PNG, JPG up to 5MB</span>
                    </>
                  )}
                </button>
                {cancelFormErrors.qrCode && (
                  <p className="text-red-400 text-sm mt-1">{cancelFormErrors.qrCode}</p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setCancelModal(null)}
                  disabled={cancelling}
                  className="flex-1 px-4 py-3 border border-white/10 rounded-xl text-gray-300 hover:bg-slate-700/50 transition-colors font-medium disabled:opacity-50"
                >
                  Keep Registration
                </button>
                <button
                  onClick={handleCancelRegistration}
                  disabled={cancelling}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:shadow-lg hover:shadow-red-500/30 transition-all font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {cancelling ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Request'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Result Modal */}
      {resultModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className={`p-6 text-white ${resultModal.type === 'success' ? 'bg-gradient-to-r from-amber-500 to-orange-600' : 'bg-gradient-to-r from-red-500 to-rose-600'}`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  {resultModal.type === 'success' ? (
                    <Clock className="h-6 w-6" />
                  ) : (
                    <X className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold">
                    {resultModal.type === 'success' ? 'Request Submitted' : 'Error'}
                  </h2>
                </div>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-300 mb-4">{resultModal.message}</p>
              
              {resultModal.type === 'success' && resultModal.refundAmount > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-4">
                  <p className="text-amber-300 font-medium">
                    Refund Amount: <span className="text-lg font-bold">₹{resultModal.refundAmount}</span>
                  </p>
                  <p className="text-amber-400/80 text-sm mt-1">
                    The organizer will review your request and process the refund to your UPI ID.
                  </p>
                </div>
              )}

              <button
                onClick={() => setResultModal(null)}
                className={`w-full px-4 py-3 rounded-xl font-semibold transition-all ${
                  resultModal.type === 'success' 
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:shadow-lg hover:shadow-amber-500/30' 
                    : 'bg-gradient-to-r from-red-500 to-rose-600 text-white hover:shadow-lg hover:shadow-red-500/30'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
