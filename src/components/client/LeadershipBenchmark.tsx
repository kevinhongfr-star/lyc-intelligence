import React from 'react';

interface BenchmarkSeries {
  label: string;
  values: number[];
  fill: string;
  stroke: string;
  strokeDasharray?: string;
}

const DIMENSIONS = ['Strategic Vision', 'Execution', 'Innovation', 'Commercial', 'People'];

const SERIES: BenchmarkSeries[] = [
  {
    label: 'Your Team',
    values: [7.2, 8.0, 6.0, 5.5, 7.8],
    fill: 'rgba(193,8,171,0.2)',
    stroke: '#C108AB',
  },
  {
    label: 'Market P50',
    values: [6.5, 7.0, 6.8, 6.0, 7.2],
    fill: 'transparent',
    stroke: '#607D8B',
    strokeDasharray: '5 3',
  },
  {
    label: 'Market P75',
    values: [8.0, 8.5, 8.2, 7.5, 8.3],
    fill: 'transparent',
    stroke: '#4FC3F7',
    strokeDasharray: '5 3',
  },
];

const CENTER = 200;
const MAX_RADIUS = 130;
const NUM_AXES = 5;

interface Point {
  x: number;
  y: number;
}

function axisAngle(i: number): number {
  // -90deg start (top vertex), 72deg per axis
  return (-90 + i * (360 / NUM_AXES)) * (Math.PI / 180);
}

function pointFor(i: number, value: number, maxRadius: number): Point {
  const radius = (value / 10) * maxRadius;
  const angle = axisAngle(i);
  return {
    x: CENTER + radius * Math.cos(angle),
    y: CENTER + radius * Math.sin(angle),
  };
}

function buildPath(points: Point[]): string {
  return (
    points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
      .join(' ') + ' Z'
  );
}

export function LeadershipBenchmark() {
  const ringPaths = [1, 2, 3, 4].map((level) => {
    const ringRadius = (level / 4) * MAX_RADIUS;
    const pts = Array.from({ length: NUM_AXES }, (_, i) => pointFor(i, 10, ringRadius));
    return buildPath(pts);
  });

  const axisEndpoints = Array.from(
    { length: NUM_AXES },
    (_, i) => pointFor(i, 10, MAX_RADIUS)
  );

  const labelPoints = Array.from(
    { length: NUM_AXES },
    (_, i) => pointFor(i, 10, MAX_RADIUS + 24)
  );

  const yourTeam = SERIES[0];

  return (
    <section className="bg-bg-primary border border-bg-tertiary p-5">
      <h3 className="font-serif text-lg font-bold text-text-primary">
        LEADERSHIP TEAM BENCHMARK
      </h3>
      <p className="text-sm text-text-muted mt-1 mb-4">Your leaders vs market peers</p>

      <svg viewBox="0 0 400 400" className="w-full max-w-md mx-auto">
        {/* Concentric pentagon grid rings */}
        {ringPaths.map((d, i) => (
          <path
            key={`ring-${i}`}
            d={d}
            fill="none"
            stroke="var(--bg-tertiary)"
            strokeWidth="1"
          />
        ))}

        {/* Axis spokes */}
        {axisEndpoints.map((p, i) => (
          <line
            key={`axis-${i}`}
            x1={CENTER}
            y1={CENTER}
            x2={p.x}
            y2={p.y}
            stroke="var(--bg-tertiary)"
            strokeWidth="1"
          />
        ))}

        {/* Series polygons (P75 first, P50 next, Your Team on top) */}
        {[SERIES[2], SERIES[1], SERIES[0]].map((s) => {
          const pts = s.values.map((v, i) => pointFor(i, v, MAX_RADIUS));
          return (
            <path
              key={s.label}
              d={buildPath(pts)}
              fill={s.fill}
              stroke={s.stroke}
              strokeWidth="2"
              strokeDasharray={s.strokeDasharray}
            />
          );
        })}

        {/* Vertex markers for Your Team */}
        {yourTeam.values.map((v, i) => {
          const p = pointFor(i, v, MAX_RADIUS);
          return (
            <circle
              key={`vertex-${i}`}
              cx={p.x}
              cy={p.y}
              r="3"
              fill={yourTeam.stroke}
            />
          );
        })}

        {/* Axis labels */}
        {labelPoints.map((p, i) => (
          <text
            key={`label-${i}`}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{
              fill: 'var(--text-secondary)',
              fontSize: '11px',
              fontFamily: 'DM Sans, system-ui, sans-serif',
            }}
          >
            {DIMENSIONS[i]}
          </text>
        ))}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-4">
        {SERIES.map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <svg width="22" height="6" aria-hidden>
              <line
                x1="0"
                y1="3"
                x2="22"
                y2="3"
                stroke={s.stroke}
                strokeWidth="2"
                strokeDasharray={s.strokeDasharray}
              />
            </svg>
            <span className="text-xs text-text-secondary">{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
