import React from 'react';
import { cn } from '@/lib/utils';
import type { DevDimension, Milestone } from '@/nexus/journey/intelligenceMetrics';

export interface RadarDimension {
  key: DevDimension;
  label: string;
  value: number;
}

export interface JourneyRadarChartProps {
  dimensions: RadarDimension[];
  size?: number;
  accentColor?: string;
  className?: string;
}

export function JourneyRadarChart({
  dimensions,
  size = 420,
  accentColor = 'var(--color-accent)',
  className,
}: JourneyRadarChartProps) {
  const viewBoxSize = 500;
  const center = viewBoxSize / 2;
  const radius = viewBoxSize / 2 - 80;
  const count = dimensions.length || 1;
  const angleStep = (2 * Math.PI) / count;

  const getPoint = (index: number, value: number, rOverride?: number) => {
    const angle = index * angleStep - Math.PI / 2;
    const r = rOverride ?? (Math.max(0, Math.min(100, value)) / 100) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const dataPath =
    dimensions.length > 0
      ? dimensions
          .map((_, i) => {
            const pt = getPoint(i, dimensions[i].value);
            return `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`;
          })
          .join(' ') + ' Z'
      : '';

  const gridLevels = [25, 50, 75, 100];

  return (
    <div
      className={cn('inline-flex flex-col items-center', className)}
      style={{ width: size, maxWidth: '100%' }}
      role="img"
      aria-label="Journey development dimensions radar chart"
    >
      <svg
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        width="100%"
        height="100%"
        style={{ display: 'block' }}
        preserveAspectRatio="xMidYMid meet"
      >
        {gridLevels.map((level, idx) => {
          const r = (level / 100) * radius;
          const points = dimensions
            .map((_, i) => {
              const p = getPoint(i, 100, r);
              return `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
            })
            .join(' ');
          return (
            <polygon
              key={`grid-${idx}`}
              points={points}
              fill="none"
              stroke="var(--color-border)"
              strokeWidth={1}
              opacity={0.7}
            />
          );
        })}

        {dimensions.map((_, i) => {
          const outer = getPoint(i, 100);
          return (
            <line
              key={`axis-${i}`}
              x1={center}
              y1={center}
              x2={outer.x.toFixed(2)}
              y2={outer.y.toFixed(2)}
              stroke="var(--color-border)"
              strokeWidth={1}
              opacity={0.7}
            />
          );
        })}

        {dataPath && (
          <path
            d={dataPath}
            fill={accentColor}
            fillOpacity={0.2}
            stroke={accentColor}
            strokeWidth={2}
          />
        )}

        {dimensions.map((d, i) => {
          const p = getPoint(i, d.value);
          return (
            <circle
              key={`vertex-${i}`}
              cx={p.x.toFixed(2)}
              cy={p.y.toFixed(2)}
              r={4}
              fill={accentColor}
            />
          );
        })}

        {dimensions.map((d, i) => {
          const p = getPoint(i, d.value);
          return (
            <text
              key={`value-${i}`}
              x={p.x.toFixed(2)}
              y={(p.y - 10).toFixed(2)}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="11"
              fontFamily="var(--font-body)"
              fill="var(--color-text-secondary)"
              fontWeight="var(--font-weight-semibold)"
            >
              {Math.round(d.value)}
            </text>
          );
        })}

        {dimensions.map((d, i) => {
          const p = getPoint(i, 100, radius + 34);
          return (
            <text
              key={`label-${i}`}
              x={p.x.toFixed(2)}
              y={p.y.toFixed(2)}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="12"
              fontFamily="var(--font-body)"
              fill="var(--color-text)"
              fontWeight="var(--font-weight-medium)"
            >
              {d.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

export interface JourneyProgressGridProps {
  dimensions: RadarDimension[];
  accentColor?: string;
  className?: string;
}

export function JourneyProgressGrid({
  dimensions,
  accentColor = 'var(--color-accent)',
  className,
}: JourneyProgressGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 sm:grid-cols-3 gap-6',
        className,
      )}
      role="list"
      aria-label="Development dimension scores"
    >
      {dimensions.map((d) => {
        const score = Math.max(0, Math.min(100, d.value));
        return (
          <div
            key={d.key}
            role="listitem"
            className="flex flex-col items-center gap-3"
          >
            <div
              className="w-full flex items-end justify-center"
              style={{ height: 140 }}
            >
              <div
                className="w-14 relative"
                style={{
                  height: '100%',
                  backgroundColor: 'var(--color-bg-alt)',
                  border: '1px solid var(--color-border-subtle)',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: `${score}%`,
                    backgroundColor: accentColor,
                    transition: 'height var(--dur-normal) var(--ease-standard)',
                  }}
                />
                <div
                  className="absolute inset-x-0 flex justify-center items-center"
                  style={{ bottom: `calc(${score}% + 6px)` }}
                >
                  <span
                    className="text-xs font-semibold"
                    style={{
                      fontFamily: 'var(--font-body)',
                      color: 'var(--color-text)',
                    }}
                  >
                    {Math.round(score)}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-center">
              <p
                className="text-sm font-medium leading-snug"
                style={{
                  fontFamily: 'var(--font-body)',
                  color: 'var(--color-text)',
                }}
              >
                {d.label}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface MilestoneIconProps {
  icon: Milestone['icon'];
  color?: string;
  size?: number;
}

function MilestoneIconSvg({ icon, color = 'var(--color-accent)', size = 18 }: MilestoneIconProps) {
  const stroke = color;
  const fill = 'none';
  const sw = 1.8;
  switch (icon) {
    case 'assessment':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="square" strokeLinejoin="miter">
          <path d="M9 3h6l1 2h3v16H5V5h3l1-2z" />
          <path d="M9 12h6M9 16h6M9 8h6" />
        </svg>
      );
    case 'sessions':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="square" strokeLinejoin="miter">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      );
    case 'miles':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="square" strokeLinejoin="miter">
          <path d="M12 2L4 7v10l8 5 8-5V7l-8-5z" />
          <path d="M12 7v10M7 9.5l10 5M17 9.5L7 14.5" />
        </svg>
      );
    case 'goal':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="square" strokeLinejoin="miter">
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="12" cy="12" r="1.5" fill={stroke} />
        </svg>
      );
    case 'duration':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="square" strokeLinejoin="miter">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case 'tier':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="square" strokeLinejoin="miter">
          <path d="M2 19h20l-2-10-5 4-3-6-3 6-5-4-2 10z" />
          <path d="M5 19v2h14v-2" />
        </svg>
      );
    case 'diagnostics':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="square" strokeLinejoin="miter">
          <path d="M4 4h16v14H4z" />
          <path d="M4 18h16M4 22h16M7 14l3-4 3 3 4-6" />
        </svg>
      );
    case 'engagement':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="square" strokeLinejoin="miter">
          <path d="M12 3v4M5.6 5.6l2.8 2.8M3 12h4M5.6 18.4l2.8-2.8M12 17v4M18.4 18.4l-2.8-2.8M21 12h-4M18.4 5.6l-2.8 2.8" />
        </svg>
      );
    case 'reflection':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="square" strokeLinejoin="miter">
          <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <path d="M9 10h6M9 13h4" />
        </svg>
      );
    case 'resource':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="square" strokeLinejoin="miter">
          <path d="M4 4h10l6 6v10H4z" />
          <path d="M14 4v6h6" />
        </svg>
      );
    case 'network':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="square" strokeLinejoin="miter">
          <circle cx="12" cy="5" r="2" />
          <circle cx="5" cy="19" r="2" />
          <circle cx="19" cy="19" r="2" />
          <path d="M12 7v5M12 12l-7 5M12 12l7 5" />
        </svg>
      );
    case 'mastery':
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="square" strokeLinejoin="miter">
          <path d="M5 13l4 4L19 7" />
        </svg>
      );
  }
}

export interface MilestoneListProps {
  milestones: Milestone[];
  className?: string;
}

export function MilestoneList({ milestones, className }: MilestoneListProps) {
  const formatDate = (d: Date | string | null | undefined) => {
    if (!d) return '';
    try {
      const date = typeof d === 'string' ? new Date(d) : d;
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  if (milestones.length === 0) {
    return (
      <div
        className={cn(
          'px-6 py-8 text-center',
          className,
        )}
        style={{
          backgroundColor: 'var(--color-bg-alt)',
          border: '1px solid var(--color-border-subtle)',
        }}
      >
        <p
          className="text-sm"
          style={{
            fontFamily: 'var(--font-body)',
            color: 'var(--color-text-secondary)',
            lineHeight: 'var(--leading-body)',
          }}
        >
          Journey markers will appear here as you progress. They reflect sustained
          patterns of engagement and are not tied to any reward structure.
        </p>
      </div>
    );
  }

  return (
    <ol
      className={cn('relative pl-2', className)}
      role="list"
      aria-label="Achieved journey markers"
      style={{ listStyle: 'none', margin: 0 }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: 10,
          top: 4,
          bottom: 4,
          width: 1,
          backgroundColor: 'var(--color-border-strong)',
        }}
      />
      {milestones.map((m) => (
        <li
          key={m.id}
          className="relative pl-10 pb-8 last:pb-0"
          role="listitem"
        >
          <div
            aria-hidden
            style={{
              position: 'absolute',
              left: 2,
              top: 2,
              width: 17,
              height: 17,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'var(--color-card)',
              border: '1px solid var(--color-border-strong)',
            }}
          >
            <MilestoneIconSvg icon={m.icon} color="var(--color-accent)" size={12} />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-4 flex-wrap">
              <h4
                className="text-base font-semibold"
                style={{
                  fontFamily: 'var(--font-body)',
                  color: 'var(--color-text)',
                  letterSpacing: 'var(--tracking-tight)',
                  margin: 0,
                }}
              >
                {m.title}
              </h4>
              {m.achievedAt && (
                <span
                  className="text-xs"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--color-muted)',
                    letterSpacing: 'var(--tracking-wide)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {formatDate(m.achievedAt)}
                </span>
              )}
            </div>
            <p
              className="text-sm"
              style={{
                fontFamily: 'var(--font-body)',
                color: 'var(--color-text-secondary)',
                lineHeight: 'var(--leading-body)',
                margin: 0,
              }}
            >
              {m.description}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
