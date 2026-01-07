/**
 * Enhanced Error Handler for Consently Widget
 * Provides comprehensive error tracking, reporting, and recovery mechanisms
 */

export interface WidgetErrorContext {
  widgetId?: string;
  userId?: string;
  url: string;
  userAgent: string;
  timestamp: string;
  retryCount?: number;
  cdnUsed?: string;
  errorType?: 'load' | 'init' | 'api' | 'render' | 'network';
}

export interface WidgetError extends Error {
  context?: WidgetErrorContext;
  recoverable?: boolean;
  retryAfter?: number;
  errorType?: 'load' | 'init' | 'api' | 'render' | 'network';
}

export class WidgetErrorHandler {
  private static instance: WidgetErrorHandler;
  private errorQueue: WidgetError[] = [];
  private maxQueueSize = 50;
  private reportingEndpoint = '/api/widget/errors';
  private retryStrategies = new Map<string, () => Promise<void>>();

  private constructor() {
    // Setup global error handlers
    if (typeof window !== 'undefined') {
      window.addEventListener('error', this.handleGlobalError.bind(this));
      window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
    }
  }

  static getInstance(): WidgetErrorHandler {
    if (!WidgetErrorHandler.instance) {
      WidgetErrorHandler.instance = new WidgetErrorHandler();
    }
    return WidgetErrorHandler.instance;
  }

  /**
   * Handle and categorize widget-specific errors
   */
  handleError(error: Error | string, context: Partial<WidgetErrorContext> = {}): WidgetError {
    let widgetError: WidgetError;
    
    if (typeof error === 'string') {
      widgetError = new Error(error) as WidgetError;
    } else {
      widgetError = error as WidgetError;
    }

    // Build error context
    widgetError.context = {
      url: window.location?.href || '',
      userAgent: navigator.userAgent || '',
      timestamp: new Date().toISOString(),
      ...context
    };

    // Categorize error and determine recoverability
    widgetError = this.categorizeError(widgetError);

    // Log error
    this.logError(widgetError);

    // Queue for reporting
    this.queueError(widgetError);

    // Attempt recovery if possible
    if (widgetError.recoverable) {
      this.attemptRecovery(widgetError);
    }

    return widgetError;
  }

  /**
   * Categorize error based on message and context
   */
  private categorizeError(error: WidgetError): WidgetError {
    const message = error.message.toLowerCase();

    // Network errors
    if (message.includes('network') || message.includes('fetch')) {
      error.errorType = 'network';
      error.recoverable = true;
      error.retryAfter = 2000;
    }
    // Loading errors
    else if (message.includes('load') || message.includes('timeout')) {
      error.errorType = 'load';
      error.recoverable = true;
      error.retryAfter = 5000;
    }
    // Initialization errors
    else if (message.includes('init') || message.includes('config')) {
      error.errorType = 'init';
      error.recoverable = false;
    }
    // API errors
    else if (message.includes('api') || message.includes('response')) {
      error.errorType = 'api';
      error.recoverable = true;
      error.retryAfter = 1000;
    }
    // Rendering errors
    else if (message.includes('render') || message.includes('dom')) {
      error.errorType = 'render';
      error.recoverable = false;
    }
    // Default
    else {
      error.errorType = 'load';
      error.recoverable = true;
      error.retryAfter = 3000;
    }

    return error;
  }

  /**
   * Log error with appropriate level
   */
  private logError(error: WidgetError): void {
    const isProduction = process.env.NODE_ENV === 'production';
    const prefix = `[Consently Widget Error]`;

    switch (error.errorType) {
      case 'network':
      case 'load':
        console.warn(`${prefix} ${error.message}`, error.context);
        break;
      case 'init':
      case 'render':
        console.error(`${prefix} ${error.message}`, error.context);
        break;
      default:
        console.error(`${prefix} ${error.message}`, error.context);
    }
  }

  /**
   * Add error to reporting queue
   */
  private queueError(error: WidgetError): void {
    this.errorQueue.push(error);

    // Maintain queue size
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }

    // Report errors in batch
    this.scheduleErrorReport();
  }

  /**
   * Schedule error reporting with debouncing
   */
  private scheduleErrorReport(): void {
    if (this.reportingScheduled) return;

    this.reportingScheduled = true;
    setTimeout(() => {
      this.reportErrors();
      this.reportingScheduled = false;
    }, 5000);
  }

  private reportingScheduled = false;

  /**
   * Report queued errors to server
   */
  private async reportErrors(): Promise<void> {
    if (this.errorQueue.length === 0) return;

    const errors = [...this.errorQueue];
    this.errorQueue = [];

    try {
      // Use sendBeacon for non-blocking reports
      if (navigator.sendBeacon) {
        const success = navigator.sendBeacon(
          this.reportingEndpoint,
          JSON.stringify({ errors, timestamp: new Date().toISOString() })
        );
        
        if (!success) {
          // Fallback to fetch if sendBeacon fails
          fetch(this.reportingEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ errors })
          }).catch(() => {
            // Re-queue errors if reporting fails
            this.errorQueue.unshift(...errors);
          });
        }
      }
    } catch (error) {
      console.error('[Consently] Failed to report errors:', error);
      // Re-queue errors if reporting fails
      this.errorQueue.unshift(...errors);
    }
  }

  /**
   * Attempt automatic error recovery
   */
  private async attemptRecovery(error: WidgetError): Promise<void> {
    if (!error.recoverable || !error.retryAfter) return;

    const delay = error.retryAfter * (error.context?.retryCount || 1);
    
    console.info(`[Consently] Attempting error recovery in ${delay}ms`);

    setTimeout(() => {
      const strategy = this.retryStrategies.get(error.errorType!);
      if (strategy) {
        strategy().catch(recoveryError => {
          this.handleError(recoveryError, {
            ...error.context,
            retryCount: (error.context?.retryCount || 0) + 1
          });
        });
      }
    }, delay);
  }

  /**
   * Register retry strategy for error type
   */
  registerRetryStrategy(errorType: string, strategy: () => Promise<void>): void {
    this.retryStrategies.set(errorType, strategy);
  }

  /**
   * Handle global JavaScript errors
   */
  private handleGlobalError(event: ErrorEvent): void {
    if (event.filename && event.filename.includes('dpdpa-widget')) {
      this.handleError(event.error || new Error(event.message), {
        errorType: 'render',
        url: event.filename,
        retryCount: 0
      });
    }
  }

  /**
   * Handle unhandled promise rejections
   */
  private handleUnhandledRejection(event: PromiseRejectionEvent): void {
    this.handleError(
      event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
      {
        errorType: 'api',
        retryCount: 0
      }
    );
  }

  /**
   * Get error statistics
   */
  getErrorStats(): { [key: string]: number } {
    const stats: { [key: string]: number } = {};
    
    // Count errors by type
    this.errorQueue.forEach(error => {
      const type = error.errorType || 'unknown';
      stats[type] = (stats[type] || 0) + 1;
    });

    return stats;
  }

  /**
   * Clear error queue
   */
  clearErrors(): void {
    this.errorQueue = [];
  }
}

// Export singleton instance
export const widgetErrorHandler = WidgetErrorHandler.getInstance();

// Convenience functions
export const handleWidgetError = (error: Error | string, context?: Partial<WidgetErrorContext>) => {
  return widgetErrorHandler.handleError(error, context);
};

export const registerWidgetRetryStrategy = (errorType: string, strategy: () => Promise<void>) => {
  widgetErrorHandler.registerRetryStrategy(errorType, strategy);
};
