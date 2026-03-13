import { useState } from 'react';
import { X, Eye, EyeOff, Lock } from 'lucide-react';
import { profileAPI } from '../../api/profile';

export default function PasswordModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validation
    if (formData.newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      setError('New password must be different from current password');
      return;
    }

    setLoading(true);
    try {
      await profileAPI.changePassword(
        formData.currentPassword,
        formData.newPassword
      );
      setSuccess(true);
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const togglePassword = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleClose = () => {
    setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setError('');
    setSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {/* Halo Effect */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-96 h-96 bg-gradient-to-r from-purple-500/30 via-indigo-500/30 to-purple-500/30 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative bg-slate-800 border border-white/10 rounded-2xl max-w-md w-full overflow-hidden">
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-5">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiLz48cGF0aCBkPSJNMjAgMjBtLTEgMGExIDEgMCAxIDAgMiAwYTEgMSAwIDEgMCAtMiAwIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L2c+PC9zdmc+')] opacity-30"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Lock className="text-white" size={20} />
              </div>
              <h2 className="text-xl font-bold text-white">Change Password</h2>
            </div>
            <button 
              onClick={handleClose} 
              className="text-white/70 hover:text-white hover:bg-white/10 rounded-lg p-1.5 transition-colors"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Success Message */}
          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
              <span>✅</span> Password changed successfully! Closing...
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  value={formData.currentPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, currentPassword: e.target.value })
                  }
                  required
                  className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => togglePassword('current')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPasswords.current ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, newPassword: e.target.value })
                  }
                  required
                  className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Enter new password (min 6 characters)"
                />
                <button
                  type="button"
                  onClick={() => togglePassword('new')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  required
                  className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => togglePassword('confirm')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="text-sm text-gray-400 bg-slate-700/30 border border-white/5 p-4 rounded-xl">
              <p className="font-medium text-gray-300 mb-2">Password Requirements:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>At least 6 characters long</li>
                <li>Different from current password</li>
                <li>Must match confirmation</li>
              </ul>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-3 bg-slate-700/50 border border-white/10 text-gray-300 rounded-xl hover:bg-slate-700 hover:text-white transition-all font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || success}
                className="flex-1 relative group bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-3 rounded-xl hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
              >
                <span className="relative z-10">{loading ? 'Changing...' : 'Change Password'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
