import { NextResponse } from 'next/server';
import { getProposals } from '@/services/governance';

export async function GET() {
    try {
        const proposals = await getProposals();
        return NextResponse.json({ proposals });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
