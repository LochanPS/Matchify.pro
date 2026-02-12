import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { superAdminAPI } from '../api/superAdmin';
import {
  Users, Trophy, TrendingUp, LogOut, QrCode, CreditCard, Building2
} from 'lucide-react';
import NotificationBell from '../components/NotificationBell';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTournaments: 0,
    liveTournaments: 0,
    completedTournaments: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);

  // Navigation handler
  const handleNavigation = (url) => {
    console.log('NAVIGATING TO:', url);
    window.location.href = url;
  };

  useEffect(() => {
    if (!user?.isAdmin) {
      navigate('/login');
      return;
    }
    fetchStats();
  }, [user, navigate]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const statsRes = await superAdminAPI.getStats();
      const statsData = statsRes.data.stats;
      
      setStats({
        totalUsers: statsData.totalUsers || 0,
        totalTournaments: statsData.totalTournaments || 0,
        liveTournaments: statsData.tournamentsByStatus?.ongoing || 0,
        completedTournaments: statsData.tournamentsByStatus?.completed || 0,
        totalRevenue: statsData.totalRevenue || 0
      });
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <h1 className="text-2xl font-bold text-white">MATCHIFY.PRO</h1>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-red-600 text-white text-sm font-bold rounded">
                  ADMIN
                </span>
                <NotificationBell />
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Top Navigation Tabs */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {[
              { id: 'dashboard', label: 'Dashboard', url: null },
              { id: 'users', label: 'Users', url: '/admin/users' },
              { id: 'tournaments', label: 'Tournaments', url: '/tournaments' },
              { id: 'academies', label: 'Academies', url: '/admin/academies' },
              { id: 'revenue', label: 'Revenue', url: '/admin/revenue' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (tab.url) {
                    console.log(`Navigating to ${tab.url}`);
                    window.location.href = tab.url;
                  } else {
                    setActiveTab(tab.id);
                  }
                }}
                className={`px-6 py-4 font-medium transition cursor-pointer ${
                  activeTab === tab.id
                    ? 'text-teal-400 border-b-2 border-teal-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Users */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-600 rounded-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-1">Total Users</p>
            <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
          </div>

          {/* Live Tournaments */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-600 rounded-lg">
                <Trophy className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-1">Live Tournaments</p>
            <p className="text-3xl font-bold text-white">{stats.liveTournaments}</p>
          </div>

          {/* Completed Tournaments */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-600 rounded-lg">
                <Trophy className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-1">Completed Tournaments</p>
            <p className="text-3xl font-bold text-white">{stats.completedTournaments}</p>
          </div>

          {/* Total Revenue */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-teal-600 rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-white">₹{stats.totalRevenue.toLocaleString()}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* QR Settings */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl blur-lg opacity-50 group-hover:opacity-100 transition duration-300"></div>
            <div
              onClick={() => handleNavigation('/admin/qr-settings')}
              className="relative w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 rounded-xl p-6 text-left transition shadow-lg cursor-pointer"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="p-3 bg-white/20 rounded-lg">
                  <QrCode className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">QR Settings</h3>
              </div>
              <p className="text-teal-100 text-sm">
                Upload and manage payment QR code for all tournaments
              </p>
            </div>
          </div>

          {/* Revenue */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-2xl blur-lg opacity-50 group-hover:opacity-100 transition duration-300"></div>
            <div
              onClick={() => handleNavigation('/admin/revenue')}
              className="relative w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 rounded-xl p-6 text-left transition shadow-lg cursor-pointer"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="p-3 bg-white/20 rounded-lg">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">Revenue</h3>
              </div>
              <p className="text-teal-100 text-sm">
                View revenue analytics and platform earnings
              </p>
            </div>
          </div>

          {/* Manage Users */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur-lg opacity-50 group-hover:opacity-100 transition duration-300"></div>
            <div
              onClick={() => handleNavigation('/admin/users')}
              className="relative w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-xl p-6 text-left transition shadow-lg cursor-pointer"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="p-3 bg-white/20 rounded-lg">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">Manage Users</h3>
              </div>
              <p className="text-blue-100 text-sm">
                View and manage all platform users
              </p>
            </div>
          </div>

          {/* View Tournaments */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur-lg opacity-50 group-hover:opacity-100 transition duration-300"></div>
            <div
              onClick={() => handleNavigation('/tournaments')}
              className="relative w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl p-6 text-left transition shadow-lg cursor-pointer"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="p-3 bg-white/20 rounded-lg">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">View Tournaments</h3>
              </div>
              <p className="text-purple-100 text-sm">
                Browse and manage all tournaments
              </p>
            </div>
          </div>

          {/* Payments */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl blur-lg opacity-50 group-hover:opacity-100 transition duration-300"></div>
            <div
              onClick={() => handleNavigation('/admin/payment-verifications')}
              className="relative w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 rounded-xl p-6 text-left transition shadow-lg cursor-pointer"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="p-3 bg-white/20 rounded-lg">
                  <CreditCard className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">Payments</h3>
              </div>
              <p className="text-amber-100 text-sm">
                Verify and approve payment screenshots
              </p>
            </div>
          </div>

          {/* Academies */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl blur-lg opacity-50 group-hover:opacity-100 transition duration-300"></div>
            <div
              onClick={() => handleNavigation('/admin/academies')}
              className="relative w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl p-6 text-left transition shadow-lg cursor-pointer"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="p-3 bg-white/20 rounded-lg">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">Academies</h3>
              </div>
              <p className="text-green-100 text-sm">
                Approve and manage academy registrations
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
