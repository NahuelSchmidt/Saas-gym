import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Optional: next param lets Supabase redirect to a specific page after confirm
  const next = searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(
      `${origin}/auth/login?error=missing_code`
    );
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const message = encodeURIComponent(error.message ?? "auth_callback_error");
    return NextResponse.redirect(
      `${origin}/auth/login?error=${message}`
    );
  }

  // Successful exchange — redirect to dashboard (or the `next` param)
  return NextResponse.redirect(`${origin}${next}`);
}
