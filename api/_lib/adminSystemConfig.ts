/**
 * adminSystemConfig.ts — System-wide configuration, feature flags.
 *
 * Manages system-wide settings and feature flags that control
 * platform behavior across all organizations.
 */

import {
  selectOne,
  selectMany,
  insert,
  update,
  isSupabaseConfigured,
} from './supabaseRest.js';

export type ConfigScope = 'global' | 'org' | 'role';

export interface SystemConfig {
  id: string;
  key: string;
  value: any;
  scope: ConfigScope;
  scope_target: string | null;
  description: string | null;
  updated_by: string | null;
  updated_at: string;
  created_at: string;
}

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string | null;
  is_enabled: boolean;
  rollout_percentage: number;
  allowed_roles: string[] | null;
  org_override: Record<string, boolean> | null;
  updated_by: string | null;
  updated_at: string;
  created_at: string;
}

export interface CreateConfigInput {
  key: string;
  value: any;
  scope?: ConfigScope;
  scope_target?: string;
  description?: string;
}

export interface UpdateConfigInput {
  value?: any;
  description?: string;
}

export interface CreateFeatureFlagInput {
  key: string;
  name: string;
  description?: string;
  is_enabled?: boolean;
  rollout_percentage?: number;
  allowed_roles?: string[];
  org_override?: Record<string, boolean>;
}

export const SYSTEM_CONFIG_KEYS = {
  SESSION_TIMEOUT_MINUTES: 'session_timeout_minutes',
  MAX_LOGIN_ATTEMPTS: 'max_login_attempts',
  PASSWORD_MIN_LENGTH: 'password_min_length',
  REQUIRE_EMAIL_VERIFICATION: 'require_email_verification',
  ENABLE_AUDIT_LOGGING: 'enable_audit_logging',
  AUDIT_RETENTION_DAYS: 'audit_retention_days',
  MAX_UPLOAD_SIZE_MB: 'max_upload_size_mb',
  DEFAULT_TIMEZONE: 'default_timezone',
  DATE_FORMAT: 'date_format',
  DEFAULT_CURRENCY: 'default_currency',
  TAX_RATE: 'tax_rate',
  PLATFORM_NAME: 'platform_name',
  SUPPORT_EMAIL: 'support_email',
  PRIVACY_POLICY_URL: 'privacy_policy_url',
  TERMS_OF_SERVICE_URL: 'terms_of_service_url',
} as const;

export async function listConfigs(
  scope?: ConfigScope
): Promise<SystemConfig[]> {
  if (!isSupabaseConfigured()) return [];

  const where = scope ? [{ column: 'scope', value: scope, op: 'eq' }] : undefined;
  const configs = await selectMany('system_configs', {
    select: 'id,key,value,scope,scope_target,description,updated_by,updated_at,created_at',
    where,
    orderBy: { column: 'key', ascending: true },
  });

  return configs as SystemConfig[];
}

export async function getConfigByKey(
  key: string,
  scope: ConfigScope = 'global',
  scopeTarget?: string
): Promise<SystemConfig | null> {
  if (!isSupabaseConfigured()) return null;

  const filters: { column: string; value: any; op?: string }[] = [
    { column: 'key', value: key, op: 'eq' },
    { column: 'scope', value: scope, op: 'eq' },
  ];
  if (scopeTarget) {
    filters.push({ column: 'scope_target', value: scopeTarget, op: 'eq' });
  }

  const config = await selectOne('system_configs', {
    column: 'key',
    value: key,
    select: 'id,key,value,scope,scope_target,description,updated_by,updated_at,created_at',
  });

  return config as SystemConfig | null;
}

export async function createConfig(
  input: CreateConfigInput,
  adminId: string
): Promise<SystemConfig> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  if (!input.key?.trim()) throw new Error('Config key is required');

  const existing = await getConfigByKey(input.key, input.scope || 'global', input.scope_target);
  if (existing) throw new Error(`Config key "${input.key}" already exists for this scope`);

  const config = await insert('system_configs', {
    key: input.key.trim(),
    value: input.value,
    scope: input.scope || 'global',
    scope_target: input.scope_target || null,
    description: input.description || null,
    updated_by: adminId,
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  });

  return config as SystemConfig;
}

