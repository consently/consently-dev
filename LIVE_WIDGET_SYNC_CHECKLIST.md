# Live Widget Sync - Troubleshooting Checklist

**Purpose:** Diagnose and fix when live widget doesn't match dashboard preview  
**Last Updated:** 2025-10-29

---

## 🔍 Quick Diagnosis (2 Minutes)

### **Step 1: Identify the Issue**

Check which scenario applies:

- [ ] **Scenario A:** Preview works, live widget shows old settings (CACHE ISSUE) ← Most Common
- [ ] **Scenario B:** Preview broken, live widget broken (CODE/API ISSUE)
- [ ] **Scenario C:** Preview works, live widget never updates (INTEGRATION ISSUE)
- [ ] **Scenario D:** Changes appear after 5-15 minutes (CACHE TIMING ISSUE)

**→ If Scenario A or D:** Continue with cache troubleshooting below  
**→ If Scenario B:** Check API errors and logs  
**→ If Scenario C:** Verify integration code and widget ID

---

## ✅ Cache Troubleshooting Steps

### **Test 1: Verify API is Returning Latest Data**

```bash
# Test API directly (bypass all caches)
curl "https://yourdomain.com/api/cookies/widget-public/YOUR_WIDGET_ID?_t=$(date +%s)" \
  -H "Cache-Control: no-cache" \
  -v

# Check response headers
# Look for:
# - Cache-Control: should be "s-maxage=60" (1 min) not "s-maxage=300" (5 min)
# - X-Config-Timestamp: should be recent
# - Content: should match your latest dashboard settings
```

**Expected Result:**
- ✅ Response contains latest theme colors, language settings
- ✅ Cache-Control shows 60 seconds (1 minute)
- ✅ X-Config-Timestamp is within last few seconds

**If API shows old data:**
- ❌ Settings not saved to database
- ❌ Banner template not linked correctly
- → Check database tables `widget_configs` and `banner_configs`

---

### **Test 2: Check Browser Cache**

```javascript
// Open browser console on your live website
// Run this command:
console.log('Consently Cache Test:', localStorage, sessionStorage);

// Look for:
// - consently_consent: May contain old consent
// - consently_language: Language preference
// - consently_session_id: Current session

// Clear all Consently data:
localStorage.removeItem('consently_consent');
localStorage.removeItem('consently_language');
sessionStorage.removeItem('consently_session_id');
sessionStorage.removeItem('consently_temp_prefs');

// Reload page and check if widget updates
location.reload();
```

**Expected Result:**
- ✅ Widget loads with latest settings after cache clear
- ✅ No console errors

**If widget still shows old settings after cache clear:**
- → Continue to Test 3 (CDN Cache)

---

### **Test 3: Check CDN/Proxy Cache**

```bash
# Test if CDN is caching API responses
curl -I "https://yourdomain.com/api/cookies/widget-public/YOUR_WIDGET_ID"

# Look for headers indicating CDN caching:
# - X-Cache: HIT (cached by CDN)
# - CF-Cache-Status: HIT (Cloudflare cache)
# - X-Vercel-Cache: HIT (Vercel edge cache)
# - Age: <seconds> (how old the cached response is)
```

**If Age > 60 seconds or Cache Status = HIT:**
- CDN is serving stale cached data
- → Purge CDN cache (see CDN Purging section below)

---

### **Test 4: Verify widget.js Version**

```bash
# Check if widget.js itself is cached
curl -I "https://yourdomain.com/widget.js"

# Look for:
# - Cache-Control: how long browser caches the file
# - Last-Modified: when file was last changed
# - ETag: version identifier

# Expected: widget.js should have cache-busting timestamp in URL
# Actual: widget.js?_t=1234567890
```

**If widget.js is heavily cached:**
- → Add version parameter to script tag
- → See "Fix Widget.js Caching" section

---

### **Test 5: Timeline Test**

Track how long it takes for changes to appear:

1. **Save settings in dashboard** at time T0
2. **Check API immediately** (T0 + 10 seconds)
   ```bash
   curl "https://yourdomain.com/api/cookies/widget-public/YOUR_WIDGET_ID?_t=$(date +%s)"
   ```
3. **Reload live website** (T0 + 30 seconds)
4. **Hard refresh browser** (Ctrl+Shift+R) (T0 + 1 minute)
5. **Check from different device** (T0 + 2 minutes)

**Timeline Expectations:**
- ✅ **0-10 sec:** API returns new data
- ✅ **30-60 sec:** Browser shows new data after hard refresh
- ✅ **1-2 min:** All users see new data (CDN cache expired)

**If timeline exceeds expectations:**
- → Caching too aggressive
- → See "Fix Cache Duration" section

---

## 🛠️ Fix Procedures

### **Fix 1: Clear All Caches (Immediate)**

