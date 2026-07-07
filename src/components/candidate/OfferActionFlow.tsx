import React, { useState } from 'react';
import { Check, X, MessageCircle, Sparkles, Send } from 'lucide-react';
import type { Offer } from './OfferList';

interface OfferActionFlowProps {
  offers: Offer[];
}

type ModalKind = 'accept' | 'decline' | null;
type NegotiationState = 'idle' | 'composing' | 'sent';

export function OfferActionFlow({ offers }: OfferActionFlowProps) {
  const [activeOffer, setActiveOffer] = useState<Offer | null>(offers[0] ?? null);
  const [modalKind, setModalKind] = useState<ModalKind>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [negotiationState, setNegotiationState] = useState<NegotiationState>('idle');
  const [negotiationText, setNegotiationText] = useState('');

  if (!activeOffer) {
    return null;
  }

  const closeModal = () => {
    setModalKind(null);
  };

  const handleConfirmAccept = () => {
    setSuccessMessage(
      `Offer ${activeOffer.id} accepted. ${activeOffer.company} onboarding team will contact you.`
    );
    setModalKind(null);
  };

  const handleConfirmDecline = () => {
    setSuccessMessage(`Offer ${activeOffer.id} declined.`);
    setModalKind(null);
  };

  const handleSendNegotiation = () => {
    setNegotiationState('sent');
  };

  const handleAskNexus = () => {
    setSuccessMessage(
      `NEXUS is reviewing Offer ${activeOffer.id} — ${activeOffer.company} ${activeOffer.role}. Insights will appear shortly.`
    );
  };

  const resetNegotiation = () => {
    setNegotiationState('idle');
    setNegotiationText('');
  };

  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h2 className="font-serif text-lg font-bold text-text-primary">ACTIONS</h2>
          <p className="text-xs text-text-muted mt-1">
            Acting on Offer {activeOffer.id} — {activeOffer.company} {activeOffer.role}
          </p>
        </div>
        {offers.length > 1 && (
          <div className="flex items-center gap-2">
            <label className="text-xs text-text-muted uppercase tracking-wider">
              Target
            </label>
            <select
              value={activeOffer.id}
              onChange={(e) => {
                const next = offers.find((o) => o.id === e.target.value);
                if (next) {
                  setActiveOffer(next);
                  setSuccessMessage(null);
                  resetNegotiation();
                }
              }}
              className="bg-bg-secondary border border-bg-tertiary px-3 py-1.5 text-sm text-text-primary"
            >
              {offers.map((o) => (
                <option key={o.id} value={o.id}>
                  Offer {o.id}: {o.company}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {successMessage && (
        <div className="mb-4 p-3 bg-accent-10 border-l-4 border-l-accent flex items-start justify-between gap-3">
          <p className="text-sm text-accent font-medium">{successMessage}</p>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-accent hover:opacity-70"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {negotiationState === 'composing' && (
        <div className="mb-4 p-4 bg-bg-secondary border border-bg-tertiary">
          <label className="block text-sm font-medium text-text-primary mb-2">
            What would you like to negotiate?
          </label>
          <textarea
            value={negotiationText}
            onChange={(e) => setNegotiationText(e.target.value)}
            rows={4}
            placeholder="e.g. Increase base salary to $340K, accelerate equity vesting..."
            className="w-full bg-bg-primary border border-bg-tertiary p-3 text-sm text-text-primary resize-none"
          />
          <div className="flex items-center justify-end gap-2 mt-3">
            <button
              type="button"
              onClick={resetNegotiation}
              className="px-4 py-2 text-sm font-medium bg-bg-tertiary text-text-secondary hover:bg-bg-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSendNegotiation}
              disabled={!negotiationText.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-accent text-white hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              Send Request
            </button>
          </div>
        </div>
      )}

      {negotiationState === 'sent' && (
        <div className="mb-4 p-3 bg-accent-10 border-l-4 border-l-accent flex items-start justify-between gap-3">
          <p className="text-sm text-accent font-medium">
            Negotiation request sent for Offer {activeOffer.id} — {activeOffer.company}.
            Your consultant will follow up with their response.
          </p>
          <button
            type="button"
            onClick={resetNegotiation}
            className="text-accent hover:opacity-70"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setModalKind('accept')}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-accent text-white hover:bg-accent-hover transition-colors"
        >
          <Check className="w-4 h-4" />
          Accept Offer {activeOffer.id}
        </button>
        <button
          type="button"
          onClick={() => setModalKind('decline')}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-bg-tertiary text-text-secondary hover:bg-bg-hover transition-colors"
        >
          <X className="w-4 h-4" />
          Decline
        </button>
        <button
          type="button"
          onClick={() => setNegotiationState('composing')}
          disabled={negotiationState !== 'idle'}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-bg-tertiary text-text-primary hover:bg-bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <MessageCircle className="w-4 h-4" />
          Request Negotiation
        </button>
        <button
          type="button"
          onClick={handleAskNexus}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-accent hover:bg-accent-10 transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          Ask NEXUS for advice
        </button>
      </div>

      {modalKind && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={closeModal}
        >
          <div
            className="bg-bg-primary border border-bg-tertiary p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-serif text-lg font-bold text-text-primary mb-2">
              {modalKind === 'accept'
                ? `Accept Offer ${activeOffer.id} — ${activeOffer.company} ${activeOffer.role}?`
                : `Decline Offer ${activeOffer.id}?`}
            </h3>
            <p className="text-sm text-text-secondary mb-6">
              {modalKind === 'accept'
                ? 'This will notify the employer that you are accepting the offer. They will reach out with onboarding details.'
                : 'This will notify the employer that you are declining the offer. This action cannot be undone.'}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium bg-bg-tertiary text-text-secondary hover:bg-bg-hover transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={
                  modalKind === 'accept' ? handleConfirmAccept : handleConfirmDecline
                }
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors ${
                  modalKind === 'accept'
                    ? 'bg-accent hover:bg-accent-hover'
                    : 'bg-error hover:opacity-90'
                }`}
              >
                {modalKind === 'accept' ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <X className="w-4 h-4" />
                )}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
