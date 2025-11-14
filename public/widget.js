/**
 * Consently Cookie Consent Widget v3.2 - FIXED VERSION
 * Production-ready embeddable widget (no dependencies)
 * DPDPA 2023 & GDPR Compliant
 * 
 * FIXES IN THIS VERSION:
 * - Language switching now works reliably without freezing
 * - Preferences persist correctly after refresh
 * - Consently logo/shield icon instead of cookie emoji
 * - Better error handling and loading states
 * - Debounced language changes to prevent rapid switching issues
 * 
 * Usage: <script src="https://your-domain.com/widget.js" data-consently-id="YOUR_WIDGET_ID"></script>
 */

(function() {
  'use strict';

  // Get widget ID from script tag
  const currentScript = document.currentScript || document.querySelector('script[data-consently-id]');
  const widgetId = currentScript ? currentScript.getAttribute('data-consently-id') : null;
  
  if (!widgetId) {
    console.error('[Consently] Error: data-consently-id attribute is required');
    return;
  }

  console.log('[Consently] Initializing widget v3.2 with ID:', widgetId);

  // State management
  let isTranslating = false;
  let languageChangeInProgress = false;
  let configPollingInterval = null;
  let lastConfigHash = null;
  
  // Default configuration
  const defaultConfig = {
    position: 'bottom',
    layout: 'bar',
    theme: {
      primaryColor: '#3b82f6',
      secondaryColor: '#1e40af',
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      fontFamily: 'system-ui, sans-serif',
      fontSize: 14,
      borderRadius: 8,
      boxShadow: true
    },
    title: 'We value your privacy',
    message: 'We use cookies to enhance your browsing experience.',
    acceptButton: {
      text: 'Accept All',
      backgroundColor: '#3b82f6',
      textColor: '#ffffff'
    },
    rejectButton: {
      text: 'Reject All',
      backgroundColor: '#ffffff',
      textColor: '#3b82f6',
      borderColor: '#3b82f6'
    },
    settingsButton: {
      text: 'Cookie Settings',
      backgroundColor: '#f3f4f6',
      textColor: '#1f2937'
    },
    showRejectButton: true,
    showSettingsButton: true,
    autoShow: true,
    showAfterDelay: 0,
    respectDNT: false,
    blockContent: false,
    zIndex: 9999
  };

  let config = Object.assign({}, defaultConfig);
  let configLoaded = false;
  let isBannerVisible = false;
  
  // Generate or retrieve session ID
  let sessionId = null;
  try {
    sessionId = sessionStorage.getItem('consently_session_id');
    if (!sessionId) {
      sessionId = 'ses_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('consently_session_id', sessionId);
    }
  } catch (e) {
    sessionId = 'ses_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  // Load language preference
  let selectedLanguage = 'en';
  try {
    const savedLang = localStorage.getItem('consently_language');
    if (savedLang) {
      selectedLanguage = savedLang;
      console.log('[Consently] Loaded saved language:', savedLang);
    }
  } catch (e) {
    console.warn('[Consently] localStorage not available for language');
  }
  
  let translationCache = {};

  // Consently Shield SVG Logo (replaces cookie emoji)
  const CONSENTLY_LOGO_SVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style="color: #3b82f6;">
    <path d="M12 2L4 6v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V6l-8-4zm0 18.5c-4.05-1.26-7-5.28-7-9.5V7.19l7-3.5 7 3.5V11c0 4.22-2.95 8.24-7 9.5z"/>
    <path d="M10.5 13.5l-2-2-1.41 1.41L10.5 16.5l6-6-1.41-1.41z"/>
  </svg>`;

  // Translation helper with timeout and error handling
  async function translateText(text, targetLang, timeout = 5000) {
    if (targetLang === 'en' || !targetLang || !text) return text;
    
    const cacheKey = `${targetLang}:${text}`;
    if (translationCache[cacheKey]) {
      return translationCache[cacheKey];
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const apiBase = config.apiBase || window.location.origin;
      const response = await fetch(`${apiBase}/api/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, target: targetLang, source: 'en' }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const translated = data.translatedText || text;
        translationCache[cacheKey] = translated;
        return translated;
      }
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.warn('[Consently] Translation timeout for:', text);
      } else {
        console.error('[Consently] Translation error:', error);
      }
    }
    
    return text;
  }

  function languageLabel(code) {
    const map = { 
      en: 'English', hi: 'हिंदी', pa: 'ਪੰਜਾਬੀ', te: 'తెలుగు', ta: 'தமிழ்',
      bn: 'বাংলা', mr: 'मराठी', gu: 'ગુજરાતી', kn: 'ಕನ್ನಡ', ml: 'മലയാളം',
      or: 'ଓଡ଼ିଆ', ur: 'اردو', as: 'অসমীয়া'
    };
    return map[code] || '';
  }

  function languageFlag(code) {
    const map = { 
      en: '🇮🇳', hi: '🇮🇳', pa: '🇮🇳', te: '🇮🇳', ta: '🇮🇳',
      bn: '🇮🇳', mr: '🇮🇳', gu: '🇮🇳', kn: '🇮🇳', ml: '🇮🇳',
      or: '🇮🇳', ur: '🇮🇳', as: '🇮🇳'
    };
    return map[code] || '🌐';
  }

  // Cookie helper functions
  const CookieManager = {
    set: function(name, value, days) {
      const expires = new Date();
      expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
      // Get domain for cookie (supports subdomains)
      const hostname = window.location.hostname;
      let domain = '';
      // Only set domain for non-localhost hosts
      if (hostname !== 'localhost' && !hostname.startsWith('127.') && !hostname.startsWith('192.168.')) {
        // Extract root domain (e.g., consently.in from www.consently.in)
        const parts = hostname.split('.');
        if (parts.length >= 2) {
          domain = ';domain=' + parts.slice(-2).join('.');
        }
      }
      // Only add Secure flag for HTTPS connections
      const isSecure = window.location.protocol === 'https:';
      const secureFlag = isSecure ? ';Secure' : '';
      
      document.cookie = name + '=' + encodeURIComponent(JSON.stringify(value)) + 
                       ';expires=' + expires.toUTCString() + 
                       ';path=/' + 
                       domain +
                       ';SameSite=Lax' +
                       secureFlag;
    },
    
    get: function(name) {
      const nameEQ = name + '=';
      const ca = document.cookie.split(';');
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) {
          try {
            return JSON.parse(decodeURIComponent(c.substring(nameEQ.length, c.length)));
          } catch (e) {
            return null;
          }
        }
      }
      return null;
    },
    
    delete: function(name) {
      document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/';
    }
  };

  // Debounce helper for language changes
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Simple hash function for config comparison
  function hashConfig(configObj) {
    const str = JSON.stringify({
      theme: configObj.theme,
      title: configObj.title,
      message: configObj.message,
      position: configObj.position,
      layout: configObj.layout,
      acceptButton: configObj.acceptButton,
      rejectButton: configObj.rejectButton,
      settingsButton: configObj.settingsButton
    });
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }

  // Fetch widget configuration
  async function fetchBannerConfig(isPolling = false) {
    try {
      const scriptSrc = currentScript.src;
      let apiBase;
      
      if (scriptSrc && scriptSrc.includes('http')) {
        const url = new URL(scriptSrc);
        apiBase = url.origin;
      } else {
        apiBase = window.location.origin;
      }
      
      const cacheBuster = Date.now();
      const apiUrl = `${apiBase}/api/cookies/widget-public/${widgetId}?_t=${cacheBuster}`;
      
      if (!isPolling) {
        console.log('[Consently] Fetching config from:', apiUrl);
      }
      
      let response;
      try {
        // Create abort controller for timeout (more compatible than AbortSignal.timeout)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          },
          cache: 'no-store',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
      } catch (fetchError) {
        // Handle network errors (ERR_NETWORK_IO_SUSPENDED, timeout, etc.)
        if (fetchError.name === 'AbortError') {
          if (!isPolling) {
            console.warn('[Consently] Config fetch timeout - will retry');
          }
          throw new Error('Request timeout');
        }
        // Handle network suspension errors (page unloading, tab backgrounded)
        // These errors are non-critical and can be safely ignored
        if (fetchError.message && (
          fetchError.message.includes('ERR_NETWORK_IO_SUSPENDED') ||
          fetchError.message.includes('Failed to fetch') ||
          fetchError.message.includes('network') ||
          fetchError.message.includes('aborted')
        )) {
          if (!isPolling) {
            console.warn('[Consently] Network request suspended (page may be unloading) - this is normal');
          }
          // Don't throw - just return false to allow graceful degradation
          return false;
        }
        throw fetchError;
      }
      
      if (!response.ok) {
        // Handle 404 - widget doesn't exist
        if (response.status === 404) {
          if (!isPolling) {
            console.error(`[Consently] Widget ${widgetId} not found. Please create this widget in the Consently dashboard.`);
          }
          // Stop polling if widget doesn't exist
          stopConfigPolling();
          throw new Error(`Widget not found`);
        }
        // Other errors
        if (!isPolling) {
          console.error(`[Consently] Config fetch failed: HTTP ${response.status}`);
        }
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && (data.widgetId || data.bannerId)) {
        const newConfigHash = hashConfig(data);
        
        // Check if config has changed
        if (isPolling && lastConfigHash !== null && newConfigHash !== lastConfigHash) {
          console.log('[Consently] 🔄 Configuration updated! Refreshing widget...');
          config = Object.assign({}, defaultConfig, data);
          config.widgetId = widgetId;
          config.apiEndpoint = '/api/consent/record';
          config.apiBase = apiBase;
          lastConfigHash = newConfigHash;
          
          // Only refresh banner if it's currently visible AND we're in preview mode
          // Don't interrupt users who have already given consent
          const existingConsent = CookieManager.get('consently_consent');
          const hasValidConsent = existingConsent && existingConsent.timestamp && 
                                   ((Date.now() - existingConsent.timestamp) / (1000 * 60 * 60 * 24)) < (config.consentDuration || 365);
          
          const isExplicitPreview = new URLSearchParams(window.location.search).get('preview') === 'true';
          
          if (isBannerVisible && (!hasValidConsent || isExplicitPreview)) {
            const existingBanner = document.getElementById('consently-banner');
            const existingBackdrop = document.getElementById('consently-backdrop');
            if (existingBanner) {
              existingBanner.remove();
            }
            if (existingBackdrop) {
              existingBackdrop.remove();
            }
            await showConsentBanner();
          } else {
            // If banner is not visible but config changed, log for debugging
            console.log('[Consently] Config updated (banner hidden). Changes will apply on next show.');
          }
          return true;
        }
        
        config = Object.assign({}, defaultConfig, data);
        config.widgetId = widgetId;
        config.apiEndpoint = '/api/consent/record';
        config.apiBase = apiBase;
        lastConfigHash = newConfigHash;
        configLoaded = true;
        
        if (!isPolling) {
          console.log('[Consently] ✅ Configuration loaded');
        }
        return true;
      } else {
        throw new Error('Invalid configuration');
      }
    } catch (error) {
      if (!isPolling) {
        console.error('[Consently] Failed to load config:', error);
      }
      config.widgetId = widgetId;
      config.apiEndpoint = '/api/consent/record';
      config.apiBase = window.location.origin;
      return false;
    }
  }
  
  // Start polling for config updates
  function startConfigPolling() {
    // Only poll if we're in preview/test mode or banner is visible
    // Otherwise, poll less frequently to save performance
    const isPreviewMode = window.location.hostname.includes('consently.in') || 
                          window.location.hostname.includes('localhost');
    const existingConsent = CookieManager.get('consently_consent');
    const hasConsent = existingConsent && existingConsent.timestamp;
    
    // In preview mode, poll every 5 seconds for testing
    // Otherwise, only poll every 30 seconds if consent exists (for updates)
    // Or every 10 seconds if no consent (waiting for user decision)
    const pollInterval = isPreviewMode ? 5000 : (hasConsent ? 30000 : 10000);
    
    configPollingInterval = setInterval(async () => {
      await fetchBannerConfig(true);
    }, pollInterval);
    console.log(`[Consently] 🔄 Auto-sync enabled - checking for updates every ${pollInterval/1000} seconds`);
  }
  
  // Stop polling
  function stopConfigPolling() {
    if (configPollingInterval) {
      clearInterval(configPollingInterval);
      configPollingInterval = null;
      console.log('[Consently] Auto-sync disabled');
    }
  }

  // Initialize widget
  async function init() {
    // Check if we're on dashboard pages - don't show widget on authenticated dashboard
    const isDashboardPage = window.location.pathname.startsWith('/dashboard');
    
    // Skip widget initialization on dashboard pages (except for preview/testing)
    // Only show on dashboard if explicitly in preview mode AND a specific query param is set
    const urlParams = new URLSearchParams(window.location.search);
    const isExplicitPreview = urlParams.get('preview') === 'true' || urlParams.get('test-widget') === 'true';
    
    if (isDashboardPage && !isExplicitPreview) {
      console.log('[Consently] Dashboard page detected - skipping widget initialization');
      return;
    }
    
    await fetchBannerConfig();

    const existingConsent = CookieManager.get('consently_consent');
    const isPreviewMode = (window.location.hostname.includes('consently.in') || 
                          window.location.hostname.includes('localhost')) &&
                          isExplicitPreview; // Only true preview mode with explicit flag
    
    if (config.respectDNT && navigator.doNotTrack === '1') {
      console.log('[Consently] DNT enabled');
      return;
    }

    if (existingConsent && existingConsent.timestamp) {
      const consentAge = (Date.now() - existingConsent.timestamp) / (1000 * 60 * 60 * 24);
      const consentDuration = config.consentDuration || 365;
      
      if (consentAge < consentDuration) {
        console.log('[Consently] Valid consent found (age: ' + Math.round(consentAge) + ' days)');
        
        // Verify consent data is complete
        if (!existingConsent.status || !existingConsent.categories) {
          console.warn('[Consently] Consent data incomplete, resetting...');
          CookieManager.delete('consently_consent');
          // Continue to show banner below
        } else {
          applyConsent(existingConsent);
          // Start polling even if consent exists (for testing/preview purposes)
          startConfigPolling();
          
          // Show floating consent button for users to manage preferences
          showConsentButton();
          
          // Only show banner in explicit preview mode (not just on consently.in domain)
          if (isPreviewMode && isExplicitPreview) {
            console.log('[Consently] Explicit preview mode - showing banner for testing');
            if (config.autoShow) {
              if (config.showAfterDelay > 0) {
                setTimeout(showConsentBanner, config.showAfterDelay);
              } else {
                showConsentBanner();
              }
            }
          }
          return;
        }
      } else {
        console.log('[Consently] Consent expired (age: ' + Math.round(consentAge) + ' days), showing banner again');
        // Clear expired consent
        CookieManager.delete('consently_consent');
      }
    }

    if (config.autoShow) {
      if (config.showAfterDelay > 0) {
        setTimeout(showConsentBanner, config.showAfterDelay);
      } else {
        showConsentBanner();
      }
    }
    
    // Start polling for config updates
    startConfigPolling();
  }

  // Show consent banner with Consently logo
  async function showConsentBanner() {
    // Don't show banner on dashboard pages unless explicitly in preview mode
    const isDashboardPage = window.location.pathname.startsWith('/dashboard');
    const urlParams = new URLSearchParams(window.location.search);
    const isExplicitPreview = urlParams.get('preview') === 'true' || urlParams.get('test-widget') === 'true';
    
    if (isDashboardPage && !isExplicitPreview) {
      console.log('[Consently] Dashboard page - banner suppressed');
      return;
    }
    
    if (document.getElementById('consently-banner') || isTranslating) {
      return;
    }
    
    isBannerVisible = true;
    
    // Check if we need a backdrop for modal/center layouts
    const position = config.position || 'bottom';
    const layout = config.layout || 'bar';
    const needsBackdrop = (position === 'center' || position === 'center-modal' || layout === 'modal');
    
    // Create backdrop if needed
    if (needsBackdrop) {
      const backdrop = document.createElement('div');
      backdrop.id = 'consently-backdrop';
      backdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: ${(config.zIndex || 9999) - 1};
        animation: fadeIn 0.3s ease-out;
      `;
      document.body.appendChild(backdrop);
    }

    const theme = config.theme || {};
    const primaryColor = theme.primaryColor || '#3b82f6';
    const backgroundColor = theme.backgroundColor || '#ffffff';
    const textColor = theme.textColor || '#1f2937';
    const fontFamily = theme.fontFamily || 'system-ui, sans-serif';
    const fontSize = theme.fontSize || 14;
    const borderRadius = theme.borderRadius || 8;
    const zIndex = config.zIndex || 9999;
    
    // Debug: Log logo URL
    console.log('[Consently] Logo URL:', theme.logoUrl);
    
    const acceptButton = config.acceptButton || {};
    const rejectButton = config.rejectButton || {};
    const settingsButton = config.settingsButton || {};

    // Translate text
    isTranslating = true;
    const title = await translateText(config.title, selectedLanguage);
    const message = await translateText(config.message, selectedLanguage);
    const acceptText = await translateText(config.acceptButton?.text || 'Accept All', selectedLanguage);
    const rejectText = await translateText(config.rejectButton?.text || 'Reject All', selectedLanguage);
    const settingsText = await translateText(config.settingsButton?.text || 'Cookie Settings', selectedLanguage);
    isTranslating = false;

    const banner = document.createElement('div');
    banner.id = 'consently-banner';
    
    let positionStyles = '';
    let maxWidth = '';
    let layoutStyles = '';
    
    // Handle position (already declared above)
    switch (position) {
      case 'top':
        positionStyles = 'top: 0; left: 0; right: 0;';
        break;
      case 'bottom':
        positionStyles = 'bottom: 0; left: 0; right: 0;';
        break;
      case 'top-left':
        positionStyles = 'top: 20px; left: 20px;';
        maxWidth = 'max-width: 400px;';
        break;
      case 'top-right':
        positionStyles = 'top: 20px; right: 20px;';
        maxWidth = 'max-width: 400px;';
        break;
      case 'bottom-left':
        positionStyles = 'bottom: 20px; left: 20px;';
        maxWidth = 'max-width: 400px;';
        break;
      case 'bottom-right':
        positionStyles = 'bottom: 20px; right: 20px;';
        maxWidth = 'max-width: 400px;';
        break;
      case 'center':
      case 'center-modal':
        positionStyles = 'top: 50%; left: 50%; transform: translate(-50%, -50%);';
        maxWidth = 'max-width: 600px;';
        layoutStyles = 'min-height: 200px;';
        break;
      default:
        positionStyles = 'bottom: 0; left: 0; right: 0;';
    }
    
    // Handle layout (already declared above)
    switch (layout) {
      case 'bar':
        // Compact horizontal bar
        layoutStyles += 'padding: 16px 24px;';
        break;
      case 'banner':
        // Prominent banner with more padding
        layoutStyles += 'padding: 24px;';
        break;
      case 'box':
        // Contained box design
        maxWidth = 'max-width: 500px;';
        layoutStyles += 'padding: 24px; margin: 20px;';
        break;
      case 'modal':
        // Modal overlay
        maxWidth = 'max-width: 600px;';
        layoutStyles += 'padding: 32px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);';
        break;
      default:
        layoutStyles += 'padding: 24px;';
    }
    
    banner.style.cssText = `
      position: fixed;
      ${positionStyles}
      ${maxWidth}
      ${layoutStyles}
      background-color: ${backgroundColor};
      color: ${textColor};
      padding-top: 48px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      z-index: ${zIndex};
      font-family: ${fontFamily};
      font-size: ${fontSize}px;
      line-height: 1.5;
      border-radius: ${borderRadius}px;
      animation: ${position === 'top' ? 'slideDown' : position.includes('center') ? 'fadeIn' : 'slideUp'} 0.3s ease-out;
    `;

    banner.innerHTML = `
      <style>
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        .consently-btn {
          padding: 10px 20px;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          border: none;
          font-size: 14px;
          transition: all 0.2s;
          margin: 0 8px 8px 0;
        }
        .consently-btn:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }
        .consently-btn-primary {
          background-color: ${acceptButton.backgroundColor || primaryColor};
          color: ${acceptButton.textColor || '#ffffff'};
          border: 2px solid ${acceptButton.borderColor || acceptButton.backgroundColor || primaryColor};
        }
        .consently-btn-secondary {
          background-color: ${rejectButton.backgroundColor || 'transparent'};
          color: ${rejectButton.textColor || primaryColor};
          border: 2px solid ${rejectButton.borderColor || primaryColor};
        }
        .consently-btn-text {
          background-color: ${settingsButton.backgroundColor || '#f3f4f6'};
          color: ${settingsButton.textColor || textColor};
          border: 2px solid transparent;
        }
        .consently-container {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          flex-wrap: wrap;
        }
        .consently-content {
          flex: 1;
          min-width: 300px;
        }
        .consently-actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
        }
        .consently-title {
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 8px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .consently-message {
          margin: 0;
          opacity: 0.9;
        }
        .consently-lang-selector {
          position: absolute;
          top: 12px;
          right: 12px;
          z-index: 10;
        }
        .consently-lang-btn-banner {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          padding: 0;
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 50%;
          background: white;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.2s;
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        }
        .consently-lang-btn-banner:hover {
          background: #f9fafb;
          transform: scale(1.05);
        }
        .consently-lang-btn-banner:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .consently-lang-menu-banner {
          display: none;
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 8px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 10;
          min-width: 180px;
          max-height: 240px;
          overflow-y: auto;
        }
        .consently-lang-menu-banner button {
          display: flex;
          gap: 8px;
          align-items: center;
          width: 100%;
          text-align: left;
          padding: 10px 14px;
          border: none;
          background: white;
          cursor: pointer;
          font-size: 13px;
          transition: background 0.15s;
        }
        .consently-lang-menu-banner button:hover {
          background: #f0f9ff;
        }
        .consently-lang-menu-banner button.active {
          background: #f0f9ff;
          font-weight: 600;
          color: #0369a1;
        }
        @media (max-width: 768px) {
          .consently-container {
            flex-direction: column;
            align-items: flex-start;
          }
          .consently-actions {
            width: 100%;
          }
        }
      </style>
      ${(() => {
        const supportedLangs = config.supportedLanguages || ['en'];
        const validLangs = supportedLangs.filter(code => languageLabel(code));
        
        if (validLangs.length <= 1) return '';
        
        return `
      <div class="consently-lang-selector">
        <button id="consently-lang-btn-banner" class="consently-lang-btn-banner" title="${languageLabel(selectedLanguage)}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
          </svg>
        </button>
        <div id="consently-lang-menu-banner" class="consently-lang-menu-banner">
          ${validLangs.map(code => `
            <button data-lang="${code}" class="${code === selectedLanguage ? 'active' : ''}">
              <span style="font-size: 16px;">${languageFlag(code)}</span>
              <span>${languageLabel(code)}</span>
            </button>
          `).join('')}
        </div>
      </div>`;
      })()}
      <div class="consently-container">
        <div class="consently-content">
          ${theme.logoUrl ? `<img src="${theme.logoUrl}" alt="Logo" style="height: 32px; width: auto; object-fit: contain; margin-bottom: 12px; display: block;" onerror="this.style.display='none'">` : ''}
          <h3 class="consently-title">
            ${!theme.logoUrl ? CONSENTLY_LOGO_SVG : ''}
            <span>${title}</span>
          </h3>
          <p class="consently-message">${message}</p>
          ${(() => {
            // Category chips - matching preview
            if (!config.categories || config.categories.length === 0) return '';
            
            const categoryNames = {
              necessary: 'Necessary',
              preferences: 'Preferences',
              analytics: 'Analytics',
              marketing: 'Marketing',
              social: 'Social'
            };
            
            return `
              <div style="margin-top: 12px; display: flex; flex-wrap: wrap; gap: 8px;">
                ${config.categories.filter(cat => cat && typeof cat === 'string').map(cat => {
                  const name = categoryNames[cat] || cat.charAt(0).toUpperCase() + cat.slice(1);
                  return `<span style="
                    display: inline-flex;
                    align-items: center;
                    padding: 4px 10px;
                    font-size: 11px;
                    font-weight: 500;
                    border: 1px solid ${primaryColor};
                    color: ${primaryColor};
                    background: transparent;
                    border-radius: 12px;
                    text-transform: capitalize;
                  ">${name}</span>`;
                }).join('')}
              </div>
            `;
          })()}
          ${(() => {
            const links = [];
            if (config.privacyPolicyUrl) {
              links.push(`<a href="${config.privacyPolicyUrl}" target="_blank" rel="noopener noreferrer" style="color: ${theme.primaryColor || '#3b82f6'}; text-decoration: underline;">${config.privacyPolicyText || 'Privacy Policy'}</a>`);
            }
            if (config.cookiePolicyUrl) {
              links.push(`<a href="${config.cookiePolicyUrl}" target="_blank" rel="noopener noreferrer" style="color: ${theme.primaryColor || '#3b82f6'}; text-decoration: underline;">${config.cookiePolicyText || 'Cookie Policy'}</a>`);
            }
            if (config.termsUrl) {
              links.push(`<a href="${config.termsUrl}" target="_blank" rel="noopener noreferrer" style="color: ${theme.primaryColor || '#3b82f6'}; text-decoration: underline;">${config.termsText || 'Terms'}</a>`);
            }
            return links.length > 0 ? `<p class="consently-links" style="margin-top: 8px; font-size: 12px; opacity: 0.8;">${links.join(' • ')}</p>` : '';
          })()}
        </div>
        <div class="consently-actions">
          <button id="consently-accept" class="consently-btn consently-btn-primary">
            ${acceptText}
          </button>
          ${config.showRejectButton ? `
            <button id="consently-reject" class="consently-btn consently-btn-secondary">
              ${rejectText}
            </button>
          ` : ''}
          ${config.showSettingsButton ? `
            <button id="consently-settings" class="consently-btn consently-btn-text">
              ${settingsText}
            </button>
          ` : ''}
        </div>
      </div>
      ${config.showBrandingLink ? `
        <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid rgba(0,0,0,0.1); text-align: center;">
          <a 
            href="https://www.consently.in" 
            target="_blank" 
            rel="noopener noreferrer"
            style="font-size: 12px; color: ${theme.textColor || '#6b7280'}; opacity: 0.7; text-decoration: none; transition: opacity 0.15s;"
            onmouseover="this.style.opacity='1'"
            onmouseout="this.style.opacity='0.7'"
          >
            Powered by <span style="font-weight: 600;">Consently</span>
          </a>
        </div>
      ` : ''}
    `;

    document.body.appendChild(banner);

    // Event listeners
    const acceptBtn = document.getElementById('consently-accept');
    if (acceptBtn) {
      acceptBtn.addEventListener('click', function() {
        handleConsent('accepted', ['necessary', 'analytics', 'marketing', 'preferences']);
      });
    }

    const rejectBtn = document.getElementById('consently-reject');
    if (rejectBtn) {
      rejectBtn.addEventListener('click', function() {
        handleConsent('rejected', ['necessary']);
      });
    }

    const settingsBtn = document.getElementById('consently-settings');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', function() {
        showSettingsModal();
      });
    }

    // Language selector with debouncing
    const langBtnBanner = document.getElementById('consently-lang-btn-banner');
    const langMenuBanner = document.getElementById('consently-lang-menu-banner');
    
    if (langBtnBanner && langMenuBanner) {
      langBtnBanner.addEventListener('click', function(e) {
        e.stopPropagation();
        langMenuBanner.style.display = langMenuBanner.style.display === 'none' || !langMenuBanner.style.display ? 'block' : 'none';
      });
      
      document.addEventListener('click', function(e) {
        if (!langBtnBanner.contains(e.target) && !langMenuBanner.contains(e.target)) {
          langMenuBanner.style.display = 'none';
        }
      });
      
      const handleLanguageChange = debounce(async function(newLang) {
        if (languageChangeInProgress) {
          console.log('[Consently] Language change already in progress');
          return;
        }
        
        languageChangeInProgress = true;
        langBtnBanner.disabled = true;
        
        try {
          selectedLanguage = newLang;
          localStorage.setItem('consently_language', newLang);
          langMenuBanner.style.display = 'none';
          
          // Remove both banner and backdrop explicitly
          const existingBanner = document.getElementById('consently-banner');
          const existingBackdrop = document.getElementById('consently-backdrop');
          if (existingBanner) existingBanner.remove();
          if (existingBackdrop) existingBackdrop.remove();
          
          await showConsentBanner();
        } catch (error) {
          console.error('[Consently] Language change error:', error);
        } finally {
          languageChangeInProgress = false;
        }
      }, 300);
      
      langMenuBanner.querySelectorAll('button[data-lang]').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
          e.stopPropagation();
          const newLang = this.getAttribute('data-lang');
          if (newLang !== selectedLanguage) {
            handleLanguageChange(newLang);
          }
        });
      });
    }
  }

  // Handle consent
  function handleConsent(status, categories) {
    // Validate inputs
    if (!status || !Array.isArray(categories) || categories.length === 0) {
      console.error('[Consently] Invalid consent data:', { status, categories });
      return;
    }
    
    // Generate unique consent ID
    const consentId = 'con_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    const consentData = {
      status: status,
      categories: categories,
      timestamp: Date.now(),
      widgetId: widgetId,
      consentId: consentId,
      domain: window.location.hostname,
      path: window.location.pathname
    };

    // Use consent duration from config or default to 365 days
    const consentDuration = config.consentDuration || 365;
    CookieManager.set('consently_consent', consentData, consentDuration);
    
    // Verify cookie was set correctly
    const verifyConsent = CookieManager.get('consently_consent');
    if (verifyConsent && verifyConsent.consentId === consentId) {
      console.log('[Consently] ✓ Consent saved and verified');
    } else {
      console.error('[Consently] ⚠️ Failed to verify consent cookie!');
    }
    
    // Clear temp preferences
    try {
      localStorage.removeItem('consently_temp_prefs');
    } catch (e) {}

    // Remove all widget elements to prevent overlay issues
    const banner = document.getElementById('consently-banner');
    if (banner) {
      banner.remove();
      isBannerVisible = false;
    }
    
    const backdrop = document.getElementById('consently-backdrop');
    if (backdrop) backdrop.remove();
    
    const modal = document.getElementById('consently-modal');
    if (modal) modal.remove();
    
    // Clean up any lingering loading overlays
    const loadingOverlay = document.getElementById('consently-loading-overlay');
    if (loadingOverlay) loadingOverlay.remove();

    applyConsent(consentData);
    recordConsent(consentData);
    
    // Show floating consent management button after consent is given
    setTimeout(() => {
      showConsentButton();
    }, 1000);
    
    // Continue polling for config updates even after consent is given
    // This allows testing/preview to work properly
    if (!configPollingInterval) {
      startConfigPolling();
    }
  }

  // Apply consent
  function applyConsent(consent) {
    console.log('[Consently] Applying consent:', consent);
    // Trigger custom event for your app to listen to
    window.dispatchEvent(new CustomEvent('consentlyUpdate', { detail: consent }));
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
          (error.message && (
            error.message.includes('timeout') ||
            error.message.includes('network') ||
            error.message.includes('Failed to fetch')
          )) ||
          (error.status && error.status >= 500);
        
        // Don't retry for client errors (4xx)
        if (!isRetryable || attempt === maxRetries) {
          throw lastError;
        }
        
        // Calculate delay with exponential backoff: 1s, 2s, 4s
        const delay = initialDelay * Math.pow(2, attempt - 1);
        console.log(`[Consently] Retry attempt ${attempt}/${maxRetries} in ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  // Record consent via API (with retry logic)
  async function recordConsent(consent) {
    try {
      const apiBase = config.apiBase || window.location.origin;
      
      // Wrap fetch call with retry logic (3 attempts with exponential backoff)
      await retryWithBackoff(async () => {
        const response = await fetch(`${apiBase}${config.apiEndpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            widgetId: widgetId,
            consentId: consent.consentId || 'con_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            status: consent.status,
            categories: consent.categories,
            deviceType: /mobile/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
            userAgent: navigator.userAgent,
            language: navigator.language || 'en'
          })
        });
        
        if (!response.ok) {
          const error = new Error(`HTTP ${response.status}`);
          error.status = response.status;
          throw error;
        }
        
        return response;
      }, 3, 1000); // 3 retries, starting with 1 second delay
      
      console.log('[Consently] Consent recorded');
    } catch (error) {
      console.error('[Consently] Failed to record consent after retries:', error);
      // Don't throw - consent is still saved locally
    }
  }

  // Complete showSettingsModal function with all fixes
  async function showSettingsModal() {
    console.log('[Consently] Opening settings modal...');
    
    if (languageChangeInProgress || isTranslating) {
      console.log('[Consently] Operation in progress, please wait');
      return;
    }
    
    try {
      const existing = document.getElementById('consently-modal');
      if (existing) existing.remove();

      const banner = document.getElementById('consently-banner');
      if (banner) banner.style.display = 'none';

      // Translate modal text
      isTranslating = true;
      const modalTitle = await translateText('Preferences', selectedLanguage);
      const modalDescription = await translateText('Manage your cookie preferences. Some cookies are necessary for the website to function.', selectedLanguage);
      const saveButtonText = await translateText('Save Preferences', selectedLanguage);
      const cancelButtonText = await translateText('Cancel', selectedLanguage);
      const requiredLabel = await translateText('Required', selectedLanguage);
      isTranslating = false;

    const theme = config.theme || {};
    const modal = document.createElement('div');
    modal.id = 'consently-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 9999999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      animation: fadeIn 0.2s ease-out;
    `;

    // Load saved preferences from cookie (not temp prefs)
    const existingConsent = CookieManager.get('consently_consent');
    const existingCategories = existingConsent ? existingConsent.categories || ['necessary'] : ['necessary'];
    const consentId = existingConsent ? (existingConsent.consentId || 'N/A') : 'N/A';
    const consentDate = existingConsent && existingConsent.timestamp ? new Date(existingConsent.timestamp).toLocaleString() : 'N/A';
    console.log('[Consently] Loading preferences:', existingCategories);
    
    const categories = [
      { id: 'necessary', name: await translateText('Strictly necessary cookies', selectedLanguage), description: await translateText('Essential for website functionality', selectedLanguage), required: true },
      { id: 'analytics', name: await translateText('Performance', selectedLanguage), description: await translateText('Help us understand visitor behavior', selectedLanguage), required: false },
      { id: 'marketing', name: await translateText('Targeting', selectedLanguage), description: await translateText('Used for targeted advertising', selectedLanguage), required: false },
      { id: 'social', name: await translateText('Social Media', selectedLanguage), description: await translateText('Cookies from social media platforms for sharing content', selectedLanguage), required: false }
    ];

    let categoriesHTML = '';
    const availableCategories = config.categories || ['necessary', 'analytics', 'marketing', 'social'];
    
    categories.forEach(cat => {
      if (availableCategories.includes(cat.id) || cat.required) {
        const isChecked = cat.required || existingCategories.includes(cat.id);
        categoriesHTML += `
          <div style="padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 12px;">
            <label style="display: flex; align-items: start; gap: 12px; cursor: ${cat.required ? 'not-allowed' : 'pointer'};">
              <input type="checkbox" id="cat-${cat.id}" 
                     ${cat.required ? 'checked disabled' : (isChecked ? 'checked' : '')} 
                     style="margin-top: 4px; width: 18px; height: 18px;">
              <div style="flex: 1;">
                <div style="font-weight: 600; margin-bottom: 4px; display: flex; align-items: center; gap: 8px;">
                  ${CONSENTLY_LOGO_SVG}
                  <span>${cat.name} ${cat.required ? '<span style="color: #3b82f6; font-size: 12px;">(' + requiredLabel + ')</span>' : ''}</span>
                </div>
                <div style="font-size: 13px; color: #6b7280;">${cat.description}</div>
              </div>
            </label>
          </div>
        `;
      }
    });

    modal.innerHTML = `
      <style>
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        #consently-lang-btn:hover {
          background: #2563eb !important;
          box-shadow: 0 4px 8px rgba(59,130,246,0.4) !important;
        }
        #consently-lang-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        #consently-lang-menu button:hover {
          background: #f0f9ff !important;
        }
        .consently-modal-content {
          background-color: white;
          border-radius: 12px;
          max-width: 500px;
          width: 100%;
          max-height: 80vh;
          overflow-y: auto;
          padding: 24px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
      </style>
      <div class="consently-modal-content">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div>
            ${theme.logoUrl ? `<img src="${theme.logoUrl}" alt="Logo" style="height: 32px; width: auto; object-fit: contain; margin-bottom: 8px; display: block;" onerror="this.style.display='none'">` : ''}
            <h2 style="margin: 0; font-size: 24px; color: #1f2937; display: flex; align-items: center; gap: 8px;">
              ${!theme.logoUrl ? CONSENTLY_LOGO_SVG : ''}
              <span>${modalTitle}</span>
            </h2>
          </div>
          ${(() => {
            const supportedLangs = config.supportedLanguages || ['en'];
            const validLangs = supportedLangs.filter(code => languageLabel(code));
            
            if (validLangs.length <= 1) return '';
            
            return `
          <div style="position: relative;">
            <button id="consently-lang-btn" style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; border: none; border-radius: 8px; background: #3b82f6; color: #fff; cursor: pointer; font-weight: 600; font-size: 14px; transition: all 0.2s;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              <span id="consently-lang-label">${languageLabel(selectedLanguage)}</span>
            </button>
            <div id="consently-lang-menu" style="display: none; position: absolute; right: 0; margin-top: 8px; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0,0,0,.15); overflow: hidden; z-index: 10; min-width: 180px; max-height: 300px; overflow-y: auto;">
              ${validLangs.map(code => `
                <button data-lang="${code}" style="display: flex; gap: 10px; align-items: center; width: 100%; text-align: left; padding: 12px 16px; border: none; background: ${code === selectedLanguage ? '#f0f9ff' : '#fff'}; cursor: pointer; font-size: 14px; font-weight: ${code === selectedLanguage ? '600' : '500'}; color: ${code === selectedLanguage ? '#0369a1' : '#374151'}; transition: all 0.15s;">
                  <span style="font-size: 18px;">${languageFlag(code)}</span>
                  <span>${languageLabel(code)}</span>
                  ${code === selectedLanguage ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="margin-left: auto;"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>' : ''}
                </button>
              `).join('')}
            </div>
          </div>`;
          })()}
        </div>
        <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 14px;">
          ${modalDescription}
        </p>
        ${categoriesHTML}
        ${existingConsent ? `
        <div style="margin-top: 16px; padding: 12px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">📋 Your Consent Record</div>
          <div style="font-size: 11px; color: #374151; margin-bottom: 4px;">
            <strong>Consent ID:</strong> <span style="font-family: monospace; user-select: all; cursor: text;" title="Click to select">${consentId}</span>
          </div>
          <div style="font-size: 11px; color: #374151;">
            <strong>Given on:</strong> ${consentDate}
          </div>
        </div>
        ` : ''}
        <div style="display: flex; gap: 12px; margin-top: 24px; flex-wrap: wrap;">
          <button id="consently-save-settings" class="consently-btn consently-btn-primary" style="flex: 1;">
            ${saveButtonText}
          </button>
          <button id="consently-close-modal" class="consently-btn consently-btn-secondary" style="flex: 1;">
            ${cancelButtonText}
          </button>
        </div>
      </div>
    `;

      document.body.appendChild(modal);

    // Language selector with debouncing for modal
    const langBtn = document.getElementById('consently-lang-btn');
    const langMenu = document.getElementById('consently-lang-menu');
    
    if (langBtn && langMenu) {
      langBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        langMenu.style.display = langMenu.style.display === 'none' || !langMenu.style.display ? 'block' : 'none';
      });
      
      document.addEventListener('click', function(e) {
        if (!langBtn.contains(e.target) && !langMenu.contains(e.target)) {
          langMenu.style.display = 'none';
        }
      });
      
      const handleModalLanguageChange = debounce(async function(newLang) {
        if (languageChangeInProgress) return;
        
        languageChangeInProgress = true;
        langBtn.disabled = true;
        
        try {
          selectedLanguage = newLang;
          localStorage.setItem('consently_language', newLang);
          langMenu.style.display = 'none';
          
          modal.remove();
          await showSettingsModal();
        } catch (error) {
          console.error('[Consently] Modal language change error:', error);
        } finally {
          languageChangeInProgress = false;
        }
      }, 300);
      
      langMenu.querySelectorAll('button[data-lang]').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
          e.stopPropagation();
          const newLang = this.getAttribute('data-lang');
          if (newLang !== selectedLanguage) {
            handleModalLanguageChange(newLang);
          }
        });
      });
    }

    // Save preferences
    document.getElementById('consently-save-settings').addEventListener('click', function() {
      const selectedCategories = ['necessary'];
      categories.forEach(cat => {
        if (!cat.required) {
          const checkbox = document.getElementById('cat-' + cat.id);
          if (checkbox && checkbox.checked) {
            selectedCategories.push(cat.id);
          }
        }
      });
      
      console.log('[Consently] Saving preferences:', selectedCategories);
      modal.remove();
      handleConsent('partial', selectedCategories);
    });
    
    // Close modal
    document.getElementById('consently-close-modal').addEventListener('click', function() {
      modal.remove();
      if (banner) banner.style.display = 'block';
    });

    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        modal.remove();
        if (banner) banner.style.display = 'block';
      }
    });
    } catch (error) {
      console.error('[Consently] Error in showSettingsModal:', error);
      isTranslating = false;
    }
  }

  // Show floating consent management button
  function showConsentButton() {
    // Don't show if button already exists
    if (document.getElementById('consently-float-btn')) return;
    
    const existingConsent = CookieManager.get('consently_consent');
    // Only show if user has given consent
    if (!existingConsent || !existingConsent.timestamp) return;
    
    // Get consent ID from the consent data or generate from timestamp
    const consentId = existingConsent.consentId || `con_${existingConsent.timestamp}_${Math.random().toString(36).substr(2, 5)}`;
    
    // Check if DPDPA widget exists
    const hasDPDPA = typeof window.ConsentlyDPDPA !== 'undefined' || document.querySelector('script[data-dpdpa-widget-id]');
    
    const button = document.createElement('div');
    button.id = 'consently-float-btn';
    button.innerHTML = `
      <style>
        #consently-float-btn {
          position: fixed;
          bottom: 20px;
          left: 20px;
          z-index: 9998;
          cursor: pointer;
        }
        .consently-float-trigger {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 50%;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transition: all 0.2s;
          width: 48px;
          height: 48px;
        }
        .consently-float-trigger:hover {
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
          transform: translateY(-2px);
        }
        .consently-float-menu {
          display: none;
          position: absolute;
          bottom: 100%;
          left: 0;
          margin-bottom: 8px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
          overflow: hidden;
          min-width: 200px;
        }
        .consently-float-menu.show {
          display: block;
          animation: slideUpFade 0.2s ease-out;
        }
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .consently-float-menu button {
          width: 100%;
          text-align: left;
          padding: 12px 16px;
          border: none;
          background: white;
          cursor: pointer;
          font-size: 14px;
          color: #374151;
          transition: background 0.15s;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .consently-float-menu button:hover {
          background: #f3f4f6;
        }
        .consently-float-menu button:not(:last-child) {
          border-bottom: 1px solid #e5e7eb;
        }
        .consently-float-menu button.revoke {
          color: #dc2626;
        }
        .consently-float-menu button.revoke:hover {
          background: #fef2f2;
        }
        .consently-float-menu .divider {
          height: 1px;
          background: #e5e7eb;
          margin: 4px 0;
        }
        .consently-float-menu .section-label {
          padding: 8px 16px;
          font-size: 11px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          background: #f9fafb;
        }
      </style>
      <div class="consently-float-trigger" title="Privacy Preferences">
        ${CONSENTLY_LOGO_SVG}
      </div>
      <div class="consently-float-menu" id="consently-float-menu">
        <div class="section-label">Cookie Preferences</div>
        <button id="consently-manage-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"/>
          </svg>
          Cookie Preferences
        </button>
        <button id="consently-revoke-btn" class="revoke">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          Revoke Cookie Consent
        </button>
        ${hasDPDPA ? `
        <div class="divider"></div>
        <div class="section-label">DPDPA Preferences</div>
        <button id="consently-dpdpa-prefs-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"/>
          </svg>
          DPDPA Preferences
        </button>
        ` : ''}
        <div style="padding: 12px 16px; border-top: 1px solid #e5e7eb; background: #f9fafb;">
          <div style="font-size: 11px; color: #6b7280; margin-bottom: 4px;">Your Consent ID:</div>
          <div style="font-family: monospace; font-size: 10px; color: #374151; word-break: break-all; user-select: all; cursor: text;" title="Click to select">${consentId}</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(button);
    
    // Toggle menu
    const trigger = button.querySelector('.consently-float-trigger');
    const menu = document.getElementById('consently-float-menu');
    
    trigger.addEventListener('click', function(e) {
      e.stopPropagation();
      menu.classList.toggle('show');
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
      if (!button.contains(e.target)) {
        menu.classList.remove('show');
      }
    });
    
    // Manage preferences
    document.getElementById('consently-manage-btn').addEventListener('click', function() {
      menu.classList.remove('show');
      showSettingsModal();
    });
    
    // Revoke consent
    document.getElementById('consently-revoke-btn').addEventListener('click', function() {
      menu.classList.remove('show');
      revokeConsent();
    });
    
    // DPDPA preferences button (if exists)
    if (hasDPDPA) {
      const dpdpaBtn = document.getElementById('consently-dpdpa-prefs-btn');
      if (dpdpaBtn) {
        dpdpaBtn.addEventListener('click', function() {
          menu.classList.remove('show');
          // Try to open DPDPA privacy centre
          if (typeof window.ConsentlyDPDPA !== 'undefined' && window.ConsentlyDPDPA.openPrivacyCentre) {
            window.ConsentlyDPDPA.openPrivacyCentre();
          } else {
            // Fallback: trigger DPDPA widget to show preferences
            const dpdpaWidget = document.getElementById('dpdpa-float-btn');
            if (dpdpaWidget) {
              dpdpaWidget.querySelector('.dpdpa-float-trigger')?.click();
            } else {
              // Try to find and trigger DPDPA widget initialization
              window.dispatchEvent(new CustomEvent('consently-open-dpdpa-prefs'));
            }
          }
        });
      }
    }

    // Listen for DPDPA widget loading after cookie widget
    // Check periodically if DPDPA widget loads later
    let dpdpaCheckInterval = setInterval(function() {
      const dpdpaScript = document.querySelector('script[data-dpdpa-widget-id]');
      const dpdpaExists = dpdpaScript || typeof window.ConsentlyDPDPA !== 'undefined';
      
      if (dpdpaExists && !menu.querySelector('#consently-dpdpa-prefs-btn')) {
        // DPDPA widget loaded, add it to menu
        const divider = document.createElement('div');
        divider.className = 'divider';
        divider.style.cssText = 'height: 1px; background: #e5e7eb; margin: 4px 0;';
        
        const label = document.createElement('div');
        label.className = 'section-label';
        label.style.cssText = 'padding: 8px 16px; font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; background: #f9fafb;';
        label.textContent = 'DPDPA Preferences';
        
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
          if (typeof window.ConsentlyDPDPA !== 'undefined' && window.ConsentlyDPDPA.openPrivacyCentre) {
            window.ConsentlyDPDPA.openPrivacyCentre();
          } else {
            window.dispatchEvent(new CustomEvent('consently-open-dpdpa-prefs'));
          }
        });

        const consentIdSection = menu.querySelector('div[style*="padding: 12px 16px"]');
        if (consentIdSection) {
          menu.insertBefore(divider, consentIdSection);
          menu.insertBefore(label, consentIdSection);
          menu.insertBefore(dpdpaBtn, consentIdSection);
        } else {
          menu.appendChild(divider);
          menu.appendChild(label);
          menu.appendChild(dpdpaBtn);
        }
        
        // Stop checking once added
        clearInterval(dpdpaCheckInterval);
      }
    }, 1000);

    // Stop checking after 10 seconds to avoid infinite polling
    setTimeout(function() {
      clearInterval(dpdpaCheckInterval);
    }, 10000);
  }

  // Revoke consent function
  function revokeConsent() {
    // Generate unique consent ID for revocation
    const consentId = 'con_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    const consentData = {
      status: 'revoked',
      categories: ['necessary'], // Only keep necessary cookies
      timestamp: Date.now(),
      widgetId: widgetId,
      consentId: consentId
    };
    
    // Update cookie
    CookieManager.set('consently_consent', consentData, 365);
    
    // Record the revocation
    recordConsent(consentData);
    applyConsent(consentData);
    
    // Remove the floating button
    const floatBtn = document.getElementById('consently-float-btn');
    if (floatBtn) floatBtn.remove();
    
    console.log('[Consently] Consent revoked');
    
    // Show banner again if autoShow is enabled
    if (config.autoShow) {
      setTimeout(() => {
        showConsentBanner();
      }, 500);
    }
  }

  // Expose global API for programmatic control
  window.Consently = window.Consently || {};
  window.Consently[widgetId] = {
    // Show the banner again (useful for preview/testing)
    show: function() {
      if (!document.getElementById('consently-banner')) {
        showConsentBanner();
      }
    },
    // Hide the banner
    hide: function() {
      const banner = document.getElementById('consently-banner');
      const backdrop = document.getElementById('consently-backdrop');
      if (banner) banner.remove();
      if (backdrop) backdrop.remove();
      isBannerVisible = false;
    },
    // Open settings modal
    openSettings: function() {
      showSettingsModal();
    },
    // Reset consent (clear cookie)
    reset: function() {
      CookieManager.delete('consently_consent');
      console.log('[Consently] Consent reset');
      if (config.autoShow) {
        this.show();
      }
    },
    // Revoke consent
    revoke: function() {
      revokeConsent();
    },
    // Get current consent status
    getConsent: function() {
      return CookieManager.get('consently_consent');
    },
    // Show floating consent button
    showButton: function() {
      showConsentButton();
    },
    // Hide floating consent button
    hideButton: function() {
      const btn = document.getElementById('consently-float-btn');
      if (btn) btn.remove();
    },
    // Check if in preview mode (on consently.in domain)
    isPreviewMode: function() {
      return window.location.hostname.includes('consently.in') || 
             window.location.hostname.includes('localhost');
    }
  };
  
  // Start the widget
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
