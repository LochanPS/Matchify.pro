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
    // For any other format, return as is (dates are now stored as strings)
    return dateString;
  };

  return (
    <div className="space-y-4">
      <h2 
        className="text-lg font-black mb-4"
        style={{
          background: 'linear-gradient(135deg, #00c853, #00ff88)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}
      >
        Tournament Dates
      </h2>

      {/* Registration Period */}
      <div className="rounded-xl p-4" style={{ background: 'rgba(168,85,247,0.1)', border: '1.5px solid rgba(168,85,247,0.3)' }}>
        <h3 className="font-bold text-purple-300 mb-3 text-sm">Registration Period</h3>
        
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-purple-400 mb-1.5">
              Registration Opens <span className="text-red-400">*</span>
            </label>
            <input
              type="datetime-local"
              value={formatDateForInput(formData.registrationOpenDate)}
              onChange={(e) => updateFormData('registrationOpenDate', e.target.value)}
              className={`w-full px-3 py-2.5 text-sm rounded-xl text-white focus:ring-2 focus:ring-purple-500 transition-all ${
                errors.registrationOpenDate ? 'border-red-500' : ''
              }`}
              style={{
                background: 'rgba(0,0,0,0.3)',
                border: errors.registrationOpenDate ? '1.5px solid rgba(239,68,68,0.5)' : '1.5px solid rgba(168,85,247,0.3)'
              }}
            />
            {errors.registrationOpenDate && (
              <p className="mt-1 text-xs text-red-400">{errors.registrationOpenDate}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-purple-400 mb-1.5">
              Registration Closes <span className="text-red-400">*</span>
            </label>
            <input
              type="datetime-local"
              value={formatDateForInput(formData.registrationCloseDate)}
              onChange={(e) => updateFormData('registrationCloseDate', e.target.value)}
              className={`w-full px-3 py-2.5 text-sm rounded-xl text-white focus:ring-2 focus:ring-purple-500 transition-all ${
                errors.registrationCloseDate ? 'border-red-500' : ''
              }`}
              style={{
                background: 'rgba(0,0,0,0.3)',
                border: errors.registrationCloseDate ? '1.5px solid rgba(239,68,68,0.5)' : '1.5px solid rgba(168,85,247,0.3)'
              }}
            />
            {errors.registrationCloseDate && (
              <p className="mt-1 text-xs text-red-400">{errors.registrationCloseDate}</p>
            )}
          </div>
        </div>
      </div>

      {/* Tournament Period */}
      <div className="rounded-xl p-4" style={{ background: 'rgba(0,200,83,0.1)', border: '1.5px solid rgba(0,200,83,0.3)' }}>
        <h3 className="font-bold text-emerald-300 mb-3 text-sm">Tournament Period</h3>
        
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-emerald-400 mb-1.5">
              Tournament Starts <span className="text-red-400">*</span>
            </label>
            <input
              type="datetime-local"
              value={formatDateForInput(formData.startDate)}
              onChange={(e) => updateFormData('startDate', e.target.value)}
              className={`w-full px-3 py-2.5 text-sm rounded-xl text-white focus:ring-2 focus:ring-emerald-500 transition-all ${
                errors.startDate ? 'border-red-500' : ''
              }`}
              style={{
                background: 'rgba(0,0,0,0.3)',
                border: errors.startDate ? '1.5px solid rgba(239,68,68,0.5)' : '1.5px solid rgba(0,200,83,0.3)'
              }}
            />
            {errors.startDate && (
              <p className="mt-1 text-xs text-red-400">{errors.startDate}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-emerald-400 mb-1.5">
              Tournament Ends <span className="text-red-400">*</span>
            </label>
            <input
              type="datetime-local"
              value={formatDateForInput(formData.endDate)}
              onChange={(e) => updateFormData('endDate', e.target.value)}
              className={`w-full px-3 py-2.5 text-sm rounded-xl text-white focus:ring-2 focus:ring-emerald-500 transition-all ${
                errors.endDate ? 'border-red-500' : ''
              }`}
              style={{
                background: 'rgba(0,0,0,0.3)',
                border: errors.endDate ? '1.5px solid rgba(239,68,68,0.5)' : '1.5px solid rgba(0,200,83,0.3)'
              }}
            />
            {errors.endDate && (
              <p className="mt-1 text-xs text-red-400">{errors.endDate}</p>
            )}
          </div>
        </div>
      </div>

      {/* Date Summary */}
      {formData.startDate && formData.endDate && (
        <div className="rounded-xl p-3" style={{ background: 'rgba(0,0,0,0.3)', border: '1.5px solid rgba(255,255,255,0.1)' }}>
          <h4 className="font-bold text-white mb-2 text-xs">Timeline Summary</h4>
          <div className="space-y-1 text-xs text-gray-400">
            <p>• Registration: {
              formData.registrationOpenDate && formData.registrationCloseDate
                ? `${Math.ceil((new Date(formData.registrationCloseDate) - new Date(formData.registrationOpenDate)) / (1000 * 60 * 60 * 24))} days`
                : 'Not set'
            }</p>
            <p>• Duration: {
              Math.ceil((new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24))} days
            </p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t border-white/10">
        <button
          onClick={onPrev}
          className="px-5 py-2.5 rounded-xl font-bold text-sm transition-all"
          style={{ background: 'rgba(100,116,139,0.5)', color: '#d1d5db' }}
        >
          ← Back
        </button>
        <button
          onClick={handleNext}
          className="px-5 py-2.5 rounded-xl font-bold text-sm transition-all"
          style={{ 
            background: 'linear-gradient(135deg, #a855f7, #8b5cf6)',
            color: '#ffffff',
            boxShadow: '0 6px 20px rgba(168,85,247,0.4)'
          }}
        >
          Next: Posters →
        </button>
      </div>
    </div>
  );
};

export default DatesStep;
