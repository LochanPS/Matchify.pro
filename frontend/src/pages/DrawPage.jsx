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
import { Loader, Zap, Layers, X, Plus, Settings, Users, CheckCircle, AlertTriangle, Trash2, UserPlus, Gavel, AlertCircle, Play, Trophy, Clock } from 'lucide-react';

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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [matchCompleteData, setMatchCompleteData] = useState(null);
  const [showRestartModal, setShowRestartModal] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [showArrangeMatchupsModal, setShowArrangeMatchupsModal] = useState(false);
  const [showEndTournamentModal, setShowEndTournamentModal] = useState(false);
  const [endingTournament, setEndingTournament] = useState(false);
  const [showContinueKnockoutModal, setShowContinueKnockoutModal] = useState(false);
  const [showSelectPlayersModal, setShowSelectPlayersModal] = useState(false);
  const [knockoutDrawSize, setKnockoutDrawSize] = useState(4);
  const [roundRobinPlayers, setRoundRobinPlayers] = useState([]);
  const [selectedPlayersForKnockout, setSelectedPlayersForKnockout] = useState([]);
  const [activeStage, setActiveStage] = useState('roundrobin'); // 'roundrobin' or 'knockout' for ROUND_ROBIN_KNOCKOUT format
  
  // Match details modal
  const [showMatchDetailsModal, setShowMatchDetailsModal] = useState(false);
  const [selectedMatchDetails, setSelectedMatchDetails] = useState(null);
  
  // Players list modal
  const [showPlayersModal, setShowPlayersModal] = useState(false);
  const [registeredPlayers, setRegisteredPlayers] = useState([]);

  useEffect(() => {
    fetchTournamentData();
    
    // Check if we're returning from match completion
    const state = window.history.state?.usr;
    if (state?.matchComplete) {
      setMatchCompleteData({
        winner: state.winner,
        duration: state.duration
      });
      setShowSuccessModal(true);
      
      // Clear the state
      window.history.replaceState({}, document.title);
    }
  }, [tournamentId]);

  useEffect(() => {
    if (activeCategory) {
      fetchBracket();
    }
  }, [activeCategory]);

  // Fetch stats when bracket changes
  useEffect(() => {
    if (activeCategory && bracket) {
      fetchTournamentStats();
    }
  }, [activeCategory, bracket]);

  // Check if round robin stage is complete
  const isRoundRobinComplete = () => {
    if (!bracket || bracket.format !== 'ROUND_ROBIN_KNOCKOUT') return false;
    if (!matches || matches.length === 0) {
      console.log('⚠️ No matches found yet. Draw may not be created.');
      return false;
    }
    
    // Get all round robin matches (stage = 'GROUP')
    const roundRobinMatches = matches.filter(m => m.stage === 'GROUP');
    
    console.log('📊 Match Status:', {
      roundRobinMatches: roundRobinMatches.length,
      completedRoundRobin: roundRobinMatches.filter(m => m.status === 'COMPLETED').length,
      knockoutMatches: matches.filter(m => m.stage === 'KNOCKOUT').length
    });
    
    if (roundRobinMatches.length === 0) {
      console.log('⚠️ No GROUP stage matches found. This means:');
      console.log('   1. Draw has not been created yet, OR');
      console.log('   2. Only knockout matches exist (no round robin)');
      return false;
    }
    
    // Check if all round robin matches are completed
    const allComplete = roundRobinMatches.every(m => m.status === 'COMPLETED');
    console.log('✅ Round Robin Complete:', allComplete);
    return allComplete;
  };

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

      // Simply use the actual matches count from the database
      // This is the most reliable source since matches are already created
      const actualTotalMatches = matches.length;

      console.log('📊 Tournament Stats:');
      console.log('  Total Players:', registrations.length);
      console.log('  Confirmed Players:', registrations.filter(r => r.status === 'confirmed').length);
      console.log('  Total Matches:', actualTotalMatches);
      console.log('  Completed Matches:', matches.filter(m => m.status === 'COMPLETED').length);

      setTournamentStats({
        totalPlayers: registrations.length,
        confirmedPlayers: registrations.filter(r => r.status === 'confirmed').length,
        totalMatches: actualTotalMatches,
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
      
      // 🔥 CRITICAL FIX: Fetch matches after creating draw
      try {
        const matchesResponse = await api.get(`/tournaments/${tournamentId}/categories/${activeCategory.id}/matches`);
        setMatches(matchesResponse.data.matches || []);
        console.log('✅ Matches loaded after draw creation:', matchesResponse.data.matches?.length || 0);
      } catch (matchErr) {
        console.error('⚠️ Failed to load matches:', matchErr);
        setMatches([]);
      }
      
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

  // Restart draws handler - resets all match data but keeps draw structure
  const restartDraws = async () => {
    if (!activeCategory) return;
    
    setRestarting(true);
    setError(null);
    
    try {
      await api.post(`/tournaments/${tournamentId}/categories/${activeCategory.id}/draw/restart`);
      
      // Refresh bracket and matches
      await fetchBracket();
      await fetchTournamentStats();
      
      setSuccess('Draw restarted successfully! All matches have been reset.');
      setShowRestartModal(false);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error('Error restarting draw:', err);
      setError(err.response?.data?.error || 'Failed to restart draw');
    } finally {
      setRestarting(false);
    }
  };

  // Save knockout matchups arrangement
  const saveKnockoutMatchups = async (knockoutSlots) => {
    if (!activeCategory) return;
    
    setAssigning(true);
    setError(null);
    
    try {
      console.log('💾 Saving knockout matchups:', knockoutSlots);
      
      await api.post(`/tournaments/${tournamentId}/categories/${activeCategory.id}/draw/arrange-knockout`, {
        knockoutSlots
      });
      
      console.log('✅ Saved! Refreshing bracket and matches...');
      
      // Wait a moment for database to update
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Refresh bracket AND matches
      await fetchBracket();
      
      console.log('✅ Bracket refreshed, matches:', matches.length);
      
      // Auto-switch to Knockout tab
      setActiveStage('knockout');
      
      setSuccess('Knockout matchups arranged successfully!');
      setShowArrangeMatchupsModal(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error arranging knockout matchups:', err);
      setError(err.response?.data?.error || 'Failed to arrange knockout matchups');
    } finally {
      setAssigning(false);
    }
  };

  // End category (not entire tournament)
  const handleEndCategory = async () => {
    setEndingTournament(true);
    setError(null);
    
    try {
      const url = `/tournaments/${tournamentId}/categories/${activeCategory.id}/end`;
      
      const response = await api.put(url);
      
      console.log('6. Response received:', response.data);
      
      // Show detailed success message with points info
      const pointsInfo = response.data.pointsAwarded || {};
      const totalPlayersAwarded = pointsInfo.playersAwarded || 0;
      
      setSuccess(`Category '${activeCategory.name}' ended successfully! Points awarded to ${totalPlayersAwarded} players.`);
      setShowEndTournamentModal(false);
      
      // Refresh tournament data
      await fetchTournamentData();
      
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error('❌ Error ending category:', err);
      console.error('❌ Error response:', err.response);
      console.error('❌ Error data:', err.response?.data);
      console.error('❌ Error status:', err.response?.status);
      console.error('❌ Full error:', err);
      setError(err.response?.data?.error || 'Failed to end category');
    } finally {
      setEndingTournament(false);
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

  // Change match result
  const [showChangeResultModal, setShowChangeResultModal] = useState(false);
  const [selectedMatchForChange, setSelectedMatchForChange] = useState(null);
  const [changingResult, setChangingResult] = useState(false);

  const onChangeResult = (matchData, bracketMatch) => {
    setSelectedMatchForChange({ ...matchData, bracketMatch });
    setShowChangeResultModal(true);
  };

  const onViewMatchDetails = (matchData, bracketMatch) => {
    setSelectedMatchDetails({ ...matchData, bracketMatch });
    setShowMatchDetailsModal(true);
  };

  const changeMatchResult = async (newWinnerId) => {
    if (!selectedMatchForChange) return;
    
    setChangingResult(true);
    setError(null);
    
    try {
      // Call API to change the match winner
      await api.put(`/matches/${selectedMatchForChange.id}/change-winner`, {
        winnerId: newWinnerId
      });
      
      setSuccess('Match result updated successfully!');
      setShowChangeResultModal(false);
      setSelectedMatchForChange(null);
      
      // Refresh bracket to show updated standings
      await fetchBracket();
      await fetchTournamentStats();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error changing match result:', err);
      setError(err.response?.data?.error || 'Failed to change match result');
    } finally {
      setChangingResult(false);
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
      
      // 🔥 CRITICAL FIX: Refetch matches to update bracket display
      try {
        const matchesResponse = await api.get(`/tournaments/${tournamentId}/categories/${activeCategory.id}/matches`);
        setMatches(matchesResponse.data.matches || []);
        console.log('✅ Matches refreshed after assignment:', matchesResponse.data.matches?.length || 0);
      } catch (matchErr) {
        console.error('⚠️ Failed to refresh matches:', matchErr);
        // Don't fail the whole operation if match refresh fails
      }
      
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
  
  // Check if category is completed (ended)
  const isCategoryCompleted = activeCategory?.status === 'completed';
  
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
                    {/* Assign Players button - Disabled when tournament is completed */}
                    {(bracket?.format === 'KNOCKOUT' || bracket?.format === 'ROUND_ROBIN' || bracket?.format === 'ROUND_ROBIN_KNOCKOUT') && (
                      <button
                        onClick={openAssignModal}
                        disabled={isCategoryCompleted}
                        title={isCategoryCompleted ? 'Category has ended - draw is locked' : 'Assign players to draw'}
                        className={`px-5 py-3 rounded-xl shadow-lg transition-all flex items-center gap-2 font-semibold ${
                          isCategoryCompleted
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                            : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105'
                        }`}
                      >
                        <UserPlus className="w-5 h-5" />
                        Assign Players
                      </button>
                    )}
                    {/* Edit Group Sizes button - Disabled when tournament is completed */}
                    {(bracket?.format === 'ROUND_ROBIN' || bracket?.format === 'ROUND_ROBIN_KNOCKOUT') && !hasPlayedMatches && (
                      <button
                        onClick={() => setShowConfigModal(true)}
                        disabled={isCategoryCompleted}
                        title={isCategoryCompleted ? 'Category has ended - draw is locked' : 'Edit group sizes and configuration'}
                        className={`px-5 py-3 rounded-xl shadow-lg transition-all flex items-center gap-2 font-semibold ${
                          isCategoryCompleted
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                            : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105'
                        }`}
                      >
                        <Layers className="w-5 h-5" />
                        Edit Group Sizes
                      </button>
                    )}
                    {/* Arrange Knockout Matchups button - Disabled when tournament is completed */}
                    {bracket?.format === 'ROUND_ROBIN_KNOCKOUT' && (
                      <button
                        onClick={() => setShowArrangeMatchupsModal(true)}
                        disabled={isCategoryCompleted}
                        title={isCategoryCompleted ? 'Category has ended - draw is locked' : 'Arrange knockout stage matchups'}
                        className={`px-5 py-3 rounded-xl shadow-lg transition-all flex items-center gap-2 font-semibold ${
                          isCategoryCompleted
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                            : 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105'
                        }`}
                      >
                        <Settings className="w-5 h-5" />
                        Arrange Knockout
                      </button>
                    )}
                    {/* End Category Button - Hide when already completed */}
                    {!isCategoryCompleted && (
                      <button
                        onClick={() => setShowEndTournamentModal(true)}
                        className="px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-105 transition-all flex items-center gap-2 font-semibold"
                        title="Mark this category as complete"
                      >
                        <Trophy className="w-5 h-5" />
                        End Category
                      </button>
                    )}
                    {/* Restart Draws button - Disabled when tournament is completed */}
                    <button
                      onClick={() => hasPlayedMatches && !isCategoryCompleted && setShowRestartModal(true)}
                      disabled={!hasPlayedMatches || isCategoryCompleted}
                      title={
                        isCategoryCompleted 
                          ? 'Category has ended - draw is locked' 
                          : !hasPlayedMatches 
                            ? 'No matches have been played yet' 
                            : 'Restart all matches'
                      }
                      className={`px-5 py-3 rounded-xl shadow-lg transition-all flex items-center gap-2 font-semibold ${
                        !hasPlayedMatches || isCategoryCompleted
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50' 
                          : 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-105'
                      }`}
                    >
                      <Zap className="w-5 h-5" />
                      Restart Draws
                    </button>
                    {/* Delete Draw button - Disabled when tournament is completed */}
                    <button
                      onClick={() => !hasPlayedMatches && !isCategoryCompleted && setShowDeleteModal(true)}
                      disabled={hasPlayedMatches || isCategoryCompleted}
                      title={
                        isCategoryCompleted
                          ? 'Category has ended - draw is locked'
                          : hasPlayedMatches 
                            ? 'Cannot delete draw - matches have been played' 
                            : 'Delete Draw'
                      }
                      className={`px-5 py-3 rounded-xl shadow-lg transition-all flex items-center gap-2 font-semibold ${
                        hasPlayedMatches || isCategoryCompleted
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50' 
                          : 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-red-500/30 hover:shadow-red-500/50 hover:scale-105'
                      }`}
                    >
                      <Trash2 className="w-5 h-5" />
                      Delete Draw
                    </button>
                  </>
                )}
                {!bracket && !isCategoryCompleted && (
                  <button
                    onClick={() => setShowConfigModal(true)}
                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-105 transition-all flex items-center gap-2 font-semibold"
                  >
                    <Plus className="w-5 h-5" />
                    Create Draw
                  </button>
                )}
              </div>
            )}
          </div>
          
          {/* Warning message when tournament is completed */}
          {isCategoryCompleted && isOrganizer && (
            <div className="mt-4 px-4 py-3 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3">
              <Trophy className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-green-300 text-sm font-semibold">Tournament Completed</p>
                <p className="text-green-400/80 text-xs">Draw is now locked and cannot be modified. Points have been awarded to all players.</p>
              </div>
            </div>
          )}
          
          {/* Warning message when draw is locked due to played matches */}
          {hasPlayedMatches && !isCategoryCompleted && isOrganizer && (
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
              <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-4 relative">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-2xl font-bold text-white">{tournamentStats.totalPlayers}</p>
                    <p className="text-blue-300 text-sm font-medium">Total Players</p>
                  </div>
                  {/* View Players Button */}
                  <button
                    onClick={async () => {
                      if (showPlayersModal) {
                        setShowPlayersModal(false);
                      } else {
                        setShowPlayersModal(true);
                        try {
                          const response = await api.get(`/tournaments/${tournamentId}/categories/${activeCategory.id}/registrations`);
                          setRegisteredPlayers(response.data.registrations || []);
                        } catch (err) {
                          console.error('Error fetching players:', err);
                        }
                      }
                    }}
                    className="w-8 h-8 bg-blue-500/30 hover:bg-blue-500/50 rounded-lg flex items-center justify-center transition-all hover:scale-110 group"
                    title="View all players"
                  >
                    {showPlayersModal ? (
                      <X className="w-4 h-4 text-blue-300 group-hover:text-white" />
                    ) : (
                      <svg className="w-4 h-4 text-blue-300 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </button>
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

            {/* Progress Bar - REMOVED as it doesn't serve actual purpose */}
            {/* Tournament completion is determined by organizer, not match count */}

            {/* Players List - Shows when Total Players card is clicked */}
            {showPlayersModal && (
              <div className="mt-6 bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Registered Players</h3>
                      <p className="text-blue-300 text-sm">{activeCategory?.name} • {registeredPlayers.length} players</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPlayersModal(false)}
                    className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-gray-300 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {registeredPlayers.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-gray-500" />
                    </div>
                    <p className="text-gray-400">No players registered yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-2">
                    {registeredPlayers.map((registration, index) => (
                      <div
                        key={registration.id}
                        className="bg-gradient-to-br from-slate-700/50 to-slate-600/50 border border-white/10 rounded-xl p-4 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          {/* Player Number */}
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center font-bold text-white shadow-lg flex-shrink-0">
                            {index + 1}
                          </div>
                          
                          {/* Player Info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white truncate">{registration.user?.name || 'Unknown'}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {registration.status === 'confirmed' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/20 border border-green-500/30 rounded-full text-xs text-green-300">
                                  <CheckCircle className="w-3 h-3" />
                                  Confirmed
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded-full text-xs text-amber-300">
                                  <AlertCircle className="w-3 h-3" />
                                  Pending
                                </span>
                              )}
                              
                              {/* Partner Info for Doubles */}
                              {registration.partner && (
                                <span className="text-xs text-gray-400 truncate">
                                  + {registration.partner.name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
              onChangeResult={onChangeResult}
              onViewMatchDetails={onViewMatchDetails}
              activeCategory={activeCategory}
              isRoundRobinComplete={isRoundRobinComplete}
              tournamentId={tournamentId}
              assigning={assigning}
              setAssigning={setAssigning}
              setSuccess={setSuccess}
              setError={setError}
              fetchBracket={fetchBracket}
              onContinueToKnockout={() => setShowContinueKnockoutModal(true)}
              activeStage={activeStage}
              setActiveStage={setActiveStage}
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

      {/* Continue to Knockout Stage Confirmation Modal */}
      {showContinueKnockoutModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl max-w-md w-full border-2 border-green-500/30 shadow-2xl shadow-green-500/20">
            {/* Header */}
            <div className="p-6 border-b border-white/10 bg-gradient-to-r from-green-600/20 via-emerald-600/20 to-teal-600/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Play className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Matchify.pro says</h3>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <h4 className="text-lg font-bold text-white">Prepare Knockout Stage?</h4>
              <p className="text-gray-300 leading-relaxed">
                This will prepare the knockout bracket with EMPTY slots (TBA vs TBA). After this, you will use the "Arrange Knockout Matchups" button to manually assign qualified players to knockout matches.
              </p>
              <p className="text-amber-400 font-semibold">
                No players will be automatically assigned. You have full control over matchups.
              </p>
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-white/10 flex gap-3 justify-end">
              <button
                onClick={() => setShowContinueKnockoutModal(false)}
                disabled={assigning}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-all font-semibold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!activeCategory) return;
                  
                  setAssigning(true);
                  try {
                    const response = await api.post(`/tournaments/${tournamentId}/categories/${activeCategory.id}/draw/continue-to-knockout`);
                    
                    await fetchBracket();
                    
                    setSuccess(response.data.message || 'Knockout stage started successfully!');
                    setShowContinueKnockoutModal(false);
                    setTimeout(() => setSuccess(null), 5000);
                  } catch (err) {
                    console.error('Error continuing to knockout:', err);
                    setError(err.response?.data?.error || 'Failed to continue to knockout stage');
                  } finally {
                    setAssigning(false);
                  }
                }}
                disabled={assigning}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl shadow-lg shadow-green-500/30 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {assigning ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    OK
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Select Players for Knockout Modal */}
      {showSelectPlayersModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border-2 border-green-500/30 shadow-2xl shadow-green-500/20">
            {/* Header */}
            <div className="p-6 border-b border-white/10 bg-gradient-to-r from-green-600/20 via-emerald-600/20 to-teal-600/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Select Players for Knockout Stage</h3>
                    <p className="text-sm text-gray-400 mt-1">Choose draw size and select players manually</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSelectPlayersModal(false)}
                  className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center text-gray-300 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Knockout Draw Size */}
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-3">
                  Knockout Draw Size (Number of Players)
                </label>
                <input
                  type="number"
                  min="2"
                  max="32"
                  value={knockoutDrawSize}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 2;
                    setKnockoutDrawSize(Math.max(2, Math.min(32, value)));
                    // Clear selections if new size is smaller
                    if (selectedPlayersForKnockout.length > value) {
                      setSelectedPlayersForKnockout(selectedPlayersForKnockout.slice(0, value));
                    }
                  }}
                  className="w-full px-4 py-4 bg-slate-700 border-2 border-green-500/30 rounded-xl text-white text-2xl font-bold focus:outline-none focus:border-green-400 focus:shadow-lg focus:shadow-green-500/20 transition-all"
                  placeholder="Enter number (e.g., 4, 6, 8)"
                />
                <p className="text-xs text-gray-400 mt-2">
                  Selected: {selectedPlayersForKnockout.length} / {knockoutDrawSize} players
                </p>
              </div>

              {/* Player Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-3">
                  Select Players ({roundRobinPlayers.length} available)
                </label>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {roundRobinPlayers.map(player => {
                    const isSelected = selectedPlayersForKnockout.includes(player.id);
                    const canSelect = selectedPlayersForKnockout.length < knockoutDrawSize;
                    
                    return (
                      <button
                        key={player.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedPlayersForKnockout(selectedPlayersForKnockout.filter(id => id !== player.id));
                          } else if (canSelect) {
                            setSelectedPlayersForKnockout([...selectedPlayersForKnockout, player.id]);
                          }
                        }}
                        disabled={!isSelected && !canSelect}
                        className={`w-full p-4 rounded-xl text-left transition-all flex items-center gap-3 ${
                          isSelected
                            ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500'
                            : !canSelect
                            ? 'bg-slate-700/50 border-2 border-slate-600 opacity-50 cursor-not-allowed'
                            : 'bg-slate-700 border-2 border-slate-600 hover:border-green-500/50'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center ${
                          isSelected ? 'bg-green-500 border-green-500' : 'border-gray-500'
                        }`}>
                          {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-white">{player.name}</div>
                          <div className="text-xs text-gray-400">{player.email}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-white/10 flex gap-3 justify-end bg-slate-900/50">
              <button
                onClick={() => setShowSelectPlayersModal(false)}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-all font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (selectedPlayersForKnockout.length !== knockoutDrawSize) {
                    setError(`Please select exactly ${knockoutDrawSize} players`);
                    return;
                  }
                  
                  setAssigning(true);
                  try {
                    // Call API to create knockout bracket with selected players
                    const response = await api.post(`/tournaments/${tournamentId}/categories/${activeCategory.id}/draw/continue-to-knockout`, {
                      knockoutDrawSize,
                      selectedPlayerIds: selectedPlayersForKnockout
                    });
                    
                    await fetchBracket();
                    
                    setSuccess('Knockout stage created! Players have been assigned.');
                    setShowSelectPlayersModal(false);
                    
                    // Auto-switch to Knockout tab
                    setActiveStage('knockout');
                    
                    setTimeout(() => setSuccess(null), 5000);
                  } catch (err) {
                    console.error('Error creating knockout:', err);
                    setError(err.response?.data?.error || 'Failed to create knockout stage');
                  } finally {
                    setAssigning(false);
                  }
                }}
                disabled={assigning || selectedPlayersForKnockout.length !== knockoutDrawSize}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl shadow-lg shadow-green-500/30 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {assigning ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Create Knockout Bracket
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
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

      {/* Change Match Result Modal */}
      {showChangeResultModal && selectedMatchForChange && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-amber-500/50 rounded-3xl p-8 max-w-md w-full shadow-2xl shadow-amber-500/20">
            {/* Icon */}
            <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/50">
              <span className="text-4xl">🔄</span>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-center mb-2 text-white">
              Change Match Result
            </h2>
            <p className="text-gray-400 text-center mb-6 text-sm">
              Select the new winner for this match
            </p>

            {/* Current Winner */}
            <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 mb-6">
              <p className="text-gray-400 text-xs mb-2">Current Winner</p>
              <p className="text-white font-semibold">
                {selectedMatchForChange.winnerId === selectedMatchForChange.bracketMatch.player1?.id 
                  ? selectedMatchForChange.bracketMatch.player1?.name 
                  : selectedMatchForChange.bracketMatch.player2?.name}
              </p>
            </div>

            {/* Player Selection */}
            <div className="space-y-3 mb-6">
              <button
                onClick={() => changeMatchResult(selectedMatchForChange.bracketMatch.player1?.id)}
                disabled={changingResult}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                  selectedMatchForChange.winnerId === selectedMatchForChange.bracketMatch.player1?.id
                    ? 'border-emerald-500/50 bg-emerald-500/10'
                    : 'border-white/10 bg-slate-800/50 hover:border-amber-500/50 hover:bg-amber-500/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white font-semibold">{selectedMatchForChange.bracketMatch.player1?.name}</span>
                  {selectedMatchForChange.winnerId === selectedMatchForChange.bracketMatch.player1?.id && (
                    <span className="text-emerald-400 text-sm">✓ Current</span>
                  )}
                </div>
              </button>

              <button
                onClick={() => changeMatchResult(selectedMatchForChange.bracketMatch.player2?.id)}
                disabled={changingResult}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                  selectedMatchForChange.winnerId === selectedMatchForChange.bracketMatch.player2?.id
                    ? 'border-emerald-500/50 bg-emerald-500/10'
                    : 'border-white/10 bg-slate-800/50 hover:border-amber-500/50 hover:bg-amber-500/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white font-semibold">{selectedMatchForChange.bracketMatch.player2?.name}</span>
                  {selectedMatchForChange.winnerId === selectedMatchForChange.bracketMatch.player2?.id && (
                    <span className="text-emerald-400 text-sm">✓ Current</span>
                  )}
                </div>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowChangeResultModal(false);
                  setSelectedMatchForChange(null);
                }}
                disabled={changingResult}
                className="flex-1 py-3 bg-slate-700 text-white rounded-xl font-semibold hover:bg-slate-600 transition-all"
              >
                Cancel
              </button>
            </div>

            {changingResult && (
              <div className="mt-4 flex items-center justify-center gap-2 text-amber-400">
                <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm">Updating result...</span>
              </div>
            )}
          </div>
        </div>
      )}

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
                    {selectedMatchDetails.score && (() => {
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
                    })()}
                  </span>
                </div>
                <p className="text-gray-400 text-xs uppercase tracking-wider mt-3">Sets Won</p>
              </div>

              {/* Set-by-Set Breakdown */}
              <div className="text-center mb-6">
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-3">Set Breakdown</p>
                <div className="flex items-center justify-center gap-3">
                  {selectedMatchDetails.score && (() => {
                    const scoreData = typeof selectedMatchDetails.score === 'string' 
                      ? JSON.parse(selectedMatchDetails.score) 
                      : selectedMatchDetails.score;
                    return scoreData?.sets?.map((set, idx) => {
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
                  })()}
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
                    {selectedMatchDetails.score && (
                      <div className="space-y-2">
                        <p className="text-xs text-gray-400 uppercase tracking-wider">Individual Scores</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {getDetailedSetScores(selectedMatchDetails.score, 1).split(', ').map((score, idx) => {
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
                          })}
                        </div>
                      </div>
                    )}
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
                    {selectedMatchDetails.score && (
                      <div className="space-y-2">
                        <p className="text-xs text-gray-400 uppercase tracking-wider">Individual Scores</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {getDetailedSetScores(selectedMatchDetails.score, 2).split(', ').map((score, idx) => {
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
                          })}
                        </div>
                      </div>
                    )}
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
                {/* Started At - check both startTime and startedAt */}
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
                {/* Ended At - check both endTime and completedAt */}
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
                {/* Duration - check multiple sources */}
                {(() => {
                  // Try to get duration from multiple sources
                  let durationSeconds = selectedMatchDetails.duration;
                  
                  // If not found, try to get from score.timer
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
                  
                  // If still not found, calculate from start and end times
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

      {/* Match Complete Success Modal */}
      {showSuccessModal && matchCompleteData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-amber-500/50 rounded-3xl p-8 max-w-md w-full shadow-2xl shadow-amber-500/20 animate-scale-in">
            {/* Trophy Icon */}
            <div className="w-24 h-24 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/50">
              <Trophy className="w-12 h-12 text-white" />
            </div>

            {/* Title */}
            <h2 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              Match Complete!
            </h2>

            {/* Winner Info */}
            <div className="bg-slate-800/50 border border-amber-500/30 rounded-xl p-6 mb-6">
              <div className="text-center mb-4">
                <p className="text-gray-400 text-sm mb-2">Winner</p>
                <p className="text-2xl font-bold text-white">{matchCompleteData.winner}</p>
              </div>
              
              <div className="flex items-center justify-center gap-2 text-gray-300">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Duration: {matchCompleteData.duration}</span>
              </div>
            </div>

            {/* Success Message */}
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-6">
              <p className="text-emerald-400 text-center text-sm">
                ✓ Winner advanced to next round<br />
                ✓ Notifications sent to players<br />
                ✓ Bracket updated successfully
              </p>
            </div>

            {/* Close Button */}
            <button
              onClick={() => {
                setShowSuccessModal(false);
                setMatchCompleteData(null);
              }}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-amber-500/30 transition-all"
            >
              View Updated Bracket
            </button>
          </div>
        </div>
      )}

      {/* Restart Draws Confirmation Modal */}
      {showRestartModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-orange-500/50 rounded-3xl p-8 max-w-lg w-full shadow-2xl shadow-orange-500/20">
            {/* Warning Icon */}
            <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-500/50">
              <Zap className="w-10 h-10 text-white" />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-center mb-4 text-white">
              Restart All Matches?
            </h2>

            {/* Warning Message */}
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 mb-6">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-orange-300">
                  <p className="font-semibold mb-2">This will reset all matches in this category:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>All match scores will be cleared</li>
                    <li>All match statuses reset to PENDING</li>
                    <li>Winners removed from advanced rounds</li>
                    <li>Umpire and court assignments cleared</li>
                    <li>Match times and durations removed</li>
                  </ul>
                  <p className="mt-3 font-semibold">✓ Player assignments in Round 1 will be kept</p>
                  <p className="font-semibold">✓ Draw structure will remain intact</p>
                </div>
              </div>
            </div>

            {/* Category Info */}
            <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 mb-6">
              <p className="text-gray-400 text-sm mb-1">Category</p>
              <p className="text-white font-semibold">{activeCategory?.name}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowRestartModal(false)}
                disabled={restarting}
                className="flex-1 py-3 bg-slate-700 text-white rounded-xl font-semibold hover:bg-slate-600 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={restartDraws}
                disabled={restarting}
                className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-orange-500/30 transition-all flex items-center justify-center gap-2"
              >
                {restarting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Restarting...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Restart Matches
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End Category Confirmation Modal */}
      {showEndTournamentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-green-500/50 rounded-3xl p-8 max-w-lg w-full shadow-2xl shadow-green-500/20">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/50">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-center mb-2 text-white">End Category?</h2>
            <p className="text-center text-purple-300 font-semibold mb-4">{activeCategory?.name}</p>
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6 space-y-2">
              <p className="text-sm text-green-300">
                <strong>This will:</strong>
              </p>
              <ul className="text-sm text-green-300 list-disc list-inside space-y-1 ml-2">
                <li>Mark THIS CATEGORY as complete</li>
                <li>Award points to players in this category only</li>
                <li>Update the leaderboard rankings</li>
                <li>Lock this category's draw (cannot be modified)</li>
              </ul>
              <p className="text-sm text-yellow-300 mt-3">
                <strong>Note:</strong> Other categories will remain active and editable.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowEndTournamentModal(false)} disabled={endingTournament} className="flex-1 py-3 bg-slate-700 text-white rounded-xl font-semibold hover:bg-slate-600 transition-all">Cancel</button>
              <button onClick={handleEndCategory} disabled={endingTournament} className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-green-500/30 transition-all flex items-center justify-center gap-2">
                {endingTournament ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Ending...</> : <>End Category</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Arrange Knockout Matchups Modal */}
      {showArrangeMatchupsModal && bracket && (
        <ArrangeMatchupsModal
          bracket={bracket}
          onClose={() => setShowArrangeMatchupsModal(false)}
          onSave={saveKnockoutMatchups}
          saving={assigning}
        />
      )}
    </div>
  );
};

// Draw Display Component - handles all formats
const DrawDisplay = ({ 
  bracket, 
  matches, 
  user, 
  isOrganizer, 
  onAssignUmpire, 
  onChangeResult, 
  onViewMatchDetails, 
  activeCategory,
  isRoundRobinComplete,
  tournamentId,
  assigning,
  setAssigning,
  setSuccess,
  setError,
  fetchBracket,
  onContinueToKnockout,
  activeStage,
  setActiveStage
}) => {
  const format = bracket?.format;

  if (format === 'ROUND_ROBIN') {
    return <RoundRobinDisplay 
      data={bracket} 
      matches={matches} 
      user={user} 
      isOrganizer={isOrganizer} 
      onAssignUmpire={onAssignUmpire}
      onChangeResult={onChangeResult}
      onViewMatchDetails={onViewMatchDetails}
    />;
  }
  if (format === 'ROUND_ROBIN_KNOCKOUT') {
    return <GroupsKnockoutDisplay 
      data={bracket} 
      matches={matches} 
      user={user} 
      isOrganizer={isOrganizer} 
      onAssignUmpire={onAssignUmpire}
      onChangeResult={onChangeResult}
      onViewMatchDetails={onViewMatchDetails}
      isRoundRobinComplete={isRoundRobinComplete}
      activeCategory={activeCategory}
      tournamentId={tournamentId}
      assigning={assigning}
      setAssigning={setAssigning}
      setSuccess={setSuccess}
      setError={setError}
      fetchBracket={fetchBracket}
      onContinueToKnockout={onContinueToKnockout}
      activeStage={activeStage}
      setActiveStage={setActiveStage}
    />;
  }
  // Default: Pure knockout (horizontal left-to-right layout)
  return <KnockoutDisplay 
    data={bracket} 
    matches={matches} 
    user={user} 
    isOrganizer={isOrganizer} 
    onAssignUmpire={onAssignUmpire}
    onViewMatchDetails={onViewMatchDetails}
    onChangeResult={onChangeResult}
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
    
    console.log(`✅ Formatted scores for player ${playerNumber}:`, setScores.join(', '));
    return setScores.join(', ');
  } catch (err) {
    console.error('❌ Error formatting detailed scores:', err, 'Score data:', scoreData);
    return '';
  }
};

// Helper function to get complete match score display
const getCompleteMatchScore = (scoreData) => {
  if (!scoreData) return '';
  
  try {
    // Parse if it's a JSON string
    let parsedScore = scoreData;
    if (typeof scoreData === 'string') {
      parsedScore = JSON.parse(scoreData);
    }
    
    if (!parsedScore || !parsedScore.sets || !Array.isArray(parsedScore.sets)) {
      console.log('❌ No sets array found in score data for complete score');
      return '';
    }
    
    let p1SetsWon = 0;
    let p2SetsWon = 0;
    const setScores = [];
    
    parsedScore.sets.forEach((set) => {
      if (set.winner === 1) p1SetsWon++;
      if (set.winner === 2) p2SetsWon++;
      
      // Handle both formats: {player1Score, player2Score} and {player1, player2}
      const p1Score = set.player1Score !== undefined ? set.player1Score : set.player1;
      const p2Score = set.player2Score !== undefined ? set.player2Score : set.player2;
      
      if (p1Score !== undefined && p2Score !== undefined) {
        setScores.push(`${p1Score}-${p2Score}`);
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
const KnockoutDisplay = ({ data, matches, user, isOrganizer, onAssignUmpire, onViewMatchDetails }) => {
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

  // Find match record by round and position within that round
  const findMatch = (displayIdx, matchIdx) => {
    if (!matches || !Array.isArray(matches)) {
      console.log('⚠️ No matches array available');
      return null;
    }
    
    // Calculate database round number
    // Frontend: Round 0 = First round (QF/SF), Round 1 = Next round, etc.
    // Backend: Round 3 = QF, Round 2 = SF, Round 1 = Final (reverse order)
    const totalRounds = data.rounds.length;
    const dbRound = totalRounds - displayIdx; // Reverse: last display round = round 1 in DB
    
    console.log('🔍 Looking for knockout match:', {
      displayIdx,
      matchIdx,
      dbRound,
      totalMatches: matches.length,
      knockoutMatches: matches.filter(m => m.stage === 'KNOCKOUT').length
    });
    
    // Get all knockout matches for this round, sorted by matchNumber
    const roundMatches = matches
      .filter(m => m.round === dbRound && m.stage === 'KNOCKOUT')
      .sort((a, b) => a.matchNumber - b.matchNumber);
    
    console.log(`   Found ${roundMatches.length} matches in round ${dbRound}`);
    
    // Get the match at the specified index within this round
    const found = roundMatches[matchIdx];
    
    if (!found) {
      console.log('⚠️ No DB match found at index', matchIdx, 'in round', dbRound);
    } else {
      console.log('✅ Found knockout match:', {
        id: found.id,
        matchNumber: found.matchNumber,
        round: found.round,
        player1: found.player1?.name,
        player2: found.player2?.name,
        status: found.status
      });
    }
    
    return found;
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
              const dbMatch = findMatch(pos.displayIdx, pos.matchIndex);
              
              console.log('🎯 KNOCKOUT MATCH DATA:', {
                matchNumber: match.matchNumber,
                hasDbMatch: !!dbMatch,
                dbPlayer1: dbMatch?.player1?.name,
                dbPlayer2: dbMatch?.player2?.name,
                dbStatus: dbMatch?.status
              });
              
              // Get players from database match
              const player1 = dbMatch?.player1 || { name: 'TBD' };
              const player2 = dbMatch?.player2 || { name: 'TBD' };
              
              const hasPlayers = dbMatch?.player1 && dbMatch?.player2;
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
                      fill={match.winner === 1 || dbMatch?.winnerId === player1?.id ? 'rgba(168, 85, 247, 0.2)' : 'transparent'}
                    />
                    <text x="12" y="20" fill={match.winner === 1 || dbMatch?.winnerId === player1?.id ? '#ffffff' : '#d1d5db'} fontSize="14" fontWeight="600">
                      {(player1?.name || 'TBD').substring(0, 22)}
                    </text>
                    {/* Player 1 Detailed Set Scores */}
                    {isCompleted && dbMatch?.score && (
                      <text x="12" y="35" fill="#9ca3af" fontSize="10" fontWeight="500">
                        {getDetailedSetScores(dbMatch.score, 1)}
                      </text>
                    )}
                    {(match.winner === 1 || dbMatch?.winnerId === player1?.id) && (
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
                      fill={match.winner === 2 || dbMatch?.winnerId === player2?.id ? 'rgba(168, 85, 247, 0.2)' : 'transparent'}
                    />
                    <text x="12" y="20" fill={match.winner === 2 || dbMatch?.winnerId === player2?.id ? '#ffffff' : '#d1d5db'} fontSize="14" fontWeight="600">
                      {(player2?.name || 'TBD').substring(0, 22)}
                    </text>
                    {/* Player 2 Detailed Set Scores */}
                    {isCompleted && dbMatch?.score && (
                      <text x="12" y="35" fill="#9ca3af" fontSize="10" fontWeight="500">
                        {getDetailedSetScores(dbMatch.score, 2)}
                      </text>
                    )}
                    {(match.winner === 2 || dbMatch?.winnerId === player2?.id) && (
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
                          player1: player1,
                          player2: player2
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

                  {/* View Details Button for Completed Matches */}
                  {isCompleted && (
                    <g
                      onClick={() => {
                        const bracketMatchData = {
                          matchNumber: match.matchNumber,
                          round: pos.displayIdx + 1,
                          player1: player1,
                          player2: player2
                        };
                        onViewMatchDetails(dbMatch, bracketMatchData);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <rect 
                        x={cardWidth - 50} 
                        y="162" 
                        width="40" 
                        height="16" 
                        rx="8" 
                        fill="rgba(59, 130, 246, 0.3)" 
                        stroke="#3b82f6" 
                        strokeWidth="1.5"
                      />
                      
                      {/* Info Icon */}
                      <text 
                        x={cardWidth - 30} 
                        y="172" 
                        textAnchor="middle" 
                        fill="#3b82f6" 
                        fontSize="10" 
                        fontWeight="700"
                      >
                        ℹ️
                      </text>
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
const RoundRobinDisplay = ({ data, matches, user, isOrganizer, onAssignUmpire, onChangeResult, onViewMatchDetails }) => {
  if (!data?.groups) return <p className="text-gray-400 text-center p-8">No group data</p>;

  // Find database matches for each group match
  const findDbMatch = (groupMatch, groupIndex) => {
    if (!matches || !Array.isArray(matches)) {
      console.log('⚠️ No matches array available');
      return null;
    }
    
    // CRITICAL FIX: Match by matchNumber instead of player IDs
    // Player IDs in bracket JSON might not sync perfectly with DB after updates
    // matchNumber is the stable, unique identifier
    const found = matches.find(m => m.matchNumber === groupMatch.matchNumber);
    
    if (!found) {
      console.log('⚠️ No DB match found for match number:', groupMatch.matchNumber);
    } else {
      console.log('✅ Found DB match:', found.matchNumber, 'Status:', found.status, 'Winner:', found.winnerId);
    }
    return found;
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
                                {/* Debug: Show if score exists but is empty */}
                                {!dbMatch.score && (
                                  <div className="mt-2 text-xs text-red-400">
                                    ⚠️ No score data available
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {/* Umpire Assignment Button or Match Status */}
                          {isCompleted ? (
                            <div className="flex flex-col gap-2">
                              <div className="px-3 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-sm font-medium text-center">
                                ✅ Completed
                              </div>
                              <div className="flex gap-2">
                                {/* View Details Button - Always visible for completed matches */}
                                <button
                                  onClick={() => {
                                    const bracketMatchData = {
                                      matchNumber: match.matchNumber,
                                      round: 1,
                                      player1: match.player1,
                                      player2: match.player2,
                                      groupName: group.groupName
                                    };
                                    onViewMatchDetails(dbMatch, bracketMatchData);
                                  }}
                                  className="flex-1 px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-all text-xs font-medium flex items-center justify-center gap-1"
                                  title="View match details"
                                >
                                  <span className="text-base">ℹ️</span>
                                  Info
                                </button>
                                {/* Change Result Button - Only for organizers */}
                                {isOrganizer && (
                                  <button
                                    onClick={() => {
                                      const bracketMatchData = {
                                        matchNumber: match.matchNumber,
                                        round: 1,
                                        player1: match.player1,
                                        player2: match.player2,
                                        groupName: group.groupName,
                                        currentWinnerId: dbMatch?.winnerId
                                      };
                                      onChangeResult(dbMatch, bracketMatchData);
                                    }}
                                    className="flex-1 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition-all text-xs font-medium"
                                  >
                                    Change
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : isOrganizer && hasPlayers ? (
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
                          ) : null}
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
const GroupsKnockoutDisplay = ({ 
  data, 
  matches, 
  user, 
  isOrganizer, 
  onAssignUmpire, 
  onChangeResult, 
  onViewMatchDetails,
  isRoundRobinComplete,
  activeCategory,
  tournamentId,
  assigning,
  setAssigning,
  setSuccess,
  setError,
  fetchBracket,
  onContinueToKnockout,
  activeStage,
  setActiveStage
}) => {
  // activeStage is now passed as prop from parent ('roundrobin' or 'knockout')

  return (
    <div className="space-y-6 p-6">
      {/* Stage Navigation Tabs */}
      <div className="flex gap-3 border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveStage('roundrobin')}
          className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
            activeStage === 'roundrobin'
              ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/30'
              : 'bg-slate-700/50 text-gray-400 hover:bg-slate-700 hover:text-white'
          }`}
        >
          <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
            activeStage === 'roundrobin' ? 'bg-white/20' : 'bg-slate-600/50'
          }`}>
            Stage 1
          </span>
          Round Robin
        </button>
        
        <button
          onClick={() => setActiveStage('knockout')}
          className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
            activeStage === 'knockout'
              ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30'
              : 'bg-slate-700/50 text-gray-400 hover:bg-slate-700 hover:text-white'
          }`}
        >
          <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
            activeStage === 'knockout' ? 'bg-white/20' : 'bg-slate-600/50'
          }`}>
            Stage 2
          </span>
          Knockout
        </button>
      </div>

      {/* Round Robin Stage */}
      {activeStage === 'roundrobin' && (
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
            onChangeResult={onChangeResult}
            onViewMatchDetails={onViewMatchDetails}
          />
        </div>
      )}

      {/* Knockout Stage */}
      {activeStage === 'knockout' && (
        <div>
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-3">
            <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-lg text-sm font-semibold">Stage 2</span>
            Knockout Stage
          </h3>
          
          {!data.knockout ? (
            // No knockout data at all - show message to create it
            <div className="bg-slate-800/50 border-2 border-dashed border-slate-600 rounded-xl p-12 text-center">
              <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrophyIcon className="w-10 h-10 text-amber-400" />
              </div>
              <h4 className="text-xl font-bold text-white mb-2">Knockout Stage Not Created</h4>
              <p className="text-gray-400 mb-4">
                {isRoundRobinComplete() 
                  ? 'All round robin matches are completed! Use the "Arrange Knockout Matchups" button above to create the knockout bracket.'
                  : 'The knockout bracket will be available after all round robin matches are completed.'}
              </p>
              
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg">
                <Settings className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-purple-400 font-medium">
                  {isRoundRobinComplete() ? 'Click "Arrange Knockout Matchups" button in the header' : 'Complete all round robin matches first'}
                </span>
              </div>
            </div>
          ) : (
            <>
              {/* ALWAYS show knockout bracket - even if empty */}
              <KnockoutDisplay 
                data={data.knockout} 
                matches={matches} 
                user={user} 
                isOrganizer={isOrganizer} 
                onAssignUmpire={onAssignUmpire}
                onViewMatchDetails={onViewMatchDetails}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
};

// Draw Configuration Modal
const DrawConfigModal = ({ category, existingDraw, onClose, onSave, saving }) => {
  const maxParticipants = category.maxParticipants || 32;
  const registeredPlayers = category.registrationCount || 0; // Number of registered players
  
  const [config, setConfig] = useState({
    format: existingDraw?.format || category.tournamentFormat || 'KNOCKOUT',
    bracketSize: existingDraw?.bracketSize || 0, // Start at 0
    numberOfGroups: existingDraw?.numberOfGroups || 0, // Start at 0
    advanceFromGroup: existingDraw?.advanceFromGroup || 2,
    customGroupSizes: existingDraw?.customGroupSizes || null // Array like [5, 4] for custom sizes
  });

  const [useCustomGroupSizes, setUseCustomGroupSizes] = useState(!!existingDraw?.customGroupSizes);
  const [alertMessage, setAlertMessage] = useState(null);

  const formatOptions = [
    { value: 'KNOCKOUT', label: 'Knockout', icon: '🏆', desc: 'Single elimination. Lose once, you\'re out.' },
    { value: 'ROUND_ROBIN', label: 'Round Robin', icon: '🔄', desc: 'Everyone plays everyone in the group.' },
    { value: 'ROUND_ROBIN_KNOCKOUT', label: 'Round Robin + Knockout', icon: '⚡', desc: 'Round robin groups, then knockout finals.' }
  ];

  const groupOptions = [2, 4, 8, 16].filter(n => n <= config.bracketSize / 2);

  const handleSave = () => {
    // Validate minimum bracket size
    if (config.bracketSize < 2) {
      setAlertMessage('Draw size must be at least 2 players');
      return;
    }

    // Validate number of groups for round robin formats
    if ((config.format === 'ROUND_ROBIN' || config.format === 'ROUND_ROBIN_KNOCKOUT') && config.numberOfGroups < 1) {
      setAlertMessage('Number of groups must be at least 1');
      return;
    }

    // Validate custom group sizes if enabled
    if (useCustomGroupSizes && config.customGroupSizes) {
      const total = config.customGroupSizes.reduce((a, b) => a + b, 0);
      if (total !== config.bracketSize) {
        setAlertMessage(`Total players in groups (${total}) must equal bracket size (${config.bracketSize})`);
        return;
      }
    }
    onSave(config);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-white/10 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">Configure Draw</h2>
            </div>
            <button onClick={onClose} className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center text-gray-300 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              Tournament Format
            </label>
            <div className="space-y-2">
              {formatOptions.map((option, idx) => {
                const gradients = [
                  'from-blue-500/20 to-cyan-500/20 border-blue-500/30 hover:border-blue-400',
                  'from-purple-500/20 to-pink-500/20 border-purple-500/30 hover:border-purple-400',
                  'from-orange-500/20 to-red-500/20 border-orange-500/30 hover:border-orange-400'
                ];
                const selectedGradients = [
                  'from-blue-500 to-cyan-500 border-blue-400 shadow-lg shadow-blue-500/30',
                  'from-purple-500 to-pink-500 border-purple-400 shadow-lg shadow-purple-500/30',
                  'from-orange-500 to-red-500 border-orange-400 shadow-lg shadow-orange-500/30'
                ];
                return (
                  <button
                    key={option.value}
                    onClick={() => setConfig({ ...config, format: option.value })}
                    className={`w-full p-4 rounded-xl text-left transition-all border-2 ${
                      config.format === option.value
                        ? `bg-gradient-to-r ${selectedGradients[idx]} text-white`
                        : `bg-gradient-to-r ${gradients[idx]} text-gray-300 border-white/10`
                    }`}
                  >
                    <div className="font-semibold">{option.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bracket Size */}
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              Total Players
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="128"
                value={config.bracketSize}
                onChange={(e) => {
                  const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                  setConfig({ ...config, bracketSize: isNaN(value) ? 0 : Math.max(0, Math.min(128, value)) });
                }}
                className="w-full px-4 py-4 bg-gradient-to-r from-slate-700 to-slate-600 border-2 border-cyan-500/30 rounded-xl text-white text-2xl font-bold focus:outline-none focus:border-cyan-400 focus:shadow-lg focus:shadow-cyan-500/20 transition-all"
                placeholder="028"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-cyan-400 text-sm font-medium">
                players
              </div>
            </div>
          </div>

          {/* Group Settings (for Round Robin formats) */}
          {(config.format === 'ROUND_ROBIN' || config.format === 'ROUND_ROBIN_KNOCKOUT') && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-green-400" />
                  Number of Groups
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="16"
                    value={config.numberOfGroups}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                      const groups = isNaN(value) ? 0 : Math.max(0, Math.min(16, value));
                      setConfig({ ...config, numberOfGroups: groups, customGroupSizes: null });
                      setUseCustomGroupSizes(false);
                    }}
                    className="w-full px-4 py-4 bg-gradient-to-r from-slate-700 to-slate-600 border-2 border-green-500/30 rounded-xl text-white text-2xl font-bold focus:outline-none focus:border-green-400 focus:shadow-lg focus:shadow-green-500/20 transition-all"
                    placeholder="04"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-400 text-sm font-medium">
                    groups
                  </div>
                </div>
                
                {/* Custom Group Sizes Toggle */}
                {config.numberOfGroups > 0 && (
                  <button
                    onClick={() => {
                      setUseCustomGroupSizes(!useCustomGroupSizes);
                      if (!useCustomGroupSizes) {
                        const sizes = Array(config.numberOfGroups).fill(0);
                        setConfig({ ...config, customGroupSizes: sizes });
                      } else {
                        setConfig({ ...config, customGroupSizes: null });
                      }
                    }}
                    className={`mt-3 w-full px-4 py-3 rounded-xl transition-all font-medium ${
                      useCustomGroupSizes
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30'
                        : 'bg-gradient-to-r from-slate-700 to-slate-600 text-gray-300 hover:from-slate-600 hover:to-slate-500 border-2 border-white/10'
                    }`}
                  >
                    {useCustomGroupSizes ? '✓ Use Equal Groups' : 'Customize Group Sizes'}
                  </button>
                )}

                {/* Custom Group Size Inputs */}
                {useCustomGroupSizes && (
                  <div className="mt-4 space-y-3 p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/30 rounded-xl">
                    {config.customGroupSizes?.map((size, idx) => {
                      const poolColors = [
                        'from-blue-500 to-cyan-500',
                        'from-green-500 to-emerald-500',
                        'from-orange-500 to-amber-500',
                        'from-red-500 to-pink-500'
                      ];
                      return (
                        <div key={idx} className="flex items-center gap-3">
                          <div className={`w-20 h-12 bg-gradient-to-r ${poolColors[idx % 4]} rounded-lg flex items-center justify-center text-white font-bold shadow-lg`}>
                            Pool {String.fromCharCode(65 + idx)}
                          </div>
                          <input
                            type="number"
                            min="0"
                            max={config.bracketSize}
                            value={size}
                            onChange={(e) => {
                              const newSizes = [...config.customGroupSizes];
                              const value = parseInt(e.target.value);
                              newSizes[idx] = isNaN(value) ? 0 : Math.max(0, Math.min(config.bracketSize, value));
                              setConfig({ ...config, customGroupSizes: newSizes });
                            }}
                            className="flex-1 px-4 py-3 bg-slate-700 border-2 border-purple-500/30 rounded-xl text-white text-xl font-bold focus:outline-none focus:border-purple-400 focus:shadow-lg focus:shadow-purple-500/20 transition-all"
                            placeholder="0"
                          />
                        </div>
                      );
                    })}
                    <div className={`flex items-center justify-between p-3 rounded-lg ${
                      config.customGroupSizes?.reduce((a, b) => a + b, 0) === config.bracketSize
                        ? 'bg-green-500/20 border-2 border-green-500/50'
                        : 'bg-red-500/20 border-2 border-red-500/50'
                    }`}>
                      <span className="text-sm font-medium text-white">Total:</span>
                      <span className={`text-lg font-bold ${
                        config.customGroupSizes?.reduce((a, b) => a + b, 0) === config.bracketSize
                          ? 'text-green-400'
                          : 'text-red-400'
                      }`}>
                        {config.customGroupSizes?.reduce((a, b) => a + b, 0)} / {config.bracketSize}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {config.format === 'ROUND_ROBIN_KNOCKOUT' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
                    <TrophyIcon className="w-4 h-4 text-yellow-400" />
                    Players Advancing from Each Group
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {[1, 2, 3, 4].map((num, idx) => {
                      const colors = [
                        'from-yellow-500 to-amber-500 border-yellow-400 shadow-yellow-500/30',
                        'from-blue-500 to-cyan-500 border-blue-400 shadow-blue-500/30',
                        'from-purple-500 to-pink-500 border-purple-400 shadow-purple-500/30',
                        'from-green-500 to-emerald-500 border-green-400 shadow-green-500/30'
                      ];
                      return (
                        <button
                          key={num}
                          onClick={() => setConfig({ ...config, advanceFromGroup: num })}
                          className={`py-4 rounded-xl font-bold transition-all border-2 ${
                            config.advanceFromGroup === num
                              ? `bg-gradient-to-br ${colors[idx]} text-white shadow-lg`
                              : 'bg-slate-700 text-gray-400 border-white/10 hover:border-white/30'
                          }`}
                        >
                          Top {num}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-6 border-t border-white/10 bg-gradient-to-r from-slate-800/50 to-slate-700/50 flex gap-3">
          <button 
            onClick={onClose} 
            className="flex-1 px-6 py-4 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-all font-semibold border-2 border-white/10 hover:border-white/20"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-500 hover:to-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg shadow-blue-500/30 border-2 border-blue-400/50"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <Loader className="w-5 h-5 animate-spin" />
                Creating...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Zap className="w-5 h-5" />
                Create Draw
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Custom Alert Modal */}
      {alertMessage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70">
          <div className="relative w-full max-w-md">
            <div className="bg-slate-800 rounded-xl overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-3">Matchify.pro</h3>
                <p className="text-gray-300">{alertMessage}</p>
              </div>
              <div className="p-4 border-t border-white/10">
                <button
                  onClick={() => setAlertMessage(null)}
                  className="w-full px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
      
      // 🔥 CRITICAL FIX: Refetch matches to update bracket display
      try {
        const matchesResponse = await api.get(`/tournaments/${tournamentId}/categories/${activeCategory.id}/matches`);
        setMatches(matchesResponse.data.matches || []);
        console.log('✅ Matches refreshed after bulk assign:', matchesResponse.data.matches?.length || 0);
      } catch (matchErr) {
        console.error('⚠️ Failed to refresh matches:', matchErr);
      }
      
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
      
      // 🔥 CRITICAL FIX: Refetch matches to update bracket display
      try {
        const matchesResponse = await api.get(`/tournaments/${tournamentId}/categories/${activeCategory.id}/matches`);
        setMatches(matchesResponse.data.matches || []);
        console.log('✅ Matches refreshed after shuffle:', matchesResponse.data.matches?.length || 0);
      } catch (matchErr) {
        console.error('⚠️ Failed to refresh matches:', matchErr);
      }
      
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

          {/* Slots Grid - For Round Robin: Show by Pools, For Knockout: Show by Matches */}
          <div className="flex-1 p-4 overflow-y-auto scroll-smooth scrollbar-thin">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                {bracket?.format === 'ROUND_ROBIN' || bracket?.format === 'ROUND_ROBIN_KNOCKOUT' 
                  ? `Pools (${bracket.groups?.length || 0})` 
                  : `Draw Slots (${slots.length})`}
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
            
            {/* ROUND ROBIN: Pool-based view */}
            {(bracket?.format === 'ROUND_ROBIN' || bracket?.format === 'ROUND_ROBIN_KNOCKOUT') && bracket.groups ? (
              <div className="space-y-4">
                {bracket.groups.map((group, groupIndex) => {
                  const groupSlots = slots.filter(s => {
                    const slotIndex = s.slot - 1;
                    const playersPerGroup = Math.ceil(bracket.bracketSize / bracket.numberOfGroups);
                    const groupStart = groupIndex * playersPerGroup;
                    const groupEnd = groupStart + playersPerGroup;
                    return slotIndex >= groupStart && slotIndex < groupEnd;
                  });
                  
                  const assignedInPool = groupSlots.filter(s => getAssignedPlayer(s.slot)).length;
                  const totalInPool = groupSlots.length;
                  
                  return (
                    <div key={groupIndex} className="bg-slate-700/30 rounded-xl border border-white/10 overflow-hidden">
                      {/* Pool Header */}
                      <div className="px-4 py-3 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border-b border-white/10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-500/30 rounded-xl flex items-center justify-center">
                              <span className="text-purple-300 font-bold text-lg">
                                {String.fromCharCode(65 + groupIndex)}
                              </span>
                            </div>
                            <div>
                              <h4 className="text-white font-bold">Pool {String.fromCharCode(65 + groupIndex)}</h4>
                              <p className="text-purple-300 text-xs">
                                {assignedInPool} of {totalInPool} players assigned
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="px-3 py-1 bg-purple-500/20 rounded-lg">
                              <span className="text-purple-300 font-bold text-sm">{totalInPool} slots</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Pool Slots */}
                      <div className="p-3 grid grid-cols-2 gap-2">
                        {groupSlots.map((slot) => {
                          const assigned = getAssignedPlayer(slot.slot);
                          const canAccept = selectedPlayer && !assigned && !slot.locked;
                          
                          return (
                            <div
                              key={slot.slot}
                              onClick={() => canAccept && handleSlotClick(slot)}
                              className={`p-3 rounded-lg border transition-all ${
                                canAccept
                                  ? 'border-purple-500/50 bg-purple-500/10 cursor-pointer hover:bg-purple-500/20 hover:border-purple-500'
                                  : assigned
                                    ? 'border-emerald-500/30 bg-emerald-500/10'
                                    : 'border-white/10 bg-slate-800/30'
                              } ${slot.locked ? 'opacity-50' : ''}`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                    assigned 
                                      ? 'bg-emerald-500/30 text-emerald-300' 
                                      : 'bg-slate-600/30 text-gray-500'
                                  }`}>
                                    {slot.slot}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    {assigned ? (
                                      <p className="text-white font-medium text-sm truncate">{assigned.playerName}</p>
                                    ) : (
                                      <p className="text-gray-500 text-sm">Empty Slot</p>
                                    )}
                                  </div>
                                </div>
                                {assigned && !slot.locked && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveAssignment(slot.slot);
                                    }}
                                    className="p-1 hover:bg-red-500/20 rounded transition-colors flex-shrink-0"
                                  >
                                    <X className="w-4 h-4 text-red-400" />
                                  </button>
                                )}
                                {slot.locked && (
                                  <span className="text-amber-400 text-xs flex-shrink-0">🔒</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* KNOCKOUT: Match-based view (existing code) */
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
            )}
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

// Arrange Knockout Matchups Modal
const ArrangeMatchupsModal = ({ bracket, onClose, onSave, saving }) => {
  const [knockoutSlots, setKnockoutSlots] = useState([]);
  const [advancingPlayers, setAdvancingPlayers] = useState([]);

  useEffect(() => {
    if (bracket && bracket.groups) {
      // Get advancing players based on advanceFromGroup setting
      const players = [];
      const advanceCount = bracket.advanceFromGroup || 1; // How many from each group
      
      console.log('🎯 Advance from each group:', advanceCount);
      
      bracket.groups.forEach((group, groupIndex) => {
        const groupLetter = String.fromCharCode(65 + groupIndex);
        
        // Get standings if available, otherwise use participants
        const standings = group.standings || [];
        
        if (standings.length > 0) {
          // Use standings (sorted by points)
          const topPlayers = standings
            .filter(standing => standing.playerId)
            .sort((a, b) => b.points - a.points)
            .slice(0, advanceCount) // Take only top N
            .map((standing, rank) => ({
              id: standing.playerId,
              name: standing.playerName,
              group: groupLetter,
              rank: rank + 1,
              points: standing.points
            }));
          
          players.push(...topPlayers);
        } else {
          // Fallback: use participants
          const participants = group.participants || [];
          participants.slice(0, advanceCount).forEach((participant, index) => {
            if (participant && participant.id) {
              players.push({
                id: participant.id,
                name: participant.name,
                group: groupLetter,
                rank: index + 1,
                points: 0
              });
            }
          });
        }
      });
      
      console.log('🎯 Found', players.length, 'advancing players:', players);
      
      setAdvancingPlayers(players);
      
      // Create knockout slots based on number of advancing players
      // For 2 players = 1 match (final)
      // For 4 players = 2 matches (semifinals)
      // For 8 players = 4 matches (quarterfinals)
      const totalPlayers = players.length;
      const numMatches = Math.max(Math.floor(totalPlayers / 2), 1);
      const slots = [];
      
      console.log('🎯 Creating', numMatches, 'knockout matches for', totalPlayers, 'players');
      
      for (let i = 0; i < numMatches; i++) {
        slots.push({
          matchNumber: i + 1,
          player1: null,
          player2: null
        });
      }
      
      // If knockout bracket already exists with player assignments, preserve them
      if (bracket.knockout && bracket.knockout.rounds && bracket.knockout.rounds[0] && bracket.knockout.rounds[0].matches) {
        const existingMatches = bracket.knockout.rounds[0].matches;
        existingMatches.forEach((match, index) => {
          if (index < slots.length) {
            slots[index].player1 = match.player1 || null;
            slots[index].player2 = match.player2 || null;
          }
        });
      }
      
      setKnockoutSlots(slots);
    }
  }, [bracket]);

  const assignPlayerToSlot = (player, matchIndex, position) => {
    const newSlots = [...knockoutSlots];
    
    // Remove player from any existing slot
    newSlots.forEach(slot => {
      if (slot.player1?.id === player.id) slot.player1 = null;
      if (slot.player2?.id === player.id) slot.player2 = null;
    });
    
    // Assign to new slot
    if (position === 1) {
      newSlots[matchIndex].player1 = player;
    } else {
      newSlots[matchIndex].player2 = player;
    }
    
    setKnockoutSlots(newSlots);
  };

  const removePlayerFromSlot = (matchIndex, position) => {
    const newSlots = [...knockoutSlots];
    if (position === 1) {
      newSlots[matchIndex].player1 = null;
    } else {
      newSlots[matchIndex].player2 = null;
    }
    setKnockoutSlots(newSlots);
  };

  const getAssignedPlayerIds = () => {
    const ids = new Set();
    knockoutSlots.forEach(slot => {
      if (slot.player1) ids.add(slot.player1.id);
      if (slot.player2) ids.add(slot.player2.id);
    });
    return ids;
  };

  const handleSave = () => {
    // Validate all slots are filled
    const allFilled = knockoutSlots.every(slot => slot.player1 && slot.player2);
    
    console.log('💾 Saving knockout slots:', knockoutSlots);
    console.log('All slots filled?', allFilled);
    
    if (!allFilled) {
      alert('Please assign all players to knockout matches');
      return;
    }
    
    onSave(knockoutSlots);
  };

  const assignedIds = getAssignedPlayerIds();
  const unassignedPlayers = advancingPlayers.filter(p => !assignedIds.has(p.id));

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Arrange Knockout Matchups</h2>
              <p className="text-gray-400 text-sm mt-1">Select players to arrange knockout stage matches</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Unassigned Players */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Advancing Players ({advancingPlayers.length})</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {unassignedPlayers.map(player => (
                <div
                  key={player.id}
                  className="p-3 bg-slate-700 rounded-lg border border-slate-600"
                >
                  <div className="text-sm font-medium text-white">{player.name}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    Pool {player.group} • Rank #{player.rank} • {player.points} pts
                  </div>
                </div>
              ))}
              {unassignedPlayers.length === 0 && (
                <div className="col-span-full text-center text-gray-400 text-sm py-4">
                  All players assigned
                </div>
              )}
            </div>
          </div>

          {/* Knockout Matches */}
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-3">Knockout Matches</h3>
            <div className="space-y-3">
              {knockoutSlots.map((slot, index) => (
                <div key={index} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                  <div className="text-xs text-gray-400 mb-3">Match {slot.matchNumber}</div>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Player 1 Slot */}
                    <div className="space-y-2">
                      <label className="text-xs text-gray-400">Player 1</label>
                      {slot.player1 ? (
                        <div className="p-3 bg-blue-600 rounded-lg flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium text-white">{slot.player1.name}</div>
                            <div className="text-xs text-blue-200">Pool {slot.player1.group} • Rank #{slot.player1.rank}</div>
                          </div>
                          <button
                            onClick={() => removePlayerFromSlot(index, 1)}
                            className="text-white/70 hover:text-white"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <select
                          onChange={(e) => {
                            const player = advancingPlayers.find(p => p.id === e.target.value);
                            if (player) assignPlayerToSlot(player, index, 1);
                          }}
                          value=""
                          className="w-full p-3 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm"
                        >
                          <option value="">Select player...</option>
                          {unassignedPlayers.map(player => (
                            <option key={player.id} value={player.id}>
                              {player.name} (Pool {player.group} • Rank #{player.rank})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Player 2 Slot */}
                    <div className="space-y-2">
                      <label className="text-xs text-gray-400">Player 2</label>
                      {slot.player2 ? (
                        <div className="p-3 bg-blue-600 rounded-lg flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium text-white">{slot.player2.name}</div>
                            <div className="text-xs text-blue-200">Pool {slot.player2.group} • Rank #{slot.player2.rank}</div>
                          </div>
                          <button
                            onClick={() => removePlayerFromSlot(index, 2)}
                            className="text-white/70 hover:text-white"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <select
                          onChange={(e) => {
                            const player = advancingPlayers.find(p => p.id === e.target.value);
                            if (player) assignPlayerToSlot(player, index, 2);
                          }}
                          value=""
                          className="w-full p-3 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm"
                        >
                          <option value="">Select player...</option>
                          {unassignedPlayers.map(player => (
                            <option key={player.id} value={player.id}>
                              {player.name} (Pool {player.group} • Rank #{player.rank})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-white/10 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Matchups'}
          </button>
        </div>
      </div>
    </div>
  );
};

