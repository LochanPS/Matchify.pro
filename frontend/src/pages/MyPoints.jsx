import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyPoints } from '../api/points';
import PointsHistoryCard from '../components/PointsHistoryCard';
import { TrendingUp, Award, Trophy, Target, Crown, ArrowLeft, AlertTriangle } from 'lucide-react';

const B = {
  bg: '#07071a',
  card: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
  cardDark: '#0d1025',
  green: '#06b6d4',
  cyan: '#00d4ff',
  purple: '#a855f7',
  amber: '#fbbf24',
  sub: 'rgba(255,255,255,0.6)',
  dim: 'rgba(255,255,255,0.4)',
};

const MyPoints = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMyPoints();
  }, []);

  const fetchMyPoints = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getMyPoints();
      setData(result);
    } catch (err) {
      console.error('Failed to fetch points:', err);
      setError('Failed to load points data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: B.bg }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto"
            style={{ borderColor: 'rgba(6,182,212,0.3)', borderTopColor: B.green }} />
          <p className="mt-4 font-medium" style={{ color: B.sub }}>Loading your points...</p>
        </div>
      </div>
    );
  }

  const total_points = data?.total_points || 0;
  const rank = data?.rank || '-';
  const tournaments_played = data?.tournaments_played || 0;
  const logs = data?.logs || [];

  const stats = [
    { icon: <TrendingUp className="w-5 h-5" style={{ color: B.green }} />, label: 'Total Points', value: total_points.toFixed ? total_points.toFixed(1) : total_points, color: B.green, accent: 'rgba(6,182,212,0.1)' },
    { icon: <Trophy className="w-5 h-5" style={{ color: B.amber }} />, label: 'Global Rank', value: `#${rank}`, color: B.amber, accent: 'rgba(251,191,36,0.1)' },
    { icon: <Target className="w-5 h-5" style={{ color: B.cyan }} />, label: 'Tournaments', value: tournaments_played, color: B.cyan, accent: 'rgba(0,212,255,0.1)' },
    { icon: <Award className="w-5 h-5" style={{ color: B.purple }} />, label: 'Avg Points', value: tournaments_played > 0 ? (total_points / tournaments_played).toFixed(1) : '0.0', color: B.purple, accent: 'rgba(168,85,247,0.1)' },
  ];

  const pointsTable = [
    { label: 'Winner', pts: '+10', color: B.green, accentBg: 'rgba(6,182,212,0.08)' },
    { label: 'Runner-up', pts: '+8', color: B.cyan, accentBg: 'rgba(0,212,255,0.08)' },
    { label: 'Semi-finalist', pts: '+6', color: B.purple, accentBg: 'rgba(168,85,247,0.08)' },
    { label: 'Quarter-finalist', pts: '+4', color: B.amber, accentBg: 'rgba(251,191,36,0.08)' },
    { label: 'Participation', pts: '+2', color: 'rgba(255,255,255,0.55)', accentBg: 'rgba(255,255,255,0.04)' },
  ];

  return (
    <div className="min-h-screen" style={{ background: B.bg }}>
      {/* Background orbs */}
      <div className="fixed top-0 bottom-0 pointer-events-none overflow-hidden" style={{ left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "480px" }}>
        <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full blur-3xl opacity-[0.07]" style={{ background: B.green }} />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full blur-3xl opacity-[0.05]" style={{ background: B.purple }} />
      </div>

      <div className="relative max-w-lg mx-auto px-4 py-6">
        {/* Back */}
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 mb-6">
          <ArrowLeft className="w-5 h-5" style={{ color: B.green }} />
          <span className="text-sm font-semibold" style={{ color: B.sub }}>Back</span>
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ background: 'linear-gradient(135deg,#06b6d4,#00d4ff)', boxShadow: '0 0 20px rgba(6,182,212,0.25)' }}>
            <Award className="w-7 h-7" style={{ color: '#003320' }} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">My Points</h1>
            <p className="text-sm" style={{ color: B.sub }}>Track your tournament performance</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 flex items-center gap-2.5 px-4 py-3 rounded-xl border"
            style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)' }}>
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span className="text-sm text-red-300">{error}</span>
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {stats.map(({ icon, label, value, color, accent }) => (
            <div key={label} className="rounded-2xl p-4 border" style={{ background: B.card, borderColor: B.border }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: accent }}>
                {icon}
              </div>
              <p className="text-2xl font-black" style={{ color }}>{value}</p>
              <p className="text-xs mt-0.5" style={{ color: B.sub }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Points breakdown */}
        <div className="rounded-2xl border p-5 mb-5" style={{ background: B.card, borderColor: B.border }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(251,191,36,0.15)' }}>
              <Crown className="w-5 h-5 text-yellow-400" />
            </div>
            <h2 className="text-base font-bold text-white">Points Breakdown</h2>
          </div>

          {logs && logs.length > 0 ? (
            <div className="space-y-3">
              {logs.map((log) => (
                <PointsHistoryCard key={log.id} log={log} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Trophy className="w-10 h-10 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.2)' }} />
              <p className="font-semibold text-white mb-1">No points earned yet</p>
              <p className="text-sm" style={{ color: B.sub }}>Participate in tournaments to start earning points!</p>
            </div>
          )}
        </div>

        {/* How points work */}
        <div className="rounded-2xl border p-5" style={{ background: B.card, borderColor: B.border }}>
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <span>📊</span> How Matchify Points Work
          </h3>
          <div className="rounded-xl overflow-hidden border" style={{ borderColor: B.border }}>
            {pointsTable.map(({ label, pts, color, accentBg }, i) => (
              <div key={label} className={`flex items-center justify-between px-4 py-3 ${i < pointsTable.length - 1 ? 'border-b' : ''}`}
                style={{ borderColor: B.border }}>
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>{label}</span>
                <span className="text-sm font-black px-3 py-1 rounded-lg" style={{ color, background: accentBg }}>{pts} pts</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyPoints;
