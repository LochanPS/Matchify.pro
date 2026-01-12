import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Mail, 
  User, 
  Lock, 
  Phone, 
  MapPin, 
  Shield, 
  CheckCircle, 
  AlertTriangle,
  ArrowRight,
  Sparkles
} from 'lucide-react';

const AcceptInvite = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [inviteData, setInviteData] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  const [formData, setFormData] = useState({
    oneTimePassword: '',
    name: '',
    password: '',
    confirmPassword: '',
    phone: '',
    city: '',
    state: ''
  });

  useEffect(() => {
    verifyInvite();
  }, [token]);

  const verifyInvite = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/admin/invites/${token}/verify`
      );

      if (response.data.success) {
        setInviteData(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid or expired invite');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.oneTimePassword || formData.oneTimePassword.length !== 8) {
      setError('Please enter the 8-character one-time password from your email');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setSubmitting(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/admin/invites/${token}/accept`,
        {
          oneTimePassword: formData.oneTimePassword.toUpperCase(),
          name: formData.name,
          password: formData.password,
          phone: formData.phone || undefined,
          city: formData.city || undefined,
          state: formData.state || undefined
        }
      );

      if (response.data.success) {
        setShowSuccessModal(true);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create account');
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      ADMIN: 'bg-red-500/20 text-red-400 border border-red-500/30',
      ORGANIZER: 'badge-info',
      UMPIRE: 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
    };
    return badges[role] || badges.ORGANIZER;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-blob"></div>
          <div className="absolute top-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        </div>
        <div className="relative text-center">
          <div className="spinner-premium mx-auto mb-4"></div>
          <p className="text-gray-400">Verifying invite...</p>
        </div>
      </div>
    );
  }

  if (error && !inviteData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500/10 rounded-full blur-3xl"></div>
        </div>
        <div className="relative glass-card-dark max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500/20 to-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Invalid Invite</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="btn-premium w-full"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute top-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-40 right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-blue-500/30">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to Matchify.pro</h1>
          <p className="text-gray-400">Create your account to get started</p>
        </div>

        {/* Invite Info Card */}
        <div className="glass-card-dark p-4 mb-6">
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
            <Mail className="w-4 h-4 text-blue-400" />
            Invitation Details
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Email</span>
              <span className="text-white text-sm">{inviteData?.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Role</span>
              <span className={`badge ${getRoleBadge(inviteData?.role)}`}>{inviteData?.role}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Invited by</span>
              <span className="text-white text-sm">{inviteData?.invitedBy}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Expires</span>
              <span className="text-white text-sm">{new Date(inviteData?.expiresAt).toLocaleDateString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="glass-card-dark p-6">
          {error && (
            <div className="mb-4 alert-error text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                One-Time Password *
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={formData.oneTimePassword}
                  onChange={(e) => setFormData({ ...formData, oneTimePassword: e.target.value.toUpperCase() })}
                  className="input-premium pl-10 font-mono text-lg tracking-widest text-center"
                  placeholder="A1B2C3D4"
                  maxLength={8}
                  required
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Enter the 8-character code from your invitation email
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-premium pl-10"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input-premium pl-10"
                  placeholder="Minimum 6 characters"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="input-premium pl-10"
                  placeholder="Re-enter password"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input-premium pl-10"
                  placeholder="+91 9876543210"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  City
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="input-premium pl-10"
                    placeholder="Mumbai"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  State
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="input-premium"
                  placeholder="Maharashtra"
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-premium w-full flex items-center justify-center gap-2 mt-6"
              disabled={submitting}
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-400">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              Login here
            </button>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-md animate-scale-in text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Account Created!</h3>
            <p className="text-gray-400 mb-6">
              Your account has been created successfully. You can now login with your credentials.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="btn-premium w-full"
            >
              Go to Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcceptInvite;
