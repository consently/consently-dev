/**
 * Consently Cookie Consent Widget v3.1
 * Production-ready embeddable widget (no dependencies)
 * DPDPA 2023 & GDPR Compliant
 * 
 * This widget fetches configuration from widget_configs table and applies
 * the linked banner template design from banner_configs table.
 * 
 * Usage: <script src="https://your-domain.com/widget.js" data-consently-id="YOUR_WIDGET_ID"></script>
 * 
 * The widget will:
 * 1. Fetch widget configuration (domain, categories, behavior)
 * 2. Load linked banner template (design, colors, layout)
 * 3. Merge both configs and render the banner
 * 4. Track consent decisions
 */

(function() {
  'use strict';

  // Get widget ID from script tag
  const currentScript = document.currentScript || document.querySelector('script[data-consently-id]');
  const widgetId = currentScript ? currentScript.getAttribute('data-consently-id') : null;
  
  if (!widgetId) {
    console.error('[Consently] Error: data-consently-id attribute is required');
    console.error('[Consently] Usage: <script src="https://your-domain.com/widget.js" data-consently-id="YOUR_WIDGET_ID"></script>');
    return;
  }

  console.log('[Consently] Initializing widget with ID:', widgetId);

  // Default configuration (will be overridden by API)
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
  let selectedLanguage = 'en';
  let translationCache = {};

  // Translation helper functions
  async function translateText(text, targetLang) {
    if (targetLang === 'en' || !targetLang) return text;
    
    const cacheKey = `${targetLang}:${text}`;
    if (translationCache[cacheKey]) {
      return translationCache[cacheKey];
    }

    try {
      const apiBase = config.apiBase || window.location.origin;
      const response = await fetch(`${apiBase}/api/translate`, {
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
      es: 'Español',
      fr: 'Français',
      de: 'Deutsch',
      pt: 'Português',
      zh: '中文'
    };
    return map[code] || code;
  }

  function languageFlag(code) {
    const map = { 
      en: '🇬🇧', 
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
      ur: '🇮🇳',
      es: '🇪🇸',
      fr: '🇫🇷',
      de: '🇩🇪',
      pt: '🇵🇹',
      zh: '🇨🇳'
    };
    return map[code] || '🌐';
  }

  // Cookie helper functions
  const CookieManager = {
    set: function(name, value, days) {
      const expires = new Date();
      expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
      document.cookie = name + '=' + encodeURIComponent(JSON.stringify(value)) + 
                       ';expires=' + expires.toUTCString() + ';path=/;SameSite=Lax';
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

  // Fetch widget configuration + linked banner template from API
  async function fetchBannerConfig() {
    try {
      // Determine the API base URL
      const scriptSrc = currentScript.src;
      let apiBase;
      
      if (scriptSrc && scriptSrc.includes('http')) {
        // Extract base URL from script source
        const url = new URL(scriptSrc);
        apiBase = url.origin;
      } else {
        // Fallback to current page origin
        apiBase = window.location.origin;
      }
      
      // API fetches widget config + linked banner template
      const apiUrl = `${apiBase}/api/cookies/widget-public/${widgetId}`;
      
      console.log('[Consently] Fetching widget config + banner template from:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        cache: 'default' // Use browser cache for 5 minutes
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data && (data.widgetId || data.bannerId)) {
        // API returns merged widget config + banner template
        config = Object.assign({}, defaultConfig, data);
        config.widgetId = widgetId;
        config.apiEndpoint = '/api/consent/record';
        config.apiBase = apiBase;
        configLoaded = true;
        console.log('[Consently] Configuration loaded successfully');
        console.log('[Consently] Widget ID:', config.widgetId);
        console.log('[Consently] Banner:', config.bannerName || 'Default');
        return true;
      } else {
        throw new Error('Invalid configuration response');
      }
    } catch (error) {
      console.error('[Consently] Failed to load configuration:', error);
      console.log('[Consently] Using default configuration');
      config.widgetId = widgetId;
      config.apiEndpoint = '/api/consent/record';
      config.apiBase = window.location.origin;
      return false;
    }
  }

  // Initialize widget
  async function init() {
    // Fetch configuration from API
    await fetchBannerConfig();

    // Check if consent already exists
    const existingConsent = CookieManager.get('consently_consent');
    
    // Check DNT if configured
    if (config.respectDNT && navigator.doNotTrack === '1') {
      console.log('[Consently] DNT enabled, respecting user preference');
      return;
    }

    // If consent exists and is still valid, don't show banner
    if (existingConsent && existingConsent.timestamp) {
      const consentAge = (Date.now() - existingConsent.timestamp) / (1000 * 60 * 60 * 24);
      const consentDuration = 365; // Default 1 year
      if (consentAge < consentDuration) {
        console.log('[Consently] Valid consent found');
        applyConsent(existingConsent);
        return;
      }
    }

    // Show banner based on configuration
    if (config.autoShow) {
      if (config.showAfterDelay > 0) {
        setTimeout(showConsentBanner, config.showAfterDelay);
      } else {
        showConsentBanner();
      }
    }
  }

  // Create and show consent banner
  async function showConsentBanner() {
    // Check if banner already exists
    if (document.getElementById('consently-banner')) {
      return;
    }

    // Extract theme values
    const theme = config.theme || {};
    const primaryColor = theme.primaryColor || '#3b82f6';
    const backgroundColor = theme.backgroundColor || '#ffffff';
    const textColor = theme.textColor || '#1f2937';
    const fontFamily = theme.fontFamily || 'system-ui, sans-serif';
    const fontSize = theme.fontSize || 14;
    const borderRadius = theme.borderRadius || 8;
    const zIndex = config.zIndex || 9999;
    
    // Extract button configurations from banner template
    const acceptButton = config.acceptButton || { backgroundColor: primaryColor, textColor: '#ffffff' };
    const rejectButton = config.rejectButton || { backgroundColor: 'transparent', textColor: primaryColor, borderColor: primaryColor };
    const settingsButton = config.settingsButton || { backgroundColor: '#f3f4f6', textColor: textColor };

    // Translate text if needed
    const title = selectedLanguage !== 'en' ? await translateText(config.title, selectedLanguage) : config.title;
    const message = selectedLanguage !== 'en' ? await translateText(config.message, selectedLanguage) : config.message;
    const acceptText = selectedLanguage !== 'en' ? await translateText(config.acceptButton?.text || 'Accept All', selectedLanguage) : (config.acceptButton?.text || 'Accept All');
    const rejectText = selectedLanguage !== 'en' ? await translateText(config.rejectButton?.text || 'Reject All', selectedLanguage) : (config.rejectButton?.text || 'Reject All');
    const settingsText = selectedLanguage !== 'en' ? await translateText(config.settingsButton?.text || 'Cookie Settings', selectedLanguage) : (config.settingsButton?.text || 'Cookie Settings');

    // Create banner container
    const banner = document.createElement('div');
    banner.id = 'consently-banner';
    banner.style.cssText = `
      position: fixed;
      ${config.position === 'top' ? 'top: 0;' : 'bottom: 0;'}
      left: 0;
      right: 0;
      background-color: ${backgroundColor};
      color: ${textColor};
      padding: 24px;
      padding-top: 48px;
      box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.15);
      z-index: ${zIndex};
      font-family: ${fontFamily};
      font-size: ${fontSize}px;
      line-height: 1.5;
      animation: slideUp 0.3s ease-out;
    `;

    // Create banner content
    banner.innerHTML = `
      <style>
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        #consently-banner * {
          box-sizing: border-box;
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
          border-radius: ${acceptButton.borderRadius || borderRadius}px;
        }
        .consently-btn-secondary {
          background-color: ${rejectButton.backgroundColor || 'transparent'};
          color: ${rejectButton.textColor || primaryColor};
          border: 2px solid ${rejectButton.borderColor || primaryColor};
          border-radius: ${rejectButton.borderRadius || borderRadius}px;
        }
        .consently-btn-text {
          background-color: ${settingsButton.backgroundColor || '#f3f4f6'};
          color: ${settingsButton.textColor || textColor};
          border: 2px solid transparent;
          border-radius: ${settingsButton.borderRadius || borderRadius}px;
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
        }
        .consently-message {
          margin: 0;
          opacity: 0.9;
        }
        .consently-logo {
          height: 32px;
          width: auto;
          margin-bottom: 12px;
          display: block;
        }
        .consently-branding {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid rgba(0, 0, 0, 0.1);
          text-align: center;
          font-size: 12px;
          opacity: 0.7;
        }
        .consently-branding a {
          color: inherit;
          text-decoration: none;
          transition: opacity 0.2s;
        }
        .consently-branding a:hover {
          opacity: 1;
          text-decoration: underline;
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
          color: ${textColor};
          cursor: pointer;
          font-size: 16px;
          transition: all 0.2s;
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        }
        .consently-lang-btn-banner:hover {
          background: #f9fafb;
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
          transform: scale(1.05);
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
        .consently-lang-menu-banner::-webkit-scrollbar {
          width: 6px;
        }
        .consently-lang-menu-banner::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        .consently-lang-menu-banner::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .consently-lang-menu-banner::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
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
          .consently-btn {
            flex: 1;
          }
        }
      </style>
      <div class="consently-lang-selector">
        <button id="consently-lang-btn-banner" class="consently-lang-btn-banner" title="${languageLabel(selectedLanguage)}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
          </svg>
        </button>
        <div id="consently-lang-menu-banner" class="consently-lang-menu-banner">
          ${(config.supportedLanguages || ['en', 'hi', 'es', 'fr', 'de']).map(code => `
            <button data-lang="${code}" class="${code === selectedLanguage ? 'active' : ''}">
              <span style="font-size: 16px;">${languageFlag(code)}</span>
              <span>${languageLabel(code)}</span>
            </button>
          `).join('')}
        </div>
      </div>
      <div class="consently-container">
        <div class="consently-content">
          ${theme.logoUrl ? `<img src="${theme.logoUrl}" alt="Logo" class="consently-logo" onerror="this.style.display='none'">` : ''}
          <h3 class="consently-title">${title}</h3>
          <p class="consently-message">${message}</p>
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
      ${config.showBrandingLink !== false ? `
        <div class="consently-branding">
          <a href="https://consently.app" target="_blank" rel="noopener noreferrer">
            Powered by <strong>Consently</strong>
          </a>
        </div>
      ` : ''}
    `;

    document.body.appendChild(banner);

    console.log('[Consently] Banner added to DOM, attaching event listeners...');

    // Add event listeners with error handling
    const acceptBtn = document.getElementById('consently-accept');
    if (acceptBtn) {
      acceptBtn.addEventListener('click', function(e) {
        console.log('[Consently] Accept button clicked');
        e.preventDefault();
        e.stopPropagation();
        handleConsent('accepted', ['necessary', 'analytics', 'marketing', 'preferences']);
      });
      console.log('[Consently] Accept button listener attached');
    } else {
      console.error('[Consently] Accept button not found!');
    }

    const rejectBtn = document.getElementById('consently-reject');
    if (rejectBtn) {
      rejectBtn.addEventListener('click', function(e) {
        console.log('[Consently] Reject button clicked');
        e.preventDefault();
        e.stopPropagation();
        handleConsent('rejected', ['necessary']);
      });
      console.log('[Consently] Reject button listener attached');
    }

    const settingsBtn = document.getElementById('consently-settings');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', function(e) {
        console.log('[Consently] Settings button clicked');
        e.preventDefault();
        e.stopPropagation();
        showSettingsModal();
      });
      console.log('[Consently] Settings button listener attached');
    }

    // Language selector in banner
    const langBtnBanner = document.getElementById('consently-lang-btn-banner');
    const langMenuBanner = document.getElementById('consently-lang-menu-banner');
    
    if (langBtnBanner && langMenuBanner) {
      // Toggle menu
      langBtnBanner.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('[Consently] Language button clicked');
        langMenuBanner.style.display = langMenuBanner.style.display === 'none' || !langMenuBanner.style.display ? 'block' : 'none';
      });
      
      // Close on outside click
      document.addEventListener('click', function(e) {
        if (!langBtnBanner.contains(e.target) && !langMenuBanner.contains(e.target)) {
          langMenuBanner.style.display = 'none';
        }
      });
      
      // Language selection
      langMenuBanner.querySelectorAll('button[data-lang]').forEach(function(btn) {
        btn.addEventListener('click', async function(e) {
          e.preventDefault();
          e.stopPropagation();
          const newLang = this.getAttribute('data-lang');
          console.log('[Consently] Language changed to:', newLang);
          if (newLang !== selectedLanguage) {
            selectedLanguage = newLang;
            langMenuBanner.style.display = 'none';
            
            // Remove existing banner and show new one with selected language
            banner.remove();
            await showConsentBanner();
          }
        });
      });
      
      console.log('[Consently] Language selector listeners attached');
    }
  }

  // Show detailed settings modal
  async function showSettingsModal() {
    console.log('[Consently] Opening settings modal...');
    
    try {
      // Remove existing modal if any
      const existing = document.getElementById('consently-modal');
      if (existing) {
        console.log('[Consently] Removing existing modal');
        existing.remove();
      }

      // Hide banner if showing (will be removed after saving)
      const banner = document.getElementById('consently-banner');
      if (banner) {
        console.log('[Consently] Hiding banner');
        banner.style.display = 'none';
      }

      // Translate modal text with error handling
      console.log('[Consently] Translating modal text to:', selectedLanguage);
      const modalTitle = selectedLanguage !== 'en' ? await translateText('Cookie Settings', selectedLanguage) : 'Cookie Settings';
      const modalDescription = selectedLanguage !== 'en' ? await translateText('Manage your cookie preferences. Some cookies are necessary for the website to function.', selectedLanguage) : 'Manage your cookie preferences. Some cookies are necessary for the website to function.';
      const saveButtonText = selectedLanguage !== 'en' ? await translateText('Save Preferences', selectedLanguage) : 'Save Preferences';
      const cancelButtonText = selectedLanguage !== 'en' ? await translateText('Cancel', selectedLanguage) : 'Cancel';
      const requiredLabel = selectedLanguage !== 'en' ? await translateText('Required', selectedLanguage) : 'Required';
      console.log('[Consently] Translation complete');

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

    const categories = [
      { id: 'necessary', name: selectedLanguage !== 'en' ? await translateText('Necessary', selectedLanguage) : 'Necessary', description: selectedLanguage !== 'en' ? await translateText('Essential for website functionality', selectedLanguage) : 'Essential for website functionality', required: true },
      { id: 'analytics', name: selectedLanguage !== 'en' ? await translateText('Analytics', selectedLanguage) : 'Analytics', description: selectedLanguage !== 'en' ? await translateText('Help us understand visitor behavior', selectedLanguage) : 'Help us understand visitor behavior', required: false },
      { id: 'marketing', name: selectedLanguage !== 'en' ? await translateText('Marketing', selectedLanguage) : 'Marketing', description: selectedLanguage !== 'en' ? await translateText('Used for targeted advertising', selectedLanguage) : 'Used for targeted advertising', required: false },
      { id: 'preferences', name: selectedLanguage !== 'en' ? await translateText('Preferences', selectedLanguage) : 'Preferences', description: selectedLanguage !== 'en' ? await translateText('Remember your settings', selectedLanguage) : 'Remember your settings', required: false }
    ];

    let categoriesHTML = '';
    const availableCategories = config.categories || ['necessary', 'analytics', 'marketing', 'preferences'];
    
    categories.forEach(cat => {
      if (availableCategories.includes(cat.id) || cat.required) {
        categoriesHTML += `
          <div style="padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 12px;">
            <label style="display: flex; align-items: start; gap: 12px; cursor: ${cat.required ? 'not-allowed' : 'pointer'};">
              <input type="checkbox" id="cat-${cat.id}" 
                     ${cat.required ? 'checked disabled' : ''} 
                     style="margin-top: 4px; width: 18px; height: 18px;">
              <div style="flex: 1;">
                <div style="font-weight: 600; margin-bottom: 4px;">
                  ${cat.name} ${cat.required ? '<span style="color: #3b82f6; font-size: 12px;">(' + requiredLabel + ')</span>' : ''}
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
        #consently-lang-menu button:hover {
          background: #f0f9ff !important;
        }
        .consently-modal-logo {
          height: 40px;
          width: auto;
          margin-bottom: 16px;
          display: block;
        }
      </style>
      <div style="background-color: white; border-radius: 12px; max-width: 500px; width: 100%; max-height: 80vh; overflow-y: auto; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;">
        ${theme.logoUrl ? `<img src="${theme.logoUrl}" alt="Logo" class="consently-modal-logo" onerror="this.style.display='none'">` : ''}
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h2 style="margin: 0; font-size: 24px; color: #1f2937;">${modalTitle}</h2>
          <div style="position: relative;">
            <button id="consently-lang-btn" style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; border: none; border-radius: 8px; background: #3b82f6; color: #fff; cursor: pointer; font-weight: 600; font-size: 14px; transition: all 0.2s;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              <span id="consently-lang-label">${languageLabel(selectedLanguage)}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="opacity: 0.8;">
                <path d="M7 10l5 5 5-5z"/>
              </svg>
            </button>
            <div id="consently-lang-menu" style="display: none; position: absolute; right: 0; margin-top: 8px; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0,0,0,.15); overflow: hidden; z-index: 10; min-width: 180px; max-height: 300px; overflow-y: auto;">
              ${(config.supportedLanguages || ['en', 'hi', 'es', 'fr', 'de']).map(code => `
                <button data-lang="${code}" style="display: flex; gap: 10px; align-items: center; white-space: nowrap; width: 100%; text-align: left; padding: 12px 16px; border: none; background: ${code === selectedLanguage ? '#f0f9ff' : '#fff'}; cursor: pointer; font-size: 14px; font-weight: ${code === selectedLanguage ? '600' : '500'}; color: ${code === selectedLanguage ? '#0369a1' : '#374151'}; transition: all 0.15s;">
                  <span style="font-size: 18px;">${languageFlag(code)}</span>
                  <span>${languageLabel(code)}</span>
                  ${code === selectedLanguage ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="margin-left: auto;"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>' : ''}
                </button>
              `).join('')}
            </div>
          </div>
        </div>
        <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 14px;">
          ${modalDescription}
        </p>
        ${categoriesHTML}
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

      console.log('[Consently] Appending modal to body');
      document.body.appendChild(modal);
      console.log('[Consently] Settings modal opened successfully');

    // Language selector event listeners
    const langBtn = document.getElementById('consently-lang-btn');
    const langMenu = document.getElementById('consently-lang-menu');
    
    if (langBtn && langMenu) {
      // Toggle menu
      langBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        langMenu.style.display = langMenu.style.display === 'none' || !langMenu.style.display ? 'block' : 'none';
      });
      
      // Close on outside click
      document.addEventListener('click', function(e) {
        if (!langBtn.contains(e.target) && !langMenu.contains(e.target)) {
          langMenu.style.display = 'none';
        }
      });
      
      // Language selection
      langMenu.querySelectorAll('button[data-lang]').forEach(function(btn) {
        btn.addEventListener('click', async function() {
          const newLang = this.getAttribute('data-lang');
          if (newLang !== selectedLanguage) {
            selectedLanguage = newLang;
            langMenu.style.display = 'none';
            
            // Reload modal with new language
            modal.remove();
            await showSettingsModal();
          }
        });
      });
    }

    // Event listeners
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
      modal.remove();
      handleConsent('partial', selectedCategories);
    });

    document.getElementById('consently-close-modal').addEventListener('click', function() {
      modal.remove();
    });

      modal.addEventListener('click', function(e) {
        if (e.target === modal) {
          modal.remove();
        }
      });
    } catch (error) {
      console.error('[Consently] Fatal error in showSettingsModal:', error);
      console.error('[Consently] Stack trace:', error.stack);
      // Create a simple fallback modal without translations
      createFallbackModal();
    }
  }

  // Fallback modal for when main modal fails
  function createFallbackModal() {
    console.log('[Consently] Creating fallback modal');
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
    `;

    const theme = config.theme || {};
    modal.innerHTML = `
      <div style="background-color: white; border-radius: 12px; max-width: 500px; width: 100%; padding: 24px; font-family: system-ui, sans-serif;">
        <h2 style="margin: 0 0 16px 0; font-size: 24px; color: #1f2937;">Cookie Settings</h2>
        <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 14px;">Manage your cookie preferences.</p>
        
        <div style="padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 12px;">
          <label style="display: flex; align-items: start; gap: 12px;">
            <input type="checkbox" id="cat-necessary" checked disabled style="margin-top: 4px; width: 18px; height: 18px;">
            <div style="flex: 1;">
              <div style="font-weight: 600; margin-bottom: 4px;">Necessary <span style="color: #3b82f6; font-size: 12px;">(Required)</span></div>
              <div style="font-size: 13px; color: #6b7280;">Essential for website functionality</div>
            </div>
          </label>
        </div>
        
        <div style="padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 12px;">
          <label style="display: flex; align-items: start; gap: 12px; cursor: pointer;">
            <input type="checkbox" id="cat-analytics" style="margin-top: 4px; width: 18px; height: 18px;">
            <div style="flex: 1;">
              <div style="font-weight: 600; margin-bottom: 4px;">Analytics</div>
              <div style="font-size: 13px; color: #6b7280;">Help us understand visitor behavior</div>
            </div>
          </label>
        </div>
        
        <div style="padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 12px;">
          <label style="display: flex; align-items: start; gap: 12px; cursor: pointer;">
            <input type="checkbox" id="cat-marketing" style="margin-top: 4px; width: 18px; height: 18px;">
            <div style="flex: 1;">
              <div style="font-weight: 600; margin-bottom: 4px;">Marketing</div>
              <div style="font-size: 13px; color: #6b7280;">Used for targeted advertising</div>
            </div>
          </label>
        </div>
        
        <div style="padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 12px;">
          <label style="display: flex; align-items: start; gap: 12px; cursor: pointer;">
            <input type="checkbox" id="cat-preferences" style="margin-top: 4px; width: 18px; height: 18px;">
            <div style="flex: 1;">
              <div style="font-weight: 600; margin-bottom: 4px;">Preferences</div>
              <div style="font-size: 13px; color: #6b7280;">Remember your settings</div>
            </div>
          </label>
        </div>
        
        <div style="display: flex; gap: 12px; margin-top: 24px;">
          <button id="fallback-save" style="flex: 1; padding: 12px 24px; border-radius: 8px; border: none; background: ${theme.primaryColor || '#3b82f6'}; color: white; font-weight: 600; cursor: pointer;">Save Preferences</button>
          <button id="fallback-close" style="flex: 1; padding: 12px 24px; border-radius: 8px; border: 2px solid ${theme.primaryColor || '#3b82f6'}; background: white; color: ${theme.primaryColor || '#3b82f6'}; font-weight: 600; cursor: pointer;">Cancel</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('fallback-save').addEventListener('click', function() {
      const selectedCategories = ['necessary'];
      if (document.getElementById('cat-analytics').checked) selectedCategories.push('analytics');
      if (document.getElementById('cat-marketing').checked) selectedCategories.push('marketing');
      if (document.getElementById('cat-preferences').checked) selectedCategories.push('preferences');
      modal.remove();
      handleConsent('partial', selectedCategories);
    });

    document.getElementById('fallback-close').addEventListener('click', function() {
      modal.remove();
    });

    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  // Handle consent decision
  function handleConsent(status, categories) {
    const consentData = {
      status: status,
      categories: categories,
      timestamp: Date.now(),
      widgetId: widgetId,
      domain: window.location.hostname
    };

    // Save consent to cookie
    const consentDuration = config.consentDuration || 365;
    CookieManager.set('consently_consent', consentData, consentDuration);

    // Send consent to server
    sendConsentToServer(consentData);

    // Apply consent
    applyConsent(consentData);

    // Remove banner
    const banner = document.getElementById('consently-banner');
    if (banner) {
      banner.style.animation = 'slideUp 0.3s ease-out reverse';
      setTimeout(() => banner.remove(), 300);
    }

    // Remove modal if open
    const modal = document.getElementById('consently-modal');
    if (modal) {
      modal.remove();
    }

    // Show cookie preferences icon
    showCookiePreferencesIcon();

    // Trigger custom event
    window.dispatchEvent(new CustomEvent('consentlyConsent', { detail: consentData }));
    
    console.log('[Consently] Consent recorded:', status, categories);
  }


  // Send consent to server for logging
  function sendConsentToServer(consentData) {
    const apiBase = config.apiBase || window.location.origin;
    const apiEndpoint = config.apiEndpoint || '/api/consent/record';
    const apiUrl = apiBase + apiEndpoint;
    
    const data = {
      consentId: 'cns_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      widgetId: widgetId,
      status: consentData.status,
      categories: consentData.categories,
      deviceType: /Mobile|Android|iPhone|iPad|Tablet/i.test(navigator.userAgent) ? 
                  (/Tablet|iPad/i.test(navigator.userAgent) ? 'Tablet' : 'Mobile') : 'Desktop',
      userAgent: navigator.userAgent,
      language: navigator.language || 'en'
    };

    console.log('[Consently] Sending consent to:', apiUrl);
    console.log('[Consently] Payload:', JSON.stringify(data, null, 2));

    // Always use fetch for better error handling and debugging
    fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      keepalive: true // Important for page unload scenarios
    })
    .then(function(response) {
      console.log('[Consently] Response status:', response.status);
      if (!response.ok) {
        console.error('[Consently] Server returned error:', response.status, response.statusText);
      }
      return response.json();
    })
    .then(function(result) {
      console.log('[Consently] Server response:', result);
      if (result && !result.success) {
        console.error('[Consently] Failed to record consent:', result.error);
        if (result.details) {
          console.error('[Consently] Error details:', result.details);
        }
      }
    })
    .catch(function(err) {
      console.error('[Consently] Failed to record consent:', err);
      console.error('[Consently] Error details:', err.message, err.stack);
    });
  }

  // Apply consent (enable/disable tracking scripts)
  function applyConsent(consentData) {
    console.log('[Consently] Applying consent:', consentData);

    const blockScripts = config.blockScripts !== undefined ? config.blockScripts : false;
    
    if (blockScripts) {
      // Enable Google Analytics if analytics consent given
      if (consentData.categories.includes('analytics') && window.gtag) {
        window.gtag('consent', 'update', {
          'analytics_storage': 'granted'
        });
      }

      // Enable advertising if marketing consent given
      if (consentData.categories.includes('marketing') && window.gtag) {
        window.gtag('consent', 'update', {
          'ad_storage': 'granted',
          'ad_user_data': 'granted',
          'ad_personalization': 'granted'
        });
      }
    }

    // Store in localStorage for easier access
    try {
      localStorage.setItem('consently_consent', JSON.stringify(consentData));
    } catch (e) {
      console.warn('[Consently] localStorage not available');
    }

    // Show cookie preferences icon after applying consent
    showCookiePreferencesIcon();
  }

  // Show cookie preferences icon (floating button)
  function showCookiePreferencesIcon() {
    // Remove existing icon if any
    const existing = document.getElementById('consently-preferences-icon');
    if (existing) {
      return; // Already showing
    }

    const theme = config.theme || {};
    const primaryColor = theme.primaryColor || '#3b82f6';
    const zIndex = (config.zIndex || 9999) - 1;

    const icon = document.createElement('button');
    icon.id = 'consently-preferences-icon';
    icon.setAttribute('aria-label', 'Manage cookie preferences');
    icon.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background-color: ${primaryColor};
      color: white;
      border: none;
      font-size: 28px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: ${zIndex};
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.3s ease;
    `;
    icon.innerHTML = '🍪';
    icon.title = 'Manage cookie preferences';

    // Hover effect
    icon.addEventListener('mouseenter', function() {
      this.style.transform = 'scale(1.1)';
      this.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.2)';
    });
    icon.addEventListener('mouseleave', function() {
      this.style.transform = 'scale(1)';
      this.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    });

    // Click to reopen settings
    icon.addEventListener('click', function() {
      console.log('[Consently] Cookie icon clicked - opening settings modal');
      try {
        showSettingsModal();
      } catch (error) {
        console.error('[Consently] Error opening settings modal:', error);
        alert('Failed to open cookie settings. Please refresh the page.');
      }
    });

    document.body.appendChild(icon);
  }

  // Expose public API
  window.Consently = {
    showBanner: showConsentBanner,
    showSettings: showSettingsModal,
    getConsent: function() {
      return CookieManager.get('consently_consent');
    },
    revokeConsent: function() {
      CookieManager.delete('consently_consent');
      try {
        localStorage.removeItem('consently_consent');
      } catch (e) {}
      // Remove icon
      const icon = document.getElementById('consently-preferences-icon');
      if (icon) icon.remove();
      showConsentBanner();
    },
    updateConsent: function(categories) {
      handleConsent('partial', categories);
    }
  };

  // Initialize widget when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
