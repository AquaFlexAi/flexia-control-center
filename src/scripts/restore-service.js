
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:8000';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByb2plY3QtcmVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTYxNjE5MzgzNywiZXhwIjoxOTI5NTEzODM3fQ.3Suzx0RCpPmaZ6sOx9wQfZDDaWCjrVHcL26W1JGE7H4';

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
