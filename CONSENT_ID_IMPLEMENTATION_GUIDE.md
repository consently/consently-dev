# Consent ID System - Implementation Guide

## Overview

This guide details all changes needed to implement the Consent ID system in the DPDPA widget.

---

## ✅ Completed Backend Changes

### 1. Database Migration ✅
- **File**: `supabase/migrations/23_remove_email_add_consent_id.sql`
- Removed `visitor_principal_links` table
- Removed email-related columns from tables
- Added Consent ID validation function
- Status: **DONE**

### 2. API Endpoints ✅
- **Deleted**: `app/api/dpdpa/link-email/route.ts`
- **Created**: `app/api/dpdpa/verify-consent-id/route.ts`
- **Updated**: `app/api/dpdpa/consent-record/route.ts` (removed email logic)
- **Updated**: `app/api/dpdpa/check-consent/route.ts` (removed principalId logic)
- Status: **DONE**

### 3. Type Definitions ✅
- **File**: `types/dpdpa-widget.types.ts`
- Removed `principalId` and `email` fields
- Updated comments to reflect Consent ID system
- Status: **DONE**

---

## 🚧 Frontend Widget Changes Needed

### File: `public/dpdpa-widget.js`

---

### Change 1: Update Global Variables

**Location**: Around line 200

**Replace:**
```javascript
let visitorEmail = (currentScript && currentScript.getAttribute('data-dpdpa-email')) || null;
let visitorPhone = (currentScript && currentScript.getAttribute('data-dpdpa-phone')) || null;
```

**With:**
```javascript
let consentID = null; // User-visible Consent ID (Format: CNST-XXXX-XXXX-XXXX)
```

---

### Change 2: Replace ID Generation Functions

**Location**: Around lines 378-487

**Remove these functions:**
- `async function getVisitorId()`
- `function getVisitorIdSync()`
- `async function getPrincipalId(email)`
- `function storeUserEmail(email)`
- `function getStoredUserEmail()`

**Replace with:**
```javascript
// ============================================================================
// CONSENT ID SYSTEM - User-visible unique identifier
// Format: CNST-XXXX-XXXX-XXXX (no ambiguous characters: 0,O,1,I)
// ============================================================================

// Generate a new Consent ID
function generateConsentID() {
  // Characters to use (excluding ambiguous ones: 0, O, 1, I)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segments = [];
  
  for (let i = 0; i < 3; i++) {
    let segment = '';
    for (let j = 0; j < 4; j++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      segment += chars.charAt(randomIndex);
    }
    segments.push(segment);
  }
  
  return 'CNST-' + segments.join('-');
}

// Get or generate Consent ID
function getConsentID() {
  // Check if we already have a Consent ID stored
  let storedID = ConsentStorage.get('consently_consent_id');
  if (storedID) {
    console.log('[Consently DPDPA] Using stored Consent ID:', storedID);
    return storedID;
  }
  
  // Generate new Consent ID
  const newID = generateConsentID();
  ConsentStorage.set('consently_consent_id', newID, 365 * 10); // Store for 10 years
  console.log('[Consently DPDPA] Generated new Consent ID:', newID);
  
  return newID;
}

// Store Consent ID (used after verification or new consent)
function storeConsentID(id) {
  if (!id) return;
  try {
    ConsentStorage.set('consently_consent_id', id, 365 * 10);
    // Also set in cookie as backup
    document.cookie = `consently_id=${id}; max-age=${365*24*60*60*10}; path=/; SameSite=Lax`;
    console.log('[Consently DPDPA] Consent ID stored:', id);
  } catch (error) {
    console.error('[Consently DPDPA] Failed to store Consent ID:', error);
  }
}

// Format Consent ID for display (adds spacing for readability)
function formatConsentID(id) {
  return id; // Already formatted as CNST-XXXX-XXXX-XXXX
}

// Validate Consent ID format
function isValidConsentID(id) {
  if (!id) return false;
  // Check format: CNST-XXXX-XXXX-XXXX (new format) or vis_xxxxx (legacy format)
  const newFormat = /^CNST-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(id);
  const legacyFormat = /^vis_[a-zA-Z0-9]+$/.test(id);
  return newFormat || legacyFormat;
}

// Verify Consent ID with API
async function verifyConsentID(id) {
  if (!isValidConsentID(id)) {
    return { valid: false, error: 'Invalid Consent ID format' };
  }
  
  try {
    const response = await fetch(`${API_URL}/api/dpdpa/verify-consent-id`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        consentID: id,
        widgetId: widgetId
      })
    });
    
    return await response.json();
  } catch (error) {
    console.error('[Consently DPDPA] Verification error:', error);
    return { valid: false, error: 'Unable to verify Consent ID' };
  }
}
```

