import * as React from 'react';

export interface RadarAxis {
  label: string;
  value: number; // 0..1
}

export interface RadarChartProps {
  axes: RadarAxis[]; // 6 typically, but supports N
  size?: number; // SVG pixel size (square). Default 320.
  levels?: number; // Radial grid levels. Default 4.
  accentColor?: string;
  className?: string;
  ariaLabel?: string;
}

export const RadarChart: React.FC<RadarChartProps> = ({
  axes,
  size = 320,
  levels = 4,
  accentColor,
  className,
  ariaLabel,
}) => {
  const N = axes.length;
  const cx = size / 2;
  const cy = size / 2;
  const pad = 48;
  const rMax = (size - pad * 2) / 2;

  const pointFor = (i: number, valueRatio: number) => {
    // Angle: top (12 o'clock) = -90°, each axis advances by 360/N degrees.
    const angleRad = (Math.PI / 2) * -1 + (i * 2 * Math.PI) / N;
    const radius = rMax * valueRatio;
    return {
      x: cx + radius * Math.cos(angleRad),
      y: cy + radius * Math.sin(angleRad),
    };
  };

  const gridLines: React.ReactElement[] = [];
  for (let level = 1; level <= levels; level++) {
    const ratio = level / levels;
    const polyPoints = Array.from({ length: N }, (_, i) => {
      const p = pointFor(i, ratio);
      return `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
    }).join(' ');
    gridLines.push(
      <polygon
        key={`g-${level}`}
        points={polyPoints}
        fill="none"
        stroke="var(--report-viz-track, #E5E7EB)"
        strokeWidth={1}
      />,
    );
  }
  // Axis spokes
  const spokes = axes.map((_, i) => {
    const p = pointFor(i, 1);
    return <line key={`s-${i}`} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="var(--report-viz-track, #E5E7EB)" strokeWidth={1} />;
  });

  // Data polygon
  const dataPoints = axes.map((a, i) => pointFor(i, Math.max(0, Math.min(1, a.value))));
  const polyPts = dataPoints.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
  const accent = accentColor ?? 'var(--report-accent, #111)';
  const ink = 'var(--report-ink-muted, #6B7280)';

  // Axis labels
  const labels = axes.map((a, i) => {
    const p = pointFor(i, 1.18);
    return (
      <text
        key={`l-${i}`}
        x={p.x}
        y={p.y}
        fill={ink}
        textAnchor="middle"
        dominantBaseline="middle"
        style={{
          fontFamily: '"DM Sans", system-ui, sans-serif',
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        {a.label}
      </text>
    );
  });

  return (
    <svg
      role="img"
      aria-label={ariaLabel ?? `Radar chart across ${N} axes`}
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className={className}
      style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
    >
      {gridLines}
      {spokes}
      <polygon
        points={polyPts}
        fill={accent}
        fillOpacity={0.18}
        stroke={accent}
        strokeWidth={2}
      />
      {dataPoints.map((p, i) => (
        <circle key={`d-${i}`} cx={p.x} cy={p.y} r={3.5} fill={accent} />
      ))}
      {labels}
    </svg>
  );
};
