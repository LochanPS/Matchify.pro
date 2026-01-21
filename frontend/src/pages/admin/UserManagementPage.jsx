import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle, X, UserX, UserCheck, ArrowLeft } from 'lucide-react';
import adminService from '../../services/adminService';
import UserDetailsModal from '../../components/admin/UserDetailsModal';

const UserManagementPage = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  
  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Modals
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [suspendModal, setSuspendModal] = useState(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendDuration, setSuspendDuration] = useState('7');
  const [alertModal, setAlertModal] = useState(null);
  const [unsuspendModal, setUnsuspendModal] = useState(null);
  const [loginAsModal, setLoginAsModal] = useState(null);
  const [loginAsPasscode, setLoginAsPasscode] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getUsers({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined
      });
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
    fetchUsers();
  };

  const handleSuspend = async () => {
    if (!suspendReason.trim() || suspendReason.length < 10) {
      setAlertModal({ type: 'error', message: 'Please provide a reason (at least 10 characters)' });
      return;
    }

    try {
      await adminService.suspendUser(suspendModal.id, suspendReason, parseInt(suspendDuration));
      setAlertModal({ type: 'success', message: 'User suspended successfully' });
      setSuspendModal(null);
      setSuspendReason('');
      setSuspendDuration('7');
      fetchUsers();
    } catch (err) {
      setAlertModal({ type: 'error', message: err.response?.data?.message || 'Failed to suspend user' });
    }
  };

  const handleUnsuspend = async (userId) => {
    setUnsuspendModal({ userId });
  };

  const confirmUnsuspend = async () => {
    try {
      await adminService.unsuspendUser(unsuspendModal.userId);
      setAlertModal({ type: 'success', message: 'User unsuspended successfully' });
      setUnsuspendModal(null);
      fetchUsers();
    } catch (err) {
      setAlertModal({ type: 'error', message: err.response?.data?.message || 'Failed to unsuspend user' });
      setUnsuspendModal(null);
    }
  };

  const handleLoginAs = (user) => {
    setLoginAsModal(user);
    setLoginAsPasscode('');
  };

  const confirmLoginAs = async () => {
    // Verify passcode
    if (loginAsPasscode !== 'ADMIN@123(123)') {
      setAlertModal({ type: 'error', message: 'Invalid passcode' });
      return;
    }

    try {
      const response = await adminService.loginAsUser(loginAsModal.id);
      
      // Store the new token
      localStorage.setItem('token', response.token);
      
      // Reload the page to apply the new user context
      window.location.href = '/dashboard';
    } catch (err) {
      setAlertModal({ type: 'error', message: err.response?.data?.message || 'Failed to login as user' });
      setLoginAsModal(null);
      setLoginAsPasscode('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-400 hover:text-teal-400 mb-6 transition-colors group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span>Back</span>
      </button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">User Management</h1>
        <p className="text-gray-400 mt-2">Search, view, and manage platform users</p>
      </div>

      {/* Filters */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-6">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Search
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, email, or phone..."
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder-gray-400"
            />
          </div>

          {/* Role Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Role
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="">All Roles</option>
              <option value="PLAYER">Player</option>
              <option value="ORGANIZER">Organizer</option>
              <option value="UMPIRE">Umpire</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>

          {/* Search Button */}
          <div className="md:col-span-4">
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white rounded-lg transition font-medium"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 mb-6 text-red-400">
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            No users found
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900 border-b border-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Activity
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-700/50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-white">{user.name}</div>
                          <div className="text-sm text-gray-400">{user.email}</div>
                          {user.phone && (
                            <div className="text-sm text-gray-400">{user.phone}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          user.role === 'ADMIN' ? 'bg-red-500/20 text-red-400' :
                          user.role === 'ORGANIZER' ? 'bg-blue-500/20 text-blue-400' :
                          user.role === 'UMPIRE' ? 'bg-green-500/20 text-green-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {user.city && user.state ? `${user.city}, ${user.state}` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.isSuspended ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded bg-red-500/20 text-red-400">
                            Suspended
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-semibold rounded bg-green-500/20 text-green-400">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        <div>Registrations: {user._count.registrations}</div>
                        <div>Tournaments: {user._count.tournaments}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setSelectedUserId(user.id)}
                          className="text-teal-400 hover:text-teal-300 mr-3 transition"
                          title="View Details"
                        >
                          👁️
                        </button>
                        {user.role !== 'ADMIN' && (
                          <button
                            onClick={() => handleLoginAs(user)}
                            className="text-blue-400 hover:text-blue-300 mr-3 transition"
                            title="Login as User"
                          >
                            🔐
                          </button>
                        )}
                        {user.isSuspended ? (
                          <button
                            onClick={() => handleUnsuspend(user.id)}
                            className="text-green-400 hover:text-green-300 transition"
                            title="Unsuspend"
                          >
                            ✅
                          </button>
                        ) : user.role !== 'ADMIN' ? (
                          <button
                            onClick={() => setSuspendModal(user)}
                            className="text-red-400 hover:text-red-300 transition"
                            title="Suspend"
                          >
                            🚫
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between border-t border-slate-700">
              <div className="text-sm text-gray-400">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} users
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm font-medium text-gray-300 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm font-medium text-gray-300 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* User Details Modal */}
      {selectedUserId && (
        <UserDetailsModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}

      {/* Suspend Modal */}
      {suspendModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative w-full max-w-md">
            <div className="absolute -inset-2 bg-gradient-to-r from-red-500 to-rose-500 rounded-3xl blur-xl opacity-50"></div>
            <div className="relative bg-slate-800 rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-500/20 rounded-lg">
                      <UserX className="w-5 h-5 text-red-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Suspend User</h2>
                  </div>
                  <button
                    onClick={() => {
                      setSuspendModal(null);
                      setSuspendReason('');
                      setSuspendDuration('7');
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-gray-300">
                  You are about to suspend <strong className="text-white">{suspendModal.name}</strong>
                </p>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Reason *
                  </label>
                  <textarea
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                    placeholder="Provide a detailed reason for suspension..."
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent placeholder-gray-400"
                    rows="4"
                  />
                  <p className="text-xs text-gray-400 mt-1">Minimum 10 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Duration (days) *
                  </label>
                  <select
                    value={suspendDuration}
                    onChange={(e) => setSuspendDuration(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="1">1 day</option>
                    <option value="3">3 days</option>
                    <option value="7">7 days</option>
                    <option value="14">14 days</option>
                    <option value="30">30 days</option>
                    <option value="90">90 days</option>
                    <option value="365">365 days</option>
                  </select>
                </div>
              </div>

              <div className="p-6 bg-slate-900/50 border-t border-white/10 flex gap-3">
                <button
                  onClick={() => {
                    setSuspendModal(null);
                    setSuspendReason('');
                    setSuspendDuration('7');
                  }}
                  className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSuspend}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white rounded-xl transition-colors font-medium"
                >
                  Suspend User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unsuspend Confirmation Modal */}
      {unsuspendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-md">
            <div className="absolute -inset-2 bg-gradient-to-r from-green-500 via-emerald-500 to-green-500 rounded-3xl blur-xl opacity-50"></div>
            <div className="relative bg-slate-800 rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <UserCheck className="w-5 h-5 text-green-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Unsuspend User</h3>
                  </div>
                  <button onClick={() => setUnsuspendModal(null)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-gray-300">Are you sure you want to unsuspend this user?</p>
                <p className="text-sm text-gray-400">They will regain full access to their account.</p>
              </div>
              <div className="p-6 bg-slate-900/50 border-t border-white/10 flex gap-3">
                <button
                  onClick={() => setUnsuspendModal(null)}
                  className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmUnsuspend}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl transition-colors font-medium"
                >
                  Unsuspend
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {alertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-sm">
            <div className={`absolute -inset-2 bg-gradient-to-r ${alertModal.type === 'success' ? 'from-emerald-500 to-teal-500' : 'from-red-500 to-rose-500'} rounded-3xl blur-xl opacity-50`}></div>
            <div className="relative bg-slate-800 rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-6 text-center">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${alertModal.type === 'success' ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                  {alertModal.type === 'success' ? (
                    <CheckCircle className="w-8 h-8 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-8 h-8 text-red-400" />
                  )}
                </div>
                <h3 className={`text-lg font-semibold ${alertModal.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {alertModal.type === 'success' ? 'Success!' : 'Error'}
                </h3>
                <p className="text-gray-300 mt-2">{alertModal.message}</p>
              </div>
              <div className="p-4 bg-slate-900/50 border-t border-white/10">
                <button
                  onClick={() => setAlertModal(null)}
                  className={`w-full px-4 py-3 rounded-xl font-medium transition-colors ${
                    alertModal.type === 'success'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white'
                      : 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white'
                  }`}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Login As User Modal */}
      {loginAsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-md">
            <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl blur-xl opacity-50"></div>
            <div className="relative bg-slate-800 rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <span className="text-2xl">🔐</span>
                    </div>
                    <h2 className="text-xl font-bold text-white">Login as User</h2>
                  </div>
                  <button
                    onClick={() => {
                      setLoginAsModal(null);
                      setLoginAsPasscode('');
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <p className="text-blue-400 text-sm">
                    ⚠️ You are about to impersonate <strong className="text-white">{loginAsModal.name}</strong>
                  </p>
                  <p className="text-blue-300 text-xs mt-2">
                    The user will not be notified. You will have full access to their account.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Admin Passcode *
                  </label>
                  <input
                    type="password"
                    value={loginAsPasscode}
                    onChange={(e) => setLoginAsPasscode(e.target.value)}
                    placeholder="Enter admin passcode..."
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        confirmLoginAs();
                      }
                    }}
                  />
                  <p className="text-xs text-gray-400 mt-1">Required for security verification</p>
                </div>
              </div>

              <div className="p-6 bg-slate-900/50 border-t border-white/10 flex gap-3">
                <button
                  onClick={() => {
                    setLoginAsModal(null);
                    setLoginAsPasscode('');
                  }}
                  className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLoginAs}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl transition-colors font-medium"
                >
                  Login as User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;
