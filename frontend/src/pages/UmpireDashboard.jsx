import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

export default function UmpireDashboard() {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [stats, setStats] = useState({
    totalMatches: 0,
    completedMatches: 0,
    upcomingMatches: 0,
    todayMatches: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUmpireData();
  }, []);

  const fetchUmpireData = async () => {
    try {
      const response = await api.get('/multi-matches/umpire');
      const umpireMatches = response.data.matches;
      
      setMatches(umpireMatches);
      
      // Calculate stats
      const totalMatches = umpireMatches.length;
      const completedMatches = umpireMatches.filter(m => m.status === 'COMPLETED').length;
      const upcomingMatches = umpireMatches.filter(m => m.status === 'SCHEDULED').length;
      
      const today = new Date().toDateString();
      const todayMatches = umpireMatches.filter(m => 
        new Date(m.scheduledTime).toDateString() === today
      ).length;
      
      setStats({
        totalMatches,
        completedMatches,
        upcomingMatches,
        todayMatches
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching umpire data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Umpire Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user.name}!</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Matches</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalMatches}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completedMatches}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Upcoming</p>
              <p className="text-2xl font-bold text-gray-900">{stats.upcomingMatches}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 8a2 2 0 100-4 2 2 0 000 4zm0 0v4a2 2 0 002 2h6a2 2 0 002-2v-4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Today</p>
              <p className="text-2xl font-bold text-gray-900">{stats.todayMatches}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Matches */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Today's Matches</h2>
        
        {matches.filter(m => new Date(m.scheduledTime).toDateString() === new Date().toDateString()).length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 8a2 2 0 100-4 2 2 0 000 4zm0 0v4a2 2 0 002 2h6a2 2 0 002-2v-4" />
            </svg>
            <p className="text-gray-500">No matches scheduled for today</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {matches
              .filter(m => new Date(m.scheduledTime).toDateString() === new Date().toDateString())
              .map((match) => (
                <div key={match.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900">{match.tournament?.name}</h3>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      match.status === 'COMPLETED' 
                        ? 'bg-green-100 text-green-800'
                        : match.status === 'IN_PROGRESS'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {match.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{match.category?.name}</p>
                  <p className="text-sm text-gray-600 mb-4">
                    {new Date(match.scheduledTime).toLocaleTimeString()}
                  </p>
                  
                  {match.status !== 'COMPLETED' && (
                    <Link
                      to={`/umpire/scoring/${match.id}`}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded text-sm font-medium transition-colors text-center block"
                    >
                      Start Scoring
                    </Link>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>

      {/* All Matches */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">All Assigned Matches</h2>
        </div>

        {matches.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500">No matches assigned yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tournament
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scheduled Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {matches.map((match) => (
                  <tr key={match.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{match.tournament?.name}</div>
                        <div className="text-sm text-gray-500">{match.tournament?.venue}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{match.category?.name}</div>
                      <div className="text-sm text-gray-500">{match.category?.format}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        match.status === 'COMPLETED' 
                          ? 'bg-green-100 text-green-800'
                          : match.status === 'IN_PROGRESS'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {match.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(match.scheduledTime).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {match.status !== 'COMPLETED' ? (
                        <Link
                          to={`/umpire/scoring/${match.id}`}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          Score Match
                        </Link>
                      ) : (
                        <span className="text-gray-400">Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}