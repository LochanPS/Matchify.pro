import { getErrorMessage } from '../utils/errorMessage';
import { getDrawCache, setDrawCache, clearDrawCache } from '../utils/drawCache';
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
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { drawAPI } from '../api/draw';
import { tournamentAPI } from '../api/tournament';
import api from '../utils/api';
import SingleEliminationBracket from '../components/brackets/SingleEliminationBracket';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeftIcon, TrophyIcon } from '@heroicons/react/24/outline';
import { Loader, Zap, Layers, X, Plus, Settings, Users, CheckCircle, AlertTriangle, Trash2, UserPlus, Gavel, AlertCircle, Play, Trophy, Clock, Eye, Edit, ArrowLeft, ChevronUp, ChevronDown, ListOrdered } from 'lucide-react';
import { getTournamentAllMatches } from '../api/matches';
import Spinner from '../components/Spinner';

// Pre-generated particle data — deterministic, never re-randomized on render
const DRAW_BG_PARTICLES = Array.from({ length: 15 }, (_, i) => ({
  w: (i * 7 + 3) % 6 + 2,  h: (i * 11 + 1) % 6 + 2,
  x: (i * 37 + 11) % 97,   y: (i * 53 + 7) % 91,
  c: ['#F59E0B', '#FCD34D', '#a855f7', '#F59E0B'][i % 4],
  o: ((i * 13) % 45) / 100 + 0.43,
  dur: (i * 7) % 10 + 5,   delay: (i * 3) % 5,
  glow: (i * 11) % 20 + 10,
}));
const ASSIGN_PARTICLES = Array.from({ length: 8 }, (_, i) => ({
  w: (i * 5 + 2) % 4 + 2,  h: (i * 5 + 2) % 4 + 2,
  x: (i * 41 + 17) % 97,   y: (i * 59 + 13) % 91,
  c: ['#F59E0B', '#FCD34D'][i % 2],
  o: ((i * 17) % 45) / 100 + 0.43,
  dur: (i * 9) % 8 + 4,    delay: (i * 4) % 3,
  glow: (i * 13) % 15 + 5,
}));
const ARRANGE_PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  w: (i * 7 + 3) % 6 + 3,  h: (i * 7 + 3) % 6 + 3,
  x: (i * 43 + 19) % 97,   y: (i * 61 + 11) % 91,
  c: ['#F59E0B', '#FCD34D', '#a855f7', '#F59E0B'][i % 4],
  o: ((i * 19) % 50) / 100 + 0.5,
  dur: (i * 11) % 8 + 4,   delay: (i * 5) % 3,
  glow: (i * 17) % 25 + 15,
}));

// Polling interval for live match updates (ms) — increase to reduce server load
const MATCH_POLL_INTERVAL_MS = 15000;

// Utility function to display player names with partner names for doubles
const getPlayerDisplay = (player) => {
  if (!player || !player.name || player.name === 'TBD') return 'TBD';
  if (player.partnerName) {
    return `${player.name} & ${player.partnerName}`;
  }
  return player.name;
};

