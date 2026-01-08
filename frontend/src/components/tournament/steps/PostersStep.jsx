import { useState, useRef } from 'react';
import { PhotoIcon, XMarkIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';

const PostersStep = ({ formData, updateFormData, onNext, onPrev }) => {
  const [dragActive, setDragActive] = useState(false);
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
      alert('Maximum 5 posters allowed');
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
    // If we removed the primary poster, make the first one primary
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
      if (confirm('Are you sure you want to continue without posters? You can add them later.')) {
        onNext();
      }
    } else {
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Tournament Posters</h2>
        <p className="text-gray-600 mt-1">Upload up to 5 posters for your tournament (optional)</p>
      </div>

      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
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
        
        <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          Drag and drop images here, or{' '}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-blue-600 hover:text-blue-700 font-medium"
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
          <h3 className="font-medium text-gray-900 mb-3">
            Uploaded Posters ({formData.posters.length}/5)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {formData.posters.map((poster, index) => (
              <div
                key={index}
                className="relative group rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition-colors"
              >
                <img
                  src={poster.preview}
                  alt={`Poster ${index + 1}`}
                  className="w-full h-48 object-cover"
                />
                
                {/* Primary Badge */}
                {poster.isPrimary && (
                  <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                    Primary
                  </div>
                )}

                {/* Actions Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center gap-2">
                  {!poster.isPrimary && (
                    <button
                      onClick={() => setPrimaryPoster(index)}
                      className="opacity-0 group-hover:opacity-100 bg-white text-gray-900 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100 transition-opacity"
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
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Tips for great posters:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use high-quality images (minimum 1200x1600 pixels)</li>
          <li>• The primary poster will be shown first in listings</li>
          <li>• Include tournament name, dates, and venue in the design</li>
          <li>• You can add or change posters later from the tournament dashboard</li>
        </ul>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <button
          onClick={onPrev}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          ← Back
        </button>
        <button
          onClick={handleNext}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Next: Categories →
        </button>
      </div>
    </div>
  );
};

export default PostersStep;
