import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  MapPinIcon,
  CalendarIcon,
  UserGroupIcon,
  XMarkIcon,
  TrophyIcon,
  ArrowRightIcon,
  SparklesIcon,
  ClockIcon,
  CurrencyRupeeIcon,
  ShareIcon
} from '@heroicons/react/24/outline';
import { Loader, GitBranch } from 'lucide-react';
import { tournamentAPI } from '../api/tournament';
import { formatDateIndian } from '../utils/dateFormat';
import { buildShareMessage, shareTournament as doShareTournament } from '../utils/tournamentShare';
import Spinner from '../components/Spinner';



export default function TournamentDiscoveryPage() {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const observerTarget = useRef(null);
  
  const [activeTab, setActiveTab] = useState('upcoming');
  const [tabCounts, setTabCounts] = useState({ upcoming: 0, completed: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    city: '',
    state: '',
    zone: '',
    status: '',
    format: '',
    startDate: '',
    endDate: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [fetchTrigger, setFetchTrigger] = useState(0);

  // Tab result cache — instant switch, background refresh
  const tabCache = useRef({ upcoming: null, completed: null });

  // Fetch tab counts once on mount
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [upRes, comRes] = await Promise.all([
          tournamentAPI.getTournaments({ page: '1', limit: '1', tab: 'upcoming' }),
          tournamentAPI.getTournaments({ page: '1', limit: '1', tab: 'completed' }),
        ]);
        setTabCounts({
          upcoming: upRes.data?.pagination?.total || 0,
          completed: comRes.data?.pagination?.total || 0,
        });
      } catch (err) {
        console.error('Tab counts failed to load:', err?.message);
      }
    };
    fetchCounts();
  }, []);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, loading]);

  useEffect(() => {
    fetchTournaments();
  }, [page, fetchTrigger]);

  useEffect(() => {
    // If filters/search active, clear this tab's cache so filtered results don't persist
    const hasActiveFilterOrSearch = searchQuery || Object.values(filters).some(Boolean);
    if (hasActiveFilterOrSearch) {
      tabCache.current[activeTab] = null;
    }

    // On tab switch: restore cached results instantly (no spinner) then background-refresh.
    const cached = tabCache.current[activeTab];
    if (cached && cached.tournaments.length > 0) {
      // Show cached data immediately — no loading flash
      setTournaments(cached.tournaments);
      setTotal(cached.total);
      setHasMore(cached.hasMore);
    } else {
      setTournaments([]);
      setHasMore(true);
    }
    if (page !== 1) {
      setPage(1);
    } else {
      setFetchTrigger(t => t + 1);
    }
  }, [filters, searchQuery, activeTab]);

  const fetchTournaments = async () => {
    if (!hasMore && page > 1) return;

    // Only show loading spinner if no cached data is already displayed
    const hasCachedDisplay = page === 1 && tabCache.current[activeTab]?.tournaments?.length > 0;
    if (!hasCachedDisplay) setLoading(true);

    try {
      const params = { page: page.toString(), limit: '10' };
      Object.keys(filters).forEach(key => {
        if (filters[key]) params[key] = filters[key];
      });
      if (searchQuery) params.search = searchQuery;
      params.tab = activeTab;

      const response = await tournamentAPI.getTournaments(params);
      const newTournaments = response.data?.tournaments || [];
      const newTotal = response.data?.pagination?.total || 0;
      const newHasMore = newTournaments.length === 10;

      if (page === 1) {
        setTournaments(newTournaments);
        setTotal(newTotal);
        setHasMore(newHasMore);
        // Update cache for this tab (only page-1 results, no filter/search state)
        const noFilters = !searchQuery && !Object.values(filters).some(Boolean);
        if (noFilters) {
          tabCache.current[activeTab] = { tournaments: newTournaments, total: newTotal, hasMore: newHasMore };
        }
      } else {
        setTournaments(prev => [...prev, ...newTournaments]);
        setTotal(newTotal);
        setHasMore(newHasMore);
      }
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      if (page === 1) {
        setTournaments([]);
      }
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setTournaments([]);
    setHasMore(true);
    if (page !== 1) {
      setPage(1);
    } else {
      setFetchTrigger(t => t + 1);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ city: '', state: '', zone: '', status: '', format: '', startDate: '', endDate: '' });
    setSearchQuery('');
  };

  const hasActiveFilters = Object.values(filters).some(v => v) || searchQuery;

  return (
    <div className="min-h-screen relative overflow-hidden pb-6" style={{
      background: '#050810',
      backgroundImage: 'url(/bg-galaxy.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center top',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
    }}>
      {/* Dark overlay */}
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'rgba(5,8,16,0.72)', zIndex: 0 }} />
      {/* Static blobs */}
      <div className="fixed pointer-events-none" style={{ top:'8%', right:'-8%', width:'300px', height:'300px', borderRadius:'50%', background:'radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 70%)', zIndex:0 }} />
      <div className="fixed pointer-events-none" style={{ bottom:'20%', left:'-6%', width:'260px', height:'260px', borderRadius:'50%', background:'radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)', zIndex:0 }} />

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>

      {/* Hero Header - Compact Mobile-First with Back Button */}
      <div className="relative z-10 pt-4">
        <div className="relative max-w-7xl mx-auto px-4 py-3">
          {/* Back Button */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 mb-3 text-white/70 hover:text-white transition-colors group"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-sm font-semibold">Back</span>
          </button>

          <div className="text-center">
            <div 
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-2 relative overflow-hidden"
              style={{
                background: 'rgba(245,158,11,0.1)',
                border: '1px solid rgba(245,158,11,0.35)',
                color: '#fbbf24'
              }}
            >
              <SparklesIcon className="w-3.5 h-3.5" />
              Find Your Next Competition
            </div>
            <h1 className="text-2xl sm:text-3xl font-black mb-2 text-white">
              Discover Tournaments
            </h1>
            <p className="text-xs sm:text-sm text-white/70 max-w-2xl mx-auto font-medium mb-3">
              Find and register for badminton tournaments near you
            </p>

            {/* Quick Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <button
                onClick={() => navigate('/tournaments/create')}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-bold text-sm transition-all relative overflow-hidden group"
                style={{
                  background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                  color: '#ffffff',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                }}
              >
                <div 
                  className="absolute inset-0 opacity-0 group-active:opacity-100 transition-opacity"
                  style={{ background: 'radial-gradient(circle at center, rgba(255,255,255,0.3), transparent)' }}
                />
                <svg className="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="relative z-10">Create Tournament</span>
              </button>
              
              <button
                onClick={() => navigate('/dashboard')}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-bold text-sm transition-all"
                style={{
                  background: 'rgba(168,85,247,0.1)',
                  border: '1px solid rgba(168,85,247,0.35)',
                  color: '#c4b5fd',
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>My Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-4">
        {/* Search Card - Compact */}
        <div 
          className="rounded-2xl p-4 mb-4 relative overflow-hidden"
          style={{
            background: 'linear-gradient(160deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.06) 100%)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
          }}
        >
          <form onSubmit={handleSearch} className="flex flex-col gap-3">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
              <input
                type="text"
                placeholder="Search tournaments by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-white text-sm placeholder-gray-400 font-medium"
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.12)'
                }}
              />
            </div>
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="flex-1 px-4 py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all relative overflow-hidden"
                style={
                  showFilters 
                    ? {
                        background: 'linear-gradient(135deg, #a855f7, #8b5cf6)',
                        color: '#ffffff',
                      }
                    : {
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#ffffff'
                      }
                }
              >
                <FunnelIcon className="h-4 w-4" />
                <span>Filters</span>
                {hasActiveFilters && (
                  <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></span>
                )}
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 rounded-xl font-bold text-sm transition-all relative overflow-hidden group"
                style={{
                  background: 'linear-gradient(135deg, #a855f7, #8b5cf6)',
                  color: '#ffffff',
                }}
              >
                <div 
                  className="absolute inset-0 opacity-0 group-active:opacity-100 transition-opacity"
                  style={{ background: 'radial-gradient(circle at center, rgba(255,255,255,0.3), transparent)' }}
                />
                <span className="relative z-10">Search</span>
              </button>
            </div>
          </form>

          {/* Filters Panel - Compact */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-white text-sm">Filter Options</h3>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs flex items-center gap-1 font-bold transition-colors" style={{ color: '#F59E0B' }}
                  >
                    <XMarkIcon className="h-3.5 w-3.5" />
                    Clear All
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>City</label>
                  <input
                    type="text"
                    value={filters.city}
                    onChange={(e) => handleFilterChange('city', e.target.value)}
                    placeholder="Any city"
                    className="w-full px-3 py-2.5 text-sm rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-white placeholder-gray-500 font-medium"
                    style={{
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.12)'
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-purple-400 mb-1.5">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-white font-medium"
                    style={{
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.12)'
                    }}
                  >
                    <option value="">All Statuses</option>
                    <option value="published">Open for Registration</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-cyan-400 mb-1.5">Format</label>
                  <select
                    value={filters.format}
                    onChange={(e) => handleFilterChange('format', e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all text-white font-medium"
                    style={{
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.12)'
                    }}
                  >
                    <option value="">All Formats</option>
                    <option value="singles">Singles Only</option>
                    <option value="doubles">Doubles Only</option>
                    <option value="both">Both</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-orange-400 mb-1.5">From Date</label>
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => handleFilterChange('startDate', e.target.value)}
                      className="w-full px-3 py-2.5 text-sm rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-white font-medium"
                      style={{
                        background: 'rgba(0,0,0,0.3)',
                        border: '1.5px solid rgba(245,158,11,0.3)'
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-orange-400 mb-1.5">To Date</label>
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => handleFilterChange('endDate', e.target.value)}
                      className="w-full px-3 py-2.5 text-sm rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-white font-medium"
                      style={{
                        background: 'rgba(0,0,0,0.3)',
                        border: '1.5px solid rgba(245,158,11,0.3)'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tab Toggle - Upcoming / Completed */}
        <div className="flex mb-5 rounded-2xl p-1" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            onClick={() => setActiveTab('upcoming')}
            className="flex-1 py-2.5 text-sm font-black transition-all rounded-xl flex items-center justify-center gap-1.5"
            style={{
              background: activeTab === 'upcoming' ? 'rgba(255,255,255,0.1)' : 'transparent',
              color: activeTab === 'upcoming' ? '#ffffff' : 'rgba(255,255,255,0.45)',
              boxShadow: activeTab === 'upcoming' ? 'inset 0 1px 0 rgba(255,255,255,0.08)' : 'none',
            }}
          >
            <span>🏸</span>
            <span>Upcoming</span>
            {tabCounts.upcoming > 0 && <span style={{ fontSize: '11px', fontWeight: 700, background: activeTab === 'upcoming' ? 'rgba(245,158,11,0.25)' : 'rgba(255,255,255,0.08)', color: activeTab === 'upcoming' ? '#FCD34D' : 'rgba(255,255,255,0.4)', borderRadius: '999px', padding: '1px 7px' }}>{tabCounts.upcoming}</span>}
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className="flex-1 py-2.5 text-sm font-black transition-all rounded-xl flex items-center justify-center gap-1.5"
            style={{
              background: activeTab === 'completed' ? 'rgba(255,255,255,0.1)' : 'transparent',
              color: activeTab === 'completed' ? '#ffffff' : 'rgba(255,255,255,0.45)',
              boxShadow: activeTab === 'completed' ? 'inset 0 1px 0 rgba(255,255,255,0.08)' : 'none',
            }}
          >
            <span>🏆</span>
            <span>Completed</span>
            {tabCounts.completed > 0 && <span style={{ fontSize: '11px', fontWeight: 700, background: activeTab === 'completed' ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.08)', color: activeTab === 'completed' ? '#C084FC' : 'rgba(255,255,255,0.4)', borderRadius: '999px', padding: '1px 7px' }}>{tabCounts.completed}</span>}
          </button>
        </div>

        {/* Results Count - Compact */}
        {!loading && (
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold" style={{ color: '#F59E0B' }}>
              Found <span className="text-white">{total}</span> tournament{total !== 1 ? 's' : ''}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs font-bold transition-colors"
                style={{ color: '#F59E0B' }}
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Tournament Grid - Infinite Scroll */}
        {loading && page === 1 ? (
          <div 
            className="rounded-2xl p-8 sm:p-16 text-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(160deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(20px)'
            }}
          >
            <Spinner size="xl" className="mx-auto" />
            <p className="text-white/70 mt-6 font-bold">Loading tournaments...</p>
          </div>
        ) : tournaments.length === 0 ? (
          <div 
            className="rounded-2xl p-8 sm:p-16 text-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(160deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(20px)'
            }}
          >
            <div 
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex items-center justify-center mx-auto mb-6"
              style={{
                background: 'rgba(245,158,11,0.1)',
                border: '1px solid rgba(245,158,11,0.25)'
              }}
            >
              <TrophyIcon className="w-10 h-10 sm:w-12 sm:h-12" style={{ color: '#F59E0B' }} />
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white mb-2">No tournaments found</h3>
            <p className="text-sm sm:text-base text-white/60 mb-6 font-medium">Try adjusting your filters or check back later</p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-6 py-3 rounded-xl font-bold transition-all"
                style={{
                  background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                  color: '#ffffff',
                }}
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4">
              {tournaments.map((tournament, index) => (
                <TournamentCard key={tournament.id} tournament={tournament} navigate={navigate} index={index} />
              ))}
            </div>

            {/* Infinite Scroll Loading Indicator */}
            <div ref={observerTarget} className="py-8 text-center">
              {loading && page > 1 && (
                <div className="flex flex-col items-center gap-3">
                  <Spinner size="lg" />
                  <p className="text-white/70 font-bold text-sm">Loading more tournaments...</p>
                </div>
              )}
              {!loading && !hasMore && tournaments.length > 0 && (
                <div className="flex flex-col items-center gap-2">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{
                      background: 'rgba(245,158,11,0.1)',
                      border: '1px solid rgba(245,158,11,0.25)'
                    }}
                  >
                    <SparklesIcon className="w-5 h-5" style={{ color: '#F59E0B' }} />
                  </div>
                  <p className="text-white/60 font-bold text-sm">You've reached the end!</p>
                  <p className="text-white/40 text-xs">That's all the tournaments for now</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}


// ── Share helpers re-exported from utility ───────────────────────────────────
async function shareTournament(tournament, e) {
  e?.stopPropagation();
  return doShareTournament(tournament);
}

// Tournament Card Component - Event Poster Style
function TournamentCard({ tournament, navigate, index }) {
  const getStatusStyle = (status) => {
    const styles = {
      published: { bg: 'rgba(16,185,129,0.9)', text: 'Open', color: '#ffffff', shadow: '0 2px 8px rgba(16,185,129,0.5)' },
      ongoing:   { bg: 'rgba(239,68,68,0.9)',  text: '● Live', color: '#ffffff', shadow: '0 2px 8px rgba(239,68,68,0.5)' },
      completed: { bg: 'rgba(100,116,139,0.9)', text: 'Ended', color: '#ffffff', shadow: 'none' },
      cancelled: { bg: 'rgba(239,68,68,0.85)',  text: 'Cancelled', color: '#ffffff', shadow: 'none' },
      draft:     { bg: 'rgba(245,158,11,0.9)',  text: 'Draft', color: '#0C0900', shadow: '0 2px 8px rgba(245,158,11,0.4)' }
    };
    return styles[status?.toLowerCase()] || styles.draft;
  };

  const accentPairs = [
    ['#F59E0B','rgba(245,158,11,0.2)'],   // gold
    ['#F59E0B','rgba(245,158,11,0.18)'],   // cyan
    ['#8B5CF6','rgba(139,92,246,0.18)'],  // purple
    ['#10B981','rgba(16,185,129,0.18)'],  // emerald
    ['#EC4899','rgba(236,72,153,0.18)'],  // pink
    ['#F59E0B','rgba(245,158,11,0.18)'],  // gold repeat
  ];
  const [accentColor, accentGlow] = accentPairs[index % accentPairs.length];

  const [shareState, setShareState] = useState('idle'); // idle | shared

  const handleShare = async (e) => {
    e.stopPropagation();
    await shareTournament(tournament, e);
  };

  const statusStyle = getStatusStyle(tournament.status);
  const hasPoster = tournament.posters && tournament.posters.length > 0 && tournament.posters[0]?.imageUrl;

  const getPosterUrl = () => {
    if (!hasPoster) return null;
    const url = tournament.posters[0].imageUrl;
    if (url.startsWith('/uploads')) {
      const base = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://matchify-backend-production-cb58.up.railway.app';
      return `${base}${url}`;
    }
    return url;
  };
  const posterUrl = getPosterUrl();

  // Days to start
  const daysLeft = tournament.daysUntilStart ?? Math.ceil((new Date(tournament.startDate) - new Date()) / (1000*60*60*24));

  // Category tags — names only, no money
  const catTags = tournament.categories?.slice(0, 5).map(c => c.name) || [];
  const isRegistrationOpen = tournament.isRegistrationOpen ?? true;

  return (
    <div
      className="group relative overflow-hidden cursor-pointer rounded-2xl transition-all duration-300 hover:scale-[1.005] hover:shadow-2xl"
      onClick={() => navigate(`/tournaments/${tournament.id}`)}
      style={{
        background: 'linear-gradient(145deg, #0D1420 0%, #0A0F1A 100%)',
        border: `1px solid rgba(255,255,255,0.08)`,
        boxShadow: `0 4px 24px rgba(0,0,0,0.5)`,
        transition: 'all 0.25s ease',
      }}
    >
      {/* Shine sweep on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `linear-gradient(115deg, transparent 30%, ${accentGlow} 50%, transparent 70%)`, zIndex: 10 }} />

      {/* Corner glow */}
      <div className="absolute top-0 right-0 w-28 h-28 rounded-full blur-2xl opacity-20 pointer-events-none"
        style={{ background: `radial-gradient(circle,${accentColor} 0%,transparent 70%)`, zIndex: 1 }} />

      {/* ── POSTER IMAGE ── */}
      <div className="h-52 relative overflow-hidden">
        {posterUrl ? (
          <img src={posterUrl} alt={tournament.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center relative"
            style={{ background: `linear-gradient(135deg,#0d0d2b,#050810)` }}>
            <div className="absolute inset-0 opacity-8"
              style={{ backgroundImage: `radial-gradient(circle, ${accentGlow} 1px, transparent 1px)`, backgroundSize: '20px 20px' }} />
            <span className="text-6xl opacity-15">🏸</span>
          </div>
        )}

        {/* Bottom dark gradient */}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.3) 50%, rgba(7,7,26,0.92) 100%)' }} />

        {/* Status badge top-right */}
        <div className="absolute top-2.5 right-2.5">
          <span className="px-2.5 py-1 text-xs font-black rounded-full"
            style={{ background: statusStyle.bg, color: statusStyle.color, boxShadow: statusStyle.shadow || '0 2px 8px rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
            {statusStyle.text}
          </span>
        </div>

        {/* Share button top-left */}
        <button
          onClick={handleShare}
          title="Share tournament"
          className="absolute top-2 left-2 flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-bold transition-all"
          style={{
            background: 'rgba(0,0,0,0.65)',
            color: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
          }}
        >
          <ShareIcon className="w-3.5 h-3.5" />
          <span>Share</span>
        </button>

        {/* Bottom: city + countdown */}
        <div className="absolute bottom-0 left-0 right-0 px-3 pb-2.5 flex items-end justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <MapPinIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: accentColor }} />
            <span className="text-xs font-bold truncate" style={{ color: 'rgba(255,255,255,0.9)', textShadow: '0 1px 6px rgba(0,0,0,0.9)' }}>
              {tournament.city}{tournament.state ? `, ${tournament.state}` : ''}
            </span>
          </div>
          {daysLeft > 0 && daysLeft <= 60 && (
            <div className="flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-black"
              style={{ background: daysLeft <= 7 ? 'rgba(239,68,68,0.9)' : 'rgba(0,0,0,0.75)', color: daysLeft <= 7 ? '#fff' : 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}>
              {daysLeft === 0 ? 'Today!' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft}d`}
            </div>
          )}
        </div>
      </div>

      {/* ── CONTENT (no money info) ── */}
      <div className="p-4 space-y-3" style={{ position: 'relative', zIndex: 2 }}>
        {/* Tournament name */}
        <h3 className="font-black text-base text-white leading-snug line-clamp-2"
          style={{ letterSpacing: '-0.01em' }}>
          {tournament.name}
        </h3>

        {/* Date only */}
        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
          <CalendarIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: accentColor }} />
          <span>Starts <span className="font-bold text-white">{formatDateIndian(tournament.startDate)}</span></span>
        </div>

        {/* Category tags — shining */}
        {catTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {catTags.map((tag, i) => (
              <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-black"
                style={{
                  background: `linear-gradient(135deg,${accentGlow},rgba(255,255,255,0.04))`,
                  border: `1px solid ${accentGlow}`,
                  color: accentColor,
                }}>
                {tag}
              </span>
            ))}
            {(tournament.categories?.length || 0) > 5 && (
              <span className="px-2 py-1 rounded-lg text-xs font-semibold"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}>
                +{tournament.categories.length - 5}
              </span>
            )}
          </div>
        )}

        {/* CTA Button */}
        {tournament.status === 'completed' ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              const firstCat = tournament.categories?.[0]?.id;
              navigate(firstCat
                ? `/tournaments/${tournament.id}/draws/${firstCat}`
                : `/tournaments/${tournament.id}/draws`
              );
            }}
            className="w-full py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(168,85,247,0.25), rgba(99,102,241,0.2))',
              color: '#c084fc',
              border: '1.5px solid rgba(168,85,247,0.45)',
              boxShadow: '0 4px 18px rgba(168,85,247,0.25)',
            }}
          >
            <GitBranch className="w-4 h-4 relative z-10" />
            <span className="relative z-10 font-black">View Draws</span>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'radial-gradient(circle at center, rgba(168,85,247,0.2), transparent)' }} />
          </button>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/tournaments/${tournament.id}`); }}
            className="w-full py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 relative overflow-hidden"
            style={{
              background: isRegistrationOpen
                ? `linear-gradient(135deg,${accentColor}cc,${accentColor})`
                : 'rgba(255,255,255,0.07)',
              color: isRegistrationOpen ? '#050810' : 'rgba(255,255,255,0.55)',
              border: isRegistrationOpen ? 'none' : '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <span className="relative z-10 font-black">
              {isRegistrationOpen ? '🚀 Register Now' : 'View Details'}
            </span>
            <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform relative z-10" />
            {isRegistrationOpen && (
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'radial-gradient(circle at center, rgba(255,255,255,0.2), transparent)' }} />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

