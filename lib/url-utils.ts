/**
 * URL Utilities
 * Provides consistent URL normalization and handling across the application
 */

/**
 * Normalize a URL for consistent comparison
 * Removes query parameters, hash, and normalizes trailing slashes
 * 
 * @param urlString - The URL to normalize
 * @returns Normalized URL string
 */
export function normalizeUrl(urlString: string): string {
  if (!urlString || typeof urlString !== 'string') {
    return '';
  }

  try {
    const url = new URL(urlString);
    
    // Remove query parameters and hash for comparison
    url.search = '';
    url.hash = '';
    
    // Normalize trailing slash
    let path = url.pathname;
    if (path.length > 1 && path.endsWith('/')) {
      path = path.slice(0, -1);
    }
    url.pathname = path;
    
    return url.toString();
  } catch (e) {
    // If URL parsing fails, return the original string
    // This handles relative URLs and malformed URLs gracefully
    return urlString;
  }
}

/**
 * Compare two URLs for equality after normalization
 * 
 * @param url1 - First URL
 * @param url2 - Second URL
 * @returns True if URLs are equal after normalization
 */
export function areUrlsEqual(url1: string, url2: string): boolean {
  return normalizeUrl(url1) === normalizeUrl(url2);
}

/**
 * Validate URL format
 * 
 * @param urlString - The URL to validate
 * @returns True if URL is valid
 */
export function isValidUrl(urlString: string): boolean {
  if (!urlString || typeof urlString !== 'string') {
    return false;
  }

  try {
    new URL(urlString);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Extract domain from URL
 * 
 * @param urlString - The URL to extract domain from
 * @returns Domain or empty string if invalid
 */
export function extractDomain(urlString: string): string {
  try {
    const url = new URL(urlString);
    return url.hostname;
  } catch (e) {
    return '';
  }
}

/**
 * Extract path from URL (without query/hash)
 * 
 * @param urlString - The URL to extract path from
 * @returns Path or empty string if invalid
 */
export function extractPath(urlString: string): string {
  try {
    const url = new URL(urlString);
    return url.pathname;
  } catch (e) {
    return '';
  }
}

/**
 * Client-side URL normalization (for use in widget)
 * Same logic as server-side but designed for browser environment
 */
export const clientNormalizeUrl = normalizeUrl;

