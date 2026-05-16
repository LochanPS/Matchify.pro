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
import { Loader } from 'lucide-react';
import { tournamentAPI } from '../api/tournament';
import { formatDateIndian } from '../utils/dateFormat';

// Pre-generated particle data — deterministic, no Math.random in render
const DISC_PARTICLES = Array.from({ length: 15 }, (_, i) => ({
  w: (i * 7 + 2) % 4 + 2,
  h: (i * 11 + 2) % 4 + 2,
  x: (i * 37 + 11) % 97,
  y: (i * 53 + 7) % 91,
  c: ["#00ff88", "#00d4ff", "#a855f7", "#00ff88"][i % 4],
  o: ((i * 13) % 50) / 100 + 0.2,
  dur: (i * 7) % 8 + 5,
  delay: (i * 3) % 5,
  glow: (i * 11) % 15 + 5,
}));


export default function TournamentDiscoveryPage() {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const observerTarget = useRef(null);
  
  const [activeTab, setActiveTab] = useState('upcoming');
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
  }, [page]);

  useEffect(() => {
    // Reset when filters or tab change
    setTournaments([]);
    setPage(1);
    setHasMore(true);
  }, [filters, searchQuery, activeTab]);

  const fetchTournaments = async () => {
    if (!hasMore && page > 1) return;
    
    setLoading(true);
    try {
      const params = { page: page.toString(), limit: '10' };
      Object.keys(filters).forEach(key => {
        if (filters[key]) params[key] = filters[key];
      });
      if (searchQuery) params.search = searchQuery;
      params.tab = activeTab;

      const response = await tournamentAPI.getTournaments(params);
      const newTournaments = response.data?.tournaments || [];
      
      if (page === 1) {
        setTournaments(newTournaments);
      } else {
        setTournaments(prev => [...prev, ...newTournaments]);
      }
      
      setTotal(response.data?.pagination?.total || 0);
      setHasMore(newTournaments.length === 10); // If we got less than limit, no more pages
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
    setPage(1);
    setHasMore(true);
    fetchTournaments();
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
    <div className="min-h-screen relative overflow-hidden pb-6" style={{ background: '#07071a' }}>
      {/* Animated Background Elements */}
      <div className="fixed top-0 bottom-0 pointer-events-none overflow-hidden" style={{ left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "480px" }}>
        <div 
          className="absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl opacity-30"
          style={{ 
            background: 'radial-gradient(circle, rgba(0,255,136,0.6), transparent)',
            animation: 'glow 4s ease-in-out infinite'
          }}
        />
        <div 
          className="absolute bottom-1/3 left-0 w-64 h-64 rounded-full blur-3xl opacity-25"
          style={{ 
            background: 'radial-gradient(circle, rgba(168,85,247,0.6), transparent)',
            animation: 'glow 5s ease-in-out infinite reverse'
          }}
        />
        <div 
          className="absolute top-1/2 right-1/4 w-56 h-56 rounded-full blur-3xl opacity-20"
          style={{ 
            background: 'radial-gradient(circle, rgba(6,182,212,0.6), transparent)',
            animation: 'glow 6s ease-in-out infinite'
          }}
        />
        {DISC_PARTICLES.map((p, i) => (
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

      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(15px, -15px) scale(1.05); }
          50% { transform: translate(-10px, 10px) scale(0.95); }
          75% { transform: translate(10px, 5px) scale(1.02); }
        }
        @keyframes glow {
          0%, 100% { opacity: 0.3; filter: brightness(1); }
          50% { opacity: 0.6; filter: brightness(1.3); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>

      {/* Hero Header - Compact Mobile-First with Back Button */}
      <div className="relative pt-4">
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
                background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(251,146,60,0.15))',
                border: '2px solid rgba(245,158,11,0.4)',
                color: '#fbbf24',
                boxShadow: '0 4px 15px rgba(245,158,11,0.3)'
              }}
            >
              <SparklesIcon className="w-3.5 h-3.5" />
              Find Your Next Competition
            </div>
            <h1 
              className="text-2xl sm:text-3xl font-black mb-2"
              style={{
                background: 'linear-gradient(135deg, #00ff88, #00ff88, #00ff88)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textShadow: '0 0 40px rgba(0,255,136,0.3)'
              }}
            >
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
                  background: 'linear-gradient(135deg, #00ff88, #00ff88)',
                  color: '#003320',
                  boxShadow: '0 8px 25px rgba(0,255,136,0.4)'
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
                  background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(139,92,246,0.15))',
                  border: '2px solid rgba(168,85,247,0.4)',
                  color: '#c4b5fd',
                  boxShadow: '0 4px 15px rgba(168,85,247,0.3)'
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
            background: 'linear-gradient(135deg, rgba(0,255,136,0.1) 0%, rgba(99,102,241,0.1) 100%)',
            border: '2px solid rgba(0,255,136,0.2)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0,255,136,0.15)'
          }}
        >
          <form onSubmit={handleSearch} className="flex flex-col gap-3">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#00ff88' }} />
              <input
                type="text"
                placeholder="Search tournaments by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-white text-sm placeholder-gray-400 font-medium"
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1.5px solid rgba(0,255,136,0.3)',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
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
                        boxShadow: '0 6px 20px rgba(168,85,247,0.4)'
                      }
                    : { 
                        background: 'rgba(255,255,255,0.05)',
                        border: '1.5px solid rgba(255,255,255,0.1)',
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
                  boxShadow: '0 6px 20px rgba(168,85,247,0.4)'
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
                    className="text-xs flex items-center gap-1 font-bold transition-colors" style={{ color: '#00ff88' }}
                  >
                    <XMarkIcon className="h-3.5 w-3.5" />
                    Clear All
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: '#00ff88' }}>City</label>
                  <input
                    type="text"
                    value={filters.city}
                    onChange={(e) => handleFilterChange('city', e.target.value)}
                    placeholder="Any city"
                    className="w-full px-3 py-2.5 text-sm rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-white placeholder-gray-500 font-medium"
                    style={{
                      background: 'rgba(0,0,0,0.3)',
                      border: '1.5px solid rgba(0,255,136,0.3)'
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
                      border: '1.5px solid rgba(168,85,247,0.5)',
                      boxShadow: '0 4px 15px rgba(168,85,247,0.2)'
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
                      border: '1.5px solid rgba(6,182,212,0.5)',
                      boxShadow: '0 4px 15px rgba(6,182,212,0.2)'
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
        <div className="flex gap-0 mb-5 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
          <button
            onClick={() => setActiveTab('upcoming')}
            className="flex-1 py-3 text-sm font-black transition-all"
            style={{
              background: activeTab === 'upcoming' ? 'linear-gradient(135deg,#00ff88,#00d4ff)' : 'rgba(255,255,255,0.04)',
              color: activeTab === 'upcoming' ? '#07071a' : 'rgba(255,255,255,0.5)',
            }}
          >
            🏸 Upcoming
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className="flex-1 py-3 text-sm font-black transition-all"
            style={{
              background: activeTab === 'completed' ? 'linear-gradient(135deg,#a855f7,#6366f1)' : 'rgba(255,255,255,0.04)',
              color: activeTab === 'completed' ? '#ffffff' : 'rgba(255,255,255,0.5)',
            }}
          >
            🏆 Completed
          </button>
        </div>

        {/* Results Count - Compact */}
        {!loading && (
          <div className="flex items-center justify-between mb-3">
            <p 
              className="text-sm font-bold"
              style={{
                background: 'linear-gradient(135deg, #00ff88, #00ff88)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              Found <span className="text-white">{total}</span> tournament{total !== 1 ? 's' : ''}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs font-bold transition-colors"
                style={{ color: '#00ff88' }}
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
              background: 'linear-gradient(135deg, rgba(0,255,136,0.1) 0%, rgba(99,102,241,0.1) 100%)',
              border: '2px solid rgba(0,255,136,0.2)',
              backdropFilter: 'blur(20px)'
            }}
          >
            <div 
              className="w-16 h-16 border-4 rounded-full animate-spin mx-auto"
              style={{ 
                borderColor: 'rgba(0,255,136,0.3)',
                borderTopColor: '#00ff88'
              }}
            ></div>
            <p className="text-white/70 mt-6 font-bold">Loading tournaments...</p>
          </div>
        ) : tournaments.length === 0 ? (
          <div 
            className="rounded-2xl p-8 sm:p-16 text-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(0,255,136,0.1) 0%, rgba(99,102,241,0.1) 100%)',
              border: '2px solid rgba(0,255,136,0.2)',
              backdropFilter: 'blur(20px)'
            }}
          >
            <div 
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex items-center justify-center mx-auto mb-6"
              style={{
                background: 'linear-gradient(135deg, rgba(0,255,136,0.2), rgba(168,85,247,0.2))',
                border: '2px solid rgba(0,255,136,0.3)'
              }}
            >
              <TrophyIcon className="w-10 h-10 sm:w-12 sm:h-12" style={{ color: '#00ff88' }} />
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white mb-2">No tournaments found</h3>
            <p className="text-sm sm:text-base text-white/60 mb-6 font-medium">Try adjusting your filters or check back later</p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-6 py-3 rounded-xl font-bold transition-all"
                style={{ 
                  background: 'linear-gradient(135deg, #00ff88, #00ff88)',
                  color: '#003320',
                  boxShadow: '0 6px 20px rgba(0,255,136,0.4)'
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
                  <div 
                    className="w-12 h-12 border-4 rounded-full animate-spin"
                    style={{ 
                      borderColor: 'rgba(0,255,136,0.3)',
                      borderTopColor: '#00ff88'
                    }}
                  ></div>
                  <p className="text-white/70 font-bold text-sm">Loading more tournaments...</p>
                </div>
              )}
              {!loading && !hasMore && tournaments.length > 0 && (
                <div className="flex flex-col items-center gap-2">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, rgba(0,255,136,0.2), rgba(168,85,247,0.2))',
                      border: '2px solid rgba(0,255,136,0.3)'
                    }}
                  >
                    <SparklesIcon className="w-5 h-5" style={{ color: '#00ff88' }} />
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


// ── Shareable link helper ────────────────────────────────────────────────────
function getTournamentShareUrl(id) {
  return `${window.location.origin}/tournaments/${id}`;
}

function buildShareMessage(tournament) {
  const url = getTournamentShareUrl(tournament.id);
  const dateStr = new Date(tournament.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const cats = (tournament.categories || []).map(c => `   • ${c.name}`).join('\n');
  const catBlock = cats ? `\n🏸 Categories:\n${cats}\n` : '';
  return {
    title: `${tournament.name} — Matchify.pro`,
    text: [
      `🎾 MATCHIFY.PRO PRESENTS`,
      ``,
      `━━━━━━━━━━━━━━━━━━━`,
      `🏆 ${tournament.name.toUpperCase()}`,
      `━━━━━━━━━━━━━━━━━━━`,
      ``,
      `📍 ${tournament.city}${tournament.state ? `, ${tournament.state}` : ''}`,
      `📅 ${dateStr}`,
      catBlock,
      `🔗 View & Register:`,
      url,
      ``,
      `━━━━━━━━━━━━━━━━━━━`,
      `Powered by Matchify.pro ✨`,
    ].join('\n'),
    url,
  };
}

async function shareTournament(tournament, e) {
  e?.stopPropagation();
  const { title, text } = buildShareMessage(tournament);
  if (navigator.share) {
    // Pass text only — URL already embedded. Prevents WhatsApp double-URL.
    try { await navigator.share({ title, text }); } catch (_) {}
  } else {
    await navigator.clipboard.writeText(text);
    return 'copied';
  }
  return 'shared';
}

// Tournament Card Component - Event Poster Style
function TournamentCard({ tournament, navigate, index }) {
  const getStatusStyle = (status) => {
    const styles = {
      published: { bg: 'linear-gradient(135deg, #00ff88, #00ff88)', text: 'Open', color: '#003320' },
      ongoing: { bg: 'linear-gradient(135deg, #3b82f6, #60a5fa)', text: 'Live', color: '#ffffff' },
      completed: { bg: 'linear-gradient(135deg, #6b7280, #9ca3af)', text: 'Done', color: '#ffffff' },
      cancelled: { bg: 'linear-gradient(135deg, #ef4444, #dc2626)', text: 'Cancelled', color: '#ffffff' },
      draft: { bg: 'linear-gradient(135deg, #f59e0b, #fbbf24)', text: 'Draft', color: '#1a0a00' }
    };
    return styles[status?.toLowerCase()] || styles.draft;
  };

  const accentPairs = [
    ['#00ff88','rgba(0,255,136,0.25)'],
    ['#00d4ff','rgba(0,212,255,0.25)'],
    ['#a855f7','rgba(168,85,247,0.25)'],
    ['#f59e0b','rgba(245,158,11,0.25)'],
    ['#ec4899','rgba(236,72,153,0.25)'],
    ['#06b6d4','rgba(6,182,212,0.25)'],
  ];
  const [accentColor, accentGlow] = accentPairs[index % accentPairs.length];

  const [shareState, setShareState] = useState('idle'); // idle | copied | shared

  const handleShare = async (e) => {
    e.stopPropagation();
    const result = await shareTournament(tournament, e);
    if (result === 'copied') {
      setShareState('copied');
      setTimeout(() => setShareState('idle'), 2000);
    }
  };

  const statusStyle = getStatusStyle(tournament.status);
  const hasPoster = tournament.posters && tournament.posters.length > 0 && tournament.posters[0]?.imageUrl;

  const getPosterUrl = () => {
    if (!hasPoster) return null;
    const url = tournament.posters[0].imageUrl;
    if (url.startsWith('/uploads')) {
      const base = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://matchify-probackend.vercel.app';
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
      className="group relative overflow-hidden cursor-pointer rounded-2xl transition-all duration-300 hover:scale-[1.01]"
      onClick={() => navigate(`/tournaments/${tournament.id}`)}
      style={{
        background: 'linear-gradient(145deg,#0d0d2b 0%,#07071a 100%)',
        border: `1.5px solid ${accentGlow}`,
        boxShadow: `0 4px 28px rgba(0,0,0,0.5), 0 0 0 0.5px ${accentGlow}`,
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
            style={{ background: `linear-gradient(135deg,#0d0d2b,#07071a)` }}>
            <div className="absolute inset-0 opacity-8"
              style={{ backgroundImage: `radial-gradient(circle, ${accentGlow} 1px, transparent 1px)`, backgroundSize: '20px 20px' }} />
            <span className="text-6xl opacity-15">🏸</span>
          </div>
        )}

        {/* Bottom dark gradient */}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.3) 50%, rgba(7,7,26,0.92) 100%)' }} />

        {/* Status badge top-right */}
        <div className="absolute top-2 right-2">
          <span className="px-2.5 py-1 text-xs font-black rounded-full"
            style={{ background: statusStyle.bg, color: statusStyle.color, boxShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
            {statusStyle.text}
          </span>
        </div>

        {/* Share button top-left */}
        <button
          onClick={handleShare}
          title="Share tournament"
          className="absolute top-2 left-2 flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-bold transition-all"
          style={{
            background: shareState === 'copied' ? 'rgba(0,255,136,0.9)' : 'rgba(0,0,0,0.65)',
            color: shareState === 'copied' ? '#003320' : 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(8px)',
            border: `1px solid ${shareState === 'copied' ? 'rgba(0,255,136,0.5)' : 'rgba(255,255,255,0.2)'}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
          }}
        >
          <ShareIcon className="w-3.5 h-3.5" />
          <span>{shareState === 'copied' ? 'Copied!' : 'Share'}</span>
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
      <div className="p-4 space-y-2" style={{ position: 'relative', zIndex: 2 }}>
        {/* Matchify.pro Presents — just above tournament name */}
        <p className="text-xs font-black uppercase tracking-widest"
          style={{ color: accentColor, opacity: 0.8, letterSpacing: '0.13em' }}>
          ✦ Matchify.pro Presents
        </p>
        {/* Tournament name with accent glow */}
        <h3 className="font-black text-base text-white leading-snug line-clamp-2"
          style={{ textShadow: `0 0 20px ${accentColor}40` }}>
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
                  boxShadow: `0 0 6px ${accentColor}30`,
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
        <button
          onClick={(e) => { e.stopPropagation(); navigate(`/tournaments/${tournament.id}`); }}
          className="w-full py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 relative overflow-hidden"
          style={{
            background: isRegistrationOpen
              ? `linear-gradient(135deg,${accentColor}cc,${accentColor})`
              : 'rgba(255,255,255,0.07)',
            color: isRegistrationOpen ? '#07071a' : 'rgba(255,255,255,0.55)',
            border: isRegistrationOpen ? 'none' : '1px solid rgba(255,255,255,0.1)',
            boxShadow: isRegistrationOpen ? `0 4px 18px ${accentColor}50` : 'none',
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
      </div>
    </div>
  );
}
