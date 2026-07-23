import { useState, useRef, useEffect } from 'react';
import { SPORTS, isTeamSport } from '../../../config/sports';
import LocationPicker from '../../LocationPicker';

// Indian States
const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh'
];

// Major Indian Cities by State
const INDIAN_CITIES = {
  'Karnataka': ['Bangalore', 'Bengaluru', 'Mysore', 'Hubli', 'Mangalore'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Salem', 'Tiruppur'],
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar'],
  'Delhi': ['New Delhi', 'Delhi', 'Dwarka', 'Rohini'],
};

const ALL_CITIES = Object.values(INDIAN_CITIES).flat();

const BasicInfoStep = ({ formData, updateFormData, onNext }) => {
  const [errors, setErrors] = useState({});
  const [cityQuery, setCityQuery] = useState(formData.city || '');
  const [stateQuery, setStateQuery] = useState(formData.state || '');
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [showStateSuggestions, setShowStateSuggestions] = useState(false);
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [stateSuggestions, setStateSuggestions] = useState([]);

  // Team sports (Basketball) have no singles/doubles distinction — a team is a
  // team — so we don't ask. The field is pinned to 'singles' when the sport is
  // picked, purely so downstream code that reads format keeps a valid value.
  const teamSport = isTeamSport(formData.sport);
  
  const cityRef = useRef(null);
  const stateRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (cityRef.current && !cityRef.current.contains(e.target)) {
        setShowCitySuggestions(false);
      }
      if (stateRef.current && !stateRef.current.contains(e.target)) {
        setShowStateSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filterCities = (query) => {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    let cities = [];
    if (formData.state && INDIAN_CITIES[formData.state]) {
      cities = INDIAN_CITIES[formData.state].filter(city => 
        city.toLowerCase().includes(q)
      );
    }
    const allMatches = ALL_CITIES.filter(city => 
      city.toLowerCase().includes(q) && !cities.includes(city)
    );
    return [...cities, ...allMatches].slice(0, 8);
  };

  const filterStates = (query) => {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    return INDIAN_STATES.filter(state => 
      state.toLowerCase().includes(q)
    ).slice(0, 8);
  };

  const handleCityChange = (value) => {
    setCityQuery(value);
    updateFormData('city', value);
    const suggestions = filterCities(value);
    setCitySuggestions(suggestions);
    setShowCitySuggestions(suggestions.length > 0);
  };

  const handleStateChange = (value) => {
    setStateQuery(value);
    updateFormData('state', value);
    const suggestions = filterStates(value);
    setStateSuggestions(suggestions);
    setShowStateSuggestions(suggestions.length > 0);
  };

  const selectCity = (city) => {
    setCityQuery(city);
    updateFormData('city', city);
    setShowCitySuggestions(false);
    for (const [state, cities] of Object.entries(INDIAN_CITIES)) {
      if (cities.includes(city)) {
        setStateQuery(state);
        updateFormData('state', state);
        break;
      }
    }
  };

  const selectState = (state) => {
    setStateQuery(state);
    updateFormData('state', state);
    setShowStateSuggestions(false);
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Tournament name is required';
    if (formData.name.length < 5) newErrors.name = 'Name must be at least 5 characters';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (formData.description.length < 20) newErrors.description = 'Description must be at least 20 characters';
    if (formData.description.length > 500) newErrors.description = 'Description must not exceed 500 characters';
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
    <div className="space-y-4">
      <h2 
        className="text-lg font-black mb-4"
        style={{
          background: 'linear-gradient(135deg, #D97706, #F59E0B)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}
      >
        Tournament Basic Information
      </h2>
      
      {/* Tournament Name */}
      <div>
        <label className="block text-xs font-bold text-emerald-400 mb-1.5">
          Tournament Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => updateFormData('name', e.target.value)}
          placeholder="e.g., Bangalore Summer Open 2025"
          className={`w-full px-3 py-2.5 text-sm rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
            errors.name ? 'border-red-500' : 'border-emerald-500/30'
          }`}
          style={{
            background: 'rgba(0,0,0,0.3)',
            border: errors.name ? '1.5px solid rgba(239,68,68,0.5)' : '1.5px solid rgba(245,158,11,0.3)'
          }}
        />
        {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-bold text-emerald-400 mb-1.5">
          Description <span className="text-red-400">*</span>
          <span className={`text-xs ml-2 ${formData.description.length < 20 ? 'text-red-400' : 'text-gray-500'}`}>
            ({formData.description.length}/20 min, 500 max)
          </span>
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => updateFormData('description', e.target.value)}
          placeholder="Describe your tournament (minimum 20 characters)..."
          rows={3}
          maxLength={500}
          className={`w-full px-3 py-2.5 text-sm rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none ${
            errors.description ? 'border-red-500' : 'border-emerald-500/30'
          }`}
          style={{
            background: 'rgba(0,0,0,0.3)',
            border: errors.description ? '1.5px solid rgba(239,68,68,0.5)' : '1.5px solid rgba(245,158,11,0.3)'
          }}
        />
        {errors.description && (
          <div className="mt-2 rounded-lg p-2 flex items-start gap-2" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <span className="text-red-400 text-xs">⚠️</span>
            <p className="text-xs text-red-400 font-medium">{errors.description}</p>
          </div>
        )}
        {!errors.description && formData.description.length > 0 && formData.description.length < 20 && (
          <p className="mt-1 text-xs text-amber-400">
            ⚠️ Need {20 - formData.description.length} more characters
          </p>
        )}
      </div>

      {/* Sport — clear chip selector so the sport is chosen deliberately */}
      <div>
        <label className="block text-xs font-bold text-purple-400 mb-1.5">Sport</label>
        <div className="grid grid-cols-3 gap-2">
          {SPORTS.map((s) => {
            const active = (formData.sport || 'Badminton') === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  updateFormData('sport', s.id);
                  // Team sports don't ask singles/doubles — keep a valid value.
                  if (s.teamSport) updateFormData('format', 'singles');
                }}
                className="flex flex-col items-center justify-center gap-0.5 py-2.5 rounded-xl text-xs font-bold transition-all"
                style={{
                  background: active ? 'rgba(168,85,247,0.22)' : 'rgba(0,0,0,0.3)',
                  border: `1.5px solid ${active ? 'rgba(168,85,247,0.75)' : 'rgba(168,85,247,0.22)'}`,
                  color: active ? '#ffffff' : 'rgba(255,255,255,0.6)',
                }}
              >
                <span style={{ fontSize: '18px', lineHeight: 1 }}>{s.emoji}</span>
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Format & Privacy — Format is not asked for team sports */}
      <div className={teamSport ? '' : 'grid grid-cols-2 gap-3'}>
        {!teamSport && (
        <div>
          <label className="block text-xs font-bold text-purple-400 mb-1.5">Format</label>
          <select
            value={formData.format}
            onChange={(e) => updateFormData('format', e.target.value)}
            className="w-full px-3 py-2.5 text-sm rounded-xl text-white focus:ring-2 focus:ring-purple-500 transition-all"
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1.5px solid rgba(168,85,247,0.3)'
            }}
          >
            <option value="singles">Singles Only</option>
            <option value="doubles">Doubles Only</option>
            <option value="both">Both</option>
          </select>
        </div>
        )}
        <div>
          <label className="block text-xs font-bold text-purple-400 mb-1.5">Privacy</label>
          <select
            value={formData.privacy}
            onChange={(e) => updateFormData('privacy', e.target.value)}
            className="w-full px-3 py-2.5 text-sm rounded-xl text-white focus:ring-2 focus:ring-purple-500 transition-all"
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1.5px solid rgba(168,85,247,0.3)'
            }}
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </div>
      </div>

      {/* Venue */}
      <div>
        <label className="block text-xs font-bold text-cyan-400 mb-1.5">
          Venue <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={formData.venue}
          onChange={(e) => updateFormData('venue', e.target.value)}
          placeholder="e.g., Koramangala Indoor Stadium"
          className={`w-full px-3 py-2.5 text-sm rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 transition-all ${
            errors.venue ? 'border-red-500' : ''
          }`}
          style={{
            background: 'rgba(0,0,0,0.3)',
            border: errors.venue ? '1.5px solid rgba(239,68,68,0.5)' : '1.5px solid rgba(245,158,11,0.3)'
          }}
        />
        {errors.venue && <p className="mt-1 text-xs text-red-400">{errors.venue}</p>}
      </div>

      {/* Address */}
      <div>
        <label className="block text-xs font-bold text-cyan-400 mb-1.5">
          Address <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={formData.address}
          onChange={(e) => updateFormData('address', e.target.value)}
          placeholder="e.g., 123 Main Street"
          className={`w-full px-3 py-2.5 text-sm rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 transition-all ${
            errors.address ? 'border-red-500' : ''
          }`}
          style={{
            background: 'rgba(0,0,0,0.3)',
            border: errors.address ? '1.5px solid rgba(239,68,68,0.5)' : '1.5px solid rgba(245,158,11,0.3)'
          }}
        />
        {errors.address && <p className="mt-1 text-xs text-red-400">{errors.address}</p>}
      </div>

      {/* Venue location on map (optional) — free OpenStreetMap picker → lat/lng */}
      <LocationPicker
        latitude={formData.latitude}
        longitude={formData.longitude}
        locationName={formData.locationName}
        onChange={({ latitude, longitude, locationName }) => {
          updateFormData('latitude', latitude);
          updateFormData('longitude', longitude);
          updateFormData('locationName', locationName);
        }}
      />

      {/* City, State, Pincode */}
      <div className="grid grid-cols-3 gap-2">
        <div className="relative" ref={cityRef}>
          <label className="block text-xs font-bold text-orange-400 mb-1.5">
            City <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={cityQuery}
            onChange={(e) => handleCityChange(e.target.value)}
            onFocus={() => cityQuery.length >= 2 && setShowCitySuggestions(citySuggestions.length > 0)}
            placeholder="City"
            className={`w-full px-3 py-2.5 text-sm rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 transition-all ${
              errors.city ? 'border-red-500' : ''
            }`}
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: errors.city ? '1.5px solid rgba(239,68,68,0.5)' : '1.5px solid rgba(245,158,11,0.3)'
            }}
          />
          {showCitySuggestions && citySuggestions.length > 0 && (
            <div 
              className="absolute z-10 w-full mt-1 rounded-xl shadow-lg max-h-48 overflow-y-auto"
              style={{
                background: 'rgba(0,0,0,0.95)',
                border: '1.5px solid rgba(245,158,11,0.3)',
                backdropFilter: 'blur(20px)'
              }}
            >
              {citySuggestions.map((city, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => selectCity(city)}
                  className="w-full px-3 py-2 text-left hover:bg-emerald-500/20 text-xs text-gray-300 border-b border-white/5 last:border-0"
                >
                  {city}
                </button>
              ))}
            </div>
          )}
          {errors.city && <p className="mt-1 text-xs text-red-400">{errors.city}</p>}
        </div>

        <div className="relative" ref={stateRef}>
          <label className="block text-xs font-bold text-orange-400 mb-1.5">
            State <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={stateQuery}
            onChange={(e) => handleStateChange(e.target.value)}
            onFocus={() => stateQuery.length >= 2 && setShowStateSuggestions(stateSuggestions.length > 0)}
            placeholder="State"
            className={`w-full px-3 py-2.5 text-sm rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 transition-all ${
              errors.state ? 'border-red-500' : ''
            }`}
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: errors.state ? '1.5px solid rgba(239,68,68,0.5)' : '1.5px solid rgba(245,158,11,0.3)'
            }}
          />
          {showStateSuggestions && stateSuggestions.length > 0 && (
            <div 
              className="absolute z-10 w-full mt-1 rounded-xl shadow-lg max-h-48 overflow-y-auto"
              style={{
                background: 'rgba(0,0,0,0.95)',
                border: '1.5px solid rgba(245,158,11,0.3)',
                backdropFilter: 'blur(20px)'
              }}
            >
              {stateSuggestions.map((state, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => selectState(state)}
                  className="w-full px-3 py-2 text-left hover:bg-emerald-500/20 text-xs text-gray-300 border-b border-white/5 last:border-0"
                >
                  {state}
                </button>
              ))}
            </div>
          )}
          {errors.state && <p className="mt-1 text-xs text-red-400">{errors.state}</p>}
        </div>

        <div>
          <label className="block text-xs font-bold text-orange-400 mb-1.5">
            Pincode <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={formData.pincode}
            onChange={(e) => updateFormData('pincode', e.target.value)}
            placeholder="560001"
            className={`w-full px-3 py-2.5 text-sm rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 transition-all ${
              errors.pincode ? 'border-red-500' : ''
            }`}
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: errors.pincode ? '1.5px solid rgba(239,68,68,0.5)' : '1.5px solid rgba(245,158,11,0.3)'
            }}
          />
          {errors.pincode && <p className="mt-1 text-xs text-red-400">{errors.pincode}</p>}
        </div>
      </div>

      {/* Zone */}
      <div>
        <label className="block text-xs font-bold text-indigo-400 mb-1.5">
          Zone <span className="text-red-400">*</span>
        </label>
        <select
          value={formData.zone}
          onChange={(e) => updateFormData('zone', e.target.value)}
          className={`w-full px-3 py-2.5 text-sm rounded-xl text-white focus:ring-2 focus:ring-indigo-500 transition-all ${
            errors.zone ? 'border-red-500' : ''
          }`}
          style={{
            background: 'rgba(0,0,0,0.3)',
            border: errors.zone ? '1.5px solid rgba(239,68,68,0.5)' : '1.5px solid rgba(99,102,241,0.3)'
          }}
        >
          <option value="">Select Zone</option>
          <option value="North">North</option>
          <option value="South">South</option>
          <option value="East">East</option>
          <option value="West">West</option>
          <option value="Central">Central</option>
          <option value="Northeast">Northeast</option>
        </select>
        {errors.zone && <p className="mt-1 text-xs text-red-400">{errors.zone}</p>}
      </div>

      {/* Contact Info — Optional */}
      <div className="rounded-2xl p-4 space-y-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div>
          <p className="text-sm font-black text-white mb-0.5">Contact Information</p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Visible to players on the tournament page — both fields optional</p>
        </div>

        <div>
          <label className="block text-xs font-bold mb-1.5" style={{ color: 'rgba(168,85,247,0.9)' }}>
            📞 Contact Phone
          </label>
          <div className="flex overflow-hidden rounded-xl" style={{ border: '1.5px solid rgba(168,85,247,0.3)' }}>
            <span className="flex items-center px-3 text-sm font-bold flex-shrink-0"
              style={{ background: 'rgba(168,85,247,0.12)', borderRight: '1px solid rgba(168,85,247,0.25)', color: 'rgba(168,85,247,0.9)' }}>
              +91
            </span>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={(formData.contactPhone || '').replace(/^\+?91/, '')}
              onChange={(e) => updateFormData('contactPhone', '+91' + e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="9876543210"
              className="flex-1 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              style={{ background: 'rgba(0,0,0,0.3)' }}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold mb-1.5" style={{ color: 'rgba(37,211,102,0.9)' }}>
            💬 WhatsApp Number
          </label>
          <div className="flex overflow-hidden rounded-xl" style={{ border: '1.5px solid rgba(37,211,102,0.3)' }}>
            <span className="flex items-center px-3 text-sm font-bold flex-shrink-0"
              style={{ background: 'rgba(37,211,102,0.1)', borderRight: '1px solid rgba(37,211,102,0.2)', color: 'rgba(37,211,102,0.9)' }}>
              +91
            </span>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={(formData.whatsappNumber || '').replace(/^\+?91/, '')}
              onChange={(e) => updateFormData('whatsappNumber', '+91' + e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="9876543210 (leave blank if same as above)"
              className="flex-1 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all"
              style={{ background: 'rgba(0,0,0,0.3)' }}
            />
          </div>
          <p className="mt-1 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Players will see a WhatsApp button to message you directly
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-end pt-4 border-t border-white/10">
        <button
          onClick={handleNext}
          className="px-6 py-3 rounded-xl font-bold text-sm transition-all"
          style={{ 
            background: 'linear-gradient(135deg, #a855f7, #8b5cf6)',
            color: '#ffffff',
            boxShadow: '0 6px 20px rgba(168,85,247,0.4)'
          }}
        >
          Next: Dates →
        </button>
      </div>
    </div>
  );
};

export default BasicInfoStep;

