import { useState, useEffect } from 'react';
import { matchService } from '../services/matchService';
import LiveMatchCard from '../components/matches/LiveMatchCard';
import LiveMatchFilters from '../components/matches/LiveMatchFilters';
import { useWebSocket } from '../contexts/WebSocketContext';

const LiveMatches = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({});
  const { socket, isConnected } = useWebSocket();

  // Fetch live matches
  const fetchLiveMatches = async () => {
    try {
      setLoading(true);
      const data = await matchService.getLiveMatches(filters);
      setMatches(data.matches || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching live matches:', err);
      setError('Failed to load live matches. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchLiveMatches();
  }, [filters]);

  // Auto-refresh every 30 seconds (fallback if WebSocket fails)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLiveMatches();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [filters]);

  // Listen for global match status changes (new matches starting/ending)
  useEffect(() => {
    if (!socket) return;

    socket.on('match:started', () => {
      fetchLiveMatches(); // Refresh list when new match starts
    });

    socket.on('match:ended', () => {
      fetchLiveMatches(); // Refresh list when match ends
    });

    socket.on('tournament-match-update', () => {
      fetchLiveMatches(); // Refresh on any tournament update
    });

    return () => {
      socket.off('match:started');
      socket.off('match:ended');
      socket.off('tournament-match-update');
    };
  }, [socket]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Live Matches</h1>
          <p className="text-gray-600 mt-1">Watch badminton matches happening right now</p>
          
          {/* Connection Status */}
          <div className="mt-2 flex items-center space-x-2">
            <span className={`inline-block w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className="text-xs text-gray-600">
              {isConnected ? 'Connected' : 'Connecting...'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <LiveMatchFilters filters={filters} onFilterChange={setFilters} />
          </div>

          {/* Matches Grid */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                {error}
              </div>
            ) : matches.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">No live matches</h3>
                <p className="mt-1 text-sm text-gray-500">Check back later or adjust your filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matches.map((match) => (
                  <LiveMatchCard key={match.id} match={match} />
                ))}
              </div>
            )}

            {/* Match Count */}
            {!loading && matches.length > 0 && (
              <div className="mt-4 text-sm text-gray-600 text-center">
                Showing {matches.length} live {matches.length === 1 ? 'match' : 'matches'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMatches;
