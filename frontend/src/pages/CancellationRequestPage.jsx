import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { approveRefund, rejectRefund } from '../api/organizer';
import { formatDateIndian } from '../utils/dateFormat';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  QrCode,
  AlertTriangle,
  Check,
  X,
  Loader,
  Trophy,
} from 'lucide-react';

// Helper to get proper image URL
const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('/uploads')) {
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    return `${baseUrl}${url}`;
  }
  return url;
};

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

  useEffect(() => {
    fetchRegistration();
  }, [registrationId]);

  const fetchRegistration = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/organizer/registrations/${registrationId}`);
      setRegistration(response.data.registration);
    } catch (err) {
      console.error('Error fetching registration:', err);
      setError(err.response?.data?.error || 'Failed to load cancellation request');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setActionLoading(true);
      await approveRefund(registrationId);
      setResultModal({
        type: 'success',
        title: 'Refund Approved',
        message: `Refund of ₹${registration.refundAmount || registration.amountTotal} has been approved. The player will be notified.`
      });
    } catch (err) {
      console.error('Error approving refund:', err);
      setResultModal({
        type: 'error',
        title: 'Error',
        message: err.response?.data?.error || 'Failed to approve refund'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      return;
    }
    try {
      setActionLoading(true);
      setShowRejectModal(false);
      await rejectRefund(registrationId, rejectReason);
      setResultModal({
        type: 'success',
        title: 'Refund Rejected',
        message: 'The refund request has been rejected. The player will be notified and their registration will remain active.'
      });
    } catch (err) {
      console.error('Error rejecting refund:', err);
      setResultModal({
        type: 'error',
        title: 'Error',
        message: err.response?.data?.error || 'Failed to reject refund'
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 mt-4 font-medium">Loading cancellation request...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!registration) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-orange-600 via-red-600 to-rose-700 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/70 hover:text-white mb-6 transition-colors group"
          >
            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Cancellation Request</h1>
              <p className="text-white/70 mt-1">Review and process the refund request</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-6">
        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Tournament Info */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Trophy className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{registration.tournament?.name}</h2>
                <p className="text-gray-600">
                  {registration.category?.name} • {registration.category?.format} • {registration.category?.gender}
                </p>
              </div>
            </div>
          </div>

          {/* Player Info */}
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-gray-400" />
              Player Information
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-semibold text-gray-900">{registration.user?.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-semibold text-gray-900">{registration.user?.email}</p>
                </div>
              </div>
              {registration.user?.phone && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-semibold text-gray-900">{registration.user?.phone}</p>
                  </div>
                </div>
              )}
              {registration.user?.city && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-semibold text-gray-900">{registration.user?.city}, {registration.user?.state}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Cancellation Details */}
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Cancellation Details
            </h3>
            
            {/* Reason */}
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-500 mb-2">Reason for Cancellation</p>
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
                <p className="text-gray-800">{registration.cancellationReason || 'No reason provided'}</p>
              </div>
            </div>

            {/* Registration Date */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl mb-4">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Registered On</p>
                <p className="font-semibold text-gray-900">{formatDateIndian(registration.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Refund Details */}
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-green-500" />
              Refund Details
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {/* Refund Amount */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                <p className="text-sm text-green-600 mb-1">Refund Amount</p>
                <p className="text-3xl font-bold text-green-700">₹{registration.refundAmount || registration.amountTotal}</p>
              </div>
              
              {/* UPI ID */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-sm text-blue-600 mb-1">Player's UPI ID</p>
                <p className="text-xl font-mono font-bold text-blue-700">{registration.refundUpiId || 'Not provided'}</p>
              </div>
            </div>

            {/* QR Code */}
            {registration.refundQrCode && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                  <QrCode className="w-4 h-4" />
                  Player's Payment QR Code
                </p>
                <div className="p-4 bg-gray-50 rounded-xl inline-block">
                  <img
                    src={getImageUrl(registration.refundQrCode)}
                    alt="Refund QR Code"
                    className="max-w-xs rounded-lg shadow-md"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {registration.status === 'cancellation_requested' && (
            <div className="p-6 bg-gray-50">
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-green-500/30 transition-all disabled:opacity-50"
                >
                  {actionLoading ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <Check className="w-5 h-5" />
                  )}
                  Approve Refund
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-red-500/30 transition-all disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                  Reject Request
                </button>
              </div>
              <p className="text-center text-sm text-gray-500 mt-4">
                The player will be notified of your decision
              </p>
            </div>
          )}

          {/* Already Processed */}
          {registration.status === 'cancelled' && (
            <div className="p-6 bg-green-50 text-center">
              <Check className="w-12 h-12 text-green-600 mx-auto mb-2" />
              <p className="text-green-700 font-semibold">This refund has been approved</p>
            </div>
          )}

          {registration.status === 'confirmed' && registration.refundStatus === 'rejected' && (
            <div className="p-6 bg-red-50 text-center">
              <X className="w-12 h-12 text-red-600 mx-auto mb-2" />
              <p className="text-red-700 font-semibold">This refund request was rejected</p>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-rose-600 p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <X className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Reject Refund Request</h2>
                  <p className="text-red-100 text-sm mt-1">Please provide a reason</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Rejection <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g., Tournament has already started, Cancellation policy not met..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
              />
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectReason.trim() || actionLoading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Result Modal */}
      {resultModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className={`p-6 text-white ${resultModal.type === 'success' ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-red-500 to-rose-600'}`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  {resultModal.type === 'success' ? (
                    <Check className="h-6 w-6" />
                  ) : (
                    <X className="h-6 w-6" />
                  )}
                </div>
                <h2 className="text-xl font-bold">{resultModal.title}</h2>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-700 mb-6">{resultModal.message}</p>
              <button
                onClick={() => {
                  setResultModal(null);
                  navigate(-1);
                }}
                className={`w-full px-4 py-3 rounded-xl font-semibold transition-all ${
                  resultModal.type === 'success' 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg' 
                    : 'bg-gradient-to-r from-red-500 to-rose-600 text-white hover:shadow-lg'
                }`}
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
