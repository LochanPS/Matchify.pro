import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tournamentAPI } from '../api/tournament';
import { 
  MagnifyingGlassIcon,
  MapPinIcon,
  CalendarIcon,
  UserGroupIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

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

  if (loading && tournaments.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Badminton Tournaments</h1>
          <p className="text-gray-600 mt-2">
            Find and register for badminton tournaments across India
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <form onSubmit={handleSearch} className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tournaments..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <FunnelIcon className="h-5 w-5" />
              Filters
            </button>
          </form>

          {/* Filter Options */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
              <select
                value={filters.zone}
                onChange={(e) => handleFilterChange('zone', e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Zones</option>
                <option value="North">North</option>
                <option value="South">South</option>
                <option value="East">East</option>
                <option value="West">West</option>
                <option value="Central">Central</option>
                <option value="Northeast">Northeast</option>
              </select>

              <select
                value={filters.format}
                onChange={(e) => handleFilterChange('format', e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Formats</option>
                <option value="singles">Singles</option>
                <option value="doubles">Doubles</option>
                <option value="both">Both</option>
              </select>

              <input
                type="text"
                placeholder="City"
                value={filters.city}
                onChange={(e) => handleFilterChange('city', e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />

              <input
                type="text"
                placeholder="State"
                value={filters.state}
                onChange={(e) => handleFilterChange('state', e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Tournaments Grid */}
        {tournaments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No tournaments found</p>
            <p className="text-gray-400 text-sm mt-2">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {tournaments.map((tournament) => (
                <Link
                  key={tournament.id}
                  to={`/tournaments/${tournament.id}`}
                  className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow overflow-hidden"
                >
                  {/* Tournament Poster */}
                  <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 relative">
                    {tournament.posters && tournament.posters[0] ? (
                      <img
                        src={tournament.posters[0].imageUrl}
                        alt={tournament.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-white text-6xl">
                        🎾
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        tournament.status === 'published' ? 'bg-green-100 text-green-800' :
                        tournament.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                        tournament.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {tournament.status}
                      </span>
                    </div>
                  </div>

                  {/* Tournament Info */}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {tournament.name}
                    </h3>

                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <MapPinIcon className="h-4 w-4" />
                        <span>{tournament.city}, {tournament.state}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        <span>{formatDate(tournament.startDate)}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <UserGroupIcon className="h-4 w-4" />
                        <span>{tournament._count.categories} Categories</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-600">
                        {tournament.format === 'both' ? 'Singles & Doubles' : 
                         tournament.format.charAt(0).toUpperCase() + tournament.format.slice(1)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {tournament._count.registrations} registered
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                <span className="px-4 py-2 text-gray-700">
                  Page {currentPage} of {pagination.totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                  disabled={currentPage === pagination.totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
