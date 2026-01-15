import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tournamentAPI } from '../api/tournament';
import { useAuth } from '../contexts/AuthContext';
import { getImageUrl } from '../utils/imageUrl';
import { 
  ArrowLeft, 
  Layers, 
  Trash2, 
  Calendar, 
  CreditCard, 
  Settings,
  Save,
  AlertTriangle,
  CheckCircle,
  Upload,
  X,
  Clock,
  QrCode
} from 'lucide-react';

const EditTournament = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [formData, setFormData] = useState({
    registrationOpenDate: '',
    registrationCloseDate: '',
    startDate: '',
    endDate: '',
    upiId: '',
    accountHolderName: '',
  });
  
  const [newQRFile, setNewQRFile] = useState(null);
  const [newQRPreview, setNewQRPreview] = useState(null);

  useEffect(() => {
    fetchTournament();
  }, [id]);

  const fetchTournament = async () => {
    try {
      setLoading(true);
      const response = await tournamentAPI.getTournament(id);
      const t = response.data;
      
      if (user?.id !== t.organizerId) {
        navigate(`/tournaments/${id}`);
        return;
      }
      
      setTournament(t);
      setFormData({
        registrationOpenDate: formatDateForInput(t.registrationOpenDate),
        registrationCloseDate: formatDateForInput(t.registrationCloseDate),
        startDate: formatDateForInput(t.startDate),
        endDate: formatDateForInput(t.endDate),
        upiId: t.upiId || '',
        accountHolderName: t.accountHolderName || '',
      });
    } catch (err) {
      console.error('Error fetching tournament:', err);
      setError('Failed to load tournament');
    } finally {
      setLoading(false);
    }
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    // Parse the UTC date string and format it WITHOUT timezone conversion
    const isoString = new Date(dateString).toISOString(); // e.g., "2026-01-15T08:30:00.000Z"
    return isoString.slice(0, 16); // Return "2026-01-15T08:30"
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(null);
  };

  const handleQRFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      setNewQRFile(file);
      setNewQRPreview(URL.createObjectURL(file));
    }
  };

  const removeNewQR = () => {
    if (newQRPreview) {
      URL.revokeObjectURL(newQRPreview);
    }
    setNewQRFile(null);
    setNewQRPreview(null);
  };

  const handleSaveDates = async () => {
    setSaving(true);
    setError(null);
    
    try {
      await tournamentAPI.updateTournament(id, {
        registrationOpenDate: formData.registrationOpenDate,
        registrationCloseDate: formData.registrationCloseDate,
        startDate: formData.startDate,
        endDate: formData.endDate,
      });
      setSuccess('Dates updated successfully!');
      fetchTournament();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update dates');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePaymentInfo = async () => {
    setSaving(true);
    setError(null);
    
    try {
      if (newQRFile) {
        await tournamentAPI.uploadPaymentQR(id, newQRFile, formData.upiId, formData.accountHolderName);
        setNewQRFile(null);
        setNewQRPreview(null);
      } else {
        await tournamentAPI.updatePaymentInfo(id, {
          upiId: formData.upiId,
          accountHolderName: formData.accountHolderName,
        });
      }
      setSuccess('Payment info updated successfully!');
      fetchTournament();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update payment info');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading tournament...</p>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 text-lg font-medium">Tournament not found</p>
          <button
            onClick={() => navigate('/tournaments')}
            className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Back to Tournaments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4 group"
          >
            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Tournament</span>
          </button>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Edit Tournament</h1>
              <p className="text-gray-400">{tournament.name}</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span className="text-red-300 font-medium">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        {success && (
          <div className="mb-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span className="text-emerald-300 font-medium">{success}</span>
            <button onClick={() => setSuccess(null)} className="ml-auto text-emerald-400 hover:text-emerald-300">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="space-y-6">
          {/* Tournament Dates Section */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Tournament Dates</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Registration Opens
                  </label>
                  <div className="datetime-input-wrapper">
                    <input
                      type="datetime-local"
                      value={formData.registrationOpenDate}
                      onChange={(e) => handleChange('registrationOpenDate', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Registration Closes
                  </label>
                  <div className="datetime-input-wrapper">
                    <input
                      type="datetime-local"
                      value={formData.registrationCloseDate}
                      onChange={(e) => handleChange('registrationCloseDate', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tournament Starts
                  </label>
                  <div className="datetime-input-wrapper">
                    <input
                      type="datetime-local"
                      value={formData.startDate}
                      onChange={(e) => handleChange('startDate', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tournament Ends
                  </label>
                  <div className="datetime-input-wrapper">
                    <input
                      type="datetime-local"
                      value={formData.endDate}
                      onChange={(e) => handleChange('endDate', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition-all"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-white/10">
                <button
                  onClick={handleSaveDates}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all font-semibold disabled:opacity-50"
                >
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  Save Dates
                </button>
              </div>
            </div>
          </div>

          {/* Payment QR Section */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <CreditCard className="w-5 h-5 text-emerald-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Payment QR Code</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* QR Code Display */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">QR Code</label>
                  <div className="bg-slate-700/30 rounded-xl p-4 border border-white/5">
                    {newQRPreview ? (
                      <div className="relative">
                        <div className="p-3 bg-slate-800/50 border border-white/10 rounded-xl mx-auto max-w-[200px]">
                          <img
                            src={newQRPreview}
                            alt="New Payment QR"
                            className="w-full max-w-[180px] mx-auto h-auto object-contain rounded-lg"
                          />
                        </div>
                        <button
                          onClick={removeNewQR}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <p className="text-center text-sm text-amber-400 mt-3 font-medium">New QR (not saved yet)</p>
                      </div>
                    ) : tournament.paymentQRUrl ? (
                      <div className="p-3 bg-slate-800/50 border border-white/10 rounded-xl mx-auto max-w-[200px]">
                        <img
                          src={getImageUrl(tournament.paymentQRUrl)}
                          alt="Payment QR"
                          className="w-full max-w-[180px] mx-auto h-auto object-contain rounded-lg"
                        />
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <QrCode className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">No QR code uploaded</p>
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-700/50 text-gray-300 rounded-xl hover:bg-slate-700 transition-colors font-medium border border-white/10"
                  >
                    <Upload className="h-5 w-5" />
                    {tournament.paymentQRUrl ? 'Change QR Code' : 'Upload QR Code'}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleQRFileSelect}
                    className="hidden"
                  />
                </div>
                
                {/* Payment Details */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      UPI ID
                    </label>
                    <input
                      type="text"
                      value={formData.upiId}
                      onChange={(e) => handleChange('upiId', e.target.value)}
                      placeholder="e.g., yourname@upi"
                      className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      value={formData.accountHolderName}
                      onChange={(e) => handleChange('accountHolderName', e.target.value)}
                      placeholder="e.g., John Doe"
                      className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-white/10">
                <button
                  onClick={handleSavePaymentInfo}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all font-semibold disabled:opacity-50"
                >
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  Save Payment Info
                </button>
              </div>
            </div>
          </div>

          {/* Manage Categories Section */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Layers className="w-5 h-5 text-purple-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Categories & Entry Fees</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-400 mb-4">
                Manage tournament categories, set entry fees, prize money, and participant limits.
              </p>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate(`/tournaments/${id}/categories`)}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all font-semibold"
                >
                  <Layers className="w-5 h-5" />
                  Manage Categories
                </button>
                {tournament.categories?.length > 0 && (
                  <span className="text-sm text-gray-400">
                    {tournament.categories.length} {tournament.categories.length === 1 ? 'category' : 'categories'} configured
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditTournament;
