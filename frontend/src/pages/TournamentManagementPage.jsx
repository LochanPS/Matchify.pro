import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  getTournamentRegistrations,
  exportParticipants,
  updateTournamentStatus,
  removeRegistration,
  completeRefund,
} from '../api/organizer';
import { formatDateIndian } from '../utils/dateFormat';
import {
  Users,
  Download,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  Clock,
  XCircle,
  ArrowLeft,
  Trash2,
  Check,
  X,
  Image,
  Eye,
  ZoomIn,
  AlertTriangle,
  CreditCard,
  QrCode,
  RefreshCw,
  Filter,
  FileJson,
  FileSpreadsheet,
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

export default function TournamentManagementPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  // Check URL params for tab (e.g., ?tab=refunds)
  const tabParam = searchParams.get('tab');
  const [filter, setFilter] = useState(tabParam === 'refunds' ? 'cancellation_requested' : 'all');
  const [exporting, setExporting] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [screenshotModal, setScreenshotModal] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [refundQrModal, setRefundQrModal] = useState(null);
  const [completeRefundModal, setCompleteRefundModal] = useState(null); // { registrationId, playerName, amount }
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [paymentScreenshotError, setPaymentScreenshotError] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchRegistrations();
  }, [id]);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const data = await getTournamentRegistrations(id);
      setRegistrations(data.registrations || []);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      setErrorMessage('Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (registrationId) => {
    try {
      setActionLoading(registrationId);
      setConfirmModal(null);
      await removeRegistration(registrationId);
      await fetchRegistrations();
    } catch (error) {
      console.error('Error removing registration:', error);
      setErrorMessage('Failed to remove registration');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteRefund = async () => {
    if (!completeRefundModal) return;
    
    if (!paymentScreenshot) {
      setPaymentScreenshotError('Please upload payment screenshot as proof');
      return;
    }

    try {
      setActionLoading(completeRefundModal.registrationId);
      
      const formData = new FormData();
      formData.append('paymentScreenshot', paymentScreenshot);
      
      await completeRefund(completeRefundModal.registrationId, formData);
      
      setCompleteRefundModal(null);
      setPaymentScreenshot(null);
      setPaymentScreenshotError('');
      await fetchRegistrations();
    } catch (error) {
      console.error('Error completing refund:', error);
      setErrorMessage(error.response?.data?.error || 'Failed to complete refund');
    } finally {
      setActionLoading(null);
    }
  };

  const openCompleteRefundModal = (registration) => {
    setCompleteRefundModal({
      registrationId: registration.id,
      playerName: registration.user.name,
      amount: registration.amountTotal,
      upiId: registration.refundUpiId
    });
    setPaymentScreenshot(null);
    setPaymentScreenshotError('');
  };

  const handlePaymentScreenshotChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setPaymentScreenshotError('Please upload an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setPaymentScreenshotError('File size must be less than 5MB');
        return;
      }
      setPaymentScreenshot(file);
      setPaymentScreenshotError('');
    }
  };

  const handleExport = async (format) => {
    try {
      setExporting(true);
      const data = await exportParticipants(id, format);

      if (format === 'csv') {
        const blob = new Blob([data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tournament-${id}-participants.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tournament-${id}-participants.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export error:', error);
      setErrorMessage('Failed to export participants');
    } finally {
      setExporting(false);
    }
  };

  const filteredRegistrations = registrations.filter((reg) => {
    if (filter === 'all') return true;
    return reg.status === filter;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-emerald-400" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-amber-400" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-400" />;
      case 'cancellation_requested':
        return <AlertTriangle className="h-5 w-5 text-orange-400" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      confirmed: 'badge-success',
      pending: 'badge-warning',
      cancelled: 'badge-error',
      cancellation_requested: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
    };
    return styles[status] || 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading registrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-900/95 backdrop-blur-lg border-b border-white/10 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-3 group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Dashboard</span>
          </button>
          
          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 bg-red-500/20 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <span className="text-red-300">{errorMessage}</span>
              <button onClick={() => setErrorMessage('')} className="ml-auto text-red-400 hover:text-red-300">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-purple-500/30">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Tournament Registrations</h1>
                <p className="text-gray-400">
                  {filteredRegistrations.length} registration{filteredRegistrations.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleExport('json')}
                disabled={exporting}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-700/50 text-gray-300 rounded-xl hover:bg-slate-700 transition-all disabled:opacity-50 border border-white/10"
              >
                <FileJson className="h-4 w-4" />
                JSON
              </button>
              <button
                onClick={() => handleExport('csv')}
                disabled={exporting}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all disabled:opacity-50 font-medium"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2 text-gray-400 mr-2">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filter:</span>
          </div>
          {['all', 'confirmed', 'pending', 'cancellation_requested', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === status
                  ? status === 'cancellation_requested'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg'
                    : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                  : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700/50 border border-white/10'
              }`}
            >
              {status === 'cancellation_requested' ? 'Refund Requests' : status.charAt(0).toUpperCase() + status.slice(1)}
              <span className="ml-1.5 text-xs opacity-75">
                ({status === 'all' ? registrations.length : registrations.filter((r) => r.status === status).length})
              </span>
            </button>
          ))}
        </div>

        {/* Registrations Table */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
          {filteredRegistrations.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-10 w-10 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No registrations found</h3>
              <p className="text-gray-400">
                {filter === 'all'
                  ? 'No one has registered for this tournament yet'
                  : `No ${filter === 'cancellation_requested' ? 'refund requests' : filter} registrations`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-white/10 bg-slate-900/50">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Player
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Partner
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredRegistrations.map((registration) => (
                    <tr key={registration.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-400 font-semibold">
                              {registration.user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="text-white font-medium">{registration.user.name}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {registration.user.email}
                            </div>
                            {registration.user.phone && (
                              <div className="text-sm text-gray-500 flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {registration.user.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white">{registration.category.name}</div>
                        <div className="text-sm text-gray-500">
                          {registration.category.format} • {registration.category.gender}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {registration.partner ? (
                          <div>
                            <div className="text-white">{registration.partner.name}</div>
                            <div className="text-sm">
                              {registration.partnerConfirmed ? (
                                <span className="text-emerald-400 flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" /> Confirmed
                                </span>
                              ) : (
                                <span className="text-amber-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> Pending
                                </span>
                              )}
                            </div>
                          </div>
                        ) : registration.partnerEmail ? (
                          <div>
                            <div className="text-gray-400 text-sm">{registration.partnerEmail}</div>
                            <span className="text-amber-400 text-sm flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Pending
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-600">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white font-semibold">₹{registration.amountTotal}</div>
                        <div className="text-xs text-gray-500">{registration.paymentStatus}</div>
                      </td>
                      <td className="px-6 py-4">
                        {registration.paymentScreenshot ? (
                          <button
                            onClick={() => setScreenshotModal({
                              url: getImageUrl(registration.paymentScreenshot),
                              playerName: registration.user.name,
                              amount: registration.amountTotal
                            })}
                            className="group relative"
                          >
                            <img
                              src={getImageUrl(registration.paymentScreenshot)}
                              alt="Payment"
                              className="w-14 h-14 object-cover rounded-xl border-2 border-white/10 group-hover:border-blue-500/50 transition-all shadow-lg"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 rounded-xl flex items-center justify-center transition-all">
                              <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-all" />
                            </div>
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 text-gray-500">
                            <Image className="w-5 h-5" />
                            <span className="text-xs">None</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(registration.status)}
                          <span className={`badge ${getStatusBadge(registration.status)}`}>
                            {registration.status === 'cancellation_requested' ? 'Refund' : registration.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-sm">
                        {formatDateIndian(registration.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-center gap-2">
                          {registration.status === 'pending' && (
                            <span className="text-yellow-400 text-sm flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              Pending Admin Approval
                            </span>
                          )}
                          {registration.status === 'confirmed' && (
                            <span className="text-emerald-400 text-sm flex items-center gap-1">
                              <CheckCircle className="h-4 w-4" />
                              Registered
                            </span>
                          )}
                          {registration.status === 'rejected' && (
                            <span className="text-red-400 text-sm flex items-center gap-1">
                              <XCircle className="h-4 w-4" />
                              Rejected by Admin
                            </span>
                          )}
                          {registration.status === 'cancelled' && (
                            <span className="text-gray-400 text-sm flex items-center gap-1">
                              <XCircle className="h-4 w-4" />
                              Cancelled
                            </span>
                          )}
                          {registration.status === 'cancellation_requested' && (
                            <>
                              <button
                                onClick={() => setRefundQrModal({
                                  url: getImageUrl(registration.refundQrCode),
                                  playerName: registration.user.name,
                                  upiId: registration.refundUpiId,
                                  reason: registration.cancellationReason,
                                  amount: registration.refundAmount || registration.amountTotal
                                })}
                                className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors w-full flex items-center justify-center gap-1"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                                <span className="text-xs">Details</span>
                              </button>
                              <span className="text-orange-400 text-sm flex items-center gap-1">
                                <AlertTriangle className="h-4 w-4" />
                                Awaiting Admin Decision
                              </span>
                            </>
                          )}
                          {registration.status === 'cancelled' && registration.refundStatus === 'approved' && (
                            <button
                              onClick={() => openCompleteRefundModal(registration)}
                              disabled={actionLoading === registration.id}
                              className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors w-full flex items-center justify-center gap-1 disabled:opacity-50"
                              title="Mark Refund as Completed"
                            >
                              <CreditCard className="h-4 w-4" />
                              <span className="text-xs">Complete Refund</span>
                            </button>
                          )}
                          {registration.status === 'cancelled' && registration.refundStatus === 'completed' && (
                            <span className="text-green-400 text-sm flex items-center gap-1">
                              <CheckCircle className="h-4 w-4" />
                              Refund Completed
                            </span>
                          )}
                          {registration.status === 'cancelled' && !registration.refundStatus && (
                            <span className="text-gray-500 text-sm italic">No actions</span>
                          )}
                          {actionLoading === registration.id && (
                            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>


      {/* Screenshot Modal */}
      {screenshotModal && (
        <div 
          className="modal-overlay"
          onClick={() => setScreenshotModal(null)}
        >
          <div 
            className="bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-white/10 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
              <div>
                <h3 className="text-lg font-bold text-white">Payment Screenshot</h3>
                <p className="text-sm text-gray-400">
                  From <span className="text-blue-400 font-medium">{screenshotModal.playerName}</span> • ₹{screenshotModal.amount}
                </p>
              </div>
              <button
                onClick={() => setScreenshotModal(null)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            {/* Image */}
            <div className="p-4 bg-slate-900/50 max-h-[70vh] overflow-auto custom-scrollbar">
              <img
                src={screenshotModal.url}
                alt="Payment Screenshot"
                className="w-full h-auto rounded-xl shadow-lg"
              />
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-white/10 bg-slate-800/50 flex items-center justify-between">
              <p className="text-sm text-gray-400">
                Verify the payment amount matches ₹{screenshotModal.amount}
              </p>
              <button
                onClick={() => setScreenshotModal(null)}
                className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div 
          className="modal-overlay"
          onClick={() => setConfirmModal(null)}
        >
          <div 
            className="modal-content max-w-md animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Remove Modal */}
            {confirmModal.type === 'remove' && (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/30">
                    <Trash2 className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Remove Registration?</h3>
                  <p className="text-gray-400">
                    Remove <span className="text-red-400 font-medium">{confirmModal.registration.user.name}</span>'s registration permanently.
                  </p>
                </div>
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
                  <p className="text-sm text-red-300 font-medium mb-2">This will:</p>
                  <ul className="text-sm text-red-200/80 space-y-1">
                    <li>• Permanently delete the registration</li>
                    <li>• Cannot be undone</li>
                  </ul>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmModal(null)}
                    className="flex-1 py-3 px-4 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleRemove(confirmModal.registration.id)}
                    disabled={actionLoading}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:shadow-lg hover:shadow-red-500/30 transition-all font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {actionLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="w-5 h-5" />
                        Remove
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Refund Details Modal */}
      {refundQrModal && (
        <div 
          className="modal-overlay"
          onClick={() => setRefundQrModal(null)}
        >
          <div 
            className="bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden border border-white/10 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-orange-500/10 to-amber-500/10">
              <div>
                <h3 className="text-lg font-bold text-white">Refund Request Details</h3>
                <p className="text-sm text-gray-400">
                  From <span className="text-orange-400 font-medium">{refundQrModal.playerName}</span>
                </p>
              </div>
              <button
                onClick={() => setRefundQrModal(null)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {/* Refund Amount */}
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                <div className="flex items-center gap-2 text-emerald-400 mb-1">
                  <CreditCard className="w-5 h-5" />
                  <span className="font-medium">Refund Amount</span>
                </div>
                <p className="text-2xl font-bold text-white">₹{refundQrModal.amount}</p>
              </div>

              {/* UPI ID */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <div className="flex items-center gap-2 text-blue-400 mb-1">
                  <QrCode className="w-5 h-5" />
                  <span className="font-medium">Player's UPI ID</span>
                </div>
                <p className="text-lg font-mono text-white">{refundQrModal.upiId || 'Not provided'}</p>
              </div>

              {/* Cancellation Reason */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-medium">Reason for Cancellation</span>
                </div>
                <p className="text-white">{refundQrModal.reason || 'No reason provided'}</p>
              </div>

              {/* QR Code */}
              {refundQrModal.url && (
                <div className="bg-slate-900/80 border border-white/10 rounded-xl p-4">
                  <p className="text-sm font-medium text-gray-400 mb-3 text-center">Player's Payment QR Code</p>
                  <div className="p-3 bg-slate-800/50 border border-white/5 rounded-xl mx-auto max-w-xs">
                    <img
                      src={refundQrModal.url}
                      alt="Refund QR Code"
                      className="w-full rounded-lg shadow-lg"
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-white/10 bg-slate-800/50">
              <button
                onClick={() => setRefundQrModal(null)}
                className="w-full px-4 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Refund Modal - Upload Payment Screenshot */}
      {completeRefundModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-800/90 backdrop-blur-sm border border-white/10 rounded-2xl shadow-2xl max-w-lg w-full my-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Complete Refund</h2>
                    <p className="text-green-100 text-sm mt-1">Upload payment proof</p>
                  </div>
                </div>
                <button
                  onClick={() => setCompleteRefundModal(null)}
                  disabled={actionLoading}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors disabled:opacity-50"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="mb-6">
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-4">
                  <p className="text-gray-300 mb-2">
                    You are completing the refund for <span className="font-semibold text-white">{completeRefundModal.playerName}</span>
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Refund Amount:</span>
                    <span className="text-2xl font-bold text-white">₹{completeRefundModal.amount}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-gray-400">UPI ID:</span>
                    <span className="text-white font-mono">{completeRefundModal.upiId}</span>
                  </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
                  <p className="text-amber-300 text-sm">
                    <strong>Important:</strong> Please send ₹{completeRefundModal.amount} to the player's UPI ID via your UPI app (Google Pay, PhonePe, Paytm, etc.), then upload the payment screenshot as proof.
                  </p>
                </div>

                {/* Payment Screenshot Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Payment Screenshot <span className="text-red-400">*</span>
                  </label>
                  <p className="text-gray-500 text-sm mb-3">
                    Upload a screenshot of the successful payment from your UPI app
                  </p>
                  
                  <input
                    type="file"
                    id="payment-screenshot-input"
                    onChange={handlePaymentScreenshotChange}
                    accept="image/*"
                    className="hidden"
                  />
                  
                  <label
                    htmlFor="payment-screenshot-input"
                    className={`w-full px-4 py-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                      paymentScreenshot 
                        ? 'border-green-500/50 bg-green-500/10' 
                        : 'border-white/20 hover:border-white/30 hover:bg-slate-700/30'
                    }`}
                  >
                    {paymentScreenshot ? (
                      <>
                        <CheckCircle className="h-10 w-10 text-green-400" />
                        <span className="text-green-300 font-medium text-center">{paymentScreenshot.name}</span>
                        <span className="text-green-400/80 text-sm">Click to change</span>
                      </>
                    ) : (
                      <>
                        <Image className="h-10 w-10 text-gray-500" />
                        <span className="text-gray-400 font-medium">Upload Payment Screenshot</span>
                        <span className="text-gray-500 text-sm">PNG, JPG up to 5MB</span>
                      </>
                    )}
                  </label>
                  
                  {paymentScreenshotError && (
                    <p className="text-red-400 text-sm mt-2">{paymentScreenshotError}</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setCompleteRefundModal(null)}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-3 border border-white/10 rounded-xl text-gray-300 hover:bg-slate-700/50 transition-colors font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCompleteRefund}
                  disabled={actionLoading || !paymentScreenshot}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg hover:shadow-green-500/30 transition-all font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Mark as Completed
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

