import React, { useState } from 'react';
import { UserCog, Save } from 'lucide-react';
import { MOCK_PERSONA_CONFIG } from '@/mocks/internalPortal';

export default function PersonaConfig() {
  const [formality, setFormality] = useState(MOCK_PERSONA_CONFIG.formality);
  const [directness, setDirectness] = useState(MOCK_PERSONA_CONFIG.directness);
  const [terminology, setTerminology] = useState(MOCK_PERSONA_CONFIG.terminology);
  const [wordLimit, setWordLimit] = useState(MOCK_PERSONA_CONFIG.wordLimit);
  const [diagnosticProtocol, setDiagnosticProtocol] = useState(MOCK_PERSONA_CONFIG.diagnosticProtocol);
  const [confidentialityLevel, setConfidentialityLevel] = useState(MOCK_PERSONA_CONFIG.confidentialityLevel);
  const [milestoneTracking, setMilestoneTracking] = useState(MOCK_PERSONA_CONFIG.milestoneTracking);

  return (
    <div className="bg-bg-primary border border-bg-tertiary p-6" style={{ borderRadius: 0 }}>
      <div className="flex items-center gap-2 mb-6">
        <UserCog className="w-5 h-5" style={{ color: '#C108AB' }} />
        <h3 className="font-serif text-lg font-bold text-text-primary">Persona Configuration</h3>
      </div>

      <div className="space-y-6">
        {/* Formality Slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-text-primary">Formality</label>
            <span className="text-sm text-text-muted">{formality.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={formality}
            onChange={(e) => setFormality(parseFloat(e.target.value))}
            className="w-full accent-fuchsia-600"
            style={{ accentColor: '#C108AB' }}
          />
          <div className="flex justify-between text-xs text-text-muted mt-1">
            <span>Casual</span>
            <span>Formal</span>
          </div>
        </div>

        {/* Directness Slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-text-primary">Directness</label>
            <span className="text-sm text-text-muted">{directness.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={directness}
            onChange={(e) => setDirectness(parseFloat(e.target.value))}
            className="w-full"
            style={{ accentColor: '#C108AB' }}
          />
          <div className="flex justify-between text-xs text-text-muted mt-1">
            <span>Indirect</span>
            <span>Direct</span>
          </div>
        </div>

        {/* Terminology Dropdown */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">Terminology</label>
          <select
            value={terminology}
            onChange={(e) => setTerminology(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-bg-primary border border-bg-tertiary text-text-primary"
            style={{ borderRadius: 0 }}
          >
            <option value="executive">Executive</option>
            <option value="professional">Professional</option>
            <option value="accessible">Accessible</option>
          </select>
        </div>

        {/* Word Limit */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">Word Limit</label>
          <input
            type="number"
            min={50}
            max={1000}
            value={wordLimit}
            onChange={(e) => setWordLimit(parseInt(e.target.value, 10))}
            className="w-full px-3 py-2 text-sm bg-bg-primary border border-bg-tertiary text-text-primary"
            style={{ borderRadius: 0 }}
          />
        </div>

        {/* Toggles */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-primary">Diagnostic Protocol</span>
            <button
              onClick={() => setDiagnosticProtocol(!diagnosticProtocol)}
              className="focus:outline-none"
            >
              <div
                className="w-10 h-5 relative transition-colors"
                style={{
                  backgroundColor: diagnosticProtocol ? '#C108AB' : '#d1d5db',
                  borderRadius: 0,
                }}
              >
                <div
                  className="absolute top-0.5 w-4 h-4 bg-white transition-all"
                  style={{
                    left: diagnosticProtocol ? '22px' : '2px',
                    borderRadius: 0,
                  }}
                />
              </div>
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-text-primary">Confidentiality Level</span>
            <select
              value={confidentialityLevel}
              onChange={(e) => setConfidentialityLevel(e.target.value)}
              className="px-3 py-1 text-sm bg-bg-primary border border-bg-tertiary text-text-primary"
              style={{ borderRadius: 0 }}
            >
              <option value="strict">Strict</option>
              <option value="standard">Standard</option>
              <option value="relaxed">Relaxed</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-text-primary">Milestone Tracking</span>
            <button
              onClick={() => setMilestoneTracking(!milestoneTracking)}
              className="focus:outline-none"
            >
              <div
                className="w-10 h-5 relative transition-colors"
                style={{
                  backgroundColor: milestoneTracking ? '#C108AB' : '#d1d5db',
                  borderRadius: 0,
                }}
              >
                <div
                  className="absolute top-0.5 w-4 h-4 bg-white transition-all"
                  style={{
                    left: milestoneTracking ? '22px' : '2px',
                    borderRadius: 0,
                  }}
                />
              </div>
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-bg-tertiary">
          <button
            className="flex items-center gap-2 px-6 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#C108AB', borderRadius: 0 }}
          >
            <Save className="w-4 h-4" />
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}
