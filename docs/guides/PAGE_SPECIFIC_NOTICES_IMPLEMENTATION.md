# Page-Specific Notices Implementation Guide

## ✅ Feasibility Assessment

**Status**: **Highly Feasible** - Your system is ~70% ready for this feature!

**Current State:**
- ✅ Multi-tenant widget system in place
- ✅ Widget fetches config from `/api/dpdpa/widget-public/[widgetId]`
- ✅ SDK supports dynamic configuration
- ✅ Both careers and contact pages use the same widget ID: `dpdpa_mhnhpimc_atq70ak`
- ⚠️ Currently: Single notice per widget (stored in `privacy_notice_html`)

**What You Need:**
- Multiple notices per widget
- URL-based rules to show different notices on different pages
- SDK logic to evaluate rules and show appropriate notice

---

## 🚀 Quick Start: Minimal Implementation (Recommended First Step)

This approach adds page-specific notices with minimal changes - perfect for testing the concept!

### Step 1: Add Display Rules to Widget Config (No DB Changes)

Add a JSONB column to store rules directly in the widget config:

```sql
-- Migration: Add display_rules to widget config
ALTER TABLE dpdpa_widget_configs 
ADD COLUMN IF NOT EXISTS display_rules JSONB DEFAULT '[]'::jsonb;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_dpdpa_widget_configs_display_rules 
ON dpdpa_widget_configs USING GIN (display_rules);
```

### Step 2: Update Public API to Return Rules

Modify `/app/api/dpdpa/widget-public/[widgetId]/route.ts` to include display rules and multiple notices:

```typescript
// In the response object (around line 199), add:
const response = {
  // ... existing fields ...
  
  // NEW: Display rules and notices
  display_rules: widgetConfig.display_rules || [],
  notices: {
    // Default notice (from existing privacy_notice_html)
    default: {
      id: 'default',
      title: widgetConfig.title,
      message: widgetConfig.message,
      html: privacyNoticeHTML,
      activities: widgetConfig.selected_activities || []
    }
  }
};
```

### Step 3: Add URL Matching in SDK

Update `/public/dpdpa-widget.js` to evaluate rules and show appropriate notice:

