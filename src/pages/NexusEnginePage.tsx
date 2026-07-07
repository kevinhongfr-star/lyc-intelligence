import { PersonaConfig } from '@/components/internal/PersonaConfig';
import { ConversationAnalytics } from '@/components/internal/ConversationAnalytics';
import { PromptTemplateEditor } from '@/components/internal/PromptTemplateEditor';
import { ActionReviewQueue } from '@/components/internal/ActionReviewQueue';
import { MemoryManagement } from '@/components/internal/MemoryManagement';

export function NexusEnginePage() {
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-bold text-text-primary">NEXUS ENGINE</h1>

      <PersonaConfig />
      <ConversationAnalytics />
      <PromptTemplateEditor />
      <ActionReviewQueue />
      <MemoryManagement />
    </div>
  );
}
