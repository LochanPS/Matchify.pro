import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Loader, CheckCircle, XCircle, AlertTriangle, Image as ImageIcon, CreditCard, User, Mail, Phone, MapPin, Calendar, Trophy } from 'lucide-react';

export default function RefundRequestsPage() {
  const navigate = useNavigate();
  const [refundRequests, setRefundRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // pending, processed
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [showImageModal, setShowImageModal] = useState(null);

  useEffect(() => {
    fetchRefundRequests();
  }, [filter]);

  const fetchRefundRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/refund-requests', {
        params: { status: filter }
      });
      setRefundRequests(response.data.refundRequests || []);
    } catch (error) {
      console.error('Error fetching refund requests:', error);
      toast.error('Failed to load refund requests');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRefund = async (requestId) => {
    if (!confirm('Are you sure you want to mark this refund as processed?')) {
      return;
    }

    try {
      setProcessing(true);
      await api.post(`/admin/refund-requests/${requestId}/process`);
      toast.success('Refund marked as processed!');
      fetchRefundRequests();
    } catch (error) {
      console.error('Error processing refund:', error);
      toast.error(error.response?.data?.error || 'Failed to process refund');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #0a0a1f 0%, #07071a 50%, #0a0a1f 100%)' }}>
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin mx-auto text-emerald-500" />
          <p className="text-gray-400 mt-4">Loading refund requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #0a0a1f 0%, #07071a 50%, #0a0a1f 100%)' }}>
      {/* Header - Emerald Theme */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.15) 0%, rgba(6,182,212,0.1) 100%)' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-10" style={{ background: 'radial-gradient(circle, #06b6d4, transparent)' }}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 mb-4 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl" style={{ background: 'linear-gradient(135deg,#06b6d4,#0891b2)', boxShadow: '0 8px 25px rgba(6,182,212,0.3)' }}>
              <CreditCard className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Refund Requests</h1>
              <p className="text-gray-400">Manage payment rejections and withdrawal requests</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filter Tabs */}
        <div className="rounded-2xl shadow-xl p-2 mb-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex gap-2">
            {['pending', 'processed'].map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className="flex-1 px-4 py-3 text-sm font-bold rounded-xl transition-all"
                style={
                  filter === status
                    ? { background: 'linear-gradient(135deg,#06b6d4,#0891b2)', color: '#ffffff', boxShadow: '0 4px 15px rgba(6,182,212,0.3)' }
                    : { color: 'rgba(255,255,255,0.5)', background: 'transparent' }
                }
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Refund Requests List */}
        {refundRequests.length === 0 ? (
          <div className="rounded-2xl shadow-xl p-12 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5" style={{ background: 'rgba(6,182,212,0.1)', border: '2px solid rgba(6,182,212,0.2)' }}>
              <CheckCircle className="w-10 h-10 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No {filter} refund requests</h3>
            <p className="text-gray-400">All caught up!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {refundRequests.map((request) => (
              <div
                key={request.id}
                className="rounded-2xl p-6 transition-all"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Images Section */}
                  <div className="space-y-4">
                    {/* Original Payment Screenshot */}
                    <div>
                      <p className="text-sm font-bold text-gray-400 mb-2">Original Payment Screenshot</p>
                      <img
                        src={request.paymentScreenshot}
                        alt="Payment Screenshot"
                        className="w-full h-48 object-contain bg-slate-900 rounded-lg cursor-pointer hover:scale-105 transition"
                        onClick={() => setShowImageModal({ url: request.paymentScreenshot, title: 'Payment Screenshot' })}
                      />
                    </div>

                    {/* Refund QR Code */}
                    {request.refundQrCode && (
                      <div>
                        <p className="text-sm font-bold text-gray-400 mb-2">User's QR Code (for refund)</p>
                        <img
                          src={request.refundQrCode}
                          alt="Refund QR Code"
                          className="w-full h-48 object-contain bg-slate-900 rounded-lg cursor-pointer hover:scale-105 transition"
                          onClick={() => setShowImageModal({ url: request.refundQrCode, title: 'Refund QR Code' })}
                        />
                      </div>
                    )}
                  </div>

                  {/* Details Section */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Reason Badge */}
                    <div>
                      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm ${
                        request.refundReason === 'REJECTED' 
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        <AlertTriangle className="w-4 h-4" />
                        {request.refundReason === 'REJECTED' ? 'Payment Rejected by Admin' : 'User Withdrawal Request'}
                      </span>
                    </div>

                    {/* User Info */}
                    <div>
                      <h3 className="text-lg font-bold text-white mb-3">User Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-emerald-400" />
                          <div>
                            <p className="text-xs text-gray-400">Name</p>
                            <p className="text-white font-medium">{request.user.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-blue-400" />
                          <div>
                            <p className="text-xs text-gray-400">Email</p>
                            <p className="text-white font-medium text-sm">{request.user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-purple-400" />
                          <div>
                            <p className="text-xs text-gray-400">Phone</p>
                            <p className="text-white font-medium">{request.user.phone}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-amber-400" />
                          <div>
                            <p className="text-xs text-gray-400">Refund Amount</p>
                            <p className="text-emerald-400 font-bold text-xl">₹{request.refundAmount}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tournament Info */}
                    <div>
                      <h3 className="text-lg font-bold text-white mb-3">Tournament Details</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-emerald-400" />
                          <div>
                            <p className="text-xs text-gray-400">Tournament</p>
                            <p className="text-white font-medium">{request.tournament.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-red-400" />
                          <div>
                            <p className="text-xs text-gray-400">Location</p>
                            <p className="text-white font-medium">{request.tournament.city}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Category</p>
                          <p className="text-white font-medium">{request.category.name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Format</p>
                          <p className="text-white font-medium">{request.category.format}</p>
                        </div>
                      </div>
                    </div>

                    {/* Refund Details */}
                    <div className="p-4 rounded-xl" style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)' }}>
                      <h3 className="text-sm font-bold text-emerald-400 mb-3">Refund Payment Details</h3>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-gray-400">UPI ID</p>
                          <p className="text-white font-mono font-bold">{request.refundUpiId}</p>
                        </div>
                        {request.refundAccountName && (
                          <div>
                            <p className="text-xs text-gray-400">Account Name</p>
                            <p className="text-white font-medium">{request.refundAccountName}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Rejection Reason (if applicable) */}
                    {request.rejectionReason && (
                      <div className="p-4 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                        <p className="text-xs font-bold text-red-400 mb-1">Rejection Reason</p>
                        <p className="text-gray-300 text-sm">{request.rejectionReason}</p>
                      </div>
                    )}

                    {/* Cancellation Reason (if applicable) */}
                    {request.cancellationReason && (
                      <div className="p-4 rounded-xl" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                        <p className="text-xs font-bold text-amber-400 mb-1">Cancellation Reason</p>
                        <p className="text-gray-300 text-sm">{request.cancellationReason}</p>
                      </div>
                    )}

                    {/* Action Button */}
                    {filter === 'pending' && (
                      <button
                        onClick={() => handleProcessRefund(request.id)}
                        disabled={processing}
                        className="w-full py-4 rounded-xl font-bold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        style={{ background: 'linear-gradient(135deg,#06b6d4,#0891b2)', boxShadow: '0 4px 15px rgba(6,182,212,0.3)' }}
                      >
                        {processing ? (
                          <>
                            <Loader className="w-5 h-5 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-5 h-5" />
                            Mark as Refunded
                          </>
                        )}
                      </button>
                    )}

                    {filter === 'processed' && (
                      <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)' }}>
                        <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                        <p className="text-emerald-400 font-bold">Refund Processed</p>
                        {request.refundProcessedAt && (
                          <p className="text-gray-400 text-sm mt-1">
                            on {new Date(request.refundProcessedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Modal */}
      {showImageModal && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setShowImageModal(null)}
        >
          <div className="max-w-4xl w-full">
            <h3 className="text-white text-xl font-bold mb-4 text-center">{showImageModal.title}</h3>
            <img
              src={showImageModal.url}
              alt={showImageModal.title}
              className="w-full h-auto rounded-lg"
            />
            <button
              onClick={() => setShowImageModal(null)}
              className="mt-4 w-full py-3 rounded-xl font-bold text-white transition-all"
              style={{ background: 'linear-gradient(135deg,#06b6d4,#0891b2)' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
