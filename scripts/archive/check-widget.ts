import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkWidget() {
  const widgetId = 'cnsty_mhnhhg68_map2kra3v';

  console.log('Checking for widget:', widgetId);

  const { data, error } = await supabase
    .from('dpdpa_widget_configs')
    .select('*')
    .eq('widget_id', widgetId)
    .single();

  if (error) {
    console.error('Error:', error);
    console.log('\n❌ Widget not found in database!');
    console.log('You need to create this widget first.');
    return;
  }

  console.log('✅ Widget found:', data);
}

checkWidget();
