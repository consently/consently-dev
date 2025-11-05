import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyMigration() {
  console.log('🔍 Checking purposes table...');
  
  // Read the migration file to display
  const migrationPath = path.join(process.cwd(), 'supabase/migrations/20250105_create_purposes_table.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');
  
  console.log('\n📋 Migration SQL ready to apply');
  console.log('='.repeat(60));
  console.log('\n⚠️  Please manually apply this SQL in Supabase Dashboard:');
  console.log('   1. Go to: https://supabase.com/dashboard/project/skjfzeunsqaayqarotjo/sql');
  console.log('   2. Paste the SQL from: supabase/migrations/20250105_create_purposes_table.sql');
  console.log('   3. Click "Run"\n');
  console.log('='.repeat(60));
  
  // Try to verify if table exists
  try {
    const { data: purposes, error: verifyError } = await supabase
      .from('purposes')
      .select('id, purpose_name, name, data_category, retention_period, is_predefined')
      .limit(5);
    
    if (verifyError) {
      console.log('\n❌ Table verification failed:', verifyError.message);
      console.log('\n🔧 This means you need to apply the migration first.');
      console.log('   Copy the SQL from: supabase/migrations/20250105_create_purposes_table.sql');
      return false;
    }
    
    console.log('\n✅ Table exists and is accessible!');
    console.log(`   Found ${purposes?.length || 0} records\n`);
    
    if (purposes && purposes.length > 0) {
      console.log('Sample records:');
      purposes.forEach((p: any) => {
        console.log(`  - ${p.purpose_name}`);
        console.log(`    name: ${p.name || 'NULL'}`);
        console.log(`    data_category: ${p.data_category || 'NULL'}`);
        console.log(`    retention_period: ${p.retention_period || 'NULL'}`);
      });
    }
    
    return true;
  } catch (err) {
    console.error('\n❌ Unexpected error:', err);
    return false;
  }
}

verifyMigration().then((success) => {
  process.exit(success ? 0 : 1);
});
