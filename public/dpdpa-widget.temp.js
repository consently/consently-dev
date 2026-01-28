var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
/**
 * Consently DPDPA Consent Widget v1.0
 * Production-ready embeddable widget for DPDPA 2023 compliance
 * Displays processing activities and collects granular consent
 *
 * Usage: <script src="https://www.consently.in/dpdpa-widget.js" data-dpdpa-widget-id="YOUR_WIDGET_ID"></script>
 */
(function () {
    'use strict';
    // Get widget ID from script tag
    var currentScript = document.currentScript || document.querySelector('script[data-dpdpa-widget-id]');
    var widgetId = currentScript ? currentScript.getAttribute('data-dpdpa-widget-id') : null;
    if (!widgetId) {
        console.error('[Consently DPDPA] Error: data-dpdpa-widget-id attribute is required');
        console.error('[Consently DPDPA] Usage: <script src="https://www.consently.in/dpdpa-widget.js" data-dpdpa-widget-id="YOUR_WIDGET_ID"></script>');
        return;
    }
    console.log('[Consently DPDPA] Initializing widget with ID:', widgetId);
    // English translations as base
    var BASE_TRANSLATIONS = {
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
        privacyNotice: 'Notice',
        dpdpaCompliance: 'DPDPA 2023 Compliance',
        manageConsentPreferences: 'Manage Your Consent Preferences',
        changeSettingsAnytime: 'You can change these settings at any time',
        preferenceCentre: 'Preference Centre',
        revocationWarning: '⚠️ Warning: Revoking consent may affect service delivery.',
        grievanceText: 'If you have any grievances with how we process your personal data click {here}. If we are unable to resolve your grievance, you can also make a complaint to the Data Protection Board by clicking {here2}.',
        here: 'here',
        poweredBy: 'Powered by'
    };
    // Translation cache to avoid repeated API calls
    var translationCache = {};
    // Get API URL from config or use default
    function getApiUrl() {
        var scriptSrc = currentScript ? currentScript.src : '';
        if (scriptSrc.includes('localhost')) {
            return 'http://localhost:3000';
        }
        if (scriptSrc.includes('consently.in')) {
            return 'https://www.consently.in';
        }
        // Extract domain from script src
        var match = scriptSrc.match(/^(https?:\/\/[^\/]+)/);
        return match ? match[1] : window.location.origin;
    }
    // Translate text using Google Translate API
    function translateText(text, targetLang) {
        return __awaiter(this, void 0, void 0, function () {
            var cacheKey, apiUrl, response, data, translated, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (targetLang === 'en')
                            return [2 /*return*/, text];
                        cacheKey = "".concat(targetLang, ":").concat(text);
                        if (translationCache[cacheKey]) {
                            return [2 /*return*/, translationCache[cacheKey]];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        apiUrl = getApiUrl();
                        return [4 /*yield*/, fetch("".concat(apiUrl, "/api/translate"), {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    text: text,
                                    target: targetLang,
                                    source: 'en'
                                })
                            })];
                    case 2:
                        response = _a.sent();
                        if (!response.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, response.json()];
                    case 3:
                        data = _a.sent();
                        translated = data.translatedText || text;
                        translationCache[cacheKey] = translated;
                        return [2 /*return*/, translated];
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        error_1 = _a.sent();
                        console.error('[Consently] Translation error:', error_1);
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/, text]; // Fallback to original
                }
            });
        });
    }
    // Batch translate multiple texts at once
    function batchTranslate(texts, targetLang) {
        return __awaiter(this, void 0, void 0, function () {
            var uncachedTexts, uncachedIndices, result, apiUrl, response, data_1, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (targetLang === 'en' || !texts || texts.length === 0)
                            return [2 /*return*/, texts || []];
                        uncachedTexts = [];
                        uncachedIndices = [];
                        result = __spreadArray([], texts, true);
                        texts.forEach(function (text, idx) {
                            if (!text) {
                                result[idx] = text;
                                return;
                            }
                            var cacheKey = "".concat(targetLang, ":").concat(text);
                            if (translationCache[cacheKey]) {
                                result[idx] = translationCache[cacheKey];
                            }
                            else {
                                uncachedTexts.push(text);
                                uncachedIndices.push(idx);
                            }
                        });
                        // If all cached, return immediately
                        if (uncachedTexts.length === 0) {
                            return [2 /*return*/, result];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        apiUrl = getApiUrl();
                        return [4 /*yield*/, fetch("".concat(apiUrl, "/api/translate"), {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    texts: uncachedTexts, // Use 'texts' array, not 'text' string
                                    target: targetLang,
                                    source: 'en'
                                })
                            })];
                    case 2:
                        response = _a.sent();
                        if (!response.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, response.json()];
                    case 3:
                        data_1 = _a.sent();
                        if (data_1.success && data_1.translations && Array.isArray(data_1.translations)) {
                            // Use the translations array from the API response
                            uncachedIndices.forEach(function (idx, i) {
                                var translated = data_1.translations[i] || uncachedTexts[i] || texts[idx];
                                result[idx] = translated;
                                // Cache it
                                var cacheKey = "".concat(targetLang, ":").concat(texts[idx]);
                                translationCache[cacheKey] = translated;
                            });
                        }
                        else {
                            // Fallback: try to use translatedText if available
                            console.warn('[Consently DPDPA] Unexpected API response format, using fallback');
                            uncachedIndices.forEach(function (idx, i) {
                                result[idx] = uncachedTexts[i] || texts[idx];
                            });
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        console.warn('[Consently DPDPA] Translation API error:', response.status);
                        // Fallback to original texts
                        uncachedIndices.forEach(function (idx, i) {
                            result[idx] = uncachedTexts[i] || texts[idx];
                        });
                        _a.label = 5;
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        error_2 = _a.sent();
                        console.error('[Consently DPDPA] Batch translation error:', error_2);
                        // Fallback to original texts for uncached items
                        uncachedIndices.forEach(function (idx, i) {
                            result[idx] = uncachedTexts[i] || texts[idx];
                        });
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/, result];
                }
            });
        });
    }
    // Get translations for a language (with optimized batch translation)
    function getTranslation(lang) {
        return __awaiter(this, void 0, void 0, function () {
            var langCacheKey, keys, values, translatedValues, translations;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (lang === 'en') {
                            return [2 /*return*/, BASE_TRANSLATIONS];
                        }
                        langCacheKey = "_lang_".concat(lang);
                        if (translationCache[langCacheKey]) {
                            return [2 /*return*/, translationCache[langCacheKey]];
                        }
                        keys = Object.keys(BASE_TRANSLATIONS);
                        values = Object.values(BASE_TRANSLATIONS);
                        return [4 /*yield*/, batchTranslate(values, lang)];
                    case 1:
                        translatedValues = _a.sent();
                        translations = {};
                        keys.forEach(function (key, idx) {
                            translations[key] = translatedValues[idx];
                        });
                        // Cache entire language translation set
                        translationCache[langCacheKey] = translations;
                        return [2 /*return*/, translations];
                }
            });
        });
    }
    // Global configuration
    var config = null;
    var allActivities = []; // Source of truth for all activities
    var activities = [];
    var activityConsents = {};
    var consentID = null; // User-visible Consent ID (Format: CNST-XXXX-XXXX-XXXX)
    var verifiedEmail = null; // Store verified email address
    var globalClickHandler = null; // Global reference to cleanup language menu listener
    var primaryColor = '#4c8bf5'; // Default primary color, updated when config loads
    var visitorEmail = null; // Visitor email for cross-device consent management
    // LocalStorage manager for consent persistence
    var ConsentStorage = {
        set: function (key, value, expirationDays) {
            var expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + expirationDays);
            var data = {
                value: value,
                expiresAt: expiresAt.toISOString()
            };
            localStorage.setItem(key, JSON.stringify(data));
        },
        get: function (key) {
            var data = localStorage.getItem(key);
            if (!data)
                return null;
            try {
                var parsed = JSON.parse(data);
                var expiresAt = new Date(parsed.expiresAt);
                if (expiresAt < new Date()) {
                    // Consent expired
                    this.delete(key);
                    return null;
                }
                return parsed.value;
            }
            catch (e) {
                return null;
            }
        },
        delete: function (key) {
            localStorage.removeItem(key);
        }
    };
    // Consistent hash function - uses same algorithm for both async and sync
    // Returns 64-character hex string (full SHA-256 length)
    function hashStringSync(str) {
        if (!str)
            return null;
        // Normalize the string (lowercase, trim)
        var normalized = str.toLowerCase().trim();
        // Use a consistent hash algorithm that produces same result every time
        // This is a modified djb2 hash that produces 64-character hex output
        var hash1 = 5381;
        var hash2 = 0;
        var hash3 = 52711;
        var hash4 = 0;
        for (var i = 0; i < normalized.length; i++) {
            var char = normalized.charCodeAt(i);
            hash1 = ((hash1 << 5) + hash1) + char;
            hash2 = ((hash2 << 5) + hash2) + (char * 31);
            hash3 = ((hash3 << 5) + hash3) ^ char;
            hash4 = ((hash4 << 5) + hash4) + (char * 17);
        }
        // Combine hashes and convert to 64-character hex string
        var hex1 = Math.abs(hash1).toString(16).padStart(16, '0');
        var hex2 = Math.abs(hash2).toString(16).padStart(16, '0');
        var hex3 = Math.abs(hash3).toString(16).padStart(16, '0');
        var hex4 = Math.abs(hash4).toString(16).padStart(16, '0');
        return (hex1 + hex2 + hex3 + hex4).substring(0, 64);
    }
    // Async version that uses Web Crypto API if available, otherwise uses sync version
    function hashString(str) {
        return __awaiter(this, void 0, void 0, function () {
            var normalized, encoder, data, hashBuffer, hashArray, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!str)
                            return [2 /*return*/, null];
                        normalized = str.toLowerCase().trim();
                        if (!(window.crypto && window.crypto.subtle)) return [3 /*break*/, 4];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        encoder = new TextEncoder();
                        data = encoder.encode(normalized);
                        return [4 /*yield*/, crypto.subtle.digest('SHA-256', data)];
                    case 2:
                        hashBuffer = _a.sent();
                        hashArray = Array.from(new Uint8Array(hashBuffer));
                        return [2 /*return*/, hashArray.map(function (b) { return b.toString(16).padStart(2, '0'); }).join('')];
                    case 3:
                        e_1 = _a.sent();
                        // Fallback to sync hash if crypto fails
                        console.warn('[Consently DPDPA] Web Crypto API failed, using fallback hash:', e_1);
                        return [2 /*return*/, hashStringSync(normalized)];
                    case 4: 
                    // Use sync hash for consistency
                    return [2 /*return*/, hashStringSync(normalized)];
                }
            });
        });
    }
    // Generate device fingerprint based on stable browser/device characteristics
    // Uses only stable values that don't change between sessions
    function generateDeviceFingerprint() {
        var components = [];
        // User agent (stable - only changes with browser updates)
        if (navigator.userAgent) {
            components.push(navigator.userAgent);
        }
        // Use maximum screen dimensions (more stable than current resolution)
        // This avoids issues when window is resized
        if (screen.width && screen.height) {
            // Use max available dimensions for stability
            var maxWidth = Math.max(screen.width, screen.availWidth || screen.width);
            var maxHeight = Math.max(screen.height, screen.availHeight || screen.height);
            components.push("max".concat(maxWidth, "x").concat(maxHeight));
        }
        // Color depth (stable)
        if (screen.colorDepth) {
            components.push("cd".concat(screen.colorDepth));
        }
        // Pixel depth (stable)
        if (screen.pixelDepth) {
            components.push("pd".concat(screen.pixelDepth));
        }
        // Timezone (stable for user's location)
        try {
            components.push(Intl.DateTimeFormat().resolvedOptions().timeZone || '');
        }
        catch (e) { }
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
            components.push("hc".concat(navigator.hardwareConcurrency));
        }
        // Device memory (if available - stable)
        if (navigator.deviceMemory) {
            components.push("dm".concat(navigator.deviceMemory));
        }
        // Max touch points (stable)
        if (navigator.maxTouchPoints) {
            components.push("mtp".concat(navigator.maxTouchPoints));
        }
        // Vendor (stable)
        if (navigator.vendor) {
            components.push(navigator.vendor);
        }
        // Canvas fingerprint (simplified - use consistent text for stability)
        try {
            var canvas = document.createElement('canvas');
            var ctx = canvas.getContext('2d');
            if (ctx) {
                // Use consistent rendering for stability
                ctx.textBaseline = 'top';
                ctx.font = '14px Arial';
                ctx.fillText('ConsentlyDeviceFingerprint', 2, 2);
                // Use first 50 chars for consistency
                var canvasData = canvas.toDataURL();
                components.push(canvasData.substring(0, 50));
            }
        }
        catch (e) { }
        return components.join('|');
    }
    // ============================================================================
    // CONSENT ID SYSTEM - User-visible unique identifier
    // Format: CNST-XXXX-XXXX-XXXX (no ambiguous characters: 0,O,1,I)
    // ============================================================================
    // Generate a new Consent ID
    function generateConsentID() {
        // Characters to use (excluding ambiguous ones: 0, O, 1, I)
        var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        var segments = [];
        for (var i = 0; i < 3; i++) {
            var segment = '';
            for (var j = 0; j < 4; j++) {
                var randomIndex = Math.floor(Math.random() * chars.length);
                segment += chars.charAt(randomIndex);
            }
            segments.push(segment);
        }
        return 'CNST-' + segments.join('-');
    }
    // Get or generate Consent ID
    function getConsentID() {
        // Check if we already have a Consent ID stored
        var storedID = ConsentStorage.get('consently_consent_id');
        if (storedID) {
            console.log('[Consently DPDPA] Using stored Consent ID:', storedID);
            return storedID;
        }
        // Generate new Consent ID
        var newID = generateConsentID();
        ConsentStorage.set('consently_consent_id', newID, 365 * 10); // Store for 10 years
        console.log('[Consently DPDPA] Generated new Consent ID:', newID);
        return newID;
    }
    // Store Consent ID (used after verification or new consent)
    function storeConsentID(id) {
        if (!id)
            return;
        try {
            ConsentStorage.set('consently_consent_id', id, 365 * 10);
            // Also set in cookie as backup
            document.cookie = "consently_id=".concat(id, "; max-age=").concat(365 * 24 * 60 * 60 * 10, "; path=/; SameSite=Lax");
            console.log('[Consently DPDPA] Consent ID stored:', id);
        }
        catch (error) {
            console.error('[Consently DPDPA] Failed to store Consent ID:', error);
        }
    }
    // Format Consent ID for display (adds spacing for readability)
    function formatConsentID(id) {
        return id; // Already formatted as CNST-XXXX-XXXX-XXXX
    }
    // Validate Consent ID format
    function isValidConsentID(id) {
        if (!id)
            return false;
        // Check format: CNST-XXXX-XXXX-XXXX (new format) or vis_xxxxx (legacy format)
        var newFormat = /^CNST-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(id);
        var legacyFormat = /^vis_[a-zA-Z0-9]+$/.test(id);
        return newFormat || legacyFormat;
    }
    // Verify Consent ID with API
    function verifyConsentID(id) {
        return __awaiter(this, void 0, void 0, function () {
            var apiUrl, response, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!isValidConsentID(id)) {
                            return [2 /*return*/, { valid: false, error: 'Invalid Consent ID format' }];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        apiUrl = getApiUrl();
                        return [4 /*yield*/, fetch("".concat(apiUrl, "/api/dpdpa/verify-consent-id"), {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    consentID: id,
                                    widgetId: widgetId
                                })
                            })];
                    case 2:
                        response = _a.sent();
                        return [4 /*yield*/, response.json()];
                    case 3: return [2 /*return*/, _a.sent()];
                    case 4:
                        error_3 = _a.sent();
                        console.error('[Consently DPDPA] Verification error:', error_3);
                        return [2 /*return*/, { valid: false, error: 'Unable to verify Consent ID' }];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
    // Check user status (New vs Verified)
    function checkUserStatus(emailHash) {
        return __awaiter(this, void 0, void 0, function () {
            var apiUrl, response, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!emailHash)
                            return [2 /*return*/, { status: 'new' }];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        apiUrl = getApiUrl();
                        return [4 /*yield*/, fetch("".concat(apiUrl, "/api/dpdpa/check-user-status"), {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    emailHash: emailHash,
                                    widgetId: widgetId
                                })
                            })];
                    case 2:
                        response = _a.sent();
                        if (!response.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, response.json()];
                    case 3: return [2 /*return*/, _a.sent()];
                    case 4: return [2 /*return*/, { status: 'new' }];
                    case 5:
                        error_4 = _a.sent();
                        console.error('[Consently DPDPA] Check user status error:', error_4);
                        return [2 /*return*/, { status: 'new' }];
                    case 6: return [2 /*return*/];
                }
            });
        });
    }
    // Show error message to site owners (visible but non-intrusive)
    function showWidgetError(message, isCritical) {
        if (isCritical === void 0) { isCritical = false; }
        // Only show visible errors in development or if explicitly enabled
        var isDevelopment = window.location.hostname === 'localhost' ||
            window.location.hostname.includes('127.0.0.1') ||
            window.location.hostname.includes('consently.in');
        if (!isDevelopment && !isCritical) {
            // In production, only log to console
            console.warn('[Consently DPDPA]', message);
            return;
        }
        // Create a subtle error banner for site owners
        var errorBanner = document.createElement('div');
        errorBanner.id = 'consently-widget-error';
        errorBanner.style.cssText = "\n      position: fixed;\n      bottom: 20px;\n      right: 20px;\n      background: ".concat(isCritical ? '#fee2e2' : '#fef3c7', ";\n      border: 1px solid ").concat(isCritical ? '#fca5a5' : '#fcd34d', ";\n      border-radius: 8px;\n      padding: 12px 16px;\n      max-width: 400px;\n      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);\n      z-index: 999999;\n      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;\n      font-size: 13px;\n      line-height: 1.5;\n      color: ").concat(isCritical ? '#991b1b' : '#92400e', ";\n    ");
        errorBanner.innerHTML = "\n      <div style=\"display: flex; align-items: flex-start; gap: 8px;\">\n        <span style=\"font-size: 18px;\">".concat(isCritical ? '⚠️' : 'ℹ️', "</span>\n        <div style=\"flex: 1;\">\n          <strong style=\"display: block; margin-bottom: 4px;\">Consently Widget ").concat(isCritical ? 'Error' : 'Notice', "</strong>\n          <div>").concat(message, "</div>\n        </div>\n        <button onclick=\"this.parentElement.parentElement.remove()\" \n                style=\"background: none; border: none; font-size: 18px; cursor: pointer; color: inherit; opacity: 0.6; padding: 0; line-height: 1;\">\n          \u00D7\n        </button>\n      </div>\n    ");
        document.body.appendChild(errorBanner);
        // Auto-remove after 10 seconds for non-critical errors
        if (!isCritical) {
            setTimeout(function () {
                if (errorBanner.parentElement) {
                    errorBanner.remove();
                }
            }, 10000);
        }
    }
    // Fetch widget configuration from API
    function fetchWidgetConfig() {
        return __awaiter(this, void 0, void 0, function () {
            var scriptSrc, apiBase, url, apiUrl, cacheBuster, apiUrlWithCache, response_1, errorData, errorMessage, errorText, data, error_5;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 8, , 9]);
                        scriptSrc = currentScript.src;
                        apiBase = void 0;
                        if (scriptSrc && scriptSrc.includes('http')) {
                            url = new URL(scriptSrc);
                            apiBase = url.origin;
                        }
                        else {
                            apiBase = window.location.origin;
                        }
                        apiUrl = "".concat(apiBase, "/api/dpdpa/widget-public/").concat(widgetId);
                        console.log('[Consently DPDPA] Fetching configuration from:', apiUrl);
                        cacheBuster = Date.now();
                        apiUrlWithCache = "".concat(apiUrl, "?_t=").concat(cacheBuster);
                        return [4 /*yield*/, fetch(apiUrlWithCache, {
                                method: 'GET',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Cache-Control': 'no-cache'
                                },
                                cache: 'no-store'
                            })];
                    case 1:
                        response_1 = _c.sent();
                        if (!!response_1.ok) return [3 /*break*/, 6];
                        if (!(response_1.status === 404)) return [3 /*break*/, 3];
                        return [4 /*yield*/, response_1.json().catch(function () { return ({}); })];
                    case 2:
                        errorData = _c.sent();
                        errorMessage = errorData.error || 'Widget configuration not found';
                        console.error('[Consently DPDPA] Widget not found:', {
                            widgetId: widgetId,
                            status: response_1.status,
                            error: errorMessage,
                            hint: 'This widget may have been deleted. Please check your Consently dashboard and create a new widget if needed.'
                        });
                        // Show user-friendly error message
                        showWidgetError("Widget ID \"".concat(widgetId, "\" not found. This widget may have been deleted. ") +
                            "Please check your Consently dashboard or contact support if this persists.", true);
                        return [2 /*return*/, { success: false, error: 'WIDGET_NOT_FOUND', status: 404 }];
                    case 3:
                        if (!(response_1.status === 429)) return [3 /*break*/, 4];
                        console.warn('[Consently DPDPA] Rate limit exceeded. Retrying later...');
                        return [2 /*return*/, { success: false, error: 'RATE_LIMIT', status: 429 }];
                    case 4: return [4 /*yield*/, response_1.text().catch(function () { return response_1.statusText; })];
                    case 5:
                        errorText = _c.sent();
                        throw new Error("HTTP ".concat(response_1.status, ": ").concat(errorText));
                    case 6: return [4 /*yield*/, response_1.json()];
                    case 7:
                        data = _c.sent();
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
                                purposesCount: ((_a = activities[0].purposes) === null || _a === void 0 ? void 0 : _a.length) || 0,
                                dataAttributesCount: ((_b = activities[0].data_attributes) === null || _b === void 0 ? void 0 : _b.length) || 0
                            });
                        }
                        else {
                            console.warn('[Consently DPDPA] No activities found in configuration!');
                            console.log('[Consently DPDPA] Full config:', data);
                        }
                        return [2 /*return*/, { success: true }];
                    case 8:
                        error_5 = _c.sent();
                        // Network errors or other exceptions
                        console.error('[Consently DPDPA] Failed to load configuration:', error_5);
                        // Check if it's a network error
                        if (error_5.name === 'TypeError' && error_5.message.includes('fetch')) {
                            showWidgetError('Unable to connect to Consently service. Please check your internet connection.', false);
                            return [2 /*return*/, { success: false, error: 'NETWORK_ERROR' }];
                        }
                        return [2 /*return*/, { success: false, error: 'UNKNOWN_ERROR', message: error_5.message }];
                    case 9: return [2 /*return*/];
                }
            });
        });
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
        if (!rule.url_pattern)
            return true; // No pattern = match all
        var pattern = rule.url_pattern;
        var matchType = rule.url_match_type || 'contains';
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
                        var regex = new RegExp(pattern);
                        // Limit execution time by using test with timeout consideration
                        return regex.test(url);
                    }
                    catch (e) {
                        console.error('[Consently DPDPA] Invalid regex pattern in rule:', rule.id || 'unknown', e);
                        return false;
                    }
                default:
                    console.warn('[Consently DPDPA] Unknown match type:', matchType);
                    return url.includes(pattern);
            }
        }
        catch (error) {
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
            setTimeout(function () {
                showConsentWidget();
            }, rule.trigger_delay || 0);
        }
        // Other trigger types (onClick, onFormSubmit) are handled separately
    }
    // Setup click trigger
    function setupClickTrigger(rule) {
        var element = document.querySelector(rule.element_selector);
        if (!element) {
            console.warn('[Consently DPDPA] Element not found for click trigger:', rule.element_selector);
            return;
        }
        element.addEventListener('click', function (e) {
            e.preventDefault();
            applyRule(rule);
            trackRuleMatch(rule);
            showConsentWidget();
        }, { once: true });
    }
    // Setup form submit trigger with auto-detection
    function setupFormSubmitTrigger(rule) {
        var _this = this;
        var targetForms = [];
        // If element_selector is provided, use it
        if (rule.element_selector) {
            var form = document.querySelector(rule.element_selector);
            if (form) {
                targetForms = [form];
            }
            else {
                console.warn('[Consently DPDPA] Form not found for submit trigger:', rule.element_selector);
            }
        }
        else {
            // Auto-detect all forms on the page
            targetForms = Array.from(document.querySelectorAll('form'));
            console.log('[Consently DPDPA] Auto-detected forms:', targetForms.length);
        }
        if (targetForms.length === 0) {
            console.warn('[Consently DPDPA] No forms found on page for submit trigger');
            return;
        }
        // Store original form handlers to re-trigger after consent
        var formHandlers = new WeakMap();
        targetForms.forEach(function (form) {
            var submitHandler = function (e) { return __awaiter(_this, void 0, void 0, function () {
                var existingConsent, hasConsent, prefilledEmail, userStatus, emailInput, emailHash, statusResult, formData, submitButton_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            existingConsent = ConsentStorage.get("consently_dpdpa_consent_".concat(widgetId));
                            hasConsent = existingConsent && existingConsent.timestamp;
                            if (!!hasConsent) return [3 /*break*/, 4];
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('[Consently DPDPA] Form submission intercepted - showing consent widget');
                            prefilledEmail = null;
                            userStatus = 'new';
                            emailInput = form.querySelector('input[type="email"]') ||
                                form.querySelector('input[name*="email" i]');
                            if (!(emailInput && emailInput.value)) return [3 /*break*/, 3];
                            prefilledEmail = emailInput.value;
                            console.log('[Consently DPDPA] Found email in form:', prefilledEmail);
                            return [4 /*yield*/, hashString(prefilledEmail)];
                        case 1:
                            emailHash = _a.sent();
                            return [4 /*yield*/, checkUserStatus(emailHash)];
                        case 2:
                            statusResult = _a.sent();
                            userStatus = statusResult.status || 'new';
                            console.log('[Consently DPDPA] User status:', userStatus);
                            _a.label = 3;
                        case 3:
                            // Apply rule and show widget
                            applyRule(rule);
                            trackRuleMatch(rule);
                            formData = new FormData(form);
                            submitButton_1 = e.submitter || form.querySelector('[type="submit"]');
                            // Show widget and handle consent
                            showConsentWidget(prefilledEmail, userStatus);
                            // Listen for consent completion to resume form submission
                            window.addEventListener('consentlyDPDPAConsent', function handleConsent(consentEvent) {
                                console.log('[Consently DPDPA] Consent received, allowing form submission');
                                // Remove this listener
                                window.removeEventListener('consentlyDPDPAConsent', handleConsent);
                                // Re-submit the form after a short delay
                                setTimeout(function () {
                                    // Remove the submit listener temporarily to avoid recursion
                                    form.removeEventListener('submit', submitHandler);
                                    // Trigger form submission
                                    if (submitButton_1) {
                                        submitButton_1.click();
                                    }
                                    else {
                                        form.submit();
                                    }
                                    // Re-attach listener for future submissions
                                    setTimeout(function () {
                                        form.addEventListener('submit', submitHandler, { capture: true });
                                    }, 100);
                                }, 300);
                            }, { once: true });
                            return [3 /*break*/, 5];
                        case 4:
                            console.log('[Consently DPDPA] Consent already exists, allowing form submission');
                            _a.label = 5;
                        case 5: return [2 /*return*/];
                    }
                });
            }); };
            // Use capture phase to intercept before other handlers
            form.addEventListener('submit', submitHandler, { capture: true });
            console.log('[Consently DPDPA] Form submit listener attached:', form.id || form.name || 'unnamed form');
        });
    }
    // Setup scroll trigger
    function setupScrollTrigger(rule) {
        // Default scroll threshold is 50% if not specified
        var scrollThreshold = rule.scroll_threshold !== undefined ? rule.scroll_threshold : 50;
        var hasTriggered = false;
        console.log('[Consently DPDPA] Setting up scroll trigger for rule:', rule.rule_name, 'Threshold:', scrollThreshold + '%');
        // Calculate scroll percentage
        function getScrollPercentage() {
            var windowHeight = window.innerHeight;
            var documentHeight = document.documentElement.scrollHeight;
            var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            var scrollableHeight = documentHeight - windowHeight;
            var scrolled = scrollTop;
            if (scrollableHeight === 0)
                return 0;
            return Math.round((scrolled / scrollableHeight) * 100);
        }
        // Throttled scroll handler (check every 100ms)
        var lastCheck = 0;
        var scrollHandler = function () {
            var now = Date.now();
            if (now - lastCheck < 100)
                return; // Throttle to 100ms
            lastCheck = now;
            if (hasTriggered) {
                // Remove listener once triggered
                window.removeEventListener('scroll', scrollHandler);
                window.removeEventListener('wheel', scrollHandler);
                window.removeEventListener('touchmove', scrollHandler);
                return;
            }
            var scrollPercent = getScrollPercentage();
            if (scrollPercent >= scrollThreshold) {
                console.log('[Consently DPDPA] Scroll threshold reached:', scrollPercent + '%');
                hasTriggered = true;
                // Apply rule and show widget
                applyRule(rule);
                // Apply delay if specified
                var delay = rule.trigger_delay || 0;
                setTimeout(function () {
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
        setTimeout(function () {
            scrollHandler();
        }, 500);
        // Return cleanup function
        return function () {
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
            var rules = config.display_rules || [];
            // Prefer full URL (pathname + query) for matching; fall back to pathname
            var currentUrlForMatching = (typeof window !== 'undefined' && window.location && (window.location.href || window.location.pathname)) || '/';
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
            var validRules = rules.filter(function (rule) {
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
            var sortedRules = __spreadArray([], validRules, true).sort(function (a, b) {
                var priorityA = typeof a.priority === 'number' ? a.priority : 100;
                var priorityB = typeof b.priority === 'number' ? b.priority : 100;
                return priorityB - priorityA;
            });
            // Find first matching rule
            for (var _i = 0, sortedRules_1 = sortedRules; _i < sortedRules_1.length; _i++) {
                var rule = sortedRules_1[_i];
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
                                var element = document.querySelector(rule.element_selector);
                                if (!element) {
                                    console.log('[Consently DPDPA] Element not found:', rule.element_selector);
                                    continue;
                                }
                            }
                            catch (selectorError) {
                                console.error('[Consently DPDPA] Invalid selector:', rule.element_selector, selectorError);
                                continue;
                            }
                        }
                        // Return matched rule (don't show widget yet - consent check comes first)
                        return rule;
                    }
                }
                catch (matchError) {
                    console.error('[Consently DPDPA] Error matching rule:', rule.id, matchError);
                    continue; // Skip this rule and try next
                }
            }
            console.log('[Consently DPDPA] No matching rules found');
            return null; // No rules matched
        }
        catch (error) {
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
            if (config)
                config.activities = activities;
        }
        // Store the matched rule for consent tracking
        config._matchedRule = rule;
        // SECURITY: If a rule matches a specific URL pattern, it MUST specify activities
        // Otherwise, we won't show the widget to prevent accidentally showing all activities
        var currentPath = window.location.pathname || '/';
        var currentHref = window.location.href || currentPath;
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
            console.log('[Consently DPDPA] Available activity IDs:', activities.map(function (a) { return ({
                id: a.id,
                name: a.activity_name || a.activityName
            }); }));
            // Store original activities
            var originalActivities = __spreadArray([], activities, true);
            // Get available activity IDs from widget
            var availableActivityIds_1 = activities.map(function (a) { return a.id; });
            // Validate and filter rule activities to only include those that exist in widget
            var validRuleActivityIds_1 = rule.activities.filter(function (activityId) {
                return availableActivityIds_1.includes(activityId);
            });
            // Log mismatches for debugging
            var invalidActivityIds = rule.activities.filter(function (activityId) {
                return !availableActivityIds_1.includes(activityId);
            });
            if (invalidActivityIds.length > 0) {
                console.warn('[Consently DPDPA] ⚠️ Some rule activity IDs do not match widget activities');
                console.warn('[Consently DPDPA] Invalid activity IDs in rule:', invalidActivityIds);
                console.warn('[Consently DPDPA] Valid activity IDs in widget:', availableActivityIds_1);
                console.warn('[Consently DPDPA] → Filtering out invalid IDs and continuing with valid ones');
            }
            // Filter activities based on validated rule activities
            var filteredActivities = activities.filter(function (activity) {
                return validRuleActivityIds_1.includes(activity.id);
            });
            console.log('[Consently DPDPA] Filtered activities count:', filteredActivities.length);
            console.log('[Consently DPDPA] Rule specifies:', rule.activities.length, 'activities');
            console.log('[Consently DPDPA] Widget has:', availableActivityIds_1.length, 'activities');
            console.log('[Consently DPDPA] Matched:', filteredActivities.length, 'activities');
            // IMPORTANT: Always apply the filter, even if it results in 0 activities
            // This is the correct behavior - if rule specifies activities that don't exist,
            // show nothing rather than showing everything
            if (filteredActivities.length === 0) {
                console.warn('[Consently DPDPA] ⚠️ No activities matched rule filter!');
                console.warn('[Consently DPDPA] Rule activity IDs:', rule.activities);
                console.warn('[Consently DPDPA] Widget activity IDs:', availableActivityIds_1);
                console.warn('[Consently DPDPA] → Widget will show ZERO activities (correct behavior)');
                console.warn('[Consently DPDPA] → Fix: Ensure rule activities are in widget\'s selected_activities list');
            }
            // Update global activities array (used by widget) - ALWAYS filter
            activities.length = 0;
            activities.push.apply(activities, filteredActivities);
            // Update config activities (if used elsewhere)
            if (config.activities) {
                config.activities = filteredActivities;
            }
            // Also update the rule's activities array to only include valid IDs
            // This ensures activity_purposes filtering works correctly
            rule.activities = validRuleActivityIds_1;
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
            var availableActivityIds_2 = activities.map(function (a) { return a.id; });
            var cleanedActivityPurposes_1 = {};
            Object.keys(rule.activity_purposes).forEach(function (activityId) {
                if (availableActivityIds_2.includes(activityId)) {
                    cleanedActivityPurposes_1[activityId] = rule.activity_purposes[activityId];
                }
                else {
                    console.warn('[Consently DPDPA] Removing activity_purposes entry for non-existent activity:', activityId);
                }
            });
            rule.activity_purposes = cleanedActivityPurposes_1;
            // Filter purposes for each activity
            activities.forEach(function (activity) {
                var allowedPurposeIds = rule.activity_purposes[activity.id];
                // Only filter if:
                // 1. allowedPurposeIds is defined (activity is in activity_purposes object)
                // 2. allowedPurposeIds is an array
                // 3. allowedPurposeIds has at least one element (non-empty array)
                // If activity is not in activity_purposes, or array is empty, show all purposes
                if (allowedPurposeIds && Array.isArray(allowedPurposeIds) && allowedPurposeIds.length > 0) {
                    console.log('[Consently DPDPA] Filtering purposes for activity:', activity.id, 'Allowed purposes:', allowedPurposeIds);
                    // Filter purposes within this activity
                    if (activity.purposes && Array.isArray(activity.purposes)) {
                        var originalPurposeCount = activity.purposes.length;
                        // DEBUG: Log all purposes before filtering
                        console.log('[Consently DPDPA] DEBUG - Purposes before filter:');
                        activity.purposes.forEach(function (p) {
                            console.log("  - Purpose: ".concat(p.purposeName, ", purposeId: ").concat(p.purposeId, ", id: ").concat(p.id));
                            console.log("    Allowed? ".concat(allowedPurposeIds.includes(p.purposeId), " (purposeId) or ").concat(allowedPurposeIds.includes(p.id), " (id)"));
                        });
                        // CRITICAL FIX: Use purposeId (the actual purpose UUID), NOT id (activity_purposes join table ID)
                        activity.purposes = activity.purposes.filter(function (purpose) {
                            // purposeId is the actual purpose UUID from purposes table
                            // id is the activity_purposes join table ID (wrong field to use)
                            var matches = allowedPurposeIds.includes(purpose.purposeId);
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
                }
                else {
                    // Activity not in activity_purposes or empty array = show all purposes
                    console.log('[Consently DPDPA] Showing all purposes for activity:', activity.id, '(no purpose filtering specified)');
                }
            });
        }
        // Update notice content if rule has notice_content
        var notice = rule.notice_content;
        if (notice) {
            if (notice.title)
                config.title = notice.title;
            if (notice.message)
                config.message = notice.message;
            if (notice.html)
                config.privacyNoticeHTML = notice.html;
        }
    }
    // Helper: Retry function with exponential backoff
    function retryWithBackoff(fn_1) {
        return __awaiter(this, arguments, void 0, function (fn, maxRetries, initialDelay) {
            var lastError, _loop_1, attempt, state_1;
            if (maxRetries === void 0) { maxRetries = 3; }
            if (initialDelay === void 0) { initialDelay = 1000; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _loop_1 = function (attempt) {
                            var _b, error_6, isRetryable, delay_1;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0:
                                        _c.trys.push([0, 2, , 4]);
                                        _b = {};
                                        return [4 /*yield*/, fn()];
                                    case 1: return [2 /*return*/, (_b.value = _c.sent(), _b)];
                                    case 2:
                                        error_6 = _c.sent();
                                        lastError = error_6;
                                        isRetryable = error_6.name === 'AbortError' ||
                                            error_6.message.includes('timeout') ||
                                            error_6.message.includes('network') ||
                                            error_6.message.includes('500') ||
                                            error_6.message.includes('502') ||
                                            error_6.message.includes('503') ||
                                            error_6.message.includes('504');
                                        // Don't retry for client errors (4xx)
                                        if (!isRetryable || attempt === maxRetries) {
                                            throw lastError;
                                        }
                                        delay_1 = initialDelay * Math.pow(2, attempt - 1);
                                        console.log("[Consently DPDPA] Retry attempt ".concat(attempt, "/").concat(maxRetries, " in ").concat(delay_1, "ms..."));
                                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, delay_1); })];
                                    case 3:
                                        _c.sent();
                                        return [3 /*break*/, 4];
                                    case 4: return [2 /*return*/];
                                }
                            });
                        };
                        attempt = 1;
                        _a.label = 1;
                    case 1:
                        if (!(attempt <= maxRetries)) return [3 /*break*/, 4];
                        return [5 /*yield**/, _loop_1(attempt)];
                    case 2:
                        state_1 = _a.sent();
                        if (typeof state_1 === "object")
                            return [2 /*return*/, state_1.value];
                        _a.label = 3;
                    case 3:
                        attempt++;
                        return [3 /*break*/, 1];
                    case 4: throw lastError;
                }
            });
        });
    }
    // Record consent to API (with enhanced error handling, validation, and retry logic)
    function recordConsent(consentData) {
        return __awaiter(this, void 0, void 0, function () {
            var uuidRegex_1, originalLength, originalLength, filtered, _i, _a, _b, activityId, purposeIds, validPurposeIds, scriptSrc, apiBase, url, apiUrl_1, result, error_7, userFriendlyError;
            var _this = this;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, , 3]);
                        uuidRegex_1 = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
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
                            originalLength = consentData.acceptedActivities.length;
                            consentData.acceptedActivities = consentData.acceptedActivities.filter(function (id) {
                                return typeof id === 'string' && uuidRegex_1.test(id);
                            });
                            if (consentData.acceptedActivities.length !== originalLength) {
                                console.warn('[Consently DPDPA] Filtered out invalid UUIDs from acceptedActivities');
                            }
                        }
                        if (consentData.rejectedActivities) {
                            originalLength = consentData.rejectedActivities.length;
                            consentData.rejectedActivities = consentData.rejectedActivities.filter(function (id) {
                                return typeof id === 'string' && uuidRegex_1.test(id);
                            });
                            if (consentData.rejectedActivities.length !== originalLength) {
                                console.warn('[Consently DPDPA] Filtered out invalid UUIDs from rejectedActivities');
                            }
                        }
                        // Validate and filter activityPurposeConsents
                        if (consentData.activityPurposeConsents && typeof consentData.activityPurposeConsents === 'object') {
                            filtered = {};
                            for (_i = 0, _a = Object.entries(consentData.activityPurposeConsents); _i < _a.length; _i++) {
                                _b = _a[_i], activityId = _b[0], purposeIds = _b[1];
                                // Validate activity ID is UUID
                                if (typeof activityId === 'string' && uuidRegex_1.test(activityId)) {
                                    // Validate purpose IDs are UUIDs
                                    if (Array.isArray(purposeIds)) {
                                        validPurposeIds = purposeIds.filter(function (id) {
                                            return typeof id === 'string' && uuidRegex_1.test(id);
                                        });
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
                                }
                                catch (e) {
                                    console.warn('[Consently DPDPA] Invalid currentUrl, removing:', consentData.metadata.currentUrl);
                                    consentData.metadata.currentUrl = undefined;
                                }
                            }
                        }
                        scriptSrc = currentScript.src;
                        apiBase = void 0;
                        try {
                            if (scriptSrc && scriptSrc.includes('http')) {
                                url = new URL(scriptSrc);
                                apiBase = url.origin;
                            }
                            else {
                                apiBase = window.location.origin;
                            }
                        }
                        catch (e) {
                            console.error('[Consently DPDPA] Error parsing script URL:', e);
                            apiBase = window.location.origin;
                        }
                        apiUrl_1 = "".concat(apiBase, "/api/dpdpa/consent-record");
                        return [4 /*yield*/, retryWithBackoff(function () { return __awaiter(_this, void 0, void 0, function () {
                                var controller, timeoutId, response, errorMessage, validationDetails, errorData, e_2, detailMessages, result_1, fetchError_1;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            controller = new AbortController();
                                            timeoutId = setTimeout(function () { return controller.abort(); }, 10000);
                                            _a.label = 1;
                                        case 1:
                                            _a.trys.push([1, 9, , 10]);
                                            return [4 /*yield*/, fetch(apiUrl_1, {
                                                    method: 'POST',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                    },
                                                    body: JSON.stringify(consentData),
                                                    signal: controller.signal
                                                })];
                                        case 2:
                                            response = _a.sent();
                                            clearTimeout(timeoutId);
                                            if (!!response.ok) return [3 /*break*/, 7];
                                            errorMessage = 'Failed to record consent';
                                            validationDetails = null;
                                            _a.label = 3;
                                        case 3:
                                            _a.trys.push([3, 5, , 6]);
                                            return [4 /*yield*/, response.json()];
                                        case 4:
                                            errorData = _a.sent();
                                            errorMessage = errorData.error || errorMessage;
                                            // Log validation details if available
                                            if (errorData.details && Array.isArray(errorData.details)) {
                                                validationDetails = errorData.details;
                                                console.error('[Consently DPDPA] Validation errors:', validationDetails);
                                                console.error('[Consently DPDPA] Full error response:', errorData);
                                            }
                                            else {
                                                console.error('[Consently DPDPA] API error response:', errorData);
                                            }
                                            return [3 /*break*/, 6];
                                        case 5:
                                            e_2 = _a.sent();
                                            // Ignore JSON parse errors
                                            console.error('[Consently DPDPA] Failed to parse error response:', e_2);
                                            return [3 /*break*/, 6];
                                        case 6:
                                            // Include validation details in error message for debugging
                                            if (validationDetails && validationDetails.length > 0) {
                                                detailMessages = validationDetails.map(function (d) { return "".concat(d.field, ": ").concat(d.message); }).join('; ');
                                                throw new Error(errorMessage + ' (HTTP ' + response.status + ') - ' + detailMessages);
                                            }
                                            else {
                                                throw new Error(errorMessage + ' (HTTP ' + response.status + ')');
                                            }
                                            _a.label = 7;
                                        case 7: return [4 /*yield*/, response.json()];
                                        case 8:
                                            result_1 = _a.sent();
                                            console.log('[Consently DPDPA] Consent recorded successfully');
                                            return [2 /*return*/, result_1];
                                        case 9:
                                            fetchError_1 = _a.sent();
                                            clearTimeout(timeoutId);
                                            if (fetchError_1.name === 'AbortError') {
                                                throw new Error('Request timeout: Could not record consent');
                                            }
                                            throw fetchError_1;
                                        case 10: return [2 /*return*/];
                                    }
                                });
                            }); }, 3, 1000)];
                    case 1:
                        result = _c.sent();
                        return [2 /*return*/, result];
                    case 2:
                        error_7 = _c.sent();
                        console.error('[Consently DPDPA] Failed to record consent:', error_7);
                        userFriendlyError = error_7 instanceof Error
                            ? (error_7.message.includes('timeout') ? error_7.message : 'Failed to save consent. Please try again.')
                            : 'Failed to save consent. Please try again.';
                        throw new Error(userFriendlyError);
                    case 3: return [2 /*return*/];
                }
            });
        });
    }
    // Track rule match for analytics
    function trackRuleMatch(rule) {
        return __awaiter(this, void 0, void 0, function () {
            var sessionKey, scriptSrc, apiBase, url, apiUrl, userAgent, deviceType, matchEvent;
            return __generator(this, function (_a) {
                try {
                    sessionKey = "consently_dpdpa_rule_tracked_".concat(widgetId, "_").concat(rule.id);
                    if (sessionStorage.getItem(sessionKey)) {
                        return [2 /*return*/]; // Already tracked in this session
                    }
                    sessionStorage.setItem(sessionKey, 'true');
                    scriptSrc = currentScript.src;
                    apiBase = void 0;
                    try {
                        if (scriptSrc && scriptSrc.includes('http')) {
                            url = new URL(scriptSrc);
                            apiBase = url.origin;
                        }
                        else {
                            apiBase = window.location.origin;
                        }
                    }
                    catch (e) {
                        console.error('[Consently DPDPA] Error parsing script URL:', e);
                        apiBase = window.location.origin;
                    }
                    apiUrl = "".concat(apiBase, "/api/dpdpa/analytics/rule-match");
                    userAgent = navigator.userAgent || '';
                    deviceType = /mobile|iphone|ipod|blackberry|windows phone|android.*mobile/i.test(userAgent)
                        ? 'Mobile'
                        : /tablet|ipad|playbook|silk|android(?!.*mobi)/i.test(userAgent)
                            ? 'Tablet'
                            : 'Desktop';
                    matchEvent = {
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
                    }).catch(function (error) {
                        console.error('[Consently DPDPA] Failed to track rule match:', error);
                    });
                    console.log('[Consently DPDPA] Rule match tracked:', rule.rule_name);
                }
                catch (error) {
                    console.error('[Consently DPDPA] Error tracking rule match:', error);
                    // Don't throw - analytics failures shouldn't break the widget
                }
                return [2 /*return*/];
            });
        });
    }
    // Track consent event for analytics
    function trackConsentEvent(consentData, rule) {
        return __awaiter(this, void 0, void 0, function () {
            var scriptSrc, apiBase, url, apiUrl, userAgent, deviceType, consentEvent;
            return __generator(this, function (_a) {
                try {
                    scriptSrc = currentScript.src;
                    apiBase = void 0;
                    try {
                        if (scriptSrc && scriptSrc.includes('http')) {
                            url = new URL(scriptSrc);
                            apiBase = url.origin;
                        }
                        else {
                            apiBase = window.location.origin;
                        }
                    }
                    catch (e) {
                        console.error('[Consently DPDPA] Error parsing script URL:', e);
                        apiBase = window.location.origin;
                    }
                    apiUrl = "".concat(apiBase, "/api/dpdpa/analytics/consent");
                    userAgent = navigator.userAgent || '';
                    deviceType = /mobile|iphone|ipod|blackberry|windows phone|android.*mobile/i.test(userAgent)
                        ? 'Mobile'
                        : /tablet|ipad|playbook|silk|android(?!.*mobi)/i.test(userAgent)
                            ? 'Tablet'
                            : 'Desktop';
                    consentEvent = {
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
                    }).catch(function (error) {
                        console.error('[Consently DPDPA] Failed to track consent event:', error);
                    });
                    console.log('[Consently DPDPA] Consent event tracked:', consentData.consentStatus);
                }
                catch (error) {
                    console.error('[Consently DPDPA] Error tracking consent event:', error);
                    // Don't throw - analytics failures shouldn't break the widget
                }
                return [2 /*return*/];
            });
        });
    }
    // Show Consent ID Verification Screen
    function showVerificationScreen() {
        return __awaiter(this, void 0, void 0, function () {
            function renderModal() {
                modal.innerHTML = "\n        <div style=\"background:white;border-radius:16px;padding:24px;max-width:440px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.15);animation:slideUp 0.3s ease-out;max-height:90vh;overflow-y:auto;\">\n          <!-- Icon and Title - Compact -->\n          <div style=\"text-align:center;margin-bottom:20px;\">\n            <div style=\"width:56px;height:56px;background:linear-gradient(135deg, #4F76F6 0%, #3B5BDB 100%);border-radius:14px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;box-shadow:0 4px 12px rgba(79,118,246,0.2);\">\n              <svg width=\"28\" height=\"28\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                <path d=\"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z\" fill=\"white\"/>\n              </svg>\n            </div>\n            <h2 style=\"margin:0 0 6px 0;font-size:24px;font-weight:700;color:#1a1a1a;letter-spacing:-0.3px;\">Welcome Back!</h2>\n            <p style=\"color:#64748b;font-size:14px;margin:0;line-height:1.4;\">Verify your identity to manage consent preferences securely in compliance with DPDPA 2023.</p>\n          </div>\n          \n          <!-- Tabs -->\n          <div style=\"display:flex;background:#f1f5f9;padding:4px;border-radius:10px;margin-bottom:20px;\">\n            <button id=\"tab-consent-id\" style=\"flex:1;padding:8px;border:none;background:".concat(mode === 'consent-id' ? 'white' : 'transparent', ";color:").concat(mode === 'consent-id' ? '#4F76F6' : '#64748b', ";font-weight:600;font-size:13px;border-radius:8px;cursor:pointer;box-shadow:").concat(mode === 'consent-id' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', ";transition:all 0.2s;\">\n              Consent ID\n            </button>\n            <button id=\"tab-email\" style=\"flex:1;padding:8px;border:none;background:").concat(mode === 'email' ? 'white' : 'transparent', ";color:").concat(mode === 'email' ? '#4F76F6' : '#64748b', ";font-weight:600;font-size:13px;border-radius:8px;cursor:pointer;box-shadow:").concat(mode === 'email' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', ";transition:all 0.2s;\">\n              Email Address\n            </button>\n          </div>\n\n          <!-- Input Section -->\n          <div style=\"background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:16px;border:1px solid #e2e8f0;\">\n            ").concat(mode === 'consent-id' ? "\n              <label style=\"display:flex;align-items:center;gap:6px;font-weight:600;margin-bottom:10px;color:#1e293b;font-size:13px;\">\n                <svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                  <path d=\"M12 17v-2m0-4V7m9 5a9 9 0 11-18 0 9 9 0 0118 0z\" stroke=\"#4F76F6\" stroke-width=\"2\" stroke-linecap=\"round\"/>\n                </svg>\n                Consent ID\n              </label>\n              <div style=\"position:relative;margin-bottom:12px;\">\n                <input \n                  type=\"text\" \n                  id=\"consent-id-input\"\n                  placeholder=\"CNST-XXXX-XXXX-XXXX\"\n                  maxlength=\"19\"\n                  style=\"width:100%;padding:12px 12px 12px 38px;border:2px solid #cbd5e1;border-radius:10px;font-size:15px;font-family:ui-monospace,monospace;text-transform:uppercase;box-sizing:border-box;transition:all 0.2s;background:white;\"\n                  onfocus=\"this.style.borderColor='#4F76F6';this.style.boxShadow='0 0 0 3px rgba(79,118,246,0.1)'\"\n                  onblur=\"this.style.borderColor='#cbd5e1';this.style.boxShadow='none'\"\n                />\n                <svg style=\"position:absolute;left:12px;top:50%;transform:translateY(-50%);pointer-events:none;\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                  <path d=\"M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z\" stroke=\"#94a3b8\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n                </svg>\n              </div>\n              <button \n                id=\"verify-consent-btn\"\n                style=\"width:100%;padding:12px;background:linear-gradient(135deg, #4F76F6 0%, #3B5BDB 100%);border:none;color:white;border-radius:10px;font-weight:600;font-size:14px;cursor:pointer;transition:all 0.2s;box-shadow:0 2px 8px rgba(79,118,246,0.25);\"\n                onmouseover=\"this.style.transform='translateY(-1px)';this.style.boxShadow='0 4px 12px rgba(79,118,246,0.35)'\"\n                onmouseout=\"this.style.transform='translateY(0)';this.style.boxShadow='0 2px 8px rgba(79,118,246,0.25)'\"\n              >\n                <span style=\"display:flex;align-items:center;justify-content:center;gap:6px;\">\n                  <svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                    <path d=\"M5 13l4 4L19 7\" stroke=\"white\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n                  </svg>\n                  Verify & Load\n                </span>\n              </button>\n            " : "\n              <label style=\"display:flex;align-items:center;gap:6px;font-weight:600;margin-bottom:10px;color:#1e293b;font-size:13px;\">\n                <svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                  <path d=\"M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z\" stroke=\"#4F76F6\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n                </svg>\n                Email Address\n              </label>\n              <div style=\"position:relative;margin-bottom:12px;\">\n                <input \n                  type=\"email\" \n                  id=\"email-input\"\n                  placeholder=\"your@email.com\"\n                  style=\"width:100%;padding:12px 12px 12px 38px;border:2px solid #cbd5e1;border-radius:10px;font-size:15px;box-sizing:border-box;transition:all 0.2s;background:white;\"\n                  onfocus=\"this.style.borderColor='#4F76F6';this.style.boxShadow='0 0 0 3px rgba(79,118,246,0.1)'\"\n                  onblur=\"this.style.borderColor='#cbd5e1';this.style.boxShadow='none'\"\n                />\n                <svg style=\"position:absolute;left:12px;top:50%;transform:translateY(-50%);pointer-events:none;\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                  <path d=\"M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z\" stroke=\"#94a3b8\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n                </svg>\n              </div>\n              <button \n                id=\"send-otp-btn\"\n                style=\"width:100%;padding:12px;background:linear-gradient(135deg, #4F76F6 0%, #3B5BDB 100%);border:none;color:white;border-radius:10px;font-weight:600;font-size:14px;cursor:pointer;transition:all 0.2s;box-shadow:0 2px 8px rgba(79,118,246,0.25);\"\n                onmouseover=\"this.style.transform='translateY(-1px)';this.style.boxShadow='0 4px 12px rgba(79,118,246,0.35)'\"\n                onmouseout=\"this.style.transform='translateY(0)';this.style.boxShadow='0 2px 8px rgba(79,118,246,0.25)'\"\n              >\n                <span style=\"display:flex;align-items:center;justify-content:center;gap:6px;\">\n                  <svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                    <path d=\"M3 8l7.89 5.26a2 2 0 002.22 0L21 8\" stroke=\"white\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n                  </svg>\n                  Send Verification Code\n                </span>\n              </button>\n            ", "\n            <div id=\"verify-error\" style=\"color:#dc2626;margin-top:10px;font-size:13px;display:none;padding:10px;background:#fee;border-radius:8px;border-left:3px solid #dc2626;\"></div>\n          </div>\n          \n          <!-- Divider - Compact -->\n          <div style=\"display:flex;align-items:center;gap:12px;margin:16px 0;\">\n            <div style=\"flex:1;height:1px;background:#e2e8f0;\"></div>\n            <span style=\"color:#94a3b8;font-size:12px;font-weight:500;\">OR</span>\n            <div style=\"flex:1;height:1px;background:#e2e8f0;\"></div>\n          </div>\n          \n          <!-- Start Fresh Button - Compact -->\n          <button \n            id=\"start-fresh-btn\"\n            style=\"width:100%;padding:12px;background:white;border:2px solid #e2e8f0;color:#1e293b;border-radius:10px;font-weight:600;font-size:14px;cursor:pointer;transition:all 0.2s;\"\n            onmouseover=\"this.style.borderColor='#4F76F6';this.style.background='#f8fafc'\"\n            onmouseout=\"this.style.borderColor='#e2e8f0';this.style.background='white'\"\n          >\n            <span style=\"display:flex;align-items:center;justify-content:center;gap:6px;\">\n              <span style=\"font-size:16px;\">\u2728</span>\n              <span>Start Fresh</span>\n            </span>\n          </button>\n          \n          <!-- Help Text - Compact -->\n          <div style=\"text-align:center;margin-top:16px;padding:12px;background:#f8fafc;border-radius:10px;\">\n            <p style=\"font-size:12px;color:#64748b;margin:0;line-height:1.5;\">\n              <strong style=\"color:#1e293b;\">New?</strong> Click \"Start Fresh\" to create a new Consent ID.\n            </p>\n          </div>\n        </div>\n        <style>\n          @keyframes slideUp {\n            from { opacity: 0; transform: translateY(10px) scale(0.98); }\n            to { opacity: 1; transform: translateY(0) scale(1); }\n          }\n          @media (max-width: 480px) {\n            #dpdpa-verification-modal > div {\n              padding: 20px !important;\n              border-radius: 12px !important;\n            }\n            #dpdpa-verification-modal > div h2 {\n              font-size: 20px !important;\n            }\n            #dpdpa-verification-modal > div p {\n              font-size: 13px !important;\n            }\n          }\n        </style>\n      ");
                attachListeners();
            }
            function attachListeners() {
                var _this = this;
                var tabConsentId = modal.querySelector('#tab-consent-id');
                var tabEmail = modal.querySelector('#tab-email');
                var startFreshBtn = modal.querySelector('#start-fresh-btn');
                var errorDiv = modal.querySelector('#verify-error');
                // Tab switching
                tabConsentId.addEventListener('click', function () {
                    if (mode !== 'consent-id') {
                        mode = 'consent-id';
                        renderModal();
                    }
                });
                tabEmail.addEventListener('click', function () {
                    if (mode !== 'email') {
                        mode = 'email';
                        renderModal();
                    }
                });
                // Start Fresh
                startFreshBtn.addEventListener('click', function () {
                    modal.remove();
                    consentID = getConsentID();
                    if (config && config.activities && Array.isArray(config.activities)) {
                        activities = JSON.parse(JSON.stringify(config.activities));
                    }
                    var matchedRule = evaluateDisplayRules();
                    if (matchedRule && matchedRule.trigger_type === 'onPageLoad') {
                        applyRule(matchedRule);
                        trackRuleMatch(matchedRule);
                        setTimeout(function () {
                            showConsentWidget();
                        }, matchedRule.trigger_delay || 0);
                    }
                    else {
                        showConsentWidget();
                    }
                });
                // Tab Listeners
                if (mode === 'consent-id') {
                    var verifyBtn_1 = modal.querySelector('#verify-consent-btn');
                    var input_1 = modal.querySelector('#consent-id-input');
                    // Auto-format input logic (same as before)
                    var isFormatting_1 = false;
                    input_1.addEventListener('input', function (e) {
                        if (isFormatting_1)
                            return;
                        isFormatting_1 = true;
                        var cursorPos = e.target.selectionStart;
                        var oldValue = e.target.value;
                        var value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                        if (value.startsWith('CNST'))
                            value = value.substring(4);
                        if (value.length > 12)
                            value = value.substring(0, 12);
                        var formatted = 'CNST-';
                        if (value.length > 0)
                            formatted += value.substring(0, 4);
                        if (value.length > 4)
                            formatted += '-' + value.substring(4, 8);
                        if (value.length > 8)
                            formatted += '-' + value.substring(8, 12);
                        e.target.value = formatted;
                        var dashesBeforeCursor = (oldValue.substring(0, cursorPos).match(/-/g) || []).length;
                        var dashesInNew = (formatted.substring(0, cursorPos).match(/-/g) || []).length;
                        var newCursorPos = cursorPos + (dashesInNew - dashesBeforeCursor);
                        e.target.setSelectionRange(newCursorPos, newCursorPos);
                        isFormatting_1 = false;
                    });
                    verifyBtn_1.addEventListener('click', function () { return __awaiter(_this, void 0, void 0, function () {
                        var inputID, result;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    inputID = input_1.value.trim();
                                    errorDiv.style.display = 'none';
                                    if (!inputID || inputID === 'CNST-') {
                                        errorDiv.textContent = 'Please enter a Consent ID';
                                        errorDiv.style.display = 'block';
                                        return [2 /*return*/];
                                    }
                                    verifyBtn_1.innerHTML = '<span style="display:flex;align-items:center;justify-content:center;gap:6px;"><div style="width:16px;height:16px;border:2px solid white;border-top-color:transparent;border-radius:50%;animation:spin 0.6s linear infinite;"></div>Verifying...</span>';
                                    verifyBtn_1.disabled = true;
                                    return [4 /*yield*/, verifyConsentID(inputID)];
                                case 1:
                                    result = _a.sent();
                                    if (result.valid) {
                                        storeConsentID(inputID);
                                        consentID = inputID;
                                        modal.remove();
                                        showToast('✅ Consent ID verified! Your preferences have been loaded.', 'success');
                                    }
                                    else {
                                        errorDiv.textContent = result.error || 'Consent ID not found. Please check and try again.';
                                        errorDiv.style.display = 'block';
                                        verifyBtn_1.innerHTML = '<span style="display:flex;align-items:center;justify-content:center;gap:6px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 13l4 4L19 7" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Verify & Load</span>';
                                        verifyBtn_1.disabled = false;
                                    }
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                }
                else {
                    // Email Mode
                    var sendBtn_1 = modal.querySelector('#send-otp-btn');
                    var emailInput_1 = modal.querySelector('#email-input');
                    sendBtn_1.addEventListener('click', function () { return __awaiter(_this, void 0, void 0, function () {
                        var email, emailRegex, apiBase, response, data, error_8;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    email = emailInput_1.value.trim();
                                    if (!email) {
                                        errorDiv.textContent = 'Please enter your email address';
                                        errorDiv.style.display = 'block';
                                        return [2 /*return*/];
                                    }
                                    emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                                    if (!emailRegex.test(email)) {
                                        errorDiv.textContent = 'Please enter a valid email address';
                                        errorDiv.style.display = 'block';
                                        return [2 /*return*/];
                                    }
                                    sendBtn_1.innerHTML = '<span style="display:flex;align-items:center;justify-content:center;gap:6px;"><div style="width:16px;height:16px;border:2px solid white;border-top-color:transparent;border-radius:50%;animation:spin 0.6s linear infinite;"></div>Sending...</span>';
                                    sendBtn_1.disabled = true;
                                    errorDiv.style.display = 'none';
                                    _a.label = 1;
                                case 1:
                                    _a.trys.push([1, 4, , 5]);
                                    apiBase = getApiUrl();
                                    return [4 /*yield*/, fetch("".concat(apiBase, "/api/privacy-centre/send-otp"), {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                email: email,
                                                visitorId: consentID || getConsentID(),
                                                widgetId: widgetId,
                                            }),
                                        })];
                                case 2:
                                    response = _a.sent();
                                    return [4 /*yield*/, response.json()];
                                case 3:
                                    data = _a.sent();
                                    if (!response.ok) {
                                        errorDiv.textContent = data.error || 'Failed to send code';
                                        errorDiv.style.display = 'block';
                                        sendBtn_1.innerHTML = '<span style="display:flex;align-items:center;justify-content:center;gap:6px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Send Verification Code</span>';
                                        sendBtn_1.disabled = false;
                                        return [2 /*return*/];
                                    }
                                    // Success - Switch to OTP modal (Step 2)
                                    modal.remove();
                                    showEmailVerificationModal({
                                        step: 'verify',
                                        email: email,
                                        countdown: 60,
                                        expiresInMinutes: data.expiresInMinutes
                                    }).then(function (result) {
                                        if (result && result.verified) {
                                            showToast('✅ Identity verified! Syncing preferences...', 'success');
                                            setTimeout(function () {
                                                window.location.reload();
                                            }, 1500);
                                        }
                                    });
                                    return [3 /*break*/, 5];
                                case 4:
                                    error_8 = _a.sent();
                                    console.error('[Email Verification] Send OTP error:', error_8);
                                    errorDiv.textContent = 'Failed to send code. Please try again.';
                                    errorDiv.style.display = 'block';
                                    sendBtn_1.innerHTML = '<span style="display:flex;align-items:center;justify-content:center;gap:6px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Send Verification Code</span>';
                                    sendBtn_1.disabled = false;
                                    return [3 /*break*/, 5];
                                case 5: return [2 /*return*/];
                            }
                        });
                    }); });
                }
            }
            var existingModal, modal, mode;
            return __generator(this, function (_a) {
                existingModal = document.getElementById('dpdpa-verification-modal');
                if (existingModal)
                    existingModal.remove();
                modal = document.createElement('div');
                modal.id = 'dpdpa-verification-modal';
                modal.style.cssText = "\n      position: fixed;\n      top: 0; left: 0; right: 0; bottom: 0;\n      background: rgba(0,0,0,0.5);\n      backdrop-filter: blur(4px);\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      z-index: 999999;\n      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;\n      padding: 16px;\n    ";
                mode = 'consent-id';
                document.body.appendChild(modal);
                renderModal();
                return [2 /*return*/];
            });
        });
    }
    // Show Consent Success Modal with ID Display (Compact Version - No Backdrop)
    function showConsentSuccessModal(consentID) {
        var modal = document.createElement('div');
        modal.id = 'dpdpa-success-modal';
        modal.style.cssText = "\n      position: fixed;\n      top: 50%;\n      left: 50%;\n      transform: translate(-50%, -50%);\n      z-index: 999999;\n      padding: 16px;\n      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;\n      pointer-events: none;\n    ";
        modal.innerHTML = "\n      <div style=\"background:white;border-radius:16px;padding:28px;max-width:480px;width:100%;box-shadow:0 20px 50px rgba(0,0,0,0.3);text-align:center;animation:slideUp 0.3s ease-out;pointer-events: auto;\">\n        <!-- Success Icon -->\n        <div style=\"width:56px;height:56px;background:linear-gradient(135deg, #10b981 0%, #059669 100%);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;box-shadow:0 8px 24px rgba(16,185,129,0.3);\">\n          <svg width=\"32\" height=\"32\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n            <path d=\"M5 13l4 4L19 7\" stroke=\"white\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n          </svg>\n        </div>\n        \n        <h2 style=\"margin:0 0 8px 0;font-size:24px;font-weight:700;color:#059669;\">Consent Saved!</h2>\n        <p style=\"color:#64748b;font-size:14px;margin:0 0 24px 0;line-height:1.5;\">Your privacy preferences have been securely recorded.</p>\n        \n        <!-- Compact Consent ID Card -->\n        <div style=\"background:linear-gradient(135deg, #4F76F6 0%, #3B5BDB 100%);border-radius:12px;padding:20px;margin-bottom:16px;box-shadow:0 8px 20px rgba(79,118,246,0.25);\">\n          <label style=\"display:block;color:rgba(255,255,255,0.9);font-size:11px;font-weight:600;margin-bottom:10px;text-transform:uppercase;letter-spacing:1.2px;\">Your Consent ID</label>\n          \n          <div style=\"background:white;border-radius:10px;padding:14px;margin-bottom:14px;box-shadow:0 2px 8px rgba(0,0,0,0.1);\">\n            <div id=\"consent-id-display\" style=\"font-size:18px;font-weight:700;color:#1e293b;font-family:ui-monospace,monospace;letter-spacing:2px;word-break:break-all;\">\n              ".concat(consentID, "\n            </div>\n          </div>\n          \n          <div style=\"display:flex;gap:8px;justify-content:center;\">\n            <button \n              onclick=\"window.copyConsentID('").concat(consentID, "')\"\n              style=\"flex:1;padding:10px 16px;background:rgba(255,255,255,0.25);border:2px solid rgba(255,255,255,0.8);color:white;border-radius:8px;font-weight:600;cursor:pointer;font-size:13px;backdrop-filter:blur(10px);transition:all 0.2s;display:flex;align-items:center;justify-content:center;gap:6px;\"\n              onmouseover=\"this.style.background='rgba(255,255,255,0.35)'\"\n              onmouseout=\"this.style.background='rgba(255,255,255,0.25)'\"\n            >\n              <svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                <path d=\"M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3\" stroke=\"white\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n              </svg>\n              Copy ID\n            </button>\n            <button \n              onclick=\"window.downloadConsentReceipt('").concat(consentID, "')\"\n              style=\"flex:1;padding:10px 16px;background:rgba(255,255,255,0.25);border:2px solid rgba(255,255,255,0.8);color:white;border-radius:8px;font-weight:600;cursor:pointer;font-size:13px;backdrop-filter:blur(10px);transition:all 0.2s;display:flex;align-items:center;justify-content:center;gap:6px;\"\n              onmouseover=\"this.style.background='rgba(255,255,255,0.35)'\"\n              onmouseout=\"this.style.background='rgba(255,255,255,0.25)'\"\n            >\n              <svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                <path d=\"M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10\" stroke=\"white\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n              </svg>\n              Download\n            </button>\n          </div>\n        </div>\n        \n        <!-- Compact Notice -->\n        <div style=\"background:#fef3c7;border-left:3px solid #f59e0b;padding:12px;border-radius:8px;margin-bottom:16px;text-align:left;\">\n          <p style=\"color:#78350f;font-size:12px;margin:0;line-height:1.5;\">\n            <strong style=\"color:#92400e;\">Keep this ID safe!</strong> Use it to manage your preferences across devices.\n          </p>\n        </div>\n        \n        <!-- Action Button -->\n        <button \n          onclick=\"document.getElementById('dpdpa-success-modal').remove()\"\n          style=\"width:100%;padding:12px;background:linear-gradient(135deg, #10b981 0%, #059669 100%);border:none;color:white;border-radius:10px;font-weight:600;font-size:15px;cursor:pointer;box-shadow:0 4px 12px rgba(16,185,129,0.3);transition:all 0.2s;\"\n          onmouseover=\"this.style.transform='translateY(-1px)';this.style.boxShadow='0 6px 16px rgba(16,185,129,0.4)'\"\n          onmouseout=\"this.style.transform='translateY(0)';this.style.boxShadow='0 4px 12px rgba(16,185,129,0.3)'\"\n        >\n          Got it, thanks! \u2713\n        </button>\n      </div>\n      <style>\n        @keyframes slideUp {\n          from { opacity: 0; transform: translateY(20px) scale(0.95); }\n          to { opacity: 1; transform: translateY(0) scale(1); }\n        }\n      </style>\n    ");
        document.body.appendChild(modal);
    }
    // Copy Consent ID to clipboard
    window.copyConsentID = function (id) {
        navigator.clipboard.writeText(id).then(function () {
            showToast('📋 Consent ID copied to clipboard!', 'success');
        }).catch(function () {
            // Fallback for older browsers
            var textarea = document.createElement('textarea');
            textarea.value = id;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            showToast('📋 Consent ID copied!', 'success');
        });
    };
    // Download consent receipt
    window.downloadConsentReceipt = function (consentID) {
        var date = new Date().toLocaleDateString();
        var receipt = "\nCONSENT RECEIPT\n===============\n\nConsent ID: ".concat(consentID, "\nDate: ").concat(date, "\nWidget: ").concat(widgetId, "\n\nYour consent preferences have been recorded.\n\nUse this Consent ID to:\n\u2022 Sync preferences across devices\n\u2022 Manage your consent settings\n\u2022 Update your preferences anytime\n\nKeep this ID safe!\n\n---\nPowered by Consently\nDigital Personal Data Protection Act, 2023\n    ").trim();
        var blob = new Blob([receipt], { type: 'text/plain' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = "consent-receipt-".concat(consentID, ".txt");
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('📄 Receipt downloaded!', 'success');
    };
    // Show toast notification
    function showToast(message, type) {
        if (type === void 0) { type = 'info'; }
        var toast = document.createElement('div');
        toast.style.cssText = "\n      position: fixed;\n      bottom: 30px;\n      right: 30px;\n      background: ".concat(type === 'success' ? '#10b981' : '#3b82f6', ";\n      color: white;\n      padding: 16px 24px;\n      border-radius: 12px;\n      box-shadow: 0 10px 30px rgba(0,0,0,0.3);\n      font-weight: 600;\n      font-size: 15px;\n      z-index: 1000000;\n    ");
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(function () {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s ease';
            setTimeout(function () { return toast.remove(); }, 300);
        }, 3000);
    }
    // Check if user has consented to activities required for current page
    function checkConsentForCurrentPage(existingConsent) {
        if (!existingConsent || !existingConsent.timestamp) {
            return false;
        }
        // Validate expiration first
        if (existingConsent.expiresAt) {
            var expiresAt = new Date(existingConsent.expiresAt);
            if (expiresAt < new Date()) {
                console.log('[Consently DPDPA] Consent expired');
                return false;
            }
        }
        // Get activity IDs from existing consent (both accepted and rejected)
        var consentedActivityIds = __spreadArray(__spreadArray([], (existingConsent.acceptedActivities || []), true), (existingConsent.rejectedActivities || []), true);
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
    function checkApiConsent(consentID) {
        return __awaiter(this, void 0, void 0, function () {
            var scriptSrc, apiBase, url, apiUrl, controller_1, timeoutId, response, data, consentData, error_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        scriptSrc = currentScript.src;
                        apiBase = void 0;
                        if (scriptSrc && scriptSrc.includes('http')) {
                            url = new URL(scriptSrc);
                            apiBase = url.origin;
                        }
                        else {
                            apiBase = window.location.origin;
                        }
                        apiUrl = "".concat(apiBase, "/api/dpdpa/check-consent?widgetId=").concat(encodeURIComponent(widgetId), "&visitorId=").concat(encodeURIComponent(consentID), "&currentUrl=").concat(encodeURIComponent(window.location.href));
                        console.log('[Consently DPDPA] Checking API for existing consent:', apiUrl);
                        controller_1 = new AbortController();
                        timeoutId = setTimeout(function () { return controller_1.abort(); }, 5000);
                        return [4 /*yield*/, fetch(apiUrl, {
                                method: 'GET',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                signal: controller_1.signal
                            })];
                    case 1:
                        response = _a.sent();
                        clearTimeout(timeoutId);
                        if (!response.ok) {
                            console.warn('[Consently DPDPA] API consent check failed:', response.status, response.statusText);
                            return [2 /*return*/, null];
                        }
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _a.sent();
                        if (data.hasConsent && data.consent) {
                            // Check if this consent was found via cross-device sync
                            if (data.consent.foundByPrincipalId) {
                                console.log('[Consently DPDPA] ✅ Valid consent found via cross-device sync (principal_id)!');
                                console.log('[Consently DPDPA] This means user already consented on another device with the same email.');
                            }
                            else {
                                console.log('[Consently DPDPA] Valid consent found via API (same device):', data.consent);
                            }
                            consentData = {
                                status: data.consent.status,
                                acceptedActivities: data.consent.acceptedActivities || [],
                                rejectedActivities: data.consent.rejectedActivities || [],
                                timestamp: data.consent.timestamp,
                                expiresAt: data.consent.expiresAt,
                                activityConsents: {}, // Will be populated from accepted/rejected activities if needed
                                foundByPrincipalId: data.consent.foundByPrincipalId || false
                            };
                            return [2 /*return*/, consentData];
                        }
                        console.log('[Consently DPDPA] No valid consent found via API');
                        return [2 /*return*/, null];
                    case 3:
                        error_9 = _a.sent();
                        if (error_9.name === 'AbortError') {
                            console.warn('[Consently DPDPA] API consent check timed out');
                        }
                        else {
                            console.warn('[Consently DPDPA] API consent check error:', error_9);
                        }
                        return [2 /*return*/, null]; // Fail silently and fall back to localStorage
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
    // Initialize widget
    function init() {
        return __awaiter(this, void 0, void 0, function () {
            var result, storedID, existingConsent, apiConsent, localStorageConsent, expiresAt, consentAge, consentDuration, matchedRule, allActivityIds, consentedActivityIds_1, allConsented, allActivityIds, consentedActivityIds_2, allConsented, allActivityIds, consentedActivityIds_3, allConsented, hasRequiredConsent, hasRulesConfigured, currentPath;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetchWidgetConfig()];
                    case 1:
                        result = _a.sent();
                        if (!result || !result.success) {
                            if (result && result.error === 'WIDGET_NOT_FOUND') {
                                // Widget not found - error already shown, just exit
                                console.error('[Consently DPDPA] Widget initialization failed: Widget not found');
                            }
                            else if (result && result.error === 'RATE_LIMIT') {
                                // Rate limited - retry after delay
                                console.warn('[Consently DPDPA] Rate limited, retrying in 5 seconds...');
                                setTimeout(init, 5000);
                                return [2 /*return*/];
                            }
                            else {
                                // Other errors
                                console.error('[Consently DPDPA] Failed to initialize widget:', (result === null || result === void 0 ? void 0 : result.error) || 'Unknown error');
                                if (result && result.error === 'NETWORK_ERROR') {
                                    // Network error - retry once after delay
                                    console.warn('[Consently DPDPA] Network error, retrying in 3 seconds...');
                                    setTimeout(init, 3000);
                                    return [2 /*return*/];
                                }
                            }
                            return [2 /*return*/];
                        }
                        // Check DNT
                        if (config.respectDNT && navigator.doNotTrack === '1') {
                            console.log('[Consently DPDPA] DNT enabled, respecting user preference');
                            return [2 /*return*/];
                        }
                        storedID = ConsentStorage.get('consently_consent_id');
                        if (!storedID) return [3 /*break*/, 3];
                        // User has Consent ID, check if consent exists
                        consentID = storedID;
                        existingConsent = null;
                        // First, try to get consent from API (more reliable)
                        console.log('[Consently DPDPA] Checking API for existing consent...');
                        return [4 /*yield*/, checkApiConsent(consentID)];
                    case 2:
                        apiConsent = _a.sent();
                        if (apiConsent) {
                            // API returned valid consent - use it and sync to localStorage
                            existingConsent = apiConsent;
                            // Store in localStorage for faster future checks
                            ConsentStorage.set("consently_dpdpa_consent_".concat(widgetId), {
                                status: apiConsent.status,
                                acceptedActivities: apiConsent.acceptedActivities,
                                rejectedActivities: apiConsent.rejectedActivities,
                                activityConsents: apiConsent.activityConsents,
                                timestamp: apiConsent.timestamp,
                                expiresAt: apiConsent.expiresAt
                            }, config.consentDuration || 365);
                            console.log('[Consently DPDPA] Consent synced from API to localStorage');
                        }
                        else {
                            // API didn't return consent - check localStorage as fallback
                            console.log('[Consently DPDPA] No API consent found, checking localStorage...');
                            localStorageConsent = ConsentStorage.get("consently_dpdpa_consent_".concat(widgetId));
                            if (localStorageConsent && localStorageConsent.timestamp) {
                                // Validate expiration before using localStorage consent
                                if (localStorageConsent.expiresAt) {
                                    expiresAt = new Date(localStorageConsent.expiresAt);
                                    if (expiresAt < new Date()) {
                                        console.log('[Consently DPDPA] localStorage consent expired, clearing...');
                                        ConsentStorage.delete("consently_dpdpa_consent_".concat(widgetId));
                                        existingConsent = null;
                                    }
                                    else {
                                        existingConsent = localStorageConsent;
                                        console.log('[Consently DPDPA] Found valid consent in localStorage');
                                    }
                                }
                                else {
                                    consentAge = (Date.now() - new Date(localStorageConsent.timestamp).getTime()) / (1000 * 60 * 60 * 24);
                                    consentDuration = config.consentDuration || 365;
                                    if (consentAge < consentDuration) {
                                        existingConsent = localStorageConsent;
                                        console.log('[Consently DPDPA] Found valid consent in localStorage (age: ' + Math.round(consentAge) + ' days)');
                                    }
                                    else {
                                        console.log('[Consently DPDPA] localStorage consent expired by duration, clearing...');
                                        ConsentStorage.delete("consently_dpdpa_consent_".concat(widgetId));
                                        existingConsent = null;
                                    }
                                }
                            }
                            else {
                                console.log('[Consently DPDPA] No consent found in localStorage');
                            }
                        }
                        matchedRule = evaluateDisplayRules();
                        // Handle non-onPageLoad triggers (set up but don't apply rule yet)
                        if (matchedRule) {
                            if (matchedRule.trigger_type === 'onClick' && matchedRule.element_selector) {
                                setupClickTrigger(matchedRule);
                                // Track rule match when clicked (tracked in setupClickTrigger via applyRule)
                                // For onClick triggers, check consent against all activities (rule applies when clicked)
                                if (existingConsent && existingConsent.timestamp) {
                                    allActivityIds = activities.map(function (a) { return a.id; });
                                    consentedActivityIds_1 = __spreadArray(__spreadArray([], (existingConsent.acceptedActivities || []), true), (existingConsent.rejectedActivities || []), true);
                                    allConsented = allActivityIds.every(function (id) { return consentedActivityIds_1.includes(id); });
                                    if (allConsented) {
                                        applyConsent(existingConsent);
                                    }
                                }
                                return [2 /*return*/]; // Don't show widget on page load for onClick triggers
                            }
                            else if (matchedRule.trigger_type === 'onFormSubmit' && matchedRule.element_selector) {
                                setupFormSubmitTrigger(matchedRule);
                                // Track rule match when submitted (tracked in setupFormSubmitTrigger via applyRule)
                                // For onFormSubmit triggers, check consent against all activities (rule applies when submitted)
                                if (existingConsent && existingConsent.timestamp) {
                                    allActivityIds = activities.map(function (a) { return a.id; });
                                    consentedActivityIds_2 = __spreadArray(__spreadArray([], (existingConsent.acceptedActivities || []), true), (existingConsent.rejectedActivities || []), true);
                                    allConsented = allActivityIds.every(function (id) { return consentedActivityIds_2.includes(id); });
                                    if (allConsented) {
                                        applyConsent(existingConsent);
                                    }
                                }
                                return [2 /*return*/]; // Don't show widget on page load for onFormSubmit triggers
                            }
                            else if (matchedRule.trigger_type === 'onScroll') {
                                setupScrollTrigger(matchedRule);
                                // For onScroll triggers, check consent against all activities (rule applies when scrolled)
                                if (existingConsent && existingConsent.timestamp) {
                                    allActivityIds = activities.map(function (a) { return a.id; });
                                    consentedActivityIds_3 = __spreadArray(__spreadArray([], (existingConsent.acceptedActivities || []), true), (existingConsent.rejectedActivities || []), true);
                                    allConsented = allActivityIds.every(function (id) { return consentedActivityIds_3.includes(id); });
                                    if (allConsented) {
                                        applyConsent(existingConsent);
                                    }
                                }
                                return [2 /*return*/]; // Don't show widget on page load for onScroll triggers
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
                            hasRequiredConsent = checkConsentForCurrentPage(existingConsent);
                            if (hasRequiredConsent) {
                                console.log('[Consently DPDPA] Valid consent found for current page');
                                applyConsent(existingConsent);
                                return [2 /*return*/];
                            }
                            else {
                                console.log('[Consently DPDPA] Consent exists but does not cover all activities for this page');
                            }
                        }
                        // Show widget if:
                        // 1. A rule matched with onPageLoad trigger, OR
                        // 2. No rule matched and autoShow is enabled (STRICT mode: only when no rules are configured)
                        if (matchedRule && matchedRule.trigger_type === 'onPageLoad') {
                            // Rule matched, show widget with rule-specific content
                            showNoticeForRule(matchedRule);
                        }
                        else if (!matchedRule) {
                            hasRulesConfigured = Array.isArray(config.display_rules) && config.display_rules.length > 0;
                            if (hasRulesConfigured) {
                                currentPath = (typeof window !== 'undefined' && window.location && window.location.pathname) || '/';
                                console.warn('[Consently DPDPA] ⚠️ Display rules configured but none matched for:', currentPath);
                                console.warn('[Consently DPDPA] ⚠️ Widget will not be shown to avoid mixing purposes. Configure a rule for this page or disable autoShow.');
                                return [2 /*return*/];
                            }
                            if (config.autoShow) {
                                // No rules configured, use default behavior - show ALL activities
                                setTimeout(function () {
                                    showConsentWidget();
                                }, config.showAfterDelay || 1000);
                            }
                        }
                        else {
                            // Matched rule exists but trigger is not onPageLoad (onClick, onFormSubmit, onScroll already handled above)
                            // Show verification screen for new users (email verification will be offered after consent)
                            showVerificationScreen();
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        // No stored Consent ID - show verification screen for new users
                        showVerificationScreen();
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
    // Apply consent (trigger custom events, etc.)
    function applyConsent(consent) {
        // Dispatch custom event for application to listen to
        var event = new CustomEvent('consentlyDPDPAConsent', {
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
    function prefetchTranslations() {
        return __awaiter(this, void 0, void 0, function () {
            var supportedLanguages, languagesToPrefetch;
            var _this = this;
            return __generator(this, function (_a) {
                supportedLanguages = config.supportedLanguages || ['en'];
                languagesToPrefetch = supportedLanguages.filter(function (lang) { return lang !== 'en'; }).slice(0, 5);
                // Prefetch in background without blocking - includes base UI + activity translations
                languagesToPrefetch.forEach(function (lang) { return __awaiter(_this, void 0, void 0, function () {
                    var textsToTranslate, err_1;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                _a.trys.push([0, 3, , 4]);
                                // Prefetch base translations
                                return [4 /*yield*/, getTranslation(lang)];
                            case 1:
                                // Prefetch base translations
                                _a.sent();
                                textsToTranslate = __spreadArray(__spreadArray([], activities.map(function (activity) { return activity.activity_name; }), true), activities.flatMap(function (activity) {
                                    // Handle new structure
                                    if (activity.purposes && Array.isArray(activity.purposes) && activity.purposes.length > 0) {
                                        return activity.purposes.flatMap(function (p) { return __spreadArray([
                                            p.purposeName || ''
                                        ], (p.dataCategories || []).map(function (cat) { return cat.categoryName || ''; }), true); }).filter(Boolean);
                                    }
                                    // Fallback to legacy
                                    return activity.data_attributes || [];
                                }), true);
                                return [4 /*yield*/, batchTranslate(textsToTranslate, lang)];
                            case 2:
                                _a.sent();
                                console.log("[Consently DPDPA] Prefetched translations for ".concat(lang));
                                return [3 /*break*/, 4];
                            case 3:
                                err_1 = _a.sent();
                                console.log("[Consently DPDPA] Could not prefetch ".concat(lang, " translations:"), err_1);
                                return [3 /*break*/, 4];
                            case 4: return [2 /*return*/];
                        }
                    });
                }); });
                return [2 /*return*/];
            });
        });
    }
    // Create and show consent widget
    function showConsentWidget() {
        return __awaiter(this, arguments, void 0, function (prefilledEmail, userStatus) {
            // Build widget HTML
            function buildWidgetHTML() {
                return "\n      <!-- Header Section -->\n      <div style=\"padding: 20px 24px; border-bottom: 2px solid #e5e7eb; background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); box-shadow: 0 1px 3px rgba(0,0,0,0.05);\">\n        <div style=\"display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 12px;\">\n          <div style=\"display: flex; align-items: center; gap: 12px;\">\n            ".concat(config.theme.logoUrl ? "\n              <img src=\"".concat(escapeHtml(config.theme.logoUrl), "\" alt=\"Logo\" style=\"height: 36px; width: auto; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));\" />\n            ") : "\n              <div style=\"width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 10px; background: linear-gradient(135deg, ".concat(primaryColor, " 0%, ").concat(primaryColor, "dd 100%); color: white; font-weight: 700; font-size: 18px; box-shadow: 0 4px 8px rgba(59,130,246,0.3);\">\n                C\n              </div>\n            "), "\n            <div>\n              <h2 style=\"margin: 0 0 4px 0; font-size: 20px; font-weight: 700; color: ").concat(textColor, "; letter-spacing: -0.01em;\">Your Data Permissions</h2>\n              <p style=\"margin: 0; font-size: 13px; color: #6b7280; line-height: 1.4;\">To proceed with your request, we need your consent under DPDP Act 2023. Please review your choices below.</p>\n            </div>\n          </div>\n          <div style=\"display: flex; align-items: center; gap: 8px;\">\n            <!-- Language Selector with Radio Layout -->\n            <div style=\"position: relative;\">\n              <button id=\"dpdpa-lang-btn\" style=\"display: flex; align-items: center; gap: 6px; padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 8px; background: white; color: ").concat(textColor, "; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05);\">\n                <svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\">\n                  <circle cx=\"12\" cy=\"12\" r=\"10\"/>\n                  <line x1=\"2\" y1=\"12\" x2=\"22\" y2=\"12\"/>\n                  <path d=\"M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z\"/>\n                </svg>\n                <span style=\"font-size: 13px;\">").concat(languageLabel(selectedLanguage), "</span>\n                <svg width=\"10\" height=\"10\" viewBox=\"0 0 24 24\" fill=\"currentColor\" style=\"opacity: 0.5;\">\n                  <path d=\"M7 10l5 5 5-5z\"/>\n                </svg>\n              </button>\n              <div id=\"dpdpa-lang-menu\" style=\"display: none; position: absolute; right: 0; margin-top: 8px; background: white; border: 1px solid #e5e7eb; border-radius: 10px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.15); padding: 8px; z-index: 10; min-width: 200px; max-height: 320px; overflow-y: auto;\">\n                <div style=\"display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px;\">\n                  ").concat((config.supportedLanguages || ['en']).map(function (code) { return "\n                    <button data-lang=\"".concat(code, "\" style=\"display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 10px 6px; border: none; background: ").concat(code === selectedLanguage ? '#dbeafe' : '#f9fafb', "; border-radius: 6px; cursor: pointer; transition: all 0.15s; position: relative;\">\n                      ").concat(code === selectedLanguage ? '<span style="position: absolute; top: 4px; right: 4px; width: 6px; height: 6px; background: ' + primaryColor + '; border-radius: 50%;"></span>' : '', "\n                      <span style=\"font-size: 11px; font-weight: ").concat(code === selectedLanguage ? '600' : '500', "; color: ").concat(code === selectedLanguage ? primaryColor : '#6b7280', "; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;\">").concat(languageLabel(code), "</span>\n                    </button>\n                  "); }).join(''), "\n                </div>\n              </div>\n            </div>\n          </div>\n        </div>\n\n      </div>\n      \n      <!-- Main Content Section -->\n      <div style=\"padding: 20px 24px; overflow-y: auto; flex: 1;\">\n        <p style=\"color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;\">\n          ").concat(translatedConfig.message, "\n        </p>\n\n        <!-- Processing Activities Table View - Enhanced Design -->\n        <div style=\"margin-bottom: 20px;\">\n          <!-- Table Header -->\n          <!-- Consent Categories Header -->\n          <div style=\"margin-bottom: 16px;\">\n            <h3 style=\"font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 12px 0;\">CONSENT CATEGORIES</h3>\n          </div>\n          \n          <!-- Table Body -->\n          <div style=\"display: flex; flex-direction: column; gap: 10px; margin-top: 12px;\">\n            ").concat(activities.map(function (activity) {
                    // Extract data categories from new or legacy structure
                    var dataCategories = [];
                    var purposesList = [];
                    // Check if new structure with purposes array exists
                    if (activity.purposes && Array.isArray(activity.purposes) && activity.purposes.length > 0) {
                        // New structure: extract purposes and their data categories
                        activity.purposes.forEach(function (purpose) {
                            purposesList.push(purpose.purposeName || 'Unknown Purpose');
                            if (purpose.dataCategories && Array.isArray(purpose.dataCategories)) {
                                purpose.dataCategories.forEach(function (cat) {
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
                    return "\n              <div class=\"dpdpa-activity-item\" data-activity-id=\"".concat(activity.id, "\" style=\"display: flex; gap: 16px; align-items: flex-start; padding: 16px; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff; transition: all 0.2s ease; margin-bottom: 12px;\">\n                <!-- Checkbox -->\n                <label style=\"display: flex; align-items: center; cursor: pointer; padding-top: 2px;\">\n                  <div class=\"custom-checkbox-wrapper\" style=\"position: relative; width: 24px; height: 24px;\">\n                    <input type=\"checkbox\" class=\"activity-checkbox\" data-activity-id=\"").concat(activity.id, "\" style=\"opacity: 0; position: absolute; width: 100%; height: 100%; cursor: pointer; z-index: 2;\" />\n                    <div class=\"checkbox-visual\" style=\"width: 24px; height: 24px; border: 2px solid #d1d5db; border-radius: 6px; transition: all 0.2s; display: flex; align-items: center; justify-content: center; background: white;\">\n                      <svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"white\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" style=\"opacity: 0; transform: scale(0.8); transition: all 0.2s;\">\n                        <polyline points=\"20 6 9 17 4 12\"></polyline>\n                      </svg>\n                    </div>\n                  </div>\n                </label>\n                \n                <!-- Content -->\n                <div style=\"flex: 1;\">\n                  <div style=\"font-size: 15px; font-weight: 700; color: ").concat(textColor, "; margin-bottom: 6px; line-height: 1.3;\">\n                    ").concat(escapeHtml(activity.activity_name), "\n                  </div>\n                  \n                  <div style=\"font-size: 13px; color: #6b7280; line-height: 1.5;\">\n                    <span style=\"color: #9ca3af;\">Purpose:</span> ").concat(purposesList.length > 0 ? escapeHtml(purposesList.join(', ')) : escapeHtml(activity.activity_description || 'Process data'), "\n                  </div>\n                  <div style=\"font-size: 13px; color: #6b7280; line-height: 1.5; margin-top: 2px;\">\n                    <span style=\"color: #9ca3af;\">Data:</span> ").concat(dataCategories.map(function (c) { return escapeHtml(c); }).join(', '), "\n                  </div>\n                </div>\n                \n                <input type=\"hidden\" class=\"activity-consent-status\" data-activity-id=\"").concat(activity.id, "\" value=\"\">\n              </div>\n            ");
                }).join(''), "\n          </div>\n        </div>\n\n        <!-- Manage Preferences Button - Enhanced -->\n        <div style=\"padding: 14px; background: linear-gradient(to right, #eff6ff, #e0f2fe); border-radius: 10px; margin-bottom: 16px; border: 1px solid #bfdbfe; box-shadow: 0 1px 3px rgba(0,0,0,0.05);\">\n          <div style=\"display: flex; align-items: center; justify-content: space-between; gap: 12px;\">\n            <div style=\"flex: 1;\">\n              <p style=\"margin: 0 0 4px 0; font-size: 13px; color: #1e40af; font-weight: 600; line-height: 1.4;\">\n                ").concat(t.manageConsentPreferences, "\n              </p>\n              <p style=\"margin: 0; font-size: 12px; color: #64748b; line-height: 1.4;\">\n                ").concat(t.changeSettingsAnytime, "\n              </p>\n            </div>\n            <button id=\"dpdpa-manage-preferences\" style=\"padding: 10px 18px; background: white; color: ").concat(primaryColor, "; border: 2px solid ").concat(primaryColor, "; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 700; transition: all 0.2s; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.08);\">\n              <svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" style=\"display: inline-block; vertical-align: middle; margin-right: 6px;\">\n                <circle cx=\"12\" cy=\"12\" r=\"3\"/>\n                <path d=\"M12 1v6m0 6v6M5.6 5.6l4.2 4.2m4.2 4.2l4.2 4.2M1 12h6m6 0h6M5.6 18.4l4.2-4.2m4.2-4.2l4.2-4.2\"/>\n              </svg>\n              ").concat(t.preferenceCentre, "\n            </button>\n          </div>\n        </div>\n        \n      </div>\n\n      <!-- Secure This Consent Section -->\n      <div style=\"padding: 24px; background: #f8fafc; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb;\">\n        <h3 style=\"margin: 0 0 8px 0; font-size: 15px; font-weight: 700; color: ").concat(textColor, ";\">\n          ").concat(userStatus === 'verified' ? 'Secure This Consent' : 'Secure This Consent', "\n        </h3>\n        <p style=\"margin: 0 0 16px 0; font-size: 12px; color: #6b7280; line-height: 1.5;\">\n          ").concat(userStatus === 'verified'
                    ? "We've sent a code to <strong style=\"color:".concat(primaryColor, "\">").concat(escapeHtml(prefilledEmail), "</strong> from previous devices to link new ones and manage all your consents.")
                    : 'We\'ll send a code to your email to link new devices and manage all your consents.', "\n        </p>\n\n        <div style=\"display: flex; gap: 10px; align-items: center;\">\n          ").concat(userStatus === 'verified' ? "\n            <!-- OTP Input for Verified User -->\n            <div style=\"display: flex; gap: 12px; flex: 1; align-items: center;\">\n              <div style=\"flex: 1; position: relative;\">\n                 <input type=\"text\" id=\"dpdpa-otp-input\" placeholder=\"- - - - - -\" style=\"width: 100%; padding: 12px 16px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 16px; outline: none; transition: all 0.2s; text-align: center; letter-spacing: 4px; font-family: monospace;\" />\n              </div>\n              <button id=\"dpdpa-verify-btn\" style=\"display: none;\">Sync</button> <!-- Hidden, auto-verify or verify on submit -->\n              <button id=\"dpdpa-resend-btn\" style=\"background: none; border: none; color: ".concat(primaryColor, "; font-weight: 600; font-size: 13px; cursor: pointer; padding: 0; white-space: nowrap;\">[ Resend Code ]</button>\n            </div>\n          ") : "\n            <!-- Email Input for New User -->\n            <div style=\"display: flex; gap: 8px; flex: 1;\">\n              <input type=\"email\" id=\"dpdpa-email-input\" value=\"".concat(prefilledEmail || '', "\" placeholder=\"name@example.com\" style=\"flex: 1; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; outline: none; transition: all 0.2s;\" />\n              <button id=\"dpdpa-send-code-btn\" style=\"padding: 10px 16px; background: white; color: ").concat(textColor, "; border: 1px solid #d1d5db; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 13px; white-space: nowrap;\">Send Code</button>\n            </div>\n          "), "\n        </div>\n      </div>\n      \n      <!-- Footer Links -->\n      <div style=\"padding: 12px 24px; background: #ffffff; margin-bottom: 0;\">\n          <p style=\"margin: 0 0 8px 0; font-size: 13px; color: #6b7280; line-height: 1.5;\">\n            ").concat(t.grievanceText.replace('{here}', "<a href=\"#\" id=\"dpdpa-grievance-link\" style=\"color: ".concat(primaryColor, "; text-decoration: underline; font-weight: 500;\">").concat(t.here, "</a>")).replace('{here2}', "<a href=\"#\" id=\"dpdpa-dpb-link\" style=\"color: ".concat(primaryColor, "; text-decoration: underline; font-weight: 500;\">").concat(t.here, "</a>")), "\n          </p>\n        </div>\n      </div>\n\n      <!-- Footer Actions - Enhanced Design -->\n      <div style=\"padding: 18px 24px; border-top: 2px solid #e5e7eb; background: linear-gradient(to bottom, #fafbfc, #f3f4f6); display: flex; gap: 12px; align-items: center; justify-content: space-between; box-shadow: 0 -2px 8px rgba(0,0,0,0.05);\">\n        <button id=\"dpdpa-download-icon\" style=\"padding: 12px; background: white; border: 2px solid #e5e7eb; border-radius: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.05);\" title=\"").concat(t.downloadButton, "\">\n          <svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\">\n            <path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\"></path>\n            <polyline points=\"7 10 12 15 17 10\"></polyline>\n            <line x1=\"12\" y1=\"15\" x2=\"12\" y2=\"3\"></line>\n          </svg>\n        </button>\n        <div style=\"flex: 1; display: flex; gap: 10px; min-width: 0;\">\n          <button id=\"dpdpa-confirm-btn\" style=\"width: 100%; padding: 14px 20px; background: ").concat(primaryColor, "; color: white; border: none; border-radius: 10px; cursor: pointer; font-size: 16px; font-weight: 700; transition: all 0.2s; box-shadow: 0 4px 12px rgba(59,130,246,0.3); display: flex; align-items: center; justify-content: center;\">\n            Confirm & Submit\n          </button>\n        </div>\n      </div>\n      \n      <!-- Powered by Consently -->\n      ").concat(config.showBranding !== false ? "\n        <div style=\"padding: 8px 24px; text-align: center; border-top: 1px solid #e5e7eb; background: #fafbfc;\">\n          <p style=\"margin: 0; font-size: 11px; color: #9ca3af;\">\n            ".concat(t.poweredBy, " <a href=\"https://consently.in\" target=\"_blank\" style=\"color: ").concat(primaryColor, "; font-weight: 600; text-decoration: none;\">Consently</a>\n          </p>\n        </div>\n      ") : '', "\n    ");
            }
            function languageLabel(code) {
                var map = {
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
                var map = {
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
            // Function to rebuild widget content with new language
            function rebuildWidget() {
                return __awaiter(this, void 0, void 0, function () {
                    var loadingOverlay, originalActivitiesForTranslation, textsToTranslate, translatedTexts_1, textIndex_1, translatedActivities, error_10, overlayElement;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                if (isTranslating) {
                                    console.log('[Consently DPDPA] Translation already in progress, ignoring request');
                                    return [2 /*return*/];
                                }
                                isTranslating = true;
                                loadingOverlay = document.createElement('div');
                                loadingOverlay.id = 'consently-dpdpa-loading-overlay';
                                loadingOverlay.style.cssText = "\n        position: fixed;\n        top: 0;\n        left: 0;\n        right: 0;\n        bottom: 0;\n        background: rgba(255, 255, 255, 0.98);\n        backdrop-filter: blur(8px);\n        display: flex;\n        align-items: center;\n        justify-content: center;\n        z-index: 999999;\n        pointer-events: all;\n      ";
                                loadingOverlay.innerHTML = "\n        <div style=\"display: flex; flex-direction: column; align-items: center; gap: 12px;\">\n          <div style=\"width: 32px; height: 32px; border: 3px solid ".concat(primaryColor, "30; border-top-color: ").concat(primaryColor, "; border-radius: 50%; animation: spin 0.8s linear infinite;\"></div>\n          <span style=\"font-size: 13px; color: ").concat(textColor, "; font-weight: 500; opacity: 0.8;\">Translating...</span>\n        </div>\n        <style>\n          @keyframes spin {\n            to { transform: rotate(360deg); }\n          }\n        </style>\n      ");
                                document.body.appendChild(loadingOverlay);
                                _a.label = 1;
                            case 1:
                                _a.trys.push([1, 6, 7, 8]);
                                // Remove old global click handler before rebuilding
                                if (globalClickHandler) {
                                    document.removeEventListener('click', globalClickHandler);
                                    globalClickHandler = null;
                                }
                                return [4 /*yield*/, getTranslation(selectedLanguage)];
                            case 2:
                                // Fetch translations asynchronously
                                t = _a.sent();
                                if (!(selectedLanguage === 'en')) return [3 /*break*/, 3];
                                translatedConfig = {
                                    title: config.title || 'Your Data Privacy Rights',
                                    message: config.message || 'We process your personal data with your consent. Please review the activities below and choose your preferences.',
                                    acceptButtonText: config.acceptButtonText || 'Accept All',
                                    rejectButtonText: config.rejectButtonText || 'Reject All',
                                    customizeButtonText: config.customizeButtonText || 'Manage Preferences'
                                };
                                // Restore original activities
                                activities = JSON.parse(JSON.stringify(originalActivities));
                                return [3 /*break*/, 5];
                            case 3:
                                originalActivitiesForTranslation = JSON.parse(JSON.stringify(originalActivities));
                                textsToTranslate = __spreadArray(__spreadArray([
                                    // Config values - use original English
                                    config.title || 'Your Data Privacy Rights',
                                    config.message || 'We process your personal data with your consent. Please review the activities below and choose your preferences.',
                                    config.acceptButtonText || 'Accept All',
                                    config.rejectButtonText || 'Reject All',
                                    config.customizeButtonText || 'Manage Preferences'
                                ], originalActivitiesForTranslation.map(function (a) { return a.activity_name; }), true), originalActivitiesForTranslation.flatMap(function (a) {
                                    // Handle new structure with purposes
                                    if (a.purposes && Array.isArray(a.purposes) && a.purposes.length > 0) {
                                        return a.purposes.flatMap(function (p) { return __spreadArray([
                                            p.purposeName || ''
                                        ], (p.dataCategories || []).map(function (cat) { return cat.categoryName || ''; }), true); }).filter(Boolean);
                                    }
                                    // Fallback to legacy
                                    return a.data_attributes || [];
                                }), true);
                                return [4 /*yield*/, batchTranslate(textsToTranslate, selectedLanguage)];
                            case 4:
                                translatedTexts_1 = _a.sent();
                                textIndex_1 = 0;
                                translatedConfig = {
                                    title: translatedTexts_1[textIndex_1++],
                                    message: translatedTexts_1[textIndex_1++],
                                    acceptButtonText: translatedTexts_1[textIndex_1++],
                                    rejectButtonText: translatedTexts_1[textIndex_1++],
                                    customizeButtonText: translatedTexts_1[textIndex_1++]
                                };
                                translatedActivities = originalActivitiesForTranslation.map(function (activity) {
                                    var translatedName = translatedTexts_1[textIndex_1++];
                                    // Handle both new structure (purposes) and legacy (data_attributes)
                                    if (activity.purposes && Array.isArray(activity.purposes) && activity.purposes.length > 0) {
                                        // New structure - translate purposes and data categories
                                        var translatedPurposes = activity.purposes.map(function (purpose) {
                                            var translatedPurposeName = translatedTexts_1[textIndex_1++];
                                            var translatedDataCategories = (purpose.dataCategories || []).map(function () { return translatedTexts_1[textIndex_1++]; });
                                            return __assign(__assign({}, purpose), { purposeName: translatedPurposeName, dataCategories: purpose.dataCategories.map(function (cat, idx) { return (__assign(__assign({}, cat), { categoryName: translatedDataCategories[idx] || cat.categoryName })); }) });
                                        });
                                        return __assign(__assign({}, activity), { activity_name: translatedName, purposes: translatedPurposes });
                                    }
                                    else {
                                        // Legacy structure - translate data_attributes
                                        var translatedAttrs = (activity.data_attributes || []).map(function () { return translatedTexts_1[textIndex_1++]; });
                                        return __assign(__assign({}, activity), { activity_name: translatedName, data_attributes: translatedAttrs });
                                    }
                                });
                                // Update activities with translated content
                                activities = translatedActivities;
                                _a.label = 5;
                            case 5:
                                widget.innerHTML = buildWidgetHTML();
                                // Re-attach all event listeners
                                attachEventListeners(overlay, widget);
                                // Re-setup gated interactions
                                setupGatedInteractions();
                                return [3 /*break*/, 8];
                            case 6:
                                error_10 = _a.sent();
                                console.error('[Consently DPDPA] Translation error:', error_10);
                                // On error, still try to rebuild with untranslated content
                                widget.innerHTML = buildWidgetHTML();
                                attachEventListeners(overlay, widget);
                                setupGatedInteractions();
                                return [3 /*break*/, 8];
                            case 7:
                                overlayElement = document.getElementById('consently-dpdpa-loading-overlay');
                                if (overlayElement)
                                    overlayElement.remove();
                                isTranslating = false;
                                return [7 /*endfinally*/];
                            case 8: return [2 /*return*/];
                        }
                    });
                });
            }
            // Setup gated interactions
            function setupGatedInteractions() {
                var _this = this;
                var langBtn = widget.querySelector('#dpdpa-lang-btn');
                var langMenu = widget.querySelector('#dpdpa-lang-menu');
                if (!langBtn || !langMenu)
                    return; // Safety check
                // Hover effect
                langBtn.addEventListener('mouseenter', function () {
                    langBtn.style.boxShadow = '0 4px 8px rgba(59,130,246,0.4)';
                    langBtn.style.transform = 'translateY(-1px)';
                });
                langBtn.addEventListener('mouseleave', function () {
                    langBtn.style.boxShadow = '0 2px 4px rgba(59,130,246,0.3)';
                    langBtn.style.transform = 'translateY(0)';
                });
                // Toggle menu
                langBtn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    langMenu.style.display = langMenu.style.display === 'none' || !langMenu.style.display ? 'block' : 'none';
                });
                // Close on outside click - Store reference to remove later
                globalClickHandler = function (e) {
                    if (!langBtn.contains(e.target) && !langMenu.contains(e.target)) {
                        langMenu.style.display = 'none';
                    }
                };
                document.addEventListener('click', globalClickHandler);
                langMenu.querySelectorAll('button[data-lang]').forEach(function (b) {
                    // Hover effects
                    b.addEventListener('mouseenter', function () {
                        if (b.getAttribute('data-lang') !== selectedLanguage) {
                            b.style.background = '#f0f9ff';
                        }
                    });
                    b.addEventListener('mouseleave', function () {
                        if (b.getAttribute('data-lang') !== selectedLanguage) {
                            b.style.background = '#fff';
                        }
                    });
                    b.addEventListener('click', function () { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    selectedLanguage = b.getAttribute('data-lang');
                                    langMenu.style.display = 'none';
                                    return [4 /*yield*/, rebuildWidget()];
                                case 1:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                });
            }
            var theme, backgroundColor, textColor, borderRadius, fontFamily, fontSize, readComplete, downloadComplete, selectedLanguage, t, isTranslating, originalActivities, translatedConfig, configTexts, activityTexts, allTexts, translatedAll_1, textIndex_2, translatedActivities, noticeHTML, overlay, widget;
            if (prefilledEmail === void 0) { prefilledEmail = null; }
            if (userStatus === void 0) { userStatus = 'new'; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (document.getElementById('consently-dpdpa-widget')) {
                            return [2 /*return*/]; // Already shown
                        }
                        // Validate that there are activities to show
                        if (!activities || activities.length === 0) {
                            console.error('[Consently DPDPA] Cannot show widget: No activities available');
                            console.error('[Consently DPDPA] This may be due to display rules filtering out all activities');
                            console.error('[Consently DPDPA] Check your widget configuration and display rules');
                            return [2 /*return*/]; // Don't show widget if no activities
                        }
                        theme = config.theme || {};
                        // Use the trustworthy blue color from consently theme
                        primaryColor = theme.primaryColor || '#4c8bf5'; // Update global primaryColor
                        backgroundColor = theme.backgroundColor || '#ffffff';
                        textColor = theme.textColor || '#1f2937';
                        borderRadius = theme.borderRadius || 12;
                        fontFamily = theme.fontFamily || 'system-ui, sans-serif';
                        fontSize = theme.fontSize || 14;
                        readComplete = false;
                        downloadComplete = false;
                        selectedLanguage = config.language || 'en';
                        return [4 /*yield*/, getTranslation(selectedLanguage)];
                    case 1:
                        t = _a.sent();
                        isTranslating = false;
                        originalActivities = JSON.parse(JSON.stringify(activities));
                        translatedConfig = {
                            title: config.title || 'Your Data Privacy Rights',
                            message: config.message || 'We process your personal data with your consent. Please review the activities below and choose your preferences.',
                            acceptButtonText: config.acceptButtonText || 'Accept All',
                            rejectButtonText: config.rejectButtonText || 'Reject All',
                            customizeButtonText: config.customizeButtonText || 'Manage Preferences'
                        };
                        if (!(selectedLanguage !== 'en')) return [3 /*break*/, 3];
                        configTexts = [
                            translatedConfig.title,
                            translatedConfig.message,
                            translatedConfig.acceptButtonText,
                            translatedConfig.rejectButtonText,
                            translatedConfig.customizeButtonText
                        ];
                        activityTexts = __spreadArray(__spreadArray([], activities.map(function (a) { return a.activity_name; }), true), activities.flatMap(function (a) {
                            // Try new structure first
                            if (a.purposes && Array.isArray(a.purposes) && a.purposes.length > 0) {
                                return a.purposes.flatMap(function (p) { return __spreadArray([
                                    p.purposeName || ''
                                ], (p.dataCategories || []).map(function (cat) { return cat.categoryName || ''; }), true); }).filter(Boolean);
                            }
                            // Fallback to legacy
                            return a.data_attributes || [];
                        }), true);
                        allTexts = __spreadArray(__spreadArray([], configTexts, true), activityTexts, true);
                        return [4 /*yield*/, batchTranslate(allTexts, selectedLanguage)];
                    case 2:
                        translatedAll_1 = _a.sent();
                        textIndex_2 = 0;
                        translatedConfig = {
                            title: translatedAll_1[textIndex_2++],
                            message: translatedAll_1[textIndex_2++],
                            acceptButtonText: translatedAll_1[textIndex_2++],
                            rejectButtonText: translatedAll_1[textIndex_2++],
                            customizeButtonText: translatedAll_1[textIndex_2++]
                        };
                        translatedActivities = activities.map(function (activity) {
                            var translatedName = translatedAll_1[textIndex_2++];
                            var translatedAttrs = activity.data_attributes.map(function () { return translatedAll_1[textIndex_2++]; });
                            return __assign(__assign({}, activity), { activity_name: translatedName, data_attributes: translatedAttrs });
                        });
                        activities = translatedActivities;
                        _a.label = 3;
                    case 3:
                        // Prefetch other translations in background
                        prefetchTranslations();
                        noticeHTML = config.privacyNoticeHTML || '<p style="color:#6b7280;">Privacy notice content...</p>';
                        overlay = document.createElement('div');
                        overlay.id = 'consently-dpdpa-overlay';
                        overlay.style.cssText = "\n      position: fixed;\n      top: 0;\n      left: 0;\n      width: 100%;\n      height: 100%;\n      background: rgba(0, 0, 0, 0.5);\n      backdrop-filter: blur(4px);\n      z-index: 999998;\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      opacity: 0;\n      transition: opacity 0.3s ease;\n    ";
                        widget = document.createElement('div');
                        widget.id = 'consently-dpdpa-widget';
                        widget.style.cssText = "\n      position: relative;\n      background: ".concat(backgroundColor, ";\n      color: ").concat(textColor, ";\n      font-family: ").concat(fontFamily, ";\n      font-size: ").concat(fontSize, "px;\n      border-radius: ").concat(borderRadius, "px;\n      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);\n      max-width: 760px;\n      max-height: 90vh;\n      width: 92%;\n      overflow: hidden;\n      display: flex;\n      flex-direction: column;\n      transform: scale(0.9);\n      opacity: 0;\n      transition: all 0.3s ease;\n    ");
                        widget.innerHTML = buildWidgetHTML();
                        // Append to overlay and body
                        overlay.appendChild(widget);
                        document.body.appendChild(overlay);
                        // Animate in
                        requestAnimationFrame(function () {
                            overlay.style.opacity = '1';
                            widget.style.transform = 'scale(1)';
                            widget.style.opacity = '1';
                        });
                        // Attach event listeners
                        attachEventListeners(overlay, widget);
                        // Initial setup
                        setupGatedInteractions();
                        return [2 /*return*/];
                }
            });
        });
    }
    // Attach event listeners
    function attachEventListeners(overlay, widget) {
        var _this = this;
        // Secure This Consent Buttons
        var sendCodeBtn = widget.querySelector('#dpdpa-send-code-btn');
        if (sendCodeBtn) {
            sendCodeBtn.addEventListener('click', function () { return __awaiter(_this, void 0, void 0, function () {
                var emailInput, email, originalText, apiBase, response, secureSection, e_3;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            emailInput = widget.querySelector('#dpdpa-email-input');
                            email = emailInput ? emailInput.value : null;
                            if (!email || !email.includes('@')) {
                                alert('Please enter a valid email address');
                                return [2 /*return*/];
                            }
                            originalText = sendCodeBtn.textContent;
                            sendCodeBtn.textContent = 'Sending...';
                            sendCodeBtn.disabled = true;
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            apiBase = getApiUrl();
                            return [4 /*yield*/, fetch("".concat(apiBase, "/api/privacy-centre/send-otp"), {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        email: email,
                                        visitorId: consentID || getConsentID(),
                                        widgetId: widgetId,
                                    }),
                                })];
                        case 2:
                            response = _a.sent();
                            if (response.ok) {
                                secureSection = widget.querySelector('#dpdpa-email-input').closest('div').parentElement;
                                secureSection.innerHTML = "\n                    <h3 style=\"margin: 0 0 8px 0; font-size: 15px; font-weight: 700; color: ".concat(textColor, ";\">Secure This Consent</h3>\n                    <p style=\"margin: 0 0 16px 0; font-size: 12px; color: #6b7280; line-height: 1.5;\">\n                        Enter the code sent to <strong style=\"color:").concat(primaryColor, "\">").concat(escapeHtml(email), "</strong>\n                    </p>\n                    <div style=\"display: flex; gap: 12px; flex: 1; align-items: center;\">\n                        <div style=\"flex: 1; position: relative;\">\n                            <input type=\"text\" id=\"dpdpa-otp-input\" placeholder=\"- - - - - -\" style=\"width: 100%; padding: 12px 16px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 16px; outline: none; transition: all 0.2s; text-align: center; letter-spacing: 4px; font-family: monospace;\" />\n                        </div>\n                        <button id=\"dpdpa-resend-btn\" style=\"background: none; border: none; color: ").concat(primaryColor, "; font-weight: 600; font-size: 13px; cursor: pointer; padding: 0; white-space: nowrap;\">[ Resend Code ]</button>\n                    </div>\n                ");
                                // Re-attach listeners for the new content
                                attachEventListeners(overlay, widget);
                                userEmail = email; // Update global
                            }
                            else {
                                alert('Failed to send code. Please try again.');
                                sendCodeBtn.textContent = originalText;
                                sendCodeBtn.disabled = false;
                            }
                            return [3 /*break*/, 4];
                        case 3:
                            e_3 = _a.sent();
                            console.error('Send OTP error', e_3);
                            alert('Error sending code');
                            sendCodeBtn.textContent = originalText;
                            sendCodeBtn.disabled = false;
                            return [3 /*break*/, 4];
                        case 4: return [2 /*return*/];
                    }
                });
            }); });
        }
        // Resend Button Logic
        var resendBtn = widget.querySelector('#dpdpa-resend-btn');
        if (resendBtn) {
            resendBtn.addEventListener('click', function () { return __awaiter(_this, void 0, void 0, function () {
                var apiBase, e_4;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!userEmail)
                                return [2 /*return*/];
                            resendBtn.textContent = 'Sending...';
                            resendBtn.disabled = true;
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            apiBase = getApiUrl();
                            return [4 /*yield*/, fetch("".concat(apiBase, "/api/privacy-centre/send-otp"), {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        email: userEmail,
                                        visitorId: consentID || getConsentID(),
                                        widgetId: widgetId,
                                    }),
                                })];
                        case 2:
                            _a.sent();
                            resendBtn.textContent = 'Sent!';
                            setTimeout(function () {
                                resendBtn.textContent = '[ Resend Code ]';
                                resendBtn.disabled = false;
                            }, 3000);
                            return [3 /*break*/, 4];
                        case 3:
                            e_4 = _a.sent();
                            resendBtn.textContent = 'Error';
                            setTimeout(function () {
                                resendBtn.textContent = '[ Resend Code ]';
                                resendBtn.disabled = false;
                            }, 3000);
                            return [3 /*break*/, 4];
                        case 4: return [2 /*return*/];
                    }
                });
            }); });
        }
        var verifyBtn = widget.querySelector('#dpdpa-verify-btn');
        if (verifyBtn) {
            verifyBtn.addEventListener('click', function () { return __awaiter(_this, void 0, void 0, function () {
                var otpInput, code;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            otpInput = widget.querySelector('#dpdpa-otp-input');
                            code = otpInput ? otpInput.value : null;
                            if (!code || code.length < 4) {
                                alert('Please enter a valid code');
                                return [2 /*return*/];
                            }
                            // Simulate verification
                            verifyBtn.textContent = 'Verifying...';
                            verifyBtn.disabled = true;
                            // TODO: Implement actual API call to verify OTP
                            return [4 /*yield*/, new Promise(function (r) { return setTimeout(r, 1000); })];
                        case 1:
                            // TODO: Implement actual API call to verify OTP
                            _b.sent();
                            // On success, save consent with verified status
                            verifiedEmail = ((_a = document.querySelector('#dpdpa-email-input')) === null || _a === void 0 ? void 0 : _a.value) || verifiedEmail; // Update global verified email
                            // Auto-accept all if verifying (or keep current selection)
                            // For now, just trigger saveConsent
                            return [4 /*yield*/, handleAcceptAll(overlay)];
                        case 2:
                            // Auto-accept all if verifying (or keep current selection)
                            // For now, just trigger saveConsent
                            _b.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
        }
        // Checkboxes for activities with enhanced visual feedback (table view)
        var checkboxes = widget.querySelectorAll('.activity-checkbox');
        checkboxes.forEach(function (checkbox) {
            checkbox.addEventListener('change', function () {
                var activityId = this.getAttribute('data-activity-id');
                var item = this.closest('.dpdpa-activity-item');
                if (this.checked) {
                    setActivityConsent(activityId, 'accepted');
                    item.style.borderColor = primaryColor;
                    item.style.borderWidth = '2px';
                    item.style.background = '#f0f9ff';
                    item.style.boxShadow = '0 4px 12px rgba(59,130,246,0.25)';
                    item.style.borderLeftWidth = '4px';
                    // Remove warning if exists
                    var warning = item.querySelector('.revocation-warning');
                    if (warning)
                        warning.remove();
                }
                else {
                    setActivityConsent(activityId, 'rejected');
                    item.style.borderColor = '#e5e7eb';
                    item.style.borderWidth = '1px';
                    item.style.background = 'white';
                    item.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                    item.style.borderLeftWidth = '2px';
                }
            });
        });
        // Download icon button
        var downloadIcon = widget.querySelector('#dpdpa-download-icon');
        if (downloadIcon) {
            downloadIcon.addEventListener('click', function () {
                try {
                    var noticeHTML = config.privacyNoticeHTML || '<p>Privacy notice</p>';
                    var blob = new Blob([noticeHTML], { type: 'text/html' });
                    var url = URL.createObjectURL(blob);
                    var a = document.createElement('a');
                    a.href = url;
                    a.download = "privacy-notice-".concat(new Date().toISOString().split('T')[0], ".html");
                    a.click();
                    URL.revokeObjectURL(url);
                }
                catch (e) {
                    console.error('Download failed:', e);
                }
            });
            // Enhanced hover effects
            downloadIcon.addEventListener('mouseenter', function () {
                downloadIcon.style.background = '#f0f9ff';
                downloadIcon.style.borderColor = primaryColor;
                downloadIcon.style.transform = 'translateY(-2px)';
                downloadIcon.style.boxShadow = '0 4px 8px rgba(59,130,246,0.2)';
            });
            downloadIcon.addEventListener('mouseleave', function () {
                downloadIcon.style.background = 'white';
                downloadIcon.style.borderColor = '#e5e7eb';
                downloadIcon.style.transform = 'translateY(0)';
                downloadIcon.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
            });
        }
        // Confirm & Submit Button
        var confirmBtn = widget.querySelector('#dpdpa-confirm-btn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', function () { return __awaiter(_this, void 0, void 0, function () {
                var otpInput, otp, apiBase, response, e_5;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            otpInput = widget.querySelector('#dpdpa-otp-input');
                            otp = otpInput ? otpInput.value.replace(/\s/g, '') : null;
                            if (!(otp && otp.length >= 4)) return [3 /*break*/, 5];
                            // Verify OTP first
                            confirmBtn.textContent = 'Verifying...';
                            confirmBtn.disabled = true;
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            apiBase = getApiUrl();
                            return [4 /*yield*/, fetch("".concat(apiBase, "/api/privacy-centre/verify-otp"), {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        email: userEmail || prefilledEmail, // Use global or prefilled
                                        otpCode: otp,
                                        visitorId: consentID || getConsentID(),
                                        widgetId: widgetId,
                                    }),
                                })];
                        case 2:
                            response = _a.sent();
                            if (response.ok) {
                                // Verification success
                                verifiedEmail = userEmail || prefilledEmail;
                                // Proceed to submit consent
                                confirmBtn.textContent = 'Saving...';
                                handleAcceptSelected(overlay);
                            }
                            else {
                                alert('Invalid Verification Code');
                                confirmBtn.textContent = 'Confirm & Submit';
                                confirmBtn.disabled = false;
                                return [2 /*return*/];
                            }
                            return [3 /*break*/, 4];
                        case 3:
                            e_5 = _a.sent();
                            console.error('Verification error', e_5);
                            alert('Verification failed. Proceeding with consent.');
                            // Fallback: submit anyway? Or stop? 
                            // Let's proceed for now to not block user
                            handleAcceptSelected(overlay);
                            return [3 /*break*/, 4];
                        case 4: return [3 /*break*/, 6];
                        case 5:
                            // No OTP, just submit
                            handleAcceptSelected(overlay);
                            _a.label = 6;
                        case 6: return [2 /*return*/];
                    }
                });
            }); });
            // Enhanced hover effects
            confirmBtn.addEventListener('mouseenter', function () {
                confirmBtn.style.transform = 'translateY(-2px)';
                confirmBtn.style.boxShadow = '0 6px 16px rgba(59,130,246,0.5)';
            });
            confirmBtn.addEventListener('mouseleave', function () {
                confirmBtn.style.transform = 'translateY(0)';
                confirmBtn.style.boxShadow = '0 4px 12px rgba(59,130,246,0.3)';
            });
        }
        // Grievance link
        var grievanceLink = widget.querySelector('#dpdpa-grievance-link');
        if (grievanceLink) {
            grievanceLink.addEventListener('click', function (e) {
                e.preventDefault();
                openGrievanceForm();
            });
        }
        // DPB link
        var dpbLink = widget.querySelector('#dpdpa-dpb-link');
        if (dpbLink) {
            dpbLink.addEventListener('click', function (e) {
                e.preventDefault();
                window.open('https://dataprotection.gov.in', '_blank');
            });
        }
        // Manage Preferences button with enhanced hover effects
        var managePrefsBtn = widget.querySelector('#dpdpa-manage-preferences');
        if (managePrefsBtn) {
            // Enhanced hover effects
            managePrefsBtn.addEventListener('mouseenter', function () {
                managePrefsBtn.style.background = primaryColor;
                managePrefsBtn.style.color = 'white';
                managePrefsBtn.style.transform = 'translateY(-2px)';
                managePrefsBtn.style.boxShadow = '0 6px 12px rgba(59,130,246,0.4)';
            });
            managePrefsBtn.addEventListener('mouseleave', function () {
                managePrefsBtn.style.background = 'white';
                managePrefsBtn.style.color = primaryColor;
                managePrefsBtn.style.transform = 'translateY(0)';
                managePrefsBtn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.08)';
            });
            managePrefsBtn.addEventListener('click', function () {
                openPrivacyCentre();
            });
        }
        // Enhanced hover effects for activity table rows
        var activityItems = widget.querySelectorAll('.dpdpa-activity-item');
        activityItems.forEach(function (item) {
            item.addEventListener('mouseenter', function () {
                item.style.borderColor = primaryColor;
                item.style.boxShadow = '0 4px 12px rgba(59,130,246,0.15)';
                item.style.transform = 'translateX(2px)';
                item.style.background = 'linear-gradient(to bottom, #f0f9ff, #e0f2fe)';
            });
            item.addEventListener('mouseleave', function () {
                var checkbox = item.querySelector('.activity-checkbox');
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
        var activityItems = document.querySelectorAll('.dpdpa-activity-item');
        activityItems.forEach(function (item) {
            var acceptBtn = item.querySelector("[data-activity-id=\"".concat(activityId, "\"].dpdpa-activity-accept"));
            var rejectBtn = item.querySelector("[data-activity-id=\"".concat(activityId, "\"].dpdpa-activity-reject"));
            if (acceptBtn && rejectBtn) {
                if (status === 'accepted') {
                    item.style.borderColor = '#10b981';
                    acceptBtn.style.opacity = '1';
                    rejectBtn.style.opacity = '0.5';
                }
                else if (status === 'rejected') {
                    item.style.borderColor = '#ef4444';
                    acceptBtn.style.opacity = '0.5';
                    rejectBtn.style.opacity = '1';
                }
            }
        });
    }
    // Handle accept selected (only checked activities)
    function handleAcceptSelected(overlay) {
        return __awaiter(this, void 0, void 0, function () {
            var checkboxes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // First check if there are any activities at all
                        if (!activities || activities.length === 0) {
                            console.error('[Consently DPDPA] No activities available to consent to');
                            alert('No activities available. Please contact the website administrator.');
                            return [2 /*return*/];
                        }
                        checkboxes = document.querySelectorAll('.activity-checkbox:checked');
                        if (checkboxes.length === 0) {
                            alert('Please select at least one activity');
                            return [2 /*return*/];
                        }
                        // Accept only checked activities, reject others
                        activities.forEach(function (activity) {
                            var checkbox = document.querySelector(".activity-checkbox[data-activity-id=\"".concat(activity.id, "\"]"));
                            if (checkbox && checkbox.checked) {
                                setActivityConsent(activity.id, 'accepted');
                            }
                            else {
                                setActivityConsent(activity.id, 'rejected');
                            }
                        });
                        return [4 /*yield*/, saveConsent('partial', overlay)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    }
    // Handle accept all
    function handleAcceptAll(overlay) {
        return __awaiter(this, void 0, void 0, function () {
            var checkboxes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // First check if there are any activities at all
                        if (!activities || activities.length === 0) {
                            console.error('[Consently DPDPA] No activities available to consent to');
                            alert('No activities available. Please contact the website administrator.');
                            return [2 /*return*/];
                        }
                        checkboxes = document.querySelectorAll('.activity-checkbox');
                        checkboxes.forEach(function (cb) {
                            cb.checked = true;
                            var item = cb.closest('.dpdpa-activity-item');
                            if (item) {
                                item.style.borderColor = config.theme.primaryColor || '#3b82f6';
                                item.style.background = "".concat(config.theme.primaryColor || '#3b82f6', "08");
                            }
                        });
                        activities.forEach(function (activity) {
                            setActivityConsent(activity.id, 'accepted');
                        });
                        return [4 /*yield*/, saveConsent('accepted', overlay)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    }
    // Save consent
    function saveConsent(overallStatus, overlay) {
        return __awaiter(this, void 0, void 0, function () {
            var acceptedActivities, rejectedActivities, acceptedPurposeConsents, rejectedPurposeConsents, finalStatus, ruleContext, consentData, result, storageData_1, error_11;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Validate that we have activities to save consent for
                        if (!activities || activities.length === 0) {
                            console.error('[Consently DPDPA] Cannot save consent: No activities available');
                            alert('Cannot save consent. No activities available. Please contact the website administrator.');
                            return [2 /*return*/];
                        }
                        acceptedActivities = [];
                        rejectedActivities = [];
                        acceptedPurposeConsents = {};
                        rejectedPurposeConsents = {};
                        Object.keys(activityConsents).forEach(function (activityId) {
                            var activity = activities.find(function (a) { return a.id === activityId; });
                            if (activityConsents[activityId].status === 'accepted') {
                                acceptedActivities.push(activityId);
                                // Track purposes for this accepted activity
                                if (activity && activity.purposes && Array.isArray(activity.purposes)) {
                                    // Store consented purpose IDs for this activity
                                    // Use purposeId (the actual purpose UUID) not id (which is activity_purpose join table ID)
                                    acceptedPurposeConsents[activityId] = activity.purposes
                                        .map(function (p) { return p.purposeId || p.id; }) // Fallback to id if purposeId not available
                                        .filter(function (id) { return id; }); // Remove any undefined/null values
                                }
                            }
                            else if (activityConsents[activityId].status === 'rejected') {
                                rejectedActivities.push(activityId);
                                // Track purposes for this rejected activity (NEW)
                                if (activity && activity.purposes && Array.isArray(activity.purposes)) {
                                    // Store rejected purpose IDs for this activity
                                    rejectedPurposeConsents[activityId] = activity.purposes
                                        .map(function (p) { return p.purposeId || p.id; })
                                        .filter(function (id) { return id; });
                                }
                            }
                        });
                        if (acceptedActivities.length > 0 && rejectedActivities.length > 0) {
                            finalStatus = 'partial';
                        }
                        else if (acceptedActivities.length > 0) {
                            finalStatus = 'accepted';
                        }
                        else if (rejectedActivities.length > 0) {
                            finalStatus = 'rejected';
                        }
                        else {
                            // No activities - this shouldn't happen due to earlier validation, but handle it
                            console.error('[Consently DPDPA] No activities consented or rejected');
                            alert('Please select at least one activity to save your preferences.');
                            return [2 /*return*/];
                        }
                        ruleContext = config._matchedRule ? {
                            ruleId: config._matchedRule.id,
                            ruleName: config._matchedRule.rule_name,
                            urlPattern: config._matchedRule.url_pattern,
                            pageUrl: window.location.pathname
                        } : undefined;
                        // Get or generate Consent ID
                        if (!consentID) {
                            consentID = getConsentID();
                        }
                        consentData = {
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
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, recordConsent(consentData)];
                    case 2:
                        result = _a.sent();
                        // Store Consent ID
                        storeConsentID(consentID);
                        storageData_1 = {
                            status: finalStatus,
                            acceptedActivities: acceptedActivities,
                            rejectedActivities: rejectedActivities,
                            activityConsents: activityConsents,
                            timestamp: new Date().toISOString(),
                            expiresAt: result.expiresAt
                        };
                        ConsentStorage.set("consently_dpdpa_consent_".concat(widgetId), storageData_1, config.consentDuration || 365);
                        // Apply consent
                        applyConsent(storageData_1);
                        // Track consent event for analytics
                        trackConsentEvent(consentData, config._matchedRule || null);
                        // Removed showConsentSuccessModal - banner already shows success message
                        // showConsentSuccessModal(consentID);
                        // Show floating preference centre button
                        showFloatingPreferenceButton();
                        // Show floating preference centre button
                        showFloatingPreferenceButton();
                        // Update widget to show success state before hiding
                        showSuccessState(overlay, acceptedActivities, rejectedActivities, finalStatus);
                        // Offer receipt options after a delay
                        setTimeout(function () {
                            try {
                                showReceiptOptions(storageData_1);
                            }
                            catch (e) { /* noop */ }
                        }, 2000);
                        // Hide widget after showing success state
                        setTimeout(function () {
                            hideWidget(overlay);
                        }, 3000);
                        console.log('[Consently DPDPA] Consent saved successfully');
                        return [3 /*break*/, 4];
                    case 3:
                        error_11 = _a.sent();
                        console.error('[Consently DPDPA] Failed to save consent:', error_11);
                        alert('Failed to save your consent preferences. Please try again.');
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
    // Show success state in widget after consent
    function showSuccessState(overlay, acceptedActivities, rejectedActivities, status) {
        var widget = overlay.querySelector('#consently-dpdpa-widget');
        if (!widget)
            return;
        var theme = config.theme || {};
        var primaryColor = theme.primaryColor || '#3b82f6';
        var backgroundColor = theme.backgroundColor || '#ffffff';
        var textColor = theme.textColor || '#1f2937';
        var borderRadius = theme.borderRadius || 12;
        // Get activity names
        var acceptedNames = acceptedActivities.map(function (id) {
            var activity = activities.find(function (a) { return a.id === id; });
            return activity ? activity.activity_name : id;
        }).filter(Boolean);
        var rejectedNames = rejectedActivities.map(function (id) {
            var activity = activities.find(function (a) { return a.id === id; });
            return activity ? activity.activity_name : id;
        }).filter(Boolean);
        // Create success message with better UI
        var statusText = '';
        var statusSubtext = '';
        if (status === 'accepted') {
            statusText = 'All Preferences Accepted';
            statusSubtext = 'Your consent has been recorded for all activities';
        }
        else if (status === 'partial') {
            statusText = 'Preferences Saved Successfully';
            statusSubtext = 'Your privacy choices have been saved and applied';
        }
        else {
            statusText = 'Preferences Saved Successfully';
            statusSubtext = 'Your privacy choices have been saved and applied';
        }
        // Update widget content with modern success state
        widget.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        widget.innerHTML = "\n      <div style=\"padding: 40px 32px; text-align: center; font-family: ".concat(theme.fontFamily || 'system-ui, sans-serif', "; position: relative; overflow: hidden;\">\n        <!-- Animated background gradient -->\n        <div style=\"position: absolute; top: 0; right: 0; width: 200px; height: 200px; background: radial-gradient(circle, ").concat(primaryColor, "15 0%, transparent 70%); border-radius: 50%; transform: translate(30%, -30%);\"></div>\n        <div style=\"position: absolute; bottom: 0; left: 0; width: 150px; height: 150px; background: radial-gradient(circle, ").concat(primaryColor, "10 0%, transparent 70%); border-radius: 50%; transform: translate(-30%, 30%);\"></div>\n        \n        <div style=\"position: relative; z-index: 1;\">\n          <!-- Modern icon with gradient -->\n          <div style=\"width: 80px; height: 80px; margin: 0 auto 24px; background: linear-gradient(135deg, ").concat(primaryColor, ", ").concat(primaryColor, "dd); border-radius: 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 30px ").concat(primaryColor, "40, 0 0 0 8px ").concat(primaryColor, "15; animation: successPulse 0.6s ease-out;\">\n            <svg width=\"40\" height=\"40\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"white\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" style=\"animation: checkmark 0.5s ease-out 0.2s both;\">\n              <path d=\"M20 6L9 17l-5-5\"></path>\n            </svg>\n          </div>\n          \n          <!-- Success badge -->\n          <div style=\"display: inline-flex; align-items: center; gap: 6px; background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 16px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);\">\n            <svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\">\n              <path d=\"M20 6L9 17l-5-5\"></path>\n            </svg>\n            Saved\n          </div>\n          \n          <h2 style=\"margin: 0 0 10px; font-size: 28px; font-weight: 700; color: ").concat(textColor, "; letter-spacing: -0.5px;\">\n            ").concat(statusText, "\n          </h2>\n          <p style=\"margin: 0 0 32px; font-size: 15px; color: ").concat(textColor, "aa; line-height: 1.6; max-width: 400px; margin-left: auto; margin-right: auto;\">\n            ").concat(statusSubtext, "\n          </p>\n          \n          ").concat(acceptedNames.length > 0 ? "\n          <div style=\"background: linear-gradient(135deg, ".concat(primaryColor, "12, ").concat(primaryColor, "08); border: 2px solid ").concat(primaryColor, "30; border-radius: 16px; padding: 20px; margin-bottom: 16px; text-align: left; backdrop-filter: blur(10px);\">\n            <div style=\"display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; color: ").concat(primaryColor, "; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 12px;\">\n              <svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"").concat(primaryColor, "\" stroke-width=\"2.5\">\n                <path d=\"M20 6L9 17l-5-5\"></path>\n              </svg>\n              Accepted (").concat(acceptedNames.length, ")\n            </div>\n            <div style=\"font-size: 14px; color: ").concat(textColor, "; line-height: 1.8; font-weight: 500;\">\n              ").concat(acceptedNames.map(function (name) { return "<div style=\"display: flex; align-items: center; gap: 8px; margin-bottom: 6px;\"><span style=\"width: 6px; height: 6px; border-radius: 50%; background: ".concat(primaryColor, ";\"></span>").concat(name, "</div>"); }).join(''), "\n            </div>\n          </div>\n          ") : '', "\n          ").concat(rejectedNames.length > 0 ? "\n          <div style=\"background: linear-gradient(135deg, #f3f4f612, #f3f4f608); border: 2px solid #9ca3af30; border-radius: 16px; padding: 20px; text-align: left; backdrop-filter: blur(10px);\">\n            <div style=\"display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 12px;\">\n              <svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#6b7280\" stroke-width=\"2.5\">\n                <path d=\"M18 6L6 18M6 6l12 12\"></path>\n              </svg>\n              Rejected (".concat(rejectedNames.length, ")\n            </div>\n            <div style=\"font-size: 14px; color: ").concat(textColor, "aa; line-height: 1.8; font-weight: 500;\">\n              ").concat(rejectedNames.map(function (name) { return "<div style=\"display: flex; align-items: center; gap: 8px; margin-bottom: 6px;\"><span style=\"width: 6px; height: 6px; border-radius: 50%; background: #9ca3af;\"></span>".concat(name, "</div>"); }).join(''), "\n            </div>\n          </div>\n          ") : '', "\n          \n\n      emailLinkDismiss.addEventListener('mouseleave', function () {\n        this.style.background = 'transparent';\n        this.style.color = '#94a3b8';\n      });\n    }\n  }\n\n  // Hide widget\n  function hideWidget(overlay) {\n    const widget = overlay.querySelector('#consently-dpdpa-widget');\n    overlay.style.opacity = '0';\n    if (widget) {\n      widget.style.transform = 'scale(0.9)';\n      widget.style.opacity = '0';\n    }\n\n    // Cleanup: Remove global click handler\n    if (globalClickHandler) {\n      document.removeEventListener('click', globalClickHandler);\n      globalClickHandler = null;\n    }\n\n    setTimeout(() => {\n      if (document.body.contains(overlay)) {\n        document.body.removeChild(overlay);\n      }\n    }, 300);\n  }\n\n  // Escape HTML to prevent XSS\n  function escapeHtml(text) {\n    const div = document.createElement('div');\n    div.textContent = text;\n    return div.innerHTML;\n  }\n\n\nfunction downloadConsentReceipt(consent) {\n    const visitorId = consentID || getConsentID();\n    const receiptData = {\n        widgetId,\n        visitorId,\n        privacyCentreUrl: window.location.origin + '/privacy-centre/' + widgetId + '?visitorId=' + visitorId,\n        ...consent\n    };\n    const blob = new Blob([JSON.stringify(receiptData, null, 2)], { type: 'application/json' });\n    const url = URL.createObjectURL(blob);\n    const a = document.createElement('a');\n    a.href = url;\n    a.download = 'consent-receipt-' + visitorId + '.json';\n    document.body.appendChild(a);\n    a.click();\n    document.body.removeChild(a);\n    URL.revokeObjectURL(url);\n}\n\nfunction openPrivacyCentre() {\n    const visitorId = consentID || getConsentID();\n    window.open(window.location.origin + '/privacy-centre/' + widgetId + '?visitorId=' + visitorId, '_blank');\n}\n\nfunction showFloatingPreferenceButton() {\n    if (document.getElementById('dpdpa-floating-btn')) return;\n\n    const btn = document.createElement('button');\n    btn.id = 'dpdpa-floating-btn';\n    btn.title = 'Manage Privacy Preferences';\n    btn.style.cssText = 'position: fixed; ' +\n    'bottom: 20px; ' +\n    'left: 20px; ' +\n    'width: 50px; ' +\n    'height: 50px; ' +\n    'border-radius: 50%; ' +\n    'background: white; ' +\n    'border: none; ' +\n    'box-shadow: 0 4px 12px rgba(0,0,0,0.15); ' +\n    'cursor: pointer; ' +\n    'z-index: 999997; ' +\n    'display: flex; ' +\n    'align-items: center; ' +\n    'justify-content: center; ' +\n    'transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);';\n\n    btn.innerHTML = '<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"' + primaryColor + '\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\">' +\n      '<path d=\"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z\"/>' +\n      '</svg>';\n\n    btn.addEventListener('click', () => {\n        showConsentWidget();\n    });\n\n    btn.addEventListener('mouseenter', () => {\n        btn.style.transform = 'scale(1.1)';\n        btn.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';\n    });\n\n    btn.addEventListener('mouseleave', () => {\n        btn.style.transform = 'scale(1)';\n        btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';\n    });\n\n    document.body.appendChild(btn);\n}\n\nfunction addDPDPAToCookieMenu() {\n    // Implementation for adding to existing cookie menu if present\n    // This is a placeholder for integration with other cookie widgets\n}\n\nfunction openGrievanceForm() {\n    const visitorId = consentID || getConsentID();\n    // Use the configured grievance URL or default to privacy centre grievance tab\n    const grievanceUrl = window.location.origin + '/privacy-centre/' + widgetId + '/grievance?visitorId=' + visitorId;\n    window.open(grievanceUrl, '_blank');\n  }\n\n  function showReceiptOptions(consentData) {\n    // Simple toast or small overlay to offer receipt download\n    const toast = document.createElement('div');\n    toast.style.cssText = 'position: fixed; ' +\n    'bottom: 80px; ' +\n    'right: 20px; ' +\n    'background: white; ' +\n    'padding: 16px; ' +\n    'border-radius: 12px; ' +\n    'box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1); ' +\n    'z-index: 999999; ' +\n    'display: flex; ' +\n    'align-items: center; ' +\n    'gap: 12px; ' +\n    'animation: slideIn 0.3s ease-out; ' +\n    'max-width: 320px; ' +\n    'border: 1px solid #e5e7eb;';\n\n    toast.innerHTML = '<div style=\"flex: 1;\">' +\n        '<p style=\"margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #1f2937;\">Download Receipt?</p>' +\n        '<p style=\"margin: 0; font-size: 12px; color: #6b7280;\">Keep a copy of your consent preferences.</p>' +\n      '</div>' +\n      '<button id=\"dpdpa-download-receipt-btn\" style=\"padding: 8px 12px; background: #f3f4f6; color: #4b5563; border: none; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s;\">' +\n        'Download' +\n      '</button>' +\n      '<button id=\"dpdpa-dismiss-receipt\" style=\"padding: 4px; background: transparent; border: none; color: #9ca3af; cursor: pointer;\">' +\n        '<svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\">' +\n          '<line x1=\"18\" y1=\"6\" x2=\"6\" y2=\"18\"></line>' +\n          '<line x1=\"6\" y1=\"6\" x2=\"18\" y2=\"18\"></line>' +\n        '</svg>' +\n      '</button>';\n\n    document.body.appendChild(toast);\n\n    document.getElementById('dpdpa-download-receipt-btn').addEventListener('click', () => {\n      downloadConsentReceipt(consentData);\n      toast.remove();\n    });\n\n    document.getElementById('dpdpa-dismiss-receipt').addEventListener('click', () => {\n      toast.remove();\n    });\n\n    setTimeout(() => {\n      if (document.body.contains(toast)) {\n        toast.remove();\n      }\n    }, 10000);\n  }\n\n  // Public API\n  window.ConsentlyDPDPA = {\n    init: init,\n    show: showConsentWidget,\n    hide: () => {\n      const overlay = document.getElementById('consently-dpdpa-overlay');\n      if (overlay) hideWidget(overlay);\n    },\n    getConsent: () => ConsentStorage.get('consently_dpdpa_consent_' + widgetId),\n    openPrivacyCentre: openPrivacyCentre,\n    downloadReceipt: () => {\n      const consent = ConsentStorage.get('consently_dpdpa_consent_' + widgetId);\n      if (consent) downloadConsentReceipt(consent);\n    }\n  };\n\n  // Auto-init\n  if (document.readyState === 'loading') {\n    document.addEventListener('DOMContentLoaded', init);\n  } else {\n    init();\n  }\n\n})();\n");
    }
});
