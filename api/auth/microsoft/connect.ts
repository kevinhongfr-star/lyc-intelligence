/**
 * Microsoft OAuth Connect — DEX AI Technical Blueprint 09
 *
 * Initiates Outlook OAuth 2.0 authorization flow.
 * Redirects user to Microsoft login page.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const redirectUri = process.env.MICROSOFT_REDIRECT_URI;
    const tenantId = process.env.MICROSOFT_TENANT_ID || 'common';

    if (!clientId || !redirectUri) {
      return res.status(500).json({
        success: false,
        error: 'Microsoft OAuth not configured',
      });
    }

    const scopes = encodeURIComponent(
      'Mail.Read Mail.ReadWrite Mail.Send offline_access User.Read'
    );

    const state = req.query.state || Math.random().toString(36).slice(2);

    const authUrl =
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize` +
      `?client_id=${clientId}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_mode=query` +
      `&scope=${scopes}` +
      `&state=${state}`;

    return res.redirect(authUrl);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
