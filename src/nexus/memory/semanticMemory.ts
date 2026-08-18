import type { EpisodicMemoryRecord } from './episodicMemory';
import { getRelated } from './episodicMemory';

export type GoalStatus = 'active' | 'completed' | 'on_hold' | 'abandoned';

export interface Goal {
  id: string;
  text: string;
  status: GoalStatus;
  created_at: string;
}

export interface UserPreferences {
  communication_style?: string;
  focus_areas: string[];
  tone_preference?: string;
}

export interface UserPatterns {
  typical_topics: string[];
  engagement_patterns?: string;
  common_questions: string[];
}

export interface CareerContext {
  role?: string;
  industry?: string;
  level?: string;
  company_size?: string;
}

export interface UserModel {
  goals: Goal[];
  preferences: UserPreferences;
  patterns: UserPatterns;
  career_context: CareerContext;
}

export interface SemanticMemoryRecord {
  id?: string;
  user_id: string;
  user_model: UserModel;
  last_updated: string;
  update_count: number;
}

function createDefaultUserModel(): UserModel {
  return {
    goals: [],
    preferences: {
      communication_style: undefined,
      focus_areas: [],
      tone_preference: undefined,
    },
    patterns: {
      typical_topics: [],
      engagement_patterns: undefined,
      common_questions: [],
    },
    career_context: {
      role: undefined,
      industry: undefined,
      level: undefined,
      company_size: undefined,
    },
  };
}

