import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, MapPin, Dumbbell, Image, Upload, X, Plus, 
  CreditCard, CheckCircle, ArrowLeft, Loader2, Save, Clock
} from 'lucide-react';
import api from '../utils/api';

const DRAFT_KEY = 'matchify_academy_draft';

// Custom Toast Component
const Toast = ({ message, show, onClose }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
      <div className="flex items-center gap-3 px-5 py-3 bg-emerald-500/90 backdrop-blur-lg text-white rounded-xl shadow-lg shadow-emerald-500/30">
        <CheckCircle className="w-5 h-5" />
        <span className="font-medium">{message}</span>
      </div>
    </div>
  );
};

// Sports with their specific facility questions
const SPORTS_CONFIG = {
  'Badminton': { label: 'Badminton Courts', type: 'number', placeholder: 'Enter number of courts', suffix: 'Courts' },
  'Tennis': { label: 'Tennis Courts', type: 'number', placeholder: 'Enter number of courts', suffix: 'Courts' },
  'Table Tennis': { label: 'Table Tennis Tables', type: 'number', placeholder: 'Enter number of tables', suffix: 'Tables' },
  'Squash': { label: 'Squash Courts', type: 'number', placeholder: 'Enter number of courts', suffix: 'Courts' },
  'Basketball': { label: 'Basketball Courts', type: 'number', placeholder: 'Enter number of courts', suffix: 'Courts' },
  'Volleyball': { label: 'Volleyball Courts', type: 'number', placeholder: 'Enter number of courts', suffix: 'Courts' },
  'Swimming': { label: 'Swimming Pool Size', type: 'text', placeholder: 'e.g., 25m x 10m, Olympic size, 50m', suffix: '' },
  'Cricket': { label: 'Cricket Facilities', type: 'text', placeholder: 'e.g., 2 nets, 1 ground, Full size ground', suffix: '' },
  'Football': { label: 'Football Ground', type: 'text', placeholder: 'e.g., Full size, 5-a-side, 7-a-side, 100x60m', suffix: '' },
  'Gym': { label: 'Gym Area', type: 'text', placeholder: 'e.g., 2000 sq ft, 500 sq m', suffix: '' },
  'Yoga': { label: 'Yoga Hall', type: 'text', placeholder: 'e.g., 30 people capacity, 800 sq ft', suffix: '' },
  'Athletics': { label: 'Athletics Track', type: 'text', placeholder: 'e.g., 400m track, 100m straight, 200m oval', suffix: '' },
};

const SPORTS_OPTIONS = Object.keys(SPORTS_CONFIG);

