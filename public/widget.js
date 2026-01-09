/**
 * Consently Cookie Consent Widget v4.0 - AUTO SCRIPT BLOCKING
 * Production-ready embeddable widget (no dependencies)
 * DPDPA 2023 & GDPR Compliant
 * 
 * Features:
 * - TRUE auto-blocking via MutationObserver + Monkey Patching
 * - Pattern-based detection of known tracking scripts
 * - Script queue for blocked scripts until consent
 * 
 * Usage: <script src="https://your-domain.com/widget.js" data-consently-id="YOUR_WIDGET_ID"></script>
 */

(function () {
  'use strict';

  // Get widget ID from script tag
  const currentScript = document.currentScript || document.querySelector('script[data-consently-id]');
  const widgetId = currentScript ? currentScript.getAttribute('data-consently-id') : null;

  if (!widgetId) {
    console.error('[Consently] Error: data-consently-id attribute is required');
    return;
  }

  console.log('[Consently] Initializing widget v4.0 with ID:', widgetId);

  // ============================================================================
  // AUTO SCRIPT BLOCKING - MutationObserver + Monkey Patching
  // ============================================================================

  // Known tracking script patterns (domain patterns and script names)
  const TRACKING_SCRIPT_PATTERNS = {
    analytics: [
      // Google Analytics
      /google-analytics\.com/i,
      /googletagmanager\.com/i,
      /gtag\/js/i,
      /analytics\.js/i,
      /ga\.js/i,
      // Mixpanel
      /mixpanel\.com/i,
      /cdn\.mxpnl\.com/i,
      // Segment
      /segment\.com/i,
      /segment\.io/i,
      /cdn\.segment\.com/i,
      // Amplitude
      /amplitude\.com/i,
      /cdn\.amplitude\.com/i,
      // Heap
      /heap-analytics\.com/i,
      /heapanalytics\.com/i,
      // Hotjar
      /hotjar\.com/i,
      /static\.hotjar\.com/i,
      // Clarity (Microsoft)
      /clarity\.ms/i,
      // Plausible
      /plausible\.io/i,
      // Matomo/Piwik
      /matomo\.js/i,
      /piwik\.js/i,
      // PostHog
      /posthog\.com/i,
      /app\.posthog\.com/i,
      // Clicky
      /static\.getclicky\.com/i,
      // Fathom
      /usefathom\.com/i,
      // Simple Analytics
      /simpleanalytics\.com/i,
    ],
    marketing: [
      // Facebook/Meta Pixel
      /connect\.facebook\.net/i,
      /facebook\.com\/tr/i,
      /fbevents\.js/i,
      /fbq\(/i,
      // Google Ads
      /googleadservices\.com/i,
      /googlesyndication\.com/i,
      /googleads\.g\.doubleclick\.net/i,
      /pagead2\.googlesyndication\.com/i,
      // Twitter/X
      /static\.ads-twitter\.com/i,
      /platform\.twitter\.com/i,
      /analytics\.twitter\.com/i,
      // LinkedIn
      /snap\.licdn\.com/i,
      /platform\.linkedin\.com/i,
      /linkedin\.com\/px/i,
      // Pinterest
      /pintrk/i,
      /assets\.pinterest\.com/i,
      // TikTok
      /analytics\.tiktok\.com/i,
      /tiktok\.com\/i18n/i,
      // Snapchat
      /sc-static\.net/i,
      // Criteo
      /static\.criteo\.net/i,
      /criteo\.com/i,
      // Taboola
      /cdn\.taboola\.com/i,
      // Outbrain
      /widgets\.outbrain\.com/i,
      // AdRoll
      /d\.adroll\.com/i,
      // Bing Ads
      /bat\.bing\.com/i,
      // Yahoo
      /s\.yimg\.com/i,
      // Reddit
      /www\.redditstatic\.com\/ads/i,
      // Quora
      /q\.quora\.com/i,
    ],
    social: [
      // Facebook SDK
      /connect\.facebook\.net\/.*\/sdk\.js/i,
      /facebook\.com\/plugins/i,
      // Twitter widgets
      /platform\.twitter\.com\/widgets/i,
      // LinkedIn widgets
      /platform\.linkedin\.com\/in\.js/i,
      // Pinterest widgets
      /assets\.pinterest\.com\/js\/pinit/i,
      // Instagram embed
      /instagram\.com\/embed/i,
      // YouTube embed tracking
      /youtube\.com\/iframe_api/i,
      // Disqus
      /disqus\.com/i,
      // ShareThis
      /sharethis\.com/i,
      // AddThis
      /addthis\.com/i,
      // AddToAny
      /addtoany\.com/i,
    ],
    preferences: [
      // Intercom
      /intercom\.io/i,
      /widget\.intercom\.io/i,
      // Drift
      /js\.driftt\.com/i,
      /drift\.com/i,
      // Zendesk
      /static\.zdassets\.com/i,
      /zendesk\.com/i,
      // Freshdesk
      /freshdesk\.com/i,
      // Crisp
      /client\.crisp\.chat/i,
      // Tawk.to
      /embed\.tawk\.to/i,
      // LiveChat
      /cdn\.livechatinc\.com/i,
      // Olark
      /static\.olark\.com/i,
      // HubSpot
      /js\.hs-scripts\.com/i,
      /js\.hubspot\.com/i,
      // Pardot
      /pi\.pardot\.com/i,
      // Marketo
      /munchkin\.marketo\.net/i,
    ]
  };

  // Inline script content patterns (for detecting tracking in inline scripts)
  const INLINE_SCRIPT_PATTERNS = {
    analytics: [
      /gtag\s*\(\s*['"]config['"]/i,
      /ga\s*\(\s*['"]create['"]/i,
      /GoogleAnalyticsObject/i,
      /mixpanel\.init/i,
      /amplitude\.init/i,
      /heap\.load/i,
      /hj\s*\(\s*['"]init['"]/i,
      /clarity\s*\(/i,
      /posthog\.init/i,
      /_paq\.push/i,
    ],
    marketing: [
      /fbq\s*\(\s*['"]init['"]/i,
      /fbevents\.js/i,
      /gtag\s*\(\s*['"]config['"]\s*,\s*['"]AW-/i,
      /twq\s*\(\s*['"]init['"]/i,
      /lintrk/i,
      /pintrk\s*\(/i,
      /ttq\.load/i,
      /snaptr\s*\(/i,
      /criteo_q/i,
      /_tfa\.push/i,
      /uetq/i,
    ],
    social: [
      /FB\.init/i,
      /twttr\.widgets/i,
      /IN\.init/i,
      /DISQUS/i,
    ],
    preferences: [
      /Intercom\s*\(/i,
      /drift\.load/i,
      /zE\s*\(/i,
      /Tawk_API/i,
      /LC_API/i,
      /olark\.identify/i,
      /hs\.load/i,
      /Munchkin\.init/i,
    ]
  };

  // Script blocking state
  let autoBlockEnabled = true; // Will be updated from config
  let consentedCategories = ['necessary']; // Default: only necessary scripts allowed
  let blockedScriptQueue = []; // Queue of blocked scripts waiting for consent
  let scriptBlockingInitialized = false;
  let originalCreateElement = null;
  let originalAppendChild = null;
  let originalInsertBefore = null;
  let originalAppend = null;
  let mutationObserver = null;

  // Detect script category based on src or content
  function detectScriptCategory(scriptElement) {
    const src = scriptElement.src || '';
    const content = scriptElement.textContent || scriptElement.innerHTML || '';

    // Check if script has explicit data-category attribute
    const explicitCategory = scriptElement.getAttribute('data-category');
    if (explicitCategory) {
      return explicitCategory;
    }

    // Check if script is marked as necessary
    if (scriptElement.getAttribute('data-consently-necessary') === 'true') {
      return 'necessary';
    }

    // Check src-based patterns
    if (src) {
      for (const [category, patterns] of Object.entries(TRACKING_SCRIPT_PATTERNS)) {
        for (const pattern of patterns) {
          if (pattern.test(src)) {
            console.log(`[Consently] Detected ${category} script by src:`, src.substring(0, 100));
            return category;
          }
        }
      }
    }

    // Check inline script content patterns
    if (content && content.length > 10) {
      for (const [category, patterns] of Object.entries(INLINE_SCRIPT_PATTERNS)) {
        for (const pattern of patterns) {
          if (pattern.test(content)) {
            console.log(`[Consently] Detected ${category} script by content pattern`);
            return category;
          }
        }
      }
    }

    return null; // Unknown - don't block
  }

  // Check if a category is consented
  function isCategoryConsented(category) {
    if (!category || category === 'necessary') return true;
    return consentedCategories.includes(category);
  }

  // Block a script by converting it to text/plain
  function blockScript(scriptElement, category) {
    // Store original attributes for later restoration
    const blockedScript = {
      element: scriptElement,
      category: category,
      originalType: scriptElement.type || 'text/javascript',
      src: scriptElement.src,
      content: scriptElement.textContent || scriptElement.innerHTML,
      attributes: {},
      parent: scriptElement.parentNode,
      nextSibling: scriptElement.nextSibling
    };

    // Copy all attributes
    Array.from(scriptElement.attributes).forEach(attr => {
      blockedScript.attributes[attr.name] = attr.value;
    });

    // Add to blocked queue
    blockedScriptQueue.push(blockedScript);

    console.log(`[Consently] 🚫 Blocked ${category} script:`, scriptElement.src || '(inline)');

    // Return true to indicate script should be blocked
    return true;
  }

  // Create a placeholder script that won't execute
  function createBlockedPlaceholder(originalScript, category) {
    const placeholder = document.createElement('script');
    placeholder.type = 'text/plain'; // Browser won't execute this
    placeholder.setAttribute('data-consently-blocked', 'true');
    placeholder.setAttribute('data-consently-category', category);
    placeholder.setAttribute('data-consently-original-type', originalScript.type || 'text/javascript');

    // Copy attributes except type
    Array.from(originalScript.attributes).forEach(attr => {
      if (attr.name !== 'type' && !attr.name.startsWith('data-consently')) {
        placeholder.setAttribute(attr.name, attr.value);
      }
    });

    // Copy content for inline scripts
    if (!originalScript.src && originalScript.textContent) {
      placeholder.textContent = originalScript.textContent;
    }

    return placeholder;
  }

  // Execute a blocked script
  function executeBlockedScript(blockedScript) {
    console.log(`[Consently] ✅ Executing previously blocked ${blockedScript.category} script`);

    const newScript = document.createElement('script');
    newScript.type = blockedScript.originalType || 'text/javascript';

    // Restore all original attributes
    for (const [name, value] of Object.entries(blockedScript.attributes)) {
      if (name !== 'type') {
        newScript.setAttribute(name, value);
      }
    }

    // Set src or content
    if (blockedScript.src) {
      newScript.src = blockedScript.src;
    } else if (blockedScript.content) {
      newScript.textContent = blockedScript.content;
    }

    // Mark as unblocked
    newScript.setAttribute('data-consently-unblocked', 'true');

    // Insert into DOM
    if (blockedScript.parent && blockedScript.parent.isConnected !== false) {
      if (blockedScript.nextSibling && blockedScript.nextSibling.parentNode === blockedScript.parent) {
        blockedScript.parent.insertBefore(newScript, blockedScript.nextSibling);
      } else {
        blockedScript.parent.appendChild(newScript);
      }
    } else {
      // Fallback: append to head or body
      (document.head || document.body).appendChild(newScript);
    }

    // Also unblock any placeholder in DOM
    const placeholder = document.querySelector(
      `script[data-consently-blocked="true"][data-consently-category="${blockedScript.category}"]` +
      (blockedScript.src ? `[src="${blockedScript.src}"]` : '')
    );
    if (placeholder) {
      placeholder.remove();
    }
  }

  // Release all blocked scripts for consented categories
  function releaseBlockedScripts(categories) {
    const toExecute = [];
    const remaining = [];

    for (const blockedScript of blockedScriptQueue) {
      if (categories.includes(blockedScript.category) || blockedScript.category === 'necessary') {
        toExecute.push(blockedScript);
      } else {
        remaining.push(blockedScript);
      }
    }

    blockedScriptQueue = remaining;

    // Execute in order
    for (const script of toExecute) {
      executeBlockedScript(script);
    }

    // Also handle scripts already in DOM with data-consently-blocked
    const blockedInDOM = document.querySelectorAll('script[data-consently-blocked="true"]');
    blockedInDOM.forEach(placeholder => {
      const category = placeholder.getAttribute('data-consently-category');
      if (categories.includes(category) || category === 'necessary') {
        const newScript = document.createElement('script');
        newScript.type = placeholder.getAttribute('data-consently-original-type') || 'text/javascript';

        Array.from(placeholder.attributes).forEach(attr => {
          if (!attr.name.startsWith('data-consently') && attr.name !== 'type') {
            newScript.setAttribute(attr.name, attr.value);
          }
        });

        if (!placeholder.src && placeholder.textContent) {
          newScript.textContent = placeholder.textContent;
        }

        newScript.setAttribute('data-consently-unblocked', 'true');
        placeholder.parentNode.replaceChild(newScript, placeholder);
        console.log(`[Consently] ✅ Unblocked ${category} script from DOM`);
      }
    });

    console.log(`[Consently] Released ${toExecute.length} blocked scripts, ${remaining.length} still blocked`);
  }

  // Monkey patch document.createElement
  function patchCreateElement() {
    if (originalCreateElement) return; // Already patched

    originalCreateElement = document.createElement.bind(document);

    document.createElement = function (tagName, options) {
      const element = originalCreateElement(tagName, options);

      if (tagName.toLowerCase() === 'script') {
        // Store reference to track when src is set
        let _src = '';
        const originalSrcDescriptor = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src');

        Object.defineProperty(element, '_consentlyTracked', {
          value: true,
          writable: false,
          enumerable: false
        });

        // We'll check the script when it's about to be inserted
        element._consentlyPendingCheck = true;
      }

      return element;
    };

    console.log('[Consently] 🔧 Patched document.createElement');
  }

  // Monkey patch appendChild/insertBefore/append
  function patchDOMInsertion() {
    if (originalAppendChild) return; // Already patched

    // Patch appendChild
    originalAppendChild = Node.prototype.appendChild;
    Node.prototype.appendChild = function (child) {
      if (child && child.tagName === 'SCRIPT' && autoBlockEnabled) {
        const category = detectScriptCategory(child);
        if (category && !isCategoryConsented(category)) {
          // Block this script
          const placeholder = createBlockedPlaceholder(child, category);
          blockScript(child, category);
          return originalAppendChild.call(this, placeholder);
        }
      }
      return originalAppendChild.call(this, child);
    };

    // Patch insertBefore
    originalInsertBefore = Node.prototype.insertBefore;
    Node.prototype.insertBefore = function (newNode, referenceNode) {
      if (newNode && newNode.tagName === 'SCRIPT' && autoBlockEnabled) {
        const category = detectScriptCategory(newNode);
        if (category && !isCategoryConsented(category)) {
          // Block this script
          const placeholder = createBlockedPlaceholder(newNode, category);
          blockScript(newNode, category);
          return originalInsertBefore.call(this, placeholder, referenceNode);
        }
      }
      return originalInsertBefore.call(this, newNode, referenceNode);
    };

    // Patch append (modern method)
    if (Element.prototype.append) {
      originalAppend = Element.prototype.append;
      Element.prototype.append = function (...nodes) {
        const processedNodes = nodes.map(node => {
          if (node && node.tagName === 'SCRIPT' && autoBlockEnabled) {
            const category = detectScriptCategory(node);
            if (category && !isCategoryConsented(category)) {
              const placeholder = createBlockedPlaceholder(node, category);
              blockScript(node, category);
              return placeholder;
            }
          }
          return node;
        });
        return originalAppend.apply(this, processedNodes);
      };
    }

    console.log('[Consently] 🔧 Patched DOM insertion methods');
  }

  // Initialize MutationObserver for scripts added via innerHTML or other methods
  function initMutationObserver() {
    if (mutationObserver) return; // Already initialized

    mutationObserver = new MutationObserver((mutations) => {
      if (!autoBlockEnabled) return;

      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.tagName === 'SCRIPT') {
            // Check if this script was already processed by our patches
            if (node.getAttribute('data-consently-blocked') ||
              node.getAttribute('data-consently-unblocked') ||
              node.getAttribute('data-consently-necessary') === 'true') {
              continue;
            }

            const category = detectScriptCategory(node);
            if (category && !isCategoryConsented(category)) {
              // Script was added without going through our patches (e.g., innerHTML)
              // We need to prevent it from executing

              // Unfortunately, by the time MutationObserver fires, the script may have already executed
              // But we can still track it and prevent future similar scripts
              console.log(`[Consently] ⚠️ Detected unblocked ${category} script (may have executed):`,
                node.src || '(inline)');

              // Mark it for tracking
              node.setAttribute('data-consently-detected', category);
            }
          }

          // Also check child scripts if a container was added
          if (node.querySelectorAll) {
            const scripts = node.querySelectorAll('script');
            scripts.forEach(script => {
              if (script.getAttribute('data-consently-blocked') ||
                script.getAttribute('data-consently-unblocked') ||
                script.getAttribute('data-consently-necessary') === 'true') {
                return;
              }

              const category = detectScriptCategory(script);
              if (category && !isCategoryConsented(category)) {
                console.log(`[Consently] ⚠️ Detected nested unblocked ${category} script`);
                script.setAttribute('data-consently-detected', category);
              }
            });
          }
        }
      }
    });

    // Start observing
    mutationObserver.observe(document.documentElement, {
      childList: true,
      subtree: true
    });

    console.log('[Consently] 👁️ MutationObserver initialized');
  }

  // Initialize auto-blocking
  function initAutoBlocking() {
    if (scriptBlockingInitialized) return;

    console.log('[Consently] 🛡️ Initializing auto script blocking...');

    // Apply monkey patches
    patchCreateElement();
    patchDOMInsertion();

    // Initialize MutationObserver
    initMutationObserver();

    // Block existing scripts in DOM that haven't executed yet
    // (Scripts with type="text/plain" are already blocked)
    const existingScripts = document.querySelectorAll('script:not([type="text/plain"]):not([data-consently-id])');
    existingScripts.forEach(script => {
      // Skip our own widget script and scripts that are already processed
      if (script === currentScript ||
        script.getAttribute('data-consently-blocked') ||
        script.getAttribute('data-consently-unblocked') ||
        script.getAttribute('data-consently-necessary') === 'true') {
        return;
      }

      const category = detectScriptCategory(script);
      if (category && !isCategoryConsented(category)) {
        // This script may have already executed, but we track it
        script.setAttribute('data-consently-detected', category);
        console.log(`[Consently] 📋 Tracked existing ${category} script:`, script.src || '(inline)');
      }
    });

    scriptBlockingInitialized = true;
    console.log('[Consently] ✅ Auto script blocking initialized');
  }

  // Update consented categories (called when consent changes)
  function updateConsentedCategories(categories) {
    const previousCategories = [...consentedCategories];
    consentedCategories = categories.includes('necessary') ? categories : ['necessary', ...categories];

    console.log('[Consently] Consent updated:', previousCategories, '->', consentedCategories);

    // Release blocked scripts for newly consented categories
    const newlyConsented = consentedCategories.filter(c => !previousCategories.includes(c));
    if (newlyConsented.length > 0) {
      releaseBlockedScripts(consentedCategories);
    }
  }

  // Disable auto-blocking (e.g., if config says not to block)
  function disableAutoBlocking() {
    autoBlockEnabled = false;

    // Release all blocked scripts
    releaseBlockedScripts(['analytics', 'marketing', 'social', 'preferences', 'necessary']);

    // Stop mutation observer
    if (mutationObserver) {
      mutationObserver.disconnect();
      mutationObserver = null;
    }

    console.log('[Consently] Auto-blocking disabled');
  }

  // ============================================================================
  // END AUTO SCRIPT BLOCKING
  // ============================================================================

  // State management
  let isTranslating = false;
  let languageChangeInProgress = false;
  let configPollingInterval = null;
  let lastConfigHash = null;
  let globalLangClickHandler = null; // Global reference to cleanup language menu listener

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
    blockScripts: true, // Enable auto script blocking by default
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

  // Translation helper with timeout and error handling (single text - kept for backward compatibility)
  async function translateText(text, targetLang, timeout = 15000) {
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
      } else {
        console.warn('[Consently] Translation API error:', response.status);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name !== 'AbortError') {
        console.error('[Consently] Translation error:', error);
      }
    }

    // Fallback to original text
    return text;
  }

  // Batch translation helper - MUCH faster than sequential calls
  async function translateBatch(texts, targetLang, timeout = 20000) {
    if (targetLang === 'en' || !targetLang || !texts || texts.length === 0) {
      return texts || [];
    }

    // Filter out empty texts and check cache
    const textsToTranslate = [];
    const cachedResults = [];
    const textIndices = [];

    texts.forEach((text, index) => {
      if (!text) {
        cachedResults[index] = text;
        return;
      }

      const cacheKey = `${targetLang}:${text}`;
      if (translationCache[cacheKey]) {
        cachedResults[index] = translationCache[cacheKey];
      } else {
        textsToTranslate.push(text);
        textIndices.push(index);
      }
    });

    // If all texts are cached or empty, return cached results
    if (textsToTranslate.length === 0) {
      return cachedResults;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const apiBase = config.apiBase || window.location.origin;
      const response = await fetch(`${apiBase}/api/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts: textsToTranslate, target: targetLang, source: 'en' }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.translations && Array.isArray(data.translations)) {
          // Use the translations array from the API response (matching DPDPA widget approach)
          textIndices.forEach((originalIdx, i) => {
            const translated = data.translations[i] || textsToTranslate[i] || texts[originalIdx];
            cachedResults[originalIdx] = translated;
            // Cache it
            const cacheKey = `${targetLang}:${textsToTranslate[i]}`;
            translationCache[cacheKey] = translated;
          });

          return cachedResults;
        } else {
          // Fallback: try to use translations if available, otherwise use original texts
          console.warn('[Consently] Unexpected API response format');
          textIndices.forEach((originalIdx, i) => {
            cachedResults[originalIdx] = textsToTranslate[i] || texts[originalIdx];
          });
        }
      } else {
        console.warn('[Consently] Translation API error:', response.status);
        // Fallback to original texts
        textIndices.forEach((originalIdx, i) => {
          cachedResults[originalIdx] = textsToTranslate[i] || texts[originalIdx];
        });
      }
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name !== 'AbortError') {
        console.error('[Consently] Translation error:', error);
      }
      // Fallback to original texts for uncached items (matching DPDPA widget approach)
      textIndices.forEach((originalIdx, i) => {
        cachedResults[originalIdx] = textsToTranslate[i] || texts[originalIdx];
      });
    }

    // Return results with cached translations and fallback originals
    return cachedResults;
  }

  function languageLabel(code) {
    const map = {
      // English
      en: 'English',
      // Google Translate supported (12 major languages)
      hi: 'हिंदी', bn: 'বাংলা', ta: 'தமிழ்', te: 'తెలుగు',
      mr: 'मराठी', gu: 'ગુજરાતી', kn: 'ಕನ್ನಡ', ml: 'മലയാളം',
      pa: 'ਪੰਜਾਬੀ', or: 'ଓଡ଼ିଆ', ur: 'اردو', as: 'অসমীয়া',
      // Bhashini supported (additional Schedule 8 languages)
      ne: 'नेपाली', sa: 'संस्कृतम्', ks: 'कॉशुर', sd: 'सिन्धी',
      mai: 'मैथिली', doi: 'डोगरी', kok: 'कोंकणी', mni: 'মৈতৈলোন্',
      brx: 'बड़ो', sat: 'ᱥᱟᱱᱛᱟᱲᱤ'
    };
    return map[code] || '';
  }

  function languageFlag(code) {
    // All Schedule 8 languages use Indian flag
    const map = {
      en: '🇮🇳',
      // Google Translate supported
      hi: '🇮🇳', bn: '🇮🇳', ta: '🇮🇳', te: '🇮🇳',
      mr: '🇮🇳', gu: '🇮🇳', kn: '🇮🇳', ml: '🇮🇳',
      pa: '🇮🇳', or: '🇮🇳', ur: '🇮🇳', as: '🇮🇳',
      // Bhashini supported
      ne: '🇮🇳', sa: '🇮🇳', ks: '🇮🇳', sd: '🇮🇳',
      mai: '🇮🇳', doi: '🇮🇳', kok: '🇮🇳', mni: '🇮🇳',
      brx: '🇮🇳', sat: '🇮🇳'
    };
    return map[code] || '🌐';
  }

  // Cookie helper functions
  const CookieManager = {
    set: function (name, value, days) {
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

    get: function (name) {
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

    delete: function (name) {
      document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/';
    }
  };

  // Expose CookieManager globally
  window.Consently = window.Consently || {};
  window.Consently.CookieManager = CookieManager;

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
  // Show error message to site owners (visible but non-intrusive)
  function showWidgetError(message, isCritical = false) {
    // Only show visible errors in development or if explicitly enabled
    const isDevelopment = window.location.hostname === 'localhost' ||
      window.location.hostname.includes('127.0.0.1') ||
      window.location.hostname.includes('consently.in');

    if (!isDevelopment && !isCritical) {
      // In production, only log to console
      console.warn('[Consently]', message);
      return;
    }

    // Prevent duplicate error banners
    const existingBanner = document.getElementById('consently-widget-error');
    if (existingBanner) {
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
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error || 'Widget configuration not found';

          if (!isPolling) {
            console.error(`[Consently] Widget ${widgetId} not found:`, {
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
          }
          // Stop polling if widget doesn't exist
          stopConfigPolling();
          throw new Error(`Widget not found`);
        } else if (response.status === 429) {
          if (!isPolling) {
            console.warn('[Consently] Rate limit exceeded. Retrying later...');
          }
          throw new Error('Rate limit exceeded');
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

        // Show network error message for non-404 errors
        if (error.message && !error.message.includes('Widget not found') &&
          (error.message.includes('timeout') || error.message.includes('fetch'))) {
          showWidgetError(
            'Unable to connect to Consently service. Please check your internet connection.',
            false
          );
        }
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
    console.log(`[Consently] 🔄 Auto-sync enabled - checking for updates every ${pollInterval / 1000} seconds`);
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

    // Initialize auto script blocking EARLY (before config loads)
    // This ensures scripts added while config is loading are also blocked
    initAutoBlocking();

    await fetchBannerConfig();

    // Check if auto-blocking should be disabled based on config
    if (config.blockScripts === false) {
      console.log('[Consently] Auto-blocking disabled by config');
      disableAutoBlocking();
    }

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
          // Also manage scripts immediately
          manageScripts(existingConsent.categories);
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

    // Translate text using batch translation (much faster!)
    isTranslating = true;
    const textsToTranslate = [
      config.title || 'We value your privacy',
      config.message || 'We use cookies to enhance your browsing experience.',
      config.acceptButton?.text || 'Accept All',
      config.rejectButton?.text || 'Reject All',
      config.settingsButton?.text || 'Cookie Settings',
      // Translate link texts
      config.privacyPolicyText || 'Privacy Policy',
      config.cookiePolicyText || 'Cookie Policy',
      config.termsText || 'Terms'
    ];
    const [title, message, acceptText, rejectText, settingsText, privacyPolicyText, cookiePolicyText, termsText] = await translateBatch(textsToTranslate, selectedLanguage);
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
      box-sizing: border-box;
      word-wrap: break-word;
      overflow-wrap: break-word;
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
          padding: 8px 12px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .consently-lang-btn-banner:hover {
          background: #f9fafb;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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
          border-radius: 10px;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.15);
          z-index: 10000;
          min-width: 220px;
          max-width: 320px;
          max-height: 400px;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 8px;
          pointer-events: auto;
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f1f5f9;
        }
        .consently-lang-menu-banner::-webkit-scrollbar {
          width: 6px;
        }
        .consently-lang-menu-banner::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }
        .consently-lang-menu-banner::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .consently-lang-menu-banner::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .consently-lang-menu-banner .lang-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;
        }
        .consently-lang-menu-banner button {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 10px 6px;
          border: none;
          background: #f9fafb;
          border-radius: 6px;
          cursor: pointer;
          font-size: 11px;
          font-weight: 500;
          color: #6b7280;
          transition: all 0.15s;
          pointer-events: auto;
          user-select: none;
          position: relative;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .consently-lang-menu-banner button:hover {
          background: #f0f9ff;
        }
        .consently-lang-menu-banner button.active {
          background: #dbeafe;
          font-weight: 600;
          color: ${primaryColor};
        }
        .consently-lang-menu-banner button.active::before {
          content: '';
          position: absolute;
          top: 4px;
          right: 4px;
          width: 6px;
          height: 6px;
          background: ${primaryColor};
          border-radius: 50%;
        }
        @media (max-width: 768px) {
          .consently-container {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
          .consently-content {
            min-width: 100%;
          }
          .consently-actions {
            width: 100%;
            flex-direction: column;
          }
          .consently-btn {
            width: 100%;
            margin: 0 0 8px 0;
          }
          .consently-title {
            font-size: 16px;
          }
          .consently-message {
            font-size: 13px;
          }
          .consently-lang-selector {
            top: 8px;
            right: 8px;
          }
          #consently-banner {
            padding: 16px !important;
            padding-top: 48px !important;
          }
        }
        @media (max-width: 480px) {
          #consently-banner {
            padding: 12px !important;
            padding-top: 44px !important;
            font-size: 13px !important;
          }
          .consently-title {
            font-size: 15px !important;
          }
          .consently-message {
            font-size: 12px !important;
          }
          .consently-btn {
            padding: 8px 16px !important;
            font-size: 13px !important;
          }
        }
      </style>
      ${(() => {
        const supportedLangs = config.supportedLanguages || ['en'];
        const validLangs = supportedLangs.filter(code => languageLabel(code));

        if (validLangs.length <= 1) return '';

        const langBtnStyle = `display: flex; align-items: center; gap: 6px; padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 8px; background: white; color: ${textColor}; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05);`;

        return `
      <div class="consently-lang-selector">
        <button id="consently-lang-btn-banner" class="consently-lang-btn-banner" title="${languageLabel(selectedLanguage)}" style="${langBtnStyle}">
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
        <div id="consently-lang-menu-banner" class="consently-lang-menu-banner">
          <div class="lang-grid">
            ${validLangs.map(code => `
              <button data-lang="${code}" class="${code === selectedLanguage ? 'active' : ''}" style="color: ${code === selectedLanguage ? primaryColor : '#6b7280'};">
                ${code === selectedLanguage ? `<span style="position: absolute; top: 4px; right: 4px; width: 6px; height: 6px; background: ${primaryColor}; border-radius: 50%;"></span>` : ''}
                <span style="font-size: 11px; font-weight: ${code === selectedLanguage ? '600' : '500'}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;">${languageLabel(code)}</span>
              </button>
            `).join('')}
          </div>
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
          marketing: 'Advertising',
          social: 'Functional'
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
          links.push(`<a href="${config.privacyPolicyUrl}" target="_blank" rel="noopener noreferrer" style="color: ${theme.primaryColor || '#3b82f6'}; text-decoration: underline;">${privacyPolicyText}</a>`);
        }
        if (config.cookiePolicyUrl) {
          links.push(`<a href="${config.cookiePolicyUrl}" target="_blank" rel="noopener noreferrer" style="color: ${theme.primaryColor || '#3b82f6'}; text-decoration: underline;">${cookiePolicyText}</a>`);
        }
        if (config.termsUrl) {
          links.push(`<a href="${config.termsUrl}" target="_blank" rel="noopener noreferrer" style="color: ${theme.primaryColor || '#3b82f6'}; text-decoration: underline;">${termsText}</a>`);
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
      acceptBtn.addEventListener('click', function () {
        handleConsent('accepted', ['necessary', 'analytics', 'marketing', 'preferences']);
      });
    }

    const rejectBtn = document.getElementById('consently-reject');
    if (rejectBtn) {
      rejectBtn.addEventListener('click', function () {
        handleConsent('rejected', ['necessary']);
      });
    }

    const settingsBtn = document.getElementById('consently-settings');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', function (e) {
        // Prevent if language change is in progress
        if (languageChangeInProgress) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
        showSettingsModal();
      });
    }

    // Language selector with debouncing
    const langBtnBanner = document.getElementById('consently-lang-btn-banner');
    const langMenuBanner = document.getElementById('consently-lang-menu-banner');

    if (langBtnBanner && langMenuBanner) {
      langBtnBanner.addEventListener('click', function (e) {
        e.stopPropagation();
        langMenuBanner.style.display = langMenuBanner.style.display === 'none' || !langMenuBanner.style.display ? 'block' : 'none';
      });

      // Remove old handler if it exists (cleanup from previous updates)
      if (globalLangClickHandler) {
        document.removeEventListener('click', globalLangClickHandler);
      }

      // Store reference to handler for cleanup
      globalLangClickHandler = function (e) {
        if (!langBtnBanner.contains(e.target) && !langMenuBanner.contains(e.target)) {
          langMenuBanner.style.display = 'none';
        }
      };
      document.addEventListener('click', globalLangClickHandler);

      // Helper function to update banner content in place (like DPPA widget)
      const updateBannerContent = async function (newLang) {
        const existingBanner = document.getElementById('consently-banner');
        if (!existingBanner) return;

        console.log('[Consently] Updating banner content for language:', newLang);

        // Remove old click handler before updating (prevents memory leaks and conflicts)
        if (globalLangClickHandler) {
          document.removeEventListener('click', globalLangClickHandler);
          globalLangClickHandler = null;
        }

        // Get theme values first (needed for loading overlay)
        const theme = config.theme || {};
        const primaryColor = theme.primaryColor || '#3b82f6';

        // Show loading overlay
        const loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'consently-lang-loading';
        loadingOverlay.style.cssText = `
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.95);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          border-radius: inherit;
        `;
        loadingOverlay.innerHTML = `
          <div style="text-align: center;">
            <div style="width: 40px; height: 40px; border: 3px solid #e5e7eb; border-top-color: ${primaryColor}; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 8px;"></div>
            <div style="font-size: 14px; color: #6b7280; font-weight: 500;">Translating...</div>
          </div>
          <style>
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          </style>
        `;
        existingBanner.style.position = 'relative';
        existingBanner.appendChild(loadingOverlay);

        // Wait for loading animation to be visible
        await new Promise(resolve => setTimeout(resolve, 100));

        // Translate content using batch translation (fast!)
        isTranslating = true;
        const textsToTranslate = [
          config.title || 'We value your privacy',
          config.message || 'We use cookies to enhance your browsing experience.',
          config.acceptButton?.text || 'Accept All',
          config.rejectButton?.text || 'Reject All',
          config.settingsButton?.text || 'Cookie Settings',
          config.privacyPolicyText || 'Privacy Policy',
          config.cookiePolicyText || 'Cookie Policy',
          config.termsText || 'Terms'
        ];

        const [title, message, acceptText, rejectText, settingsText, privacyPolicyText, cookiePolicyText, termsText] = await translateBatch(textsToTranslate, newLang);
        isTranslating = false;
        const backgroundColor = theme.backgroundColor || '#ffffff';
        const textColor = theme.textColor || '#1f2937';
        const acceptButton = config.acceptButton || {};
        const rejectButton = config.rejectButton || {};
        const settingsButton = config.settingsButton || {};

        // Build updated banner HTML (same structure as showConsentBanner)
        const supportedLangs = config.supportedLanguages || ['en'];
        const validLangs = supportedLangs.filter(code => languageLabel(code));
        const langBtnStyle = `display: flex; align-items: center; gap: 6px; padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 8px; background: white; color: ${textColor}; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05);`;

        const langSelectorHTML = validLangs.length > 1 ? `
          <div class="consently-lang-selector">
            <button id="consently-lang-btn-banner" class="consently-lang-btn-banner" title="${languageLabel(newLang)}" style="${langBtnStyle}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              <span style="font-size: 13px;">${languageLabel(newLang)}</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style="opacity: 0.5;">
                <path d="M7 10l5 5 5-5z"/>
              </svg>
            </button>
            <div id="consently-lang-menu-banner" class="consently-lang-menu-banner">
              <div class="lang-grid">
                ${validLangs.map(code => `
                  <button data-lang="${code}" class="${code === newLang ? 'active' : ''}" style="color: ${code === newLang ? primaryColor : '#6b7280'};">
                    ${code === newLang ? `<span style="position: absolute; top: 4px; right: 4px; width: 6px; height: 6px; background: ${primaryColor}; border-radius: 50%;"></span>` : ''}
                    <span style="font-size: 11px; font-weight: ${code === newLang ? '600' : '500'}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;">${languageLabel(code)}</span>
                  </button>
                `).join('')}
              </div>
            </div>
          </div>
        ` : '';

        const categoryNames = {
          necessary: 'Necessary',
          preferences: 'Preferences',
          analytics: 'Analytics',
          marketing: 'Advertising',
          social: 'Functional'
        };

        const categoriesHTML = config.categories && config.categories.length > 0 ? `
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
        ` : '';

        const links = [];
        if (config.privacyPolicyUrl) {
          links.push(`<a href="${config.privacyPolicyUrl}" target="_blank" rel="noopener noreferrer" style="color: ${theme.primaryColor || '#3b82f6'}; text-decoration: underline;">${privacyPolicyText}</a>`);
        }
        if (config.cookiePolicyUrl) {
          links.push(`<a href="${config.cookiePolicyUrl}" target="_blank" rel="noopener noreferrer" style="color: ${theme.primaryColor || '#3b82f6'}; text-decoration: underline;">${cookiePolicyText}</a>`);
        }
        if (config.termsUrl) {
          links.push(`<a href="${config.termsUrl}" target="_blank" rel="noopener noreferrer" style="color: ${theme.primaryColor || '#3b82f6'}; text-decoration: underline;">${termsText}</a>`);
        }
        const linksHTML = links.length > 0 ? `<p class="consently-links" style="margin-top: 8px; font-size: 12px; opacity: 0.8;">${links.join(' • ')}</p>` : '';

        // Update banner content in place
        existingBanner.innerHTML = `
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
              padding: 8px 12px;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              background: white;
              cursor: pointer;
              font-size: 14px;
              font-weight: 500;
              transition: all 0.2s;
              box-shadow: 0 1px 2px rgba(0,0,0,0.05);
            }
            .consently-lang-btn-banner:hover {
              background: #f9fafb;
              transform: translateY(-1px);
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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
              border-radius: 10px;
              box-shadow: 0 10px 25px -5px rgba(0,0,0,0.15);
              z-index: 10000;
              min-width: 220px;
              max-width: 320px;
              max-height: 400px;
              overflow-y: auto;
              overflow-x: hidden;
              padding: 8px;
              pointer-events: auto;
              scrollbar-width: thin;
              scrollbar-color: #cbd5e1 #f1f5f9;
            }
            .consently-lang-menu-banner::-webkit-scrollbar {
              width: 6px;
            }
            .consently-lang-menu-banner::-webkit-scrollbar-track {
              background: #f1f5f9;
              border-radius: 3px;
            }
            .consently-lang-menu-banner::-webkit-scrollbar-thumb {
              background: #cbd5e1;
              border-radius: 3px;
            }
            .consently-lang-menu-banner::-webkit-scrollbar-thumb:hover {
              background: #94a3b8;
            }
            .consently-lang-menu-banner .lang-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 6px;
            }
            .consently-lang-menu-banner button {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 10px 6px;
              border: none;
              background: #f9fafb;
              border-radius: 6px;
              cursor: pointer;
              font-size: 11px;
              font-weight: 500;
              color: #6b7280;
              transition: all 0.15s;
              pointer-events: auto;
              user-select: none;
              position: relative;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .consently-lang-menu-banner button:hover {
              background: #f0f9ff;
            }
            .consently-lang-menu-banner button.active {
              background: #dbeafe;
              font-weight: 600;
              color: ${primaryColor};
            }
            .consently-lang-menu-banner button.active::before {
              content: '';
              position: absolute;
              top: 4px;
              right: 4px;
              width: 6px;
              height: 6px;
              background: ${primaryColor};
              border-radius: 50%;
            }
            @media (max-width: 768px) {
              .consently-container {
                flex-direction: column;
                align-items: flex-start;
                gap: 16px;
              }
              .consently-content {
                min-width: 100%;
              }
              .consently-actions {
                width: 100%;
                flex-direction: column;
              }
              .consently-btn {
                width: 100%;
                margin: 0 0 8px 0;
              }
              .consently-title {
                font-size: 16px;
              }
              .consently-message {
                font-size: 13px;
              }
              .consently-lang-selector {
                top: 8px;
                right: 8px;
              }
              #consently-banner {
                padding: 16px !important;
                padding-top: 48px !important;
              }
            }
            @media (max-width: 480px) {
              #consently-banner {
                padding: 12px !important;
                padding-top: 44px !important;
                font-size: 13px !important;
              }
              .consently-title {
                font-size: 15px !important;
              }
              .consently-message {
                font-size: 12px !important;
              }
              .consently-btn {
                padding: 8px 16px !important;
                font-size: 13px !important;
              }
            }
          </style>
          ${langSelectorHTML}
          <div class="consently-container">
            <div class="consently-content">
              ${theme.logoUrl ? `<img src="${theme.logoUrl}" alt="Logo" style="height: 32px; width: auto; object-fit: contain; margin-bottom: 12px; display: block;" onerror="this.style.display='none'">` : ''}
              <h3 class="consently-title">
                ${!theme.logoUrl ? CONSENTLY_LOGO_SVG : ''}
                <span>${title}</span>
              </h3>
              <p class="consently-message">${message}</p>
              ${categoriesHTML}
              ${linksHTML}
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

        // Remove loading overlay
        const overlay = document.getElementById('consently-lang-loading');
        if (overlay) overlay.remove();

        // CRITICAL: Ensure banner stays visible - ALWAYS force it to stay visible after language change
        // Store current banner style attributes to ensure they're not lost
        const originalPosition = existingBanner.style.position;
        const originalZIndex = existingBanner.style.zIndex;

        existingBanner.style.position = originalPosition || 'fixed';
        existingBanner.style.zIndex = originalZIndex || (config.zIndex || 9999).toString();
        existingBanner.style.display = 'block';
        existingBanner.style.visibility = 'visible';
        existingBanner.style.opacity = '1';
        existingBanner.style.pointerEvents = 'auto';
        isBannerVisible = true;

        console.log('[Consently] Banner updated and visible');

        // Ensure backdrop stays visible if it exists (for modal/center layouts)
        const backdrop = document.getElementById('consently-backdrop');
        const position = config.position || 'bottom';
        const layout = config.layout || 'bar';
        const needsBackdrop = (position === 'center' || position === 'center-modal' || layout === 'modal');
        if (backdrop && needsBackdrop) {
          backdrop.style.display = 'block';
          backdrop.style.visibility = 'visible';
          backdrop.style.opacity = '1';
        }

        // Re-attach event listeners
        const acceptBtn = document.getElementById('consently-accept');
        if (acceptBtn) {
          acceptBtn.addEventListener('click', function () {
            handleConsent('accepted', ['necessary', 'analytics', 'marketing', 'preferences']);
          });
        }

        const rejectBtn = document.getElementById('consently-reject');
        if (rejectBtn) {
          rejectBtn.addEventListener('click', function () {
            handleConsent('rejected', ['necessary']);
          });
        }

        const settingsBtn = document.getElementById('consently-settings');
        if (settingsBtn) {
          settingsBtn.addEventListener('click', function (e) {
            if (languageChangeInProgress) {
              e.preventDefault();
              e.stopPropagation();
              return false;
            }
            showSettingsModal();
          });
        }

        // Re-attach language selector listeners
        const newLangBtnBanner = document.getElementById('consently-lang-btn-banner');
        const newLangMenuBanner = document.getElementById('consently-lang-menu-banner');

        if (newLangBtnBanner && newLangMenuBanner) {
          newLangBtnBanner.addEventListener('click', function (e) {
            e.stopPropagation();
            newLangMenuBanner.style.display = newLangMenuBanner.style.display === 'none' || !newLangMenuBanner.style.display ? 'block' : 'none';
          });

          // Remove any existing handler before adding new one (cleanup)
          if (globalLangClickHandler) {
            document.removeEventListener('click', globalLangClickHandler);
          }

          // Store reference to new handler for cleanup
          globalLangClickHandler = function (e) {
            if (!newLangBtnBanner.contains(e.target) && !newLangMenuBanner.contains(e.target)) {
              newLangMenuBanner.style.display = 'none';
            }
          };
          document.addEventListener('click', globalLangClickHandler);

          newLangMenuBanner.querySelectorAll('button[data-lang]').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();

              newLangMenuBanner.style.display = 'none';

              const lang = this.getAttribute('data-lang');
              const currentLang = selectedLanguage; // Store current language BEFORE updating

              if (lang && lang !== currentLang) {
                // Save to localStorage immediately for persistence
                try {
                  localStorage.setItem('consently_language', lang);
                } catch (e) {
                  console.warn('[Consently] Failed to save language preference');
                }

                // Trigger the language change handler (it will update selectedLanguage)
                handleLanguageChange(lang);
              }

              return false;
            }, true);
          });
        }
      };

      // Language change handler - executes immediately for real-time translation
      const handleLanguageChange = async function (newLang) {
        if (languageChangeInProgress) {
          console.log('[Consently] Language change already in progress');
          return;
        }

        // Check if language actually changed
        if (!newLang || newLang === selectedLanguage) {
          console.log('[Consently] Language unchanged, skipping');
          return;
        }

        const oldLang = selectedLanguage;
        console.log('[Consently] Changing language from', oldLang, 'to', newLang);
        languageChangeInProgress = true;

        // Disable language button (find it dynamically in case banner was updated)
        const currentLangBtn = document.getElementById('consently-lang-btn-banner');
        if (currentLangBtn) currentLangBtn.disabled = true;

        // Store initial banner state to restore it
        const initialBanner = document.getElementById('consently-banner');
        const initialPosition = initialBanner ? initialBanner.style.position : '';
        const initialZIndex = initialBanner ? initialBanner.style.zIndex : '';

        try {
          // Update selectedLanguage NOW (before async operations)
          selectedLanguage = newLang;

          // Ensure it's saved to localStorage (should already be saved, but double-check)
          try {
            localStorage.setItem('consently_language', newLang);
            console.log('[Consently] Language preference saved:', newLang);
          } catch (e) {
            console.warn('[Consently] Failed to save language preference');
          }

          // Close language menu if still open
          const currentLangMenu = document.getElementById('consently-lang-menu-banner');
          if (currentLangMenu) currentLangMenu.style.display = 'none';

          // Update banner content in place (banner stays open!)
          await updateBannerContent(newLang);

          console.log('[Consently] Banner content updated, ensuring visibility...');

          // CRITICAL: Ensure banner is still visible after update - FORCE visible state
          const updatedBanner = document.getElementById('consently-banner');
          if (updatedBanner) {
            // Restore position and z-index that might have been lost
            updatedBanner.style.position = initialPosition || 'fixed';
            updatedBanner.style.zIndex = initialZIndex || (config.zIndex || 9999).toString();

            // Force visibility
            updatedBanner.style.display = 'block';
            updatedBanner.style.visibility = 'visible';
            updatedBanner.style.opacity = '1';
            updatedBanner.style.pointerEvents = 'auto';
            isBannerVisible = true;

            console.log('[Consently] ✓ Banner kept visible after language change');
          } else {
            console.error('[Consently] ⚠️ Banner element not found after update!');
          }

          // Ensure backdrop stays visible too if needed
          const backdrop = document.getElementById('consently-backdrop');
          const position = config.position || 'bottom';
          const layout = config.layout || 'bar';
          const needsBackdrop = (position === 'center' || position === 'center-modal' || layout === 'modal');
          if (backdrop && needsBackdrop) {
            backdrop.style.display = 'block';
            backdrop.style.visibility = 'visible';
            backdrop.style.opacity = '1';
            console.log('[Consently] ✓ Backdrop kept visible');
          }
        } catch (error) {
          console.error('[Consently] Language change error:', error);
          // Remove loading overlay on error
          const overlay = document.getElementById('consently-lang-loading');
          if (overlay) overlay.remove();

          // Ensure banner is visible even on error
          const errorBanner = document.getElementById('consently-banner');
          if (errorBanner) {
            errorBanner.style.display = 'block';
            errorBanner.style.visibility = 'visible';
            errorBanner.style.opacity = '1';
          }
        } finally {
          languageChangeInProgress = false;
          const currentLangBtn = document.getElementById('consently-lang-btn-banner');
          if (currentLangBtn) currentLangBtn.disabled = false;
          console.log('[Consently] Language change completed');
        }
      };

      langMenuBanner.querySelectorAll('button[data-lang]').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation(); // Prevent any other handlers from firing

          // Close the language menu immediately
          langMenuBanner.style.display = 'none';

          const newLang = this.getAttribute('data-lang');
          const currentLang = selectedLanguage; // Store current language BEFORE updating

          if (newLang && newLang !== currentLang) {
            // Save to localStorage immediately for persistence
            try {
              localStorage.setItem('consently_language', newLang);
            } catch (e) {
              console.warn('[Consently] Failed to save language preference');
            }

            // Trigger the language change handler (it will update selectedLanguage)
            handleLanguageChange(newLang);
          }

          // Return false to ensure no further event propagation
          return false;
        }, true); // Use capture phase to catch event early
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
    } catch (e) { }

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

  // Known cookies map for auto-deletion
  const KNOWN_COOKIES = {
    analytics: ['_ga', '_gid', '_gat', '_ga_', 'sc_is_visitor_unique', 'pk_id', 'pk_ses', 'piwik_ignore'],
    marketing: ['_fbp', '_gcl_au', 'ads/ga-audiences', 'fr', 'tr', '_uetsid', '_uetvid'],
    social: ['datr', 'sb', 'c_user', 'xs']
  };

  // Delete cookies for a specific category
  function deleteCookiesForCategory(category) {
    console.log(`[Consently] Cleaning up cookies for revoked category: ${category}`);

    // 1. Delete known cookies
    const knownList = KNOWN_COOKIES[category] || [];
    knownList.forEach(name => {
      // Try exact match
      CookieManager.delete(name);

      // Try prefix match for some common patterns (like _ga_*)
      if (name.endsWith('_')) {
        const allCookies = document.cookie.split(';');
        allCookies.forEach(c => {
          const cookieName = c.split('=')[0].trim();
          if (cookieName.startsWith(name)) {
            CookieManager.delete(cookieName);
          }
        });
      }
    });

    // 2. Delete configured cookies (if any)
    if (config.cookies && config.cookies[category]) {
      config.cookies[category].forEach(name => CookieManager.delete(name));
    }
  }

  // Manage scripts based on consent
  function manageScripts(categories) {
    console.log('[Consently] Managing scripts for categories:', categories);

    // Update the auto-blocking system with new consented categories
    updateConsentedCategories(categories);

    // Find all scripts with data-category attribute (manual blocking)
    const scripts = document.querySelectorAll('script[data-category]');

    scripts.forEach(script => {
      const category = script.getAttribute('data-category');

      // If category is consented (or it's necessary), enable the script
      if (categories.includes(category) || category === 'necessary') {
        // Check if script is currently blocked (type="text/plain")
        if (script.type === 'text/plain') {
          console.log(`[Consently] Unblocking manual script: ${category}`);

          // Create a new script element to replace the blocked one
          // (Changing type doesn't execute the script, we must re-insert it)
          // Use original createElement to avoid our blocking logic
          const newScript = originalCreateElement ? originalCreateElement('script') : document.createElement('script');
          newScript.type = 'text/javascript';
          newScript.setAttribute('data-consently-unblocked', 'true');

          // Copy all attributes
          Array.from(script.attributes).forEach(attr => {
            if (attr.name !== 'type' && !attr.name.startsWith('data-consently')) {
              newScript.setAttribute(attr.name, attr.value);
            }
          });

          // Copy content
          if (script.src) {
            newScript.src = script.src;
          } else {
            newScript.innerHTML = script.innerHTML;
          }

          // Replace old script with new one
          script.parentNode.replaceChild(newScript, script);
        }
      } else {
        // If not consented, ensure it's blocked (if it hasn't run yet)
        // Note: We can't stop a script that has already run, but we can prevent it from running if it's still text/plain
        if (script.type !== 'text/plain') {
          // It's already running or set to run. We can't easily stop it without reloading.
          // But for dynamic scripts inserted later, we could potentially intercept.
          // For now, we assume the user has set type="text/plain" initially.
          console.warn(`[Consently] Script for ${category} is running but consent was revoked. Reload required to stop.`);
        }
      }
    });

    // Release auto-blocked scripts for consented categories
    releaseBlockedScripts(categories);
  }

  // Apply consent
  function applyConsent(consent) {
    console.log('[Consently] Applying consent:', consent);

    // Manage scripts based on consented categories
    if (consent && consent.categories) {
      manageScripts(consent.categories);

      // Check for revoked categories and delete cookies
      const allCategories = ['analytics', 'marketing', 'social', 'preferences'];
      const consentedCategories = consent.categories;

      allCategories.forEach(cat => {
        if (!consentedCategories.includes(cat)) {
          deleteCookiesForCategory(cat);
        }
      });
    }

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

      // Load saved preferences from cookie (not temp prefs) - BEFORE translation
      const existingConsent = CookieManager.get('consently_consent');
      const existingCategories = existingConsent ? existingConsent.categories || ['necessary'] : ['necessary'];
      const consentId = existingConsent ? (existingConsent.consentId || 'N/A') : 'N/A';
      const consentDate = existingConsent && existingConsent.timestamp ? new Date(existingConsent.timestamp).toLocaleString() : 'N/A';
      console.log('[Consently] Loading preferences:', existingCategories);

      // Translate ALL texts in ONE SINGLE batch call (much faster!)
      // Combines modal texts + category texts into one API call
      isTranslating = true;
      const allTexts = [
        // Modal texts (5 items)
        'Preferences',
        'Manage your cookie preferences. Some cookies are necessary for the website to function.',
        'Save Preferences',
        'Cancel',
        'Required',
        // Category texts (8 items)
        'Necessary Cookies',
        'Essential for website functionality',
        'Analytics Cookies',
        'Help us understand visitor behavior',
        'Advertising Cookies',
        'Used for targeted advertising',
        'Functional Cookies',
        'Enable enhanced functionality and personalization'
      ];

      let translations;
      try {
        translations = await translateBatch(allTexts, selectedLanguage);
      } catch (translationError) {
        console.error('[Consently] Translation failed:', translationError);
        // Fallback to original English texts if translation fails
        translations = allTexts;
      }

      // Extract modal texts (first 5)
      const [modalTitle, modalDescription, saveButtonText, cancelButtonText, requiredLabel] = translations.slice(0, 5);

      // Extract category texts (remaining 8)
      const [
        necessaryName, necessaryDesc,
        analyticsName, analyticsDesc,
        marketingName, marketingDesc,
        socialName, socialDesc
      ] = translations.slice(5);

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
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    `;

      const categories = [
        { id: 'necessary', name: necessaryName, description: necessaryDesc, required: true },
        { id: 'preferences', name: 'Preferences', description: 'Cookies that remember your settings', required: false },
        { id: 'analytics', name: analyticsName, description: analyticsDesc, required: false },
        { id: 'marketing', name: marketingName, description: marketingDesc, required: false },
        { id: 'social', name: socialName, description: socialDesc, required: false }
      ];

      let categoriesHTML = '';
      const availableCategories = config.categories || ['necessary', 'analytics', 'marketing', 'social'];

      // Get scanned cookies from config
      const scannedCookies = config.scannedCookies || { hasScannedCookies: false, categories: {} };
      const hasScannedCookies = scannedCookies.hasScannedCookies;

      // Map category IDs to scannedCookies category keys
      const categoryKeyMap = {
        'necessary': 'necessary',
        'analytics': 'analytics',
        'marketing': 'advertising',
        'social': 'social',
        'preferences': 'preferences',
        'functional': 'functional'
      };

      categories.forEach(cat => {
        // Always show necessary cookies, show others only if in availableCategories
        if (cat.id === 'necessary' || availableCategories.includes(cat.id) || cat.required) {
          const isChecked = cat.required || existingCategories.includes(cat.id);

          // Get cookies for this category
          const categoryKey = categoryKeyMap[cat.id] || cat.id;
          const categoryCookies = scannedCookies.categories && scannedCookies.categories[categoryKey]
            ? scannedCookies.categories[categoryKey]
            : [];
          const cookieCount = categoryCookies.length;

          // Build cookie list HTML
          let cookieListHTML = '';
          if (hasScannedCookies && cookieCount > 0) {
            cookieListHTML = `
              <div id="cookie-list-${cat.id}" style="margin-top: 12px; display: none; border-top: 1px solid #e5e7eb; padding-top: 12px;">
                <div style="font-size: 11px; color: #6b7280; margin-bottom: 8px; font-weight: 600;">Cookies in this category:</div>
                ${categoryCookies.slice(0, 5).map(cookie => `
                  <div style="background: #f9fafb; padding: 8px 12px; border-radius: 6px; margin-bottom: 6px; font-size: 12px;">
                    <div style="font-weight: 600; color: #374151; margin-bottom: 2px;">${cookie.name}</div>
                    <div style="color: #6b7280; font-size: 11px;">
                      ${cookie.provider && cookie.provider !== 'Unknown' ? `<span>Provider: ${cookie.provider}</span> • ` : ''}
                      <span>Expires: ${cookie.expiry || 'Session'}</span>
                    </div>
                    ${cookie.purpose && cookie.purpose !== 'Unknown' ? `<div style="color: #9ca3af; font-size: 10px; margin-top: 2px;">${cookie.purpose}</div>` : ''}
                  </div>
                `).join('')}
                ${cookieCount > 5 ? `<div style="font-size: 11px; color: #6b7280; text-align: center;">+ ${cookieCount - 5} more cookies</div>` : ''}
              </div>
            `;
          } else if (!hasScannedCookies) {
            // Don't show "no cookies" message for necessary category - it should always have cookies
            if (cat.id !== 'necessary') {
              cookieListHTML = `
                <div id="cookie-list-${cat.id}" style="margin-top: 12px; display: none; border-top: 1px solid #e5e7eb; padding-top: 12px;">
                  <div style="background: #fef3c7; padding: 12px; border-radius: 6px; font-size: 11px; color: #92400e;">
                    <strong>⚠️ No cookies scanned yet</strong><br>
                    Scan your website in the Consently dashboard to see detailed cookie information.
                  </div>
                </div>
              `;
            }
          }

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
                  ${cookieCount > 0 ? `<span style="background: #e5e7eb; color: #374151; font-size: 10px; padding: 2px 6px; border-radius: 10px;">${cookieCount} cookies</span>` : ''}
                </div>
                <div style="font-size: 13px; color: #6b7280;">${cat.description}</div>
                ${cookieListHTML ? `
                  <button type="button" onclick="(function(e){e.preventDefault();e.stopPropagation();var list=document.getElementById('cookie-list-${cat.id}');var btn=e.target;if(list){list.style.display=list.style.display==='none'?'block':'none';btn.textContent=list.style.display==='none'?'View cookies ▼':'Hide cookies ▲';}})(event)" style="background: none; border: none; color: #3b82f6; font-size: 11px; cursor: pointer; padding: 4px 0; margin-top: 4px;">View cookies ▼</button>
                ` : ''}
                ${cookieListHTML}
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
        @media (max-width: 768px) {
          .consently-modal-content {
            max-width: 100%;
            margin: 10px;
            padding: 20px;
            max-height: 90vh;
          }
          .consently-modal-content h2 {
            font-size: 20px !important;
          }
          #consently-modal {
            padding: 10px !important;
            align-items: flex-end !important;
          }
          #consently-lang-btn {
            font-size: 12px !important;
            padding: 6px 10px !important;
          }
        }
        @media (max-width: 480px) {
          .consently-modal-content {
            padding: 16px;
            border-radius: 12px 12px 0 0;
            max-height: 95vh;
          }
          .consently-modal-content h2 {
            font-size: 18px !important;
          }
          #consently-modal {
            padding: 0 !important;
            align-items: flex-end !important;
          }
          #consently-lang-btn {
            font-size: 11px !important;
            padding: 5px 8px !important;
          }
          #consently-lang-btn svg {
            width: 14px !important;
            height: 14px !important;
          }
        }
      </style>
      <div class="consently-modal-content">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; gap: 12px; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 0;">
            ${theme.logoUrl ? `<img src="${theme.logoUrl}" alt="Logo" style="height: 32px; width: auto; object-fit: contain; margin-bottom: 8px; display: block;" onerror="this.style.display='none'">` : ''}
            <h2 style="margin: 0; font-size: 24px; color: #1f2937; display: flex; align-items: center; gap: 8px; word-wrap: break-word;">
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

      // Append modal to body
      document.body.appendChild(modal);

      // Ensure modal is visible and properly rendered
      // Force a reflow to ensure animations work
      modal.offsetHeight;

      // Add a small delay to ensure modal is fully shown before interaction
      await new Promise(resolve => setTimeout(resolve, 50));

      console.log('[Consently] Modal displayed successfully');

      // Language selector with debouncing for modal
      const langBtn = document.getElementById('consently-lang-btn');
      const langMenu = document.getElementById('consently-lang-menu');

      if (langBtn && langMenu) {
        langBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          langMenu.style.display = langMenu.style.display === 'none' || !langMenu.style.display ? 'block' : 'none';
        });

        document.addEventListener('click', function (e) {
          if (!langBtn.contains(e.target) && !langMenu.contains(e.target)) {
            langMenu.style.display = 'none';
          }
        });

        // Helper function to update modal content in place (keeps modal open!)
        const updateModalContent = async function (translations, newLang) {
          const modalContent = modal.querySelector('.consently-modal-content');
          if (!modalContent) return;

          // Extract translations
          const [modalTitle, modalDescription, saveButtonText, cancelButtonText, requiredLabel] = translations.slice(0, 5);
          const [
            necessaryName, necessaryDesc,
            analyticsName, analyticsDesc,
            marketingName, marketingDesc,
            socialName, socialDesc
          ] = translations.slice(5);

          // Update modal title
          const titleElement = modalContent.querySelector('h2 span');
          if (titleElement) titleElement.textContent = modalTitle;

          // Update modal description
          const descElement = modalContent.querySelector('p[style*="margin: 0 0 24px"]');
          if (descElement) descElement.textContent = modalDescription;

          // Update language label
          const langLabel = document.getElementById('consently-lang-label');
          if (langLabel) langLabel.textContent = languageLabel(newLang);

          // Update button texts
          const saveBtn = document.getElementById('consently-save-settings');
          if (saveBtn) saveBtn.textContent = saveButtonText;

          const cancelBtn = document.getElementById('consently-close-modal');
          if (cancelBtn) cancelBtn.textContent = cancelButtonText;

          // Update category names and descriptions
          const categoryMap = {
            'necessary': { name: necessaryName, desc: necessaryDesc },
            'analytics': { name: analyticsName, desc: analyticsDesc },
            'marketing': { name: marketingName, desc: marketingDesc },
            'social': { name: socialName, desc: socialDesc }
          };

          Object.keys(categoryMap).forEach(catId => {
            const checkbox = document.getElementById(`cat-${catId}`);
            if (checkbox) {
              const label = checkbox.closest('label');
              if (label) {
                const nameSpan = label.querySelector('span');
                const descDiv = label.querySelector('div[style*="font-size: 13px"]');

                if (nameSpan) {
                  const requiredPart = catId === 'necessary' ? ` <span style="color: #3b82f6; font-size: 12px;">(${requiredLabel})</span>` : '';
                  nameSpan.innerHTML = categoryMap[catId].name + requiredPart;
                }
                if (descDiv) {
                  descDiv.textContent = categoryMap[catId].desc;
                }
              }
            }
          });

          // Update language menu active state
          const langMenu = document.getElementById('consently-lang-menu');
          if (langMenu) {
            langMenu.querySelectorAll('button[data-lang]').forEach(btn => {
              const btnLang = btn.getAttribute('data-lang');
              if (btnLang === newLang) {
                btn.style.background = '#f0f9ff';
                btn.style.fontWeight = '600';
                btn.style.color = '#0369a1';
                if (!btn.querySelector('svg:last-child')) {
                  btn.innerHTML += '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="margin-left: auto;"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
                }
              } else {
                btn.style.background = '#fff';
                btn.style.fontWeight = '500';
                btn.style.color = '#374151';
                const checkIcon = btn.querySelector('svg:last-child');
                if (checkIcon) checkIcon.remove();
              }
            });
          }
        };

        const handleModalLanguageChange = debounce(async function (newLang) {
          if (languageChangeInProgress) return;

          languageChangeInProgress = true;
          langBtn.disabled = true;

          try {
            selectedLanguage = newLang;
            localStorage.setItem('consently_language', newLang);
            langMenu.style.display = 'none';

            // Show loading overlay on modal (KEEP MODAL OPEN!)
            const modalContent = modal.querySelector('.consently-modal-content');
            if (modalContent) {
              // Remove any existing loading overlay
              const existingOverlay = document.getElementById('consently-modal-lang-loading');
              if (existingOverlay) existingOverlay.remove();

              const loadingOverlay = document.createElement('div');
              loadingOverlay.id = 'consently-modal-lang-loading';
              loadingOverlay.style.cssText = `
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: rgba(255, 255, 255, 0.95);
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 20;
              border-radius: inherit;
            `;
              loadingOverlay.innerHTML = `
              <div style="text-align: center;">
                <div style="width: 50px; height: 50px; border: 4px solid #e5e7eb; border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 12px;"></div>
                <div style="font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 4px;">Translating...</div>
                <div style="font-size: 13px; color: #6b7280;">Please wait a moment</div>
              </div>
              <style>
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              </style>
            `;
              modalContent.style.position = 'relative';
              modalContent.appendChild(loadingOverlay);

              // Wait for loading animation to be visible
              await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Translate all texts in ONE batch call
            const allTexts = [
              'Preferences',
              'Manage your cookie preferences. Some cookies are necessary for the website to function.',
              'Save Preferences',
              'Cancel',
              'Required',
              'Essential Cookies',
              'Essential for website functionality',
              'Analytics Cookies',
              'Help us understand visitor behavior',
              'Advertising Cookies',
              'Used for targeted advertising',
              'Social Media',
              'Cookies from social media platforms for sharing content'
            ];

            const translations = await translateBatch(allTexts, newLang);

            // Update modal content IN PLACE (don't remove modal!)
            await updateModalContent(translations, newLang);

            // Remove loading overlay
            const loadingOverlay = document.getElementById('consently-modal-lang-loading');
            if (loadingOverlay) loadingOverlay.remove();

          } catch (error) {
            console.error('[Consently] Modal language change error:', error);
            // Remove loading overlay on error
            const loadingOverlay = document.getElementById('consently-modal-lang-loading');
            if (loadingOverlay) loadingOverlay.remove();
          } finally {
            languageChangeInProgress = false;
            if (langBtn) langBtn.disabled = false;
          }
        }, 300);

        langMenu.querySelectorAll('button[data-lang]').forEach(function (btn) {
          btn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation(); // Prevent any other handlers

            // Close the language menu immediately
            langMenu.style.display = 'none';

            const newLang = this.getAttribute('data-lang');
            if (newLang && newLang !== selectedLanguage) {
              // Update language immediately
              selectedLanguage = newLang;
              try {
                localStorage.setItem('consently_language', newLang);
              } catch (e) {
                console.warn('[Consently] Failed to save language preference');
              }

              // Then trigger the modal language change handler
              handleModalLanguageChange(newLang);
            }

            return false;
          }, true); // Use capture phase
        });
      }

      // Save preferences
      document.getElementById('consently-save-settings').addEventListener('click', function () {
        const selectedCategories = ['necessary'];
        categories.forEach(cat => {
          if (!cat.required) {
            const checkbox = document.getElementById('cat-' + cat.id);
            console.log(`[Consently] Category ${cat.id} checkbox state:`, checkbox ? checkbox.checked : 'not found');
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
      document.getElementById('consently-close-modal').addEventListener('click', function () {
        modal.remove();
        if (banner) banner.style.display = 'block';
      });

      modal.addEventListener('click', function (e) {
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

    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      menu.classList.toggle('show');
    });

    // Close menu when clicking outside
    document.addEventListener('click', function (e) {
      if (!button.contains(e.target)) {
        menu.classList.remove('show');
      }
    });

    // Manage preferences
    document.getElementById('consently-manage-btn').addEventListener('click', function () {
      menu.classList.remove('show');
      showSettingsModal();
    });

    // Revoke consent
    document.getElementById('consently-revoke-btn').addEventListener('click', function () {
      menu.classList.remove('show');
      revokeConsent();
    });

    // DPDPA preferences button (if exists)
    if (hasDPDPA) {
      const dpdpaBtn = document.getElementById('consently-dpdpa-prefs-btn');
      if (dpdpaBtn) {
        dpdpaBtn.addEventListener('click', function () {
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
    let dpdpaCheckInterval = setInterval(function () {
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

        dpdpaBtn.addEventListener('mouseenter', function () {
          this.style.background = '#f3f4f6';
        });
        dpdpaBtn.addEventListener('mouseleave', function () {
          this.style.background = 'white';
        });

        dpdpaBtn.addEventListener('click', function () {
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
    setTimeout(function () {
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
    show: function () {
      if (!document.getElementById('consently-banner')) {
        showConsentBanner();
      }
    },
    // Hide the banner
    hide: function () {
      const banner = document.getElementById('consently-banner');
      const backdrop = document.getElementById('consently-backdrop');
      if (banner) banner.remove();
      if (backdrop) backdrop.remove();
      isBannerVisible = false;
    },
    // Open settings modal
    openSettings: function () {
      showSettingsModal();
    },
    // Reset consent (clear cookie)
    reset: function () {
      CookieManager.delete('consently_consent');
      console.log('[Consently] Consent reset');
      if (config.autoShow) {
        this.show();
      }
    },
    // Revoke consent
    revoke: function () {
      revokeConsent();
    },
    // Get current consent status
    getConsent: function () {
      return CookieManager.get('consently_consent');
    },
    // Show floating consent button
    showButton: function () {
      showConsentButton();
    },
    // Hide floating consent button
    hideButton: function () {
      const btn = document.getElementById('consently-float-btn');
      if (btn) btn.remove();
    },
    // Check if in preview mode (on consently.in domain)
    isPreviewMode: function () {
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
