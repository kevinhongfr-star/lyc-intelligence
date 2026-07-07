import React from 'react';
import { History } from 'lucide-react';

interface ScorePoint {
  period: string;
  value: number;
}

interface ScoreTimelineProps {
  scores?: ScorePoint[];
}

const DEFAULT_SCORES: ScorePoint[] = [
  { period: 'Jan 2026', value: 5.8 },
  { period: 'Feb 2026', value: 6.0 },
  { period: 'Mar 2026', value: 6.2 },
  { period: 'Apr 2026', value: 6.4 },
  { period: 'May 2026', value: 6.5 },
  { period: 'Jun 2026', value: 6.5 },
];

const WIDTH = 400;
const HEIGHT = 160;
const PADDING = 30;
const MAX_SCORE = 10;

export function ScoreTimeline({ scores = DEFAULT_SCORES }: ScoreTimelineProps) {
  const n = scores.length;

  const points = scores.map((s, i) => {
    const x = PADDING + (i * (WIDTH - 2 * PADDING)) / (n - 1);
    const y = HEIGHT - PADDING - (s.value / MAX_SCORE) * (HEIGHT - 2 * PADDING);
    return { x, y, period: s.period, value: s.value };
  });

  const linePoints = points.map((p) => `${p.x},${p.y}`).join(' ');
  const baseline = HEIGHT - PADDING;
  const areaPoints = `${points[0].x},${baseline} ${linePoints} ${points[n - 1].x},${baseline}`;

  const latest = points[n - 1];
  const first = points[0];
  const delta = latest.value - first.value;
  const deltaLabel = `${delta >= 0 ? '+' : ''}${delta.toFixed(1)} since ${first.period}`;

  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-accent" />
            <h3 className="font-serif text-lg font-bold text-text-primary">Score History</h3>
          </div>
          <p className="text-xs text-text-muted mt-1">Strategic Thinking over time</p>
        </div>
        <div className="text-right">
          <div className="font-serif text-2xl font-bold text-text-primary">
            {latest.value.toFixed(1)}
          </div>
          <div className="text-xs text-teal font-semibold">{deltaLabel}</div>
        </div>
      </div>

      <svg
        viewBox="0 0 400 160"
        className="w-full h-auto"
        role="img"
        aria-label="Strategic Thinking score history"
      >
        <polygon points={areaPoints} fill="rgba(193,8,171,0.1)" />
        <polyline
          points={linePoints}
          stroke="var(--accent, #C108AB)"
          strokeWidth={2}
          fill="none"
        />
        {points.map((p) => (
          <circle key={p.period} cx={p.x} cy={p.y} r={3} fill="var(--accent, #C108AB)" />
        ))}
        {points.map((p) => (
          <text
            key={`label-${p.period}`}
            x={p.x}
            y={HEIGHT - 8}
            textAnchor="middle"
            fontSize={10}
            fill="var(--text-muted, #666666)"
          >
            {p.period.slice(0, 3)}
          </text>
        ))}
      </svg>
    </div>
  );
}
