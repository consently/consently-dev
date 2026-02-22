/**
 * Google Cloud Translation API Integration
 * Enhanced translation service for Indian languages
 * 
 * Supports: Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Odia, Urdu, Assamese
 * 
 * Setup:
 * 1. Create a Google Cloud project
 * 2. Enable Cloud Translation API
 * 3. Create API key or service account
 * 4. Set GOOGLE_TRANSLATE_API_KEY environment variable
 */

const GOOGLE_TRANSLATE_API_URL = 'https://translation.googleapis.com/language/translate/v2';

export interface GoogleTranslateRequest {
  text: string | string[];
  targetLanguage: string;
  sourceLanguage?: string;
  format?: 'text' | 'html';
}

export interface GoogleTranslateResponse {
  data: {
    translations: Array<{
      translatedText: string;
      detectedSourceLanguage?: string;
    }>;
  };
}

/**
 * Supported Indian languages for Google Translate
 * Based on Schedule 8 languages with high accuracy
 */
export const INDIAN_LANGUAGES_GOOGLE = {
  hi: { name: 'Hindi', nativeName: 'हिन्दी', script: 'Devanagari' },
  bn: { name: 'Bengali', nativeName: 'বাংলা', script: 'Bengali' },
  ta: { name: 'Tamil', nativeName: 'தமிழ்', script: 'Tamil' },
  te: { name: 'Telugu', nativeName: 'తెలుగు', script: 'Telugu' },
  mr: { name: 'Marathi', nativeName: 'मराठी', script: 'Devanagari' },
  gu: { name: 'Gujarati', nativeName: 'ગુજરાતી', script: 'Gujarati' },
  kn: { name: 'Kannada', nativeName: 'ಕನ್ನಡ', script: 'Kannada' },
  ml: { name: 'Malayalam', nativeName: 'മലയാളം', script: 'Malayalam' },
  pa: { name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', script: 'Gurmukhi' },
  or: { name: 'Odia', nativeName: 'ଓଡ଼ିଆ', script: 'Odia' },
  ur: { name: 'Urdu', nativeName: 'اردو', script: 'Arabic', isRTL: true },
  as: { name: 'Assamese', nativeName: 'অসমীয়া', script: 'Bengali' },
};

/**
 * Translate text using Google Cloud Translation API
 */
export async function translateWithGoogle(
  text: string,
  targetLanguage: string,
  sourceLanguage: string = 'en'
): Promise<string> {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  
  if (!apiKey) {
    console.warn('[Google Translate] API key not configured, falling back to original text');
    return text;
  }

  // Validate target language
  if (!isIndianLanguageSupported(targetLanguage) && targetLanguage !== 'en') {
    console.warn(`[Google Translate] Language ${targetLanguage} not in supported Indian languages list`);
  }

  try {
    const response = await fetch(`${GOOGLE_TRANSLATE_API_URL}?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        target: targetLanguage,
        source: sourceLanguage,
        format: 'text',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Google Translate] API error:', response.status, errorText);
      throw new Error(`Translation API error: ${response.statusText}`);
    }

    const data: GoogleTranslateResponse = await response.json();
    
    if (data.data?.translations?.[0]) {
      return data.data.translations[0].translatedText;
    }

    throw new Error('Invalid response from Google Translate API');
    
  } catch (error) {
    console.error('[Google Translate] Error:', error);
    // Return original text if translation fails
    return text;
  }
}

/**
 * Translate multiple texts in batch using Google Translate
 */
export async function translateBatchGoogle(
  texts: string[],
  targetLanguage: string,
  sourceLanguage: string = 'en'
): Promise<string[]> {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  
  if (!apiKey) {
    console.warn('[Google Translate] API key not configured, returning original texts');
    return texts;
  }

  try {
    const response = await fetch(`${GOOGLE_TRANSLATE_API_URL}?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: texts,
        target: targetLanguage,
        source: sourceLanguage,
        format: 'text',
      }),
    });

    if (!response.ok) {
      throw new Error(`Translation API error: ${response.statusText}`);
    }

    const data: GoogleTranslateResponse = await response.json();
    
    if (data.data?.translations) {
      return data.data.translations.map(t => t.translatedText);
    }

    throw new Error('Invalid response from Google Translate API');
    
  } catch (error) {
    console.error('[Google Translate] Batch error:', error);
    return texts;
  }
}

/**
 * Check if an Indian language is supported by Google Translate
 */
export function isIndianLanguageSupported(languageCode: string): boolean {
  return languageCode in INDIAN_LANGUAGES_GOOGLE;
}

/**
 * Get language metadata
 */
export function getLanguageInfo(languageCode: string) {
  return INDIAN_LANGUAGES_GOOGLE[languageCode as keyof typeof INDIAN_LANGUAGES_GOOGLE] || null;
}

/**
 * Detect if a language is RTL (Right-to-Left)
 */
export function isRTL(languageCode: string): boolean {
  const langInfo = getLanguageInfo(languageCode);
  return (langInfo as any)?.isRTL === true;
}

/**
 * Get all supported Indian language codes
 */
export function getSupportedIndianLanguageCodes(): string[] {
  return Object.keys(INDIAN_LANGUAGES_GOOGLE);
}
