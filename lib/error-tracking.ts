/**
 * Error Tracking Utility
 * Centralizes error logging and integrates with Sentry (when configured)
 * 
 * Usage:
 * import { captureError, captureMessage } from '@/lib/error-tracking';
 * 
 * try {
 *   // your code
 * } catch (error) {
 *   captureError(error, { context: 'additional info' });
 * }
 */

export interface ErrorContext {
  [key: string]: any;
}

export interface ErrorOptions {
  context?: ErrorContext;
  level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
  tags?: Record<string, string>;
  user?: {
    id?: string;
    email?: string;
    username?: string;
  };
}

/**
 * Initialize Sentry if DSN is configured
 * This should be called in app initialization (layout.tsx or middleware)
 */
let sentryInitialized = false;

export function initErrorTracking() {
  if (sentryInitialized) return;
  
  const sentryDSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
  
  if (sentryDSN) {
    // Note: Sentry is optional - install @sentry/nextjs to enable
    // This code will work without Sentry installed (just won't send errors)
    if (typeof window !== 'undefined') {
      // Try to load Sentry dynamically - it may not be installed
      // Using webpack magic comment to make it optional
      Promise.resolve().then(async () => {
        try {
          // @ts-expect-error - Optional dependency that may not exist
          const Sentry = await import(/* webpackIgnore: true */ '@sentry/nextjs');
          if (Sentry?.init) {
            Sentry.init({
              dsn: sentryDSN,
              environment: process.env.NODE_ENV || 'development',
              tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
              debug: process.env.NODE_ENV === 'development',
              beforeSend(event: any, hint: any) {
                // Filter out sensitive information
                if (event.request?.headers) {
                  delete event.request.headers['Authorization'];
                  delete event.request.headers['Cookie'];
                }
                return event;
              },
            });
            sentryInitialized = true;
            console.log('[Error Tracking] Sentry initialized successfully');
          }
        } catch {
          // Sentry not installed - silently continue, will use console logging
        }
      });
    }
  } else {
    console.log('[Error Tracking] Sentry DSN not configured, using console logging only');
  }
}

/**
 * Capture an exception/error
 */
export function captureError(error: Error | unknown, options: ErrorOptions = {}) {
  const { context, level = 'error', tags, user } = options;

  // Always log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('[Error Tracking]', error);
    if (context) console.error('[Error Context]', context);
  }

  // Send to Sentry if configured
  const sentryDSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (sentryDSN && sentryInitialized) {
    try {
      // @ts-expect-error - Optional dependency that may not exist
      import(/* webpackIgnore: true */ '@sentry/nextjs').then((Sentry: any) => {
        if (Sentry?.withScope) {
          Sentry.withScope((scope: any) => {
            scope.setLevel(level);
            
            if (tags) {
              Object.entries(tags).forEach(([key, value]) => {
                scope.setTag(key, value);
              });
            }
            
            if (context) {
              scope.setContext('additional_info', context);
            }
            
            if (user) {
              scope.setUser(user);
            }
            
            if (error instanceof Error) {
              Sentry.captureException(error);
            } else {
              Sentry.captureException(new Error(String(error)));
            }
          });
        }
      }).catch(() => {
        // Sentry not available - silently continue
      });
    } catch {
      // Ignore import errors
    }
  }

  // Also log to custom error logging service if needed
  logToCustomService(error, options);
}

/**
 * Capture a message (non-error event)
 */
export function captureMessage(message: string, options: ErrorOptions = {}) {
  const { context, level = 'info', tags, user } = options;

  // Log to console
  if (process.env.NODE_ENV === 'development') {
    console.log(`[${level.toUpperCase()}]`, message);
    if (context) console.log('[Context]', context);
  }

  // Send to Sentry if configured
  const sentryDSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (sentryDSN && sentryInitialized) {
    try {
      // @ts-expect-error - Optional dependency that may not exist
      import(/* webpackIgnore: true */ '@sentry/nextjs').then((Sentry: any) => {
        if (Sentry?.withScope) {
          Sentry.withScope((scope: any) => {
            scope.setLevel(level);
            
            if (tags) {
              Object.entries(tags).forEach(([key, value]) => {
                scope.setTag(key, value);
              });
            }
            
            if (context) {
              scope.setContext('additional_info', context);
            }
            
            if (user) {
              scope.setUser(user);
            }
            
            Sentry.captureMessage(message, level);
          });
        }
      }).catch(() => {
        // Sentry not available - silently continue
      });
    } catch {
      // Ignore import errors
    }
  }
}

/**
 * Set user context for error tracking
 */
export function setUser(user: { id: string; email?: string; username?: string } | null) {
  const sentryDSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (sentryDSN && sentryInitialized) {
    try {
      // @ts-expect-error - Optional dependency that may not exist
      import(/* webpackIgnore: true */ '@sentry/nextjs').then((Sentry: any) => {
        if (Sentry?.setUser) {
          if (user) {
            Sentry.setUser(user);
          } else {
            Sentry.setUser(null);
          }
        }
      }).catch(() => {
        // Sentry not available - silently continue
      });
    } catch {
      // Ignore import errors
    }
  }
}

/**
 * Custom error logging service (optional)
 * Can be used to log errors to your own backend/database
 */
async function logToCustomService(error: Error | unknown, options: ErrorOptions) {
  // Only in production
  if (process.env.NODE_ENV !== 'production') return;

  try {
    // You can implement custom logging here
    // For example, send to your own API endpoint that stores errors in database
    
    // Example:
    // await fetch('/api/logs/error', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     error: error instanceof Error ? error.message : String(error),
    //     stack: error instanceof Error ? error.stack : undefined,
    //     context: options.context,
    //     timestamp: new Date().toISOString(),
    //   }),
    // });
  } catch (loggingError) {
    // Don't throw if logging fails
    console.error('[Error Tracking] Failed to log to custom service:', loggingError);
  }
}

/**
 * Wrap async functions with error tracking
 */
export function withErrorTracking<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: ErrorContext
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      captureError(error, { context });
      throw error;
    }
  }) as T;
}

/**
 * Create a breadcrumb for debugging
 */
export function addBreadcrumb(message: string, data?: Record<string, any>) {
  const sentryDSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (sentryDSN && sentryInitialized) {
    try {
      // @ts-expect-error - Optional dependency that may not exist
      import(/* webpackIgnore: true */ '@sentry/nextjs').then((Sentry: any) => {
        if (Sentry?.addBreadcrumb) {
          Sentry.addBreadcrumb({
            message,
            data,
            timestamp: Date.now() / 1000,
          });
        }
      }).catch(() => {
        // Sentry not available - silently continue
      });
    } catch {
      // Ignore import errors
    }
  }
}

// Export types
export type { ErrorContext, ErrorOptions };

