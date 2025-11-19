# Activity and Purpose-Level Analytics

## Overview

The DPDPA system now includes granular activity-level and purpose-level consent tracking and analytics. This allows you to understand how visitors respond to specific processing activities and individual purposes within those activities.

## Features

### 1. Activity-Level Tracking

Track consent rates for each processing activity:
- **Total Consents**: Number of times visitors were presented with this activity
- **Acceptance Rate**: Percentage of visitors who consented to the activity
- **Rejection Rate**: Percentage of visitors who rejected the activity
- **Partial Rate**: Percentage of visitors who partially consented
- **Trend Analysis**: Identify top performing activities and those needing improvement

### 2. Purpose-Level Tracking

Understand consent at the granular purpose level:
- **Purpose Consent Rates**: Track consent for individual purposes within activities
- **Legal Basis Tracking**: Monitor consent by legal basis (consent, contract, legal obligation, legitimate interest)
- **Activity Breakdown**: View all purposes within each activity and their respective consent rates
- **Cross-Purpose Analysis**: Identify which purposes resonate with visitors

### 3. Visual Analytics Dashboard

Integrated directly into the main DPDPA dashboard:
- **Real-time Updates**: Data refreshes automatically
- **Interactive Charts**: Visual progress bars and statistics
- **Top/Bottom Performers**: Quick identification of best and worst performing items
- **Export Functionality**: Download analytics data as CSV

## Architecture

### API Endpoints

#### Activity-Level Analytics
```
GET /api/dpdpa/analytics/activity-level
```

**Query Parameters:**
- `widgetId` (optional): Filter by specific widget
- `startDate` (optional): Start of date range (ISO 8601)
- `endDate` (optional): End of date range (ISO 8601)
- `sortBy` (optional): Sort field (acceptanceRate, totalConsents, activityName)
- `sortOrder` (optional): Sort order (asc, desc)

**Response:**
```json
{
  "data": [
    {
      "activityId": "uuid",
      "activityName": "Email Marketing",
      "industry": "Marketing",
      "totalConsents": 1500,
      "acceptedCount": 1200,
      "rejectedCount": 200,
      "partialCount": 100,
      "acceptanceRate": 80.0,
      "rejectionRate": 13.3,
      "partialRate": 6.7,
      "isActive": true
    }
  ],
  "summary": {
    "totalActivities": 10,
    "totalConsents": 5000,
    "avgAcceptanceRate": 75.5,
    "topActivities": [...],
    "bottomActivities": [...]
  }
}
```

#### Purpose-Level Analytics
```
GET /api/dpdpa/analytics/purpose-level
```

**Query Parameters:**
- `widgetId` (optional): Filter by specific widget
- `activityId` (optional): Filter by specific activity
- `startDate` (optional): Start of date range
- `endDate` (optional): End of date range
- `sortBy` (optional): Sort field (consentRate, totalRecords, purposeName)

**Response:**
```json
{
  "data": [
    {
      "activityId": "uuid",
      "activityName": "Email Marketing",
      "purposeId": "uuid",
      "purposeName": "Newsletter Distribution",
      "legalBasis": "consent",
      "totalRecords": 1500,
      "consentedCount": 1200,
      "consentRate": 80.0,
      "industry": "Marketing"
    }
  ],
  "summary": {
    "totalPurposes": 25,
    "totalRecords": 5000,
    "avgConsentRate": 72.3,
    "topPurposes": [...],
    "bottomPurposes": [...]
  },
  "activityBreakdown": [
    {
      "activityId": "uuid",
      "activityName": "Email Marketing",
      "purposeCount": 3,
      "avgConsentRate": 78.5,
      "purposes": [...]
    }
  ]
}
```

### Components

#### ActivityLevelAnalytics
```tsx
import { ActivityLevelAnalytics } from '@/components/dpdpa/ActivityLevelAnalytics';

<ActivityLevelAnalytics
  widgetId="optional-widget-id"
  startDate="2024-01-01"
  endDate="2024-12-31"
  showTopOnly={false}
  maxItems={10}
/>
```

**Props:**
- `widgetId` (optional): Filter by widget
- `startDate` (optional): Start date filter
- `endDate` (optional): End date filter
- `showTopOnly` (optional): Show only top performers
- `maxItems` (optional): Maximum items to display

#### PurposeLevelAnalytics
```tsx
import { PurposeLevelAnalytics } from '@/components/dpdpa/PurposeLevelAnalytics';

<PurposeLevelAnalytics
  widgetId="optional-widget-id"
  activityId="optional-activity-id"
  startDate="2024-01-01"
  endDate="2024-12-31"
  showTopOnly={false}
  maxItems={10}
/>
```

**Props:**
- `widgetId` (optional): Filter by widget
- `activityId` (optional): Filter by activity
- `startDate` (optional): Start date filter
- `endDate` (optional): End date filter
- `showTopOnly` (optional): Show only top performers
- `maxItems` (optional): Maximum items to display

### Database Schema

The system uses existing tables with optimized indexes:

