import { getErrorMessage } from '../utils/errorMessage';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import {
  Play, Pause, Trophy, Plus, Minus,
  AlertTriangle, X, Clock, Calendar, ArrowLeft, ArrowLeftRight, User
} from 'lucide-react';
import { pauseTimer, resumeTimer } from '../api/matches';
import SlideToConfirm from '../components/SlideToConfirm';
import LoadingScreen from '../components/LoadingScreen';
import { defaultTennisConfig, newTennisState, deriveTennisState, pointLabel, tennisSetSummary } from '../utils/tennisScoring';
import { getScoringModel, getPointEngine } from '../sports/registry';
import { isTeamSport } from '../config/sports';

const B = {
  bg: '#040810',
  card: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
  green: '#F59E0B',
  cyan: '#FCD34D',
  purple: '#8B5CF6',
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
        style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', color: B.cyan }}
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  </div>
);

// On/off row for boolean settings (No-Ad, match tiebreak…)
const ToggleRow = ({ label, sub, value, onChange }) => (
  <div className="flex items-center justify-between py-2.5">
    <div>
      <p className="text-sm font-bold text-white">{label}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{sub}</p>}
    </div>
    <button
      onClick={() => onChange(!value)}
      className="relative rounded-full transition-all flex-shrink-0"
      style={{ width: 46, height: 26, background: value ? 'rgba(245,158,11,0.9)' : 'rgba(255,255,255,0.12)' }}
    >
      <span className="absolute rounded-full bg-white transition-all"
        style={{ width: 20, height: 20, top: 3, left: value ? 23 : 3 }} />
    </button>
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
  const [swapped, setSwapped] = useState(false); // visual side-swap (left↔right); persisted in score JSON

  const [showSetCompleteModal, setShowSetCompleteModal] = useState(false);
  const [completedSetData, setCompletedSetData] = useState(null);

  // Config state — pre-filled from category.scoringFormat, editable before start
  const [pointsPerSet, setPointsPerSet] = useState(21);
  const [maxSets, setMaxSets] = useState(3);

  // Tennis-specific config (organizer/umpire configurable before start)
  const [tGamesPerSet, setTGamesPerSet] = useState(6);
  const [tTiebreakTo, setTTiebreakTo] = useState(7);
  const [tNoAd, setTNoAd] = useState(false);
  const [tMatchTiebreak, setTMatchTiebreak] = useState(false);
  const sportName = match?.tournament?.sport || '';
  // The registry (exact id lookup) picks the isolated scoring engine for this
  // sport — no sport-specific logic lives here. 'tennis' → own tennis engine;
  // 'points' → the sport's own rally engine (badminton/pickleball/TT/squash),
  // each of which OWNS its rules, so no sport can affect another.
  const scoreModel = getScoringModel(sportName);
  const isTennis = scoreModel.model === 'tennis';
  const pointEngine = getPointEngine(sportName);      // the sport's own engine (badminton fallback for tennis, unused there)
  const pointUnit = pointEngine.unit;                 // "Set" (badminton) or "Game" (pickleball/TT/squash)
  const pointCap = pointEngine.defaults.cap;          // per-sport deuce cap (badminton 30; others none)
  const buildTennisConfig = () => defaultTennisConfig({
    sets: maxSets,
    gamesPerSet: tGamesPerSet,
    tiebreakTo: tTiebreakTo,
    noAd: tNoAd,
    matchTiebreak: tMatchTiebreak,
  });

  const [score, setScore] = useState({
    sets: [{ player1: 0, player2: 0 }],
    currentSet: 0,
    matchConfig: { pointsPerSet: 21, setsToWin: 2, maxSets: 3, extension: true }
  });

  // Debounce ref — auto-save mid-set score 2s after last point (crash protection)
  const autoSaveTimerRef = useRef(null);

  const fetchMatch = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/matches/${matchId}`);
      const matchData = response.data.match;
      setMatch(matchData);

      // Pre-fill config from category scoring format
      if (matchData?.category?.scoringFormat) {
        const fmt = matchData.category.scoringFormat;
        const cfg = parseScoringFormat(fmt);
        const sp = matchData?.tournament?.sport || '';
        const model = getScoringModel(sp);
        const eng = getPointEngine(sp).defaults;
        // "21x3" is the generic badminton default a category inherits when the
        // organizer didn't set a sport-specific format — fall back to the sport's
        // own standard in that case; an explicit format is always respected.
        const inherited = fmt === '21x3';
        setMaxSets(inherited ? eng.bestOf : cfg.sets);
        if (model.model === 'tennis') {
          // The "points" slot is games-per-set; 21 games is nonsensical → clamp to 6.
          const g = cfg.points;
          setTGamesPerSet(g >= 1 && g <= 9 ? g : 6);
        } else {
          setPointsPerSet(inherited ? eng.pointsToWin : cfg.points);
        }
      }

      if (matchData.score && matchData.score.sets) {
        setScore(matchData.score);
        setTimerData(matchData.score.timer);
        setIsPaused(matchData.score.timer?.isPaused || false);
        setSwapped(!!matchData.score.swapped);
      } else if (matchData.scoreJson) {
        const parsed = typeof matchData.scoreJson === 'string'
          ? JSON.parse(matchData.scoreJson)
          : matchData.scoreJson;
        if (parsed && parsed.sets) {
          setScore(parsed);
          setTimerData(parsed.timer);
          setIsPaused(parsed.timer?.isPaused || false);
          setSwapped(!!parsed.swapped);
        }
      }
    } catch (err) {
      setError('Failed to load match');
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => { fetchMatch(); }, [fetchMatch]);
  // Clear pending auto-save timer on unmount (prevents state update on dead component)
  useEffect(() => () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); }, []);

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

      // Tennis: seed a tennis-shaped score (point log + derived state), ignoring
      // any default badminton score the backend created.
      if (isTennis) {
        const tcfg = buildTennisConfig();
        const seeded = newTennisState(tcfg);
        setScore({
          sport: 'Tennis', matchConfig: tcfg, points: [],
          sets: seeded.sets, currentSet: seeded.currentSet, game: seeded.game,
          inTiebreak: seeded.inTiebreak, status: seeded.status, matchWinner: seeded.matchWinner,
          timer: matchData?.score?.timer, swapped: false,
        });
        setTimerData(matchData?.score?.timer);
        return;
      }

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

  // ── Tennis: point log is the source of truth; state is derived by replay ──
  const addTennisPoint = (player) => {
    const points = [...(score.points || []), player];
    const cfg = score.matchConfig || buildTennisConfig();
    const d = deriveTennisState(cfg, points);
    const newScore = {
      ...score, sport: 'Tennis', matchConfig: cfg, points,
      sets: d.sets, currentSet: d.currentSet, game: d.game,
      inTiebreak: d.inTiebreak, status: d.status, matchWinner: d.matchWinner,
    };
    updateScore(newScore);
    if (autoSaveTimerRef.current) { clearTimeout(autoSaveTimerRef.current); autoSaveTimerRef.current = null; }
    if (d.status === 'completed') {
      saveScoreToApi(newScore);
      const matchWinnerId = d.matchWinner === 1 ? match.player1?.id : match.player2?.id;
      if (!matchWinnerId) { setError('Cannot determine winner — player data missing. End match manually.'); setShowEndModal(true); return; }
      setCompletedSetData({
        isMatchComplete: true, matchWinnerId,
        matchWinnerName: d.matchWinner === 1 ? p1Display : p2Display,
        score: tennisSetSummary(d),
      });
      setShowSetCompleteModal(true);
    } else {
      autoSaveTimerRef.current = setTimeout(() => saveScoreToApi(newScore), 1500);
    }
  };

  // Tennis Undo — removes the LAST point played (whoever won it) and re-derives.
  const removeTennisPoint = () => {
    if (!score.points || score.points.length === 0) return;
    const points = score.points.slice(0, -1);
    const cfg = score.matchConfig || buildTennisConfig();
    const d = deriveTennisState(cfg, points);
    const newScore = {
      ...score, points, sets: d.sets, currentSet: d.currentSet, game: d.game,
      inTiebreak: d.inTiebreak, status: d.status, matchWinner: d.matchWinner,
    };
    updateScore(newScore);
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => saveScoreToApi(newScore), 1500);
  };

  const addPoint = (player) => {
    if (isPaused) return;
    if (showSetCompleteModal) return;
    if (isTennis) { addTennisPoint(player); return; }
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

    // Delegate the win rule to THIS sport's own engine (win-by-2 + the sport's
    // own cap). The engine is the single owner of the sport's rules — this
    // screen holds none. (extension:false = a rare first-to-N mode, kept here.)
    let setWon = false, winner = null;
    const w = extension
      ? pointEngine.setWinner(p1, p2, { pointsPerSet: pts, cap: pointCap })
      : (p1 >= pts ? 1 : p2 >= pts ? 2 : 0);
    if (w) { setWon = true; winner = w; }

    if (setWon) {
      currentSet.winner = winner;
      newScore.sets[idx] = currentSet;
      const setsWon = getSetsWonFromScore(newScore);
      const setsToWin = cfg.setsToWin || 2;
      const matchWon = setsWon.p1Sets >= setsToWin || setsWon.p2Sets >= setsToWin;

      updateScore(newScore);
      // Cancel any pending debounce — set-completion save below is the authoritative write.
      // Without this, a stale debounce fires 2s later and overwrites the correct score.
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
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
      // Debounced auto-save: write to DB 2s after last point (crash/refresh protection).
      // Set completion triggers an immediate save above — this covers the in-between points.
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => saveScoreToApi(newScore), 2000);
    }
  };

  const removePoint = (player) => {
    if (isPaused) return;
    if (isTennis) { removeTennisPoint(); return; }
    const newScore = { ...score };
    const idx = newScore.currentSet;
    const currentSet = { ...newScore.sets[idx] };
    if (player === 1 && currentSet.player1 > 0) currentSet.player1 -= 1;
    else if (player === 2 && currentSet.player2 > 0) currentSet.player2 -= 1;
    newScore.sets[idx] = currentSet;
    updateScore(newScore);
    // No API call on undo — only set completion triggers save
  };

  // Swap which player is shown on the left vs right. Purely visual — the
  // underlying player1/player2 identities (and all scores/stats mapped to them)
  // never change, so points still land on the correct player after swapping.
  // Persisted into the score JSON so the sides survive a page refresh.
  const toggleSwap = () => {
    const next = !swapped;
    setSwapped(next);
    const ns = { ...score, swapped: next };
    updateScore(ns);
    saveScoreToApi(ns);
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
    if (!scoreObj.sets?.length) return { p1Sets: 0, p2Sets: 0 };
    const cfg = scoreObj.matchConfig || { pointsPerSet: 21 };
    // The sport's own engine counts completed sets/games won (win-by-2 + cap).
    const { p1, p2 } = pointEngine.setsWon(scoreObj.sets, { pointsPerSet: cfg.pointsPerSet, cap: pointCap });
    return { p1Sets: p1, p2Sets: p2 };
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

  // Team sports (Basketball) have their OWN scoring console (running total,
  // quarters/OT, fouls, per-player points) that is not built yet. Until then we
  // must NOT fall through to the rally scoreboard — that would score a
  // basketball game with badminton's 21-point set logic. Show a clear
  // placeholder instead so the match/draw/registration flow stays usable.
  if (isTeamSport(sportName)) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: B.bg }}>
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🏀</div>
          <h2 className="text-lg font-black text-white mb-2">Basketball scoring is coming soon</h2>
          <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.55)' }}>
            {sportName} matches use a dedicated FIBA scoring console (running score,
            quarters & overtime, fouls and per-player points). It isn't live yet —
            everything else for this tournament works normally.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm"
            style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>
      </div>
    );
  }

  // Sets won. Tennis counts set winners directly; other sports use the points engine.
  const tennisSetsWon = () => {
    let a = 0, b = 0;
    (score.sets || []).forEach(s => { if (s.winner === 1) a++; else if (s.winner === 2) b++; });
    return { p1Sets: a, p2Sets: b };
  };
  const { p1Sets, p2Sets } = isTennis ? tennisSetsWon() : getSetsWon();
  const currentSet = score.sets?.[score.currentSet] || { player1: 0, player2: 0 };
  const tGame = score.game || { p1: 0, p2: 0 };
  const tInTiebreak = !!score.inTiebreak;
  const isInProgress = match.status === 'IN_PROGRESS';
  const isCompleted = match.status === 'COMPLETED';
  const canStart = match.status === 'PENDING' || match.status === 'SCHEDULED' || match.status === 'READY';
  const canScore = !isCompleted && !isPaused;

  // Split a player/pair into two display lines so doubles partners always show
  // fully instead of being truncated. Handles both data shapes: separate
  // name + partnerName, and a single combined "Name1 / Name2" string.
  const pairLines = (player, fallback) => {
    if (!player) return [fallback, null];
    let l1 = (player.name || fallback || '').trim();
    let l2 = player.partnerName ? String(player.partnerName).trim() : null;
    if (!l2 && l1.includes('/')) {
      const parts = l1.split('/').map(s => s.trim()).filter(Boolean);
      l1 = parts[0] || l1;
      l2 = parts[1] || null;
    }
    return [l1, l2];
  };
  const [p1l1, p1l2] = pairLines(match.player1, 'Player 1');
  const [p2l1, p2l2] = pairLines(match.player2, 'Player 2');
  // Full single-string names for the winner modal / end-match / start button.
  const p1Display = p1l2 ? `${p1l1} / ${p1l2}` : p1l1;
  const p2Display = p2l2 ? `${p2l1} / ${p2l2}` : p2l1;

  const setsToWin = Math.ceil(maxSets / 2);

  // Map physical left/right sides to underlying players. When `swapped`, the
  // left column renders player 2 and the right renders player 1 — including
  // their avatar, name, live score and sets-won. Each side's Point/Undo stays
  // wired to `.num`, so scoring always hits the correct real player.
  const pdata = {
    1: { num: 1, l1: p1l1, l2: p1l2, obj: match.player1, sets: p1Sets, score: currentSet.player1, gpt: tGame.p1 },
    2: { num: 2, l1: p2l1, l2: p2l2, obj: match.player2, sets: p2Sets, score: currentSet.player2, gpt: tGame.p2 },
  };
  const left = swapped ? pdata[2] : pdata[1];
  const right = swapped ? pdata[1] : pdata[2];

  const sideAvatar = (p) => (
    p?.obj?.profilePhoto ? (
      <img src={p.obj.profilePhoto} alt="" className="w-14 h-14 rounded-full object-cover mx-auto"
        style={{ border: '2px solid rgba(34,211,238,0.4)' }} />
    ) : (
      <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
        style={{ background: 'linear-gradient(135deg,rgba(34,211,238,0.28),rgba(45,212,191,0.16))', border: '1px solid rgba(34,211,238,0.4)' }}>
        <User className="w-7 h-7" style={{ color: '#67e8f9' }} />
      </div>
    )
  );

  return (
    <div className="min-h-screen" style={{ background: B.bg }}>

      {/* ── Sticky Header ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 px-4 py-3 flex items-center justify-between"
        style={{ background: 'rgba(7,7,26,0.95)', borderBottom: `1px solid rgba(245,158,11,0.15)`, backdropFilter: 'blur(20px)' }}>
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
                style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: B.green }}>
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
      <div className="w-full px-4 pt-5 pb-28">

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
            <p className="text-xs font-black mb-2" style={{ color: B.cyan }}>{isTennis ? 'TENNIS SETTINGS' : 'MATCH SETTINGS'}</p>
            {isTennis ? (
              <>
                <ConfigStepper label="Number of sets" sub={`Best of ${maxSets} — first to ${setsToWin}`} value={maxSets} min={1} max={7} step={2} onChange={setMaxSets} />
                <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <ConfigStepper label="Games per set" sub="First to this many games, win by 2" value={tGamesPerSet} min={1} max={9} step={1} onChange={setTGamesPerSet} />
                <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <ConfigStepper label="Tiebreak points" sub={`Race to this at ${tGamesPerSet}–${tGamesPerSet}, win by 2`} value={tTiebreakTo} min={5} max={15} step={1} onChange={setTTiebreakTo} />
                <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <ToggleRow label="No-Ad scoring" sub="Sudden-death point at deuce" value={tNoAd} onChange={setTNoAd} />
                <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <ToggleRow label="Match-tiebreak decider" sub="Final set is a 10-point tiebreak" value={tMatchTiebreak} onChange={setTMatchTiebreak} />
              </>
            ) : (
              <>
                <ConfigStepper
                  label={`Points per ${pointUnit.toLowerCase()}`}
                  value={pointsPerSet}
                  min={5}
                  max={50}
                  step={1}
                  onChange={setPointsPerSet}
                />
                <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <ConfigStepper
                  label={`Number of ${pointUnit.toLowerCase()}s`}
                  sub={`First to win ${setsToWin} ${pointUnit.toLowerCase()}${setsToWin !== 1 ? 's' : ''}`}
                  value={maxSets}
                  min={1}
                  max={9}
                  step={2}
                  onChange={setMaxSets}
                />
              </>
            )}
          </div>
        )}

        {/* ── Scoreboard ──────────────────────────────────────────────────── */}
        <div className="rounded-2xl overflow-hidden mb-4 px-4 py-5" style={{ background: B.card, border: `1px solid ${B.border}` }}>

          {/* Current-set badge (badminton: set points · tennis: games in set) */}
          <div className="mx-auto mb-6 px-6 py-2.5 rounded-2xl text-center" style={{ maxWidth: '260px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.35)' }}>
            <div className="text-sm font-black" style={{ color: B.green }}>
              {isTennis && tInTiebreak ? 'Tiebreak' : `${pointUnit} ${score.currentSet + 1}`}
            </div>
            <div className="text-2xl font-black text-white leading-tight my-0.5">
              {left.score} <span style={{ color: 'rgba(255,255,255,0.35)' }}>–</span> {right.score}
              {isTennis && <span className="text-xs font-bold ml-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>games</span>}
            </div>
            <div className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Best of {maxSets} {pointUnit}{maxSets !== 1 ? 's' : ''}{isTennis && tNoAd ? ' · No-Ad' : ''}
            </div>
            {isTennis && (score.sets || []).some(s => s.winner) && (
              <div className="text-[11px] font-bold mt-1" style={{ color: '#67e8f9' }}>{tennisSetSummary(score)}</div>
            )}
          </div>

          {/* Players + live score */}
          <div className="grid items-start gap-2" style={{ gridTemplateColumns: '1fr auto 1fr' }}>
            {/* Left player */}
            <div className="rounded-2xl px-2 py-4 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${B.border}` }}>
              {sideAvatar(left)}
              <p className="text-sm font-black text-white leading-tight mt-2 px-0.5" style={{ wordBreak: 'break-word' }}>{left.l1}</p>
              {left.l2 && <p className="text-xs font-bold leading-tight mt-0.5 px-0.5" style={{ color: '#67e8f9', wordBreak: 'break-word' }}>/ {left.l2}</p>}
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>{pointUnit}s Won</p>
              <div className="mx-auto mt-1.5 w-12 py-1 rounded-lg text-base font-black"
                style={left.sets > right.sets
                  ? { background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', color: B.green }
                  : { background: 'rgba(255,255,255,0.05)', border: `1px solid ${B.border}`, color: '#fff' }}>
                {left.sets}
              </div>
            </div>

            {/* Live score — tennis shows the current game (15/30/40/Ad or tiebreak pts) */}
            <div className="text-center px-1 pt-5">
              <div className="font-black text-white leading-none" style={{ fontSize: '2.75rem' }}>
                {isTennis
                  ? <>{pointLabel(left.gpt, right.gpt, tInTiebreak)}<span className="align-middle" style={{ fontSize: '2rem', color: 'rgba(255,255,255,0.3)', margin: '0 6px' }}>-</span>{pointLabel(right.gpt, left.gpt, tInTiebreak)}</>
                  : <>{left.score}<span className="align-middle" style={{ fontSize: '2rem', color: 'rgba(255,255,255,0.3)', margin: '0 6px' }}>-</span>{right.score}</>}
              </div>
              <p className="text-sm font-black mt-2" style={{ color: B.green }}>
                {isTennis ? (tInTiebreak ? 'Tiebreak' : 'Game') : `${pointUnit} ${score.currentSet + 1}`}
              </p>
            </div>

            {/* Right player */}
            <div className="rounded-2xl px-2 py-4 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${B.border}` }}>
              {sideAvatar(right)}
              <p className="text-sm font-black text-white leading-tight mt-2 px-0.5" style={{ wordBreak: 'break-word' }}>{right.l1}</p>
              {right.l2 && <p className="text-xs font-bold leading-tight mt-0.5 px-0.5" style={{ color: '#67e8f9', wordBreak: 'break-word' }}>/ {right.l2}</p>}
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>{pointUnit}s Won</p>
              <div className="mx-auto mt-1.5 w-12 py-1 rounded-lg text-base font-black"
                style={right.sets > left.sets
                  ? { background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', color: B.green }
                  : { background: 'rgba(255,255,255,0.05)', border: `1px solid ${B.border}`, color: '#fff' }}>
                {right.sets}
              </div>
            </div>
          </div>

          {/* Swap players */}
          {!isCompleted && (
            <div className="text-center mt-5">
              <button onClick={toggleSwap} disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
                style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${B.border}`, color: '#fff' }}>
                <ArrowLeftRight className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.7)' }} /> Swap Players
              </button>
              <p className="text-xs mt-2 leading-snug" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Swap players' sides.<br />Scores and stats will update accordingly.
              </p>
            </div>
          )}
        </div>

        {/* ── Scoring Controls ─────────────────────────────────────────────── */}
        {!isCompleted && (
          <div className="grid grid-cols-2 gap-3">
            {/* Left player controls */}
            <div className="rounded-2xl overflow-hidden" style={{ background: B.card, border: `1px solid ${B.border}`, opacity: isPaused ? 0.45 : 1 }}>
              <div className="px-3 pt-3 pb-2 text-center border-b" style={{ borderColor: B.border }}>
                <p className="text-xs font-black text-white leading-tight" style={{ wordBreak: 'break-word' }}>{left.l1}</p>
                {left.l2 && <p className="text-[11px] font-bold leading-tight" style={{ color: '#67e8f9', wordBreak: 'break-word' }}>/ {left.l2}</p>}
              </div>
              <div className="p-3 space-y-2">
                <button onClick={() => addPoint(left.num)} disabled={isPaused || !canScore}
                  className="w-full py-5 rounded-xl font-black text-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg,#F59E0B,#D97706)', color: '#050810', boxShadow: isPaused ? 'none' : '0 4px 16px rgba(245,158,11,0.35)' }}>
                  <Plus className="w-6 h-6" /> Point
                </button>
                <button onClick={() => removePoint(left.num)} disabled={isPaused || !canScore}
                  className="w-full py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                  style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${B.border}`, color: 'rgba(255,255,255,0.55)' }}>
                  <Minus className="w-4 h-4" /> Undo
                </button>
              </div>
            </div>

            {/* Right player controls */}
            <div className="rounded-2xl overflow-hidden" style={{ background: B.card, border: `1px solid ${B.border}`, opacity: isPaused ? 0.45 : 1 }}>
              <div className="px-3 pt-3 pb-2 text-center border-b" style={{ borderColor: B.border }}>
                <p className="text-xs font-black text-white leading-tight" style={{ wordBreak: 'break-word' }}>{right.l1}</p>
                {right.l2 && <p className="text-[11px] font-bold leading-tight" style={{ color: '#67e8f9', wordBreak: 'break-word' }}>/ {right.l2}</p>}
              </div>
              <div className="p-3 space-y-2">
                <button onClick={() => addPoint(right.num)} disabled={isPaused || !canScore}
                  className="w-full py-5 rounded-xl font-black text-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg,#F59E0B,#D97706)', color: '#050810', boxShadow: isPaused ? 'none' : '0 4px 16px rgba(245,158,11,0.35)' }}>
                  <Plus className="w-6 h-6" /> Point
                </button>
                <button onClick={() => removePoint(right.num)} disabled={isPaused || !canScore}
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
            style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
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
        <div className="fixed bottom-0 left-0 right-0 p-4" style={{ background: 'rgba(7,7,26,0.97)', borderTop: `1px solid rgba(245,158,11,0.15)` }}>
          <div className="w-full">
            <button onClick={handleStartMatch} disabled={saving}
              className="w-full py-4 rounded-2xl font-black text-base transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg,#F59E0B,#D97706)', color: '#050810', boxShadow: '0 4px 20px rgba(245,158,11,0.4)' }}>
              {saving
                ? <><div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#050810 transparent transparent transparent' }} />Starting…</>
                : <><Play className="w-5 h-5" />START MATCH — {p1Display} vs {p2Display}</>}
            </button>
            <p className="text-center text-xs mt-2" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {isTennis
                ? `Tennis · Best of ${maxSets} · games to ${tGamesPerSet}${tNoAd ? ' · No-Ad' : ''}`
                : `${pointsPerSet} pts · Best of ${maxSets}`}
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
                  <p className="text-base font-bold text-white">{completedSetData.setNumber ? `Set ${completedSetData.setNumber}: ` : 'Final: '}{completedSetData.score}</p>
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
                    style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.35)' }}>
                    <Trophy className="w-7 h-7" style={{ color: B.green }} />
                  </div>
                  <h2 className="text-lg font-black text-white mb-1">{pointUnit} {completedSetData.setNumber} Complete!</h2>
                  <p className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    <span className="font-bold" style={{ color: B.green }}>{completedSetData.winner}</span> wins the {pointUnit.toLowerCase()}
                  </p>
                  <p className="text-xl font-black text-white">{completedSetData.score}</p>
                </div>
                <div className="px-5 pb-5 space-y-2">
                  <button onClick={handleContinueToNextSet}
                    className="w-full py-3.5 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg,#F59E0B,#D97706)', color: '#050810', boxShadow: '0 4px 16px rgba(245,158,11,0.35)' }}>
                    <Play className="w-4 h-4" /> Continue to {pointUnit} {completedSetData.setNumber + 1}
                  </button>
                  <button onClick={handleEndMatchEarly}
                    className="w-full py-3 rounded-xl text-sm font-bold transition-all"
                    style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', color: B.amber }}>
                    End Match Here
                  </button>
                  <p className="text-center text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    {score.matchConfig?.maxSets === 1 ? `1 ${pointUnit.toLowerCase()}` : `Best of ${score.matchConfig?.maxSets || maxSets} ${pointUnit.toLowerCase()}s`}
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
                style={{ background: 'linear-gradient(135deg,#F59E0B,#D97706)', color: '#050810' }}>
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
        <Clock className="w-4 h-4" style={{ color: isPaused ? '#fbbf24' : '#F59E0B' }} />
        <span className="text-xl font-black font-mono" style={{ color: isPaused ? '#fbbf24' : '#fff' }}>
          {fmt(displayTime)}
        </span>
      </div>
    </div>
  );
};

export default MatchScoringPage;



