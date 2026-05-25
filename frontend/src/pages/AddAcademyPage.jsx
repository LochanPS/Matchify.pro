import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, MapPin, Dumbbell, Upload, X, Plus,
  CheckCircle, ArrowLeft, Loader2, Save, Clock,
  Phone, Mail, Globe, Instagram, Camera, CreditCard,
  ChevronRight, Users, Wifi,
  ParkingCircle, Shirt, Droplets, UtensilsCrossed, Wind,
  ShoppingBag, HeartPulse, Trophy
} from 'lucide-react';
import api from '../utils/api';
import { fetchUpload } from '../utils/fetchUpload';
import Spinner from '../components/Spinner';

const B = {
  bg: '#040810',
  card: 'rgba(255,255,255,0.04)',
  cardHover: 'rgba(255,255,255,0.07)',
  border: 'rgba(255,255,255,0.08)',
  green: '#F59E0B',
  cyan: '#FCD34D',
  purple: '#8B5CF6',
  amber: '#fbbf24',
};

const DRAFT_KEY = 'matchify_academy_draft_v2';
const LISTING_FEE = 300;

// ── constants ────────────────────────────────────────────────────────────────
const SPORTS_CONFIG = {
  Badminton:      { emoji: '🏸', label: 'Courts', type: 'number', placeholder: 'No. of courts' },
  Tennis:         { emoji: '🎾', label: 'Courts', type: 'number', placeholder: 'No. of courts' },
  'Table Tennis': { emoji: '🏓', label: 'Tables', type: 'number', placeholder: 'No. of tables' },
  Squash:         { emoji: '🎱', label: 'Courts', type: 'number', placeholder: 'No. of courts' },
  Basketball:     { emoji: '🏀', label: 'Courts', type: 'number', placeholder: 'No. of courts' },
  Volleyball:     { emoji: '🏐', label: 'Courts', type: 'number', placeholder: 'No. of courts' },
  Swimming:       { emoji: '🏊', label: 'Pool size', type: 'text', placeholder: 'e.g. 25m × 10m' },
  Cricket:        { emoji: '🏏', label: 'Facilities', type: 'text', placeholder: 'e.g. 2 nets, 1 ground' },
  Football:       { emoji: '⚽', label: 'Ground', type: 'text', placeholder: 'e.g. Full size, 5-a-side' },
  Gym:            { emoji: '💪', label: 'Area', type: 'text', placeholder: 'e.g. 2000 sq ft' },
  Yoga:           { emoji: '🧘', label: 'Hall', type: 'text', placeholder: 'e.g. 30 person capacity' },
  Athletics:      { emoji: '🏃', label: 'Track', type: 'text', placeholder: 'e.g. 400m track' },
};

const AMENITIES = [
  { id: 'parking',       label: 'Parking',         icon: ParkingCircle },
  { id: 'changing_room', label: 'Changing Rooms',  icon: Shirt },
  { id: 'water',         label: 'Water Dispenser', icon: Droplets },
  { id: 'cafeteria',     label: 'Cafeteria',       icon: UtensilsCrossed },
  { id: 'ac',            label: 'AC Courts',       icon: Wind },
  { id: 'shuttle_shop',  label: 'Shuttle Shop',    icon: ShoppingBag },
  { id: 'first_aid',     label: 'First Aid',       icon: HeartPulse },
  { id: 'wifi',          label: 'WiFi',            icon: Wifi },
  { id: 'spectator',     label: 'Spectator Seating', icon: Users },
  { id: 'coaching',      label: 'Coaching',        icon: Trophy },
];

const ACADEMY_TYPES = ['Private Academy', 'Government / SAI', 'Sports Club', 'Multi-Sport Complex', 'School Academy'];

