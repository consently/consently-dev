/**
 * Diagnostic script to identify why preference updates are failing
 * Run: npx tsx scripts/diagnose-preferences-error.ts
 */

import { createServiceClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

async function diagnose() {
  console.log('🔍 Diagnosing preference update errors...\n');

  // Check environment variables
  console.log('📋 Step 1: Checking environment variables');
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

  console.log(`  ✓ NEXT_PUBLIC_SUPABASE_URL: ${hasUrl ? 'Set' : '❌ Missing'}`);
  console.log(`  ✓ NEXT_PUBLIC_SUPABASE_ANON_KEY: ${hasAnonKey ? 'Set' : '❌ Missing'}`);
  console.log(`  ✓ SUPABASE_SERVICE_ROLE_KEY: ${hasServiceKey ? 'Set' : '❌ Missing'}`);

  if (!hasServiceKey) {
    console.log('\n❌ CRITICAL: SUPABASE_SERVICE_ROLE_KEY is not set!');
    console.log('   This means the API is using the anon key, which enforces RLS.');
    console.log('   Add SUPABASE_SERVICE_ROLE_KEY to your .env.local file.');
    console.log('   You can find it in your Supabase project settings.');
    return;
  }

  console.log('\n📋 Step 2: Checking database table and RLS status');
  
  try {
    // Create a mock cookies object for testing
    const mockCookies = {
      getAll: () => [],
      setAll: () => {},
    };

    // Simulate createServiceClient
    const { createServerClient } = await import('@supabase/ssr');
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: mockCookies as any,
      }
    );

    // Check if visitor_consent_preferences table exists
    const { data: tableCheck, error: tableError } = await supabase
      .from('visitor_consent_preferences')
      .select('*')
      .limit(1);

    if (tableError) {
      console.log(`  ❌ Error accessing visitor_consent_preferences: ${tableError.message}`);
      console.log(`     Code: ${tableError.code}`);
      console.log(`     Details: ${tableError.details}`);
      console.log(`     Hint: ${tableError.hint}`);
    } else {
      console.log(`  ✓ Table visitor_consent_preferences is accessible`);
      console.log(`    Found ${tableCheck?.length || 0} sample records`);
    }

    // Try to insert a test record
    console.log('\n📋 Step 3: Testing INSERT operation');
    const testData = {
      visitor_id: 'test-visitor-diagnostic',
      widget_id: 'test-widget-diagnostic',
      activity_id: '00000000-0000-0000-0000-000000000000', // Will fail FK, but tests INSERT permission
      consent_status: 'accepted',
      consent_given_at: new Date().toISOString(),
      device_type: 'Desktop',
      language: 'en',
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      consent_version: '1.0',
    };

    const { data: insertTest, error: insertError } = await supabase
      .from('visitor_consent_preferences')
      .insert(testData)
      .select();

    if (insertError) {
      if (insertError.code === '23503') {
        console.log('  ✓ INSERT permission works (foreign key error expected)');
      } else {
        console.log(`  ❌ INSERT failed: ${insertError.message}`);
        console.log(`     Code: ${insertError.code}`);
        console.log(`     Details: ${insertError.details}`);
        console.log(`     Hint: ${insertError.hint}`);
        
        if (insertError.code === '42501') {
          console.log('\n  ⚠️  RLS POLICY ERROR: The service role client cannot bypass RLS!');
          console.log('     This usually means:');
          console.log('     1. RLS policies are not properly configured');
          console.log('     2. The service role key is incorrect');
          console.log('     3. There is a database permission issue');
        }
      }
    } else {
      console.log('  ✓ INSERT works correctly');
      // Clean up test record
      await supabase
        .from('visitor_consent_preferences')
        .delete()
        .eq('visitor_id', 'test-visitor-diagnostic');
    }

    // Check for existing preferences to test UPDATE
    console.log('\n📋 Step 4: Testing UPDATE operation');
    const { data: existingPrefs } = await supabase
      .from('visitor_consent_preferences')
      .select('id, visitor_id, widget_id, activity_id')
      .limit(1);

    if (existingPrefs && existingPrefs.length > 0) {
      const testPref = existingPrefs[0];
      const { error: updateError } = await supabase
        .from('visitor_consent_preferences')
        .update({ consent_status: 'accepted', last_updated: new Date().toISOString() })
        .eq('id', testPref.id);

      if (updateError) {
        console.log(`  ❌ UPDATE failed: ${updateError.message}`);
        console.log(`     Code: ${updateError.code}`);
        console.log(`     Details: ${updateError.details}`);
        console.log(`     Hint: ${updateError.hint}`);
      } else {
        console.log('  ✓ UPDATE works correctly');
      }
    } else {
      console.log('  ⚠️  No existing preferences to test UPDATE');
    }

    console.log('\n✅ Diagnostic complete!');

  } catch (error: any) {
    console.error('\n❌ Error during diagnosis:', error);
    console.error('   Message:', error?.message);
    console.error('   Stack:', error?.stack);
  }
}

diagnose().catch(console.error);

