import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { getPartnerInvitation, confirmPartner } from '../api/partner';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircleIcon, XCircleIcon, UserGroupIcon } from '@heroicons/react/24/outline';

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

      // Check if user needs to login for accept action
      if (confirmAction === 'accept' && !user) {
        // Redirect to login with return URL
        navigate(`/login?redirect=/partner/confirm/${token}?action=accept`);
        return;
      }

      const data = await confirmPartner(token, confirmAction);
      setSuccess(true);
      setAction(confirmAction);

      // Redirect after 3 seconds
      setTimeout(() => {
        if (confirmAction === 'accept') {
          navigate('/registrations');
        } else {
          navigate('/');
        }
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process invitation');
      
      // If requires login, redirect
      if (err.response?.data?.requiresLogin) {
        navigate(`/login?redirect=/partner/confirm/${token}?action=accept`);
      }
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          {action === 'accept' ? (
            <>
              <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Invitation Accepted!</h2>
              <p className="text-gray-600 mb-4">
                You've successfully accepted the partner invitation.
              </p>
              <p className="text-sm text-gray-500">
                Redirecting to your registrations...
              </p>
            </>
          ) : (
            <>
              <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Invitation Declined</h2>
              <p className="text-gray-600 mb-4">
                You've declined the partner invitation.
              </p>
              <p className="text-sm text-gray-500">
                Redirecting to home page...
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-white text-center">
            <UserGroupIcon className="h-16 w-16 mx-auto mb-4" />
            <h1 className="text-3xl font-bold">Partner Invitation</h1>
            <p className="mt-2 text-blue-100">
              You've been invited to be a tournament partner
            </p>
          </div>

          <div className="p-6">
            {/* Player Info */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Invited by</h3>
              <div className="flex items-center space-x-3">
                {invitation.player.profilePhoto ? (
                  <img
                    src={invitation.player.profilePhoto}
                    alt={invitation.player.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-lg">
                      {invitation.player.name.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900">{invitation.player.name}</p>
                  <p className="text-sm text-gray-500">{invitation.player.email}</p>
                </div>
              </div>
            </div>

            {/* Tournament Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Tournament Details</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-600">Tournament:</span>
                  <p className="font-semibold text-gray-900">{invitation.tournament.name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Location:</span>
                  <p className="text-gray-900">
                    {invitation.tournament.venue}, {invitation.tournament.city}, {invitation.tournament.state}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Dates:</span>
                  <p className="text-gray-900">
                    {new Date(invitation.tournament.startDate).toLocaleDateString()} -{' '}
                    {new Date(invitation.tournament.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Category Info */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Category</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{invitation.category.name}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                      {invitation.category.format}
                    </span>
                    <span className="px-2 py-1 bg-cyan-100 text-cyan-700 text-xs rounded">
                      {invitation.category.gender}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Entry Fee</p>
                  <p className="text-xl font-bold text-gray-900">₹{invitation.category.entryFee}</p>
                </div>
              </div>
            </div>

            {/* Note */}
            {!user && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> You'll need to log in or create an account to accept this invitation.
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={() => handleConfirm('accept')}
                disabled={processing}
                className="flex-1 flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                {processing ? 'Processing...' : 'Accept Invitation'}
              </button>
              <button
                onClick={() => handleConfirm('decline')}
                disabled={processing}
                className="flex-1 flex items-center justify-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <XCircleIcon className="h-5 w-5 mr-2" />
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
