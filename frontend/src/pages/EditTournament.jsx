import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tournamentAPI } from '../api/tournament';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeftIcon, QrCodeIcon, TrashIcon } from '@heroicons/react/24/outline';

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
      
      // Check if user is the organizer
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
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
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
      // If there's a new QR file, upload it
      if (newQRFile) {
        await tournamentAPI.uploadPaymentQR(id, newQRFile, formData.upiId, formData.accountHolderName);
        setNewQRFile(null);
        setNewQRPreview(null);
      } else {
        // Just update the payment info
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-600">Tournament not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(`/tournaments/${id}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Back to Tournament
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Edit Tournament</h1>
          <p className="text-gray-600 mt-1">{tournament.name}</p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
            {success}
          </div>
        )}

        {/* Edit Dates Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">📅 Tournament Dates</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Registration Opens
              </label>
              <input
                type="datetime-local"
                value={formData.registrationOpenDate}
                onChange={(e) => handleChange('registrationOpenDate', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Registration Closes
              </label>
              <input
                type="datetime-local"
                value={formData.registrationCloseDate}
                onChange={(e) => handleChange('registrationCloseDate', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tournament Starts
              </label>
              <input
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tournament Ends
              </label>
              <input
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <button
            onClick={handleSaveDates}
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {saving ? 'Saving...' : 'Save Dates'}
          </button>
        </div>

        {/* Edit Payment QR Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">💳 Payment QR Code</h2>
          
          {/* Current QR */}
          {tournament.paymentQRUrl && !newQRPreview && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Current QR Code:</p>
              <img
                src={tournament.paymentQRUrl}
                alt="Payment QR"
                className="w-48 h-48 object-contain border rounded-lg bg-white p-2"
              />
            </div>
          )}
          
          {/* New QR Preview */}
          {newQRPreview && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">New QR Code (not saved yet):</p>
              <div className="relative inline-block">
                <img
                  src={newQRPreview}
                  alt="New Payment QR"
                  className="w-48 h-48 object-contain border rounded-lg bg-white p-2"
                />
                <button
                  onClick={removeNewQR}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
          
          {/* Upload New QR */}
          <div className="mb-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <QrCodeIcon className="h-5 w-5" />
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
          
          {/* UPI ID */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              UPI ID
            </label>
            <input
              type="text"
              value={formData.upiId}
              onChange={(e) => handleChange('upiId', e.target.value)}
              placeholder="e.g., yourname@upi"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Account Holder Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Holder Name
            </label>
            <input
              type="text"
              value={formData.accountHolderName}
              onChange={(e) => handleChange('accountHolderName', e.target.value)}
              placeholder="e.g., John Doe"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button
            onClick={handleSavePaymentInfo}
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {saving ? 'Saving...' : 'Save Payment Info'}
          </button>
        </div>

        {/* Manage Categories Link */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">🏸 Categories & Entry Fees</h2>
          <p className="text-gray-600 mb-4">
            Edit category details including entry fees, prizes, and more.
          </p>
          <button
            onClick={() => navigate(`/tournaments/${id}/categories`)}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
          >
            Manage Categories
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditTournament;
