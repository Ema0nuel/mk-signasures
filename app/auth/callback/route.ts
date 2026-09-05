import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  const supabase = await createClient();

  // PKCE flow: exchange auth code for session
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Password recovery: verify the token hash
  if (tokenHash && type === "recovery") {
    const { error } = await supabase.auth.verifyOtp({
      tokenHash,
      type: "recovery",
    });
    if (!error) {
      return NextResponse.redirect(`${origin}/auth/reset-password`);
    }
  }

  // Fallback: redirect to home with error
  return NextResponse.redirect(`${origin}/?error=auth_callback_failed`);
}
