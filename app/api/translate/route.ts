import { NextRequest, NextResponse } from 'next/server';
import { translateText, translateBatch } from '@/lib/libre-translate';

/**
 * Translation API Endpoint
 * Provides real-time translation using LibreTranslate
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

    // Handle batch translation
    if (texts && Array.isArray(texts)) {
      const translations = await translateBatch(texts, target, source);
      return NextResponse.json({
        success: true,
        translations,
      });
    }

    // Handle single text translation
    if (text) {
      const translation = await translateText(text, target, source);
      return NextResponse.json({
        success: true,
        translatedText: translation,
      });
    }

    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Translation API error:', error);
    return NextResponse.json(
      { error: 'Translation failed' },
      { status: 500 }
    );
  }
}
