import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { profileAPI } from '../api/profile';
import ImageUpload from '../components/common/ImageUpload';
import ProfileStats from '../components/profile/ProfileStats';
import PasswordModal from '../components/profile/PasswordModal';
import { formatDateIndian, formatDateLongIndian } from '../utils/dateFormat';
import { Edit2, Save, X, Key, Phone, Mail, MapPin, User, AlertTriangle } from 'lucide-react';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingData, setPendingData] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    phone: '',
    city: '',
    state: '',
    country: '',
    gender: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await profileAPI.getProfile();
      setProfile(data);
      setFormData({
        name: data.name || '',
        dateOfBirth: data.dateOfBirth ? data.dateOfBirth.split('T')[0] : '',
        phone: data.phone || '',
        city: data.city || '',
        state: data.state || '',
        country: data.country || '',
        gender: data.gender || ''
      });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (file) => {
    try {
      const data = await profileAPI.uploadPhoto(file);
      const updatedProfile = { ...profile, profilePhoto: data.profilePhoto };
      setProfile(updatedProfile);
      updateUser(updatedProfile);
      setSuccess('Profile photo updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
      return data;
    } catch (error) {
      console.error('Photo upload failed:', error);
      throw error;
    }
  };

  const handlePhotoRemove = async () => {
    try {
      await profileAPI.deletePhoto();
      const updatedProfile = { ...profile, profilePhoto: null };
      setProfile(updatedProfile);
      updateUser(updatedProfile);
      setSuccess('Profile photo removed successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Photo removal failed:', error);
      throw error;
    }
  };

  // Check if name or DOB is being set for the first time
  const needsConfirmation = () => {
    const settingName = !profile?.name && formData.name;
    const settingDOB = !profile?.dateOfBirth && formData.dateOfBirth;
    return settingName || settingDOB;
  };

  const handleSave = async () => {
    // If setting name or DOB for first time, show confirmation
    if (needsConfirmation()) {
      setPendingData(formData);
      setShowConfirmModal(true);
      return;
    }
    await saveProfile(formData);
  };

  const handleConfirmSave = async () => {
    setShowConfirmModal(false);
    await saveProfile(pendingData);
    setPendingData(null);
  };

  const saveProfile = async (dataToSave) => {
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      // Only send fields that can be edited
      const cleanedData = {};
      
      // Name can only be set if currently empty
      if (!profile?.name && dataToSave.name) {
        cleanedData.name = dataToSave.name;
      }
      
      // DOB can only be set if currently empty
      if (!profile?.dateOfBirth && dataToSave.dateOfBirth) {
        cleanedData.dateOfBirth = dataToSave.dateOfBirth;
      }
      
      // These fields can always be edited
      if (dataToSave.phone) {
        cleanedData.phone = dataToSave.phone.replace(/^\+91/, '').replace(/\s/g, '');
      }
      if (dataToSave.gender) cleanedData.gender = dataToSave.gender;
      if (dataToSave.city !== undefined) cleanedData.city = dataToSave.city;
      if (dataToSave.state !== undefined) cleanedData.state = dataToSave.state;
      if (dataToSave.country !== undefined) cleanedData.country = dataToSave.country;
      
      console.log('Sending profile data:', cleanedData);
      
      const updatedUser = await profileAPI.updateProfile(cleanedData);
      console.log('Profile updated:', updatedUser);
      setProfile(updatedUser);
      updateUser(updatedUser);
      setIsEditing(false);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Failed to update profile:', error);
      console.error('Error response:', error.response?.data);
      const errorMsg = error.response?.data?.error || 
                       error.response?.data?.details?.map(d => d.message).join(', ') ||
                       'Failed to update profile. Please try again.';
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: profile?.name || '',
      dateOfBirth: profile?.dateOfBirth ? profile.dateOfBirth.split('T')[0] : '',
      phone: profile?.phone || '',
      city: profile?.city || '',
      state: profile?.state || '',
      country: profile?.country || '',
      gender: profile?.gender || ''
    });
    setIsEditing(false);
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Check if field can be edited (only if currently empty)
  const canEditName = !profile?.name;
  const canEditDOB = !profile?.dateOfBirth;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success/Error Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <div className="flex-shrink-0">
              <ImageUpload
                currentImage={profile?.profilePhoto}
                onUpload={handlePhotoUpload}
                onRemove={handlePhotoRemove}
              />
            </div>

            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-3xl font-bold text-gray-800">{profile?.name || 'No Name Set'}</h1>
              <div className="flex items-center justify-center lg:justify-start gap-2 mt-2">
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                  profile?.role === 'PLAYER' ? 'bg-green-100 text-green-800' :
                  profile?.role === 'ORGANIZER' ? 'bg-blue-100 text-blue-800' :
                  profile?.role === 'UMPIRE' ? 'bg-purple-100 text-purple-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {profile?.role}
                </span>
                {profile?.isVerified && (
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    ✓ Verified
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap gap-4 mt-4 justify-center lg:justify-start">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail size={16} />
                  <span>{profile?.email}</span>
                </div>
                {profile?.phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone size={16} />
                    <span>{profile?.phone}</span>
                  </div>
                )}
                {(profile?.city || profile?.state) && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin size={16} />
                    <span>{[profile?.city, profile?.state].filter(Boolean).join(', ')}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {!isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition"
                  >
                    <Edit2 size={16} />
                    Edit Profile
                  </button>
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2 transition"
                  >
                    <Key size={16} />
                    Password
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:bg-gray-400 transition"
                  >
                    <Save size={16} />
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 flex items-center gap-2 transition"
                  >
                    <X size={16} />
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Edit Form */}
        {isEditing && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <User size={20} />
              Edit Profile Information
            </h2>
            
            {/* Notice about permanent fields */}
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-700 flex items-center gap-2">
                <AlertTriangle size={16} />
                <strong>Important:</strong> Name and Date of Birth can only be set once and cannot be changed later.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name {!canEditName && <span className="text-gray-400">(locked)</span>}
                </label>
                {canEditName ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50"
                    placeholder="Enter your full name (one-time only)"
                  />
                ) : (
                  <input
                    type="text"
                    value={profile?.name || ''}
                    disabled
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                  />
                )}
                {canEditName && (
                  <p className="text-xs text-blue-600 mt-1">⚠️ This can only be set once</p>
                )}
              </div>

              {/* Date of Birth Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth {!canEditDOB && <span className="text-gray-400">(locked)</span>}
                </label>
                {canEditDOB ? (
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50"
                  />
                ) : (
                  <input
                    type="text"
                    value={profile?.dateOfBirth ? formatDateIndian(profile.dateOfBirth) : 'Not provided'}
                    disabled
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                  />
                )}
                {canEditDOB && (
                  <p className="text-xs text-blue-600 mt-1">⚠️ This can only be set once</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your city"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your state"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your country"
                />
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <ProfileStats stats={profile?.stats} user={profile} />
      </div>

      {/* Password Modal */}
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />

      {/* Confirmation Modal for Name/DOB */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="text-amber-600" size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Confirm Your Details</h3>
            </div>
            
            <p className="text-gray-600 mb-4">
              Please verify the following information. <strong>Once saved, these fields cannot be changed.</strong>
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
              {!profile?.name && pendingData?.name && (
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-semibold text-gray-900">{pendingData.name}</p>
                </div>
              )}
              {!profile?.dateOfBirth && pendingData?.dateOfBirth && (
                <div>
                  <p className="text-sm text-gray-500">Date of Birth</p>
                  <p className="font-semibold text-gray-900">
                    {formatDateLongIndian(pendingData.dateOfBirth)}
                  </p>
                </div>
              )}
            </div>

            <p className="text-sm text-amber-600 mb-6">
              ⚠️ Are you sure this information is correct?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setPendingData(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Go Back & Edit
              </button>
              <button
                onClick={handleConfirmSave}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Yes, Confirm & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
