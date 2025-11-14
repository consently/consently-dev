# Product Specification Document (PRD)
## Consently - DPDPA 2023 Consent Management Platform

**Version:** 1.0.0  
**Last Updated:** January 2025  
**Status:** Production Ready

---

## 1. Executive Summary

### 1.1 Product Overview
Consently is an enterprise-grade SaaS platform designed to help Indian businesses achieve seamless compliance with the Digital Personal Data Protection Act (DPDPA) 2023. The platform provides comprehensive consent management, automated cookie scanning, and compliance reporting capabilities.

### 1.2 Target Market
- **Primary:** Indian businesses requiring DPDPA 2023 compliance
- **Secondary:** International businesses operating in India
- **Industries:** E-commerce, Banking, Healthcare, Education, Real Estate, Travel, Telecom, and more

### 1.3 Key Value Propositions
- Zero PII collection for consent management (privacy-first design)
- Automated cookie scanning and classification
- Pre-built industry-specific templates
- Multi-language support (22 Indian languages)
- Real-time compliance dashboards
- Complete audit trails and reporting

---

## 2. Product Goals & Objectives

### 2.1 Business Goals
- Enable Indian businesses to achieve DPDPA 2023 compliance within minutes
- Reduce compliance costs by 80% compared to manual processes
- Provide transparent, user-friendly consent management
- Maintain zero PII collection for enhanced privacy

### 2.2 User Goals
- **Business Users:** Quick setup, automated compliance, comprehensive reporting
- **End Users (Website Visitors):** Transparent consent, easy management, cross-device sync via Consent IDs

### 2.3 Success Metrics
- Time to first consent collection: < 15 minutes
- Cookie scanning accuracy: > 95%
- Consent completion rate: > 70%
- User satisfaction score: > 4.5/5

---

## 3. User Personas

### 3.1 Primary Persona: Compliance Manager (Admin)
**Name:** Priya Sharma  
**Role:** Data Protection Officer at an e-commerce company  
**Goals:**
- Set up DPDPA compliance quickly
- Monitor consent rates and compliance status
- Generate compliance reports for audits
- Manage data processing activities

**Pain Points:**
- Complex legal requirements
- Time-consuming manual processes
- Lack of visibility into consent data
- Cross-device user tracking challenges

### 3.2 Secondary Persona: Website Visitor (End User)
**Name:** Raj Kumar  
**Role:** Online shopper  
**Goals:**
- Understand what data is being collected
- Control consent preferences easily
- Access consent across devices
- Trust the platform with their data

**Pain Points:**
- Unclear consent notices
- Inability to manage consent across devices
- Privacy concerns with email collection
- Complex consent interfaces

---

## 4. Core Features & User Flows

### 4.1 Feature: User Authentication & Onboarding

#### 4.1.1 User Registration Flow
**Path:** Landing Page → Sign Up → Email Verification → Dashboard

**Steps:**
1. User clicks "Get Started" on landing page
2. Redirected to `/signup` page
3. User enters email and password (or uses OAuth)
4. Email verification sent (if email signup)
5. User completes onboarding wizard
6. Redirected to dashboard

**Acceptance Criteria:**
- Support email/password and OAuth (Google, Twitter, Apple)
- Email verification required for email signup
- Onboarding wizard guides through initial setup
- RLS policies enforce user data isolation

#### 4.1.2 User Login Flow
**Path:** Landing Page → Login → Dashboard

**Steps:**
1. User clicks "Login" on landing page
2. Redirected to `/login` page
3. User enters credentials or uses OAuth
4. Authentication successful
5. Redirected to dashboard (`/dashboard/cookies`)

**Acceptance Criteria:**
- Secure authentication via Supabase Auth
- Session management with JWT tokens
- Protected routes require authentication
- Redirect to intended page after login

---

### 4.2 Feature: Cookie Consent Management

#### 4.2.1 Cookie Scanning Flow
**Path:** Dashboard → Cookies → Scan Website → Review Results

**Steps:**
1. Admin navigates to `/dashboard/cookies`
2. Clicks "Scan Website" button
3. Enters website URL
4. Selects scan type (Quick/Standard/Deep Crawl)
5. System scans and discovers cookies
6. Results displayed with classification
7. Admin reviews and edits cookie details
8. Cookies saved to database

