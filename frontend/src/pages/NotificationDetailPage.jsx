import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useNotifications } from '../contexts/NotificationContext';
import { formatDateIndian } from '../utils/dateFormat';
import { format } from 'date-fns';
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
  Bell,
  Clock,
  CheckCircle,
  XCircle,
  Info,
} from 'lucide-react';

// Helper to get proper image URL
const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('/uploads')) {
    return `http://localhost:5000${url}`;
  }
  return url;
};

export default function NotificationDetailPage() {
  const { notificationId } = useParams();
  const navigate = useNavigate();
  const { markAsRead } = useNotifications();
  const [notification, setNotification] = useState(null);
  const [registration, setRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [resultModal, setResultModal] = useState(null);

  useEffect(() => {
    fetchNotificationDetails();
  }, [notificationId]);

  const fetchNotificationDetails = async () => {
    try {
      setLoading(true);
      // Fetch notification
      const notifResponse = await api.get(`/notifications/${notificationId}`);
      const notif = notifResponse.data.notification;
      setNotification(notif);
      
      // Mark as read
      if (!notif.read) {
        markAsRead(notificationId);
      }

      // Parse notification data
      const data = notif.data ? JSON.parse(notif.data) : {};
      console.log('Notification data:', data);
      
      // If it's a payment verification notification (organizer), fetch registration as organizer
      if (notif.type === 'PAYMENT_VERIFICATION_REQUIRED' && data.registrationIds) {
        try {
          // Fetch the first registration (usually there's one per notification)
          const regId = data.registrationIds[0];
          const regResponse = await api.get(`/organizer/registrations/${regId}`);
          setRegistration(regResponse.data.registration);
          console.log('Fetched registration as organizer:', regResponse.data.registration);
        } catch (err) {
          console.log('Could not fetch registration as organizer:', err);
        }
      }
      // If it's a registration-related notification, fetch registration details
      else if (data.registrationId) {
        try {
          const regResponse = await api.get(`/registrations/${data.registrationId}`);
          setRegistration(regResponse.data.registration);
          console.log('Fetched registration:', regResponse.data.registration);
        } catch (err) {
          console.log('Could not fetch registration details, trying fallback');
          // Fallback: try to find from cancelled registrations
          await fetchCancelledRegistration(data, notif);
        }
      } else if (notif.type === 'REFUND_APPROVED' || notif.type === 'REFUND_REJECTED') {
        // For older notifications without registrationId, try to find the registration
        await fetchCancelledRegistration(data, notif);
      }
    } catch (err) {
      console.error('Error fetching notification:', err);
      // If notification not found (404), redirect to notifications list
      if (err.response?.status === 404) {
        navigate('/notifications', { replace: true });
        return;
      }
      setError(err.response?.data?.error || 'Failed to load notification');
    } finally {
      setLoading(false);
    }
  };

  const fetchCancelledRegistration = async (data, notif) => {
    try {
      console.log('Fetching cancelled registrations...');
      
      // Try to fetch cancelled registrations first
      let regs = [];
      try {
        const regResponse = await api.get('/registrations/my?status=cancelled');
        regs = regResponse.data.registrations || [];
        console.log('Cancelled registrations found:', regs.length);
      } catch (err) {
        console.log('Error fetching cancelled registrations:', err);
      }
      
      // If no cancelled registrations, try cancellation_requested
      if (regs.length === 0) {
        try {
          const reqResponse = await api.get('/registrations/my?status=cancellation_requested');
          regs = reqResponse.data.registrations || [];
          console.log('Cancellation requested registrations found:', regs.length);
        } catch (err) {
          console.log('Error fetching cancellation_requested registrations:', err);
        }
      }
      
      // If still no registrations, try fetching all registrations
      if (regs.length === 0) {
        try {
          const allResponse = await api.get('/registrations/my');
          regs = allResponse.data.registrations || [];
          console.log('All registrations found:', regs.length);
          // Filter to only cancelled or cancellation_requested
          regs = regs.filter(r => r.status === 'cancelled' || r.status === 'cancellation_requested');
          console.log('Filtered registrations:', regs.length);
        } catch (err) {
          console.log('Error fetching all registrations:', err);
        }
      }
      
      if (regs.length > 0) {
        // Try to match by tournament name if available
        if (data.tournamentName) {
          const matchedReg = regs.find(r => r.tournament?.name === data.tournamentName);
          if (matchedReg) {
            setRegistration(matchedReg);
            console.log('Matched registration by tournament name:', matchedReg.id);
            return;
          }
        }
        // Try to match by category name if available
        if (data.categoryName) {
          const matchedReg = regs.find(r => r.category?.name === data.categoryName);
          if (matchedReg) {
            setRegistration(matchedReg);
            console.log('Matched registration by category name:', matchedReg.id);
            return;
          }
        }
        // Otherwise use the most recent one
        setRegistration(regs[0]);
        console.log('Using most recent registration:', regs[0].id);
      } else {
        console.log('No registrations found for fallback');
      }
    } catch (err) {
      console.log('Could not fetch registrations:', err);
    }
  };

  // Organizer actions for cancellation requests
  const handleApproveRefund = async () => {
    const data = notification.data ? JSON.parse(notification.data) : {};
    if (!data.registrationId) return;

    try {
      setActionLoading(true);
      await api.put(`/organizer/registrations/${data.registrationId}/approve-refund`);
      setResultModal({
        type: 'success',
        title: 'Refund Approved',
        message: `Refund has been approved. The player will be notified. Please send the refund to their UPI ID.`
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

  const handleRejectRefund = async () => {
    const data = notification.data ? JSON.parse(notification.data) : {};
    if (!data.registrationId || !rejectReason.trim()) return;

    try {
      setActionLoading(true);
      setShowRejectModal(false);
      await api.put(`/organizer/registrations/${data.registrationId}/reject-refund`, {
        reason: rejectReason
      });
      setResultModal({
        type: 'success',
        title: 'Refund Rejected',
        message: 'The refund request has been rejected. The player will be notified.'
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

  // Organizer actions for payment verification
  const handleApprovePayment = async () => {
    if (!registration?.id) return;

    try {
      setActionLoading(true);
      await api.put(`/organizer/registrations/${registration.id}/approve`);
      setResultModal({
        type: 'success',
        title: 'Payment Verified! ✅',
        message: `Payment has been verified and ${registration.user?.name}'s registration is now confirmed. They will be notified.`
      });
      // Update local registration state
      setRegistration({ ...registration, status: 'confirmed', paymentStatus: 'verified' });
    } catch (err) {
      console.error('Error approving payment:', err);
      setResultModal({
        type: 'error',
        title: 'Error',
        message: err.response?.data?.error || 'Failed to verify payment'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectPayment = async () => {
    if (!registration?.id || !rejectReason.trim()) return;

    try {
      setActionLoading(true);
      setShowRejectModal(false);
      await api.put(`/organizer/registrations/${registration.id}/reject`, {
        reason: rejectReason
      });
      setResultModal({
        type: 'success',
        title: 'Payment Rejected',
        message: `The payment has been rejected. ${registration.user?.name} will be notified with your reason.`
      });
      // Update local registration state
      setRegistration({ ...registration, status: 'rejected', paymentStatus: 'rejected' });
    } catch (err) {
      console.error('Error rejecting payment:', err);
      setResultModal({
        type: 'error',
        title: 'Error',
        message: err.response?.data?.error || 'Failed to reject payment'
      });
    } finally {
      setActionLoading(false);
      setRejectReason('');
    }
  };

  // Player actions for refund confirmation
  const handleConfirmRefundReceived = async () => {
    const data = notification.data ? JSON.parse(notification.data) : {};
    const regId = data.registrationId || registration?.id;
    
    console.log('Confirm refund clicked!');
    console.log('Notification data:', data);
    console.log('Registration state:', registration);
    console.log('Registration ID:', regId);
    
    if (!regId) {
      setResultModal({
        type: 'error',
        title: 'Registration Not Found',
        message: 'Could not find your registration details. This may happen with older notifications. Please contact the organizer directly to confirm your refund.'
      });
      return;
    }

    try {
      setActionLoading(true);
      await api.put(`/registrations/${regId}/confirm-refund`);
      setResultModal({
        type: 'success',
        title: 'Thank You!',
        message: 'Your refund confirmation has been recorded. The process is now complete.'
      });
    } catch (err) {
      console.error('Error confirming refund:', err);
      setResultModal({
        type: 'error',
        title: 'Error',
        message: err.response?.data?.error || 'Failed to confirm refund. Please try again or contact the organizer.'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReportRefundNotReceived = () => {
    const data = notification.data ? JSON.parse(notification.data) : {};
    const regId = data.registrationId || registration?.id;
    
    console.log('Report not received clicked!');
    console.log('Notification data:', data);
    console.log('Registration state:', registration);
    console.log('Registration ID:', regId);
    
    if (regId) {
      navigate(`/refund-issue/${regId}`);
    } else {
      setResultModal({
        type: 'error',
        title: 'Registration Not Found',
        message: 'Could not find your registration details. This may happen with older notifications. Please contact the organizer directly to report the issue.'
      });
    }
  };

  const getNotificationStyle = (type) => {
    const styles = {
      REGISTRATION_CONFIRMED: { icon: '✅', color: 'green', title: 'Registration Confirmed' },
      REGISTRATION_REJECTED: { icon: '❌', color: 'red', title: 'Registration Rejected' },
      REGISTRATION_REMOVED: { icon: '🚫', color: 'red', title: 'Registration Removed' },
      REGISTRATION_PENDING: { icon: '⏳', color: 'amber', title: 'Registration Pending' },
      PAYMENT_VERIFICATION_REQUIRED: { icon: '💳', color: 'blue', title: 'Payment Verification' },
      PARTNER_INVITATION: { icon: '🤝', color: 'blue', title: 'Partner Invitation' },
      PARTNER_ACCEPTED: { icon: '👍', color: 'green', title: 'Partner Accepted' },
      PARTNER_DECLINED: { icon: '👎', color: 'orange', title: 'Partner Declined' },
      DRAW_PUBLISHED: { icon: '📊', color: 'purple', title: 'Draw Published' },
      MATCH_ASSIGNED: { icon: '🏸', color: 'cyan', title: 'Match Assigned' },
      MATCH_STARTING_SOON: { icon: '⏰', color: 'yellow', title: 'Match Starting Soon' },
      TOURNAMENT_CANCELLED: { icon: '📛', color: 'red', title: 'Tournament Cancelled' },
      REFUND_PROCESSED: { icon: '💰', color: 'green', title: 'Refund Processed' },
      REFUND_APPROVED: { icon: '💰', color: 'green', title: 'Refund Approved' },
      REFUND_REJECTED: { icon: '❌', color: 'red', title: 'Refund Rejected' },
      TOURNAMENT_REMINDER: { icon: '📅', color: 'blue', title: 'Tournament Reminder' },
      POINTS_AWARDED: { icon: '🏆', color: 'yellow', title: 'Points Awarded' },
      CANCELLATION_REQUEST: { icon: '🔴', color: 'orange', title: 'Cancellation Request' },
    };
    return styles[type] || { icon: '🔔', color: 'gray', title: 'Notification' };
  };

  const getColorClasses = (color) => {
    const colors = {
      green: { bg: 'from-green-500 to-emerald-600', light: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
      red: { bg: 'from-red-500 to-rose-600', light: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
      blue: { bg: 'from-blue-500 to-indigo-600', light: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
      orange: { bg: 'from-orange-500 to-red-600', light: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
      amber: { bg: 'from-amber-500 to-orange-600', light: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
      purple: { bg: 'from-purple-500 to-violet-600', light: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
      cyan: { bg: 'from-cyan-500 to-sky-600', light: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700' },
      yellow: { bg: 'from-yellow-500 to-amber-600', light: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700' },
      gray: { bg: 'from-gray-500 to-slate-600', light: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700' },
    };
    return colors[color] || colors.gray;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 mt-4 font-medium">Loading notification...</p>
        </div>
      </div>
    );
  }

  if (error || !notification) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-500/20 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Error</h2>
          <p className="text-gray-400 mb-6">{error || 'Failed to load notification'}</p>
          <button
            onClick={() => navigate('/notifications')}
            className="px-6 py-3 bg-slate-700/50 border border-white/10 text-gray-300 rounded-xl hover:bg-slate-600/50 transition-colors font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const style = getNotificationStyle(notification.type);
  const colorClasses = getColorClasses(style.color);
  const data = notification.data ? JSON.parse(notification.data) : {};

  // Determine if this notification needs action buttons
  const isCancellationRequest = notification.type === 'CANCELLATION_REQUEST';
  const isRefundApproved = notification.type === 'REFUND_APPROVED';
  const isPaymentVerification = notification.type === 'PAYMENT_VERIFICATION_REQUIRED';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className={`relative bg-gradient-to-r ${colorClasses.bg} overflow-hidden`}>
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
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
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-4xl">
              {style.icon}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{notification.title}</h1>
              <p className="text-white/70 mt-1 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {format(new Date(notification.createdAt), 'dd/MM/yyyy, h:mm a')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-6">
        {/* Main Content */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-xl border border-white/10 overflow-hidden">
          {/* Message */}
          <div className="p-6 border-b border-white/10">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-gray-400" />
              Message
            </h3>
            <div className="p-4 bg-slate-700/50 border border-white/10 rounded-xl">
              <p className="text-gray-200 text-lg">{notification.message}</p>
            </div>
          </div>

          {/* Context Details */}
          {(data.tournamentName || data.categoryName || data.playerName || data.amount) && (
            <div className="p-6 border-b border-white/10">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-purple-400" />
                Details
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {data.tournamentName && (
                  <div className="flex items-center gap-3 p-4 bg-slate-700/50 border border-white/10 rounded-xl">
                    <Trophy className="w-5 h-5 text-purple-400" />
                    <div>
                      <p className="text-sm text-gray-400">Tournament</p>
                      <p className="font-semibold text-white">{data.tournamentName}</p>
                    </div>
                  </div>
                )}
                {data.categoryName && (
                  <div className="flex items-center gap-3 p-4 bg-slate-700/50 border border-white/10 rounded-xl">
                    <Bell className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="text-sm text-gray-400">Category</p>
                      <p className="font-semibold text-white">{data.categoryName}</p>
                    </div>
                  </div>
                )}
                {data.playerName && (
                  <div className="flex items-center gap-3 p-4 bg-slate-700/50 border border-white/10 rounded-xl">
                    <User className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-sm text-gray-400">Player</p>
                      <p className="font-semibold text-white">{data.playerName}</p>
                    </div>
                  </div>
                )}
                {data.amount && (
                  <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                    <CreditCard className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-sm text-green-400">Amount</p>
                      <p className="font-bold text-green-300 text-xl">₹{data.amount}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Cancellation Reason (for organizer - cancellation request) */}
          {isCancellationRequest && data.reason && (
            <div className="p-6 border-b border-white/10">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
                Cancellation Reason
              </h3>
              <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
                <p className="text-orange-300">{data.reason}</p>
              </div>
            </div>
          )}

          {/* Tournament Cancelled Reason (for players) */}
          {notification.type === 'TOURNAMENT_CANCELLED' && data.reason && (
            <div className="p-6 border-b border-white/10">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Reason for Cancellation
              </h3>
              <div className="relative p-5 rounded-2xl overflow-hidden">
                {/* Halo/Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/30 via-rose-500/30 to-red-500/30 blur-xl"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-rose-500/10 rounded-2xl"></div>
                {/* Content */}
                <div className="relative bg-red-500/10 border-2 border-red-500/40 rounded-xl p-4 shadow-lg shadow-red-500/20">
                  <p className="text-red-200 text-lg font-medium">{data.reason}</p>
                </div>
              </div>
            </div>
          )}

          {/* Registration Details (if available) */}
          {registration && (
            <div className="p-6 border-b border-white/10">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-400" />
                Registration Details
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-slate-700/50 border border-white/10 rounded-xl">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-400">Player</p>
                    <p className="font-semibold text-white">{registration.user?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-slate-700/50 border border-white/10 rounded-xl">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-400">Email</p>
                    <p className="font-semibold text-white">{registration.user?.email}</p>
                  </div>
                </div>
                {registration.user?.phone && (
                  <div className="flex items-center gap-3 p-4 bg-slate-700/50 border border-white/10 rounded-xl">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-400">Phone</p>
                      <p className="font-semibold text-white">{registration.user?.phone}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                  <CreditCard className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-sm text-green-400">Amount Paid</p>
                    <p className="font-bold text-green-300 text-xl">₹{registration.amountTotal}</p>
                  </div>
                </div>
              </div>

              {/* Refund UPI ID (for organizer) */}
              {isCancellationRequest && registration.refundUpiId && (
                <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                  <p className="text-sm text-blue-400 mb-1 flex items-center gap-2">
                    <QrCode className="w-4 h-4" />
                    Player's UPI ID for Refund
                  </p>
                  <p className="text-xl font-mono font-bold text-blue-300">{registration.refundUpiId}</p>
                </div>
              )}

              {/* Refund QR Code (for organizer) */}
              {isCancellationRequest && registration.refundQrCode && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-400 mb-2">Player's Payment QR Code</p>
                  <div className="p-4 bg-slate-700/50 border border-white/10 rounded-xl inline-block">
                    <img
                      src={getImageUrl(registration.refundQrCode)}
                      alt="Refund QR Code"
                      className="max-w-xs rounded-lg shadow-md"
                    />
                  </div>
                </div>
              )}

              {/* Payment Screenshot (for payment verification) */}
              {isPaymentVerification && registration.paymentScreenshot && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Payment Screenshot
                  </p>
                  <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                    <img
                      src={getImageUrl(registration.paymentScreenshot)}
                      alt="Payment Screenshot"
                      className="max-w-full rounded-lg shadow-md cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => window.open(getImageUrl(registration.paymentScreenshot), '_blank')}
                    />
                    <p className="text-xs text-blue-400 mt-2 text-center">Click to view full size</p>
                  </div>
                </div>
              )}

              {/* Payment Status Badge */}
              {isPaymentVerification && (
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-sm text-gray-400">Payment Status:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    registration.paymentStatus === 'verified' ? 'bg-green-500/20 text-green-300' :
                    registration.paymentStatus === 'rejected' ? 'bg-red-500/20 text-red-300' :
                    registration.paymentStatus === 'submitted' ? 'bg-amber-500/20 text-amber-300' :
                    'bg-gray-500/20 text-gray-300'
                  }`}>
                    {registration.paymentStatus === 'verified' ? '✅ Verified' :
                     registration.paymentStatus === 'rejected' ? '❌ Rejected' :
                     registration.paymentStatus === 'submitted' ? '⏳ Awaiting Verification' :
                     registration.paymentStatus || 'Pending'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons for Organizer - Cancellation Request */}
          {isCancellationRequest && registration?.status === 'cancellation_requested' && (
            <div className="p-6 bg-slate-700/30">
              <h3 className="text-lg font-bold text-white mb-4">Take Action</h3>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleApproveRefund}
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
              <p className="text-center text-sm text-gray-400 mt-4">
                The player will be notified of your decision
              </p>
            </div>
          )}

          {/* Action Buttons for Organizer - Payment Verification */}
          {isPaymentVerification && registration && (registration.status === 'pending' || registration.paymentStatus === 'submitted') && (
            <div className="p-6 bg-slate-700/30">
              <h3 className="text-lg font-bold text-white mb-4">Verify Payment</h3>
              <p className="text-gray-400 mb-4">Review the payment screenshot above and verify if the payment is valid.</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="button"
                  onClick={handleApprovePayment}
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-green-500/30 transition-all disabled:opacity-50"
                >
                  {actionLoading ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <Check className="w-5 h-5" />
                  )}
                  Approve Payment
                </button>
                <button
                  type="button"
                  onClick={() => setShowRejectModal(true)}
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-red-500/30 transition-all disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                  Reject Payment
                </button>
              </div>
              <p className="text-center text-sm text-gray-400 mt-4">
                The player will be notified of your decision
              </p>
            </div>
          )}

          {/* Already Verified/Rejected Message */}
          {isPaymentVerification && registration && registration.status === 'confirmed' && (
            <div className="p-6 bg-green-500/10 border-t border-green-500/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-300">Payment Already Verified</h3>
                  <p className="text-green-400/80 text-sm">This registration has been confirmed.</p>
                </div>
              </div>
            </div>
          )}

          {isPaymentVerification && registration && registration.status === 'rejected' && (
            <div className="p-6 bg-red-500/10 border-t border-red-500/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-red-300">Payment Rejected</h3>
                  <p className="text-red-400/80 text-sm">This registration has been rejected.</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons for Player - Refund Approved */}
          {isRefundApproved && (
            <div className="p-6 bg-slate-700/30">
              <h3 className="text-lg font-bold text-white mb-2">Did you receive the refund?</h3>
              <p className="text-gray-400 mb-4">Please confirm once you receive the refund in your account.</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="button"
                  onClick={handleConfirmRefundReceived}
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-green-500/30 transition-all disabled:opacity-50"
                >
                  {actionLoading ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-5 h-5" />
                  )}
                  Yes, I Received It
                </button>
                <button
                  type="button"
                  onClick={handleReportRefundNotReceived}
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-orange-500/30 transition-all disabled:opacity-50"
                >
                  <XCircle className="w-5 h-5" />
                  No, Not Yet
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-white/10">
            <div className="bg-gradient-to-r from-red-500 to-rose-600 p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <X className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">
                    {isPaymentVerification ? 'Reject Payment' : 'Reject Refund Request'}
                  </h2>
                  <p className="text-red-100 text-sm mt-1">Please provide a reason</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Reason for Rejection <span className="text-red-400">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={isPaymentVerification 
                  ? "e.g., Payment screenshot is unclear, Amount doesn't match, Transaction ID not visible..."
                  : "e.g., Tournament has already started, Cancellation policy not met..."
                }
                rows={4}
                className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
              />
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason('');
                  }}
                  className="flex-1 px-4 py-3 border border-white/10 rounded-xl text-gray-300 hover:bg-slate-700/50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={isPaymentVerification ? handleRejectPayment : handleRejectRefund}
                  disabled={!rejectReason.trim() || actionLoading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold disabled:opacity-50"
                >
                  {actionLoading ? 'Rejecting...' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Result Modal */}
      {resultModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-white/10">
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
              <p className="text-gray-300 mb-6">{resultModal.message}</p>
              <button
                onClick={() => {
                  setResultModal(null);
                  navigate('/notifications');
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
