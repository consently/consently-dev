# Redis Setup Guide - Upstash Integration

## Overview

This project uses **Upstash Redis** for serverless-optimized caching and data storage. Upstash is recommended for Next.js applications deployed on Vercel because it uses HTTP-based connections instead of persistent TCP connections.

## Current Setup

Your project already has:
- ✅ `@upstash/redis` package installed
- ✅ Redis client configured in `lib/redis.ts`
- ⚠️ Need to add environment variables

## Migration from Redis Labs to Upstash

You currently have Redis Labs credentials. Here are two options:

### Option 1: Use Upstash (Recommended for Vercel)

**Why Upstash?**
- Serverless-optimized with HTTP REST API
- No connection pooling issues
- Global edge caching
- Better performance on Vercel/serverless platforms
- Free tier available

**Steps:**

1. **Create an Upstash Account**
   - Go to: https://console.upstash.com/
   - Sign up for free

2. **Create a Redis Database**
   - Click "Create Database"
   - Choose a region (select `ap-south-1` to match your Redis Labs instance)
   - Select the free tier or appropriate plan
   - Click "Create"

3. **Get Your Credentials**
   - In your database dashboard, you'll see:
     - `UPSTASH_REDIS_REST_URL`
     - `UPSTASH_REDIS_REST_TOKEN`
   - Copy these values

4. **Update `.env.local`**
   ```bash
   UPSTASH_REDIS_REST_URL=https://your-database.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your_token_here
   ```

5. **You're Done!** The existing code in `lib/redis.ts` will work automatically.

### Option 2: Use Upstash with Redis Labs Backend (Advanced)

If you want to keep using your Redis Labs instance but access it through Upstash's REST API:

1. Install the standard Redis client:
   ```bash
   npm install redis
   ```

2. Update `lib/redis.ts` to use standard Redis client (see alternative implementation below)

## Usage Examples

### Basic Operations

```typescript
import { redis } from '@/lib/redis';

// In an API route or server component
export async function GET() {
  if (!redis) {
    return new Response('Redis not configured', { status: 503 });
  }

  // Set a value
  await redis.set('key', 'value');
  
  // Set with expiration (60 seconds)
  await redis.setex('session:123', 60, 'user-data');
  
  // Get a value
  const value = await redis.get('key');
  
  // Delete a key
  await redis.del('key');
  
  return Response.json({ value });
}
```

### Storing JSON Data

```typescript
// Set JSON
await redis.set('user:123', JSON.stringify({
  name: 'John Doe',
  email: 'john@example.com'
}));

// Get JSON
const userData = await redis.get('user:123');
const user = JSON.parse(userData as string);
```

### Caching Pattern

```typescript
async function getCachedData(key: string, fetchFn: () => Promise<any>, ttl = 300) {
  if (!redis) {
    return await fetchFn();
  }

  // Try to get from cache
  const cached = await redis.get(key);
  if (cached) {
    return JSON.parse(cached as string);
  }

  // Fetch fresh data
  const data = await fetchFn();
  
  // Store in cache with TTL
  await redis.setex(key, ttl, JSON.stringify(data));
  
  return data;
}

// Usage
const widgetData = await getCachedData(
  `widget:${widgetId}`,
  () => fetchWidgetFromDB(widgetId),
  600 // 10 minutes
);
```

### Session Management

```typescript
// Store session
await redis.setex(
  `session:${sessionId}`,
  3600, // 1 hour
  JSON.stringify({ userId, createdAt: Date.now() })
);

// Get session
const session = await redis.get(`session:${sessionId}`);

// Delete session (logout)
await redis.del(`session:${sessionId}`);
```

### Rate Limiting

```typescript
async function checkRateLimit(ip: string, limit = 10, window = 60) {
  if (!redis) return true; // Allow if Redis not configured

  const key = `ratelimit:${ip}`;
  const current = await redis.incr(key);
  
  if (current === 1) {
    // First request, set expiration
    await redis.expire(key, window);
  }
  
  return current <= limit;
}

// Usage in API route
if (!await checkRateLimit(request.ip)) {
  return new Response('Rate limit exceeded', { status: 429 });
}
```

### Pub/Sub (Upstash supports this!)

```typescript
import { Redis } from '@upstash/redis';

const publisher = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Publish
await publisher.publish('notifications', JSON.stringify({
  type: 'consent_updated',
  userId: '123'
}));
```

## Integration with Existing Code

Your `lib/redis.ts` is already set up correctly. Here's what it does:

1. **Graceful Degradation**: If Redis credentials are missing, it returns `null` instead of throwing errors
2. **Environment Check**: Validates credentials exist before creating client
3. **Export**: Provides a ready-to-use `redis` instance

