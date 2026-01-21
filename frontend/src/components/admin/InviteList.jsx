import { useState } from 'react';
import { AlertTriangle, CheckCircle, X, Ban, Trash2 } from 'lucide-react';
import adminService from '../../services/adminService';

const InviteList = ({ invites, onInviteRevoked }) => {
  const [revoking, setRevoking] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [alertModal, setAlertModal] = useState(null);

  const handleRevoke = async (inviteId) => {
    setConfirmModal({ type: 'revoke', inviteId });
  };

  const confirmRevoke = async () => {
    const inviteId = confirmModal.inviteId;
    setConfirmModal(null);
    setRevoking(inviteId);
    try {
      await adminService.revokeInvite(inviteId);
      onInviteRevoked(inviteId);
      setAlertModal({ type: 'success', message: 'Invite revoked successfully' });
    } catch (err) {
      setAlertModal({ type: 'error', message: err.response?.data?.error || 'Failed to revoke invite' });
    } finally {
      setRevoking(null);
    }
  };

  const handleDelete = async (inviteId) => {
    setConfirmModal({ type: 'delete', inviteId });
  };

  const confirmDelete = async () => {
    const inviteId = confirmModal.inviteId;
    setConfirmModal(null);
    try {
      await adminService.deleteInvite(inviteId);
      onInviteRevoked(inviteId);
      setAlertModal({ type: 'success', message: 'Invite deleted successfully' });
    } catch (err) {
      setAlertModal({ type: 'error', message: err.response?.data?.error || 'Failed to delete invite' });
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      expired: 'bg-gray-100 text-gray-800',
      revoked: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const getRoleBadge = (role) => {
    const styles = {
      ADMIN: 'bg-red-100 text-red-800',
      ORGANIZER: 'bg-blue-100 text-blue-800',
      UMPIRE: 'bg-green-100 text-green-800'
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[role] || 'bg-gray-100 text-gray-800'}`}>
        {role}
      </span>
    );
  };

  if (invites.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg shadow-lg border border-slate-700 p-12 text-center text-gray-400">
        No invites found
      </div>
    );
  }

  return (
    <>
      <div className="bg-slate-800 rounded-lg shadow-lg border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Invited By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Expires At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Created At
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-slate-800 divide-y divide-slate-700">
              {invites.map((invite) => (
                <tr key={invite.id} className="hover:bg-slate-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    {invite.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRoleBadge(invite.role)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(invite.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {invite.invitedBy || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {new Date(invite.expiresAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {new Date(invite.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    {invite.status === 'pending' && (
                      <button
                        onClick={() => handleRevoke(invite.id)}
                        disabled={revoking === invite.id}
                        className="text-red-400 hover:text-red-300 disabled:opacity-50"
                        title="Revoke Invite"
                      >
                        {revoking === invite.id ? 'Revoking...' : '🚫 Revoke'}
                      </button>
                    )}
                    {(invite.status === 'revoked' || invite.status === 'expired') && (
                      <button
                        onClick={() => handleDelete(invite.id)}
                        className="text-gray-400 hover:text-gray-300"
                        title="Delete Invite"
                      >
                        🗑️ Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-md">
            <div className={`absolute -inset-2 bg-gradient-to-r ${confirmModal.type === 'delete' ? 'from-gray-500 to-slate-500' : 'from-red-500 to-rose-500'} rounded-3xl blur-xl opacity-50`}></div>
            <div className="relative bg-slate-800 rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${confirmModal.type === 'delete' ? 'bg-gray-500/20' : 'bg-red-500/20'}`}>
                      {confirmModal.type === 'delete' ? (
                        <Trash2 className="w-5 h-5 text-gray-400" />
                      ) : (
                        <Ban className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-white">
                      {confirmModal.type === 'delete' ? 'Delete Invite' : 'Revoke Invite'}
                    </h3>
                  </div>
                  <button onClick={() => setConfirmModal(null)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-gray-300">
                  {confirmModal.type === 'delete' 
                    ? 'Are you sure you want to delete this invite? This cannot be undone.'
                    : 'Are you sure you want to revoke this invite?'}
                </p>
              </div>
              <div className="p-6 bg-slate-900/50 border-t border-white/10 flex gap-3">
                <button
                  onClick={() => setConfirmModal(null)}
                  className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmModal.type === 'delete' ? confirmDelete : confirmRevoke}
                  className={`flex-1 px-4 py-3 text-white rounded-xl transition-colors font-medium ${
                    confirmModal.type === 'delete' 
                      ? 'bg-gradient-to-r from-gray-500 to-slate-500 hover:from-gray-600 hover:to-slate-600'
                      : 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600'
                  }`}
                >
                  {confirmModal.type === 'delete' ? 'Delete' : 'Revoke'}
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
    </>
  );
};

export default InviteList;
