/**
 * Consent ID Utility Functions
 * 
 * Handles parsing, validation, and extraction from consent IDs.
 * 
 * Consent ID Formats:
 * 1. Verified Email (Deterministic): `${widgetId}_${emailHash16}_${timestamp}`
 *    Example: `dpdpa_mhnhpimc_atq70ak_e34ac754e622fc48_1763901238355`
 * 
 * 2. Unverified Email (Random): `${widgetId}_${visitorId}_${timestamp}_${randomSuffix}`
 *    Example: `dpdpa_mhnhpimc_atq70ak_visitor_123_device1_1763901237884_test01`
 * 
 * Note: Widget IDs and visitor IDs may contain underscores, so parsing must account for this.
 */

export interface ParsedConsentId {
  widgetId: string;
  emailHash?: string; // 16-character hex string (only for verified emails)
  timestamp: number;
  visitorId?: string; // Only for unverified emails
  randomSuffix?: string; // Only for unverified emails
  isVerified: boolean;
}

/**
 * Parse a consent ID into its components
 * @param consentId The consent ID to parse
 * @returns Parsed consent ID object or null if invalid
 */
export function parseConsentId(consentId: string): ParsedConsentId | null {
  if (!consentId || typeof consentId !== 'string') {
    return null;
  }

  const parts = consentId.split('_');
  
  if (parts.length < 3) {
    return null;
  }

  // Try to parse as verified email format: widgetId_emailHash16_timestamp
  // The last part should be a timestamp (numeric)
  const lastPart = parts[parts.length - 1];
  const timestamp = parseInt(lastPart, 10);
  
  if (!isNaN(timestamp) && parts.length >= 3) {
    // Check if second-to-last part is a 16-character hex string (email hash)
    const secondToLast = parts[parts.length - 2];
    if (/^[a-f0-9]{16}$/.test(secondToLast)) {
      // Verified email format
      const widgetId = parts.slice(0, parts.length - 2).join('_');
      return {
        widgetId,
        emailHash: secondToLast,
        timestamp,
        isVerified: true,
      };
    }
  }

  // Try to parse as unverified format: widgetId_visitorId_timestamp_randomSuffix
  // Last part should be alphanumeric (random suffix)
  // Second-to-last should be numeric (timestamp)
  if (parts.length >= 4) {
    const lastPartNum = parseInt(parts[parts.length - 2], 10);
    const lastPartStr = parts[parts.length - 1];
    
    if (!isNaN(lastPartNum) && /^[a-z0-9]+$/i.test(lastPartStr)) {
      // Unverified format
      const widgetId = parts[0]; // Widget ID is the first part (may contain underscores)
      const visitorId = parts.slice(1, parts.length - 2).join('_'); // Everything between widgetId and timestamp
      return {
        widgetId,
        visitorId,
        timestamp: lastPartNum,
        randomSuffix: lastPartStr,
        isVerified: false,
      };
    }
  }

  return null;
}

/**
 * Validate if a consent ID matches the expected format
 * @param consentId The consent ID to validate
 * @returns true if valid, false otherwise
 */
export function isValidConsentId(consentId: string): boolean {
  return parseConsentId(consentId) !== null;
}

/**
 * Extract widget ID from a consent ID
 * @param consentId The consent ID
 * @returns Widget ID or null if invalid
 */
export function extractWidgetId(consentId: string): string | null {
  const parsed = parseConsentId(consentId);
  return parsed?.widgetId || null;
}

/**
 * Extract email hash from a consent ID (only for verified emails)
 * @param consentId The consent ID
 * @returns 16-character email hash or null if not a verified email consent ID
 */
export function extractEmailHash(consentId: string): string | null {
  const parsed = parseConsentId(consentId);
  return parsed?.isVerified ? parsed.emailHash || null : null;
}

/**
 * Check if a consent ID is for a verified email
 * @param consentId The consent ID
 * @returns true if verified email format, false otherwise
 */
export function isVerifiedEmailConsentId(consentId: string): boolean {
  const parsed = parseConsentId(consentId);
  return parsed?.isVerified || false;
}

/**
 * Generate a consent ID for verified email
 * @param widgetId The widget ID
 * @param emailHash The full email hash (will use first 16 characters)
 * @param timestamp Optional timestamp (defaults to current time)
 * @returns Generated consent ID
 */
export function generateVerifiedConsentId(
  widgetId: string,
  emailHash: string,
  timestamp?: number
): string {
  const ts = timestamp || Date.now();
  return `${widgetId}_${emailHash.substring(0, 16)}_${ts}`;
}

/**
 * Generate a consent ID for unverified email
 * @param widgetId The widget ID
 * @param visitorId The visitor ID
 * @param timestamp Optional timestamp (defaults to current time)
 * @param randomSuffix Optional random suffix (will generate if not provided)
 * @returns Generated consent ID
 */
export function generateUnverifiedConsentId(
  widgetId: string,
  visitorId: string,
  timestamp?: number,
  randomSuffix?: string
): string {
  const ts = timestamp || Date.now();
  const suffix = randomSuffix || Math.random().toString(36).substring(2, 8);
  return `${widgetId}_${visitorId}_${ts}_${suffix}`;
}

