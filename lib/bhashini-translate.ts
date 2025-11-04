/**
 * Bhashini Translation API Integration
 * Government of India's multilingual translation platform
 * 
 * Supports: 22+ Indian languages including Hindi, Bengali, Tamil, Telugu, Marathi, 
 * Gujarati, Kannada, Malayalam, Punjabi, Odia, Assamese, and more
 * 
 * Setup:
 * 1. Register at https://bhashini.gov.in/ulca/user/register
 * 2. Get your User ID and API Key
 * 3. Set environment variables:
 *    - BHASHINI_API_KEY
 *    - BHASHINI_USER_ID
 *    - BHASHINI_PIPELINE_ID (default: 64392f96daac500b55c543cd)
 */

const BHASHINI_CONFIG_ENDPOINT = 'https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline';
const DEFAULT_PIPELINE_ID = '64392f96daac500b55c543cd'; // MeitY Pipeline

export interface BhashiniConfigRequest {
  pipelineTasks: Array<{
    taskType: 'translation';
    config: {
      language: {
        sourceLanguage: string;
        targetLanguage: string;
      };
    };
  }>;
  pipelineRequestConfig: {
    pipelineId: string;
  };
}

export interface BhashiniConfigResponse {
  pipelineResponseConfig: Array<{
    taskType: string;
    config: Array<{
      serviceId: string;
      language: {
        sourceLanguage: string;
        targetLanguage: string;
      };
    }>;
  }>;
  pipelineInferenceAPIEndPoint: {
    callbackUrl: string;
    inferenceApiKey: {
      name: string;
      value: string;
    };
  };
}

export interface BhashiniTranslationRequest {
  pipelineTasks: Array<{
    taskType: 'translation';
    config: {
      language: {
        sourceLanguage: string;
        targetLanguage: string;
      };
      serviceId: string;
    };
  }>;
  inputData: {
    input: Array<{
      source: string;
    }>;
    audio: Array<{
      audioContent: null;
    }>;
  };
}

export interface BhashiniTranslationResponse {
  pipelineResponse: Array<{
    taskType: string;
    output: Array<{
      source: string;
      target: string;
    }>;
  }>;
}

/**
 * Supported Indian languages in Bhashini (ISO-639 codes)
 * Based on Bhashini's official language support
 */
export const INDIAN_LANGUAGES_BHASHINI = {
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
  as: { name: 'Assamese', nativeName: 'অসমীয়া', script: 'Bengali' },
  ur: { name: 'Urdu', nativeName: 'اردو', script: 'Arabic', isRTL: true },
  sa: { name: 'Sanskrit', nativeName: 'संस्कृतम्', script: 'Devanagari' },
  ks: { name: 'Kashmiri', nativeName: 'कॉशुर', script: 'Devanagari' },
  ne: { name: 'Nepali', nativeName: 'नेपाली', script: 'Devanagari' },
  sd: { name: 'Sindhi', nativeName: 'سنڌي', script: 'Arabic', isRTL: true },
  mai: { name: 'Maithili', nativeName: 'मैथिली', script: 'Devanagari' },
  doi: { name: 'Dogri', nativeName: 'डोगरी', script: 'Devanagari' },
  en: { name: 'English', nativeName: 'English', script: 'Latin' },
};

// Cache for pipeline configurations (valid for session/24 hours)
interface CachedConfig {
  config: BhashiniConfigResponse;
  timestamp: number;
  expiresAt: number;
}

const configCache = new Map<string, CachedConfig>();
const CONFIG_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generate cache key for pipeline config
 */
function getConfigCacheKey(sourceLang: string, targetLang: string): string {
  return `${sourceLang}-${targetLang}`;
}

/**
 * Get cached pipeline config if valid
 */
function getCachedConfig(sourceLang: string, targetLang: string): BhashiniConfigResponse | null {
  const key = getConfigCacheKey(sourceLang, targetLang);
  const cached = configCache.get(key);
  
  if (cached && Date.now() < cached.expiresAt) {
    return cached.config;
  }
  
  // Remove expired cache
  if (cached) {
    configCache.delete(key);
  }
  
  return null;
}

