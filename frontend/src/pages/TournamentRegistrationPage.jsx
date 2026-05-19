import { getErrorMessage } from '../utils/errorMessage';
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { tournamentAPI } from '../api/tournament';
import { registrationAPI } from '../api/registration';
import { getPublicPaymentSettings } from '../api/payment';
import CategorySelector from '../components/registration/CategorySelector';
import PaymentSummary from '../components/registration/PaymentSummary';
import { ArrowLeftIcon, UserGroupIcon, CameraIcon, CheckCircleIcon, XMarkIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Loader, Upload, QrCode, AlertCircle, Search } from 'lucide-react';

const BRAND = {
  bg: '#07071a',
  green: '#00ff88',
  cyan: '#00d4ff',
  purple: '#a855f7',
  card: 'rgba(255,255,255,0.04)',
  cardBorder: 'rgba(255,255,255,0.08)',
};

export default function TournamentRegistrationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [tournament, setTournament] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [partnerCodes, setPartnerCodes] = useState({});
  const [partnerInfo, setPartnerInfo] = useState({});
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [paymentPreview, setPaymentPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [alreadyRegisteredCategories, setAlreadyRegisteredCategories] = useState([]);
  const [adminPaymentSettings, setAdminPaymentSettings] = useState(null);
  const [isRegistrationClosed, setIsRegistrationClosed] = useState(false);
  const [searchingPartner, setSearchingPartner] = useState({});

  useEffect(() => {
    fetchTournamentData();
    fetchAdminPaymentSettings();
  }, [id]);

  useEffect(() => {
    if (tournament) {
      const now = new Date();
      const closeDate = new Date(tournament.registrationCloseDate);
      setIsRegistrationClosed(now > closeDate);
    }
  }, [tournament]);

  const getAlreadyRegisteredCategoryNames = () => {
    if (alreadyRegisteredCategories.length === 0) return null;
    return alreadyRegisteredCategories
      .map(catId => categories.find(c => c.id === catId)?.name)
      .filter(Boolean)
      .join(', ');
  };

  const fetchAdminPaymentSettings = async () => {
    try {
      const response = await getPublicPaymentSettings();
      setAdminPaymentSettings(response.data);
    } catch (error) {
      console.error('Error fetching admin payment settings:', error);
    }
  };

  const fetchTournamentData = async () => {
    try {
      setLoading(true);
      const [tournamentData, categoriesData, myRegistrations] = await Promise.all([
        tournamentAPI.getTournament(id),
        tournamentAPI.getCategories(id),
        registrationAPI.getMyRegistrations(),
      ]);
      setTournament(tournamentData.data);
      setCategories(categoriesData.categories || []);
      const registeredCategoryIds = (myRegistrations.registrations || [])
        .filter(reg =>
          reg.tournament.id === id &&
          reg.status !== 'cancelled' &&
          reg.status !== 'rejected'
        )
        .map(reg => reg.category.id);
      setAlreadyRegisteredCategories(registeredCategoryIds);
    } catch (err) {
      console.error('Error fetching tournament:', err);
      setError('Failed to load tournament details');
    } finally {
      setLoading(false);
    }
  };

  const handleScreenshotSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, etc.)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }
    setPaymentScreenshot(file);
    setPaymentPreview(URL.createObjectURL(file));
    setError('');
  };

  const removeScreenshot = () => {
    if (paymentPreview) URL.revokeObjectURL(paymentPreview);
    setPaymentScreenshot(null);
    setPaymentPreview(null);
  };

  const handleProceedToPayment = () => {
    setError('');
    if (selectedCategories.length === 0) {
      setError('Please select at least one category');
      return;
    }
    const doublesCategories = selectedCategories.filter(catId => {
      const cat = categories.find(c => c.id === catId);
      return cat?.format === 'doubles';
    });
    for (const catId of doublesCategories) {
      const code = partnerCodes[catId];
      if (!code) {
        const cat = categories.find(c => c.id === catId);
        setError(`Partner Matchify.pro ID required for ${cat?.name}`);
        return;
      }
      if (!/^#\d+$/.test(code) && !/^#[A-Z]\d{5}$/i.test(code)) {
        const cat = categories.find(c => c.id === catId);
        setError(`Invalid Matchify.pro ID for ${cat?.name} — format: #1, #12, #100`);
        return;
      }
      if (!partnerInfo[catId]) {
        const cat = categories.find(c => c.id === catId);
        setError(`Search and verify partner ID for ${cat?.name}`);
        return;
      }
    }
    setStep(2);
  };

  const handleRegister = async () => {
    try {
      setError('');
      if (!paymentScreenshot) {
        setError('Upload your payment screenshot to continue');
        return;
      }
      setSubmitting(true);
      const formData = new FormData();
      formData.append('tournamentId', id);
      formData.append('categoryIds', JSON.stringify(selectedCategories));
      const partnerEmails = {};
      Object.keys(partnerInfo).forEach(catId => {
        if (partnerInfo[catId]) partnerEmails[catId] = partnerInfo[catId].email;
      });
      formData.append('partnerEmails', JSON.stringify(partnerEmails));
      formData.append('paymentScreenshot', paymentScreenshot);
      await registrationAPI.createRegistrationWithScreenshot(formData);
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Registration error:', err);
      setError(getErrorMessage(err, 'Registration failed. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePartnerCodeChange = (categoryId, code) => {
    // Allow only digits after #
    let val = code.replace(/[^#\d]/g, '');
    if (!val.startsWith('#')) val = '#' + val.replace(/#/g, '');
    setPartnerCodes(prev => ({ ...prev, [categoryId]: val }));
    setPartnerInfo(prev => ({ ...prev, [categoryId]: null }));
  };

  const fetchPartnerByCode = async (categoryId, code) => {
    try {
      setError('');
      const isNewFmt = /^#\d+$/.test(code);
      const isOldFmt = /^#[A-Z]\d{5}$/i.test(code);
      if (!isNewFmt && !isOldFmt) {
        setError('Enter a valid Matchify.pro ID like #1, #12, #100');
        return;
      }
      setSearchingPartner(prev => ({ ...prev, [categoryId]: true }));
      const response = await registrationAPI.getPartnerByCode(code);
      if (response.success && response.user) {
        setPartnerInfo(prev => ({ ...prev, [categoryId]: response.user }));
      } else {
        setError('No player found with this Matchify.pro ID');
        setPartnerInfo(prev => ({ ...prev, [categoryId]: null }));
      }
    } catch (err) {
      console.error('Error fetching partner:', err);
      setError(getErrorMessage(err, 'Player not found'));
      setPartnerInfo(prev => ({ ...prev, [categoryId]: null }));
    } finally {
      setSearchingPartner(prev => ({ ...prev, [categoryId]: false }));
    }
  };

  const calculateTotal = () =>
    selectedCategories.reduce((total, catId) => {
      const cat = categories.find(c => c.id === catId);
      return total + (cat?.entryFee || 0);
    }, 0);

  const selectedDoublesCategories = selectedCategories.filter(catId => {
    const cat = categories.find(c => c.id === catId);
    return cat?.format === 'doubles';
  });

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BRAND.bg }}>
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-t-transparent mx-auto animate-spin"
            style={{ borderColor: `${BRAND.green} transparent transparent transparent` }} />
          <p className="mt-4 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>Loading…</p>
        </div>
      </div>
    );
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

  // ── Registration Closed ──────────────────────────────────────────────────
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
              Deadline was{' '}
              {new Date(tournament.registrationCloseDate).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric'
              })}
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

  // ── Main ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-10" style={{ background: BRAND.bg }}>
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <button onClick={() => navigate(`/tournaments/${id}`)} className="flex items-center gap-1.5 mb-5 text-sm font-bold"
          style={{ color: 'rgba(255,255,255,0.5)' }}>
          <ArrowLeftIcon className="h-4 w-4" /> Back
        </button>
        <h1 className="text-xl font-black text-white leading-tight">{tournament.name}</h1>
        <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
          📍 {tournament.city}, {tournament.state} &nbsp;·&nbsp; 📅 {new Date(tournament.startDate).toLocaleDateString('en-IN')}
        </p>
      </div>

      {/* Step Indicator */}
      <div className="px-4 mb-5">
        <div className="flex items-center gap-2">
          {/* Step 1 */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
              style={{
                background: step >= 1 ? (step > 1 ? BRAND.green : BRAND.purple) : 'rgba(255,255,255,0.1)',
                color: step >= 1 ? '#07071a' : 'rgba(255,255,255,0.4)',
              }}>
              {step > 1 ? '✓' : '1'}
            </div>
            <span className="text-xs font-bold" style={{ color: step >= 1 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)' }}>
              Categories
            </span>
          </div>
          {/* Connector */}
          <div className="flex-1 h-0.5 rounded-full mx-1" style={{ background: step >= 2 ? BRAND.green : 'rgba(255,255,255,0.1)' }} />
          {/* Step 2 */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
              style={{
                background: step >= 2 ? BRAND.purple : 'rgba(255,255,255,0.1)',
                color: step >= 2 ? '#07071a' : 'rgba(255,255,255,0.4)',
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
        {/* Already Registered Notice */}
        {alreadyRegisteredCategories.length > 0 && getAlreadyRegisteredCategoryNames() && (
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#f87171' }} />
            <p className="text-xs font-semibold" style={{ color: '#f87171' }}>
              Already registered for: {getAlreadyRegisteredCategoryNames()}
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#f87171' }} />
            <p className="text-xs font-semibold" style={{ color: '#f87171' }}>{error}</p>
          </div>
        )}

        {/* ── STEP 1 ─────────────────────────────────────────────────────── */}
        {step === 1 && (
          <>
            {/* Category Selector */}
            <div className="rounded-2xl p-4" style={{ background: BRAND.card, border: `1px solid ${BRAND.cardBorder}` }}>
              <CategorySelector
                categories={categories}
                selectedCategories={selectedCategories}
                onSelectionChange={setSelectedCategories}
                alreadyRegisteredCategories={alreadyRegisteredCategories}
              />
            </div>

            {/* Partner Details */}
            {selectedDoublesCategories.length > 0 && (
              <div className="rounded-2xl p-4" style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.18)' }}>
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
                    // Valid to search when # + at least 1 digit
                    const canSearch = /^#\d+$/.test(code) || /^#[A-Z]\d{5}$/i.test(code);
                    return (
                      <div key={catId} className="space-y-2">
                        <label className="block text-xs font-bold" style={{ color: BRAND.green }}>
                          Partner ID for <span className="text-white">{category?.name}</span>
                          <span style={{ color: '#f87171' }}> *</span>
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={code}
                            onChange={e => handlePartnerCodeChange(catId, e.target.value)}
                            placeholder="#1"
                            className="flex-1 px-3 py-3 rounded-xl text-white font-mono text-sm"
                            style={{
                              background: 'rgba(0,0,0,0.3)',
                              border: '1.5px solid rgba(0,255,136,0.25)',
                              outline: 'none',
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => fetchPartnerByCode(catId, code)}
                            disabled={!canSearch || isSearching}
                            className="px-4 py-3 rounded-xl font-black text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                            style={canSearch && !isSearching
                              ? { background: 'linear-gradient(135deg,#00ff88,#00ff88)', color: '#07071a' }
                              : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}
                          >
                            {isSearching
                              ? <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#07071a transparent transparent transparent' }} />
                              : <Search className="w-4 h-4" />}
                            {isSearching ? '' : 'Search'}
                          </button>
                        </div>

                        {/* Partner found */}
                        {partner && (
                          <div className="flex items-center gap-3 p-3 rounded-xl"
                            style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.25)' }}>
                            {partner.profilePhoto ? (
                              <img src={partner.profilePhoto} alt={partner.name}
                                className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0"
                                style={{ background: 'linear-gradient(135deg,#00ff88,#00ff88)', color: '#07071a' }}>
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
                          Partner receives a confirmation once you register.
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Payment Summary */}
            {selectedCategories.length > 0 && (
              <PaymentSummary
                selectedCategories={selectedCategories}
                categories={categories}
                tournament={tournament}
              />
            )}

            {/* Proceed Button */}
            <button
              onClick={handleProceedToPayment}
              disabled={selectedCategories.length === 0}
              className="w-full py-4 rounded-2xl font-black text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: selectedCategories.length > 0
                  ? 'linear-gradient(135deg,#7c3aed,#a855f7)'
                  : 'rgba(255,255,255,0.08)',
                color: selectedCategories.length > 0 ? '#fff' : 'rgba(255,255,255,0.4)',
                boxShadow: selectedCategories.length > 0 ? '0 4px 20px rgba(168,85,247,0.4)' : 'none',
              }}
            >
              Continue to Payment →
            </button>
          </>
        )}

        {/* ── STEP 2 ─────────────────────────────────────────────────────── */}
        {step === 2 && (
          <>
            {/* QR & Payment Info */}
            <div className="rounded-2xl overflow-hidden" style={{ background: BRAND.card, border: `1px solid ${BRAND.cardBorder}` }}>
              <div className="px-4 py-3 flex items-center gap-3"
                style={{ borderBottom: `1px solid ${BRAND.cardBorder}`, background: 'rgba(0,212,255,0.05)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(0,212,255,0.15)', border: '1px solid rgba(0,212,255,0.3)' }}>
                  <QrCode className="w-4 h-4" style={{ color: BRAND.cyan }} />
                </div>
                <div>
                  <p className="text-sm font-black text-white">Pay via UPI</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Scan QR or use UPI ID</p>
                </div>
              </div>

              <div className="p-4">
                {!adminPaymentSettings?.qrCodeUrl && !adminPaymentSettings?.upiId ? (
                  <div className="rounded-xl p-6 text-center"
                    style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <p className="text-sm font-semibold" style={{ color: '#f87171' }}>Payment details not set up. Contact support.</p>
                  </div>
                ) : (
                  <>
                    {adminPaymentSettings?.qrCodeUrl && (
                      <div className="flex flex-col items-center mb-4 gap-2">
                        <div className="p-3 bg-white rounded-2xl shadow-lg">
                          <img
                            src={adminPaymentSettings.qrCodeUrl}
                            alt="Payment QR"
                            className="w-52 h-52 object-contain rounded-xl"
                            onError={e => { e.target.style.display = 'none'; }}
                          />
                        </div>
                        <a
                          href={adminPaymentSettings.qrCodeUrl}
                          download="matchify-payment-qr.png"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
                          style={{
                            background: 'rgba(0,255,136,0.10)',
                            border: '1px solid rgba(0,255,136,0.30)',
                            color: '#00ff88',
                            textDecoration: 'none',
                          }}
                        >
                          ⬇️ Download QR Code
                        </a>
                      </div>
                    )}

                    <div className="space-y-2 rounded-xl p-3"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="flex justify-between text-sm">
                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>UPI ID</span>
                        <span className="font-bold text-white">{adminPaymentSettings?.upiId || '—'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>Account</span>
                        <span className="font-bold text-white">{adminPaymentSettings?.accountHolder || '—'}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 mt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <span className="text-sm font-bold text-white">Amount</span>
                        <span className="text-2xl font-black" style={{ color: BRAND.cyan }}>₹{calculateTotal()}</span>
                      </div>
                    </div>

                    <div className="mt-3 px-3 py-2 rounded-xl text-xs font-semibold"
                      style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24' }}>
                      ⚠️ Pay exactly ₹{calculateTotal()} and screenshot the confirmation.
                    </div>

                    {/* UPI Deep Link Button */}
                    {adminPaymentSettings?.upiId && (() => {
                      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
                      const upiLink = `upi://pay?pa=${encodeURIComponent(adminPaymentSettings.upiId)}&pn=${encodeURIComponent(adminPaymentSettings.accountHolder || 'Matchify.pro')}&am=${calculateTotal()}&cu=INR&tn=${encodeURIComponent('Tournament Registration')}`;
                      return isIOS ? (
                        <div className="mt-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-center"
                          style={{ background: 'rgba(0,212,255,0.07)', border: '1px solid rgba(0,212,255,0.2)', color: 'rgba(0,212,255,0.8)' }}>
                          📱 On iPhone, scan the QR code above with your camera app
                        </div>
                      ) : (
                        <a
                          href={upiLink}
                          className="mt-3 flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-black transition-all active:scale-95"
                          style={{
                            background: 'linear-gradient(135deg, #00d4ff22, #7c3aed22)',
                            border: '1px solid rgba(0,212,255,0.35)',
                            color: '#fff',
                            textDecoration: 'none',
                          }}
                          onClick={() => {
                            // Small timeout so the app opens before any state changes
                            setTimeout(() => {}, 0);
                          }}
                        >
                          <span style={{ fontSize: '1.1rem' }}>📲</span>
                          Pay ₹{calculateTotal()} with UPI App
                        </a>
                      );
                    })()}
                  </>
                )}
              </div>
            </div>

            {/* Screenshot Upload */}
            <div className="rounded-2xl overflow-hidden" style={{ background: BRAND.card, border: `1px solid ${BRAND.cardBorder}` }}>
              <div className="px-4 py-3 flex items-center gap-3"
                style={{ borderBottom: `1px solid ${BRAND.cardBorder}`, background: 'rgba(0,255,136,0.04)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(0,255,136,0.15)', border: '1px solid rgba(0,255,136,0.3)' }}>
                  <Upload className="w-4 h-4" style={{ color: BRAND.green }} />
                </div>
                <div>
                  <p className="text-sm font-black text-white">Upload Screenshot</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Required for verification</p>
                </div>
              </div>

              <div className="p-4">
                {!paymentPreview ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all"
                    style={{ borderColor: 'rgba(0,255,136,0.2)', background: 'rgba(0,255,136,0.02)' }}
                  >
                    <CameraIcon className="w-12 h-12 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.3)' }} />
                    <p className="text-sm font-bold text-white mb-1">Tap to upload payment screenshot</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>PNG, JPG up to 5MB</p>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleScreenshotSelect} className="hidden" />
                  </div>
                ) : (
                  <div className="relative">
                    <img src={paymentPreview} alt="Payment Screenshot" className="w-full rounded-xl" />
                    <button onClick={removeScreenshot}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(239,68,68,0.9)' }}>
                      <XMarkIcon className="w-4 h-4 text-white" />
                    </button>
                    <div className="mt-3 flex items-center gap-2">
                      <CheckCircleIcon className="w-4 h-4" style={{ color: BRAND.green }} />
                      <span className="text-sm font-bold" style={{ color: BRAND.green }}>Screenshot uploaded</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* What's Next */}
            <div className="rounded-xl px-4 py-3"
              style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.18)' }}>
              <p className="text-xs font-black mb-2" style={{ color: BRAND.purple }}>What happens next?</p>
              {['Organizer reviews your payment screenshot', 'Registration confirmed once verified', 'Notification sent when approved'].map((t, i) => (
                <div key={i} className="flex items-start gap-2 mt-1.5">
                  <span className="text-xs font-black mt-0.5" style={{ color: BRAND.purple }}>{i + 1}.</span>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>{t}</p>
                </div>
              ))}
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => { setStep(1); setError(''); }}
                className="px-5 py-4 rounded-2xl font-bold text-sm"
                style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                Back
              </button>
              <button
                onClick={handleRegister}
                disabled={submitting || !paymentScreenshot || (!adminPaymentSettings?.qrCodeUrl && !adminPaymentSettings?.upiId)}
                className="flex-1 py-4 rounded-2xl font-black text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{
                  background: paymentScreenshot ? 'linear-gradient(135deg,#00ff88,#00ff88)' : 'rgba(255,255,255,0.08)',
                  color: paymentScreenshot ? '#07071a' : 'rgba(255,255,255,0.4)',
                  boxShadow: paymentScreenshot ? '0 4px 20px rgba(0,255,136,0.4)' : 'none',
                }}
              >
                {submitting ? (
                  <>
                    <Loader className="animate-spin h-4 w-4" />
                    Submitting…
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-4 h-4" />
                    Complete Registration
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── Success Modal ──────────────────────────────────────────────────── */}
      {showSuccessModal && (
        <div className="fixed inset-0 flex items-end justify-center z-50 p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-sm rounded-3xl overflow-hidden"
            style={{ background: '#0d0d2b', border: '1px solid rgba(255,255,255,0.1)' }}>
            {/* Green success header */}
            <div className="pt-8 pb-5 px-6 text-center"
              style={{ background: 'linear-gradient(180deg,rgba(0,255,136,0.12) 0%,transparent 100%)' }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'linear-gradient(135deg,#00ff88,#00ff88)', boxShadow: '0 0 30px rgba(0,255,136,0.5)' }}>
                <CheckCircleIcon className="w-9 h-9 text-white" />
              </div>
              <h2 className="text-xl font-black text-white mb-1">Registration Submitted!</h2>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
                {tournament?.name}
              </p>
            </div>

            <div className="px-5 pb-6 space-y-3">
              {/* Status */}
              <div className="rounded-xl p-4"
                style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.2)' }}>
                <div className="flex items-center gap-3 mb-2">
                  <ClockIcon className="w-5 h-5 flex-shrink-0" style={{ color: '#fbbf24' }} />
                  <p className="font-black text-sm" style={{ color: '#fbbf24' }}>Pending Verification</p>
                </div>
                <div className="space-y-1 text-xs" style={{ color: 'rgba(251,191,36,0.8)' }}>
                  <p>✓ Payment screenshot uploaded</p>
                  <p>✓ Registration details saved</p>
                  <p>⏳ Awaiting organizer approval</p>
                </div>
              </div>

              {/* Buttons */}
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
