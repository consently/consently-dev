# Display Rules Configuration Guide

## Overview

Display rules enable page-specific DPDPA consent notices without requiring separate widgets. Each widget can have multiple display rules that trigger notices on specific pages, events, or conditions.

## Architecture

Display rules are stored as a JSONB array in the `dpdpa_widget_configs.display_rules` column. This provides:

- **Flexibility**: Dynamic, per-widget configuration
- **Multi-tenancy**: Each user configures their own rules
- **Performance**: GIN index for fast JSONB queries
- **No hardcoding**: Rules are user-specific, not platform-wide

## Display Rule Structure

```typescript
interface DisplayRule {
  id: string;                    // Unique rule identifier (e.g., "careers_rule_1")
  rule_name: string;             // Human-readable name
  url_pattern: string;           // URL to match (e.g., "/careers", "/contact")
  url_match_type: 'contains' | 'exact' | 'startsWith' | 'regex';
  trigger_type: 'onPageLoad' | 'onClick' | 'onFormSubmit' | 'onScroll';
  trigger_delay?: number;        // Delay in milliseconds (default: 1000)
  element_selector?: string;     // CSS selector for trigger element
  notice_id: string;             // Identifier for the notice
  priority: number;              // Higher priority rules take precedence
  is_active: boolean;            // Whether the rule is enabled
  notice_content: {
    title: string;
    message: string;
    html?: string;               // Optional HTML content
  };
}
```

## API Usage

### Creating a Widget with Display Rules

```typescript
POST /api/dpdpa/widget-config

{
  "name": "My DPDPA Widget",
  "domain": "example.com",
  "displayRules": [
    {
      "id": "careers_rule_1",
      "rule_name": "Careers Page Notice",
      "url_pattern": "/careers",
      "url_match_type": "contains",
      "trigger_type": "onPageLoad",
      "trigger_delay": 1000,
      "notice_id": "careers_notice",
      "priority": 100,
      "is_active": true,
      "notice_content": {
        "title": "Career Application Consent",
        "message": "We need your consent to process your job application data under DPDPA 2023.",
        "html": "<p>By submitting your application, you consent to us processing your personal data including name, email, phone number, and resume for recruitment purposes.</p>"
      }
    },
    {
      "id": "contact_rule_1",
      "rule_name": "Contact Page Notice",
      "url_pattern": "/contact",
      "url_match_type": "contains",
      "trigger_type": "onPageLoad",
      "trigger_delay": 1000,
      "notice_id": "contact_notice",
      "priority": 100,
      "is_active": true,
      "notice_content": {
        "title": "Contact Form Consent",
        "message": "We need your consent to process your contact form data under DPDPA 2023.",
        "html": "<p>By submitting this form, you consent to us processing your personal data including name, email, and message for responding to your inquiry.</p>"
      }
    }
  ],
  // ... other widget configuration
}
```

### Updating Display Rules

```typescript
PUT /api/dpdpa/widget-config

{
  "widgetId": "dpdpa_xxx_yyy",
  "displayRules": [
    // Updated rules array
  ]
}
```

### Query Display Rules

Display rules are automatically included when fetching widget configurations:

```typescript
GET /api/dpdpa/widget-config?widgetId={widgetId}
```

## Common Use Cases

### 1. Form-Specific Consent

Trigger consent notice when user interacts with a form:

```json
{
  "id": "application_form_rule",
  "rule_name": "Job Application Form",
  "url_pattern": "/careers/apply",
  "url_match_type": "contains",
  "trigger_type": "onFormSubmit",
  "element_selector": "#application-form",
  "notice_id": "application_consent",
  "priority": 200,
  "is_active": true,
  "notice_content": {
    "title": "Application Data Processing",
    "message": "Your consent is required before submitting.",
    "html": "<p>We will process your application data in accordance with DPDPA 2023.</p>"
  }
}
```

### 2. Page Load Notice

Show notice when user visits a specific page:

```json
{
  "id": "newsletter_page_rule",
  "rule_name": "Newsletter Signup Page",
  "url_pattern": "/newsletter",
  "url_match_type": "exact",
  "trigger_type": "onPageLoad",
  "trigger_delay": 2000,
  "notice_id": "newsletter_consent",
  "priority": 100,
  "is_active": true,
  "notice_content": {
    "title": "Newsletter Subscription",
    "message": "Subscribe to our newsletter",
    "html": "<p>We'll use your email to send monthly updates.</p>"
  }
}
```

### 3. Scroll-Triggered Notice

Show notice after user scrolls (e.g., for premium content):

```json
{
  "id": "premium_content_rule",
  "rule_name": "Premium Content Access",
  "url_pattern": "/premium/",
  "url_match_type": "startsWith",
  "trigger_type": "onScroll",
  "trigger_delay": 0,
  "notice_id": "premium_consent",
  "priority": 150,
  "is_active": true,
  "notice_content": {
    "title": "Access Premium Content",
    "message": "Consent required to access premium features",
    "html": "<p>We need your consent to personalize your premium experience.</p>"
  }
}
```

## Database Schema

The display rules feature uses:

- **Table**: `dpdpa_widget_configs`
- **Column**: `display_rules JSONB DEFAULT '[]'::jsonb`
- **Index**: `idx_dpdpa_widget_configs_display_rules` (GIN index for JSONB queries)

## Migration History

- **Migration 12**: Created `display_rules` column and GIN index
- ~~**Migration 26**: Removed~~ (was hardcoded for single widget - incorrect approach)

## Best Practices

1. **Rule Priority**: Use priority values to control which rule takes precedence when multiple rules match
2. **URL Patterns**: Use `contains` for flexible matching, `exact` for specific pages
3. **Trigger Delays**: Add slight delays (500-1000ms) to avoid overwhelming users
4. **Rule Names**: Use descriptive names for easy identification in analytics
5. **Testing**: Test rules on staging environment before production deployment

## UI Configuration (Future)

Currently, display rules are configured via API. Future enhancements may include:

- [ ] Dashboard UI for managing display rules
- [ ] Rule templates for common scenarios
- [ ] Visual rule builder
- [ ] Rule preview/testing interface
- [ ] Analytics for rule performance

## Security Considerations

- Display rules are scoped to individual widgets (user_id isolation)
- Anonymous users can only read rules for active widgets via public API
- Rule content is sanitized before rendering in the widget
- Regular expression patterns are validated to prevent ReDoS attacks

## Troubleshooting

### Rules not triggering?

1. Check `is_active` is `true`
2. Verify URL pattern matches the page URL
3. Ensure trigger conditions are met (e.g., form exists for `onFormSubmit`)
4. Check browser console for widget errors
5. Verify widget is active and properly installed

### Multiple rules triggering?

- Use `priority` values to control precedence
- Only the highest priority matching rule will trigger
- If priorities are equal, the first rule in the array triggers

### Performance issues?

- Limit number of rules per widget (recommended: < 20)
- Use simple `contains` or `exact` matching instead of regex when possible
- Avoid very short trigger delays (< 500ms)

## Related Documentation

- [MULTI_TENANT_DISPLAY_RULES_ANALYSIS.md](../architecture/MULTI_TENANT_DISPLAY_RULES_ANALYSIS.md)
- [PAGE_SPECIFIC_NOTICES_IMPLEMENTATION.md](./PAGE_SPECIFIC_NOTICES_IMPLEMENTATION.md)
- [Version 2 Implementation Verification](./VERSION_2_IMPLEMENTATION_VERIFICATION.md)

