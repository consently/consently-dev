/**
 * Consently DPDPA Consent Widget v1.0
 * Production-ready embeddable widget for DPDPA 2023 compliance
 * Displays processing activities and collects granular consent
 * 
 * Usage: <script src="https://www.consently.in/dpdpa-widget.js" data-dpdpa-widget-id="YOUR_WIDGET_ID"></script>
 */

(function() {
  'use strict';

  // Get widget ID from script tag
  const currentScript = document.currentScript || document.querySelector('script[data-dpdpa-widget-id]');
  const widgetId = currentScript ? currentScript.getAttribute('data-dpdpa-widget-id') : null;
  
  if (!widgetId) {
    console.error('[Consently DPDPA] Error: data-dpdpa-widget-id attribute is required');
    console.error('[Consently DPDPA] Usage: <script src="https://www.consently.in/dpdpa-widget.js" data-dpdpa-widget-id="YOUR_WIDGET_ID"></script>');
    return;
  }

  console.log('[Consently DPDPA] Initializing widget with ID:', widgetId);

  // English translations as base
  const BASE_TRANSLATIONS = {
    consentManager: 'Consent Manager',
    compliantWith: 'Fully compliant with Digital Personal Data Protection Act, 2023',
    requirementsTitle: 'DPDPA 2023 requires you to read and download the privacy notice',
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
    privacyNotice: 'Privacy Notice',
    dpdpaCompliance: 'DPDPA 2023 Compliance',
    manageConsentPreferences: 'Manage Your Consent Preferences',
    changeSettingsAnytime: 'You can change these settings at any time',
    preferenceCentre: 'Preference Centre',
    grievanceText: 'If you have any grievances with how we process your personal data click {here}. If we are unable to resolve your grievance, you can also make a complaint to the Data Protection Board by clicking {here2}.',
    here: 'here',
    poweredBy: 'Powered by'
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
  let activities = [];
  let activityConsents = {};
  let consentID = null; // User-visible Consent ID (Format: CNST-XXXX-XXXX-XXXX)
  let globalClickHandler = null; // Global reference to cleanup language menu listener
  let primaryColor = '#4c8bf5'; // Default primary color, updated when config loads

  // LocalStorage manager for consent persistence
  const ConsentStorage = {
    set: function(key, value, expirationDays) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expirationDays);
      const data = {
        value: value,
        expiresAt: expiresAt.toISOString()
      };
      localStorage.setItem(key, JSON.stringify(data));
    },
    
    get: function(key) {
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
    
    delete: function(key) {
      localStorage.removeItem(key);
    }
  };

  // Consistent hash function - uses same algorithm for both async and sync
  // Returns 32-character hex string for consistency
  function hashStringSync(str) {
    if (!str) return null;
    
    // Normalize the string (lowercase, trim)
    const normalized = str.toLowerCase().trim();
    
    // Use a consistent hash algorithm that produces same result every time
    // This is a modified djb2 hash that produces 32-character hex output
    let hash1 = 5381;
    let hash2 = 0;
    
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i);
      hash1 = ((hash1 << 5) + hash1) + char;
      hash2 = ((hash2 << 5) + hash2) + (char * 31);
    }
    
    // Combine both hashes and convert to 32-character hex string
    const combined = Math.abs(hash1) + Math.abs(hash2);
    const hex = combined.toString(16).padStart(16, '0');
    // Repeat pattern to get 32 chars for consistency with SHA-256 length
    return (hex + hex).substring(0, 32);
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
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
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
    } catch (e) {}
    
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
    } catch (e) {}
    
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
      const submitHandler = (e) => {
        // Check if consent already given
        const existingConsent = ConsentStorage.get(`consently_dpdpa_consent_${widgetId}`);
        const hasConsent = existingConsent && existingConsent.timestamp;
        
        // If no consent, prevent form submission and show widget
        if (!hasConsent) {
          e.preventDefault();
          e.stopPropagation();
          
          console.log('[Consently DPDPA] Form submission intercepted - showing consent widget');
          
          // Apply rule and show widget
          applyRule(rule);
          trackRuleMatch(rule);
          
          // Store the form and event for later submission
          const formData = new FormData(form);
          const submitButton = e.submitter || form.querySelector('[type="submit"]');
          
          // Show widget and handle consent
          showConsentWidget();
          
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
      const currentPath = window.location.pathname || '/';
      
      // Input validation
      if (typeof currentPath !== 'string') {
        console.warn('[Consently DPDPA] Invalid path in evaluateDisplayRules');
        return null;
      }
      
      console.log('[Consently DPDPA] Evaluating display rules for path:', currentPath);
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
          if (matchesUrlPattern(currentPath, rule)) {
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
    // Store the matched rule for consent tracking
    config._matchedRule = rule;
    
    // SECURITY: If a rule matches a specific URL pattern, it MUST specify activities
    // Otherwise, we won't show the widget to prevent accidentally showing all activities
    const currentPath = window.location.pathname || '/';
    if (rule.url_pattern && rule.url_pattern !== '*' && rule.url_pattern !== '/*') {
      if (!rule.activities || !Array.isArray(rule.activities) || rule.activities.length === 0) {
        console.error('[Consently DPDPA] ❌ Display rule matched for:', currentPath);
        console.error('[Consently DPDPA] ❌ Rule:', rule.rule_name, 'matches URL pattern:', rule.url_pattern);
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
      if (notice.html) config.privacyNoticeHTML = notice.html;
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

  // Show Consent ID Verification Screen
  async function showVerificationScreen() {
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
          <p style="color:#64748b;font-size:14px;margin:0;line-height:1.4;">Enter your Consent ID to sync preferences</p>
        </div>
        
        <!-- Consent ID Input Section - Compact -->
        <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:16px;border:1px solid #e2e8f0;">
          <label style="display:flex;align-items:center;gap:6px;font-weight:600;margin-bottom:10px;color:#1e293b;font-size:13px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 17v-2m0-4V7m9 5a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#4F76F6" stroke-width="2" stroke-linecap="round"/>
            </svg>
            Consent ID
          </label>
          <div style="position:relative;margin-bottom:12px;">
            <input 
              type="text" 
              id="consent-id-input"
              placeholder="CNST-XXXX-XXXX-XXXX"
              maxlength="19"
              style="width:100%;padding:12px 12px 12px 38px;border:2px solid #cbd5e1;border-radius:10px;font-size:15px;font-family:ui-monospace,monospace;text-transform:uppercase;box-sizing:border-box;transition:all 0.2s;background:white;"
              onfocus="this.style.borderColor='#4F76F6';this.style.boxShadow='0 0 0 3px rgba(79,118,246,0.1)'"
              onblur="this.style.borderColor='#cbd5e1';this.style.boxShadow='none'"
            />
            <svg style="position:absolute;left:12px;top:50%;transform:translateY(-50%);pointer-events:none;" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <button 
            id="verify-consent-btn"
            style="width:100%;padding:12px;background:linear-gradient(135deg, #4F76F6 0%, #3B5BDB 100%);border:none;color:white;border-radius:10px;font-weight:600;font-size:14px;cursor:pointer;transition:all 0.2s;box-shadow:0 2px 8px rgba(79,118,246,0.25);"
            onmouseover="this.style.transform='translateY(-1px)';this.style.boxShadow='0 4px 12px rgba(79,118,246,0.35)'"
            onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 2px 8px rgba(79,118,246,0.25)'"
          >
            <span style="display:flex;align-items:center;justify-content:center;gap:6px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 13l4 4L19 7" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Verify & Load
            </span>
          </button>
          <div id="verify-error" style="color:#dc2626;margin-top:10px;font-size:13px;display:none;padding:10px;background:#fee;border-radius:8px;border-left:3px solid #dc2626;"></div>
        </div>
        
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
            border-radius: 12px !important;
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
    
    document.body.appendChild(modal);
    
    // Event listeners
    const verifyBtn = document.getElementById('verify-consent-btn');
    const startFreshBtn = document.getElementById('start-fresh-btn');
    const input = document.getElementById('consent-id-input');
    const errorDiv = document.getElementById('verify-error');
    
    // Auto-format input with better paste support
    let isFormatting = false;
    input.addEventListener('input', (e) => {
      if (isFormatting) return; // Prevent infinite loop
      isFormatting = true;
      
      // Get cursor position before formatting
      const cursorPos = e.target.selectionStart;
      const oldValue = e.target.value;
      
      // Extract only alphanumeric characters, keeping CNST prefix
      let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
      
      // Remove CNST prefix if user typed it
      if (value.startsWith('CNST')) {
        value = value.substring(4);
      }
      
      // Limit to 12 characters
      if (value.length > 12) value = value.substring(0, 12);
      
      // Format as CNST-XXXX-XXXX-XXXX
      let formatted = 'CNST-';
      if (value.length > 0) formatted += value.substring(0, 4);
      if (value.length > 4) formatted += '-' + value.substring(4, 8);
      if (value.length > 8) formatted += '-' + value.substring(8, 12);
      
      e.target.value = formatted;
      
      // Restore cursor position (adjust for added dashes)
      const dashesBeforeCursor = (oldValue.substring(0, cursorPos).match(/-/g) || []).length;
      const dashesInNew = (formatted.substring(0, cursorPos).match(/-/g) || []).length;
      const newCursorPos = cursorPos + (dashesInNew - dashesBeforeCursor);
      e.target.setSelectionRange(newCursorPos, newCursorPos);
      
      isFormatting = false;
    });
    
    verifyBtn.addEventListener('click', async () => {
      const inputID = input.value.trim();
      errorDiv.style.display = 'none';
      
      if (!inputID || inputID === 'CNST-') {
        errorDiv.textContent = 'Please enter a Consent ID';
        errorDiv.style.display = 'block';
        return;
      }
      
      verifyBtn.innerHTML = '<span style="display:flex;align-items:center;justify-content:center;gap:6px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="white" stroke-width="2" fill="none"/><path d="M12 6v6l4 2" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>Verifying...</span>';
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
        verifyBtn.innerHTML = '<span style="display:flex;align-items:center;justify-content:center;gap:6px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 13l4 4L19 7" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Verify & Load</span>';
        verifyBtn.disabled = false;
      }
    });
    
    startFreshBtn.addEventListener('click', () => {
      modal.remove();
      // Generate new Consent ID
      consentID = getConsentID();
      
      // IMPORTANT: Reset activities to original config before applying rules
      // This ensures we start with unfiltered activities
      if (config && config.activities && Array.isArray(config.activities)) {
        // Deep clone activities to avoid reference issues
        activities = JSON.parse(JSON.stringify(config.activities));
        console.log('[Consently DPDPA] Reset activities to original config:', activities.length);
      }
      
      // IMPORTANT: Re-evaluate display rules and apply matched rule before showing widget
      // This ensures that only the configured purposes/activities are shown
      const matchedRule = evaluateDisplayRules();
      
      if (matchedRule && matchedRule.trigger_type === 'onPageLoad') {
        // Apply rule to filter activities and purposes
        applyRule(matchedRule);
        // Track rule match for analytics
        trackRuleMatch(matchedRule);
        // Show widget with filtered content
        setTimeout(() => {
          showConsentWidget();
        }, matchedRule.trigger_delay || 0);
      } else {
        // No rule matched or non-onPageLoad trigger, show widget normally
        showConsentWidget();
      }
    });
  }

  // Show Consent Success Modal with ID Display (Compact Version - No Backdrop)
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
        
        <!-- Compact Consent ID Card -->
        <div style="background:linear-gradient(135deg, #4F76F6 0%, #3B5BDB 100%);border-radius:12px;padding:20px;margin-bottom:16px;box-shadow:0 8px 20px rgba(79,118,246,0.25);">
          <label style="display:block;color:rgba(255,255,255,0.9);font-size:11px;font-weight:600;margin-bottom:10px;text-transform:uppercase;letter-spacing:1.2px;">Your Consent ID</label>
          
          <div style="background:white;border-radius:10px;padding:14px;margin-bottom:14px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
            <div id="consent-id-display" style="font-size:18px;font-weight:700;color:#1e293b;font-family:ui-monospace,monospace;letter-spacing:2px;word-break:break-all;">
              ${consentID}
            </div>
          </div>
          
          <div style="display:flex;gap:8px;justify-content:center;">
            <button 
              onclick="window.copyConsentID('${consentID}')"
              style="flex:1;padding:10px 16px;background:rgba(255,255,255,0.25);border:2px solid rgba(255,255,255,0.8);color:white;border-radius:8px;font-weight:600;cursor:pointer;font-size:13px;backdrop-filter:blur(10px);transition:all 0.2s;display:flex;align-items:center;justify-content:center;gap:6px;"
              onmouseover="this.style.background='rgba(255,255,255,0.35)'"
              onmouseout="this.style.background='rgba(255,255,255,0.25)'"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Copy ID
            </button>
            <button 
              onclick="window.downloadConsentReceipt('${consentID}')"
              style="flex:1;padding:10px 16px;background:rgba(255,255,255,0.25);border:2px solid rgba(255,255,255,0.8);color:white;border-radius:8px;font-weight:600;cursor:pointer;font-size:13px;backdrop-filter:blur(10px);transition:all 0.2s;display:flex;align-items:center;justify-content:center;gap:6px;"
              onmouseover="this.style.background='rgba(255,255,255,0.35)'"
              onmouseout="this.style.background='rgba(255,255,255,0.25)'"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Download
            </button>
          </div>
        </div>
        
        <!-- Compact Notice -->
        <div style="background:#fef3c7;border-left:3px solid #f59e0b;padding:12px;border-radius:8px;margin-bottom:16px;text-align:left;">
          <p style="color:#78350f;font-size:12px;margin:0;line-height:1.5;">
            <strong style="color:#92400e;">Keep this ID safe!</strong> Use it to manage your preferences across devices.
          </p>
        </div>
        
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
  window.copyConsentID = function(id) {
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

  // Download consent receipt
  window.downloadConsentReceipt = function(consentID) {
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
          foundByPrincipalId: data.consent.foundByPrincipalId || false
        };
        
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
            expiresAt: apiConsent.expiresAt
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
      } else if (matchedRule.trigger_type === 'onFormSubmit' && matchedRule.element_selector) {
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
    // 2. No rule matched and autoShow is enabled
    if (matchedRule && matchedRule.trigger_type === 'onPageLoad') {
      // Rule matched, show widget with rule-specific content
      showNoticeForRule(matchedRule);
    } else if (!matchedRule && config.autoShow) {
      // No rule matched, use default behavior - show ALL activities
      const currentPath = window.location.pathname || '/';
      console.warn('[Consently DPDPA] ⚠️ No display rule matched for current page:', currentPath);
      console.warn('[Consently DPDPA] ⚠️ Showing ALL activities from widget configuration:', activities.length);
      console.warn('[Consently DPDPA] ⚠️ To show only specific activities for this page, create a display rule with:');
      console.warn('[Consently DPDPA] ⚠️   - url_pattern matching this page (e.g., "/contact")');
      console.warn('[Consently DPDPA] ⚠️   - activities array with only the activities you want to show');
      setTimeout(() => {
        showConsentWidget();
      }, config.showAfterDelay || 1000);
      }
    } else {
      // New user - show verification screen first
      showVerificationScreen();
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
  async function showConsentWidget() {
    if (document.getElementById('consently-dpdpa-widget')) {
      return; // Already shown
    }
    
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
    const noticeHTML = config.privacyNoticeHTML || '<p style="color:#6b7280;">Privacy notice content...</p>';

    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'consently-dpdpa-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      z-index: 999998;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;

    // Create widget container
    const widget = document.createElement('div');
    widget.id = 'consently-dpdpa-widget';
    widget.style.cssText = `
      position: relative;
      background: ${backgroundColor};
      color: ${textColor};
      font-family: ${fontFamily};
      font-size: ${fontSize}px;
      border-radius: ${borderRadius}px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
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
      <div style="padding: 20px 24px; border-bottom: 2px solid #e5e7eb; background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
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
              <h2 style="margin: 0 0 2px 0; font-size: 22px; font-weight: 800; color: ${textColor}; letter-spacing: -0.02em;">${t.privacyNotice}</h2>
              <p style="margin: 0; font-size: 11px; color: #6b7280; font-weight: 500;">${t.dpdpaCompliance}</p>
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

        <!-- Processing Activities Table View - Enhanced Design -->
        <div style="margin-bottom: 20px;">
          <!-- Table Header -->
          <div style="display: grid; grid-template-columns: auto 1fr 1.5fr; gap: 12px; padding: 0 12px 10px 12px; border-bottom: 2px solid #e5e7eb;">
            <div style="width: 20px;"></div>
            <div style="font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">${t.purpose}</div>
            <div style="font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">${t.dataCategories}</div>
          </div>
          
          <!-- Table Body -->
          <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 12px;">
            ${activities.map((activity) => {
              // Extract data categories from new or legacy structure
              let dataCategories = [];
              let purposesList = [];
              
              // Check if new structure with purposes array exists
              if (activity.purposes && Array.isArray(activity.purposes) && activity.purposes.length > 0) {
                // New structure: extract purposes and their data categories
                activity.purposes.forEach(purpose => {
                  purposesList.push(purpose.purposeName || 'Unknown Purpose');
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
              <div class="dpdpa-activity-item" data-activity-id="${activity.id}" style="display: grid; grid-template-columns: auto 1fr 1.5fr; gap: 12px; align-items: start; padding: 12px; border: 2px solid #e5e7eb; border-radius: 10px; background: linear-gradient(to bottom, #ffffff, #fafbfc); transition: all 0.25s ease; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <!-- Checkbox -->
                <label style="display: flex; align-items: center; cursor: pointer; padding-top: 2px;">
                  <input type="checkbox" class="activity-checkbox" data-activity-id="${activity.id}" style="width: 18px; height: 18px; cursor: pointer; accent-color: ${primaryColor}; border-radius: 4px;" />
                </label>
                
                <!-- Purpose Name -->
                <div style="font-size: 14px; font-weight: 600; color: ${textColor}; line-height: 1.3; padding-top: 2px;">
                  ${escapeHtml(activity.activity_name)}
                  ${purposesList.length > 0 ? `<div style="font-size: 11px; font-weight: 400; color: #6b7280; margin-top: 4px;">${purposesList.map(p => escapeHtml(p)).join(', ')}</div>` : ''}
                </div>
                
                <!-- Data Categories -->
                <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                  ${dataCategories.map(attr => `
                    <span style="display: inline-block; font-size: 11px; padding: 5px 10px; background: linear-gradient(to bottom, #f9fafb, #f3f4f6); border: 1px solid #e5e7eb; border-radius: 6px; font-weight: 500; color: ${textColor}; white-space: nowrap;">${escapeHtml(attr)}</span>
                  `).join('')}
                </div>
                
                <input type="hidden" class="activity-consent-status" data-activity-id="${activity.id}" value="">
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
        
        <!-- Footer Links -->
        <div style="padding: 12px; background: #f9fafb; border-radius: 8px; margin-bottom: 16px;">
          <p style="margin: 0 0 8px 0; font-size: 13px; color: #6b7280; line-height: 1.5;">
            ${t.grievanceText.replace('{here}', `<a href="#" id="dpdpa-grievance-link" style="color: ${primaryColor}; text-decoration: underline; font-weight: 500;">${t.here}</a>`).replace('{here2}', `<a href="#" id="dpdpa-dpb-link" style="color: ${primaryColor}; text-decoration: underline; font-weight: 500;">${t.here}</a>`)}
          </p>
        </div>
      </div>

      <!-- Footer Actions - Enhanced Design -->
      <div style="padding: 18px 24px; border-top: 2px solid #e5e7eb; background: linear-gradient(to bottom, #fafbfc, #f3f4f6); display: flex; gap: 12px; align-items: center; justify-content: space-between; box-shadow: 0 -2px 8px rgba(0,0,0,0.05);">
        <button id="dpdpa-download-icon" style="padding: 12px; background: white; border: 2px solid #e5e7eb; border-radius: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.05);" title="${t.downloadButton}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
        </button>
        <div style="flex: 1; display: flex; gap: 10px; min-width: 0;">
          <button id="dpdpa-accept-selected-btn" style="flex: 1; min-width: 0; padding: 13px 20px; background: linear-gradient(to bottom, #f9fafb, #f3f4f6); color: ${textColor}; border: 2px solid #e5e7eb; border-radius: 10px; cursor: pointer; font-size: 14px; font-weight: 700; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.05); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${t.acceptSelected}
          </button>
          <button id="dpdpa-accept-all-btn" style="flex: 1; min-width: 0; padding: 13px 20px; background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%); color: white; border: none; border-radius: 10px; cursor: pointer; font-size: 14px; font-weight: 700; transition: all 0.2s; box-shadow: 0 4px 8px rgba(59,130,246,0.3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${translatedConfig.acceptButtonText}
          </button>
        </div>
      </div>
      
      <!-- Powered by Consently -->
      ${config.showBranding !== false ? `
        <div style="padding: 8px 24px; text-align: center; border-top: 1px solid #e5e7eb; background: #fafbfc;">
          <p style="margin: 0; font-size: 11px; color: #9ca3af;">
            ${t.poweredBy} <a href="https://consently.in" target="_blank" style="color: ${primaryColor}; font-weight: 600; text-decoration: none;">Consently</a>
          </p>
        </div>
      ` : ''}
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

    // Checkboxes for activities with enhanced visual feedback (table view)
    const checkboxes = widget.querySelectorAll('.activity-checkbox');
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', function() {
        const activityId = this.getAttribute('data-activity-id');
        const item = this.closest('.dpdpa-activity-item');
        if (this.checked) {
          setActivityConsent(activityId, 'accepted');
          item.style.borderColor = primaryColor;
          item.style.borderWidth = '2px';
          item.style.background = 'linear-gradient(to bottom, #eff6ff, #dbeafe)';
          item.style.boxShadow = '0 4px 12px rgba(59,130,246,0.25)';
          item.style.borderLeftWidth = '4px';
        } else {
          setActivityConsent(activityId, 'rejected');
          item.style.borderColor = '#e5e7eb';
          item.style.borderWidth = '2px';
          item.style.background = 'linear-gradient(to bottom, #ffffff, #fafbfc)';
          item.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
          item.style.borderLeftWidth = '2px';
        }
      });
    });

    // Download icon button
    const downloadIcon = widget.querySelector('#dpdpa-download-icon');
    if (downloadIcon) {
      downloadIcon.addEventListener('click', () => {
        try {
          const noticeHTML = config.privacyNoticeHTML || '<p>Privacy notice</p>';
          const blob = new Blob([noticeHTML], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `privacy-notice-${new Date().toISOString().split('T')[0]}.html`;
          a.click();
          URL.revokeObjectURL(url);
        } catch (e) {
          console.error('Download failed:', e);
        }
      });
      // Enhanced hover effects
      downloadIcon.addEventListener('mouseenter', () => {
        downloadIcon.style.background = '#f0f9ff';
        downloadIcon.style.borderColor = primaryColor;
        downloadIcon.style.transform = 'translateY(-2px)';
        downloadIcon.style.boxShadow = '0 4px 8px rgba(59,130,246,0.2)';
      });
      downloadIcon.addEventListener('mouseleave', () => {
        downloadIcon.style.background = 'white';
        downloadIcon.style.borderColor = '#e5e7eb';
        downloadIcon.style.transform = 'translateY(0)';
        downloadIcon.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
      });
    }

    // Accept selected button
    const acceptSelectedBtn = widget.querySelector('#dpdpa-accept-selected-btn');
    if (acceptSelectedBtn) {
      acceptSelectedBtn.addEventListener('click', () => {
        handleAcceptSelected(overlay);
      });
      // Enhanced hover effects
      acceptSelectedBtn.addEventListener('mouseenter', () => {
        acceptSelectedBtn.style.background = 'linear-gradient(to bottom, #e5e7eb, #d1d5db)';
        acceptSelectedBtn.style.transform = 'translateY(-1px)';
      });
      acceptSelectedBtn.addEventListener('mouseleave', () => {
        acceptSelectedBtn.style.background = 'linear-gradient(to bottom, #f9fafb, #f3f4f6)';
        acceptSelectedBtn.style.transform = 'translateY(0)';
      });
    }

    // Accept all button
    const acceptAllBtn = widget.querySelector('#dpdpa-accept-all-btn');
    if (acceptAllBtn) {
      acceptAllBtn.addEventListener('click', () => {
        handleAcceptAll(overlay);
      });
      // Enhanced hover effects
      acceptAllBtn.addEventListener('mouseenter', () => {
        acceptAllBtn.style.transform = 'translateY(-2px)';
        acceptAllBtn.style.boxShadow = '0 6px 16px rgba(59,130,246,0.5)';
      });
      acceptAllBtn.addEventListener('mouseleave', () => {
        acceptAllBtn.style.transform = 'translateY(0)';
        acceptAllBtn.style.boxShadow = '0 4px 8px rgba(59,130,246,0.3)';
      });
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
    const activityPurposeConsents = {}; // Track purpose-level consent: { activity_id: [purpose_id_1, purpose_id_2] }

    Object.keys(activityConsents).forEach(activityId => {
      if (activityConsents[activityId].status === 'accepted') {
        acceptedActivities.push(activityId);
        
        // Track purposes for this activity if purposes are filtered
        const activity = activities.find(a => a.id === activityId);
        if (activity && activity.purposes && Array.isArray(activity.purposes)) {
          // Store consented purpose IDs for this activity
          // Use purposeId (the actual purpose UUID) not id (which is activity_purpose join table ID)
          activityPurposeConsents[activityId] = activity.purposes
            .map(p => p.purposeId || p.id) // Fallback to id if purposeId not available
            .filter(id => id); // Remove any undefined/null values
        }
      } else if (activityConsents[activityId].status === 'rejected') {
        rejectedActivities.push(activityId);
      }
    });

    // Determine final status
    let finalStatus = overallStatus;
    if (acceptedActivities.length > 0 && rejectedActivities.length > 0) {
      finalStatus = 'partial';
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
      activityPurposeConsents: Object.keys(activityPurposeConsents).length > 0 ? activityPurposeConsents : undefined, // Track purpose-level consent
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
        expiresAt: result.expiresAt
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

      // Removed showConsentSuccessModal - banner already shows success message
      // showConsentSuccessModal(consentID);

      // Show floating preference centre button
      showFloatingPreferenceButton();

      // Update widget to show success state before hiding
      showSuccessState(overlay, acceptedActivities, rejectedActivities, finalStatus);

      // Offer receipt options after a delay
      setTimeout(() => {
        try { showReceiptOptions(storageData); } catch (e) { /* noop */ }
      }, 2000);

      // Hide widget after showing success state
      setTimeout(() => {
        hideWidget(overlay);
      }, 3000);

      console.log('[Consently DPDPA] Consent saved successfully');
    } catch (error) {
      console.error('[Consently DPDPA] Failed to save consent:', error);
      alert('Failed to save your consent preferences. Please try again.');
    }
  }

  // Show success state in widget after consent
  function showSuccessState(overlay, acceptedActivities, rejectedActivities, status) {
    const widget = overlay.querySelector('#consently-dpdpa-widget');
    if (!widget) return;

    const theme = config.theme || {};
    const primaryColor = theme.primaryColor || '#3b82f6';
    const backgroundColor = theme.backgroundColor || '#ffffff';
    const textColor = theme.textColor || '#1f2937';
    const borderRadius = theme.borderRadius || 12;

    // Get activity names
    const acceptedNames = acceptedActivities.map(id => {
      const activity = activities.find(a => a.id === id);
      return activity ? activity.activity_name : id;
    }).filter(Boolean);

    const rejectedNames = rejectedActivities.map(id => {
      const activity = activities.find(a => a.id === id);
      return activity ? activity.activity_name : id;
    }).filter(Boolean);

    // Create success message with better UI
    let statusText = '';
    let statusSubtext = '';
    if (status === 'accepted') {
      statusText = 'All Preferences Accepted';
      statusSubtext = 'Your consent has been recorded for all activities';
    } else if (status === 'partial') {
      statusText = 'Preferences Saved Successfully';
      statusSubtext = 'Your privacy choices have been saved and applied';
    } else {
      statusText = 'Preferences Saved Successfully';
      statusSubtext = 'Your privacy choices have been saved and applied';
    }

    // Update widget content with modern success state
    widget.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
    widget.innerHTML = `
      <div style="padding: 40px 32px; text-align: center; font-family: ${theme.fontFamily || 'system-ui, sans-serif'}; position: relative; overflow: hidden;">
        <!-- Animated background gradient -->
        <div style="position: absolute; top: 0; right: 0; width: 200px; height: 200px; background: radial-gradient(circle, ${primaryColor}15 0%, transparent 70%); border-radius: 50%; transform: translate(30%, -30%);"></div>
        <div style="position: absolute; bottom: 0; left: 0; width: 150px; height: 150px; background: radial-gradient(circle, ${primaryColor}10 0%, transparent 70%); border-radius: 50%; transform: translate(-30%, 30%);"></div>
        
        <div style="position: relative; z-index: 1;">
          <!-- Modern icon with gradient -->
          <div style="width: 80px; height: 80px; margin: 0 auto 24px; background: linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd); border-radius: 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 30px ${primaryColor}40, 0 0 0 8px ${primaryColor}15; animation: successPulse 0.6s ease-out;">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="animation: checkmark 0.5s ease-out 0.2s both;">
              <path d="M20 6L9 17l-5-5"></path>
            </svg>
          </div>
          
          <!-- Success badge -->
          <div style="display: inline-flex; align-items: center; gap: 6px; background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 16px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M20 6L9 17l-5-5"></path>
            </svg>
            Saved
          </div>
          
          <h2 style="margin: 0 0 10px; font-size: 28px; font-weight: 700; color: ${textColor}; letter-spacing: -0.5px;">
            ${statusText}
          </h2>
          <p style="margin: 0 0 32px; font-size: 15px; color: ${textColor}aa; line-height: 1.6; max-width: 400px; margin-left: auto; margin-right: auto;">
            ${statusSubtext}
          </p>
          
          ${acceptedNames.length > 0 ? `
          <div style="background: linear-gradient(135deg, ${primaryColor}12, ${primaryColor}08); border: 2px solid ${primaryColor}30; border-radius: 16px; padding: 20px; margin-bottom: 16px; text-align: left; backdrop-filter: blur(10px);">
            <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; color: ${primaryColor}; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 12px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${primaryColor}" stroke-width="2.5">
                <path d="M20 6L9 17l-5-5"></path>
              </svg>
              Accepted (${acceptedNames.length})
            </div>
            <div style="font-size: 14px; color: ${textColor}; line-height: 1.8; font-weight: 500;">
              ${acceptedNames.map(name => `<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;"><span style="width: 6px; height: 6px; border-radius: 50%; background: ${primaryColor};"></span>${name}</div>`).join('')}
            </div>
          </div>
          ` : ''}
          ${rejectedNames.length > 0 ? `
          <div style="background: linear-gradient(135deg, #f3f4f612, #f3f4f608); border: 2px solid #9ca3af30; border-radius: 16px; padding: 20px; text-align: left; backdrop-filter: blur(10px);">
            <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 12px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2.5">
                <path d="M18 6L6 18M6 6l12 12"></path>
              </svg>
              Rejected (${rejectedNames.length})
            </div>
            <div style="font-size: 14px; color: ${textColor}aa; line-height: 1.8; font-weight: 500;">
              ${rejectedNames.map(name => `<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;"><span style="width: 6px; height: 6px; border-radius: 50%; background: #9ca3af;"></span>${name}</div>`).join('')}
            </div>
          </div>
          ` : ''}
        </div>
      </div>
      <style>
        @keyframes successPulse {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes checkmark {
          0% { stroke-dasharray: 0 24; stroke-dashoffset: 24; opacity: 0; }
          100% { stroke-dasharray: 24 0; stroke-dashoffset: 0; opacity: 1; }
        }
      </style>
    `;
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
      privacyCentreUrl: `${window.location.origin}/privacy-centre/${widgetId}?visitorId=${visitorId}`,
      ...consent
    };
    const blob = new Blob([JSON.stringify(receiptData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dpdpa-consent-${widgetId}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function openPrivacyCentre() {
    const visitorId = consentID || getConsentID();
    const scriptSrc = currentScript.src;
    let baseUrl;
    
    if (scriptSrc && scriptSrc.includes('http')) {
      const url = new URL(scriptSrc);
      baseUrl = url.origin;
    } else {
      baseUrl = window.location.origin;
    }
    
    const privacyCentreUrl = `${baseUrl}/privacy-centre/${widgetId}?visitorId=${visitorId}`;
    window.open(privacyCentreUrl, '_blank');
  }

  // Show floating button for preference centre access
  function showFloatingPreferenceButton() {
    // Don't create multiple buttons
    if (document.getElementById('dpdpa-float-btn')) {
      return;
    }

    // Check if cookie widget button exists - if so, add DPDPA option to that menu instead
    const cookieWidgetBtn = document.getElementById('consently-float-btn');
    if (cookieWidgetBtn) {
      // Add DPDPA option to existing cookie widget menu
      addDPDPAToCookieMenu(cookieWidgetBtn);
      return;
    }

    // If cookie widget doesn't exist, create our own button on the right side
    const visitorId = consentID || getConsentID();
    const button = document.createElement('div');
    button.id = 'dpdpa-float-btn';
    button.innerHTML = `
      <style>
        #dpdpa-float-btn {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 9998;
          cursor: pointer;
        }
        .dpdpa-float-trigger {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px;
          background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
          border: none;
          border-radius: 50%;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
          transition: all 0.3s;
          width: 48px;
          height: 48px;
          color: white;
        }
        .dpdpa-float-trigger:hover {
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.6);
          transform: translateY(-2px) scale(1.05);
        }
        .dpdpa-float-tooltip {
          position: absolute;
          bottom: 100%;
          right: 0;
          margin-bottom: 12px;
          background: #1f2937;
          color: white;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 12px;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .dpdpa-float-tooltip::after {
          content: '';
          position: absolute;
          top: 100%;
          right: 12px;
          border: 6px solid transparent;
          border-top-color: #1f2937;
        }
        #dpdpa-float-btn:hover .dpdpa-float-tooltip {
          opacity: 1;
        }
      </style>
      <div class="dpdpa-float-trigger" title="Manage Your Privacy Preferences">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"/>
        </svg>
        <div class="dpdpa-float-tooltip">Manage Preferences</div>
      </div>
    `;
    
    document.body.appendChild(button);
    
    button.querySelector('.dpdpa-float-trigger').addEventListener('click', () => {
      openPrivacyCentre();
    });
  }

  // Add DPDPA option to existing cookie widget menu
  function addDPDPAToCookieMenu(cookieWidgetBtn) {
    const menu = cookieWidgetBtn.querySelector('#consently-float-menu');
    if (!menu) return;

    // Check if DPDPA option already exists
    if (menu.querySelector('#consently-dpdpa-prefs-btn')) return;

    // Find the section label or create one
    let sectionLabel = menu.querySelector('.section-label');
    if (!sectionLabel || sectionLabel.textContent !== 'DPDPA Preferences') {
      // Add divider and section label
      const divider = document.createElement('div');
      divider.className = 'divider';
      divider.style.cssText = 'height: 1px; background: #e5e7eb; margin: 4px 0;';
      
      const label = document.createElement('div');
      label.className = 'section-label';
      label.style.cssText = 'padding: 8px 16px; font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; background: #f9fafb;';
      label.textContent = 'DPDPA Preferences';
      
      // Find the consent ID section (last child) and insert before it
      const consentIdSection = menu.querySelector('div[style*="padding: 12px 16px"]');
      if (consentIdSection) {
        menu.insertBefore(divider, consentIdSection);
        menu.insertBefore(label, consentIdSection);
      } else {
        menu.appendChild(divider);
        menu.appendChild(label);
      }
    }

    // Add DPDPA preferences button
    const dpdpaBtn = document.createElement('button');
    dpdpaBtn.id = 'consently-dpdpa-prefs-btn';
    dpdpaBtn.style.cssText = 'width: 100%; text-align: left; padding: 12px 16px; border: none; background: white; cursor: pointer; font-size: 14px; color: #374151; transition: background 0.15s; display: flex; align-items: center; gap: 8px;';
    dpdpaBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"/>
      </svg>
      DPDPA Preferences
    `;
    
    dpdpaBtn.addEventListener('mouseenter', function() {
      this.style.background = '#f3f4f6';
    });
    dpdpaBtn.addEventListener('mouseleave', function() {
      this.style.background = 'white';
    });
    
    dpdpaBtn.addEventListener('click', function() {
      menu.classList.remove('show');
      openPrivacyCentre();
    });

    // Insert before consent ID section
    const consentIdSection = menu.querySelector('div[style*="padding: 12px 16px"]');
    if (consentIdSection) {
      menu.insertBefore(dpdpaBtn, consentIdSection);
    } else {
      menu.appendChild(dpdpaBtn);
    }
  }

  // Listen for custom event from cookie widget
  window.addEventListener('consently-open-dpdpa-prefs', function() {
    openPrivacyCentre();
  });

  function openGrievanceForm() {
    // Simple modal form
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1000000;display:flex;align-items:center;justify-content:center;';
    const modal = document.createElement('div');
    modal.style.cssText = 'background:#fff;border-radius:12px;max-width:480px;width:92%;padding:16px;font-family:system-ui,sans-serif;';
    modal.innerHTML = `
      <h3 style="margin:0 0 8px 0;font-size:16px;color:#111827;font-weight:700;">Raise a Grievance</h3>
      <p style="margin:0 0 12px 0;color:#374151;font-size:13px;">Describe your issue or request. We will review it within 72 hours.</p>
      <input id="g-email" type="email" placeholder="Email (optional)" value="${visitorEmail || ''}" style="width:100%;padding:8px;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:8px;font-size:13px;" />
      <textarea id="g-message" rows="4" placeholder="Your message" style="width:100%;padding:8px;border:1px solid #e5e7eb;border-radius:8px;font-size:13px;"></textarea>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px;">
        <button id="g-cancel" style="padding:8px 12px;border:1px solid #e5e7eb;border-radius:8px;background:#fff;cursor:pointer;">Cancel</button>
        <button id="g-submit" style="padding:8px 12px;border:none;border-radius:8px;background:#3b82f6;color:#fff;cursor:pointer;font-weight:600;">Submit</button>
      </div>
    `;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    modal.querySelector('#g-cancel').addEventListener('click', () => document.body.removeChild(overlay));
    modal.querySelector('#g-submit').addEventListener('click', async () => {
      const email = (modal.querySelector('#g-email')).value || null;
      const message = (modal.querySelector('#g-message')).value?.trim();
      if (!message) { alert('Please enter a message.'); return; }
      // Validate email format if provided
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert('Please enter a valid email address.');
        return;
      }
      try {
        const scriptSrc = currentScript.src;
        const apiBase = scriptSrc && scriptSrc.includes('http') ? new URL(scriptSrc).origin : window.location.origin;
        const res = await fetch(`${apiBase}/api/dpdpa/grievances`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ widgetId, email, message })
        });
        if (!res.ok) throw new Error('Failed');
        alert('Your request has been captured and we will take action within 72 hours.');
        document.body.removeChild(overlay);
      } catch (e) {
        alert('Failed to submit. Please try again later.');
      }
    });
  }

  function showReceiptOptions(consent) {
    const visitorId = consentID || getConsentID();
    const bar = document.createElement('div');
    bar.style.cssText = `position:fixed;left:50%;transform:translateX(-50%);bottom:20px;z-index:999999;background:#111827;color:#fff;padding:12px 16px;border-radius:12px;display:flex;flex-direction:column;gap:8px;align-items:center;box-shadow:0 10px 15px -3px rgba(0,0,0,.1),0 4px 6px -4px rgba(0,0,0,.1);font-family:system-ui,sans-serif;font-size:13px;max-width:90%;min-width:300px;`;
    bar.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;width:100%;">
        <span style="opacity:.9;flex:1;">Consent saved.</span>
        <button id="dpdpa-receipt-close" style="background:transparent;border:none;color:#fff;opacity:.7;cursor:pointer;padding:4px;">✕</button>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;width:100%;">
        <button id="dpdpa-download-receipt" style="background:#10b981;border:none;color:#fff;padding:6px 12px;border-radius:6px;cursor:pointer;font-weight:600;font-size:12px;flex:1;min-width:120px;">Download receipt</button>
        <button id="dpdpa-manage-preferences-float" style="background:#3b82f6;border:none;color:#fff;padding:6px 12px;border-radius:6px;cursor:pointer;font-weight:600;font-size:12px;flex:1;min-width:120px;">Manage Preferences</button>
        ${visitorEmail ? `<button id="dpdpa-email-receipt" style="background:#6366f1;border:none;color:#fff;padding:6px 12px;border-radius:6px;cursor:pointer;font-weight:600;font-size:12px;flex:1;min-width:120px;">Email receipt</button>` : ''}
      </div>
      <div style="width:100%;padding:8px;background:rgba(255,255,255,0.1);border-radius:6px;margin-top:4px;">
        <div style="font-size:11px;opacity:0.8;margin-bottom:4px;">Your Visitor ID (save this for future access):</div>
        <div style="font-family:monospace;font-size:11px;word-break:break-all;user-select:all;cursor:text;background:rgba(0,0,0,0.2);padding:6px;border-radius:4px;">${visitorId}</div>
      </div>
    `;
    document.body.appendChild(bar);
    bar.querySelector('#dpdpa-download-receipt').addEventListener('click', () => {
      downloadConsentReceipt(consent);
    });
    bar.querySelector('#dpdpa-manage-preferences-float').addEventListener('click', () => {
      openPrivacyCentre();
      document.body.removeChild(bar);
    });
    const emailBtn = bar.querySelector('#dpdpa-email-receipt');
    if (emailBtn) {
      emailBtn.addEventListener('click', () => {
        const body = encodeURIComponent(JSON.stringify({ widgetId, visitorId, ...consent }, null, 2));
        window.location.href = `mailto:${visitorEmail}?subject=Your DPDPA Consent Receipt&body=${body}`;
      });
    }
    bar.querySelector('#dpdpa-receipt-close').addEventListener('click', () => {
      document.body.removeChild(bar);
    });
    setTimeout(() => {
      if (document.body.contains(bar)) document.body.removeChild(bar);
    }, 15000);
  }

  // Public API
  window.consentlyDPDPA = window.consentlyDPDPA || {};
  window.consentlyDPDPA[widgetId] = {
    show: function() {
      showConsentWidget();
    },
    
    getConsent: function() {
      return ConsentStorage.get(`consently_dpdpa_consent_${widgetId}`);
    },
    
    clearConsent: function() {
      ConsentStorage.delete(`consently_dpdpa_consent_${widgetId}`);
      console.log('[Consently DPDPA] Consent cleared');
    },
    
    withdraw: function() {
      this.clearConsent();
      this.show();
    },
    
    getConsentID: function() {
      return consentID || getConsentID();
    },
    
    verifyConsentID: async function(id) {
      return await verifyConsentID(id);
    },
    
    showVerificationScreen: function() {
      showVerificationScreen();
    },
    
    downloadReceipt: function() {
      const consent = this.getConsent();
      if (consent) downloadConsentReceipt(consent);
    },
    
    openPrivacyCentre: function() {
      openPrivacyCentre();
    }
  };

  // Also expose a global function for backward compatibility
  window.ConsentlyDPDPA = {
    openPrivacyCentre: openPrivacyCentre
  };

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

