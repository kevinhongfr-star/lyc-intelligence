/**
 * CandidateCommunityPage — Candidate Portal community forum
 * Renders inside AppShell → Outlet. Shows forum categories, threads,
 * thread creation, and a thread detail view with replies.
 *
 * Technical Debt #25: Replaced static placeholder content with real
 * forum service data layer (forumService).
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  MessageSquare,
  Users,
  Clock,
  Pin,
  ArrowRight,
  Plus,
  ArrowLeft,
  Send,
  ThumbsUp,
  CheckCircle2,
  User,
  Loader2,
  Eye,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Input, Button, Badge, EmptyState } from '@/components/ui';
import { useTenantContext } from '@/hooks/useTenantContext';
import { forumService, type ForumCategory, type ForumThread, type ForumPost } from '@/services/forumService';

export function CandidateCommunityPage() {
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedThread, setSelectedThread] = useState<ForumThread | null>(null);
  const { profile } = useTenantContext();

  const displayName = profile?.name || 'Candidate';
  const authorId = profile?.id || 'guest';

  const loadCategories = useCallback(async () => {
    const data = await forumService.getCategories();
    setCategories(data);
  }, []);

  const loadThreads = useCallback(async () => {
    setLoading(true);
    const { data } = await forumService.getThreads({
      categoryId: activeCategory === 'all' ? undefined : activeCategory,
      search: searchTerm || undefined,
      limit: 50,
    });
    setThreads(data);
    setLoading(false);
  }, [activeCategory, searchTerm]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  const sortedThreads = [...threads].sort(
    (a, b) => Number(b.status === 'pinned') - Number(a.status === 'pinned'),
  );

  const handleThreadCreated = () => {
    setShowCreateForm(false);
    loadThreads();
  };

  const handleThreadClick = async (thread: ForumThread) => {
    await forumService.incrementViews(thread.id);
    setSelectedThread(thread);
  };

  // ── Thread detail view ──
  if (selectedThread) {
    return (
      <ThreadDetailView
        thread={selectedThread}
        authorId={authorId}
        authorName={displayName}
        onBack={() => {
          setSelectedThread(null);
          loadThreads();
        }}
      />
    );
  }

  // ── Create thread form ──
  if (showCreateForm) {
    return (
      <CreateThreadForm
        categories={categories}
        authorId={authorId}
        authorName={displayName}
        onCancel={() => setShowCreateForm(false)}
        onCreated={handleThreadCreated}
      />
    );
  }

  // ── Main forum view ──
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between w-full">
        <div>
          <h1 className="font-serif font-bold text-2xl text-text-primary">Community</h1>
          <p className="text-text-secondary text-sm mt-1">Connect with peers, share insights, and grow together.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 bg-bg-warm px-4 py-2 rounded-lg">
            <div className="w-9 h-9 rounded-full bg-fuchsia-light flex items-center justify-center">
              <User className="w-4 h-4 text-fuchsia" />
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-text-primary">{displayName}</div>
            </div>
          </div>
          <Button size="sm" onClick={() => setShowCreateForm(true)}>
            <Plus className="w-3 h-3" /> New Thread
          </Button>
        </div>
      </div>

      {/* Categories */}
      <div>
        <div className="text-sm font-medium text-text-secondary mb-3">Categories</div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <button
            onClick={() => setActiveCategory('all')}
            className={`text-left p-4 border transition-colors ${activeCategory === 'all' ? 'border-fuchsia bg-fuchsia-light' : 'border-border bg-white hover:border-fuchsia'}`}
            style={{ borderRadius: 0 }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🌟</span>
              <span className="font-medium text-text-primary text-sm">All Categories</span>
            </div>
            <div className="text-xs text-text-muted">{threads.length} threads</div>
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`text-left p-4 border transition-colors ${activeCategory === cat.id ? 'border-fuchsia bg-fuchsia-light' : 'border-border bg-white hover:border-fuchsia'}`}
              style={{ borderRadius: 0 }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{cat.icon}</span>
                <span className="font-medium text-text-primary text-sm">{cat.name}</span>
              </div>
              <div className="text-xs text-text-muted">{cat.thread_count} threads</div>
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <Input
          placeholder="Search threads..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Thread list */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Threads</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-text-muted" />
            </div>
          ) : sortedThreads.length === 0 ? (
            <EmptyState
              title="No threads found"
              description="Be the first to start a discussion in this category."
              actionLabel="New Thread"
              onAction={() => setShowCreateForm(true)}
            />
          ) : (
            <div className="space-y-1">
              {sortedThreads.map((thread) => (
                <div
                  key={thread.id}
                  onClick={() => handleThreadClick(thread)}
                  className="flex items-start gap-3 py-3 border-b border-border last:border-b-0 hover:bg-bg-warm transition-colors -mx-4 px-4 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-lg bg-fuchsia-light flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-5 h-5 text-fuchsia" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {thread.status === 'pinned' && <Pin className="w-3 h-3 text-fuchsia flex-shrink-0" />}
                      {thread.status === 'solved' && <CheckCircle2 className="w-3 h-3 text-green-600 flex-shrink-0" />}
                      <span className="font-medium text-text-primary text-sm">{thread.title}</span>
                    </div>
                    <p className="text-xs text-text-secondary mt-1 line-clamp-1">{thread.excerpt}</p>
                    <div className="flex items-center gap-4 text-xs text-text-muted mt-2 flex-wrap">
                      <span>by {thread.author_name}</span>
                      <span className="inline-flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {thread.reply_count}</span>
                      <span className="inline-flex items-center gap-1"><Eye className="w-3 h-3" /> {thread.views}</span>
                      <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {formatRelative(thread.last_reply_at || thread.created_at)}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-text-muted flex-shrink-0 mt-1" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Thread Detail View                                                  */
/* ------------------------------------------------------------------ */

function ThreadDetailView({
  thread,
  authorId,
  authorName,
  onBack,
}: {
  thread: ForumThread;
  authorId: string;
  authorName: string;
  onBack: () => void;
}) {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    const data = await forumService.getPosts(thread.id);
    setPosts(data);
    setLoading(false);
  }, [thread.id]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // Subscribe to realtime updates
  useEffect(() => {
    const unsubscribe = forumService.subscribeToThread(thread.id, (newPost) => {
      setPosts((prev) => [...prev, newPost]);
    });
    return unsubscribe;
  }, [thread.id]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSubmitting(true);
    const newPost = await forumService.createPost({
      thread_id: thread.id,
      body: replyText,
      author_id: authorId,
      author_name: authorName,
    });
    if (newPost) {
      setPosts((prev) => [...prev, newPost]);
      setReplyText('');
    }
    setSubmitting(false);
  };

  const handleLike = async (postId: string) => {
    await forumService.likePost(postId);
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, likes: p.likes + 1 } : p)));
  };

  const handleMarkSolution = async (postId: string) => {
    await forumService.markSolution(thread.id, postId);
    setPosts((prev) => prev.map((p) => ({ ...p, is_solution: p.id === postId })));
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to threads
      </button>

      {/* Thread header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-3">
            {thread.status === 'pinned' && (
              <Badge className="bg-fuchsia-light text-fuchsia"><Pin className="w-3 h-3 mr-1" />Pinned</Badge>
            )}
            {thread.status === 'solved' && (
              <Badge className="bg-green-100 text-green-700"><CheckCircle2 className="w-3 h-3 mr-1" />Solved</Badge>
            )}
            <Badge variant="outline">{thread.category_id}</Badge>
          </div>
          <h1 className="font-serif font-bold text-2xl text-text-primary mb-3">{thread.title}</h1>
          <div className="flex items-center gap-4 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <div className="w-6 h-6 rounded-full bg-fuchsia-light flex items-center justify-center">
                <User className="w-3 h-3 text-fuchsia" />
              </div>
              {thread.author_name}
            </span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatRelative(thread.created_at)}</span>
            <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {thread.views} views</span>
            <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {thread.reply_count} replies</span>
          </div>
          <div className="mt-4 text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
            {thread.body}
          </div>
        </CardContent>
      </Card>

      {/* Replies */}
      <div>
        <h2 className="text-lg font-medium text-text-primary mb-3">
          {posts.length} {posts.length === 1 ? 'Reply' : 'Replies'}
        </h2>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-text-muted" />
          </div>
        ) : posts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-text-muted text-sm">
              No replies yet. Be the first to respond!
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <Card key={post.id} className={post.is_solution ? 'border-green-300 bg-green-50/30' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-fuchsia-light flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-fuchsia" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-medium text-sm text-text-primary">{post.author_name}</span>
                        {post.author_role && (
                          <Badge variant="outline" className="text-xs">{post.author_role}</Badge>
                        )}
                        {post.is_solution && (
                          <Badge className="bg-green-100 text-green-700 text-xs">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Solution
                          </Badge>
                        )}
                        <span className="text-xs text-text-muted">{formatRelative(post.created_at)}</span>
                      </div>
                      <p className="text-sm text-text-secondary whitespace-pre-wrap">{post.body}</p>
                      <div className="flex items-center gap-3 mt-3">
                        <button
                          onClick={() => handleLike(post.id)}
                          className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-fuchsia transition-colors"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          {post.likes}
                        </button>
                        {thread.author_id === authorId && !post.is_solution && thread.status !== 'solved' && (
                          <button
                            onClick={() => handleMarkSolution(post.id)}
                            className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-green-600 transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Mark as solution
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Reply form */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleReply}>
            <label className="block text-sm font-medium text-text-secondary mb-2">Your Reply</label>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Share your thoughts..."
              rows={4}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:border-fuchsia resize-none"
              disabled={submitting}
            />
            <div className="flex justify-end mt-3">
              <Button type="submit" disabled={!replyText.trim() || submitting} className="gap-1">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Post Reply
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Create Thread Form                                                  */
/* ------------------------------------------------------------------ */

function CreateThreadForm({
  categories,
  authorId,
  authorName,
  onCancel,
  onCreated,
}: {
  categories: ForumCategory[];
  authorId: string;
  authorName: string;
  onCancel: () => void;
  onCreated: () => void;
}) {
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim() || !categoryId) {
      setError('Please fill in all fields');
      return;
    }
    setSubmitting(true);
    setError(null);
    const thread = await forumService.createThread({
      category_id: categoryId,
      title: title.trim(),
      body: body.trim(),
      author_id: authorId,
      author_name: authorName,
    });
    setSubmitting(false);
    if (thread) {
      onCreated();
    } else {
      setError('Failed to create thread. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <button
        onClick={onCancel}
        className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to threads
      </button>

      <Card>
        <CardHeader>
          <CardTitle>Start a New Thread</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:border-fuchsia"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your thread a clear title..."
                maxLength={120}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Body</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Share your question, insight, or story..."
                rows={8}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:border-fuchsia resize-y"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</div>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
                Create Thread
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function formatRelative(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default CandidateCommunityPage;
