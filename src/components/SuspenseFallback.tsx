import React from 'react';
import { Skeleton } from '@/components/ui';
import { V1 } from '@/styles/v1-tokens';

export interface SuspenseFallbackProps {
  lines?: number;
  label?: string;
  spinner?: boolean;
}

const DOT_KEYFRAMES = `
  @keyframes v1-dot-bounce {
    0%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-3px); }
  }
`;

const DOT_BASE: React.CSSProperties = {
  display: 'inline-block',
  width: 4,
  height: 4,
  backgroundColor: V1.teal600,
  borderRadius: 0,
  verticalAlign: 'middle',
};

export function SuspenseFallback({
  lines = 3,
  label = 'Loading…',
  spinner = false,
}: SuspenseFallbackProps) {
  return (
    <div role="status" aria-live="polite" aria-label={label}>
      <style>{DOT_KEYFRAMES}</style>
      {spinner && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 12,
          }}
        >
          <span
            style={{
              fontFamily: V1.monoFont,
              fontSize: V1.textMonoPx,
              color: V1.ink700,
              letterSpacing: V1.trackingMono,
              textTransform: 'uppercase',
            }}
          >
            Loading
            <span aria-hidden="true">
              <span
                style={{
                  ...DOT_BASE,
                  marginLeft: 2,
                  animation: 'v1-dot-bounce 1s infinite ease-in-out',
                  animationDelay: '0s',
                }}
              />
              <span
                style={{
                  ...DOT_BASE,
                  marginLeft: 2,
                  animation: 'v1-dot-bounce 1s infinite ease-in-out',
                  animationDelay: '0.15s',
                }}
              />
              <span
                style={{
                  ...DOT_BASE,
                  marginLeft: 2,
                  animation: 'v1-dot-bounce 1s infinite ease-in-out',
                  animationDelay: '0.3s',
                }}
              />
            </span>
          </span>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} variant="shimmer" width={i === 0 ? '50%' : '100%'} />
        ))}
      </div>
      <span
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: 'hidden',
          clip: 'rect(0,0,0,0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      >
        {label}
      </span>
    </div>
  );
}

export default SuspenseFallback;
