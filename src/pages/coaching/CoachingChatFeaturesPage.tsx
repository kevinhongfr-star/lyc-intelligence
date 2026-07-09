/**
 * CoachingChatFeaturesPage — B2C Coaching Portal chat features showcase
 * Renders inside AppShell → Outlet. Shows available chat features,
 * messaging capabilities, and AI tools.
 */
import React, { useState } from 'react';
import { MessageSquare, Sparkles, Mic, Video, Paperclip, Smile, Send, Bot, Wand2, Languages, FileText, User } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Input } from '@/components/ui';
import { useTenantContext } from '@/hooks/useTenantContext';

interface ChatFeature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'AI' | 'Communication' | 'Productivity';
  available: boolean;
}

// Static content — feature catalog, not backed by a database table
const STATIC_FEATURES: ChatFeature[] = [
  { id: 'f1', title: 'AI Coaching Assistant', description: 'Get instant answers to career questions 24/7', icon: <Bot className="w-5 h-5" />, category: 'AI', available: true },
  { id: 'f2', title: 'Voice Messages', description: 'Send and receive voice notes', icon: <Mic className="w-5 h-5" />, category: 'Communication', available: true },
  { id: 'f3', title: 'Video Calls', description: '1:1 video sessions with your coach', icon: <Video className="w-5 h-5" />, category: 'Communication', available: true },
  { id: 'f4', title: 'File Sharing', description: 'Share documents, images, and resources', icon: <Paperclip className="w-5 h-5" />, category: 'Productivity', available: true },
  { id: 'f5', title: 'Smart Replies', description: 'AI-suggested responses based on context', icon: <Wand2 className="w-5 h-5" />, category: 'AI', available: true },
  { id: 'f6', title: 'Real-time Translation', description: 'Chat in 50+ languages seamlessly', icon: <Languages className="w-5 h-5" />, category: 'AI', available: false },
  { id: 'f7', title: 'Emoji & Reactions', description: 'Express yourself with rich emoji', icon: <Smile className="w-5 h-5" />, category: 'Communication', available: true },
  { id: 'f8', title: 'Message Search', description: 'Find any message or file instantly', icon: <FileText className="w-5 h-5" />, category: 'Productivity', available: true },
];

const CATEGORY_COLORS: Record<string, string> = {
  AI: 'bg-fuchsia/10 text-fuchsia',
  Communication: 'bg-blue/10 text-blue',
  Productivity: 'bg-green/10 text-green',
};

export function CoachingChatFeaturesPage() {
  const [filter, setFilter] = useState<'All' | 'AI' | 'Communication' | 'Productivity'>('All');
  const { profile } = useTenantContext();

  const displayName = profile?.name || 'Coachee';
  const tier = profile?.tier || 'Professional';

  const filteredFeatures = filter === 'All' ? STATIC_FEATURES : STATIC_FEATURES.filter(f => f.category === filter);

  const availableCount = STATIC_FEATURES.filter(f => f.available).length;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="font-serif font-bold text-2xl text-text-primary">Chat Features</h1>
            <p className="text-text-secondary text-sm mt-1">Explore all the tools available in your coaching chat experience.</p>
          </div>
          <div className="flex items-center gap-3 bg-bg-warm px-4 py-2 rounded-lg">
            <div className="w-9 h-9 rounded-full bg-fuchsia-light flex items-center justify-center">
              <User className="w-4 h-4 text-fuchsia" />
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-text-primary">{displayName}</div>
              <div className="text-xs text-text-muted">{tier}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-fuchsia-light flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-fuchsia" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{availableCount}</div>
              <div className="text-xs text-text-muted">Available Features</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-fuchsia/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-fuchsia" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">3</div>
              <div className="text-xs text-text-muted">AI-Powered Tools</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue/10 flex items-center justify-center">
              <Video className="w-5 h-5 text-blue" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">24/7</div>
              <div className="text-xs text-text-muted">Availability</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['All', 'AI', 'Communication', 'Productivity'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === cat
                ? 'bg-fuchsia text-white'
                : 'bg-bg-warm text-text-secondary hover:bg-fuchsia-light hover:text-fuchsia'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredFeatures.map((feature) => (
          <Card key={feature.id} className={`p-5 hover:shadow-card-hover transition-shadow ${!feature.available ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-fuchsia-light flex items-center justify-center text-fuchsia">
                {feature.icon}
              </div>
              {!feature.available && (
                <Badge variant="outline" className="text-xs">Coming Soon</Badge>
              )}
            </div>
            <h3 className="font-medium text-text-primary text-sm mb-1">{feature.title}</h3>
            <p className="text-xs text-text-muted">{feature.description}</p>
            <div className="mt-3">
              <Badge className={CATEGORY_COLORS[feature.category]}>{feature.category}</Badge>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-fuchsia" />
            <CardTitle>Try the Chat</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-bg-warm rounded-lg p-4 min-h-[200px] flex flex-col">
            <div className="flex-1 space-y-3 mb-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-fuchsia-light flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-fuchsia" />
                </div>
                <div className="bg-white px-4 py-2 rounded-2xl rounded-tl-md max-w-[80%]">
                  <div className="text-sm text-text-primary">
                    Hi {displayName}! I'm your AI coaching assistant. How can I help you today?
                  </div>
                </div>
              </div>
              <div className="flex gap-3 flex-row-reverse">
                <div className="w-8 h-8 rounded-full bg-fuchsia flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="bg-fuchsia text-white px-4 py-2 rounded-2xl rounded-tr-md max-w-[80%]">
                  <div className="text-sm">I need help preparing for my next interview</div>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-fuchsia-light flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-fuchsia" />
                </div>
                <div className="bg-white px-4 py-2 rounded-2xl rounded-tl-md max-w-[80%]">
                  <div className="text-sm text-text-primary">
                    Great! I can help with that. What role are you interviewing for?
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Input placeholder="Type a message..." className="flex-1" />
              <Button>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CoachingChatFeaturesPage;
