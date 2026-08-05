/**
 * S4-T05 — k6 load testing scenarios for LYC Intelligence
 *
 * Targets (per spec):
 *   - Homepage:        100 concurrent users, 30s
 *   - Login flow:       50 concurrent users, 30s
 *   - Dashboard load:   50 concurrent users, 30s
 *   - API endpoints:   100 req/s for 60s
 *
 * Acceptance: p95 < 2s, p99 < 5s, error rate < 1%
 *
 * Usage:
 *   1. Install k6:  https://k6.io/docs/getting-started/installation/
 *   2. Set BASE_URL (defaults to local preview):
 *        export BASE_URL=https://www.lyc-intelligence.app
 *   3. Run a scenario:
 *        k6 run tests/load/homepage.js
 *        k6 run tests/load/login.js
 *        k6 run tests/load/dashboard.js
 *        k6 run tests/load/api-throughput.js
 *
 * Thresholds are enforced per-script; CI gate can be added once a staging URL
 * is available. Run from an external runner (not Vercel edge) for realistic
 * network latency.
 */

export const options = {
  scenarios: {
    homepage: {
      executor: 'ramping-vus',
      exec: 'homepage',
      startVUs: 0,
      stages: [
        { duration: '5s', target: 100 },   // ramp up to 100 VUs
        { duration: '30s', target: 100 },  // hold 100 VUs for 30s
        { duration: '5s', target: 0 },     // ramp down
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

export function homepage() {
  const res = http.get(`${BASE}/`);
  check(res, {
    'status is 200': (r) => r.status === 200,
    'body has hero text': (r) => r.body && r.body.length > 1000,
  });
  sleep(1);
}