const INDIAN_CITIES = [
  { city: 'Mumbai', state: 'Maharashtra' }, { city: 'Delhi', state: 'Delhi' },
  { city: 'Bangalore', state: 'Karnataka' }, { city: 'Hyderabad', state: 'Telangana' },
  { city: 'Ahmedabad', state: 'Gujarat' }, { city: 'Chennai', state: 'Tamil Nadu' },
  { city: 'Kolkata', state: 'West Bengal' }, { city: 'Pune', state: 'Maharashtra' },
  { city: 'Jaipur', state: 'Rajasthan' }, { city: 'Surat', state: 'Gujarat' },
  { city: 'Lucknow', state: 'Uttar Pradesh' }, { city: 'Kanpur', state: 'Uttar Pradesh' },
  { city: 'Nagpur', state: 'Maharashtra' }, { city: 'Indore', state: 'Madhya Pradesh' },
  { city: 'Thane', state: 'Maharashtra' }, { city: 'Bhopal', state: 'Madhya Pradesh' },
  { city: 'Visakhapatnam', state: 'Andhra Pradesh' }, { city: 'Patna', state: 'Bihar' },
  { city: 'Vadodara', state: 'Gujarat' }, { city: 'Ghaziabad', state: 'Uttar Pradesh' },
  { city: 'Ludhiana', state: 'Punjab' }, { city: 'Agra', state: 'Uttar Pradesh' },
  { city: 'Nashik', state: 'Maharashtra' }, { city: 'Faridabad', state: 'Haryana' },
  { city: 'Rajkot', state: 'Gujarat' }, { city: 'Noida', state: 'Uttar Pradesh' },
  { city: 'Chandigarh', state: 'Chandigarh' }, { city: 'Coimbatore', state: 'Tamil Nadu' },
  { city: 'Kochi', state: 'Kerala' }, { city: 'Dehradun', state: 'Uttarakhand' },
  { city: 'Mysuru', state: 'Karnataka' }, { city: 'Mangalore', state: 'Karnataka' },
  { city: 'Bhubaneswar', state: 'Odisha' }, { city: 'Amritsar', state: 'Punjab' },
  { city: 'Thiruvananthapuram', state: 'Kerala' }, { city: 'Guwahati', state: 'Assam' },
  { city: 'Raipur', state: 'Chhattisgarh' }, { city: 'Vijayawada', state: 'Andhra Pradesh' },
  { city: 'Jodhpur', state: 'Rajasthan' }, { city: 'Madurai', state: 'Tamil Nadu' },
  { city: 'Tiruppur', state: 'Tamil Nadu' }, { city: 'Jabalpur', state: 'Madhya Pradesh' },
  { city: 'Udaipur', state: 'Rajasthan' }, { city: 'Varanasi', state: 'Uttar Pradesh' },
  { city: 'Ranchi', state: 'Jharkhand' }, { city: 'Patiala', state: 'Punjab' },
  { city: 'Tirupati', state: 'Andhra Pradesh' }, { city: 'Vellore', state: 'Tamil Nadu' },
];

// ── helpers ──────────────────────────────────────────────────────────────────
const loadDraft = () => {
  try {
    const s = localStorage.getItem(DRAFT_KEY);
    return s ? JSON.parse(s) : null;
  } catch { return null; }
};

/**
 * Compress an image File via canvas.
 * Resizes to maxDim on the longest side, re-encodes as JPEG at given quality.
 * Vercel serverless has a 4.5MB body limit — this keeps uploads safe.
 */
const compressImage = (file, { maxDim = 1600, quality = 0.80 } = {}) =>
  new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })),
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); }; // fallback: original
    img.src = url;
  });

function StepIndicator({ current, total }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: total }, (_, i) => i + 1).map(n => (
        <div key={n} className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all"
            style={{
              background: n < current ? B.green : n === current
                ? 'linear-gradient(135deg,#F59E0B,#FCD34D)' : 'rgba(255,255,255,0.06)',
              color: n <= current ? '#050810' : 'rgba(255,255,255,0.3)',
              border: n > current ? `1px solid rgba(255,255,255,0.1)` : 'none',
            }}>
            {n < current ? '✓' : n}
          </div>
          {n < total && (
            <div className="w-8 h-0.5 rounded"
              style={{ background: n < current ? B.green : 'rgba(255,255,255,0.08)' }} />
          )}
        </div>
      ))}
    </div>
  );
}

function Field({ label, error, required, children, hint }) {
  return (
    <div>
      <label className="block text-sm font-black mb-1.5"
        style={{ color: 'rgba(255,255,255,0.7)' }}>
        {label}{required && <span style={{ color: '#f87171' }}> *</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs mt-1.5 font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>{hint}</p>}
      {error && <p className="text-xs mt-1.5 font-bold" style={{ color: '#f87171' }}>{error}</p>}
    </div>
  );
}

const inputCls = (err) =>
  `w-full px-3.5 py-3 rounded-xl text-sm text-white placeholder-white/25 focus:outline-none transition-all`;
