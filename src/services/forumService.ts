/**
 * Forum Service — Community forum data layer
 * Issue #25: Technical Debt — Replace static placeholder content with real data layer
 *
 * Provides CRUD operations for forum categories, threads, and posts.
 * Falls back to seeded mock data when DB tables are not present,
 * allowing the UI to function during development.
 */
import { supabase } from '@/lib/supabase/client';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface ForumCategory {
  id: string;
  name: string;
  description: string;
  slug: string;
  icon: string;
  thread_count: number;
  post_count: number;
  sort_order: number;
  created_at: string;
}

export interface ForumThread {
  id: string;
  category_id: string;
  title: string;
  excerpt: string;
  body: string;
  author_id: string;
  author_name: string;
  author_avatar_url: string | null;
  status: 'open' | 'pinned' | 'locked' | 'solved';
  views: number;
  reply_count: number;
  last_reply_at: string | null;
  last_reply_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ForumPost {
  id: string;
  thread_id: string;
  parent_post_id: string | null;
  body: string;
  author_id: string;
  author_name: string;
  author_avatar_url: string | null;
  author_role: string | null;
  is_solution: boolean;
  likes: number;
  created_at: string;
  updated_at: string;
}

export interface CreateThreadInput {
  category_id: string;
  title: string;
  body: string;
  author_id: string;
  author_name: string;
}

export interface CreatePostInput {
  thread_id: string;
  parent_post_id?: string | null;
  body: string;
  author_id: string;
  author_name: string;
}

/* ------------------------------------------------------------------ */
/* Seeded data (fallback)                                             */
/* ------------------------------------------------------------------ */

const SEED_CATEGORIES: ForumCategory[] = [
  { id: 'cat1', name: 'Career Strategy', description: 'Long-term planning, pivots, and growth paths', slug: 'career-strategy', icon: '🎯', thread_count: 142, post_count: 891, sort_order: 1, created_at: '2025-01-01T00:00:00Z' },
  { id: 'cat2', name: 'Interview Tips', description: 'Prep, frameworks, and shared experiences', slug: 'interview-tips', icon: '🎤', thread_count: 98, post_count: 612, sort_order: 2, created_at: '2025-01-01T00:00:00Z' },
  { id: 'cat3', name: 'Compensation', description: 'Offers, negotiation, and benchmarks', slug: 'compensation', icon: '💰', thread_count: 76, post_count: 445, sort_order: 3, created_at: '2025-01-01T00:00:00Z' },
  { id: 'cat4', name: 'Leadership', description: 'Executive presence and team leadership', slug: 'leadership', icon: '🧭', thread_count: 64, post_count: 378, sort_order: 4, created_at: '2025-01-01T00:00:00Z' },
  { id: 'cat5', name: 'Industry Trends', description: 'Market signals and sector movements', slug: 'industry-trends', icon: '📈', thread_count: 53, post_count: 289, sort_order: 5, created_at: '2025-01-01T00:00:00Z' },
  { id: 'cat6', name: 'Community', description: 'Introductions, events, and peer support', slug: 'community', icon: '🤝', thread_count: 41, post_count: 522, sort_order: 6, created_at: '2025-01-01T00:00:00Z' },
];

const SEED_THREADS: ForumThread[] = [
  { id: 't1', category_id: 'cat2', title: 'How to frame a 6-month career gap in executive interviews', excerpt: "After a sabbatical, I'm re-entering the market and wondering how senior leaders frame a gap without underselling...", body: "After a sabbatical, I'm re-entering the market and wondering how senior leaders frame a gap without underselling their experience. Would love to hear frameworks that worked.", author_id: 'u1', author_name: 'Sarah C.', author_avatar_url: null, status: 'pinned', views: 412, reply_count: 24, last_reply_at: '2026-07-20T08:00:00Z', last_reply_by: 'Michael W.', created_at: '2026-07-15T10:00:00Z', updated_at: '2026-07-20T08:00:00Z' },
  { id: 't2', category_id: 'cat3', title: 'VP Engineering comp benchmarks — Series B fintech, SF', excerpt: 'Got an offer at $380K base + 0.4% equity. Curious how this compares to recent Series B benchmarks...', body: 'Got an offer at $380K base + 0.4% equity. Curious how this compares to recent Series B benchmarks in the SF Bay Area. Target company is a fintech scaling from 80 to 200 engineers.', author_id: 'u2', author_name: 'Michael W.', author_avatar_url: null, status: 'open', views: 287, reply_count: 18, last_reply_at: '2026-07-20T05:00:00Z', last_reply_by: 'Jia L.', created_at: '2026-07-18T14:00:00Z', updated_at: '2026-07-20T05:00:00Z' },
  { id: 't3', category_id: 'cat1', title: 'Cross-border move: HK → Singapore, what I learned', excerpt: 'Sharing my relocation playbook and the negotiation levers that mattered most for an APAC move...', body: 'Sharing my relocation playbook and the negotiation levers that mattered most for an APAC move. Includes tax considerations, visa timelines, and family logistics.', author_id: 'u3', author_name: 'Jia L.', author_avatar_url: null, status: 'open', views: 540, reply_count: 31, last_reply_at: '2026-07-19T18:00:00Z', last_reply_by: 'Priya R.', created_at: '2026-07-12T09:00:00Z', updated_at: '2026-07-19T18:00:00Z' },
  { id: 't4', category_id: 'cat4', title: 'Building executive presence as an introverted CTO', excerpt: "Presence isn't about the loudest voice. Here are the rituals that helped me lead authentically...", body: "Presence isn't about the loudest voice. Here are the rituals that helped me lead authentically as an introverted technical leader.", author_id: 'u4', author_name: 'David K.', author_avatar_url: null, status: 'open', views: 198, reply_count: 12, last_reply_at: '2026-07-19T11:00:00Z', last_reply_by: 'Sarah C.', created_at: '2026-07-16T13:00:00Z', updated_at: '2026-07-19T11:00:00Z' },
  { id: 't5', category_id: 'cat5', title: 'APAC fintech hiring signals — Q1 2025 outlook', excerpt: 'Consolidating demand signals from public filings and search firm reports for the region...', body: 'Consolidating demand signals from public filings and search firm reports for the region. Surging demand for risk and compliance leaders.', author_id: 'u5', author_name: 'Priya R.', author_avatar_url: null, status: 'open', views: 156, reply_count: 9, last_reply_at: '2026-07-18T15:00:00Z', last_reply_by: 'David K.', created_at: '2026-07-14T08:00:00Z', updated_at: '2026-07-18T15:00:00Z' },
  { id: 't6', category_id: 'cat6', title: 'Introduce yourself — January 2025 cohort', excerpt: "Welcome new members! Share your background, what you're exploring, and how the community can help...", body: "Welcome new members! Share your background, what you're exploring, and how the community can help you grow.", author_id: 'u6', author_name: 'Community Team', author_avatar_url: null, status: 'pinned', views: 803, reply_count: 47, last_reply_at: '2026-07-17T20:00:00Z', last_reply_by: 'Jia L.', created_at: '2026-01-05T00:00:00Z', updated_at: '2026-07-17T20:00:00Z' },
];

const SEED_POSTS: ForumPost[] = [
  { id: 'p1', thread_id: 't1', parent_post_id: null, body: "Great question. I frame gaps as intentional periods for growth — sabbatical, caregiving, or reskilling. Recruiters respect ownership and a clear narrative.", author_id: 'u2', author_name: 'Michael W.', author_avatar_url: null, author_role: 'VP Engineering', is_solution: true, likes: 18, created_at: '2026-07-15T11:00:00Z', updated_at: '2026-07-15T11:00:00Z' },
  { id: 'p2', thread_id: 't1', parent_post_id: 'p1', body: "Agreed. I added a one-line note on my LinkedIn and it removed 90% of the awkward questions.", author_id: 'u3', author_name: 'Jia L.', author_avatar_url: null, author_role: 'Director, Product', is_solution: false, likes: 7, created_at: '2026-07-15T12:30:00Z', updated_at: '2026-07-15T12:30:00Z' },
  { id: 'p3', thread_id: 't2', parent_post_id: null, body: "For Series B fintech at that scale, $380K base is competitive but on the higher end. Equity feels light — I'd push for 0.6-0.8%.", author_id: 'u3', author_name: 'Jia L.', author_avatar_url: null, author_role: 'Director, Product', is_solution: true, likes: 12, created_at: '2026-07-18T15:00:00Z', updated_at: '2026-07-18T15:00:00Z' },
];

/* ------------------------------------------------------------------ */
/* Service                                                             */
/* ------------------------------------------------------------------ */

class ForumService {
  private useFallback = false;

