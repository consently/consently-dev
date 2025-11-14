# Multi-Tenant Display Rules System - Feasibility Analysis

## Executive Summary

**Status**: ✅ **Highly Feasible** - Your platform already has ~70% of the required infrastructure. The remaining 30% can be implemented incrementally.

**Timeline Estimate**: 2-3 weeks for full implementation

---

## ✅ What You Already Have (Current Implementation)

### 1. Multi-Tenant Architecture ✅
- **Widget-based multi-tenancy**: Each customer has unique `widget_id`
- **User isolation**: `user_id` in all tables with RLS policies
- **Domain management**: `domain` field in `dpdpa_widget_configs` table
- **Public API endpoints**: `/api/dpdpa/widget-public/[widgetId]` for SDK config fetching

**Current Flow:**
```
Customer embeds: <script src="...dpdpa-widget.js" data-dpdpa-widget-id="abc123">
↓
SDK fetches: GET /api/dpdpa/widget-public/abc123
↓
Returns: Widget config + activities + theme
```

### 2. SDK Infrastructure ✅
- **Dynamic config loading**: Widget fetches config at runtime
- **Visitor tracking**: `visitor_id` generation and persistence
- **Consent storage**: LocalStorage + API recording
- **Multi-language support**: Translation system in place

### 3. Processing Activities System ✅
- **Activity management**: `processing_activities` table
- **Activity selection**: `selected_activities` array in widget config
- **Purpose-based structure**: Activities linked to purposes and data categories

### 4. Consent Notice System ✅
- **Notice templates**: Privacy notice HTML in widget config
- **Notice versioning**: `privacy_notice_version` field
- **Re-consent triggers**: `requires_reconsent` flag

### 5. Database Foundation ✅
- **Multi-tenant tables**: All tables have `user_id` and `widget_id`
- **RLS policies**: Row-level security for data isolation
- **Indexes**: Performance-optimized queries
- **Audit trails**: `created_at`, `updated_at` timestamps

---

## ❌ What's Missing (Required for Full Implementation)

### 1. Display Rules Table ❌
**Current State**: No table for URL/trigger-based rules