const inputStyle = (err) => ({
  background: 'rgba(255,255,255,0.05)',
  border: `1px solid ${err ? 'rgba(248,113,113,0.6)' : B.border}`,
});

// ── Page ─────────────────────────────────────────────────────────────────────
export default function AddAcademyPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [errors, setErrors] = useState({});
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showCitySugg, setShowCitySugg] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const photoInputRef = useRef(null);
  const payInputRef = useRef(null);

  const defaultForm = {
    name: '', type: '', address: '', city: '', state: '', pincode: '',
    sports: [], sportDetails: {}, amenities: [],
    openingHours: '', description: '',
    phone: '', email: '', website: '', instagram: '', upiId: '',
  };
  const [form, setForm] = useState(defaultForm);

  // Load draft
  useEffect(() => {
    const d = loadDraft();
    if (d?.form) {
      const hasContent = Object.values(d.form).some(v =>
        typeof v === 'string' ? v.trim().length > 0 :
        Array.isArray(v) ? v.length > 0 : false
      );
      if (hasContent) {
        setForm(d.form);
        if (d.step && d.step > 1) setStep(d.step);
        setDraftRestored(true);
      }
    }
  }, []);

  // Auto-save (debounced 1.5s) — saves form + current step
  const saveDraft = useCallback(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, step, savedAt: new Date().toISOString() }));
    setLastSaved(new Date());
  }, [form, step]);

  useEffect(() => {
    const hasAnyContent = Object.values(form).some(v =>
      typeof v === 'string' ? v.trim().length > 0 :
      Array.isArray(v) ? v.length > 0 : false
    );
    if (!hasAnyContent) return;
    const t = setTimeout(saveDraft, 1500);
    return () => clearTimeout(t);
  }, [form, step, saveDraft]);

  const clearDraft = () => { localStorage.removeItem(DRAFT_KEY); setLastSaved(null); };

  // Field handlers
  const set = (key, val) => {
    setForm(p => ({ ...p, [key]: val }));
    if (errors[key]) setErrors(p => ({ ...p, [key]: '' }));
  };

  const handleCity = (val) => {
    set('city', val);
    if (val.length >= 2) {
      const matches = INDIAN_CITIES.filter(c => c.city.toLowerCase().startsWith(val.toLowerCase())).slice(0, 5);
      setCitySuggestions(matches);
      setShowCitySugg(matches.length > 0);
    } else setShowCitySugg(false);
  };

  const selectCity = (city, state) => {
    setForm(p => ({ ...p, city, state }));
    setShowCitySugg(false);
    setErrors(p => ({ ...p, city: '', state: '' }));
  };

  const toggleSport = (s) => {
    setForm(p => {
      const has = p.sports.includes(s);
      const sports = has ? p.sports.filter(x => x !== s) : [...p.sports, s];
      const sportDetails = { ...p.sportDetails };
      if (has) delete sportDetails[s];
      return { ...p, sports, sportDetails };
    });
    if (errors.sports) setErrors(p => ({ ...p, sports: '' }));
  };

  const toggleAmenity = (id) => {
    setForm(p => ({
      ...p,
      amenities: p.amenities.includes(id)
        ? p.amenities.filter(a => a !== id)
        : [...p.amenities, id],
    }));
  };

  const handlePhotos = (e) => {
    Array.from(e.target.files).forEach(async (rawFile) => {
      const file = await compressImage(rawFile, { maxDim: 1280, quality: 0.78 });
      const r = new FileReader();
      r.onload = ev => setPhotos(p => [...p, { file, preview: ev.target.result }]);
      r.readAsDataURL(file);
    });
  };

  const handlePayment = async (e) => {
    const rawFile = e.target.files[0];
    if (!rawFile) return;
    const file = await compressImage(rawFile, { maxDim: 1600, quality: 0.82 });
    const r = new FileReader();
    r.onload = ev => setPaymentScreenshot({ file, preview: ev.target.result });
    r.readAsDataURL(file);
    setErrors(p => ({ ...p, payment: '' }));
  };

  // Validation
  const validateStep1 = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Academy name is required';
    if (!form.address.trim()) e.address = 'Address is required';
    if (!form.city.trim()) e.city = 'City is required';
    if (!form.state.trim()) e.state = 'State is required';
    if (form.sports.length === 0) e.sports = 'Select at least one sport';
    form.sports.forEach(s => {
      if (!form.sportDetails[s]?.trim()) e[`sport_${s}`] = `${SPORTS_CONFIG[s]?.label || 'Detail'} required`;
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e = {};
    const digits = form.phone.replace(/\D/g, '');
    if (!form.phone.trim()) e.phone = 'Phone number is required';
    else if (digits.length < 10) e.phone = 'Enter a valid 10-digit number';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Returns phone with +91 prefix for submission
  const fullPhone = () => {
    const p = form.phone.trim();
    if (!p) return '';
    return p.startsWith('+') ? p : `+91${p.replace(/\s/g, '')}`;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleSubmit = async () => {
    if (!paymentScreenshot) {
      setErrors({ payment: 'Upload payment screenshot' });
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'sports' || k === 'sportDetails' || k === 'amenities') {
          fd.append(k, JSON.stringify(v));
        } else if (k === 'phone') {
          fd.append(k, fullPhone());
        } else {
          fd.append(k, v);
        }
      });
      photos.forEach(p => fd.append('photos', p.file));
      fd.append('paymentScreenshot', paymentScreenshot.file);
      await fetchUpload('/academies', fd);
      clearDraft();
      setStep(4);
    } catch (err) {
      setErrors({ payment: err.response?.data?.error || err.message || 'Submission failed. Try again.' });
    } finally {
      setLoading(false);
    }
  };

  // ── Step 4: Success ─────────────────────────────────────────────────────────
  if (step === 4) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: B.bg }}>
        <div className="w-full max-w-sm text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: 'rgba(245,158,11,0.12)', border: '2px solid rgba(245,158,11,0.3)' }}>
            <CheckCircle className="w-10 h-10" style={{ color: B.green }} />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Submitted!</h2>
          <p className="text-sm mb-2" style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
            Your academy has been submitted for review.
          </p>
          <p className="text-xs mb-8 px-4" style={{ color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>
            We'll verify your payment and approve your listing within 24–48 hours.
            You'll receive a notification once it's live.
          </p>
          <button onClick={() => navigate('/academies')}
            className="w-full py-3.5 rounded-2xl font-black text-sm"
            style={{ background: 'linear-gradient(135deg,#F59E0B,#FCD34D)', color: '#050810' }}>
            Back to Academies
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12" style={{ background: B.bg }}>

      {/* Header */}
      <div className="sticky top-0 z-20 px-4 pt-4 pb-3"
        style={{ background: B.bg, borderBottom: `1px solid ${B.border}` }}>
        <div className="flex items-center justify-between mb-1">
          <button onClick={() => step > 1 ? setStep(s => s - 1) : navigate('/academies')}
            className="flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" style={{ color: B.green }} />
            <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>
              {step > 1 ? 'Back' : 'Academies'}
            </span>
          </button>
          <div className="text-xs font-black" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Step {step} of 3
          </div>
          {lastSaved && (
            <div className="flex items-center gap-1 text-xs" style={{ color: 'rgba(245,158,11,0.5)' }}>
              <Save className="w-3 h-3" />
              Saved
            </div>
          )}
        </div>
      </div>

      <div className="px-4 pt-4">

        {/* Title */}
        <div className="mb-5">
          <h1 className="text-2xl font-black text-white">List Your Academy</h1>
          <p className="text-sm font-semibold mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
            One-time fee of ₹{LISTING_FEE} · Goes live after admin approval
          </p>
        </div>

        <StepIndicator current={step} total={3} />

        {/* Draft banner */}
        {draftRestored && (
          <div className="mb-4 px-3 py-2.5 rounded-xl flex items-center justify-between"
            style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" style={{ color: B.cyan }} />
              <span className="text-xs font-semibold" style={{ color: B.cyan }}>Draft restored</span>
            </div>
            <button onClick={() => { clearDraft(); setForm(defaultForm); setDraftRestored(false); }}
              className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Discard
            </button>
          </div>
        )}

        {/* ── STEP 1 ────────────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-4">

            {/* Academy name */}
            <Field label="Academy Name" required error={errors.name}>
              <input value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="e.g. Shuttlers Badminton Academy"
                className={inputCls(errors.name)} style={inputStyle(errors.name)} />
            </Field>

            {/* Type */}
            <Field label="Academy Type">
              <div className="flex flex-wrap gap-2">
                {ACADEMY_TYPES.map(t => (
                  <button key={t} type="button" onClick={() => set('type', t)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                    style={{
                      background: form.type === t ? B.purple : 'rgba(255,255,255,0.05)',
                      color: form.type === t ? '#fff' : 'rgba(255,255,255,0.5)',
                      border: `1px solid ${form.type === t ? B.purple : B.border}`,
                    }}>
                    {t}
                  </button>
                ))}
              </div>
            </Field>

            {/* Address */}
            <Field label="Full Address" required error={errors.address}>
              <textarea value={form.address} onChange={e => set('address', e.target.value)}
                placeholder="Door no, street, area..."
                rows={2} className={inputCls(errors.address) + ' resize-none'}
                style={inputStyle(errors.address)} />
            </Field>

            {/* City + State + Pincode */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="City" required error={errors.city}>
                <div className="relative">
                  <input value={form.city} onChange={e => handleCity(e.target.value)}
                    onBlur={() => setTimeout(() => setShowCitySugg(false), 200)}
                    placeholder="City" autoComplete="off"
                    className={inputCls(errors.city)} style={inputStyle(errors.city)} />
                  {showCitySugg && (
                    <div className="absolute z-50 w-full mt-1 rounded-xl overflow-hidden"
                      style={{ background: '#0d1025', border: `1px solid ${B.border}`, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                      {citySuggestions.map((item, i) => (
                        <div key={i} onMouseDown={() => selectCity(item.city, item.state)}
                          className="px-3 py-2.5 cursor-pointer text-sm"
                          style={{ borderBottom: `1px solid ${B.border}` }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(168,85,247,0.15)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <div className="font-bold text-white">{item.city}</div>
                          <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{item.state}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Field>
              <Field label="State" required error={errors.state}>
                <input value={form.state} readOnly placeholder="Auto-filled"
                  className={inputCls(errors.state) + ' cursor-not-allowed'}
                  style={{ ...inputStyle(errors.state), opacity: form.state ? 1 : 0.5 }} />
              </Field>
            </div>

            <Field label="Pincode">
              <input value={form.pincode} onChange={e => set('pincode', e.target.value)}
                placeholder="e.g. 560001" maxLength={6}
                className={inputCls()} style={inputStyle()} />
            </Field>

            {/* Sports */}
            <Field label="Sports Available" required error={errors.sports}>
              <div className="flex flex-wrap gap-2">
                {Object.entries(SPORTS_CONFIG).map(([sport, cfg]) => {
                  const active = form.sports.includes(sport);
                  return (
                    <button key={sport} type="button" onClick={() => toggleSport(sport)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                      style={{
                        background: active ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)',
                        color: active ? B.green : 'rgba(255,255,255,0.5)',
                        border: `1px solid ${active ? 'rgba(245,158,11,0.4)' : B.border}`,
                      }}>
                      {cfg.emoji} {sport}
                    </button>
                  );
                })}
              </div>
            </Field>

            {/* Sport details */}
            {form.sports.length > 0 && (
              <div className="rounded-xl p-4 space-y-3"
                style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${B.border}` }}>
                <p className="text-sm font-black" style={{ color: B.green }}>
                  Facility Details
                </p>
                {form.sports.map(sport => {
                  const cfg = SPORTS_CONFIG[sport];
                  return (
                    <Field key={sport} label={`${cfg.emoji} ${sport} — ${cfg.label}`}
                      required error={errors[`sport_${sport}`]}>
                      <input type={cfg.type}
                        value={form.sportDetails[sport] || ''}
                        onChange={e => {
                          setForm(p => ({ ...p, sportDetails: { ...p.sportDetails, [sport]: e.target.value } }));
                          if (errors[`sport_${sport}`]) setErrors(p => ({ ...p, [`sport_${sport}`]: '' }));
                        }}
                        placeholder={cfg.placeholder}
                        min={cfg.type === 'number' ? 1 : undefined}
                        className={inputCls(errors[`sport_${sport}`])}
                        style={inputStyle(errors[`sport_${sport}`])} />
                    </Field>
                  );
                })}
              </div>
            )}

            {/* Amenities */}
            <Field label="Amenities">
              <div className="flex flex-wrap gap-2">
                {AMENITIES.map(({ id, label, icon: Icon }) => {
                  const active = form.amenities.includes(id);
                  return (
                    <button key={id} type="button" onClick={() => toggleAmenity(id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                      style={{
                        background: active ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.04)',
                        color: active ? B.cyan : 'rgba(255,255,255,0.5)',
                        border: `1px solid ${active ? 'rgba(245,158,11,0.35)' : B.border}`,
                      }}>
                      <Icon className="w-3 h-3" />
                      {label}
                    </button>
                  );
                })}
              </div>
            </Field>

            {/* Opening hours */}
            <Field label="Opening Hours" hint="When is your academy open for players?">
              <input value={form.openingHours} onChange={e => set('openingHours', e.target.value)}
                placeholder="e.g. 6:00 AM – 10:00 PM, Mon–Sun"
                className={inputCls()} style={inputStyle()} />
            </Field>

            {/* Description */}
            <Field label="About Your Academy" hint="Describe your training programs, achievements, and what sets you apart">
              <textarea value={form.description} onChange={e => set('description', e.target.value)}
                placeholder="e.g. Professional coaching for all levels, state-level players trained, annual tournaments hosted..."
                rows={3} className={inputCls() + ' resize-none'} style={inputStyle()} />
            </Field>

            <button onClick={handleNext}
              className="w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg,#F59E0B,#FCD34D)', color: '#050810' }}>
              Next: Contact & Photos
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── STEP 2 ────────────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-4">

            <Field label="Phone Number" required error={errors.phone}>
              <div className="relative flex items-stretch">
                <div className="flex items-center gap-1.5 px-3 rounded-l-xl flex-shrink-0 select-none"
                  style={{
                    background: 'rgba(245,158,11,0.10)',
                    border: `1px solid ${errors.phone ? 'rgba(248,113,113,0.6)' : 'rgba(245,158,11,0.30)'}`,
                    borderRight: 'none',
                    color: '#FCD34D',
                    fontWeight: 800,
                    fontSize: '14px',
                  }}>
                  🇮🇳 +91
                </div>
                <input
                  value={form.phone}
                  onChange={e => {
                    // Strip any +91 prefix if user types it manually
                    let val = e.target.value.replace(/^\+91\s?/, '').replace(/^91/, '');
                    set('phone', val);
                  }}
                  type="tel"
                  placeholder="98765 43210"
                  className={inputCls(errors.phone)}
                  style={{
                    ...inputStyle(errors.phone),
                    borderRadius: '0 12px 12px 0',
                    borderLeft: 'none',
                  }}
                />
              </div>
            </Field>

            <Field label="Email">
              <input value={form.email} onChange={e => set('email', e.target.value)}
                type="email" placeholder="academy@email.com"
                className={inputCls()} style={inputStyle()} />
            </Field>

            <Field label="Website" hint="Your academy website if any">
              <input value={form.website} onChange={e => set('website', e.target.value)}
                type="url" placeholder="www.youracademy.com"
                className={inputCls()} style={inputStyle()} />
            </Field>

            <Field label="Instagram" hint="Instagram handle (e.g. @youracademy)">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold"
                  style={{ color: 'rgba(255,255,255,0.3)' }}>@</span>
                <input value={form.instagram} onChange={e => set('instagram', e.target.value)}
                  placeholder="youracademy"
                  className={inputCls() + ' pl-7'} style={inputStyle()} />
              </div>
            </Field>

            <Field label="UPI ID for Court Payments" hint="Players will pay you directly via UPI when booking courts (e.g. 9876543210@upi)">
              <input value={form.upiId} onChange={e => set('upiId', e.target.value)}
                placeholder="e.g. 9876543210@upi or yourname@okaxis"
                className={inputCls()} style={inputStyle()} />
            </Field>

            {/* Photos */}
            <Field label="Academy Photos" hint="Up to 20 photos — courts, facilities, coaches">
              <div className="grid grid-cols-3 gap-2">
                {photos.map((p, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden">
                    <img src={p.preview} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setPhotos(ps => ps.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(239,68,68,0.9)' }}>
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
                {photos.length < 20 && (
                  <button type="button" onClick={() => photoInputRef.current?.click()}
                    className="aspect-square rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all"
                    style={{ background: 'rgba(255,255,255,0.04)', border: `2px dashed ${B.border}` }}>
                    <Camera className="w-5 h-5 mb-1" style={{ color: 'rgba(255,255,255,0.3)' }} />
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Add</span>
                    <input ref={photoInputRef} type="file" accept="image/*" multiple
                      onChange={handlePhotos} className="hidden" />
                  </button>
                )}
              </div>
            </Field>

            <button onClick={handleNext}
              className="w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg,#F59E0B,#FCD34D)', color: '#050810' }}>
              Next: Payment
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── STEP 3: Payment ───────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-4">

            {/* Fee summary */}
            <div className="rounded-2xl p-4"
              style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-white">Academy Listing Fee</span>
                <span className="text-2xl font-black" style={{ color: B.green }}>₹{LISTING_FEE}</span>
              </div>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                One-time fee · Listed after payment verification · 24–48 hr approval
              </p>
            </div>

            {/* QR + UPI */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background: B.card, border: `1px solid ${B.border}` }}>
              <div className="px-4 py-3 flex items-center gap-3"
                style={{ borderBottom: `1px solid ${B.border}`, background: 'rgba(245,158,11,0.05)' }}>
                <CreditCard className="w-4 h-4" style={{ color: B.cyan }} />
                <p className="text-sm font-black text-white">Pay via UPI</p>
              </div>
              <div className="p-4 flex flex-col items-center">
                {/* QR */}
                <div className="p-3 bg-white rounded-2xl shadow-lg mb-3">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=9742628582@slc&pn=Matchify.pro&am=${LISTING_FEE}&cu=INR&tn=Academy+Listing+Fee`)}`}
                    alt="Payment QR"
                    className="w-48 h-48 rounded-xl"
                  />
                </div>

                {/* UPI details */}
                <div className="w-full space-y-2 rounded-xl p-3"
                  style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${B.border}` }}>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'rgba(255,255,255,0.45)' }}>UPI ID</span>
                    <span className="font-black text-white">9742628582@slc</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'rgba(255,255,255,0.45)' }}>Name</span>
                    <span className="font-bold text-white">Matchify.pro</span>
                  </div>
                  <div className="flex justify-between items-center text-sm pt-2 mt-1"
                    style={{ borderTop: `1px solid ${B.border}` }}>
                    <span className="font-bold text-white">Amount</span>
                    <span className="text-xl font-black" style={{ color: B.cyan }}>₹{LISTING_FEE}</span>
                  </div>
                </div>

                <p className="text-xs mt-3 text-center px-2"
                  style={{ color: B.amber }}>
                  ⚠️ Pay exactly ₹{LISTING_FEE} and take a screenshot of the confirmation
                </p>
              </div>
            </div>

            {/* Screenshot upload */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background: B.card, border: `1px solid ${B.border}` }}>
              <div className="px-4 py-3 flex items-center gap-3"
                style={{ borderBottom: `1px solid ${B.border}`, background: 'rgba(245,158,11,0.04)' }}>
                <Upload className="w-4 h-4" style={{ color: B.green }} />
                <p className="text-sm font-black text-white">Upload Payment Screenshot</p>
              </div>
              <div className="p-4">
                {paymentScreenshot ? (
                  <div className="relative">
                    <img src={paymentScreenshot.preview} alt="Payment"
                      className="w-full rounded-xl" />
                    <button onClick={() => setPaymentScreenshot(null)}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(239,68,68,0.9)' }}>
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ) : (
                  <div onClick={() => payInputRef.current?.click()}
                    className="border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer"
                    style={{ borderColor: 'rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.02)' }}>
                    <Camera className="w-10 h-10 mx-auto mb-2" style={{ color: 'rgba(255,255,255,0.25)' }} />
                    <p className="text-sm font-bold text-white mb-1">Tap to upload screenshot</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>PNG, JPG up to 10MB</p>
                    <input ref={payInputRef} type="file" accept="image/*"
                      onChange={handlePayment} className="hidden" />
                  </div>
                )}
                {errors.payment && (
                  <p className="text-xs mt-2 font-semibold" style={{ color: '#f87171' }}>{errors.payment}</p>
                )}
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || !paymentScreenshot}
              className="w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg,#F59E0B,#FCD34D)', color: '#050810' }}>
              {loading ? <Spinner size="md" /> : <CheckCircle className="w-5 h-5" />}
              {loading ? 'Submitting...' : 'Submit Academy'}
            </button>

            <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
              By submitting you agree to Matchify.pro listing terms.
              Listing goes live after admin verification.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}


