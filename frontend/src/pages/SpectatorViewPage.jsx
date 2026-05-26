import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getMatch } from '../api/matches';
import { joinMatch, leaveMatch } from '../services/socketService';
import ScoreBoard from '../components/scoring/ScoreBoard';
import MatchInfo from '../components/scoring/MatchInfo';
import { RefreshCw, Users, Wifi } from 'lucide-react';
import LoadingScreen from '../components/LoadingScreen';

const SpectatorViewPage = () => {
  const { matchId } = useParams();
  const [match, setMatch] = useState(null);
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [matchComplete, setMatchComplete] = useState(false);
  const [winner, setWinner] = useState(null);

  const fetchMatch = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMatch(matchId);
      setMatch(data.match);
      setScore(data.match.scoreJson);
      setMatchComplete(data.match.status === 'COMPLETED');
    } catch (err) {
      setError('Failed to load match');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatch();
    // Try Socket.IO (works in local dev only — disabled on Vercel serverless)
    const cleanup = joinMatch(
      matchId,
      (data) => { setScore(data.score); setIsLiveConnected(true); },
      (data) => { setScore(data.score); setMatchComplete(true); setWinner(data.winner); setMatch(prev => ({ ...prev, status: 'COMPLETED' })); setIsLiveConnected(true); },
      (data) => { if (data.status === 'ONGOING') { setMatch(prev => ({ ...prev, status: 'ONGOING' })); if (data.score) setScore(data.score); } setIsLiveConnected(true); }
    );
    return () => { cleanup(); leaveMatch(matchId); };
  }, [matchId]);

  // Polling fallback — 3s interval when Socket.IO not connected (production)
  useEffect(() => {
    if (isLiveConnected || matchComplete) return;
    const interval = setInterval(async () => {
      try {
        const data = await getMatch(matchId);
        if (data?.match) {
          setMatch(data.match);
          setScore(data.match.scoreJson);
          if (data.match.status === 'COMPLETED') {
            setMatchComplete(true);
            clearInterval(interval);
          }
        }
      } catch (_) {}
    }, 3000);
    return () => clearInterval(interval);
  }, [isLiveConnected, matchComplete, matchId]);

  if (loading) {
    return <LoadingScreen message="Loading match..." />;
  }

  if (error || !match) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg,#0a0a1f 0%,#050810 100%)' }}>
        <div className="text-center p-8 rounded-2xl" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <p className="text-red-400 font-semibold">{error || 'Match not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative" style={{ background: 'linear-gradient(180deg,#0a0a1f 0%,#050810 40%,#0d1a2a 70%,#050810 100%)' }}>
      {/* Fixed bg glow */}
      <div className="fixed top-0 bottom-0 pointer-events-none overflow-hidden" style={{ left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "480px" }}>
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl opacity-15" style={{ background: 'radial-gradient(circle,rgba(245,158,11,0.4) 0%,transparent 70%)' }} />
        <div className="absolute bottom-1/3 left-0 w-64 h-64 rounded-full blur-3xl opacity-10" style={{ background: 'radial-gradient(circle,rgba(245,158,11,0.4) 0%,transparent 70%)' }} />
      </div>

      {/* Sticky Header */}
      <div className="sticky top-0 z-20" style={{ background: 'rgba(7,7,26,0.95)', borderBottom: '1px solid rgba(245,158,11,0.15)', backdropFilter: 'blur(20px)' }}>
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h1 className="text-base font-black text-white">Live Match</h1>
            {isLiveConnected && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs font-black text-red-400">LIVE</span>
              </div>
            )}
          </div>
          <button onClick={fetchMatch} className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: '#F59E0B' }}>
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      <div className="relative px-4 py-5 space-y-4">
        {/* Connection Status */}
        {!isLiveConnected && (
          <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)' }}>
            <Wifi className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#fbbf24' }} />
            <div>
              <p className="text-sm font-bold" style={{ color: '#fbbf24' }}>Connecting to live updates...</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(251,191,36,0.7)' }}>Scores will update automatically when connected</p>
            </div>
          </div>
        )}

        {/* Match Completion Banner */}
        {matchComplete && winner && (
          <div className="rounded-2xl p-6 text-center" style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.15),rgba(245,158,11,0.1))', border: '2px solid rgba(245,158,11,0.4)' }}>
            <div className="text-4xl mb-2">🏆</div>
            <h2 className="text-xl font-black text-white mb-1">Match Complete!</h2>
            <p className="text-sm font-semibold" style={{ color: '#F59E0B' }}>
              {winner === 'player1' ? 'Player 1' : 'Player 2'} wins!
            </p>
          </div>
        )}

        {/* Match Info */}
        <MatchInfo match={match} />

        {/* Score Board */}
        {score && (
          <div>
            <ScoreBoard score={score} player1Name="Player 1" player2Name="Player 2" />
          </div>
        )}

        {/* Spectator Info */}
        <div className="rounded-2xl p-5 text-center" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <Users className="w-10 h-10 mx-auto mb-3" style={{ color: '#FCD34D' }} />
          <h3 className="text-sm font-black text-white mb-1">Spectator View</h3>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
            You're watching this match live. Scores update automatically.
          </p>
        </div>

        {/* Score History */}
        {score && score.history && score.history.length > 0 && (
          <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="text-sm font-black text-white">Point History</h3>
            </div>
            <div className="max-h-64 overflow-y-auto p-3 space-y-2">
              {score.history.slice().reverse().map((point, i) => (
                <div key={score.history.length - i} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-black w-6" style={{ color: 'rgba(255,255,255,0.35)' }}>#{score.history.length - i}</span>
                    <span className="text-sm font-bold" style={{ color: point.player === 'player1' ? '#FCD34D' : '#F59E0B' }}>
                      {point.player === 'player1' ? 'Player 1' : 'Player 2'}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono text-white">{point.score.player1} — {point.score.player2}</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Set {point.set}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpectatorViewPage;

