import { create } from 'zustand';
import { getSupabase } from '../services/supabaseApi';

export type MemoryType = 'goal' | 'pain_point' | 'strength' | 'experience' | 'preference' | 'insight' | 'assessment_note' | 'document_note';

export interface Memory {
  id: string;
  user_id: string;
  memory_type: MemoryType;
  content: string;
  source: string | null;
  session_id: string | null;
  confidence: number;
  is_active: boolean;
  created_at: string;
}

export interface ChatSession {
  id: string;
  user_id: string | null;
  anonymous_email: string | null;
  session_title: string | null;
  created_at: string;
  last_message_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface MemoryStore {
  memories: Memory[];
  recentSessions: ChatSession[];
  currentSessionId: string | null;
  currentSessionMessages: ChatMessage[];
  isLoading: boolean;
  
  // Actions
  loadMemories: (userId: string) => Promise<void>;
  loadRecentSessions: (userId: string) => Promise<void>;
  loadSessionMessages: (sessionId: string) => Promise<void>;
  addExplicitGoal: (userId: string, goal: string, sessionId?: string) => Promise<void>;
  deactivateMemory: (memoryId: string) => Promise<void>;
  extractAndStoreMemories: (userId: string, messages: ChatMessage[], sessionId?: string) => Promise<void>;
  createSession: (userId: string, email?: string) => Promise<string>;
  addMessage: (sessionId: string, role: 'user' | 'assistant', content: string) => Promise<void>;
  updateSessionTitle: (sessionId: string, title: string) => Promise<void>;
  clearCurrentSession: () => void;
}

export const useMemoryStore = create<MemoryStore>((set, get) => ({
  memories: [],
  recentSessions: [],
  currentSessionId: null,
  currentSessionMessages: [],
  isLoading: false,

  loadMemories: async (userId: string) => {
    set({ isLoading: true });
    try {
      const sb = getSupabase();
      const { data, error } = await sb
        .from('memories')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        set({ memories: data as Memory[] });
      }
    } catch (e) {
      console.error('[MemoryStore] loadMemories error:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  loadRecentSessions: async (userId: string) => {
    try {
      const sb = getSupabase();
      const { data, error } = await sb
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('last_message_at', { ascending: false })
        .limit(10);

      if (!error && data) {
        set({ recentSessions: data as ChatSession[] });
      }
    } catch (e) {
      console.error('[MemoryStore] loadRecentSessions error:', e);
    }
  },

  loadSessionMessages: async (sessionId: string) => {
    try {
      const sb = getSupabase();
      const { data, error } = await sb
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        set({ currentSessionId: sessionId, currentSessionMessages: data as ChatMessage[] });
      }
    } catch (e) {
      console.error('[MemoryStore] loadSessionMessages error:', e);
    }
  },

  addExplicitGoal: async (userId: string, goal: string, sessionId?: string) => {
    try {
      const sb = getSupabase();
      await sb.from('memories').insert({
        user_id: userId,
        memory_type: 'goal',
        content: goal,
        source: 'explicit_user_input',
        session_id: sessionId || null,
        confidence: 1.0,
        is_active: true
      });
      // Reload memories
      await get().loadMemories(userId);
    } catch (e) {
      console.error('[MemoryStore] addExplicitGoal error:', e);
    }
  },

  deactivateMemory: async (memoryId: string) => {
    try {
      const sb = getSupabase();
      await sb
        .from('memories')
        .update({ is_active: false })
        .eq('id', memoryId);
      
      set(state => ({
        memories: state.memories.filter(m => m.id !== memoryId)
      }));
    } catch (e) {
      console.error('[MemoryStore] deactivateMemory error:', e);
    }
  },

  extractAndStoreMemories: async (userId: string, messages: ChatMessage[], sessionId?: string) => {
    try {
      await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, messages, sessionId })
      });
      // Reload memories after extraction
      await get().loadMemories(userId);
    } catch (e) {
      console.error('[MemoryStore] extractAndStoreMemories error:', e);
    }
  },

  createSession: async (userId: string, email?: string) => {
    try {
      const sb = getSupabase();
      const { data, error } = await sb
        .from('chat_sessions')
        .insert({
          user_id: userId,
          anonymous_email: email || null,
          session_title: 'New conversation',
          last_message_at: new Date().toISOString()
        })
        .select()
        .single();

      if (!error && data) {
        set({ currentSessionId: data.id, currentSessionMessages: [] });
        // Reload sessions
        await get().loadRecentSessions(userId);
        return data.id;
      }
    } catch (e) {
      console.error('[MemoryStore] createSession error:', e);
    }
    return '';
  },

  addMessage: async (sessionId: string, role: 'user' | 'assistant', content: string) => {
    try {
      const sb = getSupabase();
      await sb.from('chat_messages').insert({
        session_id: sessionId,
        role,
        content
      });
      
      await sb
        .from('chat_sessions')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', sessionId);

      // Update local state
      set(state => ({
        currentSessionMessages: [...state.currentSessionMessages, {
          id: Date.now().toString(),
          session_id: sessionId,
          role,
          content,
          created_at: new Date().toISOString()
        }]
      }));
    } catch (e) {
      console.error('[MemoryStore] addMessage error:', e);
    }
  },

  updateSessionTitle: async (sessionId: string, title: string) => {
    try {
      const sb = getSupabase();
      await sb
        .from('chat_sessions')
        .update({ session_title: title })
        .eq('id', sessionId);
    } catch (e) {
      console.error('[MemoryStore] updateSessionTitle error:', e);
    }
  },

  clearCurrentSession: () => {
    set({ currentSessionId: null, currentSessionMessages: [] });
  }
}));
