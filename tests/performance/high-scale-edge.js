import http from 'k6/http';
import { check, sleep } from 'k6';

// High-Scale Edge Stress Test
// Targets the optimized Edge endpoints to verify the performance gains
export const options = {
  stages: [
    { duration: '1m', target: 100 },  // Ramp up to 100 concurrent users
    { duration: '2m', target: 500 },  // Ramp up to 500 users (High scale)
    { duration: '2m', target: 1000 }, // Peak load: 1000 concurrent users
    { duration: '2m', target: 1000 }, // Hold 1000 users
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'],  // 95% of requests must be under 200ms
    http_req_failed: ['rate<0.01'],    // Failure rate must be under 1%
  },
};

export default function () {
  const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
  
  // 1. Test Landing Page (Now SSG optimized)
  const landingRes = http.get(BASE_URL);
  check(landingRes, {
    'landing status is 200': (r) => r.status === 200,
    'landing ttfb < 100ms': (r) => r.timings.waiting < 100,
  });

  // 2. Test Optimized API (Edge Runtime)
  const apiRes = http.get(`${BASE_URL}/api/test-rate-limit`);
  check(apiRes, {
    'api status is 200 or 429': (r) => r.status === 200 || r.status === 429,
    'api duration < 150ms': (r) => r.timings.duration < 150,
  });

  sleep(0.1); // Fast simulated browsing
}