export async function updateConfig(
  id: string,
  input: UpdateConfigInput,
  adminId: string
): Promise<SystemConfig> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

  const updates: Record<string, any> = {
    updated_by: adminId,
    updated_at: new Date().toISOString(),
  };
  if (input.value !== undefined) updates.value = input.value;
  if (input.description !== undefined) updates.description = input.description;

  const result = await update('system_configs', { column: 'id', value: id }, updates);
  const updated = result[0];
  if (!updated) throw new Error('Config not found');

  return updated as SystemConfig;
}

export async function listFeatureFlags(): Promise<FeatureFlag[]> {
  if (!isSupabaseConfigured()) return [];

  const flags = await selectMany('feature_flags', {
    select: 'id,key,name,description,is_enabled,rollout_percentage,allowed_roles,org_override,updated_by,updated_at,created_at',
    orderBy: { column: 'key', ascending: true },
  });

  return flags as FeatureFlag[];
}

export async function getFeatureFlag(key: string): Promise<FeatureFlag | null> {
  if (!isSupabaseConfigured()) return null;

  const flag = await selectOne('feature_flags', {
    column: 'key',
    value: key,
    select: 'id,key,name,description,is_enabled,rollout_percentage,allowed_roles,org_override,updated_by,updated_at,created_at',
  });

  return flag as FeatureFlag | null;
}

export async function createFeatureFlag(
  input: CreateFeatureFlagInput,
  adminId: string
): Promise<FeatureFlag> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  if (!input.key?.trim()) throw new Error('Feature flag key is required');

  const existing = await getFeatureFlag(input.key);
  if (existing) throw new Error(`Feature flag "${input.key}" already exists`);

  const flag = await insert('feature_flags', {
    key: input.key.trim(),
    name: input.name.trim(),
    description: input.description || null,
    is_enabled: input.is_enabled ?? false,
    rollout_percentage: input.rollout_percentage ?? 100,
    allowed_roles: input.allowed_roles || null,
    org_override: input.org_override || null,
    updated_by: adminId,
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  });

  return flag as FeatureFlag;
}

export async function updateFeatureFlag(
  key: string,
  updates: Partial<Pick<FeatureFlag, 'is_enabled' | 'rollout_percentage' | 'allowed_roles' | 'org_override' | 'name' | 'description'>>,
  adminId: string
): Promise<FeatureFlag> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

  const updateData: Record<string, any> = {
    updated_by: adminId,
    updated_at: new Date().toISOString(),
  };

  if ('is_enabled' in updates) updateData.is_enabled = updates.is_enabled;
  if ('rollout_percentage' in updates) updateData.rollout_percentage = updates.rollout_percentage;
  if ('allowed_roles' in updates) updateData.allowed_roles = updates.allowed_roles;
  if ('org_override' in updates) updateData.org_override = updates.org_override;
  if ('name' in updates) updateData.name = updates.name;
  if ('description' in updates) updateData.description = updates.description;

  const result = await update('feature_flags', { column: 'key', value: key }, updateData);
  const updated = result[0];
  if (!updated) throw new Error('Feature flag not found');

  return updated as FeatureFlag;
}

export function isFeatureFlagEnabled(
  flag: FeatureFlag,
  context: { orgId?: string; role?: string; userId?: string }
): boolean {
  if (!flag.is_enabled) return false;

  if (context.orgId && flag.org_override && context.orgId in flag.org_override) {
    return flag.org_override[context.orgId];
  }

  if (flag.allowed_roles && flag.allowed_roles.length > 0) {
    if (context.role && !flag.allowed_roles.includes(context.role)) {
      return false;
    }
  }

  if (flag.rollout_percentage < 100 && context.userId) {
    const hash = hashString(context.userId + flag.key);
    const bucket = hash % 100;
    return bucket < flag.rollout_percentage;
  }

  return true;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return Math.abs(hash);
}
