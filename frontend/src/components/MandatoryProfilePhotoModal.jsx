import { useState, useRef, useEffect } from 'react';
import { Upload, X, Check, Camera, Sparkles } from 'lucide-react';
import { profileAPI } from '../api/profile';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Andaman and Nicobar Islands','Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu','Delhi','Jammu and Kashmir',
  'Ladakh','Lakshadweep','Puducherry'
];

const CITY_STATE_MAP = {
  'Amaravati':'Andhra Pradesh','Visakhapatnam':'Andhra Pradesh','Vijayawada':'Andhra Pradesh',
  'Guntur':'Andhra Pradesh','Tirupati':'Andhra Pradesh','Itanagar':'Arunachal Pradesh',
  'Guwahati':'Assam','Dibrugarh':'Assam','Silchar':'Assam','Patna':'Bihar',
  'Gaya':'Bihar','Muzaffarpur':'Bihar','Raipur':'Chhattisgarh','Bhilai':'Chhattisgarh',
  'Bilaspur':'Chhattisgarh','Panaji':'Goa','Panjim':'Goa','Margao':'Goa',
  'Ahmedabad':'Gujarat','Surat':'Gujarat','Vadodara':'Gujarat','Rajkot':'Gujarat',
  'Gandhinagar':'Gujarat','Bhavnagar':'Gujarat','Jamnagar':'Gujarat',
  'Faridabad':'Haryana','Gurugram':'Haryana','Gurgaon':'Haryana','Rohtak':'Haryana',
  'Panipat':'Haryana','Hisar':'Haryana','Ambala':'Haryana','Shimla':'Himachal Pradesh',
  'Dharamshala':'Himachal Pradesh','Manali':'Himachal Pradesh','Ranchi':'Jharkhand',
  'Jamshedpur':'Jharkhand','Dhanbad':'Jharkhand','Bokaro':'Jharkhand',
  'Bangalore':'Karnataka','Bengaluru':'Karnataka','Mysore':'Karnataka','Mysuru':'Karnataka',
  'Hubli':'Karnataka','Mangalore':'Karnataka','Mangaluru':'Karnataka','Davangere':'Karnataka',
  'Belgaum':'Karnataka','Kochi':'Kerala','Cochin':'Kerala','Thiruvananthapuram':'Kerala',
  'Trivandrum':'Kerala','Kozhikode':'Kerala','Calicut':'Kerala','Thrissur':'Kerala',
  'Kollam':'Kerala','Kannur':'Kerala','Alappuzha':'Kerala','Kottayam':'Kerala',
  'Indore':'Madhya Pradesh','Bhopal':'Madhya Pradesh','Jabalpur':'Madhya Pradesh',
  'Gwalior':'Madhya Pradesh','Ujjain':'Madhya Pradesh','Mumbai':'Maharashtra',
  'Pune':'Maharashtra','Nagpur':'Maharashtra','Nashik':'Maharashtra','Thane':'Maharashtra',
  'Aurangabad':'Maharashtra','Solapur':'Maharashtra','Navi Mumbai':'Maharashtra',
  'Kolhapur':'Maharashtra','Pimpri-Chinchwad':'Maharashtra','Imphal':'Manipur',
  'Shillong':'Meghalaya','Aizawl':'Mizoram','Kohima':'Nagaland','Dimapur':'Nagaland',
  'Bhubaneswar':'Odisha','Cuttack':'Odisha','Rourkela':'Odisha','Berhampur':'Odisha',
  'Ludhiana':'Punjab','Amritsar':'Punjab','Jalandhar':'Punjab','Patiala':'Punjab',
  'Mohali':'Punjab','Chandigarh':'Chandigarh','Jaipur':'Rajasthan','Jodhpur':'Rajasthan',
  'Kota':'Rajasthan','Bikaner':'Rajasthan','Udaipur':'Rajasthan','Ajmer':'Rajasthan',
  'Gangtok':'Sikkim','Chennai':'Tamil Nadu','Coimbatore':'Tamil Nadu','Madurai':'Tamil Nadu',
  'Salem':'Tamil Nadu','Trichy':'Tamil Nadu','Tiruchirappalli':'Tamil Nadu',
  'Tiruppur':'Tamil Nadu','Vellore':'Tamil Nadu','Erode':'Tamil Nadu','Hosur':'Tamil Nadu',
  'Hyderabad':'Telangana','Warangal':'Telangana','Karimnagar':'Telangana',
  'Secunderabad':'Telangana','Nizamabad':'Telangana','Agartala':'Tripura',
  'Lucknow':'Uttar Pradesh','Kanpur':'Uttar Pradesh','Agra':'Uttar Pradesh',
  'Varanasi':'Uttar Pradesh','Banaras':'Uttar Pradesh','Ghaziabad':'Uttar Pradesh',
  'Noida':'Uttar Pradesh','Greater Noida':'Uttar Pradesh','Meerut':'Uttar Pradesh',
  'Allahabad':'Uttar Pradesh','Prayagraj':'Uttar Pradesh','Bareilly':'Uttar Pradesh',
  'Gorakhpur':'Uttar Pradesh','Aligarh':'Uttar Pradesh','Dehradun':'Uttarakhand',
  'Haridwar':'Uttarakhand','Rishikesh':'Uttarakhand','Roorkee':'Uttarakhand',
  'Kolkata':'West Bengal','Calcutta':'West Bengal','Howrah':'West Bengal',
  'Durgapur':'West Bengal','Asansol':'West Bengal','Siliguri':'West Bengal',
  'Kharagpur':'West Bengal','Darjeeling':'West Bengal','Delhi':'Delhi','New Delhi':'Delhi',
  'Srinagar':'Jammu and Kashmir','Jammu':'Jammu and Kashmir','Leh':'Ladakh',
  'Puducherry':'Puducherry','Pondicherry':'Puducherry',
};

