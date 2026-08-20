import React, { useState } from 'react';
import { V1 } from '@/styles/v1-tokens';
import type { Persona } from '@/components/nexus/PersonaSwitcherModal';

const DEFAULT_PERSONAS: Persona[] = [
  {
    id: 'strategist',
    name: 'Strategist',
    description:
      'Systematic thinker who maps decision trees before acting. Prefers evidence over intuition and weights long-term tradeoffs over immediate wins.',
    styleTags: ['Data-first', 'Long-term', 'Risk-aware'],
  },
  {
    id: 'storyteller',
    name: 'Storyteller',
    description:
      'Narrative-driven communicator who frames positions as arcs. Uses metaphor and analogy to align groups. Prefers clarity and emotional resonance over exhaustive proof.',
    styleTags: ['Narrative', 'Group alignment', 'Charismatic'],
  },
  {
    id: 'coach',
    name: 'Coach',
    description:
      'Collaborative thinker who surfaces others\' perspectives before deciding. Prioritizes team buy-in and developmental growth. Asks more questions than giving answers.',
    styleTags: ['Collaborative', 'Inquiry-first', 'Developmental'],
  },
];

const TIER_INFO: Record<string, number | 'Unlimited'> = {
  Starter: 1,
  Professional: 3,
  Executive: 'Unlimited',
  Council: 'Unlimited',
};

const CURRENT_TIER = 'Professional';

interface PersonaEditorState {
  id?: string;
  name: string;
  description: string;
  styleTags: string;
}

const EMPTY_EDITOR: PersonaEditorState = {
  name: '',
  description: '',
  styleTags: '',
};

