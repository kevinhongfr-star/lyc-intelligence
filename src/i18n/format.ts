import { useTranslation } from './I18nContext';
import { useMemo } from 'react';

const LOCALE_MAP: Record<string, string> = {
  en: 'en-US',
  fr: 'fr-FR',
  zh: 'zh-CN',
};

export function useLocale(): string {
  const { language } = useTranslation();
  return LOCALE_MAP[language] || 'en-US';
}

export function useNumberFormat(options?: Intl.NumberFormatOptions) {
  const locale = useLocale();
  return useMemo(() => new Intl.NumberFormat(locale, options), [locale, JSON.stringify(options)]);
}

export function useDateFormat(options?: Intl.DateTimeFormatOptions) {
  const locale = useLocale();
  return useMemo(() => new Intl.DateTimeFormat(locale, options), [locale, JSON.stringify(options)]);
}

export function useCurrencyFormat(currency: string = 'USD') {
  const locale = useLocale();
  return useMemo(
    () => new Intl.NumberFormat(locale, { style: 'currency', currency }),
    [locale, currency]
  );
}

export function useRelativeTimeFormat(unit: Intl.RelativeTimeFormatUnit = 'day') {
  const locale = useLocale();
  return useMemo(
    () => new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }),
    [locale]
  );
}

export function formatNumber(value: number, locale: string = 'en-US', options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

export function formatDate(date: Date | string | number, locale: string = 'en-US', options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, options).format(d);
}

export function formatCurrency(value: number, currency: string = 'USD', locale: string = 'en-US'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
}

export function formatRelativeTime(
  value: number,
  unit: Intl.RelativeTimeFormatUnit,
  locale: string = 'en-US'
): string {
  return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(value, unit);
}

export function formatList(items: string[], locale: string = 'en-US', type: 'conjunction' | 'disjunction' = 'conjunction'): string {
  if (typeof Intl.ListFormat !== 'undefined') {
    return new Intl.ListFormat(locale, { type, style: 'long' }).format(items);
  }
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return type === 'conjunction' ? `${items[0]} and ${items[1]}` : `${items[0]} or ${items[1]}`;
  const last = items[items.length - 1];
  const rest = items.slice(0, -1).join(', ');
  return type === 'conjunction' ? `${rest}, and ${last}` : `${rest}, or ${last}`;
}

export function getLocaleFromLanguage(language: string): string {
  return LOCALE_MAP[language] || 'en-US';
}

export function getDirection(language: string): 'ltr' | 'rtl' {
  const rtlLangs = ['ar', 'he', 'fa', 'ur'];
  return rtlLangs.includes(language) ? 'rtl' : 'ltr';
}
