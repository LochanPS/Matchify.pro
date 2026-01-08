import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTournamentForm, deleteTournamentDraft } from '../hooks/useTournamentForm';
import { tournamentAPI } from '../api/tournament';
import TournamentStepper from '../components/tournament/TournamentStepper';
import BasicInfoStep from '../components/tournament/steps/BasicInfoStep';
import DatesStep from '../components/tournament/steps/DatesStep';
import PostersStep from '../components/tournament/steps/PostersStep';
import CategoriesStep from '../components/tournament/steps/CategoriesStep';
import PaymentQRStep from '../components/tournament/steps/PaymentQRStep';
import ReviewStep from '../components/tournament/steps/ReviewStep';

const CreateTournament = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const draftIdFromUrl = searchParams.get('draft');
  
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

  // Check if form has data worth saving
  const hasFormData = formData.name || formData.description || formData.venue || formData.city;

  // Handle browser back/close with beforeunload
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
      // Step 1: Create tournament with basic info and dates
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
        registrationOpenDate: formData.registrationOpenDate,
        registrationCloseDate: formData.registrationCloseDate,
        startDate: formData.startDate,
        endDate: formData.endDate,
      };

      const createResponse = await tournamentAPI.createTournament(tournamentData);
      const tournamentId = createResponse.tournament.id;

      // Step 2: Upload posters if any
      if (formData.posters.length > 0) {
        const posterFiles = formData.posters.filter(p => p.file).map(p => p.file);
        if (posterFiles.length > 0) {
          await tournamentAPI.uploadPosters(tournamentId, posterFiles);
        }
      }

      // Step 3: Create categories
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

      // Step 4: Upload payment QR if any
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

      // Clear the draft after successful creation
      clearDraft();

      // Success! Navigate to tournament detail page
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create New Tournament</h1>
            <p className="text-gray-600 mt-2">
              Fill in the details to create your badminton tournament
            </p>
          </div>
          <div className="flex items-center gap-3">
            {hasFormData && (
              <span className="flex items-center gap-1 text-sm text-green-600">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Auto-saved
              </span>
            )}
            {hasFormData && (
              <button
                onClick={() => setShowExitModal(true)}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                Save & Exit
              </button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error creating tournament</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stepper */}
        <TournamentStepper
          currentStep={currentStep}
          goToStep={goToStep}
          completedSteps={completedSteps}
        />

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
          {renderStep()}
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Your progress is automatically saved. You can continue later from your dashboard.</p>
        </div>
      </div>

      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Save Tournament Draft?
              </h3>
              <p className="text-gray-600">
                Would you like to save your progress as a draft to continue later?
              </p>
            </div>

            {formData.name && (
              <div className="bg-gray-50 rounded-lg p-3 mb-6">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Tournament:</span> {formData.name || 'Untitled'}
                </p>
                <p className="text-sm text-gray-500">
                  Step {currentStep} of 6 • {completedSteps.length} steps completed
                </p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleSaveAndExit}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Save as Draft & Exit
              </button>
              <button
                onClick={handleDiscardAndExit}
                className="w-full py-3 px-4 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
              >
                Discard & Exit
              </button>
              <button
                onClick={() => setShowExitModal(false)}
                className="w-full py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Continue Editing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateTournament;
