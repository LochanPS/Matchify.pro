import { useState, useEffect } from 'react';
import axios from 'axios';
import TournamentHistoryCard from '../components/TournamentHistoryCard';

export default function OrganizerTournamentHistory() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    page: 1
  });
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, [filters]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      params.append('page', filters.page);
      params.append('limit', 10);

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/organizer/history?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setTournaments(response.data.data.tournaments);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Tournament History</h1>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="ongoing">Ongoing</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ status: '', startDate: '', endDate: '', page: 1 })}
              className="w-full bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg transition"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Tournament List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : tournaments.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 text-lg">No tournaments found</p>
          <p className="text-gray-400 text-sm mt-2">Try adjusting your filters</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {tournaments.map((tournament) => (
              <TournamentHistoryCard key={tournament.id} tournament={tournament} />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => handlePageChange(filters.page - 1)}
                disabled={filters.page === 1}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
              >
                Previous
              </button>

              <span className="px-4">
                Page {pagination.page} of {pagination.pages}
              </span>

              <button
                onClick={() => handlePageChange(filters.page + 1)}
                disabled={filters.page === pagination.pages}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