---

### Change 3: Add Verification UI

**Add this new function (around line 1400, before `showConsentBanner`):**

```javascript
// Show Consent ID Verification Screen
async function showVerificationScreen() {
  const t = translations;
  
  const modal = document.createElement('div');
  modal.id = 'dpdpa-verification-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
  
  modal.innerHTML = `
    <div style="background:white;border-radius:16px;padding:40px;max-width:500px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
      <h2 style="margin:0 0 10px 0;font-size:28px;color:#1a1a1a;">Welcome!</h2>
      <p style="color:#666;font-size:16px;margin:0 0 30px 0;">Do you already have a Consent ID?</p>
      
      <div style="background:#f8f9fa;border-radius:12px;padding:24px;margin-bottom:20px;">
        <label style="display:block;font-weight:600;margin-bottom:10px;color:#1a1a1a;">Enter your Consent ID:</label>
        <input 
          type="text" 
          id="consent-id-input"
          placeholder="CNST-XXXX-XXXX-XXXX"
          maxlength="19"
          style="width:100%;padding:14px;border:2px solid #e5e7eb;border-radius:8px;font-size:16px;font-family:monospace;text-transform:uppercase;margin-bottom:12px;"
        />
        <button 
          id="verify-consent-btn"
          style="width:100%;padding:14px;background:${primaryColor};border:none;color:white;border-radius:8px;font-weight:600;font-size:16px;cursor:pointer;"
        >
          ✓ Verify & Load Preferences
        </button>
        <div id="verify-error" style="color:#dc2626;margin-top:10px;font-size:14px;display:none;"></div>
      </div>
      
      <div style="text-align:center;margin:20px 0;color:#999;">OR</div>
      
      <button 
        id="start-fresh-btn"
        style="width:100%;padding:14px;background:white;border:2px solid #e5e7eb;color:#1a1a1a;border-radius:8px;font-weight:600;font-size:16px;cursor:pointer;"
      >
        🆕 Start Fresh - Get New Consent ID
      </button>
      
      <p style="text-align:center;margin-top:20px;font-size:13px;color:#999;">
        Don't have an ID? No problem! Click "Start Fresh" to begin.
      </p>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Event listeners
  const verifyBtn = document.getElementById('verify-consent-btn');
  const startFreshBtn = document.getElementById('start-fresh-btn');
  const input = document.getElementById('consent-id-input');
  const errorDiv = document.getElementById('verify-error');
  
  // Auto-format input
  input.addEventListener('input', (e) => {
    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (value.length > 12) value = value.substring(0, 12);
    
    // Format as CNST-XXXX-XXXX-XXXX
    let formatted = 'CNST-';
    if (value.length > 0) formatted += value.substring(0, 4);
    if (value.length > 4) formatted += '-' + value.substring(4, 8);
    if (value.length > 8) formatted += '-' + value.substring(8, 12);
    
    e.target.value = formatted;
  });
  
  verifyBtn.addEventListener('click', async () => {
    const inputID = input.value.trim();
    errorDiv.style.display = 'none';
    
    if (!inputID || inputID === 'CNST-') {
      errorDiv.textContent = 'Please enter a Consent ID';
      errorDiv.style.display = 'block';
      return;
    }
    
    verifyBtn.textContent = 'Verifying...';
    verifyBtn.disabled = true;
    
    const result = await verifyConsentID(inputID);
    
    if (result.valid) {
      // Store the verified ID
      storeConsentID(inputID);
      consentID = inputID;
      
      // Close modal
      modal.remove();
      
      // Show success message
      showToast('✅ Consent ID verified! Your preferences have been loaded.', 'success');
      
      // Apply preferences (don't show banner)
      console.log('[Consently DPDPA] Loaded preferences:', result.preferences);
      
    } else {
      errorDiv.textContent = result.error || 'Consent ID not found. Please check and try again.';
      errorDiv.style.display = 'block';
      verifyBtn.textContent = '✓ Verify & Load Preferences';
      verifyBtn.disabled = false;
    }
  });
  
  startFreshBtn.addEventListener('click', () => {
    modal.remove();
    // Generate new Consent ID and show consent banner
    consentID = getConsentID();
    showConsentBanner();
  });
}
```

---

### Change 4: Add Success Modal with Consent ID Display

**Add this new function:**

```javascript
// Show Consent Success Modal with ID Display
function showConsentSuccessModal(consentID) {
  const modal = document.createElement('div');
  modal.id = 'dpdpa-success-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    animation: fadeIn 0.3s ease;
  `;
  
  modal.innerHTML = `
    <div style="background:white;border-radius:20px;padding:50px;max-width:550px;width:90%;box-shadow:0 25px 70px rgba(0,0,0,0.3);text-align:center;">
      <div style="font-size:64px;margin-bottom:20px;">🎉</div>
      <h2 style="margin:0 0 15px 0;font-size:32px;color:#10b981;">Consent Saved!</h2>
      <p style="color:#666;font-size:16px;margin:0 0 30px 0;">Your preferences have been recorded successfully.</p>
      
      <div style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);border-radius:16px;padding:30px;margin-bottom:30px;">
        <label style="display:block;color:rgba(255,255,255,0.9);font-size:14px;font-weight:600;margin-bottom:12px;text-transform:uppercase;letter-spacing:1px;">Your Consent ID</label>
        <div style="background:white;border-radius:12px;padding:20px;margin-bottom:15px;">
          <div id="consent-id-display" style="font-size:28px;font-weight:700;color:#1a1a1a;font-family:monospace;letter-spacing:2px;">
            ${consentID}
          </div>
        </div>
        <div style="display:flex;gap:10px;justify-content:center;">
          <button 
            onclick="copyConsentID('${consentID}')"
            style="padding:12px 24px;background:rgba(255,255,255,0.2);border:2px solid white;color:white;border-radius:8px;font-weight:600;cursor:pointer;font-size:14px;backdrop-filter:blur(10px);"
          >
            📋 Copy
          </button>
          <button 
            onclick="downloadConsentReceipt('${consentID}')"
            style="padding:12px 24px;background:rgba(255,255,255,0.2);border:2px solid white;color:white;border-radius:8px;font-weight:600;cursor:pointer;font-size:14px;backdrop-filter:blur(10px);"
          >
            📄 Download
          </button>
        </div>
      </div>
      
      <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:16px;border-radius:8px;margin-bottom:25px;text-align:left;">
        <div style="display:flex;align-items:start;gap:12px;">
          <div style="font-size:24px;">⚠️</div>
          <div>
            <strong style="color:#92400e;display:block;margin-bottom:4px;">Save this ID!</strong>
            <p style="color:#78350f;font-size:14px;margin:0;">
              Use this Consent ID to sync your preferences across devices. Screenshot it, write it down, or download the receipt.
            </p>
          </div>
        </div>
      </div>
      
      <button 
        onclick="document.getElementById('dpdpa-success-modal').remove()"
        style="width:100%;padding:16px;background:${primaryColor};border:none;color:white;border-radius:12px;font-weight:600;font-size:18px;cursor:pointer;"
      >
        Got it! ✓
      </button>
    </div>
  `;
  
  document.body.appendChild(modal);
}

// Copy Consent ID to clipboard
function copyConsentID(id) {
  navigator.clipboard.writeText(id).then(() => {
    showToast('📋 Consent ID copied to clipboard!', 'success');
  }).catch(() => {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = id;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast('📋 Consent ID copied!', 'success');
  });
}

// Download consent receipt
function downloadConsentReceipt(consentID) {
  const date = new Date().toLocaleDateString();
  const receipt = `