// Indian Cities with States for Autocomplete
const INDIAN_CITIES = [
  { city: 'Mumbai', state: 'Maharashtra' },
  { city: 'Delhi', state: 'Delhi' },
  { city: 'Bangalore', state: 'Karnataka' },
  { city: 'Hyderabad', state: 'Telangana' },
  { city: 'Ahmedabad', state: 'Gujarat' },
  { city: 'Chennai', state: 'Tamil Nadu' },
  { city: 'Kolkata', state: 'West Bengal' },
  { city: 'Pune', state: 'Maharashtra' },
  { city: 'Jaipur', state: 'Rajasthan' },
  { city: 'Surat', state: 'Gujarat' },
  { city: 'Lucknow', state: 'Uttar Pradesh' },
  { city: 'Kanpur', state: 'Uttar Pradesh' },
  { city: 'Nagpur', state: 'Maharashtra' },
  { city: 'Indore', state: 'Madhya Pradesh' },
  { city: 'Thane', state: 'Maharashtra' },
  { city: 'Bhopal', state: 'Madhya Pradesh' },
  { city: 'Visakhapatnam', state: 'Andhra Pradesh' },
  { city: 'Pimpri-Chinchwad', state: 'Maharashtra' },
  { city: 'Patna', state: 'Bihar' },
  { city: 'Vadodara', state: 'Gujarat' },
  { city: 'Ghaziabad', state: 'Uttar Pradesh' },
  { city: 'Ludhiana', state: 'Punjab' },
  { city: 'Agra', state: 'Uttar Pradesh' },
  { city: 'Nashik', state: 'Maharashtra' },
  { city: 'Faridabad', state: 'Haryana' },
  { city: 'Meerut', state: 'Uttar Pradesh' },
  { city: 'Rajkot', state: 'Gujarat' },
  { city: 'Kalyan-Dombivali', state: 'Maharashtra' },
  { city: 'Vasai-Virar', state: 'Maharashtra' },
  { city: 'Varanasi', state: 'Uttar Pradesh' },
  { city: 'Srinagar', state: 'Jammu and Kashmir' },
  { city: 'Aurangabad', state: 'Maharashtra' },
  { city: 'Dhanbad', state: 'Jharkhand' },
  { city: 'Amritsar', state: 'Punjab' },
  { city: 'Navi Mumbai', state: 'Maharashtra' },
  { city: 'Allahabad', state: 'Uttar Pradesh' },
  { city: 'Ranchi', state: 'Jharkhand' },
  { city: 'Howrah', state: 'West Bengal' },
  { city: 'Coimbatore', state: 'Tamil Nadu' },
  { city: 'Jabalpur', state: 'Madhya Pradesh' },
  { city: 'Gwalior', state: 'Madhya Pradesh' },
  { city: 'Vijayawada', state: 'Andhra Pradesh' },
  { city: 'Jodhpur', state: 'Rajasthan' },
  { city: 'Madurai', state: 'Tamil Nadu' },
  { city: 'Raipur', state: 'Chhattisgarh' },
  { city: 'Kota', state: 'Rajasthan' },
  { city: 'Chandigarh', state: 'Chandigarh' },
  { city: 'Guwahati', state: 'Assam' },
  { city: 'Solapur', state: 'Maharashtra' },
  { city: 'Hubli-Dharwad', state: 'Karnataka' },
  { city: 'Mysore', state: 'Karnataka' },
  { city: 'Tiruchirappalli', state: 'Tamil Nadu' },
  { city: 'Bareilly', state: 'Uttar Pradesh' },
  { city: 'Aligarh', state: 'Uttar Pradesh' },
  { city: 'Tiruppur', state: 'Tamil Nadu' },
  { city: 'Moradabad', state: 'Uttar Pradesh' },
  { city: 'Jalandhar', state: 'Punjab' },
  { city: 'Bhubaneswar', state: 'Odisha' },
  { city: 'Salem', state: 'Tamil Nadu' },
  { city: 'Warangal', state: 'Telangana' },
  { city: 'Mira-Bhayandar', state: 'Maharashtra' },
  { city: 'Thiruvananthapuram', state: 'Kerala' },
  { city: 'Bhiwandi', state: 'Maharashtra' },
  { city: 'Saharanpur', state: 'Uttar Pradesh' },
  { city: 'Guntur', state: 'Andhra Pradesh' },
  { city: 'Amravati', state: 'Maharashtra' },
  { city: 'Bikaner', state: 'Rajasthan' },
  { city: 'Noida', state: 'Uttar Pradesh' },
  { city: 'Jamshedpur', state: 'Jharkhand' },
  { city: 'Bhilai', state: 'Chhattisgarh' },
  { city: 'Cuttack', state: 'Odisha' },
  { city: 'Firozabad', state: 'Uttar Pradesh' },
  { city: 'Kochi', state: 'Kerala' },
  { city: 'Bhavnagar', state: 'Gujarat' },
  { city: 'Dehradun', state: 'Uttarakhand' },
  { city: 'Durgapur', state: 'West Bengal' },
  { city: 'Asansol', state: 'West Bengal' },
  { city: 'Nanded', state: 'Maharashtra' },
  { city: 'Kolhapur', state: 'Maharashtra' },
  { city: 'Ajmer', state: 'Rajasthan' },
  { city: 'Gulbarga', state: 'Karnataka' },
  { city: 'Jamnagar', state: 'Gujarat' },
  { city: 'Ujjain', state: 'Madhya Pradesh' },
  { city: 'Loni', state: 'Uttar Pradesh' },
  { city: 'Siliguri', state: 'West Bengal' },
  { city: 'Jhansi', state: 'Uttar Pradesh' },
  { city: 'Ulhasnagar', state: 'Maharashtra' },
  { city: 'Jammu', state: 'Jammu and Kashmir' },
  { city: 'Mangalore', state: 'Karnataka' },
  { city: 'Erode', state: 'Tamil Nadu' },
  { city: 'Belgaum', state: 'Karnataka' },
  { city: 'Ambattur', state: 'Tamil Nadu' },
  { city: 'Tirunelveli', state: 'Tamil Nadu' },
  { city: 'Malegaon', state: 'Maharashtra' },
  { city: 'Gaya', state: 'Bihar' },
  { city: 'Udaipur', state: 'Rajasthan' },
  { city: 'Maheshtala', state: 'West Bengal' },
  { city: 'Davanagere', state: 'Karnataka' },
  { city: 'Kozhikode', state: 'Kerala' },
  { city: 'Akola', state: 'Maharashtra' },
  { city: 'Kurnool', state: 'Andhra Pradesh' },
  { city: 'Bokaro', state: 'Jharkhand' },
  { city: 'Rajahmundry', state: 'Andhra Pradesh' },
  { city: 'Ballari', state: 'Karnataka' },
  { city: 'Agartala', state: 'Tripura' },
  { city: 'Bhagalpur', state: 'Bihar' },
  { city: 'Latur', state: 'Maharashtra' },
  { city: 'Dhule', state: 'Maharashtra' },
  { city: 'Korba', state: 'Chhattisgarh' },
  { city: 'Bhilwara', state: 'Rajasthan' },
  { city: 'Brahmapur', state: 'Odisha' },
  { city: 'Mysuru', state: 'Karnataka' },
  { city: 'Muzaffarpur', state: 'Bihar' },
  { city: 'Ahmednagar', state: 'Maharashtra' },
  { city: 'Kollam', state: 'Kerala' },
  { city: 'Raghunathganj', state: 'West Bengal' },
  { city: 'Bilaspur', state: 'Chhattisgarh' },
  { city: 'Shahjahanpur', state: 'Uttar Pradesh' },
  { city: 'Thrissur', state: 'Kerala' },
  { city: 'Alwar', state: 'Rajasthan' },
  { city: 'Kakinada', state: 'Andhra Pradesh' },
  { city: 'Nizamabad', state: 'Telangana' },
  { city: 'Sagar', state: 'Madhya Pradesh' },
  { city: 'Tumkur', state: 'Karnataka' },
  { city: 'Hisar', state: 'Haryana' },
  { city: 'Rohtak', state: 'Haryana' },
  { city: 'Panipat', state: 'Haryana' },
  { city: 'Darbhanga', state: 'Bihar' },
  { city: 'Kharagpur', state: 'West Bengal' },
  { city: 'Aizawl', state: 'Mizoram' },
  { city: 'Ichalkaranji', state: 'Maharashtra' },
  { city: 'Tirupati', state: 'Andhra Pradesh' },
  { city: 'Karnal', state: 'Haryana' },
  { city: 'Bathinda', state: 'Punjab' },
  { city: 'Rampur', state: 'Uttar Pradesh' },
  { city: 'Shillong', state: 'Meghalaya' },
  { city: 'Patiala', state: 'Punjab' },
  { city: 'Imphal', state: 'Manipur' },
  { city: 'Hapur', state: 'Uttar Pradesh' },
  { city: 'Anantapur', state: 'Andhra Pradesh' },
  { city: 'Nellore', state: 'Andhra Pradesh' },
  { city: 'Rourkela', state: 'Odisha' },
  { city: 'Vellore', state: 'Tamil Nadu' },
  { city: 'Barasat', state: 'West Bengal' },
  { city: 'Khammam', state: 'Telangana' },
  { city: 'Parbhani', state: 'Maharashtra' },
  { city: 'Shimla', state: 'Himachal Pradesh' },
  { city: 'Gangtok', state: 'Sikkim' },
  { city: 'Itanagar', state: 'Arunachal Pradesh' },
  { city: 'Kohima', state: 'Nagaland' },
  { city: 'Port Blair', state: 'Andaman and Nicobar Islands' },
  { city: 'Silvassa', state: 'Dadra and Nagar Haveli' },
  { city: 'Daman', state: 'Daman and Diu' },
  { city: 'Kavaratti', state: 'Lakshadweep' },
  { city: 'Puducherry', state: 'Puducherry' },
];

