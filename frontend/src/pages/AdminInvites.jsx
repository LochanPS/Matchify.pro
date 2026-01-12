import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { 
  Mail, 
  UserPlus, 
  Shield, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Trash2,
  AlertTriangle,
  X,
  Send,
  Filter
} from 'lucide-react';

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

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState(null); // { type: 'revoke' | 'delete', invite }

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
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/admin/invites/${inviteId}/revoke`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setConfirmModal(null);
      fetchInvites();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to revoke invite');
      setConfirmModal(null);
    }
  };

  const handleDeleteInvite = async (inviteId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/admin/invites/${inviteId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setConfirmModal(null);
      fetchInvites();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete invite');
      setConfirmModal(null);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-warning',
      accepted: 'badge-success',
      revoked: 'badge-error',
      expired: 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
    };
    return badges[status] || badges.pending;
  };

  const getRoleBadge = (role) => {
    const badges = {
      ADMIN: 'bg-red-500/20 text-red-400 border border-red-500/30',
      ORGANIZER: 'badge-info',
      UMPIRE: 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
    };
    return badges[role] || badges.ORGANIZER;
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'ADMIN': return <Shield className="w-4 h-4" />;
      case 'ORGANIZER': return <Users className="w-4 h-4" />;
      case 'UMPIRE': return <UserPlus className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const isExpired = (expiresAt) => {
    return new Date(expiresAt) < new Date();
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-blob"></div>
          <div className="absolute top-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        </div>
        
        <div className="relative text-center">
          <div className="spinner-premium mx-auto mb-4"></div>
          <p className="text-gray-400">Loading invites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute top-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-40 right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="relative border-b border-white/10 bg-slate-900/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                Admin Invites
              </h1>
              <p className="text-gray-400 mt-1">Manage user invitations for Matchify.pro</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-premium flex items-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              Create Invite
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 alert-success flex items-center gap-3 animate-fade-in-up">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 alert-error flex items-center gap-3 animate-fade-in-up">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError('')} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-2">
          <div className="flex items-center gap-2 text-gray-400 mr-2">
            <Filter className="w-4 h-4" />
            <span className="text-sm">Filter:</span>
          </div>
          {['all', 'pending', 'accepted', 'revoked'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                filter === status
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Invites List */}
        {invites.length === 0 ? (
          <div className="glass-card-dark p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-10 h-10 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No invites found</h3>
            <p className="text-gray-400 mb-6">Create your first invite to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-premium"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Create Invite
            </button>
          </div>
        ) : (
          <div className="glass-card-dark overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Invited By
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Expires
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {invites.map((invite) => (
                    <tr key={invite.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center">
                            <Mail className="w-5 h-5 text-blue-400" />
                          </div>
                          <span className="text-white font-medium">{invite.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`badge ${getRoleBadge(invite.role)} flex items-center gap-1.5 w-fit`}>
                          {getRoleIcon(invite.role)}
                          {invite.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`badge ${getStatusBadge(
                          isExpired(invite.expiresAt) && invite.status === 'pending' ? 'expired' : invite.status
                        )}`}>
                          {isExpired(invite.expiresAt) && invite.status === 'pending' ? 'Expired' : invite.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-white">{invite.invitedBy}</div>
                        <div className="text-xs text-gray-500">{invite.inviterEmail}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                        {formatDate(invite.expiresAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          {invite.status === 'pending' && !isExpired(invite.expiresAt) && (
                            <button
                              onClick={() => setConfirmModal({ type: 'revoke', invite })}
                              className="p-2 bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30 transition-colors"
                              title="Revoke Invite"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setConfirmModal({ type: 'delete', invite })}
                            className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                            title="Delete Invite"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Create Invite Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div 
            className="modal-content max-w-md animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                Create Invite
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormError('');
                  setFormData({ email: '', role: 'ORGANIZER' });
                }}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            {formError && (
              <div className="mb-4 alert-error text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateInvite}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-premium"
                  placeholder="user@example.com"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="input-premium"
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
                  className="flex-1 px-4 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors font-medium"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-premium flex items-center justify-center gap-2"
                  disabled={submitting}
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Invite
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="modal-overlay" onClick={() => setConfirmModal(null)}>
          <div 
            className="modal-content max-w-md animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {confirmModal.type === 'revoke' && (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/30">
                    <XCircle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Revoke Invite?</h3>
                  <p className="text-gray-400">
                    Are you sure you want to revoke the invite for{' '}
                    <span className="text-orange-400 font-medium">{confirmModal.invite.email}</span>?
                  </p>
                </div>
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 mb-6">
                  <p className="text-sm text-orange-300">
                    This will prevent the user from accepting this invitation.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmModal(null)}
                    className="flex-1 px-4 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleRevokeInvite(confirmModal.invite.id)}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all font-semibold"
                  >
                    Revoke
                  </button>
                </div>
              </>
            )}

            {confirmModal.type === 'delete' && (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/30">
                    <Trash2 className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Delete Invite?</h3>
                  <p className="text-gray-400">
                    Are you sure you want to delete the invite for{' '}
                    <span className="text-red-400 font-medium">{confirmModal.invite.email}</span>?
                  </p>
                </div>
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
                  <p className="text-sm text-red-300">
                    This action cannot be undone. The invite record will be permanently removed.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmModal(null)}
                    className="flex-1 px-4 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteInvite(confirmModal.invite.id)}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:shadow-lg hover:shadow-red-500/30 transition-all font-semibold"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInvites;