```javascript
// Add after fetchWidgetConfig() function (around line 310)

// Check display rules and show appropriate notice
function evaluateDisplayRules() {
  const rules = config.display_rules || [];
  const currentPath = window.location.pathname;
  
  console.log('[Consently DPDPA] Evaluating display rules for path:', currentPath);
  console.log('[Consently DPDPA] Available rules:', rules.length);
  
  // Sort rules by priority (higher priority first)
  const sortedRules = [...rules].sort((a, b) => (b.priority || 100) - (a.priority || 100));
  
  // Find first matching rule
  for (const rule of sortedRules) {
    if (!rule.is_active) continue;
    
    // Check URL match
    if (matchesUrlPattern(currentPath, rule)) {
      console.log('[Consently DPDPA] Rule matched:', rule.rule_name);
      
      // Check element selector if provided
      if (rule.element_selector) {
        const element = document.querySelector(rule.element_selector);
        if (!element) {
          console.log('[Consently DPDPA] Element not found:', rule.element_selector);
          continue;
        }
      }
      
      // Handle trigger type
      if (rule.trigger_type === 'onPageLoad') {
        // Show notice immediately or after delay
        setTimeout(() => {
          showNoticeForRule(rule);
        }, rule.trigger_delay || 0);
        return; // Show first matching rule
      } else if (rule.trigger_type === 'onClick' && rule.element_selector) {
        setupClickTrigger(rule);
      } else if (rule.trigger_type === 'onFormSubmit' && rule.element_selector) {
        setupFormSubmitTrigger(rule);
      }
    }
  }
  
  // Fallback to default behavior if no rules match
  if (config.autoShow) {
    console.log('[Consently DPDPA] No rules matched, using default behavior');
    setTimeout(() => {
      showConsentWidget(); // Your existing function
    }, config.showAfterDelay || 1000);
  }
}

// URL pattern matching
function matchesUrlPattern(url, rule) {
  if (!rule.url_pattern) return true; // No pattern = match all
  
  const pattern = rule.url_pattern;
  const matchType = rule.url_match_type || 'contains';
  
  switch (matchType) {
    case 'exact':
      return url === pattern;
    case 'contains':
      return url.includes(pattern);
    case 'startsWith':
      return url.startsWith(pattern);
    case 'regex':
      try {
        return new RegExp(pattern).test(url);
      } catch (e) {
        console.error('[Consently DPDPA] Invalid regex pattern:', pattern);
        return false;
      }
    default:
      return url.includes(pattern);
  }
}

// Show notice for a specific rule
function showNoticeForRule(rule) {
  // Get notice content from config
  const notice = config.notices?.[rule.notice_id] || config.notices?.default;
  
  if (!notice) {
    console.error('[Consently DPDPA] Notice not found for rule:', rule.notice_id);
    return;
  }
  
  // Update config temporarily with rule-specific notice
  const originalTitle = config.title;
  const originalMessage = config.message;
  const originalHTML = config.privacyNoticeHTML;
  
  if (notice.title) config.title = notice.title;
  if (notice.message) config.message = notice.message;
  if (notice.html) config.privacyNoticeHTML = notice.html;
  
  // Show widget with updated content
  showConsentWidget();
  
  // Restore original config (optional, depends on your needs)
  // config.title = originalTitle;
  // config.message = originalMessage;
  // config.privacyNoticeHTML = originalHTML;
}

// Setup click trigger
function setupClickTrigger(rule) {
  const element = document.querySelector(rule.element_selector);
  if (!element) return;
  
  element.addEventListener('click', (e) => {
    e.preventDefault();
    showNoticeForRule(rule);
  }, { once: true });
}

// Setup form submit trigger
function setupFormSubmitTrigger(rule) {
  const form = document.querySelector(rule.element_selector);
  if (!form) return;
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    showNoticeForRule(rule);
    // After consent, submit form
    // You'll need to handle this based on your consent flow
  }, { once: true });
}

// Call evaluateDisplayRules() in your init function after fetchWidgetConfig()
```

### Step 4: Update Init Function

In `/public/dpdpa-widget.js`, update the init function to call rule evaluation:

```javascript
async function init() {
  // ... existing code ...
  
  await fetchWidgetConfig();
  
  // NEW: Evaluate display rules
  if (config.display_rules && config.display_rules.length > 0) {
    evaluateDisplayRules();
  } else {
    // Fallback to default behavior
    if (config.autoShow) {
      setTimeout(() => {
        showConsentWidget();
      }, config.showAfterDelay || 1000);
    }
  }
}
```

---

## 📝 Example: Setting Up Page-Specific Notices

### For Your Careers Page

1. **Create a rule in your database:**

```sql
UPDATE dpdpa_widget_configs
SET display_rules = jsonb_build_array(
  jsonb_build_object(
    'id', 'careers_rule_1',
    'rule_name', 'Careers Page Notice',
    'url_pattern', '/careers',
    'url_match_type', 'contains',
    'trigger_type', 'onPageLoad',
    'trigger_delay', 1000,
    'notice_id', 'careers_notice',
    'priority', 100,
    'is_active', true
  )
)
WHERE widget_id = 'dpdpa_mhnhpimc_atq70ak';
```

