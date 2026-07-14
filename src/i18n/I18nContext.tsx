import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import en from './translations/en.json';
import fr from './translations/fr.json';
import zh from './translations/zh.json';

export type Language = 'en' | 'fr' | 'zh';

export interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
];

type Translations = typeof en;

const translations: Record<Language, Translations> = {
  en,
  fr,
  zh,
};

const STORAGE_KEY = 'lyc-language';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  languages: LanguageOption[];
  isRTL: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

function getNestedValue(obj: any, path: string): string | undefined {
  return path.split('.').reduce((acc, part) => {
    if (acc == null) return undefined;
    return acc[part];
  }, obj);
}

function interpolate(text: string, params?: Record<string, string | number>): string {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (match, key) => {
    return params[key] !== undefined ? String(params[key]) : match;
  });
}

function detectLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (stored && translations[stored]) {
      return stored;
    }
  } catch {}
  
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith('fr')) return 'fr';
  if (browserLang.startsWith('zh')) return 'zh';
  
  return 'en';
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const detected = detectLanguage();
    setLanguageState(detected);
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      document.documentElement.dir = language === 'ar' || language === 'he' ? 'rtl' : 'ltr';
    }
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {}
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const dict = translations[language];
      const value = getNestedValue(dict, key);
      
      if (typeof value === 'string') {
        return interpolate(value, params);
      }
      
      const fallback = getNestedValue(translations.en, key);
      if (typeof fallback === 'string') {
        return interpolate(fallback, params);
      }
      
      return key;
    },
    [language]
  );

  const isRTL = useMemo(() => {
    return language === 'ar' || language === 'he';
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      languages: LANGUAGES,
      isRTL,
    }),
    [language, setLanguage, t, isRTL]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}

export function withTranslation<P extends object>(
  Component: React.ComponentType<P & { t: typeof useTranslation; language: Language }>
) {
  return function WrappedComponent(props: P) {
    const i18n = useTranslation();
    return <Component {...props} t={i18n.t as any} language={i18n.language} />;
  };
}
