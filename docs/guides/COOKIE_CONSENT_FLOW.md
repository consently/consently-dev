# Cookie Consent Module - Complete User Flow

## Overview

This document describes the complete journey from website scanning to cookie consent collection.

---

## 🗺️ High-Level Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           COOKIE CONSENT MODULE FLOW                                 │
└─────────────────────────────────────────────────────────────────────────────────────┘

                                    USER JOURNEY
                                         │
     ┌───────────────────────────────────┼───────────────────────────────────┐
     │                                   │                                   │
     ▼                                   ▼                                   ▼
┌─────────┐                        ┌──────────┐                        ┌──────────┐
│  STEP 1 │                        │  STEP 2  │                        │  STEP 3  │
│  SCAN   │  ──────────────────▶   │ CUSTOMIZE│  ──────────────────▶   │ INSTALL  │
│ WEBSITE │                        │  BANNER  │                        │  WIDGET  │
└─────────┘                        └──────────┘                        └──────────┘
     │                                   │                                   │
     ▼                                   ▼                                   ▼
 Detect &                           Configure                           Add script
 categorize                        appearance &                         to website
 cookies                           categories                               │
     │                                   │                                   │
     └───────────────────────────────────┴───────────────────────────────────┘
                                         │
                                         ▼
                               ┌──────────────────┐
                               │     STEP 4       │
                               │    VISITORS      │
                               │ GIVE CONSENT     │
                               └──────────────────┘
                                         │
                                         ▼
                               ┌──────────────────┐
                               │     STEP 5       │
                               │ VIEW ANALYTICS   │
                               │   & RECORDS      │
                               └──────────────────┘
```

---

## 📋 Detailed Step-by-Step Flow

### STEP 1: Scan Website for Cookies
**Location:** `/dashboard/cookies/scan`  
**File:** `app/dashboard/cookies/scan/page.tsx`

#### What Happens:
1. User enters their website URL
2. Selects scan depth (shallow/medium/deep)
3. Clicks "Scan Website"

#### Backend Process:
```
User clicks "Scan" 
    ↓
POST /api/cookies/scan
    ↓
CookieScanner.scanWebsite() [lib/cookies/cookie-scanner.ts]
    ↓
├── Creates scan record in cookie_scan_history (status: 'pending')
├── Fetches website pages based on depth
├── Extracts all cookies from HTTP headers
├── Classifies cookies using knowledge database
│   └── Categories: necessary, functional, analytics, advertising, social
├── Updates scan record with results (status: 'completed')
└── Returns classified cookie list
```

#### Data Stored:
- **Table:** `cookie_scan_history`
- **Fields:** `scan_id`, `website_url`, `cookies_data`, `classification`, `compliance_score`, `scan_status`

#### UI Shows:
- Cookie count per category
- Compliance score
- Third-party vs First-party breakdown
- Detailed cookie list with:
  - Cookie name
  - Domain
  - Category
  - Expiry
  - Purpose
  - Provider

---

### STEP 2: Generate & Customize Banner
**Location:** Still on `/dashboard/cookies/scan` (modal)  
**File:** `components/cookie/BannerCustomizationModal.tsx`

#### What Happens:
1. User clicks "Customize & Generate Banner"
2. Modal opens with pre-filled data from scan
3. User customizes:

```
┌────────────────────────────────────────────────────────┐
│              BANNER CUSTOMIZATION                       │
├────────────────────────────────────────────────────────┤
│                                                         │
│  📝 CONTENT TAB                                         │
│  ├── Title (e.g., "🍪 We value your privacy")          │
│  ├── Message text                                       │
│  ├── Button labels (Accept/Reject/Settings)            │
│  ├── Cookie categories (auto-selected from scan)       │
│  └── Supported languages (22 Indian languages)         │
│                                                         │
│  🎨 THEME TAB                                           │
│  ├── Primary color                                      │
│  ├── Background color                                   │
│  ├── Text color                                         │
│  ├── Font family                                        │
│  ├── Border radius                                      │
│  └── Theme presets                                      │
│                                                         │
│  📐 LAYOUT TAB                                          │
│  ├── Position (top/bottom/center)                      │
│  ├── Layout style (bar/box/modal)                      │
│  └── Privacy policy URLs                               │
│                                                         │
└────────────────────────────────────────────────────────┘
```

#### Backend Process:
```
User clicks "Save & Generate"
    ↓
