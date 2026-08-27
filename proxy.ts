import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  // Mid-OAuth/OTP exchange: app/auth/callback/route.ts owns the session
  // cookies here -- don't touch them.
  if (request.nextUrl.pathname.startsWith("/auth/callback")) {
    return NextResponse.next();
  }
  return updateSession(request);
}

export const config = {
  matcher: [
    // Everything except Next internals, metadata files, and image assets.
    // Kept broad so Server Actions on protected pages are covered too.
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|opengraph-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
