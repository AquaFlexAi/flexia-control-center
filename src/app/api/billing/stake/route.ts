import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { recordStakingEvent } from '@/services/billing';
import { verifyStakingTransaction } from '@/lib/web3';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { asset, amount, txHash } = body;

        if (!asset || !amount || !txHash) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Verify the transaction on-chain
        console.log(`Verifying staking transaction: ${txHash} for ${amount} ${asset}`);

        const isValid = await verifyStakingTransaction(txHash, parseFloat(amount), asset);

        if (!isValid) {
            return NextResponse.json({ error: 'Transaction verification failed' }, { status: 400 });
        }

        await recordStakingEvent(user.id, asset, parseFloat(amount));

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Staking error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