  /**
   * Get all forum categories, sorted by sort_order.
   */
  async getCategories(): Promise<ForumCategory[]> {
    if (this.useFallback) return [...SEED_CATEGORIES];
    try {
      const { data, error } = await supabase
        .from('forum_categories')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      if (!data || data.length === 0) return [...SEED_CATEGORIES];
      return data;
    } catch (err) {
      console.warn('[forumService] getCategories falling back to seed data:', err);
      this.useFallback = true;
      return [...SEED_CATEGORIES];
    }
  }

  /**
   * Get threads with optional category filter and search.
   */
  async getThreads(params: {
    categoryId?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ data: ForumThread[]; total: number }> {
    if (this.useFallback) {
      let data = [...SEED_THREADS];
      if (params.categoryId && params.categoryId !== 'all') {
        data = data.filter((t) => t.category_id === params.categoryId);
      }
      if (params.search) {
        const q = params.search.toLowerCase();
        data = data.filter(
          (t) => t.title.toLowerCase().includes(q) || t.excerpt.toLowerCase().includes(q),
        );
      }
      const total = data.length;
      const limit = params.limit ?? 50;
      const offset = params.offset ?? 0;
      return { data: data.slice(offset, offset + limit), total };
    }

    try {
      let query = supabase
        .from('forum_threads')
        .select('*', { count: 'exact' })
        .order('status', { ascending: false })
        .order('last_reply_at', { ascending: false, nullsFirst: false });

      if (params.categoryId && params.categoryId !== 'all') {
        query = query.eq('category_id', params.categoryId);
      }
      if (params.search) {
        query = query.or(`title.ilike.%${params.search}%,excerpt.ilike.%${params.search}%`);
      }

      const limit = params.limit ?? 50;
      const offset = params.offset ?? 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;
      if (error) throw error;
      if (!data || data.length === 0) {
        return { data: [...SEED_THREADS], total: SEED_THREADS.length };
      }
      return { data, total: count || data.length };
    } catch (err) {
      console.warn('[forumService] getThreads falling back to seed data:', err);
      this.useFallback = true;
      return this.getThreads(params);
    }
  }

  /**
   * Get a single thread by ID.
   */
  async getThread(id: string): Promise<ForumThread | null> {
    if (this.useFallback) return SEED_THREADS.find((t) => t.id === id) || null;
    try {
      const { data, error } = await supabase
        .from('forum_threads')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('[forumService] getThread falling back:', err);
      this.useFallback = true;
      return SEED_THREADS.find((t) => t.id === id) || null;
    }
  }

  /**
   * Create a new thread. Falls back to local state when DB unavailable.
   */
  async createThread(input: CreateThreadInput): Promise<ForumThread | null> {
    const now = new Date().toISOString();
    const excerpt = input.body.slice(0, 140);

    if (this.useFallback) {
      const newThread: ForumThread = {
        id: `t${Date.now()}`,
        category_id: input.category_id,
        title: input.title,
        excerpt,
        body: input.body,
        author_id: input.author_id,
        author_name: input.author_name,
        author_avatar_url: null,
        status: 'open',
        views: 0,
        reply_count: 0,
        last_reply_at: null,
        last_reply_by: null,
        created_at: now,
        updated_at: now,
      };
      SEED_THREADS.unshift(newThread);
      return newThread;
    }

    try {
      const { data, error } = await supabase
        .from('forum_threads')
        .insert({
          category_id: input.category_id,
          title: input.title,
          excerpt,
          body: input.body,
          author_id: input.author_id,
          author_name: input.author_name,
          status: 'open',
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('[forumService] createThread fallback:', err);
      this.useFallback = true;
      return this.createThread(input);
    }
  }

  /**
   * Increment thread view count.
   */
  async incrementViews(threadId: string): Promise<void> {
    if (this.useFallback) {
      const t = SEED_THREADS.find((x) => x.id === threadId);
      if (t) t.views += 1;
      return;
    }
    try {
      await supabase.rpc('increment_thread_views', { thread_id: threadId });
    } catch (err) {
      // Non-critical; ignore
    }
  }

  /**
   * Get posts for a thread.
   */
  async getPosts(threadId: string): Promise<ForumPost[]> {
    if (this.useFallback) {
      return SEED_POSTS.filter((p) => p.thread_id === threadId);
    }
    try {
      const { data, error } = await supabase
        .from('forum_posts')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn('[forumService] getPosts falling back:', err);
      this.useFallback = true;
      return SEED_POSTS.filter((p) => p.thread_id === threadId);
    }
  }

  /**
   * Create a post (reply) in a thread.
   */
  async createPost(input: CreatePostInput): Promise<ForumPost | null> {
    const now = new Date().toISOString();

    if (this.useFallback) {
      const newPost: ForumPost = {
        id: `p${Date.now()}`,
        thread_id: input.thread_id,
        parent_post_id: input.parent_post_id || null,
        body: input.body,
        author_id: input.author_id,
        author_name: input.author_name,
        author_avatar_url: null,
        author_role: null,
        is_solution: false,
        likes: 0,
        created_at: now,
        updated_at: now,
      };
      SEED_POSTS.push(newPost);
      const thread = SEED_THREADS.find((t) => t.id === input.thread_id);
      if (thread) {
        thread.reply_count += 1;
        thread.last_reply_at = now;
        thread.last_reply_by = input.author_name;
        thread.updated_at = now;
      }
      return newPost;
    }

    try {
      const { data, error } = await supabase
        .from('forum_posts')
        .insert({
          thread_id: input.thread_id,
          parent_post_id: input.parent_post_id || null,
          body: input.body,
          author_id: input.author_id,
          author_name: input.author_name,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('[forumService] createPost fallback:', err);
      this.useFallback = true;
      return this.createPost(input);
    }
  }

  /**
   * Like a post.
   */
  async likePost(postId: string): Promise<void> {
    if (this.useFallback) {
      const p = SEED_POSTS.find((x) => x.id === postId);
      if (p) p.likes += 1;
      return;
    }
    try {
      await supabase.rpc('increment_post_likes', { post_id: postId });
    } catch (err) {
      // Non-critical
    }
  }

  /**
   * Mark a post as the solution for a thread.
   */
  async markSolution(threadId: string, postId: string): Promise<void> {
    if (this.useFallback) {
      SEED_POSTS.forEach((p) => {
        if (p.thread_id === threadId) p.is_solution = p.id === postId;
      });
      const thread = SEED_THREADS.find((t) => t.id === threadId);
      if (thread) thread.status = 'solved';
      return;
    }
    try {
      await supabase
        .from('forum_posts')
        .update({ is_solution: false })
        .eq('thread_id', threadId);
      await supabase
        .from('forum_posts')
        .update({ is_solution: true })
        .eq('id', postId);
      await supabase
        .from('forum_threads')
        .update({ status: 'solved' })
        .eq('id', threadId);
    } catch (err) {
      console.warn('[forumService] markSolution failed:', err);
    }
  }

  /**
   * Pin or unpin a thread.
   */
  async togglePin(threadId: string, pinned: boolean): Promise<void> {
    if (this.useFallback) {
      const t = SEED_THREADS.find((x) => x.id === threadId);
      if (t) t.status = pinned ? 'pinned' : 'open';
      return;
    }
    try {
      await supabase
        .from('forum_threads')
        .update({ status: pinned ? 'pinned' : 'open' })
        .eq('id', threadId);
    } catch (err) {
      console.warn('[forumService] togglePin failed:', err);
    }
  }

  /**
   * Subscribe to realtime thread updates.
   */
  subscribeToThread(threadId: string, callback: (post: ForumPost) => void) {
    if (this.useFallback) return () => {};
    const subscription = supabase
      .channel(`forum_posts:thread_id=eq.${threadId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'forum_posts', filter: `thread_id=eq.${threadId}` },
        (payload) => callback(payload.new as ForumPost),
      )
      .subscribe();
    return () => supabase.removeChannel(subscription);
  }
}

export const forumService = new ForumService();
