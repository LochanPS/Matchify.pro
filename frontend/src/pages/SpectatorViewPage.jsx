import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getMatch } from '../api/matches';
import { joinMatch, leaveMatch } from '../services/socketService';
import ScoreBoard from '../components/scoring/ScoreBoard';
import MatchInfo from '../components/scoring/MatchInfo';
import { RefreshCw, Users, Wifi } from 'lucide-react';

const SpectatorViewPage = () => {
  const { matchId } = useParams();
  const [match, setMatch] = useState(null);
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [matchComplete, setMatchComplete] = useState(false);
  const [winner, setWinner] = useState(null);

  // Fetch match data
  const fetchMatch = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMatch(matchId);
      setMatch(data.match);
      setScore(data.match.scoreJson);
      setMatchComplete(data.match.status === 'COMPLETED');
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load match');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatch();

    // Setup WebSocket connection for live updates
    const cleanup = joinMatch(
      matchId,
      // On score update
      (data) => {
        console.log('Live score update:', data);
        setScore(data.score);
        setIsLiveConnected(true);
      },
      // On match complete
      (data) => {
        console.log('Match completed:', data);
        setScore(data.score);
        setMatchComplete(true);
        setWinner(data.winner);
        setMatch(prev => ({ ...prev, status: 'COMPLETED' }));
        setIsLiveConnected(true);
      },
      // On match status change
      (data) => {
        console.log('Match status changed:', data);
        if (data.status === 'ONGOING') {
          setMatch(prev => ({ ...prev, status: 'ONGOING' }));
          if (data.score) {
            setScore(data.score);
          }
        }
        setIsLiveConnected(true);
      }
    );

    // Cleanup on unmount
    return () => {
      cleanup();
      leaveMatch(matchId);
    };
  }, [matchId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading match...</p>
        </div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">{error || 'Match not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Live Match</h1>
            {isLiveConnected && (
              <div className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-full">
                <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                <span className="text-sm font-semibold">LIVE</span>
              </div>
            )}
          </div>
          <button
            onClick={fetchMatch}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Connection Status */}
        {!isLiveConnected && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <Wifi className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-900">Connecting to live updates...</p>
              <p className="text-yellow-700 text-sm">Scores will update automatically when connected</p>
            </div>
          </div>
        )}

        {/* Match Completion Banner */}
        {matchComplete && winner && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6 text-center">
            <h2 className="text-3xl font-bold text-green-900 mb-2">
              🏆 Match Complete! 🏆
            </h2>
            <p className="text-xl text-green-700">
              {winner === 'player1' ? 'Player 1' : 'Player 2'} wins!
            </p>
          </div>
        )}

        {/* Match Info */}
        <MatchInfo match={match} />

        {/* Score Board */}
        {score && (
          <div className="mb-6">
            <ScoreBoard 
              score={score}
              player1Name="Player 1"
              player2Name="Player 2"
            />
          </div>
        )}

        {/* Spectator Info */}
        <div className="bg-blue-50 rounded-lg p-6 text-center">
          <Users className="w-12 h-12 text-blue-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">Spectator View</h3>
          <p className="text-gray-600">
            You're watching this match live. Scores update automatically.
          </p>
        </div>

        {/* Score History */}
        {score && score.history && score.history.length > 0 && (
          <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Point History</h3>
            <div className="max-h-64 overflow-y-auto">
              <div className="space-y-2">
                {score.history.slice().reverse().map((point, index) => (
                  <div
                    key={score.history.length - index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-gray-500">
                        #{score.history.length - index}
                      </span>
                      <span className={`font-semibold ${
                        point.player === 'player1' ? 'text-blue-600' : 'text-green-600'
                      }`}>
                        {point.player === 'player1' ? 'Player 1' : 'Player 2'}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono">
                        {point.score.player1} - {point.score.player2}
                      </p>
                      <p className="text-xs text-gray-500">Set {point.set}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpectatorViewPage;
