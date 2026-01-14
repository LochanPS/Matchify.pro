import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, X, UserX, UserCheck } from 'lucide-react';
import adminService from '../../services/adminService';
import UserDetailsModal from '../../components/admin/UserDetailsModal';

const UserManagementPage = () => {
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

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600 mt-2">Search, view, and manage platform users</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, email, or phone..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Role Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-800">
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No users found
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Activity
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          {user.phone && (
                            <div className="text-sm text-gray-500">{user.phone}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                          user.role === 'ORGANIZER' ? 'bg-blue-100 text-blue-800' :
                          user.role === 'UMPIRE' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.city && user.state ? `${user.city}, ${user.state}` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.isSuspended ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800">
                            Suspended
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>Registrations: {user._count.registrations}</div>
                        <div>Tournaments: {user._count.tournaments}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setSelectedUserId(user.id)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                          title="View Details"
                        >
                          👁️
                        </button>
                        {user.isSuspended ? (
                          <button
                            onClick={() => handleUnsuspend(user.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Unsuspend"
                          >
                            ✅
                          </button>
                        ) : user.role !== 'ADMIN' ? (
                          <button
                            onClick={() => setSuspendModal(user)}
                            className="text-red-600 hover:text-red-900"
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
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
              <div className="text-sm text-gray-700">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} users
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Suspend User</h2>
            <p className="text-gray-600 mb-4">
              You are about to suspend <strong>{suspendModal.name}</strong>
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason *
              </label>
              <textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Provide a detailed reason for suspension..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="4"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 10 characters</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (days) *
              </label>
              <select
                value={suspendDuration}
                onChange={(e) => setSuspendDuration(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setSuspendModal(null);
                  setSuspendReason('');
                  setSuspendDuration('7');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSuspend}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Suspend User
              </button>
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
    </div>
  );
};

export default UserManagementPage;
