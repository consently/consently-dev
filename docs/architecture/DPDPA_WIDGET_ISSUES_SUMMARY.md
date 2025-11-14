# DPDPA Widget Architecture - Critical Issues Summary

**Quick Reference Guide** - See `DPDPA_WIDGET_ARCHITECTURE_REVIEW.md` for full details

---

## 🔴 Critical Issues (Fix Immediately)

### 1. Dual Purpose Structure
**Problem:** Legacy `purpose` field and new `purposes` structure coexist, causing data inconsistency.

**Impact:** Widget may show incomplete or incorrect purpose information.

**Fix:** Remove legacy fields, migrate all data to new structure.

**Files:**
- `app/api/dpdpa/widget-public/[widgetId]/route.ts`
- `app/api/dpdpa/activities/route.ts`
- `public/dpdpa-widget.js`

---

### 2. Multiple Preference Storage Locations
**Problem:** Preferences stored in 3 places: `dpdpa_consent_records`, `visitor_consent_preferences`, and `localStorage`.

**Impact:** Data sync failures, inconsistent preference center data, performance issues.

**Fix:** Use single source of truth with database triggers for sync.

**Files:**
- `app/api/dpdpa/consent-record/route.ts` (lines 746-852)
- `app/api/privacy-centre/preferences/route.ts`

---

### 3. Consent Sync Logic Issues
**Problem:** Consent recording syncs to multiple tables without transaction/rollback.

**Impact:** Partial writes can occur, leaving data inconsistent.

**Fix:** Use database transactions or triggers to ensure atomicity.

**Files:**
- `app/api/dpdpa/consent-record/route.ts` (lines 589-852)

---

## 🟡 High Priority Issues

### 4. Complex Display Rule Filtering
**Problem:** Multi-level filtering (activities → purposes) creates edge cases and empty states.

**Impact:** Widget may not show when it should, or show incorrectly filtered data.

**Fix:** Simplify filtering logic, add validation, improve empty state handling.

**Files:**
- `public/dpdpa-widget.js` (lines 972-1123)
- `app/api/dpdpa/widget-public/[widgetId]/route.ts` (lines 477-542)

---

### 5. N+1 Query Problem
**Problem:** Widget config API makes sequential queries (activities → purposes → categories).

**Impact:** Slow widget loading, high database load.

**Fix:** Use Supabase joins or database views.

**Files:**
- `app/api/dpdpa/widget-public/[widgetId]/route.ts` (lines 100-198)

---

### 6. Client-Side Validation Only
**Problem:** Some validation (UUIDs, activity limits) happens only client-side.

**Impact:** Security risk - malicious clients can bypass validation.

**Fix:** Add comprehensive server-side validation.

**Files:**
- `public/dpdpa-widget.js` (lines 1162-1355)
- `app/api/dpdpa/consent-record/route.ts`

---

## 🟢 Medium Priority Issues

### 7. URL Normalization Inconsistencies
**Problem:** Client and server normalize URLs differently.

**Impact:** Duplicate consent records, failed consent checks.

**Fix:** Use shared normalization utility.

**Files:**
- `public/dpdpa-widget.js`
- `app/api/dpdpa/consent-record/route.ts` (lines 343-359)

---

### 8. Translation Caching
**Problem:** Translations cached only in memory, lost on page reload.

**Impact:** Repeated API calls, slower widget loading.

**Fix:** Add server-side caching and localStorage persistence.

**Files:**
- `public/dpdpa-widget.js` (lines 60-197)

---

## Key Metrics

- **Total Issues Identified:** 8 critical/high priority
- **Files Affected:** ~10 files
- **Lines of Code Impacted:** ~2000+ lines
- **Estimated Refactoring Effort:** 2-3 sprints

---

## Quick Wins (Can Fix Today)

1. ✅ Add server-side UUID validation
2. ✅ Use Supabase joins for widget config query
3. ✅ Add localStorage persistence for translation cache
4. ✅ Standardize URL normalization utility

---

## Architecture Decisions Needed

1. **Preference Storage:** Single table vs. multiple tables with triggers?
2. **Purpose Structure:** Complete migration timeline?
3. **Display Rules:** Simplify filtering or improve validation?
4. **Consent ID:** Server-side generation vs. client-side?

---

## Testing Gaps

- ❌ No unit tests for purpose filtering
- ❌ No integration tests for consent sync
- ❌ No E2E tests for display rules
- ❌ No tests for URL normalization edge cases

---

**See full review:** `DPDPA_WIDGET_ARCHITECTURE_REVIEW.md`

