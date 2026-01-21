import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import adminService from '../../services/adminService';
import InviteForm from '../../components/admin/InviteForm';
import InviteList from '../../components/admin/InviteList';

const InviteManagementPage = () => {
  const navigate = useNavigate();
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(''); // '', 'pending', 'accepted', 'expired', 'revoked'
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });

  useEffect(() => {
    fetchInvites();
  }, [filter, pagination.page]);

  const fetchInvites = async () => {
    setLoading(true);
    try {
      const data = await adminService.getInvites({
        page: pagination.page,
        limit: pagination.limit,
        status: filter || undefined
      });
      setInvites(data.data.invites);
      setPagination(data.data.pagination);
    } catch (err) {
      console.error('Failed to fetch invites:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteCreated = () => {
    setPagination({ ...pagination, page: 1 });
    fetchInvites();
  };

  const handleInviteRevoked = (inviteId) => {
    setInvites(invites.filter(inv => inv.id !== inviteId));
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
        <h1 className="text-3xl font-bold text-white">Invite Management</h1>
        <p className="text-gray-400 mt-2">Generate and manage admin invitations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Invite Form */}
        <div className="lg:col-span-1">
          <InviteForm onInviteCreated={handleInviteCreated} />
        </div>

        {/* Right: Invite List */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">All Invites</h2>
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setPagination({ ...pagination, page: 1 });
              }}
              className="px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="">All Invites</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="expired">Expired</option>
              <option value="revoked">Revoked</option>
            </select>
          </div>

          {loading ? (
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
              <p className="mt-4 text-gray-400">Loading invites...</p>
            </div>
          ) : (
            <>
              <InviteList
                invites={invites}
                onInviteRevoked={handleInviteRevoked}
              />

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-6 bg-slate-800 border border-slate-700 rounded-lg shadow px-6 py-4 flex items-center justify-between">
                  <div className="text-sm text-gray-400">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} invites
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                      disabled={pagination.page === 1}
                      className="px-4 py-2 bg-slate-700 border border-slate-600 text-gray-300 rounded-lg text-sm font-medium hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                      disabled={pagination.page >= pagination.totalPages}
                      className="px-4 py-2 bg-slate-700 border border-slate-600 text-gray-300 rounded-lg text-sm font-medium hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InviteManagementPage;
