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
import LoadingScreen from '../components/LoadingScreen';

const B = {
  bg: '#050810',
  card: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
  green: '#06b6d4',
  cyan: '#00d4ff',
  purple: '#a855f7',
  amber: '#fbbf24',
  red: '#f87171',
};

// ── Config stepper used on pre-start setup ────────────────────────────────────
const ConfigStepper = ({ label, sub, value, min, max, step, onChange }) => (
  <div className="flex items-center justify-between py-2.5">
    <div>
      <p className="text-sm font-bold text-white">{label}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{sub}</p>}
    </div>
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(Math.max(min, value - step))}
        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90"
        style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)' }}
      >
        <Minus className="w-4 h-4" />
      </button>
      <span className="text-lg font-black text-white w-8 text-center">{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + step))}
        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90"
        style={{ background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.25)', color: B.cyan }}
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  </div>
);

const parseScoringFormat = (fmt) => {
  if (!fmt) return { points: 21, sets: 3 };
  const nxm = fmt.match(/(\d+)x(\d+)/);
  if (nxm) return { points: parseInt(nxm[1]), sets: parseInt(nxm[2]) };
  const gm = fmt.match(/(\d+)\s*games?\s*to\s*(\d+)\s*pts?/i);
  if (gm) return { points: parseInt(gm[2]), sets: parseInt(gm[1]) };
  return { points: 21, sets: 3 };
};