**Acceptance Criteria:**
- Support for Quick (homepage), Standard (10 URLs), Deep (50+ pages) scans
- Automatic cookie classification (Essential, Analytics, Marketing, etc.)
- Cookie details: name, domain, purpose, expiry, category
- Ability to edit cookie information
- Export scan results (CSV/JSON)

#### 4.2.2 Cookie Banner Customization Flow
**Path:** Dashboard → Cookies → Customize Banner → Preview → Deploy

**Steps:**
1. Admin navigates to cookie banner settings
2. Customizes banner appearance (colors, position, text)
3. Selects cookie categories to display
4. Configures display rules (when to show)
5. Preview banner in modal
6. Saves configuration
7. Generates widget embed code
8. Admin copies code to website

**Acceptance Criteria:**
- Visual customization: colors, fonts, position (top/bottom)
- Text customization for all supported languages
- Display rules: first visit, page-specific, time-based
- Preview functionality before deployment
- Widget code generation with unique widget ID

#### 4.2.3 Cookie Consent Collection Flow (End User)
**Path:** Website Visit → Banner Display → User Interaction → Consent Recorded

**Steps:**
1. Visitor lands on website with widget installed
2. Widget checks for existing consent (localStorage)
3. If no consent, banner displayed
4. User reviews cookie categories
5. User accepts/rejects categories
6. Consent recorded via API
7. Preferences applied to website
8. Banner dismissed

**Acceptance Criteria:**
- Banner displays on first visit (or based on rules)
- Granular category selection (Essential, Analytics, Marketing, etc.)
- Consent stored with unique session ID
- Preferences persist in localStorage
- Widget applies preferences (blocks/allows cookies)

---

### 4.3 Feature: DPDPA Consent Management

#### 4.3.1 Processing Activities Setup Flow
**Path:** Dashboard → DPDPA → Processing Activities → Industry Templates → Create Activities

**Steps:**
1. Admin navigates to `/dashboard/dpdpa`
2. Clicks "Processing Activities" tab
3. Clicks "Industry Templates" button
4. Selects industry (E-commerce, Banking, Healthcare, etc.)
5. Reviews pre-loaded activities
6. Selects relevant activities (bulk select supported)
7. Clicks "Add X Activities"
8. Activities saved to database
9. Admin can edit individual activities

**Acceptance Criteria:**
- 8+ industry templates available
- Each template includes 6+ pre-configured activities
- Activities include: name, purpose, data categories, retention, legal basis
- Ability to edit activities after creation
- Custom activity creation supported

#### 4.3.2 Widget Configuration Flow
**Path:** Dashboard → DPDPA → Widget → Configure → Generate Code

**Steps:**
1. Admin navigates to Widget tab
2. Selects processing activities to include
3. Chooses widget type (Modal/Banner/Slide-in)
4. Customizes appearance (theme, colors, layout)
5. Configures display rules (URL patterns, triggers)
6. Generates privacy notice (optional)
7. Saves configuration
8. Copies widget embed code
9. Embeds code on website

**Acceptance Criteria:**
- Select multiple processing activities
- Three widget types: Modal, Banner, Slide-in
- Full customization: theme, colors, position
- Display rules: URL patterns, page-specific, triggers
- Privacy notice auto-generation from activities
- Unique widget ID per configuration

#### 4.3.3 Consent Collection Flow (End User)
**Path:** Website Visit → Consent Notice → Review Activities → Provide Consent → Receive Consent ID

**Steps:**
1. Visitor lands on website with DPDPA widget
2. Widget checks for Consent ID in localStorage
3. If no ID, shows consent notice
4. User reviews privacy notice (downloadable)
5. User sees list of processing activities
6. User accepts/rejects individual activities
7. User clicks "Accept" or "Reject All"
8. Consent recorded with unique Consent ID (format: CNST-XXXX-XXXX-XXXX)
9. Consent ID displayed to user
10. User can copy/download Consent ID
11. Preferences saved in localStorage

**Acceptance Criteria:**
- Consent ID format: CNST-XXXX-XXXX-XXXX (12 alphanumeric characters)
- Granular per-activity consent
- Consent ID displayed prominently after consent
- Copy and download functionality for Consent ID
- Consent receipt generation (PDF)
- Preferences persist in localStorage

#### 4.3.4 Consent ID Verification Flow (Cross-Device)
**Path:** New Device → Enter Consent ID → Verify → Load Preferences

