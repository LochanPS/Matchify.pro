import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { tournamentAPI } from '../api/tournament';
import { registrationAPI } from '../api/registration';
import { getPublicPaymentSettings } from '../api/payment';
import { getImageUrl } from '../utils/imageUrl';
import CategorySelector from '../components/registration/CategorySelector';
import PaymentSummary from '../components/registration/PaymentSummary';
import { ArrowLeftIcon, UserGroupIcon, CameraIcon, CheckCircleIcon, XMarkIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Loader, Upload, QrCode, PartyPopper } from 'lucide-react';

export default function TournamentRegistrationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [tournament, setTournament] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [partnerCodes, setPartnerCodes] = useState({});
  const [partnerInfo, setPartnerInfo] = useState({}); // Store fetched partner information
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [paymentPreview, setPaymentPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: Select categories, 2: Payment
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [alreadyRegisteredCategories, setAlreadyRegisteredCategories] = useState([]);
  const [adminPaymentSettings, setAdminPaymentSettings] = useState(null);
  const [isRegistrationClosed, setIsRegistrationClosed] = useState(false);

  useEffect(() => {
    fetchTournamentData();
    fetchAdminPaymentSettings();
  }, [id]);

  // Check if registration is closed
  useEffect(() => {
    if (tournament) {
      const now = new Date();
      const closeDate = new Date(tournament.registrationCloseDate);
      setIsRegistrationClosed(now > closeDate);
    }
  }, [tournament]);

  // Display already registered categories as info (not error)
  const getAlreadyRegisteredCategoryNames = () => {
    if (alreadyRegisteredCategories.length === 0) return null;
    
    return alreadyRegisteredCategories
      .map(catId => {
        const cat = categories.find(c => c.id === catId);
        return cat?.name;
      })
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
      
      // Find categories user is already registered for in this tournament
      // Only block re-registration if status is PENDING or APPROVED/CONFIRMED
      // Allow re-registration if status is REJECTED or CANCELLED
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
    if (paymentPreview) {
      URL.revokeObjectURL(paymentPreview);
    }
    setPaymentScreenshot(null);
    setPaymentPreview(null);
  };

  const handleProceedToPayment = () => {
    setError('');

    if (selectedCategories.length === 0) {
      setError('Please select at least one category');
      return;
    }

    // Check if doubles categories have partner codes
    const doublesCategories = selectedCategories.filter(catId => {
      const cat = categories.find(c => c.id === catId);
      return cat?.format === 'doubles';
    });

    for (const catId of doublesCategories) {
      const code = partnerCodes[catId];
      if (!code) {
        const cat = categories.find(c => c.id === catId);
        setError(`Partner player code is required for ${cat?.name}`);
        return;
      }
      
      // Validate player code format: #ABC1234 (# + 3 letters + 4 numbers)
      if (!/^#[A-Z]{3}\d{4}$/i.test(code)) {
        const cat = categories.find(c => c.id === catId);
        setError(`Please enter a valid player code for ${cat?.name} (Format: #ABC1234)`);
        return;
      }

      // Check if partner info was fetched
      if (!partnerInfo[catId]) {
        const cat = categories.find(c => c.id === catId);
        setError(`Please verify the player code for ${cat?.name} by clicking the search button`);
        return;
      }
    }

    setStep(2);
  };

  const handleRegister = async () => {
    try {
      setError('');

      // Validate payment screenshot
      if (!paymentScreenshot) {
        setError('Please upload your payment screenshot. This is required for registration.');
        return;
      }

      setSubmitting(true);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('tournamentId', id);
      formData.append('categoryIds', JSON.stringify(selectedCategories));
      // Send partner emails extracted from partnerInfo
      const partnerEmails = {};
      Object.keys(partnerInfo).forEach(catId => {
        if (partnerInfo[catId]) {
          partnerEmails[catId] = partnerInfo[catId].email;
        }
      });
      formData.append('partnerEmails', JSON.stringify(partnerEmails));
      formData.append('paymentScreenshot', paymentScreenshot);

      const response = await registrationAPI.createRegistrationWithScreenshot(formData);

      // Show success modal instead of alert
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePartnerCodeChange = (categoryId, code) => {
    setPartnerCodes(prev => ({
      ...prev,
      [categoryId]: code.toUpperCase()
    }));
    // Clear partner info when code changes
    setPartnerInfo(prev => ({
      ...prev,
      [categoryId]: null
    }));
  };

  const fetchPartnerByCode = async (categoryId, code) => {
    try {
      setError('');
      
      // Validate format first
      if (!/^#[A-Z]{3}\d{4}$/i.test(code)) {
        setError('Invalid player code format. Use #ABC1234 (# + 3 letters + 4 numbers)');
        return;
      }

      // Fetch partner info from API
      const response = await registrationAPI.getPartnerByCode(code.toUpperCase());
      
      if (response.success && response.user) {
        setPartnerInfo(prev => ({
          ...prev,
          [categoryId]: response.user
        }));
      } else {
        setError('Player not found with this code');
        setPartnerInfo(prev => ({
          ...prev,
          [categoryId]: null
        }));
      }
    } catch (err) {
      console.error('Error fetching partner:', err);
      setError(err.response?.data?.error || 'Failed to find player with this code');
      setPartnerInfo(prev => ({
        ...prev,
        [categoryId]: null
      }));
    }
  };

  const calculateTotal = () => {
    return selectedCategories.reduce((total, catId) => {
      const cat = categories.find(c => c.id === catId);
      return total + (cat?.entryFee || 0);
    }, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 mt-4 font-medium">Loading tournament...</p>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Tournament Not Found</h2>
          <button
            onClick={() => navigate('/tournaments')}
            className="text-purple-600 hover:text-purple-700 font-medium"
          >
            Back to Tournaments
          </button>
        </div>
      </div>
    );
  }

  const selectedDoublesCategories = selectedCategories.filter(catId => {
    const cat = categories.find(c => c.id === catId);
    return cat?.format === 'doubles';
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Back to Tournament
          </button>
          
          <h1 className="text-3xl font-bold text-white mb-2">
            Register for Tournament
          </h1>
          <p className="text-lg text-gray-400">{tournament.name}</p>
          <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
            <span>📍 {tournament.city}, {tournament.state}</span>
            <span>📅 {new Date(tournament.startDate).toLocaleDateString('en-IN')}</span>
          </div>
        </div>

        {/* Registration Closed Warning */}
        {isRegistrationClosed ? (
          <div className="max-w-2xl mx-auto">
            <div className="bg-red-500/10 border-2 border-red-500/30 rounded-2xl p-8 text-center">
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <XMarkIcon className="w-10 h-10 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-red-400 mb-3">Registration Closed</h2>
              <p className="text-gray-300 mb-2">
                Registration for this tournament has ended.
              </p>
              <p className="text-gray-400 text-sm mb-6">
                Deadline was: {new Date(tournament.registrationCloseDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
              <button
                onClick={() => navigate(`/tournaments/${id}`)}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
              >
                Back to Tournament Details
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Step Indicator */}
            <div className="mb-8">
              <div className="flex items-center gap-4">
                <div className={`flex items-center gap-2 ${step >= 1 ? 'text-purple-400' : 'text-gray-500'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-purple-600 text-white' : 'bg-slate-700 text-gray-400'}`}>1</div>
                  <span className="font-medium">Select Categories</span>
                </div>
                <div className="flex-1 h-1 bg-slate-700 rounded">
                  <div className={`h-full bg-purple-600 rounded transition-all ${step >= 2 ? 'w-full' : 'w-0'}`}></div>
                </div>
                <div className={`flex items-center gap-2 ${step >= 2 ? 'text-purple-400' : 'text-gray-500'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-purple-600 text-white' : 'bg-slate-700 text-gray-400'}`}>2</div>
                  <span className="font-medium">Payment</span>
                </div>
              </div>
            </div>

            {/* Already Registered Categories Info */}
            {alreadyRegisteredCategories.length > 0 && getAlreadyRegisteredCategoryNames() && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <p className="text-sm text-red-400">
                  Already registered for {getAlreadyRegisteredCategoryNames()}
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {step === 1 ? (
          /* Step 1: Category Selection */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <CategorySelector
                  categories={categories}
                  selectedCategories={selectedCategories}
                  onSelectionChange={setSelectedCategories}
                  alreadyRegisteredCategories={alreadyRegisteredCategories}
                />
              </div>

              {/* Partner Player Code Inputs */}
              {selectedDoublesCategories.length > 0 && (
                <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <UserGroupIcon className="h-6 w-6 text-purple-400" />
                    <h3 className="text-lg font-semibold text-white">Partner Details</h3>
                  </div>
                  <div className="space-y-6">
                    {selectedDoublesCategories.map(catId => {
                      const category = categories.find(c => c.id === catId);
                      const partner = partnerInfo[catId];
                      return (
                        <div key={catId} className="space-y-3">
                          <label className="block text-sm font-medium text-gray-300">
                            Partner Player Code for <span className="text-purple-400">{category?.name}</span>
                            <span className="text-red-400"> *</span>
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={partnerCodes[catId] || ''}
                              onChange={(e) => handlePartnerCodeChange(catId, e.target.value)}
                              placeholder="#ABC1234"
                              maxLength={8}
                              className="flex-1 px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent uppercase font-mono"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => fetchPartnerByCode(catId, partnerCodes[catId])}
                              disabled={!partnerCodes[catId] || partnerCodes[catId].length !== 8}
                              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-xl transition-colors font-medium"
                            >
                              Search
                            </button>
                          </div>
                          
                          {/* Show partner info if found */}
                          {partner && (
                            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                              <div className="flex items-center gap-3">
                                {partner.profilePhoto ? (
                                  <img 
                                    src={partner.profilePhoto} 
                                    alt={partner.name}
                                    className="w-12 h-12 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                                    {partner.name?.charAt(0)?.toUpperCase()}
                                  </div>
                                )}
                                <div className="flex-1">
                                  <p className="text-white font-semibold">{partner.name}</p>
                                  <p className="text-gray-400 text-sm">{partner.email}</p>
                                  {partner.city && partner.state && (
                                    <p className="text-gray-500 text-xs">{partner.city}, {partner.state}</p>
                                  )}
                                </div>
                                <CheckCircleIcon className="w-6 h-6 text-green-400" />
                              </div>
                            </div>
                          )}
                          
                          <p className="text-xs text-gray-500">
                            Enter your partner's player code. They will receive a confirmation to accept the partnership.
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-6 space-y-6">
                <PaymentSummary
                  selectedCategories={selectedCategories}
                  categories={categories}
                  tournament={tournament}
                />

                <button
                  onClick={handleProceedToPayment}
                  disabled={selectedCategories.length === 0}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Proceed to Payment →
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Step 2: Payment */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: QR Code & Payment Info */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <QrCode className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Pay via UPI</h3>
                  <p className="text-gray-500 text-sm">Scan QR code or use UPI ID</p>
                </div>
              </div>

              {/* Check if admin payment details exist */}
              {!adminPaymentSettings?.qrCodeUrl && !adminPaymentSettings?.upiId ? (
                <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-xl text-center">
                  <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <XMarkIcon className="w-8 h-8 text-red-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-red-300 mb-2">Payment Details Not Available</h4>
                  <p className="text-sm text-red-400/80">
                    Admin payment details are not set up yet. Please contact support.
                  </p>
                </div>
              ) : (
                <>
                  {/* Admin's QR Code */}
                  {adminPaymentSettings?.qrCodeUrl && (
                    <div className="flex justify-center mb-6">
                      <div className="relative p-6 bg-white rounded-2xl shadow-2xl">
                        <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 rounded-2xl blur opacity-30"></div>
                        <div className="relative bg-white p-4 rounded-xl">
                          <img 
                            src={adminPaymentSettings.qrCodeUrl}
                            alt="Payment QR Code" 
                            className="w-64 h-64 object-contain"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="%23ddd"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999">QR Code</text></svg>';
                            }}
                          />
                        </div>
                        <p className="text-center text-gray-700 text-sm mt-3 font-medium">Scan to Pay</p>
                      </div>
                    </div>
                  )}

                  {/* Payment Details */}
                  <div className="space-y-4 p-4 bg-slate-700/50 border border-white/10 rounded-xl">
                    <div className="flex justify-between">
                      <span className="text-gray-400">UPI ID:</span>
                      <span className="font-semibold text-white">{adminPaymentSettings?.upiId || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Account Holder:</span>
                      <span className="font-semibold text-white">{adminPaymentSettings?.accountHolder || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between border-t border-white/10 pt-4">
                      <span className="text-gray-400 font-medium">Amount to Pay:</span>
                      <span className="font-bold text-2xl text-purple-400">₹{calculateTotal()}</span>
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                    <p className="text-sm text-amber-300">
                      <strong>Important:</strong> Please pay exactly ₹{calculateTotal()} and take a screenshot of the successful payment.
                    </p>
                  </div>

                  {/* Security Notice */}
                  <div className="mt-4 p-4 bg-teal-500/10 border border-teal-500/30 rounded-xl">
                    <p className="text-sm text-teal-300">
                      🔒 <strong>Secure Payment:</strong> All payments go to Matchify.pro. Admin will verify and pay organizer after verification.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Right: Screenshot Upload */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Upload Payment Screenshot</h3>
                  <p className="text-gray-500 text-sm">Required for verification</p>
                </div>
              </div>

              {!paymentPreview ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/20 rounded-2xl p-8 text-center cursor-pointer hover:border-purple-500/50 hover:bg-purple-500/5 transition-all"
                >
                  <CameraIcon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-300 font-medium mb-2">Click to upload payment screenshot</p>
                  <p className="text-sm text-gray-500">PNG, JPG up to 5MB</p>
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
                  <img 
                    src={paymentPreview} 
                    alt="Payment Screenshot" 
                    className="w-full rounded-xl border border-white/10"
                  />
                  <button
                    onClick={removeScreenshot}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                  <div className="mt-4 flex items-center gap-2 text-green-400">
                    <CheckCircleIcon className="w-5 h-5" />
                    <span className="font-medium">Screenshot uploaded</span>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleRegister}
                disabled={submitting || !paymentScreenshot || (!adminPaymentSettings?.qrCodeUrl && !adminPaymentSettings?.upiId)}
                className="w-full mt-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg hover:shadow-green-500/30 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader className="animate-spin h-5 w-5" />
                    Submitting Registration...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-5 h-5" />
                    Complete Registration
                  </>
                )}
              </button>

              {/* Info */}
              <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                <h4 className="text-sm font-semibold text-blue-300 mb-2">What happens next?</h4>
                <ul className="text-xs text-blue-400/80 space-y-1">
                  <li>• Your registration will be marked as "Pending Verification"</li>
                  <li>• The organizer will review your payment screenshot</li>
                  <li>• Once verified, your registration will be confirmed</li>
                  <li>• You'll receive a notification when approved</li>
                </ul>
              </div>
            </div>
          </div>
        )}
          </>
        )}
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-white/10 rounded-3xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in duration-300">
            {/* Success Icon */}
            <div className="text-center mb-6">
              <div className="relative inline-block">
                <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-500/30">
                  <CheckCircleIcon className="w-14 h-14 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                  <PartyPopper className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-white text-center mb-2">
              Registration Submitted! 🎉
            </h2>
            
            {/* Message */}
            <p className="text-gray-400 text-center mb-6">
              Your registration for <span className="font-semibold text-purple-400">{tournament?.name}</span> has been submitted successfully.
            </p>

            {/* Status Card with Halo Effect */}
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/30 via-orange-500/30 to-amber-500/30 blur-xl rounded-2xl"></div>
              <div className="relative bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                    <ClockIcon className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-amber-300">Pending Verification</h3>
                    <p className="text-sm text-amber-400/80">Awaiting organizer approval</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-amber-300/90">
                  <p>✓ Payment screenshot uploaded</p>
                  <p>✓ Registration details saved</p>
                  <p>⏳ Waiting for admin to verify payment</p>
                </div>
              </div>
            </div>

            {/* What's Next with Halo Effect */}
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-purple-500/20 blur-xl rounded-xl"></div>
              <div className="relative bg-slate-700/50 border border-white/10 rounded-xl p-4">
                <h4 className="font-semibold text-white mb-2">What happens next?</h4>
                <ul className="text-sm text-gray-300 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-0.5">1.</span>
                    <span>The organizer will review your payment screenshot</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-0.5">2.</span>
                    <span>Once verified, your registration will be confirmed</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-0.5">3.</span>
                    <span>You'll receive a notification when approved</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => navigate('/registrations')}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all font-semibold"
              >
                View My Registrations
              </button>
              <button
                onClick={() => navigate('/tournaments')}
                className="w-full py-3 border border-white/10 text-gray-300 rounded-xl hover:bg-slate-700/50 transition-all font-medium"
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
