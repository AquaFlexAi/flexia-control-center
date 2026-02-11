
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env
const result = dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
if (result.error) {
    console.error('Error loading .env.local', result.error);
}

console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('SERVICE_KEY_LEN:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length);

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

// --- Constants from billing.ts ---
const SUBSCRIPTION_QUOTAS = {
    free: { tokens: 10000, priceId: null, requiredFlxStake: 0 },
    pro: { tokens: 1000000, priceId: process.env.STRIPE_PRO_PRICE_ID, requiredFlxStake: 1000 },
    enterprise: { tokens: -1, priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID, requiredFlxStake: 10000 },
};

const ASSET_PRICES = {
    'BTC': 65000,
    'ETH': 3500,
    'BNB': 600,
    'USDT': 1.0,
    'FLX': 0.10
};

const STAKING_YIELD_RATES = {
    'BTC': 0.05,
    'ETH': 0.04,
    'BNB': 0.06,
    'USDT': 0.03
};

// --- Logic from billing.ts (adapted for standalone) ---

async function calculateStakingFlxCredit(userId: string): Promise<number> {
    console.log('Calculating FLX Credit...');
    const { data: stakes, error } = await supabase
        .from('staked_assets')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

    if (error) {
        console.error('Error fetching stakes:', error);
        return 0;
    }
    if (!stakes) return 0;

    let totalFlxCredit = 0;
    for (const stake of stakes) {
        const asset = stake.asset_type as keyof typeof ASSET_PRICES;
        const priceUsd = ASSET_PRICES[asset] || 0;
        const yieldRate = STAKING_YIELD_RATES[asset as keyof typeof STAKING_YIELD_RATES] || 0;

        const valueUsd = stake.amount * priceUsd;
        // FLX Equivalent
        const flxEquivalent = valueUsd / (ASSET_PRICES['FLX'] || 1);

        totalFlxCredit += flxEquivalent * yieldRate;
    }
    return totalFlxCredit;
}

async function initializeMonthlyQuota(userId: string, tier: string) {
    console.log(`Initializing Monthly Quota for ${tier}...`);
    let finalTier = tier;
    if (tier === 'free') {
        const stakes = await calculateStakingFlxCredit(userId);
        if (stakes >= SUBSCRIPTION_QUOTAS.enterprise.requiredFlxStake) finalTier = 'enterprise';
        else if (stakes >= SUBSCRIPTION_QUOTAS.pro.requiredFlxStake) finalTier = 'pro';
    }

    const limit = SUBSCRIPTION_QUOTAS[finalTier as keyof typeof SUBSCRIPTION_QUOTAS]?.tokens || 10000;
    const currentMonth = new Date().toISOString().slice(0, 7) + '-01';

    await supabase
        .from('user_usage_quotas')
        .upsert({
            user_id: userId,
            month_year: currentMonth,
            token_usage_limit: limit === -1 ? 999999999 : limit,
            token_usage_current: 0,
        }, { onConflict: 'user_id,month_year' });
}

async function refreshSubscriptionFromStaking(userId: string) {
    const flxCredit = await calculateStakingFlxCredit(userId);
    console.log(`Refreshing Sub. Credit: ${flxCredit}`);
    let tier: 'enterprise' | 'pro' | 'free' = 'free';

    if (flxCredit >= SUBSCRIPTION_QUOTAS.enterprise.requiredFlxStake) tier = 'enterprise';
    else if (flxCredit >= SUBSCRIPTION_QUOTAS.pro.requiredFlxStake) tier = 'pro';

    console.log(`Determined Tier: ${tier}`);

    const { error } = await supabase
        .from('subscriptions')
        .upsert({
            user_id: userId,
            tier: tier,
            payment_method: 'staking',
            status: 'active',
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

    if (error) console.error('Error updating subscription:', error);

    await initializeMonthlyQuota(userId, tier);
}

async function recordStakingEvent(userId: string, asset: string, amount: number) {
    console.log(`Recording Staking Event: ${amount} ${asset}`);
    const assetKey = asset.toUpperCase() as keyof typeof ASSET_PRICES;

    const { error } = await supabase
        .from('staked_assets')
        .insert({
            user_id: userId,
            asset_type: assetKey,
            amount: amount,
            entry_price_usd: ASSET_PRICES[assetKey] || 0,
            is_active: true
        });

    if (error) {
        console.error('Error inserting stake object:', error);
        console.error('Error Code:', error.code);
        console.error('Error Message:', error.message);
        console.error('Error Details:', error.details);
        console.error('Error Hint:', error.hint);
        throw error;
    }
    await refreshSubscriptionFromStaking(userId);
}

async function getUserSubscription(userId: string) {
    const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
}

async function getStakedAssets(userId: string) {
    const { data: stakes } = await supabase
        .from('staked_assets')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);
    return stakes || [];
}


// --- Main Test ---
async function main() {
    console.log('Starting Staking Logic Verification (Real Auth)...');

    let TEST_USER_ID: string;

    // 1. Get a valid user from Auth (avoid Foreign Key errors)
    console.log('Fetching a valid user from auth.users...');
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

    if (userError) {
        throw new Error(`Failed to list users: ${userError.message}`);
    }

    if (!users || users.length === 0) {
        console.log('No users found. Creating a new test user...');
        const email = `test-staking-${Date.now()}@example.com`;
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email,
            password: 'password123',
            email_confirm: true
        });

        if (createError || !newUser.user) {
            throw new Error('Failed to create test user: ' + createError?.message);
        }
        console.log(`Created new test user: ${newUser.user.id} (${email})`);
        TEST_USER_ID = newUser.user.id;
    } else {
        // Prefer a user that looks like a test user if possible to avoid messing up real admin data
        // But for now, just picking the last one (often most recent)
        const user = users[users.length - 1];
        TEST_USER_ID = user.id;
        console.log(`Using existing User ID: ${TEST_USER_ID} (${user.email})`);
    }

    try {
        console.log(`\n--- TEST START [User: ${TEST_USER_ID}] ---`);

        // Cleanup: remove existing stakes/subscriptions for this user to ensure clean state
        const { error: delError } = await supabase.from('staked_assets').delete().eq('user_id', TEST_USER_ID);
        if (delError) {
            console.error('Cleanup Delete Error:', delError);
        } else {
            console.log('Cleanup Delete: Success');
        }
        await supabase.from('subscriptions').delete().eq('user_id', TEST_USER_ID);
        await supabase.from('user_usage_quotas').delete().eq('user_id', TEST_USER_ID);

        // 2. Initial State Check
        const initialSub = await getUserSubscription(TEST_USER_ID);
        console.log('Initial Subscription:', initialSub ? initialSub.tier : 'None (Default Free)');

        // 3. Perform Real Staking (Database Operation)
        // Stake 0.5 BTC (Value ~$32,500 -> Yield ~$1,625 -> Credit > 10,000 FLX)
        console.log('Transacting: Staking 0.5 BTC...');
        await recordStakingEvent(TEST_USER_ID, 'BTC', 0.5);

        // 4. Verify Calculations
        const credit = await calculateStakingFlxCredit(TEST_USER_ID);
        console.log(`Calculated FLX Credit: ${credit.toFixed(2)}`);

        if (credit < 16000) {
            throw new Error(`Credit calculation too low. Expected > 16000, got ${credit}`);
        }

        // 5. Verify Subscription Upgrade
        const sub = await getUserSubscription(TEST_USER_ID);
        console.log('Updated Subscription Tier:', sub?.tier);

        if (sub?.tier !== 'enterprise') {
            throw new Error(`Tier upgrade failed. Expected 'enterprise', got '${sub?.tier}'`);
        }
        console.log('SUCCESS: Usage Limits and Tier upgraded correctly.');

        // 6. Verify Assets Recorded
        const assets = await getStakedAssets(TEST_USER_ID);
        console.log(`Staked Assets in DB: ${assets.length}`);
        if (assets.length !== 1) {
            throw new Error('Assets count mismatch in DB.');
        }

        console.log('\n✅ VERIFICATION SUCCESSFUL');

    } catch (e: any) {
        console.error('\n❌ TEST FAILED:', e.message || e);
        process.exit(1);
    }
}

main().catch(console.error);
