import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Session refresh + route protection.
 *
 * Runs on every matched request. It:
 *  1. refreshes the Supabase session and writes updated cookies,
 *  2. blocks unauthenticated access to app routes,
 *  3. keeps signed-in users out of the auth pages,
 *  4. hides /admin from everyone except configured admins.
 *
 * Server components still re-check auth — this is defence in depth, not the
 * only check.
 */

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/tutor",
  "/tutorials",
  "/quiz",
  "/solve",
  "/exam-prep",
  "/flashcards",
  "/progress",
  "/profile",
  "/onboarding",
  "/checkout",
  "/admin",
];

const AUTH_ROUTES = ["/login", "/signup", "/forgot-password"];

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  const isAuthRoute = AUTH_ROUTES.includes(pathname);

  // If Supabase is not configured, allow public pages but fail closed on
  // protected routes rather than pretending the user is signed in.
  if (!url || !anonKey) {
    if (isProtected) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.search = `?next=${encodeURIComponent(pathname + search)}&setup=1`;
      return NextResponse.redirect(redirectUrl);
    }
    return response;
  }

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isProtected && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(redirectUrl);
  }

  if (isAuthRoute && user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  // Admin gating. Emails are configured server-side via ADMIN_EMAILS.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const adminEmails = (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    const email = user?.email?.toLowerCase() ?? "";
    const isAdmin = adminEmails.length > 0 && adminEmails.includes(email);
    if (!user || !isAdmin) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = user ? "/dashboard" : "/login";
      redirectUrl.search = user ? "" : `?next=${encodeURIComponent(pathname)}`;
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets and image optimisation.
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};
