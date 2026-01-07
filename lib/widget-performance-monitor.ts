/**
 * Performance Monitoring for Consently Widget
 * Tracks key performance metrics and provides insights
 */

export interface PerformanceMetrics {
  // Core Web Vitals
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  firstInputDelay?: number;
  cumulativeLayoutShift?: number;
  
  // Widget-specific metrics
  widgetLoadTime?: number;
  widgetInitTime?: number;
  apiResponseTime?: number;
  renderTime?: number;
  
  // Network metrics
  dnsLookup?: number;
  tcpConnect?: number;
  tlsHandshake?: number;
  firstByte?: number;
  
  // User interaction metrics
  timeToConsent?: number;
  timeToInteraction?: number;
  
  // Error metrics
  errorCount?: number;
  retryCount?: number;
  
  // Metadata
  timestamp: number;
  url: string;
  userAgent: string;
  connectionType?: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
}

export class WidgetPerformanceMonitor {
  private static instance: WidgetPerformanceMonitor;
  private metrics: Partial<PerformanceMetrics> = {};
  private observers: PerformanceObserver[] = [];
  private reportingEndpoint = '/api/widget/performance';
  private maxMetricsBuffer = 100;
  private metricsBuffer: PerformanceMetrics[] = [];

  private constructor() {
    this.initializeObservers();
    this.collectSystemMetrics();
  }

  static getInstance(): WidgetPerformanceMonitor {
    if (!WidgetPerformanceMonitor.instance) {
      WidgetPerformanceMonitor.instance = new WidgetPerformanceMonitor();
    }
    return WidgetPerformanceMonitor.instance;
  }

