import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tournamentAPI } from '../api/tournament';
import { 
  MagnifyingGlassIcon,
  MapPinIcon,
  CalendarIcon,
  UserGroupIcon,
  FunnelIcon,
  TrophyIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { Sparkles, Flame, Zap, Trophy, MapPin, Calendar, Users, Search, Filter, ChevronRight } from 'lucide-react';

const TournamentsPage = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    city: '',
    state: '',
    zone: '',
    format: '',
    status: 'published',
  });
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchTournaments();
  }, [currentPage, filters]);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page: currentPage,
        limit: 12,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        ),
      };
      const response = await tournamentAPI.getTournaments(params);
      setTournaments(response.data.tournaments);
      setPagination(response.data.pagination);
    } catch (err) {
      console.error('Error fetching tournaments:', err);
      setError('Failed to load tournaments');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchTournaments();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getCardGradient = (index) => {
    const gradients = [
      'from-violet-500 via-purple-500 to-fuchsia-500',
      'from-cyan-500 via-blue-500 to-indigo-500',
      'from-emerald-500 via-teal-500 to-cyan-500',
      'from-orange-500 via-amber-500 to-yellow-500',
      'from-pink-500 via-rose-500 to-red-500',
      'from-indigo-500 via-violet-500 to-purple-500',
    ];
    return gradients[index % gradients.length];
  };

  if (loading && tournaments.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-pink-500 border-b-transparent rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="text-purple-300 mt-6 font-medium text-lg">Loading tournaments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-pink-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse"></div>
      </div>

      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-500/30 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span className="text-purple-200 text-sm font-medium">Find Your Next Competition</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black mb-6">
              <span className="bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">Discover</span>
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">Tournaments</span>
            </h1>
            
            <p className="text-xl text-purple-200/70 max-w-2xl mx-auto mb-8">
              Find and register for badminton tournaments near you
            </p>

            <div className="flex flex-wrap justify-center gap-6 mb-8">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <span className="text-white font-semibold">{pagination?.total || tournaments.length}+ Tournaments</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                <Users className="w-5 h-5 text-green-400" />
                <span className="text-white font-semibold">1000+ Players</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                <MapPin className="w-5 h-5 text-blue-400" />
                <span className="text-white font-semibold">Pan India</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 -mt-4">
        {/* Search Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6 mb-10 shadow-2xl">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-purple-300" />
              <input
                type="text"
                placeholder="Search tournaments by name, city..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold transition-all ${
                showFilters ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
              }`}
            >
              <Filter className="h-5 w-5" />
              Filters
            </button>
            <button type="submit" className="px-8 py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all">
              Search
            </button>
          </form>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-6 mt-6 border-t border-white/10">
              <select value={filters.zone} onChange={(e) => handleFilterChange('zone', e.target.value)} className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white [&>option]:bg-slate-800">
                <option value="">All Zones</option>
                <option value="North">North</option>
                <option value="South">South</option>
                <option value="East">East</option>
                <option value="West">West</option>
              </select>
              <select value={filters.format} onChange={(e) => handleFilterChange('format', e.target.value)} className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white [&>option]:bg-slate-800">
                <option value="">All Formats</option>
                <option value="singles">Singles</option>
                <option value="doubles">Doubles</option>
                <option value="both">Both</option>
              </select>
              <input type="text" placeholder="City" value={filters.city} onChange={(e) => handleFilterChange('city', e.target.value)} className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300/50" />
              <input type="text" placeholder="State" value={filters.state} onChange={(e) => handleFilterChange('state', e.target.value)} className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300/50" />
            </div>
          )}
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold">Found <span className="text-purple-400">{tournaments.length}</span> tournaments</p>
              <p className="text-purple-300/60 text-sm">Ready for your next challenge</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-400 animate-pulse" />
            <span className="text-orange-400 font-medium">Hot picks available!</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-4 mb-8 flex items-center gap-3">
            <span className="text-red-400 text-xl">⚠️</span>
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {tournaments.length === 0 ? (
          <div className="bg-white/5 rounded-3xl border border-white/10 p-16 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-12 h-12 text-purple-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">No tournaments found</h3>
            <p className="text-purple-300/60">Try adjusting your filters or check back later</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {tournaments.map((tournament, index) => (
                <Link key={tournament.id} to={`/tournaments/${tournament.id}`} className="group relative">
                  <div className={`absolute -inset-0.5 bg-gradient-to-r ${getCardGradient(index)} rounded-3xl blur opacity-30 group-hover:opacity-60 transition-opacity duration-500`}></div>
                  <div className="relative bg-slate-900/90 backdrop-blur-sm rounded-3xl border border-white/10 overflow-hidden hover:border-white/30 transition-all">
                    <div className={`h-48 bg-gradient-to-br ${getCardGradient(index)} relative overflow-hidden`}>
                      {tournament.posters?.[0] ? (
                        <img 
                          src={tournament.posters[0].imageUrl.startsWith('/uploads') 
                            ? `http://localhost:5000${tournament.posters[0].imageUrl}` 
                            : tournament.posters[0].imageUrl} 
                          alt={tournament.name} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <span className="text-7xl opacity-60 group-hover:scale-125 transition-transform">🏸</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
                      <div className="absolute top-4 right-4">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md ${
                          tournament.status === 'published' ? 'bg-green-500/90 text-white' :
                          tournament.status === 'ongoing' ? 'bg-blue-500/90 text-white' : 'bg-amber-500/90 text-white'
                        }`}>
                          {tournament.status === 'published' ? '🟢 Open' : tournament.status === 'ongoing' ? '🔵 Live' : '📝 Draft'}
                        </span>
                      </div>
                      <div className="absolute bottom-4 left-4">
                        <span className="px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-full text-xs font-semibold text-white flex items-center gap-1">
                          <Zap className="w-3 h-3 text-yellow-400" />
                          {tournament.format === 'both' ? 'Singles & Doubles' : tournament.format?.charAt(0).toUpperCase() + tournament.format?.slice(1)}
                        </span>
                      </div>
                    </div>

                    <div className="p-5">
                      <h3 className="text-lg font-bold text-white mb-3 line-clamp-2 group-hover:text-purple-300 transition-colors">{tournament.name}</h3>
                      <div className="space-y-2.5 text-sm">
                        <div className="flex items-center gap-2 text-purple-200/70">
                          <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                            <MapPin className="h-4 w-4 text-purple-400" />
                          </div>
                          <span>{tournament.city}, {tournament.state}</span>
                        </div>
                        <div className="flex items-center gap-2 text-purple-200/70">
                          <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                            <Calendar className="h-4 w-4 text-blue-400" />
                          </div>
                          <span>{formatDate(tournament.startDate)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-purple-200/70">
                          <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                            <Users className="h-4 w-4 text-green-400" />
                          </div>
                          <span>{tournament._count?.categories || 0} Categories</span>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                        <span className="text-sm font-semibold text-purple-400 bg-purple-500/20 px-3 py-1 rounded-full">
                          {tournament._count?.registrations || 0} registered
                        </span>
                        <span className="text-purple-300 flex items-center gap-1 text-sm group-hover:text-white transition-colors">
                          View Details
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-5 py-2.5 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 disabled:opacity-50 font-medium text-white transition-all"
                >
                  Previous
                </button>
                <div className="flex items-center gap-2">
                  {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 h-10 rounded-xl font-medium transition-all ${
                          currentPage === pageNum
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                            : 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                  disabled={currentPage === pagination.totalPages}
                  className="px-5 py-2.5 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 disabled:opacity-50 font-medium text-white transition-all"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TournamentsPage;
