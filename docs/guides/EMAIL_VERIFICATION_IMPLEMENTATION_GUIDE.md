# Email Verification & Smart Pre-fill - Implementation Guide

## Overview

This guide details the implementation of the **Email Verification** and **Smart Pre-fill** system in the DPDPA widget. This system replaces the manual "Consent ID" entry with a seamless, email-based flow.

---

## 🚀 Core Features

### 1. Smart Email Pre-fill
The widget automatically detects email input fields on your website (e.g., login forms, newsletters) and pre-fills the email address in the "Secure This Consent" section.

- **Trigger**: `onFormSubmit` (primary) or manual configuration.
- **Privacy**: The email is **never** sent to our servers until the user explicitly clicks "Send Code".
- **Visuals**: The email field highlights with a gradient when pre-filled.

### 2. Email Verification Flow
Users verify their identity via a One-Time Password (OTP) sent to their email.

1.  **User enters email** (or it's pre-filled).
2.  **Click "Send Code"**: Triggers `/api/dpdpa/send-otp`.
3.  **Enter OTP**: Triggers `/api/dpdpa/verify-otp`.
4.  **Sync**: On success, existing consents are loaded, and new consents are linked to this verified email.

### 3. Consent ID (Internal)
While users verify via email, a unique **Consent ID** (e.g., `CNST-XXXX-XXXX-XXXX`) is still generated and used for:
-   **Receipts**: Printed on the downloadable consent receipt.
-   **Internal Tracking**: Used as the primary key in the database.
-   **Anonymous Validation**: Can be used to validate consent without revealing PII.

---

## 🛠️ Implementation Details

### Frontend (`public/dpdpa-widget.js`)

#### Key Functions
-   `setupFormSubmitTrigger(rule)`: Attaches listeners to forms to capture email inputs.
-   `showConsentWidget(prefilledEmail)`: Accepts an optional email to pre-fill the UI.
-   `sendOTP(email)`: Calls the backend to send the verification code.
-   `verifyOTP(email, otp)`: Verifies the code and retrieves the `consent_id`.

#### UI Components
-   **"Secure This Consent" Section**: A dedicated area in the widget footer.
    -   **New Users**: Email input + "Send Code" button.
    -   **Verified Users**: OTP input + "Verify" button (or "Welcome Back" state).
-   **Premium Notification**: A glassmorphism toast that appears after saving consent.

### Backend API

#### 1. Send OTP
-   **Endpoint**: `POST /api/dpdpa/send-otp`
-   **Body**: `{ email, widgetId }`
-   **Action**: Generates a 6-digit code, stores it in Redis/Database (hashed), and sends an email.

#### 2. Verify OTP
-   **Endpoint**: `POST /api/dpdpa/verify-otp`
-   **Body**: `{ email, otp, widgetId }`
-   **Action**: Validates the code. If correct, returns the associated `consent_id` (if any) or generates a new stable ID based on the email hash.

---

## 🎨 UI/UX Enhancements

The widget now features a **Premium Design**:
-   **Glassmorphism**: Backdrop blur and semi-transparent backgrounds.
-   **Gradients**: Subtle gradients for the "Secure This Consent" section and buttons.
-   **Animations**: Smooth transitions for the toast notification and modal appearance.
-   **Typography**: Optimized system font stack for better readability.

---

## 🧪 Testing Checklist

-   [ ] **Smart Pre-fill**: Submit a form on your site and check if the widget opens with the email pre-filled.
-   [ ] **Send Code**: Verify that the OTP email is received instantly.
-   [ ] **Verify Code**: Enter the OTP and confirm that the widget transitions to the "Verified" state.
-   [ ] **Save Consent**: Save preferences and check for the "Premium Notification" toast.
-   [ ] **Cross-Device**: Verify on a second device using the same email; preferences should sync.
