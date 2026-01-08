import { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';

export default function ImageUpload({ currentImage, onUpload, onRemove }) {
  const [preview, setPreview] = useState(currentImage);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
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
      alert('Upload failed. Please try again.');
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
        alert('Failed to remove photo. Please try again.');
      }
    } else {
      setPreview(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar Display */}
      <div className="relative">
        <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 border-4 border-white shadow-lg">
          {preview ? (
            <img src={preview} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <Upload size={48} />
            </div>
          )}
        </div>

        {/* Remove button */}
        {preview && !uploading && (
          <button
            onClick={handleRemove}
            className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
          >
            <X size={16} />
          </button>
        )}

        {/* Upload overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
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
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition"
      >
        {uploading ? 'Uploading...' : 'Change Photo'}
      </button>
      <p className="text-sm text-gray-500">Max 5MB • JPG, PNG, GIF</p>
    </div>
  );
}