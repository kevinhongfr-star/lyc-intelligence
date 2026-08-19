import React, { useState, useMemo } from 'react';
import { Modal } from '@/components/ui/Modal';
import { V1 } from '@/styles/v1-tokens';

export interface Persona {
  id: string;
  name: string;
  description: string;
  styleTags?: string[];
  tierLimit?: number;
}

interface PersonaSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  personas: Persona[];
  currentPersonaId?: string;
  onSelect: (id: string) => void;
  onCreateNew?: () => void;
  tierLimit?: number;
  tierName?: string;
}

export default function PersonaSwitcherModal({
  isOpen,
  onClose,
  personas,
  currentPersonaId,
  onSelect,
  onCreateNew,
  tierLimit,
  tierName,
}: PersonaSwitcherModalProps) {
  const [selectedId, setSelectedId] = useState<string | undefined>(currentPersonaId);

  const selectionChanged = useMemo(
    () => selectedId !== currentPersonaId && selectedId !== undefined,
    [selectedId, currentPersonaId],
  );

  const handleConfirm = () => {
    if (selectedId) {
      onSelect(selectedId);
      onClose();
    }
  };

  const modalTitle = (
    <span
      style={{
        fontFamily: V1.displayFont,
        fontSize: 28,
        fontWeight: V1.fwSemibold,
        letterSpacing: V1.trackingTight,
        lineHeight: V1.leadingHeading,
        color: V1.text,
      }}
    >
      Switch thinking style
    </span>
  );

  const modalDescription = (
    <span
      style={{
        fontFamily: V1.bodyFont,
        fontSize: 14,
        fontStyle: 'italic',
        color: V1.ink600,
        lineHeight: V1.leadingBody,
      }}
    >
      NEXUS will use this style going forward. We'll also adjust as we learn from each conversation.
    </span>
  );

  const limitText =
    tierName && tierLimit !== undefined
      ? tierLimit === -1
        ? `Your ${tierName} tier allows Unlimited styles.`
        : `Your ${tierName} tier allows ${tierLimit} styles.`
      : null;

  const footer = (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
      }}
    >
      <button
        type="button"
        onClick={onClose}
        style={{
          background: 'transparent',
          border: 'none',
          padding: '8px 0',
          fontFamily: V1.monoFont,
          fontSize: V1.textMonoPx,
          letterSpacing: V1.trackingMono,
          textTransform: 'uppercase',
          color: V1.ink500,
          cursor: 'pointer',
        }}
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={handleConfirm}
        disabled={!selectionChanged}
        style={{
          background: selectionChanged ? V1.teal800 : V1.ink300,
          border: `1px solid ${selectionChanged ? V1.teal800 : V1.ink300}`,
          color: V1.white,
          padding: '10px 20px',
          fontFamily: V1.monoFont,
          fontSize: V1.textMonoPx,
          letterSpacing: V1.trackingMono,
          textTransform: 'uppercase',
          cursor: selectionChanged ? 'pointer' : 'not-allowed',
          opacity: selectionChanged ? 1 : 0.5,
          borderRadius: V1.radius,
        }}
      >
        Use selected style →
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={modalTitle}
      description={modalDescription}
      footer={footer}
    >
      <div style={{ padding: 0 }}>
        {personas.map((persona, idx) => {
          const isSelected = selectedId === persona.id;
          const isCurrent = currentPersonaId === persona.id;

          return (
            <div
              key={persona.id}
              onClick={() => setSelectedId(persona.id)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 16,
                padding: 16,
                borderBottom:
                  idx === personas.length - 1 && !onCreateNew
                    ? 'none'
                    : `1px solid ${V1.ink100}`,
                background: isSelected ? V1.teal50 : 'transparent',
                cursor: 'pointer',
                transition: `background ${V1.durFast}ms ease`,
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  (e.currentTarget as HTMLDivElement).style.background = V1.teal50;
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                }
              }}
            >
              <div
                style={{
                  flexShrink: 0,
                  width: 20,
                  height: 20,
                  borderRadius: '9999px',
                  border: `1px solid ${isSelected ? V1.teal600 : V1.ink300}`,
                  background: isSelected ? V1.teal600 : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 2,
                }}
              >
                {isSelected && (
                  <span
                    style={{
                      color: V1.white,
                      fontSize: 12,
                      lineHeight: 1,
                      fontFamily: V1.bodyFont,
                    }}
                  >
                    ✓
                  </span>
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 4,
                  }}
                >
                  <span
                    style={{
                      fontFamily: V1.displayFont,
                      fontSize: 18,
                      fontWeight: V1.fwSemibold,
                      color: V1.text,
                      lineHeight: 1.3,
                    }}
                  >
                    {persona.name}
                  </span>
                  {isCurrent && (
                    <span
                      style={{
                        fontFamily: V1.monoFont,
                        fontSize: 10,
                        letterSpacing: V1.trackingMono,
                        textTransform: 'uppercase',
                        color: V1.teal700,
                        background: V1.teal50,
                        padding: '2px 6px',
                        border: `1px solid ${V1.teal100}`,
                      }}
                    >
                      Current
                    </span>
                  )}
                </div>

                <p
                  style={{
                    margin: 0,
                    fontFamily: V1.bodyFont,
                    fontSize: 14,
                    lineHeight: V1.leadingBody,
                    color: V1.ink600,
                    marginBottom: 10,
                  }}
                >
                  {persona.description}
                </p>

                {persona.styleTags && persona.styleTags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {persona.styleTags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          fontFamily: V1.monoFont,
                          fontSize: 10.4,
                          letterSpacing: V1.trackingMono,
                          textTransform: 'uppercase',
                          padding: '3px 7px',
                          border: `1px solid ${V1.ink200}`,
                          color: V1.ink600,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {onCreateNew && (
          <div
            onClick={onCreateNew}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: 16,
              borderTop: `1px solid ${V1.ink100}`,
              cursor: 'pointer',
            }}
          >
            <span
              style={{
                fontFamily: V1.monoFont,
                fontSize: 20,
                color: V1.teal600,
                lineHeight: 1,
              }}
            >
              +
            </span>
            <div style={{ flex: 1 }}>
              <span
                style={{
                  fontFamily: V1.displayFont,
                  fontSize: 16,
                  fontWeight: V1.fwMedium,
                  color: V1.text,
                  marginRight: 10,
                }}
              >
                Add a thinking style
              </span>
              <span
                style={{
                  fontFamily: V1.monoFont,
                  fontSize: V1.textMonoPx,
                  letterSpacing: V1.trackingMono,
                  textTransform: 'uppercase',
                  color: V1.teal600,
                  cursor: 'pointer',
                }}
              >
                Create →
              </span>
            </div>
          </div>
        )}

        {limitText && (
          <div
            style={{
              textAlign: 'right',
              marginTop: 12,
              fontFamily: V1.monoFont,
              fontSize: 10.4,
              color: V1.ink400,
            }}
          >
            {limitText}
          </div>
        )}
      </div>
    </Modal>
  );
}

