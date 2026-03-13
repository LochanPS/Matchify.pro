import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { matchService } from '../services/matchService';
import LiveMatchCard from '../components/matches/LiveMatchCard';
import LiveMatchFilters from '../components/matches/LiveMatchFilters';
import { useWebSocket } from '../contexts/WebSocketContext';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Radio, Wifi, WifiOff, RefreshCw, Trophy, Filter } from 'lucide-react';

const LiveMatches = () => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const { socket, isConnected } = useWebSocket();

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

  useEffect(() => {
    fetchLiveMatches();
  }, [filters]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchLiveMatches();
    }, 30000);

    return () => clearInterval(interval);
  }, [filters]);

  useEffect(() => {
    if (!socket) return;

    socket.on('match:started', () => {
      fetchLiveMatches();
    });

    socket.on('match:ended', () => {
      fetchLiveMatches();
    });

    socket.on('tournament-match-update', () => {
      fetchLiveMatches();
    });

    return () => {
      socket.off('match:started');
      socket.off('match:ended');
      socket.off('tournament-match-update');
    };
  }, [socket]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-r from-slate-900 via-red-900 to-slate-900 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/70 hover:text-white mb-6 transition-colors group"
          >
            <ArrowLeftIcon className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            <span>Back</span>
          </button>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-red-400 via-rose-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-red-500/30">
                  <Radio className="w-8 h-8 text-white" />
                </div>
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Live Matches</h1>
                <p className="text-white/60 mt-1">Watch badminton matches happening right now</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Connection Status */}
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl backdrop-blur-sm border ${
                isConnected 
                  ? 'bg-green-500/20 border-green-500/30 text-green-300' 
                  : 'bg-red-500/20 border-red-500/30 text-red-300'
              }`}>
                {isConnected ? (
                  <>
                    <Wifi className="w-4 h-4" />
                    <span className="text-sm font-medium">Live</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4" />
                    <span className="text-sm font-medium">Connecting...</span>
                  </>
                )}
              </div>

              <button
                onClick={fetchLiveMatches}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-xl border border-white/20 hover:bg-white/20 transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-6">
        {/* Stats Bar */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl shadow-xl shadow-gray-200/50 border border-white/10 p-4 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-gray-700 font-medium">{matches.length} Live Matches</span>
              </div>
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                showFilters 
                  ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="lg:col-span-1">
              <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl shadow-xl shadow-gray-200/50 border border-white/10 p-6 sticky top-24">
                <h3 className="font-bold text-white mb-4">Filter Matches</h3>
                <LiveMatchFilters filters={filters} onFilterChange={setFilters} />
              </div>
            </div>
          )}

          {/* Matches Grid */}
          <div className={showFilters ? 'lg:col-span-3' : 'lg:col-span-4'}>
            {loading ? (
              <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl shadow-xl shadow-gray-200/50 border border-white/10 p-16 text-center">
                <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-gray-500 mt-6 font-medium">Loading live matches...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700 flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                {error}
              </div>
            ) : matches.length === 0 ? (
              <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl shadow-xl shadow-gray-200/50 border border-white/10 p-16 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Trophy className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No live matches</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  There are no matches happening right now. Check back later or adjust your filters.
                </p>
              </div>
            ) : (
              <>
                <div className={`grid grid-cols-1 ${showFilters ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'} gap-4`}>
                  {matches.map((match) => (
                    <LiveMatchCard key={match.id} match={match} />
                  ))}
                </div>

                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-500 bg-white/50 backdrop-blur-sm inline-block px-6 py-2 rounded-full">
                    Showing {matches.length} live {matches.length === 1 ? 'match' : 'matches'}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMatches;
