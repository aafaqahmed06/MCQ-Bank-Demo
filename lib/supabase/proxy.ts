import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Server-side auth boundary for every request (Next 16 `proxy` convention).
// This is the real gate; components/RequireProfile.tsx is only a client-side
// fallback. Mirrors the getAll/setAll cookie adapter in lib/supabase/server.ts
// but binds cookies to the NextRequest/NextResponse -- `cookies()` from
// next/headers is not available inside a proxy.
const PROTECTED_PREFIXES = [
  "/home",
  "/account",
  "/leaderboard",
  "/blocks",
  "/modules",
  "/topics",
  "/practice",
  "/exam",
  "/onboarding",
  "/admin",
];

// no-store is the reliable signal that keeps browsers from putting an
// authenticated page in the back/forward cache (bfcache).
const NO_STORE = "no-store, max-age=0, must-revalidate";

function isProtected(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // @supabase/ssr contract: do not run logic between createServerClient and
  // getUser(), and return `response` as-is (or copy its cookies onto a
  // redirect) so refreshed-token cookies reach the browser.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const protectedRoute = isProtected(pathname);

  if (protectedRoute && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/auth";
    redirectUrl.search = "";
    const redirect = NextResponse.redirect(redirectUrl);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    redirect.headers.set("Cache-Control", NO_STORE);
    return redirect;
  }

  if (protectedRoute) {
    response.headers.set("Cache-Control", NO_STORE);
  }

  return response;
}
