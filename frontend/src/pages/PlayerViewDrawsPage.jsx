import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tournamentAPI } from '../api/tournament';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import {
  ArrowLeft,
  GitBranch,
  Users,
  Trophy,
  AlertTriangle,
  X,
  Layers,
  Eye,
  Lock,
  RefreshCw
} from 'lucide-react';

const PlayerViewDrawsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [tournament, setTournament] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [draw, setDraw] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Match details modal
  const [showMatchDetailsModal, setShowMatchDetailsModal] = useState(false);
  const [selectedMatchDetails, setSelectedMatchDetails] = useState(null);

  useEffect(() => {
    fetchTournamentData();
  }, [id]);

  useEffect(() => {
    if (selectedCategory) {
      fetchDraw(selectedCategory.id);
      
      // Set up polling to refresh draw data every 10 seconds
      const pollInterval = setInterval(() => {
        fetchDraw(selectedCategory.id);
      }, 10000); // 10 seconds

      // Cleanup interval on unmount or when category changes
      return () => clearInterval(pollInterval);
    }
  }, [selectedCategory]);

  const fetchTournamentData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await tournamentAPI.getTournament(id);
      setTournament(response.data);
      setCategories(response.data.categories || []);
      if (response.data.categories?.length > 0) {
        setSelectedCategory(response.data.categories[0]);
      }
    } catch (err) {
      console.error('Error fetching tournament:', err);
      setError('Failed to load tournament: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchDraw = async (categoryId) => {
    try {
      console.log(`🔍 Fetching draw for tournament ${id}, category ${categoryId}`);
      const response = await api.get(`/tournaments/${id}/categories/${categoryId}/draw`);
      console.log('✅ Draw response:', response.data);
      
      // Check if response has draw data
      if (response.data && response.data.success && response.data.draw) {
        setDraw(response.data.draw);
        console.log('✅ Draw set successfully:', response.data.draw);
      } else {
        console.warn('⚠️ Response missing draw data:', response.data);
        setDraw(null);
      }
    } catch (err) {
      console.error('❌ Error fetching draw:', err);
      console.error('Error response:', err.response);
      console.error('Error status:', err.response?.status);
      console.error('Error data:', err.response?.data);
      
      // Only set draw to null if it's truly not found
      if (err.response?.status === 404) {
        console.log('Draw not found (404)');
        setDraw(null);
      } else {
        // For other errors, show error message but don't hide existing draw
        console.error('Unexpected error fetching draw:', err);
        setError(`Failed to load draw: ${err.response?.data?.error || err.message}`);
      }
    }
  };

  const handleRefresh = async () => {
    if (!selectedCategory) return;
    setRefreshing(true);
    try {
      await fetchDraw(selectedCategory.id);
    } finally {
      setTimeout(() => setRefreshing(false), 500); // Show refresh animation briefly
    }
  };

  const onViewMatchDetails = (matchData, bracketMatch) => {
    // Normalize the score field - backend sends scoreJson, but we need it as score
    const normalizedMatchData = {
      ...matchData,
      score: matchData.scoreJson || matchData.score,
      bracketMatch
    };
    setSelectedMatchDetails(normalizedMatchData);
    setShowMatchDetailsModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading draws...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4 group"
          >
            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Tournament</span>
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg shadow-emerald-500/20">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">View Tournament Draws</h1>
                <p className="text-gray-400">{tournament?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-xl hover:bg-emerald-500/30 transition-all disabled:opacity-50"
                title="Refresh bracket data"
              >
                <RefreshCw className={`w-4 h-4 text-emerald-400 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="text-sm text-emerald-300 font-medium">Refresh</span>
              </button>
              {/* Read-only indicator */}
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                <Lock className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-blue-300 font-medium">View Only</span>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span className="text-red-300 font-medium">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {categories.length === 0 ? (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-12 text-center">
            <Trophy className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Categories</h3>
            <p className="text-gray-400">This tournament doesn't have any categories yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Category Selector & Fixtures - Compact Layout */}
            <div className="lg:col-span-1 space-y-4">
              {/* Categories Section - Compact */}
              <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-3 sticky top-4">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">Categories</h3>
                <div className="space-y-1.5">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                        selectedCategory?.id === category.id
                          ? 'bg-emerald-500/20 border border-emerald-500/50 text-white'
                          : 'bg-slate-700/30 border border-white/5 text-gray-300 hover:bg-slate-700/50'
                      }`}
                    >
                      <div className="font-medium text-sm">{category.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {category.registrationCount || 0} / {category.maxParticipants || '∞'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Fixtures Section */}
              {selectedCategory && draw && (
                <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-3">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">Fixtures</h3>
                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                    {(() => {
                      const rawData = draw.bracketJson || draw.bracket;
                      const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
                      const format = draw.format || data?.format;
                      
                      // Collect all matches based on format
                      let allMatches = [];
                      
                      if (format === 'ROUND_ROBIN' && data?.groups) {
                        data.groups.forEach((group, gi) => {
                          if (group.matches) {
                            group.matches.forEach(match => {
                              allMatches.push({
                                ...match,
                                groupName: `Group ${String.fromCharCode(65 + gi)}`
                              });
                            });
                          }
                        });
                      } else if (format === 'ROUND_ROBIN_KNOCKOUT') {
                        // Group stage matches
                        if (data?.groups) {
                          data.groups.forEach((group, gi) => {
                            if (group.matches) {
                              group.matches.forEach(match => {
                                allMatches.push({
                                  ...match,
                                  groupName: `Group ${String.fromCharCode(65 + gi)}`,
                                  stage: 'Group'
                                });
                              });
                            }
                          });
                        }
                        // Knockout stage matches
                        if (data?.knockout?.rounds) {
                          data.knockout.rounds.forEach((round, ri) => {
                            round.matches.forEach(match => {
                              const total = data.knockout.rounds.length;
                              const r = total - ri;
                              let roundName = `Round ${ri + 1}`;
                              if (r === 1) roundName = 'Final';
                              else if (r === 2) roundName = 'Semi Finals';
                              else if (r === 3) roundName = 'Quarter Finals';
                              
                              allMatches.push({
                                ...match,
                                roundName,
                                stage: 'Knockout'
                              });
                            });
                          });
                        }
                      } else if (data?.rounds) {
                        // Pure knockout
                        data.rounds.forEach((round, ri) => {
                          round.matches.forEach(match => {
                            const total = data.rounds.length;
                            const r = total - ri;
                            let roundName = `Round ${ri + 1}`;
                            if (r === 1) roundName = 'Final';
                            else if (r === 2) roundName = 'Semi Finals';
                            else if (r === 3) roundName = 'Quarter Finals';
                            
                            allMatches.push({
                              ...match,
                              roundName
                            });
                          });
                        });
                      }
                      
                      if (allMatches.length === 0) {
                        return (
                          <div className="text-center py-4">
                            <p className="text-gray-500 text-xs">No matches yet</p>
                          </div>
                        );
                      }
                      
                      return allMatches.map((match, idx) => {
                        const isCompleted = match.winner && (match.player1?.name !== 'TBD' && match.player2?.name !== 'TBD');
                        const player1Name = match.player1?.partnerName 
                          ? `${match.player1.name} & ${match.player1.partnerName}`
                          : match.player1?.name || 'TBD';
                        const player2Name = match.player2?.partnerName 
                          ? `${match.player2.name} & ${match.player2.partnerName}`
                          : match.player2?.name || 'TBD';
                        
                        return (
                          <div key={idx} className="bg-slate-900/50 border border-white/5 rounded-lg p-2 hover:border-white/10 transition-all">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-semibold text-gray-400">
                                #{match.matchNumber || idx + 1}
                              </span>
                              {match.stage && (
                                <span className={`text-xs px-1.5 py-0.5 rounded ${
                                  match.stage === 'Knockout' 
                                    ? 'bg-amber-500/20 text-amber-400' 
                                    : 'bg-purple-500/20 text-purple-400'
                                }`}>
                                  {match.stage}
                                </span>
                              )}
                              {isCompleted && (
                                <span className="text-xs px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">
                                  ✓
                                </span>
                              )}
                            </div>
                            {(match.groupName || match.roundName) && (
                              <p className="text-xs text-gray-500 mb-1.5">{match.groupName || match.roundName}</p>
                            )}
                            <div className="space-y-1">
                              <div className={`text-xs px-2 py-1 rounded ${
                                match.winner === 1 
                                  ? 'bg-emerald-500/20 text-emerald-300 font-semibold' 
                                  : 'bg-slate-700/30 text-gray-300'
                              }`}>
                                {player1Name}
                              </div>
                              <div className="text-center">
                                <span className="text-xs text-gray-500">vs</span>
                              </div>
                              <div className={`text-xs px-2 py-1 rounded ${
                                match.winner === 2 
                                  ? 'bg-emerald-500/20 text-emerald-300 font-semibold' 
                                  : 'bg-slate-700/30 text-gray-300'
                              }`}>
                                {player2Name}
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}
            </div>

            {/* Draw Display - Expanded width */}
            <div className="lg:col-span-4">
              {selectedCategory ? (
                <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-white/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-white">{selectedCategory.name}</h2>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {selectedCategory.registrationCount || 0} participants
                          </span>
                          <span className="flex items-center gap-1">
                            <Layers className="w-4 h-4" />
                            Max: {selectedCategory.maxParticipants || '∞'}
                          </span>
                        </div>
                      </div>
                      {/* Auto-refresh indicator */}
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                        <span className="text-xs text-emerald-300 font-medium">Auto-updating</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    {draw ? (
                      <DrawBracket draw={draw} onViewMatchDetails={onViewMatchDetails} />
                    ) : error ? (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <AlertTriangle className="w-10 h-10 text-red-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">Error Loading Draw</h3>
                        <p className="text-gray-400">{error}</p>
                        <button
                          onClick={() => fetchDraw(selectedCategory.id)}
                          className="mt-4 px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl hover:bg-blue-500/30 transition-all"
                        >
                          Try Again
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 bg-slate-700/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <GitBranch className="w-10 h-10 text-gray-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">Draw Not Generated Yet</h3>
                        <p className="text-gray-400">The tournament organizer hasn't created the draw for this category yet.</p>
                        <p className="text-gray-500 text-sm mt-2">Check back later or contact the organizer.</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-12 text-center">
                  <p className="text-gray-400">Select a category to view its draw</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Match Details Modal */}
      {showMatchDetailsModal && selectedMatchDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-blue-500/50 rounded-3xl p-8 max-w-3xl w-full shadow-2xl shadow-blue-500/20 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/50">
                  <span className="text-3xl">🏸</span>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white">Match Details</h2>
                  <p className="text-gray-400 text-sm mt-1">Match #{selectedMatchDetails.matchNumber}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowMatchDetailsModal(false);
                  setSelectedMatchDetails(null);
                }}
                className="w-12 h-12 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-all"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            {/* Match Score Card - Prominent Display */}
            <div className="bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border-2 border-purple-500/30 rounded-2xl p-8 mb-8">
              {/* Final Score Header */}
              <div className="text-center mb-8">
                <p className="text-purple-300 text-sm uppercase tracking-widest mb-3 font-semibold">Final Score</p>
                <div className="inline-flex items-center gap-4 px-8 py-4 bg-slate-900/60 rounded-2xl border border-purple-500/20">
                  <span className="text-7xl font-black text-white tracking-tight">
                    {selectedMatchDetails.score ? (() => {
                      try {
                        const scoreData = typeof selectedMatchDetails.score === 'string' 
                          ? JSON.parse(selectedMatchDetails.score) 
                          : selectedMatchDetails.score;
                        let p1SetsWon = 0;
                        let p2SetsWon = 0;
                        scoreData?.sets?.forEach((set) => {
                          if (set.winner === 1) p1SetsWon++;
                          if (set.winner === 2) p2SetsWon++;
                        });
                        return `${p1SetsWon}-${p2SetsWon}`;
                      } catch (e) {
                        console.error('Error parsing score:', e);
                        return 'N/A';
                      }
                    })() : 'N/A'}
                  </span>
                </div>
                <p className="text-gray-400 text-xs uppercase tracking-wider mt-3">Sets Won</p>
              </div>

              {/* Set-by-Set Breakdown */}
              <div className="text-center mb-6">
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-3">Set Breakdown</p>
                <div className="flex items-center justify-center gap-3">
                  {selectedMatchDetails.score ? (() => {
                    try {
                      const scoreData = typeof selectedMatchDetails.score === 'string' 
                        ? JSON.parse(selectedMatchDetails.score) 
                        : selectedMatchDetails.score;
                      
                      if (!scoreData?.sets || scoreData.sets.length === 0) {
                        return <span className="text-gray-400">No set data available</span>;
                      }
                      
                      return scoreData.sets.map((set, idx) => {
                        const p1Score = set.player1Score !== undefined ? set.player1Score : set.player1;
                        const p2Score = set.player2Score !== undefined ? set.player2Score : set.player2;
                        const isP1Winner = set.winner === 1;
                        return (
                          <div key={idx} className={`px-4 py-2 rounded-xl border-2 ${
                            isP1Winner 
                              ? 'border-blue-400/50 bg-blue-500/10' 
                              : 'border-emerald-400/50 bg-emerald-500/10'
                          }`}>
                            <span className="text-white font-bold text-lg">{p1Score}-{p2Score}</span>
                          </div>
                        );
                      });
                    } catch (e) {
                      console.error('Error parsing set breakdown:', e);
                      return <span className="text-gray-400">Error loading set data</span>;
                    }
                  })() : <span className="text-gray-400">No score data available</span>}
                </div>
              </div>

              {/* Players Score Breakdown */}
              <div className="grid grid-cols-2 gap-4">
                {/* Player 1 */}
                <div className={`p-6 rounded-xl border-2 transition-all ${
                  selectedMatchDetails.winnerId === selectedMatchDetails.bracketMatch.player1?.id
                    ? 'border-emerald-500/50 bg-emerald-500/10 shadow-lg shadow-emerald-500/20'
                    : 'border-white/10 bg-slate-800/50'
                }`}>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                      {selectedMatchDetails.winnerId === selectedMatchDetails.bracketMatch.player1?.id && (
                        <span className="text-3xl">👑</span>
                      )}
                      <span className={`text-xl font-bold ${
                        selectedMatchDetails.winnerId === selectedMatchDetails.bracketMatch.player1?.id
                          ? 'text-emerald-300'
                          : 'text-white'
                      }`}>
                        {selectedMatchDetails.bracketMatch.player1?.name}
                      </span>
                    </div>
                    {selectedMatchDetails.winnerId === selectedMatchDetails.bracketMatch.player1?.id && (
                      <div className="mb-3">
                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-bold uppercase tracking-wider">
                          Winner
                        </span>
                      </div>
                    )}
                    {selectedMatchDetails.score ? (
                      <div className="space-y-2">
                        <p className="text-xs text-gray-400 uppercase tracking-wider">Individual Scores</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {(() => {
                            try {
                              const scores = getDetailedSetScores(selectedMatchDetails.score, 1);
                              if (!scores) return <span className="text-gray-500 text-xs">No scores</span>;
                              return scores.split(', ').map((score, idx) => {
                                const [p1, p2] = score.split('-').map(Number);
                                const won = p1 > p2;
                                return (
                                  <span key={idx} className={`px-3 py-1.5 rounded-lg font-semibold text-sm ${
                                    won 
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                                      : 'bg-slate-700/50 text-gray-300 border border-slate-600/30'
                                  }`}>
                                    {score}
                                  </span>
                                );
                              });
                            } catch (e) {
                              console.error('Error displaying player 1 scores:', e);
                              return <span className="text-gray-500 text-xs">Error loading scores</span>;
                            }
                          })()}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Player 2 */}
                <div className={`p-6 rounded-xl border-2 transition-all ${
                  selectedMatchDetails.winnerId === selectedMatchDetails.bracketMatch.player2?.id
                    ? 'border-emerald-500/50 bg-emerald-500/10 shadow-lg shadow-emerald-500/20'
                    : 'border-white/10 bg-slate-800/50'
                }`}>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                      {selectedMatchDetails.winnerId === selectedMatchDetails.bracketMatch.player2?.id && (
                        <span className="text-3xl">👑</span>
                      )}
                      <span className={`text-xl font-bold ${
                        selectedMatchDetails.winnerId === selectedMatchDetails.bracketMatch.player2?.id
                          ? 'text-emerald-300'
                          : 'text-white'
                      }`}>
                        {selectedMatchDetails.bracketMatch.player2?.name}
                      </span>
                    </div>
                    {selectedMatchDetails.winnerId === selectedMatchDetails.bracketMatch.player2?.id && (
                      <div className="mb-3">
                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-bold uppercase tracking-wider">
                          Winner
                        </span>
                      </div>
                    )}
                    {selectedMatchDetails.score ? (
                      <div className="space-y-2">
                        <p className="text-xs text-gray-400 uppercase tracking-wider">Individual Scores</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {(() => {
                            try {
                              const scores = getDetailedSetScores(selectedMatchDetails.score, 2);
                              if (!scores) return <span className="text-gray-500 text-xs">No scores</span>;
                              return scores.split(', ').map((score, idx) => {
                                const [p2, p1] = score.split('-').map(Number);
                                const won = p2 > p1;
                                return (
                                  <span key={idx} className={`px-3 py-1.5 rounded-lg font-semibold text-sm ${
                                    won 
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                                      : 'bg-slate-700/50 text-gray-300 border border-slate-600/30'
                                  }`}>
                                    {score}
                                  </span>
                                );
                              });
                            } catch (e) {
                              console.error('Error displaying player 2 scores:', e);
                              return <span className="text-gray-500 text-xs">Error loading scores</span>;
                            }
                          })()}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            {/* Match Information Grid */}
            <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-6 mb-6">
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <span className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400">ℹ️</span>
                Match Information
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <p className="text-gray-400 text-xs uppercase tracking-wider">Status</p>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                    <p className="text-white font-semibold text-lg">Completed</p>
                  </div>
                </div>
                {selectedMatchDetails.courtNumber && (
                  <div className="space-y-2">
                    <p className="text-gray-400 text-xs uppercase tracking-wider">Court</p>
                    <p className="text-white font-semibold text-lg">Court {selectedMatchDetails.courtNumber}</p>
                  </div>
                )}
                {(selectedMatchDetails.startTime || selectedMatchDetails.startedAt) && (
                  <div className="space-y-2">
                    <p className="text-gray-400 text-xs uppercase tracking-wider">Started At</p>
                    <p className="text-white font-semibold text-sm">
                      {new Date(selectedMatchDetails.startTime || selectedMatchDetails.startedAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}
                {(selectedMatchDetails.endTime || selectedMatchDetails.completedAt) && (
                  <div className="space-y-2">
                    <p className="text-gray-400 text-xs uppercase tracking-wider">Ended At</p>
                    <p className="text-white font-semibold text-sm">
                      {new Date(selectedMatchDetails.endTime || selectedMatchDetails.completedAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}
                {(() => {
                  let durationSeconds = selectedMatchDetails.duration;
                  
                  if (!durationSeconds && selectedMatchDetails.score) {
                    try {
                      const scoreData = typeof selectedMatchDetails.score === 'string' 
                        ? JSON.parse(selectedMatchDetails.score) 
                        : selectedMatchDetails.score;
                      durationSeconds = scoreData?.timer?.totalDuration;
                    } catch (e) {
                      console.error('Error parsing score for duration:', e);
                    }
                  }
                  
                  if (!durationSeconds) {
                    const startTime = selectedMatchDetails.startTime || selectedMatchDetails.startedAt;
                    const endTime = selectedMatchDetails.endTime || selectedMatchDetails.completedAt;
                    if (startTime && endTime) {
                      durationSeconds = Math.floor((new Date(endTime) - new Date(startTime)) / 1000);
                    }
                  }
                  
                  if (durationSeconds) {
                    const hours = Math.floor(durationSeconds / 3600);
                    const minutes = Math.floor((durationSeconds % 3600) / 60);
                    const seconds = durationSeconds % 60;
                    
                    let durationText = '';
                    if (hours > 0) {
                      durationText = `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''} ${seconds} second${seconds !== 1 ? 's' : ''}`;
                    } else if (minutes > 0) {
                      durationText = `${minutes} minute${minutes !== 1 ? 's' : ''} ${seconds} second${seconds !== 1 ? 's' : ''}`;
                    } else {
                      durationText = `${seconds} second${seconds !== 1 ? 's' : ''}`;
                    }
                    
                    return (
                      <div className="space-y-2">
                        <p className="text-gray-400 text-xs uppercase tracking-wider">Duration</p>
                        <p className="text-white font-semibold text-base">
                          {durationText}
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => {
                setShowMatchDetailsModal(false);
                setSelectedMatchDetails(null);
              }}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold text-lg hover:shadow-lg hover:shadow-blue-500/30 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Draw Bracket Component (Read-only version)
const DrawBracket = ({ draw, onViewMatchDetails }) => {
  const rawData = draw.bracketJson || draw.bracket;
  const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
  const format = draw.format || data?.format;

  if (format === 'ROUND_ROBIN') {
    return <RoundRobinDraw data={data} onViewMatchDetails={onViewMatchDetails} />;
  }
  if (format === 'ROUND_ROBIN_KNOCKOUT') {
    return <GroupsKnockoutDraw data={data} onViewMatchDetails={onViewMatchDetails} />;
  }
  return <KnockoutBracket data={data} onViewMatchDetails={onViewMatchDetails} />;
};

// Knockout Bracket Component
const KnockoutBracket = ({ data, onViewMatchDetails }) => {
  if (!data?.rounds) return <p className="text-gray-400 text-center">No bracket data</p>;

  const getRoundName = (idx, total) => {
    const r = total - idx;
    if (r === 1) return 'Final';
    if (r === 2) return 'Semi Finals';
    if (r === 3) return 'Quarter Finals';
    return `Round ${idx + 1}`;
  };

  const getPlayerDisplay = (player) => {
    if (!player || !player.name || player.name === 'TBD') return 'TBD';
    if (player.partnerName) {
      return `${player.name} & ${player.partnerName}`;
    }
    return player.name;
  };

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-6 min-w-max p-4">
        {data.rounds.map((round, ri) => (
          <div key={ri} className="flex flex-col min-w-[260px]">
            {/* Round Header */}
            <div className="mb-6 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-xl">
                <Trophy className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-bold text-emerald-300 uppercase tracking-wider">
                  {getRoundName(ri, data.rounds.length)}
                </h4>
              </div>
            </div>
            
            {/* Matches */}
            <div 
              className="flex flex-col justify-around flex-1 gap-3" 
              style={{ paddingTop: ri > 0 ? `${Math.pow(2, ri) * 18}px` : 0 }}
            >
              {round.matches.map((match, mi) => {
                const isCompleted = match.winner && (match.player1?.name !== 'TBD' && match.player2?.name !== 'TBD');
                const player1Name = getPlayerDisplay(match.player1);
                const player2Name = getPlayerDisplay(match.player2);
                const isPlayer1Winner = match.winner === 1;
                const isPlayer2Winner = match.winner === 2;
                
                return (
                  <div 
                    key={mi} 
                    className="relative group" 
                    style={{ marginBottom: ri > 0 ? `${Math.pow(2, ri) * 36}px` : 0 }}
                  >
                    <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden shadow-lg hover:shadow-emerald-500/10 transition-all">
                      {/* Match Number Badge */}
                      <div className="bg-slate-700/50 px-3 py-1.5 border-b border-white/5">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Match #{match.matchNumber || mi + 1}
                        </span>
                      </div>
                      
                      {/* Players */}
                      <div className="p-2.5 space-y-1.5">
                        {/* Player 1 */}
                        <div className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                          isPlayer1Winner
                            ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 border-2 border-emerald-500/50 shadow-lg shadow-emerald-500/20' 
                            : 'bg-slate-700/30 border border-white/5'
                        }`}>
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {isPlayer1Winner && (
                              <Trophy className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                            )}
                            <span className={`text-sm font-medium truncate ${
                              isPlayer1Winner ? 'text-emerald-300' : player1Name === 'TBD' ? 'text-gray-500 italic' : 'text-white'
                            }`}>
                              {player1Name}
                            </span>
                          </div>
                          {isPlayer1Winner && (
                            <span className="ml-2 px-1.5 py-0.5 bg-emerald-500/30 text-emerald-300 rounded text-xs font-bold">
                              W
                            </span>
                          )}
                        </div>
                        
                        {/* VS Divider */}
                        <div className="flex items-center justify-center py-0.5">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">vs</span>
                        </div>
                        
                        {/* Player 2 */}
                        <div className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                          isPlayer2Winner
                            ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 border-2 border-emerald-500/50 shadow-lg shadow-emerald-500/20' 
                            : 'bg-slate-700/30 border border-white/5'
                        }`}>
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {isPlayer2Winner && (
                              <Trophy className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                            )}
                            <span className={`text-sm font-medium truncate ${
                              isPlayer2Winner ? 'text-emerald-300' : player2Name === 'TBD' ? 'text-gray-500 italic' : 'text-white'
                            }`}>
                              {player2Name}
                            </span>
                          </div>
                          {isPlayer2Winner && (
                            <span className="ml-2 px-1.5 py-0.5 bg-emerald-500/30 text-emerald-300 rounded text-xs font-bold">
                              W
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* View Details Button for Completed Matches */}
                      {isCompleted && match.dbMatch && onViewMatchDetails && (
                        <div className="px-2.5 pb-2.5">
                          <button
                            onClick={() => {
                              const bracketMatchData = {
                                matchNumber: match.matchNumber,
                                round: ri + 1,
                                player1: match.player1,
                                player2: match.player2
                              };
                              onViewMatchDetails(match.dbMatch, bracketMatchData);
                            }}
                            className="w-full py-1.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-all text-xs font-semibold flex items-center justify-center gap-1.5 group-hover:border-blue-500/50"
                          >
                            <Eye className="w-3 h-3" />
                            View Details
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Round Robin Draw Component
const RoundRobinDraw = ({ data, onViewMatchDetails }) => {
  if (!data?.groups) return <p className="text-gray-400 text-center">No group data</p>;

  // Helper function to calculate total points scored by a player across all matches
  const calculateTotalPointsScored = (playerId, groupMatches) => {
    let totalPoints = 0;
    
    groupMatches.forEach(match => {
      // Handle both scoreJson and score fields for compatibility
      const scoreData = match.dbMatch?.scoreJson || match.dbMatch?.score;
      if (!scoreData) return;
      
      try {
        const parsedScore = typeof scoreData === 'string' ? JSON.parse(scoreData) : scoreData;
        
        if (!parsedScore?.sets || !Array.isArray(parsedScore.sets)) return;
        
        // Check if this player is in this match
        const isPlayer1 = match.player1?.id === playerId;
        const isPlayer2 = match.player2?.id === playerId;
        
        if (!isPlayer1 && !isPlayer2) return;
        
        // Sum up all points scored by this player in all sets
        parsedScore.sets.forEach(set => {
          const p1Score = set.player1Score !== undefined ? set.player1Score : set.player1;
          const p2Score = set.player2Score !== undefined ? set.player2Score : set.player2;
          
          if (isPlayer1 && p1Score !== undefined) {
            totalPoints += p1Score;
          } else if (isPlayer2 && p2Score !== undefined) {
            totalPoints += p2Score;
          }
        });
      } catch (error) {
        console.error('Error calculating points for player:', error);
      }
    });
    
    return totalPoints;
  };

  return (
    <div className="space-y-6">
      {data.groups.map((group, gi) => (
        <div key={gi} className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden shadow-lg">
          {/* Group Header */}
          <div className="bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border-b border-purple-500/30 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                <span className="text-xl font-bold text-white">{String.fromCharCode(65 + gi)}</span>
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">Group {String.fromCharCode(65 + gi)}</h4>
                <p className="text-xs text-purple-300">{group.participants?.length || 0} Players</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Standings Table */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <h5 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Standings</h5>
                </div>
                <div className="bg-slate-900/50 rounded-xl border border-white/5 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-800/50 border-b border-white/5">
                        <th className="text-left py-3 px-3 text-gray-400 font-semibold text-xs">#</th>
                        <th className="text-left py-3 px-3 text-gray-400 font-semibold text-xs">Player</th>
                        <th className="text-center py-3 px-2 text-gray-400 font-semibold text-xs">P</th>
                        <th className="text-center py-3 px-2 text-gray-400 font-semibold text-xs">W</th>
                        <th className="text-center py-3 px-2 text-gray-400 font-semibold text-xs">L</th>
                        <th className="text-center py-3 px-2 text-gray-400 font-semibold text-xs">TP</th>
                        <th className="text-center py-3 px-2 text-gray-400 font-semibold text-xs">Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.participants.map((p, pi) => {
                        const totalPointsScored = calculateTotalPointsScored(p.id, group.matches || []);
                        
                        return (
                          <tr key={pi} className="border-b border-white/5 hover:bg-slate-800/30 transition-colors">
                            <td className="py-3 px-3">
                              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-700/50 text-gray-400 text-xs font-semibold">
                                {pi + 1}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span className="text-white font-medium text-sm">{p.name || `Slot ${pi + 1}`}</span>
                            </td>
                            <td className="py-3 px-2 text-center">
                              <span className="text-gray-400 font-medium text-xs">{p.played || 0}</span>
                            </td>
                            <td className="py-3 px-2 text-center">
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs">
                                {p.wins || 0}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-center">
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-red-500/20 text-red-400 font-bold text-xs">
                                {p.losses || 0}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-center">
                              <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-lg bg-blue-500/20 text-blue-400 font-bold text-xs">
                                {totalPointsScored}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-center">
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 font-bold text-xs">
                                {p.points || 0}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {/* Legend */}
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-400">
                  <span><span className="font-semibold text-gray-300">P</span> = Played</span>
                  <span><span className="font-semibold text-gray-300">W</span> = Wins</span>
                  <span><span className="font-semibold text-gray-300">L</span> = Losses</span>
                  <span><span className="font-semibold text-blue-400">TP</span> = Total Points Scored</span>
                  <span><span className="font-semibold text-amber-400">Pts</span> = Ranking Points</span>
                </div>
              </div>

              {/* Matches */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <GitBranch className="w-4 h-4 text-blue-400" />
                  <h5 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Matches</h5>
                </div>
                {group.matches && group.matches.length > 0 ? (
                  <div className="space-y-3">
                    {group.matches.map((match, mi) => {
                      const isCompleted = match.winner && (match.player1?.name !== 'TBD' && match.player2?.name !== 'TBD');
                      const isPlayer1Winner = match.winner === 1;
                      const isPlayer2Winner = match.winner === 2;
                      
                      return (
                        <div key={mi} className="bg-slate-900/50 border border-white/5 rounded-xl overflow-hidden hover:border-white/10 transition-all group">
                          {/* Match Header */}
                          <div className="bg-slate-800/50 px-3 py-2 border-b border-white/5 flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                              Match #{match.matchNumber || mi + 1}
                            </span>
                            {isCompleted && (
                              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-xs font-bold">
                                Completed
                              </span>
                            )}
                          </div>
                          
                          {/* Players */}
                          <div className="p-3 space-y-2">
                            {/* Player 1 */}
                            <div className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                              isPlayer1Winner
                                ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 border-2 border-emerald-500/50' 
                                : 'bg-slate-800/30 border border-white/5'
                            }`}>
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                {isPlayer1Winner && (
                                  <Trophy className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                                )}
                                <span className={`text-sm font-medium truncate ${
                                  isPlayer1Winner ? 'text-emerald-300' : 'text-white'
                                }`}>
                                  {match.player1?.name || 'TBD'}
                                </span>
                              </div>
                              {isPlayer1Winner && (
                                <span className="ml-2 px-1.5 py-0.5 bg-emerald-500/30 text-emerald-300 rounded text-xs font-bold">
                                  W
                                </span>
                              )}
                            </div>
                            
                            {/* VS Divider */}
                            <div className="flex items-center justify-center py-0.5">
                              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">vs</span>
                            </div>
                            
                            {/* Player 2 */}
                            <div className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                              isPlayer2Winner
                                ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 border-2 border-emerald-500/50' 
                                : 'bg-slate-800/30 border border-white/5'
                            }`}>
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                {isPlayer2Winner && (
                                  <Trophy className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                                )}
                                <span className={`text-sm font-medium truncate ${
                                  isPlayer2Winner ? 'text-emerald-300' : 'text-white'
                                }`}>
                                  {match.player2?.name || 'TBD'}
                                </span>
                              </div>
                              {isPlayer2Winner && (
                                <span className="ml-2 px-1.5 py-0.5 bg-emerald-500/30 text-emerald-300 rounded text-xs font-bold">
                                  W
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* View Details Button */}
                          {isCompleted && match.dbMatch && onViewMatchDetails && (
                            <div className="px-3 pb-3">
                              <button
                                onClick={() => {
                                  const bracketMatchData = {
                                    matchNumber: match.matchNumber,
                                    groupName: group.groupName,
                                    player1: match.player1,
                                    player2: match.player2
                                  };
                                  onViewMatchDetails(match.dbMatch, bracketMatchData);
                                }}
                                className="w-full py-1.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-all text-xs font-semibold flex items-center justify-center gap-1.5 group-hover:border-blue-500/50"
                              >
                                <Eye className="w-3 h-3" />
                                View Details
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-slate-900/50 border border-white/5 rounded-xl p-8 text-center">
                    <GitBranch className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No matches scheduled</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Groups + Knockout Draw Component
const GroupsKnockoutDraw = ({ data, onViewMatchDetails }) => {
  return (
    <div className="space-y-8">
      {/* Group Stage */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-lg text-sm">Stage 1</span>
          Group Stage (Round Robin)
        </h3>
        <RoundRobinDraw data={data} onViewMatchDetails={onViewMatchDetails} />
      </div>

      {/* Knockout Stage */}
      {data.knockout && (
        <div>
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-lg text-sm">Stage 2</span>
            Knockout Stage
          </h3>
          <KnockoutBracket data={data.knockout} onViewMatchDetails={onViewMatchDetails} />
        </div>
      )}
    </div>
  );
};

// Helper function to get detailed set-by-set scores for display
const getDetailedSetScores = (scoreData, playerNumber) => {
  if (!scoreData) return '';
  
  try {
    // Parse if it's a JSON string
    let parsedScore = scoreData;
    if (typeof scoreData === 'string') {
      parsedScore = JSON.parse(scoreData);
    }
    
    // Check if it has sets array
    if (!parsedScore || !parsedScore.sets || !Array.isArray(parsedScore.sets)) {
      console.log('❌ No sets array found in score data:', parsedScore);
      return '';
    }
    
    const setScores = [];
    
    parsedScore.sets.forEach((set, index) => {
      // Handle both formats: {player1Score, player2Score} and {player1, player2}
      const p1Score = set.player1Score !== undefined ? set.player1Score : set.player1;
      const p2Score = set.player2Score !== undefined ? set.player2Score : set.player2;
      
      if (p1Score !== undefined && p2Score !== undefined) {
        // Show both players' scores in format: 21-19, 18-21, 21-16
        if (playerNumber === 1) {
          setScores.push(`${p1Score}-${p2Score}`);
        } else {
          setScores.push(`${p2Score}-${p1Score}`);
        }
      }
    });
    
    return setScores.join(', ');
  } catch (error) {
    console.error('Error parsing score data:', error);
    return '';
  }
};

export default PlayerViewDrawsPage;
