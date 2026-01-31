/**
 * Consently DPDPA Consent Widget v1.0
 * Production-ready embeddable widget for DPDPA 2023 compliance
 * Displays processing activities and collects granular consent
 * 
 * Usage: <script src="https://www.consently.in/dpdpa-widget.js" data-dpdpa-widget-id="YOUR_WIDGET_ID"></script>
 */

(function () {
  'use strict';

  // Production mode: Suppress console.log/info/debug, keep console.error/warn for critical issues
  const isProduction = window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1');
  const originalLog = console.log;
  const originalInfo = console.info;
  const originalDebug = console.debug;

  if (isProduction) {
    console.log = function () { };
    console.info = function () { };
    console.debug = function () { };
  }

  // Get widget ID from script tag
  const currentScript = document.currentScript || document.querySelector('script[data-dpdpa-widget-id]');
  const widgetId = currentScript ? currentScript.getAttribute('data-dpdpa-widget-id') : null;

  if (!widgetId) {
    console.error('[Consently DPDPA] Error: data-dpdpa-widget-id attribute is required');
    console.error('[Consently DPDPA] Usage: <script src="https://www.consently.in/dpdpa-widget.js" data-dpdpa-widget-id="YOUR_WIDGET_ID"></script>');
    return;
  }

  if (!isProduction) {
    originalLog('[Consently DPDPA] Initializing widget with ID:', widgetId);
  }

  // English translations as base
  const BASE_TRANSLATIONS = {
    consentManager: 'Consent Manager',
    compliantWith: 'Fully compliant with Digital Personal Data Protection Act, 2023',
    requirementsTitle: 'DPDPA 2023 requires you to read the privacy notice',
    scrollInstruction: 'Scroll down to read the privacy notice',
    downloadButton: 'Download Privacy Notice',
    proceedButton: 'Proceed to Consent',
    warningMessage: 'Please complete both requirements to proceed',
    processingActivities: 'Processing Activities',
    processingDescription: 'We process your personal data for the following purposes. You can accept or reject each activity individually.',
    acceptButton: 'Accept',
    rejectButton: 'Reject',
    acceptAll: 'Accept All',
    rejectAll: 'Reject All',
    acceptSelected: 'Accept selected',
    cancel: 'Cancel',
    close: 'Close',
    dataAttributes: 'Data Attributes',
    dataCategories: 'Data Categories',
    purpose: 'Purpose',
    retentionPeriod: 'Retention Period',
    yourDataRights: 'Your Data Rights',
    dataRightsText: 'Under DPDPA 2023, you have the right to access, correct, and delete your personal data. You can also withdraw your consent at any time.',
    withdrawConsent: 'Withdraw/Modify Consent',
    raiseGrievance: 'Raise Grievance',
    privacyNotice: 'Notice',
    dpdpaCompliance: 'DPDPA 2023 Compliance',
    manageConsentPreferences: 'Manage Your Consent Preferences',
    changeSettingsAnytime: 'You can change these settings at any time',
    preferenceCentre: 'Preference Centre',
    revocationWarning: '⚠️ Warning: Revoking consent may affect service delivery.',
    grievanceText: 'If you have any grievances with how we process your personal data click {here}. If we are unable to resolve your grievance, you can also make a complaint to the Data Protection Board by clicking {here2}.',
    here: 'here',
    poweredBy: 'Powered by',
    // Age Gate Translations
    ageVerificationRequired: 'Age Verification Required',
    selectBirthYear: 'Select your year of birth',
    continueButton: 'Continue',
    ageGateDescription: 'To provide you with an appropriate experience, we need to verify your age.',
    ageGateDefaultMinorMessage: 'This content requires adult supervision.',
    // DigiLocker Age Verification Translations
    digilockerVerification: 'DigiLocker Age Verification',
    digilockerDescription: 'Verify your age securely using your government-issued ID via DigiLocker.',
    verifyWithDigilocker: 'Verify with DigiLocker',
    verifying: 'Verifying...',
    ageVerified: 'Age Verified',
    ageVerifiedMessage: 'Your age has been verified successfully.',
    verificationFailed: 'Verification Failed',
    verificationFailedMessage: 'Age verification failed. Please try again.',
    verificationPending: 'Verification Pending',
    verificationPendingMessage: 'Please complete verification in the DigiLocker window.',
    minorBlockedMessage: 'You must be 18 or older to provide consent.',
    retryVerification: 'Retry Verification'
  };

  // Translation cache to avoid repeated API calls
  const translationCache = {};

  // Get API URL from config or use default
  function getApiUrl() {
    const scriptSrc = currentScript ? currentScript.src : '';
    if (scriptSrc.includes('localhost')) {
      return 'http://localhost:3000';
    }
    if (scriptSrc.includes('consently.in')) {
      return 'https://www.consently.in';
    }
    // Extract domain from script src
    const match = scriptSrc.match(/^(https?:\/\/[^\/]+)/);
    return match ? match[1] : window.location.origin;
  }

  // Translate text using Google Translate API
  async function translateText(text, targetLang) {
    if (targetLang === 'en') return text;

    const cacheKey = `${targetLang}:${text}`;
    if (translationCache[cacheKey]) {
      return translationCache[cacheKey];
    }

    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text,
          target: targetLang,
          source: 'en'
        })
      });

      if (response.ok) {
        const data = await response.json();
        const translated = data.translatedText || text;
        translationCache[cacheKey] = translated;
        return translated;
      }
    } catch (error) {
      console.error('[Consently] Translation error:', error);
    }

    return text; // Fallback to original
  }

  // Batch translate multiple texts at once
  async function batchTranslate(texts, targetLang) {
    if (targetLang === 'en' || !texts || texts.length === 0) return texts || [];

    // Check cache first
    const uncachedTexts = [];
    const uncachedIndices = [];
    const result = [...texts];

    texts.forEach((text, idx) => {
      if (!text) {
        result[idx] = text;
        return;
      }
      const cacheKey = `${targetLang}:${text}`;
      if (translationCache[cacheKey]) {
        result[idx] = translationCache[cacheKey];
      } else {
        uncachedTexts.push(text);
        uncachedIndices.push(idx);
      }
    });

    // If all cached, return immediately
    if (uncachedTexts.length === 0) {
      return result;
    }

    // Batch translate uncached texts using the proper API format
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texts: uncachedTexts, // Use 'texts' array, not 'text' string
          target: targetLang,
          source: 'en'
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.translations && Array.isArray(data.translations)) {
          // Use the translations array from the API response
          uncachedIndices.forEach((idx, i) => {
            const translated = data.translations[i] || uncachedTexts[i] || texts[idx];
            result[idx] = translated;
            // Cache it
            const cacheKey = `${targetLang}:${texts[idx]}`;
            translationCache[cacheKey] = translated;
          });
        } else {
          // Fallback: try to use translatedText if available
          console.warn('[Consently DPDPA] Unexpected API response format, using fallback');
          uncachedIndices.forEach((idx, i) => {
            result[idx] = uncachedTexts[i] || texts[idx];
          });
        }
      } else {
        console.warn('[Consently DPDPA] Translation API error:', response.status);
        // Fallback to original texts
        uncachedIndices.forEach((idx, i) => {
          result[idx] = uncachedTexts[i] || texts[idx];
        });
      }
    } catch (error) {
      console.error('[Consently DPDPA] Batch translation error:', error);
      // Fallback to original texts for uncached items
      uncachedIndices.forEach((idx, i) => {
        result[idx] = uncachedTexts[i] || texts[idx];
      });
    }

    return result;
  }

  // Get translations for a language (with optimized batch translation)
  async function getTranslation(lang) {
    if (lang === 'en') {
      return BASE_TRANSLATIONS;
    }

    // Check if entire language is already cached
    const langCacheKey = `_lang_${lang}`;
    if (translationCache[langCacheKey]) {
      return translationCache[langCacheKey];
    }

    // Batch translate all strings at once
    const keys = Object.keys(BASE_TRANSLATIONS);
    const values = Object.values(BASE_TRANSLATIONS);
    const translatedValues = await batchTranslate(values, lang);

    const translations = {};
    keys.forEach((key, idx) => {
      translations[key] = translatedValues[idx];
    });

    // Cache entire language translation set
    translationCache[langCacheKey] = translations;

    return translations;
  }

  // Global configuration
  let config = null;
  let allActivities = []; // Source of truth for all activities
  let activities = [];
  let activityConsents = {};
  let consentID = null; // User-visible Consent ID (Format: CNST-XXXX-XXXX-XXXX)
  let verifiedEmail = null; // Store verified email address
  let userEmail = null; // Store user email for OTP flow
  let currentPrefilledEmail = null; // Store prefilled email for global access
  let isVerifying = false; // Prevent double submission
  let globalClickHandler = null; // Global reference to cleanup language menu listener
  let primaryColor = '#4c8bf5'; // Default primary color, updated when config loads
  let visitorEmail = null; // Visitor email for cross-device consent management

  // DigiLocker Age Verification State
  let ageVerificationSessionId = null; // Current verification session ID
  let ageVerificationStatus = null; // 'pending' | 'verified' | 'failed'
  let ageVerificationPollingInterval = null; // Polling interval reference
  // Canonical policy outcome from server — single source of truth
  // Values: 'verified_adult' | 'blocked_minor' | 'limited_access' | 'expired'
  let verificationOutcome = null;

  // LocalStorage manager for consent persistence
  const ConsentStorage = {
    set: function (key, value, expirationDays) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expirationDays);
      const data = {
        value: value,
        expiresAt: expiresAt.toISOString()
      };
      localStorage.setItem(key, JSON.stringify(data));
    },

    get: function (key) {
      const data = localStorage.getItem(key);
      if (!data) return null;

      try {
        const parsed = JSON.parse(data);
        const expiresAt = new Date(parsed.expiresAt);

        if (expiresAt < new Date()) {
          // Consent expired
          this.delete(key);
          return null;
        }

        return parsed.value;
      } catch (e) {
        return null;
      }
    },

    delete: function (key) {
      localStorage.removeItem(key);
    }
  };

  // ============================================================================
  // AGE GATE SYSTEM - Neutral age verification for DPDPA 2023 compliance
  // ============================================================================

  // Get minor cookie name (widget-specific to prevent cross-site issues)
  function getMinorCookieName() {
    return `consently_minor_flag_${widgetId}`;
  }

  // Check if user has been flagged as minor via cookie
  function checkMinorCookie() {
    try {
      const cookieName = getMinorCookieName();

      // Check localStorage first
      const localStorageFlag = ConsentStorage.get(cookieName);
      if (localStorageFlag) {
        console.log('[Consently DPDPA] Minor flag found in localStorage');
        return true;
      }

      // Fallback to cookie check
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === cookieName && value === 'true') {
          console.log('[Consently DPDPA] Minor flag found in cookie');
          return true;
        }
      }

      return false;
    } catch (e) {
      console.error('[Consently DPDPA] Error checking minor cookie:', e);
      return false;
    }
  }

  // Set cookie flagging device as minor (365 days)
  function setMinorCookie() {
    try {
      const cookieName = getMinorCookieName();
      const expirationDays = 365;

      // Set in localStorage (more reliable)
      ConsentStorage.set(cookieName, true, expirationDays);

      // Also set as cookie for additional persistence
      const expiresDate = new Date();
      expiresDate.setDate(expiresDate.getDate() + expirationDays);
      document.cookie = `${cookieName}=true; expires=${expiresDate.toUTCString()}; path=/; SameSite=Lax`;

      console.log('[Consently DPDPA] Minor flag cookie set for', expirationDays, 'days');
    } catch (e) {
      console.error('[Consently DPDPA] Error setting minor cookie:', e);
    }
  }

  // Calculate age from birth year
  function calculateAgeFromBirthYear(birthYear) {
    const currentYear = new Date().getFullYear();
    return currentYear - parseInt(birthYear, 10);
  }

  // ============================================================================
  // DIGILOCKER AGE VERIFICATION - Government-backed verification for DPDPA 2023
  // ============================================================================

  // Check if there's an existing verified age verification (boolean only, no personal data)
  function checkExistingAgeVerification() {
    try {
      const storageKey = `consently_age_verified_${widgetId}`;
      const stored = ConsentStorage.get(storageKey);
      if (stored && stored.verified) {
        ageVerificationStatus = 'verified';
        return true;
      }
      return false;
    } catch (e) {
      console.error('[Consently DPDPA] Error checking age verification:', e);
      return false;
    }
  }

  // Store successful age verification (only boolean status, no personal data).
  // UX-only flag. NOT a source of truth.
  // Server verification outcome is authoritative.
  function storeAgeVerification(validityDays = 365) {
    try {
      const storageKey = `consently_age_verified_${widgetId}`;
      ConsentStorage.set(storageKey, {
        verified: true,
        verifiedAt: new Date().toISOString()
      }, validityDays);
    } catch (e) {
      console.error('[Consently DPDPA] Error storing age verification:', e);
    }
  }

  // Save widget state to sessionStorage before DigiLocker redirect
  function saveWidgetState() {
    try {
      const stateKey = `consently_widget_state_${widgetId}`;
      const state = {
        activityConsents: activityConsents,
        userEmail: userEmail,
        verifiedEmail: verifiedEmail,
        consentID: consentID,
        savedAt: Date.now()
      };
      sessionStorage.setItem(stateKey, JSON.stringify(state));
      console.log('[Consently DPDPA] Widget state saved before redirect');
    } catch (e) {
      console.error('[Consently DPDPA] Error saving widget state:', e);
    }
  }

  // Restore widget state from sessionStorage after returning from DigiLocker
  function restoreWidgetState() {
    try {
      const stateKey = `consently_widget_state_${widgetId}`;
      const stored = sessionStorage.getItem(stateKey);
      if (!stored) return null;

      // Remove from sessionStorage to prevent stale state on next load
      sessionStorage.removeItem(stateKey);

      const state = JSON.parse(stored);

      // Check TTL (30 minutes max)
      if (Date.now() - state.savedAt > 30 * 60 * 1000) {
        console.log('[Consently DPDPA] Saved widget state expired, discarding');
        return null;
      }

      // Restore module-level state variables
      if (state.activityConsents && Object.keys(state.activityConsents).length > 0) {
        activityConsents = state.activityConsents;
      }
      if (state.userEmail) userEmail = state.userEmail;
      if (state.verifiedEmail) verifiedEmail = state.verifiedEmail;
      if (state.consentID) consentID = state.consentID;

      console.log('[Consently DPDPA] Widget state restored after redirect');
      return state;
    } catch (e) {
      console.error('[Consently DPDPA] Error restoring widget state:', e);
      return null;
    }
  }

  // Re-apply restored state to the widget DOM elements
  function applyRestoredStateToDom(widget) {
    try {
      // Re-apply checkbox states for consent activities
      if (Object.keys(activityConsents).length > 0) {
        const checkboxes = widget.querySelectorAll('.activity-checkbox');
        checkboxes.forEach(function(checkbox) {
          const activityId = checkbox.getAttribute('data-activity-id');
          if (activityConsents[activityId]) {
            const isAccepted = activityConsents[activityId].status === 'accepted';
            if (checkbox.checked !== isAccepted) {
              checkbox.checked = isAccepted;
              // Apply visual styles without triggering change event
              const item = checkbox.closest('.dpdpa-activity-item');
              const checkboxVisual = checkbox.parentElement ? checkbox.parentElement.querySelector('.checkbox-visual') : null;
              const checkmark = checkboxVisual ? checkboxVisual.querySelector('svg') : null;

              if (isAccepted && item) {
                item.style.borderColor = primaryColor;
                item.style.borderWidth = '2px';
                item.style.background = '#f0f9ff';
                item.style.boxShadow = '0 4px 12px rgba(59,130,246,0.25)';
                item.style.borderLeftWidth = '4px';
                if (checkboxVisual) {
                  checkboxVisual.style.background = primaryColor;
                  checkboxVisual.style.borderColor = primaryColor;
                }
                if (checkmark) {
                  checkmark.style.opacity = '1';
                  checkmark.style.transform = 'scale(1)';
                }
              }
            }
          }
        });
        console.log('[Consently DPDPA] Restored checkbox states from saved state');
      }

      // Pre-fill email if restored
      if (userEmail) {
        var emailInputs = widget.querySelectorAll('input[type="email"]');
        emailInputs.forEach(function(input) {
          if (!input.value) {
            input.value = userEmail;
          }
        });
      }
    } catch (e) {
      console.error('[Consently DPDPA] Error applying restored state to DOM:', e);
    }
  }

  // Initiate DigiLocker age verification
  async function initiateAgeVerification(returnUrl) {
    try {
      const apiBase = getApiUrl();
      const visitorId = consentID || getConsentID();

      // Create session
      const response = await fetch(`${apiBase}/api/dpdpa/age-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          widgetId: widgetId,
          visitorId: visitorId,
          returnUrl: returnUrl || window.location.href
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to initiate verification');
      }

      const data = await response.json();
      ageVerificationSessionId = data.sessionId;
      ageVerificationStatus = 'pending';

      // Store session ID for callback handling
      sessionStorage.setItem('consently_age_session', data.sessionId);

      // Open DigiLocker in new window/redirect
      if (data.mockMode) {
        // In mock mode, open in same window for testing
        console.log('[Consently DPDPA] Mock mode - redirecting to:', data.redirectUrl);
      }

      // Save widget state before redirect so it can be restored on return
      saveWidgetState();

      // Redirect to DigiLocker
      window.location.href = data.redirectUrl;

      return data;
    } catch (e) {
      console.error('[Consently DPDPA] Error initiating age verification:', e);
      ageVerificationStatus = 'failed';
      throw e;
    }
  }

  // Check age verification status
  async function checkAgeVerificationStatus(sessionId) {
    try {
      const apiBase = getApiUrl();

      const response = await fetch(`${apiBase}/api/dpdpa/age-verification?sessionId=${sessionId}`);

      if (!response.ok) {
        throw new Error('Failed to check verification status');
      }

      const data = await response.json();

      // Use server-side verification_outcome as canonical state
      if (data.verificationOutcome) {
        verificationOutcome = data.verificationOutcome;
      }

      if (data.verified) {
        // Map server outcome to widget status for backward compatibility
        switch (verificationOutcome) {
          case 'verified_adult':
            ageVerificationStatus = 'verified';
            break;
          case 'blocked_minor':
            ageVerificationStatus = 'rejected';
            break;
          case 'limited_access':
            ageVerificationStatus = 'verified';
            break;
          default:
            // Fallback: use legacy logic if outcome not yet set (backward compat)
            ageVerificationStatus = 'verified';
            break;
        }

        // Store verification if outcome permits consent
        const consentPermittedOutcomes = ['verified_adult', 'limited_access'];
        if (verificationOutcome && consentPermittedOutcomes.includes(verificationOutcome)) {
          const validityDays = config?.verificationValidityDays || 365;
          storeAgeVerification(validityDays);
        } else if (!verificationOutcome && ageVerificationStatus === 'verified') {
          // Legacy fallback: no outcome field yet
          const validityDays = config?.verificationValidityDays || 365;
          storeAgeVerification(validityDays);
        }
      } else if (data.status === 'failed') {
        ageVerificationStatus = 'failed';
      }

      return data;
    } catch (e) {
      console.error('[Consently DPDPA] Error checking verification status:', e);
      return null;
    }
  }

  // Handle age verification callback (called when returning from DigiLocker)
  async function handleAgeVerificationCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('age_verification_session');
    const status = urlParams.get('age_verification_status');

    if (!sessionId) {
      // Check sessionStorage for pending session
      const storedSession = sessionStorage.getItem('consently_age_session');
      if (storedSession) {
        ageVerificationSessionId = storedSession;
        const statusData = await checkAgeVerificationStatus(storedSession);
        return statusData;
      }
      return null;
    }

    ageVerificationSessionId = sessionId;

    if (status === 'verified') {
      const statusData = await checkAgeVerificationStatus(sessionId);

      // Clean up URL parameters
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete('age_verification_session');
      cleanUrl.searchParams.delete('age_verification_status');
      window.history.replaceState({}, document.title, cleanUrl.toString());

      return statusData;
    }

    return null;
  }

  // Update the DigiLocker verification UI
  function updateDigiLockerUI(widget, t) {
    const verificationSection = widget.querySelector('#dpdpa-digilocker-section');
    if (!verificationSection) return;

    const statusContainer = verificationSection.querySelector('#dpdpa-digilocker-status');
    const verifyBtn = verificationSection.querySelector('#dpdpa-digilocker-verify-btn');

    if (ageVerificationStatus === 'verified') {
      if (statusContainer) {
        const verifiedAt = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        const isLimitedAccess = verificationOutcome === 'limited_access';
        const badgeColor = isLimitedAccess ? '#d97706' : '#059669';
        const bgColor = isLimitedAccess ? '#fffbeb' : '#ecfdf5';
        const borderColor = isLimitedAccess ? '#fde68a' : '#a7f3d0';
        const badgeText = isLimitedAccess ? 'Limited Access - Age Verified' : t.ageVerified;
        const subText = isLimitedAccess
          ? 'You have been verified as a minor. Some features may be restricted.'
          : 'Only age eligibility was checked. No personal data was stored.';

        statusContainer.innerHTML = `
          <div style="background: ${bgColor}; border: 1px solid ${borderColor}; border-radius: 8px; padding: 12px;">
            <div style="display: flex; align-items: center; gap: 8px; color: ${badgeColor};">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <span style="font-weight: 700; font-size: 14px;">${badgeText}</span>
            </div>
            <p style="margin: 8px 0 0 28px; font-size: 12px; color: #047857;">
              Verified on ${verifiedAt} via DigiLocker
            </p>
            <p style="margin: 4px 0 0 28px; font-size: 11px; color: #6b7280;">
              ${subText}
            </p>
            <p style="margin: 8px 0 0 28px; font-size: 12px; color: #065f46; font-weight: 600;">
              Please review your preferences below and click Confirm to continue.
            </p>
          </div>
        `;
      }
      if (verifyBtn) verifyBtn.style.display = 'none';
    } else if (ageVerificationStatus === 'rejected' || verificationOutcome === 'blocked_minor') {
      // Minor blocked by policy — no consent UI shown
      if (statusContainer) {
        statusContainer.innerHTML = `
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px;">
            <div style="display: flex; align-items: center; gap: 8px; color: #dc2626;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M15 9l-6 6"/>
                <path d="M9 9l6 6"/>
              </svg>
              <span style="font-weight: 700; font-size: 14px;">Access Restricted</span>
            </div>
            <p style="margin: 8px 0 0 28px; font-size: 12px; color: #991b1b;">
              ${config?.minorBlockedMessage || 'You must be 18 or older to provide consent.'}
            </p>
          </div>
        `;
      }
      if (verifyBtn) verifyBtn.style.display = 'none';
    } else if (ageVerificationStatus === 'failed') {
      if (statusContainer) {
        statusContainer.innerHTML = `
          <div style="display: flex; align-items: center; gap: 8px; color: #dc2626;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M15 9l-6 6"/>
              <path d="M9 9l6 6"/>
            </svg>
            <span style="font-weight: 600;">${t.verificationFailed}</span>
          </div>
          <p style="margin: 4px 0 0 28px; font-size: 12px; color: #6b7280;">${t.verificationFailedMessage}</p>
        `;
      }
      if (verifyBtn) {
        verifyBtn.textContent = t.retryVerification;
        verifyBtn.style.display = 'inline-flex';
      }
    }
  }

  // Consistent hash function - uses same algorithm for both async and sync
  // Returns 64-character hex string (full SHA-256 length)
  function hashStringSync(str) {
    if (!str) return null;

    // Normalize the string (lowercase, trim)
    const normalized = str.toLowerCase().trim();

    // Use a consistent hash algorithm that produces same result every time
    // This is a modified djb2 hash that produces 64-character hex output
    let hash1 = 5381;
    let hash2 = 0;
    let hash3 = 52711;
    let hash4 = 0;

    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i);
      hash1 = ((hash1 << 5) + hash1) + char;
      hash2 = ((hash2 << 5) + hash2) + (char * 31);
      hash3 = ((hash3 << 5) + hash3) ^ char;
      hash4 = ((hash4 << 5) + hash4) + (char * 17);
    }

    // Combine hashes and convert to 64-character hex string
    const hex1 = Math.abs(hash1).toString(16).padStart(16, '0');
    const hex2 = Math.abs(hash2).toString(16).padStart(16, '0');
    const hex3 = Math.abs(hash3).toString(16).padStart(16, '0');
    const hex4 = Math.abs(hash4).toString(16).padStart(16, '0');
    return (hex1 + hex2 + hex3 + hex4).substring(0, 64);
  }

  // Async version that uses Web Crypto API if available, otherwise uses sync version
  async function hashString(str) {
    if (!str) return null;

    // Normalize the string (lowercase, trim)
    const normalized = str.toLowerCase().trim();

    // Use Web Crypto API if available (more secure)
    if (window.crypto && window.crypto.subtle) {
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(normalized);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        // Return full 64-character SHA-256 hex string
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      } catch (e) {
        // Fallback to sync hash if crypto fails
        console.warn('[Consently DPDPA] Web Crypto API failed, using fallback hash:', e);
        return hashStringSync(normalized);
      }
    }

    // Use sync hash for consistency
    return hashStringSync(normalized);
  }

  // Generate device fingerprint based on stable browser/device characteristics
  // Uses only stable values that don't change between sessions
  function generateDeviceFingerprint() {
    const components = [];

    // User agent (stable - only changes with browser updates)
    if (navigator.userAgent) {
      components.push(navigator.userAgent);
    }

    // Use maximum screen dimensions (more stable than current resolution)
    // This avoids issues when window is resized
    if (screen.width && screen.height) {
      // Use max available dimensions for stability
      const maxWidth = Math.max(screen.width, screen.availWidth || screen.width);
      const maxHeight = Math.max(screen.height, screen.availHeight || screen.height);
      components.push(`max${maxWidth}x${maxHeight}`);
    }

    // Color depth (stable)
    if (screen.colorDepth) {
      components.push(`cd${screen.colorDepth}`);
    }

    // Pixel depth (stable)
    if (screen.pixelDepth) {
      components.push(`pd${screen.pixelDepth}`);
    }

    // Timezone (stable for user's location)
    try {
      components.push(Intl.DateTimeFormat().resolvedOptions().timeZone || '');
    } catch (e) { }

    // Language (stable)
    if (navigator.language) {
      components.push(navigator.language);
    }

    // Platform (stable)
    if (navigator.platform) {
      components.push(navigator.platform);
    }

    // Hardware concurrency (CPU cores - stable)
    if (navigator.hardwareConcurrency) {
      components.push(`hc${navigator.hardwareConcurrency}`);
    }

    // Device memory (if available - stable)
    if (navigator.deviceMemory) {
      components.push(`dm${navigator.deviceMemory}`);
    }

    // Max touch points (stable)
    if (navigator.maxTouchPoints) {
      components.push(`mtp${navigator.maxTouchPoints}`);
    }

    // Vendor (stable)
    if (navigator.vendor) {
      components.push(navigator.vendor);
    }

    // Canvas fingerprint (simplified - use consistent text for stability)
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Use consistent rendering for stability
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('ConsentlyDeviceFingerprint', 2, 2);
        // Use first 50 chars for consistency
        const canvasData = canvas.toDataURL();
        components.push(canvasData.substring(0, 50));
      }
    } catch (e) { }

    return components.join('|');
  }

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
      document.cookie = `consently_id=${id}; max-age=${365 * 24 * 60 * 60 * 10}; path=/; SameSite=Lax`;
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
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/dpdpa/verify-consent-id`, {
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

  // Check user status (New vs Verified)
  async function checkUserStatus(emailHash) {
    if (!emailHash) return { status: 'new' };

    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/dpdpa/check-user-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailHash: emailHash,
          widgetId: widgetId
        })
      });

      if (response.ok) {
        return await response.json();
      }
      return { status: 'new' };
    } catch (error) {
      console.error('[Consently DPDPA] Check user status error:', error);
      return { status: 'new' };
    }
  }

  // Show error message to site owners (visible but non-intrusive)
  function showWidgetError(message, isCritical = false) {
    // Only show visible errors in development or if explicitly enabled
    const isDevelopment = window.location.hostname === 'localhost' ||
      window.location.hostname.includes('127.0.0.1') ||
      window.location.hostname.includes('consently.in');

    if (!isDevelopment && !isCritical) {
      // In production, only log to console
      console.warn('[Consently DPDPA]', message);
      return;
    }

    // Create a subtle error banner for site owners
    const errorBanner = document.createElement('div');
    errorBanner.id = 'consently-widget-error';
    errorBanner.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: ${isCritical ? '#fee2e2' : '#fef3c7'};
      border: 1px solid ${isCritical ? '#fca5a5' : '#fcd34d'};
      border-radius: 8px;
      padding: 12px 16px;
      max-width: 400px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 13px;
      line-height: 1.5;
      color: ${isCritical ? '#991b1b' : '#92400e'};
    `;

    errorBanner.innerHTML = `
      <div style="display: flex; align-items: flex-start; gap: 8px;">
        <span style="font-size: 18px;">${isCritical ? '⚠️' : 'ℹ️'}</span>
        <div style="flex: 1;">
          <strong style="display: block; margin-bottom: 4px;">Consently Widget ${isCritical ? 'Error' : 'Notice'}</strong>
          <div>${message}</div>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" 
                style="background: none; border: none; font-size: 18px; cursor: pointer; color: inherit; opacity: 0.6; padding: 0; line-height: 1;">
          ×
        </button>
      </div>
    `;

    document.body.appendChild(errorBanner);

    // Auto-remove after 10 seconds for non-critical errors
    if (!isCritical) {
      setTimeout(() => {
        if (errorBanner.parentElement) {
          errorBanner.remove();
        }
      }, 10000);
    }
  }

  // Fetch widget configuration from API
  async function fetchWidgetConfig() {
    try {
      const scriptSrc = currentScript.src;
      let apiBase;

      if (scriptSrc && scriptSrc.includes('http')) {
        const url = new URL(scriptSrc);
        apiBase = url.origin;
      } else {
        apiBase = window.location.origin;
      }

      const apiUrl = `${apiBase}/api/dpdpa/widget-public/${widgetId}`;
      console.log('[Consently DPDPA] Fetching configuration from:', apiUrl);

      // Add cache-buster to ensure fresh data
      const cacheBuster = Date.now();
      const apiUrlWithCache = `${apiUrl}?_t=${cacheBuster}`;

      const response = await fetch(apiUrlWithCache, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 404) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error || 'Widget configuration not found';

          console.error('[Consently DPDPA] Widget not found:', {
            widgetId: widgetId,
            status: response.status,
            error: errorMessage,
            hint: 'This widget may have been deleted. Please check your Consently dashboard and create a new widget if needed.'
          });

          // Show user-friendly error message
          showWidgetError(
            `Widget ID "${widgetId}" not found. This widget may have been deleted. ` +
            `Please check your Consently dashboard or contact support if this persists.`,
            true
          );

          return { success: false, error: 'WIDGET_NOT_FOUND', status: 404 };
        } else if (response.status === 429) {
          console.warn('[Consently DPDPA] Rate limit exceeded. Retrying later...');
          return { success: false, error: 'RATE_LIMIT', status: 429 };
        } else {
          const errorText = await response.text().catch(() => response.statusText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
      }

      const data = await response.json();
      config = data;
      allActivities = JSON.parse(JSON.stringify(data.activities || [])); // Store deep copy
      activities = data.activities || [];

      console.log('[Consently DPDPA] Configuration loaded:', config.name);
      console.log('[Consently DPDPA] Activities loaded:', activities.length);
      if (activities.length > 0) {
        console.log('[Consently DPDPA] First activity:', activities[0]);
        console.log('[Consently DPDPA] Activity structure check:', {
          hasPurposes: !!activities[0].purposes,
          hasDataAttributes: !!activities[0].data_attributes,
          purposesCount: activities[0].purposes?.length || 0,
          dataAttributesCount: activities[0].data_attributes?.length || 0
        });
      } else {
        console.warn('[Consently DPDPA] No activities found in configuration!');
        console.log('[Consently DPDPA] Full config:', data);
      }
      return { success: true };
    } catch (error) {
      // Network errors or other exceptions
      console.error('[Consently DPDPA] Failed to load configuration:', error);

      // Check if it's a network error
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        showWidgetError(
          'Unable to connect to Consently service. Please check your internet connection.',
          false
        );
        return { success: false, error: 'NETWORK_ERROR' };
      }

      return { success: false, error: 'UNKNOWN_ERROR', message: error.message };
    }
  }

  // URL pattern matching for display rules (with security validation)
  function matchesUrlPattern(url, rule) {
    // Input validation
    if (!url || typeof url !== 'string') {
      console.warn('[Consently DPDPA] Invalid URL provided to matchesUrlPattern');
      return false;
    }

    if (!rule || typeof rule !== 'object') {
      console.warn('[Consently DPDPA] Invalid rule provided to matchesUrlPattern');
      return false;
    }

    if (!rule.url_pattern) return true; // No pattern = match all

    const pattern = rule.url_pattern;
    const matchType = rule.url_match_type || 'contains';

    // Security: Limit pattern length to prevent DoS
    if (pattern.length > 500) {
      console.warn('[Consently DPDPA] URL pattern too long, skipping:', rule.id || 'unknown');
      return false;
    }

    try {
      switch (matchType) {
        case 'exact':
          return url === pattern;
        case 'contains':
          return url.includes(pattern);
        case 'startsWith':
          return url.startsWith(pattern);
        case 'regex':
          // Security: Validate regex pattern before using
          try {
            // Test regex compilation (prevent ReDoS attacks)
            const regex = new RegExp(pattern);
            // Limit execution time by using test with timeout consideration
            return regex.test(url);
          } catch (e) {
            console.error('[Consently DPDPA] Invalid regex pattern in rule:', rule.id || 'unknown', e);
            return false;
          }
        default:
          console.warn('[Consently DPDPA] Unknown match type:', matchType);
          return url.includes(pattern);
      }
    } catch (error) {
      console.error('[Consently DPDPA] Error matching URL pattern:', error);
      return false;
    }
  }

  // Show notice for a specific rule (called after consent check)
  function showNoticeForRule(rule) {
    console.log('[Consently DPDPA] Showing notice for rule:', rule.rule_name);
    console.log('[Consently DPDPA] Activities to show:', activities.length);

    // Apply rule (filter activities and update notice)
    applyRule(rule);

    // Handle trigger type
    if (rule.trigger_type === 'onPageLoad') {
      // Show widget after delay
      setTimeout(() => {
        showConsentWidget();
      }, rule.trigger_delay || 0);
    }
    // Other trigger types (onClick, onFormSubmit) are handled separately
  }

  // Setup click trigger
  function setupClickTrigger(rule) {
    const element = document.querySelector(rule.element_selector);
    if (!element) {
      console.warn('[Consently DPDPA] Element not found for click trigger:', rule.element_selector);
      return;
    }

    element.addEventListener('click', (e) => {
      e.preventDefault();
      applyRule(rule);
      trackRuleMatch(rule);
      showConsentWidget();
    }, { once: true });
  }

  // Setup form submit trigger with auto-detection
  function setupFormSubmitTrigger(rule) {
    let targetForms = [];

    // If element_selector is provided, use it
    if (rule.element_selector) {
      const form = document.querySelector(rule.element_selector);
      if (form) {
        targetForms = [form];
      } else {
        console.warn('[Consently DPDPA] Form not found for submit trigger:', rule.element_selector);
      }
    } else {
      // Auto-detect all forms on the page
      targetForms = Array.from(document.querySelectorAll('form'));
      console.log('[Consently DPDPA] Auto-detected forms:', targetForms.length);
    }

    if (targetForms.length === 0) {
      console.warn('[Consently DPDPA] No forms found on page for submit trigger');
      return;
    }

    // Store original form handlers to re-trigger after consent
    const formHandlers = new WeakMap();

    targetForms.forEach(form => {
      const submitHandler = async (e) => {
        // Check if consent already given
        const existingConsent = ConsentStorage.get(`consently_dpdpa_consent_${widgetId}`);
        const hasConsent = existingConsent && existingConsent.timestamp;

        // If no consent, prevent form submission and show widget
        if (!hasConsent) {
          e.preventDefault();
          e.stopPropagation();

          console.log('[Consently DPDPA] Form submission intercepted - showing consent widget');

          // Smart Pre-fill Logic
          let prefilledEmail = null;
          let userStatus = 'new';

          // Scan for email field
          // Check if smart pre-fill is enabled
          if (!config.enableSmartPreFill) {
            console.log('[Consently DPDPA] Smart pre-fill is disabled by site owner - using manual input');
            prefilledEmail = null;
            userStatus = 'new';
          } else {
            // Parse custom selectors from config (fallback to defaults)
            const selectors = config.emailFieldSelectors || 'input[type="email"], input[name*="email" i]';

            let emailInput = null;
            try {
              emailInput = form.querySelector(selectors);
              if (!emailInput) {
                console.log('[Consently DPDPA] No email field found with selectors:', selectors);
              }
            } catch (e) {
              console.error('[Consently DPDPA] Invalid email field selector:', selectors, e);
              console.log('[Consently DPDPA] Falling back to manual email input');
            }

            if (emailInput && emailInput.value) {
              prefilledEmail = emailInput.value;
              console.log('[Consently DPDPA] ✓ Smart Pre-fill: Found email in form:', prefilledEmail);

              // Check user status
              const emailHash = await hashString(prefilledEmail);
              const statusResult = await checkUserStatus(emailHash);
              userStatus = statusResult.status || 'new';
              console.log('[Consently DPDPA] User status:', userStatus, userStatus === 'verified' ? '(returning user)' : '(new user)');
            } else {
              console.log('[Consently DPDPA] No email found, user will need to enter email manually');
            }
          }

          // Apply rule and show widget
          applyRule(rule);
          trackRuleMatch(rule);

          // Store the form and event for later submission
          const formData = new FormData(form);
          const submitButton = e.submitter || form.querySelector('[type="submit"]');

          // Show widget and handle consent
          console.log('[Consently DPDPA] Showing widget with pre-filled email:', prefilledEmail || 'none');
          showConsentWidget(prefilledEmail, userStatus);

          // Listen for consent completion to resume form submission
          window.addEventListener('consentlyDPDPAConsent', function handleConsent(consentEvent) {
            console.log('[Consently DPDPA] Consent received, allowing form submission');

            // Remove this listener
            window.removeEventListener('consentlyDPDPAConsent', handleConsent);

            // Re-submit the form after a short delay
            setTimeout(() => {
              // Remove the submit listener temporarily to avoid recursion
              form.removeEventListener('submit', submitHandler);

              // Trigger form submission
              if (submitButton) {
                submitButton.click();
              } else {
                form.submit();
              }

              // Re-attach listener for future submissions
              setTimeout(() => {
                form.addEventListener('submit', submitHandler, { capture: true });
              }, 100);
            }, 300);
          }, { once: true });
        } else {
          console.log('[Consently DPDPA] Consent already exists, allowing form submission');
        }
      };

      // Use capture phase to intercept before other handlers
      form.addEventListener('submit', submitHandler, { capture: true });
      console.log('[Consently DPDPA] Form submit listener attached:', form.id || form.name || 'unnamed form');
    });
  }

  // Setup scroll trigger
  function setupScrollTrigger(rule) {
    // Default scroll threshold is 50% if not specified
    const scrollThreshold = rule.scroll_threshold !== undefined ? rule.scroll_threshold : 50;
    let hasTriggered = false;

    console.log('[Consently DPDPA] Setting up scroll trigger for rule:', rule.rule_name, 'Threshold:', scrollThreshold + '%');

    // Calculate scroll percentage
    function getScrollPercentage() {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollableHeight = documentHeight - windowHeight;
      const scrolled = scrollTop;

      if (scrollableHeight === 0) return 0;
      return Math.round((scrolled / scrollableHeight) * 100);
    }

    // Throttled scroll handler (check every 100ms)
    let lastCheck = 0;
    const scrollHandler = () => {
      const now = Date.now();
      if (now - lastCheck < 100) return; // Throttle to 100ms
      lastCheck = now;

      if (hasTriggered) {
        // Remove listener once triggered
        window.removeEventListener('scroll', scrollHandler);
        window.removeEventListener('wheel', scrollHandler);
        window.removeEventListener('touchmove', scrollHandler);
        return;
      }

      const scrollPercent = getScrollPercentage();

      if (scrollPercent >= scrollThreshold) {
        console.log('[Consently DPDPA] Scroll threshold reached:', scrollPercent + '%');
        hasTriggered = true;

        // Apply rule and show widget
        applyRule(rule);

        // Apply delay if specified
        const delay = rule.trigger_delay || 0;
        setTimeout(() => {
          showConsentWidget();
        }, delay);

        // Track rule match for analytics
        trackRuleMatch(rule);

        // Remove listeners
        window.removeEventListener('scroll', scrollHandler);
        window.removeEventListener('wheel', scrollHandler);
        window.removeEventListener('touchmove', scrollHandler);
      }
    };

    // Attach scroll listeners
    window.addEventListener('scroll', scrollHandler, { passive: true });
    window.addEventListener('wheel', scrollHandler, { passive: true });
    window.addEventListener('touchmove', scrollHandler, { passive: true });

    // Check initial scroll position (in case page is already scrolled)
    setTimeout(() => {
      scrollHandler();
    }, 500);

    // Return cleanup function
    return () => {
      window.removeEventListener('scroll', scrollHandler);
      window.removeEventListener('wheel', scrollHandler);
      window.removeEventListener('touchmove', scrollHandler);
    };
  }

  // Evaluate display rules and return matched rule (don't show widget yet)
  function evaluateDisplayRules() {
    try {
      // Validate config
      if (!config || typeof config !== 'object') {
        console.warn('[Consently DPDPA] Invalid config in evaluateDisplayRules');
        return null;
      }

      const rules = config.display_rules || [];
      // Prefer full URL (pathname + query) for matching; fall back to pathname
      const currentUrlForMatching = (typeof window !== 'undefined' && window.location && (window.location.href || window.location.pathname)) || '/';

      // Input validation
      if (typeof currentUrlForMatching !== 'string') {
        console.warn('[Consently DPDPA] Invalid URL in evaluateDisplayRules');
        return null;
      }

      console.log('[Consently DPDPA] Evaluating display rules for URL:', currentUrlForMatching);
      console.log('[Consently DPDPA] Available rules:', rules.length);

      if (!Array.isArray(rules) || rules.length === 0) {
        console.log('[Consently DPDPA] No display rules configured');
        return null; // No rules to evaluate
      }

      // Validate and filter rules (security: prevent malformed rules)
      const validRules = rules.filter(rule => {
        if (!rule || typeof rule !== 'object') {
          console.warn('[Consently DPDPA] Invalid rule structure, skipping');
          return false;
        }

        // Validate rule has required fields
        if (!rule.id || !rule.rule_name || !rule.url_pattern) {
          console.warn('[Consently DPDPA] Rule missing required fields, skipping:', rule.id || 'unknown');
          return false;
        }

        // Validate rule ID format (prevent injection)
        if (typeof rule.id !== 'string' || rule.id.length > 100) {
          console.warn('[Consently DPDPA] Invalid rule ID, skipping:', rule.id);
          return false;
        }

        return true;
      });

      // Sort rules by priority (higher priority first)
      const sortedRules = [...validRules].sort((a, b) => {
        const priorityA = typeof a.priority === 'number' ? a.priority : 100;
        const priorityB = typeof b.priority === 'number' ? b.priority : 100;
        return priorityB - priorityA;
      });

      // Find first matching rule
      for (const rule of sortedRules) {
        if (rule.is_active === false) {
          console.log('[Consently DPDPA] Rule inactive:', rule.rule_name);
          continue;
        }

        // Check URL match (with error handling)
        try {
          if (matchesUrlPattern(currentUrlForMatching, rule)) {
            console.log('[Consently DPDPA] Rule matched:', rule.rule_name);

            // Check element selector if provided
            if (rule.element_selector) {
              try {
                const element = document.querySelector(rule.element_selector);
                if (!element) {
                  console.log('[Consently DPDPA] Element not found:', rule.element_selector);
                  continue;
                }
              } catch (selectorError) {
                console.error('[Consently DPDPA] Invalid selector:', rule.element_selector, selectorError);
                continue;
              }
            }

            // Return matched rule (don't show widget yet - consent check comes first)
            return rule;
          }
        } catch (matchError) {
          console.error('[Consently DPDPA] Error matching rule:', rule.id, matchError);
          continue; // Skip this rule and try next
        }
      }

      console.log('[Consently DPDPA] No matching rules found');
      return null; // No rules matched
    } catch (error) {
      console.error('[Consently DPDPA] Error in evaluateDisplayRules:', error);
      return null; // Fail gracefully
    }
  }

  // Apply rule (filter activities and purposes, update notice content)
  function applyRule(rule) {
    // Reset activities from source of truth to ensure we start with a full set
    if (allActivities.length > 0) {
      activities = JSON.parse(JSON.stringify(allActivities));
      // Also update config.activities to match
      if (config) config.activities = activities;
    }

    // Store the matched rule for consent tracking
    config._matchedRule = rule;

    // SECURITY: If a rule matches a specific URL pattern, it MUST specify activities
    // Otherwise, we won't show the widget to prevent accidentally showing all activities
    const currentPath = window.location.pathname || '/';
    const currentHref = window.location.href || currentPath;
    if (rule.url_pattern && rule.url_pattern !== '*' && rule.url_pattern !== '/*') {
      if (!rule.activities || !Array.isArray(rule.activities) || rule.activities.length === 0) {
        console.error('[Consently DPDPA] ❌ Display rule matched for:', currentPath);
        console.error('[Consently DPDPA] ❌ Full URL:', currentHref);
        console.error('[Consently DPDPA] ❌ Rule:', rule.rule_name);
        console.error('[Consently DPDPA] ❌ URL pattern:', rule.url_pattern, '| Match type:', rule.url_match_type || 'contains');
        console.error('[Consently DPDPA] ❌ BUT rule does not specify which activities to show!');
        console.error('[Consently DPDPA] ❌ Widget will NOT be shown to prevent showing all activities');
        console.error('[Consently DPDPA] ❌ To fix: Add "activities" array to the display rule with only the activities you want to show');
        // Don't show widget if rule doesn't specify activities - this prevents accidental exposure
        return; // Exit early, don't show widget
      }
    }

    // Filter activities if rule specifies which activities to show
    if (rule.activities && Array.isArray(rule.activities) && rule.activities.length > 0) {
      console.log('[Consently DPDPA] Filtering activities for rule:', rule.rule_name);
      console.log('[Consently DPDPA] Rule activities:', rule.activities);
      console.log('[Consently DPDPA] Available activities before filter:', activities.length);

      // Debug: Log all activity IDs for comparison
      console.log('[Consently DPDPA] Available activity IDs:', activities.map(a => ({
        id: a.id,
        name: a.activity_name || a.activityName
      })));

      // Store original activities
      const originalActivities = [...activities];

      // Get available activity IDs from widget
      const availableActivityIds = activities.map(a => a.id);

      // Validate and filter rule activities to only include those that exist in widget
      const validRuleActivityIds = rule.activities.filter(activityId =>
        availableActivityIds.includes(activityId)
      );

      // Log mismatches for debugging
      const invalidActivityIds = rule.activities.filter(activityId =>
        !availableActivityIds.includes(activityId)
      );

      if (invalidActivityIds.length > 0) {
        console.warn('[Consently DPDPA] ⚠️ Some rule activity IDs do not match widget activities');
        console.warn('[Consently DPDPA] Invalid activity IDs in rule:', invalidActivityIds);
        console.warn('[Consently DPDPA] Valid activity IDs in widget:', availableActivityIds);
        console.warn('[Consently DPDPA] → Filtering out invalid IDs and continuing with valid ones');
      }

      // Filter activities based on validated rule activities
      const filteredActivities = activities.filter(activity =>
        validRuleActivityIds.includes(activity.id)
      );

      console.log('[Consently DPDPA] Filtered activities count:', filteredActivities.length);
      console.log('[Consently DPDPA] Rule specifies:', rule.activities.length, 'activities');
      console.log('[Consently DPDPA] Widget has:', availableActivityIds.length, 'activities');
      console.log('[Consently DPDPA] Matched:', filteredActivities.length, 'activities');

      // IMPORTANT: Always apply the filter, even if it results in 0 activities
      // This is the correct behavior - if rule specifies activities that don't exist,
      // show nothing rather than showing everything
      if (filteredActivities.length === 0) {
        console.warn('[Consently DPDPA] ⚠️ No activities matched rule filter!');
        console.warn('[Consently DPDPA] Rule activity IDs:', rule.activities);
        console.warn('[Consently DPDPA] Widget activity IDs:', availableActivityIds);
        console.warn('[Consently DPDPA] → Widget will show ZERO activities (correct behavior)');
        console.warn('[Consently DPDPA] → Fix: Ensure rule activities are in widget\'s selected_activities list');
      }

      // Update global activities array (used by widget) - ALWAYS filter
      activities.length = 0;
      activities.push(...filteredActivities);

      // Update config activities (if used elsewhere)
      if (config.activities) {
        config.activities = filteredActivities;
      }

      // Also update the rule's activities array to only include valid IDs
      // This ensures activity_purposes filtering works correctly
      rule.activities = validRuleActivityIds;

      // IMPORTANT: If no activities remain after filtering, don't show the widget
      if (filteredActivities.length === 0) {
        console.warn('[Consently DPDPA] ⚠️ Not showing widget because no activities remain after display rule filtering');
        console.warn('[Consently DPDPA] This is the correct behavior - fix by ensuring rule activities match widget activities');
        return; // Exit early, don't show widget
      }
    }

    // Filter purposes within activities if rule specifies which purposes to show
    if (rule.activity_purposes && typeof rule.activity_purposes === 'object') {
      console.log('[Consently DPDPA] Filtering purposes for rule:', rule.rule_name);
      console.log('[Consently DPDPA] Rule activity_purposes:', rule.activity_purposes);

      // Clean up activity_purposes object: remove entries for activities that don't exist in widget
      const availableActivityIds = activities.map(a => a.id);
      const cleanedActivityPurposes = {};
      Object.keys(rule.activity_purposes).forEach(activityId => {
        if (availableActivityIds.includes(activityId)) {
          cleanedActivityPurposes[activityId] = rule.activity_purposes[activityId];
        } else {
          console.warn('[Consently DPDPA] Removing activity_purposes entry for non-existent activity:', activityId);
        }
      });
      rule.activity_purposes = cleanedActivityPurposes;

      // Filter purposes for each activity
      activities.forEach(activity => {
        const allowedPurposeIds = rule.activity_purposes[activity.id];

        // Only filter if:
        // 1. allowedPurposeIds is defined (activity is in activity_purposes object)
        // 2. allowedPurposeIds is an array
        // 3. allowedPurposeIds has at least one element (non-empty array)
        // If activity is not in activity_purposes, or array is empty, show all purposes
        if (allowedPurposeIds && Array.isArray(allowedPurposeIds) && allowedPurposeIds.length > 0) {
          console.log('[Consently DPDPA] Filtering purposes for activity:', activity.id, 'Allowed purposes:', allowedPurposeIds);

          // Filter purposes within this activity
          if (activity.purposes && Array.isArray(activity.purposes)) {
            const originalPurposeCount = activity.purposes.length;

            // DEBUG: Log all purposes before filtering
            console.log('[Consently DPDPA] DEBUG - Purposes before filter:');
            activity.purposes.forEach(p => {
              console.log(`  - Purpose: ${p.purposeName}, purposeId: ${p.purposeId}, id: ${p.id}`);
              console.log(`    Allowed? ${allowedPurposeIds.includes(p.purposeId)} (purposeId) or ${allowedPurposeIds.includes(p.id)} (id)`);
            });

            // CRITICAL FIX: Use purposeId (the actual purpose UUID), NOT id (activity_purposes join table ID)
            activity.purposes = activity.purposes.filter(purpose => {
              // purposeId is the actual purpose UUID from purposes table
              // id is the activity_purposes join table ID (wrong field to use)
              const matches = allowedPurposeIds.includes(purpose.purposeId);
              if (!matches) {
                console.log('[Consently DPDPA] DEBUG - Filtering out purpose:', purpose.purposeName, 'purposeId:', purpose.purposeId);
              }
              return matches;
            });

            console.log('[Consently DPDPA] Filtered purposes for activity:', activity.id, 'from', originalPurposeCount, 'to', activity.purposes.length);

            // Warn if filtering results in no purposes
            if (activity.purposes.length === 0) {
              console.warn('[Consently DPDPA] Warning: Activity', activity.id, 'has no purposes after filtering!');
              console.warn('[Consently DPDPA] Allowed purpose IDs:', allowedPurposeIds);
              console.warn('[Consently DPDPA] Check that purpose IDs in activity_purposes match actual purpose UUIDs');
            }
          }
        } else {
          // Activity not in activity_purposes or empty array = show all purposes
          console.log('[Consently DPDPA] Showing all purposes for activity:', activity.id, '(no purpose filtering specified)');
        }
      });
    }

    // Update notice content if rule has notice_content
    const notice = rule.notice_content;
    if (notice) {
      if (notice.title) config.title = notice.title;
      if (notice.message) config.message = notice.message;

      // If rule has HTML, use it, but only if it's not the generic placeholder
      // Otherwise, we'll regenerate it from the filtered activities below
      if (notice.html && !notice.html.includes('By submitting this form')) {
        config.privacyNoticeHTML = notice.html;
      } else {
        // Regenerate detailed notice based on the activities filtered by this rule
        config.privacyNoticeHTML = generatePrivacyNoticeFromActivities(activities, config.domain || window.location.hostname);
      }
    } else {
      // No notice content in rule, but activities might have been filtered
      // Regenerate to reflect only the activities matched by this rule
      config.privacyNoticeHTML = generatePrivacyNoticeFromActivities(activities, config.domain || window.location.hostname);
    }
  }

  // Helper: Retry function with exponential backoff
  async function retryWithBackoff(fn, maxRetries = 3, initialDelay = 1000) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        // Check if error is retryable (network errors, 5xx, timeout)
        const isRetryable =
          error.name === 'AbortError' ||
          error.message.includes('timeout') ||
          error.message.includes('network') ||
          error.message.includes('500') ||
          error.message.includes('502') ||
          error.message.includes('503') ||
          error.message.includes('504');

        // Don't retry for client errors (4xx)
        if (!isRetryable || attempt === maxRetries) {
          throw lastError;
        }

        // Calculate delay with exponential backoff: 1s, 2s, 4s
        const delay = initialDelay * Math.pow(2, attempt - 1);
        console.log(`[Consently DPDPA] Retry attempt ${attempt}/${maxRetries} in ${delay}ms...`);

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  // Record consent to API (with enhanced error handling, validation, and retry logic)
  async function recordConsent(consentData) {
    try {
      // UUID validation regex
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      // Validate consent data
      if (!consentData || typeof consentData !== 'object') {
        throw new Error('Invalid consent data');
      }

      if (!consentData.widgetId || !consentData.visitorId || !consentData.consentStatus) {
        throw new Error('Missing required consent fields');
      }

      // Validate consent status (including revoked for withdrawal)
      if (!['accepted', 'rejected', 'partial', 'revoked'].includes(consentData.consentStatus)) {
        throw new Error('Invalid consent status');
      }

      // Validate and filter activity arrays to only include valid UUIDs
      if (consentData.acceptedActivities && !Array.isArray(consentData.acceptedActivities)) {
        console.warn('[Consently DPDPA] Invalid acceptedActivities, converting to array');
        consentData.acceptedActivities = [];
      }

      if (consentData.rejectedActivities && !Array.isArray(consentData.rejectedActivities)) {
        console.warn('[Consently DPDPA] Invalid rejectedActivities, converting to array');
        consentData.rejectedActivities = [];
      }

      // Filter to only valid UUIDs
      if (consentData.acceptedActivities) {
        const originalLength = consentData.acceptedActivities.length;
        consentData.acceptedActivities = consentData.acceptedActivities.filter(id =>
          typeof id === 'string' && uuidRegex.test(id)
        );
        if (consentData.acceptedActivities.length !== originalLength) {
          console.warn('[Consently DPDPA] Filtered out invalid UUIDs from acceptedActivities');
        }
      }

      if (consentData.rejectedActivities) {
        const originalLength = consentData.rejectedActivities.length;
        consentData.rejectedActivities = consentData.rejectedActivities.filter(id =>
          typeof id === 'string' && uuidRegex.test(id)
        );
        if (consentData.rejectedActivities.length !== originalLength) {
          console.warn('[Consently DPDPA] Filtered out invalid UUIDs from rejectedActivities');
        }
      }

      // Validate and filter activityPurposeConsents
      if (consentData.activityPurposeConsents && typeof consentData.activityPurposeConsents === 'object') {
        const filtered = {};
        for (const [activityId, purposeIds] of Object.entries(consentData.activityPurposeConsents)) {
          // Validate activity ID is UUID
          if (typeof activityId === 'string' && uuidRegex.test(activityId)) {
            // Validate purpose IDs are UUIDs
            if (Array.isArray(purposeIds)) {
              const validPurposeIds = purposeIds.filter(id =>
                typeof id === 'string' && uuidRegex.test(id)
              );
              if (validPurposeIds.length > 0) {
                filtered[activityId] = validPurposeIds;
              }
            }
          }
        }
        consentData.activityPurposeConsents = Object.keys(filtered).length > 0 ? filtered : undefined;
      }

      // Limit activity array sizes (security: prevent abuse)
      if (consentData.acceptedActivities && consentData.acceptedActivities.length > 100) {
        console.warn('[Consently DPDPA] Too many accepted activities, limiting to 100');
        consentData.acceptedActivities = consentData.acceptedActivities.slice(0, 100);
      }

      if (consentData.rejectedActivities && consentData.rejectedActivities.length > 100) {
        console.warn('[Consently DPDPA] Too many rejected activities, limiting to 100');
        consentData.rejectedActivities = consentData.rejectedActivities.slice(0, 100);
      }

      // Clean up metadata - handle empty strings and invalid URLs
      if (consentData.metadata) {
        // Convert empty strings to undefined for optional fields
        if (consentData.metadata.referrer === '' || consentData.metadata.referrer === null) {
          consentData.metadata.referrer = undefined;
        }
        if (consentData.metadata.pageTitle === '' || consentData.metadata.pageTitle === null) {
          consentData.metadata.pageTitle = undefined;
        }

        // Validate currentUrl is a valid URL, otherwise set to undefined
        if (consentData.metadata.currentUrl) {
          try {
            // Try to create a URL object to validate
            new URL(consentData.metadata.currentUrl);
          } catch (e) {
            console.warn('[Consently DPDPA] Invalid currentUrl, removing:', consentData.metadata.currentUrl);
            consentData.metadata.currentUrl = undefined;
          }
        }
      }

      const scriptSrc = currentScript.src;
      let apiBase;

      try {
        if (scriptSrc && scriptSrc.includes('http')) {
          const url = new URL(scriptSrc);
          apiBase = url.origin;
        } else {
          apiBase = window.location.origin;
        }
      } catch (e) {
        console.error('[Consently DPDPA] Error parsing script URL:', e);
        apiBase = window.location.origin;
      }

      const apiUrl = `${apiBase}/api/dpdpa/consent-record`;

      // Wrap fetch call with retry logic (3 attempts with exponential backoff)
      const result = await retryWithBackoff(async () => {
        // Add timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        try {
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(consentData),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            // Try to get error details from response
            let errorMessage = 'Failed to record consent';
            let validationDetails = null;
            try {
              const errorData = await response.json();
              errorMessage = errorData.error || errorMessage;

              // Log validation details if available
              if (errorData.details && Array.isArray(errorData.details)) {
                validationDetails = errorData.details;
                console.error('[Consently DPDPA] Validation errors:', validationDetails);
                console.error('[Consently DPDPA] Full error response:', errorData);
              } else {
                console.error('[Consently DPDPA] API error response:', errorData);
              }
            } catch (e) {
              // Ignore JSON parse errors
              console.error('[Consently DPDPA] Failed to parse error response:', e);
            }

            // Include validation details in error message for debugging
            if (validationDetails && validationDetails.length > 0) {
              const detailMessages = validationDetails.map(d => `${d.field}: ${d.message}`).join('; ');
              throw new Error(errorMessage + ' (HTTP ' + response.status + ') - ' + detailMessages);
            } else {
              throw new Error(errorMessage + ' (HTTP ' + response.status + ')');
            }
          }

          const result = await response.json();
          console.log('[Consently DPDPA] Consent recorded successfully');
          return result;
        } catch (fetchError) {
          clearTimeout(timeoutId);

          if (fetchError.name === 'AbortError') {
            throw new Error('Request timeout: Could not record consent');
          }
          throw fetchError;
        }
      }, 3, 1000); // 3 retries, starting with 1 second delay

      return result;
    } catch (error) {
      console.error('[Consently DPDPA] Failed to record consent:', error);

      // Don't expose internal error details to user
      const userFriendlyError = error instanceof Error
        ? (error.message.includes('timeout') ? error.message : 'Failed to save consent. Please try again.')
        : 'Failed to save consent. Please try again.';

      throw new Error(userFriendlyError);
    }
  }

  // Track rule match for analytics
  async function trackRuleMatch(rule) {
    try {
      // Don't track if rule is already tracked for this session
      const sessionKey = `consently_dpdpa_rule_tracked_${widgetId}_${rule.id}`;
      if (sessionStorage.getItem(sessionKey)) {
        return; // Already tracked in this session
      }
      sessionStorage.setItem(sessionKey, 'true');

      const scriptSrc = currentScript.src;
      let apiBase;

      try {
        if (scriptSrc && scriptSrc.includes('http')) {
          const url = new URL(scriptSrc);
          apiBase = url.origin;
        } else {
          apiBase = window.location.origin;
        }
      } catch (e) {
        console.error('[Consently DPDPA] Error parsing script URL:', e);
        apiBase = window.location.origin;
      }

      const apiUrl = `${apiBase}/api/dpdpa/analytics/rule-match`;

      // Detect device type
      const userAgent = navigator.userAgent || '';
      const deviceType = /mobile|iphone|ipod|blackberry|windows phone|android.*mobile/i.test(userAgent)
        ? 'Mobile'
        : /tablet|ipad|playbook|silk|android(?!.*mobi)/i.test(userAgent)
          ? 'Tablet'
          : 'Desktop';

      const matchEvent = {
        widgetId: widgetId,
        visitorId: consentID || getConsentID(),
        ruleId: rule.id,
        ruleName: rule.rule_name,
        urlPattern: rule.url_pattern,
        pageUrl: window.location.pathname,
        matchedAt: new Date().toISOString(),
        triggerType: rule.trigger_type,
        userAgent: userAgent,
        deviceType: deviceType,
        language: navigator.language || 'en',
        country: undefined // Can be set via IP geolocation on server
      };

      // Send analytics event (fire and forget - don't block UI)
      fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(matchEvent),
        keepalive: true // Important for page unload scenarios
      }).catch(error => {
        console.error('[Consently DPDPA] Failed to track rule match:', error);
      });

      console.log('[Consently DPDPA] Rule match tracked:', rule.rule_name);
    } catch (error) {
      console.error('[Consently DPDPA] Error tracking rule match:', error);
      // Don't throw - analytics failures shouldn't break the widget
    }
  }

  // Track consent event for analytics
  async function trackConsentEvent(consentData, rule) {
    try {
      const scriptSrc = currentScript.src;
      let apiBase;

      try {
        if (scriptSrc && scriptSrc.includes('http')) {
          const url = new URL(scriptSrc);
          apiBase = url.origin;
        } else {
          apiBase = window.location.origin;
        }
      } catch (e) {
        console.error('[Consently DPDPA] Error parsing script URL:', e);
        apiBase = window.location.origin;
      }

      const apiUrl = `${apiBase}/api/dpdpa/analytics/consent`;

      // Detect device type
      const userAgent = navigator.userAgent || '';
      const deviceType = /mobile|iphone|ipod|blackberry|windows phone|android.*mobile/i.test(userAgent)
        ? 'Mobile'
        : /tablet|ipad|playbook|silk|android(?!.*mobi)/i.test(userAgent)
          ? 'Tablet'
          : 'Desktop';

      const consentEvent = {
        widgetId: widgetId,
        visitorId: consentID || getConsentID(),
        ruleId: rule ? rule.id : undefined,
        ruleName: rule ? rule.rule_name : undefined,
        consentStatus: consentData.consentStatus,
        acceptedActivities: consentData.acceptedActivities || [],
        rejectedActivities: consentData.rejectedActivities || [],
        consentedAt: new Date().toISOString(),
        userAgent: userAgent,
        deviceType: deviceType,
        language: navigator.language || 'en',
        country: undefined // Can be set via IP geolocation on server
      };

      // Send analytics event (fire and forget - don't block UI)
      fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(consentEvent),
        keepalive: true // Important for page unload scenarios
      }).catch(error => {
        console.error('[Consently DPDPA] Failed to track consent event:', error);
      });

      console.log('[Consently DPDPA] Consent event tracked:', consentData.consentStatus);
    } catch (error) {
      console.error('[Consently DPDPA] Error tracking consent event:', error);
      // Don't throw - analytics failures shouldn't break the widget
    }
  }


  // ============================================================================
  // AGE GATE UI HELPERS
  // ============================================================================

  function generateYearOptions() {
    const currentYear = new Date().getFullYear();
    let options = '<option value="" disabled selected>Year...</option>';
    for (let year = currentYear; year >= 1900; year--) {
      options += `<option value="${year}">${year}</option>`;
    }
    return options;
  }

  // Show Age Gate with neutral birth year selector - DEPRECATED in favor of integrated tick box
  async function showAgeGate(onSuccess) {
    onSuccess(); // Just proceed
  }

  // Show Minor Block Screen (when user is identified as minor)
  async function showMinorBlockScreen() {
    console.log('[Consently DPDPA] Showing minor block screen');

    const existingModal = document.getElementById('dpdpa-minor-block-modal');
    if (existingModal) existingModal.remove();

    const theme = config && config.theme ? config.theme : {};
    const themeColor = theme.primaryColor || '#4c8bf5';

    // Get custom message or default
    const t = await getTranslation(config && config.language ? config.language : 'en');
    const minorMessage = config && config.ageGateMinorMessage
      ? config.ageGateMinorMessage
      : t.ageGateDefaultMinorMessage;

    const modal = document.createElement('div');
    modal.id = 'dpdpa-minor-block-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 16px;
    `;

    modal.innerHTML = `
      <div style="background:white;border-radius:16px;padding:32px;max-width:400px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.15);text-align:center;">
        <!-- Icon -->
        <div style="width:80px;height:80px;background:linear-gradient(135deg, #f59e0b 0%, #d97706 100%);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:20px;box-shadow:0 4px 12px rgba(245,158,11,0.3);">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 8V12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 16H12.01" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        
        <!-- Message -->
        <h2 style="margin:0 0 12px 0;font-size:20px;font-weight:700;color:#1a1a1a;">Age Verification Required</h2>
        <p style="color:#64748b;font-size:15px;margin:0 0 24px 0;line-height:1.6;">
          ${escapeHtml(minorMessage)}
        </p>
        
        <!-- Info Box -->
        <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:10px;padding:14px;margin-bottom:16px;">
          <p style="color:#92400e;font-size:13px;margin:0;line-height:1.5;">
            <strong>Why am I seeing this?</strong><br>
            Based on the information provided, you appear to be under the required age. This setting is stored on this device for 1 year.
          </p>
        </div>
        
        <!-- Powered by -->
        <p style="font-size:11px;color:#94a3b8;margin:0;">
          Protected by <strong>Consently</strong> · DPDPA 2023 Compliance
        </p>
      </div>
    `;

    document.body.appendChild(modal);
  }

  // Show OTP Verification Modal (Step 2 after sending OTP)
  async function showOtpVerificationModal(email) {
    const existingModal = document.getElementById('dpdpa-otp-modal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.id = 'dpdpa-otp-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 16px;
    `;

    modal.innerHTML = `
      <div style="background:white;border-radius:16px;padding:28px;max-width:420px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.15);animation:slideUp 0.3s ease-out;text-align:center;">
        <!-- Icon -->
        <div style="width:64px;height:64px;background:linear-gradient(135deg, #4F76F6 0%, #3B5BDB 100%);border-radius:16px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;box-shadow:0 4px 12px rgba(79,118,246,0.25);">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        
        <h2 style="margin:0 0 8px 0;font-size:22px;font-weight:700;color:#1a1a1a;">Enter Verification Code</h2>
        <p style="color:#64748b;font-size:14px;margin:0 0 20px 0;line-height:1.5;">
          We've sent a 6-digit code to<br/>
          <strong style="color:#1e293b;">${escapeHtml(email)}</strong>
        </p>
        
        <!-- OTP Input -->
        <div style="margin-bottom:16px;">
          <input 
            type="text" 
            inputmode="numeric"
            pattern="[0-9]*"
            id="dpdpa-otp-verify-input" 
            placeholder="000000"
            maxlength="6"
            autocomplete="one-time-code"
            style="width:180px;padding:16px 12px;border:2px solid #4F76F6;border-radius:12px;font-size:28px;outline:none;text-align:center;letter-spacing:0.3em;font-family:'SF Mono',monospace;font-weight:700;background:linear-gradient(to right,#4F76F608,#4F76F610);color:#1e293b;box-sizing:border-box;"
            onfocus="this.style.boxShadow='0 0 0 4px rgba(79,118,246,0.15)';"
            onblur="this.style.boxShadow='none';"
          />
        </div>
        
        <div id="dpdpa-otp-error" style="color:#dc2626;margin-bottom:12px;font-size:13px;display:none;font-weight:500;"></div>
        
        <!-- Verify Button -->
        <button 
          id="dpdpa-verify-otp-btn"
          style="width:100%;padding:14px;background:linear-gradient(135deg, #4F76F6 0%, #3B5BDB 100%);border:none;color:white;border-radius:12px;font-weight:600;font-size:16px;cursor:pointer;transition:all 0.2s;box-shadow:0 4px 12px rgba(79,118,246,0.25);margin-bottom:12px;"
        >
          Verify & Continue
        </button>
        
        <!-- Actions -->
        <div style="display:flex;justify-content:center;gap:16px;">
          <button id="dpdpa-resend-otp-btn" style="background:none;border:none;color:#4F76F6;font-weight:600;font-size:13px;cursor:pointer;padding:4px 8px;">
            ↻ Resend Code
          </button>
          <button id="dpdpa-change-email-btn" style="background:none;border:none;color:#64748b;font-weight:500;font-size:13px;cursor:pointer;padding:4px 8px;text-decoration:underline;">
            Change Email
          </button>
        </div>
        
        <p style="margin:16px 0 0 0;font-size:12px;color:#94a3b8;">
          Didn't receive the code? Check your spam folder.
        </p>
      </div>
      <style>
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      </style>
    `;

    document.body.appendChild(modal);

    // Focus OTP input
    setTimeout(() => {
      const otpInput = modal.querySelector('#dpdpa-otp-verify-input');
      if (otpInput) otpInput.focus();
    }, 100);

    // Verify Button Handler
    const verifyBtn = modal.querySelector('#dpdpa-verify-otp-btn');
    const otpInput = modal.querySelector('#dpdpa-otp-verify-input');
    const errorDiv = modal.querySelector('#dpdpa-otp-error');

    const handleVerify = async () => {
      const otp = otpInput.value.replace(/\s/g, '');
      
      if (!otp || otp.length < 4) {
        errorDiv.textContent = 'Please enter a valid verification code';
        errorDiv.style.display = 'block';
        return;
      }

      verifyBtn.textContent = 'Verifying...';
      verifyBtn.disabled = true;
      errorDiv.style.display = 'none';

      try {
        const apiBase = getApiUrl();
        const response = await fetch(`${apiBase}/api/privacy-centre/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email,
            otpCode: otp,
            visitorId: consentID || getConsentID(),
            widgetId: widgetId,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          // Success - Store verified email
          verifiedEmail = email;
          userEmail = email;

          // Handle Stable Consent ID
          if (data.stableConsentId && data.stableConsentId !== consentID) {
            console.log('[Consently DPDPA] Switching to stable Consent ID:', data.stableConsentId);
            consentID = data.stableConsentId;
            storeConsentID(consentID);
          }

          // Remove OTP modal and show consent widget
          modal.remove();
          showConsentWidget(email, 'verified');
        } else {
          errorDiv.textContent = data.error || 'Invalid verification code. Please try again.';
          errorDiv.style.display = 'block';
          verifyBtn.textContent = 'Verify & Continue';
          verifyBtn.disabled = false;
          otpInput.focus();
        }
      } catch (error) {
        console.error('[Consently DPDPA] OTP verification error:', error);
        errorDiv.textContent = 'Verification failed. Please try again.';
        errorDiv.style.display = 'block';
        verifyBtn.textContent = 'Verify & Continue';
        verifyBtn.disabled = false;
      }
    };

    verifyBtn.addEventListener('click', handleVerify);
    otpInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleVerify();
    });

    // Resend Button Handler
    const resendBtn = modal.querySelector('#dpdpa-resend-otp-btn');
    resendBtn.addEventListener('click', async () => {
      resendBtn.textContent = 'Sending...';
      resendBtn.disabled = true;

      try {
        const apiBase = getApiUrl();
        const response = await fetch(`${apiBase}/api/privacy-centre/send-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email,
            visitorId: consentID || getConsentID(),
            widgetId: widgetId,
          }),
        });

        if (response.ok) {
          errorDiv.textContent = 'A new code has been sent!';
          errorDiv.style.color = '#059669';
          errorDiv.style.display = 'block';
          setTimeout(() => {
            errorDiv.style.display = 'none';
            errorDiv.style.color = '#dc2626';
          }, 3000);
        } else {
          errorDiv.textContent = 'Failed to resend code. Please try again.';
          errorDiv.style.display = 'block';
        }
      } catch (error) {
        console.error('[Consently DPDPA] Resend OTP error:', error);
        errorDiv.textContent = 'Failed to resend code. Please try again.';
        errorDiv.style.display = 'block';
      } finally {
        resendBtn.textContent = '↻ Resend Code';
        resendBtn.disabled = false;
      }
    });

    // Change Email Handler
    const changeEmailBtn = modal.querySelector('#dpdpa-change-email-btn');
    changeEmailBtn.addEventListener('click', () => {
      modal.remove();
      showVerificationScreen();
    });
  }

  // Show Consent ID Verification Screen
  async function showVerificationScreen() {
    const existingModal = document.getElementById('dpdpa-verification-modal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.id = 'dpdpa-verification-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 16px;
    `;

    let mode = 'consent-id'; // 'consent-id' or 'email'

    function renderModal() {
      modal.innerHTML = `
        <div style="background:white;border-radius:16px;padding:24px;max-width:440px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.15);animation:slideUp 0.3s ease-out;max-height:90vh;overflow-y:auto;">
          <!-- Icon and Title - Compact -->
          <div style="text-align:center;margin-bottom:20px;">
            <div style="width:56px;height:56px;background:linear-gradient(135deg, #4F76F6 0%, #3B5BDB 100%);border-radius:14px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;box-shadow:0 4px 12px rgba(79,118,246,0.2);">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="white"/>
              </svg>
            </div>
            <h2 style="margin:0 0 6px 0;font-size:24px;font-weight:700;color:#1a1a1a;letter-spacing:-0.3px;">Welcome Back!</h2>
            <p style="color:#64748b;font-size:14px;margin:0;line-height:1.4;">Verify your identity to manage consent preferences securely in compliance with DPDPA 2023.</p>
          </div>
          
          <!-- Input Section -->
          <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:16px;border:1px solid #e2e8f0;">
              <label style="display:flex;align-items:center;gap:6px;font-weight:600;margin-bottom:10px;color:#1e293b;font-size:13px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="#4F76F6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Email Address
              </label>
              <div style="position:relative;margin-bottom:12px;">
                <input 
                  type="email" 
                  id="email-input"
                  placeholder="your@email.com"
                  style="width:100%;padding:12px 12px 12px 38px;border:2px solid #cbd5e1;border-radius:10px;font-size:15px;box-sizing:border-box;transition:all 0.2s;background:white;"
                  onfocus="this.style.borderColor='#4F76F6';this.style.boxShadow='0 0 0 3px rgba(79,118,246,0.1)'"
                  onblur="this.style.borderColor='#cbd5e1';this.style.boxShadow='none'"
                />
                <svg style="position:absolute;left:12px;top:50%;transform:translateY(-50%);pointer-events:none;" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <button 
                id="send-otp-btn"
                style="width:100%;padding:12px;background:linear-gradient(135deg, #4F76F6 0%, #3B5BDB 100%);border:none;color:white;border-radius:10px;font-weight:600;font-size:14px;cursor:pointer;transition:all 0.2s;box-shadow:0 2px 8px rgba(79,118,246,0.25);"
                onmouseover="this.style.transform='translateY(-1px)';this.style.boxShadow='0 4px 12px rgba(79,118,246,0.35)'"
                onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 2px 8px rgba(79,118,246,0.25)'"
              >
                <span style="display:flex;align-items:center;justify-content:center;gap:6px;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  Send Verification Code
                </span>
              </button>
            <div id="verify-error" style="color:#dc2626;margin-top:10px;font-size:13px;display:none;padding:10px;background:#fee;border-radius:8px;border-left:3px solid #dc2626;"></div>
          </div>

          <!-- Age Gate Checkbox (Integrated) -->
          ${config.enableAgeGate ? `
          <div style="background:#fffbeb;border-radius:12px;padding:16px;margin-bottom:16px;border:1px solid #fef3c7;">
            <label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;">
              <input type="checkbox" id="dpdpa-verif-age-checkbox" style="width:18px;height:18px;margin-top:2px;accent-color:#4F76F6;" />
              <div style="flex:1;">
                <span style="font-size:13px;color:#92400e;font-weight:600;display:block;margin-bottom:4px;">Age Verification Required</span>
                <span style="font-size:12px;color:#b45309;line-height:1.4;display:block;">
                  I confirm that I am above ${config.ageGateThreshold || 18} years of age.
                  <span style="display:block;margin-top:6px;">Year of birth: 
                  <select id="dpdpa-verif-birthyear" style="padding:2px 4px;border:1px solid #d1d5db;border-radius:4px;font-size:11px;">
                    ${generateYearOptions()}
                  </select>
                  </span>
                </span>
              </div>
            </label>
            <div id="age-gate-err-verifer" style="color:#dc2626;margin-top:8px;font-size:12px;display:none;font-weight:600;">Please verify your age to proceed.</div>
          </div>
          ` : ''}
          
          <!-- Divider - Compact -->
          <div style="display:flex;align-items:center;gap:12px;margin:16px 0;">
            <div style="flex:1;height:1px;background:#e2e8f0;"></div>
            <span style="color:#94a3b8;font-size:12px;font-weight:500;">OR</span>
            <div style="flex:1;height:1px;background:#e2e8f0;"></div>
          </div>
          
          <!-- Start Fresh Button - Compact -->
          <button 
            id="start-fresh-btn"
            style="width:100%;padding:12px;background:white;border:2px solid #e2e8f0;color:#1e293b;border-radius:10px;font-weight:600;font-size:14px;cursor:pointer;transition:all 0.2s;"
            onmouseover="this.style.borderColor='#4F76F6';this.style.background='#f8fafc'"
            onmouseout="this.style.borderColor='#e2e8f0';this.style.background='white'"
          >
            <span style="display:flex;align-items:center;justify-content:center;gap:6px;">
              <span style="font-size:16px;">✨</span>
              <span>Start Fresh</span>
            </span>
          </button>
          
          <!-- Help Text - Compact -->
          <div style="text-align:center;margin-top:16px;padding:12px;background:#f8fafc;border-radius:10px;">
            <p style="font-size:12px;color:#64748b;margin:0;line-height:1.5;">
              <strong style="color:#1e293b;">New?</strong> Click "Start Fresh" to create a new Consent ID.
            </p>
          </div>
        </div>
        <style>
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(10px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          @media (max-width: 480px) {
            #dpdpa-verification-modal > div {
              padding: 20px !important;
              border-radius: 16px !important;
              width: 92% !important;
              max-width: none !important;
              margin: 0 auto;
            }
            #dpdpa-verification-modal > div h2 {
              font-size: 20px !important;
            }
            #dpdpa-verification-modal > div p {
              font-size: 13px !important;
            }
          }
        </style>
      `;

      attachListeners();
    }

    function attachListeners() {
      const startFreshBtn = modal.querySelector('#start-fresh-btn');
      const errorDiv = modal.querySelector('#verify-error');

      // Start Fresh
      startFreshBtn.addEventListener('click', () => {
        modal.remove();
        consentID = getConsentID();
        if (config && config.activities && Array.isArray(config.activities)) {
          activities = JSON.parse(JSON.stringify(config.activities));
        }
        const matchedRule = evaluateDisplayRules();
        if (matchedRule && matchedRule.trigger_type === 'onPageLoad') {
          applyRule(matchedRule);
          trackRuleMatch(matchedRule);
          setTimeout(() => {
            showConsentWidget();
          }, matchedRule.trigger_delay || 0);
        } else {
          showConsentWidget();
        }
      });

      // Email Mode Logic
      const sendBtn = modal.querySelector('#send-otp-btn');
      const emailInput = modal.querySelector('#email-input');

      if (sendBtn && emailInput) {
        sendBtn.addEventListener('click', async () => {
          const email = emailInput.value.trim();
          if (!email) {
            errorDiv.textContent = 'Please enter your email address';
            errorDiv.style.display = 'block';
            return;
          }
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            errorDiv.textContent = 'Please enter a valid email address';
            errorDiv.style.display = 'block';
            return;
          }

          const originalSendBtnHTML = sendBtn.innerHTML;
          sendBtn.innerHTML = '<span style="display:flex;align-items:center;justify-content:center;gap:6px;"><div style="width:16px;height:16px;border:2px solid white;border-top-color:transparent;border-radius:50%;animation:spin 0.6s linear infinite;"></div>Sending...</span>';
          sendBtn.disabled = true;
          errorDiv.style.display = 'none';

          try {
            const apiBase = getApiUrl();

            // Age Gate Check before sending OTP if enabled
            if (config.enableAgeGate) {
              const ageCheckbox = modal.querySelector('#dpdpa-verif-age-checkbox');
              const birthYearSelect = modal.querySelector('#dpdpa-verif-birthyear');
              const ageError = modal.querySelector('#age-gate-err-verifer');

              if (ageCheckbox && !ageCheckbox.checked) {
                ageError.style.display = 'block';
                sendBtn.innerHTML = originalSendBtnHTML;
                sendBtn.disabled = false;
                return;
              }

              if (birthYearSelect) {
                const age = calculateAgeFromBirthYear(birthYearSelect.value);
                if (age < (config.ageGateThreshold || 18)) {
                  setMinorCookie();
                  modal.remove();
                  showMinorBlockScreen();
                  return;
                }
              }
              if (ageError) ageError.style.display = 'none';
            }

            const response = await fetch(`${apiBase}/api/privacy-centre/send-otp`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: email,
                visitorId: consentID || getConsentID(),
                widgetId: widgetId,
              }),

            });

            const data = await response.json();

            if (!response.ok) {
              errorDiv.textContent = data.error || 'Failed to send code';
              errorDiv.style.display = 'block';
              sendBtn.innerHTML = '<span style="display:flex;align-items:center;justify-content:center;gap:6px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Send Verification Code</span>';
              sendBtn.disabled = false;
              return;
            }

            // Success - Show OTP verification modal (Step 2)
            // IMPORTANT: Do NOT show consent widget yet - user must verify OTP first
            modal.remove();
            showOtpVerificationModal(email);

          } catch (error) {
            console.error('[Email Verification] Send OTP error:', error);
            errorDiv.textContent = 'Failed to send code. Please try again.';
            errorDiv.style.display = 'block';
            sendBtn.innerHTML = '<span style="display:flex;align-items:center;justify-content:center;gap:6px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Send Verification Code</span>';
            sendBtn.disabled = false;
          }
        });
      }
    }

    document.body.appendChild(modal);
    renderModal();
  }

  // Show Consent Success Modal with Email Display (Compact Version - No Backdrop)
  function showConsentSuccessModal(consentID) {
    const modal = document.createElement('div');
    modal.id = 'dpdpa-success-modal';
    modal.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 999999;
      padding: 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      pointer-events: none;
    `;

    // Determine what to display - email if verified, otherwise consent ID
    const displayEmail = verifiedEmail;
    const displayValue = displayEmail || consentID;
    const displayLabel = displayEmail ? 'Your Verified Email' : 'Your Consent ID';
    const displayIcon = displayEmail
      ? `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
           <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
         </svg>`
      : `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
           <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
         </svg>`;

    modal.innerHTML = `
      <div style="background:white;border-radius:16px;padding:28px;max-width:480px;width:100%;box-shadow:0 20px 50px rgba(0,0,0,0.3);text-align:center;animation:slideUp 0.3s ease-out;pointer-events: auto;">
        <!-- Success Icon -->
        <div style="width:56px;height:56px;background:linear-gradient(135deg, #10b981 0%, #059669 100%);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;box-shadow:0 8px 24px rgba(16,185,129,0.3);">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 13l4 4L19 7" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        
        <h2 style="margin:0 0 8px 0;font-size:24px;font-weight:700;color:#059669;">Consent Saved!</h2>
        <p style="color:#64748b;font-size:14px;margin:0 0 24px 0;line-height:1.5;">Your privacy preferences have been securely recorded.</p>
        
        <!-- Email/ID Display Card -->
        <div style="background:linear-gradient(135deg, #4F76F6 0%, #3B5BDB 100%);border-radius:12px;padding:20px;margin-bottom:16px;box-shadow:0 8px 20px rgba(79,118,246,0.25);">
          <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:10px;">
            <div style="width:24px;height:24px;display:flex;align-items:center;justify-content:center;">
              ${displayIcon.replace('width="32" height="32"', 'width="18" height="18"')}
            </div>
            <label style="color:rgba(255,255,255,0.9);font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1.2px;">${displayLabel}</label>
          </div>
          
          <div style="background:white;border-radius:10px;padding:14px;margin-bottom:14px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
            <div style="font-size:${displayEmail ? '16px' : '18px'};font-weight:700;color:#1e293b;font-family:${displayEmail ? '-apple-system, BlinkMacSystemFont, sans-serif' : 'ui-monospace, monospace'};letter-spacing:${displayEmail ? '0' : '2px'};word-break:break-all;">
              ${escapeHtml(displayValue)}
            </div>
          </div>
        </div>
        
        <!-- Download Privacy Notice Button -->
        <button 
          onclick="window.downloadPrivacyNotice()"
          style="width:100%;padding:12px 16px;background:rgba(79,118,246,0.1);border:2px solid rgba(79,118,246,0.3);color:#4F76F6;border-radius:8px;font-weight:600;cursor:pointer;font-size:13px;transition:all 0.2s;display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:16px;"
          onmouseover="this.style.background='rgba(79,118,246,0.2)';this.style.borderColor='rgba(79,118,246,0.5)'"
          onmouseout="this.style.background='rgba(79,118,246,0.1)';this.style.borderColor='rgba(79,118,246,0.3)'"
          title="Download the full Privacy Notice"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" stroke="#4F76F6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Download Privacy Notice
        </button>
        
        ${displayEmail ? `
        <!-- Email Confirmation Notice -->
        <div style="background:#ecfdf5;border-left:3px solid #10b981;padding:12px;border-radius:8px;margin-bottom:16px;text-align:left;">
          <p style="color:#065f46;font-size:12px;margin:0;line-height:1.5;">
            <strong style="color:#047857;">Email linked!</strong> You can manage your preferences anytime using this email.
          </p>
        </div>
        ` : `
        <!-- Consent ID Notice -->
        <div style="background:#fef3c7;border-left:3px solid #f59e0b;padding:12px;border-radius:8px;margin-bottom:16px;text-align:left;">
          <p style="color:#78350f;font-size:12px;margin:0;line-height:1.5;">
            <strong style="color:#92400e;">Keep this ID safe!</strong> Use it to manage your preferences across devices.
          </p>
        </div>
        `}
        
        <!-- Action Button -->
        <button 
          onclick="document.getElementById('dpdpa-success-modal').remove()"
          style="width:100%;padding:12px;background:linear-gradient(135deg, #10b981 0%, #059669 100%);border:none;color:white;border-radius:10px;font-weight:600;font-size:15px;cursor:pointer;box-shadow:0 4px 12px rgba(16,185,129,0.3);transition:all 0.2s;"
          onmouseover="this.style.transform='translateY(-1px)';this.style.boxShadow='0 6px 16px rgba(16,185,129,0.4)'"
          onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 4px 12px rgba(16,185,129,0.3)'"
        >
          Got it, thanks! ✓
        </button>
      </div>
      <style>
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      </style>
    `;

    document.body.appendChild(modal);
  }

  // Copy Consent ID to clipboard
  window.copyConsentID = function (id) {
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
  };

  // Generate privacy notice HTML from activities (fallback when config.privacyNoticeHTML is not available)
  function generatePrivacyNoticeFromActivities(activitiesList, domainName) {
    const companyName = domainName || window.location.hostname;

    const activitySections = activitiesList.map((activity, index) => {
      let purposesList = '';
      let allDataCategories = [];
      let retentionText = 'N/A';

      if (activity.purposes && activity.purposes.length > 0) {
        purposesList = activity.purposes.map(p => {
          const dataCategories = p.dataCategories?.map(cat => cat.categoryName) || [];
          allDataCategories.push(...dataCategories);

          const retentionPeriods = p.dataCategories?.map(cat =>
            `${cat.categoryName}: ${cat.retentionPeriod}`
          ) || [];

          if (retentionPeriods.length > 0) {
            retentionText = retentionPeriods.join(', ');
          }

          return `<li>${escapeHtml(p.purposeName)} (${escapeHtml(p.legalBasis?.replace('-', ' ') || 'consent')})</li>`;
        }).join('');
      } else {
        purposesList = '<li>No purposes defined</li>';
      }

      const dataCategoriesText = allDataCategories.length > 0
        ? allDataCategories.map(c => escapeHtml(c)).join(', ')
        : 'N/A';

      return `
    <div style="margin-bottom: 24px; padding: 16px; background: #f9fafb; border-left: 4px solid #3b82f6; border-radius: 8px;">
      <h3 style="margin: 0 0 12px 0; color: #1f2937; font-size: 18px; font-weight: 600;">
        ${index + 1}. ${escapeHtml(activity.activity_name || activity.activityName || 'Activity')}
      </h3>
      
      <div style="margin-bottom: 12px;">
        <strong style="color: #374151;">Purposes:</strong>
        <ul style="margin: 4px 0 0 0; color: #6b7280; padding-left: 20px;">
          ${purposesList}
        </ul>
      </div>

      <div style="margin-bottom: 12px;">
        <strong style="color: #374151;">Data Categories:</strong>
        <p style="margin: 4px 0 0 0; color: #6b7280;">${dataCategoriesText}</p>
      </div>

      <div>
        <strong style="color: #374151;">Retention Period:</strong>
        <p style="margin: 4px 0 0 0; color: #6b7280;">${escapeHtml(retentionText)}</p>
      </div>
    </div>
  `;
    }).join('');

    return `
<h1 style="color: #111827; font-size: 32px; margin-bottom: 16px;">Privacy Notice</h1>

<div style="background: #dbeafe; padding: 16px; border-radius: 8px; margin-bottom: 32px;">
  <p style="margin: 0; color: #1e40af; font-weight: 500;">
    This notice explains how ${escapeHtml(companyName)} processes your personal data in compliance with the Digital Personal Data Protection Act, 2023 (DPDPA).
  </p>
</div>

<h2 style="color: #1f2937; font-size: 24px; margin-top: 32px; margin-bottom: 16px;">Data Processing Activities</h2>

<p style="color: #6b7280; margin-bottom: 24px;">
  We process your personal data for the following purposes. You have the right to provide or withdraw consent for each activity.
</p>

${activitySections}

<div style="margin-top: 48px; padding-top: 24px; border-top: 2px solid #e5e7eb;">
  <h2 style="color: #1f2937; font-size: 20px; margin-bottom: 16px;">Your Rights Under DPDPA 2023</h2>
  
  <ul style="color: #6b7280; line-height: 1.8;">
    <li><strong>Right to Access:</strong> You can request information about what personal data we hold about you.</li>
    <li><strong>Right to Correction:</strong> You can request correction of inaccurate or incomplete data.</li>
    <li><strong>Right to Erasure:</strong> You can request deletion of your personal data in certain circumstances.</li>
    <li><strong>Right to Withdraw Consent:</strong> You can withdraw your consent at any time.</li>
    <li><strong>Right to Grievance Redressal:</strong> You can raise concerns or complaints about data processing.</li>
  </ul>
</div>

<div style="margin-top: 32px; padding: 16px; background: #f3f4f6; border-radius: 8px;">
  <p style="margin: 0; color: #6b7280; font-size: 14px;">
    <strong>Compliance:</strong> This notice is compliant with the Digital Personal Data Protection Act, 2023 (DPDPA)
  </p>
</div>
`.trim();
  }

  // Download Privacy Notice - triggers a PDF download from the API
  window.downloadPrivacyNotice = async function () {
    console.log('[Consently DPDPA] Download Privacy Notice clicked');

    if (!activities || activities.length === 0) {
      showToast('⚠️ Privacy Notice not available. No activities configured.', 'error');
      return;
    }

    try {
      showToast('⏳ Generating PDF...', 'info');

      const apiBase = getApiUrl();
      const domain = config.domain || window.location.hostname;

      const response = await fetch(`${apiBase}/api/dpdpa/privacy-notice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activities: activities,
          domain: domain,
          companyName: config.name || domain
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];

      a.href = url;
      a.download = `privacy-notice-${domain.replace(/[^a-zA-Z0-9]/g, '-')}-${dateStr}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showToast('📄 Privacy Notice downloaded!', 'success');
    } catch (error) {
      console.error('[Consently DPDPA] PDF download error:', error);
      showToast('❌ Failed to download Privacy Notice.', 'error');
    }
  };

  // Download consent receipt - generates a beautiful HTML receipt matching the preview
  window.downloadConsentReceipt = function (consentDataOrID) {
    const theme = config.theme || {};
    const primaryColor = theme.primaryColor || '#3b82f6';
    const date = new Date();
    const dateFormatted = date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Handle both string ID and full consent data object
    let consentID, acceptedActivities = [], rejectedActivities = [], email = null;

    if (typeof consentDataOrID === 'string') {
      consentID = consentDataOrID;
    } else if (consentDataOrID && typeof consentDataOrID === 'object') {
      consentID = consentDataOrID.consentId || consentDataOrID.consent_id || getConsentID();
      acceptedActivities = consentDataOrID.acceptedActivities || consentDataOrID.consented_activities || [];
      rejectedActivities = consentDataOrID.rejectedActivities || consentDataOrID.rejected_activities || [];
      email = consentDataOrID.email || consentDataOrID.visitor_email || null;
    } else {
      consentID = getConsentID();
    }

    // Get activity names from cached config
    const activityMap = {};
    if (activities && activities.length > 0) {
      activities.forEach(a => {
        activityMap[a.id] = a.activity_name || a.name || 'Unknown Activity';
      });
    } else if (allActivities && allActivities.length > 0) {
      allActivities.forEach(a => {
        activityMap[a.id] = a.activity_name || a.name || 'Unknown Activity';
      });
    }

    // Build accepted activities HTML
    const acceptedHTML = acceptedActivities.length > 0
      ? acceptedActivities.map(id => {
        const name = activityMap[id] || id;
        return `<li style="padding: 8px 12px; background: #dcfce7; border-radius: 6px; margin-bottom: 6px; color: #166534; font-weight: 500;">✓ ${escapeHtml(name)}</li>`;
      }).join('')
      : '<li style="padding: 8px 12px; color: #6b7280; font-style: italic;">No activities accepted</li>';

    // Build rejected activities HTML
    const rejectedHTML = rejectedActivities.length > 0
      ? rejectedActivities.map(id => {
        const name = activityMap[id] || id;
        return `<li style="padding: 8px 12px; background: #fee2e2; border-radius: 6px; margin-bottom: 6px; color: #991b1b; font-weight: 500;">✗ ${escapeHtml(name)}</li>`;
      }).join('')
      : '';

    const domain = config.domain || window.location.hostname;
    const widgetName = config.name || 'DPDPA Consent Widget';

    const receiptHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Consent Receipt - ${consentID}</title>
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
    }
    @media (max-width: 600px) {
      body { padding: 16px !important; }
      .container { padding: 20px !important; }
      h1 { font-size: 24px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f0fdf4 100%); min-height: 100vh;">
  <div class="container" style="max-width: 640px; margin: 0 auto; background: white; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.1); overflow: hidden;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%); padding: 32px; text-align: center;">
      <div style="width: 64px; height: 64px; background: rgba(255,255,255,0.2); border-radius: 16px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          <path d="M9 12l2 2 4-4"></path>
        </svg>
      </div>
      <h1 style="margin: 0 0 8px 0; color: white; font-size: 28px; font-weight: 700;">Consent Receipt</h1>
      <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 14px;">Digital Personal Data Protection Act, 2023</p>
    </div>

    <!-- Consent ID Card -->
    <div style="padding: 24px; background: linear-gradient(to right, #f8fafc, #f1f5f9);">
      <div style="background: white; border: 2px solid ${primaryColor}30; border-radius: 12px; padding: 20px; text-align: center;">
        <p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Your Consent ID</p>
        <p style="margin: 0; font-size: 22px; font-weight: 700; color: ${primaryColor}; font-family: ui-monospace, 'SF Mono', monospace; letter-spacing: 2px; word-break: break-all;">${escapeHtml(consentID)}</p>
      </div>
    </div>

    <!-- Details -->
    <div style="padding: 24px;">
      <!-- Meta Info -->
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px;">
        <div style="background: #f8fafc; padding: 16px; border-radius: 10px;">
          <p style="margin: 0 0 4px 0; font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Date & Time</p>
          <p style="margin: 0; font-size: 14px; color: #1e293b; font-weight: 600;">${dateFormatted}</p>
        </div>
        <div style="background: #f8fafc; padding: 16px; border-radius: 10px;">
          <p style="margin: 0 0 4px 0; font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Website</p>
          <p style="margin: 0; font-size: 14px; color: #1e293b; font-weight: 600;">${escapeHtml(domain)}</p>
        </div>
        ${email ? `
        <div style="background: #f8fafc; padding: 16px; border-radius: 10px; grid-column: span 2;">
          <p style="margin: 0 0 4px 0; font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Verified Email</p>
          <p style="margin: 0; font-size: 14px; color: #1e293b; font-weight: 600;">${escapeHtml(email)}</p>
        </div>
        ` : ''}
      </div>

      <!-- Accepted Activities -->
      <div style="margin-bottom: 20px;">
        <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #166534; font-weight: 700; display: flex; align-items: center; gap: 8px;">
          <span style="width: 24px; height: 24px; background: #dcfce7; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center;">✓</span>
          Accepted Activities (${acceptedActivities.length})
        </h3>
        <ul style="margin: 0; padding: 0; list-style: none;">
          ${acceptedHTML}
        </ul>
      </div>

      ${rejectedActivities.length > 0 ? `
      <!-- Rejected Activities -->
      <div style="margin-bottom: 20px;">
        <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #991b1b; font-weight: 700; display: flex; align-items: center; gap: 8px;">
          <span style="width: 24px; height: 24px; background: #fee2e2; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center;">✗</span>
          Rejected Activities (${rejectedActivities.length})
        </h3>
        <ul style="margin: 0; padding: 0; list-style: none;">
          ${rejectedHTML}
        </ul>
      </div>
      ` : ''}

      <!-- Your Rights -->
      <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-radius: 12px; padding: 20px; margin-top: 24px;">
        <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #1e40af; font-weight: 700;">Your Rights Under DPDPA 2023</h3>
        <ul style="margin: 0; padding-left: 20px; color: #1e40af; font-size: 13px; line-height: 1.8;">
          <li><strong>Access:</strong> Request information about your data</li>
          <li><strong>Correction:</strong> Update inaccurate information</li>
          <li><strong>Erasure:</strong> Request deletion of your data</li>
          <li><strong>Withdraw:</strong> Change consent preferences anytime</li>
        </ul>
      </div>

      <!-- Notice -->
      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 0 8px 8px 0; margin-top: 20px;">
        <p style="margin: 0; font-size: 13px; color: #92400e; line-height: 1.5;">
          <strong>Keep this receipt safe!</strong> Use your Consent ID to manage preferences across devices or raise a grievance.
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #f8fafc; padding: 20px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b;">
        Powered by <strong style="color: ${primaryColor};">Consently</strong>
      </p>
      <p style="margin: 0; font-size: 11px; color: #94a3b8;">
        Compliant with Digital Personal Data Protection Act, 2023
      </p>
    </div>
  </div>
</body>
</html>`.trim();

    const blob = new Blob([receiptHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `consent-receipt-${consentID}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('📄 Receipt downloaded!', 'success');
  };

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
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Check if user has consented to activities required for current page
  function checkConsentForCurrentPage(existingConsent) {
    if (!existingConsent || !existingConsent.timestamp) {
      return false;
    }

    // Validate expiration first
    if (existingConsent.expiresAt) {
      const expiresAt = new Date(existingConsent.expiresAt);
      if (expiresAt < new Date()) {
        console.log('[Consently DPDPA] Consent expired');
        return false;
      }
    }

    // Get activity IDs from existing consent (both accepted and rejected)
    const consentedActivityIds = [
      ...(existingConsent.acceptedActivities || []),
      ...(existingConsent.rejectedActivities || [])
    ];

    // If user has consented to ANY activities, consider it valid
    // This prevents the banner from showing again on different pages on the same device
    // Users have given their consent once, we respect that across all pages
    if (consentedActivityIds.length > 0) {
      console.log('[Consently DPDPA] User has existing valid consent for', consentedActivityIds.length, 'activities');
      return true;
    }

    console.log('[Consently DPDPA] No consent activities found');
    return false;
  }

  // Check API for existing consent
  async function checkApiConsent(consentID) {
    try {
      const scriptSrc = currentScript.src;
      let apiBase;

      if (scriptSrc && scriptSrc.includes('http')) {
        const url = new URL(scriptSrc);
        apiBase = url.origin;
      } else {
        apiBase = window.location.origin;
      }

      // Build API URL with Consent ID
      const apiUrl = `${apiBase}/api/dpdpa/check-consent?widgetId=${encodeURIComponent(widgetId)}&visitorId=${encodeURIComponent(consentID)}&currentUrl=${encodeURIComponent(window.location.href)}`;

      console.log('[Consently DPDPA] Checking API for existing consent:', apiUrl);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn('[Consently DPDPA] API consent check failed:', response.status, response.statusText);
        return null;
      }

      const data = await response.json();

      if (data.hasConsent && data.consent) {
        // Check if this consent was found via cross-device sync
        if (data.consent.foundByPrincipalId) {
          console.log('[Consently DPDPA] ✅ Valid consent found via cross-device sync (principal_id)!');
          console.log('[Consently DPDPA] This means user already consented on another device with the same email.');
        } else {
          console.log('[Consently DPDPA] Valid consent found via API (same device):', data.consent);
        }

        // Convert API consent format to localStorage format
        const consentData = {
          status: data.consent.status,
          acceptedActivities: data.consent.acceptedActivities || [],
          rejectedActivities: data.consent.rejectedActivities || [],
          timestamp: data.consent.timestamp,
          expiresAt: data.consent.expiresAt,
          activityConsents: {}, // Will be populated from accepted/rejected activities if needed
          foundByPrincipalId: data.consent.foundByPrincipalId || false,
          verifiedEmail: data.consent.visitorEmail || null,
          stableConsentId: data.stableConsentId || null
        };

        // Adopt stable consent ID if returned (for verified users)
        if (data.stableConsentId && data.stableConsentId !== consentID) {
          console.log('[Consently DPDPA] 🔄 Adopting stable Consent ID from API:', {
            old: consentID,
            new: data.stableConsentId
          });
          consentID = data.stableConsentId;
          storeConsentID(consentID);
        }

        return consentData;
      }

      console.log('[Consently DPDPA] No valid consent found via API');
      return null;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn('[Consently DPDPA] API consent check timed out');
      } else {
        console.warn('[Consently DPDPA] API consent check error:', error);
      }
      return null; // Fail silently and fall back to localStorage
    }
  }

  // Initialize widget
  async function init() {
    const result = await fetchWidgetConfig();
    if (!result || !result.success) {
      if (result && result.error === 'WIDGET_NOT_FOUND') {
        // Widget not found - error already shown, just exit
        console.error('[Consently DPDPA] Widget initialization failed: Widget not found');
      } else if (result && result.error === 'RATE_LIMIT') {
        // Rate limited - retry after delay
        console.warn('[Consently DPDPA] Rate limited, retrying in 5 seconds...');
        setTimeout(init, 5000);
        return;
      } else {
        // Other errors
        console.error('[Consently DPDPA] Failed to initialize widget:', result?.error || 'Unknown error');
        if (result && result.error === 'NETWORK_ERROR') {
          // Network error - retry once after delay
          console.warn('[Consently DPDPA] Network error, retrying in 3 seconds...');
          setTimeout(init, 3000);
          return;
        }
      }
      return;
    }

    // Check DNT
    if (config.respectDNT && navigator.doNotTrack === '1') {
      console.log('[Consently DPDPA] DNT enabled, respecting user preference');
      return;
    }

    // Warn if both age verification methods are enabled
    if (config.requireAgeVerification && config.enableAgeGate) {
      console.warn('[Consently DPDPA] Both DigiLocker age verification and legacy age gate are enabled. Only DigiLocker will be used. Consider disabling the legacy age gate in your widget settings.');
    }

    // Check for age verification callback (returning from DigiLocker)
    let ageVerificationJustCompleted = false;
    if (config.requireAgeVerification) {
      // First check existing verification
      if (checkExistingAgeVerification()) {
        console.log('[Consently DPDPA] Age verification already completed');
      } else {
        // Check for callback from DigiLocker
        const callbackResult = await handleAgeVerificationCallback();
        if (callbackResult) {
          console.log('[Consently DPDPA] Age verification callback processed:', callbackResult.status);
          // Restore widget state saved before DigiLocker redirect
          restoreWidgetState();
          
          // Mark that age verification just completed - widget should be shown
          // Check if user is allowed to proceed (verified adult or limited access)
          const allowedOutcomes = ['verified_adult', 'limited_access'];
          if (callbackResult.verified && 
              (!callbackResult.verificationOutcome || allowedOutcomes.includes(callbackResult.verificationOutcome))) {
            ageVerificationJustCompleted = true;
            console.log('[Consently DPDPA] Age verification passed - will show widget for consent');
          }
        }
      }
    }

    // Check if user has stored Consent ID
    const storedID = ConsentStorage.get('consently_consent_id');

    if (storedID) {
      // User has Consent ID, check if consent exists
      consentID = storedID;

      // Check for existing consent - try API first, then fall back to localStorage
      let existingConsent = null;

      // First, try to get consent from API (more reliable)
      console.log('[Consently DPDPA] Checking API for existing consent...');
      const apiConsent = await checkApiConsent(consentID);

      if (apiConsent) {
        // API returned valid consent - use it and sync to localStorage
        existingConsent = apiConsent;
        // Store in localStorage for faster future checks
        ConsentStorage.set(
          `consently_dpdpa_consent_${widgetId}`,
          {
            status: apiConsent.status,
            acceptedActivities: apiConsent.acceptedActivities,
            rejectedActivities: apiConsent.rejectedActivities,
            activityConsents: apiConsent.activityConsents,
            timestamp: apiConsent.timestamp,
            expiresAt: apiConsent.expiresAt,
            verifiedEmail: apiConsent.verifiedEmail
          },
          config.consentDuration || 365
        );
        console.log('[Consently DPDPA] Consent synced from API to localStorage');
      } else {
        // API didn't return consent - check localStorage as fallback
        console.log('[Consently DPDPA] No API consent found, checking localStorage...');
        const localStorageConsent = ConsentStorage.get(`consently_dpdpa_consent_${widgetId}`);

        if (localStorageConsent && localStorageConsent.timestamp) {
          // Validate expiration before using localStorage consent
          if (localStorageConsent.expiresAt) {
            const expiresAt = new Date(localStorageConsent.expiresAt);
            if (expiresAt < new Date()) {
              console.log('[Consently DPDPA] localStorage consent expired, clearing...');
              ConsentStorage.delete(`consently_dpdpa_consent_${widgetId}`);
              existingConsent = null;
            } else {
              existingConsent = localStorageConsent;
              console.log('[Consently DPDPA] Found valid consent in localStorage');
            }
          } else {
            // No expiration date, check by duration
            const consentAge = (Date.now() - new Date(localStorageConsent.timestamp).getTime()) / (1000 * 60 * 60 * 24);
            const consentDuration = config.consentDuration || 365;
            if (consentAge < consentDuration) {
              existingConsent = localStorageConsent;
              console.log('[Consently DPDPA] Found valid consent in localStorage (age: ' + Math.round(consentAge) + ' days)');
            } else {
              console.log('[Consently DPDPA] localStorage consent expired by duration, clearing...');
              ConsentStorage.delete(`consently_dpdpa_consent_${widgetId}`);
              existingConsent = null;
            }
          }
        } else {
          console.log('[Consently DPDPA] No consent found in localStorage');
        }
      }

      // Restore verified email if available
      if (existingConsent && existingConsent.verifiedEmail) {
        verifiedEmail = existingConsent.verifiedEmail;
        console.log('[Consently DPDPA] Restored verified email:', verifiedEmail);
      }

      // Evaluate display rules FIRST to determine which rule matches (if any)
      const matchedRule = evaluateDisplayRules();

      // Handle non-onPageLoad triggers (set up but don't apply rule yet)
      if (matchedRule) {
        if (matchedRule.trigger_type === 'onClick' && matchedRule.element_selector) {
          setupClickTrigger(matchedRule);
          // Track rule match when clicked (tracked in setupClickTrigger via applyRule)
          // For onClick triggers, check consent against all activities (rule applies when clicked)
          if (existingConsent && existingConsent.timestamp) {
            // Check consent against all activities for now
            const allActivityIds = activities.map(a => a.id);
            const consentedActivityIds = [
              ...(existingConsent.acceptedActivities || []),
              ...(existingConsent.rejectedActivities || [])
            ];
            const allConsented = allActivityIds.every(id => consentedActivityIds.includes(id));
            if (allConsented) {
              applyConsent(existingConsent);
            }
          }
          return; // Don't show widget on page load for onClick triggers
        } else if (matchedRule.trigger_type === 'onFormSubmit') {
          setupFormSubmitTrigger(matchedRule);
          // Track rule match when submitted (tracked in setupFormSubmitTrigger via applyRule)
          // For onFormSubmit triggers, check consent against all activities (rule applies when submitted)
          if (existingConsent && existingConsent.timestamp) {
            // Check consent against all activities for now
            const allActivityIds = activities.map(a => a.id);
            const consentedActivityIds = [
              ...(existingConsent.acceptedActivities || []),
              ...(existingConsent.rejectedActivities || [])
            ];
            const allConsented = allActivityIds.every(id => consentedActivityIds.includes(id));
            if (allConsented) {
              applyConsent(existingConsent);
            }
          }
          return; // Don't show widget on page load for onFormSubmit triggers
        } else if (matchedRule.trigger_type === 'onScroll') {
          setupScrollTrigger(matchedRule);
          // For onScroll triggers, check consent against all activities (rule applies when scrolled)
          if (existingConsent && existingConsent.timestamp) {
            // Check consent against all activities for now
            const allActivityIds = activities.map(a => a.id);
            const consentedActivityIds = [
              ...(existingConsent.acceptedActivities || []),
              ...(existingConsent.rejectedActivities || [])
            ];
            const allConsented = allActivityIds.every(id => consentedActivityIds.includes(id));
            if (allConsented) {
              applyConsent(existingConsent);
            }
          }
          return; // Don't show widget on page load for onScroll triggers
        }

        // For onPageLoad triggers, apply rule now (filters activities)
        if (matchedRule.trigger_type === 'onPageLoad') {
          applyRule(matchedRule);
          // Track rule match for analytics
          trackRuleMatch(matchedRule);
        }
      }

      // Check if existing consent covers the activities required for this page
      // (After rule is applied, so we check against filtered activities if rule specifies them)
      if (existingConsent && existingConsent.timestamp) {
        const hasRequiredConsent = checkConsentForCurrentPage(existingConsent);

        if (hasRequiredConsent) {
          console.log('[Consently DPDPA] Valid consent found for current page');
          applyConsent(existingConsent);
          return;
        } else {
          console.log('[Consently DPDPA] Consent exists but does not cover all activities for this page');
        }
      }

      // Show widget if:
      // 1. A rule matched with onPageLoad trigger, OR
      // 2. No rule matched and autoShow is enabled (STRICT mode: only when no rules are configured)
      if (matchedRule && matchedRule.trigger_type === 'onPageLoad') {
        // Rule matched, show widget with rule-specific content
        showNoticeForRule(matchedRule);
      } else if (!matchedRule) {
        const hasRulesConfigured = Array.isArray(config.display_rules) && config.display_rules.length > 0;
        if (hasRulesConfigured) {
          // Check if any rule has formSubmit trigger - if so, set it up globally
          const formSubmitRule = config.display_rules.find(r => r.trigger_type === 'onFormSubmit');
          if (formSubmitRule) {
            console.log('[Consently DPDPA] Setting up global form submit trigger (no page-specific rule matched)');
            setupFormSubmitTrigger(formSubmitRule);
            return;
          }

          // STRICT: Do not show widget when rules exist but none matched
          const currentPath = (typeof window !== 'undefined' && window.location && window.location.pathname) || '/';
          console.warn('[Consently DPDPA] ⚠️ Display rules configured but none matched for:', currentPath);
          console.warn('[Consently DPDPA] ⚠️ Widget will not be shown to avoid mixing purposes. Configure a rule for this page or disable autoShow.');
          return;
        }
        if (config.autoShow) {
          // No rules configured, use default behavior - show ALL activities
          setTimeout(() => {
            showConsentWidget();
          }, config.showAfterDelay || 1000);
        }
      } else {
        // Matched rule exists but trigger is not onPageLoad (onClick, onFormSubmit, onScroll already handled above)
        // These triggers are already set up and will show the widget when they fire
        return;
      }
    } else {
      // No stored Consent ID - check if we have a non-onPageLoad trigger that should wait
      const matchedRule = evaluateDisplayRules();
      if (matchedRule && (matchedRule.trigger_type === 'onClick' || matchedRule.trigger_type === 'onFormSubmit' || matchedRule.trigger_type === 'onScroll')) {
        // For non-onPageLoad triggers, set them up but don't show verification screen immediately
        if (matchedRule.trigger_type === 'onClick' && matchedRule.element_selector) {
          setupClickTrigger(matchedRule);
        } else if (matchedRule.trigger_type === 'onFormSubmit') {
          setupFormSubmitTrigger(matchedRule);
        } else if (matchedRule.trigger_type === 'onScroll') {
          setupScrollTrigger(matchedRule);
        }
        return; // Wait for trigger to fire
      }

      // No rule matched - check if we have form submit rules configured globally
      const hasRulesConfigured = Array.isArray(config.display_rules) && config.display_rules.length > 0;
      if (hasRulesConfigured) {
        const formSubmitRule = config.display_rules.find(r => r.trigger_type === 'onFormSubmit');
        if (formSubmitRule) {
          console.log('[Consently DPDPA] Setting up global form submit trigger for new user (no page-specific rule matched)');
          setupFormSubmitTrigger(formSubmitRule);
          return;
        }
      }

      // For non-onPageLoad triggers, wait for them to fire - don't show anything immediately
      return;
    }

    // Show widget if age verification just completed and user needs to give consent
    // This is checked at the end of init() after all other conditions
    if (ageVerificationJustCompleted) {
      console.log('[Consently DPDPA] Showing widget after age verification completion');
      // Small delay to ensure UI is ready
      setTimeout(() => {
        showConsentWidget();
      }, 500);
      return;
    }
  }

  // Apply consent (trigger custom events, etc.)
  function applyConsent(consent) {
    // Dispatch custom event for application to listen to
    const event = new CustomEvent('consentlyDPDPAConsent', {
      detail: {
        status: consent.status,
        acceptedActivities: consent.acceptedActivities || [],
        rejectedActivities: consent.rejectedActivities || [],
        activityConsents: consent.activityConsents || {},
        timestamp: consent.timestamp
      }
    });
    window.dispatchEvent(event);

    // Also set as window property for direct access
    window.consentlyDPDPAConsent = consent;
  }

  // Prefetch translations for common languages to make switching instant
  async function prefetchTranslations() {
    const supportedLanguages = config.supportedLanguages || ['en'];
    // Prefetch top 5 languages (excluding English which is already cached)
    const languagesToPrefetch = supportedLanguages.filter(lang => lang !== 'en').slice(0, 5);

    // Prefetch in background without blocking - includes base UI + activity translations
    languagesToPrefetch.forEach(async (lang) => {
      try {
        // Prefetch base translations
        await getTranslation(lang);

        // Batch prefetch all activity content in ONE API call (optimized)
        const textsToTranslate = [
          ...activities.map(activity => activity.activity_name),
          ...activities.flatMap(activity => {
            // Handle new structure
            if (activity.purposes && Array.isArray(activity.purposes) && activity.purposes.length > 0) {
              return activity.purposes.flatMap(p => [
                p.purposeName || '',
                ...(p.dataCategories || []).map(cat => cat.categoryName || '')
              ]).filter(Boolean);
            }
            // Fallback to legacy
            return activity.data_attributes || [];
          })
        ];

        await batchTranslate(textsToTranslate, lang);

        console.log(`[Consently DPDPA] Prefetched translations for ${lang}`);
      } catch (err) {
        console.log(`[Consently DPDPA] Could not prefetch ${lang} translations:`, err);
      }
    });
  }

  // Create and show consent widget
  async function showConsentWidget(prefilledEmail = null, userStatus = 'new') {
    // Log smart pre-fill status
    console.log('[Consently DPDPA] showConsentWidget called with:', {
      prefilledEmail: prefilledEmail || 'none',
      userStatus: userStatus,
      smartPreFillActive: !!prefilledEmail
    });

    if (document.getElementById('consently-dpdpa-widget')) {
      return; // Already shown
    }

    // Update global state
    currentPrefilledEmail = prefilledEmail || null;
    userEmail = prefilledEmail || null;

    // Validate that there are activities to show
    if (!activities || activities.length === 0) {
      console.error('[Consently DPDPA] Cannot show widget: No activities available');
      console.error('[Consently DPDPA] This may be due to display rules filtering out all activities');
      console.error('[Consently DPDPA] Check your widget configuration and display rules');
      return; // Don't show widget if no activities
    }

    const theme = config.theme || {};
    // Use the trustworthy blue color from consently theme
    primaryColor = theme.primaryColor || '#4c8bf5'; // Update global primaryColor
    const backgroundColor = theme.backgroundColor || '#ffffff';
    const textColor = theme.textColor || '#1f2937';
    const borderRadius = theme.borderRadius || 12;
    const fontFamily = theme.fontFamily || 'system-ui, sans-serif';
    const fontSize = theme.fontSize || 14;

    // Track requirements
    let readComplete = false;
    let downloadComplete = false;
    // Use config language if provided, otherwise default to English
    let selectedLanguage = config.language || 'en';
    let t = await getTranslation(selectedLanguage); // Current translations
    let isTranslating = false; // Track translation state

    // Store original activities for restoring when switching back to English
    const originalActivities = JSON.parse(JSON.stringify(activities));

    // Initially translate config values if language is not English
    let translatedConfig = {
      title: config.title || 'Your Data Privacy Rights',
      message: config.message || 'We process your personal data with your consent. Please review the activities below and choose your preferences.',
      acceptButtonText: config.acceptButtonText || 'Accept All',
      rejectButtonText: config.rejectButtonText || 'Reject All',
      customizeButtonText: config.customizeButtonText || 'Manage Preferences'
    };

    // Translate config values and activities on initial load if language is not English
    if (selectedLanguage !== 'en') {
      const configTexts = [
        translatedConfig.title,
        translatedConfig.message,
        translatedConfig.acceptButtonText,
        translatedConfig.rejectButtonText,
        translatedConfig.customizeButtonText
      ];

      // Collect activity texts from new or legacy structure
      const activityTexts = [
        ...activities.map(a => a.activity_name),
        ...activities.flatMap(a => {
          // Try new structure first
          if (a.purposes && Array.isArray(a.purposes) && a.purposes.length > 0) {
            return a.purposes.flatMap(p => [
              p.purposeName || '',
              ...(p.dataCategories || []).map(cat => cat.categoryName || '')
            ]).filter(Boolean);
          }
          // Fallback to legacy
          return a.data_attributes || [];
        })
      ];

      // Batch translate all in one API call
      const allTexts = [...configTexts, ...activityTexts];
      const translatedAll = await batchTranslate(allTexts, selectedLanguage);

      // Update config translations
      let textIndex = 0;
      translatedConfig = {
        title: translatedAll[textIndex++],
        message: translatedAll[textIndex++],
        acceptButtonText: translatedAll[textIndex++],
        rejectButtonText: translatedAll[textIndex++],
        customizeButtonText: translatedAll[textIndex++]
      };

      // Update activity translations
      const translatedActivities = activities.map(activity => {
        const translatedName = translatedAll[textIndex++];
        const translatedAttrs = activity.data_attributes.map(() => translatedAll[textIndex++]);

        return {
          ...activity,
          activity_name: translatedName,
          data_attributes: translatedAttrs
        };
      });
      activities = translatedActivities;
    }

    // Prefetch other translations in background
    prefetchTranslations();

    // Get privacy notice HTML from config
    const fullNoticeHTML = config.privacyNoticeHTML || '<p style="color:#6b7280;">Privacy notice content...</p>';

    // Extract just the body content from the full HTML document
    let noticeHTML = fullNoticeHTML;
    if (fullNoticeHTML.includes('<body')) {
      const bodyMatch = fullNoticeHTML.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) {
        noticeHTML = bodyMatch[1];
      }
    }

    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'consently-dpdpa-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 999998;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    `;

    // Create widget container
    const widget = document.createElement('div');
    widget.id = 'consently-dpdpa-widget';
    widget.style.cssText = `
      position: relative;
      background: ${backgroundColor === '#ffffff' ? 'rgba(255, 255, 255, 0.95)' : backgroundColor};
      color: ${textColor};
      font-family: ${fontFamily};
      font-size: ${fontSize}px;
      border-radius: 24px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      max-width: 760px;
      max-height: 90vh;
      width: 92%;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transform: scale(0.9);
      opacity: 0;
      transition: all 0.3s ease;
    `;

    // Build widget HTML
    function buildWidgetHTML() {
      return `
      <!-- Header Section -->
      <div style="padding: 20px 24px; border-bottom: 1px solid #e5e7eb; background: #ffffff;">
        <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 12px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            ${config.theme.logoUrl ? `
              <img src="${escapeHtml(config.theme.logoUrl)}" alt="Logo" style="height: 36px; width: auto; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));" />
            ` : `
              <div style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 10px; background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%); color: white; font-weight: 700; font-size: 18px; box-shadow: 0 4px 8px rgba(59,130,246,0.3);">
                C
              </div>
            `}
            <div>
              <h2 style="margin: 0 0 4px 0; font-size: 20px; font-weight: 700; color: ${textColor}; letter-spacing: -0.01em;">${escapeHtml(translatedConfig.title)}</h2>
              <p style="margin: 0; font-size: 13px; color: #6b7280; line-height: 1.4;">${escapeHtml(t.compliantWith)}</p>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <!-- Language Selector with Radio Layout -->
            <div style="position: relative;">
              <button id="dpdpa-lang-btn" style="display: flex; align-items: center; gap: 6px; padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 8px; background: white; color: ${textColor}; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
                <span style="font-size: 13px;">${languageLabel(selectedLanguage)}</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style="opacity: 0.5;">
                  <path d="M7 10l5 5 5-5z"/>
                </svg>
              </button>
              <div id="dpdpa-lang-menu" style="display: none; position: absolute; right: 0; margin-top: 8px; background: white; border: 1px solid #e5e7eb; border-radius: 10px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.15); padding: 8px; z-index: 10; min-width: 200px; max-height: 320px; overflow-y: auto;">
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px;">
                  ${(config.supportedLanguages || ['en']).map(code => `
                    <button data-lang="${code}" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 10px 6px; border: none; background: ${code === selectedLanguage ? '#dbeafe' : '#f9fafb'}; border-radius: 6px; cursor: pointer; transition: all 0.15s; position: relative;">
                      ${code === selectedLanguage ? '<span style="position: absolute; top: 4px; right: 4px; width: 6px; height: 6px; background: ' + primaryColor + '; border-radius: 50%;"></span>' : ''}
                      <span style="font-size: 11px; font-weight: ${code === selectedLanguage ? '600' : '500'}; color: ${code === selectedLanguage ? primaryColor : '#6b7280'}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;">${languageLabel(code)}</span>
                    </button>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
      
      <!-- Main Content Section -->
      <div style="padding: 20px 24px; overflow-y: auto; flex: 1;">
        <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
          ${translatedConfig.message}
        </p>

        <!-- Verification Notice (Shown when not verified) -->
        <div id="dpdpa-verification-notice" style="display: ${userStatus === 'verified' ? 'none' : 'block'}; padding: 24px; text-align: center; background: #f8fafc; border-radius: 16px; border: 1px dashed #cbd5e1; margin-bottom: 20px;">
            <div style="width: 48px; height: 48px; background: #e2e8f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px auto;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
            </div>
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: ${textColor};">Verification Required</h3>
            <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.5;">
                ${config.requireAgeVerification
                  ? 'Please verify your age below to view and manage your consent preferences.'
                  : 'Please verify your email below to view and manage your consent preferences.'}
            </p>
        </div>

        <!-- Preferences Container (Hidden until verified) -->
        <div id="dpdpa-preferences-container" style="display: ${userStatus === 'verified' ? 'block' : 'none'}; animation: fadeIn 0.5s ease;">
            <!-- Processing Activities Table View - Enhanced Design -->
            <div style="margin-bottom: 20px;">
          <!-- Table Header -->
          <!-- Consent Categories Header -->
          <div style="margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between;">
            <h3 style="font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin: 0;">CONSENT CATEGORIES</h3>
          </div>

          
          <!-- Table Body -->
          <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 12px;">
            ${activities.map((activity) => {
        // Extract data categories from new or legacy structure
        let dataCategories = [];
        let purposesList = [];
        let hasMandatoryPurpose = false;
        const mandatoryPurposes = config.mandatoryPurposes || [];

        // Check if new structure with purposes array exists
        if (activity.purposes && Array.isArray(activity.purposes) && activity.purposes.length > 0) {
          // New structure: extract purposes and their data categories
          activity.purposes.forEach(purpose => {
            purposesList.push(purpose.purposeName || 'Unknown Purpose');
            // Check if this purpose is mandatory
            if (mandatoryPurposes.includes(purpose.purposeId) || mandatoryPurposes.includes(purpose.id)) {
              hasMandatoryPurpose = true;
            }
            if (purpose.dataCategories && Array.isArray(purpose.dataCategories)) {
              purpose.dataCategories.forEach(cat => {
                if (cat.categoryName && !dataCategories.includes(cat.categoryName)) {
                  dataCategories.push(cat.categoryName);
                }
              });
            }
          });
        }

        // Fallback to legacy structure
        if (dataCategories.length === 0 && activity.data_attributes && Array.isArray(activity.data_attributes)) {
          dataCategories = activity.data_attributes;
        }

        // If still no data categories, show placeholder
        if (dataCategories.length === 0) {
          dataCategories = ['Personal Data'];
        }

        return `
              <div class="dpdpa-activity-item" data-activity-id="${activity.id}" style="display: flex; gap: 16px; align-items: flex-start; padding: 16px; border: 1px solid ${hasMandatoryPurpose ? primaryColor + '40' : '#e5e7eb'}; border-radius: 12px; background: ${hasMandatoryPurpose ? primaryColor + '08' : '#ffffff'}; transition: all 0.2s ease; margin-bottom: 12px;">
                <!-- Checkbox -->
                <label style="display: flex; align-items: center; ${hasMandatoryPurpose ? 'cursor: not-allowed;' : 'cursor: pointer;'} padding-top: 2px;">
                  <div class="custom-checkbox-wrapper" style="position: relative; width: 24px; height: 24px;">
                    <input type="checkbox" class="activity-checkbox" data-activity-id="${activity.id}" ${hasMandatoryPurpose ? 'checked disabled data-mandatory="true"' : ''} style="opacity: 0; position: absolute; width: 100%; height: 100%; cursor: ${hasMandatoryPurpose ? 'not-allowed' : 'pointer'}; z-index: 2;" />
                    <div class="checkbox-visual" style="width: 24px; height: 24px; border: 2px solid ${hasMandatoryPurpose ? primaryColor : '#d1d5db'}; border-radius: 6px; transition: all 0.2s; display: flex; align-items: center; justify-content: center; background: ${hasMandatoryPurpose ? primaryColor : 'white'};">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="opacity: ${hasMandatoryPurpose ? '1' : '0'}; transform: scale(${hasMandatoryPurpose ? '1' : '0.8'}); transition: all 0.2s;">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  </div>
                </label>
                
                <!-- Content -->
                <div style="flex: 1;">
                  <div style="font-size: 15px; font-weight: 700; color: ${textColor}; margin-bottom: 6px; line-height: 1.3; display: flex; align-items: center; gap: 8px;">
                    ${escapeHtml(activity.activity_name)}
                    ${hasMandatoryPurpose ? `<span style="font-size: 10px; font-weight: 600; color: ${primaryColor}; background: ${primaryColor}15; padding: 2px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Required</span>` : ''}
                  </div>
                  
                  <div style="font-size: 13px; color: #6b7280; line-height: 1.5;">
                    <span style="color: #9ca3af;">Purpose:</span> ${purposesList.length > 0 ? escapeHtml(purposesList.join(', ')) : escapeHtml(activity.activity_description || 'Process data')}
                  </div>
                  <div style="font-size: 13px; color: #6b7280; line-height: 1.5; margin-top: 2px;">
                    <span style="color: #9ca3af;">Data:</span> ${dataCategories.map(c => escapeHtml(c)).join(', ')}
                  </div>
                </div>
                
                <input type="hidden" class="activity-consent-status" data-activity-id="${activity.id}" value="${hasMandatoryPurpose ? 'accepted' : ''}">
              </div>
            `;
      }).join('')}
          </div>
        </div>

        <!-- Manage Preferences Button - Enhanced -->
        <div style="padding: 14px; background: linear-gradient(to right, #eff6ff, #e0f2fe); border-radius: 10px; margin-bottom: 16px; border: 1px solid #bfdbfe; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
            <div style="flex: 1;">
              <p style="margin: 0 0 4px 0; font-size: 13px; color: #1e40af; font-weight: 600; line-height: 1.4;">
                ${t.manageConsentPreferences}
              </p>
              <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.4;">
                ${t.changeSettingsAnytime}
              </p>
            </div>
            <button id="dpdpa-manage-preferences" style="padding: 10px 18px; background: white; color: ${primaryColor}; border: 2px solid ${primaryColor}; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 700; transition: all 0.2s; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.08);">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block; vertical-align: middle; margin-right: 6px;">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6m0 6v6M5.6 5.6l4.2 4.2m4.2 4.2l4.2 4.2M1 12h6m6 0h6M5.6 18.4l4.2-4.2m4.2-4.2l4.2-4.2"/>
              </svg>
              ${t.preferenceCentre}
            </button>
          </div>
        </div>

        
      </div>

      <!--
        AGE VERIFICATION IMPLEMENTATIONS:

        There are TWO age verification implementations available:

        1. DIGILOCKER AGE VERIFICATION (Recommended - DPDPA 2023 Compliant)
           - Controlled by: config.requireAgeVerification
           - Type: Government-backed OAuth flow via DigiLocker (API Setu)
           - Process: Users verify age using government-issued ID documents (Aadhaar, PAN, etc.)
           - Verification: Server-side cryptographic verification of government-issued documents
           - Privacy: Only verified age is stored, date of birth is immediately discarded

           - Compliance: Meets DPDPA 2023 "verifiable parental consent" requirements
           - Status: Active and recommended for production use

        2. LEGACY AGE GATE (Deprecated - Client-side only)
           - Controlled by: config.enableAgeGate
           - Type: Simple checkbox + year dropdown (client-side self-attestation)
           - Process: User checks a box and selects birth year
           - Verification: No verification - relies on user honesty
           - Compliance: Not suitable for DPDPA 2023 compliance
           - Status: Deprecated, maintained for backward compatibility only

        PRIORITY ORDER:
        - If config.requireAgeVerification is true, ONLY DigiLocker section is shown
        - If config.requireAgeVerification is false AND config.enableAgeGate is true, legacy section is shown
        - If both are false, no age verification is shown
        - If both are true, only DigiLocker is used (legacy is ignored)

        UI ORDER (when age verification is required):
        - DigiLocker section is shown FIRST (above email) — it is mandatory
        - Email section is shown SECOND — it is optional
        - This matches the legal requirement: age must be established before consent is requested
      -->

      <!-- DigiLocker Age Verification Section (MUST appear before email when required) -->
      ${config.requireAgeVerification ? `
        <div id="dpdpa-digilocker-section" style="padding: 16px 24px; background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-top: 1px solid #a7f3d0; border-bottom: 1px solid #a7f3d0;">
          <div style="display: flex; align-items: flex-start; gap: 12px;">
            <div style="padding: 8px; background: #10b981; border-radius: 10px; flex-shrink: 0;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div style="flex: 1;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <span style="font-size: 14px; color: #065f46; font-weight: 700;">${t.digilockerVerification}</span>
                <span style="font-size: 10px; font-weight: 700; color: #dc2626; background: #fef2f2; padding: 2px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid #fecaca;">Required</span>
              </div>
              <span style="font-size: 13px; color: #047857; line-height: 1.5; display: block; margin-bottom: 4px;">
                ${t.digilockerDescription} (${config.ageVerificationThreshold || 18}+ years)
              </span>
              <span style="font-size: 11px; color: #6b7280; line-height: 1.4; display: block; margin-bottom: 12px;">
                Age verification is required before consent can be recorded. No personal data is stored.
              </span>
              <div id="dpdpa-digilocker-status" style="margin-bottom: 12px;"></div>
              <button id="dpdpa-digilocker-verify-btn" type="button" style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; background: ${primaryColor}; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 8px ${primaryColor}40;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                ${t.verifyWithDigilocker}
              </button>
            </div>
          </div>
          <div id="dpdpa-digilocker-error" style="color: #dc2626; margin-top: 8px; font-size: 12px; display: none; font-weight: 600;"></div>
        </div>
      ` : ''}

      <!-- Secure This Consent Section -->
      <div class="dpdpa-secure-section" style="padding: 24px; background: linear-gradient(to right, #f8fafc, #f1f5f9); border-top: 1px solid rgba(0,0,0,0.05); border-bottom: 1px solid rgba(0,0,0,0.05);">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <div style="width: 24px; height: 24px; background: ${primaryColor}15; border-radius: 6px; display: flex; align-items: center; justify-content: center;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${primaryColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <h3 style="margin: 0; font-size: 15px; font-weight: 700; color: ${textColor};">
            Secure This Consent
          </h3>
          ${config.requireAgeVerification ? `
            <span style="font-size: 10px; font-weight: 600; color: #6b7280; background: #f3f4f6; padding: 2px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Optional</span>
          ` : ''}
        </div>
        <p style="margin: 0 0 16px 0; font-size: 12px; color: #6b7280; line-height: 1.5;">
          ${userStatus === 'verified'
          ? `We've sent a code to <strong style="color:${primaryColor}">${escapeHtml(prefilledEmail)}</strong> to manage your consents.`
          : `We'll send a code to ${prefilledEmail ? `<strong style="color:${primaryColor}">${escapeHtml(prefilledEmail)}</strong>` : 'your email'} to manage all your consents.`}
        </p>

        <div class="dpdpa-secure-flex" style="display: flex; gap: 10px; align-items: center;">
          ${userStatus === 'verified' ? `
            <!-- OTP Input for Verified User -->
            <div class="dpdpa-secure-input-group dpdpa-otp-section" style="display: flex; gap: 12px; flex: 1; align-items: flex-start; flex-wrap: wrap;">
              <div class="dpdpa-otp-input-wrapper" style="flex: 1; min-width: 180px; position: relative;">
                 <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="one-time-code" id="dpdpa-otp-input" placeholder="000000" style="width: 100%; padding: 14px 12px; border: 2px solid ${primaryColor}40; border-radius: 12px; font-size: 24px; outline: none; transition: all 0.2s; text-align: center; letter-spacing: 0.5em; font-family: 'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace; font-weight: 700; background: linear-gradient(to right, ${primaryColor}05, ${primaryColor}10); color: ${textColor}; box-sizing: border-box;" onfocus="this.style.borderColor='${primaryColor}'; this.style.boxShadow='0 0 0 3px ${primaryColor}20';" onblur="this.style.borderColor='${primaryColor}40'; this.style.boxShadow='none';" />
              </div>
              <div class="dpdpa-otp-actions" style="display: flex; flex-direction: column; gap: 6px; flex-shrink: 0;">
                <button id="dpdpa-resend-btn" style="background: none; border: none; color: ${primaryColor}; font-weight: 600; font-size: 13px; cursor: pointer; padding: 4px 0; white-space: nowrap; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.7'" onmouseout="this.style.opacity='1'">↻ Resend Code</button>
                <button id="dpdpa-change-email-btn" style="background: none; border: none; color: #64748b; font-weight: 500; font-size: 12px; cursor: pointer; padding: 4px 0; white-space: nowrap; text-decoration: underline; transition: color 0.2s;" onmouseover="this.style.color='${primaryColor}'" onmouseout="this.style.color='#64748b'">Change Email</button>
              </div>
              <button id="dpdpa-verify-btn" style="display: none;">Sync</button>
            </div>
          ` : `
            <!-- Email Input for New User -->
            <div class="dpdpa-secure-input-group" style="display: flex; gap: 8px; flex: 1;">
              <input type="email" id="dpdpa-email-input" value="${escapeHtml(prefilledEmail || '')}" placeholder="name@example.com" style="flex: 1; padding: 12px 16px; border: ${prefilledEmail ? `2px solid ${primaryColor}` : '1px solid #cbd5e1'}; border-radius: 12px; font-size: 14px; outline: none; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05); ${prefilledEmail ? `background: linear-gradient(to right, ${primaryColor}08, transparent);` : 'background: white;'}" />
              <button id="dpdpa-send-code-btn" style="padding: 10px 20px; background: ${prefilledEmail ? `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` : 'white'}; color: ${prefilledEmail ? 'white' : textColor}; border: ${prefilledEmail ? 'none' : '1px solid #cbd5e1'}; border-radius: 12px; font-weight: 600; cursor: pointer; font-size: 13px; white-space: nowrap; box-shadow: ${prefilledEmail ? `0 4px 12px ${primaryColor}40` : '0 1px 2px rgba(0,0,0,0.05)'}; transition: all 0.2s;">
                ${prefilledEmail ? '✓ Send Code' : 'Send Code'}
              </button>
            </div>
          `}
        </div>
      </div>
      
      <!-- Footer Links -->
      <div style="padding: 12px 24px; background: #ffffff; margin-bottom: 0;">
          <p style="margin: 0 0 8px 0; font-size: 13px; color: #6b7280; line-height: 1.5;">
            ${t.grievanceText.replace('{here}', `<a href="#" id="dpdpa-grievance-link" style="color: ${primaryColor}; text-decoration: underline; font-weight: 500;">${t.here}</a>`).replace('{here2}', `<a href="#" id="dpdpa-dpb-link" style="color: ${primaryColor}; text-decoration: underline; font-weight: 500;">${t.here}</a>`)}
          </p>
        </div>
      </div>

      <!-- Legacy Age Gate Section (Integrated Checkbox) - Only if DigiLocker not enabled -->
      ${!config.requireAgeVerification && config.enableAgeGate ? `
        <div style="padding: 16px 24px; background: #fffbeb; border-top: 1px solid #fef3c7; border-bottom: 1px solid #fef3c7;">
          <label style="display: flex; align-items: flex-start; gap: 12px; cursor: pointer;">
            <input type="checkbox" id="dpdpa-age-checkbox" style="width: 20px; height: 20px; margin-top: 2px; accent-color: ${primaryColor};" />
            <div style="flex: 1;">
              <span style="font-size: 14px; color: #92400e; font-weight: 700; display: block; margin-bottom: 4px;">Age Verification</span>
              <span style="font-size: 13px; color: #b45309; line-height: 1.5; display: block;">
                I confirm I am above ${config.ageGateThreshold || 18} years old.
                <span style="display:block;margin-top:6px;">Year of birth:
                <select id="dpdpa-age-birthyear-integrated" style="margin-left: 4px; padding: 4px 8px; border-radius: 6px; border: 1px solid #d1d5db; font-size: 12px; vertical-align: middle;">
                   ${generateYearOptions()}
                </select>
                </span>
              </span>
            </div>
          </label>
          <div id="age-gate-err-msg-main" style="color: #dc2626; margin-top: 8px; font-size: 12px; display: none; font-weight: 600;">Please verify your age to continue.</div>
        </div>
      ` : ''}

      <!-- Footer Actions -->
      <div class="dpdpa-footer-actions" style="padding: 20px 24px; border-top: 1px solid rgba(0,0,0,0.05); background: #ffffff; display: flex; justify-content: center; border-radius: 0 0 24px 24px;">
        <button id="dpdpa-confirm-btn" style="width: 100%; max-width: 100%; padding: 16px 24px; background: linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd); color: white; border: none; border-radius: 14px; cursor: pointer; font-size: 16px; font-weight: 700; transition: all 0.2s; box-shadow: 0 8px 20px -4px ${primaryColor}50; display: flex; align-items: center; justify-content: center; letter-spacing: 0.5px;">
          Confirm & Submit
        </button>
      </div>
      
      <!-- Powered by Consently -->
      ${config.showBranding !== false ? `
        <div style="padding: 8px 24px; text-align: center; border-top: 1px solid #e5e7eb; background: #fafbfc;">
          <p style="margin: 0; font-size: 11px; color: #9ca3af;">
            ${t.poweredBy} <a href="https://consently.in" target="_blank" style="color: ${primaryColor}; font-weight: 600; text-decoration: none;">Consently</a>
          </p>
        </div>
      ` : ''}
      <style>
        @media (max-width: 640px) {
          #consently-dpdpa-widget {
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            max-height: 85vh !important;
            border-radius: 20px 20px 0 0 !important;
            margin: 0 !important;
            transform: none !important;
          }
          
          #consently-dpdpa-overlay {
             align-items: flex-end !important;
             padding: 0 !important;
          }

          .dpdpa-secure-flex {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
          }
          
          .dpdpa-secure-input-group {
            width: 100% !important;
          }
          
          /* OTP Input Mobile Optimization */
          .dpdpa-otp-section {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
          }
          
          .dpdpa-otp-input-wrapper {
            width: 100% !important;
            min-width: unset !important;
          }
          
          #dpdpa-otp-input {
            font-size: 28px !important;
            padding: 16px 8px !important;
            letter-spacing: 0.4em !important;
          }
          
          .dpdpa-otp-actions {
            flex-direction: row !important;
            justify-content: center !important;
            gap: 16px !important;
          }
          
          /* Make email input and button stack on very small screens if needed */
          @media (max-width: 380px) {
             .dpdpa-secure-input-group {
                flex-direction: column !important;
             }
             #dpdpa-send-code-btn {
                width: 100% !important;
             }
             #dpdpa-otp-input {
               font-size: 24px !important;
               letter-spacing: 0.35em !important;
             }
          }

          .dpdpa-footer-actions {
             padding: 16px !important;
          }
        }
      </style>
    `;
    }

    widget.innerHTML = buildWidgetHTML();

    function languageLabel(code) {
      const map = {
        en: 'English',
        hi: 'हिंदी',
        pa: 'ਪੰਜਾਬੀ',
        te: 'తెలుగు',
        ta: 'தமிழ்',
        bn: 'বাংলা',
        mr: 'मराठी',
        gu: 'ગુજરાતી',
        kn: 'ಕನ್ನಡ',
        ml: 'മലയാളം',
        or: 'ଓଡ଼ିଆ',
        ur: 'اردو',
        as: 'অসমীয়া'
      };
      return map[code] || code;
    }

    function languageFlag(code) {
      const map = {
        en: '🇮🇳',
        hi: '🇮🇳',
        pa: '🇮🇳',
        te: '🇮🇳',
        ta: '🇮🇳',
        bn: '🇮🇳',
        mr: '🇮🇳',
        gu: '🇮🇳',
        kn: '🇮🇳',
        ml: '🇮🇳',
        or: '🇮🇳',
        ur: '🇮🇳'
      };
      return map[code] || '🌐';
    }

    // Append to overlay and body
    overlay.appendChild(widget);
    document.body.appendChild(overlay);

    // Animate in
    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      widget.style.transform = 'scale(1)';
      widget.style.opacity = '1';
    });

    // Attach event listeners
    attachEventListeners(overlay, widget);

    // Function to rebuild widget content with new language
    async function rebuildWidget() {
      if (isTranslating) {
        console.log('[Consently DPDPA] Translation already in progress, ignoring request');
        return;
      }

      isTranslating = true;

      // Show full-screen loading overlay to prevent confusing transparent effects
      const loadingOverlay = document.createElement('div');
      loadingOverlay.id = 'consently-dpdpa-loading-overlay';
      loadingOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.98);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
        pointer-events: all;
      `;
      loadingOverlay.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
          <div style="width: 32px; height: 32px; border: 3px solid ${primaryColor}30; border-top-color: ${primaryColor}; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
          <span style="font-size: 13px; color: ${textColor}; font-weight: 500; opacity: 0.8;">Translating...</span>
        </div>
        <style>
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        </style>
      `;
      document.body.appendChild(loadingOverlay);

      try {
        // Remove old global click handler before rebuilding
        if (globalClickHandler) {
          document.removeEventListener('click', globalClickHandler);
          globalClickHandler = null;
        }

        // Fetch translations asynchronously
        t = await getTranslation(selectedLanguage);

        // If switching to English, restore original values
        if (selectedLanguage === 'en') {
          translatedConfig = {
            title: config.title || 'Your Data Privacy Rights',
            message: config.message || 'We process your personal data with your consent. Please review the activities below and choose your preferences.',
            acceptButtonText: config.acceptButtonText || 'Accept All',
            rejectButtonText: config.rejectButtonText || 'Reject All',
            customizeButtonText: config.customizeButtonText || 'Manage Preferences'
          };
          // Restore original activities
          activities = JSON.parse(JSON.stringify(originalActivities));
        } else {
          // For non-English languages, translate from original English values
          const originalActivitiesForTranslation = JSON.parse(JSON.stringify(originalActivities));

          // Collect all texts to translate in one batch (OPTIMIZED: single API call)
          const textsToTranslate = [
            // Config values - use original English
            config.title || 'Your Data Privacy Rights',
            config.message || 'We process your personal data with your consent. Please review the activities below and choose your preferences.',
            config.acceptButtonText || 'Accept All',
            config.rejectButtonText || 'Reject All',
            config.customizeButtonText || 'Manage Preferences',
            // Activity content - use original English activities
            ...originalActivitiesForTranslation.map(a => a.activity_name),
            ...originalActivitiesForTranslation.flatMap(a => {
              // Handle new structure with purposes
              if (a.purposes && Array.isArray(a.purposes) && a.purposes.length > 0) {
                return a.purposes.flatMap(p => [
                  p.purposeName || '',
                  ...(p.dataCategories || []).map(cat => cat.categoryName || '')
                ]).filter(Boolean);
              }
              // Fallback to legacy
              return a.data_attributes || [];
            })
          ];

          // Batch translate ALL content in ONE API call instead of multiple
          const translatedTexts = await batchTranslate(textsToTranslate, selectedLanguage);

          // Map translations back to config and activities
          let textIndex = 0;
          translatedConfig = {
            title: translatedTexts[textIndex++],
            message: translatedTexts[textIndex++],
            acceptButtonText: translatedTexts[textIndex++],
            rejectButtonText: translatedTexts[textIndex++],
            customizeButtonText: translatedTexts[textIndex++]
          };

          const translatedActivities = originalActivitiesForTranslation.map(activity => {
            const translatedName = translatedTexts[textIndex++];
            // Handle both new structure (purposes) and legacy (data_attributes)
            if (activity.purposes && Array.isArray(activity.purposes) && activity.purposes.length > 0) {
              // New structure - translate purposes and data categories
              const translatedPurposes = activity.purposes.map(purpose => {
                const translatedPurposeName = translatedTexts[textIndex++];
                const translatedDataCategories = (purpose.dataCategories || []).map(() => translatedTexts[textIndex++]);
                return {
                  ...purpose,
                  purposeName: translatedPurposeName,
                  dataCategories: purpose.dataCategories.map((cat, idx) => ({
                    ...cat,
                    categoryName: translatedDataCategories[idx] || cat.categoryName
                  }))
                };
              });
              return {
                ...activity,
                activity_name: translatedName,
                purposes: translatedPurposes
              };
            } else {
              // Legacy structure - translate data_attributes
              const translatedAttrs = (activity.data_attributes || []).map(() => translatedTexts[textIndex++]);
              return {
                ...activity,
                activity_name: translatedName,
                data_attributes: translatedAttrs
              };
            }
          });

          // Update activities with translated content
          activities = translatedActivities;
        }

        widget.innerHTML = buildWidgetHTML();
        // Re-attach all event listeners
        attachEventListeners(overlay, widget);
        // Re-setup gated interactions
        setupGatedInteractions();
      } catch (error) {
        console.error('[Consently DPDPA] Translation error:', error);
        // On error, still try to rebuild with untranslated content
        widget.innerHTML = buildWidgetHTML();
        attachEventListeners(overlay, widget);
        setupGatedInteractions();
      } finally {
        // Always remove loading overlay
        const overlayElement = document.getElementById('consently-dpdpa-loading-overlay');
        if (overlayElement) overlayElement.remove();
        isTranslating = false;
      }
    }

    // Setup gated interactions
    function setupGatedInteractions() {
      const langBtn = widget.querySelector('#dpdpa-lang-btn');
      const langMenu = widget.querySelector('#dpdpa-lang-menu');

      if (!langBtn || !langMenu) return; // Safety check

      // Hover effect
      langBtn.addEventListener('mouseenter', () => {
        langBtn.style.boxShadow = '0 4px 8px rgba(59,130,246,0.4)';
        langBtn.style.transform = 'translateY(-1px)';
      });
      langBtn.addEventListener('mouseleave', () => {
        langBtn.style.boxShadow = '0 2px 4px rgba(59,130,246,0.3)';
        langBtn.style.transform = 'translateY(0)';
      });

      // Toggle menu
      langBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        langMenu.style.display = langMenu.style.display === 'none' || !langMenu.style.display ? 'block' : 'none';
      });

      // Close on outside click - Store reference to remove later
      globalClickHandler = (e) => {
        if (!langBtn.contains(e.target) && !langMenu.contains(e.target)) {
          langMenu.style.display = 'none';
        }
      };
      document.addEventListener('click', globalClickHandler);

      langMenu.querySelectorAll('button[data-lang]').forEach(b => {
        // Hover effects
        b.addEventListener('mouseenter', () => {
          if (b.getAttribute('data-lang') !== selectedLanguage) {
            b.style.background = '#f0f9ff';
          }
        });
        b.addEventListener('mouseleave', () => {
          if (b.getAttribute('data-lang') !== selectedLanguage) {
            b.style.background = '#fff';
          }
        });

        b.addEventListener('click', async () => {
          selectedLanguage = b.getAttribute('data-lang');
          langMenu.style.display = 'none';
          await rebuildWidget();
        });
      });
    }

    // Initial setup
    setupGatedInteractions();
  }

  // Attach event listeners
  function attachEventListeners(overlay, widget) {
    // Get theme colors for use in event handlers
    const theme = config.theme || {};
    const textColor = theme.textColor || '#1f2937';
    const buttonPrimaryColor = theme.primaryColor || primaryColor;

    // Secure This Consent Buttons
    const sendCodeBtn = widget.querySelector('#dpdpa-send-code-btn');
    if (sendCodeBtn) {
      sendCodeBtn.addEventListener('click', async () => {
        const emailInput = widget.querySelector('#dpdpa-email-input');
        const email = emailInput ? emailInput.value : null;

        if (!email || !email.includes('@')) {
          alert('Please enter a valid email address');
          return;
        }

        // Simulate sending code
        const originalText = sendCodeBtn.textContent;
        sendCodeBtn.textContent = 'Sending...';
        sendCodeBtn.disabled = true;

        try {
          const apiBase = getApiUrl();
          const response = await fetch(`${apiBase}/api/privacy-centre/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: email,
              visitorId: consentID || getConsentID(),
              widgetId: widgetId,
            }),
          });

          if (response.ok) {
            // Switch to OTP view
            const secureSection = widget.querySelector('#dpdpa-email-input').closest('div').parentElement;
            secureSection.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                      <div style="width: 36px; height: 36px; background: linear-gradient(135deg, ${buttonPrimaryColor}20, ${buttonPrimaryColor}10); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                        <span style="font-size: 18px;">📧</span>
                      </div>
                      <div>
                        <h3 style="margin: 0; font-size: 15px; font-weight: 700; color: ${textColor};">Enter Verification Code</h3>
                        <p style="margin: 2px 0 0 0; font-size: 11px; color: #6b7280;">Sent to <strong style="color:${buttonPrimaryColor}">${escapeHtml(email)}</strong></p>
                      </div>
                    </div>
                    <div class="dpdpa-otp-section" style="display: flex; gap: 12px; flex: 1; align-items: center; flex-wrap: wrap;">
                        <div class="dpdpa-otp-input-wrapper" style="flex: 1; min-width: 160px; position: relative;">
                            <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="one-time-code" id="dpdpa-otp-input" placeholder="000000" style="width: 100%; padding: 14px 12px; border: 2px solid ${buttonPrimaryColor}40; border-radius: 12px; font-size: 24px; outline: none; transition: all 0.2s; text-align: center; letter-spacing: 0.5em; font-family: 'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace; font-weight: 700; background: linear-gradient(to right, ${buttonPrimaryColor}05, ${buttonPrimaryColor}10); color: ${textColor}; box-sizing: border-box;" />
                        </div>
                        <button id="dpdpa-resend-btn" style="background: ${buttonPrimaryColor}10; border: 1px solid ${buttonPrimaryColor}30; color: ${buttonPrimaryColor}; font-weight: 600; font-size: 12px; cursor: pointer; padding: 10px 14px; white-space: nowrap; border-radius: 8px; transition: all 0.2s;">↻ Resend</button>
                    </div>
                    <p style="margin: 12px 0 0 0; font-size: 11px; color: #9ca3af; text-align: center;">Code expires in 10 minutes</p>
                `;
            // Re-attach listeners for the new content
            attachEventListeners(overlay, widget);
            userEmail = email; // Update global
          } else {
            alert('Failed to send code. Please try again.');
            sendCodeBtn.textContent = originalText;
            sendCodeBtn.disabled = false;
          }
        } catch (e) {
          console.error('Send OTP error', e);
          alert('Error sending code');
          sendCodeBtn.textContent = originalText;
          sendCodeBtn.disabled = false;
        }
      });
    }

    // Change Email Logic
    const changeEmailBtn = widget.querySelector('#dpdpa-change-email-btn');
    if (changeEmailBtn) {
      changeEmailBtn.addEventListener('click', () => {
        // Remove the widget and show it again as new user
        const overlay = document.getElementById('consently-dpdpa-overlay');
        if (overlay) overlay.remove();
        // Reset user status effectively by calling showConsentWidget with cleared prefilledEmail
        showConsentWidget(null, 'new');
      });
    }

    // Resend Button Logic
    const resendBtn = widget.querySelector('#dpdpa-resend-btn');
    if (resendBtn) {
      resendBtn.addEventListener('click', async () => {
        if (!userEmail) return;
        resendBtn.textContent = 'Sending...';
        resendBtn.disabled = true;
        try {
          const apiBase = getApiUrl();
          await fetch(`${apiBase}/api/privacy-centre/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: userEmail,
              visitorId: consentID || getConsentID(),
              widgetId: widgetId,
            }),
          });
          resendBtn.textContent = 'Sent!';
          setTimeout(() => {
            resendBtn.textContent = '[ Resend Code ]';
            resendBtn.disabled = false;
          }, 3000);
        } catch (e) {
          resendBtn.textContent = 'Error';
          setTimeout(() => {
            resendBtn.textContent = '[ Resend Code ]';
            resendBtn.disabled = false;
          }, 3000);
        }
      });
    }

    // Start OTP Listener
    const verifyBtn = widget.querySelector('#dpdpa-verify-btn');
    if (verifyBtn) {
      verifyBtn.addEventListener('click', async () => {
        const otpInput = widget.querySelector('#dpdpa-otp-input');
        const code = otpInput ? otpInput.value : null;

        if (!code || code.length < 4) {
          alert('Please enter a valid code');
          return;
        }

        if (isVerifying) return; // Prevent double click
        isVerifying = true;

        // Simulate verification
        verifyBtn.textContent = 'Verifying...';
        verifyBtn.disabled = true;

        try {
          const apiBase = getApiUrl();
          const response = await fetch(`${apiBase}/api/privacy-centre/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: userEmail || currentPrefilledEmail,
              otpCode: code,
              visitorId: consentID || getConsentID(),
              widgetId: widgetId,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            verifiedEmail = userEmail || currentPrefilledEmail;

            // Handle Stable Consent ID
            if (data.stableConsentId && data.stableConsentId !== consentID) {
              console.log('[Consently DPDPA] Switching to stable Consent ID:', data.stableConsentId);
              consentID = data.stableConsentId;
              storeConsentID(consentID);
            }

            // Reveal Preferences UI
            const prefsContainer = widget.querySelector('#dpdpa-preferences-container');
            const notice = widget.querySelector('#dpdpa-verification-notice');

            if (prefsContainer) prefsContainer.style.display = 'block';
            if (notice) notice.style.display = 'none';

            // Update confirm button
            const confirmBtn = widget.querySelector('#dpdpa-confirm-btn');
            if (confirmBtn) {
              confirmBtn.textContent = 'Save Preferences';
              confirmBtn.disabled = false;
            }

            verifyBtn.textContent = 'Verified';

          } else {
            alert('Invalid Verification Code');
            verifyBtn.textContent = 'Verify';
            verifyBtn.disabled = false;
          }
        } catch (e) {
          console.error('Verification error', e);
          alert('Verification failed');
          verifyBtn.textContent = 'Verify';
          verifyBtn.disabled = false;
        } finally {
          isVerifying = false;
        }
      });
    }

    // DigiLocker Age Verification Button
    const digilockerVerifyBtn = widget.querySelector('#dpdpa-digilocker-verify-btn');
    if (digilockerVerifyBtn) {
      // Store original button text for restoration
      const originalBtnText = digilockerVerifyBtn.textContent || 'Verify with DigiLocker';

      digilockerVerifyBtn.addEventListener('click', async () => {
        const errorDiv = widget.querySelector('#dpdpa-digilocker-error');

        try {
          digilockerVerifyBtn.textContent = 'Verifying...';
          digilockerVerifyBtn.disabled = true;

          // Build return URL - strip any existing verification params to avoid loops
          const currentUrl = new URL(window.location.href);
          currentUrl.searchParams.delete('age_verification_session');
          currentUrl.searchParams.delete('age_verification_status');
          const cleanReturnUrl = currentUrl.toString();

          // Initiate age verification
          await initiateAgeVerification(cleanReturnUrl);

        } catch (e) {
          console.error('[Consently DPDPA] DigiLocker verification error:', e);
          if (errorDiv) {
            errorDiv.textContent = e.message || 'Verification failed. Please try again.';
            errorDiv.style.display = 'block';
          }
          digilockerVerifyBtn.textContent = 'Retry Verification';
          digilockerVerifyBtn.disabled = false;
        }
      });

      // Check existing verification status on load
      if (checkExistingAgeVerification() || ageVerificationStatus) {
        // Get translations from config language for UI update
        getTranslation(config && config.language ? config.language : 'en').then(translations => {
          updateDigiLockerUI(widget, translations);
        });
      }
    }

    // Checkboxes for activities with enhanced visual feedback (table view)
    const checkboxes = widget.querySelectorAll('.activity-checkbox');
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', function (e) {
        const activityId = this.getAttribute('data-activity-id');
        const item = this.closest('.dpdpa-activity-item');
        const checkboxVisual = this.parentElement.querySelector('.checkbox-visual');
        const checkmark = checkboxVisual?.querySelector('svg');
        const activity = activities.find(a => a.id === activityId);
        const activityName = activity?.activity_name || 'this activity';

        if (this.checked) {
          setActivityConsent(activityId, 'accepted');
          item.style.borderColor = primaryColor;
          item.style.borderWidth = '2px';
          item.style.background = '#f0f9ff';
          item.style.boxShadow = '0 4px 12px rgba(59,130,246,0.25)';
          item.style.borderLeftWidth = '4px';

          // Update checkbox visual
          if (checkboxVisual) {
            checkboxVisual.style.background = primaryColor;
            checkboxVisual.style.borderColor = primaryColor;
          }
          if (checkmark) {
            checkmark.style.opacity = '1';
            checkmark.style.transform = 'scale(1)';
          }

          // Remove warning if exists
          const warning = item.querySelector('.revocation-warning');
          if (warning) warning.remove();
        } else {
          // Show confirmation dialog before revoking consent
          const confirmed = confirm(
            `⚠️ Withdraw Consent?\n\n` +
            `You are about to withdraw your consent for "${activityName}".\n\n` +
            `This may affect:\n` +
            `• Your personalized experience on this website\n` +
            `• Features that rely on this data processing\n` +
            `• Services that require your consent to function\n\n` +
            `Under DPDPA 2023, you have the right to withdraw consent at any time.\n\n` +
            `Click OK to withdraw consent, or Cancel to keep it.`
          );

          if (!confirmed) {
            // User cancelled - revert the checkbox
            e.preventDefault();
            this.checked = true;
            return;
          }

          setActivityConsent(activityId, 'rejected');
          item.style.borderColor = '#e5e7eb';
          item.style.borderWidth = '1px';
          item.style.background = 'white';
          item.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
          item.style.borderLeftWidth = '2px';

          // Update checkbox visual
          if (checkboxVisual) {
            checkboxVisual.style.background = 'white';
            checkboxVisual.style.borderColor = '#d1d5db';
          }
          if (checkmark) {
            checkmark.style.opacity = '0';
            checkmark.style.transform = 'scale(0.8)';
          }
        }
      });
    });

    // Restore saved widget state to DOM after returning from DigiLocker redirect
    applyRestoredStateToDom(widget);

    // Confirm & Submit Button
    const confirmBtn = widget.querySelector('#dpdpa-confirm-btn');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', async () => {
        // DigiLocker Age Verification Check (DPDPA 2023)
        // Uses verificationOutcome (server-enforced) as primary guard,
        // with ageVerificationStatus as fallback for backward compatibility.
        if (config.requireAgeVerification) {
          const errorDiv = widget.querySelector('#dpdpa-digilocker-error');

          // Block if outcome explicitly disallows consent
          if (verificationOutcome === 'blocked_minor') {
            if (overlay) overlay.remove();
            showMinorBlockScreen();
            return;
          }

          // Check if age is verified (consent-permitted outcomes)
          const consentPermitted = ['verified_adult', 'limited_access'];
          const hasPermittedOutcome = verificationOutcome && consentPermitted.includes(verificationOutcome);

          if (!hasPermittedOutcome && ageVerificationStatus !== 'verified') {
            if (errorDiv) {
              errorDiv.textContent = t.ageVerificationRequired || 'Please verify your age to continue.';
              errorDiv.style.display = 'block';
            }

            // Scroll to verification section
            const digiSection = widget.querySelector('#dpdpa-digilocker-section');
            if (digiSection) {
              digiSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
          }

          // Legacy fallback: check rejected status
          if (ageVerificationStatus === 'rejected') {
            if (overlay) overlay.remove();
            showMinorBlockScreen();
            return;
          }

          if (errorDiv) errorDiv.style.display = 'none';
        }

        // Legacy Age Gate Check (Only if DigiLocker not enabled)
        if (!config.requireAgeVerification && config.enableAgeGate) {
          const ageCheckbox = widget.querySelector('#dpdpa-age-checkbox');
          const ageYearSelect = widget.querySelector('#dpdpa-age-birthyear-integrated');
          const ageError = widget.querySelector('#age-gate-err-msg-main');

          if (ageCheckbox && !ageCheckbox.checked) {
            if (ageError) ageError.style.display = 'block';
            return;
          }

          if (ageYearSelect) {
            const ageYearValue = ageYearSelect.value;
            if (!ageYearValue) {
              if (ageError) {
                ageError.textContent = 'Please select your year of birth';
                ageError.style.display = 'block';
              }
              return;
            }
            const age = calculateAgeFromBirthYear(ageYearValue);
            if (age < (config.ageGateThreshold || 18)) {
              setMinorCookie();
              if (overlay) overlay.remove();
              showMinorBlockScreen();
              return;
            }
          }
          if (ageError) ageError.style.display = 'none';
        }

        // Check if already verified
        if (verifiedEmail) {
          console.log('[Consently DPDPA] Email verified, saving preferences...');
          handleAcceptSelected(overlay);
          return;
        }

        // Check if OTP is entered
        const otpInput = widget.querySelector('#dpdpa-otp-input');
        const otp = otpInput ? otpInput.value.replace(/\s/g, '') : null;
        const emailToVerify = userEmail || currentPrefilledEmail;

        if (otp && otp.length >= 4) {
          if (isVerifying) return; // Prevent double submission
          isVerifying = true;

          // Verify OTP first
          const originalText = confirmBtn.textContent;
          confirmBtn.textContent = 'Verifying...';
          confirmBtn.disabled = true;

          try {
            const apiBase = getApiUrl();
            const response = await fetch(`${apiBase}/api/privacy-centre/verify-otp`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: emailToVerify, // Use global or prefilled
                otpCode: otp,
                visitorId: consentID || getConsentID(),
                widgetId: widgetId,
              }),
            });

            if (response.ok) {
              const data = await response.json();

              // Verification success
              verifiedEmail = emailToVerify;

              // Handle Stable Consent ID
              if (data.stableConsentId && data.stableConsentId !== consentID) {
                console.log('[Consently DPDPA] Switching to stable Consent ID:', data.stableConsentId);
                consentID = data.stableConsentId;
                storeConsentID(consentID);
              }

              // Reveal Preferences UI
              const prefsContainer = widget.querySelector('#dpdpa-preferences-container');
              const notice = widget.querySelector('#dpdpa-verification-notice');

              if (prefsContainer) prefsContainer.style.display = 'block';
              if (notice) notice.style.display = 'none';

              confirmBtn.textContent = 'Save Preferences';
              confirmBtn.disabled = false;

              // Optional: Scroll to preferences
              if (prefsContainer) prefsContainer.scrollIntoView({ behavior: 'smooth' });

            } else {
              alert('Invalid Verification Code');
              confirmBtn.textContent = originalText;
              confirmBtn.disabled = false;
            }
          } catch (e) {
            console.error('Verification error', e);
            alert('Verification failed. Please try again.');
            confirmBtn.textContent = originalText;
            confirmBtn.disabled = false;
          } finally {
            isVerifying = false;
          }
        } else {
          // No OTP and not verified
          alert('Please verify your email to manage your consent preferences.');

          // Highlight email input if visible
          const emailInput = widget.querySelector('#dpdpa-email-input');
          if (emailInput) {
            emailInput.focus();
            emailInput.style.borderColor = '#ef4444';
            setTimeout(() => {
              emailInput.style.borderColor = '#cbd5e1';
            }, 2000);
          }
        }
      });

      // Enhanced hover effects
      confirmBtn.addEventListener('mouseenter', () => {
        confirmBtn.style.transform = 'translateY(-2px)';
        confirmBtn.style.boxShadow = '0 6px 16px rgba(59,130,246,0.5)';
      });
      confirmBtn.addEventListener('mouseleave', () => {
        confirmBtn.style.transform = 'translateY(0)';
        confirmBtn.style.boxShadow = '0 4px 12px rgba(59,130,246,0.3)';
      });
      // Integrated Age Gate Change Listeners
      if (config.enableAgeGate) {
        const yearSelect = widget.querySelector('#dpdpa-age-birthyear-integrated');
        if (yearSelect) {
          yearSelect.addEventListener('change', () => {
            const age = calculateAgeFromBirthYear(yearSelect.value);
            if (age < (config.ageGateThreshold || 18)) {
              setMinorCookie();
              if (overlay) overlay.remove();
              showMinorBlockScreen();
            }
          });
        }
      }

    }


    // Grievance link
    const grievanceLink = widget.querySelector('#dpdpa-grievance-link');
    if (grievanceLink) {
      grievanceLink.addEventListener('click', (e) => {
        e.preventDefault();
        openGrievanceForm();
      });
    }

    // DPB link
    const dpbLink = widget.querySelector('#dpdpa-dpb-link');
    if (dpbLink) {
      dpbLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.open('https://dataprotection.gov.in', '_blank');
      });
    }

    // Manage Preferences button with enhanced hover effects
    const managePrefsBtn = widget.querySelector('#dpdpa-manage-preferences');
    if (managePrefsBtn) {
      // Enhanced hover effects
      managePrefsBtn.addEventListener('mouseenter', () => {
        managePrefsBtn.style.background = primaryColor;
        managePrefsBtn.style.color = 'white';
        managePrefsBtn.style.transform = 'translateY(-2px)';
        managePrefsBtn.style.boxShadow = '0 6px 12px rgba(59,130,246,0.4)';
      });
      managePrefsBtn.addEventListener('mouseleave', () => {
        managePrefsBtn.style.background = 'white';
        managePrefsBtn.style.color = primaryColor;
        managePrefsBtn.style.transform = 'translateY(0)';
        managePrefsBtn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.08)';
      });

      managePrefsBtn.addEventListener('click', () => {
        openPrivacyCentre();
      });
    }

    // Enhanced hover effects for activity table rows
    const activityItems = widget.querySelectorAll('.dpdpa-activity-item');
    activityItems.forEach(item => {
      item.addEventListener('mouseenter', () => {
        item.style.borderColor = primaryColor;
        item.style.boxShadow = '0 4px 12px rgba(59,130,246,0.15)';
        item.style.transform = 'translateX(2px)';
        item.style.background = 'linear-gradient(to bottom, #f0f9ff, #e0f2fe)';
      });
      item.addEventListener('mouseleave', () => {
        const checkbox = item.querySelector('.activity-checkbox');
        if (!checkbox.checked) {
          item.style.borderColor = '#e5e7eb';
          item.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
          item.style.transform = 'translateX(0)';
          item.style.background = 'linear-gradient(to bottom, #ffffff, #fafbfc)';
        }
      });
    });

    // Overlay click disabled - users must take an action (accept/reject) to proceed
    // overlay.addEventListener('click', (e) => {
    //   if (e.target === overlay) {
    //     hideWidget(overlay);
    //   }
    // });
  }

  // Set consent for individual activity
  function setActivityConsent(activityId, status) {
    activityConsents[activityId] = {
      status: status,
      timestamp: new Date().toISOString()
    };
  }

  // Update activity UI
  function updateActivityUI(activityId, status) {
    const activityItems = document.querySelectorAll('.dpdpa-activity-item');
    activityItems.forEach(item => {
      const acceptBtn = item.querySelector(`[data-activity-id="${activityId}"].dpdpa-activity-accept`);
      const rejectBtn = item.querySelector(`[data-activity-id="${activityId}"].dpdpa-activity-reject`);

      if (acceptBtn && rejectBtn) {
        if (status === 'accepted') {
          item.style.borderColor = '#10b981';
          acceptBtn.style.opacity = '1';
          rejectBtn.style.opacity = '0.5';
        } else if (status === 'rejected') {
          item.style.borderColor = '#ef4444';
          acceptBtn.style.opacity = '0.5';
          rejectBtn.style.opacity = '1';
        }
      }
    });
  }

  // Handle accept selected (only checked activities)
  async function handleAcceptSelected(overlay) {
    // First check if there are any activities at all
    if (!activities || activities.length === 0) {
      console.error('[Consently DPDPA] No activities available to consent to');
      alert('No activities available. Please contact the website administrator.');
      return;
    }

    const checkboxes = document.querySelectorAll('.activity-checkbox:checked');
    if (checkboxes.length === 0) {
      alert('Please select at least one activity');
      return;
    }

    // Accept only checked activities, reject others
    activities.forEach(activity => {
      const checkbox = document.querySelector(`.activity-checkbox[data-activity-id="${activity.id}"]`);
      if (checkbox && checkbox.checked) {
        setActivityConsent(activity.id, 'accepted');
      } else {
        setActivityConsent(activity.id, 'rejected');
      }
    });
    await saveConsent('partial', overlay);
  }

  // Handle accept all
  async function handleAcceptAll(overlay) {
    // First check if there are any activities at all
    if (!activities || activities.length === 0) {
      console.error('[Consently DPDPA] No activities available to consent to');
      alert('No activities available. Please contact the website administrator.');
      return;
    }

    // Check all checkboxes first
    const checkboxes = document.querySelectorAll('.activity-checkbox');
    checkboxes.forEach(cb => {
      cb.checked = true;
      const item = cb.closest('.dpdpa-activity-item');
      if (item) {
        item.style.borderColor = config.theme.primaryColor || '#3b82f6';
        item.style.background = `${config.theme.primaryColor || '#3b82f6'}08`;
      }
    });

    activities.forEach(activity => {
      setActivityConsent(activity.id, 'accepted');
    });
    await saveConsent('accepted', overlay);
  }

  // Save consent
  async function saveConsent(overallStatus, overlay) {
    // Validate that we have activities to save consent for
    if (!activities || activities.length === 0) {
      console.error('[Consently DPDPA] Cannot save consent: No activities available');
      alert('Cannot save consent. No activities available. Please contact the website administrator.');
      return;
    }

    const acceptedActivities = [];
    const rejectedActivities = [];
    const acceptedPurposeConsents = {}; // Track accepted purpose-level consent: { activity_id: [purpose_id_1, purpose_id_2] }
    const rejectedPurposeConsents = {}; // Track rejected purpose-level consent: { activity_id: [purpose_id_1, purpose_id_2] }

    Object.keys(activityConsents).forEach(activityId => {
      const activity = activities.find(a => a.id === activityId);

      if (activityConsents[activityId].status === 'accepted') {
        acceptedActivities.push(activityId);

        // Track purposes for this accepted activity
        if (activity && activity.purposes && Array.isArray(activity.purposes)) {
          // Store consented purpose IDs for this activity
          // Use purposeId (the actual purpose UUID) not id (which is activity_purpose join table ID)
          acceptedPurposeConsents[activityId] = activity.purposes
            .map(p => p.purposeId || p.id) // Fallback to id if purposeId not available
            .filter(id => id); // Remove any undefined/null values
        }
      } else if (activityConsents[activityId].status === 'rejected') {
        rejectedActivities.push(activityId);

        // Track purposes for this rejected activity (NEW)
        if (activity && activity.purposes && Array.isArray(activity.purposes)) {
          // Store rejected purpose IDs for this activity
          rejectedPurposeConsents[activityId] = activity.purposes
            .map(p => p.purposeId || p.id)
            .filter(id => id);
        }
      }
    });

    // Determine final status based on actual activity arrays
    // This must match the database constraint: valid_consent_activities
    let finalStatus;
    if (acceptedActivities.length > 0 && rejectedActivities.length > 0) {
      finalStatus = 'partial';
    } else if (acceptedActivities.length > 0) {
      finalStatus = 'accepted';
    } else if (rejectedActivities.length > 0) {
      finalStatus = 'rejected';
    } else {
      // No activities - this shouldn't happen due to earlier validation, but handle it
      console.error('[Consently DPDPA] No activities consented or rejected');
      alert('Please select at least one activity to save your preferences.');
      return;
    }

    // Include rule context if a rule was matched
    const ruleContext = config._matchedRule ? {
      ruleId: config._matchedRule.id,
      ruleName: config._matchedRule.rule_name,
      urlPattern: config._matchedRule.url_pattern,
      pageUrl: window.location.pathname
    } : undefined;

    // Get or generate Consent ID
    if (!consentID) {
      consentID = getConsentID();
    }

    const consentData = {
      widgetId: widgetId,
      visitorId: consentID,
      consentStatus: finalStatus,
      acceptedActivities: acceptedActivities,
      ruleContext: ruleContext, // Track which rule triggered this consent
      rejectedActivities: rejectedActivities,
      activityConsents: activityConsents,
      visitorEmail: verifiedEmail || undefined, // Send verified email if available (convert null to undefined)
      acceptedPurposeConsents: Object.keys(acceptedPurposeConsents).length > 0 ? acceptedPurposeConsents : undefined, // Track accepted purpose-level consent
      rejectedPurposeConsents: Object.keys(rejectedPurposeConsents).length > 0 ? rejectedPurposeConsents : undefined, // Track rejected purpose-level consent
      // DEPRECATED: Keep for backward compatibility, will be removed in v2.0
      activityPurposeConsents: Object.keys(acceptedPurposeConsents).length > 0 ? acceptedPurposeConsents : undefined,
      metadata: {
        language: navigator.language || 'en',
        referrer: document.referrer || null,
        currentUrl: window.location.href,
        pageTitle: document.title
      },
      consentDuration: config.consentDuration || 365
    };

    try {
      const result = await recordConsent(consentData);

      // Store Consent ID
      storeConsentID(consentID);

      // Store consent locally
      const storageData = {
        status: finalStatus,
        acceptedActivities: acceptedActivities,
        rejectedActivities: rejectedActivities,
        activityConsents: activityConsents,
        timestamp: new Date().toISOString(),
        expiresAt: result.expiresAt,
        verifiedEmail: verifiedEmail
      };

      ConsentStorage.set(
        `consently_dpdpa_consent_${widgetId}`,
        storageData,
        config.consentDuration || 365
      );

      // Apply consent
      applyConsent(storageData);

      // Track consent event for analytics
      trackConsentEvent(consentData, config._matchedRule || null);

      // Show floating preference centre button
      showFloatingPreferenceButton();

      // Hide widget immediately
      hideWidget(overlay);

      // Show success modal with email/ID display and privacy notice download
      showConsentSuccessModal(consentID);

      console.log('[Consently DPDPA] Consent saved successfully');
    } catch (error) {
      console.error('[Consently DPDPA] Failed to save consent:', error);
      alert('Failed to save your consent preferences. Please try again.');
    }
  }

  // Show premium notification toast
  function showPremiumNotification(status, consentData) {
    // Remove existing toast if any
    const existingToast = document.getElementById('dpdpa-premium-toast');
    if (existingToast) {
      existingToast.remove();
    }

    const theme = config.theme || {};
    const primaryColor = theme.primaryColor || '#3b82f6';
    const textColor = theme.textColor || '#1f2937';

    const toast = document.createElement('div');
    toast.id = 'dpdpa-premium-toast';

    // Glassmorphism styles
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      padding: 16px 20px;
      border-radius: 16px;
      box-shadow: 
        0 4px 6px -1px rgba(0, 0, 0, 0.05),
        0 10px 15px -3px rgba(0, 0, 0, 0.05),
        0 0 0 1px rgba(0, 0, 0, 0.05);
      z-index: 2147483647;
      display: flex;
      align-items: center;
      gap: 16px;
      transform: translateY(100px) scale(0.95);
      opacity: 0;
      transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
      font-family: ${theme.fontFamily || 'system-ui, -apple-system, sans-serif'};
      max-width: 380px;
      border: 1px solid rgba(255, 255, 255, 0.5);
    `;

    // Success Icon
    const iconHtml = `
      <div style="
        width: 40px; 
        height: 40px; 
        border-radius: 12px; 
        background: linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd); 
        display: flex; 
        align-items: center; 
        justify-content: center;
        box-shadow: 0 4px 12px ${primaryColor}40;
        flex-shrink: 0;
      ">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 6L9 17l-5-5"></path>
        </svg>
      </div>
    `;

    // Content
    const contentHtml = `
      <div style="flex: 1;">
        <h4 style="margin: 0 0 2px 0; font-size: 14px; font-weight: 700; color: ${textColor}; letter-spacing: -0.01em;">Preferences Saved</h4>
        <p style="margin: 0; font-size: 12px; color: #64748b; font-weight: 500;">Your privacy choices are active.</p>
      </div>
    `;

    // Action Button (Download Receipt)
    const buttonHtml = `
      <button id="dpdpa-toast-download" style="
        padding: 8px 12px; 
        background: #f1f5f9; 
        color: #475569; 
        border: none; 
        border-radius: 8px; 
        font-size: 12px; 
        font-weight: 600; 
        cursor: pointer; 
        transition: all 0.2s; 
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: 6px;
      ">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        Receipt
      </button>
    `;

    // Close Button
    const closeHtml = `
      <button id="dpdpa-toast-close" style="
        padding: 4px; 
        background: transparent; 
        border: none; 
        color: #94a3b8; 
        cursor: pointer; 
        margin-left: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background 0.2s;
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `;

    toast.innerHTML = iconHtml + contentHtml + buttonHtml + closeHtml;
    document.body.appendChild(toast);

    // Add hover effect for download button
    const downloadBtn = toast.querySelector('#dpdpa-toast-download');
    downloadBtn.addEventListener('mouseenter', () => {
      downloadBtn.style.background = '#e2e8f0';
      downloadBtn.style.color = '#1e293b';
    });
    downloadBtn.addEventListener('mouseleave', () => {
      downloadBtn.style.background = '#f1f5f9';
      downloadBtn.style.color = '#475569';
    });
    downloadBtn.addEventListener('click', () => {
      downloadConsentReceipt(consentData);
    });

    // Close button handler
    const closeBtn = toast.querySelector('#dpdpa-toast-close');
    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.background = '#f1f5f9';
      closeBtn.style.color = '#64748b';
    });
    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.background = 'transparent';
      closeBtn.style.color = '#94a3b8';
    });
    closeBtn.addEventListener('click', () => {
      hideToast();
    });

    // Animate in
    requestAnimationFrame(() => {
      toast.style.transform = 'translateY(0) scale(1)';
      toast.style.opacity = '1';
    });

    // Auto dismiss after 5 seconds
    const timeoutId = setTimeout(() => {
      hideToast();
    }, 5000);

    function hideToast() {
      clearTimeout(timeoutId);
      if (toast && document.body.contains(toast)) {
        toast.style.transform = 'translateY(20px) scale(0.95)';
        toast.style.opacity = '0';
        setTimeout(() => {
          if (document.body.contains(toast)) {
            toast.remove();
          }
        }, 400);
      }
    }
  }

  // Hide widget
  function hideWidget(overlay) {
    const widget = overlay.querySelector('#consently-dpdpa-widget');
    overlay.style.opacity = '0';
    if (widget) {
      widget.style.transform = 'scale(0.9)';
      widget.style.opacity = '0';
    }

    // Cleanup: Remove global click handler
    if (globalClickHandler) {
      document.removeEventListener('click', globalClickHandler);
      globalClickHandler = null;
    }

    setTimeout(() => {
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
    }, 300);
  }

  // Escape HTML to prevent XSS
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }


  function downloadConsentReceipt(consent) {
    const visitorId = consentID || getConsentID();
    const receiptData = {
      widgetId,
      visitorId,
      privacyCentreUrl: window.location.origin + '/privacy-centre/' + widgetId + '?visitorId=' + visitorId,
      ...consent
    };
    const blob = new Blob([JSON.stringify(receiptData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'consent-receipt-' + visitorId + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function openPrivacyCentre() {
    const visitorId = consentID || getConsentID();
    window.open(window.location.origin + '/privacy-centre/' + widgetId + '?visitorId=' + visitorId, '_blank');
  }

  // Show cookie details modal
  async function showCookieDetails() {
    try {
      // Show loading state
      const loadingOverlay = document.createElement('div');
      loadingOverlay.id = 'consently-cookie-details-loading';
      loadingOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      loadingOverlay.innerHTML = `
        <div style="background: white; padding: 40px; border-radius: 16px; text-align: center;">
          <div style="width: 40px; height: 40px; border: 4px solid #f3f4f6; border-top-color: ${primaryColor}; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px;"></div>
          <p style="margin: 0; color: #6b7280; font-weight: 500;">Loading cookie details...</p>
        </div>
        <style>
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        </style>
      `;
      document.body.appendChild(loadingOverlay);

      // Fetch cookie data
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/cookies/domain-cookies?widgetId=${widgetId}`);
      const data = await response.json();

      // Remove loading overlay
      loadingOverlay.remove();

      if (!data.success) {
        throw new Error(data.error || 'Failed to load cookie data');
      }

      const cookieData = data.data;

      // Create cookie details modal
      const modalOverlay = document.createElement('div');
      modalOverlay.id = 'consently-cookie-details-modal';
      modalOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s ease;
      `;

      modalOverlay.innerHTML = `
        <div style="background: white; border-radius: 12px; max-width: 800px; width: 95%; max-height: 90vh; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.15); transform: scale(0.95); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);">
          <!-- Header -->
          <div style="padding: 20px 24px; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: space-between; background: #fafbfc;">
            <div>
              <h2 style="margin: 0; font-size: 18px; font-weight: 600; color: #1a1a1a;">Cookie Preferences</h2>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #6b7280;">
                ${cookieData.domain} • ${cookieData.totalCookies} cookies
                ${cookieData.lastScanned ? `• Scanned ${new Date(cookieData.lastScanned).toLocaleDateString()}` : ''}
              </p>
            </div>
            <button id="close-cookie-modal" style="background: none; border: none; width: 32px; height: 32px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; color: #6b7280;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <!-- Description -->
          <div style="padding: 16px 24px; background: #f8f9fa; border-bottom: 1px solid #e5e7eb;">
            <p style="margin: 0; font-size: 13px; color: #4b5563; line-height: 1.5;">
              We use cookies to enhance your experience, analyze site traffic, and personalize content. 
              You can choose which categories of cookies you allow. Learn more in our 
              <a href="#" style="color: ${primaryColor}; text-decoration: none;">Privacy Policy</a>.
            </p>
          </div>

          <!-- Content -->
          <div style="padding: 20px 24px; overflow-y: auto; max-height: calc(90vh - 200px);">
            ${cookieData.totalCookies === 0 ? `
              <div style="text-align: center; padding: 60px 20px; color: #6b7280;">
                <div style="font-size: 48px; margin-bottom: 16px;">🍪</div>
                <p style="margin: 0; font-size: 16px; font-weight: 500;">No cookies scanned</p>
                <p style="margin: 8px 0 0 0; font-size: 14px;">Please run a cookie scan to see the details.</p>
              </div>
            ` : `
              ${Object.entries(cookieData.categories).map(([category, cookies]) => {
        const categoryInfo = {
          necessary: {
            color: '#10b981',
            icon: '🔒',
            name: 'Necessary Cookies',
            description: 'Essential for the website to function properly',
            alwaysOn: true
          },
          functional: {
            color: '#3b82f6',
            icon: '⚙️',
            name: 'Functional Cookies',
            description: 'Enable enhanced functionality and personalization',
            alwaysOn: false
          },
          analytics: {
            color: '#f59e0b',
            icon: '📊',
            name: 'Analytics Cookies',
            description: 'Help us understand how visitors interact with our site',
            alwaysOn: false
          },
          advertising: {
            color: '#ef4444',
            icon: '📢',
            name: 'Advertising Cookies',
            description: 'Used to deliver personalized advertisements',
            alwaysOn: false
          },
          social: {
            color: '#8b5cf6',
            icon: '👥',
            name: 'Functional Cookies',
            description: 'Enable enhanced functionality and personalization',
            alwaysOn: false
          },
          preferences: {
            color: '#6b7280',
            icon: '⚡',
            name: 'Preference Cookies',
            description: 'Remember your settings and preferences',
            alwaysOn: false
          }
        };

        if (cookies.length === 0) return '';

        const info = categoryInfo[category] || categoryInfo.functional;
        const isExpanded = true; // Default to expanded for better UX

        return `
                  <div style="margin-bottom: 20px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background: white;">
                    <!-- Category Header -->
                    <div style="padding: 16px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; 
                                background: ${isExpanded ? info.color + '08' : 'white'}; 
                                border-bottom: ${isExpanded ? '1px solid #e5e7eb' : 'none'};">
                      <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
                        <span style="font-size: 24px;">${info.icon}</span>
                        <div style="flex: 1;">
                          <h3 style="margin: 0; font-size: 15px; font-weight: 600; color: #1a1a1a; display: flex; align-items: center; gap: 8px;">
                            ${info.name}
                            ${info.alwaysOn ? '<span style="font-size: 11px; padding: 2px 6px; background: #e5e7eb; color: #6b7280; border-radius: 4px; font-weight: 500;">Always Active</span>' : ''}
                          </h3>
                          <p style="margin: 2px 0 0 0; font-size: 12px; color: #6b7280; line-height: 1.4;">${info.description}</p>
                        </div>
                      </div>
                      <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="font-size: 12px; color: #6b7280; font-weight: 500;">${cookies.length} cookies</span>
                        <label style="position: relative; display: inline-block; width: 44px; height: 24px;">
                          <input type="checkbox" ${info.alwaysOn || isExpanded ? 'checked' : ''} 
                                 ${info.alwaysOn ? 'disabled' : ''} 
                                 style="opacity: 0; width: 0; height: 0;">
                          <span style="position: absolute; cursor: ${info.alwaysOn ? 'not-allowed' : 'pointer'}; 
                                       top: 0; left: 0; right: 0; bottom: 0; 
                                       background-color: ${info.alwaysOn || isExpanded ? info.color : '#ccc'}; 
                                       transition: .3s; border-radius: 24px;">
                            <span style="position: absolute; content: ''; height: 18px; width: 18px; left: 3px; bottom: 3px; 
                                        background-color: white; transition: .3s; border-radius: 50%; 
                                        transform: translateX(${info.alwaysOn || isExpanded ? '20px' : '0'});"></span>
                          </span>
                        </label>
                      </div>
                    </div>

                    <!-- Cookie List -->
                    ${isExpanded ? `
                      <div style="padding: 16px; background: #fafbfc;">
                        ${cookies.map(cookie => `
                          <div style="padding: 12px; background: white; border-radius: 6px; margin-bottom: 8px; 
                                      border: 1px solid #e5e7eb; font-size: 12px; line-height: 1.5;
                                      transition: all 0.2s; cursor: default;"
                               onmouseover="this.style.borderColor='${info.color}30'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.05)'"
                               onmouseout="this.style.borderColor='#e5e7eb'; this.style.boxShadow='none'">
                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 6px;">
                              <div style="flex: 1;">
                                <div style="font-weight: 600; color: #1a1a1a; margin-bottom: 2px; font-size: 13px;">${cookie.name}</div>
                                <div style="color: #6b7280;">
                                  <span style="color: #9ca3af;">Host:</span> ${cookie.domain || cookie.host}
                                  ${cookie.isThirdParty ? '<span style="margin-left: 8px; padding: 2px 6px; background: #fef3c7; color: #92400e; border-radius: 4px; font-size: 11px; font-weight: 500;">Third-party</span>' : ''}
                                </div>
                              </div>
                              <div style="color: #6b7280; text-align: right; font-size: 11px;">
                                <span style="color: #9ca3af;">Expires:</span><br>${cookie.expiry || 'Session'}
                              </div>
                            </div>
                            ${cookie.purpose ? `
                              <div style="color: #4b5563; margin-top: 6px;">
                                <span style="color: #9ca3af;">Purpose:</span> ${cookie.purpose}
                              </div>
                            ` : ''}
                            ${cookie.provider ? `
                              <div style="color: #4b5563; margin-top: 4px;">
                                <span style="color: #9ca3af;">Provider:</span> ${cookie.provider}
                              </div>
                            ` : ''}
                          </div>
                        `).join('')}
                      </div>
                    ` : ''}
                  </div>
                `;
      }).join('')}
            `}

            <!-- Footer Actions -->
            <div style="margin-top: 24px; padding: 16px; background: #f8f9fa; border-radius: 8px; display: flex; gap: 12px; justify-content: flex-end;">
              <button id="reject-all-cookies" style="padding: 10px 20px; border: 1px solid #d1d5db; background: white; color: #6b7280; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s;">
                Reject All
              </button>
              <button id="accept-all-cookies" style="padding: 10px 20px; border: none; background: ${primaryColor}; color: white; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                Accept All
              </button>
              <button id="save-cookie-preferences" style="padding: 10px 20px; border: none; background: ${primaryColor}; color: white; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modalOverlay);

      // Animate in
      requestAnimationFrame(() => {
        modalOverlay.style.opacity = '1';
        modalOverlay.querySelector('div').style.transform = 'scale(1)';
      });

      // Close modal handlers
      const closeModal = () => {
        modalOverlay.style.opacity = '0';
        modalOverlay.querySelector('div').style.transform = 'scale(0.95)';
        setTimeout(() => {
          document.body.removeChild(modalOverlay);
        }, 300);
      };

      document.getElementById('close-cookie-modal').addEventListener('click', closeModal);
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
          closeModal();
        }
      });

      // Handle cookie preference buttons
      document.getElementById('accept-all-cookies')?.addEventListener('click', () => {
        // Enable all toggles except necessary (which is always on)
        const toggles = modalOverlay.querySelectorAll('input[type="checkbox"]:not([disabled])');
        toggles.forEach(toggle => {
          toggle.checked = true;
          updateToggleVisual(toggle, true);
        });
      });

      document.getElementById('reject-all-cookies')?.addEventListener('click', () => {
        // Disable all toggles except necessary (which is always on)
        const toggles = modalOverlay.querySelectorAll('input[type="checkbox"]:not([disabled])');
        toggles.forEach(toggle => {
          toggle.checked = false;
          updateToggleVisual(toggle, false);
        });
      });

      document.getElementById('save-cookie-preferences')?.addEventListener('click', async () => {
        const preferences = {};
        const toggles = modalOverlay.querySelectorAll('input[type="checkbox"]');

        const categoryInfo = {
          necessary: 'Necessary Cookies',
          functional: 'Functional Cookies',
          analytics: 'Analytics Cookies',
          advertising: 'Advertising Cookies',
          social: 'Functional Cookies',
          preferences: 'Preference Cookies'
        };

        toggles.forEach(toggle => {
          const categoryElement = toggle.closest('[style*="border"]');
          if (categoryElement) {
            const categoryName = Object.keys(categoryInfo).find(key =>
              categoryInfo[key] === categoryElement.querySelector('h3')?.textContent?.split(' (')[0]
            );
            if (categoryName) {
              preferences[categoryName] = toggle.checked;
            }
          }
        });

        // Save preferences to localStorage
        ConsentStorage.set(`consently_cookie_preferences_${widgetId}`, preferences, 365);

        // Show success message
        const successMsg = document.createElement('div');
        successMsg.style.cssText = `
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: #10b981;
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 1000000;
          font-size: 14px;
          font-weight: 500;
        `;
        successMsg.textContent = 'Cookie preferences saved successfully';
        document.body.appendChild(successMsg);

        setTimeout(() => {
          successMsg.remove();
        }, 3000);
      });

      // Helper function to update toggle visual state
      function updateToggleVisual(toggle, isChecked) {
        const span = toggle.nextElementSibling;
        if (span) {
          span.style.backgroundColor = isChecked ? primaryColor : '#ccc';
          const innerSpan = span.querySelector('span');
          if (innerSpan) {
            innerSpan.style.transform = `translateX(${isChecked ? '20px' : '0'})`;
          }
        }
      }

      // Add toggle change listeners
      const toggles = modalOverlay.querySelectorAll('input[type="checkbox"]:not([disabled])');
      toggles.forEach(toggle => {
        toggle.addEventListener('change', (e) => {
          updateToggleVisual(e.target, e.target.checked);
        });
      });

    } catch (error) {
      console.error('Error showing cookie details:', error);
      alert('Failed to load cookie details. Please try again later.');
    }
  }

  function showFloatingPreferenceButton() {
    if (document.getElementById('dpdpa-floating-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'dpdpa-floating-btn';
    btn.title = 'Manage Privacy Preferences';
    btn.style.cssText = 'position: fixed; ' +
      'bottom: 20px; ' +
      'left: 20px; ' +
      'width: 50px; ' +
      'height: 50px; ' +
      'border-radius: 50%; ' +
      'background: white; ' +
      'border: none; ' +
      'box-shadow: 0 4px 12px rgba(0,0,0,0.15); ' +
      'cursor: pointer; ' +
      'z-index: 999997; ' +
      'display: flex; ' +
      'align-items: center; ' +
      'justify-content: center; ' +
      'transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);';

    btn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="' + primaryColor + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>' +
      '</svg>';

    btn.addEventListener('click', () => {
      showConsentWidget();
    });

    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'scale(1.1)';
      btn.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'scale(1)';
      btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    });

    document.body.appendChild(btn);
  }

  function addDPDPAToCookieMenu() {
    // Implementation for adding to existing cookie menu if present
    // This is a placeholder for integration with other cookie widgets
  }

  function openGrievanceForm() {
    const visitorId = consentID || getConsentID();
    // Use the configured grievance URL or default to privacy centre grievance tab
    const grievanceUrl = window.location.origin + '/privacy-centre/' + widgetId + '/grievance?visitorId=' + visitorId;
    window.open(grievanceUrl, '_blank');
  }




  // Public API
  window.ConsentlyDPDPA = {
    init: init,
    show: showConsentWidget,
    hide: () => {
      const overlay = document.getElementById('consently-dpdpa-overlay');
      if (overlay) hideWidget(overlay);
    },
    getConsent: () => ConsentStorage.get('consently_dpdpa_consent_' + widgetId),
    openPrivacyCentre: openPrivacyCentre,
    downloadReceipt: () => {
      const consent = ConsentStorage.get('consently_dpdpa_consent_' + widgetId);
      if (consent) downloadConsentReceipt(consent);
    },
    downloadPrivacyNotice: () => {
      if (window.downloadPrivacyNotice) {
        window.downloadPrivacyNotice();
      }
    }
  };

  // Auto-init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