const DrawPage = () => {
  const { tournamentId, categoryId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
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
  const [loadingUmpires, setLoadingUmpires] = useState(false);
  const [umpiresError, setUmpiresError] = useState(null);
  const [showUmpireModal, setShowUmpireModal] = useState(false);
  const [selectedMatchForUmpire, setSelectedMatchForUmpire] = useState(null);
  const [showUmpireQueueModal, setShowUmpireQueueModal] = useState(false);
  const [showManageUmpiresModal, setShowManageUmpiresModal] = useState(false);
  const pollIntervalRef = React.useRef(null);
  const activeCategoryIdRef = React.useRef(null); // stable ref for polling closure
  const fetchInProgressRef = React.useRef(false); // guard against overlapping fetches
  const [tournamentStats, setTournamentStats] = useState({
    totalPlayers: 0,
    confirmedPlayers: 0,
    totalMatches: 0,
    completedMatches: 0
  });
  const [refreshing, setRefreshing] = useState(false);
  const [bracketLoading, setBracketLoading] = useState(false);
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

  // Remove player
  const [removePlayerConfirm, setRemovePlayerConfirm] = useState(null); // registration object to confirm
  const [removingPlayer, setRemovingPlayer] = useState(false);

  // ─── Combined draw-page fetch (single round trip, auto-retry once on 500) ───
  const fetchDrawPageFull = async (catId, _retryCount = 0) => {
    if (!tournamentId || !catId) return;
    // Prevent overlapping fetches — if one is already in-flight, skip
    if (fetchInProgressRef.current && _retryCount === 0) return;
    fetchInProgressRef.current = true;

    // ── Option A: show cached draw instantly ─────────────────────────────────
    const cached = getDrawCache(tournamentId, catId);
    if (cached) {
      // Apply cached data immediately — 0ms perceived load
      if (cached.tournament) setTournament(cached.tournament);
      if (cached.categories) setCategories(cached.categories);
      if (cached.matches)    setMatches(cached.matches);
      if (cached.stats)      setTournamentStats(cached.stats);
      if (cached.activeCategory) setActiveCategory(cached.activeCategory);
      setBracket(cached.bracket ?? null);
      setLoading(false);
      setBracketLoading(false);
      // Fall through — fetch fresh in background without showing spinner
    } else {
      setLoading(true);
      setBracketLoading(true);
    }

    setError(null);

    try {
      const response = await api.get(
        `/tournaments/${tournamentId}/draw-page/${catId}`,
        { headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }, _skipLogout: true }
      );

      if (!response.data.success) {
        if (!cached) setBracket(null);
        return;
      }

      const { tournament: t, categories: cats, draw, matches: fetchedMatches, stats } = response.data.data;

      setTournament(t);
      setCategories(cats || []);
      setMatches(fetchedMatches || []);
      setTournamentStats(stats);

      // Prefetch umpires in background so ASSIGN modal opens instantly
      if (user?.id) {
        tournamentAPI.getTournamentUmpires(tournamentId)
          .then(r => setTournamentUmpires(r.umpires || []))
          .catch(err => console.warn('⚠️ Umpire prefetch failed:', err?.response?.status, err?.message));
      }

      // Set active category from response categories
      const active = catId
        ? (cats || []).find(c => c.id === catId) || (cats || [])[0]
        : (cats || [])[0];
      if (active) setActiveCategory(active);

      let bracketData = null;
      if (draw) {
        bracketData = draw.bracketJson;
        if (typeof bracketData === 'string') {
          try {
            bracketData = JSON.parse(bracketData);
          } catch (parseErr) {
            console.error('❌ Failed to parse bracketJson:', parseErr);
            bracketData = null;
          }
        }
        setBracket(bracketData);
      } else {
        if (!cached) setBracket(null);
      }

      // Save fresh data to cache for next visit
      setDrawCache(tournamentId, catId, {
        tournament: t,
        categories: cats || [],
        matches: fetchedMatches || [],
        stats,
        bracket: bracketData,
        activeCategory: active || null,
      });

    } catch (err) {
      // If user is already seeing cached data, suppress the error silently
      if (cached) return;

      const status = err.response?.status;
      // Auto-retry once on 500 (Vercel cold start / transient DB issue) after 2s
      if (status === 500 && _retryCount === 0) {
        setTimeout(() => fetchDrawPageFull(catId, 1), 2000);
        return; // keep spinner — finally won't run because of early return
      }
      if (status === 404) {
        setBracket(null);
        setError(null);
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
        setError(isOnline
          ? 'Server is temporarily unavailable. Please wait a moment and try again.'
          : 'No internet connection. Please check your network.');
      } else if (status === 500) {
        const detail = err.response?.data?.details;
        setError(detail ? `Server error: ${detail}` : 'Server error — please try refreshing the page.');
      } else {
        setBracket(null);
        setError(null);
      }
    } finally {
      setLoading(false);
      setBracketLoading(false);
      fetchInProgressRef.current = false;
    }
  };

  // ─── Main load effect ─────────────────────────────────────────────────────────
  // If categoryId is in the URL → one combined call (no waterfall).
  // Auto-dismiss connection errors after 6s — keeps screen clean
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 6000);
    return () => clearTimeout(t);
  }, [error]);

  // If not (rare) → fall back to old fetchTournamentData so activeCategory gets set,
  //   then the second effect picks it up.
  useEffect(() => {
    if (!tournamentId) return;

    // Check if returning from match completion
    const state = window.history.state?.usr;
    if (state?.matchComplete) {
      setMatchCompleteData({ winner: state.winner, duration: state.duration });
      setShowSuccessModal(true);
      window.history.replaceState({}, document.title);
    }

    if (categoryId) {
      fetchDrawPageFull(categoryId);
    } else {
      fetchTournamentData();
    }
  }, [tournamentId, categoryId]);

  // Fallback: when no categoryId in URL, fetchTournamentData sets activeCategory,
  // then this effect fires and fetches draw+matches+stats.
  useEffect(() => {
    if (!tournamentId || !activeCategory?.id || categoryId) return;
    fetchInProgressRef.current = false; // reset guard on category change
    fetchDrawPageFull(activeCategory.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId, activeCategory?.id, categoryId]);

  // Check if round robin stage is complete
  const isRoundRobinComplete = () => {
    if (!bracket || bracket.format !== 'ROUND_ROBIN_KNOCKOUT') return false;
    if (!matches || matches.length === 0) {
      return false;
    }
    
    // Get all round robin matches (stage = 'GROUP')
    const roundRobinMatches = matches.filter(m => m.stage === 'GROUP');
    
    
    if (roundRobinMatches.length === 0) {
      return false;
    }
    
    // Check if all round robin matches are completed
    const allComplete = roundRobinMatches.every(m => m.status === 'COMPLETED');
    return allComplete;
  };

  // Handle refresh parameter from URL (when returning from match completion)
  // Page was hard-reloaded via window.location.href so initial fetch already has fresh data.
  // Just clear the param and show a brief success message — no re-fetch needed.
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const shouldRefresh = urlParams.get('refresh');

    if (shouldRefresh === 'true') {
      // Clear ?refresh=true from URL
      const newSearch = location.search.replace(/[?&]refresh=true/, '').replace(/^&/, '?');
      window.history.replaceState({}, '', location.pathname + (newSearch || ''));
    }
  }, [location.search]);

  // Lightweight match-only refresh — used by polling and after local actions
  const fetchMatchesOnly = React.useCallback(async (catId) => {
    const id = catId || activeCategoryIdRef.current;
    if (!tournamentId || !id) return;
    try {
      const res = await api.get(
        `/tournaments/${tournamentId}/categories/${id}/matches`,
        { headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' } }
      );
      setMatches(res.data.matches || []);
    } catch {
      // silent — polling errors should not surface to user
    }
  }, [tournamentId]);

  // Keep ref in sync so polling closure always has the latest categoryId
  React.useEffect(() => {
    activeCategoryIdRef.current = activeCategory?.id || null;
  }, [activeCategory?.id]);

  // Poll for match updates every 15s — lightweight, only fetches matches array
  // Keeps draw page live for organizers watching while umpires play
  React.useEffect(() => {
    if (!tournamentId || !activeCategory?.id) return;

    // Start polling
    pollIntervalRef.current = setInterval(() => {
      fetchMatchesOnly(activeCategoryIdRef.current);
    }, MATCH_POLL_INTERVAL_MS);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [tournamentId, activeCategory?.id, fetchMatchesOnly]);

  // Silent auto-repair: for ROUND_ROBIN_KNOCKOUT, when organizer views the knockout
  // stage, silently call repair-knockout once so winner propagation is up-to-date.
  const autoRepairDoneRef = React.useRef(null); // stores last repaired categoryId
  useEffect(() => {
    const organizer = user?.id && tournament?.organizerId && user.id === tournament.organizerId;
    if (
      !organizer ||
      bracket?.format !== 'ROUND_ROBIN_KNOCKOUT' ||
      activeStage !== 'knockout' ||
      !activeCategory?.id ||
      !tournamentId ||
      autoRepairDoneRef.current === activeCategory.id  // already repaired this category
    ) return;

    autoRepairDoneRef.current = activeCategory.id;
    api
      .post(`/tournaments/${tournamentId}/categories/${activeCategory.id}/draw/repair-knockout`)
      .then(() => fetchBracket())
      .catch((err) => {
        // Log for debugging but don't surface to user — repair failure is non-critical
        console.warn('⚠️ Auto-repair knockout failed (non-critical):', err?.response?.status, err?.message);
      });
  }, [user?.id, tournament?.organizerId, bracket?.format, activeStage, activeCategory?.id, tournamentId]);

  const fetchTournamentData = async () => {
    try {
      setLoading(true);

      // Parallel fetch — tournament + categories in one round trip
      const [tournamentData, categoriesData] = await Promise.all([
        tournamentAPI.getTournament(tournamentId),
        tournamentAPI.getCategories(tournamentId),
      ]);
      setTournament(tournamentData.data);

      const cats = categoriesData.categories || [];
      setCategories(cats);

      const active = categoryId
        ? cats.find(c => c.id === categoryId)
        : cats[0];
      
      if (active) {
        setActiveCategory(active);
      } else if (cats.length > 0) {
        setActiveCategory(cats[0]);
      } else {
      }
    } catch (err) {
      console.error('❌ Error fetching tournament data:', err);
      setError('Failed to load tournament data');
    } finally {
      setLoading(false);
    }
  };

  const fetchBracket = async () => {
    // SAFETY CHECK: Ensure both tournamentId and activeCategory.id exist
    if (!tournamentId) {
      console.warn('⚠️ fetchBracket called but tournamentId is missing');
      return;
    }
    
    if (!activeCategory?.id) {
      console.warn('⚠️ fetchBracket called but activeCategory is not ready');
      return;
    }


    setBracketLoading(true);
    setError(null);

    try {
      // Parallel fetch — draw + matches in one round trip
      const timestamp = new Date().getTime();
      const [response, matchesResponse] = await Promise.all([
        api.get(`/tournaments/${tournamentId}/categories/${activeCategory.id}/draw?t=${timestamp}`, {
          headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
        }),
        api.get(`/tournaments/${tournamentId}/categories/${activeCategory.id}/matches`).catch(() => ({ data: { matches: [] } })),
      ]);

      setMatches(matchesResponse.data.matches || []);

      const draw = response.data.draw;

      if (!draw) {
        setError(null);
        setBracket(null);
        return;
      }

      // Parse bracketJson if it's a string
      const bracketData = draw.bracketJson || draw.bracket;

      if (!bracketData) {
        setError(null);
        setBracket(null);
        return;
      }

      const parsedBracket = typeof bracketData === 'string' ? JSON.parse(bracketData) : bracketData;

      setBracket(parsedBracket);
    } catch (err) {
      console.error('❌ Error fetching bracket:', err);
      
      // Enhanced error logging with full details
      const errorDetails = {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        url: err.config?.url,
        method: err.config?.method,
        responseData: err.response?.data,
        hasResponse: !!err.response,
        hasRequest: !!err.request
      };
      
      console.error('📋 Full Error Details:', errorDetails);
      
      // Log specific error type
      if (err.response) {
        console.error('🔴 Server Response Error:', {
          status: err.response.status,
          statusText: err.response.statusText,
          data: err.response.data,
          headers: err.response.headers
        });
      } else if (err.request) {
        console.error('🔴 No Response Received (Network Error):', {
          request: err.request,
          message: 'The request was made but no response was received'
        });
      } else {
        console.error('🔴 Request Setup Error:', err.message);
      }
      
      // Handle different error scenarios
      if (err.response?.status === 404) {
        setError(null);
        setBracket(null);
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        console.error('⚠️ Network error - Cannot reach server');
        setError('Network error: Cannot connect to server. Please check your connection and try again.');
        // Don't clear bracket on network errors - keep existing data
      } else {
        // For other API errors, silently show empty draw state (no red banner)
        const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Failed to load bracket';
        console.error('⚠️ API error occurred:', errorMessage);
        setError(null);
        setBracket(null);
      }
    } finally {
      setBracketLoading(false);
    }
  };

  const fetchTournamentStats = async () => {
    if (!activeCategory) return;

    try {
      // Parallel fetch — registrations + matches in one round trip
      const [registrationsResponse, matchesResponse] = await Promise.all([
        api.get(`/tournaments/${tournamentId}/categories/${activeCategory.id}/registrations`),
        api.get(`/tournaments/${tournamentId}/categories/${activeCategory.id}/matches`),
      ]);
      const registrations = registrationsResponse.data.registrations || [];
      const matches = matchesResponse.data.matches || [];

      // Simply use the actual matches count from the database
      // This is the most reliable source since matches are already created
      const actualTotalMatches = matches.length;


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
      } catch (matchErr) {
        console.error('⚠️ Failed to load matches:', matchErr);
        setMatches([]);
      }
      
      setSuccess('Draw created successfully!');
      setShowConfigModal(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error creating draw:', err);
      setError(getErrorMessage(err, 'Failed to create draw'));
    } finally {
      setGenerating(false);
    }
  };

  const handleCategoryChange = (category) => {
    if (category.id === activeCategory?.id) return; // Already on this category
    // Clear any open match details modal — stale data from previous category
    setShowMatchDetailsModal(false);
    setSelectedMatchDetails(null);
    // Reset fetch guard so new category fetch isn't blocked
    fetchInProgressRef.current = false;
    // Clear draw data immediately — prevents old category's bracket showing
    // while new category's data is loading. Cache will repopulate instantly if available.
    const cached = getDrawCache(tournamentId, category.id);
    if (!cached) {
      setBracket(null);
      setMatches([]);
    }
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
      setMatches([]);
      setTournamentStats(prev => ({ ...prev, totalMatches: 0, completedMatches: 0 }));
      setSuccess('Draw deleted successfully!');
      setShowDeleteModal(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error deleting draw:', err);
      setError(getErrorMessage(err, 'Failed to delete draw'));
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
      await api.post(`/tournaments/${tournamentId}/categories/${activeCategory.id}/draw/restart`, {
        activeStage
      });

      // Refresh everything with fresh data
      await fetchDrawPageFull(activeCategory.id);

      const isHybrid = bracket?.format === 'ROUND_ROBIN_KNOCKOUT';
      setSuccess(
        isHybrid && activeStage === 'knockout'
          ? 'Knockout stage restarted. Group results preserved.'
          : isHybrid && activeStage === 'roundrobin'
            ? 'Full draw restarted. All group and knockout matches have been reset.'
            : 'Draw restarted successfully! All matches have been reset.'
      );
      setShowRestartModal(false);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error('Error restarting draw:', err);
      setError(getErrorMessage(err, 'Failed to restart draw'));
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
      
      await api.post(`/tournaments/${tournamentId}/categories/${activeCategory.id}/draw/arrange-knockout`, {
        knockoutSlots
      });
      

      // Use full draw-page refresh so tournament/categories/matches/stats all update correctly.
      // fetchBracket uses getDraw which has matchNumber-based KO lookup and can miss
      // globally-numbered KO matches created by assignPlayersToDraw.
      await fetchDrawPageFull(activeCategory.id);


      // Auto-switch to Knockout tab
      setActiveStage('knockout');
      
      setSuccess('Knockout matchups arranged successfully!');
      setShowArrangeMatchupsModal(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error arranging knockout matchups:', err);
      setError(getErrorMessage(err, 'Failed to arrange knockout matchups'));
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
      
      
      // Show detailed success message with points info
      const pointsInfo = response.data.pointsAwarded || {};
      const totalPlayersAwarded = pointsInfo.playersAwarded || 0;
      
      setSuccess(`Category '${activeCategory.name}' ended successfully! Points awarded to ${totalPlayersAwarded} players.`);
      setShowEndTournamentModal(false);

      // Refresh everything (bracket + matches + stats + tournament/categories)
      await fetchDrawPageFull(activeCategory.id);

      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error('❌ Error ending category:', err);
      console.error('❌ Error response:', err.response);
      console.error('❌ Error data:', err.response?.data);
      console.error('❌ Error status:', err.response?.status);
      console.error('❌ Full error:', err);
      setError(getErrorMessage(err, 'Failed to end category'));
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

  // Fetch tournament umpires — always fresh, shows errors, supports retry
  const loadUmpires = async () => {
    setLoadingUmpires(true);
    setUmpiresError(null);
    try {
      const response = await tournamentAPI.getTournamentUmpires(tournamentId);
      setTournamentUmpires(response.umpires || []);
    } catch (err) {
      console.error('Error fetching umpires:', err?.response?.status, err?.message);
      setUmpiresError(err?.response?.data?.error || 'Failed to load umpires');
    } finally {
      setLoadingUmpires(false);
    }
  };

  // Keep for backward compat (used nowhere else now)
  const fetchTournamentUmpires = loadUmpires;

  // Open umpire assignment modal - create match if needed
  const openUmpireModal = async (matchData, bracketMatch) => {
    let matchRecord = null;

    if (matchData && matchData.id) {
      // DB match already exists — use it directly
      matchRecord = matchData;
    } else if (bracketMatch && activeCategory) {
      // No DB match yet — create it first
      try {
        setError(null);
        const response = await api.post(`/tournaments/${tournamentId}/categories/${activeCategory.id}/matches`, {
          matchNumber: bracketMatch.matchNumber,
          round: bracketMatch.round || 1,
          player1Id: bracketMatch.player1?.id,
          player2Id: bracketMatch.player2?.id
        });
        matchRecord = response.data.match;
        fetchBracket();
      } catch (err) {
        console.error('Error creating match:', err);
        setError(getErrorMessage(err, 'Failed to create match. Please try again.'));
        return;
      }
    }

    if (!matchRecord) return;

    // Open modal immediately with spinner, then load umpires
    setSelectedMatchForUmpire(matchRecord);
    setShowUmpireModal(true);
    await loadUmpires();
  };

  // Assign umpire to match
  const assignUmpireToMatch = async (umpireId) => {
    if (!selectedMatchForUmpire) return;

    const matchId = selectedMatchForUmpire.id;
    try {
      await api.put(`/matches/${matchId}/umpire`, { umpireId });

      // Optimistic patch — store umpireId + full umpire object so name shows on card.
      const umpireObj = tournamentUmpires.find(u => u.id === umpireId);
      setMatches(prev => prev.map(m => m.id === matchId ? { ...m, umpireId, umpire: umpireObj || { id: umpireId } } : m));

      setSuccess('Umpire assigned successfully!');
      setShowUmpireModal(false);
      setSelectedMatchForUmpire(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error assigning umpire:', err);
      setError(getErrorMessage(err, 'Failed to assign umpire'));
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
      
      // Full refresh — updates bracket, matches, tournament status, category status
      await fetchDrawPageFull(activeCategory.id);
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error changing match result:', err);
      setError(getErrorMessage(err, 'Failed to change match result'));
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
      } catch (matchErr) {
        console.error('⚠️ Failed to refresh matches:', matchErr);
        // Don't fail the whole operation if match refresh fails
      }
      
      setSuccess('Players assigned successfully!');
      setShowAssignModal(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error assigning players:', err);
      setError(getErrorMessage(err, 'Failed to assign players'));
    } finally {
      setAssigning(false);
    }
  };

  if (loading && !tournament) {
    return (
      <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #0a0a1f 0%, #050810 30%, #0d1a2a 60%, #050810 100%)' }}>
        <style>{`
          @keyframes draw-float {
            0%, 100% { transform: translate(0, 0) scale(1); }
            25% { transform: translate(20px, -20px) scale(1.05); }
            50% { transform: translate(-15px, 15px) scale(0.95); }
            75% { transform: translate(15px, 10px) scale(1.02); }
          }
          @keyframes draw-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes draw-pulse-glow {
            0%, 100% { opacity: 0.5; box-shadow: 0 0 20px rgba(245,158,11,0.3); }
            50% { opacity: 1; box-shadow: 0 0 40px rgba(245,158,11,0.7); }
          }
          @keyframes draw-shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          .draw-skeleton {
            background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(245,158,11,0.07) 50%, rgba(255,255,255,0.03) 75%);
            background-size: 200% 100%;
            animation: draw-shimmer 1.8s ease-in-out infinite;
          }
        `}</style>

        {/* Animated background orbs — matches main DrawPage */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-30"
            style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.4) 0%, transparent 70%)', animation: 'draw-float 8s ease-in-out infinite' }} />
          <div className="absolute top-1/4 left-0 w-80 h-80 rounded-full blur-3xl opacity-25"
            style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.4) 0%, transparent 70%)', animation: 'draw-float 10s ease-in-out infinite reverse', animationDelay: '2s' }} />
          <div className="absolute bottom-1/3 right-1/4 w-72 h-72 rounded-full blur-3xl opacity-20"
            style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.3) 0%, transparent 70%)', animation: 'draw-float 12s ease-in-out infinite', animationDelay: '4s' }} />
        </div>

        {/* Centered content */}
        <div className="relative min-h-screen flex flex-col items-center justify-center px-6">

          {/* Spinner */}
          <div className="relative w-20 h-20 mb-6">
            <div className="absolute inset-0 rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)', animation: 'draw-pulse-glow 2s ease-in-out infinite' }} />
            <div className="absolute inset-0 rounded-full border-4"
              style={{
                borderColor: 'rgba(245,158,11,0.15)',
                borderTopColor: '#F59E0B',
                borderRightColor: 'rgba(245,158,11,0.45)',
                animation: 'draw-spin 0.9s linear infinite',
                boxShadow: '0 0 18px rgba(245,158,11,0.4), inset 0 0 10px rgba(245,158,11,0.08)'
              }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full"
                style={{ background: '#F59E0B', boxShadow: '0 0 12px rgba(245,158,11,0.9)', animation: 'draw-pulse-glow 2s ease-in-out infinite' }} />
            </div>
          </div>

          <p className="text-lg font-semibold tracking-wide mb-1" style={{ color: '#F59E0B' }}>Loading Draw</p>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Fetching bracket data…</p>

          {/* Skeleton bracket slots */}
          <div className="mt-10 w-full max-w-xs space-y-3">
            {[1, 0.75, 0.5].map((opacity, i) => (
              <div key={i} className="draw-skeleton rounded-xl h-16"
                style={{ border: '1px solid rgba(245,158,11,0.1)', opacity, animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const isOrganizer = user?.id === tournament?.organizerId;
  const isAdminUser = user?.isAdmin === true;
  const canManagePlayers = isOrganizer || isAdminUser;
  const drawNotGenerated = !bracket && activeCategory;

  const handleRemovePlayer = async () => {
    if (!removePlayerConfirm) return;
    setRemovingPlayer(true);
    try {
      await api.delete(
        `/tournaments/${tournamentId}/categories/${activeCategory.id}/registrations/${removePlayerConfirm.id}/remove`
      );
      // Refresh player list
      const response = await api.get(
        `/tournaments/${tournamentId}/categories/${activeCategory.id}/registrations`,
        { _noCache: true }
      );
      const updated = response.data.registrations || [];
      setRegisteredPlayers(updated);
      setTournamentStats(prev => ({
        ...prev,
        totalPlayers: updated.length,
        confirmedPlayers: updated.filter(r => r.status === 'confirmed').length
      }));
      setRemovePlayerConfirm(null);
      // Refresh draw data so bracket reflects the removal
      fetchDrawPageFull(activeCategory.id);
    } catch (err) {
      console.error('Remove player failed:', err);
      alert(err.response?.data?.error || 'Failed to remove player. Please try again.');
    } finally {
      setRemovingPlayer(false);
    }
  };
  
  // Check if category is completed (ended)
  const isCategoryCompleted = activeCategory?.status === 'completed';
  
  // Check if any match has been played (completed or in progress)
  const hasPlayedMatches = matches.some(m => m.status === 'COMPLETED' || m.status === 'IN_PROGRESS');

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ 
      background: 'linear-gradient(180deg, #0a0a1f 0%, #050810 30%, #0d1a2a 60%, #050810 100%)' 
    }}>
      {/* Animated Background Elements */}
      <div className="fixed top-0 bottom-0 pointer-events-none overflow-hidden" style={{ left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "480px" }}>
        {/* Large Gradient Orbs */}
        <div 
          className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-30 animate-pulse"
          style={{ 
            background: 'radial-gradient(circle, rgba(245,158,11,0.4) 0%, rgba(245,158,11,0.2) 40%, transparent 70%)',
            animation: 'float 8s ease-in-out infinite'
          }}
        />
        <div 
          className="absolute top-1/4 left-0 w-80 h-80 rounded-full blur-3xl opacity-25 animate-pulse"
          style={{ 
            background: 'radial-gradient(circle, rgba(20,184,166,0.4) 0%, rgba(13,148,136,0.2) 40%, transparent 70%)',
            animation: 'float 10s ease-in-out infinite reverse',
            animationDelay: '2s'
          }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full blur-3xl opacity-20 animate-pulse"
          style={{ 
            background: 'radial-gradient(circle, rgba(245,158,11,0.4) 0%, rgba(14,165,233,0.2) 40%, transparent 70%)',
            animation: 'float 12s ease-in-out infinite',
            animationDelay: '4s'
          }}
        />
        <div 
          className="absolute top-1/2 right-1/3 w-64 h-64 rounded-full blur-3xl opacity-15 animate-pulse"
          style={{ 
            background: 'radial-gradient(circle, rgba(245,158,11,0.4) 0%, rgba(5,150,105,0.2) 40%, transparent 70%)',
            animation: 'float 9s ease-in-out infinite reverse',
            animationDelay: '1s'
          }}
        />
        
        {/* Floating Particles */}
        {DRAW_BG_PARTICLES.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${p.w}px`,
              height: `${p.h}px`,
              left: `${p.x}%`,
              top: `${p.y}%`,
              background: p.c,
              opacity: p.o,
              animation: `float ${p.dur}s ease-in-out infinite`,
              animationDelay: `${p.delay}s`,
              boxShadow: `0 0 ${p.glow}px ${p.c}`,
            }}
          />
        ))}
      </div>

      {/* Add keyframes for animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -20px) scale(1.05); }
          50% { transform: translate(-15px, 15px) scale(0.95); }
          75% { transform: translate(15px, 10px) scale(1.02); }
        }
        @keyframes glow {
          0%, 100% { opacity: 0.5; filter: brightness(1); }
          50% { opacity: 1; filter: brightness(1.3); }
        }
        .btn-brand { background: linear-gradient(135deg, #F59E0B, #FCD34D); color: #050810 !important; }
        .btn-brand:hover { box-shadow: 0 8px 25px rgba(245,158,11,0.4); transform: scale(1.05); }
        .btn-brand-sm { background: linear-gradient(135deg, #F59E0B, #FCD34D); color: #050810 !important; }
        .card-brand { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); }
        .card-dark { background: #0d1025; border: 1px solid rgba(255,255,255,0.1); }
        .tab-active { background: linear-gradient(135deg, #F59E0B, #FCD34D); color: #050810 !important; box-shadow: 0 4px 15px rgba(245,158,11,0.3); }
        .icon-green { color: #F59E0B; }
      `}</style>

      {/* Hero Header */}
      <div className="relative overflow-hidden" style={{
        background: 'linear-gradient(135deg, rgba(7,7,26,0.95), rgba(13,26,42,0.95))',
        borderBottom: '1px solid rgba(245,158,11,0.2)',
        boxShadow: '0 4px 20px rgba(245,158,11,0.1)'
      }}>
        <div className="absolute inset-0">
          <div 
            className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20"
            style={{ 
              background: 'radial-gradient(circle, rgba(245,158,11,0.4) 0%, transparent 70%)',
              animation: 'glow 3s ease-in-out infinite'
            }}
          />
          <div 
            className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-20"
            style={{ 
              background: 'radial-gradient(circle, rgba(20,184,166,0.4) 0%, transparent 70%)',
              animation: 'glow 3s ease-in-out infinite',
              animationDelay: '1.5s'
            }}
          />
        </div>
        
        <div className="relative max-w-2xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate(`/tournaments/${tournamentId}`)}
            className="flex items-center gap-2 text-white/70 hover:text-white mb-4 transition-colors group"
          >
            <ArrowLeftIcon className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm">Back to Tournament</span>
          </button>

          <div className="flex flex-col md:flex-row items-start md:items-start justify-between gap-4">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                <Layers className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{tournament?.name}</h1>
                <p className="text-white/60 mt-1">Tournament Draw & Brackets</p>
              </div>
            </div>

            {isOrganizer && (
              <div className="grid grid-cols-2 gap-2 w-full md:max-w-xs">
                {bracket && (
                  <>
                    {/* ── AMBER PRIMARY: Assign Players — always show when bracket exists ── */}
                    <button
                      onClick={openAssignModal}
                      title="Assign players to draw"
                      className="px-4 py-3 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 font-bold text-sm"
                      style={{ background: 'linear-gradient(135deg,#F59E0B,#FCD34D)', color: '#07071a', boxShadow: '0 4px 15px rgba(245,158,11,0.25)' }}
                    >
                      <UserPlus className="w-4 h-4" />
                      Assign Players
                    </button>

                    {/* ── AMBER PRIMARY: Edit Groups — only before any match is played ── */}
                    {(bracket?.format === 'ROUND_ROBIN' || bracket?.format === 'ROUND_ROBIN_KNOCKOUT') && !hasPlayedMatches && (
                      <button
                        onClick={() => setShowConfigModal(true)}
                        title="Edit group sizes and configuration"
                        className="px-4 py-3 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 font-bold text-sm"
                        style={{ background: 'linear-gradient(135deg,#F59E0B,#FCD34D)', color: '#07071a', boxShadow: '0 4px 15px rgba(245,158,11,0.25)' }}
                      >
                        <Layers className="w-4 h-4" />
                        Edit Groups
                      </button>
                    )}

                    {/* ── AMBER PRIMARY: Arrange KO — only after group stage fully complete ── */}
                    {bracket?.format === 'ROUND_ROBIN_KNOCKOUT' && isRoundRobinComplete() && !isCategoryCompleted && (
                      <button
                        onClick={async () => {
                          clearDrawCache(tournamentId, activeCategory?.id);
                          await fetchDrawPageFull(activeCategory?.id);
                          setShowArrangeMatchupsModal(true);
                        }}
                        title="Arrange knockout stage matchups"
                        className="px-4 py-3 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 font-bold text-sm"
                        style={{ background: 'linear-gradient(135deg,#F59E0B,#FCD34D)', color: '#07071a', boxShadow: '0 4px 15px rgba(245,158,11,0.25)' }}
                      >
                        <Settings className="w-4 h-4" />
                        Arrange KO
                      </button>
                    )}

                    {/* ── AMBER PRIMARY: End Category — hide once already completed ── */}
                    {!isCategoryCompleted && (
                      <button
                        onClick={() => setShowEndTournamentModal(true)}
                        title="Mark this category as complete"
                        className="px-4 py-3 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 font-bold text-sm"
                        style={{ background: 'linear-gradient(135deg,#F59E0B,#FCD34D)', color: '#07071a', boxShadow: '0 4px 15px rgba(245,158,11,0.25)' }}
                      >
                        <Trophy className="w-4 h-4" />
                        End Category
                      </button>
                    )}

                    {/* ── PURPLE ACCENT: Manage Umpires — always visible ── */}
                    <button
                      onClick={() => setShowManageUmpiresModal(true)}
                      title="Add or remove umpires for this tournament"
                      className="px-4 py-3 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 font-bold text-sm"
                      style={{ background: 'linear-gradient(135deg,rgba(168,85,247,0.18),rgba(139,92,246,0.12))', border: '1.5px solid rgba(168,85,247,0.35)', color: '#c084fc', boxShadow: '0 4px 12px rgba(168,85,247,0.15)' }}
                    >
                      <Users className="w-4 h-4" />
                      {tournamentUmpires.length > 0 ? `Umpires (${tournamentUmpires.length})` : 'Add Umpires'}
                    </button>

                    {/* ── PURPLE ACCENT: Umpire Queues — when umpires exist ── */}
                    {tournamentUmpires.length > 0 && (
                      <button
                        onClick={() => setShowUmpireQueueModal(true)}
                        title="Bulk assign matches to umpires in sequential order"
                        className="px-4 py-3 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 font-bold text-sm"
                        style={{ background: 'linear-gradient(135deg,rgba(168,85,247,0.18),rgba(139,92,246,0.12))', border: '1.5px solid rgba(168,85,247,0.35)', color: '#c084fc', boxShadow: '0 4px 12px rgba(168,85,247,0.15)' }}
                      >
                        <ListOrdered className="w-4 h-4" />
                        Umpire Queues
                      </button>
                    )}

                    {/* ── NEUTRAL: Restart — only when matches have been played ── */}
                    {hasPlayedMatches && (
                      <button
                        onClick={() => setShowRestartModal(true)}
                        title={
                          bracket?.format === 'ROUND_ROBIN_KNOCKOUT' && activeStage === 'knockout'
                            ? 'Restart knockout stage only (group results preserved)'
                            : bracket?.format === 'ROUND_ROBIN_KNOCKOUT' && activeStage === 'roundrobin'
                              ? 'Restart entire draw (groups + knockout)'
                              : 'Restart all matches'
                        }
                        className="px-4 py-3 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 font-bold text-sm"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)' }}
                      >
                        <Zap className="w-4 h-4" />
                        {bracket?.format === 'ROUND_ROBIN_KNOCKOUT'
                          ? activeStage === 'knockout' ? 'Restart KO' : 'Restart All'
                          : 'Restart'}
                      </button>
                    )}

                    {/* ── RED: Delete — only before any match is played ── */}
                    {!hasPlayedMatches && (
                      <button
                        onClick={() => setShowDeleteModal(true)}
                        title="Delete Draw"
                        className="px-4 py-3 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 font-bold text-sm"
                        style={{ background: 'linear-gradient(135deg,rgba(239,68,68,0.18),rgba(220,38,38,0.12))', border: '1.5px solid rgba(239,68,68,0.35)', color: '#f87171', boxShadow: '0 4px 12px rgba(239,68,68,0.12)' }}
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Draw
                      </button>
                    )}
                  </>
                )}
                {!bracket && !isCategoryCompleted && (
                  <button
                    onClick={() => setShowConfigModal(true)}
                    className="col-span-2 px-4 py-3 btn-brand rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 font-bold text-sm"
                  >
                    <Plus className="w-5 h-5" />
                    Create Draw
                  </button>
                )}
              </div>
            )}
          </div>
          
          {/* Banner: Tournament Completed — only when organizer explicitly ended tournament */}
          {tournament?.status === 'completed' && isOrganizer && (
            <div className="mt-4 px-4 py-3 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3">
              <Trophy className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-green-300 text-sm font-semibold">Tournament Completed</p>
                <p className="text-green-400/80 text-xs">Draw is now locked and cannot be modified. Points have been awarded to all players.</p>
              </div>
            </div>
          )}
          {/* Banner: Category Completed — when final match done but tournament still ongoing */}
          {isCategoryCompleted && tournament?.status !== 'completed' && isOrganizer && (
            <div className="mt-4 px-4 py-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl flex items-center gap-3">
              <Trophy className="w-5 h-5 text-cyan-400" />
              <div>
                <p className="text-cyan-300 text-sm font-semibold">Category Completed</p>
                <p className="text-cyan-400/80 text-xs">All matches in this category are done. End the tournament when all categories are finished.</p>
              </div>
            </div>
          )}
          
        </div>
      </div>

      {/* Tournament Statistics Header - ULTRA COMPACT FOR MOBILE */}
      {activeCategory && (
        <div className="backdrop-blur-sm border-b border-white/10" style={{ background: 'rgba(13,16,37,0.8)' }}>
          <div className="max-w-2xl mx-auto px-3 py-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {/* Total Players */}
              <div className="rounded-xl p-2.5 relative" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-teal-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-teal-400" />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-lg font-bold text-white leading-none">{tournamentStats.totalPlayers}</p>
                    <p className="text-teal-300 text-xs font-medium leading-tight">Players</p>
                  </div>
                  {/* View Players Button - COMPACT */}
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
                          console.error('❌ Error fetching players:', err);
                          console.error('❌ Error response:', err.response);
                          console.error('❌ Error data:', err.response?.data);
                          setRegisteredPlayers([]);
                        }
                      }
                    }}
                    className="w-6 h-6 bg-teal-500/30 hover:bg-teal-500/50 rounded-lg flex items-center justify-center transition-all hover:scale-110 group flex-shrink-0"
                    title="View all players"
                  >
                    {showPlayersModal ? (
                      <X className="w-3 h-3 text-teal-300 group-hover:text-white" />
                    ) : (
                      <svg className="w-3 h-3 text-teal-300 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Confirmed Players - COMPACT */}
              <div className="rounded-xl p-2.5" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(245,158,11,0.12)' }}>
                    <CheckCircle className="w-4 h-4 icon-green" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-bold text-white leading-none">{tournamentStats.confirmedPlayers}</p>
                    <p className="text-[#F59E0B] text-xs font-medium leading-tight">Confirmed</p>
                  </div>
                </div>
              </div>

              {/* Total Matches - COMPACT */}
              <div className="rounded-xl p-2.5" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-teal-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Gavel className="w-4 h-4 text-teal-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-bold text-white leading-none">{tournamentStats.totalMatches}</p>
                    <p className="text-teal-300 text-xs font-medium leading-tight">Matches</p>
                  </div>
                </div>
              </div>

              {/* Completed Matches - COMPACT */}
              <div className="rounded-xl p-2.5" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(245,158,11,0.12)' }}>
                    <TrophyIcon className="w-4 h-4 icon-green" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-bold text-white leading-none">{tournamentStats.completedMatches}</p>
                    <p className="text-[#F59E0B] text-xs font-medium leading-tight">Completed</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar - REMOVED as it doesn't serve actual purpose */}
            {/* Tournament completion is determined by organizer, not match count */}

            {/* Players List - Shows when Total Players card is clicked */}
            {showPlayersModal && (
              <div className="mt-6 backdrop-blur-sm rounded-2xl p-6 shadow-2xl" style={{ background: 'rgba(13,16,37,0.9)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg,#FCD34D,#a855f7)' }}>
                      <Users className="w-6 h-6" style={{ color: '#050810' }} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Registered Players</h3>
                      <p className="text-amber-300 text-sm">{activeCategory?.name} • {registeredPlayers.length} players</p>
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
                        className="bg-gradient-to-br from-slate-700/50 to-slate-600/50 border border-white/10 rounded-xl p-4 hover:border-teal-500/50 hover:shadow-lg hover:shadow-teal-500/20 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          {/* Player Number */}
                          <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-lg flex items-center justify-center font-bold text-white shadow-lg flex-shrink-0">
                            {index + 1}
                          </div>
                          
                          {/* Player Info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white truncate">
                              {(() => {
                                const name = registration.displayName || registration.user?.name || 'Unknown';
                                return name;
                              })()}
                            </p>
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
                              
                              {/* Guest Badge */}
                              {registration.isGuest && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-500/20 border border-teal-500/30 rounded-full text-xs text-teal-300">
                                  Quick Added
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
                        {/* Remove Player — admin + organiser only */}
                        {canManagePlayers && (
                          <button
                            onClick={() => setRemovePlayerConfirm(registration)}
                            className="mt-3 w-full py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                            style={{
                              background: 'rgba(239,68,68,0.12)',
                              border: '1px solid rgba(239,68,68,0.3)',
                              color: '#f87171'
                            }}
                          >
                            🗑 Remove Player
                          </button>
                        )}
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
      <div className="max-w-2xl mx-auto px-4 mt-4">
        {error && (
          <div className="mb-4 rounded-xl p-3 flex items-center gap-3" style={{ background: 'rgba(255,170,0,0.08)', border: '1px solid rgba(255,170,0,0.2)' }}>
            <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: '#ffaa00' }} />
            <span className="text-sm flex-1 min-w-0 break-words" style={{ color: '#ffcc66' }}>{error}</span>
            <button onClick={() => setError(null)} className="flex-shrink-0" style={{ color: 'rgba(255,255,255,0.35)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-xl p-3 flex items-start gap-3" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
            <CheckCircle className="w-5 h-5 icon-green flex-shrink-0 mt-0.5" />
            <span className="text-[#F59E0B] font-medium text-sm flex-1 min-w-0 break-words">{success}</span>
            <div className="flex items-center gap-2 flex-shrink-0">
              {refreshing && <Spinner size="sm" />}
              <button onClick={() => setSuccess(null)} className="icon-green hover:text-[#F59E0B]"><X className="w-5 h-5" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Category Tabs - ULTRA COMPACT FOR MOBILE */}
      {categories.length > 0 && (
        <div className="max-w-2xl mx-auto px-3 mt-2">
          <div className="backdrop-blur-sm rounded-2xl p-1.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex gap-2 overflow-x-auto">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category)}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                    activeCategory?.id === category.id
                      ? 'tab-active'
                      : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Smart Guide — Organizer only, not shown when category already completed ── */}
      {isOrganizer && activeCategory && !isCategoryCompleted && (() => {
        const fmt = bracket?.format;
        const groupMatches = matches.filter(m => m.stage === 'GROUP');
        const knockoutMatches = matches.filter(m => m.stage === 'KNOCKOUT');
        const allGroupDone = groupMatches.length > 0 && groupMatches.every(m => m.status === 'COMPLETED');
        const allMatchesDone = matches.length > 0 && matches.every(m => m.status === 'COMPLETED');
        // KO matches are created at draw time with no players — only count as "arranged" when player IDs present
        const hasKOPlayersAssigned = knockoutMatches.some(m => m.player1Id || m.player2Id);

        let steps = [];
        let currentStep = 0;
        let bannerIcon = '📋';
        let bannerText = '';
        let bannerSubtext = '';
        let bannerColor = 'amber';
        let bannerButton = null;

        if (!bracket) {
          steps = fmt === 'ROUND_ROBIN_KNOCKOUT'
            ? ['Create Draw', 'Assign Players', 'Group Stage', 'Knockout Stage', 'End Category']
            : fmt === 'ROUND_ROBIN'
              ? ['Create Draw', 'Assign Players', 'Play Matches', 'End Category']
              : ['Create Draw', 'Assign Players', 'Play Matches', 'End Category'];
          currentStep = 0;
          bannerIcon = '📋';
          bannerText = 'Create the draw to get started';
          bannerSubtext = 'Choose format, group sizes, and generate the bracket.';
          bannerColor = 'amber';
          bannerButton = { label: 'Create Draw', action: () => setShowConfigModal(true) };
        } else if (fmt === 'KNOCKOUT') {
          steps = ['Create Draw', 'Assign Players', 'Play Matches', 'End Category'];
          const playersAssigned = matches.some(m => m.player1Id || m.player2Id);
          if (!playersAssigned) {
            currentStep = 1;
            bannerIcon = '👥';
            bannerText = 'Assign players to bracket slots';
            bannerSubtext = 'Use "Assign Players" to place registered players into the draw.';
            bannerColor = 'amber';
            bannerButton = { label: 'Assign Players', action: openAssignModal };
          } else if (!hasPlayedMatches) {
            currentStep = 2;
            bannerIcon = '🎯';
            bannerText = 'Players assigned — ready to play!';
            bannerSubtext = 'Umpires can now start scoring. Share the tournament link with them.';
            bannerColor = 'blue';
          } else if (!allMatchesDone) {
            const done = matches.filter(m => m.status === 'COMPLETED').length;
            currentStep = 2;
            bannerIcon = '⚡';
            bannerText = `${done} / ${matches.length} matches completed`;
            bannerSubtext = 'Tournament in progress. Track results in Live Matches.';
            bannerColor = 'blue';
          } else {
            currentStep = 3;
            bannerIcon = '🏆';
            bannerText = 'All matches done — end the category!';
            bannerSubtext = 'Click "End Category" to finalize results and award ranking points.';
            bannerColor = 'green';
            bannerButton = { label: 'End Category', action: () => setShowEndTournamentModal(true) };
          }
        } else if (fmt === 'ROUND_ROBIN') {
          steps = ['Create Draw', 'Assign Players', 'Play Matches', 'End Category'];
          const playersAssigned = matches.some(m => m.player1Id || m.player2Id);
          if (!playersAssigned) {
            currentStep = 1;
            bannerIcon = '👥';
            bannerText = 'Assign players to group slots';
            bannerSubtext = 'Use "Assign Players" to place registered players into the groups.';
            bannerColor = 'amber';
            bannerButton = { label: 'Assign Players', action: openAssignModal };
          } else if (!hasPlayedMatches) {
            currentStep = 2;
            bannerIcon = '🎯';
            bannerText = 'Players assigned — start playing matches!';
            bannerSubtext = 'Umpires can begin scoring round robin matches.';
            bannerColor = 'blue';
          } else if (!allMatchesDone) {
            const done = matches.filter(m => m.status === 'COMPLETED').length;
            currentStep = 2;
            bannerIcon = '⚡';
            bannerText = `${done} / ${matches.length} matches completed`;
            bannerSubtext = 'Round robin in progress. Complete all matches to finish.';
            bannerColor = 'blue';
          } else {
            currentStep = 3;
            bannerIcon = '🏆';
            bannerText = 'All matches done — end the category!';
            bannerSubtext = 'Click "End Category" to finalize results and award ranking points.';
            bannerColor = 'green';
            bannerButton = { label: 'End Category', action: () => setShowEndTournamentModal(true) };
          }
        } else if (fmt === 'ROUND_ROBIN_KNOCKOUT') {
          steps = ['Create Draw', 'Assign Players', 'Group Stage', 'Knockout Stage', 'End Category'];
          const groupPlayersAssigned = groupMatches.some(m => m.player1Id || m.player2Id);
          if (!groupPlayersAssigned) {
            currentStep = 1;
            bannerIcon = '👥';
            bannerText = 'Assign players to group slots';
            bannerSubtext = 'Use "Assign Players" to place registered players into the groups.';
            bannerColor = 'amber';
            bannerButton = { label: 'Assign Players', action: openAssignModal };
          } else if (!allGroupDone) {
            const done = groupMatches.filter(m => m.status === 'COMPLETED').length;
            currentStep = 2;
            bannerIcon = done === 0 ? '🎯' : '⚡';
            bannerText = done === 0
              ? 'Players assigned — start group stage!'
              : `Group stage: ${done} / ${groupMatches.length} matches done`;
            bannerSubtext = done === 0
              ? 'Umpires can begin scoring group matches.'
              : 'Complete all group matches to advance to knockout stage.';
            bannerColor = 'blue';
          } else if (allGroupDone && !hasKOPlayersAssigned) {
            currentStep = 2;
            bannerIcon = '🔀';
            bannerText = 'Group stage done — set up knockout!';
            bannerSubtext = 'Click "Arrange KO" to seed top players into the knockout bracket.';
            bannerColor = 'amber';
            bannerButton = {
              label: 'Arrange KO',
              action: async () => {
                clearDrawCache(tournamentId, activeCategory?.id);
                await fetchDrawPageFull(activeCategory?.id);
                setShowArrangeMatchupsModal(true);
              }
            };
          } else if (hasKOPlayersAssigned && !allMatchesDone) {
            const done = knockoutMatches.filter(m => m.status === 'COMPLETED').length;
            currentStep = 3;
            bannerIcon = '⚡';
            bannerText = `Knockout: ${done} / ${knockoutMatches.length} matches done`;
            bannerSubtext = 'Finals in progress! Check Live Matches for updates.';
            bannerColor = 'blue';
          } else if (allMatchesDone) {
            currentStep = 4;
            bannerIcon = '🏆';
            bannerText = 'All matches done — end the category!';
            bannerSubtext = 'Click "End Category" to finalize results and award ranking points.';
            bannerColor = 'green';
            bannerButton = { label: 'End Category', action: () => setShowEndTournamentModal(true) };
          }
        }

        if (!steps.length) return null;

        const colorMap = {
          amber: {
            bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.28)',
            text: '#F59E0B', subtext: 'rgba(245,158,11,0.65)',
            btn: 'linear-gradient(135deg,#F59E0B,#FCD34D)', btnTxt: '#07071a',
          },
          green: {
            bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.3)',
            text: '#4ade80', subtext: 'rgba(134,239,172,0.65)',
            btn: 'linear-gradient(135deg,#22c55e,#16a34a)', btnTxt: '#fff',
          },
          blue: {
            bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.25)',
            text: '#60a5fa', subtext: 'rgba(147,197,253,0.65)',
            btn: 'linear-gradient(135deg,#3b82f6,#2563eb)', btnTxt: '#fff',
          },
        };
        const c = colorMap[bannerColor] || colorMap.amber;

        return (
          <div className="max-w-2xl mx-auto px-3 mt-3">
            {/* Progress Stepper */}
            <div className="flex items-start mb-3 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
              {steps.map((step, i) => (
                <React.Fragment key={i}>
                  <div className="flex flex-col items-center gap-1 flex-shrink-0" style={{ minWidth: 56 }}>
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center font-black transition-all"
                      style={{
                        fontSize: 10,
                        background: i < currentStep
                          ? '#22c55e'
                          : i === currentStep
                            ? c.btn
                            : 'rgba(255,255,255,0.07)',
                        color: i < currentStep ? '#fff' : i === currentStep ? c.btnTxt : 'rgba(255,255,255,0.3)',
                        border: i === currentStep ? `2px solid ${c.text}` : '2px solid transparent',
                        boxShadow: i === currentStep ? `0 0 8px ${c.text}66` : 'none',
                      }}
                    >
                      {i < currentStep ? '✓' : i + 1}
                    </div>
                    <span
                      className="text-center leading-tight"
                      style={{
                        fontSize: 9,
                        maxWidth: 52,
                        fontWeight: i === currentStep ? 700 : 400,
                        color: i === currentStep ? c.text : i < currentStep ? '#4ade80' : 'rgba(255,255,255,0.28)',
                      }}
                    >
                      {step}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      className="flex-1 h-px mx-1 mt-3 flex-shrink-0"
                      style={{
                        background: i < currentStep ? '#22c55e' : 'rgba(255,255,255,0.1)',
                        minWidth: 12,
                      }}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* What to do next — banner */}
            {bannerText && (
              <div
                className="rounded-xl p-3 flex items-center gap-3"
                style={{ background: c.bg, border: `1px solid ${c.border}` }}
              >
                <span className="text-lg flex-shrink-0">{bannerIcon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black leading-tight" style={{ color: c.text }}>{bannerText}</p>
                  {bannerSubtext && (
                    <p className="text-xs mt-0.5 leading-tight" style={{ color: c.subtext }}>{bannerSubtext}</p>
                  )}
                </div>
                {bannerButton && (
                  <button
                    onClick={bannerButton.action}
                    className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-black transition-all active:scale-95"
                    style={{ background: c.btn, color: c.btnTxt, boxShadow: `0 4px 12px ${c.text}44`, whiteSpace: 'nowrap' }}
                  >
                    {bannerButton.label}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* Content */}
      <div className="max-w-2xl mx-auto px-3 py-4">
        {bracketLoading ? (
          <div className="rounded-2xl p-16 text-center border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
            <Spinner size="lg" className="mx-auto" />
            <p className="mt-4 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>Loading bracket...</p>
          </div>
        ) : drawNotGenerated ? (
          <div className="backdrop-blur-sm rounded-2xl p-16 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
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
                className="inline-flex items-center gap-2 px-6 py-3 btn-brand rounded-xl font-semibold transition-all"
              >
                <Plus className="w-5 h-5" />
                Create Draw Now
              </button>
            )}
          </div>
        ) : !bracket ? (
          <div className="backdrop-blur-sm rounded-2xl p-16 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <TrophyIcon className="w-12 h-12 text-gray-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No bracket data available</h3>
            <p className="text-gray-400">Please try again later</p>
          </div>
        ) : (
          <div className="backdrop-blur-sm rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
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

      {/* Remove Player Confirmation Modal */}
      {removePlayerConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ background: '#0f1729', border: '1.5px solid rgba(239,68,68,0.4)' }}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  🗑
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Remove Player</h3>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>This cannot be undone</p>
                </div>
              </div>
              <div className="rounded-xl p-4 mb-5" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <p className="text-sm text-white font-bold">
                  {removePlayerConfirm.displayName || removePlayerConfirm.user?.name || removePlayerConfirm.guestName || 'Unknown'}
                </p>
                {removePlayerConfirm.amountTotal > 0 && (
                  <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    ₹{removePlayerConfirm.amountTotal} entry fee will be deducted from revenue
                  </p>
                )}
                <p className="text-xs mt-2" style={{ color: '#f87171' }}>
                  Player will be removed from the tournament and all match slots cleared.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setRemovePlayerConfirm(null)}
                  disabled={removingPlayer}
                  className="flex-1 py-3 rounded-xl font-bold text-sm"
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRemovePlayer}
                  disabled={removingPlayer}
                  className="flex-1 py-3 rounded-xl font-black text-sm"
                  style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', boxShadow: '0 4px 15px rgba(239,68,68,0.4)', opacity: removingPlayer ? 0.7 : 1 }}
                >
                  {removingPlayer ? 'Removing...' : 'Yes, Remove'}
                </button>
              </div>
            </div>
          </div>
        </div>
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
          <div className="rounded-2xl max-w-md w-full shadow-2xl" style={{ background: '#0d1025', border: '2px solid rgba(245,158,11,0.25)' }}>
            {/* Header */}
            <div className="p-6 border-b border-white/10" style={{ background: 'rgba(245,158,11,0.06)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg,#F59E0B,#FCD34D)' }}>
                    <Play className="w-6 h-6" style={{ color: '#050810' }} />
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
                className="px-6 py-3 rounded-xl transition-all font-semibold disabled:opacity-50" style={{ background: 'rgba(255,255,255,0.06)', color: 'white' }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!activeCategory) return;
                  
                  setAssigning(true);
                  try {
                    const response = await api.post(`/tournaments/${tournamentId}/categories/${activeCategory.id}/draw/continue-to-knockout`);

                    await fetchDrawPageFull(activeCategory.id);
                    
                    setSuccess(response.data.message || 'Knockout stage started successfully!');
                    setShowContinueKnockoutModal(false);
                    setTimeout(() => setSuccess(null), 5000);
                  } catch (err) {
                    console.error('Error continuing to knockout:', err);
                    setError(getErrorMessage(err, 'Failed to continue to knockout stage'));
                  } finally {
                    setAssigning(false);
                  }
                }}
                disabled={assigning}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl shadow-lg shadow-green-500/30 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {assigning ? (
                  <>
                    <Spinner size="md" />
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
          <div className="rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl" style={{ background: '#0d1025', border: '2px solid rgba(245,158,11,0.25)' }}>
            {/* Header */}
            <div className="p-6 border-b border-white/10" style={{ background: 'rgba(245,158,11,0.06)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg,#F59E0B,#FCD34D)' }}>
                    <Users className="w-6 h-6" style={{ color: '#050810' }} />
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
                  className="w-full px-4 py-4 rounded-xl text-white text-2xl font-bold focus:outline-none transition-all" style={{ background: 'rgba(255,255,255,0.06)', border: '2px solid rgba(245,158,11,0.25)' }}
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
                className="px-6 py-3 rounded-xl transition-all font-semibold" style={{ background: 'rgba(255,255,255,0.06)', color: 'white' }}
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
                    
                    await fetchDrawPageFull(activeCategory.id);

                    setSuccess('Knockout stage created! Players have been assigned.');
                    setShowSelectPlayersModal(false);

                    // Auto-switch to Knockout tab
                    setActiveStage('knockout');
                    
                    setTimeout(() => setSuccess(null), 5000);
                  } catch (err) {
                    console.error('Error creating knockout:', err);
                    setError(getErrorMessage(err, 'Failed to create knockout stage'));
                  } finally {
                    setAssigning(false);
                  }
                }}
                disabled={assigning || selectedPlayersForKnockout.length !== knockoutDrawSize}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl shadow-lg shadow-green-500/30 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {assigning ? (
                  <>
                    <Spinner size="md" />
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

      {/* Umpire Queue Modal — bulk assign matches to umpires in sequential order */}
      {showUmpireQueueModal && (
        <UmpireQueueModal
          tournamentId={tournamentId}
          umpires={tournamentUmpires}
          onClose={() => setShowUmpireQueueModal(false)}
        />
      )}

      {/* Assign Umpire Modal */}
      {showUmpireModal && selectedMatchForUmpire && (
        <AssignUmpireModal
          match={selectedMatchForUmpire}
          umpires={tournamentUmpires}
          loadingUmpires={loadingUmpires}
          umpiresError={umpiresError}
          onRetryUmpires={loadUmpires}
          tournamentId={tournamentId}
          onUmpireAdded={(newUmpire) => setTournamentUmpires(prev => [...prev, newUmpire])}
          onClose={() => {
            setShowUmpireModal(false);
            setSelectedMatchForUmpire(null);
          }}
          onAssign={assignUmpireToMatch}
        />
      )}

      {/* Manage Umpires Modal */}
      {showManageUmpiresModal && (
        <ManageUmpiresModal
          tournamentId={tournamentId}
          umpires={tournamentUmpires}
          onUmpiresChange={(updated) => setTournamentUmpires(updated)}
          onClose={() => setShowManageUmpiresModal(false)}
        />
      )}

      {/* Change Match Result Modal */}
      {showChangeResultModal && selectedMatchForChange && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-3xl p-8 max-w-md w-full shadow-2xl" style={{ background: '#0d1025', border: '2px solid rgba(251,191,36,0.4)' }}>
            {/* Icon */}
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg" style={{ background: 'linear-gradient(135deg,#fbbf24,#f59e0b)' }}>
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
            <div className="rounded-xl p-4 mb-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-gray-400 text-xs mb-2">Current Winner</p>
              <p className="text-white font-semibold">
                {selectedMatchForChange.winnerId === selectedMatchForChange.bracketMatch.player1?.id 
                  ? getPlayerDisplay(selectedMatchForChange.bracketMatch.player1)
                  : getPlayerDisplay(selectedMatchForChange.bracketMatch.player2)}
              </p>
            </div>

            {/* Player Selection */}
            <div className="space-y-3 mb-6">
              <button
                onClick={() => changeMatchResult(selectedMatchForChange.bracketMatch.player1?.id)}
                disabled={changingResult}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                  selectedMatchForChange.winnerId === selectedMatchForChange.bracketMatch.player1?.id
                    ? 'border-[rgba(245,158,11,0.5)] bg-[rgba(245,158,11,0.08)]'
                    : 'border-white/10 bg-white/[0.03] hover:border-[rgba(251,191,36,0.4)] hover:bg-[rgba(251,191,36,0.06)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white font-semibold">{getPlayerDisplay(selectedMatchForChange.bracketMatch.player1)}</span>
                  {selectedMatchForChange.winnerId === selectedMatchForChange.bracketMatch.player1?.id && (
                    <span className="text-sm icon-green">✓ Current</span>
                  )}
                </div>
              </button>

              <button
                onClick={() => changeMatchResult(selectedMatchForChange.bracketMatch.player2?.id)}
                disabled={changingResult}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                  selectedMatchForChange.winnerId === selectedMatchForChange.bracketMatch.player2?.id
                    ? 'border-[rgba(245,158,11,0.5)] bg-[rgba(245,158,11,0.08)]'
                    : 'border-white/10 bg-white/[0.03] hover:border-[rgba(251,191,36,0.4)] hover:bg-[rgba(251,191,36,0.06)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white font-semibold">{getPlayerDisplay(selectedMatchForChange.bracketMatch.player2)}</span>
                  {selectedMatchForChange.winnerId === selectedMatchForChange.bracketMatch.player2?.id && (
                    <span className="text-sm icon-green">✓ Current</span>
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
                className="flex-1 py-3 rounded-xl font-semibold transition-all" style={{ background: 'rgba(255,255,255,0.06)', color: 'white' }}
              >
                Cancel
              </button>
            </div>

            {changingResult && (
              <div className="mt-4 flex items-center justify-center gap-2 text-amber-400">
                <Spinner size="md" />
                <span className="text-sm">Updating result...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Match Details Modal */}
      {showMatchDetailsModal && selectedMatchDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3">
          <div className="rounded-2xl p-4 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto" style={{ background: '#0d1025', border: '2px solid rgba(245,158,11,0.35)' }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}>
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
            <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(245,158,11,0.06)', border: '2px solid rgba(245,158,11,0.2)' }}>
              {/* Final Score Header */}
              <div className="text-center mb-4">
                <p className="text-xs uppercase tracking-widest mb-2 font-semibold" style={{ color: '#FCD34D' }}>Final Score</p>
                <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl" style={{ background: 'rgba(7,7,26,0.7)', border: '1px solid rgba(245,158,11,0.15)' }}>
                  <span className="text-5xl font-black text-white tracking-tight">
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
                <p className="text-gray-400 text-xs uppercase tracking-wider mt-2">Sets Won</p>
              </div>

              {/* Set-by-Set Breakdown */}
              <div className="text-center mb-4">
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Set Breakdown</p>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {selectedMatchDetails.score && (() => {
                    const scoreData = typeof selectedMatchDetails.score === 'string'
                      ? JSON.parse(selectedMatchDetails.score)
                      : selectedMatchDetails.score;
                    return scoreData?.sets?.map((set, idx) => {
                      const p1Score = set.player1Score !== undefined ? set.player1Score : set.player1;
                      const p2Score = set.player2Score !== undefined ? set.player2Score : set.player2;
                      const isP1Winner = set.winner === 1;
                      return (
                        <div key={idx} className="px-3 py-1.5 rounded-lg" style={{
                          border: isP1Winner ? '2px solid rgba(245,158,11,0.4)' : '2px solid rgba(245,158,11,0.4)',
                          background: isP1Winner ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.08)',
                        }}>
                          <span className="text-white font-bold text-sm">{p1Score}-{p2Score}</span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Players — stacked vertically for clean mobile layout */}
              <div className="space-y-3">
                {/* Player 1 */}
                {(() => {
                  const isWinner = selectedMatchDetails.winnerId === selectedMatchDetails.bracketMatch.player1?.id;
                  const setScores = selectedMatchDetails.score ? getDetailedSetScores(selectedMatchDetails.score, 1) : '';
                  return (
                    <div className="rounded-xl p-3 border-2 transition-all"
                      style={isWinner
                        ? { borderColor: 'rgba(245,158,11,0.4)', background: 'rgba(245,158,11,0.07)' }
                        : { borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {isWinner && <span className="text-base flex-shrink-0">👑</span>}
                          <p className="font-bold text-sm leading-snug min-w-0"
                            style={{ color: isWinner ? '#F59E0B' : '#fff', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                            {getPlayerDisplay(selectedMatchDetails.bracketMatch.player1)}
                          </p>
                        </div>
                        {isWinner && (
                          <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)' }}>
                            Winner
                          </span>
                        )}
                      </div>
                      {setScores && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {setScores.split(', ').map((score, idx) => {
                            const [p1, p2] = score.split('-').map(Number);
                            const won = p1 > p2;
                            return (
                              <span key={idx} className="px-2 py-0.5 rounded text-xs font-semibold"
                                style={won
                                  ? { background: 'rgba(245,158,11,0.12)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.25)' }
                                  : { background: 'rgba(255,255,255,0.06)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.1)' }}>
                                {score}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* VS divider */}
                <div className="text-center">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">vs</span>
                </div>

                {/* Player 2 */}
                {(() => {
                  const isWinner = selectedMatchDetails.winnerId === selectedMatchDetails.bracketMatch.player2?.id;
                  const setScores = selectedMatchDetails.score ? getDetailedSetScores(selectedMatchDetails.score, 2) : '';
                  return (
                    <div className="rounded-xl p-3 border-2 transition-all"
                      style={isWinner
                        ? { borderColor: 'rgba(245,158,11,0.4)', background: 'rgba(245,158,11,0.07)' }
                        : { borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {isWinner && <span className="text-base flex-shrink-0">👑</span>}
                          <p className="font-bold text-sm leading-snug min-w-0"
                            style={{ color: isWinner ? '#F59E0B' : '#fff', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                            {getPlayerDisplay(selectedMatchDetails.bracketMatch.player2)}
                          </p>
                        </div>
                        {isWinner && (
                          <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)' }}>
                            Winner
                          </span>
                        )}
                      </div>
                      {setScores && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {setScores.split(', ').map((score, idx) => {
                            const [p2, p1] = score.split('-').map(Number);
                            const won = p2 > p1;
                            return (
                              <span key={idx} className="px-2 py-0.5 rounded text-xs font-semibold"
                                style={won
                                  ? { background: 'rgba(245,158,11,0.12)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.25)' }
                                  : { background: 'rgba(255,255,255,0.06)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.1)' }}>
                                {score}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Match Information Grid */}
            <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <span>ℹ️</span>
                Match Information
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-gray-400 text-xs uppercase tracking-wider">Status</p>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                    <p className="text-white font-semibold text-sm">Completed</p>
                  </div>
                </div>
                {selectedMatchDetails.courtNumber && (
                  <div className="space-y-1">
                    <p className="text-gray-400 text-xs uppercase tracking-wider">Court</p>
                    <p className="text-white font-semibold text-sm">Court {selectedMatchDetails.courtNumber}</p>
                  </div>
                )}
                {/* Started At - check both startTime and startedAt */}
                {(() => {
                  const raw = selectedMatchDetails.startTime || selectedMatchDetails.startedAt;
                  if (!raw) return null;
                  const d = new Date(raw);
                  if (isNaN(d.getTime())) return null;
                  return (
                    <div className="space-y-1">
                      <p className="text-gray-400 text-xs uppercase tracking-wider">Started At</p>
                      <p className="text-white font-semibold text-xs">
                        {d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  );
                })()}
                {/* Ended At - check both endTime and completedAt */}
                {(() => {
                  const raw = selectedMatchDetails.endTime || selectedMatchDetails.completedAt;
                  if (!raw) return null;
                  const d = new Date(raw);
                  if (isNaN(d.getTime())) return null;
                  return (
                    <div className="space-y-1">
                      <p className="text-gray-400 text-xs uppercase tracking-wider">Ended At</p>
                      <p className="text-white font-semibold text-xs">
                        {d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  );
                })()}
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
                      const s = new Date(startTime), e = new Date(endTime);
                      if (!isNaN(s.getTime()) && !isNaN(e.getTime()) && e > s) {
                        durationSeconds = Math.floor((e - s) / 1000);
                      }
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
                      <div className="space-y-1">
                        <p className="text-gray-400 text-xs uppercase tracking-wider">Duration</p>
                        <p className="text-white font-semibold text-xs">
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
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all"
              style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#FCD34D' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Match Complete Success Modal */}
      {showSuccessModal && matchCompleteData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-3xl p-8 max-w-md w-full shadow-2xl animate-scale-in" style={{ background: '#0d1025', border: '2px solid rgba(251,191,36,0.5)', boxShadow: '0 0 40px rgba(251,191,36,0.15)' }}>
            {/* Trophy Icon */}
            <div className="w-24 h-24 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/50">
              <Trophy className="w-12 h-12 text-white" />
            </div>

            {/* Title */}
            <h2 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              Match Complete!
            </h2>

            {/* Winner Info */}
            <div className="rounded-xl p-6 mb-6" style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)' }}>
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
            <div className="rounded-xl p-4 mb-6" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
              <p className="text-center text-sm" style={{ color: '#F59E0B' }}>
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
      {showRestartModal && (() => {
        const isHybrid = bracket?.format === 'ROUND_ROBIN_KNOCKOUT';
        // koOnly = hybrid AND currently on knockout tab → restart KO only
        // rrFull = hybrid AND currently on roundrobin tab → restart everything
        const koOnly = isHybrid && activeStage === 'knockout';
        const rrFull = isHybrid && activeStage === 'roundrobin';
        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
            <div
              className="rounded-2xl sm:rounded-3xl p-5 sm:p-7 max-w-lg w-full shadow-2xl overflow-y-auto"
              style={{
                background: '#0d1025',
                border: koOnly
                  ? '2px solid rgba(168,85,247,0.5)'
                  : rrFull
                    ? '2px solid rgba(249,115,22,0.6)'
                    : '2px solid rgba(249,115,22,0.4)',
                maxHeight: '92vh'
              }}
            >
              {/* Icon */}
              <div
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
                style={{
                  background: koOnly
                    ? 'linear-gradient(135deg,#a855f7,#7c3aed)'
                    : 'linear-gradient(135deg,#f97316,#d97706)',
                  boxShadow: koOnly
                    ? '0 0 24px rgba(168,85,247,0.4)'
                    : '0 0 24px rgba(249,115,22,0.4)'
                }}
              >
                <Zap className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>

              {/* Title */}
              <h2 className="text-xl sm:text-2xl font-bold text-center mb-1.5 text-white">
                {koOnly
                  ? 'Restart Knockout Stage?'
                  : rrFull
                    ? 'Restart Entire Draw?'
                    : 'Restart All Matches?'}
              </h2>
              <p className="text-center text-xs sm:text-sm mb-4" style={{ color: koOnly ? '#c084fc' : '#fb923c' }}>
                {koOnly
                  ? 'Group stage results will NOT be affected'
                  : rrFull
                    ? 'Both group stage and knockout will be reset'
                    : activeCategory?.name}
              </p>

              {/* What resets */}
              <div
                className="rounded-xl p-3 sm:p-4 mb-3"
                style={{
                  background: koOnly ? 'rgba(168,85,247,0.08)' : 'rgba(249,115,22,0.08)',
                  border: koOnly ? '1px solid rgba(168,85,247,0.3)' : '1px solid rgba(249,115,22,0.3)'
                }}
              >
                <div className="flex gap-3">
                  <AlertTriangle
                    className="w-5 h-5 flex-shrink-0 mt-0.5"
                    style={{ color: koOnly ? '#c084fc' : '#fb923c' }}
                  />
                  <div className="text-xs sm:text-sm" style={{ color: koOnly ? '#e9d5ff' : '#fed7aa' }}>
                    <p className="font-bold mb-1.5">
                      {koOnly
                        ? 'Knockout stage will be reset:'
                        : rrFull
                          ? 'Everything will be reset:'
                          : 'All matches will be reset:'}
                    </p>
                    <ul className="list-disc list-inside space-y-0.5 ml-1">
                      {koOnly ? (
                        <>
                          <li>All knockout match scores cleared</li>
                          <li>All knockout statuses reset to Pending</li>
                          <li>Winners removed from Semi-Final / Final slots</li>
                          <li>Umpire and court assignments cleared</li>
                        </>
                      ) : rrFull ? (
                        <>
                          <li>All group match scores cleared</li>
                          <li>All group standings and points reset to zero</li>
                          <li>All knockout match scores cleared</li>
                          <li>Winners removed from all knockout slots</li>
                          <li>Umpire and court assignments cleared</li>
                        </>
                      ) : (
                        <>
                          <li>All match scores cleared</li>
                          <li>All match statuses reset to Pending</li>
                          <li>Winners removed from advanced rounds</li>
                          <li>Umpire and court assignments cleared</li>
                          <li>Match times and durations removed</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              {/* What is preserved */}
              <div
                className="rounded-xl p-3 sm:p-4 mb-3"
                style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.25)' }}
              >
                <div className="flex gap-3">
                  <div className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#F59E0B] font-black text-base leading-none">✓</div>
                  <div className="text-xs sm:text-sm text-[#86efac]">
                    <p className="font-bold mb-1">Will be kept:</p>
                    {koOnly ? (
                      <>
                        <p>• All group stage matches and scores</p>
                        <p>• Group standings and points</p>
                        <p>• Player assignments in the first knockout round</p>
                        <p>• Draw structure</p>
                      </>
                    ) : (
                      <>
                        <p>• Player assignments in the first round</p>
                        <p>• Draw structure and bracket format</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Category label */}
              <div className="rounded-xl px-3 py-2.5 mb-4" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <p className="text-gray-400 text-xs mb-0.5">Category</p>
                <p className="text-white font-semibold text-sm">{activeCategory?.name}</p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRestartModal(false)}
                  disabled={restarting}
                  className="flex-1 py-3 rounded-xl font-semibold transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'white' }}
                >
                  Cancel
                </button>
                <button
                  onClick={restartDraws}
                  disabled={restarting}
                  className="flex-1 py-3 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                  style={{
                    background: koOnly
                      ? 'linear-gradient(135deg,#a855f7,#7c3aed)'
                      : 'linear-gradient(135deg,#f97316,#d97706)',
                    boxShadow: restarting ? 'none' : koOnly
                      ? '0 4px 20px rgba(168,85,247,0.3)'
                      : '0 4px 20px rgba(249,115,22,0.3)'
                  }}
                >
                  {restarting ? (
                    <>
                      <Spinner size="md" />
                      Restarting...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      {koOnly
                        ? 'Restart Knockout Stage'
                        : rrFull
                          ? 'Restart Entire Draw'
                          : 'Restart All Matches'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* End Category Confirmation Modal */}
      {showEndTournamentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-3xl p-8 max-w-lg w-full shadow-2xl" style={{ background: '#0d1025', border: '2px solid rgba(245,158,11,0.3)' }}>
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg" style={{ background: 'linear-gradient(135deg,#F59E0B,#FCD34D)' }}>
              <Trophy className="w-10 h-10" style={{ color: '#050810' }} />
            </div>
            <h2 className="text-2xl font-bold text-center mb-2 text-white">End Category?</h2>
            <p className="text-center font-semibold mb-4" style={{ color: '#FCD34D' }}>{activeCategory?.name}</p>
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
              <button onClick={() => setShowEndTournamentModal(false)} disabled={endingTournament} className="flex-1 py-3 rounded-xl font-semibold transition-all">Cancel</button>
              <button onClick={handleEndCategory} disabled={endingTournament} className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-green-500/30 transition-all flex items-center justify-center gap-2">
                {endingTournament ? <><Spinner size="md" />Ending...</> : <>End Category</>}
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
      categoryFormat={activeCategory?.format}
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
    categoryFormat={activeCategory?.format}
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

// ── ZoomableBracket ─────────────────────────────────────────────────────────
// Wraps the full bracket. On mount, scales it down so all rounds fit on screen.
// User pinches to zoom in, single-finger drags to pan when zoomed in.
// All click handlers on buttons inside work correctly at any zoom level.
const ZoomableBracket = ({ children, bracketWidth, bracketHeight }) => {
  const outerRef = React.useRef(null);
  const innerRef = React.useRef(null);
  const [outerHeight, setOuterHeight] = React.useState(300);

  // All gesture state in a ref — no re-renders during pan/zoom for 60fps performance
  const g = React.useRef({
    scale: 1, tx: 0, ty: 0, minScale: 1,
    lastDist: 0, lastMx: 0, lastMy: 0,
    lastPx: 0, lastPy: 0,
    isPinch: false, isPan: false,
  });

  const apply = React.useCallback(() => {
    if (!innerRef.current) return;
    const { scale, tx, ty } = g.current;
    innerRef.current.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  }, []);

  const clampTranslate = React.useCallback((newScale) => {
    const outer = outerRef.current;
    if (!outer) return;
    const cw = outer.offsetWidth;
    const ch = outer.offsetHeight;
    const minTx = Math.min(0, cw - bracketWidth * newScale);
    const minTy = Math.min(0, ch - bracketHeight * newScale);
    g.current.tx = Math.max(minTx, Math.min(0, g.current.tx));
    g.current.ty = Math.max(minTy, Math.min(0, g.current.ty));
  }, [bracketWidth, bracketHeight]);

  React.useEffect(() => {
    const outer = outerRef.current;
    if (!outer || !bracketWidth || !bracketHeight) return;

    const cw = outer.offsetWidth;
    const minScale = Math.min(cw / bracketWidth, 1);
    g.current.scale = minScale;
    g.current.minScale = minScale;
    g.current.tx = 0;
    g.current.ty = 0;
    setOuterHeight(Math.ceil(bracketHeight * minScale));
    apply();

    const getTouchDist = (t1, t2) =>
      Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

    const onTouchStart = (e) => {
      if (e.touches.length === 2) {
        g.current.isPinch = true;
        g.current.isPan = false;
        g.current.lastDist = getTouchDist(e.touches[0], e.touches[1]);
        g.current.lastMx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        g.current.lastMy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      } else if (e.touches.length === 1) {
        g.current.isPan = true;
        g.current.lastPx = e.touches[0].clientX;
        g.current.lastPy = e.touches[0].clientY;
      }
    };

    const onTouchMove = (e) => {
      if (g.current.isPinch && e.touches.length === 2) {
        e.preventDefault();
        const d = getTouchDist(e.touches[0], e.touches[1]);
        const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const my = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        const rect = outer.getBoundingClientRect();
        const ratio = d / g.current.lastDist;
        const newScale = Math.max(g.current.minScale, Math.min(2.5, g.current.scale * ratio));
        const sc = newScale / g.current.scale;
        const ox = mx - rect.left;
        const oy = my - rect.top;
        // Zoom toward pinch midpoint + simultaneous pan
        g.current.tx = ox - sc * (ox - g.current.tx) + (mx - g.current.lastMx);
        g.current.ty = oy - sc * (oy - g.current.ty) + (my - g.current.lastMy);
        g.current.scale = newScale;
        g.current.lastDist = d;
        g.current.lastMx = mx;
        g.current.lastMy = my;
        clampTranslate(newScale);
        apply();
      } else if (g.current.isPan && e.touches.length === 1 && g.current.scale > g.current.minScale + 0.01) {
        e.preventDefault();
        const dx = e.touches[0].clientX - g.current.lastPx;
        const dy = e.touches[0].clientY - g.current.lastPy;
        g.current.tx += dx;
        g.current.ty += dy;
        g.current.lastPx = e.touches[0].clientX;
        g.current.lastPy = e.touches[0].clientY;
        clampTranslate(g.current.scale);
        apply();
      }
    };

    const onTouchEnd = (e) => {
      if (e.touches.length < 2) g.current.isPinch = false;
      if (e.touches.length === 0) g.current.isPan = false;
    };

    outer.addEventListener('touchstart', onTouchStart, { passive: true });
    outer.addEventListener('touchmove', onTouchMove, { passive: false });
    outer.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      outer.removeEventListener('touchstart', onTouchStart);
      outer.removeEventListener('touchmove', onTouchMove);
      outer.removeEventListener('touchend', onTouchEnd);
    };
  }, [bracketWidth, bracketHeight, apply, clampTranslate]);

  const handleReset = () => {
    g.current.scale = g.current.minScale;
    g.current.tx = 0;
    g.current.ty = 0;
    apply();
  };

  return (
    <div>
      {/* Clipping viewport — height = bracket height at fit-to-screen scale */}
      <div
        ref={outerRef}
        style={{
          width: '100%',
          height: outerHeight,
          overflow: 'hidden',
          position: 'relative',
          touchAction: 'none',  // hand all touch to JS; handles pinch + pan
        }}
      >
        {/* Bracket content — transform-origin top-left for correct pinch math */}
        <div
          ref={innerRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            transformOrigin: '0 0',
            willChange: 'transform',
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
        >
          {children}
        </div>
      </div>

      {/* Hint strip below bracket */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 14px 10px',
      }}>
        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.22)', fontWeight: 500 }}>
          Pinch to zoom · drag to pan
        </span>
        <button
          onClick={handleReset}
          style={{
            padding: '3px 12px', borderRadius: '8px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.38)', fontSize: '10px', fontWeight: 600,
            cursor: 'pointer', letterSpacing: '0.04em',
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
};

// Knockout Display - CONTAINED HORIZONTAL PYRAMID
// All rounds fit on screen at once; user pinches to zoom into any match.
const KnockoutDisplay = ({ data, matches, user, isOrganizer, onAssignUmpire, onViewMatchDetails, onChangeResult, categoryFormat }) => {
  const navigate = useNavigate(); // Fix: each top-level component needs its own hook

  if (!data?.rounds) return <p className="text-gray-400 text-center p-8">No bracket data</p>;

  const totalRounds = data.rounds.length;

  const getRoundName = (idx, total) => {
    const r = total - idx;
    if (r === 1) return 'Final';
    if (r === 2) return 'Semi Finals';
    if (r === 3) return 'Quarter Finals';
    return `Round ${idx + 1}`;
  };

  // Find match record by round and position within that round
  // Handles both staged (stage='KNOCKOUT') and legacy (stage=null) matches
  const findMatch = (displayIdx, matchIdx) => {
    if (!matches || !Array.isArray(matches)) return null;
    const dbRound = totalRounds - displayIdx;
    const roundMatches = matches
      .filter(m => m.round === dbRound && (m.stage === 'KNOCKOUT' || m.stage == null))
      .sort((a, b) => a.matchNumber - b.matchNumber);
    return roundMatches[matchIdx];
  };

  // Navigate to conduct page for BYE matches (no umpire needed)
  const handleGiveByeForMatch = (matchId) => {
    navigate(`/match/${matchId}/conduct`);
  };

  // ── Bracket layout constants ────────────────────────────────────────────
  // CARD_W : match card column width
  // CONN_W : connector column width (L-shaped bracket lines)
  // SLOT_H : base slot height round 0 — doubles each round.
  //          Must be ≥ max card height (~225px). 260 gives 17.5px cushion each side.
  // Math:  topCenter = mi×slotH + slotH/2
  //        midY      = (topCenter + botCenter)/2  ← exact parent card center ✓
  const CARD_W = 305;
  const CONN_W = 44;
  // SLOT_H = 240: card display-only ≈ 123px → 58.5px cushion each side.
  //   Action buttons are absolutely positioned below the card (don't affect slot height).
  //   Connector lines always hit slot center = card center regardless of organizer/player view.
  const SLOT_H = 240;

  // Total pixel dimensions of the bracket content (before any zoom scaling).
  // 24px = 12px left + 12px right padding. 74px = top-padding(12) + labels(30) + gap(12) + bottom-pad(20).
  const totalBracketWidth  = 24 + data.rounds.length * CARD_W + (data.rounds.length - 1) * CONN_W;
  const totalBracketHeight = 74 + (data.rounds[0]?.matches?.length || 1) * SLOT_H;
  const LINE   = 'rgba(245,158,11,0.5)';  // gold at 50% — on-brand, visible

  return (
    <div style={{ padding: '10px' }}>
      {/* Outer bracket card */}
      <div style={{ background: '#0d1625', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg,#FCD34D,#D97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#050810" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                <path d="M4 22h16" />
                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', lineHeight: 1.2 }}>Knockout Bracket</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                {totalRounds} {totalRounds === 1 ? 'Round' : 'Rounds'}
              </div>
            </div>
          </div>
          {totalRounds > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'rgba(255,255,255,0.25)', fontSize: '11px', fontWeight: 500 }}>
              <span>scroll</span>
              <span>→</span>
            </div>
          )}
        </div>

        {/* ── ZoomableBracket: all rounds visible at fit-to-screen scale ────────
            CARD_W=305 + CONN_W=44 = 349px per unit.
            totalBracketWidth ≥ 1027px (3 rounds) — scales to fit the phone.
            SLOT_H doubles each round — cards always vertically centered in slot.
            Connector midY == parent card center (mathematically proven).
        ──────────────────────────────────────────────────────────────────── */}
        <ZoomableBracket bracketWidth={totalBracketWidth} bracketHeight={totalBracketHeight}>
          <div style={{ padding: '12px 12px 20px' }}>

            {/* ── Row 1: Round labels ────────────────────────────────────── */}
            <div style={{ display: 'flex', marginBottom: '12px' }}>
              {data.rounds.map((round, ri) => (
                <React.Fragment key={ri}>
                  <div style={{ width: CARD_W, flexShrink: 0 }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      padding: '7px 12px', borderRadius: '10px',
                      background: ri === data.rounds.length - 1 ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.05)',
                      border: ri === data.rounds.length - 1 ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(255,255,255,0.09)',
                    }}>
                      {ri === data.rounds.length - 1 && (
                        <Trophy className="w-3 h-3 flex-shrink-0" style={{ color: '#FCD34D' }} />
                      )}
                      <span style={{
                        fontSize: '11px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
                        color: ri === data.rounds.length - 1 ? '#FCD34D' : 'rgba(255,255,255,0.5)',
                      }}>
                        {getRoundName(ri, data.rounds.length)}
                      </span>
                    </div>
                  </div>
                  {ri < data.rounds.length - 1 && <div style={{ width: CONN_W, flexShrink: 0 }} />}
                </React.Fragment>
              ))}
            </div>

            {/* ── Row 2: Match slots + connector columns ──────────────────── */}
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              {data.rounds.map((round, ri) => {
                const slotH = SLOT_H * Math.pow(2, ri);

                return (
                  <React.Fragment key={ri}>

                    {/* Round column — one fixed-height slot per match, card centered */}
                    <div style={{ width: CARD_W, flexShrink: 0 }}>
                      {round.matches.map((match, mi) => {
                        const dbMatch = findMatch(ri, mi);

                        const player1 = dbMatch?.player1 || match.player1 || { name: 'TBD' };
                        const player2 = dbMatch?.player2 || match.player2 || { name: 'TBD' };

                        const player1Name = getPlayerDisplay(player1);
                        const player2Name = getPlayerDisplay(player2);

                        const isCompleted = dbMatch?.status === 'COMPLETED' || (!dbMatch && match.winner && player1.name !== 'TBD' && player2.name !== 'TBD');
                        const isLive     = dbMatch?.status === 'IN_PROGRESS';
                        const isReady    = dbMatch?.status === 'READY' && player1.name !== 'TBD' && player2.name !== 'TBD';
                        const hasUmpire  = dbMatch?.umpireId;

                        const isPlayer1Winner = dbMatch ? dbMatch.winnerId === player1?.id : match.winner === 1;
                        const isPlayer2Winner = dbMatch ? dbMatch.winnerId === player2?.id : match.winner === 2;

                        const isTbd1 = player1Name === 'TBD';
                        const isTbd2 = player2Name === 'TBD';

                        // Card border colour per state
                        const cardBorder = isLive
                          ? '1.5px solid rgba(245,158,11,0.55)'
                          : isCompleted
                          ? '1px solid rgba(245,158,11,0.22)'
                          : '1px solid rgba(255,255,255,0.09)';

                        return (
                          /* Fixed-height slot — card is vertically centered via alignItems:'center'.
                             Action buttons are absolutely positioned below the card so they never
                             affect card height or connector-line math. All cards stay ~123px tall
                             regardless of role, giving consistent bracket rhythm. */
                          <div key={mi} style={{ height: slotH, display: 'flex', alignItems: 'center' }}>
                            <div style={{ width: '100%', position: 'relative' }}>

                              {/* ── Match card (display only — no buttons inside) ── */}
                              <div
                                className={isLive ? 'animate-pulse' : ''}
                                style={{
                                  background: mi % 2 === 0 ? '#07121e' : '#081828',
                                  border: cardBorder,
                                  borderRadius: '13px',
                                  overflow: 'hidden',
                                  boxShadow: isLive
                                    ? '0 0 20px rgba(245,158,11,0.18), 0 4px 12px rgba(0,0,0,0.5)'
                                    : '0 2px 12px rgba(0,0,0,0.4)',
                                }}
                              >
                                {/* Card header — match # + status */}
                                <div style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                  padding: '7px 12px 6px',
                                  background: 'rgba(0,0,0,0.2)',
                                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                                }}>
                                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.06em' }}>
                                    M{match.matchNumber || mi + 1}
                                  </span>
                                  {isLive && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '20px', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.35)', fontSize: '9px', fontWeight: 700, color: '#FCD34D' }}>
                                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#FCD34D', flexShrink: 0 }} />
                                      LIVE
                                    </span>
                                  )}
                                  {isCompleted && !isLive && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '2px 7px', borderRadius: '20px', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)', fontSize: '9px', fontWeight: 700, color: '#4ade80' }}>
                                      ✓ Done
                                    </span>
                                  )}
                                  {!isCompleted && !isLive && isTbd1 !== isTbd2 && (
                                    <span style={{ fontSize: '9px', fontWeight: 700, color: '#fbbf24', letterSpacing: '0.04em' }}>BYE</span>
                                  )}
                                </div>

                                {/* Umpire assigned label — persistent, always visible once assigned */}
                                {hasUmpire && dbMatch?.umpire?.name && (
                                  <div style={{ padding: '4px 12px', background: 'rgba(96,165,250,0.08)', borderBottom: '1px solid rgba(96,165,250,0.12)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <span style={{ fontSize: '9px', fontWeight: 700, color: '#60a5fa', letterSpacing: '0.04em' }}>🎤 Umpire: {dbMatch.umpire.name}</span>
                                  </div>
                                )}

                                {/* Player rows — left-border accent = winner indicator */}
                                <div style={{ padding: '8px 0 6px' }}>

                                  {/* Player 1 */}
                                  <div style={{
                                    display: 'flex', alignItems: 'center',
                                    padding: '9px 12px 9px 11px',
                                    background: isPlayer1Winner ? 'rgba(245,158,11,0.1)' : 'transparent',
                                    borderLeft: isPlayer1Winner ? '3px solid #FCD34D' : '3px solid transparent',
                                  }}>
                                    <span style={{
                                      flex: 1, minWidth: 0,
                                      fontSize: '13px', fontWeight: isPlayer1Winner ? 700 : 500,
                                      color: isTbd1 ? 'rgba(255,255,255,0.28)' : '#ffffff',
                                      fontStyle: isTbd1 ? 'italic' : 'normal',
                                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                    }}>
                                      {player1Name}
                                    </span>
                                    {isPlayer1Winner && (
                                      <span style={{ flexShrink: 0, marginLeft: '8px', width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(245,158,11,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 800, color: '#050810' }}>W</span>
                                    )}
                                  </div>

                                  {/* Divider */}
                                  <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0 12px' }} />

                                  {/* Player 2 */}
                                  <div style={{
                                    display: 'flex', alignItems: 'center',
                                    padding: '9px 12px 9px 11px',
                                    background: isPlayer2Winner ? 'rgba(245,158,11,0.1)' : 'transparent',
                                    borderLeft: isPlayer2Winner ? '3px solid #FCD34D' : '3px solid transparent',
                                  }}>
                                    <span style={{
                                      flex: 1, minWidth: 0,
                                      fontSize: '13px', fontWeight: isPlayer2Winner ? 700 : 500,
                                      color: isTbd2 ? 'rgba(255,255,255,0.28)' : '#ffffff',
                                      fontStyle: isTbd2 ? 'italic' : 'normal',
                                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                    }}>
                                      {player2Name}
                                    </span>
                                    {isPlayer2Winner && (
                                      <span style={{ flexShrink: 0, marginLeft: '8px', width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(245,158,11,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 800, color: '#050810' }}>W</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {/* ── End match card ──────────────────────────── */}

                              {/* ── Action buttons — absolutely below card, never affect slot height ── */}
                              {(isCompleted || (isOrganizer && dbMatch && !isCompleted)) && (
                                <div style={{
                                  position: 'absolute', top: '100%', left: 0, right: 0,
                                  marginTop: '6px',
                                  display: 'flex',
                                  /* Completed organizer: 2 buttons → row. All other cases: column */
                                  flexDirection: (isOrganizer && isCompleted) ? 'row' : 'column',
                                  gap: '5px',
                                  zIndex: 2,
                                }}>
                                  {isCompleted && (
                                    <button
                                      onClick={() => {
                                        const bracketMatchData = { matchNumber: match.matchNumber, round: ri + 1, player1, player2 };
                                        const matchDataToUse = dbMatch
                                          ? { ...dbMatch, score: dbMatch.score ?? dbMatch.scoreJson ?? null }
                                          : {
                                              matchNumber: match.matchNumber, status: 'COMPLETED', winner: match.winner,
                                              winnerId: match.winner === 1 ? player1?.id : player2?.id,
                                              score: match.scoreJson || match.score || null,
                                              scoreJson: match.scoreJson || null,
                                              player1, player2,
                                            };
                                        onViewMatchDetails(matchDataToUse, bracketMatchData);
                                      }}
                                      style={{
                                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        gap: '5px', padding: '6px 8px',
                                        background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)',
                                        border: '1px solid rgba(255,255,255,0.09)', borderRadius: '9px',
                                        fontSize: '10px', fontWeight: 600, cursor: 'pointer',
                                        whiteSpace: 'nowrap',
                                      }}
                                    >
                                      <Eye className="w-3 h-3 flex-shrink-0" />
                                      Details
                                    </button>
                                  )}
                                  {isOrganizer && dbMatch && !isCompleted && (
                                    <>
                                      {player1.name !== 'TBD' && player2.name !== 'TBD' ? (
                                        <button
                                          onClick={() => {
                                            if (hasUmpire && dbMatch?.umpireId) {
                                              navigate(`/match/${dbMatch.id}/conduct?umpireId=${dbMatch.umpireId}`);
                                            } else {
                                              const bracketMatchData = { matchNumber: match.matchNumber, round: ri + 1, player1, player2 };
                                              onAssignUmpire(dbMatch, bracketMatchData);
                                            }
                                          }}
                                          style={
                                            hasUmpire
                                              ? { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '6px 8px', background: 'rgba(245,158,11,0.1)', color: '#FCD34D', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '9px', fontSize: '10px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }
                                              : { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '6px 8px', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '9px', fontSize: '10px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }
                                          }
                                        >
                                          <Gavel className="w-3 h-3 flex-shrink-0" />
                                          {hasUmpire ? '✓ Conduct' : 'Assign Umpire'}
                                        </button>
                                      ) : (player1.name !== 'TBD' || player2.name !== 'TBD') ? (
                                        <button
                                          onClick={() => handleGiveByeForMatch(dbMatch.id)}
                                          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '6px 8px', background: 'rgba(245,158,11,0.08)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '9px', fontSize: '10px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                                        >
                                          <Trophy className="w-3 h-3 flex-shrink-0" />
                                          Give BYE
                                        </button>
                                      ) : null}
                                    </>
                                  )}
                                  {isOrganizer && dbMatch && isCompleted && (
                                    <button
                                      onClick={() => {
                                        const bracketMatchData = { matchNumber: match.matchNumber, round: ri + 1, player1, player2, currentWinnerId: dbMatch?.winnerId };
                                        onChangeResult(dbMatch, bracketMatchData);
                                      }}
                                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px 8px', background: 'rgba(245,158,11,0.07)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.18)', borderRadius: '9px', fontSize: '10px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                                    >
                                      Change
                                    </button>
                                  )}
                                </div>
                              )}
                              {/* ── End action buttons ──────────────────────── */}

                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {/* ── End round column ──────────────────────────────────── */}

                    {/* ── Connector column: L-shaped bracket lines ────────────
                        topCenter  = mi×slotH + slotH/2
                        botCenter  = (mi+1)×slotH + slotH/2
                        midY       = (topCenter+botCenter)/2  ← = parent center ✓
                        Lines are 1.5px thick for clean visibility.
                    ────────────────────────────────────────────────────────── */}
                    {ri < data.rounds.length - 1 && (
                      <div style={{ width: CONN_W, flexShrink: 0, position: 'relative', height: round.matches.length * slotH }}>
                        {round.matches.map((_, mi) => {
                          if (mi % 2 !== 0) return null;
                          if (!round.matches[mi + 1]) return null;  // odd bracket — no pair to connect

                          const topCenter = mi * slotH + slotH / 2;
                          const botCenter = (mi + 1) * slotH + slotH / 2;
                          const midY      = (topCenter + botCenter) / 2;  // = parent card center ✓
                          const spineX    = CONN_W / 2;

                          return (
                            <React.Fragment key={mi}>
                              {/* Top horizontal arm (from top match center → spine) */}
                              <div style={{ position: 'absolute', top: topCenter - 0.75, left: 0, width: spineX, height: 1.5, background: LINE }} />
                              {/* Bottom horizontal arm (from bottom match center → spine) */}
                              <div style={{ position: 'absolute', top: botCenter - 0.75, left: 0, width: spineX, height: 1.5, background: LINE }} />
                              {/* Vertical spine (connects top and bottom arms) */}
                              <div style={{ position: 'absolute', top: topCenter, left: spineX - 0.75, width: 1.5, height: botCenter - topCenter, background: LINE }} />
                              {/* Right arm (from spine midpoint → next round card) */}
                              <div style={{ position: 'absolute', top: midY - 0.75, left: spineX, width: spineX, height: 1.5, background: LINE }} />
                            </React.Fragment>
                          );
                        })}
                      </div>
                    )}

                  </React.Fragment>
                );
              })}
            </div>
            {/* ── End bracket row ─────────────────────────────────────────── */}

          </div>
        </ZoomableBracket>
        {/* ── End ZoomableBracket ───────────────────────────────────────── */}

      </div>
    </div>
  );
};

// Round Robin Display with Match Schedule
const RoundRobinDisplay = ({ data, matches, user, isOrganizer, onAssignUmpire, onChangeResult, onViewMatchDetails, categoryFormat }) => {
  const navigate = useNavigate();
  const [activeGroupIdx, setActiveGroupIdx] = React.useState(null); // null = all hidden, number = show that group's matches
  if (!data?.groups || !Array.isArray(data.groups)) return <p className="text-gray-400 text-center p-8">No group data</p>;

  // Find database matches for each group match
  const findDbMatch = (groupMatch, groupIndex) => {
    if (!matches || !Array.isArray(matches)) return null;

    // 1. Best: stage=GROUP + matchNumber (avoids KO match collision)
    let found = matches.find(m => m.stage === 'GROUP' && m.matchNumber === groupMatch.matchNumber);

    // 2. Fallback: player IDs (handles null-stage old data without matchNumber collision)
    if (!found && groupMatch.player1?.id && groupMatch.player2?.id) {
      found = matches.find(m =>
        (m.player1Id === groupMatch.player1.id && m.player2Id === groupMatch.player2.id) ||
        (m.player1Id === groupMatch.player2.id && m.player2Id === groupMatch.player1.id)
      );
    }

    // 3. Last resort: matchNumber only, skip confirmed KO matches
    if (!found) {
      found = matches.find(m => m.matchNumber === groupMatch.matchNumber && m.stage !== 'KNOCKOUT');
    }

    return found;
  };

  return (
    <div className="p-3 space-y-4">
      {data.groups.map((group, gi) => (
        <div key={gi} className="rounded-2xl overflow-hidden" style={{ background: '#111826', border: '1px solid rgba(255,255,255,0.07)' }}>

          {/* Group Header */}
          <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#F59E0B,#D97706)', color: '#fff' }}
            >
              {String.fromCharCode(65 + gi)}
            </div>
            <div>
              <h4 className="font-bold text-white" style={{ fontSize: '15px', lineHeight: 1.2 }}>Group {String.fromCharCode(65 + gi)}</h4>
              <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>
                {group.participants.filter(p => p.id).length} players • {group.matches?.length || 0} matches
              </p>
            </div>
          </div>

          {/* Standings */}
          <div className="px-2 pt-3 pb-2">
            {/* Section label */}
            <div className="flex items-center gap-1.5 mb-2">
              <Trophy className="w-3.5 h-3.5" style={{ color: '#F59E0B' }} />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#94a3b8' }}>Standings</span>
            </div>

            {/* Column headers — stat labels wrapped in gap:0 container to match data cell layout exactly */}
            <div className="flex items-center px-2 mb-1" style={{ gap: '4px' }}>
              <div style={{ width: '28px', flexShrink: 0 }} />
              <div className="flex-1 min-w-0">
                <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)', fontWeight: 700, letterSpacing: '0.07em' }}>PLAYER</span>
              </div>
              {/* gap:0 here — mirrors data cell container which also has gap:0 */}
              <div className="flex-shrink-0 flex items-center" style={{ gap: '0px' }}>
                {[
                  { h: 'P',   w: '22px', c: 'rgba(148,163,184,0.7)' },
                  { h: 'W',   w: '22px', c: 'rgba(74,222,128,0.85)' },
                  { h: 'L',   w: '22px', c: 'rgba(248,113,113,0.85)'},
                  { h: 'PTS', w: '28px', c: 'rgba(245,158,11,0.9)'  },
                  { h: 'TP',  w: '30px', c: 'rgba(196,181,253,0.9)' },
                ].map(({ h, w, c }) => (
                  <div key={h} style={{ width: w, flexShrink: 0, textAlign: 'center' }}>
                    <span style={{ fontSize: '9px', color: c, fontWeight: 700 }}>{h}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rows */}
            <div>
              {(group.participants || [])
                .sort((a, b) => {
                  if ((b.points || 0) !== (a.points || 0)) return (b.points || 0) - (a.points || 0);
                  const aDiff = (a.totalPoints || 0) - (a.totalPointsAgainst || 0);
                  const bDiff = (b.totalPoints || 0) - (b.totalPointsAgainst || 0);
                  if (bDiff !== aDiff) return bDiff - aDiff;
                  return (b.totalPoints || 0) - (a.totalPoints || 0);
                })
                .map((p, pi) => {
                  const tpDiff = (p.totalPoints || 0) - (p.totalPointsAgainst || 0);
                  const tpVal  = tpDiff > 0 ? `+${tpDiff}` : `${tpDiff}`;
                  const tpColor = tpDiff > 0 ? '#4ade80' : tpDiff < 0 ? '#f87171' : '#94a3b8';
                  // ── Name resolution ──────────────────────────────────────
                  // Doubles data can arrive as:
                  //   A) p.name = "Alice"  + p.partnerName = "Bob"
                  //   B) p.name = "Alice / Bob"  (combined string, no partnerName)
                  // In both cases render two clean stacked lines — no slash wrap.
                  let line1 = p.name || `Slot ${pi + 1}`;
                  let line2 = p.partnerName || null;
                  if (!line2 && line1.includes('/')) {
                    const parts = line1.split('/').map(s => s.trim()).filter(Boolean);
                    line1 = parts[0] || line1;
                    line2 = parts[1] || null;
                  }
                  const isDoubles = !!line2;

                  return (
                    <div
                      key={pi}
                      className="flex rounded-xl transition-colors"
                      style={{
                        alignItems: 'center',
                        padding: '9px 8px',
                        gap: '4px',
                        marginBottom: '3px',
                        minHeight: isDoubles ? '62px' : '44px',
                        background: pi === 0 ? 'rgba(245,158,11,0.07)' : 'rgba(15,22,36,0.65)',
                        borderLeft: pi === 0 ? '3px solid #F59E0B' : '3px solid transparent',
                      }}
                    >
                      {/* Rank badge — fixed 28×28, flex-shrink-0 */}
                      <div
                        className="flex-shrink-0 flex items-center justify-center rounded-md font-bold"
                        style={{
                          width: '28px', height: '28px',
                          fontSize: '12px',
                          background:
                            pi === 0 ? 'rgba(245,158,11,0.18)' :
                            pi === 1 ? 'rgba(148,163,184,0.1)'  :
                            pi === 2 ? 'rgba(205,127,50,0.12)'  :
                            'rgba(255,255,255,0.05)',
                          color:
                            pi === 0 ? '#FCD34D' :
                            pi === 1 ? '#94a3b8'  :
                            pi === 2 ? '#d97706'  :
                            'rgba(255,255,255,0.28)',
                        }}
                      >
                        {pi + 1}
                      </div>

                      {/* Player Name — overflow-hidden + truncate prevents ANY wrapping */}
                      <div className="flex-1 min-w-0 overflow-hidden">
                        {p.id ? (
                          <>
                            <p
                              className="truncate"
                              style={{ fontSize: '13px', lineHeight: '1.35', color: '#ffffff', fontWeight: 600 }}
                              title={line1}
                            >
                              {line1}
                            </p>
                            {line2 && (
                              <p
                                className="truncate"
                                style={{ fontSize: '13px', lineHeight: '1.35', color: 'rgba(255,255,255,0.72)', fontWeight: 500, marginTop: '2px' }}
                                title={line2}
                              >
                                {line2}
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="truncate" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>
                            Slot {pi + 1}
                          </p>
                        )}
                      </div>

                      {/* Stats: P · W · L · PTS · TP
                          Numbers = pure white (#ffffff) for max readability.
                          Accent context comes from the column header labels only. */}
                      <div className="flex-shrink-0 flex items-center" style={{ gap: '0px' }}>
                        {[
                          { val: (p.wins || 0) + (p.losses || 0), w: '22px', color: '#94a3b8' },
                          { val: p.wins    || 0,                   w: '22px', color: '#ffffff', bold: true },
                          { val: p.losses  || 0,                   w: '22px', color: '#ffffff', bold: true },
                          { val: p.points  || 0,                   w: '28px', color: '#ffffff', bold: true },
                          { val: tpVal,                            w: '30px', color: tpColor,   bold: true },
                        ].map((s, si) => (
                          <div key={si} style={{ width: s.w, flexShrink: 0, textAlign: 'center' }}>
                            <span style={{ fontSize: '13px', fontWeight: s.bold ? 700 : 500, color: s.color, lineHeight: 1 }}>
                              {s.val}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Points System Legend */}
          <div className="mx-2 mb-3 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(11,16,32,0.6)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center justify-center gap-4 flex-wrap mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold"
                  style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>W</span>
                <span style={{ fontSize: '11px', color: '#22c55e', fontWeight: 600 }}>+2 pts</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold"
                  style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171' }}>L</span>
                <span style={{ fontSize: '11px', color: '#f87171', fontWeight: 600 }}>+0 pts</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold"
                  style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa' }}>TP</span>
                <span style={{ fontSize: '11px', color: '#a78bfa', fontWeight: 600 }}>Game pts</span>
              </div>
            </div>
            <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.22)', textAlign: 'center' }}>
              P = Played · W = Won · L = Lost · PTS = Points · TP = Total Points
            </p>
          </div>

          {/* View Matches button */}
          <div className="px-2 pb-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
            <button
              onClick={() => setActiveGroupIdx(gi)}
              className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
              style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.18)', color: '#FCD34D' }}
            >
              <Clock className="w-4 h-4" />
              View Matches ({group.matches?.length || 0})
            </button>
          </div>
        </div>
      ))}

      {/* ── Group Matches Modal ──────────────────────────────────────────────── */}
      {activeGroupIdx !== null && data.groups[activeGroupIdx] && (() => {
        const group = data.groups[activeGroupIdx];
        const gi = activeGroupIdx;
        return (
          <div
            className="fixed inset-0 z-50 flex flex-col"
            style={{ background: '#050810' }}
          >
            {/* Modal Header */}
            <div
              className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b-2"
              style={{ background: 'rgba(13,16,37,0.98)', borderColor: 'rgba(245,158,11,0.2)', backdropFilter: 'blur(20px)' }}
            >
              <button
                onClick={() => setActiveGroupIdx(null)}
                className="flex items-center gap-1.5 text-sm font-black"
                style={{ color: 'rgba(255,255,255,0.6)' }}
              >
                <ArrowLeft className="w-5 h-5" /> Back
              </button>
              <div className="flex-1 text-center">
                <p className="text-base font-black text-white">Group {String.fromCharCode(65 + gi)} Matches</p>
                <p className="text-xs font-semibold" style={{ color: '#F59E0B' }}>{group.matches?.length || 0} matches</p>
              </div>
              <div className="w-16" /> {/* spacer to center title */}
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {group.matches && group.matches.length > 0 ? (
                group.matches.map((match, mi) => {
                  const dbMatch = findDbMatch(match, gi);
                  const hasPlayers = match.player1?.id && match.player2?.id;
                  const isCompleted = dbMatch?.status === 'COMPLETED' || (!dbMatch && match.winner && match.player1?.id && match.player2?.id);
                  const isInProgress = dbMatch?.status === 'IN_PROGRESS';
                  const hasUmpire = dbMatch?.umpireId;

                  return (
                    <div
                      key={mi}
                      className={`rounded-xl overflow-hidden transition-all${isInProgress ? ' animate-pulse' : ''}`}
                      style={{
                        background: mi % 2 === 0 ? '#07121e' : '#0d1a2e',
                        border: isInProgress
                          ? '2px solid rgba(245,158,11,0.7)'
                          : isCompleted
                          ? '1.5px solid rgba(245,158,11,0.3)'
                          : hasUmpire
                          ? '1.5px solid rgba(255,255,255,0.18)'
                          : '1.5px solid rgba(255,255,255,0.11)',
                        boxShadow: isInProgress
                          ? '0 0 14px rgba(245,158,11,0.18)'
                          : mi % 2 === 0
                          ? '0 2px 12px rgba(0,0,0,0.4)'
                          : '0 2px 12px rgba(13,26,46,0.6)',
                      }}
                    >
                      {/* Match Header */}
                      <div className="flex items-center justify-between px-3 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                        <span className="text-xs font-black" style={{ color: 'rgba(255,255,255,0.6)' }}>
                          MATCH #{match.matchNumber}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {isCompleted && <span className="text-xs font-black" style={{ color: '#FCD34D' }}>✓ DONE</span>}
                          {isInProgress && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1" style={{ background: 'rgba(245,158,11,0.15)', color: '#FCD34D', border: '1px solid rgba(245,158,11,0.35)' }}>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#FCD34D' }}></span>
                              LIVE
                            </span>
                          )}
                          {hasUmpire && !isCompleted && !isInProgress && (
                            <span className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>READY</span>
                          )}
                        </div>
                      </div>

                      {/* Umpire assigned label — persistent, always visible once assigned */}
                      {hasUmpire && dbMatch?.umpire?.name && (
                        <div style={{ padding: '4px 12px', background: 'rgba(96,165,250,0.08)', borderBottom: '1px solid rgba(96,165,250,0.12)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span style={{ fontSize: '9px', fontWeight: 700, color: '#60a5fa', letterSpacing: '0.04em' }}>🎤 Umpire: {dbMatch.umpire.name}</span>
                        </div>
                      )}

                      {/* Players */}
                      {(() => {
                        const p1Won = dbMatch ? dbMatch.winnerId === match.player1?.id : match.winner === 1;
                        const p2Won = dbMatch ? dbMatch.winnerId === match.player2?.id : match.winner === 2;
                        const p1Name = getPlayerDisplay(match.player1) || 'TBD';
                        const p2Name = getPlayerDisplay(match.player2) || 'TBD';
                        const isMatchDone = isCompleted;
                        return (
                          <div className="p-2.5 space-y-1.5">
                            <div
                              className="py-2 px-3 rounded-lg flex items-center justify-between"
                              style={
                                p1Won
                                  ? { background: 'rgba(245,158,11,0.16)', borderTop: '1px solid rgba(245,158,11,0.28)', borderRight: '1px solid rgba(245,158,11,0.28)', borderBottom: '1px solid rgba(245,158,11,0.28)', borderLeft: '3px solid #F59E0B' }
                                  : isMatchDone
                                  ? { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }
                                  : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }
                              }
                            >
                              <span
                                className="truncate flex-1 text-xs font-bold"
                                style={{
                                  color: p1Name === 'TBD' ? 'rgba(255,255,255,0.22)' : '#ffffff',
                                  fontStyle: p1Name === 'TBD' ? 'italic' : 'normal',
                                }}
                              >
                                {p1Name}
                              </span>
                              {p1Won && <span className="text-[10px] font-black ml-1 flex-shrink-0" style={{ color: '#FCD34D' }}>W</span>}
                            </div>
                            <div className="text-center">
                              <span className="text-xs font-black" style={{ color: 'rgba(255,255,255,0.3)' }}>VS</span>
                            </div>
                            <div
                              className="py-2 px-3 rounded-lg flex items-center justify-between"
                              style={
                                p2Won
                                  ? { background: 'rgba(245,158,11,0.16)', borderTop: '1px solid rgba(245,158,11,0.28)', borderRight: '1px solid rgba(245,158,11,0.28)', borderBottom: '1px solid rgba(245,158,11,0.28)', borderLeft: '3px solid #F59E0B' }
                                  : isMatchDone
                                  ? { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }
                                  : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }
                              }
                            >
                              <span
                                className="truncate flex-1 text-xs font-bold"
                                style={{
                                  color: p2Name === 'TBD' ? 'rgba(255,255,255,0.22)' : '#ffffff',
                                  fontStyle: p2Name === 'TBD' ? 'italic' : 'normal',
                                }}
                              >
                                {p2Name}
                              </span>
                              {p2Won && <span className="text-[10px] font-black ml-1 flex-shrink-0" style={{ color: '#FCD34D' }}>W</span>}
                            </div>
                          </div>
                        );
                      })()}

                      {/* VIEW & CHANGE when completed */}
                      {isCompleted && hasPlayers && (
                        <div className="px-2.5 pb-2.5 flex gap-2">
                          <button
                            onClick={() => {
                              const bracketMatchData = { matchNumber: match.matchNumber, round: 1, player1: match.player1, player2: match.player2, groupName: group.groupName };
                              const matchDataToUse = dbMatch
                                ? { ...dbMatch, score: dbMatch.score ?? dbMatch.scoreJson ?? null }
                                : {
                                    matchNumber: match.matchNumber, status: 'COMPLETED', winner: match.winner,
                                    winnerId: match.winner === 1 ? match.player1?.id : match.player2?.id,
                                    score: match.scoreJson || match.score || null,
                                    scoreJson: match.scoreJson || null,
                                    player1: match.player1, player2: match.player2,
                                  };
                              onViewMatchDetails(matchDataToUse, bracketMatchData);
                            }}
                            className="flex-1 py-2.5 rounded-lg text-xs font-black flex items-center justify-center gap-2 transition-all"
                            style={{ background: 'rgba(245,158,11,0.1)', color: '#FCD34D', border: '1px solid rgba(245,158,11,0.32)' }}
                          >
                            <Eye className="w-4 h-4" />
                            VIEW
                          </button>
                          {isOrganizer && (
                            <button
                              onClick={() => {
                                const bracketMatchData = { matchNumber: match.matchNumber, round: 1, player1: match.player1, player2: match.player2, groupName: group.groupName, currentWinnerId: dbMatch?.winnerId };
                                onChangeResult(dbMatch, bracketMatchData);
                              }}
                              className="py-2.5 px-4 rounded-lg text-xs font-black transition-all"
                              style={{ background: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.25)' }}
                            >
                              CHANGE
                            </button>
                          )}
                        </div>
                      )}

                      {/* Organizer pre-completion actions */}
                      {isOrganizer && hasPlayers && !isCompleted && (
                        <div className="px-2.5 pb-2.5">
                          <button
                            onClick={() => {
                              if (hasUmpire && dbMatch?.umpireId) {
                                navigate(`/match/${dbMatch.id}/conduct?umpireId=${dbMatch.umpireId}`);
                              } else {
                                const bracketMatchData = { matchNumber: match.matchNumber, round: 1, player1: match.player1, player2: match.player2, groupName: group.groupName };
                                onAssignUmpire(dbMatch, bracketMatchData);
                              }
                            }}
                            className="w-full py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 text-xs font-black border-2"
                            style={
                              hasUmpire
                                ? { background: 'rgba(245,158,11,0.1)', color: '#FCD34D', borderColor: 'rgba(245,158,11,0.28)' }
                                : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.65)', borderColor: 'rgba(255,255,255,0.12)' }
                            }
                          >
                            <Gavel className="w-4 h-4" />
                            {hasUmpire ? '✓ CONDUCT' : 'ASSIGN'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-16 text-gray-500">
                  <p className="text-sm">No matches generated yet</p>
                  <p className="text-xs mt-1">Assign players to generate matches</p>
                </div>
              )}
            </div>
          </div>
        );
      })()}
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
    <div className="space-y-4 p-3">
      {/* Stage Navigation Tabs - Clean Premium */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(11,16,32,0.95)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <button
          onClick={() => setActiveStage('roundrobin')}
          className="flex-1 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 active:scale-95"
          style={
            activeStage === 'roundrobin'
              ? { background: 'linear-gradient(135deg,#F59E0B,#D97706)', color: '#fff', boxShadow: '0 2px 14px rgba(245,158,11,0.28)', fontWeight: 700 }
              : { color: 'rgba(255,255,255,0.38)', background: 'transparent' }
          }
        >
          <span style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '0.09em', opacity: activeStage === 'roundrobin' ? 0.8 : 0.7 }}>STAGE 1</span>
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em' }}>GROUPS</span>
        </button>

        <button
          onClick={() => setActiveStage('knockout')}
          className="flex-1 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 active:scale-95"
          style={
            activeStage === 'knockout'
              ? { background: 'linear-gradient(135deg,#F59E0B,#D97706)', color: '#fff', boxShadow: '0 2px 14px rgba(245,158,11,0.28)', fontWeight: 700 }
              : { color: 'rgba(255,255,255,0.38)', background: 'transparent' }
          }
        >
          <span style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '0.09em', opacity: activeStage === 'knockout' ? 0.8 : 0.7 }}>STAGE 2</span>
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em' }}>KNOCKOUT</span>
        </button>
      </div>

      {/* Round Robin Stage */}
      {activeStage === 'roundrobin' && (
        <div>
          <RoundRobinDisplay 
            data={data} 
            matches={matches} 
            user={user} 
            isOrganizer={isOrganizer} 
            onAssignUmpire={onAssignUmpire}
            onChangeResult={onChangeResult}
            onViewMatchDetails={onViewMatchDetails}
            categoryFormat={activeCategory?.format}
          />
        </div>
      )}

      {/* Knockout Stage */}
      {activeStage === 'knockout' && (
        <div>
          {!data.knockout ? (
            // No knockout data at all - show message to create it
            <div className="rounded-2xl p-8 text-center border-2 border-dashed" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(245,158,11,0.25)' }}>
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(245,158,11,0.08)' }}>
                <TrophyIcon className="w-10 h-10 icon-green" />
              </div>
              <h4 className="text-xl font-bold text-white mb-2">Knockout Stage Not Created</h4>
              <p className="text-gray-400 mb-4 text-sm">
                {isRoundRobinComplete() 
                  ? 'All round robin matches are completed! Use the "Arrange Knockout Matchups" button above to create the knockout bracket.'
                  : 'The knockout bracket will be available after all round robin matches are completed.'}
              </p>
              
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'rgba(245,158,11,0.1)', border: '2px solid rgba(245,158,11,0.25)' }}>
                <Settings className="w-4 h-4 icon-green" />
                <span className="text-sm text-[#F59E0B] font-semibold">
                  {isRoundRobinComplete() ? 'Click "Arrange KO" button in the header' : 'Complete all round robin matches first'}
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
                categoryFormat={activeCategory?.format}
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
      <div className="rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl" style={{ background: '#0d1025', border: '2px solid rgba(245,158,11,0.2)' }}>
        {/* Header */}
        <div className="p-6 border-b-2 border-white/10" style={{ background: 'rgba(245,158,11,0.05)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg,#F59E0B,#FCD34D)' }}>
                <Settings className="w-6 h-6" style={{ color: '#050810' }} />
              </div>
              <h2 className="text-xl font-bold text-white">Configure Draw</h2>
            </div>
            <button onClick={onClose} className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center text-gray-300 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 icon-green" />
              Tournament Format
            </label>
            <div className="space-y-2">
              {formatOptions.map((option) => {
                return (
                  <button
                    key={option.value}
                    onClick={() => setConfig({ ...config, format: option.value })}
                    className={`w-full p-4 rounded-xl text-left transition-all border-2 font-semibold ${
                      config.format === option.value
                        ? 'tab-active border-transparent'
                        : 'bg-slate-700/50 text-gray-300 border-white/10 hover:border-emerald-500/30 hover:bg-slate-700'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bracket Size */}
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 icon-green" />
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
                className="w-full px-4 py-4 rounded-xl text-white text-2xl font-bold focus:outline-none transition-all" style={{ background: 'rgba(255,255,255,0.06)', border: '2px solid rgba(245,158,11,0.25)' }}
                placeholder="0"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 icon-green text-sm font-medium">
                players
              </div>
            </div>
          </div>

          {/* Group Settings (for Round Robin formats) */}
          {(config.format === 'ROUND_ROBIN' || config.format === 'ROUND_ROBIN_KNOCKOUT') && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4 icon-green" />
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
                    className="w-full px-4 py-4 rounded-xl text-white text-2xl font-bold focus:outline-none transition-all" style={{ background: 'rgba(255,255,255,0.06)', border: '2px solid rgba(245,158,11,0.25)' }}
                    placeholder="0"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 icon-green text-sm font-medium">
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
                    className={`mt-3 w-full px-4 py-3 rounded-xl transition-all font-semibold ${
                      useCustomGroupSizes
                        ? 'tab-active'
                        : 'bg-slate-700/50 text-gray-300 hover:bg-slate-700 border-2 border-white/10'
                    }`}
                  >
                    {useCustomGroupSizes ? '✓ Custom Sizes' : 'Customize Group Sizes'}
                  </button>
                )}

                {/* Custom Group Size Inputs */}
                {useCustomGroupSizes && (
                  <div className="mt-4 space-y-3 p-4 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-xl">
                    {config.customGroupSizes?.map((size, idx) => {
                      return (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="w-20 h-12 rounded-lg flex items-center justify-center font-bold shadow-lg" style={{ background: 'linear-gradient(135deg,#F59E0B,#FCD34D)', color: '#050810' }}>
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
                            className="flex-1 px-4 py-3 rounded-xl text-white text-xl font-bold focus:outline-none transition-all" style={{ background: 'rgba(255,255,255,0.06)', border: '2px solid rgba(245,158,11,0.25)' }}
                            placeholder="0"
                          />
                        </div>
                      );
                    })}
                    <div className={`flex items-center justify-between p-3 rounded-lg ${
                      config.customGroupSizes?.reduce((a, b) => a + b, 0) === config.bracketSize
                        ? 'bg-emerald-500/20 border-2 border-emerald-500/50'
                        : 'bg-red-500/20 border-2 border-red-500/50'
                    }`}>
                      <span className="text-sm font-medium text-white">Total:</span>
                      <span className="text-lg font-bold" style={{ color: config.customGroupSizes?.reduce((a, b) => a + b, 0) === config.bracketSize ? '#F59E0B' : '#f87171' }}>
                        {config.customGroupSizes?.reduce((a, b) => a + b, 0)} / {config.bracketSize}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {config.format === 'ROUND_ROBIN_KNOCKOUT' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
                    <TrophyIcon className="w-4 h-4 icon-green" />
                    Players Advancing from Each Group
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {[1, 2, 3, 4].map((num) => {
                      return (
                        <button
                          key={num}
                          onClick={() => setConfig({ ...config, advanceFromGroup: num })}
                          className={`py-4 rounded-xl font-bold transition-all border-2 ${
                            config.advanceFromGroup === num
                              ? 'tab-active border-transparent'
                              : 'bg-slate-700 text-gray-400 border-white/10 hover:border-emerald-500/30'
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

        <div className="p-6 border-t-2 border-white/10 flex gap-3">
          <button 
            onClick={onClose} 
            className="flex-1 px-6 py-4 rounded-xl transition-all font-semibold text-white" style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-6 py-4 btn-brand rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner size="md" />
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
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-emerald-500/30 rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-6 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-b-2 border-white/10">
                <h3 className="text-lg font-bold text-white">Matchify.pro</h3>
              </div>
              <div className="p-6">
                <p className="text-gray-300">{alertMessage}</p>
              </div>
              <div className="p-4 border-t-2 border-white/10">
                <button
                  onClick={() => setAlertMessage(null)}
                  className="w-full px-4 py-3 rounded-xl btn-brand font-semibold transition-all"
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
      <div className="rounded-2xl max-w-md w-full shadow-2xl" style={{ background: '#0d1025', border: '2px solid rgba(239,68,68,0.35)' }}>
        <div className="p-6 border-b-2 border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/50">
              <Trash2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Delete Draw</h2>
              <p className="text-gray-400 text-sm">{categoryName}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <p className="text-gray-300 mb-4">
            Are you sure you want to delete this draw? This action cannot be undone and all bracket data will be lost.
          </p>
          <div className="p-4 bg-red-500/10 border-2 border-red-500/30 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">
                All match assignments, scores, and player positions will be permanently removed. You'll need to create a new draw and reassign players.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t-2 border-white/10 flex gap-3">
          <button 
            onClick={onClose} 
            disabled={deleting}
            className="flex-1 px-4 py-3 rounded-xl transition-all font-semibold text-white" style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:shadow-lg hover:shadow-red-500/30 transition-all font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {deleting ? (
              <>
                <Spinner size="sm" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete
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
      className="p-3 rounded-xl border-2 transition-all"
      style={assigned
        ? { borderColor: 'rgba(245,158,11,0.5)', background: 'rgba(245,158,11,0.1)' }
        : canAccept
          ? { borderColor: 'rgba(245,158,11,0.6)', background: 'rgba(245,158,11,0.08)', borderStyle: 'dashed', cursor: 'pointer' }
          : { borderColor: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.03)', borderStyle: 'dashed' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={assigned
              ? { background: 'rgba(245,158,11,0.15)' }
              : canAccept
                ? { background: 'rgba(245,158,11,0.12)' }
                : { background: 'rgba(255,255,255,0.06)' }}>
            {assigned ? (
              <CheckCircle className="w-5 h-5 icon-green" />
            ) : (
              <Users className="w-5 h-5" style={{ color: canAccept ? '#FCD34D' : '#6b7280' }} />
            )}
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-0.5">{playerLabel}</div>
            {assigned ? (
              <span className="text-white font-medium">{assigned.playerName}</span>
            ) : (
              <span className="text-sm" style={{ color: canAccept ? '#FCD34D' : '#6b7280' }}>
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
      className="px-2 py-1.5 rounded-lg border transition-all"
      style={locked
        ? { borderColor: 'rgba(251,191,36,0.3)', background: 'rgba(251,191,36,0.05)', cursor: 'not-allowed' }
        : isDragOver
          ? { borderColor: 'rgba(245,158,11,1)', background: 'rgba(245,158,11,0.2)', borderStyle: 'dashed' }
          : assigned
            ? { borderColor: 'rgba(245,158,11,0.5)', background: 'rgba(245,158,11,0.1)', cursor: 'move' }
            : canAccept
              ? { borderColor: 'rgba(245,158,11,0.6)', background: 'rgba(245,158,11,0.08)', borderStyle: 'dashed', cursor: 'pointer' }
              : { borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)', borderStyle: 'dashed' }}
      title={assigned && !locked ? 'Drag to move player to another slot' : undefined}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{
            background: locked ? 'rgba(251,191,36,0.15)' : assigned ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.06)',
            color: locked ? '#fbbf24' : assigned ? '#F59E0B' : 'rgba(255,255,255,0.4)'
          }}>
            {playerLabel}
          </span>
          {assigned ? (
            <span className={`font-medium text-sm truncate ${locked ? 'text-amber-300' : 'text-white'}`}>
              {assigned.playerName}
            </span>
          ) : (
            <span className="text-xs truncate" style={{ color: canAccept ? '#FCD34D' : '#6b7280' }}>
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
          playerName: s.currentPlayer.name,
          partnerName: s.currentPlayer.partnerName || null
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
      playerName: selectedPlayer.name,
      partnerName: selectedPlayer.partnerName || null
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
      } catch (matchErr) {
        console.error('⚠️ Failed to refresh matches:', matchErr);
      }
      
      setSuccess('All available players assigned successfully!');
      setShowAssignModal(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error bulk assigning players:', err);
      setError(getErrorMessage(err, 'Failed to assign all players'));
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
      } catch (matchErr) {
        console.error('⚠️ Failed to refresh matches:', matchErr);
      }
      
      setSuccess('Players shuffled successfully!');
      setShowAssignModal(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error shuffling players:', err);
      setError(getErrorMessage(err, 'Failed to shuffle players'));
    }
  };

  const handleSave = () => {
    // Convert object to array format for API
    const assignmentsArray = Object.entries(assignments).map(([slot, data]) => ({
      slot: parseInt(slot),
      playerId: data.playerId,
      playerName: data.playerName,
      partnerName: data.partnerName || null
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
      {/* Animated Background for Modal */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute top-10 right-10 w-64 h-64 rounded-full blur-3xl opacity-20"
          style={{ 
            background: 'radial-gradient(circle, rgba(245,158,11,0.5) 0%, transparent 70%)',
            animation: 'float 8s ease-in-out infinite'
          }}
        />
        <div 
          className="absolute bottom-10 left-10 w-56 h-56 rounded-full blur-3xl opacity-15"
          style={{ 
            background: 'radial-gradient(circle, rgba(20,184,166,0.5) 0%, transparent 70%)',
            animation: 'float 10s ease-in-out infinite reverse',
            animationDelay: '2s'
          }}
        />
        {ASSIGN_PARTICLES.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${p.w}px`,
              height: `${p.h}px`,
              left: `${p.x}%`,
              top: `${p.y}%`,
              background: p.c,
              opacity: p.o,
              animation: `float ${p.dur}s ease-in-out infinite`,
              animationDelay: `${p.delay}s`,
              boxShadow: `0 0 ${p.glow}px ${p.c}`,
            }}
          />
        ))}
      </div>

      <div className="relative backdrop-blur-xl rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl" style={{ background: '#0d1025', border: '1px solid rgba(245,158,11,0.2)' }}>
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <UserPlus className="w-5 h-5 icon-green" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Assign Players to Draw</h2>
                <p className="text-gray-400 text-xs">Click a player, then click a slot to assign</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          
          {/* Bulk Action Buttons */}
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleAddAllPlayers}
              disabled={!canAddAll}
              className="flex items-center gap-1.5 px-3 py-2 btn-brand rounded-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-xs"
              title={canAddAll ? `Add ${Math.min(unassignedPlayersCount, availableSlotsCount)} unassigned players to available slots` : 'No unassigned players or available slots'}
            >
              <Users className="w-3.5 h-3.5" />
              Add All Players
              {canAddAll && (
                <span className="px-1.5 py-0.5 bg-white/20 rounded-full text-[10px]">
                  +{Math.min(unassignedPlayersCount, availableSlotsCount)}
                </span>
              )}
            </button>
            
            <button
              onClick={handleShuffleAllPlayers}
              disabled={!canShuffle}
              className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-lg hover:shadow-lg hover:shadow-teal-500/25 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-xs"
              title={canShuffle ? 'Randomly redistribute all assigned players (locked matches unchanged)' : 'Need at least 2 assigned players to shuffle'}
            >
              <Zap className="w-3.5 h-3.5" />
              Shuffle All Players
            </button>
          </div>
          
          {selectedPlayer && (
            <div className="mt-2 px-3 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-lg flex items-center justify-between">
              <span className="text-[#F59E0B] text-xs">
                Selected: <span className="font-semibold text-white">{selectedPlayer.name}</span> — Click a slot to assign
              </span>
              <button 
                onClick={() => setSelectedPlayer(null)}
                className="text-xs icon-green hover:opacity-80"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* Players List - 35% width */}
          <div className="w-[35%] border-r border-white/10 p-2 overflow-y-auto scroll-smooth scrollbar-thin">
            <h3 className="text-[10px] font-semibold text-gray-400 mb-2 uppercase tracking-wider">
              Registered Players ({players.length})
            </h3>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner size="md" />
              </div>
            ) : players.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 text-[10px]">No registered players</p>
              </div>
            ) : (
              <div className="space-y-1">
                {players.map((player) => {
                  const assigned = isPlayerAssigned(player.id);
                  const isSelected = selectedPlayer?.id === player.id;
                  return (
                    <div
                      key={player.id}
                      onClick={() => handleSelectPlayer(player)}
                      className={`p-1.5 rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-emerald-500/30 border border-emerald-500 shadow-lg shadow-emerald-500/20'
                          : assigned
                            ? 'bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'bg-slate-700/50 border border-transparent hover:bg-slate-700 hover:shadow-lg hover:shadow-emerald-500/10'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] flex-shrink-0"
                          style={{
                            background: isSelected ? 'linear-gradient(135deg,#F59E0B,#FCD34D)' : assigned ? 'linear-gradient(135deg,#F59E0B,#a855f7)' : 'linear-gradient(135deg,#a855f7,#FCD34D)',
                            color: '#050810',
                            boxShadow: isSelected ? '0 0 0 2px #F59E0B' : undefined
                          }}>
                          {player.seed}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium text-[11px] leading-tight">{player.name}</p>
                          {player.partnerName && (
                            <p className="text-[#F59E0B] text-[9px] leading-tight">& {player.partnerName}</p>
                          )}
                        </div>
                        {isSelected ? (
                          <div className="w-3 h-3 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <div className="w-1 h-1 bg-white rounded-full"></div>
                          </div>
                        ) : assigned ? (
                          <CheckCircle className="w-3 h-3 icon-green flex-shrink-0" />
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Slots Grid - 65% width */}
          <div className="flex-1 p-2 overflow-y-auto scroll-smooth scrollbar-thin">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
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
                  className="text-[10px] text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2 py-1 rounded-lg transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>
            
            {/* ROUND ROBIN: Pool-based view */}
            {(bracket?.format === 'ROUND_ROBIN' || bracket?.format === 'ROUND_ROBIN_KNOCKOUT') && bracket.groups ? (
              <div className="space-y-2">
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
                    <div key={groupIndex} className="bg-slate-700/30 rounded-lg border border-white/10 overflow-hidden">
                      {/* Pool Header - Compact */}
                      <div className="px-2 py-1.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-b border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 bg-emerald-500/30 rounded flex items-center justify-center">
                            <span className="text-[#F59E0B] font-bold text-xs">
                              {String.fromCharCode(65 + groupIndex)}
                            </span>
                          </div>
                          <div>
                            <h4 className="text-white font-bold text-[11px] leading-tight">Pool {String.fromCharCode(65 + groupIndex)}</h4>
                            <p className="text-[#F59E0B] text-[9px] leading-tight">
                              {assignedInPool}/{totalInPool} assigned
                            </p>
                          </div>
                        </div>
                        <div className="px-1.5 py-0.5 bg-emerald-500/20 rounded">
                          <span className="text-[#F59E0B] font-bold text-[9px]">{totalInPool} slots</span>
                        </div>
                      </div>
                      
                      {/* Pool Slots - Ultra Compact */}
                      <div className="p-1.5 grid grid-cols-2 gap-1">
                        {groupSlots.map((slot) => {
                          const assigned = getAssignedPlayer(slot.slot);
                          const canAccept = selectedPlayer && !assigned && !slot.locked;
                          
                          return (
                            <div
                              key={slot.slot}
                              onClick={() => canAccept && handleSlotClick(slot)}
                              className={`p-1.5 rounded border transition-all ${
                                canAccept
                                  ? 'border-emerald-500/50 bg-emerald-500/10 cursor-pointer hover:bg-emerald-500/20 hover:border-emerald-500'
                                  : assigned
                                    ? 'border-emerald-500/30 bg-emerald-500/10'
                                    : 'border-white/10 bg-slate-800/30'
                              } ${slot.locked ? 'opacity-50' : ''}`}
                            >
                              <div className="flex items-center gap-1">
                                <div className={`w-4 h-4 rounded flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${
                                  assigned 
                                    ? 'bg-emerald-500/30 text-[#F59E0B]' 
                                    : 'bg-slate-600/30 text-gray-500'
                                }`}>
                                  {slot.slot}
                                </div>
                                <div className="flex-1 min-w-0">
                                  {assigned ? (
                                    <>
                                      <p className="text-white font-medium text-[9px] leading-tight">{assigned.playerName}</p>
                                      {assigned.partnerName && (
                                        <p className="text-[#F59E0B] text-[8px] leading-tight">& {assigned.partnerName}</p>
                                      )}
                                    </>
                                  ) : (
                                    <p className="text-gray-500 text-[9px] leading-tight">Empty</p>
                                  )}
                                </div>
                                {assigned && !slot.locked && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveAssignment(slot.slot);
                                    }}
                                    className="p-0.5 hover:bg-red-500/20 rounded transition-colors flex-shrink-0"
                                  >
                                    <X className="w-2.5 h-2.5 text-red-400" />
                                  </button>
                                )}
                                {slot.locked && (
                                  <span className="text-[9px] flex-shrink-0">🔒</span>
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
                    <div className="px-3 py-1.5 border-b border-white/10 flex items-center gap-2"
                      style={isMatchLocked
                        ? { background: 'linear-gradient(to right,rgba(251,191,36,0.15),rgba(249,115,22,0.15))' }
                        : { background: 'rgba(245,158,11,0.08)' }}>
                      <span className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold"
                        style={isMatchLocked
                          ? { background: 'rgba(251,191,36,0.2)', color: '#fbbf24' }
                          : { background: 'rgba(245,158,11,0.15)', color: '#FCD34D' }}>
                        {matchNum}
                      </span>
                      <span className="font-semibold text-xs"
                        style={{ color: isMatchLocked ? '#fbbf24' : '#FCD34D' }}>
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

        <div className="p-4 border-t border-white/10 flex items-center justify-between">
          <div className="text-xs text-gray-400">
            {assignedCount} of {slots.length} slots assigned
          </div>
          <div className="flex gap-2">
            <button 
              onClick={onClose} 
              className="px-4 py-2 bg-slate-700 text-gray-300 rounded-lg hover:bg-slate-600 transition-colors font-semibold text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 btn-brand rounded-lg transition-all font-semibold disabled:opacity-50 flex items-center gap-1.5 text-xs"
            >
              {saving ? (
                <>
                  <Spinner size="xs" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
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
const AssignUmpireModal = ({ match, umpires, loadingUmpires, umpiresError, onRetryUmpires, onClose, onAssign, tournamentId, onUmpireAdded }) => {
  const navigate = useNavigate();
  const [selectedUmpire, setSelectedUmpire] = useState(match?.umpireId || null);
  const [assigning, setAssigning] = useState(false);

  const handleAssignOnly = async () => {
    if (!selectedUmpire) return;
    setAssigning(true);
    await onAssign(selectedUmpire);
    setAssigning(false);
    onClose();
  };

  const handleStartMatch = async () => {
    if (!selectedUmpire) return;
    setAssigning(true);
    await onAssign(selectedUmpire);
    setAssigning(false);
    // Pass umpireId in URL so ConductMatchPage can unlock the Start Match button
    navigate(`/match/${match.id}/conduct?umpireId=${selectedUmpire}`);
  };

  const selectedUmpireData = umpires.find(u => u.id === selectedUmpire);

  return (
    <div
      className="fixed inset-0 flex items-end sm:items-center justify-center z-50 p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: '#0d1025', border: '1px solid rgba(245,158,11,0.18)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.25),rgba(245,158,11,0.2))', border: '1px solid rgba(245,158,11,0.3)' }}>
                <Gavel className="w-5 h-5" style={{ color: '#F59E0B' }} />
              </div>
              <div>
                <h2 className="text-base font-black text-white">Assign Umpire & Start Match</h2>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Match {match?.matchNumber} • {getPlayerDisplay(match?.player1)} vs {getPlayerDisplay(match?.player2)}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl flex-shrink-0 transition-all"
              style={{ background: 'rgba(255,255,255,0.06)' }}>
              <X className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.5)' }} />
            </button>
          </div>
        </div>

        {/* Umpire list */}
        <div className="px-5 py-4">
          {loadingUmpires ? (
            <div className="text-center py-8">
              <Spinner size="md" className="mx-auto mb-3" />
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Loading umpires…</p>
            </div>
          ) : umpiresError ? (
            <div className="text-center py-8">
              <AlertTriangle className="w-10 h-10 mx-auto mb-3" style={{ color: '#f87171' }} />
              <p className="text-sm font-bold text-white mb-1">Failed to load umpires</p>
              <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>{umpiresError}</p>
              <button
                onClick={onRetryUmpires}
                className="px-4 py-2 rounded-xl text-xs font-bold"
                style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#F59E0B' }}
              >
                Retry
              </button>
            </div>
          ) : umpires.length === 0 ? (
            <InlineAddUmpire
              tournamentId={tournamentId}
              onUmpireAdded={onUmpireAdded}
            />
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
              {umpires.map((umpire) => {
                const isSelected = selectedUmpire === umpire.id;
                return (
                  <div
                    key={umpire.id}
                    onClick={() => setSelectedUmpire(umpire.id)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all"
                    style={isSelected
                      ? { background: 'rgba(245,158,11,0.1)', border: '1.5px solid rgba(245,158,11,0.4)' }
                      : { background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.07)' }}
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                      style={isSelected
                        ? { background: 'linear-gradient(135deg,#F59E0B,#F59E0B)', color: '#050810' }
                        : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}>
                      {umpire.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{umpire.name}</p>
                      <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{umpire.email}</p>
                    </div>
                    {isSelected && <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#F59E0B' }} />}
                  </div>
                );
              })}
            </div>
          )}

          {/* Selected umpire confirmation */}
          {selectedUmpireData && (
            <div className="mt-3 px-3 py-2.5 rounded-xl flex items-center gap-2"
              style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#F59E0B' }} />
              <p className="text-xs font-bold" style={{ color: '#F59E0B' }}>
                {selectedUmpireData.name} will conduct this match
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 space-y-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '1rem' }}>
          {/* Start Match — primary */}
          <button
            onClick={handleStartMatch}
            disabled={!selectedUmpire || assigning || umpires.length === 0}
            className="w-full py-3.5 rounded-xl font-black text-sm transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg,#F59E0B,#F59E0B)', color: '#050810', boxShadow: '0 4px 16px rgba(245,158,11,0.35)' }}
          >
            {assigning
              ? <><Spinner size="sm" />Starting…</>
              : <><Gavel className="w-4 h-4" />Start Match</>}
          </button>

          {/* Cancel + Assign Only */}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
            >
              Cancel
            </button>
            <button
              onClick={handleAssignOnly}
              disabled={!selectedUmpire || assigning || umpires.length === 0}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40 flex items-center justify-center gap-1.5"
              style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#FCD34D' }}
            >
              {assigning
                ? <Spinner size="xs" />
                : <CheckCircle className="w-3.5 h-3.5" />}
              Assign Only
            </button>
          </div>

          {/* Hint */}
          <p className="text-center text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Press "Start Match" to assign <span style={{ color: '#F59E0B' }}>{selectedUmpireData?.name || 'umpire'}</span> and begin scoring
          </p>
        </div>
      </div>
    </div>
  );
};

// Arrange Knockout Draw Modal — position-based seeding
// Organiser taps a player chip, then taps a bracket slot to place them.
// Empty slots = BYE (auto-advance). Backend receives same knockoutSlots format.
const ArrangeMatchupsModal = ({ bracket, onClose, onSave, saving }) => {
  const [positions, setPositions] = useState([]);       // length=bracketSize, each null|player
  const [advancingPlayers, setAdvancingPlayers] = useState([]);
  const [bracketSize, setBracketSize] = useState(null);
  const [pickedPlayer, setPickedPlayer] = useState(null); // player currently "in hand"

  const nextPow2 = (n) => { let p = 4; while (p < n) p *= 2; return p; };

  // Rebuild positions array when organiser changes bracket size
  const handleBracketSizeChange = (newSize) => {
    setBracketSize(newSize);
    setPositions(prev => {
      const pos = Array(newSize).fill(null);
      prev.forEach((p, i) => { if (i < newSize) pos[i] = p; });
      return pos;
    });
    setPickedPlayer(null);
  };

  useEffect(() => {
    if (!bracket?.groups) return;
    const advanceCount = bracket.advanceFromGroup || 1;
    const players = [];

    bracket.groups.forEach((group, groupIndex) => {
      const groupLetter = String.fromCharCode(65 + groupIndex);
      const standings = group.standings || [];
      if (standings.length > 0) {
        standings
          .filter(s => s.playerId)
          .sort((a, b) => {
            if ((b.points || 0) !== (a.points || 0)) return (b.points || 0) - (a.points || 0);
            return (b.totalPoints || 0) - (a.totalPoints || 0);
          })
          .slice(0, advanceCount)
          .forEach((s, rank) => players.push({
            id: s.playerId, name: s.playerName,
            partnerName: s.partnerName || null,
            group: groupLetter, rank: rank + 1, points: s.points
          }));
      } else {
        // Sort participants by points → diff → totalPoints before slicing
        [...(group.participants || [])]
          .sort((a, b) => {
            if ((b.points || 0) !== (a.points || 0)) return (b.points || 0) - (a.points || 0);
            const aDiff = (a.totalPoints || 0) - (a.totalPointsAgainst || 0);
            const bDiff = (b.totalPoints || 0) - (b.totalPointsAgainst || 0);
            if (bDiff !== aDiff) return bDiff - aDiff;
            return (b.totalPoints || 0) - (a.totalPoints || 0);
          })
          .slice(0, advanceCount)
          .forEach((p, i) => {
            if (p?.id) players.push({
              id: p.id, name: p.name,
              partnerName: p.partnerName || null,
              group: groupLetter, rank: i + 1, points: p.points || 0
            });
          });
      }
    });

    setAdvancingPlayers(players);

    const defaultSize = nextPow2(players.length);
    setBracketSize(defaultSize);

    // Build positions array, restoring existing KO draw if already seeded
    const pos = Array(defaultSize).fill(null);
    if (bracket.knockout?.rounds?.[0]?.matches) {
      bracket.knockout.rounds[0].matches.forEach((match, mi) => {
        const p1 = players.find(p => p.id === match.player1?.id);
        const p2 = players.find(p => p.id === match.player2?.id);
        if (p1) pos[mi * 2] = p1;
        if (p2) pos[mi * 2 + 1] = p2;
      });
    }
    setPositions(pos);
  }, [bracket]);

  // Tap a position slot
  const handlePositionClick = (posIdx) => {
    const occupant = positions[posIdx];

    if (pickedPlayer) {
      // A player is in hand — place them here
      const newPos = [...positions];
      // If this slot is occupied, put that player back in hand (swap)
      const displaced = newPos[posIdx];
      // Remove picked player from their old slot if they were already placed
      const oldIdx = newPos.findIndex(p => p?.id === pickedPlayer.id);
      if (oldIdx !== -1) newPos[oldIdx] = displaced || null;
      else if (displaced) {/* displaced goes back to pool — setPickedPlayer below handles it */}
      newPos[posIdx] = pickedPlayer;
      setPositions(newPos);
      // If we displaced someone, put them in hand; otherwise clear hand
      setPickedPlayer(displaced && displaced.id !== pickedPlayer.id ? displaced : null);
    } else if (occupant) {
      // No player in hand — pick up the occupant
      const newPos = [...positions];
      newPos[posIdx] = null;
      setPositions(newPos);
      setPickedPlayer(occupant);
    }
    // else: empty slot, no player in hand → ignore
  };

  // Tap a player chip in the pool
  const handlePoolPlayerClick = (player) => {
    if (pickedPlayer?.id === player.id) {
      setPickedPlayer(null); // deselect
    } else {
      setPickedPlayer(player);
    }
  };

  const handleSave = () => {
    const slots = [];
    for (let i = 0; i < positions.length; i += 2) {
      let p1 = positions[i];
      let p2 = positions[i + 1] || null;
      // If only p2 set (organiser placed in bottom of pair), treat as p1 (BYE logic needs p1)
      if (!p1 && p2) { p1 = p2; p2 = null; }
      if (!p1) {
        alert(`Match slot ${i / 2 + 1} has no player. Every bracket position pair must have at least one player.`);
        return;
      }
      slots.push({ matchNumber: i / 2 + 1, player1: p1, player2: p2 });
    }
    onSave(slots);
  };

  const assignedIds = new Set(positions.filter(Boolean).map(p => p.id));
  const poolPlayers = advancingPlayers.filter(p => !assignedIds.has(p.id));
  const filledCount = positions.filter(Boolean).length;
  const byeCount = (bracketSize || 0) - filledCount;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {/* Animated Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 right-10 w-96 h-96 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.5) 0%, rgba(245,158,11,0.3) 50%, transparent 70%)', animation: 'float 8s ease-in-out infinite, pulse 4s ease-in-out infinite' }} />
        <div className="absolute bottom-10 left-10 w-80 h-80 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.5) 0%, rgba(13,148,136,0.3) 50%, transparent 70%)', animation: 'float 10s ease-in-out infinite reverse, pulse 5s ease-in-out infinite', animationDelay: '2s' }} />
        {ARRANGE_PARTICLES.map((p, i) => (
          <div key={i} className="absolute rounded-full"
            style={{ width: `${p.w}px`, height: `${p.h}px`, left: `${p.x}%`, top: `${p.y}%`, background: p.c, opacity: p.o, animation: `float ${p.dur}s ease-in-out infinite`, animationDelay: `${p.delay}s`, boxShadow: `0 0 ${p.glow}px ${p.c}` }} />
        ))}
      </div>

      <div className="relative backdrop-blur-xl rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" style={{ background: '#0d1025', border: '2px solid rgba(245,158,11,0.2)' }}>
        {/* Header */}
        <div className="p-3 border-b border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 leading-tight">
                Arrange Knockout Draw
              </h2>
              <p className="text-gray-400 text-[10px] leading-tight mt-0.5">
                Tap a player → tap a bracket position to place them. Empty positions = BYE.
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white p-1.5 hover:bg-emerald-500/20 rounded-lg transition-all hover:scale-110">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="p-3 space-y-3">

          {/* Bracket Size Selector */}
          {bracketSize && (
            <div className="p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex gap-2 flex-wrap">
                  {[4, 8, 16, 32].filter(s => s >= advancingPlayers.length || s === 4).map(s => (
                    <button key={s} onClick={() => handleBracketSizeChange(s)}
                      className="px-3 py-1 rounded-lg text-[10px] font-bold transition-all"
                      style={{
                        background: bracketSize === s ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${bracketSize === s ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.12)'}`,
                        color: bracketSize === s ? '#F59E0B' : 'rgba(255,255,255,0.5)'
                      }}>
                      Round of {s}
                    </button>
                  ))}
                </div>
                <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {filledCount}/{bracketSize} placed · {byeCount > 0 ? `${byeCount} BYE${byeCount > 1 ? 's' : ''}` : 'no byes'}
                </span>
              </div>
            </div>
          )}

          {/* Player in hand banner */}
          {pickedPlayer && (
            <div className="p-2 rounded-xl flex items-center gap-2 animate-pulse"
              style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.4)' }}>
              <div className="w-2 h-2 rounded-full bg-[#F59E0B] flex-shrink-0" />
              <span className="text-[11px] font-bold text-white flex-1">
                {pickedPlayer.name}
                {pickedPlayer.partnerName ? ` / ${pickedPlayer.partnerName}` : ''}
                <span className="text-[#F59E0B] ml-1">(Pool {pickedPlayer.group} #{pickedPlayer.rank})</span>
              </span>
              <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.5)' }}>tap a slot →</span>
              <button onClick={() => setPickedPlayer(null)}
                className="text-gray-400 hover:text-white p-0.5 rounded transition-all flex-shrink-0">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Qualifying Players Pool */}
          <div>
            <h3 className="text-[10px] font-black icon-green mb-2 uppercase tracking-wider flex items-center gap-1.5">
              <Trophy className="w-3 h-3" />
              Qualifying Players ({advancingPlayers.length})
              {poolPlayers.length > 0 && (
                <span className="ml-1 text-[9px] font-normal" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  — {poolPlayers.length} not yet placed
                </span>
              )}
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {advancingPlayers.map(player => {
                const isPlaced = assignedIds.has(player.id);
                const isPicked = pickedPlayer?.id === player.id;
                return (
                  <button
                    key={player.id}
                    onClick={() => !isPlaced && handlePoolPlayerClick(player)}
                    disabled={isPlaced}
                    className="px-2 py-1.5 rounded-lg text-left transition-all"
                    style={{
                      background: isPicked
                        ? 'rgba(245,158,11,0.2)'
                        : isPlaced
                          ? 'rgba(255,255,255,0.03)'
                          : 'rgba(255,255,255,0.07)',
                      border: `1px solid ${isPicked ? 'rgba(245,158,11,0.7)' : isPlaced ? 'rgba(255,255,255,0.06)' : 'rgba(245,158,11,0.25)'}`,
                      opacity: isPlaced ? 0.35 : 1,
                      cursor: isPlaced ? 'default' : 'pointer',
                      transform: isPicked ? 'scale(1.04)' : 'scale(1)',
                      boxShadow: isPicked ? '0 0 10px rgba(245,158,11,0.3)' : 'none'
                    }}>
                    <div className="text-[10px] font-bold text-white leading-tight">
                      {player.name}{player.partnerName ? ` / ${player.partnerName}` : ''}
                    </div>
                    <div className="text-[8px] flex items-center gap-1 mt-0.5">
                      <span className="px-1 rounded font-bold" style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>
                        Pool {player.group}
                      </span>
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>#{player.rank}</span>
                      {isPlaced && <span style={{ color: 'rgba(245,158,11,0.6)' }}>✓</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bracket Positions — pairs = first-round matches */}
          <div>
            <h3 className="text-[10px] font-black icon-green mb-2 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3 h-3" />
              Bracket Positions
              <span className="text-[9px] font-normal ml-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                each pair is one first-round match
              </span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {positions.length > 0 && Array.from({ length: positions.length / 2 }, (_, mi) => {
                const p1 = positions[mi * 2];
                const p2 = positions[mi * 2 + 1];
                const isBye = p1 && !p2;
                return (
                  <div key={mi}
                    className="rounded-xl overflow-hidden"
                    style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                    {/* Match label */}
                    <div className="px-2 py-1 flex items-center justify-between"
                      style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: 'rgba(245,158,11,0.7)' }}>
                        Match {mi + 1}
                      </span>
                      {isBye && (
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded"
                          style={{ background: 'rgba(255,193,7,0.15)', color: 'rgba(255,193,7,0.8)', border: '1px solid rgba(255,193,7,0.3)' }}>
                          BYE
                        </span>
                      )}
                    </div>
                    {/* Two position slots */}
                    <div className="p-1.5 space-y-1">
                      {[0, 1].map(offset => {
                        const posIdx = mi * 2 + offset;
                        const player = positions[posIdx];
                        const isPicked = pickedPlayer?.id === player?.id;
                        const isTargetable = !!pickedPlayer && !isPicked;
                        return (
                          <button
                            key={offset}
                            onClick={() => handlePositionClick(posIdx)}
                            className="w-full rounded-lg p-2 text-left transition-all"
                            style={{
                              background: player
                                ? isPicked
                                  ? 'rgba(245,158,11,0.15)'
                                  : 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.1))'
                                : isTargetable
                                  ? 'rgba(245,158,11,0.06)'
                                  : 'rgba(255,255,255,0.03)',
                              border: `1px solid ${
                                player
                                  ? isPicked ? 'rgba(245,158,11,0.6)' : 'rgba(245,158,11,0.3)'
                                  : isTargetable ? 'rgba(245,158,11,0.35)' : 'rgba(255,255,255,0.08)'
                              }`,
                              cursor: 'pointer'
                            }}>
                            {player ? (
                              <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[9px] font-black"
                                  style={{ background: 'rgba(245,158,11,0.2)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.4)' }}>
                                  {posIdx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-[11px] font-bold text-white leading-tight truncate">
                                    {player.name}{player.partnerName ? ` / ${player.partnerName}` : ''}
                                  </div>
                                  <div className="text-[8px] flex items-center gap-1 mt-0.5">
                                    <span style={{ color: 'rgba(245,158,11,0.7)' }}>Pool {player.group}</span>
                                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>#{player.rank} · {player.points}pts</span>
                                  </div>
                                </div>
                                <X className="w-3 h-3 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }} />
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[9px] font-bold"
                                  style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)', border: '1px dashed rgba(255,255,255,0.15)' }}>
                                  {posIdx + 1}
                                </div>
                                <span className="text-[10px]"
                                  style={{ color: isTargetable ? 'rgba(245,158,11,0.6)' : 'rgba(255,255,255,0.2)' }}>
                                  {isTargetable ? `Place ${pickedPlayer.name.split('/')[0].trim()} here` : 'Empty — BYE'}
                                </span>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 border-t border-emerald-500/20 flex gap-2 bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-emerald-500/5">
          <button onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all text-[11px] font-bold shadow-lg">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 px-4 py-2 btn-brand rounded-lg transition-all disabled:opacity-50 text-[11px] font-bold">
            {saving ? 'Saving...' : `Save Draw${byeCount > 0 ? ` (${byeCount} BYE${byeCount > 1 ? 's' : ''})` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// UmpireQueueModal
// Organizer picks umpire → adds matches in play order → saves queue.
// Calls PUT /api/matches/tournament/:tournamentId/umpire-queue (no new API).
// ─────────────────────────────────────────────────────────────────────────────
const UmpireQueueModal = ({ tournamentId, umpires, onClose }) => {
  const [allMatches, setAllMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [selectedUmpireId, setSelectedUmpireId] = useState(umpires[0]?.id || null);
  const [queues, setQueues] = useState({}); // { [umpireId]: string[] }
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null); // { type:'success'|'error', text:string }

  useEffect(() => {
    (async () => {
      try {
        const data = await getTournamentAllMatches(tournamentId);
        const matches = data.matches || [];
        setAllMatches(matches);
        // Pre-populate from existing queueOrder in DB
        const initial = {};
        umpires.forEach(u => {
          const assigned = matches
            .filter(m => m.umpireId === u.id && m.queueOrder != null)
            .sort((a, b) => (a.queueOrder || 0) - (b.queueOrder || 0));
          initial[u.id] = assigned.map(m => m.id);
        });
        setQueues(initial);
      } catch (err) {
        console.error('UmpireQueueModal load error:', err);
      } finally {
        setLoadingMatches(false);
      }
    })();
  }, [tournamentId]);

  const currentQueue = queues[selectedUmpireId] || [];
  const allQueuedIds = new Set(Object.values(queues).flat());
  const available = allMatches.filter(m => m.status !== 'COMPLETED' && !allQueuedIds.has(m.id));

  const addToQueue   = (id) => setQueues(p => ({ ...p, [selectedUmpireId]: [...(p[selectedUmpireId] || []), id] }));
  const removeFromQueue = (id) => setQueues(p => ({ ...p, [selectedUmpireId]: (p[selectedUmpireId] || []).filter(x => x !== id) }));

  const moveUp = (i) => {
    if (i === 0) return;
    const q = [...currentQueue]; [q[i - 1], q[i]] = [q[i], q[i - 1]];
    setQueues(p => ({ ...p, [selectedUmpireId]: q }));
  };
  const moveDown = (i) => {
    if (i === currentQueue.length - 1) return;
    const q = [...currentQueue]; [q[i], q[i + 1]] = [q[i + 1], q[i]];
    setQueues(p => ({ ...p, [selectedUmpireId]: q }));
  };

  const getMatchLabel = (matchId) => {
    const m = allMatches.find(x => x.id === matchId);
    if (!m) return `Match …${matchId.slice(-4)}`;
    const p1 = m.player1?.name || 'TBD';
    const p2 = m.player2?.name || 'TBD';
    const cat = m.category?.name ? ` [${m.category.name}]` : '';
    return `M${m.matchNumber} · ${p1} vs ${p2}${cat}`;
  };

  const saveQueue = async () => {
    if (!selectedUmpireId) return;
    setSaving(true); setSaveMsg(null);
    try {
      await api.put(`/matches/tournament/${tournamentId}/umpire-queue`, {
        umpireId: selectedUmpireId,
        matchIds: currentQueue
      });
      setSaveMsg({ type: 'success', text: `Saved — ${currentQueue.length} match${currentQueue.length !== 1 ? 'es' : ''} queued` });
      setTimeout(() => setSaveMsg(null), 4000);
    } catch (err) {
      setSaveMsg({ type: 'error', text: err.response?.data?.error || 'Failed to save queue' });
    } finally {
      setSaving(false);
    }
  };

  const selectedUmpire = umpires.find(u => u.id === selectedUmpireId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3"
      style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden flex flex-col"
        style={{ background: '#0a0f1e', border: '1.5px solid rgba(96,165,250,0.3)', maxHeight: '90vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ background: 'rgba(96,165,250,0.08)', borderBottom: '1px solid rgba(96,165,250,0.18)' }}>
          <div className="flex items-center gap-3">
            <ListOrdered className="w-5 h-5" style={{ color: '#60a5fa' }} />
            <div>
              <h2 className="text-base font-black text-white">Umpire Queues</h2>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Assign matches in play order per umpire</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-white/10">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Umpire selector tabs */}
        <div className="flex gap-2 px-4 pt-3 pb-2 flex-wrap"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          {umpires.map(u => {
            const qLen = (queues[u.id] || []).length;
            return (
              <button key={u.id} onClick={() => setSelectedUmpireId(u.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                style={selectedUmpireId === u.id
                  ? { background: 'rgba(96,165,250,0.2)', border: '1.5px solid rgba(96,165,250,0.5)', color: '#60a5fa' }
                  : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.55)' }}>
                {u.name}
                {qLen > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black"
                    style={{ background: 'rgba(96,165,250,0.3)', color: '#93c5fd' }}>{qLen}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loadingMatches ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-6 h-6 animate-spin" style={{ color: '#60a5fa' }} />
            </div>
          ) : (
            <>
              {/* Queue for selected umpire */}
              <div>
                <p className="text-xs font-black mb-2"
                  style={{ color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em' }}>
                  {selectedUmpire?.name?.toUpperCase()}'S QUEUE ({currentQueue.length})
                </p>
                {currentQueue.length === 0 ? (
                  <div className="rounded-xl py-6 text-center text-xs"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.35)' }}>
                    Empty — tap matches below to add
                  </div>
                ) : (
                  <div className="space-y-2">
                    {currentQueue.map((matchId, index) => (
                      <div key={matchId}
                        className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                        style={{ background: 'rgba(96,165,250,0.07)', border: '1px solid rgba(96,165,250,0.2)' }}>
                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0"
                          style={{ background: 'rgba(96,165,250,0.25)', color: '#93c5fd' }}>{index + 1}</span>
                        <span className="flex-1 text-xs font-semibold text-white truncate">{getMatchLabel(matchId)}</span>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => moveUp(index)} disabled={index === 0}
                            className="w-6 h-6 rounded flex items-center justify-center disabled:opacity-30"
                            style={{ background: 'rgba(255,255,255,0.07)' }}>
                            <ChevronUp className="w-3.5 h-3.5 text-white" />
                          </button>
                          <button onClick={() => moveDown(index)} disabled={index === currentQueue.length - 1}
                            className="w-6 h-6 rounded flex items-center justify-center disabled:opacity-30"
                            style={{ background: 'rgba(255,255,255,0.07)' }}>
                            <ChevronDown className="w-3.5 h-3.5 text-white" />
                          </button>
                          <button onClick={() => removeFromQueue(matchId)}
                            className="w-6 h-6 rounded flex items-center justify-center hover:bg-red-500/20"
                            style={{ background: 'rgba(255,255,255,0.07)' }}>
                            <X className="w-3 h-3" style={{ color: '#f87171' }} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Available matches */}
              <div>
                <p className="text-xs font-black mb-2"
                  style={{ color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em' }}>
                  AVAILABLE MATCHES ({available.length})
                </p>
                {available.length === 0 ? (
                  <div className="rounded-xl py-4 text-center text-xs"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' }}>
                    All matches assigned
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {available.map(m => {
                      const p1 = m.player1?.name || 'TBD';
                      const p2 = m.player2?.name || 'TBD';
                      const cat = m.category?.name ? ` [${m.category.name}]` : '';
                      return (
                        <button key={m.id} onClick={() => addToQueue(m.id)}
                          className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-left transition-all hover:scale-[1.01]"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                          <Plus className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#60a5fa' }} />
                          <span className="flex-1 text-xs font-semibold truncate" style={{ color: 'rgba(255,255,255,0.8)' }}>
                            M{m.matchNumber} · {p1} vs {p2}{cat}
                          </span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)' }}>
                            {m.status}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Save feedback */}
        {saveMsg && (
          <div className="mx-4 mb-2 px-3 py-2 rounded-lg text-xs font-bold"
            style={saveMsg.type === 'success'
              ? { background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)', color: '#4ade80' }
              : { background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171' }}>
            {saveMsg.text}
          </div>
        )}

        {/* Footer */}
        <div className="flex gap-2 p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-xs font-black transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
            Close
          </button>
          <button onClick={saveQueue} disabled={saving || !selectedUmpireId}
            className="flex-1 py-2.5 rounded-xl text-xs font-black transition-all disabled:opacity-50"
            style={{ background: 'rgba(96,165,250,0.2)', color: '#60a5fa', border: '1.5px solid rgba(96,165,250,0.4)' }}>
            {saving ? 'Saving...' : `Save ${selectedUmpire?.name?.split(' ')[0] || ''}'s Queue`}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// InlineAddUmpire
// Shown inside AssignUmpireModal when no umpires exist yet.
// Lets organizer add an umpire by code without leaving the modal.
// ─────────────────────────────────────────────────────────────────────────────
const InlineAddUmpire = ({ tournamentId, onUmpireAdded }) => {
  const [code, setCode] = useState('');
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState(null); // { type:'success'|'error', text }

  const handleAdd = async () => {
    const trimmed = code.trim();
    if (!trimmed || trimmed === '#') return;
    setAdding(true);
    setMsg(null);
    try {
      const res = await tournamentAPI.addUmpireByCode(tournamentId, trimmed);
      const newUmpire = res.umpire;
      setMsg({ type: 'success', text: `${newUmpire.name} added!` });
      setCode('');
      onUmpireAdded?.(newUmpire);
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Failed to add umpire' });
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="py-4 space-y-3">
      <div className="text-center mb-2">
        <Gavel className="w-8 h-8 mx-auto mb-2" style={{ color: 'rgba(255,255,255,0.2)' }} />
        <p className="text-sm font-black text-white">No umpires added yet</p>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Enter an umpire's Matchify.pro ID to add them
        </p>
      </div>

      {/* Code hint */}
      <div className="px-3 py-2 rounded-xl text-xs"
        style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', color: 'rgba(245,158,11,0.8)' }}>
        Umpire shares their code: <span className="font-mono font-black" style={{ color: '#FCD34D' }}>#42</span> or <span className="font-mono font-black" style={{ color: '#FCD34D' }}>#100</span>
      </div>

      {/* Input + button */}
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={e => setCode(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="#ID or code"
          className="flex-1 px-3 py-2.5 rounded-xl text-sm font-bold outline-none"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' }}
        />
        <button
          onClick={handleAdd}
          disabled={adding || !code.trim() || code.trim() === '#'}
          className="px-4 py-2.5 rounded-xl text-xs font-black transition-all disabled:opacity-40"
          style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.35)', color: '#FCD34D' }}>
          {adding ? <Loader className="w-4 h-4 animate-spin" /> : 'Add'}
        </button>
      </div>

      {/* Feedback */}
      {msg && (
        <p className="text-xs font-bold px-1"
          style={{ color: msg.type === 'success' ? '#4ade80' : '#f87171' }}>
          {msg.text}
        </p>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ManageUmpiresModal
// Full umpire management — view, add, remove — without leaving DrawPage.
// ─────────────────────────────────────────────────────────────────────────────
const ManageUmpiresModal = ({ tournamentId, umpires, onUmpiresChange, onClose }) => {
  const [code, setCode] = useState('');
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState(null); // umpireId being removed
  const [msg, setMsg] = useState(null); // { type:'success'|'error', text }

  const handleAdd = async () => {
    const trimmed = code.trim();
    if (!trimmed) return;
    setAdding(true);
    setMsg(null);
    try {
      // UI shows permanent # prefix — user types number only, prepend # for API
      const res = await tournamentAPI.addUmpireByCode(tournamentId, `#${trimmed}`);
      const newUmpire = res.umpire;
      onUmpiresChange([...umpires, newUmpire]);
      setCode('');
      setMsg({ type: 'success', text: `${newUmpire.name} added successfully` });
      setTimeout(() => setMsg(null), 3000);
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Failed to add umpire' });
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (umpireId) => {
    setRemoving(umpireId);
    setMsg(null);
    try {
      await tournamentAPI.removeUmpire(tournamentId, umpireId);
      onUmpiresChange(umpires.filter(u => u.id !== umpireId));
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Failed to remove umpire' });
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3"
      style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden flex flex-col"
        style={{ background: '#0a0f1e', border: '1.5px solid rgba(96,165,250,0.3)', maxHeight: '85vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ background: 'rgba(96,165,250,0.08)', borderBottom: '1px solid rgba(96,165,250,0.18)' }}>
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5" style={{ color: '#60a5fa' }} />
            <div>
              <h2 className="text-base font-black text-white">Manage Umpires</h2>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Umpires added here are assigned to the <span style={{color:'#60a5fa',fontWeight:700}}>entire tournament</span></p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-white/10">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* Add umpire */}
          <div className="space-y-2">
            <p className="text-xs font-black" style={{ color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em' }}>
              ADD UMPIRE
            </p>
            <div className="px-3 py-2 rounded-xl text-xs"
              style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', color: 'rgba(245,158,11,0.8)' }}>
              Ask umpire to share their Matchify.pro ID (e.g. <span className="font-mono font-black" style={{ color: '#FCD34D' }}>#42</span>). Found on their profile/dashboard.
            </div>
            <div className="flex gap-2">
              {/* # prefix + input field */}
              <div className="flex-1 flex items-center rounded-xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.18)' }}>
                <span className="pl-3 pr-1 text-sm font-black select-none"
                  style={{ color: '#FCD34D' }}>#</span>
                <input
                  type="text"
                  value={code}
                  onChange={e => {
                    // strip any leading # the user might type
                    const v = e.target.value.replace(/^#+/, '');
                    setCode(v);
                  }}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  placeholder="ID or umpire code"
                  className="flex-1 pr-3 py-2.5 text-sm font-bold outline-none bg-transparent"
                  style={{ color: '#fff' }}
                />
              </div>
              <button
                onClick={handleAdd}
                disabled={adding || !code.trim()}
                className="px-4 py-2.5 rounded-xl text-xs font-black transition-all disabled:opacity-40 flex items-center gap-1.5"
                style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.35)', color: '#FCD34D' }}>
                {adding ? <Loader className="w-4 h-4 animate-spin" /> : <><Plus className="w-3.5 h-3.5" />Add</>}
              </button>
            </div>
            {msg && (
              <p className="text-xs font-bold px-1"
                style={{ color: msg.type === 'success' ? '#4ade80' : '#f87171' }}>
                {msg.text}
              </p>
            )}
          </div>

          {/* Current umpires */}
          <div className="space-y-2">
            <p className="text-xs font-black" style={{ color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em' }}>
              CURRENT UMPIRES ({umpires.length})
            </p>
            {umpires.length === 0 ? (
              <div className="rounded-xl py-6 text-center text-xs"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' }}>
                No umpires added yet
              </div>
            ) : (
              <div className="space-y-2">
                {umpires.map(u => (
                  <div key={u.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                      style={{ background: 'rgba(96,165,250,0.15)', color: '#60a5fa' }}>
                      {u.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold text-white truncate">{u.name}</p>
                        {u.id && <span className="text-xs font-mono font-black flex-shrink-0" style={{ color: '#FCD34D' }}>#{u.id}</span>}
                      </div>
                      <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{u.email}</p>
                    </div>
                    <button
                      onClick={() => handleRemove(u.id)}
                      disabled={removing === u.id}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-40 hover:bg-red-500/20 flex-shrink-0"
                      style={{ background: 'rgba(255,255,255,0.06)' }}>
                      {removing === u.id
                        ? <Loader className="w-3.5 h-3.5 animate-spin" style={{ color: '#f87171' }} />
                        : <X className="w-3.5 h-3.5" style={{ color: '#f87171' }} />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <button onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-black transition-all"
            style={{ background: 'rgba(96,165,250,0.1)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.25)' }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

