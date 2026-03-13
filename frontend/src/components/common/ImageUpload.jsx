import { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';

export default function ImageUpload({ currentImage, onUpload, onRemove }) {
  const [preview, setPreview] = useState(currentImage);
  const [uploading, setUploading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const fileInputRef = useRef(null);

  const showAlertModal = (message) => {
    setAlertMessage(message);
    setShowAlert(true);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      showAlertModal('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showAlertModal('File size must be less than 5MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    try {
      const result = await onUpload(file);
      if (result && result.profilePhoto) {
        setPreview(result.profilePhoto);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      showAlertModal('Upload failed. Please try again.');
      setPreview(currentImage);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (onRemove) {
      try {
        await onRemove();
        setPreview(null);
      } catch (error) {
        console.error('Remove failed:', error);
        showAlertModal('Failed to remove photo. Please try again.');
      }
    } else {
      setPreview(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar Display with Halo Effect */}
      <div className="relative">
        {/* Halo Effect */}
        <div className="absolute -inset-2 bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500 rounded-full blur-lg opacity-60 animate-pulse"></div>
        
        {/* Avatar Container */}
        <div className="relative w-32 h-32 rounded-full overflow-hidden bg-slate-700 border-4 border-white/20 shadow-2xl">
          {preview ? (
            <img src={preview} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 bg-slate-700">
              <Upload size={48} />
            </div>
          )}
        </div>

        {/* Remove button */}
        {preview && !uploading && (
          <button
            onClick={handleRemove}
            className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-all shadow-lg hover:scale-110 z-10"
          >
            <X size={16} />
          </button>
        )}

        {/* Upload overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center z-10">
            <Loader2 className="animate-spin text-white" size={32} />
          </div>
        )}
      </div>

      {/* Upload button */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 transition-all font-medium"
      >
        {uploading ? 'Uploading...' : 'Change Photo'}
      </button>
      <p className="text-sm text-gray-400">Max 5MB • JPG, PNG, GIF</p>

      {/* Alert Modal */}
      {showAlert && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative bg-slate-800 border border-white/10 rounded-2xl p-6 max-w-sm w-full text-center">
            <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <p className="text-white mb-6">{alertMessage}</p>
            <button
              onClick={() => setShowAlert(false)}
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-3 rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
