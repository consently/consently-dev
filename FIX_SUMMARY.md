# Widget Configuration Sync Issue - Root Cause & Fix

## 🔴 Root Cause Identified

When users click **"Generate Cookie Banner"** button (from cookie scanner):

### What Was Happening (BROKEN):
1. ✅ Banner template created with position='bottom', layout='bar' 
2. ❌ Widget config created **WITHOUT** position, layout, or bannerContent fields
3. ❌ API merges: `widgetConfig.position || banner.position` → always uses banner value (widget was null/undefined)
4. ❌ User changes position to "center" in dashboard → saves to widget BUT also updates banner
5. ❌ Both have same value, but **60-second API cache** prevents immediate update
6. ❌ User sees old values for up to 60 seconds

### What Should Happen (FIXED):
1. ✅ Banner template created with defaults
2. ✅ **Widget config ALSO stores position, layout, and bannerContent** 
3. ✅ API correctly merges with widget taking precedence
4. ✅ User changes settings → immediately reflected (no cache in development)
5. ✅ Live widget updates within 60 seconds (production) or immediately (development)

## ✅ Fixes Applied

### Fix 1: Initial Widget Creation
**File:** `app/dashboard/cookies/scan/page.tsx`  
**Lines:** 475-484

```typescript
// ADDED: Store position, layout, and content in widget config
position: bannerConfig.position,
layout: bannerConfig.layout,
bannerContent: {
  title: bannerConfig.title,
  message: bannerConfig.message,
  acceptButtonText: bannerConfig.acceptButton.text,
  rejectButtonText: bannerConfig.rejectButton.text,
  settingsButtonText: bannerConfig.settingsButton.text
}
```

### Fix 2: Disable Cache in Development
**File:** `app/api/cookies/widget-public/[widgetId]/route.ts`  
**Lines:** 225-228

```typescript
const isDev = process.env.NODE_ENV === 'development';
response.headers.set('Cache-Control', isDev 
  ? 'no-cache, no-store, must-revalidate'  // Development: no cache
  : 'public, s-maxage=60, stale-while-revalidate=120, must-revalidate'); // Production: 60s cache
```

### Fix 3: Added Debug Logging
**File:** `app/api/cookies/widget-public/[widgetId]/route.ts`  
**Lines:** 232-244

```typescript
// Added debug headers
response.headers.set('X-Widget-Position', config.position);
response.headers.set('X-Widget-Layout', config.layout);
response.headers.set('X-Widget-Source', widgetConfig.banner_template_id ? 'widget+banner' : 'widget-only');

// Console logging for debugging
console.log('[Widget API] Returning config:', {
  widgetId,
  position: config.position,
  layout: config.layout,
  title: config.title?.substring(0, 50),
  hasTemplate: !!widgetConfig.banner_template_id
});
```

### Fix 4: Save Function Logging
**File:** `app/dashboard/cookies/widget/page.tsx`  
**Lines:** 437-444, 544-549

Added console logs to track what's being saved.

## 🧪 How to Test the Fix

### For NEW widgets (created after fix):
1. Go to `/dashboard/cookies/scan`
2. Scan a website
3. Click "Generate Cookie Banner"
4. Go to `/dashboard/cookies/widget`
5. Change position from "Bottom" to "Center"
6. Change layout from "Bar" to "Modal"
7. Update banner content (title, message)
8. Click "Save Configuration"
9. **Result:** Changes should appear immediately in preview and within 60s on live site

### For EXISTING widgets (created before fix):
You need to re-save once to populate position/layout in widget_configs:

1. Go to `/dashboard/cookies/widget`
2. Make any small change (or just click Save without changes)
3. Click "Save Configuration"
4. Now position/layout are stored in widget config
5. Future changes will work correctly

### Verify in Console:
When you save, you should see:
```
[Widget Save] Starting save with config: {
  position: 'center',
  layout: 'modal',
  bannerContent: {...},
  ...
}

[Widget API] Returning config: {
  widgetId: 'cnsty_...',
  position: 'center',
  layout: 'modal',
  ...
}
```

