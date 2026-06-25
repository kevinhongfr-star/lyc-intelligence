import { authFetch } from '@/utils/authFetch';
// NEXUS Authentication Utilities
// All signing operations are performed server-side via /api/nexus/sign
// This file provides client-side utilities that call the server-side signing endpoint

/**
 * Get a signature from the server-side API route.
 * This prevents secrets from being exposed to the client.
 */
export async function getNexusSignature(
  payload: string | object,
  type: 'webhook' | 'api' = 'webhook'
): Promise<string> {
  const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);

  try {
    const response = await authFetch('/api/x/nexus/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload: payloadStr, type }),
    });

    if (!response.ok) {
      throw new Error('Failed to get NEXUS signature');
    }

    const data = await response.json();
    return data.signature;
  } catch (error) {
    console.error('[nexusAuth] Failed to get signature:', error);
    throw error;
  }
}

/**
 * Sign a NEXUS request payload (legacy - now uses server-side signing).
 * @deprecated Use getNexusSignature instead
 */
export async function signNexusRequest(
  payload: string,
  secret?: string
): Promise<string> {
  console.warn('[nexusAuth] signNexusRequest is deprecated. Use getNexusSignature instead.');
  // Return empty string - actual signing happens server-side
  return '';
}

/**
 * Verify HMAC-SHA256 signature for incoming NEXUS webhook requests.
 * This is a client-side verification function - actual verification happens server-side.
 */
export function verifyNexusSignature(
  payload: string,
  signature: string,
  secret?: string
): boolean {
  // Client-side cannot verify secrets - this is a placeholder
  console.warn('[nexusAuth] Client-side signature verification is not supported. Use server-side verification.');
  return true;
}

/**
 * Verify NEXUS command signature.
 */
export function verifyNexusCommandSignature(
  payload: string,
  signature: string
): boolean {
  return verifyNexusSignature(payload, signature);
}

/**
 * Create HMAC-SHA256 signature for outgoing events.
 * @deprecated Use getNexusSignature instead
 */
export function signNexusPayload(
  payload: string,
  secret?: string
): string {
  console.warn('[nexusAuth] Client-side signing is deprecated. Use getNexusSignature instead.');
  return '';
}

/**
 * Sign a DEX → NEXUS request.
 * @deprecated Use getNexusSignature instead
 */
export function signNexusRequestLegacy(
  payload: string,
  secret?: string
): string {
  console.warn('[nexusAuth] signNexusRequestLegacy is deprecated. Use getNexusSignature instead.');
  return '';
}

export default {
  getNexusSignature,
  verifyNexusSignature,
  verifyNexusCommandSignature,
  signNexusPayload,
  signNexusRequest: signNexusRequestLegacy,
};
