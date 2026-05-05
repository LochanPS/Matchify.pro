import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Trophy, Medal, Award, TrendingUp, Users, Target, Zap, Crown, Star } from 'lucide-react';

export default function Leaderboard() {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [myRanks, setMyRanks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [limit, setLimit] = useState(100);
  const [scope, setScope] = useState('country'); // 'city', 'state', or 'country'
  const [userCity, setUserCity] = useState(null);
  const [userState, setUserState] = useState(null);

  useEffect(() => {
    fetchMyRanks();
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [limit, scope]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: limit.toString(),
        scope
      });
      
      if (scope === 'city' && userCity) {
        params.append('city', userCity);
      } else if (scope === 'state' && userState) {
        params.append('state', userState);
      }
      
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
    return 'bg-slate-700 text-gray-300 border border-slate-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#07071a' }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: 'rgba(0,255,136,0.3)', borderTopColor: 'transparent' }}></div>
          <p className="mt-4 font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#07071a' }}>
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-[0.03]" style={{ background: '#00ff88' }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-[0.02]" style={{ background: '#00d4ff' }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <Trophy className="w-8 h-8 sm:w-12 sm:h-12 text-yellow-400" />
            <h1 className="font-black" style={{ fontSize: 'clamp(1.8rem,8vw,3.5rem)', background: 'linear-gradient(135deg,#00ff88,#00d4ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Leaderboard
            </h1>
            <Trophy className="w-8 h-8 sm:w-12 sm:h-12 text-yellow-400" />
          </div>
          <p className="text-sm sm:text-base" style={{ color: 'rgba(255,255,255,0.5)' }}>Top players ranked by tournament points</p>

          {/* Geographical Filter Tabs */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {[
              { key: 'city', label: `🏙️ City${userCity ? ` (${userCity})` : ''}` },
              { key: 'state', label: `🗺️ State${userState ? ` (${userState})` : ''}` },
              { key: 'country', label: '🇮🇳 Country' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setScope(key)}
                className="px-4 sm:px-6 py-2.5 rounded-xl font-bold transition-all text-sm sm:text-base"
                style={scope === key
                  ? { background: 'linear-gradient(135deg,#00c853,#00ff88)', color: '#003320', boxShadow: '0 0 16px rgba(0,255,136,0.3)' }
                  : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.08)' }
                }
              >{label}</button>
            ))}
          </div>

          <div className="mt-3">
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Showing rankings for: <span className="font-bold" style={{ color: '#00ff88' }}>{getScopeLabel()}</span>
            </p>
          </div>
        </div>

        {/* My Rank Card */}
        {myRanks && (
          <div className="mb-8 rounded-2xl p-4 sm:p-6 border" style={{ background: 'rgba(13,26,42,0.6)', borderColor: 'rgba(0,255,136,0.15)', backdropFilter: 'blur(10px)' }}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#00ff88,#00d4ff)' }}>
                  {myRanks.profilePhoto ? (
                    <img src={myRanks.profilePhoto} alt={myRanks.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-white">{myRanks.name?.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#00ff88' }}>Your Ranks</p>
                  <h3 className="text-2xl font-bold text-white">{myRanks.name}</h3>
                  <p className="text-gray-400 text-sm">
                    {myRanks.tournamentsPlayed} tournaments • {myRanks.matchesWon}W-{myRanks.matchesLost}L
                  </p>
                </div>
              </div>
              <div className="text-right">
                {/* Current Scope Rank (Large) */}
                <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl ${getRankBadge(getCurrentRank())}`}>
                  {getRankIcon(getCurrentRank())}
                  <span className="text-2xl font-bold">#{getCurrentRank()}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">{scope === 'city' ? 'City' : scope === 'state' ? 'State' : 'Country'} Rank</p>
                
                <p className="text-3xl font-black text-yellow-400 mt-2">{myRanks.totalPoints} pts</p>
                <p className="text-sm text-gray-400">Win Rate: {myRanks.winRate}%</p>
                
                {/* All Ranks Summary */}
                <div className="mt-3 flex gap-2 justify-end">
                  {myRanks.ranks.city && (
                    <div className="px-3 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <p className="text-xs text-gray-400">City</p>
                      <p className="text-sm font-bold text-white">#{myRanks.ranks.city}</p>
                    </div>
                  )}
                  {myRanks.ranks.state && (
                    <div className="px-3 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <p className="text-xs text-gray-400">State</p>
                      <p className="text-sm font-bold text-white">#{myRanks.ranks.state}</p>
                    </div>
                  )}
                  <div className="px-3 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <p className="text-xs text-gray-400">Country</p>
                    <p className="text-sm font-bold text-white">#{myRanks.ranks.country}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top 3 Podium */}
        {leaderboard.length >= 3 && (
          <div className="mb-8 sm:mb-12 grid grid-cols-3 gap-2 sm:gap-4 max-w-4xl mx-auto">
            {/* 2nd Place */}
            <div className="mt-8">
              <div className="relative bg-gradient-to-br from-gray-300/20 to-gray-400/20 border border-gray-300/30 rounded-2xl p-6 text-center backdrop-blur-sm shadow-2xl shadow-gray-300/20">
                {/* Silver Halo Effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-gray-300 to-gray-400 opacity-20 blur-xl animate-pulse"></div>
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-gray-300 to-gray-400 opacity-30 blur-2xl"></div>
                
                <div className="relative z-10">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center ring-4 ring-gray-300/40 shadow-lg shadow-gray-300/50">
                    {leaderboard[1].profilePhoto ? (
                      <img src={leaderboard[1].profilePhoto} alt={leaderboard[1].name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-3xl font-bold text-gray-900">{leaderboard[1].name?.charAt(0)}</span>
                    )}
                  </div>
                  <Medal className="w-8 h-8 text-gray-300 mx-auto mb-2 drop-shadow-lg" />
                  <h3 className="text-xl font-bold text-white mb-1 drop-shadow-lg">{leaderboard[1].name}</h3>
                  <p className="text-3xl font-black text-gray-300 mb-2 drop-shadow-lg">{leaderboard[1].totalPoints}</p>
                  <p className="text-sm text-gray-400">points</p>
                </div>
              </div>
            </div>

            {/* 1st Place */}
            <div>
              <div className="relative bg-gradient-to-br from-yellow-400/20 to-amber-500/20 border border-yellow-400/30 rounded-2xl p-6 text-center backdrop-blur-sm shadow-2xl shadow-yellow-400/30">
                {/* Gold Halo Effect - Multiple Layers */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400 opacity-30 blur-2xl animate-pulse"></div>
                <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 opacity-20 blur-3xl"></div>
                <div className="absolute -inset-4 rounded-2xl bg-yellow-400 opacity-10 blur-[60px]"></div>
                
                <div className="relative z-10">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Crown className="w-12 h-12 text-yellow-400 animate-bounce drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]" />
                  </div>
                  <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center ring-4 ring-yellow-400/50 shadow-2xl shadow-yellow-400/60">
                    {leaderboard[0].profilePhoto ? (
                      <img src={leaderboard[0].profilePhoto} alt={leaderboard[0].name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-4xl font-bold text-white">{leaderboard[0].name?.charAt(0)}</span>
                    )}
                  </div>
                  <Trophy className="w-10 h-10 text-yellow-400 mx-auto mb-2 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]" />
                  <h3 className="text-2xl font-bold text-white mb-1 drop-shadow-lg">{leaderboard[0].name}</h3>
                  <p className="text-4xl font-black text-yellow-400 mb-2 drop-shadow-[0_0_15px_rgba(250,204,21,0.6)]">{leaderboard[0].totalPoints}</p>
                  <p className="text-sm text-gray-400">points</p>
                </div>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="mt-8">
              <div className="relative bg-gradient-to-br from-amber-600/20 to-orange-500/20 border border-amber-600/30 rounded-2xl p-6 text-center backdrop-blur-sm shadow-2xl shadow-amber-600/20">
                {/* Bronze Halo Effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-500 opacity-20 blur-xl animate-pulse"></div>
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-500 opacity-30 blur-2xl"></div>
                
                <div className="relative z-10">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-amber-600 to-orange-500 rounded-full flex items-center justify-center ring-4 ring-amber-600/40 shadow-lg shadow-amber-600/50">
                    {leaderboard[2].profilePhoto ? (
                      <img src={leaderboard[2].profilePhoto} alt={leaderboard[2].name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-3xl font-bold text-white">{leaderboard[2].name?.charAt(0)}</span>
                    )}
                  </div>
                  <Medal className="w-8 h-8 text-amber-600 mx-auto mb-2 drop-shadow-lg" />
                  <h3 className="text-xl font-bold text-white mb-1 drop-shadow-lg">{leaderboard[2].name}</h3>
                  <p className="text-3xl font-black text-amber-600 mb-2 drop-shadow-lg">{leaderboard[2].totalPoints}</p>
                  <p className="text-sm text-gray-400">points</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Full Leaderboard Table */}
        <div className="rounded-2xl overflow-hidden border" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ background: 'rgba(0,255,136,0.05)', borderColor: 'rgba(255,255,255,0.08)' }}>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>Rank</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>Player</th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>Pts</th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider hidden sm:table-cell" style={{ color: 'rgba(255,255,255,0.5)' }}>Played</th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider hidden sm:table-cell" style={{ color: 'rgba(255,255,255,0.5)' }}>W-L</th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>Win%</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((player) => (
                  <tr
                    key={player.id}
                    className="border-b transition-colors cursor-pointer"
                    style={{
                      borderColor: 'rgba(255,255,255,0.04)',
                      background: myRanks?.id === player.id ? 'rgba(0,255,136,0.06)' : 'transparent',
                    }}
                    onClick={() => navigate(`/profile/${player.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className={`inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg font-bold text-sm ${getRankBadge(player.rank)}`}>
                        {getRankIcon(player.rank)}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg,#00ff88,#00d4ff)' }}>
                          {player.profilePhoto ? (
                            <img src={player.profilePhoto} alt={player.name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <span className="text-sm font-bold" style={{ color: '#003320' }}>{player.name?.charAt(0)}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm">{player.name}</p>
                          {player.city && <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{player.city}</p>}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span className="text-lg font-black text-yellow-400">{player.totalPoints}</span>
                    </td>

                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      <span className="text-white font-semibold text-sm">{player.tournamentsPlayed}</span>
                    </td>

                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      <span className="text-sm font-semibold">
                        <span style={{ color: '#00ff88' }}>{player.matchesWon}W</span>
                        <span style={{ color: 'rgba(255,255,255,0.3)' }}> - </span>
                        <span style={{ color: '#ff5050' }}>{player.matchesLost}L</span>
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-bold" style={{ color: '#00d4ff' }}>{player.winRate}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Load More */}
        {leaderboard.length >= limit && (
          <div className="text-center mt-8">
            <button
              onClick={() => setLimit(limit + 50)}
              className="px-8 py-3 rounded-xl font-bold transition-all"
              style={{ background: 'linear-gradient(135deg,#00c853,#00ff88)', color: '#003320', boxShadow: '0 0 20px rgba(0,255,136,0.3)' }}
            >
              Load More Players
            </button>
          </div>
        )}

        {/* Points Info */}
        <div className="mt-10 rounded-2xl p-5 sm:p-6 border" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.08)' }}>
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-400" />
            How Points Are Earned
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {[
              { icon: <Crown className="w-7 h-7 text-yellow-400 mx-auto mb-1" />, pts: 10, label: 'Winner', color: '#fbbf24' },
              { icon: <Medal className="w-7 h-7 text-gray-300 mx-auto mb-1" />, pts: 8, label: 'Runner-up', color: '#d1d5db' },
              { icon: <Medal className="w-7 h-7 text-amber-600 mx-auto mb-1" />, pts: 6, label: 'Semi', color: '#d97706' },
              { icon: <Award className="w-7 h-7 mx-auto mb-1" style={{ color: '#00d4ff' }} />, pts: 4, label: 'Quarter', color: '#00d4ff' },
              { icon: <Target className="w-7 h-7 mx-auto mb-1" style={{ color: '#00ff88' }} />, pts: 2, label: 'Participant', color: '#00ff88' },
            ].map(({ icon, pts, label, color }) => (
              <div key={label} className="text-center p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                {icon}
                <p className="text-xl font-bold" style={{ color }}>{pts}</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
