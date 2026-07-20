import React from 'react';
import { COLORS, SPACING, RADII, SHADOWS, TRANSITIONS } from '@/styles/tokens';

interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number';
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export const Input: React.FC<InputProps> = ({ 
  type = 'text', 
  value, 
  onChange, 
  placeholder,
  label,
  error,
  disabled = false,
  className = '',
}) => (
  <div className={className}>
    {label && (
      <label
        style={{
          display: 'block',
          fontSize: `${SPACING[3]}px`,
          fontWeight: 500,
          color: COLORS.text,
          marginBottom: `${SPACING[2]}px`,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </label>
    )}
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        width: '100%',
        padding: `${SPACING[3]}px ${SPACING[4]}px`,
        fontSize: `${SPACING[4]}px`,
        backgroundColor: disabled ? COLORS.bg : COLORS.white,
        color: disabled ? COLORS.textMuted : COLORS.text,
        border: `1px solid ${error ? COLORS.error : COLORS.border}`,
        borderRadius: `${RADII.md}px`,
        boxShadow: SHADOWS.none,
        transition: TRANSITIONS.all,
        outline: 'none',
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = error ? COLORS.error : COLORS.primary;
        e.currentTarget.style.boxShadow = `0 0 0 3px ${error ? COLORS.errorLight : COLORS.primaryLight}`;
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = error ? COLORS.error : COLORS.border;
        e.currentTarget.style.boxShadow = SHADOWS.none;
      }}
    />
    {error && (
      <span
        style={{
          display: 'block',
          fontSize: `${SPACING[3]}px`,
          color: COLORS.error,
          marginTop: `${SPACING[1]}px`,
        }}
      >
        {error}
      </span>
    )}
  </div>
);

interface TextAreaProps {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  rows?: number;
  disabled?: boolean;
  className?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({ 
  value, 
  onChange, 
  placeholder,
  label,
  error,
  rows = 4,
  disabled = false,
  className = '',
}) => (
  <div className={className}>
    {label && (
      <label
        style={{
          display: 'block',
          fontSize: `${SPACING[3]}px`,
          fontWeight: 500,
          color: COLORS.text,
          marginBottom: `${SPACING[2]}px`,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </label>
    )}
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      style={{
        width: '100%',
        padding: `${SPACING[3]}px ${SPACING[4]}px`,
        fontSize: `${SPACING[4]}px`,
        backgroundColor: disabled ? COLORS.bg : COLORS.white,
        color: disabled ? COLORS.textMuted : COLORS.text,
        border: `1px solid ${error ? COLORS.error : COLORS.border}`,
        borderRadius: `${RADII.md}px`,
        boxShadow: SHADOWS.none,
        transition: TRANSITIONS.all,
        outline: 'none',
        resize: 'vertical',
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = error ? COLORS.error : COLORS.primary;
        e.currentTarget.style.boxShadow = `0 0 0 3px ${error ? COLORS.errorLight : COLORS.primaryLight}`;
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = error ? COLORS.error : COLORS.border;
        e.currentTarget.style.boxShadow = SHADOWS.none;
      }}
    />
    {error && (
      <span
        style={{
          display: 'block',
          fontSize: `${SPACING[3]}px`,
          color: COLORS.error,
          marginTop: `${SPACING[1]}px`,
        }}
      >
        {error}
      </span>
    )}
  </div>
);

interface SelectProps {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({ 
  value, 
  onChange, 
  label,
  error,
  disabled = false,
  className = '',
  children,
}) => (
  <div className={className}>
    {label && (
      <label
        style={{
          display: 'block',
          fontSize: `${SPACING[3]}px`,
          fontWeight: 500,
          color: COLORS.text,
          marginBottom: `${SPACING[2]}px`,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </label>
    )}
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      style={{
        width: '100%',
        padding: `${SPACING[3]}px ${SPACING[4]}px`,
        fontSize: `${SPACING[4]}px`,
        backgroundColor: disabled ? COLORS.bg : COLORS.white,
        color: disabled ? COLORS.textMuted : COLORS.text,
        border: `1px solid ${error ? COLORS.error : COLORS.border}`,
        borderRadius: `${RADII.md}px`,
        boxShadow: SHADOWS.none,
        transition: TRANSITIONS.all,
        outline: 'none',
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='${COLORS.textMuted}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 12px center',
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = error ? COLORS.error : COLORS.primary;
        e.currentTarget.style.boxShadow = `0 0 0 3px ${error ? COLORS.errorLight : COLORS.primaryLight}`;
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = error ? COLORS.error : COLORS.border;
        e.currentTarget.style.boxShadow = SHADOWS.none;
      }}
    >
      {children}
    </select>
    {error && (
      <span
        style={{
          display: 'block',
          fontSize: `${SPACING[3]}px`,
          color: COLORS.error,
          marginTop: `${SPACING[1]}px`,
        }}
      >
        {error}
      </span>
    )}
  </div>
);