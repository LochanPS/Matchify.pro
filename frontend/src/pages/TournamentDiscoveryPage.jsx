import { useState, useEffect } from 'react';
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
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { Loader } from 'lucide-react';
import { tournamentAPI } from '../api/tournament';
import { formatDateIndian } from '../utils/dateFormat';

export default function TournamentDiscoveryPage() {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
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

  useEffect(() => {
    fetchTournaments();
  }, [page]);

  useEffect(() => {
    if (page === 1) {
      fetchTournaments();
    } else {
      setPage(1);
    }
  }, [filters]);

  const fetchTournaments = async () => {
    setLoading(true);
    try {
      const params = { page: page.toString(), limit: '12' };
      Object.keys(filters).forEach(key => {
        if (filters[key]) params[key] = filters[key];
      });
      if (searchQuery) params.search = searchQuery;

      const response = await tournamentAPI.getTournaments(params);
      setTournaments(response.data?.tournaments || []);
      setTotalPages(response.data?.pagination?.totalPages || 1);
      setTotal(response.data?.pagination?.total || 0);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTournaments();
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ city: '', state: '', zone: '', status: '', format: '', startDate: '', endDate: '' });
    setSearchQuery('');
    setPage(1);
  };

  const hasActiveFilters = Object.values(filters).some(v => v) || searchQuery;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/70 hover:text-white mb-6 transition-colors group"
          >
            <ArrowLeftIcon className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            <span>Back</span>
          </button>

          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/80 text-sm font-medium mb-6 border border-white/20">
              <SparklesIcon className="w-4 h-4 text-amber-400" />
              Find Your Next Competition
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Discover Tournaments
            </h1>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Find and register for badminton tournaments near you
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-8">
        {/* Search Card */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-8">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tournaments by name, city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-700/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-white placeholder-gray-400"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`px-6 py-4 rounded-xl flex items-center justify-center gap-2 font-medium transition-all ${
                showFilters 
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' 
                  : 'bg-slate-700/50 text-gray-300 hover:bg-slate-700 border border-white/10'
              }`}
            >
              <FunnelIcon className="h-5 w-5" />
              Filters
              {hasActiveFilters && (
                <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
              )}
            </button>
            <button
              type="submit"
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/30 hover:scale-105 transition-all font-semibold"
            >
              Search
            </button>
          </form>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-white">Filter Options</h3>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium"
                  >
                    <XMarkIcon className="h-4 w-4" />
                    Clear All
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">City</label>
                  <input
                    type="text"
                    value={filters.city}
                    onChange={(e) => handleFilterChange('city', e.target.value)}
                    placeholder="Any city"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-white placeholder-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800 border border-purple-500/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-white shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                  >
                    <option value="">All Statuses</option>
                    <option value="published">Open for Registration</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Format</label>
                  <select
                    value={filters.format}
                    onChange={(e) => handleFilterChange('format', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800 border border-purple-500/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-white shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                  >
                    <option value="">All Formats</option>
                    <option value="singles">Singles Only</option>
                    <option value="doubles">Doubles Only</option>
                    <option value="both">Both</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">From Date</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">To Date</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-white"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        {!loading && (
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-400">
              Found <span className="font-semibold text-white">{total}</span> tournament{total !== 1 ? 's' : ''}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Tournament Grid */}
        {loading ? (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-16 text-center">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-400 mt-6 font-medium">Loading tournaments...</p>
          </div>
        ) : tournaments.length === 0 ? (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-16 text-center">
            <div className="w-24 h-24 bg-slate-700/50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <TrophyIcon className="w-12 h-12 text-gray-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No tournaments found</h3>
            <p className="text-gray-400 mb-6">Try adjusting your filters or check back later</p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tournaments.map((tournament, index) => (
                <TournamentCard key={tournament.id} tournament={tournament} navigate={navigate} index={index} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-10">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-5 py-2.5 bg-slate-700/50 border border-white/10 rounded-xl hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-gray-300 transition-all"
                >
                  Previous
                </button>
                
                <div className="flex items-center gap-2">
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-10 h-10 rounded-xl font-medium transition-all ${
                          page === pageNum
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/30'
                            : 'bg-slate-700/50 border border-white/10 text-gray-300 hover:bg-slate-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-5 py-2.5 bg-slate-700/50 border border-white/10 rounded-xl hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-gray-300 transition-all"
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
}


// Tournament Card Component
function TournamentCard({ tournament, navigate, index }) {
  const getStatusStyle = (status) => {
    const styles = {
      published: { bg: 'bg-green-500/90', text: 'Open' },
      ongoing: { bg: 'bg-blue-500/90', text: 'Ongoing' },
      completed: { bg: 'bg-gray-500/90', text: 'Completed' },
      cancelled: { bg: 'bg-red-500/90', text: 'Cancelled' },
      draft: { bg: 'bg-amber-500/90', text: 'Draft' }
    };
    return styles[status?.toLowerCase()] || styles.draft;
  };

  const gradients = [
    'from-purple-500 via-violet-600 to-indigo-700',
    'from-blue-500 via-cyan-600 to-teal-700',
    'from-emerald-500 via-green-600 to-teal-700',
    'from-orange-500 via-amber-600 to-yellow-700',
    'from-pink-500 via-rose-600 to-red-700',
    'from-indigo-500 via-purple-600 to-pink-700',
  ];

  const gradient = gradients[index % gradients.length];
  const statusStyle = getStatusStyle(tournament.status);
  const hasPoster = tournament.posters && tournament.posters.length > 0 && tournament.posters[0]?.imageUrl;
  
  // Get poster URL - handle both Cloudinary and local URLs
  const getPosterUrl = () => {
    if (!hasPoster) return null;
    const posterUrl = tournament.posters[0].imageUrl;
    // If it's a local URL (starts with /uploads), prepend the API base URL
    if (posterUrl.startsWith('/uploads')) {
      return `http://localhost:5000${posterUrl}`;
    }
    return posterUrl;
  };

  const posterUrl = getPosterUrl();

  return (
    <div 
      className="group bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/10 hover:scale-[1.02] transition-all duration-300 overflow-hidden cursor-pointer"
      onClick={() => navigate(`/tournaments/${tournament.id}`)}
    >
      {/* Poster */}
      <div className="h-52 relative overflow-hidden">
        {posterUrl ? (
          <>
            <img
              src={posterUrl}
              alt={tournament.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {/* Light overlay only at bottom for text readability */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/50 to-transparent"></div>
          </>
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            <span className="text-6xl opacity-30">🏸</span>
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-4 right-4">
          <span className={`px-3 py-1.5 ${statusStyle.bg} text-white text-xs font-semibold rounded-full backdrop-blur-sm shadow-lg`}>
            {statusStyle.text}
          </span>
        </div>

        {/* Format Badge */}
        <div className="absolute bottom-4 left-4">
          <span className="px-3 py-1.5 bg-black/40 backdrop-blur-sm text-white text-xs font-medium rounded-full border border-white/20">
            {tournament.format === 'both' ? '🏸 Singles & Doubles' : 
             tournament.format === 'singles' ? '🏸 Singles' : '👥 Doubles'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-bold text-lg text-white mb-3 line-clamp-2 group-hover:text-amber-400 transition-colors min-h-[3.5rem]">
          {tournament.name}
        </h3>

        <div className="space-y-2.5 mb-5">
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <MapPinIcon className="h-4 w-4 text-purple-400" />
            </div>
            <span className="truncate">{tournament.city}, {tournament.state}</span>
          </div>

          <div className="flex items-center gap-3 text-sm text-gray-400">
            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <CalendarIcon className="h-4 w-4 text-blue-400" />
            </div>
            <span>{formatDateIndian(tournament.startDate)}</span>
          </div>

          <div className="flex items-center gap-3 text-sm text-gray-400">
            <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <UserGroupIcon className="h-4 w-4 text-green-400" />
            </div>
            <span>{tournament._count?.categories || 0} Categories • {tournament._count?.registrations || 0} Registered</span>
          </div>
        </div>

        {/* View Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/tournaments/${tournament.id}`);
          }}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all font-semibold flex items-center justify-center gap-2 group-hover:scale-[1.02]"
        >
          View Details
          <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
