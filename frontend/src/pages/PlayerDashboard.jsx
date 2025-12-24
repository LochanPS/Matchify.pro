import { useAuth } from '../contexts/AuthContext';

const PlayerDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              🏆 Player Dashboard
            </h1>
            <p className="text-lg text-gray-600 mt-2">
              Welcome back, {user?.name}! Here's your badminton journey.
            </p>
          </div>
          
          {/* User Info Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <div className="card">
                <div className="card-body">
                  <h3 className="text-xl font-semibold mb-4">Your Profile</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Name</p>
                      <p className="font-medium">{user?.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Email</p>
                      <p className="font-medium">{user?.email}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Role</p>
                      <span className="badge-primary">{user?.role}</span>
                    </div>
                    <div>
                      <p className="text-gray-500">Phone</p>
                      <p className="font-medium">{user?.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">City</p>
                      <p className="font-medium">{user?.city || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">State</p>
                      <p className="font-medium">{user?.state || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <div className="card">
                <div className="card-body">
                  <h3 className="text-xl font-semibold mb-4">Quick Stats</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Points</span>
                      <span className="font-bold text-primary-600">{user?.totalPoints || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tournaments</span>
                      <span className="font-medium">{user?.tournamentsPlayed || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Matches Won</span>
                      <span className="font-medium text-success-600">{user?.matchesWon || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Matches Lost</span>
                      <span className="font-medium text-error-600">{user?.matchesLost || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Wallet Balance</span>
                      <span className="font-bold text-success-600">₹{user?.walletBalance || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Coming Soon Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card hover:shadow-lg transition-shadow">
              <div className="card-body text-center">
                <div className="text-4xl mb-4">🏆</div>
                <h3 className="text-lg font-semibold mb-2">Tournaments</h3>
                <p className="text-sm text-gray-600 mb-4">Find and register for tournaments</p>
                <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Coming in Day 8-10</div>
              </div>
            </div>
            
            <div className="card hover:shadow-lg transition-shadow">
              <div className="card-body text-center">
                <div className="text-4xl mb-4">💰</div>
                <h3 className="text-lg font-semibold mb-2">Wallet</h3>
                <p className="text-sm text-gray-600 mb-4">Manage your tournament fees</p>
                <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Coming in Day 11-13</div>
              </div>
            </div>
            
            <div className="card hover:shadow-lg transition-shadow">
              <div className="card-body text-center">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-lg font-semibold mb-2">Statistics</h3>
                <p className="text-sm text-gray-600 mb-4">Track your performance</p>
                <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Coming in Day 14-16</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PlayerDashboard;