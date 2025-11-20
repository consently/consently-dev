# Managing DPDPA Display Rules

A guide to configuring page-specific purpose filtering for the DPDPA consent widget.

## Overview

Display rules allow you to control which processing activities and purposes are shown on specific pages. This ensures users only see consent requests relevant to their current interaction.

## Quick Reference

### Display Rule Structure

```typescript
interface DisplayRule {
  id: string;                          // Unique rule ID
  rule_name: string;                   // Human-readable name
  url_pattern: string;                 // URL to match (e.g., "/careers")
  url_match_type: 'exact' | 'contains' | 'startsWith' | 'regex';
  trigger_type: 'onPageLoad' | 'onClick' | 'onFormSubmit' | 'onScroll';
  trigger_delay?: number;              // Delay in ms (for onPageLoad)
  element_selector?: string;           // CSS selector (for onClick/onFormSubmit)
  scroll_threshold?: number;           // Percentage 0-100 (for onScroll)
  activities?: string[];               // Activity IDs to show
  activity_purposes?: Record<string, string[]>; // Purpose IDs per activity
  notice_content?: {                   // Custom content for this rule
    title?: string;
    message?: string;
    html?: string;
  };
  priority: number;                    // Higher = evaluated first
  is_active: boolean;                  // Enable/disable rule
}
```

## Common Use Cases

### 1. Single Purpose Per Page

**Scenario:** Show only "Careers" purpose on the careers page.

```typescript
{
  rule_name: "Careers Page - Careers Purpose Only",
  url_pattern: "/careers",
  url_match_type: "exact",
  trigger_type: "onPageLoad",
  activities: ["careers-activity-id"],
  activity_purposes: {
    "careers-activity-id": ["career-application-purpose-id"]
  },
  priority: 100,
  is_active: true
}
```

### 2. Multiple Purposes for One Activity

**Scenario:** Show both "Newsletter" and "Marketing" purposes on signup page.

```typescript
{
  rule_name: "Signup - Marketing Purposes",
  url_pattern: "/signup",
  url_match_type: "exact",
  trigger_type: "onPageLoad",
  activities: ["marketing-activity-id"],
  activity_purposes: {
    "marketing-activity-id": [
      "newsletter-purpose-id",
      "promotional-purpose-id"
    ]
  },
  priority: 100,
  is_active: true
}
```

### 3. Multiple Activities

**Scenario:** Show both "Analytics" and "Personalization" activities on the homepage.

```typescript
{
  rule_name: "Homepage - Analytics & Personalization",
  url_pattern: "/",
  url_match_type: "exact",
  trigger_type: "onPageLoad",
  activities: [
    "analytics-activity-id",
    "personalization-activity-id"
  ],
  activity_purposes: {
    "analytics-activity-id": ["web-analytics-purpose-id"],
    "personalization-activity-id": ["content-customization-purpose-id"]
  },
  priority: 100,
  is_active: true
}
```

### 4. URL Pattern Matching

**Scenario:** Show "Blog Reading" purpose for all blog posts.

```typescript
{
  rule_name: "Blog Posts - Reading Analytics",
  url_pattern: "/blog/",
  url_match_type: "contains",  // Matches any URL containing /blog/
  trigger_type: "onPageLoad",
  activities: ["analytics-activity-id"],
  activity_purposes: {
    "analytics-activity-id": ["blog-analytics-purpose-id"]
  },
  priority: 80,
  is_active: true
}
```

### 5. Form Submission Trigger

**Scenario:** Show consent notice when user submits a contact form.

```typescript
{
  rule_name: "Contact Form - On Submit",
  url_pattern: "/contact",
  url_match_type: "exact",
  trigger_type: "onFormSubmit",
  element_selector: "#contact-form",  // CSS selector for the form
  activities: ["contact-activity-id"],
  activity_purposes: {
    "contact-activity-id": ["customer-support-purpose-id"]
  },
  priority: 100,
  is_active: true
}
```

### 6. Scroll-Triggered Notice

**Scenario:** Show cookie consent when user scrolls 50% down the page.

```typescript
{
  rule_name: "Cookie Consent - On Scroll",
  url_pattern: "*",  // All pages
  url_match_type: "regex",
  trigger_type: "onScroll",
  scroll_threshold: 50,  // Show after 50% scroll
  activities: ["cookies-activity-id"],
  activity_purposes: {
    "cookies-activity-id": ["analytics-cookies-purpose-id"]
  },
  priority: 50,
  is_active: true
}
```

## URL Match Types

### `exact`
Matches the URL exactly.

```typescript
url_pattern: "/careers"  // Matches only /careers
url_match_type: "exact"
```

### `contains`
Matches if URL contains the pattern.

```typescript
url_pattern: "/blog/"  // Matches /blog/, /blog/post-1, /en/blog/post-2
url_match_type: "contains"
```

### `startsWith`
Matches if URL starts with the pattern.

```typescript
url_pattern: "/dashboard"  // Matches /dashboard, /dashboard/settings
url_match_type: "startsWith"
```

### `regex`
Matches using regular expression.

```typescript
url_pattern: "^/products/[0-9]+"  // Matches /products/123, /products/456
url_match_type: "regex"
```

## Priority System

Rules are evaluated in order of priority (highest first). If multiple rules match, the first one wins.

