import { useState, useRef } from 'react';
import { PhotoIcon, XMarkIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { AlertTriangle, ImageIcon, X, Image } from 'lucide-react';

const PostersStep = ({ formData, updateFormData, onNext, onPrev }) => {
  const [dragActive, setDragActive] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [alertModal, setAlertModal] = useState(null);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleFiles = (files) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (formData.posters.length + imageFiles.length > 5) {
      setAlertModal({ type: 'error', message: 'Maximum 5 posters allowed' });
      return;
    }

    const newPosters = imageFiles.map((file, index) => ({
      file,
      preview: URL.createObjectURL(file),
      isPrimary: formData.posters.length === 0 && index === 0,
    }));

    updateFormData('posters', [...formData.posters, ...newPosters]);
  };

  const removePoster = (index) => {
    const newPosters = formData.posters.filter((_, i) => i !== index);
    if (formData.posters[index].isPrimary && newPosters.length > 0) {
      newPosters[0].isPrimary = true;
    }
    updateFormData('posters', newPosters);
  };

  const setPrimaryPoster = (index) => {
    const newPosters = formData.posters.map((poster, i) => ({
      ...poster,
      isPrimary: i === index,
    }));
    updateFormData('posters', newPosters);
  };

  const handleNext = () => {
    if (formData.posters.length === 0) {
      setShowConfirmModal(true);
    } else {
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Tournament Posters</h2>
        <p className="text-gray-400 mt-1">Upload up to 5 posters for your tournament (optional)</p>
      </div>

      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragActive
            ? 'border-purple-500 bg-purple-500/10'
            : 'border-white/20 hover:border-purple-500/50 bg-slate-700/30'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
        />
        
        <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-500" />
        <p className="mt-2 text-sm text-gray-400">
          Drag and drop images here, or{' '}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-purple-400 hover:text-purple-300 font-medium"
          >
            browse
          </button>
        </p>
        <p className="mt-1 text-xs text-gray-500">
          PNG, JPG, GIF up to 10MB (Max 5 images)
        </p>
      </div>

      {/* Poster Preview Grid */}
      {formData.posters.length > 0 && (
        <div>
          <h3 className="font-medium text-white mb-3">
            Uploaded Posters ({formData.posters.length}/5)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {formData.posters.map((poster, index) => (
              <div
                key={index}
                className="relative group rounded-xl overflow-hidden border-2 border-white/10 hover:border-purple-500/50 transition-colors"
              >
                <img
                  src={poster.preview}
                  alt={`Poster ${index + 1}`}
                  className="w-full h-48 object-cover"
                />
                
                {poster.isPrimary && (
                  <div className="absolute top-2 left-2 bg-purple-600 text-white text-xs px-2 py-1 rounded-lg">
                    Primary
                  </div>
                )}

                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center gap-2">
                  {!poster.isPrimary && (
                    <button
                      onClick={() => setPrimaryPoster(index)}
                      className="opacity-0 group-hover:opacity-100 bg-white text-gray-900 px-3 py-1 rounded-lg text-sm font-medium hover:bg-gray-100 transition-opacity"
                    >
                      Set Primary
                    </button>
                  )}
                  <button
                    onClick={() => removePoster(index)}
                    className="opacity-0 group-hover:opacity-100 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-opacity"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
        <h4 className="font-medium text-purple-300 mb-2">Tips for great posters:</h4>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>• Use high-quality images (minimum 1200x1600 pixels)</li>
          <li>• The primary poster will be shown first in listings</li>
          <li>• Include tournament name, dates, and venue in the design</li>
          <li>• You can add or change posters later from the tournament dashboard</li>
        </ul>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-white/10">
        <button
          onClick={onPrev}
          className="px-6 py-3 bg-slate-700 text-gray-300 rounded-xl hover:bg-slate-600 transition-colors font-medium"
        >
          ← Back
        </button>
        <button
          onClick={handleNext}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all font-semibold"
        >
          Next: Categories →
        </button>
      </div>

      {/* Confirm Modal - No Posters */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-md">
            <div className="absolute -inset-2 bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500 rounded-3xl blur-xl opacity-50"></div>
            <div className="relative bg-slate-800 rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/20 rounded-lg">
                      <Image className="w-5 h-5 text-amber-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">No Posters Added</h3>
                  </div>
                  <button onClick={() => setShowConfirmModal(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-4 p-4 bg-slate-700/50 rounded-xl">
                  <div className="p-3 bg-purple-500/20 rounded-xl">
                    <Image className="w-8 h-8 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Continue without posters?</p>
                    <p className="text-sm text-gray-400 mt-1">You can add them later from the tournament dashboard.</p>
                  </div>
                </div>
                <p className="text-sm text-gray-400">
                  Posters help attract more participants to your tournament. We recommend adding at least one poster.
                </p>
              </div>
              <div className="p-6 bg-slate-900/50 border-t border-white/10 flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors font-medium"
                >
                  Add Posters
                </button>
                <button
                  onClick={() => { setShowConfirmModal(false); onNext(); }}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-xl transition-colors font-medium"
                >
                  Continue Anyway
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {alertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-sm">
            <div className={`absolute -inset-2 bg-gradient-to-r ${alertModal.type === 'success' ? 'from-emerald-500 to-teal-500' : 'from-red-500 to-rose-500'} rounded-3xl blur-xl opacity-50`}></div>
            <div className="relative bg-slate-800 rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-6 text-center">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${alertModal.type === 'success' ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                  <AlertTriangle className={`w-8 h-8 ${alertModal.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`} />
                </div>
                <h3 className={`text-lg font-semibold ${alertModal.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {alertModal.type === 'success' ? 'Success!' : 'Error'}
                </h3>
                <p className="text-gray-300 mt-2">{alertModal.message}</p>
              </div>
              <div className="p-4 bg-slate-900/50 border-t border-white/10">
                <button
                  onClick={() => setAlertModal(null)}
                  className={`w-full px-4 py-3 rounded-xl font-medium transition-colors ${
                    alertModal.type === 'success'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white'
                      : 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white'
                  }`}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostersStep;
