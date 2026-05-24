import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { Trophy, Medal, Award, Target, Crown, Star, ArrowLeft, MapPin, Globe, Building } from 'lucide-react';


const B = {
  bg: '#050810',
  card: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
  green: '#06b6d4',
  cyan: '#00d4ff',
  purple: '#a855f7',
  sub: 'rgba(255,255,255,0.6)',
  dim: 'rgba(255,255,255,0.45)',
};

export default function Leaderboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [myRanks, setMyRanks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [limit, setLimit] = useState(100);
  const [scope, setScope] = useState('country');
  const [userCity, setUserCity] = useState(null);
  const [userState, setUserState] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  useEffect(() => {
    if (user) fetchMyRanks();
  }, [user]);

  useEffect(() => {
    fetchLeaderboard();
  }, [limit, scope]);

  // Re-fetch when city/state loads (if tab already selected)
  useEffect(() => {
    if ((scope === 'city' && userCity) || (scope === 'state' && userState)) {
      fetchLeaderboard();
    }
  }, [userCity, userState]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ limit: limit.toString(), scope });
      if (scope === 'city' && userCity) params.append('city', userCity);
      else if (scope === 'state' && userState) params.append('state', userState);
      const response = await api.get(`/leaderboard?${params.toString()}`);
      setLeaderboard(response.data.leaderboard);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyRanks = async () => {
    try {
      const response = await api.get('/leaderboard/my-rank');
      setMyRanks(response.data.ranks);
      setUserCity(response.data.ranks.city);
      setUserState(response.data.ranks.state);
    } catch (err) {
      console.log('Not logged in or no rank yet');
    }
  };

  const getScopeLabel = () => {
    if (scope === 'city' && userCity) return userCity;
    if (scope === 'state' && userState) return userState;
    if (scope === 'city' || scope === 'state') return 'Login to see local rankings';
    return 'India';
  };

  const getCurrentRank = () => {
    if (!myRanks || !myRanks.ranks) return null;
    if (scope === 'city') return myRanks.ranks.city;
    if (scope === 'state') return myRanks.ranks.state;
    return myRanks.ranks.country;
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-100" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-orange-300" />;
    return <span className="text-sm font-bold">#{rank}</span>;
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-lg shadow-yellow-500/50';
    if (rank === 2) return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-lg shadow-gray-400/50';
    if (rank === 3) return 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/50';
    if (rank <= 10) return 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md';
    return 'text-gray-200 border border-gray-600 bg-slate-800';
  };

  const needsLogin = (scope === 'city' && !userCity) || (scope === 'state' && !userState);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
      background: '#050810',
      backgroundImage: 'url(/bg-galaxy.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center top',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
    }}>
        <div className="text-center">
          <div
            className="w-16 h-16 border-4 rounded-full animate-spin mx-auto"
            style={{ borderColor: 'rgba(6,182,212,0.3)', borderTopColor: 'transparent' }}
          />
          <p className="mt-4 font-medium" style={{ color: B.sub }}>Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen relative overflow-hidden" style={{
      background: '#050810',
      backgroundImage: 'url(/bg-galaxy.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center top',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
    }}>
      {/* Dark overlay */}
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'rgba(5,8,16,0.72)', zIndex: 0 }} />
      {/* Static blobs */}
      <div className="fixed pointer-events-none" style={{ top:'10%', right:'-10%', width:'320px', height:'320px', borderRadius:'50%', background:'radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 70%)', zIndex:0 }} />
      <div className="fixed pointer-events-none" style={{ bottom:'15%', left:'-8%', width:'280px', height:'280px', borderRadius:'50%', background:'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)', zIndex:0 }} />

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-6">
        {/* Back */}
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 mb-6">
          <ArrowLeft className="w-5 h-5" style={{ color: B.green }} />
          <span className="text-sm font-semibold" style={{ color: B.sub }}>Back</span>
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-2 mb-2">
            <Trophy className="w-6 h-6 text-yellow-400" style={{ filter: 'drop-shadow(0 0 8px rgba(251,191,36,0.6))' }} />
            <h1
              className="text-2xl font-black"
              style={{
                background: 'linear-gradient(135deg,#06b6d4,#00d4ff,#a855f7)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Leaderboard
            </h1>
            <Trophy className="w-6 h-6 text-yellow-400" style={{ filter: 'drop-shadow(0 0 8px rgba(251,191,36,0.6))' }} />
          </div>
          <p className="text-xs mb-4" style={{ color: B.sub }}>Top players ranked by tournament points</p>

          {/* Scope Tabs */}
          <div className="flex justify-center gap-2 mb-2">
            {[
              { key: 'city', label: '🏙️ City', sub: userCity, icon: <Building className="w-3 h-3" /> },
              { key: 'state', label: '🗺️ State', sub: userState, icon: <MapPin className="w-3 h-3" /> },
              { key: 'country', label: '🇮🇳 Country', sub: 'India', icon: <Globe className="w-3 h-3" /> },
            ].map(({ key, label, sub }) => (
              <button
                key={key}
                onClick={() => setScope(key)}
                className="px-3 py-2 rounded-xl font-bold text-xs transition-all flex-shrink-0"
                style={
                  scope === key
                    ? { background: 'linear-gradient(135deg,#06b6d4,#00d4ff)', color: '#fff', boxShadow: '0 0 14px rgba(6,182,212,0.25)' }
                    : { background: 'rgba(255,255,255,0.06)', color: B.sub, border: '1px solid rgba(255,255,255,0.1)' }
                }
              >
                {label}
                {sub && scope === key && (
                  <span className="block text-[10px] font-normal opacity-80 truncate max-w-[80px]">{sub}</span>
                )}
              </button>
            ))}
          </div>

          <p className="text-xs" style={{ color: B.dim }}>
            Showing:{' '}
            <span className="font-bold" style={{ color: B.green }}>{getScopeLabel()}</span>
          </p>
        </div>

        {/* My Rank */}
        {myRanks && (
          <div
            className="mb-4 rounded-xl p-3 border"
            style={{ background: 'rgba(6,182,212,0.05)', borderColor: 'rgba(6,182,212,0.15)' }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#06b6d4,#00d4ff)' }}
                >
                  {myRanks.profilePhoto ? (
                    <img src={myRanks.profilePhoto} alt={myRanks.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold text-white">{myRanks.name?.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold" style={{ color: B.green }}>Your Rank</p>
                  <h3 className="text-base font-bold text-white">{myRanks.name}</h3>
                  <p className="text-xs" style={{ color: B.sub }}>
                    {myRanks.tournamentsPlayed} tournaments · {myRanks.matchesWon}W-{myRanks.matchesLost}L
                  </p>
                </div>
              </div>
              <div className="text-right">
                {getCurrentRank() && (
                  <div className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg ${getRankBadge(getCurrentRank())}`}>
                    {getRankIcon(getCurrentRank())}
                    <span className="text-lg font-bold">#{getCurrentRank()}</span>
                  </div>
                )}
                <p className="text-xl font-black text-yellow-400 mt-1">{myRanks.totalPoints} pts</p>
              </div>
            </div>
          </div>
        )}

        {/* Login nudge for city/state when not logged in */}
        {needsLogin && !loading && (
          <div
            className="mb-4 rounded-xl p-4 border text-center"
            style={{ background: 'rgba(255,255,255,0.03)', borderColor: B.border }}
          >
            <p className="text-sm font-semibold text-white mb-1">
              {scope === 'city' ? '🏙️ City Rankings' : '🗺️ State Rankings'}
            </p>
            <p className="text-xs" style={{ color: B.sub }}>
              Login with your profile to see rankings in your {scope}.
            </p>
          </div>
        )}

        {/* Podium — top 3 */}
        {!needsLogin && leaderboard.length >= 3 && (
          <div className="mb-5">
            <div className="flex items-end justify-center gap-3" style={{ height: '148px' }}>
              {/* 2nd */}
              <div className="flex flex-col items-center cursor-pointer" style={{ width: '30%' }} onClick={() => setSelectedPlayer(leaderboard[1])}>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center ring-2 ring-gray-300/50 shadow-lg mb-1 relative">
                  {leaderboard[1].profilePhoto ? (
                    <img src={leaderboard[1].profilePhoto} alt={leaderboard[1].name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-base font-bold text-white">{leaderboard[1].name?.charAt(0)}</span>
                  )}
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center">
                    <Medal className="w-3 h-3 text-gray-700" />
                  </div>
                </div>
                <h3 className="text-xs font-bold text-white mb-0.5 truncate w-full text-center">{leaderboard[1].name.split(' ')[0]}</h3>
                <p className="text-lg font-black" style={{ color: B.green }}>{leaderboard[1].totalPoints}</p>
                <p className="text-xs" style={{ color: B.sub }}>pts</p>
              </div>

              {/* 1st */}
              <div className="flex flex-col items-center cursor-pointer" style={{ width: '34%' }} onClick={() => setSelectedPlayer(leaderboard[0])}>
                <Crown className="w-6 h-6 text-yellow-400 mb-1" />
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center ring-2 ring-yellow-400/60 shadow-xl mb-1 relative">
                  {leaderboard[0].profilePhoto ? (
                    <img src={leaderboard[0].profilePhoto} alt={leaderboard[0].name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold text-white">{leaderboard[0].name?.charAt(0)}</span>
                  )}
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                    <Trophy className="w-3 h-3 text-yellow-900" />
                  </div>
                </div>
                <h3 className="text-sm font-bold text-white mb-0.5 truncate w-full text-center">{leaderboard[0].name.split(' ')[0]}</h3>
                <p className="text-2xl font-black text-yellow-400">{leaderboard[0].totalPoints}</p>
                <p className="text-xs" style={{ color: B.sub }}>pts</p>
              </div>

              {/* 3rd */}
              <div className="flex flex-col items-center cursor-pointer" style={{ width: '30%' }} onClick={() => setSelectedPlayer(leaderboard[2])}>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center ring-2 ring-orange-500/50 shadow-lg mb-1 relative">
                  {leaderboard[2].profilePhoto ? (
                    <img src={leaderboard[2].profilePhoto} alt={leaderboard[2].name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-base font-bold text-white">{leaderboard[2].name?.charAt(0)}</span>
                  )}
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                    <Medal className="w-3 h-3 text-orange-900" />
                  </div>
                </div>
                <h3 className="text-xs font-bold text-white mb-0.5 truncate w-full text-center">{leaderboard[2].name.split(' ')[0]}</h3>
                <p className="text-lg font-black" style={{ color: B.green }}>{leaderboard[2].totalPoints}</p>
                <p className="text-xs" style={{ color: B.sub }}>pts</p>
              </div>
            </div>
          </div>
        )}

        {/* Full table */}
        {needsLogin ? null : leaderboard.length === 0 ? (
          <div
            className="rounded-2xl p-8 border text-center"
            style={{ background: B.card, borderColor: B.border }}
          >
            <p className="font-semibold text-white mb-1">No players yet</p>
            <p className="text-sm" style={{ color: B.sub }}>No data for this region yet.</p>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden border" style={{ background: 'rgba(255,255,255,0.02)', borderColor: B.border }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ background: 'rgba(6,182,212,0.07)', borderColor: 'rgba(255,255,255,0.08)' }}>
                    <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: B.green }}>Rank</th>
                    <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: B.green }}>Player</th>
                    <th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider" style={{ color: B.green }}>Points</th>
                    <th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider hidden sm:table-cell" style={{ color: B.green }}>Win%</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((player) => (
                    <tr
                      key={player.id}
                      className="border-b transition-all cursor-pointer hover:bg-white/5"
                      style={{
                        borderColor: 'rgba(255,255,255,0.04)',
                        background: myRanks?.id === player.id ? 'rgba(6,182,212,0.07)' : 'transparent',
                      }}
                      onClick={() => setSelectedPlayer(player)}
                    >
                      <td className="px-3 py-3">
                        <div className={`inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl font-bold text-sm ${getRankBadge(player.rank)}`}>
                          {getRankIcon(player.rank)}
                        </div>
                      </td>

                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg,#06b6d4,#00d4ff)', boxShadow: '0 0 0 2px rgba(6,182,212,0.25)' }}
                          >
                            {player.profilePhoto ? (
                              <img src={player.profilePhoto} alt={player.name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <span className="text-sm font-bold text-white">{player.name?.charAt(0)}</span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-white text-sm truncate">{player.name}</p>
                            {player.city && (
                              <p className="text-xs truncate" style={{ color: B.sub }}>{player.city}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-3 text-center">
                        <span className="text-lg font-black" style={{ color: B.green }}>{player.totalPoints}</span>
                      </td>

                      <td className="px-3 py-3 text-center hidden sm:table-cell">
                        <span className="text-sm font-bold" style={{ color: B.cyan }}>{player.winRate}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Load More */}
        {!needsLogin && leaderboard.length >= limit && (
          <div className="text-center mt-6">
            <button
              onClick={() => setLimit(limit + 50)}
              className="px-8 py-3 rounded-xl font-bold transition-all"
              style={{ background: 'linear-gradient(135deg,#06b6d4,#00d4ff)', color: '#050810', boxShadow: '0 0 20px rgba(6,182,212,0.3)' }}
            >
              Load More Players
            </button>
          </div>
        )}

        {/* Points info */}
        <div
          className="mt-8 rounded-2xl p-5 border"
          style={{ background: B.card, borderColor: B.border }}
        >
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-400" />
            How Points Are Earned
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {[
              { icon: <Crown className="w-6 h-6 text-yellow-400 mx-auto mb-1" />, pts: 10, label: 'Winner', color: '#fbbf24' },
              { icon: <Medal className="w-6 h-6 text-gray-300 mx-auto mb-1" />, pts: 8, label: 'Runner-up', color: '#d1d5db' },
              { icon: <Medal className="w-6 h-6 text-amber-500 mx-auto mb-1" />, pts: 6, label: 'Semi', color: '#f59e0b' },
              { icon: <Award className="w-6 h-6 mx-auto mb-1" style={{ color: B.cyan }} />, pts: 4, label: 'Quarter', color: B.cyan },
              { icon: <Target className="w-6 h-6 mx-auto mb-1" style={{ color: B.green }} />, pts: 2, label: 'Played', color: B.green },
            ].map(({ icon, pts, label, color }) => (
              <div
                key={label}
                className="text-center p-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                {icon}
                <p className="text-lg font-bold" style={{ color }}>{pts}</p>
                <p className="text-xs mt-0.5" style={{ color: B.sub }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* ── Player Profile Modal ─────────────────────────────────────────────── */}
    {selectedPlayer && (
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(10px)' }}
        onClick={() => setSelectedPlayer(null)}
      >
        <div
          className="w-full max-w-sm rounded-3xl overflow-hidden"
          style={{
            background: 'linear-gradient(160deg, #0d1025 0%, #050810 100%)',
            border: '1px solid rgba(6,182,212,0.25)',
            boxShadow: '0 0 60px rgba(6,182,212,0.12)',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Green accent bar */}
          <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#06b6d4,#00d4ff)' }} />

          <div className="p-6">
            {/* Photo + name */}
            <div className="flex flex-col items-center mb-5">
              <div
                className="w-24 h-24 rounded-3xl overflow-hidden mb-3 flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg,#06b6d4,#00d4ff)',
                  boxShadow: '0 0 32px rgba(6,182,212,0.35)',
                  border: '2px solid rgba(6,182,212,0.4)',
                }}
              >
                {selectedPlayer.profilePhoto ? (
                  <img src={selectedPlayer.profilePhoto} alt={selectedPlayer.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-black text-white">{selectedPlayer.name?.charAt(0)}</span>
                )}
              </div>
              <h2 className="text-xl font-black text-white text-center">{selectedPlayer.name}</h2>
              {selectedPlayer.city && (
                <p className="text-sm mt-0.5 flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  <MapPin className="w-3 h-3" />{selectedPlayer.city}{selectedPlayer.state ? `, ${selectedPlayer.state}` : ''}
                </p>
              )}
              {/* Rank badge */}
              <div
                className="mt-2 px-3 py-1 rounded-full text-xs font-black"
                style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.35)', color: '#06b6d4' }}
              >
                #{selectedPlayer.rank} on Leaderboard
              </div>
            </div>

            {/* Info cards */}
            <div className="space-y-2.5 mb-5">
              {/* Matchify ID */}
              {selectedPlayer.matchifyCode && (
                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                  style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)' }}
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(0,212,255,0.15)' }}>
                    <Star className="w-4 h-4" style={{ color: B.cyan }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: 'rgba(0,212,255,0.6)' }}>Matchify ID</p>
                    <p className="text-sm font-black" style={{ color: B.cyan }}>{selectedPlayer.matchifyCode}</p>
                  </div>
                </div>
              )}

              {/* Contact — phone preferred, email fallback */}
              {(selectedPlayer.phone || selectedPlayer.email) && (
                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                  style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.15)' }}
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(6,182,212,0.12)' }}>
                    <Globe className="w-4 h-4" style={{ color: B.green }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: 'rgba(6,182,212,0.55)' }}>
                      {selectedPlayer.phone ? 'Phone' : 'Email'}
                    </p>
                    <p className="text-sm font-bold text-white truncate">
                      {selectedPlayer.phone
                        ? `+91 ${selectedPlayer.phone.replace(/^91/, '').replace(/(\d{5})(\d{5})/, '$1 $2')}`
                        : selectedPlayer.email}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-2 mb-5">
              {[
                { val: selectedPlayer.totalPoints ?? 0,       label: 'Points', color: '#fbbf24' },
                { val: selectedPlayer.tournamentsPlayed ?? 0, label: 'Played', color: B.cyan },
                { val: selectedPlayer.matchesWon ?? 0,        label: 'Won',    color: B.green },
                { val: selectedPlayer.matchesLost ?? 0,       label: 'Lost',   color: '#f87171' },
              ].map(({ val, label, color }) => (
                <div key={label} className="text-center py-2.5 rounded-2xl"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <p className="text-lg font-black" style={{ color }}>{val}</p>
                  <p className="text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</p>
                </div>
              ))}
            </div>

            {/* Close */}
            <button
              onClick={() => setSelectedPlayer(null)}
              className="w-full py-3 rounded-2xl font-black text-sm transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
