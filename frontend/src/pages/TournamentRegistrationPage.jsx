import { getErrorMessage } from '../utils/errorMessage';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { tournamentAPI } from '../api/tournament';
import { registrationAPI } from '../api/registration';
import { getPublicPaymentSettings } from '../api/payment';
import CategorySelector from '../components/registration/CategorySelector';
import { ArrowLeftIcon, UserGroupIcon, CameraIcon, CheckCircleIcon, XMarkIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Loader, Upload, QrCode, AlertCircle, Search } from 'lucide-react';
import LoadingScreen from '../components/LoadingScreen';
import Spinner from '../components/Spinner';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const BRAND = {
  bg: '#040810',
  green: '#F59E0B',
  cyan: '#FCD34D',
  purple: '#8B5CF6',
  card: 'rgba(255,255,255,0.04)',
  cardBorder: 'rgba(255,255,255,0.08)',
};

// ─────────────────────────────────────────────────────────────────────────────
// Download QR — fetch as blob to bypass cross-origin anchor restriction
// ─────────────────────────────────────────────────────────────────────────────
const downloadQR = async (url) => {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = 'matchify-payment-qr.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(objectUrl);
  } catch {
    window.open(url, '_blank');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CopyField — label + value + copy button
// ─────────────────────────────────────────────────────────────────────────────
function CopyField({ label, value, mono = false, highlight = false }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(String(value)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };
  return (
    <div
      className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl"
      style={{
        background: highlight ? 'rgba(245,158,11,0.07)' : 'rgba(255,255,255,0.05)',
        border: highlight ? '1px solid rgba(245,158,11,0.2)' : '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div className="min-w-0 flex-1">
        <p className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</p>
        <p
          className={`text-sm font-bold text-white truncate ${mono ? 'font-mono' : ''}`}
          style={highlight ? { color: BRAND.green } : {}}
        >
          {value}
        </p>
      </div>
      <button
        onClick={copy}
        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
        style={{
          background: copied ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.08)',
          border: copied ? '1px solid rgba(245,158,11,0.4)' : '1px solid rgba(255,255,255,0.12)',
          color: copied ? '#F59E0B' : 'rgba(255,255,255,0.6)',
          minWidth: '64px',
        }}
      >
        {copied ? '✓ Done' : '📋 Copy'}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function TournamentRegistrationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const DRAFT_KEY = `matchify_reg_draft_${id}`;

  const [tournament, setTournament] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [partnerCodes, setPartnerCodes] = useState({});
  const [partnerInfo, setPartnerInfo] = useState({});
  const [partnerMode, setPartnerMode] = useState({}); // catId -> 'id' | 'name'
  const [partnerNames, setPartnerNames] = useState({}); // catId -> string (name-only mode)
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [paymentPreview, setPaymentPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [alreadyRegisteredCategories, setAlreadyRegisteredCategories] = useState([]);
  const [existingRegistrations, setExistingRegistrations] = useState([]); // full objects for already-registered cats
  const [paymentSettings, setPaymentSettings] = useState(null);
  const [isRegistrationClosed, setIsRegistrationClosed] = useState(false);
  const [searchingPartner, setSearchingPartner] = useState({});
  const [utrId, setUtrId] = useState('');

  // ── Load draft + data on mount ───────────────────────────────────────────
  useEffect(() => {
    fetchTournamentData();
    fetchPaymentSettings();
    // Restore draft if fresh (< 24h old)
    try {
      const draft = JSON.parse(safeStorage.getItem(DRAFT_KEY) || 'null');
      if (draft && Array.isArray(draft.selectedCategories) && draft.selectedCategories.length > 0) {
        const ageMs = Date.now() - (draft.timestamp || 0);
        if (ageMs < 24 * 60 * 60 * 1000) {
          setSelectedCategories(draft.selectedCategories);
          if (draft.partnerCodes) setPartnerCodes(draft.partnerCodes);
          if (draft.partnerInfo) setPartnerInfo(draft.partnerInfo);
          if (draft.partnerMode) setPartnerMode(draft.partnerMode);
          if (draft.partnerNames) setPartnerNames(draft.partnerNames);
        }
      }
    } catch {}
  }, [id]);

  useEffect(() => {
    if (tournament) {
      setIsRegistrationClosed(new Date() > new Date(tournament.registrationCloseDate));
    }
  }, [tournament]);

  // ── Draft helpers ────────────────────────────────────────────────────────
  const saveDraft = useCallback(() => {
    try {
      safeStorage.setItem(DRAFT_KEY, JSON.stringify({
        selectedCategories,
        partnerCodes,
        partnerInfo,
        partnerMode,
        partnerNames,
        timestamp: Date.now(),
      }));
    } catch {}
  }, [selectedCategories, partnerCodes, partnerInfo, partnerMode, partnerNames, DRAFT_KEY]);

  const clearDraft = () => {
    try { safeStorage.removeItem(DRAFT_KEY); } catch {}
  };

  // ── Data fetching ────────────────────────────────────────────────────────
  const fetchPaymentSettings = async () => {
    try {
      const res = await getPublicPaymentSettings();
      setPaymentSettings(res.data);
    } catch (err) {
      console.error('Payment settings failed to load:', err?.message);
    }
  };

  const fetchTournamentData = async () => {
    try {
      setLoading(true);
      const [tData, catData, myRegs] = await Promise.all([
        tournamentAPI.getTournament(id),
        tournamentAPI.getCategories(id),
        registrationAPI.getMyRegistrations(),
      ]);
      setTournament(tData.data);
      setCategories(catData.categories || []);
      const existingRegs = (myRegs.registrations || [])
        .filter(r => r.tournament.id === id && r.status !== 'cancelled' && r.status !== 'rejected');
      setAlreadyRegisteredCategories(existingRegs.map(r => r.category.id));
      setExistingRegistrations(existingRegs);
    } catch {
      setError('Failed to load tournament details');
    } finally {
      setLoading(false);
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────
  const calculateTotal = () =>
    selectedCategories.reduce((sum, catId) => {
      const cat = categories.find(c => c.id === catId);
      return sum + (cat?.entryFee || 0);
    }, 0);

  const getAlreadyRegisteredCategoryNames = () =>
    alreadyRegisteredCategories
      .map(catId => categories.find(c => c.id === catId)?.name)
      .filter(Boolean)
      .join(', ');

  const selectedDoublesCategories = selectedCategories.filter(catId =>
    categories.find(c => c.id === catId)?.format === 'doubles'
  );

  // ── Step 1: proceed to payment ───────────────────────────────────────────
  const handleProceedToPayment = () => {
    setError('');
    if (!selectedCategories.length) {
      setError('Select at least one category');
      return;
    }
    const allAlreadyRegistered = selectedCategories.every(catId =>
      alreadyRegisteredCategories.includes(catId)
    );
    if (allAlreadyRegistered) {
      setError('You are already registered for the selected category. Choose a different category.');
      return;
    }
    for (const catId of selectedDoublesCategories) {
      const cat = categories.find(c => c.id === catId);
      const mode = partnerMode[catId] || 'id';
      if (mode === 'id') {
        const code = partnerCodes[catId];
        if (!code || code === '#') { setError(`Enter partner Matchify.pro ID for ${cat?.name}`); return; }
        if (!/^#\d+$/.test(code) && !/^#[A-Z]\d{5}$/i.test(code)) {
          setError(`Invalid Matchify.pro ID for ${cat?.name} — format: #1, #12`);
          return;
        }
        if (!partnerInfo[catId]) { setError(`Tap Find to verify partner ID for ${cat?.name}`); return; }
      } else {
        const name = partnerNames[catId]?.trim();
        if (!name) { setError(`Enter partner name for ${cat?.name}`); return; }
        if (name.length < 2) { setError(`Partner name too short for ${cat?.name}`); return; }
      }
    }
    saveDraft();
    setStep(2);
  };

  // ── Partner search ───────────────────────────────────────────────────────
  const handlePartnerCodeChange = (categoryId, code) => {
    let val = code.replace(/[^#\d]/g, '');
    if (!val.startsWith('#')) val = '#' + val.replace(/#/g, '');
    setPartnerCodes(p => ({ ...p, [categoryId]: val }));
    setPartnerInfo(p => ({ ...p, [categoryId]: null }));
  };

  const fetchPartnerByCode = async (categoryId, code) => {
    setError('');
    if (!/^#\d+$/.test(code) && !/^#[A-Z]\d{5}$/i.test(code)) {
      setError('Enter valid ID like #1, #12, #100'); return;
    }
    setSearchingPartner(p => ({ ...p, [categoryId]: true }));
    try {
      const res = await registrationAPI.getPartnerByCode(code);
      if (res.success && res.user) {
        setPartnerInfo(p => ({ ...p, [categoryId]: res.user }));
      } else {
        setError('No player found with this ID');
        setPartnerInfo(p => ({ ...p, [categoryId]: null }));
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Player not found'));
      setPartnerInfo(p => ({ ...p, [categoryId]: null }));
    } finally {
      setSearchingPartner(p => ({ ...p, [categoryId]: false }));
    }
  };

  // ── Screenshot ───────────────────────────────────────────────────────────
  const handleScreenshotSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Upload an image file (JPG, PNG)'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5MB'); return; }
    setPaymentScreenshot(file);
    setPaymentPreview(URL.createObjectURL(file));
    setError('');
  };

  const removeScreenshot = () => {
    if (paymentPreview) URL.revokeObjectURL(paymentPreview);
    setPaymentScreenshot(null);
    setPaymentPreview(null);
  };

  // ── Submit registration ──────────────────────────────────────────────────
  const handleRegister = async () => {
    const trimmedUtr = utrId.trim();
    if (!trimmedUtr && !paymentScreenshot) {
      setError('Provide UTR / Transaction ID or upload payment screenshot (or both)'); return;
    }
    // Safety: re-validate doubles partner before submit (guards against mode-switching edge cases)
    for (const catId of selectedDoublesCategories) {
      const cat = categories.find(c => c.id === catId);
      const mode = partnerMode[catId] || 'id';
      if (mode === 'id' && !partnerInfo[catId]) {
        setError(`Partner not verified for ${cat?.name}. Go back and verify partner ID.`); return;
      }
      if (mode === 'name' && !partnerNames[catId]?.trim()) {
        setError(`Partner name missing for ${cat?.name}. Go back and enter partner name.`); return;
      }
    }
    setSubmitting(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('tournamentId', id);
      formData.append('categoryIds', JSON.stringify(selectedCategories));
      const partnerEmails = {};
      const partnerNamesPayload = {};
      Object.keys(partnerInfo).forEach(catId => {
        if (partnerInfo[catId] && (partnerMode[catId] || 'id') === 'id') {
          partnerEmails[catId] = partnerInfo[catId].email;
        }
      });
      Object.keys(partnerNames).forEach(catId => {
        if (partnerMode[catId] === 'name' && partnerNames[catId]?.trim()) {
          partnerNamesPayload[catId] = partnerNames[catId].trim();
        }
      });
      formData.append('partnerEmails', JSON.stringify(partnerEmails));
      formData.append('partnerNames', JSON.stringify(partnerNamesPayload));
      if (trimmedUtr) formData.append('utrId', trimmedUtr);
      if (paymentScreenshot) formData.append('paymentScreenshot', paymentScreenshot);
      await registrationAPI.createRegistrationWithScreenshot(formData);
      clearDraft();
      setShowSuccessModal(true);
    } catch (err) {
      setError(getErrorMessage(err, 'Registration failed. Try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render: loading ──────────────────────────────────────────────────────
  if (loading) {
    return <LoadingScreen message="Loading…" />;
  }

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BRAND.bg }}>
        <div className="text-center px-6">
          <p className="text-white font-bold text-lg mb-4">Tournament not found</p>
          <button onClick={() => navigate('/tournaments')} className="text-sm font-bold" style={{ color: BRAND.green }}>
            Browse Tournaments
          </button>
        </div>
      </div>
    );
  }

  if (isRegistrationClosed) {
    return (
      <div className="min-h-screen px-4 py-8 flex flex-col" style={{ background: BRAND.bg }}>
        <button onClick={() => navigate(`/tournaments/${id}`)} className="flex items-center gap-1.5 mb-6 text-sm font-bold"
          style={{ color: 'rgba(255,255,255,0.5)' }}>
          <ArrowLeftIcon className="h-4 w-4" /> Back
        </button>
        <div className="flex-1 flex items-center justify-center">
          <div className="rounded-2xl p-8 text-center w-full max-w-sm"
            style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(239,68,68,0.15)' }}>
              <XMarkIcon className="w-8 h-8" style={{ color: '#f87171' }} />
            </div>
            <h2 className="text-xl font-black text-white mb-2">Registration Closed</h2>
            <p className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Deadline was {new Date(tournament.registrationCloseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
            <button onClick={() => navigate(`/tournaments/${id}`)}
              className="mt-6 px-6 py-3 rounded-xl font-bold text-sm text-white"
              style={{ background: 'rgba(255,255,255,0.1)' }}>
              View Tournament
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Payment always routes to the admin/platform account — never the organizer's.
  // Only admin-configured platform details are shown; no organizer fallback.
  const upiId = (paymentSettings?.upiId?.trim() || '');
  const total = calculateTotal();
  const accountHolder = paymentSettings?.accountHolder || 'Matchify.pro';
  const qrUrl = paymentSettings?.qrCodeUrl || null;

  // ── Render: main ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-12" style={{ background: BRAND.bg }}>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="px-4 pt-6 pb-4">
        <button onClick={() => navigate(`/tournaments/${id}`)}
          className="flex items-center gap-1.5 mb-5 text-sm font-bold"
          style={{ color: 'rgba(255,255,255,0.5)' }}>
          <ArrowLeftIcon className="h-4 w-4" /> Back
        </button>
        <h1 className="text-xl font-black text-white leading-tight">{tournament.name}</h1>
        <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
          📍 {tournament.city}, {tournament.state} &nbsp;·&nbsp; 📅 {new Date(tournament.startDate).toLocaleDateString('en-IN')}
        </p>
      </div>

      {/* ── Step Indicator ───────────────────────────────────────────────── */}
      <div className="px-4 mb-5">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
              style={{
                background: step > 1 ? BRAND.green : step === 1 ? BRAND.purple : 'rgba(255,255,255,0.1)',
                color: step >= 1 ? '#050810' : 'rgba(255,255,255,0.4)',
              }}>
              {step > 1 ? '✓' : '1'}
            </div>
            <span className="text-xs font-bold" style={{ color: step >= 1 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)' }}>
              Categories
            </span>
          </div>
          <div className="flex-1 h-0.5 rounded-full mx-1"
            style={{ background: step >= 2 ? BRAND.green : 'rgba(255,255,255,0.1)' }} />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
              style={{
                background: step >= 2 ? BRAND.purple : 'rgba(255,255,255,0.1)',
                color: step >= 2 ? '#fff' : 'rgba(255,255,255,0.4)',
              }}>
              2
            </div>
            <span className="text-xs font-bold" style={{ color: step >= 2 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)' }}>
              Payment
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4">

        {/* ── Error Banner ─────────────────────────────────────────────── */}
        {error && (
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#f87171' }} />
            <p className="text-xs font-semibold" style={{ color: '#f87171' }}>{error}</p>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            STEP 1 — Category Selection
        ════════════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <>
            {/* Already registered notice — per-registration status */}
            {existingRegistrations.length > 0 && (
              <div className="space-y-2">
                {existingRegistrations.map(reg => {
                  const isPending = reg.status === 'pending';
                  const isConfirmed = reg.status === 'confirmed';
                  const isSubmitted = reg.paymentStatus === 'submitted';
                  const isVerified = reg.paymentStatus === 'verified' || reg.paymentStatus === 'completed';
                  return (
                    <div
                      key={reg.id}
                      className="flex items-start gap-2.5 px-4 py-3 rounded-xl"
                      style={
                        isConfirmed
                          ? { background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)' }
                          : { background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.3)' }
                      }
                    >
                      {isConfirmed
                        ? <CheckCircleIcon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#F59E0B' }} />
                        : <ClockIcon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#fbbf24' }} />
                      }
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold" style={{ color: isConfirmed ? '#F59E0B' : '#fbbf24' }}>
                          {reg.category.name}:{' '}
                          {isConfirmed
                            ? 'Registration confirmed ✓'
                            : isSubmitted
                              ? 'Payment submitted — awaiting admin verification'
                              : 'Registration pending'}
                        </p>
                        {isPending && !isVerified && (
                          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                            Your registration was received. Check My Registrations for status.
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => navigate('/registrations')}
                        className="flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-lg"
                        style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.12)' }}
                      >
                        View
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Category selector */}
            <div className="rounded-2xl p-4" style={{ background: BRAND.card, border: `1px solid ${BRAND.cardBorder}` }}>
              <CategorySelector
                categories={categories}
                selectedCategories={selectedCategories}
                onSelectionChange={setSelectedCategories}
                alreadyRegisteredCategories={alreadyRegisteredCategories}
              />
            </div>

            {/* Partner details for doubles */}
            {selectedDoublesCategories.length > 0 && (
              <div className="rounded-2xl p-4" style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.18)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <UserGroupIcon className="h-5 w-5" style={{ color: BRAND.green }} />
                  <h3 className="text-sm font-black text-white">Partner Details</h3>
                </div>
                <div className="space-y-5">
                  {selectedDoublesCategories.map(catId => {
                    const category = categories.find(c => c.id === catId);
                    const partner = partnerInfo[catId];
                    const isSearching = searchingPartner[catId];
                    const code = partnerCodes[catId] || '#';
                    const canSearch = /^#\d+$/.test(code) || /^#[A-Z]\d{5}$/i.test(code);
                    const mode = partnerMode[catId] || 'id';
                    const guestName = partnerNames[catId] || '';
                    return (
                      <div key={catId} className="space-y-2">
                        <label className="block text-xs font-bold" style={{ color: BRAND.green }}>
                          Partner for <span className="text-white">{category?.name}</span>
                          <span style={{ color: '#f87171' }}> *</span>
                        </label>

                        {/* Mode toggle */}
                        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setPartnerMode(m => ({ ...m, [catId]: 'id' }));
                              setPartnerNames(n => ({ ...n, [catId]: '' }));
                            }}
                            className="flex-1 py-2 rounded-lg text-xs font-black transition-all"
                            style={mode === 'id'
                              ? { background: BRAND.green, color: '#050810' }
                              : { background: 'transparent', color: 'rgba(255,255,255,0.45)' }}
                          >
                            Matchify.pro ID
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPartnerMode(m => ({ ...m, [catId]: 'name' }));
                              setPartnerCodes(p => ({ ...p, [catId]: '#' }));
                              setPartnerInfo(p => ({ ...p, [catId]: null }));
                            }}
                            className="flex-1 py-2 rounded-lg text-xs font-black transition-all"
                            style={mode === 'name'
                              ? { background: 'rgba(168,85,247,0.85)', color: '#fff' }
                              : { background: 'transparent', color: 'rgba(255,255,255,0.45)' }}
                          >
                            Name Only
                          </button>
                        </div>

                        {mode === 'id' ? (
                          <>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={code}
                                onChange={e => handlePartnerCodeChange(catId, e.target.value)}
                                placeholder="#1"
                                className="flex-1 px-3 py-3 rounded-xl text-white font-mono text-sm"
                                style={{ background: 'rgba(0,0,0,0.3)', border: '1.5px solid rgba(245,158,11,0.25)', outline: 'none' }}
                              />
                              <button
                                type="button"
                                onClick={() => fetchPartnerByCode(catId, code)}
                                disabled={!canSearch || isSearching}
                                className="px-4 py-3 rounded-xl font-black text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                                style={canSearch && !isSearching
                                  ? { background: BRAND.green, color: '#050810' }
                                  : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}
                              >
                                {isSearching
                                  ? <Spinner size="sm" />
                                  : <Search className="w-4 h-4" />}
                                {!isSearching && 'Find'}
                              </button>
                            </div>
                            {partner && (
                              <div className="flex items-center gap-3 p-3 rounded-xl"
                                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
                                {partner.profilePhoto ? (
                                  <img src={partner.profilePhoto} alt={partner.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                                ) : (
                                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0"
                                    style={{ background: BRAND.green, color: '#050810' }}>
                                    {partner.name?.charAt(0)?.toUpperCase()}
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-white font-bold text-sm truncate">{partner.name}</p>
                                  <p className="text-xs font-mono truncate" style={{ color: BRAND.green }}>
                                    {partner.matchifyCode || partner.email}
                                  </p>
                                  {partner.city && partner.state && (
                                    <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                      {partner.city}, {partner.state}
                                    </p>
                                  )}
                                </div>
                                <CheckCircleIcon className="w-5 h-5 flex-shrink-0" style={{ color: BRAND.green }} />
                              </div>
                            )}
                            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                              Partner gets a confirmation once you register.
                            </p>
                          </>
                        ) : (
                          <>
                            <input
                              type="text"
                              value={guestName}
                              onChange={e => setPartnerNames(n => ({ ...n, [catId]: e.target.value }))}
                              placeholder="Partner's full name"
                              className="w-full px-3 py-3 rounded-xl text-white text-sm"
                              style={{ background: 'rgba(0,0,0,0.3)', border: '1.5px solid rgba(168,85,247,0.4)', outline: 'none' }}
                            />
                            {guestName.trim().length >= 2 && (
                              <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                                style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)' }}>
                                <CheckCircleIcon className="w-4 h-4 flex-shrink-0" style={{ color: '#a855f7' }} />
                                <p className="text-xs font-bold" style={{ color: '#a855f7' }}>
                                  "{guestName.trim()}" will appear in draws
                                </p>
                              </div>
                            )}
                            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                              Use this if your partner is not on Matchify.pro. Their name appears in draws as entered.
                            </p>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Fee breakdown */}
            {selectedCategories.length > 0 && (
              <div className="rounded-2xl overflow-hidden" style={{ background: BRAND.card, border: `1px solid ${BRAND.cardBorder}` }}>
                <div className="px-4 py-3" style={{ borderBottom: `1px solid ${BRAND.cardBorder}`, background: 'rgba(168,85,247,0.05)' }}>
                  <p className="text-xs font-black uppercase tracking-widest" style={{ color: 'rgba(168,85,247,0.8)' }}>Fee Summary</p>
                </div>
                <div className="p-4 space-y-2">
                  {selectedCategories.map(catId => {
                    const cat = categories.find(c => c.id === catId);
                    return cat ? (
                      <div key={catId} className="flex justify-between text-sm">
                        <span style={{ color: 'rgba(255,255,255,0.55)' }}>{cat.name}</span>
                        <span className="font-bold text-white">₹{cat.entryFee}</span>
                      </div>
                    ) : null;
                  })}
                  <div className="flex justify-between items-center pt-3 mt-1"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <span className="text-sm font-black text-white">Total</span>
                    <span className="text-2xl font-black" style={{ color: BRAND.purple }}>₹{total}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Proceed button */}
            {(() => {
              const allAlreadyRegistered = selectedCategories.length > 0 &&
                selectedCategories.every(catId => alreadyRegisteredCategories.includes(catId));
              const canProceed = selectedCategories.length > 0 && !allAlreadyRegistered;
              return (
                <button
                  onClick={handleProceedToPayment}
                  disabled={!canProceed}
                  className="w-full py-4 rounded-2xl font-black text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: canProceed ? 'linear-gradient(135deg,#7c3aed,#a855f7)' : 'rgba(255,255,255,0.08)',
                    color: canProceed ? '#fff' : 'rgba(255,255,255,0.4)',
                    boxShadow: canProceed ? '0 4px 20px rgba(168,85,247,0.4)' : 'none',
                  }}
                >
                  {allAlreadyRegistered ? 'Already Registered' : 'Continue to Payment →'}
                </button>
              );
            })()}
          </>
        )}

        {/* ════════════════════════════════════════════════════════════════
            STEP 2 — Payment
        ════════════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <>
            {/* ── Amount Header ─────────────────────────────────────────── */}
            <div className="rounded-2xl p-5 text-center"
              style={{
                background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.07))',
                border: '1px solid rgba(245,158,11,0.2)',
              }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-2"
                style={{ color: 'rgba(255,255,255,0.45)' }}>Pay to complete registration</p>
              <p className="text-6xl font-black" style={{ color: BRAND.green }}>₹{total}</p>
              <p className="text-sm font-bold mt-2 text-white">{tournament?.name}</p>
              <div className="flex justify-center gap-3 mt-2 flex-wrap">
                {selectedCategories.map(catId => {
                  const cat = categories.find(c => c.id === catId);
                  return cat ? (
                    <span key={catId} className="text-xs px-2 py-1 rounded-lg"
                      style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
                      {cat.name} · ₹{cat.entryFee}
                    </span>
                  ) : null;
                })}
              </div>
            </div>

            {/* ── Pay Using ─────────────────────────────────────────────── */}
            {!upiId && !qrUrl ? (
              <div className="rounded-2xl p-6 text-center"
                style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <p className="text-sm font-semibold" style={{ color: '#f87171' }}>
                  Payment details not configured. Contact support.
                </p>
              </div>
            ) : (
              <>
                {/* ── UPI ID + Amount + App Buttons ─────────────────────── */}
                <div className="rounded-2xl overflow-hidden"
                  style={{ background: BRAND.card, border: `1px solid ${BRAND.cardBorder}` }}>
                  <div className="px-4 py-3 flex items-center gap-2"
                    style={{ borderBottom: `1px solid ${BRAND.cardBorder}`, background: 'rgba(245,158,11,0.04)' }}>
                    <QrCode className="w-4 h-4" style={{ color: BRAND.cyan }} />
                    <p className="text-sm font-black text-white">Pay via UPI</p>
                  </div>
                  <div className="p-4 space-y-3">

                    {/* UPI ID copy field */}
                    {upiId && (
                      <CopyField label="UPI ID (paste in any UPI app)" value={upiId} mono highlight />
                    )}

                    {/* Amount copy field */}
                    <CopyField label="Amount to send" value={`₹${total}`} highlight />

                    {/* Account name */}
                    {accountHolder && (
                      <div className="px-4 py-2.5 rounded-xl"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Pay to</p>
                        <p className="text-sm font-bold text-white">{accountHolder}</p>
                      </div>
                    )}

                  </div>
                </div>

                {/* ── QR Code ───────────────────────────────────────────── */}
                {qrUrl && (
                  <div className="rounded-2xl p-4"
                    style={{ background: BRAND.card, border: `1px solid ${BRAND.cardBorder}` }}>
                    <p className="text-xs font-bold uppercase tracking-widest mb-3 text-center"
                      style={{ color: 'rgba(255,255,255,0.4)' }}>Or scan QR code</p>
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-3 bg-white rounded-2xl shadow-lg">
                        <img
                          src={qrUrl}
                          alt="Payment QR Code"
                          className="w-52 h-52 object-contain rounded-xl"
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                      </div>
                      <button
                        onClick={() => downloadQR(qrUrl)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
                        style={{
                          background: 'rgba(245,158,11,0.10)',
                          border: '1px solid rgba(245,158,11,0.30)',
                          color: '#F59E0B',
                        }}
                      >
                        ⬇️ Download QR Code
                      </button>
                    </div>
                  </div>
                )}

                {/* ── How to Pay ────────────────────────────────────────── */}
                <div className="rounded-2xl p-4"
                  style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.18)' }}>
                  <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: BRAND.purple }}>
                    How to pay
                  </p>
                  {[
                    `Open any UPI app (GPay, PhonePe, Paytm, BHIM, etc.)`,
                    `Go to Send Money → paste the UPI ID above`,
                    `Enter exactly ₹${total} and send`,
                    `On the payment success screen, note the UTR / Transaction ID (12-digit number)`,
                    `Take a screenshot of the success screen`,
                    `Enter the UTR / Transaction ID OR upload a screenshot (or both — at least one is required)`,
                    `Admin verifies and confirms your registration`,
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-3 mt-2.5">
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5"
                        style={{ background: BRAND.purple, color: '#fff' }}
                      >
                        {i + 1}
                      </span>
                      <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>{step}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── UTR Input ─────────────────────────────────────────────── */}
            <div className="rounded-2xl p-4"
              style={{ background: BRAND.card, border: `1px solid ${BRAND.cardBorder}` }}>
              <label className="block text-sm font-black text-white mb-1">
                UTR / Transaction ID
              </label>
              <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Find this in your UPI app after payment — it's the 12-digit number on the success screen or in SMS
              </p>
              <input
                type="text"
                inputMode="numeric"
                value={utrId}
                onChange={e => setUtrId(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())}
                placeholder="e.g. 123456789012"
                maxLength={25}
                className="w-full px-4 py-3 rounded-xl text-white font-mono text-sm"
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: utrId.trim() ? '1.5px solid rgba(245,158,11,0.4)' : '1.5px solid rgba(255,255,255,0.15)',
                  outline: 'none',
                }}
              />
            </div>

            {/* ── OR divider ────────────────────────────────────────────── */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
              <span className="text-xs font-black px-3 py-1 rounded-full"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
                OR BOTH — AT LEAST ONE REQUIRED
              </span>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
            </div>

            {/* ── Screenshot Upload ─────────────────────────────────────── */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background: BRAND.card, border: `1px solid ${BRAND.cardBorder}` }}>
              <div className="px-4 py-3 flex items-center gap-3"
                style={{ borderBottom: `1px solid ${BRAND.cardBorder}`, background: 'rgba(245,158,11,0.04)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}>
                  <Upload className="w-4 h-4" style={{ color: BRAND.green }} />
                </div>
                <div>
                  <p className="text-sm font-black text-white">Upload Payment Screenshot</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    {paymentScreenshot ? 'Screenshot ready' : 'Optional if UTR / Transaction ID provided'}
                  </p>
                </div>
              </div>
              <div className="p-4">
                {!paymentPreview ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all"
                    style={{ borderColor: 'rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.02)' }}
                    onTouchStart={e => e.currentTarget.style.background = 'rgba(245,158,11,0.05)'}
                    onTouchEnd={e => e.currentTarget.style.background = 'rgba(245,158,11,0.02)'}
                  >
                    <CameraIcon className="w-12 h-12 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.3)' }} />
                    <p className="text-sm font-bold text-white mb-1">Tap to upload screenshot</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>JPG, PNG · max 5MB</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleScreenshotSelect}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <img src={paymentPreview} alt="Payment Screenshot" className="w-full rounded-xl" />
                    <button
                      onClick={removeScreenshot}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(239,68,68,0.9)' }}
                    >
                      <XMarkIcon className="w-4 h-4 text-white" />
                    </button>
                    <div className="mt-3 flex items-center gap-2 px-1">
                      <CheckCircleIcon className="w-4 h-4" style={{ color: BRAND.green }} />
                      <span className="text-sm font-bold" style={{ color: BRAND.green }}>Screenshot ready</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Submit Buttons ────────────────────────────────────────── */}
            <div className="flex gap-3">
              <button
                onClick={() => { setStep(1); setError(''); }}
                className="px-5 py-4 rounded-2xl font-bold text-sm"
                style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                ← Back
              </button>
              <button
                onClick={handleRegister}
                disabled={submitting || (!paymentScreenshot && !utrId.trim())}
                className="flex-1 py-4 rounded-2xl font-black text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{
                  background: (paymentScreenshot || utrId.trim()) ? 'linear-gradient(135deg,#F59E0B,#F59E0B)' : 'rgba(255,255,255,0.08)',
                  color: (paymentScreenshot || utrId.trim()) ? '#050810' : 'rgba(255,255,255,0.4)',
                  boxShadow: (paymentScreenshot || utrId.trim()) ? '0 4px 20px rgba(245,158,11,0.4)' : 'none',
                }}
              >
                {submitting ? (
                  <><Spinner size="sm" /> Submitting…</>
                ) : (
                  <><CheckCircleIcon className="w-4 h-4" /> Complete Registration</>
                )}
              </button>
            </div>
          </>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          Success Modal
      ════════════════════════════════════════════════════════════════════ */}
      {showSuccessModal && (
        <div className="fixed inset-0 flex items-end justify-center z-50 p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-sm rounded-3xl overflow-hidden"
            style={{ background: '#0d0d2b', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="pt-8 pb-5 px-6 text-center"
              style={{ background: 'linear-gradient(180deg,rgba(245,158,11,0.12) 0%,transparent 100%)' }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'linear-gradient(135deg,#F59E0B,#F59E0B)', boxShadow: '0 0 30px rgba(245,158,11,0.5)' }}>
                <CheckCircleIcon className="w-9 h-9 text-white" />
              </div>
              <h2 className="text-xl font-black text-white mb-1">Registration Submitted!</h2>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>{tournament?.name}</p>
            </div>
            <div className="px-5 pb-6 space-y-3">
              <div className="rounded-xl p-4"
                style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.2)' }}>
                <div className="flex items-center gap-3 mb-2">
                  <ClockIcon className="w-5 h-5 flex-shrink-0" style={{ color: '#fbbf24' }} />
                  <p className="font-black text-sm" style={{ color: '#fbbf24' }}>Pending Verification</p>
                </div>
                <div className="space-y-1 text-xs" style={{ color: 'rgba(251,191,36,0.8)' }}>
                  <p>✓ Payment screenshot uploaded</p>
                  <p>✓ Registration details saved</p>
                  <p>⏳ Awaiting admin approval</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/registrations')}
                className="w-full py-4 rounded-2xl font-black text-sm"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff', boxShadow: '0 4px 20px rgba(168,85,247,0.4)' }}
              >
                View My Registrations
              </button>
              <button
                onClick={() => navigate('/tournaments')}
                className="w-full py-3 rounded-2xl font-bold text-sm"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                Browse More Tournaments
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


