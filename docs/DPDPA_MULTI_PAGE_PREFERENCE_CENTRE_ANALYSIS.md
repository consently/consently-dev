# DPDPA Widget Multi-Page Preference Centre Analysis

## User Scenario

**Question:** If a user creates and integrates two widgets for different pages or purposes with the **same widget ID**, how can they see all their pages along with preferences history for DPDPA consent?

## Current Implementation Analysis

### ✅ **What Currently Works**

1. **Consent Tracking by Widget ID**
   - All consents are stored with `widget_id` and `visitor_id`
   - Same widget ID = same consent state across all pages
   - Privacy Centre accessible at `/privacy-centre/{widgetId}?visitorId={visitorId}`

2. **Preference History**
   - Consent history is tracked in `consent_history` table
   - Shows activity-level consent changes over time
   - Can be exported as CSV/PDF

3. **Referrer Tracking**
   - `referrer` field is stored in `dpdpa_consent_records` table
   - Tracks the page that referred to the current page

### ❌ **Current Limitations**

#### Issue 1: No Current Page URL Tracking
- **Problem:** The system only tracks `referrer` (previous page), not the actual page URL where consent was given
- **Impact:** Cannot see which specific pages the user visited
- **Current Code:**
  ```javascript
  // public/dpdpa-widget.js line 1307
  referrer: document.referrer || null  // Only tracks previous page
  ```
- **Missing:** `current_url` or `page_url` field

#### Issue 2: Privacy Centre Shows Only One Widget
- **Problem:** Privacy Centre is widget-specific (`/privacy-centre/{widgetId}`)
- **Impact:** If user has same widget ID on multiple pages, they see combined data but no page breakdown
- **Current Implementation:**
  ```typescript
  // app/privacy-centre/[widgetId]/page.tsx
  // Only shows data for one widgetId
  ```

#### Issue 3: No "All Pages" View
- **Problem:** No way to see a list of all pages where the widget was used
- **Impact:** Users cannot see:
  - Which pages they gave consent on
  - When they visited each page
  - Consent status per page

#### Issue 4: Consent History Doesn't Show Page Context
- **Problem:** Consent history shows activity changes but not which page they were on
- **Current History Fields:**
  - Activity name
  - Status change (previous → new)
  - Timestamp
  - Device type
  - **Missing:** Page URL

## Database Schema Analysis

### Current `dpdpa_consent_records` Table Fields:
```sql
- widget_id
- visitor_id
- consent_status
- accepted_activities
- rejected_activities
- referrer          -- ✅ Exists (previous page)
- consent_timestamp
- expires_at
- user_agent
- device_type
- browser
- os
- country
- language
```

### Missing Fields:
```sql
- current_url       -- ❌ Missing (page where consent was given)
- page_title        -- ❌ Missing (optional, for better UX)
```

## Recommended Solutions

### Solution 1: Add Current Page URL Tracking (High Priority)

**1.1 Update Widget to Send Current URL:**
```javascript
// In public/dpdpa-widget.js, update recordConsent call:
metadata: {
  language: navigator.language || 'en',
  referrer: document.referrer || null,
  currentUrl: window.location.href,        // ✅ ADD THIS
  pageTitle: document.title                // ✅ ADD THIS (optional)
}
```

**1.2 Update Database Schema:**
```sql
ALTER TABLE dpdpa_consent_records 
ADD COLUMN current_url TEXT,
ADD COLUMN page_title VARCHAR(500);

CREATE INDEX idx_consent_records_current_url 
ON dpdpa_consent_records(widget_id, current_url);
```

**1.3 Update Consent Record API:**
```typescript
// app/api/dpdpa/consent-record/route.ts
const currentUrl = body.metadata?.currentUrl || null;
const pageTitle = body.metadata?.pageTitle || null;

// Add to insert/update:
current_url: currentUrl,
page_title: pageTitle,
```

### Solution 2: Enhanced Privacy Centre with Page List

**2.1 Create New API Endpoint:**
```typescript
// app/api/privacy-centre/pages/route.ts
GET /api/privacy-centre/pages?widgetId={widgetId}&visitorId={visitorId}

// Returns:
{
  pages: [
    {
      url: "https://example.com/contact",
      title: "Contact Us",
      firstVisit: "2024-01-15T10:00:00Z",
      lastVisit: "2024-01-20T15:30:00Z",
      consentGiven: true,
      consentTimestamp: "2024-01-15T10:05:00Z",
      activitiesCount: 3
    },
    {
      url: "https://example.com/careers",
      title: "Careers",
      firstVisit: "2024-01-18T14:00:00Z",
      lastVisit: "2024-01-18T14:00:00Z",
      consentGiven: true,
      consentTimestamp: "2024-01-18T14:02:00Z",
      activitiesCount: 3
    }
  ],
  totalPages: 2,
  totalConsents: 2
}
```

