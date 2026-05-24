import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import TournamentHistoryCard from '../components/TournamentHistoryCard';
import { ArrowLeftIcon, TrophyIcon } from '@heroicons/react/24/outline';
import { Filter, X, RefreshCw } from 'lucide-react';

const B = {
  bg: '#07071a', card: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)',
  cardDark: '#0d1025', green: '#06b6d4', cyan: '#00d4ff', purple: '#a855f7',
  sub: 'rgba(255,255,255,0.6)', dim: 'rgba(255,255,255,0.4)',
};

export default function OrganizerTournamentHistory() {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', startDate: '', endDate: '', page: 1 });
  const [pagination, setPagination] = useState(null);

  useEffect(() => { fetchHistory(); }, [filters]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      params.append('page', filters.page);
      params.append('limit', 10);
      const response = await api.get(`/organizer/history?${params}`);
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

  const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  const handlePageChange = (newPage) => setFilters(prev => ({ ...prev, page: newPage }));
  const clearFilters = () => setFilters({ status: '', startDate: '', endDate: '', page: 1 });
  const hasActiveFilters = filters.status || filters.startDate || filters.endDate;

  const inputStyle = {
    width: '100%', padding: '12px 16px', borderRadius: '12px', color: '#fff',
    background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(168,85,247,0.35)',
    outline: 'none', fontSize: '14px',
  };

  return (
    <div className="min-h-screen" style={{ background: B.bg }}>
      {/* Background orbs */}
      <div className="fixed top-0 bottom-0 pointer-events-none overflow-hidden" style={{ left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "480px" }}>
        <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full blur-3xl opacity-[0.06]" style={{ background: B.purple }} />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full blur-3xl opacity-[0.05]" style={{ background: B.cyan }} />
      </div>

      {/* Hero Header */}
      <div className="relative border-b" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <button
            onClick={() => navigate('/organizer/dashboard')}
            className="flex items-center gap-2 mb-6 transition-colors group"
            style={{ color: B.sub }}
          >
            <ArrowLeftIcon className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl"
              style={{ background: 'linear-gradient(135deg,#a855f7,#7c3aed)', boxShadow: '0 8px 25px rgba(168,85,247,0.3)' }}>
              <TrophyIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Tournament History</h1>
              <p className="mt-1" style={{ color: B.sub }}>View and manage all your tournaments</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="rounded-2xl p-6 mb-8 border" style={{ background: B.card, borderColor: B.border }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#a855f7,#7c3aed)' }}>
              <Filter className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-bold text-white">Filters</h2>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="ml-auto flex items-center gap-2 px-4 py-2 text-sm rounded-xl transition-colors"
                style={{ color: '#f87171' }}
              >
                <X className="w-4 h-4" />Clear All
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: B.sub }}>Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                style={inputStyle}
              >
                <option value="" style={{ background: '#0d1025' }}>All Statuses</option>
                <option value="completed" style={{ background: '#0d1025' }}>Completed</option>
                <option value="cancelled" style={{ background: '#0d1025' }}>Cancelled</option>
                <option value="ongoing" style={{ background: '#0d1025' }}>Ongoing</option>
                <option value="published" style={{ background: '#0d1025' }}>Published</option>
                <option value="draft" style={{ background: '#0d1025' }}>Draft</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: B.sub }}>Start Date</label>
              <input type="date" value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                style={{ ...inputStyle, colorScheme: 'dark' }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: B.sub }}>End Date</label>
              <input type="date" value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                style={{ ...inputStyle, colorScheme: 'dark' }} />
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchHistory}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-white transition-all"
                style={{ background: 'linear-gradient(135deg,#a855f7,#7c3aed)' }}
              >
                <RefreshCw className="w-4 h-4" />Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Tournament List */}
        {loading ? (
          <div className="rounded-2xl p-16 text-center border" style={{ background: B.card, borderColor: B.border }}>
            <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto"
              style={{ borderColor: 'rgba(6,182,212,0.3)', borderTopColor: B.green }} />
            <p className="mt-6 font-medium" style={{ color: B.sub }}>Loading tournaments...</p>
          </div>
        ) : tournaments.length === 0 ? (
          <div className="rounded-2xl p-16 text-center border" style={{ background: B.card, borderColor: B.border }}>
            <div className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6"
              style={{ background: 'rgba(255,255,255,0.06)' }}>
              <TrophyIcon className="w-12 h-12" style={{ color: B.dim }} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No tournaments found</h3>
            <p className="mb-6" style={{ color: B.sub }}>Try adjusting your filters or create a new tournament</p>
            <Link
              to="/tournaments/create"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all"
              style={{ background: 'linear-gradient(135deg,#a855f7,#7c3aed)' }}
            >
              Create Tournament
            </Link>
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
              <div className="flex items-center justify-center gap-3 mt-8">
                <button
                  onClick={() => handlePageChange(filters.page - 1)}
                  disabled={filters.page === 1}
                  className="px-5 py-2.5 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed border"
                  style={{ background: B.card, borderColor: B.border, color: B.sub }}
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm font-medium" style={{ color: B.dim }}>
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => handlePageChange(filters.page + 1)}
                  disabled={filters.page === pagination.pages}
                  className="px-5 py-2.5 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed border"
                  style={{ background: B.card, borderColor: B.border, color: B.sub }}
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
