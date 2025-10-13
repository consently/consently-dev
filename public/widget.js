/**
 * Consently Cookie Consent Widget
 * Standalone embeddable widget (no dependencies)
 * DPDPA 2023 & GDPR Compliant
 */

(function() {
  'use strict';

  // Default configuration
  const defaultConfig = {
    widgetId: '',
    domain: '',
    categories: ['necessary'],
    behavior: 'explicit',
    consentDuration: 365,
    blockScripts: true,
    respectDNT: false,
    apiEndpoint: '/api/consent/record',
    position: 'bottom',
    primaryColor: '#3b82f6',
    textColor: '#1f2937',
    backgroundColor: '#ffffff',
    title: 'We value your privacy',
    message: 'We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.',
    acceptText: 'Accept All',
    rejectText: 'Reject All',
    settingsText: 'Cookie Settings'
  };

  // Merge user config with defaults
  let config = Object.assign({}, defaultConfig, window.consentlyConfig || {});
  let configLoaded = false;

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
    if (consentAge < config.consentDuration) {
      console.log('[Consently] Valid consent found');
      applyConsent(existingConsent);
      return;
    }
  }

  // Create and show consent banner
  function showConsentBanner() {
    // Check if banner already exists
    if (document.getElementById('consently-banner')) {
      return;
    }

    // Create banner container
    const banner = document.createElement('div');
    banner.id = 'consently-banner';
    banner.style.cssText = `
      position: fixed;
      ${config.position === 'top' ? 'top: 0;' : 'bottom: 0;'}
      left: 0;
      right: 0;
      background-color: ${config.backgroundColor};
      color: ${config.textColor};
      padding: 24px;
      box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.15);
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      font-size: 14px;
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
          background-color: ${config.primaryColor};
          color: white;
        }
        .consently-btn-secondary {
          background-color: transparent;
          color: ${config.primaryColor};
          border: 2px solid ${config.primaryColor};
        }
        .consently-btn-text {
          background-color: transparent;
          color: ${config.textColor};
          text-decoration: underline;
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
      <div class="consently-container">
        <div class="consently-content">
          <h3 class="consently-title">${config.title}</h3>
          <p class="consently-message">${config.message}</p>
        </div>
        <div class="consently-actions">
          <button id="consently-accept" class="consently-btn consently-btn-primary">
            ${config.acceptText}
          </button>
          <button id="consently-reject" class="consently-btn consently-btn-secondary">
            ${config.rejectText}
          </button>
          <button id="consently-settings" class="consently-btn consently-btn-text">
            ${config.settingsText}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(banner);

    // Add event listeners
    document.getElementById('consently-accept').addEventListener('click', function() {
      handleConsent('accepted', config.categories);
    });

    document.getElementById('consently-reject').addEventListener('click', function() {
      handleConsent('rejected', ['necessary']);
    });

    document.getElementById('consently-settings').addEventListener('click', function() {
      showSettingsModal();
    });
  }

  // Show detailed settings modal
  function showSettingsModal() {
    // Remove existing modal if any
    const existing = document.getElementById('consently-modal');
    if (existing) {
      existing.remove();
    }

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
      { id: 'necessary', name: 'Necessary', description: 'Essential for website functionality', required: true },
      { id: 'analytics', name: 'Analytics', description: 'Help us understand visitor behavior', required: false },
      { id: 'marketing', name: 'Marketing', description: 'Used for targeted advertising', required: false },
      { id: 'preferences', name: 'Preferences', description: 'Remember your settings', required: false }
    ];

    let categoriesHTML = '';
    categories.forEach(cat => {
      if (config.categories.includes(cat.id) || cat.required) {
        categoriesHTML += `
          <div style="padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 12px;">
            <label style="display: flex; align-items: start; gap: 12px; cursor: ${cat.required ? 'not-allowed' : 'pointer'};">
              <input type="checkbox" id="cat-${cat.id}" 
                     ${cat.required ? 'checked disabled' : ''} 
                     style="margin-top: 4px; width: 18px; height: 18px;">
              <div style="flex: 1;">
                <div style="font-weight: 600; margin-bottom: 4px;">
                  ${cat.name} ${cat.required ? '<span style="color: #3b82f6; font-size: 12px;">(Required)</span>' : ''}
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
      </style>
      <div style="background-color: white; border-radius: 12px; max-width: 500px; width: 100%; max-height: 80vh; overflow-y: auto; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;">
        <h2 style="margin: 0 0 16px 0; font-size: 24px; color: #1f2937;">Cookie Settings</h2>
        <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 14px;">
          Manage your cookie preferences. Some cookies are necessary for the website to function.
        </p>
        ${categoriesHTML}
        <div style="display: flex; gap: 12px; margin-top: 24px; flex-wrap: wrap;">
          <button id="consently-save-settings" class="consently-btn consently-btn-primary" style="flex: 1;">
            Save Preferences
          </button>
          <button id="consently-close-modal" class="consently-btn consently-btn-secondary" style="flex: 1;">
            Cancel
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

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
  }

  // Handle consent decision
  function handleConsent(status, categories) {
    const consentData = {
      status: status,
      categories: categories,
      timestamp: Date.now(),
      widgetId: config.widgetId,
      domain: window.location.hostname
    };

    // Save consent to cookie
    CookieManager.set('consently_consent', consentData, config.consentDuration);

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

    // Trigger custom event
    window.dispatchEvent(new CustomEvent('consentlyConsent', { detail: consentData }));
  }

  // Fetch configuration from server
  async function fetchConfigFromServer() {
    if (!config.widgetId) {
      console.error('[Consently] No widget ID provided');
      return false;
    }

    try {
      const response = await fetch(
        window.location.origin + '/api/cookies/widget-public/' + config.widgetId
      );
      
      if (!response.ok) {
        console.error('[Consently] Failed to fetch config:', response.status);
        return false;
      }

      const serverConfig = await response.json();
      
      // Merge server config with local config (local takes precedence)
      config = Object.assign({}, defaultConfig, serverConfig, window.consentlyConfig || {});
      configLoaded = true;
      
      console.log('[Consently] Configuration loaded from server');
      return true;
    } catch (error) {
      console.error('[Consently] Error fetching config:', error);
      return false;
    }
  }

  // Send consent to server for logging
  function sendConsentToServer(consentData) {
    const data = {
      consentId: 'cns_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      widgetId: consentData.widgetId,
      status: consentData.status,
      categories: consentData.categories,
      deviceType: /Mobile|Android|iPhone|iPad|Tablet/i.test(navigator.userAgent) ? 
                  (/Tablet|iPad/i.test(navigator.userAgent) ? 'Tablet' : 'Mobile') : 'Desktop',
      userAgent: navigator.userAgent,
      language: navigator.language || 'en'
    };

    // Use sendBeacon if available
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      navigator.sendBeacon(window.location.origin + config.apiEndpoint, blob);
    } else {
      // Fallback to fetch
      fetch(window.location.origin + config.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).catch(function(err) {
        console.error('[Consently] Failed to record consent:', err);
      });
    }
  }

  // Apply consent (enable/disable tracking scripts)
  function applyConsent(consentData) {
    console.log('[Consently] Applying consent:', consentData);

    if (config.blockScripts) {
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
  }

  // Initialize widget
  async function init() {
    // Fetch config from server if widget ID is provided
    if (config.widgetId) {
      await fetchConfigFromServer();
    }

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', showConsentBanner);
    } else {
      showConsentBanner();
    }
  }

  // Expose public API
  window.Consently = {
    showBanner: showConsentBanner,
    getConsent: function() {
      return CookieManager.get('consently_consent');
    },
    revokeConsent: function() {
      CookieManager.delete('consently_consent');
      localStorage.removeItem('consently_consent');
      showConsentBanner();
    },
    updateConsent: function(categories) {
      handleConsent('partial', categories);
    }
  };

  // Initialize
  init();

})();
