import { useState, useRef, useEffect } from 'react';
import api from '../api/axios';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

// City to State mapping for auto-fill
const CITY_STATE_MAP = {
  // Andhra Pradesh
  'Amaravati': 'Andhra Pradesh',
  'Anantapur': 'Andhra Pradesh',
  'Chittoor': 'Andhra Pradesh',
  'Eluru': 'Andhra Pradesh',
  'Guntur': 'Andhra Pradesh',
  'Kadapa': 'Andhra Pradesh',
  'Kakinada': 'Andhra Pradesh',
  'Kurnool': 'Andhra Pradesh',
  'Nellore': 'Andhra Pradesh',
  'Ongole': 'Andhra Pradesh',
  'Rajahmundry': 'Andhra Pradesh',
  'Srikakulam': 'Andhra Pradesh',
  'Tirupati': 'Andhra Pradesh',
  'Vijayawada': 'Andhra Pradesh',
  'Visakhapatnam': 'Andhra Pradesh',
  'Vizag': 'Andhra Pradesh',
  
  // Arunachal Pradesh
  'Itanagar': 'Arunachal Pradesh',
  'Naharlagun': 'Arunachal Pradesh',
  'Pasighat': 'Arunachal Pradesh',
  
  // Assam
  'Dibrugarh': 'Assam',
  'Guwahati': 'Assam',
  'Jorhat': 'Assam',
  'Nagaon': 'Assam',
  'Silchar': 'Assam',
  'Tezpur': 'Assam',
  'Tinsukia': 'Assam',
  
  // Bihar
  'Arrah': 'Bihar',
  'Begusarai': 'Bihar',
  'Bhagalpur': 'Bihar',
  'Bihar Sharif': 'Bihar',
  'Darbhanga': 'Bihar',
  'Gaya': 'Bihar',
  'Hajipur': 'Bihar',
  'Muzaffarpur': 'Bihar',
  'Patna': 'Bihar',
  'Purnia': 'Bihar',
  
  // Chhattisgarh
  'Bhilai': 'Chhattisgarh',
  'Bilaspur': 'Chhattisgarh',
  'Durg': 'Chhattisgarh',
  'Korba': 'Chhattisgarh',
  'Raipur': 'Chhattisgarh',
  'Rajnandgaon': 'Chhattisgarh',
  
  // Goa
  'Margao': 'Goa',
  'Panaji': 'Goa',
  'Panjim': 'Goa',
  'Vasco da Gama': 'Goa',
  'Mapusa': 'Goa',
  
  // Gujarat
  'Ahmedabad': 'Gujarat',
  'Anand': 'Gujarat',
  'Bharuch': 'Gujarat',
  'Bhavnagar': 'Gujarat',
  'Bhuj': 'Gujarat',
  'Gandhinagar': 'Gujarat',
  'Jamnagar': 'Gujarat',
  'Junagadh': 'Gujarat',
  'Mehsana': 'Gujarat',
  'Morbi': 'Gujarat',
  'Nadiad': 'Gujarat',
  'Navsari': 'Gujarat',
  'Porbandar': 'Gujarat',
  'Rajkot': 'Gujarat',
  'Surat': 'Gujarat',
  'Vadodara': 'Gujarat',
  'Vapi': 'Gujarat',
  'Valsad': 'Gujarat',
  
  // Haryana
  'Ambala': 'Haryana',
  'Bhiwani': 'Haryana',
  'Faridabad': 'Haryana',
  'Gurugram': 'Haryana',
  'Gurgaon': 'Haryana',
  'Hisar': 'Haryana',
  'Karnal': 'Haryana',
  'Kurukshetra': 'Haryana',
  'Panipat': 'Haryana',
  'Rewari': 'Haryana',
  'Rohtak': 'Haryana',
  'Sirsa': 'Haryana',
  'Sonipat': 'Haryana',
  'Yamunanagar': 'Haryana',
  
  // Himachal Pradesh
  'Baddi': 'Himachal Pradesh',
  'Dharamshala': 'Himachal Pradesh',
  'Kullu': 'Himachal Pradesh',
  'Manali': 'Himachal Pradesh',
  'Mandi': 'Himachal Pradesh',
  'Shimla': 'Himachal Pradesh',
  'Solan': 'Himachal Pradesh',
  
  // Jharkhand
  'Bokaro': 'Jharkhand',
  'Bokaro Steel City': 'Jharkhand',
  'Deoghar': 'Jharkhand',
  'Dhanbad': 'Jharkhand',
  'Hazaribagh': 'Jharkhand',
  'Jamshedpur': 'Jharkhand',
  'Ranchi': 'Jharkhand',
  
  // Karnataka
  'Bagalkot': 'Karnataka',
  'Ballari': 'Karnataka',
  'Belgaum': 'Karnataka',
  'Bellary': 'Karnataka',
  'Bengaluru': 'Karnataka',
  'Bangalore': 'Karnataka',
  'Bidar': 'Karnataka',
  'Davangere': 'Karnataka',
  'Dharwad': 'Karnataka',
  'Gulbarga': 'Karnataka',
  'Hassan': 'Karnataka',
  'Hubli': 'Karnataka',
  'Hubli-Dharwad': 'Karnataka',
  'Kalaburagi': 'Karnataka',
  'Mangalore': 'Karnataka',
  'Mangaluru': 'Karnataka',
  'Mysore': 'Karnataka',
  'Mysuru': 'Karnataka',
  'Raichur': 'Karnataka',
  'Shivamogga': 'Karnataka',
  'Shimoga': 'Karnataka',
  'Tumkur': 'Karnataka',
  'Udupi': 'Karnataka',
  
  // Kerala
  'Alappuzha': 'Kerala',
  'Ernakulam': 'Kerala',
  'Kannur': 'Kerala',
  'Kasaragod': 'Kerala',
  'Kochi': 'Kerala',
  'Cochin': 'Kerala',
  'Kollam': 'Kerala',
  'Kottayam': 'Kerala',
  'Kozhikode': 'Kerala',
  'Calicut': 'Kerala',
  'Malappuram': 'Kerala',
  'Palakkad': 'Kerala',
  'Pathanamthitta': 'Kerala',
  'Thiruvananthapuram': 'Kerala',
  'Trivandrum': 'Kerala',
  'Thrissur': 'Kerala',
  'Wayanad': 'Kerala',
  
  // Madhya Pradesh
  'Bhopal': 'Madhya Pradesh',
  'Dewas': 'Madhya Pradesh',
  'Gwalior': 'Madhya Pradesh',
  'Indore': 'Madhya Pradesh',
  'Jabalpur': 'Madhya Pradesh',
  'Katni': 'Madhya Pradesh',
  'Ratlam': 'Madhya Pradesh',
  'Rewa': 'Madhya Pradesh',
  'Sagar': 'Madhya Pradesh',
  'Satna': 'Madhya Pradesh',
  'Ujjain': 'Madhya Pradesh',
  
  // Maharashtra
  'Ahmednagar': 'Maharashtra',
  'Akola': 'Maharashtra',
  'Amravati': 'Maharashtra',
  'Aurangabad': 'Maharashtra',
  'Bhiwandi': 'Maharashtra',
  'Chandrapur': 'Maharashtra',
  'Dhule': 'Maharashtra',
  'Ichalkaranji': 'Maharashtra',
  'Jalgaon': 'Maharashtra',
  'Kalyan': 'Maharashtra',
  'Kalyan-Dombivli': 'Maharashtra',
  'Kolhapur': 'Maharashtra',
  'Latur': 'Maharashtra',
  'Malegaon': 'Maharashtra',
  'Mira-Bhayandar': 'Maharashtra',
  'Mumbai': 'Maharashtra',
  'Nagpur': 'Maharashtra',
  'Nanded': 'Maharashtra',
  'Nashik': 'Maharashtra',
  'Navi Mumbai': 'Maharashtra',
  'Panvel': 'Maharashtra',
  'Parbhani': 'Maharashtra',
  'Pimpri-Chinchwad': 'Maharashtra',
  'Pune': 'Maharashtra',
  'Sangli': 'Maharashtra',
  'Satara': 'Maharashtra',
  'Solapur': 'Maharashtra',
  'Thane': 'Maharashtra',
  'Ulhasnagar': 'Maharashtra',
  'Vasai-Virar': 'Maharashtra',
  'Wardha': 'Maharashtra',
  'Yavatmal': 'Maharashtra',
  
  // Manipur
  'Imphal': 'Manipur',
  'Thoubal': 'Manipur',
  
  // Meghalaya
  'Shillong': 'Meghalaya',
  'Tura': 'Meghalaya',
  
  // Mizoram
  'Aizawl': 'Mizoram',
  'Lunglei': 'Mizoram',
  
  // Nagaland
  'Dimapur': 'Nagaland',
  'Kohima': 'Nagaland',
  
  // Odisha
  'Balasore': 'Odisha',
  'Berhampur': 'Odisha',
  'Bhubaneswar': 'Odisha',
  'Brahmapur': 'Odisha',
  'Cuttack': 'Odisha',
  'Puri': 'Odisha',
  'Rourkela': 'Odisha',
  'Sambalpur': 'Odisha',
  
  // Punjab
  'Amritsar': 'Punjab',
  'Bathinda': 'Punjab',
  'Hoshiarpur': 'Punjab',
  'Jalandhar': 'Punjab',
  'Ludhiana': 'Punjab',
  'Moga': 'Punjab',
  'Mohali': 'Punjab',
  'Pathankot': 'Punjab',
  'Patiala': 'Punjab',
  'Phagwara': 'Punjab',
  
  // Rajasthan
  'Ajmer': 'Rajasthan',
  'Alwar': 'Rajasthan',
  'Bharatpur': 'Rajasthan',
  'Bhilwara': 'Rajasthan',
  'Bikaner': 'Rajasthan',
  'Jaipur': 'Rajasthan',
  'Jodhpur': 'Rajasthan',
  'Kota': 'Rajasthan',
  'Pali': 'Rajasthan',
  'Sikar': 'Rajasthan',
  'Sri Ganganagar': 'Rajasthan',
  'Udaipur': 'Rajasthan',
  
  // Sikkim
  'Gangtok': 'Sikkim',
  'Namchi': 'Sikkim',
  
  // Tamil Nadu
  'Chennai': 'Tamil Nadu',
  'Coimbatore': 'Tamil Nadu',
  'Cuddalore': 'Tamil Nadu',
  'Dindigul': 'Tamil Nadu',
  'Erode': 'Tamil Nadu',
  'Hosur': 'Tamil Nadu',
  'Kanchipuram': 'Tamil Nadu',
  'Karur': 'Tamil Nadu',
  'Madurai': 'Tamil Nadu',
  'Nagercoil': 'Tamil Nadu',
  'Namakkal': 'Tamil Nadu',
  'Ooty': 'Tamil Nadu',
  'Salem': 'Tamil Nadu',
  'Thanjavur': 'Tamil Nadu',
  'Tiruchirappalli': 'Tamil Nadu',
  'Trichy': 'Tamil Nadu',
  'Tirunelveli': 'Tamil Nadu',
  'Tiruppur': 'Tamil Nadu',
  'Thoothukudi': 'Tamil Nadu',
  'Tuticorin': 'Tamil Nadu',
  'Vellore': 'Tamil Nadu',
  
  // Telangana
  'Hyderabad': 'Telangana',
  'Karimnagar': 'Telangana',
  'Khammam': 'Telangana',
  'Mahbubnagar': 'Telangana',
  'Nizamabad': 'Telangana',
  'Ramagundam': 'Telangana',
  'Secunderabad': 'Telangana',
  'Warangal': 'Telangana',
  
  // Tripura
  'Agartala': 'Tripura',
  
  // Uttar Pradesh
  'Agra': 'Uttar Pradesh',
  'Aligarh': 'Uttar Pradesh',
  'Allahabad': 'Uttar Pradesh',
  'Prayagraj': 'Uttar Pradesh',
  'Ayodhya': 'Uttar Pradesh',
  'Bareilly': 'Uttar Pradesh',
  'Etawah': 'Uttar Pradesh',
  'Faizabad': 'Uttar Pradesh',
  'Firozabad': 'Uttar Pradesh',
  'Ghaziabad': 'Uttar Pradesh',
  'Gorakhpur': 'Uttar Pradesh',
  'Greater Noida': 'Uttar Pradesh',
  'Jhansi': 'Uttar Pradesh',
  'Kanpur': 'Uttar Pradesh',
  'Lucknow': 'Uttar Pradesh',
  'Mathura': 'Uttar Pradesh',
  'Meerut': 'Uttar Pradesh',
  'Moradabad': 'Uttar Pradesh',
  'Muzaffarnagar': 'Uttar Pradesh',
  'Noida': 'Uttar Pradesh',
  'Saharanpur': 'Uttar Pradesh',
  'Varanasi': 'Uttar Pradesh',
  'Banaras': 'Uttar Pradesh',
  
  // Uttarakhand
  'Dehradun': 'Uttarakhand',
  'Haridwar': 'Uttarakhand',
  'Haldwani': 'Uttarakhand',
  'Kashipur': 'Uttarakhand',
  'Nainital': 'Uttarakhand',
  'Rishikesh': 'Uttarakhand',
  'Roorkee': 'Uttarakhand',
  'Rudrapur': 'Uttarakhand',
  
  // West Bengal
  'Asansol': 'West Bengal',
  'Baharampur': 'West Bengal',
  'Bardhaman': 'West Bengal',
  'Burdwan': 'West Bengal',
  'Darjeeling': 'West Bengal',
  'Durgapur': 'West Bengal',
  'Haldia': 'West Bengal',
  'Howrah': 'West Bengal',
  'Kharagpur': 'West Bengal',
  'Kolkata': 'West Bengal',
  'Calcutta': 'West Bengal',
  'Malda': 'West Bengal',
  'Siliguri': 'West Bengal',
  
  // Union Territories
  'Port Blair': 'Andaman and Nicobar Islands',
  'Chandigarh': 'Chandigarh',
  'Silvassa': 'Dadra and Nagar Haveli and Daman and Diu',
  'Daman': 'Dadra and Nagar Haveli and Daman and Diu',
  'Diu': 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi': 'Delhi',
  'New Delhi': 'Delhi',
  'Srinagar': 'Jammu and Kashmir',
  'Jammu': 'Jammu and Kashmir',
  'Leh': 'Ladakh',
  'Kargil': 'Ladakh',
  'Kavaratti': 'Lakshadweep',
  'Puducherry': 'Puducherry',
  'Pondicherry': 'Puducherry',
  'Karaikal': 'Puducherry',
};

