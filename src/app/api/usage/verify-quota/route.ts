import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkQuota } from '@/services/billing';
import { QuotaVerifyResponse } from '@/types/billing';

/**
 * Verify User Quota (called by AI Routers)
 * 
 * Validates API Key and checks if user has enough tokens left.
 */
export async function POST(request: Request) {
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json<QuotaVerifyResponse>({ allowed: false, error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = authHeader.split(' ')[1];

    try {
        // 1. Resolve User from API Key
        // Assuming we have a table 'user_api_keys' linking to auth.users
        const { data: keyData, error: keyError } = await supabaseAdmin
            .from('user_api_keys')
            .select('user_id')
            .eq('key_hash', apiKey) // Simplified: typically use prefix + hash
            .single();

        if (keyError || !keyData) {
            return NextResponse.json<QuotaVerifyResponse>({ allowed: false, error: 'Invalid API Key' }, { status: 403 });
        }

        const userId = keyData.user_id;

        // 2. Check Quota
        const allowed = await checkQuota(userId, 0); // Check if they can even start a request (0 tokens)

        if (!allowed) {
            return NextResponse.json<QuotaVerifyResponse>({ allowed: false, error: 'Monthly quota exceeded' }, { status: 429 });
        }

        return NextResponse.json<QuotaVerifyResponse>({ allowed: true, userId });
    } catch (err: any) {
        return NextResponse.json<QuotaVerifyResponse>({ allowed: false, error: err.message }, { status: 500 });
    }
}
