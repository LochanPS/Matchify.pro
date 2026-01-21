import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const TournamentResults = () => {
  const { tournamentId } = useParams();
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
      // Mock data for now - replace with actual API call
      const mockTournament = {
        id: tournamentId,
        name: 'BS U17',
        status: 'completed',
        startDate: '2024-06-10',
        endDate: '2024-06-15',
        categories: [
          { id: '1', name: 'Men\'s Singles', format: 'singles' },
          { id: '2', name: 'Women\'s Singles', format: 'singles' },
          { id: '3', name: 'Men\'s Doubles', format: 'doubles' }
        ]
      };

      const mockMatches = [
        {
          id: '1',
          round: 128,
          roundName: 'Qualification round of 128',
          matchNumber: 1,
          player1: { name: 'Pradyumna P. S.', seed: null },
          player2: { name: 'Akhilesh Goud Somagani', seed: null },
          score: '9 15 15',
          sets: [
            { player1: 9, player2: 15 },
            { player1: 15, player2: 10 },
            { player1: 15, player2: 9 }
          ],
          winner: 'player1',
          status: 'completed',
          duration: '40m',
          venue: '03 - Riseon PJ Sports Center',
          date: '2024-06-10',
          category: 'Men\'s Singles'
        },
        {
          id: '2',
          round: 64,
          roundName: 'Qualification round of 64',
          matchNumber: 2,
          player1: { name: 'Pradyumna P. S.', seed: null },
          player2: { name: 'Udit Sood', seed: null },
          score: 'Walkover',
          sets: [],
          winner: 'player1',
          status: 'walkover',
          duration: null,
          venue: '01 - Chetan Anand Sports Center',
          date: '2024-06-11',
          category: 'Men\'s Singles'
        },
        {
          id: '3',
          round: 32,
          roundName: 'Qualification round of 32',
          matchNumber: 3,
          player1: { name: 'Tuhin S.', seed: null },
          player2: { name: 'Pradyumna P. S.', seed: null },
          score: '11 15 18',
          sets: [
            { player1: 11, player2: 15 },
            { player1: 15, player2: 18 }
          ],
          winner: 'player2',
          status: 'completed',
          duration: '41m',
          venue: '01 - Chetan Anand Sports Center - 08',
          date: '2024-06-12',
          category: 'Men\'s Singles'
        },
        {
          id: '4',
          round: 16,
          roundName: 'Qualification round of 16',
          matchNumber: 4,
          player1: { name: 'Pradyumna P. S.', seed: null },
          player2: { name: 'Gurtej Singh Vasir', seed: null },
          score: '8 8',
          sets: [
            { player1: 8, player2: 8 }
          ],
          winner: null,
          status: 'incomplete',
          duration: '18m',
          venue: '01 - Chetan Anand Sports Center - 05',
          date: '2024-06-13',
          category: 'Men\'s Singles'
        }
      ];

      setTournament(mockTournament);
      setMatches(mockMatches);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tournament results:', error);
      toast.error('Failed to load tournament results');
      setLoading(false);
    }
  };

  const getStatusColor = (status, winner) => {
    switch (status) {
      case 'completed':
        return winner ? 'bg-green-500' : 'bg-gray-500';
      case 'walkover':
        return 'bg-yellow-500';
      case 'incomplete':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'walkover':
        return 'Walkover';
      case 'incomplete':
        return 'Incomplete';
      default:
        return 'Unknown';
    }
  };

  const formatScore = (match) => {
    if (match.status === 'walkover') {
      return 'Walkover';
    }
    
    if (match.sets.length === 0) {
      return match.score;
    }

    return match.sets.map(set => `${set.player1} ${set.player2}`).join(' ');
  };

  const filteredMatches = matches.filter(match => {
    const categoryMatch = selectedCategory === 'all' || match.category === selectedCategory;
    const roundMatch = selectedRound === 'all' || match.round.toString() === selectedRound;
    return categoryMatch && roundMatch;
  });

  const groupedMatches = filteredMatches.reduce((groups, match) => {
    const key = match.roundName;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(match);
    return groups;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading tournament results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
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
            <h1 className="text-2xl font-bold text-white">Event: {tournament?.name}</h1>
            <p className="text-gray-400">Tournament Results</p>
          </div>
          
          <div className="w-20"></div>
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
                <option value="all">All Categories</option>
                {tournament?.categories.map(category => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-gray-400 text-sm mb-2">Round</label>
              <select
                value={selectedRound}
                onChange={(e) => setSelectedRound(e.target.value)}
                className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
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
        <div className="space-y-6">
          {Object.entries(groupedMatches).map(([roundName, roundMatches]) => (
            <div key={roundName} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              <div className="bg-teal-600 px-6 py-3">
                <h3 className="text-lg font-bold text-white">{roundName}</h3>
              </div>
              
              <div className="divide-y divide-slate-700">
                {roundMatches.map((match) => (
                  <div key={match.id} className="p-6 hover:bg-slate-750 transition">
                    <div className="flex items-center justify-between">
                      {/* Match Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(match.status, match.winner)}`}></div>
                          <span className="text-white font-medium">
                            {match.player1.name}
                          </span>
                          {match.winner === 'player1' && <span className="text-green-400">✓</span>}
                        </div>
                        
                        <div className="flex items-center gap-4 mb-3">
                          <div className="w-3 h-3"></div> {/* Spacer */}
                          <span className="text-white font-medium">
                            {match.player2.name}
                          </span>
                          {match.winner === 'player2' && <span className="text-green-400">✓</span>}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span>📅 {new Date(match.date).toLocaleDateString()}</span>
                          <span>📍 {match.venue}</span>
                          {match.duration && <span>⏱️ {match.duration}</span>}
                        </div>
                      </div>

                      {/* Score */}
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white mb-2">
                          {formatScore(match)}
                        </div>
                        
                        {match.status === 'walkover' && (
                          <span className="inline-block bg-yellow-900/50 text-yellow-400 px-3 py-1 rounded-full text-sm font-medium">
                            Walkover
                          </span>
                        )}
                        
                        {match.status === 'incomplete' && (
                          <span className="inline-block bg-red-900/50 text-red-400 px-3 py-1 rounded-full text-sm font-medium">
                            Incomplete
                          </span>
                        )}
                        
                        {match.status === 'completed' && match.winner && (
                          <span className="inline-block bg-green-900/50 text-green-400 px-3 py-1 rounded-full text-sm font-medium">
                            Completed
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="ml-6">
                        <Link
                          to={`/match/${match.id}/details`}
                          className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg transition text-sm"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>

                    {/* Detailed Score Breakdown */}
                    {match.sets.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-700">
                        <div className="flex items-center gap-4">
                          <span className="text-gray-400 text-sm">Set Scores:</span>
                          {match.sets.map((set, index) => (
                            <div key={index} className="bg-slate-700 rounded px-3 py-1">
                              <span className="text-white text-sm">
                                {set.player1}-{set.player2}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {filteredMatches.length === 0 && (
          <div className="bg-slate-800 rounded-xl p-12 text-center border border-slate-700">
            <p className="text-gray-400 text-lg">No matches found for the selected filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentResults;