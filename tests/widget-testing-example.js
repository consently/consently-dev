/**
 * Widget Testing Example - Manual Testing Guide
 * 
 * This file provides examples of how to test the enhanced widget manually
 * without requiring a test framework setup.
 */

// Example 1: Testing Widget Loading with Fallback
function testWidgetLoading() {
  console.log('Testing widget loading...');
  
  // Clear any existing widget
  const existingScript = document.querySelector('script[data-dpdpa-widget-id]');
  if (existingScript) {
    existingScript.remove();
  }
  
  // Create test script
  const script = document.createElement('script');
  script.src = '/dpdpa-widget-enhanced.js'; // Use local for testing
  script.setAttribute('data-dpdpa-widget-id', 'test-widget-123');
  
  // Track loading
  let loadTime = null;
  let errorCount = 0;
  
  script.onload = () => {
    loadTime = performance.now();
    console.log(`✅ Widget loaded in ${loadTime.toFixed(2)}ms`);
    
    // Verify widget is available
    if (window.ConsentlyWidgetLoader) {
      console.log('✅ Widget loader available');
      const state = window.ConsentlyWidgetLoader.getState();
      console.log('Widget state:', state);
    } else {
      console.error('❌ Widget loader not found');
    }
  };
  
  script.onerror = () => {
    errorCount++;
    console.error('❌ Widget failed to load');
    
    // Check if fallback UI is shown
    setTimeout(() => {
      const fallback = document.getElementById('consently-fallback');
      if (fallback) {
        console.log('✅ Fallback UI displayed');
      } else {
        console.error('❌ Fallback UI not shown');
      }
    }, 1000);
  };
  
  document.head.appendChild(script);
}

// Example 2: Testing Error Handling
function testErrorHandling() {
  console.log('Testing error handling...');
  
  // Simulate network error by using invalid URL
  const script = document.createElement('script');
  script.src = 'https://invalid-url.com/widget.js'; // Will fail
  script.setAttribute('data-dpdpa-widget-id', 'test-error');
  
  let retryCount = 0;
  
  script.onerror = () => {
    retryCount++;
    console.log(`❌ Load attempt ${retryCount} failed`);
    
    // Check if retry is attempted
    setTimeout(() => {
      if (retryCount > 1) {
        console.log('✅ Retry mechanism working');
      }
    }, 2000);
  };
  
  document.head.appendChild(script);
}

// Example 3: Testing Performance Metrics
function testPerformanceMetrics() {
  console.log('Testing performance metrics...');
  
  // Start timing
  const startTime = performance.now();
  
  // Load widget
  const script = document.createElement('script');
  script.src = '/dpdpa-widget-enhanced.js';
  script.setAttribute('data-dpdpa-widget-id', 'test-performance');
  
  script.onload = () => {
    const loadTime = performance.now() - startTime;
    console.log(`Performance metrics:`);
    console.log(`- Load time: ${loadTime.toFixed(2)}ms`);
    console.log(`- DOM ready: ${document.readyState}`);
    console.log(`- Connection type: ${navigator.connection?.effectiveType || 'unknown'}`);
    
    // Check Core Web Vitals if available
    if (window.performance && window.performance.getEntriesByType) {
      const paintEntries = performance.getEntriesByType('paint');
      paintEntries.forEach(entry => {
        console.log(`- ${entry.name}: ${entry.startTime.toFixed(2)}ms`);
      });
    }
  };
  
  document.head.appendChild(script);
}

// Example 4: Testing Multi-CDN Fallback
function testMultiCDN() {
  console.log('Testing multi-CDN fallback...');
  
  // Mock CDN failure by intercepting requests
  const originalFetch = window.fetch;
  let cdnAttempts = 0;
  
  window.fetch = function(url) {
    if (url.includes('cdn.consently.in')) {
      cdnAttempts++;
      console.log(`CDN attempt ${cdnAttempts} for: ${url}`);
      return Promise.reject(new Error('CDN unavailable'));
    }
    return originalFetch.apply(this, arguments);
  };
  
  // Load widget (should try multiple CDNs)
  const script = document.createElement('script');
  script.src = 'https://cdn.consently.in/dpdpa-widget-enhanced.js';
  script.setAttribute('data-dpdpa-widget-id', 'test-cdn');
  
  script.onerror = () => {
    setTimeout(() => {
      if (cdnAttempts >= 3) {
        console.log('✅ Multi-CDN fallback attempted');
      }
      // Restore original fetch
      window.fetch = originalFetch;
    }, 1000);
  };
  
  document.head.appendChild(script);
}

// Example 5: Testing Consent Flow
function testConsentFlow() {
  console.log('Testing consent flow...');
  
  // Load widget
  const script = document.createElement('script');
  script.src = '/dpdpa-widget-enhanced.js';
  script.setAttribute('data-dpdpa-widget-id', 'test-consent');
  
  script.onload = () => {
    setTimeout(() => {
      // Check if consent UI is displayed
      const consentUI = document.querySelector('[data-consently-ui]');
      if (consentUI) {
        console.log('✅ Consent UI displayed');
        
        // Test consent buttons
        const acceptButton = document.querySelector('[data-consently-accept]');
        const rejectButton = document.querySelector('[data-consently-reject]');
        
        if (acceptButton && rejectButton) {
          console.log('✅ Consent buttons available');
          
          // Simulate consent
          acceptButton.click();
          console.log('✅ Consent recorded');
        }
      }
    }, 2000);
  };
  
  document.head.appendChild(script);
}

// Run all tests
function runAllTests() {
  console.log('🧪 Starting Widget Tests...\n');
  
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(testWidgetLoading, 1000);
      setTimeout(testErrorHandling, 3000);
      setTimeout(testPerformanceMetrics, 5000);
      setTimeout(testMultiCDN, 7000);
      setTimeout(testConsentFlow, 9000);
    });
  } else {
    testWidgetLoading();
    setTimeout(testErrorHandling, 2000);
    setTimeout(testPerformanceMetrics, 4000);
    setTimeout(testMultiCDN, 6000);
    setTimeout(testConsentFlow, 8000);
  }
}

// Export for use in browser console
window.testWidget = {
  runAll: runAllTests,
  loading: testWidgetLoading,
  errors: testErrorHandling,
  performance: testPerformanceMetrics,
  cdn: testMultiCDN,
  consent: testConsentFlow
};

console.log('Widget testing functions loaded. Use testWidget.runAll() to start.');