**Required:**
```sql
CREATE TABLE display_rules (
  id UUID PRIMARY KEY,
  widget_id VARCHAR(100) NOT NULL,
  user_id UUID NOT NULL,
  
  -- Rule identification
  rule_name VARCHAR(255),
  notice_id UUID, -- Links to consent_notices table
  
  -- URL matching
  url_match_type VARCHAR(20), -- 'contains', 'exact', 'regex', 'startsWith'
  url_pattern VARCHAR(500),
  
  -- Element targeting
  element_selector VARCHAR(500), -- CSS selector like '#jobApplyForm'
  
  -- Trigger configuration
  trigger_type VARCHAR(50), -- 'onPageLoad', 'onClick', 'onFormSubmit', 'onScroll'
  trigger_delay INTEGER DEFAULT 0,
  
  -- Frequency control
  show_frequency VARCHAR(20) DEFAULT 'every_visit', -- 'every_visit', 'once', 'until_withdrawn'
  
  -- Targeting
  device_targeting TEXT[], -- ['desktop', 'mobile'] or null for all
  geo_targeting JSONB, -- { country: 'IN', region: 'MH' }
  
  -- Priority (for multiple matching rules)
  priority INTEGER DEFAULT 100,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### 2. Consent Notices Table ❌
**Current State**: Notice HTML is stored in `dpdpa_widget_configs.privacy_notice_html`

**Required:** Separate table for multiple notices per widget
```sql
CREATE TABLE consent_notices (
  id UUID PRIMARY KEY,
  widget_id VARCHAR(100) NOT NULL,
  user_id UUID NOT NULL,
  
  notice_name VARCHAR(255),
  notice_type VARCHAR(50), -- 'privacy', 'cookie', 'data_processing', 'marketing'
  
  -- Content
  title VARCHAR(500),
  description TEXT,
  html_content TEXT,
  
  -- Linked activities
  linked_activities UUID[], -- Which processing activities this notice covers
  
  -- Versioning
  version VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### 3. URL Pattern Matching in SDK ❌
**Current State**: Widget shows on all pages (or based on `auto_show` flag)

**Required:** SDK logic to:
- Check current URL against rules
- Match URL patterns (contains, exact, regex, startsWith)
- Check element selectors
- Trigger appropriate notice based on rules

### 4. Trigger System in SDK ❌
**Current State**: Only `onPageLoad` with delay

**Required:** Support for:
- `onClick` - Show notice when element is clicked
- `onFormSubmit` - Show notice before form submission
- `onScroll` - Show notice after scrolling X%
- `onElementVisible` - Show when element enters viewport

### 5. Dashboard UI for Rule Configuration ❌
**Current State**: Widget config page doesn't have rule builder

**Required:** UI components for:
- Rule creation form
- URL pattern input with match type selector
- Element selector picker
- Trigger type selector
- Notice selector (dropdown of available notices)
- Rule priority management
- Rule testing/preview

---

## 🎯 Implementation Roadmap

### Phase 1: Database Schema (Week 1)
**Priority: HIGH**

1. Create `consent_notices` table
2. Create `display_rules` table
3. Add foreign keys and indexes
4. Migrate existing notice HTML to `consent_notices` table
5. Create RLS policies

**Estimated Effort**: 2-3 days

### Phase 2: Backend API (Week 1-2)
**Priority: HIGH**

1. Create `/api/dpdpa/notices` endpoints (CRUD)
2. Create `/api/dpdpa/display-rules` endpoints (CRUD)
3. Update `/api/dpdpa/widget-public/[widgetId]` to include rules
4. Add rule matching logic (URL pattern matching)

**Estimated Effort**: 3-4 days

### Phase 3: SDK Enhancement (Week 2)
**Priority: HIGH**

1. Add URL pattern matching function
2. Add element selector detection
3. Implement trigger types:
   - `onPageLoad` ✅ (already exists)
   - `onClick` (new)
   - `onFormSubmit` (new)
   - `onScroll` (new)
4. Add rule evaluation on page load
5. Add rule evaluation on navigation (SPA support)

**Estimated Effort**: 4-5 days

### Phase 4: Dashboard UI (Week 2-3)
**Priority: MEDIUM**

1. Create "Consent Notices" page
2. Create "Display Rules" page
3. Add rule builder form:
   - URL pattern input
   - Match type selector
   - Element selector picker
   - Trigger type selector
   - Notice selector
4. Add rule testing/preview
5. Add rule priority management

**Estimated Effort**: 5-6 days

### Phase 5: Advanced Features (Week 3+)
**Priority: LOW** (Can be added later)

1. Geo-targeting
2. Device targeting
3. A/B testing
4. Analytics for rule performance
5. Regex URL matching

**Estimated Effort**: 3-4 days

---

## 📊 Comparison: Current vs. Proposed

| Feature | Current | Proposed | Gap |
|---------|---------|----------|-----|
| **Multi-tenant** | ✅ Widget-based | ✅ Widget-based | None |
| **Config API** | ✅ `/api/dpdpa/widget-public/[widgetId]` | ✅ Same | None |
| **SDK loading** | ✅ Dynamic fetch | ✅ Same | None |
| **Processing Activities** | ✅ Full system | ✅ Same | None |
| **Consent Notices** | ⚠️ Single notice per widget | ✅ Multiple notices | **Medium** |
| **Display Rules** | ❌ None | ✅ Full rules engine | **High** |
| **URL Matching** | ❌ None | ✅ Pattern matching | **High** |
| **Element Triggers** | ❌ None | ✅ Selector-based | **High** |
| **Trigger Types** | ⚠️ Only onPageLoad | ✅ Multiple types | **Medium** |
| **Dashboard UI** | ⚠️ Basic config | ✅ Rule builder | **Medium** |

---

## 🔧 Technical Implementation Details

### 1. SDK Rule Evaluation Flow

```javascript
// In dpdpa-widget.js

async function evaluateDisplayRules() {
  const currentUrl = window.location.pathname;
  const currentHost = window.location.hostname;
  
  // Get rules from config (fetched from API)
  const rules = config.display_rules || [];
  
  // Filter active rules
  const activeRules = rules.filter(r => r.is_active);
  
  // Evaluate each rule
  for (const rule of activeRules) {
    // Check URL match
    if (matchesUrlPattern(currentUrl, rule)) {
      // Check element selector (if provided)
      if (!rule.element_selector || elementExists(rule.element_selector)) {
        // Check trigger type
        if (rule.trigger_type === 'onPageLoad') {
          await showNotice(rule.notice_id);
          return; // Show first matching rule
        } else if (rule.trigger_type === 'onClick') {
          setupClickTrigger(rule);
        } else if (rule.trigger_type === 'onFormSubmit') {
          setupFormSubmitTrigger(rule);
        }
      }
    }
  }
}

function matchesUrlPattern(url, rule) {
  switch (rule.url_match_type) {
    case 'exact':
      return url === rule.url_pattern;
    case 'contains':
      return url.includes(rule.url_pattern);
    case 'startsWith':
      return url.startsWith(rule.url_pattern);
    case 'regex':
      return new RegExp(rule.url_pattern).test(url);
    default:
      return false;
  }
}
```

### 2. API Response Structure

**Current:**
```json
{
  "widget_id": "dpdpa_abc123",
  "name": "My Widget",
  "activities": [...],
  "theme": {...}
}
```

**Proposed:**
```json
{
  "widget_id": "dpdpa_abc123",
  "name": "My Widget",
  "activities": [...],
  "theme": {...},
  "display_rules": [
    {
      "id": "rule_1",
      "rule_name": "Careers Form",
      "url_pattern": "/careers",
      "url_match_type": "contains",
      "trigger_type": "onPageLoad",
      "notice_id": "notice_career_1",
      "priority": 100
    },
    {
      "id": "rule_2",
      "rule_name": "Contact Form",
      "url_pattern": "/contact",
      "url_match_type": "contains",
      "element_selector": "#salesForm",
      "trigger_type": "onFormSubmit",
      "notice_id": "notice_sales_1",
      "priority": 90
    }
  ],
  "notices": {
    "notice_career_1": {
      "title": "Career Application Consent",
      "description": "...",
      "linked_activities": ["activity_1", "activity_2"]
    },
    "notice_sales_1": {
      "title": "Sales Enquiry Consent",
      "description": "...",
      "linked_activities": ["activity_3"]
    }
  }
}
```

### 3. Database Migration Example

```sql
-- Step 1: Create consent_notices table
CREATE TABLE consent_notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_id VARCHAR(100) NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  notice_name VARCHAR(255) NOT NULL,
  notice_type VARCHAR(50) DEFAULT 'data_processing',
  title VARCHAR(500),
  description TEXT,
  html_content TEXT,
  
  linked_activities UUID[] DEFAULT ARRAY[]::UUID[],
  
  version VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  
  CONSTRAINT fk_notice_widget FOREIGN KEY (widget_id) 
    REFERENCES dpdpa_widget_configs(widget_id) ON DELETE CASCADE
);

-- Step 2: Create display_rules table
CREATE TABLE display_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_id VARCHAR(100) NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  rule_name VARCHAR(255) NOT NULL,
  notice_id UUID NOT NULL REFERENCES consent_notices(id) ON DELETE CASCADE,
  
  url_match_type VARCHAR(20) DEFAULT 'contains' 
    CHECK (url_match_type IN ('exact', 'contains', 'startsWith', 'regex')),
  url_pattern VARCHAR(500),
  
  element_selector VARCHAR(500),
  
  trigger_type VARCHAR(50) DEFAULT 'onPageLoad'
    CHECK (trigger_type IN ('onPageLoad', 'onClick', 'onFormSubmit', 'onScroll', 'onElementVisible')),
  trigger_delay INTEGER DEFAULT 0 CHECK (trigger_delay >= 0),
  
  show_frequency VARCHAR(20) DEFAULT 'every_visit'
    CHECK (show_frequency IN ('every_visit', 'once', 'until_withdrawn')),
  
  device_targeting TEXT[],
  geo_targeting JSONB,
  
  priority INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  
  CONSTRAINT fk_rule_widget FOREIGN KEY (widget_id) 
    REFERENCES dpdpa_widget_configs(widget_id) ON DELETE CASCADE
);

-- Step 3: Migrate existing notice HTML
INSERT INTO consent_notices (widget_id, user_id, notice_name, html_content, linked_activities, is_active)
SELECT 
  widget_id,
  user_id,
  name || ' - Default Notice' as notice_name,
  privacy_notice_html as html_content,
  selected_activities as linked_activities,
  is_active
FROM dpdpa_widget_configs
WHERE privacy_notice_html IS NOT NULL;

-- Step 4: Create default display rule for each widget
INSERT INTO display_rules (widget_id, user_id, rule_name, notice_id, url_pattern, url_match_type, trigger_type)
SELECT 
  wc.widget_id,
  wc.user_id,
  'Default Rule' as rule_name,
  cn.id as notice_id,
  '/' as url_pattern,
  'startsWith' as url_match_type,
  'onPageLoad' as trigger_type
FROM dpdpa_widget_configs wc
JOIN consent_notices cn ON cn.widget_id = wc.widget_id
WHERE wc.is_active = true;
```

---

## 🎨 Dashboard UI Mockup (Conceptual)

### Display Rules Page Structure

```
┌─────────────────────────────────────────────────────────┐
│ Display Rules                                    [+ New Rule] │
├─────────────────────────────────────────────────────────┤
│                                                           │
│ Rule Name: Careers Form                          [Active] │
│ URL Pattern: /careers                                    │
│ Match Type: Contains                                     │
│ Trigger: On Page Load                                    │
│ Notice: Career Application Consent                        │
│ Priority: 100                                            │
│ [Edit] [Test] [Delete]                                   │
│                                                           │
│ ─────────────────────────────────────────────────────── │
│                                                           │
│ Rule Name: Contact Form                          [Active] │
│ URL Pattern: /contact                                    │
│ Match Type: Contains                                     │
│ Element: #salesForm                                       │
│ Trigger: On Form Submit                                  │
│ Notice: Sales Enquiry Consent                            │
│ Priority: 90                                             │
│ [Edit] [Test] [Delete]                                   │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Rule Builder Form

```
┌─────────────────────────────────────────────────────────┐
│ Create Display Rule                                      │
├─────────────────────────────────────────────────────────┤
│                                                           │
│ Rule Name: [________________________]                    │
│                                                           │
│ URL Configuration:                                        │
│   Pattern: [________________________]                    │
│   Match Type: [Contains ▼]                               │
│     • Contains                                           │
│     • Exact                                              │
│     • Starts With                                        │
│     • Regex                                              │
│                                                           │
│ Trigger Configuration:                                    │
│   Type: [On Page Load ▼]                                 │
│     • On Page Load                                        │
│     • On Click                                           │
│     • On Form Submit                                     │
│     • On Scroll                                          │
│                                                           │
│   Element Selector (optional):                           │
│   [#jobApplyForm]                                        │
│                                                           │
│   Delay (ms): [1000]                                     │
│                                                           │
│ Notice Selection:                                        │
│   [Select Notice ▼]                                      │
│     • Career Application Consent                          │
│     • Sales Enquiry Consent                              │
│     • Marketing Consent                                  │
│                                                           │
│ Frequency: [Every Visit ▼]                               │
│ Priority: [100]                                           │
│                                                           │
│ [Cancel] [Save Rule]                                     │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start: Minimal Viable Implementation

If you want to test the concept quickly, here's a minimal implementation:

### Step 1: Add Rules to Existing Widget Config (No DB Changes)

Modify `dpdpa_widget_configs` table to add JSONB field:
```sql
ALTER TABLE dpdpa_widget_configs 
ADD COLUMN display_rules JSONB DEFAULT '[]'::jsonb;
```

### Step 2: Update API to Return Rules

In `/api/dpdpa/widget-public/[widgetId]/route.ts`:
```typescript
const { data: widgetConfig } = await supabase
  .from('dpdpa_widget_configs')
  .select('*, display_rules')
  .eq('widget_id', widgetId)
  .single();

return NextResponse.json({
  ...widgetConfig,
  display_rules: widgetConfig.display_rules || []
});
```

### Step 3: Add Basic URL Matching in SDK

In `dpdpa-widget.js`, add after `fetchWidgetConfig()`:
```javascript
function checkDisplayRules() {
  const rules = config.display_rules || [];
  const currentPath = window.location.pathname;
  
  for (const rule of rules) {
    if (rule.url_pattern && currentPath.includes(rule.url_pattern)) {
      if (rule.trigger_type === 'onPageLoad') {
        showConsentWidget();
        return;
      }
    }
  }
  
  // Fallback to default behavior
  if (config.autoShow) {
    showConsentWidget();
  }
}
```

This gives you 80% of the functionality with minimal changes!

---

## 📈 Success Metrics

After implementation, you should be able to:

1. ✅ Create multiple consent notices per widget
2. ✅ Configure rules like "Show Career Notice on /careers page"
3. ✅ Configure rules like "Show Sales Notice when #salesForm is submitted"
4. ✅ Test rules in dashboard preview
5. ✅ See which rule triggered in consent records
6. ✅ Manage rule priority (which rule shows if multiple match)

---

## 🔐 Security Considerations

1. **URL Pattern Validation**: Sanitize regex patterns to prevent ReDoS attacks
2. **Element Selector Validation**: Validate CSS selectors to prevent XSS
3. **Rate Limiting**: Limit rule evaluation frequency
4. **RLS Policies**: Ensure rules are isolated per user/widget

---

## 📝 Conclusion

**Your platform is well-positioned** to implement this multi-tenant display rules system. The core infrastructure (multi-tenancy, SDK, API, database) is already in place. The missing pieces are:

1. **Display rules table** (2-3 days)
2. **SDK rule evaluation** (3-4 days)
3. **Dashboard UI** (5-6 days)

**Total estimated time**: 2-3 weeks for full implementation.

**Recommendation**: Start with the minimal viable implementation (Quick Start section) to validate the concept, then build out the full system incrementally.

---

## Next Steps

1. Review this analysis with your team
2. Decide on implementation approach (full vs. minimal)
3. Create database migration for `display_rules` table
4. Update SDK to evaluate rules
5. Build dashboard UI for rule management
6. Test with real customer scenarios

Would you like me to start implementing any specific part of this system?