const CITIES = Object.keys(CITY_STATE_MAP).sort();

const F = {
  bg: '#07071a',
  card: '#0d1025',
  border: 'rgba(255,255,255,0.08)',
  input: 'rgba(255,255,255,0.05)',
  green: '#00ff88',
  sub: 'rgba(255,255,255,0.5)',
  dim: 'rgba(255,255,255,0.3)',
};

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: F.sub }}>
        {label} {required && <span style={{ color: '#ff6b6b' }}>*</span>}
      </label>
      {children}
    </div>
  );
}

// DiceBear lorelei — clean illustrated portrait style, 200px, distinct looks
const AVATARS = [
  'https://api.dicebear.com/7.x/lorelei/png?seed=court1&size=200&backgroundColor=0a0a2e',
  'https://api.dicebear.com/7.x/lorelei/png?seed=court2&size=200&backgroundColor=1a0a2e',
  'https://api.dicebear.com/7.x/lorelei/png?seed=court3&size=200&backgroundColor=0a1a2e',
  'https://api.dicebear.com/7.x/lorelei/png?seed=court4&size=200&backgroundColor=0a2e1a',
];

export default function MandatoryProfilePhotoModal({ isOpen }) {
  const { user, updateUser } = useAuth();
  const [step, setStep] = useState(1); // 1=photo, 2=details
  const [photoTab, setPhotoTab] = useState('upload'); // 'upload' | 'avatar'
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(user?.profilePhoto || null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [photoUploaded, setPhotoUploaded] = useState(!!user?.profilePhoto);
  const inputRef = useRef(null);

  const [form, setForm] = useState({
    phone: user?.phone || '',
    city: user?.city || '',
    state: user?.state || '',
    gender: user?.gender || '',
  });
  const [cityInput, setCityInput] = useState(user?.city || '');
  const [stateInput, setStateInput] = useState(user?.state || '');
  const [showCities, setShowCities] = useState(false);
  const [showStates, setShowStates] = useState(false);
  const cityRef = useRef(null);
  const stateRef = useRef(null);

  const filteredCities = cityInput.trim()
    ? CITIES.filter(c => c.toLowerCase().includes(cityInput.toLowerCase())).slice(0, 8)
    : [];
  const filteredStates = stateInput.trim()
    ? INDIAN_STATES.filter(s => s.toLowerCase().includes(stateInput.toLowerCase())).slice(0, 8)
    : INDIAN_STATES.slice(0, 8);

  useEffect(() => {
    const close = (e) => {
      if (cityRef.current && !cityRef.current.contains(e.target)) setShowCities(false);
      if (stateRef.current && !stateRef.current.contains(e.target)) setShowStates(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  if (!isOpen) return null;

  const processFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('Image must be less than 5MB'); return; }
    setError('');
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSelectAvatar = (url) => {
    setSelectedAvatar(url);
    setPreview(url);
    setSelectedFile(null);
    setError('');
  };

  const handleUploadPhoto = async () => {
    if (!selectedFile && !selectedAvatar) { setError('Please choose a photo or select an avatar'); return; }
    setUploading(true);
    setError('');
    try {
      let fileToUpload = selectedFile;
      if (!fileToUpload && selectedAvatar) {
        // Fetch avatar image and convert to File for consistent server-side handling
        const res = await fetch(selectedAvatar);
        const blob = await res.blob();
        const name = selectedAvatar.split('/').pop() || 'avatar.png';
        fileToUpload = new File([blob], name, { type: blob.type || 'image/png' });
      }
      const response = await profileAPI.uploadPhoto(fileToUpload);
      updateUser({ ...user, profilePhoto: response.profilePhoto });
      setPhotoUploaded(true);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveDetails = async () => {
    if (!form.phone || form.phone.length < 10) { setError('Enter a valid 10-digit phone number'); return; }
    if (!form.city.trim()) { setError('Enter your city'); return; }
    if (!form.state || !INDIAN_STATES.includes(form.state)) { setError('Select a valid state'); return; }
    if (!form.gender) { setError('Select your gender'); return; }

    setSaving(true);
    setError('');
    try {
      const response = await api.put('/profile', form);
      if (response.data.user) updateUser(response.data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 12,
    background: F.input, border: `1px solid ${F.border}`,
    color: 'white', outline: 'none', fontSize: 14,
  };

  const dropdownStyle = {
    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
    marginTop: 4, background: '#0d1025', border: `1px solid ${F.border}`,
    borderRadius: 12, overflow: 'hidden', boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)' }}>

      <div className="absolute top-1/3 left-1/3 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,255,136,0.07) 0%, transparent 70%)', filter: 'blur(40px)' }} />

      <div className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: F.card, border: `1px solid rgba(0,255,136,0.15)` }}>

        {/* Top gradient line */}
        <div className="h-1" style={{ background: 'linear-gradient(90deg,#00ff88,#00d4ff,#a855f7)' }} />

        <div className="p-5">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-5">
            {[1,2].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                  style={{
                    background: step >= s ? F.green : 'rgba(255,255,255,0.08)',
                    color: step >= s ? '#003320' : F.dim,
                  }}>
                  {step > s ? <Check size={12} /> : s}
                </div>
                {s < 2 && <div className="w-8 h-px" style={{ background: step > s ? F.green : F.border }} />}
              </div>
            ))}
          </div>

          {/* STEP 1: Photo */}
          {step === 1 && (
            <>
              {/* Header */}
              <div className="text-center mb-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-2 text-xs font-bold"
                  style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)', color: F.green }}>
                  <Camera size={10} /> Required
                </div>
                <h2 className="text-lg font-black text-white mb-1">Set Your Profile Photo</h2>
                <p className="text-xs leading-relaxed" style={{ color: F.sub }}>
                  Organizers use this to identify you during check-in and on draw sheets.
                  Make it clear and recognizable.
                </p>
              </div>

              {/* Visibility notice */}
              <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl mb-4"
                style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)' }}>
                <span className="text-base mt-0.5">👁️</span>
                <div>
                  <p className="text-xs font-bold text-white mb-0.5">Visible to organizers & players</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    Your photo appears on the draw sheet, match cards, and leaderboard.
                  </p>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex rounded-xl p-1 mb-4" style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${F.border}` }}>
                {[
                  { key: 'upload', icon: <Upload size={12} />, label: 'Upload Photo' },
                  { key: 'avatar', icon: <Sparkles size={12} />, label: 'Choose Avatar' },
                ].map(tab => (
                  <button key={tab.key} type="button"
                    onClick={() => { setPhotoTab(tab.key); setError(''); }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all"
                    style={{
                      background: photoTab === tab.key ? F.green : 'transparent',
                      color: photoTab === tab.key ? '#003320' : F.sub,
                      boxShadow: photoTab === tab.key ? '0 2px 8px rgba(0,255,136,0.25)' : 'none',
                    }}>
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              {/* ── Upload Tab ── */}
              {photoTab === 'upload' && (
                <>
                  <div
                    onClick={() => inputRef.current?.click()}
                    className="relative mb-3 rounded-2xl overflow-hidden cursor-pointer transition-all group"
                    style={{
                      height: preview && !selectedAvatar ? 170 : 130,
                      border: `2px dashed ${preview && !selectedAvatar ? 'rgba(0,255,136,0.4)' : 'rgba(0,255,136,0.2)'}`,
                      background: preview && !selectedAvatar ? 'transparent' : 'rgba(0,255,136,0.02)',
                    }}>
                    {preview && !selectedAvatar ? (
                      <>
                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top,rgba(0,0,0,0.55) 0%,transparent 55%)' }} />
                        <button
                          onClick={(e) => { e.stopPropagation(); setPreview(null); setSelectedFile(null); setPhotoUploaded(false); }}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                          style={{ background: 'rgba(255,59,48,0.9)' }}>
                          <X size={12} className="text-white" />
                        </button>
                        <div className="absolute bottom-2 left-3 flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: F.green }} />
                          <span className="text-xs text-white font-semibold">Photo selected</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full gap-2 transition-all group-hover:scale-105">
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                          style={{ background: 'linear-gradient(135deg,rgba(0,255,136,0.15),rgba(0,212,255,0.1))' }}>
                          <Upload size={18} style={{ color: F.green }} />
                        </div>
                        <div className="text-center">
                          <p className="text-white font-bold text-sm">Tap to upload your photo</p>
                          <p className="text-xs mt-0.5" style={{ color: F.dim }}>JPG, PNG · max 5MB</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <input ref={inputRef} type="file" accept="image/*"
                    onChange={(e) => { processFile(e.target.files?.[0]); setSelectedAvatar(null); }} className="hidden" />
                </>
              )}

              {/* ── Avatar Tab ── */}
              {photoTab === 'avatar' && (
                <div className="mb-3">
                  <p className="text-xs text-center mb-3 font-medium" style={{ color: F.sub }}>
                    Pick an avatar — it will be your profile photo
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {AVATARS.map((url, i) => {
                      const isSelected = selectedAvatar === url;
                      return (
                        <button key={i} type="button" onClick={() => handleSelectAvatar(url)}
                          className="relative rounded-2xl overflow-hidden transition-all"
                          style={{
                            aspectRatio: '1',
                            border: isSelected ? '2.5px solid #00ff88' : '2px solid rgba(255,255,255,0.1)',
                            boxShadow: isSelected ? '0 0 20px rgba(0,255,136,0.45)' : '0 2px 8px rgba(0,0,0,0.3)',
                            transform: isSelected ? 'scale(1.04)' : 'scale(1)',
                            background: 'rgba(255,255,255,0.04)',
                          }}>
                          <img
                            src={url}
                            alt={`Avatar ${i + 1}`}
                            className="w-full h-full object-cover"
                            loading="eager"
                          />
                          {isSelected && (
                            <div className="absolute inset-0 flex items-start justify-end p-2"
                              style={{ background: 'rgba(0,255,136,0.08)' }}>
                              <div className="w-6 h-6 rounded-full flex items-center justify-center shadow-lg"
                                style={{ background: F.green }}>
                                <Check size={13} color="#003320" strokeWidth={3} />
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {selectedAvatar && (
                    <div className="mt-3 flex items-center justify-center gap-2 py-2 rounded-xl"
                      style={{ background: 'rgba(0,255,136,0.07)', border: '1px solid rgba(0,255,136,0.15)' }}>
                      <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: F.green }} />
                      <span className="text-xs font-semibold" style={{ color: F.green }}>Avatar selected — will be saved as your photo</span>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="mb-3 px-3 py-2 rounded-xl text-xs flex items-center gap-2"
                  style={{ background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.2)', color: '#ff6b6b' }}>
                  ⚠️ {error}
                </div>
              )}

              {/* Continue button */}
              {(() => {
                const ready = (photoTab === 'upload' && selectedFile) || (photoTab === 'avatar' && selectedAvatar);
                return (
                  <button onClick={handleUploadPhoto} disabled={!ready || uploading}
                    className="w-full py-3 rounded-2xl font-bold text-sm transition-all"
                    style={{
                      background: ready && !uploading ? 'linear-gradient(135deg,#00ff88,#00c853)' : 'rgba(255,255,255,0.06)',
                      color: ready && !uploading ? '#003320' : F.dim,
                      cursor: !ready || uploading ? 'not-allowed' : 'pointer',
                      boxShadow: ready && !uploading ? '0 8px 20px rgba(0,255,136,0.25)' : 'none',
                    }}>
                    {uploading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 rounded-full animate-spin"
                          style={{ borderColor: 'rgba(0,51,32,0.3)', borderTopColor: '#003320' }} />
                        Uploading...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Check size={14} /> Continue to Profile Details
                      </span>
                    )}
                  </button>
                );
              })()}
            </>
          )}

          {/* STEP 2: Details */}
          {step === 2 && (
            <>
              <div className="text-center mb-4">
                <h2 className="text-lg font-black text-white mb-0.5">Complete Your Profile</h2>
                <p className="text-xs" style={{ color: F.dim }}>Required to register for tournaments</p>
              </div>

              <div className="space-y-3">
                {/* Phone */}
                <Field label="Phone Number" required>
                  <div className="flex">
                    <span className="flex items-center px-3 text-sm rounded-l-xl font-medium"
                      style={{ background: 'rgba(255,255,255,0.08)', border: `1px solid ${F.border}`, borderRight: 'none', color: F.sub }}>
                      +91
                    </span>
                    <input type="tel" value={form.phone}
                      onChange={(e) => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g,'').slice(0,10) }))}
                      placeholder="9876543210"
                      style={{ ...inputStyle, borderRadius: '0 12px 12px 0', flex: 1 }} />
                  </div>
                </Field>

                {/* City */}
                <Field label="City" required>
                  <div ref={cityRef} style={{ position: 'relative' }}>
                    <input type="text" value={cityInput}
                      onChange={(e) => { setCityInput(e.target.value); setForm(f => ({ ...f, city: e.target.value })); setShowCities(true); }}
                      onFocus={() => setShowCities(true)}
                      placeholder="Type your city..."
                      style={inputStyle} autoComplete="off" />
                    {showCities && filteredCities.length > 0 && (
                      <div style={dropdownStyle}>
                        {filteredCities.map(c => (
                          <button key={c} type="button"
                            onClick={() => {
                              setCityInput(c); setForm(f => ({ ...f, city: c })); setShowCities(false);
                              const st = CITY_STATE_MAP[c];
                              if (st) { setStateInput(st); setForm(f => ({ ...f, state: st })); }
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm flex justify-between items-center transition-colors"
                            style={{ color: 'rgba(255,255,255,0.8)' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,255,136,0.08)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <span>{c}</span>
                            <span className="text-xs" style={{ color: F.dim }}>{CITY_STATE_MAP[c]}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </Field>

                {/* State */}
                <Field label="State" required>
                  <div ref={stateRef} style={{ position: 'relative' }}>
                    <input type="text" value={stateInput}
                      onChange={(e) => { setStateInput(e.target.value); setForm(f => ({ ...f, state: '' })); setShowStates(true); }}
                      onFocus={() => setShowStates(true)}
                      placeholder="Select your state..."
                      style={{ ...inputStyle, borderColor: form.state ? 'rgba(0,255,136,0.3)' : F.border }}
                      autoComplete="off" />
                    {form.state && (
                      <Check size={14} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: F.green }} />
                    )}
                    {showStates && filteredStates.length > 0 && (
                      <div style={{ ...dropdownStyle, maxHeight: 160, overflowY: 'auto' }}>
                        {filteredStates.map(s => (
                          <button key={s} type="button"
                            onClick={() => { setStateInput(s); setForm(f => ({ ...f, state: s })); setShowStates(false); }}
                            className="w-full px-4 py-2.5 text-left text-sm transition-colors"
                            style={{ color: form.state === s ? F.green : 'rgba(255,255,255,0.8)' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,255,136,0.08)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </Field>

                {/* Gender */}
                <Field label="Gender" required>
                  <div className="flex gap-2">
                    {[['MALE','♂ Male'],['FEMALE','♀ Female'],['OTHER','⚧ Other']].map(([val, label]) => (
                      <button key={val} type="button"
                        onClick={() => setForm(f => ({ ...f, gender: val }))}
                        className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                        style={{
                          background: form.gender === val ? 'rgba(0,255,136,0.15)' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${form.gender === val ? 'rgba(0,255,136,0.4)' : F.border}`,
                          color: form.gender === val ? F.green : F.sub,
                        }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>

              {error && (
                <div className="mt-3 px-3 py-2 rounded-xl text-xs flex items-center gap-2"
                  style={{ background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.2)', color: '#ff6b6b' }}>
                  ⚠️ {error}
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <button onClick={() => setStep(1)} className="px-4 py-3 rounded-2xl text-sm font-semibold transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${F.border}`, color: F.sub }}>
                  ← Back
                </button>
                <button onClick={handleSaveDetails} disabled={saving}
                  className="flex-1 py-3 rounded-2xl font-bold text-sm transition-all"
                  style={{
                    background: 'linear-gradient(135deg,#00ff88,#00c853)',
                    color: '#003320',
                    boxShadow: '0 8px 20px rgba(0,255,136,0.2)',
                    opacity: saving ? 0.7 : 1,
                  }}>
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(0,51,32,0.3)', borderTopColor: '#003320' }} />
                      Saving...
                    </span>
                  ) : '🎾 Save & Continue'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
