import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { getPartnerInvitation, confirmPartner } from '../api/partner';
import { useAuth } from '../contexts/AuthContext';
import { 
  CheckCircle, 
  XCircle, 
  Users, 
  MapPin, 
  Calendar, 
  Trophy,
  AlertTriangle,
  Loader2
} from 'lucide-react';

const PartnerConfirmationPage = () => {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState(null);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [action, setAction] = useState(null);

  useEffect(() => {
    fetchInvitation();
  }, [token]);

  const fetchInvitation = async () => {
    try {
      setLoading(true);
      const data = await getPartnerInvitation(token);
      setInvitation(data.invitation);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (confirmAction) => {
    try {
      setProcessing(true);
      setError('');

      if (confirmAction === 'accept' && !user) {
        navigate(`/login?redirect=/partner/confirm/${token}?action=accept`);
        return;
      }

      const data = await confirmPartner(token, confirmAction);
      setSuccess(true);
      setAction(confirmAction);

      setTimeout(() => {
        if (confirmAction === 'accept') {
          navigate('/registrations');
        } else {
          navigate('/');
        }
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process invitation');
      
      if (err.response?.data?.requiresLogin) {
        navigate(`/login?redirect=/partner/confirm/${token}?action=accept`);
      }
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-blob"></div>
          <div className="absolute top-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        </div>
        <div className="relative text-center">
          <div className="spinner-premium mx-auto mb-4"></div>
          <p className="text-gray-400">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl animate-blob"></div>
        </div>
        <div className="relative glass-card-dark max-w-md w-full p-8 text-center animate-scale-in">
          {action === 'accept' ? (
            <>
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Invitation Accepted!</h2>
              <p className="text-gray-400 mb-4">
                You've successfully accepted the partner invitation.
              </p>
              <div className="flex items-center justify-center gap-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Redirecting to your registrations...</span>
              </div>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/30">
                <XCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Invitation Declined</h2>
              <p className="text-gray-400 mb-4">
                You've declined the partner invitation.
              </p>
              <div className="flex items-center justify-center gap-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Redirecting to home page...</span>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500/10 rounded-full blur-3xl"></div>
        </div>
        <div className="relative glass-card-dark max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500/20 to-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Invalid Invitation</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="btn-premium w-full"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute top-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-40 right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative max-w-2xl mx-auto">
        {/* Header Card */}
        <div className="glass-card-dark overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8 text-center">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Partner Invitation</h1>
            <p className="mt-2 text-white/70">
              You've been invited to be a tournament partner
            </p>
          </div>

          <div className="p-6">
            {/* Player Info */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Invited by</h3>
              <div className="flex items-center space-x-3 bg-white/5 rounded-xl p-3">
                {invitation.player.profilePhoto ? (
                  <img
                    src={invitation.player.profilePhoto}
                    alt={invitation.player.name}
                    className="h-12 w-12 rounded-xl object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">
                      {invitation.player.name.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-semibold text-white">{invitation.player.name}</p>
                  <p className="text-sm text-gray-400">{invitation.player.email}</p>
                </div>
              </div>
            </div>

            {/* Tournament Info */}
            <div className="bg-white/5 rounded-xl p-4 mb-6">
              <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                Tournament Details
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-xs text-gray-500">Tournament</span>
                  <p className="font-semibold text-white">{invitation.tournament.name}</p>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div>
                    <span className="text-xs text-gray-500">Location</span>
                    <p className="text-gray-300">
                      {invitation.tournament.venue}, {invitation.tournament.city}, {invitation.tournament.state}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div>
                    <span className="text-xs text-gray-500">Dates</span>
                    <p className="text-gray-300">
                      {new Date(invitation.tournament.startDate).toLocaleDateString('en-IN')} -{' '}
                      {new Date(invitation.tournament.endDate).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Info */}
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Category</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white text-lg">{invitation.category.name}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="badge bg-purple-500/20 text-purple-400 border border-purple-500/30">
                      {invitation.category.format}
                    </span>
                    <span className="badge bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                      {invitation.category.gender}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Entry Fee</p>
                  <p className="text-2xl font-bold text-emerald-400">₹{invitation.category.entryFee}</p>
                </div>
              </div>
            </div>

            {/* Note */}
            {!user && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-300">
                    You'll need to log in or create an account to accept this invitation.
                  </p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="alert-error mb-6 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => handleConfirm('accept')}
                disabled={processing}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
              >
                {processing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircle className="w-5 h-5" />
                )}
                {processing ? 'Processing...' : 'Accept'}
              </button>
              <button
                onClick={() => handleConfirm('decline')}
                disabled={processing}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:shadow-lg hover:shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
              >
                {processing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
                {processing ? 'Processing...' : 'Decline'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerConfirmationPage;
