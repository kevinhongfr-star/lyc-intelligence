/**
 * v1 Standardized response envelope.
 *
 * Every v1 endpoint returns the same shape:
 *   { success: boolean, data?: T, error?: string, meta?: Record<string, unknown> }
 */

import type { VercelResponse } from '@vercel/node';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: Record<string, unknown>;
}

export function sendSuccess<T>(res: VercelResponse, data: T, meta?: Record<string, unknown>): void {
  const body: ApiResponse<T> = { success: true, data };
  if (meta) body.meta = meta;
  res.status(200).json(body);
}

export function sendCreated<T>(res: VercelResponse, data: T, meta?: Record<string, unknown>): void {
  const body: ApiResponse<T> = { success: true, data };
  if (meta) body.meta = meta;
  res.status(201).json(body);
}

export function sendError(res: VercelResponse, status: number, error: string): void {
  res.status(status).json({ success: false, error } as ApiResponse);
}

export function sendNotFound(res: VercelResponse, resource: string = 'Resource'): void {
  sendError(res, 404, `${resource} not found`);
}

export function sendBadRequest(res: VercelResponse, error: string = 'Bad request'): void {
  sendError(res, 400, error);
}

export function sendUnauthorized(res: VercelResponse, error: string = 'Unauthorized'): void {
  sendError(res, 401, error);
}

export function sendForbidden(res: VercelResponse, error: string = 'Forbidden'): void {
  sendError(res, 403, error);
}

export function sendTooManyRequests(res: VercelResponse, retryAfterSeconds: number = 60): void {
  res.setHeader('Retry-After', String(retryAfterSeconds));
  sendError(res, 429, `Rate limit exceeded. Try again in ${retryAfterSeconds}s.`);
}
