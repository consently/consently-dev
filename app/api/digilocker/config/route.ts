/**
 * DigiLocker Configuration Status Endpoint
 * 
 * GET /api/digilocker/config
 * 
 * Returns whether DigiLocker is properly configured.
 * This is needed because env vars without NEXT_PUBLIC_ prefix
 * are not available in client-side code.
 */

import { NextResponse } from 'next/server';
import { features } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    configured: features.digilocker,
    env: process.env.DIGILOCKER_ENV || 'sandbox',
    issuerId: process.env.DIGILOCKER_ISSUER_ID || 'in.consently',
  });
}
