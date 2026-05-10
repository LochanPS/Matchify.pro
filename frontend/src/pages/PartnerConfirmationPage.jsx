import { getErrorMessage } from '../utils/errorMessage';
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

const BRAND = {
  bg: '#07071a',
  cardDark: '#0d1025',
  card: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
  green: '#00ff88',
  cyan: '#00d4ff',
  purple: '#a855f7',
  amber: '#fbbf24',
};

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
      setError(getErrorMessage(err, 'Failed to load invitation'));
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
      setError(getErrorMessage(err, 'Failed to process invitation'));

      if (err.response?.data?.requiresLogin) {
        navigate(`/login?redirect=/partner/confirm/${token}?action=accept`);
      }
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BRAND.bg }}>
        <div className="fixed top-0 bottom-0 pointer-events-none overflow-hidden" style={{ left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "480px" }}>
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl opacity-[0.08]" style={{ background: BRAND.cyan }} />
          <div className="absolute top-40 -left-40 w-80 h-80 rounded-full blur-3xl opacity-[0.06]" style={{ background: BRAND.purple }} />
        </div>
        <div className="relative text-center">
          <div className="w-12 h-12 rounded-full border-4 border-t-transparent mx-auto animate-spin mb-4"
            style={{ borderColor: `${BRAND.green} transparent transparent transparent` }} />
          <p style={{ color: 'rgba(255,255,255,0.5)' }}>Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: BRAND.bg }}>
        <div className="fixed top-0 bottom-0 pointer-events-none overflow-hidden" style={{ left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "480px" }}>
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl opacity-[0.08]" style={{ background: BRAND.green }} />
        </div>
        <div className="relative rounded-2xl max-w-md w-full p-8 text-center"
          style={{ background: BRAND.cardDark, border: `1px solid ${BRAND.border}` }}>
          {action === 'accept' ? (
            <>
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'linear-gradient(135deg,#00ff88,#00d4ff)', boxShadow: '0 8px 30px rgba(0,255,136,0.3)' }}>
                <CheckCircle className="w-10 h-10" style={{ color: '#07071a' }} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Invitation Accepted!</h2>
              <p className="mb-4" style={{ color: 'rgba(255,255,255,0.55)' }}>
                You've successfully accepted the partner invitation.
              </p>
              <div className="flex items-center justify-center gap-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Redirecting to your registrations...</span>
              </div>
            </>
          ) : (
            <>
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'linear-gradient(135deg,#f87171,#dc2626)', boxShadow: '0 8px 30px rgba(239,68,68,0.3)' }}>
                <XCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Invitation Declined</h2>
              <p className="mb-4" style={{ color: 'rgba(255,255,255,0.55)' }}>
                You've declined the partner invitation.
              </p>
              <div className="flex items-center justify-center gap-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
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
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: BRAND.bg }}>
        <div className="fixed top-0 bottom-0 pointer-events-none overflow-hidden" style={{ left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "480px" }}>
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl opacity-[0.06]" style={{ background: '#f87171' }} />
        </div>
        <div className="relative rounded-2xl max-w-md w-full p-8 text-center"
          style={{ background: BRAND.cardDark, border: `1px solid ${BRAND.border}` }}>
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(239,68,68,0.15)' }}>
            <XCircle className="w-10 h-10" style={{ color: '#f87171' }} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Invalid Invitation</h2>
          <p className="mb-6" style={{ color: 'rgba(255,255,255,0.55)' }}>{error}</p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 rounded-xl font-bold text-sm"
            style={{ background: 'linear-gradient(135deg,#00ff88,#00d4ff)', color: '#07071a' }}
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4" style={{ background: BRAND.bg }}>
      {/* Background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl opacity-[0.06]" style={{ background: BRAND.cyan }} />
        <div className="absolute top-40 -left-40 w-80 h-80 rounded-full blur-3xl opacity-[0.05]" style={{ background: BRAND.purple }} />
        <div className="absolute bottom-40 right-40 w-80 h-80 rounded-full blur-3xl opacity-[0.04]" style={{ background: BRAND.green }} />
      </div>

      <div className="relative max-w-2xl mx-auto">
        {/* Header Card */}
        <div className="rounded-2xl overflow-hidden" style={{ background: BRAND.cardDark, border: `1px solid ${BRAND.border}` }}>
          <div className="px-6 py-8 text-center"
            style={{ background: 'linear-gradient(135deg,rgba(0,212,255,0.15),rgba(168,85,247,0.15))' }}>
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
              <Users className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Partner Invitation</h1>
            <p className="mt-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
              You've been invited to be a tournament partner
            </p>
          </div>

          <div className="p-6">
            {/* Player Info */}
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-3" style={{ color: 'rgba(255,255,255,0.45)' }}>Invited by</h3>
              <div className="flex items-center space-x-3 rounded-xl p-3" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                {invitation.player.profilePhoto ? (
                  <img
                    src={invitation.player.profilePhoto}
                    alt={invitation.player.name}
                    className="h-12 w-12 rounded-xl object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg,#00d4ff,#a855f7)' }}>
                    <span className="text-white font-semibold text-lg">
                      {invitation.player.name.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-semibold text-white">{invitation.player.name}</p>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>{invitation.player.email}</p>
                </div>
              </div>
            </div>

            {/* Tournament Info */}
            <div className="rounded-xl p-4 mb-6" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
                <Trophy className="w-4 h-4" style={{ color: BRAND.amber }} />
                Tournament Details
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Tournament</span>
                  <p className="font-semibold text-white">{invitation.tournament.name}</p>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }} />
                  <div>
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Location</span>
                    <p style={{ color: 'rgba(255,255,255,0.7)' }}>
                      {invitation.tournament.venue}, {invitation.tournament.city}, {invitation.tournament.state}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }} />
                  <div>
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Dates</span>
                    <p style={{ color: 'rgba(255,255,255,0.7)' }}>
                      {new Date(invitation.tournament.startDate).toLocaleDateString('en-IN')} -{' '}
                      {new Date(invitation.tournament.endDate).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Info */}
            <div className="rounded-xl p-4 mb-6"
              style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.2)' }}>
              <h3 className="text-sm font-medium mb-3" style={{ color: 'rgba(255,255,255,0.45)' }}>Category</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white text-lg">{invitation.category.name}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-semibold"
                      style={{ background: 'rgba(168,85,247,0.15)', color: BRAND.purple, border: '1px solid rgba(168,85,247,0.3)' }}>
                      {invitation.category.format}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-semibold"
                      style={{ background: 'rgba(0,212,255,0.15)', color: BRAND.cyan, border: '1px solid rgba(0,212,255,0.3)' }}>
                      {invitation.category.gender}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Entry Fee</p>
                  <p className="text-2xl font-bold" style={{ color: BRAND.green }}>&#8377;{invitation.category.entryFee}</p>
                </div>
              </div>
            </div>

            {/* Note */}
            {!user && (
              <div className="rounded-xl p-4 mb-6"
                style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.3)' }}>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: BRAND.amber }} />
                  <p className="text-sm" style={{ color: 'rgba(251,191,36,0.9)' }}>
                    You'll need to log in or create an account to accept this invitation.
                  </p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 flex items-center gap-2 px-4 py-3 rounded-xl"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}>
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => handleConfirm('accept')}
                disabled={processing}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                style={{ background: 'linear-gradient(135deg,#00ff88,#00d4ff)', color: '#07071a', boxShadow: '0 4px 20px rgba(0,255,136,0.3)' }}
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
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                style={{ background: 'linear-gradient(135deg,#f87171,#dc2626)', color: '#fff', boxShadow: '0 4px 20px rgba(239,68,68,0.3)' }}
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
