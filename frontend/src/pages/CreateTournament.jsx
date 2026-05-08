import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTournamentForm, deleteTournamentDraft } from '../hooks/useTournamentForm';
import { tournamentAPI } from '../api/tournament';
import api from '../utils/api';
import { getErrorMessage } from '../utils/errorMessage';
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

      // Show success modal with publish option instead of navigating immediately
      navigate(`/tournaments/${tournamentId}`, {
        state: { 
          showPublishPrompt: true,
          message: 'Tournament created successfully!',
        }
      });
    } catch (err) {
      console.error('Error creating tournament:', err);
      
      // Extract detailed error messages from backend
      let errorMessage = 'Failed to create tournament. Please try again.';
      
      if (err?.response?.data) {
        const data = err.response.data;
        
        // Backend returns validation errors in 'errors' array
        if (data.errors && Array.isArray(data.errors)) {
          errorMessage = data.errors.join('\n');
        } 
        // Single error message
        else if (data.error) {
          errorMessage = data.error;
        }
        // Message field
        else if (data.message) {
          errorMessage = data.message;
        }
      }
      
      setError(errorMessage);
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
    <div className="min-h-screen relative overflow-hidden pb-6" style={{ background:'linear-gradient(180deg, #0a0a1f 0%, #07071a 30%, #0d1a2a 60%, #07071a 100%)' }}>
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl opacity-30"
          style={{ 
            background: 'radial-gradient(circle, rgba(0,200,83,0.6), transparent)',
            animation: 'glow 4s ease-in-out infinite'
          }}
        />
        <div 
          className="absolute bottom-1/3 left-0 w-64 h-64 rounded-full blur-3xl opacity-25"
          style={{ 
            background: 'radial-gradient(circle, rgba(168,85,247,0.6), transparent)',
            animation: 'glow 5s ease-in-out infinite reverse'
          }}
        />
        <div 
          className="absolute top-1/2 right-1/4 w-56 h-56 rounded-full blur-3xl opacity-20"
          style={{ 
            background: 'radial-gradient(circle, rgba(6,182,212,0.6), transparent)',
            animation: 'glow 6s ease-in-out infinite'
          }}
        />
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: ['#00c853', '#a855f7', '#06b6d4', '#f59e0b'][Math.floor(Math.random() * 4)],
              opacity: Math.random() * 0.5 + 0.2,
              animation: `float ${Math.random() * 10 + 5}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
              boxShadow: `0 0 ${Math.random() * 15 + 5}px currentColor`
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(15px, -15px) scale(1.05); }
          50% { transform: translate(-10px, 10px) scale(0.95); }
          75% { transform: translate(10px, 5px) scale(1.02); }
        }
        @keyframes glow {
          0%, 100% { opacity: 0.3; filter: brightness(1); }
          50% { opacity: 0.6; filter: brightness(1.3); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>

      {/* Hero Header - Compact Mobile-First */}
      <div className="relative pt-20">
        <div className="relative max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-4">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #00c853, #00ff88)',
                boxShadow: '0 8px 25px rgba(0,200,83,0.4)'
              }}
            >
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 
                className="text-xl font-black"
                style={{
                  background: 'linear-gradient(135deg, #00c853, #00ff88)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                Create New Tournament
              </h1>
              <p className="text-xs text-white/60">Fill in the details to create your tournament</p>
            </div>
          </div>

          {/* Auto-save indicator */}
          {hasFormData && (
            <div 
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-3"
              style={{
                background: 'linear-gradient(135deg, rgba(0,200,83,0.2), rgba(0,255,136,0.15))',
                border: '2px solid rgba(0,200,83,0.4)',
                color: '#00ff88',
                boxShadow: '0 4px 15px rgba(0,200,83,0.3)'
              }}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Auto-saved
            </div>
          )}
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-4">

        {/* Error Message - Shows actual validation errors */}
        {error && (
          <div 
            className="mb-4 rounded-2xl p-4"
            style={{
              background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(220,38,38,0.1))',
              border: '2px solid rgba(239,68,68,0.3)',
              boxShadow: '0 4px 15px rgba(239,68,68,0.2)'
            }}
          >
            <div className="flex items-start gap-3">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(239,68,68,0.2)' }}
              >
                <AlertTriangle className="w-4 h-4 text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-red-400 text-sm mb-2">Cannot create tournament</h3>
                {error.includes('\n') ? (
                  <ul className="space-y-1">
                    {error.split('\n').map((err, idx) => (
                      <li key={idx} className="text-xs text-red-300/90 flex items-start gap-2">
                        <span className="text-red-400 mt-0.5">•</span>
                        <span>{err}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-red-300/90">{error}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Stepper - Compact */}
        <div 
          className="rounded-2xl p-4 mb-4"
          style={{
            background: 'linear-gradient(135deg, rgba(0,200,83,0.1) 0%, rgba(99,102,241,0.1) 100%)',
            border: '2px solid rgba(0,200,83,0.2)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0,200,83,0.15)'
          }}
        >
          <TournamentStepper
            currentStep={currentStep}
            goToStep={goToStep}
            completedSteps={completedSteps}
          />
        </div>

        {/* Step Content - Compact */}
        <div 
          className="rounded-2xl p-4"
          style={{
            background: 'linear-gradient(135deg, rgba(0,200,83,0.1) 0%, rgba(99,102,241,0.1) 100%)',
            border: '2px solid rgba(0,200,83,0.2)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0,200,83,0.15)'
          }}
        >
          {renderStep()}
        </div>

        {/* Help Text - Compact */}
        <div className="mt-4 text-center">
          <div 
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium"
            style={{
              background: 'linear-gradient(135deg, rgba(0,200,83,0.15), rgba(0,255,136,0.1))',
              border: '1px solid rgba(0,200,83,0.3)',
              color: '#00ff88'
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Your progress is automatically saved
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