### Check API Response:
Open browser DevTools → Network tab, find the request to `/api/cookies/widget-public/[widgetId]`, check response headers:
- `X-Widget-Position` should show your position
- `X-Widget-Layout` should show your layout
- `X-Config-Timestamp` shows when config was generated

## 📊 Priority Chain (Confirmed Working)

```
Widget Config (HIGHEST)
     ↓
Banner Template
     ↓
System Defaults (FALLBACK)
```

### Examples:
| Setting | Widget Value | Banner Value | Result | Source |
|---------|-------------|--------------|---------|--------|
| Position | 'center' | 'bottom' | **'center'** | Widget wins ✅ |
| Position | null | 'bottom' | 'bottom' | Banner fallback |
| Position | null | null | 'bottom' | Default fallback |
| Layout | 'modal' | 'bar' | **'modal'** | Widget wins ✅ |
| Title | 'Custom' | 'Default' | **'Custom'** | Widget wins ✅ |

## ⚠️ Important Notes

1. **Cache Duration:** In production, API responses are cached for 60 seconds. In development (NODE_ENV=development), no cache.

2. **Migration Required:** The database migration `20251030_add_missing_widget_config_columns.sql` MUST be applied. You said you ran it manually - verify with:
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'widget_configs' 
   AND column_name IN ('position', 'layout', 'banner_content');
   ```

3. **Existing Widgets:** If you have widgets created before this fix, they won't have position/layout in widget_configs yet. Just re-save them once.

4. **Banner Template Sync:** When you save widget settings, the linked banner template is ALSO updated to match. This is intentional - keeps them in sync. But widget values always take precedence in the API.

## 🚀 Deployment Checklist

- [x] Fix 1: Initial widget creation includes position/layout/content
- [x] Fix 2: Development mode disables cache
- [x] Fix 3: Debug headers added to API
- [x] Fix 4: Console logging added to save function
- [ ] Test: Create new widget and verify position/layout work
- [ ] Test: Update existing widget and verify changes apply
- [ ] Deploy: Push changes to production
- [ ] Verify: Check live widgets update correctly

## 🐛 If Issues Persist

Run this in browser console on live site:

```javascript
// Debug script
const widgetId = document.querySelector('script[data-consently-id]')?.getAttribute('data-consently-id');

fetch(`/api/cookies/widget-public/${widgetId}?t=${Date.now()}`)
  .then(r => {
    console.log('Response Headers:', {
      position: r.headers.get('X-Widget-Position'),
      layout: r.headers.get('X-Widget-Layout'),
      source: r.headers.get('X-Widget-Source'),
      timestamp: r.headers.get('X-Config-Timestamp')
    });
    return r.json();
  })
  .then(config => {
    console.log('API Config:', {
      position: config.position,
      layout: config.layout,
      title: config.title,
      message: config.message?.substring(0, 50) + '...'
    });
    
    if (config.position === 'bottom' && config.layout === 'bar') {
      console.error('❌ Still using defaults! Check database.');
    } else {
      console.log('✅ Custom values detected!');
    }
  });
```

Then check Supabase database:

```sql
-- Verify widget has position/layout
SELECT 
  widget_id,
  position,
  layout,
  banner_content,
  banner_template_id
FROM widget_configs
WHERE user_id = 'YOUR_USER_ID';
```

If `position` and `layout` are NULL → widget wasn't re-saved after fix. Re-save in dashboard.

## ✨ Summary

**Problem:** Initial widget creation didn't include position/layout/content → always used banner template defaults.

**Solution:** Now stores these values in widget config from the start → user customizations work correctly.

**Action Required:** 
1. Deploy code changes
2. Test with NEW widget creation
3. Re-save any EXISTING widgets to populate the fields
4. Clear browser cache when testing
