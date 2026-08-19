import React from 'react';
import { V1 } from '@/styles/v1-tokens';

export interface DateSeparatorProps {
  date: string;
}

export function DateSeparator({ date }: DateSeparatorProps): React.ReactElement {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '24px 0 16px 0',
    }}>
      <div style={{
        flex: 1,
        height: 1,
        background: V1.ink100,
      }} />
      <span style={{
        fontFamily: V1.monoFont,
        fontSize: '0.7rem',
        letterSpacing: V1.trackingMono,
        textTransform: 'uppercase',
        color: V1.ink400,
        lineHeight: V1.leadingLabel,
        whiteSpace: 'nowrap',
        fontWeight: V1.fwMedium,
      }}>
        {date}
      </span>
      <div style={{
        flex: 1,
        height: 1,
        background: V1.ink100,
      }} />
    </div>
  );
}

export function ConversationContextBar(): React.ReactElement {
  return (
    <div style={{
      marginBottom: 8,
    }}>
      {/* Top mono label */}
      <div style={{
        textAlign: 'center',
        marginBottom: 16,
      }}>
        <span style={{
          fontFamily: V1.monoFont,
          fontSize: '0.7rem',
          letterSpacing: V1.trackingMono,
          textTransform: 'uppercase',
          color: V1.ink400,
          lineHeight: V1.leadingLabel,
          fontWeight: V1.fwMedium,
        }}>
          Single continuous conversation
        </span>
      </div>

      {/* Session date divider: Today · Aug 19, 2026 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 4,
      }}>
        <div style={{
          flex: 1,
          height: 1,
          background: V1.ink100,
        }} />
        <span style={{
          fontFamily: V1.monoFont,
          fontSize: '0.65rem',
          letterSpacing: V1.trackingMono,
          textTransform: 'uppercase',
          color: V1.ink500,
          lineHeight: V1.leadingLabel,
          whiteSpace: 'nowrap',
        }}>
          Session · Today · Aug 19, 2026
        </span>
        <div style={{
          flex: 1,
          height: 1,
          background: V1.ink100,
        }} />
      </div>
    </div>
  );
}

export interface SingleConversationViewProps {
  children: React.ReactNode;
}

function SingleConversationView({ children }: SingleConversationViewProps): React.ReactElement {
  return (
    <div style={{
      paddingBottom: 80,
    }}>
      <ConversationContextBar />
      {children}
    </div>
  );
}

export default SingleConversationView;
