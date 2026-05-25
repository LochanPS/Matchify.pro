import { getErrorMessage } from '../utils/errorMessage';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import LoadingScreen from '../components/LoadingScreen';
import { formatDateIndian } from '../utils/dateFormat';
import {
  AlertTriangle,
  ArrowLeft,
  User,
  Trophy,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Filter,
  RefreshCw,
} from 'lucide-react';

const BRAND = {
  bg: '#040810',
  cardDark: '#0d1025',
  card: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
  green: '#F59E0B',
  cyan: '#FCD34D',
  purple: '#8B5CF6',
  amber: '#fbbf24',
};

export default function CancellationRequestsPage() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/organizer/cancellation-requests');
      setRequests(response.data.requests || []);
    } catch (err) {
      console.error('Error fetching cancellation requests:', err);
      setError(getErrorMessage(err, 'Failed to load cancellation requests'));
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter((req) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return req.status === 'cancellation_requested';
    if (filter === 'processed') return req.status === 'cancelled' || req.refundStatus === 'rejected';
    return true;
  });

  const getStatusBadge = (request) => {
    if (request.status === 'cancellation_requested') {
      return (
        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold"
          style={{ background: 'rgba(251,191,36,0.15)', color: BRAND.amber, border: '1px solid rgba(251,191,36,0.3)' }}>
          Pending
        </span>
      );
    }
    if (request.status === 'cancelled') {
      return (
        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold"
          style={{ background: 'rgba(245,158,11,0.12)', color: BRAND.green, border: '1px solid rgba(245,158,11,0.25)' }}>
          Approved
        </span>
      );
    }
    if (request.refundStatus === 'rejected') {
      return (
        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold"
          style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}>
          Rejected
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-lg text-xs font-semibold"
        style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
        Unknown
      </span>
    );
  };

  if (loading) {
    return <LoadingScreen message="Loading cancellation requests..." />;
  }

  return (
    <div className="min-h-screen" style={{ background: BRAND.bg }}>
      {/* Background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl opacity-[0.06]" style={{ background: BRAND.amber }} />
        <div className="absolute top-40 -left-40 w-80 h-80 rounded-full blur-3xl opacity-[0.05]" style={{ background: '#f87171' }} />
        <div className="absolute bottom-40 right-40 w-80 h-80 rounded-full blur-3xl opacity-[0.04]" style={{ background: BRAND.amber }} />
      </div>

      {/* Header */}
      <header className="relative border-b" style={{ background: 'rgba(13,16,37,0.8)', backdropFilter: 'blur(16px)', borderColor: BRAND.border }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => navigate('/dashboard?role=ORGANIZER')}
            className="flex items-center gap-2 mb-4 group transition-colors"
            style={{ color: 'rgba(255,255,255,0.45)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </button>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg,#fbbf24,#f59e0b)' }}>
                  <AlertTriangle className="w-6 h-6" style={{ color: '#050810' }} />
                </div>
                Cancellation Requests
              </h1>
              <p className="mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>Review and process refund requests</p>
            </div>
            <button
              onClick={fetchRequests}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors"
              style={{ background: BRAND.card, color: 'rgba(255,255,255,0.7)', borderColor: BRAND.border }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#ffffff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = BRAND.card; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}>
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2 mr-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
            <Filter className="w-4 h-4" />
            <span className="text-sm">Filter:</span>
          </div>
          {['all', 'pending', 'processed'].map((status) => {
            const isActive = filter === status;
            return (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300"
                style={isActive
                  ? status === 'pending'
                    ? { background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', color: '#050810', boxShadow: '0 4px 15px rgba(251,191,36,0.3)' }
                    : { background: 'linear-gradient(135deg,#FCD34D,#a855f7)', color: '#050810', boxShadow: '0 4px 15px rgba(245,158,11,0.3)' }
                  : { background: BRAND.card, color: 'rgba(255,255,255,0.55)', border: `1px solid ${BRAND.border}` }
                }
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                <span className="ml-1.5 text-xs opacity-75">
                  ({status === 'all'
                    ? requests.length
                    : status === 'pending'
                      ? requests.filter(r => r.status === 'cancellation_requested').length
                      : requests.filter(r => r.status === 'cancelled' || r.refundStatus === 'rejected').length
                  })
                </span>
              </button>
            );
          })}
        </div>

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center rounded-2xl" style={{ background: BRAND.cardDark, border: `1px solid ${BRAND.border}` }}>
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(251,191,36,0.1)' }}>
              <AlertTriangle className="w-10 h-10" style={{ color: BRAND.amber }} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No requests found</h3>
            <p style={{ color: 'rgba(255,255,255,0.45)' }}>
              {filter === 'pending'
                ? 'No pending cancellation requests'
                : filter === 'processed'
                  ? 'No processed requests yet'
                  : 'No cancellation requests yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <div
                key={request.id}
                className="p-5 rounded-2xl cursor-pointer transition-all"
                style={{ background: BRAND.cardDark, border: `1px solid ${BRAND.border}` }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(251,191,36,0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = BRAND.border}
                onClick={() => navigate(`/organizer/cancellation/${request.id}`)}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Player & Tournament Info */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(251,191,36,0.1)' }}>
                      <User className="w-6 h-6" style={{ color: BRAND.amber }} />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">{request.user?.name}</h3>
                      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>{request.user?.email}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Trophy className="w-4 h-4" style={{ color: BRAND.purple }} />
                        <span className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{request.tournament?.name}</span>
                        <span style={{ color: 'rgba(255,255,255,0.25)' }}>•</span>
                        <span className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>{request.category?.name}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status & Amount */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-lg" style={{ color: BRAND.green }}>&#8377;{request.refundAmount || request.amountTotal}</p>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{formatDateIndian(request.updatedAt)}</p>
                    </div>
                    {getStatusBadge(request)}
                    <button
                      className="p-2 rounded-lg transition-colors"
                      style={{ background: 'rgba(245,158,11,0.12)', color: BRAND.cyan }}
                      title="View Details"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Cancellation Reason Preview */}
                {request.cancellationReason && (
                  <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${BRAND.border}` }}>
                    <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Reason:</p>
                    <p className="text-sm line-clamp-2" style={{ color: 'rgba(255,255,255,0.65)' }}>{request.cancellationReason}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}


