import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Read .env.local manually
const envPath = join(process.cwd(), '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const envVars: Record<string, string> = {};

envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  console.error('Found env vars:', Object.keys(envVars));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPurposeCreation() {
  console.log('Testing purpose creation...\n');
  
  const testPurpose = {
    purpose_name: `Test Purpose ${Date.now()}`,
    description: 'This is a test purpose',
    is_predefined: false
  };
  
  console.log('Attempting to insert:', testPurpose);
  
  const { data, error } = await supabase
    .from('purposes')
    .insert(testPurpose)
    .select()
    .single();
  
  if (error) {
    console.error('❌ Error creating purpose:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    process.exit(1);
  }
  
  console.log('✅ Successfully created purpose:', data);
  
  // Clean up - delete the test purpose
  const { error: deleteError } = await supabase
    .from('purposes')
    .delete()
    .eq('id', data.id);
  
  if (deleteError) {
    console.error('⚠️  Warning: Could not delete test purpose:', deleteError);
  } else {
    console.log('✅ Test purpose cleaned up');
  }
}

testPurposeCreation().catch(console.error);
