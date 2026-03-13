import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, CreditCard, CheckCircle, XCircle, Clock, 
  User, Mail, Phone, Eye, Loader2, AlertCircle, X
} from 'lucide-react';
import api from '../../utils/api';

export default function KYCPaymentVerification() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({ pending: 0, verified: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING'); // PENDING, VERIFIED, REJECTED, ALL
  const [currentPayment, setCurrentPayment] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [lastPaymentCount, setLastPaymentCount] = useState(0);
  const [showNewPaymentAlert, setShowNewPaymentAlert] = useState(false);

  useEffect(() => {
    fetchPayments();
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchPayments, 10000);
    return () => clearInterval(interval);
  }, [filter]);

  const fetchPayments = async () => {
    try {
      const response = await api.get('/kyc/admin/payments', {
        params: filter !== 'ALL' ? { status: filter } : {}
      });
      
      const allPayments = response.data.payments || [];
      setPayments(allPayments);
      
      // Calculate stats
      const pending = allPayments.filter(p => p.status === 'PENDING').length;
      const verified = allPayments.filter(p => p.status === 'VERIFIED').length;
      const rejected = allPayments.filter(p => p.status === 'REJECTED').length;
      setStats({ pending, verified, rejected });

      // Show alert if new payments arrived
      if (filter === 'PENDING' && lastPaymentCount > 0 && pending > lastPaymentCount) {
        setShowNewPaymentAlert(true);
        setTimeout(() => setShowNewPaymentAlert(false), 5000);
        
        // Browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Matchify.pro - New Payment', {
            body: `${pending - lastPaymentCount} new payment(s) pending verification!`,
            icon: '/favicon.ico'
          });
        }
      }
      
      if (filter === 'PENDING') {
        setLastPaymentCount(pending);
      }
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleVerify = async (payment) => {
    if (!confirm(`Verify payment of ₹${payment.amount} from ${payment.organizer.name}?`)) return;

    setActionLoading(true);
    try {
      await api.post(`/kyc/admin/payments/${payment.id}/verify`);
      alert('Payment verified successfully!');
      fetchPayments();
      setCurrentPayment(null);
    } catch (error) {
      console.error('Failed to verify payment:', error);
      alert('Failed to verify payment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    setActionLoading(true);
    try {
      await api.post(`/kyc/admin/payments/${currentPayment.id}/reject`, {
        reason: rejectionReason
      });
      alert('Payment rejected');
      fetchPayments();
      setCurrentPayment(null);
      setShowRejectModal(false);
      setRejectionReason('');
    } catch (error) {
      console.error('Failed to reject payment:', error);
      alert('Failed to reject payment');
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectModal = (payment) => {
    setCurrentPayment(payment);
    setShowRejectModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/admin/kyc')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group mb-6"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Back to KYC Management</span>
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">KYC Payment Verification</h1>
          <p className="text-gray-300">Review and verify organizer payment submissions</p>
        </div>

        {/* New Payment Alert */}
        {showNewPaymentAlert && (
          <div className="mb-6 bg-gradient-to-r from-green-500 to-emerald-600 border-2 border-green-400 rounded-xl p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-white" />
              <p className="text-white font-bold text-lg">New payment(s) received! Please review below.</p>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-yellow-400" />
              <span className="text-3xl font-bold text-yellow-300">{stats.pending}</span>
            </div>
            <p className="text-yellow-200 font-medium">Pending Verification</p>
          </div>

          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-green-400" />
              <span className="text-3xl font-bold text-green-300">{stats.verified}</span>
            </div>
            <p className="text-green-200 font-medium">Verified</p>
          </div>

          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <XCircle className="w-8 h-8 text-red-400" />
              <span className="text-3xl font-bold text-red-300">{stats.rejected}</span>
            </div>
            <p className="text-red-200 font-medium">Rejected</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {['PENDING', 'VERIFIED', 'REJECTED', 'ALL'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${
                filter === status
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800/50 text-gray-300 hover:bg-slate-700/50'
              }`}
            >
              {status === 'ALL' ? 'All Payments' : status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Payments List */}
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-2xl font-bold text-white">Payment Submissions</h2>
          </div>

          {payments.length === 0 ? (
            <div className="p-12 text-center">
              <CreditCard className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No payments found</p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {payments.map((payment) => (
                <div key={payment.id} className="p-6 hover:bg-white/5 transition-colors">
                  <div className="flex items-start justify-between">
                    {/* Organizer Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">{payment.organizer.name}</h3>
                          <p className="text-sm text-gray-400">
                            Submitted {new Date(payment.submittedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-gray-300">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{payment.organizer.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{payment.organizer.phone || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mb-3">
                        <div className="bg-slate-700/50 rounded-lg px-4 py-2">
                          <p className="text-xs text-gray-400">Amount</p>
                          <p className="text-lg font-bold text-green-400">₹{payment.amount}</p>
                        </div>
                        <div className="bg-slate-700/50 rounded-lg px-4 py-2">
                          <p className="text-xs text-gray-400">Transaction ID</p>
                          <p className="text-sm font-mono text-white">{payment.transactionId}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          payment.status === 'PENDING' 
                            ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' 
                            : payment.status === 'VERIFIED'
                            ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                            : 'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}>
                          {payment.status}
                        </span>
                        {payment.verifiedAt && (
                          <span className="text-xs text-gray-400">
                            Verified {new Date(payment.verifiedAt).toLocaleString()}
                          </span>
                        )}
                        {payment.rejectionReason && (
                          <span className="text-xs text-red-400">
                            Reason: {payment.rejectionReason}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 ml-6">
                      <button
                        onClick={() => setCurrentPayment(payment)}
                        className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View Screenshot
                      </button>
                      {payment.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleVerify(payment)}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Verify
                          </button>
                          <button
                            onClick={() => openRejectModal(payment)}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* View Screenshot Modal */}
      {currentPayment && !showRejectModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-white/10 max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-white">Payment Screenshot</h3>
              <button
                onClick={() => setCurrentPayment(null)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 mb-1">Organizer</p>
                  <p className="text-white font-medium">{currentPayment.organizer.name}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Email</p>
                  <p className="text-white font-medium">{currentPayment.organizer.email}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Amount</p>
                  <p className="text-green-400 font-bold text-xl">₹{currentPayment.amount}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Transaction ID</p>
                  <p className="text-white font-mono text-sm">{currentPayment.transactionId}</p>
                </div>
              </div>
              <img
                src={currentPayment.screenshotUrl}
                alt="Payment Screenshot"
                className="w-full rounded-lg border border-white/10"
              />
              {currentPayment.status === 'PENDING' && (
                <div className="mt-6 flex gap-4">
                  <button
                    onClick={() => handleVerify(currentPayment)}
                    disabled={actionLoading}
                    className="flex-1 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {actionLoading ? 'Processing...' : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Verify Payment
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowRejectModal(true);
                    }}
                    disabled={actionLoading}
                    className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-5 h-5" />
                    Reject Payment
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && currentPayment && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-white/10 max-w-md w-full">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-xl font-bold text-white">Reject Payment</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-300 mb-4">
                Please provide a reason for rejecting {currentPayment.organizer.name}'s payment:
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Invalid transaction ID, fake screenshot, amount mismatch, etc."
                rows={4}
                className="w-full px-4 py-3 bg-slate-700/50 text-white rounded-xl border border-white/10 focus:outline-none focus:border-red-500 resize-none"
              />
              <div className="mt-6 flex gap-4">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                  }}
                  className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading || !rejectionReason.trim()}
                  className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Rejecting...' : 'Reject Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
