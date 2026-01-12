import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import {
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ClockIcon,
  CalendarDaysIcon,
  ArrowRightIcon,
  PlayIcon
} from '@heroicons/react/24/outline';

export default function UmpireDashboard() {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [umpireCode, setUmpireCode] = useState(null);
  const [stats, setStats] = useState({
    totalMatches: 0,
    completedMatches: 0,
    upcomingMatches: 0,
    todayMatches: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUmpireData();
    fetchUmpireCode();
  }, []);

  const fetchUmpireCode = async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data.user?.umpireCode) {
        setUmpireCode(response.data.user.umpireCode);
      }
    } catch (error) {
      console.error('Error fetching umpire code:', error);
    }
  };

  const fetchUmpireData = async () => {
    try {
      const response = await api.get('/multi-matches/umpire');
      const umpireMatches = response.data.matches;
      
      setMatches(umpireMatches);
      
      const totalMatches = umpireMatches.length;
      const completedMatches = umpireMatches.filter(m => m.status === 'COMPLETED').length;
      const upcomingMatches = umpireMatches.filter(m => m.status === 'SCHEDULED').length;
      
      const today = new Date().toDateString();
      const todayMatches = umpireMatches.filter(m => 
        new Date(m.scheduledTime).toDateString() === today
      ).length;
      
      setStats({ totalMatches, completedMatches, upcomingMatches, todayMatches });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching umpire data:', error);
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Matches', value: stats.totalMatches, icon: ClipboardDocumentListIcon, color: 'from-blue-500 to-indigo-600', bgColor: 'bg-slate-800/50', textColor: 'text-blue-400' },
    { label: 'Completed', value: stats.completedMatches, icon: CheckCircleIcon, color: 'from-green-500 to-emerald-600', bgColor: 'bg-slate-800/50', textColor: 'text-green-400' },
    { label: 'Upcoming', value: stats.upcomingMatches, icon: ClockIcon, color: 'from-amber-500 to-orange-600', bgColor: 'bg-slate-800/50', textColor: 'text-amber-400' },
    { label: 'Today', value: stats.todayMatches, icon: CalendarDaysIcon, color: 'from-red-500 to-rose-600', bgColor: 'bg-slate-800/50', textColor: 'text-red-400' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 mt-4 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const todayMatches = matches.filter(m => new Date(m.scheduledTime).toDateString() === new Date().toDateString());

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-amber-400 via-orange-500 to-red-600 rounded-2xl flex items-center justify-center text-4xl font-bold text-white shadow-2xl shadow-orange-500/30">
                  {user?.profilePhoto ? (
                    <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    user?.name?.charAt(0)?.toUpperCase() || 'U'
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">⚖️</span>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-white">Umpire Dashboard</h1>
                </div>
                <p className="text-white/60">Welcome back, {user?.name}!</p>
                <p className="text-white/40 text-sm mt-1">{user?.email}</p>
                {umpireCode && (
                  <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/30 rounded-xl">
                    <span className="text-amber-400/80 text-sm">Umpire Code:</span>
                    <span className="text-amber-400 font-mono font-bold text-lg tracking-wider">{umpireCode}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(umpireCode)}
                      className="p-1.5 hover:bg-amber-500/20 rounded-lg transition-colors ml-1"
                      title="Copy code"
                    >
                      <svg className="w-4 h-4 text-amber-400/60 hover:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat, index) => (
            <div key={index} className={`${stat.bgColor} backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:scale-105 transition-all duration-300`}>
              <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl shadow-lg mb-4`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <p className={`text-3xl font-bold ${stat.textColor}`}>{stat.value}</p>
              <p className="text-gray-400 text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Today's Matches */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden mb-8">
          <div className="p-6 border-b border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center">
              <CalendarDaysIcon className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white">Today's Matches</h3>
            {todayMatches.length > 0 && (
              <span className="bg-red-100 text-red-700 text-xs px-3 py-1 rounded-full font-semibold">{todayMatches.length}</span>
            )}
          </div>

          <div className="p-6">
            {todayMatches.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">📅</span>
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">No matches today</h4>
                <p className="text-gray-500">Check back later for scheduled matches</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {todayMatches.map((match) => (
                  <div key={match.id} className="bg-slate-700/50 border border-white/10 rounded-xl p-5 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:border-purple-500/30 transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-white">{match.tournament?.name}</h3>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        match.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
                        match.status === 'IN_PROGRESS' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {match.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mb-1">{match.category?.name}</p>
                    <p className="text-sm text-gray-500 mb-4 flex items-center gap-1">
                      <ClockIcon className="w-4 h-4" />
                      {new Date(match.scheduledTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    
                    {match.status !== 'COMPLETED' && (
                      <Link
                        to={`/umpire/scoring/${match.id}`}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2.5 px-4 rounded-xl text-sm font-medium hover:shadow-lg hover:scale-105 transition-all"
                      >
                        <PlayIcon className="w-4 h-4" />
                        Start Scoring
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* All Matches */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <ClipboardDocumentListIcon className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white">All Assigned Matches</h3>
          </div>

          <div className="p-6">
            {matches.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">📋</span>
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">No matches assigned</h4>
                <p className="text-gray-500">You'll see your assigned matches here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {matches.map((match) => (
                  <div key={match.id} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-xl border border-white/10 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:border-purple-500/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center">
                        <span className="text-xl">🏸</span>
                      </div>
                      <div>
                        <p className="font-semibold text-white">{match.tournament?.name}</p>
                        <p className="text-sm text-gray-400">
                          {match.category?.name} • {match.category?.format}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(match.scheduledTime).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        match.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
                        match.status === 'IN_PROGRESS' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {match.status}
                      </span>
                      {match.status !== 'COMPLETED' ? (
                        <Link
                          to={`/umpire/scoring/${match.id}`}
                          className="flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all"
                        >
                          Score
                          <ArrowRightIcon className="w-4 h-4" />
                        </Link>
                      ) : (
                        <span className="text-gray-500 text-sm px-4 py-2">Completed</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
