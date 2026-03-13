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
    if (rank <= 10) return 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md';
    return 'bg-slate-700 text-gray-300 border border-slate-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-400 mt-4 font-medium">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <Trophy className="w-12 h-12 text-yellow-400" />
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-purple-400 to-pink-400">
              Leaderboard
            </h1>
            <Trophy className="w-12 h-12 text-yellow-400" />
          </div>
          <p className="text-gray-400 text-lg">Top players ranked by tournament points</p>
          
          {/* Geographical Filter Tabs - All Always Enabled */}
          <div className="mt-8 flex justify-center gap-4">
            <button
              onClick={() => setScope('city')}
              className={`px-6 py-3 rounded-xl font-bold transition-all ${
                scope === 'city'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-slate-700/50 text-gray-300 hover:bg-slate-700'
              }`}
            >
              🏙️ City {userCity && `(${userCity})`}
            </button>
            <button
              onClick={() => setScope('state')}
              className={`px-6 py-3 rounded-xl font-bold transition-all ${
                scope === 'state'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-slate-700/50 text-gray-300 hover:bg-slate-700'
              }`}
            >
              🗺️ State {userState && `(${userState})`}
            </button>
            <button
              onClick={() => setScope('country')}
              className={`px-6 py-3 rounded-xl font-bold transition-all ${
                scope === 'country'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-slate-700/50 text-gray-300 hover:bg-slate-700'
              }`}
            >
              🇮🇳 Country (India)
            </button>
          </div>
          
          {/* Current Scope Display */}
          <div className="mt-4">
            <p className="text-gray-400 text-sm">
              Showing rankings for: <span className="text-purple-400 font-bold">{getScopeLabel()}</span>
            </p>
          </div>
        </div>

        {/* My Rank Card */}
        {myRanks && (
          <div className="mb-8 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  {myRanks.profilePhoto ? (
                    <img src={myRanks.profilePhoto} alt={myRanks.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-white">{myRanks.name?.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <p className="text-sm text-purple-300 font-semibold">Your Ranks</p>
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
                    <div className="px-3 py-1 bg-slate-700/50 rounded-lg">
                      <p className="text-xs text-gray-400">City</p>
                      <p className="text-sm font-bold text-white">#{myRanks.ranks.city}</p>
                    </div>
                  )}
                  {myRanks.ranks.state && (
                    <div className="px-3 py-1 bg-slate-700/50 rounded-lg">
                      <p className="text-xs text-gray-400">State</p>
                      <p className="text-sm font-bold text-white">#{myRanks.ranks.state}</p>
                    </div>
                  )}
                  <div className="px-3 py-1 bg-slate-700/50 rounded-lg">
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
          <div className="mb-12 grid grid-cols-3 gap-4 max-w-4xl mx-auto">
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
        <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-700/50 border-b border-white/10">
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-300">Rank</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-300">Player</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-300">Points</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-300">Tournaments</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-300">Matches</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-300">Win Rate</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((player, index) => (
                  <tr
                    key={player.id}
                    className={`border-b border-white/5 hover:bg-slate-700/30 transition-colors cursor-pointer ${
                      myRanks?.id === player.id ? 'bg-purple-500/10' : ''
                    }`}
                    onClick={() => navigate(`/profile/${player.id}`)}
                  >
                    {/* Rank */}
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold min-w-[80px] ${getRankBadge(player.rank)}`}>
                        {getRankIcon(player.rank)}
                      </div>
                    </td>

                    {/* Player */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                          {player.profilePhoto ? (
                            <img src={player.profilePhoto} alt={player.name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <span className="text-lg font-bold text-white">{player.name?.charAt(0)}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-white">{player.name}</p>
                          {player.city && player.state && (
                            <p className="text-sm text-gray-400">{player.city}, {player.state}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Points */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Star className="w-5 h-5 text-yellow-400" />
                        <span className="text-2xl font-black text-yellow-400">{player.totalPoints}</span>
                      </div>
                    </td>

                    {/* Tournaments */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Trophy className="w-4 h-4 text-purple-400" />
                        <span className="text-white font-semibold">{player.tournamentsPlayed}</span>
                      </div>
                    </td>

                    {/* Matches */}
                    <td className="px-6 py-4 text-center">
                      <div className="text-white font-semibold">
                        <span className="text-green-400">{player.matchesWon}W</span>
                        <span className="text-gray-500 mx-1">-</span>
                        <span className="text-red-400">{player.matchesLost}L</span>
                      </div>
                    </td>

                    {/* Win Rate */}
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-700/50 rounded-lg">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        <span className="text-white font-bold">{player.winRate}%</span>
                      </div>
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
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all"
            >
              Load More Players
            </button>
          </div>
        )}

        {/* Points Info */}
        <div className="mt-12 bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Award className="w-6 h-6 text-yellow-400" />
            How Points Are Earned
          </h3>
          <div className="grid md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-slate-700/30 rounded-xl">
              <Crown className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-yellow-400">10</p>
              <p className="text-sm text-gray-400">Winner</p>
            </div>
            <div className="text-center p-4 bg-slate-700/30 rounded-xl">
              <Medal className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-300">8</p>
              <p className="text-sm text-gray-400">Runner-up</p>
            </div>
            <div className="text-center p-4 bg-slate-700/30 rounded-xl">
              <Medal className="w-8 h-8 text-amber-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-amber-600">6</p>
              <p className="text-sm text-gray-400">Semi-finalist</p>
            </div>
            <div className="text-center p-4 bg-slate-700/30 rounded-xl">
              <Award className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-400">4</p>
              <p className="text-sm text-gray-400">Quarter-finalist</p>
            </div>
            <div className="text-center p-4 bg-slate-700/30 rounded-xl">
              <Target className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-400">2</p>
              <p className="text-sm text-gray-400">Participation</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
