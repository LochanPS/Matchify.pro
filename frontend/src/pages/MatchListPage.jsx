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

  const getStatusStyle = (status) => {
    const map = {
      'PENDING':   { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: 'rgba(255,255,255,0.1)' },
      'ONGOING':   { bg: 'rgba(16,185,129,0.12)',  color: '#34D399',               border: 'rgba(16,185,129,0.3)' },
      'COMPLETED': { bg: 'rgba(245,158,11,0.12)',  color: '#FCD34D',               border: 'rgba(245,158,11,0.25)' },
    };
    return map[status] || map['PENDING'];
  };

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: '#050810' }}>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-black text-white mb-8">Match Scoring</h1>

        {/* Match List */}
        <div className="grid gap-4">
          {matches.map(match => {
            const s = getStatusStyle(match.status);
            return (
            <div key={match.id} className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-white">Match #{match.matchNumber}</h3>
                  <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{match.category?.name}</p>
                  <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                    {match.status}
                  </span>
                </div>
                <button
                  onClick={() => navigate(`/scoring/${match.id}`)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#F59E0B,#D97706)', color: '#050810' }}
                >
                  {match.status === 'ONGOING' ? <Play className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {match.status === 'ONGOING' ? 'Score Match' : 'View Match'}
                </button>
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MatchListPage;
