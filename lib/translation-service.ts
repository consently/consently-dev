/**
 * Multi-Provider Translation Service
 * Provides translation capabilities using Google Cloud Translation API and Bhashini
 * 
 * Strategy:
 * - Google Translate: High-quality for 12 major Indian languages (hi, bn, ta, te, mr, gu, kn, ml, pa, or, ur, as)
 * - Bhashini: Fallback for remaining Schedule 8 languages (ne, sa, ks, sd, mai, doi, etc.)
 * 
 * Environment variables:
 * - GOOGLE_TRANSLATE_API_KEY: Google Cloud Translation API key (preferred)
 * - BHASHINI_API_KEY: Bhashini API key (fallback)
 * - BHASHINI_USER_ID: Bhashini User ID (fallback)
 */

import { translateWithGoogle, translateBatchGoogle, isIndianLanguageSupported as isGoogleSupported } from './google-translate';
import { translateWithBhashini, translateBatchBhashini, isIndianLanguageSupported as isBhashiniSupported } from './bhashini-translate';

export type TranslationProvider = 'google' | 'bhashini';

export interface TranslationOptions {
  provider?: TranslationProvider;
  cacheResults?: boolean;
  fallbackToOriginal?: boolean;
}

export interface TranslationResult {
  translatedText: string;
  provider: 'google' | 'bhashini' | 'cache' | 'none';
  cached: boolean;
  error?: string;
}

// In-memory cache for translations (can be replaced with Redis in production)
const translationCache = new Map<string, string>();

/**
 * Generate cache key for a translation
 */
function getCacheKey(text: string, targetLang: string, sourceLang: string): string {
  return `${sourceLang}:${targetLang}:${text}`;
}

/**
 * Get translation from cache
 */
function getFromCache(text: string, targetLang: string, sourceLang: string): string | null {
  const key = getCacheKey(text, targetLang, sourceLang);
  return translationCache.get(key) || null;
}

/**
 * Save translation to cache
 */
function saveToCache(text: string, translation: string, targetLang: string, sourceLang: string): void {
  const key = getCacheKey(text, targetLang, sourceLang);
  translationCache.set(key, translation);
  
  // Limit cache size to 1000 entries (simple LRU)
  if (translationCache.size > 1000) {
    const firstKey = translationCache.keys().next().value;
    if (firstKey) {
      translationCache.delete(firstKey);
    }
  }
}

/**
 * Select the best translation provider for a language
 */
function getProviderForLanguage(targetLanguage: string): TranslationProvider {
  // Google Translate has better quality for these 12 languages
  if (isGoogleSupported(targetLanguage) && isGoogleConfigured()) {
    return 'google';
  }
  
  // Bhashini supports more Indian languages (including Schedule 8 languages)
  if (isBhashiniSupported(targetLanguage) && isBhashiniConfigured()) {
    return 'bhashini';
  }
  
  // Default to Google if available
  if (isGoogleConfigured()) {
    return 'google';
  }
  
  return 'bhashini';
}

/**
 * Check if Google Translate API is configured
 */
function isGoogleConfigured(): boolean {
  return !!process.env.GOOGLE_TRANSLATE_API_KEY;
}

/**
 * Check if Bhashini API is configured
 */
function isBhashiniConfigured(): boolean {
  return !!(process.env.BHASHINI_API_KEY && process.env.BHASHINI_USER_ID);
}

/**
 * Translate text using the best available provider
 */
