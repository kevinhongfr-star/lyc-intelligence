import React, { useState } from 'react';

const STEPS = [
  { id: 1, title: 'Welcome', desc: 'Get started with your client portal' },
  { id: 2, title: 'Company Info', desc: 'Provide organization details' },
  { id: 3, title: 'Stakeholders', desc: 'Add team members' },
  { id: 4, title: 'Priorities', desc: 'Set your hiring priorities' },
  { id: 5, title: 'SLA', desc: 'Review service agreement' },
];

export function ClientPortalOnboarding() {
  const [currentStep, setCurrentStep] = useState(1);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-2xl font-bold text-text-primary">Onboarding</h1>
        <p className="text-text-muted mt-1">Complete your client setup</p>
      </header>

      <div className="bg-bg-secondary border border-bg-tertiary p-8">
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((step) => (
            <div key={step.id} className="flex flex-col items-center">
              <div className={`w-10 h-10 flex items-center justify-center text-sm font-bold ${
                currentStep >= step.id ? 'bg-accent text-white' : 'bg-bg-tertiary text-text-muted'
              }`}>
                {step.id}
              </div>
              <p className={`text-xs mt-2 ${currentStep >= step.id ? 'text-text-primary' : 'text-text-muted'}`}>
                {step.title}
              </p>
              {step.id < STEPS.length && (
                <div className={`w-16 h-0.5 mt-4 ${currentStep > step.id ? 'bg-accent' : 'bg-bg-tertiary'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="text-center py-12">
          <div className="w-20 h-20 bg-accent/10 flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl font-bold text-accent">{currentStep}</span>
          </div>
          <h2 className="font-serif text-xl font-bold text-text-primary mb-2">
            {STEPS[currentStep - 1].title}
          </h2>
          <p className="text-text-muted mb-8">
            {STEPS[currentStep - 1].desc}
          </p>
          
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="px-6 py-3 bg-bg-tertiary text-text-primary text-sm font-medium hover:bg-bg-secondary border border-bg-tertiary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back
            </button>
            <button
              onClick={() => setCurrentStep(Math.min(5, currentStep + 1))}
              className="px-6 py-3 bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors"
            >
              {currentStep === 5 ? 'Complete' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}