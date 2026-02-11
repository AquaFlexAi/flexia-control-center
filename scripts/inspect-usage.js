const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectUsage() {
    const { data, error } = await supabase
        .from('instance_usage_events')
        .select('instance_id, timestamp, total_tokens')
        .limit(10);

    if (error) {
        console.error(error);
        return;
    }

    console.log('Sample Events:');
    console.table(data);

    const { data: counts } = await supabase
        .from('instance_usage_events')
        .select('instance_id')
        .then(res => {
            const map = {};
            res.data.forEach(e => {
                map[e.instance_id] = (map[e.instance_id] || 0) + 1;
            });
            return map;
        });
    console.log('Event counts by ID:', counts);
}

inspectUsage();
