# Supabase Client Usage Guide

This guide explains when to use each type of Supabase client and how to avoid common pitfalls.

## The Recurring Issue

**Problem:** Privacy-centre API endpoints were repeatedly failing with RLS (Row Level Security) errors because developers were using the wrong client type.

**Root Cause:** 
- Code duplication of `createServiceClient()` across multiple files
- No centralized helper for service role client
- Confusion about when to use anonymous vs service role keys
- New endpoints copying the wrong pattern

**Solution:** Centralized client helpers in `/lib/supabase/server.ts` with clear documentation.

---

## Available Clients

### 1. `createClient()` - Anonymous Key Client

**Purpose:** For authenticated operations that should respect RLS policies.

**Use cases:**
- ✅ Dashboard pages (requires user authentication)
- ✅ Admin API routes (managing widgets, activities, etc.)
- ✅ User profile operations
- ✅ Any operation where you need to know WHO is making the request
- ✅ Operations that should be restricted by user permissions

**RLS Behavior:** Row Level Security policies **ARE ENFORCED**

**Example:**
```typescript
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  
  // This will only return widgets owned by the authenticated user
  const { data } = await supabase
    .from('dpdpa_widget_configs')
    .select('*');
  
  return NextResponse.json({ data });
}
```

---

### 2. `createServiceClient()` - Service Role Key Client

**Purpose:** For public endpoints that need to bypass RLS for anonymous visitor operations.

**Use cases:**
- ✅ Privacy-centre APIs (consent preferences, history)
- ✅ OTP verification endpoints (email linking)
- ✅ Public widget APIs (cookie consent, DPDPA widget)
- ✅ Public form submissions (contact, careers)
- ✅ Visitor operations (no user account required)
- ✅ Operations scoped by `visitor_id` instead of user authentication

**RLS Behavior:** Row Level Security policies **ARE BYPASSED**

**Security Requirements:**
- ⚠️ **Always validate inputs** (visitor_id, widget_id, activity_id)
- ⚠️ **Always scope operations properly** (by visitor_id, widget_id)
- ⚠️ **Never expose user authentication data**
- ⚠️ **Validate widget configurations exist**
- ⚠️ **Use rate limiting for public endpoints**

**Example:**
```typescript
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createServiceClient();
  const { visitorId, widgetId, preferences } = await request.json();
  
  // Validate inputs
  if (!visitorId || !widgetId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  
  // Verify widget exists
  const { data: widget } = await supabase
    .from('dpdpa_widget_configs')
    .select('widget_id')
    .eq('widget_id', widgetId)
    .single();
    
  if (!widget) {
    return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
  }
  
  // Update preferences (scoped by visitor_id and widget_id)
  const { error } = await supabase
    .from('visitor_consent_preferences')
    .update({ consent_status: 'accepted' })
    .eq('visitor_id', visitorId)
    .eq('widget_id', widgetId);
  
  return NextResponse.json({ success: true });
}
```

---

## Decision Tree: Which Client Should I Use?

```
Is this a public endpoint that anonymous visitors can access?
│
├─ YES → Does it need to read/write data?
│         │
│         ├─ YES → Use createServiceClient()
│         │        (Examples: save preferences, send OTP, verify OTP)
│         │
│         └─ NO → Use createClient() (rare case)
│
└─ NO → Is the user authenticated?
          │
          ├─ YES → Use createClient()
          │        (Examples: dashboard, admin operations)
          │
          └─ NO → Return 401 Unauthorized
```

---

## Common Mistakes to Avoid

### ❌ Mistake 1: Using Anonymous Client for Public Endpoints

**Problem:**
```typescript
// ❌ WRONG - This will fail with RLS errors for anonymous visitors
const supabase = await createClient();
const { error } = await supabase
  .from('visitor_consent_preferences')
  .update({ consent_status: 'accepted' })
  .eq('visitor_id', visitorId);
// Error: new row violates row-level security policy
```

**Fix:**
```typescript
// ✅ CORRECT - Use service client for public operations
const supabase = await createServiceClient();
const { error } = await supabase
  .from('visitor_consent_preferences')
  .update({ consent_status: 'accepted' })
  .eq('visitor_id', visitorId);
```

---

### ❌ Mistake 2: Using Service Client for Admin Operations

**Problem:**
```typescript
// ❌ WRONG - Bypasses RLS, allowing unauthorized access
const supabase = await createServiceClient();
const { data } = await supabase
  .from('dpdpa_widget_configs')
  .select('*');
// Returns ALL widgets from ALL users!
```

**Fix:**
```typescript
// ✅ CORRECT - Use regular client to enforce RLS
const supabase = await createClient();
const { data, error } = await supabase.auth.getUser();
if (error || !data.user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
const { data: widgets } = await supabase
  .from('dpdpa_widget_configs')
  .select('*');
// Returns only widgets owned by the authenticated user
```

---

### ❌ Mistake 3: Duplicating createServiceClient()

**Problem:**
```typescript
// ❌ WRONG - Duplicating helper functions across files
// In file1.ts
async function createServiceClient() {
  const cookieStore = await cookies();
  return createServerClient(/* ... */);
}

// In file2.ts
async function createServiceClient() {
  const cookieStore = await cookies();
  return createServerClient(/* ... */);
}
```

**Fix:**
```typescript
// ✅ CORRECT - Import from centralized location
import { createServiceClient } from '@/lib/supabase/server';
```

---

### ❌ Mistake 4: Not Validating Inputs with Service Client

