import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import {
  UserGroupIcon,
  TrophyIcon,
  ChartBarIcon,
  CurrencyRupeeIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  Cog6ToothIcon,
  ArrowRightIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTournaments: 0,
    totalRevenue: 0,
    activeMatches: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      // Placeholder - implement actual admin stats API
      setStats({
        totalUsers: 1250,
        totalTournaments: 48,
        totalRevenue: 125000,
        activeMatches: 12
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { 
      label: 'Total Users', 
      value: stats.totalUsers.toLocaleString(), 
      icon: UserGroupIcon,
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    { 
      label: 'Tournaments', 
      value: stats.totalTournaments, 
      icon: TrophyIcon,
      color: 'from-purple-500 to-violet-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    { 
      label: 'Revenue', 
      value: `₹${(stats.totalRevenue / 1000).toFixed(0)}K`, 
      icon: CurrencyRupeeIcon,
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    { 
      label: 'Live Matches', 
      value: stats.activeMatches, 
      icon: ChartBarIcon,
      color: 'from-amber-500 to-orange-600',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600'
    },
  ];

  const quickActions = [
    {
      title: 'User Invites',
      description: 'Invite new users to the platform',
      icon: EnvelopeIcon,
      href: '/admin/invites',
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'from-blue-50 to-indigo-50',
      available: true
    },
    {
      title: 'User Management',
      description: 'Manage all platform users',
      icon: UserGroupIcon,
      href: '/admin/users',
      color: 'from-purple-500 to-violet-600',
      bgColor: 'from-purple-50 to-violet-50',
      available: false
    },
    {
      title: 'Tournament Oversight',
      description: 'Monitor all tournaments',
      icon: TrophyIcon,
      href: '/admin/tournaments',
      color: 'from-green-500 to-emerald-600',
      bgColor: 'from-green-50 to-emerald-50',
      available: false
    },
    {
      title: 'Platform Analytics',
      description: 'View detailed analytics',
      icon: ChartBarIcon,
      href: '/admin/analytics',
      color: 'from-amber-500 to-orange-600',
      bgColor: 'from-amber-50 to-orange-50',
      available: false
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 mt-4 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-r from-slate-900 via-red-900 to-slate-900 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-red-400 via-rose-500 to-pink-600 rounded-2xl flex items-center justify-center text-4xl font-bold text-white shadow-2xl shadow-red-500/30">
                  {user?.profilePhoto ? (
                    <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    user?.name?.charAt(0)?.toUpperCase() || 'A'
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                  <ShieldCheckIcon className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
                  <span className="px-3 py-1 bg-red-500/20 backdrop-blur-sm text-red-200 text-xs font-semibold rounded-full border border-red-500/30">
                    ADMIN
                  </span>
                </div>
                <p className="text-white/60">Welcome back, {user?.name}!</p>
                <p className="text-white/40 text-sm mt-1">{user?.email}</p>
              </div>
            </div>
            
            <Link
              to="/admin/invites"
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:scale-105 transition-all flex items-center gap-2 font-semibold"
            >
              <EnvelopeIcon className="w-5 h-5" />
              Send Invites
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat, index) => (
            <div 
              key={index}
              className={`${stat.bgColor} rounded-2xl p-6 border border-gray-100 hover:shadow-xl hover:scale-105 transition-all duration-300`}
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl shadow-lg mb-4`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <p className={`text-3xl font-bold ${stat.textColor}`}>{stat.value}</p>
              <p className="text-gray-600 text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center">
              <Cog6ToothIcon className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <div
                key={index}
                onClick={() => action.available && navigate(action.href)}
                className={`relative bg-gradient-to-br ${action.bgColor} rounded-2xl p-6 border border-gray-100 transition-all ${
                  action.available 
                    ? 'cursor-pointer hover:shadow-xl hover:scale-105' 
                    : 'opacity-60 cursor-not-allowed'
                }`}
              >
                {!action.available && (
                  <span className="absolute top-3 right-3 px-2 py-1 bg-gray-200 text-gray-600 text-xs font-semibold rounded-full">
                    Coming Soon
                  </span>
                )}
                <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br ${action.color} rounded-xl shadow-lg mb-4`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{action.title}</h3>
                <p className="text-sm text-gray-600">{action.description}</p>
                {action.available && (
                  <div className="mt-4 flex items-center gap-1 text-sm font-medium text-gray-700">
                    Open <ArrowRightIcon className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Admin Profile Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center">
              <SparklesIcon className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Your Profile</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Name</p>
              <p className="font-semibold text-gray-900">{user?.name}</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Email</p>
              <p className="font-semibold text-gray-900">{user?.email}</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Role</p>
              <span className="inline-flex px-3 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded-full">
                {user?.role}
              </span>
            </div>
            <div className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Phone</p>
              <p className="font-semibold text-gray-900">{user?.phone || 'Not provided'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