├── Step 1: Create Banner Template
│   POST /api/cookies/banner
│   └── Saves to banner_configs table
│
├── Step 2: Create Widget Configuration  
│   POST /api/cookies/widget-config
│   └── Saves to widget_configs table
│   └── Links to banner_template_id
│
└── Returns: widgetId (e.g., "cnsty_m1234_abc789")
```

#### Data Stored:
- **Table:** `banner_configs` - Theme, content, styling
- **Table:** `widget_configs` - Domain, categories, behavior settings

---

### STEP 3: Install Widget on Website
**Location:** `/dashboard/cookies/widget`  
**File:** `app/dashboard/cookies/widget/page.tsx`

#### What User Does:
1. Copy the embed code snippet
2. Paste into website's HTML (before `</body>`)

#### Embed Code Example:
```html
<!-- Consently Cookie Consent Widget -->
<script src="https://www.consently.in/widget.js" 
        data-consently-id="cnsty_m1234_abc789" 
        defer></script>
```

#### Platform-Specific Instructions Available:
- HTML (generic)
- WordPress
- Shopify
- Wix
- React/Next.js
- Squarespace
- Webflow

---

### STEP 4: Visitor Gives Consent
**Location:** Customer's website  
**File:** `public/widget.js`

#### Widget Load Process:
```
Browser loads widget.js
    ↓
Widget initializes
    ↓
Checks for existing consent in localStorage
    ↓
├── If consent exists → Apply saved preferences
│
└── If no consent → Show banner
        ↓
    GET /api/cookies/widget-public/{widgetId}
        ↓
    ├── Fetches widget configuration
    ├── Fetches banner styling
    ├── Fetches scanned cookies (if available)
    └── Returns all data to widget
        ↓
    Renders consent banner
```

#### Banner Display:
```
┌─────────────────────────────────────────────────────────────────┐
│  🍪 We value your privacy                                        │
│                                                                   │
│  We use cookies to enhance your experience...                    │
│                                                                   │
│  [Accept All]  [Reject All]  [Cookie Settings]                  │
└─────────────────────────────────────────────────────────────────┘
```

#### When User Clicks "Cookie Settings":
```
┌─────────────────────────────────────────────────────────────────┐
│  Preferences                               [🌐 English ▼]        │
│                                                                   │
│  ☑ Essential Cookies (Required)                                 │
│    Essential for website functionality                           │
│    [Hide cookies ▲]                                              │
│    ┌────────────────────────────────────────────────────────┐   │
│    │ session_id - Internal - Session                         │   │
│    │ csrf_token - Internal - 24 hours                         │   │
│    └────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ☐ Analytics Cookies                                 3 cookies   │
│    Help us understand visitor behavior                           │
│    [View cookies ▼]                                              │
│                                                                   │
│  ☐ Advertising Cookies                               2 cookies   │
│    Used for targeted advertising                                 │
│    [View cookies ▼]                                              │
│                                                                   │
│              [Save Preferences]  [Cancel]                        │
└─────────────────────────────────────────────────────────────────┘
```

#### Consent Recording:
```
User clicks "Accept All" or "Save Preferences"
    ↓
POST /api/cookies/consent
    ↓
├── Generates unique consent_id
├── Records categories accepted/rejected
├── Stores device info, IP, user agent
├── Saves to consent_records table
├── Saves to consent_logs table
└── Returns consent receipt
    ↓
Widget stores in localStorage
    ↓
