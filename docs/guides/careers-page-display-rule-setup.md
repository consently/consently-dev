# Careers Page Display Rule Setup Guide

## Overview
This guide helps you configure the DPDPA widget to show recruitment-specific consent notices on your `/careers` page.

## Problem
When display rules are configured, the widget operates in **STRICT mode** and only shows when a rule matches the current page. This prevents mixing purposes from different contexts (e.g., showing e-commerce activities on a job application page).

## Solution
Create recruitment-specific processing activities and a display rule for `/careers`.

---

## Step 1: Create Recruitment Processing Activities

Go to **Dashboard → DPDPA → Processing Activities** and create these activities:

### Activity 1: Job Application Processing
- **Activity Name**: `Job Application Processing`
- **Industry**: `Other Industries`
- **Purposes**:
  - **Purpose**: `Transaction Processing`
  - **Legal Basis**: `Contract`
  - **Data Categories**:
    - Full Name (Retention: 3 years from application date)
    - Email Address (Retention: 3 years from application date)
    - Phone Number (Retention: 3 years from application date)
    - Resume/CV (Retention: 3 years from application date)
    - Cover Letter (Retention: 3 years from application date)
    - Work Experience (Retention: 3 years from application date)
    - Education Details (Retention: 3 years from application date)
    - Portfolio Links (Retention: 3 years from application date)
- **Data Sources**: 
  - Careers Page Form
  - Job Application Portal
  - Email Submissions
- **Data Recipients**:
  - HR Team
  - Hiring Managers
  - Recruitment Software (e.g., ATS)

### Activity 2: Recruitment Communications
- **Activity Name**: `Recruitment Communications`
- **Industry**: `Other Industries`
- **Purposes**:
  - **Purpose**: `Communication`
  - **Legal Basis**: `Legitimate Interest`
  - **Data Categories**:
    - Full Name (Retention: 3 years from last communication)
    - Email Address (Retention: 3 years from last communication)
    - Phone Number (Retention: 3 years from last communication)
    - Application Status (Retention: 3 years from last communication)
    - Interview Scheduling (Retention: 3 years from last communication)
- **Data Sources**: 
  - Email System
  - SMS Gateway
  - ATS (Applicant Tracking System)
- **Data Recipients**:
  - HR Team
  - Hiring Managers
  - Email Service Provider

### Activity 3: Background Verification (Optional - only if you do background checks)
- **Activity Name**: `Employment Background Verification`
- **Industry**: `Other Industries`
- **Purposes**:
  - **Purpose**: `Legal Compliance`
  - **Legal Basis**: `Consent`
  - **Data Categories**:
    - Previous Employment Details (Retention: 7 years)
    - Education Verification (Retention: 7 years)
    - Reference Contacts (Retention: 7 years)
    - Criminal Record Check (Retention: 7 years)
    - Identity Verification Documents (Retention: 7 years)
- **Data Sources**: 
  - Candidate Application
  - Background Verification Service
  - Reference Checks
- **Data Recipients**:
  - Background Verification Agencies
  - HR Team
  - Compliance Team

---

## Step 2: Configure Display Rule for /careers

Once you've created the activities above, note their **Activity IDs** (UUIDs) from the Processing Activities page.

### Go to: Dashboard → DPDPA → Widget Configuration

1. Scroll to the **"Display Rules"** section
2. Click **"Add Rule"**
3. Configure the rule:

```
Rule Name: Careers Page - Job Applications
URL Pattern: /careers
URL Match Type: exact (or "startsWith" if you have /careers/*)
Trigger Type: onPageLoad
Trigger Delay: 1000 (ms)
Priority: 100 (high priority)
Active: ✓ Yes
```

### Select Activities
In the rule modal, under **"Filter Activities"**:
- ✓ Check `Job Application Processing`
- ✓ Check `Recruitment Communications`
- ✓ Check `Employment Background Verification` (if created)
- Leave all other activities unchecked

### Customize Notice Content (Recommended)
Override the default widget message with careers-specific text:

**Title**: `Join Our Team!`

**Message**:
```
We're excited about your interest in joining our team! To process your job application, 
we need your consent to collect and process your personal information. 

Please review the data processing activities below and select your preferences.
```

4. Click **Save** in the modal
5. Click **Save Configuration** at the bottom of the page

---

## Step 3: Test the Configuration

1. Open your website at `/careers`
2. The widget should now appear with only recruitment-related activities
3. Verify the custom message is displayed
4. Test that consent records are created properly

---

## Alternative: Quick Fix (Not Recommended)

If you want the widget to show on ALL pages without filtering:

1. Go to **Display Rules** section
2. Delete all existing display rules
3. Ensure `autoShow: true` is enabled in Basic Settings
4. Save configuration

**⚠️ Warning**: This approach shows all activities on every page, which:
- Confuses users (e.g., showing "Payment Processing" on careers page)
- Violates DPDPA purpose limitation principles
- Reduces conversion rates

---

## Benefits of Page-Specific Rules

✅ **Better User Experience**: Users see only relevant consent options  
✅ **Higher Conversion**: Fewer, more relevant choices = better completion rates  
✅ **DPDPA Compliance**: Aligns with purpose limitation and transparency principles  
✅ **Professional**: Shows you take privacy seriously

---

## Troubleshooting

### Widget Still Not Showing?
1. Check browser console for errors
2. Verify the URL pattern matches exactly (check for trailing slashes)
3. Ensure at least one activity is selected in the rule
4. Check that the widget is Active (`isActive: true`)
5. Verify the selected activities exist and are active

### Wrong Activities Showing?
1. Check that the rule priority is correct (higher = evaluated first)
2. Verify only recruitment activities are selected in the rule
3. Clear browser cache and reload

### Need Help?
Contact support or check the [DPDPA Widget Documentation](../features/dpdpa-widget.md)

