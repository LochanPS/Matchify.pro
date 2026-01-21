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
    <div className="bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700">
      <h3 className="text-lg font-semibold mb-4 text-white">Generate Admin Invite</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Email Address *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            placeholder="admin@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Role *
          </label>
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          >
            <option value="ORGANIZER">Organizer</option>
            <option value="UMPIRE">Umpire</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Expires In
          </label>
          <select
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          >
            <option value="24h">24 Hours</option>
            <option value="7d">7 Days</option>
            <option value="30d">30 Days</option>
          </select>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-400 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-900/30 border border-green-700 text-green-400 p-3 rounded-lg text-sm">
            {success}
            <p className="mt-2 text-xs bg-slate-900 p-2 rounded border border-green-700">
              ⚠️ The one-time password is logged in the backend console. Check the server logs to get it.
            </p>
          </div>
        )}

        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl blur-lg opacity-50 group-hover:opacity-100 transition duration-300"></div>
          <button
            type="submit"
            disabled={loading}
            className="relative w-full bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 disabled:opacity-50 transition"
          >
            {loading ? 'Sending Invite...' : 'Send Invite'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InviteForm;
