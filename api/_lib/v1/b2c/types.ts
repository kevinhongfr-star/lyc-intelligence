/**
 * B2C v1 — shared types.
 *
 * All b2c endpoints use these types. Resource-specific payloads live alongside
 * their adapters (chat.ts, assessments.ts, etc.); this file contains the
 * cross-cutting envelope types that the response layer expects.
 */

import type { UserRole } from '../../../../src/types/index.js';
import type { UserType, V1AuthUser } from '../auth.js';

/**
 * A resolved B2C user. For now this is exactly V1AuthUser, but keeping the
 * alias so if we ever attach plan/tier metadata we can do it here without
 * touching every call-site.
 */
export interface B2cUser extends V1AuthUser {}

/** Narrow guard: a V1AuthUser is a B2C caller if their user_type is b2c. */
export function isB2cUser(u: V1AuthUser | null): u is B2cUser {
  return u?.user_type === 'b2c';
}

/** Credit tier that appears on balance + store responses. */
export type CreditTier =
  | 'executive_intro'  // free
  | 'starter'
  | 'professional'
  | 'premium'
  | 'council';

/** Assessment types currently supported. */
export type AssessmentType = 'shift_leap' | 'shift_quest' | 'executive_snapshot';

/** Suggestion urgency, mirrors the legacy ProactiveSuggestion model. */
export type SuggestionUrgency = 'low' | 'medium' | 'high' | 'critical';

// Ensure these are reachable from the module so imports don't get auto-stripped
// in project-level strict-tsconfigs that unused-style warnings.
export type { UserRole, UserType };
