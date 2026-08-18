export type SessionBucket = 'light' | 'standard' | 'signature' | 'flagship';
export type SessionKey = 'light_30' | 'standard_45' | 'signature_60' | 'flagship_90';
export type SessionTypeKey = 'expert' | 'coach' | 'consultant' | 'cpi_specialist';

export interface SessionConfig {
  bucket: SessionBucket;
  miles: 1 | 2 | 3 | 5;
  durationMinutes: 30 | 45 | 60 | 90;
  label: string;
  recommendedInstruments: string[];
}

export interface SessionType {
  key: SessionTypeKey;
  title: string;
  description: string;
}

export const SESSION_BUCKETS: Readonly<Record<SessionKey, SessionConfig>> = {
  light_30: {
    bucket: 'light',
    miles: 1,
    durationMinutes: 30,
    label: 'Light Debrief',
    recommendedInstruments: ['LEAP'],
  },
  standard_45: {
    bucket: 'standard',
    miles: 2,
    durationMinutes: 45,
    label: 'Standard Debrief',
    recommendedInstruments: ['PRISM', 'IMPACT', 'COACH', 'DRIVE', 'QUEST'],
  },
  signature_60: {
    bucket: 'signature',
    miles: 3,
    durationMinutes: 60,
    label: 'Signature Debrief',
    recommendedInstruments: ['BRIDGE', 'MOSAIC', 'SPARK', 'FORGE'],
  },
  flagship_90: {
    bucket: 'flagship',
    miles: 5,
    durationMinutes: 90,
    label: 'Flagship Debrief',
    recommendedInstruments: ['CPI'],
  },
};

export const SESSION_BUCKET_ORDER: readonly SessionKey[] = [
  'light_30',
  'standard_45',
  'signature_60',
  'flagship_90',
] as const;

export const SESSION_TYPES: Readonly<Record<SessionTypeKey, SessionType>> = {
  expert: {
    key: 'expert',
    title: 'Executive Diagnostic Specialist',
    description: 'Certified specialist in executive diagnostic interpretation and results walkthrough.',
  },
  coach: {
    key: 'coach',
    title: 'Leadership Coach',
    description: 'Executive coach who translates diagnostic insights into actionable development plans.',
  },
  consultant: {
    key: 'consultant',
    title: 'Senior Consultant',
    description: 'Senior consultant with deep market context and advisory-level debrief experience.',
  },
  cpi_specialist: {
    key: 'cpi_specialist',
    title: 'CPI (China Leadership Pipeline Index) Specialist',
    description: 'Dedicated CPI specialist trained in the China Leadership Pipeline Index methodology and APAC executive benchmarks.',
  },
};

export const INSTRUMENT_TO_SESSION_RECS: Readonly<Record<string, readonly SessionTypeKey[]>> = {
  LEAP: ['expert'],
  PRISM: ['coach', 'expert'],
  IMPACT: ['coach', 'expert'],
  COACH: ['coach', 'expert'],
  DRIVE: ['coach', 'expert'],
  QUEST: ['coach', 'expert'],
  BRIDGE: ['consultant', 'coach'],
  MOSAIC: ['consultant', 'coach'],
  SPARK: ['consultant', 'coach'],
  FORGE: ['consultant', 'coach'],
  CPI: ['cpi_specialist', 'consultant'],
};

export function getSessionKeyByMiles(miles: number): SessionKey | null {
  switch (miles) {
    case 1: return 'light_30';
    case 2: return 'standard_45';
    case 3: return 'signature_60';
    case 5: return 'flagship_90';
    default: return null;
  }
}

export function getDurationByMiles(miles: number): 30 | 45 | 60 | 90 | null {
  switch (miles) {
    case 1: return 30;
    case 2: return 45;
    case 3: return 60;
    case 5: return 90;
    default: return null;
  }
}

export const BOOKING_WINDOW_MIN_DAYS = 2;
export const BOOKING_WINDOW_MAX_DAYS = 60;

export const TIME_SLOTS: readonly string[] = [
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
  '17:30',
] as const;
