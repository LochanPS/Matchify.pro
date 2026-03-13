import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMatch, startMatch, addPoint, undoLastPoint, pauseTimer, resumeTimer } from '../api/matches';
import { joinMatch, leaveMatch } from '../services/socketService';
import ScoreBoard from '../components/scoring/ScoreBoard';
import ScoringControls from '../components/scoring/ScoringControls';
import MatchInfo from '../components/scoring/MatchInfo';
import MatchTimer from '../components/scoring/MatchTimer';
import GamePointIndicator from '../components/scoring/GamePointIndicator';
import DoublesRotationIndicator from '../components/scoring/DoublesRotationIndicator';
import ScoreCorrectionModal from '../components/scoring/ScoreCorrectionModal';
import { AlertCircle, ArrowLeft, RefreshCw, AlertTriangle, Trophy, Target, Clock, MapPin } from 'lucide-react';

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
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isDoubles, setIsDoubles] = useState(false);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [timerData, setTimerData] = useState(null);

  const fetchMatch = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMatch(matchId);
      setMatch(data.match);
      const scoreData = data.match.scoreJson ? 
        (typeof data.match.scoreJson === 'string' ? JSON.parse(data.match.scoreJson) : data.match.scoreJson) 
        : null;
      setScore(scoreData);
      setTimerData(scoreData?.timer || null);
      setIsPaused(scoreData?.timer?.isPaused || false);
      setMatchComplete(data.match.status === 'COMPLETED');
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
    const cleanup = joinMatch(matchId,
      (data) => { 
        setScore(data.score); 
        if (data.score?.timer) {
          setTimerData(data.score.timer);
          setIsPaused(data.score.timer.isPaused || false);
        }
        setIsLiveConnected(true); 
      },
      (data) => { setScore(data.score); setMatchComplete(true); setWinner(data.winner); setMatch(prev => ({ ...prev, status: 'COMPLETED' })); setIsLiveConnected(true); },
      (data) => { if (data.status === 'ONGOING' || data.status === 'IN_PROGRESS') { setMatch(prev => ({ ...prev, status: data.status })); if (data.score) setScore(data.score); } setIsLiveConnected(true); }
    );
    return () => { cleanup(); leaveMatch(matchId); };
  }, [matchId]);

  const handleStartMatch = async () => {
    try {
      setProcessing(true); setError(null);
      const data = await startMatch(matchId);
      const newScore = data.score || data.match?.score;
      setScore(newScore);
      setTimerData(newScore?.timer || data.timer);
      setMatch(prev => ({ ...prev, status: 'IN_PROGRESS', startedAt: new Date().toISOString() }));
      setProcessing(false);
    } catch (err) { setError(err.response?.data?.error || 'Failed to start match'); setProcessing(false); }
  };

  const handleAddPoint = async (player) => {
    try {
      setProcessing(true); setError(null);
      const data = await addPoint(matchId, player);
      setScore(data.score || data.scoreData);
      if (data.matchComplete) { setMatchComplete(true); setWinner(data.winner); setMatch(prev => ({ ...prev, status: 'COMPLETED' })); }
      setProcessing(false);
    } catch (err) { setError(err.response?.data?.error || 'Failed to add point'); setProcessing(false); }
  };

  const handleUndo = async () => {
    try {
      setProcessing(true); setError(null);
      const data = await undoLastPoint(matchId);
      setScore(data.score);
      setMatchComplete(false); setWinner(null);
      setMatch(prev => ({ ...prev, status: 'IN_PROGRESS' }));
      setProcessing(false);
    } catch (err) { setError(err.response?.data?.error || 'Failed to undo point'); setProcessing(false); }
  };

  const handlePauseTimer = async () => {
    try {
      setProcessing(true); setError(null);
      const data = await pauseTimer(matchId);
      setTimerData(data.timer);
      setIsPaused(true);
      // Update score with new timer data
      setScore(prev => prev ? { ...prev, timer: data.timer } : prev);
      setProcessing(false);
    } catch (err) { 
      setError(err.response?.data?.error || 'Failed to pause timer'); 
      setProcessing(false); 
    }
  };

  const handleResumeTimer = async () => {
    try {
      setProcessing(true); setError(null);
      const data = await resumeTimer(matchId);
      setTimerData(data.timer);
      setIsPaused(false);
      // Update score with new timer data
      setScore(prev => prev ? { ...prev, timer: data.timer } : prev);
      setProcessing(false);
    } catch (err) { 
      setError(err.response?.data?.error || 'Failed to resume timer'); 
      setProcessing(false); 
    }
  };

  const player1Name = match?.player1?.name || 'Player 1';
  const player2Name = match?.player2?.name || 'Player 2';
  const matchConfig = score?.matchConfig || { pointsPerSet: 21, setsToWin: 2, maxSets: 3, extension: true };

  // Helper to format match duration from timer data
  const formatMatchDuration = (timer) => {
    if (!timer?.startedAt) return '--:--';
    const startTime = new Date(timer.startedAt).getTime();
    const endTime = timer.endedAt ? new Date(timer.endedAt).getTime() : Date.now();
    const totalMs = endTime - startTime - (timer.totalPausedTime || 0);
    const seconds = Math.floor(totalMs / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    return `${minutes}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading match...</p>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-400">Match not found</p>
          <button onClick={() => navigate(-1)} className="mt-4 text-emerald-400 hover:text-emerald-300">Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-6 px-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
      </div>
      <div className="relative max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" /><span>Back</span>
          </button>
          <div className="flex items-center gap-4">
            {isLiveConnected && (
              <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 border border-red-500/30 text-red-400 rounded-full">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                <span className="text-sm font-semibold">LIVE</span>
              </div>
            )}
            <button onClick={fetchMatch} disabled={processing} className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 disabled:text-gray-500">
              <RefreshCw className={`w-5 h-5 ${processing ? 'animate-spin' : ''}`} /><span>Refresh</span>
            </button>
          </div>
        </div>

        <div className="text-center mb-6">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-full text-sm font-semibold">
            <Trophy className="w-4 h-4" />{match.tournament?.name || 'Tournament'}
          </span>
          {match.category && <p className="text-gray-500 text-sm mt-2">{match.category.name}</p>}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-slate-800/50 border border-white/10 rounded-xl p-3 text-center">
            <Target className="w-4 h-4 text-amber-400 mx-auto mb-1" />
            <p className="text-gray-500 text-xs">Points</p>
            <p className="text-white font-bold">{matchConfig.pointsPerSet}</p>
          </div>
          <div className="bg-slate-800/50 border border-white/10 rounded-xl p-3 text-center">
            <Clock className="w-4 h-4 text-blue-400 mx-auto mb-1" />
            <p className="text-gray-500 text-xs">Sets</p>
            <p className="text-white font-bold">{matchConfig.maxSets === 1 ? '1 Set' : `Best of ${matchConfig.maxSets}`}</p>
          </div>
          <div className="bg-slate-800/50 border border-white/10 rounded-xl p-3 text-center">
            <MapPin className="w-4 h-4 text-purple-400 mx-auto mb-1" />
            <p className="text-gray-500 text-xs">Court</p>
            <p className="text-white font-bold">{match.courtNumber || '-'}</p>
          </div>
        </div>

        {!matchConfig.extension && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-6 text-center">
            <p className="text-amber-300 text-sm"><span className="font-semibold">No Extension:</span> First to {matchConfig.pointsPerSet} points wins</p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
            <div><p className="font-semibold text-red-300">Error</p><p className="text-red-400">{error}</p></div>
          </div>
        )}

        {matchComplete && winner && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 mb-6 text-center">
            <h2 className="text-3xl font-bold text-emerald-300 mb-2">🏆 Match Complete! 🏆</h2>
            <p className="text-xl text-emerald-400 mb-3">{winner === 'player1' ? player1Name : player2Name} wins!</p>
            {score?.timer && (
              <div className="mt-4 pt-4 border-t border-emerald-500/20">
                <p className="text-gray-400 text-sm">Match Duration</p>
                <p className="text-white font-bold text-lg">
                  {score.timer.totalDurationFormatted || formatMatchDuration(score.timer)}
                </p>
                {score.timer.pauseHistory?.length > 0 && (
                  <p className="text-gray-500 text-xs mt-1">
                    ({score.timer.pauseHistory.length} pause{score.timer.pauseHistory.length > 1 ? 's' : ''})
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <MatchInfo match={match} />

        {(match.status === 'ONGOING' || match.status === 'IN_PROGRESS') && (
          <div className="mb-6">
            <MatchTimer 
              matchStatus={match.status} 
              timer={timerData}
              onPause={handlePauseTimer} 
              onResume={handleResumeTimer} 
              isPaused={isPaused}
              disabled={processing}
            />
          </div>
        )}

        {score && (match.status === 'ONGOING' || match.status === 'IN_PROGRESS') && <GamePointIndicator score={score} matchConfig={matchConfig} player1Name={player1Name} player2Name={player2Name} />}

        {isDoubles && score && (match.status === 'ONGOING' || match.status === 'IN_PROGRESS') && (
          <DoublesRotationIndicator isDoubles={isDoubles} currentServer={score.currentServer} player1Team={{ player1: player1Name, player2: 'Partner' }} player2Team={{ player1: player2Name, player2: 'Partner' }} score={score} />
        )}

        {score && <div className="mb-6"><ScoreBoard score={score} player1Name={player1Name} player2Name={player2Name} matchConfig={matchConfig} /></div>}

        <ScoringControls onAddPoint={handleAddPoint} onUndo={handleUndo} onStart={handleStartMatch} matchStatus={match.status} player1Name={player1Name} player2Name={player2Name} disabled={processing || isPaused} />
        
        {isPaused && <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center"><p className="text-amber-300 font-semibold">⏸️ Match is paused. Click "Resume" to continue scoring.</p></div>}

        {(match.status === 'ONGOING' || match.status === 'IN_PROGRESS') && (
          <div className="mt-6">
            <button onClick={() => setShowCorrectionModal(true)} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/30 transition font-semibold">
              <AlertTriangle className="w-5 h-5" />Request Score Correction
            </button>
            <p className="mt-2 text-sm text-gray-500 text-center">Use this if you need to correct a scoring error.</p>
          </div>
        )}

        {score && score.history && score.history.length > 0 && (
          <div className="mt-6 bg-slate-800/50 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Point History</h3>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {score.history.slice().reverse().map((point, index) => (
                <div key={score.history.length - index} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-500">#{score.history.length - index}</span>
                    <span className={`font-semibold ${point.player === 'player1' ? 'text-blue-400' : 'text-purple-400'}`}>{point.player === 'player1' ? player1Name : player2Name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono text-white">{point.score.player1} - {point.score.player2}</p>
                    <p className="text-xs text-gray-500">Set {point.set}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {showCorrectionModal && score && <ScoreCorrectionModal matchId={matchId} currentScore={score} onClose={() => setShowCorrectionModal(false)} onSuccess={() => fetchMatch()} />}
      </div>
    </div>
  );
};

export default ScoringConsolePage;
