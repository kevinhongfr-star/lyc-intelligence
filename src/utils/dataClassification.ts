// Phase 5.7: PIPL Data Classification Utility
// Classifies data fields and records by sensitivity level per PIPL requirements

import type { DataCategory, ClassificationResult } from '@/types/pipl';
import { SENSITIVE_FIELD_MAP } from '@/types/pipl';

const CATEGORY_PRIORITY: DataCategory[] = [
  'standard',
  'financial',
  'sensitive',
  'biometric',
  'minor',
];

/**
 * Classify a single candidate/contact field by its data category.
 * Based on PIPL Article 28 - Sensitive Personal Information.
 */
export function classifyField(fieldName: string): ClassificationResult {
  const category = SENSITIVE_FIELD_MAP[fieldName] ?? 'standard';
  return buildClassificationResult(category);
}

/**
 * Classify an entire record (candidate, contact, etc.) based on its fields.
 * Returns the highest sensitivity category found and list of sensitive fields.
 */
export function classifyRecord(fields: Record<string, unknown>): {
  overall_category: DataCategory;
  sensitive_fields: string[];
  requires_separate_consent: boolean;
  requires_dpia: boolean;
  cross_border_restricted: boolean;
} {
  const sensitiveFields: string[] = [];
  let highestCategory: DataCategory = 'standard';

  for (const key of Object.keys(fields)) {
    const result = classifyField(key);
    if (result.category !== 'standard') {
      sensitiveFields.push(key);
      if (
        CATEGORY_PRIORITY.indexOf(result.category) >
        CATEGORY_PRIORITY.indexOf(highestCategory)
      ) {
        highestCategory = result.category;
      }
    }
  }

  const overallResult = buildClassificationResult(highestCategory);

  return {
    overall_category: highestCategory,
    sensitive_fields: sensitiveFields,
    requires_separate_consent: overallResult.requires_separate_consent,
    requires_dpia: overallResult.requires_dpia,
    cross_border_restricted: overallResult.cross_border_restricted,
  };
}

/**
 * Check if a data category requires separate consent per PIPL.
 * Separate consent is required for:
 * - Sensitive personal data (Article 29)
 * - Cross-border data transfer (Article 38)
 * - Marketing / commercial communications
 */
export function requiresSeparateConsent(category: DataCategory): boolean {
  return category !== 'standard';
}

/**
 * Check if processing requires a Data Protection Impact Assessment (DPIA).
 * Required under PIPL Article 55 for:
 * - Processing sensitive personal information
 * - Automated decision-making
 * - Cross-border data transfers
 * - Other high-risk processing activities
 */
export function requiresDPIA(category: DataCategory): boolean {
  return (
    category === 'biometric' ||
    category === 'sensitive' ||
    category === 'minor'
  );
}

/**
 * Check if data has cross-border transfer restrictions.
 * Under PIPL Article 38, certain data categories require:
 * - Security assessment
 * - Certification
 * - Standard contract
 */
export function isCrossBorderRestricted(category: DataCategory): boolean {
  return category !== 'standard';
}

/**
 * Determine if a field name likely contains PII based on common patterns.
 * Use as a fallback for fields not in the explicit map.
 */
export function isLikelyPII(fieldName: string): boolean {
  const lower = fieldName.toLowerCase();
  const piiPatterns = [
    'name',
    'email',
    'phone',
    'mobile',
    'address',
    'id_',
    'idcard',
    'passport',
    'photo',
    'avatar',
    'birth',
    'gender',
    'nationality',
    'ethnic',
    'wechat',
    'qq',
    'linkedin',
    'skype',
    'salary',
    'compensation',
    'bank',
    'account',
    'tax',
    'health',
    'medical',
    'disability',
    'religion',
    'political',
    'biometric',
    'fingerprint',
    'face',
    'voice',
    'location',
    'gps',
    'ip',
  ];

  return piiPatterns.some(pattern => lower.includes(pattern));
}

/**
 * Get the label for a data category (for UI display)
 */
export function getCategoryLabel(category: DataCategory): string {
  const labels: Record<DataCategory, string> = {
    standard: 'Standard',
    sensitive: 'Sensitive',
    biometric: 'Biometric',
    financial: 'Financial',
    minor: 'Minor (under 14)',
  };
  return labels[category] || 'Standard';
}

/**
 * Get description of compliance requirements for a category
 */
export function getCategoryRequirements(category: DataCategory): {
  consent: string;
  dpia: string;
  cross_border: string;
  retention: string;
} {
  switch (category) {
    case 'biometric':
      return {
        consent: 'Separate written consent required (PIPL Art. 29)',
        dpia: 'DPIA required before processing (PIPL Art. 55)',
        cross_border: 'Security assessment or certification required (PIPL Art. 38)',
        retention: 'Minimum necessary retention, delete after purpose fulfilled',
      };
    case 'sensitive':
      return {
        consent: 'Separate consent required (PIPL Art. 29)',
        dpia: 'DPIA required before processing (PIPL Art. 55)',
        cross_border: 'Standard contract or certification required (PIPL Art. 38)',
        retention: 'Minimum necessary retention period',
      };
    case 'financial':
      return {
        consent: 'Separate consent recommended',
        dpia: 'DPIA recommended',
        cross_border: 'Standard contract recommended',
        retention: 'Per financial record retention requirements',
      };
    case 'minor':
      return {
        consent: 'Guardian consent required (PIPL Art. 31)',
        dpia: 'DPIA required before processing (PIPL Art. 55)',
        cross_border: 'Highest level of protection for cross-border transfer',
        retention: 'Delete immediately after purpose fulfilled',
      };
    case 'standard':
    default:
      return {
        consent: 'General consent or other legal basis',
        dpia: 'Generally not required',
        cross_border: 'Standard contract sufficient',
        retention: 'Per business needs, delete when no longer necessary',
      };
  }
}

// Helper to build classification result
function buildClassificationResult(category: DataCategory): ClassificationResult {
  return {
    category,
    requires_separate_consent: requiresSeparateConsent(category),
    requires_dpia: requiresDPIA(category),
    cross_border_restricted: isCrossBorderRestricted(category),
  };
}

export default {
  classifyField,
  classifyRecord,
  requiresSeparateConsent,
  requiresDPIA,
  isCrossBorderRestricted,
  isLikelyPII,
  getCategoryLabel,
  getCategoryRequirements,
};
