import { useState, useEffect } from 'react';
import adminService from '../../services/adminService';

const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await adminService.getStats();
      setStats(data.stats);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: '👥',
      color: 'blue',
      breakdown: stats?.usersByRole
    },
    {
      title: 'Total Tournaments',
      value: stats?.totalTournaments || 0,
      icon: '🏆',
      color: 'green',
      breakdown: stats?.tournamentsByStatus
    },
    {
      title: 'Total Registrations',
      value: stats?.totalRegistrations || 0,
      icon: '📝',
      color: 'purple'
    },
    {
      title: 'Total Revenue',
      value: `₹${stats?.totalRevenue || 0}`,
      icon: '💰',
      color: 'yellow'
    }
  ];

  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    purple: 'bg-purple-50 border-purple-200 text-purple-800',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800'
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Platform overview and statistics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, index) => (
          <div
            key={index}
            className={`border rounded-lg p-6 ${colorClasses[card.color]}`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-4xl">{card.icon}</span>
              <div className="text-right">
                <p className="text-sm font-medium opacity-75">{card.title}</p>
                <p className="text-3xl font-bold mt-1">{card.value}</p>
              </div>
            </div>
            {card.breakdown && (
              <div className="mt-4 pt-4 border-t border-current opacity-50">
                <div className="text-xs space-y-1">
                  {Object.entries(card.breakdown).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span>{key}:</span>
                      <span className="font-semibold">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
        {stats?.recentActivity && stats.recentActivity.length > 0 ? (
          <div className="space-y-3">
            {stats.recentActivity.map((activity, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold">
                      {activity.user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{activity.user.name}</p>
                    <p className="text-sm text-gray-600">
                      Registered for {activity.tournament.name} - {activity.category.name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    {new Date(activity.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No recent activity</p>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
