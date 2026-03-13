import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTournamentMatches } from '../api/matches';
import { Play, Eye } from 'lucide-react';

const MatchListPage = () => {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchMatches = async (tournamentId) => {
    try {
      setLoading(true);
      const data = await getTournamentMatches(tournamentId);
      setMatches(data.matches);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch matches:', error);
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'PENDING': 'bg-gray-100 text-gray-800',
      'ONGOING': 'bg-blue-100 text-blue-800',
      'COMPLETED': 'bg-green-100 text-green-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Match Scoring</h1>

        {/* Match List */}
        <div className="grid gap-4">
          {matches.map(match => (
            <div key={match.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">Match #{match.matchNumber}</h3>
                  <p className="text-gray-600">{match.category?.name}</p>
                  <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm ${getStatusBadge(match.status)}`}>
                    {match.status}
                  </span>
                </div>
                <button
                  onClick={() => navigate(`/scoring/${match.id}`)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  {match.status === 'ONGOING' ? <Play className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  {match.status === 'ONGOING' ? 'Score Match' : 'View Match'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MatchListPage;
