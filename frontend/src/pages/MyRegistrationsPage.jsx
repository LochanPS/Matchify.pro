import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { registrationAPI } from '../api/registration';
import { Loader, Calendar, MapPin, Users, CreditCard, XCircle } from 'lucide-react';
import { formatDateIndian } from '../utils/dateFormat';

export default function MyRegistrationsPage() {
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    fetchRegistrations();
  }, [filter]);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const statusFilter = filter === 'all' ? null : filter;
      const response = await registrationAPI.getMyRegistrations(statusFilter);
      setRegistrations(response.registrations || []);
    } catch (err) {
      console.error('Error fetching registrations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRegistration = async (id) => {
    if (!confirm('Are you sure you want to cancel this registration?')) {
      return;
    }

    try {
      setCancelling(id);
      const response = await registrationAPI.cancelRegistration(id);
      alert(`Registration cancelled. Refund: ₹${response.refundAmount}`);
      fetchRegistrations();
    } catch (err) {
      console.error('Error cancelling registration:', err);
      alert(err.response?.data?.error || 'Failed to cancel registration');
    } finally {
      setCancelling(null);
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

  const getPaymentStatusBadge = (status) => {
    const styles = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-blue-100 text-blue-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="animate-spin h-8 w-8 text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            My Registrations
          </h1>
          <p className="text-gray-600">
            View and manage your tournament registrations
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-2">
          {['all', 'confirmed', 'pending', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Registrations List */}
        {registrations.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-gray-400 mb-4">
              <Calendar className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No registrations found
            </h3>
            <p className="text-gray-600 mb-6">
              You haven't registered for any tournaments yet
            </p>
            <button
              onClick={() => navigate('/tournaments')}
              className="btn-primary"
            >
              Browse Tournaments
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {registrations.map((registration) => (
              <div
                key={registration.id}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Tournament Name */}
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {registration.tournament.name}
                    </h3>

                    {/* Tournament Details */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {registration.tournament.city}, {registration.tournament.state}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDateIndian(registration.tournament.startDate)}
                      </div>
                    </div>

                    {/* Category */}
                    <div className="mb-3">
                      <span className="text-sm font-medium text-gray-700">Category: </span>
                      <span className="text-sm text-gray-900">
                        {registration.category.name}
                      </span>
                      <span className="ml-2 text-xs text-gray-500">
                        ({registration.category.format} • {registration.category.gender})
                      </span>
                    </div>

                    {/* Partner */}
                    {registration.category.format === 'doubles' && (
                      <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Doubles Partner:</p>
                        {!registration.partnerConfirmed && registration.partnerEmail && (
                          <div className="flex items-center text-yellow-600">
                            <span className="mr-2">⏳</span>
                            <span className="text-sm">Waiting for {registration.partnerEmail} to accept</span>
                          </div>
                        )}
                        {registration.partnerConfirmed && registration.partner && (
                          <div className="flex items-center text-green-600">
                            <Users className="h-4 w-4 mr-2" />
                            <span className="text-sm">{registration.partner.name} (Confirmed)</span>
                          </div>
                        )}
                        {!registration.partnerConfirmed && !registration.partnerEmail && registration.partner && (
                          <div className="flex items-center text-red-600">
                            <span className="mr-2">❌</span>
                            <span className="text-sm">Partner declined invitation</span>
                          </div>
                        )}
                      </div>
                    )}
                    {registration.partner && registration.category.format !== 'doubles' && (
                      <div className="mb-3 flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          Partner: {registration.partner.name}
                        </span>
                      </div>
                    )}

                    {/* Payment Details */}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <CreditCard className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Amount:</span>
                        <span className="font-medium text-gray-900">
                          ₹{registration.amountTotal}
                        </span>
                      </div>
                      <span className={`badge ${getPaymentStatusBadge(registration.paymentStatus)}`}>
                        {registration.paymentStatus}
                      </span>
                    </div>
                  </div>

                  {/* Status and Actions */}
                  <div className="flex flex-col items-end gap-3">
                    <span className={`badge ${getStatusBadge(registration.status)}`}>
                      {registration.status}
                    </span>

                    {registration.status === 'confirmed' && (
                      <button
                        onClick={() => handleCancelRegistration(registration.id)}
                        disabled={cancelling === registration.id}
                        className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        {cancelling === registration.id ? (
                          <>
                            <Loader className="h-4 w-4 animate-spin" />
                            Cancelling...
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4" />
                            Cancel
                          </>
                        )}
                      </button>
                    )}

                    <button
                      onClick={() => navigate(`/tournaments/${registration.tournament.id}`)}
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      View Tournament →
                    </button>
                  </div>
                </div>

                {/* Refund Info */}
                {registration.status === 'cancelled' && registration.refundAmount > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      Refund: <span className="font-medium text-green-600">₹{registration.refundAmount}</span>
                      {' • '}
                      Status: <span className="font-medium">{registration.refundStatus}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