#### A. Browser Cache (User Side)
```
Chrome/Edge:
1. Ctrl+Shift+Delete (Windows) / Cmd+Shift+Delete (Mac)
2. Select "Cached images and files"
3. Clear data
4. Hard refresh: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)

Firefox:
1. Ctrl+Shift+Delete
2. Select "Cache"
3. Clear Now
4. Hard refresh: Ctrl+F5

Safari:
1. Cmd+Option+E (Empty Caches)
2. Cmd+R (Reload)
```

#### B. CDN Cache (Admin Side)

**Vercel:**
```bash
# Install Vercel CLI
npm i -g vercel

# Purge specific path
vercel env pull
vercel --prod --force

# Or via API
curl -X POST "https://api.vercel.com/v1/deployments/YOUR_DEPLOYMENT_ID/purge" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"paths": ["/api/cookies/widget-public/*"]}'
```

**Cloudflare:**
```bash
# Via dashboard: caching → configuration → purge cache
# Or via API:
curl -X POST "https://api.cloudflare.com/client/v4/zones/YOUR_ZONE_ID/purge_cache" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"files":["https://yourdomain.com/api/cookies/widget-public/YOUR_WIDGET_ID"]}'
```

**Other CDNs:**
- Check provider documentation for cache purge API
- Most have dashboard option to purge by URL pattern

---

### **Fix 2: Reduce Cache Duration (Permanent)**

**Already implemented in latest code!**

Verify the fix is deployed:

```bash
# Check API cache headers
curl -I "https://yourdomain.com/api/cookies/widget-public/YOUR_WIDGET_ID"

# Should show:
Cache-Control: public, s-maxage=60, stale-while-revalidate=120, must-revalidate
# ↑ 60 seconds = 1 minute (was 300 = 5 minutes)
```

**If still showing old cache headers:**
1. Verify code changes deployed
2. Restart application server
3. Clear CDN cache
4. Test again

---

### **Fix 3: Add Cache-Busting to Integration (Permanent)**

**Already implemented in widget.js!**

Verify widget.js is making cache-busted requests:

```javascript
// Open browser console on live website
// Look for network request to:
// /api/cookies/widget-public/YOUR_WIDGET_ID?_t=1730189894123
//                                          ↑ timestamp parameter
```

**If NOT seeing `?_t=` parameter:**
1. Clear widget.js from cache
2. Verify latest widget.js deployed
3. Hard refresh browser (Ctrl+Shift+R)

---

### **Fix 4: Widget.js Versioning (Optional)**

Add version parameter to embed code:

**Current:**
```html
<script src="https://yourdomain.com/widget.js" data-consently-id="cnsty_abc123"></script>
```

**Updated (recommended):**
```html
<script src="https://yourdomain.com/widget.js?v=3.2.0" data-consently-id="cnsty_abc123"></script>
```

**Benefits:**
- ✅ Forces widget.js refresh when version changes
- ✅ Can roll back by changing version
- ✅ Clear cache control

**Update process:**
1. Change version in embed code: `?v=3.2.0` → `?v=3.2.1`
2. Users automatically get new version on next page load

---

## 📊 Monitoring & Validation

### **Health Check Commands**

```bash
# 1. Test API freshness
curl "https://yourdomain.com/api/cookies/widget-public/WIDGET_ID?_t=$(date +%s)" | jq

# 2. Check cache headers
curl -I "https://yourdomain.com/api/cookies/widget-public/WIDGET_ID" | grep -i cache

# 3. Verify timestamp header
curl -I "https://yourdomain.com/api/cookies/widget-public/WIDGET_ID" | grep X-Config-Timestamp

# 4. Test from different locations (bypass CDN)
curl "https://yourdomain.com/api/cookies/widget-public/WIDGET_ID" \
  -H "Cache-Control: no-cache" \
  --resolve yourdomain.com:443:YOUR_ORIGIN_IP

# 5. Monitor API response time
time curl -s "https://yourdomain.com/api/cookies/widget-public/WIDGET_ID" > /dev/null
```

---

### **Success Criteria Checklist**

After implementing fixes, verify:

- [ ] **API Cache:** Returns fresh data within 60 seconds of save
- [ ] **Browser Cache:** Hard refresh shows latest settings
- [ ] **CDN Cache:** Purge clears cached responses immediately
- [ ] **Widget Loads:** No console errors on live website
- [ ] **Theme Matches:** Colors, fonts, logo match dashboard preview
- [ ] **Languages Work:** Language dropdown shows all selected languages
- [ ] **Behavior Correct:** Auto-show timing, delay, consent mode work
- [ ] **Preview Accurate:** Dashboard preview matches live widget 100%

---

## 🚨 Common Issues & Solutions

### **Issue 1: "Changes appear after 5-15 minutes"**

**Cause:** Old cache headers (5 min API cache + 10 min stale)  
**Solution:**
1. Deploy latest code with 1-min cache
2. Purge CDN cache
3. Hard refresh browser
4. Test with `?_t=` cache-buster