/**
 * Save pipeline config to cache
 */
function saveCachedConfig(sourceLang: string, targetLang: string, config: BhashiniConfigResponse): void {
  const key = getConfigCacheKey(sourceLang, targetLang);
  const timestamp = Date.now();
  
  configCache.set(key, {
    config,
    timestamp,
    expiresAt: timestamp + CONFIG_CACHE_DURATION,
  });
  
  // Limit cache size to 100 entries (simple LRU)
  if (configCache.size > 100) {
    const firstKey = configCache.keys().next().value;
    if (firstKey) {
      configCache.delete(firstKey);
    }
  }
}

/**
 * Step 1: Get Pipeline Configuration from Bhashini
 * This call retrieves the service configuration and API endpoint for translation
 */
export async function getPipelineConfig(
  sourceLanguage: string,
  targetLanguage: string
): Promise<BhashiniConfigResponse> {
  const apiKey = process.env.BHASHINI_API_KEY;
  const userId = process.env.BHASHINI_USER_ID;
  const pipelineId = process.env.BHASHINI_PIPELINE_ID || DEFAULT_PIPELINE_ID;

  if (!apiKey) {
    throw new Error('[Bhashini] API key not configured. Set BHASHINI_API_KEY environment variable.');
  }

  if (!userId) {
    throw new Error('[Bhashini] User ID not configured. Set BHASHINI_USER_ID environment variable.');
  }

  // Check cache first
  const cachedConfig = getCachedConfig(sourceLanguage, targetLanguage);
  if (cachedConfig) {
    console.log(`[Bhashini] Using cached config for ${sourceLanguage} -> ${targetLanguage}`);
    return cachedConfig;
  }

  const requestBody: BhashiniConfigRequest = {
    pipelineTasks: [
      {
        taskType: 'translation',
        config: {
          language: {
            sourceLanguage,
            targetLanguage,
          },
        },
      },
    ],
    pipelineRequestConfig: {
      pipelineId,
    },
  };

  try {
    const response = await fetch(BHASHINI_CONFIG_ENDPOINT, {
      method: 'POST',
      headers: {
        'userID': userId,
        'ulcaApiKey': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Bhashini] Pipeline config error:', response.status, errorText);
      throw new Error(`Bhashini pipeline config failed: ${response.statusText}`);
    }

    const config: BhashiniConfigResponse = await response.json();
    
    // Validate response
    if (!config.pipelineResponseConfig || !config.pipelineInferenceAPIEndPoint) {
      throw new Error('Invalid response from Bhashini pipeline config');
    }

    // Cache the configuration
    saveCachedConfig(sourceLanguage, targetLanguage, config);
    
    return config;
  } catch (error) {
    console.error('[Bhashini] Pipeline config error:', error);
    throw error;
  }
}

/**
 * Step 2: Perform Translation using Pipeline Compute API
 * Uses the configuration from getPipelineConfig to translate text
 */
export async function translateText(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
  serviceId: string,
  authToken: string,
  endpoint: string
): Promise<string> {
  const requestBody: BhashiniTranslationRequest = {
    pipelineTasks: [
      {
        taskType: 'translation',
        config: {
          language: {
            sourceLanguage,
            targetLanguage,
          },
          serviceId,
        },
      },
    ],
    inputData: {
      input: [
        {
          source: text,
        },
      ],
      audio: [
        {
          audioContent: null,
        },
      ],
    },
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': authToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Bhashini] Translation error:', response.status, errorText);
      throw new Error(`Bhashini translation failed: ${response.statusText}`);
    }

    const data: BhashiniTranslationResponse = await response.json();
    
    // Extract translated text
    if (data.pipelineResponse?.[0]?.output?.[0]?.target) {
      return data.pipelineResponse[0].output[0].target;
    }

    throw new Error('Invalid response from Bhashini translation API');
  } catch (error) {
    console.error('[Bhashini] Translation error:', error);
    throw error;
  }
}

