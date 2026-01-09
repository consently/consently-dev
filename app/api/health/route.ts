import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { redis } from '@/lib/redis';

/**
 * Health Check Endpoint
 * 
 * Returns the health status of all critical services:
 * - API server (always returns 200 if reachable)
 * - Database (Supabase connection)
 * - Redis (cache layer)
 * - External services
 * 
 * Usage:
 * - Monitoring systems: Poll this endpoint every 30-60 seconds
 * - Load balancers: Use for health checks
 * - Status pages: Display service status
 * 
 * Response Codes:
 * - 200: All systems healthy
 * - 503: One or more systems unhealthy
 */

interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  checks: {
    api: ServiceCheck;
    database: ServiceCheck;
    redis: ServiceCheck;
    supabase: ServiceCheck;
  };
  version: string;
  environment: string;
}

interface ServiceCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime?: number;
  message?: string;
  lastChecked: string;
}

/**
 * Check database connectivity
 */
async function checkDatabase(): Promise<ServiceCheck> {
  const startTime = Date.now();
  try {
    const supabase = await createClient();
    
    // Simple query to verify connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
      .single();
    
    const responseTime = Date.now() - startTime;
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned (OK)
      return {
        status: 'unhealthy',
        responseTime,
        message: `Database error: ${error.message}`,
        lastChecked: new Date().toISOString(),
      };
    }
    
    // Warning if response time is slow
    if (responseTime > 1000) {
      return {
        status: 'degraded',
        responseTime,
        message: 'Database responding slowly',
        lastChecked: new Date().toISOString(),
      };
    }
    
    return {
      status: 'healthy',
      responseTime,
      message: 'Connected',
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      message: error instanceof Error ? error.message : 'Unknown error',
      lastChecked: new Date().toISOString(),
    };
  }
}

/**
 * Check Redis connectivity
 */
async function checkRedis(): Promise<ServiceCheck> {
  const startTime = Date.now();
  try {
    if (!redis) {
      return {
        status: 'degraded',
        message: 'Redis not configured (using fallback)',
        lastChecked: new Date().toISOString(),
      };
    }
    
    // Try a simple ping
    await redis.set('health:check', Date.now(), { ex: 10 });
    const value = await redis.get('health:check');
    
    const responseTime = Date.now() - startTime;
    
    if (!value) {
      return {
        status: 'unhealthy',
        responseTime,
        message: 'Redis not responding',
        lastChecked: new Date().toISOString(),
      };
    }
    
    return {
      status: 'healthy',
      responseTime,
      message: 'Connected',
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      message: error instanceof Error ? error.message : 'Redis connection failed',
      lastChecked: new Date().toISOString(),
    };
  }
}

/**
 * Check Supabase auth service
 */
async function checkSupabase(): Promise<ServiceCheck> {
  const startTime = Date.now();
  try {
    const supabase = await createClient();
    
    // Check if auth service is responding
    const { data, error } = await supabase.auth.getSession();
    
    const responseTime = Date.now() - startTime;
    
    if (error) {
      return {
        status: 'unhealthy',
        responseTime,
        message: `Auth service error: ${error.message}`,
        lastChecked: new Date().toISOString(),
      };
    }
    
    return {
      status: 'healthy',
      responseTime,
      message: 'Auth service operational',
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      message: error instanceof Error ? error.message : 'Supabase connection failed',
      lastChecked: new Date().toISOString(),
    };
  }
}

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Run all health checks in parallel
    const [databaseCheck, redisCheck, supabaseCheck] = await Promise.all([
      checkDatabase(),
      checkRedis(),
      checkSupabase(),
    ]);
    
    const apiCheck: ServiceCheck = {
      status: 'healthy',
      responseTime: Date.now() - startTime,
      message: 'API server operational',
      lastChecked: new Date().toISOString(),
    };
    
    // Determine overall health status
    const checks = {
      api: apiCheck,
      database: databaseCheck,
      redis: redisCheck,
      supabase: supabaseCheck,
    };
    
    const hasUnhealthy = Object.values(checks).some(check => check.status === 'unhealthy');
    const hasDegraded = Object.values(checks).some(check => check.status === 'degraded');
    
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    if (hasUnhealthy) {
      overallStatus = 'unhealthy';
    } else if (hasDegraded) {
      overallStatus = 'degraded';
    }
    
    const healthCheck: HealthCheck = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };
    
    // Return 503 if unhealthy, 200 otherwise
    const statusCode = overallStatus === 'unhealthy' ? 503 : 200;
    
    return NextResponse.json(healthCheck, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    // If health check itself fails, return critical error
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        api: {
          status: 'unhealthy',
          message: error instanceof Error ? error.message : 'Health check failed',
          lastChecked: new Date().toISOString(),
        },
        database: { status: 'unhealthy', message: 'Not checked', lastChecked: new Date().toISOString() },
        redis: { status: 'unhealthy', message: 'Not checked', lastChecked: new Date().toISOString() },
        supabase: { status: 'unhealthy', message: 'Not checked', lastChecked: new Date().toISOString() },
      },
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    }, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    });
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}
