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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 mt-4 font-medium">Loading registrations...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/70 hover:text-white mb-6 transition-colors group"
          >
            <ArrowLeftIcon className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 via-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-orange-500/30">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">My Registrations</h1>
              <p className="text-white/60">View and manage your tournament registrations</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-6">
        {/* Filter Tabs */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl shadow-xl p-2 mb-8">
          <div className="flex gap-2">
            {filterTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex-1 px-6 py-3.5 text-sm font-semibold rounded-xl transition-all ${
                  filter === tab.key
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Registrations List */}
        {registrations.length === 0 ? (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl shadow-xl shadow-gray-200/50 border border-white/10 p-16 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <TrophyIcon className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No registrations found</h3>
            <p className="text-gray-500 mb-6">You haven't registered for any tournaments yet</p>
            <button
              onClick={() => navigate('/tournaments')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all"
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
                  className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl shadow-sm border border-white/10 p-6 hover:shadow-xl hover:border-gray-200 transition-all"
                >
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1">
                      {/* Tournament Name */}
                      <Link 
                        to={`/tournaments/${registration.tournament.id}`}
                        className="text-xl font-bold text-white mb-3 hover:text-purple-600 transition-colors block"
                      >
                        {registration.tournament.name}
                      </Link>

                      {/* Tournament Details */}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-purple-500/20 border border-purple-500/30 rounded-lg flex items-center justify-center">
                            <MapPin className="h-4 w-4 text-purple-400" />
                          </div>
                          <span>{registration.tournament.city}, {registration.tournament.state}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-500/20 border border-blue-500/30 rounded-lg flex items-center justify-center">
                            <Calendar className="h-4 w-4 text-blue-400" />
                          </div>
                          <span>{formatDateIndian(registration.tournament.startDate)}</span>
                        </div>
                      </div>

                      {/* Category */}
                      <div className="mb-4">
                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700/50 border border-white/10 rounded-xl">
                          <span className="font-semibold text-white">{registration.category.name}</span>
                          <span className="text-xs text-purple-300 bg-purple-500/20 border border-purple-500/30 px-2 py-0.5 rounded-full">
                            {registration.category.format} • {registration.category.gender}
                          </span>
                        </span>
                      </div>

                      {/* Partner Info */}
                      {registration.category.format === 'doubles' && (
                        <div className="mb-4 p-4 bg-slate-700/30 rounded-xl border border-white/10">
                          <p className="text-sm font-semibold text-gray-300 mb-2">Doubles Partner</p>
                          {!registration.partnerConfirmed && registration.partnerEmail && (
                            <div className="flex items-center text-amber-400">
                              <span className="mr-2">⏳</span>
                              <span className="text-sm">Waiting for {registration.partnerEmail} to accept</span>
                            </div>
                          )}
                          {registration.partnerConfirmed && registration.partner && (
                            <div className="flex items-center text-green-400">
                              <Users className="h-4 w-4 mr-2" />
                              <span className="text-sm font-medium">{registration.partner.name}</span>
                              <span className="ml-2 text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full border border-green-500/30">Confirmed</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Payment Details */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-400">Amount:</span>
                          <span className="font-bold text-white">₹{registration.amountTotal}</span>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${paymentStyle.bg} ${paymentStyle.text}`}>
                          {registration.paymentStatus}
                        </span>
                      </div>
                    </div>

                    {/* Status and Actions */}
                    <div className="flex flex-col items-end gap-3">
                      <span className={`px-4 py-2 rounded-xl text-sm font-semibold ${statusStyle.bg} ${statusStyle.text}`}>
                        {statusStyle.label}
                      </span>

                      {(registration.status === 'confirmed' || registration.status === 'pending') && (
                        <button
                          onClick={() => openCancelModal(registration)}
                          disabled={cancelling === registration.id}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-colors disabled:opacity-50 border border-red-500/30"
                        >
                          {cancelling === registration.id ? (
                            <Loader className="h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                          {cancelling === registration.id ? 'Cancelling...' : 'Cancel'}
                        </button>
                      )}

                      <button
                        onClick={() => navigate(`/tournaments/${registration.tournament.id}`)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-purple-400 hover:bg-purple-500/10 rounded-xl transition-colors font-medium border border-purple-500/30"
                      >
                        View Tournament
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Refund Info */}
                  {registration.status === 'cancelled' && registration.refundAmount > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <div className="text-sm text-gray-400">
                        Refund: <span className="font-semibold text-green-400">₹{registration.refundAmount}</span>
                        {' • '}
                        Status: <span className="font-semibold text-gray-300">{registration.refundStatus}</span>
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
