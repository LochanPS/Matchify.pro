import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getTournamentRegistrations,
  exportParticipants,
  updateTournamentStatus,
  approveRegistration,
  rejectRegistration,
  removeRegistration,
} from '../api/organizer';
import { formatDateIndian } from '../utils/dateFormat';
import {
  Users,
  Download,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  Clock,
  XCircle,
  ArrowLeft,
  Trash2,
  Check,
  X,
} from 'lucide-react';

export default function TournamentManagementPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [exporting, setExporting] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchRegistrations();
  }, [id]);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const data = await getTournamentRegistrations(id);
      setRegistrations(data.registrations || []);
    } catch (error) {
      console.error('Error fetching registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (registrationId) => {
    if (!confirm('Approve this registration? This confirms the player has paid.')) return;
    
    try {
      setActionLoading(registrationId);
      await approveRegistration(registrationId);
      await fetchRegistrations();
      alert('Registration approved! ✅');
    } catch (error) {
      console.error('Error approving registration:', error);
      alert('Failed to approve registration');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (registrationId) => {
    const reason = prompt('Reason for rejection (optional):');
    if (reason === null) return; // User cancelled
    
    try {
      setActionLoading(registrationId);
      await rejectRegistration(registrationId, reason);
      await fetchRegistrations();
      alert('Registration rejected');
    } catch (error) {
      console.error('Error rejecting registration:', error);
      alert('Failed to reject registration');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemove = async (registrationId, playerName) => {
    if (!confirm(`Remove ${playerName} from this tournament? This action cannot be undone.`)) return;
    
    try {
      setActionLoading(registrationId);
      await removeRegistration(registrationId);
      await fetchRegistrations();
      alert('Player removed from tournament');
    } catch (error) {
      console.error('Error removing registration:', error);
      alert('Failed to remove player');
    } finally {
      setActionLoading(null);
    }
  };

  const handleExport = async (format) => {
    try {
      setExporting(true);
      const data = await exportParticipants(id, format);

      if (format === 'csv') {
        // Create download link for CSV
        const blob = new Blob([data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tournament-${id}-participants.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        // Download JSON
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tournament-${id}-participants.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export participants');
    } finally {
      setExporting(false);
    }
  };

  const filteredRegistrations = registrations.filter((reg) => {
    if (filter === 'all') return true;
    return reg.status === filter;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      confirmed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
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
          <button
            onClick={() => navigate('/organizer/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tournament Registrations</h1>
              <p className="text-gray-600 mt-1">
                {filteredRegistrations.length} registrations
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleExport('json')}
                disabled={exporting}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                Export JSON
              </button>
              <button
                onClick={() => handleExport('csv')}
                disabled={exporting}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-2">
          {['all', 'confirmed', 'pending', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {status === 'all' && ` (${registrations.length})`}
              {status !== 'all' &&
                ` (${registrations.filter((r) => r.status === status).length})`}
            </button>
          ))}
        </div>

        {/* Registrations Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {filteredRegistrations.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No registrations found</h3>
              <p className="text-gray-600">
                {filter === 'all'
                  ? 'No one has registered for this tournament yet'
                  : `No ${filter} registrations`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Player
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Partner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRegistrations.map((registration) => (
                    <tr key={registration.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {registration.user.name}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {registration.user.email}
                            </div>
                            {registration.user.phone && (
                              <div className="text-sm text-gray-500 flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {registration.user.phone}
                              </div>
                            )}
                            {registration.user.city && (
                              <div className="text-sm text-gray-500 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {registration.user.city}, {registration.user.state}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{registration.category.name}</div>
                        <div className="text-sm text-gray-500">
                          {registration.category.format} • {registration.category.gender}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {registration.partner ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {registration.partner.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {registration.partnerConfirmed ? (
                                <span className="text-green-600">✓ Confirmed</span>
                              ) : (
                                <span className="text-yellow-600">⏳ Pending</span>
                              )}
                            </div>
                          </div>
                        ) : registration.partnerEmail ? (
                          <div>
                            <div className="text-sm text-gray-500">{registration.partnerEmail}</div>
                            <div className="text-sm text-yellow-600">⏳ Pending</div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ₹{registration.amountTotal}
                        </div>
                        <div className="text-xs text-gray-500">
                          {registration.paymentStatus}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(registration.status)}
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(
                              registration.status
                            )}`}
                          >
                            {registration.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateIndian(registration.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          {registration.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(registration.id)}
                                disabled={actionLoading === registration.id}
                                className="px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 text-sm font-medium flex items-center gap-1 shadow-sm"
                                title="Approve (Payment Verified)"
                              >
                                <Check className="h-4 w-4" />
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(registration.id)}
                                disabled={actionLoading === registration.id}
                                className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 text-sm font-medium flex items-center gap-1 shadow-sm"
                                title="Reject"
                              >
                                <X className="h-4 w-4" />
                                Reject
                              </button>
                            </>
                          )}
                          {registration.status === 'confirmed' && (
                            <button
                              onClick={() => handleRemove(registration.id, registration.user.name)}
                              disabled={actionLoading === registration.id}
                              className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 text-sm font-medium flex items-center gap-1 shadow-sm"
                              title="Remove Player"
                            >
                              <Trash2 className="h-4 w-4" />
                              Remove
                            </button>
                          )}
                          {registration.status === 'cancelled' && (
                            <span className="text-sm text-gray-400 italic">No actions</span>
                          )}
                          {actionLoading === registration.id && (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 ml-2"></div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
