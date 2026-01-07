# CDN Deployment Strategy for Consently Widget

## Overview
This document outlines the CDN deployment strategy to improve widget performance, reliability, and global distribution.

## Current Issues
1. Single point of failure (only one CDN URL)
2. No fallback mechanism
3. No performance monitoring
4. No integrity checks
5. No version management

## Proposed Solution

### 1. Multi-CDN Strategy

#### Primary CDN: Cloudflare
- **Edge Locations**: 200+ cities globally
- **Features**: DDoS protection, edge caching, Web Application Firewall
- **Configuration**:
  ```javascript
  https://cdn.consently.in/dpdpa-widget.js
  ```

#### Secondary CDN: AWS CloudFront
- **Edge Locations**: 400+ points of presence
- **Features**: AWS integration, dynamic content acceleration
- **Configuration**:
  ```javascript
  https://aws-cdn.consently.in/dpdpa-widget.js
  ```

#### Tertiary CDN: Fastly
- **Edge Locations**: 100+ locations
- **Features**: Real-time logging, instant purging
- **Configuration**:
  ```javascript
  https://fastly.consently.in/dpdpa-widget.js
  ```

### 2. Implementation Steps

#### Step 1: DNS Configuration
```dns
; Primary CDN (Cloudflare)
cdn.consently.in. 300 IN CNAME consently.cloudflare.net.

; Secondary (AWS CloudFront)
aws-cdn.consently.in. 300 IN CNAME d1234567890.cloudfront.net.

; Tertiary (Fastly)
fastly.consently.in. 300 IN CNAME global.ssl.fastly.net.
```

#### Step 2: Widget Loading Logic
```javascript
const CDN_URLS = [
  'https://cdn.consently.in/dpdpa-widget.js',     // Primary
  'https://aws-cdn.consently.in/dpdpa-widget.js', // Secondary
  'https://fastly.consently.in/dpdpa-widget.js',  // Tertiary
  '/dpdpa-widget.js'                              // Local fallback
];
```

#### Step 3: Subresource Integrity (SRI)
```javascript
// Generate SHA-384 hash for each version
const integrity = {
  'v1.0.0': 'sha384-abc123...',
  'v1.1.0': 'sha384-def456...',
  'v2.0.0': 'sha384-ghi789...'
};
```

### 3. Performance Optimizations

#### A. HTTP/2 Server Push
```nginx
location = /dpdpa-widget.js {
    http2_push /dpdpa-widget.js;
    http2_push /dpdpa-widget.css;
}
```

#### B. Brotli Compression
```nginx
gzip on;
gzip_types application/javascript;
brotli on;
brotli_types application/javascript;
```

#### C. Cache Headers
```nginx
location = /dpdpa-widget.js {
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header X-Content-Type-Options nosniff;
}
```

### 4. Monitoring & Analytics

#### A. Real User Monitoring (RUM)
```javascript
// Track widget performance
window.ConsentlyWidgetLoader = {
  trackPerformance: function() {
    const metrics = {
      loadTime: performance.now(),
      retries: retryCount,
      cdnUsed: currentCDN,
      timestamp: Date.now()
    };
    
    // Send to analytics
    navigator.sendBeacon('/api/widget/metrics', JSON.stringify(metrics));
  }
};
```

#### B. Health Checks
```bash
#!/bin/bash
# Health check script for CDN endpoints
CDN_ENDPOINTS=(
  "https://cdn.consently.in/dpdpa-widget.js"
  "https://aws-cdn.consently.in/dpdpa-widget.js"
  "https://fastly.consently.in/dpdpa-widget.js"
)

for endpoint in "${CDN_ENDPOINTS[@]}"; do
  if curl -f -s -o /dev/null "$endpoint"; then
    echo "✅ $endpoint is healthy"
  else
    echo "❌ $endpoint is down"
    # Send alert
    curl -X POST "$ALERT_WEBHOOK" -d "CDN endpoint $endpoint is down"
  fi
done
```

### 5. Deployment Pipeline

