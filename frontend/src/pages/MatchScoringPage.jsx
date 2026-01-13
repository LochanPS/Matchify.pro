import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { 
  Play, Pause, Trophy, Plus, Minus, 
  AlertTriangle, X, Clock, Calendar
} from 'lucide-react';
import { pauseTimer, resumeTimer } from '../api/matches';

const MatchScoringPage = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timerData, setTimerData] = useState(null);

  // Score state
  const [score, setScore] = useState({
    sets: [{ player1: 0, player2: 0 }],
    currentSet: 0,
    matchConfig: {
      pointsPerSet: 21,
      setsToWin: 2,
      maxSets: 3
    }
  });

  const fetchMatch = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/matches/${matchId}`);
      const matchData = response.data.match;
      setMatch(matchData);
      
      if (matchData.score) {
        setScore(matchData.score);
        setTimerData(matchData.score.timer);
        setIsPaused(matchData.score.timer?.isPaused || false);
      } else if (matchData.scoreJson) {
        const parsed = typeof matchData.scoreJson === 'string' 
          ? JSON.parse(matchData.scoreJson) 
          : matchData.scoreJson;
        setScore(parsed);
        setTimerData(parsed.timer);
        setIsPaused(parsed.timer?.isPaused || false);
      }
    } catch (err) {
      console.error('Error fetching match:', err);
      setError('Failed to load match');
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    fetchMatch();
  }, [fetchMatch]);

  // Start match
  const handleStartMatch = async () => {
    try {
      setSaving(true);
      const response = await api.put(`/matches/${matchId}/start`);
      setMatch(response.data.match);
      if (response.data.match.score) {
        setScore(response.data.match.score);
        setTimerData(response.data.match.score.timer);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start match');
    } finally {
      setSaving(false);
    }
  };

  // Update score
  const updateScore = async (newScore) => {
    setScore(newScore);
    try {
      await api.put(`/matches/${matchId}/score`, { score: newScore });
    } catch (err) {
      console.error('Error updating score:', err);
    }
  };

  // Add point to player
  const addPoint = (player) => {
    if (isPaused) return; // Don't allow scoring when paused
    
    const newScore = { ...score };
    const currentSetIndex = newScore.currentSet;
    const currentSet = { ...newScore.sets[currentSetIndex] };
    
    if (player === 1) {
      currentSet.player1 += 1;
    } else {
      currentSet.player2 += 1;
    }
    
    newScore.sets[currentSetIndex] = currentSet;

    // Check if set is won
    const { pointsPerSet } = newScore.matchConfig;
    const p1 = currentSet.player1;
    const p2 = currentSet.player2;
    
    const setWon = (p1 >= pointsPerSet && p1 - p2 >= 2) || 
                   (p2 >= pointsPerSet && p2 - p1 >= 2) ||
                   p1 >= 30 || p2 >= 30;

    if (setWon && currentSetIndex < newScore.matchConfig.maxSets - 1) {
      const p1Sets = newScore.sets.filter((s, i) => i <= currentSetIndex && 
        ((s.player1 >= pointsPerSet && s.player1 - s.player2 >= 2) || s.player1 >= 30)).length;
      const p2Sets = newScore.sets.filter((s, i) => i <= currentSetIndex && 
        ((s.player2 >= pointsPerSet && s.player2 - s.player1 >= 2) || s.player2 >= 30)).length;

      if (p1Sets < newScore.matchConfig.setsToWin && p2Sets < newScore.matchConfig.setsToWin) {
        newScore.sets.push({ player1: 0, player2: 0 });
        newScore.currentSet = currentSetIndex + 1;
      }
    }

    updateScore(newScore);
  };

  // Remove point (undo)
  const removePoint = (player) => {
    if (isPaused) return;
    
    const newScore = { ...score };
    const currentSetIndex = newScore.currentSet;
    const currentSet = { ...newScore.sets[currentSetIndex] };
    
    if (player === 1 && currentSet.player1 > 0) {
      currentSet.player1 -= 1;
    } else if (player === 2 && currentSet.player2 > 0) {
      currentSet.player2 -= 1;
    }
    
    newScore.sets[currentSetIndex] = currentSet;
    updateScore(newScore);
  };

  // Pause timer
  const handlePauseTimer = async () => {
    try {
      setSaving(true);
      const data = await pauseTimer(matchId);
      setTimerData(data.timer);
      setIsPaused(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to pause timer');
    } finally {
      setSaving(false);
    }
  };

  // Resume timer
  const handleResumeTimer = async () => {
    try {
      setSaving(true);
      const data = await resumeTimer(matchId);
      setTimerData(data.timer);
      setIsPaused(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resume timer');
    } finally {
      setSaving(false);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    if (match?.tournament?.id && match?.category?.id) {
      navigate(`/tournaments/${match.tournament.id}/draw?category=${match.category.id}`);
    } else if (match?.tournamentId && match?.categoryId) {
      navigate(`/tournaments/${match.tournamentId}/draw?category=${match.categoryId}`);
    } else {
      navigate('/dashboard');
    }
  };

  // End match
  const handleEndMatch = async (winnerId) => {
    try {
      setSaving(true);
      await api.put(`/matches/${matchId}/end`, { winnerId, finalScore: score });
      setShowEndModal(false);
      // Navigate to draw page after ending match
      if (match?.tournament?.id && match?.category?.id) {
        navigate(`/tournaments/${match.tournament.id}/draw?category=${match.category.id}`);
      } else if (match?.tournamentId && match?.categoryId) {
        navigate(`/tournaments/${match.tournamentId}/draw?category=${match.categoryId}`);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to end match');
    } finally {
      setSaving(false);
    }
  };

  // Calculate sets won
  const getSetsWon = () => {
    const { pointsPerSet } = score.matchConfig;
    let p1Sets = 0, p2Sets = 0;
    
    score.sets.forEach(set => {
      if ((set.player1 >= pointsPerSet && set.player1 - set.player2 >= 2) || set.player1 >= 30) p1Sets++;
      if ((set.player2 >= pointsPerSet && set.player2 - set.player1 >= 2) || set.player2 >= 30) p2Sets++;
    });
    
    return { p1Sets, p2Sets };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white">Match not found</h2>
        </div>
      </div>
    );
  }

  const { p1Sets, p2Sets } = getSetsWon();
  const currentSet = score.sets[score.currentSet] || { player1: 0, player2: 0 };
  const isInProgress = match.status === 'IN_PROGRESS';
  const isCompleted = match.status === 'COMPLETED';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 border-b border-white/10 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back
          </button>
          <div className="flex items-center gap-3">
            {/* Timer Controls */}
            {isInProgress && (
              <>
                {!isPaused ? (
                  <button
                    onClick={handlePauseTimer}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-xl hover:bg-amber-500/30 transition-all disabled:opacity-50"
                  >
                    <Pause className="w-5 h-5" />
                    Pause
                  </button>
                ) : (
                  <button
                    onClick={handleResumeTimer}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl hover:bg-emerald-500/30 transition-all disabled:opacity-50"
                  >
                    <Play className="w-5 h-5" />
                    Resume
                  </button>
                )}
                <button
                  onClick={() => setShowEndModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  End Match
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-4xl mx-auto px-4 mt-4">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className="text-red-300">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto"><X className="w-5 h-5 text-red-400" /></button>
          </div>
        </div>
      )}

      {/* Match Info */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="text-center mb-6">
          <p className="text-gray-400 text-sm">{match.tournament?.name} • {match.category?.name}</p>
          <p className="text-gray-500 text-xs mt-1">Match #{match.matchNumber} • Court {match.courtNumber || 'TBD'}</p>
        </div>

        {/* Timer Display */}
        {isInProgress && (
          <MatchTimerDisplay 
            timer={timerData} 
            isPaused={isPaused}
          />
        )}

        {/* Paused Indicator */}
        {isPaused && (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center">
            <p className="text-amber-300 font-semibold flex items-center justify-center gap-2">
              <Pause className="w-5 h-5" />
              Match Paused - Scoring Disabled
            </p>
          </div>
        )}

        {/* Scoreboard */}
        <div className="bg-slate-800/70 backdrop-blur-sm border border-white/10 rounded-3xl p-6 mb-6">
          {/* Sets Score */}
          <div className="flex justify-center gap-4 mb-6">
            {score.sets.map((set, idx) => (
              <div 
                key={idx} 
                className={`px-4 py-2 rounded-xl text-center min-w-[80px] ${
                  idx === score.currentSet 
                    ? 'bg-purple-500/20 border-2 border-purple-500' 
                    : 'bg-slate-700/50'
                }`}
              >
                <div className="text-xs text-gray-400 mb-1">Set {idx + 1}</div>
                <div className="text-lg font-bold text-white">{set.player1} - {set.player2}</div>
              </div>
            ))}
          </div>

          {/* Players */}
          <div className="grid grid-cols-3 gap-4 items-center">
            {/* Player 1 */}
            <div className="text-center">
              <div className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center text-4xl font-bold mb-3 ${
                p1Sets > p2Sets ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/50 text-white'
              }`}>
                {p1Sets}
              </div>
              <h3 className="text-lg font-bold text-white truncate">{match.player1?.name || 'Player 1'}</h3>
              <p className="text-sm text-gray-400">Sets Won</p>
            </div>

            {/* Current Score */}
            <div className="text-center">
              <div className="text-6xl font-black text-white mb-2">
                {currentSet.player1} <span className="text-gray-500">-</span> {currentSet.player2}
              </div>
              <p className="text-amber-400 font-semibold">Set {score.currentSet + 1}</p>
            </div>

            {/* Player 2 */}
            <div className="text-center">
              <div className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center text-4xl font-bold mb-3 ${
                p2Sets > p1Sets ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/50 text-white'
              }`}>
                {p2Sets}
              </div>
              <h3 className="text-lg font-bold text-white truncate">{match.player2?.name || 'Player 2'}</h3>
              <p className="text-sm text-gray-400">Sets Won</p>
            </div>
          </div>
        </div>

        {/* Scoring Controls */}
        {!isCompleted && (
          <div className="grid grid-cols-2 gap-6">
            {/* Player 1 Controls */}
            <div className={`bg-slate-800/50 border rounded-2xl p-6 ${isPaused ? 'border-amber-500/30 opacity-50' : 'border-white/10'}`}>
              <h4 className="text-center text-white font-semibold mb-4">{match.player1?.name || 'Player 1'}</h4>
              {isInProgress ? (
                <div className="space-y-3">
                  <button
                    onClick={() => addPoint(1)}
                    disabled={isPaused}
                    className="w-full py-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-2xl font-bold hover:shadow-lg hover:shadow-emerald-500/30 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    <Plus className="w-8 h-8" />
                    Point
                  </button>
                  <button
                    onClick={() => removePoint(1)}
                    disabled={isPaused}
                    className="w-full py-3 bg-slate-700 text-gray-300 rounded-xl font-semibold hover:bg-slate-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-5 h-5" />
                    Undo
                  </button>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Start match to score
                </div>
              )}
            </div>

            {/* Player 2 Controls */}
            <div className={`bg-slate-800/50 border rounded-2xl p-6 ${isPaused ? 'border-amber-500/30 opacity-50' : 'border-white/10'}`}>
              <h4 className="text-center text-white font-semibold mb-4">{match.player2?.name || 'Player 2'}</h4>
              {isInProgress ? (
                <div className="space-y-3">
                  <button
                    onClick={() => addPoint(2)}
                    disabled={isPaused}
                    className="w-full py-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-2xl font-bold hover:shadow-lg hover:shadow-blue-500/30 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    <Plus className="w-8 h-8" />
                    Point
                  </button>
                  <button
                    onClick={() => removePoint(2)}
                    disabled={isPaused}
                    className="w-full py-3 bg-slate-700 text-gray-300 rounded-xl font-semibold hover:bg-slate-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-5 h-5" />
                    Undo
                  </button>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Start match to score
                </div>
              )}
            </div>
          </div>
        )}

        {/* Start Match Button */}
        {match.status === 'PENDING' && (
          <div className="mt-6">
            <button
              onClick={handleStartMatch}
              disabled={saving}
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl text-xl font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {saving ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <Play className="w-6 h-6" />
                  Start Match
                </>
              )}
            </button>
          </div>
        )}

        {/* Match Completed */}
        {isCompleted && (
          <div className="mt-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center">
            <Trophy className="w-12 h-12 text-amber-400 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-white mb-2">Match Completed</h3>
            <p className="text-gray-400">Winner: {match.winnerId === match.player1?.id ? match.player1?.name : match.player2?.name}</p>
            {score.timer?.totalDurationFormatted && (
              <p className="text-gray-500 text-sm mt-2">Duration: {score.timer.totalDurationFormatted}</p>
            )}
          </div>
        )}
      </div>

      {/* End Match Modal */}
      {showEndModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-white/10 rounded-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-white mb-4 text-center">End Match</h2>
            <p className="text-gray-400 text-center mb-6">Select the winner to end this match</p>
            
            <div className="space-y-3">
              <button
                onClick={() => handleEndMatch(match.player1?.id)}
                disabled={saving}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-3"
              >
                <Trophy className="w-5 h-5" />
                {match.player1?.name} Wins
              </button>
              <button
                onClick={() => handleEndMatch(match.player2?.id)}
                disabled={saving}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-3"
              >
                <Trophy className="w-5 h-5" />
                {match.player2?.name} Wins
              </button>
              <button
                onClick={() => setShowEndModal(false)}
                className="w-full py-3 bg-slate-700 text-gray-300 rounded-xl font-semibold hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Timer Display Component
const MatchTimerDisplay = ({ timer, isPaused }) => {
  const [displayTime, setDisplayTime] = useState(0);

  useEffect(() => {
    if (!timer?.startedAt) {
      setDisplayTime(0);
      return;
    }

    // Calculate initial elapsed time
    const calculateElapsed = () => {
      const startTime = new Date(timer.startedAt).getTime();
      const now = Date.now();
      const totalPausedTime = timer.totalPausedTime || 0;
      
      let elapsed = now - startTime - totalPausedTime;
      
      // If currently paused, subtract time since pause started
      if (isPaused && timer.pausedAt) {
        const pauseStart = new Date(timer.pausedAt).getTime();
        elapsed -= (now - pauseStart);
      }
      
      return Math.max(0, Math.floor(elapsed / 1000));
    };

    // Set initial value
    setDisplayTime(calculateElapsed());

    // Only update if not paused
    if (isPaused) return;

    const interval = setInterval(() => {
      setDisplayTime(calculateElapsed());
    }, 1000);

    return () => clearInterval(interval);
  }, [timer, isPaused]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatStartTime = (dateString) => {
    if (!dateString) return '--:--';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-center gap-2 mb-2 text-gray-400 text-sm">
        <Calendar className="w-4 h-4" />
        <span>Started at {formatStartTime(timer?.startedAt)}</span>
      </div>
      <div className="flex items-center justify-center gap-3">
        <Clock className={`w-6 h-6 ${isPaused ? 'text-amber-400' : 'text-emerald-400'}`} />
        <span className={`text-3xl font-bold font-mono ${isPaused ? 'text-amber-400' : 'text-white'}`}>
          {formatTime(displayTime)}
        </span>
      </div>
      {timer?.pauseHistory?.length > 0 && (
        <p className="text-center text-gray-500 text-xs mt-2">
          {timer.pauseHistory.length} pause{timer.pauseHistory.length > 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
};

export default MatchScoringPage;
