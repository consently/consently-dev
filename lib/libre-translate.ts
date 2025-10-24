/**
 * LibreTranslate API Integration
 * Real-time translation service for consent text and notices
 */

const LIBRETRANSLATE_API_URL = process.env.LIBRETRANSLATE_API_URL || 'https://libretranslate.com/translate';

export interface TranslationRequest {
  text: string;
  source: string;
  target: string;
}

export interface TranslationResponse {
  translatedText: string;
}

/**
 * Translate text using LibreTranslate API
 */
export async function translateText(
  text: string,
  targetLanguage: string,
  sourceLanguage: string = 'en'
): Promise<string> {
  try {
    const response = await fetch(LIBRETRANSLATE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        source: sourceLanguage,
        target: targetLanguage,
        format: 'text',
      }),
    });

    if (!response.ok) {
      throw new Error(`Translation API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.translatedText || text;
  } catch (error) {
    console.error('Translation error:', error);
    // Return original text if translation fails
    return text;
  }
}

/**
 * Translate multiple texts in batch
 */
export async function translateBatch(
  texts: string[],
  targetLanguage: string,
  sourceLanguage: string = 'en'
): Promise<string[]> {
  try {
    const translations = await Promise.all(
      texts.map(text => translateText(text, targetLanguage, sourceLanguage))
    );
    return translations;
  } catch (error) {
    console.error('Batch translation error:', error);
    return texts;
  }
}

/**
 * Language code mapping for LibreTranslate
 */
export const SUPPORTED_LANGUAGES = {
  en: 'English',
  hi: 'Hindi',
  pa: 'Punjabi',
  te: 'Telugu',
  ta: 'Tamil',
  bn: 'Bengali',
  mr: 'Marathi',
  gu: 'Gujarati',
  kn: 'Kannada',
  ml: 'Malayalam',
  or: 'Odia',
  ur: 'Urdu',
};

/**
 * Check if a language is supported
 */
export function isLanguageSupported(languageCode: string): boolean {
  return languageCode in SUPPORTED_LANGUAGES;
}
