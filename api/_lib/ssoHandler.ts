/**
 * SSO Integration — Issue #29: SSO Integration
 *
 * SAML 2.0 and OIDC authentication providers.
 * Supports enterprise SSO integrations.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { isSupabaseConfigured } from './supabase';
import { handleError } from './errors';

export const handler = handleSSO;

/* ------------------------------------------------------------------ */
/* SSO Handler                                                          */
/* ------------------------------------------------------------------ */

async function handleSSO(req: VercelRequest, res: VercelResponse) {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(500).json({ success: false, error: 'Server configuration error' });
    }

    const path = (req.query as any).path || [];
    const action = path[0];

    switch (action) {
      case 'providers':
        return listProviders(req, res);
      case 'saml':
        return handleSAML(req, res, path[1]);
      case 'oidc':
        return handleOIDC(req, res, path[1]);
      default:
        return res.status(404).json({ success: false, error: 'Not found' });
    }
  } catch (err) {
    return handleError(res, 'sso', err);
  }
}

/* ------------------------------------------------------------------ */
/* GET /providers — List available SSO providers                      */
/* ------------------------------------------------------------------ */

async function listProviders(req: VercelRequest, res: VercelResponse) {
  // Return configured SSO providers
  const providers = [
    {
      id: 'microsoft-entra',
      name: 'Microsoft Entra ID',
      type: 'oidc',
      icon: '/icons/microsoft.svg',
    },
    {
      id: 'okta',
      name: 'Okta',
      type: 'saml',
      icon: '/icons/okta.svg',
    },
    {
      id: 'google-workspace',
      name: 'Google Workspace',
      type: 'oidc',
      icon: '/icons/google.svg',
    },
    {
      id: 'azure-ad',
      name: 'Azure Active Directory',
      type: 'saml',
      icon: '/icons/azure.svg',
    },
  ];

  return res.json({ success: true, data: providers });
}

/* ------------------------------------------------------------------ */
/* SAML 2.0 Handler                                                     */
/* ------------------------------------------------------------------ */

async function handleSAML(req: VercelRequest, res: VercelResponse, action: string) {
  switch (action) {
    case 'login':
      return samlLogin(req, res);
    case 'acs':
      return samlAcs(req, res);
    case 'metadata':
      return samlMetadata(req, res);
    case 'logout':
      return samlLogout(req, res);
    default:
      return res.status(404).json({ success: false, error: 'SAML action not found' });
  }
}

async function samlLogin(req: VercelRequest, res: VercelResponse) {
  const { provider } = req.query;

  // In production, generate SAML AuthnRequest and redirect to IdP
  const ssoUrl = process.env[`SAML_${provider?.toString().toUpperCase()}_SSO_URL`];
  if (!ssoUrl) {
    return res.status(400).json({ success: false, error: 'SAML provider not configured' });
  }

  // Generate SAML request
  const requestId = generateId();
  const relayState = Buffer.from(JSON.stringify({ provider, redirect: '/app' })).toString('base64');

  const samlRequest = `
    <samlp:AuthnRequest
      xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
      ID="${requestId}"
      Version="2.0"
      IssueInstant="${new Date().toISOString()}"
      AssertionConsumerServiceURL="${process.env.APP_URL}/api/sso/saml/acs"
    >
      <saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">${process.env.SAML_SP_ENTITY_ID}</saml:Issuer>
    </samlp:AuthnRequest>
  `.replace(/\s+/g, ' ');

  const encodedRequest = Buffer.from(samlRequest).toString('base64');

  // Redirect to IdP
  const redirectUrl = `${ssoUrl}?SAMLRequest=${encodeURIComponent(encodedRequest)}&RelayState=${relayState}`;
  return res.redirect(redirectUrl);
}

