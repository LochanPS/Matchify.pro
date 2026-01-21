import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const TournamentDraw = () => {
  const { tournamentId } = useParams();
  const [tournament, setTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedRound, setSelectedRound] = useState(1);
  const [umpires, setUmpires] = useState([]);
  const [showUmpireModal, setShowUmpireModal] = useState(null);

  useEffect(() => {
    fetchTournamentDraw();
    fetchUmpires();
  }, [tournamentId]);

  const fetchTournamentDraw = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockTournament = {
        id: tournamentId,
        name: 'Championship Tournament 2024',
        status: 'ongoing',
        categories: [
          { id: '1', name: 'Men\'s Singles', format: 'singles' },
          { id: '2', name: 'Women\'s Singles', format: 'singles' }
        ]
      };

      const mockMatches = [
        {
          id: '1',
          round: 1,
          matchNumber: 1,
          categoryId: '1',
          player1: { id: '1', name: 'Aliya Ali' },
          player2: { id: '2', name: 'Smita Naik' },
          status: 'PENDING',
          umpireId: null,
          umpire: null,
          scheduledTime: null,
          courtNumber: null
        },
        {
          id: '2',
          round: 1,
          matchNumber: 2,
          categoryId: '1',
          player1: { id: '3', name: 'Geeta Desai' },
          player2: { id: '4', name: 'Mangala Prabhugaonkar' },
          status: 'PENDING',
          umpireId: null,
          umpire: null,
          scheduledTime: null,
          courtNumber: null
        },
        {
          id: '3',
          round: 1,
          matchNumber: 3,
          categoryId: '2',
          player1: { id: '5', name: 'Priya Sharma' },
          player2: { id: '6', name: 'Anita Patel' },
          status: 'SCHEDULED',
          umpireId: 'ump1',
          umpire: { id: 'ump1', name: 'John Doe' },
          scheduledTime: '2024-01-22T10:00:00Z',
          courtNumber: 1
        }
      ];

      setTournament(mockTournament);
      setMatches(mockMatches);
      
      // Set default category
      if (mockTournament.categories.length > 0) {
        setSelectedCategory(mockTournament.categories[0].id);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tournament draw:', error);
      toast.error('Failed to load tournament draw');
      setLoading(false);
    }
  };

  const fetchUmpires = async () => {
    try {
      // Mock umpires data
      const mockUmpires = [
        { id: 'ump1', name: 'John Doe', isAvailable: true },
        { id: 'ump2', name: 'Jane Smith', isAvailable: true },
        { id: 'ump3', name: 'Mike Johnson', isAvailable: false },
        { id: 'ump4', name: 'Sarah Wilson', isAvailable: true }
      ];
      
      setUmpires(mockUmpires);
    } catch (error) {
      console.error('Error fetching umpires:', error);
    }
  };

  const assignUmpire = async (matchId, umpireId) => {
    try {
      // Update match with assigned umpire
      const updatedMatches = matches.map(match => {
        if (match.id === matchId) {
          const umpire = umpires.find(u => u.id === umpireId);
          return {
            ...match,
            umpireId,
            umpire,
            status: 'SCHEDULED'
          };
        }
        return match;
      });
      
      setMatches(updatedMatches);
      setShowUmpireModal(null);
      
      const umpire = umpires.find(u => u.id === umpireId);
      toast.success(`${umpire.name} assigned as umpire`);
      
      // TODO: API call to save umpire assignment
    } catch (error) {
      console.error('Error assigning umpire:', error);
      toast.error('Failed to assign umpire');
    }
  };

  const startMatch = async (matchId) => {
    try {
      // Navigate to live scoring
      window.open(`/match/${matchId}/live`, '_blank');
    } catch (error) {
      console.error('Error starting match:', error);
      toast.error('Failed to start match');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-gray-600';
      case 'SCHEDULED':
        return 'bg-blue-600';
      case 'IN_PROGRESS':
        return 'bg-green-600';
      case 'COMPLETED':
        return 'bg-teal-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'PENDING':
        return 'Pending';
      case 'SCHEDULED':
        return 'Scheduled';
      case 'IN_PROGRESS':
        return 'Live';
      case 'COMPLETED':
        return 'Completed';
      default:
        return 'Unknown';
    }
  };

  const filteredMatches = matches.filter(match => 
    match.categoryId === selectedCategory && match.round === selectedRound
  );

  const rounds = [...new Set(matches.map(m => m.round))].sort((a, b) => a - b);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading tournament draw...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/tournaments"
            className="flex items-center gap-2 text-gray-400 hover:text-teal-400 transition"
          >
            <span>←</span>
            <span>Back to Tournaments</span>
          </Link>
          
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">{tournament?.name}</h1>
            <p className="text-gray-400">Tournament Draw</p>
          </div>
          
          <div className="flex gap-2">
            <Link
              to={`/tournament/${tournamentId}/results`}
              className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition"
            >
              View Results
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-800 rounded-xl p-6 mb-6 border border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {tournament?.categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-gray-400 text-sm mb-2">Round</label>
              <select
                value={selectedRound}
                onChange={(e) => setSelectedRound(parseInt(e.target.value))}
                className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {rounds.map(round => (
                  <option key={round} value={round}>
                    Round {round}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Round Header */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-center">
            <h2 className="text-3xl font-bold text-white">Round {selectedRound}</h2>
            <p className="text-purple-200 mt-2">
              {filteredMatches.length} matches in this round
            </p>
          </div>
        </div>

        {/* Matches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMatches.map((match) => (
            <div
              key={match.id}
              className="bg-slate-800 rounded-xl border-2 border-purple-500 overflow-hidden hover:shadow-lg hover:shadow-purple-500/20 transition"
            >
              {/* Match Header */}
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-bold">Match {match.matchNumber}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(match.status)}`}>
                    {getStatusText(match.status)}
                  </span>
                </div>
              </div>

              {/* Players */}
              <div className="p-6">
                <div className="space-y-4 mb-6">
                  <div className="text-center">
                    <h4 className="text-xl font-bold text-white mb-1">
                      {match.player1.name}
                    </h4>
                    <div className="h-px bg-gray-600 my-3"></div>
                  </div>
                  
                  <div className="text-center">
                    <h4 className="text-xl font-bold text-white">
                      {match.player2.name}
                    </h4>
                  </div>
                </div>

                {/* Match Info */}
                {match.scheduledTime && (
                  <div className="mb-4 p-3 bg-slate-700 rounded-lg">
                    <div className="text-sm text-gray-400 mb-1">Scheduled Time</div>
                    <div className="text-white font-medium">
                      {new Date(match.scheduledTime).toLocaleString()}
                    </div>
                  </div>
                )}

                {match.courtNumber && (
                  <div className="mb-4 p-3 bg-slate-700 rounded-lg">
                    <div className="text-sm text-gray-400 mb-1">Court</div>
                    <div className="text-white font-medium">Court {match.courtNumber}</div>
                  </div>
                )}

                {/* Umpire Section */}
                <div className="mb-4">
                  {match.umpire ? (
                    <div className="p-3 bg-green-900/30 border border-green-700 rounded-lg">
                      <div className="text-sm text-green-400 mb-1">Umpire Assigned</div>
                      <div className="text-white font-medium">{match.umpire.name}</div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowUmpireModal(match.id)}
                      className="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center justify-center gap-2"
                    >
                      <span>👑</span>
                      <span>Click to assign umpire</span>
                    </button>
                  )}
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  {match.status === 'SCHEDULED' && (
                    <button
                      onClick={() => startMatch(match.id)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition"
                    >
                      Start Match
                    </button>
                  )}
                  
                  {match.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => startMatch(match.id)}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-lg transition animate-pulse"
                    >
                      🔴 Join Live Match
                    </button>
                  )}
                  
                  <Link
                    to={`/match/${match.id}/details`}
                    className="block w-full bg-slate-600 hover:bg-slate-700 text-white text-center font-medium py-2 px-4 rounded-lg transition"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredMatches.length === 0 && (
          <div className="bg-slate-800 rounded-xl p-12 text-center border border-slate-700">
            <p className="text-gray-400 text-lg">No matches found for this round</p>
          </div>
        )}
      </div>

      {/* Umpire Assignment Modal */}
      {showUmpireModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl p-8 max-w-md w-full border border-slate-700">
            <h3 className="text-2xl font-bold text-white mb-6">Assign Umpire</h3>
            
            <div className="space-y-3 mb-6">
              {umpires.map((umpire) => (
                <button
                  key={umpire.id}
                  onClick={() => assignUmpire(showUmpireModal, umpire.id)}
                  disabled={!umpire.isAvailable}
                  className={`w-full p-4 rounded-lg border-2 transition text-left ${
                    umpire.isAvailable
                      ? 'border-teal-500 bg-teal-900/30 hover:bg-teal-900/50 text-white'
                      : 'border-gray-600 bg-gray-900/30 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{umpire.name}</div>
                      <div className="text-sm text-gray-400">
                        {umpire.isAvailable ? 'Available' : 'Not Available'}
                      </div>
                    </div>
                    {umpire.isAvailable && (
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    )}
                  </div>
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setShowUmpireModal(null)}
              className="w-full bg-slate-600 hover:bg-slate-700 text-white font-bold py-3 px-4 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentDraw;