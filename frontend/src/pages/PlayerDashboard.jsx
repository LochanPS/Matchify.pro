import { useAuth } from '../contexts/AuthContext';

const PlayerDashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <span className="text-2xl mr-2">🎾</span>
              <h1 className="text-2xl font-bold text-gray-900">Matchify</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user?.name}</span>
              <button
                onClick={logout}
                className="btn-secondary"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                🏆 Player Dashboard
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Welcome to your player dashboard! Here you can manage your tournaments, track your progress, and more.
              </p>
              
              {/* User Info Card */}
              <div className="card max-w-md mx-auto">
                <div className="card-body">
                  <h3 className="text-xl font-semibold mb-4">Your Profile</h3>
                  <div className="space-y-2 text-left">
                    <p><strong>Name:</strong> {user?.name}</p>
                    <p><strong>Email:</strong> {user?.email}</p>
                    <p><strong>Role:</strong> <span className="badge-primary">{user?.role}</span></p>
                    <p><strong>Phone:</strong> {user?.phone || 'Not provided'}</p>
                    <p><strong>City:</strong> {user?.city || 'Not provided'}</p>
                    <p><strong>Total Points:</strong> {user?.totalPoints || 0}</p>
                    <p><strong>Tournaments Played:</strong> {user?.tournamentsPlayed || 0}</p>
                    <p><strong>Matches Won:</strong> {user?.matchesWon || 0}</p>
                    <p><strong>Matches Lost:</strong> {user?.matchesLost || 0}</p>
                    <p><strong>Wallet Balance:</strong> ₹{user?.walletBalance || 0}</p>
                  </div>
                </div>
              </div>

              {/* Coming Soon Features */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card">
                  <div className="card-body text-center">
                    <div className="text-3xl mb-2">🏆</div>
                    <h3 className="font-semibold">Tournaments</h3>
                    <p className="text-sm text-gray-600">Find and register for tournaments</p>
                    <div className="mt-2 text-xs text-gray-500">Coming in Day 8-10</div>
                  </div>
                </div>
                
                <div className="card">
                  <div className="card-body text-center">
                    <div className="text-3xl mb-2">💰</div>
                    <h3 className="font-semibold">Wallet</h3>
                    <p className="text-sm text-gray-600">Manage your tournament fees</p>
                    <div className="mt-2 text-xs text-gray-500">Coming in Day 11-13</div>
                  </div>
                </div>
                
                <div className="card">
                  <div className="card-body text-center">
                    <div className="text-3xl mb-2">📊</div>
                    <h3 className="font-semibold">Statistics</h3>
                    <p className="text-sm text-gray-600">Track your performance</p>
                    <div className="mt-2 text-xs text-gray-500">Coming in Day 14-16</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PlayerDashboard;