import { getErrorMessage } from '../utils/errorMessage';
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import {
  Play, Pause, Trophy, Plus, Minus,
  AlertTriangle, X, Clock, Calendar, ArrowLeft
} from 'lucide-react';
import { pauseTimer, resumeTimer } from '../api/matches';
import SlideToConfirm from '../components/SlideToConfirm';

const B = {
  bg: '#07071a',
  card: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
  green: '#00ff88',
  cyan: '#00d4ff',
  purple: '#a855f7',
  amber: '#fbbf24',
  red: '#f87171',
};

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
  const [showSetCompleteModal, setShowSetCompleteModal] = useState(false);
  const [completedSetData, setCompletedSetData] = useState(null);

  const [score, setScore] = useState({
    sets: [{ player1: 0, player2: 0 }],
    currentSet: 0,
    matchConfig: { pointsPerSet: 21, setsToWin: 2, maxSets: 3, extension: true }
  });

  const fetchMatch = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/matches/${matchId}`);
      const matchData = response.data.match;

      setMatch(matchData);

      if (matchData.score && matchData.score.sets) {
        setScore(matchData.score);
        setTimerData(matchData.score.timer);
        setIsPaused(matchData.score.timer?.isPaused || false);
      } else if (matchData.scoreJson) {
        const parsed = typeof matchData.scoreJson === 'string'
          ? JSON.parse(matchData.scoreJson)
          : matchData.scoreJson;
        if (parsed && parsed.sets) {
          setScore(parsed);
          setTimerData(parsed.timer);
          setIsPaused(parsed.timer?.isPaused || false);
        }
      }
    } catch (err) {
      setError('Failed to load match');
    } finally {
      setLoading(false);
    }
  }, [matchId, navigate]);

  useEffect(() => { fetchMatch(); }, [fetchMatch]);

  const handleStartMatch = async () => {
    try {
      setSaving(true);
      setError(null);
      const response = await api.post(`/matches/${matchId}/start`);
      setMatch(response.data.match);
      if (response.data.match.score) {
        setScore(response.data.match.score);
        setTimerData(response.data.match.score.timer);
      }
    } catch (err) {
      // Suppress auth errors silently — umpire/organizer assignment may not be set
      const msg = getErrorMessage(err, '');
      if (err.response?.status !== 403 && !msg.toLowerCase().includes('authorized')) {
        setError(msg || 'Failed to start match');
      }
      console.error('Start match error:', err.response?.data);
    } finally {
      setSaving(false);
    }
  };

  const updateScore = async (newScore) => {
    setScore(newScore);
    try { await api.put(`/matches/${matchId}/score`, { score: newScore }); }
    catch (err) { console.error('Error updating score:', err); }
  };

  const addPoint = (player) => {
    if (isPaused) return;
    const newScore = { ...score };
    const idx = newScore.currentSet;
    const currentSet = { ...newScore.sets[idx] };

    if (player === 1) currentSet.player1 += 1;
    else currentSet.player2 += 1;
    newScore.sets[idx] = currentSet;

    const cfg = newScore.matchConfig || { pointsPerSet: 21, extension: true, setsToWin: 2, maxSets: 3 };
    const { pointsPerSet, extension } = cfg;
    const p1 = currentSet.player1, p2 = currentSet.player2;

    let setWon = false, winner = null;
    if (extension) {
      if ((p1 >= pointsPerSet && p1 - p2 >= 2) || p1 >= 30) { setWon = true; winner = 1; }
      else if ((p2 >= pointsPerSet && p2 - p1 >= 2) || p2 >= 30) { setWon = true; winner = 2; }
    } else {
      if (p1 >= pointsPerSet) { setWon = true; winner = 1; }
      else if (p2 >= pointsPerSet) { setWon = true; winner = 2; }
    }

    if (setWon) {
      currentSet.winner = winner;
      newScore.sets[idx] = currentSet;
      const setsWon = getSetsWonFromScore(newScore);
      const setsToWin = cfg.setsToWin || 2;
      const maxSets = cfg.maxSets || 3;
      const matchWon = setsWon.p1Sets >= setsToWin || setsWon.p2Sets >= setsToWin;

      updateScore(newScore);

      if (matchWon || idx >= maxSets - 1) {
        const matchWinnerId = winner === 1 ? match.player1?.id : match.player2?.id;
        const matchWinnerName = winner === 1 ? p1Display : p2Display;
        setCompletedSetData({ setNumber: idx + 1, winner: matchWinnerName, score: `${p1}-${p2}`, newScore, isMatchComplete: true, matchWinnerId, matchWinnerName });
      } else {
        setCompletedSetData({ setNumber: idx + 1, winner: winner === 1 ? p1Display : p2Display, score: `${p1}-${p2}`, newScore, isMatchComplete: false });
      }
      setShowSetCompleteModal(true);
    } else {
      updateScore(newScore);
    }
  };

  const removePoint = (player) => {
    if (isPaused) return;
    const newScore = { ...score };
    const idx = newScore.currentSet;
    const currentSet = { ...newScore.sets[idx] };
    if (player === 1 && currentSet.player1 > 0) currentSet.player1 -= 1;
    else if (player === 2 && currentSet.player2 > 0) currentSet.player2 -= 1;
    newScore.sets[idx] = currentSet;
    updateScore(newScore);
  };

  const handlePauseTimer = async () => {
    try { setSaving(true); const d = await pauseTimer(matchId); setTimerData(d.timer); setIsPaused(true); }
    catch (err) { setError(getErrorMessage(err, 'Failed to pause')); }
    finally { setSaving(false); }
  };

  const handleResumeTimer = async () => {
    try { setSaving(true); const d = await resumeTimer(matchId); setTimerData(d.timer); setIsPaused(false); }
    catch (err) { setError(getErrorMessage(err, 'Failed to resume')); }
    finally { setSaving(false); }
  };

  const handleBack = () => {
    const tId = match?.tournament?.id || match?.tournamentId;
    const cId = match?.category?.id || match?.categoryId;
    if (tId && cId) navigate(`/tournaments/${tId}/draws/${cId}`);
    else if (tId) navigate(`/tournaments/${tId}/draws`);
    else navigate('/dashboard');
  };

  const handleEndMatch = async (winnerId) => {
    try {
      setSaving(true);
      const response = await api.put(`/matches/${matchId}/end`, { winnerId, finalScore: score });
      const tId = match?.tournament?.id || match?.tournamentId;
      const cId = match?.category?.id || match?.categoryId;
      // Navigate back to draws page with the correct category pre-selected and
      // ?refresh=true so DrawPage re-fetches the bracket and shows the update.
      const drawsUrl = tId
        ? `/tournaments/${tId}/draws/${cId || ''}?refresh=true`
        : '/dashboard';
      navigate(drawsUrl, { state: { matchComplete: true, winner: response.data.summary?.winner, categoryId: cId } });
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to end match'));
    } finally { setSaving(false); }
  };

  const getSetsWonFromScore = (scoreObj) => {
    const cfg = scoreObj.matchConfig || { pointsPerSet: 21, extension: true };
    const { pointsPerSet, extension } = cfg;
    let p1Sets = 0, p2Sets = 0;
    if (!scoreObj.sets?.length) return { p1Sets: 0, p2Sets: 0 };
    scoreObj.sets.forEach(set => {
      if (set.winner === 1) p1Sets++;
      else if (set.winner === 2) p2Sets++;
      else {
        if (extension) {
          if ((set.player1 >= pointsPerSet && set.player1 - set.player2 >= 2) || set.player1 >= 30) p1Sets++;
          if ((set.player2 >= pointsPerSet && set.player2 - set.player1 >= 2) || set.player2 >= 30) p2Sets++;
        } else {
          if (set.player1 >= pointsPerSet) p1Sets++;
          if (set.player2 >= pointsPerSet) p2Sets++;
        }
      }
    });
    return { p1Sets, p2Sets };
  };

  const getSetsWon = () => { try { return getSetsWonFromScore(score); } catch { return { p1Sets: 0, p2Sets: 0 }; } };

  const handleContinueToNextSet = () => {
    if (!completedSetData) return;
    const newScore = { ...completedSetData.newScore };
    const maxSets = newScore.matchConfig?.maxSets || 3;
    if (newScore.currentSet < maxSets - 1) {
      newScore.sets.push({ player1: 0, player2: 0 });
      newScore.currentSet = newScore.currentSet + 1;
    }
    updateScore(newScore);
    setShowSetCompleteModal(false);
    setCompletedSetData(null);
  };

  const handleConfirmMatchWinner = async () => {
    if (!completedSetData?.isMatchComplete) return;
    try {
      await handleEndMatch(completedSetData.matchWinnerId);
      setShowSetCompleteModal(false);
      setCompletedSetData(null);
    } catch { setError('Failed to confirm match winner'); }
  };

  const handleEndMatchEarly = () => {
    if (!completedSetData) return;
    updateScore(completedSetData.newScore);
    setShowSetCompleteModal(false);
    setCompletedSetData(null);
    setShowEndModal(true);
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: B.bg }}>
        <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: `${B.green} transparent transparent transparent` }} />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: B.bg }}>
        <div className="text-center">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3" style={{ color: B.red }} />
          <h2 className="text-lg font-bold text-white">Match not found</h2>
        </div>
      </div>
    );
  }

  // Match not yet started and no config saved — redirect back to conduct setup
  if ((match.status === 'PENDING' || match.status === 'READY' || match.status === 'SCHEDULED') &&
      !match.score && !match.scoreJson) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: B.bg }}>
        <div className="text-center">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3" style={{ color: B.amber }} />
          <h2 className="text-lg font-bold text-white mb-2">Match Not Started</h2>
          <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.5)' }}>Configure and start this match first.</p>
          <button
            onClick={() => navigate(`/match/${matchId}/conduct`, { replace: true })}
            className="px-6 py-3 rounded-xl font-black text-sm"
            style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}>
            ← Back to Setup
          </button>
        </div>
      </div>
    );
  }

  const { p1Sets, p2Sets } = getSetsWon();
  const currentSet = score.sets?.[score.currentSet] || { player1: 0, player2: 0 };
  const isInProgress = match.status === 'IN_PROGRESS';
  const isCompleted = match.status === 'COMPLETED';
  const canStart = match.status === 'PENDING' || match.status === 'SCHEDULED' || match.status === 'READY';
  const canScore = !isCompleted && !isPaused;

  // Helper: show "Name & PartnerName" for doubles, just "Name" for singles
  const p1Display = match.player1
    ? (match.player1.partnerName ? `${match.player1.name} & ${match.player1.partnerName}` : match.player1.name)
    : 'Player 1';
  const p2Display = match.player2
    ? (match.player2.partnerName ? `${match.player2.name} & ${match.player2.partnerName}` : match.player2.name)
    : 'Player 2';

  return (
    <div className="min-h-screen" style={{ background: B.bg }}>

      {/* ── Sticky Header ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 px-4 py-3 flex items-center justify-between"
        style={{ background: 'rgba(7,7,26,0.95)', borderBottom: `1px solid rgba(0,255,136,0.15)`, backdropFilter: 'blur(20px)' }}>
        <button onClick={handleBack} className="flex items-center gap-1.5 text-sm font-bold"
          style={{ color: 'rgba(255,255,255,0.55)' }}>
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {isInProgress && (
          <div className="flex items-center gap-2">
            {!isPaused ? (
              <button onClick={handlePauseTimer} disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', color: B.amber }}>
                <Pause className="w-3.5 h-3.5" /> Pause
              </button>
            ) : (
              <button onClick={handleResumeTimer} disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                style={{ background: 'rgba(0,255,136,0.12)', border: '1px solid rgba(0,255,136,0.3)', color: B.green }}>
                <Play className="w-3.5 h-3.5" /> Resume
              </button>
            )}
            <button onClick={() => setShowEndModal(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold"
              style={{ background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)', color: B.red }}>
              End Match
            </button>
          </div>
        )}
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="max-w-lg mx-auto px-4 pt-5 pb-28">

        {/* Match info */}
        <div className="text-center mb-4">
          <p className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.55)' }}>
            {match.tournament?.name} • {match.category?.name}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Match #{match.matchNumber}</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 flex items-start gap-2.5 px-4 py-3 rounded-xl"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: B.red }} />
            <p className="text-xs font-semibold flex-1" style={{ color: B.red }}>{error}</p>
            <button onClick={() => setError(null)}><X className="w-4 h-4" style={{ color: B.red }} /></button>
          </div>
        )}

        {/* Timer */}
        {isInProgress && <MatchTimerDisplay timer={timerData} isPaused={isPaused} />}

        {/* Paused banner */}
        {isPaused && (
          <div className="mb-4 py-3 flex items-center justify-center gap-2 rounded-xl"
            style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)' }}>
            <Pause className="w-4 h-4" style={{ color: B.amber }} />
            <p className="text-sm font-bold" style={{ color: B.amber }}>Match Paused — Scoring Disabled</p>
          </div>
        )}

        {/* ── Scoreboard ──────────────────────────────────────────────────── */}
        <div className="rounded-2xl overflow-hidden mb-4" style={{ background: B.card, border: `1px solid ${B.border}` }}>
          {/* Set tabs */}
          {score.sets?.length > 0 && (
            <div className="flex justify-center gap-2 px-4 pt-4">
              {score.sets.map((set, idx) => {
                const isCurrent = idx === score.currentSet;
                const isDone = set.winner != null;
                return (
                  <div key={idx} className="px-3 py-1.5 rounded-xl text-center min-w-[72px] transition-all"
                    style={isCurrent
                      ? { background: 'rgba(0,255,136,0.1)', border: `1.5px solid rgba(0,255,136,0.5)` }
                      : { background: 'rgba(255,255,255,0.04)', border: `1px solid ${B.border}` }}>
                    <div className="text-xs font-bold mb-0.5"
                      style={{ color: isCurrent ? B.green : 'rgba(255,255,255,0.4)' }}>Set {idx + 1}</div>
                    <div className="text-sm font-black"
                      style={{ color: isCurrent ? '#fff' : 'rgba(255,255,255,0.55)' }}>
                      {set.player1} - {set.player2}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Main score */}
          <div className="grid grid-cols-3 gap-2 items-center px-4 py-5">
            {/* P1 sets won */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-3xl font-black mb-2"
                style={p1Sets > p2Sets
                  ? { background: 'rgba(0,255,136,0.15)', border: '1.5px solid rgba(0,255,136,0.4)', color: B.green }
                  : { background: 'rgba(255,255,255,0.05)', border: `1px solid ${B.border}`, color: 'rgba(255,255,255,0.7)' }}>
                {p1Sets}
              </div>
              <p className="text-xs font-black text-white leading-tight" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p1Display}</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>Sets Won</p>
            </div>

            {/* Live score */}
            <div className="text-center">
              <div className="text-5xl font-black text-white">
                {currentSet.player1}<span className="text-2xl font-bold mx-1" style={{ color: 'rgba(255,255,255,0.3)' }}>-</span>{currentSet.player2}
              </div>
              <p className="text-xs font-black mt-1" style={{ color: B.cyan }}>Set {score.currentSet + 1}</p>
            </div>

            {/* P2 sets won */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-3xl font-black mb-2"
                style={p2Sets > p1Sets
                  ? { background: 'rgba(0,212,255,0.15)', border: '1.5px solid rgba(0,212,255,0.4)', color: B.cyan }
                  : { background: 'rgba(255,255,255,0.05)', border: `1px solid ${B.border}`, color: 'rgba(255,255,255,0.7)' }}>
                {p2Sets}
              </div>
              <p className="text-xs font-black text-white leading-tight" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p2Display}</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>Sets Won</p>
            </div>
          </div>
        </div>

        {/* ── Scoring Controls ─────────────────────────────────────────────── */}
        {!isCompleted && (
          <div className="grid grid-cols-2 gap-3">
            {/* Player 1 */}
            <div className="rounded-2xl overflow-hidden" style={{ background: B.card, border: `1px solid ${B.border}`, opacity: isPaused ? 0.45 : 1 }}>
              <div className="px-3 pt-3 pb-2 text-center border-b" style={{ borderColor: B.border }}>
                <p className="text-xs font-black text-white truncate">{p1Display}</p>
              </div>
              <div className="p-3 space-y-2">
                <button onClick={() => addPoint(1)} disabled={isPaused || !canScore}
                  className="w-full py-5 rounded-xl font-black text-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg,#00c853,#00ff88)', color: '#07071a', boxShadow: isPaused ? 'none' : '0 4px 16px rgba(0,200,83,0.35)' }}>
                  <Plus className="w-6 h-6" /> Point
                </button>
                <button onClick={() => removePoint(1)} disabled={isPaused || !canScore}
                  className="w-full py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                  style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${B.border}`, color: 'rgba(255,255,255,0.55)' }}>
                  <Minus className="w-4 h-4" /> Undo
                </button>
              </div>
            </div>

            {/* Player 2 */}
            <div className="rounded-2xl overflow-hidden" style={{ background: B.card, border: `1px solid ${B.border}`, opacity: isPaused ? 0.45 : 1 }}>
              <div className="px-3 pt-3 pb-2 text-center border-b" style={{ borderColor: B.border }}>
                <p className="text-xs font-black text-white truncate">{p2Display}</p>
              </div>
              <div className="p-3 space-y-2">
                <button onClick={() => addPoint(2)} disabled={isPaused || !canScore}
                  className="w-full py-5 rounded-xl font-black text-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg,#00a3cc,#00d4ff)', color: '#07071a', boxShadow: isPaused ? 'none' : '0 4px 16px rgba(0,212,255,0.35)' }}>
                  <Plus className="w-6 h-6" /> Point
                </button>
                <button onClick={() => removePoint(2)} disabled={isPaused || !canScore}
                  className="w-full py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                  style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${B.border}`, color: 'rgba(255,255,255,0.55)' }}>
                  <Minus className="w-4 h-4" /> Undo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Match completed */}
        {isCompleted && (
          <div className="rounded-2xl p-6 text-center"
            style={{ background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.2)' }}>
            <Trophy className="w-10 h-10 mx-auto mb-3" style={{ color: B.amber }} />
            <h3 className="text-lg font-black text-white mb-1">Match Completed</h3>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Winner: <span className="font-bold text-white">{match.winnerId === match.player1?.id ? p1Display : p2Display}</span>
            </p>
            {score.timer?.totalDurationFormatted && (
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>Duration: {score.timer.totalDurationFormatted}</p>
            )}
          </div>
        )}
      </div>

      {/* ── START MATCH sticky bottom ─────────────────────────────────────── */}
      {canStart && (
        <div className="fixed bottom-0 left-0 right-0 p-4" style={{ background: 'rgba(7,7,26,0.97)', borderTop: `1px solid rgba(0,255,136,0.15)` }}>
          <div className="max-w-lg mx-auto">
            <button onClick={handleStartMatch} disabled={saving}
              className="w-full py-4 rounded-2xl font-black text-base transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg,#00c853,#00ff88)', color: '#07071a', boxShadow: '0 4px 20px rgba(0,200,83,0.4)' }}>
              {saving
                ? <><div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#07071a transparent transparent transparent' }} />Starting…</>
                : <><Play className="w-5 h-5" />START MATCH</>}
            </button>
            <p className="text-center text-xs mt-2" style={{ color: 'rgba(255,255,255,0.55)' }}>
              You can score now • Start Match to begin timer
            </p>
          </div>
        </div>
      )}

      {/* ── Set Complete Modal ───────────────────────────────────────────── */}
      {showSetCompleteModal && completedSetData && (
        <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50 p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ background: '#0d1025', border: `1px solid ${B.border}` }}>
            {completedSetData.isMatchComplete ? (
              <>
                <div className="px-5 pt-6 pb-4 text-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
                    style={{ background: 'linear-gradient(135deg,rgba(251,191,36,0.3),rgba(245,158,11,0.2))', border: '1px solid rgba(251,191,36,0.4)' }}>
                    <Trophy className="w-8 h-8" style={{ color: B.amber }} />
                  </div>
                  <h2 className="text-xl font-black text-white mb-1">🎉 Match Complete!</h2>
                  <p className="text-sm mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>Winner</p>
                  <p className="text-2xl font-black mb-1" style={{ color: B.amber }}>{completedSetData.matchWinnerName}</p>
                  <p className="text-base font-bold text-white">Set {completedSetData.setNumber}: {completedSetData.score}</p>
                </div>
                <div className="px-5 pb-5">
                  <SlideToConfirm
                    label={`Slide to confirm ${completedSetData.matchWinnerName} as Winner →`}
                    onConfirm={handleConfirmMatchWinner}
                    color="#f59e0b"
                    disabled={saving}
                  />
                  <p className="text-center text-xs mt-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    Slide right to confirm
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="px-5 pt-6 pb-4 text-center">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
                    style={{ background: 'rgba(0,255,136,0.15)', border: '1px solid rgba(0,255,136,0.35)' }}>
                    <Trophy className="w-7 h-7" style={{ color: B.green }} />
                  </div>
                  <h2 className="text-lg font-black text-white mb-1">Set {completedSetData.setNumber} Complete!</h2>
                  <p className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    <span className="font-bold" style={{ color: B.green }}>{completedSetData.winner}</span> wins the set
                  </p>
                  <p className="text-xl font-black text-white">{completedSetData.score}</p>
                </div>
                <div className="px-5 pb-5 space-y-2">
                  <button onClick={handleContinueToNextSet}
                    className="w-full py-3.5 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg,#00c853,#00ff88)', color: '#07071a', boxShadow: '0 4px 16px rgba(0,200,83,0.35)' }}>
                    <Play className="w-4 h-4" /> Continue to Set {completedSetData.setNumber + 1}
                  </button>
                  <button onClick={handleEndMatchEarly}
                    className="w-full py-3 rounded-xl text-sm font-bold transition-all"
                    style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', color: B.amber }}>
                    End Match Here
                  </button>
                  <p className="text-center text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    {score.matchConfig?.maxSets === 1 ? '1 set' : `Best of ${score.matchConfig?.maxSets || 3} sets`}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── End Match Modal ──────────────────────────────────────────────── */}
      {showEndModal && (
        <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50 p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ background: '#0d1025', border: `1px solid ${B.border}` }}>
            <div className="px-5 pt-5 pb-4 text-center" style={{ borderBottom: `1px solid ${B.border}` }}>
              <h2 className="text-base font-black text-white">End Match</h2>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>Select the winner</p>
            </div>
            <div className="p-5 space-y-2.5">
              <button onClick={() => handleEndMatch(match.player1?.id)} disabled={saving}
                className="w-full py-3.5 rounded-xl font-black text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg,#00c853,#00ff88)', color: '#07071a' }}>
                <Trophy className="w-4 h-4" /> {p1Display} Wins
              </button>
              <button onClick={() => handleEndMatch(match.player2?.id)} disabled={saving}
                className="w-full py-3.5 rounded-xl font-black text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff' }}>
                <Trophy className="w-4 h-4" /> {p2Display} Wins
              </button>
              <button onClick={() => setShowEndModal(false)}
                className="w-full py-3 rounded-xl text-sm font-bold transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${B.border}`, color: 'rgba(255,255,255,0.6)' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Timer Display ─────────────────────────────────────────────────────────────
const MatchTimerDisplay = ({ timer, isPaused }) => {
  const [displayTime, setDisplayTime] = useState(0);

  useEffect(() => {
    if (!timer?.startedAt) { setDisplayTime(0); return; }
    const calculate = () => {
      const start = new Date(timer.startedAt).getTime();
      const total = timer.totalPausedTime || 0;
      let elapsed = Date.now() - start - total;
      if (isPaused && timer.pausedAt) elapsed -= (Date.now() - new Date(timer.pausedAt).getTime());
      return Math.max(0, Math.floor(elapsed / 1000));
    };
    setDisplayTime(calculate());
    if (isPaused) return;
    const iv = setInterval(() => setDisplayTime(calculate()), 1000);
    return () => clearInterval(iv);
  }, [timer, isPaused]);

  const fmt = (s) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}` : `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };
  const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '--:--';

  return (
    <div className="mb-4 rounded-xl px-4 py-3 flex items-center justify-between"
      style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.08)` }}>
      <div className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
        <Calendar className="w-3.5 h-3.5" />
        <span>Started {fmtTime(timer?.startedAt)}</span>
      </div>
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4" style={{ color: isPaused ? '#fbbf24' : '#00ff88' }} />
        <span className="text-xl font-black font-mono" style={{ color: isPaused ? '#fbbf24' : '#fff' }}>
          {fmt(displayTime)}
        </span>
      </div>
    </div>
  );
};

export default MatchScoringPage;
