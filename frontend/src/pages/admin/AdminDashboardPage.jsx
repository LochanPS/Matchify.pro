import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../../services/adminService';
import { getPaymentSettings } from '../../api/payment';

const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [paymentSettings, setPaymentSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsData, paymentData] = await Promise.all([
        adminService.getStats(),
        getPaymentSettings().catch(() => ({ data: null }))
      ]);
      setStats(statsData.stats);
      setPaymentSettings(paymentData.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-700 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-slate-800 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 p-8">
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 text-red-400">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      {/* Back Button */}
      <button
        onClick={() => window.history.back()}
        className="mb-6 flex items-center gap-2 text-gray-400 hover:text-teal-400 transition"
      >
        <span>←</span>
        <span>Back</span>
      </button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-gray-400">Welcome to Matchify.pro Admin Panel</p>
      </div>

      {/* PROMINENT QR SETTINGS CARD */}
      <div className="mb-8">
        <Link to="/admin/qr-settings">
          <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-xl p-8 border-2 border-teal-400 shadow-2xl shadow-teal-500/50 hover:shadow-teal-500/70 transition-all cursor-pointer group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="text-7xl group-hover:scale-110 transition-transform">📱</div>
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">Payment QR Code Settings</h2>
                  <p className="text-teal-100 text-lg mb-4">
                    Control ALL tournament payments across Matchify.pro
                  </p>
                  <div className="flex items-center gap-4">
                    {paymentSettings?.qrCodeUrl ? (
                      <>
                        <div className="bg-white/20 rounded-lg px-4 py-2">
                          <p className="text-white font-mono text-sm">{paymentSettings.upiId}</p>
                        </div>
                        <div className="bg-white/20 rounded-lg px-4 py-2">
                          <p className="text-white font-medium text-sm">{paymentSettings.accountHolder}</p>
                        </div>
                        <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                          ✅ Active
                        </span>
                      </>
                    ) : (
                      <span className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-bold animate-pulse">
                        ⚠️ QR Code Not Uploaded - Click to Upload
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-white text-4xl group-hover:translate-x-2 transition-transform">
                →
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-white/20">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-teal-100 text-sm">Your Power</p>
                  <p className="text-white font-bold text-lg">Upload QR Code</p>
                </div>
                <div>
                  <p className="text-teal-100 text-sm">Your Control</p>
                  <p className="text-white font-bold text-lg">Change UPI Details</p>
                </div>
                <div>
                  <p className="text-teal-100 text-sm">Your Platform</p>
                  <p className="text-white font-bold text-lg">All Payments to You</p>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <span className="text-4xl">👥</span>
            <div className="text-right">
              <p className="text-gray-400 text-sm">Total Users</p>
              <p className="text-3xl font-bold text-white mt-1">{stats?.totalUsers || 0}</p>
            </div>
          </div>
          {stats?.usersByRole && (
            <div className="mt-4 pt-4 border-t border-slate-700">
              <div className="text-xs text-gray-400 space-y-1">
                {Object.entries(stats.usersByRole).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span>{key}:</span>
                    <span className="font-semibold text-white">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <span className="text-4xl">🏆</span>
            <div className="text-right">
              <p className="text-gray-400 text-sm">Tournaments</p>
              <p className="text-3xl font-bold text-white mt-1">{stats?.totalTournaments || 0}</p>
            </div>
          </div>
          {stats?.tournamentsByStatus && (
            <div className="mt-4 pt-4 border-t border-slate-700">
              <div className="text-xs text-gray-400 space-y-1">
                {Object.entries(stats.tournamentsByStatus).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span>{key}:</span>
                    <span className="font-semibold text-white">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <span className="text-4xl">📝</span>
            <div className="text-right">
              <p className="text-gray-400 text-sm">Registrations</p>
              <p className="text-3xl font-bold text-white mt-1">{stats?.totalRegistrations || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <span className="text-4xl">💰</span>
            <div className="text-right">
              <p className="text-gray-400 text-sm">Total Revenue</p>
              <p className="text-3xl font-bold text-teal-400 mt-1">₹{stats?.totalRevenue || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link to="/admin/payment-verifications" className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg hover:shadow-teal-500/50 transition group">
          <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">💳</div>
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-teal-400 transition">
            Payment Verification
          </h3>
          <p className="text-gray-400 text-sm">Approve/reject payment screenshots</p>
        </Link>

        <Link to="/admin/organizer-payouts" className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg hover:shadow-teal-500/50 transition group">
          <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">💸</div>
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-teal-400 transition">
            Organizer Payouts
          </h3>
          <p className="text-gray-400 text-sm">Manage 50/50 payout installments</p>
        </Link>

        <Link to="/admin/revenue" className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg hover:shadow-teal-500/50 transition group">
          <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">📊</div>
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-teal-400 transition">
            Revenue Analytics
          </h3>
          <p className="text-gray-400 text-sm">Track your platform earnings</p>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
        <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
        {stats?.recentActivity && stats.recentActivity.length > 0 ? (
          <div className="space-y-3">
            {stats.recentActivity.map((activity, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-slate-900 rounded-lg border border-slate-700"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">
                      {activity.user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-white">{activity.user.name}</p>
                    <p className="text-sm text-gray-400">
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
