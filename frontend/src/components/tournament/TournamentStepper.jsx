const TournamentStepper = ({ currentStep, goToStep, completedSteps }) => {
  const steps = [
    { number: 1, label: 'Basic Info', shortLabel: 'Basic' },
    { number: 2, label: 'Dates', shortLabel: 'Dates' },
    { number: 3, label: 'Posters', shortLabel: 'Posters' },
    { number: 4, label: 'Categories', shortLabel: 'Categories' },
    { number: 5, label: 'Payment QR', shortLabel: 'Payment' },
    { number: 6, label: 'Review', shortLabel: 'Review' },
  ];

  return (
    <div className="overflow-x-auto scrollbar-hide">
      <div className="flex items-center gap-2 min-w-max px-1">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            {/* Step Button */}
            <button
              onClick={() => completedSteps.includes(step.number) && goToStep(step.number)}
              disabled={!completedSteps.includes(step.number) && currentStep !== step.number}
              className={`
                relative flex flex-col items-center justify-center rounded-2xl font-bold
                transition-all duration-200 px-3 py-2 min-w-[70px]
                ${currentStep === step.number
                  ? 'text-white'
                  : completedSteps.includes(step.number)
                  ? 'text-white cursor-pointer hover:scale-105'
                  : 'text-gray-500 cursor-not-allowed opacity-60'
                }
              `}
              style={{
                background: currentStep === step.number
                  ? 'linear-gradient(135deg, #00c853, #00ff88)'
                  : completedSteps.includes(step.number)
                  ? 'linear-gradient(135deg, #a855f7, #8b5cf6)'
                  : 'rgba(100,116,139,0.3)',
                boxShadow: currentStep === step.number
                  ? '0 6px 20px rgba(0,200,83,0.4)'
                  : completedSteps.includes(step.number)
                  ? '0 4px 15px rgba(168,85,247,0.3)'
                  : 'none',
                border: currentStep === step.number
                  ? '2px solid rgba(0,255,136,0.5)'
                  : completedSteps.includes(step.number)
                  ? '2px solid rgba(168,85,247,0.5)'
                  : '2px solid rgba(255,255,255,0.1)'
              }}
            >
              {/* Step Number/Check */}
              <div className="flex items-center justify-center w-6 h-6 rounded-full mb-1"
                style={{
                  background: currentStep === step.number || completedSteps.includes(step.number)
                    ? 'rgba(255,255,255,0.2)'
                    : 'rgba(0,0,0,0.2)'
                }}
              >
                {completedSteps.includes(step.number) ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span className="text-xs font-black">{step.number}</span>
                )}
              </div>

              {/* Step Label */}
              <span className="text-xs font-bold whitespace-nowrap">
                {step.shortLabel}
              </span>
            </button>

            {/* Connector Arrow */}
            {index < steps.length - 1 && (
              <div className="flex items-center justify-center w-4 h-4 mx-1">
                <svg 
                  className="w-3 h-3"
                  fill="none" 
                  stroke={completedSteps.includes(step.number) ? '#a855f7' : 'rgba(255,255,255,0.3)'}
                  strokeWidth="3"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TournamentStepper;
