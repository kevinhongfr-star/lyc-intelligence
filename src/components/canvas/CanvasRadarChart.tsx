import React from 'react';

interface CanvasRadarChartProps {
  scores: {
    strategic_thinking: number;
    communication: number;
    adaptability: number;
    team_leadership: number;
    decision_making: number;
    emotional_intelligence: number;
  };
}

export function CanvasRadarChart({ scores }: CanvasRadarChartProps) {
  const labels = [
    'Strategic Thinking',
    'Communication',
    'Adaptability',
    'Team Leadership',
    'Decision Making',
    'Emotional Intelligence',
  ];

  const values = [
    scores.strategic_thinking,
    scores.communication,
    scores.adaptability,
    scores.team_leadership,
    scores.decision_making,
    scores.emotional_intelligence,
  ];

  const centerX = 100;
  const centerY = 100;
  const radius = 80;
  const numSides = 6;

  function getPoint(index: number, value: number, maxRadius: number) {
    const angle = (Math.PI * 2 * index) / numSides - Math.PI / 2;
    const pointRadius = (value / 10) * maxRadius;
    return {
      x: centerX + pointRadius * Math.cos(angle),
      y: centerY + pointRadius * Math.sin(angle),
    };
  }

  const dataPoints = values.map((v, i) => getPoint(i, v, radius));
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  const gridLines = [];
  for (let level = 1; level <= 5; level++) {
    const levelRadius = (level / 5) * radius;
    const points = Array.from({ length: numSides }, (_, i) => getPoint(i, 10, levelRadius));
    gridLines.push(points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z');
  }

  const axisLines = Array.from({ length: numSides }, (_, i) => {
    const endPoint = getPoint(i, 10, radius);
    return `M ${centerX} ${centerY} L ${endPoint.x} ${endPoint.y}`;
  });

  const labelPoints = values.map((v, i) => getPoint(i, v + 1.5, radius));

  return (
    <div className="flex justify-center">
      <svg viewBox="0 0 200 200" className="w-full max-w-[200px]">
        <defs>
          <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {gridLines.map((path, i) => (
          <path
            key={`grid-${i}`}
            d={path}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        ))}

        {axisLines.map((path, i) => (
          <line
            key={`axis-${i}`}
            x1={centerX}
            y1={centerY}
            x2={getPoint(i, 10, radius).x}
            y2={getPoint(i, 10, radius).y}
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        ))}

        <path
          d={dataPath}
          fill="url(#radarGradient)"
          stroke="#3b82f6"
          strokeWidth="2"
        />

        {dataPoints.map((point, i) => (
          <circle
            key={`point-${i}`}
            cx={point.x}
            cy={point.y}
            r="4"
            fill="#3b82f6"
            stroke="white"
            strokeWidth="2"
          />
        ))}

        {labelPoints.map((point, i) => (
          <text
            key={`label-${i}`}
            x={point.x}
            y={point.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-xs fill-gray-600"
            style={{ fontSize: '10px' }}
          >
            {labels[i]}
          </text>
        ))}

        {dataPoints.map((point, i) => (
          <text
            key={`value-${i}`}
            x={point.x}
            y={point.y - 8}
            textAnchor="middle"
            className="text-xs font-bold fill-blue-600"
            style={{ fontSize: '10px' }}
          >
            {values[i]}
          </text>
        ))}
      </svg>
    </div>
  );
}
