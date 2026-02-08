import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('branding_settings')
        .select('*')
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const { data, error } = await supabase
        .from('branding_settings')
        .update({
            title: body.title,
            primary_color: body.primaryColor,
            logo_path: body.logoPath,
            footer_text: body.footerText,
            theme: body.theme,
            updated_at: new Date().toISOString()
        })
        .eq('id', '00000000-0000-0000-0000-000000000000') // Updating the global record
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log branding update
    await supabase.from('logs').insert({
        level: 'info',
        message: `Branding updated: ${body.title}`,
        details: { user: user.email, timestamp: new Date().toISOString() }
    });

    return NextResponse.json(data);
}
