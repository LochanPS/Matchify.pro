/**
 * DrawPage - Tournament Bracket Display
 * 
 * STANDARD BRACKET LAYOUT RULE:
 * ALL knockout brackets MUST use HORIZONTAL LEFT-TO-RIGHT pyramid layout:
 * - Round 1 (most matches) on the LEFT
 * - Quarter Finals in the middle-left
 * - Semi Finals in the middle-right
 * - Final (single match) on the RIGHT
 * - Vertical spacing increases with each round (pyramid effect)
 * - Connector lines flow from left to right
 * 
 * This applies to:
 * 1. Pure KNOCKOUT tournaments
 * 2. ROUND_ROBIN_KNOCKOUT (knockout stage after groups)
 * 3. All bracket sizes (2, 4, 8, 16, 32, 64, 128 players)
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { drawAPI } from '../api/draw';
import { tournamentAPI } from '../api/tournament';
import api from '../utils/api';
import SingleEliminationBracket from '../components/brackets/SingleEliminationBracket';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeftIcon, TrophyIcon } from '@heroicons/react/24/outline';
import { Loader, Zap, Layers, X, Plus, Settings, Users, CheckCircle, AlertTriangle, Trash2, UserPlus, Gavel } from 'lucide-react';

const DrawPage = () => {
  const { tournamentId, categoryId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tournament, setTournament] = useState(null);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [bracket, setBracket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [categoryPlayers, setCategoryPlayers] = useState([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [matches, setMatches] = useState([]);
  const [success, setSuccess] = useState(null);
  const [tournamentUmpires, setTournamentUmpires] = useState([]);
  const [showUmpireModal, setShowUmpireModal] = useState(false);
  const [selectedMatchForUmpire, setSelectedMatchForUmpire] = useState(null);
  const [tournamentStats, setTournamentStats] = useState({
    totalPlayers: 0,
    confirmedPlayers: 0,
    totalMatches: 0,
    completedMatches: 0
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTournamentData();
  }, [tournamentId]);

  useEffect(() => {
    if (activeCategory) {
      fetchBracket();
      fetchTournamentStats();
    }
  }, [activeCategory]);

  // Handle refresh parameter from URL (when returning from match completion)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const shouldRefresh = urlParams.get('refresh');
    
    if (shouldRefresh === 'true' && activeCategory) {
      setRefreshing(true);
      setSuccess('Match completed! Updating bracket...');
      
      // Force refresh bracket and stats after match completion
      setTimeout(async () => {
        await fetchBracket();
        await fetchTournamentStats();
        setRefreshing(false);
        setSuccess('Bracket updated successfully! Winner advanced to next round.');
        
        // Clear the refresh parameter from URL
        const newUrl = window.location.pathname + (window.location.search.replace(/[?&]refresh=true/, '').replace(/^&/, '?') || '');
        window.history.replaceState({}, '', newUrl);
        
        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(null), 5000);
      }, 500); // Small delay to ensure backend has processed the match completion
    }
  }, [activeCategory, window.location.search]);

  const fetchTournamentData = async () => {
    try {
      setLoading(true);
      const tournamentData = await tournamentAPI.getTournament(tournamentId);
      setTournament(tournamentData.data);

      const categoriesData = await tournamentAPI.getCategories(tournamentId);
      const cats = categoriesData.categories || [];
      setCategories(cats);

      const active = categoryId
        ? cats.find(c => c.id === categoryId)
        : cats[0];
      
      if (active) {
        setActiveCategory(active);
      } else if (cats.length > 0) {
        setActiveCategory(cats[0]);
      }
    } catch (err) {
      console.error('Error fetching tournament data:', err);
      setError('Failed to load tournament data');
    } finally {
      setLoading(false);
    }
  };

  const fetchBracket = async () => {
    if (!activeCategory) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/tournaments/${tournamentId}/categories/${activeCategory.id}/draw`);
      const draw = response.data.draw;
      // Parse bracketJson if it's a string
      const bracketData = draw.bracketJson || draw.bracket;
      setBracket(typeof bracketData === 'string' ? JSON.parse(bracketData) : bracketData);
      
      // Also fetch matches for scoring
      try {
        const matchesResponse = await api.get(`/tournaments/${tournamentId}/categories/${activeCategory.id}/matches`);
        setMatches(matchesResponse.data.matches || []);
      } catch (matchErr) {
        console.log('No matches found');
        setMatches([]);
      }
    } catch (err) {
      console.error('Error fetching bracket:', err);
      if (err.response?.status === 404) {
        setError(null);
        setBracket(null);
      } else {
        setError('Failed to load bracket');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchTournamentStats = async () => {
    if (!activeCategory) return;

    try {
      // Fetch registrations for this category
      const registrationsResponse = await api.get(`/tournaments/${tournamentId}/categories/${activeCategory.id}/registrations`);
      const registrations = registrationsResponse.data.registrations || [];
      
      // Fetch matches for this category
      const matchesResponse = await api.get(`/tournaments/${tournamentId}/categories/${activeCategory.id}/matches`);
      const matches = matchesResponse.data.matches || [];

      setTournamentStats({
        totalPlayers: registrations.length,
        confirmedPlayers: registrations.filter(r => r.status === 'confirmed').length,
        totalMatches: matches.length,
        completedMatches: matches.filter(m => m.status === 'COMPLETED').length
      });
    } catch (err) {
      console.error('Error fetching tournament stats:', err);
      // Set default stats if fetch fails
      setTournamentStats({
        totalPlayers: 0,
        confirmedPlayers: 0,
        totalMatches: 0,
        completedMatches: 0
      });
    }
  };

  const createDraw = async (config) => {
    if (!activeCategory) return;
    
    setGenerating(true);
    setError(null);
    
    try {
      const response = await api.post(`/draws/create`, {
        tournamentId: tournamentId,
        categoryId: activeCategory.id,
        ...config
      });
      const draw = response.data.draw;
      const bracketData = draw.bracketJson || draw.bracket;
      setBracket(typeof bracketData === 'string' ? JSON.parse(bracketData) : bracketData);
      setSuccess('Draw created successfully!');
      setShowConfigModal(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error creating draw:', err);
      setError(err.response?.data?.error || 'Failed to create draw');
    } finally {
      setGenerating(false);
    }
  };

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    navigate(`/tournaments/${tournamentId}/draws/${category.id}`);
  };

  // Delete draw handler
  const deleteDraw = async () => {
    if (!activeCategory) return;
    
    setDeleting(true);
    setError(null);
    
    try {
      await api.delete(`/tournaments/${tournamentId}/categories/${activeCategory.id}/draw`);
      setBracket(null);
      setSuccess('Draw deleted successfully!');
      setShowDeleteModal(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error deleting draw:', err);
      setError(err.response?.data?.error || 'Failed to delete draw');
    } finally {
      setDeleting(false);
    }
  };

  // Fetch registered players for assignment
  const fetchCategoryPlayers = async () => {
    if (!activeCategory) return;
    
    setLoadingPlayers(true);
    try {
      const response = await api.get(`/tournaments/${tournamentId}/categories/${activeCategory.id}/players`);
      setCategoryPlayers(response.data.players || []);
    } catch (err) {
      console.error('Error fetching players:', err);
      setError('Failed to load registered players');
    } finally {
      setLoadingPlayers(false);
    }
  };

  // Open assign modal and fetch players
  const openAssignModal = () => {
    fetchCategoryPlayers();
    setShowAssignModal(true);
  };

  // Fetch tournament umpires
  const fetchTournamentUmpires = async () => {
    try {
      const response = await tournamentAPI.getTournamentUmpires(tournamentId);
      console.log('Fetched umpires:', response);
      setTournamentUmpires(response.umpires || []);
      return response.umpires || [];
    } catch (err) {
      console.error('Error fetching umpires:', err);
      return [];
    }
  };

  // Open umpire assignment modal - create match if needed
  const openUmpireModal = async (matchData, bracketMatch) => {
    // Fetch umpires first
    await fetchTournamentUmpires();
    
    // If we have a database match, use it directly
    if (matchData && matchData.id) {
      setSelectedMatchForUmpire(matchData);
      setShowUmpireModal(true);
      return;
    }
    
    // If no database match exists, create one first
    if (bracketMatch && activeCategory) {
      try {
        setError(null);
        // Create the match in the database
        const response = await api.post(`/tournaments/${tournamentId}/categories/${activeCategory.id}/matches`, {
          matchNumber: bracketMatch.matchNumber,
          round: bracketMatch.round || 1,
          player1Id: bracketMatch.player1?.id,
          player2Id: bracketMatch.player2?.id
        });
        
        const newMatch = response.data.match;
        setSelectedMatchForUmpire(newMatch);
        setShowUmpireModal(true);
        
        // Refresh bracket to get updated matches
        fetchBracket();
      } catch (err) {
        console.error('Error creating match:', err);
        setError(err.response?.data?.error || 'Failed to create match. Please try again.');
      }
    }
  };

  // Assign umpire to match
  const assignUmpireToMatch = async (umpireId) => {
    if (!selectedMatchForUmpire) return;
    
    try {
      await api.put(`/matches/${selectedMatchForUmpire.id}/umpire`, { umpireId });
      setSuccess('Umpire assigned successfully!');
      setShowUmpireModal(false);
      setSelectedMatchForUmpire(null);
      // Refresh matches
      fetchBracket();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error assigning umpire:', err);
      setError(err.response?.data?.error || 'Failed to assign umpire');
    }
  };

  // Assign players to draw
  const assignPlayers = async (assignments) => {
    if (!activeCategory) return;
    
    setAssigning(true);
    setError(null);
    
    try {
      const response = await api.put('/draws/assign-players', {
        tournamentId,
        categoryId: activeCategory.id,
        assignments
      });
      const draw = response.data.draw;
      const bracketData = draw.bracketJson || draw.bracket;
      setBracket(typeof bracketData === 'string' ? JSON.parse(bracketData) : bracketData);
      setSuccess('Players assigned successfully!');
      setShowAssignModal(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error assigning players:', err);
      setError(err.response?.data?.error || 'Failed to assign players');
    } finally {
      setAssigning(false);
    }
  };

  if (loading && !tournament) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-400 mt-4 font-medium">Loading draw...</p>
        </div>
      </div>
    );
  }

  const isOrganizer = user?.id === tournament?.organizerId;
  const drawNotGenerated = !bracket && activeCategory;
  
  // Check if any match has been played (completed or in progress)
  const hasPlayedMatches = matches.some(m => m.status === 'COMPLETED' || m.status === 'IN_PROGRESS');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/70 hover:text-white mb-6 transition-colors group"
          >
            <ArrowLeftIcon className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Tournament</span>
          </button>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 via-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/30">
                <Layers className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{tournament?.name}</h1>
                <p className="text-white/60 mt-1">Tournament Draw & Brackets</p>
              </div>
            </div>

            {isOrganizer && (
              <div className="flex gap-3">
                {bracket && (
                  <>
                    <button
                      onClick={openAssignModal}
                      className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 transition-all flex items-center gap-2 font-semibold"
                    >
                      <UserPlus className="w-5 h-5" />
                      Assign Players
                    </button>
                    <button
                      onClick={() => !hasPlayedMatches && setShowDeleteModal(true)}
                      disabled={hasPlayedMatches}
                      title={hasPlayedMatches ? 'Cannot delete draw - matches have been played' : 'Delete Draw'}
                      className={`px-5 py-3 rounded-xl shadow-lg transition-all flex items-center gap-2 font-semibold ${
                        hasPlayedMatches 
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50' 
                          : 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-red-500/30 hover:shadow-red-500/50 hover:scale-105'
                      }`}
                    >
                      <Trash2 className="w-5 h-5" />
                      Delete Draw
                    </button>
                  </>
                )}
                <button
                  onClick={() => !hasPlayedMatches && setShowConfigModal(true)}
                  disabled={hasPlayedMatches && bracket}
                  title={hasPlayedMatches && bracket ? 'Cannot edit draw - matches have been played' : (bracket ? 'Edit Draw' : 'Create Draw')}
                  className={`px-6 py-3 rounded-xl shadow-lg transition-all flex items-center gap-2 font-semibold ${
                    hasPlayedMatches && bracket
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                      : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-105'
                  }`}
                >
                  {bracket ? <Settings className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  {bracket ? 'Edit Draw' : 'Create Draw'}
                </button>
              </div>
            )}
          </div>
          
          {/* Warning message when draw is locked */}
          {hasPlayedMatches && isOrganizer && (
            <div className="mt-4 px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-3">
              <span className="text-amber-400">🔒</span>
              <span className="text-amber-300 text-sm">Draw is locked because matches have been played. You cannot delete or edit the draw.</span>
            </div>
          )}
        </div>
      </div>

      {/* Tournament Statistics Header */}
      {activeCategory && (
        <div className="bg-slate-800/50 backdrop-blur-sm border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Total Players */}
              <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{tournamentStats.totalPlayers}</p>
                    <p className="text-blue-300 text-sm font-medium">Total Players</p>
                  </div>
                </div>
              </div>

              {/* Confirmed Players */}
              <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{tournamentStats.confirmedPlayers}</p>
                    <p className="text-emerald-300 text-sm font-medium">Confirmed</p>
                  </div>
                </div>
              </div>

              {/* Total Matches */}
              <div className="bg-gradient-to-br from-purple-500/10 to-violet-500/10 border border-purple-500/20 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Gavel className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{tournamentStats.totalMatches}</p>
                    <p className="text-purple-300 text-sm font-medium">Total Matches</p>
                  </div>
                </div>
              </div>

              {/* Completed Matches */}
              <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                    <TrophyIcon className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{tournamentStats.completedMatches}</p>
                    <p className="text-amber-300 text-sm font-medium">Completed</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            {tournamentStats.totalMatches > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Tournament Progress</span>
                  <span className="text-sm text-gray-300">
                    {Math.round((tournamentStats.completedMatches / tournamentStats.totalMatches) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.min((tournamentStats.completedMatches / tournamentStats.totalMatches) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span className="text-red-300 font-medium">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300"><X className="w-5 h-5" /></button>
          </div>
        )}
        {success && (
          <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span className="text-emerald-300 font-medium">{success}</span>
            {refreshing && (
              <div className="ml-auto">
                <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            <button onClick={() => setSuccess(null)} className="ml-auto text-emerald-400 hover:text-emerald-300"><X className="w-5 h-5" /></button>
          </div>
        )}
      </div>

      {/* Category Tabs */}
      {categories.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-2">
            <div className="flex gap-2 overflow-x-auto">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category)}
                  className={`flex-shrink-0 px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
                    activeCategory?.id === category.id
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  {category.name}
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    activeCategory?.id === category.id
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-700 text-gray-400'
                  }`}>
                    {category.format}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-16 text-center">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-400 mt-6 font-medium">Loading bracket...</p>
          </div>
        ) : drawNotGenerated ? (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-16 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <span className="text-5xl">📋</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Draw Not Generated Yet</h3>
            <p className="text-gray-400 max-w-md mx-auto mb-6">
              {isOrganizer
                ? 'Click the "Create Draw" button above to configure and create the bracket for this category.'
                : "The organizer hasn't generated the draw for this category yet."}
            </p>
            {isOrganizer && (
              <button
                onClick={() => setShowConfigModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-amber-500/25 hover:scale-105 transition-all"
              >
                <Plus className="w-5 h-5" />
                Create Draw Now
              </button>
            )}
          </div>
        ) : !bracket ? (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-16 text-center">
            <div className="w-24 h-24 bg-slate-700/50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <TrophyIcon className="w-12 h-12 text-gray-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No bracket data available</h3>
            <p className="text-gray-400">Please try again later</p>
          </div>
        ) : (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
            <DrawDisplay 
              bracket={bracket} 
              matches={matches} 
              user={user} 
              isOrganizer={isOrganizer} 
              onAssignUmpire={openUmpireModal}
              activeCategory={activeCategory}
            />
          </div>
        )}
      </div>

      {/* Draw Configuration Modal */}
      {showConfigModal && activeCategory && (
        <DrawConfigModal
          category={activeCategory}
          existingDraw={bracket}
          onClose={() => setShowConfigModal(false)}
          onSave={createDraw}
          saving={generating}
        />
      )}

      {/* Delete Draw Confirmation Modal */}
      {showDeleteModal && (
        <DeleteDrawModal
          categoryName={activeCategory?.name}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={deleteDraw}
          deleting={deleting}
        />
      )}

      {/* Assign Players Modal */}
      {showAssignModal && activeCategory && (
        <AssignPlayersModal
          bracket={bracket}
          players={categoryPlayers}
          matches={matches}
          loading={loadingPlayers}
          onClose={() => setShowAssignModal(false)}
          onSave={assignPlayers}
          saving={assigning}
          tournamentId={tournamentId}
          activeCategory={activeCategory}
          setBracket={setBracket}
          setSuccess={setSuccess}
          setError={setError}
          setShowAssignModal={setShowAssignModal}
        />
      )}

      {/* Assign Umpire Modal */}
      {showUmpireModal && selectedMatchForUmpire && (
        <AssignUmpireModal
          match={selectedMatchForUmpire}
          umpires={tournamentUmpires}
          onClose={() => {
            setShowUmpireModal(false);
            setSelectedMatchForUmpire(null);
          }}
          onAssign={assignUmpireToMatch}
        />
      )}
    </div>
  );
};

// Draw Display Component - handles all formats
const DrawDisplay = ({ bracket, matches, user, isOrganizer, onAssignUmpire, activeCategory }) => {
  const format = bracket?.format;

  if (format === 'ROUND_ROBIN') {
    return <RoundRobinDisplay 
      data={bracket} 
      matches={matches} 
      user={user} 
      isOrganizer={isOrganizer} 
      onAssignUmpire={onAssignUmpire} 
    />;
  }
  if (format === 'ROUND_ROBIN_KNOCKOUT') {
    return <GroupsKnockoutDisplay 
      data={bracket} 
      matches={matches} 
      user={user} 
      isOrganizer={isOrganizer} 
      onAssignUmpire={onAssignUmpire} 
    />;
  }
  // Default: Pure knockout (horizontal left-to-right layout)
  return <KnockoutDisplay 
    data={bracket} 
    matches={matches} 
    user={user} 
    isOrganizer={isOrganizer} 
    onAssignUmpire={onAssignUmpire} 
  />;
};

// Helper function to format player score for display
const getPlayerScore = (scoreData, playerNumber) => {
  if (!scoreData || !scoreData.sets) return '';
  
  try {
    // Count sets won by this player
    let setsWon = 0;
    const setScores = [];
    
    scoreData.sets.forEach((set) => {
      if (set.winner === playerNumber) {
        setsWon++;
      }
      
      // Get individual set scores
      if (set.player1Score !== undefined && set.player2Score !== undefined) {
        const playerScore = playerNumber === 1 ? set.player1Score : set.player2Score;
        setScores.push(playerScore);
      }
    });
    
    // Format: "2-1" for sets, then individual set scores like "(21-19, 18-21, 21-16)"
    const totalSets = scoreData.sets.length;
    const setsLost = totalSets - setsWon;
    
    if (setScores.length > 0) {
      return `${setsWon}-${setsLost} (${setScores.join(', ')})`;
    } else {
      return `${setsWon}-${setsLost}`;
    }
  } catch (err) {
    console.error('Error formatting score:', err);
    return '';
  }
};

// Helper function to get detailed set-by-set scores for display
const getDetailedSetScores = (scoreData, playerNumber) => {
  if (!scoreData || !scoreData.sets) return '';
  
  try {
    const setScores = [];
    
    scoreData.sets.forEach((set, index) => {
      if (set.player1Score !== undefined && set.player2Score !== undefined) {
        const playerScore = playerNumber === 1 ? set.player1Score : set.player2Score;
        setScores.push(`Set ${index + 1}: ${playerScore}`);
      }
    });
    
    return setScores.join('  ');
  } catch (err) {
    console.error('Error formatting detailed scores:', err);
    return '';
  }
};

// Helper function to get complete match score display
const getCompleteMatchScore = (scoreData) => {
  if (!scoreData || !scoreData.sets) return '';
  
  try {
    let p1SetsWon = 0;
    let p2SetsWon = 0;
    const setScores = [];
    
    scoreData.sets.forEach((set) => {
      if (set.winner === 1) p1SetsWon++;
      if (set.winner === 2) p2SetsWon++;
      
      if (set.player1Score !== undefined && set.player2Score !== undefined) {
        setScores.push(`${set.player1Score}-${set.player2Score}`);
      }
    });
    
    // Format: "2-1 (21-19, 18-21, 21-16)"
    if (setScores.length > 0) {
      return `${p1SetsWon}-${p2SetsWon} (${setScores.join(', ')})`;
    } else {
      return `${p1SetsWon}-${p2SetsWon}`;
    }
  } catch (err) {
    console.error('Error formatting complete score:', err);
    return '';
  }
};

// Knockout Display - HORIZONTAL PYRAMID (LEFT TO RIGHT)
// STANDARD LAYOUT: Round 1 → Quarters → Semis → Final (left to right)
// This layout is used for ALL knockout brackets regardless of size or format
const KnockoutDisplay = ({ data, matches, user, isOrganizer, onAssignUmpire }) => {
  if (!data?.rounds) return <p className="text-gray-400 text-center p-8">No bracket data</p>;

  const totalRounds = data.rounds.length;

  const getRoundName = (idx, total) => {
    const r = total - idx;
    if (r === 1) return 'Final';
    if (r === 2) return 'Semi Finals';
    if (r === 3) return 'Quarter Finals';
    return `Round ${idx + 1}`;
  };

  // Check if user can score matches (organizer or umpire)
  const canScore = isOrganizer || user?.roles?.includes('umpire') || user?.role === 'UMPIRE';

  // Find match record by round number (database round) and match number
  const findMatch = (displayIdx, matchNum) => {
    if (!matches || !Array.isArray(matches)) return null;
    const dbRound = totalRounds - displayIdx;
    return matches.find(m => m.round === dbRound && m.matchNumber === matchNum);
  };

  // Open scoring page in new tab
  const openScoring = (matchId) => {
    window.open(`/match/${matchId}/score`, '_blank');
  };

  // Calculate horizontal pyramid positions - Round 1 LEFT, Final RIGHT
  const calculatePositions = () => {
    const positions = [];
    const CARD_WIDTH = 280;
    const CARD_HEIGHT = 180;
    const HORIZONTAL_GAP = 350; // Gap between rounds (left to right)
    const BASE_VERTICAL_SPACING = 220; // Vertical spacing for first round
    
    data.rounds.forEach((round, roundIndex) => {
      const matchCount = round.matches.length;
      
      // X position: moves right with each round
      const x = roundIndex * HORIZONTAL_GAP + 100;
      
      // Vertical spacing: increases with each round (pyramid effect)
      // First round has tight spacing, final has matches far apart vertically
      const verticalSpacing = BASE_VERTICAL_SPACING * Math.pow(2, roundIndex);
      
      // Total height for this round
      const totalHeight = (matchCount - 1) * verticalSpacing;
      
      // Starting Y (centered vertically)
      const startY = -totalHeight / 2;
      
      round.matches.forEach((match, matchIndex) => {
        const y = startY + (matchIndex * verticalSpacing);
        const displayIdx = roundIndex;
        
        positions.push({
          match,
          x,
          y,
          roundIndex,
          matchIndex,
          displayIdx,
          roundName: getRoundName(displayIdx, data.rounds.length),
          matchCount
        });
      });
    });
    
    return positions;
  };

  const positions = calculatePositions();
  
  // Calculate SVG dimensions
  const minX = 0;
  const maxX = Math.max(...positions.map(p => p.x)) + 400;
  const minY = Math.min(...positions.map(p => p.y)) - 150;
  const maxY = Math.max(...positions.map(p => p.y)) + 250;
  
  const viewBoxWidth = maxX - minX;
  const viewBoxHeight = maxY - minY;

  // Draw connector lines from left matches to right (parent matches)
  const drawConnectors = () => {
    const lines = [];
    
    positions.forEach((pos) => {
      // Find parent match (next round to the right)
      const parentRoundIndex = pos.roundIndex + 1;
      if (parentRoundIndex < data.rounds.length) {
        const parentPositions = positions.filter(p => p.roundIndex === parentRoundIndex);
        const parentIndex = Math.floor(pos.matchIndex / 2);
        const parentPos = parentPositions[parentIndex];
        
        if (parentPos) {
          const startX = pos.x + 280; // Right edge of current card
          const startY = pos.y + 90; // Middle of card
          const endX = parentPos.x; // Left edge of parent card
          const endY = parentPos.y + 90; // Middle of parent card
          
          const midX = (startX + endX) / 2;
          
          lines.push(
            <path
              key={`line-${pos.roundIndex}-${pos.matchIndex}`}
              d={`M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`}
              stroke="rgba(168, 85, 247, 0.3)"
              strokeWidth="2"
              fill="none"
            />
          );
        }
      }
    });
    
    return lines;
  };

  return (
    <div className="relative py-12 overflow-x-auto">
      <div className="flex justify-center min-w-max">
        <svg
          width={viewBoxWidth}
          height={viewBoxHeight}
          viewBox={`${minX} ${minY} ${viewBoxWidth} ${viewBoxHeight}`}
          className="mx-auto"
        >
          {/* Connector lines */}
          <g>{drawConnectors()}</g>

          {/* Match cards */}
          <g>
            {positions.map((pos) => {
              const match = pos.match;
              const dbMatch = findMatch(pos.displayIdx, pos.matchIndex + 1);
              const hasPlayers = match.player1?.id && match.player2?.id;
              const isLive = dbMatch?.status === 'IN_PROGRESS';
              const isCompleted = dbMatch?.status === 'COMPLETED';
              const hasUmpire = dbMatch?.umpireId;
              
              const cardWidth = 280;
              const cardHeight = 180;
              const x = pos.x;
              const y = pos.y;

              return (
                <g key={`${pos.roundIndex}-${pos.matchIndex}`} transform={`translate(${x}, ${y})`}>
                  {/* Card background with glow effect */}
                  <defs>
                    <filter id={`glow-${pos.roundIndex}-${pos.matchIndex}`} x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  
                  <rect
                    width={cardWidth}
                    height={cardHeight}
                    rx="12"
                    fill="rgba(51, 65, 85, 0.95)"
                    stroke={isLive ? '#10b981' : isCompleted ? '#f59e0b' : 'rgba(168, 85, 247, 0.4)'}
                    strokeWidth="2"
                    filter={isLive || isCompleted ? `url(#glow-${pos.roundIndex}-${pos.matchIndex})` : 'none'}
                  />

                  {/* Round name header */}
                  <rect width={cardWidth} height="30" rx="12" fill="rgba(30, 41, 59, 0.9)" />
                  <text x={cardWidth / 2} y="20" textAnchor="middle" fill="#fbbf24" fontSize="12" fontWeight="700">
                    {pos.roundName}
                  </text>

                  {/* Match number */}
                  <text x="12" y="50" fill="#9ca3af" fontSize="11" fontWeight="600">
                    Match {match.matchNumber}
                  </text>

                  {/* Status badges */}
                  {isLive && (
                    <>
                      <rect x={cardWidth - 60} y="35" width="50" height="20" rx="10" fill="rgba(16, 185, 129, 0.2)" stroke="rgba(16, 185, 129, 0.5)" strokeWidth="1" />
                      <text x={cardWidth - 35} y="49" textAnchor="middle" fill="#10b981" fontSize="10" fontWeight="700">LIVE</text>
                    </>
                  )}
                  {isCompleted && !isLive && (
                    <>
                      <rect x={cardWidth - 65} y="35" width="55" height="20" rx="10" fill="rgba(245, 158, 11, 0.2)" stroke="rgba(245, 158, 11, 0.5)" strokeWidth="1" />
                      <text x={cardWidth - 37.5} y="49" textAnchor="middle" fill="#f59e0b" fontSize="10" fontWeight="700">DONE</text>
                    </>
                  )}

                  {/* Player 1 */}
                  <g transform="translate(0, 60)">
                    <rect
                      width={cardWidth}
                      height="50"
                      fill={match.winner === 1 || dbMatch?.winnerId === match.player1?.id ? 'rgba(168, 85, 247, 0.2)' : 'transparent'}
                    />
                    <text x="12" y="20" fill={match.winner === 1 || dbMatch?.winnerId === match.player1?.id ? '#ffffff' : '#d1d5db'} fontSize="14" fontWeight="600">
                      {(match.player1?.name || 'TBD').substring(0, 22)}
                    </text>
                    {/* Player 1 Detailed Set Scores */}
                    {isCompleted && dbMatch?.score && (
                      <text x="12" y="35" fill="#9ca3af" fontSize="10" fontWeight="500">
                        {getDetailedSetScores(dbMatch.score, 1)}
                      </text>
                    )}
                    {(match.winner === 1 || dbMatch?.winnerId === match.player1?.id) && (
                      <text x={cardWidth - 40} y="30" fill="#fbbf24" fontSize="18">👑</text>
                    )}
                  </g>

                  {/* Divider */}
                  <line x1="12" y1="110" x2={cardWidth - 12} y2="110" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1" />

                  {/* Match Score Display (center) */}
                  {isCompleted && dbMatch?.score && (
                    <g transform="translate(0, 110)">
                      <rect x={cardWidth / 2 - 40} y="-15" width="80" height="30" rx="15" fill="rgba(0, 0, 0, 0.7)" stroke="rgba(168, 85, 247, 0.3)" strokeWidth="1" />
                      <text x={cardWidth / 2} y="5" textAnchor="middle" fill="#a855f7" fontSize="11" fontWeight="700">
                        {getCompleteMatchScore(dbMatch.score)}
                      </text>
                    </g>
                  )}

                  {/* Player 2 */}
                  <g transform="translate(0, 110)">
                    <rect
                      width={cardWidth}
                      height="50"
                      fill={match.winner === 2 || dbMatch?.winnerId === match.player2?.id ? 'rgba(168, 85, 247, 0.2)' : 'transparent'}
                    />
                    <text x="12" y="20" fill={match.winner === 2 || dbMatch?.winnerId === match.player2?.id ? '#ffffff' : '#d1d5db'} fontSize="14" fontWeight="600">
                      {(match.player2?.name || 'TBD').substring(0, 22)}
                    </text>
                    {/* Player 2 Detailed Set Scores */}
                    {isCompleted && dbMatch?.score && (
                      <text x="12" y="35" fill="#9ca3af" fontSize="10" fontWeight="500">
                        {getDetailedSetScores(dbMatch.score, 2)}
                      </text>
                    )}
                    {(match.winner === 2 || dbMatch?.winnerId === match.player2?.id) && (
                      <text x={cardWidth - 40} y="30" fill="#fbbf24" fontSize="18">👑</text>
                    )}
                  </g>

                  {/* Umpire Assignment Button */}
                  {isOrganizer && hasPlayers && !isCompleted && (
                    <g
                      onClick={() => {
                        const bracketMatchData = {
                          matchNumber: match.matchNumber,
                          round: pos.displayIdx + 1,
                          player1: match.player1,
                          player2: match.player2
                        };
                        onAssignUmpire(dbMatch, bracketMatchData);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Umpire Button Background with Glow */}
                      <defs>
                        <filter id={`umpire-glow-${pos.roundIndex}-${pos.matchIndex}`} x="-50%" y="-50%" width="200%" height="200%">
                          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                          <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                          </feMerge>
                        </filter>
                      </defs>
                      
                      <rect 
                        x={cardWidth - 50} 
                        y="162" 
                        width="40" 
                        height="16" 
                        rx="8" 
                        fill={hasUmpire ? "rgba(34, 197, 94, 0.3)" : "rgba(59, 130, 246, 0.3)"} 
                        stroke={hasUmpire ? "#22c55e" : "#3b82f6"} 
                        strokeWidth="1.5"
                        filter={`url(#umpire-glow-${pos.roundIndex}-${pos.matchIndex})`}
                      />
                      
                      {/* Umpire Icon */}
                      <text 
                        x={cardWidth - 30} 
                        y="172" 
                        textAnchor="middle" 
                        fill={hasUmpire ? "#22c55e" : "#3b82f6"} 
                        fontSize="10" 
                        fontWeight="700"
                      >
                        ⚖️
                      </text>
                      
                      {/* Status Indicator */}
                      {hasUmpire && (
                        <circle 
                          cx={cardWidth - 15} 
                          cy="166" 
                          r="2" 
                          fill="#22c55e"
                        />
                      )}
                    </g>
                  )}

                  {/* Match Status Text */}
                  {isOrganizer && hasPlayers && !isCompleted && (
                    <text 
                      x="12" 
                      y="173" 
                      fill="#9ca3af" 
                      fontSize="8" 
                      fontWeight="500"
                    >
                      {hasUmpire ? "Ready to start" : "Click ⚖️ to assign umpire"}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
};

// Round Robin Display with Match Schedule
const RoundRobinDisplay = ({ data, matches, user, isOrganizer, onAssignUmpire }) => {
  if (!data?.groups) return <p className="text-gray-400 text-center p-8">No group data</p>;

  // Find database matches for each group match
  const findDbMatch = (groupMatch, groupIndex) => {
    if (!matches || !Array.isArray(matches)) return null;
    // Look for match by group and match number
    return matches.find(m => 
      m.player1Id === groupMatch.player1?.id && 
      m.player2Id === groupMatch.player2?.id
    );
  };

  return (
    <div className="p-6 space-y-8">
      {data.groups.map((group, gi) => (
        <div key={gi} className="bg-slate-700/30 rounded-xl overflow-hidden">
          {/* Group Header */}
          <div className="bg-gradient-to-r from-purple-600/20 to-indigo-600/20 p-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 bg-purple-500/30 rounded-xl flex items-center justify-center text-purple-300 font-bold text-lg">
                  {String.fromCharCode(65 + gi)}
                </span>
                <div>
                  <h4 className="text-xl font-bold text-white">Group {String.fromCharCode(65 + gi)}</h4>
                  <p className="text-purple-300 text-sm">
                    {group.participants.filter(p => p.id).length} players • {group.matches?.length || 0} matches
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Round Robin Format</p>
                <p className="text-sm text-purple-300 font-semibold">Everyone plays everyone</p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 p-6">
            {/* Left: Match Schedule */}
            <div>
              <h5 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400 text-sm">📅</span>
                Match Schedule
              </h5>
              
              {group.matches && group.matches.length > 0 ? (
                <div className="space-y-3">
                  {group.matches.map((match, mi) => {
                    const dbMatch = findDbMatch(match, gi);
                    const hasPlayers = match.player1?.id && match.player2?.id;
                    const isCompleted = dbMatch?.status === 'COMPLETED';
                    const isInProgress = dbMatch?.status === 'IN_PROGRESS';
                    const hasUmpire = dbMatch?.umpireId;
                    
                    return (
                      <div 
                        key={mi} 
                        className={`p-4 rounded-xl border transition-all ${
                          isCompleted 
                            ? 'border-emerald-500/30 bg-emerald-500/10' 
                            : isInProgress
                              ? 'border-amber-500/30 bg-amber-500/10'
                              : hasPlayers
                                ? 'border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20'
                                : 'border-white/10 bg-slate-800/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs font-bold">
                                Match {match.matchNumber}
                              </span>
                              {isCompleted && <span className="text-emerald-400 text-sm">✅ Complete</span>}
                              {isInProgress && <span className="text-amber-400 text-sm">🔴 Live</span>}
                              {hasUmpire && !isCompleted && !isInProgress && <span className="text-blue-400 text-sm">⚖️ Umpire Ready</span>}
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <span className={`font-medium ${hasPlayers ? 'text-white' : 'text-gray-500'}`}>
                                {match.player1?.name || 'TBD'}
                              </span>
                              <span className="text-gray-400 text-sm">vs</span>
                              <span className={`font-medium ${hasPlayers ? 'text-white' : 'text-gray-500'}`}>
                                {match.player2?.name || 'TBD'}
                              </span>
                            </div>
                            
                            {dbMatch?.winnerId && (
                              <div className="mt-2 text-sm">
                                <span className="text-emerald-400">
                                  Winner: {dbMatch.winnerId === match.player1?.id ? match.player1?.name : match.player2?.name}
                                </span>
                                {/* Display detailed set scores for both players */}
                                {dbMatch.score && (
                                  <div className="mt-2 space-y-1">
                                    <div className="text-xs text-gray-300">
                                      <span className="font-medium">{match.player1?.name}:</span> {getDetailedSetScores(dbMatch.score, 1)}
                                    </div>
                                    <div className="text-xs text-gray-300">
                                      <span className="font-medium">{match.player2?.name}:</span> {getDetailedSetScores(dbMatch.score, 2)}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {/* Umpire Assignment Button */}
                          {isOrganizer && hasPlayers && !isCompleted && (
                            <button
                              onClick={() => {
                                const bracketMatchData = {
                                  matchNumber: match.matchNumber,
                                  round: 1,
                                  player1: match.player1,
                                  player2: match.player2,
                                  groupName: group.groupName
                                };
                                onAssignUmpire(dbMatch, bracketMatchData);
                              }}
                              className={`px-3 py-2 rounded-lg transition-all flex items-center gap-2 text-sm font-medium ${
                                hasUmpire 
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30'
                              }`}
                            >
                              <span className="text-base">⚖️</span>
                              {hasUmpire ? 'Ready' : 'Assign'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No matches generated yet</p>
                  <p className="text-sm">Assign players to generate matches</p>
                </div>
              )}
            </div>

            {/* Right: Standings Table */}
            <div>
              <h5 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-amber-500/20 rounded-lg flex items-center justify-center text-amber-400 text-sm">🏆</span>
                Group Standings
              </h5>
              
              <div className="bg-slate-800/50 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-700/50 border-b border-white/10">
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">#</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">Player</th>
                      <th className="text-center py-3 px-4 text-gray-400 font-semibold">P</th>
                      <th className="text-center py-3 px-4 text-gray-400 font-semibold">W</th>
                      <th className="text-center py-3 px-4 text-gray-400 font-semibold">L</th>
                      <th className="text-center py-3 px-4 text-gray-400 font-semibold">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.participants
                      .sort((a, b) => (b.points || 0) - (a.points || 0)) // Sort by points
                      .map((p, pi) => (
                        <tr key={pi} className="border-b border-white/5 hover:bg-white/5">
                          <td className="py-3 px-4">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              pi === 0 ? 'bg-amber-500/20 text-amber-400' : 
                              pi === 1 ? 'bg-gray-400/20 text-gray-400' :
                              pi === 2 ? 'bg-orange-500/20 text-orange-400' :
                              'bg-slate-600/20 text-gray-500'
                            }`}>
                              {pi + 1}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`font-medium ${p.id ? 'text-white' : 'text-gray-500'}`}>
                              {p.name || `Slot ${pi + 1}`}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center text-gray-400">{p.played || 0}</td>
                          <td className="py-3 px-4 text-center text-emerald-400 font-semibold">{p.wins || 0}</td>
                          <td className="py-3 px-4 text-center text-red-400 font-semibold">{p.losses || 0}</td>
                          <td className="py-3 px-4 text-center text-amber-400 font-bold">{p.points || 0}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              
              {/* Points System Explanation */}
              <div className="mt-4 p-3 bg-slate-800/30 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Points System:</p>
                <div className="flex gap-4 text-xs">
                  <span className="text-emerald-400">Win: +2 pts</span>
                  <span className="text-red-400">Loss: +0 pts</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Groups + Knockout Display
// Stage 1: Round Robin groups, Stage 2: Knockout bracket (horizontal left-to-right)
const GroupsKnockoutDisplay = ({ data, matches, user, isOrganizer, onAssignUmpire }) => {
  return (
    <div className="space-y-8 p-6">
      {/* Group Stage */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-3">
          <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-lg text-sm font-semibold">Stage 1</span>
          Group Stage (Round Robin)
        </h3>
        <RoundRobinDisplay 
          data={data} 
          matches={matches} 
          user={user} 
          isOrganizer={isOrganizer} 
          onAssignUmpire={onAssignUmpire} 
        />
      </div>

      {/* Knockout Stage */}
      {data.knockout && (
        <div>
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-3">
            <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-lg text-sm font-semibold">Stage 2</span>
            Knockout Stage (Horizontal Bracket)
          </h3>
          <KnockoutDisplay 
            data={data.knockout} 
            matches={matches} 
            user={user} 
            isOrganizer={isOrganizer} 
            onAssignUmpire={onAssignUmpire}
          />
        </div>
      )}
    </div>
  );
};

// Draw Configuration Modal
const DrawConfigModal = ({ category, existingDraw, onClose, onSave, saving }) => {
  const maxParticipants = category.maxParticipants || 32;
  
  const [config, setConfig] = useState({
    format: existingDraw?.format || category.tournamentFormat || 'KNOCKOUT',
    bracketSize: existingDraw?.bracketSize || maxParticipants,
    numberOfGroups: existingDraw?.numberOfGroups || 4,
    advanceFromGroup: existingDraw?.advanceFromGroup || 2
  });

  const formatOptions = [
    { value: 'KNOCKOUT', label: 'Knockout', icon: '🏆', desc: 'Single elimination. Lose once, you\'re out.' },
    { value: 'ROUND_ROBIN', label: 'Round Robin', icon: '🔄', desc: 'Everyone plays everyone in the group.' },
    { value: 'ROUND_ROBIN_KNOCKOUT', label: 'Round Robin + Knockout', icon: '⚡', desc: 'Round robin groups, then knockout finals.' }
  ];

  const groupOptions = [2, 4, 8, 16].filter(n => n <= config.bracketSize / 2);

  const handleSave = () => {
    onSave(config);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-white/10 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Configure Draw</h2>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <p className="text-gray-400 text-sm mt-1">{category.name} • Max {maxParticipants} participants</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-3">Tournament Format</label>
            <div className="space-y-3">
              {formatOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setConfig({ ...config, format: option.value })}
                  className={`w-full p-4 rounded-xl text-left transition-all ${
                    config.format === option.value
                      ? 'bg-amber-500/20 border-2 border-amber-500'
                      : 'bg-slate-700/50 border-2 border-transparent hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{option.icon}</span>
                    <div>
                      <div className="font-semibold text-white">{option.label}</div>
                      <div className="text-sm text-gray-400">{option.desc}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Bracket Size */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Draw Size (Slots)</label>
            <select
              value={config.bracketSize}
              onChange={(e) => setConfig({ ...config, bracketSize: parseInt(e.target.value) })}
              className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-amber-500"
            >
              {[2, 4, 8, 16, 32, 64, 128].map(size => (
                <option key={size} value={size}>{size} Players</option>
              ))}
            </select>
          </div>

          {/* Group Settings (for Round Robin formats) */}
          {(config.format === 'ROUND_ROBIN' || config.format === 'ROUND_ROBIN_KNOCKOUT') && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Number of Groups</label>
                <div className="grid grid-cols-4 gap-2">
                  {groupOptions.map(num => (
                    <button
                      key={num}
                      onClick={() => setConfig({ ...config, numberOfGroups: num })}
                      className={`py-3 rounded-xl font-semibold transition-all ${
                        config.numberOfGroups === num
                          ? 'bg-purple-500 text-white'
                          : 'bg-slate-700/50 text-gray-300 hover:bg-slate-700'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {config.numberOfGroups} groups × {Math.floor(config.bracketSize / config.numberOfGroups)} players each
                </p>
              </div>

              {config.format === 'ROUND_ROBIN_KNOCKOUT' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Players Advancing from Each Group</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map(num => (
                      <button
                        key={num}
                        onClick={() => setConfig({ ...config, advanceFromGroup: num })}
                        className={`py-3 rounded-xl font-semibold transition-all ${
                          config.advanceFromGroup === num
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-700/50 text-gray-300 hover:bg-slate-700'
                        }`}
                      >
                        Top {num}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {config.numberOfGroups * config.advanceFromGroup} players will advance to knockout stage
                  </p>
                </div>
              )}
            </>
          )}

          {/* Preview */}
          <div className="bg-slate-700/30 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-gray-300 mb-2">Draw Preview</h4>
            <div className="text-sm text-gray-400">
              {config.format === 'KNOCKOUT' && (
                <p>🏆 {config.bracketSize}-player knockout bracket with {Math.log2(config.bracketSize)} rounds</p>
              )}
              {config.format === 'ROUND_ROBIN' && (
                <p>🔄 {config.numberOfGroups} groups of {Math.floor(config.bracketSize / config.numberOfGroups)} players each playing round robin</p>
              )}
              {config.format === 'ROUND_ROBIN_KNOCKOUT' && (
                <>
                  <p>⚡ Stage 1: {config.numberOfGroups} groups × {Math.floor(config.bracketSize / config.numberOfGroups)} players (Round Robin)</p>
                  <p className="mt-1">⚡ Stage 2: Top {config.advanceFromGroup} from each group → {config.numberOfGroups * config.advanceFromGroup}-player Knockout</p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-white/10 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-3 bg-slate-700 text-gray-300 rounded-xl hover:bg-slate-600 transition-colors font-semibold">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:shadow-lg hover:shadow-amber-500/25 transition-all font-semibold disabled:opacity-50"
          >
            {saving ? 'Creating...' : existingDraw ? 'Update Draw' : 'Create Draw'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DrawPage;

// Delete Draw Confirmation Modal
const DeleteDrawModal = ({ categoryName, onClose, onConfirm, deleting }) => {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-white/10 rounded-2xl max-w-md w-full">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Delete Draw</h2>
              <p className="text-gray-400 text-sm">{categoryName}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <p className="text-gray-300">
            Are you sure you want to delete this draw? This action cannot be undone and all bracket data will be lost.
          </p>
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">
                All match assignments and player positions will be removed. You'll need to create a new draw and reassign players.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-white/10 flex gap-3">
          <button 
            onClick={onClose} 
            className="flex-1 px-4 py-3 bg-slate-700 text-gray-300 rounded-xl hover:bg-slate-600 transition-colors font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:shadow-lg hover:shadow-red-500/25 transition-all font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {deleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete Draw
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Slot Card Component for player assignment
const SlotCard = ({ slot, assigned, canAccept, onSlotClick, onRemove, playerLabel }) => {
  return (
    <div
      onClick={onSlotClick}
      className={`p-3 rounded-xl border-2 transition-all ${
        assigned
          ? 'border-emerald-500/50 bg-emerald-500/10 border-solid'
          : canAccept
            ? 'border-purple-500 bg-purple-500/10 border-dashed cursor-pointer hover:bg-purple-500/20 hover:shadow-lg hover:shadow-purple-500/20'
            : 'border-white/20 bg-slate-800/50 border-dashed'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            assigned 
              ? 'bg-emerald-500/20' 
              : canAccept 
                ? 'bg-purple-500/20' 
                : 'bg-slate-700/50'
          }`}>
            {assigned ? (
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            ) : (
              <Users className={`w-5 h-5 ${canAccept ? 'text-purple-400' : 'text-gray-500'}`} />
            )}
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-0.5">{playerLabel}</div>
            {assigned ? (
              <span className="text-white font-medium">{assigned.playerName}</span>
            ) : (
              <span className={`text-sm ${canAccept ? 'text-purple-400' : 'text-gray-500'}`}>
                {canAccept ? 'Click to assign' : 'Empty slot'}
              </span>
            )}
          </div>
        </div>
        {assigned && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-red-400" />
          </button>
        )}
      </div>
    </div>
  );
};

// Compact Slot Card for two-column layout with drag-and-drop support
const CompactSlotCard = ({ slot, assigned, canAccept, onSlotClick, onRemove, playerLabel, locked, onDragStart, onDragOver, onDrop, isDragOver }) => {
  const handleDragStart = (e) => {
    if (locked || !assigned) return;
    e.dataTransfer.setData('text/plain', JSON.stringify({
      sourceSlot: slot.slot,
      playerId: assigned.playerId,
      playerName: assigned.playerName
    }));
    onDragStart && onDragStart(slot.slot);
  };

  const handleDragOver = (e) => {
    if (locked) return;
    e.preventDefault();
    onDragOver && onDragOver(slot.slot);
  };

  const handleDrop = (e) => {
    if (locked) return;
    e.preventDefault();
    try {
      const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
      onDrop && onDrop(dragData, slot.slot);
    } catch (err) {
      console.error('Invalid drag data:', err);
    }
  };

  return (
    <div
      onClick={locked ? undefined : onSlotClick}
      draggable={assigned && !locked}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`px-2 py-1.5 rounded-lg border transition-all ${
        locked
          ? 'border-amber-500/30 bg-amber-500/5 cursor-not-allowed'
          : isDragOver
            ? 'border-emerald-500 bg-emerald-500/20 border-dashed'
            : assigned
              ? 'border-emerald-500/50 bg-emerald-500/10 border-solid cursor-move'
              : canAccept
                ? 'border-purple-500 bg-purple-500/10 border-dashed cursor-pointer hover:bg-purple-500/20'
                : 'border-white/10 bg-slate-800/30 border-dashed'
      }`}
      title={assigned && !locked ? 'Drag to move player to another slot' : undefined}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
            locked
              ? 'bg-amber-500/20 text-amber-400'
              : assigned 
                ? 'bg-emerald-500/20 text-emerald-400' 
                : 'bg-slate-700/50 text-gray-500'
          }`}>
            {playerLabel}
          </span>
          {assigned ? (
            <span className={`font-medium text-sm truncate ${locked ? 'text-amber-300' : 'text-white'}`}>
              {assigned.playerName}
            </span>
          ) : (
            <span className={`text-xs truncate ${canAccept ? 'text-purple-400' : 'text-gray-500'}`}>
              {canAccept ? 'Click to assign' : 'Empty'}
            </span>
          )}
        </div>
        {assigned && !locked && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="p-1 hover:bg-red-500/20 rounded transition-colors flex-shrink-0"
          >
            <X className="w-3 h-3 text-red-400" />
          </button>
        )}
        {locked && (
          <span className="text-amber-500 text-xs">🔒</span>
        )}
      </div>
    </div>
  );
};

// Assign Players Modal
const AssignPlayersModal = ({ bracket, players, matches, loading, onClose, onSave, saving, tournamentId, activeCategory, setBracket, setSuccess, setError, setShowAssignModal }) => {
  const [assignments, setAssignments] = useState({});  // { slot: { playerId, playerName } }
  const [selectedPlayer, setSelectedPlayer] = useState(null);  // Currently selected player
  const [dragOverSlot, setDragOverSlot] = useState(null);  // Slot being dragged over

  // Get total rounds for round mapping
  const totalRounds = bracket?.rounds?.length || 1;

  // Check if a match is locked (completed or in progress)
  const isMatchLocked = (matchIndex) => {
    // First round matches in display = highest round number in DB
    // Display index 0 = DB round (totalRounds)
    const dbRound = totalRounds;
    const matchNum = matchIndex + 1;
    const dbMatch = matches?.find(m => m.round === dbRound && m.matchNumber === matchNum);
    return dbMatch?.status === 'COMPLETED' || dbMatch?.status === 'IN_PROGRESS';
  };

  // Get total slots from bracket
  const getSlots = () => {
    if (!bracket) return [];
    
    const slots = [];
    if (bracket.format === 'KNOCKOUT' && bracket.rounds?.[0]) {
      bracket.rounds[0].matches.forEach((match, idx) => {
        const locked = isMatchLocked(idx);
        slots.push({
          slot: idx * 2 + 1,
          currentPlayer: match.player1?.id ? match.player1 : null,
          label: `Match ${match.matchNumber} - Player 1`,
          matchIndex: idx,
          locked
        });
        slots.push({
          slot: idx * 2 + 2,
          currentPlayer: match.player2?.id ? match.player2 : null,
          label: `Match ${match.matchNumber} - Player 2`,
          matchIndex: idx,
          locked
        });
      });
    } else if (bracket.groups) {
      let slotNum = 1;
      bracket.groups.forEach((group, gi) => {
        group.participants.forEach((p, pi) => {
          slots.push({
            slot: slotNum,
            currentPlayer: p.id ? p : null,
            label: `Group ${String.fromCharCode(65 + gi)} - Position ${pi + 1}`,
            locked: false // Round robin groups don't lock individual slots
          });
          slotNum++;
        });
      });
    }
    return slots;
  };

  const slots = getSlots();

  // Initialize assignments from current bracket - ensure no duplicates
  useEffect(() => {
    const initial = {};
    const usedPlayerIds = new Set();
    
    slots.forEach(s => {
      if (s.currentPlayer?.id && !usedPlayerIds.has(s.currentPlayer.id)) {
        initial[s.slot] = {
          playerId: s.currentPlayer.id,
          playerName: s.currentPlayer.name
        };
        usedPlayerIds.add(s.currentPlayer.id);
      }
    });
    setAssignments(initial);
  }, [bracket]);

  // Select a player
  const handleSelectPlayer = (player) => {
    if (selectedPlayer?.id === player.id) {
      // Deselect if clicking same player
      setSelectedPlayer(null);
    } else {
      setSelectedPlayer(player);
    }
  };

  // Click on a slot to assign selected player
  const handleSlotClick = (targetSlot) => {
    if (!selectedPlayer) return;
    if (targetSlot.locked) return; // Don't allow changes to locked slots
    
    // Create new assignments object
    const newAssignments = { ...assignments };
    
    // Remove this player from any existing slot (only if that slot is not locked)
    Object.keys(newAssignments).forEach(slotKey => {
      if (newAssignments[slotKey]?.playerId === selectedPlayer.id) {
        const slot = slots.find(s => s.slot === parseInt(slotKey));
        if (!slot?.locked) {
          delete newAssignments[slotKey];
        }
      }
    });
    
    // Assign player to the new slot
    newAssignments[targetSlot.slot] = {
      playerId: selectedPlayer.id,
      playerName: selectedPlayer.name
    };
    
    setAssignments(newAssignments);
    setSelectedPlayer(null);  // Deselect after assigning
  };

  const handleRemoveAssignment = (slotNum) => {
    const slot = slots.find(s => s.slot === slotNum);
    if (slot?.locked) return; // Don't allow removal from locked slots
    
    const newAssignments = { ...assignments };
    delete newAssignments[slotNum];
    setAssignments(newAssignments);
  };

  const getAssignedPlayer = (slotNum) => {
    return assignments[slotNum] || null;
  };

  const isPlayerAssigned = (playerId) => {
    return Object.values(assignments).some(a => a?.playerId === playerId);
  };

  // Drag and Drop Handlers
  const handleDragStart = (sourceSlot) => {
    // Visual feedback can be added here if needed
  };

  const handleDragOver = (targetSlot) => {
    setDragOverSlot(targetSlot);
  };

  const handleDrop = (dragData, targetSlot) => {
    setDragOverSlot(null);
    
    const sourceSlot = dragData.sourceSlot;
    const targetSlotData = slots.find(s => s.slot === targetSlot);
    const sourceSlotData = slots.find(s => s.slot === sourceSlot);
    
    // Don't allow drops on locked slots
    if (targetSlotData?.locked || sourceSlotData?.locked) return;
    
    // Don't drop on same slot
    if (sourceSlot === targetSlot) return;
    
    const newAssignments = { ...assignments };
    
    // Get current assignments
    const sourceAssignment = newAssignments[sourceSlot];
    const targetAssignment = newAssignments[targetSlot];
    
    // Swap assignments
    if (targetAssignment) {
      // Swap players
      newAssignments[sourceSlot] = targetAssignment;
      newAssignments[targetSlot] = sourceAssignment;
    } else {
      // Move player to empty slot
      newAssignments[targetSlot] = sourceAssignment;
      delete newAssignments[sourceSlot];
    }
    
    setAssignments(newAssignments);
  };

  // Add All Players - automatically assign all registered players to available slots
  const handleAddAllPlayers = async () => {
    try {
      setError(null);
      const response = await drawAPI.bulkAssignAllPlayers(tournamentId, activeCategory.id);
      const draw = response.draw;
      const bracketData = draw.bracketJson || draw.bracket;
      setBracket(typeof bracketData === 'string' ? JSON.parse(bracketData) : bracketData);
      setSuccess('All available players assigned successfully!');
      setShowAssignModal(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error bulk assigning players:', err);
      setError(err.response?.data?.error || 'Failed to assign all players');
    }
  };

  // Shuffle All Players - randomly redistribute all assigned players
  const handleShuffleAllPlayers = async () => {
    try {
      setError(null);
      const response = await drawAPI.shuffleAssignedPlayers(tournamentId, activeCategory.id);
      const draw = response.draw;
      const bracketData = draw.bracketJson || draw.bracket;
      setBracket(typeof bracketData === 'string' ? JSON.parse(bracketData) : bracketData);
      setSuccess('Players shuffled successfully!');
      setShowAssignModal(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error shuffling players:', err);
      setError(err.response?.data?.error || 'Failed to shuffle players');
    }
  };

  const handleSave = () => {
    // Convert object to array format for API
    const assignmentsArray = Object.entries(assignments).map(([slot, data]) => ({
      slot: parseInt(slot),
      playerId: data.playerId,
      playerName: data.playerName
    }));
    onSave(assignmentsArray);
  };

  const assignedCount = Object.keys(assignments).length;
  const unassignedPlayersCount = players.filter(p => !isPlayerAssigned(p.id)).length;
  const availableSlotsCount = slots.filter(s => !s.locked && !getAssignedPlayer(s.slot)).length;
  const canAddAll = unassignedPlayersCount > 0 && availableSlotsCount > 0;
  const canShuffle = assignedCount > 1 && slots.some(s => !s.locked && getAssignedPlayer(s.slot));

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-white/10 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Assign Players to Draw</h2>
                <p className="text-gray-400 text-sm">Click a player, then click a slot to assign</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          
          {/* Bulk Action Buttons */}
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleAddAllPlayers}
              disabled={!canAddAll}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              title={canAddAll ? `Add ${Math.min(unassignedPlayersCount, availableSlotsCount)} unassigned players to available slots` : 'No unassigned players or available slots'}
            >
              <Users className="w-4 h-4" />
              Add All Players
              {canAddAll && (
                <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">
                  +{Math.min(unassignedPlayersCount, availableSlotsCount)}
                </span>
              )}
            </button>
            
            <button
              onClick={handleShuffleAllPlayers}
              disabled={!canShuffle}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              title={canShuffle ? 'Randomly redistribute all assigned players (locked matches unchanged)' : 'Need at least 2 assigned players to shuffle'}
            >
              <Zap className="w-4 h-4" />
              Shuffle All Players
            </button>
          </div>
          
          {selectedPlayer && (
            <div className="mt-3 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-xl flex items-center justify-between">
              <span className="text-purple-300 text-sm">
                Selected: <span className="font-semibold text-white">{selectedPlayer.name}</span> — Click a slot to assign
              </span>
              <button 
                onClick={() => setSelectedPlayer(null)}
                className="text-purple-400 hover:text-purple-300 text-sm"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* Players List */}
          <div className="w-1/3 border-r border-white/10 p-4 overflow-y-auto scroll-smooth scrollbar-thin">
            <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">
              Registered Players ({players.length})
            </h3>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : players.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No registered players</p>
              </div>
            ) : (
              <div className="space-y-2">
                {players.map((player) => {
                  const assigned = isPlayerAssigned(player.id);
                  const isSelected = selectedPlayer?.id === player.id;
                  return (
                    <div
                      key={player.id}
                      onClick={() => handleSelectPlayer(player)}
                      className={`p-3 rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-purple-500/30 border-2 border-purple-500 shadow-lg shadow-purple-500/20'
                          : assigned
                            ? 'bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'bg-slate-700/50 border border-transparent hover:bg-slate-700 hover:shadow-lg hover:shadow-purple-500/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ${
                          isSelected
                            ? 'bg-gradient-to-br from-purple-400 to-violet-600 ring-2 ring-purple-400'
                            : assigned 
                              ? 'bg-gradient-to-br from-emerald-500 to-teal-600' 
                              : 'bg-gradient-to-br from-purple-500 to-indigo-600'
                        }`}>
                          {player.seed}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">{player.name}</p>
                          <p className="text-gray-500 text-xs truncate">{player.email}</p>
                        </div>
                        {isSelected ? (
                          <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        ) : assigned ? (
                          <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Slots Grid - Grouped by Match */}
          <div className="flex-1 p-4 overflow-y-auto scroll-smooth scrollbar-thin">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                Draw Slots ({slots.length})
              </h3>
              {assignedCount > 0 && (
                <button
                  onClick={() => {
                    // Only clear unlocked slots
                    const newAssignments = {};
                    Object.entries(assignments).forEach(([slotKey, data]) => {
                      const slot = slots.find(s => s.slot === parseInt(slotKey));
                      if (slot?.locked) {
                        newAssignments[slotKey] = data;
                      }
                    });
                    setAssignments(newAssignments);
                  }}
                  className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2 py-1 rounded-lg transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>
            {/* Two-column grid for matches */}
            <div className="grid grid-cols-2 gap-3">
              {/* Group slots into pairs (matches) */}
              {Array.from({ length: Math.ceil(slots.length / 2) }, (_, matchIndex) => {
                const slot1 = slots[matchIndex * 2];
                const slot2 = slots[matchIndex * 2 + 1];
                const matchNum = matchIndex + 1;
                const isMatchLocked = slot1?.locked || slot2?.locked;
                
                return (
                  <div key={matchIndex} className={`bg-slate-700/30 rounded-xl border overflow-hidden ${
                    isMatchLocked ? 'border-amber-500/30 bg-amber-500/5' : 'border-white/10'
                  }`}>
                    {/* Match Header - Compact */}
                    <div className={`px-3 py-1.5 border-b border-white/10 flex items-center gap-2 ${
                      isMatchLocked 
                        ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20' 
                        : 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20'
                    }`}>
                      <span className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold ${
                        isMatchLocked ? 'bg-amber-500/30 text-amber-300' : 'bg-purple-500/30 text-purple-300'
                      }`}>{matchNum}</span>
                      <span className={`font-semibold text-xs ${isMatchLocked ? 'text-amber-300' : 'text-purple-300'}`}>
                        Match {matchNum}
                      </span>
                      {isMatchLocked && (
                        <span className="ml-auto px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-bold rounded">
                          🔒 LOCKED
                        </span>
                      )}
                    </div>
                    
                    {/* Players Container - Compact */}
                    <div className="p-2 space-y-1">
                      {/* Player 1 Slot */}
                      {slot1 && (
                        <CompactSlotCard 
                          slot={slot1}
                          assigned={getAssignedPlayer(slot1.slot)}
                          canAccept={selectedPlayer && !getAssignedPlayer(slot1.slot) && !slot1.locked}
                          onSlotClick={() => selectedPlayer && !getAssignedPlayer(slot1.slot) && !slot1.locked && handleSlotClick(slot1)}
                          onRemove={() => !slot1.locked && handleRemoveAssignment(slot1.slot)}
                          playerLabel="P1"
                          locked={slot1.locked}
                          onDragStart={handleDragStart}
                          onDragOver={handleDragOver}
                          onDrop={handleDrop}
                          isDragOver={dragOverSlot === slot1.slot}
                        />
                      )}
                      
                      {/* VS Divider - Minimal */}
                      <div className="flex items-center gap-1 px-1">
                        <div className="flex-1 h-px bg-white/10"></div>
                        <span className="text-[10px] text-gray-600 font-bold">VS</span>
                        <div className="flex-1 h-px bg-white/10"></div>
                      </div>
                      
                      {/* Player 2 Slot */}
                      {slot2 && (
                        <CompactSlotCard 
                          slot={slot2}
                          assigned={getAssignedPlayer(slot2.slot)}
                          canAccept={selectedPlayer && !getAssignedPlayer(slot2.slot) && !slot2.locked}
                          onSlotClick={() => selectedPlayer && !getAssignedPlayer(slot2.slot) && !slot2.locked && handleSlotClick(slot2)}
                          onRemove={() => !slot2.locked && handleRemoveAssignment(slot2.slot)}
                          playerLabel="P2"
                          locked={slot2.locked}
                          onDragStart={handleDragStart}
                          onDragOver={handleDragOver}
                          onDrop={handleDrop}
                          isDragOver={dragOverSlot === slot2.slot}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-white/10 flex items-center justify-between">
          <div className="text-sm text-gray-400">
            {assignedCount} of {slots.length} slots assigned
          </div>
          <div className="flex gap-3">
            <button 
              onClick={onClose} 
              className="px-6 py-3 bg-slate-700 text-gray-300 rounded-xl hover:bg-slate-600 transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all font-semibold disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Save Assignments
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Assign Umpire Modal
const AssignUmpireModal = ({ match, umpires, onClose, onAssign }) => {
  const navigate = useNavigate();
  const [selectedUmpire, setSelectedUmpire] = useState(match?.umpireId || null);
  const [assigning, setAssigning] = useState(false);

  const handleAssign = async () => {
    if (!selectedUmpire) return;
    setAssigning(true);
    await onAssign(selectedUmpire);
    setAssigning(false);
  };

  // Navigate to conduct match page with selected umpire
  const handleConductMatch = () => {
    if (!selectedUmpire || !match?.id) return;
    // Navigate to the umpire scoring page
    navigate(`/match/${match.id}/conduct?umpireId=${selectedUmpire}`);
  };

  const selectedUmpireData = umpires.find(u => u.id === selectedUmpire);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-white/10 rounded-2xl max-w-md w-full">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Gavel className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Assign Umpire & Start Match</h2>
                <p className="text-gray-400 text-sm">
                  Match {match?.matchNumber} • {match?.player1?.name || 'TBD'} vs {match?.player2?.name || 'TBD'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {umpires.length === 0 ? (
            <div className="text-center py-8">
              <Gavel className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No umpires added to this tournament</p>
              <p className="text-gray-500 text-sm mt-1">Add umpires from the tournament settings first</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto scroll-smooth scrollbar-thin">
              {umpires.map((umpire) => (
                <div
                  key={umpire.id}
                  onClick={() => setSelectedUmpire(umpire.id)}
                  className={`p-3 rounded-xl cursor-pointer transition-all ${
                    selectedUmpire === umpire.id
                      ? 'bg-blue-500/20 border-2 border-blue-500'
                      : 'bg-slate-700/50 border-2 border-transparent hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${
                      selectedUmpire === umpire.id
                        ? 'bg-gradient-to-br from-blue-400 to-cyan-600'
                        : 'bg-gradient-to-br from-slate-500 to-slate-600'
                    }`}>
                      {umpire.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{umpire.name}</p>
                      <p className="text-gray-500 text-xs truncate">{umpire.email}</p>
                    </div>
                    {selectedUmpire === umpire.id && (
                      <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Selected Umpire Info */}
          {selectedUmpireData && (
            <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
              <p className="text-emerald-300 text-sm">
                <span className="font-semibold">{selectedUmpireData.name}</span> will conduct this match
              </p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/10 space-y-3">
          {/* Quick Start Match Button - Primary action */}
          <button
            onClick={handleConductMatch}
            disabled={!selectedUmpire || umpires.length === 0}
            className="w-full px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Gavel className="w-5 h-5" />
            {selectedUmpire ? "Start Match" : "Select Umpire to Start"}
          </button>
          
          {/* Secondary actions */}
          <div className="flex gap-3">
            <button 
              onClick={onClose} 
              className="flex-1 px-4 py-2.5 bg-slate-700 text-gray-300 rounded-xl hover:bg-slate-600 transition-colors font-medium text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={!selectedUmpire || assigning || umpires.length === 0}
              className="flex-1 px-4 py-2.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-xl hover:bg-blue-500/30 transition-all font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {assigning ? (
                <>
                  <div className="w-3 h-3 border-2 border-blue-300/30 border-t-blue-300 rounded-full animate-spin"></div>
                  Assigning...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Assign Only
                </>
              )}
            </button>
          </div>
          
          {/* Quick Info */}
          {selectedUmpireData && (
            <div className="text-center">
              <p className="text-xs text-gray-500">
                Press "Start Match" to assign <span className="text-emerald-400 font-medium">{selectedUmpireData.name}</span> and begin scoring
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