Always check if Redis is available before using:

```typescript
if (redis) {
  await redis.set('key', 'value');
} else {
  console.warn('Redis not available, skipping cache');
}
```

## Testing Your Setup

Create a test API route to verify Redis is working:

```typescript
// app/api/test-redis/route.ts
import { redis } from '@/lib/redis';
import { NextResponse } from 'next/server';

export async function GET() {
  if (!redis) {
    return NextResponse.json(
      { error: 'Redis not configured' },
      { status: 503 }
    );
  }

  try {
    // Test write
    await redis.set('test:ping', 'pong', { ex: 60 });
    
    // Test read
    const result = await redis.get('test:ping');
    
    // Test delete
    await redis.del('test:ping');
    
    return NextResponse.json({
      success: true,
      message: 'Redis is working!',
      testResult: result
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Redis error', details: error },
      { status: 500 }
    );
  }
}
```

Then visit: `http://localhost:3000/api/test-redis`

## Common Use Cases in Your Project

Based on your codebase, here are practical uses:

### 1. Widget Configuration Cache

```typescript
import { redis } from '@/lib/redis';

async function getWidgetConfig(widgetId: string) {
  const cacheKey = `widget:${widgetId}`;
  
  if (redis) {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached as string);
    }
  }
  
  // Fetch from Supabase
  const config = await supabase
    .from('widget_configurations')
    .select('*')
    .eq('widget_id', widgetId)
    .single();
  
  // Cache for 5 minutes
  if (redis && config.data) {
    await redis.setex(cacheKey, 300, JSON.stringify(config.data));
  }
  
  return config.data;
}
```

### 2. Consent Records Cache

```typescript
async function getRecentConsents(projectId: string) {
  const cacheKey = `consents:${projectId}:recent`;
  
  if (redis) {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached as string);
  }
  
  const records = await fetchConsentsFromDB(projectId);
  
  if (redis) {
    await redis.setex(cacheKey, 60, JSON.stringify(records));
  }
  
  return records;
}
```

### 3. OTP Storage (Better than DB for temporary data)

```typescript
async function storeOTP(email: string, otp: string) {
  if (!redis) {
    throw new Error('Redis required for OTP storage');
  }
  
  const key = `otp:${email}`;
  // Store OTP for 10 minutes
  await redis.setex(key, 600, otp);
}

async function verifyOTP(email: string, otp: string) {
  if (!redis) return false;
  
  const key = `otp:${email}`;
  const stored = await redis.get(key);
  
  if (stored === otp) {
    await redis.del(key); // Delete after successful verification
    return true;
  }
  
  return false;
}
```

## Alternative: Using Standard Redis Client

If you prefer to keep using Redis Labs with the standard client:

```typescript
// lib/redis.ts (Alternative implementation)
import { createClient } from 'redis';

let client: ReturnType<typeof createClient> | null = null;

async function getRedisClient() {
  if (client) return client;

  if (!process.env.REDIS_HOST || !process.env.REDIS_PASSWORD) {
    console.warn('Redis credentials not configured');
    return null;
  }

  client = createClient({
    username: process.env.REDIS_USERNAME || 'default',
    password: process.env.REDIS_PASSWORD,
    socket: {
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT) || 6379,
    },
  });

  client.on('error', (err) => console.error('Redis Error:', err));
  
  await client.connect();
  
  return client;
}

export const redis = await getRedisClient();
```

## Environment Variables Reference

Add to `.env.local`:

```bash
# Upstash Redis (Recommended)
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here

# OR Standard Redis (Redis Labs)
REDIS_HOST=redis-16296.crce182.ap-south-1-1.ec2.cloud.redislabs.com
REDIS_PORT=16296
REDIS_USERNAME=default
REDIS_PASSWORD=Q6FZzmKR04CqdWVn05cRivvHNqqHpeMv
```

## Troubleshooting

### Redis returns null
- Check environment variables are set correctly
- Restart your dev server after adding env vars
- Check Upstash dashboard for connection issues

### "Redis not configured" warning
- Environment variables missing
- Solution: Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to `.env.local`

### Rate limit errors
- Free tier limits: 10,000 commands/day
- Upgrade to paid plan if needed

## Next Steps

1. ✅ Create Upstash account
2. ✅ Create Redis database  
3. ✅ Add credentials to `.env.local`
4. ✅ Test with `/api/test-redis` endpoint
5. ✅ Start using Redis in your API routes

## Resources

- [Upstash Console](https://console.upstash.com/)
- [Upstash Redis Docs](https://upstash.com/docs/redis)
- [Upstash Redis SDK](https://github.com/upstash/upstash-redis)
- [Redis Commands Reference](https://redis.io/commands/)
