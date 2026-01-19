import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Video, CheckCircle, XCircle, Loader2, AlertCircle, 
  FileText, User, Calendar, MapPin, Save, Eye, EyeOff, ArrowLeft, X
} from 'lucide-react';
import api from '../../utils/api';

export default function AdminVideoCallPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const kycId = searchParams.get('kycId');
  
  const [loading, setLoading] = useState(true);
  const [kycData, setKycData] = useState(null);
  const [roomUrl, setRoomUrl] = useState(null);
  const [showAadhaar, setShowAadhaar] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Aadhaar information form
  const [aadhaarInfo, setAadhaarInfo] = useState({
    aadhaarFullNumber: '',
    aadhaarName: '',
    aadhaarDOB: '',
    aadhaarAddress: '',
    aadhaarGender: ''
  });
  
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (kycId) {
      fetchKYCData();
    }
  }, [kycId]);

  const fetchKYCData = async () => {
    try {
      const response = await api.get(`/kyc/admin/kyc/${kycId}`);
      setKycData(response.data.kyc);
      setRoomUrl(response.data.kyc.videoRoomUrl);
      
      // Pre-fill if data exists
      if (response.data.kyc.aadhaarFullNumber) {
        setAadhaarInfo({
          aadhaarFullNumber: response.data.kyc.aadhaarFullNumber || '',
          aadhaarName: response.data.kyc.aadhaarName || '',
          aadhaarDOB: response.data.kyc.aadhaarDOB || '',
          aadhaarAddress: response.data.kyc.aadhaarAddress || '',
          aadhaarGender: response.data.kyc.aadhaarGender || ''
        });
      }
    } catch (error) {
      console.error('Failed to fetch KYC data:', error);
      alert('Failed to load KYC data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAadhaarInfo = async () => {
    if (!aadhaarInfo.aadhaarFullNumber || !aadhaarInfo.aadhaarName) {
      alert('Please fill in at least Aadhaar number and name');
      return;
    }

    setActionLoading(true);
    try {
      await api.post(`/kyc/admin/kyc/${kycId}/aadhaar-info`, aadhaarInfo);
      alert('Aadhaar information saved successfully');
    } catch (error) {
      console.error('Failed to save Aadhaar info:', error);
      alert('Failed to save Aadhaar information');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm(`Approve KYC for ${kycData?.organizerName}?`)) return;

    setActionLoading(true);
    try {
      await api.post(`/kyc/admin/approve/${kycId}`, {
        adminNotes: 'Verified via video call'
      });
      alert('KYC approved successfully!');
      navigate('/admin/kyc');
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
      await api.post(`/kyc/admin/reject/${kycId}`, {
        rejectionReason,
        adminNotes: rejectionReason
      });
      alert('KYC rejected');
      navigate('/admin/kyc');
    } catch (error) {
      console.error('Failed to reject KYC:', error);
      alert('Failed to reject KYC');
    } finally {
      setActionLoading(false);
      setShowRejectModal(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
      </div>
    );
  }

  if (!kycData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-white text-xl mb-4">KYC data not found</p>
          <button
            onClick={() => navigate('/admin/kyc')}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors"
          >
            Back to KYC Management
          </button>
        </div>
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
          <h1 className="text-4xl font-bold text-white mb-2">Video Call Verification</h1>
          <p className="text-gray-300">Conduct video call and verify organizer identity</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Video Call */}
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Video className="w-6 h-6 text-blue-400" />
                Video Call
              </h2>
            </div>
            <div className="p-6">
              {roomUrl ? (
                <div className="space-y-4">
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                    <p className="text-blue-300 text-sm mb-2">
                      <strong>Instructions:</strong>
                    </p>
                    <ul className="text-blue-200 text-sm space-y-1 list-disc list-inside">
                      <li>Verify organizer's face matches Aadhaar photo</li>
                      <li>Ask organizer to show physical Aadhaar card</li>
                      <li>Fill in Aadhaar details below during call</li>
                      <li>Save information before approving</li>
                    </ul>
                  </div>
                  <iframe
                    src={roomUrl}
                    allow="camera; microphone; fullscreen; display-capture"
                    className="w-full h-[500px] rounded-xl border border-white/10"
                  />
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                  <p className="text-gray-300">No video room available</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Organizer Info & Aadhaar */}
          <div className="space-y-6">
            {/* Organizer Information */}
            <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <User className="w-6 h-6 text-purple-400" />
                  Organizer Information
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Name</p>
                  <p className="text-white font-medium text-lg">{kycData.organizerName}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Email</p>
                  <p className="text-white font-medium">{kycData.organizerEmail}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Phone</p>
                  <p className="text-white font-medium">{kycData.organizerPhone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Status</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    kycData.status === 'PENDING' 
                      ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' 
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}>
                    {kycData.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Aadhaar Document */}
            <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <FileText className="w-6 h-6 text-green-400" />
                  Aadhaar Document
                </h2>
                <button
                  onClick={() => setShowAadhaar(!showAadhaar)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  {showAadhaar ? (
                    <EyeOff className="w-5 h-5 text-gray-400" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
              <div className="p-6">
                {showAadhaar ? (
                  <img
                    src={kycData.aadhaarImageUrl}
                    alt="Aadhaar"
                    className="w-full rounded-lg border border-white/10"
                  />
                ) : (
                  <div className="text-center py-12">
                    <EyeOff className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">Aadhaar hidden for privacy</p>
                  </div>
                )}
              </div>
            </div>

            {/* Aadhaar Information Form */}
            <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <FileText className="w-6 h-6 text-orange-400" />
                  Aadhaar Details
                </h2>
                <p className="text-gray-400 text-sm mt-1">Fill in details from Aadhaar card during video call</p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-gray-300 mb-2 text-sm">
                    Aadhaar Number (12 digits) *
                  </label>
                  <input
                    type="text"
                    value={aadhaarInfo.aadhaarFullNumber}
                    onChange={(e) => setAadhaarInfo({ ...aadhaarInfo, aadhaarFullNumber: e.target.value })}
                    placeholder="XXXX XXXX XXXX"
                    maxLength={14}
                    className="w-full px-4 py-3 bg-slate-700/50 text-white rounded-xl border border-white/10 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2 text-sm">
                    Name on Aadhaar *
                  </label>
                  <input
                    type="text"
                    value={aadhaarInfo.aadhaarName}
                    onChange={(e) => setAadhaarInfo({ ...aadhaarInfo, aadhaarName: e.target.value })}
                    placeholder="Full name as on Aadhaar"
                    className="w-full px-4 py-3 bg-slate-700/50 text-white rounded-xl border border-white/10 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2 text-sm">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={aadhaarInfo.aadhaarDOB}
                    onChange={(e) => setAadhaarInfo({ ...aadhaarInfo, aadhaarDOB: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-700/50 text-white rounded-xl border border-white/10 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2 text-sm">
                    Gender
                  </label>
                  <select
                    value={aadhaarInfo.aadhaarGender}
                    onChange={(e) => setAadhaarInfo({ ...aadhaarInfo, aadhaarGender: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-700/50 text-white rounded-xl border border-white/10 focus:outline-none focus:border-purple-500"
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 mb-2 text-sm">
                    Address
                  </label>
                  <textarea
                    value={aadhaarInfo.aadhaarAddress}
                    onChange={(e) => setAadhaarInfo({ ...aadhaarInfo, aadhaarAddress: e.target.value })}
                    placeholder="Address as on Aadhaar"
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-700/50 text-white rounded-xl border border-white/10 focus:outline-none focus:border-purple-500 resize-none"
                  />
                </div>

                <button
                  onClick={handleSaveAadhaarInfo}
                  disabled={actionLoading}
                  className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {actionLoading ? 'Saving...' : 'Save Aadhaar Information'}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
              <div className="space-y-3">
                <button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="w-full px-6 py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  {actionLoading ? 'Processing...' : 'Approve KYC'}
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={actionLoading}
                  className="w-full px-6 py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <XCircle className="w-5 h-5" />
                  Reject KYC
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-white/10 max-w-md w-full">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Reject KYC</h3>
              <button
                onClick={() => setShowRejectModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-300 mb-4">
                Please provide a reason for rejecting {kycData.organizerName}'s KYC:
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Face does not match Aadhaar photo, document appears fake, etc."
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
