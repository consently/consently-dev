# Email Verification Analytics Dashboard

## Overview
The Email Verification Analytics Dashboard provides comprehensive insights into the email verification flow performance, including OTP sending, verification rates, user engagement, and error tracking.

## Access
Navigate to: `/dashboard/analytics/email-verification`

## Features

### 1. Overview Metrics
- **OTPs Sent**: Total number of verification codes sent
- **Verified**: Number of successfully verified emails with success rate
- **Skipped**: Number of users who skipped verification with skip rate
- **Avg. Time**: Average time taken to complete verification (formatted as minutes/seconds)

### 2. Secondary Metrics
- **Failed Attempts**: Count of invalid or expired OTP entries
- **Rate Limited**: Number of blocked requests due to rate limiting
- **Completion Rate**: Overall verification completion percentage

### 3. Verification Trends Chart
Line chart showing daily trends for:
- OTP Sent (blue)
- Verified (green)
- Failed (red)
- Skipped (yellow)

### 4. Performance by Widget
Table breakdown showing:
- Widget name and ID
- OTPs sent per widget
- Successful verifications
- Verification rate with visual progress bar

### 5. Recent Events Log
Real-time feed of the last 50 events with:
- Event type icons (OTP sent, verified, failed, skipped, rate limited)
- Visitor ID (truncated)
- Timestamp (date and time)

## Filters

### Date Range
- Last 7 days
- Last 30 days (default)
- Last 90 days

### Widget Filter
Dynamically populated dropdown to filter data by specific widget (appears when multiple widgets have data).

## API Endpoint
The dashboard consumes data from: `/api/analytics/email-verification`

### Query Parameters
- `days`: Number of days to retrieve data (7, 30, or 90)
- `widgetId`: Optional widget ID filter

### Response Structure
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalOtpSent": 100,
      "totalVerified": 75,
      "totalFailed": 15,
      "totalSkipped": 10,
      "totalRateLimited": 5,
      "verificationRate": 75.0,
      "skipRate": 10.0,
      "averageTimeToVerifySeconds": 45
    },
    "timeSeries": [...],
    "byWidget": [...],
    "recentEvents": [...]
  },
  "meta": {
    "startDate": "2025-01-01T00:00:00Z",
    "endDate": "2025-01-31T23:59:59Z",
    "days": 30,
    "widgetId": "all"
  }
}
```

## Event Types

| Event Type | Description | Icon |
|-----------|-------------|------|
| `otp_sent` | Verification code sent to email | Mail (blue) |
| `otp_verified` | Email successfully verified | CheckCircle (green) |
| `otp_failed` | Failed verification attempt | XCircle (red) |
| `otp_skipped` | User skipped verification | Clock (yellow) |
| `rate_limited` | Request blocked by rate limiter | Ban (orange) |

## Database Schema
Data is tracked in the `email_verification_events` table:
- `id`: UUID primary key
- `widget_id`: Reference to widget configuration
- `visitor_id`: Unique visitor identifier
- `event_type`: Type of event (enum)
- `email_hash`: SHA256 hash of email (optional)
- `metadata`: JSONB field for additional data
- `created_at`: Timestamp

## Technical Implementation

### Frontend
- **Framework**: Next.js 15 (App Router)
- **UI Components**: Custom components from `@/components/ui`
- **Charts**: Recharts library (LineChart)
- **Styling**: Tailwind CSS
- **Date Handling**: date-fns

### State Management
- React useState for local state
- useEffect for data fetching on filter changes
- Automatic widget dropdown population from API response

### Performance Considerations
- Client-side filtering for date range and widget
- Efficient API calls (debounced by filter changes)
- Responsive design for mobile/tablet/desktop

## Usage Examples

### Monitoring Verification Success
1. Navigate to the analytics dashboard
2. Select desired date range (e.g., Last 30 days)
3. Review **Verification Rate** metric
4. Check **Verification Trends** chart for patterns
5. If rate is low, investigate **Recent Events** for failure reasons

### Widget Performance Comparison
1. View "Performance by Widget" table
2. Compare verification rates across widgets
3. Identify underperforming widgets
4. Filter by specific widget for detailed analysis

### Identifying Issues
1. Check **Rate Limited** metric for excessive blocking
2. Review **Failed Attempts** for OTP entry errors
3. Examine **Recent Events** for error patterns
4. Investigate **Avg. Time** if unusually high (indicates UX friction)

## Future Enhancements
- Export functionality (CSV/PDF)
- Email domain breakdown
- Geographic distribution of verifications
- Conversion funnel from OTP sent → verified
- Alert thresholds for low verification rates
- A/B testing insights for different OTP expiration times
