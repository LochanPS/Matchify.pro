import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyPoints } from '../api/points';
import PointsHistoryCard from '../components/PointsHistoryCard';
import { TrendingUp, Award, Trophy, Target, Sparkles, AlertTriangle } from 'lucide-react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const MyPoints = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMyPoints();
  }, []);

  const fetchMyPoints = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getMyPoints();
      setData(result);
    } catch (error) {
      console.error('Failed to fetch points:', error);
      setError('Failed to load points data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-400 font-medium">Loading your points...</p>
        </div>
      </div>
    );
  }

  // Handle null/undefined data gracefully
  const total_points = data?.total_points || 0;
  const rank = data?.rank || '-';
  const tournaments_played = data?.tournaments_played || 0;
  const logs = data?.logs || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/70 hover:text-white mb-6 transition-colors group"
          >
            <ArrowLeftIcon className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/30">
              <Award className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">My Matchify Points</h1>
              <p className="text-white/60">Track your tournament performance and rankings</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-6">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span className="text-red-300">{error}</span>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-xl hover:shadow-blue-500/10 transition-all">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-sm font-semibold text-gray-400">Total Points</p>
            </div>
            <p className="text-4xl font-bold text-white">{total_points.toFixed ? total_points.toFixed(1) : total_points}</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-xl hover:shadow-purple-500/10 transition-all">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Trophy className="w-5 h-5 text-purple-400" />
              </div>
              <p className="text-sm font-semibold text-gray-400">Global Rank</p>
            </div>
            <p className="text-4xl font-bold text-white">#{rank}</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-xl hover:shadow-emerald-500/10 transition-all">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <Target className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-sm font-semibold text-gray-400">Tournaments</p>
            </div>
            <p className="text-4xl font-bold text-white">{tournaments_played}</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-xl hover:shadow-amber-500/10 transition-all">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                <Award className="w-5 h-5 text-amber-400" />
              </div>
              <p className="text-sm font-semibold text-gray-400">Avg Points</p>
            </div>
            <p className="text-4xl font-bold text-white">
              {tournaments_played > 0 ? (total_points / tournaments_played).toFixed(1) : '0.0'}
            </p>
          </div>
        </div>

        {/* Points Breakdown */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Points Breakdown</h2>
          </div>
          
          {logs && logs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {logs.map((log) => (
                <PointsHistoryCard key={log.id} log={log} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-10 h-10 text-gray-500" />
              </div>
              <p className="text-gray-300 text-lg font-semibold">No points earned yet</p>
              <p className="text-gray-500 text-sm mt-2">
                Participate in tournaments to start earning Matchify Points!
              </p>
            </div>
          )}
        </div>

        {/* How Points Work */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <span className="text-xl">📊</span>
            </div>
            How Matchify Points Work
          </h3>
          <div className="bg-slate-700/30 rounded-xl p-6 border border-white/5">
            <p className="font-semibold text-white mb-4 flex items-center gap-2 text-lg">
              <span className="text-2xl">🏆</span> Tournament Results
            </p>
            <ul className="space-y-3 text-base">
              <li className="flex items-center justify-between py-3 border-b border-white/10">
                <span className="text-gray-300">Winner</span>
                <span className="font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg">+100 points</span>
              </li>
              <li className="flex items-center justify-between py-3 border-b border-white/10">
                <span className="text-gray-300">Runner-up</span>
                <span className="font-bold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-lg">+70 points</span>
              </li>
              <li className="flex items-center justify-between py-3 border-b border-white/10">
                <span className="text-gray-300">Semi-finalist</span>
                <span className="font-bold text-purple-400 bg-purple-500/10 px-3 py-1 rounded-lg">+50 points</span>
              </li>
              <li className="flex items-center justify-between py-3">
                <span className="text-gray-300">Quarter-finalist</span>
                <span className="font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-lg">+30 points</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyPoints;
