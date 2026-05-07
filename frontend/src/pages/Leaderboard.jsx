import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Trophy, Medal, Award, TrendingUp, Users, Target, Zap, Crown, Star, ArrowLeft } from 'lucide-react';

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
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-6 transition-all relative overflow-hidden group"
        >
          <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          />
          <ArrowLeft className="w-5 h-5 text-emerald-400 relative z-10" />
          <span className="text-sm font-semibold text-gray-300 relative z-10">Back</span>
        </button>

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

        {/* Top 3 Podium - Duolingo Style (Compact & Clean) */}
        {leaderboard.length >= 3 && (
          <div className="mb-6 max-w-4xl mx-auto">
            <div className="flex items-end justify-center gap-2 sm:gap-3" style={{ height: '180px' }}>
              {/* 2nd Place - Silver */}
              <div className="flex flex-col items-center" style={{ width: '30%' }}>
                <div className="relative">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center ring-2 ring-gray-300/50 shadow-lg mb-2">
                    {leaderboard[1].profilePhoto ? (
                      <img src={leaderboard[1].profilePhoto} alt={leaderboard[1].name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-xl font-bold text-white">{leaderboard[1].name?.charAt(0)}</span>
                    )}
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center shadow-md">
                    <Medal className="w-4 h-4 text-gray-700" />
                  </div>
                </div>
                <h3 className="text-sm font-bold text-white mb-1 truncate w-full text-center">{leaderboard[1].name.split(' ')[0]}</h3>
                <p className="text-2xl font-black text-emerald-400">{leaderboard[1].totalPoints}</p>
                <p className="text-xs text-gray-400">points</p>
              </div>

              {/* 1st Place - Gold (Taller) */}
              <div className="flex flex-col items-center" style={{ width: '34%' }}>
                <div className="relative mb-1">
                  <Crown className="w-7 h-7 sm:w-8 sm:h-8 text-yellow-400 mx-auto mb-1 drop-shadow-lg" />
                </div>
                <div className="relative">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center ring-3 ring-yellow-400/60 shadow-2xl shadow-yellow-400/40 mb-2">
                    {leaderboard[0].profilePhoto ? (
                      <img src={leaderboard[0].profilePhoto} alt={leaderboard[0].name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-white">{leaderboard[0].name?.charAt(0)}</span>
                    )}
                  </div>
                  <div className="absolute -top-1 -right-1 w-7 h-7 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                    <Trophy className="w-4 h-4 text-yellow-900" />
                  </div>
                </div>
                <h3 className="text-base font-bold text-white mb-1 truncate w-full text-center">{leaderboard[0].name.split(' ')[0]}</h3>
                <p className="text-3xl font-black text-yellow-400 drop-shadow-lg">{leaderboard[0].totalPoints}</p>
                <p className="text-xs text-gray-400">points</p>
              </div>

              {/* 3rd Place - Bronze */}
              <div className="flex flex-col items-center" style={{ width: '30%' }}>
                <div className="relative">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center ring-2 ring-orange-500/50 shadow-lg mb-2">
                    {leaderboard[2].profilePhoto ? (
                      <img src={leaderboard[2].profilePhoto} alt={leaderboard[2].name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-xl font-bold text-white">{leaderboard[2].name?.charAt(0)}</span>
                    )}
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center shadow-md">
                    <Medal className="w-4 h-4 text-orange-900" />
                  </div>
                </div>
                <h3 className="text-sm font-bold text-white mb-1 truncate w-full text-center">{leaderboard[2].name.split(' ')[0]}</h3>
                <p className="text-2xl font-black text-emerald-400">{leaderboard[2].totalPoints}</p>
                <p className="text-xs text-gray-400">points</p>
              </div>
            </div>
          </div>
        )}

        {/* Full Leaderboard Table - Duolingo Style (Clean & Readable) */}
        <div className="rounded-2xl overflow-hidden border" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ background: 'rgba(0,255,136,0.08)', borderColor: 'rgba(255,255,255,0.08)' }}>
                  <th className="px-3 sm:px-4 py-4 text-left text-sm font-bold uppercase tracking-wider text-emerald-400">Rank</th>
                  <th className="px-3 sm:px-4 py-4 text-left text-sm font-bold uppercase tracking-wider text-emerald-400">Player</th>
                  <th className="px-3 sm:px-4 py-4 text-center text-sm font-bold uppercase tracking-wider text-emerald-400">Points</th>
                  <th className="px-3 sm:px-4 py-4 text-center text-sm font-bold uppercase tracking-wider text-emerald-400 hidden sm:table-cell">Win%</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((player) => (
                  <tr
                    key={player.id}
                    className="border-b transition-all cursor-pointer hover:bg-white/5"
                    style={{
                      borderColor: 'rgba(255,255,255,0.04)',
                      background: myRanks?.id === player.id ? 'rgba(0,255,136,0.08)' : 'transparent',
                    }}
                    onClick={() => navigate(`/profile/${player.id}`)}
                  >
                    <td className="px-3 sm:px-4 py-4">
                      <div className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl font-bold text-sm ${getRankBadge(player.rank)}`}>
                        {getRankIcon(player.rank)}
                      </div>
                    </td>

                    <td className="px-3 sm:px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-emerald-400/30" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
                          {player.profilePhoto ? (
                            <img src={player.profilePhoto} alt={player.name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <span className="text-base font-bold text-white">{player.name?.charAt(0)}</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-white text-base truncate">{player.name}</p>
                          {player.city && <p className="text-xs text-gray-400 truncate">{player.city}</p>}
                        </div>
                      </div>
                    </td>

                    <td className="px-3 sm:px-4 py-4 text-center">
                      <span className="text-xl sm:text-2xl font-black text-emerald-400">{player.totalPoints}</span>
                    </td>

                    <td className="px-3 sm:px-4 py-4 text-center hidden sm:table-cell">
                      <span className="text-base font-bold text-cyan-400">{player.winRate}%</span>
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