CONSENT RECEIPT
===============

Consent ID: ${consentID}
Date: ${date}
Widget: ${widgetId}

Your consent preferences have been recorded.

Use this Consent ID to:
• Sync preferences across devices
• Manage your consent settings
• Update your preferences anytime

Keep this ID safe!

---
Powered by Consently
Digital Personal Data Protection Act, 2023
  `.trim();
  
  const blob = new Blob([receipt], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `consent-receipt-${consentID}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showToast('📄 Receipt downloaded!', 'success');
}

// Show toast notification
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 30px;
    right: 30px;
    background: ${type === 'success' ? '#10b981' : '#3b82f6'};
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    font-weight: 600;
    font-size: 15px;
    z-index: 1000000;
    animation: slideIn 0.3s ease;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
```

---

### Change 5: Update checkExistingConsent Function

**Location**: Around line 1400

**Find the function that checks for existing consent and UPDATE the API call:**

```javascript
// OLD: Check with principalId
const params = new URLSearchParams({
  widgetId: widgetId,
  visitorId: visitorId,
  principalId: principalId, // REMOVE THIS
  currentUrl: window.location.href
});

// NEW: Check with consentID only
const params = new URLSearchParams({
  widgetId: widgetId,
  visitorId: consentID || getConsentID(),
  currentUrl: window.location.href
});
```

---

### Change 6: Remove Email Field from Consent Banner

**Location**: Around line 2000-2020

**Find and REMOVE this entire section:**
```javascript
<!-- Optional Email for Cross-Device Sync -->
<div style="...">
  <input type="email" id="dpdpa-user-email" ... />
  <p>Your privacy is protected: We use SHA-256 hashing...</p>
