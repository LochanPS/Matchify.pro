import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Eye,
  Edit,
  BarChart3,
  Plus,
} from 'lucide-react';

export default function OrganizerDashboardPage() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/organizer/dashboard`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setDashboardData(response.data.data);
      setError('');
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-800',
      published: 'bg-blue-100 text-blue-800',
      ongoing: 'bg-green-100 text-green-800',
      completed: 'bg-purple-100 text-purple-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-red-600 text-lg mb-4">{error || 'Failed to load dashboard'}</p>
          <p className="text-gray-600 mb-6">
            There was an error loading your dashboard. Please check your connection and try again.
          </p>
          <button
            onClick={fetchDashboard}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const stats = {
    totalTournaments: dashboardData.total_tournaments,
    totalRegistrations: dashboardData.total_registrations,
    totalRevenue: dashboardData.revenue.total,
    activeTournaments: dashboardData.tournaments_by_status?.ongoing || 0,
  };

  // Check if organizer has no tournaments
  const hasNoTournaments = stats.totalTournaments === 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Organizer Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage your tournaments and registrations</p>
          </div>
          <button
            onClick={() => navigate('/tournaments/create')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Create Tournament
          </button>
        </div>

        {/* Empty State - First Tournament */}
        {hasNoTournaments ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="max-w-2xl mx-auto">
              <div className="text-6xl mb-6">🎾</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Welcome to Matchify.pro!
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                You haven't created any tournaments yet. Get started by creating your first tournament!
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                <h3 className="font-semibold text-blue-900 mb-3">💰 You have 25 free Matchify credits!</h3>
                <p className="text-blue-800 text-sm mb-2">
                  Each tournament creation costs 5 credits, so you can create up to 5 tournaments for free.
                </p>
                <p className="text-blue-700 text-xs">
                  Credits: 25 available | Cost per tournament: 5 credits
                </p>
              </div>
              <button
                onClick={() => navigate('/tournaments/create')}
                className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white text-lg rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
              >
                <Plus className="h-6 w-6" />
                Create Your First Tournament
              </button>
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl mb-2">📝</div>
                  <h4 className="font-semibold text-gray-900 mb-1">Easy Setup</h4>
                  <p className="text-sm text-gray-600">Create tournaments in minutes with our simple form</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl mb-2">👥</div>
                  <h4 className="font-semibold text-gray-900 mb-1">Manage Registrations</h4>
                  <p className="text-sm text-gray-600">Track participants and payments easily</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl mb-2">📊</div>
                  <h4 className="font-semibold text-gray-900 mb-1">Live Scoring</h4>
                  <p className="text-sm text-gray-600">Real-time match scoring and updates</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tournaments</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalTournaments}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Tournaments</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.activeTournaments}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Registrations</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalRegistrations}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  ₹{stats.totalRevenue.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Upcoming Tournaments */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Upcoming Tournaments</h2>
            </div>
            <div className="p-6">
              {dashboardData.upcoming_tournaments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No upcoming tournaments</p>
              ) : (
                <div className="space-y-4">
                  {dashboardData.upcoming_tournaments.map((tournament) => (
                    <div
                      key={tournament.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 cursor-pointer transition"
                      onClick={() => navigate(`/organizer/tournaments/${tournament.id}`)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900">{tournament.name}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          tournament.status === 'ongoing'
                            ? 'bg-green-100 text-green-800'
                            : tournament.status === 'published'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {tournament.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {tournament.city}, {tournament.state}
                      </p>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">
                          {new Date(tournament.start_date).toLocaleDateString()}
                        </span>
                        <span className="text-blue-600 font-medium">
                          {tournament.registration_count} registrations
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Registrations */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Recent Registrations</h2>
            </div>
            <div className="p-6">
              {dashboardData.recent_registrations.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No registrations yet</p>
              ) : (
                <div className="space-y-4">
                  {dashboardData.recent_registrations.map((reg) => (
                    <div key={reg.id} className="border-b border-gray-100 pb-4 last:border-0">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <p className="font-medium text-gray-900">{reg.player_name}</p>
                          <p className="text-sm text-gray-500">{reg.tournament_name}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          reg.payment_status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : reg.payment_status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {reg.payment_status}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">{reg.category_name}</span>
                        <span className="font-medium text-gray-900">₹{reg.amount_paid}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(reg.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tournament Status Breakdown */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Tournament Status Breakdown</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(dashboardData.tournaments_by_status || {}).map(([status, count]) => (
              <div key={status} className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-sm text-gray-600 capitalize">{status.replace('_', ' ')}</p>
              </div>
            ))}
            {Object.keys(dashboardData.tournaments_by_status || {}).length === 0 && (
              <div className="col-span-4 text-center text-gray-500 py-4">
                No tournaments yet
              </div>
            )}
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  );
}