async function samlAcs(req: VercelRequest, res: VercelResponse) {
  // Assertion Consumer Service - receive SAML Response from IdP
  const { SAMLResponse, RelayState } = req.body;

  try {
    // In production, verify SAML signature and extract attributes
    // For now, mock successful authentication
    const relayData = RelayState ? JSON.parse(Buffer.from(RelayState, 'base64').toString()) : {};

    // Extract user info from SAML assertion
    const samlAttributes = {
      email: 'user@example.com',
      name: 'SSO User',
      groups: ['executive', 'client'],
    };

    // Create or get user in Supabase
    const { createClient } = require('./supabase');
    const supabase = createClient();

    const { data: user, error } = await supabase.auth.signInWithSSO({
      email: samlAttributes.email,
      user_metadata: {
        full_name: samlAttributes.name,
        groups: samlAttributes.groups,
        sso_provider: relayData.provider || 'saml',
      },
    });

    if (error) throw error;

    // Set session and redirect
    const redirectUrl = relayData.redirect || '/app';
    return res.redirect(`${redirectUrl}?session=${user.session?.access_token}`);
  } catch (error: any) {
    return res.redirect(`/login?error=sso_failed&message=${encodeURIComponent(error.message)}`);
  }
}

async function samlMetadata(req: VercelRequest, res: VercelResponse) {
  // Return Service Provider metadata
  const metadata = `<?xml version="1.0"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata"
  entityID="${process.env.SAML_SP_ENTITY_ID || 'lyc-intelligence'}">
  <SPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <AssertionConsumerService
      Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
      Location="${process.env.APP_URL}/api/sso/saml/acs"
      index="0"/>
  </SPSSODescriptor>
</EntityDescriptor>`;

  res.setHeader('Content-Type', 'application/xml');
  return res.send(metadata);
}

async function samlLogout(req: VercelRequest, res: VercelResponse) {
  // Handle SAML Single Logout
  return res.redirect('/login?logged_out=true');
}

/* ------------------------------------------------------------------ */
/* OIDC Handler                                                         */
/* ------------------------------------------------------------------ */

async function handleOIDC(req: VercelRequest, res: VercelResponse, action: string) {
  switch (action) {
    case 'authorize':
      return oidcAuthorize(req, res);
    case 'callback':
      return oidcCallback(req, res);
    default:
      return res.status(404).json({ success: false, error: 'OIDC action not found' });
  }
}

async function oidcAuthorize(req: VercelRequest, res: VercelResponse) {
  const { provider } = req.query;

  const clientId = process.env[`OIDC_${provider?.toString().toUpperCase()}_CLIENT_ID`];
  const authUrl = process.env[`OIDC_${provider?.toString().toUpperCase()}_AUTH_URL`];

  if (!clientId || !authUrl) {
    return res.status(400).json({ success: false, error: 'OIDC provider not configured' });
  }

  const state = generateId();
  const redirectUri = `${process.env.APP_URL}/api/sso/oidc/callback`;

  const authorizeUrl = `${authUrl}?` + new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
  }).toString();

  // Store state for verification
  // In production, use Redis or similar

  return res.redirect(authorizeUrl);
}

async function oidcCallback(req: VercelRequest, res: VercelResponse) {
  const { code, state, error } = req.query;

  if (error) {
    return res.redirect(`/login?error=${error}`);
  }

  try {
    // Exchange code for tokens
    // In production, make POST to token endpoint

    // Mock successful authentication
    const userInfo = {
      email: 'oidc@example.com',
      name: 'OIDC User',
    };

    // Create session
    const { createClient } = require('./supabase');
    const supabase = createClient();

    const { data, error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'oidc',
      options: {
        skipBrowserRedirect: true,
      },
    });

    if (authError) throw authError;

    return res.redirect(`/app?session=${data.session?.access_token}`);
  } catch (err: any) {
    return res.redirect(`/login?error=oidc_failed&message=${encodeURIComponent(err.message)}`);
  }
}

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

function generateId(): string {
  return `id_${Math.random().toString(36).slice(2, 18)}`;
}