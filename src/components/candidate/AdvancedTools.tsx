import React from 'react';
import { Video, Bot, ClipboardList, ArrowRight } from 'lucide-react';

export interface ToolCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const MOCK_TOOLS: ToolCard[] = [
  {
    id: 'video-intro',
    title: 'Video Introduction',
    description: 'Record a 90-second executive intro for clients to preview before the first call.',
    icon: <Video className="w-6 h-6 text-accent" />,
  },
  {
    id: 'ai-sim',
    title: 'AI Interview Simulator',
    description: 'Practice role-specific scenarios with adaptive AI follow-ups and scoring.',
    icon: <Bot className="w-6 h-6 text-accent" />,
  },
  {
    id: 'behavioral',
    title: 'Behavioral Assessment',
    description: 'Map leadership traits against the TRIDENT framework and benchmark peers.',
    icon: <ClipboardList className="w-6 h-6 text-accent" />,
  },
];

interface AdvancedToolsProps {
  tools?: ToolCard[];
}

export function AdvancedTools({ tools = MOCK_TOOLS }: AdvancedToolsProps) {
  return (
    <div>
      <h2 className="font-serif text-lg font-bold text-text-primary mb-4">Advanced Tools</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tools.map((tool) => (
          <div key={tool.id} className="bg-bg-secondary border border-bg-tertiary p-5 flex flex-col">
            <div className="mb-4">{tool.icon}</div>
            <h3 className="font-serif text-base font-bold text-text-primary">{tool.title}</h3>
            <p className="text-sm text-text-muted mt-2 flex-1">{tool.description}</p>
            <button className="mt-4 inline-flex items-center gap-2 self-start px-4 py-2 bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors">
              Launch
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
