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

        {/* Header - MOBILE PERFECT */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 mb-2">
            <Trophy className="w-6 h-6 text-yellow-400" />
            <h1 className="text-2xl font-black text-emerald-400">Leaderboard</h1>
            <Trophy className="w-6 h-6 text-yellow-400" />
          </div>
          <p className="text-xs text-gray-400">Top players ranked by tournament points</p>

          {/* Geographical Filter Tabs - COMPACT */}
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {[
              { key: 'city', label: `🏙️ City${userCity ? ` (${userCity})` : ''}` },
              { key: 'state', label: `🗺️ State${userState ? ` (${userState})` : ''}` },
              { key: 'country', label: '🇮🇳 Country' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setScope(key)}
                className="px-3 py-2 rounded-xl font-bold transition-all text-xs"
                style={scope === key
                  ? { background: 'linear-gradient(135deg,#10b981,#059669)', color: '#ffffff', boxShadow: '0 0 12px rgba(16,185,129,0.3)' }
                  : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.08)' }
                }
              >{label}</button>
            ))}
          </div>

          <div className="mt-2">
            <p className="text-xs text-gray-400">
              Showing: <span className="font-bold text-emerald-400">{getScopeLabel()}</span>
            </p>
          </div>
        </div>

        {/* My Rank Card - COMPACT */}
        {myRanks && (
          <div className="mb-4 rounded-xl p-3 border" style={{ background: 'rgba(13,26,42,0.6)', borderColor: 'rgba(0,255,136,0.15)', backdropFilter: 'blur(10px)' }}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
                  {myRanks.profilePhoto ? (
                    <img src={myRanks.profilePhoto} alt={myRanks.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold text-white">{myRanks.name?.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-emerald-400">Your Ranks</p>
                  <h3 className="text-base font-bold text-white">{myRanks.name}</h3>
                  <p className="text-xs text-gray-400">
                    {myRanks.tournamentsPlayed} tournaments • {myRanks.matchesWon}W-{myRanks.matchesLost}L
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg ${getRankBadge(getCurrentRank())}`}>
                  {getRankIcon(getCurrentRank())}
                  <span className="text-lg font-bold">#{getCurrentRank()}</span>
                </div>
                <p className="text-xl font-black text-yellow-400 mt-1">{myRanks.totalPoints} pts</p>
              </div>
            </div>
          </div>
        )}

        {/* Top 3 Podium - MOBILE PERFECT */}
        {leaderboard.length >= 3 && (
          <div className="mb-4">
            <div className="flex items-end justify-center gap-2" style={{ height: '140px' }}>
              {/* 2nd Place */}
              <div className="flex flex-col items-center" style={{ width: '30%' }}>
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
                <p className="text-lg font-black text-emerald-400">{leaderboard[1].totalPoints}</p>
                <p className="text-xs text-gray-400">points</p>
              </div>

              {/* 1st Place */}
              <div className="flex flex-col items-center" style={{ width: '34%' }}>
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
                <p className="text-xs text-gray-400">points</p>
              </div>

              {/* 3rd Place */}
              <div className="flex flex-col items-center" style={{ width: '30%' }}>
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
                <p className="text-lg font-black text-emerald-400">{leaderboard[2].totalPoints}</p>
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
