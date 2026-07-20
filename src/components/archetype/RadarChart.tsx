/**
 * RadarChart Component (T-101)
 * Spider/radar chart for displaying dimension scores with instrument color.
 * Uses SVG — no external chart library needed.
 */

import React from 'react';
import { DimensionScore } from '@/types/assessment';
import { INSTRUMENT_COLORS, InstrumentColorKey } from '@/data/instrumentColors';

interface RadarChartProps {
  dimensions: DimensionScore[];
  instrument: string;
  size?: number;
  showPercentiles?: boolean;
  className?: string;
}

export const RadarChart: React.FC<RadarChartProps> = ({
  dimensions,
  instrument,
  size = 300,
  showPercentiles = true,
  className = '',
}) => {
  const colors = INSTRUMENT_COLORS[instrument as InstrumentColorKey] ?? INSTRUMENT_COLORS.shift;
  const numDimensions = dimensions.length;
  if (numDimensions < 3) return null;

  const centerX = size / 2;
  const centerY = size / 2;
  const maxRadius = (size / 2) - 40;
  const angleStep = (2 * Math.PI) / numDimensions;

  // Generate polygon points
  const getPoint = (index: number, value: number): { x: number; y: number } => {
    const angle = angleStep * index - Math.PI / 2;
    const radius = (value / 100) * maxRadius;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  };

  // Data polygon points
  const dataPoints = dimensions.map((dim, i) => getPoint(i, dim.normalizedScore));
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  // Grid rings
  const rings = [20, 40, 60, 80, 100];

  // Axis lines
  const axisLines = dimensions.map((_, i) => {
    const end = getPoint(i, 100);
    return { x1: centerX, y1: centerY, x2: end.x, y2: end.y };
  });

  // Labels
  const labels = dimensions.map((dim, i) => {
    const labelPoint = getPoint(i, 115);
    return { x: labelPoint.x, y: labelPoint.y, text: dim.dimensionName, score: dim.normalizedScore };
  });

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        {/* Grid rings */}
        {rings.map(ring => {
          const ringPoints = dimensions.map((_, i) => getPoint(i, ring));
          const ringPath = ringPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
          return (
            <path key={ring} d={ringPath} fill="none" stroke="#E5E7EB" strokeWidth={ring === 100 ? 1.5 : 0.5} />
          );
        })}

        {/* Axis lines */}
        {axisLines.map((line, i) => (
          <line key={i} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke="#D1D5DB" strokeWidth={0.5} />
        ))}

        {/* Data polygon */}
        <path d={dataPath} fill={`${colors.main}20`} stroke={colors.main} strokeWidth={2} />

        {/* Data points */}
        {dataPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={4} fill={colors.main} stroke="white" strokeWidth={2} />
        ))}

        {/* Labels */}
        {labels.map((label, i) => (
          <text
            key={i}
            x={label.x}
            y={label.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-xs fill-gray-600 font-medium"
          >
            {label.text}
            {showPercentiles && (
              <tspan x={label.x} dy="14" className="text-xs fill-gray-400">
                {label.score}
              </tspan>
            )}
          </text>
        ))}
      </svg>
    </div>
  );
};

export default RadarChart;
