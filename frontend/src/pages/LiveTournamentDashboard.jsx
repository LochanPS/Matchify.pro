import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getTournamentMatches } from '../api/matches';
import { joinTournament, leaveTournament } from '../services/socketService';
import { Play, CheckCircle, Clock, Users, MapPin, Trophy } from 'lucide-react';
import LoadingScreen from '../components/LoadingScreen';

const LiveTournamentDashboard = () => {
  const { tournamentId } = useParams();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  useEffect(() => {
    fetchMatches();
    const cleanup = joinTournament(tournamentId, (data) => {
      fetchMatches();
      setIsLiveConnected(true);
    });
    return () => { cleanup(); leaveTournament(tournamentId); };
  }, [tournamentId]);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const data = await getTournamentMatches(tournamentId);
      setMatches(data.matches || []);
    } catch (err) {
      console.error('Failed to fetch matches:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'ONGOING':
      case 'IN_PROGRESS':
        return { bg: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: 'rgba(245,158,11,0.3)', icon: Play };
      case 'COMPLETED':
        return { bg: 'rgba(245,158,11,0.15)', color: '#FCD34D', border: 'rgba(245,158,11,0.3)', icon: CheckCircle };
      default:
        return { bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', border: 'rgba(255,255,255,0.12)', icon: Clock };
    }
  };

  const getRoundName = (round) => {
    const rounds = { 1: 'Round of 32', 2: 'Round of 16', 3: 'Quarter-Final', 4: 'Semi-Final', 5: 'Final' };
    return rounds[round] || `Round ${round}`;
  };

  const filteredMatches = matches.filter(m => {
    if (filter === 'all') return true;
    if (filter === 'ongoing') return m.status === 'ONGOING' || m.status === 'IN_PROGRESS';
    if (filter === 'completed') return m.status === 'COMPLETED';
    if (filter === 'pending') return m.status === 'PENDING' || m.status === 'READY';
    return true;
  });

  const stats = {
    total: matches.length,
    ongoing: matches.filter(m => m.status === 'ONGOING' || m.status === 'IN_PROGRESS').length,
    completed: matches.filter(m => m.status === 'COMPLETED').length,
    pending: matches.filter(m => m.status === 'PENDING' || m.status === 'READY').length,
  };

  if (loading) {
    return <LoadingScreen message="Loading tournament..." />;
  }

  const statCards = [
    { label: 'Total', value: stats.total, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', icon: Trophy },
    { label: 'Ongoing', value: stats.ongoing, color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.25)', icon: Play },
    { label: 'Completed', value: stats.completed, color: '#FCD34D', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', icon: CheckCircle },
    { label: 'Pending', value: stats.pending, color: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.1)', icon: Clock },
  ];

  const filterButtons = [
    { key: 'all', label: `All (${stats.total})` },
    { key: 'ongoing', label: `Live (${stats.ongoing})` },
    { key: 'completed', label: `Done (${stats.completed})` },
    { key: 'pending', label: `Pending (${stats.pending})` },
  ];

  return (
    <div className="min-h-screen relative" style={{ background: 'linear-gradient(180deg,#0a0a1f 0%,#050810 40%,#0d1a2a 70%,#050810 100%)' }}>
      {/* Fixed particles bg */}
      <div className="fixed top-0 bottom-0 pointer-events-none overflow-hidden" style={{ left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "480px" }}>
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl opacity-15" style={{ background: 'radial-gradient(circle,rgba(245,158,11,0.4) 0%,transparent 70%)' }} />
        <div className="absolute bottom-1/3 left-0 w-64 h-64 rounded-full blur-3xl opacity-10" style={{ background: 'radial-gradient(circle,rgba(245,158,11,0.4) 0%,transparent 70%)' }} />
      </div>

      {/* Sticky Header */}
      <div className="sticky top-0 z-20" style={{ background: 'rgba(7,7,26,0.95)', borderBottom: '1px solid rgba(245,158,11,0.15)', backdropFilter: 'blur(20px)' }}>
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="text-base font-black text-white">Live Tournament</h1>
          {isLiveConnected && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs font-black text-red-400">LIVE</span>
            </div>
          )}
        </div>
      </div>

      <div className="relative px-4 py-5 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {statCards.map(({ label, value, color, bg, border, icon: Icon }) => (
            <div key={label} className="rounded-2xl p-4 flex items-center gap-3" style={{ background: bg, border: `1px solid ${border}` }}>
              <Icon className="w-5 h-5 flex-shrink-0" style={{ color }} />
              <div>
                <p className="text-xl font-black" style={{ color }}>{value}</p>
                <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filterButtons.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className="flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all"
              style={{
                background: filter === key ? 'linear-gradient(135deg,#F59E0B,#D97706)' : 'rgba(255,255,255,0.06)',
                color: filter === key ? '#050810' : 'rgba(255,255,255,0.6)',
                border: filter === key ? 'none' : '1px solid rgba(255,255,255,0.1)',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Match Cards */}
        <div className="space-y-3">
          {filteredMatches.map((match) => {
            const statusInfo = getStatusInfo(match.status);
            const StatusIcon = statusInfo.icon;
            const isLive = match.status === 'ONGOING' || match.status === 'IN_PROGRESS';

            return (
              <div
                key={match.id}
                className="rounded-2xl overflow-hidden cursor-pointer transition-all hover:scale-[1.01]"
                style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${isLive ? 'rgba(245,158,11,0.25)' : 'rgba(255,255,255,0.08)'}` }}
                onClick={() => window.location.href = `/watch/${match.id}`}
              >
                <div className="p-4">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Match #{match.matchNumber}</p>
                      <p className="text-sm font-black text-white">{getRoundName(match.round)}</p>
                      {match.category && (
                        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{match.category.name}</p>
                      )}
                    </div>
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0" style={{ background: statusInfo.bg, color: statusInfo.color, border: `1px solid ${statusInfo.border}` }}>
                      <StatusIcon className="w-3 h-3" />
                      {match.status}
                    </span>
                  </div>

                  {/* Court + Score row */}
                  <div className="flex items-center justify-between gap-3">
                    {match.courtNumber && (
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                        <MapPin className="w-3.5 h-3.5" />
                        Court {match.courtNumber}
                      </div>
                    )}
                    {match.scoreJson && (() => {
                      const sj = typeof match.scoreJson === 'string' ? (() => { try { return JSON.parse(match.scoreJson); } catch { return null; } })() : match.scoreJson;
                      if (!sj) return null;
                      const setIdx = sj.currentSet || 0;
                      const setData = sj.sets?.[setIdx] || { player1: 0, player2: 0 };
                      const p1 = sj.currentScore?.player1 ?? setData.player1 ?? 0;
                      const p2 = sj.currentScore?.player2 ?? setData.player2 ?? 0;
                      return (
                        <div className="flex items-center gap-2">
                          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Score</span>
                          <span className="text-sm font-black" style={{ color: '#F59E0B' }}>
                            {p1} — {p2}
                          </span>
                          {sj.currentSet != null && (
                            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Set {sj.currentSet + 1}</span>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Watch button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); window.location.href = `/watch/${match.id}`; }}
                    className="w-full mt-3 py-2.5 rounded-xl font-bold text-xs transition-all"
                    style={{
                      background: isLive ? 'linear-gradient(135deg,#F59E0B,#D97706)' : 'rgba(255,255,255,0.08)',
                      color: isLive ? '#050810' : 'rgba(255,255,255,0.7)',
                      border: isLive ? 'none' : '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    {isLive ? '🔴 Watch Live' : 'View Match'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredMatches.length === 0 && (
          <div className="rounded-2xl p-10 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Users className="w-10 h-10 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.2)' }} />
            <p className="text-sm font-semibold text-white">No matches found</p>
            {filter !== 'all' && <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Try changing the filter</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveTournamentDashboard;

