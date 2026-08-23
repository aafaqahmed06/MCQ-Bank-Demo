import { NextResponse } from "next/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

function isSafeNext(next: string): boolean {
  return next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\");
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";
  const target = isSafeNext(next) ? next : "/";

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (!error) {
      return redirectToTarget(request, origin, target);
    }
  } else if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return redirectToTarget(request, origin, target);
    }
  }

  return NextResponse.redirect(`${origin}/auth?error=auth`);
}

function redirectToTarget(request: Request, origin: string, target: string) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";
  if (isLocalEnv) {
    return NextResponse.redirect(`${origin}${target}`);
  }
  if (forwardedHost) {
    return NextResponse.redirect(`https://${forwardedHost}${target}`);
  }
  return NextResponse.redirect(`${origin}${target}`);
}
