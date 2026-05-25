const TournamentStepper = ({ currentStep, goToStep, completedSteps }) => {
  const steps = [
    { number: 1, label: 'Basic' },
    { number: 2, label: 'Dates' },
    { number: 3, label: 'Posters' },
    { number: 4, label: 'Categories' },
    { number: 5, label: 'Payment' },
    { number: 6, label: 'Agreement' },
    { number: 7, label: 'Review' },
  ];

  return (
    <div style={{ overflowX: 'auto', margin: '0 -4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px', minWidth: 'max-content' }}>
        {steps.map((step, index) => {
          const isActive = currentStep === step.number;
          const isCompleted = completedSteps.includes(step.number);
          const isClickable = isCompleted;

          return (
            <div key={step.number} style={{ display: 'flex', alignItems: 'center' }}>
              <button
                onClick={() => isClickable && goToStep(step.number)}
                disabled={!isClickable && !isActive}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: '10px 14px', minWidth: 72, borderRadius: 14,
                  border: 'none', cursor: isClickable ? 'pointer' : 'default',
                  transition: 'all 0.2s ease',
                  transform: isActive ? 'scale(1.04)' : 'scale(1)',
                  background: isActive
                    ? 'linear-gradient(135deg, #F59E0B, #D97706)'
                    : isCompleted
                    ? 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(124,58,237,0.2))'
                    : 'rgba(255,255,255,0.05)',
                  boxShadow: isActive ? '0 6px 20px rgba(245,158,11,0.35)' : isCompleted ? '0 4px 12px rgba(139,92,246,0.2)' : 'none',
                  opacity: (!isClickable && !isActive) ? 0.45 : 1,
                }}
              >
                {/* Icon circle */}
                <div style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: isActive ? 'rgba(255,255,255,0.25)' : isCompleted ? 'rgba(139,92,246,0.3)' : 'rgba(0,0,0,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 5
                }}>
                  {isCompleted ? (
                    <svg style={{ width: 16, height: 16, color: isActive ? '#0C0900' : '#C4B5FD' }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span style={{ fontSize: 13, fontWeight: 800, color: isActive ? '#0C0900' : 'rgba(255,255,255,0.4)' }}>
                      {step.number}
                    </span>
                  )}
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
                  color: isActive ? '#0C0900' : isCompleted ? '#C4B5FD' : 'rgba(255,255,255,0.4)'
                }}>
                  {step.label}
                </span>
              </button>

              {/* Connector */}
              {index < steps.length - 1 && (
                <svg style={{ width: 14, height: 14, margin: '0 4px', flexShrink: 0 }} fill="none" stroke={isCompleted ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.12)'} strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TournamentStepper;
