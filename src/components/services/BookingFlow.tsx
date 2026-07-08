import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, CreditCard, Clock } from 'lucide-react';
import type { Service } from '@/mocks/advancedFeatures';

interface BookingFlowProps {
  service: Service;
  onClose: () => void;
}

const MOCK_SLOTS = [
  { id: 'slot1', label: 'Tomorrow, 10:00 AM', value: 'tomorrow-10' },
  { id: 'slot2', label: 'Thu, 2:00 PM', value: 'thu-14' },
  { id: 'slot3', label: 'Fri, 11:00 AM', value: 'fri-11' },
];

export default function BookingFlow({ service, onClose }: BookingFlowProps) {
  const [step, setStep] = useState(1);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const canNext = step === 1 ? true : step === 2 ? selectedSlot !== null : false;

  function handleConfirm() {
    onClose();
  }

  return (
    <div className="bg-bg-primary border border-bg-tertiary max-w-lg mx-auto" style={{ borderRadius: 0 }}>
      {/* Step indicator */}
      <div className="flex items-center gap-2 p-4 border-b border-bg-tertiary">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <span
              className={`w-7 h-7 flex items-center justify-center text-xs font-bold ${
                s === step
                  ? 'bg-[#C108AB] text-white'
                  : s < step
                    ? 'bg-[#C108AB]/20 text-[#C108AB]'
                    : 'bg-bg-tertiary text-text-muted'
              }`}
              style={{ borderRadius: 0 }}
            >
              {s}
            </span>
            {s < 3 && (
              <div className={`w-8 h-0.5 ${s < step ? 'bg-[#C108AB]' : 'bg-bg-tertiary'}`} />
            )}
          </div>
        ))}
        <span className="ml-2 text-sm text-text-muted">
          {step === 1 ? 'Confirm Service' : step === 2 ? 'Choose Time' : 'Review & Pay'}
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* Step 1: Confirm service */}
        {step === 1 && (
          <div className="space-y-3">
            <h3 className="font-serif text-lg font-semibold text-text-primary">{service.name}</h3>
            <p className="text-sm text-text-muted">{service.description}</p>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1">
                <span
                  className="w-6 h-6 flex items-center justify-center text-xs font-bold text-white"
                  style={{ borderRadius: 0, backgroundColor: service.provider.avatarColor }}
                >
                  {service.provider.name.charAt(0)}
                </span>
                <span className="text-text-secondary">{service.provider.name}</span>
              </div>
              <div className="flex items-center gap-1 text-text-muted">
                <Clock className="w-3.5 h-3.5" />
                <span>{service.duration}</span>
              </div>
              <div className="flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-accent" />
                <span className="font-semibold text-text-primary">{service.priceCredits}</span>
                <span className="text-text-muted">credits</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Choose time slot */}
        {step === 2 && (
          <div className="space-y-3">
            <h3 className="font-serif text-lg font-semibold text-text-primary">Select a Time Slot</h3>
            <div className="space-y-2">
              {MOCK_SLOTS.map((slot) => (
                <label
                  key={slot.id}
                  className={`flex items-center gap-3 p-3 border cursor-pointer transition-colors ${
                    selectedSlot === slot.value
                      ? 'border-[#C108AB] bg-accent-5'
                      : 'border-bg-tertiary hover:border-text-muted'
                  }`}
                  style={{ borderRadius: 0 }}
                >
                  <input
                    type="radio"
                    name="timeSlot"
                    value={slot.value}
                    checked={selectedSlot === slot.value}
                    onChange={() => setSelectedSlot(slot.value)}
                    className="accent-[#C108AB]"
                  />
                  <span className="text-sm text-text-primary">{slot.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Confirm & Pay */}
        {step === 3 && (
          <div className="space-y-3">
            <h3 className="font-serif text-lg font-semibold text-text-primary">Booking Summary</h3>
            <div className="border border-bg-tertiary p-4 space-y-2" style={{ borderRadius: 0 }}>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Service</span>
                <span className="text-text-primary font-medium">{service.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Provider</span>
                <span className="text-text-primary">{service.provider.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Time Slot</span>
                <span className="text-text-primary">
                  {MOCK_SLOTS.find((s) => s.value === selectedSlot)?.label}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Duration</span>
                <span className="text-text-primary">{service.duration}</span>
              </div>
              <div className="border-t border-bg-tertiary pt-2 mt-2 flex justify-between">
                <span className="text-sm text-text-muted">Total</span>
                <div className="flex items-center gap-1">
                  <CreditCard className="w-4 h-4 text-accent" />
                  <span className="font-bold text-text-primary">{service.priceCredits} credits</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between p-4 border-t border-bg-tertiary">
        <button
          onClick={step === 1 ? onClose : () => setStep((s) => s - 1)}
          className="flex items-center gap-1 px-3 py-2 text-sm text-text-muted hover:text-text-primary transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          {step === 1 ? 'Cancel' : 'Back'}
        </button>

        {step < 3 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canNext}
            className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-white bg-[#C108AB] hover:bg-[#A00790] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ borderRadius: 0 }}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleConfirm}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#C108AB] hover:bg-[#A00790] transition-colors"
            style={{ borderRadius: 0 }}
          >
            <CreditCard className="w-4 h-4" />
            Confirm & Pay {service.priceCredits} Credits
          </button>
        )}
      </div>
    </div>
  );
}
