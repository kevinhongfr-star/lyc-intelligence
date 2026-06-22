import React, { useState, useEffect } from 'react';
import { Lightbulb, Crown, ArrowRight } from 'lucide-react';

interface CareerInsightProps {
  messageCount: number;
  conversationHistory: { role: string; content: string }[];
  onUpgrade: () => void;
}

interface Insight {
  topic: string;
  industry: string;
  insight: string;
}

export function CareerInsight({ messageCount, conversationHistory, onUpgrade }: CareerInsightProps) {
  const [insight, setInsight] = useState<Insight | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (messageCount > 0 && messageCount % 5 === 0) {
      const generatedInsight = generateInsight(conversationHistory);
      setInsight(generatedInsight);
      setShow(true);
    } else {
      setShow(false);
    }
  }, [messageCount, conversationHistory]);

  const generateInsight = (history: { role: string; content: string }[]): Insight => {
    const userMessages = history.filter(m => m.role === 'user').map(m => m.content.toLowerCase());
    const recentContent = userMessages.slice(-5).join(' ');

    const topics = [
      { keywords: ['career', 'growth', 'promotion', 'advancement'], topic: 'career growth' },
      { keywords: ['leadership', 'management', 'executive', 'c-suite'], topic: 'leadership development' },
      { keywords: ['asia', 'apac', 'china', 'japan', 'singapore'], topic: 'Asia-Pacific expansion' },
      { keywords: ['europe', 'eu', 'germany', 'uk', 'london'], topic: 'European market entry' },
      { keywords: ['us', 'america', 'silicon valley', 'new york'], topic: 'US market strategy' },
      { keywords: ['digital', 'transformation', 'tech', 'technology'], topic: 'digital transformation' },
      { keywords: ['diversity', 'inclusion', 'dei'], topic: 'DEI leadership' },
      { keywords: ['remote', 'hybrid', 'work'], topic: 'workplace strategy' },
    ];

    const industries = [
      { keywords: ['tech', 'software', 'saas'], industry: 'technology' },
      { keywords: ['finance', 'banking', 'investment'], industry: 'financial services' },
      { keywords: ['healthcare', 'pharma', 'biotech'], industry: 'healthcare' },
      { keywords: ['retail', 'ecommerce'], industry: 'retail' },
      { keywords: ['manufacturing', 'supply chain'], industry: 'manufacturing' },
      { keywords: ['energy', 'sustainability', 'climate'], industry: 'sustainability' },
    ];

    let matchedTopic = 'career strategy';
    for (const t of topics) {
      if (t.keywords.some(k => recentContent.includes(k))) {
        matchedTopic = t.topic;
        break;
      }
    }

    let matchedIndustry = 'business';
    for (const i of industries) {
      if (i.keywords.some(k => recentContent.includes(k))) {
        matchedIndustry = i.industry;
        break;
      }
    }

    const insights = {
      'career growth': [
        'Leaders who proactively build cross-functional networks are 3x more likely to be promoted.',
        'Investing in executive coaching increases promotion rates by 40% within 18 months.',
        'Regular skill assessments help identify blind spots before they impact career trajectory.',
      ],
      'leadership development': [
        'Emotional intelligence is the top predictor of executive success in complex organizations.',
        'Effective leaders spend 60% of their time developing others, not just executing tasks.',
        'Board-ready executives demonstrate both strategic vision and operational excellence.',
      ],
      'Asia-Pacific expansion': [
        'Cultural intelligence is more critical than technical expertise for cross-border roles.',
        'Local market knowledge combined with global perspective creates executive advantage.',
        'Relationship-building cycles are longer in Asian markets — patience is key.',
      ],
      'European market entry': [
        'Regulatory compliance expertise is essential for European leadership roles.',
        'Language skills correlate with faster integration in European executive teams.',
        'Diversity, equity, and inclusion are table stakes for EU-based leadership positions.',
      ],
      'US market strategy': [
        'Silicon Valley values rapid execution and disruption over traditional credentials.',
        'Network density in major US hubs correlates strongly with executive opportunities.',
        'Board composition expectations differ significantly between public and private companies.',
      ],
      'digital transformation': [
        'Leaders with digital fluency command 15-20% premium in compensation.',
        'Cloud transformation experience is the most in-demand executive skill in 2024.',
        'Data-driven decision-making separates top-performing digital leaders.',
      ],
      'DEI leadership': [
        'Companies with diverse leadership teams outperform peers by 35% financially.',
        'Inclusive leadership increases employee retention by 25%.',
        'DEI champions are increasingly sought after for C-suite roles.',
      ],
      'workplace strategy': [
        'Hybrid work models require new leadership skills around trust and autonomy.',
        'Productivity metrics are shifting from presence-based to outcome-based.',
        'Executive presence matters more in remote environments.',
      ],
      'career strategy': [
        'Strategic career planning increases long-term earning potential by 20%.',
        'Regular self-assessment is key to identifying growth opportunities.',
        'Network quality correlates more with career success than network size.',
      ],
    };

    const topicInsights = insights[matchedTopic as keyof typeof insights] || insights['career strategy'];
    const randomInsight = topicInsights[Math.floor(Math.random() * topicInsights.length)];

    return {
      topic: matchedTopic,
      industry: matchedIndustry,
      insight: randomInsight,
    };
  };

  if (!show || !insight) return null;

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
          <Lightbulb className="w-5 h-5 text-amber-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-amber-800 mb-1">Career Insight</p>
          <p className="text-text-primary text-sm leading-relaxed">
            Based on our conversation, here's an insight:
            <span className="font-medium"> You seem interested in {insight.topic}. </span>
            Here's what top {insight.industry} leaders are focusing on: {insight.insight}
          </p>
          <button
            onClick={onUpgrade}
            className="mt-3 flex items-center gap-2 text-accent hover:text-accent-hover text-sm font-medium transition-colors"
          >
            <Crown className="w-4 h-4" />
            Want deeper analysis? Upgrade to Council
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}