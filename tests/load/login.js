/**
 * S4-T05 — Login flow load test
 * 50 concurrent users, 30s. p95 < 2s, p99 < 5s, error rate < 1%.
 *
 * NOTE: Uses a shared test credential pair injected via K6_TEST_EMAIL /
 * K6_TEST_PASSWORD env vars. Create a dedicated low-privilege test account in
 * Supabase Auth before running — never use real user credentials.
 *
 * Usage:
 *   export BASE_URL=https://staging.lyc-intelligence.app
 *   export K6_TEST_EMAIL=loadtest@example.com
 *   export K6_TEST_PASSWORD='...'
 *   k6 run tests/load/login.js
 */

export const options = {
  scenarios: {
    login: {
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
  if (!TEST_EMAIL || !TEST_PASSWORD) {
    console.error('K6_TEST_EMAIL / K6_TEST_PASSWORD env vars are required');
    return;
  }

  const url = `${SUPABASE_URL}/auth/v1/token?grant_type=password`;
  const params = {
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
    },
  };
  const payload = JSON.stringify({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  const res = http.post(url, payload, params);

  check(res, {
    'login status 200': (r) => r.status === 200,
    'returns access_token': (r) => {
      try {
        const body = JSON.parse(r.body);
        return !!body.access_token;
      } catch {
        return false;
      }
    },
  });

  sleep(1);
}
