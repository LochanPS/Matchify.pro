import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTournamentForm, deleteTournamentDraft } from '../hooks/useTournamentForm';
import { tournamentAPI } from '../api/tournament';
import api from '../utils/api';
import TournamentStepper from '../components/tournament/TournamentStepper';
import BasicInfoStep from '../components/tournament/steps/BasicInfoStep';
import DatesStep from '../components/tournament/steps/DatesStep';
import PostersStep from '../components/tournament/steps/PostersStep';
import CategoriesStep from '../components/tournament/steps/CategoriesStep';
import PaymentQRStep from '../components/tournament/steps/PaymentQRStep';
import ReviewStep from '../components/tournament/steps/ReviewStep';
import KYCBanner from '../components/KYCBanner';
import { Trophy, Save, X, AlertTriangle, CheckCircle, Sparkles, ArrowLeft, Shield } from 'lucide-react';

const CreateTournament = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const draftIdFromUrl = searchParams.get('draft');
  const { user } = useAuth();
  
  const {
    draftId,
    currentStep,
    completedSteps,
    formData,
    updateFormData,
    updateMultipleFields,
    nextStep,
    prevStep,
    goToStep,
    markStepComplete,
    saveDraft,
    clearDraft,
  } = useTournamentForm(draftIdFromUrl);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const [kycStatus, setKycStatus] = useState(null);
  const [kycLoading, setKycLoading] = useState(true);
  const [showKYCBlockModal, setShowKYCBlockModal] = useState(false);

  const hasFormData = formData.name || formData.description || formData.venue || formData.city;

  // Check KYC status
  const kycStatus = user?.organizerProfile?.kycStatus;
  const isKYCApproved = kycStatus === 'APPROVED';

  useEffect(() => {
    checkKYCStatus();
  }, []);

  const checkKYCStatus = async () => {
    try {
      const response = await api.get('/kyc/status');
      setKycStatus(response.data.status);
      
      // If KYC is not approved, show blocking modal
      if (response.data.status !== 'APPROVED') {
        setShowKYCBlockModal(true);
      }
    } catch (error) {
      console.error('KYC status check failed:', error);
      setKycStatus(null);
      // If KYC check fails, assume not approved and show modal
      setShowKYCBlockModal(true);
    } finally {
      setKycLoading(false);
    }
  };

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasFormData) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasFormData]);

  const handleStepComplete = (step) => {
    markStepComplete(step);
    nextStep();
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const tournamentData = {
        name: formData.name,
        description: formData.description,
        venue: formData.venue,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        zone: formData.zone,
        country: formData.country,
        format: formData.format,
        privacy: formData.privacy,
        shuttleType: formData.shuttleType || null,
        shuttleBrand: formData.shuttleBrand || null,
        registrationOpenDate: formData.registrationOpenDate,
        registrationCloseDate: formData.registrationCloseDate,
        startDate: formData.startDate,
        endDate: formData.endDate,
      };

      const createResponse = await tournamentAPI.createTournament(tournamentData);
      const tournamentId = createResponse.tournament.id;

      if (formData.posters.length > 0) {
        const posterFiles = formData.posters.filter(p => p.file).map(p => p.file);
        if (posterFiles.length > 0) {
          await tournamentAPI.uploadPosters(tournamentId, posterFiles);
        }
      }

      if (formData.categories && formData.categories.length > 0) {
        for (const category of formData.categories) {
          await tournamentAPI.createCategory(tournamentId, {
            name: category.name,
            format: category.format,
            gender: category.gender,
            ageGroup: category.ageGroup || null,
            entryFee: parseFloat(category.entryFee),
            maxParticipants: category.maxParticipants ? parseInt(category.maxParticipants) : null,
            scoringFormat: category.scoringFormat,
            prizeWinner: category.prizeWinner || null,
            prizeRunnerUp: category.prizeRunnerUp || null,
            prizeSemiFinalist: category.prizeSemiFinalist || null,
            prizeDescription: category.prizeDescription || null,
          });
        }
      }

      if (formData.paymentQR?.file) {
        await tournamentAPI.uploadPaymentQR(
          tournamentId,
          formData.paymentQR.file,
          formData.upiId,
          formData.accountHolderName
        );
      } else if (formData.upiId || formData.accountHolderName) {
        await tournamentAPI.updatePaymentInfo(tournamentId, {
          upiId: formData.upiId,
          accountHolderName: formData.accountHolderName,
        });
      }

      clearDraft();

      navigate(`/tournaments/${tournamentId}`, {
        state: { 
          message: 'Tournament created successfully! Categories and details have been saved.',
        }
      });
    } catch (err) {
      console.error('Error creating tournament:', err);
      setError(
        err.response?.data?.error || 
        err.response?.data?.errors?.join(', ') ||
        'Failed to create tournament. Please try again.'
      );
      setIsSubmitting(false);
    }
  };

  const handleSaveAndExit = () => {
    saveDraft();
    setShowExitModal(false);
    navigate('/organizer/dashboard');
  };

  const handleDiscardAndExit = () => {
    clearDraft();
    setShowExitModal(false);
    navigate('/organizer/dashboard');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <BasicInfoStep
            formData={formData}
            updateFormData={updateFormData}
            updateMultipleFields={updateMultipleFields}
            onNext={() => handleStepComplete(1)}
          />
        );
      case 2:
        return (
          <DatesStep
            formData={formData}
            updateMultipleFields={updateMultipleFields}
            onNext={() => handleStepComplete(2)}
            onPrev={prevStep}
          />
        );
      case 3:
        return (
          <PostersStep
            formData={formData}
            updateFormData={updateFormData}
            onNext={() => handleStepComplete(3)}
            onPrev={prevStep}
          />
        );
      case 4:
        return (
          <CategoriesStep
            formData={formData}
            updateFormData={updateFormData}
            onNext={() => handleStepComplete(4)}
            onPrev={prevStep}
          />
        );
      case 5:
        return (
          <PaymentQRStep
            formData={formData}
            updateFormData={updateFormData}
            updateMultipleFields={updateMultipleFields}
            onNext={() => handleStepComplete(5)}
            onPrev={prevStep}
          />
        );
      case 6:
        return (
          <ReviewStep
            formData={formData}
            goToStep={goToStep}
            onPrev={prevStep}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* KYC Blocking Modal */}
      {!isKYCApproved && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl p-8 max-w-2xl w-full border border-purple-500/30 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-5xl">🔒</span>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">KYC Verification Required</h2>
              <p className="text-gray-300">You must complete KYC verification before creating tournaments</p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h3 className="font-semibold text-white mb-2">Why KYC is Required:</h3>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li>✓ Verify your identity as a tournament organizer</li>
                  <li>✓ Ensure secure and trustworthy tournaments</li>
                  <li>✓ Comply with platform regulations</li>
                  <li>✓ Protect players and maintain quality</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => navigate('/organizer/kyc/info')}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold rounded-xl hover:shadow-lg transition-all"
              >
                Start KYC Now
              </button>
              <button
                onClick={() => navigate('/organizer/dashboard')}
                className="px-6 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Header */}
      <div className="relative bg-gradient-to-r from-slate-900 via-emerald-900 to-slate-900 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>
        
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Back Button with Halo Effect */}
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/30 to-teal-500/30 blur-lg rounded-xl"></div>
            <button
              onClick={() => hasFormData ? setShowExitModal(true) : navigate(-1)}
              className="relative flex items-center gap-2 px-4 py-2 bg-slate-800/80 border border-emerald-500/30 rounded-xl text-emerald-400 hover:text-emerald-300 hover:border-emerald-500/50 transition-all group"
            >
              <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back</span>
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                <Trophy className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Create New Tournament</h1>
                <p className="text-white/60 text-sm">Fill in the details to create your badminton tournament</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {hasFormData && (
                <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-white/80 font-medium">Auto-saved</span>
                </div>
              )}
              {hasFormData && (
                <button
                  onClick={() => setShowExitModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl border border-white/20 text-white/80 hover:text-white transition-all text-sm font-medium"
                >
                  <Save className="w-4 h-4" />
                  Save & Exit
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-4">
        {/* KYC Banner - Show if KYC not approved (show by default unless explicitly approved) */}
        {(kycLoading || kycStatus !== 'APPROVED') && (
          <KYCBanner />
        )}

        {/* Error Message */}
        {error && (
          <div className="relative mb-6 group">
            <div className="absolute -inset-1 bg-gradient-to-r from-red-500/30 to-rose-500/30 rounded-2xl blur-lg opacity-70"></div>
            <div className="relative bg-red-500/10 border border-red-500/30 rounded-2xl p-5 flex items-start gap-4">
              <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-red-400 mb-1">Error creating tournament</h3>
                <p className="text-sm text-red-300/80">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stepper */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl shadow-xl shadow-gray-200/50 border border-white/10 p-6 mb-6">
          <TournamentStepper
            currentStep={currentStep}
            goToStep={goToStep}
            completedSteps={completedSteps}
          />
        </div>

        {/* Step Content */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl shadow-xl shadow-gray-200/50 border border-white/10 p-6 md:p-8">
          {renderStep()}
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span className="text-sm text-emerald-700 font-medium">Your progress is automatically saved. You can continue later from your dashboard.</span>
          </div>
        </div>
      </div>

      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative bg-slate-800/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in duration-200">
            {/* Halo effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 rounded-2xl blur-xl opacity-30 animate-pulse"></div>
            
            {/* Content */}
            <div className="relative">
              <div className="text-center mb-6">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-2xl flex items-center justify-center mb-4 border border-amber-500/30">
                  <AlertTriangle className="w-8 h-8 text-amber-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Save Tournament Draft?
                </h3>
                <p className="text-gray-400">
                  Would you like to save your progress as a draft to continue later?
                </p>
              </div>

              {formData.name && (
                <div className="bg-slate-700/50 backdrop-blur-sm rounded-xl p-4 mb-6 border border-white/10">
                  <p className="text-sm text-gray-300">
                    <span className="font-semibold text-white">Tournament:</span> {formData.name || 'Untitled'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Step {currentStep} of 6 • {completedSteps.length} steps completed
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={handleSaveAndExit}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-500/50 transition-all font-semibold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Save className="w-5 h-5" />
                  Save as Draft & Exit
                </button>
                <button
                  onClick={handleDiscardAndExit}
                  className="w-full py-3.5 px-4 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 border border-red-500/30 transition-all font-semibold hover:scale-[1.02] active:scale-[0.98]"
                >
                  Discard & Exit
                </button>
                <button
                  onClick={() => setShowExitModal(false)}
                  className="w-full py-3.5 px-4 border border-white/10 text-gray-300 rounded-xl hover:bg-white/5 transition-all font-semibold hover:scale-[1.02] active:scale-[0.98]"
                >
                  Continue Editing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KYC BLOCKING MODAL - Prevents tournament creation */}
      {showKYCBlockModal && kycStatus !== 'APPROVED' && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="relative max-w-2xl w-full">
            {/* Animated gradient border */}
            <div className="absolute -inset-1 bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 rounded-3xl blur-xl opacity-75 animate-pulse"></div>
            
            {/* Modal content */}
            <div className="relative bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900 border-4 border-red-500/80 rounded-3xl shadow-2xl overflow-hidden">
              {/* Pulsing alert at top */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 animate-pulse"></div>
              
              <div className="p-8 md:p-12">
                {/* Icon */}
                <div className="text-center mb-6">
                  <div className="relative inline-block">
                    <div className="absolute -inset-4 bg-red-500 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                    <div className="relative w-24 h-24 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center mx-auto shadow-2xl">
                      <Shield className="w-12 h-12 text-white" />
                    </div>
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-4xl font-black text-white text-center mb-4 flex items-center justify-center gap-3">
                  <span className="text-5xl animate-bounce">🚫</span>
                  KYC Required!
                </h2>

                {/* Message */}
                <div className="bg-red-500/10 border-2 border-red-500/30 rounded-2xl p-6 mb-6">
                  <p className="text-white text-lg text-center font-semibold leading-relaxed">
                    You must complete <span className="text-red-400 font-black">KYC verification</span> before creating tournaments.
                  </p>
                  <p className="text-white/70 text-center mt-3">
                    This is a <span className="text-amber-400 font-bold">mandatory requirement</span> for all tournament organizers to ensure platform safety and trust.
                  </p>
                </div>

                {/* Why KYC? */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-6">
                  <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    Why KYC is Required:
                  </h3>
                  <ul className="space-y-3 text-white/80">
                    <li className="flex items-start gap-3">
                      <span className="text-emerald-400 text-xl flex-shrink-0">✓</span>
                      <span>Verify your identity and build trust with players</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-emerald-400 text-xl flex-shrink-0">✓</span>
                      <span>Prevent fraud and ensure secure tournaments</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-emerald-400 text-xl flex-shrink-0">✓</span>
                      <span>Comply with platform regulations</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-emerald-400 text-xl flex-shrink-0">✓</span>
                      <span>Quick process: Only 5-10 minutes!</span>
                    </li>
                  </ul>
                </div>

                {/* Process Steps */}
                <div className="grid grid-cols-3 gap-3 mb-8">
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-center">
                    <div className="text-3xl mb-2">📄</div>
                    <p className="text-white text-sm font-semibold">Upload Docs</p>
                    <p className="text-white/60 text-xs mt-1">Pay ₹50</p>
                  </div>
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 text-center">
                    <div className="text-3xl mb-2">🎥</div>
                    <p className="text-white text-sm font-semibold">Video Call</p>
                    <p className="text-white/60 text-xs mt-1">Quick verify</p>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center">
                    <div className="text-3xl mb-2">✅</div>
                    <p className="text-white text-sm font-semibold">Approved</p>
                    <p className="text-white/60 text-xs mt-1">5-10 mins</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={() => navigate('/organizer/kyc/info')}
                    className="w-full py-4 px-6 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white rounded-xl font-black text-lg hover:shadow-2xl hover:shadow-green-500/50 transition-all hover:scale-105 flex items-center justify-center gap-3 relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 opacity-0 group-hover:opacity-20 transition-opacity"></div>
                    <Shield className="w-6 h-6" />
                    Start KYC Verification Now
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-bounce">
                      Required!
                    </span>
                  </button>

                  <button
                    onClick={() => navigate('/organizer/dashboard')}
                    className="w-full py-3 px-6 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white rounded-xl font-semibold transition-all hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Dashboard
                  </button>
                </div>

                {/* Note */}
                <div className="mt-6 text-center">
                  <p className="text-white/50 text-sm">
                    💡 You can save tournament drafts, but cannot publish without KYC approval
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateTournament;
