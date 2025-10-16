/**
 * Consently DPDPA Consent Widget v1.0
 * Production-ready embeddable widget for DPDPA 2023 compliance
 * Displays processing activities and collects granular consent
 * 
 * Usage: <script src="https://your-domain.com/dpdpa-widget.js" data-dpdpa-widget-id="YOUR_WIDGET_ID"></script>
 */

(function() {
  'use strict';

  // Get widget ID from script tag
  const currentScript = document.currentScript || document.querySelector('script[data-dpdpa-widget-id]');
  const widgetId = currentScript ? currentScript.getAttribute('data-dpdpa-widget-id') : null;
  
  if (!widgetId) {
    console.error('[Consently DPDPA] Error: data-dpdpa-widget-id attribute is required');
    console.error('[Consently DPDPA] Usage: <script src="https://your-domain.com/dpdpa-widget.js" data-dpdpa-widget-id="YOUR_WIDGET_ID"></script>');
    return;
  }

  console.log('[Consently DPDPA] Initializing widget with ID:', widgetId);

  // Global configuration
  let config = null;
  let activities = [];
  let activityConsents = {};

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
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'default'
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

  // Create and show consent widget
  function showConsentWidget() {
    if (document.getElementById('consently-dpdpa-widget')) {
      return; // Already shown
    }

    const theme = config.theme || {};
    const primaryColor = theme.primaryColor || '#3b82f6';
    const backgroundColor = theme.backgroundColor || '#ffffff';
    const textColor = theme.textColor || '#1f2937';
    const borderRadius = theme.borderRadius || 12;
    const fontFamily = theme.fontFamily || 'system-ui, sans-serif';
    const fontSize = theme.fontSize || 14;

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
      max-width: 700px;
      max-height: 90vh;
      width: 90%;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transform: scale(0.9);
      opacity: 0;
      transition: all 0.3s ease;
    `;

    // Build widget HTML
    widget.innerHTML = `
      <div style="padding: 32px; overflow-y: auto; flex: 1;">
        <div style="display: flex; align-items: start; justify-content: space-between; margin-bottom: 24px;">
          <div style="flex: 1;">
            <h2 style="font-size: 24px; font-weight: 700; margin: 0 0 12px 0; color: ${textColor};">
              ${escapeHtml(config.title)}
            </h2>
            <p style="font-size: 15px; line-height: 1.6; color: ${textColor}; opacity: 0.8; margin: 0;">
              ${escapeHtml(config.message)}
            </p>
          </div>
          <button id="dpdpa-close-btn" style="background: none; border: none; cursor: pointer; padding: 8px; margin-left: 16px; opacity: 0.5; transition: opacity 0.2s;" aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 16px; font-weight: 600; margin: 0 0 16px 0; color: ${textColor};">
            Processing Activities
          </h3>
          <p style="font-size: 13px; color: ${textColor}; opacity: 0.7; margin: 0 0 16px 0;">
            We process your personal data for the following purposes. You can accept or reject each activity individually.
          </p>
          <div id="dpdpa-activities-list" style="display: flex; flex-direction: column; gap: 12px;">
            ${activities.map((activity, index) => `
              <div class="dpdpa-activity-item" style="border: 2px solid #e5e7eb; border-radius: 8px; padding: 16px; transition: border-color 0.2s;">
                <div style="display: flex; align-items: start; justify-content: space-between;">
                  <div style="flex: 1; padding-right: 16px;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                      <h4 style="font-size: 15px; font-weight: 600; margin: 0; color: ${textColor};">
                        ${escapeHtml(activity.activity_name)}
                      </h4>
                      <span style="font-size: 11px; padding: 2px 8px; background: #e0e7ff; color: #4338ca; border-radius: 4px; font-weight: 500;">
                        ${escapeHtml(activity.industry || 'General')}
                      </span>
                    </div>
                    <p style="font-size: 13px; line-height: 1.5; color: ${textColor}; opacity: 0.8; margin: 0 0 12px 0;">
                      ${escapeHtml(activity.purpose)}
                    </p>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; font-size: 12px;">
                      <div>
                        <div style="font-weight: 600; color: ${textColor}; opacity: 0.7; margin-bottom: 4px;">Data Attributes</div>
                        <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                          ${activity.data_attributes.slice(0, 3).map(attr => `
                            <span style="padding: 2px 8px; background: #f3f4f6; color: ${textColor}; border-radius: 4px; font-size: 11px;">
                              ${escapeHtml(attr)}
                            </span>
                          `).join('')}
                          ${activity.data_attributes.length > 3 ? `
                            <span style="padding: 2px 8px; background: #f3f4f6; color: ${textColor}; border-radius: 4px; font-size: 11px;">
                              +${activity.data_attributes.length - 3} more
                            </span>
                          ` : ''}
                        </div>
                      </div>
                      <div>
                        <div style="font-weight: 600; color: ${textColor}; opacity: 0.7; margin-bottom: 4px;">Retention Period</div>
                        <div style="color: ${textColor}; opacity: 0.9;">${escapeHtml(activity.retention_period)}</div>
                      </div>
                    </div>
                  </div>
                  <div style="display: flex; flex-direction: column; gap: 8px;">
                    <button class="dpdpa-activity-accept" data-activity-id="${activity.id}" style="padding: 8px 16px; background: ${primaryColor}; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; transition: opacity 0.2s; white-space: nowrap;">
                      Accept
                    </button>
                    <button class="dpdpa-activity-reject" data-activity-id="${activity.id}" style="padding: 8px 16px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; transition: opacity 0.2s; white-space: nowrap;">
                      Reject
                    </button>
                  </div>
                </div>
                <input type="hidden" class="activity-consent-status" data-activity-id="${activity.id}" value="">
              </div>
            `).join('')}
          </div>
        </div>

        ${config.showDataSubjectsRights ? `
          <div style="background: #f9fafb; border-left: 4px solid ${primaryColor}; padding: 16px; border-radius: 6px; margin-bottom: 24px;">
            <h4 style="font-size: 14px; font-weight: 600; margin: 0 0 8px 0; color: ${textColor};">Your Data Rights</h4>
            <p style="font-size: 12px; line-height: 1.5; color: ${textColor}; opacity: 0.8; margin: 0;">
              Under DPDPA 2023, you have the right to access, correct, and delete your personal data. You can also withdraw your consent at any time.
              Contact us to exercise these rights.
            </p>
          </div>
        ` : ''}
      </div>

      <div style="padding: 20px 32px; border-top: 1px solid #e5e7eb; display: flex; gap: 12px; justify-content: flex-end; background: #f9fafb;">
        <button id="dpdpa-reject-all-btn" style="padding: 12px 24px; background: white; color: ${textColor}; border: 2px solid #e5e7eb; border-radius: 8px; cursor: pointer; font-size: 15px; font-weight: 600; transition: all 0.2s;">
          ${escapeHtml(config.rejectButtonText)}
        </button>
        <button id="dpdpa-accept-all-btn" style="padding: 12px 24px; background: ${primaryColor}; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 15px; font-weight: 600; transition: all 0.2s; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          ${escapeHtml(config.acceptButtonText)}
        </button>
      </div>
    `;

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
  }

  // Attach event listeners
  function attachEventListeners(overlay, widget) {
    // Close button
    const closeBtn = widget.querySelector('#dpdpa-close-btn');
    closeBtn.addEventListener('click', () => {
      hideWidget(overlay);
    });

    // Accept individual activity
    const acceptBtns = widget.querySelectorAll('.dpdpa-activity-accept');
    acceptBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        const activityId = this.getAttribute('data-activity-id');
        setActivityConsent(activityId, 'accepted');
        updateActivityUI(activityId, 'accepted');
      });
    });

    // Reject individual activity
    const rejectBtns = widget.querySelectorAll('.dpdpa-activity-reject');
    rejectBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        const activityId = this.getAttribute('data-activity-id');
        setActivityConsent(activityId, 'rejected');
        updateActivityUI(activityId, 'rejected');
      });
    });

    // Accept all button
    const acceptAllBtn = widget.querySelector('#dpdpa-accept-all-btn');
    acceptAllBtn.addEventListener('click', () => {
      handleAcceptAll(overlay);
    });

    // Reject all button
    const rejectAllBtn = widget.querySelector('#dpdpa-reject-all-btn');
    rejectAllBtn.addEventListener('click', () => {
      handleRejectAll(overlay);
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

  // Handle accept all
  async function handleAcceptAll(overlay) {
    activities.forEach(activity => {
      setActivityConsent(activity.id, 'accepted');
    });
    await saveConsent('accepted', overlay);
  }

  // Handle reject all
  async function handleRejectAll(overlay) {
    activities.forEach(activity => {
      setActivityConsent(activity.id, 'rejected');
    });
    await saveConsent('rejected', overlay);
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
    widget.style.transform = 'scale(0.9)';
    widget.style.opacity = '0';
    
    setTimeout(() => {
      document.body.removeChild(overlay);
    }, 300);
  }

  // Escape HTML to prevent XSS
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
    }
  };

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
