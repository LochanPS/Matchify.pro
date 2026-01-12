import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { 
  Play, Pause, Trophy, RotateCcw, Plus, Minus, 
  CheckCircle, AlertTriangle, X, Settings, Users
} from 'lucide-react';

const MatchScoringPage = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);

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
      } else if (matchData.scoreJson) {
        const parsed = typeof matchData.scoreJson === 'string' 
          ? JSON.parse(matchData.scoreJson) 
          : matchData.scoreJson;
        setScore(parsed);
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
    
    // Standard badminton rules: first to 21, win by 2, max 30
    const setWon = (p1 >= pointsPerSet && p1 - p2 >= 2) || 
                   (p2 >= pointsPerSet && p2 - p1 >= 2) ||
                   p1 >= 30 || p2 >= 30;

    if (setWon && currentSetIndex < newScore.matchConfig.maxSets - 1) {
      // Check if match is won
      const p1Sets = newScore.sets.filter((s, i) => i <= currentSetIndex && 
        ((s.player1 >= pointsPerSet && s.player1 - s.player2 >= 2) || s.player1 >= 30)).length;
      const p2Sets = newScore.sets.filter((s, i) => i <= currentSetIndex && 
        ((s.player2 >= pointsPerSet && s.player2 - s.player1 >= 2) || s.player2 >= 30)).length;

      if (p1Sets < newScore.matchConfig.setsToWin && p2Sets < newScore.matchConfig.setsToWin) {
        // Start new set
        newScore.sets.push({ player1: 0, player2: 0 });
        newScore.currentSet = currentSetIndex + 1;
      }
    }

    updateScore(newScore);
  };

  // Remove point (undo)
  const removePoint = (player) => {
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

  // End match
  const handleEndMatch = async (winnerId) => {
    try {
      setSaving(true);
      await api.put(`/matches/${matchId}/end`, { winnerId, finalScore: score });
      setShowEndModal(false);
      navigate(-1);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to end match');
    } finally {
      setSaving(false);
    }
  };

  // Update match config
  const updateConfig = (newConfig) => {
    const newScore = { ...score, matchConfig: newConfig };
    updateScore(newScore);
    setShowConfigModal(false);
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
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowConfigModal(true)}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5 text-gray-400" />
            </button>
            {isInProgress && (
              <button
                onClick={() => setShowEndModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                End Match
              </button>
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
            <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-6">
              <h4 className="text-center text-white font-semibold mb-4">{match.player1?.name || 'Player 1'}</h4>
              {isInProgress ? (
                <div className="space-y-3">
                  <button
                    onClick={() => addPoint(1)}
                    className="w-full py-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-2xl font-bold hover:shadow-lg hover:shadow-emerald-500/30 hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                  >
                    <Plus className="w-8 h-8" />
                    Point
                  </button>
                  <button
                    onClick={() => removePoint(1)}
                    className="w-full py-3 bg-slate-700 text-gray-300 rounded-xl font-semibold hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
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
            <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-6">
              <h4 className="text-center text-white font-semibold mb-4">{match.player2?.name || 'Player 2'}</h4>
              {isInProgress ? (
                <div className="space-y-3">
                  <button
                    onClick={() => addPoint(2)}
                    className="w-full py-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-2xl font-bold hover:shadow-lg hover:shadow-blue-500/30 hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                  >
                    <Plus className="w-8 h-8" />
                    Point
                  </button>
                  <button
                    onClick={() => removePoint(2)}
                    className="w-full py-3 bg-slate-700 text-gray-300 rounded-xl font-semibold hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
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

      {/* Config Modal */}
      {showConfigModal && (
        <MatchConfigModal
          config={score.matchConfig}
          onSave={updateConfig}
          onClose={() => setShowConfigModal(false)}
        />
      )}
    </div>
  );
};

// Match Configuration Modal
const MatchConfigModal = ({ config, onSave, onClose }) => {
  const [localConfig, setLocalConfig] = useState(config);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-white/10 rounded-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Match Settings</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Points per Set</label>
            <div className="grid grid-cols-3 gap-2">
              {[11, 15, 21].map(pts => (
                <button
                  key={pts}
                  onClick={() => setLocalConfig({ ...localConfig, pointsPerSet: pts })}
                  className={`py-3 rounded-xl font-semibold transition-all ${
                    localConfig.pointsPerSet === pts
                      ? 'bg-purple-500 text-white'
                      : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  }`}
                >
                  {pts}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Sets to Win</label>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map(sets => (
                <button
                  key={sets}
                  onClick={() => setLocalConfig({ ...localConfig, setsToWin: sets, maxSets: sets * 2 - 1 })}
                  className={`py-3 rounded-xl font-semibold transition-all ${
                    localConfig.setsToWin === sets
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  }`}
                >
                  Best of {sets * 2 - 1}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-slate-700 text-gray-300 rounded-xl font-semibold hover:bg-slate-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(localConfig)}
            className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default MatchScoringPage;
