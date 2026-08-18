import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import type { FAQItem } from '@/config/pricingData';

export interface PricingFAQProps {
  faqItems: FAQItem[];
}

export const PricingFAQ: React.FC<PricingFAQProps> = ({ faqItems }) => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section className="py-16 md:py-20 bg-bg-secondary/40">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="default" size="md" className="mb-4 gap-1.5">
            <HelpCircle className="h-3 w-3" aria-hidden="true" />
            Pricing FAQ
          </Badge>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-text-primary mb-4">
            Diagnostic miles, tiers & billing
          </h2>
          <p className="text-lg text-text-muted">
            Everything you need to know about Executive Intelligence pricing.
          </p>
        </div>

        <div className="space-y-3">
          {faqItems.map((item, idx) => {
            const isOpen = openIdx === idx;
            return (
              <Card
                key={idx}
                className={cn(
                  'overflow-hidden transition-all',
                  isOpen && 'ring-1 ring-accent/30',
                )}
              >
                <button
                  type="button"
                  className="w-full text-left p-5 flex items-start justify-between gap-4 hover:bg-bg-tertiary/30 transition-colors"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${idx}`}
                  id={`faq-question-${idx}`}
                >
                  <span className="font-semibold text-text-primary leading-relaxed pr-2">
                    {item.question}
                  </span>
                  <span className="shrink-0 mt-0.5 text-text-muted">
                    {isOpen ? (
                      <ChevronUp className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <ChevronDown className="h-5 w-5" aria-hidden="true" />
                    )}
                  </span>
                </button>
                <div
                  id={`faq-answer-${idx}`}
                  role="region"
                  aria-labelledby={`faq-question-${idx}`}
                  className={cn(
                    'grid transition-all duration-300 ease-out',
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                  )}
                >
                  <div className="overflow-hidden">
                    <CardContent className="pt-0 pb-5 px-5 text-text-muted leading-relaxed text-sm md:text-[15px]">
                      {item.answer}
                    </CardContent>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
