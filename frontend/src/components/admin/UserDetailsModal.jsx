import { useEffect, useState } from 'react';
import adminService from '../../services/adminService';

const UserDetailsModal = ({ userId, onClose }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUserDetails();
  }, [userId]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const data = await adminService.getUserDetails(userId);
      setUser(data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-4xl w-full mx-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-4 bg-gray-300 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-8 max-w-4xl w-full mx-4 my-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">User Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* User Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Profile */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Profile Information</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">Name:</span>
                <span className="ml-2 font-medium">{user.name}</span>
              </div>
              <div>
                <span className="text-gray-600">Email:</span>
                <span className="ml-2 font-medium">{user.email}</span>
              </div>
              <div>
                <span className="text-gray-600">Phone:</span>
                <span className="ml-2 font-medium">{user.phone || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-600">Role:</span>
                <span className="ml-2 font-medium">
                  <span className={`px-2 py-1 rounded text-xs ${
                    user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                    user.role === 'ORGANIZER' ? 'bg-blue-100 text-blue-800' :
                    user.role === 'UMPIRE' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role}
                  </span>
                </span>
              </div>
              <div>
                <span className="text-gray-600">Location:</span>
                <span className="ml-2 font-medium">
                  {user.city && user.state ? `${user.city}, ${user.state}` : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Joined:</span>
                <span className="ml-2 font-medium">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Statistics</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">Wallet Balance:</span>
                <span className="ml-2 font-medium">₹{user.walletBalance}</span>
              </div>
              <div>
                <span className="text-gray-600">Registrations:</span>
                <span className="ml-2 font-medium">{user.registrations?.length || 0}</span>
              </div>
              <div>
                <span className="text-gray-600">Tournaments Organized:</span>
                <span className="ml-2 font-medium">{user.tournaments?.length || 0}</span>
              </div>
              {user.role === 'PLAYER' && (
                <>
                  <div>
                    <span className="text-gray-600">Total Points:</span>
                    <span className="ml-2 font-medium">{user.totalPoints || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Matches Won:</span>
                    <span className="ml-2 font-medium">{user.matchesWon || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Matches Lost:</span>
                    <span className="ml-2 font-medium">{user.matchesLost || 0}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Suspension Status */}
        {user.isSuspended && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-red-900 mb-2">⚠️ Account Suspended</h3>
            <p className="text-sm text-red-800">
              <strong>Until:</strong> {new Date(user.suspendedUntil).toLocaleString()}
            </p>
            {user.suspensionReason && (
              <p className="text-sm text-red-800 mt-1">
                <strong>Reason:</strong> {user.suspensionReason}
              </p>
            )}
          </div>
        )}

        {/* Recent Registrations */}
        {user.registrations && user.registrations.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Recent Registrations</h3>
            <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
              <div className="space-y-2">
                {user.registrations.map((reg) => (
                  <div key={reg.id} className="text-sm flex justify-between items-center">
                    <div>
                      <span className="font-medium">{reg.tournament.name}</span>
                      <span className="text-gray-600 ml-2">- {reg.category.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(reg.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recent Tournaments (for organizers) */}
        {user.tournaments && user.tournaments.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Organized Tournaments</h3>
            <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
              <div className="space-y-2">
                {user.tournaments.map((tournament) => (
                  <div key={tournament.id} className="text-sm flex justify-between items-center">
                    <div>
                      <span className="font-medium">{tournament.name}</span>
                      <span className={`ml-2 px-2 py-1 rounded text-xs ${
                        tournament.status === 'published' ? 'bg-green-100 text-green-800' :
                        tournament.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {tournament.status}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(tournament.startDate).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Wallet Transactions */}
        {user.walletTransactions && user.walletTransactions.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Recent Transactions</h3>
            <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
              <div className="space-y-2">
                {user.walletTransactions.map((txn) => (
                  <div key={txn.id} className="text-sm flex justify-between items-center">
                    <div>
                      <span className="font-medium">{txn.description}</span>
                    </div>
                    <div className="text-right">
                      <span className={`font-semibold ${
                        txn.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {txn.type === 'CREDIT' ? '+' : '-'}₹{txn.amount}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        {new Date(txn.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Close Button */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;
