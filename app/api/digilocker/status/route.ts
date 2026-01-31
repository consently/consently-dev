/**
 * DigiLocker Verification Status Endpoint
 * 
 * GET /api/digilocker/status
 * 
 * Returns the current user's DigiLocker verification status:
 * - Whether they have a valid verification
 * - Age and adult status
 * - Consent validity
 * 
 * Response:
 * {
 *   verified: boolean,
 *   isAdult: boolean | null,
 *   age: number | null,
 *   name: string | null,
 *   consentValid: boolean,
 *   consentValidTill: string | null,
 *   verifiedAt: string | null,
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isConsentValid } from '@/lib/digilocker';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'unauthorized', message: 'Please sign in to check verification status' },
        { status: 401 }
      );
    }

    // Get latest verification for user
    const { data: verification, error } = await supabase
      .from('digilocker_verifications')
      .select('is_adult, age_at_verification, name, consent_valid_till, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // PGRST116 means no rows returned - user hasn't verified yet
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          verified: false,
          isAdult: null,
          age: null,
          name: null,
          consentValid: false,
          consentValidTill: null,
          verifiedAt: null,
        });
      }

      console.error('Error fetching verification status:', error);
      return NextResponse.json(
        { error: 'database_error', message: 'Failed to fetch verification status' },
        { status: 500 }
      );
    }

    // Check if consent is still valid
    const consentValid = isConsentValid(verification.consent_valid_till);

    return NextResponse.json({
      verified: true,
      isAdult: verification.is_adult,
      age: verification.age_at_verification,
      name: verification.name,
      consentValid,
      consentValidTill: verification.consent_valid_till,
      verifiedAt: verification.created_at,
    });

  } catch (error) {
    console.error('DigiLocker status error:', error);
    
    return NextResponse.json(
      { error: 'server_error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