  /**
   * Initialize performance observers
   */
  private initializeObservers(): void {
    try {
      // Observe paint timing
      if ('PerformanceObserver' in window) {
        const paintObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              this.metrics.firstContentfulPaint = entry.startTime;
            }
          }
        });
        paintObserver.observe({ entryTypes: ['paint'] });
        this.observers.push(paintObserver);

        // Observe largest contentful paint
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.metrics.largestContentfulPaint = lastEntry.startTime;
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);

        // Observe layout shift
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          this.metrics.cumulativeLayoutShift = clsValue;
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);

        // Observe first input delay
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.metrics.firstInputDelay = (entry as any).processingStart - entry.startTime;
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);

        // Observe navigation timing
        const navObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const navEntry = entry as PerformanceNavigationTiming;
            this.metrics.dnsLookup = navEntry.domainLookupEnd - navEntry.domainLookupStart;
            this.metrics.tcpConnect = navEntry.connectEnd - navEntry.connectStart;
            this.metrics.tlsHandshake = navEntry.secureConnectionStart > 0 
              ? navEntry.connectEnd - navEntry.secureConnectionStart 
              : 0;
            this.metrics.firstByte = navEntry.responseStart - navEntry.requestStart;
          }
        });
        navObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navObserver);
      }
    } catch (error) {
      console.warn('[Consently] Performance monitoring initialization failed:', error);
    }
  }

  /**
   * Collect system and device metrics
   */
  private collectSystemMetrics(): void {
    // Device type detection
    const userAgent = navigator.userAgent.toLowerCase();
    if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
      this.metrics.deviceType = 'mobile';
    } else if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
      this.metrics.deviceType = 'tablet';
    } else {
      this.metrics.deviceType = 'desktop';
    }

    // Connection type
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.metrics.connectionType = connection.effectiveType;
    }

    this.metrics.userAgent = navigator.userAgent;
    this.metrics.url = window.location.href;
    this.metrics.timestamp = Date.now();
  }

  /**
   * Mark widget load start
   */
  markWidgetLoadStart(): void {
    this.metrics.timestamp = Date.now();
    if ('performance' in window && 'mark' in performance) {
      performance.mark('widget-load-start');
    }
  }

  /**
   * Mark widget load end
   */
  markWidgetLoadEnd(): void {
    const loadTime = Date.now() - this.metrics.timestamp!;
    this.metrics.widgetLoadTime = loadTime;

    if ('performance' in window && 'mark' in performance) {
      performance.mark('widget-load-end');
      performance.measure('widget-load', 'widget-load-start', 'widget-load-end');
      const measure = performance.getEntriesByName('widget-load')[0];
      if (measure) {
        this.metrics.widgetLoadTime = measure.duration;
      }
    }

    this.recordMetric('widgetLoadTime', loadTime);
  }

  /**
   * Mark widget initialization start
   */
  markWidgetInitStart(): void {
    if ('performance' in window && 'mark' in performance) {
      performance.mark('widget-init-start');
    }
  }

  /**
   * Mark widget initialization end
   */
  markWidgetInitEnd(): void {
    if ('performance' in window && 'mark' in performance) {
      performance.mark('widget-init-end');
      performance.measure('widget-init', 'widget-init-start', 'widget-init-end');
      const measure = performance.getEntriesByName('widget-init')[0];
      if (measure) {
        this.metrics.widgetInitTime = measure.duration;
        this.recordMetric('widgetInitTime', measure.duration);
      }
    }
  }

  /**
   * Record API response time
   */
  recordApiResponseTime(endpoint: string, duration: number): void {
    this.metrics.apiResponseTime = duration;
    this.recordMetric('apiResponseTime', duration, { endpoint });
  }

  /**
   * Record render time
   */
  recordRenderTime(duration: number): void {
    this.metrics.renderTime = duration;
    this.recordMetric('renderTime', duration);
  }

  /**
   * Record time to consent
   */
  recordTimeToConsent(): void {
    if (this.metrics.timestamp) {
      this.metrics.timeToConsent = Date.now() - this.metrics.timestamp;
      this.recordMetric('timeToConsent', this.metrics.timeToConsent);
    }
  }

  /**
   * Record time to interaction
   */
  recordTimeToInteraction(): void {
    if (this.metrics.timestamp) {
      this.metrics.timeToInteraction = Date.now() - this.metrics.timestamp;
      this.recordMetric('timeToInteraction', this.metrics.timeToInteraction);
    }
  }

  /**
   * Record error count
   */
  recordError(): void {
    this.metrics.errorCount = (this.metrics.errorCount || 0) + 1;
  }

  /**
   * Record retry count
   */
  recordRetry(): void {
    this.metrics.retryCount = (this.metrics.retryCount || 0) + 1;
  }

  /**
   * Record a custom metric
   */
  recordMetric(name: string, value: number, metadata?: any): void {
    const metric: PerformanceMetrics = {
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      [name]: value,
      ...metadata
    };

    this.metricsBuffer.push(metric);

    // Maintain buffer size
    if (this.metricsBuffer.length > this.maxMetricsBuffer) {
      this.metricsBuffer.shift();
    }

    // Schedule reporting
    this.scheduleMetricReport();
  }

  /**
   * Schedule metric reporting with debouncing
   */
  private scheduleMetricReport(): void {
    if (this.reportingScheduled) return;

    this.reportingScheduled = true;
    setTimeout(() => {
      this.reportMetrics();
      this.reportingScheduled = false;
    }, 3000);
  }

  private reportingScheduled = false;

  /**
   * Report metrics to server
   */
  private async reportMetrics(): Promise<void> {
    if (this.metricsBuffer.length === 0) return;

    const metrics = [...this.metricsBuffer];
    this.metricsBuffer = [];

    try {
      if (navigator.sendBeacon) {
        const success = navigator.sendBeacon(
          this.reportingEndpoint,
          JSON.stringify({ metrics, timestamp: new Date().toISOString() })
        );
        
        if (!success) {
          // Fallback to fetch
          fetch(this.reportingEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ metrics })
          }).catch(() => {
            // Re-queue metrics if reporting fails
            this.metricsBuffer.unshift(...metrics);
          });
        }
      }
    } catch (error) {
      console.error('[Consently] Failed to report performance metrics:', error);
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  /**
   * Get performance score (0-100)
   */
  getPerformanceScore(): number {
    let score = 100;
    
    // Deduct points for poor metrics
    if (this.metrics.widgetLoadTime && this.metrics.widgetLoadTime > 3000) score -= 20;
    if (this.metrics.firstContentfulPaint && this.metrics.firstContentfulPaint > 2000) score -= 15;
    if (this.metrics.largestContentfulPaint && this.metrics.largestContentfulPaint > 4000) score -= 25;
    if (this.metrics.cumulativeLayoutShift && this.metrics.cumulativeLayoutShift > 0.25) score -= 20;
    if (this.metrics.firstInputDelay && this.metrics.firstInputDelay > 100) score -= 20;
    if (this.metrics.errorCount && this.metrics.errorCount > 0) score -= this.metrics.errorCount * 10;
    if (this.metrics.retryCount && this.metrics.retryCount > 0) score -= this.metrics.retryCount * 5;

    return Math.max(0, score);
  }

  /**
   * Get performance recommendations
   */
  getRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.metrics.widgetLoadTime && this.metrics.widgetLoadTime > 3000) {
      recommendations.push('Consider using a CDN closer to your users to reduce widget load time');
    }

    if (this.metrics.firstContentfulPaint && this.metrics.firstContentfulPaint > 2000) {
      recommendations.push('Optimize critical resources to improve first contentful paint');
    }

    if (this.metrics.largestContentfulPaint && this.metrics.largestContentfulPaint > 4000) {
      recommendations.push('Optimize images and reduce JavaScript execution time');
    }

    if (this.metrics.cumulativeLayoutShift && this.metrics.cumulativeLayoutShift > 0.25) {
      recommendations.push('Ensure dimensions are set for images and ads to prevent layout shift');
    }

    if (this.metrics.firstInputDelay && this.metrics.firstInputDelay > 100) {
      recommendations.push('Reduce JavaScript execution time to improve interactivity');
    }

    if (this.metrics.errorCount && this.metrics.errorCount > 2) {
      recommendations.push('High error rate detected. Check network connectivity and API endpoints');
    }

    if (this.metrics.retryCount && this.metrics.retryCount > 1) {
      recommendations.push('Multiple retries indicate network issues. Consider implementing offline support');
    }

    return recommendations;
  }

  /**
   * Cleanup observers
   */
  destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metricsBuffer = [];
  }
}

// Export singleton instance
export const widgetPerformanceMonitor = WidgetPerformanceMonitor.getInstance();

// Convenience functions
export const markWidgetLoadStart = () => widgetPerformanceMonitor.markWidgetLoadStart();
export const markWidgetLoadEnd = () => widgetPerformanceMonitor.markWidgetLoadEnd();
export const markWidgetInitStart = () => widgetPerformanceMonitor.markWidgetInitStart();
export const markWidgetInitEnd = () => widgetPerformanceMonitor.markWidgetInitEnd();
export const recordApiResponseTime = (endpoint: string, duration: number) => 
  widgetPerformanceMonitor.recordApiResponseTime(endpoint, duration);
export const recordRenderTime = (duration: number) => widgetPerformanceMonitor.recordRenderTime(duration);
export const recordTimeToConsent = () => widgetPerformanceMonitor.recordTimeToConsent();
export const recordTimeToInteraction = () => widgetPerformanceMonitor.recordTimeToInteraction();
