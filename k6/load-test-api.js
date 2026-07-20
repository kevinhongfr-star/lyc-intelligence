/**
 * k6/load-test-api.js — Load Testing Configuration
 * Issue #29: Performance testing infrastructure
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '5m', target: 50 },
    { duration: '10m', target: 100 },
    { duration: '5m', target: 200 },
    { duration: '10m', target: 200 },
    { duration: '5m', target: 0 },
  ],
  thresholds: {
    errors: ['rate<0.01'],
    http_req_duration: ['p(95)<200'],
    http_req_duration: ['p(99)<500'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const responses = http.batch([
    ['GET', `${BASE_URL}/api/mandates`, null, { tags: { name: 'MandatesList' } }],
    ['GET', `${BASE_URL}/api/candidates`, null, { tags: { name: 'CandidatesList' } }],
    ['GET', `${BASE_URL}/api/search?q=VP`, null, { tags: { name: 'Search' } }],
  ]);

  responses.forEach(res => {
    errorRate.add(res.status !== 200);
    check(res, {
      'status is 200': r => r.status === 200,
      'response time < 200ms': r => r.timings.duration < 200,
    });
  });

  sleep(1);
}
