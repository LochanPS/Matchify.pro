/**
 * QuickMatchPage — standalone match scorer, no tournament required.
 * Flow: pick singles/doubles → setup (names + settings) → score live → declare winner.
 * Entirely frontend — zero API calls, zero DB writes.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Plus, Minus, Trophy, RotateCcw, Check, Swords } from 'lucide-react';

const B = {
  bg: '#07071a',
  card: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
  green: '#06b6d4',
  cyan: '#00d4ff',
  purple: '#a855f7',
  amber: '#fbbf24',
  red: '#f87171',
};

/* ─── helpers ─────────────────────────────────────────────────────────────── */
const calcSetWinner = (s, pts, cap) => {
  const { p1, p2 } = s;
  const lead = Math.abs(p1 - p2);
  if (p1 >= pts && lead >= 2) return 1;
  if (p2 >= pts && lead >= 2) return 2;
  if (p1 >= cap) return 1;
  if (p2 >= cap) return 2;
  return 0;
};

const calcSetsWon = (sets) => {
  let a = 0, b = 0;
  sets.forEach(s => { if (s.winner === 1) a++; else if (s.winner === 2) b++; });
  return [a, b];
};

/* ─── Step 1: Type ─────────────────────────────────────────────────────────── */
const StepType = ({ onSelect }) => (
  <div className="min-h-screen flex flex-col items-center justify-center px-5 pb-10" style={{ background: B.bg }}>
    <Swords className="w-12 h-12 mb-4" style={{ color: B.cyan }} />
    <h1 className="text-2xl font-black text-white mb-2">Quick Match</h1>
    <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.45)' }}>Choose match type</p>
    <div className="w-full max-w-sm space-y-4">
      <button
        onClick={() => onSelect('singles')}
        className="w-full py-5 rounded-2xl font-black text-base transition-all active:scale-95"
        style={{ background: 'linear-gradient(135deg,#06b6d4,#00d4ff)', color: '#07071a', boxShadow: '0 6px 24px rgba(6,182,212,0.35)' }}
      >
        🏸 Singles
        <p className="text-xs font-semibold mt-1 opacity-70">1 vs 1</p>
      </button>
      <button
        onClick={() => onSelect('doubles')}
        className="w-full py-5 rounded-2xl font-black text-base transition-all active:scale-95"
        style={{ background: 'linear-gradient(135deg,#a855f7,#6366f1)', color: 'white', boxShadow: '0 6px 24px rgba(168,85,247,0.35)' }}
      >
        🏸🏸 Doubles
        <p className="text-xs font-semibold mt-1 opacity-70">2 vs 2</p>
      </button>
    </div>
  </div>
);

/* ─── Step 2: Setup (names + settings) ─────────────────────────────────────── */
const NameField = ({ label, value, onChange, placeholder }) => (
  <div>
    <label className="block text-xs font-bold mb-1.5" style={{ color: 'rgba(255,255,255,0.55)' }}>{label}</label>
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-4 py-3 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none"
      style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)' }}
    />
  </div>
);

