/**
 * v1 Request validators — Zod schemas + validation helpers.
 *
 * Each endpoint's input shape is defined as a Zod schema. The validateBody
 * / validateQuery helpers parse and return a typed result.
 *
 * Uses Zod's native SafeParseReturnType for proper discriminated-union
 * narrowing (the success/error branches each have access to their
 * respective .data or .error fields without casting).
 */

import { z, type SafeParseReturnType } from 'zod';
import type { VercelRequest } from '@vercel/node';

// ─── Common schemas ────────────────────────────────────────────────

export const uuidSchema = z.string().uuid('Must be a valid UUID');

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
});

export const sortSchema = z.object({
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

export const searchSchema = z.object({
  q: z.string().min(1).max(200).optional(),
});

// ─── Contact schemas ──────────────────────────────────────────────

export const contactCreateSchema = z.object({
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().max(50).optional(),
  company: z.string().max(200).optional(),
  title: z.string().max(200).optional(),
  linkedin_url: z.string().url().optional(),
  source: z.string().max(50).optional(),
  tags: z.array(z.string()).optional(),
});

export const contactUpdateSchema = contactCreateSchema.partial();

// ─── Mandate schemas ──────────────────────────────────────────────

export const mandateCreateSchema = z.object({
  title: z.string().min(1).max(300),
  company_name: z.string().min(1).max(200),
  client_id: uuidSchema.optional(),
  function_area: z.string().max(100).optional(),
  seniority: z.string().max(50).optional(),
  location: z.string().max(200).optional(),
  status: z.enum(['draft', 'active', 'paused', 'closed', 'won', 'lost']).default('draft'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  description: z.string().optional(),
});

export const mandateUpdateSchema = mandateCreateSchema.partial();

// ─── Campaign schemas ─────────────────────────────────────────────

export const campaignCreateSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(['outreach', 'nurture', 'event', 'referral', 'other']).default('outreach'),
  status: z.enum(['draft', 'active', 'paused', 'completed', 'archived']).default('draft'),
  target_audience: z.string().max(500).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  description: z.string().optional(),
});

export const campaignUpdateSchema = campaignCreateSchema.partial();

// ─── Helper functions ─────────────────────────────────────────────

/** Parse and validate JSON body from a request using a Zod schema. */
export function validateBody<T extends z.ZodType>(
  req: VercelRequest,
  schema: T
): SafeParseReturnType<z.infer<T>, z.infer<T>> {
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  return schema.safeParse(body) as SafeParseReturnType<z.infer<T>, z.infer<T>>;
}

/** Parse and validate query params from a request using a Zod schema. */
export function validateQuery<T extends z.ZodType>(
  req: VercelRequest,
  schema: T
): SafeParseReturnType<z.infer<T>, z.infer<T>> {
  return schema.safeParse(req.query || {}) as SafeParseReturnType<z.infer<T>, z.infer<T>>;
}

/** Extract the first error message from a Zod error for user-friendly output. */
export function firstZodError(result: { error?: { issues: Array<{ path: Array<string | number>; message: string }> } }): string {
  const issues = result.error?.issues;
  if (!issues || issues.length === 0) return "Validation failed";
  const firstIssue = issues[0];
  const path = firstIssue.path.join(".");
  return path ? `${path}: ${firstIssue.message}` : firstIssue.message;
}
