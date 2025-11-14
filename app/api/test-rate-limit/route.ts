import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';

/**
 * Test endpoint for rate limiting
 * 
 * This endpoint is designed to test rate limiting functionality.
 * It uses a strict rate limit (10 requests per minute) to make testing easier.
 * 
 * Usage:
 * - Send rapid GET requests to /api/test-rate-limit
 * - After 10 requests, you should receive a 429 status code
 * - Check response headers for rate limit information:
 *   - X-RateLimit-Limit: Maximum requests allowed
 *   - X-RateLimit-Remaining: Remaining requests in current window
 *   - X-RateLimit-Reset: Seconds until limit resets
 *   - Retry-After: Seconds to wait before retrying
 * 
 * Example test with curl:
 * ```bash
 * # Send 15 rapid requests
 * for i in {1..15}; do
 *   curl -i http://localhost:3000/api/test-rate-limit
 *   echo ""
 * done
 * ```
 * 
 * Example test with JavaScript:
 * ```javascript
 * for (let i = 0; i < 15; i++) {
 *   fetch('/api/test-rate-limit')
 *     .then(r => r.json())
 *     .then(console.log)
 *     .catch(console.error);
 * }
 * ```
 */
export async function GET(request: NextRequest) {
  // Apply rate limiting with strict limits for easy testing
  const rateLimitResult = checkRateLimit({
    max: 10, // Only 10 requests allowed per minute (easy to test)
    window: 60000, // 1 minute window
    identifier: getClientIdentifier(request.headers),
  });

  // Prepare response headers with rate limit information
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-RateLimit-Limit': rateLimitResult.limit.toString(),
    'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
  };

  // If rate limit exceeded, return 429 with retry information
  if (!rateLimitResult.allowed) {
    headers['X-RateLimit-Reset'] = (rateLimitResult.retryAfter || 60).toString();
    headers['Retry-After'] = (rateLimitResult.retryAfter || 60).toString();

    return NextResponse.json(
      {
        success: false,
        error: 'Rate limit exceeded',
        message: `Too many requests. Please try again in ${rateLimitResult.retryAfter} seconds.`,
        retryAfter: rateLimitResult.retryAfter,
        limit: rateLimitResult.limit,
        remaining: rateLimitResult.remaining,
      },
      {
        status: 429,
        headers,
      }
    );
  }

  // Success response with rate limit info
  return NextResponse.json(
    {
      success: true,
      message: 'Rate limit test endpoint - request successful',
      timestamp: new Date().toISOString(),
      endpoint: '/api/test-rate-limit',
      method: 'GET',
      rateLimit: {
        limit: rateLimitResult.limit,
        remaining: rateLimitResult.remaining,
        resetIn: rateLimitResult.retryAfter ? `${rateLimitResult.retryAfter} seconds` : 'N/A',
      },
    },
    {
      status: 200,
      headers,
    }
  );
}

