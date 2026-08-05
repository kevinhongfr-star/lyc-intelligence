/**
 * S4-T05 — API throughput load test
 * Sustains 100 req/s for 60s against the Supabase REST API.
 * p95 < 2s, p99 < 5s, error rate < 1%.
 *
 * Hits the lightweight `scoring_config` table (9 rows) as a proxy for
 * API responsiveness. Adjust TARGET_TABLE for a heavier endpoint.
 *
 * Usage:
 *   export SUPABASE_URL=https://rnnlteyqmtxkzllbohuu.supabase.co
 *   export SUPABASE_ANON_KEY=...
 *   k6 run tests/load/api-throughput.js
 */

export const options = {
  scenarios: {
    constant_throughput: {
      executor: 'constant-arrival-rate',
      rate: 100,            // 100 iterations per second
      timeUnit: '1s',
      duration: '60s',
      preAllocatedVUs: 50,  // pre-allocate enough VUs to sustain the rate
      maxVUs: 200,          // allow burst if iterations take longer than expected
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<2000', 'p(99)<5000'],
    http_req_failed: ['rate<0.01'],
  },
};

import http from 'k6/http';
import { check } from 'k6';

const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://rnnlteyqmtxkzllbohuu.supabase.co';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY || '';
const TARGET_TABLE = __ENV.TARGET_TABLE || 'scoring_config';

export default function () {
  if (!SUPABASE_ANON_KEY) {
    console.error('SUPABASE_ANON_KEY env var is required');
    return;
  }

  const res = http.get(
    `${SUPABASE_URL}/rest/v1/${TARGET_TABLE}?select=*&limit=10`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Accept: 'application/json',
      },
    },
  );

  check(res, {
    'status 200': (r) => r.status === 200,
    'has body': (r) => r.body && r.body.length > 2,
  });
}
