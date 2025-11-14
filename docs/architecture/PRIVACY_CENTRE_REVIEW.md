# Privacy Centre Architecture Review

## Overview
The Privacy Centre is a comprehensive self-service portal that allows visitors to manage their consent preferences, view page history, and exercise data subject rights under the DPDP Act 2023.

## Architecture Components

### 1. Frontend Components

#### Main Page: `app/privacy-centre/[widgetId]/page.tsx`
- **Purpose**: Entry point for Privacy Centre
- **Key Features**:
  - Visitor ID initialization (from URL param, localStorage, or generates new UUID)
  - Error handling and loading states
  - Suspense boundary for async operations

#### Main Container: `components/privacy-centre/privacy-centre.tsx`
- **Purpose**: Tab-based navigation container
- **Tabs**:
  1. **Preference Centre** - Manage consent preferences
  2. **Pages View** - Track page visits and consent history
  3. **Request Centre** - Exercise data subject rights

#### Preference Centre: `components/privacy-centre/preference-centre.tsx`
- **Features**:
  - View all processing activities for the widget
  - Toggle consent status per activity
  - Accept All / Reject All actions
  - Export consent history (CSV/PDF)
  - Expandable activity details (purposes, data categories, sources, recipients)

#### Pages View: `components/privacy-centre/pages-view.tsx`
- **Features**:
  - List all pages where consent was given
  - Show consent status per page
  - Display first visit and last visit timestamps
  - Show activity count per page
  - Mobile-responsive card layout

#### Request Centre: `components/privacy-centre/request-centre.tsx`
- **Features**:
  - Submit data subject rights requests:
    - Right to Access (Section 11)
    - Right to Correction (Section 11)
    - Right to Erasure (Section 11)
    - Right to Grievance Redressal (Section 14)
    - Right to Nominate (Section 15)
  - Track request status
  - Email verification for requests

### 2. API Endpoints

#### `/api/privacy-centre/preferences` (GET, PATCH, DELETE)
- **GET**: Fetch visitor's current consent preferences
  - Returns activities with consent status
  - Includes purposes, data categories, sources, recipients
- **PATCH**: Update consent preferences
  - Upserts preferences to `visitor_consent_preferences` table
  - Triggers consent history tracking
- **DELETE**: Withdraw all consents

#### `/api/privacy-centre/pages` (GET)
- Fetches all pages where visitor gave consent
- Groups by normalized URL
- Extracts page metadata from `consent_details.metadata`
- Returns: URL, title, first visit, last visit, consent status, activity count

#### `/api/privacy-centre/rights-requests` (GET, POST, PATCH)
- **GET**: Fetch visitor's rights requests
- **POST**: Submit new rights request
  - Generates verification code
  - Stores in `dpdp_rights_requests` table
- **PATCH**: Verify request or update status (admin)

#### `/api/privacy-centre/preferences/history` (GET)
- Fetches consent change history
- Supports export formats: JSON, CSV, PDF
- Links history records to page URLs

### 3. Database Schema

#### `visitor_consent_preferences`
- Stores granular consent per activity per visitor
- Columns: `visitor_id`, `widget_id`, `activity_id`, `consent_status`
- Used by Preference Centre for current state

#### `dpdpa_consent_records`
- Stores detailed consent records from widget interactions
- Includes `consent_details` JSONB with metadata:
  - `currentUrl` - Page URL where consent was given
  - `pageTitle` - Page title
  - `ruleContext` - Display rule context (if applicable)
- Used by Pages View to show page history

#### `consent_history`
- Auto-created by database trigger
- Tracks all consent changes
- Used for history export

#### `dpdp_rights_requests`
- Stores data subject rights requests
- Includes verification workflow

### 4. Visitor ID Management

#### Flow:
1. **Widget generates visitor ID**: UUID stored in localStorage/cookie
2. **Privacy Centre reads visitor ID**:
   - From URL parameter `?visitorId=xxx` (for direct links)
   - From localStorage `consently_visitor_{widgetId}`
   - Generates new UUID if not found
3. **Consistency**: Both widget and Privacy Centre use same visitor ID format

