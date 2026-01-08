import { useState } from 'react';

const CourtsStep = ({ formData, updateMultipleFields, onNext, onPrev }) => {
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    updateMultipleFields({ [field]: value });
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.totalCourts || formData.totalCourts < 1) {
      newErrors.totalCourts = 'Must have at least 1 court';
    }

    if (!formData.matchStartTime) {
      newErrors.matchStartTime = 'Match start time is required';
    }

    if (!formData.matchEndTime) {
      newErrors.matchEndTime = 'Match end time is required';
    }

    if (formData.matchStartTime && formData.matchEndTime) {
      const start = formData.matchStartTime.split(':').map(Number);
      const end = formData.matchEndTime.split(':').map(Number);
      const startMinutes = start[0] * 60 + start[1];
      const endMinutes = end[0] * 60 + end[1];

      if (endMinutes <= startMinutes) {
        newErrors.matchEndTime = 'End time must be after start time';
      }

      const duration = endMinutes - startMinutes;
      if (duration < 60) {
        newErrors.matchEndTime = 'Must have at least 1 hour of play time';
      }
    }

    if (!formData.matchDuration || formData.matchDuration < 15) {
      newErrors.matchDuration = 'Match duration must be at least 15 minutes';
    }

    if (formData.matchDuration > 180) {
      newErrors.matchDuration = 'Match duration cannot exceed 3 hours';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext();
    }
  };

  // Calculate estimated matches per day
  const calculateMatchesPerDay = () => {
    if (!formData.matchStartTime || !formData.matchEndTime || !formData.matchDuration || !formData.totalCourts) {
      return 0;
    }

    const start = formData.matchStartTime.split(':').map(Number);
    const end = formData.matchEndTime.split(':').map(Number);
    const startMinutes = start[0] * 60 + start[1];
    const endMinutes = end[0] * 60 + end[1];
    const availableMinutes = endMinutes - startMinutes;

    if (availableMinutes <= 0) return 0;

    const matchesPerCourt = Math.floor(availableMinutes / formData.matchDuration);
    return matchesPerCourt * formData.totalCourts;
  };

  const matchesPerDay = calculateMatchesPerDay();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Courts & Timing</h2>
        <p className="text-gray-600 mt-1">Configure court availability and match scheduling</p>
      </div>

      {/* Total Courts */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Total Courts Available *
        </label>
        <input
          type="number"
          value={formData.totalCourts}
          onChange={(e) => handleChange('totalCourts', Number(e.target.value))}
          min="1"
          max="50"
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.totalCourts ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.totalCourts && <p className="text-red-500 text-sm mt-1">{errors.totalCourts}</p>}
        <p className="text-sm text-gray-500 mt-1">
          Number of courts available for matches at your venue
        </p>
      </div>

      {/* Match Timing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Match Start Time *
          </label>
          <input
            type="time"
            value={formData.matchStartTime}
            onChange={(e) => handleChange('matchStartTime', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.matchStartTime ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.matchStartTime && <p className="text-red-500 text-sm mt-1">{errors.matchStartTime}</p>}
          <p className="text-sm text-gray-500 mt-1">When matches can start each day</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Match End Time *
          </label>
          <input
            type="time"
            value={formData.matchEndTime}
            onChange={(e) => handleChange('matchEndTime', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.matchEndTime ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.matchEndTime && <p className="text-red-500 text-sm mt-1">{errors.matchEndTime}</p>}
          <p className="text-sm text-gray-500 mt-1">When matches must end each day</p>
        </div>
      </div>

      {/* Match Duration */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Average Match Duration (minutes) *
        </label>
        <input
          type="number"
          value={formData.matchDuration}
          onChange={(e) => handleChange('matchDuration', Number(e.target.value))}
          min="15"
          max="180"
          step="5"
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.matchDuration ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.matchDuration && <p className="text-red-500 text-sm mt-1">{errors.matchDuration}</p>}
        <p className="text-sm text-gray-500 mt-1">
          Estimated time per match including setup and breaks (typically 45-60 minutes)
        </p>
      </div>

      {/* Capacity Estimate */}
      {matchesPerDay > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-2">📊 Estimated Capacity</h4>
          <div className="text-sm text-green-800 space-y-1">
            <p>
              <span className="font-semibold">Matches per day:</span> ~{matchesPerDay} matches
            </p>
            <p className="text-xs text-green-700 mt-2">
              Based on {formData.totalCourts} court(s), {formData.matchDuration} min per match, 
              from {formData.matchStartTime} to {formData.matchEndTime}
            </p>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Scheduling Tips:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Include time for court setup and player warm-up</li>
          <li>• Consider breaks between matches for court maintenance</li>
          <li>• Singles matches typically take 30-45 minutes</li>
          <li>• Doubles matches typically take 45-60 minutes</li>
          <li>• Best of 3 games usually takes longer than single game format</li>
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
          Next: Review →
        </button>
      </div>
    </div>
  );
};

export default CourtsStep;
