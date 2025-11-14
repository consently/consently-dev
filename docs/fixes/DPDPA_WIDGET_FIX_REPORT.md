# DPDPA Widget Visibility Issue - Root Cause Analysis & Fix

**Date**: 2025-11-06  
**Issue**: Widget works on developer's laptop but not visible to other users  
**Status**: ✅ FIXED

---

## 🔍 Root Cause Analysis

### Primary Issue: Incorrect Widget Script URL Generation

**Location**: `app/dashboard/dpdpa/integration/page.tsx`

**Problem**: The integration code generator was using `window.location.origin` to construct widget script URLs. This caused:

```javascript
// BEFORE (BROKEN):
const origin = window.location.origin;  // Gets current page's domain
// Generated URLs:
// - Developer's laptop: http://localhost:3000/dpdpa-widget.js ✅
// - User's website:     https://user-site.com/dpdpa-widget.js ❌ (doesn't exist!)
```

### Why It Worked on Your Laptop

1. **You were testing locally**: When you viewed the integration page on `localhost:3000`, it generated URLs pointing to `localhost:3000/dpdpa-widget.js`
2. **The file exists locally**: Your local server has the `dpdpa-widget.js` file in the `/public` directory
3. **API calls worked**: The widget's API URL detection (lines 254-268 in `public/dpdpa-widget.js`) correctly identified localhost

### Why It Failed for Others

1. **Wrong script source**: Users copied embed code with URLs pointing to **their own domains**
2. **File doesn't exist**: Their websites don't have `dpdpa-widget.js` - it only exists on your server
3. **Widget never loads**: Browser tries to load a non-existent file, widget fails silently
4. **No error visibility**: Users only see console errors in browser DevTools

---

## 🎯 The Solution

### 1. Fixed Widget URL to Always Use Production Domain

**Changed in**: `app/dashboard/dpdpa/integration/page.tsx`

```javascript
// AFTER (FIXED):
const widgetUrl = process.env.NEXT_PUBLIC_WIDGET_URL || 'https://www.consently.in';
// Always generates: https://www.consently.in/dpdpa-widget.js ✅
```

### 2. Functions Updated

- ✅ `getEmbedCode()` - Basic HTML embed code
- ✅ `getReactExample()` - React/Next.js integration
- ✅ `getNextJsExample()` - Next.js specific example
- ✅ `getWordPressExample()` - WordPress integration

### 3. Environment Configuration Added

Created `.env.example` with:
```bash
NEXT_PUBLIC_WIDGET_URL=https://www.consently.in
```

For local development, users can override to:
```bash
NEXT_PUBLIC_WIDGET_URL=http://localhost:3000
```

---

## 📋 Testing Checklist

### Before Deployment

- [ ] Set `NEXT_PUBLIC_WIDGET_URL=https://www.consently.in` in production environment variables
- [ ] Deploy the updated code to production
- [ ] Verify `https://www.consently.in/dpdpa-widget.js` is accessible (check CORS headers)

### After Deployment

- [ ] Go to `/dashboard/dpdpa/integration` page
- [ ] Copy the new embed code
- [ ] Test on a **different domain** (not consently.in or localhost)
- [ ] Check browser console for:
  ```
  [Consently DPDPA] Initializing widget with ID: <widget-id>
  [Consently DPDPA] Fetching configuration from: https://www.consently.in/api/dpdpa/widget-public/<widget-id>
  [Consently DPDPA] Configuration loaded: <widget-name>
  ```
- [ ] Verify widget appears on the test page
- [ ] Test consent acceptance/rejection flow
- [ ] Verify consent is recorded in Supabase

### Test Domains

Test the widget on these types of sites:
1. **Static HTML page** (hosted on any domain)
2. **React application**
3. **Next.js application**
4. **WordPress site**

---

## 🚨 Additional Issues Found & Fixed

### 1. CORS Headers (Already Configured ✅)

Location: `next.config.ts` (lines 86-102)

The CORS headers for `/api/dpdpa/*` endpoints are properly configured:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, OPTIONS`
- Widget can be loaded from any domain

### 2. Widget Script CORS (Already Configured ✅)

Location: `next.config.ts` (lines 113-121)

The `/dpdpa-widget.js` file has proper CORS headers allowing cross-origin loading.

---

## 🔧 How the Widget Works (Architecture)

### Loading Flow

```
1. User's Website
   └─> Loads: <script src="https://www.consently.in/dpdpa-widget.js" 
                      data-dpdpa-widget-id="xyz123"></script>