const Stepper = ({ label, sub, value, min, max, step, onChange }) => (
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

const StepSetup = ({ type, onBack, onStart }) => {
  const [names, setNames] = useState(
    type === 'singles' ? { a1: '', b1: '' } : { a1: '', a2: '', b1: '', b2: '' }
  );
  const [pts, setPts] = useState(21);
  const [numSets, setNumSets] = useState(3);
  const [err, setErr] = useState('');

  const setName = (key, val) => { setNames(prev => ({ ...prev, [key]: val })); setErr(''); };

  const validate = () => {
    if (!names.a1.trim()) return type === 'singles' ? 'Enter Player 1 name' : 'Enter Team A – Player 1 name';
    if (type === 'doubles' && !names.a2.trim()) return 'Enter Team A – Player 2 name';
    if (!names.b1.trim()) return type === 'singles' ? 'Enter Opponent name' : 'Enter Team B – Player 1 name';
    if (type === 'doubles' && !names.b2.trim()) return 'Enter Team B – Player 2 name';
    return '';
  };

  const handleContinue = () => {
    const e = validate();
    if (e) { setErr(e); return; }
    const teamA = type === 'singles' ? names.a1.trim() : `${names.a1.trim()} / ${names.a2.trim()}`;
    const teamB = type === 'singles' ? names.b1.trim() : `${names.b1.trim()} / ${names.b2.trim()}`;
    onStart({ teamA, teamB, pts, numSets });
  };

  const setsToWin = Math.ceil(numSets / 2);

  return (
    <div className="min-h-screen pb-10" style={{ background: B.bg }}>
      <div className="max-w-sm mx-auto px-5 pt-6">
        <button onClick={onBack} className="flex items-center gap-1.5 mb-6 text-sm font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-xl font-black text-white mb-1">Match Setup</h1>
        <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {type === 'singles' ? 'Singles' : 'Doubles'} · Enter names and configure settings
        </p>

        <div className="space-y-5">
          {/* Team A */}
          <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.2)' }}>
            <p className="text-xs font-black" style={{ color: B.green }}>
              {type === 'singles' ? 'PLAYER 1' : 'TEAM A'}
            </p>
            <NameField
              label={type === 'singles' ? 'Name' : 'Player 1'}
              value={names.a1}
              onChange={v => setName('a1', v)}
              placeholder="Enter name"
            />
            {type === 'doubles' && (
              <NameField label="Player 2" value={names.a2} onChange={v => setName('a2', v)} placeholder="Enter name" />
            )}
          </div>

          {/* VS divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <span className="text-xs font-black" style={{ color: B.cyan }}>VS</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
          </div>

          {/* Team B */}
          <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.2)' }}>
            <p className="text-xs font-black" style={{ color: B.purple }}>
              {type === 'singles' ? 'OPPONENT' : 'TEAM B'}
            </p>
            <NameField
              label={type === 'singles' ? 'Name' : 'Player 1'}
              value={names.b1}
              onChange={v => setName('b1', v)}
              placeholder="Enter name"
            />
            {type === 'doubles' && (
              <NameField label="Player 2" value={names.b2} onChange={v => setName('b2', v)} placeholder="Enter name" />
            )}
          </div>

          {/* Match Settings */}
          <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-xs font-black mb-2" style={{ color: B.cyan }}>MATCH SETTINGS</p>
            <Stepper
              label="Points per set"
              value={pts}
              min={5}
              max={50}
              step={1}
              onChange={setPts}
            />
            <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <Stepper
              label="Number of sets"
              sub={`First to win ${setsToWin} set${setsToWin !== 1 ? 's' : ''}`}
              value={numSets}
              min={1}
              max={9}
              step={2}
              onChange={setNumSets}
            />
          </div>

          {err && <p className="text-xs font-bold text-center" style={{ color: B.red }}>{err}</p>}

          <button
            onClick={handleContinue}
            className="w-full py-4 rounded-2xl font-black text-base transition-all active:scale-95 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg,#0891b2,#06b6d4)', color: '#07071a', boxShadow: '0 6px 20px rgba(6,182,212,0.4)' }}
          >
            <Play className="w-5 h-5" />
            Continue to Match
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Step 3: Score ─────────────────────────────────────────────────────────── */
const StepScore = ({ config, onReset }) => {
  const { teamA, teamB, pts, numSets } = config;
  const setsToWin = Math.ceil(numSets / 2);
  const cap = pts + 9; // deuce cap: 21→30, 15→24, 11→20, etc.

  const [sets, setSets] = useState([{ p1: 0, p2: 0, winner: 0 }]);
  const [cur, setCur] = useState(0);
  const [started] = useState(true);
  const [matchOver, setMatchOver] = useState(null); // null | 1 | 2
  const [showConfirm, setShowConfirm] = useState(null); // 1 | 2

  const [s1, s2] = calcSetsWon(sets);
  const currentSet = sets[cur] || { p1: 0, p2: 0 };

  const changeScore = (side, delta) => {
    if (matchOver) return;
    setSets(prev => {
      const key = side === 1 ? 'p1' : 'p2';
      const next = prev.map((s, i) =>
        i === cur ? { ...s, [key]: Math.max(0, s[key] + delta) } : s
      );
      // Before match starts: free score editing, no auto winner
      if (!started) return next;
      // After start: check set winner
      const w = calcSetWinner(next[cur], pts, cap);
      if (w) {
        next[cur] = { ...next[cur], winner: w };
        const [a, b] = calcSetsWon(next);
        if (a >= setsToWin || b >= setsToWin) {
          setMatchOver(a >= setsToWin ? 1 : 2);
        } else if (next.length <= cur + 1 && next.length < numSets) {
          setCur(c => c + 1);
          return [...next, { p1: 0, p2: 0, winner: 0 }];
        }
      }
      return next;
    });
  };

  const endManual = (winner) => { setMatchOver(winner); setShowConfirm(null); };
  const settingsLabel = `${pts} pts · Best of ${numSets}`;

  return (
    <div className="min-h-screen pb-32" style={{ background: B.bg }}>
      <div className="max-w-sm mx-auto px-4 pt-5">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <button onClick={onReset} className="flex items-center gap-1.5 text-sm font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <ArrowLeft className="w-4 h-4" /> New Match
          </button>
          <span className="text-xs font-black px-3 py-1 rounded-full" style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.25)', color: B.cyan }}>
            {settingsLabel}
          </span>
        </div>

        {/* Match over banner */}
        {matchOver && (
          <div className="rounded-2xl p-4 mb-4 text-center" style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.35)' }}>
            <Trophy className="w-8 h-8 mx-auto mb-2" style={{ color: B.amber }} />
            <p className="text-lg font-black text-white">{matchOver === 1 ? teamA : teamB}</p>
            <p className="text-sm font-bold" style={{ color: B.amber }}>Wins the Match!</p>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>Sets: {s1} – {s2}</p>
            <button
              onClick={onReset}
              className="mt-4 px-6 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 mx-auto"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              <RotateCcw className="w-4 h-4" /> Play Again
            </button>
          </div>
        )}

        {/* Set tabs */}
        <div className="flex gap-2 mb-4">
          {sets.map((s, i) => (
            <button
              key={i}
              onClick={() => setCur(i)}
              className="flex-1 py-2 rounded-xl text-xs font-black transition-all"
              style={{
                background: i === cur ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1.5px solid ${i === cur ? 'rgba(0,212,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
                color: i === cur ? B.cyan : 'rgba(255,255,255,0.4)',
              }}
            >
              Set {i + 1}
              {s.winner === 1 && <span className="ml-1">🟢</span>}
              {s.winner === 2 && <span className="ml-1">🟣</span>}
            </button>
          ))}
        </div>

        {/* Scoreboard */}
        <div className="rounded-2xl overflow-hidden mb-4" style={{ background: B.card, border: `1px solid ${B.border}` }}>
          <div className="h-0.5" style={{ background: 'linear-gradient(90deg,#06b6d4,#a855f7)' }} />
          <div className="p-5 flex items-center gap-3">

            {/* Team A */}
            <div className="flex-1 flex flex-col items-center gap-3">
              <p
                className="text-xs font-black text-center leading-tight px-1"
                style={{ color: B.green, wordBreak: 'break-word', maxWidth: '100%' }}
              >
                {teamA}
              </p>
              <div className="text-5xl font-black text-white">{currentSet.p1}</div>
              <p className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {s1} set{s1 !== 1 ? 's' : ''}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => changeScore(1, -1)}
                  disabled={!!matchOver}
                  className="w-12 h-12 rounded-xl flex items-center justify-center font-black transition-all disabled:opacity-30 active:scale-90"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}
                >
                  <Minus className="w-5 h-5" />
                </button>
                <button
                  onClick={() => changeScore(1, 1)}
                  disabled={!!matchOver}
                  className="w-12 h-12 rounded-xl flex items-center justify-center font-black transition-all disabled:opacity-30 active:scale-90"
                  style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)', color: B.green }}
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* VS */}
            <div className="flex flex-col items-center gap-1 px-2">
              <span className="text-sm font-black" style={{ color: B.cyan }}>VS</span>
              {started && !matchOver && (
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(6,182,212,0.1)', color: B.green }}
                >
                  LIVE
                </span>
              )}
            </div>

            {/* Team B */}
            <div className="flex-1 flex flex-col items-center gap-3">
              <p
                className="text-xs font-black text-center leading-tight px-1"
                style={{ color: B.purple, wordBreak: 'break-word', maxWidth: '100%' }}
              >
                {teamB}
              </p>
              <div className="text-5xl font-black text-white">{currentSet.p2}</div>
              <p className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {s2} set{s2 !== 1 ? 's' : ''}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => changeScore(2, -1)}
                  disabled={!!matchOver}
                  className="w-12 h-12 rounded-xl flex items-center justify-center font-black transition-all disabled:opacity-30 active:scale-90"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}
                >
                  <Minus className="w-5 h-5" />
                </button>
                <button
                  onClick={() => changeScore(2, 1)}
                  disabled={!!matchOver}
                  className="w-12 h-12 rounded-xl flex items-center justify-center font-black transition-all disabled:opacity-30 active:scale-90"
                  style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', color: B.purple }}
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

          </div>

          {/* All sets summary */}
          {sets.length > 1 && (
            <div className="px-5 pb-4">
              <div className="rounded-xl px-4 py-2 flex justify-between text-xs font-bold" style={{ background: 'rgba(255,255,255,0.04)' }}>
                {sets.map((s, i) => (
                  <span key={i} style={{ color: 'rgba(255,255,255,0.5)' }}>
                    S{i + 1}:{' '}
                    <span style={{ color: s.winner === 1 ? B.green : s.winner === 2 ? B.purple : 'white' }}>{s.p1}</span>
                    –
                    <span style={{ color: s.winner === 2 ? B.purple : s.winner === 1 ? B.green : 'white' }}>{s.p2}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Declare winner manually */}
        {started && !matchOver && (
          <div className="space-y-2">
            <p className="text-xs font-bold text-center mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Declare winner manually
            </p>
            {showConfirm ? (
              <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)' }}>
                <p className="text-sm font-bold text-white mb-3">
                  Confirm:{' '}
                  <span style={{ color: B.amber }}>{showConfirm === 1 ? teamA : teamB}</span> wins?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirm(null)}
                    className="flex-1 py-2 rounded-xl text-sm font-bold"
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => endManual(showConfirm)}
                    className="flex-1 py-2 rounded-xl text-sm font-black flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg,#f59e0b,#fbbf24)', color: '#07071a' }}
                  >
                    <Check className="w-4 h-4" /> Confirm
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(1)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-black truncate"
                  style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)', color: B.green }}
                >
                  🏆 {teamA}
                </button>
                <button
                  onClick={() => setShowConfirm(2)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-black truncate"
                  style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.25)', color: B.purple }}
                >
                  🏆 {teamB}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

/* ─── Main ──────────────────────────────────────────────────────────────────── */
export default function QuickMatchPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState('type');   // 'type' | 'setup' | 'score'
  const [type, setType] = useState(null);
  const [config, setConfig] = useState(null); // { teamA, teamB, pts, numSets }

  const reset = () => {
    setStep('type');
    setType(null);
    setConfig(null);
  };

  if (step === 'type') return (
    <div style={{ background: B.bg, minHeight: '100vh' }}>
      <div className="px-4 pt-5 max-w-sm mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm font-bold mb-2"
          style={{ color: 'rgba(255,255,255,0.5)' }}
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>
      <StepType onSelect={t => { setType(t); setStep('setup'); }} />
    </div>
  );

  if (step === 'setup') return (
    <StepSetup
      type={type}
      onBack={() => setStep('type')}
      onStart={cfg => { setConfig(cfg); setStep('score'); }}
    />
  );

  if (step === 'score' && config) return (
    <StepScore config={config} onReset={reset} />
  );

  return null;
}
