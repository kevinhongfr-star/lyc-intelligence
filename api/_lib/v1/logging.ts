/**
 * v1 Structured logging.
 *
 * All v1 endpoints log through these helpers so output is consistent
 * JSON shape that's easy to grep or ship to a log aggregator.
 *
 * Levels: debug < info < warn < error
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  [key: string]: unknown;
}

const SERVICE = 'v1-api';

function formatLog(level: LogLevel, message: string, extra?: Record<string, unknown>): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    service: SERVICE,
    message,
    ...extra,
  };
}

export function logDebug(message: string, extra?: Record<string, unknown>): void {
  if (process.env.LOG_LEVEL === 'debug') {
    console.debug(JSON.stringify(formatLog('debug', message, extra)));
  }
}

export function logInfo(message: string, extra?: Record<string, unknown>): void {
  console.info(JSON.stringify(formatLog('info', message, extra)));
}

export function logWarn(message: string, extra?: Record<string, unknown>): void {
  console.warn(JSON.stringify(formatLog('warn', message, extra)));
}

export function logError(message: string, extra?: Record<string, unknown>): void {
  console.error(JSON.stringify(formatLog('error', message, extra)));
}

/** Time an async operation and log it. */
export async function withTiming<T>(
  operation: string,
  fn: () => Promise<T>,
  extra?: Record<string, unknown>
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    const durationMs = Date.now() - start;
    logDebug(`${operation} completed`, { durationMs, ...extra });
    return result;
  } catch (err) {
    const durationMs = Date.now() - start;
    logError(`${operation} failed`, {
      durationMs,
      error: err instanceof Error ? err.message : String(err),
      ...extra,
    });
    throw err;
  }
}
