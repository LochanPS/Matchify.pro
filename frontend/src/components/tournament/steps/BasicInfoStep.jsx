import { useState } from 'react';

const BasicInfoStep = ({ formData, updateFormData, onNext }) => {
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Tournament name is required';
    if (formData.name.length < 5) newErrors.name = 'Name must be at least 5 characters';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (formData.description.length < 20) newErrors.description = 'Description must be at least 20 characters';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.venue.trim()) newErrors.venue = 'Venue is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.pincode.trim()) newErrors.pincode = 'Pincode is required';
    if (!formData.zone) newErrors.zone = 'Zone is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Tournament Basic Information</h2>
      
      {/* Tournament Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tournament Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => updateFormData('name', e.target.value)}
          placeholder="e.g., Bangalore Summer Open 2025"
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => updateFormData('description', e.target.value)}
          placeholder="Describe your tournament..."
          rows={4}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
      </div>

      {/* Format & Privacy - 2 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Format */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Format
          </label>
          <select
            value={formData.format}
            onChange={(e) => updateFormData('format', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="singles">Singles Only</option>
            <option value="doubles">Doubles Only</option>
            <option value="both">Both</option>
          </select>
        </div>

        {/* Privacy */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Privacy
          </label>
          <select
            value={formData.privacy}
            onChange={(e) => updateFormData('privacy', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </div>
      </div>

      {/* Venue */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Venue <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.venue}
          onChange={(e) => updateFormData('venue', e.target.value)}
          placeholder="e.g., Koramangala Indoor Stadium"
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
            errors.venue ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.venue && <p className="mt-1 text-sm text-red-500">{errors.venue}</p>}
      </div>

      {/* Address */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Address <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.address}
          onChange={(e) => updateFormData('address', e.target.value)}
          placeholder="e.g., 123 Main Street, Koramangala"
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
            errors.address ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.address && <p className="mt-1 text-sm text-red-500">{errors.address}</p>}
      </div>

      {/* Location - 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            City <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => updateFormData('city', e.target.value)}
            placeholder="e.g., Bangalore"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              errors.city ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.city && <p className="mt-1 text-sm text-red-500">{errors.city}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            State <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.state}
            onChange={(e) => updateFormData('state', e.target.value)}
            placeholder="e.g., Karnataka"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              errors.state ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.state && <p className="mt-1 text-sm text-red-500">{errors.state}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pincode <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.pincode}
            onChange={(e) => updateFormData('pincode', e.target.value)}
            placeholder="e.g., 560001"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              errors.pincode ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.pincode && <p className="mt-1 text-sm text-red-500">{errors.pincode}</p>}
        </div>
      </div>

      {/* Zone & Country */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Zone <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.zone}
            onChange={(e) => updateFormData('zone', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              errors.zone ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select Zone</option>
            <option value="North">North</option>
            <option value="South">South</option>
            <option value="East">East</option>
            <option value="West">West</option>
            <option value="Central">Central</option>
            <option value="Northeast">Northeast</option>
          </select>
          {errors.zone && <p className="mt-1 text-sm text-red-500">{errors.zone}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Country
          </label>
          <input
            type="text"
            value={formData.country}
            onChange={(e) => updateFormData('country', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-end pt-6 border-t">
        <button
          onClick={handleNext}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Next: Dates →
        </button>
      </div>
    </div>
  );
};

export default BasicInfoStep;
