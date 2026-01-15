import { useState, useRef, useEffect } from 'react';

// Indian States
const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh',
  'Andaman and Nicobar Islands', 'Dadra and Nagar Haveli', 'Daman and Diu', 'Lakshadweep'
];

// Major Indian Cities by State
const INDIAN_CITIES = {
  'Karnataka': ['Bangalore', 'Bengaluru', 'Mysore', 'Mysuru', 'Hubli', 'Mangalore', 'Belgaum', 'Gulbarga', 'Davangere', 'Bellary', 'Shimoga', 'Tumkur', 'Udupi', 'Hassan', 'Mandya'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad', 'Solapur', 'Kolhapur', 'Amravati', 'Navi Mumbai', 'Sangli', 'Jalgaon', 'Akola', 'Latur', 'Ahmednagar'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Tiruppur', 'Vellore', 'Erode', 'Thoothukkudi', 'Dindigul', 'Thanjavur', 'Ranipet', 'Sivakasi', 'Karur'],
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Ramagundam', 'Khammam', 'Mahbubnagar', 'Nalgonda', 'Adilabad', 'Suryapet', 'Miryalaguda', 'Siddipet', 'Jagtial'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Junagadh', 'Gandhinagar', 'Anand', 'Nadiad', 'Morbi', 'Mehsana', 'Bharuch', 'Vapi', 'Navsari'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer', 'Udaipur', 'Bhilwara', 'Alwar', 'Bharatpur', 'Sikar', 'Pali', 'Sri Ganganagar', 'Kishangarh', 'Beawar', 'Hanumangarh'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Varanasi', 'Meerut', 'Prayagraj', 'Bareilly', 'Aligarh', 'Moradabad', 'Saharanpur', 'Gorakhpur', 'Noida', 'Firozabad', 'Jhansi'],
  'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Bardhaman', 'Malda', 'Baharampur', 'Habra', 'Kharagpur', 'Shantipur', 'Dankuni', 'Dhulian', 'Ranaghat', 'Haldia'],
  'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Palakkad', 'Alappuzha', 'Kannur', 'Kottayam', 'Malappuram', 'Kasaragod', 'Pathanamthitta', 'Idukki', 'Wayanad'],
  'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Pathankot', 'Hoshiarpur', 'Batala', 'Moga', 'Malerkotla', 'Khanna', 'Phagwara', 'Muktsar', 'Barnala'],
  'Haryana': ['Faridabad', 'Gurgaon', 'Gurugram', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak', 'Hisar', 'Karnal', 'Sonipat', 'Panchkula', 'Bhiwani', 'Sirsa', 'Bahadurgarh', 'Jind'],
  'Madhya Pradesh': ['Indore', 'Bhopal', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Dewas', 'Satna', 'Ratlam', 'Rewa', 'Murwara', 'Singrauli', 'Burhanpur', 'Khandwa', 'Bhind'],
  'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga', 'Bihar Sharif', 'Arrah', 'Begusarai', 'Katihar', 'Munger', 'Chhapra', 'Danapur', 'Saharsa', 'Sasaram'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Brahmapur', 'Sambalpur', 'Puri', 'Balasore', 'Bhadrak', 'Baripada', 'Jharsuguda', 'Jeypore', 'Bargarh', 'Rayagada', 'Paradip'],
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Rajahmundry', 'Tirupati', 'Kakinada', 'Kadapa', 'Anantapur', 'Vizianagaram', 'Eluru', 'Ongole', 'Nandyal', 'Machilipatnam'],
  'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar', 'Hazaribagh', 'Giridih', 'Ramgarh', 'Medininagar', 'Chirkunda'],
  'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg', 'Rajnandgaon', 'Raigarh', 'Jagdalpur', 'Ambikapur', 'Chirmiri'],
  'Assam': ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia', 'Tezpur', 'Karimganj', 'Hailakandi', 'Diphu'],
  'Delhi': ['New Delhi', 'Delhi', 'Dwarka', 'Rohini', 'Saket', 'Janakpuri', 'Pitampura', 'Lajpat Nagar', 'Karol Bagh', 'Connaught Place'],
  'Goa': ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda', 'Bicholim', 'Curchorem', 'Sanquelim', 'Cuncolim', 'Quepem'],
  'Uttarakhand': ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rudrapur', 'Kashipur', 'Rishikesh', 'Pithoragarh', 'Ramnagar', 'Kotdwar'],
  'Himachal Pradesh': ['Shimla', 'Dharamshala', 'Solan', 'Mandi', 'Palampur', 'Baddi', 'Nahan', 'Paonta Sahib', 'Sundernagar', 'Chamba'],
  'Jammu and Kashmir': ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Sopore', 'Kathua', 'Udhampur', 'Poonch', 'Rajouri', 'Kupwara'],
  'Chandigarh': ['Chandigarh'],
  'Puducherry': ['Puducherry', 'Pondicherry', 'Karaikal', 'Mahe', 'Yanam'],
};