**Steps:**
1. User visits website on new device
2. Widget detects no Consent ID in localStorage
3. Shows "Do you have a Consent ID?" prompt
4. User enters Consent ID
5. Widget calls verification API
6. API validates Consent ID
7. If valid, preferences loaded
8. User sees their previous consent choices
9. User can modify consent if needed

**Acceptance Criteria:**
- Consent ID verification API endpoint
- Validates Consent ID format and existence
- Returns consent preferences if valid
- Error handling for invalid IDs
- Option to start fresh if ID not found

---

### 4.4 Feature: Analytics & Reporting

#### 4.4.1 Consent Analytics Dashboard
**Path:** Dashboard → Reports → View Analytics

**Steps:**
1. Admin navigates to `/dashboard/reports`
2. Views consent rate metrics
3. Filters by date range, device type, geography
4. Views consent trends chart
5. Views device breakdown chart
6. Views geographic distribution chart
7. Exports data (CSV/JSON/PDF)

**Acceptance Criteria:**
- Real-time consent rate calculation
- Time-series charts (daily/weekly/monthly)
- Device breakdown (Desktop/Mobile/Tablet)
- Geographic distribution by country/state
- Filtering and date range selection
- Export functionality (CSV/JSON/PDF)

#### 4.4.2 Audit Trail & Compliance Reports
**Path:** Dashboard → Audit → View Records → Export Report

**Steps:**
1. Admin navigates to `/dashboard/audit`
2. Views consent records table
3. Searches by Consent ID, session ID, date
4. Views individual consent details
5. Generates compliance report
6. Exports report (CSV/JSON/PDF)

**Acceptance Criteria:**
- Complete consent history with timestamps
- Search functionality (Consent ID, date range)
- Individual record details: activities, preferences, device info
- Compliance report generation
- Export formats: CSV, JSON, PDF
- Report includes: consent rates, activities, timestamps, IP addresses

---

### 4.5 Feature: Privacy Centre

#### 4.5.1 Privacy Centre Widget
**Path:** Website → Privacy Centre Link → Privacy Centre Page

**Steps:**
1. User clicks "Privacy Centre" link on website
2. Redirected to `/privacy-centre/[widgetId]`
3. User sees privacy notice
4. User can view/modify consent preferences
5. User can submit data subject rights requests
6. User can download consent receipt

**Acceptance Criteria:**
- Public-facing privacy centre page
- Display privacy notice
- Show current consent preferences
- Allow consent modification
- Data subject rights request form
- Consent receipt download

#### 4.5.2 Data Subject Rights Management
**Path:** Dashboard → Privacy Centre → Rights Requests → Process Request

**Steps:**
1. User submits rights request via privacy centre
2. Request logged in database
3. Admin views request in dashboard
4. Admin processes request (Access/Correction/Erasure)
5. Admin updates request status
6. User receives notification (email)

**Acceptance Criteria:**
- Support for Access, Correction, Erasure, Grievance requests
- Request tracking with 72-hour SLA
- Status updates (Pending/In Progress/Completed)
- Email notifications
- Request history and audit trail

---

### 4.6 Feature: Settings & Configuration

#### 4.6.1 User Profile Management
**Path:** Dashboard → Settings → Profile → Update → Save

**Steps:**
1. Admin navigates to `/dashboard/settings`
2. Clicks "Profile" tab
3. Views current profile information
4. Edits name, email, company details
5. Saves changes
6. Confirmation message displayed

**Acceptance Criteria:**
- View and edit profile information
- Email change requires verification
- Company/organization details editable
- Profile picture upload (optional)
- Changes saved to database

#### 4.6.2 Security Settings
**Path:** Dashboard → Settings → Security → Enable 2FA → Configure

**Steps:**
1. Admin navigates to Security tab
2. Views current security settings
3. Enables two-factor authentication
4. Scans QR code with authenticator app
5. Enters verification code
6. 2FA enabled successfully

**Acceptance Criteria:**
- Two-factor authentication support (TOTP)
- QR code generation for authenticator apps
- Backup codes generation
- Session management (view active sessions)
- Password change functionality

#### 4.6.3 Billing & Subscription Management
**Path:** Dashboard → Settings → Billing → View Plan → Upgrade/Downgrade