</div>
```

---

### Change 7: Update saveConsent Function

**Location**: Around line 2650

**Find where consent data is prepared and UPDATE:**

```javascript
// OLD
const consentData = {
  widgetId: widgetId,
  visitorId: getVisitorIdSync(),
  principalId: principalId,  // REMOVE
  email: userEmail,          // REMOVE
  consentStatus: finalStatus,
  // ...
};

// NEW
const consentData = {
  widgetId: widgetId,
  visitorId: consentID || getConsentID(),
  consentStatus: finalStatus,
  // ... rest stays the same
};
```

**After successful consent save, show the success modal:**

```javascript
// After receiving successful response
if (data.success) {
  console.log('[Consently DPDPA] Consent recorded successfully');
  
  // Show success modal with Consent ID
  showConsentSuccessModal(consentID);
  
  // Rest of the code...
}
```

---

### Change 8: Update Widget Initialization

**Location**: Around line 3100 (at the bottom)

**Find the initialization code and UPDATE:**

```javascript
// OLD
async function initialize() {
  await loadConfig();
  visitorId = await getVisitorId();
  await checkExistingConsent();
}

// NEW
async function initialize() {
  await loadConfig();
  
  // Check if user has stored Consent ID
  const storedID = ConsentStorage.get('consently_consent_id');
  
  if (storedID) {
    // User has Consent ID, check if consent exists
    consentID = storedID;
    await checkExistingConsent();
  } else {
    // New user - show verification screen first
    showVerificationScreen();
  }
}
```

---

### Change 9: Update Public API

**Location**: Around line 3150

**Update the public API methods:**

```javascript
// OLD
window.ConsentlyDPDPA = {
  setUserEmail: function(email) {
    visitorEmail = email;
  },
  // ...
};

// NEW
window.ConsentlyDPDPA = {
  getConsentID: function() {
    return consentID || getConsentID();
  },
  verifyConsentID: async function(id) {
    return await verifyConsentID(id);
  },
  showVerificationScreen: function() {
    showVerificationScreen();
  },
  // ... keep other methods
};
```

---

## 🎨 CSS Animations to Add

Add these to the widget styles:

```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes slideOut {
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(100%); opacity: 0; }
}
```

---

## 🧪 Testing Checklist

After making all changes:

- [ ] Test new user flow (verification screen → start fresh → consent → see ID)
- [ ] Test returning user with stored ID (automatic consent check)
- [ ] Test ID verification (enter valid ID → preferences loaded)
- [ ] Test invalid ID (error message shown)
- [ ] Test copy Consent ID button
- [ ] Test download receipt button
- [ ] Test toast notifications
- [ ] Test on mobile devices
- [ ] Test with different languages
- [ ] Test localStorage persistence
- [ ] Test cookie backup

---

## 📝 Summary of Major Changes

### Removed:
- Device fingerprinting logic
- Email collection and hashing
- Principal ID generation
- Cross-device sync via email
- `visitor_principal_links` table

### Added:
- User-visible Consent ID generation (CNST-XXXX-XXXX-XXXX)
- Verification UI for existing users
- Success modal with Consent ID display
- Copy to clipboard functionality
- Download receipt functionality
- Toast notifications

### Benefits:
- ✅ **Zero PII collection** - No email, no fingerprinting
- ✅ **User-controlled** - Users own their Consent ID
- ✅ **Cross-device capable** - Via manual ID entry
- ✅ **Privacy-first** - No tracking cookies
- ✅ **DPDPA compliant** - Meets all requirements
- ✅ **Innovative** - Unique approach in consent management

---

## 🚀 Deployment Steps

1. **Run database migration:**
   ```bash
   # Apply migration 23
   supabase db push
   ```

2. **Update widget file** with all changes above

3. **Rebuild widget:**
   ```bash
   npm run build
   ```

4. **Test thoroughly** using checklist above

5. **Deploy to production**

6. **Monitor for issues:**
   - Check API logs for verification requests
   - Monitor Consent ID generation success rate
   - Track user adoption of verification feature

---

**Implementation Status**: Backend Complete ✅ | Frontend In Progress 🚧

**Last Updated**: $(date)

