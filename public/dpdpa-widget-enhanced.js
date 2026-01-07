/**
 * Consently DPDPA Consent Widget v2.0 - Enhanced
 * Production-ready embeddable widget with fallback support, error handling, and performance optimizations
 * 
 * Features:
 * - Multiple CDN fallback URLs
 * - Retry mechanism with exponential backoff
 * - Subresource Integrity (SRI) support
 * - Performance monitoring
 * - Graceful degradation
 * 
 * Usage: <script src="https://cdn.consently.in/dpdpa-widget-enhanced.js" 
 *              data-dpdpa-widget-id="YOUR_WIDGET_ID"
 *              data-dpdpa-integrity="sha384-..."></script>
 */

(function () {
  'use strict';

  // Configuration
  const CONFIG = {
    MAX_RETRIES: 3,
    RETRY_DELAY_BASE: 1000, // 1 second base delay
    TIMEOUT: 10000, // 10 seconds timeout
    CDN_URLS: [
      'https://cdn.consently.in/dpdpa-widget.js',
      'https://www.consently.in/dpdpa-widget.js',
      'https://backup.consently.in/dpdpa-widget.js'
    ],
    PERFORMANCE_MONITORING: true,
    ERROR_REPORTING: true
  };

  // State management
  let widgetState = {
    loaded: false,
    loading: false,
    retryCount: 0,
    lastError: null,
    performanceMetrics: {
      startTime: Date.now(),
      loadTime: null,
      retryCount: 0
    }
  };

  // Utilities
  function log(level, message, data) {
    const isProduction = window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1');
    const prefix = '[Consently DPDPA]';
    
    if (level === 'error' || !isProduction) {
      console[level](`${prefix} ${message}`, data || '');
    }
  }

  function reportError(error, context) {
    if (!CONFIG.ERROR_REPORTING) return;
    
    // Send error to monitoring service
    if (navigator.sendBeacon) {
      const errorData = {
        error: error.message,
        stack: error.stack,
        context: context,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      };
      
      navigator.sendBeacon('/api/widget/error', JSON.stringify(errorData));
    }
  }

  function recordMetric(name, value) {
    if (!CONFIG.PERFORMANCE_MONITORING) return;
    
    const metric = {
      name: name,
      value: value,
      timestamp: Date.now(),
      url: window.location.href
    };
    
    // Send to analytics endpoint
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/widget/metrics', JSON.stringify(metric));
    }
  }

  // Exponential backoff for retries
  function getRetryDelay(retryCount) {
    return CONFIG.RETRY_DELAY_BASE * Math.pow(2, retryCount);
  }

  // Load widget with fallback and retry logic
  async function loadWidget(widgetId, integrity, retryIndex = 0) {
    if (widgetState.loading) return;
    
    widgetState.loading = true;
    
    try {
      const cdnUrl = CONFIG.CDN_URLS[retryIndex];
      log('info', `Loading widget from CDN ${retryIndex + 1}/${CONFIG.CDN_URLS.length}`, { url: cdnUrl });

      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = cdnUrl;
        script.async = true;
        script.setAttribute('data-dpdpa-widget-id', widgetId);
        
        // Add integrity check if provided
        if (integrity) {
          script.crossOrigin = 'anonymous';
          script.integrity = integrity;
        }

        // Timeout handling
        const timeoutId = setTimeout(() => {
          cleanup();
          reject(new Error(`Widget loading timeout after ${CONFIG.TIMEOUT}ms`));
        }, CONFIG.TIMEOUT);

        function cleanup() {
          clearTimeout(timeoutId);
          script.onload = null;
          script.onerror = null;
        }

        script.onload = () => {
          cleanup();
          
          // Verify widget loaded successfully
          if (window.ConsentlyWidget && window.ConsentlyWidget.init) {
            widgetState.loaded = true;
            widgetState.performanceMetrics.loadTime = Date.now() - widgetState.performanceMetrics.startTime;
            recordMetric('widget_load_time', widgetState.performanceMetrics.loadTime);
            log('info', 'Widget loaded successfully', {
              loadTime: widgetState.performanceMetrics.loadTime,
              retryCount: widgetState.retryCount
            });
            resolve();
          } else {
            reject(new Error('Widget script loaded but initialization failed'));
          }
        };

        script.onerror = (event) => {
          cleanup();
          const error = new Error(`Failed to load widget from ${cdnUrl}`);
          error.event = event;
          reject(error);
        };

        // Add to DOM
        document.head.appendChild(script);
      });

    } catch (error) {
      widgetState.lastError = error;
      reportError(error, { 
        widgetId: widgetId,
        retryIndex: retryIndex,
        retryCount: widgetState.retryCount 
      });
      
      log('error', error.message);

      // Retry logic
      if (retryIndex < CONFIG.CDN_URLS.length - 1) {
        // Try next CDN
        setTimeout(() => {
          loadWidget(widgetId, integrity, retryIndex + 1);
        }, 500);
      } else if (widgetState.retryCount < CONFIG.MAX_RETRIES) {
        // Retry with exponential backoff
        widgetState.retryCount++;
        widgetState.performanceMetrics.retryCount = widgetState.retryCount;
        
        const delay = getRetryDelay(widgetState.retryCount - 1);
        log('warn', `Retrying in ${delay}ms... (Attempt ${widgetState.retryCount}/${CONFIG.MAX_RETRIES})`);
        
        setTimeout(() => {
          loadWidget(widgetId, integrity, 0);
        }, delay);
      } else {
        // All retries failed - show fallback
        showFallbackUI(widgetId);
        recordMetric('widget_load_failed', widgetState.retryCount);
      }
    } finally {
      widgetState.loading = false;
    }
  }

  // Fallback UI when widget fails to load
  function showFallbackUI(widgetId) {
    log('warn', 'Showing fallback UI', { widgetId });

    // Create fallback banner
    const fallback = document.createElement('div');
    fallback.id = 'consently-fallback';
    fallback.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: #f3f4f6;
      border-top: 1px solid #d1d5db;
      padding: 16px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      z-index: 9999;
      box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.1);
    `;

    fallback.innerHTML = `
      <div style="max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between;">
        <div>
          <strong style="color: #374151;">Privacy Notice</strong>
          <p style="margin: 4px 0 0 0; color: #6b7280;">
            We use cookies and process your data as described in our 
            <a href="/privacy" style="color: #2563eb; text-decoration: underline;">Privacy Policy</a>.
          </p>
        </div>
        <div style="display: flex; gap: 8px;">
          <button id="consently-accept" style="
            background: #2563eb;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
          ">Accept</button>
          <button id="consently-reject" style="
            background: white;
            color: #374151;
            border: 1px solid #d1d5db;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
          ">Reject</button>
        </div>
      </div>
    `;

    // Add event handlers
    fallback.querySelector('#consently-accept').addEventListener('click', () => {
      document.cookie = 'consently-consent=accepted; path=/; max-age=31536000';
      fallback.remove();
      recordMetric('fallback_consent_accepted', 1);
    });

    fallback.querySelector('#consently-reject').addEventListener('click', () => {
      document.cookie = 'consently-consent=rejected; path=/; max-age=31536000';
      fallback.remove();
      recordMetric('fallback_consent_rejected', 1);
    });

    document.body.appendChild(fallback);
  }

  // Initialize widget
  function init() {
    const currentScript = document.currentScript || document.querySelector('script[data-dpdpa-widget-id]');
    const widgetId = currentScript ? currentScript.getAttribute('data-dpdpa-widget-id') : null;
    const integrity = currentScript ? currentScript.getAttribute('data-dpdpa-integrity') : null;

    if (!widgetId) {
      log('error', 'Error: data-dpdpa-widget-id attribute is required');
      log('error', 'Usage: <script src="https://cdn.consently.in/dpdpa-widget-enhanced.js" data-dpdpa-widget-id="YOUR_WIDGET_ID"></script>');
      return;
    }

    // Check if already loaded
    if (window.ConsentlyWidget && window.ConsentlyWidget.version) {
      log('info', 'Widget already loaded');
      return;
    }

    // Start loading
    loadWidget(widgetId, integrity);
  }

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose utilities for testing
  window.ConsentlyWidgetLoader = {
    loadWidget: loadWidget,
    getState: () => widgetState,
    showFallback: showFallbackUI
  };

})();
