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
      return true;
    } catch (error) {
      console.error('[Consently DPDPA] Failed to load configuration:', error);
      return false;
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
      
      // If no valid activities after filtering, fall back to showing all activities
      if (filteredActivities.length === 0) {
        console.warn('[Consently DPDPA] No valid activities matched rule filter. Showing all activities as fallback.');
        console.warn('[Consently DPDPA] Rule activity IDs:', rule.activities);
        console.warn('[Consently DPDPA] Widget activity IDs:', availableActivityIds);
        // Keep original activities (don't filter)
      } else {
        // Update global activities array (used by widget)
        activities.length = 0;
        activities.push(...filteredActivities);
        
        // Update config activities (if used elsewhere)
        if (config.activities) {
          config.activities = filteredActivities;
        }
        
        // Also update the rule's activities array to only include valid IDs
        // This ensures activity_purposes filtering works correctly
        rule.activities = validRuleActivityIds;
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
            activity.purposes = activity.purposes.filter(purpose => 
              allowedPurposeIds.includes(purpose.id)
            );
            console.log('[Consently DPDPA] Filtered purposes for activity:', activity.id, 'from', originalPurposeCount, 'to', activity.purposes.length);
            
            // Warn if filtering results in no purposes
            if (activity.purposes.length === 0) {
              console.warn('[Consently DPDPA] Warning: Activity', activity.id, 'has no purposes after filtering!');
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

  // Record consent to API (with enhanced error handling and validation)
  async function recordConsent(consentData) {
    try {
      // Validate consent data
      if (!consentData || typeof consentData !== 'object') {
        throw new Error('Invalid consent data');
      }
      
      if (!consentData.widgetId || !consentData.visitorId || !consentData.consentStatus) {
        throw new Error('Missing required consent fields');
      }
      
      // Validate consent status
      if (!['accepted', 'rejected', 'partial'].includes(consentData.consentStatus)) {
        throw new Error('Invalid consent status');
      }
      
      // Validate activity arrays
      if (consentData.acceptedActivities && !Array.isArray(consentData.acceptedActivities)) {
        console.warn('[Consently DPDPA] Invalid acceptedActivities, converting to array');
        consentData.acceptedActivities = [];
      }
      
      if (consentData.rejectedActivities && !Array.isArray(consentData.rejectedActivities)) {
        console.warn('[Consently DPDPA] Invalid rejectedActivities, converting to array');
        consentData.rejectedActivities = [];
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
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
            console.error('[Consently DPDPA] API error response:', errorData);
          } catch (e) {
            // Ignore JSON parse errors
          }
          
          throw new Error(errorMessage + ' (HTTP ' + response.status + ')');
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
        visitorId: getVisitorId(),
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
        visitorId: getVisitorId(),
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

  // Check if user has consented to activities required for current page
  function checkConsentForCurrentPage(existingConsent) {
    if (!existingConsent || !existingConsent.timestamp) {
      return false;
    }
    
    // Get activity IDs from existing consent (both accepted and rejected)
    const consentedActivityIds = [
      ...(existingConsent.acceptedActivities || []),
      ...(existingConsent.rejectedActivities || [])
    ];
    
    // Determine which activities are required for current page
    let requiredActivityIds;
    
    // Check if we have a matched rule with specific activities
    if (config._matchedRule && config._matchedRule.activities && Array.isArray(config._matchedRule.activities)) {
      requiredActivityIds = config._matchedRule.activities;
      console.log('[Consently DPDPA] Checking consent for page-specific activities:', requiredActivityIds);
    } else {
      // No rule matched or rule doesn't specify activities - use all activities
      requiredActivityIds = activities.map(a => a.id);
      console.log('[Consently DPDPA] Checking consent for all activities:', requiredActivityIds);
    }
    
    // Check if user has consented to all required activities
    const allConsented = requiredActivityIds.every(activityId => 
      consentedActivityIds.includes(activityId)
    );
    
    if (allConsented) {
      console.log('[Consently DPDPA] User has consented to all required activities for this page');
      return true;
    } else {
      const missingActivities = requiredActivityIds.filter(id => !consentedActivityIds.includes(id));
      console.log('[Consently DPDPA] User has not consented to all required activities:', missingActivities);
      return false;
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
      // No rule matched, use default behavior
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
            <button id="dpdpa-close-btn" style="background: none; border: none; cursor: pointer; padding: 6px; opacity: 0.5; transition: opacity 0.2s; border-radius: 6px;" aria-label="${t.close}">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
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
          <button id="dpdpa-cancel-btn" style="flex: 1; min-width: 0; padding: 13px 20px; background: white; color: ${textColor}; border: 2px solid #e5e7eb; border-radius: 10px; cursor: pointer; font-size: 14px; font-weight: 700; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.05); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${t.cancel}
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
    // Close button
    const closeBtn = widget.querySelector('#dpdpa-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        hideWidget(overlay);
      });
    }

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

    // Cancel button
    const cancelBtn = widget.querySelector('#dpdpa-cancel-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        hideWidget(overlay);
      });
      // Enhanced hover effects
      cancelBtn.addEventListener('mouseenter', () => {
        cancelBtn.style.background = '#f9fafb';
        cancelBtn.style.borderColor = '#d1d5db';
        cancelBtn.style.transform = 'translateY(-1px)';
      });
      cancelBtn.addEventListener('mouseleave', () => {
        cancelBtn.style.background = 'white';
        cancelBtn.style.borderColor = '#e5e7eb';
        cancelBtn.style.transform = 'translateY(0)';
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
    const activityPurposeConsents = {}; // Track purpose-level consent: { activity_id: [purpose_id_1, purpose_id_2] }

    Object.keys(activityConsents).forEach(activityId => {
      if (activityConsents[activityId].status === 'accepted') {
        acceptedActivities.push(activityId);
        
        // Track purposes for this activity if purposes are filtered
        const activity = activities.find(a => a.id === activityId);
        if (activity && activity.purposes && Array.isArray(activity.purposes)) {
          // Store consented purpose IDs for this activity
          activityPurposeConsents[activityId] = activity.purposes.map(p => p.id);
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
    
    const consentData = {
      widgetId: widgetId,
      visitorId: getVisitorId(),
      visitorEmail: visitorEmail || undefined,
      consentStatus: finalStatus,
      acceptedActivities: acceptedActivities,
      ruleContext: ruleContext, // NEW: Track which rule triggered this consent
      rejectedActivities: rejectedActivities,
      activityConsents: activityConsents,
      activityPurposeConsents: Object.keys(activityPurposeConsents).length > 0 ? activityPurposeConsents : undefined, // NEW: Track purpose-level consent
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

      // Show floating preference centre button
      showFloatingPreferenceButton();

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
    const visitorId = getVisitorId();
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

  // Show floating button for preference centre access
  function showFloatingPreferenceButton() {
    // Don't create multiple buttons
    if (document.getElementById('dpdpa-float-btn')) {
      return;
    }

    const visitorId = getVisitorId();
    const button = document.createElement('div');
    button.id = 'dpdpa-float-btn';
    button.innerHTML = `
      <style>
        #dpdpa-float-btn {
          position: fixed;
          bottom: 20px;
          left: 20px;
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
          width: 56px;
          height: 56px;
          color: white;
        }
        .dpdpa-float-trigger:hover {
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.6);
          transform: translateY(-2px) scale(1.05);
        }
        .dpdpa-float-tooltip {
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
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
          left: 50%;
          transform: translateX(-50%);
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
    const visitorId = getVisitorId();
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
