import React, { useState } from 'react';
import {
  Lightbulb, TrendingUp, Building2, MapPin, Users, RefreshCw,
  ExternalLink, ChevronRight, Bookmark, BookmarkCheck, Loader2,
  Filter, Clock, ThumbsUp
} from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import type { CareerInsight } from '@/services/supabaseApi';

interface CareerInsightsProps {
  insights: CareerInsight[];
}

type InsightCategory = 'all' | 'trends' | 'opportunities' | 'companies' | 'skills';

const CATEGORY_CONFIG: Record<InsightCategory, { label: string; icon: React.ReactNode }> = {
  all: { label: 'All Insights', icon: <Lightbulb className="w-4 h-4" /> },
  trends: { label: 'Market Trends', icon: <TrendingUp className="w-4 h-4" /> },
  opportunities: { label: 'Opportunities', icon: <Users className="w-4 h-4" /> },
  companies: { label: 'Top Companies', icon: <Building2 className="w-4 h-4" /> },
  skills: { label: 'Skills Demand', icon: <TrendingUp className="w-4 h-4" /> },
};

export function CareerInsights({ insights }: CareerInsightsProps) {
  const [category, setCategory] = useState<InsightCategory>('all');
  const [savedInsights, setSavedInsights] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filter insights by category
  const filteredInsights = insights.filter(insight => {
    if (category === 'all') return true;
    if (category === 'trends') return insight.category === 'market_trend';
    if (category === 'opportunities') return insight.category === 'opportunity';
    if (category === 'companies') return insight.category === 'company';
    if (category === 'skills') return insight.category === 'skill_demand';
    return true;
  });

  // Toggle saved insight
  const toggleSaved = (insightId: string) => {
    setSavedInsights(prev => {
      const newSet = new Set(prev);
      if (newSet.has(insightId)) {
        newSet.delete(insightId);
      } else {
        newSet.add(insightId);
      }
      return newSet;
    });
  };

  // Refresh insights
  const handleRefresh = async () => {
    setRefreshing(true);
    // In a real app, call API to regenerate insights
    await new Promise(resolve => setTimeout(resolve, 2000));
    setRefreshing(false);
  };

  // Get category badge variant
  const getCategoryVariant = (cat: string): 'success' | 'warning' | 'default' | 'danger' => {
    switch (cat) {
      case 'market_trend': return 'default';
      case 'opportunity': return 'success';
      case 'company': return 'warning';
      case 'skill_demand': return 'default';
      default: return 'default';
    }
  };

  // Get category label
  const getCategoryLabel = (cat: string): string => {
    switch (cat) {
      case 'market_trend': return 'Market Trend';
      case 'opportunity': return 'Opportunity';
      case 'company': return 'Company';
      case 'skill_demand': return 'Skills Demand';
      default: return 'Insight';
    }
  };

  // Format date
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Render insight card
  const renderInsightCard = (insight: CareerInsight) => (
    <div 
      key={insight.id}
      className="bg-card rounded-xl border border-card-border p-5 hover:border-accent/50 transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${
            insight.category === 'market_trend' ? 'bg-blue-500/10 text-blue-500' :
            insight.category === 'opportunity' ? 'bg-green-500/10 text-green-500' :
            insight.category === 'company' ? 'bg-yellow-500/10 text-yellow-500' :
            'bg-purple-500/10 text-purple-500'
          }`}>
            {insight.category === 'market_trend' ? <TrendingUp className="w-5 h-5" /> :
             insight.category === 'opportunity' ? <Users className="w-5 h-5" /> :
             insight.category === 'company' ? <Building2 className="w-5 h-5" /> :
             <Lightbulb className="w-5 h-5" />}
          </div>
          <div>
            <Badge variant={getCategoryVariant(insight.category)}>
              {getCategoryLabel(insight.category)}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDate(insight.created_at)}
          </span>
          <button
            onClick={() => toggleSaved(insight.id)}
            className="p-1 hover:bg-bg-alt rounded transition-colors"
          >
            {savedInsights.has(insight.id) ? (
              <BookmarkCheck className="w-4 h-4 text-accent" />
            ) : (
              <Bookmark className="w-4 h-4 text-text-muted" />
            )}
          </button>
        </div>
      </div>

      <h3 className="font-semibold text-text-primary mb-2">{insight.title}</h3>
      <p className="text-sm text-text-muted mb-4">{insight.description}</p>

      {/* Action items */}
      {insight.action_items && insight.action_items.length > 0 && (
        <div className="mb-4">
          <div className="text-xs font-medium text-text-muted mb-2">Suggested Actions:</div>
          <ul className="space-y-1">
            {insight.action_items.slice(0, 3).map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <ChevronRight className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                <span className="text-text-primary">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Related data */}
      {insight.related_data && (
        <div className="flex flex-wrap gap-2">
          {insight.related_data.companies?.map((company: string) => (
            <Badge key={company} variant="default" className="gap-1">
              <Building2 className="w-3 h-3" />
              {company}
            </Badge>
          ))}
          {insight.related_data.skills?.map((skill: string) => (
            <Badge key={skill} variant="default">
              {skill}
            </Badge>
          ))}
          {insight.related_data.geographies?.map((geo: string) => (
            <Badge key={geo} variant="default" className="gap-1">
              <MapPin className="w-3 h-3" />
              {geo}
            </Badge>
          ))}
        </div>
      )}

      {/* Relevance score */}
      {insight.relevance_score && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Relevance to your profile</span>
            <span className="font-medium text-accent">{insight.relevance_score}%</span>
          </div>
          <div className="h-1.5 bg-bg-alt rounded-full mt-1 overflow-hidden">
            <div 
              className="h-full bg-accent rounded-full"
              style={{ width: `${insight.relevance_score}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );

  // Render empty state
  const renderEmptyState = () => (
    <div className="bg-card rounded-xl border border-card-border p-8 text-center">
      <Lightbulb className="w-12 h-12 mx-auto text-text-muted opacity-50 mb-3" />
      <h3 className="font-semibold text-text-primary mb-2">No Insights Available</h3>
      <p className="text-text-muted mb-4">
        Complete your profile to receive personalized career insights.
      </p>
      <Button onClick={handleRefresh} disabled={refreshing}>
        {refreshing ? (
          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
        ) : (
          <RefreshCw className="w-4 h-4 mr-1" />
        )}
        Generate Insights
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Career Insights</h2>
          <p className="text-sm text-text-muted">
            AI-generated insights based on your profile and market trends
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-1" />
          )}
          Refresh
        </Button>
      </div>

      {/* Category filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {(Object.entries(CATEGORY_CONFIG) as [InsightCategory, typeof CATEGORY_CONFIG.all][]).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setCategory(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              category === key
                ? 'bg-accent text-white'
                : 'bg-bg-alt text-text-muted hover:text-text-primary'
            }`}
          >
            {config.icon}
            {config.label}
          </button>
        ))}
      </div>

      {/* Insights grid */}
      {filteredInsights.length === 0 ? (
        renderEmptyState()
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredInsights.map(renderInsightCard)}
        </div>
      )}

      {/* Saved insights section */}
      {savedInsights.size > 0 && (
        <div className="mt-8">
          <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
            <BookmarkCheck className="w-5 h-5 text-accent" />
            Saved Insights ({savedInsights.size})
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {insights
              .filter(i => savedInsights.has(i.id))
              .map(renderInsightCard)}
          </div>
        </div>
      )}

      {/* Insights summary */}
      <div className="bg-card rounded-xl border border-card-border p-5">
        <h3 className="font-semibold text-text-primary mb-4">Your Personalized Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-bg-alt rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <span className="font-medium text-text-primary">Market Trends</span>
            </div>
            <p className="text-sm text-text-muted">
              {insights.filter(i => i.category === 'market_trend').length} insights on emerging trends
            </p>
          </div>

          <div className="p-4 bg-bg-alt rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-green-500" />
              <span className="font-medium text-text-primary">Opportunities</span>
            </div>
            <p className="text-sm text-text-muted">
              {insights.filter(i => i.category === 'opportunity').length} matching opportunities
            </p>
          </div>

          <div className="p-4 bg-bg-alt rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-5 h-5 text-yellow-500" />
              <span className="font-medium text-text-primary">Top Companies</span>
            </div>
            <p className="text-sm text-text-muted">
              {insights.filter(i => i.category === 'company').length} companies hiring in your space
            </p>
          </div>
        </div>

        {/* Recommended next action */}
        <div className="mt-4 p-4 bg-accent/5 border border-accent/20 rounded-lg">
          <div className="flex items-start gap-3">
            <ThumbsUp className="w-5 h-5 text-accent mt-0.5" />
            <div>
              <div className="font-medium text-text-primary">Recommended Next Step</div>
              <p className="text-sm text-text-muted mt-1">
                Based on your profile and current market insights, consider exploring opportunities in the Technology sector. 
                Your skills in software engineering and leadership are in high demand.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}