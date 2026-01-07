import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/cache';

export async function POST(request: NextRequest) {
  try {
    const { keys } = await request.json();

    if (!keys || !Array.isArray(keys)) {
      return NextResponse.json(
        { error: 'Keys array is required' },
        { status: 400 }
      );
    }

    // Clear each key from Redis cache
    for (const key of keys) {
      await cache.del(key);
      console.log(`Cleared cache key: ${key}`);
    }

    return NextResponse.json({
      success: true,
      message: `Cleared ${keys.length} cache keys`,
      clearedKeys: keys,
      clearedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cache clear error:', error);
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}
