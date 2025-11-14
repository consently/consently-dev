# 🔍 Privacy Centre Implementation - Current State Review

**Date**: November 4, 2025  
**Review for**: Privacy Centre with Preference Centre + Request Centre

---

## 📊 Current Infrastructure

### ✅ What You Already Have

#### 1. **Database Schema** (Supabase)
- ✅ **`processing_activities`** - Processing activities/purposes
- ✅ **`purposes`** - Master list of purposes (predefined + custom)
- ✅ **`activity_purposes`** - Junction table linking activities to purposes
- ✅ **`purpose_data_categories`** - Data categories with retention periods
- ✅ **`dpdpa_widget_configs`** - Widget configuration for consent collection
- ✅ **`dpdpa_consent_records`** - Consent records from visitors
- ✅ **`dpdpa_grievances`** - Basic grievances/complaints table (types: access, correction, deletion, withdrawal, general, complaint)
- ✅ **`data_sources`** - Data sources per activity
- ✅ **`data_recipients`** - Data recipients per activity

#### 2. **API Endpoints**
- ✅ **`/api/dpdpa/consent-record`** (GET, POST) - Manage consent records
- ✅ **`/api/dpdpa/grievances`** (GET, POST) - Submit and view grievances
- ✅ **`/api/dpdpa/purposes`** (GET, POST) - Manage purposes
- ✅ **`/api/dpdpa/activities`** - Manage processing activities
- ✅ **`/api/dpdpa/dashboard-stats`** - Dashboard statistics
- ✅ **`/api/dpdpa/analytics`** - Analytics data
- ✅ **`/api/dpdpa/widget-config`** - Widget configuration
- ✅ **`/api/dpdpa/widget-public/[widgetId]`** - Public widget data

#### 3. **UI Components**
- ✅ Basic UI components (button, card, badge, input, textarea, etc.)
- ✅ Modal component
- ✅ Checkbox component
- ✅ Table component
- ✅ Purpose manager component
- ✅ Multi-purpose selector

#### 4. **Dashboard Pages**
- ✅ `/dashboard/dpdpa` - Main DPDPA dashboard
- ✅ `/dashboard/dpdpa/activities` - Manage activities
- ✅ `/dashboard/dpdpa/records` - View consent records
- ✅ `/dashboard/dpdpa/widget` - Configure widget
- ✅ `/dashboard/dpdpa/analytics` - Analytics page

---

## 🚧 What's Missing for Privacy Centre

### ❌ Database Tables Needed

1. **`visitor_consent_preferences`** - Store individual visitor consent preferences by activity/purpose
   - Needed for: Preference Centre to show/update consents
   - Fields: visitor_id, widget_id, activity_id, purpose_id, status, timestamp, version

2. **`dpdp_rights_requests`** - Enhanced rights request tracking (separate from grievances)
   - Needed for: Request Centre with proper DPDP Act rights
   - Fields: id, visitor_id, widget_id, request_type (access, correction, erasure, grievance, nomination), status, description, response, attachments, etc.

3. **`consent_history`** - Audit trail for consent changes
   - Needed for: "Download Consent History" feature
   - Fields: visitor_id, activity_id, previous_status, new_status, change_timestamp

### ❌ API Endpoints Needed

1. **`/api/privacy-centre/preferences`** (GET, PATCH)
   - Get visitor's current consent preferences
   - Update specific consents (toggle on/off)

2. **`/api/privacy-centre/preferences/history`** (GET)
   - Get consent history for a visitor
   - Export consent history (CSV/PDF)

3. **`/api/privacy-centre/rights-requests`** (GET, POST, PATCH)
   - Submit new rights request
   - Get request status/list
   - Update request status (admin)

4. **`/api/privacy-centre/verify-visitor`** (POST)
   - OTP/email verification before showing preferences
   - Identity verification for rights requests

### ❌ Frontend Components Needed

1. **Privacy Centre Container** (`/components/privacy-centre/`)
   - Main tabbed interface (Preference Centre + Request Centre)
   - Visitor authentication/verification modal

