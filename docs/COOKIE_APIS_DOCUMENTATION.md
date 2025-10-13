# Cookie Management API Documentation

## Overview

This document provides comprehensive documentation for the Cookie Management APIs in the Consently platform. All APIs are production-ready, include authentication, validation, audit logging, and error handling.

## Table of Contents

1. [Banner Configuration API](#banner-configuration-api)
2. [Cookie Analytics API](#cookie-analytics-api)
3. [Compliance Check API](#compliance-check-api)
4. [Widget Translations API](#widget-translations-api)

---

## Banner Configuration API

**Base Path:** `/api/cookies/banner`

Manage cookie consent banner configurations with comprehensive customization options.

### Features
- Full CRUD operations
- Theme customization (colors, fonts, borders)
- Position & layout options
- Button customization
- Version history tracking
- Multi-banner support

### Endpoints

#### GET /api/cookies/banner

Get banner configurations.

**Query Parameters:**
- `id` (string, optional) - Get specific banner by ID
- `active` (boolean, optional) - Filter by active status
- `versions` (boolean, optional) - Include version history

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Default Banner",
    "position": "bottom",
    "layout": "bar",
    "theme": {
      "primaryColor": "#4F46E5",
      "backgroundColor": "#FFFFFF",
      "textColor": "#1F2937"
    },
    "is_active": true
  }
}
```

#### POST /api/cookies/banner

Create a new banner configuration with full theme customization.

#### PUT /api/cookies/banner

Update an existing banner configuration.

#### DELETE /api/cookies/banner

Delete a banner configuration.

---

## Cookie Analytics API

**Base Path:** `/api/cookies/analytics`

Real-time analytics and insights for cookie consent.

### Features
- Real-time consent metrics
- Custom date range analytics
- Category-wise breakdown
- Trend analysis
- Export functionality (JSON, CSV)
- Device & browser analytics

### Endpoints

#### GET /api/cookies/analytics

Get comprehensive analytics with customizable date ranges and granularity.

#### POST /api/cookies/analytics

Generate custom analytics reports with filters and save them.

---

## Compliance Check API

**Base Path:** `/api/cookies/compliance`

Automated compliance checking and reporting.

### Features
- Run compliance checks (GDPR, DPDPA, CCPA, etc.)
- Generate compliance reports
- Get actionable recommendations
- Schedule periodic checks
- Track compliance score over time

### Endpoints

#### GET /api/cookies/compliance

Get compliance status and history.

#### POST /api/cookies/compliance

Run a new compliance check.

#### PUT /api/cookies/compliance

Schedule or update compliance checks.

#### DELETE /api/cookies/compliance

Delete a scheduled compliance check.

---

## Widget Translations API

**Base Path:** `/api/cookies/translations`

Multi-language support for cookie consent widgets.

### Features
- Manage translations for 16+ languages
- Language detection
- Translation validation
- Import/export translations
- RTL language support

### Supported Languages

English, Spanish, French, German, Italian, Portuguese, Dutch, Polish, Russian, Japanese, Chinese, Korean, Arabic (RTL), Hebrew (RTL), Hindi, Bengali

### Endpoints

#### GET /api/cookies/translations

Get widget translations with language filtering.

#### POST /api/cookies/translations

Create or import translations (single or bulk).

#### PUT /api/cookies/translations

Update existing translation.

#### DELETE /api/cookies/translations

Delete a translation.

---

## Authentication

All APIs require authentication via session token.

## Error Handling

All APIs return consistent error responses with detailed validation messages.

## Audit Logging

All API calls are logged for audit purposes.
