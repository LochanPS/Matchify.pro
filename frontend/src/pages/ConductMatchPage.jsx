import { getErrorMessage } from '../utils/errorMessage';
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import { ArrowLeft, Gavel, Trophy, AlertTriangle, Play, Loader, Swords, Settings, Check, X } from 'lucide-react';
import LoadingScreen from '../components/LoadingScreen';
import Spinner from '../components/Spinner';

const B = {
  bg: '#050810',
  card: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
  input: 'rgba(0,0,0,0.3)',
  inputBorder: 'rgba(255,255,255,0.1)',
  green: '#06b6d4',
  cyan: '#00d4ff',
  purple: '#a855f7',
  red: '#f87171',
};

const ConductMatchPage = () => {
  const { matchId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const umpireId = searchParams.get('umpireId');

  const [match, setMatch] = useState(null);
  const [umpire, setUmpire] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const [givingBye, setGivingBye] = useState(false);

  const [pointsPerSet, setPointsPerSet] = useState(21);
  const [maxSets, setMaxSets] = useState(3);
  const [extension, setExtension] = useState(true);

  useEffect(() => {
    if (!matchId) return;
    fetchMatchDetails();
  }, [matchId]);

  const fetchMatchDetails = async () => {
    if (!matchId) { setError('Match ID is missing'); setLoading(false); return; }
    try {
      setLoading(true);
      const matchRes = await api.get(`/matches/${matchId}`);
      const m = matchRes.data.match;
      setMatch(m);
      if (m?.category?.scoringFormat) {
        const cfg = parseScoringFormat(m.category.scoringFormat);
        setPointsPerSet(cfg.points);
        setMaxSets(cfg.sets);
        setExtension(!m.category.scoringFormat.toLowerCase().includes('noext'));
      }
      // Resolve umpire: use match.umpire from DB response (already fetched by service),
      // or fall back to fetching by URL umpireId param if needed
      if (m?.umpire) {
        setUmpire(m.umpire);
      } else if (umpireId || m?.umpireId) {
        const resolvedUmpireId = umpireId || m?.umpireId;
        try {
          const umpireRes = await api.get(`/users/${resolvedUmpireId}`);
          setUmpire(umpireRes.data.user);
        } catch (_) { /* non-critical */ }
      }
    } catch (err) {
      if (err.response?.status === 404) setError('Match not found.');
      else if (err.code === 'ERR_NETWORK' || !err.response) setError('Network error. Check your connection.');
      else setError(err.response?.data?.error || 'Failed to load match details');
    } finally {
      setLoading(false);
    }
  };

  const parseScoringFormat = (scoringFormat) => {
    if (!scoringFormat) return { points: 21, sets: 3 };
    const nxm = scoringFormat.match(/(\d+)x(\d+)/);
    if (nxm) return { points: parseInt(nxm[1]), sets: parseInt(nxm[2]) };
    const gm = scoringFormat.match(/(\d+)\s*games?\s*to\s*(\d+)\s*pts?/i);
    if (gm) return { points: parseInt(gm[2]), sets: parseInt(gm[1]) };
    return { points: 21, sets: 3 };
  };

  const handleStartMatch = async () => {
    setAssigning(true);
    setError(null);
    try {
      // Umpire is always assigned BEFORE reaching this page (via modal or umpire dashboard).
      // Do NOT re-call PUT /umpire here — it is organizer-only and would 403 for umpires.
      if (['PENDING', 'READY', 'SCHEDULED'].includes(match.status)) {
        try {
          await api.put(`/matches/${matchId}/config`, { pointsPerSet, maxSets, setsToWin: Math.ceil(maxSets / 2), extension });
        } catch (_) { /* match may have already started */ }
      }
      navigate(`/match/${matchId}/score`);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to start match'));
      setAssigning(false);
    }
  };

  const handleGiveBye = async () => {
    setGivingBye(true);
    setError(null);
    try {
      const byeWinnerId = player1 ? match.player1Id : match.player2Id;
      if (!byeWinnerId) { setError('No player found to give bye'); setGivingBye(false); return; }
      await api.post(`/matches/${matchId}/give-bye`, { winnerId: byeWinnerId });
      navigate(`/tournaments/${match.tournamentId}/draws`);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to give bye'));
      setGivingBye(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return <LoadingScreen message="Loading match…" />;
  }

  // Match already in progress — send to scoring page (render-phase, no async navigate)
  if (match?.status === 'IN_PROGRESS' || match?.status === 'COMPLETED') {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: B.bg }}>
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg,rgba(6,182,212,0.25),rgba(6,182,212,0.15))', border: '1px solid rgba(6,182,212,0.4)' }}>
            <Play className="w-7 h-7" style={{ color: B.green }} />
          </div>
          <h2 className="text-lg font-black text-white mb-1">
            {match.status === 'COMPLETED' ? 'Match Completed' : 'Match In Progress'}
          </h2>
          <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {match.status === 'COMPLETED' ? 'This match has already been completed.' : 'This match has already been started.'}
          </p>
          <button
            onClick={() => navigate(`/match/${matchId}/score`)}
            className="px-6 py-3 rounded-xl font-black text-sm"
            style={{ background: 'linear-gradient(135deg,#0891b2,#06b6d4)', color: '#050810', boxShadow: '0 4px 16px rgba(6,182,212,0.35)' }}>
            {match.status === 'COMPLETED' ? 'View Match Result' : 'Go to Scoring →'}
          </button>
          <div className="mt-3">
            <button onClick={() => match ? navigate(`/tournaments/${match.tournamentId}/draws/${match.categoryId || ''}`) : navigate('/dashboard')} className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>
              ← Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error && !match) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: B.bg }}>
        <div className="text-center">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3" style={{ color: B.red }} />
          <p className="text-white font-bold mb-4">{error}</p>
          <button onClick={() => navigate('/dashboard')}
            className="px-5 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const player1 = match?.player1 || match?.registration1?.user;
  const player2 = match?.player2 || match?.registration2?.user;
  const tournament = match?.tournament;
  const category = match?.category;

  const getRoundName = () => {
    if (!match?.round) return '';
    if (match.round === 1) return 'FINAL';
    if (match.round === 2) return 'SEMI FINAL';
    if (match.round === 3) return 'QUARTER FINAL';
    return `ROUND ${match.round}`;
  };

  const inputStyle = { background: B.input, border: `1.5px solid ${B.inputBorder}`, outline: 'none', colorScheme: 'dark' };

  const StepBtn = ({ onClick, children }) => (
    <button type="button" onClick={onClick}
      className="w-11 h-11 flex items-center justify-center rounded-xl font-black text-lg text-white flex-shrink-0 transition-all"
      style={{ background: 'rgba(255,255,255,0.07)', border: `1px solid ${B.inputBorder}` }}>
      {children}
    </button>
  );

  return (
    <div className="min-h-screen pb-10" style={{ background: B.bg }}>
      <div className="max-w-lg mx-auto px-4 pt-6">

        {/* Back */}
        <button onClick={() => match ? navigate(`/tournaments/${match.tournamentId}/draws/${match.categoryId || ''}`) : navigate('/dashboard')} className="flex items-center gap-1.5 mb-5 text-sm font-bold"
          style={{ color: 'rgba(255,255,255,0.5)' }}>
          <ArrowLeft className="h-4 w-4" /> Back to Draw
        </button>

        {/* Tournament badge */}
        <div className="text-center mb-5">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold"
            style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24' }}>
            <Trophy className="w-3.5 h-3.5" />
            {tournament?.name || 'Tournament'}
          </span>
          {category && <p className="text-xs mt-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{category.name}</p>}
        </div>

        {/* Match title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-1">
            <Swords className="w-6 h-6" style={{ color: B.green }} />
            <h1 className="text-2xl font-black text-white">Match {match?.matchNumber}</h1>
          </div>
          <p className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Round {match?.round} • <span style={{ color: B.green }}>{match?.status === 'PENDING' ? 'READY' : match?.status}</span>
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 flex items-start gap-2.5 px-4 py-3 rounded-xl"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: B.red }} />
            <p className="text-xs font-semibold flex-1" style={{ color: B.red }}>{error}</p>
            <button onClick={() => setError(null)}><X className="w-4 h-4" style={{ color: B.red }} /></button>
          </div>
        )}

        <div className="space-y-4">

          {/* ── Players Card ─────────────────────────────────────────────── */}
          <div className="rounded-2xl overflow-hidden relative"
            style={{ background: B.card, border: `1px solid ${B.border}` }}>
            {/* Top accent line */}
            <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${B.green}, ${B.purple})` }} />

            <div className="p-5 flex items-center gap-3">
              {/* Player 1 */}
              <div className="flex-1 text-center">
                <div className="relative inline-block mb-3">
                  {player1?.profilePhoto ? (
                    <img src={player1.profilePhoto} alt={player1.name}
                      className="w-16 h-16 rounded-2xl object-cover"
                      style={{ border: `2px solid rgba(6,182,212,0.4)`, boxShadow: '0 0 20px rgba(6,182,212,0.2)' }} />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-xl text-white"
                      style={{ background: 'linear-gradient(135deg,#0891b2,#06b6d4)', boxShadow: '0 0 20px rgba(6,182,212,0.25)' }}>
                      {player1?.name?.charAt(0)?.toUpperCase() || 'P'}
                    </div>
                  )}
                  <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black"
                    style={{ background: B.green, color: '#050810' }}>1</div>
                </div>
                <p className="text-sm font-black text-white leading-tight line-clamp-2">
                  {player1?.name || 'Player 1'}
                </p>
                {player1?.partnerName && (
                  <p className="text-xs font-bold leading-tight mt-0.5" style={{ color: B.green }}>
                    & {player1.partnerName}
                  </p>
                )}
                {!player1 && (
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Awaiting player</p>
                )}
              </div>

              {/* VS */}
              <div className="flex flex-col items-center gap-1.5 px-2">
                <div className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${B.border}` }}>
                  <span className="text-lg font-black" style={{ color: B.cyan }}>VS</span>
                </div>
                <div className="flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  <Swords className="w-3 h-3" />
                  <span className="text-xs font-bold">{getRoundName()}</span>
                </div>
              </div>

              {/* Player 2 */}
              <div className="flex-1 text-center">
                <div className="relative inline-block mb-3">
                  {player2?.profilePhoto ? (
                    <img src={player2.profilePhoto} alt={player2.name}
                      className="w-16 h-16 rounded-2xl object-cover"
                      style={{ border: `2px solid rgba(168,85,247,0.4)`, boxShadow: '0 0 20px rgba(168,85,247,0.2)' }} />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-xl text-white"
                      style={{ background: 'linear-gradient(135deg,#a855f7,#7c3aed)', boxShadow: '0 0 20px rgba(168,85,247,0.25)' }}>
                      {player2?.name?.charAt(0)?.toUpperCase() || 'P'}
                    </div>
                  )}
                  <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black"
                    style={{ background: B.purple, color: '#fff' }}>2</div>
                </div>
                <p className="text-sm font-black text-white leading-tight line-clamp-2">
                  {player2?.name || 'Player 2'}
                </p>
                {player2?.partnerName && (
                  <p className="text-xs font-bold leading-tight mt-0.5" style={{ color: B.purple }}>
                    & {player2.partnerName}
                  </p>
                )}
                {!player2 && (
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Awaiting player</p>
                )}
              </div>
            </div>
          </div>

          {/* ── Umpire Card ───────────────────────────────────────────────── */}
          {umpire && (
            <div className="rounded-2xl flex items-center gap-4 px-4 py-3.5"
              style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.2)' }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,rgba(6,182,212,0.3),rgba(6,182,212,0.2))', border: '1px solid rgba(6,182,212,0.3)' }}>
                <Gavel className="w-5 h-5" style={{ color: B.green }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: 'rgba(6,182,212,0.6)' }}>Match Official</p>
                <p className="text-sm font-black text-white truncate">{umpire.name}</p>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg flex-shrink-0"
                style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)' }}>
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: B.green }} />
                <span className="text-xs font-bold" style={{ color: B.green }}>Ready</span>
              </div>
            </div>
          )}

          {/* ── Configure Match Settings ──────────────────────────────────── */}
          <div className="rounded-2xl overflow-hidden"
            style={{ background: B.card, border: `1px solid ${B.border}` }}>
            {/* Section header */}
            <div className="px-4 py-3 flex items-center gap-3"
              style={{ borderBottom: `1px solid ${B.border}`, background: 'rgba(168,85,247,0.04)' }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)' }}>
                <Settings className="w-4 h-4" style={{ color: B.purple }} />
              </div>
              <div>
                <h2 className="text-sm font-black text-white">Configure Match Settings</h2>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Set scoring format before starting</p>
              </div>
            </div>

            <div className="p-4 space-y-5">
              {/* Points per Set */}
              <div>
                <label className="block text-xs font-black mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>Points per Set</label>
                <div className="flex items-center gap-3">
                  <StepBtn onClick={() => setPointsPerSet(Math.max(0, pointsPerSet - 1))}>−</StepBtn>
                  <input
                    type="number"
                    value={pointsPerSet}
                    onChange={e => setPointsPerSet(parseInt(e.target.value) || 0)}
                    className="flex-1 px-3 py-2.5 rounded-xl text-white text-center text-lg font-black"
                    style={inputStyle}
                    min="0" max="100"
                  />
                  <StepBtn onClick={() => setPointsPerSet(Math.min(100, pointsPerSet + 1))}>+</StepBtn>
                </div>
                <p className="text-xs mt-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>e.g. 11, 15, 21, 30</p>
              </div>

              {/* Number of Sets */}
              <div>
                <label className="block text-xs font-black mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>Number of Sets</label>
                <div className="flex items-center gap-3">
                  <StepBtn onClick={() => setMaxSets(Math.max(1, maxSets - 1))}>−</StepBtn>
                  <input
                    type="number"
                    value={maxSets}
                    onChange={e => setMaxSets(parseInt(e.target.value) || 1)}
                    className="flex-1 px-3 py-2.5 rounded-xl text-white text-center text-lg font-black"
                    style={inputStyle}
                    min="1" max="9"
                  />
                  <StepBtn onClick={() => setMaxSets(Math.min(9, maxSets + 1))}>+</StepBtn>
                </div>
                <p className="text-xs mt-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {maxSets === 1 ? 'Single set match' : `Best of ${maxSets} — first to ${Math.ceil(maxSets / 2)} sets`}
                </p>
              </div>

              {/* Extension toggle */}
              <div>
                <label className="block text-xs font-black mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>Extension (Deuce)</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setExtension(true)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
                    style={extension
                      ? { background: 'linear-gradient(135deg,rgba(6,182,212,0.25),rgba(6,182,212,0.2))', border: '1.5px solid rgba(6,182,212,0.5)', color: B.green }
                      : { background: 'rgba(255,255,255,0.04)', border: `1.5px solid ${B.inputBorder}`, color: 'rgba(255,255,255,0.4)' }}
                  >
                    {extension && <Check className="w-4 h-4" />}
                    Yes — Deuce
                  </button>
                  <button
                    onClick={() => setExtension(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
                    style={!extension
                      ? { background: 'rgba(239,68,68,0.15)', border: '1.5px solid rgba(239,68,68,0.4)', color: B.red }
                      : { background: 'rgba(255,255,255,0.04)', border: `1.5px solid ${B.inputBorder}`, color: 'rgba(255,255,255,0.4)' }}
                  >
                    {!extension && <Check className="w-4 h-4" />}
                    No — Fixed
                  </button>
                </div>
              </div>

              {/* Summary line */}
              <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
                style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)' }}>
                <Settings className="w-4 h-4 flex-shrink-0" style={{ color: B.cyan }} />
                <p className="text-xs font-bold" style={{ color: B.cyan }}>
                  {maxSets === 1 ? `Single set to ${pointsPerSet} pts` : `Best of ${maxSets}, ${pointsPerSet} pts each`}
                  {!extension ? ' · No deuce' : ''}
                </p>
              </div>
            </div>
          </div>

          {/* ── Action Buttons ────────────────────────────────────────────── */}
          {(!player1 || !player2) ? (
            /* BYE match — one player missing */
            <div className="space-y-3">
              <button
                onClick={handleGiveBye}
                disabled={givingBye || (!player1 && !player2)}
                className="w-full py-4 rounded-2xl font-black text-base transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg,#f59e0b,#fbbf24)', color: '#050810', boxShadow: '0 6px 20px rgba(245,158,11,0.35)' }}>
                {givingBye ? <Spinner size="md" /> : <Trophy className="w-5 h-5" />}
                {givingBye ? 'Giving Bye…' : `Give Bye to ${player1?.name || player2?.name || 'Player'}`}
              </button>
              <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl"
                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#fbbf24' }} />
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  One player is missing. Give Bye to advance {player1?.name || player2?.name || 'the player'} automatically.
                </p>
              </div>
            </div>
          ) : (
            /* Both players present — allow start */
            <button
              onClick={handleStartMatch}
              disabled={assigning}
              className="w-full py-4 rounded-2xl font-black text-base transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg,#0891b2,#06b6d4)', color: '#050810', boxShadow: '0 6px 20px rgba(6,182,212,0.35)' }}>
              {assigning
                ? <><Spinner size="md" />Starting…</>
                : <><Play className="w-5 h-5" />Start Match</>}
            </button>
          )}

        </div>
      </div>
    </div>
  );
};

export default ConductMatchPage;
