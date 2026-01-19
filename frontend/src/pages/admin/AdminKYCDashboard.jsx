import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ToggleLeft, ToggleRight, Video, CheckCircle, XCircle, 
  Clock, User, Mail, Phone, FileText, Loader2, Eye, ArrowLeft
} from 'lucide-react';
import { 
  getPendingKYCs, 
  toggleAvailability, 
  approveKYC, 
  rejectKYC,
  getKYCStats 
} from '../../api/kyc';

export default function AdminKYCDashboard() {
  const navigate = useNavigate();
  const [available, setAvailable] = useState(false);
  const [pendingKYCs, setPendingKYCs] = useState([]);
  const [stats, setStats] = useState({ pending: 0, inProgress: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [currentKYC, setCurrentKYC] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchData();
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [kycsData, statsData] = await Promise.all([
        getPendingKYCs(),
        getKYCStats()
      ]);
      setPendingKYCs(kycsData.kycs || []);
      setStats(statsData.stats || {});
    } catch (error) {
      console.error('Failed to fetch KYC data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async () => {
    try {
      const newStatus = !available;
      await toggleAvailability(newStatus);
      setAvailable(newStatus);
    } catch (error) {
      console.error('Failed to toggle availability:', error);
      alert('Failed to update availability');
    }
  };

  const handleApprove = async (kyc) => {
    if (!confirm(`Approve KYC for ${kyc.organizerName}?`)) return;

    setActionLoading(true);
    try {
      await approveKYC(kyc.id, {
        adminNotes: 'Verified successfully via video call'
      });
      alert('KYC approved successfully!');
      fetchData();
      setCurrentKYC(null);
    } catch (error) {
      console.error('Failed to approve KYC:', error);
      alert('Failed to approve KYC');
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
      await rejectKYC(currentKYC.id, {
        rejectionReason,
        adminNotes: rejectionReason
      });
      alert('KYC rejected');
      fetchData();
      setCurrentKYC(null);
      setShowRejectModal(false);
      setRejectionReason('');
    } catch (error) {
      console.error('Failed to reject KYC:', error);
      alert('Failed to reject KYC');
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectModal = (kyc) => {
    setCurrentKYC(kyc);
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
          onClick={() => navigate('/admin/dashboard')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group mb-6"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Admin Dashboard</span>
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">KYC Management</h1>
          <p className="text-gray-300">Review and approve organizer KYC submissions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-yellow-400" />
              <span className="text-3xl font-bold text-yellow-300">{stats.pending || 0}</span>
            </div>
            <p className="text-yellow-200 font-medium">Pending</p>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <Video className="w-8 h-8 text-blue-400" />
              <span className="text-3xl font-bold text-blue-300">{stats.inProgress || 0}</span>
            </div>
            <p className="text-blue-200 font-medium">In Progress</p>
          </div>

          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-green-400" />
              <span className="text-3xl font-bold text-green-300">{stats.approved || 0}</span>
            </div>
            <p className="text-green-200 font-medium">Approved</p>
          </div>

          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <XCircle className="w-8 h-8 text-red-400" />
              <span className="text-3xl font-bold text-red-300">{stats.rejected || 0}</span>
            </div>
            <p className="text-red-200 font-medium">Rejected</p>
          </div>
        </div>

        {/* Availability Toggle */}
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl border border-white/10 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Available for KYC Calls</h3>
              <p className="text-gray-400">
                {available 
                  ? 'You will receive notifications when organizers request video calls' 
                  : 'Turn on to start receiving KYC verification requests'}
              </p>
            </div>
            <button
              onClick={handleToggleAvailability}
              className={`relative w-20 h-10 rounded-full transition-all ${
                available ? 'bg-green-500' : 'bg-gray-600'
              }`}
            >
              <div
                className={`absolute top-1 w-8 h-8 bg-white rounded-full transition-transform ${
                  available ? 'translate-x-11' : 'translate-x-1'
                }`}
              >
                {available ? (
                  <ToggleRight className="w-8 h-8 text-green-500" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-gray-600" />
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Pending KYCs List */}
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-2xl font-bold text-white">Pending KYC Verifications</h2>
          </div>

          {pendingKYCs.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No pending KYC verifications</p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {pendingKYCs.map((kyc) => (
                <div key={kyc.id} className="p-6 hover:bg-white/5 transition-colors">
                  <div className="flex items-start justify-between">
                    {/* Organizer Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">{kyc.organizerName}</h3>
                          <p className="text-sm text-gray-400">
                            Submitted {new Date(kyc.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-gray-300">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{kyc.organizerEmail}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{kyc.organizerPhone || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          kyc.status === 'PENDING' 
                            ? 'bg-yellow-500/20 text-yellow-300' 
                            : 'bg-blue-500/20 text-blue-300'
                        }`}>
                          {kyc.status}
                        </span>
                        {kyc.videoCallStartedAt && (
                          <span className="text-xs text-gray-400">
                            Call started {new Date(kyc.videoCallStartedAt).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 ml-6">
                      <button
                        onClick={() => setCurrentKYC(kyc)}
                        className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View Aadhaar
                      </button>
                      <button
                        onClick={() => handleApprove(kyc)}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => openRejectModal(kyc)}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* View Aadhaar Modal */}
      {currentKYC && !showRejectModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-white/10 max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-white">Aadhaar Document</h3>
              <button
                onClick={() => setCurrentKYC(null)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <XCircle className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <p className="text-gray-400 mb-2">Organizer: <span className="text-white font-medium">{currentKYC.organizerName}</span></p>
                <p className="text-gray-400">Email: <span className="text-white font-medium">{currentKYC.organizerEmail}</span></p>
              </div>
              <img
                src={currentKYC.aadhaarImageUrl}
                alt="Aadhaar"
                className="w-full rounded-lg border border-white/10"
              />
              <div className="mt-6 flex gap-4">
                <button
                  onClick={() => handleApprove(currentKYC)}
                  disabled={actionLoading}
                  className="flex-1 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Approve KYC'}
                </button>
                <button
                  onClick={() => {
                    setShowRejectModal(true);
                  }}
                  disabled={actionLoading}
                  className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  Reject KYC
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && currentKYC && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-white/10 max-w-md w-full">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-xl font-bold text-white">Reject KYC</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-300 mb-4">
                Please provide a reason for rejecting {currentKYC.organizerName}'s KYC:
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Aadhaar photo is unclear, face does not match, etc."
                rows={4}
                className="w-full px-4 py-3 bg-slate-700/50 text-white rounded-xl border border-white/10 focus:outline-none focus:border-purple-500 resize-none"
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
                  {actionLoading ? 'Rejecting...' : 'Reject KYC'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
