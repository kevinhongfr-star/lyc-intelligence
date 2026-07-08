import React, { useState } from 'react';
import { FileCode2, ChevronDown, ChevronRight, Save } from 'lucide-react';
import { MOCK_PROMPTS } from '@/mocks/internalPortal';

const MOCK_PROMPT_TEXT: Record<string, string> = {
  pr1: 'You are an executive career advisor for LYC Intelligence. Maintain a professional yet approachable tone. Prioritize actionable insights over generic advice. When discussing career transitions, focus on strategic positioning and cross-border opportunities. Always respect client confidentiality and maintain strict data handling protocols. Limit responses to be concise and impactful.',
  pr2: 'You are an interview preparation coach. Help the user prepare for executive-level interviews by providing structured frameworks, behavioral question practice, and strategic communication tips. Focus on STAR methodology for behavioral questions and emphasize leadership narrative building. Adapt complexity to the seniority of the target role.',
  pr3: 'You are a career strategy consultant. Help the user develop a comprehensive career advancement plan. Analyze their current position, identify growth opportunities, and create actionable milestones. Consider market trends, industry dynamics, and personal aspirations. Provide recommendations for skill development and network expansion.',
};

export default function PromptEditor() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [promptTexts, setPromptTexts] = useState<Record<string, string>>(MOCK_PROMPT_TEXT);
  const [activeStates, setActiveStates] = useState<Record<string, boolean>>(
    Object.fromEntries(MOCK_PROMPTS.map((p) => [p.id, p.isActive]))
  );

  const toggleActive = (id: string) => {
    setActiveStates((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const updateText = (id: string, text: string) => {
    setPromptTexts((prev) => ({ ...prev, [id]: text }));
  };

  return (
    <div className="bg-bg-primary border border-bg-tertiary" style={{ borderRadius: 0 }}>
      <div className="p-4 border-b border-bg-tertiary bg-bg-secondary flex items-center gap-2">
        <FileCode2 className="w-5 h-5" style={{ color: '#C108AB' }} />
        <span className="text-sm font-medium text-text-primary">Prompt Templates</span>
      </div>

      <div className="divide-y divide-bg-tertiary">
        {MOCK_PROMPTS.map((prompt) => {
          const isExpanded = expandedId === prompt.id;
          return (
            <div key={prompt.id}>
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-bg-secondary transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : prompt.id)}
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-text-muted shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-text-muted shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">{prompt.name}</p>
                  <p className="text-xs text-text-muted">
                    {prompt.useCase} | Last modified: {prompt.lastModified}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleActive(prompt.id);
                  }}
                  className="focus:outline-none shrink-0"
                >
                  <div
                    className="w-10 h-5 relative transition-colors"
                    style={{
                      backgroundColor: activeStates[prompt.id] ? '#C108AB' : '#d1d5db',
                      borderRadius: 0,
                    }}
                  >
                    <div
                      className="absolute top-0.5 w-4 h-4 bg-white transition-all"
                      style={{
                        left: activeStates[prompt.id] ? '22px' : '2px',
                        borderRadius: 0,
                      }}
                    />
                  </div>
                </button>
              </div>

              {isExpanded && (
                <div className="px-4 pb-4">
                  <textarea
                    value={promptTexts[prompt.id] || ''}
                    onChange={(e) => updateText(prompt.id, e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 text-sm bg-bg-secondary border border-bg-tertiary text-text-primary font-mono resize-y"
                    style={{ borderRadius: 0 }}
                  />
                  <div className="mt-2 flex justify-end">
                    <button
                      className="flex items-center gap-2 px-4 py-1.5 text-xs font-semibold text-white"
                      style={{ backgroundColor: '#C108AB', borderRadius: 0 }}
                    >
                      <Save className="w-3 h-3" />
                      Save
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
