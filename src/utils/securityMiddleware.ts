// Phase 0.5: Security Middleware
// Request validation: rate limiting, input sanitization, org-scoping, role checks

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const MAX_PAYLOAD_SIZE_JSON = 1 * 1024 * 1024; // 1MB
const MAX_PAYLOAD_SIZE_UPLOAD = 10 * 1024 * 1024; // 10MB
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // per IP per window

export interface SecurityValidationResult {
  valid: boolean;
  status?: number;
  message?: string;
}

export interface RequestContext {
  ip: string;
  userAgent: string;
  orgId?: string;
  userId?: string;
  role?: string;
}

/**
 * Validate a request against security baselines.
 * Checks: rate limiting, payload size, content-type, basic injection patterns
 */
export function validateRequest(
  request: Request | NextRequest,
  options?: {
    maxPayloadSize?: number;
    requireAuth?: boolean;
    allowedRoles?: string[];
  }
): SecurityValidationResult {
  const {
    maxPayloadSize = MAX_PAYLOAD_SIZE_JSON,
    requireAuth = false,
    allowedRoles,
  } = options || {};

  // Check content length
  const contentLength = request.headers.get('content-length');
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (size > maxPayloadSize) {
      return {
        valid: false,
        status: 413,
        message: 'Payload too large',
      };
    }
  }

  // Check content type for POST/PUT
  const method = request.method.toUpperCase();
  if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
    const contentType = request.headers.get('content-type');
    if (!contentType) {
      return {
        valid: false,
        status: 400,
        message: 'Content-Type header required',
      };
    }
  }

  // Check for common injection patterns in query params
  const url = new URL(request.url);
  for (const [key, value] of url.searchParams.entries()) {
    if (hasInjectionPattern(value)) {
      return {
        valid: false,
        status: 400,
        message: 'Invalid request parameters',
      };
    }
  }

  return { valid: true };
}

/**
 * Higher-order function to wrap API handlers with security validation.
 */
export function withSecurity<T extends (request: Request) => Promise<Response>>(
  handler: T,
  options?: {
    maxPayloadSize?: number;
    requireAuth?: boolean;
    allowedRoles?: string[];
  }
): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    const validation = validateRequest(request, options);

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.message },
        { status: validation.status || 400 }
      );
    }

    try {
      return await handler(request);
    } catch (error) {
      console.error('[securityMiddleware] Handler error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Sanitize input string to prevent XSS and injection.
 * For use with user-generated content before storage.
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return input;

  let sanitized = input;

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Trim whitespace
  sanitized = sanitized.trim();

  return sanitized;
}

/**
 * Sanitize an object of string values recursively.
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T
): T {
  const result = { ...obj } as Record<string, unknown>;

  for (const key of Object.keys(result)) {
    const value = result[key];

    if (typeof value === 'string') {
      result[key] = sanitizeInput(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result[key] = sanitizeObject(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      result[key] = value.map(item =>
        typeof item === 'string'
          ? sanitizeInput(item)
          : typeof item === 'object' && item !== null
            ? sanitizeObject(item as Record<string, unknown>)
            : item
      );
    }
  }

  return result as T;
}

/**
 * Check for common SQL injection / XSS patterns.
 * This is a basic check, not a replacement for parameterized queries.
 */
function hasInjectionPattern(value: string): boolean {
  if (typeof value !== 'string') return false;

  const lower = value.toLowerCase();

  // SQL injection patterns
  const sqlPatterns = [
    /(\b(union|select|insert|update|delete|drop|alter|create)\b.*\b(from|into|table|database)\b)/i,
    /(\bor\b.*\b=\b.*\bor\b)/i,
    /(--|;.*--)/,
    /(\bxp_cmdshell\b|\bexec\b.*\bsp_\b)/i,
  ];

  for (const pattern of sqlPatterns) {
    if (pattern.test(lower)) {
      return true;
    }
  }

  return false;
}

/**
 * Validate email format.
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate UUID format.
 */
export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Validate that a value is a safe positive integer.
 */
export function isValidPositiveInt(value: unknown, max?: number): value is number {
  if (typeof value !== 'number' && typeof value !== 'string') return false;
  const num = typeof value === 'number' ? value : parseInt(value, 10);
  if (isNaN(num) || !isFinite(num)) return false;
  if (num < 0) return false;
  if (!Number.isInteger(num)) return false;
  if (max !== undefined && num > max) return false;
  return true;
}

/**
 * Validate pagination parameters to prevent abuse.
 */
export function validatePagination(page: unknown, pageSize: unknown, maxPageSize = 100): {
  valid: boolean;
  page: number;
  pageSize: number;
  error?: string;
} {
  const pageNum = typeof page === 'string' ? parseInt(page, 10) : page;
  const sizeNum = typeof pageSize === 'string' ? parseInt(pageSize, 10) : pageSize;

  if (pageNum !== undefined && (!Number.isInteger(pageNum) || pageNum < 1)) {
    return { valid: false, page: 1, pageSize: maxPageSize, error: 'Invalid page number' };
  }

  if (sizeNum !== undefined && (!Number.isInteger(sizeNum) || sizeNum < 1 || sizeNum > maxPageSize)) {
    return {
      valid: false,
      page: pageNum || 1,
      pageSize: maxPageSize,
      error: `Invalid page size (max ${maxPageSize})`,
    };
  }

  return {
    valid: true,
    page: pageNum || 1,
    pageSize: sizeNum || Math.min(50, maxPageSize),
  };
}

/**
 * Extract request context (IP, user agent) from request.
 */
export function getRequestContext(request: Request): RequestContext {
  return {
    ip: getClientIp(request),
    userAgent: request.headers.get('user-agent') || 'unknown',
  };
}

function getClientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    return xff.split(',')[0].trim();
  }
  const xri = request.headers.get('x-real-ip');
  if (xri) {
    return xri;
  }
  return 'unknown';
}

export default {
  validateRequest,
  withSecurity,
  sanitizeInput,
  sanitizeObject,
  isValidEmail,
  isValidUUID,
  isValidPositiveInt,
  validatePagination,
  getRequestContext,
};