export default function PersonasSettingsTab() {
  const [personas, setPersonas] = useState<Persona[]>(DEFAULT_PERSONAS);
  const [activeId, setActiveId] = useState<string>(DEFAULT_PERSONAS[0].id);
  const [showEditor, setShowEditor] = useState(false);
  const [editor, setEditor] = useState<PersonaEditorState>(EMPTY_EDITOR);

  const tierLimit = TIER_INFO[CURRENT_TIER];
  const canAddMore =
    tierLimit === 'Unlimited' ? true : personas.length < (tierLimit as number);

  const defaultIds = new Set(DEFAULT_PERSONAS.map((p) => p.id));

  const handleAddClick = () => {
    if (!canAddMore) return;
    setEditor(EMPTY_EDITOR);
    setShowEditor(true);
  };

  const handleEditClick = (persona: Persona) => {
    setEditor({
      id: persona.id,
      name: persona.name,
      description: persona.description,
      styleTags: persona.styleTags?.join(', ') ?? '',
    });
    setShowEditor(true);
  };

  const handleCancel = () => {
    setEditor(EMPTY_EDITOR);
    setShowEditor(false);
  };

  const handleSave = () => {
    if (!editor.name.trim()) return;

    const tags = editor.styleTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (editor.id) {
      setPersonas((prev) =>
        prev.map((p) =>
          p.id === editor.id
            ? { ...p, name: editor.name.trim(), description: editor.description.trim(), styleTags: tags }
            : p,
        ),
      );
    } else {
      const newId = `persona-${Date.now()}`;
      setPersonas((prev) => [
        ...prev,
        {
          id: newId,
          name: editor.name.trim(),
          description: editor.description.trim(),
          styleTags: tags,
        },
      ]);
    }

    setEditor(EMPTY_EDITOR);
    setShowEditor(false);
  };

  const handleDelete = (id: string) => {
    if (id === activeId) return;
    if (defaultIds.has(id)) return;
    setPersonas((prev) => prev.filter((p) => p.id !== id));
  };

  const handleActivate = (id: string) => {
    setActiveId(id);
  };

  return (
    <div
      style={{
        fontFamily: V1.bodyFont,
        color: V1.text,
      }}
    >
      {/* ── Section Header ── */}
      <div>
        <div
          style={{
            fontFamily: V1.monoFont,
            fontSize: V1.textMonoPx,
            letterSpacing: V1.trackingMono,
            textTransform: 'uppercase',
            color: V1.teal600,
            marginBottom: 8,
          }}
        >
          Personas
        </div>
        <h2
          style={{
            fontFamily: V1.displayFont,
            fontSize: 32,
            fontWeight: V1.fwBold,
            letterSpacing: V1.trackingTight,
            lineHeight: V1.leadingHeading,
            color: V1.ink900,
            margin: '0 0 10px 0',
          }}
        >
          Your thinking styles
        </h2>
        <p
          style={{
            fontFamily: V1.displayFont,
            fontStyle: 'italic',
            fontSize: 18,
            lineHeight: V1.leadingBody,
            color: V1.ink600,
            margin: 0,
          }}
        >
          Personas adjust how NEXUS frames and challenges your thinking. They're starting points —
          not boxes. We'll refine them as we work together.
        </p>
        <p
          style={{
            fontFamily: V1.monoFont,
            fontSize: '0.7rem',
            lineHeight: V1.leadingLabel,
            color: V1.ink500,
            margin: '12px 0 0 0',
          }}
        >
          Based on your {CURRENT_TIER} tier, you can have{' '}
          {tierLimit === 'Unlimited' ? 'all available personas' : `up to ${tierLimit} personas`}.
          <span style={{ opacity: 0.7 }}>
            {' '}
            (Starter = 1, Professional = 3, Executive/Council = all available)
          </span>
        </p>
      </div>

      {/* ── Divider ── */}
      <div
        style={{
          height: 1,
          background: V1.ink100,
          margin: '32px 0',
        }}
      />

      {/* ── Persona Cards Grid ── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        {personas.map((persona) => {
          const isActive = persona.id === activeId;
          const isDefault = defaultIds.has(persona.id);
          const canDelete = !isActive && !isDefault;

          return (
            <div
              key={persona.id}
              style={{
                flex: '1 1 260px',
                maxWidth: 360,
                minWidth: 260,
                border: `1px solid ${isActive ? V1.teal600 : V1.ink200}`,
                borderWidth: isActive ? 2 : 1,
                background: isActive ? V1.teal50 : V1.white,
                padding: 24,
                marginBottom: 16,
                position: 'relative',
              }}
            >
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    fontFamily: V1.monoFont,
                    fontSize: 10.4,
                    letterSpacing: V1.trackingMono,
                    textTransform: 'uppercase',
                    color: V1.teal700,
                  }}
                >
                  ACTIVE · current style
                </div>
              )}

              <h3
                style={{
                  fontFamily: V1.displayFont,
                  fontSize: 22,
                  fontWeight: V1.fwBold,
                  color: V1.ink900,
                  margin: '0 0 12px 0',
                  lineHeight: 1.2,
                }}
              >
                {persona.name}
              </h3>

              <p
                style={{
                  fontFamily: V1.bodyFont,
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: V1.ink700,
                  margin: '0 0 16px 0',
                }}
              >
                {persona.description}
              </p>

              {persona.styleTags && persona.styleTags.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 8,
                    marginBottom: 20,
                  }}
                >
                  {persona.styleTags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontFamily: V1.monoFont,
                        fontSize: '0.65rem',
                        letterSpacing: V1.trackingMono,
                        textTransform: 'uppercase',
                        padding: '4px 8px',
                        border: `1px solid ${V1.ink200}`,
                        color: V1.ink600,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Bottom actions row */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: `1px solid ${V1.ink100}`,
                  paddingTop: 12,
                }}
              >
                <button
                  type="button"
                  onClick={() => handleEditClick(persona)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    fontFamily: V1.monoFont,
                    fontSize: V1.textMonoPx,
                    letterSpacing: V1.trackingMono,
                    textTransform: 'uppercase',
                    color: V1.teal600,
                    cursor: 'pointer',
                  }}
                >
                  Edit →
                </button>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                  }}
                >
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDelete(persona.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        padding: 0,
                        fontFamily: V1.monoFont,
                        fontSize: V1.textMonoPx,
                        letterSpacing: V1.trackingMono,
                        textTransform: 'uppercase',
                        color: '#DC2626',
                        cursor: 'pointer',
                      }}
                    >
                      Delete
                    </button>
                  )}

                  {isActive ? (
                    <span
                      style={{
                        fontFamily: V1.monoFont,
                        fontSize: V1.textMonoPx,
                        letterSpacing: V1.trackingMono,
                        textTransform: 'uppercase',
                        color: V1.teal700,
                      }}
                    >
                      ✓ Active style
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleActivate(persona.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        padding: 0,
                        fontFamily: V1.monoFont,
                        fontSize: V1.textMonoPx,
                        letterSpacing: V1.trackingMono,
                        textTransform: 'uppercase',
                        color: V1.teal800,
                        cursor: 'pointer',
                      }}
                    >
                      Use this style
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* ── Add Persona Action Card ── */}
        <div
          onClick={canAddMore ? handleAddClick : undefined}
          style={{
            flex: '1 1 260px',
            maxWidth: 360,
            minWidth: 260,
            border: `1px solid ${V1.ink200}`,
            background: V1.white,
            padding: 24,
            marginBottom: 16,
            minHeight: 220,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            cursor: canAddMore ? 'pointer' : 'not-allowed',
            opacity: canAddMore ? 1 : 0.5,
          }}
        >
          <span
            style={{
              fontFamily: V1.monoFont,
              fontSize: 24,
              color: V1.teal600,
              lineHeight: 1,
              marginBottom: 12,
            }}
          >
            +
          </span>
          <h3
            style={{
              fontFamily: V1.displayFont,
              fontSize: 20,
              fontWeight: V1.fwSemibold,
              color: V1.ink900,
              margin: '0 0 6px 0',
              lineHeight: 1.3,
            }}
          >
            Add a thinking style
          </h3>
          <p
            style={{
              fontFamily: V1.bodyFont,
              fontSize: 14,
              lineHeight: V1.leadingBody,
              color: V1.ink500,
              margin: '0 0 16px 0',
              maxWidth: 240,
            }}
          >
            Customize how NEXUS challenges your reasoning
          </p>
          <button
            type="button"
            onClick={canAddMore ? handleAddClick : undefined}
            disabled={!canAddMore}
            style={{
              background: 'transparent',
              border: `1px solid ${V1.teal800}`,
              color: V1.teal800,
              padding: '10px 20px',
              fontFamily: V1.monoFont,
              fontSize: V1.textMonoPx,
              letterSpacing: V1.trackingMono,
              textTransform: 'uppercase',
              cursor: canAddMore ? 'pointer' : 'not-allowed',
              margin: '16px auto 0 auto',
              display: 'block',
            }}
          >
            Add persona →
          </button>
        </div>
      </div>

      {/* ── Persona Create / Edit Inline View ── */}
      {showEditor && (
        <div
          style={{
            border: `1px solid ${V1.teal200}`,
            background: V1.teal50,
            padding: 20,
            marginTop: 8,
          }}
        >
          <div
            style={{
              fontFamily: V1.monoFont,
              fontSize: V1.textMonoPx,
              letterSpacing: V1.trackingMono,
              textTransform: 'uppercase',
              color: V1.teal700,
              marginBottom: 16,
            }}
          >
            {editor.id ? 'Edit persona' : 'Create new persona'}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: 'block',
                fontFamily: V1.monoFont,
                fontSize: '0.7rem',
                letterSpacing: V1.trackingMono,
                textTransform: 'uppercase',
                color: V1.ink600,
                marginBottom: 6,
              }}
            >
              Name
            </label>
            <input
              type="text"
              value={editor.name}
              onChange={(e) => setEditor({ ...editor, name: e.target.value })}
              placeholder="e.g. Strategist"
              style={{
                width: '100%',
                border: `1px solid ${V1.ink300}`,
                padding: '10px 12px',
                fontFamily: V1.bodyFont,
                fontSize: 15,
                color: V1.text,
                background: V1.white,
                outline: 'none',
              }}
              onFocus={(e) => {
                (e.target as HTMLInputElement).style.borderColor = V1.teal600;
              }}
              onBlur={(e) => {
                (e.target as HTMLInputElement).style.borderColor = V1.ink300;
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: 'block',
                fontFamily: V1.monoFont,
                fontSize: '0.7rem',
                letterSpacing: V1.trackingMono,
                textTransform: 'uppercase',
                color: V1.ink600,
                marginBottom: 6,
              }}
            >
              Description
            </label>
            <textarea
              rows={3}
              value={editor.description}
              onChange={(e) => setEditor({ ...editor, description: e.target.value })}
              placeholder="Describe how this persona thinks and communicates..."
              style={{
                width: '100%',
                border: `1px solid ${V1.ink300}`,
                padding: '10px 12px',
                fontFamily: V1.bodyFont,
                fontSize: 15,
                color: V1.text,
                background: V1.white,
                outline: 'none',
                resize: 'vertical',
                lineHeight: 1.5,
              }}
              onFocus={(e) => {
                (e.target as HTMLTextAreaElement).style.borderColor = V1.teal600;
              }}
              onBlur={(e) => {
                (e.target as HTMLTextAreaElement).style.borderColor = V1.ink300;
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: 'block',
                fontFamily: V1.monoFont,
                fontSize: '0.7rem',
                letterSpacing: V1.trackingMono,
                textTransform: 'uppercase',
                color: V1.ink600,
                marginBottom: 6,
              }}
            >
              Style tags
            </label>
            <input
              type="text"
              value={editor.styleTags}
              onChange={(e) => setEditor({ ...editor, styleTags: e.target.value })}
              placeholder="e.g. Data-first, Long-term, Risk-aware"
              style={{
                width: '100%',
                border: `1px solid ${V1.ink300}`,
                padding: '10px 12px',
                fontFamily: V1.bodyFont,
                fontSize: 15,
                color: V1.text,
                background: V1.white,
                outline: 'none',
              }}
              onFocus={(e) => {
                (e.target as HTMLInputElement).style.borderColor = V1.teal600;
              }}
              onBlur={(e) => {
                (e.target as HTMLInputElement).style.borderColor = V1.ink300;
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <button
              type="button"
              onClick={handleSave}
              disabled={!editor.name.trim()}
              style={{
                background: editor.name.trim() ? V1.teal800 : V1.ink300,
                border: `1px solid ${editor.name.trim() ? V1.teal800 : V1.ink300}`,
                color: V1.white,
                padding: '10px 20px',
                fontFamily: V1.monoFont,
                fontSize: V1.textMonoPx,
                letterSpacing: V1.trackingMono,
                textTransform: 'uppercase',
                cursor: editor.name.trim() ? 'pointer' : 'not-allowed',
                opacity: editor.name.trim() ? 1 : 0.5,
              }}
            >
              Save
            </button>
            <button
              type="button"
              onClick={handleCancel}
              style={{
                background: 'transparent',
                border: 'none',
                padding: 0,
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
          </div>
        </div>
      )}
    </div>
  );
}
