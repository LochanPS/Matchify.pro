import { useState, useEffect } from 'react';
import { getPaymentVerifications, getPaymentVerificationStats, approvePayment, rejectPayment } from '../../api/payment';
import { toast } from 'react-hot-toast';

const PaymentVerificationPage = () => {
  const [verifications, setVerifications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [verificationsData, statsData] = await Promise.all([
        getPaymentVerifications({ status: filter }),
        getPaymentVerificationStats(),
      ]);
      setVerifications(verificationsData.data);
      setStats(statsData.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load payment verifications');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!confirm('Are you sure you want to approve this payment?')) return;

    try {
      setProcessing(true);
      await approvePayment(id);
      toast.success('Payment approved successfully!');
      fetchData();
    } catch (error) {
      console.error('Error approving payment:', error);
      toast.error('Failed to approve payment');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (id) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      setProcessing(true);
      await rejectPayment(id, rejectionReason);
      toast.success('Payment rejected');
      setShowRejectModal(null);
      setRejectionReason('');
      fetchData();
    } catch (error) {
      console.error('Error rejecting payment:', error);
      toast.error('Failed to reject payment');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Payment Verification</h1>
        <p className="text-gray-400">Review and approve player payment screenshots</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg hover:shadow-teal-500/20 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Pending</p>
                <p className="text-3xl font-bold text-yellow-400 mt-2">{stats.pending}</p>
              </div>
              <div className="text-4xl">⏳</div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg hover:shadow-teal-500/20 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Approved</p>
                <p className="text-3xl font-bold text-green-400 mt-2">{stats.approved}</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg hover:shadow-teal-500/20 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Rejected</p>
                <p className="text-3xl font-bold text-red-400 mt-2">{stats.rejected}</p>
              </div>
              <div className="text-4xl">❌</div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg hover:shadow-teal-500/20 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Collected</p>
                <p className="text-3xl font-bold text-teal-400 mt-2">
                  ₹{stats.totalAmountCollected.toLocaleString()}
                </p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        {['pending', 'approved', 'rejected'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              filter === status
                ? 'bg-teal-600 text-white shadow-lg shadow-teal-500/50'
                : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Payment List */}
      <div className="grid grid-cols-1 gap-6">
        {verifications.length === 0 ? (
          <div className="bg-slate-800 rounded-xl p-12 text-center border border-slate-700">
            <p className="text-gray-400 text-lg">No {filter} payments found</p>
          </div>
        ) : (
          verifications.map((verification) => (
            <div
              key={verification.id}
              className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg hover:shadow-teal-500/20 transition"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Payment Screenshot */}
                <div className="lg:col-span-1">
                  <img
                    src={verification.registration.tournament.paymentScreenshot || verification.paymentScreenshot}
                    alt="Payment Screenshot"
                    className="w-full h-64 object-contain bg-slate-900 rounded-lg cursor-pointer hover:scale-105 transition"
                    onClick={() => setSelectedPayment(verification)}
                  />
                  <p className="text-center text-gray-400 text-sm mt-2">Click to enlarge</p>
                </div>

                {/* Payment Details */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Player Info */}
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Player Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-400 text-sm">Name</p>
                        <p className="text-white font-medium">{verification.registration.user.name}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Email</p>
                        <p className="text-white font-medium">{verification.registration.user.email}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Phone</p>
                        <p className="text-white font-medium">{verification.registration.user.phone}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Amount</p>
                        <p className="text-teal-400 font-bold text-xl">₹{verification.amount}</p>
                      </div>
                    </div>
                  </div>

                  {/* Tournament Info */}
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">Tournament Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-400 text-sm">Tournament</p>
                        <p className="text-white font-medium">{verification.registration.tournament.name}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Category</p>
                        <p className="text-white font-medium">{verification.registration.category.name}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Format</p>
                        <p className="text-white font-medium">{verification.registration.category.format}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Submitted</p>
                        <p className="text-white font-medium">
                          {new Date(verification.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {filter === 'pending' && (
                    <div className="flex gap-4 pt-4">
                      <div className="relative group flex-1">
                        <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl blur-lg opacity-50 group-hover:opacity-100 transition duration-300"></div>
                        <button
                          onClick={() => handleApprove(verification.id)}
                          disabled={processing}
                          className="relative w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                        >
                          ✅ Approve Payment
                        </button>
                      </div>
                      <div className="relative group flex-1">
                        <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-rose-500 rounded-xl blur-lg opacity-50 group-hover:opacity-100 transition duration-300"></div>
                        <button
                          onClick={() => setShowRejectModal(verification.id)}
                          disabled={processing}
                          className="relative w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold py-3 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                        >
                          ❌ Reject Payment
                        </button>
                      </div>
                    </div>
                  )}

                  {filter !== 'pending' && (
                    <div className="pt-4">
                      <div className={`inline-flex items-center px-4 py-2 rounded-lg ${
                        filter === 'approved' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                      }`}>
                        {filter === 'approved' ? '✅ Approved' : '❌ Rejected'}
                        {verification.verifiedAt && (
                          <span className="ml-2 text-sm">
                            on {new Date(verification.verifiedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Image Modal */}
      {selectedPayment && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPayment(null)}
        >
          <div className="max-w-4xl w-full">
            <img
              src={selectedPayment.registration.tournament.paymentScreenshot || selectedPayment.paymentScreenshot}
              alt="Payment Screenshot"
              className="w-full h-auto rounded-lg"
            />
            <button
              onClick={() => setSelectedPayment(null)}
              className="mt-4 w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-lg transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl p-8 max-w-md w-full border border-slate-700">
            <h3 className="text-2xl font-bold text-white mb-4">Reject Payment</h3>
            <p className="text-gray-400 mb-4">Please provide a reason for rejection:</p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full bg-slate-900 text-white border border-slate-700 rounded-lg p-4 mb-4 focus:outline-none focus:ring-2 focus:ring-teal-500"
              rows="4"
              placeholder="e.g., Payment screenshot is unclear, wrong amount, etc."
            />
            <div className="flex gap-4">
              <button
                onClick={() => handleReject(showRejectModal)}
                disabled={processing || !rejectionReason.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reject
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectionReason('');
                }}
                disabled={processing}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentVerificationPage;
