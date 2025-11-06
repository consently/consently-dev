import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkWidget() {
  const widgetId = 'dpdpa_mheon92d_o34gdpk';
  
  console.log(`Checking for widget ID: ${widgetId}\n`);
  
  // Check if widget exists
  const { data, error } = await supabase
    .from('dpdpa_widget_configs')
    .select('*')
    .eq('widget_id', widgetId)
    .single();
  
  if (error) {
    console.error('❌ Error:', error.message);
    console.log('\nWidget NOT found in database.');
  } else if (data) {
    console.log('✅ Widget found!');
    console.log('Details:', JSON.stringify(data, null, 2));
  }
  
  // List all widgets
  console.log('\n\nAll widgets in database:');
  const { data: allWidgets } = await supabase
    .from('dpdpa_widget_configs')
    .select('widget_id, name, is_active, domain, created_at')
    .order('created_at', { ascending: false });
  
  if (allWidgets && allWidgets.length > 0) {
    console.table(allWidgets);
  } else {
    console.log('No widgets found in database.');
  }
}

checkWidget().catch(console.error);
