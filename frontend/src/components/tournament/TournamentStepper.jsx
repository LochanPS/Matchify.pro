const TournamentStepper = ({ currentStep, goToStep, completedSteps }) => {
  const steps = [
    { number: 1, label: 'Basic', icon: '1' },
    { number: 2, label: 'Dates', icon: '2' },
    { number: 3, label: 'Posters', icon: '3' },
    { number: 4, label: 'Categories', icon: '4' },
    { number: 5, label: 'Payment', icon: '5' },
    { number: 6, label: 'Agreement', icon: '6' },
    { number: 7, label: 'Review', icon: '7' },
  ];

  return (
    <div className="overflow-x-auto scrollbar-hide -mx-1">
      <div className="flex items-center justify-start gap-3 min-w-max px-1 py-1">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            {/* Step Button - Matches Screenshot EXACTLY */}
            <button
              onClick={() => completedSteps.includes(step.number) && goToStep(step.number)}
              disabled={!completedSteps.includes(step.number) && currentStep !== step.number}
              className={`
                relative flex flex-col items-center justify-center rounded-2xl font-bold
                transition-all duration-200 px-4 py-3 min-w-[80px]
                ${currentStep === step.number
                  ? 'text-white scale-105'
                  : completedSteps.includes(step.number)
                  ? 'text-white cursor-pointer hover:scale-105'
                  : 'text-gray-500 cursor-not-allowed opacity-50'
                }
              `}
              style={{
                background: currentStep === step.number
                  ? 'linear-gradient(135deg, #10b981, #34d399)' // Emerald green like screenshot
                  : completedSteps.includes(step.number)
                  ? 'linear-gradient(135deg, #a855f7, #c084fc)' // Purple like screenshot
                  : 'rgba(71,85,105,0.4)', // Dark gray like screenshot
                boxShadow: currentStep === step.number
                  ? '0 8px 25px rgba(16,185,129,0.5), 0 0 20px rgba(16,185,129,0.3)'
                  : completedSteps.includes(step.number)
                  ? '0 6px 20px rgba(168,85,247,0.4)'
                  : 'none',
              }}
            >
              {/* Step Number/Check - Centered Circle */}
              <div className="flex items-center justify-center w-8 h-8 rounded-xl mb-1.5"
                style={{
                  background: currentStep === step.number || completedSteps.includes(step.number)
                    ? 'rgba(255,255,255,0.25)'
                    : 'rgba(0,0,0,0.3)'
                }}
              >
                {completedSteps.includes(step.number) ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span className="text-sm font-black">{step.icon}</span>
                )}
              </div>

              {/* Step Label */}
              <span className="text-xs font-bold whitespace-nowrap">
                {step.label}
              </span>
            </button>

            {/* Connector Arrow - Like Screenshot */}
            {index < steps.length - 1 && (
              <div className="flex items-center justify-center w-5 h-5 mx-2">
                <svg 
                  className="w-4 h-4"
                  fill="none" 
                  stroke={completedSteps.includes(step.number) ? '#a855f7' : 'rgba(148,163,184,0.4)'}
                  strokeWidth="2.5"
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
