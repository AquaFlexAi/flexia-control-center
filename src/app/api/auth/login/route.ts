import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { LoginResponse } from "@/types/auth";

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();
        const supabase = await createClient();

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            const response: LoginResponse = { error: error.message };
            return NextResponse.json(response, { status: 401 });
        }

        const response: LoginResponse = { user: data.user, session: data.session };
        return NextResponse.json(response);
    } catch (error: any) {
        const response: LoginResponse = { error: "Internal Server Error", details: error.message };
        return NextResponse.json(response, { status: 500 });
    }
}
