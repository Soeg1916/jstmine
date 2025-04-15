interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export default function ProgressIndicator({ currentStep, totalSteps }: ProgressIndicatorProps) {
  return (
    <div className="flex items-center mb-8">
      <div className="flex-1 flex">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const step = index + 1;
          const isActive = step <= currentStep;
          const isLastStep = step === totalSteps;
          
          return (
            <div key={step} className="flex items-center flex-1" data-step={step}>
              <div className={`w-8 h-8 rounded-full ${isActive ? 'bg-primary' : 'bg-gray-600'} text-white flex items-center justify-center font-medium`}>
                {step}
              </div>
              {!isLastStep && (
                <div className={`h-1 flex-1 ${isActive ? 'bg-primary' : 'bg-gray-600'}`}></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
