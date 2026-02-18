import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
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
      setError(err.response?.data?.error || 'Failed to load cancellation requests');
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
      return <span className="badge badge-warning">Pending</span>;
    }
    if (request.status === 'cancelled') {
      return <span className="badge badge-success">Approved</span>;
    }
    if (request.refundStatus === 'rejected') {
      return <span className="badge badge-error">Rejected</span>;
    }
    return <span className="badge bg-gray-500/20 text-gray-400 border border-gray-500/30">Unknown</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500/20 rounded-full blur-3xl animate-blob"></div>
          <div className="absolute top-40 -left-40 w-80 h-80 bg-red-500/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        </div>
        <div className="relative text-center">
          <div className="spinner-premium mx-auto mb-4"></div>
          <p className="text-gray-400">Loading cancellation requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute top-40 -left-40 w-80 h-80 bg-red-500/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-40 right-40 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="relative border-b border-white/10 bg-slate-900/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => navigate('/dashboard?role=ORGANIZER')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4 group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </button>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                Cancellation Requests
              </h1>
              <p className="text-gray-400 mt-1">Review and process refund requests</p>
            </div>
            <button
              onClick={fetchRequests}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors border border-white/10"
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
          <div className="mb-6 alert-error flex items-center gap-3 animate-fade-in-up">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2 text-gray-400 mr-2">
            <Filter className="w-4 h-4" />
            <span className="text-sm">Filter:</span>
          </div>
          {['all', 'pending', 'processed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                filter === status
                  ? status === 'pending'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/25'
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
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
          ))}
        </div>

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <div className="glass-card-dark p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-10 h-10 text-orange-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No requests found</h3>
            <p className="text-gray-400">
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
                className="glass-card-dark p-5 hover:border-orange-500/30 transition-all cursor-pointer"
                onClick={() => navigate(`/organizer/cancellation/${request.id}`)}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Player & Tournament Info */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">{request.user?.name}</h3>
                      <p className="text-gray-400 text-sm">{request.user?.email}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Trophy className="w-4 h-4 text-purple-400" />
                        <span className="text-gray-300 text-sm">{request.tournament?.name}</span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-400 text-sm">{request.category?.name}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status & Amount */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-emerald-400 font-bold text-lg">₹{request.refundAmount || request.amountTotal}</p>
                      <p className="text-gray-500 text-xs">{formatDateIndian(request.updatedAt)}</p>
                    </div>
                    {getStatusBadge(request)}
                    <button
                      className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Cancellation Reason Preview */}
                {request.cancellationReason && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-gray-500 text-xs mb-1">Reason:</p>
                    <p className="text-gray-300 text-sm line-clamp-2">{request.cancellationReason}</p>
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