2. **Add notice content to API response** (you'll need to modify the API to support multiple notices):

For now, you can store notices in the `display_rules` itself:

```sql
UPDATE dpdpa_widget_configs
SET display_rules = jsonb_build_array(
  jsonb_build_object(
    'id', 'careers_rule_1',
    'rule_name', 'Careers Page Notice',
    'url_pattern', '/careers',
    'url_match_type', 'contains',
    'trigger_type', 'onPageLoad',
    'trigger_delay', 1000,
    'notice_id', 'careers_notice',
    'priority', 100,
    'is_active', true,
    'notice_content', jsonb_build_object(
      'title', 'Career Application Consent',
      'message', 'We need your consent to process your job application data under DPDPA 2023.',
      'html', '<p>Career-specific privacy notice content...</p>'
    )
  ),
  jsonb_build_object(
    'id', 'contact_rule_1',
    'rule_name', 'Contact Page Notice',
    'url_pattern', '/contact',
    'url_match_type', 'contains',
    'trigger_type', 'onPageLoad',
    'trigger_delay', 1000,
    'notice_id', 'contact_notice',
    'priority', 100,
    'is_active', true,
    'notice_content', jsonb_build_object(
      'title', 'Contact Form Consent',
      'message', 'We need your consent to process your contact form data under DPDPA 2023.',
      'html', '<p>Contact-specific privacy notice content...</p>'
    )
  )
)
WHERE widget_id = 'dpdpa_mhnhpimc_atq70ak';
```

3. **Update SDK to use notice_content from rule:**

Modify `showNoticeForRule()` to check for `notice_content` in the rule:

```javascript
function showNoticeForRule(rule) {
  // Check if notice content is in the rule itself
  const notice = rule.notice_content || config.notices?.[rule.notice_id] || config.notices?.default;
  
  if (!notice) {
    console.error('[Consently DPDPA] Notice not found for rule:', rule.notice_id);
    return;
  }
  
  // Update config with rule-specific notice
  if (notice.title) config.title = notice.title;
  if (notice.message) config.message = notice.message;
  if (notice.html) config.privacyNoticeHTML = notice.html;
  
  // Show widget
  showConsentWidget();
}
```

---

## 🎯 Full Implementation (Recommended for Production)

For a production-ready system, follow the comprehensive approach in `MULTI_TENANT_DISPLAY_RULES_ANALYSIS.md`:

1. **Create `consent_notices` table** - Store multiple notices per widget
2. **Create `display_rules` table** - Store URL-based rules separately
3. **Build dashboard UI** - Allow users to create/manage rules visually
4. **Add rule testing** - Preview rules before deploying

**Timeline**: 2-3 weeks for full implementation

---

## 🧪 Testing Your Implementation

1. **Test on Careers Page:**
   - Visit `/careers`
   - Widget should show careers-specific notice
   - Check browser console for rule evaluation logs

2. **Test on Contact Page:**
   - Visit `/contact`
   - Widget should show contact-specific notice

3. **Test Default Behavior:**
   - Visit any other page (e.g., `/`)
   - Widget should show default notice or no widget if no rules match

---

## 📊 Current Limitations & Future Enhancements

**Current (Quick Start):**
- ✅ URL-based rules (contains, exact, startsWith)
- ✅ Page-specific notices
- ⚠️ Notices stored in widget config (not ideal for many notices)
- ⚠️ No dashboard UI (requires SQL updates)

**Future (Full Implementation):**
- ✅ Separate notices table
- ✅ Dashboard UI for rule management
- ✅ Element selector triggers (onClick, onFormSubmit)
- ✅ Geo-targeting
- ✅ Device targeting
- ✅ A/B testing
- ✅ Analytics for rule performance

---

## 🔧 Troubleshooting

**Widget not showing:**
- Check browser console for errors
- Verify `display_rules` is not empty in database
- Check `is_active` is true for rules
- Verify URL pattern matches current path

**Wrong notice showing:**
- Check rule priority (higher = shown first)
- Verify URL pattern matching logic
- Check `notice_content` or `notice_id` is correct

**Rules not evaluating:**
- Ensure `evaluateDisplayRules()` is called after `fetchWidgetConfig()`
- Check that `config.display_rules` exists and is an array
- Verify rules are active (`is_active: true`)

---

## 📚 Next Steps

1. **Start with Quick Start** - Test the concept with minimal changes
2. **Validate with real use cases** - Test on careers and contact pages
3. **Plan full implementation** - If successful, build the full system
4. **Build dashboard UI** - Make it user-friendly for non-technical users

---

## 💡 Example Use Cases

1. **Careers Page**: "We need consent to process your job application data"
2. **Contact Page**: "We need consent to process your inquiry data"
3. **Newsletter Signup**: "We need consent to send you marketing emails"
4. **E-commerce Checkout**: "We need consent to process your payment data"

Each can have different:
- Notice content
- Processing activities
- Consent requirements
- Display timing

---

**Questions?** Refer to `MULTI_TENANT_DISPLAY_RULES_ANALYSIS.md` for detailed technical specifications.

