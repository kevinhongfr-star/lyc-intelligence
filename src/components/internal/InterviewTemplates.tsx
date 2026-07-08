import React from 'react';
import { FileText, Layers, Clock, MessageSquare } from 'lucide-react';
import { MOCK_INTERVIEW_TEMPLATES } from '@/mocks/internalPortal';

export default function InterviewTemplates() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {MOCK_INTERVIEW_TEMPLATES.map(template => (
          <div
            key={template.id}
            className="border border-bg-tertiary bg-bg-primary p-4 hover:shadow-sm transition-shadow flex flex-col"
            style={{ borderRadius: 0 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-[#C108AB]" />
              <span className="font-medium text-text-primary">{template.name}</span>
            </div>

            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <Layers className="w-3 h-3" />
                <span>{template.stages} stages</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <Clock className="w-3 h-3" />
                <span>{template.duration}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <MessageSquare className="w-3 h-3" />
                <span>{template.questionsPerStage} questions per stage</span>
              </div>
            </div>

            <button
              className="mt-4 w-full px-3 py-2 bg-[#C108AB] hover:bg-[#A00790] text-white text-xs font-medium transition-colors"
              style={{ borderRadius: 0 }}
            >
              Use Template
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