#### A. Automated Build & Deploy
```yaml
# .github/workflows/deploy-widget.yml
name: Deploy Widget to CDN

on:
  push:
    paths:
      - 'public/dpdpa-widget.js'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Widget
        run: |
          npm run build:widget
          npm run minify:widget
          
      - name: Generate Integrity Hash
        run: |
          node scripts/generate-integrity.js
          
      - name: Deploy to Cloudflare
        run: |
          wrangler publish --env production
          
      - name: Deploy to AWS CloudFront
        run: |
          aws s3 cp widget.min.js s3://consently-widget/
          aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*"
          
      - name: Update Version JSON
        run: |
          node scripts/update-version.js
```

#### B. Version Management
```json
{
  "latest": "2.0.0",
  "versions": {
    "2.0.0": {
      "url": "https://cdn.consently.in/dpdpa-widget-v2.0.0.js",
      "integrity": "sha384-ghi789...",
      "size": "45.2KB",
      "gzip": "12.1KB",
      "released": "2025-01-07"
    },
    "1.1.0": {
      "url": "https://cdn.consently.in/dpdpa-widget-v1.1.0.js",
      "integrity": "sha384-def456...",
      "size": "48.7KB",
      "gzip": "13.4KB",
      "released": "2024-12-15"
    }
  }
}
```

### 6. Fallback Strategy

#### A. Progressive Enhancement
```javascript
// Enhanced widget loader with progressive enhancement
(function() {
  function loadWidget() {
    // Try enhanced version first
    loadScript('/dpdpa-widget-enhanced.js')
      .then(() => console.log('Enhanced widget loaded'))
      .catch(() => {
        // Fallback to basic version
        console.warn('Enhanced widget failed, loading basic version');
        return loadScript('/dpdpa-widget.js');
      })
      .catch(() => {
        // Final fallback - minimal consent UI
        showMinimalConsentUI();
      });
  }
  
  loadWidget();
})();
```

#### B. Offline Support
```javascript
// Service Worker for offline caching
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('consently-widget-v1').then((cache) => {
      return cache.addAll([
        '/dpdpa-widget.js',
        '/dpdpa-widget.css',
        '/api/widget/config'
      ]);
    })
  );
});
```

### 7. Security Considerations

#### A. CSP Headers
```http
Content-Security-Policy: default-src 'none'; script-src 'self' https://cdn.consently.in https://www.consently.in; style-src 'self' 'unsafe-inline';
```

#### B. Subresource Integrity
```html
<script src="https://cdn.consently.in/dpdpa-widget.js"
        integrity="sha384-abc123..."
        crossorigin="anonymous"></script>
```

### 8. Migration Plan

#### Phase 1: Setup (Week 1)
- Configure DNS for CDN domains
- Set up Cloudflare account and zones
- Configure AWS CloudFront distribution
- Test connectivity to all CDN endpoints

#### Phase 2: Implementation (Week 2)
- Deploy enhanced widget script
- Update client-side loading logic
- Implement monitoring and analytics
- Test fallback mechanisms

#### Phase 3: Testing (Week 3)
- Load testing across different regions
- Failover testing
- Performance benchmarking
- Security audit

#### Phase 4: Rollout (Week 4)
- Gradual rollout to 10% of traffic
- Monitor performance metrics
- Address any issues
- Full rollout to 100% traffic

### 9. Success Metrics

- **Availability**: 99.9% uptime across all CDNs
- **Performance**: < 100ms average load time globally
- **Failover**: < 1 second failover time
- **Error Rate**: < 0.1% widget load failures
- **Cache Hit Ratio**: > 95% across CDNs

### 10. Cost Optimization

- **Cloudflare**: Free tier available, $200/month for business
- **AWS CloudFront**: Pay-as-you-go (~$0.085/GB)
- **Fastly**: Custom pricing (~$0.12/GB)
- **Total Estimated**: $500-1000/month for 1TB transfer

## Conclusion

Implementing a multi-CDN strategy with proper fallback mechanisms will significantly improve the widget's reliability and performance. The enhanced error handling and monitoring will provide better visibility into issues and enable quick resolution.
