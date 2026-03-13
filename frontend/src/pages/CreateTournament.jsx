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
import { Trophy, Save, X, AlertTriangle, CheckCircle, Sparkles, ArrowLeft } from 'lucide-react';

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

  const hasFormData = formData.name || formData.description || formData.venue || formData.city;

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
    navigate('/dashboard?role=ORGANIZER');
  };

  const handleDiscardAndExit = () => {
    clearDraft();
    setShowExitModal(false);
    navigate('/dashboard?role=ORGANIZER');
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

    </div>
  );
};

export default CreateTournament;
