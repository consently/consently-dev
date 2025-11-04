/**
 * Bhashini Translation Service
 * Provides translation capabilities using Bhashini Translation API (Government of India)
 * 
 * Environment variables:
 * - BHASHINI_API_KEY: Bhashini API key (required)
 * - BHASHINI_USER_ID: Bhashini User ID (required)
 * - BHASHINI_PIPELINE_ID: Pipeline ID (optional, default: 64392f96daac500b55c543cd)
 */

import { translateWithBhashini, translateBatchBhashini, isIndianLanguageSupported as isBhashiniSupported } from './bhashini-translate';

export type TranslationProvider = 'bhashini';

export interface TranslationOptions {
  provider?: TranslationProvider;
  cacheResults?: boolean;
  fallbackToOriginal?: boolean;
}

export interface TranslationResult {
  translatedText: string;
  provider: 'bhashini' | 'cache' | 'none';
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
 * Always use Bhashini as the provider
 */
function getProvider(options?: TranslationOptions): TranslationProvider {
  return 'bhashini';
}

/**
 * Check if Bhashini API is configured
 */
function isBhashiniConfigured(): boolean {
  return !!process.env.BHASHINI_API_KEY && !!process.env.BHASHINI_USER_ID;
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
    // Check if Bhashini is configured
    if (!isBhashiniConfigured()) {
      console.warn('[Translation Service] Bhashini API not configured');
      return {
        translatedText: text,
        provider: 'none',
        cached: false,
        error: 'Bhashini API key or User ID not configured',
      };
    }

    // Use Bhashini Translate
    const translatedText = await translateWithBhashini(text, targetLanguage, sourceLanguage);

    // Cache the result
    if (options?.cacheResults !== false && translatedText !== text) {
      saveToCache(text, translatedText, targetLanguage, sourceLanguage);
    }

    return {
      translatedText,
      provider: 'bhashini',
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
    // Check if Bhashini is configured
    if (!isBhashiniConfigured()) {
      console.warn('[Translation Service] Bhashini API not configured');
      return texts.map(text => ({
        translatedText: text,
        provider: 'none' as const,
        cached: false,
        error: 'Bhashini API key or User ID not configured',
      }));
    }

    // Use Bhashini Translate
    const translations = await translateBatchBhashini(texts, targetLanguage, sourceLanguage);

    return translations.map((translatedText, index) => {
      // Cache each result
      if (options?.cacheResults !== false) {
        saveToCache(texts[index], translatedText, targetLanguage, sourceLanguage);
      }

      return {
        translatedText,
        provider: 'bhashini' as const,
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
 * Check if a language is supported by Bhashini
 */
export function isLanguageSupported(languageCode: string): boolean {
  return isBhashiniSupported(languageCode);
}

/**
 * Get all supported Indian language codes from Bhashini
 */
export async function getSupportedLanguages(): Promise<string[]> {
  const { INDIAN_LANGUAGES_BHASHINI } = await import('./bhashini-translate');
  return Object.keys(INDIAN_LANGUAGES_BHASHINI).sort();
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