**Problem:**
```typescript
// ❌ WRONG - No validation allows attackers to access any visitor's data
const supabase = await createServiceClient();
const { visitorId } = await request.json();
const { data } = await supabase
  .from('visitor_consent_preferences')
  .select('*')
  .eq('visitor_id', visitorId);
// An attacker can pass any visitor_id and access their data!
```

**Fix:**
```typescript
// ✅ CORRECT - Validate widget_id and scope operations properly
const supabase = await createServiceClient();
const { visitorId, widgetId } = await request.json();

// Validate inputs
if (!visitorId || !widgetId) {
  return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
}

// Verify widget exists
const { data: widget } = await supabase
  .from('dpdpa_widget_configs')
  .select('widget_id')
  .eq('widget_id', widgetId)
  .single();

if (!widget) {
  return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
}

// Scope by both visitor_id AND widget_id
const { data } = await supabase
  .from('visitor_consent_preferences')
  .select('*')
  .eq('visitor_id', visitorId)
  .eq('widget_id', widgetId);
```

---

## Endpoint Examples

### Public Endpoints (Use `createServiceClient()`)

| Endpoint | Description | Why Service Client? |
|----------|-------------|---------------------|
| `/api/privacy-centre/preferences` | Get/update visitor preferences | Anonymous visitors need to manage preferences |
| `/api/privacy-centre/send-otp` | Send email verification OTP | Anonymous visitors need to verify email |
| `/api/privacy-centre/verify-otp` | Verify OTP and link preferences | Anonymous visitors need to verify |
| `/api/privacy-centre/preferences/bulk` | Bulk update preferences | Anonymous visitors use Accept All/Reject All |
| `/api/privacy-centre/rights-requests` | Submit DPDP rights request | Anonymous visitors can submit requests |
| `/api/privacy-centre/preferences/history` | View consent history | Anonymous visitors view their history |
| `/api/consent/record` | Record cookie consent | Anonymous visitors give consent |
| `/api/dpdpa/widget-public/[id]` | Get public widget config | Public widget loading |

### Protected Endpoints (Use `createClient()`)

| Endpoint | Description | Why Anonymous Client? |
|----------|-------------|----------------------|
| `/api/admin/*` | Admin operations | Requires user authentication |
| `/api/dpdpa/widgets` | Manage widgets | User owns widgets |
| `/api/dpdpa/activities` | Manage activities | User owns activities |
| `/api/user/profile` | User profile | User owns profile |
| `/api/payments/*` | Subscription management | User owns subscription |
| Dashboard pages | All dashboard routes | Requires authentication |

---

## Environment Variables

Ensure these are set in your `.env.local`:

```bash
# Public key - safe to expose in client-side code
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Service role key - NEVER expose in client-side code
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **Security Warning:** 
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is safe to expose (it respects RLS)
- `SUPABASE_SERVICE_ROLE_KEY` bypasses ALL security - NEVER expose in client code
- `SUPABASE_SERVICE_ROLE_KEY` should ONLY be used server-side with proper validation

---

## Testing Your Client Usage

### Test 1: Can Anonymous Visitors Access?

```bash
# Should work (service client)
curl -X POST http://localhost:3000/api/privacy-centre/preferences \
  -H "Content-Type: application/json" \
  -d '{"visitorId":"test","widgetId":"widget_123","preferences":[]}'

# Should return 401 (regular client, requires auth)
curl -X GET http://localhost:3000/api/admin/widgets
```

### Test 2: Does RLS Enforce User Ownership?

```bash
# Should only return current user's widgets
curl -X GET http://localhost:3000/api/dpdpa/widgets \
  -H "Authorization: Bearer USER_TOKEN"
```

### Test 3: Are Operations Properly Scoped?

```typescript
// Test that visitor A cannot access visitor B's data
const responseA = await fetch('/api/privacy-centre/preferences', {
  method: 'GET',
  body: JSON.stringify({
    visitorId: 'visitor_A',
    widgetId: 'widget_123'
  })
});

const responseB = await fetch('/api/privacy-centre/preferences', {
  method: 'GET',
  body: JSON.stringify({
    visitorId: 'visitor_B',
    widgetId: 'widget_123'
  })
});

// Should return different data for each visitor
```

---

## Migration Checklist

When creating a new API endpoint:

- [ ] Determine if endpoint is public or protected
- [ ] Choose correct client type (`createClient` vs `createServiceClient`)
- [ ] Add comment explaining why this client type is used
- [ ] If using service client, validate ALL inputs
- [ ] If using service client, scope operations properly
- [ ] Test with anonymous requests
- [ ] Test with authenticated requests
- [ ] Check for RLS errors in logs
- [ ] Add rate limiting for public endpoints
- [ ] Document in API reference

---

## Troubleshooting

### Error: "new row violates row-level security policy"

**Cause:** Using anonymous client (`createClient()`) for public operations.

**Fix:** Switch to `createServiceClient()`:
```typescript
import { createServiceClient } from '@/lib/supabase/server';
const supabase = await createServiceClient();
```

### Error: "No API key found in request"

**Cause:** Missing `SUPABASE_SERVICE_ROLE_KEY` environment variable.

**Fix:** Add to `.env.local`:
```bash
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Error: Unauthorized users can see other users' data

**Cause:** Using service client for admin operations.

**Fix:** Switch to `createClient()` and check authentication:
```typescript
import { createClient } from '@/lib/supabase/server';
const supabase = await createClient();
const { data: { user }, error } = await supabase.auth.getUser();
if (error || !user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

---

## Related Documentation

- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Service Role vs Anon Key](https://supabase.com/docs/guides/api/api-keys)

---

**Last Updated:** November 20, 2025  
**Author:** Engineering Team  
**Reviewed By:** Security Team