**2.2 Update Privacy Centre UI:**
```tsx
// Add new "Pages" tab or section
<Tabs>
  <TabsTrigger value="preferences">Preferences</TabsTrigger>
  <TabsTrigger value="history">History</TabsTrigger>
  <TabsTrigger value="pages">Pages</TabsTrigger>  {/* ✅ NEW */}
</Tabs>

<TabsContent value="pages">
  <PagesList widgetId={widgetId} visitorId={visitorId} />
</TabsContent>
```

### Solution 3: Enhanced Consent History with Page Context

**3.1 Update Consent History Query:**
```sql
SELECT 
  ch.*,
  cr.current_url,
  cr.page_title,
  cr.consent_timestamp
FROM consent_history ch
JOIN dpdpa_consent_records cr ON ch.consent_record_id = cr.id
WHERE ch.visitor_id = $1 AND ch.widget_id = $2
ORDER BY ch.changed_at DESC;
```

**3.2 Update History Display:**
```tsx
// Show page URL in history table
<TableRow>
  <TableCell>{record.activityName}</TableCell>
  <TableCell>{record.previousStatus} → {record.newStatus}</TableCell>
  <TableCell>
    <a href={record.currentUrl} target="_blank">
      {record.pageTitle || new URL(record.currentUrl).pathname}
    </a>
  </TableCell>
  <TableCell>{new Date(record.changedAt).toLocaleString()}</TableCell>
</TableRow>
```

### Solution 4: Dashboard View for All Pages (Admin)

**4.1 Create Dashboard Endpoint:**
```typescript
// app/api/dpdpa/widget-pages/[widgetId]/route.ts
GET /api/dpdpa/widget-pages/{widgetId}

// Returns aggregated page statistics:
{
  pages: [
    {
      url: "https://example.com/contact",
      visitCount: 150,
      consentCount: 120,
      uniqueVisitors: 95,
      averageConsentTime: "2.5s",
      lastSeen: "2024-01-20T15:30:00Z"
    }
  ]
}
```

**4.2 Add to Dashboard:**
```tsx
// app/dashboard/dpdpa/analytics/page.tsx
// Add "Pages" section showing all pages where widget is used
```

## Implementation Priority

### Phase 1: Quick Wins (1-2 hours)
1. ✅ Add `current_url` tracking to widget
2. ✅ Update consent record API to store current URL
3. ✅ Add database column for `current_url`

### Phase 2: Enhanced Privacy Centre (2-3 hours)
1. ✅ Create pages list API endpoint
2. ✅ Add "Pages" tab to Privacy Centre
3. ✅ Show page list with consent status

### Phase 3: Enhanced History (1-2 hours)
1. ✅ Update consent history to include page URL
2. ✅ Update history display to show page context
3. ✅ Add page filtering to history

### Phase 4: Dashboard Enhancement (1-2 hours)
1. ✅ Create widget pages analytics endpoint
2. ✅ Add pages section to dashboard
3. ✅ Show page-level statistics

## Current Workaround

**For Users Right Now:**
- Privacy Centre shows all consent history for the widget
- History shows when consents were given (timestamp)
- Can export history as CSV/PDF
- **Limitation:** Cannot see which specific pages they visited

**For Admins:**
- Dashboard shows consent records
- Can see referrer information
- **Limitation:** Cannot see current page URLs or page list

## Database Migration Required

```sql
-- Migration: Add page tracking to consent records
ALTER TABLE dpdpa_consent_records 
ADD COLUMN IF NOT EXISTS current_url TEXT,
ADD COLUMN IF NOT EXISTS page_title VARCHAR(500);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_consent_records_current_url 
ON dpdpa_consent_records(widget_id, current_url);

-- Add index for visitor page queries
CREATE INDEX IF NOT EXISTS idx_consent_records_visitor_url 
ON dpdpa_consent_records(visitor_id, widget_id, current_url);
```

## Conclusion

**Current Status:** ⚠️ **Partially Works**

- ✅ Consent tracking works across pages with same widget ID
- ✅ Preference history is tracked
- ✅ Privacy Centre shows consent preferences
- ❌ Cannot see which specific pages were visited
- ❌ No "all pages" list view
- ❌ History doesn't show page context

**Recommendation:** Implement Solution 1 (current URL tracking) as highest priority, then add Solutions 2-3 for enhanced user experience.