Applies cookie blocking/allowing based on preferences
```

---

### STEP 5: View Analytics & Records
**Location:** `/dashboard/cookies` (Overview)  
**Files:** 
- `app/dashboard/cookies/page.tsx` - Dashboard
- `app/dashboard/cookies/records/page.tsx` - Consent records
- `app/dashboard/cookies/widget-stats/[widgetId]/page.tsx` - Widget analytics

#### Dashboard Shows:
```
┌─────────────────────────────────────────────────────────────────┐
│  COOKIE CONSENT OVERVIEW                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  📊 STATISTICS                                                   │
│  ├── Total Consents: 1,234                                       │
│  ├── This Week: 89                                               │
│  ├── Conversion Rate: 76.5%                                      │
│  └── Accept Rate: 82.3%                                          │
│                                                                   │
│  📈 TRENDS                                                       │
│  └── [Chart showing consent over time]                           │
│                                                                   │
│  🕐 RECENT CONSENTS                                              │
│  ├── con_123... | Accepted | Desktop | 2 mins ago               │
│  ├── con_456... | Partial  | Mobile  | 5 mins ago               │
│  └── con_789... | Rejected | Tablet  | 10 mins ago              │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Alternate Flows

### Flow A: Existing Users (Already have widget, never scanned)

```
Widget loads on customer's website
    ↓
GET /api/cookies/widget-public/{widgetId}
    ↓
API checks for scan data
    ↓
No scan found for domain
    ↓
├── Triggers background scan automatically
├── Returns widget config (without cookie details)
└── Widget shows banner (without detailed cookies)
    ↓
Background scan completes (1-5 mins)
    ↓
Next visitor sees full cookie details
```

### Flow B: Manual Widget Setup (Skip scanning)

```
User goes to /dashboard/cookies/widget
    ↓
Configures widget manually
    ↓
├── Sets domain
├── Selects categories
├── Customizes appearance
└── Saves configuration
    ↓
Gets embed code
    ↓
Installs on website
    ↓
Banner shows with selected categories
(But no detailed cookie list until scan is run)
```

### Flow C: Re-scanning Existing Widget

```
User goes to /dashboard/cookies/scan
    ↓
Scans the same domain again
    ↓
New scan results update cookie_scan_history
    ↓
Widget API fetches latest scan
    ↓
Widget shows updated cookie information
```

---

## 📁 Key Files Reference

| Step | File | Purpose |
|------|------|---------|
| Scan Page | `app/dashboard/cookies/scan/page.tsx` | UI for scanning |
| Scanner Logic | `lib/cookies/cookie-scanner.ts` | Cookie detection & classification |
| Scan API | `app/api/cookies/scan/route.ts` | Scan endpoint |
| Banner Modal | `components/cookie/BannerCustomizationModal.tsx` | Customization UI |
| Widget Settings | `app/dashboard/cookies/widget/page.tsx` | Widget configuration |
| Widget Config API | `app/api/cookies/widget-config/route.ts` | Save/fetch widget config |
| Widget Public API | `app/api/cookies/widget-public/[widgetId]/route.ts` | Public endpoint for widget.js |
| Widget Script | `public/widget.js` | Client-side consent banner |
| Consent API | `app/api/cookies/consent/route.ts` | Record consent |
| Records Page | `app/dashboard/cookies/records/page.tsx` | View consent records |

---

## 📊 Database Tables

| Table | Purpose |
|-------|---------|
| `cookie_scan_history` | Stores scan results with cookie data |
| `widget_configs` | Widget settings (domain, categories, behavior) |
| `banner_configs` | Banner appearance (theme, text, buttons) |
| `consent_records` | Individual consent records |
| `consent_logs` | Detailed consent event logs |
| `cookie_categories` | Custom category definitions |

---

## 🎯 Summary

The complete flow is:

1. **SCAN** → Detect what cookies exist on the website
2. **CUSTOMIZE** → Configure how the banner looks and what categories to show
3. **INSTALL** → Add one line of code to the website
4. **COLLECT** → Visitors see banner and give/deny consent
5. **ANALYZE** → View consent statistics and records

Each step flows naturally into the next, with data being passed and stored appropriately to create a seamless experience.
