/**
 * Unified Translation Service
 * Supports multiple translation providers with automatic fallback
 * 
 * Priority order:
 * 1. Google Cloud Translation API (best for Indian languages)
 * 2. LibreTranslate (free, self-hosted option)
 * 3. Cached translations (pre-translated content)
 * 
 * Environment variables:
 * - TRANSLATION_PROVIDER: 'google' | 'libretranslate' | 'auto' (default: 'auto')
 * - GOOGLE_TRANSLATE_API_KEY: Google Cloud API key
 * - LIBRETRANSLATE_API_URL: LibreTranslate endpoint (default: https://libretranslate.com/translate)
 */

import { translateWithGoogle, translateBatchGoogle, isIndianLanguageSupported as isGoogleSupported } from './google-translate';
import { translateText as translateLibre, translateBatch as translateBatchLibre, isLanguageSupported as isLibreSupported } from './libre-translate';

export type TranslationProvider = 'google' | 'libretranslate' | 'auto';

export interface TranslationOptions {
  provider?: TranslationProvider;
  cacheResults?: boolean;
  fallbackToOriginal?: boolean;
}

export interface TranslationResult {
  translatedText: string;
  provider: 'google' | 'libretranslate' | 'cache' | 'none';
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
    translationCache.delete(firstKey);
  }
}

/**
 * Determine which translation provider to use
 */
function getProvider(options?: TranslationOptions): TranslationProvider {
  const envProvider = process.env.TRANSLATION_PROVIDER as TranslationProvider;
  return options?.provider || envProvider || 'auto';
}

/**
 * Check if Google Translate API is configured
 */
function isGoogleConfigured(): boolean {
  return !!process.env.GOOGLE_TRANSLATE_API_KEY;
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

  const provider = getProvider(options);

  try {
    let translatedText: string;
    let usedProvider: 'google' | 'libretranslate';

    // Strategy: Auto-select best provider
    if (provider === 'auto') {
      // For Indian languages, prefer Google if available
      if (isGoogleSupported(targetLanguage) && isGoogleConfigured()) {
        translatedText = await translateWithGoogle(text, targetLanguage, sourceLanguage);
        usedProvider = 'google';
      } else if (isLibreSupported(targetLanguage)) {
        translatedText = await translateLibre(text, targetLanguage, sourceLanguage);
        usedProvider = 'libretranslate';
      } else {
        // No provider available for this language
        return {
          translatedText: text,
          provider: 'none',
          cached: false,
          error: `No translation provider available for language: ${targetLanguage}`,
        };
      }
    }
    // Use Google explicitly
    else if (provider === 'google') {
      if (!isGoogleConfigured()) {
        throw new Error('Google Translate API key not configured');
      }
      translatedText = await translateWithGoogle(text, targetLanguage, sourceLanguage);
      usedProvider = 'google';
    }
    // Use LibreTranslate explicitly
    else {
      translatedText = await translateLibre(text, targetLanguage, sourceLanguage);
      usedProvider = 'libretranslate';
    }

    // Cache the result
    if (options?.cacheResults !== false && translatedText !== text) {
      saveToCache(text, translatedText, targetLanguage, sourceLanguage);
    }

    return {
      translatedText,
      provider: usedProvider,
      cached: false,
    };

  } catch (error) {
    console.error('[Translation Service] Error:', error);

    // Fallback strategy
    if (provider === 'auto' || provider === 'google') {
      // Try LibreTranslate as fallback
      try {
        const translatedText = await translateLibre(text, targetLanguage, sourceLanguage);
        return {
          translatedText,
          provider: 'libretranslate',
          cached: false,
        };
      } catch (fallbackError) {
        console.error('[Translation Service] Fallback failed:', fallbackError);
      }
    }

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
  const provider = getProvider(options);

  try {
    let translations: string[];
    let usedProvider: 'google' | 'libretranslate';

    if (provider === 'auto') {
      if (isGoogleSupported(targetLanguage) && isGoogleConfigured()) {
        translations = await translateBatchGoogle(texts, targetLanguage, sourceLanguage);
        usedProvider = 'google';
      } else {
        translations = await translateBatchLibre(texts, targetLanguage, sourceLanguage);
        usedProvider = 'libretranslate';
      }
    } else if (provider === 'google') {
      if (!isGoogleConfigured()) {
        throw new Error('Google Translate API key not configured');
      }
      translations = await translateBatchGoogle(texts, targetLanguage, sourceLanguage);
      usedProvider = 'google';
    } else {
      translations = await translateBatchLibre(texts, targetLanguage, sourceLanguage);
      usedProvider = 'libretranslate';
    }

    return translations.map((translatedText, index) => {
      // Cache each result
      if (options?.cacheResults !== false) {
        saveToCache(texts[index], translatedText, targetLanguage, sourceLanguage);
      }

      return {
        translatedText,
        provider: usedProvider,
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
 * Check if a language is supported by any provider
 */
export function isLanguageSupported(languageCode: string): boolean {
  return isGoogleSupported(languageCode) || isLibreSupported(languageCode);
}

/**
 * Get all supported Indian language codes across all providers
 */
export function getSupportedLanguages(): string[] {
  const allLanguages = new Set<string>();
  
  // Add supported languages from all providers
  const googleLangs = Object.keys(await import('./google-translate').then(m => m.INDIAN_LANGUAGES_GOOGLE));
  const libreLangs = Object.keys(await import('./libre-translate').then(m => m.SUPPORTED_LANGUAGES));
  
  googleLangs.forEach(lang => allLanguages.add(lang));
  libreLangs.forEach(lang => allLanguages.add(lang));
  
  return Array.from(allLanguages).sort();
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
