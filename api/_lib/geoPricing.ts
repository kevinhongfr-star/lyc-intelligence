export const SUPPORTED_CURRENCIES = ['USD', 'CNY'] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

const EXCHANGE_RATES: Record<SupportedCurrency, number> = {
  USD: 1.0,
  CNY: 7.25,
};

export function setExchangeRate(currency: SupportedCurrency, rate: number): void {
  if (rate <= 0) throw new Error('Exchange rate must be positive');
  EXCHANGE_RATES[currency] = rate;
}

export function getExchangeRate(currency: SupportedCurrency): number {
  return EXCHANGE_RATES[currency];
}

export function convertPrice(amountUSD: number, currency: SupportedCurrency): number {
  if (currency === 'USD') return amountUSD;
  const rate = EXCHANGE_RATES[currency];
  return Math.round(amountUSD * rate * 100) / 100;
}

export function getLocalizedPrice(amountUSD: number, currency: SupportedCurrency): string {
  const converted = convertPrice(amountUSD, currency);
  const symbols: Record<SupportedCurrency, string> = {
    USD: '$',
    CNY: '¥',
  };
  const symbol = symbols[currency];
  return `${symbol}${converted.toFixed(2)}`;
}

export function detectUserCurrency(req: any): SupportedCurrency {
  if (!req) return 'USD';

  const acceptLanguage = req.headers?.['accept-language'] || req.headers?.['Accept-Language'] || '';
  if (typeof acceptLanguage === 'string' && acceptLanguage.toLowerCase().startsWith('zh')) {
    return 'CNY';
  }

  const ip = req.headers?.['x-forwarded-for'] || req.headers?.['x-real-ip'] || '';
  const countryCode = detectCountryFromIp(ip);
  if (countryCode === 'CN') {
    return 'CNY';
  }

  return 'USD';
}

function detectCountryFromIp(ip: string): string | null {
  if (!ip) return null;
  const segments = ip.split('.');
  if (segments.length === 4) {
    const firstOctet = parseInt(segments[0], 10);
    if (firstOctet >= 1 && firstOctet <= 223) {
      return null;
    }
  }
  return null;
}