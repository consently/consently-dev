# Production-Grade Cookie Scanner

## Overview
This implementation provides **real, production-quality cookie scanning** using external API services for reliable, scalable cookie detection. No mock data - actual cookies are detected from live websites using professional browser automation services.

## Key Features

### 1. **Real Browser Automation via External APIs**
- Uses professional browser automation services (Browserless.io, etc.)
- Extracts actual cookies from visited pages
- Supports JavaScript-set cookies, HTTP cookies, and third-party cookies
- Bot detection avoidance built-in
- Enterprise-grade reliability and scaling

### 2. **Scan Depth Options**
The scanner supports three depth levels:

| Depth    | Pages Scanned | Use Case                           |
|----------|---------------|-------------------------------------|
| Shallow  | 1 page        | Quick scan of homepage only         |
| Medium   | Up to 5 pages | Standard scan with key pages        |
| Deep     | Up to 20 pages| Comprehensive scan across the site  |

### 3. **Intelligent Cookie Classification**
- **Knowledge Database**: 50+ known cookie patterns from major providers
  - Google Analytics, Google Ads
  - Facebook Pixel
  - YouTube, LinkedIn, Twitter
  - Hotjar, HubSpot, Intercom
  - Mixpanel, Amplitude, Segment
  - TikTok, Snapchat, Pinterest, Reddit
  - Stripe, Cloudflare
  - Shopify, WordPress
  - Common auth/CSRF tokens

- **Smart Pattern Matching**: Handles cookie name variations (e.g., `_hjSession_12345` matches `_hjSession_`)

- **Heuristic Classification**: Unknown cookies are classified based on naming patterns:
  - Session/auth/token → Necessary
  - Analytics/track/metric → Analytics
  - Ad/marketing/campaign → Advertising
  - Pref/lang/theme → Preferences
  - Default → Functional

### 4. **Third-Party Detection**
Automatically identifies third-party cookies by:
- Cross-referencing with known third-party providers
- Comparing cookie domain with website domain
- Detecting cross-domain tracking

### 5. **Comprehensive Metrics**
Each scan provides:
- Total cookies found
- Category breakdown (necessary, analytics, advertising, preferences, functional)
- Third-party vs first-party count
- Compliance score (0-100)
- Pages successfully scanned
- Cookie expiry details

## Technical Implementation

### Architecture
```
User Request → API Route → CookieScanner Service → External API Service
                                                  ↓
                                          Extract Cookies
                                                  ↓
                                          Classify & Analyze
                                                  ↓
                                          Store in Database
                                                  ↓
                                          Return Results
```

### Supported External Services
1. **Browserless.io** (Primary) - Professional browser automation service
2. **Cookiebot API** - Commercial cookie compliance service
3. **CookieYes API** - Cookie consent management platform
4. **OneTrust API** - Enterprise privacy management
5. **Simple HTTP Scanner** - Fallback for basic cookie detection

### Scan Process
1. **Initialize Browser**: Launch headless Chromium with stealth mode
2. **Visit Pages**: Navigate to URL with proper wait conditions
3. **Extract Cookies**: Get all cookies from browser
4. **Find Links**: Extract same-domain links for deeper scanning
5. **Repeat**: Continue until depth limit reached
6. **Classify**: Match against knowledge database
7. **Calculate**: Generate compliance score and metrics
8. **Store**: Save results to database

### Performance Optimizations
- Concurrent link discovery while scanning
- Deduplicated cookie storage
- Efficient URL filtering (skip assets, fragments)
- Timeout protection (30s per page)
- Error recovery (continues on failed pages)

## API Usage

### Request
```bash
POST /api/cookies/scan
Content-Type: application/json

{
  "url": "https://example.com",
  "scanDepth": "medium"
}
```

### Response
```json
{
  "success": true,
  "data": {
    "scanId": "scan_1234567890_abc123",
    "url": "https://example.com",
    "scanDate": "2025-10-13T17:40:00.000Z",
    "cookies": [
      {
        "name": "_ga",
        "domain": ".example.com",
        "category": "analytics",
        "expiry": "2 years",
        "description": "Used to distinguish users. Provider: Google Analytics",
        "provider": "Google Analytics",
        "is_third_party": true,
        "purpose": "Used to distinguish users"
      }
    ],
    "totalCookies": 15,
    "categoryCounts": {
      "necessary": 3,
      "analytics": 5,
      "advertising": 4,
      "preferences": 2,
      "functional": 1
    },
    "complianceScore": 78,
    "thirdPartyCount": 9,
    "firstPartyCount": 6,
    "pagesScanned": 5
  }
}
```

## Compliance Score Calculation

The compliance score (0-100) is calculated by starting at 100 and deducting points for:
- **No necessary cookies defined**: -10 points
- **Cookies without purpose**: -20 points (proportional)
- **Cookies without legal basis**: -20 points (proportional)
- **High third-party usage (>50%)**: -15 points

## Database Storage

Scan results are stored in `cookie_scan_history`:
- Scan metadata (URL, depth, status, timestamps)
- Complete cookie data
- Classification breakdown
- Compliance metrics
- Error information (if failed)

## Deployment Considerations

### Local/Development
Works with any external API service - just add API keys to environment variables

### Production (Vercel/Serverless)
✅ **Fully compatible** with all serverless environments:

**Primary Option: Browserless.io**
- Professional browser automation service
- Built-in bot detection avoidance
- Auto-scaling and high availability
- Simple REST API integration

**Backup Options:**
- Cookiebot API for compliance-focused scanning
- CookieYes API for comprehensive cookie management
- OneTrust API for enterprise deployments
- Simple HTTP scanner as ultimate fallback

### Environment Variables
```env
# For external browser service
BROWSERLESS_API_KEY=your_key
BROWSERLESS_URL=https://chrome.browserless.io

# Scan limits
MAX_SCAN_DURATION=120000  # 2 minutes
MAX_PAGES_DEEP=20
```

## Security

### Bot Detection Avoidance
- Stealth plugin enabled
- Realistic user agent
- Proper viewport settings
- Natural navigation timing

### Data Privacy
- Cookie values are not permanently stored
- Scan history is user-specific
- Authentication required for all scans

## Future Enhancements

1. **Screenshot Capture**: Visual proof of cookie banners
2. **Consent Flow Testing**: Verify cookie banner compliance
3. **Policy Document Scanning**: Check for privacy policy links
4. **Schedule Scanning**: Periodic re-scanning
5. **Change Detection**: Alert on cookie changes
6. **Export Options**: PDF reports, CSV exports
7. **Multi-region Scanning**: Test GDPR vs CCPA implementations

## Maintenance

### Updating Cookie Knowledge
Add new entries to `cookieKnowledge` in `cookie-scanner.ts`:
```typescript
new_cookie_name: {
  category: 'analytics',
  provider: 'Provider Name',
  purpose: 'What it does',
  expiry: 'How long',
  is_third_party: true,
}
```

### Monitoring
- Track scan success rates
- Monitor average scan duration
- Alert on high failure rates
- Review unclassified cookies for knowledge base updates
