import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const AdminInvites = () => {
  const { user } = useAuth();
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState('all');
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    role: 'ORGANIZER'
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchInvites();
  }, [filter]);

  const fetchInvites = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = filter !== 'all' ? { status: filter } : {};
      
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/invites`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      if (response.data.success) {
        setInvites(response.data.data.invites);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch invites');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvite = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    setSuccessMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/admin/invites`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSuccessMessage('Invite sent successfully!');
        setFormData({ email: '', role: 'ORGANIZER' });
        setShowCreateModal(false);
        fetchInvites();
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to create invite');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevokeInvite = async (inviteId) => {
    if (!confirm('Are you sure you want to revoke this invite?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/admin/invites/${inviteId}/revoke`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchInvites();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to revoke invite');
    }
  };

  const handleDeleteInvite = async (inviteId) => {
    if (!confirm('Are you sure you want to delete this invite?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/admin/invites/${inviteId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchInvites();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete invite');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      revoked: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800'
    };
    return badges[status] || badges.pending;
  };

  const getRoleBadge = (role) => {
    const badges = {
      ADMIN: 'bg-red-100 text-red-800',
      ORGANIZER: 'bg-blue-100 text-blue-800',
      UMPIRE: 'bg-purple-100 text-purple-800'
    };
    return badges[role] || badges.ORGANIZER;
  };

  const isExpired = (expiresAt) => {
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Invites</h1>
              <p className="text-gray-600 mt-1">Manage user invitations</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              + Create Invite
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'pending'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('accepted')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'accepted'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Accepted
          </button>
          <button
            onClick={() => setFilter('revoked')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'revoked'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Revoked
          </button>
        </div>

        {/* Invites List */}
        {invites.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📧</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No invites found</h3>
            <p className="text-gray-600">Create your first invite to get started</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invited By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expires
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invites.map((invite) => (
                  <tr key={invite.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{invite.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadge(invite.role)}`}>
                        {invite.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(
                        isExpired(invite.expiresAt) && invite.status === 'pending' ? 'expired' : invite.status
                      )}`}>
                        {isExpired(invite.expiresAt) && invite.status === 'pending' ? 'Expired' : invite.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{invite.invitedBy}</div>
                      <div className="text-xs text-gray-500">{invite.inviterEmail}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(invite.expiresAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {invite.status === 'pending' && !isExpired(invite.expiresAt) && (
                        <button
                          onClick={() => handleRevokeInvite(invite.id)}
                          className="text-red-600 hover:text-red-900 mr-3"
                        >
                          Revoke
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteInvite(invite.id)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Create Invite Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Create Invite</h2>
            
            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateInvite}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="user@example.com"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="ORGANIZER">Organizer</option>
                  <option value="UMPIRE">Umpire</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormError('');
                    setFormData({ email: '', role: 'ORGANIZER' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInvites;
