import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Filter, Trophy, MapPin, Clock, Calendar, CheckCircle, AlertCircle, Shuffle } from 'lucide-react';

const B = {
  bg: '#07071a',
  card: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
  cardDark: '#0d1025',
  green: '#00ff88',
  cyan: '#00d4ff',
  purple: '#a855f7',
  amber: '#fbbf24',
  sub: 'rgba(255,255,255,0.6)',
  dim: 'rgba(255,255,255,0.4)',
  input: 'rgba(0,0,0,0.3)',
  inputBorder: 'rgba(255,255,255,0.1)',
};

const TournamentResults = () => {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRound, setSelectedRound] = useState('all');

  useEffect(() => {
    fetchTournamentResults();
  }, [tournamentId]);

  const fetchTournamentResults = async () => {
    try {
      // Mock data — replace with actual API call
      const mockTournament = {
        id: tournamentId,
        name: 'BS U17',
        status: 'completed',
        startDate: '2024-06-10',
        endDate: '2024-06-15',
        categories: [
          { id: '1', name: "Men's Singles", format: 'singles' },
          { id: '2', name: "Women's Singles", format: 'singles' },
          { id: '3', name: "Men's Doubles", format: 'doubles' },
        ],
      };

      const mockMatches = [
        { id: '1', round: 128, roundName: 'Qualification round of 128', matchNumber: 1, player1: { name: 'Pradyumna P. S.', seed: null }, player2: { name: 'Akhilesh Goud', seed: null }, score: '9 15 15', sets: [{ player1: 9, player2: 15 }, { player1: 15, player2: 10 }, { player1: 15, player2: 9 }], winner: 'player1', status: 'completed', duration: '40m', venue: '03 - Riseon PJ Sports Center', date: '2024-06-10', category: "Men's Singles" },
        { id: '2', round: 64, roundName: 'Qualification round of 64', matchNumber: 2, player1: { name: 'Pradyumna P. S.', seed: null }, player2: { name: 'Udit Sood', seed: null }, score: 'Walkover', sets: [], winner: 'player1', status: 'walkover', duration: null, venue: '01 - Chetan Anand Sports Center', date: '2024-06-11', category: "Men's Singles" },
        { id: '3', round: 32, roundName: 'Qualification round of 32', matchNumber: 3, player1: { name: 'Tuhin S.', seed: null }, player2: { name: 'Pradyumna P. S.', seed: null }, score: '11 15 18', sets: [{ player1: 11, player2: 15 }, { player1: 15, player2: 18 }], winner: 'player2', status: 'completed', duration: '41m', venue: '01 - Chetan Anand Sports Center', date: '2024-06-12', category: "Men's Singles" },
        { id: '4', round: 16, roundName: 'Qualification round of 16', matchNumber: 4, player1: { name: 'Pradyumna P. S.', seed: null }, player2: { name: 'Gurtej Singh', seed: null }, score: '8 8', sets: [{ player1: 8, player2: 8 }], winner: null, status: 'incomplete', duration: '18m', venue: '01 - Chetan Anand Sports Center', date: '2024-06-13', category: "Men's Singles" },
      ];

      setTournament(mockTournament);
      setMatches(mockMatches);
    } catch (error) {
      console.error('Error fetching tournament results:', error);
      toast.error('Failed to load tournament results');
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status) => {
    if (status === 'completed') return { color: B.green, bg: 'rgba(0,255,136,0.1)', border: 'rgba(0,255,136,0.2)', dot: '#00ff88' };
    if (status === 'walkover') return { color: B.amber, bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.2)', dot: '#fbbf24' };
    if (status === 'incomplete') return { color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)', dot: '#f87171' };
    return { color: B.sub, bg: 'rgba(255,255,255,0.05)', border: B.border, dot: 'rgba(255,255,255,0.3)' };
  };

  const formatScore = (match) => {
    if (match.status === 'walkover') return 'Walkover';
    if (match.sets.length === 0) return match.score;
    return match.sets.map(s => `${s.player1}-${s.player2}`).join('  ');
  };

  const filteredMatches = matches.filter(m => {
    const catOk = selectedCategory === 'all' || m.category === selectedCategory;
    const roundOk = selectedRound === 'all' || m.round.toString() === selectedRound;
    return catOk && roundOk;
  });

  const grouped = filteredMatches.reduce((acc, m) => {
    if (!acc[m.roundName]) acc[m.roundName] = [];
    acc[m.roundName].push(m);
    return acc;
  }, {});

  const selectStyle = {
    background: B.input,
    border: `1px solid ${B.inputBorder}`,
    color: '#fff',
    borderRadius: '0.75rem',
    padding: '0.5rem 0.875rem',
    width: '100%',
    fontSize: '0.875rem',
    outline: 'none',
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: B.bg }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto"
            style={{ borderColor: 'rgba(0,255,136,0.3)', borderTopColor: B.green }} />
          <p className="mt-4 font-medium" style={{ color: B.sub }}>Loading results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: B.bg }}>
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full blur-3xl opacity-[0.06]" style={{ background: B.green }} />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full blur-3xl opacity-[0.05]" style={{ background: B.purple }} />
      </div>

      <div className="relative max-w-2xl mx-auto px-4 py-6">
        {/* Back + Title */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5">
            <ArrowLeft className="w-5 h-5" style={{ color: B.green }} />
            <span className="text-sm font-semibold" style={{ color: B.sub }}>Back</span>
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-black text-white">{tournament?.name}</h1>
            <p className="text-xs" style={{ color: B.sub }}>Tournament Results</p>
          </div>
          <div className="w-14" />
        </div>

        {/* Filters */}
        <div className="rounded-2xl border p-4 mb-5" style={{ background: B.card, borderColor: B.border }}>
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4" style={{ color: B.green }} />
            <span className="text-sm font-bold text-white">Filters</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: B.sub }}>Category</label>
              <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} style={selectStyle}>
                <option value="all">All Categories</option>
                {tournament?.categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: B.sub }}>Round</label>
              <select value={selectedRound} onChange={e => setSelectedRound(e.target.value)} style={selectStyle}>
                <option value="all">All Rounds</option>
                <option value="128">Round of 128</option>
                <option value="64">Round of 64</option>
                <option value="32">Round of 32</option>
                <option value="16">Round of 16</option>
                <option value="8">Quarter Finals</option>
                <option value="4">Semi Finals</option>
                <option value="2">Finals</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        {Object.entries(grouped).length === 0 ? (
          <div className="rounded-2xl border p-10 text-center" style={{ background: B.card, borderColor: B.border }}>
            <Trophy className="w-10 h-10 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.2)' }} />
            <p className="font-semibold text-white">No matches found</p>
            <p className="text-sm mt-1" style={{ color: B.sub }}>Try adjusting the filters</p>
          </div>
        ) : (
          <div className="space-y-5">
            {Object.entries(grouped).map(([roundName, roundMatches]) => (
              <div key={roundName} className="rounded-2xl overflow-hidden border" style={{ borderColor: B.border }}>
                {/* Round header */}
                <div className="px-4 py-3 flex items-center gap-2" style={{ background: 'rgba(0,255,136,0.08)', borderBottom: `1px solid rgba(0,255,136,0.15)` }}>
                  <Trophy className="w-4 h-4" style={{ color: B.green }} />
                  <h3 className="font-bold text-sm text-white">{roundName}</h3>
                </div>

                <div className="divide-y" style={{ background: B.card }}>
                  {roundMatches.map((match) => {
                    const s = getStatusStyle(match.status);
                    return (
                      <div key={match.id} className="p-4">
                        {/* Players */}
                        <div className="mb-3">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full" style={{ background: match.winner === 'player1' ? B.green : 'rgba(255,255,255,0.2)' }} />
                            <span className={`text-sm font-semibold ${match.winner === 'player1' ? 'text-white' : ''}`} style={{ color: match.winner === 'player1' ? '#fff' : B.sub }}>
                              {match.player1.name}
                              {match.winner === 'player1' && <span className="ml-1.5 text-xs" style={{ color: B.green }}>✓ Winner</span>}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ background: match.winner === 'player2' ? B.green : 'rgba(255,255,255,0.2)' }} />
                            <span className="text-sm font-semibold" style={{ color: match.winner === 'player2' ? '#fff' : B.sub }}>
                              {match.player2.name}
                              {match.winner === 'player2' && <span className="ml-1.5 text-xs" style={{ color: B.green }}>✓ Winner</span>}
                            </span>
                          </div>
                        </div>

                        {/* Score + meta */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-2 text-xs" style={{ color: B.sub }}>
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(match.date).toLocaleDateString()}</span>
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{match.venue}</span>
                            {match.duration && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{match.duration}</span>}
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-base font-black text-white">{formatScore(match)}</span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full border" style={{ color: s.color, background: s.bg, borderColor: s.border }}>
                              {match.status === 'walkover' ? 'W/O' : match.status === 'incomplete' ? 'Inc.' : 'Done'}
                            </span>
                          </div>
                        </div>

                        {/* Set scores */}
                        {match.sets.length > 0 && (
                          <div className="mt-3 pt-3 border-t flex items-center gap-2 flex-wrap" style={{ borderColor: B.border }}>
                            <span className="text-xs" style={{ color: B.dim }}>Sets:</span>
                            {match.sets.map((set, idx) => (
                              <span key={idx} className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.75)' }}>
                                {set.player1}-{set.player2}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentResults;
