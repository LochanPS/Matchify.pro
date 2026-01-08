import { useState } from 'react';
import adminService from '../../services/adminService';

const InviteList = ({ invites, onInviteRevoked }) => {
  const [revoking, setRevoking] = useState(null);

  const handleRevoke = async (inviteId) => {
    if (!confirm('Are you sure you want to revoke this invite?')) return;

    setRevoking(inviteId);
    try {
      await adminService.revokeInvite(inviteId);
      onInviteRevoked(inviteId);
      alert('Invite revoked successfully');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to revoke invite');
    } finally {
      setRevoking(null);
    }
  };

  const handleDelete = async (inviteId) => {
    if (!confirm('Are you sure you want to delete this invite? This cannot be undone.')) return;

    try {
      await adminService.deleteInvite(inviteId);
      onInviteRevoked(inviteId);
      alert('Invite deleted successfully');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete invite');
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
      <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
        No invites found
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
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
                Expires At
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created At
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {invites.map((invite) => (
              <tr key={invite.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {invite.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getRoleBadge(invite.role)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(invite.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {invite.invitedBy || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(invite.expiresAt).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(invite.createdAt).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  {invite.status === 'pending' && (
                    <button
                      onClick={() => handleRevoke(invite.id)}
                      disabled={revoking === invite.id}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      title="Revoke Invite"
                    >
                      {revoking === invite.id ? 'Revoking...' : '🚫 Revoke'}
                    </button>
                  )}
                  {(invite.status === 'revoked' || invite.status === 'expired') && (
                    <button
                      onClick={() => handleDelete(invite.id)}
                      className="text-gray-600 hover:text-gray-900"
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
  );
};

export default InviteList;
