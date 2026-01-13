import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Gavel, Trophy, AlertTriangle, Play, Loader, Swords, Clock, MapPin, Calendar, Target, Settings, Check } from 'lucide-react';

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
  const [courtNumber, setCourtNumber] = useState('');
  
  // Editable scoring config
  const [pointsPerSet, setPointsPerSet] = useState(21);
  const [maxSets, setMaxSets] = useState(3);
  const [extension, setExtension] = useState(true);
  const [showScoringEdit, setShowScoringEdit] = useState(false);

  useEffect(() => {
    fetchMatchDetails();
  }, [matchId]);

  const fetchMatchDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/matches/${matchId}`);
      setMatch(response.data.match);
      setCourtNumber(response.data.match?.courtNumber || '');
      
      // Parse and set initial scoring config from category
      const category = response.data.match?.category;
      if (category?.scoringFormat) {
        const config = parseScoringFormat(category.scoringFormat);
        setPointsPerSet(config.points);
        setMaxSets(config.sets);
        setExtension(!category.scoringFormat.toLowerCase().includes('noext'));
      }
      
      // If umpireId is provided, fetch umpire details
      if (umpireId) {
        try {
          const umpireResponse = await api.get(`/users/${umpireId}`);
          setUmpire(umpireResponse.data.user);
        } catch (err) {
          console.log('Could not fetch umpire details');
        }
      }
    } catch (err) {
      console.error('Error fetching match:', err);
      setError('Failed to load match details');
    } finally {
      setLoading(false);
    }
  };

  // Parse scoring format from category
  const parseScoringFormat = (scoringFormat) => {
    if (!scoringFormat) return { points: 21, sets: 3, setsToWin: 2 };
    
    // Try "NxM" format
    const nxmMatch = scoringFormat.match(/(\d+)x(\d+)/);
    if (nxmMatch) {
      const points = parseInt(nxmMatch[1]);
      const sets = parseInt(nxmMatch[2]);
      return { points, sets, setsToWin: Math.ceil(sets / 2) };
    }
    
    // Try "N games to M pts" format
    const gamesMatch = scoringFormat.match(/(\d+)\s*games?\s*to\s*(\d+)\s*pts?/i);
    if (gamesMatch) {
      const sets = parseInt(gamesMatch[1]);
      const points = parseInt(gamesMatch[2]);
      return { points, sets, setsToWin: Math.ceil(sets / 2) };
    }
    
    return { points: 21, sets: 3, setsToWin: 2 };
  };

  // Assign umpire, set court, and start conducting
  const handleStartMatch = async () => {
    if (!umpireId) return;
    
    setAssigning(true);
    try {
      // Assign umpire to match
      await api.put(`/matches/${matchId}/umpire`, { umpireId });
      
      // Set court number if provided
      if (courtNumber) {
        await api.put(`/matches/${matchId}/court`, { courtNumber });
      }
      
      // Save custom scoring config
      await api.put(`/matches/${matchId}/config`, {
        pointsPerSet,
        maxSets,
        setsToWin: Math.ceil(maxSets / 2),
        extension
      });
      
      // Navigate to scoring page
      navigate(`/match/${matchId}/score`);
    } catch (err) {
      console.error('Error starting match:', err);
      setError(err.response?.data?.error || 'Failed to start match');
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-400 mt-4 font-medium">Loading match details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/50 border border-red-500/30 rounded-2xl p-8 max-w-md w-full text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Error</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors"
          >
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

  // Get round name
  const getRoundName = () => {
    if (!match?.round) return '';
    if (match.round === 1) return 'FINAL';
    if (match.round === 2) return 'SEMI FINAL';
    if (match.round === 3) return 'QUARTER FINAL';
    return `ROUND ${match.round}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <div className="relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors group"
          >
            <ArrowLeftIcon className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Draw</span>
          </button>
        </div>
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* Tournament Badge */}
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-400 rounded-full text-sm font-semibold">
            <Trophy className="w-4 h-4" />
            {tournament?.name || 'Tournament'}
          </span>
          {category && (
            <p className="text-gray-500 text-sm mt-2">{category.name}</p>
          )}
        </div>

        {/* Match Title */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-3">
            <Swords className="w-8 h-8 text-emerald-400" />
            <h1 className="text-3xl font-bold text-white">Match {match?.matchNumber}</h1>
          </div>
          <p className="text-gray-400">Round {match?.round} • {match?.status === 'PENDING' ? 'Ready to Start' : match?.status}</p>
        </div>

        {/* Players Card */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-3xl p-8 mb-6 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>
          
          <div className="flex items-center justify-between gap-4">
            {/* Player 1 */}
            <div className="flex-1 text-center">
              <div className="relative inline-block mb-4">
                {player1?.profilePhoto ? (
                  <img src={player1.profilePhoto} alt={player1.name} className="w-28 h-28 rounded-2xl object-cover border-4 border-blue-500/30 shadow-2xl shadow-blue-500/20" />
                ) : (
                  <div className="w-28 h-28 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/30 border-4 border-blue-500/30">
                    <span className="text-4xl font-bold text-white">{player1?.name?.charAt(0)?.toUpperCase() || 'P1'}</span>
                  </div>
                )}
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg">1</div>
              </div>
              <h3 className="text-xl font-bold text-white mb-1">{player1?.name || 'Player 1'}</h3>
              <p className="text-gray-500 text-sm">{player1?.email || 'Awaiting player'}</p>
            </div>

            {/* VS Divider */}
            <div className="flex flex-col items-center px-4">
              <div className="w-20 h-20 bg-gradient-to-br from-slate-700 to-slate-800 rounded-full flex items-center justify-center border-2 border-white/10 shadow-xl">
                <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">VS</span>
              </div>
              <div className="mt-3 flex items-center gap-2 text-gray-500 text-xs">
                <Swords className="w-3 h-3" />
                <span>{getRoundName()}</span>
              </div>
            </div>

            {/* Player 2 */}
            <div className="flex-1 text-center">
              <div className="relative inline-block mb-4">
                {player2?.profilePhoto ? (
                  <img src={player2.profilePhoto} alt={player2.name} className="w-28 h-28 rounded-2xl object-cover border-4 border-purple-500/30 shadow-2xl shadow-purple-500/20" />
                ) : (
                  <div className="w-28 h-28 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/30 border-4 border-purple-500/30">
                    <span className="text-4xl font-bold text-white">{player2?.name?.charAt(0)?.toUpperCase() || 'P2'}</span>
                  </div>
                )}
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg">2</div>
              </div>
              <h3 className="text-xl font-bold text-white mb-1">{player2?.name || 'Player 2'}</h3>
              <p className="text-gray-500 text-sm">{player2?.email || 'Awaiting player'}</p>
            </div>
          </div>
        </div>

        {/* Umpire Card */}
        {umpire && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-emerald-500/20 rounded-2xl p-5 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Gavel className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">Match Official</p>
                <h3 className="text-lg font-bold text-white">{umpire.name}</h3>
              </div>
              <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-sm font-semibold flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                Ready
              </div>
            </div>
          </div>
        )}

        {/* Court Number Input */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-5 mb-6">
          <label className="block text-gray-400 text-sm font-semibold mb-3">
            <MapPin className="w-4 h-4 inline mr-2" />
            Court Number
          </label>
          <input
            type="text"
            value={courtNumber}
            onChange={(e) => setCourtNumber(e.target.value)}
            placeholder="Enter court number (e.g., Court 1, A1)"
            className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
        </div>

        {/* Scoring Configuration */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <label className="text-gray-400 text-sm font-semibold flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Match Scoring Format
            </label>
            <button
              onClick={() => setShowScoringEdit(!showScoringEdit)}
              className="text-emerald-400 text-sm font-semibold hover:text-emerald-300 transition-colors"
            >
              {showScoringEdit ? 'Done' : 'Edit'}
            </button>
          </div>

          {!showScoringEdit ? (
            // Display current config
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-700/30 border border-white/5 rounded-xl p-4 text-center">
                <Target className="w-5 h-5 text-amber-400 mx-auto mb-2" />
                <p className="text-gray-400 text-xs">Points per Set</p>
                <p className="text-white font-bold text-xl">{pointsPerSet}</p>
              </div>
              <div className="bg-slate-700/30 border border-white/5 rounded-xl p-4 text-center">
                <Clock className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                <p className="text-gray-400 text-xs">Sets</p>
                <p className="text-white font-bold text-xl">
                  {maxSets === 1 ? '1 Set' : `Best of ${maxSets}`}
                </p>
              </div>
              <div className="bg-slate-700/30 border border-white/5 rounded-xl p-4 text-center">
                <Calendar className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                <p className="text-gray-400 text-xs">Extension</p>
                <p className="text-white font-bold text-xl">{extension ? 'Yes' : 'No'}</p>
              </div>
            </div>
          ) : (
            // Edit scoring config
            <div className="space-y-5">
              {/* Points per Set */}
              <div>
                <label className="block text-gray-300 text-sm mb-2">Points per Set</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setPointsPerSet(Math.max(0, pointsPerSet - 1))}
                    className="w-12 h-12 bg-slate-700/50 border border-white/10 rounded-xl text-white text-xl font-bold hover:bg-slate-600/50 transition-colors flex items-center justify-center"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={pointsPerSet}
                    onChange={(e) => setPointsPerSet(parseInt(e.target.value) || 0)}
                    className="flex-1 px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white text-center text-xl font-bold focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    min="0"
                    max="100"
                    placeholder="Enter points"
                  />
                  <button
                    type="button"
                    onClick={() => setPointsPerSet(Math.min(100, pointsPerSet + 1))}
                    className="w-12 h-12 bg-slate-700/50 border border-white/10 rounded-xl text-white text-xl font-bold hover:bg-slate-600/50 transition-colors flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
                <p className="text-gray-500 text-xs mt-2">Enter any number of points (e.g., 11, 15, 21, 30)</p>
              </div>

              {/* Number of Sets */}
              <div>
                <label className="block text-gray-300 text-sm mb-2">Number of Sets</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMaxSets(Math.max(1, maxSets - 1))}
                    className="w-12 h-12 bg-slate-700/50 border border-white/10 rounded-xl text-white text-xl font-bold hover:bg-slate-600/50 transition-colors flex items-center justify-center"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={maxSets}
                    onChange={(e) => setMaxSets(parseInt(e.target.value) || 1)}
                    className="flex-1 px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white text-center text-xl font-bold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    min="1"
                    max="9"
                    placeholder="Enter sets"
                  />
                  <button
                    type="button"
                    onClick={() => setMaxSets(Math.min(9, maxSets + 1))}
                    className="w-12 h-12 bg-slate-700/50 border border-white/10 rounded-xl text-white text-xl font-bold hover:bg-slate-600/50 transition-colors flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
                <p className="text-gray-500 text-xs mt-2">
                  {maxSets === 1 ? 'Single set match' : `Best of ${maxSets} (first to win ${Math.ceil(maxSets / 2)} sets)`}
                </p>
              </div>

              {/* Extension (Deuce) */}
              <div>
                <label className="block text-gray-300 text-sm mb-2">Extension (Deuce)</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setExtension(true)}
                    className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                      extension
                        ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                        : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600/50'
                    }`}
                  >
                    {extension && <Check className="w-4 h-4" />}
                    Yes (Deuce at {pointsPerSet - 1}-{pointsPerSet - 1})
                  </button>
                  <button
                    onClick={() => setExtension(false)}
                    className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                      !extension
                        ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                        : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600/50'
                    }`}
                  >
                    {!extension && <Check className="w-4 h-4" />}
                    No (First to {pointsPerSet} wins)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Scoring Format Summary */}
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
          <p className="text-amber-300 text-sm text-center">
            <span className="font-semibold">Match Format:</span>{' '}
            {maxSets === 1 
              ? `Single set to ${pointsPerSet} points` 
              : `Best of ${maxSets} sets, ${pointsPerSet} points each`}
            {!extension && ' (no extension)'}
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={handleStartMatch}
          disabled={assigning || !player1 || !player2}
          className="w-full py-5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white rounded-2xl font-bold text-lg shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
          
          {assigning ? (
            <>
              <Loader className="w-6 h-6 animate-spin" />
              Starting Match...
            </>
          ) : (
            <>
              <Play className="w-6 h-6" />
              Start Conducting Match
            </>
          )}
        </button>

        {(!player1 || !player2) && (
          <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <p className="text-amber-300 text-sm">
              Both players must be assigned before conducting the match
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConductMatchPage;