export async function translate(
  text: string,
  targetLanguage: string,
  sourceLanguage: string = 'en',
  options?: TranslationOptions
): Promise<TranslationResult> {
  // Return original if same language
  if (targetLanguage === sourceLanguage) {
    return {
      translatedText: text,
      provider: 'none',
      cached: false,
    };
  }

  // Check cache first
  if (options?.cacheResults !== false) {
    const cached = getFromCache(text, targetLanguage, sourceLanguage);
    if (cached) {
      return {
        translatedText: cached,
        provider: 'cache',
        cached: true,
      };
    }
  }

  try {
    // Select the best provider for this language
    const provider = getProviderForLanguage(targetLanguage);
    
    let translatedText: string;
    
    if (provider === 'google') {
      // Check if Google Translate is configured
      if (!isGoogleConfigured()) {
        console.warn('[Translation Service] Google Translate not configured, trying Bhashini');
        if (isBhashiniConfigured()) {
          translatedText = await translateWithBhashini(text, targetLanguage, sourceLanguage);
        } else {
          throw new Error('No translation provider configured');
        }
      } else {
        translatedText = await translateWithGoogle(text, targetLanguage, sourceLanguage);
      }
    } else {
      // Use Bhashini
      if (!isBhashiniConfigured()) {
        console.warn('[Translation Service] Bhashini not configured, trying Google');
        if (isGoogleConfigured()) {
          translatedText = await translateWithGoogle(text, targetLanguage, sourceLanguage);
        } else {
          throw new Error('No translation provider configured');
        }
      } else {
        translatedText = await translateWithBhashini(text, targetLanguage, sourceLanguage);
      }
    }

    // Cache the result
    if (options?.cacheResults !== false && translatedText !== text) {
      saveToCache(text, translatedText, targetLanguage, sourceLanguage);
    }

    return {
      translatedText,
      provider,
      cached: false,
    };

  } catch (error) {
    console.error('[Translation Service] Error:', error);

    // Return original text if fallback is enabled
    if (options?.fallbackToOriginal !== false) {
      return {
        translatedText: text,
        provider: 'none',
        cached: false,
        error: error instanceof Error ? error.message : 'Translation failed',
      };
    }

    throw error;
  }
}

/**
 * Translate multiple texts in batch
 */
export async function translateBatch(
  texts: string[],
  targetLanguage: string,
  sourceLanguage: string = 'en',
  options?: TranslationOptions
): Promise<TranslationResult[]> {
  try {
    // Select the best provider for this language
    const provider = getProviderForLanguage(targetLanguage);
    
    let translations: string[];
    
    if (provider === 'google') {
      if (!isGoogleConfigured()) {
        console.warn('[Translation Service] Google not configured, trying Bhashini');
        if (isBhashiniConfigured()) {
          translations = await translateBatchBhashini(texts, targetLanguage, sourceLanguage);
        } else {
          throw new Error('No translation provider configured');
        }
      } else {
        translations = await translateBatchGoogle(texts, targetLanguage, sourceLanguage);
      }
    } else {
      // Use Bhashini
      if (!isBhashiniConfigured()) {
        console.warn('[Translation Service] Bhashini not configured, trying Google');
        if (isGoogleConfigured()) {
          translations = await translateBatchGoogle(texts, targetLanguage, sourceLanguage);
        } else {
          throw new Error('No translation provider configured');
        }
      } else {
        translations = await translateBatchBhashini(texts, targetLanguage, sourceLanguage);
      }
    }

    return translations.map((translatedText, index) => {
      // Cache each result
      if (options?.cacheResults !== false) {
        saveToCache(texts[index], translatedText, targetLanguage, sourceLanguage);
      }

      return {
        translatedText,
        provider,
        cached: false,
      };
    });

  } catch (error) {
    console.error('[Translation Service] Batch error:', error);

    // Fallback to original texts
    if (options?.fallbackToOriginal !== false) {
      return texts.map(text => ({
        translatedText: text,
        provider: 'none' as const,
        cached: false,
        error: error instanceof Error ? error.message : 'Translation failed',
      }));
    }

    throw error;
  }
}

/**
 * Check if a language is supported by any translation provider
 */
export function isLanguageSupported(languageCode: string): boolean {
  return isGoogleSupported(languageCode) || isBhashiniSupported(languageCode);
}

/**
 * Get all supported Indian language codes from all providers
 */
export async function getSupportedLanguages(): Promise<string[]> {
  const { INDIAN_LANGUAGES_GOOGLE } = await import('./google-translate');
  const { INDIAN_LANGUAGES_BHASHINI } = await import('./bhashini-translate');
  
  // Combine languages from both providers (unique set)
  const googleLangs = Object.keys(INDIAN_LANGUAGES_GOOGLE);
  const bhashiniLangs = Object.keys(INDIAN_LANGUAGES_BHASHINI);
  const allLangs = [...new Set([...googleLangs, ...bhashiniLangs])];
  
  return allLangs.sort();
}

/**
 * Clear translation cache
 */
export function clearCache(): void {
  translationCache.clear();
  console.log('[Translation Service] Cache cleared');
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    size: translationCache.size,
    maxSize: 1000,
  };
}