// Get all cities from the mapping
const INDIAN_CITIES = Object.keys(CITY_STATE_MAP).sort();

export default function ProfileCompletionModal({ user, onComplete }) {
  const [formData, setFormData] = useState({
    phone: user?.phone || '',
    city: user?.city || '',
    state: user?.state || '',
    gender: user?.gender || '',
    dateOfBirth: user?.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // City autocomplete
  const [cityInput, setCityInput] = useState(user?.city || '');
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [filteredCities, setFilteredCities] = useState([]);
  const cityInputRef = useRef(null);
  const citySuggestionsRef = useRef(null);
  
  // State autocomplete
  const [stateInput, setStateInput] = useState(user?.state || '');
  const [showStateSuggestions, setShowStateSuggestions] = useState(false);
  const [filteredStates, setFilteredStates] = useState([]);
  const stateInputRef = useRef(null);
  const stateSuggestionsRef = useRef(null);

  // Filter cities based on input
  useEffect(() => {
    if (cityInput.trim()) {
      const filtered = INDIAN_CITIES.filter(city =>
        city.toLowerCase().includes(cityInput.toLowerCase())
      );
      setFilteredCities(filtered);
      setShowCitySuggestions(filtered.length > 0);
    } else {
      setFilteredCities([]);
      setShowCitySuggestions(false);
    }
  }, [cityInput]);

  // Filter states based on input
  useEffect(() => {
    if (stateInput.trim()) {
      const filtered = INDIAN_STATES.filter(state =>
        state.toLowerCase().includes(stateInput.toLowerCase())
      );
      setFilteredStates(filtered);
      setShowStateSuggestions(filtered.length > 0);
    } else {
      setFilteredStates(INDIAN_STATES);
      setShowStateSuggestions(false);
    }
  }, [stateInput]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // City suggestions
      if (
        citySuggestionsRef.current && 
        !citySuggestionsRef.current.contains(event.target) &&
        cityInputRef.current &&
        !cityInputRef.current.contains(event.target)
      ) {
        setShowCitySuggestions(false);
      }
      // State suggestions
      if (
        stateSuggestionsRef.current && 
        !stateSuggestionsRef.current.contains(event.target) &&
        stateInputRef.current &&
        !stateInputRef.current.contains(event.target)
      ) {
        setShowStateSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  // City handlers
  const handleCityInputChange = (value) => {
    setCityInput(value);
    handleChange('city', value);
    setError('');
    
    // Check if the typed city matches exactly (case-insensitive) and auto-fill state
    const matchedCity = Object.keys(CITY_STATE_MAP).find(
      city => city.toLowerCase() === value.toLowerCase()
    );
    if (matchedCity) {
      const state = CITY_STATE_MAP[matchedCity];
      setStateInput(state);
      handleChange('state', state);
    }
  };

  const handleCitySelect = (city) => {
    setCityInput(city);
    handleChange('city', city);
    setShowCitySuggestions(false);
    
    // Auto-fill state based on city
    const state = CITY_STATE_MAP[city];
    if (state) {
      setStateInput(state);
      handleChange('state', state);
    }
  };

  // State handlers
  const handleStateInputChange = (value) => {
    setStateInput(value);
    if (formData.state && !formData.state.toLowerCase().startsWith(value.toLowerCase())) {
      handleChange('state', '');
    }
    setError('');
  };

  const handleStateSelect = (state) => {
    setStateInput(state);
    handleChange('state', state);
    setShowStateSuggestions(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.phone || formData.phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }
    if (!formData.city.trim()) {
      setError('Please enter your city');
      return;
    }
    if (!formData.state || !INDIAN_STATES.includes(formData.state)) {
      setError('Please select a valid state from the suggestions');
      return;
    }
    if (!formData.gender) {
      setError('Please select your gender');
      return;
    }

    try {
      setLoading(true);
      const response = await api.put('/profile', formData);
      
      if (response.data.user) {
        onComplete(response.data.user);
      } else {
        setError(response.data.error || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Highlight matching text helper
  const highlightMatch = (text, query) => {
    if (!query) return text;
    return text.split(new RegExp(`(${query})`, 'gi')).map((part, i) => (
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={i} className="font-bold text-purple-400">{part}</span>
      ) : (
        <span key={i}>{part}</span>
      )
    ));
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {/* Halo effect background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[500px] h-[500px] bg-gradient-to-r from-purple-500/30 via-indigo-500/30 to-purple-500/30 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative bg-slate-800 border border-white/10 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 p-6 text-white overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
          <div className="relative">
            <h2 className="text-2xl font-bold">Complete Your Profile</h2>
            <p className="text-purple-200 mt-1">
              Please provide your details to continue
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2">
              <span>⚠️</span>
              {error}
            </div>
          )}

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Phone Number <span className="text-red-400">*</span>
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-4 bg-slate-700/50 border border-white/10 border-r-0 rounded-l-xl text-gray-400 font-medium">
                +91
              </span>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="9876543210"
                className="flex-1 px-4 py-3 bg-slate-700/50 border border-white/10 rounded-r-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          {/* City - Searchable Autocomplete */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              City <span className="text-red-400">*</span>
            </label>
            <input
              ref={cityInputRef}
              type="text"
              value={cityInput}
              onChange={(e) => handleCityInputChange(e.target.value)}
              onFocus={() => cityInput.trim() && setShowCitySuggestions(filteredCities.length > 0)}
              placeholder="Type to search city..."
              className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              autoComplete="off"
            />
            
            {/* City Suggestions Dropdown */}
            {showCitySuggestions && filteredCities.length > 0 && (
              <div 
                ref={citySuggestionsRef}
                className="absolute z-10 w-full mt-2 bg-slate-800 border border-white/10 rounded-xl shadow-2xl max-h-48 overflow-y-auto"
              >
                {filteredCities.map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => handleCitySelect(city)}
                    className={`w-full px-4 py-3 text-left hover:bg-purple-500/20 transition-colors flex items-center justify-between ${
                      formData.city === city ? 'bg-purple-500/20 text-purple-400 font-medium' : 'text-gray-300'
                    }`}
                  >
                    <span>{highlightMatch(city, cityInput)}</span>
                    <span className="text-xs text-gray-500">{CITY_STATE_MAP[city]}</span>
                  </button>
                ))}
              </div>
            )}
            <p className="mt-2 text-xs text-gray-500">
              Type to see suggestions or enter your city name
            </p>
          </div>

          {/* State - Searchable Autocomplete */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              State <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                ref={stateInputRef}
                type="text"
                value={stateInput}
                onChange={(e) => handleStateInputChange(e.target.value)}
                onFocus={() => setShowStateSuggestions(true)}
                placeholder="Type to search state..."
                className={`w-full px-4 py-3 bg-slate-700/50 border rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                  formData.state ? 'border-emerald-500/50' : 'border-white/10'
                }`}
                autoComplete="off"
              />
              {formData.state && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400">✓</span>
              )}
            </div>
            
            {/* State Suggestions Dropdown */}
            {showStateSuggestions && filteredStates.length > 0 && (
              <div 
                ref={stateSuggestionsRef}
                className="absolute z-10 w-full mt-2 bg-slate-800 border border-white/10 rounded-xl shadow-2xl max-h-48 overflow-y-auto"
              >
                {filteredStates.map((state) => (
                  <button
                    key={state}
                    type="button"
                    onClick={() => handleStateSelect(state)}
                    className={`w-full px-4 py-3 text-left hover:bg-purple-500/20 transition-colors ${
                      formData.state === state ? 'bg-purple-500/20 text-purple-400 font-medium' : 'text-gray-300'
                    }`}
                  >
                    {highlightMatch(state, stateInput)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Gender <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-4">
              {['Male', 'Female', 'Other'].map(g => (
                <label key={g} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="gender"
                    value={g.toLowerCase()}
                    checked={formData.gender === g.toLowerCase()}
                    onChange={(e) => handleChange('gender', e.target.value)}
                    className="w-4 h-4 text-purple-500 bg-slate-700 border-white/20 focus:ring-purple-500 focus:ring-offset-0"
                  />
                  <span className="text-gray-300 group-hover:text-white transition-colors">{g}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Date of Birth
            </label>
            <input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => handleChange('dateOfBirth', e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all [color-scheme:dark]"
            />
          </div>

          {/* Submit Button with halo effect */}
          <div className="relative group pt-2">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
            <button
              type="submit"
              disabled={loading}
              className="relative w-full py-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-500/30 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                'Save & Continue'
              )}
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center pt-2">
            This information helps organizers contact you and ensures fair tournament categorization.
          </p>
        </form>
      </div>
    </div>
  );
}