2. Widget Script Execution
   ├─> Reads widget ID from data attribute
   ├─> Determines API base URL from script src
   └─> Constructs API URL: https://www.consently.in/api/dpdpa/widget-public/xyz123

3. Fetches Configuration
   ├─> GET /api/dpdpa/widget-public/xyz123
   └─> Returns: activities, styling, content, etc.

4. Renders Widget
   ├─> Creates modal/banner UI
   ├─> Displays processing activities
   └─> Handles user consent

5. Records Consent
   └─> POST /api/dpdpa/consent-record
       └─> Stores in Supabase
```

### API URL Detection Logic

In `public/dpdpa-widget.js` (lines 254-268):

```javascript
async function fetchWidgetConfig() {
  const scriptSrc = currentScript.src;  // Gets actual script URL
  let apiBase;
  
  if (scriptSrc && scriptSrc.includes('http')) {
    const url = new URL(scriptSrc);
    apiBase = url.origin;  // Extracts domain from script URL
  } else {
    apiBase = window.location.origin;  // Fallback
  }
  
  // API URL is constructed from the domain where script is hosted
  const apiUrl = `${apiBase}/api/dpdpa/widget-public/${widgetId}`;
}
```

**This is why the fix works**: By ensuring the script always loads from `consently.in`, the widget will always call APIs on `consently.in`.

---

## 📝 Instructions for Users

### For Development/Testing

1. Create `.env.local` file:
   ```bash
   NEXT_PUBLIC_WIDGET_URL=http://localhost:3000
   ```

2. Test locally with the localhost URL in embed codes

### For Production

1. Set environment variable in your hosting platform:
   ```bash
   NEXT_PUBLIC_WIDGET_URL=https://www.consently.in
   ```

2. Deploy the application

3. All integration codes will now use production URL

---

## 🎓 Lessons Learned

### What Went Wrong

1. **Development Trap**: Using `window.location.origin` worked locally but not in production scenarios
2. **Silent Failures**: No visible error for users - only console logs
3. **Testing Gap**: Widget wasn't tested on external domains during development

### Best Practices Going Forward

1. **Always use environment variables** for external resources
2. **Test on different domains** before production release
3. **Add visible error messages** for widget loading failures
4. **Document deployment requirements** clearly

---

## 🔄 Rollback Plan (If Needed)

If issues arise after deployment:

```javascript
// Quick rollback in integration/page.tsx
const widgetUrl = 'https://www.consently.in';  // Hard-code temporarily
```

Then investigate environment variable configuration.

---

## ✅ Verification Commands

### Check Widget Script is Accessible
```bash
curl -I https://www.consently.in/dpdpa-widget.js
# Should return: 200 OK
# With: Access-Control-Allow-Origin: *
```

### Check API Endpoint
```bash
curl https://www.consently.in/api/dpdpa/widget-public/YOUR_WIDGET_ID
# Should return: 200 OK with widget configuration JSON
```

### Check CORS Headers
```bash
curl -I -X OPTIONS https://www.consently.in/api/dpdpa/widget-public/test \
  -H "Origin: https://example.com"
# Should include CORS headers
```

---

## 📞 Support & Debugging

If users still report issues after fix:

### Common Debugging Steps

1. **Check browser console** for error messages
2. **Verify widget ID** is correct in embed code
3. **Check widget is active** in dashboard
4. **Test in incognito mode** (clear cache/cookies)
5. **Verify network requests** in DevTools → Network tab:
   - Script load: `dpdpa-widget.js` (should be 200)
   - Config fetch: `widget-public/<id>` (should be 200)

### Known Limitations

- Widget requires JavaScript enabled
- LocalStorage must be available
- Third-party cookies must be allowed for consent recording

---

## 📊 Impact & Priority

- **Severity**: 🔴 CRITICAL - Complete feature failure
- **Users Affected**: All external users trying to integrate
- **Business Impact**: Blocks product adoption and demo
- **Fix Complexity**: ✅ Low - Simple configuration change
- **Deployment Risk**: ✅ Low - Minimal code change

---

**Status**: Fix implemented and ready for testing.
**Next Steps**: Deploy to production and verify with external test site.
