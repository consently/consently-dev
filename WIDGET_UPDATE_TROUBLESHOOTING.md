# Widget Not Updating on External Website - Troubleshooting Guide

## Issue
The widget preview in the dashboard shows correct updates, but the live widget on your external website doesn't reflect the changes.

## Root Causes

### 1. Browser Cache
**Problem**: The browser cached the old widget.js file
**Solution**: Hard refresh the page
- **Chrome/Firefox (Windows/Linux)**: `Ctrl + Shift + R` or `Ctrl + F5`
- **Chrome/Firefox (Mac)**: `Cmd + Shift + R`
- **Safari (Mac)**: `Cmd + Option + R`

### 2. Service Worker Cache
**Problem**: Service worker cached the widget script
**Solution**: 
```javascript
// In browser console:
navigator.serviceWorker.getRegistrations().then(function(registrations) {
  for(let registration of registrations) {
    registration.unregister();
  }
});
```
Then hard refresh the page.

### 3. CDN/Proxy Cache
**Problem**: CDN or reverse proxy cached the widget.js
**Solutions**:
- Wait for CDN cache TTL to expire (usually 1-24 hours)
- Purge CDN cache manually (Cloudflare, Fastly, etc.)
- Add cache-busting query parameter to script tag

### 4. Incorrect Widget ID
**Problem**: External website is loading a different widget ID
**Solution**: Verify the widget ID in the embed code matches your dashboard

### 5. CORS Issues
**Problem**: Browser blocking requests due to CORS
**Solution**: Check browser console for CORS errors

## Quick Diagnostic Steps

### Step 1: Open Browser Console
Press `F12` or right-click → "Inspect" → "Console" tab

### Step 2: Check Widget Logs
Look for these console messages:
```
[Consently] Initializing widget v3.2 with ID: cnsty_xxx
[Consently] Fetching config from: https://...
[Consently] ✅ Configuration loaded
[Consently] 🔄 Auto-sync enabled - checking for updates every 5 seconds
```

### Step 3: Check for Errors
Look for errors like:
- `Failed to fetch` - Network/CORS issue
- `Widget configuration not found` - Wrong widget ID
- `404` - Widget.js not found (CDN issue)

### Step 4: Verify Widget ID
```javascript
// In browser console:
console.log(window.Consently);
// Should show your widget ID as a property
```

### Step 5: Check API Response
```javascript
// In browser console (replace with your widget ID):
fetch('https://www.consently.in/api/cookies/widget-public/YOUR_WIDGET_ID')
  .then(r => r.json())
  .then(d => console.log(d));
```

### Step 6: Force Reload Widget
```javascript
// In browser console (replace with your widget ID):
const widgetId = 'YOUR_WIDGET_ID';
if (window.Consently && window.Consently[widgetId]) {
  window.Consently[widgetId].reset();
}
```

## Solutions

### Solution 1: Add Cache-Busting to Embed Code
**Old embed code:**
```html
<script src="https://www.consently.in/widget.js" data-consently-id="cnsty_xxx" async></script>
```

**New embed code with cache-busting:**
```html
<script src="https://www.consently.in/widget.js?v=3.2.1" data-consently-id="cnsty_xxx" async></script>
```

Change the version number (`v=3.2.1`) whenever you update settings.

### Solution 2: Use Auto-Sync (Already Implemented)
The widget automatically polls for updates every 5 seconds when visible. Just wait 5 seconds and the banner should update.

**To verify auto-sync is working:**
1. Open browser console
2. Look for: `[Consently] 🔄 Auto-sync enabled - checking for updates every 5 seconds`
3. Make a change in dashboard
4. Watch console for: `[Consently] 🔄 Configuration updated! Refreshing widget...`

### Solution 3: Add HTTP Cache Headers (Server-side)
If you control the server, add these headers to widget.js:

```
Cache-Control: public, max-age=300, must-revalidate
ETag: "widget-v3.2"
```

This allows caching but forces revalidation every 5 minutes.