---

### **Issue 2: "Widget shows default blue theme, not my custom colors"**

**Cause:** Widget config not saved OR banner not linked  
**Solution:**
1. Check database: `SELECT * FROM widget_configs WHERE widget_id='...'`
2. Verify `theme` column contains your colors
3. Check `banner_template_id` is not null
4. Save widget config again in dashboard

---

### **Issue 3: "Logo doesn't appear on live widget"**

**Cause:** Logo URL not merged OR theme not synced  
**Solution:**
1. Check API response includes `theme.logoUrl`
2. Verify image URL is accessible (test in browser)
3. Check console for image loading errors
4. Ensure CORS allows loading image from your domain

---

### **Issue 4: "Supported languages missing in live widget"**

**Cause:** Languages not saved OR API not returning them  
**Solution:**
1. Check database: `SELECT supported_languages FROM widget_configs`
2. Should be array like: `['en', 'hi', 'ta']`
3. Verify API response includes `supportedLanguages`
4. Clear cache and test

---

### **Issue 5: "Preview works but live widget never updates"**

**Cause:** Different widget ID OR old embed code  
**Solution:**
1. Verify widget ID in embed code matches dashboard
2. Check console logs: `[Consently] Widget ID: cnsty_...`
3. Ensure embed code loads from correct domain
4. Test API with exact widget ID from embed code

---

## 📋 Pre-Deployment Checklist

Before deploying widget to production:

### **Code Verification**
- [ ] API cache reduced to 60 seconds (`s-maxage=60`)
- [ ] widget.js includes cache-buster (`?_t=${Date.now()}`)
- [ ] widget.js uses `cache: 'no-store'`
- [ ] X-Config-Timestamp header present

### **Database Verification**
- [ ] Widget config saved with all settings
- [ ] Banner template linked (`banner_template_id` not null)
- [ ] Theme colors populated
- [ ] Supported languages array non-empty

### **API Testing**
- [ ] API returns latest data immediately after save
- [ ] Cache headers correct (60 sec, not 300 sec)
- [ ] CORS headers allow cross-origin requests
- [ ] No 404/500 errors

### **Integration Testing**
- [ ] Embed code has correct widget ID
- [ ] Script loads without errors
- [ ] Banner appears on test page
- [ ] Settings match dashboard exactly

### **Cache Testing**
- [ ] Hard refresh shows latest settings
- [ ] Different browser shows latest settings
- [ ] Incognito mode shows latest settings
- [ ] Mobile device shows latest settings

---

## 🔄 Rollback Procedure

If changes cause issues:

1. **Revert API Cache Duration:**
   ```typescript
   // Change back to 5 minutes if 1 minute causes load issues
   response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
   ```

2. **Revert widget.js Cache-Busting:**
   ```javascript
   // Remove timestamp if causing API overload
   const apiUrl = `${apiBase}/api/cookies/widget-public/${widgetId}`;
   // (no ?_t= parameter)
   ```

3. **Monitor:**
   - Server load / API response times
   - Error rates
   - User complaints

---

## 📞 Support Escalation

If issues persist after following this checklist:

1. **Gather diagnostics:**
   ```bash
   # Run these commands and save output
   curl -v "https://yourdomain.com/api/cookies/widget-public/WIDGET_ID?_t=$(date +%s)" > api_response.txt
   curl -I "https://yourdomain.com/widget.js" > widget_headers.txt
   ```

2. **Check browser console:**
   - Open DevTools (F12)
   - Console tab: look for `[Consently]` logs
   - Network tab: check API calls and responses
   - Take screenshots of errors

3. **Database query:**
   ```sql
   SELECT 
     widget_id, 
     domain, 
     theme, 
     supported_languages, 
     banner_template_id,
     updated_at
   FROM widget_configs 
   WHERE widget_id = 'YOUR_WIDGET_ID';
   ```

4. **Contact support with:**
   - Widget ID
   - Domain where widget is integrated
   - Diagnostic files (api_response.txt, widget_headers.txt)
   - Console errors/screenshots
   - Database query result

---

## 📈 Performance Notes

**Cache Duration Trade-offs:**

| Duration | Propagation Time | API Load | User Experience |
|----------|-----------------|----------|-----------------|
| No cache | Instant | High ⚠️ | Best ✅ |
| 1 minute | 1-2 minutes | Medium | Good ✅ |
| 5 minutes | 5-15 minutes | Low | Poor ❌ |

**Recommendation:** 1-minute cache (current implementation)

**Expected Load:**
- ~1 API call per unique visitor per minute
- Subsequent page views use cached data
- Minimal server impact for most sites

**High-Traffic Sites (>10K visitors/hour):**
- Consider 2-3 minute cache
- Implement CDN caching
- Monitor API rate limits
