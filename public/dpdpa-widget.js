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
    dataAttributes: 'Data Attributes',
    retentionPeriod: 'Retention Period',
    yourDataRights: 'Your Data Rights',
    dataRightsText: 'Under DPDPA 2023, you have the right to access, correct, and delete your personal data. You can also withdraw your consent at any time.',
    withdrawConsent: 'Withdraw/Modify Consent',
    raiseGrievance: 'Raise Grievance',
    privacyNotice: 'Privacy Notice'
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
    if (targetLang === 'en') return texts;
    
    // Check cache first
    const uncachedTexts = [];
    const uncachedIndices = [];
    const result = [...texts];
    
    texts.forEach((text, idx) => {
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
    
    // Batch translate uncached texts
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: uncachedTexts.join('\n||SEPARATOR||\n'),
          target: targetLang,
          source: 'en'
        })
      });

      if (response.ok) {
        const data = await response.json();
        const translatedBatch = data.translatedText.split('\n||SEPARATOR||\n');
        
        uncachedIndices.forEach((idx, i) => {
          const translated = translatedBatch[i] || texts[idx];
          result[idx] = translated;
          // Cache it
          const cacheKey = `${targetLang}:${texts[idx]}`;
          translationCache[cacheKey] = translated;
        });
      }
    } catch (error) {
      console.error('[Consently] Batch translation error:', error);
      // Fallback to original texts for uncached items
      uncachedIndices.forEach((idx, i) => {
        result[idx] = uncachedTexts[i];
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
  let visitorEmail = (currentScript && currentScript.getAttribute('data-dpdpa-email')) || null;

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

  // Generate or retrieve persistent visitor ID
  function getVisitorId() {
    let visitorId = ConsentStorage.get('consently_dpdpa_visitor_id');
    if (!visitorId) {
      visitorId = 'vis_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 15);
      ConsentStorage.set('consently_dpdpa_visitor_id', visitorId, 365 * 10); // 10 years
    }
    return visitorId;
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
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      config = data;
      activities = data.activities || [];
      
      console.log('[Consently DPDPA] Configuration loaded:', config.name);
      return true;
    } catch (error) {
      console.error('[Consently DPDPA] Failed to load configuration:', error);
      return false;
    }
  }

  // Record consent to API
  async function recordConsent(consentData) {
    try {
      const scriptSrc = currentScript.src;
      let apiBase;
      
      if (scriptSrc && scriptSrc.includes('http')) {
        const url = new URL(scriptSrc);
        apiBase = url.origin;
      } else {
        apiBase = window.location.origin;
      }
      
      const apiUrl = `${apiBase}/api/dpdpa/consent-record`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(consentData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to record consent');
      }
      
      const result = await response.json();
      console.log('[Consently DPDPA] Consent recorded successfully');
      return result;
    } catch (error) {
      console.error('[Consently DPDPA] Failed to record consent:', error);
      throw error;
    }
  }

  // Initialize widget
  async function init() {
    const success = await fetchWidgetConfig();
    if (!success) {
      console.error('[Consently DPDPA] Failed to initialize widget');
      return;
    }

    // Check for existing consent
    const existingConsent = ConsentStorage.get(`consently_dpdpa_consent_${widgetId}`);
    
    // Check DNT
    if (config.respectDNT && navigator.doNotTrack === '1') {
      console.log('[Consently DPDPA] DNT enabled, respecting user preference');
      return;
    }

    // If consent exists and is valid, apply it
    if (existingConsent && existingConsent.timestamp) {
      console.log('[Consently DPDPA] Valid consent found');
      applyConsent(existingConsent);
      return;
    }

    // Show widget
    if (config.autoShow) {
      setTimeout(() => {
        showConsentWidget();
      }, config.showAfterDelay || 1000);
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
    // Prefetch top 3 languages (excluding English which is already cached)
    const languagesToPrefetch = supportedLanguages.filter(lang => lang !== 'en').slice(0, 3);
    
    // Prefetch in background without blocking
    languagesToPrefetch.forEach(lang => {
      getTranslation(lang).catch(err => {
        console.log(`[Consently] Could not prefetch ${lang} translations:`, err);
      });
    });
  }

  // Create and show consent widget
  async function showConsentWidget() {
    if (document.getElementById('consently-dpdpa-widget')) {
      return; // Already shown
    }

    const theme = config.theme || {};
    // Use the trustworthy blue color from consently theme
    const primaryColor = theme.primaryColor || '#4c8bf5'; // hsl(217 91% 60%) converted to hex
    const backgroundColor = theme.backgroundColor || '#ffffff';
    const textColor = theme.textColor || '#1f2937';
    const borderRadius = theme.borderRadius || 12;
    const fontFamily = theme.fontFamily || 'system-ui, sans-serif';
    const fontSize = theme.fontSize || 14;

    // Track requirements
    let readComplete = false;
    let downloadComplete = false;
    let selectedLanguage = 'en'; // Start with English
    let t = await getTranslation(selectedLanguage); // Current translations
    
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
      <div style="padding: 20px 24px; border-bottom: 1px solid #e5e7eb; background: linear-gradient(to bottom, #ffffff, #f8fafc);">
        <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 12px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            ${config.theme.logoUrl ? `
              <img src="${escapeHtml(config.theme.logoUrl)}" alt="Logo" style="height: 32px; width: auto; object-fit: contain;" />
            ` : `
              <div style="width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 8px; background: ${primaryColor}; color: white; font-weight: 700; font-size: 16px;">
                C
              </div>
            `}
            <div>
              <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: ${textColor}; letter-spacing: -0.01em;">NOTICE</h2>
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
            <button id="dpdpa-close-btn" style="background: none; border: none; cursor: pointer; padding: 6px; opacity: 0.5; transition: opacity 0.2s; border-radius: 6px;" aria-label="Close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

      </div>
      
      <!-- Main Content Section -->
      <div style="padding: 20px 24px; overflow-y: auto; flex: 1;">
        <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
          We process your personal data only when necessary to provide our banking services. By clicking on the 'Accept all' button below, you consent to process your personal data for the following purposes:
        </p>

        <!-- Processing Activities List -->
        <div style="display: flex; flex-direction: column; gap: 16px; margin-bottom: 20px;">
          ${activities.map((activity) => `
            <div class="dpdpa-activity-item" data-activity-id="${activity.id}" style="border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; background: white; transition: all 0.2s;">
              <div style="display: flex; align-items: start; gap: 12px;">
                <!-- Checkbox -->
                <label style="display: flex; align-items: center; cursor: pointer; padding-top: 2px;">
                  <input type="checkbox" class="activity-checkbox" data-activity-id="${activity.id}" style="width: 18px; height: 18px; cursor: pointer; accent-color: ${primaryColor};" />
                </label>
                
                <!-- Activity Details -->
                <div style="flex: 1;">
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                    <h4 style="font-size: 15px; font-weight: 600; margin: 0; color: ${textColor};">${escapeHtml(activity.activity_name)}</h4>
                  </div>
                  
                  <!-- Data Categories Section -->
                  <div style="margin-bottom: 10px;">
                    <div style="font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.02em;">Data Categories</div>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; font-size: 13px; color: ${textColor};">
                      ${activity.data_attributes.slice(0, 6).map(attr => `
                        <div style="padding: 6px 10px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px;">${escapeHtml(attr)}</div>
                      `).join('')}
                      ${activity.data_attributes.length > 6 ? `<div style="padding: 6px 10px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; font-weight: 500;">+${activity.data_attributes.length - 6} more</div>` : ''}
                    </div>
                  </div>
                </div>
              </div>
              <input type="hidden" class="activity-consent-status" data-activity-id="${activity.id}" value="">
            </div>
          `).join('')}
        </div>

        <!-- Manage Preferences Button -->
        <div style="padding: 12px; background: #f9fafb; border-radius: 8px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between;">
          <p style="margin: 0; font-size: 13px; color: #6b7280; line-height: 1.5;">
            You can manage your consent preferences anytime.
          </p>
          <button id="dpdpa-manage-preferences" style="padding: 8px 16px; background: white; color: ${primaryColor}; border: 1px solid ${primaryColor}; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.2s; white-space: nowrap;">
            Manage Preferences
          </button>
        </div>
        
        <!-- Footer Links -->
        <div style="padding: 12px; background: #f9fafb; border-radius: 8px; margin-bottom: 16px;">
          <p style="margin: 0 0 8px 0; font-size: 13px; color: #6b7280; line-height: 1.5;">
            If you have any grievances with how we process your personal data click <a href="#" id="dpdpa-grievance-link" style="color: ${primaryColor}; text-decoration: underline; font-weight: 500;">here</a>. If we are unable to resolve your grievance, you can also make a complaint to the Data Protection Board by clicking <a href="#" id="dpdpa-dpb-link" style="color: ${primaryColor}; text-decoration: underline; font-weight: 500;">here</a>.
          </p>
        </div>
      </div>

      <!-- Footer Actions -->
      <div style="padding: 16px 24px; border-top: 1px solid #e5e7eb; background: #fafbfc; display: flex; gap: 10px; align-items: center; justify-content: space-between;">
        <button id="dpdpa-download-icon" style="padding: 10px; background: white; border: 1px solid #e5e7eb; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;" title="Download Privacy Notice">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
        </button>
        <div style="flex: 1; display: flex; gap: 10px;">
          <button id="dpdpa-accept-selected-btn" style="flex: 1; padding: 12px 20px; background: #f3f4f6; color: ${textColor}; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; transition: all 0.2s;">
            Accept selected
          </button>
          <button id="dpdpa-accept-all-btn" style="flex: 1; padding: 12px 20px; background: ${primaryColor}; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; transition: all 0.2s; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
            Accept all
          </button>
          <button id="dpdpa-cancel-btn" style="flex: 1; padding: 12px 20px; background: white; color: ${textColor}; border: 1px solid #e5e7eb; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; transition: all 0.2s;">
            Cancel
          </button>
        </div>
      </div>
      
      <!-- Powered by Consently -->
      ${config.showBranding !== false ? `
        <div style="padding: 8px 24px; text-align: center; border-top: 1px solid #e5e7eb; background: #fafbfc;">
          <p style="margin: 0; font-size: 11px; color: #9ca3af;">
            Powered by <a href="https://consently.in" target="_blank" style="color: ${primaryColor}; font-weight: 600; text-decoration: none;">Consently</a>
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

    // Store reference to global click handler to cleanup later
    let globalClickHandler = null;

    // Attach event listeners
    attachEventListeners(overlay, widget);

    // Function to rebuild widget content with new language
    async function rebuildWidget() {
      // Show loading spinner overlay instead of fading entire widget
      const loadingOverlay = document.createElement('div');
      loadingOverlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(2px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        border-radius: ${borderRadius}px;
      `;
      loadingOverlay.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
          <div style="width: 32px; height: 32px; border: 3px solid ${primaryColor}30; border-top-color: ${primaryColor}; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
          <span style="font-size: 13px; color: ${textColor}; font-weight: 500; opacity: 0.8;">Loading translation...</span>
        </div>
        <style>
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        </style>
      `;
      widget.appendChild(loadingOverlay);
      
      // Remove old global click handler before rebuilding
      if (globalClickHandler) {
        document.removeEventListener('click', globalClickHandler);
        globalClickHandler = null;
      }
      
      // Fetch translations asynchronously
      t = await getTranslation(selectedLanguage);
      
      // Quick fade transition
      loadingOverlay.style.transition = 'opacity 0.15s ease';
      loadingOverlay.style.opacity = '0';
      
      setTimeout(() => {
        widget.innerHTML = buildWidgetHTML();
        // Re-attach all event listeners
        attachEventListeners(overlay, widget);
        // Re-setup gated interactions
        setupGatedInteractions();
      }, 150);
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
    // Close button
    const closeBtn = widget.querySelector('#dpdpa-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        hideWidget(overlay);
      });
    }

    // Checkboxes for activities
    const checkboxes = widget.querySelectorAll('.activity-checkbox');
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', function() {
        const activityId = this.getAttribute('data-activity-id');
        const item = this.closest('.dpdpa-activity-item');
        if (this.checked) {
          setActivityConsent(activityId, 'accepted');
          item.style.borderColor = primaryColor;
          item.style.background = `${primaryColor}08`;
        } else {
          setActivityConsent(activityId, 'rejected');
          item.style.borderColor = '#e5e7eb';
          item.style.background = 'white';
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
    }

    // Accept selected button
    const acceptSelectedBtn = widget.querySelector('#dpdpa-accept-selected-btn');
    if (acceptSelectedBtn) {
      acceptSelectedBtn.addEventListener('click', () => {
        handleAcceptSelected(overlay);
      });
    }

    // Accept all button
    const acceptAllBtn = widget.querySelector('#dpdpa-accept-all-btn');
    if (acceptAllBtn) {
      acceptAllBtn.addEventListener('click', () => {
        handleAcceptAll(overlay);
      });
    }

    // Cancel button
    const cancelBtn = widget.querySelector('#dpdpa-cancel-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        hideWidget(overlay);
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

    // Manage Preferences button
    const managePrefsBtn = widget.querySelector('#dpdpa-manage-preferences');
    if (managePrefsBtn) {
      // Hover effects
      managePrefsBtn.addEventListener('mouseenter', () => {
        managePrefsBtn.style.background = primaryColor;
        managePrefsBtn.style.color = 'white';
      });
      managePrefsBtn.addEventListener('mouseleave', () => {
        managePrefsBtn.style.background = 'white';
        managePrefsBtn.style.color = primaryColor;
      });
      
      managePrefsBtn.addEventListener('click', () => {
        openPrivacyCentre();
      });
    }

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        hideWidget(overlay);
      }
    });
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
    const acceptedActivities = [];
    const rejectedActivities = [];

    Object.keys(activityConsents).forEach(activityId => {
      if (activityConsents[activityId].status === 'accepted') {
        acceptedActivities.push(activityId);
      } else if (activityConsents[activityId].status === 'rejected') {
        rejectedActivities.push(activityId);
      }
    });

    // Determine final status
    let finalStatus = overallStatus;
    if (acceptedActivities.length > 0 && rejectedActivities.length > 0) {
      finalStatus = 'partial';
    }

    const consentData = {
      widgetId: widgetId,
      visitorId: getVisitorId(),
      visitorEmail: visitorEmail || undefined,
      consentStatus: finalStatus,
      acceptedActivities: acceptedActivities,
      rejectedActivities: rejectedActivities,
      activityConsents: activityConsents,
      metadata: {
        language: navigator.language || 'en',
        referrer: document.referrer || null
      },
      consentDuration: config.consentDuration || 365
    };

    try {
      const result = await recordConsent(consentData);
      
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

      // Offer receipt options
      try { showReceiptOptions(storageData); } catch (e) { /* noop */ }

      // Hide widget
      hideWidget(overlay);

      console.log('[Consently DPDPA] Consent saved successfully');
    } catch (error) {
      console.error('[Consently DPDPA] Failed to save consent:', error);
      alert('Failed to save your consent preferences. Please try again.');
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
    const blob = new Blob([JSON.stringify({ widgetId, ...consent }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dpdpa-consent-${widgetId}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function openPrivacyCentre() {
    const visitorId = getVisitorId();
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
    const bar = document.createElement('div');
    bar.style.cssText = `position:fixed;left:50%;transform:translateX(-50%);bottom:20px;z-index:999999;background:#111827;color:#fff;padding:10px 14px;border-radius:9999px;display:flex;gap:8px;align-items:center;box-shadow:0 10px 15px -3px rgba(0,0,0,.1),0 4px 6px -4px rgba(0,0,0,.1);font-family:system-ui,sans-serif;font-size:13px;`;
    bar.innerHTML = `
      <span style="opacity:.9">Consent saved.</span>
      <button id="dpdpa-download-receipt" style="background:#10b981;border:none;color:#fff;padding:6px 10px;border-radius:9999px;cursor:pointer;font-weight:600;">Download receipt</button>
      ${visitorEmail ? `<button id="dpdpa-email-receipt" style="background:#3b82f6;border:none;color:#fff;padding:6px 10px;border-radius:9999px;cursor:pointer;font-weight:600;">Email me a copy</button>` : ''}
      <button id="dpdpa-receipt-close" style="background:transparent;border:none;color:#fff;opacity:.7;margin-left:4px;cursor:pointer;">✕</button>
    `;
    document.body.appendChild(bar);
    bar.querySelector('#dpdpa-download-receipt').addEventListener('click', () => {
      downloadConsentReceipt(consent);
    });
    const emailBtn = bar.querySelector('#dpdpa-email-receipt');
    if (emailBtn) {
      emailBtn.addEventListener('click', () => {
        const body = encodeURIComponent(JSON.stringify({ widgetId, ...consent }, null, 2));
        window.location.href = `mailto:${visitorEmail}?subject=Your DPDPA Consent Receipt&body=${body}`;
      });
    }
    bar.querySelector('#dpdpa-receipt-close').addEventListener('click', () => {
      document.body.removeChild(bar);
    });
    setTimeout(() => {
      if (document.body.contains(bar)) document.body.removeChild(bar);
    }, 10000);
  }

  // Public API
  window.consentlyDPDPA = {
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
    
    setUserEmail: function(email) {
      visitorEmail = email || null;
    },
    
    downloadReceipt: function() {
      const consent = this.getConsent();
      if (consent) downloadConsentReceipt(consent);
    }
  };

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
