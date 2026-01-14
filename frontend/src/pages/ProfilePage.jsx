import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { profileAPI } from '../api/profile';
import ImageUpload from '../components/common/ImageUpload';
import ProfileStats from '../components/profile/ProfileStats';
import PasswordModal from '../components/profile/PasswordModal';
import { formatDateIndian, formatDateLongIndian } from '../utils/dateFormat';
import { Edit2, Save, X, Key, Phone, Mail, MapPin, User, AlertTriangle } from 'lucide-react';
import {
  UserCircleIcon,
  PencilSquareIcon,
  KeyIcon,
  CheckBadgeIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

export default function ProfilePage() {
  const navigate = useNavigate();
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

  const needsConfirmation = () => {
    const settingName = !profile?.name && formData.name;
    const settingDOB = !profile?.dateOfBirth && formData.dateOfBirth;
    return settingName || settingDOB;
  };

  const handleSave = async () => {
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
      const cleanedData = {};
      if (!profile?.name && dataToSave.name) cleanedData.name = dataToSave.name;
      if (!profile?.dateOfBirth && dataToSave.dateOfBirth) cleanedData.dateOfBirth = dataToSave.dateOfBirth;
      if (dataToSave.phone) cleanedData.phone = dataToSave.phone.replace(/^\+91/, '').replace(/\s/g, '');
      if (dataToSave.gender) cleanedData.gender = dataToSave.gender;
      if (dataToSave.city !== undefined) cleanedData.city = dataToSave.city;
      if (dataToSave.state !== undefined) cleanedData.state = dataToSave.state;
      if (dataToSave.country !== undefined) cleanedData.country = dataToSave.country;
      
      const updatedUser = await profileAPI.updateProfile(cleanedData);
      setProfile(updatedUser);
      updateUser(updatedUser);
      setIsEditing(false);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Failed to update profile:', error);
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

  const canEditName = !profile?.name;
  const canEditDOB = !profile?.dateOfBirth;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 mt-4 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>
        
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/70 hover:text-white mb-6 transition-colors group"
          >
            <ArrowLeftIcon className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            <span>Back</span>
          </button>

          <div className="flex flex-col lg:flex-row items-center gap-8">
            {/* Profile Photo */}
            <div className="flex-shrink-0">
              <ImageUpload
                currentImage={profile?.profilePhoto}
                onUpload={handlePhotoUpload}
                onRemove={handlePhotoRemove}
              />
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-3xl font-bold text-white mb-2">{profile?.name || 'No Name Set'}</h1>
              <div className="flex items-center justify-center lg:justify-start gap-2 mb-4">
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                  profile?.role === 'PLAYER' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                  profile?.role === 'ORGANIZER' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                  profile?.role === 'UMPIRE' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                  'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}>
                  {profile?.role}
                </span>
                {profile?.isVerified && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-green-500/20 text-green-300 border border-green-500/30">
                    <CheckBadgeIcon className="w-4 h-4" />
                    Verified
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start text-white/60">
                <div className="flex items-center gap-2">
                  <Mail size={16} />
                  <span>{profile?.email}</span>
                </div>
                {profile?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={16} />
                    <span>{profile?.phone}</span>
                  </div>
                )}
                {(profile?.city || profile?.state) && (
                  <div className="flex items-center gap-2">
                    <MapPin size={16} />
                    <span>{[profile?.city, profile?.state].filter(Boolean).join(', ')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {!isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2 font-medium"
                  >
                    <PencilSquareIcon className="w-5 h-5" />
                    Edit Profile
                  </button>
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="px-5 py-2.5 bg-white/10 backdrop-blur-sm text-white rounded-xl border border-white/20 hover:bg-white/20 transition-all flex items-center gap-2 font-medium"
                  >
                    <KeyIcon className="w-5 h-5" />
                    Password
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2 font-medium disabled:opacity-50"
                  >
                    <Save size={18} />
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-5 py-2.5 bg-white/10 backdrop-blur-sm text-white rounded-xl border border-white/20 hover:bg-white/20 transition-all flex items-center gap-2 font-medium"
                  >
                    <X size={18} />
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-8">
        {/* Success/Error Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 flex items-center gap-3">
            <span className="text-xl">✅</span>
            {success}
          </div>
        )}

        {/* Edit Form */}
        {isEditing && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white">Edit Profile Information</h2>
            </div>
            
            {/* Notice about permanent fields */}
            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-300">
                <strong>Important:</strong> Name and Date of Birth can only be set once and cannot be changed later.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name {!canEditName && <span className="text-gray-500">(locked)</span>}
                </label>
                {canEditName ? (
                  <>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter your full name (one-time only)"
                    />
                    <p className="text-xs text-blue-400 mt-1">⚠️ This can only be set once</p>
                  </>
                ) : (
                  <input
                    type="text"
                    value={profile?.name || ''}
                    disabled
                    className="w-full px-4 py-3 border border-white/5 rounded-xl bg-slate-700/30 text-gray-500 cursor-not-allowed"
                  />
                )}
              </div>

              {/* Date of Birth Field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Date of Birth {!canEditDOB && <span className="text-gray-500">(locked)</span>}
                </label>
                {canEditDOB ? (
                  <>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all [color-scheme:dark]"
                    />
                    <p className="text-xs text-blue-400 mt-1">⚠️ This can only be set once</p>
                  </>
                ) : (
                  <input
                    type="text"
                    value={profile?.dateOfBirth ? formatDateIndian(profile.dateOfBirth) : 'Not provided'}
                    disabled
                    className="w-full px-4 py-3 border border-white/5 rounded-xl bg-slate-700/30 text-gray-500 cursor-not-allowed"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Enter your phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                >
                  <option value="" className="bg-slate-800">Select Gender</option>
                  <option value="MALE" className="bg-slate-800">Male</option>
                  <option value="FEMALE" className="bg-slate-800">Female</option>
                  <option value="OTHER" className="bg-slate-800">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Enter your city"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Enter your state"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Country</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          {/* Halo Effect */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-96 h-96 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative bg-slate-800 border border-white/10 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            {/* Header with gradient */}
            <div className="relative bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-5">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiLz48cGF0aCBkPSJNMjAgMjBtLTEgMGExIDEgMCAxIDAgMiAwYTEgMSAwIDEgMCAtMiAwIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L2c+PC9zdmc+')] opacity-30"></div>
              <div className="relative flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <AlertTriangle className="text-white" size={24} />
                </div>
                <h3 className="text-xl font-bold text-white">Confirm Your Details</h3>
              </div>
            </div>
            
            <div className="p-6">
              <p className="text-gray-300 mb-4">
                Please verify the following information. <strong className="text-amber-400">Once saved, these fields cannot be changed.</strong>
              </p>

              <div className="bg-slate-700/50 border border-white/10 rounded-xl p-4 mb-6 space-y-3">
                {!profile?.name && pendingData?.name && (
                  <div>
                    <p className="text-sm text-gray-400">Full Name</p>
                    <p className="font-semibold text-white">{pendingData.name}</p>
                  </div>
                )}
                {!profile?.dateOfBirth && pendingData?.dateOfBirth && (
                  <div>
                    <p className="text-sm text-gray-400">Date of Birth</p>
                    <p className="font-semibold text-white">
                      {formatDateLongIndian(pendingData.dateOfBirth)}
                    </p>
                  </div>
                )}
              </div>

              <p className="text-sm text-amber-400 mb-6 flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
                <AlertTriangle size={16} />
                Are you sure this information is correct?
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setPendingData(null);
                  }}
                  className="flex-1 px-4 py-3 bg-slate-700/50 border border-white/10 text-gray-300 rounded-xl hover:bg-slate-700 hover:text-white transition-all font-medium"
                >
                  Go Back & Edit
                </button>
                <button
                  onClick={handleConfirmSave}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:shadow-lg hover:shadow-amber-500/25 transition-all font-medium"
                >
                  Yes, Confirm & Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
