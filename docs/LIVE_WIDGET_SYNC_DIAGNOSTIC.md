# Live Widget Sync Issues - Complete Diagnostic Report

**Date:** 2025-10-29  
**Severity:** 🔴 CRITICAL - Production Impact  
**Status:** Issues Identified - Fixes Required

---

## 🚨 Problem Statement

**Dashboard preview shows correct settings, but live integrated widget does NOT update** after:
- Publishing template changes
- Updating theme/appearance settings  
- Modifying banner configuration
- Even with up-to-date integration code

**Impact:** Production websites continue showing old/outdated cookie banners despite dashboard changes.

---

## 🔍 Root Causes Identified

### **Root Cause #1: Aggressive API Caching (5 Minutes)**

**Location:** `app/api/cookies/widget-public/[widgetId]/route.ts` Line 212

**Problem:**
```typescript
// Current cache header
response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
```

**Impact:**
- API responses cached for **5 minutes** (`s-maxage=300`)
- Stale content served for **10 more minutes** (`stale-while-revalidate=600`)
- Changes take **5-15 minutes** to propagate to live widgets
- CDNs and browsers cache responses aggressively

**Why Dashboard Preview Works:**
- Preview fetches directly from API on save (no cache)
- Preview uses fresh data every time "Show Preview" clicked
- Dashboard doesn't respect API cache headers

**Evidence:**
```bash
# Test API caching
curl -I https://yourdomain.com/api/cookies/widget-public/cnsty_abc123

# Returns:
Cache-Control: public, s-maxage=300, stale-while-revalidate=600
# ↑ This prevents immediate updates
```

---

### **Root Cause #2: Browser Cache on widget.js**

**Location:** `public/widget.js` Line 258

**Problem:**
```javascript
const response = await fetch(apiUrl, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  },
  cache: 'default' // ❌ Uses browser cache (5+ minutes)
});
```

**Impact:**
- Browser caches API response per `Cache-Control` headers
- Even if API updates, browser serves cached version
- No cache-busting mechanism (no timestamps/versions)
- Hard refresh (Ctrl+Shift+R) required to see changes

**Why This Matters:**
- User visits website → widget.js loads → API call cached
- Admin updates settings in dashboard
- User returns → widget.js still uses cached API response
- Changes invisible until cache expires (5-15 minutes)

---

### **Root Cause #3: No Cache Invalidation on Save**

**Location:** `app/dashboard/cookies/widget/page.tsx`

**Problem:**
- When admin saves widget/banner changes, **no cache invalidation** triggered
- API cache continues serving old data
- No version numbering or timestamps in API responses
- No webhook/signal to clear CDN/browser caches

**Missing Flow:**
```
Save Button → Update Database → ❌ NO CACHE CLEAR → Old Cache Still Served
```

**Should Be:**
```
Save Button → Update Database → Invalidate Cache → Fresh Data Immediately
```

---

### **Root Cause #4: Static widget.js File**

**Location:** `public/widget.js`

**Problem:**
- widget.js itself is a static file that rarely changes
- Browsers cache widget.js for long periods
- Integration code references static path: `/widget.js`
- No versioning or cache-busting in script URL

**Impact:**
- Even if API is updated, old widget.js code might be cached
- No way to force widget.js refresh without manual cache clear
- Production deployments don't automatically refresh widget.js

**Current Integration:**
```html
<script src="https://yourdomain.com/widget.js" data-consently-id="cnsty_abc123"></script>
<!-- ↑ No version parameter, cached indefinitely -->
```

---

### **Root Cause #5: No Real-Time Sync Mechanism**

**Architecture Gap:**
- No WebSocket/SSE for real-time updates
- No polling mechanism to check for updates
- Widget loads once per page view, never refreshes
- Dashboard preview uses different data path than live widget

**Preview vs Live Widget:**

| Aspect | Dashboard Preview | Live Widget |
|--------|------------------|-------------|
| Data Source | Direct API call (no cache) | Cached API response |
| Update Trigger | Manual "Show Preview" click | Page load only |
| Cache Respect | Ignores cache headers | Full cache respect |
| Refresh Mechanism | On-demand | None |

---

## 🛠️ Solutions & Fixes

### **Fix #1: Reduce API Cache Duration**

**File:** `app/api/cookies/widget-public/[widgetId]/route.ts`  
**Current:** 5 minutes cache + 10 minutes stale  
**Recommended:** 1 minute cache + 2 minutes stale

**Implementation:**

```typescript
// BEFORE (Line 212)
response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

// AFTER - Option A: Short Cache (1 minute)
response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120, must-revalidate');

// OR Option B: No Cache (immediate updates, higher server load)
response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
response.headers.set('Pragma', 'no-cache');
response.headers.set('Expires', '0');
```

**Trade-offs:**
- ✅ **Option A (1 min cache):** Balance performance + quick updates (1-2 min delay)
- ✅ **Option B (no cache):** Immediate updates but higher API load
- ⚠️ **Recommendation:** Start with Option A, monitor API load

