import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, CheckCircle, XCircle, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { requestVideoCall, getKYCStatus, rejoinCall } from '../../api/kyc';

export default function VideoCallPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('idle'); // idle, requesting, waiting, in-call, approved, rejected
  const [roomUrl, setRoomUrl] = useState(null);
  const [error, setError] = useState(null);
  const [kycData, setKycData] = useState(null);
  const [adminName, setAdminName] = useState('');

  useEffect(() => {
    checkKYCStatus();
  }, []);

  // Poll KYC status every 3 seconds when in call
  useEffect(() => {
    if (status === 'in-call') {
      const interval = setInterval(async () => {
        try {
          const data = await getKYCStatus();
          if (data.status === 'APPROVED') {
            setStatus('approved');
            clearInterval(interval);
          } else if (data.status === 'REJECTED') {
            setStatus('rejected');
            setKycData(data);
            clearInterval(interval);
          }
        } catch (err) {
          console.error('Status check error:', err);
        }
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [status]);

  const checkKYCStatus = async () => {
    try {
      const data = await getKYCStatus();
      setKycData(data);

      if (data.status === 'APPROVED') {
        setStatus('approved');
      } else if (data.status === 'REJECTED') {
        setStatus('rejected');
      } else if (data.status === 'IN_PROGRESS' && data.videoRoomUrl) {
        setRoomUrl(data.videoRoomUrl);
        setStatus('in-call');
      } else if (data.status === 'PENDING') {
        setStatus('idle');
      } else if (!data.status) {
        // No KYC submitted
        navigate('/organizer/kyc/submit');
      }
    } catch (err) {
      console.error('KYC status check error:', err);
      if (err.response?.status === 404) {
        navigate('/organizer/kyc/submit');
      }
    }
  };

  const handleRequestCall = async () => {
    setStatus('requesting');
    setError(null);

    try {
      const response = await requestVideoCall();
      setRoomUrl(response.roomUrl);
      setAdminName(response.adminName);
      setStatus('in-call');
    } catch (err) {
      console.error('Request call error:', err);
      setError(err.response?.data?.message || 'Failed to request video call');
      setStatus('idle');
    }
  };

  const handleRejoin = async () => {
    try {
      const response = await rejoinCall();
      setRoomUrl(response.roomUrl);
      setStatus('in-call');
    } catch (err) {
      setError('Failed to rejoin call');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Idle State - Ready to Request Call */}
      {status === 'idle' && (
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="max-w-2xl w-full">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-full mb-4">
                <Video className="w-10 h-10 text-green-400" />
              </div>
              <h1 className="text-4xl font-bold text-white mb-3">Ready for Video Verification?</h1>
              <p className="text-gray-300 text-lg">
                An admin will verify your identity via a short video call (2-3 minutes)
              </p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl border border-white/10 p-8 shadow-2xl">
              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white font-medium">Aadhaar Uploaded</p>
                    <p className="text-sm text-gray-400">Your document has been received</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Video className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white font-medium">Video Verification</p>
                    <p className="text-sm text-gray-400">Quick 2-3 minute call with admin</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-gray-500 font-medium">Instant Approval</p>
                    <p className="text-sm text-gray-600">Start organizing tournaments immediately</p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-400 font-medium">Unable to connect</p>
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                </div>
              )}

              <button
                onClick={handleRequestCall}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
              >
                <Video className="w-5 h-5" />
                Request Video Call
              </button>

              <p className="text-center text-sm text-gray-400 mt-4">
                Make sure your camera and microphone are working
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Requesting State - Finding Admin */}
      {status === 'requesting' && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-purple-400 animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Finding Available Admin...</h2>
            <p className="text-gray-400">This will only take a moment</p>
          </div>
        </div>
      )}

      {/* In Call State - Video Call Active */}
      {status === 'in-call' && roomUrl && (
        <div className="h-screen flex flex-col">
          {/* Header Banner */}
          <div className="bg-yellow-500/20 border-b border-yellow-500/30 px-6 py-3">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                <p className="text-yellow-300 font-medium">
                  📹 Video call in progress with {adminName || 'admin'}
                </p>
              </div>
              <p className="text-sm text-yellow-200">
                Admin will verify your Aadhaar
              </p>
            </div>
          </div>

          {/* Video Call Iframe */}
          <div className="flex-1 relative">
            <iframe
              src={roomUrl}
              allow="camera; microphone; fullscreen; display-capture"
              className="w-full h-full border-0"
              title="KYC Video Call"
            />
          </div>
        </div>
      )}

      {/* Approved State */}
      {status === 'approved' && (
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="max-w-2xl w-full text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-green-500/20 rounded-full mb-6">
              <CheckCircle className="w-12 h-12 text-green-400" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-3">KYC Approved! 🎉</h1>
            <p className="text-gray-300 text-lg mb-8">
              You can now create and manage tournaments on Matchify.pro
            </p>

            <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl border border-white/10 p-8 shadow-2xl mb-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-xl">
                  <span className="text-gray-300">Verification Status</span>
                  <span className="text-green-400 font-bold">✓ Approved</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-xl">
                  <span className="text-gray-300">Verified On</span>
                  <span className="text-white">{new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/organizer/tournaments/create')}
              className="w-full max-w-md mx-auto bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
            >
              Create Your First Tournament
              <CheckCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Rejected State */}
      {status === 'rejected' && (
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="max-w-2xl w-full text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-red-500/20 rounded-full mb-6">
              <XCircle className="w-12 h-12 text-red-400" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-3">KYC Not Approved</h1>
            <p className="text-gray-300 text-lg mb-8">
              Please resubmit with a clear Aadhaar photo
            </p>

            {kycData?.rejectionReason && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 mb-6">
                <p className="text-sm text-red-300 mb-2 font-medium">Rejection Reason:</p>
                <p className="text-red-400">{kycData.rejectionReason}</p>
              </div>
            )}

            <button
              onClick={() => navigate('/organizer/kyc/submit')}
              className="w-full max-w-md mx-auto bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white py-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Resubmit KYC
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
