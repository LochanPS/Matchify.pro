import { useState } from 'react';
import adminService from '../../services/adminService';

const InviteForm = ({ onInviteCreated }) => {
  const [formData, setFormData] = useState({
    email: '',
    role: 'ORGANIZER',
    duration: '7d'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await adminService.createInvite(
        formData.email,
        formData.role,
        formData.duration
      );
      setSuccess(`Invite sent to ${formData.email}! Check backend logs for the one-time password.`);
      setFormData({ email: '', role: 'ORGANIZER', duration: '7d' });
      
      // Notify parent to refresh invite list
      if (onInviteCreated) onInviteCreated();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create invite');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Generate Admin Invite</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="admin@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Role *
          </label>
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="ORGANIZER">Organizer</option>
            <option value="UMPIRE">Umpire</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expires In
          </label>
          <select
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="24h">24 Hours</option>
            <option value="7d">7 Days</option>
            <option value="30d">30 Days</option>
          </select>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm">
            {success}
            <p className="mt-2 text-xs bg-white p-2 rounded border border-green-200">
              ⚠️ The one-time password is logged in the backend console. Check the server logs to get it.
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {loading ? 'Sending Invite...' : 'Send Invite'}
        </button>
      </form>
    </div>
  );
};

export default InviteForm;
