import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { profileAPI } from '../api/profile';
import { getErrorMessage } from '../utils/errorMessage';
import ProfileStats from '../components/profile/ProfileStats';
import PasswordModal from '../components/profile/PasswordModal';
import PhotoViewer from '../components/PhotoViewer';
import { formatDateIndian, formatDateLongIndian } from '../utils/dateFormat';
import { Edit2, Save, X, Key, Phone, Mail, MapPin, User, AlertTriangle, Camera, Upload, ZoomIn } from 'lucide-react';
import MatchifyLogo from '../components/MatchifyLogo';
import {
  UserCircleIcon,
  PencilSquareIcon,
  KeyIcon,
  CheckBadgeIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

// Pre-generated particle data — deterministic, no Math.random in render
const PROFILE_PARTICLES = Array.from({ length: 15 }, (_, i) => ({
  w: (i * 7 + 2) % 4 + 2,
  h: (i * 11 + 2) % 4 + 2,
  x: (i * 37 + 11) % 97,
  y: (i * 53 + 7) % 91,
  c: ['#00ff88', '#a855f7', '#06b6d4'][i % 3],
  o: ((i * 13) % 50) / 100 + 0.2,
  dur: (i * 7) % 8 + 5,
  delay: (i * 3) % 5,
  glow: (i * 11) % 15 + 5,
}));

// Indian Cities with States for Autocomplete
const INDIAN_CITIES = [
  { city: 'Mumbai', state: 'Maharashtra' },
  { city: 'Delhi', state: 'Delhi' },
  { city: 'Bangalore', state: 'Karnataka' },
  { city: 'Hyderabad', state: 'Telangana' },
  { city: 'Ahmedabad', state: 'Gujarat' },
  { city: 'Chennai', state: 'Tamil Nadu' },
  { city: 'Kolkata', state: 'West Bengal' },
  { city: 'Pune', state: 'Maharashtra' },
  { city: 'Jaipur', state: 'Rajasthan' },
  { city: 'Surat', state: 'Gujarat' },
  { city: 'Lucknow', state: 'Uttar Pradesh' },
  { city: 'Kanpur', state: 'Uttar Pradesh' },
  { city: 'Nagpur', state: 'Maharashtra' },
  { city: 'Indore', state: 'Madhya Pradesh' },
  { city: 'Thane', state: 'Maharashtra' },
  { city: 'Bhopal', state: 'Madhya Pradesh' },
  { city: 'Visakhapatnam', state: 'Andhra Pradesh' },
  { city: 'Pimpri-Chinchwad', state: 'Maharashtra' },
  { city: 'Patna', state: 'Bihar' },
  { city: 'Vadodara', state: 'Gujarat' },
  { city: 'Ghaziabad', state: 'Uttar Pradesh' },
  { city: 'Ludhiana', state: 'Punjab' },
  { city: 'Agra', state: 'Uttar Pradesh' },
  { city: 'Nashik', state: 'Maharashtra' },
  { city: 'Faridabad', state: 'Haryana' },
  { city: 'Meerut', state: 'Uttar Pradesh' },
  { city: 'Rajkot', state: 'Gujarat' },
  { city: 'Varanasi', state: 'Uttar Pradesh' },
  { city: 'Srinagar', state: 'Jammu and Kashmir' },
  { city: 'Aurangabad', state: 'Maharashtra' },
  { city: 'Dhanbad', state: 'Jharkhand' },
  { city: 'Amritsar', state: 'Punjab' },
  { city: 'Navi Mumbai', state: 'Maharashtra' },
  { city: 'Allahabad', state: 'Uttar Pradesh' },
  { city: 'Ranchi', state: 'Jharkhand' },
  { city: 'Howrah', state: 'West Bengal' },
  { city: 'Coimbatore', state: 'Tamil Nadu' },
  { city: 'Jabalpur', state: 'Madhya Pradesh' },
  { city: 'Gwalior', state: 'Madhya Pradesh' },
  { city: 'Vijayawada', state: 'Andhra Pradesh' },
  { city: 'Jodhpur', state: 'Rajasthan' },
  { city: 'Madurai', state: 'Tamil Nadu' },
  { city: 'Raipur', state: 'Chhattisgarh' },
  { city: 'Kota', state: 'Rajasthan' },
  { city: 'Chandigarh', state: 'Chandigarh' },
  { city: 'Guwahati', state: 'Assam' },
  { city: 'Solapur', state: 'Maharashtra' },
  { city: 'Mysore', state: 'Karnataka' },
  { city: 'Tiruchirappalli', state: 'Tamil Nadu' },
  { city: 'Bareilly', state: 'Uttar Pradesh' },
  { city: 'Aligarh', state: 'Uttar Pradesh' },
  { city: 'Tiruppur', state: 'Tamil Nadu' },
  { city: 'Moradabad', state: 'Uttar Pradesh' },
  { city: 'Jalandhar', state: 'Punjab' },
  { city: 'Bhubaneswar', state: 'Odisha' },
  { city: 'Salem', state: 'Tamil Nadu' },
  { city: 'Warangal', state: 'Telangana' },
  { city: 'Thiruvananthapuram', state: 'Kerala' },
  { city: 'Guntur', state: 'Andhra Pradesh' },
  { city: 'Bikaner', state: 'Rajasthan' },
  { city: 'Noida', state: 'Uttar Pradesh' },
  { city: 'Jamshedpur', state: 'Jharkhand' },
  { city: 'Bhilai', state: 'Chhattisgarh' },
  { city: 'Cuttack', state: 'Odisha' },
  { city: 'Kochi', state: 'Kerala' },
  { city: 'Bhavnagar', state: 'Gujarat' },
  { city: 'Dehradun', state: 'Uttarakhand' },
  { city: 'Asansol', state: 'West Bengal' },
  { city: 'Nanded', state: 'Maharashtra' },
  { city: 'Kolhapur', state: 'Maharashtra' },
  { city: 'Ajmer', state: 'Rajasthan' },
  { city: 'Jamnagar', state: 'Gujarat' },
  { city: 'Ujjain', state: 'Madhya Pradesh' },
  { city: 'Siliguri', state: 'West Bengal' },
  { city: 'Jhansi', state: 'Uttar Pradesh' },
  { city: 'Jammu', state: 'Jammu and Kashmir' },
  { city: 'Mangalore', state: 'Karnataka' },
  { city: 'Erode', state: 'Tamil Nadu' },
  { city: 'Belgaum', state: 'Karnataka' },
  { city: 'Tirunelveli', state: 'Tamil Nadu' },
  { city: 'Udaipur', state: 'Rajasthan' },
  { city: 'Kozhikode', state: 'Kerala' },
  { city: 'Kurnool', state: 'Andhra Pradesh' },
  { city: 'Bokaro', state: 'Jharkhand' },
  { city: 'Rajahmundry', state: 'Andhra Pradesh' },
  { city: 'Agartala', state: 'Tripura' },
  { city: 'Bhagalpur', state: 'Bihar' },
  { city: 'Latur', state: 'Maharashtra' },
  { city: 'Dhule', state: 'Maharashtra' },
  { city: 'Muzaffarpur', state: 'Bihar' },
  { city: 'Ahmednagar', state: 'Maharashtra' },
  { city: 'Kollam', state: 'Kerala' },
  { city: 'Bilaspur', state: 'Chhattisgarh' },
  { city: 'Shahjahanpur', state: 'Uttar Pradesh' },
  { city: 'Thrissur', state: 'Kerala' },
  { city: 'Alwar', state: 'Rajasthan' },
  { city: 'Kakinada', state: 'Andhra Pradesh' },
  { city: 'Nizamabad', state: 'Telangana' },
  { city: 'Tumkur', state: 'Karnataka' },
  { city: 'Hisar', state: 'Haryana' },
  { city: 'Rohtak', state: 'Haryana' },
  { city: 'Panipat', state: 'Haryana' },
  { city: 'Darbhanga', state: 'Bihar' },
  { city: 'Aizawl', state: 'Mizoram' },
  { city: 'Tirupati', state: 'Andhra Pradesh' },
  { city: 'Karnal', state: 'Haryana' },
  { city: 'Bathinda', state: 'Punjab' },
  { city: 'Rampur', state: 'Uttar Pradesh' },
  { city: 'Shillong', state: 'Meghalaya' },
  { city: 'Patiala', state: 'Punjab' },
  { city: 'Imphal', state: 'Manipur' },
  { city: 'Hapur', state: 'Uttar Pradesh' },
  { city: 'Anantapur', state: 'Andhra Pradesh' },
  { city: 'Nellore', state: 'Andhra Pradesh' },
  { city: 'Rourkela', state: 'Odisha' },
  { city: 'Vellore', state: 'Tamil Nadu' },
  { city: 'Shimla', state: 'Himachal Pradesh' },
  { city: 'Gangtok', state: 'Sikkim' },
  { city: 'Itanagar', state: 'Arunachal Pradesh' },
  { city: 'Kohima', state: 'Nagaland' },
  { city: 'Port Blair', state: 'Andaman and Nicobar Islands' },
  { city: 'Puducherry', state: 'Puducherry' },
];

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
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoInputRef, setPhotoInputRef] = useState(null);
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
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
    if (!file) return;
    
    try {
      setUploadingPhoto(true);
      const data = await profileAPI.uploadPhoto(file);
      const updatedProfile = { ...profile, profilePhoto: data.profilePhoto };
      setProfile(updatedProfile);
      updateUser(updatedProfile);
      setSuccess('Profile photo updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
      return data;
    } catch (error) {
      console.error('Photo upload failed:', error);
      setError('Failed to upload photo. Please try again.');
      setTimeout(() => setError(''), 3000);
      throw error;
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePhotoInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        setTimeout(() => setError(''), 3000);
        return;
      }
      
      // Validate file type
      if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
        setError('Only JPG, PNG, and GIF files are allowed');
        setTimeout(() => setError(''), 3000);
        return;
      }
      
      handlePhotoUpload(file);
    }
  };

  const needsConfirmation = () => {
    return false;
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
      if (dataToSave.name) cleanedData.name = dataToSave.name;
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
      setError(getErrorMessage(error, 'Failed to update profile. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: profile?.name || '',
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

    // City autocomplete
    if (name === 'city' && value.length >= 2) {
      const matches = INDIAN_CITIES.filter(item =>
        item.city.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5);
      setCitySuggestions(matches);
      setShowCitySuggestions(matches.length > 0);
    } else if (name === 'city') {
      setShowCitySuggestions(false);
    }
  };

  const handleCitySelect = (city, state) => {
    setFormData(prev => ({ ...prev, city, state }));
    setShowCitySuggestions(false);
    setCitySuggestions([]);
  };

  const canEditName = true; // Name is always editable

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#07071a' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto"
            style={{ borderColor: 'rgba(0,255,136,0.3)', borderTopColor: '#00ff88' }} />
          <p className="mt-4 font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#07071a' }}>
      {/* Animated Background Elements */}
      <div className="fixed top-0 bottom-0 pointer-events-none overflow-hidden" style={{ left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "480px" }}>
        {/* Large Gradient Orbs */}
        <div 
          className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-30 animate-pulse"
          style={{ 
            background: 'radial-gradient(circle, rgba(0,255,136,0.4) 0%, rgba(0,255,136,0.2) 40%, transparent 70%)',
            animation: 'float 8s ease-in-out infinite'
          }}
        />
        <div 
          className="absolute top-1/4 left-0 w-80 h-80 rounded-full blur-3xl opacity-25 animate-pulse"
          style={{ 
            background: 'radial-gradient(circle, rgba(168,85,247,0.4) 0%, rgba(139,92,246,0.2) 40%, transparent 70%)',
            animation: 'float 10s ease-in-out infinite reverse',
            animationDelay: '2s'
          }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full blur-3xl opacity-20 animate-pulse"
          style={{ 
            background: 'radial-gradient(circle, rgba(6,182,212,0.4) 0%, rgba(14,165,233,0.2) 40%, transparent 70%)',
            animation: 'float 12s ease-in-out infinite',
            animationDelay: '4s'
          }}
        />
        
        {/* Floating Particles */}
        {PROFILE_PARTICLES.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${p.w}px`,
              height: `${p.h}px`,
              left: `${p.x}%`,
              top: `${p.y}%`,
              background: p.c,
              opacity: p.o,
              animation: `float ${p.dur}s ease-in-out infinite`,
              animationDelay: `${p.delay}s`,
              boxShadow: `0 0 ${p.glow}px ${p.c}`,
            }}
          />
        ))}
      </div>

      {/* Add keyframes for animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -20px) scale(1.05); }
          50% { transform: translate(-15px, 15px) scale(0.95); }
          75% { transform: translate(15px, 10px) scale(1.02); }
        }
        @keyframes glow {
          0%, 100% { opacity: 0.5; filter: brightness(1); }
          50% { opacity: 1; filter: brightness(1.3); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          0% { opacity: 0; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes slideUp {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          0% { transform: translateY(-100%); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>

      {/* Sticky Header */}
      <div 
        className="sticky top-0 z-50 backdrop-blur-md border-b relative"
        style={{ 
          background: 'linear-gradient(135deg, rgba(7,7,26,0.95), rgba(13,26,42,0.95))', 
          borderColor: 'rgba(0,255,136,0.3)',
          boxShadow: '0 4px 20px rgba(0,255,136,0.1)',
          animation: 'slideDown 0.5s ease-out'
        }}
      >
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          {/* Back Button & Logo */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 transition-all relative overflow-hidden group"
          >
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            />
            <ArrowLeftIcon className="w-5 h-5 relative z-10" style={{ color: '#00ff88' }} />
            <span className="text-sm font-semibold relative z-10" style={{ color: 'rgba(255,255,255,0.6)' }}>Back</span>
          </button>

          {/* Title */}
          <h1 
            className="text-lg font-bold"
            style={{ 
              background: 'linear-gradient(135deg, #ffffff, #00ff88)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            Profile
          </h1>

          {/* Spacer */}
          <div className="w-16"></div>
        </div>
      </div>

      <div className="relative max-w-md mx-auto px-4 py-6">
        {/* Success/Error Messages */}
        {error && (
          <div 
            className="mb-6 p-4 rounded-xl text-red-400 flex items-center gap-3 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(220,38,38,0.15))',
              border: '2px solid rgba(239,68,68,0.4)',
              boxShadow: '0 4px 15px rgba(239,68,68,0.2)',
              animation: 'slideUp 0.5s ease-out'
            }}
          >
            <span className="text-xl">⚠️</span>
            <span className="font-semibold">{error}</span>
          </div>
        )}
        {success && (
          <div
            className="mb-6 p-4 rounded-xl flex items-center gap-3 relative overflow-hidden"
            style={{
              color: '#00ff88',
              background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.15))',
              border: '2px solid rgba(16,185,129,0.4)',
              boxShadow: '0 4px 15px rgba(16,185,129,0.2)',
              animation: 'slideUp 0.5s ease-out'
            }}
          >
            <span className="text-xl">✅</span>
            <span className="font-semibold">{success}</span>
          </div>
        )}

        {/* Profile Photo Section */}
        <div 
          className="rounded-2xl p-6 mb-6 text-center relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(139,92,246,0.15) 100%)',
            border: '2px solid rgba(168,85,247,0.3)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(168,85,247,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
            animation: 'fadeIn 0.8s ease-out 0.2s both'
          }}
        >
          {/* Animated Glow */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-3xl opacity-20"
            style={{ 
              background: 'radial-gradient(circle, rgba(168,85,247,0.8), transparent)',
              animation: 'glow 5s ease-in-out infinite'
            }}
          />
          
          <div className="relative z-10">
            {/* Profile Photo */}
            <div className="relative inline-block mb-4">
              <button
                onClick={() => profile?.profilePhoto && setShowPhotoViewer(true)}
                className="w-32 h-32 rounded-full flex items-center justify-center font-bold text-4xl relative overflow-hidden transition-all hover:scale-105 cursor-pointer group"
                style={{ 
                  background: profile?.profilePhoto 
                    ? 'transparent' 
                    : 'linear-gradient(135deg,#00ff88,#00d4ff)',
                  color: '#003320',
                  boxShadow: '0 8px 25px rgba(168,85,247,0.5), 0 0 40px rgba(168,85,247,0.3), inset 0 2px 0 rgba(255,255,255,0.3)',
                  border: '4px solid rgba(168,85,247,0.5)',
                  animation: 'float 3s ease-in-out infinite'
                }}
              >
                {profile?.profilePhoto ? (
                  <>
                    <img 
                      src={profile.profilePhoto} 
                      alt={profile.name} 
                      className="w-full h-full object-cover rounded-full" 
                    />
                    {/* Hover Overlay */}
                    <div 
                      className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    >
                      <div className="text-center">
                        <ZoomIn className="w-8 h-8 text-white mx-auto mb-1" />
                        <span className="text-white text-xs font-bold">View</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <span>{profile?.name?.charAt(0)?.toUpperCase() || 'P'}</span>
                )}
                
                {/* Glow Effect */}
                <div 
                  className="absolute inset-0 rounded-full blur-xl opacity-60 pointer-events-none"
                  style={{ 
                    background: 'radial-gradient(circle, rgba(168,85,247,0.8) 0%, transparent 70%)',
                    animation: 'glow 3s ease-in-out infinite'
                  }}
                />
              </button>
              
              {/* Upload Button Overlay */}
              <input
                type="file"
                ref={(ref) => setPhotoInputRef(ref)}
                onChange={handlePhotoInputChange}
                accept="image/jpeg,image/png,image/gif"
                className="hidden"
              />
            </div>

            {/* Change Photo Button */}
            <button
              onClick={() => photoInputRef?.click()}
              disabled={uploadingPhoto}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-base transition-all relative overflow-hidden group mx-auto disabled:opacity-50"
              style={{ 
                background: 'linear-gradient(135deg, #a855f7, #8b5cf6)',
                color: '#ffffff',
                boxShadow: '0 4px 15px rgba(168,85,247,0.4), inset 0 1px 0 rgba(255,255,255,0.2)'
              }}
            >
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style={{ background: 'rgba(255,255,255,0.1)' }}
              />
              {uploadingPhoto ? (
                <>
                  <div 
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin relative z-10"
                  ></div>
                  <span className="relative z-10">Uploading...</span>
                </>
              ) : (
                <>
                  <Camera className="w-5 h-5 relative z-10" />
                  <span className="relative z-10">Change Photo</span>
                </>
              )}
            </button>
            
            <p className="text-xs text-gray-400 mt-2">Max 5MB • JPG, PNG, GIF</p>
          </div>
        </div>

        {/* Profile Info Card */}
        <div 
          className="rounded-2xl p-5 mb-6 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(0,255,136,0.15) 0%, rgba(99,102,241,0.15) 100%)',
            border: '2px solid rgba(0,255,136,0.3)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0,255,136,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
            animation: 'fadeIn 0.8s ease-out 0.3s both'
          }}
        >
          {/* Animated Background Glow */}
          <div 
            className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-30"
            style={{ 
              background: 'radial-gradient(circle, rgba(0,255,136,0.6), transparent)',
              animation: 'glow 4s ease-in-out infinite'
            }}
          />
          <div 
            className="absolute bottom-0 left-0 w-32 h-32 rounded-full blur-3xl opacity-30"
            style={{ 
              background: 'radial-gradient(circle, rgba(99,102,241,0.6), transparent)',
              animation: 'glow 4s ease-in-out infinite reverse'
            }}
          />
          
          <div className="relative z-10">
            {/* User Name */}
            <h2 
              className="text-2xl font-black mb-3 text-center"
              style={{ 
                background: 'linear-gradient(135deg, #ffffff, #00ff88)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textShadow: 'none',
                filter: 'drop-shadow(0 2px 10px rgba(0,255,136,0.3))'
              }}
            >
              {profile?.name || 'No Name Set'}
            </h2>
              
            {/* Matchify Code - Always show with fallback */}
            <div className="mb-4">
              <div 
                className="p-4 rounded-xl relative overflow-hidden"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(0,255,136,0.25), rgba(0,255,136,0.2))',
                  border: '2px solid rgba(0,255,136,0.5)',
                  boxShadow: '0 4px 15px rgba(0,255,136,0.4), inset 0 1px 0 rgba(255,255,255,0.2)'
                }}
              >
                <div 
                  className="absolute inset-0 opacity-20"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 3s infinite'
                  }}
                />
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex-1">
                    <p className="text-xs font-bold mb-1" style={{ color: '#6ee7b7' }}>Matchify ID</p>
                    <p 
                      className="text-2xl font-mono font-black tracking-wider"
                      style={{ 
                        color: '#00ff88',
                        textShadow: '0 0 20px rgba(0,255,136,0.6)'
                      }}
                    >
                      {profile?.matchifyCode || 'Loading...'}
                    </p>
                    <p className="text-xs mt-1" style={{ color: '#6ee7b7' }}>
                      Your universal Matchify.pro ID
                    </p>
                  </div>
                  {profile?.matchifyCode && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(profile.matchifyCode);
                        setSuccess('Matchify ID copied!');
                        setTimeout(() => setSuccess(''), 2000);
                      }}
                      className="p-3 rounded-lg transition-all hover:scale-110"
                      style={{ 
                        background: 'rgba(0,255,136,0.3)',
                        border: '1px solid rgba(0,255,136,0.6)'
                      }}
                      title="Copy Matchify ID"
                    >
                      <svg className="w-6 h-6 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
              
            {/* Contact Information */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-3 min-w-0">
                <Mail className="w-5 h-5 text-green-300 flex-shrink-0" />
                {profile?.email
                  ? <span className="text-sm truncate min-w-0 text-gray-300">{profile.email}</span>
                  : <span className="text-sm text-gray-500 italic">No email added</span>
                }
              </div>
              {profile?.phone && (
                <div className="flex items-center gap-3 text-gray-300 min-w-0">
                  <Phone className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <span className="text-sm truncate min-w-0">{profile?.phone}</span>
                </div>
              )}
              {(profile?.city || profile?.state) && (
                <div className="flex items-center gap-3 text-gray-300 min-w-0">
                  <MapPin className="w-5 h-5 text-green-300 flex-shrink-0" />
                  <span className="text-sm truncate min-w-0">{[profile?.city, profile?.state].filter(Boolean).join(', ')}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {!isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all relative overflow-hidden group"
                    style={{ 
                      background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                      color: '#ffffff',
                      boxShadow: '0 4px 15px rgba(59,130,246,0.4), inset 0 1px 0 rgba(255,255,255,0.2)'
                    }}
                  >
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      style={{ background: 'rgba(255,255,255,0.1)' }}
                    />
                    <PencilSquareIcon className="w-5 h-5 relative z-10" />
                    <span className="relative z-10">Edit Profile</span>
                  </button>
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all relative overflow-hidden group"
                    style={{ 
                      background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(139,92,246,0.15))', 
                      border: '2px solid rgba(168,85,247,0.4)',
                      color: '#c4b5fd',
                      boxShadow: '0 4px 15px rgba(168,85,247,0.2)'
                    }}
                  >
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      style={{ background: 'rgba(168,85,247,0.1)' }}
                    />
                    <KeyIcon className="w-5 h-5 relative z-10" />
                    <span className="relative z-10">Password</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all relative overflow-hidden group disabled:opacity-50"
                    style={{ 
                      background: 'linear-gradient(135deg, #00ff88, #00d4ff)',
                      color: '#07071a',
                      boxShadow: '0 4px 15px rgba(0,255,136,0.4), inset 0 1px 0 rgba(255,255,255,0.2)'
                    }}
                  >
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      style={{ background: 'rgba(255,255,255,0.1)' }}
                    />
                    <Save className="w-5 h-5 relative z-10" />
                    <span className="relative z-10">{saving ? 'Saving...' : 'Save'}</span>
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all relative overflow-hidden group"
                    style={{ 
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.05))', 
                      border: '2px solid rgba(255,255,255,0.15)',
                      color: '#ffffff'
                    }}
                  >
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      style={{ background: 'rgba(255,255,255,0.05)' }}
                    />
                    <X className="w-5 h-5 relative z-10" />
                    <span className="relative z-10">Cancel</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Edit Form */}
        {isEditing && (
          <div
            className="rounded-2xl p-5 mb-6 relative overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="flex items-center gap-3 mb-5 relative z-10">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,212,255,0.15)' }}>
                <User className="w-5 h-5" style={{ color: '#00d4ff' }} />
              </div>
              <h2 className="text-base font-black text-white">Edit Profile Information</h2>
            </div>

            <div className="grid grid-cols-1 gap-6 relative z-10">
              {/* Name Field - Always Editable */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl text-white outline-none"
                  style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl text-white outline-none"
                  style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                  placeholder="Enter your phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl text-white outline-none appearance-none"
                  style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                >
                  <option value="" style={{ background: '#0d1025' }}>Select Gender</option>
                  <option value="MALE" style={{ background: '#0d1025' }}>Male</option>
                  <option value="FEMALE" style={{ background: '#0d1025' }}>Female</option>
                  <option value="OTHER" style={{ background: '#0d1025' }}>Other</option>
                </select>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  onFocus={() => {
                    if (formData.city.length >= 2 && citySuggestions.length > 0) {
                      setShowCitySuggestions(true);
                    }
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowCitySuggestions(false), 300);
                  }}
                  autoComplete="off"
                  className="w-full px-4 py-3 rounded-xl text-white outline-none"
                  style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                  placeholder="Enter your city"
                />

                {/* City Suggestions Dropdown */}
                {showCitySuggestions && citySuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 rounded-xl shadow-2xl overflow-hidden" style={{ background: '#0d1025', border: '1px solid rgba(0,255,136,0.25)' }}>
                    {citySuggestions.map((item, index) => (
                      <div
                        key={index}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleCitySelect(item.city, item.state);
                        }}
                        className="px-4 py-3 cursor-pointer transition-colors"
                        style={{ borderBottom: index < citySuggestions.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,255,136,0.08)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <div className="text-white font-medium text-sm">{item.city}</div>
                        <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{item.state}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  readOnly
                  className="w-full px-4 py-3 rounded-xl cursor-not-allowed"
                  style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}
                  placeholder="State (auto-filled)"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>Country</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl text-white outline-none"
                  style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
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

      {/* Photo Viewer Modal */}
      <PhotoViewer
        isOpen={showPhotoViewer}
        onClose={() => setShowPhotoViewer(false)}
        photoUrl={profile?.profilePhoto}
        userName={profile?.name}
      />

      {/* Confirmation Modal for Name/DOB */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl shadow-2xl max-w-md w-full overflow-hidden" style={{ background: '#0d1025', border: '1px solid rgba(255,255,255,0.1)' }}>
            {/* Header */}
            <div className="px-5 py-4 flex items-center gap-3" style={{ background: 'rgba(251,191,36,0.08)', borderBottom: '1px solid rgba(251,191,36,0.2)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(251,191,36,0.15)' }}>
                <AlertTriangle className="w-5 h-5" style={{ color: '#fbbf24' }} />
              </div>
              <h3 className="text-base font-bold text-white">Confirm Your Details</h3>
            </div>

            <div className="p-5">
              <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.7)' }}>
                Please verify the following information. <strong style={{ color: '#fbbf24' }}>Once saved, these fields cannot be changed.</strong>
              </p>

              <div className="flex items-center gap-2 p-3 rounded-xl mb-5" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
                <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: '#fbbf24' }} />
                <p className="text-sm" style={{ color: '#fbbf24' }}>Are you sure this information is correct?</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowConfirmModal(false); setPendingData(null); }}
                  className="flex-1 px-4 py-3 rounded-xl font-medium text-sm"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.75)' }}
                >
                  Go Back & Edit
                </button>
                <button
                  onClick={handleConfirmSave}
                  className="flex-1 px-4 py-3 rounded-xl font-medium text-sm"
                  style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff' }}
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
