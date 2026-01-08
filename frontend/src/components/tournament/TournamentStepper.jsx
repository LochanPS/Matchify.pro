const TournamentStepper = ({ currentStep, goToStep, completedSteps }) => {
  const steps = [
    { number: 1, label: 'Basic Info' },
    { number: 2, label: 'Dates' },
    { number: 3, label: 'Posters' },
    { number: 4, label: 'Categories' },
    { number: 5, label: 'Payment QR' },
    { number: 6, label: 'Review' },
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1">
            {/* Step Circle */}
            <button
              onClick={() => completedSteps.includes(step.number) && goToStep(step.number)}
              disabled={!completedSteps.includes(step.number) && currentStep !== step.number}
              className={`
                relative flex items-center justify-center w-10 h-10 rounded-full font-semibold
                transition-all duration-200
                ${currentStep === step.number
                  ? 'bg-blue-600 text-white ring-4 ring-blue-200'
                  : completedSteps.includes(step.number)
                  ? 'bg-green-600 text-white cursor-pointer hover:bg-green-700'
                  : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                }
              `}
            >
              {completedSteps.includes(step.number) ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                step.number
              )}
            </button>

            {/* Step Label */}
            <span className={`ml-2 text-sm font-medium ${
              currentStep === step.number ? 'text-blue-600' : 'text-gray-600'
            }`}>
              {step.label}
            </span>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className={`flex-1 h-1 mx-4 rounded ${
                completedSteps.includes(step.number) ? 'bg-green-600' : 'bg-gray-300'
              }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TournamentStepper;