#### Main Tables
- `dpdpa_consent_records`: Stores consent records with activity arrays and JSONB details
- `processing_activities`: Activities defined by users
- `activity_purposes`: Purposes within activities
- `purposes`: Master purpose list

#### Key Fields
- `consented_activities`: UUID[] - Array of accepted activity IDs
- `rejected_activities`: UUID[] - Array of rejected activity IDs
- `consent_details`: JSONB - Contains `activityPurposeConsents` mapping

#### Performance Indexes
```sql
-- Optimized indexes for analytics queries
CREATE INDEX idx_dpdpa_consent_records_widget_date ON dpdpa_consent_records(widget_id, consent_given_at DESC);
CREATE INDEX idx_dpdpa_consent_records_consented_activities ON dpdpa_consent_records USING GIN(consented_activities);
CREATE INDEX idx_dpdpa_consent_records_rejected_activities ON dpdpa_consent_records USING GIN(rejected_activities);
CREATE INDEX idx_dpdpa_consent_records_consent_details ON dpdpa_consent_records USING GIN(consent_details);
```

## Data Collection

### Widget Integration

The DPDPA widget automatically collects activity and purpose-level consent:

```javascript
// Consent record structure
{
  widgetId: "widget-123",
  visitorId: "CNST-XXXX-XXXX-XXXX",
  consentStatus: "partial",
  acceptedActivities: ["activity-uuid-1", "activity-uuid-2"],
  rejectedActivities: ["activity-uuid-3"],
  activityPurposeConsents: {
    "activity-uuid-1": ["purpose-uuid-1", "purpose-uuid-2"],
    "activity-uuid-2": ["purpose-uuid-3"]
  },
  // ... other metadata
}
```

### Consent Details JSONB Structure

```json
{
  "activityConsents": {
    "activity-uuid-1": {
      "status": "accepted",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  },
  "activityPurposeConsents": {
    "activity-uuid-1": ["purpose-uuid-1", "purpose-uuid-2"],
    "activity-uuid-2": ["purpose-uuid-3"]
  },
  "ruleContext": {
    "ruleId": "rule-123",
    "ruleName": "Homepage Notice",
    "urlPattern": "/",
    "pageUrl": "https://example.com/"
  },
  "metadata": {
    "deviceType": "Desktop",
    "browser": "Chrome",
    "country": "IN"
  }
}
```

## Use Cases

### 1. Optimize Consent Rates
Identify activities with low acceptance rates and improve their descriptions or reduce data collection scope.

### 2. Compliance Reporting
Generate detailed reports showing consent rates by legal basis for regulatory compliance.

### 3. A/B Testing
Test different activity descriptions or purposes and measure their impact on consent rates.

### 4. User Trust Analysis
Understand which purposes users trust most and least, informing privacy policy improvements.

### 5. ROI Analysis
Calculate the business impact of consent choices by tracking which activities are most/least accepted.

## Performance Considerations

### Query Optimization
- All analytics queries use optimized indexes
- Date range filtering reduces dataset size
- Array operations use GIN indexes for fast lookups
- JSONB queries leverage GIN indexes

### Caching Strategy
- Dashboard data refreshes every 30 seconds
- Consider implementing Redis caching for high-traffic sites
- Materialized views available for very large datasets

### Scaling
- For datasets > 1M consent records, consider:
  - Materialized views with periodic refresh
  - Query result caching
  - Time-series data aggregation
  - Partitioning consent_records by date

## Best Practices

### 1. Regular Monitoring
Review analytics weekly to identify trends and areas for improvement.

### 2. Data-Driven Decisions
Use analytics to inform privacy policy updates and consent flow optimization.

### 3. Purpose Granularity
Balance granularity with user experience - too many purposes can overwhelm users.

### 4. Legal Basis Alignment
Ensure legal basis aligns with actual data processing purposes.

### 5. Transparency
Use insights to improve transparency and build user trust.

## Troubleshooting

### No Data Showing
- Verify widget is active and embedded correctly
- Check date range filters
- Ensure activities are properly configured
- Confirm consent records are being created

### Slow Performance
- Check database indexes are created
- Reduce date range
- Implement caching
- Consider materialized views

### Incorrect Rates
- Verify consent_details JSONB structure
- Check activityPurposeConsents mapping
- Ensure array operations are correct
- Review database constraints

## Future Enhancements

- [ ] Real-time analytics dashboard
- [ ] Predictive consent rate modeling
- [ ] A/B testing framework integration
- [ ] Advanced filtering and segmentation
- [ ] Custom report builder
- [ ] Automated insights and recommendations
- [ ] Export to BI tools (Tableau, PowerBI)
- [ ] ML-based optimization suggestions

## Related Documentation

- [DPDPA Widget Setup](./DPDPA_WIDGET_SETUP.md)
- [Processing Activities Guide](./PROCESSING_ACTIVITIES.md)
- [Database Schema](../architecture/DATABASE_SCHEMA.md)
- [API Reference](../guides/API_REFERENCE.md)