// Load draft from localStorage
const loadDraft = () => {
  try {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        formData: parsed.formData || null,
        lastSaved: parsed.lastSaved || null
      };
    }
  } catch (e) {
    console.error('Error loading draft:', e);
  }
  return { formData: null, lastSaved: null };
};

const AddAcademyPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '' });
  
  const defaultFormData = {
    name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    sports: [],
    sportDetails: {},
    additionalSportsInfo: '',
    description: '',
    phone: '',
    email: '',
    website: '',
  };
  
  const [formData, setFormData] = useState(defaultFormData);
  const [photos, setPhotos] = useState([]);
  const [academyQrCode, setAcademyQrCode] = useState(null);
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [errors, setErrors] = useState({});
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);

  // Load draft on mount
  useEffect(() => {
    const { formData: savedData, lastSaved: savedTime } = loadDraft();
    if (savedData && Object.values(savedData).some(v => v && (Array.isArray(v) ? v.length > 0 : typeof v === 'object' ? Object.keys(v).length > 0 : v.toString().trim()))) {
      setShowDraftBanner(true);
      setFormData(savedData);
      setLastSaved(savedTime);
    }
  }, []);

  // Auto-save to localStorage
  const saveDraft = useCallback(() => {
    const now = new Date().toISOString();
    localStorage.setItem(DRAFT_KEY, JSON.stringify({
      formData,
      lastSaved: now
    }));
    setLastSaved(now);
  }, [formData]);

  // Auto-save every 5 seconds if there are changes
  useEffect(() => {
    const hasData = formData.name || formData.address || formData.city || formData.sports.length > 0;
    if (hasData && step === 1) {
      const timer = setTimeout(() => {
        saveDraft();
      }, 2000); // Auto-save after 2 seconds of inactivity
      return () => clearTimeout(timer);
    }
  }, [formData, step, saveDraft]);

  // Clear draft after successful submission
  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setLastSaved(null);
  };

  const discardDraft = () => {
    clearDraft();
    setFormData(defaultFormData);
    setShowDraftBanner(false);
  };

  const formatLastSaved = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));

    // City autocomplete
    if (name === 'city' && value.length >= 2) {
      const matches = INDIAN_CITIES.filter(item =>
        item.city.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5);
      setCitySuggestions(matches);
      setShowCitySuggestions(matches.length > 0);
    } else if (name === 'city') {
      setShowCitySuggestions(false);
    }
  };

  const handleCitySelect = (city, state) => {
    setFormData(prev => ({ ...prev, city, state }));
    setShowCitySuggestions(false);
    setCitySuggestions([]);
    if (errors.city) setErrors(prev => ({ ...prev, city: '' }));
    if (errors.state) setErrors(prev => ({ ...prev, state: '' }));
  };

  const handleSportDetailChange = (sport, value) => {
    setFormData(prev => ({
      ...prev,
      sportDetails: { ...prev.sportDetails, [sport]: value }
    }));
    if (errors[`sport_${sport}`]) {
      setErrors(prev => ({ ...prev, [`sport_${sport}`]: '' }));
    }
  };

  const toggleSport = (sport) => {
    setFormData(prev => {
      const isSelected = prev.sports.includes(sport);
      const newSports = isSelected 
        ? prev.sports.filter(s => s !== sport)
        : [...prev.sports, sport];
      
      // Remove sport detail if sport is deselected
      const newSportDetails = { ...prev.sportDetails };
      if (isSelected) {
        delete newSportDetails[sport];
      }
      
      return { ...prev, sports: newSports, sportDetails: newSportDetails };
    });
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotos(prev => [...prev, { file, preview: event.target.result }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleAcademyQrUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAcademyQrCode({ file, preview: event.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaymentScreenshot = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPaymentScreenshot({ file, preview: event.target.result });
      };
      reader.readAsDataURL(file);
    }
  };


  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Academy name is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (formData.sports.length === 0) newErrors.sports = 'Select at least one sport';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    
    // Validate sport details
    formData.sports.forEach(sport => {
      if (!formData.sportDetails[sport]?.trim()) {
        newErrors[`sport_${sport}`] = `${SPORTS_CONFIG[sport].label} is required`;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProceedToPayment = () => {
    if (validateForm()) {
      setStep(2);
    }
  };

  const handleSubmit = async () => {
    if (!paymentScreenshot) {
      setToast({ show: true, message: 'Please upload payment screenshot' });
      return;
    }
    
    setLoading(true);
    try {
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'sports' || key === 'sportDetails') {
          submitData.append(key, JSON.stringify(formData[key]));
        } else {
          submitData.append(key, formData[key]);
        }
      });
      
      photos.forEach((photo) => {
        submitData.append('photos', photo.file);
      });
      
      if (academyQrCode) {
        submitData.append('academyQrCode', academyQrCode.file);
      }
      
      submitData.append('paymentScreenshot', paymentScreenshot.file);
      
      await api.post('/academies', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setStep(3);
      clearDraft();
    } catch (error) {
      console.error('Error submitting academy:', error);
      setToast({ show: true, message: error.response?.data?.error || 'Failed to submit. Please try again.' });
    } finally {
      setLoading(false);
    }
  };


  // Step 3: Success
  if (step === 3) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl border border-white/10 p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-emerald-500/20 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Academy Submitted!</h2>
          <p className="text-gray-400 mb-6">
            Your academy has been submitted for review. We'll verify your payment and approve it within 24-48 hours.
          </p>
          <button
            onClick={() => navigate('/academies')}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-all"
          >
            Back to Academies
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Payment
  if (step === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => setStep(1)}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Form
          </button>

          <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
            <div className="text-center mb-6">
              <CreditCard className="w-12 h-12 text-purple-400 mx-auto mb-3" />
              <h2 className="text-2xl font-bold text-white mb-2">Complete Payment</h2>
              <p className="text-gray-400">Pay ₹200 to list your academy on Matchify.pro</p>
            </div>

            {/* QR Code */}
            <div className="bg-white rounded-2xl p-4 mb-6">
              <div className="bg-slate-900 rounded-xl p-5">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className="text-2xl">🏸</span>
                  <span className="text-xl font-semibold text-amber-400">P S LOCHAN</span>
                </div>
                
                {/* QR Code - Using UPI QR Generator */}
                <div className="bg-white p-3 rounded-lg mx-auto w-fit">
                  <img 
                    src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=9742628582@slc%26pn=P%20S%20LOCHAN%26am=200%26cu=INR%26tn=Matchify%20Academy%20Listing"
                    alt="Payment QR Code"
                    className="w-[250px] h-[250px]"
                  />
                  {/* Google Pay Logo in center */}
                  <div className="relative -mt-[140px] flex justify-center mb-[115px]">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                      <img 
                        src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Google_Pay_Logo.svg/512px-Google_Pay_Logo.svg.png" 
                        alt="GPay"
                        className="w-8 h-8"
                      />
                    </div>
                  </div>
                </div>
                
                <p className="text-center text-gray-400 text-sm mt-4">Scan to pay with any UPI app</p>
                
                {/* Account Details */}
                <div className="mt-4 p-3 bg-gray-800/50 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">UPI ID:</span>
                    <span className="text-white font-medium">9742628582@slc</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Name:</span>
                    <span className="text-white font-medium">P S LOCHAN</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 mb-6">
              <p className="text-purple-300 text-center font-semibold text-lg">Amount: ₹200</p>
            </div>


            {/* Upload Screenshot */}
            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2">Upload Payment Screenshot *</label>
              {paymentScreenshot ? (
                <div className="relative">
                  <img 
                    src={paymentScreenshot.preview} 
                    alt="Payment Screenshot" 
                    className="w-full h-48 object-contain bg-slate-700 rounded-xl"
                  />
                  <button
                    onClick={() => setPaymentScreenshot(null)}
                    className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-600 rounded-xl cursor-pointer hover:border-purple-500 transition-colors">
                  <Upload className="w-8 h-8 text-gray-500 mb-2" />
                  <span className="text-gray-400 text-sm">Click to upload screenshot</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePaymentScreenshot}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || !paymentScreenshot}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Academy'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }


  // Step 1: Form
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Draft Restored Banner */}
        {showDraftBanner && (
          <div className="mb-4 p-4 bg-blue-500/20 border border-blue-500/30 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-400" />
              <span className="text-blue-300 text-sm">Draft restored from your last session</span>
            </div>
            <button
              onClick={discardDraft}
              className="text-blue-400 hover:text-blue-300 text-sm underline"
            >
              Discard & Start Fresh
            </button>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/academies')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Academies
          </button>
          
          {/* Auto-save indicator */}
          {lastSaved && (
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Save className="w-4 h-4" />
              <span>Saved at {formatLastSaved(lastSaved)}</span>
            </div>
          )}
        </div>

        <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl border border-white/10 p-6 md:p-8">
          <div className="text-center mb-8">
            <Building2 className="w-12 h-12 text-purple-400 mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-white mb-2">Add Your Academy</h1>
            <p className="text-gray-400">List your academy on Matchify.pro for ₹200</p>
          </div>

          {/* Academy Name */}
          <div className="mb-5">
            <label className="block text-sm text-gray-400 mb-2">Academy Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter academy name"
              className={`w-full px-4 py-3 bg-slate-700/50 text-white rounded-xl border ${errors.name ? 'border-red-500' : 'border-gray-600'} focus:outline-none focus:border-purple-500`}
            />
            {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Address */}
          <div className="mb-5">
            <label className="block text-sm text-gray-400 mb-2">Full Address *</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Enter complete address"
              rows={2}
              className={`w-full px-4 py-3 bg-slate-700/50 text-white rounded-xl border ${errors.address ? 'border-red-500' : 'border-gray-600'} focus:outline-none focus:border-purple-500 resize-none`}
            />
            {errors.address && <p className="text-red-400 text-sm mt-1">{errors.address}</p>}
          </div>

          {/* City, State, Pincode */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            <div className="relative">
              <label className="block text-sm text-gray-400 mb-2">City *</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                onFocus={() => {
                  if (formData.city.length >= 2 && citySuggestions.length > 0) {
                    setShowCitySuggestions(true);
                  }
                }}
                onBlur={() => {
                  setTimeout(() => setShowCitySuggestions(false), 300);
                }}
                placeholder="City"
                autoComplete="off"
                className={`w-full px-4 py-3 bg-slate-700/50 text-white rounded-xl border ${errors.city ? 'border-red-500' : 'border-gray-600'} focus:outline-none focus:border-purple-500`}
              />
              {errors.city && <p className="text-red-400 text-sm mt-1">{errors.city}</p>}
              
              {/* City Suggestions Dropdown */}
              {showCitySuggestions && citySuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-purple-500/30 rounded-xl shadow-2xl shadow-purple-500/20 overflow-hidden">
                  {citySuggestions.map((item, index) => (
                    <div
                      key={index}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleCitySelect(item.city, item.state);
                      }}
                      className="px-4 py-3 hover:bg-purple-500/20 cursor-pointer transition-colors border-b border-slate-700/50 last:border-b-0"
                    >
                      <div className="text-white font-medium">{item.city}</div>
                      <div className="text-gray-400 text-sm">{item.state}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">State *</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                placeholder="State (auto-filled)"
                readOnly
                className={`w-full px-4 py-3 bg-slate-700/30 text-white rounded-xl border ${errors.state ? 'border-red-500' : 'border-gray-600'} focus:outline-none focus:border-purple-500 cursor-not-allowed`}
              />
              {errors.state && <p className="text-red-400 text-sm mt-1">{errors.state}</p>}
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Pincode</label>
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleInputChange}
                placeholder="Pincode"
                className="w-full px-4 py-3 bg-slate-700/50 text-white rounded-xl border border-gray-600 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>


          {/* Sports Selection */}
          <div className="mb-5">
            <label className="block text-sm text-gray-400 mb-2">Sports Available *</label>
            <div className="flex flex-wrap gap-2">
              {SPORTS_OPTIONS.map(sport => (
                <button
                  key={sport}
                  type="button"
                  onClick={() => toggleSport(sport)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    formData.sports.includes(sport)
                      ? 'bg-purple-500 text-white'
                      : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600/50'
                  }`}
                >
                  {sport}
                </button>
              ))}
            </div>
            {errors.sports && <p className="text-red-400 text-sm mt-1">{errors.sports}</p>}
          </div>

          {/* Dynamic Sport-Specific Questions */}
          {formData.sports.length > 0 && (
            <div className="mb-5 p-4 bg-slate-700/30 rounded-xl border border-purple-500/20">
              <h3 className="text-sm font-semibold text-purple-400 mb-4 flex items-center gap-2">
                <Dumbbell className="w-4 h-4" />
                Facility Details for Selected Sports
              </h3>
              <div className="space-y-4">
                {formData.sports.map(sport => {
                  const config = SPORTS_CONFIG[sport];
                  return (
                    <div key={sport}>
                      <label className="block text-sm text-gray-400 mb-2">
                        {config.label} *
                      </label>
                      <div className="relative">
                        <input
                          type={config.type}
                          value={formData.sportDetails[sport] || ''}
                          onChange={(e) => handleSportDetailChange(sport, e.target.value)}
                          placeholder={config.placeholder}
                          min={config.type === 'number' ? '1' : undefined}
                          className={`w-full px-4 py-3 bg-slate-700/50 text-white rounded-xl border ${
                            errors[`sport_${sport}`] ? 'border-red-500' : 'border-gray-600'
                          } focus:outline-none focus:border-purple-500 ${config.suffix ? 'pr-20' : ''}`}
                        />
                        {config.suffix && (
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium pointer-events-none">
                            {config.suffix}
                          </span>
                        )}
                      </div>
                      {errors[`sport_${sport}`] && (
                        <p className="text-red-400 text-sm mt-1">{errors[`sport_${sport}`]}</p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Additional Sports Information */}
              <div className="mt-4 pt-4 border-t border-slate-600/50">
                <label className="block text-sm text-gray-400 mb-2">
                  Additional Sports Information (Optional)
                </label>
                <textarea
                  name="additionalSportsInfo"
                  value={formData.additionalSportsInfo}
                  onChange={handleInputChange}
                  placeholder="Any other sports facilities or additional details you'd like to mention..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-700/50 text-white rounded-xl border border-gray-600 focus:outline-none focus:border-purple-500 resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  e.g., Indoor/outdoor facilities, equipment provided, coaching available, etc.
                </p>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="mb-5">
            <label className="block text-sm text-gray-400 mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Tell us about your academy..."
              rows={3}
              className="w-full px-4 py-3 bg-slate-700/50 text-white rounded-xl border border-gray-600 focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>


          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Phone Number *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+91 98765 43210"
                className={`w-full px-4 py-3 bg-slate-700/50 text-white rounded-xl border ${errors.phone ? 'border-red-500' : 'border-gray-600'} focus:outline-none focus:border-purple-500`}
              />
              {errors.phone && <p className="text-red-400 text-sm mt-1">{errors.phone}</p>}
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="academy@email.com"
                className="w-full px-4 py-3 bg-slate-700/50 text-white rounded-xl border border-gray-600 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Website */}
          <div className="mb-5">
            <label className="block text-sm text-gray-400 mb-2">Website (optional)</label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              placeholder="www.youracademy.com"
              className="w-full px-4 py-3 bg-slate-700/50 text-white rounded-xl border border-gray-600 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Photos */}
          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-2">
              <Image className="w-4 h-4 inline mr-1" />
              Academy Photos (optional)
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {photos.map((photo, index) => (
                <div key={index} className="relative aspect-square">
                  <img
                    src={photo.preview}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white shadow-lg"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-600 rounded-xl cursor-pointer hover:border-purple-500 transition-colors">
                <Plus className="w-6 h-6 text-gray-500 mb-1" />
                <span className="text-gray-500 text-xs">Add Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Academy QR Code */}
          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-2">
              Your Academy's Payment QR Code (optional)
            </label>
            <p className="text-xs text-gray-500 mb-3">Upload your UPI/Payment QR code so players can pay you directly</p>
            {academyQrCode ? (
              <div className="relative w-fit">
                <img 
                  src={academyQrCode.preview} 
                  alt="Academy QR Code" 
                  className="w-48 h-48 object-contain bg-white rounded-xl p-2"
                />
                <button
                  type="button"
                  onClick={() => setAcademyQrCode(null)}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white shadow-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-48 h-48 border-2 border-dashed border-gray-600 rounded-xl cursor-pointer hover:border-purple-500 transition-colors">
                <CreditCard className="w-8 h-8 text-gray-500 mb-2" />
                <span className="text-gray-400 text-sm text-center px-2">Upload QR Code</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAcademyQrUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Price Info */}
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Listing Fee</span>
              <span className="text-purple-300 font-bold text-xl">₹200</span>
            </div>
            <p className="text-gray-500 text-sm mt-2">One-time payment to list your academy</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                saveDraft();
                setToast({ show: true, message: 'Draft saved successfully!' });
              }}
              className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              Save Draft
            </button>
            <button
              onClick={handleProceedToPayment}
              className="flex-[2] py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all"
            >
              Proceed to Payment
            </button>
          </div>
        </div>
      </div>
      
      {/* Toast Notification */}
      <Toast 
        show={toast.show} 
        message={toast.message} 
        onClose={() => setToast({ show: false, message: '' })} 
      />
    </div>
  );
};

export default AddAcademyPage;