**Steps:**
1. Admin navigates to Billing tab
2. Views current subscription plan
3. Views usage metrics (consents/month)
4. Clicks "Upgrade" or "Change Plan"
5. Redirected to Razorpay payment page
6. Completes payment
7. Subscription updated

**Acceptance Criteria:**
- Display current plan (Small/Medium/Enterprise)
- Show usage vs. limits
- Plan upgrade/downgrade functionality
- Razorpay payment integration
- Invoice generation and download
- Payment history

---

## 5. Technical Architecture

### 5.1 Technology Stack

#### Frontend
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript 5+
- **UI Library:** React 19
- **Styling:** Tailwind CSS v4
- **Forms:** React Hook Form + Zod validation
- **State Management:** Zustand
- **Icons:** Lucide React

#### Backend
- **Database:** Supabase (PostgreSQL 15+)
- **Authentication:** Supabase Auth (OAuth2/JWT)
- **API:** Next.js Route Handlers (RESTful)
- **Real-time:** Supabase Realtime subscriptions
- **Storage:** Supabase Storage (S3-compatible)

#### Infrastructure
- **Hosting:** Vercel
- **CDN:** Vercel Edge Network
- **Payment:** Razorpay
- **Email:** Integration-ready (SendGrid/SES)

### 5.2 Database Schema

#### Key Tables
- `users` - User accounts and profiles
- `consent_records` - DPDPA consent records with Consent IDs
- `cookie_scans` - Cookie scanning results
- `cookies` - Cookie definitions and classifications
- `processing_activities` - DPDPA processing activities
- `widgets` - Widget configurations
- `subscriptions` - Subscription plans and billing
- `audit_logs` - System audit trail

#### Security
- Row Level Security (RLS) enabled on all tables
- Email tokenization for privacy protection
- AES-256 encryption at rest
- TLS 1.3 encryption in transit

### 5.3 API Endpoints

#### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/callback` - OAuth callback

#### Cookie Management
- `POST /api/cookies/scan` - Scan website for cookies
- `GET /api/cookies` - List cookies
- `PUT /api/cookies/:id` - Update cookie
- `DELETE /api/cookies/:id` - Delete cookie
- `GET /api/cookies/translations` - Get translations

#### DPDPA Consent
- `POST /api/dpdpa/consent-record` - Record consent
- `GET /api/dpdpa/check-consent` - Check existing consent
- `POST /api/dpdpa/verify-consent-id` - Verify Consent ID
- `GET /api/dpdpa/activities` - List processing activities
- `POST /api/dpdpa/activities` - Create activity

#### Analytics & Reports
- `GET /api/reports/analytics` - Get analytics data
- `GET /api/reports/consent-trends` - Get consent trends
- `GET /api/audit/records` - Get audit records
- `POST /api/reports/export` - Export report

---

## 6. User Stories

### 6.1 Authentication & Onboarding
- **US-001:** As a new user, I want to sign up with email/password or OAuth so that I can quickly create an account
- **US-002:** As a user, I want to complete an onboarding wizard so that I understand the platform features
- **US-003:** As a user, I want to log in securely so that I can access my dashboard

### 6.2 Cookie Management
- **US-004:** As an admin, I want to scan my website for cookies so that I can discover all cookies automatically
- **US-005:** As an admin, I want to classify cookies by category so that I can manage consent properly
- **US-006:** As an admin, I want to customize the cookie banner so that it matches my brand
- **US-007:** As a website visitor, I want to see a clear cookie banner so that I understand what cookies are used
- **US-008:** As a website visitor, I want to accept/reject cookie categories so that I control my privacy

### 6.3 DPDPA Consent
- **US-009:** As an admin, I want to use industry templates so that I can set up compliance quickly
- **US-010:** As an admin, I want to configure a consent widget so that I can collect user consent
- **US-011:** As a website visitor, I want to see processing activities so that I understand data usage
- **US-012:** As a website visitor, I want to provide granular consent so that I control what data is processed
- **US-013:** As a website visitor, I want to receive a Consent ID so that I can access my consent across devices
- **US-014:** As a website visitor, I want to verify my Consent ID so that I can sync preferences on new devices

### 6.4 Analytics & Reporting
- **US-015:** As an admin, I want to view consent analytics so that I can track compliance metrics
- **US-016:** As an admin, I want to export compliance reports so that I can share with legal teams
- **US-017:** As an admin, I want to search consent records so that I can find specific user consents

