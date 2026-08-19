import React, { ReactNode } from 'react';
import { V1 } from '@/styles/v1-tokens';
import '@/styles/v1-motion.css';

export const ThreeDots: React.FC = () => {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
      <span className="v1-dot v1-dot-1" />
      <span className="v1-dot v1-dot-2" />
      <span className="v1-dot v1-dot-3" style={{ marginRight: 0 }} />
    </span>
  );
};

export const TypingIndicator: React.FC = () => {
  return (
    <div
      style={{
        marginLeft: '44px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
      }}
    >
      <ThreeDots />
      <span
        style={{
          fontFamily: V1.monoFont,
          fontSize: `${V1.textMonoPx}px`,
          letterSpacing: V1.trackingMono,
          textTransform: 'uppercase',
          color: V1.ink400,
        }}
      >
        NEXUS is thinking
      </span>
    </div>
  );
};

interface ButtonLoadingProps {
  label?: string;
  fgColor?: string;
}

export const ButtonLoading: React.FC<ButtonLoadingProps> = ({
  label = 'Sending',
  fgColor = V1.white,
}) => {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        fontFamily: V1.monoFont,
        fontSize: '0.7rem',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: fgColor,
      }}
    >
      <span>{label}</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', filter: fgColor !== V1.white ? undefined : 'brightness(0) invert(1)' }}>
        <ThreeDots />
      </span>
    </span>
  );
};

interface FormSubmittingStatusProps {
  message?: string;
}

export const FormSubmittingStatus: React.FC<FormSubmittingStatusProps> = ({
  message = 'Submitting…',
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        paddingTop: '8px',
        opacity: 0.8,
      }}
    >
      <span
        style={{
          fontFamily: V1.monoFont,
          fontSize: '0.7rem',
          color: V1.ink500,
        }}
      >
        {message}
      </span>
      <ThreeDots />
    </div>
  );
};

interface PageLoadingMonoProps {
  label?: string;
}

export const PageLoadingMono: React.FC<PageLoadingMonoProps> = ({
  label = 'Loading content…',
}) => {
  return (
    <div
      style={{
        display: 'block',
        width: '100%',
        padding: '40px 0',
        textAlign: 'center',
        backgroundColor: V1.cream,
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px',
          fontFamily: V1.monoFont,
          fontSize: '0.75rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: V1.ink500,
        }}
      >
        <span>{label}</span>
        <ThreeDots />
      </div>
    </div>
  );
};

interface LensQuestionCrossfadeProps {
  loading?: boolean;
  children: ReactNode;
}

export const LensQuestionCrossfade: React.FC<LensQuestionCrossfadeProps> = ({
  loading = false,
  children,
}) => {
  return (
    <div
      className="v1-question-fade"
      style={{
        opacity: loading ? 0.4 : 1,
        transition: `opacity 200ms ${V1.ease}`,
      }}
    >
      {children}
    </div>
  );
};

export default {
  ThreeDots,
  TypingIndicator,
  ButtonLoading,
  FormSubmittingStatus,
  PageLoadingMono,
  LensQuestionCrossfade,
};
