import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { matchService } from '../services/matchService';
import LiveMatchCard from '../components/matches/LiveMatchCard';
import LiveMatchFilters from '../components/matches/LiveMatchFilters';
import { useWebSocket } from '../contexts/WebSocketContext';
import { ArrowLeft, Radio, Wifi, WifiOff, RefreshCw, Trophy, SlidersHorizontal } from 'lucide-react';
import Spinner from '../components/Spinner';

const B = {
  bg: '#040810',
  card: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
  green: '#F59E0B',
  cyan: '#FCD34D',
  sub: 'rgba(255,255,255,0.6)',
};

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

  useEffect(() => { fetchLiveMatches(); }, [filters]);

  useEffect(() => {
    const interval = setInterval(fetchLiveMatches, 30000);
    return () => clearInterval(interval);
  }, [filters]);

  useEffect(() => {
    if (!socket) return;
    const refresh = () => fetchLiveMatches();
    socket.on('match:started', refresh);
    socket.on('match:ended', refresh);
    socket.on('tournament-match-update', refresh);
    return () => {
      socket.off('match:started', refresh);
      socket.off('match:ended', refresh);
      socket.off('tournament-match-update', refresh);
    };
  }, [socket]);

  return (
    <div className="min-h-screen" style={{ background: B.bg }}>
      {/* Background orbs */}
      <div className="fixed top-0 bottom-0 pointer-events-none overflow-hidden" style={{ left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "480px" }}>
        <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full blur-3xl opacity-[0.07]" style={{ background: '#f87171' }} />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full blur-3xl opacity-[0.05]" style={{ background: B.green }} />
      </div>

      {/* Sticky header */}
      <div className="sticky top-0 z-20 px-4 py-3 border-b backdrop-blur-xl"
        style={{ background: 'rgba(7,7,26,0.95)', borderColor: 'rgba(6,182,212,0.12)' }}>
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" style={{ color: B.green }} />
            <span className="text-sm font-semibold" style={{ color: B.sub }}>Back</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Radio className="w-5 h-5" style={{ color: '#f87171' }} />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </div>
            <h1 className="text-base font-black text-white">Live Matches</h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Connection status */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border"
              style={isConnected
                ? { background: 'rgba(6,182,212,0.08)', borderColor: 'rgba(6,182,212,0.25)', color: B.green }
                : { background: 'rgba(248,113,113,0.08)', borderColor: 'rgba(248,113,113,0.25)', color: '#f87171' }}>
              {isConnected ? <><Wifi className="w-3 h-3" /> Live</> : <><WifiOff className="w-3 h-3" /> Off</>}
            </div>

            <button onClick={fetchLiveMatches}
              className="p-2 rounded-xl border transition-all"
              style={{ background: B.card, borderColor: B.border, color: B.sub }}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button onClick={() => setShowFilters(!showFilters)}
              className="p-2 rounded-xl border transition-all"
              style={showFilters
                ? { background: 'rgba(6,182,212,0.12)', borderColor: 'rgba(6,182,212,0.3)', color: B.green }
                : { background: B.card, borderColor: B.border, color: B.sub }}>
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="relative max-w-2xl mx-auto px-4 py-5">
        {/* Stats bar */}
        <div className="flex items-center gap-3 mb-5 px-4 py-3 rounded-xl border"
          style={{ background: B.card, borderColor: B.border }}>
          <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm font-semibold" style={{ color: B.sub }}>
            {matches.length} {matches.length === 1 ? 'match' : 'matches'} live right now
          </span>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mb-5 rounded-xl border p-4" style={{ background: B.card, borderColor: B.border }}>
            <h3 className="font-bold text-white text-sm mb-3">Filter Matches</h3>
            <LiveMatchFilters filters={filters} onFilterChange={setFilters} />
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="rounded-2xl border p-12 text-center" style={{ background: B.card, borderColor: B.border }}>
            <Spinner size="lg" className="mx-auto" />
            <p className="mt-4 text-sm font-medium" style={{ color: B.sub }}>Loading live matches...</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border p-6 text-center" style={{ background: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.2)' }}>
            <p className="text-red-300 font-medium">⚠️ {error}</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="rounded-2xl border p-12 text-center" style={{ background: B.card, borderColor: B.border }}>
            <Trophy className="w-12 h-12 mx-auto mb-4" style={{ color: 'rgba(255,255,255,0.2)' }} />
            <h3 className="text-lg font-bold text-white mb-2">No live matches</h3>
            <p className="text-sm" style={{ color: B.sub }}>
              No matches happening right now. Check back later or adjust your filters.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {matches.map((match) => (
                <LiveMatchCard key={match.id} match={match} />
              ))}
            </div>
            <div className="mt-5 text-center">
              <p className="text-xs" style={{ color: B.sub }}>
                Showing {matches.length} live {matches.length === 1 ? 'match' : 'matches'}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LiveMatches;

