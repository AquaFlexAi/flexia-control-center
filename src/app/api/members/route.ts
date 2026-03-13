import { createClient } from "@/utils/supabase/server";
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

export async function GET() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('organization_members')
        .select('*')
        .order('joined_at', { ascending: true });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}
