export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/server";
import { SovereignVouchersResponse, SovereignVoucherRecord } from "@/types/sovereign";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const minerAddress = searchParams.get('minerAddress');
        const status = searchParams.get('status');

        const supabase = createAdminClient();

        let query = supabase
            .from('sovereign_vouchers')
            .select('*')
            .order('timestamp', { ascending: false });

        if (minerAddress) {
            query = query.eq('miner_address', minerAddress);
        }

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) {
            throw error;
        }

        return NextResponse.json<SovereignVouchersResponse>({
            success: true,
            vouchers: data as SovereignVoucherRecord[]
        });

    } catch (error: any) {
        console.error("[Sovereign Vouchers] API Error:", error.message);
        return NextResponse.json<SovereignVouchersResponse>({ error: "Failed to fetch vouchers" }, { status: 500 });
    }
}
