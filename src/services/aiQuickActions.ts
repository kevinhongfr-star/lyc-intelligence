import { sendChatMessage } from './coze';
export type AIAction = 'email' | 'cv' | 'shortlist' | 'overview' | 'feedback';
const PROMPTS: Record<AIAction, string> = {
  email: 'Write a professional outreach email from LYC Partners to {name} about a {mandate} opportunity. Warm but professional, under 150 words.',
  cv: 'Summarize this candidate profile in 3-4 bullet points for a {mandate} mandate. Focus on career trajectory and skills alignment.',
  shortlist: 'Write a 2-paragraph professional summary of {name} for a client shortlist. Role: {title} at {company}. Professional tone for executive review.',
  overview: 'Provide a concise internal candidate overview for {name}. Include TRIDENT assessment, strengths, and risk factors.',
  feedback: 'Generate interview feedback notes for {name} based on their profile and the {mandate} role requirements.',
};
export async function executeAIAction(action: AIAction, context: { name: string; title?: string; company?: string; mandate: string; viewMode: 'internal' | 'external' }): Promise<string> {
  const prompt = PROMPTS[action].replace('{name}', context.name).replace('{title}', context.title || '').replace('{company}', context.company || '').replace('{mandate}', context.mandate);
  return sendChatMessage(prompt, 'quick-action');
}
