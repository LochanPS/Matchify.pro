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
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="relative w-full max-w-4xl mx-4">
          <div className="absolute -inset-2 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-3xl blur-xl opacity-50"></div>
          <div className="relative bg-slate-800 rounded-2xl border border-slate-700 p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-slate-700 rounded w-1/3 mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-4 bg-slate-700 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="relative w-full max-w-md mx-4">
          <div className="absolute -inset-2 bg-gradient-to-r from-red-500 to-rose-500 rounded-3xl blur-xl opacity-50"></div>
          <div className="relative bg-slate-800 rounded-2xl border border-slate-700 p-8">
            <div className="text-center">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto p-4">
      <div className="relative w-full max-w-4xl my-8">
        {/* Halo Effect */}
        <div className="absolute -inset-2 bg-gradient-to-r from-teal-500 via-cyan-500 to-teal-500 rounded-3xl blur-xl opacity-50"></div>
        
        {/* Modal Content */}
        <div className="relative bg-slate-800 rounded-2xl border border-slate-700 p-8 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700">
            <h2 className="text-3xl font-bold text-white">User Details</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded-lg transition text-gray-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* User Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Profile Information */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative bg-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
                <h3 className="font-semibold text-white text-lg mb-4 flex items-center gap-2">
                  <span className="text-2xl">👤</span>
                  Profile Information
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Name:</span>
                    <span className="font-medium text-white">{user.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Email:</span>
                    <span className="font-medium text-white">{user.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Phone:</span>
                    <span className="font-medium text-white">{user.phone || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Role:</span>
                    <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      user.role === 'ADMIN' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      user.role === 'ORGANIZER' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                      user.role === 'UMPIRE' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                      'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Location:</span>
                    <span className="font-medium text-white">
                      {user.city && user.state ? `${user.city}, ${user.state}` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Joined:</span>
                    <span className="font-medium text-white">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative bg-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
                <h3 className="font-semibold text-white text-lg mb-4 flex items-center gap-2">
                  <span className="text-2xl">📊</span>
                  Statistics
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Wallet Balance:</span>
                    <span className="font-bold text-green-400">₹{user.walletBalance}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Registrations:</span>
                    <span className="font-medium text-white">{user.registrations?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tournaments Organized:</span>
                    <span className="font-medium text-white">{user.tournaments?.length || 0}</span>
                  </div>
                  {user.role === 'PLAYER' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Points:</span>
                        <span className="font-medium text-amber-400">{user.totalPoints || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Matches Won:</span>
                        <span className="font-medium text-green-400">{user.matchesWon || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Matches Lost:</span>
                        <span className="font-medium text-red-400">{user.matchesLost || 0}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Suspension Status */}
          {user.isSuspended && (
            <div className="relative mb-6">
              <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-rose-500 rounded-xl blur opacity-50"></div>
              <div className="relative bg-red-900/20 border border-red-500/50 rounded-xl p-4">
                <h3 className="font-semibold text-red-400 mb-2 flex items-center gap-2">
                  <span className="text-xl">⚠️</span>
                  Account Suspended
                </h3>
                <p className="text-sm text-red-300">
                  <strong>Until:</strong> {new Date(user.suspendedUntil).toLocaleString()}
                </p>
                {user.suspensionReason && (
                  <p className="text-sm text-red-300 mt-1">
                    <strong>Reason:</strong> {user.suspensionReason}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Recent Registrations */}
          {user.registrations && user.registrations.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-white text-lg mb-3 flex items-center gap-2">
                <span className="text-2xl">🎫</span>
                Recent Registrations
              </h3>
              <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-xl p-4 max-h-48 overflow-y-auto">
                <div className="space-y-2">
                  {user.registrations.map((reg) => (
                    <div key={reg.id} className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition">
                      <div>
                        <span className="font-medium text-white">{reg.tournament.name}</span>
                        <span className="text-gray-400 ml-2">- {reg.category.name}</span>
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
              <h3 className="font-semibold text-white text-lg mb-3 flex items-center gap-2">
                <span className="text-2xl">🏆</span>
                Organized Tournaments
              </h3>
              <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-xl p-4 max-h-48 overflow-y-auto">
                <div className="space-y-2">
                  {user.tournaments.map((tournament) => (
                    <div key={tournament.id} className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition">
                      <div>
                        <span className="font-medium text-white">{tournament.name}</span>
                        <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${
                          tournament.status === 'published' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                          tournament.status === 'draft' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                          'bg-gray-500/20 text-gray-400 border border-gray-500/30'
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
              <h3 className="font-semibold text-white text-lg mb-3 flex items-center gap-2">
                <span className="text-2xl">💰</span>
                Recent Transactions
              </h3>
              <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-xl p-4 max-h-48 overflow-y-auto">
                <div className="space-y-2">
                  {user.walletTransactions.map((txn) => (
                    <div key={txn.id} className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition">
                      <div>
                        <span className="font-medium text-white text-sm">{txn.description}</span>
                      </div>
                      <div className="text-right">
                        <span className={`font-bold text-sm ${
                          txn.type === 'CREDIT' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {txn.type === 'CREDIT' ? '+' : '-'}₹{txn.amount}
                        </span>
                        <span className="text-xs text-gray-500 ml-2 block">
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
          <div className="flex justify-end pt-4 border-t border-slate-700">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl blur opacity-50 group-hover:opacity-100 transition duration-300"></div>
              <button
                onClick={onClose}
                className="relative px-8 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white rounded-xl transition font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;
