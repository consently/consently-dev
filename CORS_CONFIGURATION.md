# CORS Configuration Guide

## Current Status

⚠️ **SECURITY NOTICE**: Widget endpoints currently allow ALL origins (`*`)

This is acceptable for public widget scripts but should be refined for production.

## What's Been Done

✅ Created `lib/cors.ts` with:
- Origin validation utilities
- Dynamic CORS header generation
- Widget-specific origin checking
- Middleware-style CORS wrapper

✅ Current Configuration:
- Widget scripts (`/widget.js`, `/dpdpa-widget.js`): Allow all origins (required for embeddable widgets)
- Widget APIs (`/api/dpdpa/*`, `/api/consent/*`, `/api/cookies/widget-public/*`): Allow all origins (public endpoints)

## How It Works

### 1. Widget Scripts

Widget scripts MUST allow all origins because:
- They're embedded on customer websites
- Customer domains are unpredictable
- Scripts are public-facing and contain no secrets

```typescript
// Widget scripts remain open
source: '/widget.js',
headers: [{ key: 'Access-Control-Allow-Origin', value: '*' }]
```

### 2. Widget APIs (Recommended Approach)

For better security, validate origins at the route level:

```typescript
// In your API route
import { withCors, isValidWidgetOrigin } from '@/lib/cors';

export const POST = withCors(async (request: Request) => {
  const origin = request.headers.get('origin');
  const { widgetId } = await request.json();
  
  // Fetch widget configuration
  const widget = await getWidget(widgetId);
  
  // Validate origin matches widget domain
  if (!isValidWidgetOrigin(widget.domain, origin)) {
    return new Response('Origin not allowed', { status: 403 });
  }
  
  // Process request...
});
```

### 3. Admin APIs (Protected)

Admin endpoints should NOT have CORS headers:
- `/api/user/*`
- `/api/admin/*`
- `/api/audit/*`

These are same-origin only and protected by authentication.

## Environment Configuration

Add to `.env.local`:

```env
# CORS Configuration
# Comma-separated list of allowed origins for additional validation
ALLOWED_ORIGINS=https://www.consently.in,https://consently.in,https://app.consently.in

# For development
# ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,https://www.consently.in
```

## Security Levels

### Level 1: Open (Current - Widget Endpoints)

```typescript
'Access-Control-Allow-Origin': '*'
```

**Use for:**
- Widget scripts
- Public API endpoints
- Embeddable content

**Risks:**
- Any domain can call the API
- Mitigated by: Rate limiting, authentication tokens, data validation

### Level 2: Validated Origins (Recommended)

```typescript
import { getCorsHeaders } from '@/lib/cors';

const origin = request.headers.get('origin');
const headers = getCorsHeaders(origin);
```

**Use for:**
- Widget APIs that can validate widget domain
- APIs requiring specific origin validation

**Benefits:**
- Only configured origins allowed
- More secure than wildcard

### Level 3: Widget-Specific (Most Secure)

```typescript
import { isValidWidgetOrigin } from '@/lib/cors';

if (!isValidWidgetOrigin(widget.domain, requestOrigin)) {
  return new Response('Forbidden', { status: 403 });
}
```

**Use for:**
- High-security consent recording
- Payment-related endpoints

**Benefits:**
- Each widget can only be used from its configured domain
- Prevents widget hijacking

## Implementation Recommendations

### Phase 1: Current (✅ Done)

- Widget scripts allow all origins
- Widget APIs allow all origins
- Rate limiting in place

### Phase 2: Enhanced Security (Optional)

For each public API endpoint, add origin validation:

```typescript
// Example: app/api/dpdpa/consent-record/route.ts
export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  const body = await request.json();
  
  // Get widget config
  const { data: widget } = await supabase
    .from('dpdpa_widget_configs')
    .select('domain')
    .eq('widget_id', body.widgetId)
    .single();
  
  // Validate origin
  if (widget && !isValidWidgetOrigin(widget.domain, origin)) {
    console.warn('Invalid origin for widget', {
      widgetId: body.widgetId,
      configuredDomain: widget.domain,
      requestOrigin: origin
    });
    
    // Option 1: Reject (strict)
    return new Response('Origin not allowed', { status: 403 });
    
    // Option 2: Allow but log (lenient)
    // Continue processing but track suspicious requests
  }
  
  // Continue with consent recording...
}
```