### Solution 4: Use a CDN with Manual Purge
If using a CDN:
1. **Cloudflare**: Cache → Purge Everything
2. **Fastly**: Purge → Purge All
3. **AWS CloudFront**: Invalidations → Create Invalidation

## Expected Behavior

### On Dashboard (Preview Mode)
- Changes appear INSTANTLY
- No caching issues
- Always shows latest config
- Preview mode auto-detected for `consently.in` and `localhost`

### On External Website (Production)
- **First load**: Gets latest config from API
- **Auto-sync**: Checks for updates every 5 seconds
- **Update delay**: Maximum 5 seconds (one polling cycle)
- **Browser cache**: May delay initial script load

## Testing Checklist

- [ ] Hard refresh browser (`Cmd/Ctrl + Shift + R`)
- [ ] Clear browser cache completely
- [ ] Check browser console for errors
- [ ] Verify correct widget ID in embed code
- [ ] Check API endpoint returns correct data
- [ ] Wait 5-10 seconds for auto-sync
- [ ] Try in incognito/private window
- [ ] Try different browser
- [ ] Check if service worker is active
- [ ] Purge CDN cache if applicable

## Common Mistakes

### 1. Wrong Widget ID
```html
<!-- ❌ WRONG - Using old/different widget ID -->
<script src="https://www.consently.in/widget.js" data-consently-id="cnsty_old123" async></script>

<!-- ✅ CORRECT - Using current widget ID from dashboard -->
<script src="https://www.consently.in/widget.js" data-consently-id="cnsty_mhc0ouby_9tmvy18rd" async></script>
```

### 2. Script Loaded from Wrong Domain
```html
<!-- ❌ WRONG - Loading from external CDN -->
<script src="https://cdn.example.com/widget.js" data-consently-id="cnsty_xxx" async></script>

<!-- ✅ CORRECT - Loading from Consently server -->
<script src="https://www.consently.in/widget.js" data-consently-id="cnsty_xxx" async></script>
```

### 3. Multiple Widget Scripts
```html
<!-- ❌ WRONG - Loading multiple times -->
<script src="https://www.consently.in/widget.js" data-consently-id="cnsty_xxx" async></script>
<script src="https://www.consently.in/widget.js" data-consently-id="cnsty_xxx" async></script>

<!-- ✅ CORRECT - Load only once -->
<script src="https://www.consently.in/widget.js" data-consently-id="cnsty_xxx" async></script>
```

## Still Not Working?

If the widget still doesn't update after trying all solutions:

1. **Check Network Tab**: 
   - Open DevTools → Network
   - Filter by "widget.js"
   - Check if request is made and status is 200
   - Check response headers for cache info

2. **Disable All Caching**:
   - Open DevTools → Network
   - Check "Disable cache"
   - Refresh page

3. **Check for JavaScript Errors**:
   - Look for any errors in console that might block widget execution
   - Check if other scripts are interfering

4. **Verify API Endpoint**:
   ```bash
   curl https://www.consently.in/api/cookies/widget-public/YOUR_WIDGET_ID
   ```

5. **Contact Support**:
   - Provide widget ID
   - Provide website URL
   - Share browser console logs
   - Share network request details

## Auto-Sync Technical Details

The widget uses these mechanisms for live updates:

1. **Initial Load**: Fetches config from `/api/cookies/widget-public/[widgetId]`
2. **Polling**: Checks for updates every 5000ms (5 seconds)
3. **Hash Comparison**: Compares config hash to detect changes
4. **Auto-Refresh**: Removes old banner and shows new one when detected
5. **Cache-Busting**: Adds `?_t=${timestamp}` to API requests

**Auto-sync only works when:**
- ✅ Banner is visible on screen
- ✅ No JavaScript errors
- ✅ API endpoint is reachable
- ✅ Config hash has changed

**Preview mode benefits:**
- Always shows banner even with valid consent
- Enables testing without clearing cookies
- Works on `consently.in` and `localhost` domains
