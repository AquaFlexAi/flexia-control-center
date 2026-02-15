import { NextRequest, NextResponse } from 'next/server';
import { processMiningEpoch } from '@/services/oracle';
import { distributeProfitShare } from '@/services/resource-calculator';
import { MiningEpochResponse } from '@/types/cron';

/**
 * Mining Epoch & Profit Sharing Endpoint
 */
export async function POST(request: NextRequest) {
    // ... auth check ...

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'mining';
    const profit = parseFloat(searchParams.get('profit') || '0');

    try {
        if (action === 'profit-share' && profit > 0) {
            await distributeProfitShare(profit);
            return NextResponse.json({ success: true, message: `Profit sharing of $${profit} processed` } as MiningEpochResponse);
        }

        await processMiningEpoch();
        return NextResponse.json({
            success: true,
            message: 'Mining epoch processed successfully'
        } as MiningEpochResponse);
    } catch (error: any) {
        console.error('[API] Mining epoch error:', error);
        return NextResponse.json({
            error: 'Processing failed',
            details: error.message
        } as MiningEpochResponse, { status: 500 });
    }
}

// Allow GET for manual testing
export async function GET(request: NextRequest) {
    return POST(request);
}
