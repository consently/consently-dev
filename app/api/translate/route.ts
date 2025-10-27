import { NextRequest, NextResponse } from 'next/server';
import { translate, translateBatch, isLanguageSupported, getCacheStats } from '@/lib/translation-service';

/**
 * Translation API Endpoint
 * Provides real-time translation with multiple providers
 * 
 * Supports:
 * - Google Cloud Translation API (preferred for Indian languages)
 * - LibreTranslate (free fallback)
 * - Automatic provider selection
 * - Translation caching
 * 
 * Supported Indian Languages:
 * Hindi (hi), Bengali (bn), Tamil (ta), Telugu (te), Marathi (mr),
 * Gujarati (gu), Kannada (kn), Malayalam (ml), Punjabi (pa),
 * Odia (or), Urdu (ur), Assamese (as)
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, texts, target, source = 'en', provider = 'auto' } = body;

    // Validate input
    if (!target) {
      return NextResponse.json(
        { error: 'Target language is required' },
        { status: 400 }
      );
    }

    if (!text && !texts) {
      return NextResponse.json(
        { error: 'Text or texts array is required' },
        { status: 400 }
      );
    }

    // Check if language is supported
    if (!isLanguageSupported(target)) {
      return NextResponse.json(
        { 
          error: `Language ${target} is not supported`,
          supported_languages: ['hi', 'bn', 'ta', 'te', 'mr', 'gu', 'kn', 'ml', 'pa', 'or', 'ur', 'as', 'en']
        },
        { status: 400 }
      );
    }

    // Handle batch translation
    if (texts && Array.isArray(texts)) {
      const results = await translateBatch(texts, target, source, {
        provider,
        cacheResults: true,
        fallbackToOriginal: true,
      });
      
      return NextResponse.json({
        success: true,
        translations: results.map(r => r.translatedText),
        provider: results[0]?.provider || 'none',
        cached: results[0]?.cached || false,
        count: results.length,
      });
    }

    // Handle single text translation
    if (text) {
      const result = await translate(text, target, source, {
        provider,
        cacheResults: true,
        fallbackToOriginal: true,
      });
      
      return NextResponse.json({
        success: true,
        translatedText: result.translatedText,
        provider: result.provider,
        cached: result.cached,
        error: result.error,
      });
    }

    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Translation API error:', error);
    return NextResponse.json(
      { 
        error: 'Translation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/translate
 * Get translation service status and cache stats
 */
export async function GET() {
  try {
    const cacheStats = getCacheStats();
    const googleConfigured = !!process.env.GOOGLE_TRANSLATE_API_KEY;
    
    return NextResponse.json({
      success: true,
      providers: {
        google: googleConfigured ? 'configured' : 'not configured',
        libretranslate: 'available',
      },
      cache: cacheStats,
      supported_languages: {
        indian: ['hi', 'bn', 'ta', 'te', 'mr', 'gu', 'kn', 'ml', 'pa', 'or', 'ur', 'as'],
        all: ['en', 'hi', 'bn', 'ta', 'te', 'mr', 'gu', 'kn', 'ml', 'pa', 'or', 'ur', 'as', 'es', 'fr', 'de', 'pt', 'zh'],
      },
    });
  } catch (error) {
    console.error('Translation status error:', error);
    return NextResponse.json(
      { error: 'Failed to get translation status' },
      { status: 500 }
    );
  }
}
