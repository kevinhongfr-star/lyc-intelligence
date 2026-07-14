import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Save, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui';

export interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  success?: boolean;
  autoComplete?: string;
  maxLength?: number;
  showCount?: boolean;
  rows?: number;
  multiline?: boolean;
  className?: string;
}

export function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  hint,
  required = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  success = false,
  autoComplete,
  maxLength,
  showCount = false,
  rows = 3,
  multiline = false,
  className = '',
}: FormFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (maxLength && val.length > maxLength) return;
    onChange(val);
  };

  const inputType = type === 'password' && showPassword ? 'text' : type;

  const inputClasses = `
    w-full px-4 py-2.5
    bg-white
    border rounded-none
    text-sm text-text-primary
    placeholder:text-text-muted
    focus:outline-none
    transition-all duration-200
    ${error
      ? 'border-red-300 focus:border-red-400 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]'
      : success
      ? 'border-green-300 focus:border-green-400 focus:shadow-[0_0_0_3px_rgba(34,197,94,0.1)]'
      : 'border-border focus:border-primary/40 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.06)]'
    }
    ${disabled ? 'bg-bg-alt cursor-not-allowed opacity-60' : ''}
    ${icon && iconPosition === 'left' ? 'pl-10' : ''}
    ${(icon && iconPosition === 'right') || type === 'password' ? 'pr-10' : ''}
  `;

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label
          htmlFor={name}
          className="text-sm font-medium text-text-primary flex items-center gap-1"
        >
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
        {maxLength && showCount && (
          <span className="text-xs text-text-muted">
            {value.length}/{maxLength}
          </span>
        )}
      </div>

      <div className="relative">
        {icon && iconPosition === 'left' && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
            {icon}
          </div>
        )}

        {multiline ? (
          <textarea
            id={name}
            name={name}
            value={value}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setIsFocused(false);
              onBlur?.();
            }}
            placeholder={placeholder}
            disabled={disabled}
            autoComplete={autoComplete}
            maxLength={maxLength}
            rows={rows}
            className={`${inputClasses} resize-y min-h-[80px]`}
          />
        ) : (
          <input
            id={name}
            name={name}
            type={inputType}
            value={value}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setIsFocused(false);
              onBlur?.();
            }}
            placeholder={placeholder}
            disabled={disabled}
            autoComplete={autoComplete}
            maxLength={maxLength}
            className={inputClasses}
          />
        )}

        {(icon && iconPosition === 'right') && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
            {icon}
          </div>
        )}

        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}

        {success && !error && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        )}

        {error && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
            <AlertCircle className="w-4 h-4" />
          </div>
        )}
      </div>

      {error ? (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export interface FormSelectProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function FormSelect({
  label,
  name,
  value,
  onChange,
  options,
  placeholder = 'Select...',
  error,
  hint,
  required = false,
  disabled = false,
  className = '',
}: FormSelectProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label
        htmlFor={name}
        className="text-sm font-medium text-text-primary flex items-center gap-1"
      >
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>

      <select
        id={name}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`
          w-full px-4 py-2.5
          bg-white
          border rounded-none
          text-sm text-text-primary
          focus:outline-none
          transition-all duration-200
          ${error
            ? 'border-red-300 focus:border-red-400 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]'
            : 'border-border focus:border-primary/40 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.06)]'
          }
          ${disabled ? 'bg-bg-alt cursor-not-allowed opacity-60' : ''}
          appearance-none
          bg-no-repeat
          bg-[right_0.75rem_center]
          pr-10
        `}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
          backgroundSize: '1.5em 1.5em',
        }}
      >
        {!value && <option value="">{placeholder}</option>}
        {options.map(opt => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>

      {error ? (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export interface FormCheckboxProps {
  label: string;
  name: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export function FormCheckbox({
  label,
  name,
  checked,
  onChange,
  description,
  disabled = false,
  className = '',
}: FormCheckboxProps) {
  return (
    <label className={`flex items-start gap-3 cursor-pointer ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${className}`}>
      <div className="mt-0.5">
        <input
          type="checkbox"
          id={name}
          name={name}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <div
          className={`w-5 h-5 border rounded-none flex items-center justify-center transition-all ${
            checked
              ? 'bg-primary border-primary'
              : 'bg-white border-gray-300'
          } ${disabled ? 'opacity-50' : ''}`}
        >
          {checked && (
            <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
      </div>
      <div className="flex-1">
        <span className="text-sm text-text-primary">{label}</span>
        {description && (
          <p className="text-xs text-text-muted mt-0.5">{description}</p>
        )}
      </div>
    </label>
  );
}

export interface SubmitButtonProps {
  isLoading?: boolean;
  isSuccess?: boolean;
  isError?: boolean;
  label?: string;
  loadingLabel?: string;
  successLabel?: string;
  errorLabel?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  fullWidth?: boolean;
  className?: string;
}

export function SubmitButton({
  isLoading = false,
  isSuccess = false,
  isError = false,
  label = 'Submit',
  loadingLabel = 'Saving...',
  successLabel = 'Saved!',
  errorLabel = 'Try Again',
  disabled = false,
  onClick,
  type = 'submit',
  variant = 'primary',
  fullWidth = false,
  className = '',
}: SubmitButtonProps) {
  const baseClasses = `
    relative px-4 py-2.5 text-sm font-medium rounded-none
    transition-all duration-200
    flex items-center justify-center gap-2
    ${fullWidth ? 'w-full' : ''}
    ${disabled || isLoading ? 'opacity-60 cursor-not-allowed' : ''}
  `;

  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary/90',
    secondary: 'bg-white border border-border text-text-primary hover:bg-bg-alt',
    ghost: 'text-text-primary hover:bg-bg-alt',
    danger: 'bg-red-500 text-white hover:bg-red-600',
  };

  const displayLabel = isLoading
    ? loadingLabel
    : isSuccess
    ? successLabel
    : isError
    ? errorLabel
    : label;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading || isSuccess}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {isSuccess && !isLoading && <CheckCircle2 className="w-4 h-4" />}
      {isError && !isLoading && <AlertCircle className="w-4 h-4" />}
      <span>{displayLabel}</span>
    </button>
  );
}

export interface AutoSaveIndicatorProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved?: string;
  onRetry?: () => void;
}

export function AutoSaveIndicator({ status, lastSaved, onRetry }: AutoSaveIndicatorProps) {
  if (status === 'idle') return null;

  const statusConfig = {
    saving: { icon: Loader2, text: 'Saving...', color: 'text-text-muted' },
    saved: { icon: CheckCircle2, text: 'Saved', color: 'text-green-600' },
    error: { icon: AlertCircle, text: 'Failed to save', color: 'text-red-600' },
    idle: { icon: Save, text: '', color: '' },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-1.5 text-xs ${config.color}`}>
      <Icon className={`w-3.5 h-3.5 ${status === 'saving' ? 'animate-spin' : ''}`} />
      <span>{config.text}</span>
      {status === 'saved' && lastSaved && (
        <span className="text-text-muted">&middot; {lastSaved}</span>
      )}
      {status === 'error' && onRetry && (
        <button
          onClick={onRetry}
          className="underline hover:text-red-700 ml-1"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export function useAutoSave<T>(
  value: T,
  onSave: (value: T) => Promise<void>,
  options: {
    delay?: number;
    enabled?: boolean;
  } = {}
) {
  const { delay = 2000, enabled = true } = options;
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<string | undefined>();
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const valueRef = useRef(value);

  valueRef.current = value;

  const save = useCallback(async () => {
    if (!enabled) return;
    setStatus('saving');
    try {
      await onSave(valueRef.current);
      setStatus('saved');
      setLastSaved(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
      setTimeout(() => setStatus('idle'), 2000);
    } catch {
      setStatus('error');
    }
  }, [onSave, enabled]);

  useEffect(() => {
    if (!enabled) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(save, delay);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [value, delay, save, enabled]);

  const retry = useCallback(() => {
    save();
  }, [save]);

  return { status, lastSaved, retry, forceSave: save };
}

export interface FormLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  columns?: 1 | 2 | 3;
  className?: string;
}

export function FormLayout({
  children,
  title,
  description,
  columns = 1,
  className = '',
}: FormLayoutProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  };

  return (
    <div className={className}>
      {(title || description) && (
        <div className="mb-6">
          {title && <h3 className="text-lg font-semibold text-text-primary">{title}</h3>}
          {description && <p className="text-sm text-text-muted mt-1">{description}</p>}
        </div>
      )}
      <div className={`grid ${gridCols[columns]} gap-6`}>
        {children}
      </div>
    </div>
  );
}

export interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({ title, description, children, className = '' }: FormSectionProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {(title || description) && (
        <div className="border-b border-border pb-3">
          {title && <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wider">{title}</h4>}
          {description && <p className="text-xs text-text-muted mt-1">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

export default {
  FormField,
  FormSelect,
  FormCheckbox,
  SubmitButton,
  AutoSaveIndicator,
  useAutoSave,
  FormLayout,
  FormSection,
};