### 6.5 Privacy Centre
- **US-018:** As a website visitor, I want to access a privacy centre so that I can manage my consent
- **US-019:** As a website visitor, I want to submit data rights requests so that I can exercise my DPDPA rights
- **US-020:** As an admin, I want to process data rights requests so that I can comply with DPDPA requirements

---

## 7. Non-Functional Requirements

### 7.1 Performance
- Page load time: < 2 seconds
- API response time: < 500ms (p95)
- Widget load time: < 1 second
- Cookie scan completion: < 5 minutes (50 pages)

### 7.2 Security
- OWASP Top 10 compliance
- SOC 2 Type II controls
- Row Level Security (RLS) on all tables
- Email tokenization for privacy
- AES-256 encryption at rest
- TLS 1.3 encryption in transit

### 7.3 Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- RTL language support

### 7.4 Scalability
- Support 100,000+ consents/month (Medium plan)
- Support unlimited consents (Enterprise plan)
- Horizontal scaling via Vercel
- Database connection pooling

### 7.5 Reliability
- 99.9% uptime SLA
- Automated backups (daily)
- Disaster recovery plan
- Error monitoring and alerting

### 7.6 Localization
- Support for 22 Indian languages
- Auto-translation capabilities
- RTL language support
- Language detection and switching

---

## 8. Integration Requirements

### 8.1 Payment Integration
- **Provider:** Razorpay
- **Features:** Subscription management, one-time payments, invoice generation
- **Plans:** Small (₹999/month), Medium (₹2,499/month), Enterprise (custom)

### 8.2 Email Integration
- **Purpose:** Email verification, notifications, consent receipts
- **Providers:** SendGrid, AWS SES (integration-ready)
- **Features:** Transactional emails, templates, delivery tracking

### 8.3 Widget Integration
- **Deployment:** CDN-hosted JavaScript widget
- **Embedding:** Single script tag
- **Features:** Async loading, no blocking, cross-domain support

---

## 9. Success Criteria & KPIs

### 9.1 User Adoption
- Monthly Active Users (MAU)
- Sign-up conversion rate: > 30%
- Onboarding completion rate: > 80%

### 9.2 Feature Usage
- Cookie scanning usage: > 70% of users
- Industry template adoption: > 60% of users
- Consent ID usage: > 50% of end users

### 9.3 Performance Metrics
- Average time to first consent: < 15 minutes
- Cookie scan accuracy: > 95%
- Widget load success rate: > 99%

### 9.4 Business Metrics
- Customer retention rate: > 85%
- Net Promoter Score (NPS): > 50
- Support ticket volume: < 5% of MAU

---

## 10. Future Roadmap

### Q1 2025
- Advanced analytics dashboard
- API documentation portal
- Mobile application (iOS/Android)

### Q2 2025
- Enterprise SSO integration
- Advanced display rules engine
- Multi-widget support

### Q3 2025
- AI-powered compliance recommendations
- Automated compliance scoring
- Third-party integrations marketplace

---

## 11. Testing Requirements

### 11.1 Functional Testing
- All user flows tested end-to-end
- Cookie scanning accuracy validation
- Consent ID generation and verification
- Widget functionality across browsers
- API endpoint testing

### 11.2 Security Testing
- Authentication and authorization testing
- RLS policy validation
- Input validation and sanitization
- SQL injection prevention
- XSS prevention

### 11.3 Performance Testing
- Load testing (1000+ concurrent users)
- Stress testing (cookie scanning)
- API response time validation
- Widget load time optimization

### 11.4 Accessibility Testing
- WCAG 2.1 AA compliance validation
- Screen reader compatibility
- Keyboard navigation testing
- Color contrast validation

---

## 12. Glossary

- **DPDPA:** Digital Personal Data Protection Act 2023 (India)
- **Consent ID:** Unique identifier for user consent (format: CNST-XXXX-XXXX-XXXX)
- **Processing Activity:** Data processing operation requiring consent
- **Widget:** Embeddable JavaScript component for consent collection
- **Privacy Centre:** Public-facing page for consent management
- **RLS:** Row Level Security (database security feature)
- **PII:** Personally Identifiable Information

---

**Document Status:** Approved for TestSprite Testing  
**Next Review Date:** February 2025

