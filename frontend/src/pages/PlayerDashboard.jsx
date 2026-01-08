import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

const PlayerDashboard = () => {
  const { user } = useAuth();
  const [matchHistory, setMatchHistory] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlayerData();
  }, []);

  const fetchPlayerData = async () => {
    try {
      // Fetch player's registrations
      const regResponse = await api.get('/registrations/my');
      setRegistrations(regResponse.data.registrations || []);
      
      // Match history would come from matches API
      // For now, we'll show registrations as activity
    } catch (error) {
      console.error('Error fetching player data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get user roles
  const userRoles = Array.isArray(user?.roles) ? user.roles : [user?.role];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Player Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user?.name}!</p>
        </div>

        {/* Player Profile Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl font-bold text-blue-600">
                {user?.name?.charAt(0)?.toUpperCase() || 'P'}
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-semibold text-gray-900">{user?.name}</h2>
                <p className="text-gray-500">{user?.email}</p>
                <div className="flex gap-2 mt-2">
                  {userRoles.map((role, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <Link
              to="/profile"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Edit Profile
            </Link>
          </div>

          {/* Player Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium text-gray-900">{user?.phone || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">City</p>
              <p className="font-medium text-gray-900">{user?.city || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">State</p>
              <p className="font-medium text-gray-900">{user?.state || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Gender</p>
              <p className="font-medium text-gray-900">{user?.gender || 'Not provided'}</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{user?.totalPoints || 0}</p>
            <p className="text-sm text-gray-500">Total Points</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{user?.tournamentsPlayed || 0}</p>
            <p className="text-sm text-gray-500">Tournaments</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{user?.matchesWon || 0}</p>
            <p className="text-sm text-gray-500">Matches Won</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{user?.matchesLost || 0}</p>
            <p className="text-sm text-gray-500">Matches Lost</p>
          </div>
        </div>

        {/* Match History */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Match History</h3>
            <Link
              to="/registrations"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View All
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : registrations.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🏸</div>
              <p className="text-gray-500 mb-4">No match history yet</p>
              <Link
                to="/tournaments"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Find Tournaments
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {registrations.slice(0, 5).map((reg) => (
                <div
                  key={reg.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {reg.tournament?.name || 'Tournament'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {reg.category?.name || 'Category'} • {new Date(reg.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    reg.status === 'confirmed' 
                      ? 'bg-green-100 text-green-700'
                      : reg.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {reg.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-6 flex gap-4">
          <Link
            to="/tournaments"
            className="flex-1 text-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Browse Tournaments
          </Link>
          <Link
            to="/leaderboard"
            className="flex-1 text-center px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            View Leaderboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PlayerDashboard;