---

### **Fix #2: Add Cache-Busting to Widget API Calls**

**File:** `public/widget.js`  
**Current:** `cache: 'default'`  
**Recommended:** Add timestamp to force fresh requests

**Implementation:**

```javascript
// BEFORE (Line 253-259)
const response = await fetch(apiUrl, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  },
  cache: 'default' // Uses browser cache
});

// AFTER
const cacheBuster = Date.now();
const apiUrlWithCache = `${apiUrl}?_t=${cacheBuster}`;

const response = await fetch(apiUrlWithCache, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache'
  },
  cache: 'no-store' // Bypass browser cache
});
```

**Impact:**
- ✅ Forces fresh API request every time
- ✅ Bypasses browser cache
- ✅ Settings update immediately on widget load
- ⚠️ Slightly higher API load (acceptable for most use cases)

---

### **Fix #3: Add ETag/Last-Modified Headers**

**File:** `app/api/cookies/widget-public/[widgetId]/route.ts`

**Add version tracking:**

```typescript
// Generate ETag based on config content
const configString = JSON.stringify(config);
const etag = `"${Buffer.from(configString).toString('base64').substring(0, 32)}"`;

// Check If-None-Match header
const requestEtag = request.headers.get('If-None-Match');
if (requestEtag === etag) {
  return new NextResponse(null, { status: 304 }); // Not Modified
}

const response = NextResponse.json(config);
response.headers.set('ETag', etag);
response.headers.set('Cache-Control', 'public, max-age=60, must-revalidate');
response.headers.set('Last-Modified', new Date().toUTCString());
```

**Benefits:**
- ✅ Efficient caching with validation
- ✅ Server can return 304 Not Modified if unchanged
- ✅ Reduces bandwidth while ensuring freshness

---

### **Fix #4: Version widget.js File**

**Current:**
```html
<script src="/widget.js" data-consently-id="cnsty_abc123"></script>
```

**Option A: Add Version Parameter**
```html
<script src="/widget.js?v=3.1.0" data-consently-id="cnsty_abc123"></script>
```

**Option B: Hash-Based Filename (Best Practice)**
```html
<script src="/widget.abc123def.js" data-consently-id="cnsty_abc123"></script>
```

**Implementation:** Add build step to generate versioned files

---

### **Fix #5: Add Cache Invalidation on Save**

**File:** `app/dashboard/cookies/widget/page.tsx`

**Add cache clear after successful save:**

```typescript
const handleSave = async () => {
  // ... existing save logic ...
  
  // After successful save, invalidate cache
  try {
    // Option A: Call revalidation endpoint
    await fetch(`/api/revalidate?path=/api/cookies/widget-public/${config.widgetId}`, {
      method: 'POST'
    });
    
    // Option B: Send cache-bust signal to CDN (if using Vercel/Cloudflare)
    await fetch('https://api.vercel.com/v1/purge', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.VERCEL_TOKEN}` },
      body: JSON.stringify({ urls: [`/api/cookies/widget-public/${config.widgetId}`] })
    });
    
    toast.success('Settings saved and cache cleared!');
  } catch (error) {
    console.warn('Cache invalidation failed, changes will appear in 1-2 minutes');
  }
};
```

---

### **Fix #6: Add Live Preview with Real API**

**File:** `app/dashboard/cookies/widget/page.tsx`

**Make preview use same API endpoint as live widget:**

```typescript
// Current: Preview uses local config state
// New: Preview fetches from actual API

const fetchPreviewConfig = async (widgetId: string) => {
  try {
    setLoadingPreview(true);
    
    // Add cache-buster to get fresh data
    const cacheBuster = Date.now();
    const response = await fetch(
      `/api/cookies/widget-public/${widgetId}?_t=${cacheBuster}`,
      { cache: 'no-store' }
    );
    
    if (response.ok) {
      const mergedConfig = await response.json();
      setPreviewConfig(mergedConfig);
      
      // Validate preview matches what live widget will show
      console.log('✅ Preview using LIVE API data:', mergedConfig);
    }
  } finally {
    setLoadingPreview(false);
  }
};

// Call this immediately after save
await handleSave();
await fetchPreviewConfig(config.widgetId); // Verify changes
```

---

## 📋 Complete Fix Implementation

### **Quick Fix (Immediate - 15 mins)**

1. **Reduce API cache** from 5 min to 1 min
2. **Add no-cache header** to widget.js fetch
3. **Add cache-buster parameter** to API URL

### **Medium Fix (1-2 hours)**

4. **Add ETag headers** for efficient caching
5. **Add cache invalidation** on save button
6. **Test cache behavior** end-to-end

### **Long-term Fix (Future Enhancement)**

7. **Version widget.js** with build hash
8. **Add CDN cache purging** integration
9. **Implement real-time WebSocket** updates (optional)

---

## 🔧 Implementation Steps

### **Step 1: Update API Cache Headers**

<function_calls>
<invoke name="edit_files">
<parameter name="title">Reduce API cache duration for faster updates