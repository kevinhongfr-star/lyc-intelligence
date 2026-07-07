import { Star } from 'lucide-react';

interface QualityMetric {
  label: string;
  value: string;
  detail: string;
}

function StarRow({ rating, max = 5 }: { rating: number; max?: number }) {
  const filled = Math.round(rating);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i < filled ? 'text-accent fill-current' : 'text-bg-tertiary'
          }`}
        />
      ))}
    </div>
  );
}

export function QualityOfHireMetrics() {
  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center gap-2 mb-4">
        <Star className="w-5 h-5 text-accent" />
        <h3 className="font-serif text-lg font-bold text-text-primary">QUALITY OF HIRE</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 12-month retention */}
        <div className="border border-bg-tertiary p-4">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-2">
            12-Month Retention
          </p>
          <p className="font-serif text-3xl font-bold text-text-primary mb-3">91%</p>
          <div className="h-2 bg-bg-tertiary">
            <div className="h-full bg-accent" style={{ width: '91%' }} />
          </div>
        </div>

        {/* Performance rating */}
        <div className="border border-bg-tertiary p-4">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-2">
            Performance Rating (avg)
          </p>
          <p className="font-serif text-3xl font-bold text-text-primary mb-3">
            4.2<span className="text-base text-text-muted font-sans">/5</span>
          </p>
          <StarRow rating={4.2} />
        </div>

        {/* Client satisfaction */}
        <div className="border border-bg-tertiary p-4">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-2">
            Client Satisfaction
          </p>
          <p className="font-serif text-3xl font-bold text-text-primary mb-3">
            4.6<span className="text-base text-text-muted font-sans">/5</span>
          </p>
          <StarRow rating={4.6} />
        </div>
      </div>
    </div>
  );
}