function genId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export class SemanticStore {
  private record: SemanticMemoryRecord;

  constructor(userId: string, existing?: Partial<SemanticMemoryRecord>) {
    const now = new Date().toISOString();
    const model = existing?.user_model || createDefaultUserModel();

    this.record = {
      id: existing?.id,
      user_id: userId,
      user_model: {
        goals: Array.isArray(model.goals) ? model.goals : [],
        preferences: {
          communication_style: model.preferences?.communication_style,
          focus_areas: Array.isArray(model.preferences?.focus_areas)
            ? model.preferences.focus_areas
            : [],
          tone_preference: model.preferences?.tone_preference,
        },
        patterns: {
          typical_topics: Array.isArray(model.patterns?.typical_topics)
            ? model.patterns.typical_topics
            : [],
          engagement_patterns: model.patterns?.engagement_patterns,
          common_questions: Array.isArray(model.patterns?.common_questions)
            ? model.patterns.common_questions
            : [],
        },
        career_context: {
          role: model.career_context?.role,
          industry: model.career_context?.industry,
          level: model.career_context?.level,
          company_size: model.career_context?.company_size,
        },
      },
      last_updated: existing?.last_updated || now,
      update_count: existing?.update_count ?? 0,
    };
  }

  getUserId(): string {
    return this.record.user_id;
  }

  getUserModel(): UserModel {
    return JSON.parse(JSON.stringify(this.record.user_model));
  }

  getRecord(): SemanticMemoryRecord {
    return {
      ...this.record,
      user_model: JSON.parse(JSON.stringify(this.record.user_model)),
    };
  }

  getUpdateCount(): number {
    return this.record.update_count;
  }

  getLastUpdated(): string {
    return this.record.last_updated;
  }

  private bumpUpdate(): void {
    this.record.update_count += 1;
    this.record.last_updated = new Date().toISOString();
  }

  addGoal(text: string, initialStatus: GoalStatus = 'active'): Goal {
    const goal: Goal = {
      id: genId(),
      text: text.trim(),
      status: initialStatus,
      created_at: new Date().toISOString(),
    };
    this.record.user_model.goals.push(goal);
    this.bumpUpdate();
    return goal;
  }

  updateGoalStatus(goalId: string, status: GoalStatus): boolean {
    const goal = this.record.user_model.goals.find(g => g.id === goalId);
    if (!goal) return false;
    if (goal.status === status) return false;
    goal.status = status;
    this.bumpUpdate();
    return true;
  }

  removeGoal(goalId: string): boolean {
    const before = this.record.user_model.goals.length;
    this.record.user_model.goals = this.record.user_model.goals.filter(
      g => g.id !== goalId
    );
    if (this.record.user_model.goals.length !== before) {
      this.bumpUpdate();
      return true;
    }
    return false;
  }

  setCommunicationStyle(style: string): void {
    const trimmed = style.trim();
    if (this.record.user_model.preferences.communication_style === trimmed) return;
    this.record.user_model.preferences.communication_style = trimmed;
    this.bumpUpdate();
  }

  setTonePreference(tone: string): void {
    const trimmed = tone.trim();
    if (this.record.user_model.preferences.tone_preference === trimmed) return;
    this.record.user_model.preferences.tone_preference = trimmed;
    this.bumpUpdate();
  }

  setPreference<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ): void {
    const current = this.record.user_model.preferences[key];
    const serialized = JSON.stringify(value);
    const currentSerialized = JSON.stringify(current);
    if (serialized === currentSerialized) return;
    (this.record.user_model.preferences[key] as UserPreferences[K]) = value;
    this.bumpUpdate();
  }

  addFocusArea(area: string): boolean {
    const trimmed = area.trim();
    if (!trimmed) return false;
    if (this.record.user_model.preferences.focus_areas.includes(trimmed)) return false;
    this.record.user_model.preferences.focus_areas.push(trimmed);
    this.bumpUpdate();
    return true;
  }

  removeFocusArea(area: string): boolean {
    const before = this.record.user_model.preferences.focus_areas.length;
    this.record.user_model.preferences.focus_areas =
      this.record.user_model.preferences.focus_areas.filter(a => a !== area);
    if (this.record.user_model.preferences.focus_areas.length !== before) {
      this.bumpUpdate();
      return true;
    }
    return false;
  }

  recordTypicalTopic(topic: string): boolean {
    const trimmed = topic.trim();
    if (!trimmed) return false;
    if (this.record.user_model.patterns.typical_topics.includes(trimmed)) return false;
    this.record.user_model.patterns.typical_topics.push(trimmed);
    this.bumpUpdate();
    return true;
  }

  setEngagementPatterns(patterns: string): void {
    const trimmed = patterns.trim();
    if (this.record.user_model.patterns.engagement_patterns === trimmed) return;
    this.record.user_model.patterns.engagement_patterns = trimmed || undefined;
    this.bumpUpdate();
  }

  recordCommonQuestion(question: string): boolean {
    const trimmed = question.trim();
    if (!trimmed) return false;
    if (this.record.user_model.patterns.common_questions.includes(trimmed)) return false;
    this.record.user_model.patterns.common_questions.push(trimmed);
    this.bumpUpdate();
    return true;
  }

  recordPattern<K extends keyof UserPatterns>(
    key: K,
    value: UserPatterns[K]
  ): void {
    const current = this.record.user_model.patterns[key];
    const serialized = JSON.stringify(value);
    const currentSerialized = JSON.stringify(current);
    if (serialized === currentSerialized) return;
    (this.record.user_model.patterns[key] as UserPatterns[K]) = value;
    this.bumpUpdate();
  }

  setCareerContext(patch: Partial<CareerContext>): boolean {
    const before = JSON.stringify(this.record.user_model.career_context);
    if (patch.role !== undefined) this.record.user_model.career_context.role = patch.role.trim() || undefined;
    if (patch.industry !== undefined) this.record.user_model.career_context.industry = patch.industry.trim() || undefined;
    if (patch.level !== undefined) this.record.user_model.career_context.level = patch.level.trim() || undefined;
    if (patch.company_size !== undefined) this.record.user_model.career_context.company_size = patch.company_size.trim() || undefined;
    const after = JSON.stringify(this.record.user_model.career_context);
    if (before !== after) {
      this.bumpUpdate();
      return true;
    }
    return false;
  }
}

export interface RetrievalResult {
  episodic: {
    memory: EpisodicMemoryRecord;
    similarity: number;
  }[];
  semantic: UserModel;
  formatForPrompt: () => string;
}

export class RetrievalPipeline {
  private episodicStore: EpisodicMemoryRecord[];
  private semanticStore: SemanticStore;

  constructor(
    episodicStore: EpisodicMemoryRecord[],
    semanticStore: SemanticStore
  ) {
    this.episodicStore = episodicStore;
    this.semanticStore = semanticStore;
  }

