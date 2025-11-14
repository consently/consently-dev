# Contact Page Consent Notice Fix

## Issue
The contact page (`/contact`) is showing multiple purposes (Contact Form Submissions and Careers) when only one purpose should be displayed.

## Root Cause
The widget is showing ALL activities from the widget's `selected_activities` configuration because:
- Either no display rule matches `/contact`, OR
- A display rule matches but doesn't specify which activities to show

## Solution

### Step 1: Check Current Configuration
1. Go to Dashboard → DPDPA → Widget Configuration
2. Find the widget with ID: `dpdpa_mhnhpimc_atq70ak`
3. Check the "Display Rules" section

### Step 2: Create/Update Display Rule for Contact Page
1. If no rule exists for `/contact`, click "Add Display Rule"
2. If a rule exists, edit it
3. Configure the rule:
   - **Rule Name**: "Contact Page Notice"
   - **URL Pattern**: `/contact`
   - **URL Match Type**: `exact` or `startsWith` (depending on your needs)
   - **Trigger Type**: `onPageLoad`
   - **Activities**: Select ONLY the "Contact Form Submissions" activity
     - ⚠️ **IMPORTANT**: Make sure to select ONLY the contact form activity
     - Do NOT select the "Careers" activity

### Step 3: Verify
1. Visit `/contact` page
2. Open browser console (F12)
3. Check for warnings:
   - If you see: `⚠️ No display rule matched` → Create a rule
   - If you see: `⚠️ BUT rule does not specify which activities to show!` → Add activities to the rule
4. The consent notice should now show only the Contact Form Submissions purpose

## Technical Details

The widget filters activities based on display rules:
- If a rule matches and specifies `activities` array → Shows only those activities
- If a rule matches but `activities` is empty/undefined → Shows ALL activities (this is the bug)
- If no rule matches → Shows ALL activities

## Console Warnings Added

The widget now logs helpful warnings:
- When a rule matches but doesn't filter activities
- When no rule matches for the current page

These warnings help identify configuration issues quickly.