/**
 * Main wrapper function for Bhashini translation
 * Handles both pipeline config and translation in one call
 */
export async function translateWithBhashini(
  text: string,
  targetLanguage: string,
  sourceLanguage: string = 'en'
): Promise<string> {
  try {
    // Validate languages
    if (!isIndianLanguageSupported(targetLanguage) && targetLanguage !== 'en') {
      console.warn(`[Bhashini] Language ${targetLanguage} may not be supported`);
    }

    // Step 1: Get pipeline configuration
    const config = await getPipelineConfig(sourceLanguage, targetLanguage);
    
    // Extract service details
    const serviceId = config.pipelineResponseConfig[0]?.config[0]?.serviceId;
    if (!serviceId) {
      throw new Error('Service ID not found in pipeline config');
    }

    const endpoint = config.pipelineInferenceAPIEndPoint.callbackUrl;
    const authToken = config.pipelineInferenceAPIEndPoint.inferenceApiKey.value;

    // Step 2: Translate the text
    const translatedText = await translateText(
      text,
      sourceLanguage,
      targetLanguage,
      serviceId,
      authToken,
      endpoint
    );

    return translatedText;
  } catch (error) {
    console.error('[Bhashini] Error:', error);
    // Return original text if translation fails (graceful degradation)
    return text;
  }
}

/**
 * Translate multiple texts in batch using Bhashini
 * Note: Bhashini supports multiple inputs in a single request
 */
export async function translateBatchBhashini(
  texts: string[],
  targetLanguage: string,
  sourceLanguage: string = 'en'
): Promise<string[]> {
  try {
    // Step 1: Get pipeline configuration
    const config = await getPipelineConfig(sourceLanguage, targetLanguage);
    
    // Extract service details
    const serviceId = config.pipelineResponseConfig[0]?.config[0]?.serviceId;
    if (!serviceId) {
      throw new Error('Service ID not found in pipeline config');
    }

    const endpoint = config.pipelineInferenceAPIEndPoint.callbackUrl;
    const authToken = config.pipelineInferenceAPIEndPoint.inferenceApiKey.value;

    // Step 2: Prepare batch request
    const requestBody: BhashiniTranslationRequest = {
      pipelineTasks: [
        {
          taskType: 'translation',
          config: {
            language: {
              sourceLanguage,
              targetLanguage,
            },
            serviceId,
          },
        },
      ],
      inputData: {
        input: texts.map(text => ({ source: text })),
        audio: texts.map(() => ({ audioContent: null })),
      },
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': authToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Bhashini batch translation failed: ${response.statusText}`);
    }

    const data: BhashiniTranslationResponse = await response.json();
    
    // Extract all translated texts
    if (data.pipelineResponse?.[0]?.output) {
      return data.pipelineResponse[0].output.map(item => item.target);
    }

    throw new Error('Invalid response from Bhashini batch translation API');
  } catch (error) {
    console.error('[Bhashini] Batch error:', error);
    // Return original texts if translation fails
    return texts;
  }
}

/**
 * Check if an Indian language is supported by Bhashini
 */
export function isIndianLanguageSupported(languageCode: string): boolean {
  return languageCode in INDIAN_LANGUAGES_BHASHINI;
}

/**
 * Get language metadata
 */
export function getLanguageInfo(languageCode: string) {
  return INDIAN_LANGUAGES_BHASHINI[languageCode as keyof typeof INDIAN_LANGUAGES_BHASHINI] || null;
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
  return Object.keys(INDIAN_LANGUAGES_BHASHINI);
}

/**
 * Clear pipeline config cache
 */
export function clearConfigCache(): void {
  configCache.clear();
  console.log('[Bhashini] Config cache cleared');
}

/**
 * Get cache statistics
 */
export function getConfigCacheStats() {
  return {
    size: configCache.size,
    maxSize: 100,
    entries: Array.from(configCache.keys()),
  };
}