  retrieve(queryText: string, topK: number = 5): RetrievalResult {
    const related = getRelated(queryText, this.episodicStore, topK);
    const semantic = this.semanticStore.getUserModel();

    return {
      episodic: related,
      semantic,
      formatForPrompt: () =>
        formatRetrievedForPrompt(related, semantic, this.semanticStore.getUpdateCount()),
    };
  }
}

export function formatRetrievedForPrompt(
  episodic: {
    memory: EpisodicMemoryRecord;
    similarity: number;
  }[],
  semantic: UserModel,
  semanticUpdateCount?: number
): string {
  const lines: string[] = [];
  lines.push('[MEMORY]');
  lines.push('');
  lines.push('--- EPISODIC MEMORY (Relevant Past Moments) ---');
  if (episodic.length === 0) {
    lines.push('No closely related episodic memories.');
  } else {
    for (const result of episodic) {
      const { memory, similarity } = result;
      const ts = memory.ts ? new Date(memory.ts).toISOString().slice(0, 10) : 'unknown';
      const imp = (memory.importance_score ?? 0).toFixed(2);
      const sim = similarity.toFixed(2);
      lines.push(
        `[${memory.memory_type.toUpperCase()}] [${ts}] [importance=${imp} relevance=${sim}] ${memory.content}`
      );
    }
  }
  lines.push('');
  lines.push('--- SEMANTIC MEMORY (User Model) ---');

  if (semanticUpdateCount !== undefined) {
    lines.push(`(Model revised ${semanticUpdateCount} time${semanticUpdateCount === 1 ? '' : 's'})`);
  }

  lines.push('');
  lines.push('Goals:');
  if (semantic.goals.length === 0) {
    lines.push('  (none recorded)');
  } else {
    for (const g of semantic.goals) {
      lines.push(`  - [${g.status}] ${g.text} (created ${g.created_at.slice(0, 10)})`);
    }
  }

  lines.push('');
  lines.push('Preferences:');
  if (semantic.preferences.communication_style) {
    lines.push(`  - Communication style: ${semantic.preferences.communication_style}`);
  }
  if (semantic.preferences.tone_preference) {
    lines.push(`  - Tone preference: ${semantic.preferences.tone_preference}`);
  }
  if (semantic.preferences.focus_areas.length > 0) {
    lines.push(`  - Focus areas: ${semantic.preferences.focus_areas.join(', ')}`);
  }
  if (
    !semantic.preferences.communication_style &&
    !semantic.preferences.tone_preference &&
    semantic.preferences.focus_areas.length === 0
  ) {
    lines.push('  (none recorded)');
  }

  lines.push('');
  lines.push('Patterns:');
  if (semantic.patterns.typical_topics.length > 0) {
    lines.push(`  - Typical topics: ${semantic.patterns.typical_topics.join(', ')}`);
  }
  if (semantic.patterns.engagement_patterns) {
    lines.push(`  - Engagement patterns: ${semantic.patterns.engagement_patterns}`);
  }
  if (semantic.patterns.common_questions.length > 0) {
    lines.push('  - Common questions:');
    for (const q of semantic.patterns.common_questions) {
      lines.push(`    * ${q}`);
    }
  }
  if (
    semantic.patterns.typical_topics.length === 0 &&
    !semantic.patterns.engagement_patterns &&
    semantic.patterns.common_questions.length === 0
  ) {
    lines.push('  (none recorded)');
  }

  lines.push('');
  lines.push('Career context:');
  const cc = semantic.career_context;
  const ccParts: string[] = [];
  if (cc.role) ccParts.push(`Role: ${cc.role}`);
  if (cc.industry) ccParts.push(`Industry: ${cc.industry}`);
  if (cc.level) ccParts.push(`Level: ${cc.level}`);
  if (cc.company_size) ccParts.push(`Company size: ${cc.company_size}`);
  if (ccParts.length === 0) {
    lines.push('  (none recorded)');
  } else {
    for (const part of ccParts) {
      lines.push(`  - ${part}`);
    }
  }

  lines.push('');
  lines.push('[/MEMORY]');

  return lines.join('\n');
}
