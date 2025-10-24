# Troubleshooting Widget Integration Issues

## Problem: Shopify shows generic content instead of custom widget configuration

### Root Causes
1. ✅ **API Response Missing Fields** - Fixed in commit
2. 🔄 **Cache Issues** - Widget responses cached for 5 minutes
3. ⚠️ **Configuration Not Saved** - Preview shows unsaved local changes

---

## Solution Steps

### Step 1: Clear Browser Cache & Deploy Latest Changes

```bash
# From your project directory
git add .
git commit -m "fix: add supportedLanguages to widget public API"
git push
```

Wait for Vercel to deploy (usually 1-2 minutes).

### Step 2: Force Cache Refresh

**Option A: Manual API Cache Bust**
1. Get your widget ID from the dashboard
2. Open browser console and run:
   ```javascript
   fetch('https://consently-dev-sigma.vercel.app/api/dpdpa/widget-public/YOUR_WIDGET_ID', {
     cache: 'reload'
   }).then(r => r.json()).then(console.log)
   ```
3. Verify the response includes your custom configuration

**Option B: Wait 5 minutes**
The cache will expire automatically after 5 minutes (as set in the API).

### Step 3: Verify Configuration is Saved

1. Go to Dashboard → DPDPA Consent Widget
2. Click **"Save Configuration"** button (even if it says "Last saved: X minutes ago")
3. Wait for success message: "✅ Configuration saved successfully!"

### Step 4: Check Widget in Shopify

1. Clear Shopify theme cache:
   - Go to: Online Store → Themes → Actions → "Clear cache"
   
2. Test in **Incognito/Private browsing window** to avoid browser cache

3. Hard refresh your Shopify store:
   - Windows: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

### Step 5: Verify Widget Configuration

Open browser console on your Shopify store and run:

```javascript
// Check if widget loaded
console.log(window.consentlyDPDPA);

// Check current configuration
console.log('Widget loaded:', !!document.querySelector('#consently-dpdpa-widget'));
```

---

## Debugging Tips

### 1. Check Network Requests

Open DevTools → Network tab → Filter by "widget-public"

Look for:
- ✅ Status: 200 OK
- ✅ Response contains your custom text
- ✅ `supportedLanguages` array present

### 2. Check Console Errors

Look for errors like:
```
[Consently DPDPA] Failed to load configuration
[Consently DPDPA] Error: data-dpdpa-widget-id attribute is required
```

### 3. Verify Widget ID

Check your Shopify theme.liquid file:
```html
<script src="https://consently-dev-sigma.vercel.app/dpdpa-widget.js" 
        data-dpdpa-widget-id="YOUR_WIDGET_ID_HERE">
</script>
```

Make sure the `data-dpdpa-widget-id` matches the ID shown in your dashboard.

---

## Common Issues

### Issue: Widget shows "We value your privacy" instead of custom text

**Cause:** You're in preview mode OR configuration not saved

**Fix:**
1. Click "Save Configuration" in dashboard
2. Wait 5 minutes for cache to expire
3. Hard refresh Shopify store

### Issue: Widget doesn't appear at all

**Cause:** Script not loaded or widget ID missing

**Fix:**
1. Check browser console for errors
2. Verify script tag is in theme.liquid
3. Check widget is set to `isActive: true`

### Issue: Privacy notice content is generic

**Cause:** No processing activities selected

**Fix:**
1. Go to "Processing Activities" tab
2. Select at least one activity
3. Save configuration

---

## API Response Check

Your API should return something like this:

```json
{
  "widgetId": "dpdpa_abc123...",
  "name": "Your Widget Name",
  "domain": "yourstore.myshopify.com",
  "theme": {
    "primaryColor": "#3b82f6",
    "backgroundColor": "#ffffff",
    ...
  },
  "supportedLanguages": ["en", "hi", "pa", "te", "ta"],
  "activities": [...],
  "privacyNoticeHTML": "<!DOCTYPE html>...",
  "autoShow": true,
  "showDataSubjectsRights": true
}
```

If `supportedLanguages` is missing, the fix hasn't deployed yet.

---

## Production Deployment Checklist

- [ ] Widget configuration saved in dashboard
- [ ] At least 1 processing activity selected
- [ ] Widget set to "Active" status
- [ ] Script tag added to Shopify theme.liquid (before `</body>`)
- [ ] Correct widget ID in script tag
- [ ] Latest code deployed to Vercel
- [ ] Cache cleared (5 min wait or manual)
- [ ] Tested in incognito browser

---

## Need More Help?

1. Check widget logs in browser console
2. Verify API response includes custom config
3. Ensure you clicked "Save Configuration"
4. Try in incognito mode to rule out cache

## Quick Test Command

```bash
# Test your widget API endpoint (replace WIDGET_ID)
curl "https://consently-dev-sigma.vercel.app/api/dpdpa/widget-public/WIDGET_ID" | json_pp
```

This should show your full configuration including `supportedLanguages`.
