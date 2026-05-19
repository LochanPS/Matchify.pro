import { useState, useRef } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import { profileAPI } from '../api/profile';
import { useAuth } from '../contexts/AuthContext';

export default function MandatoryProfilePhotoModal({ isOpen }) {
  const { user, updateUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  if (!isOpen) return null;

  const processFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please select an image file (JPG, PNG, GIF)'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('Image must be less than 5MB'); return; }
    setError('');
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    processFile(e.dataTransfer.files?.[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) { setError('Please select a photo first'); return; }
    setUploading(true);
    setError('');
    try {
      const response = await profileAPI.uploadPhoto(selectedFile);
      updateUser({ ...user, profilePhoto: response.profilePhoto });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>

      {/* Glow blobs */}
      <div className="absolute top-1/3 left-1/3 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,255,136,0.08) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      <div className="absolute bottom-1/3 right-1/3 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)', filter: 'blur(40px)' }} />

      <div className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: '#0d1025', border: '1px solid rgba(0,255,136,0.15)' }}>

        {/* Top accent line */}
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #00ff88, #00d4ff, #a855f7)' }} />

        <div className="p-6">
          {/* Title */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"
              style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)' }}>
              <Camera size={26} style={{ color: '#00ff88' }} />
            </div>
            <h2 className="text-xl font-black text-white mb-1">Add Your Photo</h2>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Required to join tournaments
            </p>
          </div>

          {/* Upload Area */}
          <div
            onClick={() => !preview && inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className="relative mb-4 rounded-2xl overflow-hidden cursor-pointer transition-all"
            style={{
              height: preview ? 220 : 160,
              border: `2px dashed ${dragging ? '#00ff88' : preview ? 'transparent' : 'rgba(0,255,136,0.25)'}`,
              background: preview ? 'transparent' : dragging ? 'rgba(0,255,136,0.06)' : 'rgba(255,255,255,0.02)',
            }}>

            {preview ? (
              <>
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 50%)' }} />
                <button
                  onClick={(e) => { e.stopPropagation(); setPreview(null); setSelectedFile(null); }}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all"
                  style={{ background: 'rgba(255,59,48,0.9)', backdropFilter: 'blur(4px)' }}>
                  <X size={14} className="text-white" />
                </button>
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: '#00ff88' }} />
                  <span className="text-xs font-medium text-white">Photo selected</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-2 px-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-1"
                  style={{ background: 'rgba(0,255,136,0.1)' }}>
                  <Upload size={18} style={{ color: '#00ff88' }} />
                </div>
                <p className="text-white font-semibold text-sm">Tap to upload</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>JPG, PNG or GIF · max 5MB</p>
              </div>
            )}
          </div>

          <input ref={inputRef} type="file" accept="image/*" onChange={(e) => processFile(e.target.files?.[0])} className="hidden" />

          {error && (
            <div className="mb-4 px-3 py-2.5 rounded-xl text-xs flex items-center gap-2"
              style={{ background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.2)', color: '#ff6b6b' }}>
              ⚠️ {error}
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all"
            style={{
              background: selectedFile && !uploading
                ? 'linear-gradient(135deg, #00ff88, #00c853)'
                : 'rgba(255,255,255,0.06)',
              color: selectedFile && !uploading ? '#003320' : 'rgba(255,255,255,0.3)',
              cursor: !selectedFile || uploading ? 'not-allowed' : 'pointer',
              boxShadow: selectedFile && !uploading ? '0 8px 24px rgba(0,255,136,0.25)' : 'none',
            }}>
            {uploading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(0,51,32,0.3)', borderTopColor: '#003320' }} />
                Uploading...
              </span>
            ) : '✨ Upload & Continue'}
          </button>

          <p className="text-center text-xs mt-3" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Helps organizers & players identify you at tournaments
          </p>
        </div>
      </div>
    </div>
  );
}
