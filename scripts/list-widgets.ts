import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function listWidgets() {
    console.log('Fetching all widgets...\n');

    const { data, error } = await supabase
        .from('dpdpa_widget_configs')
        .select('widget_id, name, domain')
        .limit(10);

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (!data || data.length === 0) {
        console.log('❌ No widgets found in database!');
        console.log('\nYou need to create a widget first:');
        console.log('1. Go to http://localhost:3000/dashboard');
        console.log('2. Navigate to DPDPA Widget section');
        console.log('3. Create a new widget');
        return;
    }

    console.log(`✅ Found ${data.length} widget(s):\n`);
    data.forEach((widget, i) => {
        console.log(`${i + 1}. ID: ${widget.widget_id}`);
        console.log(`   Name: ${widget.name}`);
        console.log(`   Domain: ${widget.domain}`);
        console.log(`   Privacy Centre URL: http://localhost:3000/privacy-centre/${widget.widget_id}\n`);
    });
}

listWidgets();