```typescript
// High priority - specific pages
{ url_pattern: "/careers", priority: 100 }
{ url_pattern: "/contact", priority: 100 }

// Medium priority - sections
{ url_pattern: "/blog/", priority: 80 }
{ url_pattern: "/dashboard", priority: 80 }

// Low priority - catch-all
{ url_pattern: "*", priority: 10 }
```

## Best Practices

### 1. Specific Over General

Start with specific rules (exact matches) and use higher priorities:

```typescript
// Good: Specific rule with high priority
{ url_pattern: "/careers", url_match_type: "exact", priority: 100 }

// Then: General rule with lower priority
{ url_pattern: "/", url_match_type: "exact", priority: 50 }
```

### 2. Test Your Rules

Always test rules after creation:

1. Visit the page
2. Open browser DevTools Console
3. Look for widget logs: `[Consently DPDPA] Evaluating display rules...`
4. Verify only expected purposes are shown

### 3. Use Descriptive Names

```typescript
// Good
rule_name: "Careers Page - Show Only Career Application Purpose"

// Bad
rule_name: "Rule 1"
```

### 4. Document Purpose IDs

Keep a reference of your activity and purpose IDs:

```typescript
// Reference
const PURPOSES = {
  CAREERS: "486b79af-0e3a-4293-b13e-96f78062e29f",
  CONTACT: "db23908d-1868-472d-8ec7-4ee14bcc6dea",
  // ...
};
```

### 5. Minimize Purposes Per Page

Only show purposes relevant to the current user interaction:

```typescript
// Good: Only show career purpose on careers page
{ url_pattern: "/careers", activities: ["careers-activity-id"] }

// Bad: Show all purposes everywhere
{ url_pattern: "*", activities: [...allActivities] }
```

## Troubleshooting

### Widget Not Showing

**Check:**
1. Is the rule `is_active: true`?
2. Does the `url_pattern` match the current page?
3. Are the `activities` array populated?
4. Are the activity IDs valid (exist in the widget config)?

**Debug:**
```javascript
// Open console on the page
// Look for these logs:
[Consently DPDPA] Evaluating display rules for URL: /careers
[Consently DPDPA] Available rules: 2
[Consently DPDPA] Rule matched: Careers Page - Show Only Careers Purpose
```

### Wrong Purposes Showing

**Check:**
1. Are the `activity_purposes` UUIDs correct?
2. Are you using `purposeId` (correct) or `id` (wrong)?
3. Does the activity have those purposes associated?

**Debug:**
```javascript
// Check widget config in browser
console.log(window.consentlyConfig);

// Check which purposes are loaded
console.log(window.consentlyConfig.activities);
```

### Multiple Rules Matching

**Solution:** Use priority to control which rule wins:

```typescript
// Specific rule (wins)
{ url_pattern: "/careers", priority: 100 }

// General rule (loses)
{ url_pattern: "/", priority: 50 }
```

## API Integration

### Fetch Widget Config with Rules

```bash
curl https://www.consently.in/api/dpdpa/widget-public/YOUR_WIDGET_ID
```

Response includes `display_rules`:

```json
{
  "widgetId": "dpdpa_...",
  "display_rules": [
    {
      "rule_name": "Careers Page",
      "url_pattern": "/careers",
      "activities": ["..."],
      "activity_purposes": { "...": ["..."] }
    }
  ]
}
```

### Update Display Rules via API

```typescript
// Update widget config
const response = await fetch('/api/dpdpa/widget-config', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    widgetId: 'YOUR_WIDGET_ID',
    displayRules: [
      {
        rule_name: "New Rule",
        url_pattern: "/new-page",
        url_match_type: "exact",
        trigger_type: "onPageLoad",
        activities: ["activity-id"],
        activity_purposes: { "activity-id": ["purpose-id"] },
        priority: 100,
        is_active: true
      }
    ]
  })
});
```

## Real-World Examples

### E-commerce Site

```typescript
const rules = [
  // Homepage - show marketing & analytics
  {
    rule_name: "Homepage",
    url_pattern: "/",
    url_match_type: "exact",
    activities: ["marketing", "analytics"],
    priority: 100
  },
  
  // Product pages - show analytics & personalization
  {
    rule_name: "Product Pages",
    url_pattern: "/products/",
    url_match_type: "contains",
    activities: ["analytics", "personalization"],
    priority: 90
  },
  
  // Checkout - show payment processing
  {
    rule_name: "Checkout",
    url_pattern: "/checkout",
    url_match_type: "startsWith",
    activities: ["payment-processing"],
    priority: 100
  }
];
```

### Content Site

```typescript
const rules = [
  // Blog reading - analytics only
  {
    rule_name: "Blog Posts",
    url_pattern: "/blog/",
    url_match_type: "contains",
    activities: ["analytics"],
    priority: 80
  },
  
  // Newsletter signup - marketing
  {
    rule_name: "Newsletter Signup",
    url_pattern: "/newsletter",
    url_match_type: "exact",
    trigger_type: "onFormSubmit",
    element_selector: "#newsletter-form",
    activities: ["marketing"],
    priority: 100
  }
];
```

## Related Documentation

- [DPDPA Display Rules Fix](../fixes/DPDPA_DISPLAY_RULES_FIX.md)
- [Widget Public API](../../app/api/dpdpa/widget-public/[widgetId]/route.ts)
- [Widget Configuration Schema](../../types/dpdpa-widget.types.ts)

---

**Last Updated:** 2025-01-20  
**Version:** 1.0

