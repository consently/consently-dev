# Widget Configuration Debug Checklist

## Issue: Position, Layout, and Banner Content Not Reflecting on Live Widget

### Step 1: Verify Database Has Correct Data

Run this query in Supabase SQL Editor:

```sql
-- Check widget_configs table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'widget_configs'
AND column_name IN ('position', 'layout', 'banner_content', 'theme');

-- Check your actual widget config
SELECT 
  widget_id,
  position,
  layout,
  banner_content,
  theme,
  banner_template_id
FROM widget_configs
WHERE user_id = current_user_id();
```

**Expected Result:**
- `position` should be TEXT (e.g., 'center', 'bottom')
- `layout` should be TEXT (e.g., 'bar', 'modal')
- `banner_content` should be JSONB with title, message, button texts
- All columns should exist

### Step 2: Test API Response

Open your browser console and run:

```javascript
// Replace with your actual widget ID
const widgetId = 'YOUR_WIDGET_ID_HERE';

fetch(`/api/cookies/widget-public/${widgetId}`)
  .then(r => r.json())
  .then(data => {
    console.log('API Response:', data);
    console.log('Position:', data.position);
    console.log('Layout:', data.layout);
    console.log('Banner Content:', data.bannerContent || 'MISSING');
    console.log('Title:', data.title);
    console.log('Message:', data.message);
  });
```

**Expected Result:**
- `position` should match what you set in dashboard (e.g., "center")
- `layout` should match what you set (e.g., "bar")
- `title` should be your custom title
- `message` should be your custom message

### Step 3: Clear All Caches

1. **Browser Cache:**
   - Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+F5` (Windows)
   - Or open DevTools → Network tab → Check "Disable cache"

2. **CDN/API Cache:**
   The API has 60-second cache. Wait 1-2 minutes or add cache-busting:
   ```
   /api/cookies/widget-public/YOUR_ID?t=123456789
   ```

3. **LocalStorage:**
   ```javascript
   localStorage.removeItem('consently_language');
   localStorage.removeItem('consently_preferences');
   ```

4. **Cookies:**
   ```javascript
   document.cookie = 'consently_consent=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/';
   ```

### Step 4: Check Banner Template Link

The issue might be that the banner template is overriding widget settings.

Run in Supabase:

```sql
-- Check banner template
SELECT 
  bc.id,
  bc.name,
  bc.position as banner_position,
  bc.layout as banner_layout,
  bc.title as banner_title,
  bc.message as banner_message,
  bc.is_active
FROM widget_configs wc
LEFT JOIN banner_configs bc ON wc.banner_template_id = bc.id
WHERE wc.user_id = current_user_id();
```

**The Problem:**
- If `banner_template_id` is set, the banner values might override widget values
- The API merge priority should be: **Widget > Banner > Defaults**

### Step 5: Verify API Merge Logic

Check the API is using correct priority at line 171-173:

```typescript
// Should be:
layout: widgetConfig.layout || banner.layout || 'bar',
position: widgetConfig.position || banner.position || 'bottom',

// Content should come from widget first:
title: widgetConfig.banner_content?.title || banner.title,
message: widgetConfig.banner_content?.message || banner.message,
```

### Step 6: Re-save Widget Configuration

1. Go to `/dashboard/cookies/widget`
2. Make a small change (e.g., change position from "bottom" to "center")
3. Click **Save Configuration**
4. Verify success message appears
5. Check console logs for any errors

### Step 7: Verify Save Is Working

Add debug logging to the save handler. Temporarily edit `page.tsx`:

```typescript
// In handleSave function, add console logs:
console.log('Saving config:', {
  position: config.position,
  layout: config.layout,
  bannerContent: config.bannerContent
});

// After fetch response:
console.log('Save response:', data);
```

### Common Issues & Fixes

#### Issue 1: Position/Layout Always "bottom"/"bar"
**Cause:** Database doesn't have the columns
**Fix:** Run migration:
```bash
cd /Users/krissdev/consently-dev
# Apply migration manually in Supabase dashboard SQL editor
```

#### Issue 2: Banner Content Not Showing
**Cause:** `banner_content` column is NULL or not being saved
**Fix:** 
1. Check `banner_content` is in the UPDATE query (line 198)
2. Verify it's being sent in request payload

#### Issue 3: Changes Not Reflecting Immediately
**Cause:** API cache (60 seconds)
**Fix:** 
- Wait 60 seconds OR
- Add `?t=${Date.now()}` to API URL for testing

#### Issue 4: Banner Template Overriding Widget
**Cause:** Incorrect merge priority in API
**Fix:** Widget settings should ALWAYS win. Update API route lines 171-192.

### Quick Test Script

Run this in browser console on your live site:

```javascript
// Test widget config loading
(function() {
  const widgetId = document.querySelector('script[data-consently-id]')?.getAttribute('data-consently-id');
  
  if (!widgetId) {
    console.error('No widget ID found');
    return;
  }
  
  fetch(`/api/cookies/widget-public/${widgetId}?t=${Date.now()}`)
    .then(r => r.json())
    .then(config => {
      console.log('=== WIDGET CONFIG DEBUG ===');
      console.log('Widget ID:', widgetId);
      console.log('Position:', config.position, '(Should be what you set in dashboard)');
      console.log('Layout:', config.layout, '(Should be what you set in dashboard)');
      console.log('Title:', config.title);
      console.log('Message:', config.message);
      console.log('Banner Template ID:', config.bannerId);
      console.log('Full Config:', config);
      
      // Test if banner would render correctly
      if (config.position === 'bottom' && config.layout === 'bar') {
        console.warn('⚠️ Using default values! Check if save worked.');
      } else {
        console.log('✅ Custom position/layout detected');
      }
    })
    .catch(err => console.error('Failed to load config:', err));
})();
```

### The Root Cause

Based on the screenshots, you're changing:
- Position from "Bottom" to "Center"
- Layout from "Bar" to something else
- Banner content (title/message)

But live widget shows defaults. This means ONE of:

1. ✅ **Database columns missing** (you ran migration, so this is fixed)
2. 🔍 **Save not actually writing to DB** (check UPDATE query)
3. 🔍 **API returning cached old config** (wait 60s or bust cache)
4. 🔍 **Banner template overriding widget settings** (check merge priority)
5. 🔍 **Widget.js not reading config correctly** (but code looks good)

### Next Steps

1. Run Step 1 (check database has data)
2. Run Step 2 (check API returns correct data)
3. If API returns correct data but widget doesn't show it → widget.js cache issue
4. If API returns wrong data → database save issue or merge priority issue
