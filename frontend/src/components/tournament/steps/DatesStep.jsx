import { useState } from 'react';

const DatesStep = ({ formData, updateMultipleFields, onNext, onPrev }) => {
  const updateFormData = (field, value) => {
    updateMultipleFields({ [field]: value });
  };
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    
    if (!formData.registrationOpenDate) newErrors.registrationOpenDate = 'Registration open date is required';
    if (!formData.registrationCloseDate) newErrors.registrationCloseDate = 'Registration close date is required';
    if (!formData.startDate) newErrors.startDate = 'Tournament start date is required';
    if (!formData.endDate) newErrors.endDate = 'Tournament end date is required';

    // Date logic validation
    const regOpen = new Date(formData.registrationOpenDate);
    const regClose = new Date(formData.registrationCloseDate);
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const now = new Date();
    
    // Set now to start of current minute for fair comparison
    now.setSeconds(0, 0);

    // Registration can open today (allow same day, just not past time)
    if (formData.registrationOpenDate && regOpen < now) {
      newErrors.registrationOpenDate = 'Registration open date cannot be in the past';
    }
    // Registration close must be after or same as open
    if (formData.registrationOpenDate && formData.registrationCloseDate && regClose < regOpen) {
      newErrors.registrationCloseDate = 'Registration close date must be after or same as open date';
    }
    // Tournament start must be on or after registration close
    if (formData.registrationCloseDate && formData.startDate && start < regClose) {
      newErrors.startDate = 'Tournament start must be on or after registration close';
    }
    // Tournament end must be on or after start
    if (formData.startDate && formData.endDate && end < start) {
      newErrors.endDate = 'Tournament end date must be on or after start date';
    }

    // Check duration
    if (formData.startDate && formData.endDate) {
      const daysDiff = (end - start) / (1000 * 60 * 60 * 24);
      if (daysDiff > 30) {
        newErrors.endDate = 'Tournament duration cannot exceed 30 days';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext();
    }
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    // If it's already in the correct format (YYYY-MM-DDTHH:mm), return as is
    if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)) {
      return dateString.slice(0, 16);
    }
    // Convert to local datetime format without timezone conversion
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Tournament Dates</h2>
      <p className="text-gray-400">Set up your tournament timeline</p>

      {/* Registration Period */}
      <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
        <h3 className="font-semibold text-purple-300 mb-4">Registration Period</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Registration Opens <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={formatDateForInput(formData.registrationOpenDate)}
              onChange={(e) => updateFormData('registrationOpenDate', e.target.value)}
              className={`w-full px-4 py-3 bg-slate-700/50 border rounded-xl text-white focus:ring-2 focus:ring-purple-500 transition-all ${
                errors.registrationOpenDate ? 'border-red-500' : 'border-white/10'
              }`}
            />
            {errors.registrationOpenDate && (
              <p className="mt-1 text-sm text-red-400">{errors.registrationOpenDate}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Registration Closes <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={formatDateForInput(formData.registrationCloseDate)}
              onChange={(e) => updateFormData('registrationCloseDate', e.target.value)}
              className={`w-full px-4 py-3 bg-slate-700/50 border rounded-xl text-white focus:ring-2 focus:ring-purple-500 transition-all ${
                errors.registrationCloseDate ? 'border-red-500' : 'border-white/10'
              }`}
            />
            {errors.registrationCloseDate && (
              <p className="mt-1 text-sm text-red-400">{errors.registrationCloseDate}</p>
            )}
          </div>
        </div>
      </div>

      {/* Tournament Period */}
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
        <h3 className="font-semibold text-emerald-300 mb-4">Tournament Period</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Tournament Starts <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={formatDateForInput(formData.startDate)}
              onChange={(e) => updateFormData('startDate', e.target.value)}
              className={`w-full px-4 py-3 bg-slate-700/50 border rounded-xl text-white focus:ring-2 focus:ring-purple-500 transition-all ${
                errors.startDate ? 'border-red-500' : 'border-white/10'
              }`}
            />
            {errors.startDate && (
              <p className="mt-1 text-sm text-red-400">{errors.startDate}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Tournament Ends <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={formatDateForInput(formData.endDate)}
              onChange={(e) => updateFormData('endDate', e.target.value)}
              className={`w-full px-4 py-3 bg-slate-700/50 border rounded-xl text-white focus:ring-2 focus:ring-purple-500 transition-all ${
                errors.endDate ? 'border-red-500' : 'border-white/10'
              }`}
            />
            {errors.endDate && (
              <p className="mt-1 text-sm text-red-400">{errors.endDate}</p>
            )}
          </div>
        </div>
      </div>

      {/* Date Summary */}
      {formData.startDate && formData.endDate && (
        <div className="bg-slate-700/30 border border-white/10 rounded-xl p-4">
          <h4 className="font-medium text-white mb-2">Timeline Summary</h4>
          <div className="space-y-1 text-sm text-gray-400">
            <p>• Registration window: {
              formData.registrationOpenDate && formData.registrationCloseDate
                ? `${Math.ceil((new Date(formData.registrationCloseDate) - new Date(formData.registrationOpenDate)) / (1000 * 60 * 60 * 24))} days`
                : 'Not set'
            }</p>
            <p>• Tournament duration: {
              Math.ceil((new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24))} days
            </p>
          </div>
        </div>
      )}

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
          Next: Posters →
        </button>
      </div>
    </div>
  );
};

export default DatesStep;
