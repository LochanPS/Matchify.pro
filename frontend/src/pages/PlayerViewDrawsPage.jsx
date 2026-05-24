import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tournamentAPI } from '../api/tournament';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { getDrawCache, setDrawCache } from '../utils/drawCache';
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
  const [categoryMatches, setCategoryMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDraw, setLoadingDraw] = useState(false);
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

      // Poll every 60 seconds (draw doesn't change that often)
      const pollInterval = setInterval(() => {
        fetchDraw(selectedCategory.id, true); // silent refresh
      }, 60000);
      return () => clearInterval(pollInterval);
    }
  }, [selectedCategory]);

  const fetchTournamentData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await tournamentAPI.getTournament(id);
      setTournament(response.data);
      const cats = response.data.categories || [];
      setCategories(cats);
      if (cats.length > 0) {
        setSelectedCategory(cats[0]);
        // Fetch draw in parallel — don't wait for it to clear loading
        fetchDraw(cats[0].id);
      }
    } catch (err) {
      console.error('Error fetching tournament:', err);
      // Only show error on initial load; api.js auto-retries 5xx so if we reach
      // here it's a genuine failure — but keep it subtle and auto-dismissing.
      setError('Could not load tournament. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDraw = async (categoryId, silent = false) => {
    // Option A: show cached data instantly, fetch fresh in background
    const cached = getDrawCache(id, categoryId);
    if (cached) {
      setDraw(cached.draw ?? null);
      setCategoryMatches(cached.categoryMatches ?? []);
      setLoadingDraw(false);
      // Fall through — fetch fresh without showing spinner
    } else if (!silent) {
      setLoadingDraw(true);
    }

    try {
      const [drawResponse, matchesResponse] = await Promise.all([
        api.get(`/tournaments/${id}/categories/${categoryId}/draw`),
        api.get(`/tournaments/${id}/categories/${categoryId}/matches`).catch(() => ({ data: { matches: [] } }))
      ]);
      const freshDraw = (drawResponse.data?.success && drawResponse.data.draw)
        ? drawResponse.data.draw
        : null;
      const freshMatches = matchesResponse.data?.matches || [];
      setDraw(freshDraw);
      setCategoryMatches(freshMatches);
      // Save to cache on success
      setDrawCache(id, categoryId, { draw: freshDraw, categoryMatches: freshMatches });
    } catch (err) {
      if (err.response?.status === 404) {
        setDraw(null);
      } else if (cached) {
        // Cache is showing — suppress error silently
      } else if (!silent) {
        setError('Draw unavailable right now. Please try again shortly.');
      }
    } finally {
      if (!silent) setLoadingDraw(false);
    }
  };

  // Auto-dismiss connection errors after 6s — don't alarm the user
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 6000);
    return () => clearTimeout(t);
  }, [error]);

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
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050810' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4" style={{ borderColor: 'rgba(6,182,212,0.3)', borderTopColor: '#06b6d4' }}></div>
          <p className="text-gray-400">Loading draws...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#050810' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => navigate(`/tournaments/${id}`)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4 group"
          >
            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Tournament</span>
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl shadow-lg" style={{ background: 'linear-gradient(135deg,#06b6d4,#00d4ff)', boxShadow: '0 4px 24px rgba(6,182,212,0.2)' }}>
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
                className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all disabled:opacity-50"
                style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)' }}
                title="Refresh bracket data"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} style={{ color: '#06b6d4' }} />
                <span className="text-sm font-medium" style={{ color: '#06b6d4' }}>Refresh</span>
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
          <div className="mb-6 rounded-xl p-3 flex items-center gap-3" style={{ background: 'rgba(255,170,0,0.08)', border: '1px solid rgba(255,170,0,0.2)' }}>
            <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: '#ffaa00' }} />
            <span className="text-sm" style={{ color: '#ffcc66' }}>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto" style={{ color: 'rgba(255,255,255,0.35)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
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
                      className="w-full text-left px-3 py-2 rounded-lg transition-all"
                      style={selectedCategory?.id === category.id
                        ? { background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.4)', color: '#fff' }
                        : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)', color: '#d1d5db' }}
                    >
                      <div className="font-medium text-sm">{category.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {category.registrationCount || 0} / {category.maxParticipants || '∞'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Fixtures Section - Quick Navigation */}
              {selectedCategory && draw && (
                <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-3">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">Quick Navigation</h3>
                  <div className="space-y-1.5">
                    {(() => {
                      const rawData = draw.bracketJson || draw.bracket;
                      const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
                      const format = draw.format || data?.format;
                      
                      const navigationItems = [];
                      
                      if (format === 'ROUND_ROBIN' && data?.groups) {
                        // Show groups
                        data.groups.forEach((group, gi) => {
                          const groupName = `Group ${String.fromCharCode(65 + gi)}`;
                          const totalMatches = group.matches?.length || 0;
                          const completedMatches = group.matches?.filter(m => m.winner)?.length || 0;
                          
                          navigationItems.push({
                            id: `group-${gi}`,
                            label: groupName,
                            subtitle: `${completedMatches}/${totalMatches} matches`,
                            icon: '👥',
                            color: 'purple'
                          });
                        });
                      } else if (format === 'ROUND_ROBIN_KNOCKOUT') {
                        // Group stage
                        if (data?.groups) {
                          data.groups.forEach((group, gi) => {
                            const groupName = `Group ${String.fromCharCode(65 + gi)}`;
                            const totalMatches = group.matches?.length || 0;
                            const completedMatches = group.matches?.filter(m => m.winner)?.length || 0;
                            
                            navigationItems.push({
                              id: `group-${gi}`,
                              label: groupName,
                              subtitle: `${completedMatches}/${totalMatches} matches`,
                              icon: '👥',
                              color: 'purple'
                            });
                          });
                        }
                        
                        // Knockout stage
                        if (data?.knockout?.rounds) {
                          data.knockout.rounds.forEach((round, ri) => {
                            const total = data.knockout.rounds.length;
                            const r = total - ri;
                            let roundName = `Round ${ri + 1}`;
                            if (r === 1) roundName = 'Final';
                            else if (r === 2) roundName = 'Semi Finals';
                            else if (r === 3) roundName = 'Quarter Finals';
                            
                            const totalMatches = round.matches?.length || 0;
                            const completedMatches = round.matches?.filter(m => m.winner)?.length || 0;
                            
                            navigationItems.push({
                              id: `knockout-${ri}`,
                              label: roundName,
                              subtitle: `${completedMatches}/${totalMatches} matches`,
                              icon: '🏆',
                              color: 'amber'
                            });
                          });
                        }
                      } else if (data?.rounds) {
                        // Pure knockout
                        data.rounds.forEach((round, ri) => {
                          const total = data.rounds.length;
                          const r = total - ri;
                          let roundName = `Round ${ri + 1}`;
                          if (r === 1) roundName = 'Final';
                          else if (r === 2) roundName = 'Semi Finals';
                          else if (r === 3) roundName = 'Quarter Finals';
                          
                          const totalMatches = round.matches?.length || 0;
                          const completedMatches = round.matches?.filter(m => m.winner)?.length || 0;
                          
                          navigationItems.push({
                            id: `round-${ri}`,
                            label: roundName,
                            subtitle: `${completedMatches}/${totalMatches} matches`,
                            icon: '🏆'
                          });
                        });
                      }
                      
                      if (navigationItems.length === 0) {
                        return (
                          <div className="text-center py-4">
                            <p className="text-gray-500 text-xs">No fixtures yet</p>
                          </div>
                        );
                      }
                      
                      return navigationItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            const element = document.getElementById(item.id);
                            if (element) {
                              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg transition-all group"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)' }}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-base">{item.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm text-white truncate">{item.label}</div>
                              <div className="text-xs text-gray-400">{item.subtitle}</div>
                            </div>
                            <div className="w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(6,182,212,0.15)' }}>
                              <span className="text-xs">→</span>
                            </div>
                          </div>
                        </button>
                      ));
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
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.3)' }}>
                        <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#06b6d4' }}></div>
                        <span className="text-xs font-medium" style={{ color: '#06b6d4' }}>Auto-updating</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    {loadingDraw ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-4">
                        <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
                          style={{ borderColor: '#06b6d4 transparent transparent transparent' }} />
                        <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>Loading draw…</p>
                      </div>
                    ) : draw ? (
                      <DrawBracket draw={draw} onViewMatchDetails={onViewMatchDetails} categoryFormat={selectedCategory?.format} dbMatches={categoryMatches} />
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3">
          <div className="rounded-2xl p-4 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto" style={{ background: '#0d1025', border: '2px solid rgba(0,212,255,0.35)' }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,212,255,0.15)', border: '1px solid rgba(0,212,255,0.3)' }}>
                  <span className="text-lg">🏸</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Match Details</h2>
                  <p className="text-gray-400 text-xs">Match #{selectedMatchDetails.matchNumber}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowMatchDetailsModal(false);
                  setSelectedMatchDetails(null);
                }}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Match Score Card */}
            <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(0,212,255,0.06)', border: '2px solid rgba(0,212,255,0.2)' }}>
              {/* Final Score */}
              <div className="text-center mb-4">
                <p className="text-xs uppercase tracking-widest mb-2 font-semibold" style={{ color: '#00d4ff' }}>Final Score</p>
                <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl" style={{ background: 'rgba(7,7,26,0.7)', border: '1px solid rgba(0,212,255,0.15)' }}>
                  <span className="text-5xl font-black text-white tracking-tight">
                    {selectedMatchDetails.score ? (() => {
                      try {
                        const scoreData = typeof selectedMatchDetails.score === 'string'
                          ? JSON.parse(selectedMatchDetails.score)
                          : selectedMatchDetails.score;
                        let p1SetsWon = 0, p2SetsWon = 0;
                        scoreData?.sets?.forEach((set) => {
                          if (set.winner === 1) p1SetsWon++;
                          if (set.winner === 2) p2SetsWon++;
                        });
                        return `${p1SetsWon}-${p2SetsWon}`;
                      } catch (e) { return 'N/A'; }
                    })() : 'N/A'}
                  </span>
                </div>
                <p className="text-gray-400 text-xs uppercase tracking-wider mt-2">Sets Won</p>
              </div>

              {/* Set Breakdown */}
              <div className="text-center mb-4">
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Set Breakdown</p>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {selectedMatchDetails.score ? (() => {
                    try {
                      const scoreData = typeof selectedMatchDetails.score === 'string'
                        ? JSON.parse(selectedMatchDetails.score)
                        : selectedMatchDetails.score;
                      if (!scoreData?.sets?.length) return <span className="text-gray-400 text-xs">No set data</span>;
                      return scoreData.sets.map((set, idx) => {
                        const p1Score = set.player1Score !== undefined ? set.player1Score : set.player1;
                        const p2Score = set.player2Score !== undefined ? set.player2Score : set.player2;
                        const isP1Winner = set.winner === 1;
                        return (
                          <div key={idx} className="px-3 py-1.5 rounded-lg"
                            style={isP1Winner
                              ? { border: '2px solid rgba(0,212,255,0.4)', background: 'rgba(0,212,255,0.08)' }
                              : { border: '2px solid rgba(6,182,212,0.4)', background: 'rgba(6,182,212,0.08)' }}>
                            <span className="text-white font-bold text-sm">{p1Score}-{p2Score}</span>
                          </div>
                        );
                      });
                    } catch (e) { return <span className="text-gray-400 text-xs">Error loading sets</span>; }
                  })() : <span className="text-gray-400 text-xs">No score data available</span>}
                </div>
              </div>

              {/* Players — stacked vertically */}
              <div className="space-y-3">
                {/* Player 1 */}
                {(() => {
                  const isWinner = selectedMatchDetails.winnerId === selectedMatchDetails.bracketMatch?.player1?.id;
                  return (
                    <div className="rounded-xl p-3 border-2"
                      style={isWinner
                        ? { borderColor: 'rgba(6,182,212,0.4)', background: 'rgba(6,182,212,0.07)' }
                        : { borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {isWinner && <span className="flex-shrink-0">👑</span>}
                          <p className="font-bold text-sm leading-snug min-w-0"
                            style={{ color: isWinner ? '#06b6d4' : '#fff', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                            {selectedMatchDetails.bracketMatch?.player1?.name || selectedMatchDetails.player1?.name || 'Player 1'}
                          </p>
                        </div>
                        {isWinner && (
                          <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-bold"
                            style={{ background: 'rgba(6,182,212,0.15)', color: '#06b6d4', border: '1px solid rgba(6,182,212,0.3)' }}>
                            Winner
                          </span>
                        )}
                      </div>
                      {selectedMatchDetails.score && (() => {
                        try {
                          const scores = getDetailedSetScores(selectedMatchDetails.score, 1);
                          if (!scores) return null;
                          return (
                            <div className="flex flex-wrap gap-1.5">
                              {scores.split(', ').map((score, idx) => {
                                const [p1, p2] = score.split('-').map(Number);
                                const won = p1 > p2;
                                return (
                                  <span key={idx} className="px-2 py-0.5 rounded text-xs font-semibold"
                                    style={won
                                      ? { background: 'rgba(6,182,212,0.12)', color: '#06b6d4', border: '1px solid rgba(6,182,212,0.25)' }
                                      : { background: 'rgba(255,255,255,0.06)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    {score}
                                  </span>
                                );
                              })}
                            </div>
                          );
                        } catch (e) { return null; }
                      })()}
                    </div>
                  );
                })()}

                <div className="text-center">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">vs</span>
                </div>

                {/* Player 2 */}
                {(() => {
                  const isWinner = selectedMatchDetails.winnerId === selectedMatchDetails.bracketMatch?.player2?.id;
                  return (
                    <div className="rounded-xl p-3 border-2"
                      style={isWinner
                        ? { borderColor: 'rgba(6,182,212,0.4)', background: 'rgba(6,182,212,0.07)' }
                        : { borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {isWinner && <span className="flex-shrink-0">👑</span>}
                          <p className="font-bold text-sm leading-snug min-w-0"
                            style={{ color: isWinner ? '#06b6d4' : '#fff', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                            {selectedMatchDetails.bracketMatch?.player2?.name || selectedMatchDetails.player2?.name || 'Player 2'}
                          </p>
                        </div>
                        {isWinner && (
                          <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-bold"
                            style={{ background: 'rgba(6,182,212,0.15)', color: '#06b6d4', border: '1px solid rgba(6,182,212,0.3)' }}>
                            Winner
                          </span>
                        )}
                      </div>
                      {selectedMatchDetails.score && (() => {
                        try {
                          const scores = getDetailedSetScores(selectedMatchDetails.score, 2);
                          if (!scores) return null;
                          return (
                            <div className="flex flex-wrap gap-1.5">
                              {scores.split(', ').map((score, idx) => {
                                const [p2, p1] = score.split('-').map(Number);
                                const won = p2 > p1;
                                return (
                                  <span key={idx} className="px-2 py-0.5 rounded text-xs font-semibold"
                                    style={won
                                      ? { background: 'rgba(6,182,212,0.12)', color: '#06b6d4', border: '1px solid rgba(6,182,212,0.25)' }
                                      : { background: 'rgba(255,255,255,0.06)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    {score}
                                  </span>
                                );
                              })}
                            </div>
                          );
                        } catch (e) { return null; }
                      })()}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Match Information */}
            <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <span>ℹ️</span> Match Information
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-gray-400 text-xs uppercase tracking-wider">Status</p>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#06b6d4' }}></span>
                    <p className="text-white font-semibold text-sm">Completed</p>
                  </div>
                </div>
                {selectedMatchDetails.courtNumber && (
                  <div className="space-y-1">
                    <p className="text-gray-400 text-xs uppercase tracking-wider">Court</p>
                    <p className="text-white font-semibold text-sm">Court {selectedMatchDetails.courtNumber}</p>
                  </div>
                )}
                {(selectedMatchDetails.startTime || selectedMatchDetails.startedAt) && (
                  <div className="space-y-1">
                    <p className="text-gray-400 text-xs uppercase tracking-wider">Started</p>
                    <p className="text-white font-semibold text-xs">
                      {new Date(selectedMatchDetails.startTime || selectedMatchDetails.startedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                )}
                {(selectedMatchDetails.endTime || selectedMatchDetails.completedAt) && (
                  <div className="space-y-1">
                    <p className="text-gray-400 text-xs uppercase tracking-wider">Ended</p>
                    <p className="text-white font-semibold text-xs">
                      {new Date(selectedMatchDetails.endTime || selectedMatchDetails.completedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                )}
                {(() => {
                  let durationSeconds = selectedMatchDetails.duration;
                  if (!durationSeconds && selectedMatchDetails.score) {
                    try {
                      const sd = typeof selectedMatchDetails.score === 'string' ? JSON.parse(selectedMatchDetails.score) : selectedMatchDetails.score;
                      durationSeconds = sd?.timer?.totalDuration;
                    } catch (e) {}
                  }
                  if (!durationSeconds) {
                    const s = selectedMatchDetails.startTime || selectedMatchDetails.startedAt;
                    const e = selectedMatchDetails.endTime || selectedMatchDetails.completedAt;
                    if (s && e) durationSeconds = Math.floor((new Date(e) - new Date(s)) / 1000);
                  }
                  if (!durationSeconds) return null;
                  const h = Math.floor(durationSeconds / 3600);
                  const m = Math.floor((durationSeconds % 3600) / 60);
                  const s = durationSeconds % 60;
                  const txt = h > 0 ? `${h}h ${m}m ${s}s` : m > 0 ? `${m}m ${s}s` : `${s}s`;
                  return (
                    <div className="space-y-1">
                      <p className="text-gray-400 text-xs uppercase tracking-wider">Duration</p>
                      <p className="text-white font-semibold text-xs">{txt}</p>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => {
                setShowMatchDetailsModal(false);
                setSelectedMatchDetails(null);
              }}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all"
              style={{ background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.3)', color: '#00d4ff' }}
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
const DrawBracket = ({ draw, onViewMatchDetails, categoryFormat, dbMatches = [] }) => {
  const rawData = draw.bracketJson || draw.bracket;
  const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
  const format = draw.format || data?.format;

  if (format === 'ROUND_ROBIN') {
    return <RoundRobinDraw data={data} onViewMatchDetails={onViewMatchDetails} categoryFormat={categoryFormat} dbMatches={dbMatches} />;
  }
  if (format === 'ROUND_ROBIN_KNOCKOUT') {
    return <GroupsKnockoutDraw data={data} onViewMatchDetails={onViewMatchDetails} categoryFormat={categoryFormat} dbMatches={dbMatches} />;
  }
  return <KnockoutBracket data={data} onViewMatchDetails={onViewMatchDetails} dbMatches={dbMatches} />;
};

// Knockout Bracket Component
const KnockoutBracket = ({ data, onViewMatchDetails, dbMatches = [] }) => {
  if (!data?.rounds) return <p className="text-gray-400 text-center">No bracket data</p>;
  const findDbMatch = (matchNum) => dbMatches.find(m => m.matchNumber === matchNum) || null;

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
          <div key={ri} id={`round-${ri}`} className="flex flex-col min-w-[260px]">
            {/* Round Header */}
            <div className="mb-6 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)' }}>
                <Trophy className="w-4 h-4" style={{ color: '#06b6d4' }} />
                <h4 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#06b6d4' }}>
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
                const resolvedDbMatch = match.dbMatch || findDbMatch(match.matchNumber);
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
                    <div className="backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden shadow-lg transition-all" style={{ background: 'rgba(13,16,37,0.9)' }}>
                      {/* Match Number Badge */}
                      <div className="bg-slate-700/50 px-3 py-1.5 border-b border-white/5">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Match #{match.matchNumber || mi + 1}
                        </span>
                      </div>

                      {/* Players */}
                      <div className="p-2.5 space-y-1.5">
                        {/* Player 1 */}
                        <div
                          className="flex items-center justify-between px-3 py-2 rounded-lg transition-all"
                          style={isPlayer1Winner
                            ? { background: 'rgba(6,182,212,0.12)', border: '2px solid rgba(6,182,212,0.4)' }
                            : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)' }}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {isPlayer1Winner && (
                              <Trophy className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#06b6d4' }} />
                            )}
                            <span
                              className="text-sm font-medium truncate"
                              style={{ color: isPlayer1Winner ? '#06b6d4' : player1Name === 'TBD' ? '#6b7280' : '#fff', fontStyle: player1Name === 'TBD' && !isPlayer1Winner ? 'italic' : 'normal' }}
                            >
                              {player1Name}
                            </span>
                          </div>
                          {isPlayer1Winner && (
                            <span className="ml-2 px-1.5 py-0.5 rounded text-xs font-bold" style={{ background: 'rgba(6,182,212,0.2)', color: '#06b6d4' }}>
                              W
                            </span>
                          )}
                        </div>

                        {/* VS Divider */}
                        <div className="flex items-center justify-center py-0.5">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">vs</span>
                        </div>

                        {/* Player 2 */}
                        <div
                          className="flex items-center justify-between px-3 py-2 rounded-lg transition-all"
                          style={isPlayer2Winner
                            ? { background: 'rgba(6,182,212,0.12)', border: '2px solid rgba(6,182,212,0.4)' }
                            : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)' }}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {isPlayer2Winner && (
                              <Trophy className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#06b6d4' }} />
                            )}
                            <span
                              className="text-sm font-medium truncate"
                              style={{ color: isPlayer2Winner ? '#06b6d4' : player2Name === 'TBD' ? '#6b7280' : '#fff', fontStyle: player2Name === 'TBD' && !isPlayer2Winner ? 'italic' : 'normal' }}
                            >
                              {player2Name}
                            </span>
                          </div>
                          {isPlayer2Winner && (
                            <span className="ml-2 px-1.5 py-0.5 rounded text-xs font-bold" style={{ background: 'rgba(6,182,212,0.2)', color: '#06b6d4' }}>
                              W
                            </span>
                          )}
                        </div>
                      </div>

                      {/* View Details Button for Completed Matches */}
                      {isCompleted && onViewMatchDetails && (
                        <div className="px-2.5 pb-2.5">
                          <button
                            onClick={() => {
                              const bracketMatchData = {
                                matchNumber: match.matchNumber,
                                round: ri + 1,
                                player1: match.player1,
                                player2: match.player2
                              };
                              const matchDataToUse = resolvedDbMatch || {
                                matchNumber: match.matchNumber,
                                status: 'COMPLETED',
                                winner: match.winner,
                                winnerId: match.winner === 1 ? match.player1?.id : match.player2?.id,
                                score: match.scoreJson || match.score || null,
                                scoreJson: match.scoreJson || null,
                                player1: match.player1,
                                player2: match.player2,
                              };
                              onViewMatchDetails(matchDataToUse, bracketMatchData);
                            }}
                            className="w-full py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                            style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', color: '#00d4ff' }}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View Score
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
const RoundRobinDraw = ({ data, onViewMatchDetails, categoryFormat, dbMatches = [] }) => {
  if (!data?.groups) return <p className="text-gray-400 text-center">No group data</p>;
  const findDbMatch = (matchNum) => dbMatches.find(m => m.matchNumber === matchNum) || null;

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
        <div key={gi} id={`group-${gi}`} className="backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden shadow-lg" style={{ background: 'rgba(13,16,37,0.9)' }}>
          {/* Group Header */}
          <div className="border-b px-6 py-4" style={{ background: 'rgba(0,212,255,0.08)', borderColor: 'rgba(0,212,255,0.2)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#00a3cc,#00d4ff)', boxShadow: '0 4px 12px rgba(0,212,255,0.3)' }}>
                <span className="text-xl font-bold" style={{ color: '#050810' }}>{String.fromCharCode(65 + gi)}</span>
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">Group {String.fromCharCode(65 + gi)}</h4>
                <p className="text-xs" style={{ color: '#00d4ff' }}>{group.participants?.length || 0} Players</p>
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
                        <th className="text-left py-3 px-3 text-gray-400 font-semibold text-xs">{categoryFormat === 'doubles' ? 'Team' : 'Player'}</th>
                        <th className="text-center py-3 px-2 text-gray-400 font-semibold text-xs">P</th>
                        <th className="text-center py-3 px-2 text-gray-400 font-semibold text-xs">W</th>
                        <th className="text-center py-3 px-2 text-gray-400 font-semibold text-xs">L</th>
                        <th className="text-center py-3 px-2 text-gray-400 font-semibold text-xs">TP</th>
                        <th className="text-center py-3 px-2 text-gray-400 font-semibold text-xs">Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.participants.map((p, pi) => {
                        // Use totalPoints from backend if available, otherwise calculate from matches
                        const totalPointsScored = p.totalPoints ?? calculateTotalPointsScored(p.id, group.matches || []);
                        
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
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg font-bold text-xs" style={{ background: 'rgba(6,182,212,0.15)', color: '#06b6d4' }}>
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
                      const resolvedDbMatch = match.dbMatch || findDbMatch(match.matchNumber);
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
                              <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: 'rgba(6,182,212,0.15)', color: '#06b6d4' }}>
                                Completed
                              </span>
                            )}
                          </div>
                          
                          {/* Players - Vertical for Doubles, Horizontal for Singles */}
                          {categoryFormat === 'doubles' ? (
                            <div className="p-3 space-y-2">
                              {/* Player 1 */}
                              <div
                                className="flex items-center justify-between px-3 py-2 rounded-lg transition-all"
                                style={isPlayer1Winner
                                  ? { background: 'rgba(6,182,212,0.12)', border: '2px solid rgba(6,182,212,0.4)' }
                                  : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)' }}
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  {isPlayer1Winner && (
                                    <Trophy className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#06b6d4' }} />
                                  )}
                                  <span className="text-sm font-medium truncate" style={{ color: isPlayer1Winner ? '#06b6d4' : '#fff' }}>
                                    {match.player1?.name || 'TBD'}
                                  </span>
                                </div>
                                {isPlayer1Winner && (
                                  <span className="ml-2 px-1.5 py-0.5 rounded text-xs font-bold" style={{ background: 'rgba(6,182,212,0.2)', color: '#06b6d4' }}>
                                    W
                                  </span>
                                )}
                              </div>

                              {/* VS Divider */}
                              <div className="flex items-center justify-center py-0.5">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">vs</span>
                              </div>

                              {/* Player 2 */}
                              <div
                                className="flex items-center justify-between px-3 py-2 rounded-lg transition-all"
                                style={isPlayer2Winner
                                  ? { background: 'rgba(6,182,212,0.12)', border: '2px solid rgba(6,182,212,0.4)' }
                                  : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)' }}
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  {isPlayer2Winner && (
                                    <Trophy className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#06b6d4' }} />
                                  )}
                                  <span className="text-sm font-medium truncate" style={{ color: isPlayer2Winner ? '#06b6d4' : '#fff' }}>
                                    {match.player2?.name || 'TBD'}
                                  </span>
                                </div>
                                {isPlayer2Winner && (
                                  <span className="ml-2 px-1.5 py-0.5 rounded text-xs font-bold" style={{ background: 'rgba(6,182,212,0.2)', color: '#06b6d4' }}>
                                    W
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="p-3">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 flex-1">
                                  {isPlayer1Winner && (
                                    <Trophy className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#06b6d4' }} />
                                  )}
                                  <span className="text-sm font-medium" style={{ color: isPlayer1Winner ? '#06b6d4' : '#fff' }}>
                                    {match.player1?.name || 'TBD'}
                                  </span>
                                  {isPlayer1Winner && (
                                    <span className="px-1.5 py-0.5 rounded text-xs font-bold" style={{ background: 'rgba(6,182,212,0.2)', color: '#06b6d4' }}>
                                      W
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">vs</span>
                                <div className="flex items-center gap-2 flex-1 justify-end">
                                  {isPlayer2Winner && (
                                    <Trophy className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#06b6d4' }} />
                                  )}
                                  <span className="text-sm font-medium" style={{ color: isPlayer2Winner ? '#06b6d4' : '#fff' }}>
                                    {match.player2?.name || 'TBD'}
                                  </span>
                                  {isPlayer2Winner && (
                                    <span className="px-1.5 py-0.5 rounded text-xs font-bold" style={{ background: 'rgba(6,182,212,0.2)', color: '#06b6d4' }}>
                                      W
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* View Details Button */}
                          {isCompleted && onViewMatchDetails && (
                            <div className="px-3 pb-3">
                              <button
                                onClick={() => {
                                  const bracketMatchData = {
                                    matchNumber: match.matchNumber,
                                    groupName: group.groupName,
                                    player1: match.player1,
                                    player2: match.player2
                                  };
                                  const matchDataToUse = resolvedDbMatch || {
                                    matchNumber: match.matchNumber,
                                    status: 'COMPLETED',
                                    winner: match.winner,
                                    winnerId: match.winner === 1 ? match.player1?.id : match.player2?.id,
                                    score: match.scoreJson || match.score || null,
                                    scoreJson: match.scoreJson || null,
                                    player1: match.player1,
                                    player2: match.player2,
                                  };
                                  onViewMatchDetails(matchDataToUse, bracketMatchData);
                                }}
                                className="w-full py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                                style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', color: '#00d4ff' }}
                              >
                                <Eye className="w-3.5 h-3.5" />
                                View Score
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
const GroupsKnockoutDraw = ({ data, onViewMatchDetails, categoryFormat, dbMatches = [] }) => {
  const findDbMatch = (matchNum) => dbMatches.find(m => m.matchNumber === matchNum) || null;
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
    <div className="space-y-8">
      {/* Group Stage */}
      <div id="group-stage">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="px-3 py-1 rounded-lg text-sm" style={{ background: 'rgba(0,212,255,0.12)', color: '#00d4ff' }}>Stage 1</span>
          Group Stage (Round Robin)
        </h3>
        <RoundRobinDraw data={data} onViewMatchDetails={onViewMatchDetails} categoryFormat={categoryFormat} dbMatches={dbMatches} />
      </div>

      {/* Knockout Stage */}
      {data.knockout && (
        <div id="knockout-stage">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-lg text-sm">Stage 2</span>
            Knockout Stage
          </h3>
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-6 min-w-max p-4">
              {data.knockout.rounds.map((round, ri) => (
                <div key={ri} id={`knockout-${ri}`} className="flex flex-col min-w-[260px]">
                  {/* Round Header */}
                  <div className="mb-6 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)' }}>
                      <Trophy className="w-4 h-4" style={{ color: '#06b6d4' }} />
                      <h4 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#06b6d4' }}>
                        {getRoundName(ri, data.knockout.rounds.length)}
                      </h4>
                    </div>
                  </div>
                  
                  {/* Matches */}
                  <div 
                    className="flex flex-col justify-around flex-1 gap-3" 
                    style={{ paddingTop: ri > 0 ? `${Math.pow(2, ri) * 18}px` : 0 }}
                  >
                    {round.matches.map((match, mi) => {
                      const resolvedDbMatch = match.dbMatch || findDbMatch(match.matchNumber);
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
                          <div className="backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden shadow-lg transition-all" style={{ background: 'rgba(13,16,37,0.9)' }}>
                            {/* Match Number Badge */}
                            <div className="bg-slate-700/50 px-3 py-1.5 border-b border-white/5">
                              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                Match #{match.matchNumber || mi + 1}
                              </span>
                            </div>

                            {/* Players */}
                            <div className="p-2.5 space-y-1.5">
                              {/* Player 1 */}
                              <div
                                className="flex items-center justify-between px-3 py-2 rounded-lg transition-all"
                                style={isPlayer1Winner
                                  ? { background: 'rgba(6,182,212,0.12)', border: '2px solid rgba(6,182,212,0.4)' }
                                  : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)' }}
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  {isPlayer1Winner && (
                                    <Trophy className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#06b6d4' }} />
                                  )}
                                  <span
                                    className="text-sm font-medium truncate"
                                    style={{ color: isPlayer1Winner ? '#06b6d4' : player1Name === 'TBD' ? '#6b7280' : '#fff', fontStyle: player1Name === 'TBD' && !isPlayer1Winner ? 'italic' : 'normal' }}
                                  >
                                    {player1Name}
                                  </span>
                                </div>
                                {isPlayer1Winner && (
                                  <span className="ml-2 px-1.5 py-0.5 rounded text-xs font-bold" style={{ background: 'rgba(6,182,212,0.2)', color: '#06b6d4' }}>
                                    W
                                  </span>
                                )}
                              </div>

                              {/* VS Divider */}
                              <div className="flex items-center justify-center py-0.5">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">vs</span>
                              </div>

                              {/* Player 2 */}
                              <div
                                className="flex items-center justify-between px-3 py-2 rounded-lg transition-all"
                                style={isPlayer2Winner
                                  ? { background: 'rgba(6,182,212,0.12)', border: '2px solid rgba(6,182,212,0.4)' }
                                  : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)' }}
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  {isPlayer2Winner && (
                                    <Trophy className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#06b6d4' }} />
                                  )}
                                  <span
                                    className="text-sm font-medium truncate"
                                    style={{ color: isPlayer2Winner ? '#06b6d4' : player2Name === 'TBD' ? '#6b7280' : '#fff', fontStyle: player2Name === 'TBD' && !isPlayer2Winner ? 'italic' : 'normal' }}
                                  >
                                    {player2Name}
                                  </span>
                                </div>
                                {isPlayer2Winner && (
                                  <span className="ml-2 px-1.5 py-0.5 rounded text-xs font-bold" style={{ background: 'rgba(6,182,212,0.2)', color: '#06b6d4' }}>
                                    W
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* View Details Button for Completed Matches */}
                            {isCompleted && onViewMatchDetails && (
                              <div className="px-2.5 pb-2.5">
                                <button
                                  onClick={() => {
                                    const bracketMatchData = {
                                      matchNumber: match.matchNumber,
                                      round: ri + 1,
                                      player1: match.player1,
                                      player2: match.player2
                                    };
                                    const matchDataToUse = resolvedDbMatch || {
                                      matchNumber: match.matchNumber,
                                      status: 'COMPLETED',
                                      winner: match.winner,
                                      winnerId: match.winner === 1 ? match.player1?.id : match.player2?.id,
                                      score: match.scoreJson || match.score || null,
                                      scoreJson: match.scoreJson || null,
                                      player1: match.player1,
                                      player2: match.player2,
                                    };
                                    onViewMatchDetails(matchDataToUse, bracketMatchData);
                                  }}
                                  className="w-full py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                                  style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', color: '#00d4ff' }}
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  View Score
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
