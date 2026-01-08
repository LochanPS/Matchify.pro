import React, { useState, useEffect } from 'react';
import { getMyPoints } from '../api/points';
import PointsHistoryCard from '../components/PointsHistoryCard';
import { TrendingUp, Award, Trophy, Target } from 'lucide-react';

const MyPoints = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyPoints();
  }, []);

  const fetchMyPoints = async () => {
    setLoading(true);
    try {
      const result = await getMyPoints();
      setData(result);
    } catch (error) {
      console.error('Failed to fetch points:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your points...</p>
        </div>
      </div>
    );
  }

  const { total_points, rank, tournaments_played, logs } = data;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Award className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">My Matchify Points</h1>
          </div>
          <p className="text-gray-600">Track your tournament performance and rankings</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg p-6 text-white">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="w-5 h-5" />
              <p className="text-sm font-semibold opacity-90">Total Points</p>
            </div>
            <p className="text-4xl font-bold">{total_points.toFixed(1)}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg p-6 text-white">
            <div className="flex items-center space-x-2 mb-2">
              <Trophy className="w-5 h-5" />
              <p className="text-sm font-semibold opacity-90">Global Rank</p>
            </div>
            <p className="text-4xl font-bold">#{rank}</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-lg p-6 text-white">
            <div className="flex items-center space-x-2 mb-2">
              <Target className="w-5 h-5" />
              <p className="text-sm font-semibold opacity-90">Tournaments</p>
            </div>
            <p className="text-4xl font-bold">{tournaments_played}</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-700 rounded-lg p-6 text-white">
            <div className="flex items-center space-x-2 mb-2">
              <Award className="w-5 h-5" />
              <p className="text-sm font-semibold opacity-90">Avg Points</p>
            </div>
            <p className="text-4xl font-bold">
              {tournaments_played > 0 ? (total_points / tournaments_played).toFixed(1) : '0.0'}
            </p>
          </div>
        </div>

        {/* Points Breakdown */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Points Breakdown</h2>
          
          {logs && logs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {logs.map((log) => (
                <PointsHistoryCard key={log.id} log={log} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No points earned yet</p>
              <p className="text-gray-400 text-sm mt-2">
                Participate in tournaments to start earning Matchify Points!
              </p>
            </div>
          )}
        </div>

        {/* How Points Work */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">How Matchify Points Work</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
            <div>
              <p className="font-semibold mb-2">🏆 Tournament Results:</p>
              <ul className="space-y-1 ml-4">
                <li>• Winner: 100 points</li>
                <li>• Runner-up: 70 points</li>
                <li>• Semi-finalist: 50 points</li>
                <li>• Quarter-finalist: 30 points</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-2">🎯 Multipliers:</p>
              <ul className="space-y-1 ml-4">
                <li>• Recent win (last 30 days): 1.5x</li>
                <li>• Recent performance (60 days): 1.2x</li>
                <li>• Tournament played: +0.5 points</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyPoints;
