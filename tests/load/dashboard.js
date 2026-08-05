/**
 * S4-T05 — Dashboard load test
 * 50 concurrent authenticated users, 30s. p95 < 2s, p99 < 5s, error rate < 1%.
 *
 * Simulates an authenticated user landing on the candidate dashboard and
 * hitting the primary data API (v_pipeline_rankings via Supabase REST).
 *
 * Usage:
 *   export BASE_URL=https://staging.lyc-intelligence.app
 *   export SUPABASE_URL=https://rnnlteyqmtxkzllbohuu.supabase.co
 *   export SUPABASE_ANON_KEY=...
 *   export K6_TEST_EMAIL=loadtest@example.com
 *   export K6_TEST_PASSWORD='...'
 *   k6 run tests/load/dashboard.js
 */

export const options = {
  scenarios: {
    dashboard: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5s', target: 50 },
        { duration: '30s', target: 50 },
        { duration: '5s', target: 0 },
      ],
      gracefulRampDown: '5s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<2000', 'p(99)<5000'],
    http_req_failed: ['rate<0.01'],
  },
};

import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = __ENV.BASE_URL || 'http://localhost:4173';
const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://rnnlteyqmtxkzllbohuu.supabase.co';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY || '';
const TEST_EMAIL = __ENV.K6_TEST_EMAIL || '';
const TEST_PASSWORD = __ENV.K6_TEST_PASSWORD || '';

export default function () {
  if (!TEST_EMAIL || !TEST_PASSWORD || !SUPABASE_ANON_KEY) {
    console.error('K6_TEST_EMAIL / K6_TEST_PASSWORD / SUPABASE_ANON_KEY env vars are required');
    return;
  }

  // 1. Authenticate
  const authRes = http.post(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    {
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
      },
    },
  );

  if (authRes.status !== 200) {
    console.error(`auth failed: ${authRes.status} ${authRes.body}`);
    return;
  }

  const accessToken = JSON.parse(authRes.body).access_token;

  // 2. Load dashboard HTML (Vercel serves the SPA shell)
  const pageRes = http.get(`${BASE}/candidate/dashboard`, {
    headers: { Cookie: `sb-access-token=${accessToken}` },
  });
  check(pageRes, { 'dashboard html 200': (r) => r.status === 200 });

  // 3. Fetch primary data view (v_pipeline_rankings) as the SPA would
  const dataRes = http.get(
    `${SUPABASE_URL}/rest/v1/v_pipeline_rankings?select=*&order=rank.asc&limit=50`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    },
  );

  check(dataRes, {
    'data status 200': (r) => r.status === 200,
    'returns json array': (r) => {
      try {
        return Array.isArray(JSON.parse(r.body));
      } catch {
        return false;
      }
    },
  });

  sleep(2); // simulate user reading the dashboard
}
