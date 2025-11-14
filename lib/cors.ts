/**
 * CORS Configuration Utility
 * Provides secure CORS handling with domain validation
 * 
 * Usage:
 * import { handleCors, corsHeaders } from '@/lib/cors';
 * 
 * // In API route:
 * if (!handleCors(request)) {
 *   return NextResponse.json({ error: 'CORS not allowed' }, { status: 403 });
 * }
 * 
 * return NextResponse.json(data, { headers: corsHeaders(request) });
 */

import { NextRequest } from 'next/server';

/**
 * Allowed origins configuration
 * In production, this should be loaded from environment variables or database
 */
const ALLOWED_ORIGINS = [
  'https://www.consently.in',
  'https://consently.in',
  'https://consently-dev.vercel.app',
  // Add more origins as needed
];

/**
 * Development origins (localhost and local IPs)
 */
const isDevelopment = process.env.NODE_ENV === 'development';
const DEVELOPMENT_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
];

/**
 * Check if an origin is allowed
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;

  // In development, allow all localhost origins
  if (isDevelopment) {
    if (DEVELOPMENT_ORIGINS.some(devOrigin => origin.startsWith(devOrigin))) {
      return true;
    }
  }

  // Check against whitelist
  if (ALLOWED_ORIGINS.includes(origin)) {
    return true;
  }

  // Check if origin matches a customer domain pattern
  // Format: https://customer-domain.com
  // This can be extended to check against database of customer domains
  if (process.env.ALLOW_CUSTOMER_DOMAINS === 'true') {
    try {
      const url = new URL(origin);
      // Only allow HTTPS for customer domains in production
      if (!isDevelopment && url.protocol !== 'https:') {
        return false;
      }
      
      // Additional validation: check against database of registered customer domains
      // This would require a database lookup, which can be implemented later
      // For now, we'll use a more restrictive approach
      return false; // Don't allow arbitrary customer domains yet
    } catch (e) {
      return false;
    }
  }

  return false;
}

/**
 * Handle CORS validation
 * Returns true if the origin is allowed, false otherwise
 */
export function handleCors(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  return isOriginAllowed(origin);
}

/**
 * Get CORS headers for response
 * If origin is allowed, returns headers with that origin
 * Otherwise, returns empty headers (no CORS)
 */
export function corsHeaders(request: NextRequest, additionalHeaders?: Record<string, string>): Record<string, string> {
  const origin = request.headers.get('origin');
  const headers: Record<string, string> = additionalHeaders || {};

  if (isOriginAllowed(origin)) {
    headers['Access-Control-Allow-Origin'] = origin || '*';
    headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
    headers['Access-Control-Max-Age'] = '86400'; // 24 hours
  }

  return headers;
}

/**
 * Handle OPTIONS preflight request
 * Returns a NextResponse with appropriate CORS headers
 */
export function handlePreflightRequest(request: NextRequest) {
  const { NextResponse } = require('next/server');
  
  if (isOriginAllowed(request.headers.get('origin'))) {
    return NextResponse.json(
      {},
      {
        status: 200,
        headers: corsHeaders(request),
      }
    );
  }

  return NextResponse.json(
    { error: 'Origin not allowed' },
    { status: 403 }
  );
}

/**
 * Permissive CORS (for public widgets)
 * Allows all origins - use only for truly public endpoints like widget scripts
 */
export function permissiveCorsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

/**
 * Load allowed origins from environment or database
 * Can be called at startup to load dynamic origin list
 */
export async function loadAllowedOrigins(): Promise<string[]> {
  // Load from environment variable (comma-separated list)
  const envOrigins = process.env.ALLOWED_ORIGINS;
  if (envOrigins) {
    return envOrigins.split(',').map(origin => origin.trim());
  }

  // TODO: Load from database
  // const { createClient } = await import('@/lib/supabase/server');
  // const supabase = await createClient();
  // const { data } = await supabase.from('widget_configs').select('domain');
  // return data?.map(d => `https://${d.domain}`) || [];

  return ALLOWED_ORIGINS;
}

/**
 * Middleware helper for CORS
 * Can be used in Next.js middleware to apply CORS globally
 */
export function applyCorsMiddleware(request: NextRequest, response: Response): Response {
  const origin = request.headers.get('origin');
  
  if (isOriginAllowed(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin || '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  return response;
}

/**
 * Example usage in API route:
 * 
 * ```typescript
 * import { handleCors, corsHeaders, permissiveCorsHeaders } from '@/lib/cors';
 * 
 * export async function GET(request: NextRequest) {
 *   // For protected endpoints (check origin)
 *   if (!handleCors(request)) {
 *     return NextResponse.json(
 *       { error: 'Origin not allowed' },
 *       { status: 403 }
 *     );
 *   }
 * 
 *   const data = await fetchData();
 *   return NextResponse.json(data, {
 *     headers: corsHeaders(request)
 *   });
 * }
 * 
 * export async function POST(request: NextRequest) {
 *   // For public widget endpoints (allow all origins)
 *   const data = await request.json();
 *   const result = await saveData(data);
 *   
 *   return NextResponse.json(result, {
 *     headers: permissiveCorsHeaders()
 *   });
 * }
 * 
 * export async function OPTIONS(request: NextRequest) {
 *   return handlePreflightRequest(request);
 * }
 * ```
 */

