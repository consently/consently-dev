# Sentry Error Monitoring Setup Guide

## Why Sentry?

Sentry is essential for production monitoring:
- Real-time error tracking
- Performance monitoring
- User context for debugging
- Release tracking
- Source map support

## Quick Setup (5 minutes)

### 1. Install Sentry

```bash
npm install @sentry/nextjs
```

### 2. Run Sentry Wizard

```bash
npx @sentry/wizard@latest -i nextjs
```

This will:
- Create `sentry.client.config.ts`
- Create `sentry.server.config.ts`
- Create `sentry.edge.config.ts`
- Update `next.config.ts` with Sentry configuration
- Add environment variables

### 3. Add Environment Variables

Add to `.env.local`:

```env
# Sentry Configuration
NEXT_PUBLIC_SENTRY_DSN=https://[YOUR_KEY]@[YOUR_ORG].ingest.sentry.io/[PROJECT_ID]
SENTRY_AUTH_TOKEN=your_auth_token_here
SENTRY_ORG=your-org-name
SENTRY_PROJECT=consently
```

### 4. Configure Sentry

The `lib/error-tracking.ts` file is already set up to use Sentry!

It will:
- Auto-initialize when DSN is present
- Capture errors and messages
- Track user context
- Add breadcrumbs
- Filter sensitive data

### 5. Test Sentry

Create a test error:

```typescript
// In any component or API route
import { captureError } from '@/lib/error-tracking';

try {
  throw new Error('Test Sentry integration');
} catch (error) {
  captureError(error, {
    context: { location: 'test' },
    tags: { priority: 'low' }
  });
}
```

## Configuration

### Sentry Options

Edit `sentry.client.config.ts`:

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: 0.1, // Sample 10% of transactions
  
  // Session Replay (optional)
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // Environment
  environment: process.env.NODE_ENV,
  
  // Release tracking
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
  
  // Filter sensitive data
  beforeSend(event) {
    // Remove PII
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers;
    }
    return event;
  },
  
  // Ignore errors
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
  ],
});
```

### Source Maps

For better error tracking, enable source maps in `next.config.ts`:

```typescript
const nextConfig = {
  productionBrowserSourceMaps: true,
  
  // Sentry webpack plugin (added by wizard)
  sentry: {
    hideSourceMaps: true, // Upload but hide from production
    widenClientFileUpload: true,
  },
};
```

## Usage in Code

### Automatic Error Tracking

Errors are automatically captured by Sentry in:
- API routes
- Server components
- Client components
- Edge functions

### Manual Error Tracking

```typescript
import { captureError, captureMessage, setUser } from '@/lib/error-tracking';

// Capture errors
try {
  // risky operation
} catch (error) {
  captureError(error, {
    context: { userId: '123', action: 'payment' },
    tags: { priority: 'high' },
    level: 'error'
  });
}

// Capture messages
captureMessage('User completed onboarding', {
  level: 'info',
  tags: { feature: 'onboarding' }
});

// Set user context
setUser({
  id: user.id,
  email: user.email,
  username: user.name
});
```

## Dashboard Setup

### 1. Create Sentry Account

- Go to [sentry.io](https://sentry.io/)
- Sign up (free tier available)
- Create a new Next.js project

### 2. Configure Alerts

Set up alerts for:
- New error types
- Error rate spikes  
- Performance degradation
- Failed deployments

### 3. Integrations

Connect Sentry with:
- **Slack**: Real-time error notifications
- **GitHub**: Link errors to commits
- **Vercel**: Automatic release tracking

## Monitoring Best Practices

### 1. Error Grouping

Ensure errors are properly grouped:
- Use consistent error messages
- Add context to custom errors
- Tag errors by feature/module

### 2. Performance Monitoring

Track key transactions:
- API route response times
- Page load times
- Database query duration

### 3. Release Tracking

Tag releases with:
- Git commit SHA
- Version number
- Deployment environment

### 4. User Feedback

Enable user feedback widget:

```typescript
Sentry.showReportDialog({
  eventId: 'error-id',
  user: {
    email: user.email,
    name: user.name
  }
});
```

## Troubleshooting

### Sentry Not Capturing Errors

Check:
1. DSN is set correctly in `.env.local`
2. `initErrorTracking()` is called (already in `app/layout.tsx`)
3. Sentry package is installed
4. Build completed without errors

### Source Maps Not Working

Check:
1. `SENTRY_AUTH_TOKEN` is set
2. `productionBrowserSourceMaps: true` in config
3. Sentry CLI is authenticated
4. Source maps are uploaded (check Sentry dashboard)

### Too Many Errors

Configure sampling:
- Reduce `tracesSampleRate`
- Add error filters
- Group similar errors
- Set up error quotas in Sentry dashboard

## Cost Management

Sentry pricing is based on events:
- **Free**: 5,000 errors/month
- **Team**: 50,000 errors/month ($26/mo)
- **Business**: Unlimited ($80/mo)

Optimize costs by:
- Using sampling rates
- Filtering noisy errors
- Grouping similar issues
- Setting up quotas

## Next Steps

After setup:

1. **Test integration**: Trigger a test error
2. **Configure alerts**: Set up Slack notifications
3. **Review dashboard**: Check error trends
4. **Set up releases**: Connect to GitHub
5. **Monitor performance**: Review transaction data

## Already Configured

✅ `lib/error-tracking.ts` - Error handling utilities
✅ `app/layout.tsx` - Sentry initialization
✅ Type-safe error capture
✅ User context tracking
✅ Breadcrumb support

Just install the package and add your DSN!

---

**Status**: Ready to install
**Estimated Time**: 5-10 minutes
**Priority**: HIGH (required for production)
