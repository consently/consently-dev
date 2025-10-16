# DPDPA Consent Widget - Complete Implementation Guide

## Overview

The Consently DPDPA Consent Widget is a production-ready, embeddable JavaScript widget that enables DPDPA 2023 (Digital Personal Data Protection Act) compliance on any website. It displays processing activities to users and collects granular, activity-specific consent.

## Table of Contents

1. [Architecture](#architecture)
2. [Setup Guide](#setup-guide)
3. [Dashboard Configuration](#dashboard-configuration)
4. [Website Integration](#website-integration)
5. [API Reference](#api-reference)
6. [Advanced Customization](#advanced-customization)
7. [Consent Management](#consent-management)
8. [Analytics & Reporting](#analytics--reporting)
9. [Best Practices](#best-practices)

---

## Architecture

### System Components

```
┌──────────────────────────────────────────────────────────────┐
│                    User's Website                             │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  <script src="dpdpa-widget.js"                         │  │
│  │          data-dpdpa-widget-id="YOUR_WIDGET_ID">        │  │
│  │  </script>                                              │  │
│  └────────────────────────────────────────────────────────┘  │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│               Consently Platform (API)                        │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  GET /api/dpdpa/widget-public/{widgetId}              │  │
│  │  → Returns widget config + processing activities       │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  POST /api/dpdpa/consent-record                        │  │
│  │  → Records user consent with activity details          │  │
│  └────────────────────────────────────────────────────────┘  │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                  Database (Supabase)                          │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  • processing_activities                               │  │
│  │  • dpdpa_widget_configs                                │  │
│  │  • dpdpa_consent_records                               │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Widget Loads**: JavaScript is embedded in user's website
2. **Fetch Config**: Widget fetches configuration and processing activities from public API
3. **Display Consent**: Modal/banner shows processing activities to visitor
4. **Collect Consent**: User accepts/rejects activities individually or in bulk
5. **Record Consent**: Consent data is sent to API and stored in database
6. **Apply Consent**: Widget triggers custom events for application to react to consent decisions

---

## Setup Guide

### Step 1: Run Database Migration

First, apply the database schema for DPDPA widgets:

```bash
# Run the migration
psql $DATABASE_URL < supabase/migrations/20251014_dpdpa_widget_configs.sql
```

This creates the following tables:
- `dpdpa_widget_configs` - Widget configurations
- `dpdpa_consent_records` - Consent records from external sites

### Step 2: Create Processing Activities

Before configuring a widget, you need processing activities. Navigate to the dashboard:

```
http://localhost:3000/dashboard/dpdpa/activities
```

**Option A: Use Industry Templates**

1. Click "Industry Templates"
2. Select your industry (e.g., E-commerce, Banking, Healthcare)
3. Choose relevant processing activities
4. Click "Add Activities"

**Option B: Create Custom Activities**

1. Click "Add Activity"
2. Fill in the form:
   - **Activity Name**: e.g., "Customer Registration"
   - **Purpose**: Describe why you process data
   - **Industry**: Select your industry
   - **Data Categories**: Email, Name, Phone, etc.
   - **Retention Period**: How long you keep the data
   - **Data Sources**: Where data comes from
3. Click "Create Activity"

### Step 3: Configure Widget

Navigate to the widget configuration page:

```
http://localhost:3000/dashboard/dpdpa/widget
```

Configure:

1. **Basic Settings**
   - Widget Name: Internal identifier
   - Domain: Your website domain (e.g., example.com)
   - Title & Message: Text shown to users

2. **Select Processing Activities**
   - Check the activities you want to display
   - At least one activity is required

3. **Appearance**
   - Primary Color: Main action color
   - Background: Widget background color
   - Text Color: Main text color
   - Button Text: Customize button labels

4. **Behavior**
   - Auto Show: Display automatically on page load
   - Show Delay: Delay before showing (milliseconds)
   - Consent Duration: How long consent is valid (days)
   - Show Data Subject Rights: Display DPDPA rights information

5. Click "Save Configuration"

6. Copy the generated embed code from the sidebar

---

## Dashboard Configuration

### Widget Settings Reference

#### Basic Settings

```typescript
{
  name: string;              // Internal name
  domain: string;            // Website domain (required)
  title: string;             // Modal title
  message: string;           // Introductory message
  acceptButtonText: string;  // "Accept All" button
  rejectButtonText: string;  // "Reject All" button
}
```

#### Theme Customization

```typescript
{
  theme: {
    primaryColor: string;      // Hex color (e.g., #3b82f6)
    backgroundColor: string;   // Hex color
    textColor: string;         // Hex color
    borderRadius: number;      // In pixels (e.g., 12)
  }
}
```

#### Behavior Settings

```typescript
{
  autoShow: boolean;                  // Auto-display widget
  showAfterDelay: number;             // Delay in milliseconds
  consentDuration: number;            // Days (1-730)
  respectDNT: boolean;                // Honor Do Not Track
  requireExplicitConsent: boolean;    // Require user action
  showDataSubjectsRights: boolean;    // Show DPDPA rights info
}
```

---

## Website Integration

### Basic Integration

Add this script tag just before the closing `</body>` tag:

```html
<!-- Consently DPDPA Widget -->
<script src="https://your-domain.com/dpdpa-widget.js" 
        data-dpdpa-widget-id="YOUR_WIDGET_ID">
</script>
```

Replace:
- `https://your-domain.com` with your Consently platform URL
- `YOUR_WIDGET_ID` with the ID from your dashboard

### Manual Trigger

If you disabled auto-show, trigger the widget manually:

```html
<button onclick="window.consentlyDPDPA.show()">
  Manage Privacy Preferences
</button>
```

### Listen to Consent Events

React to user consent decisions:

```javascript
window.addEventListener('consentlyDPDPAConsent', function(event) {
  const consent = event.detail;
  
  console.log('Consent Status:', consent.status);  // 'accepted', 'rejected', 'partial'
  console.log('Accepted Activities:', consent.acceptedActivities);
  console.log('Rejected Activities:', consent.rejectedActivities);
  console.log('Activity Consents:', consent.activityConsents);
  
  // Example: Enable analytics only if consent given
  if (consent.acceptedActivities.includes('analytics-activity-id')) {
    initializeAnalytics();
  }
});
```

### Check Existing Consent

```javascript
// Get current consent
const consent = window.consentlyDPDPA.getConsent();

if (consent && consent.acceptedActivities.includes('marketing-activity-id')) {
  // User accepted marketing activity
  enableMarketingPixels();
}
```

### Allow Consent Withdrawal

```html
<button onclick="window.consentlyDPDPA.withdraw()">
  Withdraw Consent
</button>
```

This clears stored consent and shows the widget again.

---

## API Reference

### Public Endpoints (No Authentication Required)

#### GET /api/dpdpa/widget-public/{widgetId}

Fetch widget configuration and processing activities.

**Response:**

```json
{
  "widgetId": "dpdpa_...",
  "name": "My DPDPA Widget",
  "domain": "example.com",
  "position": "modal",
  "layout": "modal",
  "theme": {
    "primaryColor": "#3b82f6",
    "backgroundColor": "#ffffff",
    "textColor": "#1f2937",
    "borderRadius": 12
  },
  "title": "Your Data Privacy Rights",
  "message": "We process your personal data...",
  "acceptButtonText": "Accept All",
  "rejectButtonText": "Reject All",
  "activities": [
    {
      "id": "uuid-...",
      "activity_name": "Customer Registration",
      "purpose": "To create and manage customer accounts...",
      "industry": "e-commerce",
      "data_attributes": ["Email", "Name", "Phone Number"],
      "retention_period": "3 years from last activity"
    }
  ],
  "autoShow": true,
  "showAfterDelay": 1000,
  "consentDuration": 365,
  "showDataSubjectsRights": true,
  "version": "1.0.0"
}
```

#### POST /api/dpdpa/consent-record

Record user consent.

**Request:**

```json
{
  "widgetId": "dpdpa_...",
  "visitorId": "vis_...",
  "visitorEmail": "user@example.com",
  "consentStatus": "partial",
  "acceptedActivities": ["activity-uuid-1", "activity-uuid-2"],
  "rejectedActivities": ["activity-uuid-3"],
  "activityConsents": {
    "activity-uuid-1": {
      "status": "accepted",
      "timestamp": "2024-01-01T00:00:00Z"
    }
  },
  "metadata": {
    "language": "en",
    "referrer": "https://google.com"
  },
  "consentDuration": 365
}
```

**Response:**

```json
{
  "success": true,
  "consentId": "uuid-...",
  "expiresAt": "2025-01-01T00:00:00Z",
  "message": "Consent recorded successfully"
}
```

### Authenticated Endpoints (Dashboard Only)

#### GET /api/dpdpa/widget-config

Fetch user's widget configurations.

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**

```json
{
  "data": [
    {
      "id": "uuid-...",
      "widget_id": "dpdpa_...",
      "name": "My DPDPA Widget",
      "domain": "example.com",
      "selected_activities": ["uuid1", "uuid2"],
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### POST /api/dpdpa/widget-config

Create new widget configuration.

**Request:**

```json
{
  "name": "My DPDPA Widget",
  "domain": "example.com",
  "selectedActivities": ["activity-uuid-1", "activity-uuid-2"],
  "title": "Your Data Privacy Rights",
  "message": "We process your personal data...",
  "theme": {
    "primaryColor": "#3b82f6"
  },
  "consentDuration": 365
}
```

**Response:**

```json
{
  "data": { ... },
  "widgetId": "dpdpa_..."
}
```

---

## Advanced Customization

### Custom CSS

Add custom styling to the widget by providing custom CSS in the dashboard configuration:

```css
/* Example: Customize activity items */
.dpdpa-activity-item {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

/* Example: Customize buttons */
.dpdpa-activity-accept {
  background: #10b981 !important;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
}
```

### Conditional Loading

Load widget only for specific pages:

```html
<script>
  // Only load on checkout pages
  if (window.location.pathname.includes('/checkout')) {
    const script = document.createElement('script');
    script.src = 'https://your-domain.com/dpdpa-widget.js';
    script.setAttribute('data-dpdpa-widget-id', 'YOUR_WIDGET_ID');
    document.body.appendChild(script);
  }
</script>
```

### Programmatic Consent Management

```javascript
// Advanced consent handling
window.addEventListener('consentlyDPDPAConsent', function(event) {
  const consent = event.detail;
  
  // Store consent in your system
  fetch('/api/internal/consent', {
    method: 'POST',
    body: JSON.stringify({
      userId: getCurrentUserId(),
      consent: consent
    })
  });
  
  // Trigger tag manager
  dataLayer.push({
    'event': 'dpdpa_consent_updated',
    'consent_status': consent.status,
    'accepted_activities': consent.acceptedActivities
  });
});
```

---

## Consent Management

### User Flow

1. **First Visit**: Widget displays with all selected processing activities
2. **User Actions**:
   - Accept All: All activities are accepted
   - Reject All: All activities are rejected
   - Individual: Accept/reject each activity separately
3. **Consent Storage**:
   - Stored in browser localStorage
   - Synced to Consently API
   - Valid for configured duration (default: 365 days)
4. **Return Visit**: Widget doesn't show if valid consent exists

### Data Subject Rights

Under DPDPA 2023, users have the following rights (automatically displayed if enabled):

- **Right to Access**: Users can request a copy of their data
- **Right to Correction**: Users can request corrections to their data
- **Right to Deletion**: Users can request data deletion
- **Right to Withdraw Consent**: Users can withdraw consent at any time

### Consent Withdrawal

Implement a consent management page:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Privacy Settings</title>
</head>
<body>
  <h1>Privacy Settings</h1>
  
  <div id="current-consent">
    <!-- Display current consent status -->
  </div>
  
  <button onclick="window.consentlyDPDPA.show()">
    Update Preferences
  </button>
  
  <button onclick="window.consentlyDPDPA.clearConsent()">
    Withdraw All Consent
  </button>
  
  <script src="https://your-domain.com/dpdpa-widget.js" 
          data-dpdpa-widget-id="YOUR_WIDGET_ID">
  </script>
  
  <script>
    // Display current consent
    const consent = window.consentlyDPDPA.getConsent();
    if (consent) {
      document.getElementById('current-consent').innerHTML = `
        <p>Status: ${consent.status}</p>
        <p>Last Updated: ${new Date(consent.timestamp).toLocaleDateString()}</p>
        <p>Accepted Activities: ${consent.acceptedActivities.length}</p>
        <p>Rejected Activities: ${consent.rejectedActivities.length}</p>
      `;
    }
  </script>
</body>
</html>
```

---

## Analytics & Reporting

### View Consent Records

Access consent records through the dashboard API:

```javascript
// Fetch consent records for your widget
const response = await fetch('/api/dpdpa/consent-records?widgetId=YOUR_WIDGET_ID', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const records = await response.json();
```

### Metrics to Track

- **Consent Rate**: % of visitors who accept consent
- **Partial Consent Rate**: % choosing specific activities
- **Activity Acceptance Rate**: % accepting each activity
- **Consent Duration**: How long before users withdraw
- **Device Type**: Desktop vs Mobile consent rates
- **Geography**: Consent patterns by country

### Sample Analytics Dashboard Query

```sql
-- Consent acceptance rate by activity
SELECT 
  pa.activity_name,
  COUNT(DISTINCT dcr.visitor_id) as total_visitors,
  COUNT(DISTINCT CASE WHEN pa.id = ANY(dcr.accepted_activities) THEN dcr.visitor_id END) as accepted_count,
  ROUND(
    COUNT(DISTINCT CASE WHEN pa.id = ANY(dcr.accepted_activities) THEN dcr.visitor_id END) * 100.0 / 
    COUNT(DISTINCT dcr.visitor_id),
    2
  ) as acceptance_rate
FROM processing_activities pa
CROSS JOIN dpdpa_consent_records dcr
WHERE dcr.widget_id = 'YOUR_WIDGET_ID'
GROUP BY pa.activity_name
ORDER BY acceptance_rate DESC;
```

---

## Best Practices

### 1. Clear Communication

- Use simple, jargon-free language
- Explain WHY you process data, not just WHAT
- Be specific about retention periods
- Make withdrawal easy

### 2. Granular Consent

- Don't bundle unrelated activities
- Allow individual activity acceptance/rejection
- Separate essential from non-essential processing

### 3. Performance

- Widget loads asynchronously (doesn't block page render)
- Configuration is cached for 5 minutes
- Minimal bundle size (~15KB gzipped)
- No external dependencies

### 4. Accessibility

- Widget is keyboard navigable
- ARIA labels on interactive elements
- High contrast colors
- Screen reader compatible

### 5. Testing

Before going live, test:

```javascript
// Test widget loading
console.assert(typeof window.consentlyDPDPA !== 'undefined', 'Widget loaded');

// Test consent storage
window.consentlyDPDPA.clearConsent();
console.assert(window.consentlyDPDPA.getConsent() === null, 'Consent cleared');

// Test manual trigger
window.consentlyDPDPA.show();
```

### 6. Compliance

- Display widget BEFORE processing any personal data
- Don't use pre-checked boxes
- Make "Reject All" as easy as "Accept All"
- Honor Do Not Track if enabled
- Provide clear privacy policy link
- Implement consent withdrawal mechanism

---

## Troubleshooting

### Widget Not Showing

1. **Check Console**: Open browser DevTools → Console tab
2. **Verify Widget ID**: Ensure `data-dpdpa-widget-id` is correct
3. **Check Domain**: Widget domain must match your site
4. **Existing Consent**: Clear localStorage to test

```javascript
// Clear consent for testing
localStorage.removeItem('consently_dpdpa_consent_YOUR_WIDGET_ID');
```

### Consent Not Recording

1. **Check Network Tab**: Look for failed API calls
2. **Verify CORS**: Ensure your domain is allowed
3. **Check Visitor ID**: Must be generated properly

### Styling Issues

1. **CSS Conflicts**: Use custom CSS to override
2. **Z-Index**: Widget uses z-index: 999998
3. **Mobile Display**: Test on actual devices

---

## Support & Resources

- **Dashboard**: https://your-domain.com/dashboard/dpdpa/widget
- **Activities**: https://your-domain.com/dashboard/dpdpa/activities
- **API Docs**: https://your-domain.com/api/docs
- **DPDPA 2023 Act**: https://www.meity.gov.in/dpdpa2023

---

## Changelog

### Version 1.0.0 (2024-01-01)
- Initial release
- Support for granular activity-based consent
- Industry templates
- Custom theming
- DPDPA 2023 compliance
- Multi-device support
- Analytics and reporting

---

## License

© 2024 Consently. All rights reserved.