### Phase 3: Domain Verification (Future)

Add domain verification to widget setup:

1. User adds widget to their site
2. User adds domain to widget config
3. System generates verification code
4. User adds verification meta tag to their site
5. System verifies domain ownership
6. Only verified domains can use the widget

## Wildcard Support

The CORS utility supports wildcards:

```env
# Allow all subdomains of example.com
ALLOWED_ORIGINS=https://*.example.com,https://example.com

# Allow specific pattern
ALLOWED_ORIGINS=https://app-*.example.com
```

## Testing CORS

### Test from Browser Console

```javascript
// Test widget script loading
const script = document.createElement('script');
script.src = 'https://www.consently.in/dpdpa-widget.js';
script.setAttribute('data-dpdpa-widget-id', 'YOUR_ID');
document.head.appendChild(script);

// Test API call
fetch('https://www.consently.in/api/dpdpa/check-consent?widgetId=YOUR_ID', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(console.log);
```

### Test with curl

```bash
# Test preflight
curl -X OPTIONS \
  https://www.consently.in/api/dpdpa/check-consent \
  -H "Origin: https://example.com" \
  -H "Access-Control-Request-Method: POST" \
  -v

# Test actual request
curl -X POST \
  https://www.consently.in/api/dpdpa/consent-record \
  -H "Origin: https://example.com" \
  -H "Content-Type: application/json" \
  -d '{"widgetId":"xxx","visitorId":"yyy"}' \
  -v
```

## Monitoring

Track CORS-related metrics:

1. **Blocked Origins**: Log when origins are rejected
2. **Widget Hijacking**: Alert if widget used from unexpected domains
3. **Suspicious Patterns**: Multiple domains using same widget

Add to your monitoring:

```typescript
if (!isValidWidgetOrigin(widget.domain, origin)) {
  // Log to monitoring service
  await logSecurity('widget_origin_mismatch', {
    widgetId,
    configuredDomain: widget.domain,
    requestOrigin: origin,
    timestamp: new Date().toISOString()
  });
}
```

## FAQs

**Q: Why allow `*` for widget endpoints?**
A: Widgets are meant to be embedded anywhere. The alternative would require customers to register their domains first, which creates friction.

**Q: Isn't `*` insecure?**
A: For public content (widgets), it's acceptable. Security comes from:
- Rate limiting
- Widget ID validation
- Input validation
- No sensitive data in public endpoints

**Q: Should I validate widget domains?**
A: Optional but recommended for high-value operations like payment processing.

**Q: What about localhost development?**
A: `ALLOWED_ORIGINS` includes localhost by default. Widget endpoints with `*` work everywhere.

**Q: Can someone steal my widget?**
A: Yes, widget IDs are public. Mitigate by:
- Rate limiting per widget
- Domain validation (optional)
- Monitoring for suspicious usage
- Requiring API keys for premium features

## Best Practices

1. **Keep widget scripts open** (`*`) - They're public by nature
2. **Consider domain validation** for consent recording
3. **Always validate input** regardless of origin
4. **Use rate limiting** on all public endpoints
5. **Monitor usage patterns** for anomalies
6. **Document allowed domains** in widget settings UI
7. **Test CORS** before deploying changes

## Summary

- ✅ Widget scripts: Open to all (required)
- ✅ Widget APIs: Open to all (acceptable, rate-limited)
- ✅ Admin APIs: No CORS (protected)
- ✅ Rate limiting: In place
- ✅ Input validation: In place
- ⚠️ Origin validation: Optional enhancement

**Current configuration is production-ready for a SaaS widget platform.**

For additional security, implement widget-specific origin validation in Phase 2.
