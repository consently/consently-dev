# Page-Specific Notices - Quick Start Guide

## ✅ Implementation Complete!

The system now supports **page-specific notices** - different consent notices for different pages (e.g., careers page vs contact page).

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Run the Database Migration

```bash
# Run the migration to add display_rules column
psql -U your_user -d your_database -f supabase/migrations/12_add_display_rules_to_widget_config.sql
```

Or run it directly in your Supabase SQL editor.

### Step 2: Set Up Example Rules

Run the example SQL script to create rules for careers and contact pages:

```bash
psql -U your_user -d your_database -f scripts/setup-page-specific-notices-example.sql
```

Or copy the SQL from `scripts/setup-page-specific-notices-example.sql` and run it in Supabase.

### Step 3: Test It!

1. **Visit `/careers`** - You should see the careers-specific notice
2. **Visit `/contact`** - You should see the contact-specific notice
3. **Visit any other page** - You should see the default notice (or no widget if no rules match)

---

## 📋 What Was Implemented

### 1. Database Changes
- ✅ Added `display_rules` JSONB column to `dpdpa_widget_configs` table
- ✅ Added GIN index for performance

### 2. API Changes
- ✅ Updated `/api/dpdpa/widget-public/[widgetId]` to return `display_rules`

### 3. Widget SDK Changes
- ✅ Added URL pattern matching (`contains`, `exact`, `startsWith`, `regex`)
- ✅ Added rule evaluation logic
- ✅ Added support for different trigger types (`onPageLoad`, `onClick`, `onFormSubmit`)
- ✅ Added notice content override for rules

---

## 🎯 How It Works

1. **Widget loads** → Fetches config from API (includes `display_rules`)
2. **Rule evaluation** → Checks current URL against rules
3. **Rule matched** → Shows rule-specific notice content
4. **No match** → Falls back to default widget behavior

---

## 📝 Rule Structure

Each rule in `display_rules` array has this structure:

```json
{
  "id": "unique_rule_id",
  "rule_name": "Human readable name",
  "url_pattern": "/careers",
  "url_match_type": "contains|exact|startsWith|regex",
  "trigger_type": "onPageLoad|onClick|onFormSubmit",
  "trigger_delay": 1000,
  "element_selector": "#formId (optional)",
  "notice_id": "notice_identifier",
  "priority": 100,
  "is_active": true,
  "notice_content": {
    "title": "Notice title",
    "message": "Notice message",
    "html": "<p>HTML content</p>"
  }
}
```

---

## 🔧 Creating New Rules

### Option 1: Via SQL (Current Method)

```sql
UPDATE dpdpa_widget_configs
SET display_rules = display_rules || jsonb_build_array(
  jsonb_build_object(
    'id', 'my_rule_1',
    'rule_name', 'My Page Notice',
    'url_pattern', '/my-page',
    'url_match_type', 'contains',
    'trigger_type', 'onPageLoad',
    'trigger_delay', 1000,
    'notice_id', 'my_notice',
    'priority', 100,
    'is_active', true,
    'notice_content', jsonb_build_object(
      'title', 'My Page Consent',
      'message', 'Your consent message here',
      'html', '<p>Your HTML content here</p>'
    )
  )
)
WHERE widget_id = 'your_widget_id';
```

### Option 2: Via Dashboard (Future)

A dashboard UI will be built to manage rules visually (see `MULTI_TENANT_DISPLAY_RULES_ANALYSIS.md` for full implementation plan).

---

## 🧪 Testing

### Test URL Matching

1. **Contains match**: `url_pattern: "/careers"` matches `/careers`, `/careers/apply`, etc.
2. **Exact match**: `url_pattern: "/careers"` matches only `/careers`
3. **Starts with**: `url_pattern: "/careers"` matches `/careers/*`
4. **Regex**: `url_pattern: "^/careers/.*"` matches any path starting with `/careers/`

### Test Priority

Rules with higher `priority` are evaluated first. If multiple rules match, the first one (highest priority) is used.

### Test Triggers

- **onPageLoad**: Notice shows when page loads (after delay)
- **onClick**: Notice shows when element is clicked (requires `element_selector`)
- **onFormSubmit**: Notice shows when form is submitted (requires `element_selector`)

---

## 🐛 Troubleshooting

### Widget not showing on specific page

1. **Check browser console** - Look for rule evaluation logs
2. **Verify rule is active** - `is_active: true`
3. **Check URL pattern** - Ensure it matches the current path
4. **Check priority** - Higher priority rules are evaluated first

### Wrong notice showing

1. **Check rule priority** - Higher priority rules are shown first
2. **Verify URL pattern** - Make sure it's matching the correct page
3. **Check notice_content** - Ensure it has the correct content

### Rules not evaluating

1. **Check `display_rules` exists** - Should be an array in widget config
2. **Verify API response** - Check that API returns `display_rules`
3. **Check browser console** - Look for evaluation logs

---

## 📊 Current Limitations

- ⚠️ Rules must be managed via SQL (no dashboard UI yet)
- ⚠️ Notices stored in widget config (not ideal for many notices)
- ⚠️ No analytics for rule performance yet

**Future enhancements** (see `MULTI_TENANT_DISPLAY_RULES_ANALYSIS.md`):
- ✅ Separate notices table
- ✅ Dashboard UI for rule management
- ✅ Rule testing/preview
- ✅ Analytics for rule performance
- ✅ Geo-targeting and device targeting

---

## 📚 Next Steps

1. **Test with real pages** - Set up rules for careers and contact pages
2. **Customize notice content** - Update the HTML/content for each page
3. **Plan full implementation** - If successful, build the full system with dashboard UI
4. **Add more rules** - Create rules for other pages as needed

---

## 💡 Example Use Cases

1. **Careers Page**: "We need consent to process your job application data"
2. **Contact Page**: "We need consent to process your inquiry data"
3. **Newsletter Signup**: "We need consent to send you marketing emails"
4. **E-commerce Checkout**: "We need consent to process your payment data"
5. **Form Submissions**: Show notice when user clicks submit button

Each can have:
- Different notice content
- Different processing activities
- Different consent requirements
- Different display timing

---

## 🔗 Related Documentation

- **Full Implementation Plan**: `docs/MULTI_TENANT_DISPLAY_RULES_ANALYSIS.md`
- **Implementation Guide**: `docs/PAGE_SPECIFIC_NOTICES_IMPLEMENTATION.md`
- **Migration File**: `supabase/migrations/12_add_display_rules_to_widget_config.sql`
- **Example SQL**: `scripts/setup-page-specific-notices-example.sql`

---

**Questions?** Check the browser console for detailed logs about rule evaluation!


