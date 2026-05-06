import { useState } from 'react';
import { Camera, Upload, X, AlertCircle } from 'lucide-react';
import { profileAPI } from '../api/profile';
import { useAuth } from '../contexts/AuthContext';

export default function MandatoryProfilePhotoModal({ isOpen }) {
  const { user, updateUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  if (!isOpen) return null;

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, GIF)');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setError('');
    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a photo first');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('photo', selectedFile);

      const response = await profileAPI.uploadProfilePhoto(formData);
      
      // Update user context with new profile photo
      const updatedUser = { ...user, profilePhoto: response.data.profilePhoto };
      updateUser(updatedUser);

      // Success - modal will close automatically because user now has photo
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative bg-slate-800 border border-white/10 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-5">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiLz48cGF0aCBkPSJNMjAgMjBtLTEgMGExIDEgMCAxIDAgMiAwYTEgMSAwIDEgMCAtMiAwIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L2c+PC9zdmc+')] opacity-30"></div>
          <div className="relative flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Camera className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Profile Photo Required</h2>
              <p className="text-white/70 text-sm">Complete your profile to continue</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Info Message */}
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 px-4 py-3 rounded-xl mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold mb-1">Action Required</p>
              <p>Please upload a profile photo to continue using Matchify.pro. This helps other players recognize you in tournaments.</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Upload Area */}
          <div className="space-y-4">
            {/* Preview or Upload Button */}
            {preview ? (
              <div className="relative">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-xl border-2 border-white/10"
                />
                <button
                  onClick={() => {
                    setPreview(null);
                    setSelectedFile(null);
                  }}
                  className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            ) : (
              <label className="block cursor-pointer">
                <div className="border-2 border-dashed border-white/20 rounded-xl p-8 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all">
                  <div className="text-center">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-white font-medium mb-1">Click to upload photo</p>
                    <p className="text-gray-400 text-sm">JPG, PNG or GIF (max 5MB)</p>
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            )}

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {uploading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Uploading...
                </span>
              ) : (
                'Upload Photo & Continue'
              )}
            </button>
          </div>

          {/* Note */}
          <p className="text-center text-gray-400 text-xs mt-4">
            You cannot skip this step. A profile photo is required to use the platform.
          </p>
        </div>
      </div>
    </div>
  );
}
