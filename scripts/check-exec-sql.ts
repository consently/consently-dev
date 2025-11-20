import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function main() {
    console.log('Checking for exec_sql...');
    const { data, error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1 as result' });

    if (error) {
        console.error('Error calling exec_sql:', error);
    } else {
        console.log('Success:', data);
    }
}

main();
