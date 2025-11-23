/**
 * Check if visitor_consent_preferences has the required unique constraint
 * This constraint is needed for upsert operations to work correctly
 */

import { createClient } from '@supabase/supabase-js';

async function checkConstraint() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🔍 Checking visitor_consent_preferences constraints...\n');

  // Query to check for the unique constraint
  const { data, error } = await supabase
    .rpc('exec_sql', { 
      sql: `
        SELECT 
          tc.constraint_name,
          tc.constraint_type,
          kcu.column_name,
          tc.is_deferrable,
          tc.initially_deferred
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.table_schema = 'public'
          AND tc.table_name = 'visitor_consent_preferences'
        ORDER BY tc.constraint_name, kcu.ordinal_position;
      `
    });

  if (error) {
    console.error('❌ Error querying constraints:', error.message);
    
    // Try alternative method using direct query
    console.log('\n📋 Trying alternative query method...\n');
    
    const { data: altData, error: altError } = await supabase
      .from('visitor_consent_preferences')
      .select('*')
      .limit(0);
    
    if (altError) {
      console.error('❌ Table query error:', altError);
    } else {
      console.log('✅ Table exists and is accessible');
    }
    
    return;
  }

  if (!data || data.length === 0) {
    console.log('⚠️  No constraints found on visitor_consent_preferences table');
    console.log('\n📝 Required constraint: unique_visitor_widget_activity');
    console.log('   Columns: (visitor_id, widget_id, activity_id)');
    console.log('\n💡 To fix, run migration 25_fix_visitor_preferences_constraint.sql');
    return;
  }

  console.log('Found constraints:');
  console.table(data);

  const hasUniqueConstraint = data.some((row: any) => 
    row.constraint_name === 'unique_visitor_widget_activity' ||
    (row.constraint_type === 'UNIQUE' && 
     ['visitor_id', 'widget_id', 'activity_id'].includes(row.column_name))
  );

  if (hasUniqueConstraint) {
    console.log('\n✅ Required unique constraint exists!');
  } else {
    console.log('\n⚠️  Missing unique constraint: unique_visitor_widget_activity');
    console.log('   This is required for upsert operations to work correctly');
    console.log('\n💡 To fix, run migration 25_fix_visitor_preferences_constraint.sql');
  }

  // Test an actual upsert operation
  console.log('\n🧪 Testing upsert operation...');
  
  const testUpdate = {
    visitor_id: 'test_visitor_' + Date.now(),
    widget_id: 'test_widget',
    activity_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
    consent_status: 'accepted',
    device_type: 'Desktop',
    language: 'en',
    expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    consent_version: '1.0',
  };

  const { error: upsertError } = await supabase
    .from('visitor_consent_preferences')
    .upsert([testUpdate], {
      onConflict: 'visitor_id,widget_id,activity_id',
      ignoreDuplicates: false,
    });

  if (upsertError) {
    console.error('❌ Upsert test failed:', upsertError.message);
    console.error('   Code:', upsertError.code);
    console.error('   Details:', upsertError.details);
    console.error('   Hint:', upsertError.hint);
  } else {
    console.log('✅ Upsert test successful');
    
    // Clean up test data
    await supabase
      .from('visitor_consent_preferences')
      .delete()
      .eq('visitor_id', testUpdate.visitor_id);
  }
}

checkConstraint().catch(console.error);