const MatchScoringPage = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  useAuth(); // ensures auth context is active

  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timerData, setTimerData] = useState(null);

  const [showSetCompleteModal, setShowSetCompleteModal] = useState(false);
  const [completedSetData, setCompletedSetData] = useState(null);

  // Config state — pre-filled from category.scoringFormat, editable before start
  const [pointsPerSet, setPointsPerSet] = useState(21);
  const [maxSets, setMaxSets] = useState(3);

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

      // Pre-fill config from category scoring format
      if (matchData?.category?.scoringFormat) {
        const cfg = parseScoringFormat(matchData.category.scoringFormat);
        setPointsPerSet(cfg.points);
        setMaxSets(cfg.sets);
      }

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
  }, [matchId]);

  useEffect(() => { fetchMatch(); }, [fetchMatch]);

  const handleStartMatch = async () => {
    try {
      setSaving(true);
      setError(null);
      // Save config first (same as ConductMatchPage), then start the match
      try {
        await api.put(`/matches/${matchId}/config`, {
          pointsPerSet,
          maxSets,
          setsToWin: Math.ceil(maxSets / 2),
          extension: true,
        });
      } catch (_) { /* match may already be configured */ }
      // 45s timeout — Vercel cold start + DB queries can take up to 30s on first hit
      const response = await api.post(`/matches/${matchId}/start`, {}, { timeout: 45000 });
      const matchData = response.data.match;
      setMatch(matchData);
      if (matchData?.score) {
        // Always inject our configured values into matchConfig so addPoint uses
        // the correct pointsPerSet/maxSets even if the backend response omits them
        setScore({
          ...matchData.score,
          matchConfig: {
            pointsPerSet,
            maxSets,
            setsToWin: Math.ceil(maxSets / 2),
            extension: true,
            ...(matchData.score.matchConfig || {}), // backend overrides if present
          },
        });
        setTimerData(matchData.score.timer);
      } else {
        // Backend returned no score object — seed it with our config
        setScore({
          sets: [{ player1: 0, player2: 0 }],
          currentSet: 0,
          matchConfig: {
            pointsPerSet,
            maxSets,
            setsToWin: Math.ceil(maxSets / 2),
            extension: true,
          },
        });
      }
    } catch (err) {
      const status = err?.response?.status;
      const serverMsg = err?.response?.data?.message || err?.response?.data?.error;
      const isTimeout = err?.isTimeout || err?.code === 'ECONNABORTED';
      if (status === 403) return;
      if (isTimeout) {
        setError('Server is warming up — please tap Start Match again in a few seconds.');
      } else if (serverMsg) {
        setError(serverMsg);
      } else {
        setError('Failed to start match. Please try again.');
      }
      console.error('Start match error:', serverMsg || err?.message || err);
    } finally {
      setSaving(false);
    }
  };

  // Only updates local React state — no API call.
  // API is called via saveScoreToApi() on set completion.
  const updateScore = (newScore) => {
    setScore(newScore);
  };

  // Saves score to DB and triggers WebSocket broadcast.
  // Called once per set completion (not per point) — keeps API calls minimal.
  const saveScoreToApi = async (newScore) => {
    try {
      await api.put(`/matches/${matchId}/score`, { score: newScore }, { timeout: 12000 });
    } catch (err) {
      console.warn('Score save failed (non-critical):', err?.message || err);
    }
  };

  const addPoint = (player) => {
    if (isPaused) return;
    if (showSetCompleteModal) return;
    const newScore = { ...score };
    const idx = newScore.currentSet;
    const currentSet = { ...newScore.sets[idx] };

    if (player === 1) currentSet.player1 += 1;
    else currentSet.player2 += 1;
    newScore.sets[idx] = currentSet;

    const cfg = newScore.matchConfig || { pointsPerSet: 21, extension: true, setsToWin: 2, maxSets: 3 };
    const { extension } = cfg;
    const pts = cfg.pointsPerSet;
    const p1 = currentSet.player1, p2 = currentSet.player2;

    let setWon = false, winner = null;
    if (extension) {
      if ((p1 >= pts && p1 - p2 >= 2) || p1 >= 30) { setWon = true; winner = 1; }
      else if ((p2 >= pts && p2 - p1 >= 2) || p2 >= 30) { setWon = true; winner = 2; }
    } else {
      if (p1 >= pts) { setWon = true; winner = 1; }
      else if (p2 >= pts) { setWon = true; winner = 2; }
    }

    if (setWon) {
      currentSet.winner = winner;
      newScore.sets[idx] = currentSet;
      const setsWon = getSetsWonFromScore(newScore);
      const setsToWin = cfg.setsToWin || 2;
      const matchWon = setsWon.p1Sets >= setsToWin || setsWon.p2Sets >= setsToWin;

      updateScore(newScore);
      // Save to API on set completion (not per-point) — reduces API calls from ~50/set to 1/set
      saveScoreToApi(newScore);

      if (matchWon) {
        const matchWinnerId = winner === 1 ? match.player1?.id : match.player2?.id;
        if (!matchWinnerId) {
          setError('Cannot determine winner — player data missing. End match manually.');
          setShowSetCompleteModal(false);
          setShowEndModal(true);
          return;
        }
        const matchWinnerName = winner === 1 ? p1Display : p2Display;
        setCompletedSetData({ setNumber: idx + 1, winner: matchWinnerName, score: `${p1}-${p2}`, newScore, isMatchComplete: true, matchWinnerId, matchWinnerName });
      } else {
        setCompletedSetData({ setNumber: idx + 1, winner: winner === 1 ? p1Display : p2Display, score: `${p1}-${p2}`, newScore, isMatchComplete: false });
      }
      setShowSetCompleteModal(true);
    } else {
      updateScore(newScore);
      // No API call mid-set — score is tracked locally until set completes
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
    // No API call on undo — only set completion triggers save
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
    if (!winnerId) { setError('Cannot end match: winner not identified. Refresh page and try again.'); return; }
    try {
      setSaving(true);
      await api.put(`/matches/${matchId}/end`, { winnerId, finalScore: score });
      const tId = match?.tournament?.id || match?.tournamentId;
      const cId = match?.category?.id || match?.categoryId;
      const drawsUrl = tId
        ? `/tournaments/${tId}/draws/${cId || ''}?refresh=true`
        : '/dashboard';
      window.location.href = drawsUrl;
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to end match'));
    } finally { setSaving(false); }
  };

  const getSetsWonFromScore = (scoreObj) => {
    const cfg = scoreObj.matchConfig || { pointsPerSet: 21, extension: true };
    const { pointsPerSet: pts, extension } = cfg;
    let p1Sets = 0, p2Sets = 0;
    if (!scoreObj.sets?.length) return { p1Sets: 0, p2Sets: 0 };
    scoreObj.sets.forEach(set => {
      if (set.winner === 1) p1Sets++;
      else if (set.winner === 2) p2Sets++;
      else {
        if (extension) {
          if ((set.player1 >= pts && set.player1 - set.player2 >= 2) || set.player1 >= 30) p1Sets++;
          if ((set.player2 >= pts && set.player2 - set.player1 >= 2) || set.player2 >= 30) p2Sets++;
        } else {
          if (set.player1 >= pts) p1Sets++;
          if (set.player2 >= pts) p2Sets++;
        }
      }
    });
    return { p1Sets, p2Sets };
  };

  const getSetsWon = () => { try { return getSetsWonFromScore(score); } catch { return { p1Sets: 0, p2Sets: 0 }; } };

  const handleContinueToNextSet = () => {
    if (!completedSetData) return;
    const newScore = { ...completedSetData.newScore };
    const maxSetsVal = newScore.matchConfig?.maxSets || 3;
    if (newScore.currentSet < maxSetsVal - 1) {
      newScore.sets.push({ player1: 0, player2: 0 });
      newScore.currentSet = newScore.currentSet + 1;
    }
    updateScore(newScore);
    saveScoreToApi(newScore); // Save updated set index to DB
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
    return <LoadingScreen message="Loading..." />;
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

  const { p1Sets, p2Sets } = getSetsWon();
  const currentSet = score.sets?.[score.currentSet] || { player1: 0, player2: 0 };
  const isInProgress = match.status === 'IN_PROGRESS';
  const isCompleted = match.status === 'COMPLETED';
  const canStart = match.status === 'PENDING' || match.status === 'SCHEDULED' || match.status === 'READY';
  const canScore = !isCompleted && !isPaused;

  const p1Display = match.player1
    ? (match.player1.partnerName ? `${match.player1.name} & ${match.player1.partnerName}` : match.player1.name)
    : 'Player 1';
  const p2Display = match.player2
    ? (match.player2.partnerName ? `${match.player2.name} & ${match.player2.partnerName}` : match.player2.name)
    : 'Player 2';

  const setsToWin = Math.ceil(maxSets / 2);

  return (
    <div className="min-h-screen" style={{ background: B.bg }}>

      {/* ── Sticky Header ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 px-4 py-3 flex items-center justify-between"
        style={{ background: 'rgba(7,7,26,0.95)', borderBottom: `1px solid rgba(6,182,212,0.15)`, backdropFilter: 'blur(20px)' }}>
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
                style={{ background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.3)', color: B.green }}>
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
          <div className="mb-4 px-4 py-3 rounded-xl"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: B.red }} />
              <p className="text-xs font-semibold flex-1" style={{ color: B.red }}>{error}</p>
              <button onClick={() => setError(null)}><X className="w-4 h-4" style={{ color: B.red }} /></button>
            </div>
            {(error.includes('warming up') || error.includes('try again') || error.includes('Please try')) && !match?.status?.includes('IN_PROGRESS') && (
              <button
                onClick={() => { setError(null); handleStartMatch(); }}
                disabled={saving}
                className="mt-2 w-full py-2 rounded-lg text-xs font-bold"
                style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', color: B.red }}
              >
                {saving ? 'Retrying…' : '↺ Tap to Retry'}
              </button>
            )}
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

        {/* ── Match Config (shown before start) ───────────────────────────── */}
        {canStart && (
          <div className="rounded-2xl p-4 mb-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-xs font-black mb-2" style={{ color: B.cyan }}>MATCH SETTINGS</p>
            <ConfigStepper
              label="Points per set"
              value={pointsPerSet}
              min={5}
              max={50}
              step={1}
              onChange={setPointsPerSet}
            />
            <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <ConfigStepper
              label="Number of sets"
              sub={`First to win ${setsToWin} set${setsToWin !== 1 ? 's' : ''}`}
              value={maxSets}
              min={1}
              max={9}
              step={2}
              onChange={setMaxSets}
            />
          </div>
        )}

        {/* ── Scoreboard ──────────────────────────────────────────────────── */}
        <div className="rounded-2xl overflow-hidden mb-4" style={{ background: B.card, border: `1px solid ${B.border}` }}>
          {/* Set tabs */}
          {score.sets?.length > 0 && (
            <div className="flex justify-center gap-2 px-4 pt-4">
              {score.sets.map((set, idx) => {
                const isCurrent = idx === score.currentSet;
                return (
                  <div key={idx} className="px-3 py-1.5 rounded-xl text-center min-w-[72px] transition-all"
                    style={isCurrent
                      ? { background: 'rgba(6,182,212,0.1)', border: `1.5px solid rgba(6,182,212,0.5)` }
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
                  ? { background: 'rgba(6,182,212,0.15)', border: '1.5px solid rgba(6,182,212,0.4)', color: B.green }
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
                  style={{ background: 'linear-gradient(135deg,#0891b2,#06b6d4)', color: '#050810', boxShadow: isPaused ? 'none' : '0 4px 16px rgba(6,182,212,0.35)' }}>
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
                  style={{ background: 'linear-gradient(135deg,#00a3cc,#00d4ff)', color: '#050810', boxShadow: isPaused ? 'none' : '0 4px 16px rgba(0,212,255,0.35)' }}>
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
            style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.2)' }}>
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
        <div className="fixed bottom-0 left-0 right-0 p-4" style={{ background: 'rgba(7,7,26,0.97)', borderTop: `1px solid rgba(6,182,212,0.15)` }}>
          <div className="max-w-lg mx-auto">
            <button onClick={handleStartMatch} disabled={saving}
              className="w-full py-4 rounded-2xl font-black text-base transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg,#0891b2,#06b6d4)', color: '#050810', boxShadow: '0 4px 20px rgba(6,182,212,0.4)' }}>
              {saving
                ? <><div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#050810 transparent transparent transparent' }} />Starting…</>
                : <><Play className="w-5 h-5" />START MATCH — {p1Display} vs {p2Display}</>}
            </button>
            <p className="text-center text-xs mt-2" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {pointsPerSet} pts · Best of {maxSets}
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
                    style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.35)' }}>
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
                    style={{ background: 'linear-gradient(135deg,#0891b2,#06b6d4)', color: '#050810', boxShadow: '0 4px 16px rgba(6,182,212,0.35)' }}>
                    <Play className="w-4 h-4" /> Continue to Set {completedSetData.setNumber + 1}
                  </button>
                  <button onClick={handleEndMatchEarly}
                    className="w-full py-3 rounded-xl text-sm font-bold transition-all"
                    style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', color: B.amber }}>
                    End Match Here
                  </button>
                  <p className="text-center text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    {score.matchConfig?.maxSets === 1 ? '1 set' : `Best of ${score.matchConfig?.maxSets || maxSets} sets`}
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
                style={{ background: 'linear-gradient(135deg,#0891b2,#06b6d4)', color: '#050810' }}>
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
        <Clock className="w-4 h-4" style={{ color: isPaused ? '#fbbf24' : '#06b6d4' }} />
        <span className="text-xl font-black font-mono" style={{ color: isPaused ? '#fbbf24' : '#fff' }}>
          {fmt(displayTime)}
        </span>
      </div>
    </div>
  );
};

export default MatchScoringPage;
