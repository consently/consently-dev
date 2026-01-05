import http from 'k6/http';
import { check, sleep } from 'k6';

// Stress Test Configuration
// This test simulates a rapid increase in traffic to see how the API handles it
export const options = {
  stages: [
    { duration: '1m', target: 50 },  // Ramp up to 50 concurrent users
    { duration: '2m', target: 50 },  // Stay at 50 users
    { duration: '1m', target: 100 }, // Ramp up to 100 users (Stress point)
    { duration: '2m', target: 100 }, // Stay at 100 users
    { duration: '1m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(99)<1000'], // 99% of requests must complete under 1s
    http_req_failed: ['rate<0.05'],    // Allow up to 5% failure under stress
  },
};

export default function () {
  const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
  
  // Test the rate limit endpoint as a proxy for API performance
  const res = http.get(`${BASE_URL}/api/test-rate-limit`);
  
  check(res, {
    'status is 200 or 429': (r) => r.status === 200 || r.status === 429,
    'transaction time < 500ms': (r) => r.timings.duration < 500,
  });
  
  sleep(0.5); // Fast requests
}
