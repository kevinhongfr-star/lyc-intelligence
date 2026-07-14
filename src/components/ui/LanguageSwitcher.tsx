import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useTranslation, LANGUAGES, type Language } from '@/i18n/I18nContext';

interface LanguageSwitcherProps {
  variant?: 'dropdown' | 'inline' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function LanguageSwitcher({
  variant = 'dropdown',
  size = 'md',
  showLabel = true,
  className = '',
}: LanguageSwitcherProps) {
  const { language, setLanguage, languages } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const currentLang = languages.find(l => l.code === language) || languages[0];

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base',
  };

  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-1 ${className}`} role="group" aria-label="Language selector">
        {languages.map(lang => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code as Language)}
            className={`
              px-3 py-1.5 text-sm font-medium border transition-colors
              ${language === lang.code
                ? 'bg-primary text-white border-primary'
                : 'border-border text-text-secondary hover:bg-bg-alt'
              }
            `}
            aria-pressed={language === lang.code}
            aria-label={`Switch to ${lang.nativeName}`}
          >
            <span className="mr-1.5" aria-hidden="true">{lang.flag}</span>
            {showLabel && lang.nativeName}
          </button>
        ))}
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div ref={ref} className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`p-2 hover:bg-bg-alt transition-colors ${sizeClasses[size]}`}
          aria-label={`Language: ${currentLang.nativeName}`}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span aria-hidden="true">{currentLang.flag}</span>
        </button>
        {isOpen && (
          <div
            className="absolute right-0 top-full mt-1 w-40 bg-white border border-border shadow-lg z-50"
            role="listbox"
            aria-label="Select language"
          >
            {languages.map(lang => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code as Language);
                  setIsOpen(false);
                }}
                className={`
                  w-full px-3 py-2 text-left text-sm hover:bg-bg-alt flex items-center gap-2
                  ${language === lang.code ? 'bg-bg-alt font-medium' : ''}
                `}
                role="option"
                aria-selected={language === lang.code}
              >
                <span aria-hidden="true">{lang.flag}</span>
                <span>{lang.nativeName}</span>
                {language === lang.code && <Check className="w-4 h-4 ml-auto text-primary" />}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          inline-flex items-center gap-2 border border-border bg-white hover:bg-bg-alt
          transition-colors font-medium text-text-primary
          ${sizeClasses[size]}
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Current language: ${currentLang.nativeName}. Click to change.`}
      >
        <Globe className="w-4 h-4 text-text-muted" aria-hidden="true" />
        <span>{currentLang.flag}</span>
        {showLabel && <span>{currentLang.nativeName}</span>}
        <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-1 w-56 bg-white border border-border shadow-lg z-50"
          role="listbox"
          aria-label="Select language"
        >
          {languages.map(lang => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code as Language);
                setIsOpen(false);
              }}
              className={`
                w-full px-4 py-2.5 text-left text-sm hover:bg-bg-alt flex items-center gap-3 transition-colors
                ${language === lang.code ? 'bg-bg-alt/60' : ''}
              `}
              role="option"
              aria-selected={language === lang.code}
            >
              <span className="text-lg" aria-hidden="true">{lang.flag}</span>
              <div className="flex-1">
                <div className={`font-medium ${language === lang.code ? 'text-primary' : 'text-text-primary'}`}>
                  {lang.nativeName}
                </div>
                <div className="text-xs text-text-muted">{lang.name}</div>
              </div>
              {language === lang.code && <Check className="w-4 h-4 text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