// Get all cities as flat array for general search
const ALL_CITIES = Object.values(INDIAN_CITIES).flat();

const BasicInfoStep = ({ formData, updateFormData, onNext }) => {
  const [errors, setErrors] = useState({});
  const [cityQuery, setCityQuery] = useState(formData.city || '');
  const [stateQuery, setStateQuery] = useState(formData.state || '');
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [showStateSuggestions, setShowStateSuggestions] = useState(false);
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [stateSuggestions, setStateSuggestions] = useState([]);
  
  const cityRef = useRef(null);
  const stateRef = useRef(null);

  // Close dropdowns when clicking outside
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

  // Filter cities based on query and selected state
  const filterCities = (query) => {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    
    // If state is selected, prioritize cities from that state
    let cities = [];
    if (formData.state && INDIAN_CITIES[formData.state]) {
      cities = INDIAN_CITIES[formData.state].filter(city => 
        city.toLowerCase().includes(q)
      );
    }
    
    // Also search all cities
    const allMatches = ALL_CITIES.filter(city => 
      city.toLowerCase().includes(q) && !cities.includes(city)
    );
    
    return [...cities, ...allMatches].slice(0, 8);
  };

  // Filter states based on query
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
    
    // Auto-detect state from city
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
      <h2 className="text-2xl font-bold text-white">Tournament Basic Information</h2>
      
      {/* Tournament Name */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Tournament Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => updateFormData('name', e.target.value)}
          placeholder="e.g., Bangalore Summer Open 2025"
          className={`w-full px-4 py-3 bg-slate-700/50 border rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all ${
            errors.name ? 'border-red-500' : 'border-white/10'
          }`}
        />
        {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => updateFormData('description', e.target.value)}
          placeholder="Describe your tournament..."
          rows={4}
          className={`w-full px-4 py-3 bg-slate-700/50 border rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all ${
            errors.description ? 'border-red-500' : 'border-white/10'
          }`}
        />
        {errors.description && <p className="mt-1 text-sm text-red-400">{errors.description}</p>}
      </div>

      {/* Format & Privacy - 2 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Format</label>
          <select
            value={formData.format}
            onChange={(e) => updateFormData('format', e.target.value)}
            className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-purple-500 transition-all"
          >
            <option value="singles">Singles Only</option>
            <option value="doubles">Doubles Only</option>
            <option value="both">Both</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Privacy</label>
          <select
            value={formData.privacy}
            onChange={(e) => updateFormData('privacy', e.target.value)}
            className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-purple-500 transition-all"
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </div>
      </div>

      {/* Shuttle Information - 2 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Shuttle Type <span className="text-gray-500">(Optional)</span>
          </label>
          <select
            value={formData.shuttleType || ''}
            onChange={(e) => updateFormData('shuttleType', e.target.value)}
            className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-purple-500 transition-all"
          >
            <option value="">Select Shuttle Type</option>
            <option value="FEATHER">Feather Shuttle</option>
            <option value="PLASTIC">Plastic Shuttle</option>
          </select>
          <p className="mt-1 text-xs text-gray-500">Type of shuttlecock used in the tournament</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Shuttle Brand <span className="text-gray-500">(Optional)</span>
          </label>
          <input
            type="text"
            value={formData.shuttleBrand || ''}
            onChange={(e) => updateFormData('shuttleBrand', e.target.value)}
            placeholder="e.g., Yonex, Li-Ning, Victor"
            className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 transition-all"
          />
          <p className="mt-1 text-xs text-gray-500">Brand name of the shuttlecock</p>
        </div>
      </div>

      {/* Venue */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Venue <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.venue}
          onChange={(e) => updateFormData('venue', e.target.value)}
          placeholder="e.g., Koramangala Indoor Stadium"
          className={`w-full px-4 py-3 bg-slate-700/50 border rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 transition-all ${
            errors.venue ? 'border-red-500' : 'border-white/10'
          }`}
        />
        {errors.venue && <p className="mt-1 text-sm text-red-400">{errors.venue}</p>}
      </div>

      {/* Address */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Address <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.address}
          onChange={(e) => updateFormData('address', e.target.value)}
          placeholder="e.g., 123 Main Street, Koramangala"
          className={`w-full px-4 py-3 bg-slate-700/50 border rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 transition-all ${
            errors.address ? 'border-red-500' : 'border-white/10'
          }`}
        />
        {errors.address && <p className="mt-1 text-sm text-red-400">{errors.address}</p>}
      </div>

      {/* Location - 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* City with Autocomplete */}
        <div className="relative" ref={cityRef}>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            City <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={cityQuery}
            onChange={(e) => handleCityChange(e.target.value)}
            onFocus={() => cityQuery.length >= 2 && setShowCitySuggestions(citySuggestions.length > 0)}
            placeholder="Type city name..."
            className={`w-full px-4 py-3 bg-slate-700/50 border rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 transition-all ${
              errors.city ? 'border-red-500' : 'border-white/10'
            }`}
          />
          {showCitySuggestions && citySuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-white/10 rounded-xl shadow-lg max-h-48 overflow-y-auto">
              {citySuggestions.map((city, idx) => {
                // Find the state for this city
                let cityState = '';
                for (const [state, cities] of Object.entries(INDIAN_CITIES)) {
                  if (cities.includes(city)) {
                    cityState = state;
                    break;
                  }
                }
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => selectCity(city)}
                    className="w-full px-4 py-2 text-left hover:bg-purple-500/20 text-sm text-gray-300 border-b border-white/5 last:border-0 flex items-center justify-between"
                  >
                    <span>{city}</span>
                    {cityState && <span className="text-xs text-gray-500">{cityState}</span>}
                  </button>
                );
              })}
            </div>
          )}
          {errors.city && <p className="mt-1 text-sm text-red-400">{errors.city}</p>}
        </div>

        {/* State with Autocomplete */}
        <div className="relative" ref={stateRef}>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            State <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={stateQuery}
            onChange={(e) => handleStateChange(e.target.value)}
            onFocus={() => stateQuery.length >= 2 && setShowStateSuggestions(stateSuggestions.length > 0)}
            placeholder="Type state name..."
            className={`w-full px-4 py-3 bg-slate-700/50 border rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 transition-all ${
              errors.state ? 'border-red-500' : 'border-white/10'
            }`}
          />
          {showStateSuggestions && stateSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-white/10 rounded-xl shadow-lg max-h-48 overflow-y-auto">
              {stateSuggestions.map((state, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => selectState(state)}
                  className="w-full px-4 py-2 text-left hover:bg-purple-500/20 text-sm text-gray-300 border-b border-white/5 last:border-0"
                >
                  {state}
                </button>
              ))}
            </div>
          )}
          {errors.state && <p className="mt-1 text-sm text-red-400">{errors.state}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Pincode <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.pincode}
            onChange={(e) => updateFormData('pincode', e.target.value)}
            placeholder="e.g., 560001"
            className={`w-full px-4 py-3 bg-slate-700/50 border rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 transition-all ${
              errors.pincode ? 'border-red-500' : 'border-white/10'
            }`}
          />
          {errors.pincode && <p className="mt-1 text-sm text-red-400">{errors.pincode}</p>}
        </div>
      </div>

      {/* Zone & Country */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Zone <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.zone}
            onChange={(e) => updateFormData('zone', e.target.value)}
            className={`w-full px-4 py-3 bg-slate-700/50 border rounded-xl text-white focus:ring-2 focus:ring-purple-500 transition-all ${
              errors.zone ? 'border-red-500' : 'border-white/10'
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
          {errors.zone && <p className="mt-1 text-sm text-red-400">{errors.zone}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Country</label>
          <input
            type="text"
            value={formData.country}
            onChange={(e) => updateFormData('country', e.target.value)}
            className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-purple-500 transition-all"
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-end pt-6 border-t border-white/10">
        <button
          onClick={handleNext}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all font-semibold"
        >
          Next: Dates →
        </button>
      </div>
    </div>
  );
};

export default BasicInfoStep;
