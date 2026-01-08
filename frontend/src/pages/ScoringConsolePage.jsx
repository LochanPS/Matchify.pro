import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMatch, startMatch, addPoint, undoLastPoint } from '../api/matches';
import { joinMatch, leaveMatch } from '../services/socketService';
import ScoreBoard from '../components/scoring/ScoreBoard';
import ScoringControls from '../components/scoring/ScoringControls';
import MatchInfo from '../components/scoring/MatchInfo';
import MatchTimer from '../components/scoring/MatchTimer';
import GamePointIndicator from '../components/scoring/GamePointIndicator';
import DoublesRotationIndicator from '../components/scoring/DoublesRotationIndicator';
import ScoreCorrectionModal from '../components/scoring/ScoreCorrectionModal';
import { AlertCircle, ArrowLeft, RefreshCw, Users, AlertTriangle } from 'lucide-react';

const ScoringConsolePage = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [matchComplete, setMatchComplete] = useState(false);
  const [winner, setWinner] = useState(null);
  const [viewersCount, setViewersCount] = useState(0);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isDoubles, setIsDoubles] = useState(false);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);

  // Fetch match data
  const fetchMatch = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMatch(matchId);
      setMatch(data.match);
      setScore(data.match.scoreJson);
      setMatchComplete(data.match.status === 'COMPLETED');
      
      // Check if doubles based on category format
      if (data.match.category) {
        const format = data.match.category.format?.toLowerCase() || '';
        setIsDoubles(format.includes('doubles'));
      }
      
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

  // Start match
  const handleStartMatch = async () => {
    try {
      setProcessing(true);
      setError(null);
      const data = await startMatch(matchId);
      setScore(data.score);
      setMatch(prev => ({ ...prev, status: 'ONGOING' }));
      setProcessing(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start match');
      setProcessing(false);
    }
  };

  // Add point
  const handleAddPoint = async (player) => {
    try {
      setProcessing(true);
      setError(null);
      const data = await addPoint(matchId, player);
      setScore(data.score);
      
      if (data.matchComplete) {
        setMatchComplete(true);
        setWinner(data.winner);
        setMatch(prev => ({ ...prev, status: 'COMPLETED' }));
      }
      
      setProcessing(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add point');
      setProcessing(false);
    }
  };

  // Undo point
  const handleUndo = async () => {
    try {
      setProcessing(true);
      setError(null);
      const data = await undoLastPoint(matchId);
      setScore(data.score);
      setMatchComplete(false);
      setWinner(null);
      setMatch(prev => ({ ...prev, status: 'ONGOING' }));
      setProcessing(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to undo point');
      setProcessing(false);
    }
  };

  // Pause match
  const handlePause = () => {
    setIsPaused(true);
  };

  // Resume match
  const handleResume = () => {
    setIsPaused(false);
  };

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

  if (!match) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">Match not found</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-4">
            {/* Live Indicator */}
            {isLiveConnected && (
              <div className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-full">
                <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                <span className="text-sm font-semibold">LIVE</span>
              </div>
            )}
            <button
              onClick={fetchMatch}
              disabled={processing}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 disabled:text-gray-400"
            >
              <RefreshCw className={`w-5 h-5 ${processing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">Error</p>
              <p className="text-red-700">{error}</p>
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

        {/* Match Timer */}
        {match.status === 'ONGOING' && (
          <div className="mb-6">
            <MatchTimer
              matchStatus={match.status}
              startedAt={match.startedAt}
              onPause={handlePause}
              onResume={handleResume}
              isPaused={isPaused}
            />
          </div>
        )}

        {/* Game Point Indicator */}
        {score && match.status === 'ONGOING' && (
          <GamePointIndicator score={score} />
        )}

        {/* Doubles Rotation Indicator */}
        {isDoubles && score && match.status === 'ONGOING' && (
          <DoublesRotationIndicator
            isDoubles={isDoubles}
            currentServer={score.currentServer}
            player1Team={{ player1: 'Player 1A', player2: 'Player 1B' }}
            player2Team={{ player1: 'Player 2A', player2: 'Player 2B' }}
            score={score}
          />
        )}

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

        {/* Scoring Controls */}
        <ScoringControls
          onAddPoint={handleAddPoint}
          onUndo={handleUndo}
          onStart={handleStartMatch}
          matchStatus={match.status}
          player1Name="Player 1"
          player2Name="Player 2"
          disabled={processing || isPaused}
        />
        
        {isPaused && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
            <p className="text-yellow-800 font-semibold">
              ⏸️ Match is paused. Click "Resume" to continue scoring.
            </p>
          </div>
        )}

        {/* Score Correction Button */}
        {match.status === 'ONGOING' && (
          <div className="mt-6">
            <button
              onClick={() => setShowCorrectionModal(true)}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
            >
              <AlertTriangle className="w-5 h-5" />
              Request Score Correction
            </button>
            <p className="mt-2 text-sm text-gray-600 text-center">
              Use this if you need to correct a scoring error. Admin approval required.
            </p>
          </div>
        )}

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

        {/* Score Correction Modal */}
        {showCorrectionModal && score && (
          <ScoreCorrectionModal
            matchId={matchId}
            currentScore={score}
            onClose={() => setShowCorrectionModal(false)}
            onSuccess={() => {
              fetchMatch();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ScoringConsolePage;
