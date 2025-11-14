/**
 * Production-Ready Logging Utility
 * Provides environment-based logging that can be disabled in production
 * 
 * Usage:
 * import { logger } from '@/lib/logger';
 * 
 * logger.info('User logged in', { userId: user.id });
 * logger.error('Failed to save consent', error, { consentId: '123' });
 * logger.warn('Rate limit approaching', { remaining: 10 });
 * logger.debug('Processing activity', { activityId: 'abc' });
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isProduction: boolean;
  private minLevel: LogLevel;
  
  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    // In production, only log warnings and errors by default
    // Can be overridden with LOG_LEVEL environment variable
    this.minLevel = (process.env.LOG_LEVEL as LogLevel) || (this.isProduction ? 'warn' : 'debug');
  }

  /**
   * Check if a log level should be logged based on minimum level
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };
    
    return levels[level] >= levels[this.minLevel];
  }

  /**
   * Format log message with context
   */
  private formatMessage(message: string, context?: LogContext): string {
    if (!context || Object.keys(context).length === 0) {
      return message;
    }
    
    // In production, use JSON format for easier parsing
    if (this.isProduction) {
      return JSON.stringify({
        message,
        ...context,
        timestamp: new Date().toISOString(),
      });
    }
    
    // In development, use readable format
    const contextStr = Object.entries(context)
      .map(([key, value]) => {
        try {
          return `${key}=${typeof value === 'object' ? JSON.stringify(value) : value}`;
        } catch (e) {
          return `${key}=[Circular]`;
        }
      })
      .join(' ');
    
    return `${message} ${contextStr}`;
  }

  /**
   * Debug level logging (only in development)
   */
  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      console.debug(`[DEBUG] ${this.formatMessage(message, context)}`);
    }
  }

  /**
   * Info level logging
   */
  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      console.log(`[INFO] ${this.formatMessage(message, context)}`);
    }
  }

  /**
   * Warning level logging
   */
  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      console.warn(`[WARN] ${this.formatMessage(message, context)}`);
    }
  }

  /**
   * Error level logging (always logged)
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (this.shouldLog('error')) {
      const errorContext = {
        ...context,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: this.isProduction ? undefined : error.stack, // Don't log stack in production
        } : error,
      };
      
      console.error(`[ERROR] ${this.formatMessage(message, errorContext)}`);
    }
  }

  /**
   * Conditional logging (only if condition is true)
   */
  logIf(condition: boolean, level: LogLevel, message: string, context?: LogContext): void {
    if (condition) {
      switch (level) {
        case 'debug':
          this.debug(message, context);
          break;
        case 'info':
          this.info(message, context);
          break;
        case 'warn':
          this.warn(message, context);
          break;
        case 'error':
          this.error(message, undefined, context);
          break;
      }
    }
  }

  /**
   * Performance timing utility
   */
  time(label: string): void {
    if (!this.isProduction) {
      console.time(label);
    }
  }

  /**
   * End performance timing
   */
  timeEnd(label: string): void {
    if (!this.isProduction) {
      console.timeEnd(label);
    }
  }

  /**
   * Group logs together (development only)
   */
  group(label: string): void {
    if (!this.isProduction) {
      console.group(label);
    }
  }

  /**
   * End log group
   */
  groupEnd(): void {
    if (!this.isProduction) {
      console.groupEnd();
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export type for external use
export type { LogLevel, LogContext };

/**
 * Example usage:
 * 
 * // Simple logging
 * logger.info('User logged in');
 * logger.error('Failed to save consent', error);
 * 
 * // With context
 * logger.info('Consent recorded', { 
 *   widgetId: 'dpdpa_123', 
 *   visitorId: 'vis_abc',
 *   acceptedActivities: 3 
 * });
 * 
 * // Performance timing
 * logger.time('Database Query');
 * await executeQuery();
 * logger.timeEnd('Database Query');
 * 
 * // Conditional logging
 * logger.logIf(isDevelopment, 'debug', 'Debugging info', { data });
 * 
 * // Grouped logs
 * logger.group('Processing Activities');
 * activities.forEach(activity => {
 *   logger.info('Processing', { activityId: activity.id });
 * });
 * logger.groupEnd();
 */

