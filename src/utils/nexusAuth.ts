// Phase 0.6: NEXUS Auth Utility
// HMAC-SHA256 signature verification and signing for NEXUS webhooks and commands

import crypto from 'crypto';

const NEXUS_WEBHOOK_SECRET =
  process.env.NEXUS_WEBHOOK_SECRET || process.env.NEXUS_API_SECRET || '';
const NEXUS_API_SECRET =
  process.env.NEXUS_API_SECRET || process.env.NEXUS_WEBHOOK_SECRET || '';

const SIGNATURE_PREFIX = 'sha256=';
const SIGNATURE_ALGORITHM = 'sha256';

/**
 * Verify HMAC-SHA256 signature for incoming NEXUS webhook requests.
 * Uses timing-safe comparison to prevent timing attacks.
 */
export function verifyNexusSignature(
  payload: string,
  signature: string,
  secret?: string
): boolean {
  const signingSecret = secret ?? NEXUS_WEBHOOK_SECRET;

  if (!signingSecret) {
    console.warn('[nexusAuth] No webhook secret configured, skipping verification');
    return true;
  }

  if (!signature) {
    return false;
  }

  try {
    const expected = createHmacSignature(payload, signingSecret);
    const expectedFull = `${SIGNATURE_PREFIX}${expected}`;
    const providedFull = signature.startsWith(SIGNATURE_PREFIX)
      ? signature
      : `${SIGNATURE_PREFIX}${signature}`;

    return crypto.timingSafeEqual(
      Buffer.from(expectedFull),
      Buffer.from(providedFull)
    );
  } catch (err) {
    console.error('[nexusAuth] Signature verification failed:', err);
    return false;
  }
}

/**
 * Verify NEXUS command signature (uses API secret, separate from webhook)
 */
export function verifyNexusCommandSignature(
  payload: string,
  signature: string
): boolean {
  return verifyNexusSignature(payload, signature, NEXUS_API_SECRET);
}

/**
 * Create HMAC-SHA256 signature for outgoing DEX → NEXUS webhook events
 */
export function signNexusPayload(
  payload: string,
  secret?: string
): string {
  const signingSecret = secret ?? NEXUS_WEBHOOK_SECRET;

  if (!signingSecret) {
    console.warn('[nexusAuth] No webhook secret configured, returning empty signature');
    return '';
  }

  return createHmacSignature(payload, signingSecret);
}

/**
 * Sign a DEX → NEXUS request with full header format (sha256=<hex>)
 */
export function signNexusRequest(payload: string, secret?: string): string {
  const signature = signNexusPayload(payload, secret);
  return `${SIGNATURE_PREFIX}${signature}`;
}

/**
 * Internal: Create raw HMAC hex digest
 */
function createHmacSignature(payload: string, secret: string): string {
  return crypto
    .createHmac(SIGNATURE_ALGORITHM, secret)
    .update(payload, 'utf8')
    .digest('hex');
}

/**
 * Generate a webhook secret (for setup / configuration)
 */
export function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Extract timestamp from signature header (if using v2 format with timestamp)
 * Format: t=<timestamp>,sha256=<signature>
 */
export function parseSignatureHeader(
  header: string
): { timestamp?: string; signature: string } {
  const parts = header.split(',');
  let timestamp: string | undefined;
  let signature = '';

  for (const part of parts) {
    const [key, value] = part.split('=');
    if (key === 't') {
      timestamp = value;
    } else if (key === 'sha256') {
      signature = value;
    }
  }

  return { timestamp, signature };
}

/**
 * Verify signature with timestamp replay protection.
 * Rejects requests older than the maxAge (default 5 minutes).
 */
export function verifyNexusSignatureWithTimestamp(
  payload: string,
  header: string,
  maxAgeSeconds: number = 300,
  secret?: string
): { valid: boolean; reason?: string } {
  const { timestamp, signature } = parseSignatureHeader(header);

  if (!signature) {
    return { valid: false, reason: 'No signature found' };
  }

  if (timestamp) {
    const requestTime = parseInt(timestamp, 10) * 1000;
    const now = Date.now();
    const ageMs = now - requestTime;

    if (isNaN(ageMs) || ageMs > maxAgeSeconds * 1000) {
      return { valid: false, reason: 'Request timestamp too old' };
    }

    // Reconstruct signed payload: timestamp + '.' + payload
    const signedPayload = `${timestamp}.${payload}`;
    const valid = verifyNexusSignature(signedPayload, signature, secret);
    return { valid, reason: valid ? undefined : 'Signature mismatch' };
  }

  // Fallback to simple verification
  const valid = verifyNexusSignature(payload, signature, secret);
  return { valid, reason: valid ? undefined : 'Signature mismatch' };
}

export default {
  verifyNexusSignature,
  verifyNexusCommandSignature,
  signNexusPayload,
  signNexusRequest,
  generateWebhookSecret,
  parseSignatureHeader,
  verifyNexusSignatureWithTimestamp,
};
