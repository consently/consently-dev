import { NextRequest, NextResponse } from 'next/server';
import { translate, translateBatch, isLanguageSupported, getCacheStats } from '@/lib/translation-service';

/**
 * Translation API Endpoint
 * Provides real-time translation using Google Cloud Translation API
 * 
 * Features:
 * - Google Cloud Translation API for high-quality Indian language translations
 * - Translation caching for performance
 * - Support for 12+ Indian languages
 * 
 * Supported Indian Languages:
 * Hindi (hi), Bengali (bn), Tamil (ta), Telugu (te), Marathi (mr),
 * Gujarati (gu), Kannada (kn), Malayalam (ml), Punjabi (pa),
 * Odia (or), Urdu (ur), Assamese (as), English (en)
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, texts, target, source = 'en' } = body;

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
    if (!isLanguageSupported(target) && target !== 'en') {
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
      provider: 'google',
      status: googleConfigured ? 'configured' : 'not configured',
      cache: cacheStats,
      supported_languages: {
        indian: ['hi', 'bn', 'ta', 'te', 'mr', 'gu', 'kn', 'ml', 'pa', 'or', 'ur', 'as'],
        all: ['en', 'hi', 'bn', 'ta', 'te', 'mr', 'gu', 'kn', 'ml', 'pa', 'or', 'ur', 'as'],
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
