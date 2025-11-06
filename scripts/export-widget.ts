import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function exportWidget() {
  const widgetId = 'dpdpa_mheon92d_o34gdpk';
  
  console.log(`Exporting widget: ${widgetId}\n`);
  
  // Get widget config
  const { data: widget, error } = await supabase
    .from('dpdpa_widget_configs')
    .select('*')
    .eq('widget_id', widgetId)
    .single();
  
  if (error || !widget) {
    console.error('❌ Widget not found:', error);
    return;
  }
  
  // Get associated activities
  const activityIds = widget.selected_activities || [];
  const { data: activities } = await supabase
    .from('processing_activities')
    .select('*')
    .in('id', activityIds);
  
  const exportData = {
    widget: {
      ...widget,
      // Remove DB-specific fields
      id: undefined,
      user_id: undefined,
      created_at: undefined,
      updated_at: undefined,
    },
    activities: activities || [],
    note: 'Import this widget into your production database. You will need to update user_id and activity IDs.'
  };
  
  const filename = `widget-export-${widgetId}.json`;
  fs.writeFileSync(filename, JSON.stringify(exportData, null, 2));
  
  console.log('✅ Widget exported to:', filename);
  console.log('\nTo import to production:');
  console.log('1. Ensure the processing activities exist in production');
  console.log('2. Update the user_id to match your production user');
  console.log('3. Insert the widget using the production dashboard or Supabase admin');
}

exportWidget().catch(console.error);