2. **Preference Centre Tab**
   - Consent toggle list grouped by activity
   - Info icons with purpose details
   - Save/Update buttons
   - Withdraw all option
   - Download history button

3. **Request Centre Tab**
   - Rights summary cards (5 DPDP Act rights)
   - Request submission form modal
   - Request tracker/history table
   - Status badges

4. **Consent History Component**
   - Timeline view of consent changes
   - Export functionality (CSV/PDF)

### ❌ Public Pages Needed

1. **`/privacy-centre/[widgetId]`** - Public-facing Privacy Centre
   - Accessible via widget link or direct URL
   - No authentication required (visitor-based)
   - Can be embedded or standalone

---

## 🎯 Implementation Strategy

### Phase 1: Database Schema (30 min)
1. Create `visitor_consent_preferences` table
2. Create `dpdp_rights_requests` table
3. Create `consent_history` table
4. Add RLS policies

### Phase 2: API Endpoints (1-2 hours)
1. Build preference management APIs
2. Build rights request APIs
3. Build verification/authentication API
4. Add consent history export

### Phase 3: UI Components (2-3 hours)
1. Create Privacy Centre layout with tabs
2. Build Preference Centre tab
3. Build Request Centre tab
4. Add consent history viewer
5. Add export functionality

### Phase 4: Public Page (1 hour)
1. Create `/privacy-centre/[widgetId]` route
2. Integrate with widget configuration
3. Add visitor identification (local storage)
4. Test end-to-end flow

### Phase 5: Integration & Testing (1 hour)
1. Link Privacy Centre to existing widget
2. Add "Manage Preferences" link to consent widget
3. Test all flows
4. Add analytics tracking

---

## 📋 Key Decisions to Make

### 1. **Visitor Identification Method**
- Option A: Email-based (require email for all actions)
- Option B: Browser-based (localStorage + email optional)
- Option C: Hybrid (localStorage for viewing, email for changes)
- **Recommendation**: Option C (best UX + security balance)

### 2. **Authentication for Preferences**
- Option A: No auth (anyone with visitor_id can change)
- Option B: Email OTP verification
- Option C: Magic link via email
- **Recommendation**: Option B (OTP) for sensitive changes

### 3. **Rights Request Processing**
- Option A: Manual (admin reviews each)
- Option B: Semi-automated (some rights auto-fulfilled)
- Option C: Fully automated
- **Recommendation**: Option A initially, then Option B

### 4. **Consent Preference Granularity**
- Option A: Activity-level (toggle entire activity)
- Option B: Purpose-level (toggle each purpose within activity)
- Option C: Both (configurable per widget)
- **Recommendation**: Option A initially (matches screenshot)

---

## 🔧 Technical Considerations

### Widget Integration
- Add "Manage My Preferences" button to existing consent widget
- Store visitor_id in localStorage when consent first recorded
- Pass visitor_id to Privacy Centre for preference retrieval

### Data Privacy
- Hash email addresses in database
- Don't log sensitive personal data
- Add rate limiting to prevent abuse
- Implement CAPTCHA for request submissions

### Compliance
- Log all consent changes (audit trail)
- Store consent "proof" (IP, timestamp, version)
- Provide tamper-proof export
- Add digital signature to exports

### Performance
- Cache visitor preferences (Redis/localStorage)
- Paginate request history
- Optimize consent record queries
- Add CDN for public pages

---

## 📝 Next Steps

1. **Review & Approve** this document
2. **Start with Phase 1** (Database Schema)
3. **Create TODO list** for tracking
4. **Begin implementation** with incremental testing

---

## 🤔 Questions to Answer

1. Should visitors be able to see ALL their past consent records or just current?
2. How long should we retain withdrawn consent records?
3. Should we send email notifications when consent is withdrawn?
4. What response time SLA for rights requests? (e.g., 30 days per DPDP Act)
5. Should we allow anonymous grievances or require email?
6. Do we need multilingual support for Privacy Centre?

---

**Status**: Ready for Phase 1 Implementation  
**Estimated Total Time**: 6-8 hours for full implementation  
**Priority**: High (Core DPDP Act compliance feature)
