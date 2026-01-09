/**
 * CORS Configuration and Utilities
 * 
 * Provides secure CORS handling with origin validation
 * for public widget endpoints
 */

/**
 * Get allowed origins from environment variable or use defaults
 */
export function getAllowedOrigins(): string[] {
  const envOrigins = process.env.ALLOWED_ORIGINS;
  
  if (envOrigins) {
    return envOrigins.split(',').map(origin => origin.trim()).filter(Boolean);
  }
  
  // Default allowed origins (should be configured in production)
  return [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://www.consently.in',
    'https://consently.in',
  ];
}

/**
 * Check if an origin is allowed based on configuration
 * 
 * @param origin - The origin to check
 * @returns true if origin is allowed
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) {
    // Allow requests with no origin (same-origin, Postman, curl, etc.)
    return true;
  }
  
  const allowedOrigins = getAllowedOrigins();
  
  // Check exact match
  if (allowedOrigins.includes(origin)) {
    return true;
  }
  
  // Check wildcard patterns
  for (const allowed of allowedOrigins) {
    if (allowed.includes('*')) {
      const pattern = allowed.replace(/\*/g, '.*');
      const regex = new RegExp(`^${pattern}$`);
      if (regex.test(origin)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Get CORS headers for a given origin
 * 
 * @param origin - The request origin
 * @param allowCredentials - Whether to allow credentials
 * @returns Headers object with CORS configuration
 */
export function getCorsHeaders(
  origin: string | null,
  allowCredentials: boolean = false
): Record<string, string> {
  const headers: Record<string, string> = {};
  
  if (isOriginAllowed(origin)) {
    headers['Access-Control-Allow-Origin'] = origin || '*';
    headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Cache-Control, If-None-Match';
    headers['Access-Control-Max-Age'] = '86400'; // 24 hours
    
    if (allowCredentials && origin) {
      headers['Access-Control-Allow-Credentials'] = 'true';
    }
  }
  
  return headers;
}

/**
 * Helper to create a CORS-enabled Response
 * 
 * @param data - Response data
 * @param origin - Request origin
 * @param status - HTTP status code
 * @returns Response with CORS headers
 */
export function corsResponse(
  data: any,
  origin: string | null,
  status: number = 200
): Response {
  const headers = {
    'Content-Type': 'application/json',
    ...getCorsHeaders(origin),
  };
  
  return new Response(JSON.stringify(data), {
    status,
    headers,
  });
}

/**
 * Helper for OPTIONS preflight requests
 * 
 * @param origin - Request origin
 * @returns Response for OPTIONS request
 */
export function corsPreflightResponse(origin: string | null): Response {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
}

/**
 * Middleware-style CORS handler
 * Wraps an API handler with CORS support
 * 
 * @param handler - The API route handler
 * @returns Wrapped handler with CORS support
 */
export function withCors(
  handler: (request: Request) => Promise<Response>
) {
  return async (request: Request): Promise<Response> => {
    const origin = request.headers.get('origin');
    
    // Handle preflight
    if (request.method === 'OPTIONS') {
      return corsPreflightResponse(origin);
    }
    
    // Check if origin is allowed
    if (origin && !isOriginAllowed(origin)) {
      return new Response(
        JSON.stringify({ error: 'Origin not allowed' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Execute handler
    const response = await handler(request);
    
    // Add CORS headers to response
    const corsHeaders = getCorsHeaders(origin);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  };
}

/**
 * Validate widget origin
 * Checks if a widget's configured domain matches the request origin
 * 
 * @param widgetDomain - The widget's configured domain
 * @param requestOrigin - The request origin
 * @returns true if valid
 */
export function isValidWidgetOrigin(
  widgetDomain: string | null,
  requestOrigin: string | null
): boolean {
  if (!widgetDomain || !requestOrigin) {
    return false;
  }
  
  try {
    const widgetUrl = new URL(widgetDomain.startsWith('http') ? widgetDomain : `https://${widgetDomain}`);
    const requestUrl = new URL(requestOrigin);
    
    // Compare hostname (domain)
    return widgetUrl.hostname === requestUrl.hostname;
  } catch (error) {
    return false;
  }
}
