
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY and/or NEXT_PUBLIC_SUPABASE_URL');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('Restoring OpenCode IDE service...');
    
    const { data, error } = await supabase.from('services').insert([
        {
            id: '50544743-d214-48c8-b8c8-05f9f4f81ee8',
            name: 'OpenCode IDE',
            status: 'offline', // Default to offline as it's not running
            type: 'ide',
            region: 'Global Edge',
            instances: 2
        }
    ]);

    if (error) {
        console.error('Failed to restore service:', error);
    } else {
        console.log('Successfully restored OpenCode IDE service.');
    }
}

run();
