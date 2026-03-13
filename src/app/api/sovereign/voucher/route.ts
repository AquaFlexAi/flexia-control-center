export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { sovereignService } from "@/lib/sovereign/SovereignService";
import { createAdminClient } from "@/utils/supabase/server";
import { SovereignVoucherRequest, SovereignVoucherResponse } from "@/types/sovereign";

export async function POST(req: NextRequest) {
    try {
        const body: SovereignVoucherRequest = await req.json();
        const { minerAddress, tokensGenerated, taskHash } = body;

        if (!minerAddress || !tokensGenerated) {
            return NextResponse.json<SovereignVoucherResponse>({ error: "Missing minerAddress or tokensGenerated" }, { status: 400 });
        }

        console.log(`[Sovereign] Signing voucher for ${minerAddress} (${tokensGenerated} tokens)`);

        const signedData = await sovereignService.signInferenceVoucher(minerAddress, tokensGenerated, taskHash);

        // Persist to Supabase for the Dashboard
        const supabase = createAdminClient();
        const { error } = await supabase
            .from('sovereign_vouchers')
            .insert({
                miner_address: signedData.miner,
                tokens: signedData.tokensGenerated,
                task_hash: signedData.taskHash,
                timestamp: signedData.timestamp,
                voucher_data: signedData.voucher,
                signature: signedData.signature,
                status: 'unclaimed'
            });

        if (error) {
            console.error("[Sovereign] Database error saving voucher:", error.message);
            // We still return the voucher to the miner so they can get paid, 
            // but log the error for dashboard visibility issues.
        }

        return NextResponse.json<SovereignVoucherResponse>({
            success: true,
            voucher: signedData
        });

    } catch (error: any) {
        console.error("[Sovereign] Error signing voucher:", error);
        return NextResponse.json<SovereignVoucherResponse>({ error: error.message }, { status: 500 });
    }
}
