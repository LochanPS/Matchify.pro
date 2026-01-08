import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon, FunnelIcon, MapPinIcon, CalendarIcon, UserGroupIcon, XMarkIcon } from '@heroicons/react/24/outline';
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
  
  // Filter states
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

  // Separate effect for filter changes
  useEffect(() => {
    if (page === 1) {
      fetchTournaments();
    } else {
      setPage(1); // Reset to page 1 when filters change
    }
  }, [filters]);

  const fetchTournaments = async () => {
    setLoading(true);
    try {
      const params = {
        page: page.toString(),
        limit: '12',
      };

      // Add filters
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params[key] = filters[key];
        }
      });

      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await tournamentAPI.getTournaments(params);
      
      // Backend returns data.tournaments and data.pagination
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
    setFilters({
      city: '',
      state: '',
      zone: '',
      status: '',
      format: '',
      startDate: '',
      endDate: ''
    });
    setSearchQuery('');
    setPage(1);
  };

  const hasActiveFilters = Object.values(filters).some(v => v) || searchQuery;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Discover Tournaments</h1>
          <p className="text-gray-600 mt-1">Find and register for badminton tournaments near you</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tournaments by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`px-6 py-3 rounded-lg flex items-center gap-2 transition-colors ${
                showFilters ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FunnelIcon className="h-5 w-5" />
              Filters
            </button>
            <button
              type="submit"
              className="px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg text-gray-900">Filters</h3>
              <button
                onClick={clearFilters}
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                <XMarkIcon className="h-4 w-4" />
                Clear All
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  value={filters.city}
                  onChange={(e) => handleFilterChange('city', e.target.value)}
                  placeholder="Enter city"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                >
                  <option value="">All Statuses</option>
                  <option value="published">Open for Registration</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="draft">Draft</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
                <select
                  value={filters.format}
                  onChange={(e) => handleFilterChange('format', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                >
                  <option value="">All Formats</option>
                  <option value="singles">Singles Only</option>
                  <option value="doubles">Doubles Only</option>
                  <option value="both">Both</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date (From)</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date (To)</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Results Count */}
        {!loading && (
          <div className="mb-4 text-sm text-gray-600">
            Found {total} tournament{total !== 1 ? 's' : ''}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="ml-2 text-primary-600 hover:text-primary-700"
              >
                (clear filters)
              </button>
            )}
          </div>
        )}

        {/* Tournament Grid */}
        {loading ? (
          <div className="text-center py-12">
            <Loader className="inline-block animate-spin h-12 w-12 text-primary-600" />
            <p className="mt-4 text-gray-600">Loading tournaments...</p>
          </div>
        ) : tournaments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="text-gray-600 text-lg">No tournaments found</p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 text-primary-600 hover:text-primary-700"
              >
                Clear filters and try again
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tournaments.map((tournament) => (
                <TournamentCard key={tournament.id} tournament={tournament} navigate={navigate} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  Previous
                </button>
                
                <span className="px-4 py-2 text-gray-700">
                  Page {page} of {totalPages}
                </span>
                
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
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
function TournamentCard({ tournament, navigate }) {
  const getStatusBadge = (status) => {
    const styles = {
      OPEN: 'bg-green-100 text-green-800',
      CLOSED: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const getFormatIcon = (format) => {
    if (format === 'SINGLES') return '🏸';
    if (format === 'DOUBLES') return '👥';
    return '🏸👥';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden cursor-pointer"
         onClick={() => navigate(`/tournaments/${tournament.id}`)}>
      {/* Poster Image */}
      <div className="h-48 bg-gradient-to-br from-primary-500 via-primary-600 to-purple-600 relative">
        <div className="absolute inset-0 bg-black bg-opacity-10"></div>
        <div className="absolute top-3 right-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(tournament.status)}`}>
            {tournament.status}
          </span>
        </div>
        <div className="absolute bottom-3 left-3 text-white">
          <div className="text-4xl mb-1">{getFormatIcon(tournament.format)}</div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-bold text-lg text-gray-900 mb-3 line-clamp-2 min-h-[3.5rem]">
          {tournament.name}
        </h3>

        <div className="space-y-2 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-2">
            <MapPinIcon className="h-4 w-4 text-gray-400" />
            <span>{tournament.city}, {tournament.state}</span>
          </div>

          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-gray-400" />
            <span>
              {formatDateIndian(tournament.startDate)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <UserGroupIcon className="h-4 w-4 text-gray-400" />
            <span>{tournament.format}</span>
          </div>
        </div>

        {/* View Details Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/tournaments/${tournament.id}`);
          }}
          className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
        >
          View Details
        </button>
      </div>
    </div>
  );
}
