import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPurposes() {
  console.log('Checking purposes in database...\n');
  
  // Get all purposes
  const { data: purposes, error } = await supabase
    .from('purposes')
    .select('*')
    .order('purpose_name');
  
  if (error) {
    console.error('Error fetching purposes:', error);
    process.exit(1);
  }
  
  console.log(`Found ${purposes?.length || 0} purposes in database:\n`);
  
  // Check for specific purposes needed by templates
  const requiredPurposes = [
    'Account Management',
    'Enable Order Tracking',
    'Manage Billing & Payments'
  ];
  
  console.log('Required purposes for e-commerce templates:');
  requiredPurposes.forEach(name => {
    const found = purposes?.find(p => p.purpose_name === name);
    if (found) {
      console.log(`✅ ${name} (ID: ${found.id})`);
    } else {
      console.log(`❌ ${name} - NOT FOUND`);
    }
  });
  
  console.log('\nAll purposes:');
  purposes?.forEach(p => {
    console.log(`- ${p.purpose_name} (${p.id}) ${p.is_predefined ? '[predefined]' : ''}`);
  });
}

checkPurposes().catch(console.error);
