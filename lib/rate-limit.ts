import { redis } from './redis';

/**
 * Rate limiting middleware for API routes
 * Uses Upstash Redis for distributed performance and scalability
 */

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  retryAfter?: number;
}

export interface RateLimitConfig {
  max: number;
  window?: number;
  identifier: string;
}

/**
 * Check if a request should be rate limited using Redis
 */
export async function checkRateLimit(config: RateLimitConfig): Promise<RateLimitResult> {
  const { max, window = 60000, identifier } = config;
  const key = `ratelimit:${identifier}`;

  if (!redis) {
    // Fallback for development if Redis is not configured
    console.warn('Redis not configured, using legacy in-memory rate limiting');
    return checkRateLimitInMemory(config);
  }

  try {
    const now = Date.now();
    const windowSeconds = Math.ceil(window / 1000);
    
    // Use Redis INCR and EXPIRE for atomic rate limiting
    const count = await redis.incr(key);
    
    if (count === 1) {
      await redis.expire(key, windowSeconds);
    }
    
    const ttl = await redis.ttl(key);
    const remaining = Math.max(0, max - count);
    const allowed = count <= max;

    return {
      allowed,
      remaining,
      limit: max,
      retryAfter: !allowed ? ttl : undefined,
    };
  } catch (error) {
    console.error('Redis rate limit error:', error);
    return { allowed: true, remaining: max, limit: max }; // Fail open
  }
}

// Legacy in-memory store for fallback
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

function checkRateLimitInMemory(config: RateLimitConfig): RateLimitResult {
  const { max, window = 60000, identifier } = config;
  const now = Date.now();
  const key = identifier;

  if (!store[key] || store[key].resetTime < now) {
    store[key] = {
      count: 0,
      resetTime: now + window,
    };
  }

  const entry = store[key];
  if (entry.count >= max) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return { allowed: false, remaining: 0, limit: max, retryAfter };
  }

  entry.count++;
  return { allowed: true, remaining: max - entry.count, limit: max };
}

/**
 * Get client identifier from request headers
 */
export function getClientIdentifier(headers: Headers): string {
  // Try to get real IP address
  const forwardedFor = headers.get('x-forwarded-for');
  const realIp = headers.get('x-real-ip');
  const cfConnectingIp = headers.get('cf-connecting-ip');
  
  const ip = forwardedFor?.split(',')[0] || realIp || cfConnectingIp || 'unknown';
  
  return `ip:${ip}`;
}

/**
 * Get user-specific identifier for authenticated requests
 */
export function getUserIdentifier(userId: string): string {
  return `user:${userId}`;
}

/**
 * Higher-order function to wrap API handlers with rate limiting
 */
export function withRateLimit(
  handler: (request: Request) => Promise<Response>,
  options: {
    max: number;
    window?: number;
    getIdentifier?: (request: Request) => string | Promise<string>;
  }
) {
  return async (request: Request): Promise<Response> => {
    const identifier = options.getIdentifier
      ? await options.getIdentifier(request)
      : getClientIdentifier(request.headers);

    const result = await checkRateLimit({
      max: options.max,
      window: options.window,
      identifier,
    });

    // Add rate limit headers
    const headers = new Headers();
    headers.set('X-RateLimit-Limit', result.limit.toString());
    headers.set('X-RateLimit-Remaining', result.remaining.toString());
    
    if (result.retryAfter) {
      headers.set('X-RateLimit-Reset', result.retryAfter.toString());
      headers.set('Retry-After', result.retryAfter.toString());
    }

    if (!result.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          retryAfter: result.retryAfter,
        }),
        {
          status: 429,
          headers: {
            ...Object.fromEntries(headers.entries()),
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Execute the handler
    const response = await handler(request);
    
    // Add rate limit headers to response
    headers.forEach((value, key) => {
      response.headers.set(key, value);
    });

    return response;
  };
}

/**
 * Preset configurations for different types of endpoints
 */
export const RateLimitPresets = {
  /**
   * Standard rate limit for authenticated API endpoints
   * 100 requests per minute
   */
  authenticated: {
    max: 100,
    window: 60000, // 1 minute
  },
  
  /**
   * Stricter rate limit for public/unauthenticated endpoints
   * 20 requests per minute
   */
  public: {
    max: 20,
    window: 60000, // 1 minute
  },
  
  /**
   * Very strict rate limit for sensitive operations (login, password reset)
   * 5 requests per 5 minutes
   */
  sensitive: {
    max: 5,
    window: 300000, // 5 minutes
  },
  
  /**
   * Lenient rate limit for read-only operations
   * 200 requests per minute
   */
  readOnly: {
    max: 200,
    window: 60000, // 1 minute
  },
  
  /**
   * Rate limit for webhooks and external integrations
   * 1000 requests per hour
   */
  webhook: {
    max: 1000,
    window: 3600000, // 1 hour
  },
};

/**
 * Example usage:
 * 
 * ```typescript
 * import { withRateLimit, RateLimitPresets, getUserIdentifier } from '@/lib/rate-limit';
 * 
 * async function handler(request: Request) {
 *   // Your API logic here
 *   return new Response('Success');
 * }
 * 
 * export const GET = withRateLimit(handler, {
 *   ...RateLimitPresets.authenticated,
 *   getIdentifier: async (request) => {
 *     const user = await getUser(request);
 *     return getUserIdentifier(user.id);
 *   }
 * });
 * ```
 */
