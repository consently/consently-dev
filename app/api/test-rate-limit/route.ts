import { withRateLimit, RateLimitPresets } from '@/lib/rate-limit';

async function handler(request: Request) {
  return new Response(JSON.stringify({
    success: true,
    message: 'Rate limit test successful',
    timestamp: new Date().toISOString(),
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Use the public preset (20 requests per minute) for testing
export const GET = withRateLimit(handler, {
  ...RateLimitPresets.public,
});