### 5. Tracking Flow

#### When consent is given via widget:
1. Widget calls `/api/dpdpa/consent-record` (POST)
2. API stores:
   - Consent record in `dpdpa_consent_records`
   - Metadata in `consent_details.metadata`:
     - `currentUrl` - Page URL
     - `pageTitle` - Page title
     - `referrer` - Referrer URL
   - Syncs to `visitor_consent_preferences` for Preference Centre
3. Database trigger creates `consent_history` entry

#### When preferences updated in Privacy Centre:
1. User updates preferences in Preference Centre
2. Calls `/api/privacy-centre/preferences` (PATCH)
3. Updates `visitor_consent_preferences`
4. Database trigger creates `consent_history` entry

## Data Flow Diagrams

### Consent Recording Flow
```
Widget → POST /api/dpdpa/consent-record
  ↓
Store in dpdpa_consent_records (with metadata)
  ↓
Sync to visitor_consent_preferences
  ↓
Trigger creates consent_history entry
```

### Privacy Centre Access Flow
```
User visits /privacy-centre/[widgetId]
  ↓
Initialize visitor ID (URL/localStorage/new)
  ↓
Load Privacy Centre tabs:
  - Preferences: GET /api/privacy-centre/preferences
  - Pages: GET /api/privacy-centre/pages
  - Requests: GET /api/privacy-centre/rights-requests
```

## Key Features

### ✅ Implemented
- Visitor ID management (URL param, localStorage, generation)
- Consent preference management
- Page visit tracking
- Consent history export (CSV/PDF)
- Data subject rights requests
- Email verification workflow
- Mobile-responsive UI
- Error handling and loading states

### 🔍 Areas to Verify
1. **Visitor ID Synchronization**: Ensure widget and Privacy Centre use same visitor ID
2. **Page Metadata Storage**: Verify `currentUrl` and `pageTitle` are consistently stored
3. **Consent History Trigger**: Verify database trigger creates history entries correctly
4. **API Error Handling**: All endpoints have proper error handling
5. **CORS Headers**: Public endpoints have proper CORS headers

## Issues Found & Fixed

### ✅ Issue 1: Visitor ID Synchronization (FIXED)
**Problem**: Widget stores visitor ID as `consently_consent_id` in localStorage, but Privacy Centre was only checking `consently_visitor_{widgetId}`.

**Solution**: Updated Privacy Centre to:
1. Check both storage formats for backward compatibility
2. Sync visitor ID between both formats when found
3. Store new IDs in both formats for future compatibility

**Files Modified**:
- `app/privacy-centre/[widgetId]/page.tsx` - Added dual-format support

### ✅ Issue 2: Page Metadata Tracking (VERIFIED)
**Status**: Working correctly
- Consent records store `currentUrl` and `pageTitle` in `consent_details.metadata`
- Pages API correctly extracts this metadata
- URL normalization works for consistent grouping

### ✅ Issue 3: API Error Handling (VERIFIED)
**Status**: All endpoints have proper error handling
- Input validation on all endpoints
- Proper HTTP status codes
- Error messages are user-friendly
- CORS headers configured correctly

## Testing Checklist

- [x] Visitor ID persists across sessions (FIXED)
- [x] Privacy Centre loads with existing visitor ID (FIXED)
- [x] Widget and Privacy Centre use same visitor ID (FIXED)
- [x] Preferences update correctly
- [x] Pages view shows all visited pages
- [x] Page metadata (URL, title) is accurate
- [x] Consent history export works (CSV/PDF)
- [x] Rights requests can be submitted
- [x] Email verification works
- [x] Mobile responsive design works
- [x] Error states display correctly

## Performance Considerations

- Indexes on `visitor_id`, `widget_id` for fast lookups
- GIN indexes on JSONB columns for metadata queries
- Pagination may be needed for large datasets
- Caching headers on public endpoints

## Security Considerations

- Visitor ID is anonymous (UUID)
- Email hashing for privacy
- Input validation on all API endpoints
- SQL injection prevention (parameterized queries)
- CORS headers configured correctly

