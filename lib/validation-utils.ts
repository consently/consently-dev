/**
 * Validation Utilities
 * Server-side validation functions for DPDPA consent data
 */

/**
 * UUID validation regex
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validate UUID format
 * 
 * @param id - The UUID to validate
 * @returns True if valid UUID
 */
export function isValidUUID(id: string): boolean {
  return typeof id === 'string' && UUID_REGEX.test(id);
}

/**
 * Validate and filter array of UUIDs
 * Removes invalid UUIDs and returns only valid ones
 * 
 * @param ids - Array of UUIDs to validate
 * @param maxLength - Maximum array length (default: 100)
 * @returns Array of valid UUIDs
 */
export function validateUUIDs(ids: string[], maxLength: number = 100): string[] {
  if (!Array.isArray(ids)) {
    return [];
  }

  return ids
    .filter(id => isValidUUID(id))
    .slice(0, maxLength); // Limit array size to prevent abuse
}

/**
 * Validate consent status
 * 
 * @param status - Consent status to validate
 * @returns True if valid status
 */
export function isValidConsentStatus(status: string): boolean {
  return ['accepted', 'rejected', 'partial', 'revoked'].includes(status);
}

/**
 * Validate activity arrays match consent status
 * Ensures consent status is consistent with activity arrays
 * 
 * @param status - Consent status
 * @param acceptedActivities - Array of accepted activity IDs
 * @param rejectedActivities - Array of rejected activity IDs
 * @returns Validation result with adjusted status if needed
 */
export function validateConsentActivities(
  status: string,
  acceptedActivities: string[],
  rejectedActivities: string[]
): {
  valid: boolean;
  adjustedStatus?: 'accepted' | 'rejected' | 'partial' | 'revoked';
  error?: string;
} {
  const hasAccepted = acceptedActivities.length > 0;
  const hasRejected = rejectedActivities.length > 0;

  // Revoked status is always valid (no activity requirements)
  if (status === 'revoked') {
    return { valid: true };
  }

  // Validate status matches activity arrays
  if (status === 'accepted') {
    if (!hasAccepted) {
      // If status is 'accepted' but no accepted activities, check if we can adjust
      if (hasRejected) {
        return { valid: true, adjustedStatus: 'rejected' };
      }
      return { valid: false, error: 'Accepted status requires at least one accepted activity' };
    }
    return { valid: true };
  }

  if (status === 'rejected') {
    if (!hasRejected) {
      // If status is 'rejected' but no rejected activities, check if we can adjust
      if (hasAccepted) {
        return { valid: true, adjustedStatus: 'accepted' };
      }
      return { valid: false, error: 'Rejected status requires at least one rejected activity' };
    }
    return { valid: true };
  }

  if (status === 'partial') {
    if (!hasAccepted || !hasRejected) {
      // Partial requires both
      if (hasAccepted && !hasRejected) {
        return { valid: true, adjustedStatus: 'accepted' };
      }
      if (!hasAccepted && hasRejected) {
        return { valid: true, adjustedStatus: 'rejected' };
      }
      return { valid: false, error: 'Partial status requires at least one accepted and one rejected activity' };
    }
    return { valid: true };
  }

  return { valid: false, error: 'Invalid consent status' };
}

/**
 * Sanitize metadata object
 * Removes invalid or empty values
 * 
 * @param metadata - Metadata object to sanitize
 * @returns Sanitized metadata
 */
export function sanitizeMetadata(metadata: any): any {
  if (!metadata || typeof metadata !== 'object') {
    return {};
  }

  const sanitized: any = {};

  // Only include valid, non-empty values
  if (metadata.ipAddress && typeof metadata.ipAddress === 'string') {
    sanitized.ipAddress = metadata.ipAddress;
  }
  if (metadata.userAgent && typeof metadata.userAgent === 'string') {
    sanitized.userAgent = metadata.userAgent;
  }
  if (metadata.deviceType && ['Desktop', 'Mobile', 'Tablet', 'Unknown'].includes(metadata.deviceType)) {
    sanitized.deviceType = metadata.deviceType;
  }
  if (metadata.browser && typeof metadata.browser === 'string') {
    sanitized.browser = metadata.browser;
  }
  if (metadata.os && typeof metadata.os === 'string') {
    sanitized.os = metadata.os;
  }
  if (metadata.country && typeof metadata.country === 'string') {
    sanitized.country = metadata.country;
  }
  if (metadata.language && typeof metadata.language === 'string') {
    sanitized.language = metadata.language;
  }
  if (metadata.referrer && typeof metadata.referrer === 'string' && metadata.referrer !== '') {
    sanitized.referrer = metadata.referrer;
  }
  if (metadata.currentUrl && typeof metadata.currentUrl === 'string' && metadata.currentUrl !== '') {
    // Validate URL format
    try {
      new URL(metadata.currentUrl);
      sanitized.currentUrl = metadata.currentUrl;
    } catch (e) {
      // Invalid URL, skip it
    }
  }
  if (metadata.pageTitle && typeof metadata.pageTitle === 'string' && metadata.pageTitle !== '') {
    sanitized.pageTitle = metadata.pageTitle;
  }

  return sanitized;
}

/**
 * Validate and sanitize activity-purpose consents
 * 
 * @param activityPurposeConsents - Object mapping activity IDs to purpose IDs
 * @returns Sanitized object with only valid UUIDs
 */
export function validateActivityPurposeConsents(
  activityPurposeConsents: any
): Record<string, string[]> | undefined {
  if (!activityPurposeConsents || typeof activityPurposeConsents !== 'object') {
    return undefined;
  }

  const validated: Record<string, string[]> = {};

  for (const [activityId, purposeIds] of Object.entries(activityPurposeConsents)) {
    // Validate activity ID is UUID
    if (isValidUUID(activityId)) {
      // Validate purpose IDs are UUIDs
      if (Array.isArray(purposeIds)) {
        const validPurposeIds = purposeIds.filter(id => 
          typeof id === 'string' && isValidUUID(id)
        );
        if (validPurposeIds.length > 0) {
          validated[activityId] = validPurposeIds;
        }
      }
    }
  }

  return Object.keys(validated).length > 0 ? validated : undefined;
}

/**
 * Validate consent duration
 * 
 * @param duration - Consent duration in days
 * @returns Valid duration (clamped to 1-3650 days)
 */
export function validateConsentDuration(duration: number): number {
  if (typeof duration !== 'number' || isNaN(duration)) {
    return 365; // Default to 1 year
  }
  
  // Clamp between 1 day and 10 years
  return Math.max(1, Math.min(3650, Math.floor(duration)));
}

