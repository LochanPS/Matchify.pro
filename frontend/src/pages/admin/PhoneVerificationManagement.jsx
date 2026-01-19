import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Phone, RefreshCw, Loader2, Copy, CheckCircle,
  User, Mail, FileText, Eye, AlertCircle
} from 'lucide-react';
import api from '../../utils/api';

export default function PhoneVerificationManagement() {
  const navigate = useNavigate();
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentKYC, setCurrentKYC] = useState(null);
  const [copiedOTP, setCopiedOTP] = useState(null);

  useEffect(() => {
    fetchPendingVerifications();
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchPendingVerifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchPendingVerifications = async () => {
    try {
      const response = await api.get('/admin/kyc/pending-phones');
      setPendingVerifications(response.data.pendingVerifications || []);
    } catch (error) {
      console.error('Failed to fetch pending verifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateOTP = async (kycId) => {
    setActionLoading(true);
    try {
      const response = await api.post(`/admin/kyc/${kycId}/generate-otp`);
      alert(`New OTP Generated: ${response.data.otp}\n\nSend this to: ${response.data.phone}\nOrganizer: ${response.data.organizerName}`);
      fetchPendingVerifications();
    } catch (error) {
      console.error('Failed to generate OTP:', error);
      alert('Failed to generate OTP');
    } finally {
      setActionLoading(false);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedOTP(id);
    setTimeout(() => setCopiedOTP(null), 2000);
  };

  const formatPhoneForWhatsApp = (phone) => {
    return `https://wa.me/91${phone}`;
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Phone Verification Management</h1>
            <p className="text-gray-300">Send OTP to organizers manually via WhatsApp or SMS</p>
          </div>
          <button
            onClick={fetchPendingVerifications}
            className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Instructions */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6 mb-8">
          <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-400" />
            Dual OTP System
          </h3>
          <div className="space-y-3 text-blue-200">
            <div>
              <p className="font-semibold text-blue-100 mb-1">🔹 Primary Method: Automatic Email OTP</p>
              <p className="text-sm">System automatically sends OTP to organizer's email when they submit phone number.</p>
            </div>
            <div>
              <p className="font-semibold text-blue-100 mb-1">🔹 Fallback Method: Manual WhatsApp/SMS</p>
              <p className="text-sm">If email fails, you can manually send OTP:</p>
              <ol className="list-decimal list-inside text-sm mt-2 space-y-1 ml-4">
                <li>Click "Generate New OTP" to create a fresh code</li>
                <li>Copy the OTP by clicking the copy button</li>
                <li>Click "Send via WhatsApp" to open WhatsApp</li>
                <li>Send the OTP to the organizer</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Pending Verifications */}
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Phone className="w-6 h-6 text-green-400" />
              Pending Phone Verifications ({pendingVerifications.length})
            </h2>
          </div>

          {pendingVerifications.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No pending phone verifications</p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {pendingVerifications.map((verification) => (
                <div key={verification.id} className="p-6 hover:bg-white/5 transition-colors">
                  <div className="flex items-start justify-between gap-6">
                    {/* Organizer Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">{verification.organizerName}</h3>
                          <p className="text-sm text-gray-400">
                            Submitted {new Date(verification.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-gray-300">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{verification.organizerEmail}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-mono">+91 {verification.phone}</span>
                        </div>
                      </div>

                      {/* Current OTP */}
                      {verification.otp && (
                        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-green-300 text-sm font-medium mb-1">Current OTP</p>
                              <p className="text-green-100 text-3xl font-bold font-mono tracking-wider">
                                {verification.otp}
                              </p>
                              {verification.otpGeneratedAt && (
                                <p className="text-green-400 text-xs mt-1">
                                  Generated {new Date(verification.otpGeneratedAt).toLocaleTimeString()}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => copyToClipboard(verification.otp, verification.id)}
                              className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg transition-colors flex items-center gap-2"
                            >
                              {copiedOTP === verification.id ? (
                                <>
                                  <CheckCircle className="w-4 h-4" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-4 h-4" />
                                  Copy OTP
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 min-w-[200px]">
                      <button
                        onClick={() => handleGenerateOTP(verification.id)}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Generate New OTP
                      </button>
                      
                      <a
                        href={formatPhoneForWhatsApp(verification.phone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg transition-colors flex items-center gap-2 text-center"
                      >
                        <Phone className="w-4 h-4" />
                        Send via WhatsApp
                      </a>
                      
                      <button
                        onClick={() => setCurrentKYC(verification)}
                        className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View Aadhaar
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
      {currentKYC && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-white/10 max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                <FileText className="w-6 h-6 text-purple-400" />
                Aadhaar Document
              </h3>
              <button
                onClick={() => setCurrentKYC(null)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <AlertCircle className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 mb-1">Organizer</p>
                  <p className="text-white font-medium">{currentKYC.organizerName}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Phone</p>
                  <p className="text-white font-medium font-mono">+91 {currentKYC.phone}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Email</p>
                  <p className="text-white font-medium">{currentKYC.organizerEmail}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Current OTP</p>
                  <p className="text-green-400 font-bold text-xl font-mono">{currentKYC.otp}</p>
                </div>
              </div>
              <img
                src={currentKYC.aadhaarImageUrl}
                alt="Aadhaar"
                className="w-full rounded-lg border border-white/10"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
